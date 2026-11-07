/* Customize side panel. Six tabs, each control in exactly one place:
   Space (layout + widgets) · Look (scene, background, accent, sky) · Voice (who talks, how, your own voices, Ask)
   · You (profile, location, search, GitHub) · Progress (recap, achievements, discoveries) · Data (sync, backup, reset).
   "Find a setting" searches all of them, in the voiced and the plain wording. */
(function (SP) {
  'use strict';
  const { $, $$, esc, toast, confirm } = SP.ui;
  const I = SP.icon;
  const S = () => SP.store.state;
  const save = () => SP.store.save();

  const ACCENTS = ['#a78bfa', '#3b82f6', '#22d3ee', '#4ade80', '#facc15', '#fb923c', '#f472b6'];
  const TABS = [['space', 'layout', 'tab_layout'], ['look', 'image', 'tab_theme'], ['voice', 'chat', 'tab_voice'], ['you', 'pin', 'tab_you'], ['progress', 'flame', 'tab_progress'], ['data', 'cloudSync', 'tab_data']];
  const ALIAS = { layout: 'space', widgets: 'space', theme: 'look', settings: 'you' }; // older names, still accepted by open()
  /* Voiced text. `T` escapes; `L` wraps it with the neutral wording as a tooltip so a
     renamed control ("Sell the estate") is still understandable ("Reset all"). */
  const T = (k, c) => esc(SP.voice.t(k, c));
  const L = (k, c) => { const v = SP.voice.t(k, c), p = SP.voice.plain(k, c); return v === p ? esc(v) : '<span title="' + esc(p) + '">' + esc(v) + '</span>'; };
  let tab = 'space', query = '';

  /* Names for the new tabs and sections, in every voice (neutral is the fallback). */
  const LINES = {
    neutral: { tab_voice: 'Voice', tab_you: 'You', tab_progress: 'Progress', tab_data: 'Data', sec_motion: 'Motion & sky', sec_talk: 'How voices behave', sec_myvoices: 'Your voices',
      sec_time: 'Time & units', sec_wrapped: 'Weekly recap', sec_backup: 'Backup', sec_danger: 'Start over', find_ph: 'Find a setting…', find_none: ({ q }) => 'No settings match “' + q + '”.' },
    monday: { tab_voice: 'Mouth', tab_you: 'You. Ugh', tab_progress: 'Trophies', tab_data: 'Evidence', sec_motion: 'Shiny things that move', sec_talk: 'How much I nag', sec_myvoices: 'Voices you made up (lonely?)',
      sec_time: 'Time you’re wasting', sec_wrapped: 'Your week, unfortunately', sec_backup: 'Copies of your mess', sec_danger: 'Burn it all down', find_ph: 'Can’t find it? Shocking…', find_none: ({ q }) => 'Nothing called “' + q + '”. Ugh. Try a real word.' },
    supportive: { tab_voice: 'Me 💕', tab_you: 'You (my favourite)', tab_progress: 'Our memories', tab_data: 'Our data', sec_motion: 'Pretty things for you', sec_talk: 'How often I talk to you (always)', sec_myvoices: 'Other voices you made?? (who are they)',
      sec_time: 'Our time together', sec_wrapped: 'Our week', sec_backup: 'Keep us safe', sec_danger: 'Leave me (please don’t)', find_ph: 'Looking for something? I’ll help!!!', find_none: ({ q }) => 'I looked EVERYWHERE for “' + q + '”. I’m so sorry. 🥺' },
    surfer: { tab_voice: 'Vibes', tab_you: 'You, dude', tab_progress: 'Rad stuff', tab_data: 'The data, man', sec_motion: 'Moving pixels', sec_talk: 'How chatty we get', sec_myvoices: 'Your homemade dudes', sec_time: 'Time, or whatever', sec_wrapped: 'The week', sec_backup: 'Save it, man', sec_danger: 'Wipeout', find_ph: 'Find a thing, bro…', find_none: ({ q }) => 'No “' + q + '” out there, man.' },
    professional: { tab_voice: 'Comms', tab_you: 'Profile', tab_progress: 'KPIs', tab_data: 'Records', sec_motion: 'Visual assets', sec_talk: 'Communication policy', sec_myvoices: 'Contractors', sec_time: 'Working hours', sec_wrapped: 'Weekly report', sec_backup: 'Data retention', sec_danger: 'Offboarding', find_ph: 'Search the knowledge base…', find_none: ({ q }) => 'No results for “' + q + '”. Please raise a ticket.' },
    therapist: { tab_voice: 'Voices', tab_you: 'You', tab_progress: 'Growth', tab_data: 'Your file', sec_motion: 'Soothing visuals', sec_talk: 'How we communicate', sec_myvoices: 'Parts of you', sec_time: 'Your relationship with time', sec_wrapped: 'Weekly reflection', sec_backup: 'Keeping records', sec_danger: 'Ending therapy', find_ph: 'What are you looking for? Really?…', find_none: ({ q }) => 'There is no “' + q + '”. What were you hoping to find?' },
    weepy: { tab_voice: 'Voices *sniff*', tab_you: 'You', tab_progress: 'Memories', tab_data: 'Keepsakes', sec_motion: 'Things that flicker and fade', sec_talk: 'How much we cry at you', sec_myvoices: 'Voices you brought to life', sec_time: 'Time, slipping away', sec_wrapped: 'The week we lost', sec_backup: 'Preserve the memories', sec_danger: 'The end of everything', find_ph: 'Searching… for meaning…', find_none: ({ q }) => '“' + q + '” is gone. Like everything. *sobs*' },
    victorian: { tab_voice: 'Elocution', tab_you: 'Your person', tab_progress: 'Distinctions', tab_data: 'The ledgers', sec_motion: 'Moving pictures (vulgar)', sec_talk: 'Matters of conversation', sec_myvoices: 'Acquaintances of your own invention', sec_time: 'Timekeeping', sec_wrapped: 'The weekly account', sec_backup: 'Copies for the solicitor', sec_danger: 'Selling the estate', find_ph: 'Enquire after a setting…', find_none: ({ q }) => 'There is no such thing as “' + q + '” in this house.' },
    owl: { tab_voice: 'Voices', tab_you: 'You (awake)', tab_progress: 'Night trophies', tab_data: 'Data', sec_motion: 'Night lights', sec_talk: 'How much we talk at 3am', find_ph: 'Find something (it’s late)…' },
    ghost: { tab_voice: 'echoes', tab_you: 'you', tab_progress: 'what remains', tab_data: 'belongings', sec_motion: 'flickering things', sec_talk: 'how loudly we whisper', sec_danger: 'let it all go', find_ph: 'search the house…', find_none: ({ q }) => 'there’s no “' + q + '” here. not anymore.' },
    parent: { tab_voice: 'Voices', tab_you: 'Our kid', tab_progress: 'The fridge', tab_data: 'The attic', sec_motion: 'Twinkly lights', sec_talk: 'How much we talk (a lot)', sec_wrapped: 'Your amazing week', sec_danger: 'Moving out', find_ph: 'Lost something, sweetie?…', find_none: ({ q }) => 'Couldn’t find “' + q + '”, sweetie. Did you look under the bed?' },
  };
  for (const [k, l] of Object.entries(LINES)) Object.assign(SP.voice.list[k], l);
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
  // When a voice renames a switch, the plain wording sits underneath (tooltips don't exist on phones).
  const plainNote = (key) => { const v = SP.voice.t(key), p = SP.voice.plain(key); return v === p ? '' : '<small>' + esc(p) + '</small>'; };
  const toggle = (name, key, on) => '<label class="switch-row"><span class="sr-t"><span>' + esc(SP.voice.t(key)) + '</span>' + plainNote(key) + '</span><input type="checkbox" role="switch" aria-label="' + esc(SP.voice.plain(key)) + '" data-toggle="' + name + '"' + (on ? ' checked' : '') + '><span class="switch" aria-hidden="true"></span></label>';
  // data-find holds the plain wording too, so "Find a setting" works whatever the voice calls things.
  const section = (key, body, cls) => '<section class="p-sec ' + (cls || '') + '" data-find="' + esc(SP.voice.plain(key)) + '"><h3>' + L(key) + '</h3>' + body + '</section>';
  const details = (summary, body) => '<details class="p-more"><summary>' + esc(summary) + '</summary>' + body + '</details>';
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
  function themePicker() {
    return '<div class="theme-pick">' + Object.entries(SP.scene.themes).map(([k, t]) => !SP.achieve.sceneUnlocked(k)
      ? '<button class="locked" aria-disabled="true" title="' + esc('Locked: ' + SP.achieve.unlockHint(k)) + '"><img src="' + thumb(k, S().seed) + '" alt=""><span>' + I('lock', 12) + ' ' + esc(SP.achieve.unlockHint(k)) + '</span></button>'
      : '<button data-theme="' + k + '" aria-pressed="' + (S().theme === k && !S().customBg) + '"><img src="' + thumb(k, S().seed) + '" alt=""><span>' + esc(t.name) + '</span>' +
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

  /* Switch voice. Some voices don't let you go quietly. */
  async function setVoice(v) {
    const cur = SP.voice.key(), V = SP.voice.list;
    if (v === cur || !SP.voice.unlocked(v)) return;
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
    const tt = SP.achieve.tot(), vs = tt.voices || (tt.voices = []); if (!vs.includes(v)) vs.push(v);
    SP.achieve.check();
    const grudge = SP.bonds.switched(cur, v); // a voice you've left before remembers
    if (grudge) toast(grudge, { who: V[v].name });
    else if (V[v].welcomeVoice && cur !== 'neutral') toast(SP.voice.t('welcomeVoice', { prev: V[cur].name }), { who: V[v].name });
  }

  /* The picker is described by the *current* voice: every voice has opinions about the others.
     Secret voices show up as locked tiles with a hint, until you earn them. */
  function voicePicker() {
    const cur = SP.voice.current(), base = SP.voice.list.neutral;
    return '<p class="small muted">' + T('voiceIntro') + '</p>' +
      '<div class="voice-pick" role="radiogroup" aria-label="Voice">' + Object.entries(SP.voice.list).map(([k, v]) => SP.voice.unlocked(k)
        ? '<button role="radio" aria-checked="' + (SP.voice.key() === k) + '" data-voice="' + k + '"' + (v.secret ? ' class="secret"' : '') + '><b>' + esc(v.name) + '</b><span>' + esc((cur.blurb && cur.blurb[k]) || base.blurb[k] || v.descriptor) + '</span></button>'
        : '<button role="radio" aria-checked="false" aria-disabled="true" class="locked" title="Locked"><b>' + I('lock', 14) + ' ???</b><span>' + esc(v.hint) + '</span></button>').join('') + '</div>';
  }
  const VIEWS = {
    space() {
      const sp = SP.app.space(), on = sp.widgets, ids = SP.widgetOrder;
      const row = (id) => '<li><span class="wl-ic">' + I(SP.widgetMeta[id].icon, 20) + '</span><span class="wl-t"><b>' + esc(SP.widgetMeta[id].title) + '</b><small>' + T('desc_' + id) + '</small></span>' +
        '<label class="switch-row bare"><input type="checkbox" role="switch" aria-label="Show ' + esc(SP.widgetMeta[id].title) + '" data-wtoggle="' + id + '"' + (on.includes(id) ? ' checked' : '') + '><span class="switch" aria-hidden="true"></span></label></li>';
      const shown = on.filter((id) => ids.includes(id)), hidden = ids.filter((id) => !on.includes(id));
      return section('sec_layout', layoutPicker() + toggle('showGreeting', 'tgl_greeting', S().showGreeting)) +
        section('sec_widgets', '<p class="small muted">' + T('widgetsIntro', { space: sp.name }) + '</p>' +
          '<ul class="w-list">' + shown.map(row).join('') + '</ul>' +
          (hidden.length ? '<h4 class="p-sub">' + L('moreWidgets') + '</h4><ul class="w-list">' + hidden.map(row).join('') + '</ul>' : ''));
    },
    look() {
      return section('sec_theme', themePicker()) +
        section('sec_background', bgRow()) +
        section('sec_accent', accentRow(true)) +
        section('sec_motion', toggle('animate', 'tgl_animate', S().animate) + toggle('liveSky', 'tgl_liveSky', S().liveSky !== false) + toggle('seasons', 'tgl_seasons', S().seasons !== false));
    },
    voice() {
      return section('sec_voice', voicePicker()) +
        section('sec_talk', toggle('showSummary', 'tgl_summary', S().showSummary) + toggle('heckles', 'tgl_heckles', S().heckles !== false) +
          toggle('dares', 'tgl_dares', S().dares !== false) + toggle('brief', 'tgl_brief', S().brief !== false) +
          (SP.speak.supported() ? toggle('speak', 'tgl_speak', !!S().speak) : '') + toggle('chaos', 'tgl_chaos', !!S().chaos)) +
        section('sec_myvoices', '<p class="small muted">Describe a personality and Claude writes it, using your API key. Share your voices as a link or a file.</p>' + SP.maker.sectionHtml()) +
        section('sec_ask', SP.ask.settingsHtml());
    },
    you() {
      const s = S();
      const engines = Object.entries(SP.search.engines).map(([k, e]) => '<option value="' + k + '"' + (s.engine === k ? ' selected' : '') + '>' + e.name + '</option>').join('');
      return section('sec_profile',
          field('fld_name', '<input data-set="name" value="' + esc(s.name) + '" autocomplete="given-name">') +
          field('fld_tagline', '<input data-set="tagline" value="' + esc(s.tagline) + '">') +
          '<button class="link" data-onboard>' + I('sparkles', 14) + ' ' + L('ob_rerun') + '</button>') +
        section('sec_location',
          '<p class="small muted">' + (s.location ? T('locIntro', { name: s.location.name }) : T('locNone')) + '</p>' +
          '<form class="loc-search" data-loc-form><input name="city" placeholder="' + T('locPlaceholder') + '" aria-label="City"><button class="btn">' + L('btn_find') + '</button></form>' +
          '<ul class="loc-results" data-loc-results></ul><button class="link" data-geo>' + I('pin', 14) + ' ' + L('btn_geo') + '</button>') +
        section('sec_time',
          '<div class="p-grid"><div class="field"><span>Temperature</span><div class="seg" role="radiogroup" aria-label="Units"><button data-units="celsius" aria-checked="' + (s.units === 'celsius') + '" role="radio">°C</button><button data-units="fahrenheit" aria-checked="' + (s.units === 'fahrenheit') + '" role="radio">°F</button></div></div>' +
          field('fld_weekStart', '<select data-weekstart><option value="1"' + (s.weekStart === 1 ? ' selected' : '') + '>Monday</option><option value="0"' + (s.weekStart === 0 ? ' selected' : '') + '>Sunday</option></select>') + '</div>' +
          toggle('clock24', 'tgl_24h', s.clock24)) +
        section('sec_search', field('fld_engine', '<select data-set="engine">' + engines + '</select>') + toggle('favicons', 'tgl_favicons', s.favicons) +
          details('Search shortcuts', '<p class="small muted"><kbd>Ctrl</kbd> <kbd>K</kbd> or <kbd>/</kbd> to focus. <code>&gt;</code> for commands, <code>?</code> to ask the voice, math and unit conversion inline. Bangs: ' + Object.keys(SP.search.bangs).map((b) => '<code>!' + b + '</code>').join(' ') + '</p>')) +
        section('sec_github', '<div id="gh-settings"><label class="field"><span>Username</span><input data-gh="user" value="' + esc(s.github.user) + '" placeholder="octocat" autocomplete="off"></label>' +
          '<label class="field"><span>Token (optional)</span><input data-gh="token" type="password" value="' + esc(s.github.token) + '" placeholder="github_pat_…" autocomplete="off"></label>' +
          details('What the token is for', '<p class="small muted">Without a token you get public activity (60 API calls an hour, cached for 10 minutes). A read-only fine-grained token adds private repos and CI; a classic token with <code>notifications</code> scope adds the unread badge, and <code>gist</code> enables sync. The token is stored only in this browser.</p>') + '</div>');
    },
    progress() {
      return section('sec_wrapped', '<p class="small muted">Your week, narrated by the current voice. It also opens by itself on the first tab each Sunday.</p><button class="btn" data-wrapped>' + I('gift', 16) + ' ' + L('wr_open') + '</button>') +
        section('sec_achievements', SP.achieve.sectionHtml()) +
        section('sec_discoveries', SP.eggs.sectionHtml());
    },
    data() {
      const s = S();
      return section('sec_sync', s.github.token
          ? '<p class="small muted">' + T('syncIntro') + '</p>' +
            '<div class="btn-row"><button class="btn" data-sync-now>' + I('cloudSync', 16) + ' ' + L(s.sync.gistId ? 'btn_syncNow' : 'btn_syncOn') + '</button>' +
            (s.sync.gistId ? '<a class="btn ghost" href="https://gist.github.com/' + esc(s.sync.gistId) + '">' + L('btn_viewGist') + '</a>' : '') + '</div>' +
            '<p class="small muted" data-sync-status>' + esc(SP.sync.label()) + '</p>' + (s.sync.gistId ? toggle('syncAuto', 'tgl_syncAuto', s.sync.auto) : '')
          : '<p class="small muted">Sync needs a GitHub token with the <code>gist</code> scope (or Gists read/write for fine-grained tokens). It keeps this browser, the extension and your phone in step.</p><button class="btn" data-goto="you" data-focus="github">' + I('github', 16) + ' Add a GitHub token</button>') +
        section('sec_backup', '<p class="small muted">' + T('dataHelp') + '</p><div class="btn-row"><button class="btn" data-export>' + I('download', 16) + ' ' + L('btn_export') + '</button><label class="btn">' + I('upload', 16) + ' ' + L('btn_import') + '<input type="file" accept="application/json" hidden data-import></label></div>') +
        section('sec_danger', '<p class="small muted">Puts every space, task, note, habit and setting back to the defaults. Export first if you might want it back.</p><button class="btn ghost danger" data-reset>' + I('trash', 16) + ' ' + L('btn_reset') + '</button>', 'danger-zone');
    },
  };

  function render() {
    const p = $('#panel'), y = p.querySelector('.p-body') ? p.querySelector('.p-body').scrollTop : 0, hadFocus = document.activeElement && document.activeElement.matches('[data-find-input]');
    p.innerHTML = '<header class="p-head"><h2>' + I('customize', 20) + ' ' + L('panelTitle') + '</h2><button class="icon-btn" data-close aria-label="Close customize panel">' + I('x', 20) + '</button></header>' +
      '<div class="p-find">' + I('search', 16) + '<input type="search" data-find-input placeholder="' + T('find_ph') + '" aria-label="Find a setting" value="' + esc(query) + '" autocomplete="off" spellcheck="false"></div>' +
      (query ? '' : '<nav class="p-tabs" role="tablist">' + TABS.map(([k, icon, key]) => '<button role="tab" data-tab="' + k + '" aria-selected="' + (tab === k) + '" title="' + esc(SP.voice.plain(key)) + '">' + I(icon, 17) + '<span>' + esc(SP.voice.t(key)) + '</span></button>').join('') + '</nav>') +
      '<div class="p-body">' + (query ? TABS.map(([k]) => VIEWS[k]()).join('') : VIEWS[tab]()) + '</div>';
    if (query) find(p);
    p.querySelector('.p-body').scrollTop = query ? 0 : y; // switching voice re-renders; don't jump to the top
    bind(p);
    if (hadFocus) { const f = p.querySelector('[data-find-input]'); f.focus(); f.setSelectionRange(f.value.length, f.value.length); }
  }
  /* Show only the sections (and, inside them, the switches) that match the search, in either wording. */
  function find(p) {
    const q = query.toLowerCase(), body = p.querySelector('.p-body');
    const text = (n) => (n.textContent + ' ' + [n, ...n.querySelectorAll('[title],[aria-label],[placeholder],[data-find]')].map((x) => [x.title, x.getAttribute('aria-label'), x.getAttribute('placeholder'), x.dataset.find].join(' ')).join(' ')).toLowerCase();
    let hits = 0;
    body.querySelectorAll('.p-sec').forEach((sec) => {
      if (text(sec.querySelector('h3')) .includes(q) || (sec.dataset.find || '').toLowerCase().includes(q)) { hits++; return; } // the whole section
      const rows = [...sec.querySelectorAll('.switch-row:not(.bare), .field, .w-list li, .voice-pick button, .theme-pick button, .ach-list li')];
      const match = rows.filter((r) => text(r).includes(q));
      if (match.length) { hits++; rows.forEach((r) => { if (!match.includes(r)) r.hidden = true; }); sec.querySelectorAll('p.small.muted').forEach((n) => { if (!text(n).includes(q)) n.hidden = true; }); }
      else sec.hidden = true;
    });
    if (!hits) body.innerHTML = '<p class="p-none muted">' + T('find_none', { q: query }) + '</p>';
  }

  function setWidget(id, on) {
    const sp = SP.app.space(), has = sp.widgets.includes(id);
    if (on && !has) sp.widgets.push(id);
    if (!on && has) sp.widgets = sp.widgets.filter((w) => w !== id);
    if (id === 'search') { sp.widgets = sp.widgets.filter((w) => w !== 'search'); if (on) sp.widgets.unshift('search'); }
    save(); SP.app.renderMain();
  }

  function bind(p) {
    SP.ask.bindSettings(p);
    SP.maker.bind(p);
    const on = (sel, ev, fn) => $$(sel, p).forEach((n) => n.addEventListener(ev, fn));
    on('[data-close]', 'click', close);
    on('[data-tab]', 'click', (e) => { tab = e.currentTarget.dataset.tab; render(); });
    on('[data-goto]', 'click', (e) => open(e.currentTarget.dataset.goto, e.currentTarget.dataset.focus));
    on('[data-find-input]', 'input', (e) => { query = e.target.value.trim(); render(); });
    on('[data-find-input]', 'keydown', (e) => { if (e.key === 'Escape' && query) { e.preventDefault(); e.stopPropagation(); query = ''; render(); } });
    on('[data-layout]', 'click', (e) => { S().layout = e.currentTarget.dataset.layout; save(); SP.app.renderMain(); render(); });
    on('[data-wtoggle]', 'change', (e) => { setWidget(e.target.dataset.wtoggle, e.target.checked); render(); });
    on('[data-theme]', 'click', (e) => { if (!SP.achieve.sceneUnlocked(e.currentTarget.dataset.theme)) return; S().theme = e.currentTarget.dataset.theme; S().customBg = false; save(); SP.app.applyTheme(); SP.app.renderMain(); render(); });
    on('[data-accent]', 'click', (e) => { S().accent = e.currentTarget.dataset.accent; save(); SP.app.applyTheme(); render(); });
    on('[data-accent-custom]', 'input', (e) => { S().accent = e.target.value; save(); SP.app.applyTheme(); });
    on('[data-accent-custom]', 'change', render);
    on('[data-bg-shuffle]', 'click', () => { SP.eggs.shuffled(); S().seed = 1 + Math.floor(Math.random() * 1e5); S().customBg = false; save(); SP.app.applyTheme(); SP.app.renderMain(); render(); });
    on('[data-bg-reset]', 'click', () => { S().customBg = false; save(); SP.store.files.del('bg'); SP.app.applyTheme(); render(); });
    on('[data-bg-file]', 'change', async (e) => {
      const f = e.target.files[0]; if (!f) return;
      try { await SP.store.files.set('bg', f); S().customBg = true; save(); await SP.app.applyTheme(); render(); }
      catch (err) { toast('Couldn’t save that image'); }
    });
    on('[data-voice]', 'click', (e) => setVoice(e.currentTarget.dataset.voice));
    on('[data-onboard]', 'click', () => SP.onboarding.start());
    on('[data-wrapped]', 'click', () => SP.wrapped.open());
    on('[data-weekstart]', 'change', (e) => { S().weekStart = +e.target.value; save(); SP.app.renderWidget('calendar'); SP.app.renderWidget('habits'); });
    on('[data-sync-now]', 'click', async () => { await SP.sync.now(); render(); });
    on('[data-toggle]', 'change', (e) => {
      const k = e.target.dataset.toggle, v = e.target.checked;
      if (k === 'showQuote') return setWidget('quote', v);
      if (k === 'syncAuto') { S().sync.auto = v; save(); return; }
      if (k === 'animate') { S().animate = v; save(); SP.app.applyTheme(); render(); return; }
      if (k === 'showSummary' || k === 'heckles' || k === 'dares') { S()[k] = v; save(); SP.app.renderHero(); return; }
      if (k === 'speak') { S().speak = v; save(); if (v) SP.speak.say(SP.voice.t('speakHello'), null, true); else SP.speak.stop(); return; }
      if (k === 'chaos') { S().chaos = v; save(); SP.app.renderMain(); SP.achieve.check(); if (v) toast(SP.voice.t('chaosOn'), { who: SP.voice.key() === 'neutral' ? '' : SP.voice.current().name }); return; }
      S()[k] = v; save();
      if (k === 'showGreeting') SP.app.renderHero();
      if (k === 'liveSky' || k === 'seasons') { SP.sky.update(); SP.app.renderAll(); }
      if (k === 'clock24') SP.app.renderWidget('clock');
      if (k === 'favicons') SP.app.renderWidget('bookmarks');
    });
    on('[data-set]', 'change', (e) => { S()[e.target.dataset.set] = e.target.value.trim(); save(); SP.app.renderHero(); SP.eggs.checkAll(); });
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
    if (t) { tab = ALIAS[t] || t; query = ''; }
    const p = $('#panel');
    p.hidden = false;
    document.body.classList.add('panel-open', 'editing');
    render();
    const target = focus === 'github' ? $('[data-gh="user"]', p) : focus === 'location' ? $('[data-loc-form] input', p) : null;
    if (target) { target.scrollIntoView({ block: 'center' }); target.focus(); }
  }
  function close() { $('#panel').hidden = true; document.body.classList.remove('panel-open', 'editing'); }
  const isOpen = () => !$('#panel').hidden;
  SP.panel = { open, close, isOpen, render, setVoice, toggle: () => (isOpen() ? close() : open()) };
})(window.SP = window.SP || {});
