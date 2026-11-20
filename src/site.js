/* Poricanin Law: shared behaviour for every page. Each block runs only if its elements exist. */
(() => {
  window.__site = true;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  // header background on scroll (pages without a dark hero keep it solid)
  const header = $('#header');
  const solid = document.body.classList.contains('solid-header');
  const onScroll = () => header.classList.toggle('scrolled', solid || scrollY > 40);
  onScroll(); addEventListener('scroll', onScroll, { passive: true });

  // mobile menu
  const mb = $('#menuBtn'), mn = $('#mobileNav');
  const setMenu = o => { mn.classList.toggle('open', o); mb.setAttribute('aria-expanded', o); document.body.style.overflow = o ? 'hidden' : ''; if (o) header.classList.add('scrolled'); else onScroll(); };
  mb.addEventListener('click', () => setMenu(!mn.classList.contains('open')));
  $$('a', mn).forEach(a => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

  // reveal on scroll
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .12, rootMargin: '0px 0px -40px 0px' });
  $$('.reveal').forEach(el => io.observe(el));

  // testimonial carousel
  const slides = $$('.slide');
  if (slides.length && $('#qPrev')) {
    let qi = 0;
    $('#qAll').textContent = String(slides.length).padStart(2, '0');
    const show = i => { qi = (i + slides.length) % slides.length; slides.forEach((s, k) => s.classList.toggle('active', k === qi)); $('#qNow').textContent = String(qi + 1).padStart(2, '0'); };
    $('#qPrev').onclick = () => show(qi - 1); $('#qNext').onclick = () => show(qi + 1);
  }

  // accordion lists (practice areas, sectors): open the item named in the URL hash
  const openFromHash = () => {
    const id = decodeURIComponent(location.hash.slice(1)); if (!id) return;
    const el = document.getElementById(id); if (!el) return;
    const d = el.matches('details') ? el : el.querySelector('details');
    if (d) d.open = true;
  };
  openFromHash(); addEventListener('hashchange', openFromHash);

  // insights filters: apply instantly
  const list = $('#insightList');
  if (list) {
    const items = $$('.ins-row', list), count = $('#insCount'), empty = $('#insEmpty');
    const state = { access: 'all', topic: 'all', q: '' };
    const apply = () => {
      let n = 0;
      items.forEach(it => {
        const ok = (state.access === 'all' || it.dataset.access === state.access) &&
                   (state.topic === 'all' || it.dataset.topic === state.topic) &&
                   (!state.q || it.dataset.title.includes(state.q));
        it.hidden = !ok; if (ok) n++;
      });
      count.textContent = n + (n === 1 ? ' insight' : ' insights');
      empty.hidden = n > 0;
    };
    $$('[data-filter]').forEach(b => b.addEventListener('click', () => {
      const k = b.dataset.filter;
      $$(`[data-filter="${k}"]`).forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      state[k] = b.dataset.value; apply();
    }));
    const q = $('#insSearch');
    q.addEventListener('input', () => { state.q = q.value.trim().toLowerCase(); apply(); });
    apply();
  }

  // contact form, V1 style (prototype: validates, then says plainly that nothing was sent)
  const form = $('#contactForm');
  if (form) {
    const consent = $('#f-consent'), cw = $('#consentWrap'), area = $('#f-area');
    area.addEventListener('change', () => area.classList.add('chosen'));
    form.addEventListener('submit', e => {
      e.preventDefault(); let first = null;
      $$('.uf-field', form).forEach(f => { const el = $('input,select,textarea', f); const bad = el && !el.checkValidity(); f.classList.toggle('invalid', bad); el && el.setAttribute('aria-invalid', bad); if (bad && !first) first = el; });
      const cBad = !consent.checked; cw.classList.toggle('invalid', cBad); consent.setAttribute('aria-invalid', cBad); if (cBad && !first) first = consent;
      if (first) { first.focus(); return; }
      const ok = $('#formOk'); ok.style.display = 'block'; ok.focus();
    });
    form.addEventListener('input', e => { const f = e.target.closest('.uf-field'); if (f && e.target.checkValidity()) f.classList.remove('invalid'); });
    consent.addEventListener('change', () => { if (consent.checked) cw.classList.remove('invalid'); });
  }

  // scheduler: any [data-schedule] link opens the booking dialog (links fall back to their href without JS)
  const dlg = $('#sched');
  if (dlg && typeof dlg.showModal === 'function') {
    const EMAIL = 'hello@poricaninlaw.com';
    const SLOTS = Array.from({ length: 18 }, (_, i) => 540 + 30 * i);           // 9:00 to 17:30, every 30 minutes
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const last = new Date(today); last.setDate(last.getDate() + 60);           // bookable up to 60 days ahead
    const fmtDate = (d, o) => d.toLocaleDateString('en-US', o);
    const fmtTime = (m, h24) => { const h = Math.floor(m / 60), mm = String(m % 60).padStart(2, '0'); return h24 ? `${String(h).padStart(2, '0')}:${mm}` : `${(h + 11) % 12 + 1}:${mm}${h < 12 ? 'am' : 'pm'}`; };
    const sameDay = (a, b) => a && b && a.toDateString() === b.toDateString();
    const bookable = d => d > today && d <= last && d.getDay() !== 0 && d.getDay() !== 6;
    const st = { month: new Date(today.getFullYear(), today.getMonth(), 1), day: null, slot: null, h24: false, opener: null };
    const grid = $('#schedGrid'), slotsEl = $('#schedSlots'), hint = $('#schedHint'), dayEl = $('#schedDay');
    const pick = $('#schedPick'), details = $('#schedDetails'), picked = $('#schedPicked'), sform = $('#schedForm'), sent = $('#schedSent');

    const renderMonth = () => {
      const y = st.month.getFullYear(), m = st.month.getMonth();
      $('#schedMonth').innerHTML = `<b>${fmtDate(st.month, { month: 'long' })}</b> ${y}`;
      $('#schedPrev').disabled = y === today.getFullYear() && m === today.getMonth();
      $('#schedNext').disabled = new Date(y, m + 1, 1) > last;
      grid.innerHTML = '';
      for (let i = 0; i < new Date(y, m, 1).getDay(); i++) grid.append(document.createElement('span'));
      for (let n = 1; n <= new Date(y, m + 1, 0).getDate(); n++) {
        const d = new Date(y, m, n), b = document.createElement('button');
        b.type = 'button'; b.className = 'sched-day' + (bookable(d) ? ' on' : '') + (sameDay(d, today) ? ' today' : '');
        b.textContent = n; b.disabled = !bookable(d);
        b.setAttribute('aria-label', fmtDate(d, { weekday: 'long', month: 'long', day: 'numeric' }) + (sameDay(d, today) ? ', today' : ''));
        b.setAttribute('aria-pressed', String(sameDay(d, st.day)));
        b.addEventListener('click', () => { st.day = d; st.slot = null; renderMonth(); renderSlots(); if (matchMedia('(max-width:720px)').matches) dayEl.scrollIntoView({ behavior: 'smooth', block: 'start' }); dayEl.focus({ preventScroll: true }); });
        grid.append(b);
      }
    };
    const renderSlots = () => {
      slotsEl.innerHTML = '';
      hint.hidden = !!st.day;
      dayEl.innerHTML = st.day ? `<b>${fmtDate(st.day, { weekday: 'short' })}</b> ${st.day.getDate()} ${fmtDate(st.day, { month: 'short' })}` : '<b>Pick a date</b>';
      if (!st.day) return;
      SLOTS.forEach(s => {
        const li = document.createElement('li'), b = document.createElement('button');
        b.type = 'button'; b.className = 'sched-time'; b.textContent = fmtTime(s, st.h24);
        b.setAttribute('aria-label', `${fmtTime(s, st.h24)} Eastern Time, ${fmtDate(st.day, { weekday: 'long', month: 'long', day: 'numeric' })}`);
        b.addEventListener('click', () => { st.slot = s; showDetails(); });
        li.append(b); slotsEl.append(li);
      });
    };
    const when = () => `${fmtDate(st.day, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })} at ${fmtTime(st.slot, false)} ET`;
    const showDetails = () => {
      picked.innerHTML = `${fmtDate(st.day, { weekday: 'long', month: 'long', day: 'numeric' })}<br>${fmtTime(st.slot, st.h24)} ET`;
      picked.hidden = false; pick.hidden = true; details.hidden = false; sform.hidden = false; sent.hidden = true;
      $('#schedFormTitle').focus();
    };
    const showPick = () => { picked.hidden = true; details.hidden = true; pick.hidden = false; st.slot = null; dayEl.focus(); };
    $$('.sched-toggle button').forEach(b => b.addEventListener('click', () => {
      st.h24 = b.dataset.h24 === '1';
      $$('.sched-toggle button').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      renderSlots();
    }));
    $('#schedPrev').addEventListener('click', () => { st.month = new Date(st.month.getFullYear(), st.month.getMonth() - 1, 1); renderMonth(); });
    $('#schedNext').addEventListener('click', () => { st.month = new Date(st.month.getFullYear(), st.month.getMonth() + 1, 1); renderMonth(); });
    $('#schedBack').addEventListener('click', showPick);

    sform.addEventListener('submit', e => {
      e.preventDefault(); let first = null;
      $$('.sf', sform).forEach(f => { const el = $('input,textarea', f); const bad = !el.checkValidity(); f.classList.toggle('invalid', bad); el.setAttribute('aria-invalid', bad); if (bad && !first) first = el; });
      if (first) { first.focus(); return; }
      const v = k => (sform.elements[k].value || '').trim();
      const body = [`Requested time: ${when()}`, '', `Name: ${v('name')}`, `Company: ${v('company')}`, `Email: ${v('email')}`, `Phone: ${v('phone')}`, '', v('notes')].join('\n');
      location.href = `mailto:${EMAIL}?subject=${encodeURIComponent('Consultation request: ' + when())}&body=${encodeURIComponent(body)}`;
      sform.hidden = true; sent.hidden = false; sent.focus();
    });
    sform.addEventListener('input', e => { const f = e.target.closest('.sf'); if (f && e.target.checkValidity()) f.classList.remove('invalid'); });

    const open = opener => {
      st.opener = opener;
      setMenu(false);
      if (!sent.hidden) { st.day = null; st.slot = null; sform.reset(); picked.hidden = true; details.hidden = true; pick.hidden = false; }
      renderMonth(); renderSlots();
      dlg.showModal(); document.documentElement.classList.add('sched-lock');
      ($('.sched-day.on', grid) || $('#schedClose')).focus();
    };
    const close = () => dlg.close();
    dlg.addEventListener('close', () => { document.documentElement.classList.remove('sched-lock'); if (st.opener) st.opener.focus(); });
    dlg.addEventListener('click', e => { if (e.target === dlg) close(); });
    $('#schedClose').addEventListener('click', close);
    document.addEventListener('click', e => {
      const a = e.target.closest('[data-schedule]');
      if (!a || e.metaKey || e.ctrlKey || e.shiftKey) return;
      e.preventDefault(); open(a);
    });
  }
})();
