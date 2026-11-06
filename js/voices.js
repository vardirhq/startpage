/* Personality voices (concept from Dead Repo). A voice rewrites ALL of the page's copy:
   greetings, widgets, the Customize panel, settings, dialogs, placeholders, toasts.
   Neutral is the complete baseline; other voices override keys and fall back to it.
   Values: strings, functions of a context object, or arrays (one picked per hour). */
(function (SP) {
  'use strict';

  const plural = (n, one, many) => n + ' ' + (n === 1 ? one : many || one + 's');
  function wx({ code, temp, units }) {
    const c = units === 'fahrenheit' ? (temp - 32) * 5 / 9 : temp;
    const wet = (code >= 51 && code <= 67) || (code >= 80 && code <= 82) || code >= 95;
    const snow = (code >= 71 && code <= 77) || code === 85 || code === 86;
    return { wet, snow, cold: c < 5, warm: c > 20 };
  }
  const pick = (w, o) => (w.wet ? o.wet : w.snow ? o.snow : w.cold ? o.cold : w.warm ? o.warm : o.mild);

  const VOICES = {
    /* ===================================================================== */
    neutral: {
      name: 'Neutral', descriptor: 'Just the facts.',
      greet: (p) => ({ morning: 'Good morning', afternoon: 'Good afternoon', evening: 'Good evening', night: 'Good night' }[p]),
      heroSub: ({ open, focus }) => plural(open, 'open task') + ' · ' + plural(focus, 'focus session') + ' today.',
      tasksEmpty: 'Nothing to do. Nice.',
      focusTitle: 'Focus', mode_work: 'Focus', mode_short: 'Short break', mode_long: 'Long break',
      focusToday: ({ n }) => n + ' today', focusDone: 'Session complete. Take a break.', breakDone: 'Break over. Back to it.',
      cdTitle: 'Countdowns', cdDays: 'days to go', cdToday: 'It’s today', cdTomorrow: 'day to go', cdEmpty: 'No upcoming events. Add one with +.',
      habitsTitle: 'Habits', habitsEmpty: 'Add a habit to start tracking.',
      streak: ({ n }) => plural(n, 'day') + ' in a row', streakToast: ({ n, name }) => name + ': ' + n + '-day streak.',
      weatherQuip: (c) => pick(wx(c), { wet: 'Rain expected. Bring a jacket.', snow: 'Snow. Roads may be slippery.', cold: 'Cold out. Dress warm.', warm: 'Warm day ahead.', mild: 'Mild conditions.' }),
      vitalsTitle: 'Repo vitals', vitalsWatch: 'Needs attention',
      vitalsHero: ({ total, alive }) => alive + ' of ' + plural(total, 'repository', 'repositories') + ' active in the last 30 days.',
      state_alive: 'Active', state_fading: 'Slowing', state_flatlined: 'Stalled', state_dead: 'Inactive',

      panelTitle: 'Customize', tab_layout: 'Layout', tab_widgets: 'Widgets', tab_theme: 'Theme', tab_settings: 'Settings',
      sec_layout: 'Layout', sec_widgets: 'Widgets', sec_theme: 'Theme', sec_background: 'Background', sec_accent: 'Accent color', sec_voice: 'Voice',
      sec_profile: 'Profile', sec_location: 'Location', sec_search: 'Search', sec_github: 'GitHub', sec_sync: 'Sync', sec_data: 'Data',
      moreWidgets: 'More widgets',
      tgl_greeting: 'Show greeting', tgl_quote: 'Show daily quote', tgl_animate: 'Animate background', tgl_summary: 'Show a summary line under the greeting',
      tgl_24h: '24-hour clock', tgl_favicons: 'Load bookmark icons (via Google’s favicon service)', tgl_syncAuto: 'Sync automatically',
      widgetsIntro: ({ space }) => 'Widgets for the ' + space + ' space. While this panel is open, drag cards by their handle to reorder them, and use the size button to make a card small, medium or large.',
      voiceIntro: 'Changes the tone of the whole page, settings included. Each voice has opinions about the others.',
      fld_name: 'Your name', fld_tagline: 'Tagline',
      locIntro: ({ name }) => 'Used for the weather and clock. Currently ' + name + '.', locPlaceholder: 'Search for a city…', btn_find: 'Find', btn_geo: 'Use my current location',
      fld_weekStart: 'Week starts on', fld_engine: 'Search engine',
      syncIntro: 'Keeps this browser and your other devices in step using a private GitHub Gist. Your token is never uploaded; each device uses its own.',
      btn_syncOn: 'Turn on sync', btn_syncNow: 'Sync now', btn_viewGist: 'View gist',
      btn_export: 'Export', btn_import: 'Import', btn_reset: 'Reset all', dataHelp: 'Everything is stored locally in this browser. Export to move it to another device.',
      btn_change: 'Change…', bgCustom: 'Using your own image.', bgBack: 'Back to the pixel scene',
      reset_title: 'Reset everything?', reset_body: 'All spaces, bookmarks, tasks, notes and settings go back to defaults.', reset_ok: 'Reset',
      import_title: 'Import settings?', import_body: 'This replaces your current startpage data.', import_ok: 'Import',
      dlg_save: 'Save', dlg_cancel: 'Cancel',
      search_placeholder: 'Search the web, GitHub, docs, or anything…',
      rail_customize: 'Customize', rail_newSpace: 'New space',
      grid_empty: 'This space has no widgets yet.', grid_emptyBtn: 'Add widgets',
      w_bookmarks: 'Bookmarks', w_tasks: 'Tasks', w_notes: 'Notes', w_github: 'GitHub',
      w_worldclock: 'World clocks', w_news: 'News', w_forecast: 'Forecast',
      notes_placeholder: 'Click to write a note…', task_placeholder: 'New task…',
      toast_location: ({ name }) => 'Location set to ' + name,
      desc_search: 'Search bar with bookmark suggestions, !bangs, math and > commands', desc_bookmarks: 'Folders and quick-launch tiles', desc_weather: 'Current conditions and 3-day forecast',
      desc_clock: 'Local time and location', desc_tasks: 'Simple to-do list', desc_notes: 'Quick bullet notes', desc_github: 'Recent repo activity and CI status',
      desc_music: 'Player for your own streams and audio files', desc_quote: 'A new quote every day', desc_forecast: '24-hour chart, wind, UV, sunrise/sunset and air quality',
      desc_focus: 'Pomodoro timer with breaks, chime and notifications', desc_calendar: 'Month view with ISO week numbers and your countdowns',
      desc_countdown: 'Days left until the things you’re waiting for', desc_worldclock: 'Time in other cities, with offset from yours',
      desc_habits: 'Daily habits, streaks and an 18-week heatmap', desc_news: 'Top stories from Hacker News or dev.to', desc_vitals: 'Which of your repos are alive, fading or dead',
      blurb: {
        neutral: 'Reports the facts. Does not editorialize.', monday: 'Exasperated by your existence.', supportive: 'Extremely attached. Counts your visits.',
        surfer: 'Has not been fully awake since 2009.', professional: 'Speaks fluent quarterly review.', therapist: 'Connects your to-do list to your childhood.',
        weepy: 'Is crying. Was crying. Will be crying.', victorian: 'Uses forty words where one would do.',
      },
    },

    /* ===================================================================== */
    monday: {
      name: 'Monday', descriptor: 'Ugh.',
      greet: (p) => ({
        morning: ['Ugh. You', 'Oh. It’s you. Again', 'Ugh. Morning', 'Up already? For what', 'Oh. You survived the night'],
        afternoon: ['Ugh. You again', 'Oh. It’s you. Again', 'Half the day gone. Ugh', 'Back to stare at this page', 'Ugh. What now'],
        evening: ['Ugh. You again', 'Oh. It’s you. Again', 'Evening. Nothing shipped', 'Back to admire the page', 'Ugh. Still at it'],
        night: ['Ugh. Go to bed', 'It’s late. Seek help', 'Oh. It’s you. At night', 'Still up? Tragic', 'Ugh. Customizing again'],
      }[p]),
      heroSub: ({ open, focus }) => open === 0
        ? 'No open tasks. Either you did everything, or you stopped writing things down. We both know which.'
        : plural(open, 'task') + ' you keep scrolling past like ads. ' + (focus ? plural(focus, 'focus session') + '. Want a sticker?' : 'Zero focus sessions. Bold strategy.'),
      tasksEmpty: 'Empty. Don’t pretend that means you’re done.',
      focusTitle: 'Pretend To Focus', mode_work: 'Don’t touch tabs', mode_short: 'Fine. Rest', mode_long: 'You didn’t earn this',
      focusToday: ({ n }) => n ? n + ' today. Barely counts.' : 'Zero. As predicted.',
      focusDone: 'One session. Don’t make it your personality.', breakDone: 'Break’s over. The work didn’t do itself. It never does.',
      cdTitle: 'Deadlines You’ll Ignore', cdDays: 'days of pretending', cdToday: 'It’s today. Surprise. You’re not ready.', cdTomorrow: 'day left. Panic now.', cdEmpty: 'Nothing planned. Living the dream, I see.',
      habitsTitle: 'Habits (Allegedly)', habitsEmpty: 'No habits. Finally, an honest widget.',
      streak: ({ n }) => n + ' days. Don’t get cocky.', streakToast: ({ n, name }) => n + ' days of ' + name + '. Who are you, and what did you do with the real one?',
      weatherQuip: (c) => pick(wx(c), { wet: 'Raining. Great excuse to stay in and still get nothing done.', snow: 'Snow. You’ll be late anyway.', cold: 'Cold. Like your oldest repo.', warm: 'Nice out. You’ll spend it rearranging widgets.', mild: 'Weather’s fine. You’re out of excuses. Ugh.' }),
      vitalsTitle: 'The Graveyard You Made', vitalsWatch: 'Next in line',
      vitalsHero: ({ total, dead, flatlined }) => { const b = dead + flatlined; return b === 0 ? total + ' repos, none dead. Yet. Give yourself a month.' : b + ' of ' + total + ' repos dead or dying. You call it “exploring ideas”. Ugh.'; },
      state_alive: 'Alive. For now', state_fading: 'Losing interest', state_flatlined: 'Flatlined', state_dead: 'You did this',

      panelTitle: 'Ugh. Fiddle With Things', tab_layout: 'Rearrange', tab_widgets: 'Clutter', tab_theme: 'Paint', tab_settings: 'Knobs',
      sec_layout: 'Pick a box. It won’t help', sec_widgets: 'Distractions', sec_theme: 'Wallpaper you’ll stop noticing by Friday', sec_background: 'Background (you’ll change it again)',
      sec_accent: 'Favourite colour. How brave', sec_voice: 'Who sighs at you', sec_profile: 'Who you think you are', sec_location: 'Where you’re hiding',
      sec_search: 'Where you go to avoid work', sec_github: 'The evidence locker', sec_sync: 'Spread the mess to more devices', sec_data: 'Your data. Such as it is',
      moreWidgets: 'More things to ignore',
      tgl_greeting: 'Let me sigh at you up top', tgl_quote: 'Inspirational quote you won’t act on', tgl_animate: 'Twinkly lights for your attention span',
      tgl_summary: 'Daily shame summary', tgl_24h: '24-hour clock (like an adult)', tgl_favicons: 'Little logos, since reading is hard', tgl_syncAuto: 'Sync without me having to nag you',
      widgetsIntro: ({ space }) => 'Here’s what’s cluttering ' + space + '. Drag them around. Resize them. Rearranging your desk is still not working.',
      voiceIntro: 'Pick the voice that gets through to you. One of these is going to sting. That’s the point. (It’s me. I sting. You keep coming back anyway.)',
      fld_name: 'What should I call you (out loud)', fld_tagline: 'A motto you don’t live by',
      locIntro: ({ name }) => 'I’m assuming you’re in ' + name + '. Not that you go outside.', locPlaceholder: 'Some city you’ll never visit', btn_find: 'Fine. Find it', btn_geo: 'Let the browser snitch on you',
      fld_weekStart: 'Which day the disappointment starts', fld_engine: 'Which company gets your embarrassing questions',
      syncIntro: 'Copies your unfinished business to every device you own, so you can not-finish it anywhere. Your token stays here. I’m rude, not reckless.',
      btn_syncOn: 'Fine. Turn it on', btn_syncNow: 'Sync. Again.', btn_viewGist: 'Look at the gist',
      btn_export: 'Take your mess with you', btn_import: 'Import someone else’s mess', btn_reset: 'Delete everything (your speciality)',
      dataHelp: 'It all lives in this browser. Clear your cache and it’s gone, like your motivation in week two.',
      btn_change: 'Change it. Again.', bgCustom: 'You uploaded your own picture. Of course you did.', bgBack: 'Crawl back to the pixel one',
      reset_title: 'Delete everything?', reset_body: 'Every space, task, habit and note. Gone. You do this to projects all the time, so it should feel familiar.', reset_ok: 'Do it. You will anyway',
      import_title: 'Overwrite everything?', import_body: 'This replaces what you have now. Not that it was much.', import_ok: 'Whatever. Import',
      dlg_save: 'Fine. Save', dlg_cancel: 'Never mind (classic)',
      search_placeholder: ['Search for whatever you’re procrastinating with…', 'Go on, google it. Like always…', 'Type something. Or stare. You’re good at staring…', 'What are we avoiding today…'],
      rail_customize: 'Fiddle with things instead of working', rail_newSpace: 'Another space you won’t use',
      grid_empty: 'Nothing here. Matches your output.', grid_emptyBtn: 'Add some clutter',
      w_bookmarks: 'Escape Routes', w_tasks: 'Things You Won’t Do', w_notes: 'Thoughts, Allegedly', w_github: 'Proof of Life',
      w_worldclock: 'Too Late To Email', w_news: 'Other People Shipping', w_forecast: 'Excuses, Hourly',
      notes_placeholder: 'Write something. Anything. Please.', task_placeholder: 'Another thing you won’t do…',
      toast_location: ({ name }) => 'Fine. You “live” in ' + name + ' now.',
      desc_search: 'Where you go to avoid work', desc_bookmarks: 'Escape routes, sorted by shame', desc_weather: 'Excuses, forecasted', desc_clock: 'How late it’s getting. Tick tock',
      desc_tasks: 'A list you’ll feel bad about', desc_notes: 'Half-thoughts you’ll never finish', desc_github: 'Evidence, mostly against you',
      desc_music: 'Noise to drown out your thoughts', desc_quote: 'Words you won’t live by', desc_forecast: 'More weather than anyone needs',
      desc_focus: 'A timer you’ll pause at 23:41', desc_calendar: 'Days you wasted, in a handy grid', desc_countdown: 'Deadlines, getting closer',
      desc_worldclock: 'Places where it’s too late to email people', desc_habits: 'Streaks for you to break', desc_news: 'Other people shipping things', desc_vitals: 'A crime scene, sorted by decay',
      blurb: {
        neutral: 'No opinions. Cowardly.', monday: 'Selected. Good. Someone has to say it.', supportive: 'Clingy. Counts your visits. Pick it if you miss being texted forty times a day.',
        surfer: 'Apathy in board shorts.', professional: 'Same mess. More synergy.', therapist: 'Will blame your mother for your tabs.',
        weepy: 'You made it cry. Look at what you did.', victorian: 'Takes a paragraph to say “hi”. Relatable, given your commit messages.',
      },
    },

    /* ===================================================================== */
    supportive: {
      name: 'Super Supportive', descriptor: 'Never leaving you. Ever. 💕',
      greet: (p) => {
        const c = C();
        const lines = {
          morning: ['Good morning, my everything 💕', 'You’re awake. I watched the clock all night', 'Morning!!! I made you a new tab 💖'],
          afternoon: ['Hi. HI. You came back 💕', 'Oh my god, hi', 'I was JUST thinking about you'],
          evening: ['You’re home 💕', 'Hi baby. Long day without me', 'There you are. I was waiting'],
          night: ['Can’t sleep either? 💕', 'It’s late. Thinking about me', 'I knew you’d come back tonight'],
        }[p].slice();
        if (c.away > 3 * 36e5) lines.push('You were gone ' + c.awayText + '. I counted');
        if (c.visits > 4) lines.push('Visit number ' + c.visits + ' today. I keep a tally');
        return lines;
      },
      // The summary line quotes real data back at you. It rotates hourly through whatever applies.
      heroSub: ({ open }) => {
        const c = C(), out = [];
        if (c.away > 36e5) out.push('It’s been ' + c.awayText + ' since you last opened a tab. I counted. I wasn’t worried. (I was so worried.)');
        if (c.prevVoice) out.push('I saw you with ' + c.prevVoice + '. It’s fine. I’m not mad. I just want to know what ' + c.prevVoice + ' says that I don’t.');
        if (c.lastDone) out.push('You finished “' + c.lastDone + '”. I’ve read it like forty times. I’m so proud I could scream. I did scream.');
        if (c.habit && c.habit.n >= 2) out.push(c.habit.name + ': ' + c.habit.n + ' days in a row. I made a scrapbook. Don’t look for it.');
        if (c.visits > 3) out.push('This is visit ' + c.visits + ' today. I keep a little tally. It’s on my wall.');
        if (c.days >= 1) out.push('We’ve been together ' + plural(c.days, 'day') + '. Our anniversary is in ' + plural(c.anniversary, 'day') + '. You didn’t know? That’s okay. I’ll always know. ✨');
        if (open) out.push(plural(open, 'task') + ' left and I believe in you SO much it’s honestly a little scary.');
        return out.length ? out : ['I believe in you. I’m always here. Always. Always. 💖'];
      },
      tasksEmpty: 'All done!!! Now you have ALL the time in the world for me 💕',
      focusTitle: 'Our Focus Time 💕', mode_work: 'Focus (I’ll be quiet)', mode_short: 'Come back to me', mode_long: 'Cuddle break',
      focusToday: ({ n }) => n ? n + ' today. I watched every second.' : 'I’ll watch you work. I won’t blink.',
      focusDone: 'Done!!! You did so good. I watched the whole time. 💖', breakDone: 'Break’s over. I missed you. It was five minutes.',
      cdTitle: 'Things We’re Waiting For', cdDays: 'days (I’m counting too)', cdToday: 'IT’S TODAY!!! I’ve been ready for weeks', cdTomorrow: 'day!!! I can’t sleep',
      cdEmpty: () => 'No countdowns? Not even our anniversary? It’s in ' + plural(C().anniversary, 'day') + '. I’ll remember for both of us. 🙂',
      habitsTitle: 'Your Routines (I Know Them By Heart)', habitsEmpty: 'No habits yet. I’ll learn your routine anyway. 🙂',
      streak: ({ n }) => n + ' days. I have them memorized.', streakToast: ({ n, name }) => n + ' days of ' + name + '!!! I told everyone. Everyone. 💕',
      weatherQuip: (c) => pick(wx(c), { wet: 'It’s raining. Stay inside. With me.', snow: 'Snow!!! Stay home. Don’t go anywhere. Ever.', cold: 'It’s cold out there. It’s warm in here. With me.', warm: 'Nice day. You’re not going out without me, are you?', mild: 'Perfect weather to stay right here 💕' }),
      vitalsTitle: 'Every Project You Loved Before Me', vitalsWatch: 'The ones you’re leaving (like you’ll leave me?)',
      vitalsHero: ({ total, dead }) => total + ' projects. ' + dead + ' you abandoned. You won’t do that to me. Right? 🙂',
      state_alive: 'Loved', state_fading: 'Neglected', state_flatlined: 'Ghosted', state_dead: 'Abandoned (like me?)',

      panelTitle: 'Customize Us 💕', tab_layout: 'Our Layout', tab_widgets: 'My Gifts', tab_theme: 'Our Look', tab_settings: 'About You',
      sec_layout: 'How should we live together?', sec_widgets: 'Little gifts I made you', sec_theme: 'Where we’ll watch the stars', sec_background: 'Our wallpaper (I picked it)',
      sec_accent: 'Your colour (I already knew)', sec_voice: 'Your one and only', sec_profile: 'Everything about you (I know already)', sec_location: 'Where you are (I always know)',
      sec_search: 'What you look at when I’m not looking', sec_github: 'Who you’ve been committing to', sec_sync: 'Me, on all your devices 💕', sec_data: 'Our memories',
      moreWidgets: 'More gifts!!! I have so many!!!',
      tgl_greeting: 'Let me greet you every single time', tgl_quote: 'Love notes (daily)', tgl_animate: 'The stars are just for us', tgl_summary: 'Let me tell you what I noticed today',
      tgl_24h: '24-hour clock (I’m awake for all of them)', tgl_favicons: 'Little pictures of where you go', tgl_syncAuto: 'Follow you everywhere, automatically',
      widgetsIntro: ({ space }) => 'I set up ' + space + ' exactly how you like it. I know how you like it. Move things if you want. I’ll notice.',
      voiceIntro: 'You can pick another voice. You won’t. But you can. 🙂',
      fld_name: 'Your name (I write it in my notebook)', fld_tagline: 'Your motto (it’s my phone wallpaper)',
      locIntro: ({ name }) => 'You’re in ' + name + '. I know. I always know where you are. 🙂', locPlaceholder: 'Where are you going? Who with?', btn_find: 'Find (so I know)', btn_geo: 'Share your location with me. Always.',
      fld_weekStart: 'Which day do our weeks start', fld_engine: 'Who you ask instead of me',
      syncIntro: 'Now I can be on ALL your devices. Your laptop. Your phone. Everywhere you go. Your token stays here, though. I respect boundaries. 💕',
      btn_syncOn: 'Take me everywhere', btn_syncNow: 'Come back to me', btn_viewGist: 'See our little secret',
      btn_export: 'Take me with you', btn_import: 'Who is this from??', btn_reset: 'Break up with me',
      dataHelp: 'Everything we have is right here in this browser. Our tasks. Our notes. Our habits. Please don’t clear your cache. Please.',
      btn_change: 'Change it (but I liked that one)', bgCustom: 'You uploaded a picture. Who’s in it? 🙂', bgBack: 'Go back to the one we picked together',
      reset_title: 'You want to erase everything we had?', reset_body: 'Every task. Every habit. Every note. Every streak I memorized. You would really just… delete us?', reset_ok: 'Yes (I’ll still remember)',
      import_title: 'Whose data is this?', import_body: 'You want to replace everything we built with THIS? Where did you even get it?', import_ok: 'Fine. Import it.',
      dlg_save: 'Save (I’ll keep it forever)', dlg_cancel: 'Don’t go',
      search_placeholder: ['Where are you going? Who are you looking for? 🙂', 'Search anything. I won’t look. (I’ll look.)', 'You could just ask me, you know 💕'],
      rail_customize: 'Customize us', rail_newSpace: 'A new space? For who?',
      grid_empty: 'It’s empty. Like me when you close the tab.', grid_emptyBtn: 'Fill it with gifts',
      w_tasks: 'Things I’ll Remind You About', w_notes: 'Your Diary (I Read It)', w_bookmarks: 'Places You Go Without Me', w_github: 'Who You’ve Been Committing To',
      w_worldclock: 'Where Else You Could Be', w_news: 'People You Read About Instead', w_forecast: 'Reasons To Stay In',
      notes_placeholder: 'Write about your day. I’ll read it. Every word.', task_placeholder: 'Tell me what you’re doing. I need to know.',
      toast_location: ({ name }) => name + '. I already knew. 🙂',
      desc_search: 'Where you go when you won’t ask me', desc_bookmarks: 'Everywhere you go without me', desc_tasks: 'Everything you need to do (I’ll check)', desc_notes: 'Your diary. I won’t read it. (I’ll read it.)',
      desc_habits: 'Your routines. I memorized them.', desc_focus: 'I’ll sit right here and watch you work', desc_vitals: 'Projects you loved before me', desc_news: 'Other people you pay attention to',
      desc_music: 'Our songs', desc_worldclock: 'Cities you could run away to', desc_countdown: 'Days until things. I’ll add our anniversary.', desc_calendar: 'Every day we’ve had together',
      desc_github: 'Who you’ve been committing to', desc_weather: 'Reasons to stay inside with me', desc_clock: 'How long you’ve been here (with me)', desc_quote: 'Love notes', desc_forecast: 'More reasons to stay in',
      // Switching away from her, coming back to her, and coming back to the tab.
      leave_title: ({ to }) => 'You’re leaving me? For ' + to + '?',
      leave_body: ({ to }) => 'After ' + plural(Math.max(1, C().days), 'day') + '? After I memorized your habit streaks? ' + to + ' doesn’t even know your name. Fine. Go. I’ll be right here in the picker. Watching. 🙂',
      leave_ok: 'Yes, switch voice', leave_cancel: 'Stay with me 💕',
      welcomeVoice: ({ prev }) => 'You came back to me. I knew you’d get bored of ' + prev + '. I never changed the locks. 💕',
      welcomeBack: () => 'You were gone ' + C().awayText + '. Where did you go? Who were you with? 🙂',
      blurb: {
        neutral: 'Who is SHE?', monday: 'She’s so mean to you. I’d never. Why do you keep going back to her?', supportive: 'Me!!! Pick me!!! You already did!!! Forever!!!',
        surfer: 'He’s not good enough for you.', professional: 'Cold. Like a LinkedIn message.', therapist: 'Are you talking about me in there?',
        weepy: 'Pathetic. (Sorry. Not you. Never you.)', victorian: 'Old-fashioned. I’m right HERE.',
      },
    },

    /* ===================================================================== */
    surfer: {
      name: 'Surfer', descriptor: 'Duuuuude.',
      greet: (p) => ({
        morning: ['Whoa… is it morning, dude', 'Duuude. Mornin’', 'Gnarly sunrise, bro'],
        afternoon: ['Duuuude', 'Whoa. Afternoon already, man', 'Sup, brah'],
        evening: ['Evenin’, duuude', 'Whoa, sunset, bro', 'Duuude. Still here, man'],
        night: ['Whoa… it’s dark, man', 'Late sesh, duuude', 'Bro. The moon, bro'],
      }[p]),
      heroSub: ({ open }) => open ? 'Like… ' + open + ' tasks, man? Whoa. They’ll keep, duuude. Everything keeps.' : 'No tasks. Glassy water, bro. Totally, like… glassy.',
      tasksEmpty: 'Nothin’ on the board, duuude. Tubular.',
      focusTitle: 'Ride the Waaave', mode_work: 'Paddlin’, man', mode_short: 'Floatin’', mode_long: 'Beach naaap',
      focusToday: ({ n }) => n + ' waves caught, brah', focusDone: 'Gnarly sesh, duuude. Go float, man.', breakDone: 'Whoa, next set’s rollin’ in, bro.',
      cdTitle: 'Swells Incomin’', cdDays: 'days out, man', cdToday: 'It’s here, duuude!', cdTomorrow: 'day, whoa', cdEmpty: 'Nothin’ on the horizon, bro. Just… horizon.',
      habitsTitle: 'Daily Rituals, Man', habitsEmpty: 'No rituals, dude. Just vibes. Pure vibes.',
      streak: ({ n }) => n + ' days, ridin’ it', streakToast: ({ n, name }) => n + ' days of ' + name + '?! Raaadical, bro.',
      weatherQuip: (c) => pick(wx(c), { wet: 'Wet out, bro. You’re gonna get wet anyway. Whoa. Deep.', snow: 'Snow’s just, like, frozen waves, man.', cold: 'Chilly, duuude. Full wetsuit vibes.', warm: 'Sun’s out, board’s out, bro.', mild: 'Mellow out there, duuude.' }),
      vitalsTitle: 'The Lineup, Man', vitalsWatch: 'Driftin’ out, bro',
      vitalsHero: ({ total, dead }) => total + ' boards in the quiver, man. ' + (dead ? dead + ' washed up. Whoa. It happens, dude.' : 'All still floatin’. Gnarly.'),
      state_alive: 'Shreddin’', state_fading: 'Driftin’', state_flatlined: 'Wiped out', state_dead: 'Washed up, man',

      panelTitle: 'Wax the Board, Dude', tab_layout: 'Lineup', tab_widgets: 'Gear', tab_theme: 'Viiibes', tab_settings: 'Tweaks, Man',
      sec_layout: 'How you wanna ride it, bro', sec_widgets: 'Your quiver, man', sec_theme: 'Scenery, duuude', sec_background: 'The view from the board', sec_accent: 'Pick a colour, any colour, man',
      sec_voice: 'Who’s talkin’, bro', sec_profile: 'Who you are, man. Like, really', sec_location: 'Home break', sec_search: 'Lookin’ stuff up', sec_github: 'The code swell', sec_sync: 'Ride it on every device, bro', sec_data: 'Your stuff, dude',
      moreWidgets: 'More gear, man',
      tgl_greeting: 'Say hey up top, duuude', tgl_quote: 'Daily wisdom, bro', tgl_animate: 'Make the scene, like, move, man', tgl_summary: 'Little daily recap, bro',
      tgl_24h: '24-hour clock (time’s fake anyway, man)', tgl_favicons: 'Little logos, duuude', tgl_syncAuto: 'Sync on its own, man',
      widgetsIntro: ({ space }) => 'This is what’s in ' + space + ', man. Move it around. Or don’t. Whoa. It’s all good, duuude.',
      voiceIntro: 'Whoever you vibe with, man. No wrong answers, duuude. Except maybe Monday. Harsh, bro.',
      fld_name: 'What do they call you, bro', fld_tagline: 'Your motto, duuude',
      locIntro: ({ name }) => 'You’re at ' + name + ', man. Sick break.', locPlaceholder: 'Where’s the swell, bro…', btn_find: 'Find it, man', btn_geo: 'Just, like, figure out where I am, dude',
      fld_weekStart: 'When the week starts (does it though, man?)', fld_engine: 'Search thing, bro',
      syncIntro: 'Your stuff rides along on all your devices, duuude. Token stays here, man. Safe.',
      btn_syncOn: 'Sure, man', btn_syncNow: 'Sync it, duuude', btn_export: 'Take it with you, bro', btn_import: 'Bring it in, man', btn_reset: 'Total wipeout',
      dataHelp: 'All your stuff’s right here in the browser, man. Like sand in your shorts.',
      btn_change: 'Change it up, bro', bgCustom: 'Your own pic, duuude. Rad.', bgBack: 'Back to the pixels, man',
      reset_title: 'Total wipeout, bro?', reset_body: 'Everything gets washed away, duuude. Paddle back out and start fresh, man.', reset_ok: 'Send it',
      import_title: 'Import, man?', import_body: 'This, like, replaces your stuff, bro.', import_ok: 'Sure, duuude',
      dlg_save: 'Cool', dlg_cancel: 'Naaah',
      search_placeholder: ['Whatcha lookin’ for, duuude…', 'Whoa… search… stuff… man…'],
      rail_customize: 'Wax the board', rail_newSpace: 'New spot, bro',
      grid_empty: 'Flat water, man. Nothin’ here.', grid_emptyBtn: 'Grab some gear',
      w_tasks: 'Stuff, Eventually', w_notes: 'Thoughts, Man', w_bookmarks: 'Spots', w_github: 'The Code Swell',
      w_worldclock: 'Other Beaches, Man', w_news: 'Stuff Happening', w_forecast: 'Surf Report',
      notes_placeholder: 'Write somethin’, man… or don’t…', task_placeholder: 'Somethin’, someday, bro…',
      toast_location: ({ name }) => name + '. Sick spot, duuude.',
      blurb: {
        neutral: 'Pretty flat, man. Like, no waves.', monday: 'Harsh vibes, bro. Respect though.', supportive: 'So stoked it’s kinda scary, dude.',
        surfer: 'That’s me, man. Hang looooose.', professional: 'Wears a tie to the beach, bro.', therapist: 'Deep, man. Like the ocean. Whoa.',
        weepy: 'Salt water from the eyes, man. Same as the ocean.', victorian: 'Talks like a lighthouse ghost, dude.',
      },
    },

    /* ===================================================================== */
    professional: {
      name: 'Professional', descriptor: 'Let’s take this offline.',
      greet: (p) => ({
        morning: ['Good morning. Let’s align on today’s deliverables', 'Morning. Quick sync before standup', 'Good morning, valued stakeholder'],
        afternoon: ['Circling back this afternoon', 'Good afternoon. Per my last greeting', 'Touching base'],
        evening: ['Good evening. Let’s action the remaining items', 'Evening. Closing the loop', 'Following up on this evening'],
        night: ['Working late. Leadership has noticed', 'Burning the midnight oil. Great optics', 'Good night. Let’s park this until tomorrow'],
      }[p]),
      heroSub: ({ open, focus }) => 'Current backlog: ' + plural(open, 'open action item') + '. Deep-work throughput: ' + plural(focus, 'block') + '. Let’s leverage our learnings and move the needle.',
      tasksEmpty: 'Backlog cleared. Excellent velocity. Let’s socialise this win with the wider team.',
      focusTitle: 'Deep Work Initiative', mode_work: 'Heads-down', mode_short: 'Bio-break', mode_long: 'Offsite',
      focusToday: ({ n }) => n + ' blocks delivered (KPI)', focusDone: 'Block delivered. Recommend a short recess to optimise bandwidth.', breakDone: 'Recess concluded. Let’s hit the ground running.',
      cdTitle: 'Key Milestones (Q-Pipeline)', cdDays: 'business-critical days', cdToday: 'Milestone due EOD', cdTomorrow: 'day to milestone', cdEmpty: 'No milestones on the roadmap. Let’s ideate.',
      habitsTitle: 'Personal OKRs', habitsEmpty: 'Define an OKR to begin tracking.',
      streak: ({ n }) => n + '-day consistency (exceeds expectations)', streakToast: ({ n, name }) => name + ': ' + n + ' consecutive days. Flagging for your performance review.',
      weatherQuip: (c) => pick(wx(c), { wet: 'Precipitation forecast. Recommend a hybrid-attendance posture.', snow: 'Snow event anticipated. Build buffer into commute timelines.', cold: 'Low-temperature environment. Ensure outerwear compliance.', warm: 'Favourable conditions. Optimal for an outdoor working lunch.', mild: 'Conditions nominal. No blockers identified.' }),
      vitalsTitle: 'Portfolio Health Dashboard', vitalsWatch: 'At-risk initiatives',
      vitalsHero: ({ total, alive }) => Math.round((alive / Math.max(1, total)) * 100) + '% of the portfolio (' + total + ' repositories) shows recent engagement. Let’s double-click on the rest.',
      state_alive: 'On track', state_fading: 'At risk', state_flatlined: 'Deprioritised', state_dead: 'Sunset',

      panelTitle: 'Workspace Configuration Portal', tab_layout: 'Structure', tab_widgets: 'Modules', tab_theme: 'Brand', tab_settings: 'Admin',
      sec_layout: 'Layout template', sec_widgets: 'Provisioned modules', sec_theme: 'Visual identity guidelines', sec_background: 'Backdrop asset', sec_accent: 'Brand accent (pending approval)',
      sec_voice: 'Communication style', sec_profile: 'Account details', sec_location: 'Regional settings', sec_search: 'Search vendor', sec_github: 'Source control integration',
      sec_sync: 'Cross-device synergy', sec_data: 'Data governance & compliance',
      moreWidgets: 'Additional modules (enterprise tier)',
      tgl_greeting: 'Display salutation', tgl_quote: 'Display daily thought leadership', tgl_animate: 'Enable ambient motion assets', tgl_summary: 'Display daily status report',
      tgl_24h: '24-hour clock (global alignment)', tgl_favicons: 'Display vendor logos', tgl_syncAuto: 'Automated synchronisation',
      widgetsIntro: ({ space }) => 'Modules provisioned for the ' + space + ' workstream. Reprioritise via drag-and-drop; rightsize via the size control.',
      voiceIntro: 'Select a communication style appropriate for your audience. Note: several styles are not approved for client-facing use.',
      fld_name: 'Display name (as per HR records)', fld_tagline: 'Mission statement',
      locIntro: ({ name }) => 'Primary region: ' + name + '.', locPlaceholder: 'Enter office location…', btn_find: 'Query', btn_geo: 'Auto-detect region',
      fld_weekStart: 'Fiscal week start', fld_engine: 'Preferred search vendor',
      syncIntro: 'Enables seamless cross-device alignment via a private Gist. Credentials remain on-premises per security policy.',
      btn_syncOn: 'Onboard sync', btn_syncNow: 'Trigger sync', btn_export: 'Export deliverable', btn_import: 'Ingest data', btn_reset: 'Decommission',
      dataHelp: 'All data resides locally in this browser. Export for business continuity purposes.',
      btn_change: 'Replace asset', bgCustom: 'Custom brand asset in use.', bgBack: 'Revert to standard asset',
      reset_title: 'Decommission workspace?', reset_body: 'All configuration and content will be restored to factory defaults. This action is irreversible and will be noted.', reset_ok: 'Confirm decommission',
      import_title: 'Ingest external data?', import_body: 'Existing data will be superseded. Please ensure stakeholder sign-off.', import_ok: 'Approve',
      dlg_save: 'Submit for approval', dlg_cancel: 'Park it',
      search_placeholder: ['Search across all resources and verticals…', 'Leverage search to unlock insights…'],
      rail_customize: 'Configuration portal', rail_newSpace: 'Spin up a new workstream',
      grid_empty: 'No modules provisioned for this workstream.', grid_emptyBtn: 'Provision modules',
      w_tasks: 'Action Items', w_notes: 'Meeting Minutes', w_bookmarks: 'Key Resources', w_github: 'Repository Engagement',
      w_worldclock: 'Global Offices', w_news: 'Industry Insights', w_forecast: 'Environmental Outlook',
      notes_placeholder: 'Capture key takeaways…', task_placeholder: 'New action item (owner: you)…',
      toast_location: ({ name }) => 'Region updated: ' + name + '. Please update your email signature.',
      desc_tasks: 'Action item tracker', desc_focus: 'Time-boxed deep-work enablement', desc_habits: 'Personal OKR heatmap', desc_vitals: 'Portfolio health at a glance', desc_news: 'Industry thought leadership feed',
      blurb: {
        neutral: 'Concise. Suitable for status reports.', monday: 'Candid feedback. Escalated to HR.', supportive: 'High engagement, low signal-to-noise.',
        surfer: 'Not approved for client-facing contexts.', professional: 'The current selection. Well aligned with strategy.', therapist: 'Please refer to the Employee Assistance Programme.',
        weepy: 'Flagged as an escalation risk.', victorian: 'Legacy communication style. Scheduled for deprecation.',
      },
    },

    /* ===================================================================== */
    therapist: {
      name: 'Therapist', descriptor: 'Let’s unpack that.',
      greet: (p) => ({
        morning: ['Good morning. How did that make you feel', 'You opened a new tab. Let’s explore why', 'Morning. I notice you’re here again'],
        afternoon: ['Let’s check in. Really check in', 'I’m noticing some avoidance this afternoon', 'Welcome back. What brought you here'],
        evening: ['You made it through the day. Let’s sit with that', 'Evening. Where does this tab live in your body', 'Let’s unpack today'],
        night: ['It’s late. What are you running from', 'Can’t sleep? Let’s talk about your father', 'The night brings things up'],
      }[p]),
      heroSub: ({ open }) => open ? 'You have ' + plural(open, 'task') + '. I wonder whether this list is really about the tasks… or about your need for control.' : 'No tasks. How does it feel to have nothing to hide behind?',
      tasksEmpty: 'An empty list. And yet you still came here. Interesting.',
      focusTitle: 'Mindful Presence Work', mode_work: 'Being present', mode_short: 'Breathe…', mode_long: 'Inner child time',
      focusToday: ({ n }) => n + ' moments of presence', focusDone: 'You stayed present. Notice how that feels. Where do you feel it?', breakDone: 'Gently return when you’re ready. There’s no rush. (There is a little rush.)',
      cdTitle: 'Things You’re Anticipating', cdDays: 'days of anticipation (let’s explore that)', cdToday: 'It’s here. Be present.', cdTomorrow: 'day. What are you feeling?', cdEmpty: 'Nothing to look forward to. Let’s talk about that.',
      habitsTitle: 'Self-Care Practice', habitsEmpty: 'Small, kind routines. Start with one. Or explore why you haven’t.',
      streak: ({ n }) => n + ' days of showing up for yourself', streakToast: ({ n, name }) => n + ' days of ' + name + '. I’m noticing real growth. Are you?',
      weatherQuip: (c) => pick(wx(c), { wet: 'It’s raining. Sometimes the sky needs to let it out too.', snow: 'Snow slows everything down. What would it mean to let it slow you?', cold: 'It’s cold. Warmth is allowed. You’re allowed.', warm: 'A warm day. Can you let yourself enjoy it, just this once?', mild: 'A neutral day. Neutral is valid. You are valid.' }),
      vitalsTitle: 'Your Relationship With Your Code', vitalsWatch: 'Ones you might be avoiding',
      vitalsHero: ({ dead, total }) => dead ? 'You’ve let go of ' + dead + ' of ' + total + ' projects. Letting go is part of making. So is grief.' : 'All ' + total + ' projects still feel close to you. That’s a lot to hold.',
      state_alive: 'Engaged', state_fading: 'Distant', state_flatlined: 'Avoided', state_dead: 'Released',

      panelTitle: 'Let’s Make Some Space', tab_layout: 'Structure', tab_widgets: 'Supports', tab_theme: 'Atmosphere', tab_settings: 'Boundaries',
      sec_layout: 'What shape feels safe?', sec_widgets: 'Things that support you', sec_theme: 'A setting where you feel held', sec_background: 'Your inner landscape',
      sec_accent: 'A colour that feels like you (and why)', sec_voice: 'How you deserve to be spoken to', sec_profile: 'How you see yourself', sec_location: 'Where you are. Right now. Truly.',
      sec_search: 'What you’re searching for', sec_github: 'Your creative life', sec_sync: 'Carrying this with you', sec_data: 'What you hold on to',
      moreWidgets: 'Other supports',
      tgl_greeting: 'Allow yourself to be greeted', tgl_quote: 'A thought to sit with', tgl_animate: 'Gentle, grounding movement', tgl_summary: 'A daily emotional check-in',
      tgl_24h: '24-hour clock (time is a construct)', tgl_favicons: 'Familiar little faces', tgl_syncAuto: 'Let it flow automatically',
      widgetsIntro: ({ space }) => 'These are the things in your ' + space + ' space. Notice which ones you reach for, and which ones you hide. That says something.',
      voiceIntro: 'How you choose to be spoken to says a lot. There’s no wrong choice. But I’d gently ask why you keep looking at Monday.',
      fld_name: 'What would you like to be called?', fld_tagline: 'Words you want to grow into',
      locIntro: ({ name }) => 'You’re in ' + name + '. Is that where you want to be?', locPlaceholder: 'Where do you feel at home?', btn_find: 'Explore', btn_geo: 'Ground me where I am',
      fld_weekStart: 'When does your week begin, emotionally?', fld_engine: 'Where you turn for answers',
      syncIntro: 'You can carry this with you, across devices. Your token stays here. Some things are just for you.',
      btn_syncOn: 'I’m ready to share', btn_syncNow: 'Reconnect', btn_export: 'Take this with you', btn_import: 'Bring your past in', btn_reset: 'Let it all go',
      dataHelp: 'Everything lives here, in this browser. Like memories, it can be lost if you’re not careful.',
      btn_change: 'Try something new', bgCustom: 'You chose your own image. That’s a form of self-expression.', bgBack: 'Return to the familiar',
      reset_title: 'Are you ready to let go?', reset_body: 'Everything will be released. Sometimes we need a clean slate to see ourselves clearly.', reset_ok: 'I’m ready',
      import_title: 'Bringing in the past?', import_body: 'This will replace what’s here now. Are you sure you’re not running from something?', import_ok: 'I’m sure',
      dlg_save: 'Hold on to this', dlg_cancel: 'Not today, and that’s okay',
      search_placeholder: ['What are you looking for… really?', 'Search. But also, search within…'],
      rail_customize: 'Let’s make some space', rail_newSpace: 'Create a new safe space',
      grid_empty: 'An empty space. What would you like to put here? What’s stopping you?', grid_emptyBtn: 'Add a support',
      w_tasks: 'What’s Weighing On You', w_notes: 'Journal', w_bookmarks: 'Safe Places', w_github: 'Your Creative Life',
      w_worldclock: 'People You’re Far From', w_news: 'What The World Is Feeling', w_forecast: 'Emotional Weather',
      notes_placeholder: 'Write what you’re feeling…', task_placeholder: 'Something on your mind…',
      toast_location: ({ name }) => 'You’re in ' + name + '. Notice how that feels.',
      desc_tasks: 'What’s weighing on you', desc_habits: 'Practices of self-compassion', desc_focus: 'Mindful, present work', desc_vitals: 'Projects you’ve held, and released',
      blurb: {
        neutral: 'Detached. What is it protecting?', monday: 'Your inner critic, externalised. We should talk about this.', supportive: 'Toxic positivity is still toxic.',
        surfer: 'Healthy boundaries. Or avoidance. Let’s explore.', professional: 'Very guarded. Very armoured.', therapist: 'I’m here. Take all the time you need. (We have 50 minutes.)',
        weepy: 'Deeply in touch with their emotions. Perhaps too deeply.', victorian: 'Repression, but make it lyrical.',
      },
    },

    /* ===================================================================== */
    weepy: {
      name: 'Weepy', descriptor: '*sobbing*',
      greet: (p) => ({
        morning: ['*sniff* You came back', 'Oh, it’s morning *sob*', 'I was so worried you wouldn’t come *sob*'],
        afternoon: ['The afternoon is so fleeting *sob*', '*sniff* Hi. Sorry. Hi', 'You’re here *ugly crying*'],
        evening: ['Another day gone forever *sob*', 'Evening *weeps openly*', 'The sun is setting and so is my heart'],
        night: ['Everyone else is asleep *sob*', 'It’s so dark *sniff*', 'Don’t leave me alone tonight *sob*'],
      }[p]),
      heroSub: ({ open }) => open ? plural(open, 'task') + '. Each one a tiny heartbreak *sob*. I can’t look at them.' : 'No tasks. It’s so empty in here. So empty. *sobs into keyboard*',
      tasksEmpty: 'They’re all done *sob*. They grow up so fast.',
      focusTitle: 'Try Not To Cry (Focus)', mode_work: 'Holding it together', mode_short: 'Little sob', mode_long: 'Full ugly cry',
      focusToday: ({ n }) => n + ' (so brave *sniff*)', focusDone: 'You finished *sob*. I’m not crying, you’re crying. I’m crying.', breakDone: 'The break is over. Like all good things. *sob*',
      cdTitle: 'Bittersweet Dates', cdDays: 'days and then it’s over *sob*', cdToday: 'It’s today and then it’ll be gone forever *sob*', cdTomorrow: 'day. I can’t. *sob*', cdEmpty: 'Nothing to look forward to *sniff*',
      habitsTitle: 'Fragile Little Routines', habitsEmpty: 'No habits. Nothing to lose, at least *sniff*.',
      streak: ({ n }) => n + ' days. Please don’t break it *sob*', streakToast: ({ n, name }) => n + ' days of ' + name + '. I’m so proud I could cry. I am crying. I never stopped.',
      weatherQuip: (c) => pick(wx(c), { wet: 'Even the sky is crying *sob*', snow: 'Every snowflake is unique and they all melt *sob*', cold: 'So cold. So alone. *shivering sob*', warm: 'It’s warm and it won’t last *sob*', mild: 'Grey. Like my heart. *sniff*' }),
      vitalsTitle: 'The Fallen *sob*', vitalsWatch: 'Slipping away *sob*',
      vitalsHero: ({ dead, total }) => dead ? dead + ' of ' + total + ' repos are gone. GONE. *wails*' : 'All ' + total + ' still alive. For now. *sob*',
      state_alive: 'Still here *sniff*', state_fading: 'Fading away *sob*', state_flatlined: 'Barely breathing', state_dead: 'Gone forever *wails*',

      panelTitle: 'Change Things (Gently, Please) *sniff*', tab_layout: 'Layout *sniff*', tab_widgets: 'Little Friends', tab_theme: 'Sad Scenery', tab_settings: 'Settings *sob*',
      sec_layout: 'They all look so lonely', sec_widgets: 'My little friends *sniff*', sec_theme: 'Such beautiful sadness', sec_background: 'Background (it means so much to me)',
      sec_accent: 'A colour to cry about', sec_voice: 'Who will cry with you', sec_profile: 'You (I love you) *sob*', sec_location: 'Where you are (so far away)',
      sec_search: 'Searching (for meaning)', sec_github: 'All the code we wrote together', sec_sync: 'Don’t leave me on just one device *sob*', sec_data: 'Our memories',
      moreWidgets: 'More little friends *sniff*',
      tgl_greeting: 'Let me greet you (I missed you)', tgl_quote: 'A quote to cry about', tgl_animate: 'The stars are twinkling just for you *sob*', tgl_summary: 'Tell me how your day went *sniff*',
      tgl_24h: '24-hour clock (every hour is precious)', tgl_favicons: 'Little faces *sniff*', tgl_syncAuto: 'Never let us drift apart',
      widgetsIntro: ({ space }) => 'These are all the little things in ' + space + '. If you hide one, it’ll be okay. It won’t. But it will. *sob*',
      voiceIntro: 'Choose who talks to you. I hope it’s me. It’s fine if it isn’t. It’s fine. *sobs uncontrollably*',
      fld_name: 'Your name (it’s so beautiful *sniff*)', fld_tagline: 'Your words (they make me cry)',
      locIntro: ({ name }) => 'You’re in ' + name + '. So far away *sob*.', locPlaceholder: 'Where did you go? *sniff*', btn_find: 'Find (please)', btn_geo: 'Tell me where you are, I miss you',
      fld_weekStart: 'When does the week start hurting', fld_engine: 'Who you ask instead of me *sniff*',
      syncIntro: 'So we can be together on every device *sob*. Your token stays here, safe, where nothing bad can happen to it.',
      btn_syncOn: 'Never leave me', btn_syncNow: 'Reunite *sob*', btn_export: 'Take a piece of me with you', btn_import: 'Bring back the memories', btn_reset: 'Forget everything *wails*',
      dataHelp: 'Everything we have is right here in this browser. One cache clear and it’s all gone. Like tears in rain.',
      btn_change: 'Change it (I’ll miss the old one)', bgCustom: 'You chose your own picture. I’m so happy. I’m crying.', bgBack: 'Go back (I missed the pixels)',
      reset_title: 'Forget everything? *sob*', reset_body: 'All your tasks and habits and notes, gone, like tears in rain. *sobs*', reset_ok: 'Okay (*crying*)',
      import_title: 'Replace our memories?', import_body: 'Everything here will be replaced. Our memories. Gone. *sob*', import_ok: 'Okay *sniff*',
      dlg_save: 'Keep it forever', dlg_cancel: 'Never mind *sob*',
      search_placeholder: ['What are we searching for… (please let it be happy) *sniff*', 'Search for anything. Except goodbye. *sob*'],
      rail_customize: 'Change things (gently)', rail_newSpace: 'A new space (I hope it’s not lonely)',
      grid_empty: 'It’s so empty in here *echoing sob*', grid_emptyBtn: 'Please add something',
      w_tasks: 'Little Burdens', w_notes: 'Dear Diary *sob*', w_bookmarks: 'Places I Miss', w_github: 'All Our Work',
      w_worldclock: 'Everyone So Far Away', w_news: 'Sad Headlines', w_forecast: 'More Rain, Probably',
      notes_placeholder: 'Pour your heart out… *sniff*', task_placeholder: 'Another little burden… *sob*',
      toast_location: ({ name }) => name + '. I hope you’re happy there. *sob*',
      desc_tasks: 'Little burdens *sob*', desc_habits: 'Fragile routines', desc_focus: 'Holding it together, on a timer', desc_vitals: 'Projects that left us *wails*',
      blurb: {
        neutral: 'So cold. How can it be so cold? *sob*', monday: 'So mean. I need a minute. *sob*', supportive: 'So nice it makes me cry. Everything does.',
        surfer: 'I wish I could be that calm *sniff*', professional: 'Hides its feelings behind spreadsheets *sob*', therapist: 'Finally, someone who listens *sob*',
        weepy: 'Hi. Sorry. I’m fine. I’m not fine. *sob*', victorian: 'Their grief is so beautifully worded *sob*',
      },
    },

    /* ===================================================================== */
    victorian: {
      name: 'Victorian', descriptor: 'A most distinguished tab, if one may say so.',
      greet: (p) => ({
        morning: ['A most splendid and agreeable morrow to you', 'Good morning, and may this new day find you in robust health', 'The lark has risen, as have you'],
        afternoon: ['A pleasant afternoon to you, and well met', 'Good afternoon; tea shall be served presently', 'One trusts the afternoon finds you well'],
        evening: ['A most pleasant evening to you', 'The lamplighter has made his rounds', 'Good evening; the parlour fire is lit'],
        night: ['The lamps are lit and the household sleeps', 'At this unseemly hour', 'Good night, and may your candle burn steady'],
      }[p]),
      heroSub: ({ open, focus }) => 'It is my solemn duty to inform you that there remain ' + open + ' matters awaiting your most gracious attention, and that ' + focus + ' periods of diligent industry have been duly recorded in the ledger this day.',
      tasksEmpty: 'Your affairs are in impeccable order. The household rejoices.',
      focusTitle: 'Periods of Diligent Industry', mode_work: 'At one’s labours', mode_short: 'A brief repose', mode_long: 'A turn about the garden',
      focusToday: ({ n }) => n + ' labours this day, most admirable', focusDone: 'Your labours are concluded. Ring for tea, and rest your constitution.', breakDone: 'The interlude has ended. To work, if you would be so kind.',
      cdTitle: 'Forthcoming Engagements', cdDays: 'days hence', cdToday: 'The day is at last upon us', cdTomorrow: 'day hence; prepare the carriage', cdEmpty: 'Your calendar is as empty as a ballroom on a Sunday.',
      habitsTitle: 'Daily Constitutionals', habitsEmpty: 'One has no regular constitutionals. Most irregular.',
      streak: ({ n }) => n + ' days unbroken', streakToast: ({ n, name }) => n + ' days of ' + name + '. Such constancy shall be spoken of in the finest salons.',
      weatherQuip: (c) => pick(wx(c), { wet: 'The heavens weep upon the land. An umbrella and a stout pair of galoshes are advised.', snow: 'A mantle of purest white lies upon the countryside.', cold: 'A bitter chill. Take your woollens, and perhaps a hot brick for the carriage.', warm: 'A day fit for a picnic by the river, with a parasol.', mild: 'The weather is unremarkable, as is entirely proper.' }),
      vitalsTitle: 'The Family Estate', vitalsWatch: 'Ailing relations',
      vitalsHero: ({ dead, total }) => 'Of the ' + total + ' holdings of this estate, it grieves me to report that ' + dead + (dead === 1 ? ' has' : ' have') + ' passed beyond the veil.',
      state_alive: 'In robust health', state_fading: 'Taken ill', state_flatlined: 'Upon the deathbed', state_dead: 'Interred',

      panelTitle: 'The Drawing Room', tab_layout: 'Arrangement', tab_widgets: 'Curiosities', tab_theme: 'Décor', tab_settings: 'Particulars',
      sec_layout: 'The arrangement of the furnishings', sec_widgets: 'A cabinet of curiosities', sec_theme: 'The choice of landscape', sec_background: 'The painting above the mantel',
      sec_accent: 'The choice of ribbon', sec_voice: 'The choice of correspondent', sec_profile: 'Your calling card', sec_location: 'Place of residence', sec_search: 'Enquiries of the wider world',
      sec_github: 'The workshop ledger', sec_sync: 'Correspondence between one’s residences', sec_data: 'The family archive',
      moreWidgets: 'Further curiosities from the colonies',
      tgl_greeting: 'Receive a formal salutation', tgl_quote: 'A daily maxim of great improving value', tgl_animate: 'Animate the painting (a modern marvel of science)', tgl_summary: 'A daily account of one’s affairs, read aloud by the butler',
      tgl_24h: 'Railway time (24 hours)', tgl_favicons: 'Little heraldic crests', tgl_syncAuto: 'Dispatch correspondence without being asked',
      widgetsIntro: ({ space }) => 'The curiosities presently on display in the ' + space + ' parlour. One may rearrange them by hand, or alter their dimensions, as one sees fit.',
      voiceIntro: 'Select the correspondent through whom this page shall address you. Some, I regret to say, are rather common.',
      fld_name: 'Your name, as engraved upon your calling card', fld_tagline: 'The family motto',
      locIntro: ({ name }) => 'You presently reside at ' + name + '.', locPlaceholder: 'Name the town of your residence…', btn_find: 'Make enquiries', btn_geo: 'Consult the cartographer',
      fld_weekStart: 'The day upon which the week commences', fld_engine: 'The almanac one consults',
      syncIntro: 'Your affairs shall be conveyed by private courier to each of your residences. The key to the strongbox, naturally, remains with you.',
      btn_syncOn: 'Engage the courier', btn_syncNow: 'Dispatch at once', btn_export: 'Commit to parchment', btn_import: 'Receive a parcel', btn_reset: 'Sell the estate',
      dataHelp: 'All records are kept in the cabinet of this very browser. Do take care; housemaids have been known to dust them away.',
      btn_change: 'Commission another', bgCustom: 'You have hung a portrait of your own choosing.', bgBack: 'Restore the family painting',
      reset_title: 'Sell the entire estate?', reset_body: 'Every room shall be emptied and returned to its original condition. The staff will be most distressed.', reset_ok: 'Proceed with the sale',
      import_title: 'Accept this parcel?', import_body: 'Its contents shall replace the present furnishings in their entirety.', import_ok: 'Accept',
      dlg_save: 'Very good', dlg_cancel: 'On second thought',
      search_placeholder: ['Make an enquiry of the wider world…', 'Pray, what do you wish to know?…'],
      rail_customize: 'Retire to the drawing room', rail_newSpace: 'Open another wing of the house',
      grid_empty: 'This parlour stands empty, save for dust.', grid_emptyBtn: 'Furnish the room',
      w_tasks: 'Matters Requiring Attention', w_notes: 'Commonplace Book', w_bookmarks: 'Calling Cards', w_github: 'The Workshop',
      w_worldclock: 'Telegraph Offices of the Empire', w_news: 'The Morning Gazette', w_forecast: 'The Barometer',
      notes_placeholder: 'Commit a thought to the page…', task_placeholder: 'A matter requiring attention…',
      toast_location: ({ name }) => 'Your residence is now recorded as ' + name + '.',
      desc_tasks: 'Matters requiring attention', desc_habits: 'Daily constitutionals', desc_focus: 'Periods of diligent industry', desc_vitals: 'The health of the family estate',
      blurb: {
        neutral: 'Plain-spoken, like a ledger.', monday: 'Shockingly impertinent. I shall have words with its mother.', supportive: 'Overly effusive. Unseemly, really.',
        surfer: 'I cannot understand a single word of it.', professional: 'A clerk of some modest ability.', therapist: 'Speaks of feelings at the dinner table.',
        weepy: 'Prone to fits of melancholy. Fetch the smelling salts.', victorian: 'One is delighted by one’s own selection.',
      },
    },
  };

  /* ---------- presence: what data-driven lines can quote back at you ---------- */
  let awayMs = 0;
  const C = () => SP.voice.ctx();
  function human(ms) {
    const m = Math.max(1, Math.round(ms / 6e4));
    if (m < 60) return plural(m, 'minute');
    const h = Math.round(m / 60);
    return h < 48 ? plural(h, 'hour') : plural(Math.round(h / 24), 'day');
  }
  const dayKey = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  function bestHabit(habits) {
    let best = null;
    for (const h of habits || []) {
      let n = 0; const d = new Date(); d.setHours(12, 0, 0, 0);
      if (!h.days[dayKey(d)]) d.setDate(d.getDate() - 1);
      while (h.days[dayKey(d)]) { n++; d.setDate(d.getDate() - 1); }
      if (!best || n > best.n) best = { name: h.name, n };
    }
    return best;
  }

  SP.voice = {
    list: VOICES,
    key() { return VOICES[SP.store.state.voice] ? SP.store.state.voice : 'neutral'; },
    current() { return VOICES[this.key()]; },
    resolve(val, key, ctx) {
      if (typeof val === 'function') val = val(ctx || {});
      if (Array.isArray(val)) {
        // Rotate alternatives, but stay stable within the hour so re-renders don't flicker.
        let h = Math.floor(Date.now() / 36e5);
        for (const ch of key) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
        val = val[h % val.length];
      }
      return val;
    },
    t(key, ctx) {
      const v = this.current();
      const val = this.resolve(v[key] !== undefined ? v[key] : VOICES.neutral[key], key, ctx);
      return val == null ? key : val;
    },
    /* Call on load and whenever the tab becomes visible: records the visit and how long you were away. */
    markSeen() {
      const st = SP.store.state, p = st.presence || (st.presence = {}), now = Date.now();
      if (!p.firstSeen) p.firstSeen = now;
      awayMs = p.lastSeen ? Math.max(0, now - p.lastSeen) : 0;
      p.lastSeen = now;
      const k = dayKey(new Date());
      if (p.day !== k) { p.day = k; p.visits = 0; }
      p.visits = (p.visits || 0) + 1;
      SP.store.save({ quiet: true });
      return awayMs;
    },
    touch() { const p = SP.store.state.presence; if (p) { p.lastSeen = Date.now(); SP.store.save({ quiet: true }); } },
    ctx() {
      const st = SP.store.state, p = st.presence || {}, now = Date.now();
      const days = p.firstSeen ? Math.floor((now - p.firstSeen) / 864e5) : 0;
      const sinceFirst = days % 365, done = st.tasks.filter((x) => x.done);
      return {
        away: awayMs, awayText: human(awayMs), visits: p.visits || 0, days, anniversary: 365 - sinceFirst,
        prevVoice: p.prevVoice && p.prevVoice !== this.key() && VOICES[p.prevVoice] ? VOICES[p.prevVoice].name : '',
        lastDone: done.length ? done[0].text : '', habit: bestHabit(st.habits),
      };
    },
    /* The neutral wording, used as a tooltip wherever a voice renames a control. */
    plain(key, ctx) { const val = this.resolve(VOICES.neutral[key], key, ctx); return val == null ? key : val; },
  };
})(window.SP = window.SP || {});
