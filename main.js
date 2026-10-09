/* Jovia Health · coming-soon site */
(() => {
  const doc = document.documentElement;
  doc.classList.add('js');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Nav state ---------- */
  const nav = document.querySelector('.nav');
  const onScrollNav = () => nav.classList.toggle('is-scrolled', window.scrollY > 24);
  onScrollNav();
  window.addEventListener('scroll', onScrollNav, { passive: true });

  /* ---------- Scroll reveals ---------- */
  const reveals = document.querySelectorAll('.reveal');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    reveals.forEach(el => el.classList.add('is-in'));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach(el => io.observe(el));
  }

  /* ---------- Subtle parallax ---------- */
  const px = [...document.querySelectorAll('[data-parallax]')];
  if (!reduceMotion && px.length) {
    let ticking = false;
    const update = () => {
      const vh = window.innerHeight;
      px.forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        const speed = parseFloat(el.dataset.parallax) || 0;
        const offset = (r.top + r.height / 2 - vh / 2) * speed;
        el.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
      });
      ticking = false;
    };
    window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  /* ---------- Button glow follows cursor ---------- */
  document.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('pointermove', e => {
      const r = btn.getBoundingClientRect();
      btn.style.setProperty('--mx', `${e.clientX - r.left}px`);
      btn.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  });

  /* ---------- Videos: lazy play when visible, honour reduced motion ---------- */
  const videos = document.querySelectorAll('video');
  const heroVideo = document.querySelector('.hero__video');
  const toggle = document.querySelector('.video-toggle');
  let userPaused = false;
  if (reduceMotion) {
    videos.forEach(v => { v.removeAttribute('autoplay'); v.pause(); });
    userPaused = true;
    toggle?.setAttribute('aria-pressed', 'true');
    toggle?.setAttribute('aria-label', 'Play background video');
  } else if ('IntersectionObserver' in window) {
    const vio = new IntersectionObserver(entries => {
      entries.forEach(({ target: v, isIntersecting }) => {
        if (isIntersecting && !(v === heroVideo && userPaused)) {
          if (v.preload === 'none') v.preload = 'auto';
          v.play().catch(() => {});
        } else if (!isIntersecting) v.pause();
      });
    }, { threshold: 0.15 });
    videos.forEach(v => vio.observe(v));
  }
  toggle?.addEventListener('click', () => {
    userPaused = !heroVideo.paused ? true : false;
    if (userPaused) heroVideo.pause(); else heroVideo.play().catch(() => {});
    toggle.setAttribute('aria-pressed', String(userPaused));
    toggle.setAttribute('aria-label', userPaused ? 'Play background video' : 'Pause background video');
  });

  /* ---------- FAQ: one open at a time ---------- */
  const qas = document.querySelectorAll('.qa');
  qas.forEach(q => q.addEventListener('toggle', () => {
    if (q.open) qas.forEach(o => { if (o !== q) o.open = false; });
  }));

  /* ---------- CTA buttons focus the email field ---------- */
  document.querySelectorAll('a[href="#waitlist"]').forEach(a => a.addEventListener('click', e => {
    const input = document.getElementById('email');
    if (!input || document.getElementById('waitlist').classList.contains('is-done')) return;
    e.preventDefault();
    document.getElementById('waitlist').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
    setTimeout(() => input.focus({ preventScroll: true }), reduceMotion ? 0 : 600);
  }));

  /* ---------- Placeholder legal links ---------- */
  document.querySelectorAll('[data-placeholder]').forEach(a => a.addEventListener('click', e => e.preventDefault()));

  /* ---------- Waitlist ----------
   * Front-end only right now. To collect real signups, set WAITLIST_ENDPOINT to e.g.
   *   'https://formspree.io/f/XXXXXXX'   (Formspree: accepts JSON with Accept: application/json)
   * or your Mailchimp / ConvertKit / serverless function URL. Leave it null to keep demo mode
   * (emails are only remembered in this browser's localStorage so the success state persists).
   */
  const WAITLIST_ENDPOINT = 'https://formsubmit.co/ajax/max@getpilot.ai';

  async function submitWaitlist(email) {
    if (!WAITLIST_ENDPOINT) {
      await new Promise(r => setTimeout(r, 700)); // simulate network
      return true;
    }
    const res = await fetch(WAITLIST_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ email, source: 'joviahealth.com' })
    });
    return res.ok;
  }

  const form = document.getElementById('waitlist');
  const input = document.getElementById('email');
  const err = form.querySelector('.waitlist__error');
  const success = form.querySelector('.waitlist__success');
  const STORE_KEY = 'jovia_waitlist';
  if (localStorage.getItem(STORE_KEY)) form.classList.add('is-done');

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const email = input.value.trim();
    err.textContent = '';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      err.textContent = 'Please enter a valid email address.';
      input.setAttribute('aria-invalid', 'true');
      input.focus();
      return;
    }
    input.removeAttribute('aria-invalid');
    form.classList.add('is-loading');
    try {
      const ok = await submitWaitlist(email);
      if (!ok) throw new Error('Request failed');
      try { localStorage.setItem(STORE_KEY, '1'); } catch (_) {}
      form.classList.add('is-done');
      success.focus();
    } catch (_) {
      err.textContent = 'Something went wrong. Please try again in a moment.';
    } finally {
      form.classList.remove('is-loading');
    }
  });
})();
