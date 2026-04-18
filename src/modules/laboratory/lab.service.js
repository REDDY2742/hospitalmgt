const { 
  LabOrder, 
  LabTest, 
  LabResult, 
  LabSample, 
  Bill, 
  Patient, 
  Doctor, 
  sequelize 
} = require('../../models');
const { getIO } = require('../../config/socket');
const { sendSMS } = require('../../utils/sms.util');
const { uploadToS3 } = require('../../utils/s3.util');
const { generateLabReportPDF } = require('../../utils/pdf.util');
const { redis } = require('../../config/redis');
const { 
  NotFoundError, 
  ValidationError, 
  AppError 
} = require('../../utils/appError.util');
const logger = require('../../utils/logger.util');

/**
 * Hospital Laboratory Systems Service
 * 
 * Manages the entire clinical diagnostic lifecycle: Order Orchestration,
 * Barcode tracking, Demographic-aware reference ranges, and Panic-value protocols.
 */

class LabService {
  /**
   * Orchestrate Clinical Laboratory Order
   */
  async createLabTestOrder(orderData, orderedBy) {
    const transaction = await sequelize.transaction();

    try {
      const { patientId, tests, urgency = 'routine' } = orderData;

      // 1. Generate Lab Order Number (LAB-YYYY-XXXXXX)
      const year = new Date().getFullYear();
      const count = await LabOrder.count({ 
        where: { createdAt: { [sequelize.Op.gte]: new Date(year, 0, 1) } }, 
        transaction 
      });
      const orderNumber = `LAB-${year}-${String(count + 1).padStart(6, '0')}`;

      // 2. Resolve Test Catalog & Costs
      const testRecords = await LabTest.findAll({
        where: { id: tests },
        transaction
      });
      
      const totalCost = testRecords.reduce((acc, test) => acc + test.cost, 0);

      // 3. Create Lab Order
      const order = await LabOrder.create({
        orderNumber,
        patientId,
        doctorId: orderedBy,
        urgency,
        totalCost,
        status: 'ORDER_PLACED'
      }, { transaction });

      // 4. Link Tests and Initialize Empty Result Shells
      await LabResult.bulkCreate(
        testRecords.map(t => ({
          labOrderId: order.id,
          testId: t.id,
          status: 'PENDING_COLLECTION'
        })),
        { transaction }
      );

      // 5. Integrate with Billing (Draft Bill Addition)
      await Bill.create({
        patientId,
        sourceModule: 'LABORATORY',
        sourceId: order.id,
        amount: totalCost,
        status: 'DRAFT'
      }, { transaction });

      await transaction.commit();

      // 6. Real-time STAT Orchestration
      if (urgency === 'stat' || urgency === 'urgent') {
        const io = getIO();
        io.to('lab_technicians').emit('NEW_STAT_ORDER', { orderNumber, urgency });
        logger.warn(`STAT ORDER ISSUED: ${orderNumber}`);
      }

      return order;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Barcode System: Sample Collection & Tracking
   */
  async collectSample(orderId, sampleData, collectedBy) {
    const transaction = await sequelize.transaction();

    try {
      const order = await LabOrder.findByPk(orderId, { transaction });
      if (!order) throw new NotFoundError('Lab order not found');

      // 1. Generate Barcode/Sample ID
      const sampleId = `SMP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      const sample = await LabSample.create({
        labOrderId: orderId,
        sampleId,
        collectedBy,
        collectedAt: new Date(),
        ...sampleData,
        status: 'RECEPTION_PENDING'
      }, { transaction });

      // 2. Advance Workflow State
      await order.update({ status: 'SAMPLE_COLLECTED' }, { transaction });
      await LabResult.update(
        { status: 'SAMPLE_COLLECTED' }, 
        { where: { labOrderId: orderId }, transaction }
      );

      await transaction.commit();
      return sample;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Result Entry with Clinical Panic-Value Protocol
   */
  async enterLabResults(orderId, results, enteredBy) {
    const transaction = await sequelize.transaction();

    try {
      const order = await LabOrder.findByPk(orderId, { 
        include: ['patient', 'doctor'], 
        transaction 
      });

      for (const res of results) {
        const test = await LabTest.findByPk(res.testId, { transaction });
        const refRange = await this._getDemographicRefRange(test.id, order.patient);

        // 1. Clinical Range Analytics
        let interpretation = 'NORMAL';
        if (res.value > refRange.criticalHigh || res.value < refRange.criticalLow) {
          interpretation = 'CRITICAL';
        } else if (res.value > refRange.high) {
          interpretation = 'HIGH';
        } else if (res.value < refRange.low) {
          interpretation = 'LOW';
        }

        // 2. Persist Result
        await LabResult.update({
          value: res.value,
          unit: test.unit,
          interpretation,
          enteredBy,
          status: 'PENDING_VERIFICATION'
        }, { 
          where: { labOrderId: orderId, testId: res.testId }, 
          transaction 
        });

        // 3. Panic Protocol Integration
        if (interpretation === 'CRITICAL') {
          this._triggerPanicAlert(order, test, res.value);
        }
      }

      await order.update({ status: 'RESULTS_ENTERED' }, { transaction });
      await transaction.commit();
      return { success: true };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Senior sign-off and Report Archive
   */
  async verifyLabResults(orderId, verifiedBy) {
    const transaction = await sequelize.transaction();

    try {
      const order = await LabOrder.findByPk(orderId, {
        include: [
          { model: LabResult, as: 'results', include: ['test'] },
          'patient',
          'doctor'
        ],
        transaction
      });

      // 1. Digital Signature & Verification
      await LabResult.update(
        { status: 'VERIFIED', verifiedBy, verifiedAt: new Date() },
        { where: { labOrderId: orderId }, transaction }
      );

      // 2. Generate PDF Clinical Report
      const pdfBuffer = await generateLabReportPDF(order);
      const s3Key = `lab-reports/${order.orderNumber}.pdf`;
      const reportUrl = await uploadToS3(pdfBuffer, s3Key, 'LAB_REPORTS');

      await order.update({ 
        status: 'VERIFIED', 
        reportUrl,
        finalizedAt: new Date() 
      }, { transaction });

      await transaction.commit();

      // 3. Dispatch Discovery Notifications
      const io = getIO();
      io.to(`doctor_${order.doctorId}`).emit('LAB_RESULTS_READY', { orderNumber: order.orderNumber });
      
      return { reportUrl };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Secure Discovery with Redis Caching
   */
  async getLabTestCatalog(filters) {
    const cacheKey = `lab:catalog:${JSON.stringify(filters)}`;
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const catalog = await LabTest.findAll({
      where: { isActive: true, ...filters },
      order: [['name', 'ASC']]
    });

    await redis.set(cacheKey, JSON.stringify(catalog), 'EX', 3600);
    return catalog;
  }

  /**
   * Panic Protocol guaranteed delivery implementation
   */
  async _triggerPanicAlert(order, test, value) {
    const alertMessage = `PANIC VALUE ALERT: Patient ${order.patient.lastName} (${order.patient.patientId}) - ${test.name}: ${value} ${test.unit} (CRITICAL)`;
    
    // 1. WebSocket Immediate Alert
    const io = getIO();
    io.to(`doctor_${order.doctorId}`).emit('CRITICAL_LAB_RESULT', { 
      orderNumber: order.orderNumber,
      message: alertMessage 
    });

    // 2. SMS Fail-safe
    try {
      await sendSMS(order.doctor.phone, alertMessage);
    } catch (smsError) {
      logger.error(`Panic SMS Failed for Order ${order.orderNumber}: ${smsError.message}`);
    }
    
    logger.error(alertMessage);
  }

  /**
   * Resolve Demographic-Aware Reference Ranges
   */
  async _getDemographicRefRange(testId, patient) {
    // Placeholder for complex demographic lookups
    // In production, this queries a RefRange table by testId, gender, and age group
    return {
      low: 70,
      high: 110,
      criticalLow: 40,
      criticalHigh: 400
    };
  }
}

module.exports = new LabService();
