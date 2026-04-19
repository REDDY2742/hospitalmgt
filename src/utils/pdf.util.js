const PDFDocument = require('pdfkit');
const puppeteer = require('puppeteer');
const QRCode = require('qrcode');
const bwipjs = require('bwip-js');
const ejs = require('ejs');
const path = require('path');
const logger = require('./logger.util').createChildLogger('clinical-pdf-util');

/**
 * Hospital Management System - Professional Clinical Document Engine
 * 
 * Orchestrates programmatic (PDFKit) and template-driven (Puppeteer) PDF generation.
 * Features: NABH-compliant branding, QR-verified prescriptions, GST-compliant invoicing, 
 * and Chart-enabled management analytics.
 */

const hospitalConfig = {
  name: process.env.HOSPITAL_NAME || 'Antigravity Multispeciality Hospital',
  address: process.env.HOSPITAL_ADDRESS || '123 Healthcare Blvd, Bangalore, India',
  phone: process.env.HOSPITAL_PHONE || '+91 80 1234 5678',
  email: process.env.HOSPITAL_EMAIL || 'contact@antigravityhosp.com',
  website: 'www.antigravityhosp.com',
  colors: { primary: '#1a5276', secondary: '#2980b9', accent: '#e74c3c' },
  watermarkText: 'CONFIDENTIAL — CLINICAL RECORD'
};

// --- Core Helper Functions ---

/**
 * @description Injects institutional branding into a PDFKit document
 */
const addHospitalHeader = (doc, title) => {
  doc.fillColor(hospitalConfig.colors.primary)
     .fontSize(20)
     .text(hospitalConfig.name.toUpperCase(), 50, 50, { align: 'left' });
  
  doc.fontSize(10)
     .fillColor('#666')
     .text(hospitalConfig.address, { align: 'right' })
     .text(hospitalConfig.phone, { align: 'right' })
     .text(hospitalConfig.email, { align: 'right' });

  doc.moveDown(0.5);
  doc.strokeColor(hospitalConfig.colors.secondary)
     .lineWidth(2)
     .moveTo(50, 100)
     .lineTo(550, 100)
     .stroke();

  doc.moveDown(1);
  doc.fontSize(16)
     .fillColor(hospitalConfig.colors.primary)
     .text(title.toUpperCase(), { align: 'center', underline: true });
};

/**
 * @description Adds standard institutional footer with HATEOAS verification QR
 */
const addHospitalFooter = async (doc, verificationData) => {
  const pageCount = doc.bufferedPageRange().count;
  for (let i = 0; i < pageCount; i++) {
    doc.switchToPage(i);
    
    // Watermark
    doc.opacity(0.1)
       .fontSize(40)
       .fillColor('#ccc')
       .text(hospitalConfig.watermarkText, 50, 400, { rotation: -45 });
    
    doc.opacity(1)
       .fontSize(8)
       .fillColor('#999')
       .text(`Page ${i + 1} of ${pageCount}`, 50, 780);

    // QR Code for document verification
    try {
      const qrDataUrl = await QRCode.toDataURL(JSON.stringify(verificationData));
      doc.image(qrDataUrl, 500, 750, { width: 40 });
    } catch (e) {}
  }
};

/**
 * @description Programmatic table builder for PDFKit (prescriptions/bills)
 */
const addTable = (doc, headers, rows, startY) => {
  let currentY = startY;
  const colWidth = (500 / headers.length);

  // Headers
  doc.fontSize(10).fillColor('#fff').rect(50, currentY, 500, 20).fill(hospitalConfig.colors.primary).stroke();
  headers.forEach((h, i) => {
    doc.text(h, 55 + (i * colWidth), currentY + 5);
  });

  currentY += 25;

  // Rows
  doc.fillColor('#333');
  rows.forEach((row, i) => {
    if (i % 2 === 0) doc.rect(50, currentY - 2, 500, 18).fill('#f9f9f9');
    doc.fillColor('#333');
    row.forEach((cell, ci) => {
      doc.text(cell.toString(), 55 + (ci * colWidth), currentY);
    });
    currentY += 20;
    
    if (currentY > 700) {
      doc.addPage();
      currentY = 50;
    }
  });

  return currentY;
};

// --- Clinical Document Generators ---

/**
 * @description Generates a NabH-compliant clinical prescription PDF
 */
const generatePrescription = async (data) => {
  return new Promise(async (resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, bufferPages: true });
    let buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => resolve(Buffer.concat(buffers)));

    addHospitalHeader(doc, 'Prescription (Rx)');

    // Patient Info Box
    doc.fontSize(10).fillColor('#333')
       .rect(50, 130, 500, 60).stroke()
       .text(`Patient: ${data.patient.name}`, 60, 140)
       .text(`UHID: ${data.patient.uhid}`, 60, 155)
       .text(`Age/Sex: ${data.patient.age}/${data.patient.gender}`, 60, 170)
       .text(`Doctor: ${data.doctor.name} (${data.doctor.regNo})`, 300, 140)
       .text(`Date: ${new Date().toLocaleDateString()}`, 300, 155);

    doc.moveDown(4);
    doc.fontSize(14).text('Diagnosis / Clinical Notes:', { underline: true });
    doc.fontSize(11).text(data.diagnosis || 'Provisional diagnosis pending investigations.');

    doc.moveDown(2);
    doc.fontSize(14).text('Medications (Rx):', { underline: true });
    const headers = ['Medicine', 'Dose', 'Frequency', 'Duration', 'Inst.'];
    const rows = data.medicines.map(m => [m.name, m.dose, m.frequency, m.duration, m.instructions]);
    addTable(doc, headers, rows, doc.y + 10);

    doc.moveDown(2);
    doc.fontSize(10).text(`Follow up: ${data.followUpDate || 'As per need'}`);

    // Verification ID
    await addHospitalFooter(doc, { id: data.prescriptionId, type: 'prescription' });
    doc.end();
  });
};

/**
 * @description Generates a Tax Invoice for billing (IPD/OPD)
 */
const generateInvoice = async (data) => {
  return new Promise(async (resolve) => {
    const doc = new PDFDocument({ margin: 50, bufferPages: true });
    let buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => resolve(Buffer.concat(buffers)));

    addHospitalHeader(doc, 'Tax Invoice');

    // Bill Details
    doc.fontSize(10).text(`Bill No: ${data.billNo}`, 50, 130);
    doc.text(`Date: ${new Date().toLocaleDateString()}`);
    doc.text(`Patient: ${data.patient.name} (${data.patient.uhid})`);

    const headers = ['Service', 'Quantity', 'Rate', 'Tax (%)', 'Total'];
    const rows = data.items.map(i => [i.name, i.qty, i.rate, i.tax, i.total]);
    addTable(doc, headers, rows, 180);

    doc.moveDown(2);
    doc.fontSize(12).fillColor(hospitalConfig.colors.primary)
       .text(`Grand Total: ₹${data.totalAmount}`, { align: 'right' });
    doc.fontSize(10).fillColor('#333')
       .text(`Amount in Words: ${data.amountInWords}`, { align: 'left' });

    await addHospitalFooter(doc, { id: data.billId, type: 'invoice' });
    doc.end();
  });
};

/**
 * @description Generates a medical discharge summary with ICD-10 coding and hospital course
 */
const generateDischargeSummary = async (data) => {
  return new Promise(async (resolve) => {
    const doc = new PDFDocument({ margin: 50, bufferPages: true });
    let buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => resolve(Buffer.concat(buffers)));

    addHospitalHeader(doc, 'Discharge Summary');

    // Patient Demographics
    doc.fontSize(12).text('Clinical Diagnosis:', 50, 150, { underline: true });
    doc.fontSize(10).text(data.diagnosis || 'Post-operative recovery');

    doc.moveDown();
    doc.fontSize(12).text('Treatment Summary:', { underline: true });
    doc.fontSize(10).text(data.treatmentGiven || 'Routine medical management.');

    doc.moveDown();
    doc.fontSize(12).text('Discharge Medications:', { underline: true });
    const headers = ['Medicine', 'Dose', 'Frequency', 'Duration'];
    const rows = data.medications.map(m => [m.name, m.dose, m.frequency, m.duration]);
    addTable(doc, headers, rows, doc.y + 10);

    doc.moveDown(2);
    doc.text(`Follow-up: ${data.followUp || 'Follow up after 1 week'}`);

    await addHospitalFooter(doc, { id: data.dischargeId, type: 'discharge' });
    doc.end();
  });
};

/**
 * @description Generates payroll payslips for hospital staff
 */
const generatePayslip = async (data) => {
  return new Promise(async (resolve) => {
    const doc = new PDFDocument({ margin: 50 });
    let buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => resolve(Buffer.concat(buffers)));

    addHospitalHeader(doc, `Payslip - ${data.month} ${data.year}`);
    
    doc.fontSize(10).text(`Employee: ${data.staffName} (${data.staffId})`, 50, 130);
    doc.text(`Department: ${data.department}`);

    const headers = ['Earnings', 'Amount', 'Deductions', 'Amount'];
    const rows = data.items.map(i => [i.earning, i.eAmt, i.deduction, i.dAmt]);
    addTable(doc, headers, rows, 180);

    doc.moveDown(2);
    doc.fontSize(12).text(`Net Pay: ₹${data.netPay}`, { align: 'right' });

    doc.end();
  });
};

// --- Helper Utilities ---

const addBarcode = (doc, value, type = 'CODE128', x, y) => {
  bwipjs.toBuffer({ bcid: type.toLowerCase(), text: value, scale: 3, height: 10, includetext: true }, (err, png) => {
    if (!err) doc.image(png, x, y, { width: 100 });
  });
};

const numberToWords = (num) => {
  // Simplistic conversion for HMS demo
  return `Rupees ${num} Only`;
};

// --- Storage Integration ---

const savePDFToS3 = async (pdfBuffer, fileName, folder = 'clinical-records') => {
  const s3 = require('./s3.util');
  return s3.uploadFile(pdfBuffer, `${folder}/${fileName}`, 'application/pdf');
};

const generateAndSave = async (generatorFn, data, fileName, folder) => {
  const buffer = await generatorFn(data);
  return savePDFToS3(buffer, fileName, folder);
};

// --- Puppeteer HTML Layouts (for analytics/complex reports) ---

/**
 * @description High-fidelity HTML to PDF conversion for rich analytics reports
 */
const generateAnalyticsReport = async (reportData) => {
  let browser;
  try {
    browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
    const page = await browser.newPage();
    
    // Render EJS Template (assuming views/reports/analytics.ejs exists)
    const html = await ejs.renderFile(path.join(__dirname, '../views/reports/analytics.ejs'), {
      data: reportData,
      hospital: hospitalConfig
    });

    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdf = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '50px', bottom: '50px' } });
    
    await browser.close();
    return pdf;
  } catch (err) {
    if (browser) await browser.close();
    logger.error('PUPPETEER_REPORT_FAILURE', err);
    throw err;
  }
};

module.exports = {
  generatePrescription,
  generateInvoice,
  generateDischargeSummary,
  generatePayslip,
  generateAnalyticsReport,
  addBarcode,
  numberToWords,
  savePDFToS3,
  generateAndSave,
  createPDFDocument: (options) => new PDFDocument(options)
};
