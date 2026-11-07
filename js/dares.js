/* Daily dares: once a day the current voice offers one small, optional challenge under the summary
   line. Accept it and progress is counted from that moment; finish it and the voice reacts. Ignore it
   or say no and nothing happens: no penalties, no streaks to lose. Off switch in Customize → Voice. */
(function (SP) {
  'use strict';
  const { esc } = SP.ui;
  const I = SP.icon;
  const S = () => SP.store.state;
  const V = SP.voice.list;
  const pad = (n) => String(n).padStart(2, '0');
  const dkey = (d) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());

  /* What each dare needs. Progress is measured against a snapshot taken when you accept. */
  const today = () => (S().stats || {})[dkey(new Date())] || {};
  const snap = () => ({ done: today().done || 0, focus: today().focus || 0, notes: (S().notes || '').length });
  const habitsDone = () => { const k = dkey(new Date()), h = S().habits || []; return h.length && h.every((x) => x.days[k]); };
  const TYPES = {
    one: { can: () => S().tasks.some((x) => !x.done), goal: 1, progress: (b) => (today().done || 0) - b.done },
    three: { can: () => S().tasks.filter((x) => !x.done).length >= 3, goal: 3, progress: (b) => (today().done || 0) - b.done },
    focus: { can: () => true, goal: 1, progress: (b) => (today().focus || 0) - b.focus },
    habits: { can: () => (S().habits || []).length > 0 && !habitsDone(), goal: 1, progress: () => (habitsDone() ? 1 : 0) },
    zero: { can: () => { const n = S().tasks.filter((x) => !x.done).length; return n >= 1 && n <= 5; }, goal: 1, progress: () => (S().tasks.some((x) => !x.done) ? 0 : 1) },
    note: { can: () => true, goal: 1, progress: (b) => ((S().notes || '').length > b.notes ? 1 : 0) },
  };

  const LINES = {
    neutral: { dare_kicker: 'Today’s dare', dare_ok: 'Accept', dare_no: 'Not today', dare_doneTag: 'Dare done', tgl_dares: 'Offer a small daily dare',
      d_one: 'Finish one task today.', d_three: 'Finish three tasks today.', d_focus: 'Complete one focus session.', d_habits: 'Check off every habit today.', d_zero: 'Clear your task list.', d_note: 'Write one note.',
      dare_done: 'Dare complete.', dare_declined: 'No dare today. That’s fine.' },
    monday: { dare_kicker: 'Ugh. A dare', dare_ok: 'Fine', dare_no: 'Coward option',
      d_one: 'Finish one task before you open YouTube. I dare you.', d_three: 'Three tasks. Today. You won’t.', d_focus: 'One focus session without touching your phone. Ha.', d_habits: 'Every habit. Today. Prove me wrong.', d_zero: 'Zero open tasks by tonight. I’ll believe it when I see it.', d_note: 'Write one note. One. A single thought.',
      dare_done: ['Ugh. You did it. Don’t expect a parade.', 'Fine. Dare done. I’m mildly impressed. Mildly.'], dare_declined: 'Saw that coming. Ugh.' },
    supportive: { dare_kicker: 'A little dare, for me 💕', dare_ok: 'For you', dare_no: 'Not today (I’ll wait)',
      d_one: 'Finish one task for me? Just one. I’ll watch. 💕', d_three: 'Three tasks today and I’ll be SO proud I won’t sleep.', d_focus: 'Do a focus session. I’ll sit right here. Silently. Watching. 🙂', d_habits: 'Do all your habits today? For me? 💕', d_zero: 'Clear your list today so tonight is just us. 🙂', d_note: 'Write me a note. Anything. I’ll read it forty times.',
      dare_done: ['YOU DID IT!!! For ME!!! I’m framing this moment. 💖', 'Dare done!!! I knew you would. I always know. 🙂'], dare_declined: 'That’s okay. I’ll ask again tomorrow. And the day after. Forever. 🙂' },
    surfer: { dare_kicker: 'Dare, bro', dare_ok: 'Send it', dare_no: 'Nah',
      d_one: 'Shred one task today, man.', d_three: 'Three tasks. Like a set of waves.', d_focus: 'One focus session. Find the zone, dude.', d_habits: 'All the habits today. Full send.', d_zero: 'Clear the board. Total flat calm.', d_note: 'Write a note, man. Like, a thought. You have those.',
      dare_done: 'Whoa, you did it! What was it again? Doesn’t matter. Stoked.', dare_declined: 'No worries, man. The ocean doesn’t dare anyone.' },
    professional: { dare_kicker: 'Stretch goal', dare_ok: 'Commit', dare_no: 'Deprioritize',
      d_one: 'Stretch goal: close one action item today.', d_three: 'Stretch goal: three deliverables by EOD.', d_focus: 'Stretch goal: one uninterrupted deep-work block.', d_habits: 'Stretch goal: 100% habit compliance today.', d_zero: 'Stretch goal: inbox zero, but for tasks.', d_note: 'Stretch goal: document one learning.',
      dare_done: 'Stretch goal achieved. This has been noted favourably. Do not let it go to your head.', dare_declined: 'Understood. I’ve noted your lack of ambition.' },
    therapist: { dare_kicker: 'A gentle invitation', dare_ok: 'I’ll try', dare_no: 'Not ready',
      d_one: 'I invite you to finish one task. Notice what comes up.', d_three: 'Three tasks today. What would it mean to you?', d_focus: 'One focus session. Sit with the discomfort.', d_habits: 'All your habits today. A small act of self-care. €20.', d_zero: 'An empty list. Imagine how that would feel. Now go and feel it.', d_note: 'Write one note. Journaling is healing. And billable.',
      dare_done: 'You did it. How does that feel? Take your time. That’s €40.', dare_declined: 'That’s valid. Saying no is a boundary. €15.' },
    weepy: { dare_kicker: 'A dare *sniff*', dare_ok: 'For you', dare_no: 'Not today',
      d_one: 'Finish one task. Let it go. Let it rest. *sobs*', d_three: 'Three tasks. Three little goodbyes.', d_focus: 'One focus session. Twenty-five minutes we’ll never get back.', d_habits: 'Every habit today. Before it’s too late. It’s always too late.', d_zero: 'Empty the list. Then we’ll mourn it together.', d_note: 'Write a note. Something to remember you by.',
      dare_done: 'You did it. *weeps with joy* *then weeps normally*', dare_declined: 'Of course. Nobody accepts my dares. *stares out of the window*' },
    victorian: { dare_kicker: 'A small test of character', dare_ok: 'I accept', dare_no: 'I decline',
      d_one: 'Attend to one matter before luncheon. I shall be watching.', d_three: 'Three matters today. Your grandfather managed eleven.', d_focus: 'One session of quiet application. No fidgeting.', d_habits: 'Every constitutional today. No exceptions.', d_zero: 'Leave not a single matter unattended by nightfall.', d_note: 'Write one line in your commonplace book. Mind your spelling.',
      dare_done: 'You have passed. I am not surprised. I am not unsurprised either.', dare_declined: 'You decline. How very modern of you.' },
    owl: { dare_kicker: 'Night dare', d_one: 'Finish one task after dark. It counts double. (It doesn’t.)', d_three: 'Three tasks before sunrise.', d_focus: 'One focus session at an unreasonable hour.', d_habits: 'Every habit, even the boring daytime ones.', d_zero: 'Clear the list. Then start a 3am side project.', d_note: 'Write down the 3am idea before it escapes.', dare_done: 'Done!!! Momentum!!! Do another!!!', dare_declined: 'Fine. We’ll stay up and do nothing instead.' },
    ghost: { dare_kicker: 'a small thing', d_one: 'finish one thing. so it can rest.', d_three: 'three things. three ghosts, freed.', d_focus: 'sit still for one session. like me.', d_habits: 'do every habit today. keep the house warm.', d_zero: 'no unfinished business by tonight. maybe then i can leave.', d_note: 'write something down. so there’s proof you were here.', dare_done: 'it’s done. the house feels lighter.', dare_declined: 'that’s alright. i’m not going anywhere.' },
    parent: { dare_kicker: 'A little challenge, sweetie!', dare_ok: 'Okay!', dare_no: 'Maybe later',
      d_one: 'Do one chore today and I’ll put a gold star on the fridge!', d_three: 'Three chores today! You can do it, champ!', d_focus: 'One homework session! I’ll make snacks!', d_habits: 'All your good habits today! I believe in you!', d_zero: 'Tidy the whole list today! So proud already!', d_note: 'Write a little note! I’ll put it on the fridge!',
      dare_done: 'YOU DID IT!!! Gold star!!! I’m calling your grandmother!!!', dare_declined: 'That’s okay, sweetie! Rest is important too!' },
  };
  for (const [k, l] of Object.entries(LINES)) Object.assign(V[k], l);
  const t = (k, c) => SP.voice.t(k, c);
  const pickLine = (k) => { const v = V[SP.voice.key()][k] !== undefined ? V[SP.voice.key()][k] : V.neutral[k]; return Array.isArray(v) ? v[Math.floor(Math.random() * v.length)] : v; };

  /* Today's dare: picked by date so it's stable all day, skipping ones that make no sense right now. */
  function current() {
    const s = S(), day = dkey(new Date());
    if (s.dares === false || !s.onboarded) return null;
    if (s.dare && s.dare.day === day) return s.dare;
    let h = 0; for (const ch of day + (s.seed || 0)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    const ok = Object.keys(TYPES).filter((k) => TYPES[k].can());
    if (!ok.length) return null;
    s.dare = { day, type: ok[h % ok.length], state: 'offered' };
    return s.dare;
  }
  function progress(d) { return d && d.state === 'accepted' ? Math.max(0, Math.min(TYPES[d.type].goal, TYPES[d.type].progress(d.base))) : 0; }

  function accept() { const d = current(); if (!d) return; d.state = 'accepted'; d.base = snap(); d.voice = SP.voice.key(); SP.store.save(); check(); SP.app.renderHero(); }
  function decline() { const d = current(); if (!d) return; d.state = 'declined'; SP.store.save(); const k = SP.voice.key(); SP.ui.toast(pickLine('dare_declined'), { who: k === 'neutral' ? '' : V[k].name }); SP.app.renderHero(); }
  /* Called whenever something countable happens. */
  function check() {
    const d = S().dare;
    if (!d || d.day !== dkey(new Date()) || d.state !== 'accepted') return false;
    if (progress(d) < TYPES[d.type].goal) { if (document.querySelector('.dare')) SP.app.renderHero(); return false; }
    d.state = 'done'; SP.react.stat('dares'); SP.store.save();
    const k = SP.voice.key();
    setTimeout(() => SP.ui.toast(pickLine('dare_done'), { who: (k === 'neutral' ? '' : V[k].name + ' · ') + 'dare done', ms: 6000 }), 500);
    SP.app.renderHero(); if (SP.achieve) SP.achieve.check();
    return true;
  }

  function html() {
    const d = current();
    if (!d || d.state === 'declined') return '';
    const goal = TYPES[d.type].goal, n = progress(d), text = t('d_' + d.type);
    if (d.state === 'done') return '<div class="dare done">' + I('check', 14) + '<span><b>' + esc(t('dare_doneTag')) + '</b> ' + esc(text) + '</span></div>';
    return '<div class="dare' + (d.state === 'accepted' ? ' on' : '') + '">' + I('flag', 14) + '<span><b>' + esc(t('dare_kicker')) + ':</b> ' + esc(text) +
      (d.state === 'accepted' && goal > 1 ? ' <i class="dare-n">' + n + '/' + goal + '</i>' : '') + '</span>' +
      (d.state === 'offered' ? '<button class="btn small" data-dare-ok>' + esc(t('dare_ok')) + '</button><button class="link" data-dare-no>' + esc(t('dare_no')) + '</button>' : '') + '</div>';
  }
  function bind(root) {
    const a = root.querySelector('[data-dare-ok]'), b = root.querySelector('[data-dare-no]');
    if (a) a.onclick = accept; if (b) b.onclick = decline;
  }

  SP.dares = { current, accept, decline, check, progress, html, bind, TYPES };
})(window.SP = window.SP || {});
