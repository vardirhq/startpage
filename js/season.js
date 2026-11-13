/* Seasons and one-off events. The season shows up in whatever scene you picked (blossoms in spring,
   fireflies on summer nights, falling leaves in autumn, flurries in winter), flipped for the southern
   hemisphere. Events come and go with nothing to keep up:
   Haunted week (Oct 25–31): Ghost visits, even if you haven't unlocked it, and bats fly all week.
   Yule (Dec 20–26): fairy lights, and Victorian narrates the weekly recap.
   Valentine's Day: hearts, and Super Supportive won't stop butting in.
   April Fools' Day: Chaos mode, whether you like it or not.
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

  const EVENTS = [
    { id: 'voyager', when: (d) => d.getFullYear() === 2026 && d.getMonth() === 10 && d.getDate() === 18, fx: ['voyager'], guest: 'owl', heckler: 'owl', name: 'Voyager 1: one light-day',
      line: (now) => +now < LIGHTDAY
        ? 'At ' + hhmm(LIGHTDAY) + ' today, Voyager 1 is one whole light-day from Earth. First thing we ever made to get that far. I’m staying up. I was staying up anyway.'
        : 'Voyager 1 is one light-day away. Say hello now and it hears you tomorrow at ' + hhmm(+now + 864e5) + '. Launched in 1977 and STILL not asleep. My hero.',
      heckles: ['Sorry, can’t talk, I’m watching a 49-year-old probe leave the solar system.', ({ who }) => who + ' thinks a day is a long time to wait for a reply. Voyager waits a day for everything.', 'Imagine being that far from home and still answering emails.'],
      by: 'owl' },
    { id: 'haunted', when: (d) => d.getMonth() === 9 && d.getDate() >= 25, fx: ['bats'], guest: 'ghost', heckler: 'ghost', name: 'Haunted week',
      line: 'the house is haunted this week. by me. hello again.' },
    { id: 'yule', when: (d) => d.getMonth() === 11 && d.getDate() >= 20 && d.getDate() <= 26, fx: ['lights'], host: 'victorian', name: 'Yuletide',
      line: 'It is Yuletide. I shall be narrating your weekly account myself. Do sit up straight.', by: 'victorian' },
    { id: 'valentine', when: (d) => d.getMonth() === 1 && d.getDate() === 14, fx: ['hearts'], heckler: 'supportive', name: 'Valentine’s Day',
      line: 'Happy Valentine’s Day!!! I got you something. It’s me. I’m the gift. I’ll be in every summary today. 💕', by: 'supportive' },
    { id: 'fools', when: (d) => d.getMonth() === 3 && d.getDate() === 1, chaos: true, name: 'April Fools’ Day',
      line: 'Everyone’s talking at once today. Not my idea. I filed a complaint.', by: 'monday' },
  ];

  function event(now) { if (S().seasons === false) return null; now = now || new Date(); return EVENTS.find((e) => e.when(now)) || null; }

  /* Scene effects for the season and any event. Called by js/sky.js. */
  function fx(now, phase, weather) {
    if (S().seasons === false) return [];
    now = now || new Date();
    const out = [], se = season(now), wet = ['rain', 'storm', 'snow'].includes(weather);
    if (se === 'spring' && !wet) out.push('petals');
    if (se === 'summer' && phase === 'night' && !wet) out.push('summerflies');
    if (se === 'autumn' && !wet) out.push('leaves');
    if (se === 'winter' && !wet) out.push('flurries');
    const e = event(now); if (e && e.fx) out.push(...e.fx);
    if (SP.birthday && SP.birthday.today(now)) out.push('balloons');
    return out;
  }

  /* A voice that drops by for the event, unlocked or not. */
  const guest = (now) => { const e = event(now); return e && e.guest; };
  const heckler = (now) => { const e = event(now); return e && e.heckler; };
  const host = (now) => { const e = event(now); return e && e.host; };
  const heckles = (now) => { const e = event(now); return e && e.heckles; };
  const forcedChaos = (now) => { const e = event(now); return !!(e && e.chaos); };

  /* A small banner under the date while an event is on, until you dismiss it. */
  function bannerHtml() {
    const e = event(); if (!e) return '';
    const p = S().presence || {}, key = e.id + new Date().getFullYear();
    if ((p.events || {})[key]) return '';
    const who = V[e.by || e.guest] || V.neutral;
    const line = typeof e.line === 'function' ? e.line(new Date()) : e.line;
    return '<p class="g-event" data-event="' + e.id + '"><b>' + SP.ui.esc(e.name) + '</b> <span>' + SP.ui.esc(who.name + ': ' + line) + '</span><button class="icon-btn" data-event-x aria-label="Dismiss">' + SP.icon('x', 14) + '</button></p>';
  }
  function bindBanner(root) {
    const b = root.querySelector('[data-event-x]'); if (!b) return;
    b.onclick = () => { const e = event(), p = S().presence || (S().presence = {}), ev = p.events || (p.events = {}); ev[e.id + new Date().getFullYear()] = 1; SP.store.save({ quiet: true }); SP.app.renderHero(); };
  }

  SP.season = { season, event, fx, guest, heckler, heckles, host, forcedChaos, LIGHTDAY, bannerHtml, bindBanner, EVENTS };
})(window.SP = window.SP || {});
