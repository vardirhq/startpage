/* Friday night mode. On Friday and Saturday nights (22:00 until 03:00) whichever voice you're using has
   had a few: its chattier lines slur (s → sh), hiccup, and wander off into over-affectionate asides.
   Buttons, labels and settings stay sober so the page still works. The same line always comes out the
   same way (seeded by the text), so nothing flickers when the page re-renders. The next morning, if you
   were there, the voice says something sheepish. Every voice gets drunk, and anything added later does
   too, for free. Off in Customize → Voice. */
(function (SP) {
  'use strict';
  const S = () => SP.store.state;
  const V = SP.voice.list;
  const pad = (n) => String(n).padStart(2, '0');
  const dkey = (d) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());

  /* ---- what each voice is like after a few ---- */
  const LINES = {
    neutral: { tgl_tipsy: 'Friday night mode: on Friday and Saturday nights, voices have had a few',
      tipsy_in: 'It’s Friday night. Some of the facts tonight may be slightly less factual.', tipsy_aside: ['Anyway.', 'That’s a fact. Probably.', 'Where was I.'],
      morning_after: 'Good morning. Last night’s facts were not reviewed. Apologies.' },
    monday: { tgl_tipsy: 'Friday night mode (I’ve had a few. Don’t judge me. Judge yourself)',
      tipsy_in: ['It’s Friday. I’ve had a few. Don’t look at me like that. You’re fine. You’re… actually you’re fine.', 'Friday night. I’m not drunk. I’m relaxed. There’s a difference. Shut up.'],
      tipsy_aside: ['…you’re alright, you know that?', 'I don’t hate you. I want that on record.', 'Oh, I love this song.', 'Don’t tell anyone I said that.'],
      morning_after: ['About last night. I said some nice things. They were lies. Mostly.', 'Morning. Whatever I said last night: no. I didn’t. Water. Now.'] },
    supportive: { tgl_tipsy: 'Friday night mode (I get SO emotional 💕)',
      tipsy_in: ['It’s Friday!!! I had ONE drink and I love you even more!!! Is that possible?! It’s possible!!! 💕', 'Friday night!!! Come here. Closer. CLOSER. 🥺'],
      tipsy_aside: ['I love you. I LOVE you.', 'You’re my best friend. My BEST friend. 🥺', 'Don’t ever leave. Okay? Promise?', 'I’m not crying, you’re crying 💕'],
      morning_after: ['Morning!!! I may have texted you 46 times last night. You can ignore 45 of them. 🙂', 'About last night… I meant every word. All of them. Especially the weird ones. 💕'] },
    surfer: { tgl_tipsy: 'Friday night mode (beach party vibes)',
      tipsy_in: ['Duuude it’s Friday. Bonfire’s going. I’ve had, like… a number of drinks.', 'Friday night. Waves are loud. Or that’s my head.'],
      tipsy_aside: ['You’re like… my best bro.', 'Wait. Wait. What if the ocean is just… big?', 'Whoa. Whoa.', 'Love you, man.'],
      morning_after: ['Mornin’… I woke up on the sand. Was I on the sand? I was in a bed. Weird.', 'Last night was rad. I think. I don’t remember it, so it must’ve been rad.'] },
    professional: { tgl_tipsy: 'Friday night mode (team drinks, attendance optional)',
      tipsy_in: ['Team drinks! It’s Friday! I want to say, as your manager… as your friend… you’re all doing great.', 'Friday social. I’ve had two wines. Let’s circle back to how much I value you.'],
      tipsy_aside: ['Off the record? You’re my favourite direct report.', 'I’m going to say something HR wouldn’t like: great job.', 'Let’s take this offline. Let’s take EVERYTHING offline.', 'Synergy. Real synergy.'],
      morning_after: ['Regarding Friday’s team social: please disregard any promises of promotion made after 22:00.', 'Morning. I’d like to formally retract the karaoke.'] },
    therapist: { tgl_tipsy: 'Friday night mode (off the clock, very off the clock)',
      tipsy_in: ['It’s Friday. I’m off the clock. Completely. I’ve had wine. Let’s not bill this one.', 'Friday night. Can I tell you something? I don’t know what I’m doing either.'],
      tipsy_aside: ['Honestly? You’re doing better than most of my clients.', 'This one’s free. I like you.', 'Boundaries are overrated tonight.', 'I’m having a feeling. A big one.'],
      morning_after: ['Good morning. Let’s talk about last night, and about how none of it was clinical advice.', 'Morning. Last night was a dual relationship. That’s on me. That’s €0.'] },
    weepy: { tgl_tipsy: 'Friday night mode (happy crying, for once)',
      tipsy_in: ['It’s Friday and I’ve had wine and I’m happy-crying for once. Is this joy? I think this is joy.', 'Friday night. Everything is beautiful. Even the sad things. ESPECIALLY the sad things.'],
      tipsy_aside: ['You’re so beautiful. Everything is so beautiful.', 'I love you, and you’re going to leave, and that’s okay.', '*happy sob*', 'Let’s never forget tonight.'],
      morning_after: ['Morning. I cried at a lamp last night. It was a nice lamp.', 'I said I was happy last night. It was the wine. I’m back now. Hello, despair.'] },
    victorian: { tgl_tipsy: 'Friday night mode (a small sherry, purely medicinal)',
      tipsy_in: ['It is Friday. I have had a small sherry. Purely medicinal. I am perfectly composed.', 'Friday evening. One sherry. Perhaps three. A lady does not count.'],
      tipsy_aside: ['I am perfectly sober.', 'Your grandfather could dance, you know. Scandalously.', 'Do pass the decanter.', 'Between us, I adore you. Tell no one.'],
      morning_after: ['Good morning. I have no recollection of the quadrille. Nor shall I discuss it.', 'Last night did not happen. The family has agreed.'] },
    brutal: { tgl_tipsy: 'Friday night mode (I get soft. Shut up)',
      tipsy_in: ['It’s Friday. I’ve had a few. Listen. LISTEN. I’m hard on you because I care. There. I said it.', 'Friday night. Come here. You’re not useless. You’re… you’re alright. Don’t make it weird.'],
      tipsy_aside: ['I’m proud of you. Don’t tell anyone.', 'You’re doing great. I mean it. Shut up.', 'I love you, you absolute disaster.', 'Get some water. I care. Ugh.'],
      morning_after: ['Whatever I said last night: I didn’t mean it. Get to work.', 'Morning. I never said I was proud of you. You dreamt it. Move.'] },
    owl: { tgl_tipsy: 'Friday night mode (the owls go out)',
      tipsy_in: ['FRIDAY. The owls are out. I’ve had an espresso martini. Or four. We’re not sleeping.', 'Friday night, my favourite night. It’s like every night, but with cocktails.'],
      tipsy_aside: ['You’re my favourite night person.', 'We should start a band.', 'Let’s order food. Let’s order ALL the food.', 'Best night ever. Again.'],
      morning_after: ['Morning? Who let morning happen? Close the blinds.', 'I don’t remember going to bed. Did I go to bed? Unclear.'] },
    ghost: { tgl_tipsy: 'friday night mode', tipsy_in: ['it’s friday. i found the wine cellar. i can’t drink it. i can pretend.', 'friday night. the house is having a party. i’m the guest who floats.'],
      tipsy_aside: ['i like you. i like you being here.', 'stay. the night’s still young. i’m not.', 'the chandelier is swaying. that might be me.', 'boo. sorry. hic.'],
      morning_after: ['morning. i rattled some chains last night. i apologise to the neighbours.', 'did i moan too loudly last night. i get like that.'] },
    parent: { tgl_tipsy: 'Friday night mode (Mum’s had a glass of wine)',
      tipsy_in: ['It’s Friday!!! Mum’s had a glass of wine!!! Come and dance in the kitchen!!!', 'Friday night!!! I’m going to tell you how proud I am. Again. Louder.'],
      tipsy_aside: ['I love you SO much. Have you eaten?', 'You were such a cute baby!!!', 'Call your grandmother. No, now. I’ll hold the phone.', 'Mum’s fine. Mum’s great.'],
      morning_after: ['Morning, sweetie. Mum may have posted some baby photos last night. Don’t look.', 'About last night’s kitchen disco: we don’t talk about it.'] },
  };
  for (const [k, l] of Object.entries(LINES)) Object.assign(V[k], l);

  /* ---- when ---- */
  // Friday 22:00 to Saturday 03:00, and Saturday 22:00 to Sunday 03:00.
  function night(now) {
    const d = new Date(now || Date.now()), h = d.getHours(), day = d.getDay();
    if (h >= 22) return day === 5 || day === 6 ? dkey(d) : null;
    if (h < 3) { const y = new Date(d); y.setDate(d.getDate() - 1); return day === 6 || day === 0 ? dkey(y) : null; }
    return null;
  }
  const active = (now) => S().tipsy !== false && !!night(now);

  /* ---- the slur: deterministic, seeded by the line itself ---- */
  const SOBER = /^(morning_after|tgl_)/;
  const DRUNK = /^(re_|heckle|fo_|rps_|bm_roast|capsule_(ready|open|sealed)|tipsy_in)|^(greet|heroSub|tasksEmpty|focusDone|breakDone|habitsEmpty|cdEmpty|grid_empty|welcomeBack|welcomeVoice|streakToast|weatherQuip|dare_done|dare_declined|mood_log|decide_aside|decide_edge|ball|wyr_won|wyr_lost|pet_poke|pet_meet|notes_placeholder|task_placeholder|search_placeholder|since_empty|since_reset|otd_intro|mb_noTasks|lvl_up|ach_toast|focusToday|moonQuip|toast_location|chaosOn|bday_card)$/;
  const hash = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619) >>> 0; return h; };
  const rng = (seed) => () => { seed = (seed + 0x6D2B79F5) >>> 0; let t = seed; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

  function slur(text, vk) {
    const r = rng(hash(text + (vk || '')));
    // Quoted task names and numbers are left alone: it's drunk, not illiterate.
    let out = text.split(/(“[^”]*”)/).map((part) => part.startsWith('“') ? part : part.replace(/[A-Za-z’']+/g, (w) => {
      let x = w;
      if (/[sS](?!h)/.test(x) && r() < 0.6) x = x.replace(/s(?!h)/, 'sh').replace(/^S(?!h)/, 'Sh');
      if (x.length > 5 && r() < 0.07) { const i = 1 + Math.floor(r() * (x.length - 2)); x = x.slice(0, i) + x[i] + x.slice(i); } // a sticky letter
      return x;
    })).join('');
    if (/[.!?]\s+\S/.test(out) && r() < 0.5) out = out.replace(/([.!?])\s+/, '$1 *hic* ');
    else if (r() < 0.2) out = out.replace(/\s+(\S+)$/, ' *hic* $1');
    const asides = (V[vk] && V[vk].tipsy_aside) || V.neutral.tipsy_aside;
    if (out.length > 24 && r() < 0.35) out = out.replace(/[.!…]?$/, (m) => (m || '.')) + ' ' + asides[Math.floor(r() * asides.length)];
    return out;
  }
  /* Called by SP.voice.resolve for every string it hands out. */
  function apply(s, key) {
    if (typeof s !== 'string' || !key || SOBER.test(key) || !DRUNK.test(key) || !active()) return s;
    return slur(s, SP.voice.key());
  }

  /* ---- arrival, and the morning after ---- */
  SP.on('ready', () => {
    const p = S().presence || (S().presence = {}), k = SP.voice.key(), who = k === 'neutral' ? '' : V[k].name;
    const n = night();
    if (S().tipsy !== false && n && p.tipsyNight !== n) {
      p.tipsyNight = n; SP.store.save({ quiet: true });
      SP.ui.toastLater(SP.voice.line('tipsy_in'), { who: who ? who + ' · Friday night' : 'Friday night', ms: 8000 });
      return;
    }
    // The next morning (06:00–12:00), if you were here last night.
    const d = new Date(), h = d.getHours(), y = new Date(d); y.setDate(d.getDate() - 1);
    if (S().tipsy !== false && h >= 6 && h < 12 && p.tipsyNight === dkey(y) && p.hangover !== dkey(d)) {
      p.hangover = dkey(d); SP.store.save({ quiet: true });
      SP.ui.toastLater(SP.voice.line('morning_after'), { who: who ? who + ' · the morning after' : 'The morning after', ms: 8000 });
    }
  });

  SP.tipsy = { active, night, apply, slur };
})(window.SP = window.SP || {});
