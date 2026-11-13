// Loads every file that carries voice lines into a stub browser, in the page's own order (read from
// index.html), for the tests and scripts/voices.js. A new voice file is picked up automatically once it has
// its <script> tag. SUPPORT: files without lines that the others need.
const fs = require('fs'), path = require('path');
const SUPPORT = ['voices.js', 'speak.js', 'season.js', 'voyager.js', 'maker.js', 'eggs.js', 'panel.js', 'puzzles.js'];
const LINES_RE = /Object\.assign\(V\[k\]|SP\.voice\.list\.\w+ = \{|V\[k\]\.\w+ = /;
const root = path.join(__dirname, '..');
const FILES = [...fs.readFileSync(path.join(root, 'index.html'), 'utf8').matchAll(/<script src="js\/([^"]+)"/g)].map((m) => m[1])
  .filter((f) => SUPPORT.includes(f) || LINES_RE.test(fs.readFileSync(path.join(root, 'js', f), 'utf8')));

function load(state) {
  global.window = { SP: { store: { state, save() {}, cache: { get: () => null, set() {} } }, ui: { esc: (x) => x, toast() {}, toastLater() {}, uid: () => Math.random().toString(36).slice(2) }, icon: () => '', scene: { themes: {} }, widgets: {}, widgetMeta: {}, widgetOrder: [], widgetHead: () => '', on() {}, emit() {} } };
  global.addEventListener = () => {};
  global.document = { body: { classList: { contains: () => false } }, addEventListener() {}, querySelector: () => null, getElementById: () => null, querySelectorAll: () => [], documentElement: { dataset: {} } };
  // Remember which file brought in each of Neutral's keys, so the voice template can group them by feature.
  const origin = {}, SP = global.window.SP;
  for (const f of FILES) {
    require('../js/' + f);
    const n = SP.voice && SP.voice.list.neutral;
    if (n) for (const k of Object.keys(n)) if (!origin[k]) origin[k] = f;
  }
  SP._origin = origin;
  return SP;
}
module.exports = { load, FILES, LINES_RE };
