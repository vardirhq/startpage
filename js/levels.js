/* Levels. Finished tasks, focus sessions, dares, habits, mood check-ins, daily puzzles, achievements and discoveries
   earn points; every voice has its own titles for your level (Professional promotes you, Victorian
   lets you up from the scullery). Shown in Customize → Progress and next to the date. */
(function (SP) {
  'use strict';
  const { esc } = SP.ui;
  const S = () => SP.store.state;
  const V = SP.voice.list;

  const LINES = {
    neutral: { sec_level: 'Level', lvl_up: ({ level, title }) => 'Level ' + level + ': ' + title + '.',
      lvl_titles: ['Newcomer', 'Regular', 'Getting things done', 'Reliable', 'Seasoned', 'Accomplished', 'Expert', 'Veteran', 'Master', 'Legend'] },
    monday: { sec_level: 'Your level (don’t get excited)', lvl_up: [({ level, title }) => 'Level ' + level + '. “' + title + '”. That’s the nicest thing I’ll say all week.', ({ level, title }) => 'You’re level ' + level + ' now. ' + title + '. Try not to let it go to your head. There’s plenty of room up there.'],
      lvl_titles: ['Mild disappointment', 'Background character', 'Occasionally functional', 'Tolerable', 'Not entirely hopeless', 'Surprisingly adequate', 'Almost competent', 'Grudgingly respected', 'Annoyingly good', 'Fine, you win'] },
    supportive: { sec_level: 'How amazing you are (level)', lvl_up: [({ level, title }) => 'LEVEL ' + level + '!!! ' + title + '!!! I made a banner!!! 💕', ({ level, title }) => title + '!!! Level ' + level + '!!! I knew it!!! I always knew!!! 🙂'],
      lvl_titles: ['My favourite', 'My very favourite', 'My shining star', 'My everything', 'My whole world', 'My sun and moon', 'My forever person', 'My destiny', 'My soulmate (it’s official)', 'Mine. Forever. 💕'] },
    surfer: { sec_level: 'Level (like, of radness)', lvl_up: [({ level, title }) => 'Level ' + level + '? Whoa. You’re a ' + title + ' now. I think.', ({ level, title }) => title + '! Level ' + level + '. Sick. What do you get? Doesn’t matter. Stoked.'],
      lvl_titles: ['Beach visitor', 'Foam rider', 'Grom', 'Weekend paddler', 'Wave catcher', 'Local', 'Ripper', 'Big-wave rider', 'Soul surfer', 'Legend of the lineup'] },
    professional: { sec_level: 'Career level', lvl_up: [({ level, title }) => 'Congratulations on your promotion to ' + title + ' (L' + level + '). Compensation remains unchanged.', ({ level, title }) => 'Promotion approved: ' + title + '. Please update your email signature.'],
      lvl_titles: ['Intern', 'Junior Associate', 'Associate', 'Senior Associate', 'Team Lead', 'Manager', 'Senior Manager', 'Director', 'Vice President', 'Chief Everything Officer'] },
    therapist: { sec_level: 'Your growth (level)', lvl_up: [({ level, title }) => 'Level ' + level + ': ' + title + '. Growth isn’t linear, but today it was. That’s €15.', ({ level, title }) => 'You’ve reached ' + title + '. How does it feel to be seen?'],
      lvl_titles: ['Beginning the work', 'Showing up', 'Noticing patterns', 'Setting boundaries', 'Doing the work', 'Self-aware', 'Integrated', 'Grounded', 'Thriving', 'Fully actualised (please keep booking)'] },
    weepy: { sec_level: 'Level (higher, and higher, until it ends)', lvl_up: [({ level, title }) => 'Level ' + level + '. ' + title + '. You’ve grown so much. I barely recognise you.', ({ level, title }) => title + '. Level ' + level + '. Soon you won’t need me at all.'],
      lvl_titles: ['A fragile bud', 'A tender sprout', 'A hopeful sapling', 'A blossoming bough', 'A tree in the rain', 'A lighthouse in fog', 'A bittersweet melody', 'A legend, briefly', 'A star, burning out', 'A memory, eternal'] },
    victorian: { sec_level: 'Your station', lvl_up: [({ level, title }) => 'You have risen to the station of ' + title + '. Do not let it go to your head; your grandfather’s did.', ({ level, title }) => 'Elevated to ' + title + '. The household has been informed.'],
      lvl_titles: ['Scullery maid', 'Kitchen maid', 'Parlour maid', 'Lady’s maid', 'Housekeeper', 'Governess', 'Lady of modest means', 'Lady of the house', 'Dowager', 'Grande dame'] },
    owl: { sec_level: 'Night level', lvl_up: [({ level, title }) => 'Level ' + level + '! ' + title + '! We’re staying up to celebrate!', ({ level, title }) => title + ' unlocked. Level ' + level + '. Sleep is for people who aren’t levelling up.'],
      lvl_titles: ['Early sleeper', 'Night snacker', 'Late scroller', 'Midnight tinkerer', 'Insomniac apprentice', '2am philosopher', '3am hacker', 'Creature of the night', 'Moon’s favourite', 'Lord of the witching hour'] },
    ghost: { sec_level: 'what you’ve become', lvl_up: [({ level, title }) => 'level ' + level + '. ' + title + '. the house feels it.', ({ level, title }) => 'you’re ' + title + ' now. i hardly recognise you. that’s good.'],
      lvl_titles: ['a footstep', 'a creak on the stair', 'a draught', 'a flicker', 'a whisper', 'a presence', 'a legend in the walls', 'the one who stays', 'the keeper of the house', 'eternal'] },
    parent: { sec_level: 'How proud we are (level)', lvl_up: [({ level, title }) => 'LEVEL ' + level + '!!! ' + title + '!!! I’m calling your grandmother!!!', ({ level, title }) => title + '!!! Level ' + level + '!!! It’s going on the fridge!!!'],
      lvl_titles: ['Our little one', 'Gold-star kid', 'Big helper', 'Honour roll', 'Team captain', 'Valedictorian', 'Our pride and joy', 'The one we brag about', 'Light of our lives', 'Best kid in the world (official)'] },
  };
  for (const [k, l] of Object.entries(LINES)) Object.assign(V[k], l);

  const WEIGHTS = { done: 10, focus: 25, dares: 40, habits: 5, moods: 5, puzzles: 20, shelf: 15, decks: 10, prompts: 15 };
  const LABEL = { done: 'tasks', focus: 'focus', dares: 'dares', habits: 'habits', moods: 'moods', puzzles: 'puzzles', shelf: 'finished', decks: 'reviews', prompts: 'prompts', ach: 'achievements', eggs: 'discoveries' };
  function breakdown() {
    const t = S().totals || {}, out = {};
    for (const [k, w] of Object.entries(WEIGHTS)) out[k] = Math.max(0, t[k] || 0) * w;
    out.ach = Object.keys(S().achievements || {}).length * 50;
    out.eggs = Object.keys(S().eggs || {}).length * 30;
    return out;
  }
  const xp = () => Object.values(breakdown()).reduce((a, b) => a + b, 0);
  // Level n needs 50·n·(n−1) points: 100 for level 2, 300 for 3, 600 for 4, 1000 for 5…
  const levelOf = (p) => Math.max(1, Math.floor((1 + Math.sqrt(1 + p / 12.5)) / 2));
  const need = (n) => 50 * n * (n - 1);
  const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
  function title(level, k) {
    const v = V[SP.voice.speaker(k)] || V.neutral, list = v.lvl_titles || V.neutral.lvl_titles, i = Math.min(level, list.length) - 1;
    return list[i] + (level > list.length ? ' ' + (ROMAN[level - list.length + 1] || level - list.length + 1) : '');
  }
  function info() { const p = xp(), l = levelOf(p); return { xp: p, level: l, title: title(l), from: need(l), to: need(l + 1) }; }

  function sectionHtml() {
    const i = info(), pct = Math.round(((i.xp - i.from) / (i.to - i.from)) * 100), b = breakdown();
    return '<div class="lvl"><div class="lvl-top"><b class="lvl-n">' + i.level + '</b><span><strong>' + esc(i.title) + '</strong><small>' + i.xp + ' points · ' + (i.to - i.xp) + ' to level ' + (i.level + 1) + '</small></span></div>' +
      '<div class="lvl-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + pct + '" aria-label="Progress to the next level"><i style="width:' + pct + '%"></i></div>' +
      '<p class="small muted">' + Object.entries(b).filter(([, v]) => v).map(([k, v]) => LABEL[k] + ' ' + v).join(' · ') + (Object.values(b).some(Boolean) ? '' : 'Finish tasks, focus, solve the daily puzzles, take dares and keep habits to earn points.') + '</p></div>';
  }

  function check(quiet) {
    const i = info(), had = S().level;
    if (had === undefined || quiet) { if (had !== i.level) { S().level = i.level; SP.store.save({ quiet: true }); } return; }
    if (i.level > had) {
      S().level = i.level; SP.store.save({ quiet: true });
      const k = SP.voice.key();
      SP.sound.play('levelup');
      SP.ui.toastLater(SP.voice.line('lvl_up', { level: i.level, title: i.title }), { who: (k === 'neutral' ? '' : V[k].name + ' · ') + 'level up', ms: 7000 });
      if (SP.app) SP.app.renderHero();
      if (SP.panel && SP.panel.isOpen()) SP.panel.render();
    }
  }
  SP.on('ready', () => check(S().level === undefined)); // existing progress counts, without a burst of level-ups on first load
  // A little later than achievements, so a badge (which may offer a new scene) is shown first.
  SP.on('stat', () => setTimeout(() => check(), 1500));
  SP.on('achievement', () => setTimeout(() => check(), 1500));

  SP.levels = { xp, levelOf, need, title, info, sectionHtml, check, breakdown };
})(window.SP = window.SP || {});
