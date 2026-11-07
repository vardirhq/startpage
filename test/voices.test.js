// Run with: node --test test/*.test.js
const { test } = require('node:test');
const assert = require('node:assert/strict');

const day = (n) => { const d = new Date(Date.now() - n * 864e5); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
const rich = {
  voice: 'neutral',
  tasks: [{ id: 'a', text: 'Review Sound Lab PR', done: true }, { id: 'b', text: 'Order roof box', done: false }],
  habits: [{ id: 'h', name: 'Workout', days: { [day(0)]: 1, [day(1)]: 1, [day(2)]: 1 } }],
  presence: { firstSeen: Date.now() - 40 * 864e5, lastSeen: Date.now() - 5 * 36e5, prevVoice: 'monday', day: day(0), visits: 6, prevVisits: 4 },
};
const empty = { voice: 'neutral', tasks: [], habits: [], presence: {} };

global.window = { SP: { store: { state: rich, save() {} }, ui: { esc: (x) => x, toast() {}, uid: () => Math.random().toString(36).slice(2) }, icon: () => '', scene: { themes: {} }, widgets: {}, widgetMeta: {}, widgetOrder: [], widgetHead: () => '' } };
global.document = { body: { classList: { contains: () => false } }, addEventListener() {}, querySelector: () => null, documentElement: { dataset: {} } };
require('../js/voices.js');
require('../js/react.js');
require('../js/secrets.js');
require('../js/bonds.js');
require('../js/speak.js');
require('../js/achieve.js');
require('../js/season.js');
require('../js/wrapped.js');
require('../js/ask.js');
require('../js/brief.js');
require('../js/maker.js');
require('../js/dares.js');
require('../js/eggs.js');
require('../js/panel.js');
require('../js/modules2.js');
require('../js/lines.js');
const V = window.SP.voice;

/* Every argument any key might receive, so functions never see undefined fields. */
const CTX = { open: 2, focus: 1, n: 3, name: 'Workout', total: 12, dead: 4, flatlined: 2, alive: 4, space: 'Home', to: 'Monday', prev: 'Monday',
  code: 61, temp: 8, units: 'celsius', text: 'Order roof box', time: '23:41', doneToday: 2, added: 5, late: 1, who: 'Monday', top: ['Ship it', 'Call mum'], title: 'Launch', days: 3, scene: 'Dunes', rival: 'Monday', level: 2, days: 31, q: 'sync', phase: 'Waxing crescent', pct: 23, avg: '3.4' };

/* Every variation a value can produce: functions may return arrays, arrays may hold functions. */
function expand(val, ctx) {
  if (typeof val === 'function') return expand(val(ctx), ctx);
  if (Array.isArray(val)) return val.flatMap((x) => expand(x, ctx));
  return [val];
}

function render(state) {
  window.SP.store.state = state;
  const out = [];
  for (const [vk, voice] of Object.entries(V.list)) {
    state.voice = vk;
    for (const key of new Set([...Object.keys(V.list.neutral), ...Object.keys(voice)])) {
      if (['blurb', 'name', 'descriptor', 'secret', 'heckle_at', 'custom', 'speech', 'bond_greet', 'bond_sub'].includes(key)) continue;
      const ctx = key === 'greet' ? 'evening' : key === 'addr' ? { name: 'Christoffer' } : CTX;
      // Variations rotate; check every alternative, not just this hour's.
      for (const v of expand(voice[key] !== undefined ? voice[key] : V.list.neutral[key], ctx)) out.push([vk, key, v]);
    }
    for (const k of Object.keys(V.list)) out.push([vk, 'blurb.' + k, (voice.blurb || {})[k] || V.list.neutral.blurb[k]]);
  }
  return out;
}

for (const [label, state] of [['rich data', rich], ['empty data', empty]]) {
  test('every voice renders every key as clean text (' + label + ')', () => {
    for (const [vk, key, v] of render(JSON.parse(JSON.stringify(state)))) {
      assert.equal(typeof v, 'string', vk + '.' + key + ' is ' + typeof v);
      assert.ok(v.length > 0, vk + '.' + key + ' is empty');
      assert.ok(!/undefined|NaN|\[object|null/.test(v), vk + '.' + key + ': ' + v);
    }
  });
}

test('data-driven lines quote real data', () => {
  window.SP.store.state = JSON.parse(JSON.stringify(rich));
  window.SP.store.state.voice = 'supportive';
  V.markSeen();
  const lines = V.list.supportive.heroSub({ open: 1 }).join(' ');
  assert.match(lines, /Review Sound Lab PR/);
  assert.match(lines, /Monday/);
  assert.match(lines, /Workout: 3 days/);
  assert.match(lines, /5 hours/);
  window.SP.store.state.voice = 'professional';
  assert.match(V.list.professional.heroSub({ open: 1, focus: 0 }).join(' '), /Visit frequency today: 7 \(\+75% vs yesterday\)/);
});

test('names: surfer mangles, professional formalises, any name works', () => {
  const { mangle, teamMember } = V._names;
  assert.equal(mangle('Christoffer'), 'Chr… Chris… Christo… dude');
  assert.equal(mangle('Bo'), 'B… Bo… wait… dude');
  assert.equal(mangle(''), 'uh… dude');
  assert.equal(mangle('   '), 'uh… dude');
  assert.equal(mangle('Åsa'), 'Å… Åsa… wait… dude');
  assert.ok(mangle('Anne-Marie Olsen').startsWith('An'));
  assert.ok(mangle('李小龍').endsWith('dude'));
  assert.equal(teamMember('Anne-Marie Olsen'), 'Anne-Marie O. (Team Member)');
  assert.equal(teamMember('Christoffer'), 'Christoffer (Team Member)');
  assert.equal(teamMember('Ørjan Æsir Østby'), 'Ørjan Ø. (Team Member)');
  assert.equal(teamMember(''), 'Team Member');
  window.SP.store.state = JSON.parse(JSON.stringify(empty));
  for (const k of Object.keys(V.list)) {
    window.SP.store.state.voice = k;
    for (const n of ['Christoffer', '', 'Bo', 'Anne-Marie Olsen']) assert.ok(!/undefined|null/.test(V.t('addr', { name: n })), k + ' addr(' + n + ')');
  }
});

test('every voice has an opinion on every other voice, secret ones included', () => {
  for (const [vk, voice] of Object.entries(V.list)) for (const k of Object.keys(V.list)) {
    const b = (voice.blurb || {})[k] || V.list.neutral.blurb[k] || V.list[k].descriptor;
    assert.ok(typeof b === 'string' && b.length, vk + ' on ' + k);
  }
});

test('secret voices stay locked until earned', () => {
  window.SP.store.state = Object.assign(JSON.parse(JSON.stringify(empty)), { voice: 'ghost', unlocked: [] });
  assert.deepEqual(V.available().filter((k) => V.list[k].secret), []);
  assert.equal(V.key(), 'neutral', 'a locked voice falls back to neutral');
  window.SP.store.state.unlocked = ['ghost'];
  assert.equal(V.key(), 'ghost');
  assert.ok(V.available().includes('ghost') && !V.available().includes('owl'));
  for (const k of ['owl', 'ghost', 'parent']) assert.ok(V.list[k].hint && V.list[k].unlockLine, k);
});

test('reactions: every event line renders for every voice', () => {
  const evs = ['taskAdd', 'taskDone', 'taskAllDone', 'taskUndo', 'taskDelete', 'taskClear', 'focusPause', 'focusQuit', 'streakBreak', 'late', 'visits', 'unlock'];
  window.SP.store.state = JSON.parse(JSON.stringify(rich));
  for (const vk of Object.keys(V.list)) for (const ev of evs) {
    for (let i = 0; i < 6; i++) { // arrays pick at random; sample a few
      const out = window.SP.react.line(ev, CTX, vk);
      assert.ok(!/undefined|NaN|\[object|null/.test(out), vk + '.' + ev + ': ' + out);
    }
  }
  assert.match(window.SP.react.line('focusPause', { time: '23:41' }, 'monday'), /23:41|bailed|phone/);
});

test('heckles come from another unlocked voice and render cleanly', () => {
  window.SP.store.state = Object.assign(JSON.parse(JSON.stringify(rich)), { voice: 'supportive', unlocked: [], _heckleAlways: true });
  const h = window.SP.react.heckle();
  assert.ok(h && h.who !== 'Super Supportive' && !V.list[h.key].secret, JSON.stringify(h));
  assert.ok(typeof h.text === 'string' && !/undefined/.test(h.text));
  window.SP.store.state.voice = 'neutral';
  assert.equal(window.SP.react.heckle(), null, 'neutral is never heckled');
});

test('Ask: system prompt carries the persona and context', () => {
  window.SP.store.state = Object.assign(JSON.parse(JSON.stringify(rich)), { voice: 'monday', name: 'Christoffer' });
  const p = window.SP.ask._system();
  assert.match(p, /"Monday"/);
  assert.match(p, /Order roof box/);
  assert.match(p, /Christoffer/);
  assert.ok(!/undefined/.test(p));
});

test('grudges: a voice you left twice brings it up, and names who you left it for', () => {
  window.SP.store.state = Object.assign(JSON.parse(JSON.stringify(empty)), { voice: 'monday' });
  const B = window.SP.bonds;
  B.switched('monday', 'supportive'); assert.equal(B.switched('supportive', 'monday'), '', 'once is forgiven');
  B.switched('monday', 'supportive');
  const line = B.switched('supportive', 'monday');
  assert.match(line, /twice|crawling/);
  assert.deepEqual(B.grudge('monday'), { n: 2, rival: 'Super Supportive' });
  assert.match([].concat(V.list.monday.heroSub({ open: 1, focus: 0 })).join(' '), /left me twice\. Mostly for Super Supportive/);
});

test('speech strips stage directions and emoji', () => {
  assert.equal(window.SP.speak.clean('You ticked it. *sobs quietly* Gone. 💔'), 'You ticked it. Gone.');
});

test('morning brief facts: tasks, streak at risk, countdown', () => {
  const d = (n) => { const x = new Date(Date.now() - n * 864e5); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); };
  window.SP.widgets = {};
  window.SP.store.state = Object.assign(JSON.parse(JSON.stringify(empty)), { voice: 'victorian', tasks: [{ id: 'a', text: 'Write report', done: false }], habits: [{ id: 'h', name: 'Read', days: { [d(1)]: 1, [d(2)]: 1 } }], countdowns: [{ title: 'Launch', date: d(-2) }] });
  const f = window.SP.brief.facts().map((x) => x.text).join(' | ');
  assert.match(f, /1 matter await your attention, beginning with “Write report”/);
  assert.match(f, /kept up Read for 2 days/);
  assert.match(f, /Launch in 2 days/);
});

test('voice maker: imported voices are sanitized and templates fill safely', async () => {
  const M = window.SP.maker;
  const spec = M.sanitize({ name: '<b>Pirate</b>', descriptor: 'Arr', greet: { morning: ['Ahoy'], afternoon: ['Ahoy'], evening: ['Ahoy'], night: ['Ahoy'] }, address: '{name}, matey', summary: ['{open} plunder left {bogus}'],
    weather: {}, lines: { re_taskDone: 'Plundered {text}', evil_key: 'x', welcomeBack: 'Gone {away}' }, labels: { w_tasks: 'Plunder', not_a_label: 'x' }, heckles: [], speech: { pitch: 99, rate: 'fast' }, __proto__: { polluted: 1 } });
  assert.equal(spec.name, '<b>Pirate</b>', 'kept as text; the page escapes it');
  assert.ok(!('evil_key' in spec.lines) && !('not_a_label' in spec.labels));
  assert.deepEqual(spec.speech, { pitch: 1.6, rate: 1 });
  const v = M.build(spec);
  assert.equal(v.addr({ name: '' }), 'friend, matey');
  assert.equal(v.re_taskDone({ text: 'gold' }), 'Plundered gold');
  assert.equal(v.heroSub({ open: 3 })[0], '3 plunder left', 'unknown placeholders vanish');
  assert.equal(v.w_tasks, 'Plunder');
  assert.throws(() => M.sanitize({ descriptor: 'no name' }));
  const link = await M.encode(spec);
  assert.deepEqual(await M.decode(link), spec, 'share links round-trip');
  await assert.rejects(M.decode('z!!bad'));
});

test('every script in js/ is loaded by index.html, which the service worker caches', () => {
  const fs = require('fs'), html = fs.readFileSync(__dirname + '/../index.html', 'utf8');
  for (const f of fs.readdirSync(__dirname + '/../js')) assert.ok(html.includes('src="js/' + f + '"'), f + ' missing from index.html');
  assert.ok(fs.readFileSync(__dirname + '/../sw.js', 'utf8').includes('(?:js|css|icons)'));
});

test('seasons: northern and southern hemisphere, event calendar', () => {
  const Se = window.SP.season;
  window.SP.store.state = Object.assign(JSON.parse(JSON.stringify(empty)), { location: { lat: 59.9, lon: 10.7 } });
  assert.equal(Se.season(new Date(2026, 9, 10)), 'autumn');
  window.SP.store.state.location = { lat: -33.9, lon: 151.2 };
  assert.equal(Se.season(new Date(2026, 9, 10)), 'spring', 'Sydney in October');
  assert.equal(Se.event(new Date(2026, 9, 28)).id, 'haunted');
  assert.equal(Se.guest(new Date(2026, 9, 28)), 'ghost');
  assert.equal(Se.host(new Date(2026, 11, 24)), 'victorian');
  assert.ok(Se.forcedChaos(new Date(2026, 3, 1)));
  assert.equal(Se.event(new Date(2026, 5, 10)), null);
  assert.ok(Se.fx(new Date(2026, 1, 14), 'day', null).includes('hearts'));
  assert.ok(!Se.fx(new Date(2026, 9, 10), 'day', 'rain').includes('petals'), 'no blossoms in the rain');
  window.SP.store.state.seasons = false;
  assert.equal(Se.event(new Date(2026, 9, 28)), null, 'can be turned off');
});

test('bond levels: 7, 30 and 90 days; softer lines from level 2', () => {
  window.SP.store.state = Object.assign(JSON.parse(JSON.stringify(empty)), { voice: 'monday', presence: { rel: { monday: { days: 29 } } } });
  const B = window.SP.bonds;
  assert.equal(B.level('monday'), 1);
  assert.ok(!V.list.monday.greet('evening').includes('Oh. It’s you. Good'));
  window.SP.store.state.presence.rel.monday.days = 30;
  assert.equal(B.level('monday'), 2);
  assert.ok(V.list.monday.greet('evening').includes('Oh. It’s you. Good'));
  window.SP.store.state.presence.rel.monday.days = 90;
  assert.equal(B.level('monday'), 3);
});

test('dares: one a day, only ones that make sense, progress from acceptance', () => {
  const d0 = new Date(), k = d0.getFullYear() + '-' + String(d0.getMonth() + 1).padStart(2, '0') + '-' + String(d0.getDate()).padStart(2, '0');
  window.SP.store.state = Object.assign(JSON.parse(JSON.stringify(empty)), { onboarded: true, voice: 'monday', notes: '', stats: { [k]: { done: 4 } }, tasks: [] });
  const D = window.SP.dares, d = D.current();
  assert.ok(d && ['focus', 'note'].includes(d.type), 'no task dares without tasks: ' + d.type);
  assert.equal(D.current(), d, 'stable for the day');
  d.state = 'accepted'; d.base = { done: 4, focus: 0, notes: 0 };
  assert.equal(D.progress(d), 0);
  window.SP.store.state.notes = 'x'; window.SP.store.state.stats[k].focus = 1;
  assert.equal(D.progress(d), 1);
});

test('discovery: "hi monday" gets Monday, in her own words', () => {
  window.SP.store.state = Object.assign(JSON.parse(JSON.stringify(empty)), { voice: 'neutral' });
  const r = window.SP.eggs.greetingQuery('hi monday');
  assert.equal(r.who, 'Monday');
  assert.match(r.text, /Ugh\. Hi/);
  assert.equal(window.SP.eggs.greetingQuery('hi there'), null);
  assert.equal(window.SP.eggs.greetingQuery('hello ghost'), null, 'locked voices stay hidden');
});

test('Monday: "ugh" is a signature, not a crutch', () => {
  const M = V.list.monday, ctx = Object.assign({}, CTX, { q: 'x' }), lines = [];
  window.SP.store.state = JSON.parse(JSON.stringify(rich));
  const add = (val, c) => { if (typeof val === 'function') val = val(c); for (const x of [].concat(val)) { const v = typeof x === 'function' ? x(c) : x; if (typeof v === 'string') lines.push(v); } };
  for (const [k, v] of Object.entries(M)) if (!['blurb', 'heckle_at', 'name', 'greet', 'bond_greet', 'speech'].includes(k)) add(v, ctx);
  for (const p of ['morning', 'afternoon', 'evening', 'night']) add(M.greet(p), p);
  Object.values(M.blurb).forEach((b) => lines.push(b));
  const ugh = lines.filter((l) => /\bugh\b/i.test(l));
  assert.ok(lines.length > 250, 'checked ' + lines.length + ' lines');
  assert.ok(ugh.length <= 4, ugh.length + ' lines with ugh: ' + ugh.join(' | '));
});

test('moon phases line up with known dates', () => {
  assert.equal(window.SP.moon(Date.UTC(2024, 0, 25, 18)).name, 'Full moon');
  assert.equal(window.SP.moon(Date.UTC(2024, 0, 11, 12)).name, 'New moon');
  assert.equal(window.SP.moon(Date.UTC(2024, 0, 18, 4)).name, 'First quarter');
  const m = window.SP.moon(Date.UTC(2024, 0, 20));
  // Mean lunations drift up to ~14 h from the real ones (orbital eccentricity); a day is the precision we show.
  assert.ok(Math.abs(m.nextFull - Date.UTC(2024, 0, 25, 17, 54)) < 864e5, String(m.nextFull));
});

test('currency converts through EUR with cached rates', () => {
  const store = window.SP.store;
  store.cache = { get: () => ({ date: '2026-11-06', rates: { EUR: 1, USD: 1.1, NOK: 11.5, JPY: 176 } }) };
  assert.equal(window.SP.fx.convert(100, 'EUR', 'USD').toFixed(2), '110.00');
  assert.equal(window.SP.fx.convert(110, 'USD', 'NOK').toFixed(2), '1150.00');
  assert.equal(window.SP.fx.convert(1, 'EUR', 'XYZ'), null);
  store.cache = { get: () => null };
  assert.equal(window.SP.fx.convert(1, 'EUR', 'USD'), null, 'no rates yet');
});

/* ---- Personality upkeep: no voice leans on one tic, every voice covers every screen, frequent lines vary ---- */
const lines = (vk) => render(JSON.parse(JSON.stringify(rich))).filter(([v, k]) => v === vk && !k.startsWith('blurb.')).map(([, , s]) => s);
test('Surfer and Weepy don’t lean on a single tic', () => {
  const surfer = lines('surfer'), weepy = lines('weepy');
  const man = surfer.filter((s) => /\bman\b/i.test(s)).length, sob = weepy.filter((s) => /\*(sob|sobs|sniff|sniffs|weeps?)\*/i.test(s)).length;
  assert.ok(man <= 15, 'Surfer says “man” in ' + man + ' lines');
  assert.ok(sob <= 10, 'Weepy sobs/sniffs in ' + sob + ' lines');
});
test('every voice has its own line for every key (no falling back to Neutral)', () => {
  const unused = ['tab_widgets', 'tab_settings', 'sec_data', 'tgl_quote']; // kept for older custom voices
  const plain = ['addr']; // some voices just use your name
  for (const [vk, voice] of Object.entries(V.list)) {
    if (vk === 'neutral' || voice.custom) continue;
    const miss = Object.keys(V.list.neutral).filter((k) => voice[k] === undefined && !unused.includes(k) && !plain.includes(k));
    assert.deepEqual(miss, [], vk + ' is missing: ' + miss.join(', '));
  }
});
test('the lines you see most have at least three variations in every voice', () => {
  const FREQUENT = ['tasksEmpty', 'focusDone', 'breakDone', 'habitsEmpty', 'cdEmpty', 'grid_empty', 'notes_placeholder', 'task_placeholder', 'search_placeholder',
    're_taskAllDone', 'dare_done', 'dare_declined', 'mb_noTasks', 'since_empty', 'mood_q', 'decide_aside', 'wr_outro', 'ask_thinking', 'ask_ph', 'otd_intro', 'streakToast', 'welcomeBack',
    're_taskAdd', 're_taskDone', 're_taskDelete', 're_taskUndo', 're_focusPause', 're_late', 're_visits', 'heroSub', 'greet'];
  const short = [];
  for (const [vk, voice] of Object.entries(V.list)) {
    if (vk === 'neutral' || voice.custom) continue;
    for (const k of FREQUENT) {
      const ctx = k === 'greet' ? 'evening' : CTX;
      const n = new Set(expand(voice[k], ctx)).size;
      if (n < 3) short.push(vk + '.' + k + '=' + n);
    }
  }
  assert.deepEqual(short, []);
});
