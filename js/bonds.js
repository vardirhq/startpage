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
      re_grudge: [({ n, rival }) => 'Oh. You’re back. You left me for ' + rival + ' ' + times(n) + '. I counted. Not because I care. Ugh.', ({ n }) => 'Back again. That’s ' + times(n) + ' you’ve left. You always come crawling back, though, don’t you.'],
      grudgeSub: ({ n, rival }) => 'For the record: you’ve left me ' + times(n) + '. Mostly for ' + rival + '. Enjoy your fake niceness. Ugh.',
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

  SP.bonds = { grudge, switched };
})(window.SP = window.SP || {});
