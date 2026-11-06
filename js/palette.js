/* Search-bar intelligence: instant answers (math, unit conversion, dates) and `>` commands. */
(function (SP) {
  'use strict';
  const S = () => SP.store.state;
  const save = () => SP.store.save();

  /* ---------- safe math parser (recursive descent, no eval) ---------- */
  const FN = { sqrt: Math.sqrt, sin: Math.sin, cos: Math.cos, tan: Math.tan, log: Math.log10, ln: Math.log, abs: Math.abs, round: Math.round, floor: Math.floor, ceil: Math.ceil, exp: Math.exp };
  const CONST = { pi: Math.PI, e: Math.E, tau: Math.PI * 2 };
  function calc(src) {
    const toks = src.toLowerCase().replace(/×/g, '*').replace(/÷/g, '/').replace(/(\d),(\d)/g, '$1.$2')
      .match(/\d*\.?\d+(?:e[+-]?\d+)?|[a-z]+|[-+*/^%()!]/g);
    if (!toks || toks.join('') !== src.toLowerCase().replace(/\s+/g, '').replace(/×/g, '*').replace(/÷/g, '/').replace(/(\d),(\d)/g, '$1.$2')) return null;
    let i = 0;
    const peek = () => toks[i], eat = (t) => { if (toks[i] !== t) throw new Error('expected ' + t); i++; };
    function expr() { let v = term(); while (peek() === '+' || peek() === '-') { const op = toks[i++]; const r = term(); v = op === '+' ? v + r : v - r; } return v; }
    function term() {
      let v = unary();
      for (;;) {
        const op = peek();
        if (op === '*' || op === '/' || op === '%') { i++; const r = unary(); v = op === '*' ? v * r : op === '/' ? v / r : v % r; }
        else if (op === '(' || (op && /^[a-z\d.]/.test(op))) v *= power(); // implicit multiplication: 2pi, 3(4+1)
        else return v;
      }
    }
    // Unary minus binds looser than ^, so -2^2 = -4 and 2^-1 = 0.5.
    function unary() { if (peek() === '-') { i++; return -unary(); } if (peek() === '+') { i++; return unary(); } return power(); }
    function power() { const b = postfix(); if (peek() === '^') { i++; return Math.pow(b, unary()); } return b; }
    function postfix() {
      let v = primary();
      while (peek() === '!') { i++; if (v < 0 || v > 170 || v % 1) throw new Error('bad factorial'); let f = 1; for (let k = 2; k <= v; k++) f *= k; v = f; }
      return v;
    }
    function primary() {
      const t = toks[i++];
      if (t === undefined) throw new Error('end');
      if (t === '(') { const v = expr(); eat(')'); return v; }
      if (/^\d|^\./.test(t)) return parseFloat(t);
      if (t in CONST) return CONST[t];
      if (t in FN) { eat('('); const v = expr(); eat(')'); return FN[t](v); }
      throw new Error('unknown ' + t);
    }
    try {
      const v = expr();
      if (i !== toks.length || !isFinite(v)) return null;
      return v;
    } catch (e) { return null; }
  }
  const fmtNum = (v) => {
    if (Math.abs(v) >= 1e15 || (Math.abs(v) < 1e-6 && v !== 0)) return v.toExponential(6).replace(/\.?0+e/, 'e');
    return String(parseFloat(v.toPrecision(12)));
  };

  /* ---------- units ---------- */
  const UNITS = {
    length: { m: 1, meter: 1, meters: 1, km: 1000, cm: 0.01, mm: 0.001, mi: 1609.344, mile: 1609.344, miles: 1609.344, ft: 0.3048, feet: 0.3048, foot: 0.3048, in: 0.0254, inch: 0.0254, inches: 0.0254, yd: 0.9144, nmi: 1852 },
    mass: { kg: 1, g: 0.001, mg: 1e-6, lb: 0.45359237, lbs: 0.45359237, oz: 0.028349523, st: 6.35029318, t: 1000 },
    volume: { l: 1, liter: 1, liters: 1, ml: 0.001, dl: 0.1, cl: 0.01, gal: 3.785411784, qt: 0.946352946, pt: 0.473176473, cup: 0.2365882365, floz: 0.0295735296 },
    speed: { 'km/h': 1, kmh: 1, kph: 1, mph: 1.609344, 'm/s': 3.6, ms: 3.6, kn: 1.852, knots: 1.852 },
    data: { b: 1, kb: 1e3, mb: 1e6, gb: 1e9, tb: 1e12, kib: 1024, mib: 1048576, gib: 1073741824, tib: 1099511627776 },
  };
  const TEMP = { c: 'C', '°c': 'C', celsius: 'C', f: 'F', '°f': 'F', fahrenheit: 'F', k: 'K', kelvin: 'K' };
  function convert(q) {
    const m = q.toLowerCase().match(/^(-?[\d.,]+)\s*([a-z°/]+)\s+(?:to|in|i|til|=)\s+([a-z°/]+)$/);
    if (!m) return null;
    const n = parseFloat(m[1].replace(',', '.')), a = m[2], b = m[3];
    if (!isFinite(n)) return null;
    if (TEMP[a] && TEMP[b]) {
      const c = TEMP[a] === 'C' ? n : TEMP[a] === 'F' ? (n - 32) * 5 / 9 : n - 273.15;
      const out = TEMP[b] === 'C' ? c : TEMP[b] === 'F' ? c * 9 / 5 + 32 : c + 273.15;
      return { value: out, text: fmtNum(+out.toFixed(2)) + ' °' + TEMP[b].replace('K', 'K').replace('°K', 'K') };
    }
    for (const group of Object.values(UNITS)) {
      if (group[a] && group[b]) { const out = (n * group[a]) / group[b]; return { value: out, text: fmtNum(+out.toPrecision(8)) + ' ' + b }; }
    }
    return null;
  }

  /* ---------- date math: "days until 2027-07-01", "100 days from now" ---------- */
  function dates(q) {
    q = q.toLowerCase().trim();
    let m = q.match(/^(?:days?\s+)?(?:until|till|to)\s+(\d{4}-\d{2}-\d{2})$/);
    if (m) {
      const d = new Date(m[1] + 'T00:00'), t = new Date(); t.setHours(0, 0, 0, 0);
      if (isNaN(d)) return null;
      const n = Math.round((d - t) / 864e5);
      return { text: n + ' days', sub: (n >= 0 ? 'until ' : 'since ') + d.toDateString() };
    }
    m = q.match(/^(\d+)\s+(days?|weeks?)\s+(from now|ago)$/);
    if (m) {
      const d = new Date(); d.setDate(d.getDate() + (m[3] === 'ago' ? -1 : 1) * (+m[1]) * (m[2][0] === 'w' ? 7 : 1));
      return { text: d.toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }), sub: 'Date' };
    }
    if (/^(week|uke)( number)?$/.test(q)) return { text: 'Week ' + SP.isoWeek(new Date()), sub: 'ISO week number' };
    return null;
  }

  function instant(v) {
    const out = [];
    const looksMath = /\d/.test(v) && (/[-+*/^%×÷()!]/.test(v.replace(/^-/, '')) || /\b(sqrt|sin|cos|tan|log|ln|abs|pi)\b/i.test(v));
    if (looksMath || v.startsWith('=')) {
      const r = calc(v.replace(/^=/, '').trim());
      if (r != null) out.push({ answer: true, icon: 'calc', label: '= ' + fmtNum(r), sub: 'Enter to copy', copy: fmtNum(r) });
    }
    const c = convert(v);
    if (c) out.push({ answer: true, icon: 'resize', label: c.text, sub: 'Enter to copy', copy: fmtNum(+c.value.toPrecision(8)) });
    const d = dates(v);
    if (d) out.push({ answer: true, icon: 'calendar', label: d.text, sub: d.sub, copy: d.text });
    return out;
  }

  /* ---------- commands ---------- */
  function commandList() {
    const app = SP.app, list = [];
    const W = SP.widgets;
    list.push({ k: 'task todo add', label: 'Add task', icon: 'tasks', arg: 'task', run: (a) => { S().tasks.unshift({ id: SP.ui.uid(), text: a, done: false }); save(); app.renderWidget('tasks'); SP.ui.toast('Task added'); } });
    list.push({ k: 'note write', label: 'Add note', icon: 'notes', arg: 'note', run: (a) => { S().notes = (S().notes ? S().notes + '\n' : '') + a; save(); app.renderWidget('notes'); SP.ui.toast('Note added'); } });
    list.push({ k: 'countdown event', label: 'Add countdown', icon: 'flag', run: () => W.countdown.add() });
    list.push({ k: 'habit', label: 'Add habit', icon: 'activity', run: () => W.habits.add() });
    list.push({ k: 'clock timezone world', label: 'Add world clock', icon: 'globe', run: () => W.worldclock.add() });
    list.push({ k: 'focus pomodoro timer start pause', label: S().focusRun.endsAt ? 'Pause focus timer' : 'Start focus timer', icon: 'timer', run: () => W.focus.toggle() });
    list.push({ k: 'focus pomodoro timer reset', label: 'Reset focus timer', icon: 'reset', run: () => W.focus.reset() });
    Object.entries(SP.scene.themes).forEach(([id, t]) => list.push({ k: 'theme ' + t.name, label: 'Theme: ' + t.name, icon: 'image', run: () => { S().theme = id; S().customBg = false; save(); app.renderAll(); } }));
    S().spaces.forEach((sp) => list.push({ k: 'space go switch ' + sp.name, label: 'Space: ' + sp.name, icon: sp.icon, run: () => app.switchSpace(sp.id) }));
    Object.entries(app.LAYOUTS).forEach(([id, l]) => list.push({ k: 'layout ' + l.label, label: 'Layout: ' + l.label, icon: 'layout', run: () => { S().layout = id; save(); app.renderMain(); } }));
    list.push({ k: 'background shuffle random scene', label: 'Shuffle background', icon: 'shuffle', run: () => { S().seed = 1 + Math.floor(Math.random() * 1e5); S().customBg = false; save(); app.renderAll(); } });
    list.push({ k: 'animation animate motion background', label: (S().animate ? 'Disable' : 'Enable') + ' animated background', icon: 'sparkles', run: () => { S().animate = !S().animate; save(); app.applyTheme(); } });
    list.push({ k: 'customize settings preferences', label: 'Open Customize', icon: 'customize', run: () => SP.panel.open() });
    list.push({ k: 'settings github token location', label: 'Open Settings', icon: 'customize', run: () => SP.panel.open('settings') });
    if (S().github.token) list.push({ k: 'sync gist cloud backup', label: 'Sync now', icon: 'cloudSync', run: () => SP.sync.now() });
    list.push({ k: 'refresh reload weather github news', label: 'Refresh data', icon: 'sync', run: () => { W.weather.load(true); if (S().github.user) W.github.load(true); W.news.load(true); } });
    list.push({ k: 'export backup download', label: 'Export data', icon: 'download', run: () => { const d = JSON.parse(JSON.stringify(S())); d.github.token = ''; app.download('startpage-backup.json', JSON.stringify(d, null, 2)); } });
    return list;
  }
  function commands(q) {
    const words = q.toLowerCase().split(/\s+/).filter(Boolean), list = commandList(), out = [];
    // Commands that take text: "task buy milk", "note call mum"
    if (words.length > 1) {
      for (const c of list) if (c.arg && c.k.split(' ').includes(words[0])) {
        const a = q.slice(q.indexOf(' ') + 1).trim();
        out.push({ icon: c.icon, label: c.label + ': ' + a, sub: 'Enter', run: () => c.run(a) });
      }
      if (out.length) return out;
    }
    for (const c of list) {
      const hay = (c.k + ' ' + c.label).toLowerCase();
      if (words.every((w) => hay.includes(w))) out.push({ icon: c.icon, label: c.arg ? c.label + '…' : c.label, sub: c.arg ? 'type “' + c.arg + ' …”' : '', fill: c.arg ? '>' + c.arg + ' ' : undefined, run: c.arg ? undefined : c.run });
    }
    return out.slice(0, 9);
  }

  SP.isoWeek = function (d) {
    const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const day = t.getUTCDay() || 7;
    t.setUTCDate(t.getUTCDate() + 4 - day);
    const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
    return Math.ceil(((t - y0) / 864e5 + 1) / 7);
  };
  SP.palette = { instant, commands, calc, convert };
})(window.SP = window.SP || {});
