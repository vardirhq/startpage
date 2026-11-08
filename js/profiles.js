/* Starting setups: who's this for? Picked during first-run setup (or later in Customize → You), each one
   lays out the spaces, cards, bookmarks and scene for a kind of person: a student, someone who makes things,
   someone running a household, a gamer, a developer, or just the basics. Everything stays changeable.
   It also decides whether the voices make developer jokes: only for developers (or anyone who connects GitHub). */
(function (SP) {
  'use strict';
  const S = () => SP.store.state;
  const V = SP.voice.list;
  const bm = (title, url) => ({ title, url });
  const sp = (id, name, icon, widgets) => ({ id, name, icon, widgets: ['search'].concat(widgets) });

  const PROFILES = {
    student: {
      name: 'Student', blurb: 'Classes, deadlines, exams, and a bit of downtime', icon: 'book', theme: 'nordic', accent: '#60a5fa',
      spaces: [sp('home', 'Home', 'home', ['clock', 'weather', 'tasks', 'countdown', 'calendar', 'habits', 'bookmarks']),
        sp('study', 'Study', 'book', ['focus', 'tasks', 'notes', 'countdown', 'calendar']),
        sp('break', 'Break', 'coffee', ['music', 'nonogram', 'sudoku', 'decide', 'onthisday', 'quote'])],
      tiles: [bm('Gmail', 'https://mail.google.com'), bm('Drive', 'https://drive.google.com'), bm('Docs', 'https://docs.google.com'), bm('Wikipedia', 'https://en.wikipedia.org'),
        bm('Khan Academy', 'https://www.khanacademy.org'), bm('YouTube', 'https://www.youtube.com'), bm('Spotify', 'https://open.spotify.com')],
      folders: [{ name: 'Study', items: [bm('Google Scholar', 'https://scholar.google.com'), bm('Wolfram Alpha', 'https://www.wolframalpha.com'), bm('Desmos', 'https://www.desmos.com/calculator'), bm('Zotero', 'https://www.zotero.org')] },
        { name: 'Downtime', items: [bm('Netflix', 'https://www.netflix.com'), bm('Reddit', 'https://www.reddit.com'), bm('Twitch', 'https://www.twitch.tv')] }],
      tasks: ['Put your exam dates in a countdown', 'Start the essay (just the first paragraph)', 'Try one focus session'],
    },
    creative: {
      name: 'Creative', blurb: 'Writing, drawing, music: making things, and keeping at it', icon: 'sparkles', theme: 'pixel', accent: '#f472b6',
      spaces: [sp('home', 'Home', 'home', ['clock', 'weather', 'tasks', 'notes', 'mood', 'bookmarks']),
        sp('studio', 'Studio', 'star', ['focus', 'notes', 'habits', 'music', 'capsule', 'decide']),
        sp('unwind', 'Unwind', 'coffee', ['quote', 'onthisday', 'moon', 'nonogram', 'music'])],
      tiles: [bm('Pinterest', 'https://www.pinterest.com'), bm('Behance', 'https://www.behance.net'), bm('Figma', 'https://www.figma.com'), bm('Photopea', 'https://www.photopea.com'),
        bm('Lospec', 'https://lospec.com'), bm('YouTube', 'https://www.youtube.com'), bm('Gmail', 'https://mail.google.com')],
      folders: [{ name: 'Tools', items: [bm('Excalidraw', 'https://excalidraw.com'), bm('Coolors', 'https://coolors.co'), bm('Squoosh', 'https://squoosh.app')] },
        { name: 'Inspiration', items: [bm('ArtStation', 'https://www.artstation.com'), bm('Dribbble', 'https://dribbble.com'), bm('Bandcamp', 'https://bandcamp.com')] }],
      tasks: ['Make something small today, badly, on purpose', 'Pick a daily habit: write, sketch or play', 'Seal a time capsule with what you’re working on'],
    },
    home: {
      name: 'Home & family', blurb: 'The household, the calendar, the weekend', icon: 'home', theme: 'forest', accent: '#34d399',
      spaces: [sp('home', 'Home', 'home', ['clock', 'weather', 'forecast', 'tasks', 'calendar', 'countdown', 'notes', 'bookmarks']),
        sp('weekend', 'Weekend', 'sun', ['weather', 'forecast', 'decide', 'moon', 'onthisday', 'sudoku', 'nonogram', 'music'])],
      tiles: [bm('Gmail', 'https://mail.google.com'), bm('Calendar', 'https://calendar.google.com'), bm('Maps', 'https://maps.google.com'), bm('YouTube', 'https://www.youtube.com'),
        bm('Netflix', 'https://www.netflix.com'), bm('BBC Good Food', 'https://www.bbcgoodfood.com'), bm('Wikipedia', 'https://en.wikipedia.org')],
      folders: [{ name: 'Household', items: [bm('Drive', 'https://drive.google.com'), bm('Keep', 'https://keep.google.com'), bm('Weather radar', 'https://www.rainviewer.com/map.html')] },
        { name: 'Watch', items: [bm('Disney+', 'https://www.disneyplus.com'), bm('Prime Video', 'https://www.primevideo.com'), bm('Spotify', 'https://open.spotify.com')] }],
      tasks: ['Write this week’s shopping list in Notes', 'Add the next birthday to a countdown', 'Let Decide pick dinner'],
    },
    gamer: {
      name: 'Gamer', blurb: 'Release dates, the backlog, and what to play tonight', icon: 'gamepad', theme: 'cyber', accent: '#22d3ee',
      spaces: [sp('home', 'Home', 'home', ['clock', 'weather', 'tasks', 'bookmarks', 'quote']),
        sp('gaming', 'Gaming', 'gamepad', ['countdown', 'bookmarks', 'decide', 'music', 'nonogram', 'sudoku'])],
      tiles: [bm('Steam', 'https://store.steampowered.com'), bm('itch.io', 'https://itch.io'), bm('Twitch', 'https://www.twitch.tv'), bm('YouTube', 'https://www.youtube.com'),
        bm('Discord', 'https://discord.com/app'), bm('HowLongToBeat', 'https://howlongtobeat.com'), bm('Reddit', 'https://www.reddit.com')],
      folders: [{ name: 'Stores', items: [bm('GOG', 'https://www.gog.com'), bm('Epic Games', 'https://store.epicgames.com'), bm('Humble Bundle', 'https://www.humblebundle.com')] },
        { name: 'Help', items: [bm('IsThereAnyDeal', 'https://isthereanydeal.com'), bm('ProtonDB', 'https://www.protondb.com'), bm('Speedrun.com', 'https://www.speedrun.com')] }],
      tasks: ['Count down to the next release you’re waiting for', 'Let Decide pick tonight’s game', 'Finish one game before buying another (ha)'],
    },
    dev: {
      name: 'Developer', blurb: 'GitHub, CI, repo health and Hacker News', icon: 'code', theme: 'midnight', accent: '#a78bfa', dev: true,
      spaces: [sp('home', 'Home', 'home', ['clock', 'weather', 'github', 'bookmarks', 'tasks', 'notes', 'music', 'quote']),
        sp('work', 'Work', 'laptop', ['clock', 'worldclock', 'calendar', 'focus', 'tasks', 'notes', 'forecast', 'countdown', 'bookmarks']),
        sp('dev', 'Dev', 'code', ['github', 'news', 'vitals', 'focus', 'habits', 'tasks', 'notes', 'bookmarks']),
        sp('gaming', 'Gaming', 'gamepad', ['clock', 'countdown', 'bookmarks', 'music', 'quote'])],
      tiles: [bm('GitHub', 'https://github.com'), bm('YouTube', 'https://www.youtube.com'), bm('Gmail', 'https://mail.google.com'), bm('Drive', 'https://drive.google.com'),
        bm('Notion', 'https://www.notion.so'), bm('Blender', 'https://www.blender.org'), bm('Figma', 'https://www.figma.com')],
      folders: [{ name: 'Development', items: [bm('GitHub', 'https://github.com'), bm('MDN Web Docs', 'https://developer.mozilla.org'), bm('Can I use', 'https://caniuse.com'), bm('regex101', 'https://regex101.com')] },
        { name: 'Tools', items: [bm('Excalidraw', 'https://excalidraw.com'), bm('Squoosh', 'https://squoosh.app'), bm('Photopea', 'https://www.photopea.com')] }],
      tasks: ['Add your GitHub username in Customize → You', 'Put the Dev space’s repo vitals to work', 'Try >wrapped in the search bar'],
    },
    basics: {
      name: 'Just the basics', blurb: 'Search, the time, the weather, a list. Nothing else', icon: 'layout', theme: 'minimal', accent: '#a78bfa',
      spaces: [sp('home', 'Home', 'home', ['clock', 'weather', 'tasks', 'notes', 'bookmarks'])],
      tiles: [bm('Gmail', 'https://mail.google.com'), bm('YouTube', 'https://www.youtube.com'), bm('Maps', 'https://maps.google.com'), bm('Wikipedia', 'https://en.wikipedia.org'), bm('Drive', 'https://drive.google.com')],
      folders: [],
      tasks: ['Add your own bookmarks: right-click a tile to edit it', 'More cards live in Customize → Space, whenever you want them'],
    },
  };
  const ORDER = ['student', 'creative', 'home', 'gamer', 'dev', 'basics'];

  /* Lay the page out for a profile. Replaces spaces, bookmark tiles and folders, the example tasks and the scene;
     leaves everything personal (name, location, habits, notes, voice, history) alone. */
  function apply(key) {
    const p = PROFILES[key]; if (!p) return false;
    const s = S();
    s.profile = key;
    s.spaces = JSON.parse(JSON.stringify(p.spaces));
    s.activeSpace = s.spaces[0].id;
    s.bookmarks = { folders: JSON.parse(JSON.stringify(p.folders)), tiles: JSON.parse(JSON.stringify(p.tiles)) };
    // Only swap the example tasks if they're still the untouched examples.
    if ((s.tasks || []).every((x) => /^t\d$/.test(x.id))) s.tasks = p.tasks.map((text, i) => ({ id: 't' + (i + 1), text, done: false }));
    if (p.theme && SP.scene.themes[p.theme] && !SP.scene.themes[p.theme].locked) s.theme = p.theme;
    if (p.accent) s.accent = p.accent;
    SP.store.save();
    if (SP.app) { SP.app.applyTheme && SP.app.applyTheme(); SP.app.renderAll(); }
    return true;
  }
  /* Developer jokes are for developers: the developer setup, or anyone who's connected GitHub. Existing
     installs from before setups existed keep everything. */
  const isDev = () => { const s = S(); return !s.profile || !!(PROFILES[s.profile] || {}).dev || !!(s.github && s.github.user); };

  /* Setup-step lines, per voice. */
  const LINES = {
    neutral: { ob_title_who: 'What’s this page for?', ob_who_hint: 'Pick the closest and the page sets itself up to match: spaces, cards, bookmarks and a scene. You can change any of it later.', fld_setup: 'Starting setup' },
    monday: { ob_title_who: 'So what are you, then?', ob_who_hint: 'Pick one. I’ll set things up accordingly and you’ll ignore half of it. Changeable later, like your mind.', fld_setup: 'Starting setup (the one you’ll ignore)' },
    supportive: { ob_title_who: 'Tell me about you!!! Everything!!!', ob_who_hint: 'Pick the one that’s most you and I’ll make everything perfect for you. I want to know EVERYTHING. 💕', fld_setup: 'Your setup (I made it just for you 💕)' },
    surfer: { ob_title_who: 'So, like, what’s your deal?', ob_who_hint: 'Pick whatever’s closest. I’ll set up some stuff. You can change it whenever. Or not. No pressure.', fld_setup: 'Your vibe, setup-wise' },
    professional: { ob_title_who: 'Please select your role', ob_who_hint: 'Your workspace will be provisioned accordingly: spaces, modules, bookmarks and branding. Changes can be requested at any time.', fld_setup: 'Role-based provisioning' },
    therapist: { ob_title_who: 'Who are you, really?', ob_who_hint: 'Choose what feels closest. Labels are just a starting point. We can revisit this any time. (Each revisit is a new session.)', fld_setup: 'Your starting point (we can revisit this)' },
    weepy: { ob_title_who: 'Who are you? Who are any of us?', ob_who_hint: 'Pick the closest. I’ll arrange everything for you, the way you’d want it. Before you change your mind and leave.', fld_setup: 'Who you were when we met' },
    victorian: { ob_title_who: 'And what, precisely, is your occupation?', ob_who_hint: 'State your station and the household shall be arranged to suit it. It may be rearranged later, if you must.', fld_setup: 'Your station in life' },
    brutal: { ob_title_who: 'What are you supposed to be doing?', ob_who_hint: 'Pick one. I’ll set the page up for it, and then I’ll hold you to it. Changeable later, quitter.', fld_setup: 'Starting setup (what you claim to be)' },
    owl: { ob_title_who: 'What keeps you up at night?', ob_who_hint: 'Pick the closest. I’ll set things up for it. Change it whenever, I’ll be awake.', fld_setup: 'What keeps you up' },
    ghost: { ob_title_who: 'who were you, before', ob_who_hint: 'pick the closest. the house will rearrange itself around you. it can change again. things do.', fld_setup: 'how the house is arranged' },
    parent: { ob_title_who: 'What are you up to these days, sweetie?', ob_who_hint: 'Pick the one that’s most you and I’ll set everything up nicely! You can always move things around. It’s your room.', fld_setup: 'How we set up your room' },
  };
  for (const [k, l] of Object.entries(LINES)) Object.assign(V[k], l);

  SP.profiles = { PROFILES, ORDER, apply, isDev };
})(window.SP = window.SP || {});
