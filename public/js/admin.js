/**
 * Admin Portal Management Script
 */

let allApplicants = [];
let filteredApplicants = [];
let systemConfig = null;
let currentApplicant = null;

document.addEventListener('DOMContentLoaded', async () => {
  await loadConfig();
  await fetchApplicants();
  setupFilters();
  setupModals();
});

// Load system config
async function loadConfig() {
  try {
    const res = await fetch('/api/config');
    systemConfig = await res.json();
    populateMajorFilter();
  } catch (err) {
    console.error('Failed to load config:', err);
  }
}

// Populate Majors in Filter dropdown
function populateMajorFilter() {
  const filterMajor = document.getElementById('filterMajor');
  if (!filterMajor || !systemConfig) return;

  const currentLevel = document.getElementById('filterLevel').value;
  filterMajor.innerHTML = '<option value="">ทุกสาขาวิชา</option>';

  let list = [];
  if (currentLevel) {
    list = systemConfig.majors[currentLevel] || [];
  } else {
    // Both levels
    list = [...(systemConfig.majors['ปวช.'] || []), ...(systemConfig.majors['ปวส.'] || [])];
  }

  list.forEach(m => {
    const opt = document.createElement('option');
    opt.value = m.name;
    opt.textContent = m.name;
    filterMajor.appendChild(opt);
  });
}

// Fetch applicants
async function fetchApplicants() {
  try {
    const res = await fetch('/api/applicants');
    const data = await res.json();
    allApplicants = data.data || [];
    applyFilters();
    updateStatCards();
  } catch (err) {
    showToast('ไม่สามารถดึงข้อมูลผู้สมัครได้', 'error');
  }
}

// Update Top Stat Cards
function updateStatCards() {
  const total = allApplicants.length;
  const pending = allApplicants.filter(a => a.status === 'รอตรวจสอบ').length;
  const incomplete = allApplicants.filter(a => a.status === 'เอกสารไม่ครบ').length;
  const passed = allApplicants.filter(a => a.status === 'ผ่านการคัดเลือก').length;
  const enrolled = allApplicants.filter(a => a.status === 'มอบตัวแล้ว').length;

  document.getElementById('statTotal').textContent = total;
  document.getElementById('statPending').textContent = pending;
  document.getElementById('statIncomplete').textContent = incomplete;
  document.getElementById('statPassed').textContent = passed;
  document.getElementById('statEnrolled').textContent = enrolled;
}

// Filter applicants
function applyFilters() {
  const search = document.getElementById('filterSearch').value.trim().toLowerCase();
  const year = document.getElementById('filterYear').value;
  const level = document.getElementById('filterLevel').value;
  const major = document.getElementById('filterMajor').value;
  const status = document.getElementById('filterStatus').value;

  filteredApplicants = allApplicants.filter(a => {
    if (year && a.academicYear !== year) return false;
    if (level && a.level !== level) return false;
    if (major && a.major !== major) return false;
    if (status && a.status !== status) return false;

    if (search) {
      const match = (
        (a.id && a.id.toLowerCase().includes(search)) ||
        (a.nationalId && a.nationalId.includes(search)) ||
        (a.firstName && a.firstName.toLowerCase().includes(search)) ||
        (a.lastName && a.lastName.toLowerCase().includes(search)) ||
        (a.studentId && a.studentId.includes(search)) ||
        (a.previousSchool && a.previousSchool.toLowerCase().includes(search)) ||
        (a.phone && a.phone.includes(search))
      );
      if (!match) return false;
    }
    return true;
  });

  renderTable(filteredApplicants);
}

// Setup Filters
function setupFilters() {
  const inputs = ['filterSearch', 'filterYear', 'filterLevel', 'filterMajor', 'filterStatus'];
  inputs.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', applyFilters);
      el.addEventListener('change', () => {
        if (id === 'filterLevel') populateMajorFilter();
        applyFilters();
      });
    }
  });

  document.getElementById('btnResetFilter').addEventListener('click', () => {
    document.getElementById('filterSearch').value = '';
    document.getElementById('filterLevel').value = '';
    document.getElementById('filterStatus').value = '';
    populateMajorFilter();
    applyFilters();
  });
}

// Render Table
function renderTable(data) {
  const tbody = document.getElementById('applicantTableBody');
  const countEl = document.getElementById('tableCount');
  if (countEl) countEl.textContent = `แสดง ${data.length} รายการ`;

  if (!tbody) return;

  if (data.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; padding: 2.5rem; color: #94a3b8;">
          ไม่พบข้อมูลผู้สมัครที่ตรงกับเงื่อนไขการค้นหา
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = data.map((a, idx) => {
    let badgeClass = 'badge-pending';
    if (a.status === 'รอตรวจสอบ') badgeClass = 'badge-pending';
    if (a.status === 'เอกสารไม่ครบ') badgeClass = 'badge-incomplete';
    if (a.status === 'ผ่านการคัดเลือก') badgeClass = 'badge-passed';
    if (a.status === 'มอบตัวแล้ว') badgeClass = 'badge-enrolled';
    if (a.status === 'สละสิทธิ์') badgeClass = 'badge-waived';

    return `
      <tr>
        <td style="font-weight: 600; color: #64748b;">${idx + 1}</td>
        <td>
          <strong style="color: #1e3a8a;">${a.id}</strong>
          ${a.studentId ? `<div style="font-size: 0.8rem; color: #15803d; font-weight: 700;">🎓 ${a.studentId}</div>` : ''}
        </td>
        <td>
          <div style="font-weight: 600; color: #1e293b;">${a.prefix}${a.firstName} ${a.lastName}</div>
          <div style="font-size: 0.8rem; color: #64748b;">🪪 ${formatThaiID(a.nationalId)}</div>
          <div style="font-size: 0.8rem; color: #64748b;">📞 ${formatPhone(a.phone)}</div>
        </td>
        <td>
          <span style="font-weight: 600; color: #0284c7;">${a.level}</span>
          <div style="font-size: 0.85rem; color: #334155;">${a.major}</div>
        </td>
        <td>
          <div style="font-size: 0.85rem; color: #334155;">${a.previousSchool || '-'}</div>
          <div style="font-size: 0.8rem; color: #64748b;">เกรดเฉลี่ย: <strong>${a.gpax || '-'}</strong> (${a.previousSchoolProvince || '-'})</div>
        </td>
        <td>
          <span class="badge ${badgeClass}">${a.status}</span>
          ${a.reviewerNote ? `<div style="font-size: 0.75rem; color: #64748b; margin-top: 0.25rem; max-width: 180px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;" title="${a.reviewerNote}">📝 ${a.reviewerNote}</div>` : ''}
        </td>
        <td>
          <div style="font-size: 0.8rem; color: #64748b;">
            ${new Date(a.createdAt).toLocaleDateString('th-TH')}
          </div>
        </td>
        <td>
          <div style="display: flex; gap: 0.35rem; flex-wrap: wrap;">
            <button onclick="openViewModal('${a.id}')" class="btn btn-secondary btn-sm" title="ดูรายละเอียดและเอกสาร">
              🔍 ดูเอกสาร
            </button>
            <button onclick="openStatusModal('${a.id}')" class="btn btn-warning btn-sm" title="ปรับสถานะการตรวจสอบ">
              ⚙️ ปรับสถานะ
            </button>
            ${a.status !== 'มอบตัวแล้ว' ? `
              <button onclick="openEnrollModal('${a.id}')" class="btn btn-success btn-sm" title="บันทึกมอบตัวและออกรหัสนักศึกษา">
                🎓 มอบตัว
              </button>
            ` : `
              <a href="/print-enrollment.html?id=${a.id}" target="_blank" class="btn btn-primary btn-sm" title="พิมพ์ใบมอบตัว">
                📑 ใบมอบตัว
              </a>
            `}
            <a href="/print-application.html?id=${a.id}" target="_blank" class="btn btn-secondary btn-sm" title="พิมพ์ใบสมัคร">
              📄 ใบสมัคร
            </a>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// Setup Modals
function setupModals() {
  document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
    });
  });

  // Close when clicking outside content
  document.querySelectorAll('.modal-overlay').forEach(m => {
    m.addEventListener('click', (e) => {
      if (e.target === m) m.classList.remove('active');
    });
  });
}

// Open Detail & Document Modal
function openViewModal(id) {
  const applicant = allApplicants.find(a => a.id === id);
  if (!applicant) return;
  currentApplicant = applicant;

  const body = document.getElementById('viewModalBody');
  const files = applicant.files || {};

  body.innerHTML = `
    <div style="display: flex; gap: 1.5rem; margin-bottom: 1.5rem; align-items: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 1rem;">
      <div style="width: 90px; height: 110px; border-radius: 8px; overflow: hidden; background: #e2e8f0; display: flex; align-items: center; justify-content: center; border: 1px solid #cbd5e1;">
        ${files.photo ? `<img src="${files.photo}" style="width: 100%; height: 100%; object-fit: cover;">` : '<span style="font-size: 2rem;">👤</span>'}
      </div>
      <div>
        <h3 style="font-size: 1.4rem; color: #1e3a8a;">${applicant.prefix}${applicant.firstName} ${applicant.lastName}</h3>
        <p style="color: #64748b; font-size: 0.95rem;">
          รหัสใบสมัคร: <strong>${applicant.id}</strong> | เลขบัตร: <strong>${formatThaiID(applicant.nationalId)}</strong>
        </p>
        <p style="font-size: 0.95rem; margin-top: 0.25rem;">
          สมัคร: <strong>${applicant.level} ${applicant.major}</strong> (ปีการศึกษา ${applicant.academicYear})
        </p>
        <div style="margin-top: 0.5rem;">
          สถานะ: <span class="badge ${applicant.status === 'มอบตัวแล้ว' ? 'badge-enrolled' : (applicant.status === 'ผ่านการคัดเลือก' ? 'badge-passed' : 'badge-pending')}">${applicant.status}</span>
          ${applicant.studentId ? `<span style="margin-left: 0.5rem; color: #15803d; font-weight: 700;">รหัสนักศึกษา: ${applicant.studentId}</span>` : ''}
        </div>
      </div>
    </div>

    <!-- Personal & Academic Details -->
    <h4 style="color: #1e3a8a; margin-bottom: 0.75rem; font-size: 1.05rem;">📋 ข้อมูลส่วนตัวและการศึกษา</h4>
    <div class="grid-3" style="background: #f8fafc; padding: 1rem; border-radius: 8px; margin-bottom: 1.25rem; font-size: 0.9rem;">
      <div>วันเกิด: <strong>${formatThaiDate(applicant.birthDate)}</strong></div>
      <div>เพศ: <strong>${applicant.gender || '-'}</strong></div>
      <div>ศาสนา: <strong>${applicant.religion || '-'}</strong></div>
      <div>เบอร์โทรศัพท์: <strong>${formatPhone(applicant.phone)}</strong></div>
      <div>อีเมล: <strong>${applicant.email || '-'}</strong></div>
      <div>เกรดเฉลี่ย (GPAX): <strong>${applicant.gpax || '-'}</strong></div>
      <div style="grid-column: span 2;">สถานศึกษาเดิม: <strong>${applicant.previousSchool || '-'} (${applicant.previousSchoolProvince || '-'})</strong></div>
      <div>ช่องทางทราบข่าว: <strong>${applicant.referralSource || '-'}</strong></div>
      <div style="grid-column: span 3;">ที่อยู่ตามทะเบียนบ้าน: <strong>${applicant.address || '-'}</strong></div>
    </div>

    <!-- Guardian Details -->
    <h4 style="color: #1e3a8a; margin-bottom: 0.75rem; font-size: 1.05rem;">👨‍👩‍👦 ข้อมูลผู้ปกครอง</h4>
    <div class="grid-3" style="background: #f8fafc; padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem; font-size: 0.9rem;">
      <div>ชื่อผู้ปกครอง: <strong>${applicant.guardianName || '-'}</strong></div>
      <div>ความสัมพันธ์: <strong>${applicant.guardianRelation || '-'}</strong></div>
      <div>เบอร์โทรผู้ปกครอง: <strong>${formatPhone(applicant.guardianPhone || '')}</strong></div>
      <div>อาชีพผู้ปกครอง: <strong>${applicant.guardianOccupation || '-'}</strong></div>
    </div>

    <!-- Documents Attachment Section -->
    <h4 style="color: #1e3a8a; margin-bottom: 0.75rem; font-size: 1.05rem;">📎 เอกสารหลักฐานที่แนบ</h4>
    <div class="grid-2">
      <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 0.85rem; background: white;">
        <strong>1. รูปถ่ายหน้าตรง</strong>
        <div style="margin-top: 0.5rem;">
          ${files.photo ? `
            <a href="${files.photo}" target="_blank" class="btn btn-secondary btn-sm">👁️ เปิดดูรูปภาพ</a>
          ` : '<span style="color: #ef4444; font-size: 0.85rem;">✕ ไม่ได้แนบ</span>'}
        </div>
      </div>

      <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 0.85rem; background: white;">
        <strong>2. สำเนาบัตรประชาชน</strong>
        <div style="margin-top: 0.5rem;">
          ${files.idCardCopy ? `
            <a href="${files.idCardCopy}" target="_blank" class="btn btn-secondary btn-sm">👁️ เปิดดูไฟล์บัตร</a>
          ` : '<span style="color: #ef4444; font-size: 0.85rem;">✕ ไม่ได้แนบ</span>'}
        </div>
      </div>

      <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 0.85rem; background: white;">
        <strong>3. สำเนาทะเบียนบ้าน</strong>
        <div style="margin-top: 0.5rem;">
          ${files.houseRegCopy ? `
            <a href="${files.houseRegCopy}" target="_blank" class="btn btn-secondary btn-sm">👁️ เปิดดูสำเนาทะเบียนบ้าน</a>
          ` : '<span style="color: #94a3b8; font-size: 0.85rem;">- ไม่ได้แนบ</span>'}
        </div>
      </div>

      <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 0.85rem; background: white;">
        <strong>4. ใบแสดงผลการเรียน (รบ./ปพ.1)</strong>
        <div style="margin-top: 0.5rem;">
          ${files.transcriptCopy ? `
            <a href="${files.transcriptCopy}" target="_blank" class="btn btn-secondary btn-sm">👁️ เปิดดูผลการเรียน</a>
          ` : '<span style="color: #94a3b8; font-size: 0.85rem;">- ไม่ได้แนบ</span>'}
        </div>
      </div>
    </div>
  `;

  document.getElementById('viewModal').classList.add('active');
}

// Open Status Change Modal
function openStatusModal(id) {
  const applicant = allApplicants.find(a => a.id === id);
  if (!applicant) return;
  currentApplicant = applicant;

  document.getElementById('statusModalApplicantName').textContent = `${applicant.prefix}${applicant.firstName} ${applicant.lastName} (${applicant.id})`;
  document.getElementById('updateStatusSelect').value = applicant.status;
  document.getElementById('reviewerNote').value = applicant.reviewerNote || '';

  // Checkbox for missing docs
  const missing = applicant.missingDocs || [];
  document.getElementById('chkMissingHouse').checked = missing.includes('houseRegCopy');
  document.getElementById('chkMissingTranscript').checked = missing.includes('transcriptCopy');
  document.getElementById('chkMissingPhoto').checked = missing.includes('photo');
  document.getElementById('chkMissingIdCard').checked = missing.includes('idCardCopy');

  document.getElementById('statusModal').classList.add('active');
}

// Save Status Change
async function saveStatusChange() {
  if (!currentApplicant) return;

  const newStatus = document.getElementById('updateStatusSelect').value;
  const reviewerNote = document.getElementById('reviewerNote').value.trim();

  const missingDocs = [];
  if (document.getElementById('chkMissingHouse').checked) missingDocs.push('houseRegCopy');
  if (document.getElementById('chkMissingTranscript').checked) missingDocs.push('transcriptCopy');
  if (document.getElementById('chkMissingPhoto').checked) missingDocs.push('photo');
  if (document.getElementById('chkMissingIdCard').checked) missingDocs.push('idCardCopy');

  try {
    const res = await fetch(`/api/applicants/${currentApplicant.id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: newStatus,
        reviewerNote,
        missingDocs
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'บันทึกสถานะไม่สำเร็จ');

    showToast('ปรับสถานะและส่งข้อความแจ้งเตือนสำเร็จเรียบร้อย', 'success');
    document.getElementById('statusModal').classList.remove('active');
    await fetchApplicants();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// Open Enrollment Modal
function openEnrollModal(id) {
  const applicant = allApplicants.find(a => a.id === id);
  if (!applicant) return;
  currentApplicant = applicant;

  document.getElementById('enrollApplicantName').textContent = `${applicant.prefix}${applicant.firstName} ${applicant.lastName} (${applicant.id})`;
  document.getElementById('enrollLevelMajor').textContent = `${applicant.level} ${applicant.major}`;
  
  // Set default enrollment date as today
  document.getElementById('enrollmentDate').value = new Date().toISOString().split('T')[0];
  document.getElementById('enrollGuardianName').value = applicant.guardianName || '';
  document.getElementById('enrollGuardianPhone').value = applicant.guardianPhone || '';
  document.getElementById('witnessName').value = 'อาจารย์ประจำงานทะเบียน';

  // Preview generated Student ID
  const yearShort = (applicant.academicYear || '2569').slice(-2);
  const code = applicant.majorCode || '20901';
  document.getElementById('customStudentId').placeholder = `เช่น ${yearShort}${code}0001 (เว้นว่างเพื่อสร้างอัตโนมัติ)`;
  document.getElementById('customStudentId').value = '';

  document.getElementById('enrollModal').classList.add('active');
}

// Save Enrollment
async function saveEnrollment() {
  if (!currentApplicant) return;

  const enrollmentDate = document.getElementById('enrollmentDate').value;
  const witnessName = document.getElementById('witnessName').value.trim();
  const customStudentId = document.getElementById('customStudentId').value.trim();
  const guardianName = document.getElementById('enrollGuardianName').value.trim();
  const guardianPhone = document.getElementById('enrollGuardianPhone').value.trim();

  try {
    const res = await fetch(`/api/applicants/${currentApplicant.id}/enroll`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        enrollmentDate,
        witnessName,
        customStudentId,
        guardianName,
        guardianPhone
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'บันทึกการมอบตัวไม่สำเร็จ');

    showToast(`บันทึกมอบตัวสำเร็จ! รหัสนักศึกษา: ${data.data.studentId}`, 'success');
    document.getElementById('enrollModal').classList.remove('active');
    await fetchApplicants();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// Test Notification Modal
function openNotifModal() {
  document.getElementById('notifModal').classList.add('active');
  loadRecentNotifications();
}

async function loadRecentNotifications() {
  const list = document.getElementById('notifList');
  if (!list) return;

  try {
    const res = await fetch('/api/notifications');
    const data = await res.json();
    if (data.length === 0) {
      list.innerHTML = '<p style="color: #94a3b8; text-align: center;">ยังไม่มีประวัติการส่งข้อความ</p>';
      return;
    }

    list.innerHTML = data.slice(0, 10).map(n => `
      <div style="border-bottom: 1px solid #e2e8f0; padding: 0.75rem 0;">
        <div style="display: flex; justify-content: space-between;">
          <strong style="color: #1e3a8a;">${n.title}</strong>
          <span style="font-size: 0.75rem; color: #64748b;">${new Date(n.timestamp).toLocaleTimeString('th-TH')}</span>
        </div>
        <p style="font-size: 0.85rem; color: #334155; margin-top: 0.25rem;">${n.message}</p>
        <span style="font-size: 0.75rem; color: #15803d;">สถานะ: ส่งสำเร็จ (${n.recipient})</span>
      </div>
    `).join('');
  } catch (err) {
    console.error(err);
  }
}

async function sendTestNotification() {
  const msg = document.getElementById('testNotifMsg').value.trim();
  if (!msg) {
    showToast('กรุณากรอกข้อความทดสอบ', 'warning');
    return;
  }

  try {
    const res = await fetch('/api/notify/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: '🔔 แจ้งเตือนทดสอบระบบรับสมัคร',
        message: msg
      })
    });
    const data = await res.json();
    showToast('ส่งการแจ้งเตือนทดสอบสำเร็จ!', 'success');
    loadRecentNotifications();
  } catch (err) {
    showToast('เกิดข้อผิดพลาดในการส่ง', 'error');
  }
}
