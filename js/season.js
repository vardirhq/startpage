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
   Opposite Day (Jan 25): every voice talks like its opposite. Monday is thrilled. The controls don't change.
   New Year's Eve: fireworks (see js/sky.js).
   Voyager 1 light-day (18 Nov 2026, once): the probe drifts across the sky, Night Owl stays up for it,
   and the banner says when a hello sent now would reach it. */
(function (SP) {
  'use strict';
  const S = () => SP.store.state;
  const V = SP.voice.list;

  function season(now) {
    const m = (now || new Date()).getMonth(), south = S().location && S().location.lat < 0;
    const n = m >= 2 && m <= 4 ? 0 : m >= 5 && m <= 7 ? 1 : m >= 8 && m <= 10 ? 2 : 3;
    return ['spring', 'summer', 'autumn', 'winter'][south ? (n + 2) % 4 : n];
  }

  /* Voyager 1 is one light-day from Earth at 10:16:07 UTC on 18 Nov 2026 (NASA/JPL projection). */
  const LIGHTDAY = Date.UTC(2026, 10, 18, 10, 16, 7);
  const hhmm = (t) => { const d = new Date(t); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); };

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
    { id: 'voyager', when: (d) => d.getFullYear() === 2026 && d.getMonth() === 10 && d.getDate() === 18, fx: ['voyager'], guest: 'owl', heckler: 'owl', name: 'Voyager 1: one light-day',
      line: (now) => +now < LIGHTDAY
        ? 'At ' + hhmm(LIGHTDAY) + ' today, Voyager 1 is one whole light-day from Earth. First thing we ever made to get that far. I’m staying up. I was staying up anyway.'
        : 'Voyager 1 is one light-day away. Say hello now and it hears you tomorrow at ' + hhmm(+now + 864e5) + '. Launched in 1977 and STILL not asleep. My hero.',
      heckles: ['Sorry, can’t talk, I’m watching a 49-year-old probe leave the solar system.', ({ who }) => who + ' thinks a day is a long time to wait for a reply. Voyager waits a day for everything.', 'Imagine being that far from home and still answering emails.'],
      by: 'owl' },
    { id: 'opposite', when: (d) => d.getMonth() === 0 && d.getDate() === 25, opposite: true, name: 'Opposite Day',
      line: 'It’s Opposite Day. Everyone talks like their opposite until midnight. The buttons still do what they say. Unfortunately.', by: 'monday' },
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
  const heckler = (now) => first('heckler', now);
  // The visiting heckler's own lines for the occasion, if its event has any.
  const heckles = (now) => { const e = events(now).find((x) => x.heckler); return (e && e.heckles) || null; };
  const host = (now) => first('host', now);
  const greeter = (now) => first('greeter', now); // Cat Day: the cat takes the greeting
  const crown = (now) => !!first('crown', now);
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
    return events(now).filter((e) => !(p.events || {})[seenKey(e)]).map((e) => {
      const who = V[e.by || e.guest] || V.neutral, line = typeof e.line === 'function' ? e.line(now) : e.line;
      return '<p class="g-event" data-event="' + e.id + '"><b>' + SP.ui.esc(e.name) + '</b> <span>' + SP.ui.esc(who.name + ': ' + line) + '</span><button class="icon-btn" data-event-x aria-label="Dismiss ' + SP.ui.esc(e.name) + '">' + SP.icon('x', 14) + '</button></p>';
    }).join('');
  }
  function bindBanner(root) {
    root.querySelectorAll('[data-event-x]').forEach((b) => {
      b.onclick = () => {
        const e = EVENTS.find((x) => x.id === b.closest('[data-event]').dataset.event); if (!e) return;
        const p = S().presence || (S().presence = {}), ev = p.events || (p.events = {}); ev[seenKey(e)] = 1; SP.store.save({ quiet: true }); SP.app.renderHero();
      };
    });
  }

  SP.season = { season, events, event, fx, guests, guest, heckler, heckles, host, forcedChaos, greeter, crown, speaker, SHOWERS, OPPOSITE, LIGHTDAY, bannerHtml, bindBanner, EVENTS };
})(window.SP = window.SP || {});
