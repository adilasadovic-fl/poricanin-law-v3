/* Poricanin Law: shared behaviour for every page. Each block runs only if its elements exist. */
(() => {
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
})();
