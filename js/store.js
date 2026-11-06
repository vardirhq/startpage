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
      { id: 'work', name: 'Work', icon: 'laptop', widgets: ['search', 'clock', 'weather', 'tasks', 'notes', 'bookmarks'] },
      { id: 'gaming', name: 'Gaming', icon: 'gamepad', widgets: ['search', 'clock', 'bookmarks', 'music', 'quote'] },
      { id: 'dev', name: 'Dev', icon: 'code', widgets: ['search', 'github', 'bookmarks', 'tasks', 'notes'] },
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

  let state;
  try { state = merge(clone(DEFAULTS), JSON.parse(localStorage.getItem(KEY))); } catch (e) { state = clone(DEFAULTS); }

  let timer;
  function save() {
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
    reset() { localStorage.removeItem(KEY); files.del('bg').finally(() => location.reload()); },
    replace(obj) { localStorage.setItem(KEY, JSON.stringify(merge(clone(DEFAULTS), obj))); location.reload(); },
  };
})(window.SP = window.SP || {});
