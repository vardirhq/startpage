/* Procedural pixel-art landscapes. Everything is drawn into a small pixel
   buffer and scaled up with `image-rendering: pixelated`. */
(function (SP) {
  'use strict';

  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const hex = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  const dith = (x, y) => (BAYER[((y & 3) << 2) | (x & 3)] + 0.5) / 16;

  function Buf(W, H) { this.W = W; this.H = H; this.d = new Uint8ClampedArray(W * H * 4); }
  Buf.prototype.set = function (x, y, c, a) {
    x |= 0; y |= 0;
    if (x < 0 || y < 0 || x >= this.W || y >= this.H) return;
    const i = (y * this.W + x) * 4, d = this.d;
    if (a === undefined || a >= 1) { d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = 255; return; }
    if (a <= 0) return;
    d[i] = d[i] + (c[0] - d[i]) * a; d[i + 1] = d[i + 1] + (c[1] - d[i + 1]) * a; d[i + 2] = d[i + 2] + (c[2] - d[i + 2]) * a;
    d[i + 3] = Math.max(d[i + 3], a * 255);
  };
  Buf.prototype.get = function (x, y) {
    x = clamp(x | 0, 0, this.W - 1); y = clamp(y | 0, 0, this.H - 1);
    const i = (y * this.W + x) * 4; return [this.d[i], this.d[i + 1], this.d[i + 2]];
  };
  Buf.prototype.rect = function (x, y, w, h, c, a) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c, a);
  };

  function gradAt(stops, t) {
    t = clamp(t, 0, 1);
    const n = stops.length - 1, f = t * n, i = Math.min(n - 1, Math.floor(f));
    return mix(stops[i], stops[i + 1], f - i);
  }

  // ---------- primitives ----------
  function sky(b, stops, horizon, bands) {
    for (let y = 0; y < b.H; y++) {
      const tt = clamp(y / horizon, 0, 1) * bands, base = Math.floor(tt), f = tt - base;
      for (let x = 0; x < b.W; x++) b.set(x, y, gradAt(stops, Math.min(bands, f > dith(x, y) ? base + 1 : base) / bands));
    }
  }
  function glow(b, cx, cy, R, c, strength) {
    for (let y = Math.max(0, cy - R | 0); y < Math.min(b.H, cy + R); y++)
      for (let x = Math.max(0, cx - R | 0); x < Math.min(b.W, cx + R); x++) {
        const d = Math.hypot(x - cx, (y - cy) * 1.25) / R;
        if (d >= 1) continue;
        const a = Math.floor(((1 - d) * (1 - d) * strength) * 6 + dith(x, y)) / 6;
        b.set(x, y, c, a);
      }
  }
  function disc(b, cx, cy, r, colTop, colBot, stripes) {
    for (let y = Math.floor(cy - r); y <= cy + r; y++) {
      if (stripes && y > cy - r * 0.1) {
        const k = y - (cy - r * 0.1);
        const gap = 1 + Math.floor(k / (r * 0.28));
        if (k % 5 < gap * 0.6) continue;
      }
      const c = colBot ? mix(colTop, colBot, (y - (cy - r)) / (2 * r)) : colTop;
      for (let x = Math.floor(cx - r); x <= cx + r; x++)
        if (Math.hypot(x - cx, y - cy) <= r) b.set(x, y, c);
    }
  }
  let META = null; // filled during render() for the animation layer
  function stars(b, R, n, maxY, c) {
    for (let i = 0; i < n; i++) {
      const x = R() * b.W, y = R() * maxY, br = R();
      const a = (0.35 + br * 0.65) * (1 - y / (maxY * 1.15));
      b.set(x, y, c, a);
      if (META && br > 0.45) META.stars.push({ x: x | 0, y: y | 0, a, ph: R() * 6.28, sp: 0.6 + R() * 2.2 });
      if (br > 0.94) { b.set(x + 1, y, c, a * 0.45); b.set(x - 1, y, c, a * 0.45); b.set(x, y + 1, c, a * 0.45); b.set(x, y - 1, c, a * 0.45); }
    }
  }
  function clouds(b, R, cfg) {
    const lit = hex(cfg.lit), dark = hex(cfg.dark);
    for (let k = 0; k < cfg.n; k++) {
      const cx = R() * b.W, cy = b.H * (cfg.y[0] + R() * (cfg.y[1] - cfg.y[0]));
      const len = b.W * (0.06 + R() * 0.2), rows = 2 + Math.floor(R() * 3);
      for (let r = 0; r < rows; r++) {
        const rl = len * (1 - r * 0.15) * (0.75 + R() * 0.45), x0 = cx - rl / 2 + (R() - 0.5) * 8;
        const c = mix(dark, lit, rows === 1 ? 1 : r / (rows - 1));
        for (let x = 0; x < rl; x++) b.set(x0 + x, cy + r, c, cfg.a);
      }
    }
  }
  function aurora(b, R, cols, horizon) {
    const c1 = hex(cols[0]), c2 = hex(cols[1]), c3 = hex(cols[2]);
    for (let band = 0; band < 3; band++) {
      const p1 = R() * 6, p2 = R() * 6, p3 = R() * 6, base = horizon * (0.28 + band * 0.12);
      for (let x = 0; x < b.W; x++) {
        const cy = base + Math.sin(x * 0.025 + p1) * horizon * 0.09 + Math.sin(x * 0.09 + p2) * 3;
        const h = horizon * (0.12 + 0.08 * Math.sin(x * 0.04 + p3)) + 6;
        for (let y = Math.floor(cy - h); y < cy; y++) {
          const t = (y - (cy - h)) / h;
          const a = Math.floor(t * t * (band === 1 ? 0.55 : 0.4) * 6 + dith(x, y)) / 6;
          b.set(x, y, t > 0.7 ? mix(c2, c1, (t - 0.7) / 0.3) : mix(c3, c2, t / 0.7), a);
        }
      }
    }
  }
  function ridge(R, W, rough) {
    let size = 1; while (size < W + 2) size <<= 1;
    const a = new Float32Array(size + 1);
    a[0] = R(); a[size] = R();
    let step = size, amp = 1;
    while (step > 1) {
      const half = step >> 1;
      for (let i = half; i < size; i += step) a[i] = (a[i - half] + a[i + half]) / 2 + (R() - 0.5) * amp;
      amp *= rough; step = half;
    }
    let lo = Infinity, hi = -Infinity;
    for (let i = 0; i <= W + 1; i++) { lo = Math.min(lo, a[i]); hi = Math.max(hi, a[i]); }
    const out = new Float32Array(W + 2);
    for (let i = 0; i <= W + 1; i++) out[i] = (a[i] - lo) / (hi - lo || 1);
    return out;
  }
  function mountains(b, R, L, horizon) {
    const h = ridge(R, b.W, L.rough || 0.55);
    const col = hex(L.color), lit = hex(L.lit || L.color), haze = L.haze ? hex(L.haze) : null;
    const snow = L.snow ? hex(L.snow) : null, snowLit = L.snowLit ? hex(L.snowLit) : snow;
    const top = horizon - b.H * L.height;
    let lastLit = false;
    for (let x = 0; x < b.W; x++) {
      const y0 = Math.round(horizon - b.H * L.height * h[x]);
      const slope = h[Math.min(b.W + 1, x + 4)] - h[Math.max(0, x - 4)];
      if (slope > 0.03) lastLit = !!L.lightLeft; else if (slope < -0.03) lastLit = !L.lightLeft;
      const isLit = lastLit;
      const snowY = top + (horizon - top) * (L.snowline || 0) + Math.sin(x * 0.8) * 1.5 + R() * 2;
      for (let y = y0; y < horizon; y++) {
        let c = snow && y < snowY ? (isLit ? snowLit : snow) : (isLit ? lit : col);
        if (haze) {
          const t = (y - y0) / Math.max(1, horizon - y0);
          if (t * 0.5 > dith(x, y)) c = mix(c, haze, 0.35);
        }
        b.set(x, y, c);
      }
    }
  }
  function city(b, R, base, maxH, color, wins, density) {
    const c = hex(color), wc = wins.map(hex);
    let x = -2;
    while (x < b.W) {
      const w = 4 + Math.floor(R() * 12), hh = Math.floor(maxH * (0.25 + R() * 0.75));
      b.rect(x, base - hh, w, hh, c);
      if (R() < 0.3) b.rect(x + (w >> 1), base - hh - 4, 1, 4, c);
      for (let wy = base - hh + 2; wy < base - 1; wy += 3)
        for (let wx = x + 1; wx < x + w - 1; wx += 2)
          if (R() < density) {
            const col = wc[Math.floor(R() * wc.length)];
            b.set(wx, wy, col, 0.55 + R() * 0.45);
            if (META && R() < 0.12) META.windows.push({ x: wx, y: wy, c: col, ph: R() * 100 });
          }
      x += w + Math.floor(R() * 2);
    }
  }
  function dunes(b, R, layers) {
    layers.forEach((L) => {
      const c = hex(L.color), lit = hex(L.lit), p1 = R() * 6, p2 = R() * 6;
      for (let x = 0; x < b.W; x++) {
        const f = (xx) => b.H * L.base + Math.sin(xx * L.f1 + p1) * b.H * L.a1 + Math.sin(xx * L.f2 + p2) * b.H * L.a2;
        const y0 = Math.round(f(x)), s = clamp((f(x + 1) - f(x - 1)) * 0.9 + 0.5, 0, 1);
        for (let y = y0; y < b.H; y++) {
          const depth = clamp((y - y0) / (b.H * 0.25), 0, 1);
          b.set(x, y, s * (1 - depth * 0.5) > dith(x, y) ? lit : c);
        }
      }
    });
  }
  function pine(b, x, baseY, h, c, snow) {
    const tiers = Math.max(2, Math.round(h / (h > 40 ? 11 : 7))), tierLen = h / tiers, w = Math.max(1, h * 0.3);
    for (let i = 0; i < h; i++) {
      const t = i / h, inTier = (i % tierLen) / tierLen;
      const half = Math.round(w * (0.15 + t * 0.6) * (0.55 + inTier * 0.55));
      const y = Math.round(baseY - h + i);
      for (let dx = -half; dx <= half; dx++) {
        const s = snow && inTier < 0.2 && dx < half * 0.4 && dx > -half;
        b.set(x + dx, y, s ? snow : c);
      }
    }
    b.rect(x, baseY, 1, Math.max(1, Math.round(h * 0.06)), c);
  }
  function treeline(b, R, y, minH, maxH, c, snow) {
    for (let x = -2; x < b.W + 2; x += 1 + Math.floor(R() * 3)) pine(b, x, y, minH + R() * (maxH - minH), c, snow);
    b.rect(0, y, b.W, 1, c);
  }
  function reflect(b, horizon, water, amount) {
    for (let y = horizon; y < b.H; y++) {
      const dy = y - horizon, src = Math.max(0, horizon - 1 - dy);
      const wob = Math.round(Math.sin(y * 1.7) * (0.6 + dy * 0.05));
      const f = Math.min(0.92, amount + (dy / (b.H - horizon)) * 0.25);
      for (let x = 0; x < b.W; x++) {
        let c = mix(b.get(x + wob, src), water, f);
        if (dy % 3 === 0 && dith(x, y) > 0.85) c = mix(c, water, 0.4);
        b.set(x, y, c);
      }
    }
  }
  function sparkles(b, R, cx, horizon, c, n) {
    for (let i = 0; i < n; i++) {
      const y = horizon + 2 + Math.floor(R() * (b.H - horizon) * 0.7);
      const w = Math.max(2, Math.round((4 + R() * 16) * (1 - (y - horizon) / (b.H - horizon) * 0.5)));
      const x = cx + (R() - 0.5) * 30 - w / 2;
      for (let k = 0; k < w; k++) b.set(x + k, y, c, 0.4 + R() * 0.4);
    }
  }
  function forest(b, R, side, cfg) {
    const fg = hex(cfg.fg), mid = hex(cfg.fgMid || cfg.fg), snow = cfg.treeSnow ? hex(cfg.treeSnow) : null;
    const W = b.W, H = b.H;
    const xs = side === 'left' ? [0, W * 0.13] : [W * 0.87, W];
    for (let layer = 0; layer < 2; layer++) {
      const n = layer === 0 ? 5 : 4, c = layer === 0 ? mid : fg;
      for (let i = 0; i < n; i++) {
        const x = Math.round(xs[0] + R() * (xs[1] - xs[0]));
        const h = H * (layer === 0 ? 0.3 + R() * 0.3 : 0.38 + R() * 0.42);
        pine(b, x, H - 1, h, c, snow && layer === 0 ? mix(snow, c, 0.25) : snow);
      }
    }
    for (let x = 0; x < W; x++) {
      const d = side === 'left' ? x : W - x, g = Math.round(Math.max(0, (W * 0.2 - d) * 0.22));
      for (let y = H - g; y < H; y++) b.set(x, y, fg);
    }
  }

  // ---------- themes ----------
  const T = {
    midnight: {
      name: 'Midnight', tint: '#15112e', horizon: 0.64,
      sky: ['#100c2a', '#1f1650', '#3c2470', '#7a3c84', '#c95e7a', '#f39a60'],
      stars: 70, starColor: '#fff3e6',
      glow: { x: 0.6, r: 0.55, c: '#ff9a6a', s: 0.55 },
      clouds: { n: 8, y: [0.22, 0.5], lit: '#f08a88', dark: '#5c3480', a: 0.8 },
      mountains: [
        { height: 0.44, rough: 0.56, color: '#45367c', lit: '#644c9a', snow: '#9d84cc', snowLit: '#f3b8c8', snowline: 0.45, haze: '#8a4a88' },
        { height: 0.26, rough: 0.6, color: '#2c235a', lit: '#3b2e6e', snow: '#6f5ca6', snowLit: '#c595c4', snowline: 0.4, haze: '#57397c' },
        { height: 0.09, rough: 0.62, color: '#1b1540', lit: '#241c4c' },
      ],
      shore: '#100b24', water: '#1a1440', waterMix: 0.42, sparkle: '#ffae78',
      fg: '#08061a', fgMid: '#140e30',
    },
    forest: {
      name: 'Forest', tint: '#0b1a1b', horizon: 0.66,
      sky: ['#02060e', '#041320', '#08262c', '#0e3d3a', '#185a46'],
      stars: 160, starColor: '#e8fff6',
      aurora: ['#5dffb0', '#22d3a6', '#6d5cff'],
      mountains: [
        { height: 0.3, rough: 0.55, color: '#0b2a2c', lit: '#123a38', snow: '#1f5450', snowLit: '#3a8a74', snowline: 0.3 },
        { height: 0.16, rough: 0.6, color: '#071c1e', lit: '#0b2526' },
      ],
      shore: '#031010', water: '#05161a', waterMix: 0.4, treeMin: 6, treeMax: 16,
      fg: '#020a0a', fgMid: '#061616', fx: 'fireflies',
    },
    cyber: {
      name: 'Cyber', tint: '#150a2c', horizon: 0.7,
      sky: ['#0a0220', '#22064a', '#4c0c70', '#a01a80', '#ff4d8d', '#ffb15e'],
      stars: 50, starColor: '#ffe6ff',
      sun: { x: 0.5, y: 0.6, r: 0.17, top: '#ffe66b', bot: '#ff3d8b', stripes: true },
      glow: { x: 0.5, r: 0.5, c: '#ff4fa8', s: 0.5 },
      city: [
        { maxH: 0.3, color: '#3a0f62', wins: ['#c86bff'], density: 0.12 },
        { maxH: 0.2, color: '#1c0838', wins: ['#00e5ff', '#ff4fd8', '#ffe66b'], density: 0.3 },
      ],
      water: '#14042e', waterMix: 0.35, sparkle: '#ff7ad0', shore: '#0c0320',
    },
    nordic: {
      name: 'Nordic', tint: '#131b2b', horizon: 0.64,
      sky: ['#5f8cc8', '#86a9d8', '#b4c9e6', '#dfe8f3'],
      sun: { x: 0.72, y: 0.2, r: 0.05, top: '#fffbea' },
      glow: { x: 0.72, y: 0.2, r: 0.4, c: '#ffffff', s: 0.5 },
      clouds: { n: 6, y: [0.12, 0.4], lit: '#ffffff', dark: '#c9d7ea', a: 0.9 },
      mountains: [
        { height: 0.42, rough: 0.55, color: '#6a7f9e', lit: '#8ea3c0', snow: '#c8d6e8', snowLit: '#f7faff', snowline: 0.65, lightLeft: true },
        { height: 0.24, rough: 0.6, color: '#4c5f7d', lit: '#66799a', snow: '#b8c8de', snowLit: '#eef4fb', snowline: 0.5, lightLeft: true },
      ],
      shore: '#2a3a52', water: '#5c7ea8', waterMix: 0.45, treeMin: 5, treeMax: 13,
      fg: '#15202f', fgMid: '#26364c', treeSnow: '#e9f0f8', sparkle: '#ffffff', fx: 'snow',
    },
    pixel: {
      name: 'Pixel', tint: '#1a1030', horizon: 0.66,
      sky: ['#1a0f3e', '#3e1d66', '#8a2f78', '#e0566e', '#ff9a64', '#ffd08a'],
      stars: 30, starColor: '#fff0dd',
      sun: { x: 0.42, y: 0.63, r: 0.1, top: '#fff1a8', bot: '#ff9a58' },
      glow: { x: 0.42, r: 0.6, c: '#ffb070', s: 0.6 },
      clouds: { n: 9, y: [0.3, 0.55], lit: '#ffb08a', dark: '#8a3a7a', a: 0.85 },
      mountains: [
        { height: 0.3, rough: 0.58, color: '#4a2468', lit: '#6a3480', haze: '#b04a7a' },
        { height: 0.15, rough: 0.62, color: '#2c1448', lit: '#3a1c58' },
      ],
      shore: '#14082a', water: '#2a1444', waterMix: 0.4, sparkle: '#ffd08a',
      fg: '#0c0618', fgMid: '#1c0e30',
    },
    minimal: {
      name: 'Minimal', tint: '#1b1b21', horizon: 1,
      sky: ['#bdbdc6', '#d6d6dd', '#ececf0', '#f6f6f8'],
      sun: { x: 0.68, y: 0.3, r: 0.05, top: '#f9f9fb' },
      glow: { x: 0.68, y: 0.3, r: 0.3, c: '#ffffff', s: 0.4 },
      dunes: [
        { base: 0.6, a1: 0.05, f1: 0.012, a2: 0.02, f2: 0.04, color: '#b9b9c2', lit: '#d9d9df' },
        { base: 0.72, a1: 0.05, f1: 0.016, a2: 0.015, f2: 0.05, color: '#a2a2ad', lit: '#c8c8d0' },
        { base: 0.85, a1: 0.04, f1: 0.02, a2: 0.012, f2: 0.06, color: '#8c8c99', lit: '#b2b2bc' },
      ],
      fx: 'dust',
    },
  };

  function render(canvas, key, seed, opts) {
    opts = opts || {};
    const cfg = T[key] || T.midnight;
    const W = canvas.width, H = canvas.height, b = new Buf(W, H), R = rng((seed || 1) * 9973 + key.length * 131);
    const horizon = Math.round(H * cfg.horizon);
    META = opts.meta ? { key, W, H, horizon, stars: [], windows: [], starColor: cfg.starColor ? hex(cfg.starColor) : null,
      water: !!(cfg.water && horizon < H), sparkle: cfg.sparkle ? hex(cfg.sparkle) : null, sparkleX: W * ((cfg.sun || cfg.glow || { x: 0.5 }).x),
      night: !!cfg.stars && cfg.stars >= 30, fx: cfg.fx || null } : null;

    sky(b, cfg.sky.map(hex), horizon, 28);
    if (cfg.stars) stars(b, R, Math.round(cfg.stars * W / 384), horizon * 0.75, hex(cfg.starColor));
    if (cfg.aurora) aurora(b, R, cfg.aurora, horizon);
    if (cfg.glow) glow(b, W * cfg.glow.x, cfg.glow.y ? H * cfg.glow.y : horizon, W * cfg.glow.r, hex(cfg.glow.c), cfg.glow.s);
    if (cfg.sun) disc(b, W * cfg.sun.x, H * cfg.sun.y, H * cfg.sun.r, hex(cfg.sun.top), cfg.sun.bot && hex(cfg.sun.bot), cfg.sun.stripes);
    if (cfg.clouds) clouds(b, R, cfg.clouds);
    (cfg.mountains || []).forEach((L) => mountains(b, R, L, horizon));
    (cfg.city || []).forEach((L) => city(b, R, horizon, H * L.maxH, L.color, L.wins, L.density));
    if (cfg.dunes) dunes(b, R, cfg.dunes);
    if (cfg.shore) treeline(b, R, horizon, cfg.treeMin || (cfg.city ? 0 : 3), cfg.treeMax || (cfg.city ? 1 : 9), hex(cfg.shore), cfg.treeSnow && mix(hex(cfg.treeSnow), hex(cfg.shore), 0.35));
    if (cfg.water && horizon < H) {
      reflect(b, horizon + 1, hex(cfg.water), cfg.waterMix);
      if (cfg.sparkle) sparkles(b, R, W * ((cfg.sun || cfg.glow || { x: 0.5 }).x), horizon, hex(cfg.sparkle), 26);
    }
    if (cfg.fg && !opts.noForeground) { forest(b, R, 'left', cfg); forest(b, R, 'right', cfg); }

    const ctx = canvas.getContext('2d');
    ctx.putImageData(new ImageData(b.d, W, H), 0, 0);
    const m = META; META = null;
    return m;
  }

  /* Transparent strip of pine silhouettes, used as card decoration. */
  function renderTrees(canvas, key, seed) {
    const cfg = T[key] || T.midnight, W = canvas.width, H = canvas.height;
    const b = new Buf(W, H), R = rng(seed * 31 + 7);
    const c1 = hex(cfg.fgMid || cfg.tint), c2 = hex(cfg.fg || cfg.tint);
    for (let x = -2; x < W + 2; x += 2 + Math.floor(R() * 5)) pine(b, x, H - 1, H * (0.25 + R() * 0.5), c1);
    for (let x = -2; x < W + 2; x += 4 + Math.floor(R() * 9)) pine(b, x, H - 1, H * (0.4 + R() * 0.6), c2);
    canvas.getContext('2d').putImageData(new ImageData(b.d, W, H), 0, 0);
  }

  SP.scene = { render, renderTrees, themes: T };
})(window.SP = window.SP || {});
