/**
 * Unified Data Service for Student Admission System
 * Supports both GitHub Pages (Static / LocalStorage) and Node.js Server API
 */

const DEFAULT_CONFIG = {
  settings: {
    collegeName: "วิทยาลัยเทคนิคท่าหลวงซิเมนต์ไทยอนุสรณ์",
    collegeSubName: "สำนักงานคณะกรรมการการอาชีวศึกษา (สอศ.)",
    academicYear: "2569",
    term: "1"
  },
  majors: {
    "ปวช.": [
      { id: "V01", code: "20101", name: "สาขาวิชาช่างยนต์" },
      { id: "V02", code: "20102", name: "สาขาวิชาช่างกลโรงงาน" },
      { id: "V03", code: "20104", name: "สาขาวิชาช่างไฟฟ้ากำลัง" },
      { id: "V04", code: "20105", name: "สาขาวิชาช่างอิเล็กทรอนิกส์" },
      { id: "V05", code: "20901", name: "สาขาวิชาเทคโนโลยีสารสนเทศ" },
      { id: "V06", code: "20201", name: "สาขาวิชาการบัญชี" },
      { id: "V07", code: "20202", name: "สาขาวิชาการตลาด" },
      { id: "V08", code: "20204", name: "สาขาวิชาคอมพิวเตอร์ธุรกิจ" }
    ],
    "ปวส.": [
      { id: "H01", code: "30101", name: "สาขาวิชาเทคนิคเครื่องกล" },
      { id: "H02", code: "30104", name: "สาขาวิชาไฟฟ้ากำลัง" },
      { id: "H03", code: "30105", name: "สาขาวิชาอิเล็กทรอนิกส์" },
      { id: "H04", code: "30901", name: "สาขาวิชาเทคโนโลยีสารสนเทศ" },
      { id: "H05", code: "30201", name: "สาขาวิชาการบัญชี" },
      { id: "H06", code: "30202", name: "สาขาวิชาการจัดการทั่วไป" },
      { id: "H07", code: "30204", name: "สาขาวิชาคอมพิวเตอร์ธุรกิจ" }
    ]
  },
  statusOptions: ['รอตรวจสอบ', 'เอกสารไม่ครบ', 'ผ่านการคัดเลือก', 'มอบตัวแล้ว', 'สละสิทธิ์']
};

const INITIAL_APPLICANTS = [
  {
    id: "APP-2569-0001",
    academicYear: "2569",
    nationalId: "1103702589411",
    prefix: "นาย",
    firstName: "กฤษฎา",
    lastName: "รุ่งโรจน์สกุล",
    gender: "ชาย",
    birthDate: "2554-04-12",
    phone: "0812345678",
    email: "kritsada.r@gmail.com",
    religion: "พุทธ",
    nationality: "ไทย",
    level: "ปวช.",
    major: "สาขาวิชาเทคโนโลยีสารสนเทศ",
    majorCode: "20901",
    previousSchool: "โรงเรียนอนุบาลเทศบาลนครปฐม",
    previousSchoolProvince: "นครปฐม",
    gpax: "3.65",
    address: "123/45 หมู่ 2 ต.สนามจันทร์ อ.เมือง จ.นครปฐม 73000",
    guardianName: "นายสมชาย รุ่งโรจน์สกุล",
    guardianRelation: "บิดา",
    guardianPhone: "0898765432",
    guardianOccupation: "รับราชการ",
    referralSource: "อาจารย์แนะแนวมาที่โรงเรียน",
    status: "มอบตัวแล้ว",
    studentId: "69209010001",
    enrollmentDate: "2569-11-01",
    witnessName: "อาจารย์สมพร สอนดี",
    reviewerNote: "เอกสารครบถ้วนสมบูรณ์ มอบตัวเรียบร้อยแล้ว ชำระเงินค่าขึ้นทะเบียนแล้ว",
    missingDocs: [],
    files: {
      photo: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='150' height='200'><rect width='150' height='200' fill='%23e2e8f0'/><circle cx='75' cy='70' r='30' fill='%2394a3b8'/><path d='M30 170 C30 120, 120 120, 120 170 Z' fill='%2364748b'/><text x='75' y='190' font-family='sans-serif' font-size='11' fill='%23334155' text-anchor='middle'>รูปถ่ายนักเรียน</text></svg>",
      idCardCopy: "#",
      houseRegCopy: "#",
      transcriptCopy: "#"
    },
    createdAt: "2026-10-25T08:30:00.000Z",
    updatedAt: "2026-11-01T10:15:00.000Z"
  },
  {
    id: "APP-2569-0002",
    academicYear: "2569",
    nationalId: "1409901452368",
    prefix: "นางสาว",
    firstName: "ณัฐธิดา",
    lastName: "แก้วประเสริฐ",
    gender: "หญิง",
    birthDate: "2554-08-20",
    phone: "0823456789",
    email: "natthida.k@gmail.com",
    religion: "พุทธ",
    nationality: "ไทย",
    level: "ปวช.",
    major: "สาขาวิชาการบัญชี",
    majorCode: "20201",
    previousSchool: "โรงเรียนวัดไร่ขิงวิทยา",
    previousSchoolProvince: "นครปฐม",
    gpax: "3.82",
    address: "88/12 ต.ไร่ขิง อ.สามพราน จ.นครปฐม 73210",
    guardianName: "นางพิมพา แก้วประเสริฐ",
    guardianRelation: "มารดา",
    guardianPhone: "0845678901",
    guardianOccupation: "ค้าขาย",
    referralSource: "Facebook แฟนเพจวิทยาลัย",
    status: "ผ่านการคัดเลือก",
    studentId: "",
    enrollmentDate: "",
    witnessName: "",
    reviewerNote: "ตรวจสอบคุณสมบัติและเกรดผ่านเกณฑ์ รอวันมอบตัวและพิมพ์เอกสารใบมอบตัว",
    missingDocs: [],
    files: {
      photo: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='150' height='200'><rect width='150' height='200' fill='%23fdf2f8'/><circle cx='75' cy='70' r='30' fill='%23f472b6'/><path d='M30 170 C30 120, 120 120, 120 170 Z' fill='%23db2777'/><text x='75' y='190' font-family='sans-serif' font-size='11' fill='%23831843' text-anchor='middle'>รูปถ่ายหน้าตรง</text></svg>",
      idCardCopy: "#",
      houseRegCopy: "#",
      transcriptCopy: "#"
    },
    createdAt: "2026-10-28T09:12:00.000Z",
    updatedAt: "2026-10-29T14:20:00.000Z"
  },
  {
    id: "APP-2569-0003",
    academicYear: "2569",
    nationalId: "2309800561234",
    prefix: "นาย",
    firstName: "ภานุวัฒน์",
    lastName: "ชัยมงคล",
    gender: "ชาย",
    birthDate: "2552-02-15",
    phone: "0891234567",
    email: "panuwat.c@outlook.com",
    religion: "พุทธ",
    nationality: "ไทย",
    level: "ปวส.",
    major: "สาขาวิชาเทคโนโลยีสารสนเทศ",
    majorCode: "30901",
    previousSchool: "วิทยาลัยอาชีวศึกษาธนบุรี",
    previousSchoolProvince: "กรุงเทพมหานคร",
    gpax: "3.40",
    address: "450 ซอยเพชรเกษม 54 แขวงบางหว้า เขตภาษีเจริญ กรุงเทพฯ 10160",
    guardianName: "นายวิชัย ชัยมงคล",
    guardianRelation: "บิดา",
    guardianPhone: "0819998877",
    guardianOccupation: "พนักงานบริษัท",
    referralSource: "เพื่อนหรือรุ่นพี่แนะนำ",
    status: "เอกสารไม่ครบ",
    studentId: "",
    enrollmentDate: "",
    witnessName: "",
    reviewerNote: "สำเนาทะเบียนบ้านและใบแสดงผลการเรียนไม่ชัดเจน กรุณาถ่ายภาพหรือสแกนใหม่ให้เห็นตัวหนังสือชัดเจน",
    missingDocs: ["houseRegCopy", "transcriptCopy"],
    files: {
      photo: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='150' height='200'><rect width='150' height='200' fill='%23e2e8f0'/><circle cx='75' cy='70' r='30' fill='%2394a3b8'/><path d='M30 170 C30 120, 120 120, 120 170 Z' fill='%2364748b'/><text x='75' y='190' font-family='sans-serif' font-size='11' fill='%23334155' text-anchor='middle'>รูปถ่ายนักเรียน</text></svg>",
      idCardCopy: "#",
      houseRegCopy: null,
      transcriptCopy: null
    },
    createdAt: "2026-11-02T11:05:00.000Z",
    updatedAt: "2026-11-03T16:00:00.000Z"
  },
  {
    id: "APP-2569-0004",
    academicYear: "2569",
    nationalId: "3101502489671",
    prefix: "นาย",
    firstName: "ธนกฤต",
    lastName: "ศิริวัฒนานุกูล",
    gender: "ชาย",
    birthDate: "2554-11-05",
    phone: "0956781234",
    email: "tanakrit.s@hotmail.com",
    religion: "พุทธ",
    nationality: "ไทย",
    level: "ปวช.",
    major: "สาขาวิชาช่างยนต์",
    majorCode: "20101",
    previousSchool: "โรงเรียนรัตนโกสินทร์สมโภชบวรนิเวศศาลายา",
    previousSchoolProvince: "นครปฐม",
    gpax: "3.15",
    address: "99 หมู่ 5 ต.ศาลายา อ.พุทธมณฑล จ.นครปฐม 73170",
    guardianName: "นายประเสริฐ ศิริวัฒนานุกูล",
    guardianRelation: "บิดา",
    guardianPhone: "0861112233",
    guardianOccupation: "ธุรกิจส่วนตัว",
    referralSource: "ป้ายประชาสัมพันธ์ / ไวนิล",
    status: "รอตรวจสอบ",
    studentId: "",
    enrollmentDate: "",
    witnessName: "",
    reviewerNote: "",
    missingDocs: [],
    files: {
      photo: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='150' height='200'><rect width='150' height='200' fill='%23e2e8f0'/><circle cx='75' cy='70' r='30' fill='%2394a3b8'/><path d='M30 170 C30 120, 120 120, 120 170 Z' fill='%2364748b'/><text x='75' y='190' font-family='sans-serif' font-size='11' fill='%23334155' text-anchor='middle'>รูปถ่ายนักเรียน</text></svg>",
      idCardCopy: "#",
      houseRegCopy: "#",
      transcriptCopy: "#"
    },
    createdAt: "2026-11-05T14:40:00.000Z",
    updatedAt: "2026-11-05T14:40:00.000Z"
  },
  {
    id: "APP-2569-0005",
    academicYear: "2569",
    nationalId: "1509901847253",
    prefix: "นางสาว",
    firstName: "วรัญญา",
    lastName: "สินธุประเสริฐ",
    gender: "หญิง",
    birthDate: "2552-06-18",
    phone: "0834567890",
    email: "waranya.s@gmail.com",
    religion: "พุทธ",
    nationality: "ไทย",
    level: "ปวส.",
    major: "สาขาวิชาการจัดการทั่วไป",
    majorCode: "30202",
    previousSchool: "โรงเรียนโพธาวัฒนาเสนี",
    previousSchoolProvince: "ราชบุรี",
    gpax: "3.55",
    address: "14/2 หมู่ 1 ต.บ้านฆ้อง อ.โพธาราม จ.ราชบุรี 70120",
    guardianName: "นางสุภาพร สินธุประเสริฐ",
    guardianRelation: "มารดา",
    guardianPhone: "0876543210",
    guardianOccupation: "เกษตรกร",
    referralSource: "อาจารย์แนะแนวมาที่โรงเรียน",
    status: "มอบตัวแล้ว",
    studentId: "69302020001",
    enrollmentDate: "2569-11-02",
    witnessName: "อาจารย์มณี วงศ์สว่าง",
    reviewerNote: "มอบตัวเรียบร้อย ชำระค่าธรรมเนียมพร้อมตัดชุดเครื่องแบบ",
    missingDocs: [],
    files: {
      photo: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='150' height='200'><rect width='150' height='200' fill='%23fdf2f8'/><circle cx='75' cy='70' r='30' fill='%23f472b6'/><path d='M30 170 C30 120, 120 120, 120 170 Z' fill='%23db2777'/><text x='75' y='190' font-family='sans-serif' font-size='11' fill='%23831843' text-anchor='middle'>รูปถ่ายหน้าตรง</text></svg>",
      idCardCopy: "#",
      houseRegCopy: "#",
      transcriptCopy: "#"
    },
    createdAt: "2026-10-27T10:00:00.000Z",
    updatedAt: "2026-11-02T13:30:00.000Z"
  },
  {
    id: "APP-2569-0006",
    academicYear: "2569",
    nationalId: "1600100984521",
    prefix: "นาย",
    firstName: "อธิปัตย์",
    lastName: "บุญส่งเสริม",
    gender: "ชาย",
    birthDate: "2554-10-09",
    phone: "0887654321",
    email: "athipat.b@gmail.com",
    religion: "พุทธ",
    nationality: "ไทย",
    level: "ปวช.",
    major: "สาขาวิชาช่างไฟฟ้ากำลัง",
    majorCode: "20104",
    previousSchool: "โรงเรียนกาญจนาภิเษกวิทยาลัย นครปฐม",
    previousSchoolProvince: "นครปฐม",
    gpax: "3.28",
    address: "56 ต.คลองใหม่ อ.สามพราน จ.นครปฐม 73110",
    guardianName: "นายมานพ บุญส่งเสริม",
    guardianRelation: "บิดา",
    guardianPhone: "0891238899",
    guardianOccupation: "รับเหมาก่อสร้าง",
    referralSource: "TikTok / โซเชียลมีเดีย",
    status: "รอตรวจสอบ",
    studentId: "",
    enrollmentDate: "",
    witnessName: "",
    reviewerNote: "",
    missingDocs: [],
    files: {
      photo: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='150' height='200'><rect width='150' height='200' fill='%23e2e8f0'/><circle cx='75' cy='70' r='30' fill='%2394a3b8'/><path d='M30 170 C30 120, 120 120, 120 170 Z' fill='%2364748b'/><text x='75' y='190' font-family='sans-serif' font-size='11' fill='%23334155' text-anchor='middle'>รูปถ่ายนักเรียน</text></svg>",
      idCardCopy: "#",
      houseRegCopy: "#",
      transcriptCopy: "#"
    },
    createdAt: "2026-11-06T09:20:00.000Z",
    updatedAt: "2026-11-06T09:20:00.000Z"
  }
];

class DataService {
  static isServerAvailable = null;

  // Check if Express backend server is available
  static async checkServer() {
    if (this.isServerAvailable !== null) return this.isServerAvailable;
    try {
      const res = await fetch('/api/config', { method: 'GET', headers: { 'Accept': 'application/json' } });
      this.isServerAvailable = res.ok;
    } catch {
      this.isServerAvailable = false;
    }
    return this.isServerAvailable;
  }

  // Get local storage DB
  static getLocalDB() {
    const raw = localStorage.getItem('student_admission_db_v2');
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch (e) {
        console.error('Error parsing local DB:', e);
      }
    }
    // Initialize default DB
    const initial = {
      config: DEFAULT_CONFIG,
      applicants: INITIAL_APPLICANTS,
      notifications: [
        {
          id: "NOTIF-001",
          recipient: "admin",
          type: "new_applicant",
          title: "มีผู้สมัครเรียนรายใหม่เข้ามา",
          message: "นายอธิปัตย์ บุญส่งเสริม สมัคร ปวช. สาขาวิชาช่างไฟฟ้ากำลัง",
          timestamp: "2026-11-06T09:20:15.000Z",
          status: "sent"
        }
      ]
    };
    localStorage.setItem('student_admission_db_v2', JSON.stringify(initial));
    return initial;
  }

  static saveLocalDB(data) {
    localStorage.setItem('student_admission_db_v2', JSON.stringify(data));
  }

  // Helper to convert File to Base64 Data URL
  static readFileAsDataURL(file) {
    return new Promise((resolve) => {
      if (!file) return resolve(null);
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
  }

  // 1. Get Config
  static async getConfig() {
    const hasServer = await this.checkServer();
    if (hasServer) {
      try {
        const res = await fetch('/api/config');
        if (res.ok) return await res.json();
      } catch (e) {
        console.warn('Fallback to local config:', e);
      }
    }
    return this.getLocalDB().config;
  }

  // 2. Get Applicants
  static async getApplicants(filters = {}) {
    const hasServer = await this.checkServer();
    if (hasServer) {
      try {
        const params = new URLSearchParams(filters);
        const res = await fetch(`/api/applicants?${params.toString()}`);
        if (res.ok) return await res.json();
      } catch (e) {
        console.warn('Fallback to local applicants:', e);
      }
    }

    const db = this.getLocalDB();
    let results = db.applicants || [];

    if (filters.year) results = results.filter(a => a.academicYear === filters.year);
    if (filters.level) results = results.filter(a => a.level === filters.level);
    if (filters.major) results = results.filter(a => a.major === filters.major || a.majorCode === filters.major);
    if (filters.status) results = results.filter(a => a.status === filters.status);
    if (filters.search) {
      const s = filters.search.trim().toLowerCase();
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

    return { total: results.length, data: results };
  }

  // 3. Get Single Applicant
  static async getApplicant(identifier) {
    const hasServer = await this.checkServer();
    if (hasServer) {
      try {
        const res = await fetch(`/api/applicants/${identifier}`);
        if (res.ok) return await res.json();
      } catch (e) {
        console.warn('Fallback to local applicant lookup:', e);
      }
    }

    const db = this.getLocalDB();
    const ident = identifier.toString().trim();
    const applicant = db.applicants.find(a => a.id === ident || a.nationalId === ident);
    if (!applicant) throw new Error('ไม่พบข้อมูลผู้สมัครในระบบ');
    return applicant;
  }

  // 4. Submit New Application
  static async submitApplication(formData, fileInputs = {}) {
    const hasServer = await this.checkServer();
    if (hasServer) {
      try {
        const res = await fetch('/api/applicants', {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'เกิดข้อผิดพลาดในการบันทึก');
        return data.data;
      } catch (e) {
        if (!e.message.includes('Failed to fetch')) throw e;
      }
    }

    // LocalStorage fallback
    const db = this.getLocalDB();
    const cleanId = (formData.get('nationalId') || '').replace(/\D/g, '');
    const year = formData.get('academicYear') || '2569';

    // Duplicate check
    const existing = db.applicants.find(a => a.nationalId === cleanId && a.academicYear === year);
    if (existing) {
      throw new Error(`เลขบัตรประชาชนนี้เคยลงทะเบียนสมัครในปีการศึกษา ${year} แล้ว (รหัสใบสมัคร: ${existing.id})`);
    }

    // Process files into base64
    const photoBase64 = await this.readFileAsDataURL(fileInputs.photo);
    const idCardBase64 = await this.readFileAsDataURL(fileInputs.idCardCopy);
    const houseRegBase64 = await this.readFileAsDataURL(fileInputs.houseRegCopy);
    const transcriptBase64 = await this.readFileAsDataURL(fileInputs.transcriptCopy);

    const count = (db.applicants.length + 1).toString().padStart(4, '0');
    const newId = `APP-${year}-${count}`;

    const newApplicant = {
      id: newId,
      academicYear: year,
      nationalId: cleanId,
      prefix: formData.get('prefix') || 'นาย',
      firstName: (formData.get('firstName') || '').trim(),
      lastName: (formData.get('lastName') || '').trim(),
      gender: formData.get('gender') || (['นางสาว', 'เด็กหญิง', 'นาง'].includes(formData.get('prefix')) ? 'หญิง' : 'ชาย'),
      birthDate: formData.get('birthDate') || '',
      phone: (formData.get('phone') || '').replace(/\D/g, ''),
      email: formData.get('email') || '',
      religion: formData.get('religion') || 'พุทธ',
      nationality: formData.get('nationality') || 'ไทย',
      level: formData.get('level'),
      major: formData.get('major'),
      majorCode: formData.get('majorCode') || '',
      previousSchool: formData.get('previousSchool') || '',
      previousSchoolProvince: formData.get('previousSchoolProvince') || '',
      gpax: formData.get('gpax') ? parseFloat(formData.get('gpax')).toFixed(2) : '',
      address: formData.get('address') || '',
      guardianName: formData.get('guardianName') || '',
      guardianRelation: formData.get('guardianRelation') || '',
      guardianPhone: (formData.get('guardianPhone') || '').replace(/\D/g, ''),
      guardianOccupation: formData.get('guardianOccupation') || '',
      referralSource: formData.get('referralSource') || 'ไม่ระบุ',
      status: 'รอตรวจสอบ',
      studentId: '',
      enrollmentDate: '',
      witnessName: '',
      reviewerNote: '',
      missingDocs: [],
      files: {
        photo: photoBase64 || "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='150' height='200'><rect width='150' height='200' fill='%23e2e8f0'/><circle cx='75' cy='70' r='30' fill='%2394a3b8'/><path d='M30 170 C30 120, 120 120, 120 170 Z' fill='%2364748b'/><text x='75' y='190' font-family='sans-serif' font-size='11' fill='%23334155' text-anchor='middle'>รูปถ่ายนักเรียน</text></svg>",
        idCardCopy: idCardBase64,
        houseRegCopy: houseRegBase64,
        transcriptCopy: transcriptBase64
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.applicants.unshift(newApplicant);
    this.saveLocalDB(db);
    return newApplicant;
  }

  // 5. Update Status
  static async updateStatus(id, updateData) {
    const hasServer = await this.checkServer();
    if (hasServer) {
      try {
        const res = await fetch(`/api/applicants/${id}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateData)
        });
        if (res.ok) return await res.json();
      } catch (e) {
        console.warn('Fallback to local status update:', e);
      }
    }

    const db = this.getLocalDB();
    const idx = db.applicants.findIndex(a => a.id === id);
    if (idx === -1) throw new Error('ไม่พบผู้สมัครที่ระบุ');

    const app = db.applicants[idx];
    if (updateData.status) app.status = updateData.status;
    if (updateData.reviewerNote !== undefined) app.reviewerNote = updateData.reviewerNote;
    if (updateData.missingDocs !== undefined) app.missingDocs = updateData.missingDocs;
    app.updatedAt = new Date().toISOString();

    db.applicants[idx] = app;
    this.saveLocalDB(db);
    return { success: true, data: app };
  }

  // 6. Complete Enrollment
  static async enrollApplicant(id, enrollData) {
    const hasServer = await this.checkServer();
    if (hasServer) {
      try {
        const res = await fetch(`/api/applicants/${id}/enroll`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(enrollData)
        });
        if (res.ok) return await res.json();
      } catch (e) {
        console.warn('Fallback to local enrollment:', e);
      }
    }

    const db = this.getLocalDB();
    const idx = db.applicants.findIndex(a => a.id === id);
    if (idx === -1) throw new Error('ไม่พบผู้สมัครที่ระบุ');

    const app = db.applicants[idx];
    let studentId = enrollData.customStudentId;
    if (!studentId) {
      const yearShort = (app.academicYear || '2569').slice(-2);
      const code = app.majorCode || '20901';
      const count = db.applicants.filter(a => a.studentId && a.studentId.startsWith(`${yearShort}${code}`)).length + 1;
      studentId = `${yearShort}${code}${count.toString().padStart(4, '0')}`;
    }

    app.status = 'มอบตัวแล้ว';
    app.studentId = studentId;
    app.enrollmentDate = enrollData.enrollmentDate || new Date().toISOString().split('T')[0];
    app.witnessName = enrollData.witnessName || 'อาจารย์ประจำงานทะเบียน';
    if (enrollData.guardianName) app.guardianName = enrollData.guardianName;
    if (enrollData.guardianPhone) app.guardianPhone = enrollData.guardianPhone;
    app.updatedAt = new Date().toISOString();

    db.applicants[idx] = app;
    this.saveLocalDB(db);
    return { success: true, data: app };
  }

  // 7. Re-upload Documents
  static async updateDocuments(id, files) {
    const db = this.getLocalDB();
    const idx = db.applicants.findIndex(a => a.id === id || a.nationalId === id);
    if (idx === -1) throw new Error('ไม่พบผู้สมัครที่ระบุ');

    const app = db.applicants[idx];
    app.files = app.files || {};

    if (files.photo) app.files.photo = await this.readFileAsDataURL(files.photo);
    if (files.idCardCopy) app.files.idCardCopy = await this.readFileAsDataURL(files.idCardCopy);
    if (files.houseRegCopy) app.files.houseRegCopy = await this.readFileAsDataURL(files.houseRegCopy);
    if (files.transcriptCopy) app.files.transcriptCopy = await this.readFileAsDataURL(files.transcriptCopy);

    app.status = 'รอตรวจสอบ';
    app.missingDocs = [];
    app.reviewerNote = 'ผู้สมัครได้อัปโหลดเอกสารแก้ไขเพิ่มเติมแล้ว รอการตรวจสอบรอบใหม่';
    app.updatedAt = new Date().toISOString();

    db.applicants[idx] = app;
    this.saveLocalDB(db);
    return { success: true, data: app };
  }

  // 8. Stats Summary
  static async getStats() {
    const hasServer = await this.checkServer();
    if (hasServer) {
      try {
        const res = await fetch('/api/stats/summary');
        if (res.ok) return await res.json();
      } catch (e) {
        console.warn('Fallback to local stats:', e);
      }
    }

    const db = this.getLocalDB();
    const applicants = db.applicants || [];

    const total = applicants.length;
    const pending = applicants.filter(a => a.status === 'รอตรวจสอบ').length;
    const incomplete = applicants.filter(a => a.status === 'เอกสารไม่ครบ').length;
    const passed = applicants.filter(a => a.status === 'ผ่านการคัดเลือก').length;
    const enrolled = applicants.filter(a => a.status === 'มอบตัวแล้ว').length;
    const waived = applicants.filter(a => a.status === 'สละสิทธิ์').length;

    const byLevel = {
      'ปวช.': applicants.filter(a => a.level === 'ปวช.').length,
      'ปวส.': applicants.filter(a => a.level === 'ปวส.').length
    };

    const byMajor = {};
    applicants.forEach(a => {
      const key = `${a.level} - ${a.major}`;
      byMajor[key] = (byMajor[key] || 0) + 1;
    });

    const bySchool = {};
    applicants.forEach(a => {
      if (a.previousSchool) bySchool[a.previousSchool] = (bySchool[a.previousSchool] || 0) + 1;
    });

    const byProvince = {};
    applicants.forEach(a => {
      const prov = a.previousSchoolProvince || 'ไม่ระบุ';
      byProvince[prov] = (byProvince[prov] || 0) + 1;
    });

    const byReferral = {};
    applicants.forEach(a => {
      const ref = a.referralSource || 'ไม่ระบุ';
      byReferral[ref] = (byReferral[ref] || 0) + 1;
    });

    return { counts: { total, pending, incomplete, passed, enrolled, waived }, byLevel, byMajor, bySchool, byProvince, byReferral };
  }

  // 9. Export to Excel (Client-side SheetJS)
  static async exportExcel() {
    const { data: applicants } = await this.getApplicants();
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

    if (window.XLSX) {
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, 'ข้อมูลผู้สมัคร_ศธ02');
      XLSX.writeFile(wb, 'student_admissions_std02.xlsx');
    } else {
      window.location.href = '/api/export/excel';
    }
  }

  // 10. Export to CSV (Client-side)
  static async exportCsv() {
    const { data: applicants } = await this.getApplicants();
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

    const bom = '\uFEFF';
    const blob = new Blob([bom + csvRows.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'applicants_std02.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}

window.DataService = DataService;
