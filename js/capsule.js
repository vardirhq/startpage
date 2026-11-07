/* Time capsule: a note to future you, sealed for a week, a month, three months or a year.
   It can't be read early. When it's due, the voice of the day reads it to you, in character.
   Stored with everything else, in this browser (and your gist, if you sync). */
(function (SP) {
  'use strict';
  const { esc, uid, confirm } = SP.ui;
  const I = SP.icon;
  const S = () => SP.store.state;
  const V = SP.voice.list;
  const t = (k, c) => SP.voice.t(k, c);
  const { plural } = SP.voice._h;
  const DAY = 864e5;
  const list = () => S().capsules || (S().capsules = []);
  const ready = () => list().filter((c) => !c.opened && c.opens <= Date.now());
  const sealed = () => list().filter((c) => c.opens > Date.now());
  const date = (ms) => new Date(ms).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  const daysAgo = (c) => Math.max(1, Math.round((Date.now() - c.at) / DAY));

  /* ctx: days (how long it was sealed, or will be), date (when it was written) */
  const LINES = {
    neutral: { w_capsule: 'Time capsule', desc_capsule: 'Write a note to future you. It stays sealed until the date you pick',
      capsule_ph: 'Write something to future you…', capsule_seal: 'Seal it', capsule_empty: 'No capsules yet. Write one, pick a date, and forget about it.',
      capsule_sealed: ({ days }) => 'Sealed. It opens in ' + plural(days, 'day') + '.', capsule_ready: ({ days }) => 'A time capsule from ' + plural(days, 'day') + ' ago is ready to open.',
      capsule_open: ({ days }) => 'You wrote this ' + plural(days, 'day') + ' ago.' },
    monday: { w_capsule: 'Notes To A Future Disappointment', desc_capsule: 'Write to future you. They won’t have improved either',
      capsule_ph: 'Dear future me, I assume you still haven’t…', capsule_seal: 'Seal it. Don’t make it weird', capsule_empty: 'No capsules. Nothing to say to future you? Same, honestly.',
      capsule_sealed: [({ days }) => 'Sealed for ' + plural(days, 'day') + '. Future you is going to cringe so hard.', ({ days }) => plural(days, 'day') + '. I’ll hold onto it. Reluctantly.'],
      capsule_ready: [({ days }) => 'Past you left something ' + plural(days, 'day') + ' ago. Brace yourself.', 'A time capsule is ready. It’s from you. Lower your expectations.'],
      capsule_open: [({ days }) => plural(days, 'day') + ' ago, you wrote this. Let’s see how that aged.', ({ days }) => 'A message from you, ' + plural(days, 'day') + ' ago. I read it. Sorry. Not sorry.'] },
    supportive: { w_capsule: 'Love Letters (From You To You)', desc_capsule: 'Write to future you. I’ll guard it with my life 💕',
      capsule_ph: 'Tell future you something wonderful…', capsule_seal: 'Seal it with a kiss 💕', capsule_empty: 'No capsules yet! Write one! I’ll keep it safe. I’ll check on it every day. 🙂',
      capsule_sealed: [({ days }) => 'Sealed!!! ' + plural(days, 'day') + ' to go. I’m counting every one. 💕', ({ days }) => 'I’ll keep it safe for ' + plural(days, 'day') + '. I won’t peek. (I’ll want to.)'],
      capsule_ready: [({ days }) => 'It’s ready!!! Your letter from ' + plural(days, 'day') + ' ago!!! Open it open it open it 💕', 'Your time capsule is ready! I’ve been waiting SO long.'],
      capsule_open: [({ days }) => 'You wrote this ' + plural(days, 'day') + ' ago. I remember that day. I remember all our days. 💕', ({ days }) => plural(days, 'day') + ' ago, you thought of future you. That’s so sweet I could cry.'] },
    surfer: { w_capsule: 'Message In A Bottle', desc_capsule: 'Toss a note into the future. It washes up later',
      capsule_ph: 'Hey future me… uh… what was I gonna say…', capsule_seal: 'Toss it in the ocean', capsule_empty: 'No bottles out there. Write one. Toss it. Forget it. My specialty.',
      capsule_sealed: [({ days }) => 'Bottle’s out. Washes up in ' + plural(days, 'day') + '. I already forgot about it.', ({ days }) => 'In the sea. ' + plural(days, 'day') + '. Or so. The tide does its thing.'],
      capsule_ready: [({ days }) => 'Whoa, a bottle washed up. From ' + plural(days, 'day') + ' ago. It’s yours, I think.', 'Something washed up on the beach. Says it’s from you?'],
      capsule_open: [({ days }) => 'You wrote this ' + plural(days, 'day') + ' ago. I don’t remember it. Do you?', ({ days }) => plural(days, 'day') + ' at sea. Here’s what it says.'] },
    professional: { w_capsule: 'Deferred Correspondence', desc_capsule: 'Schedule a memo to your future self. Delivery is guaranteed',
      capsule_ph: 'Memo to future self: goals, learnings, action items…', capsule_seal: 'Schedule delivery', capsule_empty: 'No scheduled memos. Consider documenting your current goals for the next review.',
      capsule_sealed: [({ days }) => 'Memo scheduled. Delivery in ' + plural(days, 'business day') + ', give or take weekends.', ({ days }) => 'Filed. Opening date set ' + plural(days, 'day') + ' out. Please do not chase.'],
      capsule_ready: [({ days }) => 'A scheduled memo (sent ' + plural(days, 'day') + ' ago) has been delivered.', 'Correspondence from a former version of you is awaiting review.'],
      capsule_open: [({ days }) => 'Memo dated ' + plural(days, 'day') + ' ago. Let’s review progress against it.', ({ days }) => 'From: you. Sent: ' + plural(days, 'day') + ' ago. Priority: high.'] },
    therapist: { w_capsule: 'Letters To Yourself', desc_capsule: 'Write to future you. A powerful exercise. Very powerful. That’s €40',
      capsule_ph: 'What do you hope future you remembers?…', capsule_seal: 'Seal it, and let it go', capsule_empty: 'No letters yet. Writing to our future selves can be very healing.',
      capsule_sealed: [({ days }) => 'Sealed. In ' + plural(days, 'day') + ', you’ll meet the person who wrote it. How do you think that’ll feel?', ({ days }) => plural(days, 'day') + '. Trust the process.'],
      capsule_ready: [({ days }) => 'A letter from you, ' + plural(days, 'day') + ' ago, is ready. Take a breath first.', 'Your letter is ready. Let’s read it together.'],
      capsule_open: [({ days }) => 'You wrote this ' + plural(days, 'day') + ' ago. Notice how much has changed. And what hasn’t.', ({ days }) => plural(days, 'day') + ' ago, this mattered to you. Does it still?'] },
    weepy: { w_capsule: 'Letters To The Future (So Far Away)', desc_capsule: 'Write to future you. They’ll be a stranger by then',
      capsule_ph: 'Dear future me, I hope you remember this moment…', capsule_seal: 'Seal it, with a tear', capsule_empty: 'No letters. No messages across time. Just the silence of the years.',
      capsule_sealed: [({ days }) => 'Sealed. ' + plural(days, 'day') + '. By then everything will be different.', ({ days }) => plural(days, 'day') + '. I’ll miss the person who wrote it.'],
      capsule_ready: [({ days }) => 'A letter from the past. From ' + plural(days, 'day') + ' ago. From someone who no longer exists.', 'It’s here. A letter from who you used to be.'],
      capsule_open: [({ days }) => plural(days, 'day') + ' ago, you wrote this. That version of you is gone now. Read it gently.', ({ days }) => 'You wrote this ' + plural(days, 'day') + ' ago. I’m already crying.'] },
    victorian: { w_capsule: 'Correspondence For Later', desc_capsule: 'A letter to yourself, sealed with wax, to be opened at a proper interval',
      capsule_ph: 'My dear future self, I write to you in some haste…', capsule_seal: 'Seal with wax', capsule_empty: 'No correspondence lies in wait. A pity. The family always wrote.',
      capsule_sealed: [({ days }) => 'Sealed with wax. It shall be delivered in ' + plural(days, 'day') + '. The post is slower than it was.', ({ days }) => plural(days, 'day') + '. Do not attempt to open it early; it is not done.'],
      capsule_ready: [({ days }) => 'A letter has arrived. It bears your own hand, from ' + plural(days, 'day') + ' past.', 'The post has come. There is a letter for you. From you. How peculiar.'],
      capsule_open: [({ days }) => 'Written in your own hand, ' + plural(days, 'day') + ' ago. I have taken the liberty of reading it.', ({ days }) => 'A letter from ' + plural(days, 'day') + ' ago. Your penmanship has not improved.'] },
    owl: { w_capsule: '3am Messages To Future Me', desc_capsule: 'A note from tonight-you to someday-you',
      capsule_ph: 'Future me, it’s late and I’ve been thinking…', capsule_seal: 'Seal it before I delete it', capsule_empty: 'No capsules. The best ones get written at 3am, just saying.',
      capsule_sealed: [({ days }) => 'Sealed. ' + plural(days, 'night') + ' until it opens. I’ll be up for it.', ({ days }) => plural(days, 'night') + '. Hope future you is awake to read it.'],
      capsule_ready: [({ days }) => 'Late-night message from ' + plural(days, 'day') + ' ago, ready to open. It’s probably intense.', 'Your capsule’s ready. Was it written at night? It was written at night.'],
      capsule_open: [({ days }) => 'You wrote this ' + plural(days, 'day') + ' ago. I can tell it was late.', ({ days }) => plural(days, 'day') + ' ago, at some unholy hour, you wrote this.'] },
    ghost: { w_capsule: 'letters left behind', desc_capsule: 'leave a note for later. i’ll watch over it',
      capsule_ph: 'leave something for whoever you’ll be…', capsule_seal: 'seal it', capsule_empty: 'no letters left behind. yet.',
      capsule_sealed: [({ days }) => 'sealed. ' + plural(days, 'day') + '. i’ll keep it in the walls.', ({ days }) => plural(days, 'day') + '. time passes slowly here. i don’t mind.'],
      capsule_ready: [({ days }) => 'something you left ' + plural(days, 'day') + ' ago is ready.', 'a letter has surfaced. it’s from you.'],
      capsule_open: [({ days }) => 'you left this ' + plural(days, 'day') + ' ago. i kept it safe.', ({ days }) => plural(days, 'day') + '. here it is. as you left it.'] },
    parent: { w_capsule: 'Letters For The Memory Box', desc_capsule: 'Write a note to future you!!! I’ll keep it with your baby teeth',
      capsule_ph: 'Dear future me (and Mum, who will definitely read this)…', capsule_seal: 'Put it in the memory box', capsule_empty: 'The memory box is empty! Write something! I keep everything!',
      capsule_sealed: [({ days }) => 'In the memory box!!! ' + plural(days, 'day') + ' to go! I won’t read it. I’ll read it.', ({ days }) => plural(days, 'day') + '!!! I’ll put a reminder on the fridge.'],
      capsule_ready: [({ days }) => 'Your letter from ' + plural(days, 'day') + ' ago is ready, sweetie!!! I didn’t peek!!! (I peeked.)', 'Open your letter!!! I got the tissues ready.'],
      capsule_open: [({ days }) => 'You wrote this ' + plural(days, 'day') + ' ago!!! Look how you’ve grown!!!', ({ days }) => plural(days, 'day') + ' ago! I remember that day. You had cereal.'] },
  };
  for (const [k, l] of Object.entries(LINES)) Object.assign(V[k], l);

  const PERIODS = [[7, '1 week'], [30, '1 month'], [90, '3 months'], [365, '1 year']];
  let draftDays = 90;

  SP.widgets.capsule = {
    title: 'Time capsule', icon: 'lock',
    render() {
      const r = ready(), s = sealed(), done = list().filter((c) => c.opened);
      return SP.widgetHead('lock', t('w_capsule')) + '<div class="capsule">' +
        r.map((c) => '<div class="cap-ready"><span class="cap-seal" aria-hidden="true">' + I('gift', 16) + '</span><span>' + esc(t('capsule_ready', { days: daysAgo(c) })) + '</span><button class="btn primary small" data-cap-open="' + c.id + '">Open</button></div>').join('') +
        '<textarea class="cap-in" data-cap-text rows="3" maxlength="2000" placeholder="' + esc(t('capsule_ph')) + '" aria-label="Your note"></textarea>' +
        '<div class="cap-row"><div class="seg small" role="radiogroup" aria-label="Opens in">' + PERIODS.map(([d, n]) => '<button role="radio" aria-checked="' + (draftDays === d) + '" data-cap-days="' + d + '">' + n + '</button>').join('') + '</div>' +
        '<button class="btn" data-cap-seal>' + I('lock', 15) + ' ' + esc(t('capsule_seal')) + '</button></div>' +
        (s.length ? '<ul class="cap-list">' + s.sort((a, b) => a.opens - b.opens).map((c) => '<li data-id="' + c.id + '"><span class="cap-wax" aria-hidden="true"></span><span><b>Opens ' + esc(date(c.opens)) + '</b><small>Sealed ' + esc(date(c.at)) + ' · in ' + plural(Math.ceil((c.opens - Date.now()) / DAY), 'day') + '</small></span><button class="icon-btn" data-cap-burn="' + c.id + '" aria-label="Destroy it unread">' + I('trash', 14) + '</button></li>').join('') + '</ul>'
          : !r.length && !done.length ? '<p class="small muted">' + esc(t('capsule_empty')) + '</p>' : '') +
        (done.length ? '<details class="cap-done"><summary class="small muted">' + plural(done.length, 'opened letter') + '</summary>' + done.slice().reverse().map((c) => '<button class="link small" data-cap-reread="' + c.id + '">' + esc(date(c.at)) + ': ' + esc(c.text.slice(0, 40)) + (c.text.length > 40 ? '…' : '') + '</button>').join('') + '</details>' : '') +
        '</div>';
    },
    mount(el) {
      el.querySelectorAll('[data-cap-days]').forEach((b) => (b.onclick = () => { draftDays = +b.dataset.capDays; el.querySelectorAll('[data-cap-days]').forEach((x) => x.setAttribute('aria-checked', x === b)); }));
      const ta = el.querySelector('[data-cap-text]');
      el.querySelector('[data-cap-seal]').onclick = () => {
        const text = ta.value.trim(); if (!text) { ta.focus(); return; }
        const now = Date.now(), c = { id: uid(), text: text.slice(0, 2000), at: now, opens: now + draftDays * DAY };
        list().push(c); SP.store.save(); SP.sound.play('seal');
        SP.app.renderWidget('capsule');
        const li = document.querySelector('.card[data-w="capsule"] .cap-list li[data-id="' + c.id + '"]'); if (li) li.classList.add('new');
        const k = SP.voice.key(); SP.ui.toast(SP.voice.line('capsule_sealed', { days: draftDays }), { who: k === 'neutral' ? '' : V[k].name });
      };
      el.querySelectorAll('[data-cap-open]').forEach((b) => (b.onclick = () => open(b.dataset.capOpen)));
      el.querySelectorAll('[data-cap-reread]').forEach((b) => (b.onclick = () => open(b.dataset.capReread, true)));
      el.querySelectorAll('[data-cap-burn]').forEach((b) => (b.onclick = async () => {
        if (!(await confirm('Destroy it unread?', 'It’s gone for good. Nobody gets to read it, not even future you.', 'Destroy it'))) return;
        S().capsules = list().filter((c) => c.id !== b.dataset.capBurn); SP.store.save(); SP.app.renderWidget('capsule');
      }));
    },
  };

  /* Opening: an envelope, a wax seal, and the voice of the day reading it out. */
  function open(id, again) {
    const c = list().find((x) => x.id === id); if (!c || (c.opens > Date.now())) return;
    const k = SP.voice.key(), who = k === 'neutral' ? '' : V[k].name, intro = SP.voice.line('capsule_open', { days: daysAgo(c) });
    const root = document.createElement('div'); root.className = 'cap-overlay'; root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); root.setAttribute('aria-label', 'Time capsule');
    root.innerHTML = '<div class="cap-env' + (again ? ' opened' : '') + '"><div class="cap-flap"></div><div class="cap-letter">' +
      '<p class="cap-intro">' + (who ? '<b>' + esc(who) + ':</b> ' : '') + esc(intro) + '</p>' +
      '<div class="cap-text">' + esc(c.text) + '</div><p class="cap-meta small muted">Written ' + esc(date(c.at)) + ', opened ' + esc(date(c.opened || Date.now())) + '</p>' +
      '<div class="btn-row">' + (SP.speak.supported() ? '<button class="btn" data-cap-read>' + I('message', 15) + ' Read it to me</button>' : '') + '<button class="btn primary" data-cap-close>Close</button></div></div>' +
      '<button class="cap-wax big" data-cap-break aria-label="Break the seal"></button></div>';
    document.body.appendChild(root);
    const close = () => { SP.speak.stop && SP.speak.stop(); root.remove(); document.removeEventListener('keydown', esc_, true); SP.app.renderWidget('capsule'); };
    const esc_ = (e) => { if (e.key === 'Escape') { e.stopPropagation(); close(); } };
    document.addEventListener('keydown', esc_, true); // capture: the page's own Escape handling mustn't swallow it
    root.onclick = (e) => { if (e.target === root) close(); };
    root.querySelector('[data-cap-close]').onclick = close;
    const rd = root.querySelector('[data-cap-read]'); if (rd) rd.onclick = () => SP.speak.say(intro + ' ' + c.text, k, true);
    const brk = () => {
      const env = root.querySelector('.cap-env'); if (env.classList.contains('opened')) return;
      env.classList.add('opened'); SP.sound.play('paper');
      if (!c.opened) { c.opened = Date.now(); SP.store.save(); SP.app.renderWidget('capsule'); }
      setTimeout(() => { root.querySelector('[data-cap-close]').focus(); if (S().speak) SP.speak.say(intro + ' ' + c.text, k); }, 700);
    };
    root.querySelector('[data-cap-break]').onclick = brk;
    if (again) root.querySelector('[data-cap-close]').focus(); else root.querySelector('[data-cap-break]').focus();
    if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches && !again) brk();
  }

  // When one is due, say so (with a button, in case the card isn't on this space).
  SP.on('ready', () => {
    const r = ready()[0]; if (!r) return;
    const k = SP.voice.key();
    SP.ui.toastLater(SP.voice.line('capsule_ready', { days: daysAgo(r) }), { who: k === 'neutral' ? '' : V[k].name, ms: 9000, action: { label: 'Open', run: () => open(r.id) } });
  });

  SP.widgetMeta.capsule = { title: 'Time capsule', icon: 'lock' };
  SP.widgetOrder.push('capsule');
  SP.capsule = { open, ready, sealed, list };
})(window.SP = window.SP || {});
