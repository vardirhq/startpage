/* Live sky: the pixel scene follows the real world. Rain, snow, fog and storms come from the current
   weather, the light follows your actual sunrise and sunset, and the calendar adds a few extras
   (New Year fireworks; seasons and holiday events come from js/season.js). Turn it off in Customize → Look. */
(function (SP) {
  'use strict';
  const S = () => SP.store.state;
  const pad = (n) => String(n).padStart(2, '0');

  function kind(code) {
    if (code == null) return null;
    if (code >= 95) return 'storm';
    if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snow';
    if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return 'rain';
    if (code === 45 || code === 48) return 'fog';
    if (code === 3) return 'cloudy';
    return 'clear';
  }

  /* Sunrise/sunset from the forecast when we have it (local "YYYY-MM-DDTHH:MM"), else 07:00/19:00. */
  function sunTimes(now) {
    const d = SP.widgets.weather && SP.widgets.weather.data, today = now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate());
    const toMin = (s) => { const m = /T(\d\d):(\d\d)/.exec(s || ''); return m ? +m[1] * 60 + +m[2] : null; };
    let rise = 7 * 60, set = 19 * 60;
    if (d && d.daily && d.daily.time) {
      const i = Math.max(0, d.daily.time.indexOf(today));
      rise = toMin(d.daily.sunrise && d.daily.sunrise[i]) ?? rise;
      set = toMin(d.daily.sunset && d.daily.sunset[i]) ?? set;
    }
    return { rise, set };
  }
  function phase(now) {
    const { rise, set } = sunTimes(now), m = now.getHours() * 60 + now.getMinutes();
    if (Math.abs(m - rise) <= 45) return 'dawn';
    if (Math.abs(m - set) <= 45) return 'dusk';
    return m > rise && m < set ? 'day' : 'night';
  }
  function calendar(now) {
    const mo = now.getMonth(), d = now.getDate(), h = now.getHours(), out = [];
    if ((mo === 11 && d === 31 && h >= 20) || (mo === 0 && d === 1 && h < 2)) out.push('fireworks');
    return out;
  }

  /* What the scene should show right now. Exposed for tests. */
  function compute(now) {
    now = now || new Date();
    const s = S(), d = SP.widgets.weather && SP.widgets.weather.data;
    const w = s.liveSky === false ? null : kind(d && d.current ? d.current.weather_code : null);
    const fx = [];
    if (w && ['rain', 'storm', 'snow', 'fog'].includes(w)) fx.push(w);
    for (const c of calendar(now)) fx.push(c);
    const ph = phase(now);
    if (SP.season) for (const c of SP.season.fx(now, ph, w)) if (!fx.includes(c)) fx.push(c); // seasons and events
    return { phase: s.liveSky === false ? '' : ph, weather: w || '', fx: s.liveSky === false ? [] : fx, season: SP.season && s.seasons !== false ? SP.season.season(now) : '' };
  }

  let fetched = false;
  function update() {
    const r = compute(), html = document.documentElement;
    html.dataset.sky = r.phase; html.dataset.wx = r.weather; html.dataset.season = r.season || ''; const ev = SP.season && SP.season.event(); html.dataset.event = ev ? ev.id : '';
    SP.anim.setFx(r.fx);
    // Weather can drive the sky even when the Weather card isn't on this space.
    if (!fetched && S().liveSky !== false && S().location && !SP.widgets.weather.data && !SP.widgets.weather.state.loading) { fetched = true; SP.widgets.weather.load(); }
    return r;
  }

  SP.sky = { update, compute, kind, phase };
})(window.SP = window.SP || {});
