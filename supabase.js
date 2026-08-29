/* ==========================================================================
   เชื่อม Supabase ผ่าน REST API ตรงๆ (ไม่ต้องโหลด library ภายนอก)
   ใช้ตารางชุดเดียวกับเว็บ Put SSR.SHOP — แยกด้วยคอลัมน์ source_site

     contact_submissions : name, contact, product_interest, message, source_site
     page_visits         : page_path, source_site

   ค่าเชื่อมต่ออยู่ในไฟล์ supabase-config.js (โหลดก่อนไฟล์นี้)
   ถ้ายังไม่ได้ใส่ค่า เว็บจะทำงานปกติทุกอย่าง แค่ฟอร์มจะบอกให้ส่งอีเมลแทน
   ========================================================================== */
(function () {
  'use strict';

  var SB = window.SUPABASE_CONFIG || {};
  var BASE = (SB.url || '').replace(/\/+$/, '');
  var KEY = SB.anonKey || '';
  var SITE = SB.sourceSite || 'portfolio';

  /* ค่าตั้งต้นที่ยังไม่ได้แก้ ให้ถือว่ายังไม่พร้อมใช้งาน */
  var READY = !!(BASE && KEY) &&
              BASE.indexOf('ใส่_') === -1 &&
              KEY.indexOf('ใส่_') === -1 &&
              /^https?:\/\//.test(BASE);

  function sbInsert(table, row) {
    if (!READY) return Promise.reject(new Error('ยังไม่ได้ตั้งค่า Supabase ใน supabase-config.js'));

    row.source_site = SITE;

    return fetch(BASE + '/rest/v1/' + table, {
      method: 'POST',
      headers: {
        'apikey': KEY,
        'Authorization': 'Bearer ' + KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(row)
    }).then(function (res) {
      if (res.ok) return true;
      return res.text().then(function (t) {
        throw new Error('Supabase ' + res.status + ': ' + t.slice(0, 200));
      });
    });
  }

  /* ---------- 1. นับผู้เข้าชมแบบไม่ระบุตัวตน ----------
     เก็บแค่ page_path กับ source_site ตามสคีมาที่ใช้ร่วมกับเว็บร้าน
     ไม่มี IP ไม่มี user-agent ไม่มีคุกกี้ ไม่มี id ติดตามข้ามเว็บ
     นับ 1 ครั้งต่อ 1 แท็บที่เปิด กัน refresh รัวๆ แล้วยอดเฟ้อ */
  function trackVisit() {
    if (!READY) return;

    var key = 'pv:' + SITE + ':' + location.pathname;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, '1');
    } catch (e) { /* โหมดส่วนตัวบล็อก storage — ยอมนับซ้ำดีกว่าไม่นับ */ }

    sbInsert('page_visits', {
      page_path: (location.pathname || '/').slice(0, 300)
    })['catch'](function (err) {
      /* ตัวนับพังห้ามกระทบการใช้งานเว็บ */
      if (window.console && console.debug) console.debug('[page_visits]', err.message);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', trackVisit);
  } else {
    trackVisit();
  }

  /* ---------- 2. ฟอร์มติดต่อ ---------- */
  var form = document.getElementById('contactForm');
  if (!form) return;

  var statusEl = document.getElementById('formStatus');
  var btn = document.getElementById('formSubmit');
  var btnLabel = btn ? btn.querySelector('.fbtn__t') : null;
  var MAIL = 'itsarapat.chaiseree@gmail.com';

  function setStatus(kind, msg) {
    if (!statusEl) return;
    statusEl.className = 'fstatus is-' + kind;
    statusEl.textContent = msg;
    statusEl.hidden = false;
  }

  function fieldError(name, msg) {
    var el = form.querySelector('[data-err="' + name + '"]');
    var input = form.elements[name];
    if (el) { el.textContent = msg || ''; el.hidden = !msg; }
    if (input) input.setAttribute('aria-invalid', msg ? 'true' : 'false');
    return !msg;
  }

  /* ช่อง contact รับได้ทั้งอีเมลและ LINE ID — ถ้ามี @ ให้ตรวจแบบอีเมล */
  function contactOk(v) {
    if (v.indexOf('@') !== -1) return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
    return v.length >= 3;
  }

  function validate(d) {
    var ok = true;
    ok = fieldError('name', d.name.length >= 2 ? '' : 'กรุณากรอกชื่อ (อย่างน้อย 2 ตัวอักษร)') && ok;
    ok = fieldError('contact', contactOk(d.contact) ? '' : 'กรอกอีเมลให้ถูกรูปแบบ หรือใส่ LINE ID ก็ได้ครับ') && ok;
    ok = fieldError('message', d.message.length >= 10 ? '' : 'ช่วยเขียนอย่างน้อย 10 ตัวอักษรครับ') && ok;
    return ok;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var d = {
      name: (form.elements.name.value || '').trim(),
      contact: (form.elements.contact.value || '').trim(),
      topic: (form.elements.product_interest.value || '').trim(),
      message: (form.elements.message.value || '').trim(),
      website: (form.elements.website.value || '').trim()   /* honeypot */
    };

    /* บอทมักกรอกทุกช่องรวมถึงช่องที่ซ่อนไว้ — แกล้งว่าสำเร็จแล้วจบ */
    if (d.website) { setStatus('ok', 'ส่งข้อความเรียบร้อยแล้ว ขอบคุณครับ'); form.reset(); return; }

    if (!validate(d)) {
      setStatus('err', 'กรุณาตรวจสอบข้อมูลที่กรอกอีกครั้ง');
      var bad = form.querySelector('[aria-invalid="true"]');
      if (bad) bad.focus();
      return;
    }

    if (!READY) {
      setStatus('err', 'ระบบฟอร์มยังไม่พร้อมใช้งาน รบกวนส่งอีเมลมาที่ ' + MAIL + ' แทนนะครับ');
      return;
    }

    if (btn) { btn.disabled = true; btn.classList.add('is-loading'); }
    if (btnLabel) btnLabel.textContent = 'กำลังส่ง...';
    setStatus('wait', 'กำลังส่งข้อความ...');

    sbInsert('contact_submissions', {
      name: d.name.slice(0, 100),
      contact: d.contact.slice(0, 200),
      product_interest: d.topic ? d.topic.slice(0, 100) : null,
      message: d.message.slice(0, 2000)
    }).then(function () {
      form.reset();
      setStatus('ok', 'ส่งข้อความเรียบร้อยแล้ว ขอบคุณครับ — จะตอบกลับภายใน 24 ชั่วโมง');
    })['catch'](function (err) {
      setStatus('err', 'ส่งไม่สำเร็จ รบกวนส่งอีเมลมาที่ ' + MAIL + ' แทนนะครับ');
      if (window.console && console.debug) console.debug('[contact_submissions]', err.message);
    })['finally'](function () {
      if (btn) { btn.disabled = false; btn.classList.remove('is-loading'); }
      if (btnLabel) btnLabel.textContent = 'ส่งข้อความ';
    });
  });

  /* ล้าง error ของช่องนั้นทันทีที่เริ่มพิมพ์แก้ */
  ['name', 'contact', 'message'].forEach(function (n) {
    var el = form.elements[n];
    if (el) el.addEventListener('input', function () { fieldError(n, ''); });
  });

})();
