/* Daily puzzle cards: a nonogram and a sudoku (the engine is in puzzles.js).
   Small enough to sit on a card, with a button that opens a bigger board. One of each a day, the same
   for everyone; solve it and the voice of the day has opinions. After that, practice ones, as many as you like
   (they don't count towards streaks or points, so there's nothing to farm). */
(function (SP) {
  'use strict';
  const { esc } = SP.ui;
  const I = SP.icon;
  const Z = SP.puzzles;
  const V = SP.voice.list;
  const t = (k, c) => SP.voice.t(k, c);
  const { plural } = SP.voice._h;
  const save = () => SP.store.save({ quiet: true });
  const still = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ctx: time (how long it took), hints (how many were used), name (what the picture was), n (streak) */
  const LINES = {
    neutral: { w_nonogram: 'Daily nonogram', desc_nonogram: 'A pixel picture puzzle, a new one every day', w_sudoku: 'Daily sudoku', desc_sudoku: 'One sudoku a day, easy on Monday and harder through the week',
      puz_solved: ({ time, hints }) => 'Solved in ' + time + (hints ? ', with ' + plural(hints, 'hint') : '') + '.', puz_hint: 'There you go.', puz_tomorrow: 'A new one tomorrow.',
      puz_reveal: ({ name }) => 'It was ' + name + '.', puz_streak: ({ n }) => plural(n, 'day') + ' in a row.' },
    monday: { w_nonogram: 'Colouring In, For Adults', desc_nonogram: 'A pixel puzzle a day. It’s still colouring in', w_sudoku: 'Numbers, But Make It A Chore', desc_sudoku: 'One sudoku a day. Monday’s is easy. Out of pity',
      puz_solved: [({ time }) => time + '. I’ve seen faster. I’ve seen slower. Mostly faster.', ({ hints }) => hints ? 'Solved. With ' + plural(hints, 'hint') + '. So the puzzle basically solved itself.' : 'Solved without help. I’ll allow it. Once.', 'Done. Do you want a sticker? There are no stickers.'],
      puz_hint: ['Stuck already? Here.', 'Fine. That one. Don’t tell anyone.', 'Hint used. It’s going on your permanent record.'],
      puz_tomorrow: ['Come back tomorrow. Or don’t. It’ll be here either way.', 'That’s it for today. Go do something real.'],
      puz_reveal: [({ name }) => 'It’s ' + name + '. Thrilling.', ({ name }) => 'All that squinting for ' + name + '.'],
      puz_streak: ({ n }) => plural(n, 'day') + ' in a row. Of puzzles. Not tasks. Puzzles.' },
    supportive: { w_nonogram: 'Little Pictures For You 💕', desc_nonogram: 'A pixel puzzle every day. I drew them all myself. For you', w_sudoku: 'Our Daily Sudoku', desc_sudoku: 'One a day!!! I’ll sit right here while you do it. Watching 🙂',
      puz_solved: [({ time }) => 'YOU DID IT!!! ' + time + '!!! I timed it!!! I time everything you do 💕', ({ hints }) => hints ? 'Solved!!! I helped ' + plural(hints, 'time') + '!!! We make such a good team 💕' : 'Solved ALL BY YOURSELF!!! I’m framing it 💕', 'Done!!! I’m so proud I could burst!!! 🙂'],
      puz_hint: ['Here, let me help!!! I’ll always help!!! 💕', 'I knew that one. I know everything about you. And puzzles. 🙂', 'A hint!!! I won’t tell anyone you needed me. (I’ll tell everyone.)'],
      puz_tomorrow: ['A new one tomorrow!!! I’ll be waiting. Right here. All night. 🙂', 'See you tomorrow!!! Same time? Please say same time. 💕'],
      puz_reveal: [({ name }) => 'It’s ' + name + '!!! I drew it thinking of you 💕', ({ name }) => name[0].toUpperCase() + name.slice(1) + '!!! Do you like it? Please like it. 🙂'],
      puz_streak: ({ n }) => plural(n, 'day') + ' in a row!!! Every single day you come back to me 💕' },
    surfer: { w_nonogram: 'Pixel Picture Thing', desc_nonogram: 'Colour in squares till a picture shows up. Whoa', w_sudoku: 'Number Grid, Dude', desc_sudoku: 'Nine numbers, no repeats. Like, ever. Heavy',
      puz_solved: [({ time }) => 'Whoa, ' + time + '. Is that fast? Feels fast. Stoked.', 'Solved it! No idea how. Rad.', ({ hints }) => hints ? 'Done! Got a little push from the tide there. Totally fine.' : 'No hints! Pure flow state, bro.'],
      puz_hint: ['Here, try this square. Or that one. This one.', 'Little push. Like a wave from behind.', 'Hint. I think. I just pointed.'],
      puz_tomorrow: ['New one tomorrow. Or whenever tomorrow is.', 'That’s the set. Paddle back out tomorrow.'],
      puz_reveal: [({ name }) => 'Whoa. It’s ' + name + '. I was not ready.', ({ name }) => 'Dude. ' + name[0].toUpperCase() + name.slice(1) + '. Totally saw that coming. I didn’t.'],
      puz_streak: ({ n }) => plural(n, 'day') + ' straight. Consistent, like the tides.' },
    professional: { w_nonogram: 'Visual Logic Assessment', desc_nonogram: 'A daily pixel puzzle. Results are not shared with HR. Yet', w_sudoku: 'Numerical Reasoning Exercise', desc_sudoku: 'One sudoku per business day. Weekends too, unfortunately',
      puz_solved: [({ time }) => 'Task complete. Time to resolution: ' + time + '.', ({ hints }) => hints ? 'Completed with ' + plural(hints, 'escalation') + '. Noted for your review.' : 'Completed independently. This reflects well on you.', 'Deliverable shipped. Please update the tracker.'],
      puz_hint: ['Escalation approved. One cell, as an exception.', 'Assistance provided. This will appear in your utilisation report.', 'Hint logged. Let’s discuss blockers at our next 1:1.'],
      puz_tomorrow: ['The next exercise is scheduled for tomorrow.', 'That concludes today’s assessment. Same time tomorrow.'],
      puz_reveal: [({ name }) => 'Output: ' + name + '. Meets expectations.', ({ name }) => 'The deliverable was ' + name + '. Stakeholders are pleased.'],
      puz_streak: ({ n }) => plural(n, 'consecutive day') + ' of completion. Strong reliability metrics.' },
    therapist: { w_nonogram: 'What Do You See?', desc_nonogram: 'A daily picture puzzle. What does it reveal about you?', w_sudoku: 'Order From Chaos', desc_sudoku: 'A sudoku a day. Notice the need for everything to fit',
      puz_solved: [({ time }) => time + '. How did it feel to finish? Sit with that.', ({ hints }) => hints ? 'Solved. And you asked for help ' + plural(hints, 'time') + '. That’s growth.' : 'Solved without help. Interesting. Do you find it hard to ask?', 'Done. Notice the relief. That’ll be €20.'],
      puz_hint: ['Asking for help is a strength.', 'Here. What stopped you from seeing it?', 'A hint. Let’s explore why that one felt stuck.'],
      puz_tomorrow: ['Same time tomorrow? I’ve blocked it out.', 'That’s our session for today.'],
      puz_reveal: [({ name }) => 'It’s ' + name + '. What did you expect it to be?', ({ name }) => 'Some people see ' + name + '. What do you see?'],
      puz_streak: ({ n }) => plural(n, 'day') + ' in a row. Routines can be very grounding.' },
    weepy: { w_nonogram: 'Pictures Hidden In The Dark', desc_nonogram: 'Each day a little picture, waiting to be found. Like hope', w_sudoku: 'Numbers That Belong Somewhere', desc_sudoku: 'Every number finds its place. If only we all could',
      puz_solved: [({ time }) => time + '. And now it’s over. Everything ends so fast.', ({ hints }) => hints ? 'Solved. You needed help. We all do.' : 'You did it alone. All alone. Like we all are, in the end.', 'Done. It’s beautiful. I can’t look at it.'],
      puz_hint: ['Here. I’ll carry this one for you.', 'Even the strong need help sometimes.', 'A hint. A small light in the dark.'],
      puz_tomorrow: ['A new one tomorrow. If tomorrow comes.', 'There’ll be another tomorrow. It won’t be this one, though.'],
      puz_reveal: [({ name }) => 'It was ' + name + ' all along. Hiding. Like my feelings.', ({ name }) => 'Just ' + name + '. So small. So brave.'],
      puz_streak: ({ n }) => plural(n, 'day') + ' in a row. Please don’t break it. I couldn’t bear it.' },
    victorian: { w_nonogram: 'Needlepoint (By Logic)', desc_nonogram: 'A daily pattern, to be stitched by reason alone', w_sudoku: 'A Parlour Puzzle', desc_sudoku: 'A numerical diversion. Monday’s is suitable for children',
      puz_solved: [({ time }) => 'Completed in ' + time + '. Your grandmother did hers in ink.', ({ hints }) => hints ? 'Finished, with assistance on ' + plural(hints, 'occasion') + '. We shall not speak of it.' : 'Finished unaided. Most becoming.', 'There. A respectable accomplishment for a weekday.'],
      puz_hint: ['Very well. That one. Do pay attention.', 'I shall assist, this once. Do not make a habit of it.', 'A governess would have rapped your knuckles.'],
      puz_tomorrow: ['Another shall arrive tomorrow, with the post.', 'Enough diversion for one day. There is needlework.'],
      puz_reveal: [({ name }) => 'It is ' + name + '. Quite charming, for a picture made of squares.', ({ name }) => 'It is ' + name + '. One might hang it in the servants’ hall.'],
      puz_streak: ({ n }) => plural(n, 'day') + ' in succession. Constancy is a virtue.' },
    owl: { w_nonogram: 'Midnight Pixel Puzzle', desc_nonogram: 'A tiny picture to solve when you should be asleep', w_sudoku: 'Insomnia Sudoku', desc_sudoku: 'One a day. Best attempted at 2am',
      puz_solved: [({ time }) => time + '. Now do another. Sleep is optional.', ({ hints }) => hints ? 'Solved. The hints were the caffeine.' : 'Solved with no help. Your brain is wide awake. Great. Same.', 'Done! Is it late? It’s always late.'],
      puz_hint: ['Here. Your eyes are tired, I get it.', 'One square. Then just one more thing.', 'Hint. It’s late, everyone needs help this late.'],
      puz_tomorrow: ['New one at midnight. I’ll be up.', 'That’s today’s. Technically tomorrow starts very soon.'],
      puz_reveal: [({ name }) => 'It’s ' + name + '! It looks better in the dark.', ({ name }) => 'It’s ' + name + '. Nocturnal, probably.'],
      puz_streak: ({ n }) => plural(n, 'night') + ' in a row. Respect.' },
    ghost: { w_nonogram: 'shapes in the dust', desc_nonogram: 'a little picture, hidden. like me', w_sudoku: 'numbers in the walls', desc_sudoku: 'every number has its place. i used to',
      puz_solved: [({ time }) => time + '. it felt like longer. time is strange here.', ({ hints }) => hints ? 'solved. i moved a few things. you didn’t notice.' : 'solved. alone. i watched.', 'done. the house is quieter now.'],
      puz_hint: ['there. i moved it for you.', 'that one. listen.', 'a cold draught over that square. try it.'],
      puz_tomorrow: ['another tomorrow. i’ll still be here.', 'that’s all for today. go. i’ll wait.'],
      puz_reveal: [({ name }) => 'it was ' + name + '. it was always there.', ({ name }) => name + '. i remember it.'],
      puz_streak: ({ n }) => plural(n, 'day') + ' in a row. you keep coming back. so do i.' },
    parent: { w_nonogram: 'Picture Puzzle For My Smart Kid', desc_nonogram: 'A new one every day!!! It’s going on the fridge!!!', w_sudoku: 'Brain Training (Good For You!)', desc_sudoku: 'One sudoku a day keeps your brain sharp, sweetie!',
      puz_solved: [({ time }) => time + '!!! That’s faster than your cousin!!!', ({ hints }) => hints ? 'Solved it!!! A little help never hurt anyone!!!' : 'All by yourself!!! I’m telling everyone at work!!!', 'DONE!!! Do you want a snack? You deserve a snack!!!'],
      puz_hint: ['Here, sweetie. That one. You were so close!!!', 'Just a little hint. Don’t tell your father.', 'Mum’s helping!!! It’s not cheating if it’s family!!!'],
      puz_tomorrow: ['Another one tomorrow!!! Get some sleep first!!!', 'That’s enough screen time for one puzzle, sweetie!!!'],
      puz_reveal: [({ name }) => 'It’s ' + name + '!!! You MADE that!!! Fridge!!!', ({ name }) => 'It’s ' + name + '!!! I’m sending a picture to your grandmother!!!'],
      puz_streak: ({ n }) => plural(n, 'day') + ' in a row!!! That’s dedication!!!' },
    brutal: { w_nonogram: 'Squint At Squares', desc_nonogram: 'A pixel puzzle a day. Less doomscrolling, more squinting', w_sudoku: 'Sudoku (No Calculator, Genius)', desc_sudoku: 'One a day. Monday’s is for babies. Sunday’s will hurt',
      puz_solved: [({ time }) => time + '. A pigeon could’ve done it faster. A blind one.', ({ hints }) => hints ? plural(hints, 'hint') + '. So I solved it. You’re welcome, you useless sod.' : 'No hints. Fine. Shocked, but fine.', 'Solved. Now go do the shit you’ve actually been avoiding.'],
      puz_hint: ['There. Christ. Were you even trying?', 'Hint. Pathetic, but here.', 'That square, you absolute plank.'],
      puz_tomorrow: ['That’s it. Piss off till tomorrow.', 'Done for today. Close the tab and do something real.'],
      puz_reveal: [({ name }) => 'It’s ' + name + '. All that for ' + name + '.', ({ name }) => 'It’s ' + name + '. Took you long enough to see it, didn’t it.'],
      puz_streak: ({ n }) => plural(n, 'day') + ' straight. Shame your to-do list never gets that kind of commitment.' },
    conspiracy: { w_nonogram: 'Hidden Image (Classified)', desc_nonogram: 'A pixel puzzle a day. There’s a picture in there. There always is', w_sudoku: 'The Numbers', desc_sudoku: 'One a day. The numbers fit together. Why do they fit together?',
      puz_solved: [({ time }) => time + '. Faster than they expected. Don’t let them see you smile.', ({ hints }) => hints ? 'Solved, with ' + plural(hints, 'tip-off') + ' from a source. I can’t say who.' : 'Solved. No help. Nobody can say you had inside information.', 'Solved. Every number exactly where it belongs. Like it was planned.'],
      puz_hint: ['A tip-off. You didn’t get it from me.', 'Check that square. Trust me.', 'An anonymous source says: that one.'],
      puz_tomorrow: ['A new one tomorrow. They’re already writing it.', 'That’s today’s. Tomorrow’s is already out there, somewhere.'],
      puz_reveal: [({ name }) => 'It’s ' + name + '. Hidden in plain sight the whole time.', ({ name }) => 'It was ' + name + ' all along. I had a feeling.'],
      puz_streak: ({ n }) => plural(n, 'day') + ' in a row. A pattern. I’m writing it down.' },
  };
  for (const [k, l] of Object.entries(LINES)) Object.assign(V[k], l);

  const P = Z.P;
  const today = () => Z.dayKey();
  const doneToday = (kind) => ((P().done || {})[kind]) === today();
  const who = () => { const k = SP.voice.key(); return k === 'neutral' ? '' : V[k].name; };

  /* The puzzle you're on: today's, unless today's is done and you've moved on to practice ones. */
  function cur(kind, make) {
    const p = P(); let st = p[kind];
    if (!st || (st.seed !== today() && !doneToday(kind))) { st = p[kind] = make(today(), true); save(); }
    if (typeof st.aside === 'string') { // saved as words by the first version; rebuild it so it follows the voice
      st.aside = null;
      if (st.done) aside(st, (kind === 'nonogram' ? [['puz_reveal', { name: Z.nonogram(st.seed).name }]] : []).concat([['puz_solved', { time: Z.fmtTime(st.ms || 0), hints: st.hints || 0 }]], st.daily ? [['puz_tomorrow']] : []));
      save();
    }
    return st;
  }
  /* Something happened worth a voice: shown under the board, kept until the next thing.
     Stored as which lines to say (key, context, a pick), not the words, so switching voices re-voices it. */
  const aside = (st, parts) => { st.aside = parts.map(([k, c]) => [k, c || {}, Math.floor(Math.random() * 1e6)]); };
  function say([key, ctx, pick]) {
    let val = V[SP.voice.key()] && V[SP.voice.key()][key] !== undefined ? V[SP.voice.key()][key] : V.neutral[key];
    for (let d = 0; d < 4; d++) { if (typeof val === 'function') val = val(ctx); else if (Array.isArray(val)) val = val[(pick + d * 7) % val.length]; else break; }
    return SP.voice.resolve(val, key, ctx); // the swearing mask and Friday nights still apply
  }
  const asideHtml = (st, fallback) => Array.isArray(st.aside) && st.aside.length
    ? '<p class="puz-aside" aria-live="polite">' + (who() ? '<b>' + esc(who()) + ':</b> ' : '') + esc(st.aside.map(say).join(' ')) + '</p>'
    : fallback || '';
  // Solving is the same for both: the time, the voice, the streak, the points, the badges.
  function finish(kind, st, extra) {
    st.done = true; st.ms = Date.now() - (st.start || Date.now());
    const ctx = { time: Z.fmtTime(st.ms), hints: st.hints || 0 };
    const msg = (extra ? [extra] : []).concat([['puz_solved', ctx]]);
    if (st.daily) {
      const d = P().done || (P().done = {}); d[kind] = st.seed;
      const n = Z.solvedToday(kind);
      if (n >= 2) msg.push(['puz_streak', { n }]);
      msg.push(['puz_tomorrow']);
      if (SP.achieve) setTimeout(() => SP.achieve.check(), 800);
    }
    aside(st, msg);
    SP.sound.play('win');
    SP.store.save(); // not quiet: a solve is worth syncing
    if (SP.levels) setTimeout(() => SP.levels.check(), 1600);
  }
  const big = { el: null, kind: '' };
  /* Re-render every board of this kind that's on screen (the card and, if open, the big one), keeping focus. */
  function paint(kind, focusI) {
    const a = document.activeElement, fi = focusI != null ? focusI : a && a.closest && a.closest('[data-puz="' + kind + '"]') ? a.dataset.i : null;
    document.querySelectorAll('[data-puz="' + kind + '"]').forEach((el) => { el.innerHTML = BODY[kind](el.dataset.big === '1'); MOUNT[kind](el); });
    if (fi != null) { const root = big.el && big.kind === kind ? big.el : document; const c = root.querySelector('[data-puz="' + kind + '"] [data-i="' + fi + '"]'); if (c) c.focus(); }
  }
  const tools = (kind, st, isBig) => (isBig ? '' : '<button class="icon-btn" data-puz-big title="Bigger board" aria-label="Open a bigger board">' + I('resize', 16) + '</button>') +
    (st.done ? '<button class="btn small" data-puz-new>' + I('shuffle', 14) + ' Another one</button>' : '<button class="btn small" data-puz-hint>' + I('sparkles', 14) + ' Hint</button>');
  const status = (kind, st, label) => {
    const n = Z.streak(kind);
    return '<span class="puz-tag">' + esc(st.daily ? label : 'Practice') + (n ? ' · ' + I('flame', 12) + ' ' + n : '') + '</span>';
  };
  function mountCommon(kind, el, newOne) {
    const b = el.querySelector('[data-puz-big]'); if (b) b.onclick = () => openBig(kind);
    const nw = el.querySelector('[data-puz-new]'); if (nw) nw.onclick = () => { newOne(); paint(kind); };
  }

  /* ================= Nonogram ================= */
  const NONO = {};
  const nonoPuzzle = (st) => NONO[st.seed] || (NONO[st.seed] = Z.nonogram(st.seed));
  function nonoNew(seed, daily) {
    const pz = Z.nonogram(seed), cells = new Array(pz.W * pz.H).fill(0);
    for (const [i, v] of Object.entries(pz.givens)) cells[i] = v ? 1 : 2;
    NONO[seed] = pz;
    return { seed, daily: !!daily, cells: cells.join(''), locked: Object.keys(pz.givens).map(Number), hints: 0, start: 0, done: false, mode: 'fill' };
  }
  const nono = () => cur('nonogram', nonoNew);
  const cellsOf = (st) => st.cells.split('').map(Number);
  const nonoLabel = (v) => (v === 1 ? 'filled' : v === 2 ? 'crossed out' : 'empty');
  const sameClue = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
  function lineOk(pz, cells, kind, k) {
    const l = []; if (kind === 'r') for (let x = 0; x < pz.W; x++) l.push(cells[k * pz.W + x] === 1 ? 1 : 0); else for (let y = 0; y < pz.H; y++) l.push(cells[y * pz.W + k] === 1 ? 1 : 0);
    return sameClue(Z.clue(l), kind === 'r' ? pz.rows[k] : pz.cols[k]);
  }
  const nonoSolved = (pz, cells) => cells.every((v, i) => (v === 1) === (pz.sol[i] === 1));

  function nonoBody(isBig) {
    const st = nono(), pz = nonoPuzzle(st), cells = cellsOf(st), lock = new Set(st.locked || []);
    let g = '<div class="nono-grid' + (st.done ? ' solved' : '') + (still() ? ' still' : '') + '" role="grid" aria-label="Nonogram, ' + pz.W + ' by ' + pz.H + '" style="--w:' + pz.W + ';--h:' + pz.H + '"><span class="nono-corner"></span>';
    pz.cols.forEach((c, x) => (g += '<span class="ncl' + (lineOk(pz, cells, 'c', x) ? ' ok' : '') + (x % 5 === 4 ? ' b5' : '') + '" data-cc="' + x + '">' + (c.length ? c : [0]).map((n) => '<b>' + n + '</b>').join('') + '</span>'));
    for (let y = 0; y < pz.H; y++) {
      g += '<span class="nrl' + (lineOk(pz, cells, 'r', y) ? ' ok' : '') + '" data-rc="' + y + '">' + (pz.rows[y].length ? pz.rows[y] : [0]).map((n) => '<b>' + n + '</b>').join('') + '</span>';
      for (let x = 0; x < pz.W; x++) {
        const i = y * pz.W + x, v = cells[i];
        g += '<button class="nc v' + v + (lock.has(i) ? ' lock' : '') + (x % 5 === 4 && x < pz.W - 1 ? ' b5r' : '') + (y % 5 === 4 && y < pz.H - 1 ? ' b5b' : '') + '" data-i="' + i + '" role="gridcell" tabindex="' + (i === (st.focus || 0) ? 0 : -1) + '"' +
          (st.done && pz.sol[i] ? ' style="--col:' + pz.colors[i] + ';--d:' + (x + y) * 28 + 'ms"' : '') + ' aria-label="Row ' + (y + 1) + ', column ' + (x + 1) + ', ' + nonoLabel(v) + '"></button>';
      }
    }
    g += '</div>';
    const bar = '<div class="puz-bar">' + status('nonogram', st, 'Today') +
      (st.done ? '' : '<div class="seg small" role="radiogroup" aria-label="What a tap does"><button role="radio" aria-checked="' + (st.mode !== 'cross') + '" data-nono-mode="fill">Fill</button><button role="radio" aria-checked="' + (st.mode === 'cross') + '" data-nono-mode="cross">' + I('x', 12) + ' Cross</button></div>') +
      '<span class="puz-tools">' + tools('nonogram', st, isBig) + '</span></div>';
    const gal = galleryHtml(isBig);
    return g + bar + asideHtml(st, '<p class="puz-aside muted small">' + (st.done ? '' : 'Numbers say how many filled squares are in a row, in order, with gaps between. Right-click (or Cross) marks a square as empty.') + '</p>') + gal;
  }
  // The pictures you've uncovered so far.
  function galleryHtml() {
    const got = P().gallery || []; if (!got.length) return '';
    const svg = (a) => { let r = ''; a.rows.forEach((row, y) => [...row].forEach((ch, x) => { if (ch !== '.') r += '<rect x="' + x + '" y="' + y + '" width="1" height="1" fill="' + Z.COLORS[ch] + '"/>'; })); return '<svg viewBox="0 0 10 10" width="30" height="30" role="img" aria-label="' + esc(a.name) + '"><title>' + esc(a.name) + '</title>' + r + '</svg>'; };
    return '<details class="puz-gal"><summary class="small muted">Gallery · ' + got.length + ' of ' + Z.ART.length + ' pictures</summary><div>' + Z.ART.filter((a) => got.includes(a.id)).map(svg).join('') + '</div></details>';
  }
  function nonoMount(el) {
    const st = nono(), pz = nonoPuzzle(st), grid = el.querySelector('.nono-grid'), lock = new Set(st.locked || []);
    mountCommon('nonogram', el, () => { P().nonogram = nonoNew('p' + Date.now().toString(36), false); save(); });
    el.querySelectorAll('[data-nono-mode]').forEach((b) => (b.onclick = () => { st.mode = b.dataset.nonoMode; save(); paint('nonogram'); }));
    const h = el.querySelector('[data-puz-hint]'); if (h) h.onclick = () => nonoHint();
    if (st.done || !grid) return;
    let cells = cellsOf(st), drag = null;
    const set = (i, v) => {
      if (lock.has(i) || cells[i] === v) return;
      cells[i] = v;
      const y = Math.floor(i / pz.W), x = i % pz.W;
      document.querySelectorAll('[data-puz="nonogram"]').forEach((b) => {
        const c = b.querySelector('[data-i="' + i + '"]'); if (c) { c.classList.remove('v0', 'v1', 'v2'); c.classList.add('v' + v); c.setAttribute('aria-label', 'Row ' + (y + 1) + ', column ' + (x + 1) + ', ' + nonoLabel(v)); }
        const rc = b.querySelector('[data-rc="' + y + '"]'), cc = b.querySelector('[data-cc="' + x + '"]');
        if (rc) rc.classList.toggle('ok', lineOk(pz, cells, 'r', y)); if (cc) cc.classList.toggle('ok', lineOk(pz, cells, 'c', x));
      });
      if (v === 1) SP.sound.play('pop');
    };
    const commit = () => {
      if (!st.start) st.start = Date.now();
      st.cells = cells.join('');
      if (nonoSolved(pz, cells)) nonoFinish(); else save();
    };
    grid.addEventListener('contextmenu', (e) => e.preventDefault());
    grid.addEventListener('pointerdown', (e) => {
      const c = e.target.closest('.nc'); if (!c) return;
      e.preventDefault(); c.focus();
      const i = +c.dataset.i, want = e.button === 2 || st.mode === 'cross' ? 2 : 1;
      if (lock.has(i)) return;
      drag = { from: cells[i], to: cells[i] === want ? 0 : want };
      set(i, drag.to);
      try { grid.setPointerCapture(e.pointerId); } catch (err) { /* fine */ }
    });
    grid.addEventListener('pointermove', (e) => {
      if (!drag) return;
      const hit = document.elementFromPoint(e.clientX, e.clientY), c = hit && hit.closest && hit.closest('.nc');
      if (!c || !grid.contains(c)) return;
      const i = +c.dataset.i;
      if (cells[i] === drag.from) set(i, drag.to); // painting only changes squares like the one you started on
    });
    const up = () => { if (!drag) return; drag = null; commit(); };
    grid.addEventListener('pointerup', up); grid.addEventListener('pointercancel', up); grid.addEventListener('lostpointercapture', up);
    grid.addEventListener('keydown', (e) => {
      const c = e.target.closest('.nc'); if (!c) return;
      const i = +c.dataset.i, x = i % pz.W, y = Math.floor(i / pz.W);
      const mv = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
      if (mv) {
        e.preventDefault();
        const nx = Math.min(pz.W - 1, Math.max(0, x + mv[0])), ny = Math.min(pz.H - 1, Math.max(0, y + mv[1])), n = grid.querySelector('[data-i="' + (ny * pz.W + nx) + '"]');
        c.tabIndex = -1; n.tabIndex = 0; n.focus(); st.focus = ny * pz.W + nx;
        return;
      }
      const want = e.key === ' ' || e.key === 'Enter' ? (st.mode === 'cross' ? 2 : 1) : e.key === 'x' || e.key === 'X' ? 2 : e.key === 'Backspace' || e.key === 'Delete' ? 0 : -1;
      if (want < 0) return;
      e.preventDefault();
      set(i, want && cells[i] === want ? 0 : want); commit();
    });
  }
  function nonoHint() {
    const st = nono(), pz = nonoPuzzle(st), cells = cellsOf(st), lock = new Set(st.locked || []);
    if (st.done) return;
    // A mistake first, if there is one; otherwise a square that should be filled.
    const wrong = [], missing = [];
    cells.forEach((v, i) => { if (lock.has(i)) return; if ((v === 1 && !pz.sol[i]) || (v === 2 && pz.sol[i])) wrong.push(i); else if (v !== 1 && pz.sol[i]) missing.push(i); });
    const pool = wrong.length ? wrong : missing; if (!pool.length) return;
    const i = pool[Math.floor(Math.random() * pool.length)];
    cells[i] = pz.sol[i] ? 1 : 2; st.cells = cells.join(''); (st.locked = st.locked || []).push(i); st.hints = (st.hints || 0) + 1; st.focus = i;
    if (!st.start) st.start = Date.now();
    aside(st, [['puz_hint', { hints: st.hints }]]);
    SP.sound.play('reveal');
    if (nonoSolved(pz, cells)) nonoFinish(); else { save(); paint('nonogram'); }
  }
  function nonoFinish() {
    const st = nono(), pz = nonoPuzzle(st);
    // Fill in the crosses you didn't bother with, and keep the picture.
    st.cells = pz.sol.map((v) => (v ? 1 : 2)).join('');
    if (pz.id !== 'gen') { const g = P().gallery || (P().gallery = []); if (!g.includes(pz.id)) g.push(pz.id); }
    finish('nonogram', st, ['puz_reveal', { name: pz.name }]);
    paint('nonogram');
  }

  /* ================= Sudoku ================= */
  function sudNew(seed, daily) {
    const s = Z.sudoku(seed);
    return { seed, daily: !!daily, puzzle: s.puzzle, solution: s.solution, level: s.level, cells: '0'.repeat(81), notes: new Array(81).fill(0), hinted: [], hints: 0, start: 0, done: false, sel: s.puzzle.indexOf('0'), noteMode: false };
  }
  const sud = () => cur('sudoku', sudNew);
  const val = (st, i) => +(st.puzzle[i] !== '0' ? st.puzzle[i] : st.cells[i]);
  const fixed = (st, i) => st.puzzle[i] !== '0' || (st.hinted || []).includes(i);
  function conflicts(st) {
    const bad = new Set();
    for (let i = 0; i < 81; i++) { const v = val(st, i); if (!v || fixed(st, i)) continue; for (const p of Z.PEERS[i]) if (val(st, p) === v) { bad.add(i); break; } }
    return bad;
  }
  function sudBody(isBig) {
    const st = sud(), sel = st.done ? -1 : st.sel, sv = sel >= 0 ? val(st, sel) : 0, bad = conflicts(st);
    const rel = new Set(sel >= 0 ? Z.PEERS[sel] : []), count = new Array(10).fill(0);
    for (let i = 0; i < 81; i++) count[val(st, i)]++;
    let g = '<div class="sud-grid' + (st.done ? ' solved' : '') + (still() ? ' still' : '') + '" role="grid" aria-label="Sudoku">';
    for (let i = 0; i < 81; i++) {
      const v = val(st, i), r = Math.floor(i / 9), c = i % 9, n = st.notes[i] || 0;
      const cls = 'sc' + (st.puzzle[i] !== '0' ? ' given' : (st.hinted || []).includes(i) ? ' hinted' : v ? ' mine' : '') + (i === sel ? ' sel' : rel.has(i) ? ' rel' : '') + (v && v === sv && i !== sel ? ' same' : '') + (bad.has(i) ? ' bad' : '') +
        (c % 3 === 2 && c < 8 ? ' b3r' : '') + (r % 3 === 2 && r < 8 ? ' b3b' : '');
      g += '<button class="' + cls + '" data-i="' + i + '" role="gridcell" tabindex="' + (i === sel || (sel < 0 && !i) ? 0 : -1) + '" style="--d:' + (r + c) * 30 + 'ms" aria-label="Row ' + (r + 1) + ', column ' + (c + 1) + ', ' + (v ? v : n ? 'notes ' + [1, 2, 3, 4, 5, 6, 7, 8, 9].filter((d) => n & (1 << d)).join(' ') : 'empty') + (bad.has(i) ? ', clashes' : '') + '">' +
        (v ? v : n ? '<span class="sn">' + [1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => '<i>' + (n & (1 << d) ? d : '') + '</i>').join('') + '</span>' : '') + '</button>';
    }
    g += '</div>';
    const pad = st.done ? '' : '<div class="sud-pad" role="group" aria-label="Numbers">' + [1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => '<button data-d="' + d + '"' + (count[d] >= 9 ? ' class="full"' : '') + ' aria-label="' + d + '">' + d + '</button>').join('') +
      '<button data-d="0" aria-label="Erase" title="Erase">' + I('x', 15) + '</button><button data-notes aria-pressed="' + !!st.noteMode + '" title="Notes: pencil in the numbers it might be (N)" aria-label="Notes">' + I('edit', 15) + '</button></div>';
    const bar = '<div class="puz-bar">' + status('sudoku', st, st.level) + '<span class="puz-tools">' + tools('sudoku', st, isBig) + '</span></div>';
    return g + pad + bar + asideHtml(st);
  }
  function sudPut(d) {
    const st = sud(), i = st.sel; if (st.done || i < 0 || fixed(st, i)) return;
    if (!st.start) st.start = Date.now();
    const cells = st.cells.split('');
    if (st.noteMode && d && cells[i] === '0') st.notes[i] = (st.notes[i] || 0) ^ (1 << d);
    else {
      cells[i] = d && cells[i] !== String(d) ? String(d) : '0'; st.notes[i] = 0;
      if (cells[i] !== '0') for (const p of Z.PEERS[i]) st.notes[p] = (st.notes[p] || 0) & ~(1 << d); // pencil marks it rules out
      st.cells = cells.join('');
      if (d) SP.sound.play('pop');
    }
    if ([...Array(81).keys()].every((k) => String(val(st, k)) === st.solution[k])) finish('sudoku', st); else save();
    paint('sudoku');
  }
  function sudHint() {
    const st = sud(); if (st.done) return;
    const want = (i) => !fixed(st, i) && String(val(st, i)) !== st.solution[i];
    let i = st.sel >= 0 && want(st.sel) ? st.sel : -1;
    if (i < 0) { const open = [...Array(81).keys()].filter(want); i = open[Math.floor(Math.random() * open.length)]; }
    if (i == null || i < 0) return;
    const cells = st.cells.split(''); cells[i] = st.solution[i]; st.cells = cells.join(''); st.notes[i] = 0;
    (st.hinted = st.hinted || []).push(i); st.hints = (st.hints || 0) + 1; st.sel = i;
    if (!st.start) st.start = Date.now();
    aside(st, [['puz_hint', { hints: st.hints }]]);
    SP.sound.play('reveal');
    if ([...Array(81).keys()].every((k) => String(val(st, k)) === st.solution[k])) finish('sudoku', st); else save();
    paint('sudoku');
  }
  function sudMount(el) {
    const st = sud();
    mountCommon('sudoku', el, () => { P().sudoku = sudNew('p' + Date.now().toString(36), false); save(); });
    const h = el.querySelector('[data-puz-hint]'); if (h) h.onclick = sudHint;
    if (st.done) return;
    const grid = el.querySelector('.sud-grid');
    grid.addEventListener('click', (e) => { const c = e.target.closest('.sc'); if (!c) return; st.sel = +c.dataset.i; save(); paint('sudoku'); });
    grid.addEventListener('keydown', (e) => {
      const c = e.target.closest('.sc'); if (!c) return;
      const i = +c.dataset.i, mv = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -9, ArrowDown: 9 }[e.key];
      if (mv) { e.preventDefault(); const r = Math.floor(i / 9), col = i % 9; const ni = mv === -1 ? r * 9 + Math.max(0, col - 1) : mv === 1 ? r * 9 + Math.min(8, col + 1) : Math.min(80, Math.max(0, i + mv)); st.sel = ni; paint('sudoku', ni); return; }
      st.sel = i;
      if (/^[1-9]$/.test(e.key)) { e.preventDefault(); sudPut(+e.key); }
      else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') { e.preventDefault(); sudPut(0); }
      else if (e.key === 'n' || e.key === 'N') { e.preventDefault(); st.noteMode = !st.noteMode; save(); paint('sudoku'); }
    });
    el.querySelectorAll('[data-d]').forEach((b) => (b.onclick = () => { sudPut(+b.dataset.d); const c = document.querySelector('[data-puz="sudoku"]' + (big.el ? '[data-big="1"]' : '') + ' [data-i="' + sud().sel + '"]'); if (c) c.focus(); }));
    const nb = el.querySelector('[data-notes]'); if (nb) nb.onclick = () => { st.noteMode = !st.noteMode; save(); paint('sudoku'); };
  }

  const BODY = { nonogram: nonoBody, sudoku: sudBody };
  const MOUNT = { nonogram: nonoMount, sudoku: sudMount };

  /* The bigger board: the same puzzle, in an overlay, sized for the screen. */
  function openBig(kind) {
    if (big.el) big.el.remove();
    const root = document.createElement('div'); root.className = 'puz-overlay'; root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); root.setAttribute('aria-label', t('w_' + kind));
    root.innerHTML = '<div class="puz-big"><header><h3>' + esc(t('w_' + kind)) + '</h3><button class="icon-btn" data-puz-close aria-label="Close">' + I('x', 18) + '</button></header><div class="puz ' + kind + '" data-puz="' + kind + '" data-big="1"></div></div>';
    document.body.appendChild(root); big.el = root; big.kind = kind;
    const close = () => { root.remove(); big.el = null; document.removeEventListener('keydown', onKey, true); paint(kind); const b = document.querySelector('.card[data-w="' + kind + '"] [data-puz-big]'); if (b) b.focus(); };
    const onKey = (e) => { if (e.key === 'Escape') { e.stopPropagation(); close(); } };
    document.addEventListener('keydown', onKey, true);
    root.onclick = (e) => { if (e.target === root) close(); };
    root.querySelector('[data-puz-close]').onclick = close;
    paint(kind);
    const f = root.querySelector('[data-i][tabindex="0"]') || root.querySelector('[data-puz-close]'); f.focus();
  }

  for (const kind of ['nonogram', 'sudoku']) {
    SP.widgets[kind] = {
      title: kind === 'nonogram' ? 'Nonogram' : 'Sudoku', icon: kind,
      render() { return SP.widgetHead(kind, t('w_' + kind)) + '<div class="puz ' + kind + '" data-puz="' + kind + '">' + BODY[kind](false) + '</div>'; },
      mount(el) { const b = el.querySelector('[data-puz]'); if (b) MOUNT[kind](b); },
    };
    SP.widgetMeta[kind] = { title: kind === 'nonogram' ? 'Daily nonogram' : 'Daily sudoku', icon: kind };
    SP.widgetOrder.push(kind);
  }

  if (SP.achieve) SP.achieve.LIST.push(
    { id: 'puzzle', icon: 'nonogram', name: 'Puzzled', desc: 'Solve a daily puzzle', test: (tt) => (tt.puzzles || 0) >= 1 },
    { id: 'puzzle30', icon: 'sudoku', name: 'Daily puzzler', desc: 'Solve 30 daily puzzles', test: (tt) => (tt.puzzles || 0) >= 30, progress: (tt) => [tt.puzzles || 0, 30] },
  );

  SP.puzzlecards = { openBig, paint, nono, sud, nonoHint, sudHint, sudPut, conflicts };
})(window.SP = window.SP || {});
