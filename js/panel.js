/* Customize side panel: Layout overview, Widgets, Theme, Settings. */
(function (SP) {
  'use strict';
  const { $, $$, esc, toast, confirm } = SP.ui;
  const I = SP.icon;
  const S = () => SP.store.state;
  const save = () => SP.store.save();

  const ACCENTS = ['#a78bfa', '#3b82f6', '#22d3ee', '#4ade80', '#facc15', '#fb923c', '#f472b6'];
  const TABS = ['layout', 'widgets', 'theme', 'settings'];
  /* Voiced text. `T` escapes; `L` wraps it with the neutral wording as a tooltip so a
     renamed control ("Sell the estate") is still understandable ("Reset all"). */
  const T = (k, c) => esc(SP.voice.t(k, c));
  const L = (k, c) => { const v = SP.voice.t(k, c), p = SP.voice.plain(k, c); return v === p ? esc(v) : '<span title="' + esc(p) + '">' + esc(v) + '</span>'; };
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
  const toggle = (name, key, on) => '<label class="switch-row"><span>' + L(key) + '</span><input type="checkbox" role="switch" aria-label="' + esc(SP.voice.plain(key)) + '" data-toggle="' + name + '"' + (on ? ' checked' : '') + '><span class="switch" aria-hidden="true"></span></label>';
  const section = (key, body, cls) => '<section class="p-sec ' + (cls || '') + '"><h3>' + L(key) + '</h3>' + body + '</section>';
  const field = (key, input) => '<label class="field"><span>' + L(key) + '</span>' + input + '</label>';

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
    return '<div class="w-pick">' + ids.map((id) => '<button aria-pressed="' + on.includes(id) + '" data-widget="' + id + '" title="' + T('desc_' + id) + '"><span>' + I(SP.widgetMeta[id].icon, 22) + '</span>' + esc(SP.widgetMeta[id].title) + '</button>').join('') + '</div>';
  }
  function themePicker() {
    return '<div class="theme-pick">' + Object.entries(SP.scene.themes).map(([k, t]) =>
      '<button data-theme="' + k + '" aria-pressed="' + (S().theme === k && !S().customBg) + '"><img src="' + thumb(k, S().seed) + '" alt=""><span>' + esc(t.name) + '</span>' +
      (S().theme === k && !S().customBg ? '<b class="tick">' + I('check', 12) + '</b>' : '') + '</button>').join('') + '</div>';
  }
  function bgRow() {
    return '<div class="bg-row"><div class="bg-prev" id="bg-prev"><img src="' + thumb(S().theme, S().seed) + '" alt=""></div>' +
      '<label class="btn">' + L('btn_change') + '<input type="file" accept="image/*" hidden data-bg-file></label>' +
      '<button class="icon-btn boxed" data-bg-shuffle title="New random scene">' + I('shuffle', 18) + '</button></div>' +
      (S().customBg ? '<p class="small muted">' + T('bgCustom') + ' <button class="link" data-bg-reset>' + L('bgBack') + '</button></p>' : '');
  }
  function accentRow(custom) {
    return '<div class="accent-pick" role="radiogroup" aria-label="Accent color">' + ACCENTS.map((c) =>
      '<button role="radio" aria-checked="' + (S().accent === c) + '" data-accent="' + c + '" style="--c:' + c + '" aria-label="Accent ' + c + '">' + (S().accent === c ? I('check', 16) : '') + '</button>').join('') +
      (custom ? '<label class="accent-custom" title="Custom color" style="--c:' + S().accent + '"><input type="color" value="' + S().accent + '" data-accent-custom>' + I('plus', 14) + '</label>' : '') + '</div>';
  }

  /* The picker is described by the *current* voice: every voice has opinions about the others. */
  function voicePicker() {
    const cur = SP.voice.current(), base = SP.voice.list.neutral;
    return '<p class="small muted">' + T('voiceIntro') + '</p>' +
      '<div class="voice-pick" role="radiogroup" aria-label="Voice">' + Object.entries(SP.voice.list).map(([k, v]) =>
        '<button role="radio" aria-checked="' + (SP.voice.key() === k) + '" data-voice="' + k + '"><b>' + esc(v.name) + '</b><span>' + esc((cur.blurb && cur.blurb[k]) || base.blurb[k]) + '</span></button>').join('') + '</div>';
  }

  const VIEWS = {
    layout() {
      return section('sec_layout', layoutPicker()) +
        section('sec_widgets', widgetTiles(['search', 'bookmarks', 'weather', 'clock', 'tasks', 'notes', 'github', 'music']) +
          '<button class="more-btn" data-tab="widgets">' + I('plus', 14) + ' ' + L('moreWidgets') + '</button>') +
        section('sec_theme', themePicker()) +
        section('sec_background', bgRow()) +
        section('sec_accent', accentRow(false)) +
        section('sec_voice', voicePicker()) +
        '<section class="p-sec">' + toggle('showGreeting', 'tgl_greeting', S().showGreeting) + toggle('showQuote', 'tgl_quote', SP.app.space().widgets.includes('quote')) +
          toggle('animate', 'tgl_animate', S().animate) + '</section>';
    },
    widgets() {
      const on = SP.app.space().widgets;
      return '<p class="small muted">' + T('widgetsIntro', { space: SP.app.space().name }) + '</p>' +
        '<ul class="w-list">' + SP.widgetOrder.map((id) => '<li><span class="wl-ic">' + I(SP.widgetMeta[id].icon, 20) + '</span><span class="wl-t"><b>' + esc(SP.widgetMeta[id].title) + '</b><small>' + T('desc_' + id) + '</small></span>' +
          '<label class="switch-row bare"><input type="checkbox" role="switch" aria-label="Show ' + esc(SP.widgetMeta[id].title) + '" data-wtoggle="' + id + '"' + (on.includes(id) ? ' checked' : '') + '><span class="switch" aria-hidden="true"></span></label></li>').join('') + '</ul>';
    },
    theme() {
      return section('sec_theme', themePicker()) + section('sec_background', bgRow() + toggle('animate', 'tgl_animate', S().animate)) +
        section('sec_accent', accentRow(true)) + section('sec_voice', voicePicker() + toggle('showSummary', 'tgl_summary', S().showSummary));
    },
    settings() {
      const s = S();
      const engines = Object.entries(SP.search.engines).map(([k, e]) => '<option value="' + k + '"' + (s.engine === k ? ' selected' : '') + '>' + e.name + '</option>').join('');
      return section('sec_profile',
          field('fld_name', '<input data-set="name" value="' + esc(s.name) + '">') +
          field('fld_tagline', '<input data-set="tagline" value="' + esc(s.tagline) + '">')) +
        section('sec_location',
          '<p class="small muted">' + T('locIntro', { name: s.location.name }) + '</p>' +
          '<form class="loc-search" data-loc-form><input name="city" placeholder="' + T('locPlaceholder') + '" aria-label="City"><button class="btn">' + L('btn_find') + '</button></form>' +
          '<ul class="loc-results" data-loc-results></ul><button class="link" data-geo>' + I('pin', 14) + ' ' + L('btn_geo') + '</button>' +
          '<div class="seg" role="radiogroup" aria-label="Units"><button data-units="celsius" aria-checked="' + (s.units === 'celsius') + '" role="radio">°C</button><button data-units="fahrenheit" aria-checked="' + (s.units === 'fahrenheit') + '" role="radio">°F</button></div>' +
          toggle('clock24', 'tgl_24h', s.clock24) +
          field('fld_weekStart', '<select data-weekstart><option value="1"' + (s.weekStart === 1 ? ' selected' : '') + '>Monday</option><option value="0"' + (s.weekStart === 0 ? ' selected' : '') + '>Sunday</option></select>')) +
        section('sec_voice', voicePicker() + toggle('showSummary', 'tgl_summary', s.showSummary)) +
        section('sec_search', field('fld_engine', '<select data-set="engine">' + engines + '</select>') +
          '<p class="small muted">Shortcuts: <kbd>Ctrl</kbd> <kbd>K</kbd> or <kbd>/</kbd> to focus, <code>&gt;</code> for commands, math and unit conversion inline. Bangs: ' + Object.keys(SP.search.bangs).map((b) => '<code>!' + b + '</code>').join(' ') + '</p>' +
          toggle('favicons', 'tgl_favicons', s.favicons)) +
        section('sec_github', '<div id="gh-settings"><label class="field"><span>Username</span><input data-gh="user" value="' + esc(s.github.user) + '" placeholder="octocat" autocomplete="off"></label>' +
          '<label class="field"><span>Token (optional)</span><input data-gh="token" type="password" value="' + esc(s.github.token) + '" placeholder="github_pat_…" autocomplete="off"></label>' +
          '<p class="small muted">Without a token you get public activity (60 API calls/hour, cached for 10 minutes). A read-only fine-grained token adds private repos and CI; a classic token with <code>notifications</code> scope adds the unread badge, and <code>gist</code> enables sync. The token is stored only in this browser.</p></div>') +
        section('sec_sync', s.github.token
          ? '<p class="small muted">' + T('syncIntro') + '</p>' +
            '<div class="btn-row"><button class="btn" data-sync-now>' + I('cloudSync', 16) + ' ' + L(s.sync.gistId ? 'btn_syncNow' : 'btn_syncOn') + '</button>' +
            (s.sync.gistId ? '<a class="btn ghost" href="https://gist.github.com/' + esc(s.sync.gistId) + '">' + L('btn_viewGist') + '</a>' : '') + '</div>' +
            '<p class="small muted" data-sync-status>' + esc(SP.sync.label()) + '</p>' + (s.sync.gistId ? toggle('syncAuto', 'tgl_syncAuto', s.sync.auto) : '')
          : '<p class="small muted">Add a GitHub token above (with the <code>gist</code> scope, or Gists read/write for fine-grained tokens) to sync across devices, e.g. between this site and the browser extension.</p>') +
        section('sec_data', '<div class="btn-row"><button class="btn" data-export>' + I('download', 16) + ' ' + L('btn_export') + '</button><label class="btn">' + I('upload', 16) + ' ' + L('btn_import') + '<input type="file" accept="application/json" hidden data-import></label>' +
          '<button class="btn ghost danger" data-reset>' + L('btn_reset') + '</button></div><p class="small muted">' + T('dataHelp') + '</p>');
    },
  };

  function render() {
    const p = $('#panel'), y = p.querySelector('.p-body') ? p.querySelector('.p-body').scrollTop : 0;
    p.innerHTML = '<header class="p-head"><h2>' + I('customize', 20) + ' ' + L('panelTitle') + '</h2><button class="icon-btn" data-close aria-label="Close customize panel">' + I('x', 20) + '</button></header>' +
      '<nav class="p-tabs" role="tablist">' + TABS.map((k) => '<button role="tab" data-tab="' + k + '" aria-selected="' + (tab === k) + '">' + L('tab_' + k) + '</button>').join('') + '</nav>' +
      '<div class="p-body">' + VIEWS[tab]() + '</div>';
    p.querySelector('.p-body').scrollTop = y; // switching voice re-renders; don't jump to the top
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
    on('[data-voice]', 'click', async (e) => {
      const v = e.currentTarget.dataset.voice, cur = SP.voice.key(), V = SP.voice.list;
      if (v === cur) return;
      // Some voices don't let you go quietly.
      if (V[cur].leave_title) {
        const ctx = { to: V[v].name };
        const ok = await SP.ui.dialog(SP.voice.t('leave_title', ctx), '<p class="muted">' + esc(SP.voice.t('leave_body', ctx)) + '</p>',
          { okText: SP.voice.t('leave_ok'), cancelText: SP.voice.t('leave_cancel') });
        if (!ok) return;
      }
      if (v !== 'neutral' && cur === 'neutral') S().showSummary = true; // a voice is mostly heard in the summary line
      S().presence = S().presence || {};
      S().presence.prevVoice = cur;
      S().voice = v; save(); SP.app.renderAll();
      if (V[v].welcomeVoice && cur !== 'neutral') toast(SP.voice.t('welcomeVoice', { prev: V[cur].name }));
    });
    on('[data-weekstart]', 'change', (e) => { S().weekStart = +e.target.value; save(); SP.app.renderWidget('calendar'); SP.app.renderWidget('habits'); });
    on('[data-sync-now]', 'click', async () => { await SP.sync.now(); render(); });
    on('[data-toggle]', 'change', (e) => {
      const k = e.target.dataset.toggle, v = e.target.checked;
      if (k === 'showQuote') return setWidget('quote', v);
      if (k === 'syncAuto') { S().sync.auto = v; save(); return; }
      if (k === 'animate') { S().animate = v; save(); SP.app.applyTheme(); render(); return; }
      if (k === 'showSummary') { S().showSummary = v; save(); SP.app.renderHero(); return; }
      S()[k] = v; save();
      if (k === 'showGreeting') SP.app.renderHero();
      if (k === 'clock24') SP.app.renderWidget('clock');
      if (k === 'favicons') SP.app.renderWidget('bookmarks');
    });
    on('[data-set]', 'change', (e) => { S()[e.target.dataset.set] = e.target.value.trim(); save(); SP.app.renderHero(); });
    on('[data-gh]', 'change', (e) => {
      S().github[e.target.dataset.gh] = e.target.value.trim(); save();
      SP.widgets.github.reset(); SP.app.renderWidget('github');
      SP.widgets.vitals.reset(); SP.app.renderWidget('vitals');
      if (e.target.dataset.gh === 'token') render();
    });
    on('[data-units]', 'click', (e) => { S().units = e.currentTarget.dataset.units; save(); SP.widgets.weather.reset(); SP.app.renderWidget('weather'); SP.app.renderWidget('forecast'); render(); });
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
      try { const obj = JSON.parse(await f.text()); if (await confirm(SP.voice.t('import_title'), SP.voice.t('import_body'), SP.voice.t('import_ok'))) SP.store.replace(obj); }
      catch (err) { toast('That file isn’t a valid backup'); }
    });
    on('[data-reset]', 'click', async () => { if (await confirm(SP.voice.t('reset_title'), SP.voice.t('reset_body'), SP.voice.t('reset_ok'))) SP.store.reset(); });
  }

  function setLocation(name, lat, lon) {
    S().location = { name, lat, lon }; save();
    SP.widgets.weather.reset(); SP.widgets.forecast.reset(); SP.app.renderWidget('weather'); SP.app.renderWidget('forecast'); SP.app.renderWidget('clock'); render();
    toast(SP.voice.t('toast_location', { name }));
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
