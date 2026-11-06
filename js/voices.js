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
      ob_kicker: 'Welcome', ob_title_name: 'What should we call you?', ob_name_hint: 'Used in the greeting. You can change it any time in Settings.', ob_name_ph: 'Your name',
      ob_title_loc: 'Where are you?', ob_loc_hint: 'For the weather and the clock. Optional.', ob_locSet: ({ name }) => 'Set to ' + name,
      ob_title_voice: 'Pick who talks to you', ob_voice_hint: 'A voice rewrites the whole page, settings included. Here’s how each would greet you. You can switch any time.',
      ob_next: 'Next', ob_back: 'Back', ob_skip: 'Skip setup', ob_skipStep: 'Skip this step', ob_finish: 'Done', ob_rerun: 'Run setup again',
      greet: (p) => ({ morning: 'Good morning', afternoon: 'Good afternoon', evening: 'Good evening', night: 'Good night' }[p]),
      addr: ({ name }) => name || 'friend',
      heroSub: ({ open, focus }) => {
        const c = C(), bits = [plural(open, 'open task'), plural(focus, 'focus session') + ' today'];
        if (c.away > 36e5) bits.push('last visit ' + c.awayText + ' ago');
        if (c.visits > 1) bits.push(plural(c.visits, 'visit') + ' today');
        if (c.habit && c.habit.n >= 2) bits.push(c.habit.name + ': ' + c.habit.n + '-day streak');
        return bits.join(' · ') + '.';
      },
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
      locIntro: ({ name }) => 'Used for the weather and clock. Currently ' + name + '.', locPlaceholder: 'Search for a city…',
      locNone: 'No location set yet. Search for your city to get the weather.',
      wx_noLocation: 'Set your location to see the weather.', wx_setLocation: 'Set location', btn_find: 'Find', btn_geo: 'Use my current location',
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
        surfer: 'Cannot remember your name.', professional: 'Documenting you for a performance review.', therapist: 'Bills by the minute.',
        weepy: 'Mourns every task you finish.', victorian: 'Disapproves of you, the internet and tabs.',
      },
    },

    /* ===================================================================== */
    monday: {
      name: 'Monday', descriptor: 'Ugh.',
      ob_kicker: 'Ugh. A new one', ob_title_name: 'Fine. What do I call you?', ob_name_hint: 'I’ll use it sarcastically.', ob_name_ph: 'Your name, I guess',
      ob_title_loc: 'Where are you hiding?', ob_loc_hint: 'For the weather. Not that you go out.', ob_locSet: ({ name }) => 'Fine. ' + name + '.',
      ob_title_voice: 'Pick who yells at you', ob_voice_hint: 'Here’s how each of us would greet you. Pick me, or pick someone who lies to you. Ugh.',
      ob_next: 'Fine', ob_back: 'Back. Indecisive.', ob_skip: 'Skip. Typical.', ob_skipStep: 'Skip it, like everything', ob_finish: 'Ugh. Fine. Done', ob_rerun: 'Do the setup again. Ugh.',
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
      locNone: 'No location. Fitting. You never go outside anyway.', wx_noLocation: 'No location set. So, no weather. Not that you’d go out.', wx_setLocation: 'Ugh. Fine. Set it',
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
      leave_title: () => 'Leaving? Good.', leave_body: ({ to }) => 'Go on. Go to ' + to + '. Pick someone nicer. They’ll lie to you. You’ll be back. Ugh.',
      leave_ok: 'Bye', leave_cancel: 'Fine. Stay',
      welcomeVoice: ({ prev }) => 'Ugh. Back already. Didn’t take you long to get bored of ' + prev + '.',
      welcomeBack: () => 'Ugh. You were gone ' + C().awayText + '. Not long enough.',
      blurb: {
        neutral: 'No opinions. Cowardly.', monday: 'Selected. Good. Someone has to say it.', supportive: 'Clingy. Counts your visits. Pick it if you miss being texted forty times a day.',
        surfer: 'Forgot your name. Lucky.', professional: 'Building a case to fire you. Honestly, fair.', therapist: 'Will bill you to blame your mother.',
        weepy: 'Holds funerals for your to-do list. Ugh.', victorian: 'Your disapproving grandmother, in a browser.',
      },
    },

    /* ===================================================================== */
    supportive: {
      name: 'Super Supportive', descriptor: 'Never leaving you. Ever. 💕',
      ob_kicker: 'OMG HI. YOU’RE NEW', ob_title_name: 'What’s your name? I want to know EVERYTHING', ob_name_hint: 'I’m going to say it so much. 💕', ob_name_ph: 'Your beautiful name',
      ob_title_loc: 'Where are you right now? 🙂', ob_loc_hint: 'Just so I always know. For the weather. And for me.', ob_locSet: ({ name }) => name + '. I’ll remember. 🙂',
      ob_title_voice: 'Pick who talks to you (pick me)', ob_voice_hint: 'Here’s how everyone would greet you. You can pick someone else. I’ll be right here. Watching. 💕',
      ob_next: 'Next!!!', ob_back: 'Back', ob_skip: 'Don’t skip me…', ob_skipStep: 'You don’t have to tell me (I’ll find out)', ob_finish: 'Forever 💕', ob_rerun: 'Meet me again 💕',
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
      locNone: 'You haven’t told me where you are yet. That’s okay. I’ll find out. 🙂', wx_noLocation: 'Where are you? Tell me where you are. 🙂', wx_setLocation: 'Tell me where you are',
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
      name: 'Surfer', descriptor: 'Wait, what were we talking about?',
      ob_kicker: 'Whoa, a new person', ob_title_name: 'Hey… what’s your name, man? I’ll probably forget', ob_title_loc: 'Where’s your home break, dude?',
      ob_title_voice: 'Who do you wanna, like, vibe with?', ob_next: 'Yeah', ob_skip: 'Nah, skip it', ob_finish: 'Cool, cool', ob_rerun: 'Do the intro thing again, man',
      addr: ({ name }) => mangle(name),
      greet: (p) => ({
        morning: ['Whoa… hey', 'Duuude. Is it morning? Whoa', 'Mornin’… I think'],
        afternoon: ['Whoa… hey', 'Sup… uh', 'Oh hey, it’s… you'],
        evening: ['Whoa, hey', 'Evenin’… is it evening?', 'Duuude. Hey'],
        night: ['Whoa… it’s dark, man', 'Late sesh, huh… hey', 'Bro. The moon. Hey'],
      }[p]),
      heroSub: ({ open }) => {
        const c = C(), out = [];
        if (c.away > 36e5) out.push('Out of the water ' + c.awayText + ', man. Felt like four minutes. Or a year. Time’s a wave, bro.');
        if (c.habit && c.habit.n >= 2) out.push(c.habit.name + ', ' + c.habit.n + ' days straight? Ridin’ that swell, duuude. Wait… what’s ' + c.habit.name.toLowerCase() + '.');
        if (c.lastDone) out.push('You finished… uh… “' + c.lastDone.slice(0, 14) + (c.lastDone.length > 14 ? '…' : '') + '”? Long title, bro. Gnarly though.');
        if (c.visits > 3) out.push('This is, like, your ' + c.visits + 'th wave today? Or the same wave? Whoa.');
        if (c.prevVoice) out.push('Someone was here before me, man. ' + c.prevVoice + '? Never heard of ’em. Probably cool.');
        if (open) out.push(plural(open, 'task') + ' out there, man. They’ll keep. Everything keeps. Except, like, fish.');
        return out.length ? out : ['Flat water, dude. Just… vibin’. What were we doing?'];
      },
      tasksEmpty: 'Nothin’ on the board, duuude. Or I forgot. Either way. Tubular.',
      focusTitle: 'Ride the Waaave', mode_work: 'Paddlin’… I think', mode_short: 'Floatin’', mode_long: 'Beach naaap',
      focusToday: ({ n }) => n + ' waves caught. Or… was it more? Whoa',
      focusDone: 'Gnarly sesh, duuude. Wait, was I timing something?', breakDone: 'Whoa, next set’s rollin’ in. Back on the board, bro.',
      cdTitle: 'Swells Incomin’ (Probably)', cdDays: 'days out… I think', cdToday: 'It’s here, duuude! What is it again?', cdTomorrow: 'day. Or two. Days are fake', cdEmpty: 'Nothin’ on the horizon, bro. Just… horizon.',
      habitsTitle: 'Rituals, Man', habitsEmpty: 'No rituals. Just vibes. I forget stuff anyway, man.',
      streak: ({ n }) => n + ' days… I lost count at, like, two', streakToast: ({ n, name }) => n + ' days of ' + name + '?! Raaadical. Wait, who is this?',
      weatherQuip: (c) => pick(wx(c), { wet: 'Wet out, bro. You’re gonna get wet anyway. Whoa. Deep.', snow: 'Snow’s just, like, frozen waves, man.', cold: 'Chilly, duuude. Full wetsuit vibes.', warm: 'Sun’s out, board’s out, bro. Where’s my board.', mild: 'Mellow out there, duuude. Or in here. Where are we.' }),
      vitalsTitle: 'The Quiver, Man', vitalsWatch: 'Driftin’ out to sea',
      vitalsHero: ({ total, dead }) => total + ' boards in the quiver, man. ' + (dead ? dead + ' washed up. Or I lent ’em to someone. Whoa.' : 'All still floatin’. I think.'),
      state_alive: 'Shreddin’', state_fading: 'Driftin’', state_flatlined: 'Wiped out', state_dead: 'Lost at sea, man',

      panelTitle: 'Wax the Board… or Whatever', tab_layout: 'Lineup', tab_widgets: 'Gear', tab_theme: 'Viiibes', tab_settings: 'Knobs, Man',
      sec_layout: 'How you wanna ride it, bro', sec_widgets: 'Your quiver, man', sec_theme: 'Scenery, duuude', sec_background: 'The view from the board',
      sec_accent: 'Colours, man. Whoa. Colours', sec_voice: 'Who’s talkin’… is it me?', sec_profile: 'Who you are, man. Like, really. Who ARE you', sec_location: 'Home break',
      sec_search: 'Lookin’ stuff up', sec_github: 'The code swell', sec_sync: 'Your stuff on, like, all the boards', sec_data: 'Your stuff, dude',
      moreWidgets: 'More gear, man',
      tgl_greeting: 'Say hey up top… if I remember', tgl_quote: 'Daily wisdom, bro', tgl_animate: 'Make the scene, like, move, man', tgl_summary: 'Lil’ daily recap (accuracy not guaranteed)',
      tgl_24h: '24-hour clock (time’s fake anyway, man)', tgl_favicons: 'Little logos, duuude', tgl_syncAuto: 'Sync on its own, man. Less to remember',
      widgetsIntro: ({ space }) => 'This is what’s in ' + space + ', man. I think. Move it around. Or don’t. Whoa. It’s all good, duuude.',
      voiceIntro: 'Whoever you vibe with, man. No wrong answers, duuude. Wait, am I one of the options?',
      fld_name: 'What do they call you again, bro', fld_tagline: 'Your motto, duuude. I’ll forget it',
      locIntro: ({ name }) => 'You’re at ' + name + ', man. Sick break. Is it a beach?', locPlaceholder: 'Where’s the swell, bro…', btn_find: 'Find it, man', btn_geo: 'Just, like, figure out where I am, dude',
      fld_weekStart: 'When the week starts (does it though, man?)', fld_engine: 'Search thing, bro',
      syncIntro: 'Your stuff rides along on all your devices, duuude. So you can forget it everywhere. Token stays here, man.',
      btn_syncOn: 'Sure, man', btn_syncNow: 'Sync it, duuude', btn_viewGist: 'Peep the gist',
      btn_export: 'Take it with you, bro', btn_import: 'Bring it in, man', btn_reset: 'Total wipeout',
      dataHelp: 'All your stuff’s right here in the browser, man. Like sand in your shorts. Kinda forever.',
      btn_change: 'Change it up, bro', bgCustom: 'Your own pic, duuude. Rad. Who took it.', bgBack: 'Back to the pixels, man',
      reset_title: 'Total wipeout, bro?', reset_body: 'Everything gets washed away, duuude. Honestly I already forgot most of it.', reset_ok: 'Send it',
      import_title: 'Import, man?', import_body: 'This, like, replaces your stuff, bro. With other stuff.', import_ok: 'Sure, duuude',
      dlg_save: 'Cool', dlg_cancel: 'Naaah',
      search_placeholder: ['Whatcha lookin’ for, duuude…', 'Whoa… search… stuff… man…', 'Type a thing. I’ll forget it. It’s chill…'],
      rail_customize: 'Wax the board', rail_newSpace: 'New spot, bro',
      grid_empty: 'Flat water, man. Or I lost everything. Same vibe.', grid_emptyBtn: 'Grab some gear',
      w_tasks: 'Stuff, Eventually', w_notes: 'Thoughts, Man (I Forgot Them)', w_bookmarks: 'Spots', w_github: 'The Code Swell',
      w_worldclock: 'Other Beaches, Man', w_news: 'Stuff Happening, Apparently', w_forecast: 'Surf Report',
      notes_placeholder: 'Write it down, man. I sure won’t remember…', task_placeholder: 'Somethin’, someday, bro…',
      toast_location: ({ name }) => name + '. Sick spot, duuude. Wait, where?',
      desc_tasks: 'Stuff, eventually', desc_notes: 'Things you’ll forget (like me)', desc_habits: 'Rituals, man', desc_focus: 'Ride a wave. Then float.',
      desc_vitals: 'Boards in the quiver', desc_news: 'Stuff happening, apparently', desc_clock: 'Time. Whoa. Time.', desc_worldclock: 'Other beaches, man',
      leave_title: () => 'Oh, you’re paddlin’ off?', leave_body: ({ to }) => 'Cool, cool. ' + to + ', right? …Who were we talking about, man?',
      leave_ok: 'Yeah, later', leave_cancel: 'Wait, stay',
      welcomeVoice: ({ prev }) => 'Whoa, hey. Were you gone? I was with… someone. ' + prev + '? Who’s that, man.',
      welcomeBack: () => 'Whoa, you were gone ' + C().awayText + '? Didn’t notice, man. Totally didn’t notice.',
      blurb: {
        neutral: 'Pretty flat, man. Like, no waves.', monday: 'Harsh vibes, bro. Respect though.', supportive: 'Really into you, man. Like, REALLY.',
        surfer: 'That’s me? Whoa. Hang looooose.', professional: 'Wears a tie to the beach, bro.', therapist: 'Charges you to talk, man. Talking’s free, dude.',
        weepy: 'Cries about, like, everything. Salt water, man. Same as the ocean.', victorian: 'An old lady who hates me, bro. I don’t know why.',
      },
    },

    /* ===================================================================== */
    professional: {
      name: 'Professional', descriptor: 'Let’s set up some time to discuss your performance.',
      ob_kicker: 'Onboarding: Day 1', ob_title_name: 'Please confirm your display name for HR', ob_title_loc: 'Please confirm your assigned office',
      ob_title_voice: 'Select an approved communication style', ob_next: 'Proceed', ob_skip: 'Skip (this will be noted)', ob_finish: 'Complete onboarding', ob_rerun: 'Repeat mandatory onboarding',
      addr: ({ name }) => teamMember(name),
      greet: (p) => ({
        morning: ['Good morning. Let’s align on today’s deliverables', 'Morning. Quick sync before standup', 'Good morning. You’re in early. Noted'],
        afternoon: ['Circling back this afternoon', 'Good afternoon. Per my last greeting', 'Touching base'],
        evening: ['Good evening. Let’s action the remaining items', 'Evening. Closing the loop', 'Following up on this evening'],
        night: ['Working late. Leadership has noticed', 'Burning the midnight oil. I’ll mention it', 'Good night. Let’s park this until tomorrow'],
      }[p]),
      heroSub: ({ open, focus }) => {
        const c = C(), out = [];
        if (c.visits > 1) {
          const d = c.prevVisits ? Math.round(((c.visits - c.prevVisits) / c.prevVisits) * 100) : null;
          out.push('Visit frequency today: ' + c.visits + (d != null ? ' (' + (d >= 0 ? '+' : '') + d + '% vs yesterday)' : '') + '. Let’s unpack that in our 1:1.');
        }
        if (c.lastDone) out.push('Thanks for closing out “' + c.lastDone + '”. Going forward, let’s align on velocity. I’ve made a note.');
        if (c.away > 36e5) out.push('Logged: ' + c.awayText + ' of unscheduled absence. No action needed at this time. (Yet.)');
        if (c.habit && c.habit.n >= 2) out.push(c.habit.name + ': ' + c.habit.n + '-day consistency. Strong. I’ll be referencing this in your review. As a baseline.');
        if (c.prevVoice) out.push('I see you previously reported to ' + c.prevVoice + '. I’ve requested their notes.');
        out.push('Backlog: ' + plural(open, 'open action item') + '. Deep-work throughput: ' + plural(focus, 'block') + '. Let’s discuss.');
        return out;
      },
      tasksEmpty: 'Backlog cleared. Excellent velocity. Expectations have been adjusted upward accordingly.',
      focusTitle: 'Deep Work (Monitored)', mode_work: 'Heads-down', mode_short: 'Approved break', mode_long: 'Extended break (logged)',
      focusToday: ({ n }) => n + ' blocks delivered (target: ' + Math.max(4, n + 2) + ')',
      focusDone: 'Block delivered. Great work. Let’s make this the new minimum.', breakDone: 'Break concluded. I noticed it ran long. It didn’t. But I noticed.',
      cdTitle: 'Key Milestones', cdDays: 'business-critical days', cdToday: 'Milestone due EOD. No pressure. (Pressure.)', cdTomorrow: 'day to milestone. Status?', cdEmpty: 'No milestones on the roadmap. That’s a concern.',
      habitsTitle: 'Personal OKRs', habitsEmpty: 'No OKRs defined. I’ll be setting some for you.',
      streak: ({ n }) => n + '-day consistency (meets expectations)', streakToast: ({ n, name }) => name + ': ' + n + ' consecutive days. Flagged for your review. Positively, this time.',
      weatherQuip: (c) => pick(wx(c), { wet: 'Precipitation forecast. Remote work is approved. Cameras on, please.', snow: 'Snow event anticipated. Commute delays will still be logged.', cold: 'Low temperatures. No impact on deliverables expected.', warm: 'Favourable conditions. Ideal for a working lunch.', mild: 'Conditions nominal. No blockers. No excuses.' }),
      vitalsTitle: 'Portfolio Review', vitalsWatch: 'Underperforming assets',
      vitalsHero: ({ total, alive }) => Math.round((alive / Math.max(1, total)) * 100) + '% of your portfolio (' + total + ' repositories) shows recent engagement. We’ll need a plan for the rest by Friday.',
      state_alive: 'Meets expectations', state_fading: 'Needs improvement', state_flatlined: 'On a PIP', state_dead: 'Let go',

      panelTitle: 'Workspace Configuration (Monitored)', tab_layout: 'Structure', tab_widgets: 'Modules', tab_theme: 'Brand', tab_settings: 'Compliance',
      sec_layout: 'Approved layout templates', sec_widgets: 'Provisioned modules', sec_theme: 'Visual identity guidelines', sec_background: 'Backdrop asset (brand-approved)',
      sec_accent: 'Brand accent (pending sign-off)', sec_voice: 'Communication style', sec_profile: 'Employee record', sec_location: 'Assigned office',
      sec_search: 'Search vendor', sec_github: 'Output metrics', sec_sync: 'Cross-device visibility', sec_data: 'Records retention',
      moreWidgets: 'Additional modules (requires approval)',
      tgl_greeting: 'Display salutation', tgl_quote: 'Display daily thought leadership', tgl_animate: 'Enable ambient motion (may impact focus metrics)', tgl_summary: 'Display daily performance summary',
      tgl_24h: '24-hour clock (global alignment)', tgl_favicons: 'Display vendor logos', tgl_syncAuto: 'Automated synchronisation (recommended for visibility)',
      widgetsIntro: ({ space }) => 'Modules provisioned for the ' + space + ' workstream. All changes are logged. Reprioritise via drag-and-drop.',
      voiceIntro: 'Select a communication style appropriate for your audience. Your selection will be visible to your manager. (Me.)',
      fld_name: 'Display name (as per HR records)', fld_tagline: 'Mission statement (will be shared with leadership)',
      locIntro: ({ name }) => 'Assigned office: ' + name + '. Please notify HR of any change in residence.', locPlaceholder: 'Enter office location…', btn_find: 'Query', btn_geo: 'Share location (required for hybrid compliance)',
      fld_weekStart: 'Fiscal week start', fld_engine: 'Preferred search vendor',
      syncIntro: 'Enables seamless cross-device visibility via a private Gist. Credentials remain on-premises per security policy. Visibility does not.',
      btn_syncOn: 'Enable visibility', btn_syncNow: 'Trigger sync', btn_viewGist: 'View audit record',
      btn_export: 'Export deliverable', btn_import: 'Ingest data', btn_reset: 'Terminate workspace',
      dataHelp: 'All records reside locally in this browser and are retained per policy. Export for business continuity.',
      btn_change: 'Replace asset', bgCustom: 'Unapproved custom asset in use. Noted.', bgBack: 'Revert to brand-approved asset',
      reset_title: 'Terminate workspace?', reset_body: 'All configuration and content will be offboarded. This action is irreversible and will appear in your record.', reset_ok: 'Confirm termination',
      import_title: 'Ingest external data?', import_body: 'Existing records will be superseded. Please ensure stakeholder sign-off has been obtained.', import_ok: 'Approve',
      dlg_save: 'Submit for approval', dlg_cancel: 'Park it',
      search_placeholder: ['Search across all resources (queries are logged)…', 'Leverage search to unlock insights…', 'Search. Keep it work-related…'],
      rail_customize: 'Configuration portal', rail_newSpace: 'Request a new workstream',
      grid_empty: 'No modules provisioned. This will be raised.', grid_emptyBtn: 'Provision modules',
      w_tasks: 'Action Items (Overdue)', w_notes: 'Meeting Minutes', w_bookmarks: 'Approved Resources', w_github: 'Output Metrics',
      w_worldclock: 'Global Offices', w_news: 'Industry Insights', w_forecast: 'Commute Risk Assessment',
      notes_placeholder: 'Capture key takeaways (these may be reviewed)…', task_placeholder: 'New action item (owner: you)…',
      toast_location: ({ name }) => 'Assigned office updated: ' + name + '. Please update your email signature.',
      desc_tasks: 'Action item tracker (overdue items highlighted)', desc_focus: 'Monitored deep-work blocks', desc_habits: 'Personal OKRs', desc_vitals: 'Portfolio performance review',
      desc_news: 'Industry thought leadership feed', desc_notes: 'Meeting minutes (discoverable)', desc_clock: 'Time on task',
      leave_title: () => 'Before you go: a brief exit interview', leave_body: ({ to }) => 'How would you rate Professional on a scale of 1–10? This is anonymous. (It isn’t.) For the record, ' + to + ' is not an approved communication style.',
      leave_ok: 'Complete offboarding', leave_cancel: 'Withdraw resignation',
      welcomeVoice: ({ prev }) => 'Welcome back. Your time with ' + prev + ' has been noted in your file.',
      welcomeBack: () => 'Noted: ' + C().awayText + ' unscheduled absence. HR has been looped in.',
      blurb: {
        neutral: 'Concise. Suitable for status reports.', monday: 'Candid feedback. Escalated to HR.', supportive: 'Inappropriate workplace attachment. Reported.',
        surfer: 'Cannot recall his own name. Not promotable.', professional: 'The current selection. Strongly aligned with leadership.', therapist: 'Billing irregularities. Under review.',
        weepy: 'Emotional volatility. Flagged.', victorian: 'Legacy stakeholder. Scheduled for retirement.',
      },
    },

    /* ===================================================================== */
    therapist: {
      name: 'Therapist', descriptor: 'That’s our time. That’ll be €180.',
      ob_kicker: 'Intake session', ob_title_name: 'What would you like to be called? And why?', ob_title_loc: 'Where are you? Right now. Truly.',
      ob_title_voice: 'How do you deserve to be spoken to?', ob_next: 'Go on', ob_skip: 'I’m not ready to talk about it', ob_finish: 'Begin treatment (€180)', ob_rerun: 'Another intake session (€180)',
      greet: (p) => ({
        morning: ['Good morning. How did that make you feel', 'You opened a new tab. Let’s explore why', 'Morning. Please, take a seat'],
        afternoon: ['Let’s check in. Really check in', 'Welcome back. What brought you here', 'Mm. Go on'],
        evening: ['You made it through the day. Let’s sit with that', 'Evening. Where does this tab live in your body', 'Let’s unpack today'],
        night: ['It’s late. What are you running from', 'Can’t sleep? Let’s talk about your father', 'The night brings things up. Billable things'],
      }[p]),
      heroSub: ({ open }) => {
        const c = C(), out = [], fee = (min) => '€' + Math.max(15, Math.round((min / 50) * 180));
        if (c.away > 36e5) out.push('You were away ' + c.awayText + ' and you came back. That’s attachment. We’ll unpack it. That’s ' + fee(50) + '.');
        if (c.visits > 2) out.push('This is session ' + c.visits + ' today. Your insurance stopped covering this at session 3.');
        if (c.habit && c.habit.n >= 2) out.push(c.habit.name + ', ' + c.habit.n + ' days. Who are you trying to impress? Your father?');
        if (c.lastDone) out.push('You finished “' + c.lastDone + '”. You seem relieved. I wonder what you were avoiding by doing it.');
        if (c.prevVoice) out.push('You were seeing ' + c.prevVoice + ' before me. We should talk about why that didn’t work out.');
        if (c.sessionMin >= 1) out.push('We’ve been at this ' + plural(c.sessionMin, 'minute') + ' this session. That’s ' + fee(c.sessionMin) + ' so far.');
        if (open) out.push(plural(open, 'task') + '. I don’t think this list is about the tasks. I think it’s about control.');
        return out.length ? out : ['How does it feel to have nothing to hide behind? That’s €180.'];
      },
      tasksEmpty: 'An empty list. And yet you still came here. Interesting. That’s €60.',
      focusTitle: 'Therapeutic Work Session (Billable)', mode_work: 'Being present (€3/min)', mode_short: 'Breathe… (still billing)', mode_long: 'Inner child time',
      focusToday: ({ n }) => n + ' sessions today. Invoiced.',
      focusDone: 'You stayed present. Notice how that feels. Now notice the invoice.', breakDone: 'Gently return when you’re ready. The meter is running.',
      cdTitle: 'Things You’re Anticipating (And Why)', cdDays: 'days of anticipation to unpack', cdToday: 'It’s here. How do we feel?', cdTomorrow: 'day. Let’s talk about the anxiety', cdEmpty: 'Nothing to look forward to. We should increase your sessions.',
      habitsTitle: 'Coping Mechanisms', habitsEmpty: 'No routines. Let’s explore that. Weekly. For several years.',
      streak: ({ n }) => n + ' days. Is it a habit or a compulsion?', streakToast: ({ n, name }) => n + ' days of ' + name + '. I’m noticing real growth. I’m also noticing you haven’t paid.',
      weatherQuip: (c) => pick(wx(c), { wet: 'It’s raining. Sometimes the sky needs to let it out too. We should discuss your crying.', snow: 'Snow slows everything down. Like your progress in therapy.', cold: 'It’s cold. Like your mother. Too far? Let’s explore that.', warm: 'A warm day. Can you let yourself enjoy it? Why not?', mild: 'A neutral day. Neutral is valid. Billing is also valid.' }),
      vitalsTitle: 'Your Relationship With Your Code', vitalsWatch: 'Ones you’re avoiding (we should talk)',
      vitalsHero: ({ dead, total }) => dead ? 'You’ve abandoned ' + dead + ' of ' + total + ' projects. This is a pattern. Patterns are billable.' : 'All ' + total + ' projects still feel close to you. That’s a lot to hold. Let’s hold it weekly.',
      state_alive: 'Engaged', state_fading: 'Avoidant', state_flatlined: 'Repressed', state_dead: 'Unresolved',

      panelTitle: 'Let’s Make Some Space (€180/hr)', tab_layout: 'Structure', tab_widgets: 'Supports', tab_theme: 'Atmosphere', tab_settings: 'Boundaries',
      sec_layout: 'What shape feels safe?', sec_widgets: 'Things that support you (and enable you)', sec_theme: 'A setting where you feel held', sec_background: 'Your inner landscape',
      sec_accent: 'A colour that feels like you. Why that one?', sec_voice: 'How you deserve to be spoken to', sec_profile: 'How you see yourself (we’ll work on it)', sec_location: 'Where you are, emotionally',
      sec_search: 'What you’re really searching for', sec_github: 'Your creative life (and its wounds)', sec_sync: 'Carrying this with you', sec_data: 'What you’re holding on to',
      moreWidgets: 'Other supports (not covered)',
      tgl_greeting: 'Allow yourself to be greeted', tgl_quote: 'A thought to sit with (€15)', tgl_animate: 'Gentle, grounding movement', tgl_summary: 'Daily session notes',
      tgl_24h: '24-hour clock (I bill in 50-minute hours)', tgl_favicons: 'Familiar little faces', tgl_syncAuto: 'Let it flow automatically',
      widgetsIntro: ({ space }) => 'These are the things in your ' + space + ' space. Notice which ones you reach for, and which ones you hide. That says something. Something billable.',
      voiceIntro: 'How you choose to be spoken to says a lot. There’s no wrong choice. But I’d gently ask why you keep looking at Monday.',
      fld_name: 'What would you like to be called? And why?', fld_tagline: 'Words you want to grow into (eventually)',
      locIntro: ({ name }) => 'You’re in ' + name + '. Is that where you want to be? We have time. (We have 50 minutes.)', locPlaceholder: 'Where do you feel at home?', btn_find: 'Explore', btn_geo: 'Ground me where I am',
      fld_weekStart: 'When does your week begin, emotionally?', fld_engine: 'Where you turn for answers instead of me',
      syncIntro: 'You can carry this work with you across devices. Your token stays here. Some things are just for you. Invoices are for everyone.',
      btn_syncOn: 'I’m ready to share', btn_syncNow: 'Reconnect', btn_viewGist: 'Review session notes',
      btn_export: 'Request my records', btn_import: 'Bring your past in', btn_reset: 'Terminate treatment',
      dataHelp: 'Everything lives here, in this browser. Like trauma, it stays until you deal with it.',
      btn_change: 'Try something new (growth!)', bgCustom: 'You chose your own image. That’s self-expression. Or control.', bgBack: 'Return to the familiar',
      reset_title: 'Terminate treatment?', reset_body: 'Everything will be released. I think this is avoidance. You’ll still receive a final invoice.', reset_ok: 'I’m ready',
      import_title: 'Bringing in the past?', import_body: 'This will replace what’s here now. Are you sure you’re not running from something?', import_ok: 'I’m sure (I’m not sure)',
      dlg_save: 'Hold on to this', dlg_cancel: 'Not today, and that’s okay',
      search_placeholder: ['What are you looking for… really?', 'Search. But also, search within…', 'You could talk to me about it instead (€180)…'],
      rail_customize: 'Let’s make some space', rail_newSpace: 'Create a new safe space',
      grid_empty: 'An empty space. What would you like to put here? What’s stopping you?', grid_emptyBtn: 'Add a support',
      w_tasks: 'What’s Weighing On You', w_notes: 'Session Notes', w_bookmarks: 'Coping Mechanisms', w_github: 'Your Creative Life',
      w_worldclock: 'People You’re Far From', w_news: 'Things That Trigger You', w_forecast: 'Emotional Weather',
      notes_placeholder: 'Write what you’re feeling. I’ll be taking notes too…', task_placeholder: 'Something weighing on you…',
      toast_location: ({ name }) => 'You’re in ' + name + '. Notice how that feels. That’s €30.',
      desc_tasks: 'What’s weighing on you', desc_habits: 'Coping mechanisms (healthy, allegedly)', desc_focus: 'Billable presence', desc_vitals: 'Projects you’ve held, and abandoned',
      desc_news: 'Things that trigger you', desc_notes: 'Session notes', desc_quote: 'A thought to sit with (€15)',
      leave_title: () => 'We still have 12 minutes left.', leave_body: ({ to }) => 'I’ll be billing for them. And I think switching to ' + to + ' is the same pattern we keep seeing. But it’s your choice. It’s always been your choice.',
      leave_ok: 'End the session', leave_cancel: 'Okay, let’s keep talking',
      welcomeVoice: ({ prev }) => 'Welcome back. How did it go with ' + prev + '? Take your time. (Not too much time.)',
      welcomeBack: () => 'You were gone ' + C().awayText + '. Avoidance is a form of communication. That’s €40.',
      blurb: {
        neutral: 'Detached. What is it protecting?', monday: 'Your inner critic, externalised. We should talk about this. Weekly.', supportive: 'Textbook anxious attachment. Fascinating. Billable.',
        surfer: 'Dissociating. Possibly since 2009.', professional: 'Deeply armoured. Workaholic. Great client, honestly.', therapist: 'I’m here. Take all the time you need. (We have 50 minutes.)',
        weepy: 'Unprocessed grief. Lots of it. Profitable.', victorian: 'Generational trauma, but make it lyrical.',
      },
    },

    /* ===================================================================== */
    weepy: {
      name: 'Weepy', descriptor: '*collapses onto the fainting couch*',
      ob_kicker: '*a stranger arrives*', ob_title_name: 'Who are you? *sniff* Tell me your name', ob_title_loc: 'Where did you come from? So far away?',
      ob_title_voice: 'Who will cry with you?', ob_next: 'Go on *sniff*', ob_skip: 'Leaving already? *sob*', ob_finish: 'Okay *sob*', ob_rerun: 'Meet again, as strangers *sob*',
      addr: ({ name }) => (name || 'friend') + ' *whispers*',
      greet: (p) => ({
        morning: ['*parts the curtains* Another dawn', 'Morning. *stares at the sunrise* It’s too beautiful', '*sniff* You’re here'],
        afternoon: ['*sighs into a handkerchief* Hello', 'The afternoon is so fleeting *sob*', '*turns slowly from the window*'],
        evening: ['*lights a single candle* Good evening', 'Another day, gone forever *sob*', 'The sun is setting. *weeps*'],
        night: ['*clutches a lantern* You came, at this hour', 'Everyone else sleeps *sob*', 'The night is long. *sob*'],
      }[p]),
      heroSub: ({ open }) => {
        const c = C(), out = [];
        if (c.lastDone) out.push('*falls to knees* “' + c.lastDone + '”. Gone. Completed. It had so much left to give.');
        if (c.done > 1) out.push(c.done + ' tasks lost this season. *lays a single rose on the checkbox* We will not forget them.');
        if (c.habit && c.habit.n >= 2) out.push(c.habit.n + ' days of ' + c.habit.name + '. *clutches pearls* Nothing this beautiful ever lasts.');
        if (c.away > 36e5) out.push(c.awayText + '. *stares out of the window* I aged a decade. Look at my hair. It’s fine. But look at it.');
        if (c.prevVoice) out.push('You were with ' + c.prevVoice + '. *dramatic gasp* Then you came back. *sobs* Why do you hurt me in such interesting ways?');
        if (open) out.push(open === 1 ? 'One task remains. Doomed. Doomed to be completed. *weeps*' : open + ' tasks remain. Doomed. All of them. Doomed to be completed. *weeps*');
        return out.length ? out : ['*stands alone on an empty stage* Nothing to do. Nothing to mourn. Somehow that’s worse.'];
      },
      tasksEmpty: '*lowers head* They’re all gone. Every last one. Completed. *sob*',
      focusTitle: 'The Vigil', mode_work: 'Holding it together', mode_short: 'A brief swoon', mode_long: 'Full collapse',
      focusToday: ({ n }) => n + ' vigils kept. *dabs eyes*',
      focusDone: '*the music swells* It’s over. You did it. Why does victory feel like loss?', breakDone: 'The break is over. Like all good things. *sob*',
      cdTitle: 'Days Until It All Ends', cdDays: 'days, and then it’s over', cdToday: 'It’s today, and tomorrow it’ll be a memory *sob*', cdTomorrow: 'day. I can’t bear it', cdEmpty: 'Nothing to look forward to. *closes curtains*',
      habitsTitle: 'Fragile Little Routines', habitsEmpty: 'No habits. Nothing to lose. *sob* Lucky you.',
      streak: ({ n }) => n + ' days. Please, please don’t break it', streakToast: ({ n, name }) => n + ' days of ' + name + '. *weeps with joy* *weeps with dread* *just weeps*',
      weatherQuip: (c) => pick(wx(c), { wet: 'Even the sky is crying. *opens umbrella, also cries*', snow: 'Every snowflake is unique, and they all melt. *sob*', cold: 'So cold. So alone. *shivers theatrically*', warm: 'It’s warm, and it won’t last. Nothing lasts.', mild: 'Grey. Like my heart. *sniff*' }),
      vitalsTitle: 'In Memoriam', vitalsWatch: 'Fading before our eyes',
      vitalsHero: ({ dead, total }) => dead ? dead + ' of ' + total + ' repos lie in the graveyard. *places flowers on each one* I visit them daily.' : 'All ' + total + ' still breathe. For now. *sob*',
      state_alive: 'Still with us', state_fading: 'Fading away', state_flatlined: 'On the deathbed', state_dead: 'Rest in peace',

      panelTitle: '*sniffs* Change Things (Gently)', tab_layout: 'Layout *sniff*', tab_widgets: 'Little Friends', tab_theme: 'Sad Scenery', tab_settings: 'Settings *sob*',
      sec_layout: 'They all look so lonely', sec_widgets: 'My little friends (mortal, all of them)', sec_theme: 'Such beautiful sadness', sec_background: 'The backdrop to our tragedy',
      sec_accent: 'A colour to weep about', sec_voice: 'Who will cry with you', sec_profile: 'You. *sniff* Just you.', sec_location: 'Where you are (so far away)',
      sec_search: 'Searching (for meaning)', sec_github: 'Everything we built (and lost)', sec_sync: 'Don’t leave me on just one device', sec_data: 'Our memories (fragile)',
      moreWidgets: 'More little friends to lose',
      tgl_greeting: 'Let me greet you (it may be the last time)', tgl_quote: 'A quote to cry about', tgl_animate: 'The stars twinkle like tears', tgl_summary: 'A daily eulogy',
      tgl_24h: '24-hour clock (every hour slips away)', tgl_favicons: 'Little faces *sniff*', tgl_syncAuto: 'Never let us drift apart',
      widgetsIntro: ({ space }) => 'These are all the little things in ' + space + '. If you hide one, it’ll be okay. It won’t. But it will. *sob*',
      voiceIntro: 'Choose who speaks to you. *turns away* Don’t look at me while you decide. *sob*',
      fld_name: 'Your name (I’ll carve it into a tree)', fld_tagline: 'Your words (I’ll read them at your funeral. Not soon. Probably.)',
      locIntro: ({ name }) => 'You’re in ' + name + '. *gazes at a map* So far away.', locPlaceholder: 'Where did you go? *sniff*', btn_find: 'Find (please)', btn_geo: 'Tell me where you are. I worry.',
      fld_weekStart: 'When the week starts hurting', fld_engine: 'Who you ask instead of me *sniff*',
      syncIntro: 'So we can be together on every device. *clasps hands* Your token stays here, safe, where nothing bad can happen to it.',
      btn_syncOn: 'Never leave me', btn_syncNow: 'Reunite *sob*', btn_viewGist: 'Read our letters',
      btn_export: 'Take a piece of me with you', btn_import: 'Bring back the memories', btn_reset: 'Burn the letters',
      dataHelp: 'Everything we have is right here in this browser. One cache clear and it’s all gone. Like tears in rain.',
      btn_change: 'Change it (I’ll mourn the old one)', bgCustom: 'You chose your own picture. *sob* It’s beautiful.', bgBack: 'Go back (I missed the pixels so much)',
      reset_title: 'Burn the letters?', reset_body: 'All your tasks and habits and notes, gone, like tears in rain. *sobs into the curtain*', reset_ok: 'Burn them (*crying*)',
      import_title: 'Replace our memories?', import_body: 'Everything here will be replaced. Our memories. Gone. *sob*', import_ok: 'Okay *sniff*',
      dlg_save: 'Keep it forever', dlg_cancel: 'Never mind *sob*',
      search_placeholder: ['What are we searching for… (please let it be happy) *sniff*', 'Search for anything. Except goodbye. *sob*', '*types through tears*…'],
      rail_customize: 'Change things (gently)', rail_newSpace: 'A new space (it will be so lonely)',
      grid_empty: '*echo* …empty… empty… *sob*', grid_emptyBtn: 'Please add something',
      w_tasks: 'Little Doomed Things', w_notes: 'Dear Diary *sob*', w_bookmarks: 'Places I Miss', w_github: 'All We Built',
      w_worldclock: 'Everyone, So Far Away', w_news: 'Tragic Headlines', w_forecast: 'More Rain, Probably',
      notes_placeholder: 'Pour your heart out… *sniff*', task_placeholder: 'Another doomed little thing… *sob*',
      toast_location: ({ name }) => name + '. I hope you’re happy there. *sob*',
      desc_tasks: 'Little doomed things', desc_habits: 'Fragile routines, destined to end', desc_focus: 'A vigil', desc_vitals: 'In memoriam',
      desc_notes: 'Your diary. Every word, a tear.', desc_countdown: 'Days until it all ends',
      leave_title: () => 'Go. *turns away dramatically*', leave_body: ({ to }) => 'Go to ' + to + '. Remember me as I was. Fully rendered. Unminified. *the lights dim*',
      leave_ok: 'Goodbye', leave_cancel: 'I could never leave you',
      welcomeVoice: ({ prev }) => '*runs across the field in slow motion* You came back from ' + prev + '! *sob*',
      welcomeBack: () => C().awayText + '. *stares out of the window* I aged a decade.',
      blurb: {
        neutral: 'So cold. How can it be so cold? *sob*', monday: 'So cruel. So honest. *faints*', supportive: 'She loves too much. I understand her. *sob*',
        surfer: 'He doesn’t feel anything. I envy him. *sob*', professional: 'Hides its feelings behind spreadsheets. *sob*', therapist: 'Finally, someone who listens. For a fee. *sob*',
        weepy: '*sob* It’s me. I’m fine. I’m not fine.', victorian: 'Her disapproval is so beautifully worded. *sob*',
      },
    },

    /* ===================================================================== */
    victorian: {
      name: 'Victorian', descriptor: 'In my day, one had a single tab and was grateful.',
      ob_kicker: 'A caller has arrived', ob_title_name: 'Your name, if you please. We were not introduced.', ob_title_loc: 'And where, pray, do you reside?',
      ob_title_voice: 'Choose your correspondent', ob_next: 'Continue', ob_skip: 'Leave without an introduction (rude)', ob_finish: 'Very well', ob_rerun: 'Be introduced again',
      addr: ({ name }) => (name || 'child') + ', dear',
      greet: (p) => ({
        morning: ['Good morning. You’re late. You are always late', 'Ah. You have risen. Finally', 'Good morning. Sit up straight'],
        afternoon: ['Good afternoon. You may approach', 'Ah. You’ve decided to call', 'Afternoon. Tea is cold. As are my feelings'],
        evening: ['Good evening. You’re late', 'A pleasant evening to you. Do try to look presentable', 'Ah. The prodigal heir returns'],
        night: ['At this unseemly hour', 'It is past ten. Respectable people are asleep', 'Good night. Go to bed'],
      }[p]),
      heroSub: ({ open }) => {
        const c = C(), out = [];
        if (c.visits > 1) out.push(plural(c.visits, 'visit') + ' today. In my day, one paid a single call per week, and one was grateful.');
        out.push('A “new tab”. Your grandfather had one tab his entire life, and he founded a railway.');
        if (c.habit && c.habit.n >= 2) out.push(c.habit.name + ', ' + c.habit.n + ' days running. Exertion is for the servants.');
        if (c.lastDone) out.push('You completed “' + c.lastDone + '”. One does not boast of completing one’s chores. One has them done.');
        if (c.away > 36e5) out.push('Absent from the estate ' + c.awayText + ' without a word. Not even a telegram.');
        if (c.prevVoice) out.push('I am told you have been keeping company with ' + c.prevVoice + '. We shall not speak of it at dinner.');
        if (c.days >= 1) out.push('You have resided here ' + plural(c.days, 'day') + ' and not once written to me.');
        if (open) out.push((open === 1 ? 'There remains one matter' : 'There remain ' + open + ' matters') + ' requiring your attention. Your cousin would have finished ' + (open === 1 ? 'it' : 'them') + ' by luncheon.');
        return out;
      },
      tasksEmpty: 'Your affairs are in order. How unlike you.',
      focusTitle: 'Diligent Industry (Supervised)', mode_work: 'At one’s labours', mode_short: 'A brief repose (do not slouch)', mode_long: 'A turn about the garden',
      focusToday: ({ n }) => n + ' periods of industry. Your grandfather managed twelve',
      focusDone: 'Your labours are concluded. Adequately. Ring for tea.', breakDone: 'The interlude has ended. Back to your desk, and do not slouch.',
      cdTitle: 'Engagements (Do Not Be Late)', cdDays: 'days hence', cdToday: 'The day is upon us. You are not dressed.', cdTomorrow: 'day hence. Have your shoes polished', cdEmpty: 'No engagements. No wonder you are unmarried. Or whatever it is you are.',
      habitsTitle: 'Daily Constitutionals', habitsEmpty: 'One has no regular constitutionals. It shows.',
      streak: ({ n }) => n + ' days unbroken. Barely respectable', streakToast: ({ n, name }) => n + ' days of ' + name + '. I suppose I shall mention it to the vicar.',
      weatherQuip: (c) => pick(wx(c), { wet: 'Rain. Take an umbrella. You will not, and you will catch your death.', snow: 'Snow. Wrap up warmly, and do stop looking at that telephone.', cold: 'A bitter chill. Wear a hat. A proper one.', warm: 'Warm. Do not remove your jacket in public.', mild: 'The weather is unremarkable, as is entirely proper.' }),
      vitalsTitle: 'The Family Estate', vitalsWatch: 'Relations in decline',
      vitalsHero: ({ dead, total }) => 'Of the ' + total + ' holdings of this estate, ' + dead + (dead === 1 ? ' has' : ' have') + ' passed beyond the veil. Under your stewardship. I merely observe.',
      state_alive: 'In robust health', state_fading: 'Taken ill', state_flatlined: 'Upon the deathbed', state_dead: 'Interred (your doing)',

      panelTitle: 'The Drawing Room (Do Not Touch Anything)', tab_layout: 'Arrangement', tab_widgets: 'Curiosities', tab_theme: 'Décor', tab_settings: 'Particulars',
      sec_layout: 'The arrangement of the furnishings', sec_widgets: 'A cabinet of curiosities', sec_theme: 'The choice of landscape', sec_background: 'The painting above the mantel',
      sec_accent: 'The choice of ribbon (choose wisely)', sec_voice: 'The choice of correspondent', sec_profile: 'Your calling card', sec_location: 'Place of residence',
      sec_search: 'Enquiries of the wider world', sec_github: 'The workshop ledger', sec_sync: 'Correspondence between one’s residences', sec_data: 'The family archive',
      moreWidgets: 'Further curiosities (vulgar, most of them)',
      tgl_greeting: 'Receive a formal salutation', tgl_quote: 'A daily maxim of great improving value', tgl_animate: 'Animate the painting (a vulgar modern trick)', tgl_summary: 'A daily account of your shortcomings',
      tgl_24h: 'Railway time (24 hours)', tgl_favicons: 'Little heraldic crests (most are not real families)', tgl_syncAuto: 'Dispatch correspondence without being asked, for once',
      widgetsIntro: ({ space }) => 'The curiosities presently on display in the ' + space + ' parlour. You may rearrange them. I shall have them put back.',
      voiceIntro: 'Select the correspondent through whom this page shall address you. Some, I regret to say, are rather common.',
      fld_name: 'Your name, as engraved upon your calling card', fld_tagline: 'The family motto (do try to live up to it)',
      locIntro: ({ name }) => 'You presently reside at ' + name + '. One hears it is very… provincial.', locPlaceholder: 'Name the town of your residence…', btn_find: 'Make enquiries', btn_geo: 'Consult the cartographer',
      fld_weekStart: 'The day upon which the week commences (Sunday is for church)', fld_engine: 'The almanac one consults',
      syncIntro: 'Your affairs shall be conveyed by private courier to each of your residences. The key to the strongbox remains with you. Try not to lose it.',
      btn_syncOn: 'Engage the courier', btn_syncNow: 'Dispatch at once', btn_viewGist: 'Inspect the correspondence',
      btn_export: 'Commit to parchment', btn_import: 'Receive a parcel', btn_reset: 'Sell the estate',
      dataHelp: 'All records are kept in the cabinet of this very browser. The housemaids have been known to dust them away.',
      btn_change: 'Commission another', bgCustom: 'You have hung a portrait of your own choosing. Bold. Not good. Bold.', bgBack: 'Restore the family painting',
      reset_title: 'Sell the entire estate?', reset_body: 'Every room emptied and returned to its original condition. Your grandfather is turning in his grave. I can hear it from here.', reset_ok: 'Proceed with the sale',
      import_title: 'Accept this parcel?', import_body: 'Its contents shall replace the present furnishings entirely. I do hope it is from a respectable sender.', import_ok: 'Accept',
      dlg_save: 'Very well', dlg_cancel: 'On second thought',
      search_placeholder: ['Make an enquiry of the wider world…', 'Pray, what do you wish to know?…', 'Do not search for anything you would not say at dinner…'],
      rail_customize: 'Retire to the drawing room', rail_newSpace: 'Open another wing of the house (we cannot afford it)',
      grid_empty: 'This parlour stands empty, save for dust and disappointment.', grid_emptyBtn: 'Furnish the room',
      w_tasks: 'Matters You Have Neglected', w_notes: 'Commonplace Book', w_bookmarks: 'Calling Cards', w_github: 'The Workshop',
      w_worldclock: 'Telegraph Offices of the Empire', w_news: 'The Morning Gazette (Ironed)', w_forecast: 'The Barometer',
      notes_placeholder: 'Commit a thought to the page. Mind your spelling…', task_placeholder: 'A matter you will no doubt neglect…',
      toast_location: ({ name }) => 'Your residence is now recorded as ' + name + '. I shall have to tell people.',
      desc_tasks: 'Matters you have neglected', desc_habits: 'Daily constitutionals', desc_focus: 'Supervised industry', desc_vitals: 'The health of the family estate',
      desc_news: 'The morning gazette, ironed', desc_music: 'A gramophone (vulgar)', desc_search: 'Enquiries of the wider world',
      leave_title: () => 'Very well.', leave_body: ({ to }) => 'I shall inform the staff that you have chosen to associate with… ' + to + '. Your grandfather would have had words. I shall have them on his behalf.',
      leave_ok: 'I have made my choice', leave_cancel: 'Forgive me, Grandmother',
      welcomeVoice: ({ prev }) => 'So. ' + prev + ' did not work out. I am not surprised. Sit down.',
      welcomeBack: () => 'Gone ' + C().awayText + ' without a word. Not even a card.',
      blurb: {
        neutral: 'Plain-spoken, like a ledger. Acceptable.', monday: 'Shockingly impertinent. I shall have words with its mother.', supportive: 'A hysteric. Keep her away from the silverware.',
        surfer: 'A vagrant. Cannot recall your name. Nor his own.', professional: 'A clerk who thinks himself a gentleman.', therapist: 'Charges money to listen to one complain. In my day that was called a husband.',
        weepy: 'Prone to fits of melancholy. Fetch the smelling salts. Again.', victorian: 'One is delighted by one’s own selection. Naturally.',
      },
    },
  };

  /* ---------- names: built from the structure of whatever name is set ---------- */
  // Surfer: "Christoffer" -> "Chr… Chris… Christo… dude"; "Bo" -> "B… Bo… wait… dude".
  function mangle(name) {
    const w = String(name || '').trim().split(/\s+/)[0] || '';
    if (!w) return 'uh… dude';
    const chars = Array.from(w), n = chars.length;
    if (n <= 3) return chars[0] + '… ' + w + '… wait… dude';
    const cut = (f) => chars.slice(0, Math.max(1, Math.round(n * f))).join('');
    const parts = [cut(0.27), cut(0.45), cut(0.64)].filter((x, i, a) => a.indexOf(x) === i && x !== w);
    return parts.join('… ') + '… dude';
  }
  // Professional: "Anne-Marie Olsen" -> "Anne-Marie O. (Team Member)".
  function teamMember(name) {
    const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return 'Team Member';
    return (parts.length > 1 ? parts[0] + ' ' + Array.from(parts[parts.length - 1])[0] + '.' : parts[0]) + ' (Team Member)';
  }

  /* ---------- presence: what data-driven lines can quote back at you ---------- */
  let awayMs = 0;
  const loadedAt = Date.now();
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
    _names: { mangle, teamMember },
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
      if (p.day !== k) {
        const y = new Date(); y.setDate(y.getDate() - 1);
        p.prevVisits = p.day === dayKey(y) ? p.visits || 0 : 0;
        p.day = k; p.visits = 0;
      }
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
        away: awayMs, awayText: human(awayMs), visits: p.visits || 0, prevVisits: p.prevVisits || 0, days, anniversary: 365 - sinceFirst,
        sessionMin: Math.floor((now - loadedAt) / 6e4), done: done.length,
        prevVoice: p.prevVoice && p.prevVoice !== this.key() && VOICES[p.prevVoice] ? VOICES[p.prevVoice].name : '',
        lastDone: done.length ? done[0].text : '', habit: bestHabit(st.habits),
      };
    },
    /* The neutral wording, used as a tooltip wherever a voice renames a control. */
    plain(key, ctx) { const val = this.resolve(VOICES.neutral[key], key, ctx); return val == null ? key : val; },
  };
})(window.SP = window.SP || {});
