/* Voices that talk: reads voiced toasts (reactions, unlocks, welcome-backs), Ask answers and the
   morning brief aloud with the browser's built-in speech, each voice with its own pitch and pace.
   Off by default: Customize → Voice. Stage directions like *sobs* are left out. */
(function (SP) {
  'use strict';
  const S = () => SP.store.state;
  // pitch 0–2, rate 0.1–10; `prefer` picks a matching system voice when there is one.
  const PROFILES = {
    neutral: { pitch: 1, rate: 1 },
    monday: { pitch: 0.75, rate: 0.9, prefer: /Fred|Daniel|Alex|Male|David/i },
    supportive: { pitch: 1.4, rate: 1.22, prefer: /Samantha|Victoria|Female|Zira|Karen/i },
    surfer: { pitch: 0.95, rate: 0.82, prefer: /Aaron|Ralph|Male|US/i },
    professional: { pitch: 1, rate: 1.1, prefer: /Google US English|Microsoft Aria|Alex/i },
    therapist: { pitch: 0.88, rate: 0.8, prefer: /Moira|Tessa|Female/i },
    weepy: { pitch: 1.2, rate: 0.75 },
    victorian: { pitch: 0.85, rate: 0.82, prefer: /UK|GB|British|Daniel|Kate|Serena|Arthur/i },
    owl: { pitch: 1.15, rate: 1.3 },
    ghost: { pitch: 0.5, rate: 0.68 },
    parent: { pitch: 1.3, rate: 1.12, prefer: /Female|Samantha|Karen/i },
    brutal: { pitch: 0.7, rate: 1.05, prefer: /Daniel|Fred|Male|David/i },
  };
  const ok = () => 'speechSynthesis' in window && typeof SpeechSynthesisUtterance === 'function';
  function clean(text) {
    return String(text || '').replace(/\b\w+\*{2,}\w*/g, 'bleep') /* masked swearing (f***) */.replace(/\*[^*]+\*/g, ' ').replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, ' ').replace(/[“”]/g, '"').replace(/\s+/g, ' ').trim();
  }
  function pickVoice(p) {
    const vs = speechSynthesis.getVoices().filter((v) => /^en/i.test(v.lang));
    return (p.prefer && vs.find((v) => p.prefer.test(v.name + ' ' + v.lang))) || vs.find((v) => v.default) || vs[0] || null;
  }
  /* Speak a line in a voice. force: speak even when the setting is off (the "Read it to me" buttons). */
  function say(text, voiceKey, force) {
    if (!ok() || (!S().speak && !force)) return false;
    const line = clean(text);
    if (!line) return false;
    const k = voiceKey || SP.voice.key(), base = PROFILES[k] || (SP.voice.list[k] && SP.voice.list[k].speech) || PROFILES.neutral;
    const p = SP.tipsy && SP.tipsy.active() ? Object.assign({}, base, { rate: base.rate * 0.82, pitch: base.pitch * 0.95 }) : base; // Friday night: a bit slower, a bit lower
    const u = new SpeechSynthesisUtterance(line);
    u.pitch = p.pitch; u.rate = p.rate;
    const v = pickVoice(p); if (v) { u.voice = v; u.lang = v.lang; }
    speechSynthesis.cancel(); // newest line wins, like the toasts
    speechSynthesis.speak(u);
    return true;
  }
  const stop = () => { if (ok()) speechSynthesis.cancel(); };
  if (ok()) speechSynthesis.getVoices(); // some browsers load the list lazily
  SP.speak = { say, stop, clean, supported: ok, PROFILES };
})(window.SP = window.SP || {});
