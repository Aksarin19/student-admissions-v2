/**
 * ระบบรับสมัครเรียนออนไลน์ (Google Apps Script Edition)
 * เชื่อมต่อกับ Google Sheets (StudentPortal_DB) และ Google Drive
 * พัฒนาต่อยอดจาก ใบงานที่ 1 Web App & Google Apps Script
 */

const CONFIG = {
  SPREADSHEET_ID: SpreadsheetApp.getActiveSpreadsheet().getId(),
  SHEET_NAME: 'Students',
  DOC_TEMPLATE_ID: 'YOUR_GOOGLE_DOC_TEMPLATE_ID_HERE', // ID ของไฟล์ Google Docs ต้นแบบใบสมัคร (แทน AutoCrat)
  PDF_FOLDER_ID: 'YOUR_DRIVE_FOLDER_ID_FOR_PDF',        // ID ของโฟลเดอร์ Google Drive สำหรับเก็บ PDF
  LINE_NOTIFY_TOKEN: 'YOUR_LINE_NOTIFY_TOKEN_HERE'     // Token สำหรับแจ้งเตือนผ่าน LINE Notify
};

/**
 * Web App Entry Point: ให้บริการหน้าเว็บหรือรับข้อมูลผ่าน API
 */
function doGet(e) {
  // หากต้องการให้บริการเป็น Web App ฝัง HTML
  return HtmlService.createHtmlOutput('<h3>ระบบรับสมัครเรียนออนไลน์ Web App API พร้อมทำงาน</h3>')
    .setTitle('ระบบรับสมัครเรียนออนไลน์');
}

/**
 * รับข้อมูลฟอร์มส่งเข้ามาแบบ POST (จาก Google Form หรือ Web App Front-end)
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const result = registerApplicant(data);
    return ContentService.createTextOutput(JSON.stringify({ status: 'success', data: result }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * บันทึกข้อมูลผู้สมัครลง Google Sheets
 */
function registerApplicant(data) {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheet = ss.getSheetByName(CONFIG.SHEET_NAME) || ss.insertSheet(CONFIG.SHEET_NAME);
  
  // ตรวจสอบและสร้างแถวหัวตาราง (Headers) หากเป็นชีตว่าง
  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      'Timestamp', 'Application_ID', 'National_ID', 'Prefix', 'First_Name', 'Last_Name',
      'Gender', 'BirthDate', 'Phone', 'Email', 'Level', 'Major_Code', 'Major_Name',
      'Previous_School', 'GPAX', 'Address', 'Guardian_Name', 'Guardian_Phone',
      'Status', 'Student_ID', 'PDF_Url', 'Reviewer_Note'
    ]);
  }

  // สร้างรหัสใบสมัคร
  const year = '2569';
  const rowCount = sheet.getLastRow();
  const appId = 'APP-' + year + '-' + Utilities.formatString('%04d', rowCount);
  const timestamp = new Date();

  // สร้างไฟล์ PDF ใบสมัครอัตโนมัติ (แทนการใช้ส่วนขยาย AutoCrat)
  let pdfUrl = '';
  try {
    pdfUrl = createApplicationDocAndPdf(data, appId);
  } catch (pdfErr) {
    Logger.log('PDF Generation skipped or error: ' + pdfErr.message);
  }

  // บันทึกลงแถวใหม่
  sheet.appendRow([
    timestamp,
    appId,
    "'" + data.nationalId, // ใส่ single quote ป้องกันเลข 0 หายใน Excel/Sheets
    data.prefix,
    data.firstName,
    data.lastName,
    data.gender,
    data.birthDate,
    "'" + data.phone,
    data.email || '',
    data.level,
    data.majorCode || '',
    data.major,
    data.previousSchool,
    data.gpax,
    data.address,
    data.guardianName,
    "'" + data.guardianPhone,
    'รอตรวจสอบ',
    '', // Student ID (ออกตอนมอบตัว)
    pdfUrl,
    ''  // Reviewer Note
  ]);

  // ส่งแจ้งเตือนผ่าน LINE Notify ทันที
  const notifyMessage = `\n📢 มีผู้สมัครเรียนใหม่!\nรหัส: ${appId}\nชื่อ-สกุล: ${data.prefix}${data.firstName} ${data.lastName}\nระดับ: ${data.level} สาขา: ${data.major}\nรร.เดิม: ${data.previousSchool} (GPA: ${data.gpax})`;
  sendLineNotify(notifyMessage);

  return { appId: appId, pdfUrl: pdfUrl, status: 'รอตรวจสอบ' };
}

/**
 * สร้างไฟล์เอกสารและแปลงเป็น PDF อัตโนมัติ (Automated Document Merging - AutoCrat Alternative)
 */
function createApplicationDocAndPdf(data, appId) {
  if (!CONFIG.DOC_TEMPLATE_ID || CONFIG.DOC_TEMPLATE_ID.startsWith('YOUR_')) {
    return 'กรุณากำหนด CONFIG.DOC_TEMPLATE_ID ใน Code.gs';
  }

  const templateFile = DriveApp.getFileById(CONFIG.DOC_TEMPLATE_ID);
  const targetFolder = DriveApp.getFolderById(CONFIG.PDF_FOLDER_ID);

  // สำเนา Template เพื่อใส่ข้อมูล
  const copyDoc = templateFile.makeCopy(`ใบสมัคร_${appId}_${data.firstName}`, targetFolder);
  const doc = DocumentApp.openById(copyDoc.getId());
  const body = doc.getBody();

  // แทนที่ตัวแปร Tag <<Field_Name>> เหมือน AutoCrat
  body.replaceText('<<APP_ID>>', appId);
  body.replaceText('<<NATIONAL_ID>>', data.nationalId);
  body.replaceText('<<FULL_NAME>>', `${data.prefix}${data.firstName} ${data.lastName}`);
  body.replaceText('<<LEVEL>>', data.level);
  body.replaceText('<<MAJOR>>', data.major);
  body.replaceText('<<PREV_SCHOOL>>', data.previousSchool);
  body.replaceText('<<GPAX>>', data.gpax);
  body.replaceText('<<PHONE>>', data.phone);
  body.replaceText('<<GUARDIAN>>', data.guardianName);
  body.replaceText('<<GUARDIAN_PHONE>>', data.guardianPhone);
  body.replaceText('<<ADDRESS>>', data.address);
  body.replaceText('<<DATE>>', Utilities.formatDate(new Date(), 'Asia/Bangkok', 'dd/MM/yyyy'));

  doc.saveAndClose();

  // แปลงเป็นไฟล์ PDF
  const pdfBlob = copyDoc.getAs('application/pdf');
  pdfBlob.setName(`ใบสมัคร_${appId}_${data.firstName}.pdf`);
  const pdfFile = targetFolder.createFile(pdfBlob);

  // กำหนดสิทธิ์ให้ผู้สมัครสามารถดาวน์โหลดได้
  pdfFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  // ลบไฟล์ Doc ชั่วคราวออก เหลือเฉพาะ PDF
  copyDoc.setTrashed(true);

  return pdfFile.getUrl();
}

/**
 * ส่งข้อความแจ้งเตือนผ่าน LINE Notify API
 */
function sendLineNotify(message) {
  if (!CONFIG.LINE_NOTIFY_TOKEN || CONFIG.LINE_NOTIFY_TOKEN.startsWith('YOUR_')) {
    Logger.log('LINE Notify Token not set. Message: ' + message);
    return;
  }

  const url = 'https://notify-api.line.me/api/notify';
  const options = {
    method: 'post',
    headers: { 'Authorization': 'Bearer ' + CONFIG.LINE_NOTIFY_TOKEN },
    payload: { message: message },
    muteHttpExceptions: true
  };

  try {
    UrlFetchApp.fetch(url, options);
  } catch (err) {
    Logger.log('Error sending LINE Notify: ' + err.toString());
  }
}
