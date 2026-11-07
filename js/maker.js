/* Voice maker: describe a voice ("a pirate who hates Mondays") and Claude writes the page's copy in
   that voice, using your own API key. Custom voices are stored in state.customVoices (so they sync),
   and can be shared as a link or a file. Anything imported is treated as untrusted text: only known
   keys are kept, strings are length-capped, and everything is rendered as text, never as HTML. */
(function (SP) {
  'use strict';
  const { esc } = SP.ui;
  const I = SP.icon;
  const S = () => SP.store.state;
  const V = SP.voice.list;
  const { C } = SP.voice._h;
  const PERIODS = ['morning', 'afternoon', 'evening', 'night'];
  const WX = ['wet', 'snow', 'cold', 'warm', 'mild'];
  // Reaction-style lines written as templates; {placeholders} are filled from the event.
  const TPL = {
    re_taskAdd: '{text}', re_taskDone: '{text}', re_taskAllDone: '', re_taskDelete: '{text}', re_focusPause: '{time}', re_streakBreak: '{name} {n}',
    re_late: '{time}', re_visits: '{n}', re_unlock: '{name}', welcomeBack: '{away}', leave_title: '', leave_body: '{to}', welcomeVoice: '{prev}',
    tasksEmpty: '', focusDone: '', breakDone: '', streak: '{n}', streakToast: '{n} {name}', focusToday: '{n}', grid_empty: '',
  };
  // Plain interface labels the maker rewrites (the rest fall back to neutral).
  const LABELS = ['panelTitle', 'tab_layout', 'tab_widgets', 'tab_theme', 'tab_settings', 'sec_voice', 'sec_theme', 'sec_profile', 'sec_location', 'sec_data',
    'w_tasks', 'w_notes', 'w_bookmarks', 'w_github', 'w_worldclock', 'w_news', 'w_forecast', 'focusTitle', 'cdTitle', 'habitsTitle', 'vitalsTitle',
    'mode_work', 'mode_short', 'mode_long', 'search_placeholder', 'notes_placeholder', 'task_placeholder', 'rail_customize', 'rail_newSpace', 'dlg_save', 'dlg_cancel',
    'reset_title', 'reset_body', 'reset_ok', 'tgl_summary', 'voiceIntro', 'wx_noLocation', 'wx_setLocation', 'mb_title', 'wr_title', 'wr_outro', 'ask_ph', 'ask_thinking'];

  const strA = (n) => ({ type: 'array', items: { type: 'string' }, description: n });
  const obj = (props) => ({ type: 'object', properties: props, required: Object.keys(props), additionalProperties: false });
  const SCHEMA = obj({
    name: { type: 'string', description: 'Short display name, 1-3 words' },
    descriptor: { type: 'string', description: 'One-line tagline in the voice' },
    greet: obj(Object.fromEntries(PERIODS.map((p) => [p, strA('3 short greetings for the ' + p + ', no trailing punctuation, no name')]))),
    address: { type: 'string', description: 'How the voice addresses the user; must contain {name}' },
    summary: strA('4 one-sentence summary lines; may use {open} (open task count) and {focus} (focus sessions today)'),
    weather: obj(Object.fromEntries(WX.map((w) => [w, { type: 'string' }]))),
    lines: obj(Object.fromEntries(Object.entries(TPL).map(([k, ph]) => [k, { type: 'string', description: ph ? 'may use ' + ph : '' }]))),
    labels: obj(Object.fromEntries(LABELS.map((k) => [k, { type: 'string' }]))),
    heckles: strA('3 short lines butting in on another voice; may use {who}'),
    speech: obj({ pitch: { type: 'number', description: '0.5-1.6' }, rate: { type: 'number', description: '0.6-1.4' } }),
  });

  /* ---- untrusted spec → safe spec ---- */
  const cap = (s, n) => (typeof s === 'string' ? s.replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, n || 240) : '');
  const caps = (a, n, m) => (Array.isArray(a) ? a.map((x) => cap(x, n)).filter(Boolean).slice(0, m || 6) : []);
  function sanitize(x) {
    if (!x || typeof x !== 'object') throw new Error('Not a voice file');
    const out = { name: cap(x.name, 32), descriptor: cap(x.descriptor, 120), greet: {}, address: cap(x.address, 60), summary: caps(x.summary, 240), weather: {}, lines: {}, labels: {}, heckles: caps(x.heckles, 160, 4) };
    if (!out.name) throw new Error('This voice has no name');
    for (const p of PERIODS) out.greet[p] = caps(x.greet && x.greet[p], 80, 4);
    for (const w of WX) out.weather[w] = cap(x.weather && x.weather[w], 160);
    for (const k of Object.keys(TPL)) { const v = cap(x.lines && x.lines[k], 260); if (v) out.lines[k] = v; }
    for (const k of LABELS) { const v = cap(x.labels && x.labels[k], 120); if (v) out.labels[k] = v; }
    const sp = x.speech || {}, num = (v, lo, hi, d) => (typeof v === 'number' && isFinite(v) ? Math.min(hi, Math.max(lo, v)) : d);
    out.speech = { pitch: num(sp.pitch, 0.5, 1.6, 1), rate: num(sp.rate, 0.6, 1.4, 1) };
    return out;
  }

  /* ---- spec → voice object (templates become functions of the event context) ---- */
  function fill(tpl, ctx) {
    const c = C();
    return tpl.replace(/\{(\w+)\}/g, (m, k) => { const v = k === 'away' ? c.awayText : ctx && ctx[k] !== undefined ? ctx[k] : c[k]; return v === undefined || v === null || typeof v === 'object' ? '' : String(v); }).replace(/\s{2,}/g, ' ').trim();
  }
  const fn = (tpl) => (ctx) => fill(tpl, ctx);
  function build(spec) {
    const v = { name: spec.name, descriptor: spec.descriptor || 'A voice you made.', custom: true, speech: spec.speech, blurb: {} };
    if (PERIODS.every((p) => spec.greet[p].length)) v.greet = (p) => spec.greet[p];
    if (spec.address && spec.address.includes('{name}')) v.addr = ({ name }) => fill(spec.address, { name: name || 'friend' });
    if (spec.summary.length) v.heroSub = (ctx) => spec.summary.map((x) => fill(x, ctx));
    if (WX.every((w) => spec.weather[w])) v.weatherQuip = (c) => { const n = SP.voice.list.neutral.weatherQuip(c); const w = SP.voice._h.wx(c); return spec.weather[w.wet ? 'wet' : w.snow ? 'snow' : w.cold ? 'cold' : w.warm ? 'warm' : 'mild'] || n; };
    for (const [k, tpl] of Object.entries(spec.lines)) v[k] = TPL[k] ? fn(tpl) : tpl;
    for (const [k, s] of Object.entries(spec.labels)) v[k] = s;
    if (spec.heckles.length) v.heckle = spec.heckles.map(fn);
    return v;
  }

  function register() {
    for (const k of Object.keys(V)) if (V[k].custom) delete V[k];
    for (const [id, spec] of Object.entries(S().customVoices || {})) { try { V['c_' + id] = build(sanitize(spec)); } catch (e) { /* skip broken */ } }
  }
  function add(spec) {
    const safe = sanitize(spec), id = SP.ui.uid().slice(0, 8);
    (S().customVoices || (S().customVoices = {}))[id] = safe; SP.store.save(); register();
    return 'c_' + id;
  }
  function remove(key) { delete (S().customVoices || {})[key.slice(2)]; if (S().voice === key) S().voice = 'neutral'; SP.store.save(); register(); SP.app.renderAll(); }

  /* ---- generate with Claude ---- */
  async function generate(description, onProgress) {
    const sample = ['greet', 'heroSub', 're_taskDone', 'tasksEmpty'].map((k) => k + ': ' + JSON.stringify(SP.voice.resolve(V.monday[k], k, k === 'greet' ? 'evening' : { open: 3, focus: 0, text: 'Write report' }))).join('\n');
    const sys = 'You write the interface copy of a playful browser start page, in one personality "voice". Every string the page shows can be rewritten in the voice: greetings, ' +
      'widget titles, buttons, settings, dialogs, and the voice\'s reactions to what the user does. Push the personality to an entertaining extreme, but keep every line short, ' +
      'readable and still clear about what the control does. Never be hateful or cruel about who someone is. Keep {placeholders} exactly as given where a field says it may use them; never invent new ones. ' +
      'For reference, here is how the built-in "Monday" voice (tired, rude) sounds:\n' + sample;
    const raw = await SP.ask.json('Write a complete voice for this description:\n\n' + description.slice(0, 600), SCHEMA, { system: sys, onText: onProgress });
    return sanitize(raw);
  }

  /* ---- sharing: a link (#voice=...) or a .json file ---- */
  const b64 = (u8) => btoa(String.fromCharCode(...u8)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const unb64 = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));
  async function pipe(u8, T) { return new Uint8Array(await new Response(new Blob([u8]).stream().pipeThrough(new T('deflate-raw'))).arrayBuffer()); }
  async function encode(spec) {
    const u8 = new TextEncoder().encode(JSON.stringify(spec));
    if (typeof CompressionStream === 'function') return 'z' + b64(await pipe(u8, CompressionStream));
    return 'j' + b64(u8);
  }
  async function decode(s) {
    if (!/^[zj][A-Za-z0-9_-]+$/.test(s) || s.length > 120000) throw new Error('That voice link is damaged.');
    let u8 = unb64(s.slice(1));
    if (s[0] === 'z') u8 = await pipe(u8, DecompressionStream);
    return sanitize(JSON.parse(new TextDecoder().decode(u8)));
  }
  async function shareLink(key) {
    const spec = S().customVoices[key.slice(2)], base = /^https?:$/.test(location.protocol) ? location.origin + location.pathname : 'https://vardirhq.github.io/startpage/';
    const url = base + '#voice=' + await encode(spec);
    try { await navigator.clipboard.writeText(url); SP.ui.toast('Link to “' + spec.name + '” copied.'); } catch (e) { SP.ui.toast('Couldn’t copy the link.'); }
    return url;
  }
  function exportFile(key) { const spec = S().customVoices[key.slice(2)]; SP.app.download('voice-' + spec.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.json', JSON.stringify(spec, null, 2)); }
  async function offer(spec) {
    const ok = await SP.ui.dialog('Add the voice “' + spec.name + '”?', '<p class="muted">' + esc(spec.descriptor) + '</p><p class="small muted">Someone shared this voice with you. It only changes the page’s wording, and you can delete it any time in Customize → Voice.</p>', { okText: 'Add voice', cancelText: 'No thanks' });
    if (!ok) return null;
    const k = add(spec); SP.panel.setVoice(k); return k;
  }
  /* On load: a #voice= link imports a shared voice (after asking). */
  async function fromHash() {
    const m = /^#voice=(.+)$/.exec(location.hash);
    if (!m) return;
    history.replaceState(null, '', location.pathname + location.search);
    try { await offer(await decode(m[1])); } catch (e) { SP.ui.toast(e.message || 'That voice link didn’t work.'); }
  }

  /* ---- UI ---- */
  function sectionHtml() {
    const mine = Object.keys(V).filter((k) => V[k].custom);
    return '<div class="maker">' + (mine.length ? '<ul class="maker-list">' + mine.map((k) => '<li><b>' + esc(V[k].name) + '</b><span class="muted">' + esc(V[k].descriptor) + '</span>' +
      '<button class="icon-btn" data-mk-share="' + k + '" title="Copy share link" aria-label="Copy share link">' + I('share', 15) + '</button>' +
      '<button class="icon-btn" data-mk-export="' + k + '" title="Download as a file" aria-label="Download as a file">' + I('download', 15) + '</button>' +
      '<button class="icon-btn" data-mk-del="' + k + '" title="Delete" aria-label="Delete">' + I('trash', 15) + '</button></li>').join('') + '</ul>' : '') +
      '<div class="maker-acts"><button class="btn small" data-mk-new>' + I('sparkles', 14) + ' Create a voice</button>' +
      '<label class="btn small ghost">' + I('upload', 14) + ' Import<input type="file" accept="application/json,.json" hidden data-mk-import></label></div></div>';
  }
  function bind(p) {
    p.querySelectorAll('[data-mk-share]').forEach((b) => (b.onclick = () => shareLink(b.dataset.mkShare)));
    p.querySelectorAll('[data-mk-export]').forEach((b) => (b.onclick = () => exportFile(b.dataset.mkExport)));
    p.querySelectorAll('[data-mk-del]').forEach((b) => (b.onclick = async () => { if (await SP.ui.confirm('Delete “' + V[b.dataset.mkDel].name + '”?', 'This voice will be gone from every device you sync.', 'Delete')) { remove(b.dataset.mkDel); SP.panel.render(); } }));
    const n = p.querySelector('[data-mk-new]'); if (n) n.onclick = create;
    const f = p.querySelector('[data-mk-import]');
    if (f) f.onchange = async () => { try { const spec = sanitize(JSON.parse(await f.files[0].text())); const k = add(spec); SP.panel.setVoice(k); } catch (e) { SP.ui.toast(e.message || 'That isn’t a voice file.'); } };
  }
  async function create() {
    if (!SP.ask.hasKey()) { SP.panel.close(); SP.ask.open(); return SP.ui.toast('Add your Claude API key first, then try again.'); }
    const v = await SP.ui.form('Create a voice', [{ name: 'desc', label: 'Describe the personality', required: true, placeholder: 'A pirate who hates Mondays and calls tasks “plunder”' }], { okText: 'Write it' });
    if (!v) return;
    const t = SP.ui.toast('Writing your voice… this takes a minute.', { ms: 120000 });
    let chars = 0;
    try {
      const spec = await generate(v.desc, (txt) => { chars = txt.length; const s = t.querySelector('span'); if (s) s.textContent = 'Writing your voice… ' + Math.min(99, Math.round(chars / 90)) + '%'; });
      const k = add(spec); t.remove(); await SP.panel.setVoice(k); if (SP.panel.isOpen()) SP.panel.render();
      SP.ui.toast((spec.lines.welcomeVoice ? fill(spec.lines.welcomeVoice, { prev: 'Neutral' }) : spec.descriptor), { who: spec.name + ' · new voice' });
    } catch (e) { t.remove(); SP.ui.toast(e.status === 401 ? 'That API key was rejected.' : (e.message || 'Couldn’t write the voice.')); }
  }

  register();
  SP.maker = { sanitize, build, add, remove, register, generate, encode, decode, fromHash, shareLink, sectionHtml, bind, SCHEMA, fill };
})(window.SP = window.SP || {});
