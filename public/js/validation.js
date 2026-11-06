/**
 * Validation & Utility Scripts for Student Admission System
 */

// Thai National ID Checksum Validator (MOD 11)
function checkThaiID(id) {
  if (!id) return false;
  const clean = id.replace(/\D/g, '');
  if (clean.length !== 13) return false;

  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(clean.charAt(i), 10) * (13 - i);
  }
  const checkDigit = (11 - (sum % 11)) % 10;
  return checkDigit === parseInt(clean.charAt(12), 10);
}

// Thai Phone Number Validator (10 digits starting with 0)
function checkThaiPhone(phone) {
  if (!phone) return false;
  const clean = phone.replace(/\D/g, '');
  return clean.length === 10 && clean.startsWith('0');
}

// Format Thai National ID with dashes: X-XXXX-XXXXX-XX-X
function formatThaiID(val) {
  const clean = val.replace(/\D/g, '').substring(0, 13);
  let res = '';
  if (clean.length > 0) res += clean.substring(0, 1);
  if (clean.length > 1) res += '-' + clean.substring(1, 5);
  if (clean.length > 5) res += '-' + clean.substring(5, 10);
  if (clean.length > 10) res += '-' + clean.substring(10, 12);
  if (clean.length > 12) res += '-' + clean.substring(12, 13);
  return res;
}

// Format Phone Number: 0XX-XXX-XXXX
function formatPhone(val) {
  const clean = val.replace(/\D/g, '').substring(0, 10);
  let res = '';
  if (clean.length > 0) res += clean.substring(0, 3);
  if (clean.length > 3) res += '-' + clean.substring(3, 6);
  if (clean.length > 6) res += '-' + clean.substring(6, 10);
  return res;
}

// Show Toast Message
function showToast(message, type = 'info') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'toast';
  
  let bg = '#1e293b';
  let icon = 'ℹ️';
  if (type === 'success') { bg = '#15803d'; icon = '✅'; }
  if (type === 'error') { bg = '#b91c1c'; icon = '⚠️'; }
  if (type === 'warning') { bg = '#b45309'; icon = '🔔'; }

  toast.style.background = bg;
  toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.transition = 'all 0.4s ease';
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(100%)';
    setTimeout(() => toast.remove(), 400);
  }, 4000);
}

// File validation helper
function validateFile(file, maxMb = 5) {
  if (!file) return { valid: false, error: 'ไม่พบไฟล์' };
  
  const validExtensions = ['jpg', 'jpeg', 'png', 'pdf'];
  const ext = file.name.split('.').pop().toLowerCase();
  
  if (!validExtensions.includes(ext)) {
    return { valid: false, error: 'อนุญาตเฉพาะไฟล์ .jpg, .png, .pdf เท่านั้น' };
  }

  const maxBytes = maxMb * 1024 * 1024;
  if (file.size > maxBytes) {
    return { valid: false, error: `ขนาดไฟล์ต้องไม่เกิน ${maxMb} MB (ไฟล์ปัจจุบัน ${(file.size / (1024*1024)).toFixed(2)} MB)` };
  }

  return { valid: true };
}

// Format Date to Thai Format (e.g. 12 เมษายน 2569)
function formatThaiDate(dateStr) {
  if (!dateStr) return '-';
  const months = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];
  
  // If YYYY-MM-DD
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    let year = parseInt(parts[0], 10);
    // If Gregorian (e.g. 2026), convert to BE (+543)
    if (year < 2400) year += 543;
    const month = months[parseInt(parts[1], 10) - 1] || parts[1];
    const day = parseInt(parts[2], 10);
    return `${day} ${month} ${year}`;
  }
  return dateStr;
}
