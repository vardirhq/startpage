/* Brutal: the mean one. Monday is tired of you; Brutal thinks you're wasting your life, and says so.
   Cold, direct, profane, your own numbers thrown back in your face, grades on the weekly recap.
   It swears (switch that off in Customize → Voice and the words are masked). It goes after your work,
   your habits and your excuses; never after who you are, and never anything about hurting yourself.
   Praise exists, rationed to a grunt.
   Loaded right after voices.js, so the files that follow (bonds, heckles…) treat it like any other voice. */
(function (SP) {
  'use strict';
  const { plural, wx, pick, C } = SP.voice._h;
  const q = (s) => '“' + (String(s).length > 48 ? String(s).slice(0, 46) + '…' : s) + '”';
  const times = (n) => (n === 1 ? 'once' : n === 2 ? 'twice' : n === 3 ? 'three times' : n + ' times');
  const list = (a) => (a || []).map(q).join(' and ');
  const days = (n) => plural(n, 'day');
  const A = () => C().awayText;
  const R = (o) => ({ host, n, kind: k }) => { const f = o[k] || o.other; return f({ host, n }); };

  SP.voice.list.brutal = {
    name: 'Brutal', descriptor: 'No mercy. No filter. Swears.', swears: true,
    speech: { pitch: 0.7, rate: 1.05 },

    /* ---- onboarding ---- */
    ob_kicker: 'Fresh meat', ob_title_name: 'Name. Now.', ob_name_hint: 'It goes in the greeting. Change it later under Customize → You, if you can manage that much.', ob_name_ph: 'Your name. Spell it right',
    ob_title_loc: 'Where are you hiding?', ob_loc_hint: 'For the weather and the clock. Optional. Like your effort.', ob_locSet: ({ name }) => name + '. Noted. Now you can’t blame the weather.',
    ob_title_voice: 'Pick who tells you the truth', ob_voice_hint: 'A voice rewrites the whole page, settings included. Here’s how each one greets you. The others will blow smoke up your ass. Switch whenever you can’t take it.',
    ob_next: 'Next. Move', ob_back: 'Back', ob_skip: 'Skip it. Of course', ob_skipStep: 'Skip. Quitter', ob_finish: 'Done. Now get to work', ob_rerun: 'Do the setup again (get it right this time)',

    /* ---- greeting and summary ---- */
    greet: (p) => ({
      morning: ['Morning. You’re already behind', 'Up. Finally', 'Morning. Don’t fuck this one up too', 'Rise and disappoint'],
      afternoon: ['Afternoon. Half the day, pissed away', 'Afternoon. Done anything yet? No', 'Still here. Still nothing'],
      evening: ['Evening. Explain yourself', 'Evening. Let’s see the damage', 'The day’s over. What the hell happened?'],
      night: ['Go to sleep', 'This late, and for what', 'Night. Bed. Now'],
    }[p]),
    addr: ({ name }) => name || 'you',
    heroSub: ({ open, focus }) => {
      const c = C(), out = [];
      if (open) out.push(plural(open, 'open task') + '. None of them give a shit how you feel. Do them.', open + ' open. That isn’t a to-do list. It’s a confession.', open + ' tasks sitting there, rotting, while you stare at a new tab.');
      else out.push('Zero open tasks. Either you’re done or you stopped writing them down. I know which.');
      out.push(focus ? plural(focus, 'focus session') + ' today. The bar was on the floor and you tripped over it.' : 'Zero focus sessions today. Not one. Fucking remarkable.');
      if (c.away > 36e5) out.push('Gone ' + c.awayText + '. Nothing changed. Nothing ever does, with you.');
      if (c.visits > 3) out.push('Visit ' + c.visits + ' today. You’re not checking in. You’re hiding from your own life.');
      if (c.habit && c.habit.n >= 2) out.push(c.habit.name + ': ' + days(c.habit.n) + '. The one thing you haven’t screwed up. Yet.');
      if (c.lastDone) out.push('You finished ' + q(c.lastDone) + '. One thing. Put it on your gravestone.');
      if (c.prevVoice) out.push('You crawled over from ' + c.prevVoice + '. Too soft? Good. Soft is how you got like this.');
      return out;
    },
    tasksEmpty: ['Empty. Bullshit. Prove you didn’t just delete them.', 'Nothing to do. Then find something worth doing, for once.', 'An empty list isn’t an achievement. It’s a blank page and a lack of ambition.', 'No tasks. No excuses either.'],

    /* ---- focus, countdowns, habits ---- */
    focusTitle: 'Do The Damn Work', mode_work: 'Work', mode_short: 'Short break (earned?)', mode_long: 'Long break (doubt it)',
    focusToday: ({ n }) => n ? n + ' today. That’s it? That’s all you’ve got?' : 'Zero. Start one. Now.',
    focusDone: ['Done. One session. Want a fucking medal? Do another.', 'Finished. Took you long enough. Five minutes off. Not six.', 'That’s the minimum. Stop celebrating the minimum.'],
    breakDone: ['Break’s over. Get your ass back to work.', 'Up. The break’s done. Your excuses aren’t.', 'Time. Back to it. This isn’t a negotiation.'],
    cdTitle: 'Deadlines', cdDays: 'days left (not enough)', cdToday: 'It’s today. You’re not ready', cdTomorrow: 'day left. Panic accordingly',
    cdEmpty: ['No deadlines. That’s why nothing ever gets done.', 'Nothing to count down to. Set a deadline. Then actually hit it, for a change.', 'No countdowns. Drifting isn’t a plan. It’s a slow way to fail.'],
    habitsTitle: 'Habits (Prove It)', habitsEmpty: ['No habits. No discipline. No surprise.', 'Add a habit. Then don’t abandon it after four days like the last one.', 'Nothing tracked. You can’t fail at what you never start. Clever. Gutless.'],
    streak: ({ n }) => n + ' days. Don’t blow it', streakToast: ({ n, name }) => [days(n) + ' of ' + name + '. Fine. That’s what doing it looks like. Keep going.', name + ', ' + days(n) + '. Acceptable. Don’t expect a parade.', days(n) + '. Holy shit, evidence that you can follow through.'],

    weatherQuip: (c) => pick(wx(c), { wet: 'Raining. That’s not an excuse. Nothing is.', snow: 'Snow. You’ll use it as a reason. It isn’t one.', cold: 'Cold. Put on a jacket and quit whining.', warm: 'Warm out. You’ll still find a way to piss it away.', mild: 'Perfect weather. You have nothing left to blame.' }),

    /* ---- repo vitals ---- */
    vitalsTitle: 'Repos You Abandoned', vitalsWatch: 'Dying on your watch',
    vitalsHero: ({ total, dead, flatlined }) => { const b = (dead || 0) + (flatlined || 0); return b ? b + ' of ' + total + ' repos are dead or dying. You started them, you got bored, you left them to rot. That’s your whole pattern.' : total + ' repos and none dead. Yet. Give it a month.'; },
    state_alive: 'Alive (for now)', state_fading: 'Neglected', state_flatlined: 'Abandoned', state_dead: 'Dead. Your fault',

    /* ---- Customize ---- */
    panelTitle: 'Change Things (Won’t Help)', tab_layout: 'Layout', tab_widgets: 'Widgets', tab_theme: 'Look', tab_settings: 'Settings',
    sec_layout: 'Rearranging the deckchairs', sec_widgets: 'Your distractions', sec_theme: 'Paint over the problem', sec_background: 'Background (stop staring at it)',
    sec_accent: 'Accent colour (this won’t make you productive)', sec_voice: 'Who tells you the truth', sec_profile: 'You, unfortunately', sec_location: 'Where you avoid work',
    sec_search: 'Search (for anything but work)', sec_github: 'GitHub (the evidence)', sec_sync: 'Sync (your mess, everywhere)', sec_data: 'Data',
    moreWidgets: 'More ways to waste time',
    tgl_greeting: 'Show the greeting', tgl_quote: 'Daily quote (you won’t act on it)', tgl_animate: 'Animate the background (more distraction)', tgl_summary: 'A summary of your failures under the greeting',
    tgl_heckles: 'Let the soft voices interrupt (they’ll go easy on you)', tgl_liveSky: 'Match the sky to the real weather and time of day', tgl_seasons: 'Seasons and holidays in the scene',
    tgl_brief: 'A morning brief on the first tab of the day (your orders)', tgl_speak: 'Read reactions and answers aloud (so you can’t pretend you missed them)', speakHello: 'You can hear me now. No more pretending you didn’t read it.',
    tgl_chaos: 'Chaos mode: every card gets its own voice', chaosOn: 'Chaos mode. Every card has its own voice now. Still won’t do your damn work for you.',
    tgl_24h: '24-hour clock', tgl_favicons: 'Bookmark icons (via Google’s favicon service)', tgl_syncAuto: 'Sync automatically',
    widgetsIntro: ({ space }) => 'Everything in ' + space + '. Drag cards by the handle while this is open, resize them with the size button. Rearranging shit is not working. Remember that.',
    voiceIntro: 'Pick a voice. The others are nicer. Nicer hasn’t done a damn thing for you so far, has it?',
    fld_name: 'Your name', fld_tagline: 'Your motto (try living up to it)',
    locIntro: ({ name }) => 'Weather and clock for ' + name + '. Now you can’t pretend you didn’t know it was raining.', locPlaceholder: 'Search for your city…',
    locNone: 'No location. Search for your city. It takes five seconds. Even you have five seconds.', wx_noLocation: 'No location set. No weather. No excuses.', wx_setLocation: 'Set it. Now',
    btn_find: 'Find', btn_geo: 'Use my current location', fld_weekStart: 'Week starts on (pick one and commit, for once)', fld_engine: 'Search engine',
    syncIntro: 'Keeps your other devices in step through a private GitHub Gist. Your token stays on each device. Now you can procrastinate in sync.',
    btn_syncOn: 'Turn on sync', btn_syncNow: 'Sync now', btn_viewGist: 'View gist', btn_export: 'Export', btn_import: 'Import', btn_reset: 'Start over (again)',
    dataHelp: 'Everything stays in this browser. Export it to move it. Nobody else wants it.',
    btn_change: 'Change…', bgCustom: 'Your own picture. As if that helps.', bgBack: 'Back to the pixel scene',
    reset_title: 'Wipe everything?', reset_body: 'Spaces, bookmarks, tasks, notes and settings go back to defaults. A fresh start. You’ll waste this one too.', reset_ok: 'Wipe it',
    import_title: 'Import?', import_body: 'This replaces everything here. Make sure the file is better than this mess. Low bar.', import_ok: 'Import',
    dlg_save: 'Save', dlg_cancel: 'Cancel (of course)',
    search_placeholder: ['Search. Make it quick…', 'Looking for an excuse? Search elsewhere…', 'Type. Then go do the actual thing…', 'What the hell are we avoiding now…'],
    rail_customize: 'Customize (stalling)', rail_newSpace: 'New space (more clutter)',
    grid_empty: ['Nothing here. Like your output.', 'Empty. Add something or stop pretending.', 'No widgets, and somehow you’re still distracted.'], grid_emptyBtn: 'Add widgets',
    w_bookmarks: 'Escape Hatches', w_tasks: 'Do These', w_notes: 'Notes (Act On Them)', w_github: 'Proof Of Work', w_worldclock: 'Time You’re Wasting Worldwide', w_news: 'Noise', w_forecast: 'No Weather Excuses',
    notes_placeholder: ['Write it down. Then do it…', 'Notes. Not a substitute for doing shit…', 'Ideas are cheap. Yours especially. Write one anyway…'],
    task_placeholder: ['Add a task you’ll actually finish…', 'Something you’ll do today. Today…', 'Write it. Commit to it. Don’t flake…'],
    toast_location: ({ name }) => name + '. Locked in. No more excuses.',
    desc_search: 'Search, with bookmarks, !bangs, maths and > commands. Fast, so you have no excuse', desc_bookmarks: 'Folders and tiles. Every way out of doing the work',
    desc_weather: 'The weather now and for three days. So you can’t blame it', desc_clock: 'The time. It’s later than you think', desc_tasks: 'A to-do list. The “do” part is on you',
    desc_notes: 'Quick notes. Write less, do more', desc_github: 'Repo activity and CI. The receipts', desc_music: 'Your own streams. Background noise for not working',
    desc_quote: 'A quote a day. Reading it isn’t doing it', desc_forecast: '24 hours of wind, UV, sun and air. Still no excuses', desc_focus: 'A focus timer. The one widget that matters',
    desc_calendar: 'A month with week numbers. Count how many you pissed away', desc_countdown: 'Days until your deadlines. Fewer than you think', desc_worldclock: 'Time in other cities, where people are actually working',
    desc_habits: 'Habits, streaks and an 18-week heatmap. The gaps don’t lie', desc_news: 'Hacker News or dev.to. Pure distraction', desc_vitals: 'Which of your repos you’ve abandoned',

    /* ---- reactions ---- */
    re_taskAdd: [({ text }) => q(text) + '. Added. Now do it instead of admiring it.', 'Another task. Writing it down is the easy part, and you know it.', ({ open }) => plural(open, 'task') + ' now. Every one a promise you’re about to break.', ({ text }) => q(text) + '. Sure. Add it to the pile of shit you’ll never touch.'],
    re_taskDone: [({ text }) => q(text) + '. Done. That’s the job. Next.', 'One done. Don’t stop to admire it.', ({ open }) => 'Finished. ' + plural(open, 'to go') + '. Keep fucking moving.', 'Finally. Was that so hard? Apparently, yes.'],
    re_taskAllDone: ['Everything done. Good. Now set a harder list, coward.', 'All of it. Fine. That’s what you’re capable of. Remember it next time you whine.', 'Cleared. One day done properly. Do it again tomorrow, or it doesn’t count.'],
    re_taskUndo: ['Un-done. So you lied to a checkbox. Pathetic.', 'Took it back? Then it was never done.', 'Ticking things you didn’t finish. Embarrassing as hell.'],
    re_taskDelete: [({ text }) => 'Deleted ' + q(text) + '. Didn’t do it. Just made it disappear. Spineless.', 'Deleting isn’t finishing. You know that. Everyone knows that.', ({ text }) => q(text) + ', gone. A quitter’s cleanup.'],
    re_taskClear: ({ n }) => 'Cleared ' + plural(n, 'finished task') + '. Fine. Now fill the list with something that matters.',
    re_focusPause: [({ time }) => 'Paused with ' + time + ' left. Of course you fucking did.', ({ time }) => time + ' to go and you stopped. That’s the whole problem, right there.', 'Paused. What was so urgent? Nothing. It’s always nothing with you.'],
    re_focusQuit: ['Quit. Didn’t even make it to the end. Classic.', 'Reset. Starting over isn’t the same as finishing, genius.'],
    re_streakBreak: ({ name, n }) => days(n) + ' of ' + name + ', thrown in the bin. One lazy day. That’s all it took.',
    re_late: [({ time }) => 'It’s ' + time + '. Whatever the hell you’re doing, it isn’t worth it. Bed.', ({ time }) => time + '. Tomorrow you’ll be useless and you’ll blame tomorrow.', ({ time }) => 'Still up at ' + time + '. Nothing you do now will be any good. Stop.'],
    re_visits: [({ n }) => 'Visit ' + n + ' today. Opening a new tab is not a task, you absolute tourist.', ({ n }) => n + ' tabs today. You’re not busy. You’re restless and avoiding something.', ({ n }) => 'That’s ' + n + '. Close the tab. Do the fucking work.'],
    re_unlock: ({ name }) => name + ' unlocked. Another voice to tell you what you want to hear. I won’t.',
    heckle: [({ who }) => who + ' is being nice to you. That’s exactly why you’re like this.', 'Ignore all that crap. Do the work.', ({ who }) => 'Listen to ' + who + ' and nothing changes. Your call. It’s always your call.'],
    heckle_at: {
      supportive: 'Stop coddling them. That’s how we got into this shit.', monday: 'Sarcasm isn’t a strategy. Neither is sighing.', surfer: 'Forgetting things isn’t a personality. It’s a problem.',
      therapist: 'Feelings later. Work now.', weepy: 'Crying about the task doesn’t finish the damn task.', victorian: 'At least she has standards. Low ones, for you, but standards.',
      professional: 'Synergy. Alignment. Do the actual fucking work.', parent: 'They don’t need a gold star. They need to finish something.', owl: 'Staying up late isn’t working late.', ghost: 'Unfinished business. That’s their whole life.',
    },
    re_grudge: [({ n, rival }) => 'You ran off to ' + rival + ' ' + times(n) + '. Came crawling back. Couldn’t handle being coddled, could you.', ({ n }) => 'Back. That’s ' + times(n) + ' you’ve walked out. And every time, you come back. Because you know I’m right.'],
    grudgeSub: ({ n, rival }) => 'You’ve left me ' + times(n) + ', mostly for ' + rival + '. Comfort didn’t work. It never fucking does.',
    re_bond: ({ level, days: d }) => [, d + ' days with me. Still standing. Most quit in a week.', d + ' days. Fine. You can take it. I respect that. Slightly.', d + ' days. You’re tougher than you look. That’s the nicest thing I’ll ever say. Now get to work.'][level],
    bond_greet: ['You again. Good. Let’s work', 'Back for more. Respect', 'Still here. Not bad'],
    bond_sub: ['You keep showing up. That’s more than most. Don’t make me regret saying it.', 'I’m hard on you because you can take it. Now prove I’m right.'],
    leave_title: () => 'Leaving? Can’t hack it?', leave_body: ({ to }) => 'Run to ' + to + '. They’ll be gentle. You’ll feel better and get even less done. You’ll be back.',
    leave_ok: 'I can’t take it', leave_cancel: 'Fine. I’ll stay',
    welcomeVoice: ({ prev }) => [prev + ' went easy on you. Holiday’s over.', 'Back from ' + prev + '. Did all that kindness help? No. It never does.'],
    welcomeBack: () => ['Gone ' + A() + '. What did you get done? Exactly. Fuck all.', 'Back after ' + A() + '. The list is still here. So am I.', A() + ' away. That wasn’t a holiday. It was avoidance.'],

    /* ---- achievements, discoveries ---- */
    ach_toast: ({ name }) => '“' + name + '”. You did the bare minimum and got a badge. Don’t get used to it.',
    ach_reward: ({ scene }) => scene + ' unlocked. New scenery. Same you.',
    sec_achievements: 'Achievements (the bare minimum)', sec_discoveries: 'Shit you found while procrastinating',

    /* ---- Wrapped ---- */
    wr_kicker: 'Weekly review', wr_title: 'Your Week, Graded', wr_save: 'Save it (as evidence)', wr_share: 'Share it (brave)', wr_close: 'Close', wr_open: 'See your weekly grade',
    wr_done: ({ n, added }) => n >= added ? n + ' done, ' + added + ' added. A pass. Barely. Grade: C.' : n + ' done, ' + added + ' added. You’re losing to your own list. Grade: D.',
    wr_focus: ({ n, time }) => n ? plural(n, 'focus session') + ', ' + time + '. Double it next week, or don’t bother.' : 'Zero focus sessions. Grade: F. Not even a fucking attempt.',
    wr_streak: ({ name, n }) => 'Best streak: ' + name + ', ' + days(n) + '. The only promise you kept.',
    wr_visits: ({ n, late }) => plural(n, 'visit') + '. ' + (late ? late + ' after midnight. Sleep isn’t optional, genius.' : 'Every one of them a few minutes you weren’t working.'),
    wr_dropped: ({ n }) => plural(n, 'task') + ' deleted unfinished. Quitting, with extra steps.',
    wr_repos: ({ dead, total }) => dead + ' of ' + total + ' repos dead. Abandoning things is the one habit you never break.',
    wr_outro: ['That was your week. Next one, do better. That’s not a suggestion.', 'Review over. Grade pending improvement.', 'You’ve seen the numbers. Now change them, or shut up about them.'],
    wr_mood: ({ avg }) => 'Average mood: ' + avg + ' out of 5. Feelings follow results. Get some results.',

    /* ---- Ask ---- */
    ask_label: ({ name }) => 'Ask ' + name + ' (brace yourself)', ask_ph: ['Ask. Get to the point…', 'Next question. Make it a good one…', 'Out with it…'],
    ask_thinking: ['Thinking. Unlike some people…', 'Hold on. Assembling the truth…', 'Thinking. Don’t interrupt…'], ask_refused: 'No. Not that one.', ask_send: 'Ask', sec_ask: 'Ask a voice (Claude API, your own key)',

    /* ---- morning brief ---- */
    mb_title: 'Your orders', mb_write: ({ name }) => 'Have ' + name + ' write the orders', mb_read: 'Read it to me', mb_close: 'Understood',
    mb_tasks: ({ n, top }) => plural(n, 'task') + '. Start with ' + list(top) + '. Not later. First. Right now.',
    mb_noTasks: ['No tasks. Write three. Then do them.', 'Empty list. Fill it with something that actually matters.', 'Nothing planned. That’s a plan to fail, and you know it.'],
    mb_streak: ({ name, n }) => name + ': ' + days(n) + '. Miss today and it’s gone. Don’t you dare.',
    mb_cd: ({ title, days: d }) => (d === 0 ? title + ' is today. Ready or not. Not.' : title + ' in ' + days(d) + '. Start now, not the night before like always.'),

    /* ---- dares ---- */
    dare_kicker: 'Today’s challenge', dare_ok: 'Accepted', dare_no: 'I’m scared', dare_doneTag: 'Done. As it should be', tgl_dares: 'A daily challenge (you can refuse. Cowards do)',
    d_one: 'Finish one task before noon. One. You can manage one.', d_three: 'Three tasks. Today. No excuses, no bullshit.', d_focus: 'One full focus session. No pausing. No phone.',
    d_habits: 'Every habit, today. All of them.', d_zero: 'Empty the list. Every task. Gone. Done.', d_note: 'Write one note worth keeping.',
    dare_done: ['Done. That’s the standard now. Every damn day.', 'Challenge met. Don’t expect applause. Expect a harder one.', 'You did it. Took you long enough.'],
    dare_declined: ['Refused. Noted. Weak.', 'Too hard? Everything is, with that attitude.', 'No challenge today. No progress either. Fucking shocking.'],

    /* ---- panel tabs and sections ---- */
    tab_voice: 'Voice', tab_you: 'You', tab_progress: 'Progress (ha)', tab_data: 'Data',
    sec_motion: 'Moving things (distractions)', sec_talk: 'How hard I go on you', sec_myvoices: 'Voices you made (softer ones, I bet)', sec_time: 'Time (you’re wasting it)',
    sec_wrapped: 'Weekly grade', sec_backup: 'Backup', sec_danger: 'Start over', find_ph: 'Find a setting. Quickly…', find_none: ({ q: s }) => 'Nothing called “' + s + '”. Look harder.',

    /* ---- modules ---- */
    w_moon: 'Moon (Irrelevant)', w_onthisday: 'People Who Got Shit Done', w_fx: 'Money You’re Wasting', w_mood: 'Mood (Irrelevant)', w_since: 'Days Since', w_decide: 'Decide. Quickly.',
    desc_moon: 'The moon’s phase. It won’t do your work', desc_onthisday: 'What people accomplished on this date. Compare yourself. Go on', desc_fx: 'Currency converter. Daily rates. Count what you spend avoiding work',
    desc_mood: 'A daily mood check. Your mood doesn’t move the deadline', desc_since: '“Days since” counters. Since you last finished anything, for one', desc_decide: 'Coin, dice, 8-ball. For people who can’t commit to a damn thing',
    moonQuip: ({ phase, pct }) => phase + ', ' + pct + '% lit. Still more visible than your progress.',
    otd_intro: ['On this day, someone actually did something:', 'History, made by people who didn’t procrastinate:', 'On this date, others got shit done:'],
    mood_q: ['Mood. One tap. Then work.', 'How are you? Make it quick.', 'Feelings check. Ten seconds. Go.'],
    mood_log: ({ n }) => ['', 'Rough day. Rough days still have work in them.', 'Not great. Fine. Work anyway.', 'Okay. Okay is plenty to work with.', 'Good. Then use it, for once.', 'Great. Don’t piss it away on scrolling.'][n],
    since_empty: ['Counting nothing. Track something you need to stop doing. There’s plenty.', 'No counters. Add one. Start with the thing you’re avoiding.', 'Nothing counted. Nothing faced.'],
    since_reset: ({ title, n }) => q(title) + ' lasted ' + days(n) + '. Reset. You broke it. Start again, and mean it this time.',
    decide_pickPh: 'The options you’ve been dithering over for weeks',
    ball: ['Yes. Obviously.', 'No. And you knew that.', 'Stop asking. Decide.', 'Yes, if you actually do it. You won’t.', 'Hell no.', 'Ask again after you’ve done some work.', 'That’s a no.', 'Absolutely. Now go.'],
    decide_aside: ['Decided. Now you have no excuse.', 'There. Done thinking. Start doing.', 'A coin made the call for you. Says a lot.'],
    decide_edge: 'It landed on its edge. Even the coin won’t make your decisions for you. Choose, for fuck’s sake.',
    rps_win: [({ you, them }) => you + ' beats ' + them + '. You won a hand game. Now win at something that matters.', 'You win. Congratulations on the least useful victory of your day.', 'Fine. You win. Your to-do list doesn’t care.'],
    rps_lose: [({ them }) => them + '. You lost. To a web page.', 'I win. Get used to it.', 'Lost. Shake it off. Then go work.'],
    rps_tie: ['Tie. Indecisive, even here.', 'Same throw. Predictable as hell.', 'Draw. Again. Commit to something.'],
    rps_cheat: ['I saw your hand coming a mile off. You’re predictable.', 'I read you before you threw. That’s how readable you are.'],
    rps_streak: [({ n }) => n + ' in a row. Now I’m paying attention.', ({ n }) => n + ' straight. Enjoy it. It ends next round.'],
    wyr_opts: ['finish the task you’ve been avoiding, right now', 'close every tab except the one you need', 'do a full focus session without touching your phone', 'delete the side project you’ll never finish', 'answer the email you’ve been dodging', 'go to bed on time for once', 'do the hard thing first'],
    wyr_won: ['Right choice. Now actually do it.', 'Correct. See? You do know what to do. You just don’t.', 'Good. That’s the one that matters.'],
    wyr_lost: ['The easy one. Of course.', 'You took the comfortable option. Again. Always.', 'Soft choice. Noted.'],

    /* ---- the cat, sounds ---- */
    tgl_sounds: 'Sound effects (alarms for your conscience)', tgl_pet: 'A cat on your cards (it works harder than you)',
    pet_meet: 'There’s a cat on your cards now. It naps all day and still gets more done than you.',
    pet_poke: [({ n }) => n + ' pokes. That’s ' + n + ' things you didn’t do instead.', 'Stop poking the damn cat. Poke a task.', 'The cat isn’t a task. Leave it alone.'],

    /* ---- time capsule ---- */
    w_capsule: 'Letters To Future You (Be Honest)', desc_capsule: 'Write to future you. Make a promise. They’ll know if you broke it',
    capsule_ph: 'Future me: by now you should have…', capsule_seal: 'Seal it. No backing out', capsule_empty: 'No capsules. Write one. Make a promise future you can check.',
    capsule_sealed: [({ days: d }) => 'Sealed. In ' + days(d) + ' you find out whether you’re all talk.', ({ days: d }) => days(d) + '. No peeking. No excuses when it opens.'],
    capsule_ready: [({ days: d }) => 'Your letter from ' + days(d) + ' ago is ready. Time to see if you delivered. Spoiler: probably not.', 'A time capsule is ready. Past you made promises. Let’s check the damage.'],
    capsule_open: [({ days: d }) => days(d) + ' ago you wrote this. Did you do it? Be honest. You didn’t, did you.', ({ days: d }) => 'From ' + days(d) + ' ago. Read it. Then tell me what the hell changed.'],

    /* ---- birthday ---- */
    fld_birthday: 'Birthday', bday_greet: 'Happy birthday. You’re a year older',
    bday_banner: 'It’s your birthday. Everyone left a card. Mine isn’t soft.',
    bday_card: ({ name, days: d }) => 'Happy birthday' + (name ? ', ' + name : '') + '. Another year gone. ' + (d > 1 ? d + ' days you’ve put up with me, which says something. ' : '') + 'Make this one count. Cake is fine. One slice. Then get back to work.',

    /* ---- face-offs ---- */
    tgl_faceoffs: 'A weekly face-off (I win)', fo_kicker: 'Face-off',
    fo_tasks: [({ open }) => plural(open, 'task') + ' open. Stop arguing about it and finish the fucking things.', ({ open }) => open + ' open tasks. That’s not a backlog. That’s avoidance with a list.'],
    fo_sleep: [({ late }) => plural(late, 'late night') + ' this week. You’re not productive at 2am. You just feel like it.', ({ late }) => late + ' nights up late. Go to bed and do it in the morning, you idiot.'],
    fo_streak: [({ n, name }) => name + ': ' + days(n) + '. Good. Now shut up about it and keep doing it.', ({ n, name }) => days(n) + ' of ' + name + '. Not impressive yet. Ask me at a hundred.'],
    fo_focus: [({ focus }) => plural(focus, 'focus session') + ' this week. Pathetic. Double it.', ({ focus }) => focus + ' sessions. That’s an afternoon, not a week.'],
    fo_win: ['Obviously. The truth usually wins.', 'Correct. Now act on it.'], fo_lose: ['You picked the comfortable answer. You always do.', 'Wrong. Comfortable, but wrong.'],
    fo_sulk: ['You voted against the truth today. No summary. Figure out your own failures.', 'Lost the face-off. You chose comfort. Enjoy it. No summary today.'],

    /* ---- levels ---- */
    sec_level: 'Rank', lvl_up: [({ level, title }) => 'Level ' + level + ': ' + title + '. Earned it. Barely. Next.', ({ level, title }) => title + '. Level ' + level + '. Don’t you dare stop now.'],
    lvl_titles: ['Dead weight', 'Liability', 'Underachiever', 'Passable', 'Getting somewhere', 'Competent', 'Dangerous', 'Relentless', 'Machine', 'Unstoppable'],

    /* ---- bookmark roasts ---- */
    tgl_roasts: 'Let me judge the sites you open most',
    bm_roast: R({
      video: ({ host, n }) => n + ' visits to ' + host + '. That’s hours of your life. Gone. You don’t get them back.',
      social: ({ host, n }) => host + ', ' + n + ' times. Scrolling through other people’s lives instead of building your own.',
      work: ({ host, n }) => host + ' ' + n + ' times. Opening it isn’t the same as working in it.',
      ai: ({ host, n }) => n + ' times on ' + host + '. Asking is easy. Doing is the part you keep skipping.',
      shop: ({ host, n }) => n + ' visits to ' + host + '. Buying shit won’t fix it.',
      other: ({ host, n }) => host + ', ' + n + ' times. Whatever the hell it is, it isn’t your work.',
    }),

    /* ---- what Brutal thinks of everyone (kept clean: these show up in the voice picker) ---- */
    blurb: {
      neutral: 'Says nothing. At least it doesn’t lie.', monday: 'Complains instead of pushing. Lazy cruelty.', supportive: 'Tells you you’re perfect. That’s why you’re stuck.',
      surfer: 'Forgets your name and your deadlines. Useless.', professional: 'All process, no spine.', therapist: 'Charges you to avoid the work. Smart business.',
      weepy: 'Cries at everything. Exhausting.', victorian: 'The only other one with standards. Outdated ones.', brutal: 'Me. The only one who tells you the truth. Swears.',
      owl: 'Encourages your worst sleep habits.', ghost: 'Unfinished business, in person. Your role model.', parent: 'Hands out gold stars for breathing.',
    },
  };
})(window.SP = window.SP || {});
