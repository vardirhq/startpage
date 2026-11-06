/* State, persistence (localStorage), a small TTL cache and an IndexedDB blob store. */
(function (SP) {
  'use strict';
  const KEY = 'startpage.state.v1';
  const bm = (title, url) => ({ title, url });

  const DEFAULTS = {
    name: 'Christoffer',
    tagline: 'Code · Create · Play · Repeat',
    theme: 'midnight', seed: 7, accent: '#a78bfa', layout: 'grid', customBg: false,
    showGreeting: true, clock24: true, units: 'celsius', favicons: true,
    location: { name: 'Halden, Norway', lat: 59.1229, lon: 11.3875 },
    engine: 'google',
    github: { user: '', token: '' },
    activeSpace: 'home',
    spaces: [
      { id: 'home', name: 'Home', icon: 'home', widgets: ['search', 'clock', 'weather', 'github', 'bookmarks', 'tasks', 'notes', 'music', 'quote'] },
      { id: 'work', name: 'Work', icon: 'laptop', widgets: ['search', 'clock', 'worldclock', 'calendar', 'focus', 'tasks', 'notes', 'forecast', 'countdown', 'bookmarks'] },
      { id: 'gaming', name: 'Gaming', icon: 'gamepad', widgets: ['search', 'clock', 'countdown', 'bookmarks', 'music', 'quote'] },
      { id: 'dev', name: 'Dev', icon: 'code', widgets: ['search', 'github', 'news', 'vitals', 'focus', 'habits', 'tasks', 'notes', 'bookmarks'] },
    ],
    bookmarks: {
      folders: [
        { name: 'Development', items: [bm('GitHub', 'https://github.com'), bm('MDN Web Docs', 'https://developer.mozilla.org'), bm('Can I use', 'https://caniuse.com'), bm('regex101', 'https://regex101.com')] },
        { name: 'Games', items: [bm('Steam', 'https://store.steampowered.com'), bm('itch.io', 'https://itch.io'), bm('Lospec', 'https://lospec.com')] },
        { name: 'Tools', items: [bm('Excalidraw', 'https://excalidraw.com'), bm('Squoosh', 'https://squoosh.app'), bm('Photopea', 'https://www.photopea.com')] },
        { name: 'Media', items: [bm('YouTube', 'https://www.youtube.com'), bm('Spotify', 'https://open.spotify.com'), bm('Twitch', 'https://www.twitch.tv')] },
      ],
      tiles: [bm('GitHub', 'https://github.com'), bm('YouTube', 'https://www.youtube.com'), bm('Gmail', 'https://mail.google.com'), bm('Drive', 'https://drive.google.com'),
        bm('Notion', 'https://www.notion.so'), bm('Blender', 'https://www.blender.org'), bm('Figma', 'https://www.figma.com')],
    },
    tasks: [
      { id: 't1', text: 'Finish Lamplighter level', done: false },
      { id: 't2', text: 'Review Sound Lab PR', done: true },
      { id: 't3', text: 'Order roof box', done: false },
      { id: 't4', text: 'Birthday gift for Alma', done: false },
    ],
    notes: 'Ideas: particle lab, normal map\nCall service (Kuga)\nPlan Denmark summer 2027\nUpdate CV',
    tracks: [],
    liked: [],
    // v2 modules
    version: 2,
    animate: true,
    voice: 'neutral',
    showSummary: false,
    weekStart: 1,
    focus: { work: 25, short: 5, long: 15, every: 4, autoStart: false },
    focusRun: { mode: 'work', endsAt: null, remaining: null, cycle: 0 },
    focusLog: {},
    countdowns: [
      { id: 'c1', title: 'Christmas Eve', date: '2026-12-24', created: '2026-11-01' },
      { id: 'c2', title: 'Denmark summer trip', date: '2027-07-01', created: '2026-11-01' },
    ],
    clocks: [
      { tz: 'America/New_York', label: 'New York' },
      { tz: 'Europe/London', label: 'London' },
      { tz: 'Asia/Tokyo', label: 'Tokyo' },
    ],
    newsSource: 'hn',
    habits: [
      { id: 'h1', name: 'Code 30 min', days: {} },
      { id: 'h2', name: 'Workout', days: {} },
      { id: 'h3', name: 'Read', days: {} },
    ],
    sync: { gistId: '', auto: true, lastSync: 0 },
    presence: {},
    updatedAt: 0,
  };

  const clone = (o) => JSON.parse(JSON.stringify(o));
  function merge(base, saved) {
    if (!saved || typeof saved !== 'object') return base;
    for (const k of Object.keys(saved)) {
      const a = base[k], b = saved[k];
      if (a && b && typeof a === 'object' && typeof b === 'object' && !Array.isArray(a) && !Array.isArray(b)) base[k] = merge(a, b);
      else base[k] = b;
    }
    return base;
  }

  let state, raw = null;
  try { raw = JSON.parse(localStorage.getItem(KEY)); } catch (e) { /* corrupt */ }
  try { state = merge(clone(DEFAULTS), raw); } catch (e) { state = clone(DEFAULTS); }

  /* One-time migration for people who used v1: add the new modules to the built-in spaces. */
  if (raw && (raw.version || 1) < 2) {
    const add = { work: ['worldclock', 'calendar', 'focus', 'forecast', 'countdown'], gaming: ['countdown'], dev: ['news', 'vitals', 'focus', 'habits'] };
    state.spaces.forEach((sp) => (add[sp.id] || []).forEach((w) => { if (!sp.widgets.includes(w)) sp.widgets.push(w); }));
    state.version = 2;
  }

  const listeners = [];
  let timer;
  function save(opts) {
    // Monotonic: an edit is always newer than whatever we last pulled, even if another device's clock runs ahead.
    if (!(opts && opts.quiet)) { state.updatedAt = Math.max(Date.now(), (state.updatedAt || 0) + 1); listeners.forEach((fn) => fn()); }
    clearTimeout(timer);
    timer = setTimeout(() => {
      try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { console.warn('startpage: could not save', e); }
    }, 120);
  }

  const cache = {
    get(key, maxAgeMs) {
      try {
        const v = JSON.parse(localStorage.getItem('startpage.cache.' + key));
        if (v && Date.now() - v.t < maxAgeMs) return v.data;
      } catch (e) { /* ignore */ }
      return null;
    },
    set(key, data) { try { localStorage.setItem('startpage.cache.' + key, JSON.stringify({ t: Date.now(), data })); } catch (e) { /* full */ } },
    clear(key) { try { localStorage.removeItem('startpage.cache.' + key); } catch (e) { /* ignore */ } },
  };

  /* IndexedDB is used for the custom background image (too big for localStorage). */
  function db() {
    return new Promise((res, rej) => {
      const r = indexedDB.open('startpage', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('files');
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
  }
  const files = {
    async get(k) { const d = await db(); return new Promise((res, rej) => { const q = d.transaction('files').objectStore('files').get(k); q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error); }); },
    async set(k, v) { const d = await db(); return new Promise((res, rej) => { const t = d.transaction('files', 'readwrite'); t.objectStore('files').put(v, k); t.oncomplete = res; t.onerror = () => rej(t.error); }); },
    async del(k) { const d = await db(); return new Promise((res) => { const t = d.transaction('files', 'readwrite'); t.objectStore('files').delete(k); t.oncomplete = res; t.onerror = res; }); },
  };

  SP.store = {
    state, save, cache, files, DEFAULTS,
    onSave(fn) { listeners.push(fn); },
    reset() { localStorage.removeItem(KEY); files.del('bg').finally(() => location.reload()); },
    replace(obj) { localStorage.setItem(KEY, JSON.stringify(merge(clone(DEFAULTS), obj))); location.reload(); },
  };
})(window.SP = window.SP || {});
