/* v2 modules: Focus, Countdown, Calendar, World clocks, News, Habits, Forecast, Repo vitals. */
(function (SP) {
  'use strict';
  const { esc, uid, ago, menu, form, toast, confirm, host } = SP.ui;
  const I = SP.icon;
  const S = () => SP.store.state;
  const save = () => SP.store.save();
  const rerender = (id) => SP.app.renderWidget(id);
  const t = (k, ctx) => SP.voice.t(k, ctx);
  const head = SP.widgetHead;
  const W = SP.widgets;

  const pad = (n) => String(n).padStart(2, '0');
  const dkey = (d) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const fromKey = (k) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
  const today0 = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
  const daysUntil = (k) => Math.round((fromKey(k) - today0()) / 864e5);
  const fmtDate = (k, opts) => fromKey(k).toLocaleDateString(undefined, opts || { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

  /* ======================= Focus (Pomodoro) ======================= */
  const MODES = { work: 'Focus', short: 'Short break', long: 'Long break' };
  let audioCtx = null;
  function chime() {
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      [659.25, 783.99, 1046.5].forEach((f, i) => {
        const o = audioCtx.createOscillator(), g = audioCtx.createGain(), at = audioCtx.currentTime + i * 0.18;
        o.type = 'sine'; o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(0.25, at + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, at + 0.9);
        o.connect(g).connect(audioCtx.destination); o.start(at); o.stop(at + 1);
      });
    } catch (e) { /* audio unavailable */ }
  }
  const run = () => S().focusRun;
  const dur = (m) => (S().focus[m === 'work' ? 'work' : m === 'short' ? 'short' : 'long'] || 1) * 60e3;
  const remaining = () => (run().endsAt ? Math.max(0, run().endsAt - Date.now()) : run().remaining != null ? run().remaining : dur(run().mode));
  const mmss = (ms) => { const s = Math.ceil(ms / 1000); return pad(Math.floor(s / 60)) + ':' + pad(s % 60); };
  const RING = 2 * Math.PI * 52;
  let lastTitle = '';

  W.focus = {
    title: 'Focus', icon: 'timer',
    render() {
      const r = run(), rem = remaining(), prog = 1 - rem / dur(r.mode), running = !!r.endsAt;
      const n = S().focusLog[dkey(new Date())] || 0;
      return head('timer', t('focusTitle'), '<button class="icon-btn" data-f="settings" aria-label="Timer settings">' + I('customize', 16) + '</button>') +
        '<div class="focus mode-' + r.mode + (running ? ' running' : '') + '">' +
        '<div class="focus-ring"><svg viewBox="0 0 120 120" aria-hidden="true"><circle class="fr-bg" cx="60" cy="60" r="52"/>' +
        '<circle class="fr-fg" cx="60" cy="60" r="52" stroke-dasharray="' + RING.toFixed(1) + '" stroke-dashoffset="' + (RING * (1 - prog)).toFixed(1) + '" data-focus-ring/></svg>' +
        '<div class="fr-center"><b data-focus-time>' + mmss(rem) + '</b><small>' + esc(t('mode_' + r.mode)) + '</small></div></div>' +
        '<div class="focus-side">' +
        '<div class="seg small" role="radiogroup" aria-label="Timer mode">' + Object.keys(MODES).map((m) => '<button role="radio" aria-checked="' + (r.mode === m) + '" data-f="mode" data-m="' + m + '">' + (m === 'work' ? 'Focus' : m === 'short' ? 'Short' : 'Long') + '</button>').join('') + '</div>' +
        '<div class="focus-btns"><button class="btn primary" data-f="toggle">' + I(running ? 'pause' : 'play', 16) + (running ? 'Pause' : r.remaining != null && r.remaining < dur(r.mode) ? 'Resume' : 'Start') + '</button>' +
        '<button class="icon-btn boxed" data-f="reset" aria-label="Reset">' + I('reset', 16) + '</button><button class="icon-btn boxed" data-f="skip" aria-label="Skip to next">' + I('next', 16) + '</button></div>' +
        '<div class="focus-today" title="Focus sessions today">' + Array.from({ length: Math.max(S().focus.every, n) }, (_, i) => '<i class="' + (i < n ? 'on' : '') + '"></i>').join('') + '<span>' + esc(t('focusToday', { n })) + '</span></div>' +
        '</div></div>';
    },
    mount(el) {
      el.querySelectorAll('[data-f]').forEach((b) => b.onclick = () => {
        const a = b.dataset.f;
        if (a === 'toggle') this.toggle();
        if (a === 'reset') this.reset();
        if (a === 'skip') this.complete(true);
        if (a === 'mode') { this.setMode(b.dataset.m); }
        if (a === 'settings') this.settings();
      });
    },
    toggle() {
      const r = run();
      if (r.endsAt) { r.remaining = remaining(); r.endsAt = null; }
      else {
        r.endsAt = Date.now() + remaining(); r.remaining = null;
        if (!audioCtx) { try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { /* none */ } }
        if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission().catch(() => {});
      }
      save(); rerender('focus');
    },
    reset() { const r = run(); r.endsAt = null; r.remaining = null; save(); rerender('focus'); this.title_(); },
    setMode(m) { const r = run(); r.mode = m; r.endsAt = null; r.remaining = null; save(); rerender('focus'); this.title_(); },
    complete(skipped) {
      const r = run(), was = r.mode;
      if (!skipped) {
        chime();
        const msg = was === 'work' ? t('focusDone') : t('breakDone');
        toast(msg);
        if ('Notification' in window && Notification.permission === 'granted' && document.visibilityState !== 'visible') {
          try { new Notification(was === 'work' ? 'Focus session complete' : 'Break over', { body: msg, icon: 'icon.svg' }); } catch (e) { /* ignore */ }
        }
      }
      if (was === 'work') {
        if (!skipped) { const k = dkey(new Date()); S().focusLog[k] = (S().focusLog[k] || 0) + 1; }
        r.cycle = (r.cycle || 0) + 1;
        r.mode = r.cycle % S().focus.every === 0 ? 'long' : 'short';
      } else r.mode = 'work';
      r.endsAt = null; r.remaining = null;
      if (S().focus.autoStart && !skipped) r.endsAt = Date.now() + dur(r.mode);
      save(); rerender('focus'); this.title_();
    },
    async settings() {
      const f = S().focus;
      const v = await form('Focus timer', [
        { name: 'work', label: 'Focus (minutes)', type: 'number', value: f.work },
        { name: 'short', label: 'Short break (minutes)', type: 'number', value: f.short },
        { name: 'long', label: 'Long break (minutes)', type: 'number', value: f.long },
        { name: 'every', label: 'Long break after this many sessions', type: 'number', value: f.every },
        { name: 'autoStart', label: 'Auto-start the next timer', type: 'select', value: f.autoStart ? '1' : '0', options: [{ value: '0', label: 'No' }, { value: '1', label: 'Yes' }] },
      ]);
      if (!v) return;
      const n = (x, lo, hi, d) => { x = Math.round(+x); return x >= lo && x <= hi ? x : d; };
      Object.assign(f, { work: n(v.work, 1, 180, 25), short: n(v.short, 1, 60, 5), long: n(v.long, 1, 90, 15), every: n(v.every, 1, 12, 4), autoStart: v.autoStart === '1' });
      if (!run().endsAt) run().remaining = null;
      save(); rerender('focus');
    },
    title_() {
      const r = run();
      const want = r.endsAt ? mmss(remaining()) + ' · ' + MODES[r.mode] : 'New Tab';
      if (want !== lastTitle) { document.title = want; lastTitle = want; }
    },
    tick() {
      const r = run();
      if (r.endsAt && Date.now() >= r.endsAt) return this.complete(false);
      if (!r.endsAt) return;
      const rem = remaining();
      document.querySelectorAll('[data-focus-time]').forEach((n) => (n.textContent = mmss(rem)));
      document.querySelectorAll('[data-focus-ring]').forEach((n) => n.setAttribute('stroke-dashoffset', (RING * (rem / dur(r.mode))).toFixed(1)));
      this.title_();
    },
  };

  /* ======================= Countdown ======================= */
  W.countdown = {
    title: 'Countdowns', icon: 'flag',
    render() {
      const list = S().countdowns.slice().sort((a, b) => a.date.localeCompare(b.date));
      const up = list.filter((c) => daysUntil(c.date) >= 0), past = list.filter((c) => daysUntil(c.date) < 0).slice(-2);
      const hero = up[0];
      const big = (c) => {
        const n = daysUntil(c.date), total = Math.max(1, (fromKey(c.date) - fromKey(c.created || dkey(new Date()))) / 864e5);
        const pct = Math.min(100, Math.max(0, (1 - n / total) * 100));
        return '<div class="cd-hero" data-cd="' + c.id + '"><div class="cd-num"><b>' + (n === 0 ? '🎉' : n) + '</b><span>' + esc(n === 0 ? t('cdToday') : n === 1 ? t('cdTomorrow') : t('cdDays')) + '</span></div>' +
          '<div class="cd-info"><strong>' + esc(c.title) + '</strong><small>' + esc(fmtDate(c.date)) + '</small><div class="cd-bar"><i style="width:' + pct.toFixed(1) + '%"></i></div></div></div>';
      };
      const row = (c) => { const n = daysUntil(c.date); return '<li data-cd="' + c.id + '" class="' + (n < 0 ? 'past' : '') + '"><span>' + esc(c.title) + '</span><small>' + esc(fmtDate(c.date, { month: 'short', day: 'numeric', year: 'numeric' })) + '</small><b>' + (n < 0 ? Math.abs(n) + 'd ago' : n === 0 ? 'today' : n + 'd') + '</b></li>'; };
      return head('flag', t('cdTitle'), '<button class="icon-btn" data-cd-add aria-label="Add countdown">' + I('plus', 20) + '</button>') +
        (hero ? big(hero) : '<div class="empty muted">' + esc(t('cdEmpty')) + '</div>') +
        (up.length > 1 || past.length ? '<ul class="cd-list">' + up.slice(1).map(row).join('') + past.map(row).join('') + '</ul>' : '');
    },
    mount(el) {
      el.querySelector('[data-cd-add]').onclick = () => this.add();
      el.querySelectorAll('[data-cd]').forEach((n) => {
        const open = (e) => {
          e.preventDefault();
          const c = S().countdowns.find((x) => x.id === n.dataset.cd);
          menu(n, [
            { icon: 'edit', label: 'Edit', action: () => this.add(c) },
            { icon: 'trash', label: 'Delete', danger: true, action: () => { S().countdowns = S().countdowns.filter((x) => x !== c); save(); rerender('countdown'); rerender('calendar'); } },
          ]);
        };
        n.addEventListener('contextmenu', open);
        n.addEventListener('click', open);
      });
    },
    async add(c, date) {
      const v = await form(c ? 'Edit countdown' : 'New countdown', [
        { name: 'title', label: 'What’s happening?', value: c ? c.title : '', required: true, placeholder: 'Launch day' },
        { name: 'date', label: 'Date', type: 'date', value: c ? c.date : date || '', required: true },
      ], { okText: c ? 'Save' : 'Add' });
      if (!v || !v.date) return;
      if (c) Object.assign(c, { title: v.title.trim(), date: v.date });
      else S().countdowns.push({ id: uid(), title: v.title.trim(), date: v.date, created: dkey(new Date()) });
      save(); rerender('countdown'); rerender('calendar');
    },
  };

  /* ======================= Calendar ======================= */
  W.calendar = {
    title: 'Calendar', icon: 'calendar', offset: 0,
    render() {
      const now = new Date(), base = new Date(now.getFullYear(), now.getMonth() + this.offset, 1);
      const ws = S().weekStart, first = new Date(base);
      first.setDate(1 - ((base.getDay() - ws + 7) % 7));
      const events = {};
      S().countdowns.forEach((c) => { (events[c.date] = events[c.date] || []).push(c.title); });
      const names = Array.from({ length: 7 }, (_, i) => new Date(2024, 0, 7 + ws + i).toLocaleDateString(undefined, { weekday: 'narrow' }));
      let cells = '';
      for (let w = 0; w < 6; w++) {
        const wkDate = new Date(first); wkDate.setDate(first.getDate() + w * 7);
        if (w > 3 && wkDate.getMonth() !== base.getMonth()) break;
        cells += '<span class="cal-wk">' + SP.isoWeek(new Date(wkDate.getFullYear(), wkDate.getMonth(), wkDate.getDate() + (ws === 1 ? 0 : 1))) + '</span>';
        for (let d = 0; d < 7; d++) {
          const day = new Date(first); day.setDate(first.getDate() + w * 7 + d);
          const k = dkey(day), ev = events[k];
          cells += '<button class="cal-d' + (day.getMonth() !== base.getMonth() ? ' out' : '') + (k === dkey(now) ? ' today' : '') + (ev ? ' ev' : '') + '" data-day="' + k + '"' +
            (ev ? ' title="' + esc(ev.join(', ')) + '"' : '') + '>' + day.getDate() + '</button>';
        }
      }
      return head('calendar', base.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }),
        (this.offset ? '<button class="btn small ghost" data-cal="0">Today</button>' : '') +
        '<button class="icon-btn" data-cal="-1" aria-label="Previous month"><span class="flip">' + I('chev', 16) + '</span></button><button class="icon-btn" data-cal="1" aria-label="Next month">' + I('chev', 16) + '</button>') +
        '<div class="cal"><span class="cal-h">Wk</span>' + names.map((n) => '<span class="cal-h">' + esc(n) + '</span>').join('') + cells + '</div>';
    },
    mount(el) {
      el.querySelectorAll('[data-cal]').forEach((b) => b.onclick = () => { const v = +b.dataset.cal; this.offset = v === 0 ? 0 : this.offset + v; rerender('calendar'); });
      el.querySelectorAll('[data-day]').forEach((b) => b.onclick = () => {
        const k = b.dataset.day, evs = S().countdowns.filter((c) => c.date === k);
        menu(b, evs.map((c) => ({ icon: 'flag', label: c.title, action: () => W.countdown.add(c) })).concat(evs.length ? [{ sep: true }] : [],
          [{ icon: 'plus', label: 'Add countdown here', action: () => W.countdown.add(null, k) }]), { title: fmtDate(k) });
      });
    },
  };

  /* ======================= World clocks ======================= */
  function tzParts(tz, d) {
    try {
      const f = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
      const p = Object.fromEntries(f.formatToParts(d).map((x) => [x.type, x.value]));
      return { date: p.year + '-' + p.month + '-' + p.day, h: +p.hour, m: +p.minute };
    } catch (e) { return null; }
  }
  function offsetLabel(tz) {
    const now = new Date(), a = tzParts(tz, now), b = tzParts(undefined, now) || { date: dkey(now), h: now.getHours(), m: now.getMinutes() };
    if (!a) return '';
    let diff = (fromKey(a.date) - fromKey(b.date)) / 6e4 + (a.h - b.h) * 60 + (a.m - b.m);
    const day = a.date === b.date ? 'Today' : a.date > b.date ? 'Tomorrow' : 'Yesterday';
    if (diff === 0) return day + ', same time';
    const sign = diff > 0 ? '+' : '−'; diff = Math.abs(diff);
    return day + ', ' + sign + Math.floor(diff / 60) + (diff % 60 ? ':' + pad(diff % 60) : '') + 'h';
  }
  const clockTime = (tz) => new Date().toLocaleTimeString([], { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: !S().clock24 });
  W.worldclock = {
    title: 'World clocks', icon: 'globe',
    render() {
      const list = S().clocks;
      return head('globe', t('w_worldclock'), '<button class="icon-btn" data-wc-add aria-label="Add clock">' + I('plus', 20) + '</button>') +
        (list.length ? '<ul class="wc-list">' + list.map((c, i) => {
          const p = tzParts(c.tz, new Date()), day = p && p.h >= 7 && p.h < 19;
          return '<li data-i="' + i + '"><span class="wc-ic ' + (day ? 'day' : 'night') + '">' + I(day ? 'sun' : 'moon', 16) + '</span><span class="wc-t"><b>' + esc(c.label) + '</b><small data-wc-off="' + esc(c.tz) + '">' + esc(offsetLabel(c.tz)) + '</small></span>' +
            '<span class="wc-time" data-wc="' + esc(c.tz) + '">' + esc(clockTime(c.tz)) + '</span></li>';
        }).join('') + '</ul>' : '<div class="empty muted">Add the time zones you work with.</div>');
    },
    mount(el) {
      el.querySelector('[data-wc-add]').onclick = () => this.add();
      el.querySelectorAll('.wc-list li').forEach((li) => li.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        const i = +li.dataset.i;
        menu(li, [
          { icon: 'arrowUp', label: 'Move up', action: () => { if (i > 0) { const c = S().clocks; c.splice(i - 1, 0, c.splice(i, 1)[0]); save(); rerender('worldclock'); } } },
          { icon: 'trash', label: 'Remove', danger: true, action: () => { S().clocks.splice(i, 1); save(); rerender('worldclock'); } },
        ]);
      }));
    },
    async add() {
      const zones = (Intl.supportedValuesOf ? Intl.supportedValuesOf('timeZone') : []);
      const v = await SP.ui.dialog('Add world clock',
        '<label class="field"><span>Time zone</span><input name="tz" list="tz-list" placeholder="Europe/Oslo" required autocomplete="off"></label>' +
        '<datalist id="tz-list">' + zones.map((z) => '<option value="' + esc(z) + '">').join('') + '</datalist>' +
        '<label class="field"><span>Label (optional)</span><input name="label" placeholder="Oslo office"></label>', { okText: 'Add' });
      if (!v) return;
      const tz = v.tz.trim();
      if (!tzParts(tz, new Date())) return toast('Unknown time zone: ' + tz);
      S().clocks.push({ tz, label: v.label.trim() || tz.split('/').pop().replace(/_/g, ' ') }); save(); rerender('worldclock');
    },
    tick() {
      document.querySelectorAll('[data-wc]').forEach((n) => { const v = clockTime(n.dataset.wc); if (n.textContent !== v) n.textContent = v; });
      if (new Date().getSeconds() === 0) document.querySelectorAll('[data-wc-off]').forEach((n) => (n.textContent = offsetLabel(n.dataset.wcOff)));
    },
  };

  /* ======================= News (Hacker News / dev.to) ======================= */
  const SOURCES = {
    hn: {
      name: 'Hacker News', url: 'https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=12',
      map: (d) => d.hits.map((h) => ({ title: h.title, url: h.url || 'https://news.ycombinator.com/item?id=' + h.objectID, site: h.url ? host(h.url) : 'news.ycombinator.com',
        points: h.points, comments: h.num_comments, discuss: 'https://news.ycombinator.com/item?id=' + h.objectID, time: h.created_at })),
    },
    devto: {
      name: 'dev.to', url: 'https://dev.to/api/articles?top=2&per_page=12',
      map: (d) => d.map((a) => ({ title: a.title, url: a.url, site: (a.tag_list || []).slice(0, 2).map((x) => '#' + x).join(' ') || 'dev.to',
        points: a.public_reactions_count, comments: a.comments_count, discuss: a.url + '#comments', time: a.published_at })),
    },
  };
  const newsState = {};
  W.news = {
    title: 'News', icon: 'news',
    render() {
      const src = S().newsSource, st = newsState[src] || {};
      let body;
      if (st.items) body = '<ol class="news-list">' + st.items.slice(0, 10).map((n) => '<li><a href="' + esc(n.url) + '" class="news-t">' + esc(n.title) + '</a>' +
        '<span class="news-meta"><span>' + esc(n.site) + '</span> · <span>' + (n.points || 0) + ' ' + (src === 'hn' ? 'pts' : '♥') + '</span> · <a href="' + esc(n.discuss) + '">' + (n.comments || 0) + ' ' + I('message', 12) + '</a> · <time>' + ago(n.time) + '</time></span></li>').join('') + '</ol>';
      else body = '<div class="empty">' + (st.error ? '<span>' + esc(st.error) + '</span><button class="btn small" data-news-retry>Retry</button>' : '<span class="muted">Loading stories…</span>') + '</div>';
      return head('news', t('w_news'), '<div class="seg small" role="radiogroup" aria-label="Source">' + Object.entries(SOURCES).map(([k, s]) => '<button role="radio" aria-checked="' + (src === k) + '" data-src="' + k + '">' + s.name + '</button>').join('') + '</div>') + body;
    },
    mount(el) {
      el.querySelectorAll('[data-src]').forEach((b) => b.onclick = () => { S().newsSource = b.dataset.src; save(); rerender('news'); });
      const r = el.querySelector('[data-news-retry]'); if (r) r.onclick = () => this.load(true);
      const st = newsState[S().newsSource];
      if (!st || (!st.items && !st.loading && !st.error)) this.load();
    },
    async load(force) {
      const src = S().newsSource, key = 'news:' + src;
      newsState[src] = Object.assign(newsState[src] || {}, { loading: true, error: null });
      try {
        let items = !force && SP.store.cache.get(key, 15 * 60e3);
        if (!items) {
          const r = await fetch(SOURCES[src].url);
          if (!r.ok) throw new Error(SOURCES[src].name + ' returned ' + r.status);
          items = SOURCES[src].map(await r.json());
          SP.store.cache.set(key, items);
        }
        newsState[src].items = items;
      } catch (e) { newsState[src].error = 'Couldn’t load ' + SOURCES[src].name; console.warn(e); }
      newsState[src].loading = false;
      rerender('news');
    },
  };

  /* ======================= Habits ======================= */
  function streak(h) {
    let n = 0; const d = today0();
    if (!h.days[dkey(d)]) d.setDate(d.getDate() - 1); // today not done yet doesn't break the streak
    while (h.days[dkey(d)]) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }
  W.habits = {
    title: 'Habits', icon: 'activity',
    render() {
      const hs = S().habits, WEEKS = 18;
      const end = today0(), start = new Date(end);
      start.setDate(end.getDate() - ((end.getDay() - S().weekStart + 7) % 7) - (WEEKS - 1) * 7);
      let heat = '';
      for (let i = 0; i < WEEKS * 7; i++) {
        const d = new Date(start); d.setDate(start.getDate() + i);
        if (d > end) { heat += '<i class="fut"></i>'; continue; }
        const k = dkey(d), done = hs.filter((h) => h.days[k]).length, lvl = hs.length ? Math.ceil((done / hs.length) * 4) : 0;
        heat += '<i class="l' + lvl + '" title="' + esc(fmtDate(k, { month: 'short', day: 'numeric' }) + ': ' + done + '/' + hs.length) + '"></i>';
      }
      const last7 = Array.from({ length: 7 }, (_, i) => { const d = today0(); d.setDate(d.getDate() - 6 + i); return d; });
      return head('activity', t('habitsTitle'), '<button class="icon-btn" data-h-add aria-label="Add habit">' + I('plus', 20) + '</button>') +
        '<div class="habits"><div class="heat" style="--weeks:' + WEEKS + '" aria-label="Habit completion over the last ' + WEEKS + ' weeks">' + heat + '</div>' +
        '<ul class="habit-list">' + hs.map((h) => {
          const s = streak(h);
          return '<li data-h="' + h.id + '"><button class="habit-n" data-h-menu>' + esc(h.name) + '</button>' +
            '<span class="habit-s" title="' + esc(t('streak', { n: s })) + '">' + (s ? I('flame', 14) + s : '') + '</span><span class="habit-days">' +
            last7.map((d) => { const k = dkey(d); return '<button data-k="' + k + '" class="' + (h.days[k] ? 'on' : '') + (k === dkey(new Date()) ? ' today' : '') + '" aria-pressed="' + !!h.days[k] + '" title="' + esc(fmtDate(k, { weekday: 'long', month: 'short', day: 'numeric' })) + '">' + d.toLocaleDateString(undefined, { weekday: 'narrow' }) + '</button>'; }).join('') +
            '</span></li>';
        }).join('') + '</ul>' + (hs.length ? '' : '<div class="empty muted">' + esc(t('habitsEmpty')) + '</div>') + '</div>';
    },
    mount(el) {
      el.querySelector('[data-h-add]').onclick = () => this.add();
      el.querySelectorAll('.habit-list li').forEach((li) => {
        const h = S().habits.find((x) => x.id === li.dataset.h);
        li.querySelectorAll('[data-k]').forEach((b) => b.onclick = () => {
          const before = streak(h);
          if (h.days[b.dataset.k]) delete h.days[b.dataset.k]; else h.days[b.dataset.k] = 1;
          save(); rerender('habits');
          const after = streak(h);
          if (after > before && after > 1 && [3, 7, 14, 30, 50, 100, 365].includes(after)) toast(t('streakToast', { n: after, name: h.name }));
        });
        li.querySelector('[data-h-menu]').onclick = (e) => menu(e.currentTarget, [
          { icon: 'edit', label: 'Rename', action: async () => { const v = await form('Rename habit', [{ name: 'name', label: 'Name', value: h.name, required: true }]); if (v) { h.name = v.name.trim(); save(); rerender('habits'); } } },
          { icon: 'trash', label: 'Delete', danger: true, action: async () => { if (await confirm('Delete “' + h.name + '”?', 'Its history is removed too.', 'Delete')) { S().habits = S().habits.filter((x) => x !== h); save(); rerender('habits'); } } },
        ]);
      });
    },
    async add() {
      const v = await form('New habit', [{ name: 'name', label: 'Habit', required: true, placeholder: 'Practice guitar' }], { okText: 'Add' });
      if (v) { S().habits.push({ id: uid(), name: v.name.trim(), days: {} }); save(); rerender('habits'); }
    },
  };

  /* ======================= Forecast (detailed weather + air quality) ======================= */
  const AQI = [[20, 'Good', '#4ade80'], [40, 'Fair', '#a3e635'], [60, 'Moderate', '#facc15'], [80, 'Poor', '#fb923c'], [100, 'Very poor', '#f87171'], [1e9, 'Extremely poor', '#c084fc']];
  let aq = { data: null, loading: false };
  async function loadAir() {
    if (aq.loading) return;
    const s = S(), key = 'aq:' + s.location.lat.toFixed(2) + ',' + s.location.lon.toFixed(2);
    aq.loading = true;
    try {
      let d = SP.store.cache.get(key, 60 * 60e3);
      if (!d) {
        const r = await fetch('https://air-quality-api.open-meteo.com/v1/air-quality?latitude=' + s.location.lat + '&longitude=' + s.location.lon + '&current=european_aqi,pm2_5,pm10&timezone=auto');
        if (!r.ok) throw new Error(r.status);
        d = await r.json(); SP.store.cache.set(key, d);
      }
      aq.data = d;
    } catch (e) { aq.data = { error: true }; }
    aq.loading = false;
    rerender('forecast');
  }
  const compass = (deg) => ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.round(deg / 45) % 8];
  const hm = (iso) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: !S().clock24 });
  function chart(d) {
    const hrs = d.hourly, nowIdx = Math.max(0, hrs.time.findIndex((x) => x >= d.current.time.slice(0, 13)));
    const n = 24, temps = hrs.temperature_2m.slice(nowIdx, nowIdx + n), pp = hrs.precipitation_probability.slice(nowIdx, nowIdx + n), times = hrs.time.slice(nowIdx, nowIdx + n);
    if (temps.length < 2) return '';
    const Wd = 480, H = 130, top = 26, bot = 34, lo = Math.min(...temps) - 1, hi = Math.max(...temps) + 1;
    const x = (i) => 10 + (i / (temps.length - 1)) * (Wd - 20), y = (v) => top + (1 - (v - lo) / (hi - lo)) * (H - top - bot);
    const line = temps.map((v, i) => (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(v).toFixed(1)).join('');
    let s = '<svg class="fc-chart" viewBox="0 0 ' + Wd + ' ' + H + '" role="img" aria-label="Temperature for the next 24 hours">' +
      '<defs><linearGradient id="fcg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--accent)" stop-opacity=".45"/><stop offset="1" stop-color="var(--accent)" stop-opacity="0"/></linearGradient></defs>';
    pp.forEach((p, i) => { if (p > 5) { const bh = (p / 100) * 26; s += '<rect x="' + (x(i) - 5).toFixed(1) + '" y="' + (H - bot - bh).toFixed(1) + '" width="10" height="' + bh.toFixed(1) + '" rx="2" fill="#60a5fa" opacity=".55"><title>' + p + '% rain</title></rect>'; } });
    s += '<path d="' + line + 'L' + x(temps.length - 1).toFixed(1) + ' ' + (H - bot) + 'L' + x(0).toFixed(1) + ' ' + (H - bot) + 'Z" fill="url(#fcg)"/>' +
      '<path d="' + line + '" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>';
    for (let i = 0; i < temps.length; i += 3) {
      s += '<circle cx="' + x(i).toFixed(1) + '" cy="' + y(temps[i]).toFixed(1) + '" r="3" fill="var(--text)"/>' +
        '<text x="' + x(i).toFixed(1) + '" y="' + (y(temps[i]) - 9).toFixed(1) + '" text-anchor="middle" class="fc-tv">' + Math.round(temps[i]) + '°</text>' +
        '<text x="' + x(i).toFixed(1) + '" y="' + (H - 10) + '" text-anchor="middle" class="fc-tl">' + (i === 0 ? 'Now' : times[i].slice(11, 13) + (S().clock24 ? '' : '')) + '</text>';
    }
    return s + '</svg>';
  }
  W.forecast = {
    title: 'Forecast', icon: 'weather',
    render() {
      const d = W.weather.data;
      if (!d || !d.hourly) {
        const st = W.weather.state;
        return head('weather', t('w_forecast')) + '<div class="empty">' + (st && st.error ? '<span>' + esc(st.error) + '</span><button class="btn small" data-fc-retry>Retry</button>' : '<span class="muted">Loading forecast…</span>') + '</div>';
      }
      const c = d.current, dl = d.daily, wu = S().units === 'fahrenheit' ? 'mph' : 'km/h';
      const a = aq.data && aq.data.current, aqi = a && a.european_aqi != null ? AQI.find(([max]) => a.european_aqi <= max) : null;
      const stat = (icon, label, value, extra) => '<div class="fc-stat"' + (extra || '') + '>' + I(icon, 16) + '<span>' + esc(label) + '</span><b>' + value + '</b></div>';
      return head('weather', t('w_forecast') + ' · ' + S().location.name.split(',')[0]) +
        '<p class="fc-quip">' + esc(t('weatherQuip', { code: c.weather_code, temp: c.temperature_2m, units: S().units })) + '</p>' +
        chart(d) +
        '<div class="fc-stats">' +
        stat('weather', 'Feels like', Math.round(c.apparent_temperature) + '°') +
        stat('wind', 'Wind', Math.round(c.wind_speed_10m) + ' ' + wu + ' ' + compass(c.wind_direction_10m)) +
        stat('droplet', 'Humidity', Math.round(c.relative_humidity_2m) + '%') +
        stat('sun', 'UV today', dl.uv_index_max ? Math.round(dl.uv_index_max[0]) : '–') +
        stat('sunrise', 'Sunrise', hm(dl.sunrise[0])) +
        stat('sunset', 'Sunset', hm(dl.sunset[0])) +
        (aqi ? stat('leaf', 'Air quality', '<i class="aqi-dot" style="background:' + aqi[2] + '"></i>' + aqi[1] + ' · ' + Math.round(a.european_aqi), ' title="European AQI. PM2.5 ' + a.pm2_5 + ' µg/m³"') : '') +
        '</div>';
    },
    mount(el) {
      const r = el.querySelector('[data-fc-retry]'); if (r) r.onclick = () => W.weather.load(true);
      if (!W.weather.data && !(W.weather.state && (W.weather.state.loading || W.weather.state.error))) W.weather.load();
      if (!aq.data && !aq.loading) loadAir();
    },
    reset() { aq = { data: null, loading: false }; },
  };

  /* ======================= Repo vitals (lifecycle classification from Dead Repo) ======================= */
  const TH = { alive: 30, fading: 90, dead: 365 };
  function classify(r) {
    if (r.archived) return 'dead';
    const days = (Date.now() - new Date(r.pushed_at)) / 864e5;
    return days <= TH.alive ? 'alive' : days <= TH.fading ? 'fading' : days <= TH.dead ? 'flatlined' : 'dead';
  }
  function vitals(r, st) {
    const days = (Date.now() - new Date(r.pushed_at)) / 864e5;
    if (st === 'alive') return Math.max(40, Math.round(100 - days * 2));
    if (st === 'fading') return Math.round(Math.max(5, 38 - ((days - TH.alive) / (TH.fading - TH.alive)) * 33));
    return 0;
  }
  const STATES = ['alive', 'fading', 'flatlined', 'dead'];
  const STATE_COLORS = { alive: '#4ade80', fading: '#facc15', flatlined: '#fb923c', dead: '#71717a' };
  let rv = { data: null, loading: false, error: null };
  W.vitals = {
    title: 'Repo vitals', icon: 'gauge',
    render() {
      const user = S().github.user;
      if (!user) return head('gauge', t('vitalsTitle')) + '<div class="empty">Add your GitHub username to check on your repos.<button class="btn small" data-rv-setup>Connect GitHub</button></div>';
      if (!rv.data) return head('gauge', t('vitalsTitle')) + '<div class="empty">' + (rv.error ? '<span>' + esc(rv.error) + '</span><button class="btn small" data-rv-retry>Retry</button>' : '<span class="muted">Taking pulses…</span>') + '</div>';
      const repos = rv.data, counts = {}; STATES.forEach((s) => (counts[s] = 0));
      repos.forEach((r) => counts[r.state]++);
      const total = repos.length || 1;
      const watch = repos.filter((r) => r.state === 'fading' || r.state === 'flatlined').slice(0, 4);
      return head('gauge', t('vitalsTitle'), '<button class="icon-btn" data-rv-refresh aria-label="Refresh">' + I('sync', 16) + '</button>') +
        '<p class="rv-hero">' + esc(t('vitalsHero', { total: repos.length, dead: counts.dead, flatlined: counts.flatlined, alive: counts.alive })) + '</p>' +
        '<div class="rv-bar" role="img" aria-label="' + STATES.map((s) => counts[s] + ' ' + s).join(', ') + '">' + STATES.map((s) => counts[s] ? '<i style="flex:' + counts[s] + ';background:' + STATE_COLORS[s] + '" title="' + counts[s] + ' ' + esc(t('state_' + s)) + '"></i>' : '').join('') + '</div>' +
        '<ul class="rv-legend">' + STATES.map((s) => '<li><i style="background:' + STATE_COLORS[s] + '"></i>' + esc(t('state_' + s)) + ' <b>' + counts[s] + '</b></li>').join('') + '</ul>' +
        (watch.length ? '<h4 class="rv-sub">' + esc(t('vitalsWatch')) + '</h4><ul class="rv-list">' + watch.map((r) => '<li><a href="' + esc(r.html_url) + '"><span class="rv-dot" style="background:' + STATE_COLORS[r.state] + '"></span><span class="rv-name">' + esc(r.name) + '</span>' +
          '<span class="rv-pulse" title="Vitals ' + r.vitals + '/100"><i style="width:' + r.vitals + '%"></i></span><time>' + ago(r.pushed_at) + '</time></a></li>').join('') + '</ul>' : '') +
        '<p class="small muted rv-note">' + Math.round((counts.alive / total) * 100) + '% active · thresholds ' + TH.alive + ' / ' + TH.fading + ' / ' + TH.dead + ' days · forks excluded</p>';
    },
    mount(el) {
      const on = (s, fn) => { const n = el.querySelector(s); if (n) n.onclick = fn; };
      on('[data-rv-setup]', () => SP.panel.open('settings', 'github'));
      on('[data-rv-retry]', () => this.load(true));
      on('[data-rv-refresh]', () => this.load(true));
      if (S().github.user && !rv.data && !rv.loading && !rv.error) this.load();
    },
    async load(force) {
      const { user, token } = S().github, key = 'rv:' + user + ':' + (token ? 1 : 0);
      rv = { data: force ? null : rv.data, loading: true, error: null };
      try {
        let repos = !force && SP.store.cache.get(key, 30 * 60e3);
        if (!repos) {
          const h = { Accept: 'application/vnd.github+json' };
          if (token) h.Authorization = 'Bearer ' + token;
          // With a token, /user/repos includes private repos you own.
          const url = token ? 'https://api.github.com/user/repos?per_page=100&sort=pushed&affiliation=owner' : 'https://api.github.com/users/' + encodeURIComponent(user) + '/repos?per_page=100&sort=pushed';
          const r = await fetch(url, { headers: h });
          if (!r.ok) throw new Error(r.status === 403 || r.status === 429 ? 'GitHub rate limit hit, add a token in Settings' : 'GitHub returned ' + r.status);
          repos = (await r.json()).filter((x) => !x.fork).map((x) => ({ name: x.name, html_url: x.html_url, pushed_at: x.pushed_at, archived: x.archived }));
          SP.store.cache.set(key, repos);
        }
        rv.data = repos.map((r) => { const st = classify(r); return Object.assign({}, r, { state: st, vitals: vitals(r, st) }); });
      } catch (e) { rv.error = e.message || 'Couldn’t reach GitHub'; }
      rv.loading = false;
      rerender('vitals');
    },
    reset() { rv = { data: null, loading: false, error: null }; },
  };

  Object.assign(SP.widgetMeta, {
    focus: { title: 'Focus', icon: 'timer' }, countdown: { title: 'Countdowns', icon: 'flag' }, calendar: { title: 'Calendar', icon: 'calendar' },
    worldclock: { title: 'World clocks', icon: 'globe' }, news: { title: 'News', icon: 'news' }, habits: { title: 'Habits', icon: 'activity' },
    forecast: { title: 'Forecast', icon: 'weather' }, vitals: { title: 'Repo vitals', icon: 'gauge' },
  });
  SP.widgetOrder.push('forecast', 'focus', 'calendar', 'countdown', 'worldclock', 'habits', 'news', 'vitals');
})(window.SP = window.SP || {});
