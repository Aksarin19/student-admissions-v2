const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const XLSX = require('xlsx');

const app = express();
const PORT = process.env.PORT || 3000;

// Path definitions
const DB_PATH = path.join(__dirname, 'data', 'database.json');
const UPLOAD_DIR = path.join(__dirname, 'uploads');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(UPLOAD_DIR));

// Database Helper
function readDB() {
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading database:', err);
    return { settings: {}, majors: {}, applicants: [], notifications: [] };
  }
}

function writeDB(data) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error writing database:', err);
    return false;
  }
}

// Thai National ID Checksum Algorithm (MOD 11)
function isValidThaiID(id) {
  if (!id || typeof id !== 'string') return false;
  const cleanId = id.replace(/\D/g, '');
  if (cleanId.length !== 13) return false;
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleanId.charAt(i), 10) * (13 - i);
  }
  const checkDigit = (11 - (sum % 11)) % 10;
  return checkDigit === parseInt(cleanId.charAt(12), 10);
}

// Phone validation (10 digits starting with 0)
function isValidPhone(phone) {
  if (!phone) return false;
  const cleanPhone = phone.replace(/\D/g, '');
  return cleanPhone.length === 10 && cleanPhone.startsWith('0');
}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOAD_DIR);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.pdf'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('ประเภทไฟล์ไม่ถูกต้อง! อนุญาตเฉพาะไฟล์ JPG, PNG และ PDF เท่านั้น'));
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: fileFilter
});

const uploadFields = upload.fields([
  { name: 'photo', maxCount: 1 },
  { name: 'idCardCopy', maxCount: 1 },
  { name: 'houseRegCopy', maxCount: 1 },
  { name: 'transcriptCopy', maxCount: 1 }
]);

// Send Notification (Simulated + Optional LINE Notify integration)
async function sendNotification({ recipient, type, applicantId, title, message }) {
  const db = readDB();
  const notif = {
    id: 'NOTIF-' + Date.now(),
    recipient: recipient || 'admin',
    type: type || 'general',
    applicantId: applicantId || null,
    title,
    message,
    timestamp: new Date().toISOString(),
    status: 'sent'
  };

  db.notifications = db.notifications || [];
  db.notifications.unshift(notif);
  if (db.notifications.length > 50) db.notifications = db.notifications.slice(0, 50);
  writeDB(db);

  // If LINE Notify Token is configured
  if (db.settings && db.settings.lineNotifyToken && db.settings.lineNotificationEnabled) {
    try {
      const fetch = (await import('node-fetch')).default;
      await fetch('https://notify-api.line.me/api/notify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Bearer ${db.settings.lineNotifyToken}`
        },
        body: new URLSearchParams({ message: `\n[${title}]\n${message}` })
      });
    } catch (err) {
      console.log('LINE Notify error (offline/simulated):', err.message);
    }
  }

  return notif;
}

// ----------------- API ROUTES -----------------

// 1. System Config & Majors
app.get('/api/config', (req, res) => {
  const db = readDB();
  res.json({
    settings: db.settings,
    majors: db.majors,
    statusOptions: ['รอตรวจสอบ', 'เอกสารไม่ครบ', 'ผ่านการคัดเลือก', 'มอบตัวแล้ว', 'สละสิทธิ์']
  });
});

// Update Settings (e.g. Line token)
app.post('/api/config', (req, res) => {
  const db = readDB();
  db.settings = { ...db.settings, ...req.body };
  writeDB(db);
  res.json({ success: true, settings: db.settings });
});

// 2. List Applicants (with search & filters)
app.get('/api/applicants', (req, res) => {
  const db = readDB();
  const { year, level, major, status, search } = req.query;

  let results = db.applicants || [];

  if (year) {
    results = results.filter(a => a.academicYear === year);
  }
  if (level) {
    results = results.filter(a => a.level === level);
  }
  if (major) {
    results = results.filter(a => a.major === major || a.majorCode === major);
  }
  if (status) {
    results = results.filter(a => a.status === status);
  }
  if (search) {
    const s = search.trim().toLowerCase();
    results = results.filter(a =>
      (a.nationalId && a.nationalId.includes(s)) ||
      (a.firstName && a.firstName.toLowerCase().includes(s)) ||
      (a.lastName && a.lastName.toLowerCase().includes(s)) ||
      (a.id && a.id.toLowerCase().includes(s)) ||
      (a.studentId && a.studentId.includes(s)) ||
      (a.previousSchool && a.previousSchool.toLowerCase().includes(s)) ||
      (a.phone && a.phone.includes(s))
    );
  }

  res.json({
    total: results.length,
    data: results
  });
});

// 3. Get Single Applicant by ID or National ID
app.get('/api/applicants/:identifier', (req, res) => {
  const db = readDB();
  const ident = req.params.identifier.trim();
  const applicant = db.applicants.find(a => a.id === ident || a.nationalId === ident);

  if (!applicant) {
    return res.status(404).json({ error: 'ไม่พบข้อมูลผู้สมัครในระบบ' });
  }

  res.json(applicant);
});

// 4. Submit New Application
app.post('/api/applicants', uploadFields, async (req, res) => {
  try {
    const db = readDB();
    const body = req.body;

    // Validate Thai National ID
    const cleanNationalId = (body.nationalId || '').replace(/\D/g, '');
    if (!isValidThaiID(cleanNationalId)) {
      return res.status(400).json({ error: 'เลขประจำตัวประชาชนไม่ถูกต้องตามหลักการตรวจสอบ (13 หลัก)' });
    }

    // Check duplicate
    const year = body.academicYear || db.settings.academicYear || '2569';
    const existing = db.applicants.find(a => a.nationalId === cleanNationalId && a.academicYear === year);
    if (existing) {
      return res.status(400).json({
        error: `เลขบัตรประชาชนนี้เคยลงทะเบียนสมัครในปีการศึกษา ${year} แล้ว (รหัสใบสมัคร: ${existing.id}) กรุณาใช้เมนูตรวจสอบสถานะ`
      });
    }

    // Validate phone
    const cleanPhone = (body.phone || '').replace(/\D/g, '');
    if (!isValidPhone(cleanPhone)) {
      return res.status(400).json({ error: 'เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลักและขึ้นต้นด้วย 0' });
    }

    if (!body.firstName || !body.lastName || !body.level || !body.major) {
      return res.status(400).json({ error: 'กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน (ชื่อ, นามสกุล, ระดับชั้น, สาขาวิชา)' });
    }

    // Generate Application ID
    const count = (db.applicants.length + 1).toString().padStart(4, '0');
    const newId = `APP-${year}-${count}`;

    // Process files
    const files = {
      photo: req.files && req.files['photo'] ? `/uploads/${req.files['photo'][0].filename}` : null,
      idCardCopy: req.files && req.files['idCardCopy'] ? `/uploads/${req.files['idCardCopy'][0].filename}` : null,
      houseRegCopy: req.files && req.files['houseRegCopy'] ? `/uploads/${req.files['houseRegCopy'][0].filename}` : null,
      transcriptCopy: req.files && req.files['transcriptCopy'] ? `/uploads/${req.files['transcriptCopy'][0].filename}` : null
    };

    const newApplicant = {
      id: newId,
      academicYear: year,
      nationalId: cleanNationalId,
      prefix: body.prefix || 'นาย',
      firstName: body.firstName.trim(),
      lastName: body.lastName.trim(),
      gender: body.gender || (body.prefix === 'นางสาว' || body.prefix === 'เด็กหญิง' || body.prefix === 'นาง' ? 'หญิง' : 'ชาย'),
      birthDate: body.birthDate || '',
      phone: cleanPhone,
      email: body.email || '',
      religion: body.religion || 'พุทธ',
      nationality: body.nationality || 'ไทย',
      level: body.level,
      major: body.major,
      majorCode: body.majorCode || '',
      previousSchool: body.previousSchool || '',
      previousSchoolProvince: body.previousSchoolProvince || '',
      gpax: body.gpax ? parseFloat(body.gpax).toFixed(2) : '',
      address: body.address || '',
      guardianName: body.guardianName || '',
      guardianRelation: body.guardianRelation || '',
      guardianPhone: body.guardianPhone ? body.guardianPhone.replace(/\D/g, '') : '',
      guardianOccupation: body.guardianOccupation || '',
      referralSource: body.referralSource || 'ไม่ระบุ',
      status: 'รอตรวจสอบ',
      studentId: '',
      enrollmentDate: '',
      witnessName: '',
      reviewerNote: '',
      missingDocs: [],
      files: files,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.applicants.unshift(newApplicant);
    writeDB(db);

    // Send Admin Notification
    await sendNotification({
      recipient: 'admin',
      type: 'new_applicant',
      applicantId: newId,
      title: 'ผู้สมัครเรียนรายใหม่',
      message: `${newApplicant.prefix}${newApplicant.firstName} ${newApplicant.lastName} สมัครระดับ ${newApplicant.level} ${newApplicant.major} (รหัส: ${newId})`
    });

    res.status(201).json({
      success: true,
      message: 'บันทึกใบสมัครสำเร็จเรียบร้อย',
      data: newApplicant
    });
  } catch (err) {
    console.error('Error submitting application:', err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล: ' + err.message });
  }
});

// 5. Update Applicant Status (Admin)
app.put('/api/applicants/:id/status', async (req, res) => {
  const db = readDB();
  const { id } = req.params;
  const { status, reviewerNote, missingDocs } = req.body;

  const index = db.applicants.findIndex(a => a.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'ไม่พบผู้สมัครที่ระบุ' });
  }

  const applicant = db.applicants[index];
  applicant.status = status || applicant.status;
  if (reviewerNote !== undefined) applicant.reviewerNote = reviewerNote;
  if (missingDocs !== undefined) applicant.missingDocs = missingDocs;
  applicant.updatedAt = new Date().toISOString();

  db.applicants[index] = applicant;
  writeDB(db);

  // Send status update notification to applicant
  let notifMessage = `สถานะการสมัครของคุณ (${applicant.id}) ถูกปรับเป็น "${applicant.status}"`;
  if (applicant.reviewerNote) {
    notifMessage += `\nหมายเหตุ: ${applicant.reviewerNote}`;
  }

  await sendNotification({
    recipient: applicant.nationalId,
    type: 'status_change',
    applicantId: applicant.id,
    title: `อัปเดตสถานะการสมัคร: ${applicant.status}`,
    message: notifMessage
  });

  res.json({ success: true, message: 'อัปเดตสถานะสำเร็จ', data: applicant });
});

// 6. Manage Enrollment & Auto-generate Student ID
app.post('/api/applicants/:id/enroll', async (req, res) => {
  const db = readDB();
  const { id } = req.params;
  const { enrollmentDate, witnessName, customStudentId, guardianName, guardianPhone, notes } = req.body;

  const index = db.applicants.findIndex(a => a.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'ไม่พบผู้สมัครที่ระบุ' });
  }

  const applicant = db.applicants[index];

  // Auto-generate Student ID if not provided
  let studentId = customStudentId;
  if (!studentId) {
    const yearShort = (applicant.academicYear || '2569').slice(-2);
    const code = applicant.majorCode || '20901';
    // Count enrolled students with this major prefix
    const enrolledSameMajor = db.applicants.filter(a => a.studentId && a.studentId.startsWith(`${yearShort}${code}`));
    const seq = (enrolledSameMajor.length + 1).toString().padStart(4, '0');
    studentId = `${yearShort}${code}${seq}`;
  }

  applicant.status = 'มอบตัวแล้ว';
  applicant.studentId = studentId;
  applicant.enrollmentDate = enrollmentDate || new Date().toISOString().split('T')[0];
  applicant.witnessName = witnessName || 'เจ้าหน้าที่งานทะเบียน';
  if (guardianName) applicant.guardianName = guardianName;
  if (guardianPhone) applicant.guardianPhone = guardianPhone;
  if (notes) applicant.reviewerNote = notes;
  applicant.updatedAt = new Date().toISOString();

  db.applicants[index] = applicant;
  writeDB(db);

  await sendNotification({
    recipient: applicant.nationalId,
    type: 'enrolled',
    applicantId: applicant.id,
    title: 'ยืนยันการมอบตัวสำเร็จ',
    message: `ยินดีต้อนรับ ${applicant.prefix}${applicant.firstName} ${applicant.lastName} รหัสนักศึกษาของคุณคือ: ${studentId}`
  });

  res.json({
    success: true,
    message: 'บันทึกการมอบตัวและออกรหัสนักศึกษาสำเร็จ',
    data: applicant
  });
});

// 7. Update/Re-upload Documents (by Applicant)
app.post('/api/applicants/:id/update-documents', uploadFields, async (req, res) => {
  const db = readDB();
  const { id } = req.params;

  const index = db.applicants.findIndex(a => a.id === id || a.nationalId === id);
  if (index === -1) {
    return res.status(404).json({ error: 'ไม่พบผู้สมัครที่ระบุ' });
  }

  const applicant = db.applicants[index];
  applicant.files = applicant.files || {};

  if (req.files) {
    if (req.files['photo']) applicant.files.photo = `/uploads/${req.files['photo'][0].filename}`;
    if (req.files['idCardCopy']) applicant.files.idCardCopy = `/uploads/${req.files['idCardCopy'][0].filename}`;
    if (req.files['houseRegCopy']) applicant.files.houseRegCopy = `/uploads/${req.files['houseRegCopy'][0].filename}`;
    if (req.files['transcriptCopy']) applicant.files.transcriptCopy = `/uploads/${req.files['transcriptCopy'][0].filename}`;
  }

  // Clear missing docs and reset status to 'รอตรวจสอบ'
  applicant.status = 'รอตรวจสอบ';
  applicant.missingDocs = [];
  applicant.reviewerNote = 'ผู้สมัครได้อัปโหลดเอกสารแก้ไขเพิ่มเติมแล้ว รอการตรวจสอบรอบใหม่';
  applicant.updatedAt = new Date().toISOString();

  db.applicants[index] = applicant;
  writeDB(db);

  await sendNotification({
    recipient: 'admin',
    type: 'doc_resubmitted',
    applicantId: applicant.id,
    title: 'ผู้สมัครส่งเอกสารเพิ่มเติม',
    message: `${applicant.prefix}${applicant.firstName} ${applicant.lastName} (${applicant.id}) ส่งเอกสารเพิ่มเติมแล้ว`
  });

  res.json({
    success: true,
    message: 'อัปโหลดเอกสารเพิ่มเติมสำเร็จ ข้อมูลส่งให้เจ้าหน้าที่ตรวจสอบเรียบร้อย',
    data: applicant
  });
});

// 8. Analytics & Dashboard Summary
app.get('/api/stats/summary', (req, res) => {
  const db = readDB();
  const applicants = db.applicants || [];

  // Summary counts
  const total = applicants.length;
  const pending = applicants.filter(a => a.status === 'รอตรวจสอบ').length;
  const incomplete = applicants.filter(a => a.status === 'เอกสารไม่ครบ').length;
  const passed = applicants.filter(a => a.status === 'ผ่านการคัดเลือก').length;
  const enrolled = applicants.filter(a => a.status === 'มอบตัวแล้ว').length;
  const waived = applicants.filter(a => a.status === 'สละสิทธิ์').length;

  // By Level
  const byLevel = {
    'ปวช.': applicants.filter(a => a.level === 'ปวช.').length,
    'ปวส.': applicants.filter(a => a.level === 'ปวส.').length
  };

  // By Major
  const byMajor = {};
  applicants.forEach(a => {
    const key = `${a.level} - ${a.major}`;
    byMajor[key] = (byMajor[key] || 0) + 1;
  });

  // By Previous School
  const bySchool = {};
  applicants.forEach(a => {
    if (a.previousSchool) {
      bySchool[a.previousSchool] = (bySchool[a.previousSchool] || 0) + 1;
    }
  });

  // By Province
  const byProvince = {};
  applicants.forEach(a => {
    const prov = a.previousSchoolProvince || 'ไม่ระบุ';
    byProvince[prov] = (byProvince[prov] || 0) + 1;
  });

  // By Referral Source
  const byReferral = {};
  applicants.forEach(a => {
    const ref = a.referralSource || 'ไม่ระบุ';
    byReferral[ref] = (byReferral[ref] || 0) + 1;
  });

  res.json({
    counts: { total, pending, incomplete, passed, enrolled, waived },
    byLevel,
    byMajor,
    bySchool,
    byProvince,
    byReferral
  });
});

// 9. Export to Excel (Standard ศธ.02 Format)
app.get('/api/export/excel', (req, res) => {
  const db = readDB();
  const applicants = db.applicants || [];

  const rows = applicants.map((a, idx) => ({
    'ลำดับ': idx + 1,
    'รหัสใบสมัคร': a.id,
    'ปีการศึกษา': a.academicYear,
    'รหัสประจำตัวนักเรียน/นักศึกษา': a.studentId || '-',
    'เลขประจำตัวประชาชน': a.nationalId,
    'คำนำหน้า': a.prefix,
    'ชื่อ': a.firstName,
    'นามสกุล': a.lastName,
    'เพศ': a.gender,
    'วันเดือนปีเกิด': a.birthDate,
    'เบอร์โทรศัพท์': a.phone,
    'อีเมล': a.email,
    'ระดับชั้น': a.level,
    'รหัสสาขาวิชา': a.majorCode,
    'สาขาวิชา': a.major,
    'เกรดเฉลี่ยสะสม (GPAX)': a.gpax,
    'โรงเรียนเดิม': a.previousSchool,
    'จังหวัดโรงเรียนเดิม': a.previousSchoolProvince,
    'ที่อยู่': a.address,
    'ชื่อผู้ปกครอง': a.guardianName,
    'ความสัมพันธ์': a.guardianRelation,
    'เบอร์โทรผู้ปกครอง': a.guardianPhone,
    'อาชีพผู้ปกครอง': a.guardianOccupation,
    'สถานะการสมัคร': a.status,
    'วันที่มอบตัว': a.enrollmentDate || '-',
    'พยาน/ผู้รับมอบตัว': a.witnessName || '-',
    'ช่องทางที่ทราบข่าว': a.referralSource,
    'หมายเหตุเจ้าหน้าที่': a.reviewerNote || ''
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);

  // Auto-width columns
  const colWidths = Object.keys(rows[0] || {}).map(key => ({
    wch: Math.max(key.length * 2, 16)
  }));
  ws['!cols'] = colWidths;

  XLSX.utils.book_append_sheet(wb, ws, 'ข้อมูลผู้สมัคร_ศธ02');

  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  const filename = `student_admissions_${db.settings.academicYear || '2569'}_std02.xlsx`;

  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.send(buffer);
});

// 10. Export to CSV
app.get('/api/export/csv', (req, res) => {
  const db = readDB();
  const applicants = db.applicants || [];

  const headers = [
    'ลำดับ', 'รหัสใบสมัคร', 'ปีการศึกษา', 'รหัสนักศึกษา', 'เลขบัตรประชาชน',
    'คำนำหน้า', 'ชื่อ', 'นามสกุล', 'ระดับชั้น', 'สาขาวิชา', 'เกรดเฉลี่ย',
    'โรงเรียนเดิม', 'เบอร์โทร', 'สถานะ', 'วันที่มอบตัว'
  ];

  const csvRows = [headers.join(',')];
  applicants.forEach((a, idx) => {
    csvRows.push([
      idx + 1,
      `"${a.id}"`,
      `"${a.academicYear}"`,
      `"${a.studentId || '-'}"`,
      `"${a.nationalId}"`,
      `"${a.prefix}"`,
      `"${a.firstName}"`,
      `"${a.lastName}"`,
      `"${a.level}"`,
      `"${a.major}"`,
      `"${a.gpax || ''}"`,
      `"${a.previousSchool || ''}"`,
      `"${a.phone}"`,
      `"${a.status}"`,
      `"${a.enrollmentDate || '-'}"`
    ].join(','));
  });

  // Prepend UTF-8 BOM so Thai characters show correctly in Excel
  const bom = '\uFEFF';
  const csvContent = bom + csvRows.join('\r\n');

  res.setHeader('Content-Disposition', 'attachment; filename="applicants.csv"');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.send(csvContent);
});

// 11. Notifications List
app.get('/api/notifications', (req, res) => {
  const db = readDB();
  res.json(db.notifications || []);
});

// 12. Test Notification Simulation
app.post('/api/notify/test', async (req, res) => {
  const { title, message, recipient } = req.body;
  const notif = await sendNotification({
    recipient: recipient || 'admin',
    type: 'test',
    title: title || 'ทดสอบการแจ้งเตือนระบบ',
    message: message || 'ระบบทดสอบการส่งข้อความแจ้งเตือนผ่านช่องทางอัตโนมัติสำเร็จ'
  });
  res.json({ success: true, notification: notif });
});

// Start Server
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`  ระบบรับสมัครเรียนออนไลน์ครบวงจร (Student Admission V2)`);
  console.log(`  เซิร์ฟเวอร์เปิดใช้งานที่: http://localhost:${PORT}`);
  console.log(`  - หน้าผู้สมัครเรียน:     http://localhost:${PORT}/index.html`);
  console.log(`  - หน้าเจ้าหน้าที่ (แอดมิน): http://localhost:${PORT}/admin.html`);
  console.log(`  - แดชบอร์ดสถิติเรียลไทม์:  http://localhost:${PORT}/dashboard.html`);
  console.log(`====================================================`);
});
