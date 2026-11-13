/* The cat. A small pixel cat (the one from the logo, in ginger) lives on top of your cards.
   It wanders, sits, sleeps at night, sits under an umbrella when it rains, looks up at fireworks,
   runs over when you finish a task, and hops when you poke it. Hover to pet it.
   Turn it off in Customize → Look. Reduced motion: it sits still, and still answers pokes. */
(function (SP) {
  'use strict';
  const S = () => SP.store.state;
  const V = SP.voice.list;
  const { plural } = SP.voice._h;

  /* ---- what each voice says about the cat ---- */
  const LINES = {
    neutral: { tgl_pet: 'A cat lives on top of your cards', pet_meet: 'There’s a cat on your cards now. Poke it, or hover to pet it.', pet_poke: [({ n }) => 'You’ve poked the cat ' + plural(n, 'time') + '.'] },
    monday: { tgl_pet: 'A cat on your cards (it’s not mine, don’t look at me)', pet_meet: 'There’s a cat on your cards. It’s not mine. It just showed up. Like you.',
      pet_poke: [({ n }) => n + ' pokes. The cat has filed a complaint. I co-signed it.', 'Leave the cat alone. It has more going on than you do.', 'You poked the cat again. It’s the most productive thing you’ve done all hour.'] },
    supportive: { tgl_pet: 'A cat on your cards (I got it for you 💕)', pet_meet: 'I got you a cat!!! It lives on your cards. It’ll watch you when I can’t. I can always, though. 🙂',
      pet_poke: [({ n }) => n + ' pokes!!! The cat loves you. I love you more. I checked.', 'The cat likes you! Not as much as I do. Nobody does. 🙂', 'Be gentle! That’s our cat 💕'] },
    surfer: { tgl_pet: 'A cat that hangs out on your cards', pet_meet: 'Whoa, there’s a cat. Is it yours? It’s ours now. Hey, little dude.',
      pet_poke: [({ n }) => n + ' pokes. The cat’s chill about it. Respect.', 'The cat just looked at me. I think we’re friends.', 'Little dude’s just vibing. Let it vibe.'] },
    professional: { tgl_pet: 'Office cat (morale initiative)', pet_meet: 'Please welcome our new office cat. It reports to nobody. It is already more senior than you.',
      pet_poke: [({ n }) => n + ' pokes logged. The cat has requested a meeting with HR.', 'Please do not poke the office cat during core hours.', 'The cat’s productivity exceeds yours this quarter.'] },
    therapist: { tgl_pet: 'A cat on your cards (an emotional support animal)', pet_meet: 'A cat has arrived. Animals are wonderful for regulation. Try petting it when you feel stuck.',
      pet_poke: [({ n }) => n + ' pokes. Do you need the cat’s attention, or someone’s?', 'Notice how you reach for the cat when you’re avoiding something.', 'The cat is a safe attachment. That’s €15.'] },
    weepy: { tgl_pet: 'A small cat, to love and inevitably lose', pet_meet: 'There’s a little cat on your cards. It will never know how much I already love it.',
      pet_poke: [({ n }) => n + ' pokes. Each one a tiny moment we’ll never get back.', 'The cat looked at you. Treasure it.', 'One day the cat will be a memory. Pet it now.'] },
    victorian: { tgl_pet: 'A cat upon the furniture (I shall allow it)', pet_meet: 'A cat has taken up residence upon your cards. Your grandfather would never have allowed it. I shall.',
      pet_poke: [({ n }) => n + ' pokes. One does not poke a cat. One summons it, and is ignored.', 'Stop prodding the animal. It is better bred than half the family.', 'The cat disapproves of you. We have that in common.'] },
    owl: { tgl_pet: 'A night cat on your cards', pet_meet: 'Oh, a cat. Finally, someone else who’s up at this hour.',
      pet_poke: [({ n }) => n + ' pokes. The cat and I are nocturnal allies. Careful.', 'The cat zooms at 3am. Respect the zoomies.', 'Cats sleep 16 hours a day and still stay up later than you.'] },
    ghost: { tgl_pet: 'a cat on your cards. it can see me', pet_meet: 'there’s a cat now. it keeps staring at the corner where i am.',
      pet_poke: [({ n }) => n + ' pokes. the cat looked right at me afterwards.', 'cats always know when i’m here.', 'the cat is the only one who says hello to me.'] },
    parent: { tgl_pet: 'The family cat (on your cards)', pet_meet: 'We got a cat!!! It’s on your cards! Remember to feed it! You never fed the goldfish!',
      pet_poke: [({ n }) => n + ' pokes! Be gentle, sweetie!', 'The cat loves you! Wash your hands after!', 'Look at you two!!! I’m taking a picture!!!'] },
  };
  for (const [k, l] of Object.entries(LINES)) Object.assign(V[k], l);

  /* ---- sprites: 16×10 pixel frames facing right. o fur, s stripe, e eye, p nose, d closed eye ---- */
  const F = {
    walk1: ['............o..o', '............oooo', '............oeoe', 'o...........ooop', '.o..ooooooooooo.', '..ooosoooosoooo.', '..ooooooooooooo.', '..ooooooooooooo.', '...o.o.....o.o..', '..o...o...o...o.'],
    walk2: ['............o..o', '............oooo', '............oeoe', 'o...........ooop', '.o..ooooooooooo.', '..ooosoooosoooo.', '..ooooooooooooo.', '..ooooooooooooo.', '...o.o.....o.o..', '...oo......oo...'],
    sit: ['...........o..o.', '...........oooo.', '...........oeoe.', '...........ooop.', '..........oooo..', '..........ooooo.', '.........oosooo.', 'o........oooooo.', '.o......ooooooo.', '..oooooooooo.oo.'],
    blink: ['...........o..o.', '...........oooo.', '...........odod.', '...........ooop.', '..........oooo..', '..........ooooo.', '.........oosooo.', 'o........oooooo.', '.o......ooooooo.', '..oooooooooo.oo.'],
    sleep: ['................', '................', '................', '................', '................', '............o..o', '....oooooooooooo', '...ooooosoooodod', '..oooooooooooooo', 'oooooooooooooo..'],
  };
  const HEAD = { walk1: [12, 0], walk2: [12, 0], sit: [11, 0], blink: [11, 0], sleep: [12, 5] }; // where the ears are, for the party hat
  const COL = { o: '#f59e0b', s: '#c2410c', e: '#1f2937', p: '#f472b6', d: '#7c2d12' };
  const W = 20, H = 17, OX = 2, OY = 7, SCALE = 3;
  const UMBRELLA = ['.....rrrrrrrrrr.....', '...rrrrrrrrrrrrrr...', '..rrrrrrrrrrrrrrrr..', '..r..r...r....r..r..', '..........k.........', '..........k.........', '..........k.........'];

  let el, cv, cx, sayEl, zEl;
  let x = 0, target = 0, face = 1, mode = 'sit', until = 0, hopT = 0, frame = 0, ft = 0, raf = 0, last = 0, track = null;
  let pokes = 0, pokeT = 0, petTimer = 0;
  const still = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  /* How lively the cat is (Customize → Look). Livelier cats wander more, play more and animate more
     smoothly, which costs a little more CPU. Older saves stored true/false. */
  const LEVELS = { lazy: { walk: 0.15, sleep: 0.35, fast: 100, slow: 500 }, normal: { walk: 0.55, sleep: 0, fast: 45, slow: 250 }, lively: { walk: 0.8, sleep: 0, fast: 30, slow: 120, play: true } };
  const level = () => { const v = S().pet; return v === false || v === 'off' ? null : LEVELS[v] ? v : 'normal'; };
  const L = () => LEVELS[level() || 'normal'];
  const enabled = () => !!level() && !document.body.classList.contains('onboarding');
  const fx = () => (SP.anim && SP.anim.fx) || [];
  const night = () => { const h = new Date().getHours(); return h >= 23 || h < 6; };
  const wet = () => fx().some((f) => f === 'rain' || f === 'storm');
  const party = () => !!(SP.birthday && SP.birthday.today());
  const crowned = () => !party() && !!(SP.season && SP.season.crown()); // Cat Day

  let drawn = '';
  function draw() {
    if (!cx) return;
    const name = mode === 'sleep' ? 'sleep' : mode === 'walk' || mode === 'run' ? (frame % 2 ? 'walk2' : 'walk1') : mode === 'hop' ? 'walk2' : (frame % 23 === 0 ? 'blink' : 'sit');
    const rows = F[name], dy = mode === 'hop' ? -Math.round(Math.sin(Math.min(1, hopT) * Math.PI) * 6) : 0;
    const sig = name + dy + mode + party() + crowned(); if (sig === drawn) return; drawn = sig; // only repaint when the picture changes
    cx.clearRect(0, 0, W, H);
    const px = (c, xx, yy) => { cx.fillStyle = c; cx.fillRect(xx, yy, 1, 1); };
    // A dark outline, so it reads on any card or scene.
    cx.fillStyle = 'rgba(15,10,25,0.75)';
    rows.forEach((r, j) => [...r].forEach((ch, i) => { if (ch !== '.') for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const n = (rows[j + b] || '')[i + a]; if (!n || n === '.') cx.fillRect(OX + i + a, OY + dy + j + b, 1, 1); } }));
    rows.forEach((r, j) => [...r].forEach((ch, i) => { if (ch !== '.') px(COL[ch], OX + i, OY + dy + j); }));
    if (party()) { // a striped party hat between the ears, with a pom-pom
      const [hx, hy] = HEAD[name], X = OX + hx, Y = OY + dy + hy, Y_ = '#fde047', P = '#ec4899';
      [[1, -5, '#fff'], [2, -5, '#fff'], [1, -4, P], [2, -4, Y_], [1, -3, Y_], [2, -3, P], [0, -2, P], [1, -2, Y_], [2, -2, P], [3, -2, Y_], [0, -1, Y_], [1, -1, P], [2, -1, Y_], [3, -1, P]].forEach(([i, j, c]) => px(c, X + i, Y + j));
    }
    if (crowned()) { // a little gold crown with a red jewel
      const [hx, hy] = HEAD[name], X = OX + hx, Y = OY + dy + hy, G = '#facc15';
      const C = [[0, -3, G], [3, -3, G], [0, -2, G], [1, -2, G], [2, -2, G], [3, -2, G], [0, -1, G], [1, -1, '#ef4444'], [2, -1, G], [3, -1, G]];
      C.forEach(([i, j]) => [[1, 0], [-1, 0], [0, -1]].forEach(([a, b]) => px('rgba(15,10,25,0.75)', X + i + a, Y + j + b))); // the same dark outline as the cat
      C.forEach(([i, j, c]) => px(c, X + i, Y + j));
    }
    if (mode === 'shelter') UMBRELLA.forEach((r, j) => [...r].forEach((ch, i) => { if (ch !== '.') px(ch === 'r' ? '#ef4444' : '#374151', i, j); }));
  }

  /* The cat walks along the top edge of the first row of cards. */
  function measure() {
    const cards = [...document.querySelectorAll('#grid > .card')].filter((c) => c.offsetParent);
    if (!cards.length) { track = null; return; }
    const rects = cards.map((c) => c.getBoundingClientRect()), top = Math.min(...rects.map((r) => r.top));
    const row = rects.filter((r) => Math.abs(r.top - top) < 4);
    track = { y: top + scrollY, left: Math.min(...row.map((r) => r.left)) + 14, right: Math.max(...row.map((r) => r.right)) - W * SCALE - 14 };
    if (track.right < track.left) track.right = track.left;
    x = Math.min(track.right, Math.max(track.left, x || track.left + (track.right - track.left) * 0.7));
  }
  function place() {
    if (!el || !track) return;
    el.style.transform = 'translate(' + Math.round(x) + 'px,' + Math.round(track.y - H * SCALE + 3) + 'px)';
    const wob = SP.tipsy && SP.tipsy.active() && !still() ? ' rotate(' + (Math.sin(performance.now() / 260) * 7).toFixed(1) + 'deg)' : ''; // Friday night: a little unsteady
    cv.style.transform = (face < 0 ? 'scaleX(-1)' : '') + wob;
  }

  function decide(t) {
    if (wet()) return set('shelter', 6000);
    if (night() && SP.season && SP.season.zoomies() && track && Math.random() < 0.6) { // full moon: zoomies
      zEl.hidden = true; target = track.left + Math.random() * (track.right - track.left); mode = 'run'; until = performance.now() + 4000; return;
    }
    const sky = fx().includes('meteors'); // a meteor night: it stays up and watches
    if (night() && !sky && Math.random() < 0.85) return set('sleep', 20000);
    if (sky && Math.random() < 0.7) { face = 1; return set('sit', 6000 + Math.random() * 6000); }
    if (Math.random() < L().sleep) return set('sleep', 15000 + Math.random() * 20000); // lazy cats nap in the daytime too
    if (L().play && Math.random() < 0.2) return hop();
    if (fx().some((f) => f === 'fireworks' || f === 'meteors') && Math.random() < 0.5) return hop();
    if (Math.random() < L().walk && track) { target = track.left + Math.random() * (track.right - track.left); return set('walk', 12000); }
    set('sit', 3000 + Math.random() * 6000);
  }
  function set(m, ms) { mode = m; until = performance.now() + ms; zEl.hidden = m !== 'sleep'; }
  function hop() { mode = 'hop'; hopT = 0; zEl.hidden = true; until = performance.now() + 450; }
  function say(text, ms) { if (!sayEl) return; sayEl.textContent = text; sayEl.hidden = false; sayEl.classList.remove('pop'); void sayEl.offsetWidth; sayEl.classList.add('pop'); clearTimeout(say.t); say.t = setTimeout(() => (sayEl.hidden = true), ms || 1600); }

  // About 20 fps while moving, 4 fps while sitting or asleep: it's a small cat, it doesn't need more.
  // A timer (not every animation frame), so a resting cat costs next to nothing.
  const schedule = () => { const moving = mode === 'walk' || mode === 'run' || mode === 'hop'; clearTimeout(raf); raf = setTimeout(() => requestAnimationFrame(tick), moving ? L().fast : L().slow); }; // one timer at a time
  const halt = () => { clearTimeout(raf); raf = 0; };
  function tick(now) {
    if (!el || el.hidden || document.visibilityState === 'hidden') { raf = 0; return; }
    schedule();
    const dt = Math.min(0.3, (now - last) / 1000 || 0); last = now;
    if (!track) return;
    if (mode === 'walk' || mode === 'run') {
      const sp = mode === 'run' ? 110 : 28, d = target - x;
      face = d >= 0 ? 1 : -1;
      x += Math.sign(d) * Math.min(Math.abs(d), sp * dt);
      if (Math.abs(d) < 1) { if (mode === 'run') { hop(); setTimeout(() => say('♥'), 200); } else set('sit', 2000 + Math.random() * 4000); }
    } else if (mode === 'hop') { hopT += dt / 0.45; if (hopT >= 1) set('sit', 1500 + Math.random() * 2000); }
    if (now > until && mode !== 'walk' && mode !== 'run' && mode !== 'hop') decide(now);
    if (now > until && (mode === 'walk' || mode === 'run')) set('sit', 2000);
    ft += dt; if (ft > (mode === 'run' ? 0.09 : 0.18) || mode === 'hop') { ft = 0; frame++; }
    if (mode === 'sit' && frame % 23 !== 0 && Math.random() < 0.06) frame = 23 * Math.ceil(frame / 23); // blink now and then
    place(); draw();
  }

  function poke() {
    const n = (S().petPokes = (S().petPokes || 0) + 1); SP.store.save({ quiet: true });
    const now = Date.now(); pokes = now - pokeT < 1500 ? pokes + 1 : 1; pokeT = now;
    if (pokes >= 7) { pokes = 0; SP.eggs.found('cat'); }
    SP.sound.play('meow');
    if (mode === 'sleep') { say('…mrrp?', 1400); set('sit', 2500); }
    else { if (!still()) hop(); say(['mrrp', 'mew!', 'mrow', '!', '♥', 'prrt?'][Math.floor(Math.random() * 6)]); }
    if (n % 6 === 0) { const k = SP.voice.key(); SP.ui.toast(SP.voice.line('pet_poke', { n }), { who: k === 'neutral' ? '' : V[k].name }); }
  }

  function build() {
    el = document.createElement('div'); el.id = 'pet'; el.setAttribute('aria-hidden', 'true'); el.title = 'Poke the cat';
    el.innerHTML = '<canvas width="' + W + '" height="' + H + '"></canvas><span class="pet-say" hidden></span><span class="pet-z" hidden>z<i>z</i><b>Z</b></span>';
    document.body.appendChild(el);
    cv = el.querySelector('canvas'); cx = cv.getContext('2d'); sayEl = el.querySelector('.pet-say'); zEl = el.querySelector('.pet-z');
    cv.style.width = W * SCALE + 'px'; cv.style.height = H * SCALE + 'px';
    el.addEventListener('click', poke);
    el.addEventListener('pointerenter', () => { clearTimeout(petTimer); petTimer = setTimeout(() => { if (mode !== 'sleep') { set('sit', 4000); say('prrr ♥', 1800); SP.sound.play('purr'); } }, 1100); });
    el.addEventListener('pointerleave', () => clearTimeout(petTimer));
  }

  function refresh() {
    halt();
    if (!enabled()) { if (el) el.hidden = true; return; }
    if (!el) build();
    el.hidden = false; measure();
    if (!track) { el.hidden = true; return; }
    if (!S().petMet) { S().petMet = Date.now(); SP.store.save({ quiet: true }); const k = SP.voice.key(); SP.ui.toastLater(SP.voice.t('pet_meet'), { who: k === 'neutral' ? '' : V[k].name, ms: 7000 }); }
    if (still()) { mode = night() ? 'sleep' : wet() ? 'shelter' : 'sit'; zEl.hidden = mode !== 'sleep'; place(); draw(); return; }
    if (document.visibilityState === 'visible') { last = performance.now(); decide(); schedule(); }
  }

  // Finish a task and it runs over to celebrate.
  SP.on('stat', ({ name, by }) => {
    if (!el || el.hidden || !track || by <= 0) return;
    if (name === 'done' || name === 'focus' || name === 'dares') {
      const tasks = document.querySelector('#grid > .card[data-w="tasks"]'), r = tasks && tasks.getBoundingClientRect();
      target = r && Math.abs(r.top + scrollY - track.y) < 4 ? Math.min(track.right, Math.max(track.left, r.left + r.width / 2 - W * SCALE / 2)) : x;
      if (still()) return say('♥');
      zEl.hidden = true; mode = 'run'; until = performance.now() + 5000;
    }
  });

  // A lively cat chases your pointer along the top of the cards.
  let chaseT = 0;
  addEventListener('pointermove', (e) => {
    if (!el || el.hidden || !track || !L().play || still() || mode === 'sleep' || mode === 'shelter') return;
    const now = performance.now(); if (now - chaseT < 400) return; chaseT = now;
    const y = e.pageY; if (Math.abs(y - track.y) > 140) return;
    target = Math.min(track.right, Math.max(track.left, e.pageX - W * SCALE / 2));
    if (Math.abs(target - x) > 30) { mode = 'walk'; until = now + 6000; zEl.hidden = true; schedule(); }
  }, { passive: true });
  addEventListener('resize', () => { measure(); place(); });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') { halt(); } else if (el && !el.hidden && !raf && !still()) { last = performance.now(); schedule(); } });
  const remeasure = () => { if (el && !el.hidden) requestAnimationFrame(() => { measure(); place(); }); };
  const grid = document.getElementById('grid');
  if (grid) { new MutationObserver(remeasure).observe(grid, { childList: true }); if (window.ResizeObserver) new ResizeObserver(remeasure).observe(grid); }

  SP.on('ready', refresh);
  SP.pet = { refresh, poke, level, LEVELS, get mode() { return mode; }, get x() { return x; }, _measure: measure };
})(window.SP = window.SP || {});
