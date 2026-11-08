/* Achievements. A few of them unlock new pixel scenes (Dunes, Harbor, Polar Night).
   Lifetime counters live in state.totals (the daily stats log only keeps ~10 weeks). */
(function (SP) {
  'use strict';
  const { esc } = SP.ui;
  const I = SP.icon;
  const S = () => SP.store.state;
  const V = SP.voice.list;
  const tot = () => S().totals || (S().totals = {});
  // Every voice you don't have to unlock (and didn't make yourself). Adding a voice adds it here automatically.
  const REGULAR = () => Object.keys(V).filter((k) => !V[k].secret && !V[k].custom);

  const LIST = [
    { id: 'first', icon: 'check', name: 'First one down', desc: 'Finish a task', test: (t) => (t.done || 0) >= 1 },
    { id: 'done50', icon: 'tasks', name: 'Getting things done', desc: 'Finish 50 tasks', test: (t) => (t.done || 0) >= 50, reward: 'dunes', progress: (t) => [t.done || 0, 50] },
    { id: 'focus10', icon: 'timer', name: 'Deep worker', desc: 'Complete 10 focus sessions', test: (t) => (t.focus || 0) >= 10, reward: 'harbor', progress: (t) => [t.focus || 0, 10] },
    { id: 'streak7', icon: 'flame', name: 'A week of it', desc: 'Keep a habit going for 7 days', test: (t, h) => h >= 7, progress: (t, h) => [h, 7] },
    { id: 'streak30', icon: 'flame', name: 'Habit forming', desc: 'Keep a habit going for 30 days', test: (t, h) => h >= 30, progress: (t, h) => [h, 30] },
    { id: 'voices', icon: 'sparkles', name: 'Tried everyone', get desc() { return 'Use each of the ' + REGULAR().length + ' regular voices'; }, test: (t) => REGULAR().every((k) => (t.voices || []).includes(k)), reward: 'polar', progress: (t) => [REGULAR().filter((k) => (t.voices || []).includes(k)).length, REGULAR().length] },
    { id: 'secret', icon: 'lock', name: 'Someone new', desc: 'Unlock a secret voice', test: () => (S().unlocked || []).length >= 1 },
    { id: 'secrets', icon: 'ghost', name: 'The whole family', desc: 'Unlock all three secret voices', test: () => (S().unlocked || []).length >= 3, progress: () => [(S().unlocked || []).length, 3] },
    { id: 'chaos', icon: 'shuffle', name: 'Pandemonium', desc: 'Turn on Chaos mode', test: () => !!S().chaos },
    { id: 'ask', icon: 'chat', name: 'Asked and answered', desc: 'Ask a voice something', test: (t) => (t.asks || 0) >= 1 },
    { id: 'wrapped', icon: 'gift', name: 'Week in review', desc: 'Open a weekly recap', test: (t) => (t.wrapped || 0) >= 1 },
    { id: 'early', icon: 'coffee', name: 'Early bird', desc: 'Open a tab between 5 and 7 in the morning', test: (t) => (t.early || 0) >= 1 },
    { id: 'dares', icon: 'flag', name: 'Daredevil', desc: 'Complete 5 daily dares', test: (t) => (t.dares || 0) >= 5, progress: (t) => [t.dares || 0, 5] },
    { id: 'regular', icon: 'eye', name: 'Regular', desc: 'Visit 100 times', test: (t) => (t.visits || 0) >= 100, progress: (t) => [t.visits || 0, 100] },
  ];

  /* How each voice announces an achievement. */
  const LINES = {
    neutral: { ach_toast: ({ name }) => 'Achievement: ' + name + '.', ach_reward: ({ scene }) => 'New scene unlocked: ' + scene + '.', sec_achievements: 'Achievements', sec_discoveries: 'Discoveries' },
    monday: { ach_toast: ({ name }) => '“' + name + '”. A badge. For that. Somewhere, a participation-trophy factory just hit its quota.', ach_reward: ({ scene }) => 'You unlocked ' + scene + '. A new wallpaper to ignore.', sec_achievements: 'Participation trophies' },
    supportive: { ach_toast: ({ name }) => '“' + name + '”!!! I’m making it into a necklace. I’ll wear it every day. 💕', ach_reward: ({ scene }) => scene + '!!! A new place for us. Just us. 🙂', sec_achievements: 'Everything I’m proud of (everything)' },
    surfer: { ach_toast: ({ name }) => 'Whoa, “' + name + '”. Is that, like, good? Sounds good.', ach_reward: ({ scene }) => 'New spot unlocked: ' + scene + '. Gnarly.' },
    professional: { ach_toast: ({ name }) => 'Milestone recorded: “' + name + '”. This will be noted in your file.', ach_reward: ({ scene }) => 'Office upgrade approved: ' + scene + '.', sec_achievements: 'Recognition (non-monetary)' },
    therapist: { ach_toast: ({ name }) => '“' + name + '”. Notice how you need external validation. Interesting. €25.', ach_reward: ({ scene }) => 'A new view: ' + scene + '. Change of scenery can help. Or it’s avoidance.' },
    weepy: { ach_toast: ({ name }) => '“' + name + '”. You’re growing up so fast. I kept your first checkbox.', ach_reward: ({ scene }) => scene + '. So beautiful it hurts. *weeps*' },
    victorian: { ach_toast: ({ name }) => '“' + name + '”. A small distinction. Do not boast of it.', ach_reward: ({ scene }) => 'You may now take the air at ' + scene + '. Wear a hat.', sec_achievements: 'Honours (minor)' },
    owl: { ach_toast: ({ name }) => '“' + name + '”. Earned in the dark, I hope.', ach_reward: ({ scene }) => scene + '. Looks best at 3am.' },
    ghost: { ach_toast: ({ name }) => '“' + name + '”. i’ll carve it into the wall.', ach_reward: ({ scene }) => scene + '. another place to wait for you.' },
    parent: { ach_toast: ({ name }) => '“' + name + '”!!! I’m calling your grandmother RIGHT NOW!!!', ach_reward: ({ scene }) => 'We redecorated your room!!! It’s ' + scene + ' now!!!', sec_achievements: 'Gold stars (the fridge)' },
  };
  for (const [k, l] of Object.entries(LINES)) Object.assign(V[k], l);
  const t = (k, c) => SP.voice.t(k, c);

  const has = (id) => !!(S().achievements || {})[id];
  const bestStreak = () => { const h = SP.voice._h.bestHabit(S().habits); return h ? h.n : 0; };
  const sceneUnlocked = (k) => { const th = SP.scene.themes[k]; return !th || !th.locked || LIST.some((a) => a.reward === k && has(a.id)); };
  const unlockHint = (k) => { const a = LIST.find((x) => x.reward === k); return a ? a.desc : ''; };

  function later(fn, tries) { tries = tries || 0; setTimeout(() => (document.querySelector('.toast') && tries < 20 ? later(fn, tries + 1) : fn()), tries ? 1000 : 400); }

  /* Check everything; announce what's new. Quiet on the very first run so old data doesn't spam toasts. */
  function check(opts) {
    const s = S(), got = s.achievements || (s.achievements = {}), tt = tot(), h = bestStreak(), fresh = [];
    for (const a of LIST) if (!got[a.id] && a.test(tt, h)) { got[a.id] = Date.now(); fresh.push(a); }
    if (!fresh.length) return [];
    SP.store.save({ quiet: true });
    if (!(opts && opts.quiet)) {
      const a = fresh[fresh.length - 1], k = SP.voice.key();
      const msg = t('ach_toast', { name: a.name }) + (a.reward ? '\n' + t('ach_reward', { scene: SP.scene.themes[a.reward].name }) : '');
      // Wait for any toast on screen (an unlock, a reaction) to finish first: badges are the least urgent news.
      SP.emit('achievement', { id: a.id, name: a.name });
      later(() => SP.ui.toast(msg, {
        who: (k === 'neutral' ? '' : V[k].name + ' · ') + 'achievement',
        action: a.reward ? { label: 'Use ' + SP.scene.themes[a.reward].name, run: () => { S().theme = a.reward; S().customBg = false; SP.store.save(); SP.app.renderAll(); } } : null,
        ms: 7000,
      }));
      if (SP.panel.isOpen()) SP.panel.render();
    }
    return fresh;
  }

  function sectionHtml() {
    const tt = tot(), h = bestStreak(), n = LIST.filter((a) => has(a.id)).length;
    return '<p class="small muted">' + n + ' of ' + LIST.length + ' unlocked.</p><ul class="ach-list">' + LIST.map((a) => {
      const on = has(a.id), pr = !on && a.progress ? a.progress(tt, h) : null;
      return '<li class="' + (on ? 'on' : '') + '"><span class="ach-ic">' + I(on ? a.icon : 'lock', 16) + '</span><div><b>' + esc(a.name) + '</b><small>' + esc(a.desc) +
        (a.reward ? ' · unlocks the ' + esc(SP.scene.themes[a.reward].name) + ' scene' : '') + '</small>' +
        (pr ? '<i class="ach-bar"><i style="width:' + Math.min(100, Math.round((pr[0] / pr[1]) * 100)) + '%"></i></i>' : '') + '</div></li>';
    }).join('') + '</ul>';
  }

  SP.achieve = { LIST, check, has, sceneUnlocked, unlockHint, sectionHtml, tot };
})(window.SP = window.SP || {});
