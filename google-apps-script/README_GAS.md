# คู่มือการติดตั้งและใช้งาน Google Apps Script (ต่อยอดจากใบงานที่ 1)

ระบบนี้ออกแบบมาเพื่อต่อยอดจาก **ใบงานที่ 1: รู้จัก Web App และ Google Apps Script** โดยใช้ **Google Sheets (`StudentPortal_DB`)** เป็นฐานข้อมูล และใช้ Apps Script ในการทำเอกสารอัตโนมัติ (แทนการใช้โปรแกรมเสริม AutoCrat)

---

## 1. การเตรียมไฟล์ใน Google Drive
1. เข้าไปที่ Google Drive ของท่าน
2. เปิดไฟล์ Google Sheets ที่ชื่อว่า **`StudentPortal_DB`**
3. สร้างโฟลเดอร์ใหม่ชื่อ **`Student_Applications_PDF`** (สำหรับเก็บไฟล์ PDF ใบสมัคร) และคัดลอก **Folder ID** จาก URL
4. สร้างไฟล์ Google Docs ต้นแบบใบสมัคร ตั้งชื่อว่า **`Template_ใบสมัครเรียน`**
   - ใส่แท็กตัวแปรสำหรับผสานข้อมูล เช่น `<<APP_ID>>`, `<<NATIONAL_ID>>`, `<<FULL_NAME>>`, `<<LEVEL>>`, `<<MAJOR>>`, `<<GPAX>>`, `<<PHONE>>`
   - คัดลอก **Document ID** จาก URL

---

## 2. การติดตั้งโค้ด Apps Script
1. ใน Google Sheets `StudentPortal_DB` ไปที่เมนู **ส่วนขยาย (Extensions)** → **Apps Script**
2. คัดลอกโค้ดจากไฟล์ `Code.gs` ไปวางแทนที่โค้ดเดิม
3. แก้ไขตัวแปรในส่วน `CONFIG` ด้านบนสุด:
   ```javascript
   const CONFIG = {
     SPREADSHEET_ID: SpreadsheetApp.getActiveSpreadsheet().getId(),
     SHEET_NAME: 'Students',
     DOC_TEMPLATE_ID: 'วาง_Document_ID_ของไฟล์ต้นแบบที่นี่',
     PDF_FOLDER_ID: 'วาง_Folder_ID_ของโฟลเดอร์เก็บ_PDF_ที่นี่',
     LINE_NOTIFY_TOKEN: 'วาง_Token_ของ_LINE_Notify_ที่นี่'
   };
   ```
4. กด **บันทึก (Ctrl + S)**

---

## 3. การเผยแพร่เป็น Web App (Deployment)
1. คลิกปุ่ม **การทำให้ใช้งานได้ (Deploy)** ที่มุมขวาบน → **การทำให้ใช้งานได้ใหม่ (New deployment)**
2. เลือกประเภทเป็น **เว็บแอป (Web App)**
3. ตั้งค่า:
   - **เรียกใช้ในฐานะ (Execute as):** ฉัน (อีเมลของคุณ)
   - **ผู้มีสิทธิ์เข้าถึง (Who has access):** ทุกคน (Anyone)
4. คลิก **ทำให้ใช้งานได้ (Deploy)**
5. อนุญาตสิทธิ์ (Authorize access) ให้กับสคริปต์
6. คัดลอก **Web App URL** สำหรับนำไปเชื่อมต่อกับระบบ Front-end

---

## 4. ข้อดีของการแทนที่ AutoCrat ด้วย Apps Script
| คุณสมบัติ | การใช้ AutoCrat เดิม | การใช้ Apps Script (สคริปต์นี้) |
|---|---|---|
| **ความเร็วในการประมวลผล** | ต้องรอตามรอบเวลา (Trigger ทุก 1 ชม.) | **ทันที (Real-time)** ทันทีที่กดส่งใบสมัคร |
| **ความเสถียร** | มีข้อจำกัดโควตาของ Add-on บุคคลภายนอก | รันตรงผ่าน Google Workspace API โดยไม่มีลายน้ำ |
| **การแจ้งเตือน** | ส่งได้เฉพาะอีเมล | รองรับทั้ง **LINE Notify**, Email และอัปเดตสถานะในชีต |
