/* Cross-device sync via a private GitHub Gist. Needs a token with gist access
   (classic: `gist` scope; fine-grained: Account permissions → Gists: read & write).
   Last write wins, based on state.updatedAt. The token itself is never uploaded. */
(function (SP) {
  'use strict';
  const FILE = 'startpage-sync.json', DESC = 'Startpage sync (do not edit by hand)';
  const S = () => SP.store.state;
  let status = { state: 'idle', msg: '' }, pushTimer = null, busy = false;

  async function api(path, opts) {
    const r = await fetch('https://api.github.com' + path, Object.assign({}, opts, {
      headers: { Accept: 'application/vnd.github+json', Authorization: 'Bearer ' + S().github.token, 'Content-Type': 'application/json' },
    }));
    if (r.status === 404) { const e = new Error('Gist not found'); e.status = 404; throw e; }
    if (r.status === 401 || r.status === 403) throw new Error('Token can’t access gists. It needs the “gist” scope.');
    if (!r.ok) throw new Error('GitHub returned ' + r.status);
    return r.json();
  }

  /* What gets synced: everything except secrets, per-device bits and transient timers. */
  function payload() {
    const s = JSON.parse(JSON.stringify(S()));
    s.github.token = '';
    delete s.sync; delete s.customBg; delete s.focusRun; delete s.presence;
    return JSON.stringify({ app: 'startpage', v: 2, updatedAt: S().updatedAt, state: s }, null, 1);
  }
  function apply(remote) {
    const st = S(), keep = { token: st.github.token, sync: st.sync, customBg: st.customBg, focusRun: st.focusRun, presence: st.presence };
    Object.keys(remote).forEach((k) => { st[k] = remote[k]; });
    st.github.token = keep.token; st.sync = keep.sync; st.customBg = keep.customBg; st.focusRun = keep.focusRun; st.presence = keep.presence;
    SP.store.save({ quiet: true });
    SP.app.renderAll();
  }
  function set(state, msg) { status = { state, msg }; const el = document.querySelector('[data-sync-status]'); if (el) el.textContent = label(); }
  function label() {
    if (status.state === 'busy') return 'Syncing…';
    if (status.state === 'error') return status.msg;
    const t = S().sync.lastSync;
    return t ? 'Last synced ' + SP.ui.ago(t) : 'Not synced yet';
  }

  async function findGist() {
    for (let page = 1; page <= 3; page++) {
      const list = await api('/gists?per_page=100&page=' + page);
      const g = list.find((x) => x.files && x.files[FILE]);
      if (g) return g.id;
      if (list.length < 100) break;
    }
    return null;
  }

  /* Pull if remote is newer, otherwise push. Creates the gist on first use. */
  async function now(opts) {
    opts = opts || {};
    if (!S().github.token || busy) return;
    busy = true; set('busy');
    try {
      const sy = S().sync;
      if (!sy.gistId) sy.gistId = (await findGist()) || '';
      if (!sy.gistId) {
        const g = await api('/gists', { method: 'POST', body: JSON.stringify({ description: DESC, public: false, files: { [FILE]: { content: payload() } } }) });
        sy.gistId = g.id;
      } else {
        let remote = null;
        try {
          const g = await api('/gists/' + sy.gistId);
          const f = g.files[FILE];
          let text = f && f.content;
          if (f && f.truncated && f.raw_url) text = await (await fetch(f.raw_url)).text();
          remote = text ? JSON.parse(text) : null;
        } catch (e) { if (e.status === 404) { sy.gistId = ''; busy = false; return now(opts); } throw e; }
        if (remote && remote.updatedAt > S().updatedAt && !opts.forcePush) { apply(remote.state); SP.ui.toast('Synced: pulled newer data'); }
        else if (!remote || remote.updatedAt < S().updatedAt || opts.forcePush) await api('/gists/' + sy.gistId, { method: 'PATCH', body: JSON.stringify({ files: { [FILE]: { content: payload() } } }) });
      }
      sy.lastSync = Date.now();
      SP.store.save({ quiet: true });
      set('idle');
    } catch (e) { console.warn(e); set('error', e.message || 'Sync failed'); }
    busy = false;
  }

  function schedulePush() {
    if (!S().github.token || !S().sync.auto || !S().sync.gistId) return;
    clearTimeout(pushTimer);
    pushTimer = setTimeout(() => now(), 5000);
  }

  function init() {
    SP.store.onSave(schedulePush);
    if (S().github.token && S().sync.auto && S().sync.gistId) now();
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && S().github.token && S().sync.auto && S().sync.gistId) now(); });
  }

  SP.sync = { now, init, label, get status() { return status; } };
})(window.SP = window.SP || {});
