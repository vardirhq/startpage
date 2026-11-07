/* More modules: Moon, On this day, Currency, Mood, Days since, Decide. All free, no API keys.
   On this day: Wikipedia's REST feed. Currency: Frankfurter (European Central Bank rates). */
(function (SP) {
  'use strict';
  const { esc, uid, form, menu } = SP.ui;
  const I = SP.icon;
  const S = () => SP.store.state;
  const V = SP.voice.list;
  const save = () => SP.store.save();
  const rerender = (id) => SP.app.renderWidget(id);
  const t = (k, c) => SP.voice.t(k, c);
  const head = SP.widgetHead;
  const W = SP.widgets;
  const pad = (n) => String(n).padStart(2, '0');
  const dkey = (d) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const pick = (k) => { const v = V[SP.voice.key()][k] !== undefined ? V[SP.voice.key()][k] : V.neutral[k]; return Array.isArray(v) ? v[Math.floor(Math.random() * v.length)] : v; };
  const say = (msg) => { if (!msg) return; const k = SP.voice.key(); SP.ui.toast(msg, { who: k === 'neutral' ? '' : V[k].name }); };

  /* ---------------- voiced copy ---------------- */
  const LINES = {
    neutral: {
      w_moon: 'Moon', w_onthisday: 'On this day', w_fx: 'Currency', w_mood: 'Mood', w_since: 'Days since', w_decide: 'Decide',
      desc_moon: 'Tonight’s moon phase, next full moon, and golden hour', desc_onthisday: 'What happened on this date in history (Wikipedia)', desc_fx: 'Currency converter with daily ECB rates',
      desc_mood: 'One-tap daily mood check-in, with a 30-day strip', desc_since: 'Counters for “days since…”, with a reset button', desc_decide: 'Coin, dice, a magic 8-ball and “pick one for me”',
      moonQuip: ({ phase, pct }) => phase + ', ' + pct + '% lit.', otd_intro: 'On this day:', mood_q: 'How are you today?', mood_log: ({ n }) => ['', 'Logged: rough day.', 'Logged: not great.', 'Logged: okay.', 'Logged: good.', 'Logged: great.'][n],
      since_empty: 'Nothing being counted. Add something with +.', since_reset: ({ title, n }) => '“' + title + '” reset after ' + n + (n === 1 ? ' day.' : ' days.'),
      decide_pickPh: 'Pizza, sushi, tacos', ball: ['It is certain.', 'Most likely.', 'Yes.', 'Ask again later.', 'Cannot predict now.', 'Don’t count on it.', 'No.', 'Very doubtful.'],
      decide_aside: ['Decided.'], wr_mood: ({ avg }) => 'Average mood this week: ' + avg + ' out of 5.',
    },
    monday: {
      w_moon: 'A Rock, Glowing', w_onthisday: 'People Who Did Things', w_fx: 'Money You Don’t Have', w_mood: 'Feelings (Yours, Sadly)', w_since: 'Days Since You Messed Up', w_decide: 'Decisions You Can’t Make',
      desc_moon: 'The moon. It has a schedule. You could learn from it.', desc_onthisday: 'Proof that other people accomplished things today', desc_mood: 'Rate your day. I’ll rate it lower.',
      moonQuip: ({ phase, pct }) => phase + '. ' + pct + '% lit, which is ' + pct + '% more than your motivation.',
      otd_intro: 'On this day, people did things. Unlike you:', mood_q: 'How are you? (Keep it short)',
      mood_log: ({ n }) => ['', 'Rough day. Shocking. Truly nobody saw it coming.', 'Not great. Welcome to the club. There are no snacks.', 'Okay. The most Monday of all moods.', 'Good? Suspicious. What did you break?', 'Great?! Write down what you did so you can never repeat it.'][n],
      since_empty: 'Not counting anything. Optimistic of you.', since_reset: ({ title, n }) => '“' + title + '” lasted ' + n + (n === 1 ? ' day' : ' days') + '. A personal best, probably.',
      ball: ['Obviously.', 'Yes. Was that so hard?', 'Sure. Why not. Nothing matters.', 'No.', 'Absolutely not.', 'Ask someone who cares.', 'The answer was in you all along. Sadly.', 'You already know. You just want permission.'],
      decide_aside: ['The universe decided. You still have to do it.', 'There. Decided. Now you have no excuses.', 'Outsourcing decisions to a widget. Bold.'], wr_mood: ({ avg }) => 'Average mood: ' + avg + ' out of 5. Same as mine, honestly.',
    },
    supportive: {
      w_moon: 'Our Moon 🌙', w_onthisday: 'Today, In History (And In Us)', w_fx: 'For Our Trip', w_mood: 'How Are You (Really) 💕', w_since: 'Days Since', w_decide: 'Let Me Decide For You',
      moonQuip: ({ phase, pct }) => phase + '. ' + pct + '% lit. I’m looking at it too. Right now. Are you? 🙂', otd_intro: 'On this day in history (and on this day, I loved you):', mood_q: 'How are you? Really? Tell me everything 💕',
      mood_log: ({ n }) => ['', 'A rough day? Come here. I’m not letting go until it’s better. Or ever. 💕', 'Not great? Who did this? Give me names. 🙂', 'Just okay? I’ll make it better. I have a plan. It’s me.', 'Good!!! Was it because of me? 💕', 'GREAT!!! I knew it! I’m screaming! The neighbours are complaining again!'][n],
      since_reset: ({ title, n }) => n + ' days of “' + title + '”, and you reset it. That’s okay. I’ll count with you again. Forever.',
      ball: ['Yes!!! Always yes!!!', 'Definitely. I believe in you SO much.', 'Only if you take me with you.', 'Ask me again. I just like being asked. 🙂', 'No. Stay here. With me.', 'Signs point to me. They always point to me. 💕'],
      decide_aside: ['I decided for you. I’ll decide everything for you. 🙂', 'Done!!! Now you don’t have to think about anything but me.'], wr_mood: ({ avg }) => 'Your average mood was ' + avg + ' out of 5. I felt every point. 💕',
    },
    surfer: { w_moon: 'The Moon, Man', w_onthisday: 'Old Times', w_fx: 'Money Exchange', w_mood: 'Vibe Check', w_since: 'Days Since, Like…', w_decide: 'Flip It, Bro',
      moonQuip: ({ phase }) => phase + '. The moon does the tides, man. Think about that. …What were we talking about?', mood_q: 'Vibe check, dude?',
      ball: ['Totally.', 'For sure, bro.', 'Go with the flow, man.', 'Ask the ocean.', 'Nah, dude.', 'Whoa. Hazy. Like, really hazy.'], decide_aside: ['The coin has spoken, man.', 'Let the universe decide. Done. Stoked.'] },
    professional: { w_moon: 'Lunar Calendar', w_onthisday: 'Historical Benchmarks', w_fx: 'FX Rates', w_mood: 'Engagement Survey', w_since: 'Incident Tracker', w_decide: 'Decision Matrix',
      moonQuip: ({ phase, pct }) => 'Lunar status: ' + phase + ', ' + pct + '% utilisation.', mood_q: 'Quick pulse check (anonymous*):', mood_log: ({ n }) => 'Engagement score ' + n + '/5 recorded. *Not anonymous.',
      since_reset: ({ title, n }) => 'Incident logged: “' + title + '” after ' + n + ' days. Please file a post-mortem.',
      ball: ['Approved.', 'Let’s circle back on that.', 'Needs stakeholder alignment.', 'Not in this quarter.', 'Escalate to leadership.', 'Out of scope.'], decide_aside: ['Decision recorded. Accountability assigned to you.'] },
    therapist: { w_moon: 'Lunar Reflection', w_onthisday: 'Echoes Of The Past', w_mood: 'How Are You Feeling?', w_since: 'Patterns', w_decide: 'Let’s Explore Your Options',
      moonQuip: ({ phase }) => phase + '. The moon goes through phases too. And it doesn’t judge itself. €20.', mood_q: 'How are you feeling today? Take your time. (€2 a minute.)',
      mood_log: ({ n }) => ['', 'A hard day. Let’s sit with that. €40.', 'Not great. Thank you for being honest. That’s growth.', 'Okay is valid.', 'Good. What made it good? Let’s replicate it. Weekly.', 'Great! Notice that feeling. Write it down. Bring it next session.'][n],
      ball: ['What do you think the answer is?', 'And how would that make you feel?', 'It sounds like you already know.', 'Let’s explore that next week.', 'Yes. That’s €40.'], decide_aside: ['You let a coin decide. Interesting. Let’s unpack that.'] },
    weepy: { w_moon: 'The Lonely Moon', w_onthisday: 'Ghosts Of This Day', w_mood: 'How Sad Are You', w_since: 'Days Since (Counting The Pain)', w_decide: 'Fate',
      moonQuip: ({ phase }) => phase + '. Alone in the sky. Like me. *sniff*', mood_q: 'How are you? Be honest. I can take it. (I can’t.)',
      ball: ['Yes. *sobs with relief*', 'No. *collapses*', 'The stars are silent.', 'It was never meant to be.', 'Perhaps. Perhaps not. Everything ends anyway.'], decide_aside: ['Fate has chosen. It always does. *weeps*'] },
    victorian: { w_moon: 'The Moon (Unaccompanied)', w_onthisday: 'The Annals', w_fx: 'Foreign Exchange', w_mood: 'Your Constitution', w_since: 'Days Since The Last Scandal', w_decide: 'Leave It To Chance (Vulgar)',
      moonQuip: ({ phase }) => phase + '. In my day, one did not stare at the moon. It encouraged poetry.', otd_intro: 'On this day, people of quality did the following:', mood_q: 'And how is your constitution today?',
      mood_log: ({ n }) => ['', 'Poorly? Take some broth and stop complaining.', 'Out of sorts. A brisk walk will cure it.', 'Tolerable. That is all one can ask.', 'Well. Do not boast of it.', 'In high spirits? How unseemly. Lovely.'][n],
      since_reset: ({ title, n }) => n + ' days without “' + title + '”, and now this. The staff will talk.',
      ball: ['Certainly.', 'One would hope not.', 'Ask your grandfather. Oh. He’s dead.', 'Absolutely not, and do not ask again.', 'If you must.', 'It is not done.'], decide_aside: ['Leaving it to a coin. Your grandfather would have used a duel.'] },
    owl: { w_moon: 'My Moon', w_onthisday: 'Tonight In History', moonQuip: ({ phase, pct }) => phase + ', ' + pct + '% lit. The only light I trust.', ball: ['Yes. But do it at 3am.', 'Absolutely. Right now. Who needs sleep.', 'No. Sleep on it. (Don’t sleep.)'] },
    ghost: { w_moon: 'the moon, watching', w_onthisday: 'what happened, once', w_mood: 'how you are', moonQuip: ({ phase }) => phase.toLowerCase() + '. i used to watch it from the window.', ball: ['yes.', 'no.', 'it doesn’t matter now.', 'ask again. i’ll still be here.'] },
    parent: { w_moon: 'Look At The Moon, Sweetie', w_mood: 'How Was Your Day?', w_decide: 'Mum Decides', moonQuip: ({ phase }) => phase + '!!! Isn’t it beautiful? Wear a jacket if you go out to look.',
      mood_q: 'How was your day, sweetie?', mood_log: ({ n }) => ['', 'Oh no!!! Come here. Do you want soup? I’m making soup.', 'Not great? That’s okay. Tomorrow will be better. I’ll make pancakes.', 'Okay is good! Okay is great!', 'Good!!! I knew it!!!', 'GREAT!!! I’m telling everyone!!!'][n],
      ball: ['Yes, sweetie!', 'Of course!!!', 'Ask your father.', 'We’ll see.', 'Not before you finish your chores.'] },
  };
  for (const [k, l] of Object.entries(LINES)) Object.assign(V[k], l);

  /* ======================= Moon ======================= */
  const SYN = 29.530588853, REF = Date.UTC(2000, 0, 6, 18, 14);
  function moon(now) {
    const days = ((now || Date.now()) - REF) / 864e5, age = ((days % SYN) + SYN) % SYN, f = age / SYN;
    const illum = (1 - Math.cos(2 * Math.PI * f)) / 2;
    const names = ['New moon', 'Waxing crescent', 'First quarter', 'Waxing gibbous', 'Full moon', 'Waning gibbous', 'Last quarter', 'Waning crescent'];
    const name = names[Math.floor(((f * 8) + 0.5) % 8)];
    const cycle = Math.floor(days / SYN);
    const at = (x) => { let d = REF + (cycle + x) * SYN * 864e5; if (d < (now || Date.now())) d += SYN * 864e5; return new Date(d); };
    return { age, f, illum, name, nextFull: at(0.5), nextNew: at(1) };
  }
  function drawMoon(canvas, f, south) {
    const g = canvas.getContext('2d'), N = 32, r = 14, c = 15.5;
    g.clearRect(0, 0, N, N);
    const th = 2 * Math.PI * f, wax = f < 0.5;
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const dx = x - c, dy = y - c; if (dx * dx + dy * dy > r * r) continue;
      const w = Math.sqrt(r * r - dy * dy), xx = south ? -dx : dx;
      const lit = wax ? xx > w * Math.cos(th) : xx < -w * Math.cos(th);
      const crater = ((x * 7 + y * 13) % 23 === 0) || (Math.hypot(dx + 4, dy - 3) < 2.2) || (Math.hypot(dx - 5, dy + 5) < 1.6);
      g.fillStyle = lit ? (crater ? '#cfc8b0' : '#f2eedb') : (crater ? '#1e1b33' : '#2a2742');
      g.fillRect(x, y, 1, 1);
    }
  }
  const hm = (d) => pad(d.getHours()) + ':' + pad(d.getMinutes());
  W.moon = {
    title: 'Moon', icon: 'moon',
    render() {
      const m = moon(), wx = W.weather && W.weather.data, today = dkey(new Date());
      let sun = '';
      if (wx && wx.daily && wx.daily.sunset) {
        const i = Math.max(0, (wx.daily.time || []).indexOf(today)), set = new Date(wx.daily.sunset[i]), rise = new Date(wx.daily.sunrise[i]);
        if (!isNaN(set)) sun = '<li>' + I('weather', 14) + '<span>Golden hour</span><b>' + hm(new Date(set - 36e5)) + '–' + hm(set) + '</b></li><li>' + I('clock', 14) + '<span>Sunrise · sunset</span><b>' + hm(rise) + ' · ' + hm(set) + '</b></li>';
      }
      const fmt = (d) => d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
      const inDays = (d) => Math.max(0, Math.round((d - Date.now()) / 864e5));
      return head('moon', t('w_moon')) + '<div class="moon"><canvas width="32" height="32" data-moon aria-label="' + esc(m.name) + '"></canvas><div class="moon-info">' +
        '<b>' + esc(m.name) + '</b><small>' + esc(t('moonQuip', { phase: m.name, pct: Math.round(m.illum * 100) })) + '</small>' +
        '<ul class="moon-list"><li>' + I('moon', 14) + '<span>Next full moon</span><b>' + fmt(m.nextFull) + ' · ' + inDays(m.nextFull) + 'd</b></li>' +
        '<li>' + I('moon', 14) + '<span>Next new moon</span><b>' + fmt(m.nextNew) + ' · ' + inDays(m.nextNew) + 'd</b></li>' + sun + '</ul>' +
        (S().location ? '' : '<p class="small muted">Set your location to see golden hour.</p>') + '</div></div>';
    },
    mount(el) { const c = el.querySelector('[data-moon]'); if (c) drawMoon(c, moon().f, S().location && S().location.lat < 0); },
  };

  /* ======================= On this day ======================= */
  let otd = { data: null, loading: false, error: null, key: '', offset: 0 };
  W.onthisday = {
    title: 'On this day', icon: 'history',
    render() {
      const d = new Date(), key = pad(d.getMonth() + 1) + '/' + pad(d.getDate());
      if (otd.key !== key) { otd = { data: null, loading: false, error: null, key, offset: Math.floor(Math.random() * 5) }; }
      const tools = '<button class="icon-btn" data-otd-more title="Show others" aria-label="Show other events">' + I('shuffle', 16) + '</button>';
      if (!otd.data) return head('history', t('w_onthisday'), tools) + '<div class="empty">' + (otd.error ? '<span>' + esc(otd.error) + '</span><button class="btn small" data-otd-retry>Retry</button>' : '<span class="muted">Opening the archives…</span>') + '</div>';
      const list = otd.data, n = Math.min(3, list.length), items = Array.from({ length: n }, (_, i) => list[(otd.offset + i) % list.length]);
      return head('history', t('w_onthisday'), tools) + '<p class="otd-intro muted">' + esc(t('otd_intro')) + '</p><ul class="otd-list">' + items.map((e) =>
        '<li><b>' + esc(String(e.year)) + '</b>' + (e.url ? '<a href="' + esc(e.url) + '" target="_blank" rel="noopener" title="Read on Wikipedia">' + esc(e.text) + '</a>' : '<span>' + esc(e.text) + '</span>') + '</li>').join('') + '</ul>';
    },
    mount(el) {
      const m = el.querySelector('[data-otd-more]'); if (m) m.onclick = () => { otd.offset += 3; rerender('onthisday'); };
      const r = el.querySelector('[data-otd-retry]'); if (r) r.onclick = () => this.load(true);
      if (!otd.data && !otd.loading && !otd.error) this.load();
    },
    async load(force) {
      const key = otd.key, ck = 'otd:' + key;
      const cached = !force && SP.store.cache.get(ck, 24 * 36e5);
      if (cached) { otd.data = cached; return rerender('onthisday'); }
      otd.loading = true; otd.error = null;
      try {
        const r = await fetch('https://en.wikipedia.org/api/rest_v1/feed/onthisday/selected/' + key);
        if (!r.ok) throw new Error('Wikipedia returned ' + r.status);
        const j = await r.json();
        otd.data = (j.selected || []).map((e) => ({ year: e.year, text: e.text, url: e.pages && e.pages[0] && e.pages[0].content_urls && e.pages[0].content_urls.desktop ? e.pages[0].content_urls.desktop.page : '' })).filter((e) => e.text);
        if (!otd.data.length) throw new Error('Nothing for today');
        SP.store.cache.set(ck, otd.data);
      } catch (e) { otd.error = 'Couldn’t reach Wikipedia'; }
      otd.loading = false; rerender('onthisday');
    },
    reset() { otd.key = ''; },
  };

  /* ======================= Currency ======================= */
  const CUR = ['EUR', 'USD', 'GBP', 'NOK', 'SEK', 'DKK', 'CHF', 'JPY', 'CAD', 'AUD', 'NZD', 'PLN', 'CZK', 'HUF', 'ISK', 'CNY', 'HKD', 'SGD', 'KRW', 'INR', 'BRL', 'MXN', 'ZAR', 'TRY', 'ILS', 'THB', 'IDR', 'MYR', 'PHP', 'RON', 'BGN'];
  let fxState = { loading: false, error: null };
  const rates = () => SP.store.cache.get('fx:EUR', 7 * 864e5); // ECB updates once a working day; a week-old copy still beats nothing
  const fresh = () => SP.store.cache.get('fx:EUR', 12 * 36e5);
  async function loadRates(force) {
    if (fxState.loading || (!force && fresh())) return rates();
    fxState = { loading: true, error: null };
    try {
      const r = await fetch('https://api.frankfurter.dev/v1/latest?base=EUR');
      if (!r.ok) throw new Error('Rates service returned ' + r.status);
      const j = await r.json(); j.rates.EUR = 1;
      SP.store.cache.set('fx:EUR', { date: j.date, rates: j.rates });
    } catch (e) { fxState.error = 'Couldn’t load exchange rates'; }
    fxState.loading = false;
    return rates();
  }
  /* Convert with cached rates; null if we don't have them (yet). */
  function convertFx(n, from, to) {
    const r = rates(); if (!r) return null;
    const a = r.rates[from], b = r.rates[to];
    return a && b ? (n / a) * b : null;
  }
  const money = (n, code) => { try { return new Intl.NumberFormat(undefined, { style: 'currency', currency: code, maximumFractionDigits: n >= 100 ? 2 : 4 }).format(n); } catch (e) { return n.toFixed(2) + ' ' + code; } };
  W.fx = {
    title: 'Currency', icon: 'coins',
    render() {
      const s = S(), f = s.fx || (s.fx = { amount: 100, from: 'EUR', to: 'USD' }), r = rates();
      const opts = (sel) => CUR.map((c) => '<option' + (c === sel ? ' selected' : '') + '>' + c + '</option>').join('');
      const out = convertFx(+f.amount || 0, f.from, f.to);
      const others = ['USD', 'EUR', 'GBP', 'JPY', 'NOK'].filter((c) => c !== f.from && c !== f.to).slice(0, 3);
      return head('coins', t('w_fx'), '<button class="icon-btn" data-fx-refresh title="Refresh rates">' + I('sync', 16) + '</button>') +
        '<div class="fx"><div class="fx-row"><input type="number" inputmode="decimal" min="0" step="any" data-fx-amount value="' + esc(String(f.amount)) + '" aria-label="Amount">' +
        '<select data-fx="from" aria-label="From">' + opts(f.from) + '</select><button class="icon-btn" data-fx-swap aria-label="Swap currencies">' + I('shuffle', 16) + '</button><select data-fx="to" aria-label="To">' + opts(f.to) + '</select></div>' +
        (out == null ? '<p class="muted small">' + (fxState.error ? esc(fxState.error) + ' <button class="link" data-fx-refresh>Retry</button>' : 'Loading rates…') + '</p>'
          : '<div class="fx-out"><b>' + esc(money(out, f.to)) + '</b><small>1 ' + f.from + ' = ' + (convertFx(1, f.from, f.to)).toPrecision(5) + ' ' + f.to + '</small></div>' +
            '<ul class="fx-others">' + others.map((c) => '<li><span>' + c + '</span><b>' + esc(money(convertFx(+f.amount || 0, f.from, c), c)) + '</b></li>').join('') + '</ul>' +
            '<p class="fx-src muted">ECB rates via Frankfurter · ' + esc(r.date) + ' · also try “100 usd to eur” in search</p>') + '</div>';
    },
    mount(el) {
      const f = S().fx;
      const a = el.querySelector('[data-fx-amount]');
      a.oninput = () => { f.amount = a.value; save(); const keep = a.selectionStart; rerender('fx'); const n = document.querySelector('.w-fx [data-fx-amount]'); if (n) { n.focus(); try { n.setSelectionRange(keep, keep); } catch (e) { /* number inputs */ } } };
      el.querySelectorAll('[data-fx]').forEach((s) => (s.onchange = () => { f[s.dataset.fx] = s.value; save(); rerender('fx'); }));
      el.querySelector('[data-fx-swap]').onclick = () => { [f.from, f.to] = [f.to, f.from]; save(); rerender('fx'); };
      el.querySelectorAll('[data-fx-refresh]').forEach((b) => (b.onclick = () => loadRates(true).then(() => rerender('fx'))));
      if (!fresh() && !fxState.loading) loadRates().then(() => rerender('fx'));
    },
  };
  SP.fx = { convert: convertFx, load: loadRates, codes: CUR, money };

  /* ======================= Mood ======================= */
  const FACES = ['', '😞', '🙁', '😐', '🙂', '😄'], MOOD_C = ['', '#f87171', '#fb923c', '#facc15', '#a3e635', '#4ade80'];
  W.mood = {
    title: 'Mood', icon: 'smile',
    render() {
      const m = S().moods || {}, today = dkey(new Date()), cur = m[today];
      const days = Array.from({ length: 30 }, (_, i) => { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - 29 + i); return dkey(d); });
      const logged = days.filter((k) => m[k]), avg = logged.length ? (logged.reduce((a, k) => a + m[k], 0) / logged.length).toFixed(1) : null;
      return head('smile', t('w_mood')) + '<div class="mood"><p class="mood-q">' + esc(t('mood_q')) + '</p><div class="mood-pick" role="radiogroup" aria-label="Today’s mood">' +
        [1, 2, 3, 4, 5].map((n) => '<button role="radio" aria-checked="' + (cur === n) + '" data-mood="' + n + '" aria-label="' + ['', 'Rough', 'Not great', 'Okay', 'Good', 'Great'][n] + '">' + FACES[n] + '</button>').join('') + '</div>' +
        '<div class="mood-strip" aria-label="Last 30 days">' + days.map((k) => '<i title="' + esc(k + (m[k] ? ': ' + FACES[m[k]] : '')) + '"' + (m[k] ? ' style="background:' + MOOD_C[m[k]] + '"' : '') + '></i>').join('') + '</div>' +
        '<p class="small muted">' + (avg ? '30-day average ' + avg + ' / 5 · ' + logged.length + (logged.length === 1 ? ' day' : ' days') + ' logged' : 'Tap a face once a day. Only you see this.') + '</p></div>';
    },
    mount(el) {
      el.querySelectorAll('[data-mood]').forEach((b) => (b.onclick = () => {
        const n = +b.dataset.mood, m = S().moods || (S().moods = {}), k = dkey(new Date()), was = m[k];
        m[k] = n; save(); rerender('mood');
        if (was !== n) { SP.react.stat('moods'); say(t('mood_log', { n })); }
      }));
    },
  };

  /* ======================= Days since ======================= */
  const daysSince = (k) => { const [y, mo, d] = k.split('-').map(Number); const a = new Date(y, mo - 1, d), b = new Date(); b.setHours(0, 0, 0, 0); return Math.max(0, Math.round((b - a) / 864e5)); };
  W.since = {
    title: 'Days since', icon: 'history',
    render() {
      const list = S().since || [];
      return head('history', t('w_since'), '<button class="icon-btn" data-since-add aria-label="Add counter">' + I('plus', 20) + '</button>') +
        (list.length ? '<ul class="since-list">' + list.map((c) => { const n = daysSince(c.date);
          return '<li data-since="' + c.id + '"><b>' + n + '</b><span><strong>' + esc(c.title) + '</strong><small>' + (c.best ? 'Record: ' + c.best + ' days' : 'Since ' + esc(c.date)) + '</small></span>' +
            '<button class="btn small ghost" data-since-reset>' + I('reset', 14) + ' Reset</button><button class="icon-btn" data-since-more aria-label="More">' + I('more', 16) + '</button></li>'; }).join('') + '</ul>'
          : '<div class="empty muted">' + esc(t('since_empty')) + '</div>');
    },
    mount(el) {
      el.querySelector('[data-since-add]').onclick = () => this.add();
      el.querySelectorAll('[data-since]').forEach((li) => {
        const c = (S().since || []).find((x) => x.id === li.dataset.since);
        li.querySelector('[data-since-reset]').onclick = () => {
          const n = daysSince(c.date); c.best = Math.max(c.best || 0, n); c.date = dkey(new Date()); save(); rerender('since');
          say(t('since_reset', { title: c.title, n }));
        };
        li.querySelector('[data-since-more]').onclick = (e) => menu(e.currentTarget, [
          { icon: 'edit', label: 'Edit', action: () => this.add(c) },
          { icon: 'trash', label: 'Delete', danger: true, action: () => { S().since = S().since.filter((x) => x !== c); save(); rerender('since'); } },
        ]);
      });
    },
    async add(c) {
      const v = await form(c ? 'Edit counter' : 'New counter', [{ name: 'title', label: 'Days since…', value: c ? c.title : '', required: true, placeholder: 'I broke production' }, { name: 'date', label: 'Since', type: 'date', value: c ? c.date : dkey(new Date()) }], { okText: c ? 'Save' : 'Add' });
      if (!v) return;
      if (c) Object.assign(c, { title: v.title.trim(), date: v.date || c.date });
      else (S().since || (S().since = [])).push({ id: uid(), title: v.title.trim(), date: v.date || dkey(new Date()) });
      save(); rerender('since');
    },
  };

  /* ======================= Decide ======================= */
  let dec = { mode: 'coin', out: '', aside: '', spin: 0 };
  W.decide = {
    title: 'Decide', icon: 'dice',
    render() {
      const modes = { coin: 'Coin', die: 'Die', ball: '8-ball', pick: 'Pick' };
      return head('dice', t('w_decide')) + '<div class="decide"><div class="seg small" role="radiogroup" aria-label="Mode">' + Object.entries(modes).map(([k, n]) => '<button role="radio" aria-checked="' + (dec.mode === k) + '" data-dec-mode="' + k + '">' + n + '</button>').join('') + '</div>' +
        (dec.mode === 'pick' ? '<input class="dec-in" data-dec-opts placeholder="' + esc(t('decide_pickPh')) + '" value="' + esc(S().decideOpts || '') + '" aria-label="Options, separated by commas">' :
          dec.mode === 'ball' ? '<input class="dec-in" data-dec-q placeholder="Ask a yes/no question…" aria-label="Question">' : '') +
        '<button class="btn primary dec-go" data-dec-go>' + I('dice', 16) + ' ' + ({ coin: 'Flip', die: 'Roll', ball: 'Shake', pick: 'Pick one' }[dec.mode]) + '</button>' +
        (dec.out ? '<div class="dec-out' + (dec.spin ? ' spin' : '') + '" aria-live="polite"><b>' + esc(dec.out) + '</b>' + (dec.aside ? '<small>' + esc(dec.aside) + '</small>' : '') + '</div>' : '') + '</div>';
    },
    mount(el) {
      el.querySelectorAll('[data-dec-mode]').forEach((b) => (b.onclick = () => { dec = { mode: b.dataset.decMode, out: '', aside: '', spin: 0 }; rerender('decide'); }));
      const o = el.querySelector('[data-dec-opts]'); if (o) o.oninput = () => { S().decideOpts = o.value; save(); };
      el.querySelector('[data-dec-go]').onclick = () => {
        const R = () => Math.random();
        if (dec.mode === 'coin') dec.out = R() < 0.5 ? 'Heads' : 'Tails';
        else if (dec.mode === 'die') { const n = 1 + Math.floor(R() * 6); dec.out = '⚀⚁⚂⚃⚄⚅'[n - 1] + ' ' + n; }
        else if (dec.mode === 'ball') dec.out = pick('ball');
        else {
          const opts = (S().decideOpts || '').split(/[,\n;]/).map((x) => x.trim()).filter(Boolean);
          dec.out = opts.length ? opts[Math.floor(R() * opts.length)] : 'Add some options first';
        }
        dec.aside = dec.mode === 'ball' ? '' : pick('decide_aside');
        dec.spin = (dec.spin + 1) % 2 || 1; rerender('decide');
      };
    },
  };

  /* ---------------- registration ---------------- */
  Object.assign(SP.widgetMeta, {
    moon: { title: 'Moon', icon: 'moon' }, onthisday: { title: 'On this day', icon: 'history' }, fx: { title: 'Currency', icon: 'coins' },
    mood: { title: 'Mood', icon: 'smile' }, since: { title: 'Days since', icon: 'history' }, decide: { title: 'Decide', icon: 'dice' },
  });
  SP.widgetOrder.push('moon', 'onthisday', 'fx', 'mood', 'since', 'decide');
  SP.moon = moon;
})(window.SP = window.SP || {});
