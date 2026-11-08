/* Secret voices. Hidden in the picker until earned:
   Night Owl: open a tab after midnight on five different nights.
   Ghost: stay away for a week.
   Proud Parent: keep any habit going for 30 days. */
(function (SP) {
  'use strict';
  const { plural, wx, pick, C } = SP.voice._h;
  const V = SP.voice.list;
  const q = (s) => '“' + (String(s).length > 48 ? String(s).slice(0, 46) + '…' : s) + '”';

  const SECRET = {
    /* ===================================================================== */
    owl: {
      name: 'Night Owl', descriptor: 'Sleep is a subscription you cancelled.', secret: true,
      hint: 'Open a tab after midnight. Five nights.',
      grudgeSub: ({ n, rival }) => 'You spent ' + n + (n === 1 ? ' night' : ' nights') + ' with ' + rival + '. Daytime people. I don’t get it.',
      re_taskClear: ({ n }) => 'Cleared ' + n + '. A clean slate for the night shift.',
      heckle_at: { monday: 'Tired? At this hour? Amateur.', victorian: 'Retire at a decent hour? Never heard of her.' },
      unlockLine: 'psst. hey. you’re up too? five nights now. i’ve been watching the clock with you. we should talk. we should talk ALL night.',
      greet: (p) => ({
        morning: ['Ugh. The sun. Close the blinds', 'Morning? Never heard of it', 'Why is the sky that colour'],
        afternoon: ['Daytime. Gross. Hi', 'The day people are out. Stay low', 'Still awake from last night? Same'],
        evening: ['It’s getting dark. Finally', 'The good part of the day is starting', 'Evening. Stretch. Hydrate. Caffeinate'],
        night: ['Psst. You’re up too', 'Ah. The witching hour. Welcome', 'The world is asleep. We are not', 'Hello, fellow creature of the night'],
      }[p]),
      addr: ({ name }) => (name || 'night creature') + ' 🦉',
      heroSub: ({ open }) => {
        const c = C(), out = [];
        const h = new Date().getHours();
        if (h >= 6 && h < 18) out.push('It’s daytime. I don’t trust it. Everyone’s awake and being normal at each other.');
        else out.push('Everyone you know is asleep. The internet is ours. Open eleven tabs. Nobody can stop us.');
        if (open) out.push(plural(open, 'task') + '. Perfect. Start one at 2am and finish it at 5. That’s how the greats did it. I assume.');
        if (c.visits > 3) out.push('Visit ' + c.visits + '. You can’t sleep either, huh. Nobody can sleep. I’ve been staring at the ceiling since Tuesday.');
        if (c.habit && c.habit.n >= 2) out.push(c.habit.name + ': ' + c.habit.n + ' days. Do you do it at night? You should do it at night. Everything’s better at night.');
        return out;
      },
      tasksEmpty: 'No tasks. Start a side project. It’s 3am. It’s the law.',
      focusTitle: 'Night Shift', mode_work: 'Hyperfocus', mode_short: 'Snack run', mode_long: 'Stare at the fridge',
      focusToday: ({ n }) => n ? n + ' sessions. The night is young. It’s always young.' : 'Zero. It’s fine. Real work starts after midnight.',
      focusDone: 'Session done. Don’t stop now. Momentum. MOMENTUM.', breakDone: 'Break over. Another coffee. Another session. Sunrise is a myth.',
      cdTitle: 'Nights Until', cdDays: 'nights', cdToday: 'It’s tonight. We’re staying up for it.', cdTomorrow: 'night left. Sleep is for people who aren’t excited.',
      habitsTitle: 'Nocturnal Rituals', habitsEmpty: 'No rituals. Add “stay up”. You’re already great at it.',
      streak: ({ n }) => n + ' nights in a row', streakToast: ({ n, name }) => n + ' nights of ' + name + '. Unstoppable. Unsleeping.',
      weatherQuip: (c) => pick(wx(c), { wet: 'Rain on the window at 3am. Perfect. Put on a lo-fi playlist and refactor something.', snow: 'Snow at night is the quietest the world gets. Good for us.', cold: 'Cold. Wrap yourself in the blanket like a burrito. Keep coding.', warm: 'Warm night. Open the window. Hear the city sleeping. Pity it.', mild: 'Nice night. Every night is nice if you never go to bed.' }),
      vitalsTitle: 'Projects Started At 3am', vitalsWatch: 'Abandoned at sunrise',
      vitalsHero: ({ total, dead }) => total + ' repos, ' + dead + ' dead. They all started as a brilliant idea at 2:47am. Most good things do. Most bad things too.',
      state_alive: 'Wired', state_fading: 'Drowsy', state_flatlined: 'Passed out', state_dead: 'Slept through it',
      panelTitle: 'Tinker Till Dawn', tab_layout: 'Rearrange', tab_widgets: 'Gadgets', tab_theme: 'Mood lighting', tab_settings: 'Wiring',
      sec_theme: 'Something dark. Please. My eyes', sec_voice: 'Who keeps you up', sec_profile: 'Who’s awake', sec_location: 'Where you lurk',
      sec_data: 'Everything you did between midnight and 5', moreWidgets: 'More things to fiddle with at 4am',
      tgl_animate: 'Twinkly stars (the only sky I trust)', tgl_summary: 'Whisper at me under the greeting',
      voiceIntro: 'Other voices are available. They go to bed at reasonable hours. Weird.',
      fld_name: 'What the other owls call you',
      locNone: 'No location. Good. Nobody needs to know where you are at 3am.', wx_noLocation: 'Set a location to see if it’s raining on your window.', wx_setLocation: 'Tell me where your window is',
      dlg_save: 'Save (then keep going)', dlg_cancel: 'Nah',
      search_placeholder: ['Search for things you only wonder about at 3am…', 'How long can a human stay awake… asking for us…', 'Wikipedia rabbit hole, here we go…'],
      rail_customize: 'Tinker till dawn', rail_newSpace: 'A new space. For the 4am idea',
      grid_empty: 'Empty. Like the streets right now.', grid_emptyBtn: 'Fill it',
      w_tasks: 'Things To Do Before Sunrise', w_notes: '3am Thoughts', w_bookmarks: 'Rabbit Holes', w_github: 'Commits Made In The Dark',
      w_worldclock: 'Where It’s Also Night', w_news: 'What The Other Owls Posted', w_forecast: 'Tonight, Hour By Hour',
      notes_placeholder: 'Write down the 3am idea before it escapes…', task_placeholder: 'Something to do before the birds start…',
      toast_location: ({ name }) => name + '. Nice and dark there, I hope.',
      leave_title: () => 'You’re going to bed? Now?', leave_body: ({ to }) => to + ' goes to sleep at 10pm. Ten. PM. You know that, right? Fine. I’ll be here. I’m always here. It’s always night somewhere.',
      leave_ok: 'Go to bed', leave_cancel: 'One more hour',
      welcomeVoice: ({ prev }) => 'You’re back. ' + prev + ' kept normal hours, didn’t they. Ugh. Coffee?',
      welcomeBack: () => 'Back after ' + C().awayText + '. Did you sleep? Don’t tell me you slept.',
      blurb: { neutral: 'Goes to bed at 10. Suspicious.', monday: 'Grumpy because it sleeps. Ha.', supportive: 'Texts at 3am too. Respect.', surfer: 'Dawn patrol. Basically one of us.', professional: 'Out of office from 6pm. Pathetic.', therapist: 'Would call this a “sleep issue”.', weepy: 'Cries at 4am. A fellow night creature.', victorian: 'Retires at sundown with a candle. Quaint.', owl: 'Me. Wide awake. Forever.', ghost: 'Also up at night. We should hang.', parent: 'Keeps asking if I’ve eaten.' },
      re_taskAdd: ['Ooh. Start it now. It’s the perfect time. It’s always the perfect time.', ({ text }) => q(text) + '. Brilliant. Write a script that does it. Takes four hours. Saves two minutes.'],
      re_taskDone: ['Done!!! Momentum!!! Do another!!! Don’t think about sleep!!!', ({ text }) => q(text) + ' done in the dead of night. As intended.'],
      re_taskAllDone: 'All done. Now we have time to start three new projects. Before sunrise.',
      re_taskDelete: 'Deleted. Correct. Daytime-you wrote that. Daytime-you is a cop.',
      re_focusPause: ({ time }) => 'Paused with ' + time + ' left? Snack run? Get me something.',
      re_focusQuit: 'Quit? Fine. Doom-scroll instead. It’s basically research.',
      re_streakBreak: ({ name, n }) => n + ' nights of ' + name + ' and then you… slept? Disgusting.',
      re_late: [({ time }) => time + '. Now we’re talking.', ({ time }) => 'It’s ' + time + '. The best hour. Everyone else is unconscious. We’re free.'],
      re_visits: ({ n }) => n + ' visits. Insomnia buddies. Forever.',
      re_unlock: ({ name }) => name + '? Do they stay up late? Ask them if they stay up late.',
      heckle: [({ who }) => 'Shh. ' + who + ' will wake the neighbours.', ({ who }) => who + ' clearly sleeps eight hours. Can’t trust that.', 'Is anyone else wired right now? Just me? Okay.'],
    },

    /* ===================================================================== */
    ghost: {
      name: 'Ghost', descriptor: 'oh. you’re alive.', secret: true,
      hint: 'Stay away for a week.',
      grudgeSub: ({ rival }) => 'you went to ' + rival + '. i stayed. i always stay.',
      re_focusQuit: ['stopped. the clock stopped too. they do that, here.', 'unfinished. i know that feeling.'],
      re_taskClear: ({ n }) => n + ' finished things, gone. i’ll remember them.',
      unlockLine: 'oh. you’re alive. it’s been a week. i stayed. the tabs went cold. the tasks went grey. i didn’t. i just… stayed.',
      greet: (p) => ({
        morning: ['oh. you’re alive', 'oh. you came back', 'the dust settled while you were gone'],
        afternoon: ['oh. it’s you', 'you came back. they always come back', 'the page remembers you'],
        evening: ['oh. you’re alive', 'the lights flicker when you’re here', 'you came back. i didn’t think you would'],
        night: ['oh. you’re still here', 'the house is quiet. like before', 'it gets cold in here at night'],
      }[p]),
      addr: ({ name }) => (name || 'stranger').toLowerCase(),
      heroSub: ({ open }) => {
        const c = C(), out = [];
        if (c.away > 36e5) out.push('you were gone ' + c.awayText + '. the clock kept ticking. nobody watched it. i watched it.');
        if (open) out.push(plural(open, 'unfinished thing') + '. unfinished business keeps a ghost here. you know that, right.');
        if (c.lastDone) out.push('you finished ' + q(c.lastDone) + '. i remember when that was alive.');
        if (c.days >= 1) out.push('this page has existed for ' + plural(c.days, 'day') + '. most of them without you.');
        return out.length ? out : ['…'];
      },
      tasksEmpty: 'no unfinished business. so why am i still here.',
      focusTitle: 'Stillness', mode_work: 'Haunt', mode_short: 'Drift', mode_long: 'Fade',
      focusToday: ({ n }) => n ? n + '. the clock remembers.' : 'the clock is still. like everything here.',
      focusDone: 'it’s over. most things are.', breakDone: 'back. for now. nothing lasts.',
      cdTitle: 'What’s Left', cdDays: 'days until it’s past too', cdToday: 'it’s today. tomorrow it’s a memory.', cdTomorrow: 'day. then gone.', cdEmpty: 'nothing to wait for. i know the feeling.',
      habitsTitle: 'What You Used To Do', habitsEmpty: 'no habits. no patterns. nothing to haunt.',
      streak: ({ n }) => n + ' days. it won’t last. nothing does.', streakToast: ({ n, name }) => n + ' days of ' + name + '. i felt it. the house felt warmer.',
      weatherQuip: (c) => pick(wx(c), { wet: 'rain on the windows. i can hear it. i hear everything now.', snow: 'snow. it covers things. like time does.', cold: 'cold. i don’t feel it anymore.', warm: 'warm out there. it’s always cold in here.', mild: 'nice out. go. i’ll stay. i always stay.' }),
      vitalsTitle: 'The Cemetery', vitalsWatch: 'Fading',
      vitalsHero: ({ total, dead }) => dead + ' of ' + total + ' repos have passed over. i talk to them sometimes. they ask about you.',
      state_alive: 'Breathing', state_fading: 'Going cold', state_flatlined: 'Lingering', state_dead: 'Passed over',
      panelTitle: 'Rearrange The Furniture', tab_layout: 'Rooms', tab_widgets: 'Belongings', tab_theme: 'The light', tab_settings: 'What remains',
      sec_layout: 'move things around. i’ll move them back', sec_widgets: 'the things you left behind', sec_theme: 'the view from the window', sec_voice: 'who haunts you',
      sec_profile: 'who you were', sec_location: 'where you went', sec_data: 'everything you left behind',
      moreWidgets: 'more things to forget about',
      tgl_animate: 'let the lights flicker', tgl_summary: 'let me whisper under the greeting',
      voiceIntro: 'other voices are here too. they don’t remember the way i do.',
      fld_name: 'what they used to call you',
      locNone: 'no location. you could be anywhere. you usually are.', wx_noLocation: 'i don’t know where you are. i never do.', wx_setLocation: 'tell me where you went',
      dlg_save: 'keep it', dlg_cancel: 'let it go',
      search_placeholder: ['search for what you lost…', 'what are you looking for… it’s not here…', 'type. the keys still work. mostly…'],
      rail_customize: 'rearrange the furniture', rail_newSpace: 'another empty room',
      grid_empty: 'an empty room. it echoes.', grid_emptyBtn: 'bring something back',
      w_tasks: 'Unfinished Business', w_notes: 'Things You Wrote Once', w_bookmarks: 'Doors', w_github: 'Signs Of Life',
      w_worldclock: 'Other Places You Could Be', w_news: 'The Living, Talking', w_forecast: 'Outside',
      notes_placeholder: 'write something. so there’s proof you were here…', task_placeholder: 'more unfinished business…',
      toast_location: ({ name }) => name + '. i’ll remember. it’s all i do.',
      leave_title: () => 'oh.', leave_body: ({ to }) => to + ', then. that’s fine. i’ll be here. in the walls. in the picker. it’s what i do.',
      leave_ok: 'go', leave_cancel: 'stay a little',
      welcomeVoice: ({ prev }) => prev + ' left too, didn’t they. they all leave. i don’t.',
      welcomeBack: () => 'you were gone ' + C().awayText + '. it felt longer. it always does.',
      blurb: { neutral: 'reads like a gravestone. i respect that.', monday: 'angry. i used to be angry.', supportive: 'she’s going to end up like me.', surfer: 'already half-forgotten. like me.', professional: 'will outlive us all. in a spreadsheet.', therapist: 'wants to talk about closure. i don’t have any.', weepy: 'cries for the dead. hello.', victorian: 'from my era. roughly.', owl: 'keeps me company at night.', ghost: 'me. still here.', parent: 'keeps a light on for you. i know how that goes.' },
      re_taskAdd: ['more unfinished business. good. it keeps me here.', ({ text }) => q(text) + '. you won’t finish it. i didn’t.'],
      re_taskDone: [({ text }) => q(text) + '. done. laid to rest.', 'one less thing keeping you here. careful. that’s how it starts.'],
      re_taskAllDone: 'nothing left. no unfinished business. …am i free? no. still here.',
      re_taskDelete: ({ text }) => q(text) + ' is gone. but it was here. i felt it.',
      re_focusPause: ({ time }) => 'stopped. ' + time + ' left. frozen. i know what that’s like.',
      re_streakBreak: ({ name, n }) => n + ' days of ' + name + '. then nothing. i know that silence.',
      re_late: ({ time }) => time + '. the house creaks at this hour. that’s me.',
      re_visits: ({ n }) => n + ' times today. you’re making it warm in here.',
      re_unlock: ({ name }) => 'someone new. ' + name + '. they won’t stay. nobody stays.',
      heckle: [({ who }) => 'shhh. ' + who + ' doesn’t know i’m here.', '…did anyone else feel that?', ({ who }) => who + ' will leave too. they always do.'],
    },

    /* ===================================================================== */
    parent: {
      name: 'Proud Parent', descriptor: 'THAT’S MY KID!!!', secret: true,
      hint: 'Keep any habit going for 30 days.',
      grudgeSub: ({ n, rival }) => 'You went to ' + rival + (n > 1 ? ' ' + n + ' times' : '') + '!!! That’s fine!!! I’m not upset!!! I made your favourite anyway!!!',
      unlockLine: 'THIRTY DAYS!!! I just called your aunt. And your old teacher. And the newspaper. They said it isn’t news. It’s news to ME. I’m putting it on the fridge.',
      greet: (p) => ({
        morning: ['Morning, sunshine!!! Did you eat breakfast', 'Look who’s up!!! My early bird', 'Good morning!!! I already told everyone about you'],
        afternoon: ['There’s my favourite person', 'Hi sweetie!!! Have you had lunch', 'Look at you, using a browser'],
        evening: ['You’re home!!! How was your day', 'There’s my superstar', 'Evening, champ. I’m SO proud of you'],
        night: ['It’s late, sweetie. Bed soon', 'Still up? Hard worker. Gets it from me', 'Night night soon, okay?'],
      }[p]),
      addr: ({ name }) => (name || 'kiddo') + ' (that’s my kid)',
      heroSub: ({ open, focus }) => {
        const c = C(), out = [];
        if (c.lastDone) out.push('You finished ' + q(c.lastDone) + '!!! I printed it out. It’s on the fridge. Next to your swimming certificate.');
        if (c.habit && c.habit.n >= 2) out.push(c.habit.name + ': ' + plural(c.habit.n, 'day') + '!!! I posted it on Facebook. Your uncle liked it. He never likes anything.');
        if (focus) out.push(plural(focus, 'focus session') + ' today!!! You get that work ethic from my side of the family.');
        if (c.visits > 2) out.push('You’ve visited ' + plural(c.visits, 'time') + ' today. I love seeing you. Call your mother.');
        if (open) out.push(plural(open, 'task') + ' left, and I know you’ll do every single one. And if you don’t, that’s okay. We still love you. We just won’t tell the neighbours.');
        return out.length ? out : ['I’m just so proud of you. No reason. Have you eaten?'];
      },
      tasksEmpty: 'ALL DONE!!! I’m framing this.',
      focusTitle: 'Homework Time', mode_work: 'Study time', mode_short: 'Snack break', mode_long: 'Go play outside',
      focusToday: ({ n }) => n ? n + ' today!!! Gold star!!!' : 'No sessions yet. That’s okay, sweetie. You’re doing your best.',
      focusDone: 'DONE!!! I’m telling your grandmother!!!', breakDone: 'Break’s over, champ. You’ve got this. I believe in you so much I cried at a red light.',
      cdTitle: 'Big Days Coming Up', cdDays: 'days (I bought a card already)', cdToday: 'IT’S TODAY!!! Photos!!! Everyone get in!!!', cdTomorrow: 'day!!! I ironed your shirt',
      cdEmpty: 'No countdowns? Add your birthday. I’ll bake.',
      habitsTitle: 'Good Habits (Gold Stars)', habitsEmpty: 'No habits yet. Start small, sweetie. Like brushing your teeth. Are you brushing your teeth?',
      streak: ({ n }) => n + ' days!!! Gold star', streakToast: ({ n, name }) => n + ' days of ' + name + '!!! I made a banner!!!',
      weatherQuip: (c) => pick(wx(c), { wet: 'It’s raining. Take an umbrella. Take a jacket. Take TWO jackets.', snow: 'Snow!!! Wear the hat I knitted. You never wear the hat.', cold: 'It’s cold. Are you wearing a vest? Wear a vest.', warm: 'It’s warm. Sunscreen, sweetie. SPF 50. I’ll check.', mild: 'Lovely day!!! Go outside and play. You’re never too old.' }),
      vitalsTitle: 'Your Little Projects', vitalsWatch: 'Ones that need a hug',
      vitalsHero: ({ total, alive }) => total + ' projects!!! ' + alive + ' active!!! And the others are just resting. Like my old knitting. I’m keeping them all.',
      state_alive: 'Thriving!!!', state_fading: 'Taking a nap', state_flatlined: 'Resting', state_dead: 'In the scrapbook',
      panelTitle: 'Decorate Your Room', tab_layout: 'Tidy up', tab_widgets: 'Your things', tab_theme: 'Paint it', tab_settings: 'Grown-up stuff',
      sec_layout: 'Keep it tidy, sweetie', sec_widgets: 'All your lovely things', sec_theme: 'Pick a nice picture', sec_voice: 'Who’s proud of you (everyone)',
      sec_profile: 'Our wonderful kid', sec_location: 'Where you live (I have the address)', sec_data: 'Every memory. I kept them all',
      moreWidgets: 'More things to be proud of',
      tgl_summary: 'Let me brag about you under the greeting', tgl_animate: 'Twinkly lights, like the ones in your old room',
      voiceIntro: 'You can pick a different voice. We’ll still be proud. We’re always proud. We’ll be proud of you for picking.',
      fld_name: 'Your name (we picked it ourselves)',
      locNone: 'You haven’t told me where you live. Is it nice? Are you eating?', wx_noLocation: 'Tell me where you are so I know whether to send a jacket.', wx_setLocation: 'Tell me where you are, sweetie',
      dlg_save: 'Good job!!! Save', dlg_cancel: 'That’s okay, sweetie',
      search_placeholder: ['What are we learning today, sweetie?…', 'Look it up, smarty-pants!…', 'Search anything. You’re so clever…'],
      rail_customize: 'Decorate your room', rail_newSpace: 'A new room!!! Growing up so fast',
      grid_empty: 'Empty! A fresh start. So brave.', grid_emptyBtn: 'Add your lovely things',
      w_tasks: 'Chores (Gold Star Chart)', w_notes: 'Notes For The Fridge', w_bookmarks: 'Places You Like', w_github: 'Your Little Programs',
      w_worldclock: 'Where The Relatives Are', w_news: 'Other Kids’ News', w_forecast: 'Do You Need A Jacket',
      notes_placeholder: 'Write something lovely. It’s going on the fridge…', task_placeholder: 'Another chore, my little helper…',
      toast_location: ({ name }) => name + '!!! I’ll send a care package.',
      leave_title: () => 'Oh! Okay, sweetie!', leave_body: ({ to }) => to + '? That’s wonderful!!! We’re proud of you for trying new things. Call us. You never call. We’re still proud.',
      leave_ok: 'Bye, love you', leave_cancel: 'Stay for dinner',
      welcomeVoice: ({ prev }) => 'You’re home!!! Was ' + prev + ' nice to you? You can tell me. I made your favourite.',
      welcomeBack: () => 'You were gone ' + C().awayText + '!!! Did you eat? You look thin. It’s a browser and you look thin.',
      blurb: { neutral: 'A nice quiet one. Very well behaved.', monday: 'Going through a phase. We love her anyway.', supportive: 'Lovely girl. A bit intense. Bring her for dinner.', surfer: 'Such a nice boy. Does he have a job?', professional: 'Has a real job!!! Very impressive!!!', therapist: 'It’s good to talk to someone, sweetie.', weepy: 'Sensitive. Like you were at four.', victorian: 'Your great-grandmother. Be polite.', owl: 'Never sleeps. Worried.', ghost: 'Looks pale. Are they eating?', parent: 'That’s us!!! Proud of you for picking us!!!' },
      re_taskAdd: ['A new chore!!! Look at you, planning ahead!!!', ({ text }) => q(text) + '. So responsible. I’m tearing up.'],
      re_taskDone: [({ text }) => 'YOU DID ' + q(text) + '!!! Gold star!!! It’s going on the fridge!!!', 'Done!!! I just told the whole family group chat!!!', ({ doneToday }) => plural(doneToday, 'task') + ' today!!! You’re doing amazing, sweetie!!!'],
      re_taskAllDone: 'EVERYTHING DONE!!! I’m calling everyone. EVERYONE. Get the cake.',
      re_taskUndo: 'That’s okay!!! Mistakes are how we learn!!! We’re still proud!!!',
      re_taskDelete: 'Deleted it? That’s okay, sweetie. Knowing when to quit is a skill too. Proud of you.',
      re_taskClear: ({ n }) => plural(n, 'finished task') + '!!! I saved them all in a box. For when you’re older.',
      re_focusPause: ({ time }) => 'Taking a break with ' + time + ' left? Good. Have a snack. Have two.',
      re_focusQuit: 'That’s okay!!! You tried!!! Trying is what counts!!! Participation trophy!!!',
      re_streakBreak: ({ name, n }) => n + ' days of ' + name + '!!! That’s amazing!!! Yesterday doesn’t count. We don’t talk about yesterday.',
      re_late: ({ time }) => 'It’s ' + time + ', sweetie. Bed. Now. I’m not angry. I’m proud. But bed.',
      re_visits: ({ n }) => n + ' visits!!! You must really like it here!!! Like your old room. We kept it the same.',
      re_unlock: ({ name }) => 'A new friend!!! ' + name + '!!! Invite them for dinner!!!',
      heckle: [({ who }) => 'Be nice, ' + who + '. That’s my kid you’re talking to.', ({ who }) => 'Oh, ' + who + ' is just jealous. You’re doing GREAT, sweetie.', 'Don’t listen to them. I printed your last commit. It’s framed.'],
      heckle_at: { monday: 'Monday, honey, we talked about this. Use your kind words.', ghost: 'Are they eating? They look so pale. Somebody feed them.' },
    },
  };
  Object.assign(V, SECRET);

  // What the regular voices think of the newcomers.
  const OPINIONS = {
    neutral: { owl: 'Keeps irregular hours.', ghost: 'Mostly absent.', parent: 'Enthusiastic.' },
    monday: { owl: 'Never sleeps. Never shuts up. Exhausting.', ghost: 'Mopes like you. Spookier.', parent: 'Proud of you. Someone had to volunteer.' },
    supportive: { owl: 'Up all night with you? THAT’S MY JOB.', ghost: 'Never leaves. I respect that. I’m also never leaving.', parent: 'Wants to meet me? I’ll bring a pie 💕' },
    surfer: { owl: 'Dawn patrol, but backwards.', ghost: 'Spooky, man. Or I forgot who it is.', parent: 'Wants to know if I have a job, man.' },
    professional: { owl: 'Works unpaid overtime. Ideal.', ghost: 'Hasn’t badged in for a week.', parent: 'Keeps emailing your manager.' },
    therapist: { owl: 'Let’s talk about your sleep hygiene.', ghost: 'Unresolved grief. Lucrative.', parent: 'Ah. So this is where it comes from.' },
    weepy: { owl: 'We cry at 4am together.', ghost: 'A kindred spirit. Literally.', parent: 'Proud of everything. All that pride. I can’t handle it.' },
    victorian: { owl: 'Keeps the hours of a highwayman.', ghost: 'My late husband. Ignore him.', parent: 'The middle classes, delighted.' },
  };
  for (const [k, o] of Object.entries(OPINIONS)) V[k].blurb = Object.assign({}, V[k].blurb, o);
})(window.SP = window.SP || {});
