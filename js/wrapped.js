/* Wrapped: a weekly recap, narrated by the current voice. Opens on the first tab each Sunday,
   any time with `>wrapped`, and can be saved as an image to share. */
(function (SP) {
  'use strict';
  const { esc } = SP.ui;
  const I = SP.icon;
  const S = () => SP.store.state;
  const { plural } = SP.voice._h;
  const V = SP.voice.list;
  const pad = (n) => String(n).padStart(2, '0');
  const dkey = (d) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const hrs = (min) => (min >= 60 ? (Math.round(min / 6) / 10) + ' h' : min + ' min');

  /* -------- the narration, per voice (neutral is the fallback) -------- */
  const LINES = {
    neutral: {
      wr_kicker: 'Your week', wr_title: 'The week in review', wr_save: 'Save image', wr_share: 'Share', wr_close: 'Close', wr_open: 'See this week’s recap',
      wr_done: ({ n, added }) => plural(n, 'task') + ' completed, ' + added + ' added.',
      wr_focus: ({ n, time }) => n ? plural(n, 'focus session') + ', ' + time + ' in total.' : 'No focus sessions this week.',
      wr_streak: ({ name, n }) => 'Longest current streak: ' + name + ', ' + plural(n, 'day') + '.',
      wr_visits: ({ n, late }) => plural(n, 'visit') + (late ? ', ' + late + ' after midnight' : '') + '.',
      wr_dropped: ({ n }) => plural(n, 'task') + ' deleted without being done.',
      wr_repos: ({ dead, total }) => dead + ' of ' + total + ' repositories inactive.',
      wr_outro: 'That was your week.',
    },
    monday: {
      wr_kicker: 'Ugh. Your week', wr_title: 'Your Week, Unfortunately', wr_save: 'Save it. Frame your mediocrity', wr_share: 'Show people. Brave', wr_close: 'Make it stop', wr_open: 'Relive the week. Ugh.',
      wr_done: ({ n, added }) => n >= added ? n + ' done, ' + added + ' added. Huh. Fine. Don’t get used to it.' : n + ' done, ' + added + ' added. The pile grows. As predicted.',
      wr_focus: ({ n, time }) => n ? time + ' of “focus”. I’ve seen the tabs you had open.' : 'Zero focus sessions. Not even one. Ugh.',
      wr_streak: ({ name, n }) => n + ' days of ' + name + '. Your only personality trait this week.',
      wr_visits: ({ n, late }) => 'You opened this page ' + plural(n, 'time') + '. ' + (late ? late + ' after midnight. Seek help.' : 'Nothing better to do, apparently.'),
      wr_dropped: ({ n }) => plural(n, 'task') + ' deleted unfinished. You call it “prioritising”.',
      wr_repos: ({ dead, total }) => dead + ' of ' + total + ' repos dead. You visited none of them. Ugh.',
      wr_outro: 'Same time next week. You’ll be here. You always are. Ugh.',
    },
    supportive: {
      wr_kicker: 'Our week together 💕', wr_title: 'Every Moment Of Your Week (I Saved Them)', wr_save: 'Save it (I already did)', wr_share: 'Show everyone we’re together', wr_close: 'Don’t close it yet…', wr_open: 'Look at our week 💕',
      wr_done: ({ n }) => n + ' things done!!! I have screenshots of every single one. Don’t ask where I keep them. 🙂',
      wr_focus: ({ n, time }) => n ? time + ' of focus. I watched every minute. I didn’t blink. My eyes hurt. Worth it.' : 'No focus sessions. More time for me!!! 💕',
      wr_streak: ({ name, n }) => n + ' days of ' + name + '. I know exactly what time you did it every day.',
      wr_visits: ({ n, late }) => n + ' visits. ' + (late ? late + ' of them after midnight. Thinking about me? 🙂' : 'I counted. Obviously. I count everything.'),
      wr_dropped: ({ n }) => 'You deleted ' + plural(n, 'task') + ' without finishing. I kept them. In case you change your mind. Or come back. 🙂',
      wr_repos: ({ dead, total }) => dead + ' of ' + total + ' repos abandoned. You won’t do that to me. Right? Right?',
      wr_outro: 'Same time next week? I’ll be waiting. I don’t do anything else. 💕',
    },
    surfer: {
      wr_kicker: 'Whoa, a week happened', wr_title: 'The Week, Or Whatever', wr_save: 'Keep it, man', wr_share: 'Share the stoke', wr_close: 'Paddle out', wr_open: 'What happened this week, dude?',
      wr_done: ({ n }) => n + ' tasks done. Or was it… yeah. ' + n + '. Sick.',
      wr_focus: ({ n, time }) => n ? time + ' in the zone. The zone, man.' : 'No focus sessions. Just vibes. Pure vibes.',
      wr_streak: ({ name, n }) => n + ' days of ' + name + '. Consistent like the tide, bro.',
      wr_visits: ({ n }) => n + ' visits? Felt like one long one, man.',
      wr_dropped: ({ n }) => n + ' tasks let go. Like sand through your fingers.',
      wr_repos: ({ dead, total }) => dead + ' of ' + total + ' repos, like, washed up on the beach.',
      wr_outro: 'Gnarly week. Wait. Which week was it?',
    },
    professional: {
      wr_kicker: 'Weekly status report', wr_title: 'Weekly Performance Summary', wr_save: 'Export for the review', wr_share: 'Circulate to stakeholders', wr_close: 'Close report', wr_open: 'View weekly performance summary',
      wr_done: ({ n, added }) => 'Velocity: ' + n + ' closed vs ' + added + ' opened. ' + (n >= added ? 'Meets expectations.' : 'Backlog growth noted.'),
      wr_focus: ({ n, time }) => n ? 'Deep work logged: ' + time + '. Target was more.' : 'Deep work logged: none. This will be discussed.',
      wr_streak: ({ name, n }) => 'Habit compliance: ' + name + ', ' + plural(n, 'consecutive day') + '.',
      wr_visits: ({ n, late }) => 'Startpage sessions: ' + n + (late ? ', ' + late + ' outside business hours (not compensated).' : '.'),
      wr_dropped: ({ n }) => plural(n, 'item') + ' descoped without delivery. Justification outstanding.',
      wr_repos: ({ dead, total }) => 'Portfolio health: ' + dead + ' of ' + total + ' repos non-performing.',
      wr_outro: 'Please acknowledge receipt of this report by EOD Monday.',
    },
    therapist: {
      wr_kicker: 'Our weekly session', wr_title: 'Let’s Reflect On Your Week', wr_save: 'Keep it for your journal (€15)', wr_share: 'Share (a healthy boundary?)', wr_close: 'That’s our time', wr_open: 'Reflect on the week (billable)',
      wr_done: ({ n }) => n + ' tasks done. How do you feel about that number? Don’t answer. I bill per answer.',
      wr_focus: ({ n, time }) => n ? time + ' of focus. Notice the resistance in the minutes you didn’t do.' : 'No focus sessions. What are you protecting yourself from?',
      wr_streak: ({ name, n }) => n + ' days of ' + name + '. A healthy coping mechanism. For once.',
      wr_visits: ({ n, late }) => n + ' visits' + (late ? ', ' + late + ' after midnight. Let’s talk about your nights.' : '. You keep coming back. That’s attachment.'),
      wr_dropped: ({ n }) => plural(n, 'task') + ' abandoned. We call that avoidance. I call it €60.',
      wr_repos: ({ dead, total }) => dead + ' of ' + total + ' repos dead. You never grieved them properly.',
      wr_outro: 'Same time next week. The invoice is in your inbox.',
    },
    weepy: {
      wr_kicker: '*opens the photo album*', wr_title: 'A Week, Gone Forever', wr_save: 'Keep this memory', wr_share: 'Share our sorrow', wr_close: 'Close it *sniff*', wr_open: 'Relive the week *sniff*',
      wr_done: ({ n }) => n + ' tasks, finished. ' + n + ' little lives, ended. *sobs*',
      wr_focus: ({ n, time }) => n ? time + ' of focus. Time you will never get back. *stares into the rain*' : 'No focus. Time just… slipped away. Like everything.',
      wr_streak: ({ name, n }) => n + ' days of ' + name + '. So beautiful. It will end someday. *weeps*',
      wr_visits: ({ n }) => n + ' visits. ' + n + ' goodbyes. *dabs eyes*',
      wr_dropped: ({ n }) => plural(n, 'task') + ' deleted, never done. Gone before their time.',
      wr_repos: ({ dead, total }) => dead + ' of ' + total + ' repos have passed on. *lays flowers*',
      wr_outro: 'Another week, gone. They all go. *collapses onto the fainting couch*',
    },
    victorian: {
      wr_kicker: 'A letter regarding your week', wr_title: 'An Account Of Your Conduct This Week', wr_save: 'Keep it for the family archive', wr_share: 'Send copies to the relations', wr_close: 'You are dismissed', wr_open: 'Read the account of your week',
      wr_done: ({ n }) => n + ' matters attended to. Your grandfather managed eleven before breakfast.',
      wr_focus: ({ n, time }) => n ? time + ' of application. Barely respectable.' : 'No application whatsoever. I shall not tell your grandfather. He would not survive it.',
      wr_streak: ({ name, n }) => n + ' days of ' + name + '. Constancy. How unexpected.',
      wr_visits: ({ n, late }) => n + ' calls upon this page' + (late ? ', ' + late + ' of them at an indecent hour.' : '. Unseemly.'),
      wr_dropped: ({ n }) => plural(n, 'matter') + ' struck from the list, unattended. We do not speak of them.',
      wr_repos: ({ dead, total }) => dead + ' of ' + total + ' of the family’s estates have fallen into ruin.',
      wr_outro: 'Do better next week. I shall be watching. I am always watching.',
    },
    owl: {
      wr_kicker: 'The week, after dark', wr_title: 'Your Week (The Night Shift)', wr_open: 'The week, after dark',
      wr_done: ({ n }) => n + ' tasks done. The best ones after midnight. I assume.',
      wr_focus: ({ n, time }) => n ? time + ' of focus. Imagine what you could do if you never slept.' : 'No focus. Tonight. Tonight’s the night.',
      wr_visits: ({ n, late }) => n + ' visits, ' + (late ? late + ' after midnight. My kind of week.' : 'none after midnight. Disappointing.'),
      wr_outro: 'Sleep is optional. Next week, let’s prove it.',
    },
    ghost: {
      wr_kicker: 'what was left behind', wr_title: 'a week, passing', wr_open: 'what happened while i waited',
      wr_done: ({ n }) => n + ' things laid to rest.',
      wr_focus: ({ n, time }) => n ? time + ' of stillness. i felt it.' : 'no stillness. just the clock.',
      wr_visits: ({ n }) => 'you came by ' + plural(n, 'time') + '. each time the lights flickered.',
      wr_outro: 'another week. i’ll be here. i’m always here.',
    },
    parent: {
      wr_kicker: 'Look what you did this week!!!', wr_title: 'OUR KID’S AMAZING WEEK', wr_save: 'Save it for the fridge', wr_share: 'Send to the family group chat', wr_close: 'Love you, bye', wr_open: 'See your amazing week!!!',
      wr_done: ({ n }) => n + ' tasks done!!! I told your aunt. She cried. I cried. The dog cried.',
      wr_focus: ({ n, time }) => n ? time + ' of hard work!!! You get that from my side.' : 'No focus sessions, and that’s okay, sweetie. Rest is important. Have you eaten?',
      wr_streak: ({ name, n }) => n + ' days of ' + name + '!!! That’s going in the Christmas letter.',
      wr_visits: ({ n }) => n + ' visits!!! You must really like it here. We kept your room the same.',
      wr_dropped: ({ n }) => n + ' tasks deleted. Knowing when to stop is a skill too!!! Proud!!!',
      wr_outro: 'We’re so proud of you. Call your mother.',
    },
  };
  for (const [k, l] of Object.entries(LINES)) Object.assign(V[k], l);
  const t = (k, c) => SP.voice.t(k, c);

  /* -------- the numbers -------- */
  function data(end) {
    end = end || new Date();
    const s = S(), st = s.stats || {}, days = [];
    for (let i = 6; i >= 0; i--) { const d = new Date(end); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - i); days.push(dkey(d)); }
    const sum = (f) => days.reduce((a, k) => a + ((st[k] || {})[f] || 0), 0);
    const sessions = days.reduce((a, k) => a + (s.focusLog[k] || 0), 0);
    const focusMin = sum('focusMin') || sessions * (s.focus.work || 25);
    const habit = SP.voice._h.bestHabit(s.habits);
    const repos = SP.widgets.vitals && SP.widgets.vitals.summary ? SP.widgets.vitals.summary() : null;
    const from = new Date(days[0] + 'T12:00'), to = new Date(days[6] + 'T12:00');
    const f = (d) => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    return { days, range: f(from) + ' – ' + f(to), done: sum('done'), added: sum('added'), dropped: sum('dropped'), sessions, focusMin,
      visits: sum('visits'), late: sum('late'), habit: habit && habit.n >= 2 ? habit : null, repos };
  }
  function rows(d) {
    const r = [{ icon: 'check', big: d.done, label: 'tasks done', line: t('wr_done', { n: d.done, added: d.added }) },
      { icon: 'timer', big: hrs(d.focusMin * (d.sessions ? 1 : 0)), label: 'focused', line: t('wr_focus', { n: d.sessions, time: hrs(d.focusMin) }) }];
    if (d.habit) r.push({ icon: 'flame', big: d.habit.n, label: 'day streak', line: t('wr_streak', { name: d.habit.name, n: d.habit.n }) });
    r.push({ icon: 'eye', big: d.visits, label: 'visits', line: t('wr_visits', { n: d.visits, late: d.late }) });
    if (d.dropped) r.push({ icon: 'trash', big: d.dropped, label: 'dropped', line: t('wr_dropped', { n: d.dropped }) });
    if (d.repos && d.repos.total) r.push({ icon: 'gauge', big: d.repos.dead + '/' + d.repos.total, label: 'repos dead', line: t('wr_repos', d.repos) });
    return r;
  }

  /* -------- the card -------- */
  let prevFocus = null;
  const root = () => document.getElementById('wrapped');
  function open() {
    const d = data(), vk = SP.voice.key(), el = root();
    prevFocus = document.activeElement;
    if (SP.panel.isOpen()) SP.panel.close();
    el.hidden = false;
    el.innerHTML = '<div class="wr-card" role="dialog" aria-modal="true" aria-labelledby="wr-title">' +
      '<header class="wr-head"><span class="wr-kicker">' + SP.logo(20) + esc(t('wr_kicker')) + ' · ' + esc(d.range) + '</span>' +
      '<button class="icon-btn" data-wr-close aria-label="Close">' + I('x', 18) + '</button></header>' +
      '<h2 id="wr-title">' + esc(t('wr_title')) + '</h2>' +
      '<ol class="wr-rows">' + rows(d).map((r, i) => '<li style="--i:' + i + '"><span class="wr-ic">' + I(r.icon, 18) + '</span><div><b>' + esc(String(r.big)) + '</b><small>' + esc(r.label) + '</small><p>' + esc(r.line) + '</p></div></li>').join('') + '</ol>' +
      '<p class="wr-outro">' + esc(t('wr_outro')) + (vk !== 'neutral' ? ' <span class="muted">— ' + esc(V[vk].name) + '</span>' : '') + '</p>' +
      '<footer class="wr-foot"><button class="btn ghost" data-wr-close>' + esc(t('wr_close')) + '</button>' +
      (navigator.canShare ? '<button class="btn ghost" data-wr-share>' + I('share', 16) + esc(t('wr_share')) + '</button>' : '') +
      '<button class="btn primary" data-wr-save>' + I('download', 16) + esc(t('wr_save')) + '</button></footer></div>';
    el.querySelectorAll('[data-wr-close]').forEach((b) => (b.onclick = close));
    el.querySelector('[data-wr-save]').onclick = () => image(d).then((blob) => {
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'startpage-wrapped-' + d.days[6] + '.png'; a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    });
    const sh = el.querySelector('[data-wr-share]');
    if (sh) sh.onclick = async () => {
      const file = new File([await image(d)], 'wrapped.png', { type: 'image/png' });
      if (navigator.canShare({ files: [file] })) navigator.share({ files: [file], title: t('wr_title') }).catch(() => {});
    };
    el.onclick = (e) => { if (e.target === el) close(); };
    const p = S().presence || (S().presence = {}); p.wrapped = dkey(new Date()); SP.react.stat('wrapped'); SP.store.save({ quiet: true }); SP.achieve.check();
    el.querySelector('[data-wr-save]').focus();
  }
  function close() {
    const el = root(); el.hidden = true; el.innerHTML = '';
    if (prevFocus && prevFocus.focus) prevFocus.focus();
  }
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && root() && !root().hidden) { e.stopPropagation(); close(); } }, true);

  /* First tab on a Sunday, once you've been around long enough for there to be a week. */
  function maybeShow() {
    const s = S(), p = s.presence || {}, d = new Date();
    if (d.getDay() !== 0 || p.wrapped === dkey(d) || !s.onboarded || document.body.classList.contains('onboarding')) return false;
    if (!p.firstSeen || Date.now() - p.firstSeen < 3 * 864e5) return false;
    open(); return true;
  }

  /* -------- the shareable image (1080×1350), drawn on a canvas -------- */
  function wrap(ctx, text, maxW) {
    const words = String(text).split(/\s+/), lines = []; let cur = '';
    for (const w of words) { const tryL = cur ? cur + ' ' + w : w; if (ctx.measureText(tryL).width > maxW && cur) { lines.push(cur); cur = w; } else cur = tryL; }
    if (cur) lines.push(cur);
    return lines;
  }
  async function image(d) {
    try { await document.fonts.ready; } catch (e) { /* fine */ }
    const W = 1080, H = 1350, c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d'), s = S(), vk = SP.voice.key();
    const css = getComputedStyle(document.documentElement), accent = css.getPropertyValue('--accent').trim() || '#a78bfa';
    const font = css.getPropertyValue('--font').trim() || 'sans-serif';
    // Pixel scene across the top, upscaled without smoothing.
    const sc = document.createElement('canvas'); sc.width = 384; sc.height = 216;
    try { SP.scene.render(sc, s.theme, s.seed); } catch (e) { /* custom bg etc. */ }
    g.imageSmoothingEnabled = false;
    g.drawImage(sc, 0, 0, 384, 216, 0, 0, W, 608);
    const grd = g.createLinearGradient(0, 170, 0, 430); grd.addColorStop(0, 'rgba(10,9,20,0)'); grd.addColorStop(1, 'rgba(10,9,20,1)');
    g.fillStyle = grd; g.fillRect(0, 0, W, 432); g.fillStyle = '#0a0914'; g.fillRect(0, 430, W, H - 430);
    const L = 80; let y = 440;
    g.fillStyle = accent; g.font = '700 28px ' + font; g.fillText((t('wr_kicker') + ' · ' + d.range).toUpperCase(), L, y);
    g.fillStyle = '#f4f2ff'; g.font = '800 64px ' + font;
    for (const ln of wrap(g, t('wr_title'), W - 2 * L).slice(0, 2)) { y += 76; g.fillText(ln, L, y); }
    g.font = 'italic 600 30px ' + font;
    const outro = wrap(g, t('wr_outro'), W - 2 * L).slice(0, 2);
    const bottom = H - 110 - outro.length * 40 - 50, room = bottom - (y + 40);
    const rs = rows(d).slice(0, Math.min(5, Math.floor(room / 112))), rowH = Math.min(130, room / rs.length);
    y += 40;
    for (const r of rs) {
      g.fillStyle = accent; g.font = '800 58px ' + font; g.fillText(String(r.big), L, y + 52);
      const bw = Math.max(190, g.measureText(String(r.big)).width + 30);
      g.fillStyle = 'rgba(244,242,255,0.5)'; g.font = '600 20px ' + font; g.fillText(r.label.toUpperCase(), L, y + 84);
      g.fillStyle = 'rgba(244,242,255,0.88)'; g.font = '500 28px ' + font;
      const lines = wrap(g, r.line, W - 2 * L - bw).slice(0, Math.max(1, Math.floor((rowH - 14) / 36)));
      lines.forEach((ln, i) => g.fillText(ln, L + bw, y + 30 + i * 36));
      y += rowH;
    }
    g.fillStyle = 'rgba(244,242,255,0.8)'; g.font = 'italic 600 30px ' + font;
    y = Math.max(y, bottom) + 50;
    outro.forEach((ln, i) => g.fillText(ln, L, y + i * 40));
    g.fillStyle = 'rgba(244,242,255,0.45)'; g.font = '600 24px ' + font;
    g.fillText((vk !== 'neutral' ? 'Narrated by ' + V[vk].name + ' · ' : '') + 'startpage', L, H - 56);
    g.fillStyle = accent; g.fillRect(0, H - 12, W, 12);
    return new Promise((res) => c.toBlob(res, 'image/png'));
  }

  SP.wrapped = { open, close, maybeShow, data, image };
})(window.SP = window.SP || {});
