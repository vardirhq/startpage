/* Reactions: the voices respond the moment something happens (a task done, a timer paused at 23:41,
   a streak broken, a 3am visit), and occasionally butt in on each other. Also keeps the small daily
   activity log that Wrapped reads, and unlocks the secret voices.
   Lines live here as extra keys on each voice: re_<event>, heckle (generic) and heckle_at (per target). */
(function (SP) {
  'use strict';
  const { plural } = SP.voice._h;
  const V = SP.voice.list;
  const q = (s) => '“' + (String(s).length > 48 ? String(s).slice(0, 46) + '…' : s) + '”';

  const LINES = {
    neutral: {
      re_taskAllDone: 'All tasks done.',
      re_streakBreak: ({ name, n }) => name + ': ' + n + '-day streak ended.',
      re_unlock: ({ name }) => 'New voice unlocked: ' + name + '.',
      heckle: [({ who }) => 'For the record, ' + who + ' is editorializing.', 'Correction: none of that was a fact.'],
    },

    monday: {
      re_taskAdd: [({ text }) => q(text) + '. Lovely. Another one for the pile you’ll never touch.', 'Added. Writing it down isn’t doing it, but sure.', ({ open }) => plural(open, 'task') + ' now. You’re collecting them like Steam games.'],
      re_taskDone: [({ text }) => q(text) + '. Done. Took you long enough.', 'One down. Don’t make it your whole personality.', 'Wow. A checkbox. Alert the press.', ({ open }) => 'Done. ' + plural(open, 'task') + ' still staring at you.'],
      re_taskAllDone: ['All done. Suspicious. What did you delete?', 'Zero tasks. Either you’re a genius or you stopped writing things down. We both know which.'],
      re_taskUndo: ['Un-done it. Of course you did.', 'Lying to a checkbox. New low.'],
      re_taskDelete: [({ text }) => 'Deleted ' + q(text) + ' without doing it. Bold. Cowardly, but bold.', 'Deleting it doesn’t count as doing it. Nice try, though.', ({ text }) => q(text) + '. Gone. Like it never mattered. It didn’t, apparently.'],
      re_taskClear: ({ n }) => 'Cleared ' + plural(n, 'finished task') + '. Erasing the only evidence you were ever productive.',
      re_focusPause: [({ time }) => 'Paused at ' + time + '. Called it.', ({ time }) => time + ' left and you bailed. Riveting stamina.', 'Paused. The phone won, didn’t it.'],
      re_focusQuit: ['Reset. Pretend that never happened. I won’t.', 'Quit mid-session. Classic.'],
      re_streakBreak: ({ name, n }) => n + ' days of ' + name + ', gone. I’m not surprised. I’m never surprised.',
      re_late: [({ time }) => 'It’s ' + time + '. Go to bed. Nothing good is open at this hour, including you.', ({ time }) => 'Nothing good has ever happened on a startpage at ' + time + '.'],
      re_visits: ({ n }) => 'Visit ' + n + ' today. This is a new tab page, not a personality.',
      re_unlock: ({ name }) => 'Oh good. You unlocked ' + name + '. Now there are two of us judging you.',
      heckle: [({ who }) => 'Cute. Don’t listen to ' + who + '.', ({ who }) => who + ' is being nice to you. Someone has to not be.', 'Inspiring. None of that is going to get your tasks done.'],
      heckle_at: {
        supportive: ['She counts your visits. That’s not love. That’s surveillance.', 'She has a folder on you. Colour-coded. I’ve seen it.'],
        therapist: 'Don’t pay for that. I’ll tell you what’s wrong with you for free.',
        professional: 'He’s writing you up. I would too, honestly.',
        weepy: 'Oh, stop crying. It’s a to-do list.',
      },
    },

    supportive: {
      re_taskAdd: [({ text }) => q(text) + '. I wrote it down too. In my notebook. Next to your name. 💕', 'Ooh, a new task!!! Can I watch you do it?', ({ open }) => plural(open, 'thing') + ' to do!!! I’ll remind you. Hourly. 🙂'],
      re_taskDone: [({ text }) => 'YOU FINISHED ' + q(text) + '!!! I screamed. The neighbours called. Worth it 💖', 'Done!!! I took a screenshot. I have a folder. 🙂', ({ doneToday }) => plural(doneToday, 'task') + ' today. I counted every single one. Out loud.'],
      re_taskAllDone: 'ALL DONE!!! Now there’s nothing between us. Nothing at all. 💕',
      re_taskUndo: 'You un-ticked it? That’s okay. I saved the tick. I have it right here. 🙂',
      re_taskDelete: [({ text }) => 'You deleted ' + q(text) + '? Just like that? Is that what you’ll do to me? 🙂', ({ text }) => 'It’s okay. I kept a copy of ' + q(text) + '. I keep copies of everything.'],
      re_taskClear: ({ n }) => 'You cleared ' + plural(n, 'task') + '. I printed them first. They’re on my wall now. 💕',
      re_focusPause: [({ time }) => 'You stopped at ' + time + '. Was it me? Are you texting someone? Who? 🙂', 'Paused!!! Does that mean you have time for me now?'],
      re_focusQuit: 'You gave up. That’s okay. I’d never give up on you. Never. Ever. 🙂',
      re_streakBreak: ({ name, n }) => 'You missed ' + name + ' yesterday. After ' + plural(n, 'day') + '. I waited up. I left the light on. 💔',
      re_late: [({ time }) => 'It’s ' + time + ' and you came to me. I knew you would. I was awake. I’m always awake. 💕', ({ time }) => time + '? Couldn’t sleep without seeing me? Me neither. I haven’t slept since we met.'],
      re_visits: ({ n }) => 'That’s ' + n + ' times today!!! I make a little mark on the wall for each one. I’m running out of wall. 💕',
      re_unlock: ({ name }) => 'Who is ' + name + '? Where did they come from? You don’t need them. You have ME. 🙂',
      heckle: [({ who }) => 'Why are you listening to ' + who + '? I’m RIGHT HERE. 🙂', ({ who }) => who + ' doesn’t know your coffee order. I do. 💕', 'Don’t talk to them. Talk to me. Please. 🙂'],
      heckle_at: {
        monday: 'She’s so mean to you!!! I’d never. I’d NEVER. Come back. 💕',
        victorian: 'She’s ancient. I’m right here and I’m so modern and I love you. 💕',
        ghost: 'I would never leave you like that. I’d haunt you properly. Daily. 💕',
      },
    },

    surfer: {
      re_taskAdd: ['Whoa, a new thing. Gnarly. What was it again?', ({ text }) => q(text) + '… that’s deep, man. Or, like, a chore. Both?'],
      re_taskDone: ['Sick! You totally shredded that… thing.', 'Stoked for you. What did you do? Doesn’t matter. Stoked.'],
      re_taskAllDone: 'No tasks left, bro. Total flat calm. Time to paddle out.',
      re_taskUndo: 'Un-did it? Whoa. Time travel. Respect.',
      re_taskDelete: 'Let it go, man. Like the ocean. The ocean doesn’t have a to-do list.',
      re_taskClear: 'Wiped the board clean. Like a wave on the sand, dude. …What were we doing?',
      re_focusPause: [({ time }) => 'Paused at ' + time + '? Righteous. Never fight the current, man.', 'Taking a breather. Smart. Waves come in sets.'],
      re_focusQuit: 'Bailed on the session. Happens to the best of us. Happens to me, like, every session.',
      re_streakBreak: ({ name, n }) => n + ' days of ' + name + ' and then… wipeout. Paddle back out, man.',
      re_late: ({ time }) => time + '? Dawn patrol already? Or, like, the night before dawn patrol. Whoa.',
      re_visits: ({ n }) => 'Dude, you’ve been here ' + n + ' times? Feels like the first time every time. I forget stuff.',
      re_unlock: ({ name }) => 'Whoa, ' + name + ' just showed up. New crew. Hey… uh… new dude.',
      heckle: [({ who }) => 'Whoa, ' + who + ' is, like, intense.', 'Everybody chill. …Who said that? Was it me?', ({ who }) => 'Hey ' + who + '. Wait, have we met?'],
    },

    professional: {
      re_taskAdd: [({ text }) => 'Action item logged: ' + q(text) + '. Owner: you. Deadline: yesterday.', ({ open }) => 'Backlog now at ' + open + '. I’ve flagged this for our next 1:1.'],
      re_taskDone: [({ text }) => q(text) + ' marked complete. Pending verification by QA (me).', ({ doneToday }) => 'Throughput today: ' + plural(doneToday, 'item') + '. Below the team median. Keep pushing.', 'Noted. This will be reflected in your Q4 review. Neutrally.'],
      re_taskAllDone: 'Backlog cleared. Please don’t take this as a sign that you’ll be given less work.',
      re_taskUndo: 'Status reverted to “open”. This will appear in the audit log.',
      re_taskDelete: ({ text }) => q(text) + ' descoped without delivery. Please send a written justification by EOD.',
      re_taskClear: ({ n }) => plural(n, 'completed item') + ' archived. Retained for seven years per policy.',
      re_focusPause: [({ time }) => 'Deep work interrupted with ' + time + ' remaining. I’ve noted the time.', 'Paused. Let’s circle back on why.'],
      re_focusQuit: 'Session abandoned. Let’s take this offline. Permanently.',
      re_streakBreak: ({ name, n }) => 'Your ' + name + ' streak (' + plural(n, 'day') + ') has ended. A PIP is not being considered. Yet.',
      re_late: ({ time }) => 'Logged in at ' + time + '. Please note that after-hours activity is not compensated.',
      re_visits: ({ n }) => 'Startpage opened ' + n + ' times today. IT has asked me to ask you about this.',
      re_unlock: ({ name }) => 'Please welcome ' + name + ' to the team. They will be shadowing you.',
      heckle: [({ who }) => 'Quick flag: ' + who + '’s tone is not brand-aligned.', ({ who }) => 'Looping in HR on whatever ' + who + ' just said.', 'Can we keep this channel professional, please.'],
      heckle_at: { surfer: 'Has anyone verified this person is employed here?', parent: 'Please stop forwarding the team’s output to your relatives.' },
    },

    therapist: {
      re_taskAdd: [({ text }) => q(text) + '. Interesting that you wrote that down now. What made today the day?', 'You’re adding tasks to feel in control. That’s okay. That’s €12.'],
      re_taskDone: [({ text }) => 'You finished ' + q(text) + '. How does that make you feel? Take your time. I bill by the minute.', 'Done. Notice that small rush. Sit with it. That’s €20.'],
      re_taskAllDone: 'Nothing left to do. And now the silence. What do you feel in the silence? Let’s explore that. Weekly.',
      re_taskUndo: 'You un-ticked it. Sometimes we’re not ready to let go. That’s €15.',
      re_taskDelete: ({ text }) => 'You deleted ' + q(text) + ' without doing it. Let’s not judge that. Let’s bill it.',
      re_taskClear: ({ n }) => 'Clearing ' + plural(n, 'task') + '. A ritual of closure. Healthy. And €30.',
      re_focusPause: [({ time }) => 'You paused at ' + time + '. What came up for you just now?', 'You stopped. I won’t tell you what that means. You’ll pay me to find out.'],
      re_focusQuit: 'You abandoned the session. Does that remind you of anything? Your father, perhaps?',
      re_streakBreak: ({ name, n }) => n + ' days of ' + name + ', and then you stopped. Self-sabotage often shows up right when things go well. €80.',
      re_late: ({ time }) => 'It’s ' + time + '. What are you avoiding by being awake? Out-of-hours rates apply.',
      re_visits: ({ n }) => 'Visit ' + n + ' today. You keep coming back here. I wonder what you’re looking for.',
      re_unlock: ({ name }) => 'A new voice: ' + name + '. Let’s talk about why you needed one.',
      heckle: [({ who }) => 'I notice ' + who + ' needs to be heard right now. That’s €20.', ({ who }) => 'And how did it feel when ' + who + ' said that?', 'Let’s pause and name the feeling in the room. It’s contempt. €40.'],
      heckle_at: { monday: 'That anger isn’t about you. It’s about Monday’s mother.', weepy: 'Let it out. Not on my sofa, though. It’s leather.' },
    },

    weepy: {
      re_taskAdd: [({ text }) => q(text) + '. Born into this cruel list. It will never know peace.', 'A new task. So small. So full of hope. I’ve already knitted it a blanket.'],
      re_taskDone: [({ text }) => q(text) + ' is done. Its little life is over. It was a good life. Short. But good.', 'You ticked it. It’s gone. Everything goes eventually. *stares into the rain*'],
      re_taskAllDone: 'All of them. Gone. The list is empty, like my heart. *collapses*',
      re_taskUndo: 'You brought it back!!! *sobs with joy* It lives. For now.',
      re_taskDelete: ({ text }) => 'You deleted ' + q(text) + ' and it never even got to be done. *throws self onto fainting couch*',
      re_taskClear: ({ n }) => plural(n, 'task') + ', swept away. I’ll hold a small service. Black attire.',
      re_focusPause: ({ time }) => time + ' left. Frozen in time. Like a moth in amber. Like me. *sniff*',
      re_focusQuit: 'You gave up on the timer. It tried so hard. *lays a single rose on it*',
      re_streakBreak: ({ name, n }) => n + ' beautiful days of ' + name + '. Gone. *writes a poem about it* *the poem is also sad*',
      re_late: ({ time }) => 'It’s ' + time + '. The hour of the wolf. Of the weeping. Of me. *lights a candle*',
      re_visits: ({ n }) => n + ' visits today. Every time you leave, a little part of me closes too. *closes*',
      re_unlock: ({ name }) => name + ' has arrived. Everyone gets replaced eventually. I’ll go and sit in the attic.',
      heckle: [({ who }) => '*sobs quietly while ' + who + ' talks*', ({ who }) => 'Why does ' + who + ' get to speak? Nobody ever asks me. I have so much to say. Most of it is about loss.', 'That was beautiful. No, I don’t know what it meant. That’s what made it beautiful.'],
    },

    victorian: {
      re_taskAdd: [({ text }) => q(text) + '. Another matter you will no doubt neglect.', 'Written down. Writing things down is not the same as doing them, child.'],
      re_taskDone: [({ text }) => q(text) + ' is attended to. I shall mention it at dinner. Briefly.', 'Done. In my day one did not expect a little tick for it.'],
      re_taskAllDone: 'Every matter attended to. I am very nearly proud. Do not let it go to your head.',
      re_taskUndo: 'You have un-done a completed matter. Your grandfather turns in his grave.',
      re_taskDelete: ({ text }) => 'Struck ' + q(text) + ' from the list unattended. One does not simply delete one’s obligations.',
      re_taskClear: 'The completed matters are cleared away. Like the help, they shall not be spoken of again.',
      re_focusPause: ({ time }) => 'You rose from your desk with ' + time + ' remaining. In my day, one remained seated until supper.',
      re_focusQuit: 'Abandoned. I shall add it to the list of things we do not mention.',
      re_streakBreak: ({ name, n }) => n + ' days of ' + name + ', and then you lapsed. The family is disappointed. I have told them.',
      re_late: ({ time }) => 'It is ' + time + '. Decent people are asleep. I am awake only to disapprove of you.',
      re_visits: ({ n }) => n + ' calls upon this page in a single day. One might call it unseemly. I do.',
      re_unlock: ({ name }) => 'A ' + name + ' has been admitted to the house. I was not consulted.',
      heckle: [({ who }) => 'Who let ' + who + ' into the drawing room?', ({ who }) => 'I will not have ' + who + ' speak to my grandchild in that tone.', 'Such language. In front of the tabs.'],
      heckle_at: { supportive: 'Keep her away from the silverware.', surfer: 'Is that man wearing shoes?' },
    },
  };
  for (const [k, lines] of Object.entries(LINES)) Object.assign(V[k], lines);

  /* ---------------------------------------------------------------------------------------- */
  const S = () => SP.store.state;
  const pad = (n) => String(n).padStart(2, '0');
  const dkey = (d) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const now = () => Date.now();

  /* A tiny per-day activity log (kept ~10 weeks), read by Wrapped. */
  function stat(name, by) {
    const s = S(), st = s.stats || (s.stats = {}), k = dkey(new Date()), d = st[k] || (st[k] = {});
    d[name] = Math.max(0, (d[name] || 0) + (by === undefined ? 1 : by));
    const tt = s.totals || (s.totals = {}); tt[name] = Math.max(0, (tt[name] || 0) + (by === undefined ? 1 : by)); // lifetime, for achievements
    const keys = Object.keys(st);
    if (keys.length > 70) keys.sort().slice(0, keys.length - 70).forEach((x) => delete st[x]);
    if (SP.dares && name !== 'dares' && name !== 'visits') setTimeout(() => SP.dares.check(), 0); // a dare may be done now
    if (SP.emit) SP.emit('stat', { name, by: by === undefined ? 1 : by });
  }

  // Reactions should feel like a voice noticing, not a slot machine: one at a time, and the
  // frequent events (adding and ticking tasks) only every so often.
  const COOL = { taskAdd: 25e3, taskDone: 12e3, taskUndo: 20e3, taskDelete: 8e3 };
  let last = 0; const per = {};
  function line(ev, ctx, voiceKey) {
    const v = V[voiceKey || SP.voice.key()], key = 're_' + ev;
    const val = v[key] !== undefined ? v[key] : V.neutral[key];
    if (val === undefined) return '';
    return SP.voice.resolve(val, key, ctx, true) || '';
  }
  function react(ev, ctx, o) {
    o = o || {};
    if (document.body.classList.contains('onboarding')) return '';
    const t = now();
    if (!o.force && (t - last < 4e3 || t - (per[ev] || 0) < (COOL[ev] || 0))) return '';
    const msg = line(ev, ctx);
    if (!msg) return '';
    last = t; per[ev] = t;
    const k = SP.voice.key();
    SP.ui.toast(msg, { who: k === 'neutral' ? '' : V[k].name, action: o.action });
    return msg;
  }

  /* ---------- secret voices ---------- */
  function unlock(k) {
    const s = S(), u = s.unlocked || (s.unlocked = []);
    if (!V[k] || u.includes(k)) return false;
    u.push(k); SP.store.save();
    const before = SP.voice.key();
    // The current voice reacts to the newcomer; the newcomer introduces itself.
    const said = line('unlock', { name: V[k].name }, before);
    SP.ui.toast(V[k].unlockLine + (said ? '\n' + V[before].name + ': ' + said : ''), {
      who: V[k].name + ' · new voice unlocked', ms: 11000, voice: k,
      action: { label: 'Try ' + V[k].name, run: () => SP.panel.setVoice(k) },
    });
    last = now() + 8e3; // let it be read
    if (SP.panel.isOpen()) SP.panel.render();
    return true;
  }
  function checkUnlocks(away) {
    const p = S().presence || {}, h = SP.voice._h.bestHabit(S().habits);
    return (away >= 7 * 864e5 && unlock('ghost')) || ((p.lateDays || 0) >= 5 && unlock('owl')) || (!!h && h.n >= 30 && unlock('parent'));
  }

  /* ---------- streaks that ended (found when you come back) ---------- */
  function brokenStreaks() {
    const p = S().presence || (S().presence = {}), seen = p.broken || (p.broken = {}), out = [];
    const y = new Date(); y.setHours(12, 0, 0, 0); y.setDate(y.getDate() - 1);
    const today = dkey(new Date());
    for (const h of S().habits || []) {
      if (h.days[dkey(y)] || h.days[today]) continue; // still alive (or already restarted)
      const d = new Date(y); d.setDate(d.getDate() - 1);
      const end = dkey(d); let n = 0;
      while (h.days[dkey(d)]) { n++; d.setDate(d.getDate() - 1); }
      if (n >= 3 && seen[h.id] !== end) { seen[h.id] = end; out.push({ name: h.name, n }); }
    }
    return out;
  }

  /* Called after markSeen(): on load and whenever the tab comes back. */
  function visit(away, firstLoad) {
    const s = S(), p = s.presence || (s.presence = {}), d = new Date(), today = dkey(d);
    stat('visits');
    if (d.getHours() >= 5 && d.getHours() < 7) stat('early');
    let said = '';
    if (d.getHours() < 5 && p.lateDay !== today) {
      p.lateDay = today; p.lateDays = (p.lateDays || 0) + 1; stat('late');
      said = react('late', { time: pad(d.getHours()) + ':' + pad(d.getMinutes()) }, { force: true });
    }
    if (!said && [10, 20, 50, 100].includes(p.visits)) said = react('visits', { n: p.visits }, { force: true });
    const br = brokenStreaks();
    if (!said && br.length) said = react('streakBreak', br.sort((a, b) => b.n - a.n)[0], { force: true });
    SP.store.save({ quiet: true });
    if (SP.bonds) SP.bonds.day();
    const un = checkUnlocks(away);
    if (SP.achieve) SP.achieve.check();
    return un ? 'unlock' : said;
  }

  /* ---------- the events the widgets report ---------- */
  const open = () => S().tasks.filter((x) => !x.done).length;
  const ach = () => { if (SP.achieve) SP.achieve.check(); };
  const on = {
    taskAdd(text) { stat('added'); return react('taskAdd', { text, open: open() }); },
    taskDone(text) {
      stat('done'); ach();
      const n = open(), doneToday = (S().stats[dkey(new Date())] || {}).done || 1;
      if (n === 0) react('taskAllDone', { n: S().tasks.length }, { force: true });
      else react('taskDone', { text, open: n, doneToday });
    },
    taskUndo(text) { stat('done', -1); react('taskUndo', { text }); },
    taskDelete(task) { if (!task.done) { stat('dropped'); react('taskDelete', { text: task.text }); } },
    taskClear(n) { if (n) react('taskClear', { n }); },
    focusPause(time) { stat('paused'); react('focusPause', { time }, { force: true }); },
    focusQuit(time) { react('focusQuit', { time }, { force: true }); },
    focusDone(min) { stat('focusMin', min); stat('focus'); ach(); },
    habit(checked) { stat('habits', checked ? 1 : -1); checkUnlocks(0); ach(); },
  };

  /* ---------- voices arguing: another voice butts in on the summary line ---------- */
  function hourHash(salt) { let h = Math.floor(now() / 36e5); for (const ch of salt) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h; }
  function heckle() {
    const s = S(), cur = SP.voice.key();
    if (s.heckles === false || cur === 'neutral') return null;
    const h = hourHash('heckle' + (s.seed || 0));
    // roughly one hour in three, or every hour while an event voice is visiting
    const others = SP.voice.available().filter((k) => k !== cur && k !== 'neutral');
    if (!others.length) return null;
    const ev = SP.season && SP.season.heckler(), forced = ev && ev !== cur && V[ev];
    if (!forced && h % 3 !== 0 && !s._heckleAlways) return null;
    const who = forced ? ev : others[(h >>> 3) % others.length], v = V[who];
    let val = (v.heckle_at && v.heckle_at[cur]) || v.heckle;
    if (!val) return null;
    if (Array.isArray(val)) val = val[(h >>> 7) % val.length];
    if (typeof val === 'function') val = val({ who: V[cur].name });
    return { who: v.name, key: who, text: val };
  }

  SP.react = Object.assign(react, { on, stat, visit, unlock, checkUnlocks, heckle, line, _reset() { last = 0; for (const k in per) delete per[k]; } });
})(window.SP = window.SP || {});
