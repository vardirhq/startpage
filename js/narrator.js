/* Narrator: describes you, to you, in the third person. Dry, patient, faintly amused, and always one step
   ahead: it knows what you are about to do, and is only occasionally wrong. Everything is told as a story in
   which you are the protagonist, mostly opening tabs. Uses your name (or “the user”, if you never gave one).
   Its trick: leave the page open without touching it and, after a while, it narrates that too.
   Made with `node scripts/voices.js --new narrator`. */
(function (SP) {
  'use strict';
  const { plural, wx, pick, C, q, times, days, list } = SP.voice._h; // helpers: see SP.voice._h in js/voices.js
  const N = () => (SP.store.state.name || '').trim() || 'the user';
  const Nc = () => { const n = N(); return n[0].toUpperCase() + n.slice(1); };
  const A = () => C().awayText;
  const ord = (n) => n + (n % 100 >= 11 && n % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] || 'th');
  const R = (o) => ({ host, n, kind: k }) => { const f = o[k] || o.other; return f({ host, n }); };

  SP.voice.list.narrator = {
    name: 'Narrator', descriptor: 'Describes you, to you, in the third person.',
    speech: { pitch: 0.92, rate: 0.92 },
    heckle_at: { monday: 'Monday sighed, as was customary. The story moved on without her.', conspiracy: 'The Conspiracist saw a pattern. There was no pattern. The narrator would know.',
      cat: 'The cat said something. The narrator chose not to translate.', surfer: 'Surfer had lost the thread of the story. Surfer had never had the thread.' },

    /* ---- onboarding ---- */
    ob_kicker: 'Chapter one', ob_title_name: 'Every story needs a protagonist. What was theirs called?', ob_name_hint: 'It goes in the greeting, and in everything the narrator says about you. Change it later in Customize → You.', ob_name_ph: 'The protagonist’s name',
    ob_title_loc: 'And where did the story take place?', ob_loc_hint: 'For the weather and the clock. The protagonist could, of course, decline to say.', ob_locSet: ({ name }) => 'The story was set in ' + name + '. It seemed as good a place as any.',
    ob_title_voice: 'Who would tell the story?', ob_voice_hint: 'A voice rewrites the whole page, settings included. Here is how each would greet you. The narrator suspected it already knew which one you would pick.',
    ob_next: 'Turn the page', ob_back: 'Go back a page', ob_skip: 'Skip the prologue', ob_skipStep: 'Skip this part', ob_finish: 'Begin the story', ob_rerun: 'Tell the beginning again',
    ob_title_who: 'What sort of story was this?', ob_who_hint: 'The protagonist chose the closest, and the page arranged itself accordingly: spaces, cards, bookmarks and a scene. It could all be rewritten later.', fld_setup: 'The kind of story',

    /* ---- greeting and summary ---- */
    // The greeting is followed by “, <name>.”, so every line leads into the protagonist.
    greet: (p) => ({
      morning: ['Morning came, and with it, as the narrator had predicted, our protagonist', 'It was morning. Somewhere, a kettle boiled. Here, at the top of the page, stood our protagonist', 'A new day began, as they do, for our hero', 'The morning light fell, unremarkably, upon our protagonist'],
      afternoon: ['The afternoon wore on, and in from it wandered our protagonist', 'It was the afternoon, and the story returned to its hero', 'Halfway through the day, the page was opened once again by our protagonist', 'Afternoon. The plot thickened, slightly, around our hero'],
      evening: ['Evening fell, and back came our protagonist', 'As the evening drew in, the story found its way back to its hero', 'It was evening, and the page glowed for one person only', 'The day was nearly over. Not, however, for our protagonist'],
      night: ['It was late. Very late. And yet, here was our protagonist', 'The rest of the world slept. But not our protagonist', 'Night had fallen, and the tab was opened by our hero', 'At this hour, only one person was still writing the story'],
    }[p]),
    addr: ({ name }) => name || 'the user',
    heroSub: ({ open, focus }) => {
      const c = C(), out = [];
      out.push(open ? Nc() + ' had ' + plural(open, 'task') + ' to do. ' + Nc() + ' looked at them. They looked back.' : Nc() + ' had nothing to do. For a moment, the story did not know what to do with ' + N() + ' either.');
      out.push(open ? 'There were ' + plural(open, 'open task') + '. The narrator knew which one ' + N() + ' would do first. It was not the important one.' : 'The list was empty. ' + Nc() + ' felt, briefly, like the hero of the story.');
      out.push(focus ? Nc() + ' had focused ' + times(focus) + ' today. The narrator was, quietly, impressed.' : Nc() + ' had not focused once today. The narrator made a note of it, in the margin.');
      if (c.away > 36e5) out.push('After ' + c.awayText + ' away, ' + N() + ' returned. Nothing had changed. The tasks had waited patiently, as tasks do.');
      if (c.visits > 3) out.push('It was the ' + ord(c.visits) + ' time today ' + N() + ' had opened a new tab. ' + Nc() + ' told themselves it was for a reason.');
      if (c.habit && c.habit.n >= 2) out.push(c.habit.name + ', ' + days(c.habit.n) + ' in a row. A subplot was forming.');
      if (c.lastDone) out.push(Nc() + ' had finished ' + q(c.lastDone) + '. It would not be mentioned again.');
      if (c.prevVoice) out.push(Nc() + ' had spent some time with ' + c.prevVoice + '. The narrator did not ask about it.');
      return out;
    },
    tasksEmpty: [() => 'The list was empty. ' + Nc() + ' stared at it, as if waiting for the story to tell them what to do next.', () => 'Nothing to do. ' + Nc() + ' had either finished everything, or written nothing down. The narrator knew which.', 'An empty list. A blank page. The most frightening thing a protagonist can face.', () => 'No tasks. ' + Nc() + ' was, for once, entirely free. It would not last.'],

    /* ---- focus, countdowns, habits ---- */
    focusTitle: 'The Montage', mode_work: 'Focus', mode_short: 'Short break', mode_long: 'Long break',
    focusToday: ({ n }) => n ? n + ' today. The montage was going well.' : 'None yet. The montage had not begun.',
    focusDone: [() => 'And so ' + N() + ' focused, for twenty-five whole minutes. It would later be described as heroic.', () => 'The session ended. ' + Nc() + ' leaned back, as protagonists do after a montage.', 'Twenty-five minutes passed. The narrator, for once, had nothing to add.'],
    breakDone: [() => 'The break was over. ' + Nc() + ' knew it. The narrator knew it. Only the tea did not.', () => 'And so, refreshed, or at least slightly less tired, ' + N() + ' returned to work.', 'The interlude ended. The story resumed.'],
    cdTitle: 'Foreshadowing', cdDays: 'days until it happens', cdToday: 'It is today', cdTomorrow: 'day to go',
    cdEmpty: [() => 'Nothing was coming. Or so ' + N() + ' believed.', 'No countdowns. The story had no deadline, which is how stories go on forever.', () => Nc() + ' had nothing to count down to. The narrator found this suspiciously peaceful.'],
    habitsTitle: 'Recurring Themes', habitsEmpty: [() => Nc() + ' had no habits. None that were written down, anyway.', 'No habits yet. Every recurring theme starts with a first time.', () => 'Nothing tracked. ' + Nc() + ' preferred to keep the story unpredictable.'],
    streak: ({ n }) => n + ' days, unbroken', streakToast: ({ n, name }) => [days(n) + ' of ' + name + '. ' + Nc() + ' had become the sort of person who does that.', name + ', ' + days(n) + ' in a row. Even the narrator had stopped expecting it to end.', 'Day ' + n + ' of ' + name + '. A recurring theme, now.'],
    weatherQuip: (c) => pick(wx(c), { wet: () => 'It was raining, which suited the mood. The narrator had arranged it.', snow: () => 'It was snowing. ' + Nc() + ' did not go outside. Nobody blamed them.', cold: () => 'It was cold out. ' + Nc() + ' stayed in, which was, frankly, the plan all along.', warm: () => 'It was warm. ' + Nc() + ' considered going outside, briefly, and then opened another tab.', mild: 'The weather was unremarkable. The story would have to provide the drama itself.' }),

    /* ---- repo vitals ---- */
    vitalsTitle: 'Abandoned Subplots', vitalsWatch: 'Fading from the story',
    vitalsHero: ({ total, dead, flatlined }) => { const b = (dead || 0) + (flatlined || 0); return b ? 'Of ' + plural(total, 'project') + ', ' + b + ' had quietly left the story. Nobody wrote their endings.' : 'All ' + plural(total, 'project') + ' were still alive. It was, in narrative terms, a very full cast.'; },
    state_alive: 'Still in the story', state_fading: 'Fading', state_flatlined: 'Written out', state_dead: 'Ended',

    /* ---- Customize ---- */
    panelTitle: 'Behind The Scenes', tab_layout: 'Layout', tab_widgets: 'Widgets', tab_theme: 'Look', tab_settings: 'Settings',
    sec_layout: 'How the page was laid out', sec_widgets: 'The cast', sec_theme: 'The setting', sec_background: 'The backdrop',
    sec_accent: 'The accent colour', sec_voice: 'Who tells the story', sec_profile: 'The protagonist', sec_location: 'Where the story takes place',
    sec_search: 'Search', sec_github: 'GitHub', sec_sync: 'Sync (the story, on every device)', sec_data: 'Data',
    moreWidgets: 'Characters not yet introduced',
    tgl_greeting: 'Show the greeting', tgl_quote: 'Daily quote', tgl_animate: 'Animate the backdrop', tgl_summary: 'The narrator’s summary under the greeting',
    tgl_heckles: 'Let other voices interrupt the story', tgl_liveSky: 'Match the sky to the real weather and time of day', tgl_seasons: 'Seasons and holidays in the scene',
    tgl_brief: 'A morning chapter on the first tab of the day', tgl_speak: 'Read the story aloud', speakHello: 'And then, for the first time, the narrator could be heard.',
    tgl_chaos: 'Chaos mode: every card gets its own voice', chaosOn: 'Without warning, every card began telling its own story. The narrator objected. Nobody listened.',
    tgl_24h: '24-hour clock', tgl_favicons: 'Bookmark icons (via Google’s favicon service)', tgl_syncAuto: 'Sync automatically',
    widgetsIntro: ({ space }) => 'Everything in ' + space + '. Drag cards by the handle while this is open; resize them with the size button. The protagonist rearranged the furniture, as protagonists do when avoiding the plot.',
    voiceIntro: 'Choose who tells the story. The narrator would like to point out that it is the obvious choice, and say nothing more.',
    fld_name: 'The protagonist’s name', fld_tagline: 'Tagline',
    locIntro: ({ name }) => 'The story is set in ' + name + '. Weather and clock follow.', locPlaceholder: 'Search for your city…',
    locNone: 'The story has no setting yet. Search for your city, and the weather can join the cast.', wx_noLocation: 'No location set. The weather waited in the wings.', wx_setLocation: 'Set location',
    btn_find: 'Find', btn_geo: 'Use my current location', fld_weekStart: 'Week starts on', fld_engine: 'Search engine',
    syncIntro: 'Keeps this browser and your other devices in step through a private GitHub Gist, so the story continues wherever you open it. Your token stays on each device.',
    btn_syncOn: 'Turn on sync', btn_syncNow: 'Sync now', btn_viewGist: 'View gist', btn_export: 'Export', btn_import: 'Import', btn_reset: 'Start the story over',
    dataHelp: 'Everything stays in this browser. The story has exactly one reader.',
    btn_change: 'Change…', bgCustom: 'A backdrop of the protagonist’s choosing.', bgBack: 'Back to the pixel scene',
    reset_title: 'Start the story over?', reset_body: 'Spaces, bookmarks, tasks, notes and settings return to the beginning. The narrator would remember none of it. That is how it works.', reset_ok: 'Start over',
    import_title: 'Import a different story?', import_body: 'This replaces everything here with the contents of the file. The current story ends.', import_ok: 'Import',
    dlg_save: 'Save', dlg_cancel: 'Cancel',
    search_placeholder: [() => Nc() + ' was about to search for something…', 'And then they searched for…', () => 'What would ' + N() + ' look up this time…', 'Search, and the story continues…'],
    rail_customize: 'Behind the scenes', rail_newSpace: 'A new chapter',
    grid_empty: ['An empty stage. The cast had not yet arrived.', () => 'Nothing here. ' + Nc() + ' had cleared the stage, for reasons the narrator did not fully understand.', 'A blank page. Add a card, and the story begins.'], grid_emptyBtn: 'Add widgets',
    w_bookmarks: 'Places They Go', w_tasks: 'The Plot', w_notes: 'Notes In The Margin', w_github: 'GitHub', w_worldclock: 'Meanwhile, Elsewhere', w_news: 'Other People’s Stories', w_forecast: 'What The Weather Had Planned',
    notes_placeholder: ['And then they wrote down…', 'A note, in the margin…', () => Nc() + ' made a note of something important…'],
    task_placeholder: ['Next, the protagonist would…', () => 'Something ' + N() + ' meant to do…', 'Add to the plot…'],
    toast_location: ({ name }) => 'The story moved to ' + name + '.',
    desc_search: 'Search, with bookmarks, !bangs, maths and > commands', desc_bookmarks: 'Folders and tiles: the places the protagonist goes', desc_weather: 'The weather now and for three days',
    desc_clock: 'The time, and the date', desc_tasks: 'A to-do list: the plot, essentially', desc_notes: 'Quick notes', desc_github: 'Recent repo activity and CI status',
    desc_music: 'Your own streams: a soundtrack', desc_quote: 'A quote a day', desc_forecast: '24 hours of wind, UV, sun and air quality', desc_focus: 'A focus timer: the montage',
    desc_calendar: 'A month with week numbers', desc_countdown: 'Days until the things the story is building to', desc_worldclock: 'The time in other cities, where other stories are happening',
    desc_habits: 'Habits, streaks and an 18-week heatmap: the recurring themes', desc_news: 'Hacker News or dev.to', desc_vitals: 'Which of your repos are alive, fading or gone',

    /* ---- reactions ---- */
    re_taskAdd: [({ text }) => Nc() + ' wrote down ' + q(text) + '. The narrator suspected it would be there for some time.', () => 'Another task was added. ' + Nc() + ' felt productive, which is not the same thing.', ({ open }) => 'The list grew to ' + open + '. The plot, it seemed, was thickening.', ({ text }) => q(text) + '. ' + Nc() + ' had big plans for it. Plans were, after all, free.'],
    re_taskDone: [({ text }) => Nc() + ' finished ' + q(text) + '. It was, the narrator noted, about time.', () => 'And just like that, a task was done. ' + Nc() + ' allowed themselves a small, private moment of triumph.', ({ open }) => 'One task fewer. ' + open + ' remained. The story went on.', () => Nc() + ' ticked the box. The narrator had seen it coming, but was pleased all the same.'],
    re_taskAllDone: [() => 'And then, against all expectations, ' + N() + ' finished everything. The narrator was briefly lost for words.', () => 'Every task was done. ' + Nc() + ' sat back. For a moment, the story felt complete.', 'The list was empty. It was, by any measure, a happy ending. For today.'],
    re_taskUndo: [() => Nc() + ' un-ticked it. It had not, in fact, been done. The narrator chose not to dwell on it.', 'A task returned from the dead. A classic twist.', () => Nc() + ' changed their mind. Protagonists are allowed to do that.'],
    re_taskDelete: [({ text }) => q(text) + ' was deleted, unfinished. It was never spoken of again.', () => Nc() + ' deleted a task. Not done, merely gone. The narrator raised an eyebrow, but said nothing.', ({ text }) => 'And so ' + q(text) + ' was written out of the story.'],
    re_taskClear: ({ n }) => Nc() + ' cleared away ' + plural(n, 'finished task') + ', as one turns the page on a completed chapter.',
    re_focusPause: [({ time }) => 'With ' + time + ' to go, ' + N() + ' paused. The narrator had expected this at roughly ' + time + '.', () => Nc() + ' paused the timer. Something, apparently, had come up. Something always did.', 'The montage stopped. The music cut out. Everyone looked at the protagonist.'],
    re_focusQuit: [() => Nc() + ' abandoned the session. It would be quietly removed from the director’s cut.', () => 'The timer was reset. ' + Nc() + ' pretended it had never started. The narrator remembered.'],
    re_streakBreak: ({ name, n }) => 'After ' + days(n) + ', the ' + name + ' streak ended. It was, in hindsight, inevitable. Most things are.',
    re_late: [({ time }) => 'It was ' + time + '. ' + Nc() + ' should have been asleep. ' + Nc() + ' knew this. ' + Nc() + ' opened a tab anyway.', ({ time }) => 'At ' + time + ', while the world slept, ' + N() + ' was still here. The narrator, out of professional courtesy, stayed up too.', ({ time }) => time + '. The narrator suggested bed. The narrator was ignored. The narrator usually is.'],
    re_visits: [({ n }) => 'It was visit number ' + n + ' today. ' + Nc() + ' had come back, as the narrator knew they would.', ({ n }) => n + ' new tabs. Each time, ' + N() + ' felt sure something would be different.', ({ n }) => Nc() + ' opened a new tab. For the ' + ord(n) + ' time. The story was going in circles, gently.'],
    re_unlock: ({ name }) => 'And then a new character entered the story: ' + name + '. Nobody had seen it coming. Except the narrator.',
    heckle: [({ who }) => who + ' had interrupted. The narrator waited, politely, for them to finish.', ({ who }) => 'That was ' + who + '. The narrator would like to point out that it was not part of the script.', 'The narrator let the interruption pass, and the story continued.'],
    re_grudge: [({ n, rival }) => Nc() + ' returned to the narrator, having left ' + times(n) + ', mostly for ' + rival + '. The narrator was not hurt. The narrator had seen how it ended.', ({ n }) => 'And so, ' + times(n) + ' gone and ' + times(n) + ' back, ' + N() + ' returned to the original telling.'],
    grudgeSub: ({ n, rival }) => Nc() + ' had wandered off to ' + rival + ' ' + times(n) + '. The narrator had kept their place in the story.',
    re_bond: ({ level, days: d }) => [, d + ' days into the story. ' + Nc() + ' was, the narrator had to admit, a reliable protagonist.', d + ' days. The narrator had grown fond of ' + N() + '. It would never say so. It just had.', d + ' days. By now, the narrator could no longer imagine the story without ' + N() + '.'][level],
    bond_greet: ['And so, once again, the story returned to its favourite character', 'The protagonist returned, as protagonists do', 'Back, at last, came our protagonist'],
    bond_sub: [() => 'The narrator had told a great many stories. This was, quietly, one of the better ones.', () => Nc() + ' kept coming back. The narrator, privately, was glad.'],
    leave_title: () => Nc() + ' considered changing narrators.', leave_body: ({ to }) => 'The protagonist hovered over ' + to + '. Would they really do it? The narrator suspected they would, and that they would be back.',
    leave_ok: 'Do it anyway', leave_cancel: 'Stay with the narrator',
    welcomeVoice: ({ prev }) => ['After a brief interlude with ' + prev + ', the story returned to its rightful narrator.', 'And so ' + N() + ' left ' + prev + ' behind. ' + prev + ' did not take it well. The narrator did not mention it.'],
    welcomeBack: () => ['After ' + A() + ' away, ' + N() + ' returned. The tasks were exactly where they had been left. So was the narrator.', A() + ' had passed. ' + Nc() + ' came back as if nothing had happened. Nothing had.', () => 'Our protagonist had been gone ' + A() + '. The story, politely, had waited.'],

    /* ---- achievements, discoveries ---- */
    ach_toast: ({ name }) => Nc() + ' earned “' + name + '”. It was a small moment, but it would go in the book.',
    ach_reward: ({ scene }) => 'A new setting became available: ' + scene + '. The story could go there now.',
    sec_achievements: 'Plot points', sec_discoveries: 'Secrets the protagonist uncovered',

    /* ---- Wrapped ---- */
    wr_kicker: 'Previously on…', wr_title: 'The Week, As Told By The Narrator', wr_save: 'Save this chapter', wr_share: 'Share the story', wr_close: 'Close the book', wr_open: 'Read this week’s chapter',
    wr_done: ({ n, added }) => Nc() + ' finished ' + plural(n, 'task') + ' and wrote down ' + added + '. ' + (n >= added ? 'For once, the plot moved forward.' : 'The plot, as plots do, kept growing.'),
    wr_focus: ({ n, time }) => n ? 'There were ' + plural(n, 'montage') + ', ' + time + ' in all. They would make an excellent trailer.' : 'There was no montage this week. The story found other ways to fill the time.',
    wr_streak: ({ name, n }) => 'The longest-running theme: ' + name + ', ' + days(n) + '.',
    wr_visits: ({ n, late }) => Nc() + ' opened the page ' + plural(n, 'time') + '. ' + (late ? late + ' of those were after midnight, which the narrator will not discuss.' : 'All at reasonable hours. Unusually.'),
    wr_dropped: ({ n }) => plural(n, 'task') + ' left the story unfinished. Every story has a few.',
    wr_repos: ({ dead, total }) => dead + ' of ' + total + ' projects quietly left the story this week.',
    wr_outro: ['And that was the week. The narrator closed the book, gently, and waited for the next one.', () => 'So ended another week in the life of ' + N() + '. To be continued.', 'The end. (Of the week. Not the story. The story goes on.)'],
    wr_mood: ({ avg }) => 'On average, ' + N() + ' felt ' + avg + ' out of 5. A mixed review, but a fair one.',

    /* ---- Ask ---- */
    ask_label: ({ name }) => 'Ask the ' + name.toLowerCase(), ask_ph: ['And then the protagonist asked…', () => Nc() + ' had a question…', 'The question was…'],
    ask_thinking: ['The narrator considered this…', 'A pause, for dramatic effect…', 'The narrator turned the page…'], ask_refused: 'The narrator declined to answer. Some things are not part of the story.', ask_send: 'Ask', sec_ask: 'Ask a voice (Claude API, your own key)',

    /* ---- morning brief ---- */
    mb_title: 'Today’s chapter', mb_write: ({ name }) => 'Have the ' + name.toLowerCase() + ' write today’s chapter', mb_read: 'Read it to me', mb_close: 'Begin',
    mb_tasks: ({ n, top }) => 'Today, ' + N() + ' had ' + plural(n, 'task') + '. The story would begin with ' + list(top) + '. Probably.',
    mb_noTasks: [() => 'Today, ' + N() + ' had nothing planned at all. The day stretched out like an unwritten chapter.', 'No tasks. An open day. The narrator braced itself for anything.', () => Nc() + '’s list was empty. Today, the story would have to write itself.'],
    mb_streak: ({ name, n }) => name + ' stood at ' + days(n) + '. Miss today, and it would be the end of an era.',
    mb_cd: ({ title, days: d }) => (d === 0 ? 'And today was the day: ' + title + '. Everything had been building to this.' : title + ' was ' + days(d) + ' away. The narrator mentions it now so that it will matter later.'),

    /* ---- dares ---- */
    dare_kicker: 'A small plot twist', dare_ok: 'Accept', dare_no: 'Decline', dare_doneTag: 'Done', tgl_dares: 'A small daily dare',
    d_one: 'Before noon, the protagonist would finish one task. That was the dare.', d_three: 'Three tasks, today. The story needed momentum.', d_focus: 'One full focus session, start to finish. No pauses. A proper montage.',
    d_habits: 'Every habit, today. Every recurring theme, accounted for.', d_zero: 'Clear the whole list. A clean ending to the chapter.', d_note: 'Write one note worth keeping.',
    dare_done: [() => 'And ' + N() + ' did it. The narrator had, of course, known they would.', 'The dare was done. A satisfying little subplot, neatly resolved.', () => Nc() + ' rose to the occasion. It would be remembered, briefly.'],
    dare_declined: [() => Nc() + ' declined the dare. The narrator had predicted this, and felt no satisfaction. Some.', 'The dare went untaken. Another story, perhaps.', () => '“Not today,” said ' + N() + '. The narrator wrote it down.'],

    /* ---- panel tabs and sections ---- */
    tab_voice: 'Narrators', tab_you: 'The protagonist', tab_progress: 'The story so far', tab_data: 'The manuscript',
    sec_motion: 'Motion & sky', sec_talk: 'How much the narrator says', sec_myvoices: 'Narrators of your own making', sec_time: 'Time', sec_wrapped: 'Weekly chapter',
    sec_backup: 'Backup', sec_danger: 'The end', find_ph: 'Find a setting…', find_none: ({ q: s }) => 'There was no “' + s + '”. The protagonist looked, and found nothing.',

    /* ---- modules ---- */
    w_moon: 'The Moon', w_onthisday: 'Previously, In History', w_fx: 'Currency', w_mood: 'How The Protagonist Felt', w_since: 'Days Since', w_decide: 'A Choice',
    desc_moon: 'The moon’s phase, and when it would be full', desc_onthisday: 'Things that happened on this date, in other stories', desc_fx: 'Exchange rates, updated daily',
    desc_mood: 'A daily mood check-in, with a 30-day strip', desc_since: '“Days since” counters, with a reset button', desc_decide: 'Coin, dice, an 8-ball, “pick one”, rock-paper-scissors and would-you-rather. The narrator already knows',
    moonQuip: ({ phase, pct }) => 'Above it all hung the moon: ' + phase.toLowerCase() + ', ' + pct + '% lit. It took no part in the story.',
    otd_intro: ['Meanwhile, on this day in history:', 'On this date, in other stories:', 'Long before this story began, on this day:'],
    mood_q: [() => 'How was ' + N() + ' feeling today?', 'The narrator asked, gently, how the protagonist was.', () => 'And how did ' + N() + ' feel about all this?'],
    mood_log: ({ n }) => ['', 'It had been a hard day. The narrator lowered its voice.', 'Not a good day. The narrator said nothing, kindly.', 'An ordinary day. Most of them are.', 'A good day. The narrator allowed the music to swell, slightly.', 'A great day. The narrator was, despite itself, delighted.'][n],
    since_empty: ['Nothing was being counted. The story had no running jokes yet.', () => Nc() + ' tracked nothing. The narrator, however, was keeping count of several things.', 'No counters. Add one, and a running joke begins.'],
    since_reset: ({ title, n }) => q(title) + ' had lasted ' + days(n) + '. Then it happened again, as the narrator had always known it would.',
    decide_pickPh: 'The choices before the protagonist, separated by commas',
    ball: ['Yes. The narrator had known all along.', 'No. That was never how this story went.', 'Ask again later. The plot is not ready.', 'It is certain. The narrator has read ahead.', 'Unlikely. Very unlikely.', 'The answer was yes, but the protagonist would not believe it.', 'No, and the narrator suggests not asking twice.', 'Yes. Obviously.'],
    decide_aside: ['The choice was made. The narrator had made it some time ago.', () => 'And so ' + N() + ' left it to chance. Or so ' + N() + ' thought.', 'Decided. The story moved on.'],
    decide_edge: 'The coin landed on its edge. The narrator, who had seen everything, had never seen that.',
    rps_win: [({ you, them }) => Nc() + ' threw ' + you.toLowerCase() + ', which beat ' + them.toLowerCase() + '. The narrator let them have this one.', () => Nc() + ' won. The narrator had, of course, allowed it.', 'Victory. Small, but the protagonist’s own.'],
    rps_lose: [({ them }) => 'The narrator threw ' + them.toLowerCase() + '. The narrator always knew what was coming.', () => Nc() + ' lost. The narrator knew the ending. It always does.', 'A loss. Every story needs one.'],
    rps_tie: ['A draw. The narrator and the protagonist, thinking alike. Unsettling.', 'The same throw. Neither would back down.', 'A tie. The story paused, uncertain.'],
    rps_cheat: ['The narrator had read ahead. It is, after all, the narrator.', () => 'The narrator knew what ' + N() + ' would throw before ' + N() + ' did.'],
    rps_streak: [({ n }) => n + ' wins in a row. The protagonist was rewriting the story.', ({ n }) => n + ' in a row. The narrator began, quietly, to take this seriously.'],
    wyr_opts: ['do the thing they had been putting off', 'close the tab and go outside for a while', 'tidy one small corner of their desk', 'write down the idea before it disappeared', 'make a cup of tea and look out of the window', 'reply to the message they had been ignoring', 'go to bed at a sensible hour, for once'],
    wyr_won: ['A wise choice. The story improved immediately.', () => Nc() + ' chose the narrator’s suggestion. The narrator was gracious about it.', 'And so it was decided. The narrator approved.'],
    wyr_lost: ['The protagonist chose the other one. The narrator had expected that.', 'An unexpected choice. The narrator made a small note in the margin.', () => Nc() + ' ignored the narrator. It happens. It happens a lot.'],

    /* ---- the cat, sounds, swearing, Friday nights ---- */
    tgl_sounds: 'Sound effects (coin, dice, ticks, fanfares)', tgl_pet: 'A cat on your cards (a minor character)', tgl_swear: 'Let Brutal swear (off: the words are masked)',
    pet_meet: 'A cat had wandered onto the page. Nobody had written it in. It stayed anyway.',
    pet_poke: [({ n }) => Nc() + ' poked the cat. ' + n + ' times, now. The cat had stopped pretending not to notice.', 'The cat endured it. Cats are patient with protagonists.', () => 'Once again, ' + N() + ' poked the cat instead of doing the task.'],
    tgl_tipsy: 'Friday night mode (the narrator has had a glass of wine)',
    tipsy_in: ['It was Friday night. The narrator had had a glass of wine. Possibly two. The story would be told with a little more feeling tonight.', () => 'Friday. The narrator loosened its tie, metaphorically, and told ' + N() + ' that they were its favourite protagonist. Ever.'],
    tipsy_aside: ['The narrator was having a lovely time.', 'This was, the narrator felt, a very good story.', 'The narrator would like to say something. It forgot what.', 'The narrator hummed.'],
    morning_after: ['Morning. The narrator would like to clarify that nothing it said last night was canon.', 'The narrator had a slight headache, and wished to keep the story quiet today.'],

    /* ---- time capsule ---- */
    w_capsule: 'A Letter To A Later Chapter', desc_capsule: 'Write to future you. It stays sealed until the date you pick',
    capsule_ph: 'Dear future me, by the time you read this…', capsule_seal: 'Seal it', capsule_empty: 'No letters yet. The narrator suggests leaving one for a later chapter.',
    capsule_sealed: [({ days: d }) => 'The letter was sealed. In ' + days(d) + ', a slightly different ' + N() + ' would read it.', ({ days: d }) => days(d) + '. The narrator mentions it now, so that it will matter later.'],
    capsule_ready: [({ days: d }) => 'A letter, sealed ' + days(d) + ' ago, was ready. ' + Nc() + ' had almost forgotten it. Almost.', 'The time had come to open the letter. Every story has a scene like this.'],
    capsule_open: [({ days: d }) => days(d) + ' ago, ' + N() + ' wrote this. The narrator read it over their shoulder.', ({ days: d }) => 'A message from ' + days(d) + ' ago. Past ' + N() + ', speaking to present ' + N() + '. The narrator stayed out of it.'],

    /* ---- birthday ---- */
    fld_birthday: 'The protagonist’s birthday', bday_greet: 'And on this day, a birthday for our protagonist',
    bday_banner: 'It was the protagonist’s birthday. Every voice had left a card. The narrator had written its own, in the third person.',
    bday_card: ({ name, days: d }) => 'Happy birthday' + (name ? ', ' + name : '') + '. The narrator does not usually step out of the story. ' + (d > 1 ? 'But after ' + d + ' days, ' : 'But ') + 'it would like to say that you are a very good protagonist. That is all. Back to the story.',

    /* ---- face-offs ---- */
    tgl_faceoffs: 'A weekly face-off between two voices', fo_kicker: 'A difference of opinion',
    fo_tasks: [({ open }) => 'There were ' + plural(open, 'open task') + '. The narrator saw several possible endings. Most involved finishing them.', ({ open }) => open + ' tasks remained. The narrator would like it noted that it said nothing. Until now.'],
    fo_sleep: [({ late }) => plural(late, 'night') + ' up past midnight this week. The narrator, a creature of habit, disapproved quietly.', ({ late }) => Nc() + ' stayed up late ' + times(late) + '. In the story, this is usually where things go wrong.'],
    fo_streak: [({ n, name }) => name + ', ' + days(n) + '. A theme, building nicely.', ({ n, name }) => days(n) + ' of ' + name + '. The narrator could see where this was going. It was going well.'],
    fo_focus: [({ focus }) => plural(focus, 'focus session') + ' this week. The montage was coming along.', ({ focus }) => focus + ' sessions. A short montage. But a montage.'],
    fo_win: ['The protagonist agreed with the narrator. As it should be.', 'Correct. The narrator had hoped they would see it that way.'], fo_lose: ['The protagonist disagreed. The narrator took it well. Mostly.', 'An unexpected verdict. The story adjusted.'],
    fo_sulk: ['Having lost the argument, the narrator declined to summarise today. It would return tomorrow.', 'The narrator took the rest of the day off from summarising. It was not sulking.'],

    /* ---- levels ---- */
    sec_level: 'Chapter', lvl_up: [({ level, title }) => 'Chapter ' + level + ': ' + title + '. The story was going somewhere after all.', ({ level, title }) => 'And so ' + N() + ' became ' + title + ' (level ' + level + '). A new chapter began.'],
    lvl_titles: ['The Extra', 'A Minor Character', 'A Supporting Character', 'The Sidekick', 'A Recurring Character', 'The Protagonist', 'The Hero', 'The Legend', 'The One The Story Is About', 'The Author'],

    /* ---- bookmark roasts ---- */
    tgl_roasts: 'Let the narrator remark on the sites you open most',
    bm_roast: R({
      video: ({ host, n }) => 'For the ' + ord(n) + ' time, ' + N() + ' went to ' + host + ', for just one video. The narrator did not believe it either.',
      social: ({ host, n }) => Nc() + ' checked ' + host + ' ' + times(n) + '. Other people’s stories, it seemed, were very compelling.',
      work: ({ host, n }) => host + ', ' + times(n) + '. ' + Nc() + ' was, the narrator had to admit, working.',
      ai: ({ host, n }) => Nc() + ' asked ' + host + ' for help ' + times(n) + '. The narrator, who knows how this story ends, said nothing.',
      shop: ({ host, n }) => n + ' visits to ' + host + '. ' + Nc() + ' was only looking. That was what ' + N() + ' always said.',
      other: ({ host, n }) => Nc() + ' had opened ' + host + ' ' + times(n) + '. The narrator did not know why. The narrator usually knows why.',
    }),

    /* ---- puzzles and the newer cards ---- */
    w_nonogram: 'The Picture Puzzle', desc_nonogram: 'A pixel picture puzzle, a new one every day', w_sudoku: 'The Number Puzzle', desc_sudoku: 'One sudoku a day, easy on Monday and harder through the week',
    puz_solved: [({ time }) => 'In ' + time + ', ' + N() + ' solved it. The narrator had expected it to take longer, and was pleased to be wrong.', ({ hints }) => hints ? Nc() + ' solved it, with ' + plural(hints, 'hint') + '. The narrator will leave that out of the retelling.' : Nc() + ' solved it without any help at all. The narrator was, quietly, impressed.', 'Solved. Every square in its place. A tidy little chapter.'],
    puz_hint: ['A hint. The narrator nudged the story along.', () => Nc() + ' asked for help. The narrator obliged, as narrators do.', 'The narrator pointed, discreetly, at a square.'],
    puz_tomorrow: ['Tomorrow, there would be another. The narrator had already read it.', 'And that was today’s puzzle. To be continued.'],
    puz_reveal: [({ name }) => 'It was ' + name + '. The narrator had known from the first square.', ({ name }) => 'And there it was: ' + name + '. A small reveal, but a satisfying one.'],
    puz_streak: ({ n }) => plural(n, 'day') + ' in a row. A recurring theme.',
    w_shelf: 'Stories Within The Story', desc_shelf: 'Games, books, shows and films to get to, and a pick for tonight', shelf_ph: 'Add a game, book, show or film…', shelf_empty: 'No stories within the story yet. Add the ones you mean to get to.',
    shelf_pick: [({ title }) => 'Tonight, ' + N() + ' would finally get to ' + title + '. The narrator remained cautiously optimistic.', ({ title }) => 'It was decided: ' + title + '. A story within a story. The narrator approved of the structure.', ({ title }) => title + ', then. ' + Nc() + ' had been meaning to for a while.'],
    shelf_finish: [({ title }) => Nc() + ' finished ' + title + '. Another story, complete. The narrator was a little jealous.', ({ title }) => 'And so ' + title + ' came to an end. ' + Nc() + ' sat with it for a moment.'],
    w_flash: 'Things To Remember', desc_flash: 'A small deck that comes back just before you’d forget it', flash_empty: 'No cards yet. Add a question and its answer.', flash_none: 'Nothing to review today. The protagonist remembered everything. For now.',
    flash_done: [({ n }) => Nc() + ' reviewed ' + plural(n, 'card') + '. The details would matter later. They always do.', ({ n }) => plural(n, 'card') + ', remembered. A well-prepared protagonist.'],
    w_shop: 'Provisions', desc_shop: 'A shopping list: quick to add to, quick to tick off', shop_ph: 'Add items (commas for several)…', shop_empty: 'The list was empty. The cupboards, presumably, were not.', shop_done: [() => Nc() + ' bought everything on the list. Except, the narrator suspected, the one thing they would need tomorrow.', 'Everything was ticked off. A rare, complete shopping trip.'],
    w_prompt: 'Today’s Assignment', desc_prompt: 'Something small to write, draw or make, a new one each day', prompt_intro: 'And so the protagonist was asked to:', prompt_did: [({ n }) => Nc() + ' made something. ' + plural(n, 'day') + ' in a row, now. The narrator was taking notes.', ({ n }) => 'Done. ' + plural(n, 'day') + '. A creative streak, building quietly.'],

    /* ---- what the narrator thinks of everyone (shown in the voice picker) ---- */
    blurb: {
      neutral: 'States the facts. A narrator with no flair.', monday: 'A weary supporting character.', supportive: 'Loves the protagonist. Possibly too much.',
      surfer: 'Has lost the plot. Literally.', professional: 'Writes the minutes, not the story.', therapist: 'Asks how the protagonist feels. At length.',
      weepy: 'Cries at every ending. There are many endings.', victorian: 'A period piece.', brutal: 'All conflict, no resolution.',
      conspiracy: 'Sees a plot in everything. The narrator wrote the plot.', cat: 'A minor character. Says only one word, repeatedly.', narrator: 'Tells your story, as it happens.',
      owl: 'Keeps the story going after midnight.', ghost: 'A character who never quite left.', parent: 'Keeps a scrapbook of the protagonist.',
    },
  };

  /* The narrator's trick: leave the page open and do nothing, and that becomes part of the story too.
     Only when it's the voice in charge, only while the tab is visible, and at most once per visit. */
  const IDLE = [
    () => Nc() + ' stared at the page. Nothing happened. The narrator waited.',
    () => 'For a while, ' + N() + ' did nothing at all. The narrator considered describing the weather, then thought better of it.',
    () => 'Minutes passed. ' + Nc() + ' had opened a new tab for something, and could no longer remember what.',
    () => 'And then, for quite some time, nothing happened. The narrator, a professional, simply waited for ' + N() + ' to continue.',
  ];
  let idleTimer = null, told = false;
  function arm() {
    clearTimeout(idleTimer);
    if (told || SP.voice.key() !== 'narrator' || document.visibilityState === 'hidden') return;
    idleTimer = setTimeout(() => {
      if (told || SP.voice.key() !== 'narrator' || document.visibilityState === 'hidden' || document.body.classList.contains('onboarding')) return;
      told = true;
      SP.ui.toastLater(SP.voice.resolve(IDLE, 'idle', {}, true), { who: 'Narrator', ms: 8000 });
    }, SP.narrator.idleMs);
  }
  for (const ev of ['pointerdown', 'keydown', 'wheel', 'touchstart']) addEventListener(ev, arm, { passive: true });
  document.addEventListener('visibilitychange', arm);
  SP.on('ready', arm);
  SP.narrator = { IDLE, idleMs: 3 * 60e3, arm, _reset() { told = false; } };
})(window.SP = window.SP || {});
