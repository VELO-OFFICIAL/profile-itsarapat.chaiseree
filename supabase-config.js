/* ============================================================
   ค่าเชื่อมต่อ Supabase — ไฟล์นี้ใช้ "ค่าเดียวกัน" ทั้ง 3 เว็บ
   คัดลอกไฟล์นี้ไปวางในอีก 2 โฟลเดอร์ได้เลย
   แก้แค่บรรทัด sourceSite ให้เป็นชื่อเว็บนั้นๆ
   ============================================================

   เอาค่า 2 ตัวนี้มาจากไหน:
   Supabase → เลือกโปรเจกต์ → Settings (เฟือง) → API Keys
     • Project URL       →  ใส่ในช่อง url
     • anon / publishable →  ใส่ในช่อง anonKey

   ⚠️ ห้ามใช้ค่าที่ชื่อ service_role หรือ secret เด็ดขาด
      ค่านั้นข้ามระบบความปลอดภัยทั้งหมด ถ้าหลุดจะแก้ไข/ลบข้อมูลได้ทุกอย่าง
      ใช้เฉพาะ anon / publishable เท่านั้น (ตัวนี้ปลอดภัยที่จะอยู่ในหน้าเว็บ)
   ============================================================ */

window.SUPABASE_CONFIG = {

  // 1) Project URL — หน้าตาแบบ https://abcdefghijk.supabase.co
  url: 'https://gerxxzdapokukvabhvdl.supabase.co',

  // 2) anon / publishable key — ข้อความยาวๆ ขึ้นต้นด้วย sb_publishable_ หรือ eyJ
  anonKey: 'sb_publishable_i395SDmyxIH0a704v_KJ4A_wlcCNO2M',

  // 3) ชื่อเว็บนี้ — ใช้แยกข้อมูลของแต่ละเว็บในฐานข้อมูลเดียวกัน
  //    เว็บนี้คือ 'portfolio'  (เว็บร้านใช้ 'put-ssr-shop')
  sourceSite: 'portfolio'

};
