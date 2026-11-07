/* State, persistence (localStorage), a small TTL cache and an IndexedDB blob store. */
(function (SP) {
  'use strict';
  const KEY = 'startpage.state.v1';
  const bm = (title, url) => ({ title, url });
  const iso = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const today = iso(new Date()), nextNewYear = (new Date().getFullYear() + 1) + '-01-01';

  const DEFAULTS = {
    // Fresh installs get no personal data: an empty name, no location, and examples that explain themselves.
    name: '',
    tagline: '',
    theme: 'midnight', seed: 7, accent: '#a78bfa', layout: 'grid', customBg: false,
    showGreeting: true, clock24: true, units: 'celsius', favicons: true,
    location: null,
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
      { id: 't1', text: 'Set your name and location in Customize → You', done: false },
      { id: 't2', text: 'Double-click a task to edit it', done: false },
      { id: 't3', text: 'Tick this one off, then clear it with the bin', done: false },
      { id: 't4', text: 'Open your new startpage', done: true },
    ],
    notes: 'Click here to edit your notes\nEach line becomes a bullet\nType > in the search bar for commands\nTry 12*7 or 5 km to mi in search too',
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
      { id: 'c1', title: 'New Year', date: nextNewYear, created: today },
    ],
    clocks: [
      { tz: 'America/New_York', label: 'New York' },
      { tz: 'Europe/London', label: 'London' },
      { tz: 'Asia/Tokyo', label: 'Tokyo' },
    ],
    newsSource: 'hn',
    habits: [
      { id: 'h1', name: 'Read', days: {} },
      { id: 'h2', name: 'Move', days: {} },
      { id: 'h3', name: 'Drink water', days: {} },
    ],
    sync: { gistId: '', auto: true, lastSync: 0 },
    presence: {},
    stats: {},
    unlocked: [],
    achievements: {},
    totals: {},
    heckles: true,
    liveSky: true,
    seasons: true,
    speak: false,
    brief: true,
    dares: true,
    eggs: {},
    moods: {},
    since: [],
    fx: { amount: 100, from: 'EUR', to: 'USD' },
    customVoices: {},
    chaos: false,
    onboarded: false,
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

  // Anyone with saved data from before onboarding existed has already set the page up.
  if (raw && raw.onboarded === undefined) state.onboarded = true;
  if (raw && !raw.totals) { // lifetime counters for achievements, seeded from what's already there
    const t = state.totals = {}, st = state.stats || {};
    for (const d of Object.values(st)) for (const [k, v] of Object.entries(d)) t[k] = (t[k] || 0) + v;
    t.focus = Math.max(t.focus || 0, Object.values(state.focusLog || {}).reduce((a, b) => a + b, 0));
    t.done = Math.max(t.done || 0, (state.tasks || []).filter((x) => x.done).length);
    t.voices = [state.voice || 'neutral'];
  }
  if (raw && !raw.achievements) state._achQuiet = true; // existing data: award silently once

  const listeners = [];
  let timer = null, frozen = false; // frozen: a reset/import is reloading the page; don't write the old state back
  function save(opts) {
    // Monotonic: an edit is always newer than whatever we last pulled, even if another device's clock runs ahead.
    if (!(opts && opts.quiet)) { state.updatedAt = Math.max(Date.now(), (state.updatedAt || 0) + 1); listeners.forEach((fn) => fn()); }
    clearTimeout(timer);
    timer = setTimeout(flush, 120);
  }
  function flush() {
    if (frozen || timer === null) return;
    clearTimeout(timer); timer = null;
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { console.warn('startpage: could not save', e); }
  }
  // Saves are debounced; write any pending change before the page goes away so nothing is lost.
  addEventListener('pagehide', flush);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush(); });

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
    reset() { frozen = true; clearTimeout(timer); localStorage.removeItem(KEY); files.del('bg').finally(() => location.reload()); },
    replace(obj) { frozen = true; clearTimeout(timer); localStorage.setItem(KEY, JSON.stringify(merge(clone(DEFAULTS), obj))); location.reload(); },
  };
})(window.SP = window.SP || {});
