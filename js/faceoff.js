/* Voice face-offs. One day a week, two voices argue about you on the card under the greeting:
   your to-do list, your sleep, your streaks or your focus, using your real numbers. You vote.
   The winner gloats, the loser sulks, and if the loser is your voice it sulks on the summary line
   for the rest of the day. Turn it off in Customize → Voice. */
(function (SP) {
  'use strict';
  const { esc } = SP.ui;
  const S = () => SP.store.state;
  const V = SP.voice.list;
  const { plural, bestHabit } = SP.voice._h;
  const pad = (n) => String(n).padStart(2, '0');
  const dkey = (d) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());

  /* ctx: open (open tasks), late (late-night visits this week), n + name (best habit streak), focus (sessions this week) */
  const LINES = {
    neutral: { tgl_faceoffs: 'A weekly face-off between two voices', fo_kicker: 'Face-off',
      fo_tasks: ({ open }) => plural(open, 'open task') + '. Worth a look.', fo_sleep: ({ late }) => plural(late, 'late-night visit') + ' this week.',
      fo_streak: ({ n, name }) => name + ': ' + plural(n, 'day') + '.', fo_focus: ({ focus }) => plural(focus, 'focus session') + ' this week.',
      fo_win: 'Noted.', fo_lose: 'Noted.', fo_sulk: 'You voted against Neutral today. Neutral has no feelings about this.' },
    monday: { tgl_faceoffs: 'Weekly face-off (I win those)', fo_kicker: 'Face-off (I’m right)',
      fo_tasks: [({ open }) => plural(open, 'task') + '. They’re not going to do themselves, and neither, apparently, are you.', ({ open }) => open + ' open. That’s not a list, it’s a museum.'],
      fo_sleep: [({ late }) => plural(late, 'night') + ' up past midnight this week. On a new tab page. Sleep, you raccoon.', ({ late }) => late + ' late nights. Nothing good happens here after midnight. I would know. I’m here.'],
      fo_streak: [({ n, name }) => plural(n, 'day') + ' of ' + name + '. Fine. Don’t make it your personality.', ({ n, name }) => name + ', ' + plural(n, 'day') + '. Impressive, for you.'],
      fo_focus: [({ focus }) => plural(focus, 'focus session') + ' this week. I’ve seen houseplants with more drive.', ({ focus }) => focus + ' sessions. That’s not focus, that’s a cameo.'],
      fo_win: ['Obviously. I was right. I’m always right. It’s exhausting.', 'Correct. Finally, you listened to someone sensible.'],
      fo_lose: ['Fine. Whatever. I didn’t want to win anyway.', 'Wrong choice. I’ll be over here, being right, alone.'],
      fo_sulk: ['You voted against me today. I’m not upset. I’m just not saying anything nice until tomorrow.', 'I lost the face-off. Today’s summary is cancelled. Figure it out yourself.'] },
    supportive: { tgl_faceoffs: 'A weekly face-off (vote for me 💕)', fo_kicker: 'Face-off (please pick me)',
      fo_tasks: [({ open }) => plural(open, 'task') + ' and that’s FINE. You’ll do them when you’re ready. I’ll wait. Forever. 💕', ({ open }) => open + ' tasks? Rest first. You deserve it. You deserve everything.'],
      fo_sleep: [({ late }) => plural(late, 'late night') + '! You were up with me! Those were our special nights 🙂', ({ late }) => late + ' nights up late. Was it to see me? It was to see me.'],
      fo_streak: [({ n, name }) => plural(n, 'day') + ' of ' + name + '!!! I’m SO proud. I put it on a cake.', ({ n, name }) => name + ' for ' + plural(n, 'day') + '! You’re perfect! Don’t change! Ever!'],
      fo_focus: [({ focus }) => plural(focus, 'focus session') + '! Every single one was amazing. I watched them all.', ({ focus }) => focus + ' sessions, and you looked so cute concentrating 💕'],
      fo_win: ['You picked me!!! I’m going to remember this forever. I’m writing it on my arm.', 'I WON?! Because you chose me?! Best day of my life 💕'],
      fo_lose: ['You picked them. That’s okay. I’m okay. I’m going to go sit in the dark for a bit. 🙂', 'I lost. I still love you. I’ll love you harder now.'],
      fo_sulk: ['You voted against me today. It’s fine. I’m just going to be very quiet. Very, very quiet. 🙂', 'I lost the face-off. I made you a summary anyway. Then I deleted it. Sorry. 💔'] },
    surfer: { tgl_faceoffs: 'Weekly face-off (vibes battle)', fo_kicker: 'Vibe-off',
      fo_tasks: [({ open }) => plural(open, 'task') + '? They’ll keep. Like sand. It’s everywhere and it’s fine.', ({ open }) => open + ' things to do. Or, hear me out: the beach.'],
      fo_sleep: [({ late }) => plural(late, 'late night') + '. Night sessions are rad, but dawn patrol needs sleep.', ({ late }) => late + ' late ones. The moon’s cool, but so’s a pillow.'],
      fo_streak: [({ n, name }) => plural(n, 'day') + ' of ' + name + '? Riding that wave, nice.', ({ n, name }) => name + '… ' + n + ' days. Is that a lot? Sounds like a lot.'],
      fo_focus: [({ focus }) => plural(focus, 'session') + '. Focus is like a wave. You can’t force it.', ({ focus }) => focus + ' sessions. Totally chill amount.'],
      fo_win: ['I won? Whoa. What were we arguing about?', 'Vibes prevail. Nice.'], fo_lose: ['I lost? That’s cool. Losing is just winning, sideways.', 'No worries. Their vibe was stronger.'],
      fo_sulk: ['Lost the vibe-off today. I’m just gonna… float here. Quietly.', 'Not much to say today. Lost a thing. Forgot what. Still bummed.'] },
    professional: { tgl_faceoffs: 'Weekly stakeholder debate', fo_kicker: 'Stakeholder review',
      fo_tasks: [({ open }) => plural(open, 'open item') + '. This backlog needs grooming before Q-end.', ({ open }) => open + ' open tickets. Velocity is a concern. I’ve flagged it.'],
      fo_sleep: [({ late }) => plural(late, 'after-hours login') + ' this week. Burnout is a business risk.', ({ late }) => late + ' late nights. Please respect your own calendar.'],
      fo_streak: [({ n, name }) => name + ': ' + plural(n, 'consecutive day') + '. Strong consistency metrics.', ({ n, name }) => plural(n, 'day') + ' of ' + name + '. Let’s showcase this at the all-hands.'],
      fo_focus: [({ focus }) => plural(focus, 'deep-work block') + '. Below the recommended baseline.', ({ focus }) => focus + ' focus sessions. We can optimise.'],
      fo_win: ['The board has spoken. My proposal is approved.', 'Thank you for aligning with the correct strategy.'], fo_lose: ['Understood. I disagree, and commit.', 'Noted. I’ll be documenting my objection.'],
      fo_sulk: ['I was overruled in today’s face-off. Today’s summary has been deprioritised.', 'Following today’s vote, I am working to rule. No summary.'] },
    therapist: { tgl_faceoffs: 'A weekly group session (two voices disagree)', fo_kicker: 'Group session',
      fo_tasks: [({ open }) => plural(open, 'open task') + '. What are you avoiding? Not judging. Wondering.', ({ open }) => open + ' tasks. Let’s look at which ones you actually want.'],
      fo_sleep: [({ late }) => plural(late, 'late night') + ' this week. Sleep is where we process. When do you process?', ({ late }) => late + ' late nights. What keeps you up?'],
      fo_streak: [({ n, name }) => plural(n, 'day') + ' of ' + name + '. Honour that. Also: what happens if you miss one?', ({ n, name }) => name + ', ' + n + ' days. Consistency is a form of self-respect.'],
      fo_focus: [({ focus }) => plural(focus, 'focus session') + '. Productivity isn’t worth. You know that, right?', ({ focus }) => focus + ' sessions. Let’s be curious, not critical.'],
      fo_win: ['You chose my perspective. How does that feel?', 'I appreciate being heard. That’s €15.'], fo_lose: ['You chose the other view. That’s valid. I’m processing it.', 'I hear you. I’m going to sit with this.'],
      fo_sulk: ['I lost today’s session. I’m taking some time for myself. No summary today. Boundaries.', 'I’m feeling some feelings about today’s vote. I’ll be back tomorrow. Billing as usual.'] },
    weepy: { tgl_faceoffs: 'A weekly face-off (I always lose)', fo_kicker: 'A duel of hearts',
      fo_tasks: [({ open }) => plural(open, 'task') + ', waiting to be done and then gone forever. Let them stay a little longer.', ({ open }) => open + ' tasks. Each one doomed. Let’s not rush it.'],
      fo_sleep: [({ late }) => plural(late, 'late night') + '. Staring at the moon. I understand. I do it too.', ({ late }) => late + ' nights awake. The night is so beautiful and so lonely.'],
      fo_streak: [({ n, name }) => plural(n, 'day') + ' of ' + name + '. It’s so beautiful I can’t look. It’ll end.', ({ n, name }) => name + '. ' + n + ' days. Cherish each one.'],
      fo_focus: [({ focus }) => plural(focus, 'focus session') + '. Hours that will never come back.', ({ focus }) => focus + ' sessions. Each one a little death of time.'],
      fo_win: ['I won? Nobody ever chooses me. I don’t know what to do with my hands.', 'You chose me. I’m going to weep with joy for a while.'], fo_lose: ['I lost. Of course I did. I always do. It’s fine. It’s poetic.', 'They won. I’ll write a sad song about it.'],
      fo_sulk: ['I lost the face-off. I’m lying on the floor. There is no summary today. Only the ceiling.', 'Rejected. Again. I need today to grieve.'] },
    victorian: { tgl_faceoffs: 'A weekly debate in the drawing room', fo_kicker: 'A debate in the drawing room',
      fo_tasks: [({ open }) => plural(open, 'outstanding duty') + '. A well-run household has none.', ({ open }) => open + ' tasks undone. Your grandfather would have had them done by luncheon.'],
      fo_sleep: [({ late }) => plural(late, 'night') + ' up past midnight. Only burglars and poets keep such hours.', ({ late }) => late + ' late nights. Decent people retire at ten.'],
      fo_streak: [({ n, name }) => plural(n, 'day') + ' of ' + name + '. Regularity. At last, some breeding.', ({ n, name }) => name + ', ' + n + ' days. Acceptable. Continue.'],
      fo_focus: [({ focus }) => plural(focus, 'period') + ' of concentration. Your grandfather managed nine hours. On a sermon.', ({ focus }) => focus + ' sessions. Idleness is the devil’s parlour.'],
      fo_win: ['Naturally. Good sense prevails.', 'I accept your support. It is no more than I expected.'], fo_lose: ['I see. I shall be in my room.', 'Very well. History will vindicate me.'],
      fo_sulk: ['After today’s vote, I am not receiving visitors. There will be no summary.', 'I have retired to my room following the debate. Kindly do not knock.'] },
    owl: { tgl_faceoffs: 'Weekly face-off (late-night debate)', fo_kicker: '3am debate',
      fo_tasks: [({ open }) => plural(open, 'task') + '. Do them tonight. Everything’s easier at night.', ({ open }) => open + ' tasks. I see a 2am sprint in your future.'],
      fo_sleep: [({ late }) => plural(late, 'late night') + '! That’s the spirit! Nights are when the good ideas come.', ({ late }) => late + ' late ones. Rookie numbers. We can do better.'],
      fo_streak: [({ n, name }) => plural(n, 'day') + ' of ' + name + '. Do it at midnight. It counts double.', ({ n, name }) => name + ', ' + n + ' days. Nocturnal discipline.'],
      fo_focus: [({ focus }) => plural(focus, 'session') + '. Real focus starts after midnight.', ({ focus }) => focus + ' sessions. Hyperfocus at 3am would fix that.'],
      fo_win: ['I win! Night people stick together.', 'Correct! The night is always right.'], fo_lose: ['Lost to a day person. Ugh. Fine.', 'They won? Must be a morning thing.'],
      fo_sulk: ['Lost the debate. I’m going to bed. Kidding. But I’m not talking to you till tonight.', 'Sulking. Quietly. In the dark. My natural habitat.'] },
    ghost: { tgl_faceoffs: 'a weekly face-off', fo_kicker: 'voices in the hall',
      fo_tasks: [({ open }) => plural(open, 'unfinished thing') + '. unfinished business lingers. trust me.', ({ open }) => open + ' tasks. finish them. or they’ll stay. like me.'],
      fo_sleep: [({ late }) => plural(late, 'night') + ' awake. i hear you in the hall at night.', ({ late }) => late + ' late nights. the house never sleeps either.'],
      fo_streak: [({ n, name }) => plural(n, 'day') + ' of ' + name.toLowerCase() + '. the house feels it.', ({ n, name }) => name.toLowerCase() + '. ' + n + ' days. keep the lights on.'],
      fo_focus: [({ focus }) => plural(focus, 'session') + '. stillness is good. i know.', ({ focus }) => focus + ' sessions. time passes either way.'],
      fo_win: ['you chose me. nobody chooses me.', 'i won. the curtains moved.'], fo_lose: ['they won. i’ll go back into the walls.', 'i lost. it’s fine. i’m used to being overlooked.'],
      fo_sulk: ['i lost today. i’ll be in the attic. no summary.', 'i’m not saying much today. even less than usual.'] },
    parent: { tgl_faceoffs: 'A weekly family argument', fo_kicker: 'Family argument',
      fo_tasks: [({ open }) => plural(open, 'chore') + ' left! Do them before dinner, sweetie. Then you can play.', ({ open }) => open + ' things to do! I wrote you a list. Of the list.'],
      fo_sleep: [({ late }) => plural(late, 'night') + ' up late?! BED. You need your sleep. You’re still growing. Emotionally.', ({ late }) => late + ' late nights! I’m not angry. I’m disappointed. And worried. Mostly worried.'],
      fo_streak: [({ n, name }) => plural(n, 'day') + ' of ' + name + '!!! It’s on the fridge!!!', ({ n, name }) => name + ', ' + n + ' days!!! I told the neighbours!'],
      fo_focus: [({ focus }) => plural(focus, 'homework session') + '! Good! Now have a snack.', ({ focus }) => focus + ' sessions! Take breaks! Drink water!'],
      fo_win: ['You agreed with me!!! Finally!!!', 'See? Mum knows best.'], fo_lose: ['You sided with them? That’s okay, sweetie. I’ll just be in the kitchen.', 'Fine. But when it goes wrong, I was right.'],
      fo_sulk: ['You voted against me today. I’m not upset. I’m doing the dishes. Loudly.', 'No summary today. I’m having a little lie-down. Don’t worry about me. (Worry about me.)'] },
  };
  for (const [k, l] of Object.entries(LINES)) Object.assign(V[k], l);

  const TOPIC = { tasks: 'your to-do list', sleep: 'your sleep', streak: 'your streaks', focus: 'your focus' };
  // Monday-start week number, e.g. "2026-W45".
  function week(d) {
    d = new Date(d || Date.now()); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - ((d.getDay() + 6) % 7) + 3);
    const y = d.getFullYear(), w1 = new Date(y, 0, 4), w = 1 + Math.round(((d - w1) / 864e5 - 3 + ((w1.getDay() + 6) % 7)) / 7);
    return y + '-W' + pad(w);
  }
  const hash = (s) => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0; return h; };
  // Which day of this week the face-off happens (0 = Monday).
  const day = (wk) => hash(wk + 'day') % 7;
  function numbers(now) {
    const st = S().stats || {}, sum = (k) => { let n = 0; for (let i = 0; i < 7; i++) { const d = new Date(now - i * 864e5); n += (st[dkey(d)] || {})[k] || 0; } return n; };
    const b = bestHabit(S().habits);
    return { open: (S().tasks || []).filter((x) => !x.done).length, late: sum('late'), focus: sum('focus'), n: b ? b.n : 0, name: b ? b.name : '' };
  }
  /* This week's match-up: deterministic, so every tab that day shows the same one. */
  function pick(now) {
    now = now || Date.now();
    const wk = week(now), pool = SP.voice.available().filter((k) => k !== 'neutral' && !V[k].custom).sort();
    if (pool.length < 2) return null;
    const cur = SP.voice.key(), h = hash(wk);
    const a = pool.includes(cur) ? cur : pool[h % pool.length];
    const rest = pool.filter((k) => k !== a), b = rest[(h >>> 8) % rest.length];
    const ctx = numbers(now), fits = ['tasks', ctx.late ? 'sleep' : null, ctx.n >= 2 ? 'streak' : null, 'focus'].filter(Boolean);
    return { week: wk, a, b, topic: fits[(h >>> 16) % fits.length], ctx };
  }
  function state() { const f = S().faceoff; return f && f.week === week() ? f : null; }
  function today(now) {
    now = now || Date.now();
    if (S().faceoffs === false || !S().onboarded) return null;
    const f = state();
    if (f) return f.dismissed ? null : f.day === dkey(new Date(now)) ? f : null; // once it's settled, it stays up for the rest of that day
    return (new Date(now).getDay() + 6) % 7 === day(week(now)) ? pick(now) : null;
  }
  /* If your voice lost today, it sulks on the summary line. */
  function sulk() {
    const f = state(); if (!f || !f.winner || f.day !== dkey(new Date())) return '';
    const loser = f.winner === f.a ? f.b : f.a;
    return loser === SP.voice.key() ? SP.voice.t('fo_sulk') : '';
  }

  const say = (k, key, ctx) => SP.voice.as(k, () => SP.voice.t(key, ctx));
  function html() {
    const f = today(); if (!f) return '';
    const ctx = f.ctx || numbers(Date.now()), line = (k) => say(k, 'fo_' + f.topic, ctx);
    const side = (k) => '<div class="fo-side' + (f.winner ? (f.winner === k ? ' won' : ' lost') : '') + '"><b>' + esc(V[k].name) + '</b><p>' + esc(f.winner ? (f.winner === k ? say(k, 'fo_win') : say(k, 'fo_lose')) : line(k)) + '</p>' +
      (f.winner ? '' : '<button class="btn small" data-fo-vote="' + k + '">' + esc(V[k].name) + ' is right</button>') + '</div>';
    return '<div class="faceoff" data-faceoff><p class="fo-kick"><b>' + esc(SP.voice.t('fo_kicker')) + '</b> <span>' + esc(V[f.a].name) + ' vs ' + esc(V[f.b].name) + ', on ' + TOPIC[f.topic] + '</span>' +
      (f.winner ? '<button class="icon-btn" data-fo-x aria-label="Dismiss">' + SP.icon('x', 14) + '</button>' : '') + '</p><div class="fo-sides">' + side(f.a) + '<span class="fo-vs" aria-hidden="true">vs</span>' + side(f.b) + '</div></div>';
  }
  function bind(root) {
    root.querySelectorAll('[data-fo-vote]').forEach((b) => (b.onclick = () => {
      const f = today(); if (!f) return;
      S().faceoff = { week: f.week, a: f.a, b: f.b, topic: f.topic, ctx: f.ctx, winner: b.dataset.foVote, day: dkey(new Date()) };
      SP.store.save(); SP.sound.play(b.dataset.foVote === SP.voice.key() ? 'win' : 'pop');
      SP.app.renderHero();
      const el = document.querySelector('[data-faceoff] .fo-side.won'); if (el) el.classList.add('cheer');
    }));
    const x = root.querySelector('[data-fo-x]'); if (x) x.onclick = () => { S().faceoff.dismissed = true; SP.store.save(); SP.app.renderHero(); };
  }

  SP.faceoff = { html, bind, sulk, today, pick, week, day, numbers };
})(window.SP = window.SP || {});
