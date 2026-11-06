/* Customize side panel: Layout overview, Widgets, Theme, Settings. */
(function (SP) {
  'use strict';
  const { $, $$, esc, toast, confirm } = SP.ui;
  const I = SP.icon;
  const S = () => SP.store.state;
  const save = () => SP.store.save();

  const ACCENTS = ['#a78bfa', '#3b82f6', '#22d3ee', '#4ade80', '#facc15', '#fb923c', '#f472b6'];
  const TABS = [['layout', 'Layout'], ['widgets', 'Widgets'], ['theme', 'Theme'], ['settings', 'Settings']];
  const WIDGET_DESC = {
    search: 'Search bar with bookmark suggestions and !bangs', bookmarks: 'Folders and quick-launch tiles', weather: 'Current conditions and 3-day forecast (Open-Meteo)',
    clock: 'Local time and location', tasks: 'Simple to-do list', notes: 'Quick bullet notes', github: 'Recent repo activity and CI status',
    music: 'Player for your own streams and audio files', quote: 'A new quote every day',
  };
  let tab = 'layout';
  const thumbs = {};

  function thumb(theme, seed) {
    const k = theme + ':' + seed;
    if (!thumbs[k]) {
      const c = document.createElement('canvas'); c.width = 384; c.height = 216;
      SP.scene.render(c, theme, seed);
      thumbs[k] = c.toDataURL();
    }
    return thumbs[k];
  }
  const toggle = (name, label, on) => '<label class="switch-row"><span>' + esc(label) + '</span><input type="checkbox" role="switch" data-toggle="' + name + '"' + (on ? ' checked' : '') + '><span class="switch" aria-hidden="true"></span></label>';
  const section = (title, body, cls) => '<section class="p-sec ' + (cls || '') + '"><h3>' + esc(title) + '</h3>' + body + '</section>';

  function layoutPicker() {
    const shapes = {
      focus: '<i style="grid-area:1/1/3/5"></i>',
      split: '<i style="grid-area:1/1/3/3"></i><i style="grid-area:1/3/3/5"></i>',
      grid: '<i style="grid-area:1/1/2/5"></i><i style="grid-area:2/1/3/3"></i><i style="grid-area:2/3/3/5"></i>',
      dense: '<i style="grid-area:1/1/2/3"></i><i style="grid-area:1/3/2/4"></i><i style="grid-area:1/4/2/5"></i><i style="grid-area:2/1/3/2"></i><i style="grid-area:2/2/3/3"></i><i style="grid-area:2/3/3/5"></i>',
    };
    return '<div class="layout-pick" role="radiogroup" aria-label="Layout">' + Object.keys(shapes).map((k) =>
      '<button role="radio" aria-checked="' + (S().layout === k) + '" data-layout="' + k + '" title="' + SP.app.LAYOUTS[k].label + '"><span class="lp-shape">' + shapes[k] + '</span></button>').join('') + '</div>';
  }
  function widgetTiles(ids) {
    const on = SP.app.space().widgets;
    return '<div class="w-pick">' + ids.map((id) => '<button aria-pressed="' + on.includes(id) + '" data-widget="' + id + '"><span>' + I(SP.widgetMeta[id].icon, 22) + '</span>' + esc(SP.widgetMeta[id].title) + '</button>').join('') + '</div>';
  }
  function themePicker() {
    return '<div class="theme-pick">' + Object.entries(SP.scene.themes).map(([k, t]) =>
      '<button data-theme="' + k + '" aria-pressed="' + (S().theme === k && !S().customBg) + '"><img src="' + thumb(k, S().seed) + '" alt=""><span>' + esc(t.name) + '</span>' +
      (S().theme === k && !S().customBg ? '<b class="tick">' + I('check', 12) + '</b>' : '') + '</button>').join('') + '</div>';
  }
  function bgRow() {
    return '<div class="bg-row"><div class="bg-prev" id="bg-prev"><img src="' + thumb(S().theme, S().seed) + '" alt=""></div>' +
      '<label class="btn">Change…<input type="file" accept="image/*" hidden data-bg-file></label>' +
      '<button class="icon-btn boxed" data-bg-shuffle title="New random scene">' + I('shuffle', 18) + '</button></div>' +
      (S().customBg ? '<p class="small muted">Using your own image. <button class="link" data-bg-reset>Back to the pixel scene</button></p>' : '');
  }
  function accentRow(custom) {
    return '<div class="accent-pick" role="radiogroup" aria-label="Accent color">' + ACCENTS.map((c) =>
      '<button role="radio" aria-checked="' + (S().accent === c) + '" data-accent="' + c + '" style="--c:' + c + '" aria-label="Accent ' + c + '">' + (S().accent === c ? I('check', 16) : '') + '</button>').join('') +
      (custom ? '<label class="accent-custom" title="Custom color" style="--c:' + S().accent + '"><input type="color" value="' + S().accent + '" data-accent-custom>' + I('plus', 14) + '</label>' : '') + '</div>';
  }

  const VIEWS = {
    layout() {
      return section('Layout', layoutPicker()) +
        section('Widgets', widgetTiles(['search', 'bookmarks', 'weather', 'clock', 'tasks', 'notes', 'github', 'music']) +
          '<button class="more-btn" data-tab="widgets">' + I('plus', 14) + ' More widgets</button>') +
        section('Theme', themePicker()) +
        section('Background', bgRow()) +
        section('Accent color', accentRow(false)) +
        '<section class="p-sec">' + toggle('showGreeting', 'Show greeting', S().showGreeting) + toggle('showQuote', 'Show daily quote', SP.app.space().widgets.includes('quote')) + '</section>';
    },
    widgets() {
      const on = SP.app.space().widgets;
      return '<p class="small muted">Widgets for the <b>' + esc(SP.app.space().name) + '</b> space. While this panel is open, drag cards by their ' + I('grip', 12) + ' handle to reorder them.</p>' +
        '<ul class="w-list">' + SP.widgetOrder.map((id) => '<li><span class="wl-ic">' + I(SP.widgetMeta[id].icon, 20) + '</span><span class="wl-t"><b>' + esc(SP.widgetMeta[id].title) + '</b><small>' + esc(WIDGET_DESC[id]) + '</small></span>' +
          '<label class="switch-row bare"><input type="checkbox" role="switch" aria-label="Show ' + esc(SP.widgetMeta[id].title) + '" data-wtoggle="' + id + '"' + (on.includes(id) ? ' checked' : '') + '><span class="switch" aria-hidden="true"></span></label></li>').join('') + '</ul>';
    },
    theme() {
      return section('Theme', themePicker()) + section('Background', bgRow()) + section('Accent color', accentRow(true));
    },
    settings() {
      const s = S();
      const engines = Object.entries(SP.search.engines).map(([k, e]) => '<option value="' + k + '"' + (s.engine === k ? ' selected' : '') + '>' + e.name + '</option>').join('');
      return section('Profile',
          '<label class="field"><span>Your name</span><input data-set="name" value="' + esc(s.name) + '"></label>' +
          '<label class="field"><span>Tagline</span><input data-set="tagline" value="' + esc(s.tagline) + '"></label>') +
        section('Location',
          '<p class="small muted">Used for the weather and clock. Currently <b>' + esc(s.location.name) + '</b>.</p>' +
          '<form class="loc-search" data-loc-form><input name="city" placeholder="Search for a city…" aria-label="City"><button class="btn">Find</button></form>' +
          '<ul class="loc-results" data-loc-results></ul><button class="link" data-geo>' + I('pin', 14) + ' Use my current location</button>' +
          '<div class="seg" role="radiogroup" aria-label="Units"><button data-units="celsius" aria-checked="' + (s.units === 'celsius') + '" role="radio">°C</button><button data-units="fahrenheit" aria-checked="' + (s.units === 'fahrenheit') + '" role="radio">°F</button></div>' +
          toggle('clock24', '24-hour clock', s.clock24)) +
        section('Search', '<label class="field"><span>Search engine</span><select data-set="engine">' + engines + '</select></label>' +
          '<p class="small muted">Shortcuts: <kbd>Ctrl</kbd> <kbd>K</kbd> or <kbd>/</kbd> to focus. Bangs: ' + Object.keys(SP.search.bangs).map((b) => '<code>!' + b + '</code>').join(' ') + '</p>' +
          toggle('favicons', 'Load bookmark icons (via Google’s favicon service)', s.favicons)) +
        section('GitHub', '<div id="gh-settings"><label class="field"><span>Username</span><input data-gh="user" value="' + esc(s.github.user) + '" placeholder="octocat" autocomplete="off"></label>' +
          '<label class="field"><span>Token (optional)</span><input data-gh="token" type="password" value="' + esc(s.github.token) + '" placeholder="github_pat_…" autocomplete="off"></label>' +
          '<p class="small muted">Without a token you get public activity (60 API calls/hour, cached for 10 minutes). A read-only fine-grained token adds private repos and CI; a classic token with <code>notifications</code> scope adds the unread badge. The token is stored only in this browser.</p></div>') +
        section('Data', '<div class="btn-row"><button class="btn" data-export>' + I('download', 16) + ' Export</button><label class="btn">' + I('upload', 16) + ' Import<input type="file" accept="application/json" hidden data-import></label>' +
          '<button class="btn ghost danger" data-reset>Reset all</button></div><p class="small muted">Everything is stored locally in this browser. Export to move it to another device.</p>');
    },
  };

  function render() {
    const p = $('#panel');
    p.innerHTML = '<header class="p-head"><h2>' + I('customize', 20) + ' Customize</h2><button class="icon-btn" data-close aria-label="Close customize panel">' + I('x', 20) + '</button></header>' +
      '<nav class="p-tabs" role="tablist">' + TABS.map(([k, l]) => '<button role="tab" data-tab="' + k + '" aria-selected="' + (tab === k) + '">' + l + '</button>').join('') + '</nav>' +
      '<div class="p-body">' + VIEWS[tab]() + '</div>';
    bind(p);
  }

  function setWidget(id, on) {
    const sp = SP.app.space(), has = sp.widgets.includes(id);
    if (on && !has) sp.widgets.push(id);
    if (!on && has) sp.widgets = sp.widgets.filter((w) => w !== id);
    if (id === 'search') { sp.widgets = sp.widgets.filter((w) => w !== 'search'); if (on) sp.widgets.unshift('search'); }
    save(); SP.app.renderMain();
  }

  function bind(p) {
    const on = (sel, ev, fn) => $$(sel, p).forEach((n) => n.addEventListener(ev, fn));
    on('[data-close]', 'click', close);
    on('[data-tab]', 'click', (e) => { tab = e.currentTarget.dataset.tab; render(); });
    on('[data-layout]', 'click', (e) => { S().layout = e.currentTarget.dataset.layout; save(); SP.app.renderMain(); render(); });
    on('[data-widget]', 'click', (e) => { const id = e.currentTarget.dataset.widget; setWidget(id, !SP.app.space().widgets.includes(id)); render(); });
    on('[data-wtoggle]', 'change', (e) => setWidget(e.target.dataset.wtoggle, e.target.checked));
    on('[data-theme]', 'click', (e) => { S().theme = e.currentTarget.dataset.theme; S().customBg = false; save(); SP.app.applyTheme(); SP.app.renderMain(); render(); });
    on('[data-accent]', 'click', (e) => { S().accent = e.currentTarget.dataset.accent; save(); SP.app.applyTheme(); render(); });
    on('[data-accent-custom]', 'input', (e) => { S().accent = e.target.value; save(); SP.app.applyTheme(); });
    on('[data-accent-custom]', 'change', render);
    on('[data-bg-shuffle]', 'click', () => { S().seed = 1 + Math.floor(Math.random() * 1e5); S().customBg = false; save(); SP.app.applyTheme(); SP.app.renderMain(); render(); });
    on('[data-bg-reset]', 'click', () => { S().customBg = false; save(); SP.store.files.del('bg'); SP.app.applyTheme(); render(); });
    on('[data-bg-file]', 'change', async (e) => {
      const f = e.target.files[0]; if (!f) return;
      try { await SP.store.files.set('bg', f); S().customBg = true; save(); await SP.app.applyTheme(); render(); }
      catch (err) { toast('Couldn’t save that image'); }
    });
    on('[data-toggle]', 'change', (e) => {
      const k = e.target.dataset.toggle, v = e.target.checked;
      if (k === 'showQuote') return setWidget('quote', v);
      S()[k] = v; save();
      if (k === 'showGreeting') SP.app.renderHero();
      if (k === 'clock24') SP.app.renderWidget('clock');
      if (k === 'favicons') SP.app.renderWidget('bookmarks');
    });
    on('[data-set]', 'change', (e) => { S()[e.target.dataset.set] = e.target.value.trim(); save(); SP.app.renderHero(); });
    on('[data-gh]', 'change', (e) => {
      S().github[e.target.dataset.gh] = e.target.value.trim(); save();
      SP.widgets.github.reset(); SP.app.renderWidget('github');
    });
    on('[data-units]', 'click', (e) => { S().units = e.currentTarget.dataset.units; save(); SP.widgets.weather.reset(); SP.app.renderWidget('weather'); render(); });
    on('[data-loc-form]', 'submit', async (e) => {
      e.preventDefault();
      const q = e.target.city.value.trim(), ul = $('[data-loc-results]', p);
      if (!q) return;
      ul.innerHTML = '<li class="muted">Searching…</li>';
      try {
        const r = await fetch('https://geocoding-api.open-meteo.com/v1/search?count=6&language=en&name=' + encodeURIComponent(q));
        const d = await r.json();
        const res = d.results || [];
        ul.innerHTML = res.length ? res.map((x, i) => '<li><button data-i="' + i + '">' + esc(x.name) + ' <small class="muted">' + esc([x.admin1, x.country].filter(Boolean).join(', ')) + '</small></button></li>').join('') : '<li class="muted">No matches</li>';
        $$('button', ul).forEach((b) => b.onclick = () => { const x = res[+b.dataset.i]; setLocation(x.name + (x.country ? ', ' + x.country : ''), x.latitude, x.longitude); });
      } catch (err) { ul.innerHTML = '<li class="muted">Search failed, check your connection</li>'; }
    });
    on('[data-geo]', 'click', () => {
      if (!navigator.geolocation) return toast('Geolocation isn’t available');
      navigator.geolocation.getCurrentPosition((pos) => setLocation('My location', pos.coords.latitude, pos.coords.longitude), () => toast('Location permission denied'));
    });
    on('[data-export]', 'click', () => {
      const data = JSON.parse(JSON.stringify(S()));
      data.github.token = '';
      SP.app.download('startpage-backup.json', JSON.stringify(data, null, 2));
    });
    on('[data-import]', 'change', async (e) => {
      const f = e.target.files[0]; if (!f) return;
      try { const obj = JSON.parse(await f.text()); if (await confirm('Import settings?', 'This replaces your current startpage data.', 'Import')) SP.store.replace(obj); }
      catch (err) { toast('That file isn’t a valid backup'); }
    });
    on('[data-reset]', 'click', async () => { if (await confirm('Reset everything?', 'All spaces, bookmarks, tasks, notes and settings go back to defaults.', 'Reset')) SP.store.reset(); });
  }

  function setLocation(name, lat, lon) {
    S().location = { name, lat, lon }; save();
    SP.widgets.weather.reset(); SP.app.renderWidget('weather'); SP.app.renderWidget('clock'); render();
    toast('Location set to ' + name);
  }

  function open(t, focus) {
    if (t) tab = t;
    const p = $('#panel');
    p.hidden = false;
    document.body.classList.add('panel-open', 'editing');
    render();
    if (focus === 'github') { const i = $('[data-gh="user"]', p); if (i) { i.scrollIntoView({ block: 'center' }); i.focus(); } }
  }
  function close() { $('#panel').hidden = true; document.body.classList.remove('panel-open', 'editing'); }
  const isOpen = () => !$('#panel').hidden;
  SP.panel = { open, close, isOpen, render, toggle: () => (isOpen() ? close() : open()) };
})(window.SP = window.SP || {});
