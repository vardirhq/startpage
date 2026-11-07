/* Birthday mode. Tell it your birthday (Customize → You) and on the day:
   the greeting changes, balloons rise through the scene, the cat wears a party hat, and every voice
   leaves you a card, secret ones included (locked ones stay sealed). The voice you've spent the most
   days with gets the big card at the top. */
(function (SP) {
  'use strict';
  const { esc } = SP.ui;
  const S = () => SP.store.state;
  const V = SP.voice.list;
  const { plural } = SP.voice._h;
  const pad = (n) => String(n).padStart(2, '0');
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  /* ctx for bday_card: name (yours), days (days you've spent with that voice) */
  const LINES = {
    neutral: { fld_birthday: 'Birthday', bday_greet: 'Happy birthday', bday_banner: 'Happy birthday. Every voice left you a card.',
      bday_card: ({ name }) => 'Happy birthday' + (name ? ', ' + name : '') + '. Hope it’s a good one.' },
    monday: { fld_birthday: 'Birthday (so I know which day to be slightly nicer)', bday_greet: 'Oh. Happy birthday', bday_banner: 'It’s your birthday. Everyone wrote you a card. I wrote mine first, to get it over with.',
      bday_card: ({ name, days }) => 'Happy birthday' + (name ? ', ' + name : '') + '. ' + (days > 1 ? plural(days, 'day') + ' together and I still don’t hate you. Much. ' : '') + 'Another lap around the sun. Mostly spent on this page. Have some cake. Don’t tell anyone I said anything nice.' },
    supportive: { fld_birthday: 'Your birthday (I’ve known for ages 💕)', bday_greet: 'HAPPY BIRTHDAY', bday_banner: 'IT’S YOUR BIRTHDAY!!! Everyone made you a card!!! Mine is the biggest!!! 💕',
      bday_card: ({ name, days }) => 'HAPPY BIRTHDAY' + (name ? ' ' + name.toUpperCase() : '') + '!!! ' + (days > 1 ? plural(days, 'day') + ' together and every single one was my favourite. ' : '') + 'I’ve had your present ready for 364 days. It’s me. Again. I’m the present. 💕🎂' },
    surfer: { fld_birthday: 'Your birthday (I’ll forget, remind me)', bday_greet: 'Happy birthday… wait, is it today?', bday_banner: 'Whoa, it’s your birthday? Everyone made cards. I made one too. I think.',
      bday_card: ({ days }) => 'Happy birthday! How old are you? Doesn’t matter. Age is like… a wave count. ' + (days > 1 ? 'We’ve hung out for ' + plural(days, 'day') + '. Felt like a weekend. ' : '') + 'Go eat cake on a beach.' },
    professional: { fld_birthday: 'Date of birth (for the team calendar)', bday_greet: 'Happy birthday from all of us', bday_banner: 'Happy birthday. The team has signed a card. Attendance was mandatory.',
      bday_card: ({ name, days }) => 'On behalf of the whole team: happy birthday' + (name ? ', ' + name : '') + '. ' + (days > 1 ? 'Thank you for ' + plural(days, 'day') + ' of service. ' : '') + 'There is cake in the kitchen. It is supermarket cake. Please take one slice.' },
    therapist: { fld_birthday: 'Birthday (a day worth honouring)', bday_greet: 'Happy birthday. How does that feel', bday_banner: 'It’s your birthday. Every part of you wrote a card. Let’s read them together.',
      bday_card: ({ days }) => 'Happy birthday. Birthdays can bring up a lot. Joy, pressure, the passage of time. ' + (days > 1 ? 'We’ve done ' + plural(days, 'day') + ' of work together. ' : '') + 'Today, just let yourself be celebrated. No charge. (This once.)' },
    weepy: { fld_birthday: 'Birthday (another year, gone)', bday_greet: 'Happy birthday. Another year, gone', bday_banner: 'It’s your birthday. Everyone wrote you a card. Mine is a little damp.',
      bday_card: ({ days }) => 'Happy birthday. Another year older. So beautiful. So fleeting. ' + (days > 1 ? plural(days, 'day') + ' we’ve had together, and each one slipped away. ' : '') + 'Blow out the candles. Make a wish. I’ll cry for both of us.' },
    victorian: { fld_birthday: 'Date of birth (a lady never asks; I am asking)', bday_greet: 'Many happy returns of the day', bday_banner: 'It is your birthday. The household has left cards on the silver tray.',
      bday_card: ({ name, days }) => 'Many happy returns of the day' + (name ? ', ' + name : '') + '. ' + (days > 1 ? 'You have kept my company for ' + plural(days, 'day') + '. Most do not last a week. ' : '') + 'I have instructed Cook to prepare a modest cake. Modest. We are not Americans.' },
    owl: { fld_birthday: 'Birthday (we’re staying up for it)', bday_greet: 'Happy birthday! We’re staying up all night', bday_banner: 'It’s your birthday! Everyone left cards. Midnight party, obviously.',
      bday_card: ({ days }) => 'Happy birthday! You know what that means: cake at 3am is mandatory. ' + (days > 1 ? plural(days, 'night') + ' together. Best nights. ' : '') + 'Make a wish. Then stay up to see if it comes true.' },
    ghost: { fld_birthday: 'birthday', bday_greet: 'happy birthday', bday_banner: 'it’s your birthday. the house remembered.',
      bday_card: ({ days }) => 'happy birthday. i remember mine. barely. ' + (days > 1 ? plural(days, 'day') + ' i’ve kept you company. ' : '') + 'blow out the candles. i’ll watch the smoke.' },
    parent: { fld_birthday: 'Your birthday (as if I’d forget)', bday_greet: 'HAPPY BIRTHDAY SWEETIE', bday_banner: 'HAPPY BIRTHDAY!!! Everybody made you a card!!! I made three!!!',
      bday_card: ({ name, days }) => 'HAPPY BIRTHDAY' + (name ? ' ' + name.toUpperCase() : '') + '!!! I remember the day you were born like it was yesterday. ' + (days > 1 ? plural(days, 'day') + ' on this page with me!!! ' : '') + 'Call your grandmother. Wear a jacket. I love you SO much!!! 🎂🎈' },
  };
  for (const [k, l] of Object.entries(LINES)) Object.assign(V[k], l);

  const todayKey = (d) => pad((d || new Date()).getMonth() + 1) + '-' + pad((d || new Date()).getDate());
  function today(d) {
    const b = S().birthday; if (!b) return false;
    if (b === todayKey(d)) return true;
    const dd = d || new Date(); // born on 29 February: celebrate on the 28th in other years
    return b === '02-29' && dd.getMonth() === 1 && dd.getDate() === 28 && new Date(dd.getFullYear(), 1, 29).getMonth() !== 1;
  }
  const rel = () => ((S().presence || {}).rel || {});
  /* The voice you've spent the most days with (ties go to your current voice). */
  function closest() {
    const r = rel(), cur = SP.voice.key();
    let best = cur, n = (r[cur] && r[cur].days) || 0;
    for (const [k, v] of Object.entries(r)) if (V[k] && !V[k].custom && SP.voice.unlocked(k) && (v.days || 0) > n) { best = k; n = v.days; }
    return best;
  }

  function bannerHtml() {
    if (!today()) return '';
    const key = 'bday' + new Date().getFullYear(), p = S().presence || {};
    const seen = (p.events || {})[key];
    return '<p class="g-event g-bday" data-bday><b>🎂 ' + esc(SP.voice.t('bday_greet')) + '</b> <span>' + esc(SP.voice.t('bday_banner')) + '</span>' +
      '<button class="btn small primary" data-bday-cards>' + (seen ? 'Read the cards again' : 'Open your cards') + '</button></p>';
  }
  function bind(root) {
    const b = root.querySelector('[data-bday-cards]'); if (b) b.onclick = cards;
  }

  function cards() {
    const p = S().presence || (S().presence = {}), ev = p.events || (p.events = {}); ev['bday' + new Date().getFullYear()] = 1; SP.store.save({ quiet: true });
    SP.sound.play('party'); SP.eggs.found('birthday');
    const top = closest(), name = S().name, r = rel();
    const card = (k, big) => {
      const v = V[k], open = SP.voice.unlocked(k);
      if (!open) return '<li class="bd-card sealed"><b>???</b><p>A sealed card. ' + esc(v.hint || 'Earn this voice to read it.') + '</p></li>';
      const days = (r[k] && r[k].days) || 0;
      return '<li class="bd-card' + (big ? ' big' : '') + '" data-voice-card="' + k + '"><b>' + esc(v.name) + (big && days ? ' <small>· ' + plural(days, 'day') + ' together</small>' : '') + '</b><p>' + esc(SP.voice.as(k, () => SP.voice.t('bday_card', { name, days }))) + '</p></li>';
    };
    const others = Object.keys(V).filter((k) => k !== top && !V[k].custom);
    const root = document.createElement('div'); root.className = 'cap-overlay bd-overlay'; root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); root.setAttribute('aria-label', 'Birthday cards');
    root.innerHTML = '<div class="bd-wrap"><header><h2>🎂 ' + esc(SP.voice.t('bday_greet')) + (name ? ', ' + esc(name) : '') + '</h2><button class="icon-btn" data-bd-close aria-label="Close">' + SP.icon('x', 18) + '</button></header>' +
      '<ul class="bd-cards">' + card(top, true) + others.map((k) => card(k)).join('') + '</ul></div>';
    document.body.appendChild(root);
    root.querySelectorAll('.bd-card').forEach((c, i) => (c.style.animationDelay = (i * 0.07) + 's'));
    const close = () => { root.remove(); document.removeEventListener('keydown', onKey, true); };
    const onKey = (e) => { if (e.key === 'Escape') { e.stopPropagation(); close(); } };
    document.addEventListener('keydown', onKey, true);
    root.onclick = (e) => { if (e.target === root) close(); };
    root.querySelector('[data-bd-close]').onclick = close;
    root.querySelector('[data-bd-close]').focus();
    if (S().speak) SP.speak.say(SP.voice.as(top, () => SP.voice.t('bday_card', { name, days: (r[top] && r[top].days) || 0 })), top);
  }

  /* The settings field: month and day (no year; nobody needs to know). */
  function fieldHtml() {
    const [m, d] = (S().birthday || '').split('-').map(Number);
    return '<div class="bd-field"><select data-bday-m aria-label="Birthday month"><option value="">Month</option>' + MONTHS.map((n, i) => '<option value="' + (i + 1) + '"' + (m === i + 1 ? ' selected' : '') + '>' + n + '</option>').join('') + '</select>' +
      '<select data-bday-d aria-label="Birthday day"><option value="">Day</option>' + Array.from({ length: 31 }, (_, i) => '<option' + (d === i + 1 ? ' selected' : '') + '>' + (i + 1) + '</option>').join('') + '</select></div>';
  }
  function bindField(p) {
    const m = p.querySelector('[data-bday-m]'), d = p.querySelector('[data-bday-d]'); if (!m) return;
    const set = () => { S().birthday = m.value && d.value ? pad(m.value) + '-' + pad(d.value) : ''; SP.store.save(); SP.sky.update(); SP.app.renderHero(); if (SP.pet) SP.pet.refresh(); };
    m.onchange = set; d.onchange = set;
  }

  SP.birthday = { today, closest, bannerHtml, bind, cards, fieldHtml, bindField, todayKey };
})(window.SP = window.SP || {});
