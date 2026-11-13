/* Animated overlay for the pixel scene: twinkling stars, shooting stars, water shimmer,
   flickering city windows, snow, fireflies and drifting dust. Runs at ~12 fps on a
   384x216 canvas, pauses when the tab is hidden, and respects reduced motion. */
(function (SP) {
  'use strict';
  let cv, ctx, M = null, raf = 0, last = 0, t0 = 0;
  let shooting = null, flakes = [], flies = [], glints = [];
  // Live extras on top of the theme: real weather and the calendar ('rain', 'storm', 'snow', 'flurries', 'fog', 'fireworks', 'bats').
  let fx = [], drops = [], wflakes = [], fogs = [], sparks = [], bats = [], flash = 0, nextRocket = 0;
  // Seasons and events: 'petals', 'leaves', 'summerflies', 'hearts', 'lights', 'meteors', 'voyager'.
  let drift = [], bugs = [], meteors = [], meteorUntil = 0, balloons = [];
  const BALLOON = [[239, 68, 68], [250, 204, 21], [59, 130, 246], [236, 72, 153], [34, 197, 94], [168, 85, 247]];
  const rgba = (c, a) => 'rgba(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ',' + a.toFixed(3) + ')';
  const reduced = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  function seed() {
    const { W, H, horizon } = M;
    flakes = M.fx === 'snow' ? Array.from({ length: 90 }, () => ({ x: Math.random() * W, y: Math.random() * H, v: 6 + Math.random() * 10, d: Math.random() * 6.28, s: Math.random() < 0.2 ? 2 : 1 })) : [];
    flies = M.fx === 'fireflies' ? Array.from({ length: 16 }, () => ({ x: Math.random() * W, y: horizon + Math.random() * (H - horizon), vx: 0, vy: 0, ph: Math.random() * 6.28 })) : [];
    if (M.fx === 'dust') flies = Array.from({ length: 30 }, () => ({ x: Math.random() * W, y: H * 0.5 + Math.random() * H * 0.5, vx: 3 + Math.random() * 4, vy: 0, ph: Math.random() * 6.28 }));
    glints = [];
    shooting = null;
    seedFx();
  }
  function seedFx() {
    if (!M) return;
    const { W, H } = M, has = (k) => fx.includes(k);
    const wet = has('rain') || has('storm');
    drops = wet ? Array.from({ length: has('storm') ? 170 : 110 }, () => ({ x: Math.random() * W, y: Math.random() * H, v: 150 + Math.random() * 90 })) : [];
    const n = has('snow') ? 120 : has('flurries') ? 35 : 0;
    wflakes = M.fx === 'snow' ? [] : Array.from({ length: n }, () => ({ x: Math.random() * W, y: Math.random() * H, v: 5 + Math.random() * 9, d: Math.random() * 6.28, s: Math.random() < 0.2 ? 2 : 1 }));
    fogs = has('fog') ? Array.from({ length: 7 }, (_, i) => ({ x: Math.random() * W, y: M.horizon - 34 + i * 12 + Math.random() * 6, w: 120 + Math.random() * 160, h: 6 + Math.random() * 8, v: 2 + Math.random() * 4, a: 0.08 + Math.random() * 0.08 })) : [];
    bats = has('bats') ? Array.from({ length: 5 }, () => ({ x: Math.random() * W, y: 20 + Math.random() * M.horizon * 0.5, v: 18 + Math.random() * 14, ph: Math.random() * 6.28 })) : [];
    sparks = []; flash = 0; nextRocket = 0;
    const DRIFT = { petals: [[255, 190, 215], [255, 220, 235], [250, 170, 200]], leaves: [[230, 120, 40], [200, 80, 30], [240, 170, 60], [170, 60, 30]], hearts: [[255, 105, 150], [255, 150, 190]] };
    drift = [];
    for (const k of Object.keys(DRIFT)) if (has(k)) for (let i = 0; i < (k === 'hearts' ? 14 : 26); i++)
      drift.push({ k, x: Math.random() * W, y: Math.random() * H, vy: (k === 'hearts' ? -6 : 7) - Math.random() * 5 * (k === 'hearts' ? 1 : -1), vx: 4 + Math.random() * 8, ph: Math.random() * 6.28, c: DRIFT[k][i % DRIFT[k].length] });
    balloons = has('balloons') ? Array.from({ length: 9 }, (_, i) => ({ x: (i + 0.5) * W / 9 + (Math.random() - 0.5) * 20, y: H + Math.random() * H, v: 9 + Math.random() * 8, ph: Math.random() * 6.28, c: BALLOON[i % BALLOON.length] })) : [];
    bugs = has('summerflies') && M.fx !== 'fireflies' ? Array.from({ length: 12 }, () => ({ x: Math.random() * W, y: M.horizon + Math.random() * (H - M.horizon), vx: 0, vy: 0, ph: Math.random() * 6.28 })) : [];
  }
  /* A short burst of shooting stars (an easter egg). */
  function shower(sec) { meteorUntil = performance.now() + (sec || 12) * 1000; }
  const FW = [[255, 120, 170], [255, 214, 110], [140, 220, 255], [190, 150, 255], [140, 255, 170]];
  function drawFx(t, dt) {
    const { W, H, horizon } = M;
    // Petals, leaves and hearts drift and sway; hearts float up.
    for (const d of drift) {
      d.y += d.vy * dt; d.x += (d.vx + Math.sin(t * 1.3 + d.ph) * 8) * dt;
      if (d.y > H + 3) { d.y = -3; d.x = Math.random() * W; } if (d.y < -3) { d.y = H + 3; d.x = Math.random() * W; } if (d.x > W + 3) d.x = -3;
      const x = Math.round(d.x), y = Math.round(d.y), flip = Math.sin(t * 3 + d.ph) > 0;
      ctx.fillStyle = rgba(d.c, 0.85);
      if (d.k === 'hearts') { ctx.fillRect(x - 1, y, 1, 1); ctx.fillRect(x + 1, y, 1, 1); ctx.fillRect(x - 1, y + 1, 3, 1); ctx.fillRect(x, y + 2, 1, 1); }
      else if (d.k === 'leaves') { ctx.fillRect(x, y, flip ? 2 : 1, 1); ctx.fillRect(x + (flip ? 1 : 0), y + 1, 1, 1); }
      else ctx.fillRect(x, y, flip ? 2 : 1, 1);
    }
    for (const p of bugs) { // summer-night fireflies on any scene
      p.vx += (Math.random() - 0.5) * 30 * dt; p.vy += (Math.random() - 0.5) * 30 * dt; p.vx *= 0.96; p.vy *= 0.96;
      p.x = (p.x + p.vx * dt + W) % W; p.y = Math.min(H - 2, Math.max(horizon - 20, p.y + p.vy * dt));
      const a = Math.max(0, Math.sin(t * 1.6 + p.ph)); if (a > 0.1) { ctx.fillStyle = 'rgba(220,255,130,' + (a * 0.85).toFixed(3) + ')'; ctx.fillRect(Math.round(p.x), Math.round(p.y), 1, 1); }
    }
    if (fx.includes('lights')) { // a string of fairy lights along the top
      const cols = [[255, 90, 90], [255, 210, 90], [110, 220, 140], [110, 170, 255]];
      for (let i = 0, x = 4; x < W; i++, x += 12) { const y = 4 + Math.round(Math.sin(x / 24) * 2 + 2), on = Math.sin(t * 2 + i * 1.7) > -0.3;
        ctx.fillStyle = 'rgba(20,20,30,0.8)'; ctx.fillRect(x - 6, y - 1, 6, 1); ctx.fillStyle = rgba(cols[i % 4], on ? 0.95 : 0.35); ctx.fillRect(x, y, 1, 2); }
    }
    if ((performance.now() < meteorUntil ? Math.random() < dt * 6 : fx.includes('meteors') && Math.random() < dt * 0.3)) // a burst (the Konami code), or a steady shower on a peak night
      meteors.push({ x: W * (0.3 + Math.random() * 0.8), y: Math.random() * horizon * 0.4, vx: -(110 + Math.random() * 60), vy: 40 + Math.random() * 30, life: 0.8 });
    meteors = meteors.filter((s) => (s.life -= dt) > 0);
    for (const s of meteors) { for (let i = 0; i < 8; i++) { ctx.fillStyle = 'rgba(255,250,235,' + (0.9 * (1 - i / 8) * Math.min(1, s.life * 2)).toFixed(3) + ')'; ctx.fillRect(Math.round(s.x - s.vx * i * 0.012), Math.round(s.y - s.vy * i * 0.012), 1, 1); } s.x += s.vx * dt; s.y += s.vy * dt; }
    for (const f of fogs) { f.x += f.v * dt; if (f.x > W) f.x = -f.w; ctx.fillStyle = 'rgba(225,225,240,' + f.a.toFixed(3) + ')'; ctx.fillRect(Math.round(f.x), Math.round(f.y), Math.round(f.w), Math.round(f.h)); ctx.fillRect(Math.round(f.x + 14), Math.round(f.y - 3), Math.round(f.w - 28), 3); }
    if (drops.length) {
      ctx.fillStyle = 'rgba(190,210,255,0.45)';
      for (const d of drops) { d.y += d.v * dt; d.x -= d.v * 0.18 * dt; if (d.y > H) { d.y = -4; d.x = Math.random() * (W + 40); } ctx.fillRect(Math.round(d.x), Math.round(d.y), 1, 3); }
    }
    for (const f of wflakes) {
      f.y += f.v * dt; f.x += Math.sin(t * 0.8 + f.d) * 4 * dt;
      if (f.y > H) { f.y = -2; f.x = Math.random() * W; }
      ctx.fillStyle = 'rgba(255,255,255,' + (f.s > 1 ? 0.9 : 0.65) + ')'; ctx.fillRect(Math.round(f.x), Math.round(f.y), f.s, f.s);
    }
    if (fx.includes('storm')) {
      if (flash <= 0 && Math.random() < dt * 0.12) flash = 0.35;
      if (flash > 0) { ctx.fillStyle = 'rgba(235,235,255,' + (Math.min(0.35, flash) * (Math.random() < 0.5 ? 1 : 0.4)).toFixed(3) + ')'; ctx.fillRect(0, 0, W, horizon); flash -= dt; }
    }
    if (fx.includes('fireworks')) {
      if (t > nextRocket) { nextRocket = t + 0.6 + Math.random() * 1.6; const c = FW[Math.floor(Math.random() * FW.length)], cx = W * (0.15 + Math.random() * 0.7), cy = horizon * (0.15 + Math.random() * 0.4);
        for (let i = 0; i < 26; i++) { const a = (i / 26) * 6.283, sp = 22 + Math.random() * 16; sparks.push({ x: cx, y: cy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 1.1 + Math.random() * 0.5, c }); } }
      sparks = sparks.filter((p) => (p.life -= dt) > 0);
      for (const p of sparks) { p.vy += 18 * dt; p.x += p.vx * dt; p.y += p.vy * dt; ctx.fillStyle = rgba(p.c, Math.min(1, p.life)); ctx.fillRect(Math.round(p.x), Math.round(p.y), 1, 1); }
    }
    for (const b of balloons) { // birthday: balloons rise, sway, and drift off the top
      b.y -= b.v * dt; b.x += Math.sin(t * 0.9 + b.ph) * 5 * dt; if (b.y < -14) { b.y = H + 6; b.x = Math.random() * W; }
      const x = Math.round(b.x), y = Math.round(b.y);
      ctx.fillStyle = rgba(b.c, 0.95); ctx.fillRect(x - 1, y, 3, 4); ctx.fillRect(x - 2, y + 1, 5, 2); ctx.fillRect(x, y + 4, 1, 1);
      ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillRect(x - 1, y + 1, 1, 1);
      ctx.fillStyle = 'rgba(230,230,240,0.55)'; for (let i = 0; i < 6; i++) ctx.fillRect(x + Math.round(Math.sin(t * 2 + b.ph + i * 0.7) * 0.8), y + 5 + i, 1, 1);
    }
    if (fx.includes('voyager')) drawVoyager(t, W, horizon);
    for (const b of bats) {
      b.x += b.v * dt; b.y += Math.sin(t * 3 + b.ph) * 6 * dt; if (b.x > W + 4) { b.x = -4; b.y = 20 + Math.random() * horizon * 0.5; }
      const up = Math.sin(t * 14 + b.ph) > 0, x = Math.round(b.x), y = Math.round(b.y);
      ctx.fillStyle = 'rgba(12,6,20,0.95)'; ctx.fillRect(x, y, 1, 1); ctx.fillRect(x - 2, y + (up ? -1 : 1), 2, 1); ctx.fillRect(x + 1, y + (up ? -1 : 1), 2, 1);
    }
  }

  /* Voyager 1: a probe twice the usual pixel size crawls across the sky over half an hour, dish towards home,
     sending a radio pulse home every couple of seconds, with a faint trail of where it's been. */
  function drawVoyager(t, W, horizon) {
    const P = 2, span = W + 40, x = Math.round(W + 20 - ((Date.now() / 1800e3) % 1) * span), // by the wall clock, so a new tab doesn't start it off-screen
      y = Math.round(horizon * 0.2 + Math.sin(t / 120) * 4);
    for (let i = 1; i <= 14; i++) { ctx.fillStyle = 'rgba(200,210,255,' + (0.22 * (1 - i / 14)).toFixed(3) + ')'; ctx.fillRect(x + 12 + i * 4, y + 1, 1, 1); } // trail
    const px = (c, i, j, w, h) => { ctx.fillStyle = c; ctx.fillRect(x + i * P, y + j * P, (w || 1) * P, (h || 1) * P); };
    const body = 'rgba(205,205,215,0.95)', dish = 'rgba(245,245,252,1)', gold = 'rgba(230,190,90,0.95)';
    px(dish, -1, -3, 1, 7); px(dish, -2, -2, 1, 5); px(dish, -3, -1, 1, 3);           // the big dish, facing home
    px(body, 0, 0, 3, 2); px(gold, 1, 0);                                             // the bus, with the Golden Record
    px(body, 3, 0, 5, 1);                                                             // magnetometer boom
    px(body, 1, 2, 1, 3); px(body, 0, 4, 3, 1);                                       // power source on its boom
    px(body, 2, -1, 1, 1); px(body, 3, -2, 3, 1);                                     // science boom
    if ((t % 2.5) < 0.3) px('rgba(255,90,80,1)', 8, 0);                               // the light blinks
    // A radio pulse every 2 s: an arc travelling from the dish down towards Earth, fading as it spreads.
    for (let k = 0; k < 3; k++) {
      const age = (t + k * 2) % 6, r = 6 + age * 14, a = 0.55 * (1 - age / 6); if (a <= 0.02) continue;
      ctx.fillStyle = 'rgba(160,200,255,' + a.toFixed(3) + ')';
      for (let ang = 100; ang <= 170; ang += 50 / r + 1) { const rad = ang * Math.PI / 180; ctx.fillRect(Math.round(x - 4 + Math.cos(rad) * r), Math.round(y + 1 + Math.sin(rad) * r), 1, 1); }
    }
  }

  function frame(now) {
    raf = requestAnimationFrame(frame);
    if (now - last < 80) return;
    const dt = Math.min(0.25, (now - last) / 1000); last = now;
    const t = (now - t0) / 1000, { W, H, horizon } = M;
    ctx.clearRect(0, 0, W, H);

    // Twinkling stars: brighten/dim pixels already in the scene.
    if (M.starColor) for (const s of M.stars) {
      const k = Math.sin(t * s.sp + s.ph);
      if (k > 0.55) { ctx.fillStyle = rgba(M.starColor, (k - 0.55) * 2 * s.a); ctx.fillRect(s.x, s.y, 1, 1); if (k > 0.97 && s.a > 0.7) { ctx.fillStyle = rgba(M.starColor, 0.3); ctx.fillRect(s.x - 1, s.y, 3, 1); ctx.fillRect(s.x, s.y - 1, 1, 3); } }
      else if (k < -0.7) { ctx.fillStyle = 'rgba(0,0,0,' + ((-k - 0.7) * 1.2 * s.a).toFixed(3) + ')'; ctx.fillRect(s.x, s.y, 1, 1); }
    }

    // Shooting star, now and then.
    if (M.night) {
      if (!shooting && Math.random() < dt * 0.09) shooting = { x: W * (0.2 + Math.random() * 0.7), y: horizon * (0.05 + Math.random() * 0.3), vx: -(90 + Math.random() * 60), vy: 35 + Math.random() * 25, life: 0.9 };
      if (shooting) {
        const s = shooting;
        for (let i = 0; i < 9; i++) { ctx.fillStyle = 'rgba(255,250,235,' + (0.9 * (1 - i / 9) * Math.min(1, s.life * 2)).toFixed(3) + ')'; ctx.fillRect(Math.round(s.x - s.vx * i * 0.012), Math.round(s.y - s.vy * i * 0.012), 1, 1); }
        s.x += s.vx * dt; s.y += s.vy * dt; s.life -= dt;
        if (s.life <= 0 || s.y > horizon) shooting = null;
      }
    }

    // Water shimmer near the sun/glow reflection.
    if (M.water && M.sparkle) {
      if (glints.length < 14 && Math.random() < 0.8) glints.push({ x: M.sparkleX + (Math.random() - 0.5) * 60, y: horizon + 2 + Math.floor(Math.random() * (H - horizon) * 0.6), w: 2 + Math.floor(Math.random() * 7), life: 0.4 + Math.random() * 0.9, age: 0 });
      glints = glints.filter((g) => (g.age += dt) < g.life);
      for (const g of glints) { ctx.fillStyle = rgba(M.sparkle, 0.55 * Math.sin((g.age / g.life) * Math.PI)); ctx.fillRect(Math.round(g.x), g.y, g.w, 1); }
    }

    // City windows flicker.
    for (const w of M.windows) {
      const k = Math.sin(t * 0.7 + w.ph) + Math.sin(t * 2.3 + w.ph * 1.7);
      if (k > 1.6) { ctx.fillStyle = 'rgba(10,2,30,0.85)'; ctx.fillRect(w.x, w.y, 1, 1); }
      else if (k < -1.6) { ctx.fillStyle = rgba(w.c, 1); ctx.fillRect(w.x, w.y, 1, 1); }
    }

    // Snow.
    for (const f of flakes) {
      f.y += f.v * dt; f.x += Math.sin(t * 0.8 + f.d) * 4 * dt;
      if (f.y > H) { f.y = -2; f.x = Math.random() * W; }
      ctx.fillStyle = 'rgba(255,255,255,' + (f.s > 1 ? 0.95 : 0.7) + ')'; ctx.fillRect(Math.round(f.x), Math.round(f.y), f.s, f.s);
    }

    drawFx(t, dt);

    // Fireflies / dust motes.
    for (const p of flies) {
      if (M.fx === 'fireflies') {
        p.vx += (Math.random() - 0.5) * 30 * dt; p.vy += (Math.random() - 0.5) * 30 * dt; p.vx *= 0.96; p.vy *= 0.96;
        p.x = (p.x + p.vx * dt + W) % W; p.y = Math.min(H - 2, Math.max(horizon - 20, p.y + p.vy * dt));
        const a = Math.max(0, Math.sin(t * 1.6 + p.ph));
        if (a > 0.1) { ctx.fillStyle = 'rgba(200,255,120,' + (a * 0.9).toFixed(3) + ')'; ctx.fillRect(Math.round(p.x), Math.round(p.y), 1, 1); ctx.fillStyle = 'rgba(160,255,120,' + (a * 0.25).toFixed(3) + ')'; ctx.fillRect(Math.round(p.x) - 1, Math.round(p.y) - 1, 3, 3); }
      } else {
        p.x += p.vx * dt; p.y += Math.sin(t + p.ph) * 2 * dt;
        if (p.x > W) { p.x = -2; p.y = H * 0.5 + Math.random() * H * 0.5; }
        ctx.fillStyle = 'rgba(255,255,255,' + (0.35 + 0.3 * Math.sin(t * 2 + p.ph)).toFixed(3) + ')'; ctx.fillRect(Math.round(p.x), Math.round(p.y), 1, 1);
      }
    }
  }

  function stop() { cancelAnimationFrame(raf); raf = 0; if (ctx) ctx.clearRect(0, 0, cv.width, cv.height); }
  function start(meta) {
    cv = cv || document.getElementById('bg-anim');
    if (!cv) return;
    ctx = ctx || cv.getContext('2d');
    stop();
    M = meta;
    if (!M || reduced() || document.visibilityState === 'hidden') return;
    cv.width = M.W; cv.height = M.H;
    seed(); t0 = last = performance.now();
    raf = requestAnimationFrame(frame);
  }
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') { cancelAnimationFrame(raf); raf = 0; } else if (M && !raf && !reduced()) { last = performance.now(); raf = requestAnimationFrame(frame); } });
  function setFx(list) { const next = (list || []).slice().sort(); if (next.join() === fx.join()) return; fx = next; seedFx(); }
  SP.anim = { start, stop, setFx, shower, get fx() { return fx.slice(); } };
})(window.SP = window.SP || {});
