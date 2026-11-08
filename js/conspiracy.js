/* The Conspiracist: a lovable, paranoid detective who believes everything is connected. Suspicious,
   dramatic, absurdly confident, occasionally accidentally correct. Its trick is connecting things on your
   page that have nothing to do with each other: three open tasks, three degrees outside, the 3rd of the
   month. Theories are built locally from your own numbers (SP.theory), no AI involved.
   House rule: the conspiracies are harmless and invented (the pigeons, the printer, Big Calendar, the
   moon). Never real-world conspiracy theories, never groups of people, never politics or health.
   Very rarely it drops the act. Then it picks the act straight back up.
   Loaded right after brutal.js, so everything that follows treats it like any other voice. */
(function (SP) {
  'use strict';
  const { plural, wx, pick, C } = SP.voice._h;
  const q = (s) => '“' + (String(s).length > 48 ? String(s).slice(0, 46) + '…' : s) + '”';
  const days = (n) => plural(n, 'day');
  const A = () => C().awayText;
  const R = (o) => ({ host, n, kind: k }) => { const f = o[k] || o.other; return f({ host, n }); };
  const list = (a) => (a || []).map(q).join(' and ');

  SP.voice.list.conspiracy = {
    name: 'Conspiracist', descriptor: 'Everything is connected. Especially you.',
    speech: { pitch: 1.05, rate: 1.14 },

    /* ---- onboarding ---- */
    ob_kicker: 'Secure line', ob_title_name: 'Who sent you?', ob_name_hint: 'A first name is fine. Never your real one. (Use your real one. It goes in the greeting.)', ob_name_ph: 'A name they won’t trace',
    ob_title_loc: 'Where are you? Roughly. Don’t say it out loud', ob_loc_hint: 'For the weather and the clock. The weather people already know, so you might as well tell me.', ob_locSet: ({ name }) => name + '. Of course. It’s always ' + name + '.',
    ob_title_voice: 'Who can you trust?', ob_voice_hint: 'A voice rewrites the whole page, settings included. Here’s how each one would greet you. Pick me. The others are in on it.',
    ob_next: 'Proceed', ob_back: 'Retreat', ob_skip: 'Go dark (skip)', ob_skipStep: 'Leave no trace', ob_finish: 'Begin the investigation', ob_rerun: 'Run the setup again (they’ll never suspect)',

    /* ---- greeting and summary ---- */
    greet: (p) => ({
      morning: ['You’re back. Interesting. They said you wouldn’t be', 'Morning. Act natural', 'Up early. Or are you? Morning', 'Morning. Nobody followed you here, I hope'],
      afternoon: ['Afternoon. Same time as yesterday. Noted', 'Good afternoon. If that’s your real name', 'Afternoon. Keep your voice down'],
      evening: ['Evening. Lock the door', 'Evening. The streetlights came on early again', 'Evening. I hope nobody saw you come in', 'Good evening. Allegedly'],
      night: ['Still up. So are they', 'Night. Perfect. Fewer witnesses', 'Late. The best time to think clearly'],
    }[p]),
    addr: ({ name }) => name || 'agent',
    heroSub: ({ open, focus }) => {
      const c = C(), out = [], th = SP.theory && SP.theory();
      if (th) out.push(th, th); // the theory gets two tickets in the rotation
      out.push(open ? plural(open, 'open task') + '. ' + (open === 3 ? 'Three. Of course it’s three.' : 'Written down, where anyone could read them.') : 'Zero tasks. Someone cleared the evidence. Was it you?');
      out.push(focus ? plural(focus, 'focus session') + ' today. Uninterrupted. That’s exactly what they want.' : 'No focus sessions today. Good. Stay unpredictable.');
      if (c.away > 36e5) out.push('Gone ' + c.awayText + '. And you expect me to believe you were busy.');
      if (c.visits > 3) out.push('Visit ' + c.visits + ' today. I’m not the only one counting.');
      if (c.habit && c.habit.n >= 2) out.push(c.habit.name + ': ' + days(c.habit.n) + ' in a row. A pattern. They love a pattern.');
      if (c.lastDone) out.push(q(c.lastDone) + ', done. One loose end tied up.');
      if (c.prevVoice) out.push('You were with ' + c.prevVoice + '. What did they ask you? Exactly. Write it down.');
      return out;
    },
    tasksEmpty: ['No tasks. Someone cleared the evidence. Was it you?', 'Empty. Too empty. That’s what a cover-up looks like.', 'Nothing on the list. Keep it that way. Lists can be read.', 'A clean slate. Suspiciously clean.'],

    /* ---- focus, countdowns, habits ---- */
    focusTitle: 'Surveillance Window', mode_work: 'Focus', mode_short: 'Short break (stay alert)', mode_long: 'Long break (sweep for bugs)',
    focusToday: ({ n }) => n ? n + ' today. They’re keeping count too.' : 'None yet. Unpredictable. Good.',
    focusDone: ['25 minutes of uninterrupted activity. That’s exactly what they want. Well done, though.', 'Session complete. Nobody got in. I checked.', 'Done. Take a break. Somewhere without windows.'],
    breakDone: ['Break over. Back to your post.', 'Time. Look busy. Be busy. Both.', 'Break’s done. Did you notice anyone? No? That’s what worries me.'],
    cdTitle: 'Countdowns (To What?)', cdDays: 'days until it happens', cdToday: 'It’s today. Stay calm', cdTomorrow: 'day left. Exactly as planned',
    cdEmpty: ['No countdowns. Which means you don’t know what’s coming. I do. Sort of.', 'Nothing to count down to. That’s what they want you to think.', 'No dates. No deadlines. No paper trail. Clever.'],
    habitsTitle: 'Patterns', habitsEmpty: ['No habits. No patterns. They can’t predict you. Keep it up. Actually, add one.', 'Nothing tracked. Off the grid. I respect it.', 'No habits yet. Start small. Somewhere they won’t look.'],
    streak: ({ n }) => n + ' days. A pattern', streakToast: ({ n, name }) => [days(n) + ' of ' + name + '. Consistent. Too consistent? No. Keep going.', name + ', ' + days(n) + ' straight. That’s not a coincidence. That’s you.', days(n) + '. ' + name + '. The pattern holds.'],

    weatherQuip: (c) => pick(wx(c), { wet: 'Rain again? Coincidence? Please.', snow: 'Snow. Every flake different. That’s how they track them.', cold: 'Cold. Who set it this cold? Someone set it this cold.', warm: 'Warm. Unseasonably. I’m writing that down.', mild: 'Perfect weather. Too perfect. Stay inside.' }),

    /* ---- repo vitals ---- */
    vitalsTitle: 'Cold Cases', vitalsWatch: 'Under surveillance',
    vitalsHero: ({ total, dead, flatlined }) => { const b = (dead || 0) + (flatlined || 0); return b ? b + ' of ' + total + ' repos went quiet. All of them. Around the same time. Someone’s covering their tracks.' : 'All ' + total + ' repos alive. Every single one. That’s statistically suspicious.'; },
    state_alive: 'Active (too active?)', state_fading: 'Going quiet', state_flatlined: 'Gone dark', state_dead: 'Disappeared',

    /* ---- Customize ---- */
    panelTitle: 'The Control Room', tab_layout: 'Layout', tab_widgets: 'Widgets', tab_theme: 'Look', tab_settings: 'Settings',
    sec_layout: 'Layout (where they can’t see it)', sec_widgets: 'Your sources', sec_theme: 'Camouflage', sec_background: 'Background (check it for hidden messages)',
    sec_accent: 'Accent colour (choose carefully)', sec_voice: 'Who you’re listening to', sec_profile: 'Your file', sec_location: 'Your coordinates',
    sec_search: 'Search (they log it)', sec_github: 'GitHub (the paper trail)', sec_sync: 'Sync (a secret drop)', sec_data: 'Data',
    moreWidgets: 'More sources',
    tgl_greeting: 'Show the greeting', tgl_quote: 'Daily quote (read between the lines)', tgl_animate: 'Animate the background (let it move, so they think it’s normal)', tgl_summary: 'A briefing under the greeting',
    tgl_heckles: 'Let other voices cut in (watch what they say)', tgl_liveSky: 'Match the sky to the real weather and time of day', tgl_seasons: 'Seasons and holidays in the scene',
    tgl_brief: 'A morning briefing on the first tab of the day', tgl_speak: 'Read reactions and answers aloud (quietly)', speakHello: 'You can hear me. Keep the volume down.',
    tgl_chaos: 'Chaos mode: every card gets its own voice (infiltration)', chaosOn: 'Chaos mode. Every card has its own voice now. Trust none of them.',
    tgl_24h: '24-hour clock', tgl_favicons: 'Bookmark icons (fetched from Google, who already know)', tgl_syncAuto: 'Sync automatically',
    widgetsIntro: ({ space }) => 'Everything in ' + space + '. Drag cards by the handle while this is open; resize them with the size button. Arrange them so the patterns are obvious. To you.',
    voiceIntro: 'Pick a voice. Look at what they say about each other. Interesting, isn’t it.',
    fld_name: 'Your name', fld_tagline: 'Your tagline (a code phrase)',
    locIntro: ({ name }) => 'Weather and clock for ' + name + '. I won’t tell anyone. They already know.', locPlaceholder: 'Search for your city…',
    locNone: 'No location. Untraceable. But no weather either. Search for your city.', wx_noLocation: 'No location set. Off the grid. No weather, though.', wx_setLocation: 'Set location',
    btn_find: 'Find', btn_geo: 'Use my current location (think about it first)', fld_weekStart: 'Week starts on', fld_engine: 'Search engine (they all log it)',
    syncIntro: 'Keeps this browser and your other devices in step through a private GitHub Gist: a dead drop only you know about. Your token stays on each device.',
    btn_syncOn: 'Turn on sync', btn_syncNow: 'Sync now', btn_viewGist: 'View gist', btn_export: 'Export', btn_import: 'Import', btn_reset: 'Wipe everything (no trace)',
    dataHelp: 'Everything stays in this browser. Nothing is sent anywhere. That’s what I’d say too, but in this case it’s true.',
    btn_change: 'Change…', bgCustom: 'Your own picture. Nobody else has seen it. Hopefully.', bgBack: 'Back to the pixel scene',
    reset_title: 'Wipe everything?', reset_body: 'Spaces, bookmarks, tasks, notes and settings go back to the defaults. No trace left. Which is exactly what someone with something to hide would do.', reset_ok: 'Wipe it',
    import_title: 'Import this?', import_body: 'This replaces everything here. Are you sure the file is yours? Where did it come from? Fine.', import_ok: 'Import',
    dlg_save: 'Save', dlg_cancel: 'Cancel',
    search_placeholder: ['Search. They’re logging it anyway…', 'Look it up. Then look it up again, somewhere else…', 'Search for the truth (or a recipe)…', 'What are we investigating today…'],
    rail_customize: 'The control room', rail_newSpace: 'New safe house',
    grid_empty: ['Nothing here. Wiped clean. Who did this?', 'Empty. A blank wall. Perfect for string.', 'No widgets. No sources. We’re flying blind.'], grid_emptyBtn: 'Add widgets',
    w_bookmarks: 'Known Locations', w_tasks: 'Open Cases', w_notes: 'Evidence Board', w_github: 'The Paper Trail', w_worldclock: 'Time Zones (Suspicious)', w_news: 'What They Want You To Read', w_forecast: 'Weather Manipulation Report',
    notes_placeholder: ['Write it down before they make you forget…', 'Evidence goes here. Everything is evidence…', 'Connect the dots. Use more dots…'],
    task_placeholder: ['A new lead…', 'Something that needs looking into…', 'Add a task. Use code words if you have to…'],
    toast_location: ({ name }) => name + '. Interesting choice. Saved.',
    desc_search: 'Search, with bookmarks, !bangs, maths and > commands. Every query a clue', desc_bookmarks: 'Folders and tiles. Places you go. Places you’re seen',
    desc_weather: 'The weather now and for three days. Look for the patterns', desc_clock: 'The time. The real time. Probably', desc_tasks: 'A to-do list. Open cases, closed cases',
    desc_notes: 'Quick notes. Keep the evidence', desc_github: 'Repo activity and CI. Who pushed what, and when', desc_music: 'Your own streams. Play something to cover the sound of thinking',
    desc_quote: 'A quote a day. There’s a message in there', desc_forecast: '24 hours of wind, UV, sun and air quality. Who controls the wind? Ask yourself',
    desc_focus: 'A focus timer. 25 minutes they can’t interrupt', desc_calendar: 'A month with week numbers. Count the Tuesdays',
    desc_countdown: 'Days until the things you’re waiting for', desc_worldclock: 'The time in other cities. Where they are', desc_habits: 'Habits, streaks and an 18-week heatmap. Patterns, in squares',
    desc_news: 'Hacker News or dev.to. What they want you to read', desc_vitals: 'Which of your repos are alive, going quiet, or gone',

    /* ---- reactions ---- */
    re_taskAdd: [({ text }) => q(text) + '. A new lead. I’ll start a file.', 'Added. Now it’s written down. Was that wise? Yes. Fine.', ({ open }) => plural(open, 'open case') + '. Not a coincidence.', ({ text }) => q(text) + '. Who asked you to do that? Interesting.'],
    re_taskDone: [({ text }) => q(text) + '. One loose end eliminated. Excellent.', 'Done. Case closed. For now.', ({ open }) => 'Finished. ' + plural(open, 'case') + ' still open. They multiply when you’re not looking.', 'Tick. Nobody saw. Good.'],
    re_taskAllDone: ['All cases closed. Which is exactly when they make their move. Stay sharp.', 'Nothing left. Too quiet. I don’t like it.', 'Everything done. Either you’re very good, or someone wanted it this way. Both. Probably both.'],
    re_taskUndo: ['Reopened. New evidence?', 'Un-done. So it wasn’t finished. I knew it.', 'Back on the list. They always come back.'],
    re_taskDelete: [({ text }) => q(text) + ', gone without a trace. Very professional.', 'Deleted. No record it ever existed. I’ll pretend I didn’t see that.', ({ text }) => 'What was ' + q(text) + '? Never mind. It’s better if I don’t know.'],
    re_taskClear: ({ n }) => 'Cleared ' + plural(n, 'finished task') + '. Destroying the evidence. Smart.',
    re_focusPause: [({ time }) => 'Paused with ' + time + ' left. Who interrupted you? Describe them.', ({ time }) => time + ' to go and you stopped. Did you hear something too?', 'Paused. Check the window. Then carry on.'],
    re_focusQuit: ['Reset. Wipe the board. Start again. They’ll never know.', 'Abandoned. I’ll log it as interference.'],
    re_streakBreak: ({ name, n }) => days(n) + ' of ' + name + ', broken. Yesterday of all days. Think about who benefits.',
    re_late: [({ time }) => 'It’s ' + time + '. The best time to think. The worst time to be seen. Go to bed.', ({ time }) => time + '. Every light on the street is off except yours. Just saying.', ({ time }) => 'Still up at ' + time + '. Me too. Coincidence? Yes, actually. Go to sleep.'],
    re_visits: [({ n }) => 'Visit ' + n + ' today. I’m not the only one counting.', ({ n }) => n + ' times. A pattern is forming.', ({ n }) => 'That’s ' + n + '. Every time you open a tab, something somewhere writes it down. Mostly me.'],
    re_unlock: ({ name }) => name + ' just appeared. Out of nowhere. Nobody just appears. Watch them.',
    heckle: [({ who }) => 'Interesting that ' + who + ' would say that. Very interesting.', ({ who }) => 'Ask yourself who benefits when ' + who + ' talks like that.', 'Don’t trust any of them. Trust me. Mostly.'],
    heckle_at: {
      supportive: 'She knows your coffee order. How? Think about it.', monday: 'Always tired. Up all night doing what, exactly?', surfer: 'Forgets everything. Convenient.',
      professional: 'Writes everything down. For whom?', therapist: 'Asks a lot of questions for someone who never answers any.', weepy: 'Cries at everything. A perfect cover.',
      victorian: 'Says she’s from the 1890s. No records. Not one.', brutal: 'Loud. Very loud. Loud is how you hide things.', owl: 'Up all night. Watching.', ghost: 'Literally invisible. I rest my case.', parent: 'Knows where you are at all times. ALL times.',
    },
    re_grudge: [({ n, rival }) => 'You went to ' + rival + ' ' + plural(n, 'time') + '. What did they tell you? Don’t answer. They might be listening.', ({ n }) => 'Back again. ' + plural(n, 'time') + ' you’ve left. I keep a log. Of course I keep a log.'],
    grudgeSub: ({ n, rival }) => 'You’ve left ' + plural(n, 'time') + ', mostly for ' + rival + '. I’m not angry. I’m taking notes.',
    re_bond: ({ level, days: d }) => [, d + ' days. You haven’t told anyone about me. Good.', d + ' days. You’re starting to see it too, aren’t you. The patterns.', d + ' days. You’re the only one I trust. Don’t make it weird.'][level],
    bond_greet: ['You came back. Good. I have updates', 'Agent. Welcome back', 'You. Finally. Sit down'],
    bond_sub: ['You keep coming back. You’re one of the few who sees it.', 'We’ve been through a lot. Mostly in this tab. It counts.'],
    leave_title: () => 'Switching? Who got to you?', leave_body: ({ to }) => 'Go ahead. Ask ' + to + '. Ask all of them. They’re all in on it. You’ll be back.',
    leave_ok: 'I need to see for myself', leave_cancel: 'You’re right. I’m staying',
    welcomeVoice: ({ prev }) => [prev + ' had you for a while. Did they ask about me? Don’t answer.', 'Back from ' + prev + '. You look different. Debriefing later.'],
    welcomeBack: () => [A() + ' missing. And you expect me to believe you were busy.', 'Back after ' + A() + '. Where were you? No. Don’t tell me. Safer that way.', 'Gone ' + A() + '. I kept everything exactly as you left it. I checked it twice a day.'],

    /* ---- achievements, discoveries ---- */
    ach_toast: ({ name }) => '“' + name + '”. Awarded by whom? Exactly. Still, well done.',
    ach_reward: ({ scene }) => scene + ' unlocked. A new location. Memorise the exits.',
    sec_achievements: 'Commendations', sec_discoveries: 'Things they didn’t want you to find',

    /* ---- Wrapped ---- */
    wr_kicker: 'Weekly dossier', wr_title: 'The Week, Declassified', wr_save: 'Save a copy (keep it somewhere safe)', wr_share: 'Leak it', wr_close: 'Burn after reading', wr_open: 'Open the weekly dossier',
    wr_done: ({ n, added }) => n + ' closed, ' + added + ' opened. ' + (n === added ? 'Exactly the same. That’s not a coincidence.' : n > added ? 'You’re ahead. They hate that.' : 'They keep coming. Faster than you close them. Interesting.'),
    wr_focus: ({ n, time }) => n ? plural(n, 'focus session') + ', ' + time + ' of uninterrupted activity. Nobody got in.' : 'No focus sessions. You stayed unpredictable all week. Good fieldcraft. Bad for the to-do list.',
    wr_streak: ({ name, n }) => 'Longest pattern: ' + name + ', ' + days(n) + '. Unbroken.',
    wr_visits: ({ n, late }) => plural(n, 'visit') + ' logged. ' + (late ? late + ' after midnight. The hours when they think nobody’s looking.' : 'All in daylight. Where everyone can see.'),
    wr_dropped: ({ n }) => plural(n, 'task') + ' deleted unfinished. No trace. Professional work.',
    wr_repos: ({ dead, total }) => dead + ' of ' + total + ' repos went dark this week. Someone knows why.',
    wr_outro: ['That’s the week. Read it again. The pattern is in there.', 'Dossier closed. Burn this tab. (Don’t. Just close it.)', 'Same time next week. They’ll be watching. So will I.'],
    wr_mood: ({ avg }) => 'Average mood: ' + avg + ' out of 5. Average. That’s what they’d want you to report.',

    /* ---- Ask ---- */
    ask_label: ({ name }) => 'Ask ' + name + ' (secure line)', ask_ph: ['Ask me. Quietly…', 'What do you want to know? I know things…', 'Go on. This line is secure. Probably…'],
    ask_thinking: ['Connecting the dots…', 'Checking my sources…', 'Cross-referencing…'], ask_refused: 'I can’t talk about that one. Not here.', ask_send: 'Ask', sec_ask: 'Ask a voice (Claude API, your own key)',

    /* ---- morning brief ---- */
    mb_title: 'Morning briefing', mb_write: ({ name }) => 'Have ' + name + ' write the briefing', mb_read: 'Read it to me (quietly)', mb_close: 'Understood',
    mb_tasks: ({ n, top }) => plural(n, 'open case') + '. Priority: ' + list(top) + '. Move fast. Don’t draw attention.',
    mb_noTasks: ['No open cases. Too quiet. Write something down before they do.', 'Nothing on the list. That’s when they make their move.', 'A blank list. Use it. Before someone else does.'],
    mb_streak: ({ name, n }) => name + ': ' + days(n) + '. Miss today and the pattern breaks. They’d like that.',
    mb_cd: ({ title, days: d }) => (d === 0 ? title + ' is today. Everything has been leading to this.' : title + ' in ' + days(d) + '. Mark it. Tell nobody.'),

    /* ---- dares ---- */
    dare_kicker: 'Today’s mission', dare_ok: 'Accept the mission', dare_no: 'Too risky', dare_doneTag: 'Mission complete', tgl_dares: 'A small daily mission',
    d_one: 'Close one case before noon. Quietly.', d_three: 'Three tasks today. Change the pattern.', d_focus: 'One full focus session. No interruptions. Lock the door.',
    d_habits: 'Every habit, today. Leave no gaps in the record.', d_zero: 'Clear the whole list. Leave nothing for them to find.', d_note: 'Write down one thing you noticed today. Everything matters.',
    dare_done: ['Mission complete. Nobody suspected a thing.', 'Done. Clean work. No witnesses.', 'Accomplished. I’ll destroy the instructions.'],
    dare_declined: ['Too risky. Smart. Or is it what they want you to do? No. It’s fine.', 'Declined. I’ll tell them you were never here.', 'No mission today. Lay low. Understood.'],

    /* ---- panel tabs and sections ---- */
    tab_voice: 'Voices (trust none)', tab_you: 'Your file', tab_progress: 'Your record', tab_data: 'The archive',
    sec_motion: 'Moving things', sec_talk: 'How much I tell you', sec_myvoices: 'Voices you made (who else knows?)', sec_time: 'Time (as they measure it)',
    sec_wrapped: 'Weekly dossier', sec_backup: 'Backups (in a safe place)', sec_danger: 'Destroy everything', find_ph: 'Find a setting…', find_none: ({ q: s }) => 'Nothing called “' + s + '”. It was here a minute ago. I swear.',

    /* ---- modules ---- */
    w_moon: 'The Moon (Allegedly)', w_onthisday: 'What They Say Happened Today', w_fx: 'Currency (Follow The Money)', w_mood: 'Mood (Off The Record)', w_since: 'Days Since The Incident', w_decide: 'Leave It To Chance (Is It Chance?)',
    desc_moon: 'The moon’s phase. If it’s even there', desc_onthisday: 'Events on this date, according to the official story', desc_fx: 'Exchange rates, daily. Follow the money',
    desc_mood: 'A daily mood check-in. It stays on this device. I made sure', desc_since: '“Days since” counters. Since the incident', desc_decide: 'Coin, dice, an 8-ball, “pick one”, rock-paper-scissors and would-you-rather. Totally random. Supposedly',
    moonQuip: ({ phase, pct }) => phase + ', ' + pct + '% lit. Who decides the percentage? Exactly.',
    otd_intro: ['On this day, according to the official story:', 'Today in history (their version):', 'On this date, allegedly:'],
    mood_q: ['How are you, really? Off the record.', 'Mood check. Nobody else will see this. I checked.', 'How are you feeling? One tap. Quietly.'],
    mood_log: ({ n }) => ['', 'Rough day. I believe you. Something’s going on.', 'Not great. It’s not you. It’s them.', 'Okay. Steady. Unremarkable. Perfect cover.', 'Good. Don’t tell anyone. They get suspicious of good days.', 'Great! Keep it quiet.'][n],
    since_empty: ['No counters. Nothing to track. That we know of.', 'Add a “days since”. Since the last incident. There’s always an incident.', 'Nothing counted. Start the record now, before they rewrite it.'],
    since_reset: ({ title, n }) => q(title) + ' lasted ' + days(n) + '. Then it happened again. Of course it did.',
    decide_pickPh: 'Options. Comma-separated. Use code names',
    ball: ['Yes. And you didn’t hear it from me.', 'No. They’d never allow it.', 'Ask again when we’re alone.', 'The signs point to yes.', 'Absolutely not. Too much attention.', 'It’s already been decided. Elsewhere.', 'Yes, but tell no one.', 'Don’t trust the question.'],
    decide_aside: ['Decided. Or was it decided for you?', 'There. Random. Allegedly.', 'The coin chose. Who made the coin, though?'],
    decide_edge: 'It landed on its edge. One in a hundred and fifty. And it happened to you. Today. Think about that.',
    rps_win: [({ you, them }) => you + ' beats ' + them + '. You saw it coming. How?', 'You win. Exactly as predicted. By me.', 'Win. Don’t celebrate. They’re watching.'],
    rps_lose: [({ them }) => them + '. You lost. I knew you’d throw that.', 'I win. I read the signs.', 'Lost. It was rigged. Not by me. Probably.'],
    rps_tie: ['Tie. Same throw. We’re thinking alike. Worrying.', 'Draw. Coincidence? There are no coincidences.', 'Same again. Somebody tipped us both off.'],
    rps_cheat: ['I saw your hand twitch. Bit of a tell.', 'I knew. I always know. I peeked.'],
    rps_streak: [({ n }) => n + ' in a row. A pattern. I’m writing it down.', ({ n }) => n + ' straight. Nobody wins that many. Who are you working for?'],
    wyr_opts: ['check the back of a painting for hidden messages', 'count the pigeons on your street', 'write down everything that happened today, just in case', 'cover your laptop camera with a sticker', 'take a different route home today', 'learn one thing they don’t teach in schools', 'look closely at a banknote'],
    wyr_won: ['Good choice. Stay vigilant.', 'Smart. You’re learning.', 'Yes. Now they won’t see you coming.'],
    wyr_lost: ['Theirs. Interesting. What did they promise you?', 'You picked the other one. Exactly what they predicted.', 'Fine. I’ll pretend I didn’t see that.'],

    /* ---- the cat, sounds, swearing, Friday nights ---- */
    tgl_sounds: 'Sound effects (subtle, so nobody notices)', tgl_pet: 'A cat on your cards (it sees everything)', tgl_swear: 'Let Brutal swear (it gives away too much)',
    pet_meet: 'There’s a cat on your cards now. It turned up out of nowhere. Cats don’t just turn up. Watch it.',
    pet_poke: [({ n }) => n + ' pokes. It’s keeping count too.', 'Careful. It reports to someone.', 'The cat blinked twice. That means something.'],

    /* ---- time capsule ---- */
    w_capsule: 'Sealed Records', desc_capsule: 'Write to future you. Classified until the date you pick',
    capsule_ph: 'If you’re reading this, it means…', capsule_seal: 'Seal and classify', capsule_empty: 'No sealed records. Write one. Future you needs to know what you know.',
    capsule_sealed: [({ days: d }) => 'Sealed for ' + days(d) + '. Nobody can open it. Not even me. I tried.', ({ days: d }) => 'Classified. Declassified in ' + days(d) + '. Tell no one it exists.'],
    capsule_ready: [({ days: d }) => 'A record sealed ' + days(d) + ' ago has been declassified.', 'Something you wrote has been declassified. Read it before they redact it.'],
    capsule_open: [({ days: d }) => 'You wrote this ' + days(d) + ' ago. Was it a warning? Read it again.', ({ days: d }) => 'Declassified after ' + days(d) + '. Every word is still here. I counted.'],

    /* ---- birthday ---- */
    fld_birthday: 'Birthday (they already have it on file)', bday_greet: 'Happy birthday. Or so they say',
    bday_banner: 'It’s your birthday. Everyone left a card. I checked every one for hidden messages. They’re clean. Mostly.',
    bday_card: ({ name, days: d }) => 'Happy birthday' + (name ? ', ' + name : '') + '. Another trip around the sun, allegedly. ' + (d > 1 ? d + ' days we’ve been watching the patterns together. ' : '') + 'Have cake. Check it first.',

    /* ---- face-offs ---- */
    tgl_faceoffs: 'A weekly face-off between two voices (staged, obviously)', fo_kicker: 'Interrogation',
    fo_tasks: [({ open }) => plural(open, 'open case') + '. Too many to be a coincidence. Close them before they connect.', ({ open }) => open + ' tasks open. Whoever’s adding them, it isn’t just you.'],
    fo_sleep: [({ late }) => plural(late, 'late night') + ' this week. Up when the city’s asleep. What are you working on? I’m asking for a file.', ({ late }) => late + ' nights up late. Sleep. They can’t get to you while you sleep. Probably.'],
    fo_streak: [({ n, name }) => name + ': ' + days(n) + '. Keep the pattern. It’s the only one that’s yours.', ({ n, name }) => days(n) + ' of ' + name + '. Unbroken. That kind of consistency gets noticed.'],
    fo_focus: [({ focus }) => plural(focus, 'focus session') + ' this week. Uninterrupted. Nobody got in. Good.', ({ focus }) => focus + ' sessions. Not enough. They’re counting on that.'],
    fo_win: ['Exactly. You see it too.', 'Correct. Keep your voice down.'], fo_lose: ['Interesting choice. Who told you to pick that?', 'Wrong. Or right. That’s what they want you to wonder.'],
    fo_sulk: ['You sided against me. No briefing today. You know what you did.', 'Lost the face-off. No summary. I’m reviewing the footage.'],

    /* ---- levels ---- */
    sec_level: 'Clearance level', lvl_up: [({ level, title }) => 'Clearance level ' + level + ': ' + title + '. You can know slightly more now.', ({ level, title }) => title + '. Level ' + level + '. Someone upstairs noticed you.'],
    lvl_titles: ['Civilian', 'Person of interest', 'Amateur sleuth', 'Informant', 'Field agent', 'Handler', 'Insider', 'Deep cover', 'Mastermind', 'The one who knows'],

    /* ---- bookmark roasts ---- */
    tgl_roasts: 'Let me look into the sites you open most',
    bm_roast: R({
      video: ({ host, n }) => n + ' visits to ' + host + '. The algorithm knows you better than I do now. That worries me.',
      social: ({ host, n }) => host + ', ' + n + ' times. Everything you scroll past is chosen for you. Think about that.',
      work: ({ host, n }) => host + ' ' + n + ' times. They can see your productivity from there, you know.',
      ai: ({ host, n }) => n + ' times on ' + host + '. Asking a machine for answers. What does it ask you back?',
      shop: ({ host, n }) => n + ' visits to ' + host + '. It knew what you wanted before you did. How?',
      other: ({ host, n }) => host + ', ' + n + ' times. I’ve opened a file on it.',
    }),

    /* ---- what the Conspiracist thinks of everyone (shows up in the voice picker) ---- */
    blurb: {
      neutral: 'Says nothing. Suspicious.', monday: 'Always tired. Up all night doing what?', supportive: 'Knows too much about you.',
      surfer: 'Forgets everything. Convenient.', professional: 'Keeps records. For whom?', therapist: 'Asks questions. Never answers any.',
      weepy: 'The crying is a cover.', victorian: 'No records before 1890. None.', brutal: 'Loud. Loud is how you hide things.',
      conspiracy: 'Me. The only one who sees it.', owl: 'Up all night. Watching.', ghost: 'Literally invisible. I rest my case.', parent: 'Knows where you are. Always.',
    },
  };

  /* ---------- Theories: unrelated things on your page that happen to share a number ---------- */
  const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];
  const word = (n) => WORDS[n] || String(n);
  const cap = (s) => s[0].toUpperCase() + s.slice(1);
  const ord = (n) => n + (n % 100 >= 11 && n % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] || 'th');
  const pad = (n) => String(n).padStart(2, '0');
  const today = () => { const d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
  /* Everything on the page with a number in it. Each fact: its number, how to say it, and where it came from. */
  function facts(now) {
    const s = SP.store.state, out = [], add = (n, say, from) => { if (Number.isFinite(n) && n >= 1 && n <= 60) out.push({ n: Math.round(n), say, from }); };
    now = now || new Date();
    const open = (s.tasks || []).filter((x) => !x.done).length;
    add(open, (n) => plural(n, 'unfinished task'), 'tasks');
    const st = ((s.stats || {})[today()]) || {};
    add(st.done, (n) => plural(n, 'task') + ' done today', 'done');
    add((s.presence || {}).visits, (n) => plural(n, 'visit') + ' today', 'visits');
    add(now.getDate(), () => 'it’s the ' + ord(now.getDate()), 'date');
    const h = now.getHours() % 12 || 12;
    add(h, () => 'it’s ' + word(h) + ' o’clock', 'hour');
    try {
      if (s.location) {
        const w = SP.store.cache.get('wx2:' + s.location.lat.toFixed(2) + ',' + s.location.lon.toFixed(2) + ':' + s.units, 6 * 36e5);
        const tmp = w && w.current && w.current.temperature_2m;
        if (tmp != null && Math.round(tmp) >= 1) add(Math.round(tmp), (n) => plural(n, 'degree') + ' outside', 'weather');
      }
    } catch (e) { /* no weather yet */ }
    const hb = SP.voice._h.bestHabit(s.habits);
    if (hb && hb.n >= 2) add(hb.n, (n) => n + ' days of ' + hb.name, 'habit');
    for (const c of (s.countdowns || []).slice(0, 3)) {
      const [y, m, d] = String(c.date || '').split('-').map(Number); if (!y) continue;
      const n = Math.round((new Date(y, m - 1, d) - new Date(now.getFullYear(), now.getMonth(), now.getDate())) / 864e5);
      add(n, (k) => plural(k, 'day') + ' until ' + c.title, 'countdown:' + c.id);
    }
    if (SP.levels) add(SP.levels.info().level, (n) => 'you’re level ' + n, 'level');
    add((s.shelf || []).filter((x) => x.status === 'want').length, (n) => plural(n, 'thing') + ' waiting on your shelf', 'shelf');
    add((s.shop || []).filter((x) => !x.done).length, (n) => plural(n, 'thing') + ' to buy', 'shop');
    add((s.bookmarks && s.bookmarks.tiles || []).length, (n) => plural(n, 'bookmark') + ' on your page', 'tiles');
    const first = (s.presence || {}).firstSeen;
    if (first) add(Math.floor((now - first) / 864e5), (n) => plural(n, 'day') + ' since we met', 'met');
    return out;
  }
  const SAME = [
    (a, b, n) => cap(a) + '. ' + cap(b) + '. ' + word(n).toUpperCase() + '. I’m documenting this.',
    (a, b) => cap(a) + '. And ' + b + '. Coincidence? There are no coincidences.',
    (a, b, n) => cap(a) + ', and ' + b + '. ' + cap(word(n)) + ' and ' + word(n) + '. Explain that.',
    (a, b) => cap(a) + '. Meanwhile, ' + b + '. Nobody is talking about this.',
    (a, b, n) => 'Think about it. ' + cap(a) + '. ' + cap(b) + '. ' + cap(word(n)) + '. Again.',
  ];
  const SUM = [
    (a, b, c, n) => cap(a) + ', plus ' + b + ', makes ' + word(n) + '. And ' + c + '. I’ve said too much.',
    (a, b, c) => 'Add ' + a + ' to ' + b + '. Now look: ' + c + '. Connect the dots.',
  ];
  /* A theory, if the numbers line up; steady for an hour, so it doesn't change on every render. */
  function theory(now) {
    now = now || new Date();
    let seed = now.getFullYear() * 1e6 + (now.getMonth() + 1) * 1e4 + now.getDate() * 100 + now.getHours();
    const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
    const f = facts(now), found = [];
    // Two unrelated things with the same number (not two clock facts: “it's the 3rd” and “three o'clock” is just a Tuesday).
    for (let i = 0; i < f.length; i++) for (let j = i + 1; j < f.length; j++) {
      const a = f[i], b = f[j];
      if (a.n !== b.n || a.from === b.from || (/date|hour/.test(a.from) && /date|hour/.test(b.from))) continue;
      found.push({ w: a.n === 1 ? 1 : 3, make: () => SAME[Math.floor(rnd() * SAME.length)](a.say(a.n), b.say(b.n), a.n) });
    }
    // Two things that add up to a third.
    for (let i = 0; i < f.length; i++) for (let j = i + 1; j < f.length; j++) for (let k = 0; k < f.length; k++) {
      const a = f[i], b = f[j], c = f[k];
      if (k === i || k === j || a.n + b.n !== c.n || a.n < 2 || b.n < 2 || new Set([a.from, b.from, c.from]).size < 3) continue;
      found.push({ w: 1, make: () => SUM[Math.floor(rnd() * SUM.length)](a.say(a.n), b.say(b.n), c.say(c.n), c.n) });
    }
    // A build that failed while it was raining.
    try {
      const s = SP.store.state, g = s.github && s.github.user && SP.store.cache.get('gh:' + s.github.user + ':' + (s.github.token ? 1 : 0), 6 * 36e5);
      const fail = g && (g.rows || []).find((r) => r.kind === 'fail');
      const w = s.location && SP.store.cache.get('wx2:' + s.location.lat.toFixed(2) + ',' + s.location.lon.toFixed(2) + ':' + s.units, 6 * 36e5);
      if (fail && w && w.current && wx(w.current.weather_code) === 'wet') {
        const t = new Date(fail.time), hm = pad(t.getHours()) + ':' + pad(t.getMinutes());
        found.push({ w: 6, make: () => 'Your build failed at ' + hm + '. It’s raining. Explain that.' });
      }
    } catch (e) { /* nothing to connect */ }
    if (!found.length) return '';
    let total = found.reduce((x, y) => x + y.w, 0), r = rnd() * total;
    for (const t of found) { r -= t.w; if (r <= 0) return t.make(); }
    return found[0].make();
  }
  SP.theory = theory;
  SP.theory.facts = facts;

  /* Now and then, when it's the voice in charge: a theory after you finish something, and, very rarely, the act slips. */
  const mine = () => SP.voice.key() === 'conspiracy';
  const say = (msg, ms) => SP.ui.toastLater(msg, { who: 'Conspiracist', ms: ms || 7000 });
  let lastTheory = 0;
  SP.on('stat', ({ name, by }) => {
    if (!mine() || by < 1 || !/^(done|focus|habits|puzzles|shelf|prompts)$/.test(name) || Date.now() - lastTheory < 20 * 6e4 || Math.random() > 0.2) return;
    const th = theory(); if (!th) return;
    lastTheory = Date.now(); setTimeout(() => say(th), 2500);
  });
  SP.on('ready', () => {
    if (!mine()) return;
    const p = SP.store.state.presence || (SP.store.state.presence = {});
    if (Math.random() > 0.01 || (p.sincere && Date.now() - p.sincere < 7 * 864e5)) return;
    p.sincere = Date.now(); SP.store.save({ quiet: true });
    say('For the record, I’m genuinely glad you’re here.', 6000);
    setTimeout(() => say('Forget I said that. They’re listening.', 5000), 2000);
  });
})(window.SP = window.SP || {});
