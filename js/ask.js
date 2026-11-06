/* Ask a voice: type "? anything" in the search bar and the current voice answers, in character,
   via the Claude API with YOUR OWN key. The page has no build step, so this calls the Messages API
   with fetch rather than the SDK.
   Security trade-off: the key lives in this browser's localStorage, outside the synced/exported
   state, but any script running on this page (or an extension with access to it) could read it.
   Use a key with a spending limit. */
(function (SP) {
  'use strict';
  const { esc } = SP.ui;
  const I = SP.icon;
  const S = () => SP.store.state;
  const V = SP.voice.list;
  const KEY = 'startpage.anthropicKey';
  const API = 'https://api.anthropic.com/v1/messages';
  const MODELS = {
    'claude-opus-5-5': 'Claude Opus 5.5 (best, ~$4/$20 per M tokens)',
    'claude-sonnet-5-5': 'Claude Sonnet 5.5 (~$2/$10)',
    'claude-haiku-5-5': 'Claude Haiku 5.5 (cheapest, ~$0.10/$0.50)',
  };
  const FALLBACK_OK = { 'claude-opus-5-5': 1, 'claude-sonnet-5-5': 1 }; // server-side refusal fallbacks

  const getKey = () => { try { return localStorage.getItem(KEY) || ''; } catch (e) { return ''; } };
  const setKey = (k) => { try { k ? localStorage.setItem(KEY, k) : localStorage.removeItem(KEY); } catch (e) { /* storage blocked */ } };
  const model = () => (S().ask && MODELS[S().ask.model] ? S().ask.model : 'claude-opus-5-5');

  /* A few voiced lines for the chat chrome; everything else falls back to neutral. */
  const LINES = {
    neutral: { ask_label: ({ name }) => 'Ask ' + name, ask_ph: 'Ask a follow-up…', ask_thinking: 'Thinking…', ask_refused: 'That one can’t be answered here.', ask_send: 'Ask', sec_ask: 'Ask a voice (Claude API)' },
    monday: { ask_ph: 'Ask something. Make it worth my time…', ask_thinking: 'Ugh. Thinking…', ask_refused: 'No. Not even I’ll go there.', ask_send: 'Fine. Ask', sec_ask: 'Ask me things (you pay for it)' },
    supportive: { ask_ph: 'Tell me anything. EVERYTHING 💕', ask_thinking: 'Thinking about you… I mean, your question…', ask_refused: 'I can’t answer that one. But I still love you. 🙂', ask_send: 'Tell me', sec_ask: 'Talk to me (for real) 💕' },
    therapist: { ask_thinking: 'Hmm. Let me sit with that…', ask_send: 'Share', sec_ask: 'Book a session (billed to your API key)' },
    victorian: { ask_ph: 'Pose your question. Politely…', ask_thinking: 'One is considering…', ask_send: 'Enquire' },
  };
  for (const [k, l] of Object.entries(LINES)) Object.assign(V[k], l);
  const t = (k, c) => SP.voice.t(k, c);

  /* The persona: the voice's own name, descriptor and a handful of its real lines as style samples. */
  function system() {
    const k = SP.voice.key(), v = V[k], s = S();
    const sample = (key, ctx) => { try { const x = SP.voice.t(key, ctx); return typeof x === 'string' ? x : ''; } catch (e) { return ''; } };
    const lines = [sample('greet', 'evening'), sample('heroSub', { open: s.tasks.filter((x) => !x.done).length, focus: 0 }), sample('tasksEmpty'), sample('focusDone'), sample('welcomeBack'), sample('re_taskDone', { text: 'Ship it', open: 2, doneToday: 1 })]
      .filter((x) => x && x !== 'welcomeBack' && x !== 're_taskDone');
    const open = s.tasks.filter((x) => !x.done).slice(0, 10).map((x) => '- ' + x.text).join('\n') || '(none)';
    const h = SP.voice._h.bestHabit(s.habits), c = SP.voice.ctx();
    const who = s.name ? 'The user is called ' + s.name + '.' : 'The user has not told you their name.';
    const persona = k === 'neutral'
      ? 'You are the plain, factual voice of a personal browser startpage. Be concise and direct.'
      : 'You are "' + v.name + '", one of the personality voices of a personal browser startpage. Your one-line description: "' + v.descriptor + '". ' +
        'Play an exaggerated, extreme version of this character in every reply, in the same style as these lines you have already said to the user:\n' + lines.map((x) => '> ' + x).join('\n') + '\n' +
        'Stay in character, but still give a genuinely correct, useful answer to what was asked. Teasing and attitude are fine; never be cruel about who someone is, and drop the act if the user seems to be in real distress.';
    return persona + '\n\nKeep replies short: usually two to four sentences, plain text, no markdown headings. ' + who +
      '\nContext you may reference: local time ' + new Date().toLocaleString() + '; open tasks:\n' + open +
      (h && h.n ? '\nBest habit streak: ' + h.name + ', ' + h.n + ' days.' : '') + '\nVisits to the page today: ' + c.visits + '.';
  }

  /* -------- streaming request -------- */
  async function stream(messages, onText) {
    const m = model(), body = { model: m, max_tokens: 1024, stream: true, system: system(), messages, output_config: { effort: 'low' } };
    const headers = { 'content-type': 'application/json', 'x-api-key': getKey(), 'anthropic-version': '2026-10-21', 'anthropic-dangerous-direct-browser-access': 'true' };
    if (FALLBACK_OK[m]) { body.fallbacks = 'default'; headers['anthropic-beta'] = 'server-side-fallback-2026-07-01'; }
    const r = await fetch(API, { method: 'POST', headers, body: JSON.stringify(body) });
    if (!r.ok) {
      let msg = 'HTTP ' + r.status;
      try { const j = await r.json(); if (j.error && j.error.message) msg = j.error.message; } catch (e) { /* not json */ }
      const err = new Error(msg); err.status = r.status; throw err;
    }
    // Keep every content block as sent (thinking blocks included) so the next turn can pass them back unchanged.
    const blocks = []; let stop = null, buf = '';
    const reader = r.body.getReader(), dec = new TextDecoder();
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      let i;
      while ((i = buf.indexOf('\n\n')) >= 0) {
        const chunk = buf.slice(0, i); buf = buf.slice(i + 2);
        const data = chunk.split('\n').filter((l) => l.startsWith('data:')).map((l) => l.slice(5).trim()).join('');
        if (!data) continue;
        let ev; try { ev = JSON.parse(data); } catch (e) { continue; }
        if (ev.type === 'content_block_start') blocks[ev.index] = Object.assign({}, ev.content_block);
        else if (ev.type === 'content_block_delta') {
          const b = blocks[ev.index], d = ev.delta;
          if (!b) continue;
          if (d.type === 'text_delta') { b.text = (b.text || '') + d.text; onText(text(blocks)); }
          else if (d.type === 'thinking_delta') b.thinking = (b.thinking || '') + d.thinking;
          else if (d.type === 'signature_delta') b.signature = d.signature;
        } else if (ev.type === 'message_delta' && ev.delta) stop = ev.delta.stop_reason || stop;
        else if (ev.type === 'error') throw new Error((ev.error && ev.error.message) || 'Stream error');
      }
    }
    return { blocks: blocks.filter(Boolean), stop };
  }
  const text = (blocks) => blocks.filter((b) => b && b.type === 'text').map((b) => b.text || '').join('');

  /* -------- the chat card -------- */
  let convo = [], busy = false, prevFocus = null;
  const root = () => document.getElementById('ask');
  function open(question) {
    convo = []; prevFocus = document.activeElement;
    const el = root(), vk = SP.voice.key();
    el.hidden = false;
    el.innerHTML = '<div class="ask-card" role="dialog" aria-modal="true" aria-label="' + esc(t('ask_label', { name: V[vk].name })) + '">' +
      '<header class="wr-head"><span class="wr-kicker">' + I('chat', 16) + esc(t('ask_label', { name: V[vk].name })) + '</span><button class="icon-btn" data-ask-close aria-label="Close">' + I('x', 18) + '</button></header>' +
      '<div class="ask-log" aria-live="polite"></div>' +
      '<form class="ask-form"><input name="q" placeholder="' + esc(t('ask_ph')) + '" autocomplete="off" maxlength="2000" aria-label="Question"><button class="btn primary">' + esc(t('ask_send')) + '</button></form>' +
      '<p class="ask-meta small muted"></p></div>';
    el.querySelector('[data-ask-close]').onclick = close;
    el.onclick = (e) => { if (e.target === el) close(); };
    el.querySelector('.ask-form').onsubmit = (e) => { e.preventDefault(); const q = e.target.q.value.trim(); if (q && !busy) { e.target.q.value = ''; ask(q); } };
    meta();
    if (!getKey()) return setup(question);
    if (question) ask(question); else el.querySelector('.ask-form input').focus();
  }
  function meta() { const m = root().querySelector('.ask-meta'); if (m) m.innerHTML = esc(MODELS[model()].split(' (')[0]) + ' · your API key · <button class="link" data-ask-key>change key</button>'; const b = root().querySelector('[data-ask-key]'); if (b) b.onclick = () => setup(); }
  function setup(pending) {
    const log = root().querySelector('.ask-log');
    log.innerHTML = '<div class="ask-setup"><p><b>Bring your own Claude API key.</b> Create one at <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener">console.anthropic.com</a>. Requests go straight from this browser to Anthropic and are billed to your account.</p>' +
      '<p class="small muted">' + I('lock', 13) + ' The key is kept in this browser only: it is never synced to your gist and never included in exports. Anything that can run script on this page (including extensions with access to it) could read it, so use a key with a low spending limit.</p>' +
      '<form class="ask-keyform"><input type="password" name="k" placeholder="sk-ant-…" autocomplete="off" aria-label="Claude API key"><button class="btn primary">Save key</button></form>' +
      (getKey() ? '<button class="link danger" data-ask-forget>Remove saved key</button>' : '') + '</div>';
    log.querySelector('.ask-keyform').onsubmit = (e) => {
      e.preventDefault(); const k = e.target.k.value.trim(); if (!k) return;
      setKey(k); log.innerHTML = '';
      if (pending) ask(pending); else root().querySelector('.ask-form input').focus();
    };
    const f = log.querySelector('[data-ask-forget]'); if (f) f.onclick = () => { setKey(''); setup(pending); };
    log.querySelector('input').focus();
  }
  function bubble(cls, html) { const log = root().querySelector('.ask-log'), d = document.createElement('div'); d.className = 'ask-msg ' + cls; d.innerHTML = html; log.appendChild(d); log.scrollTop = log.scrollHeight; return d; }
  async function ask(q) {
    if (!getKey()) return setup(q);
    busy = true;
    const vk = SP.voice.key();
    bubble('me', esc(q));
    const out = bubble('them', '<b>' + esc(V[vk].name) + '</b><span class="muted">' + esc(t('ask_thinking')) + '</span>'), span = out.querySelector('span');
    convo.push({ role: 'user', content: q });
    try {
      const r = await stream(convo, (txt) => { span.className = ''; span.textContent = txt; root().querySelector('.ask-log').scrollTop = 1e9; });
      if (r.stop === 'refusal') { span.className = 'muted'; span.textContent = t('ask_refused'); convo.pop(); }
      else { convo.push({ role: 'assistant', content: r.blocks }); if (!text(r.blocks)) span.textContent = '…'; }
    } catch (e) {
      convo.pop(); span.className = 'err';
      span.textContent = e.status === 401 ? 'That API key was rejected. Check it and try again.' : e.status === 429 ? 'Rate limited or out of credit. Try again in a bit.' :
        e.status ? e.message : 'Couldn’t reach the Claude API. Check your connection (or an ad blocker).';
      if (e.status === 401) setTimeout(() => setup(q), 1200);
    }
    busy = false;
    const inp = root().querySelector('.ask-form input'); if (inp) inp.focus();
  }
  function close() { const el = root(); el.hidden = true; el.innerHTML = ''; convo = []; if (prevFocus && prevFocus.focus) prevFocus.focus(); }
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && root() && !root().hidden) { e.stopPropagation(); close(); } }, true);

  /* Settings section. */
  function settingsHtml() {
    return '<p class="small muted">Type <b>?</b> followed by a question in the search bar and the current voice answers, using the Claude API with your own key. ' +
      (getKey() ? 'A key is saved in this browser.' : 'No key saved yet.') + '</p>' +
      '<label class="field"><span>Model</span><select data-ask-model>' + Object.entries(MODELS).map(([k, n]) => '<option value="' + k + '"' + (model() === k ? ' selected' : '') + '>' + esc(n) + '</option>').join('') + '</select></label>' +
      '<button class="link" data-ask-setup>' + I('lock', 14) + ' ' + (getKey() ? 'Change or remove key' : 'Add your API key') + '</button>';
  }
  function bindSettings(p) {
    const sel = p.querySelector('[data-ask-model]'); if (sel) sel.onchange = () => { S().ask = { model: sel.value }; SP.store.save(); };
    const b = p.querySelector('[data-ask-setup]'); if (b) b.onclick = () => { SP.panel.close(); open(); setup(); };
  }

  SP.ask = { open, close, settingsHtml, bindSettings, hasKey: () => !!getKey(), _system: system };
})(window.SP = window.SP || {});
