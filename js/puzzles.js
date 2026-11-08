/* Daily puzzles: the engine. A nonogram and a sudoku, the same for everyone on the same day,
   generated in the browser from the date (no server, no puzzle files to download).
   Nonograms come from a little set of hand-drawn pixel pictures, with generated shapes in between;
   a line solver checks each one can be solved by logic alone and hands out a few starting cells if not.
   Sudokus are generated from the date too: a full grid, then numbers taken away for as long as the
   puzzle still has exactly one answer. Monday is gentle; the weekend is not.
   The cards themselves live in puzzlecards.js. */
(function (SP) {
  'use strict';

  /* ---------- seeded randomness ---------- */
  function hash(str) { let h = 1779033703 ^ str.length; for (let i = 0; i < str.length; i++) { h = Math.imul(h ^ str.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); } return h >>> 0; }
  function rng(seed) { let a = typeof seed === 'number' ? seed >>> 0 : hash(String(seed)); return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function shuffle(arr, r) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  const pad = (n) => String(n).padStart(2, '0');
  const dayKey = (d) => { d = d || new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
  const dayNum = (key) => { const [y, m, d] = key.split('-').map(Number); return Math.round(Date.UTC(y, m - 1, d) / 864e5); };
  const prevDay = (key) => { const [y, m, d] = key.split('-').map(Number); return dayKey(new Date(y, m - 1, d - 1)); };

  /* ---------- nonogram pictures (10×10; each letter is a colour, dots are empty) ---------- */
  const COLORS = { k: '#2b2340', w: '#f4f1ea', r: '#e5484d', o: '#f2994a', y: '#f5d547', g: '#5cc465', d: '#2f8f4e', b: '#4f8ff7',
    c: '#7fd3f5', p: '#f08cc0', v: '#9b6ff2', n: '#a0663a', s: '#9aa0b0' };
  const ART = [
    ['cat', 'a cat', 'o........o|oo......oo|oooooooooo|o.oooooo.o|oooooooooo|ooookkoooo|.oooooooo.|..oooooo..|..oo..oo..|..........'],
    ['heart', 'a heart', '..........|.rr....rr.|rrrr..rrrr|rrrrrrrrrr|rrrrrrrrrr|.rrrrrrrr.|..rrrrrr..|...rrrr...|....rr....|..........'],
    ['mug', 'a mug of coffee', '..s..s....|...s..s...|..s..s....|nnnnnnn...|nkkkkkknn.|nnnnnnn..n|nnnnnnn..n|nnnnnnnnn.|nnnnnnn...|.nnnnn....'],
    ['ghost', 'a ghost', '...wwww...|..wwwwww..|.wwwwwwww.|.ww.ww.ww.|.wwwwwwww.|.wwwwwwww.|.wwwwwwww.|.wwwwwwww.|.wwwwwwww.|.w.ww.w.w.'],
    ['tree', 'a tree', '....dd....|...dddd...|..dddddd..|...dddd...|..dddddd..|.dddddddd.|dddddddddd|....nn....|....nn....|...nnnn...'],
    ['house', 'a house', '....rr....|...rrrr...|..rrrrrr..|.rrrrrrrr.|rrrrrrrrrr|.yyyyyyyy.|.y..yy..y.|.yyyyyyyy.|.yyy..yyy.|.yyy..yyy.'],
    ['moon', 'the moon', '...yyyy...|.yyyyy....|.yyyy.....|yyyy......|yyyy......|yyyy......|yyyy......|.yyyy.....|.yyyyy....|...yyyy...'],
    ['mushroom', 'a mushroom', '...rrrr...|.rrwwrrrr.|rrwwrrrwwr|rrrrrrrwwr|rrrrrrrrrr|...wwww...|...wwww...|...wwww...|...wwww...|..wwwwww..'],
    ['star', 'a star', '....yy....|....yy....|...yyyy...|yyyyyyyyyy|.yyyyyyyy.|..yyyyyy..|..yyyyyy..|.yyy..yyy.|.yy....yy.|y........y'],
    ['fish', 'a fish', '..........|.....bbb..|b...bbbbb.|bb.bbbbb.b|bbbbbbbbbb|bb.bbbbbbb|b...bbbbb.|.....bbb..|..........|..........'],
    ['key', 'a key', '..........|.yyy......|y...y.....|y...yyyyyy|y...y..y.y|.yyy...y.y|..........|..........|..........|..........'],
    ['rocket', 'a rocket', '....ww....|...wwww...|...wccw...|...wwww...|...wwww...|..wwwwww..|.rwwwwwwr.|.rr.oo.rr.|....oo....|....o.....'],
    ['flower', 'a flower', '...pppp...|..pp..pp..|..p.yy.p..|..pp..pp..|...pppp...|....dd....|.dd.dd....|..dddd.dd.|....dddd..|....dd....'],
    ['rain', 'a rain cloud', '...ssss...|..ssssss..|.ssssssss.|ssssssssss|.ssssssss.|..........|.b..b..b..|..b..b..b.|.b..b..b..|..........'],
    ['apple', 'an apple', '.....n....|....n.dd..|..rrrrrr..|.rrrrrrrr.|rrrrrrrrrr|rrrrrrrrrr|rrrrrrrrrr|.rrrrrrrr.|.rrrrrrrr.|..rr..rr..'],
    ['gem', 'a gem', '..........|..cccccc..|.cccccccc.|cccccccccc|.cccccccc.|..cccccc..|...cccc...|....cc....|..........|..........'],
    ['duck', 'a duck', '...yyy....|..yyyyy...|..yy.yyo..|..yyyyyoo.|...yyy....|.yyyyyyy..|yyyyyyyyy.|yyyyyyyyy.|.yyyyyyy..|..........'],
    ['note', 'a music note', '...vvvvvvv|...vvvvvvv|...v.....v|...v.....v|...v.....v|.vvv...vvv|vvvv..vvvv|vvvv..vvvv|.vv....vv.|..........'],
    ['boat', 'a sailboat', '....w.....|....ww....|....www...|....wwww..|....wwwww.|....n.....|nnnnnnnnnn|.nnnnnnnn.|..nnnnnn..|bbbbbbbbbb'],
    ['icecream', 'an ice cream', '...pppp...|..pppppp..|..pppppp..|..oooooo..|...oooo...|...oooo...|....oo....|....oo....|..........|..........'],
    ['bulb', 'a light bulb', '...yyyy...|..yyyyyy..|.yyyyyyyy.|.yyyyyyyy.|.yyyyyyyy.|..yyyyyy..|...yyyy...|...ssss...|...ssss...|....ss....'],
    ['umbrella', 'an umbrella', '....v.....|..vvvvv...|.vvvvvvv..|vvvvvvvvv.|v.v.v.v.v.|....n.....|....n.....|....n.....|..n.n.....|...n......'],
    ['cactus', 'a cactus', '....dd....|....dd..d.|.d..dd..d.|.d..dd.dd.|.dd.dddd..|..dddd....|....dd....|....dd....|..oooooo..|...oooo...'],
    ['crown', 'a crown', '..........|y...yy...y|yy..yy..yy|yyy.yy.yyy|yyyyyyyyyy|yyyyyyyyyy|yryyccyyry|yyyyyyyyyy|..........|..........'],
  ].map(([id, name, rows]) => ({ id, name, rows: rows.split('|') }));

  const clue = (line) => { const out = []; let run = 0; for (const v of line) { if (v === 1) run++; else if (run) { out.push(run); run = 0; } } if (run) out.push(run); return out; };

  /* Every arrangement of one line's clue that fits what's known; keep what they all agree on.
     cells: -1 unknown, 0 empty, 1 filled. Returns null if nothing fits. */
  function solveLine(cells, cl) {
    const n = cells.length, can1 = new Array(n).fill(false), can0 = new Array(n).fill(false), cur = new Array(n).fill(0);
    let any = false;
    (function place(ci, start) {
      if (ci === cl.length) {
        for (let i = start; i < n; i++) { if (cells[i] === 1) return; cur[i] = 0; }
        any = true; for (let i = 0; i < n; i++) cur[i] ? (can1[i] = true) : (can0[i] = true);
        return;
      }
      const len = cl[ci]; let rest = 0; for (let j = ci + 1; j < cl.length; j++) rest += cl[j] + 1;
      for (let s = start; s + len + rest <= n; s++) {
        if (s > start && cells[s - 1] === 1) break; // can't leave a filled cell behind
        let ok = true; for (let i = s; i < s + len; i++) if (cells[i] === 0) { ok = false; break; }
        if (!ok || cells[s + len] === 1) continue;
        for (let i = start; i < s; i++) cur[i] = 0;
        for (let i = s; i < s + len; i++) cur[i] = 1;
        if (s + len < n) cur[s + len] = 0;
        place(ci + 1, s + len + 1);
      }
    })(0, 0);
    if (!any) return null;
    return cells.map((v, i) => (v !== -1 ? v : can1[i] && !can0[i] ? 1 : can0[i] && !can1[i] ? 0 : -1));
  }
  /* Solve rows and columns in turn until nothing changes. Returns the grid (with -1 where logic runs out). */
  function lineSolve(rows, cols, known) {
    const H = rows.length, W = cols.length, g = known ? known.slice() : new Array(W * H).fill(-1);
    let changed = true;
    while (changed) {
      changed = false;
      for (let r = 0; r < H; r++) {
        const line = g.slice(r * W, r * W + W), out = solveLine(line, rows[r]); if (!out) return null;
        for (let c = 0; c < W; c++) if (out[c] !== line[c]) { g[r * W + c] = out[c]; changed = true; }
      }
      for (let c = 0; c < W; c++) {
        const line = []; for (let r = 0; r < H; r++) line.push(g[r * W + c]);
        const out = solveLine(line, cols[c]); if (!out) return null;
        for (let r = 0; r < H; r++) if (out[r] !== line[r]) { g[r * W + c] = out[r]; changed = true; }
      }
    }
    return g;
  }

  /* A generated shape: noise, smoothed into blobs, mirrored so it looks like something on purpose. */
  function blob(r) {
    const W = 10, H = 10; let g = [];
    for (let y = 0; y < H; y++) for (let x = 0; x < W / 2; x++) g[y * W + x] = r() < 0.58 ? 1 : 0;
    for (let pass = 0; pass < 2; pass++) {
      const n = g.slice();
      for (let y = 0; y < H; y++) for (let x = 0; x < W / 2; x++) {
        let c = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { if (!dx && !dy) continue; const yy = y + dy, xx = x + dx; if (yy < 0 || yy >= H || xx < 0) continue; c += xx >= W / 2 ? g[yy * W + (W - 1 - xx)] : g[yy * W + xx]; }
        n[y * W + x] = c >= 5 ? 1 : c <= 2 ? 0 : g[y * W + x];
      }
      g = n;
    }
    for (let y = 0; y < H; y++) for (let x = 0; x < W / 2; x++) g[y * W + (W - 1 - x)] = g[y * W + x];
    const total = g.reduce((a, b) => a + b, 0);
    if (total < 30 || total > 75) return blob(r); // too sparse or too solid: roll again (same seed, so still deterministic)
    const ink = shuffle(['v', 'b', 'c', 'p', 'g', 'o'], r).slice(0, 2);
    return { id: 'gen', name: 'a shape nobody has ever seen before', rows: Array.from({ length: H }, (_, y) => g.slice(y * W, y * W + W).map((v) => (v ? ink[y < H / 2 ? 0 : 1] : '.')).join('')) };
  }

  /* Build a puzzle from a picture: clues, the solution, and the starting cells logic needs. */
  function nonoFrom(art, r) {
    const H = art.rows.length, W = art.rows[0].length, sol = [], colors = [];
    for (const row of art.rows) for (const ch of row) { sol.push(ch === '.' ? 0 : 1); colors.push(COLORS[ch] || ''); }
    const rows = [], cols = [];
    for (let y = 0; y < H; y++) rows.push(clue(sol.slice(y * W, y * W + W)));
    for (let x = 0; x < W; x++) { const l = []; for (let y = 0; y < H; y++) l.push(sol[y * W + x]); cols.push(clue(l)); }
    const known = new Array(W * H).fill(-1), givens = {};
    let g = lineSolve(rows, cols, known);
    while (g.includes(-1)) { // logic got stuck: reveal one of the cells it couldn't work out
      const open = []; g.forEach((v, i) => v === -1 && open.push(i));
      const i = open[Math.floor(r() * open.length)];
      givens[i] = sol[i]; known[i] = sol[i];
      g = lineSolve(rows, cols, known);
    }
    return { id: art.id, name: art.name, W, H, rows, cols, sol, colors, givens };
  }

  /* Today's nonogram: odd days a hand-drawn picture (each cycle in a fresh order), even days a generated shape. */
  function nonogram(seed) {
    if (/^\d{4}-\d\d-\d\d$/.test(seed)) {
      const n = dayNum(seed), r = rng('nono' + seed);
      if (n % 2) { const half = Math.floor(n / 2), cyc = Math.floor(half / ART.length), order = shuffle(ART.map((_, i) => i), rng('cycle' + cyc)); return nonoFrom(ART[order[half % ART.length]], r); }
      return nonoFrom(blob(r), r);
    }
    const r = rng(seed); // practice: anything goes
    return nonoFrom(r() < 0.4 ? ART[Math.floor(r() * ART.length)] : blob(r), r);
  }

  /* ---------- sudoku ---------- */
  const PEERS = (() => {
    const out = [];
    for (let i = 0; i < 81; i++) {
      const r = Math.floor(i / 9), c = i % 9, br = r - (r % 3), bc = c - (c % 3), s = new Set();
      for (let k = 0; k < 9; k++) { s.add(r * 9 + k); s.add(k * 9 + c); s.add((br + Math.floor(k / 3)) * 9 + bc + (k % 3)); }
      s.delete(i); out.push([...s]);
    }
    return out;
  })();
  const bits = (m) => { const out = []; for (let d = 1; d <= 9; d++) if (m & (1 << d)) out.push(d); return out; };
  function cands(g, i) { let m = 0x3fe; for (const p of PEERS[i]) if (g[p]) m &= ~(1 << g[p]); return m; }
  /* Count solutions (stopping at `limit`); with `r`, fills g with a random one. */
  function sudokuSolve(g, limit, r) {
    let count = 0;
    (function go() {
      let best = -1, bm = 0, bn = 10;
      for (let i = 0; i < 81; i++) if (!g[i]) { const m = cands(g, i), n = bits(m).length; if (n < bn) { best = i; bm = m; bn = n; if (n <= 1) break; } }
      if (best < 0) { count++; return; }
      if (!bn) return;
      for (const d of r ? shuffle(bits(bm), r) : bits(bm)) { g[best] = d; go(); if (count >= limit) return; g[best] = 0; }
    })();
    return count;
  }
  // Fewer numbers to start with as the week goes on (index: Sunday = 0).
  const SUDOKU_LEVELS = [{ name: 'Tough', givens: 26 }, { name: 'Easy', givens: 40 }, { name: 'Easy', givens: 37 }, { name: 'Medium', givens: 34 }, { name: 'Medium', givens: 32 }, { name: 'Hard', givens: 29 }, { name: 'Hard', givens: 28 }];
  function sudoku(seed, level) {
    const r = rng('sudoku' + seed), sol = new Array(81).fill(0);
    sudokuSolve(sol, 1, r);
    const lv = level || (/^\d{4}-\d\d-\d\d$/.test(seed) ? SUDOKU_LEVELS[new Date(seed + 'T12:00').getDay()] : SUDOKU_LEVELS[3]);
    const g = sol.slice(); let left = 81;
    for (const i of shuffle([...Array(41).keys()], r)) { // in mirrored pairs, so the grid looks designed
      if (left <= lv.givens) break;
      const j = 80 - i, a = g[i], b = g[j];
      g[i] = 0; g[j] = 0;
      if (sudokuSolve(g.slice(), 2) === 1) left -= i === j ? 1 : 2; else { g[i] = a; g[j] = b; }
    }
    return { puzzle: g.join(''), solution: sol.join(''), level: lv.name };
  }

  /* ---------- state ---------- */
  const S = () => SP.store.state;
  const P = () => S().puz || (S().puz = {});
  const streak = (kind) => { const s = (P().streak || {})[kind]; if (!s) return 0; const today = dayKey(); return s.last === today || s.last === prevDay(today) ? s.n : 0; };
  /* Called once when today's puzzle is solved. Returns the new streak. */
  function solvedToday(kind) {
    const p = P(), st = p.streak || (p.streak = {}), today = dayKey(), s = st[kind] || { n: 0, last: '' };
    if (s.last === today) return s.n;
    s.n = s.last === prevDay(today) ? s.n + 1 : 1; s.last = today; st[kind] = s;
    if (SP.react && SP.react.stat) SP.react.stat('puzzles');
    return s.n;
  }
  const fmtTime = (ms) => { const s = Math.max(1, Math.round(ms / 1000)), m = Math.floor(s / 60); return m >= 60 ? Math.floor(m / 60) + ':' + pad(m % 60) + ':' + pad(s % 60) : m + ':' + pad(s % 60); };

  SP.puzzles = { rng, hash, shuffle, dayKey, dayNum, prevDay, ART, COLORS, clue, solveLine, lineSolve, nonogram, nonoFrom, blob, sudoku, sudokuSolve, PEERS, SUDOKU_LEVELS, streak, solvedToday, fmtTime, P };
})(window.SP = window.SP || {});
