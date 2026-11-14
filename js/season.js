/* Seasons and one-off events. Events stack when they overlap: effects add up, every guest visits, and
   each has its own banner. The season shows up in whatever scene you picked (blossoms in spring,
   fireflies on summer nights, falling leaves in autumn, flurries in winter), flipped for the southern
   hemisphere. Events come and go with nothing to keep up:
   Haunted week (Oct 25–31): Ghost visits, even if you haven't unlocked it, and bats fly all week.
   Yule (Dec 20–26): fairy lights, and Victorian narrates the weekly recap.
   Valentine's Day: hearts, and Super Supportive won't stop butting in.
   April Fools' Day: Chaos mode, whether you like it or not.
   Meteor showers (Perseids, Geminids and five more, on their peak nights): shooting stars all night, the cat
   stays up to watch, and the Conspiracist has questions.
   International Cat Day (Aug 8): the Cat takes over the greeting, heckles all day, and the pet wears a crown.
   First snow: the first snow the live sky sees after a snowless summer; every voice has something to say.
   Daylight saving: the day the clocks change, wherever you are. Monday mourns the lost hour; Night Owl loves the extra one.
   Full moon nights: Ghost, Night Owl or the Conspiracist come out, and the cat gets the zoomies.
   Grand Theft Auto VI (19 Nov 2026, gamer setup only): a week's countdown, then every voice has a take.
   Opposite Day (Jan 25): every voice talks like its opposite. Monday is thrilled. The controls don't change.
   New Year's Eve: fireworks (see js/sky.js).
   Voyager 1 light-day (18 Nov 2026, once): see js/voyager.js. */
(function (SP) {
  'use strict';
  const S = () => SP.store.state;
  const V = SP.voice.list;

  function season(now) {
    const m = (now || new Date()).getMonth(), south = S().location && S().location.lat < 0;
    const n = m >= 2 && m <= 4 ? 0 : m >= 5 && m <= 7 ? 1 : m >= 8 && m <= 10 ? 2 : 3;
    return ['spring', 'summer', 'autumn', 'winter'][south ? (n + 2) % 4 : n];
  }

  const pad2 = (n) => String(n).padStart(2, '0');
  const dkey = (d) => d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  const dayBefore = (d) => { const y = new Date(d); y.setDate(y.getDate() - 1); return y; };
  /* "The night of" a date: from 18:00 that evening until 06:00 the next morning. */
  const nightOf = (test) => (d) => (d.getHours() >= 18 && test(d)) || (d.getHours() < 6 && test(dayBefore(d)));

  /* ---- Full moons: the exact time, from Meeus' Astronomical Algorithms (ch. 49), good to a few minutes.
     The plain average cycle can be 14 hours out, which is often the wrong night. ---- */
  const rad = Math.PI / 180;
  function fullMoonAt(k) { // k: whole lunations since Jan 2000
    k += 0.5; const T = k / 1236.85, E = 1 - 0.002516 * T - 0.0000074 * T * T;
    const M = (2.5534 + 29.1053567 * k - 0.0000014 * T * T) * rad;
    const Mp = (201.5643 + 385.81693528 * k + 0.0107582 * T * T + 0.00001238 * T ** 3) * rad;
    const F = (160.7108 + 390.67050284 * k - 0.0016118 * T * T - 0.00000227 * T ** 3) * rad;
    const Om = (124.7746 - 1.56375588 * k + 0.0020672 * T * T) * rad;
    const jde = 2451550.09766 + 29.530588861 * k + 0.00015437 * T * T
      - 0.40614 * Math.sin(Mp) + 0.17302 * E * Math.sin(M) + 0.01614 * Math.sin(2 * Mp) + 0.01043 * Math.sin(2 * F)
      + 0.00734 * E * Math.sin(Mp - M) - 0.00514 * E * Math.sin(Mp + M) + 0.00209 * E * E * Math.sin(2 * M) - 0.00111 * Math.sin(Mp - 2 * F)
      - 0.00057 * Math.sin(Mp + 2 * F) + 0.00056 * E * Math.sin(2 * Mp + M) - 0.00042 * Math.sin(3 * Mp) + 0.00042 * E * Math.sin(M + 2 * F)
      + 0.00038 * E * Math.sin(M - 2 * F) - 0.00024 * E * Math.sin(2 * Mp - M) - 0.00017 * Math.sin(Om);
    return new Date((jde - 2440587.5) * 864e5);
  }
  /* The first full moon after a moment. */
  function nextFullMoon(now) {
    const t = +(now || new Date()); let k = Math.floor((t - Date.UTC(2000, 0, 6)) / (29.530588861 * 864e5)) - 1;
    while (+fullMoonAt(k) <= t) k++;
    return fullMoonAt(k);
  }
  /* Full moon night: the full moon falls between noon that day and noon the next. */
  const fullMoonNight = (d) => { const noon = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12); return nextFullMoon(noon) - noon < 864e5; };

  /* ---- Daylight saving: today's UTC offset differs from yesterday's. Works anywhere, no table of rules. ---- */
  const offsetAt = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12).getTimezoneOffset();
  const clocks = (d) => Math.sign(offsetAt(dayBefore(d)) - offsetAt(d)); // 1: went forward, -1: went back

  /* ---- First snow: the first time the live sky shows snow after at least four months without any (js/sky.js). ---- */
  function noteWeather(kind, now) {
    if (kind !== 'snow') return false;
    now = now || new Date();
    const p = S().presence || (S().presence = {}), today = dkey(now), last = p.lastSnow ? new Date(p.lastSnow + 'T12:00') : null;
    if (p.lastSnow === today) return false;
    const first = !last || now - last > 120 * 864e5;
    if (first) p.firstSnow = today;
    p.lastSnow = today; SP.store.save({ quiet: true });
    return first;
  }
  const FIRST_SNOW = {
    neutral: 'First snow of the season.',
    monday: 'It’s snowing. Of course it is. The sky’s given up too.',
    supportive: 'IT’S SNOWING!!! Our first snow together!!! Every flake is a tiny hug from me ❄️💕',
    surfer: 'Dude. The rain’s gone solid. Is this… cold sand? From the sky?',
    professional: 'First snow of the quarter. Please continue to badge in as normal. Remote work is not approved.',
    therapist: 'The first snow. Notice what comes up for you. Childhood? Dread? Both are valid.',
    weepy: 'The first snow. It falls so softly. Like everything that’s ever been lost. *weeps into mittens*',
    victorian: 'Snow! Fetch the sleigh. And a shawl. And a second shawl.',
    brutal: 'It’s snowing. That’s not an excuse. Get up.',
    conspiracy: 'First snow. Look closer. Every flake different? Who checked? Nobody checked.',
    cat: 'Mrrp?! *paws at the window* Mrrrrow. *refuses to go outside*',
    narrator: 'And then, without warning, the first snow. They stopped what they were doing and looked out of the window. They pretended not to be excited.',
    owl: 'First snow, and it came at night. Like all the best things.',
    ghost: 'snow. it covers footprints. i like that.',
    parent: 'IT’S SNOWING!!! Wear a hat!!! Did you bring a hat? Text me when you’re home!!!',
  };

  /* ---- Grand Theft Auto VI: out 19 Nov 2026, thirteen years after the last one (Sep 2013). For the gamer starting
     setup only: a week's countdown, then every voice has a take on the day. Nobody else needs a game launch on their page.
     Just the name: no art, no look, nothing borrowed from the game. ---- */
  const gamer = () => S().profile === 'gamer'; // a game launch is a taste, not a holiday: only for those who said they care
  const GTA_DAY = (d) => gamer() && d.getFullYear() === 2026 && d.getMonth() === 10 && d.getDate() === 19;
  const GTA_SOON = (d) => gamer() && d.getFullYear() === 2026 && d.getMonth() === 10 && d.getDate() >= 12 && d.getDate() <= 18;
  const GTA = {
    neutral: 'Grand Theft Auto VI comes out today, thirteen years after the last one. Expect a quiet internet and a lot of sick days.',
    monday: 'Grand Theft Auto VI is out. Half the planet called in sick. The other half is pretending it didn’t. I’m here. Unfortunately.',
    supportive: 'GTA VI is out!!! If you’re playing, I’ll wait right here for you!!! If you’re not, we can hang out instead!!! Either way you win!!! 💕',
    surfer: 'Dude, GTA VI dropped. Thirteen years of waiting. Longest anyone’s ever waited for a set. Including me.',
    professional: 'Grand Theft Auto VI launches today. HR has received an unusual number of dentist appointments. All approved. None believed.',
    therapist: 'GTA VI is out. Thirteen years of anticipation is a lot to put on one day. Whatever you feel about it, playing or not, is valid.',
    weepy: 'Grand Theft Auto VI is finally here. Thirteen years. Some of the people who waited for it are all grown up now. *weeps into a controller*',
    victorian: 'I am told a moving-picture game of motorcar larceny is released today, and that the whole of society has taken to its bed. Scandalous.',
    brutal: 'GTA VI is out. People waited thirteen years for it. You can’t wait thirteen minutes before checking your phone.',
    conspiracy: 'Thirteen years. THIRTEEN. And it comes out the day after Voyager reached a light-day. Coincidence? Nothing is a coincidence.',
    cat: 'Mrrp. *sits on the controller* Meow. (No.)',
    narrator: 'Today, all over the world, millions of people told their employers they were unwell. They were not unwell. They had been waiting thirteen years.',
    owl: 'GTA VI is out. Finally, the whole world is going to be up as late as I am tonight.',
    ghost: 'everyone is inside today. the streets are empty. it feels like home.',
    parent: 'Is this the car game you’ve been talking about since you were little?! It’s OUT?! Don’t forget to eat!!! And sleep!!! And call us!!!',
  };

  /* Opposite Day: each voice speaks as its opposite. Pairs both ways; a voice whose opposite you haven't
     unlocked (or that has none) stays itself, so nobody gets a secret voice spoiled. All in: every line
     (labels, reactions, heckles, discoveries, level titles, Ask), the spoken voice and the voice's page styling
     come from the opposite. Who it is doesn't change: its name, bond, scores, the picker and every control. */
  const OPPOSITE = { monday: 'supportive', victorian: 'surfer', brutal: 'therapist', professional: 'conspiracy', weepy: 'parent', owl: 'ghost', cat: 'narrator' };
  for (const [a, b] of Object.entries(OPPOSITE)) OPPOSITE[b] = a;

  /* Meteor showers on their peak night (the evening of the date until dawn). Peaks drift by a day or so
     from year to year; the night of the date is close enough to see some. */
  const SHOWERS = [['Quadrantids', 0, 3], ['Lyrids', 3, 22], ['Eta Aquariids', 4, 5], ['Perseids', 7, 12], ['Orionids', 9, 21], ['Leonids', 10, 17], ['Geminids', 11, 13]];
  const peakNight = (m, day) => (d) => (d.getMonth() === m && d.getDate() === day && d.getHours() >= 18) || (d.getHours() < 6 && (() => { const y = new Date(d); y.setDate(y.getDate() - 1); return y.getMonth() === m && y.getDate() === day; })());
  const METEORS = SHOWERS.map(([name, m, day]) => ({
    id: 'meteors-' + name.toLowerCase().replace(/\W+/g, ''), when: peakNight(m, day), fx: ['meteors'], heckler: 'conspiracy', name: 'The ' + name + ' tonight',
    line: 'The ' + name + ' peak tonight, they say. Dozens of “meteors” an hour, all coming from the same point in the sky. The same point. Every year. Look up after dark and tell me that’s natural.',
    heckles: ['Those aren’t meteors. Meteors don’t keep a schedule.', ({ who }) => who + ' says it’s space dust. Space dust doesn’t come back on the same night every year.',
      'Count them. Then count them again. The numbers never match.', 'The cat’s watching them too. The cat knows.'],
    by: 'conspiracy',
  }));

  /* One-day events come first: when events overlap, the first one picks the visiting heckler and the host. */
  const EVENTS = [
    { id: 'gta6-soon', when: GTA_SOON, anon: true, name: 'Grand Theft Auto VI',
      line: (now) => { const n = 19 - now.getDate(); return n === 1 ? 'Tomorrow. Charge the controller. Clear the calendar. Thirteen years, and it’s nearly over.' : 'In ' + n + ' days. You’ve waited thirteen years. You can wait ' + n + ' more.'; } },
    { id: 'gta6', when: GTA_DAY, name: 'Grand Theft Auto VI', lines: GTA, heckler: ['brutal', 'professional'],
      heckles: { brutal: ['Nobody’s working today. That isn’t permission.', ({ who }) => who + ' thinks you’ll get things done today. Cute.', 'Yesterday humanity reached a light-day. Today it’s calling in sick to drive around fake Florida.'],
        professional: ['Reminder: “playtesting” is not a recognised form of leave.', 'Calendar update: all of today’s meetings have quietly cancelled themselves.', 'Yesterday a probe reached one light-day on 22 watts. Today the whole team is offline. Interesting priorities.'] } },
    { id: 'opposite', when: (d) => d.getMonth() === 0 && d.getDate() === 25, opposite: true, name: 'Opposite Day',
      line: 'It’s Opposite Day. Everyone talks like their opposite until midnight. The buttons still do what they say. Unfortunately.', by: 'monday' },
    { id: 'firstsnow', when: (d) => (S().presence || {}).firstSnow === dkey(d), name: 'First snow', lines: FIRST_SNOW, heckler: 'surfer',
      heckles: ['Duuude. The ocean’s gonna freeze. Can you surf ice? Asking for me.', 'Snow is just… slow rain, right? Rain that’s chilling.', ({ who }) => who + ' is being weird about the snow. I get it. It’s weird.'] },
    { id: 'dst-forward', when: (d) => clocks(d) > 0, name: 'The clocks went forward', by: 'monday', heckler: ['owl', 'monday'],
      line: 'The clocks went forward. An hour of your life, gone. Not that you were using it.',
      heckles: { owl: ['They stole an hour of NIGHT. I want it back.', 'Darkness at 20:00 was a good thing and they took it.'], monday: ['An hour. Gone. And nobody even apologised.', ({ who }) => who + ' acts like the missing hour is fine. It isn’t.'] } },
    { id: 'dst-back', when: (d) => clocks(d) < 0, name: 'The clocks went back', guest: 'owl', heckler: 'owl', by: 'owl',
      line: 'The clocks went back. AN EXTRA HOUR OF NIGHT. Best day of the year. I’m not wasting it on sleep.',
      heckles: ['An extra hour of dark tonight. I have plans. Big plans.', ({ who }) => who + ' got an extra hour and spent it asleep. Tragic.', 'Sunset at four now. Finally, a sensible schedule.'] },
    { id: 'fullmoon', when: nightOf(fullMoonNight), heckler: ['ghost', 'owl', 'conspiracy'], zoomies: true, name: 'Full moon',
      heckles: { ghost: ['full moon. we come out more. you’ve probably noticed.', ({ who }) => 'shh. ' + who + ' can’t see me. you can tonight.', 'the moon is so bright tonight. i can almost see myself.'],
        owl: ['FULL MOON. The night is basically day. The best of both.', 'The cat’s got the zoomies. Same, honestly.', ({ who }) => who + ' wants you in bed. The MOON wants you up.'],
        conspiracy: ['Full moon. Again. Exactly on schedule. Who’s keeping the schedule?', 'The cat knows something about the moon. Look at it. LOOK at it.', ({ who }) => who + ' hasn’t asked why the moon always shows us the same side. I have.'] } },
    { id: 'catday', when: (d) => d.getMonth() === 7 && d.getDate() === 8, guest: 'cat', heckler: 'cat', greeter: 'cat', crown: true, name: 'International Cat Day',
      line: 'Meow. Mrrp. Meeeeeow. (It’s Cat Day. The greeting is mine today. So is your chair.)', by: 'cat',
      heckles: ['Meow. (That was a no.)', 'Mrrp. *sits on this sentence*', ({ who }) => 'Hsss. (' + who + ' is in my sunbeam.)', '*knocks the summary off the table* Prrt.', 'Meow? Meow. Meow! (Feed me. Then the tasks.)'] },
    ...METEORS,
    { id: 'valentine', when: (d) => d.getMonth() === 1 && d.getDate() === 14, fx: ['hearts'], heckler: 'supportive', name: 'Valentine’s Day',
      line: 'Happy Valentine’s Day!!! I got you something. It’s me. I’m the gift. I’ll be in every summary today. 💕', by: 'supportive' },
    { id: 'fools', when: (d) => d.getMonth() === 3 && d.getDate() === 1, chaos: true, name: 'April Fools’ Day',
      line: 'Everyone’s talking at once today. Not my idea. I filed a complaint.', by: 'monday' },
    { id: 'haunted', when: (d) => d.getMonth() === 9 && d.getDate() >= 25, fx: ['bats'], guest: 'ghost', heckler: 'ghost', name: 'Haunted week',
      line: 'the house is haunted this week. by me. hello again.' },
    { id: 'yule', when: (d) => d.getMonth() === 11 && d.getDate() >= 20 && d.getDate() <= 26, fx: ['lights'], host: 'victorian', name: 'Yuletide',
      line: 'It is Yuletide. I shall be narrating your weekly account myself. Do sit up straight.', by: 'victorian' },
  ];

  /* Every event on today. They stack: effects add up, every guest visits, each gets its own banner. */
  function events(now) { if (S().seasons === false) return []; now = now || new Date(); return EVENTS.filter((e) => e.when(now)); }
  function event(now) { return events(now)[0] || null; }
  const first = (k, now) => { const e = events(now).find((x) => x[k]); return e ? e[k] : null; };

  /* Scene effects for the season and any events. Called by js/sky.js. */
  function fx(now, phase, weather) {
    if (S().seasons === false) return [];
    now = now || new Date();
    const out = [], se = season(now), wet = ['rain', 'storm', 'snow'].includes(weather);
    if (se === 'spring' && !wet) out.push('petals');
    if (se === 'summer' && phase === 'night' && !wet) out.push('summerflies');
    if (se === 'autumn' && !wet) out.push('leaves');
    if (se === 'winter' && !wet) out.push('flurries');
    for (const e of events(now)) for (const f of e.fx || []) if (!out.includes(f)) out.push(f);
    if (SP.birthday && SP.birthday.today(now)) out.push('balloons');
    return out;
  }

  /* Voices that drop by for an event, unlocked or not. */
  const guests = (now) => events(now).map((e) => e.guest).filter(Boolean);
  const guest = (now) => first('guest', now);
  /* The visiting heckler: the first event's first choice that you've unlocked (or that's visiting anyway). */
  function heckling(now) {
    const g = guests(now);
    for (const e of events(now)) for (const k of [].concat(e.heckler || [])) if (g.includes(k) || SP.voice.unlocked(k)) return { e, k };
    return null;
  }
  const heckler = (now) => { const h = heckling(now); return h ? h.k : null; };
  // The heckler's own lines for the occasion, if its event has any (one list, or one per voice).
  const heckles = (now) => { const h = heckling(now), x = h && h.e.heckles; return !x ? null : Array.isArray(x) ? x : x[h.k] || null; };
  const host = (now) => first('host', now);
  const greeter = (now) => first('greeter', now); // Cat Day: the cat takes the greeting
  const crown = (now) => !!first('crown', now);
  const zoomies = (now) => !!first('zoomies', now); // full moon: the cat runs about at night
  const forcedChaos = (now) => !!first('chaos', now);
  /* Who voice k speaks as right now (Opposite Day), or k itself. */
  function speaker(k, now) {
    const o = OPPOSITE[k];
    return o && first('opposite', now) && SP.voice.unlocked(k) && SP.voice.unlocked(o) ? o : k;
  }

  /* A small banner under the date for each event that's on, until you dismiss it. */
  const seenKey = (e) => e.id + new Date().getFullYear();
  function bannerHtml() {
    const p = S().presence || {}, now = new Date();
    return events(now).filter((e) => (e.line || e.lines) && !(p.events || {})[seenKey(e)]).map((e) => {
      // `lines`: one per voice, said by whoever you've picked (in their opposite's words on Opposite Day).
      const who = e.lines ? SP.voice.current() : V[e.by || e.guest] || V.neutral;
      let line = e.lines ? e.lines[SP.voice.speaker()] || e.lines.neutral : typeof e.line === 'function' ? e.line(now) : e.line;
      if (typeof line === 'function') line = line({ name: S().name });
      // anon: nobody's saying it, it's just news. html: live extras under the line (js/voyager.js).
      const said = e.anon || (who === V.neutral && e.lines) ? line : who.name + ': ' + line;
      return '<div class="g-event" data-event="' + e.id + '"><b>' + SP.ui.esc(e.name) + '</b> <span>' + SP.ui.esc(said) + (e.html ? e.html(now) : '') + '</span><button class="icon-btn" data-event-x aria-label="Dismiss ' + SP.ui.esc(e.name) + '">' + SP.icon('x', 14) + '</button></div>'; // a div: the live extras are blocks, which a <p> can't hold
    }).join('');
  }
  function bindBanner(root) {
    root.querySelectorAll('.g-event[data-event]').forEach((el) => { const e = EVENTS.find((x) => x.id === el.dataset.event); if (e && e.bind) e.bind(el); });
    root.querySelectorAll('[data-event-x]').forEach((b) => {
      b.onclick = () => {
        const e = EVENTS.find((x) => x.id === b.closest('[data-event]').dataset.event); if (!e) return;
        const p = S().presence || (S().presence = {}), ev = p.events || (p.events = {}); ev[seenKey(e)] = 1; SP.store.save({ quiet: true }); SP.app.renderHero();
      };
    });
  }

  SP.season = { season, events, event, fx, guests, guest, heckler, heckles, host, forcedChaos, greeter, crown, zoomies, speaker, noteWeather, nextFullMoon, fullMoonAt, clocks, SHOWERS, OPPOSITE, GTA, bannerHtml, bindBanner, EVENTS };
})(window.SP = window.SP || {});
