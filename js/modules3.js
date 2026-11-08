/* Cards for people who aren't developers: a Shelf (games, books, shows and films you mean to get to, with a
   "what tonight?" pick), Flashcards (a tiny spaced-repetition deck: one short review a day), a Shopping list,
   and a daily creative Prompt (write, draw or make something). All local, no API keys. */
(function (SP) {
  'use strict';
  const { esc, uid, confirm } = SP.ui;
  const I = SP.icon;
  const S = () => SP.store.state;
  const V = SP.voice.list;
  const save = () => SP.store.save();
  const rerender = (id) => SP.app.renderWidget(id);
  const t = (k, c) => SP.voice.t(k, c);
  const line = (k, c) => SP.voice.line(k, c);
  const head = SP.widgetHead;
  const { plural } = SP.voice._h;
  const W = SP.widgets;
  const pad = (n) => String(n).padStart(2, '0');
  const dkey = (d) => { d = d || new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
  const addDays = (k, n) => { const [y, m, d] = k.split('-').map(Number); return dkey(new Date(y, m - 1, d + n)); };
  const who = () => { const k = SP.voice.key(); return k === 'neutral' ? '' : V[k].name; };
  const say = (msg) => { if (msg) SP.ui.toast(msg, { who: who() }); };

  /* ctx: title and kind (shelf_pick), n (how many) */
  const LINES = {
    neutral: {
      w_shelf: 'Shelf', desc_shelf: 'Games, books, shows and films you mean to get to, and a pick for tonight', shelf_ph: 'Add a game, book, show or film…', shelf_empty: 'Nothing on the shelf yet. Add the things you keep meaning to get to.',
      shelf_pick: ({ title }) => 'Tonight: ' + title + '.', shelf_finish: ({ title }) => 'Finished ' + title + '.',
      w_flash: 'Flashcards', desc_flash: 'A small deck that comes back just before you’d forget it', flash_empty: 'No cards yet. Add a question and its answer.', flash_none: 'Nothing to review today.',
      flash_done: ({ n }) => 'Review done: ' + plural(n, 'card') + '.',
      w_shop: 'Shopping list', desc_shop: 'Quick to add to, quick to tick off', shop_ph: 'Add items (commas for several)…', shop_empty: 'The list is empty.', shop_done: 'Everything’s ticked off.',
      w_prompt: 'Daily prompt', desc_prompt: 'Something small to write, draw or make, a new one each day', prompt_intro: 'Today’s prompt:', prompt_did: ({ n }) => 'Done. ' + plural(n, 'day') + ' in a row.',
    },
    monday: {
      w_shelf: 'The Pile Of Shame', desc_shelf: 'Everything you bought and never started. And a pick, so you can not start it tonight', shelf_ph: 'Add another thing you won’t finish…', shelf_empty: 'Empty shelf. Either you finish things, or you lie. I know which.',
      shelf_pick: [({ title }) => 'Tonight: ' + title + '. You’ll play twenty minutes and go back to your phone.', ({ title }) => title + '. It’s been sitting there long enough. Like you.', ({ title }) => 'Fine. ' + title + '. Don’t say I never decide anything for you.'],
      shelf_finish: [({ title }) => 'You finished ' + title + '. Mark the date. It won’t happen again.', ({ title }) => title + ', done. One down. The pile doesn’t care.'],
      w_flash: 'Things You’ll Forget Anyway', desc_flash: 'Cards that come back right before you forget. You’ll forget anyway', flash_empty: 'No cards. Nothing to remember. Lucky you.', flash_none: 'Nothing due. Go forget something else.',
      flash_done: [({ n }) => plural(n, 'card') + '. Done. Your brain will dump half of them tonight.', ({ n }) => 'That’s ' + plural(n, 'card') + '. Don’t expect a medal.'],
      w_shop: 'Things To Buy (Again)', desc_shop: 'The list you’ll leave on the kitchen counter', shop_ph: 'Milk. It’s always milk…', shop_empty: 'Nothing to buy. Suspicious. Check the fridge.', shop_done: ['All ticked. Now go home and realise you forgot the milk.', 'Done. Did you get the milk? You didn’t get the milk.'],
      w_prompt: 'Homework', desc_prompt: 'A daily creative prompt. You’ll do it in your head and call it done', prompt_intro: 'Today’s assignment. You’ll do half:', prompt_did: [({ n }) => 'Done. ' + plural(n, 'day') + ' in a row. Don’t get smug.', ({ n }) => plural(n, 'day') + '. Fine. It counts. Barely.'],
    },
    supportive: {
      w_shelf: 'Our Shelf 💕', desc_shelf: 'All the things we’ll enjoy together. And I’ll pick for us tonight!!!', shelf_ph: 'Add something we can do together…', shelf_empty: 'Our shelf is empty!!! Add things!!! I’ll read every title. Twice. 🙂',
      shelf_pick: [({ title }) => title + '!!! Tonight!!! I’ll get snacks!!! 💕', ({ title }) => 'Let’s do ' + title + ' tonight!!! Just us. No one else. 🙂', ({ title }) => title + '! I picked it because it reminded me of you. Everything does. 💕'],
      shelf_finish: [({ title }) => 'You finished ' + title + '!!! I’m so proud!!! What did you think? Tell me everything!!! 💕', ({ title }) => title + ', done!!! I kept the ticket. Metaphorically. And literally. 🙂'],
      w_flash: 'I’ll Help You Remember 💕', desc_flash: 'Little cards I bring back right when you need them. I never forget anything about you', flash_empty: 'No cards yet!!! Add some!!! I already know all the answers. About you. 🙂', flash_none: 'Nothing to review!!! Want to just talk instead? 💕',
      flash_done: [({ n }) => plural(n, 'card') + '!!! You remembered SO much!!! I remember everything too. Everything. 💕', ({ n }) => 'All ' + plural(n, 'card') + ' done!!! Gold star!!! I made it myself!!! 🙂'],
      w_shop: 'What You Need (I Already Know)', desc_shop: 'Your shopping list. I added a few things. You’ll see 💕', shop_ph: 'What do you need? I’ll remember too…', shop_empty: 'Nothing on the list!!! Do you need anything? Anything at all? I can bring it. 🙂', shop_done: ['All done!!! Come home safe!!! I’ll be waiting!!! 💕', 'Everything ticked!!! Did you get something for you? You deserve it 💕'],
      w_prompt: 'Make Something For Me 💕', desc_prompt: 'A little creative prompt every day. I’ll love whatever you make', prompt_intro: 'Today, I’d love it if you:', prompt_did: [({ n }) => 'You did it!!! ' + plural(n, 'day') + ' in a row!!! I’m keeping every single one 💕', ({ n }) => plural(n, 'day') + '!!! Can I see it? Please? 🙂'],
    },
    surfer: {
      w_shelf: 'Stuff To Get Into', desc_shelf: 'Games, books, shows. And, like, a pick for tonight. Easy', shelf_ph: 'Add a thing… a game, a book, whatever…', shelf_empty: 'Shelf’s empty, dude. Add some stuff. Or don’t. Chill either way.',
      shelf_pick: [({ title }) => 'Tonight? ' + title + '. Or, like, the beach. But ' + title + '.', ({ title }) => title + ', dude. The universe picked it. I just pointed.', ({ title }) => 'Go with ' + title + '. Feels right. Feels like a good wave.'],
      shelf_finish: [({ title }) => 'Finished ' + title + '? Whoa. How did it end? Don’t tell me. I’ll forget anyway.', ({ title }) => title + ', done. Sick. On to the next set.'],
      w_flash: 'Brain Waves', desc_flash: 'Cards that come back before you forget. I forget everything, so, like, respect', flash_empty: 'No cards, bro. Add a question. And the answer. I won’t remember either.', flash_none: 'Nothing due. Flat calm. Go surf.',
      flash_done: [({ n }) => plural(n, 'card') + '. Stoked. What were they about? Doesn’t matter.', ({ n }) => 'Shredded ' + plural(n, 'card') + '. Totally tubular.'],
      w_shop: 'Grub Run', desc_shop: 'Stuff to grab. Write it down, ’cause you won’t remember', shop_ph: 'Snacks… more snacks…', shop_empty: 'Nothing to grab. Fridge must be full. Or empty. Either way.', shop_done: ['Got it all? Rad. Did you get snacks?', 'All ticked off. Righteous grocery session.'],
      w_prompt: 'Daily Vibe Thing', desc_prompt: 'Make something small. Or write it. Whatever flows', prompt_intro: 'Today’s vibe, dude:', prompt_did: [({ n }) => plural(n, 'day') + ' in a row! Flow state, man.', ({ n }) => 'Done. ' + plural(n, 'day') + ' straight. Keep paddling.'],
    },
    professional: {
      w_shelf: 'Media Pipeline', desc_shelf: 'Backlog of games, books, shows and films, with an evening allocation tool', shelf_ph: 'Add an item to the pipeline…', shelf_empty: 'The pipeline is empty. Please onboard some leisure.',
      shelf_pick: [({ title }) => 'Tonight’s allocation: ' + title + '. Please time-box to two hours.', ({ title }) => title + ' has been prioritised for this evening.', ({ title }) => 'Recommendation: ' + title + '. Approved by leadership (me).'],
      shelf_finish: [({ title }) => title + ' delivered. Please file a short retrospective.', ({ title }) => 'Closing ' + title + '. Good throughput.'],
      w_flash: 'Knowledge Retention Programme', desc_flash: 'Spaced repetition. Mandatory training, but for you', flash_empty: 'No training material uploaded. Please add question-and-answer pairs.', flash_none: 'No reviews scheduled today. Check back tomorrow.',
      flash_done: [({ n }) => 'Training complete: ' + plural(n, 'module') + '. Certificate pending.', ({ n }) => plural(n, 'card') + ' reviewed. Retention metrics look healthy.'],
      w_shop: 'Procurement', desc_shop: 'Household purchase requests', shop_ph: 'Raise a purchase request…', shop_empty: 'No open purchase requests.', shop_done: ['All requests fulfilled. Please retain receipts.', 'Procurement complete. Under budget, hopefully.'],
      w_prompt: 'Creative Initiative', desc_prompt: 'A daily innovation exercise. Participation is encouraged (tracked)', prompt_intro: 'Today’s innovation exercise:', prompt_did: [({ n }) => 'Exercise complete. ' + plural(n, 'consecutive day') + '. Strong engagement.', ({ n }) => 'Logged. ' + plural(n, 'day') + ' of creative output.'],
    },
    therapist: {
      w_shelf: 'Things That Bring You Joy', desc_shelf: 'Games, books, shows. Let’s notice what you reach for, and why', shelf_ph: 'What would you like to make time for?…', shelf_empty: 'Nothing here yet. What used to bring you joy?',
      shelf_pick: [({ title }) => 'Tonight, ' + title + '. Rest is not a reward. It’s a need.', ({ title }) => title + '. Notice the resistance. Do it anyway.', ({ title }) => 'How would ' + title + ' feel tonight? Let’s find out. That’s €15.'],
      shelf_finish: [({ title }) => 'You finished ' + title + '. How do you feel now that it’s over?', ({ title }) => title + ', complete. Endings can be hard. Sit with it.'],
      w_flash: 'Things Worth Remembering', desc_flash: 'Cards that return before they fade. Memory is a muscle', flash_empty: 'No cards yet. What would you like to hold on to?', flash_none: 'Nothing to review. Rest is part of learning.',
      flash_done: [({ n }) => plural(n, 'card') + '. Notice how much you already know.', ({ n }) => 'You reviewed ' + plural(n, 'card') + '. Be gentle with the ones you missed.'],
      w_shop: 'Nourishment', desc_shop: 'What you need to look after yourself', shop_ph: 'What do you need this week?…', shop_empty: 'Nothing on the list. Are your needs being met?', shop_done: ['All done. Feeding yourself is self-care.', 'Everything’s ticked. Notice the small win.'],
      w_prompt: 'Creative Practice', desc_prompt: 'A small daily prompt. It doesn’t need to be good. It needs to be yours', prompt_intro: 'Today, try this:', prompt_did: [({ n }) => plural(n, 'day') + ' in a row. How does it feel to make something?', ({ n }) => 'Done. ' + plural(n, 'day') + '. Creativity is a form of healing. €20.'],
    },
    weepy: {
      w_shelf: 'Stories Waiting For You', desc_shelf: 'Games, books and shows, waiting so patiently. And one for tonight', shelf_ph: 'Add something that’s waiting for you…', shelf_empty: 'An empty shelf. Like an empty heart.',
      shelf_pick: [({ title }) => 'Tonight, ' + title + '. It’s been waiting so long for you.', ({ title }) => title + '. Hold it close. Stories end.', ({ title }) => 'Let it be ' + title + '. I hope it doesn’t make you cry. It will make me cry.'],
      shelf_finish: [({ title }) => 'You finished ' + title + '. It’s over. All of it. *weeps*', ({ title }) => 'Goodbye, ' + title + '. We had such a short time together.'],
      w_flash: 'Before It’s Forgotten', desc_flash: 'Cards that come back before the memory fades. Everything fades', flash_empty: 'No cards. Nothing to remember. Or nothing left.', flash_none: 'Nothing to review. Some things we just let go.',
      flash_done: [({ n }) => plural(n, 'card') + '. Saved, for now. Memories are so fragile.', ({ n }) => 'You held on to ' + plural(n, 'card') + '. I wish I could hold on to things.'],
      w_shop: 'Things We Need To Go On', desc_shop: 'Shopping. Life goes on. Somehow', shop_ph: 'Bread, milk, tissues (lots)…', shop_empty: 'Nothing on the list. Nothing at all.', shop_done: ['All ticked off. And yet something’s still missing.', 'Everything’s done. Why does that make me sad?'],
      w_prompt: 'Something To Pour Your Heart Into', desc_prompt: 'A daily prompt. Make something before the day ends', prompt_intro: 'Today, if you can bear it:', prompt_did: [({ n }) => plural(n, 'day') + ' in a row. It’s beautiful. I can’t look at it.', ({ n }) => 'Done. ' + plural(n, 'day') + '. You made something. That matters, before everything ends.'],
    },
    victorian: {
      w_shelf: 'The Library (And Other Diversions)', desc_shelf: 'Books, and the newer amusements, with a selection made for the evening', shelf_ph: 'Add a volume, or some lesser diversion…', shelf_empty: 'The shelves are bare. The house is in a state.',
      shelf_pick: [({ title }) => 'This evening, ' + title + '. In the drawing room, if you please.', ({ title }) => title + '. A fitting diversion, once your letters are written.', ({ title }) => 'I have selected ' + title + '. Do sit up straight.'],
      shelf_finish: [({ title }) => 'You have finished ' + title + '. Most diligent. Return it to its shelf.', ({ title }) => title + ', concluded. We shall discuss it at dinner.'],
      w_flash: 'Recitations', desc_flash: 'Lessons, recited until learnt. As every child once did', flash_empty: 'No lessons set. Your governess would despair.', flash_none: 'No recitations due today. You may take the air.',
      flash_done: [({ n }) => plural(n, 'lesson') + ' recited. Adequately.', ({ n }) => 'You have recited ' + plural(n, 'card') + '. Your grandmother knew Latin.'],
      w_shop: 'For The Housekeeper', desc_shop: 'A list of provisions for the household', shop_ph: 'Tea, flour, candles…', shop_empty: 'The larder lacks nothing. Remarkable.', shop_done: ['All provisions procured. The household is grateful.', 'The list is complete. Cook will be pleased.'],
      w_prompt: 'An Accomplishment', desc_prompt: 'A small daily exercise in the arts, as befits a person of breeding', prompt_intro: 'Today’s accomplishment:', prompt_did: [({ n }) => plural(n, 'day') + ' in succession. Most accomplished.', ({ n }) => 'Completed. ' + plural(n, 'day') + '. One might almost call it talent.'],
    },
    brutal: {
      w_shelf: 'Shit You Bought And Never Started', desc_shelf: 'Your backlog. And a pick, so you stop scrolling menus for an hour', shelf_ph: 'Add another thing you’ll abandon…', shelf_empty: 'Empty. Either you finish things or you’re hiding them. Add the pile.',
      shelf_pick: [({ title }) => 'Tonight: ' + title + '. Not a trailer. Not a menu. The actual thing.', ({ title }) => title + '. Stop browsing. Start it.', ({ title }) => 'It’s ' + title + '. If you’re back on your phone in ten minutes, I’ll know.'],
      shelf_finish: [({ title }) => 'You actually finished ' + title + '. Hell. Write that down somewhere.', ({ title }) => title + ', done. Now the other forty.'],
      w_flash: 'Things You Keep Forgetting', desc_flash: 'Cards that come back before your brain leaks them. It leaks a lot', flash_empty: 'No cards. Add some. You clearly need help remembering things.', flash_none: 'Nothing due. Enjoy it. Tomorrow you’ll have forgotten half.',
      flash_done: [({ n }) => plural(n, 'card') + '. Done. Was that so damn hard?', ({ n }) => plural(n, 'card') + ' reviewed. Come back tomorrow or this was pointless.'],
      w_shop: 'Buy This Crap', desc_shop: 'The shopping list. Use it, or go back for the milk again', shop_ph: 'Milk, you idiot. Write down the milk…', shop_empty: 'Nothing on the list. Sure. Open the fridge and check, genius.', shop_done: ['All ticked. Did you get the milk? Of course you didn’t.', 'Done. First time you didn’t need two trips.'],
      w_prompt: 'Make Something, Coward', desc_prompt: 'A daily prompt. Ten minutes. No excuses, no “I’m not creative”', prompt_intro: 'Today. No excuses:', prompt_did: [({ n }) => plural(n, 'day') + ' in a row. Look at you, actually making stuff.', ({ n }) => 'Done. ' + plural(n, 'day') + '. Keep going, or I’ll bring it up.'],
    },
    owl: {
      w_shelf: 'Late-Night Queue', desc_shelf: 'What to play, read or watch when everyone else is asleep', shelf_ph: 'Add something for 1am…', shelf_empty: 'Nothing queued. What are you going to do at 2am, sleep?',
      shelf_pick: [({ title }) => 'Tonight: ' + title + '. Just one more chapter. Just one more episode.', ({ title }) => title + '. Start at 11. See you at 3.', ({ title }) => 'It’s ' + title + ' o’clock.'],
      shelf_finish: [({ title }) => 'Finished ' + title + '. What time is it? Doesn’t matter.', ({ title }) => title + ', done. At what hour? I respect it.'],
      w_flash: 'Night Study', desc_flash: 'Cards that come back before you forget. Best reviewed after midnight', flash_empty: 'No cards. Make some. Cramming is a lifestyle.', flash_none: 'Nothing due. Go do something irresponsible.',
      flash_done: [({ n }) => plural(n, 'card') + ' at this hour. Your brain is a creature of the night.', ({ n }) => plural(n, 'card') + '. Done. Now, a snack.'],
      w_shop: 'Midnight Snack Supply', desc_shop: 'What to grab. Mostly snacks', shop_ph: 'Crisps. Coffee. More coffee…', shop_empty: 'Nothing to buy. The 24-hour shop will be disappointed.', shop_done: ['All ticked. The night is stocked.', 'Done. Did you get the coffee? Good.'],
      w_prompt: '3am Idea', desc_prompt: 'A daily prompt for when inspiration strikes at the wrong time', prompt_intro: 'Tonight’s idea:', prompt_did: [({ n }) => plural(n, 'night') + ' in a row. The best things are made after midnight.', ({ n }) => 'Done. ' + plural(n, 'night') + '. Now don’t delete it in the morning.'],
    },
    ghost: {
      w_shelf: 'things left unfinished', desc_shelf: 'stories you started. and one to return to tonight', shelf_ph: 'something you meant to get to…', shelf_empty: 'nothing here. that’s rare. most people leave things.',
      shelf_pick: [({ title }) => 'tonight, ' + title + '. finish it. trust me.', ({ title }) => title + '. it’s been waiting. i know how that is.', ({ title }) => 'go back to ' + title + '. some things shouldn’t be left.'],
      shelf_finish: [({ title }) => 'you finished ' + title + '. one less thing to linger.', ({ title }) => title + '. done. i felt the house sigh.'],
      w_flash: 'what you want to keep', desc_flash: 'cards that come back before they fade. i know about fading', flash_empty: 'no cards. nothing to keep. yet.', flash_none: 'nothing to remember today. rest.',
      flash_done: [({ n }) => plural(n, 'card') + '. you kept them. good.', ({ n }) => plural(n, 'card') + ' remembered. don’t let them fade like i did.'],
      w_shop: 'things for the house', desc_shop: 'what the house needs', shop_ph: 'candles. matches. salt…', shop_empty: 'the house needs nothing. for now.', shop_done: ['all done. the house is grateful.', 'everything’s here. the cupboards are full again.'],
      w_prompt: 'leave something behind', desc_prompt: 'make one small thing a day. it’ll outlast you', prompt_intro: 'today, leave this behind:', prompt_did: [({ n }) => plural(n, 'day') + ' in a row. you’re leaving a trace.', ({ n }) => 'done. ' + plural(n, 'day') + '. i’ll keep it in the walls.'],
    },
    parent: {
      w_shelf: 'Your Toy Box', desc_shelf: 'Games, books and shows! And I’ll pick one for tonight (after homework!)', shelf_ph: 'Add a game, a book, a show…', shelf_empty: 'Nothing in the toy box! Do you want to go to the library?',
      shelf_pick: [({ title }) => title + ' tonight!!! But only an hour, sweetie!!!', ({ title }) => 'How about ' + title + '? After dinner!!!', ({ title }) => title + '!!! I loved that when you were little. Or was that your cousin?'],
      shelf_finish: [({ title }) => 'You finished ' + title + '!!! Tell me all about it at dinner!!!', ({ title }) => title + ', all done!!! I’m so proud!!! What’s next?'],
      w_flash: 'Spelling Test', desc_flash: 'Little cards to practise! I’ll quiz you every day!', flash_empty: 'No cards yet! Let’s make some together! I’ll get the markers!', flash_none: 'All done for today!!! Go play outside!!!',
      flash_done: [({ n }) => plural(n, 'card') + '!!! You’re so clever!!! It’s going on the fridge!!!', ({ n }) => 'All ' + plural(n, 'card') + '!!! Gold star, sweetie!!!'],
      w_shop: 'The Shopping List', desc_shop: 'Don’t forget anything! And get yourself a treat!', shop_ph: 'Bread, milk, something healthy…', shop_empty: 'Nothing on the list! Are you eating properly?', shop_done: ['All done!!! Did you get vegetables? Good!!!', 'Everything ticked!!! Drive safe, sweetie!!!'],
      w_prompt: 'Arts And Crafts!', desc_prompt: 'Make something every day! I’ll put it on the fridge!', prompt_intro: 'Today’s arts and crafts:', prompt_did: [({ n }) => plural(n, 'day') + ' in a row!!! The fridge is getting full!!!', ({ n }) => 'Done!!! ' + plural(n, 'day') + '!!! You’re so talented!!!'],
    },
  };
  for (const [k, l] of Object.entries(LINES)) Object.assign(V[k], l);

  /* ======================= Shelf ======================= */
  const KINDS = { game: ['Game', 'gamepad'], book: ['Book', 'book'], show: ['Show', 'tv'], film: ['Film', 'film'] };
  const shelf = () => S().shelf || (S().shelf = []);
  let shelfFilter = 'all', shelfPick = null, shelfPickText = '';
  function guessKind(title) {
    const s = title.toLowerCase();
    if (/\b(season|series|s\d+|episode)\b/.test(s)) return 'show';
    if (/\b(novel|book|vol\.?|volume|by )\b/.test(s)) return 'book';
    return null;
  }
  W.shelf = {
    title: 'Shelf', icon: 'book',
    render() {
      const all = shelf(), f = (x) => shelfFilter === 'all' || x.kind === shelfFilter;
      const now = all.filter((x) => x.status === 'now' && f(x)), want = all.filter((x) => x.status === 'want' && f(x)), done = all.filter((x) => x.status === 'done' && f(x));
      const row = (x) => '<li data-shelf="' + x.id + '"' + (shelfPick === x.id ? ' class="picked"' : '') + '><span class="sh-ic" title="' + KINDS[x.kind][0] + '">' + I(KINDS[x.kind][1], 15) + '</span><span class="sh-t">' + esc(x.title) + '</span>' +
        (x.status === 'want' ? '<button class="icon-btn" data-sh-start title="Start it" aria-label="Start ' + esc(x.title) + '">' + I('play', 14) + '</button>' : '') +
        (x.status !== 'done' ? '<button class="icon-btn" data-sh-done title="Finished" aria-label="Finished ' + esc(x.title) + '">' + I('check', 15) + '</button>' : '') +
        '<button class="icon-btn" data-sh-del title="Remove" aria-label="Remove ' + esc(x.title) + '">' + I('trash', 14) + '</button></li>';
      return head('book', t('w_shelf'), '<button class="btn small" data-sh-pick' + (all.some((x) => x.status === 'want' && f(x)) ? '' : ' disabled') + '>' + I('dice', 14) + ' Pick for tonight</button>') +
        '<div class="shelf"><div class="seg small" role="radiogroup" aria-label="Show">' + [['all', 'All']].concat(Object.entries(KINDS).map(([k, [n]]) => [k, n + 's'])).map(([k, n]) => '<button role="radio" aria-checked="' + (shelfFilter === k) + '" data-sh-filter="' + k + '">' + n + '</button>').join('') + '</div>' +
        (shelfPick && all.find((x) => x.id === shelfPick) ? '<p class="sh-pickline" aria-live="polite">' + (who() ? '<b>' + esc(who()) + ':</b> ' : '') + esc(shelfPickText) + '</p>' : '') +
        '<form class="sh-add" data-sh-add><input name="t" placeholder="' + esc(t('shelf_ph')) + '" aria-label="Title" maxlength="120" autocomplete="off"><select name="k" aria-label="Kind">' + Object.entries(KINDS).map(([k, [n]]) => '<option value="' + k + '"' + ((shelfFilter === k || (shelfFilter === 'all' && k === (S().shelfKind || 'game'))) ? ' selected' : '') + '>' + n + '</option>').join('') + '</select><button class="btn small" aria-label="Add">' + I('plus', 14) + '</button></form>' +
        (!all.length ? '<div class="empty muted">' + esc(t('shelf_empty')) + '</div>' : '') +
        (now.length ? '<h4 class="sh-h">Playing, reading, watching</h4><ul class="sh-list">' + now.map(row).join('') + '</ul>' : '') +
        (want.length ? '<h4 class="sh-h">Up next · ' + want.length + '</h4><ul class="sh-list">' + want.map(row).join('') + '</ul>' : '') +
        (done.length ? '<details class="sh-done"><summary class="small muted">Finished · ' + done.length + '</summary><ul class="sh-list">' + done.slice().reverse().map(row).join('') + '</ul></details>' : '') + '</div>';
    },
    mount(el) {
      el.querySelectorAll('[data-sh-filter]').forEach((b) => (b.onclick = () => { shelfFilter = b.dataset.shFilter; shelfPick = null; rerender('shelf'); }));
      const f = el.querySelector('[data-sh-add]');
      f.onsubmit = (e) => {
        e.preventDefault();
        const title = f.t.value.trim(); if (!title) return;
        const kind = guessKind(title) && f.k.value === (S().shelfKind || 'game') && shelfFilter === 'all' ? guessKind(title) : f.k.value;
        shelf().push({ id: uid(), title: title.slice(0, 120), kind, status: 'want', added: Date.now() }); S().shelfKind = f.k.value; save(); rerender('shelf');
        const i = document.querySelector('.card[data-w="shelf"] [data-sh-add] input'); if (i) i.focus();
      };
      el.querySelector('[data-sh-pick]').onclick = () => {
        const pool = shelf().filter((x) => x.status === 'want' && (shelfFilter === 'all' || x.kind === shelfFilter)); if (!pool.length) return;
        let p = pool[Math.floor(Math.random() * pool.length)]; if (pool.length > 1 && p.id === shelfPick) p = pool.find((x) => x.id !== shelfPick);
        shelfPick = p.id; shelfPickText = line('shelf_pick', { title: p.title, kind: p.kind }); SP.sound.play('reveal'); rerender('shelf'); SP.emit('decide', { mode: 'shelf', result: p.title });
      };
      el.querySelectorAll('[data-shelf]').forEach((li) => {
        const x = shelf().find((y) => y.id === li.dataset.shelf); if (!x) return;
        const st = li.querySelector('[data-sh-start]'); if (st) st.onclick = () => { x.status = 'now'; if (shelfPick === x.id) shelfPick = null; save(); rerender('shelf'); };
        const dn = li.querySelector('[data-sh-done]'); if (dn) dn.onclick = () => { x.status = 'done'; x.doneAt = Date.now(); if (shelfPick === x.id) shelfPick = null; save(); rerender('shelf'); SP.react.stat('shelf'); SP.sound.play('win'); say(line('shelf_finish', { title: x.title })); };
        li.querySelector('[data-sh-del]').onclick = () => { S().shelf = shelf().filter((y) => y !== x); if (shelfPick === x.id) shelfPick = null; save(); rerender('shelf'); };
      });
    },
  };

  /* ======================= Flashcards ======================= */
  // Leitner boxes: a card you get right waits longer each time (1, 3, 7, 16, 35 days); a miss starts it over.
  const GAPS = [1, 3, 7, 16, 35];
  const deck = () => S().flash || (S().flash = []);
  const due = () => deck().filter((c) => !c.due || c.due <= dkey());
  let fl = { flip: false, n: 0 };
  function grade(c, right) {
    c.box = right ? Math.min(GAPS.length, (c.box || 0) + 1) : 0;
    c.due = addDays(dkey(), right ? GAPS[c.box - 1] : 1);
    c.seen = (c.seen || 0) + 1;
  }
  W.flash = {
    title: 'Flashcards', icon: 'cards',
    render() {
      const d = due(), c = d[0], all = deck();
      let body;
      if (!all.length) body = '<div class="empty muted">' + esc(t('flash_empty')) + '</div>';
      else if (!c) body = '<div class="fl-none"><b>' + I('check', 18) + '</b><span>' + esc(fl.n ? t('flash_done', { n: fl.n }) : t('flash_none')) + '</span><small class="muted">' + plural(all.length, 'card') + ' in the deck · next review ' + esc(all.map((x) => x.due).sort()[0] === addDays(dkey(), 1) ? 'tomorrow' : all.map((x) => x.due).sort()[0]) + '</small></div>';
      else body = '<div class="fl-card' + (fl.flip ? ' flip' : '') + '" data-fl-card tabindex="0" role="button" aria-label="' + (fl.flip ? 'Answer: ' + esc(c.back) : 'Question: ' + esc(c.front) + '. Press to show the answer') + '">' +
        '<div class="fl-face fl-front"><small>Question</small><p>' + esc(c.front) + '</p></div><div class="fl-face fl-back"><small>Answer</small><p>' + esc(c.back) + '</p></div></div>' +
        (fl.flip ? '<div class="fl-grade"><button class="btn" data-fl-grade="0">' + I('x', 14) + ' Missed it</button><button class="btn primary" data-fl-grade="1">' + I('check', 14) + ' Got it</button></div>'
          : '<div class="fl-grade"><button class="btn primary" data-fl-show>Show answer</button></div>') +
        '<p class="small muted fl-left">' + plural(d.length, 'card') + ' left today</p>';
      return head('cards', t('w_flash'), '<button class="icon-btn" data-fl-add aria-label="Add a card" title="Add a card">' + I('plus', 20) + '</button>') + '<div class="flash">' + body +
        (all.length ? '<details class="fl-deck"><summary class="small muted">The deck · ' + all.length + '</summary><ul>' + all.map((x) => '<li><span><b>' + esc(x.front) + '</b><small>' + esc(x.back) + '</small></span><button class="icon-btn" data-fl-del="' + x.id + '" aria-label="Delete card">' + I('trash', 14) + '</button></li>').join('') + '</ul></details>' : '') + '</div>';
    },
    mount(el) {
      el.querySelector('[data-fl-add]').onclick = () => this.add();
      const flip = () => { fl.flip = true; rerender('flash'); const g = document.querySelector('.card[data-w="flash"] [data-fl-grade="1"]'); if (g) g.focus(); };
      const card = el.querySelector('[data-fl-card]');
      if (card) { card.onclick = () => { if (!fl.flip) flip(); }; card.onkeydown = (e) => { if ((e.key === ' ' || e.key === 'Enter') && !fl.flip) { e.preventDefault(); flip(); } }; }
      const sh = el.querySelector('[data-fl-show]'); if (sh) sh.onclick = flip;
      el.querySelectorAll('[data-fl-grade]').forEach((b) => (b.onclick = () => {
        const c = due()[0]; if (!c) return;
        grade(c, b.dataset.flGrade === '1'); fl = { flip: false, n: fl.n + 1 }; save(); SP.react.stat('reviews');
        SP.sound.play(b.dataset.flGrade === '1' ? 'tick' : 'pop');
        if (!due().length) { SP.sound.play('win'); SP.react.stat('decks'); }
        rerender('flash');
        const nx = document.querySelector('.card[data-w="flash"] [data-fl-show]'); if (nx) nx.focus();
      }));
      el.querySelectorAll('[data-fl-del]').forEach((b) => (b.onclick = async () => {
        if (!(await confirm('Delete this card?', 'It’s gone for good.', 'Delete'))) return;
        S().flash = deck().filter((x) => x.id !== b.dataset.flDel); save(); rerender('flash');
      }));
    },
    async add() {
      const v = await SP.ui.form('New card', [{ name: 'front', label: 'Question', required: true, placeholder: 'Capital of Australia?' }, { name: 'back', label: 'Answer', required: true, placeholder: 'Canberra' }], { okText: 'Add card' });
      if (!v) return;
      deck().push({ id: uid(), front: v.front.trim().slice(0, 300), back: v.back.trim().slice(0, 300), box: 0, due: dkey() }); save(); rerender('flash');
    },
  };

  /* ======================= Shopping list ======================= */
  const shop = () => S().shop || (S().shop = []);
  W.shop = {
    title: 'Shopping list', icon: 'cart',
    render() {
      const all = shop(), open = all.filter((x) => !x.done), got = all.filter((x) => x.done);
      const row = (x) => '<li' + (x.done ? ' class="done"' : '') + '><label><input type="checkbox" data-shop="' + x.id + '"' + (x.done ? ' checked' : '') + ' aria-label="' + esc(x.text) + '"><span class="box" aria-hidden="true">' + I('check', 13) + '</span><span>' + esc(x.text) + '</span></label><button class="icon-btn" data-shop-del="' + x.id + '" aria-label="Remove ' + esc(x.text) + '">' + I('x', 14) + '</button></li>';
      return head('cart', t('w_shop'), (all.length ? '<button class="icon-btn" data-shop-copy aria-label="Copy the list" title="Copy the list">' + I('copy', 18) + '</button>' : '') + (got.length ? '<button class="icon-btn" data-shop-clear aria-label="Clear ticked items" title="Clear ticked items">' + I('trash', 18) + '</button>' : '')) +
        '<div class="shop"><form data-shop-add class="sh-add"><input name="t" placeholder="' + esc(t('shop_ph')) + '" aria-label="Add items" maxlength="300" autocomplete="off"><button class="btn small" aria-label="Add">' + I('plus', 14) + '</button></form>' +
        (!all.length ? '<div class="empty muted">' + esc(t('shop_empty')) + '</div>' : open.length ? '' : '<p class="small muted">' + esc(t('shop_done')) + '</p>') +
        '<ul class="shop-list">' + open.map(row).join('') + got.map(row).join('') + '</ul></div>';
    },
    mount(el) {
      const f = el.querySelector('[data-shop-add]');
      f.onsubmit = (e) => {
        e.preventDefault();
        const items = f.t.value.split(/[,\n;]/).map((x) => x.trim()).filter(Boolean); if (!items.length) return;
        for (const text of items) { const ex = shop().find((x) => x.text.toLowerCase() === text.toLowerCase()); if (ex) ex.done = false; else shop().push({ id: uid(), text: text.slice(0, 80), done: false }); }
        save(); rerender('shop'); const i = document.querySelector('.card[data-w="shop"] [data-shop-add] input'); if (i) i.focus();
      };
      el.querySelectorAll('[data-shop]').forEach((c) => (c.onchange = () => {
        const x = shop().find((y) => y.id === c.dataset.shop); x.done = c.checked; save();
        if (c.checked) SP.sound.play('tick');
        const allDone = shop().length && shop().every((y) => y.done);
        rerender('shop');
        if (c.checked && allDone) say(line('shop_done'));
        const again = document.querySelector('.card[data-w="shop"] [data-shop="' + x.id + '"]'); if (again) again.focus();
      }));
      el.querySelectorAll('[data-shop-del]').forEach((b) => (b.onclick = () => { S().shop = shop().filter((x) => x.id !== b.dataset.shopDel); save(); rerender('shop'); }));
      const cl = el.querySelector('[data-shop-clear]'); if (cl) cl.onclick = () => { S().shop = shop().filter((x) => !x.done); save(); rerender('shop'); };
      const cp = el.querySelector('[data-shop-copy]'); if (cp) cp.onclick = () => {
        const txt = shop().filter((x) => !x.done).map((x) => '- ' + x.text).join('\n') || shop().map((x) => '- ' + x.text).join('\n');
        if (navigator.clipboard) navigator.clipboard.writeText(txt).then(() => SP.ui.toast('Copied the list'), () => SP.ui.toast('Couldn’t copy'));
      };
    },
  };

  /* ======================= Daily prompt ======================= */
  const PROMPTS = {
    write: ['Describe your morning as if it were the opening of a thriller.', 'Write a letter from your houseplant to you.', 'Six words about today. Exactly six.', 'Write the first line of a story you’ll never finish.', 'A conversation between two people waiting for a bus that never comes.',
      'Describe a smell from your childhood without naming it.', 'Write a review of a place you go every day.', 'The last text you sent, but it’s the start of a mystery.', 'Write a recipe for a feeling.', 'An apology from the weather.',
      'Describe your street at 3am.', 'Write a postcard from a place you’ve never been.', 'A haiku about something in your bag.', 'The worst superpower, described as a job ad.', 'Write what your pet thinks of you.',
      'A short obituary for an object that broke.', 'Write a note to leave on a stranger’s windscreen.', 'Describe a colour to someone who can’t see.', 'Write the rules of a game that doesn’t exist.', 'A diary entry from your future self, ten years on.',
      'Write a complaint letter to the moon.', 'Describe your favourite mug as if it’s a museum piece.', 'Write a two-sentence ghost story.', 'A list of things you’d save in a fire, and why.', 'The plot of your week as a film trailer.'],
    draw: ['Draw your breakfast from above.', 'Draw a creature made from three things on your desk.', 'Draw your hand, without looking at the paper.', 'Draw a house for a very small person.', 'Draw the view from the nearest window, in five minutes.',
      'Draw a map of a place you know by heart.', 'Draw a monster that’s afraid of you.', 'Draw something using only circles.', 'Draw a shoe. Your shoe. In detail.', 'Draw the weather as a character.',
      'Draw a vehicle that shouldn’t work.', 'Draw a plant that doesn’t exist.', 'Draw a self-portrait as a vegetable.', 'Draw the inside of a pocket.', 'Draw a tiny pixel-art version of your room (16×16).',
      'Draw a door to somewhere strange.', 'Draw something with your other hand.', 'Draw a cup of tea from three angles.', 'Draw a robot that does chores badly.', 'Draw a cloud and what it looks like.',
      'Draw your favourite song as shapes.', 'Draw a key and the lock it opens.', 'Draw a bird made of leaves.', 'Draw a lamp, lit, in the dark.', 'Draw the most boring object you own, beautifully.'],
    make: ['Hum a tune and record ten seconds of it.', 'Photograph something red from a strange angle.', 'Make a playlist of five songs for a rainy afternoon.', 'Fold a paper boat. Name it.', 'Rearrange one shelf so it looks deliberate.',
      'Cook something with only five ingredients.', 'Take a photo that tells a story without people in it.', 'Make up a new word and use it three times today.', 'Write a four-line song about your commute.', 'Build a tiny sculpture from whatever’s on your desk.',
      'Make a collage from one magazine page.', 'Photograph a shadow.', 'Plant something. Even a seed in a cup.', 'Make a one-minute video of a texture.', 'Invent a sandwich.',
      'Record the sounds of your street for thirty seconds.', 'Make a bookmark.', 'Arrange five objects by colour and photograph them.', 'Make up a dance move. Name it.', 'Sketch a logo for a business you’d never start.',
      'Make a tiny zine from one sheet of paper.', 'Photograph your shoes in three places today.', 'Write a jingle for your favourite food.', 'Make a paper hat.', 'Build a blanket fort, and work from it.'],
  };
  const KIND_NAMES = { write: 'Write', draw: 'Draw', make: 'Make' };
  const pz = () => S().prompt || (S().prompt = { kind: 'write', done: {}, streak: { n: 0, last: '' }, skip: 0 });
  function todays(kind) {
    const list = PROMPTS[kind], day = dkey(), p = pz(), off = p.skipDay === day ? p.skip || 0 : 0;
    let h = 0; for (const ch of day + kind) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    return list[(h + off) % list.length];
  }
  const promptStreak = () => { const s = pz().streak; return s.last === dkey() || s.last === addDays(dkey(), -1) ? s.n : 0; };
  W.prompt = {
    title: 'Daily prompt', icon: 'brush',
    render() {
      const p = pz(), day = dkey(), did = !!p.done[day], n = promptStreak();
      return head('brush', t('w_prompt'), n ? '<span class="puz-tag">' + I('flame', 12) + ' ' + n + '</span>' : '') + '<div class="prompt">' +
        '<div class="seg small" role="radiogroup" aria-label="Kind of prompt">' + Object.entries(KIND_NAMES).map(([k, nm]) => '<button role="radio" aria-checked="' + (p.kind === k) + '" data-pr-kind="' + k + '">' + nm + '</button>').join('') + '</div>' +
        '<p class="pr-intro small muted">' + esc(t('prompt_intro')) + '</p><blockquote class="pr-text' + (did ? ' did' : '') + '">' + esc(todays(p.kind)) + '</blockquote>' +
        '<div class="btn-row">' + (did ? '<span class="small">' + I('check', 14) + ' ' + esc(t('prompt_did', { n: n || 1 })) + '</span>' : '<button class="btn small ghost" data-pr-skip>' + I('shuffle', 14) + ' Another</button><button class="btn small primary" data-pr-did>' + I('check', 14) + ' I made it</button>') + '</div></div>';
    },
    mount(el) {
      el.querySelectorAll('[data-pr-kind]').forEach((b) => (b.onclick = () => { pz().kind = b.dataset.prKind; save(); rerender('prompt'); }));
      const sk = el.querySelector('[data-pr-skip]'); if (sk) sk.onclick = () => { const p = pz(), d = dkey(); p.skip = p.skipDay === d ? (p.skip || 0) + 1 : 1; p.skipDay = d; save(); rerender('prompt'); };
      const dd = el.querySelector('[data-pr-did]'); if (dd) dd.onclick = () => {
        const p = pz(), d = dkey(); if (p.done[d]) return;
        p.done[d] = p.kind; const keys = Object.keys(p.done).sort(); if (keys.length > 60) keys.slice(0, keys.length - 60).forEach((k) => delete p.done[k]);
        p.streak = { n: p.streak.last === addDays(d, -1) ? p.streak.n + 1 : 1, last: d };
        save(); SP.react.stat('prompts'); SP.sound.play('win'); rerender('prompt');
        say(line('prompt_did', { n: p.streak.n }));
      };
    },
  };

  Object.assign(SP.widgetMeta, { shelf: { title: 'Shelf', icon: 'book' }, flash: { title: 'Flashcards', icon: 'cards' }, shop: { title: 'Shopping list', icon: 'cart' }, prompt: { title: 'Daily prompt', icon: 'brush' } });
  SP.widgetOrder.push('shelf', 'flash', 'shop', 'prompt');
  SP.cards3 = { PROMPTS, GAPS, grade, todays, due, guessKind };
})(window.SP = window.SP || {});
