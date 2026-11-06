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

global.window = { SP: { store: { state: rich, save() {} }, ui: { esc: (x) => x, toast() {} }, icon: () => '' } };
global.document = { body: { classList: { contains: () => false } }, addEventListener() {} };
require('../js/voices.js');
require('../js/react.js');
require('../js/secrets.js');
require('../js/wrapped.js');
require('../js/ask.js');
const V = window.SP.voice;

/* Every argument any key might receive, so functions never see undefined fields. */
const CTX = { open: 2, focus: 1, n: 3, name: 'Workout', total: 12, dead: 4, flatlined: 2, alive: 4, space: 'Home', to: 'Monday', prev: 'Monday',
  code: 61, temp: 8, units: 'celsius', text: 'Order roof box', time: '23:41', doneToday: 2, added: 5, late: 1, who: 'Monday' };

function render(state) {
  window.SP.store.state = state;
  const out = [];
  for (const [vk, voice] of Object.entries(V.list)) {
    state.voice = vk;
    for (const key of new Set([...Object.keys(V.list.neutral), ...Object.keys(voice)])) {
      if (['blurb', 'name', 'descriptor', 'secret', 'heckle_at'].includes(key)) continue;
      const ctx = key === 'greet' ? 'evening' : key === 'addr' ? { name: 'Christoffer' } : CTX;
      // Arrays rotate hourly; check every alternative, not just this hour's.
      let val = voice[key] !== undefined ? voice[key] : V.list.neutral[key];
      if (typeof val === 'function') val = val(ctx);
      for (const v of [].concat(val)) out.push([vk, key, typeof v === 'function' ? v(ctx) : v]); // reaction arrays hold functions
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
