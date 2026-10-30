/* ==========================================================================
   Portfolio behaviour (vanilla JS, no dependencies).
   Theme toggle, mobile menu, scroll spy, blur/spring reveal animations,
   page loader, typewriter, scroll-velocity marquee, looping project slider,
   project details modal and a notice for placeholder links.
   ========================================================================== */
(function () {
  'use strict';

  const root = document.documentElement;
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------- Theme ---------- */
  function initTheme() {
    const button = $('[data-theme-toggle]');
    const meta = $('meta[name="theme-color"]');
    const colors = { dark: '#0a0a0a', light: '#fdfdfd' };

    const apply = (theme, persist) => {
      root.setAttribute('data-theme', theme);
      if (meta) meta.setAttribute('content', colors[theme]);
      if (button) button.setAttribute('aria-label', theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
      if (persist) {
        try { localStorage.setItem('theme', theme); } catch (error) { /* storage unavailable */ }
      }
    };

    apply(root.getAttribute('data-theme') === 'light' ? 'light' : 'dark', false);
    if (button) {
      button.addEventListener('click', () => {
        apply(root.getAttribute('data-theme') === 'light' ? 'dark' : 'light', true);
      });
    }
  }

  /* ---------- Mobile menu ---------- */
  function initMenu() {
    const toggle = $('[data-menu-toggle]');
    const panel = $('#nav-panel');
    if (!toggle || !panel) return;

    const set = (open) => {
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      panel.classList.toggle('is-open', open);
    };
    set(false);

    toggle.addEventListener('click', () => set(toggle.getAttribute('aria-expanded') !== 'true'));
    panel.addEventListener('click', (e) => { if (e.target.closest('a')) set(false); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') set(false); });
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.nav')) set(false);
    });
    window.matchMedia('(min-width: 1024px)').addEventListener('change', (e) => { if (e.matches) set(false); });
  }

  /* ---------- Scroll spy ---------- */
  function initScrollSpy() {
    const sections = $$('main section[id]');
    const links = $$('[data-nav]');
    if (!sections.length || !links.length) return;
    let ticking = false;

    const update = () => {
      ticking = false;
      let current = sections[0].id;
      sections.forEach((section) => {
        if (window.scrollY >= section.offsetTop - section.clientHeight / 3) current = section.id;
      });
      links.forEach((link) => {
        const on = link.dataset.nav === current;
        link.classList.toggle('is-active', on);
        if (on) link.setAttribute('aria-current', 'true'); else link.removeAttribute('aria-current');
      });
    };
    window.addEventListener('scroll', () => {
      if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
    }, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  /* ---------- Scroll progress bar ---------- */
  function initProgress() {
    const bar = $('.progress');
    if (!bar) return;
    let ticking = false;
    const update = () => {
      ticking = false;
      const max = root.scrollHeight - window.innerHeight;
      bar.style.setProperty('--p', max > 0 ? Math.min(window.scrollY / max, 1).toFixed(4) : 0);
    };
    window.addEventListener('scroll', () => { if (!ticking) { ticking = true; window.requestAnimationFrame(update); } }, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  /* ---------- Reveal (fade up / down / left / right with blur) ---------- */
  function initReveal() {
    const items = $$('[data-anim]');
    if (!items.length) return;
    if (reduced.matches || !('IntersectionObserver' in window)) {
      items.forEach((el) => el.classList.add('is-in'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    }, { threshold: 0.2 });
    items.forEach((el) => io.observe(el));
  }

  /* ---------- Page loader ---------- */
  function initLoader() {
    const loader = $('.loader');
    const finish = () => {
      root.classList.remove('is-loading');
      if (!loader) return;
      loader.classList.add('is-done');
      window.setTimeout(() => loader.remove(), 900);
    };
    if (!loader || reduced.matches) { finish(); return; }
    window.setTimeout(finish, 2000);
  }

  /* ---------- Typewriter ---------- */
  function initTypewriter() {
    const el = $('[data-typewriter]');
    if (!el || reduced.matches) return;
    const texts = ['Frontend Developer', 'Backend Developer', 'Fullstack Developer'];
    let index = 0, sub = 0, deleting = false;
    el.textContent = '';

    const tick = () => {
      const text = texts[index % texts.length];
      if (!deleting && sub < text.length) sub += 1;
      else if (!deleting && sub === text.length) deleting = true;
      else if (deleting && sub > 0) sub -= 1;
      else { deleting = false; index = (index + 1) % texts.length; }
      el.textContent = text.substring(0, sub);
      window.setTimeout(tick, deleting ? 75 : (sub === text.length ? 1500 : 150));
    };
    window.setTimeout(tick, 2100);
  }

  /* ---------- Scroll-velocity marquee ---------- */
  function initMarquee() {
    const wrap = $('[data-marquee]');
    if (!wrap || reduced.matches) return;
    const rows = $$('.marquee__row', wrap).map((row) => {
      const track = $('.marquee__track', row);
      const first = $('.marquee__copy', track);
      return { track, first, dir: Number(row.dataset.dir) || -1, x: 0, width: 1 };
    });

    const measure = () => {
      rows.forEach((r) => {
        r.width = r.first.offsetWidth || 1;
        const need = Math.ceil(window.innerWidth / r.width) + 2;
        while (r.track.children.length < need) r.track.appendChild(r.first.cloneNode(true));
      });
    };
    measure();
    window.addEventListener('resize', measure);

    let lastY = window.scrollY, last = performance.now(), boost = 0, visible = true;
    new IntersectionObserver((e) => { visible = e[0].isIntersecting; }).observe(wrap);

    const frame = (now) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const y = window.scrollY;
      const v = dt ? (y - lastY) / dt : 0;
      lastY = y;
      boost += (Math.min(Math.abs(v) / 1000, 5) - boost) * 0.1;
      if (visible) {
        rows.forEach((r) => {
          r.x += r.dir * 50 * (1 + boost) * dt;
          const wrapped = ((r.x % r.width) + r.width) % r.width;
          r.track.style.transform = 'translateX(' + (-wrapped) + 'px)';
        });
      }
      window.requestAnimationFrame(frame);
    };
    window.requestAnimationFrame(frame);
  }

  /* ---------- Project slider (looping on small screens) ---------- */
  function initSlider() {
    const slider = $('[data-slider]');
    const group = $('[data-group]', slider || document);
    if (!slider || !group) return;

    const clone = group.cloneNode(true);
    clone.removeAttribute('data-group');
    clone.setAttribute('data-clone', '');
    clone.setAttribute('aria-hidden', 'true');
    $$('a, button', clone).forEach((el) => el.setAttribute('tabindex', '-1'));
    group.parentNode.appendChild(clone);

    const sync = () => slider.classList.toggle('is-looping', !reduced.matches);
    sync();
    reduced.addEventListener('change', sync);
  }

  /* ---------- Project details dialogs ---------- */
  function initDialogs() {
    if (typeof HTMLDialogElement !== 'function') { root.classList.add('no-dialog'); return; }
    let opener = null;

    document.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-dialog-open]');
      if (!btn) return;
      const dlg = document.getElementById(btn.dataset.dialogOpen);
      if (!dlg || dlg.open) return;
      opener = btn;
      dlg.showModal();
      root.classList.add('is-locked');
    });

    $$('dialog.modal').forEach((dlg) => {
      dlg.addEventListener('click', (e) => {
        if (e.target === dlg || e.target.closest('[data-dialog-close]')) dlg.close();
      });
      dlg.addEventListener('close', () => {
        if (!$('dialog[open]')) root.classList.remove('is-locked');
        if (opener && opener.isConnected) opener.focus({ preventScroll: true });
      });
    });
  }

  /* ---------- Year ---------- */
  function initYear() {
    const year = $('#year');
    if (year) year.textContent = String(new Date().getFullYear());
  }

  /* ---------- Placeholder links ----------
     Any link whose href still contains "YOUR_" shows a notice instead of
     navigating to a broken address or opening an empty email. */
  function initPlaceholderLinks() {
    const toast = $('#toast');
    if (!toast) return;
    const home = toast.parentNode;
    let timer;

    const show = (message) => {
      /* An open <dialog> sits in the top layer, so the toast moves inside it to stay visible. */
      const open = $('dialog[open]');
      const host = open || home;
      if (toast.parentNode !== host) host.appendChild(toast);
      toast.textContent = message;
      toast.classList.add('is-visible');
      window.clearTimeout(timer);
      timer = window.setTimeout(() => toast.classList.remove('is-visible'), 3800);
    };
    document.addEventListener('close', (e) => {
      if (e.target.tagName === 'DIALOG' && toast.parentNode === e.target) home.appendChild(toast);
    }, true);

    document.addEventListener('click', (event) => {
      const link = event.target.closest('a[href]');
      if (!link) return;
      const href = link.getAttribute('href') || '';
      if (!href.includes('YOUR_')) return;

      event.preventDefault();
      const token = (href.match(/YOUR_[A-Z0-9_]+/) || ['this placeholder'])[0];
      show(`Placeholder link. Replace ${token} in index.html.`);
    });
  }

  initTheme();
  initMenu();
  initScrollSpy();
  initProgress();
  initReveal();
  initLoader();
  initTypewriter();
  initMarquee();
  initSlider();
  initDialogs();
  initYear();
  initPlaceholderLinks();
  root.classList.add('js-ready');
})();
