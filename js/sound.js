/* Sounds, off by default (Customize → Voice). All synthesised in the browser with Web Audio:
   no audio files, nothing to download. A coin that rings, a die that clatters, a reel that ticks
   as it slows, a tick for a finished task and a small fanfare for achievements. */
(function (SP) {
  'use strict';
  const V = SP.voice.list;
  const LINES = {
    neutral: 'Sound effects (coin, dice, ticks, fanfares)', monday: 'Sound effects. For when silence isn’t annoying enough', supportive: 'Little sounds, so you can hear how happy I am 💕',
    surfer: 'Sounds, like, clinks and stuff', professional: 'Audio notifications (non-intrusive)', therapist: 'Gentle sounds (notice how they feel)', weepy: 'Sounds (tiny bells for tiny endings)',
    victorian: 'Sound effects (a small orchestra, kept below stairs)', owl: 'Sounds (quiet ones, people are sleeping)', ghost: 'sounds. little ones. like footsteps', parent: 'Fun sounds!!! (not too loud)',
  };
  for (const [k, l] of Object.entries(LINES)) V[k].tgl_sounds = l;
  let ac = null, out = null;
  const on = () => SP.store.state.sounds === true;

  function ctx() {
    if (!ac) {
      const A = window.AudioContext || window.webkitAudioContext; if (!A) return null;
      ac = new A();
      const comp = ac.createDynamicsCompressor(); out = ac.createGain(); out.gain.value = 0.7;
      out.connect(comp); comp.connect(ac.destination);
    }
    if (ac.state === 'suspended') ac.resume();
    return ac;
  }
  function tone({ f = 440, to = 0, d = 0.12, type = 'sine', vol = 0.1, at = 0, attack = 0.004 }) {
    const c = ctx(); if (!c) return;
    const t = c.currentTime + at, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t); if (to) o.frequency.exponentialRampToValueAtTime(to, t + d);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + attack); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g); g.connect(out); o.start(t); o.stop(t + d + 0.03);
  }
  let white = null;
  function noise({ d = 0.05, vol = 0.1, at = 0, freq = 2000, q = 1.2, type = 'bandpass' }) {
    const c = ctx(); if (!c) return;
    if (!white) { white = c.createBuffer(1, c.sampleRate, c.sampleRate); const ch = white.getChannelData(0); for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1; }
    const t = c.currentTime + at, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = white; f.type = type; f.frequency.value = freq; f.Q.value = q;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    s.connect(f); f.connect(g); g.connect(out); s.start(t, Math.random() * 0.5); s.stop(t + d + 0.02);
  }

  const SOUNDS = {
    tick() { tone({ f: 1320, d: 0.07, type: 'triangle', vol: 0.07 }); tone({ f: 1980, d: 0.1, type: 'triangle', vol: 0.06, at: 0.06 }); },
    pop() { tone({ f: 520, to: 1100, d: 0.09, type: 'sine', vol: 0.09 }); },
    // The coin spins (soft shimmering pings), then rings when it lands.
    flip() { for (let i = 0; i < 8; i++) tone({ f: 2400 + (i % 2) * 500, d: 0.04, vol: 0.025 * (1 - i / 10), at: i * 0.11 }); },
    clink() { [2637, 3951, 5274].forEach((f, i) => tone({ f, d: 0.5 - i * 0.12, vol: 0.05 / (i + 1), type: 'sine' })); noise({ d: 0.02, vol: 0.05, freq: 6000 }); },
    clatter() {
      for (let i = 0; i < 6; i++) { const at = i * 0.085 + Math.random() * 0.03; noise({ d: 0.035, vol: 0.14 * (1 - i / 7), freq: 1400 + Math.random() * 1800, q: 3, at }); tone({ f: 180 + Math.random() * 60, d: 0.05, type: 'triangle', vol: 0.05 * (1 - i / 7), at }); }
    },
    shake() { for (let i = 0; i < 4; i++) noise({ d: 0.18, vol: 0.07, freq: 500 + i * 60, q: 0.8, type: 'lowpass', at: i * 0.2 }); },
    reveal() { tone({ f: 330, to: 660, d: 0.5, type: 'sine', vol: 0.05, attack: 0.15 }); },
    // Reel ticks that slow down along the same curve as the animation.
    reel(ms) { const n = 22; for (let i = 0; i < n; i++) { const p = i / n, at = (1 - Math.pow(1 - p, 2.6)) * (ms || 1800) / 1000; noise({ d: 0.015, vol: 0.09, freq: 3200, q: 4, at }); } },
    win() { [784, 988, 1175, 1568].forEach((f, i) => tone({ f, d: i === 3 ? 0.35 : 0.12, type: 'square', vol: 0.035, at: i * 0.08 })); },
    lose() { [392, 330, 262].forEach((f, i) => tone({ f, d: 0.2, type: 'triangle', vol: 0.06, at: i * 0.14 })); },
    fanfare() { [523, 659, 784, 1047, 1319].forEach((f, i) => tone({ f, d: i === 4 ? 0.5 : 0.13, type: 'square', vol: 0.03, at: i * 0.09 })); },
    levelup() { [440, 554, 659, 880, 1109, 1319].forEach((f, i) => tone({ f, d: 0.16, type: 'triangle', vol: 0.06, at: i * 0.06 })); },
    meow() { tone({ f: 620, to: 980, d: 0.13, type: 'triangle', vol: 0.06 }); tone({ f: 980, to: 560, d: 0.24, type: 'triangle', vol: 0.06, at: 0.12 }); },
    purr() { for (let i = 0; i < 10; i++) noise({ d: 0.06, vol: 0.05, freq: 120, q: 0.7, type: 'lowpass', at: i * 0.07 }); },
    seal() { tone({ f: 140, to: 70, d: 0.18, type: 'sine', vol: 0.16 }); noise({ d: 0.04, vol: 0.06, freq: 900, at: 0.02 }); },
    paper() { for (let i = 0; i < 5; i++) noise({ d: 0.07, vol: 0.05, freq: 3500 + Math.random() * 2000, q: 0.6, type: 'highpass', at: i * 0.06 }); },
    party() { this.fanfare(); for (let i = 0; i < 4; i++) noise({ d: 0.06, vol: 0.08, freq: 5000, q: 0.5, type: 'highpass', at: 0.5 + i * 0.05 }); },
  };

  function play(name, arg) {
    if (!on() || document.visibilityState === 'hidden' || !SOUNDS[name]) return;
    try { SOUNDS[name](arg); } catch (e) { /* no audio here; that's fine */ }
  }
  SP.sound = { play, SOUNDS, supported: () => !!(window.AudioContext || window.webkitAudioContext) };

  // Things the rest of the page reports.
  SP.on('stat', ({ name, by }) => { if (name === 'done' && by > 0) play('tick'); if (name === 'dares') play('win'); });
  SP.on('achievement', () => setTimeout(() => play('fanfare'), 300));
})(window.SP = window.SP || {});
