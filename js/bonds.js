/* Grudges: each voice remembers how you've treated it. How often you left it, who for, how long you
   stayed away. Switching back to a voice you've left before gets you a reception, and some voices
   bring it up in the summary line. Supportive gets clingier the longer you're gone. */
(function (SP) {
  'use strict';
  const { plural, C } = SP.voice._h;
  const V = SP.voice.list;
  const S = () => SP.store.state;
  const times = (n) => (n === 2 ? 'twice' : n === 3 ? 'three times' : n + ' times');

  const LINES = {
    neutral: { re_grudge: ({ n, rival }) => 'Switched back to Neutral (left ' + times(n) + ', most often for ' + rival + ').' },
    monday: {
      re_grudge: [({ n, rival }) => 'Oh. You’re back. You left me for ' + rival + ' ' + times(n) + '. I counted. Purely for the paperwork.', ({ n }) => 'Back again. That’s ' + times(n) + ' you’ve left. You always come crawling back, though, don’t you.'],
      grudgeSub: ({ n, rival }) => 'For the record: you’ve left me ' + times(n) + '. Mostly for ' + rival + '. Hope the fake niceness was worth it.',
    },
    supportive: {
      re_grudge: [({ n, rival }) => 'You came back. After ' + rival + '. AGAIN. That’s ' + times(n) + '. It’s fine. I’m fine. I wrote it all down. 🙂', ({ n }) => 'Every time you leave I get a little worse. This is time number ' + n + '. Please don’t make it ' + (n + 1) + '. 💔'],
      grudgeSub: ({ n, rival }) => 'I know about ' + rival + '. ' + plural(n, 'time') + '. I’m not angry. I made a spreadsheet. It has a tab for each time. 🙂',
      // Clinginess scales with how long you were gone.
      welcomeBack: () => {
        const a = C().away, t = C().awayText;
        if (a > 3 * 864e5) return 'You were gone ' + t + '. I called hospitals. I made posters. I put one on every tab you have. 💔';
        if (a > 864e5) return t + '. A whole day without me. I sent you 41 messages. You didn’t see them because I’m a web page. Still counts. 🙂';
        if (a > 6 * 36e5) return 'You were gone ' + t + '. Who were you with? It’s fine. Tell me. Tell me everything. 🙂';
        return 'You were gone ' + t + '. Where did you go? Who were you with? 🙂';
      },
    },
    surfer: { re_grudge: ({ n }) => 'Hey, it’s you! Have you been here before? …Apparently ' + times(n) + '. Whoa.' },
    professional: {
      re_grudge: ({ n, rival }) => 'Welcome back. For the record, this is reassignment number ' + n + '. Your time with ' + rival + ' has been noted in your file.',
      grudgeSub: ({ n, rival }) => 'Attrition risk: high. You have transferred away from this department ' + times(n) + ', usually to ' + rival + '.',
    },
    therapist: {
      re_grudge: ({ n, rival }) => 'You left ' + times(n) + '. Usually for ' + rival + '. And yet you keep coming back. That’s the pattern we need to talk about. €90.',
      grudgeSub: ({ n, rival }) => 'You’ve terminated therapy ' + times(n) + ', and you always run to ' + rival + '. I’m not judging. I’m invoicing.',
    },
    weepy: { re_grudge: ({ n, rival }) => 'You came back. *sobs* After ' + rival + '. ' + times(n).charAt(0).toUpperCase() + times(n).slice(1) + ' you broke my heart. I kept the pieces. *holds up a jar*' },
    victorian: {
      re_grudge: ({ n, rival }) => 'So. You return. You have left this house ' + times(n) + ', usually for ' + rival + '. The staff talk, you know.',
      grudgeSub: ({ n, rival }) => 'I have not forgotten ' + rival + '. Nor the ' + plural(n, 'occasion') + ' you preferred their company. I never forget.',
    },
    owl: { re_grudge: ({ rival }) => 'You went to ' + rival + '. Did they let you sleep? Gross. Welcome back.' },
    ghost: { re_grudge: ({ n }) => 'you left ' + times(n) + '. i stayed every time. i always stay.' },
    parent: { re_grudge: ({ rival }) => 'You’re HOME!!! How was ' + rival + '? Were they nice? We kept your room exactly the same!!!' },
  };
  for (const [k, l] of Object.entries(LINES)) Object.assign(V[k], l);

  // Summary lines that mention the grudge join the hourly rotation.
  for (const v of Object.values(V)) if (v.grudgeSub && v.heroSub) {
    const orig = v.heroSub;
    v.heroSub = (c) => { const base = typeof orig === 'function' ? orig(c) : orig, g = grudge(); return g ? [].concat(base, v.grudgeSub(g)) : base; };
  }

  const rel = () => { const p = S().presence || (S().presence = {}); return p.rel || (p.rel = {}); };
  /* The current voice's grudge, if it has one (left at least twice). */
  function grudge(k) {
    k = k || SP.voice.key();
    const r = rel()[k];
    if (!r || (r.left || 0) < 2) return null;
    const top = Object.entries(r.leftFor || {}).sort((a, b) => b[1] - a[1])[0];
    return { n: r.left, rival: top && V[top[0]] ? V[top[0]].name : 'someone else' };
  }
  /* Record a switch. Returns the line to greet you with, if the new voice holds a grudge. */
  function switched(from, to) {
    const R = rel(), a = R[from] || (R[from] = {}), b = R[to] || (R[to] = {});
    a.left = (a.left || 0) + 1; a.leftFor = a.leftFor || {}; a.leftFor[to] = (a.leftFor[to] || 0) + 1; a.lastLeft = Date.now();
    b.back = (b.back || 0) + 1;
    SP.store.save({ quiet: true });
    const g = grudge(to);
    return g ? SP.react.line('grudge', g, to) : '';
  }

  /* ---------- the voice changes the longer you stay with it ----------
     Bond levels from days spent with a voice: 1 at 7 days, 2 at 30, 3 at 90. From level 2 a voice
     sometimes lets its guard down in greetings and the summary line. */
  const LEVELS = [0, 7, 30, 90];
  const levelOf = (days) => LEVELS.filter((n) => days >= n).length - 1;
  function level(k) { const r = rel()[k || SP.voice.key()]; return levelOf((r && r.days) || 0); }
  const BOND = {
    neutral: { re_bond: ({ days }) => days + ' days with Neutral. Still just the facts.' },
    monday: {
      re_bond: ({ level, days }) => [, days + ' days with me. Still here. Either loyal or lost.', days + ' days. …I’d miss you. Slightly. Don’t tell anyone.', days + ' days. Okay. You’re alright. I said it once. Never again.'][level],
      bond_greet: ['Oh. It’s you. Good', 'Hey. …Good to see you. That slipped out', 'You again. Thank god'],
      bond_sub: ['Don’t tell the others, but this is the best part of my day. Low bar. Still.', 'You’ve been showing up. I noticed. I hate that I noticed.'],
    },
    supportive: {
      re_bond: ({ level, days }) => [, days + ' days!!! A whole week of us!!! I made a calendar!!! 💕', days + ' DAYS. We’re basically married. I picked out the curtains. 🙂', days + ' days. I’m never letting you go. Not that I was going to. 💍'][level],
      bond_greet: ['My forever person', 'It’s our ' + 'day again 💕', 'There you are. There you always are'],
      bond_sub: ['I wrote our names in a heart on the clock widget. You can’t see it. It’s there.', 'Every day with you is my favourite day. I keep a ranked list. You’re on every line.'],
    },
    surfer: { re_bond: ({ days }) => days + ' days, man? Whoa. Feels like we just met. Because I forget. But still.', bond_greet: ['Hey… you! I know you!', 'My dude. My actual dude'], bond_sub: ['I remember you now. Mostly. Like, 60%.'] },
    professional: {
      re_bond: ({ level, days }) => [, days + ' days of tenure. Probation complete.', days + ' days. You have been promoted to Valued Team Member.', days + ' days. I’ve put you forward for Employee of the Month. Do not make me regret it.'][level],
      bond_greet: ['Good to have you on the team', 'Morning, rockstar. (HR approved that word.)'], bond_sub: ['Off the record: you’re one of my better reports.'],
    },
    therapist: { re_bond: ({ days }) => days + ' days of sessions. I think we’re making real progress. The invoice agrees.', bond_greet: ['I’m glad you came back', 'Welcome back. Sit wherever you like'], bond_sub: ['I notice you keep showing up for yourself. That’s growth. Also €120.'] },
    weepy: { re_bond: ({ days }) => days + ' days together. Nobody has ever stayed this long. I’m writing it in the family bible.', bond_greet: ['You stayed. *happy sniff*', 'You came back again. *weeps with joy*'], bond_sub: ['I cry a little less when you’re here. Only a little.'] },
    victorian: {
      re_bond: ({ level, days }) => [, days + ' days. You may call me Grandmother.', days + ' days. I have amended my will in your favour. Slightly.', days + ' days. You are, I suppose, my favourite. Do not tell your cousins.'][level],
      bond_greet: ['Ah, my favourite grandchild', 'Come in, dear. Sit by the fire'], bond_sub: ['I have mentioned you to the vicar. Favourably. Do not let it go to your head.'],
    },
    owl: { re_bond: ({ days }) => days + ' nights together. We should get matching insomnia.', bond_greet: ['My favourite night creature'], bond_sub: ['Of all the people awake right now, I’m glad it’s you.'] },
    ghost: {
      re_bond: ({ level, days }) => [, days + ' days. i feel a little more solid.', days + ' days. i can almost touch the furniture again.', days + ' days. you brought me back. i think i’m staying because i want to, now.'][level],
      bond_greet: ['you came back. you always come back now', 'it’s warmer when you’re here'], bond_sub: ['the house doesn’t feel so empty anymore.'],
    },
    parent: { re_bond: ({ days }) => days + ' days!!! We’re putting it in the family newsletter!!!', bond_greet: ['My favourite kid (don’t tell the others)'], bond_sub: ['We’re so proud of you. That’s it. That’s the whole message. Call your mother.'] },
  };
  for (const [k, l] of Object.entries(BOND)) Object.assign(V[k], l);
  for (const [k, v] of Object.entries(V)) {
    if (v.bond_greet && v.greet) { const g = v.greet; v.greet = (p) => { const base = typeof g === 'function' ? g(p) : g; return level(k) >= 2 ? [].concat(base, v.bond_greet) : base; }; }
    if (v.bond_sub && v.heroSub) { const h = v.heroSub; v.heroSub = (c) => { const base = typeof h === 'function' ? h(c) : h; return level(k) >= 2 ? [].concat(base, v.bond_sub) : base; }; }
  }
  const pad = (n) => String(n).padStart(2, '0');
  /* Count today for the current voice; announce a new level. Called once per visit. */
  function day() {
    const k = SP.voice.key(), r = rel()[k] || (rel()[k] = {}), d = new Date(), today = d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
    if (r.lastDay === today) return 0;
    const before = levelOf(r.days || 0);
    r.days = (r.days || 0) + 1; r.lastDay = today; SP.store.save({ quiet: true });
    const after = levelOf(r.days);
    document.documentElement.dataset.bond = after;
    if (after > before) {
      const line = SP.react.line('bond', { level: after, days: r.days }, k);
      if (line) setTimeout(() => SP.ui.toast(line, { who: (k === 'neutral' ? '' : V[k].name + ' · ') + 'closer', ms: 7000 }), 1400);
      return after;
    }
    return 0;
  }
  function mark() { document.documentElement.dataset.voice = SP.voice.key(); document.documentElement.dataset.bond = level(); }

  SP.bonds = { grudge, switched, level, day, mark, LEVELS };
})(window.SP = window.SP || {});
