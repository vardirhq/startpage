#!/usr/bin/env node
/* Voice report: every voice against the schema in js/voices.js (SP.voice.SCHEMA).
   Every voice has the same keys. A key can be a line, or null: "this voice deliberately says nothing here"
   (allowed only for the personality lines Neutral doesn't say). Anything missing or unknown is a mistake.

   node scripts/voices.js            the table
   node scripts/voices.js monday     the details for one voice: what's missing, unknown, silent
   node scripts/voices.js --new pirate "Captain"
                                     writes js/pirate.js: a new voice with every key, starting as a copy of
                                     Neutral, grouped by feature. It works straight away; rewrite it line by line.
   Exits non-zero if any voice is missing a key or has one the schema doesn't know. */
'use strict';
const path = require('path');
process.chdir(path.join(__dirname, '..'));
const { load } = require('../test/load.js');
const SP = load({ voice: 'neutral', tasks: [], habits: [], presence: {} });
const V = SP.voice.list, S = SP.voice.SCHEMA;
const LINES = [...new Set([...Object.keys(V.neutral).filter((k) => !S.META.includes(k)), ...S.PERSONALITY])];
const known = new Set([...LINES, ...S.META]);
const count = (val) => (Array.isArray(val) ? val.length : val == null ? 0 : 1);

function check(vk) {
  const v = V[vk];
  return {
    missing: LINES.filter((k) => v[k] === undefined && !S.RETIRED.includes(k)),
    unknown: Object.keys(v).filter((k) => !known.has(k)),
    silent: LINES.filter((k) => v[k] === null),
    badSilent: LINES.filter((k) => v[k] === null && !S.PERSONALITY.includes(k)), // UI copy can't be empty
    lines: LINES.reduce((n, k) => n + count(v[k]), 0),
  };
}

/* ---------- the template for a new voice ---------- */
function src(val, indent) {
  if (val === null) return 'null';
  if (typeof val === 'function') return val.toString();
  if (typeof val === 'string') return "'" + val.replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
  if (Array.isArray(val)) return '[' + val.map((x) => src(x, indent)).join(', ') + ']';
  if (typeof val === 'object') return '{ ' + Object.entries(val).map(([k, x]) => k + ': ' + src(x, indent)).join(', ') + ' }';
  return String(val);
}
function template(key, name) {
  const groups = {};
  for (const k of LINES) { if (S.RETIRED.includes(k)) continue; const f = SP._origin[k] || 'react.js'; (groups[f] = groups[f] || []).push(k); }
  const out = [];
  out.push('/* ' + name + ': describe the personality in a sentence or two. Who are they, how do they talk, what do they never say?');
  out.push('   Made with `node scripts/voices.js --new ' + key + '`. It starts as a copy of Neutral, so it works straight away.');
  out.push('   Rewrite it line by line. Run `node scripts/voices.js ' + key + '` to see what’s left, and `node --test test/*.test.js`.');
  out.push('   Rules of the house:');
  out.push('   - Every key stays. A personality line (marked below) may be null: “this voice says nothing here”.');
  out.push('   - Strings, or functions of the context ({ name }, { open, focus }…), or arrays of either (one is picked; the lines');
  out.push('     you see most need at least three).');
  out.push('   - Keep it kind underneath: tease the work, never the person. No swearing unless you set swears: true. */');
  out.push('(function (SP) {');
  out.push("  'use strict';");
  out.push('  const { plural, human, wx, pick, C, bestHabit, q, times, days, list } = SP.voice._h; // helpers: see SP.voice._h in js/voices.js');
  out.push('');
  out.push('  SP.voice.list.' + key + ' = {');
  out.push("    name: " + src(name) + ", descriptor: 'One short line for the voice picker.',");
  out.push('    speech: { pitch: 1, rate: 1 }, // read-aloud: pitch 0.5–1.5, rate 0.7–1.3');
  out.push('    heckle_at: {}, // what this voice says when it butts in on a specific voice: { monday: \'…\' }');
  for (const [f, keys] of Object.entries(groups)) {
    out.push('');
    out.push('    /* ---- ' + f.replace('.js', '') + ' ---- */');
    for (const k of keys) {
      const personality = S.PERSONALITY.includes(k);
      out.push('    ' + k + ': ' + src(personality ? null : V.neutral[k]) + ',' + (personality ? ' // personality line: optional (null = silent)' : ''));
    }
  }
  out.push('');
  out.push('    /* ---- what this voice thinks of the others (shown in the voice picker) ---- */');
  out.push('    blurb: ' + src(Object.assign({}, V.neutral.blurb, { [key]: 'What it says about itself.' })) + ',');
  out.push('  };');
  out.push('})(window.SP = window.SP || {});');
  return out.join('\n') + '\n';
}

const only = process.argv[2];
if (only === '--new') {
  const key = process.argv[3], name = process.argv[4] || (key ? key[0].toUpperCase() + key.slice(1) : '');
  if (!/^[a-z][a-z0-9]*$/.test(key || '')) { console.error('Usage: node scripts/voices.js --new <key> ["Name"]   (key: lowercase letters and digits)'); process.exit(2); }
  if (V[key]) { console.error('There is already a voice called ' + key + '.'); process.exit(2); }
  const fs = require('fs'), file = 'js/' + key + '.js';
  if (fs.existsSync(file)) { console.error(file + ' already exists.'); process.exit(2); }
  fs.writeFileSync(file, template(key, name));
  console.log('Wrote ' + file + '. Next:');
  console.log('  1. index.html: add <script src="js/' + key + '.js"></script> right after js/conspiracy.js');
  console.log('  2. Rewrite the lines. It starts as a copy of Neutral; the tests list what still needs your voice:');
  console.log('       node scripts/voices.js ' + key + '      what’s missing or silent');
  console.log('       node --test test/*.test.js     everything (frequent lines need three variations)');
  process.exit(0);
}
let bad = 0;
if (only) {
  if (!V[only]) {
    const fs = require('fs');
    console.error(fs.existsSync('js/' + only + '.js') ? 'js/' + only + '.js exists, but isn’t on the page yet: add <script src="js/' + only + '.js"></script> to index.html, right after js/conspiracy.js.'
      : 'No voice called ' + only + '. Voices: ' + Object.keys(V).join(', '));
    process.exit(2);
  }
  const r = check(only);
  console.log(V[only].name + ' (' + only + '): ' + r.lines + ' lines across ' + LINES.length + ' keys');
  for (const [label, list] of [['Missing', r.missing], ['Unknown (typo or leftover?)', r.unknown], ['Silent on purpose (null)', r.silent], ['Silent but must not be', r.badSilent]]) {
    console.log('\n' + label + ': ' + (list.length ? '\n  ' + list.join('\n  ') : 'none'));
  }
  bad = r.missing.length + r.unknown.length + r.badSilent.length;
} else {
  console.log(LINES.length + ' keys per voice: ' + (LINES.length - S.PERSONALITY.length) + ' lines every voice says, ' + S.PERSONALITY.length + ' personality lines (may be null), ' + S.RETIRED.length + ' retired\n');
  console.log('voice'.padEnd(14) + 'lines'.padStart(6) + 'silent'.padStart(8) + 'missing'.padStart(9) + 'unknown'.padStart(9));
  for (const vk of Object.keys(V)) {
    if (V[vk].custom) continue;
    const r = check(vk); bad += r.missing.length + r.unknown.length + r.badSilent.length;
    console.log(vk.padEnd(14) + String(r.lines).padStart(6) + String(r.silent.length).padStart(8) + String(r.missing.length || '·').padStart(9) + String(r.unknown.length || '·').padStart(9));
  }
  console.log(bad ? '\nProblems found. Run node scripts/voices.js <voice> for the details.' : '\nEvery voice has every key.');
}
process.exit(bad ? 1 : 0);
