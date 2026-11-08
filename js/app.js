/* App shell: space rail, hero (greeting + search), widget grid, theming, shortcuts. */
(function (SP) {
  'use strict';
  const { $, $$, esc, menu, form, confirm, uid } = SP.ui;
  const I = SP.icon;
  const S = () => SP.store.state;
  const save = () => SP.store.save();

  /* Flex spans in 24ths per layout. Rows fill via flex-grow so hidden widgets never leave holes. */
  const LAYOUTS = {
    focus: { label: 'Focus', spans: {} },
    split: { label: 'Two columns', spans: { bookmarks: 24, music: 24 } },
    grid: { label: 'Classic', spans: { clock: 7, weather: 8, github: 9, bookmarks: 11, tasks: 6.5, notes: 6.5, music: 13, quote: 11,
      forecast: 12, focus: 8, calendar: 7, countdown: 8, worldclock: 7, habits: 10, news: 12, vitals: 8, moon: 8, onthisday: 10, fx: 8, mood: 7, since: 8, decide: 7, capsule: 8, nonogram: 8, sudoku: 8 } },
    dense: { label: 'Dense', spans: { bookmarks: 12, github: 12, music: 12, quote: 12, forecast: 12, news: 12, habits: 12, onthisday: 12, nonogram: 12, sudoku: 12 } },
  };
  const DEFAULT_SPAN = { focus: 24, split: 12, grid: 8, dense: 6 };
  const space = () => S().spaces.find((s) => s.id === S().activeSpace) || S().spaces[0];

  /* ---------- rail ---------- */
  function renderRail() {
    const rail = $('#rail');
    rail.innerHTML = '<div class="logo" title="Startpage">' + SP.logo(38) + '</div>' +
      '<div class="spaces"><div class="spaces-tabs" role="tablist" aria-label="Spaces">' + S().spaces.map((s, i) =>
        '<button role="tab" class="space' + (s.id === space().id ? ' active' : '') + '" data-space="' + s.id + '" aria-selected="' + (s.id === space().id) + '" title="' + esc(s.name) + (i < 9 ? ' (Alt+' + (i + 1) + ')' : '') + '">' +
        '<span class="space-ic">' + I(s.icon, 22) + '</span><span class="space-l">' + esc(s.name) + '</span></button>').join('') + '</div>' +
      '<button class="space-add" data-add-space title="' + esc(SP.voice.t('rail_newSpace')) + '" aria-label="New space">' + I('plus', 20) + '</button></div>' +
      '<button class="rail-btn" data-customize title="' + esc(SP.voice.t('rail_customize')) + '" aria-label="Customize">' + I('customize', 22) + '</button>';
    rail.querySelectorAll('[data-space]').forEach((b) => {
      b.onclick = () => switchSpace(b.dataset.space);
      b.oncontextmenu = (e) => { e.preventDefault(); spaceMenu(b, b.dataset.space); };
    });
    rail.querySelector('[data-add-space]').onclick = addSpace;
    rail.querySelector('[data-customize]').onclick = () => SP.panel.toggle();
  }
  const SPACE_ICONS = ['home', 'laptop', 'gamepad', 'code', 'star', 'book', 'coffee', 'music'];
  async function addSpace() {
    const v = await form('New space', [{ name: 'name', label: 'Name', required: true, placeholder: 'Reading' }, { name: 'icon', label: 'Icon', type: 'icons', options: SPACE_ICONS, value: 'star' }], { okText: 'Create' });
    if (!v) return;
    const s = { id: uid(), name: v.name.trim(), icon: v.icon || 'star', widgets: ['search', 'clock', 'bookmarks', 'tasks'] };
    S().spaces.push(s); save(); switchSpace(s.id);
  }
  function spaceMenu(anchor, id) {
    const s = S().spaces.find((x) => x.id === id);
    menu(anchor, [
      { icon: 'edit', label: 'Edit space', action: async () => {
        const v = await form('Edit space', [{ name: 'name', label: 'Name', value: s.name, required: true }, { name: 'icon', label: 'Icon', type: 'icons', options: SPACE_ICONS, value: s.icon }]);
        if (v) { s.name = v.name.trim(); s.icon = v.icon || s.icon; save(); renderRail(); }
      } },
      { icon: 'trash', label: 'Delete space', danger: true, action: async () => {
        if (S().spaces.length < 2) return SP.ui.toast('You need at least one space');
        if (!(await confirm('Delete “' + s.name + '”?', 'Its widget selection is removed. Bookmarks, tasks and notes are shared and stay.', 'Delete'))) return;
        S().spaces = S().spaces.filter((x) => x.id !== id);
        if (S().activeSpace === id) S().activeSpace = S().spaces[0].id;
        save(); renderAll();
      } },
    ], { side: true });
  }
  function switchSpace(id) {
    if (S().activeSpace === id) return;
    S().activeSpace = id; save();
    renderRail(); renderMain();
    if (SP.panel.isOpen()) SP.panel.render();
  }

  /* ---------- hero ---------- */
  function greet() {
    const h = new Date().getHours();
    return SP.voice.t('greet', h < 5 ? 'night' : h < 12 ? 'morning' : h < 17 ? 'afternoon' : h < 22 ? 'evening' : 'night');
  }
  /* Now and then another voice butts in on the summary line. */
  const V_ = (k) => SP.voice.list[k] || {};
  function heckleHtml() {
    const h = SP.react.heckle();
    if (h && V_(h.key).secret && V_(SP.voice.key()).secret) SP.eggs.found('secrets');
    return h ? '<p class="g-heckle"><b>' + esc(h.who) + ':</b> ' + esc(h.text) + '</p>' : '';
  }
  function renderHero() {
    const s = S(), sp = space();
    const g = $('#greeting');
    g.hidden = !s.showGreeting;
    if (s.showGreeting) {
      const date = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase();
      const hello = SP.birthday.today() ? SP.voice.t('bday_greet') : greet(); // no comma after a greeting that ends in "?" or "!"
      g.innerHTML = '<p class="g-date">' + esc(date) + ' <span class="g-lvl" title="' + esc(SP.levels.info().title) + '">· Level ' + SP.levels.info().level + '</span></p><h1>' + esc(hello) + (/[?!…]$/.test(hello) ? '' : ',') + '<br>' + esc(SP.voice.t('addr', { name: s.name })) + '.<span class="caret" aria-hidden="true"></span></h1>' +
        (s.tagline ? '<p class="g-tag">' + esc(s.tagline) + '</p>' : '') +
        (s.showSummary ? '<p class="g-sub">' + esc(SP.faceoff.sulk() || SP.voice.t('heroSub', { open: s.tasks.filter((x) => !x.done).length, focus: s.focusLog[todayKey()] || 0 })) + '</p>' + heckleHtml() : '') + SP.birthday.bannerHtml() + SP.faceoff.html() + SP.dares.html() + SP.season.bannerHtml();
      SP.season.bindBanner(g); SP.dares.bind(g); SP.birthday.bind(g); SP.faceoff.bind(g);
    }
    const sw = $('#search-wrap');
    const want = sp.widgets.includes('search');
    sw.hidden = !want;
    if (want && !sw.querySelector('form')) { sw.innerHTML = SP.search.render(); SP.search.mount(sw); }
    if (want) sw.querySelector('input').placeholder = SP.voice.t('search_placeholder');
    $('#hero').classList.toggle('compact', !s.showGreeting);
    if (SP.brief.isOpen()) SP.brief.render();
  }

  const todayKey = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };

  /* ---------- grid ---------- */
  const SIZES = { s: { label: 'Small', mult: 0.7 }, m: { label: 'Medium', mult: 1 }, l: { label: 'Large', mult: 1.6 } };
  const SCROLLERS = '.task-list, .news-list, .notes-list, .cd-list, .wc-list, .habit-list, .bm-tiles';
  function sizeOf(id) { const sp = space(); return (sp.sizes && sp.sizes[id]) || 'm'; }
  function applySpan(el, id) {
    const L = S().layout, base = (LAYOUTS[L].spans[id] || DEFAULT_SPAN[L]), sz = sizeOf(id);
    const span = L === 'focus' ? 24 : L === 'split' && sz === 'l' ? 24 : Math.min(24, base * SIZES[sz].mult);
    el.style.setProperty('--span', span);
    el.dataset.size = sz;
  }
  function cardFor(id) {
    const el = document.createElement('section');
    el.className = 'card w-' + id;
    el.dataset.w = id;
    el.setAttribute('aria-label', SP.widgetMeta[id].title);
    applySpan(el, id);
    return el;
  }
  /* Chaos mode: every card gets its own voice, reshuffled daily (or with >shuffle voices). */
  function chaosVoice(id) {
    const s = S();
    if (!s.chaos && !SP.season.forcedChaos()) return null; // April Fools' Day: chaos for everyone
    const pool = SP.voice.available().filter((k) => k !== 'neutral');
    let h = (s.chaosSeed || 0) + Math.floor(Date.now() / 864e5) * 7919;
    for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    return pool[h % pool.length];
  }
  function renderWidget(id) {
    $$('.card[data-w="' + id + '"]').forEach((el) => {
      const W = SP.widgets[id];
      const keep = $$(SCROLLERS, el).map((n) => n.scrollTop); // re-renders shouldn't jump lists to the top
      const vk = chaosVoice(id), as = (fn) => (vk ? SP.voice.as(vk, fn) : fn());
      el.innerHTML = as(() => W.render());
      el.classList.toggle('chaos', !!vk);
      // A small tab hanging from the card's top edge: positioned absolutely, so it never moves the content.
      if (vk) el.insertAdjacentHTML('afterbegin', '<span class="chaos-tag" title="Chaos mode: this card has its own voice">' + esc(SP.voice.list[vk].name) + '</span>');
      el.insertAdjacentHTML('beforeend', '<div class="card-tools"><button class="size-btn" data-size-btn title="Card size" aria-label="Card size: ' + SIZES[sizeOf(id)].label + '">' + I('resize', 13) + '<span>' + sizeOf(id).toUpperCase() + '</span></button></div>');
      el.querySelector('[data-size-btn]').onclick = () => {
        const sp = space(), order = ['s', 'm', 'l'], next = order[(order.indexOf(sizeOf(id)) + 1) % 3];
        sp.sizes = sp.sizes || {}; sp.sizes[id] = next; save(); applySpan(el, id); renderWidget(id);
      };
      if (W.mount) as(() => W.mount(el));
      $$(SCROLLERS, el).forEach((n, i) => { if (keep[i]) n.scrollTop = keep[i]; });
    });
  }
  function renderMain() {
    renderHero();
    const grid = $('#grid');
    grid.className = 'grid layout-' + S().layout;
    grid.innerHTML = '';
    space().widgets.filter((id) => id !== 'search' && SP.widgets[id]).forEach((id) => {
      grid.appendChild(cardFor(id));
      renderWidget(id);
    });
    if (!grid.children.length) grid.innerHTML = '<div class="grid-empty">' + esc(SP.voice.t('grid_empty')) + ' <button class="btn small" data-open-widgets>' + esc(SP.voice.t('grid_emptyBtn')) + '</button></div>';
    const b = grid.querySelector('[data-open-widgets]');
    if (b) b.onclick = () => SP.panel.open('widgets');
  }

  /* Drag-to-reorder (only while Customize is open). */
  function setupDrag() {
    const grid = $('#grid');
    let dragging = null;
    grid.addEventListener('pointerdown', (e) => {
      const grip = e.target.closest('.drag-grip');
      if (grip && document.body.classList.contains('editing')) grip.closest('.card').draggable = true;
    });
    grid.addEventListener('dragstart', (e) => {
      dragging = e.target.closest('.card');
      if (!dragging) return;
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', dragging.dataset.w);
      setTimeout(() => dragging && dragging.classList.add('dragging'));
    });
    grid.addEventListener('dragover', (e) => {
      if (!dragging) return;
      e.preventDefault();
      const over = e.target.closest('.card');
      if (!over || over === dragging) return;
      const r = over.getBoundingClientRect();
      const after = e.clientY > r.bottom - 10 || (e.clientY > r.top + 10 && e.clientX > r.left + r.width / 2);
      grid.insertBefore(dragging, after ? over.nextSibling : over);
    });
    grid.addEventListener('dragend', () => {
      if (!dragging) return;
      dragging.classList.remove('dragging');
      dragging.draggable = false;
      dragging = null;
      const order = $$('.card', grid).map((c) => c.dataset.w);
      const sp = space();
      sp.widgets = (sp.widgets.includes('search') ? ['search'] : []).concat(order);
      save();
    });
  }

  /* ---------- theme & background ---------- */
  function hexToRgb(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255].join(','); }
  let bgUrl = null;
  async function applyTheme() {
    const s = S(), t = SP.scene.themes[s.theme] || SP.scene.themes.midnight, root = document.documentElement.style;
    root.setProperty('--accent', s.accent);
    root.setProperty('--accent-rgb', hexToRgb(s.accent));
    root.setProperty('--tint-rgb', hexToRgb(t.tint));
    document.documentElement.dataset.theme = s.theme;
    const meta = SP.scene.render($('#bg-canvas'), s.theme, s.seed, { meta: true });
    SP.anim.start(s.animate && !s.customBg ? meta : null);
    const img = $('#bg-image');
    if (s.customBg) {
      try {
        const blob = await SP.store.files.get('bg');
        if (blob) { if (bgUrl) URL.revokeObjectURL(bgUrl); bgUrl = URL.createObjectURL(blob); img.style.backgroundImage = 'url("' + bgUrl + '")'; img.hidden = false; return; }
      } catch (e) { console.warn(e); }
    }
    img.hidden = true; img.style.backgroundImage = '';
  }

  function download(name, text, type) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: type || 'application/json' }));
    a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  function renderAll() { SP.maker.register(); SP.bonds.mark(); applyTheme(); renderRail(); renderMain(); if (SP.panel.isOpen()) SP.panel.render(); }

  /* ---------- shortcuts & ticking ---------- */
  function shortcuts() {
    document.addEventListener('keydown', (e) => {
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName) || document.activeElement.isContentEditable;
      if ((e.key === 'k' || e.key === 'K') && (e.ctrlKey || e.metaKey)) { e.preventDefault(); focusSearch(); }
      else if (e.key === '/' && !typing) { e.preventDefault(); focusSearch(); }
      else if (e.altKey && /^Digit[1-9]$/.test(e.code)) { const s = S().spaces[+e.code.slice(5) - 1]; if (s) { e.preventDefault(); switchSpace(s.id); } }
      else if (e.key === 'Escape' && SP.panel.isOpen() && !$('#dlg').open && !typing) SP.panel.close();
    });
  }
  function focusSearch() { const q = $('#q'); if (q) { q.focus(); q.select(); } }

  let lastMinute = -1;
  function tick() {
    const on = space().widgets;
    Object.keys(SP.widgets).forEach((k) => { const w = SP.widgets[k]; if (w.tick && (on.includes(k) || k === 'focus')) w.tick(); }); // the timer keeps running on other spaces
    const m = new Date().getMinutes();
    if (m !== lastMinute) {
      if (lastMinute !== -1) { renderHero(); SP.sky.update(); SP.eggs.checkAll(); }
      lastMinute = m;
    }
  }

  /* "Install app" prompt (Chrome/Edge/Android). Offered as a > command once the browser allows it. */
  let installEvt = null;
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); installEvt = e; });
  window.addEventListener('appinstalled', () => { installEvt = null; });
  const install = () => { if (!installEvt) return false; installEvt.prompt(); installEvt = null; return true; };
  const canInstall = () => !!installEvt;

  SP.app = { install, canInstall, renderWidget, renderMain, renderRail, renderHero, renderAll, applyTheme, space, switchSpace, LAYOUTS, download, focusSearch };

  document.addEventListener('DOMContentLoaded', () => {
    const away0 = SP.voice.markSeen();
    setInterval(() => { if (document.visibilityState === 'visible') SP.voice.touch(); }, 60e3);
    applyTheme(); renderRail(); renderMain(); setupDrag(); shortcuts(); SP.sky.update(); SP.bonds.mark();
    setInterval(tick, 1000); tick();
    SP.sync.init();
    SP.onboarding.maybeStart();
    if (location.hash === '#wrapped') { history.replaceState(null, '', location.pathname + location.search); SP.wrapped.open(); }
    // Installable app on the web (the extension has its own new-tab page and no service worker).
    if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) navigator.serviceWorker.register('sw.js').catch(() => {});
    SP.achieve.check({ quiet: !!S()._achQuiet }); delete S()._achQuiet;
    if (!SP.wrapped.maybeShow()) { SP.brief.maybeShow(); setTimeout(() => SP.react.visit(away0, true), 900); }
    SP.maker.fromHash();
    setTimeout(() => SP.eggs.checkAll(), 2500);
    SP.emit('ready'); // the pet, time capsules, birthdays and roasts start here
    // Refresh data when the tab becomes visible again (cached results are reused while fresh).
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState !== 'visible') { SP.voice.touch(); return; }
      const away = SP.voice.markSeen();
      if (!SP.react.visit(away) && away > 2 * 60e3 && SP.voice.current().welcomeBack) SP.ui.toast(SP.voice.line('welcomeBack'), { who: SP.voice.current().name });
      renderHero();
      if (SP.widgets.weather.data) SP.widgets.weather.load();
      if (SP.widgets.github.data) SP.widgets.github.load();
      if (space().widgets.includes('news')) SP.widgets.news.load();
    });
  });
})(window.SP = window.SP || {});
