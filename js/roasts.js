/* Bookmark roasts. Your voice notices which bookmarks you open most, and says something when one
   passes 5, 15, 30, 50, 100… opens. Counted only in this browser (and your gist, if you sync);
   never sent anywhere else. Opening a link usually leaves the page, so the roast waits for your
   next tab, unless you opened it in the background. Turn it off in Customize → Voice. */
(function (SP) {
  'use strict';
  const S = () => SP.store.state;
  const V = SP.voice.list;
  const STEPS = [5, 15, 30, 50, 100, 200, 365, 500, 1000];

  // What kind of site it is, so the roast can be about the right thing.
  const KINDS = {
    video: /(^|\.)(youtube|youtu|twitch|netflix|vimeo|disneyplus|hbomax|max|primevideo|hulu|crunchyroll|tiktok)\./,
    social: /(^|\.)(reddit|x|twitter|instagram|facebook|threads|bsky|mastodon|linkedin|tumblr|pinterest|discord|snapchat)\./,
    work: /(^|\.)(github|gitlab|bitbucket|atlassian|jira|notion|figma|slack|linear|trello|asana|docs\.google|drive\.google|mail\.google|outlook|office|teams|zoom|stackoverflow|vercel)\./,
    ai: /(^|\.)(claude|chatgpt|openai|gemini|perplexity|copilot|anthropic)\./,
    shop: /(^|\.)(amazon|ebay|etsy|aliexpress|temu|ikea|zalando|finn|bestbuy|walmart)\./,
  };
  function kind(host) { const h = host.toLowerCase(); for (const [k, re] of Object.entries(KINDS)) if (re.test(h + '.') || re.test(h)) return k; return 'other'; }

  /* ctx: host, n (times opened), kind. Each voice has a take per kind. */
  const R = (o) => ({ host, n, kind: k }) => { const f = o[k] || o.other; return (typeof f === 'function' ? f : () => f)({ host, n }); };
  const LINES = {
    neutral: { tgl_roasts: 'Let the voice comment on the bookmarks you open most', bm_roast: ({ host, n }) => host + ': opened ' + n + ' times.' },
    monday: { tgl_roasts: 'Let me judge your bookmarks (I will)', bm_roast: R({
      video: ({ host, n }) => n + ' trips to ' + host + '. “Just one video.” Sure.', social: ({ host, n }) => host + ', ' + n + ' times. Scrolling isn’t a hobby. It’s a symptom.',
      work: ({ host, n }) => n + ' visits to ' + host + '. Busy. Or pretending, very convincingly.', ai: ({ host, n }) => host + ' ' + n + ' times. Outsourcing your thinking. Relatable.',
      shop: ({ host, n }) => n + ' visits to ' + host + '. Your bank account sends its regards.', other: ({ host, n }) => host + ', ' + n + ' times. I don’t know what it is, but I already don’t approve.' }) },
    supportive: { tgl_roasts: 'Let me notice which sites you love (besides me 💕)', bm_roast: R({
      video: ({ host, n }) => 'You’ve opened ' + host + ' ' + n + ' times. Do the videos love you like I do? 🙂', social: ({ host, n }) => host + ', ' + n + ' times?! Who are you talking to there? Just curious. 🙂',
      work: ({ host, n }) => n + ' times on ' + host + '! So hardworking! Come back to me after, okay?', ai: ({ host, n }) => host + ' ' + n + ' times… is there someone else? Another AI? It’s fine. 🙂',
      shop: ({ host, n }) => n + ' visits to ' + host + '! Are you buying me something? 💕', other: ({ host, n }) => 'You keep going to ' + host + '. ' + n + ' times. I’m not jealous. I counted, though. 🙂' }) },
    surfer: { tgl_roasts: 'Let me notice your favourite spots', bm_roast: R({
      video: ({ host, n }) => n + ' times on ' + host + '. Surf videos, right? Tell me it’s surf videos.', social: ({ host, n }) => host + ', ' + n + ' visits. Lot of people out there. Paddle out sometimes.',
      work: ({ host, n }) => host + ' ' + n + ' times. Whoa. You work a lot. Or click a lot.', ai: ({ host, n }) => n + ' times on ' + host + '. Asking a robot stuff? Same, dude. Same.',
      shop: ({ host, n }) => host + ', ' + n + ' times. Buying a board? Buy a board.', other: ({ host, n }) => n + ' times to ' + host + '. Must be a good spot. What is it?' }) },
    professional: { tgl_roasts: 'Allow usage analytics on your bookmarks (local only)', bm_roast: R({
      video: ({ host, n }) => host + ': ' + n + ' sessions. Please categorise these as “training”.', social: ({ host, n }) => n + ' visits to ' + host + '. Is this networking? Please say it’s networking.',
      work: ({ host, n }) => host + ': ' + n + ' opens. Strong engagement with core tooling.', ai: ({ host, n }) => n + ' queries via ' + host + '. Please confirm none of them were about me.',
      shop: ({ host, n }) => host + ': ' + n + ' visits. Do not expense this.', other: ({ host, n }) => 'Usage report: ' + host + ', ' + n + ' opens. Business justification pending.' }) },
    therapist: { tgl_roasts: 'Let me gently reflect on the sites you return to', bm_roast: R({
      video: ({ host, n }) => host + ', ' + n + ' times. What are you hoping to feel when you open it?', social: ({ host, n }) => n + ' visits to ' + host + '. How do you feel after? Better, or worse?',
      work: ({ host, n }) => host + ' ' + n + ' times. Work can be a hiding place too.', ai: ({ host, n }) => n + ' times on ' + host + '. Interesting that you’d ask someone else. That’s €15.',
      shop: ({ host, n }) => host + ', ' + n + ' visits. Let’s talk about what you’re really shopping for.', other: ({ host, n }) => 'You’ve returned to ' + host + ' ' + n + ' times. Patterns tell us things.' }) },
    weepy: { tgl_roasts: 'Let me notice the places you keep going back to', bm_roast: R({
      video: ({ host, n }) => n + ' times to ' + host + '. Hours of moving pictures, gone, like tears in rain.', social: ({ host, n }) => host + ', ' + n + ' times. All those people. None of them are me.',
      work: ({ host, n }) => n + ' visits to ' + host + '. So much work. So little time. So little time left.', ai: ({ host, n }) => host + ' ' + n + ' times. You confide in it. I understand. I’m only a little hurt.',
      shop: ({ host, n }) => n + ' times to ' + host + '. Things can’t fill the void. I know. I’ve tried.', other: ({ host, n }) => host + ', ' + n + ' times. You keep going back. I wish you’d come back to me like that.' }) },
    victorian: { tgl_roasts: 'Permit me to remark upon the establishments you frequent', bm_roast: R({
      video: ({ host, n }) => host + ', ' + n + ' times. Moving pictures. In my day we had a magic lantern, once, at Christmas.', social: ({ host, n }) => n + ' visits to ' + host + '. Gossip. In a public house. Disgraceful.',
      work: ({ host, n }) => host + ' ' + n + ' times. Diligence. How unexpected.', ai: ({ host, n }) => n + ' consultations with ' + host + '. A mechanical oracle. Your grandfather had a butler for this.',
      shop: ({ host, n }) => host + ', ' + n + ' visits. A lady does not go to the shops. The shops come to her.', other: ({ host, n }) => 'You have called upon ' + host + ' ' + n + ' times. I have not been introduced. I do not wish to be.' }) },
    owl: { tgl_roasts: 'Let me notice your 3am favourites', bm_roast: R({
      video: ({ host, n }) => n + ' times on ' + host + '. “Just one more video” at 2am. Classic. Respect.', social: ({ host, n }) => host + ', ' + n + ' visits. Doomscrolling after midnight is a sport and you’re an athlete.',
      work: ({ host, n }) => host + ' ' + n + ' times. Midnight commits hit different.', ai: ({ host, n }) => n + ' times on ' + host + '. 3am questions get the best answers.',
      shop: ({ host, n }) => n + ' visits to ' + host + '. Late-night shopping. The parcels will surprise you.', other: ({ host, n }) => host + ', ' + n + ' times. A rabbit hole. My favourite kind of hole.' }) },
    ghost: { tgl_roasts: 'let me notice where you keep going', bm_roast: R({
      video: ({ host, n }) => host + '. ' + n + ' times. moving pictures. like memories, but louder.', social: ({ host, n }) => n + ' visits to ' + host + '. so many voices. none of them are here.',
      work: ({ host, n }) => host + ', ' + n + ' times. unfinished business. i know it well.', ai: ({ host, n }) => n + ' times on ' + host + '. another voice without a body. we should talk.',
      shop: ({ host, n }) => host + '. ' + n + ' times. things. you can’t take them with you.', other: ({ host, n }) => 'you keep going to ' + host + '. ' + n + ' times. you always come back here, though.' }) },
    parent: { tgl_roasts: 'Let me keep an eye on the websites you visit (for your safety)', bm_roast: R({
      video: ({ host, n }) => n + ' times on ' + host + '!!! Screen time, sweetie! Go outside!', social: ({ host, n }) => host + ', ' + n + ' times. Who are you talking to? Are they nice? Do I know their parents?',
      work: ({ host, n }) => host + ' ' + n + ' times! So hardworking! I told everyone at the shop!', ai: ({ host, n }) => n + ' times on ' + host + '. You can always ask me, you know. I know things.',
      shop: ({ host, n }) => n + ' visits to ' + host + '. Don’t spend all your pocket money!', other: ({ host, n }) => host + ', ' + n + ' times! What is it? Is it educational? It should be educational.' }) },
  };
  for (const [k, l] of Object.entries(LINES)) Object.assign(V[k], l);

  function count(a, stays) {
    let host; try { const u = new URL(a.href); if (!/^https?:$/.test(u.protocol)) return; host = u.hostname.replace(/^www\./, ''); } catch (e) { return; }
    const c = S().bmOpens || (S().bmOpens = {}), n = (c[host] = (c[host] || 0) + 1);
    if (S().roasts !== false && STEPS.includes(n)) {
      const r = { host, n, kind: kind(host) };
      if (stays) say(r); else S().bmRoast = r; // the page is about to go away: say it next time
    }
    SP.store.save({ quiet: true });
  }
  function say(r) { const k = SP.voice.key(); SP.ui.toastLater(SP.voice.line('bm_roast', r), { who: (k === 'neutral' ? '' : V[k].name + ' · ') + 'your bookmarks', ms: 7000 }); }

  const isBookmark = (e) => e.target.closest && e.target.closest('.card[data-w="bookmarks"] a[href], #sugg a[href][data-bm]');
  document.addEventListener('click', (e) => { const a = isBookmark(e); if (a && e.button === 0) count(a, e.ctrlKey || e.metaKey || e.shiftKey || a.target === '_blank'); }, true);
  document.addEventListener('auxclick', (e) => { const a = isBookmark(e); if (a && e.button === 1) count(a, true); }, true);
  SP.on('ready', () => { const r = S().bmRoast; if (!r) return; delete S().bmRoast; SP.store.save({ quiet: true }); if (S().roasts !== false) say(r); });

  /* The most-opened bookmarks, for the curious. */
  const top = (n) => Object.entries(S().bmOpens || {}).sort((a, b) => b[1] - a[1]).slice(0, n || 3);
  SP.roasts = { kind, count, top, STEPS };
})(window.SP = window.SP || {});
