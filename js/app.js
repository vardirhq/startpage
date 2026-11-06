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
    grid: { label: 'Classic', spans: { clock: 7, weather: 8, github: 9, bookmarks: 11, tasks: 6.5, notes: 6.5, music: 13, quote: 11 } },
    dense: { label: 'Dense', spans: { bookmarks: 12, github: 12, music: 12, quote: 12 } },
  };
  const DEFAULT_SPAN = { focus: 24, split: 12, grid: 8, dense: 6 };
  const space = () => S().spaces.find((s) => s.id === S().activeSpace) || S().spaces[0];

  /* ---------- rail ---------- */
  function renderRail() {
    const rail = $('#rail');
    rail.innerHTML = '<div class="logo" title="Startpage">' + SP.logo(38) + '</div>' +
      '<div class="spaces" role="tablist" aria-label="Spaces">' + S().spaces.map((s, i) =>
        '<button role="tab" class="space' + (s.id === space().id ? ' active' : '') + '" data-space="' + s.id + '" aria-selected="' + (s.id === space().id) + '" title="' + esc(s.name) + (i < 9 ? ' (Alt+' + (i + 1) + ')' : '') + '">' +
        '<span class="space-ic">' + I(s.icon, 22) + '</span><span class="space-l">' + esc(s.name) + '</span></button>').join('') +
      '<button class="space-add" data-add-space title="New space" aria-label="New space">' + I('plus', 20) + '</button></div>' +
      '<button class="rail-btn" data-customize title="Customize" aria-label="Customize">' + I('customize', 22) + '</button>';
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
    return h < 5 ? 'Good night' : h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : h < 22 ? 'Good evening' : 'Good night';
  }
  function renderHero() {
    const s = S(), sp = space();
    const g = $('#greeting');
    g.hidden = !s.showGreeting;
    if (s.showGreeting) {
      const date = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase();
      g.innerHTML = '<p class="g-date">' + esc(date) + '</p><h1>' + esc(greet()) + ',<br>' + esc(s.name || 'friend') + '.<span class="caret" aria-hidden="true"></span></h1>' +
        (s.tagline ? '<p class="g-tag">' + esc(s.tagline) + '</p>' : '');
    }
    const sw = $('#search-wrap');
    const want = sp.widgets.includes('search');
    sw.hidden = !want;
    if (want && !sw.querySelector('form')) { sw.innerHTML = SP.search.render(); SP.search.mount(sw); }
    $('#hero').classList.toggle('compact', !s.showGreeting);
  }

  /* ---------- grid ---------- */
  function cardFor(id) {
    const el = document.createElement('section');
    el.className = 'card w-' + id;
    el.dataset.w = id;
    el.setAttribute('aria-label', SP.widgetMeta[id].title);
    const L = S().layout, span = (LAYOUTS[L].spans[id] || DEFAULT_SPAN[L]);
    el.style.setProperty('--span', span);
    return el;
  }
  function renderWidget(id) {
    $$('.card[data-w="' + id + '"]').forEach((el) => {
      const W = SP.widgets[id];
      el.innerHTML = W.render();
      if (W.mount) W.mount(el);
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
    if (!grid.children.length) grid.innerHTML = '<div class="grid-empty">This space has no widgets yet. <button class="btn small" data-open-widgets>Add widgets</button></div>';
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
    SP.scene.render($('#bg-canvas'), s.theme, s.seed);
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

  function renderAll() { applyTheme(); renderRail(); renderMain(); if (SP.panel.isOpen()) SP.panel.render(); }

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
    SP.widgets.clock.tick();
    const m = new Date().getMinutes();
    if (m !== lastMinute) {
      if (lastMinute !== -1) renderHero();
      lastMinute = m;
    }
  }

  SP.app = { renderWidget, renderMain, renderRail, renderHero, renderAll, applyTheme, space, LAYOUTS, download, focusSearch };

  document.addEventListener('DOMContentLoaded', () => {
    applyTheme(); renderRail(); renderMain(); setupDrag(); shortcuts();
    setInterval(tick, 1000); tick();
    // Refresh data when the tab becomes visible again (cached results are reused while fresh).
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState !== 'visible') return;
      renderHero();
      if (SP.widgets.weather.data) SP.widgets.weather.load();
      if (SP.widgets.github.data) SP.widgets.github.load();
    });
  });
})(window.SP = window.SP || {});
