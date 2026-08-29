/* ==========================================================================
   Portfolio — อิสระพัฒ ชัยเสรี
   ไม่มี library ภายนอก · vanilla JS ล้วน
   ========================================================================== */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- 1. ธีมสว่าง/มืด (จำค่าไว้ใน localStorage) ---------- */
  var root = document.documentElement;
  var themeBtn = $('#themeBtn');

  try {
    var saved = localStorage.getItem('portfolio-theme');
    if (saved === 'dark' || saved === 'light') root.setAttribute('data-theme', saved);
  } catch (e) { /* โหมดส่วนตัวของเบราว์เซอร์อาจบล็อก — ข้ามไป */ }

  function syncMeta() {
    var m = $('meta[name="theme-color"]');
    if (m) m.setAttribute('content', root.getAttribute('data-theme') === 'dark' ? '#0e0d0b' : '#faf7f2');
  }
  syncMeta();

  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      syncMeta();
      try { localStorage.setItem('portfolio-theme', next); } catch (e) {}
    });
  }

  /* ---------- 2. เมนูมือถือ ---------- */
  var burger = $('#burger');
  var navLinks = $('#navLinks');

  function closeMenu() {
    if (!navLinks) return;
    navLinks.classList.remove('is-open');
    if (burger) {
      burger.setAttribute('aria-expanded', 'false');
      burger.setAttribute('aria-label', 'เปิดเมนู');
    }
  }

  if (burger && navLinks) {
    burger.addEventListener('click', function () {
      var open = navLinks.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      burger.setAttribute('aria-label', open ? 'ปิดเมนู' : 'เปิดเมนู');
    });
    $$('a', navLinks).forEach(function (a) { a.addEventListener('click', closeMenu); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });
    document.addEventListener('click', function (e) {
      if (!navLinks.contains(e.target) && !burger.contains(e.target)) closeMenu();
    });
  }

  /* ---------- 3. แถบความคืบหน้า + เงานาวิเกชัน ---------- */
  var bar = $('#progressBar');
  var nav = $('#nav');
  var ticking = false;

  function onScroll() {
    var h = document.documentElement.scrollHeight - window.innerHeight;
    var pct = h > 0 ? (window.scrollY / h) * 100 : 0;
    if (bar) bar.style.width = Math.min(100, Math.max(0, pct)) + '%';
    if (nav) nav.classList.toggle('is-stuck', window.scrollY > 8);
    ticking = false;
  }

  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; window.requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  /* ---------- 4. เผยเนื้อหาเมื่อเลื่อนถึง + วิ่งแถบทักษะ ---------- */
  var revealables = $$('[data-reveal]');

  if (reduced || !('IntersectionObserver' in window)) {
    revealables.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('is-in');
          io.unobserve(en.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    revealables.forEach(function (el) { io.observe(el); });
  }

  /* ---------- 5. Scroll-spy: ไฮไลต์เมนูตามส่วนที่กำลังดู ---------- */
  var sections = ['about', 'skills', 'projects', 'journey', 'future', 'contact'];

  function setActive(id) {
    $$('.nav__links a').forEach(function (a) {
      a.classList.toggle('is-active', a.getAttribute('href') === '#' + id);
    });
    $$('.rail a').forEach(function (a) {
      a.classList.toggle('is-active', a.getAttribute('data-r') === id);
    });
  }

  if ('IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) setActive(en.target.id);
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });

    sections.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) spy.observe(el);
    });
  }

  /* ---------- 6. ตัวกรอง Skill 8 ตัว ---------- */
  var chips = $$('.chip');
  var items = $$('#s8 .s8__i');
  var empty = $('#s8Empty');

  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      var f = chip.getAttribute('data-f');
      chips.forEach(function (c) { c.classList.toggle('is-on', c === chip); });

      var shown = 0;
      items.forEach(function (li) {
        var hit = (f === 'all' || li.getAttribute('data-cat') === f);
        li.classList.toggle('is-hidden', !hit);
        if (hit) shown++;
      });
      if (empty) empty.hidden = shown !== 0;
    });
  });

  /* ---------- 7. ปุ่มคัดลอกอีเมล ---------- */
  var copyBtn = $('#copyBtn');
  if (copyBtn) {
    copyBtn.addEventListener('click', function () {
      var text = copyBtn.getAttribute('data-copy') || '';
      var label = $('span', copyBtn);

      function done() {
        copyBtn.classList.add('is-done');
        if (label) label.textContent = 'คัดลอกแล้ว';
        setTimeout(function () {
          copyBtn.classList.remove('is-done');
          if (label) label.textContent = 'คัดลอก';
        }, 1800);
      }

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, fallback);
      } else {
        fallback();
      }

      function fallback() {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.cssText = 'position:absolute;left:-9999px';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); done(); } catch (e) {}
        document.body.removeChild(ta);
      }
    });
  }

  /* ---------- 8. นับตัวเลขสถิติใน Hero ---------- */
  var nums = $$('.num[data-count]');
  if (!reduced && 'IntersectionObserver' in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        var target = parseInt(el.getAttribute('data-count'), 10) || 0;
        var start = null;
        var dur = 900;

        function step(ts) {
          if (start === null) start = ts;
          var p = Math.min(1, (ts - start) / dur);
          el.textContent = String(Math.round(target * (1 - Math.pow(1 - p, 3))));
          if (p < 1) window.requestAnimationFrame(step);
        }
        el.textContent = '0';
        window.requestAnimationFrame(step);
        cio.unobserve(el);
      });
    }, { threshold: 0.6 });
    nums.forEach(function (el) { cio.observe(el); });
  }

  /* ---------- 9. ปีปัจจุบันใน footer ---------- */
  var y = $('#year');
  if (y) y.textContent = String(new Date().getFullYear());

})();
