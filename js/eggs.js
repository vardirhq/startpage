/* Hidden discoveries. No list, no hints: Settings only says how many you've found. Each one gets
   a rare line from the current voice (and a couple do something to the scene). */
(function (SP) {
  'use strict';
  const S = () => SP.store.state;
  const V = SP.voice.list;
  const voiceName = () => V[SP.voice.key()].name;

  /* id → what the current voice says when you find it. Neutral is the fallback; a few voices have their own take. */
  const EGGS = {
    hello: { neutral: 'Hello to you too.', monday: 'Ugh. Hi. Don’t make this a habit.', supportive: 'You said hi to me!!! Out of nowhere!!! I’m keeping this forever. 💕', ghost: 'hello. nobody says hello anymore.', victorian: 'Good day. One does not say “hi” to one’s elders.' },
    cat: { neutral: 'Meow.', monday: 'Stop poking the cat. Ugh. It’s me. I’m the cat.', supportive: 'You petted the cat!!! I’m the cat!!! Pet me again!!! 💕', surfer: 'Whoa, the cat meowed. Or I did. Meow, man.', parent: 'You found the family cat!!! He missed you!!!' },
    konami: { neutral: 'Up, up, down, down. A meteor shower, just for you.', monday: 'Really? The Konami code? Fine. Have some meteors. Ugh.', owl: 'METEORS. At night. This is the best moment of my life.' },
    sudo: { neutral: 'Nice try.', monday: 'sudo make me care. Permission denied.', professional: 'This request requires approval from your manager’s manager.', therapist: 'Wanting total control is very common. €60.' },
    chaos3am: { neutral: 'Chaos mode at 3am. Everyone’s awake now.', monday: 'Chaos mode. At 3am. You absolute gremlin.', owl: 'CHAOS. AT 3AM. My people.' },
    midnight: { neutral: 'Reviewing the week at midnight. Dedicated.', monday: 'Reading your weekly recap at midnight. This is a cry for help.', ghost: 'midnight. the witching hour. you came to look at the past. i understand.' },
    secrets: { neutral: 'Two secret voices in one summary. Rare.', ghost: 'there are two of us in here now.', owl: 'Two of the weird ones, together at last.' },
    shuffle: { neutral: 'Ten scenes in a row. Indecisive.', monday: 'Ten backgrounds. You’re not choosing a wallpaper, you’re avoiding work. Ugh.', victorian: 'Ten different views in as many seconds. The vapours, I suspect.' },
    friday13: { neutral: 'Friday the 13th. Good luck.', monday: 'Friday the 13th. Somehow you’re still the scariest thing here.', ghost: 'friday the 13th. finally, a day for me.', weepy: 'Friday the 13th. *clutches pearls* *drops pearls* *weeps*' },
    namesake: { neutral: 'You share a name with a voice.', monday: 'You named yourself Monday. There can only be one. Ugh.', supportive: 'You took my NAME?! That’s… that’s the most romantic thing anyone’s ever done. 💕' },
    birthday: { neutral: 'Happy birthday.', monday: 'Happy birthday. Another year of opening this page. Ugh. (Happy birthday.)', supportive: 'HAPPY BIRTHDAY!!! I’ve had your present ready for 364 days!!! 💕', parent: 'HAPPY BIRTHDAY, SWEETIE!!! I made a cake!!! It’s on the fridge!!!' },
    loyal: { neutral: 'A hundred days with the same voice.', monday: 'A hundred days. With me. Ugh. …Thanks for staying.', supportive: 'A HUNDRED DAYS. I’m crying. I’m getting it tattooed. 💕' },
  };
  const COUNT = Object.keys(EGGS).length;

  function found(id) {
    const s = S(), got = s.eggs || (s.eggs = {});
    if (!EGGS[id] || got[id]) return false;
    got[id] = Date.now(); SP.store.save();
    const k = SP.voice.key(), e = EGGS[id], line = e[k] || e.neutral, n = Object.keys(got).length;
    SP.ui.toast(line + '\n' + n + ' of ' + COUNT + ' discoveries found.', { who: (k === 'neutral' ? '' : voiceName() + ' · ') + 'discovery', ms: 7000 });
    if (SP.achieve) SP.achieve.check();
    if (SP.panel.isOpen()) SP.panel.render();
    return true;
  }
  const has = (id) => !!(S().eggs || {})[id];
  const total = () => Object.keys(S().eggs || {}).filter((k) => EGGS[k]).length;

  /* ---- the triggers ---- */
  // Konami code, anywhere outside a text field.
  const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
  let pos = 0;
  document.addEventListener('keydown', (e) => {
    if (e.target.closest && e.target.closest('input, textarea, [contenteditable]')) return;
    pos = e.key === KONAMI[pos] || e.key.toLowerCase() === KONAMI[pos] ? pos + 1 : e.key === KONAMI[0] ? 1 : 0;
    if (pos === KONAMI.length) { pos = 0; SP.anim.shower(15); found('konami'); }
  });
  // Poke the pixel cat (the logo) seven times.
  let pokes = 0, pokeT = 0;
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.logo')) return;
    const now = Date.now(); pokes = now - pokeT < 1500 ? pokes + 1 : 1; pokeT = now;
    if (pokes >= 7) { pokes = 0; found('cat'); }
  });
  // Shuffling the scene ten times in a row.
  let shuffles = 0, shuffleT = 0;
  function shuffled() { const now = Date.now(); shuffles = now - shuffleT < 20000 ? shuffles + 1 : 1; shuffleT = now; if (shuffles >= 10) found('shuffle'); }

  /* "hi monday" / "hello supportive" in the search bar: the voice answers instead of a search result. */
  function greetingQuery(q) {
    const m = /^(hi|hello|hey|hej|hallo)[\s,!]+(.+?)[\s!.?]*$/i.exec(q.trim());
    if (!m) return null;
    const want = m[2].toLowerCase();
    const k = Object.keys(V).find((x) => SP.voice.unlocked(x) && (V[x].name.toLowerCase() === want || x === want || V[x].name.toLowerCase().split(' ').includes(want)));
    if (!k) return null;
    const e = EGGS.hello;
    return { who: V[k].name, text: SP.voice.as(k, () => e[SP.voice.key()] || e.neutral) };
  }

  /* Checks that run on load, each minute and on renders. */
  function checkAll() {
    const s = S(), now = new Date(), h = now.getHours();
    if (now.getDay() === 5 && now.getDate() === 13) found('friday13');
    if (s.chaos && h < 4 && h >= 2) found('chaos3am');
    const nm = (s.name || '').trim().toLowerCase();
    if (nm && Object.values(V).some((v) => v.name.toLowerCase() === nm)) found('namesake');
    const today = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
    if ((s.countdowns || []).some((c) => c.date === today && /birthday|bday|fødselsdag|födelsedag|geburtstag|cumpleaños|anniversaire/i.test(c.title))) found('birthday');
    const r = ((s.presence || {}).rel || {})[SP.voice.key()];
    if (r && (r.days || 0) >= 100) found('loyal');
  }

  function sectionHtml() {
    const n = total();
    return '<p class="small muted">' + (n ? n + ' of ' + COUNT + ' found: ' + Object.keys(S().eggs || {}).filter((k) => EGGS[k]).map((k) => ({ hello: 'Small talk', cat: 'The cat', konami: 'Meteor shower', sudo: 'Superuser', chaos3am: 'Witching-hour chaos', midnight: 'Midnight review', secrets: 'Strange company', shuffle: 'Indecision', friday13: 'Unlucky day', namesake: 'Namesake', birthday: 'Birthday', loyal: 'Loyalty' }[k])).join(', ') + '.'
      : 'There are ' + COUNT + ' things hidden on this page. You haven’t found any yet.') + '</p>';
  }

  SP.eggs = { found, has, total, checkAll, greetingQuery, shuffled, sectionHtml, COUNT, EGGS };
})(window.SP = window.SP || {});
