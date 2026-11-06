/* Widget implementations. Each widget has render() -> HTML and an optional mount(el). */
(function (SP) {
  'use strict';
  const { esc, uid, ago, favicon, normalizeUrl, menu, form, toast, confirm } = SP.ui;
  const I = SP.icon;
  const S = () => SP.store.state;
  const save = () => SP.store.save();
  const rerender = (id) => SP.app.renderWidget(id);

  const head = (icon, title, actions, extra) =>
    '<header class="card-head"><span class="ch-icon ch-' + icon + '">' + I(icon, 20) + '</span><h3>' + esc(title) + '</h3>' + (extra || '') +
    '<div class="ch-actions">' + (actions || '') + '<span class="drag-grip" title="Drag to reorder">' + I('grip', 16) + '</span></div></header>';

  const W = {};

  /* ---------------- Clock ---------------- */
  function fmtTime(d) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: !S().clock24 }).replace(/\s?(AM|PM)$/i, '<small>$1</small>');
  }
  // With no location set, label the clock with the browser's own time zone ("Europe/Oslo" -> "Oslo").
  function localZone() {
    try { return Intl.DateTimeFormat().resolvedOptions().timeZone.split('/').pop().replace(/_/g, ' '); } catch (e) { return 'Local time'; }
  }
  SP.localZone = localZone;
  W.clock = {
    title: 'Clock', icon: 'clock',
    render() {
      return '<canvas class="card-trees" width="200" height="44" aria-hidden="true"></canvas>' +
        '<div class="clock-time" data-clock>' + fmtTime(new Date()) + '</div>' +
        '<div class="clock-loc">' + I('pin', 18) + '<span>' + esc(S().location ? S().location.name : localZone()) + '</span></div>' +
        '<span class="drag-grip floating" title="Drag to reorder">' + I('grip', 16) + '</span>';
    },
    mount(el) { SP.scene.renderTrees(el.querySelector('canvas'), S().theme, S().seed); },
    tick() { document.querySelectorAll('[data-clock]').forEach((n) => { const v = fmtTime(new Date()); if (n.innerHTML !== v) n.innerHTML = v; }); },
  };

  /* ---------------- Weather (Open-Meteo, no key) ---------------- */
  const WX = { 0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Mostly cloudy', 45: 'Fog', 48: 'Rime fog', 51: 'Light drizzle', 53: 'Drizzle', 55: 'Heavy drizzle',
    56: 'Freezing drizzle', 57: 'Freezing drizzle', 61: 'Light rain', 63: 'Rain', 65: 'Heavy rain', 66: 'Freezing rain', 67: 'Freezing rain', 71: 'Light snow', 73: 'Snow',
    75: 'Heavy snow', 77: 'Snow grains', 80: 'Rain showers', 81: 'Rain showers', 82: 'Heavy showers', 85: 'Snow showers', 86: 'Snow showers', 95: 'Thunderstorm', 96: 'Thunderstorm', 99: 'Thunderstorm' };
  function wxKind(code, day) {
    if (code <= 1) return day === 0 ? 'moon' : 'sun';
    if (code === 2) return day === 0 ? 'moon-cloud' : 'partly';
    if (code === 3) return 'partly';
    if (code === 45 || code === 48) return 'fog';
    if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return 'rain';
    if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snow';
    if (code >= 95) return 'storm';
    return 'cloud';
  }
  function wxIcon(kind, size) {
    const cloud = (t) => '<path transform="' + (t || '') + '" d="M15 38h20a8 8 0 0 0 .6-16A11 11 0 0 0 14.4 22 8 8 0 0 0 15 38z" fill="rgba(255,255,255,.08)" stroke="#f4f2ff" stroke-width="2.6" stroke-linejoin="round"/>';
    const sun = (cx, cy, r) => {
      let rays = '';
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4, x1 = cx + Math.cos(a) * (r + 3.5), y1 = cy + Math.sin(a) * (r + 3.5), x2 = cx + Math.cos(a) * (r + 7.5), y2 = cy + Math.sin(a) * (r + 7.5);
        rays += '<path d="M' + x1.toFixed(1) + ' ' + y1.toFixed(1) + 'L' + x2.toFixed(1) + ' ' + y2.toFixed(1) + '"/>';
      }
      return '<g stroke="#fbbf24" stroke-width="2.6" stroke-linecap="round" fill="none"><circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="rgba(251,191,36,.25)"/>' + rays + '</g>';
    };
    const moon = (cx, cy, s) => '<path transform="translate(' + cx + ' ' + cy + ') scale(' + s + ')" d="M6-9A10 10 0 1 0 9 6 8 8 0 0 1 6-9z" fill="rgba(233,227,255,.2)" stroke="#e9e3ff" stroke-width="2.4" stroke-linejoin="round"/>';
    const drops = (c, kind2) => kind2 === 'snow'
      ? '<g fill="#f4f2ff"><circle cx="18" cy="43" r="1.8"/><circle cx="25" cy="45" r="1.8"/><circle cx="32" cy="43" r="1.8"/></g>'
      : '<g stroke="' + c + '" stroke-width="2.6" stroke-linecap="round"><path d="M18 41l-2 5M25 41l-2 5M32 41l-2 5"/></g>';
    let b;
    switch (kind) {
      case 'sun': b = sun(24, 24, 9); break;
      case 'moon': b = moon(24, 24, 1.3); break;
      case 'partly': b = sun(30, 17, 7) + cloud('translate(-4 2)'); break;
      case 'moon-cloud': b = moon(31, 16, 0.9) + cloud('translate(-4 2)'); break;
      case 'rain': b = cloud('translate(0 -4)') + drops('#60a5fa'); break;
      case 'snow': b = cloud('translate(0 -4)') + drops('', 'snow'); break;
      case 'storm': b = cloud('translate(0 -5)') + '<path d="M26 34l-5 8h6l-3 6" stroke="#fbbf24" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'; break;
      case 'fog': b = '<g stroke="#f4f2ff" stroke-width="2.6" stroke-linecap="round"><path d="M10 18h28M6 25h32M12 32h26M8 39h22"/></g>'; break;
      default: b = cloud();
    }
    return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 48 48" aria-hidden="true">' + b + '</svg>';
  }
  let wxState = { loading: false, error: null };
  async function loadWeather(force) {
    if (!S().location) throw new Error('no location');
    const s = S(), key = 'wx2:' + s.location.lat.toFixed(2) + ',' + s.location.lon.toFixed(2) + ':' + s.units;
    const cached = !force && SP.store.cache.get(key, 30 * 60e3);
    if (cached) return cached;
    const url = 'https://api.open-meteo.com/v1/forecast?latitude=' + s.location.lat + '&longitude=' + s.location.lon +
      '&current=temperature_2m,weather_code,is_day,apparent_temperature,relative_humidity_2m,wind_speed_10m,wind_direction_10m' +
      '&hourly=temperature_2m,precipitation_probability,weather_code,is_day' +
      '&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max&timezone=auto&forecast_days=4' +
      (s.units === 'fahrenheit' ? '&temperature_unit=fahrenheit&wind_speed_unit=mph' : '');
    const r = await fetch(url);
    if (!r.ok) throw new Error('Weather service returned ' + r.status);
    const d = await r.json();
    SP.store.cache.set(key, d);
    return d;
  }
  W.weather = {
    title: 'Weather', icon: 'weather', data: null,
    render() {
      const d = this.data;
      if (!S().location) return '<div class="wx-empty">' + I('pin', 18) + '<span>' + esc(SP.voice.t('wx_noLocation')) + '</span><button class="btn small" data-wx-setup>' + esc(SP.voice.t('wx_setLocation')) + '</button></div>';
      if (!d) return '<div class="wx-empty">' + (wxState.error ? I('alert', 18) + '<span>' + esc(wxState.error) + '</span><button class="btn small" data-wx-retry>Retry</button>' : '<span class="muted">Loading weather…</span>') + '</div>';
      const c = d.current, days = d.daily;
      const rows = [1, 2, 3].map((i) => {
        const dt = new Date(days.time[i] + 'T12:00');
        return '<li><span>' + dt.toLocaleDateString([], { weekday: 'short' }) + '</span>' + wxIcon(wxKind(days.weather_code[i], 1), 26) + '<b>' + Math.round(days.temperature_2m_max[i]) + '°</b></li>';
      }).join('');
      return '<div class="wx">' +
        '<div class="wx-now" title="' + esc(S().location.name) + '">' + wxIcon(wxKind(c.weather_code, c.is_day), 84) +
        '<div><div class="wx-temp">' + Math.round(c.temperature_2m) + '°</div><div class="wx-cond">' + esc(WX[c.weather_code] || '—') + '</div></div></div>' +
        '<ul class="wx-days">' + rows + '</ul></div>' +
        '<span class="drag-grip floating" title="Drag to reorder">' + I('grip', 16) + '</span>';
    },
    mount(el) {
      const b = el.querySelector('[data-wx-retry]');
      if (b) b.onclick = () => this.load(true);
      const set = el.querySelector('[data-wx-setup]');
      if (set) set.onclick = () => SP.panel.open('settings', 'location');
      if (S().location && !this.data && !wxState.loading && !wxState.error) this.load();
    },
    async load(force) {
      if (!S().location) return;
      wxState = { loading: true, error: null };
      try { this.data = await loadWeather(force); } catch (e) { wxState.error = 'Couldn’t load weather'; console.warn(e); }
      wxState.loading = false;
      rerender('weather');
      rerender('forecast');
    },
    get state() { return wxState; },
    reset() { this.data = null; wxState = { loading: false, error: null }; },
  };

  /* ---------------- GitHub ---------------- */
  async function gh(path) {
    const h = { Accept: 'application/vnd.github+json' }, t = S().github.token;
    if (t) h.Authorization = 'Bearer ' + t;
    const r = await fetch('https://api.github.com' + path, { headers: h });
    if (!r.ok) {
      const err = new Error(r.status === 403 || r.status === 429 ? 'GitHub rate limit hit, add a token in Settings' : r.status === 404 ? 'GitHub user not found' : r.status === 401 ? 'GitHub token rejected' : 'GitHub returned ' + r.status);
      err.status = r.status; throw err;
    }
    return r.json();
  }
  function describeEvent(e) {
    const p = e.payload || {};
    switch (e.type) {
      case 'PushEvent': {
        const n = p.size || (p.commits && p.commits.length);
        return { kind: 'push', text: n ? n + ' commit' + (n > 1 ? 's' : '') : 'pushed to ' + String(p.ref || '').replace('refs/heads/', '') };
      }
      case 'PullRequestEvent': return { kind: 'pr', text: p.action === 'closed' ? (p.pull_request && p.pull_request.merged ? 'PR merged' : 'PR closed') : 'PR ' + p.action };
      case 'PullRequestReviewEvent': return { kind: 'pr', text: 'PR reviewed' };
      case 'IssuesEvent': return { kind: 'other', text: 'issue ' + p.action };
      case 'IssueCommentEvent': return { kind: 'other', text: 'commented' };
      case 'CreateEvent': return { kind: 'other', text: 'created ' + p.ref_type };
      case 'ReleaseEvent': return { kind: 'other', text: 'released ' + ((p.release && p.release.tag_name) || '') };
      case 'WatchEvent': return { kind: 'other', text: 'starred' };
      case 'ForkEvent': return { kind: 'other', text: 'forked' };
      default: return { kind: 'other', text: e.type.replace(/Event$/, '').toLowerCase() };
    }
  }
  function describeRun(run) {
    if (run.status !== 'completed') return { kind: 'run', text: 'CI running' };
    if (run.conclusion === 'success') return { kind: 'ok', text: 'CI passed' };
    if (run.conclusion === 'failure' || run.conclusion === 'timed_out') return { kind: 'fail', text: 'CI failed' };
    return { kind: 'other', text: 'CI ' + run.conclusion };
  }
  async function loadGithub(force) {
    const { user, token } = S().github, key = 'gh:' + user + ':' + (token ? 1 : 0);
    const cached = !force && SP.store.cache.get(key, 10 * 60e3);
    if (cached) return cached;
    const events = await gh('/users/' + encodeURIComponent(user) + '/events?per_page=60');
    let repos = [];
    for (const e of events) {
      if (!repos.find((r) => r.name === e.repo.name)) repos.push({ name: e.repo.name, event: e });
      if (repos.length === 3) break;
    }
    if (!repos.length) {
      const list = await gh('/users/' + encodeURIComponent(user) + '/repos?sort=pushed&per_page=3');
      repos = list.map((r) => ({ name: r.full_name, pushed: r.pushed_at }));
    }
    await Promise.all(repos.map(async (r) => {
      try { const d = await gh('/repos/' + r.name + '/actions/runs?per_page=1'); r.run = d.workflow_runs && d.workflow_runs[0]; } catch (e) { /* no actions */ }
    }));
    let badge = null;
    if (token) { try { badge = (await gh('/notifications?per_page=50')).length; } catch (e) { /* token lacks scope */ } }
    const rows = repos.map((r) => {
      const evTime = r.event ? r.event.created_at : r.pushed;
      const useRun = r.run && (!evTime || new Date(r.run.updated_at) >= new Date(evTime) - 15 * 60e3);
      const d = useRun ? describeRun(r.run) : r.event ? describeEvent(r.event) : { kind: 'push', text: 'pushed' };
      return { repo: r.name, short: r.name.split('/')[1], kind: d.kind, text: d.text, time: useRun ? r.run.updated_at : evTime,
        url: useRun ? r.run.html_url : 'https://github.com/' + r.name };
    });
    const data = { rows, badge };
    SP.store.cache.set(key, data);
    return data;
  }
  const GH_ICON = {
    ok: '<svg width="20" height="20" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#22c55e"/><path d="m7.5 12.3 3 3 6-6.3" fill="none" stroke="#0b1a10" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    fail: '<svg width="20" height="20" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#ef4444"/><path d="m8.5 8.5 7 7m0-7-7 7" stroke="#1a0b0b" stroke-width="2.6" stroke-linecap="round"/></svg>',
    run: '<span class="gh-run"></span>',
    pr: '<span class="gh-pr">' + I('pr', 20) + '</span>',
    push: '<span class="gh-push">' + I('sync', 20) + '</span>',
    other: '<span class="gh-push">' + I('star', 18) + '</span>',
  };
  let ghState = { loading: false, error: null };
  W.github = {
    title: 'GitHub', icon: 'github', data: null,
    render() {
      const user = S().github.user, d = this.data;
      const badge = d && d.badge ? '<a class="badge" href="https://github.com/notifications" title="Unread notifications">' + d.badge + '</a>' : '';
      let body;
      if (!user) body = '<div class="empty">Add your GitHub username to see repo activity.<button class="btn small" data-gh-setup>Connect GitHub</button></div>';
      else if (!d) body = '<div class="empty">' + (ghState.error ? '<span>' + esc(ghState.error) + '</span><button class="btn small" data-gh-retry>Retry</button>' : '<span class="muted">Loading activity…</span>') + '</div>';
      else if (!d.rows.length) body = '<div class="empty muted">No recent public activity.</div>';
      else body = '<ul class="gh-list">' + d.rows.map((r) => '<li><a href="' + esc(r.url) + '">' + GH_ICON[r.kind] + '<span class="gh-repo">' + esc(r.short) + '</span><span class="gh-sep">—</span><span class="gh-text">' + esc(r.text) + '</span><time>' + (r.time ? ago(r.time) : '') + '</time></a></li>').join('') + '</ul>';
      return head('github', SP.voice.t('w_github'), badge + (user ? '<button class="icon-btn" data-gh-refresh title="Refresh">' + I('sync', 16) + '</button>' : '')) + body;
    },
    mount(el) {
      const on = (sel, fn) => { const n = el.querySelector(sel); if (n) n.onclick = fn; };
      on('[data-gh-setup]', () => SP.panel.open('settings', 'github'));
      on('[data-gh-retry]', () => this.load(true));
      on('[data-gh-refresh]', () => this.load(true));
      if (S().github.user && !this.data && !ghState.loading && !ghState.error) this.load();
    },
    async load(force) {
      ghState = { loading: true, error: null };
      if (force) this.data = null;
      rerender('github');
      try { this.data = await loadGithub(force); } catch (e) { ghState.error = e.message || 'Couldn’t reach GitHub'; console.warn(e); }
      ghState.loading = false;
      rerender('github');
    },
    reset() { this.data = null; ghState = { loading: false, error: null }; },
  };

  /* ---------------- Bookmarks ---------------- */
  function tileHtml(b, i) {
    const fav = S().favicons ? favicon(b.url) : '';
    return '<a class="tile" href="' + esc(b.url) + '" data-tile="' + i + '" title="' + esc(b.url) + '">' +
      '<span class="tile-ic">' + (fav ? '<img src="' + esc(fav) + '" alt="" width="28" height="28" loading="lazy">' : '') + '<i>' + esc((b.title || '?')[0].toUpperCase()) + '</i></span>' +
      '<span class="tile-t">' + esc(b.title) + '</span></a>';
  }
  async function editBookmark(b, title) {
    const v = await form(title, [
      { name: 'title', label: 'Name', value: b ? b.title : '', required: true },
      { name: 'url', label: 'URL', value: b ? b.url : '', placeholder: 'example.com', required: true },
    ]);
    return v && { title: v.title.trim(), url: normalizeUrl(v.url) };
  }
  W.bookmarks = {
    title: 'Bookmarks', icon: 'bookmark',
    render() {
      const bm = S().bookmarks;
      return head('bookmarkFill', SP.voice.t('w_bookmarks'), '<button class="icon-btn" data-bm-more aria-label="Bookmark options">' + I('more', 18) + '</button>') +
        '<div class="bm">' +
        '<ul class="bm-folders">' + bm.folders.map((f, i) => '<li><button data-folder="' + i + '"><span class="bm-fi">' + I('folder', 18) + '</span><span>' + esc(f.name) + '</span>' + I('chev', 16) + '</button></li>').join('') + '</ul>' +
        '<div class="bm-tiles">' + bm.tiles.map(tileHtml).join('') + '<button class="tile add" data-bm-add><span class="tile-ic">' + I('plus', 22) + '</span><span class="tile-t">Add</span></button></div>' +
        '</div>';
    },
    mount(el) {
      const bm = S().bookmarks;
      el.querySelectorAll('.tile img').forEach((img) => img.addEventListener('error', () => img.remove()));
      el.querySelectorAll('.tile img').forEach((img) => img.addEventListener('load', () => img.parentNode.classList.add('has-img')));
      el.querySelector('[data-bm-add]').onclick = async () => {
        const b = await editBookmark(null, 'Add bookmark');
        if (b) { bm.tiles.push(b); save(); rerender('bookmarks'); }
      };
      el.querySelector('[data-bm-more]').onclick = (e) => menu(e.currentTarget, [
        { icon: 'plus', label: 'Add bookmark', action: () => el.querySelector('[data-bm-add]').click() },
        { icon: 'folder', label: 'New folder', action: async () => {
          const v = await form('New folder', [{ name: 'name', label: 'Folder name', required: true }]);
          if (v) { bm.folders.push({ name: v.name.trim(), items: [] }); save(); rerender('bookmarks'); }
        } },
        { icon: 'grip', label: 'Tip: right-click a bookmark to edit', action: () => {} },
      ]);
      el.querySelectorAll('[data-tile]').forEach((a) => a.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        const i = +a.dataset.tile;
        menu(a, [
          { icon: 'edit', label: 'Edit', action: async () => { const b = await editBookmark(bm.tiles[i], 'Edit bookmark'); if (b) { bm.tiles[i] = b; save(); rerender('bookmarks'); } } },
          { icon: 'chev', label: 'Move left', action: () => { if (i > 0) { bm.tiles.splice(i - 1, 0, bm.tiles.splice(i, 1)[0]); save(); rerender('bookmarks'); } } },
          { icon: 'trash', label: 'Remove', danger: true, action: () => { bm.tiles.splice(i, 1); save(); rerender('bookmarks'); } },
        ]);
      }));
      el.querySelectorAll('[data-folder]').forEach((btn) => btn.onclick = () => {
        const fi = +btn.dataset.folder, f = bm.folders[fi];
        menu(btn, f.items.map((b) => ({ href: b.url, label: b.title, img: S().favicons ? favicon(b.url) : '' })).concat([
          { sep: true },
          { icon: 'plus', label: 'Add link', action: async () => { const b = await editBookmark(null, 'Add to ' + f.name); if (b) { f.items.push(b); save(); } } },
          { icon: 'edit', label: 'Edit folder', action: () => editFolder(fi) },
        ]), { side: true, title: f.name });
      });
      el.querySelector('.bm-tiles').addEventListener('click', (e) => {
        if (e.target.closest('.tile') && (e.ctrlKey || e.metaKey)) return; // let new-tab clicks through
      });
    },
  };
  async function editFolder(fi) {
    const bm = S().bookmarks, f = bm.folders[fi];
    const list = f.items.map((b, i) => '<li><span>' + esc(b.title) + ' <small class="muted">' + esc(SP.ui.host(b.url)) + '</small></span><button type="button" class="icon-btn" data-rm="' + i + '" aria-label="Remove">' + I('trash', 16) + '</button></li>').join('');
    const v = await SP.ui.dialog('Edit folder', '<label class="field"><span>Name</span><input name="name" value="' + esc(f.name) + '" required></label><ul class="edit-list">' + (list || '<li class="muted">No links yet</li>') + '</ul>', {
      extra: '<button type="button" class="btn ghost danger" data-del-folder>Delete folder</button>',
      mount(d, done) {
        d.querySelectorAll('[data-rm]').forEach((b) => b.onclick = () => { f.items.splice(+b.dataset.rm, 1); b.closest('li').remove(); save(); });
        d.querySelector('[data-del-folder]').onclick = () => { bm.folders.splice(fi, 1); save(); done(null); rerender('bookmarks'); };
      },
    });
    if (v) { f.name = v.name.trim() || f.name; save(); rerender('bookmarks'); }
  }

  /* ---------------- Tasks ---------------- */
  W.tasks = {
    title: 'Tasks', icon: 'tasks',
    render() {
      const t = S().tasks;
      return head('tasks', SP.voice.t('w_tasks'), (t.some((x) => x.done) ? '<button class="icon-btn" data-clear title="Clear completed">' + I('trash', 16) + '</button>' : '') +
        '<button class="icon-btn" data-add aria-label="Add task">' + I('plus', 20) + '</button>') +
        '<ul class="task-list">' + t.map((x) => '<li class="' + (x.done ? 'done' : '') + '" data-id="' + x.id + '">' +
          '<label><input type="checkbox"' + (x.done ? ' checked' : '') + '><span class="box">' + I('check', 14) + '</span></label>' +
          '<span class="task-t" title="Double-click to edit">' + esc(x.text) + '</span>' +
          '<button class="icon-btn del" aria-label="Delete task">' + I('x', 14) + '</button></li>').join('') +
        (t.length ? '' : '<li class="muted empty-li">' + esc(SP.voice.t('tasksEmpty')) + '</li>') + '</ul>';
    },
    mount(el) {
      const tasks = S().tasks, list = el.querySelector('.task-list');
      const find = (li) => tasks.find((x) => x.id === li.dataset.id);
      el.querySelector('[data-add]').onclick = () => {
        if (list.querySelector('.new')) return list.querySelector('.new input').focus();
        const li = document.createElement('li');
        li.className = 'new';
        li.innerHTML = '<span class="box"></span><input class="task-input" placeholder="' + esc(SP.voice.t('task_placeholder')) + '" maxlength="200">';
        list.prepend(li);
        const inp = li.querySelector('input');
        inp.focus();
        inp.onkeydown = (e) => {
          if (e.key === 'Enter' && inp.value.trim()) { const text = inp.value.trim(); tasks.unshift({ id: uid(), text, done: false }); save(); rerender('tasks'); SP.react.on.taskAdd(text); setTimeout(() => { const b = document.querySelector('.w-tasks [data-add]'); b && b.click(); }); }
          if (e.key === 'Escape') li.remove();
        };
        inp.onblur = () => setTimeout(() => li.isConnected && !inp.value.trim() && li.remove(), 100);
      };
      const clr = el.querySelector('[data-clear]');
      if (clr) clr.onclick = () => { const n = tasks.filter((x) => x.done).length; S().tasks = tasks.filter((x) => !x.done); save(); rerender('tasks'); SP.react.on.taskClear(n); };
      list.addEventListener('change', (e) => { const li = e.target.closest('li'); const t = find(li); if (t) { t.done = e.target.checked; li.classList.toggle('done', t.done); save(); rerender('tasks'); SP.react.on[t.done ? 'taskDone' : 'taskUndo'](t.text); } });
      list.addEventListener('click', (e) => {
        if (!e.target.closest('.del')) return;
        const li = e.target.closest('li'), gone = find(li); S().tasks = tasks.filter((x) => x.id !== li.dataset.id); save(); rerender('tasks'); if (gone) SP.react.on.taskDelete(gone);
      });
      list.addEventListener('dblclick', (e) => {
        const span = e.target.closest('.task-t'); if (!span) return;
        const t = find(span.closest('li'));
        span.contentEditable = 'plaintext-only'; span.focus();
        document.getSelection().selectAllChildren(span);
        const finish = (ok) => { span.contentEditable = 'false'; if (ok && span.textContent.trim()) t.text = span.textContent.trim(); save(); rerender('tasks'); };
        span.onkeydown = (k) => { if (k.key === 'Enter') { k.preventDefault(); finish(true); } if (k.key === 'Escape') finish(false); };
        span.onblur = () => finish(true);
      });
    },
  };

  /* ---------------- Notes ---------------- */
  W.notes = {
    title: 'Notes', icon: 'notes', editing: false,
    render() {
      const lines = S().notes.split('\n').filter((l) => l.trim());
      const body = this.editing
        ? '<textarea class="notes-edit" spellcheck="true" aria-label="Notes">' + esc(S().notes) + '</textarea>'
        : '<ul class="notes-list" tabindex="0" title="Click to edit">' + (lines.length ? lines.map((l) => '<li>' + esc(l.replace(/^[-*•]\s*/, '')) + '</li>').join('') : '<li class="muted plain">' + esc(SP.voice.t('notes_placeholder')) + '</li>') + '</ul>';
      return head('notes', SP.voice.t('w_notes'), '<button class="icon-btn" data-notes-more aria-label="Notes options">' + I('more', 18) + '</button>') + '<div class="notes-body">' + body + '</div>';
    },
    mount(el) {
      const ta = el.querySelector('textarea');
      if (ta) {
        ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length);
        ta.oninput = () => { S().notes = ta.value; save(); };
        ta.onblur = () => { this.editing = false; rerender('notes'); };
        ta.onkeydown = (e) => { if (e.key === 'Escape') ta.blur(); };
      } else {
        const ul = el.querySelector('.notes-list');
        ul.onclick = () => { this.editing = true; rerender('notes'); };
        ul.onkeydown = (e) => { if (e.key === 'Enter') ul.click(); };
      }
      el.querySelector('[data-notes-more]').onclick = (e) => menu(e.currentTarget, [
        { icon: 'edit', label: 'Edit', action: () => { this.editing = true; rerender('notes'); } },
        { icon: 'download', label: 'Download as .txt', action: () => SP.app.download('notes.txt', S().notes, 'text/plain') },
        { icon: 'trash', label: 'Clear', danger: true, action: async () => { if (await confirm('Clear notes?', 'This removes all note text.', 'Clear')) { S().notes = ''; save(); rerender('notes'); } } },
      ]);
    },
  };

  /* ---------------- Music (plays your own URLs / files) ---------------- */
  const M = { audio: new Audio(), idx: 0, shuffle: false, repeat: 'off', session: [] };
  M.audio.preload = 'metadata';
  const tracks = () => S().tracks.concat(M.session);
  const fmt = (s) => (isFinite(s) ? Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0') : '0:00');
  function play(i) {
    const list = tracks();
    if (!list.length) return manageTracks();
    if (i != null) { M.idx = (i + list.length) % list.length; M.audio.src = list[M.idx].url; }
    else if (!M.audio.src) M.audio.src = list[M.idx].url;
    M.audio.play().catch((e) => { if (e.name !== 'AbortError') toast('Can’t play this track: ' + e.message); });
    mediaSession();
    rerender('music');
  }
  function next(dir) {
    const n = tracks().length; if (!n) return;
    if (M.shuffle && n > 1) { let j; do { j = Math.floor(Math.random() * n); } while (j === M.idx); return play(j); }
    if (dir > 0 && M.idx === n - 1 && M.repeat === 'off' && M.audio.ended) return;
    play(M.idx + dir);
  }
  M.audio.addEventListener('ended', () => { if (M.repeat === 'one') { M.audio.currentTime = 0; M.audio.play(); } else next(1); });
  ['play', 'pause'].forEach((ev) => M.audio.addEventListener(ev, () => rerender('music')));
  M.audio.addEventListener('timeupdate', sync);
  M.audio.addEventListener('loadedmetadata', sync);
  function sync() {
    document.querySelectorAll('.w-music').forEach((el) => {
      const d = M.audio.duration, t = M.audio.currentTime;
      const bar = el.querySelector('.mu-fill'); if (bar) bar.style.width = (d ? (t / d) * 100 : 0) + '%';
      const tm = el.querySelector('.mu-time'); if (tm) tm.textContent = fmt(t) + ' / ' + fmt(d);
    });
  }
  function mediaSession() {
    if (!('mediaSession' in navigator)) return;
    const t = tracks()[M.idx]; if (!t) return;
    navigator.mediaSession.metadata = new MediaMetadata({ title: t.title, artist: t.artist || '' });
    navigator.mediaSession.setActionHandler('previoustrack', () => next(-1));
    navigator.mediaSession.setActionHandler('nexttrack', () => next(1));
  }
  async function manageTracks() {
    const list = tracks();
    const rows = list.map((t, i) => '<li><span>' + esc(t.title) + ' <small class="muted">' + esc(t.artist || '') + (t.local ? ' · this session only' : '') + '</small></span><button type="button" class="icon-btn" data-rm="' + i + '" aria-label="Remove">' + I('trash', 16) + '</button></li>').join('');
    const v = await SP.ui.dialog('Playlist',
      '<p class="muted small">Browsers can’t see what other apps are playing, so this player plays your own audio: direct stream or file URLs (mp3, ogg, m4a, internet radio), or local files.</p>' +
      '<ul class="edit-list">' + (rows || '<li class="muted">No tracks yet</li>') + '</ul>' +
      '<div class="field-row"><label class="field"><span>Title</span><input name="title" placeholder="Late Night Pixels"></label><label class="field"><span>Artist</span><input name="artist" placeholder="Lo-Fi Beats"></label></div>' +
      '<label class="field"><span>Audio URL</span><input name="url" type="url" placeholder="https://…/stream.mp3"></label>' +
      '<label class="btn ghost file-btn">' + I('upload', 16) + ' Add local files<input type="file" accept="audio/*" multiple hidden data-files></label>',
      { okText: 'Add URL', mount(d) {
        d.querySelectorAll('[data-rm]').forEach((b) => b.onclick = () => {
          const i = +b.dataset.rm, saved = S().tracks.length;
          if (i < saved) S().tracks.splice(i, 1); else M.session.splice(i - saved, 1);
          save(); b.closest('li').remove(); rerender('music');
        });
        d.querySelector('[data-files]').onchange = (e) => {
          for (const f of e.target.files) M.session.push({ title: f.name.replace(/\.[^.]+$/, ''), artist: 'Local file', url: URL.createObjectURL(f), local: true });
          toast(e.target.files.length + ' file(s) added'); rerender('music');
        };
      } });
    if (v && v.url) { S().tracks.push({ title: v.title || SP.ui.host(v.url) || 'Untitled', artist: v.artist || '', url: v.url }); save(); rerender('music'); }
  }
  W.music = {
    title: 'Music', icon: 'music',
    render() {
      const t = tracks()[M.idx], playing = !M.audio.paused, liked = t && S().liked.includes(t.url);
      const d = M.audio.duration, c = M.audio.currentTime;
      return '<div class="mu">' +
        '<button class="mu-art" data-mu-list title="Playlist"><canvas width="96" height="96"></canvas></button>' +
        '<div class="mu-main">' +
        '<div class="mu-top"><div class="mu-meta"><span class="mu-label">' + (t ? (playing ? 'Now Playing' : 'Paused') : 'Music') + '</span>' +
        '<strong>' + esc(t ? t.title : 'No tracks yet') + '</strong><span class="muted">' + esc(t ? t.artist : 'Add a stream URL or audio files') + '</span></div>' +
        '<div class="mu-ctrl">' +
        '<button class="icon-btn' + (M.shuffle ? ' on' : '') + '" data-mu="shuffle" aria-label="Shuffle">' + I('shuffle', 18) + '</button>' +
        '<button class="icon-btn" data-mu="prev" aria-label="Previous">' + I('prev', 20) + '</button>' +
        '<button class="mu-play" data-mu="play" aria-label="' + (playing ? 'Pause' : 'Play') + '">' + I(playing ? 'pause' : 'play', 24) + '</button>' +
        '<button class="icon-btn" data-mu="next" aria-label="Next">' + I('next', 20) + '</button>' +
        '<button class="icon-btn' + (M.repeat !== 'off' ? ' on' : '') + '" data-mu="repeat" aria-label="Repeat: ' + M.repeat + '">' + I('repeat', 18) + (M.repeat === 'one' ? '<sup>1</sup>' : '') + '</button>' +
        '<button class="icon-btn' + (liked ? ' liked' : '') + '" data-mu="like" aria-label="Like">' + I('heart', 20) + '</button>' +
        '</div></div>' +
        '<div class="mu-bottom"><div class="mu-bar" data-mu-seek><div class="mu-fill" style="width:' + (d ? (c / d) * 100 : 0) + '%"></div></div><span class="mu-time">' + fmt(c) + ' / ' + fmt(d) + '</span></div>' +
        '</div></div><span class="drag-grip floating" title="Drag to reorder">' + I('grip', 16) + '</span>';
    },
    mount(el) {
      const cv = el.querySelector('canvas');
      SP.scene.render(cv, 'cyber', (M.idx + 3) * 17, { noForeground: true });
      el.querySelector('[data-mu-list]').onclick = manageTracks;
      el.querySelectorAll('[data-mu]').forEach((b) => b.onclick = () => {
        const a = b.dataset.mu;
        if (a === 'play') { if (M.audio.src && !M.audio.paused) M.audio.pause(); else play(); }
        if (a === 'prev') { if (M.audio.currentTime > 3) M.audio.currentTime = 0; else next(-1); }
        if (a === 'next') next(1);
        if (a === 'shuffle') { M.shuffle = !M.shuffle; rerender('music'); }
        if (a === 'repeat') { M.repeat = { off: 'all', all: 'one', one: 'off' }[M.repeat]; rerender('music'); }
        if (a === 'like') {
          const t = tracks()[M.idx]; if (!t) return;
          const L = S().liked, i = L.indexOf(t.url);
          if (i >= 0) L.splice(i, 1); else L.push(t.url);
          save(); rerender('music');
        }
      });
      el.querySelector('[data-mu-seek]').onclick = (e) => {
        const r = e.currentTarget.getBoundingClientRect();
        if (M.audio.duration) M.audio.currentTime = ((e.clientX - r.left) / r.width) * M.audio.duration;
      };
    },
  };

  /* ---------------- Quote ---------------- */
  const QUOTES = [
    ['A little progress each day adds up to big results.', ''],
    ['Simplicity is prerequisite for reliability.', 'Edsger W. Dijkstra'],
    ['Make it work, make it right, make it fast.', 'Kent Beck'],
    ['The best way to predict the future is to invent it.', 'Alan Kay'],
    ['Well done is better than well said.', 'Benjamin Franklin'],
    ['What we know is a drop, what we don’t know is an ocean.', 'Isaac Newton'],
    ['It always seems impossible until it’s done.', 'Nelson Mandela'],
    ['Done is better than perfect.', ''],
    ['The secret of getting ahead is getting started.', 'Mark Twain'],
    ['Small deeds done are better than great deeds planned.', 'Peter Marshall'],
    ['Programs must be written for people to read.', 'Harold Abelson'],
    ['Creativity is intelligence having fun.', ''],
    ['Quality is not an act, it is a habit.', 'Will Durant'],
    ['First, solve the problem. Then, write the code.', 'John Johnson'],
    ['Play is the highest form of research.', ''],
    ['You can’t use up creativity. The more you use, the more you have.', 'Maya Angelou'],
    ['Start where you are. Use what you have. Do what you can.', 'Arthur Ashe'],
    ['Slow is smooth, smooth is fast.', ''],
    ['Every expert was once a beginner.', ''],
    ['Rest is not idleness.', 'John Lubbock'],
    ['Ship it, then make it better.', ''],
  ];
  const dayIndex = () => Math.floor((Date.now() - new Date().getTimezoneOffset() * 60e3) / 864e5);
  W.quote = {
    title: 'Daily quote', icon: 'quote', offset: 0,
    render() {
      const [q, a] = QUOTES[(dayIndex() + this.offset) % QUOTES.length];
      return '<canvas class="quote-bg" width="320" height="100" aria-hidden="true"></canvas>' +
        '<button class="quote" title="Another quote"><blockquote>“' + esc(q) + '”</blockquote>' + (a ? '<cite>— ' + esc(a) + '</cite>' : '') + '</button>' +
        '<span class="drag-grip floating" title="Drag to reorder">' + I('grip', 16) + '</span>';
    },
    mount(el) {
      SP.scene.render(el.querySelector('canvas'), S().theme === 'midnight' ? 'pixel' : S().theme, S().seed + 101);
      el.querySelector('.quote').onclick = () => { this.offset++; rerender('quote'); };
    },
  };

  /* ---------------- Search (hero, not a card) ---------------- */
  const ENGINES = {
    google: { name: 'Google', url: 'https://www.google.com/search?q=' },
    duckduckgo: { name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q=' },
    bing: { name: 'Bing', url: 'https://www.bing.com/search?q=' },
    brave: { name: 'Brave', url: 'https://search.brave.com/search?q=' },
    kagi: { name: 'Kagi', url: 'https://kagi.com/search?q=' },
    startpage: { name: 'Startpage', url: 'https://www.startpage.com/do/search?q=' },
  };
  const BANGS = {
    gh: ['GitHub', 'https://github.com/search?type=repositories&q='],
    mdn: ['MDN', 'https://developer.mozilla.org/en-US/search?q='],
    yt: ['YouTube', 'https://www.youtube.com/results?search_query='],
    w: ['Wikipedia', 'https://en.wikipedia.org/w/index.php?search='],
    npm: ['npm', 'https://www.npmjs.com/search?q='],
    so: ['Stack Overflow', 'https://stackoverflow.com/search?q='],
    r: ['Reddit', 'https://www.reddit.com/search/?q='],
    maps: ['Maps', 'https://www.google.com/maps/search/'],
  };
  function resolve(q) {
    q = q.trim();
    const m = q.match(/^!(\w+)\s*(.*)$/);
    if (m && BANGS[m[1]]) return { url: BANGS[m[1]][1] + encodeURIComponent(m[2]), label: BANGS[m[1]][0] + (m[2] ? ': ' + m[2] : '') };
    if (/^https?:\/\//i.test(q) || /^(localhost|[\w-]+(\.[\w-]+)+)(:\d+)?(\/\S*)?$/i.test(q) && !/\s/.test(q)) return { url: normalizeUrl(q), label: 'Go to ' + q, go: true };
    const e = ENGINES[S().engine] || ENGINES.google;
    return { url: e.url + encodeURIComponent(q), label: 'Search ' + e.name + ' for “' + q + '”' };
  }
  function allBookmarks() {
    const bm = S().bookmarks;
    return bm.tiles.concat(...bm.folders.map((f) => f.items));
  }
  SP.search = {
    engines: ENGINES, bangs: BANGS,
    render() {
      return '<form class="search" role="search" autocomplete="off">' + I('search', 24) +
        '<input id="q" name="q" type="search" placeholder="Search the web, GitHub, docs, or anything…" aria-label="Search" aria-autocomplete="list" aria-controls="sugg" spellcheck="false">' +
        '<kbd>' + (/Mac|iPhone|iPad/.test(navigator.platform) ? '⌘' : 'Ctrl') + ' K</kbd><ul id="sugg" class="sugg" role="listbox" hidden></ul></form>';
    },
    mount(root) {
      const f = root.querySelector('form'), q = f.q, ul = f.querySelector('.sugg');
      let items = [], sel = 0;
      const draw = () => {
        const v = q.value.trim();
        if (!v) { ul.hidden = true; return; }
        items = [];
        if (v.startsWith('?')) {
          const qq = v.slice(1).trim(), nm = SP.voice.current().name;
          items = [{ icon: 'chat', label: qq ? SP.voice.t('ask_label', { name: nm }) + ': ' + qq : SP.voice.t('ask_label', { name: nm }) + '…', sub: SP.ask.hasKey() ? 'Enter' : 'needs your Claude API key', run: () => SP.ask.open(qq) }];
        } else if (v.startsWith('>')) {
          items = SP.palette.commands(v.slice(1).trim());
        } else if (v === '!' || /^!\w*$/.test(v)) {
          Object.entries(BANGS).filter(([k]) => ('!' + k).startsWith(v)).forEach(([k, [n]]) => items.push({ label: '!' + k, sub: n, fill: '!' + k + ' ' }));
        } else {
          items = SP.palette.instant(v);
          items.push(Object.assign({ main: true }, resolve(v)));
          const lv = v.toLowerCase(), seen = new Set();
          allBookmarks().filter((b) => (b.title.toLowerCase().includes(lv) || b.url.toLowerCase().includes(lv)) && !seen.has(b.url) && seen.add(b.url)).slice(0, 5)
            .forEach((b) => items.push({ url: b.url, label: b.title, sub: SP.ui.host(b.url), bm: true }));
        }
        sel = 0;
        ul.innerHTML = items.map((it, i) => '<li role="option" data-i="' + i + '"' + (i === sel ? ' aria-selected="true"' : '') + '>' +
          (it.icon ? I(it.icon, 16) : it.bm ? I('bookmark', 16) : it.fill ? I('code', 16) : it.go ? I('link', 16) : I('search', 16)) + '<span' + (it.answer ? ' class="answer"' : '') + '>' + esc(it.label) + '</span>' + (it.sub ? '<small>' + esc(it.sub) + '</small>' : '') + '</li>').join('') +
          (v.startsWith('!') || v.startsWith('>') || v.startsWith('?') ? '' : '<li class="hint" aria-hidden="true">Tip: <b>&gt;</b> for commands, <b>?</b> to ask the voice, <b>!gh</b> <b>!mdn</b> <b>!yt</b> for sites, or type math like <b>12*7</b> or <b>5 km to mi</b></li>');
        if (v.startsWith('>') && !items.length) { ul.innerHTML = '<li class="hint">No matching command</li>'; ul.hidden = false; return; }
        ul.hidden = !items.length;
      };
      const go = (it) => {
        if (!it) return;
        if (it.fill) { q.value = it.fill; q.focus(); draw(); return; }
        if (it.copy != null) { navigator.clipboard && navigator.clipboard.writeText(String(it.copy)).then(() => SP.ui.toast('Copied ' + it.copy), () => {}); return; }
        if (it.run) { q.value = ''; ul.hidden = true; q.blur(); it.run(); return; }
        location.href = it.url;
      };
      q.addEventListener('input', draw);
      q.addEventListener('focus', draw);
      q.addEventListener('blur', () => setTimeout(() => (ul.hidden = true), 150));
      q.addEventListener('keydown', (e) => {
        if (ul.hidden) return;
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          e.preventDefault();
          sel = (sel + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
          ul.querySelectorAll('[data-i]').forEach((li) => li.setAttribute('aria-selected', String(+li.dataset.i === sel)));
        }
        if (e.key === 'Escape') { ul.hidden = true; }
        if (e.key === 'Tab' && items[sel] && items[sel].fill) { e.preventDefault(); go(items[sel]); }
      });
      ul.addEventListener('mousedown', (e) => { const li = e.target.closest('[data-i]'); if (li) { e.preventDefault(); go(items[+li.dataset.i]); } });
      f.addEventListener('submit', (e) => { e.preventDefault(); if (q.value.trim()) go(items[sel] || resolve(q.value)); });
    },
  };

  SP.widgets = W;
  SP.widgetHead = head;
  SP.wxIcon = wxIcon;
  SP.wxKind = wxKind;
  SP.wxLabel = WX;
  SP.widgetOrder = ['search', 'bookmarks', 'weather', 'clock', 'tasks', 'notes', 'github', 'music', 'quote'];
  SP.widgetMeta = {
    search: { title: 'Search', icon: 'search' }, bookmarks: { title: 'Bookmarks', icon: 'bookmark' }, weather: { title: 'Weather', icon: 'weather' },
    clock: { title: 'Clock', icon: 'clock' }, tasks: { title: 'Tasks', icon: 'tasks' }, notes: { title: 'Notes', icon: 'notes' },
    github: { title: 'GitHub', icon: 'github' }, music: { title: 'Music', icon: 'music' }, quote: { title: 'Quote', icon: 'quote' },
  };
})(window.SP = window.SP || {});
