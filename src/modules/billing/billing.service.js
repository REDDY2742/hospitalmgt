const { 
  Bill, 
  BillItem, 
  Payment, 
  Refund, 
  Patient, 
  InsurancePolicy, 
  Admission, 
  sequelize 
} = require('../../models');
const Decimal = require('decimal.js');
const { uploadToS3 } = require('../../utils/s3.util');
const { generateBillPDF, generateReceiptPDF } = require('../../utils/pdf.util');
const { sendBillEmail, sendPaymentReceipt } = require('../../utils/email.util');
const { 
  NotFoundError, 
  ValidationError, 
  ConflictError, 
  AppError 
} = require('../../utils/appError.util');
const logger = require('../../utils/logger.util');

/**
 * Hospital Billing & Financial Operations Service
 * 
 * Manages the high-fidelity financial lifecycle: Itemized Consolidation,
 * GST/Tax Compliance, Insurance Claims, and Secure Payment Processing.
 */

class BillingService {
  /**
   * Consolidate and Generate Draft Bill
   */
  async generateBill(patientId, admissionId, billData, generatedBy) {
    const transaction = await sequelize.transaction();

    try {
      const { items, discountCode, discountAmount = 0 } = billData;

      // 1. Generate Bill Reference (BILL-YYYY-MM-XXXXXX)
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const count = await Bill.count({ 
        where: { 
          createdAt: { 
            [sequelize.Op.between]: [new Date(year, date.getMonth(), 1), new Date(year, date.getMonth() + 1, 0)] 
          } 
        }, 
        transaction 
      });
      const billNumber = `BILL-${year}-${month}-${String(count + 1).padStart(6, '0')}`;

      // 2. Financial Calculations using decimal.js (Paise format)
      let subtotal = new Decimal(0);
      let totalTax = new Decimal(0);
      const lineItems = items.map(item => {
        const unitPrice = new Decimal(item.unitPrice); // in paise
        const qty = new Decimal(item.quantity);
        const itemSubtotal = unitPrice.mul(qty);
        
        // GST Logic (Assume 5%, 12%, 18% based on slab)
        const taxRate = new Decimal(item.taxRate || 0); // e.g., 0.18 for 18%
        const taxAmount = itemSubtotal.mul(taxRate);
        
        subtotal = subtotal.add(itemSubtotal);
        totalTax = totalTax.add(taxAmount);

        return {
          ...item,
          unitPrice: unitPrice.toNumber(),
          taxAmount: taxAmount.toNumber(),
          totalAmount: itemSubtotal.add(taxAmount).toNumber()
        };
      });

      const discount = new Decimal(discountAmount);
      const netAmount = subtotal.add(totalTax).sub(discount);

      // 3. Create Bill Record
      const bill = await Bill.create({
        billNumber,
        patientId,
        admissionId,
        subtotal: subtotal.toNumber(),
        taxAmount: totalTax.toNumber(),
        discountAmount: discount.toNumber(),
        totalAmount: netAmount.toNumber(),
        status: 'DRAFT',
        generatedBy
      }, { transaction });

      // 4. Create Line Items
      await BillItem.bulkCreate(
        lineItems.map(li => ({ ...li, billId: bill.id })),
        { transaction }
      );

      await transaction.commit();
      return { bill, items: lineItems };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Finalize Bill: Lock and Distribute Invoice
   */
  async finalizeBill(billId, finalizedBy) {
    const transaction = await sequelize.transaction();

    try {
      const bill = await Bill.findByPk(billId, {
        include: ['items', 'patient'],
        transaction
      });

      if (!bill || bill.status !== 'DRAFT') {
        throw new ValidationError('Bill must be in DRAFT status to finalize');
      }

      // 1. Generate Invoice PDF
      const pdfBuffer = await generateBillPDF(bill);
      const s3Key = `invoices/${bill.billNumber}.pdf`;
      const pdfUrl = await uploadToS3(pdfBuffer, s3Key, 'INVOICES');

      // 2. Update Status and Lock
      await bill.update({
        status: 'PENDING_PAYMENT',
        invoiceUrl: pdfUrl,
        finalizedAt: new Date(),
        finalizedBy
      }, { transaction });

      await transaction.commit();

      // 3. Dispatch Email
      sendBillEmail(bill.patient.email, { 
        billNumber: bill.billNumber, 
        amount: (bill.totalAmount / 100).toFixed(2), 
        pdfUrl 
      });

      return bill;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Process Secure Payment via Multiple Gateways
   */
  async processPayment(billId, paymentData, processedBy) {
    const transaction = await sequelize.transaction();

    try {
      const bill = await Bill.findByPk(billId, { transaction });
      if (!bill || bill.status === 'PAID') {
        throw new ValidationError('Invalid bill or already paid');
      }

      const { mode, amount, transactionId } = paymentData;
      const paymentAmount = new Decimal(amount); // in paise

      // 1. Transactional Integrity for Payment Gateway Success
      // (Gateway call would happen here outside of DB transaction if async)

      const payment = await Payment.create({
        billId,
        mode,
        amount: paymentAmount.toNumber(),
        transactionId,
        status: 'SUCCESSFUL',
        processedBy,
        timestamp: new Date()
      }, { transaction });

      // 2. Update Bill Balance
      const currentPaid = new Decimal(bill.paidAmount || 0);
      const totalPaid = currentPaid.add(paymentAmount);
      
      let newStatus = 'PARTIALLY_PAID';
      if (totalPaid.gte(bill.totalAmount)) {
        newStatus = 'PAID';
      }

      await bill.update({
        paidAmount: totalPaid.toNumber(),
        status: newStatus
      }, { transaction });

      // 3. Generate Receipt
      const receiptBuffer = await generateReceiptPDF(payment, bill);
      const s3Key = `receipts/RCP-${payment.id}.pdf`;
      const receiptUrl = await uploadToS3(receiptBuffer, s3Key, 'RECEIPTS');
      
      await payment.update({ receiptUrl }, { transaction });

      await transaction.commit();

      // 4. Notifications
      sendPaymentReceipt(bill.patient.email, { amount: (amount / 100).toFixed(2), receiptUrl });

      return { payment, billStatus: newStatus };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Analytics: Total Outstanding Revenue
   */
  async getOutstandingBills(filters, pagination) {
    const { page = 1, limit = 10 } = pagination;
    const offset = (page - 1) * limit;

    const where = {
      status: { [sequelize.Op.in]: ['PENDING_PAYMENT', 'PARTIALLY_PAID'] }
    };

    if (filters.patientId) where.patientId = filters.patientId;

    const { rows, count } = await Bill.findAndCountAll({
      where,
      limit,
      offset,
      order: [['createdAt', 'ASC']],
      include: ['patient']
    });

    const totalOutstanding = await Bill.sum(sequelize.literal('totalAmount - paidAmount'), {
      where
    });

    return {
      bills: rows,
      total: count,
      outstandingPaise: totalOutstanding || 0,
      page
    };
  }

  /**
   * Financial Audit Control: Daily Cash Report
   */
  async generateDailyCashReport(dateStr) {
    const date = new Date(dateStr);
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));

    const report = await Payment.findAll({
      where: {
        timestamp: { [sequelize.Op.between]: [startOfDay, endOfDay] },
        status: 'SUCCESSFUL'
      },
      attributes: [
        'mode',
        [sequelize.fn('SUM', sequelize.col('amount')), 'totalAmount'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['mode'],
      raw: true
    });

    const totalCollections = report.reduce((acc, r) => acc.add(new Decimal(r.totalAmount)), new Decimal(0));

    return {
      date: dateStr,
      breakdown: report,
      totalPaise: totalCollections.toNumber(),
      formattedTotal: (totalCollections.toNumber() / 100).toFixed(2)
    };
  }
}

module.exports = new BillingService();
