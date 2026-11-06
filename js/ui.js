/* Small DOM helpers, a promise-based dialog and a popover menu. */
(function (SP) {
  'use strict';
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uid = () => Math.random().toString(36).slice(2, 9);

  function normalizeUrl(u) {
    u = (u || '').trim();
    if (!u) return '';
    if (!/^[a-z][a-z0-9+.-]*:/i.test(u)) u = 'https://' + u;
    return u;
  }
  function host(u) { try { return new URL(u).hostname.replace(/^www\./, ''); } catch (e) { return ''; } }
  function favicon(u) { const h = host(u); return h ? 'https://www.google.com/s2/favicons?sz=64&domain=' + encodeURIComponent(h) : ''; }

  function ago(date) {
    const s = Math.max(0, (Date.now() - new Date(date).getTime()) / 1000);
    if (s < 60) return 'now';
    if (s < 3600) return Math.floor(s / 60) + 'm ago';
    if (s < 86400) return Math.floor(s / 3600) + 'h ago';
    if (s < 86400 * 30) return Math.floor(s / 86400) + 'd ago';
    return new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  /* ---- dialog ---- */
  const dlg = () => $('#dlg');
  function dialog(title, bodyHtml, opts) {
    opts = opts || {};
    const d = dlg();
    d.innerHTML = '<form method="dialog" class="dlg-form">' +
      '<header class="dlg-head"><h2>' + esc(title) + '</h2><button type="button" class="icon-btn" data-close aria-label="Close">' + SP.icon('x', 18) + '</button></header>' +
      '<div class="dlg-body">' + bodyHtml + '</div>' +
      (opts.actions === false ? '' : '<footer class="dlg-foot">' + (opts.extra || '') +
        '<button type="button" class="btn ghost" data-close>' + esc(opts.cancelText || (SP.voice ? SP.voice.t('dlg_cancel') : 'Cancel')) + '</button>' +
        '<button type="submit" class="btn primary" value="ok">' + esc(opts.okText || (SP.voice ? SP.voice.t('dlg_save') : 'Save')) + '</button></footer>') +
      '</form>';
    return new Promise((resolve) => {
      const form = d.querySelector('form');
      const done = (v) => { d.close(); resolve(v); };
      d.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', () => done(null)));
      form.addEventListener('submit', (e) => { e.preventDefault(); done(Object.fromEntries(new FormData(form).entries())); });
      d.onclose = () => resolve(null);
      d.oncancel = (e) => { e.preventDefault(); done(null); };
      if (opts.mount) opts.mount(d, done);
      d.showModal();
      const first = d.querySelector('input:not([type=hidden]),textarea,select');
      if (first) first.focus();
    });
  }

  function form(title, fields, opts) {
    const html = fields.map((f) => {
      const id = 'f_' + f.name;
      if (f.type === 'select') return '<label class="field"><span>' + esc(f.label) + '</span><select id="' + id + '" name="' + f.name + '">' +
        f.options.map((o) => '<option value="' + esc(o.value) + '"' + (o.value === f.value ? ' selected' : '') + '>' + esc(o.label) + '</option>').join('') + '</select></label>';
      if (f.type === 'icons') return '<fieldset class="field"><span>' + esc(f.label) + '</span><div class="icon-pick">' +
        f.options.map((o) => '<label><input type="radio" name="' + f.name + '" value="' + o + '"' + (o === f.value ? ' checked' : '') + '><span>' + SP.icon(o, 18) + '</span></label>').join('') + '</div></fieldset>';
      return '<label class="field"><span>' + esc(f.label) + '</span><input id="' + id + '" name="' + f.name + '" type="' + (f.type || 'text') + '" value="' + esc(f.value || '') + '"' +
        (f.placeholder ? ' placeholder="' + esc(f.placeholder) + '"' : '') + (f.required ? ' required' : '') + ' autocomplete="off"></label>';
    }).join('');
    return dialog(title, html, opts);
  }

  function confirm(title, text, okText) {
    return dialog(title, '<p class="muted">' + esc(text) + '</p>', { okText: okText || 'Confirm' }).then((v) => !!v);
  }

  /* ---- popover menu ---- */
  let openMenu = null;
  function closeMenu() { if (openMenu) { openMenu.remove(); openMenu = null; } }
  function menu(anchor, items, opts) {
    closeMenu();
    opts = opts || {};
    const m = document.createElement('div');
    m.className = 'menu';
    m.setAttribute('role', 'menu');
    m.innerHTML = (opts.title ? '<div class="menu-title">' + esc(opts.title) + '</div>' : '') + items.map((it, i) => it.sep ? '<hr>' :
      (it.href ? '<a role="menuitem" class="menu-item" href="' + esc(it.href) + '">' : '<button role="menuitem" type="button" class="menu-item' + (it.danger ? ' danger' : '') + '" data-i="' + i + '">') +
      (it.img ? '<img src="' + esc(it.img) + '" alt="" width="16" height="16" loading="lazy">' : it.icon ? SP.icon(it.icon, 16) : '') +
      '<span>' + esc(it.label) + '</span>' + (it.href ? '</a>' : '</button>')).join('');
    document.body.appendChild(m);
    const r = anchor.getBoundingClientRect(), mw = m.offsetWidth, mh = m.offsetHeight;
    let x = opts.side ? r.right + 6 : r.right - mw, y = opts.side ? r.top - 6 : r.bottom + 6;
    x = Math.max(8, Math.min(x, innerWidth - mw - 8));
    if (y + mh > innerHeight - 8) y = Math.max(8, (opts.side ? r.bottom : r.top) - mh - 6);
    m.style.left = x + 'px'; m.style.top = y + 'px';
    m.addEventListener('click', (e) => {
      const b = e.target.closest('[data-i]');
      if (b) { closeMenu(); items[+b.dataset.i].action(); }
    });
    m.querySelectorAll('img').forEach((img) => img.addEventListener('error', () => img.replaceWith(Object.assign(document.createElement('span'), { className: 'menu-dot' }))));
    openMenu = m;
    setTimeout(() => m.querySelector('.menu-item') && m.querySelector('.menu-item').focus(), 0);
  }
  document.addEventListener('pointerdown', (e) => { if (openMenu && !openMenu.contains(e.target)) closeMenu(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });

  function toast(msg) {
    document.querySelectorAll('.toast').forEach((n) => n.remove()); // newest message wins instead of piling up
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.classList.add('out'), 2400);
    setTimeout(() => t.remove(), 2800);
  }

  SP.ui = { $, $$, esc, uid, normalizeUrl, host, favicon, ago, dialog, form, confirm, menu, closeMenu, toast };
})(window.SP = window.SP || {});
