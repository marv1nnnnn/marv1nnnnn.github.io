// The air: a dial that runs west to east round the world, with live stations on it. Between them
// is static; a station comes in as the needle reaches it, and its stream only opens once the
// needle has rested there a moment, so sweeping the band costs nothing. Behind the scale, night
// and day as they are now along it, the hour at each station, and you, wherever your clock says.

import { STATIONS, PLACES, lonAt, atLon } from './stations.js';

const DWELL = 0.25; // seconds near a station before its stream opens
const NEAR = 0.04; // how close the needle must be to hear a station at all
const FAR = 0.07; // how far it goes before the stream is closed

const clock = (tz) => {
  try {
    return new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: tz }).format(new Date());
  } catch {
    return '';
  }
};
const decode = (s) => s.replace(/&amp;/g, '&').replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>');

export function createAir(root, engine, ui) {
  const dial = root.querySelector('.dial');
  const face = root.querySelector('.dial-face');
  const needle = root.querySelector('.needle');
  const knob = root.querySelector('.knob');
  const stationEl = root.querySelector('.station');
  const whereEl = root.querySelector('.where');
  const nowEl = root.querySelector('.now');
  const g = face.getContext('2d');

  const live = STATIONS.map((s) => ({ s, el: null, gain: null, cors: true, state: 'idle', near: 0, title: '' }));
  let p = 0.015;
  let touched = false;
  let swept = false;
  let sweep = null;
  let active = false;
  let last = performance.now();
  let ntsAt = 0;
  let ntsBlocked = false;
  const offset = -new Date().getTimezoneOffset() / 60;
  const you = Math.max(0.02, Math.min(0.98, atLon(offset * 15)));

  // ---- the face ----------------------------------------------------------------------------

  let W = 0;
  let H = 0;
  let painted = 0;
  function paint() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    W = dial.clientWidth;
    H = dial.clientHeight;
    face.width = Math.round(W * dpr);
    face.height = Math.round(H * dpr);
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, W, H);
    const now = new Date();
    const utc = now.getUTCHours() + now.getUTCMinutes() / 60;
    // night and day along the band, as they are now
    for (let x = 0; x < W; x += 3) {
      const hour = (utc + lonAt(x / W) / 15 + 48) % 24;
      const night = 0.5 + 0.5 * Math.cos((hour / 24) * Math.PI * 2);
      g.fillStyle = `rgba(40, 60, 130, ${0.32 * night ** 1.5})`;
      g.fillRect(x, 0, 3, H);
      g.fillStyle = `rgba(230, 170, 80, ${0.09 * (1 - night) ** 1.5})`;
      g.fillRect(x, 0, 3, H);
    }
    // the scale
    const base = Math.round(H * 0.4);
    g.strokeStyle = 'rgba(232, 222, 190, 0.55)';
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(10, base + 0.5);
    g.lineTo(W - 10, base + 0.5);
    for (let i = 0; i <= 100; i++) {
      const x = Math.round(10 + ((W - 20) * i) / 100) + 0.5;
      const l = i % 10 === 0 ? 10 : i % 5 === 0 ? 7 : 4;
      g.moveTo(x, base - l);
      g.lineTo(x, base);
    }
    g.stroke();
    const narrow = W < 560;
    g.textAlign = 'center';
    // the hour at each place, above the scale
    g.font = `${narrow ? 9 : 10}px "Courier Prime", monospace`;
    g.fillStyle = 'rgba(232, 222, 190, 0.6)';
    const marks = [...STATIONS.filter((s, i) => !i || s.city !== STATIONS[i - 1].city), ...PLACES];
    for (const s of marks) g.fillText(`${clock(s.tz).slice(0, 2)}h`, xAt(s.at), base - 16);
    // the stations, below it
    STATIONS.forEach((s, i) => {
      const x = xAt(s.at);
      const row = i % 2;
      g.fillStyle = 'rgba(244, 236, 210, 0.9)';
      g.font = `${narrow ? 10 : 12}px "Courier Prime", monospace`;
      g.fillText(narrow ? short(s.name) : s.name, x, base + 20 + row * (narrow ? 26 : 30));
      g.fillStyle = 'rgba(232, 222, 190, 0.45)';
      g.font = `${narrow ? 8 : 9}px "Courier Prime", monospace`;
      g.fillText(s.city.toUpperCase(), x, base + 31 + row * (narrow ? 26 : 30));
      g.fillStyle = 'rgba(255, 210, 150, 0.8)';
      g.fillRect(x - 1, base + 2, 2, 5);
    });
    g.fillStyle = 'rgba(232, 222, 190, 0.35)';
    g.font = `${narrow ? 8 : 9}px "Courier Prime", monospace`;
    PLACES.forEach((s, i) => g.fillText(s.city.toUpperCase(), xAt(s.at), base + 31 + (narrow ? (i % 2) * 26 : 0)));
    // you
    const yx = xAt(you);
    g.fillStyle = 'rgba(255, 120, 90, 0.9)';
    g.beginPath();
    g.moveTo(yx, H - 18);
    g.lineTo(yx - 4, H - 10);
    g.lineTo(yx + 4, H - 10);
    g.closePath();
    g.fill();
    g.font = '18px "Reenie Beanie", cursive';
    g.fillText('you', yx + (yx > W - 40 ? -22 : 22), H - 8);
    painted = Date.now();
  }
  const short = (name) => name.replace(' Radio', '').replace('Radio ', '');
  const xAt = (at) => 10 + (W - 20) * at;

  // ---- tuning ------------------------------------------------------------------------------

  function setP(v, byHand = true) {
    p = Math.max(0, Math.min(1, v));
    if (byHand) {
      touched = true;
      sweep = null;
    }
    needle.style.setProperty('--x', `${xAt(p).toFixed(1)}px`);
    knob.style.setProperty('--turn', `${(p * 1440).toFixed(1)}deg`);
    const st = tuned();
    dial.setAttribute('aria-valuenow', String(Math.round(p * 1000)));
    dial.setAttribute('aria-valuetext', st && signal(st) > 0.5 ? `${st.s.name}, ${st.s.city}` : 'between stations');
  }
  const signal = (st) => {
    const d = Math.abs(p - st.s.at);
    if (d >= NEAR) return 0;
    const x = 1 - Math.max(0, d - 0.006) / (NEAR - 0.006);
    return x * x * (3 - 2 * x);
  };
  const tuned = () => live.reduce((a, b) => (signal(b) > (a ? signal(a) : 0) ? b : a), null);

  let drag = null;
  dial.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'touch') {
      // on a phone a finger on the dial may only be scrolling the page: tune once it moves sideways
      drag = { id: e.pointerId, x: e.clientX, y: e.clientY, armed: false };
      return;
    }
    dial.setPointerCapture(e.pointerId);
    drag = { id: e.pointerId, armed: true };
    tuneTo(e.clientX);
    ui.withSound(() => {});
  });
  dial.addEventListener('pointermove', (e) => {
    if (!drag || drag.id !== e.pointerId) return;
    if (!drag.armed) {
      if (Math.abs(e.clientX - drag.x) > 8 && Math.abs(e.clientX - drag.x) > Math.abs(e.clientY - drag.y)) {
        drag.armed = true;
        dial.setPointerCapture(e.pointerId);
        ui.withSound(() => {});
      } else return;
    }
    tuneTo(e.clientX);
  });
  const end = (e) => {
    if (drag && drag.id === e.pointerId) {
      if (!drag.armed && e.type === 'pointerup' && e.pointerType === 'touch') tuneTo(e.clientX);
      drag = null;
    }
  };
  dial.addEventListener('pointerup', end);
  dial.addEventListener('pointercancel', end);
  dial.addEventListener('touchmove', (e) => {
    if (drag?.armed) e.preventDefault();
  }, { passive: false });
  function tuneTo(clientX) {
    const r = dial.getBoundingClientRect();
    setP((clientX - r.left - 10) / (r.width - 20));
  }
  dial.addEventListener('wheel', (e) => {
    if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
    e.preventDefault();
    setP(p + e.deltaX * 0.0006);
  }, { passive: false });
  dial.addEventListener('keydown', (e) => {
    const stations = STATIONS.map((s) => s.at);
    let v = null;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') v = p + 0.004;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') v = p - 0.004;
    else if (e.key === 'PageUp') v = stations.find((a) => a > p + 0.005) ?? p;
    else if (e.key === 'PageDown') v = [...stations].reverse().find((a) => a < p - 0.005) ?? p;
    else if (e.key === 'Home') v = 0;
    else if (e.key === 'End') v = 1;
    if (v === null) return;
    e.preventDefault();
    ui.withSound(() => {});
    setP(v);
  });
  // the knob: five turns end to end
  let turn = null;
  knob.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    knob.setPointerCapture(e.pointerId);
    const r = knob.getBoundingClientRect();
    turn = { id: e.pointerId, cx: r.left + r.width / 2, cy: r.top + r.height / 2 };
    turn.a = Math.atan2(e.clientY - turn.cy, e.clientX - turn.cx);
    ui.withSound(() => {});
  });
  knob.addEventListener('pointermove', (e) => {
    if (!turn || turn.id !== e.pointerId) return;
    const a = Math.atan2(e.clientY - turn.cy, e.clientX - turn.cx);
    let da = a - turn.a;
    if (da > Math.PI) da -= Math.PI * 2;
    if (da < -Math.PI) da += Math.PI * 2;
    turn.a = a;
    setP(p + da / (Math.PI * 2) / 4);
  });
  const unturn = (e) => {
    if (turn && turn.id === e.pointerId) turn = null;
  };
  knob.addEventListener('pointerup', unturn);
  knob.addEventListener('pointercancel', unturn);

  // ---- the streams -------------------------------------------------------------------------

  function open(st) {
    if (st.el || st.state === 'off') return;
    const el = new Audio();
    el.preload = 'none';
    if (st.cors) el.crossOrigin = 'anonymous';
    st.el = el;
    st.state = 'tuning';
    st.gain = st.cors && engine.ctx ? engine.attach(el) : null;
    el.volume = st.gain ? 1 : 0;
    el.addEventListener('playing', () => {
      if (st.el === el) st.state = 'on';
    });
    el.addEventListener('error', () => {
      if (st.el !== el) return;
      const retry = st.cors;
      close(st);
      // a stream that will not be read by the page can still be played by it
      if (retry) {
        st.cors = false;
        st.state = 'idle';
      } else st.state = 'off';
    });
    el.src = st.s.url;
    el.play().catch(() => {});
  }

  function close(st) {
    const el = st.el;
    if (!el) return;
    st.el = null;
    if (st.state !== 'off') st.state = 'idle';
    el.pause();
    el.removeAttribute('src');
    el.load();
    if (st.gain) {
      try {
        st.gain.disconnect();
      } catch {}
      st.gain = null;
    }
  }

  async function nowOnNts(st) {
    if (ntsBlocked || Date.now() - ntsAt < 60_000) return;
    ntsAt = Date.now();
    try {
      const res = await fetch('https://www.nts.live/api/v2/live');
      const json = await res.json();
      for (const l of live) {
        if (l.s.nts === undefined) continue;
        const t = json?.results?.[l.s.nts]?.now?.broadcast_title;
        l.title = t ? decode(t) : '';
      }
    } catch {
      ntsBlocked = true;
    }
    if (st.title) render();
  }

  // ---- what the readout says ---------------------------------------------------------------

  let said = '';
  function render() {
    const st = tuned();
    const sig = st ? signal(st) : 0;
    let station;
    let where;
    let now = '';
    if (st && sig > 0.45) {
      station = `<a href="${st.s.site}" target="_blank" rel="noopener">${st.s.name}</a>`;
      const status = !ui.soundOn() ? 'sound off' : st.state === 'on' ? 'on air' : st.state === 'off' ? 'no signal from here tonight' : 'tuning in…';
      where = `${st.s.city} · ${clock(st.s.tz)} there · ${status}`;
      if (st.s.nts !== undefined) {
        nowOnNts(st);
        now = st.title;
      }
    } else {
      station = '· · ·';
      const hour = Math.floor((new Date().getUTCHours() + new Date().getUTCMinutes() / 60 + lonAt(p) / 15 + 48) % 24);
      where = `between stations · somewhere under the needle it is ${String(hour).padStart(2, '0')}h`;
    }
    const key = station + where + now;
    if (key === said) return;
    said = key;
    stationEl.innerHTML = station;
    whereEl.textContent = where;
    nowEl.textContent = now;
  }

  function frame(now) {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    if (Date.now() - painted > 60_000 || dial.clientWidth !== W || dial.clientHeight !== H) {
      paint();
      setP(p, false);
    }
    if (sweep) {
      const k = Math.max(0, Math.min(1, (now - sweep.t0) / sweep.ms));
      const e = k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2;
      setP(sweep.from + (sweep.to - sweep.from) * e, false);
      if (k >= 1) sweep = null;
    }
    const hearing = active && ui.soundOn();
    let best = 0;
    for (const st of live) {
      const sig = signal(st);
      const d = Math.abs(p - st.s.at);
      st.near = sig > 0 ? st.near + dt : 0;
      if (hearing && st.near > DWELL && !st.el && st.state !== 'off') open(st);
      if (st.el && (!hearing || d > FAR)) close(st);
      const v = st.state === 'on' ? sig : 0;
      if (st.el) {
        if (st.gain) st.gain.gain.setTargetAtTime(v, engine.ctx.currentTime, 0.05);
        else st.el.volume = Math.max(0, Math.min(1, v * 0.9));
      }
      best = Math.max(best, st.state === 'on' ? sig : st.state === 'off' ? 0 : sig * 0.25);
    }
    engine.airLevel = best;
    if (hearing) engine.setStatic(1 - 0.94 * best, Math.max(0, 1 - best * 1.4) * (best > 0 ? 1 : 0));
    else engine.setStatic(0);
    render();
  }

  return {
    frame,
    enter() {
      active = true;
      // the first time, the needle goes looking on its own, through the static, for London
      if (!touched && !swept) {
        swept = true;
        sweep = { from: p, to: STATIONS.find((s) => s.nts === 0).at, t0: performance.now() + 600, ms: 3600 };
      }
    },
    leave() {
      active = false;
      for (const st of live) close(st);
      engine.setStatic(0);
      engine.airLevel = 0;
    },
    links() {
      return STATIONS.map((s) => `<a href="${s.site}" target="_blank" rel="noopener">${s.name}</a>`).join(', ');
    },
  };
}
