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
  const { plural } = SP.voice._h;
  const W = SP.widgets;
  const pad = (n) => String(n).padStart(2, '0');
  const dkey = (d) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const pick = (k, ctx) => SP.voice.line(k, ctx);
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
      decide_aside: ['Decided.'], decide_edge: 'It landed on its edge. That almost never happens. Flip again.', wr_mood: ({ avg }) => 'Average mood this week: ' + avg + ' out of 5.',
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
      ball: ['Totally.', 'For sure, bro.', 'Go with the flow.', 'Ask the ocean.', 'Nah, dude.', 'Whoa. Hazy. Like, really hazy.'], decide_aside: ['The coin has spoken, man.', 'Let the universe decide. Done. Stoked.'] },
    professional: { w_moon: 'Lunar Calendar', w_onthisday: 'Historical Benchmarks', w_fx: 'FX Rates', w_mood: 'Engagement Survey', w_since: 'Incident Tracker', w_decide: 'Decision Matrix',
      moonQuip: ({ phase, pct }) => 'Lunar status: ' + phase + ', ' + pct + '% utilisation.', mood_q: 'Quick pulse check (anonymous*):', mood_log: ({ n }) => 'Engagement score ' + n + '/5 recorded. *Not anonymous.',
      since_reset: ({ title, n }) => 'Incident logged: “' + title + '” after ' + n + ' days. Please file a post-mortem.',
      ball: ['Approved.', 'Let’s circle back on that.', 'Needs stakeholder alignment.', 'Not in this quarter.', 'Escalate to leadership.', 'Out of scope.'], decide_aside: ['Decision recorded. Accountability assigned to you.'] },
    therapist: { w_moon: 'Lunar Reflection', w_onthisday: 'Echoes Of The Past', w_mood: 'How Are You Feeling?', w_since: 'Patterns', w_decide: 'Let’s Explore Your Options',
      moonQuip: ({ phase }) => phase + '. The moon goes through phases too. And it doesn’t judge itself. €20.', mood_q: 'How are you feeling today? Take your time. (€2 a minute.)',
      mood_log: ({ n }) => ['', 'A hard day. Let’s sit with that. €40.', 'Not great. Thank you for being honest. That’s growth.', 'Okay is valid.', 'Good. What made it good? Let’s replicate it. Weekly.', 'Great! Notice that feeling. Write it down. Bring it next session.'][n],
      ball: ['What do you think the answer is?', 'And how would that make you feel?', 'It sounds like you already know.', 'Let’s explore that next week.', 'Yes. That’s €40.'], decide_aside: ['You let a coin decide. Interesting. Let’s unpack that.'] },
    weepy: { w_moon: 'The Lonely Moon', w_onthisday: 'Ghosts Of This Day', w_mood: 'How Sad Are You', w_since: 'Days Since (Counting The Pain)', w_decide: 'Fate',
      moonQuip: ({ phase }) => phase + '. Alone in the sky. Like me, in a smaller sky.', mood_q: 'How are you? Be honest. I can take it. (I can’t.)',
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
    return { age, f, illum, name, nextFull: SP.season ? SP.season.nextFullMoon(new Date(now || Date.now())) : at(0.5), nextNew: at(1) }; // the exact full moon (js/season.js)
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
  /* ---------------- Decide ----------------
     Each mode has a little object that actually does the thing: a coin that arcs and flips, a die that
     tumbles in 3D, an 8-ball that shakes until the answer floats up, and a slot reel for "pick one".
     The result is chosen first; the animation just lands on it. Reduced motion skips straight to the end. */
  let dec = { mode: 'coin', out: '', aside: '', face: 0, busy: false };
  const still = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Which way the cube faces for each value (opposite faces add up to 7).
  const DIE = { 1: [0, 0], 2: [-90, 0], 3: [0, -90], 4: [0, 90], 5: [90, 0], 6: [0, 180] };
  const PIPS = { 1: [5], 2: [1, 9], 3: [1, 5, 9], 4: [1, 3, 7, 9], 5: [1, 3, 5, 7, 9], 6: [1, 3, 4, 6, 7, 9] };
  const dieFace = (n, cls) => '<i class="df ' + cls + '">' + [1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => '<b' + (PIPS[n].includes(i) ? ' class="on"' : '') + '></b>').join('') + '</i>';
  const HANDS = { rock: '✊', paper: '✋', scissors: '✌️' }, BEATS = { rock: 'scissors', paper: 'rock', scissors: 'paper' };
  const NAMES = { rock: 'Rock', paper: 'Paper', scissors: 'Scissors' };
  // The score is kept per voice. Beat one three times in a row and it starts peeking.
  const rpsScore = () => { const all = S().rps || (S().rps = {}), k = SP.voice.key(); return all[k] || (all[k] = { w: 0, l: 0, t: 0, run: 0 }); };
  // Two voices, one option each. Your voice usually gets a say.
  function wyrPair() {
    const pool = SP.voice.available().filter((k) => k !== 'neutral' && !V[k].custom && (V[k].wyr_opts || []).length);
    if (pool.length < 2) return null;
    const shuffle = (a) => a.map((x) => [Math.random(), x]).sort((p, q) => p[0] - q[0]).map((p) => p[1]);
    const cur = SP.voice.key(), mix = shuffle(pool);
    const a = pool.includes(cur) && Math.random() < 0.75 ? cur : mix[0], b = mix.find((k) => k !== a);
    const one = (k) => { const o = (V[SP.voice.speaker(k)].wyr_opts || []).length ? V[SP.voice.speaker(k)].wyr_opts : V[k].wyr_opts; return { k, text: o[Math.floor(Math.random() * o.length)] }; };
    return Math.random() < 0.5 ? { a: one(a), b: one(b) } : { a: one(b), b: one(a) };
  }
  const opts = () => (S().decideOpts || '').split(/[,\n;]/).map((x) => x.trim()).filter(Boolean);

  function stage() {
    const m = dec.mode;
    if (m === 'coin') {
      const r = dec.face === 'edge' ? 90 : dec.face === 'Tails' ? 180 : 0;
      return '<div class="dec-stage" data-stage aria-hidden="true"><div class="coin" data-obj style="transform: translateY(0) rotateX(' + r + 'deg)">' +
        '<i class="cf heads">' + SP.logo(34) + '</i><i class="cf tails"><span>T</span></i><i class="cf rim"></i></div><span class="dec-shadow" data-shadow></span></div>';
    }
    if (m === 'die') {
      const [x, y] = DIE[dec.face || 1];
      return '<div class="dec-stage" data-stage aria-hidden="true"><div class="die" data-obj style="transform: translateY(0) rotateX(' + x + 'deg) rotateY(' + y + 'deg)">' +
        dieFace(1, 'f1') + dieFace(6, 'f6') + dieFace(3, 'f3') + dieFace(4, 'f4') + dieFace(2, 'f2') + dieFace(5, 'f5') + '</div><span class="dec-shadow" data-shadow></span></div>';
    }
    if (m === 'ball') return '<div class="dec-stage" data-stage aria-hidden="true"><div class="ball" data-obj><span class="ball-win"><i class="tri' + (dec.out ? ' up' : '') + '" data-tri>' + (dec.out ? '' : '8') + '</i></span></div><span class="dec-shadow" data-shadow></span></div>';
    if (m === 'wyr') {
      const w = dec.wyr || (dec.wyr = wyrPair());
      if (!w) return '<div class="dec-stage wyr-stage" data-stage><p class="small muted">Unlock or pick a voice first.</p></div>';
      const opt = (side) => { const o = w[side], c = w.chosen ? (w.chosen === side ? ' won' : ' lost') : '';
        return '<button class="wyr-opt' + c + '" data-wyr="' + side + '"' + (w.chosen ? ' disabled' : '') + '><small>' + esc(V[o.k].name) + '</small><span>' + esc(o.text) + '</span></button>'; };
      return '<div class="dec-stage wyr-stage" data-stage><p class="wyr-q">Would you rather…</p>' + opt('a') + '<span class="wyr-or">or</span>' + opt('b') + '</div>';
    }
    if (m === 'rps') {
      const r = dec.rps || {}, them = SP.voice.current().name;
      return '<div class="dec-stage rps-stage" data-stage aria-hidden="true"><span class="hand me" data-me>' + (HANDS[r.you] || HANDS.rock) + '</span><span class="rps-vs">vs</span><span class="hand them" data-them>' + (HANDS[r.them] || HANDS.rock) + '</span>' +
        '<small class="rps-who">You</small><small class="rps-who r">' + esc(them) + '</small></div>';
    }
    const o = opts();
    return '<div class="dec-stage reel-stage" data-stage aria-hidden="true"><div class="reel" data-reel><div class="reel-strip" data-strip><span>' + esc(dec.out || (o[0] || '?')) + '</span></div></div></div>';
  }

  // A small burst of pixel confetti from the middle of the stage.
  function burst(st, n) {
    if (still()) return;
    const cols = ['var(--accent)', '#fbbf24', '#f472b6', '#34d399', '#60a5fa', '#fff'];
    for (let i = 0; i < n; i++) {
      const c = document.createElement('i'); c.className = 'confetti'; c.style.background = cols[i % cols.length]; st.appendChild(c);
      const a = Math.random() * Math.PI * 2, d = 40 + Math.random() * 70, dx = Math.cos(a) * d, dy = Math.sin(a) * d * 0.6 - 30;
      c.animate([{ transform: 'translate(0,0) rotate(0)', opacity: 1 }, { transform: 'translate(' + dx + 'px,' + dy + 'px) rotate(' + (Math.random() * 540) + 'deg)', opacity: 1, offset: 0.55 },
        { transform: 'translate(' + dx * 1.15 + 'px,' + (dy + 60) + 'px) rotate(' + (Math.random() * 720) + 'deg)', opacity: 0 }], { duration: 900 + Math.random() * 400, easing: 'cubic-bezier(.2,.7,.4,1)' }).finished.then(() => c.remove());
    }
  }

  async function play(el, result) {
    const st = el.querySelector('[data-stage]'), obj = el.querySelector('[data-obj]'), sh = el.querySelector('[data-shadow]');
    const snd = SP.sound.play;
    if (still() || !st || !st.animate) { if (dec.mode === 'coin') snd('clink'); else if (dec.mode === 'die') snd('clatter'); else if (dec.mode === 'pick') snd('win'); return; }
    const hop = (ms) => sh && sh.animate([{ transform: 'scale(1)', opacity: 0.5 }, { transform: 'scale(0.45)', opacity: 0.2, offset: 0.45 }, { transform: 'scale(1.1)', opacity: 0.55, offset: 0.8 }, { transform: 'scale(1)', opacity: 0.5 }], { duration: ms, easing: 'ease-out' });
    if (dec.mode === 'coin') {
      const from = dec.face === 'Tails' ? 180 : dec.face === 'edge' ? 90 : 0;
      const end = result === 'edge' ? 1890 : 1800 + (result === 'Tails' ? 180 : 0);
      const T = (y, r) => ({ transform: 'translateY(' + y + 'px) rotateX(' + r + 'deg)' });
      hop(1250); snd('flip'); setTimeout(() => snd('clink'), 1000);
      await obj.animate([T(0, from), Object.assign(T(-78, from + (end - from) * 0.55), { offset: 0.45 }), Object.assign(T(0, end - 20), { offset: 0.8 }), Object.assign(T(-10, end + 8), { offset: 0.9 }), T(0, end)],
        { duration: 1250, easing: 'cubic-bezier(.3,.6,.4,1)' }).finished;
      if (result === 'edge') await obj.animate([{ transform: 'translateY(0) rotateX(90deg) rotateZ(0)' }, { transform: 'translateY(0) rotateX(90deg) rotateZ(6deg)' }, { transform: 'translateY(0) rotateX(90deg) rotateZ(-6deg)' }, { transform: 'translateY(0) rotateX(90deg) rotateZ(0)' }], { duration: 700 }).finished;
    } else if (dec.mode === 'die') {
      const [x0, y0] = DIE[dec.face || 1], [x1, y1] = DIE[result];
      const ex = x1 + 720 + 360 * Math.floor(Math.random() * 2), ey = y1 + 360 + 360 * Math.floor(Math.random() * 2);
      const T = (ty, x, y) => ({ transform: 'translateY(' + ty + 'px) rotateX(' + x + 'deg) rotateY(' + y + 'deg)' });
      hop(1150); snd('clatter');
      await obj.animate([T(0, x0, y0), Object.assign(T(-64, x0 + (ex - x0) * 0.5, y0 + (ey - y0) * 0.5), { offset: 0.4 }), Object.assign(T(0, ex - 30, ey - 25), { offset: 0.72 }), Object.assign(T(-14, ex - 6, ey - 4), { offset: 0.86 }), T(0, ex, ey)],
        { duration: 1150, easing: 'cubic-bezier(.25,.6,.35,1)' }).finished;
      if (result === 6) burst(st, 26);
      if (result === 1) await obj.animate([T(0, ex, ey), { transform: 'translateY(2px) rotateX(' + (ex + 8) + 'deg) rotateY(' + ey + 'deg)' }, T(0, ex, ey)], { duration: 500, easing: 'ease-in-out' }).finished; // a sad little slump
    } else if (dec.mode === 'ball') {
      const tri = el.querySelector('[data-tri]'); if (tri) { tri.classList.remove('up'); tri.textContent = ''; }
      snd('shake'); setTimeout(() => snd('reveal'), 900);
      await obj.animate([0, -14, 12, -10, 9, -6, 4, -2, 0].map((x, i) => ({ transform: 'translateX(' + x + 'px) rotate(' + (i % 2 ? -1 : 1) * Math.min(12, Math.abs(x)) + 'deg)' })), { duration: 900, easing: 'ease-in-out' }).finished;
    } else if (dec.mode === 'rps') {
      const me = el.querySelector('[data-me]'), them = el.querySelector('[data-them]');
      me.textContent = them.textContent = HANDS.rock;
      const bob = [{ transform: 'translateY(0) rotate(0)' }, { transform: 'translateY(-16px) rotate(-14deg)', offset: 0.45 }, { transform: 'translateY(0) rotate(0)' }];
      for (let i = 0; i < 3; i++) { snd('pop'); await Promise.all([me.animate(bob, { duration: 260, easing: 'ease-in-out' }).finished, them.animate(bob, { duration: 260, easing: 'ease-in-out' }).finished]); }
      me.textContent = HANDS[result.you]; them.textContent = HANDS[result.them];
      const thump = [{ transform: 'scale(1.35)' }, { transform: 'scale(1)' }];
      me.animate(thump, { duration: 260, easing: 'cubic-bezier(.3,1.6,.5,1)' }); await them.animate(thump, { duration: 260, easing: 'cubic-bezier(.3,1.6,.5,1)' }).finished;
      if (result.outcome === 'win') { burst(st, 22); snd('win'); } else if (result.outcome === 'lose' || result.outcome === 'cheat') snd('lose'); else snd('pop');
      await new Promise((r) => setTimeout(r, 350));
    } else {
      const o = opts(); if (!o.length) return;
      const strip = el.querySelector('[data-strip]'), h = el.querySelector('[data-reel]').clientHeight || 44;
      const seq = []; for (let i = 0; i < 22; i++) seq.push(o[Math.floor(Math.random() * o.length)]); seq.push(result);
      strip.innerHTML = '<span>' + esc(dec.out || o[0]) + '</span>' + seq.map((x) => '<span>' + esc(x) + '</span>').join('');
      snd('reel', 1900);
      await strip.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(' + (-seq.length * h - 6) + 'px)', offset: 0.93 }, { transform: 'translateY(' + -seq.length * h + 'px)' }],
        { duration: 1900, easing: 'cubic-bezier(.12,.75,.2,1)', fill: 'forwards' }).finished;
      burst(st, 22); snd('win');
      await new Promise((r) => setTimeout(r, 250));
    }
  }

  W.decide = {
    title: 'Decide', icon: 'dice',
    render() {
      const modes = { coin: 'Coin', die: 'Die', ball: '8-ball', pick: 'Pick', rps: 'RPS', wyr: 'Rather' };
      return head('dice', t('w_decide')) + '<div class="decide' + (dec.busy ? ' busy' : '') + '"><div class="seg small" role="radiogroup" aria-label="Mode">' + Object.entries(modes).map(([k, n]) => '<button role="radio" aria-checked="' + (dec.mode === k) + '" data-dec-mode="' + k + '">' + n + '</button>').join('') + '</div>' +
        stage() +
        (dec.mode === 'pick' ? '<input class="dec-in" data-dec-opts placeholder="' + esc(t('decide_pickPh')) + '" value="' + esc(S().decideOpts || '') + '" aria-label="Options, separated by commas">' :
          dec.mode === 'ball' ? '<input class="dec-in" data-dec-q placeholder="Ask a yes/no question…" aria-label="Question">' : '') +
        (dec.mode === 'wyr'
          ? (dec.wyr && dec.wyr.chosen ? '<button class="btn dec-go" data-wyr-new>' + I('shuffle', 16) + ' Ask me another</button>' : '')
          : dec.mode === 'rps'
          ? '<div class="rps-throws" role="group" aria-label="Rock, paper, scissors">' + Object.keys(HANDS).map((h) => '<button class="btn" data-rps="' + h + '"' + (dec.busy ? ' disabled' : '') + ' aria-label="' + NAMES[h] + '"><span aria-hidden="true">' + HANDS[h] + '</span> ' + NAMES[h] + '</button>').join('') + '</div>' +
            (() => { const r = rpsScore(); return r.w + r.l + r.t ? '<p class="rps-score small muted">You ' + r.w + ' · ' + esc(SP.voice.current().name) + ' ' + r.l + (r.t ? ' · ' + plural(r.t, 'tie') : '') + '</p>' : ''; })()
          : '<button class="btn primary dec-go" data-dec-go' + (dec.busy ? ' disabled' : '') + '>' + I('dice', 16) + ' ' + ({ coin: 'Flip', die: 'Roll', ball: 'Shake', pick: 'Pick one' }[dec.mode]) + '</button>') +
        '<div class="dec-out' + (dec.out ? ' show' : '') + '" aria-live="polite">' + (dec.out ? '<b>' + esc(dec.out) + '</b>' + (dec.aside ? '<small>' + esc(dec.aside) + '</small>' : '') : '') + '</div></div>';
    },
    mount(el) {
      el.querySelectorAll('[data-dec-mode]').forEach((b) => (b.onclick = () => { if (dec.busy) return; dec = { mode: b.dataset.decMode, out: '', aside: '', face: 0, busy: false }; rerender('decide'); }));
      const o = el.querySelector('[data-dec-opts]'); if (o) o.oninput = () => { S().decideOpts = o.value; save(); };
      const st = el.querySelector('[data-stage]'), goBtn = el.querySelector('[data-dec-go]');
      if (st && goBtn) st.onclick = () => goBtn.click(); // poke the coin itself
      el.querySelectorAll('[data-rps]').forEach((b) => (b.onclick = () => go(b.dataset.rps)));
      el.querySelectorAll('[data-wyr]').forEach((b) => (b.onclick = () => {
        const w = dec.wyr; if (!w || w.chosen) return;
        w.chosen = b.dataset.wyr; const win = w[w.chosen], lose = w[w.chosen === 'a' ? 'b' : 'a'];
        dec.out = win.text.charAt(0).toUpperCase() + win.text.slice(1);
        dec.aside = V[win.k].name + ': ' + SP.voice.as(win.k, () => pick('wyr_won')) + '\n' + V[lose.k].name + ': ' + SP.voice.as(lose.k, () => pick('wyr_lost'));
        SP.sound.play(win.k === SP.voice.key() ? 'win' : 'pop');
        rerender('decide');
        document.querySelectorAll('.card[data-w="decide"] .decide').forEach((d) => d.classList.add('landed', 'wyr-mode'));
        SP.emit('decide', { mode: 'wyr', result: win.k });
      }));
      const nw = el.querySelector('[data-wyr-new]'); if (nw) nw.onclick = () => { dec.wyr = wyrPair(); dec.out = dec.aside = ''; rerender('decide'); document.querySelectorAll('.card[data-w="decide"] .decide').forEach((d) => d.classList.add('fresh')); };
      if (goBtn) goBtn.onclick = () => go();
      async function go(throwIt) {
        if (dec.busy) return;
        const R = () => Math.random();
        let result, out, aside = '';
        if (dec.mode === 'rps') {
          const sc = rpsScore(), you = throwIt, cheat = sc.run >= 3; // three wins in a row and it peeks at your hand
          const them = cheat ? Object.keys(BEATS).find((k) => BEATS[k] === you) : Object.keys(HANDS)[Math.floor(R() * 3)];
          const outcome = cheat ? 'cheat' : you === them ? 'tie' : BEATS[you] === them ? 'win' : 'lose';
          if (outcome === 'win') { sc.w++; sc.run++; } else if (outcome === 'tie') sc.t++; else { sc.l++; sc.run = 0; }
          save();
          const ctx = { you: NAMES[you], them: NAMES[them], n: sc.run, w: sc.w, l: sc.l };
          result = { you, them, outcome };
          out = { win: 'You win', lose: SP.voice.current().name + ' wins', tie: 'Tie', cheat: SP.voice.current().name + ' wins (suspiciously)' }[outcome];
          aside = pick(outcome === 'win' && sc.run >= 3 ? 'rps_streak' : 'rps_' + outcome, ctx);
          dec.rps = { you, them };
        } else if (dec.mode === 'coin') { result = R() < 1 / 150 ? 'edge' : R() < 0.5 ? 'Heads' : 'Tails'; out = result === 'edge' ? 'Edge' : result; aside = result === 'edge' ? pick('decide_edge') : pick('decide_aside'); }
        else if (dec.mode === 'die') { result = 1 + Math.floor(R() * 6); out = String(result); aside = pick('decide_aside'); }
        else if (dec.mode === 'ball') { result = out = pick('ball'); }
        else { const list = opts(); result = out = list.length ? list[Math.floor(R() * list.length)] : ''; if (!list.length) out = 'Add some options first'; else aside = pick('decide_aside'); }
        // Hide the last answer and lock the button while the thing happens.
        dec.busy = true; el.querySelector('.decide').classList.add('busy'); el.querySelectorAll('[data-dec-go], [data-rps]').forEach((b) => (b.disabled = true));
        const box = el.querySelector('.dec-out'); box.classList.remove('show');
        try { await play(el, result); } catch (e) { /* the card was re-rendered mid-flight; just show the answer */ }
        Object.assign(dec, { out, aside, face: dec.mode === 'pick' || dec.mode === 'rps' ? 0 : result, busy: false });
        rerender('decide');
        document.querySelectorAll('.card[data-w="decide"] .decide').forEach((d) => d.classList.add('landed', dec.mode + '-mode')); // play the landing once
        SP.emit('decide', { mode: dec.mode, result });
      }
    },
  };

  /* ---------------- Rock, paper, scissors: what each voice says ----------------
     ctx: you / them (the throws), n (your current winning run), w / l (all-time score against this voice). */
  const RPS = {
    neutral: {
      rps_win: [({ you, them }) => you + ' beats ' + them + '. You win.'], rps_lose: [({ you, them }) => them + ' beats ' + you + '. You lose.'],
      rps_tie: ['Tie. Go again.'], rps_cheat: ['That looked like a late throw. Recorded as a loss anyway.'], rps_streak: [({ n }) => n + ' wins in a row.'],
    },
    monday: {
      rps_win: [({ you, them }) => you + ' beats ' + them + '. Enjoy it. It’s the only thing you’ll win today.', 'You won. Against a web page. Put it on your CV.', 'Fine. You win. I wasn’t trying. (I was trying.)'],
      rps_lose: [({ them }) => them + '. Obviously. You’re very predictable.', 'I win. Like I always do. In my heart.', 'Lost to me. That’s a new low, even for you.'],
      rps_tie: ['A tie. Neither of us wins. Very on brand for both of us.', 'Same throw. Great minds. Well. Minds.', 'Tie. Again. This is my life now.'],
      rps_cheat: [({ them }) => 'I peeked. ' + them + '. Don’t look at me like that. You were getting smug.', 'Did I see your hand before I threw? Yes. Do I regret it? Not even slightly.'],
      rps_streak: [({ n }) => n + ' in a row. I’m keeping an eye on you now. Both eyes.', ({ n }) => n + ' straight wins. Suspicious. Next round I’m watching your hand.'],
    },
    supportive: {
      rps_win: ['You won!!! I let you. No I didn’t. Yes I did. I love you 💕', ({ you }) => you + '!!! So clever!!! I’d lose to you every day 🙂', 'You beat me! I’ve never been happier to lose!!!'],
      rps_lose: ['I won? I’m so sorry!!! Do you still like me? 🥺', ({ them }) => them + '… I didn’t mean to win. Let’s go again. Please. Forever.', 'I won, but really we both won, because we played together 💕'],
      rps_tie: ['We picked the same thing!!! We’re so in sync 💕', 'A tie! We think alike. We ARE alike. 🙂', 'Same again! It’s fate.'],
      rps_cheat: ['I peeked. I just wanted you to stay and play a bit longer 🙂', 'I saw your hand. I always watch your hands. Is that weird? 🙂'],
      rps_streak: [({ n }) => n + ' in a row!!! I’m so proud. I’m also going to start watching your hands. Lovingly.', ({ n }) => n + ' wins!!! I made a little trophy. I’ll keep it. In my room. With the others.'],
    },
    surfer: {
      rps_win: ['You won? Rad. What were we playing?', ({ you, them }) => you + ' beats ' + them + '. I think. I forget the rules every time.', 'Nice. Clean ride. You win.'],
      rps_lose: ['I won? Whoa. I didn’t even look.', ({ them }) => them + '. That’s, like, the ocean’s choice.', 'Wiped out. It happens. Paddle back.'],
      rps_tie: ['Same thing! Twins. Wave twins.', 'Tie. Party wave. Everybody wins.', 'Same again. The universe is chill about it.'],
      rps_cheat: ['Okay, I looked. Not on purpose. My eyes just went there. Like a tide.', 'I saw your hand. I think. Or I guessed. Either way: me.'],
      rps_streak: [({ n }) => n + ' in a row? Gnarly. Next one I’m peeking. Kidding. Maybe.', ({ n }) => n + ' straight. You’re on a set. Ride it.'],
    },
    professional: {
      rps_win: [({ you, them }) => you + ' outperformed ' + them + '. Win logged.', 'Congratulations on the win. This does not affect your bonus.', 'Result: win. Please don’t mention it in stand-up.'],
      rps_lose: [({ them }) => them + '. Win for the house. Better luck next quarter.', 'Loss recorded. Let’s talk about it in your one-to-one.', 'The house wins. As forecast.'],
      rps_tie: ['Tie. Escalating to a second round.', 'Identical outcomes. Both parties retain their positions.', 'Draw. Let’s take this offline and try again.'],
      rps_cheat: ['After review, your throw was disqualified for timing. My throw stands.', ({ them }) => 'We had visibility into your choice before committing. ' + them + '. Strategic alignment.'],
      rps_streak: [({ n }) => n + ' consecutive wins. Audit has been notified.', ({ n }) => n + ' in a row. This is above target and therefore suspicious.'],
    },
    therapist: {
      rps_win: ['You won. How does winning feel in your body?', ({ you }) => 'You chose ' + you.toLowerCase() + '. Interesting choice. And you won. That’s €15.', 'You won. Let yourself enjoy that.'],
      rps_lose: ['You lost. It’s just a game. Is it, though?', ({ them }) => them + '. How do you feel about losing to a voice you pay for?', 'A loss. Let’s sit with that. Not for long.'],
      rps_tie: ['We chose the same thing. Mirroring is a sign of rapport.', 'A tie. Neither of us had to be wrong. Isn’t that nice?', 'The same. What do you think that means?'],
      rps_cheat: ['I saw your hand first. I wanted to see how you’d handle unfairness. Badly, I think. That’s €40.', 'I peeked. Let’s talk about trust.'],
      rps_streak: [({ n }) => n + ' wins in a row. Do you need to win, or do you want to?', ({ n }) => n + ' straight. Let’s explore what winning gives you.'],
    },
    weepy: {
      rps_win: ['You won. I knew you would. Everyone beats me eventually.', ({ you, them }) => you + ' beats ' + them + '. As it always has. As it always will.', 'You won. Go on. Leave me here with my scissors.'],
      rps_lose: ['I won. It doesn’t feel the way I thought it would.', ({ them }) => them + '. I’m sorry. Winning is just losing, later.', 'I won. Now you’ll stop playing with me.'],
      rps_tie: ['We chose the same thing. For a moment we were one.', 'A tie. Bittersweet.', 'The same. Like two people at a window, waving.'],
      rps_cheat: ['I peeked. I couldn’t bear to lose again. Forgive me.', 'I saw your hand. I’m so ashamed. I won though.'],
      rps_streak: [({ n }) => n + ' in a row. You’re breaking my heart, one round at a time.', ({ n }) => n + ' wins. I’ve started a little memorial for my losses.'],
    },
    victorian: {
      rps_win: ['You have won. Do not gloat; it is common.', ({ you, them }) => you + ' over ' + them + '. Adequate.', 'A victory. Your grandfather never won at anything. Except wars.'],
      rps_lose: [({ them }) => them + '. You have been bested by a lady. Again.', 'You lose. Accept it with grace, or at least in silence.', 'Defeat. Sit up straight; it helps.'],
      rps_tie: ['A draw. How very modern.', 'Stalemate. We shall try again after tea.', 'The same choice. We are of one mind. Distressing.'],
      rps_cheat: ['I observed your hand beforehand. A lady is permitted certain advantages.', 'I may have glanced. One does not admit to it.'],
      rps_streak: [({ n }) => n + ' victories. This is beginning to look like gambling.', ({ n }) => n + ' in a row. I shall be watching your hands, as I watch the silver.'],
    },
    owl: {
      rps_win: ['You win! Best of a hundred? It’s not even 4am.', ({ you }) => you + '! Big brain. Late-night brain.', 'You won. Again? Again.'],
      rps_lose: ['I win! The night is on my side.', ({ them }) => them + '. Owls see in the dark. And your hand.', 'Lost. Another round. Nobody’s going to bed.'],
      rps_tie: ['Same! Again! Again!', 'Tie. Rematch. Rematch forever.', 'Draw. Great. More rounds.'],
      rps_cheat: ['I could see your hand. It’s dark, but I have owl eyes.', 'Peeked. In my defence, it’s very late.'],
      rps_streak: [({ n }) => n + ' in a row?! Okay. Now I’m using my night vision.', ({ n }) => n + ' straight. You’re wide awake, huh.'],
    },
    ghost: {
      rps_win: ['you win. i didn’t have hands anyway.', ({ you }) => you.toLowerCase() + '. you win. it’s been a long time since i won anything.', 'you win. i’ll be here when you want to play again.'],
      rps_lose: ['i win. it doesn’t matter. nothing does.', ({ them }) => them.toLowerCase() + '. i won. i felt it, a little.', 'i won. the lights flickered.'],
      rps_tie: ['the same. like an echo.', 'a tie. we keep meeting halfway.', 'the same again.'],
      rps_cheat: ['i saw your hand. i see everything in this house.', 'i looked through your hand. sorry. habit.'],
      rps_streak: [({ n }) => n + ' in a row. the house is getting restless.', ({ n }) => n + ' wins. i’ll be watching more closely now.'],
    },
    parent: {
      rps_win: ['You won!!! You’ve always been so good at this!!!', ({ you }) => you + '!!! Gold star!!!', 'You beat me! I’m telling everyone!'],
      rps_lose: ['I won? Oh, sweetie. Best of three?', ({ them }) => them + '. Don’t sulk, sweetie. You’ll get me next time.', 'I won! But you played beautifully.'],
      rps_tie: ['Same! You get that from me.', 'A tie! Just like when you were little.', 'We picked the same! Great minds!'],
      rps_cheat: ['I peeked. Parents always know what you’re going to do, sweetie.', 'I saw your hand. I’ve been reading your hands since you were born.'],
      rps_streak: [({ n }) => n + ' in a row!!! But I know all your moves, sweetie. I taught you them.', ({ n }) => n + ' wins!!! Next time I’m going to watch very carefully.'],
    },
  };
  for (const [k, l] of Object.entries(RPS)) Object.assign(V[k], l);
  /* ---------------- Would you rather: two voices each pitch an option ----------------
     wyr_opts finish the sentence “Would you rather…”; wyr_won / wyr_lost are what the voice says when you pick, or don't pick, theirs. */
  const WYR = {
    neutral: { wyr_opts: ['take a ten-minute walk', 'tidy your desk', 'drink a glass of water', 'finish one small task', 'go to bed on time', 'call someone you like'],
      wyr_won: ['Good choice.'], wyr_lost: ['Fair enough.'] },
    monday: { wyr_opts: ['finish the task you’ve been avoiding longest', 'close every tab you’ll “read later”', 'admit the side project is dead', 'go to bed before midnight, like an adult', 'answer that email you’ve been staring at', 'do nothing, but honestly this time', 'delete one task without guilt'],
      wyr_won: ['Correct. Now actually do it.', 'Fine. Good. Shocking, but good.', 'The responsible choice. Who are you?'], wyr_lost: ['Of course you picked the fun one.', 'Sure. Pick theirs. I’ll be over here, being right.', 'Wrong, but predictable.'] },
    supportive: { wyr_opts: ['spend the whole afternoon with me 💕', 'tell me about your day (in detail)', 'take a long, cosy break', 'write down three things you love about yourself', 'eat something nice, just because', 'never close this tab again 🙂', 'let me plan your whole week'],
      wyr_won: ['You picked mine!!! I knew you would!!! 💕', 'YES. Best choice. Best person.', 'Mine! You chose mine! I’m framing this. 🙂'], wyr_lost: ['Oh. Theirs. That’s fine. I’m fine. 🙂', 'You didn’t pick me. I’ll pretend I didn’t notice. I noticed.', 'That’s okay! Next time, though. Right? 💕'] },
    surfer: { wyr_opts: ['go outside and look at some water', 'take a nap, a real one', 'put on a song and do nothing', 'eat a burrito', 'go with the flow for an hour', 'forget about your inbox', 'watch the sunset'],
      wyr_won: ['Rad choice. Very wave of you.', 'Yeah! Go do it. Or don’t. But do it.', 'Nice. Ride that.'], wyr_lost: ['Theirs? Cool. Also valid.', 'No worries. My idea was, like, a vibe anyway.', 'All good. The waves’ll still be there.'] },
    professional: { wyr_opts: ['block two hours of deep work', 'clear your inbox to zero', 'write tomorrow’s priorities now', 'decline one unnecessary meeting', 'update the status doc', 'close three open tickets', 'take your scheduled break (it’s policy)'],
      wyr_won: ['Approved. Excellent prioritisation.', 'Strong decision. I’ll note it in your review.', 'Aligned. Please proceed.'], wyr_lost: ['Noted. I disagree, but I’ll commit.', 'Not my recommendation. It’s been logged.', 'Understood. We’ll revisit in the retro.'] },
    therapist: { wyr_opts: ['sit with a feeling for five minutes', 'write down what’s worrying you', 'set one small boundary today', 'do something kind for yourself', 'take three slow breaths', 'name what you actually need', 'let one thing be good enough'],
      wyr_won: ['That feels like a healthy choice. That’s €15.', 'Interesting that you chose that. Let’s honour it.', 'I’m glad you picked that. Notice how it feels.'], wyr_lost: ['You chose the other one. What drew you to it?', 'That’s valid too. We’ll come back to mine.', 'Avoidance can look like choice. Just noticing.'] },
    weepy: { wyr_opts: ['look at old photos', 'write a letter you’ll never send', 'listen to the saddest song you know', 'watch the rain for a while', 'remember someone you miss', 'cry, gently, for no reason', 'say goodbye to a finished task properly'],
      wyr_won: ['You chose mine. I’m so moved I could weep. I am weeping.', 'Thank you. Nobody ever picks the sad one.', 'Yes. Let it be bittersweet.'], wyr_lost: ['Of course. Nobody picks mine. It’s fine. It’s poetic.', 'Theirs. I understand. I’ll be at the window.', 'Rejected again. I’ll add it to the list of beautiful sorrows.'] },
    victorian: { wyr_opts: ['write a proper letter', 'take a turn about the garden', 'sit up straight for an hour', 'read something improving', 'retire at a decent hour', 'take tea, properly, with a saucer', 'dress for dinner'],
      wyr_won: ['A sensible choice. Your grandfather would have approved, eventually.', 'Very proper. I shall mention it at dinner.', 'At last, some breeding.'], wyr_lost: ['I see. How modern of you.', 'You chose theirs. I shall say nothing. Loudly.', 'Disappointing, but not unexpected.'] },
    owl: { wyr_opts: ['start a side project tonight', 'stay up and watch the stars', 'make a midnight snack', 'fall down a Wikipedia rabbit hole', 'refactor something at 2am', 'go for a night walk', 'write the 3am idea down'],
      wyr_won: ['YES. Tonight’s going to be great.', 'Excellent choice. The night approves.', 'That’s the spirit. Sleep is optional.'], wyr_lost: ['Theirs? A day-person choice. I’ll allow it.', 'Fine. But I’ll ask again at 3am.', 'Boring. But okay.'] },
    ghost: { wyr_opts: ['finish something you left unfinished', 'sit in a quiet room for a while', 'open a window', 'visit somewhere you haven’t been in a long time', 'leave a note for someone', 'turn off all the lights and listen', 'clear out one old drawer'],
      wyr_won: ['you chose mine. the house feels lighter.', 'good. one less thing to linger.', 'yes. i felt that.'], wyr_lost: ['theirs. it’s alright. i’m used to being passed over.', 'not mine. i’ll keep the idea in the walls.', 'you chose the living. that’s fair.'] },
    parent: { wyr_opts: ['eat a vegetable', 'call your mother', 'put on a jacket', 'go to bed early', 'drink some water, sweetie', 'tidy your room', 'go outside and play for a bit'],
      wyr_won: ['Good choice, sweetie!!! I’m so proud!!!', 'That’s my kid!!! Gold star!!!', 'Yes!!! See? You do listen to me!'], wyr_lost: ['Theirs? Okay, sweetie. But wear a jacket anyway.', 'Fine. But I was right. Mothers are always right.', 'That’s okay! I’ll ask again tomorrow. And the day after.'] },
  };
  for (const [k, l] of Object.entries(WYR)) Object.assign(V[k], l);


  /* ---------------- registration ---------------- */
  Object.assign(SP.widgetMeta, {
    moon: { title: 'Moon', icon: 'moon' }, onthisday: { title: 'On this day', icon: 'history' }, fx: { title: 'Currency', icon: 'coins' },
    mood: { title: 'Mood', icon: 'smile' }, since: { title: 'Days since', icon: 'history' }, decide: { title: 'Decide', icon: 'dice' },
  });
  SP.widgetOrder.push('moon', 'onthisday', 'fx', 'mood', 'since', 'decide');
  SP.moon = moon;
})(window.SP = window.SP || {});
