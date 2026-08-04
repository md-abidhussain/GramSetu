import PDFDocument from 'pdfkit';
import https from 'https';

/**
 * Downloads a remote image URL to a buffer for PDF inclusion
 */
const downloadImageBuffer = (url) => {
  return new Promise((resolve) => {
    if (!url) return resolve(null);
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        console.error(`Failed to fetch image status code: ${res.statusCode}`);
        return resolve(null);
      }
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', (err) => {
        console.error('Error fetching image chunks:', err);
        resolve(null);
      });
    }).on('error', (err) => {
      console.error('Connection error fetching image:', err);
      resolve(null);
    });
  });
};

/**
 * Draws a professional header logo banner
 */
const drawHeader = (doc, titleText, subtitleText) => {
  // Draw top border accent bar
  doc.rect(40, 40, 515, 8).fill('#1e3a8a'); // Brand Dark Blue
  
  doc.fillColor('#1e293b')
     .font('Helvetica-Bold')
     .fontSize(18)
     .text('GRAMSETU AI', 40, 60);

  doc.fontSize(10)
     .font('Helvetica-Bold')
     .fillColor('#475569')
     .text('INTELLIGENT INFRASTRUCTURE MONITORING & AUDIT PLATFORM', 40, 80);

  doc.strokeColor('#cbd5e1')
     .lineWidth(1)
     .moveTo(40, 95)
     .lineTo(555, 95)
     .stroke();

  doc.fillColor('#0f172a')
     .font('Helvetica-Bold')
     .fontSize(13)
     .text(titleText, 40, 110);

  doc.fontSize(9)
     .font('Helvetica')
     .fillColor('#64748b')
     .text(subtitleText, 40, 126);
     
  doc.strokeColor('#cbd5e1')
     .lineWidth(1)
     .moveTo(40, 140)
     .lineTo(555, 140)
     .stroke();
};

/**
 * Draws a section header
 */
const drawSectionHeader = (doc, title, y) => {
  doc.fillColor('#1e3a8a')
     .font('Helvetica-Bold')
     .fontSize(11)
     .text(title.toUpperCase(), 40, y);
     
  doc.strokeColor('#e2e8f0')
     .lineWidth(1)
     .moveTo(40, y + 15)
     .lineTo(555, y + 15)
     .stroke();
};

/**
 * Generates an official PDF report for a project audit
 */
export const generateProjectAuditPDF = async (project, stream) => {
  const doc = new PDFDocument({ size: 'A4', margin: 40 });
  doc.pipe(stream);

  // 1. Header
  drawHeader(
    doc,
    'OFFICIAL PROJECT CONSTRUCTION COMPLIANCE LEDGER',
    `Report generated on: ${new Date().toLocaleString()} | Audit Status: ${project.status}`
  );

  // 2. Project Metadata block
  drawSectionHeader(doc, 'Project Information & Specifications', 160);
  
  let currentY = 190;
  const leftColX = 50;
  const rightColX = 300;

  // Left Column
  doc.font('Helvetica-Bold').fontSize(9).fillColor('#475569').text('Project Title:', leftColX, currentY);
  doc.font('Helvetica').fillColor('#0f172a').text(project.title || 'N/A', leftColX + 80, currentY);

  doc.font('Helvetica-Bold').fillColor('#475569').text('Project ID:', leftColX, currentY + 20);
  doc.font('Helvetica').fillColor('#0f172a').text(project._id.toString(), leftColX + 80, currentY + 20);

  doc.font('Helvetica-Bold').fillColor('#475569').text('Contractor:', leftColX, currentY + 40);
  doc.font('Helvetica').fillColor('#0f172a').text(project.contractor?.name || 'N/A', leftColX + 80, currentY + 40);

  doc.font('Helvetica-Bold').fillColor('#475569').text('Tender Name:', leftColX, currentY + 60);
  doc.font('Helvetica').fillColor('#0f172a').text(project.tender?.title || 'N/A', leftColX + 80, currentY + 60, { width: 160 });

  // Right Column
  doc.font('Helvetica-Bold').fillColor('#475569').text('Coordinates:', rightColX, currentY);
  doc.font('Helvetica').fillColor('#0f172a').text(`Lat: ${project.location?.lat || '0'}, Lng: ${project.location?.lng || '0'}`, rightColX + 90, currentY);

  doc.font('Helvetica-Bold').fillColor('#475569').text('Location Info:', rightColX, currentY + 20);
  doc.font('Helvetica').fillColor('#0f172a').text(project.location?.address || 'N/A', rightColX + 90, currentY + 20, { width: 160 });

  doc.font('Helvetica-Bold').fillColor('#475569').text('Project Health:', rightColX, currentY + 50);
  doc.font('Helvetica-Bold').fillColor(project.healthPercentage < 70 ? '#b91c1c' : '#15803d').text(`${project.healthPercentage || 100}% (${project.projectHealth || 'Healthy'})`, rightColX + 90, currentY + 50);

  // 3. AI Verification block
  drawSectionHeader(doc, 'AI Verification & Auditor Remarks', 280);
  currentY = 310;

  doc.font('Helvetica-Bold').fontSize(9).fillColor('#475569').text('Verification Status:', leftColX, currentY);
  doc.font('Helvetica-Bold').fillColor(project.status === 'Verified' ? '#15803d' : '#b91c1c').text(project.status || 'Pending', leftColX + 110, currentY);

  doc.font('Helvetica-Bold').fillColor('#475569').text('Completion Score:', leftColX, currentY + 20);
  doc.font('Helvetica').fillColor('#0f172a').text(`${project.completionScore || '0'}%`, leftColX + 110, currentY + 20);

  doc.font('Helvetica-Bold').fillColor('#475569').text('Risk Assessment:', leftColX, currentY + 40);
  doc.font('Helvetica-Bold').fillColor(project.riskLevel === 'High' ? '#b91c1c' : project.riskLevel === 'Medium' ? '#b45309' : '#15803d').text(project.riskLevel || 'Low', leftColX + 110, currentY + 40);

  doc.font('Helvetica-Bold').fillColor('#475569').text('Auditor Reasoning & Findings:', leftColX, currentY + 60);
  doc.font('Helvetica').fillColor('#334155').text(project.aiComparisonNotes || 'No findings recorded.', leftColX, currentY + 75, { width: 505 });

  // 4. Side-by-Side Images (Before/After)
  drawSectionHeader(doc, 'Visual Evidence Baseline Check', 440);

  const beforeBuffer = await downloadImageBuffer(project.beforeImageUrl);
  const afterBuffer = await downloadImageBuffer(project.afterImageUrl);

  const imgWidth = 240;
  const imgHeight = 150;

  // Before Image
  if (beforeBuffer) {
    try {
      doc.image(beforeBuffer, 50, 470, { width: imgWidth, height: imgHeight });
      doc.rect(50, 470, imgWidth, imgHeight).strokeColor('#cbd5e1').stroke();
      doc.font('Helvetica-Bold').fontSize(8).fillColor('#475569').text('BASELINE SOURCE (BEFORE CONSTRUCTION)', 50, 625);
    } catch (e) {
      doc.rect(50, 470, imgWidth, imgHeight).fillColor('#f1f5f9').fill();
      doc.font('Helvetica').fontSize(8).fillColor('#64748b').text('Error rendering baseline image', 90, 540);
    }
  } else {
    doc.rect(50, 470, imgWidth, imgHeight).fillColor('#f1f5f9').fill();
    doc.font('Helvetica').fontSize(8).fillColor('#64748b').text('Baseline image not available', 90, 540);
    doc.font('Helvetica-Bold').fontSize(8).fillColor('#475569').text('BASELINE SOURCE (BEFORE CONSTRUCTION)', 50, 625);
  }

  // After Image
  if (afterBuffer) {
    try {
      doc.image(afterBuffer, 305, 470, { width: imgWidth, height: imgHeight });
      doc.rect(305, 470, imgWidth, imgHeight).strokeColor('#cbd5e1').stroke();
      doc.font('Helvetica-Bold').fontSize(8).fillColor('#475569').text('COMPLETED VERIFICATION (AFTER CONSTRUCTION)', 305, 625);
    } catch (e) {
      doc.rect(305, 470, imgWidth, imgHeight).fillColor('#f1f5f9').fill();
      doc.font('Helvetica').fontSize(8).fillColor('#64748b').text('Error rendering inspection image', 345, 540);
    }
  } else {
    doc.rect(305, 470, imgWidth, imgHeight).fillColor('#f1f5f9').fill();
    doc.font('Helvetica').fontSize(8).fillColor('#64748b').text('Inspection image not uploaded', 345, 540);
    doc.font('Helvetica-Bold').fontSize(8).fillColor('#475569').text('COMPLETED VERIFICATION (AFTER CONSTRUCTION)', 305, 625);
  }

  // 5. Signatures and sign off
  doc.strokeColor('#e2e8f0')
     .lineWidth(1)
     .moveTo(40, 710)
     .lineTo(555, 710)
     .stroke();

  doc.font('Helvetica-Oblique').fontSize(8).fillColor('#94a3b8').text('This document is electronically audited and certified using the GramSetu AI Ledger protocol.', 40, 720);
  doc.font('Helvetica-Bold').fontSize(9).fillColor('#475569').text('District Authority Representative', 400, 740);
  doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(380, 780).lineTo(540, 780).stroke();
  doc.font('Helvetica').fontSize(8).fillColor('#94a3b8').text('Authorized Signatory Signature', 415, 785);

  doc.end();
};

/**
 * Generates an official PDF report for a citizen complaint
 */
export const generateCitizenComplaintPDF = async (complaint, stream) => {
  const doc = new PDFDocument({ size: 'A4', margin: 40 });
  doc.pipe(stream);

  // 1. Header
  drawHeader(
    doc,
    'OFFICIAL CITIZEN AUDIT AND DEFECT COMPLIANCE LEDGER',
    `Complaint ID: ${complaint._id} | Current Status: ${complaint.status}`
  );

  // 2. Complaint Metadata block
  drawSectionHeader(doc, 'Grievance & Location Summary', 160);
  
  let currentY = 190;
  const leftColX = 50;
  const rightColX = 300;

  // Title selection
  const complaintTitle = complaint.project?.title || complaint.customProjectTitle || 'Custom Grievance';

  // Left Column
  doc.font('Helvetica-Bold').fontSize(9).fillColor('#475569').text('Complaint Title:', leftColX, currentY);
  doc.font('Helvetica').fillColor('#0f172a').text(complaintTitle, leftColX + 90, currentY, { width: 160 });

  doc.font('Helvetica-Bold').fillColor('#475569').text('Reported Project:', leftColX, currentY + 30);
  doc.font('Helvetica').fillColor('#0f172a').text(complaint.project?.title || 'Custom/Isolated Location', leftColX + 90, currentY + 30, { width: 160 });

  doc.font('Helvetica-Bold').fillColor('#475569').text('Reported Date:', leftColX, currentY + 60);
  doc.font('Helvetica').fillColor('#0f172a').text(new Date(complaint.createdAt).toLocaleDateString(), leftColX + 90, currentY + 60);

  // Right Column
  doc.font('Helvetica-Bold').fillColor('#475569').text('GPS Coordinates:', rightColX, currentY);
  doc.font('Helvetica').fillColor('#0f172a').text(`Lat: ${complaint.gps?.lat || '0'}, Lng: ${complaint.gps?.lng || '0'}`, rightColX + 90, currentY);

  doc.font('Helvetica-Bold').fillColor('#475569').text('Site Address:', rightColX, currentY + 20);
  doc.font('Helvetica').fillColor('#0f172a').text(complaint.project?.location?.address || 'Isolated/Custom Location', rightColX + 90, currentY + 20, { width: 160 });

  // 3. AI Quantification block
  drawSectionHeader(doc, 'AI defect analysis metrics', 270);
  currentY = 300;

  doc.font('Helvetica-Bold').fontSize(9).fillColor('#475569').text('AI Severity Check:', leftColX, currentY);
  doc.font('Helvetica-Bold').fillColor(complaint.severity === 'High' ? '#b91c1c' : '#b45309').text(`${complaint.severity || 'Low'} Severity`, leftColX + 110, currentY);

  doc.font('Helvetica-Bold').fillColor('#475569').text('AI Confidence:', leftColX, currentY + 20);
  doc.font('Helvetica').fillColor('#0f172a').text(`${complaint.matchScore || '90'}%`, leftColX + 110, currentY + 20);

  doc.font('Helvetica-Bold').fillColor('#475569').text('AI Defect Specs:', leftColX, currentY + 40);
  
  // Aggregate YOLO segmentation defects
  const defects = complaint.segmentation?.defects || [];
  const hasDefects = defects.length > 0;
  const totalArea = defects.reduce((sum, d) => sum + (d.areaCm2 || 0), 0);
  const maxWidth = defects.reduce((max, d) => Math.max(max, d.widthCm || 0), 0);
  const maxHeight = defects.reduce((max, d) => Math.max(max, d.heightCm || 0), 0);
  const maxDiameter = defects.reduce((max, d) => Math.max(max, d.equivalentDiameterCm || 0), 0);

  doc.font('Helvetica').fillColor('#0f172a').text(
    `Equivalent Diameter: ${hasDefects ? maxDiameter.toFixed(1) : 'N/A'} cm\n` +
    `Defect Area: ${hasDefects ? totalArea.toFixed(1) : 'N/A'} cm²\n` +
    `Defect Dimensions: ${hasDefects ? `${maxWidth.toFixed(1)} x ${maxHeight.toFixed(1)}` : 'N/A'} cm`,
    leftColX + 110, currentY + 40
  );

  doc.font('Helvetica-Bold').fillColor('#475569').text('Auditor Reasoning:', leftColX, currentY + 95);
  doc.font('Helvetica').fillColor('#334155').text(complaint.aiReport || 'No details recorded.', leftColX, currentY + 110, { width: 505 });

  // 4. Evidence Images (Citizen Grievance & Inspector Verification)
  drawSectionHeader(doc, 'Visual Audit Trial Evidence', 450);

  const grievanceBuffer = await downloadImageBuffer(complaint.citizenImageUrl);
  const verificationBuffer = await downloadImageBuffer(complaint.inspectorAfterImageUrl);

  const imgWidth = 240;
  const imgHeight = 150;

  // Citizen Complaint Image
  if (grievanceBuffer) {
    try {
      doc.image(grievanceBuffer, 50, 480, { width: imgWidth, height: imgHeight });
      doc.rect(50, 480, imgWidth, imgHeight).strokeColor('#cbd5e1').stroke();
      doc.font('Helvetica-Bold').fontSize(8).fillColor('#475569').text('CITIZEN REPORTED EVIDENCE (BEFORE RESOLUTION)', 50, 635);
    } catch (e) {
      doc.rect(50, 480, imgWidth, imgHeight).fillColor('#f1f5f9').fill();
      doc.font('Helvetica').fontSize(8).fillColor('#64748b').text('Error rendering grievance image', 90, 550);
    }
  } else {
    doc.rect(50, 480, imgWidth, imgHeight).fillColor('#f1f5f9').fill();
    doc.font('Helvetica').fontSize(8).fillColor('#64748b').text('Grievance image not available', 90, 550);
    doc.font('Helvetica-Bold').fontSize(8).fillColor('#475569').text('CITIZEN REPORTED EVIDENCE (BEFORE RESOLUTION)', 50, 635);
  }

  // Verification Image
  if (verificationBuffer) {
    try {
      doc.image(verificationBuffer, 305, 480, { width: imgWidth, height: imgHeight });
      doc.rect(305, 480, imgWidth, imgHeight).strokeColor('#cbd5e1').stroke();
      doc.font('Helvetica-Bold').fontSize(8).fillColor('#475569').text('INSPECTOR UPLOADED EVIDENCE (AFTER RESOLUTION)', 305, 635);
    } catch (e) {
      doc.rect(305, 480, imgWidth, imgHeight).fillColor('#f1f5f9').fill();
      doc.font('Helvetica').fontSize(8).fillColor('#64748b').text('Error rendering verification image', 345, 550);
    }
  } else {
    doc.rect(305, 480, imgWidth, imgHeight).fillColor('#f1f5f9').fill();
    doc.font('Helvetica').fontSize(8).fillColor('#64748b').text('Verification image not uploaded yet', 345, 550);
    doc.font('Helvetica-Bold').fontSize(8).fillColor('#475569').text('INSPECTOR UPLOADED EVIDENCE (AFTER RESOLUTION)', 305, 635);
  }

  // 5. Signatures and sign off
  doc.strokeColor('#e2e8f0')
     .lineWidth(1)
     .moveTo(40, 710)
     .lineTo(555, 710)
     .stroke();

  doc.font('Helvetica-Oblique').fontSize(8).fillColor('#94a3b8').text('This document is electronically audited and certified using the GramSetu AI Ledger protocol.', 40, 720);
  doc.font('Helvetica-Bold').fontSize(9).fillColor('#475569').text('Assigned Inspector Signature', 400, 740);
  doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(380, 780).lineTo(540, 780).stroke();
  doc.font('Helvetica').fontSize(8).fillColor('#94a3b8').text(complaint.assignedOfficer?.name || 'Authorized Inspector Signature', 405, 785);

  doc.end();
};
