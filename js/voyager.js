/* Voyager 1, one light-day from Earth. On 18 November 2026 at 10:16:07 UTC (NASA/JPL's projection), Voyager 1
   becomes the first thing people have ever made to be so far away that its signal takes a whole day to get home.
   Launched 5 September 1977, still talking to us on a 22-watt radio. This happens once, so the page makes a fuss:
   - The week before: a countdown banner, and the probe already crossing the sky.
   - The day: every voice has something to say, Night Owl visits, a live countdown to the second and then a
     distance counter, the probe crossing slowly and sending radio pulses home, and a celebration at the moment
     itself if you're here (or the first time you open a tab after).
   - Say hello: write Voyager a message. Nothing is transmitted, of course, but the page follows light that left
     when you sent it, the whole 25.9 billion km, and tells you when it would arrive: tomorrow, at the same time.
   All of it goes away with the rest of the events (Customize → Look → Seasons). */
(function (SP) {
  'use strict';
  const S = () => SP.store.state;
  const V = SP.voice.list;
  const esc = (s) => SP.ui.esc(s);

  const C = 299792.458;                                     // km/s
  const LIGHTDAY = Date.UTC(2026, 10, 18, 10, 16, 7);       // the moment
  const LD_KM = C * 86400;                                  // 25,902,068,371 km
  const SPEED = 17;                                         // km/s, roughly, outward (the distance from Earth also wobbles with Earth's orbit)
  const km = (t) => LD_KM + SPEED * (t - LIGHTDAY) / 1000;
  const n = (x) => Math.round(x).toLocaleString();
  const pad = (x) => String(x).padStart(2, '0');
  const hhmm = (t) => { const d = new Date(t); return pad(d.getHours()) + ':' + pad(d.getMinutes()); };
  const isDay = (d) => d.getFullYear() === 2026 && d.getMonth() === 10 && d.getDate() === 18;
  const soon = (d) => d.getFullYear() === 2026 && d.getMonth() === 10 && d.getDate() >= 11 && d.getDate() <= 17;
  const daysTo = (d) => 18 - d.getDate();
  function clock(ms) { // 4d 03:02:01, or 03:02:01
    const s = Math.max(0, Math.floor(ms / 1000)), d = Math.floor(s / 86400);
    return (d ? d + 'd ' : '') + pad(Math.floor(s / 3600) % 24) + ':' + pad(Math.floor(s / 60) % 60) + ':' + pad(s % 60);
  }
  const hms = (sec) => Math.floor(sec / 3600) + ' h ' + pad(Math.floor(sec / 60) % 60) + ' min ' + pad(Math.floor(sec) % 60) + ' s';

  /* ---- what each voice says on the day ---- */
  const LINES = {
    neutral: 'Today Voyager 1 becomes the first human-made object one light-day from Earth. Launched in 1977, and still talking to us.',
    monday: 'A machine from 1977 is a light-day away and still answers when it’s called. I can’t even answer my phone. Fine. It’s impressive.',
    supportive: 'A WHOLE LIGHT-DAY!!! It’s been flying for 49 years and it NEVER stopped calling home!!! That’s us!!! That’s what I’ll be like!!! 💕',
    surfer: 'Dude. Voyager’s been paddling out since 1977 and it still hasn’t reached the break. One light-day out. Longest paddle ever.',
    professional: 'Voyager 1 reaches one light-day today. Planned for five years, now in year 49, on a 22-watt radio. That is what exceeding expectations looks like.',
    therapist: 'Voyager 1 is a light-day away and still checks in every day. Distance doesn’t end a connection. That’s secure attachment. This one’s free.',
    weepy: 'It’s so far away now that even light needs a whole day to reach it. And it keeps going. It’s never coming home. *weeps into a star chart*',
    victorian: 'A contraption of the year 1977 now lies one full day’s light from Earth. Further than any explorer has ever gone, and with better manners.',
    brutal: 'A 49-year-old probe with less memory than this tab is a light-day away and still doing its job. What’s your excuse?',
    conspiracy: 'One light-day. To the SECOND. They planned this in 1977. Ask yourself what else they planned.',
    cat: 'Mrrp. *stares at one point in the sky for a very, very long time* Mrrrow.',
    narrator: 'Somewhere very far away, a small machine crossed a line nothing made by people had crossed before. Back on Earth, they opened a new tab and noticed.',
    owl: 'TODAY. One light-day. The first thing we ever made to get that far. I’ve been staying up for this for 49 years. Metaphorically.',
    ghost: 'it’s so far now. still sending messages home. i know how that feels.',
    parent: 'THAT’S OUR PROBE!!! A WHOLE LIGHT-DAY!!! We launched it in 1977 and LOOK AT IT NOW!!! And it still calls home!!! Every day!!!',
  };

  /* ---- your hello ---- */
  const hello = () => S().voyager || null;
  const inFlight = () => { const h = hello(); return h && h.sent && !h.delivered ? h : null; };
  // Light chasing a probe that's moving away: it needs a few seconds more than a day.
  const arrival = (sent) => sent + (km(sent) / (C - SPEED)) * 1000;
  function progress(h, now) { return Math.min(1, (now - h.sent) / (h.arrives - h.sent)); }

  /* The live part of the banner, refreshed every second without re-rendering the page. */
  function liveText(now) {
    now = +now;
    if (now < LIGHTDAY) return 'One light-day in ' + clock(LIGHTDAY - now) + ' · ' + n(km(now)) + ' km from Earth';
    return n(km(now)) + ' km from Earth · its signal takes ' + hms(km(now) / C) + ' to get here';
  }
  function helloHtml(h, now) {
    const p = progress(h, now);
    return '<div class="voy-hello"><div class="voy-bar" role="progressbar" aria-label="Your hello on its way to Voyager 1" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + Math.round(p * 100) + '"><i style="width:' + (p * 100).toFixed(3) + '%"></i></div>' +
      '<small data-voy-hello>' + esc(helloText(h, now)) + '</small></div>';
  }
  const helloText = (h, now) => '“' + h.msg + '” · ' + n(C * (now - h.sent) / 1000) + ' km out · arrives ' + (new Date(h.arrives).getDate() === new Date(now).getDate() ? 'today' : 'tomorrow') + ' at ' + hhmm(h.arrives);

  function extraHtml(now) {
    const h = hello(), today = isDay(new Date(now));
    return '<div class="voy-live" data-voy-live>' + esc(liveText(now)) + '</div>' +
      (h && !h.delivered ? helloHtml(h, now) : today && !h ? '<button class="btn voy-send" data-voy-send>' + SP.icon('sparkles', 14) + ' Say hello to Voyager</button>' : '');
  }
  function bind(el) { const b = el.querySelector('[data-voy-send]'); if (b) b.onclick = send; }

  async function send() {
    const now = Date.now(), at = arrival(now);
    const r = await SP.ui.dialog('Say hello to Voyager 1',
      '<p class="muted">Nothing is actually sent. But light that leaves Earth right now reaches Voyager 1 tomorrow at <b>' + esc(hhmm(at)) + '</b>, ' + n(km(at)) + ' km away. Write something, and we’ll follow it the whole way.</p>' +
      '<label class="field"><span>Your message</span><input name="msg" maxlength="140" required placeholder="Hello from Earth" autocomplete="off"></label>',
      { okText: 'Send at the speed of light' });
    const msg = r && String(r.msg || '').trim(); if (!msg) return;
    const t = Date.now();
    S().voyager = { msg, sent: t, arrives: arrival(t) }; SP.store.save();
    SP.sound.play('levelup');
    SP.ui.toast('On its way at 299,792 km a second. Your hello passes the Moon in about a second and a half, Mars in a few minutes, and reaches Voyager 1 tomorrow at ' + hhmm(arrival(t)) + '.', { who: 'Voyager 1 · sent', ms: 10000 });
    if (SP.eggs) setTimeout(() => SP.eggs.found('voyager'), 10500); // after the send message has had its moment
    SP.app.renderHero();
  }

  /* ---- the moment, delivery, and the live numbers ---- */
  const on = (id) => !!SP.season && SP.season.events().some((e) => e.id === id);
  function moment() {
    const p = S().presence || (S().presence = {}), ev = p.events || (p.events = {});
    if (ev.voyagerMoment || !on('voyager') || Date.now() < LIGHTDAY || document.visibilityState === 'hidden') return;
    ev.voyagerMoment = Date.now(); SP.store.save({ quiet: true });
    const late = Date.now() - LIGHTDAY > 10 * 6e4;
    SP.ui.toast((late ? 'It happened at ' + hhmm(LIGHTDAY) + ' today. ' : 'It just happened. ') + 'Voyager 1 is one light-day from Earth: ' + n(LD_KM) + ' km. Nothing people have made has ever been this far away. A message from it now takes a whole day to get home.', { who: 'Voyager 1', ms: 15000 });
    SP.sound.play('party');
    if (SP.anim && SP.anim.shower) SP.anim.shower(30);
    SP.app.renderHero();
  }
  function deliver() {
    const h = inFlight(); if (!h || Date.now() < h.arrives) return;
    h.delivered = Date.now(); SP.store.save();
    SP.ui.toast('Light that left when you said “' + h.msg + '” has just reached Voyager 1, ' + n(km(h.arrives)) + ' km away. It took a day. Nothing you’ve ever said has gone further.', { who: 'Voyager 1 · arrived', ms: 15000 });
    SP.sound.play('party');
    SP.app.renderHero();
  }
  function tick() {
    if (document.visibilityState === 'hidden') return;
    const now = Date.now();
    document.querySelectorAll('[data-voy-live]').forEach((x) => { x.textContent = liveText(now); });
    const h = hello();
    if (h && !h.delivered) {
      document.querySelectorAll('[data-voy-hello]').forEach((x) => { x.textContent = helloText(h, now); });
      document.querySelectorAll('.voy-bar').forEach((b) => { const p = progress(h, now); b.firstChild.style.width = (p * 100).toFixed(3) + '%'; b.setAttribute('aria-valuenow', Math.round(p * 100)); });
    }
    moment(); deliver();
  }
  if (typeof requestAnimationFrame === 'function') { // a real page (not the tests)
    setInterval(tick, 1000);
    document.addEventListener('visibilitychange', tick);
  }

  /* ---- the events (first in line: nothing else that day matters as much) ---- */
  SP.season.EVENTS.unshift(
    { id: 'voyager-soon', when: soon, fx: ['voyager'], anon: true, name: 'Voyager 1',
      line: (now) => (daysTo(now) === 1 ? 'Tomorrow' : 'In ' + daysTo(now) + ' days') + ', Voyager 1 becomes the first thing people have ever made to be a whole light-day from Earth.',
      html: extraHtml, bind },
    { id: 'voyager', when: isDay, fx: ['voyager'], guest: 'owl', heckler: 'owl', name: 'Voyager 1: one light-day', lines: LINES,
      heckles: ['Sorry, can’t talk, I’m watching a 49-year-old probe leave the solar system.', ({ who }) => who + ' thinks a day is a long time to wait for a reply. Voyager waits a day for everything.', 'Imagine being that far from home and still answering emails.', 'Its radio uses 22 watts. My night light uses more. LEGEND.'],
      html: extraHtml, bind },
    { id: 'voyager-hello', when: (d) => !isDay(d) && !!inFlight(), anon: true, name: 'Your hello',
      line: () => 'Still on its way to Voyager 1.', html: (now) => helloHtml(inFlight(), now) },
  );

  SP.voyager = { LIGHTDAY, LD_KM, km, arrival, liveText, LINES, send, tick };
})(window.SP = window.SP || {});
