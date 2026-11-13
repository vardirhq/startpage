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

const { load, FILES } = require('./load.js');
load(rich);
const V = window.SP.voice;

/* Every argument any key might receive, so functions never see undefined fields. */
const CTX = { open: 2, focus: 1, n: 3, name: 'Workout', total: 12, dead: 4, flatlined: 2, alive: 4, space: 'Home', to: 'Monday', prev: 'Monday',
  code: 61, temp: 8, units: 'celsius', text: 'Order roof box', time: '23:41', doneToday: 2, added: 5, late: 1, who: 'Monday', top: ['Ship it', 'Call mum'], title: 'Launch', days: 3, scene: 'Dunes', rival: 'Monday', level: 2, days: 31, q: 'sync', phase: 'Waxing crescent', pct: 23, avg: '3.4',
  you: 'Rock', them: 'Scissors', w: 3, l: 2, host: 'youtube.com', kind: 'video', hints: 1 };

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
      if (['blurb', 'name', 'descriptor', 'secret', 'heckle_at', 'custom', 'speech', 'swears', 'bond_greet', 'bond_sub'].includes(key)) continue;
      if (voice[key] === null) continue; // deliberately silent (a personality line)
      const ctx = key === 'greet' ? 'evening' : key === 'addr' ? { name: 'Christoffer' } : CTX;
      // Variations rotate; check every alternative, not just this hour's.
      for (const v of expand(voice[key] !== undefined ? voice[key] : V.list.neutral[key], ctx)) out.push([vk, key, v]);
    }
    for (const k of Object.keys(V.list)) out.push([vk, 'blurb.' + k, (voice.blurb || {})[k] || V.list.neutral.blurb[k] || V.list[k].descriptor]); // as the voice picker does
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
  assert.equal(Se.event(new Date(2026, 10, 18, 12)).id, 'voyager');
  assert.equal(Se.guest(new Date(2026, 10, 18, 12)), 'owl');
  assert.ok(Se.fx(new Date(2026, 10, 18, 12), 'night', null).includes('voyager'));
  assert.equal(Se.event(new Date(2027, 10, 18, 12)), null, 'Voyager is a one-off');
  assert.ok(!Se.events(new Date(2026, 10, 17, 23)).some((e) => e.id === 'voyager'), 'not the day before');
  window.SP.store.state.seasons = false;
  assert.equal(Se.event(new Date(2026, 9, 28)), null, 'can be turned off');
});

test('events stack: effects add up, every guest visits, one banner each', () => {
  const Se = window.SP.season;
  window.SP.store.state = JSON.parse(JSON.stringify(empty));
  const extra = { id: 'test', when: (d) => d.getMonth() === 9 && d.getDate() === 31, fx: ['meteors', 'bats'], guest: 'parent', name: 'Test', line: 'hi' };
  Se.EVENTS.push(extra);
  try {
    const d = new Date(2026, 9, 31, 12);
    assert.deepEqual(Se.events(d).map((e) => e.id), ['haunted', 'test']);
    assert.deepEqual(Se.guests(d), ['ghost', 'parent']);
    assert.equal(Se.heckler(d), 'ghost', 'the first event with a heckler wins');
    const fx = Se.fx(d, 'night', null);
    assert.ok(fx.includes('meteors') && fx.filter((f) => f === 'bats').length === 1, 'effects merge without duplicates');
  } finally { Se.EVENTS.splice(Se.EVENTS.indexOf(extra), 1); }
});

test('meteor nights: peak evening until dawn; Cat Day; both stack with others', () => {
  const Se = window.SP.season;
  window.SP.store.state = JSON.parse(JSON.stringify(empty));
  const ids = (d) => Se.events(d).map((e) => e.id);
  assert.deepEqual(ids(new Date(2026, 7, 12, 22)), ['meteors-perseids']);
  assert.deepEqual(ids(new Date(2026, 7, 13, 3)), ['meteors-perseids'], 'still on after midnight');
  assert.deepEqual(ids(new Date(2026, 7, 12, 14)), [], 'not in the afternoon');
  assert.deepEqual(ids(new Date(2026, 7, 13, 7)), [], 'over by morning');
  assert.deepEqual(ids(new Date(2027, 0, 4, 2)), ['meteors-quadrantids'], 'across a year boundary is fine too');
  assert.ok(Se.fx(new Date(2026, 11, 13, 23), 'night', null).includes('meteors'));
  assert.equal(Se.heckler(new Date(2026, 7, 12, 22)), 'conspiracy');
  assert.equal(Se.SHOWERS.length, Se.EVENTS.filter((e) => e.id.startsWith('meteors-')).length);
  // The Leonids run into Voyager day, 2026.
  assert.deepEqual(ids(new Date(2026, 10, 18, 2)), ['voyager', 'meteors-leonids']);
  const cat = new Date(2026, 7, 8, 9);
  assert.equal(Se.event(cat).id, 'catday');
  assert.equal(Se.greeter(cat), 'cat');
  assert.ok(Se.crown(cat) && !Se.crown(new Date(2026, 7, 9, 9)));
  assert.equal(Se.heckler(cat), 'cat');
});

test('full moons: exact to minutes, one night each; the moon widget agrees', () => {
  const Se = window.SP.season;
  window.SP.store.state = JSON.parse(JSON.stringify(empty));
  for (const [from, want] of [['2024-01-20', '2024-01-25T17:54Z'], ['2025-12-01', '2025-12-04T23:14Z'], ['2026-11-20', '2026-11-24T14:53Z']])
    assert.ok(Math.abs(Se.nextFullMoon(new Date(from)) - new Date(want)) < 5 * 6e4, want);
  const full = Se.nextFullMoon(new Date(2026, 10, 20)), eve = new Date(full); if (eve.getHours() < 12) eve.setDate(eve.getDate() - 1); eve.setHours(22, 0, 0, 0);
  assert.ok(Se.events(eve).some((e) => e.id === 'fullmoon'), 'on the night');
  const after = new Date(eve); after.setDate(after.getDate() + 1);
  const before = new Date(eve); before.setDate(before.getDate() - 1);
  assert.ok(!Se.events(after).some((e) => e.id === 'fullmoon') && !Se.events(before).some((e) => e.id === 'fullmoon'), 'one night only');
  assert.ok(Se.zoomies(eve));
  assert.equal(Se.heckler(eve), 'conspiracy', 'Ghost and Night Owl only once you have them');
  window.SP.store.state.unlocked = ['owl'];
  assert.equal(Se.heckler(eve), 'owl');
  assert.ok(Se.heckles(eve).some((x) => typeof x === 'string' && /FULL MOON/.test(x)), 'the heckler’s own lines');
  assert.equal(+window.SP.moon(+new Date(2026, 10, 20)).nextFull, +full);
});

test('daylight saving: found from the UTC offset, wherever you are', () => {
  const Se = window.SP.season, tz = process.env.TZ;
  window.SP.store.state = JSON.parse(JSON.stringify(empty));
  const changes = (zone) => { process.env.TZ = zone; const out = []; for (let d = new Date(2026, 0, 1); d.getFullYear() === 2026; d.setDate(d.getDate() + 1)) { const c = Se.clocks(d); if (c) out.push((d.getMonth() + 1) + '/' + d.getDate() + (c > 0 ? '+' : '-')); } return out; };
  try {
    assert.deepEqual(changes('Europe/Oslo'), ['3/29+', '10/25-']);
    assert.deepEqual(changes('Australia/Sydney'), ['4/5-', '10/4+']);
    assert.deepEqual(changes('Asia/Tokyo'), []);
    process.env.TZ = 'Europe/Oslo';
    assert.ok(Se.events(new Date(2026, 9, 25, 12)).some((e) => e.id === 'dst-back'));
    // Haunted week starts the same day: both visit, and the one-day event heckles.
    assert.deepEqual(Se.guests(new Date(2026, 9, 25, 12)).sort(), ['ghost', 'owl']);
    assert.equal(Se.heckler(new Date(2026, 9, 25, 12)), 'owl');
  } finally { if (tz === undefined) delete process.env.TZ; else process.env.TZ = tz; }
});

test('first snow: once per winter, from the live sky; each voice says its own line', () => {
  const Se = window.SP.season;
  window.SP.store.state = Object.assign(JSON.parse(JSON.stringify(empty)), { voice: 'monday' });
  const d = new Date(2026, 10, 20, 9);
  assert.ok(!Se.noteWeather('rain', d));
  assert.ok(Se.noteWeather('snow', d), 'first snow');
  assert.ok(!Se.noteWeather('snow', d), 'once');
  assert.ok(Se.events(d).some((e) => e.id === 'firstsnow'));
  assert.ok(!Se.events(new Date(2026, 10, 21, 9)).some((e) => e.id === 'firstsnow'), 'just the day');
  assert.ok(!Se.noteWeather('snow', new Date(2027, 0, 10, 9)), 'not again the same winter');
  assert.ok(Se.noteWeather('snow', new Date(2027, 10, 2, 9)), 'next winter');
  const e = Se.EVENTS.find((x) => x.id === 'firstsnow');
  for (const k of Object.keys(window.SP.voice.list)) if (!window.SP.voice.list[k].custom) assert.ok(e.lines[k], k + ' has a first-snow line');
});

test('Voyager 1: a week of countdown, the day, every voice, and a hello that takes a day', () => {
  const Se = window.SP.season, Vy = window.SP.voyager;
  window.SP.store.state = Object.assign(JSON.parse(JSON.stringify(empty)), { voice: 'monday' });
  const ids = (d) => Se.events(d).map((e) => e.id);
  assert.deepEqual(ids(new Date(2026, 10, 13, 12)), ['voyager-soon']);
  assert.match(Se.EVENTS.find((e) => e.id === 'voyager-soon').line(new Date(2026, 10, 13, 12)), /^In 5 days, Voyager 1/);
  assert.match(Se.EVENTS.find((e) => e.id === 'voyager-soon').line(new Date(2026, 10, 17, 12)), /^Tomorrow, Voyager 1/);
  assert.ok(Se.fx(new Date(2026, 10, 15, 22), 'night', null).includes('voyager'), 'the probe is already on its way');
  assert.deepEqual(ids(new Date(2026, 10, 10, 12)), []);
  assert.equal(Math.round(Vy.LD_KM), 25902068371, 'one light-day in km');
  for (const k of Object.keys(V.list)) if (!V.list[k].custom) assert.ok(Vy.LINES[k], k + ' has something to say');
  // The countdown, then the distance and the signal time.
  assert.match(Vy.liveText(Vy.LIGHTDAY - 3723e3), /^One light-day in 01:02:03 · /);
  assert.match(Vy.liveText(Vy.LIGHTDAY + 1000), /its signal takes 24 h 00 min 00 s to get here$/);
  // Light chasing the probe needs a few seconds more than a day.
  const extra = (Vy.arrival(Vy.LIGHTDAY) - Vy.LIGHTDAY) / 1000 - 86400;
  assert.ok(extra > 4 && extra < 6, 'about 5 s longer: ' + extra);
  // A hello in flight shows up the day after, then it's done.
  window.SP.store.state.voyager = { msg: 'hi', sent: Vy.LIGHTDAY, arrives: Vy.arrival(Vy.LIGHTDAY) };
  assert.deepEqual(ids(new Date(2026, 10, 19, 8)), ['voyager-hello']);
  window.SP.store.state.voyager.delivered = Date.now();
  assert.deepEqual(ids(new Date(2026, 10, 19, 8)), []);
  assert.ok(window.SP.eggs.EGGS.voyager, 'a discovery for writing to it');
});

test('Opposite Day: voices swap words with their opposite, names and controls stay', () => {
  const Se = window.SP.season, d = new Date(2027, 0, 25, 12);
  window.SP.store.state = Object.assign(JSON.parse(JSON.stringify(empty)), { voice: 'monday' });
  for (const [a, b] of Object.entries(Se.OPPOSITE)) { assert.ok(V.list[a] && V.list[b], a + ' and ' + b + ' exist'); assert.equal(Se.OPPOSITE[b], a, 'pairs go both ways'); }
  assert.equal(Se.event(d).id, 'opposite');
  assert.equal(Se.speaker('monday', d), 'supportive');
  assert.equal(Se.speaker('neutral', d), 'neutral', 'Neutral has no opposite');
  assert.equal(Se.speaker('monday', new Date(2027, 0, 26, 12)), 'monday', 'only on the day');
  assert.equal(Se.speaker('weepy', d), 'weepy', 'a locked opposite is not spoiled');
  window.SP.store.state.unlocked = ['parent'];
  assert.equal(Se.speaker('weepy', d), 'parent');
  // t() follows the swap; the voice's identity does not.
  const real = Se.speaker; Se.speaker = (k) => real(k, d);
  try {
    assert.equal(V.key(), 'monday');
    assert.equal(V.current().name, 'Monday');
    assert.equal(V.t('tgl_seasons'), V.list.supportive.tgl_seasons);
    assert.equal(V.speaker(), 'supportive');
    // Lines read outside t() swap too: level titles, reactions, heckles, the AI persona.
    assert.equal(window.SP.levels.title(1), V.list.supportive.lvl_titles[0]);
    assert.equal(window.SP.levels.title(1, 'supportive'), V.list.monday.lvl_titles[0], 'both ways');
    const r = window.SP.react.line('unlock', { name: 'X' });
    assert.ok(r && !/^Ugh|^Fine/.test(r), 'Monday reacts like Super Supportive: ' + r);
    window.SP.store.state._heckleAlways = true; window.SP.store.state.unlocked = ['parent', 'owl', 'ghost'];
    const said = (k, cur) => { const v = V.list[k]; return [].concat((v.heckle_at && v.heckle_at[cur]) || v.heckle || []).map((x) => typeof x === 'function' ? x({ who: V.list[cur].name }) : x); };
    const h = window.SP.react.heckle();
    assert.ok(h, 'someone heckles');
    const o = Se.speaker(h.key, d);
    assert.equal(h.who, V.list[h.key].name, 'the heckler keeps its name');
    assert.ok(said(o, 'monday').includes(h.text), h.who + ' heckles in ' + V.list[o].name + '’s words: ' + h.text);
  } finally { Se.speaker = real; }

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
  const unused = V.SCHEMA.RETIRED; // kept for older custom voices
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

/* ---- Batch 4: levels, roasts, face-offs, birthdays ---- */
test('levels: 100 points for level 2, then 300, 600, 1000…; titles go on past ten', () => {
  const L = window.SP.levels;
  assert.deepEqual([0, 99, 100, 299, 300, 600, 999, 1000, 4500].map(L.levelOf), [1, 1, 2, 2, 3, 4, 4, 5, 10]);
  assert.equal(L.title(3, 'professional'), 'Associate');
  assert.equal(L.title(12, 'professional'), 'Chief Everything Officer III');
  assert.equal(L.title(1, 'victorian'), 'Scullery maid');
});
test('roasts: sites are sorted into the right kind', () => {
  const k = window.SP.roasts.kind;
  assert.deepEqual(['youtube.com', 'old.reddit.com', 'github.com', 'claude.ai', 'amazon.de', 'example.org', 'x.com'].map(k), ['video', 'social', 'work', 'ai', 'shop', 'other', 'social']);
});
test('face-offs: ISO week numbers, one day a week', () => {
  const F = window.SP.faceoff;
  assert.equal(F.week(new Date(2026, 0, 1)), '2026-W01');
  assert.equal(F.week(new Date(2025, 11, 29)), '2026-W01');
  assert.equal(F.week(new Date(2027, 0, 1)), '2026-W53');
  assert.equal(F.week(new Date(2026, 10, 7)), '2026-W45');
  for (const w of ['2026-W45', '2026-W46', '2027-W01']) { const d = F.day(w); assert.ok(d >= 0 && d <= 6 && Number.isInteger(d)); }
});
test('birthdays: matched on month and day; 29 February is celebrated on the 28th in other years', () => {
  const S = window.SP.store.state, B = window.SP.birthday, prev = S.birthday;
  S.birthday = '11-07'; assert.ok(B.today(new Date(2026, 10, 7))); assert.ok(!B.today(new Date(2026, 10, 8)));
  S.birthday = '02-29'; assert.ok(B.today(new Date(2027, 1, 28))); assert.ok(!B.today(new Date(2028, 1, 28))); assert.ok(B.today(new Date(2028, 1, 29)));
  S.birthday = prev;
});

/* ---- Brutal swears; with swearing off, every swear word is masked, and nothing else is ---- */
test('swearing off masks Brutal’s swear words, and only those', () => {
  const S = window.SP.store.state, V = window.SP.voice, prev = S.swear;
  const SWEARS = /\b(fuck\w*|bullshit|shit\w*|goddamn\w*|damn(ed|s|it)?|ass(es)?|arse|piss(ed|ing)?|bastards?|crap(py)?|hell)\b/i;
  S.swear = true;
  const raw = lines('brutal');
  assert.ok(raw.filter((s) => SWEARS.test(s)).length >= 25, 'Brutal should actually swear');
  S.swear = false;
  const all = lines('brutal'); window.SP.store.state.swear = false; // render() swaps in a fresh state, so set it after
  const clean = all.map((s) => V.clean(s)).filter((s) => SWEARS.test(s)); // what the page shows: every line goes through SP.voice.resolve → clean
  assert.deepEqual(clean, [], 'unmasked: ' + clean.slice(0, 3).join(' | '));
  window.SP.store.state.swear = false;
  assert.equal(V.clean('Hello, I assume this class passes. What the hell. Bullshit, fucking shit.'), 'Hello, I assume this class passes. What the h***. Bulls***, f****** s***.');
  S.swear = prev;
});
test('only Brutal swears (the other voices stay clean)', () => {
  const SWEARS = /\b(fuck\w*|bullshit|shit\w*|goddamn\w*|bastards?)\b/i;
  for (const vk of Object.keys(V.list)) { if (vk === 'brutal') continue; const bad = lines(vk).filter((s) => SWEARS.test(s)); assert.deepEqual(bad, [], vk + ': ' + bad[0]); }
});

/* ---- Friday night mode ---- */
test('Friday night mode: Friday and Saturday, 22:00 to 03:00', () => {
  const T = window.SP.tipsy, at = (d, h, m) => new Date(2026, 10, d, h, m || 0); // 13 Nov 2026 is a Friday
  assert.ok(T.night(at(13, 23)) && T.night(at(14, 1)) && T.night(at(14, 22)) && T.night(at(15, 2, 59)));
  assert.ok(!T.night(at(13, 21, 59)) && !T.night(at(14, 4)) && !T.night(at(15, 22)) && !T.night(at(12, 23)) && !T.night(at(13, 2)));
  assert.equal(T.night(at(14, 1)), '2026-11-13'); // after midnight still belongs to Friday night
});
test('Friday night mode: slurs the chatter, deterministically, and leaves task names and numbers alone', () => {
  const T = window.SP.tipsy;
  const line = 'This is your 3rd session. Still “Fix the flaky test”, still nothing. Seriously.';
  const a = T.slur(line, 'monday'), b = T.slur(line, 'monday');
  assert.equal(a, b, 'same line, same slur (no flicker)');
  assert.notEqual(a, line);
  assert.ok(a.includes('“Fix the flaky test”') && a.includes('3rd'), a);
  assert.ok(/sh/i.test(a), a);
});
test('Friday night mode: only on Friday nights, only for chatter, and it can be switched off', () => {
  const S = window.SP.store.state, T = window.SP.tipsy, real = Date.now;
  Date.now = () => +new Date(2026, 10, 13, 23, 30);
  try {
    S.tipsy = true;
    const chat = 'Seriously, this is a sentence with lots of s sounds in it.';
    assert.notEqual(T.apply(chat, 're_taskDone'), chat);
    assert.equal(T.apply('Settings', 'tab_settings'), 'Settings');     // labels stay sober
    assert.equal(T.apply(chat, 'morning_after'), chat);                // the morning after is very sober
    S.tipsy = false;
    assert.equal(T.apply(chat, 're_taskDone'), chat);
    S.tipsy = true; Date.now = () => +new Date(2026, 10, 13, 14, 0);   // Friday afternoon: sober
    assert.equal(T.apply(chat, 're_taskDone'), chat);
  } finally { Date.now = real; delete S.tipsy; }
});

/* ---- Daily puzzles ---- */
test('nonograms: every picture is 10×10 and can be solved by logic alone (with its starting cells)', () => {
  const Z = window.SP.puzzles;
  for (const a of Z.ART) {
    assert.equal(a.rows.length, 10, a.id); for (const r of a.rows) assert.equal(r.length, 10, a.id);
    for (const ch of a.rows.join('').replace(/\./g, '')) assert.ok(Z.COLORS[ch], a.id + ' uses an unknown colour ' + ch);
    const p = Z.nonoFrom(a, Z.rng(a.id)), known = p.sol.map((v, i) => (i in p.givens ? v : -1));
    assert.deepEqual(Z.lineSolve(p.rows, p.cols, known), p.sol, a.id);
    assert.ok(Object.keys(p.givens).length <= 4, a.id + ' needs ' + Object.keys(p.givens).length + ' starting cells');
  }
});
test('nonograms: the same puzzle for everyone on the same day, a picture every other day, always solvable', () => {
  const Z = window.SP.puzzles, seen = new Set();
  for (let d = 0; d < 60; d++) {
    const k = Z.dayKey(new Date(2026, 0, 1 + d)), a = Z.nonogram(k), b = Z.nonogram(k);
    assert.deepEqual(a.sol, b.sol); assert.deepEqual(a.givens, b.givens);
    const known = a.sol.map((v, i) => (i in a.givens ? v : -1));
    assert.deepEqual(Z.lineSolve(a.rows, a.cols, known), a.sol, k);
    if (a.id !== 'gen') seen.add(a.id);
  }
  assert.ok(seen.size >= 20, 'pictures used in 60 days: ' + seen.size);
});
test('sudoku: unique, valid, harder through the week, the same for everyone', () => {
  const Z = window.SP.puzzles; let prev = 99;
  for (let d = 2; d <= 7; d++) { // Monday 2 November 2026 to Saturday
    const k = Z.dayKey(new Date(2026, 10, d)), s = Z.sudoku(k), g = s.puzzle.split('').map(Number), n = g.filter(Boolean).length;
    assert.equal(Z.sudokuSolve(g.slice(), 2), 1, k + ' has one answer');
    assert.ok(n <= prev, k + ': ' + n + ' givens'); prev = n;
    assert.equal(s.puzzle, Z.sudoku(k).puzzle);
    const sol = s.solution.split('').map(Number);
    for (let i = 0; i < 81; i++) { if (g[i]) assert.equal(g[i], sol[i]); for (const p of Z.PEERS[i]) assert.notEqual(sol[i], sol[p]); }
  }
});
test('puzzle streaks: count consecutive days, reset after a gap', () => {
  const Z = window.SP.puzzles, st = window.SP.store.state = JSON.parse(JSON.stringify(rich));
  const today = Z.dayKey(), y = Z.prevDay(today);
  st.puz = { streak: { sudoku: { n: 4, last: y } } };
  assert.equal(Z.streak('sudoku'), 4);
  assert.equal(Z.solvedToday('sudoku'), 5); assert.equal(Z.solvedToday('sudoku'), 5, 'once a day');
  st.puz.streak.nonogram = { n: 9, last: Z.prevDay(y) };
  assert.equal(Z.streak('nonogram'), 0); assert.equal(Z.solvedToday('nonogram'), 1);
  assert.equal(st.totals.puzzles, 2);
});

/* ---- Starting setups ---- */
test('setups: developer jokes only for developers (or anyone with GitHub), and only when there are other options', () => {
  const st = window.SP.store.state = JSON.parse(JSON.stringify(rich));
  const all = (k, vk) => new Set(Array.from({ length: 300 }, () => V.line(k, CTX, vk)));
  const has = (set, re) => [...set].some((x) => re.test(x));
  assert.ok(has(all('re_taskAllDone', 'owl'), /refactor/), 'no setup chosen (an older install): everything');
  st.profile = 'student';
  assert.ok(!has(all('re_taskAllDone', 'owl'), /refactor/), 'student: no refactoring jokes');
  assert.ok(!has(all('re_taskAdd', 'professional'), /sprint/), 'student: no sprints');
  assert.equal(V.list.owl.vitalsHero.length > 0, true);
  st.github = { user: 'octocat' };
  assert.ok(has(all('re_taskAllDone', 'owl'), /refactor/), 'GitHub connected: back');
  st.github = { user: '' }; st.profile = 'dev';
  assert.ok(has(all('re_taskAllDone', 'owl'), /refactor/), 'developer: back');
});
test('setups: every card they use exists, and every setup starts with search', () => {
  const known = new Set(require('fs').readFileSync(require('path').join(__dirname, '../js/app.js'), 'utf8').match(/grid: \{ label: 'Classic', spans: \{([^}]*)\}/)[1].match(/\w+(?=:)/g).concat(['search', 'clock', 'weather', 'github', 'bookmarks', 'tasks', 'notes', 'music', 'quote']));
  for (const [k, p] of Object.entries(window.SP.profiles.PROFILES)) for (const s of p.spaces) {
    assert.equal(s.widgets[0], 'search', k + '/' + s.id);
    for (const w of s.widgets) assert.ok(known.has(w), k + '/' + s.id + ' uses unknown card ' + w);
  }
  assert.deepEqual(window.SP.profiles.ORDER.slice().sort(), Object.keys(window.SP.profiles.PROFILES).sort());
});

/* ---- Shelf, flashcards, prompts ---- */
test('flashcards: right answers wait longer each time (1, 3, 7, 16, 35 days); a miss starts over tomorrow', () => {
  const C = window.SP.cards3, today = window.SP.puzzles.dayKey(), c = { box: 0 };
  const gap = () => Math.round((new Date(c.due + 'T12:00') - new Date(today + 'T12:00')) / 864e5);
  const seen = []; for (let i = 0; i < 6; i++) { C.grade(c, true); seen.push(gap()); }
  assert.deepEqual(seen, [1, 3, 7, 16, 35, 35]);
  C.grade(c, false); assert.equal(c.box, 0); assert.equal(gap(), 1);
});
test('prompts: plenty of each kind, the same all day, different kinds differ', () => {
  const C = window.SP.cards3;
  for (const k of ['write', 'draw', 'make']) { assert.ok(C.PROMPTS[k].length >= 25, k); assert.equal(new Set(C.PROMPTS[k]).size, C.PROMPTS[k].length, k + ' has duplicates'); }
  window.SP.store.state = JSON.parse(JSON.stringify(rich));
  assert.equal(C.todays('write'), C.todays('write'));
  assert.ok(C.PROMPTS.draw.includes(C.todays('draw')));
});
test('shelf: guesses shows and books from the title', () => {
  const g = window.SP.cards3.guessKind;
  assert.deepEqual(['Severance season 2', 'Dune by Frank Herbert', 'Hades', 'The Expanse S03'].map(g), ['show', 'book', null, 'show']);
});

/* ---- The voice schema: every voice has exactly the same keys (see SP.voice.SCHEMA and scripts/voices.js) ---- */
const S = V.SCHEMA;
const LINE_KEYS = [...new Set([...Object.keys(V.list.neutral).filter((k) => !S.META.includes(k)), ...S.PERSONALITY])];
test('every voice has exactly the same keys: nothing missing, nothing extra', () => {
  const known = new Set([...LINE_KEYS, ...S.META]), problems = [];
  for (const [vk, voice] of Object.entries(V.list)) {
    if (voice.custom) continue;
    for (const k of LINE_KEYS) if (voice[k] === undefined && !S.RETIRED.includes(k)) problems.push(vk + ' is missing ' + k);
    for (const k of Object.keys(voice)) if (!known.has(k)) problems.push(vk + ' has an unknown key ' + k + ' (a typo, or add it to the schema)');
  }
  assert.deepEqual(problems, []);
});
test('only personality lines may be null (silent); everything on screen needs words, and every voice has a name and a descriptor', () => {
  const problems = [];
  for (const [vk, voice] of Object.entries(V.list)) {
    if (voice.custom) continue;
    for (const k of LINE_KEYS) if (voice[k] === null && !S.PERSONALITY.includes(k)) problems.push(vk + '.' + k + ' is null');
    if (!voice.name || !voice.descriptor) problems.push(vk + ' needs a name and a descriptor');
    if (!voice.blurb || typeof voice.blurb !== 'object') problems.push(vk + ' needs a blurb object');
  }
  for (const k of S.PERSONALITY) if (V.list.neutral[k] !== null) problems.push('neutral.' + k + ' should be null: Neutral doesn’t chatter');
  assert.deepEqual(problems, []);
});
test('every file that adds voice lines is on the page (and so loaded by the tests)', () => {
  const fs = require('fs'), path = require('path'), dir = path.join(__dirname, '../js'), { LINES_RE } = require('./load.js');
  const adds = fs.readdirSync(dir).filter((f) => !f.startsWith('zz') && LINES_RE.test(fs.readFileSync(path.join(dir, f), 'utf8')));
  assert.deepEqual(adds.filter((f) => !FILES.includes(f)), [], 'add a <script> tag to index.html');
});
test('the template for a new voice is complete, and works as it stands', () => {
  const { execFileSync } = require('child_process'), fs = require('fs'), path = require('path');
  const root = path.join(__dirname, '..'), file = path.join(root, 'js/zztemplatetest.js');
  try {
    execFileSync('node', ['scripts/voices.js', '--new', 'zztemplatetest', 'Tester'], { cwd: root });
    require(file);
    const v = V.list.zztemplatetest, problems = [];
    for (const k of LINE_KEYS) if (v[k] === undefined && !S.RETIRED.includes(k)) problems.push('missing ' + k);
    window.SP.store.state = JSON.parse(JSON.stringify(rich)); window.SP.store.state.voice = 'zztemplatetest';
    for (const k of LINE_KEYS) {
      if (v[k] === null || S.RETIRED.includes(k)) continue;
      const ctx = k === 'greet' ? 'evening' : k === 'addr' ? { name: 'Sam' } : CTX;
      for (const x of expand(v[k], ctx)) if (typeof x !== 'string' || !x) problems.push(k + ' gives ' + typeof x);
    }
    assert.deepEqual(problems, []);
  } finally { delete V.list.zztemplatetest; if (fs.existsSync(file)) fs.unlinkSync(file); }
});

/* ---- The Conspiracist ---- */
test('Conspiracist: connects two unrelated things that share a number', () => {
  const st = window.SP.store.state = JSON.parse(JSON.stringify(rich));
  st.tasks = [{ id: 1, text: 'a' }, { id: 2, text: 'b' }, { id: 3, text: 'c' }];
  st.countdowns = [{ id: 'x', title: 'the launch', date: day(-3) }];
  const now = new Date(); now.setHours(14, 0, 0, 0); // 2 o'clock: no clash with three
  const f = window.SP.theory.facts(now);
  assert.ok(f.some((x) => x.from === 'tasks' && x.n === 3) && f.some((x) => x.from.startsWith('countdown') && x.n === 3));
  const seen = new Set(); for (let h = 0; h < 24; h++) { const d = new Date(now); d.setHours(h); seen.add(window.SP.theory(d)); }
  assert.ok([...seen].some((t) => /3 unfinished tasks/i.test(t) && /3 days until the launch/.test(t)), [...seen].join(' | '));
});
test('Conspiracist: no theory when nothing lines up, and steady within the hour', () => {
  const st = window.SP.store.state = JSON.parse(JSON.stringify(empty));
  st.tasks = Array.from({ length: 8 }, (_, i) => ({ id: i, text: 't' + i }));
  const d = new Date(2026, 10, 9, 14, 5); // the 9th, 2 o'clock, 8 tasks, level 1: nothing matches or adds up
  assert.equal(window.SP.theory(d), '');
  st.tasks.pop(); st.tasks.pop(); st.tasks.pop(); st.tasks.pop(); st.tasks.pop(); st.tasks.pop(); st.tasks.pop(); st.tasks.push({ id: 9, text: 'x' }, { id: 10, text: 'y' });
  st.presence.visits = 2; // two tasks, two visits
  const a = window.SP.theory(d), b = window.SP.theory(new Date(2026, 10, 9, 14, 50));
  assert.ok(a && a === b, a + ' / ' + b);
});

/* ---- Cat and Narrator stay in character ---- */
const CHATTER = ['greet', 'heroSub', 'tasksEmpty', 'focusDone', 'breakDone', 'habitsEmpty', 'cdEmpty', 'grid_empty', 'streakToast', 'weatherQuip', 're_taskAdd', 're_taskDone', 're_taskAllDone',
  're_taskUndo', 're_taskDelete', 're_focusPause', 're_late', 're_visits', 'welcomeBack', 'dare_done', 'dare_declined', 'mb_noTasks', 'mood_q', 'mood_log', 'decide_aside', 'ball',
  'wr_outro', 'lvl_up', 'puz_solved', 'shelf_pick', 'heckle', 'tipsy_in', 'bday_card'];
const ctxFor = (k) => (k === 'greet' ? 'evening' : k === 'weatherQuip' ? { code: 61 } : k === 'mood_log' ? { n: 4 } : CTX);
test('the Cat only makes cat sounds, and meows numbers', () => {
  const SOUND = /^(m+e+o+w+|m+e+w+|m+r+[aoe]*w*p*|p+r+p*|h+s+|chirrup|ek|mraow)$/i, bad = [];
  window.SP.store.state = JSON.parse(JSON.stringify(rich)); window.SP.store.state.voice = 'cat';
  for (const k of CHATTER) for (const line of expand(V.list.cat[k], ctxFor(k))) {
    const words = String(line).split(/[\s\-.,!?…:]+/).filter(Boolean);
    if (!words.length || words.some((w) => !SOUND.test(w))) bad.push(k + ': ' + line);
  }
  assert.deepEqual(bad, []);
  assert.equal(expand(V.list.cat.mb_tasks, { n: 3 })[0], 'Meow. Meow. Mrrp. Mrrp.');
});
test('the Narrator talks about you, never to you', () => {
  const bad = [];
  window.SP.store.state = JSON.parse(JSON.stringify(rich)); window.SP.store.state.name = 'Sam'; window.SP.store.state.voice = 'narrator';
  for (const k of CHATTER.filter((k) => k !== 'bday_card')) for (const line of expand(V.list.narrator[k], ctxFor(k))) if (/\byou(r|rs|rself)?\b/i.test(line)) bad.push(k + ': ' + line);
  assert.deepEqual(bad, []);
  assert.ok(expand(V.list.narrator.re_taskDone, CTX).some((l) => /Sam/.test(l)), 'uses the name');
});
