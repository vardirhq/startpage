/* First-run setup: name → location → voice. Skippable at every step, shown once per browser,
   re-runnable from Settings or `>setup`. The flow is voiced, and it re-voices itself live
   when you pick a voice in step 3. */
(function (SP) {
  'use strict';
  const { esc } = SP.ui;
  const I = SP.icon;
  const S = () => SP.store.state;
  const t = (k, c) => SP.voice.t(k, c);
  const STEPS = ['name', 'location', 'voice'];
  let step = 0, results = [], prevFocus = null, entering = false; // animate the card only when it first opens
  const root = () => document.getElementById('onboard');

  function period() {
    const h = new Date().getHours();
    return h < 5 ? 'night' : h < 12 ? 'morning' : h < 17 ? 'afternoon' : h < 22 ? 'evening' : 'night';
  }
  /* What a voice would actually say to you, using the name from step 1. */
  function preview(k) {
    const V = SP.voice.list, v = V[k], n = V.neutral;
    const g = SP.voice.resolve(v.greet || n.greet, 'greet', period());
    const a = SP.voice.resolve(v.addr || n.addr, 'addr', { name: S().name });
    return '“' + g + (/[?!…]$/.test(g) ? ' ' : ', ') + a + '.”'; // no comma after "?"
  }

  function body() {
    const s = S();
    if (STEPS[step] === 'name') return '<h2 id="ob-title">' + esc(t('ob_title_name')) + '</h2><p class="muted">' + esc(t('ob_name_hint')) + '</p>' +
      '<input class="ob-input" data-ob-name value="' + esc(s.name) + '" placeholder="' + esc(t('ob_name_ph')) + '" autocomplete="given-name" maxlength="40" aria-labelledby="ob-title">';
    if (STEPS[step] === 'location') return '<h2 id="ob-title">' + esc(t('ob_title_loc')) + '</h2><p class="muted">' + esc(t('ob_loc_hint')) + '</p>' +
      '<form class="ob-loc" data-ob-loc><input class="ob-input" name="city" placeholder="' + esc(t('locPlaceholder')) + '" autocomplete="address-level2" aria-labelledby="ob-title"><button class="btn">' + esc(t('btn_find')) + '</button></form>' +
      (results.length ? '<ul class="ob-results">' + results.map((x, i) => '<li><button data-ob-pick="' + i + '">' + esc(x.name) + ' <small class="muted">' + esc([x.admin1, x.country].filter(Boolean).join(', ')) + '</small></button></li>').join('') + '</ul>' : '') +
      (s.location ? '<p class="ob-set">' + I('check', 16) + esc(t('ob_locSet', { name: s.location.name })) + '</p>' : '') +
      '<button class="link" data-ob-geo>' + I('pin', 14) + ' ' + esc(t('btn_geo')) + '</button>';
    return '<h2 id="ob-title">' + esc(t('ob_title_voice')) + '</h2><p class="muted">' + esc(t('ob_voice_hint')) + '</p>' +
      '<div class="ob-voices" role="radiogroup" aria-labelledby="ob-title">' + SP.voice.available().map((k) => [k, SP.voice.list[k]]).map(([k, v]) =>
        '<button role="radio" aria-checked="' + (SP.voice.key() === k) + '" data-ob-voice="' + k + '"><b>' + esc(v.name) + '</b><span>' + esc(preview(k)) + '</span></button>').join('') + '</div>';
  }

  function render() {
    const el = root(), last = step === STEPS.length - 1;
    el.innerHTML = '<div class="ob-card' + (entering ? ' enter' : '') + '" role="dialog" aria-modal="true" aria-labelledby="ob-title">' +
      '<header class="ob-head"><span class="ob-kicker">' + SP.logo(22) + esc(t('ob_kicker')) + '</span>' +
      '<span class="ob-dots" aria-label="Step ' + (step + 1) + ' of ' + STEPS.length + '">' + STEPS.map((_, i) => '<i class="' + (i <= step ? 'on' : '') + '"></i>').join('') + '</span>' +
      '<button class="link" data-ob-skip>' + esc(t('ob_skip')) + '</button></header>' +
      '<div class="ob-body">' + body() + '</div>' +
      '<footer class="ob-foot">' + (step ? '<button class="btn ghost" data-ob-back>' + esc(t('ob_back')) + '</button>' : '<span></span>') +
      '<span class="ob-right">' + (STEPS[step] === 'location' && !S().location ? '<button class="btn ghost" data-ob-next>' + esc(t('ob_skipStep')) + '</button>' : '') +
      '<button class="btn primary" data-ob-next' + (STEPS[step] === 'location' && !S().location ? ' hidden' : '') + '>' + esc(last ? t('ob_finish') : t('ob_next')) + '</button></span></footer></div>';
    bind(el);
    entering = false;
    const card = el.querySelector('.ob-card'), scroller = el.querySelector('.ob-body');
    scroller.addEventListener('scroll', () => card.classList.toggle('scrolled', scroller.scrollTop > 4), { passive: true });
    const f = el.querySelector('.ob-input, [aria-checked="true"]');
    if (f) f.focus();
  }

  function saveName() {
    const i = root().querySelector('[data-ob-name]');
    if (!i) return;
    S().name = i.value.trim().slice(0, 40);
    SP.store.save(); SP.app.renderHero();
  }
  function setLocation(name, lat, lon) {
    S().location = { name, lat, lon }; SP.store.save();
    SP.widgets.weather.reset(); SP.widgets.forecast.reset(); results = [];
    SP.app.renderMain(); render();
  }

  function bind(el) {
    const on = (sel, ev, fn) => el.querySelectorAll(sel).forEach((n) => n.addEventListener(ev, fn));
    on('[data-ob-skip]', 'click', finish);
    on('[data-ob-back]', 'click', () => { saveName(); step--; render(); });
    on('[data-ob-next]', 'click', () => { saveName(); if (step === STEPS.length - 1) finish(); else { step++; render(); } });
    on('[data-ob-name]', 'keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); saveName(); step++; render(); } });
    on('[data-ob-loc]', 'submit', async (e) => {
      e.preventDefault();
      const q = e.target.city.value.trim(); if (!q) return;
      try {
        const r = await fetch('https://geocoding-api.open-meteo.com/v1/search?count=5&language=en&name=' + encodeURIComponent(q));
        results = ((await r.json()).results) || [];
        if (!results.length) SP.ui.toast('No matches for “' + q + '”');
      } catch (err) { SP.ui.toast('City search failed. Check your connection.'); }
      render();
    });
    on('[data-ob-pick]', 'click', (e) => { const x = results[+e.currentTarget.dataset.obPick]; setLocation(x.name + (x.country ? ', ' + x.country : ''), x.latitude, x.longitude); });
    on('[data-ob-geo]', 'click', () => {
      if (!navigator.geolocation) return SP.ui.toast('Geolocation isn’t available');
      navigator.geolocation.getCurrentPosition((p) => setLocation('My location', p.coords.latitude, p.coords.longitude), () => SP.ui.toast('Location permission denied'));
    });
    // Picking a voice re-voices the page *and* this dialog, immediately.
    on('[data-ob-voice]', 'click', (e) => {
      const k = e.currentTarget.dataset.obVoice;
      S().voice = k; S().showSummary = k !== 'neutral'; SP.store.save();
      SP.app.renderAll(); render();
    });
  }

  function onKey(e) {
    if (root().hidden) return;
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); finish(); }
    if (e.key === 'Tab') { // keep focus inside the card
      const f = Array.from(root().querySelectorAll('button:not([hidden]), input')).filter((n) => n.offsetParent);
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    }
  }

  function start() {
    step = 0; results = []; prevFocus = document.activeElement;
    if (SP.panel.isOpen()) SP.panel.close();
    root().hidden = false; entering = true;
    document.body.classList.add('onboarding');
    render();
  }
  function finish() {
    saveName();
    S().onboarded = true; SP.store.save();
    root().hidden = true; root().innerHTML = '';
    document.body.classList.remove('onboarding');
    SP.app.renderAll();
    if (prevFocus && prevFocus.focus) prevFocus.focus();
  }

  document.addEventListener('keydown', onKey, true);
  SP.onboarding = { start, finish, maybeStart() { if (!S().onboarded) start(); } };
})(window.SP = window.SP || {});
