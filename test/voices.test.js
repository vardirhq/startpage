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

global.window = { SP: { store: { state: rich, save() {} } } };
require('../js/voices.js');
const V = window.SP.voice;

/* Every argument any key might receive, so functions never see undefined fields. */
const CTX = { open: 2, focus: 1, n: 3, name: 'Workout', total: 12, dead: 4, flatlined: 2, alive: 4, space: 'Home', to: 'Monday', prev: 'Monday',
  code: 61, temp: 8, units: 'celsius' };

function render(state) {
  window.SP.store.state = state;
  const out = [];
  for (const [vk, voice] of Object.entries(V.list)) {
    state.voice = vk;
    for (const key of new Set([...Object.keys(V.list.neutral), ...Object.keys(voice)])) {
      if (key === 'blurb' || key === 'name' || key === 'descriptor') continue;
      const ctx = key === 'greet' ? 'evening' : key === 'addr' ? { name: 'Christoffer' } : CTX;
      // Arrays rotate hourly; check every alternative, not just this hour's.
      let val = voice[key] !== undefined ? voice[key] : V.list.neutral[key];
      if (typeof val === 'function') val = val(ctx);
      for (const v of [].concat(val)) out.push([vk, key, v]);
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
