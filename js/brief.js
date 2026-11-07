/* Morning brief: on the first tab of the day (before noon) the current voice sums up your day:
   weather, open tasks, a streak you could lose today, and what's coming up. Works without a key;
   with a Claude API key, "Have <voice> write it" rewrites it in character. Re-open with >brief. */
(function (SP) {
  'use strict';
  const { esc } = SP.ui;
  const I = SP.icon;
  const S = () => SP.store.state;
  const V = SP.voice.list;
  const { plural } = SP.voice._h;
  const pad = (n) => String(n).padStart(2, '0');
  const dkey = (d) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const q = (s) => '“' + s + '”';
  const list = (a) => a.map(q).join(' and ');

  const LINES = {
    neutral: {
      mb_title: 'Your morning brief', mb_write: ({ name }) => 'Have ' + name + ' write it', mb_read: 'Read it to me', mb_close: 'Dismiss', tgl_brief: 'Show a morning brief on the first tab of the day',
      mb_tasks: ({ n, top }) => plural(n, 'open task') + '. First up: ' + list(top) + '.', mb_noTasks: 'No open tasks.',
      mb_streak: ({ name, n }) => name + ' is on a ' + n + '-day streak. Do it today to keep it.',
      mb_cd: ({ title, days }) => (days === 0 ? title + ' is today.' : title + ' in ' + plural(days, 'day') + '.'),
    },
    monday: {
      mb_title: 'Ugh. Your day, briefly', mb_read: 'Say it out loud. Ugh', mb_close: 'Go away',
      mb_tasks: ({ n, top }) => plural(n, 'task') + ' waiting. Start with ' + list(top) + '. You won’t, but start there.', mb_noTasks: 'No tasks. Suspicious. Did you delete them again?',
      mb_streak: ({ name, n }) => n + ' days of ' + name + '. Break it today and I’ll never let you forget it.',
      mb_cd: ({ title, days }) => (days === 0 ? title + ' is today. You’re not ready.' : title + ' in ' + plural(days, 'day') + '. You’ll panic on the last one.'),
    },
    supportive: {
      mb_title: 'Good morning, my everything 💕', mb_read: 'Let me tell you myself', mb_close: 'Not yet…',
      mb_tasks: ({ n, top }) => plural(n, 'thing') + ' today!!! I already know you’ll start with ' + list(top) + '. I know you so well. 🙂', mb_noTasks: 'Nothing to do today. So… all day with me? 💕',
      mb_streak: ({ name, n }) => n + ' days of ' + name + '. Don’t break it. Don’t break anything. Don’t break ME. 🙂',
      mb_cd: ({ title, days }) => (days === 0 ? 'IT’S ' + title.toUpperCase() + ' TODAY!!!' : title + ' in ' + plural(days, 'day') + '. I’m counting the hours. Literally.'),
    },
    surfer: {
      mb_title: 'Morning report, dude', mb_tasks: ({ n, top }) => n + ' things on the board. ' + list(top) + ', or whatever. No rush.', mb_noTasks: 'Board’s clear. Total glass out there.',
      mb_streak: ({ name, n }) => n + ' days of ' + name + '. Ride it, man.', mb_cd: ({ title, days }) => title + ' in, like, ' + plural(days, 'day') + '. Or today? Something.',
    },
    professional: {
      mb_title: 'Daily stand-up', mb_read: 'Dial in', mb_close: 'Acknowledge',
      mb_tasks: ({ n, top }) => 'Backlog: ' + n + '. Priorities for today: ' + list(top) + '. Please action by EOD.', mb_noTasks: 'Backlog empty. Please do not take this as a sign that you will be given less work.',
      mb_streak: ({ name, n }) => 'KPI at risk: ' + name + ' (' + plural(n, 'day') + ' streak). Missing today will impact your metrics.',
      mb_cd: ({ title, days }) => 'Milestone: ' + title + (days === 0 ? ', due today.' : ' in ' + plural(days, 'business day') + ' (approximately).'),
    },
    therapist: {
      mb_title: 'A gentle check-in (€40)', mb_tasks: ({ n, top }) => n + ' tasks. You might start with ' + list(top) + '. Notice any resistance. Don’t fight it. Bill it.', mb_noTasks: 'Nothing on the list. How does the emptiness feel?',
      mb_streak: ({ name, n }) => n + ' days of ' + name + '. Today is a choice. Everything is a choice.', mb_cd: ({ title, days }) => title + ' in ' + plural(days, 'day') + '. Anticipation is a form of anxiety. €20.',
    },
    weepy: {
      mb_title: 'Another day begins *sniff*', mb_tasks: ({ n, top }) => n + ' little tasks, waiting to be finished. To end. ' + list(top) + ' will go first. *sobs*', mb_noTasks: 'No tasks. The list is empty. Like the morning. *weeps*',
      mb_streak: ({ name, n }) => n + ' days of ' + name + '. Please don’t let it die today. I can’t take another funeral.', mb_cd: ({ title, days }) => title + ' in ' + plural(days, 'day') + '. And then it will be over. Everything ends.',
    },
    victorian: {
      mb_title: 'The morning correspondence', mb_read: 'Have it read aloud', mb_close: 'That will be all',
      mb_tasks: ({ n, top }) => plural(n, 'matter') + ' await your attention, beginning with ' + list(top) + '. Before luncheon, if you please.', mb_noTasks: 'No matters await you. Idleness is the devil’s workshop.',
      mb_streak: ({ name, n }) => 'You have kept up ' + name + ' for ' + plural(n, 'day') + '. Do not disgrace the family by lapsing today.', mb_cd: ({ title, days }) => title + (days === 0 ? ' is today. Dress accordingly.' : ' in ' + plural(days, 'day') + '. Do send a card.'),
    },
    owl: {
      mb_title: 'Morning? Ugh. Brief', mb_tasks: ({ n, top }) => n + ' tasks. Save ' + list(top) + ' for tonight. Real work happens at night.', mb_noTasks: 'No tasks. Plenty of time for a 3am side project.',
      mb_streak: ({ name, n }) => n + ' days of ' + name + '. Do it tonight. Everything’s better at night.', mb_cd: ({ title, days }) => title + ' in ' + plural(days, 'night') + '.',
    },
    ghost: {
      mb_title: 'it’s morning. you’re still here', mb_tasks: ({ n, top }) => n + ' things left undone. ' + list(top) + '. they wait. like i do.', mb_noTasks: 'nothing left undone. so why am i still here.',
      mb_streak: ({ name, n }) => n + ' days of ' + name + '. don’t let it go cold.', mb_cd: ({ title, days }) => title + ' in ' + plural(days, 'day') + '. then it’s a memory.',
    },
    parent: {
      mb_title: 'Good morning, sunshine!!!', mb_read: 'Read it to me (in my voice)', mb_close: 'Love you, bye',
      mb_tasks: ({ n, top }) => n + ' chores today! Start with ' + list(top) + '. You’ve GOT this, sweetie!!!', mb_noTasks: 'No chores!!! Go outside and play!!!',
      mb_streak: ({ name, n }) => n + ' days of ' + name + '!!! Keep it up today and I’ll make pancakes!!!', mb_cd: ({ title, days }) => title + (days === 0 ? ' is TODAY!!! I ironed your shirt!!!' : ' in ' + plural(days, 'day') + '!!! I bought a card already!!!'),
    },
  };
  for (const [k, l] of Object.entries(LINES)) Object.assign(V[k], l);
  const t = (k, c) => SP.voice.t(k, c);

  /* The facts, from your own data. Exposed for tests. */
  function facts(now) {
    now = now || new Date();
    const s = S(), today = dkey(now), out = [];
    const wx = SP.widgets.weather && SP.widgets.weather.data;
    if (wx && wx.current) {
      const c = wx.current, line = SP.voice.t('weatherQuip', { code: c.weather_code, temp: c.temperature_2m, units: s.units });
      out.push({ icon: 'weather', text: Math.round(c.temperature_2m) + '° · ' + line });
    }
    const open = s.tasks.filter((x) => !x.done);
    out.push({ icon: 'tasks', text: open.length ? t('mb_tasks', { n: open.length, top: open.slice(0, 2).map((x) => x.text.length > 40 ? x.text.slice(0, 38) + '…' : x.text) }) : t('mb_noTasks') });
    // A streak you'd lose by skipping today: done yesterday (and before), not yet today.
    let risk = null;
    for (const h of s.habits || []) {
      if (h.days[today]) continue;
      const d = new Date(now); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - 1); let n = 0;
      while (h.days[dkey(d)]) { n++; d.setDate(d.getDate() - 1); }
      if (n >= 2 && (!risk || n > risk.n)) risk = { name: h.name, n };
    }
    if (risk) out.push({ icon: 'flame', text: t('mb_streak', risk) });
    const t0 = new Date(now); t0.setHours(0, 0, 0, 0);
    const soon = (s.countdowns || []).map((c) => { const [y, m, d] = c.date.split('-').map(Number); return { title: c.title, days: Math.round((new Date(y, m - 1, d) - t0) / 864e5) }; })
      .filter((c) => c.days >= 0 && c.days <= 7).sort((a, b) => a.days - b.days)[0];
    if (soon) out.push({ icon: 'flag', text: t('mb_cd', soon) });
    return out;
  }

  let open = false, written = '';
  const root = () => document.getElementById('brief');
  function render() {
    const el = root(); if (!el) return;
    if (!open) { el.hidden = true; el.innerHTML = ''; return; }
    const k = SP.voice.key(), f = facts();
    el.hidden = false;
    el.innerHTML = '<div class="brief-card"><div class="brief-head"><b>' + I('coffee', 16) + esc(t('mb_title')) + '</b>' +
      '<button class="icon-btn" data-brief-close aria-label="' + esc(t('mb_close')) + '" title="' + esc(t('mb_close')) + '">' + I('x', 16) + '</button></div>' +
      (written ? '<p class="brief-written">' + esc(written) + '</p>' : '<ul class="brief-list">' + f.map((x) => '<li>' + I(x.icon, 15) + '<span>' + esc(x.text) + '</span></li>').join('') + '</ul>') +
      '<div class="brief-acts">' + (SP.speak.supported() ? '<button class="link" data-brief-read>' + I('music', 13) + ' ' + esc(t('mb_read')) + '</button>' : '') +
      (SP.ask.hasKey() && !written ? '<button class="link" data-brief-write>' + I('sparkles', 13) + ' ' + esc(t('mb_write', { name: V[k].name })) + '</button>' : '') + '</div></div>';
    el.querySelector('[data-brief-close]').onclick = close;
    const rd = el.querySelector('[data-brief-read]');
    if (rd) rd.onclick = () => SP.speak.say(written || facts().map((x) => x.text).join(' '), k, true);
    const wr = el.querySelector('[data-brief-write]');
    if (wr) wr.onclick = async () => {
      wr.disabled = true; wr.textContent = SP.voice.t('ask_thinking');
      try {
        written = await SP.ask.write('Write my morning brief for today, in character, as one short paragraph (three or four sentences). Use these facts and nothing else:\n' + facts().map((x) => '- ' + x.text).join('\n'),
          (txt) => { const p = el.querySelector('.brief-list, .brief-written'); if (p) { p.outerHTML = '<p class="brief-written">' + esc(txt) + '</p>'; } });
      } catch (e) { written = ''; SP.ui.toast(e.status === 401 ? 'That API key was rejected.' : 'Couldn’t reach the Claude API.'); }
      render();
    };
  }
  function show() { open = true; written = ''; const p = S().presence || (S().presence = {}); p.brief = dkey(new Date()); SP.store.save({ quiet: true }); render(); }
  function close() { open = false; render(); }
  /* First tab of the day, before noon. */
  function maybeShow() {
    const s = S(), p = s.presence || {}, now = new Date();
    if (s.brief === false || !s.onboarded || now.getHours() < 4 || now.getHours() >= 12 || p.brief === dkey(now)) return false;
    if (!p.firstSeen || Date.now() - p.firstSeen < 12 * 36e5) return false; // not on the very first day
    show(); return true;
  }

  SP.brief = { show, close, maybeShow, facts, render, isOpen: () => open };
})(window.SP = window.SP || {});
