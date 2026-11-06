/**
 * Front-end Application logic for Applicants
 */

let systemConfig = null;

// Initialize on DOM Ready
document.addEventListener('DOMContentLoaded', async () => {
  await loadConfig();
  setupValidationListeners();
  setupUploadBoxes();
  setupFormSubmit();
  setupStatusSearch();

  // If URL has ?checkId=... auto search
  const urlParams = new URLSearchParams(window.location.search);
  const checkId = urlParams.get('checkId');
  if (checkId) {
    const input = document.getElementById('searchNationalId');
    if (input) {
      input.value = checkId;
      document.getElementById('btnSearchStatus').click();
    }
  }
});

// Load config from DataService
async function loadConfig() {
  try {
    systemConfig = await DataService.getConfig();
    populateMajorDropdown();
  } catch (err) {
    console.error('Failed to load system config:', err);
  }
}

// Populate Majors based on Level (ปวช. or ปวส.)
function populateMajorDropdown() {
  const levelSelect = document.getElementById('level');
  const majorSelect = document.getElementById('major');
  if (!levelSelect || !majorSelect || !systemConfig) return;

  const selectedLevel = levelSelect.value || 'ปวช.';
  const majors = (systemConfig.majors && systemConfig.majors[selectedLevel]) ? systemConfig.majors[selectedLevel] : [];

  majorSelect.innerHTML = '<option value="">-- กรุณาเลือกสาขาวิชา --</option>';
  majors.forEach(m => {
    const opt = document.createElement('option');
    opt.value = m.name;
    opt.dataset.code = m.code;
    opt.textContent = `[${m.code}] ${m.name}`;
    majorSelect.appendChild(opt);
  });
}

// Validation listeners
function setupValidationListeners() {
  const nationalIdInput = document.getElementById('nationalId');
  const nationalIdFeedback = document.getElementById('nationalIdFeedback');
  const phoneInput = document.getElementById('phone');
  const phoneFeedback = document.getElementById('phoneFeedback');
  const levelSelect = document.getElementById('level');

  if (levelSelect) {
    levelSelect.addEventListener('change', populateMajorDropdown);
  }

  if (nationalIdInput) {
    nationalIdInput.addEventListener('input', (e) => {
      const clean = e.target.value.replace(/\D/g, '');
      e.target.value = formatThaiID(clean);

      if (clean.length === 13) {
        if (checkThaiID(clean)) {
          nationalIdInput.classList.remove('is-invalid');
          nationalIdInput.classList.add('is-valid');
          nationalIdFeedback.className = 'validation-feedback valid';
          nationalIdFeedback.textContent = '✓ เลขบัตรประจำตัวประชาชนถูกต้อง';
        } else {
          nationalIdInput.classList.remove('is-valid');
          nationalIdInput.classList.add('is-invalid');
          nationalIdFeedback.className = 'validation-feedback invalid';
          nationalIdFeedback.textContent = '✕ เลขบัตรประจำตัวประชาชนไม่ถูกต้องตามหลักตรวจสอบ (Check Digit ผิด)';
        }
      } else if (clean.length > 0) {
        nationalIdInput.classList.remove('is-valid');
        nationalIdInput.classList.add('is-invalid');
        nationalIdFeedback.className = 'validation-feedback invalid';
        nationalIdFeedback.textContent = `กรุณากรอกให้ครบ 13 หลัก (ปัจจุบัน ${clean.length} หลัก)`;
      } else {
        nationalIdInput.classList.remove('is-valid', 'is-invalid');
        nationalIdFeedback.className = 'validation-feedback';
        nationalIdFeedback.textContent = '';
      }
    });
  }

  if (phoneInput) {
    phoneInput.addEventListener('input', (e) => {
      const clean = e.target.value.replace(/\D/g, '');
      e.target.value = formatPhone(clean);

      if (clean.length === 10) {
        if (checkThaiPhone(clean)) {
          phoneInput.classList.remove('is-invalid');
          phoneInput.classList.add('is-valid');
          phoneFeedback.className = 'validation-feedback valid';
          phoneFeedback.textContent = '✓ รูปแบบเบอร์โทรศัพท์ถูกต้อง';
        } else {
          phoneInput.classList.remove('is-valid');
          phoneInput.classList.add('is-invalid');
          phoneFeedback.className = 'validation-feedback invalid';
          phoneFeedback.textContent = '✕ เบอร์โทรศัพท์ต้องขึ้นต้นด้วย 0';
        }
      } else if (clean.length > 0) {
        phoneInput.classList.remove('is-valid');
        phoneInput.classList.add('is-invalid');
        phoneFeedback.className = 'validation-feedback invalid';
        phoneFeedback.textContent = `กรุณากรอกให้ครบ 10 หลัก (ปัจจุบัน ${clean.length} หลัก)`;
      } else {
        phoneInput.classList.remove('is-valid', 'is-invalid');
        phoneFeedback.className = 'validation-feedback';
        phoneFeedback.textContent = '';
      }
    });
  }
}

// File Upload Drag & Drop & Validation
function setupUploadBoxes() {
  const fileBoxes = document.querySelectorAll('.upload-box');
  fileBoxes.forEach(box => {
    const input = box.querySelector('input[type="file"]');
    const nameDisplay = box.querySelector('.upload-filename');

    box.addEventListener('click', () => input.click());

    input.addEventListener('change', () => {
      if (input.files && input.files[0]) {
        const file = input.files[0];
        const res = validateFile(file);
        if (!res.valid) {
          showToast(res.error, 'error');
          input.value = '';
          box.classList.remove('has-file');
          if (nameDisplay) nameDisplay.textContent = 'ยังไม่ได้เลือกไฟล์';
          return;
        }

        box.classList.add('has-file');
        if (nameDisplay) {
          nameDisplay.textContent = `✓ ${file.name} (${(file.size / (1024 * 1024)).toFixed(2)} MB)`;
        }
      }
    });

    ['dragenter', 'dragover'].forEach(eventName => {
      box.addEventListener(eventName, (e) => {
        e.preventDefault();
        box.style.borderColor = '#2563eb';
      }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      box.addEventListener(eventName, (e) => {
        e.preventDefault();
        box.style.borderColor = '#cbd5e1';
      }, false);
    });

    box.addEventListener('drop', (e) => {
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        input.files = e.dataTransfer.files;
        input.dispatchEvent(new Event('change'));
      }
    });
  });
}

// Form Submit Handler
function setupFormSubmit() {
  const form = document.getElementById('applicationForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Validate Thai ID
    const nationalId = document.getElementById('nationalId').value.replace(/\D/g, '');
    if (!checkThaiID(nationalId)) {
      showToast('กรุณากรอกเลขประจำตัวประชาชน 13 หลักให้ถูกต้องตามหลักการคำนวณ', 'error');
      document.getElementById('nationalId').focus();
      return;
    }

    // Validate Phone
    const phone = document.getElementById('phone').value.replace(/\D/g, '');
    if (!checkThaiPhone(phone)) {
      showToast('กรุณากรอกเบอร์โทรศัพท์ 10 หลักให้ถูกต้อง', 'error');
      document.getElementById('phone').focus();
      return;
    }

    // Validate Major selection
    const majorSelect = document.getElementById('major');
    if (!majorSelect.value) {
      showToast('กรุณาเลือกสาขาวิชาที่ต้องการสมัคร', 'error');
      majorSelect.focus();
      return;
    }

    const photoInput = document.getElementById('filePhoto');
    const idCardInput = document.getElementById('fileIdCard');
    const houseRegInput = document.getElementById('fileHouseReg');
    const transcriptInput = document.getElementById('fileTranscript');

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '⏳ กำลังบันทึกข้อมูลและอัปโหลดเอกสาร...';

    const formData = new FormData(form);
    formData.set('nationalId', nationalId);
    formData.set('phone', phone);

    const selectedOption = majorSelect.options[majorSelect.selectedIndex];
    if (selectedOption && selectedOption.dataset.code) {
      formData.set('majorCode', selectedOption.dataset.code);
    }

    const fileInputs = {
      photo: photoInput.files ? photoInput.files[0] : null,
      idCardCopy: idCardInput.files ? idCardInput.files[0] : null,
      houseRegCopy: houseRegInput.files ? houseRegInput.files[0] : null,
      transcriptCopy: transcriptInput.files ? transcriptInput.files[0] : null
    };

    try {
      const newApplicant = await DataService.submitApplication(formData, fileInputs);
      showToast('สมัครเรียนสำเร็จเรียบร้อย!', 'success');
      renderSubmissionSuccess(newApplicant);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    }
  });
}

// Display registration result
function renderSubmissionSuccess(applicant) {
  const formCard = document.getElementById('formCard');
  if (!formCard) return;

  formCard.innerHTML = `
    <div style="text-align: center; padding: 2.5rem 1.5rem;">
      <div style="width: 72px; height: 72px; background: #dcfce7; color: #16a34a; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2.5rem; margin: 0 auto 1.5rem auto;">
        ✓
      </div>
      <h2 style="font-size: 1.8rem; color: #1e293b; margin-bottom: 0.5rem;">ยื่นใบสมัครสำเร็จเรียบร้อย!</h2>
      <p style="color: #64748b; font-size: 1.05rem; margin-bottom: 1.5rem;">
        ระบบได้บันทึกข้อมูลการสมัครของ <strong>${applicant.prefix}${applicant.firstName} ${applicant.lastName}</strong> เข้าสู่ระบบแล้ว
      </p>

      <div style="background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 1.5rem; max-width: 550px; margin: 0 auto 2rem auto; text-align: left;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 0.75rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.5rem;">
          <span style="color: #64748b;">รหัสใบสมัคร:</span>
          <strong style="color: #1e3a8a; font-size: 1.1rem;">${applicant.id}</strong>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 0.75rem;">
          <span style="color: #64748b;">เลขประจำตัวประชาชน:</span>
          <strong>${formatThaiID(applicant.nationalId)}</strong>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 0.75rem;">
          <span style="color: #64748b;">ระดับชั้นที่สมัคร:</span>
          <strong>${applicant.level}</strong>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 0.75rem;">
          <span style="color: #64748b;">สาขาวิชา:</span>
          <strong>${applicant.major}</strong>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="color: #64748b;">สถานะปัจจุบัน:</span>
          <span class="badge badge-pending">รอตรวจสอบเอกสาร</span>
        </div>
      </div>

      <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
        <a href="./print-application.html?id=${applicant.id}" target="_blank" class="btn btn-primary">
          📄 พิมพ์/ดาวน์โหลดใบสมัคร (PDF)
        </a>
        <button onclick="window.location.href='#status-check'; document.getElementById('searchNationalId').value='${applicant.nationalId}'; document.getElementById('btnSearchStatus').click();" class="btn btn-secondary">
          🔍 ตรวจสอบสถานะการสมัคร
        </button>
        <button onclick="window.location.reload();" class="btn btn-secondary">
          + สมัครใหม่อีกรายการ
        </button>
      </div>
    </div>
  `;
  window.scrollTo({ top: formCard.offsetTop - 80, behavior: 'smooth' });
}

// Status Search Logic
function setupStatusSearch() {
  const searchInput = document.getElementById('searchNationalId');
  const searchBtn = document.getElementById('btnSearchStatus');
  const resultContainer = document.getElementById('statusResult');

  if (!searchBtn || !searchInput) return;

  searchInput.addEventListener('input', (e) => {
    e.target.value = formatThaiID(e.target.value.replace(/\D/g, ''));
  });

  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') searchBtn.click();
  });

  searchBtn.addEventListener('click', async () => {
    const raw = searchInput.value.replace(/\D/g, '');
    if (!raw) {
      showToast('กรุณากรอกเลขประจำตัวประชาชน 13 หลัก', 'warning');
      return;
    }

    resultContainer.innerHTML = `
      <div style="text-align: center; padding: 2rem; color: #64748b;">
        ⏳ กำลังค้นหาข้อมูล...
      </div>
    `;

    try {
      const applicant = await DataService.getApplicant(raw);
      renderStatusCard(applicant);
    } catch (err) {
      resultContainer.innerHTML = `
        <div class="card" style="text-align: center; padding: 2rem; border-color: #fecaca; background: #fff5f5;">
          <div style="font-size: 2rem; color: #ef4444; margin-bottom: 0.5rem;">✕</div>
          <h3 style="color: #991b1b; margin-bottom: 0.5rem;">ไม่พบข้อมูลการสมัคร</h3>
          <p style="color: #7f1d1d; font-size: 0.95rem;">
            ${err.message} หรืออาจจะยังไม่ได้ส่งใบสมัครเข้าสู่ระบบ
          </p>
          <div style="margin-top: 1rem;">
            <a href="#registration" class="btn btn-primary btn-sm">คลิกที่นี่เพื่อกรอกใบสมัคร</a>
          </div>
        </div>
      `;
    }
  });
}

// Render Status Card
function renderStatusCard(applicant) {
  const container = document.getElementById('statusResult');
  if (!container) return;

  let badgeClass = 'badge-pending';
  let step1Class = 'completed';
  let step2Class = '';
  let step3Class = '';
  let step4Class = '';

  if (applicant.status === 'รอตรวจสอบ') {
    badgeClass = 'badge-pending';
    step2Class = 'active';
  } else if (applicant.status === 'เอกสารไม่ครบ') {
    badgeClass = 'badge-incomplete';
    step2Class = 'rejected';
  } else if (applicant.status === 'ผ่านการคัดเลือก') {
    badgeClass = 'badge-passed';
    step2Class = 'completed';
    step3Class = 'active';
  } else if (applicant.status === 'มอบตัวแล้ว') {
    badgeClass = 'badge-enrolled';
    step2Class = 'completed';
    step3Class = 'completed';
    step4Class = 'completed';
  } else if (applicant.status === 'สละสิทธิ์') {
    badgeClass = 'badge-waived';
  }

  // Document fix section (if status === 'เอกสารไม่ครบ')
  let fixSection = '';
  if (applicant.status === 'เอกสารไม่ครบ') {
    fixSection = `
      <div style="background: #fef2f2; border: 1.5px solid #fecaca; border-radius: 10px; padding: 1.25rem; margin-top: 1.5rem;">
        <h4 style="color: #991b1b; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem;">
          ⚠️ ข้อความจากเจ้าหน้าที่ผู้ตรวจสอบเอกสาร:
        </h4>
        <p style="color: #b91c1c; font-size: 0.95rem; margin-bottom: 1rem;">
          "${applicant.reviewerNote || 'เอกสารของท่านยังไม่ครบถ้วนหรือไม่ชัดเจน กรุณาแนบไฟล์ส่งใหม่อีกครั้ง'}"
        </p>

        <form id="reuploadForm" style="background: white; padding: 1.25rem; border-radius: 8px; border: 1px solid #fecaca;">
          <h5 style="margin-bottom: 0.75rem; color: #1e293b;">อัปโหลดเอกสารที่ต้องการแก้ไข/ส่งเพิ่มเติม:</h5>
          <div class="grid-2" style="margin-bottom: 1rem;">
            <div>
              <label class="form-label">รูปถ่ายหน้าตรง</label>
              <input type="file" id="rePhoto" class="form-control" accept=".jpg,.jpeg,.png,.pdf">
            </div>
            <div>
              <label class="form-label">สำเนาบัตรประชาชน</label>
              <input type="file" id="reIdCard" class="form-control" accept=".jpg,.jpeg,.png,.pdf">
            </div>
            <div>
              <label class="form-label">สำเนาทะเบียนบ้าน</label>
              <input type="file" id="reHouseReg" class="form-control" accept=".jpg,.jpeg,.png,.pdf">
            </div>
            <div>
              <label class="form-label">ใบแสดงผลการเรียน (รบ./ปพ.1)</label>
              <input type="file" id="reTranscript" class="form-control" accept=".jpg,.jpeg,.png,.pdf">
            </div>
          </div>
          <button type="button" onclick="submitReupload('${applicant.id}')" class="btn btn-warning" style="width: 100%;">
            📤 ยืนยันการส่งเอกสารเพิ่มเติม
          </button>
        </form>
      </div>
    `;
  }

  container.innerHTML = `
    <div class="status-result-card">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 1.25rem;">
        <div>
          <span style="font-size: 0.85rem; color: #64748b;">รหัสประจำตัวผู้สมัคร</span>
          <h3 style="font-size: 1.5rem; color: #1e3a8a; font-weight: 700;">${applicant.id}</h3>
          <p style="font-size: 1.05rem; font-weight: 600; color: #1e293b; margin-top: 0.25rem;">
            ${applicant.prefix}${applicant.firstName} ${applicant.lastName}
          </p>
        </div>
        <div style="text-align: right;">
          <span class="badge ${badgeClass}" style="font-size: 1rem; padding: 0.4rem 1rem;">
            ${applicant.status}
          </span>
          ${applicant.studentId ? `
            <div style="margin-top: 0.5rem; font-size: 0.95rem; color: #15803d; font-weight: 700;">
              🎓 รหัสนักศึกษา: ${applicant.studentId}
            </div>
          ` : ''}
        </div>
      </div>

      <!-- Timeline -->
      <div class="status-timeline">
        <div class="timeline-step ${step1Class}">
          <div class="step-circle">1</div>
          <div class="step-title">ยื่นใบสมัคร</div>
        </div>
        <div class="timeline-step ${step2Class}">
          <div class="step-circle">2</div>
          <div class="step-title">ตรวจเอกสาร</div>
        </div>
        <div class="timeline-step ${step3Class}">
          <div class="step-circle">3</div>
          <div class="step-title">ผ่านการคัดเลือก</div>
        </div>
        <div class="timeline-step ${step4Class}">
          <div class="step-circle">4</div>
          <div class="step-title">มอบตัวเสร็จสิ้น</div>
        </div>
      </div>

      <!-- Detail Grid -->
      <div class="grid-3" style="background: #f8fafc; padding: 1.25rem; border-radius: 10px; margin-bottom: 1.5rem;">
        <div>
          <span style="font-size: 0.8rem; color: #64748b;">ระดับชั้น</span>
          <div style="font-weight: 600; color: #1e293b;">${applicant.level}</div>
        </div>
        <div>
          <span style="font-size: 0.8rem; color: #64748b;">สาขาวิชา</span>
          <div style="font-weight: 600; color: #1e293b;">${applicant.major}</div>
        </div>
        <div>
          <span style="font-size: 0.8rem; color: #64748b;">ปีการศึกษา</span>
          <div style="font-weight: 600; color: #1e293b;">${applicant.academicYear}</div>
        </div>
        <div>
          <span style="font-size: 0.8rem; color: #64748b;">โรงเรียนเดิม</span>
          <div style="font-weight: 600; color: #1e293b;">${applicant.previousSchool || '-'}</div>
        </div>
        <div>
          <span style="font-size: 0.8rem; color: #64748b;">เกรดเฉลี่ย (GPAX)</span>
          <div style="font-weight: 600; color: #1e293b;">${applicant.gpax || '-'}</div>
        </div>
        <div>
          <span style="font-size: 0.8rem; color: #64748b;">เบอร์โทรศัพท์</span>
          <div style="font-weight: 600; color: #1e293b;">${formatPhone(applicant.phone)}</div>
        </div>
      </div>

      ${applicant.reviewerNote && applicant.status !== 'เอกสารไม่ครบ' ? `
        <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 1rem; border-radius: 6px; margin-bottom: 1.5rem;">
          <strong style="color: #1e40af;">ข้อความจากเจ้าหน้าที่:</strong>
          <p style="color: #1e3a8a; margin-top: 0.25rem;">${applicant.reviewerNote}</p>
        </div>
      ` : ''}

      ${fixSection}

      <!-- Actions -->
      <div style="display: flex; gap: 1rem; flex-wrap: wrap; margin-top: 1.5rem;">
        <a href="./print-application.html?id=${applicant.id}" target="_blank" class="btn btn-primary">
          📄 พิมพ์/ดาวน์โหลดใบสมัคร (PDF)
        </a>
        ${(applicant.status === 'ผ่านการคัดเลือก' || applicant.status === 'มอบตัวแล้ว') ? `
          <a href="./print-enrollment.html?id=${applicant.id}" target="_blank" class="btn btn-success">
            📑 พิมพ์ใบมอบตัวและสัญญาค้ำประกัน (PDF)
          </a>
        ` : ''}
      </div>
    </div>
  `;
}

// Applicant re-upload handler
async function submitReupload(applicantId) {
  const photo = document.getElementById('rePhoto')?.files?.[0];
  const idCardCopy = document.getElementById('reIdCard')?.files?.[0];
  const houseRegCopy = document.getElementById('reHouseReg')?.files?.[0];
  const transcriptCopy = document.getElementById('reTranscript')?.files?.[0];

  if (!photo && !idCardCopy && !houseRegCopy && !transcriptCopy) {
    showToast('กรุณาเลือกไฟล์ที่ต้องการส่งใหม่อย่างน้อย 1 ไฟล์', 'warning');
    return;
  }

  try {
    const res = await DataService.updateDocuments(applicantId, { photo, idCardCopy, houseRegCopy, transcriptCopy });
    showToast('ส่งเอกสารเพิ่มเติมเรียบร้อยแล้ว สถานะเปลี่ยนเป็นรอตรวจสอบ', 'success');
    renderStatusCard(res.data || res);
  } catch (err) {
    showToast(err.message, 'error');
  }
}
