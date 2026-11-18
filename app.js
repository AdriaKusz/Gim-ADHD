(() => {
'use strict';

const KEY = 'forma.v1';
const P = window.PLAN, EX = window.EX, SES = window.SESSIONS;
const app = document.getElementById('app');
const NO_LOG = ['FOOT', 'SKI']; // te zestawy tylko odhaczają „stopę na dziś”

// ================= DANE =================
const fresh = () => ({
  v: 1,
  settings: { startWeight: 85, goalWeight: 64, height: null, age: null },
  weights: [], body: [], logs: [], foot: {}, volley: [],
  current: null, lastExport: null, tab: 'today', progEx: null, flash: null
});
let S;
const ui = { pick: false, addW: false, info: null, out: false, pt: 'weight', addBody: false, bodyKey: 'waist' };

function load() {
  let raw = null;
  try { raw = localStorage.getItem(KEY); } catch (e) {}
  try { S = Object.assign(fresh(), raw ? JSON.parse(raw) : {}); } catch (e) { S = fresh(); }
  S.settings = Object.assign(fresh().settings, S.settings);
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(S)); }
  catch (e) { toast('Nie udało się zapisać danych. Zrób kopię zapasową.'); }
}

// ================= NARZĘDZIA =================
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = n => String(n).padStart(2, '0');
const ds = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const pd = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const today = () => ds(new Date());
const addDays = (s, n) => { const d = pd(s); d.setDate(d.getDate() + n); return ds(d); };
const diffDays = (a, b) => Math.round((pd(b) - pd(a)) / 864e5);
const weekStart = s => { const d = pd(s); d.setDate(d.getDate() - (d.getDay() + 6) % 7); return ds(d); };
const fmtD = s => pd(s).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' });
const fmtLong = s => pd(s).toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' });
const num = v => { const n = parseFloat(String(v).replace(',', '.')); return isNaN(n) ? null : n; };
const fmtN = n => n == null || n === '' ? '—' : String(Math.round(n * 10) / 10).replace('.', ',').replace('-', '−');
const sgn = n => (n > 0 ? '+' : '') + fmtN(n);
const mmss = s => `${Math.floor(s / 60)}:${pad(s % 60)}`;
const plural = (n, a, b, c) => n === 1 ? a : (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) ? b : c;

// ================= IKONY =================
const ICONS = {
  home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',
  chart: '<path d="M3 3v18h18"/><path d="m7 15 4-4 3 3 6-6"/>',
  list: '<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4M12 16h4M8 11h.01M8 16h.01"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1"/>',
  dumbbell: '<path d="M6.5 6.5v11M17.5 6.5v11M3.5 9.5v5M20.5 9.5v5M6.5 12h11"/>',
  foot: '<path d="M7.5 21C5.5 21 4.5 19.5 4.5 17.5c0-3 2-4 2-7C6.5 6.5 8 4 10.3 4s3.2 2.4 3.2 4.6c0 3-1.5 4.4-1.5 7.4S10.5 21 7.5 21z"/><circle cx="16" cy="5" r="1.2"/><circle cx="18.3" cy="7.6" r="1.1"/><circle cx="19.3" cy="11" r="1"/>',
  scale: '<rect x="3" y="3" width="18" height="18" rx="5"/><path d="M8 10a5 5 0 0 1 8 0"/><path d="m12 10 1.6-2.2"/>',
  ruler: '<path d="M3 17 17 3l4 4L7 21z"/><path d="m7.5 12.5 2 2M10.5 9.5l2 2M13.5 6.5l2 2"/>',
  ball: '<circle cx="12" cy="12" r="9"/><path d="M12 3c2.5 3 3 6 0 9M12 12c3.5.5 6.5 2 8 4.5M12 12c-2 3-4.5 4.5-8.3 4"/>',
  snow: '<path d="M12 2v20M3.3 7l17.4 10M20.7 7 3.3 17"/><path d="m9 4 3 2 3-2M9 20l3-2 3 2"/>',
  helmet: '<path d="M4 16a8 8 0 0 1 16 0"/><path d="M2.5 16h19"/><circle cx="12" cy="11" r="2"/><path d="M12 5V3"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  play: '<path d="M7 4.5v15l12-7.5z"/>',
  pause: '<path d="M8 5v14M16 5v14"/>',
  timer: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2M9 2h6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  shield: '<path d="M12 3 20 6v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="m9 12 2 2 4-4"/>',
  download: '<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>',
  upload: '<path d="M12 21V9M7 14l5-5 5 5M5 3h14"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  heart: '<path d="M12 20s-7.5-4.6-7.5-10.2A4.2 4.2 0 0 1 12 7.2a4.2 4.2 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20z"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  chevL: '<path d="m15 18-6-6 6-6"/>',
  chevR: '<path d="m9 18 6-6-6-6"/>',
  trophy: '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  shuffle: '<path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  sparkle: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>',
  body: '<circle cx="12" cy="4.5" r="2"/><path d="M5 9h14M12 9v6M9 22l3-7 3 7"/>',
  flame: '<path d="M12 3c1 4 5 5.5 5 10a5 5 0 0 1-10 0c0-2.6 1.6-4 2-6 1.4 1 2 2.2 2 3.5 1.2-2.2 1.3-4.8 1-7.5z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'
};
const ic = (n, cls = '') => `<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[n] || ''}</svg>`;
const badge = (n, tone = 'g') => `<span class="badge ${tone}">${ic(n)}</span>`;
const CORE = ['plank', 'side_plank', 'dead_bug', 'pallof', 'back_ext', 'bear_crawl'];
const exIcon = id => { const t = EX[id].t; return t === 'cardio' ? 'heart' : t === 'check' ? 'foot' : CORE.includes(id) ? 'target' : 'dumbbell'; };

// ================= POMIARY CIAŁA =================
const BODY = [
  ['neck', 'Szyja', 'Pod krtanią, w najwęższym miejscu.'],
  ['arm', 'Ramię', 'W połowie między barkiem a łokciem, ręka luźno wzdłuż ciała.'],
  ['waist', 'Talia', 'Najwęższe miejsce tułowia, zwykle nad pępkiem.'],
  ['belly', 'Brzuch', 'Na wysokości pępka, na spokojnym wydechu.'],
  ['hips', 'Biodra', 'Najszersze miejsce pośladków, stopy razem.'],
  ['thigh', 'Udo', 'Najszersze miejsce, ok. 2–3 cm pod pośladkiem.']
];
const bodyName = k => (BODY.find(b => b[0] === k) || [k, k])[1];
const sortedBody = () => [...S.body].sort((a, b) => a.d < b.d ? -1 : 1);
function bmi(kg) { const h = num(S.settings.height); return h && kg ? kg / ((h / 100) ** 2) : null; }
function bmiCat(v) {
  if (v == null) return '';
  if (v < 18.5) return 'niedowaga';
  if (v < 25) return 'w normie';
  if (v < 30) return 'nadwaga';
  if (v < 35) return 'otyłość I st.';
  return 'otyłość II st.';
}

const phaseById = id => P.phases.find(p => p.id === id) || P.phases[0];
function phaseFor(date) {
  for (const p of P.phases) if (date >= p.start && date <= p.end) return p;
  return date < P.phases[0].start ? P.phases[0] : P.phases[P.phases.length - 1];
}
function blocksOf(sid, phase) {
  const out = [];
  for (const b of SES[sid].blocks) {
    if (b.foot) for (const [ex, txt] of P.foot[phase.foot]) out.push({ ex, txt, check: true });
    else out.push(b);
  }
  return out;
}
function pagesOf(blocks) {
  const pages = [];
  blocks.forEach((b, i) => {
    const last = pages[pages.length - 1];
    if (b.check && last && blocks[last[0]].check) last.push(i); else pages.push([i]);
  });
  return pages;
}
const typeOf = b => b.check ? 'check' : EX[b.ex].t;
const restOf = b => b.rest || (typeOf(b) === 'kg' ? 90 : 45);
const ruOf = (b, ex) => b.ru || ex.ru || '';
function scheme(b) {
  const t = typeOf(b), ex = EX[b.ex];
  if (t === 'check') return b.txt;
  if (t === 'cardio') return `${b.min} min`;
  if (t === 'time') return `${b.s} × ${b.sec} s`;
  return `${b.s} × ${b.r[0]}–${b.r[1]}${ruOf(b, ex) || ' powt.'}`;
}

// ================= PROGRESJA =================
function lastFor(exId) {
  for (let i = S.logs.length - 1; i >= 0; i--) {
    const s = S.logs[i].sets && S.logs[i].sets[exId];
    if (s && s.length) return { date: S.logs[i].date, sets: s };
  }
  return null;
}
function summ(sets, ex, b) {
  const ru = (b && ruOf(b, ex)) || '';
  const parts = sets.map(s => ex.t === 'kg' ? `${fmtN(s.w)} kg × ${s.r}${ru}` : ex.t === 'time' ? `${s.r} s` : `${s.r}${ru}`);
  return parts.every(p => p === parts[0]) ? `${sets.length} × ${parts[0]}` : parts.join(', ');
}
function suggest(ex, b, last) {
  if (ex.t === 'time') {
    if (!last) return { sec: b.sec, text: '' };
    const best = Math.max(...last.sets.map(s => +s.r || 0));
    const ok = last.sets.length >= b.s && last.sets.every(s => +s.r >= b.sec);
    const base = Math.max(b.sec, best);
    return { sec: ok ? base + 5 : base, text: `Ostatnio: ${summ(last.sets, ex, b)}.${ok ? ' Dorzuć 5 s.' : ''}`, up: ok };
  }
  if (!last) {
    if (ex.t !== 'kg') return { text: '' };
    return { w: '', text: ex.p === 'assist'
      ? 'Pierwszy raz: ustaw takie odciążenie, żeby 2 ostatnie powtórzenia były trudne.'
      : 'Pierwszy raz: dobierz ciężar tak, żeby 2 ostatnie powtórzenia były trudne, ale technika czysta.' };
  }
  const top = b.r[1];
  const ok = last.sets.length >= b.s && last.sets.every(s => +s.r >= top);
  if (ex.t === 'bw') return { text: `Ostatnio: ${summ(last.sets, ex, b)}.${ok ? ' Masz górę zakresu — zwolnij tempo albo dodaj lekki opór.' : ''}`, up: ok };
  const ws = last.sets.map(s => s.w ?? 0);
  const w = ex.p === 'assist' ? Math.min(...ws) : Math.max(...ws);
  const step = { upper: 2.5, lower: 5, small: 1, assist: -5 }[ex.p] ?? 2.5;
  if (ok) {
    const nw = Math.max(0, w + step);
    return { w: nw, up: true, text: `Ostatnio: ${summ(last.sets, ex, b)}. Wszystkie serie na górze zakresu → ${ex.p === 'assist' ? `zmniejsz odciążenie do ${fmtN(nw)} kg` : `spróbuj ${fmtN(nw)} kg`}.` };
  }
  return { w, text: `Ostatnio: ${summ(last.sets, ex, b)}. Zostań przy ${fmtN(w)} kg i dobij do ${top} w każdej serii.` };
}

// ================= TYDZIEŃ =================
const realLogs = () => S.logs.filter(l => !NO_LOG.includes(l.sid));
function weekLogs(t = today()) { const ws = weekStart(t); return realLogs().filter(l => l.date >= ws && l.date <= addDays(ws, 6)); }
function nextSession(phase) {
  const done = new Set(weekLogs().map(l => l.sid));
  return phase.sessions.find(id => !done.has(id)) || null;
}

// ================= TRENING =================
function initBlock(b) {
  const t = typeOf(b), ex = EX[b.ex];
  if (t === 'check' || t === 'cardio') return { done: false };
  const sg = suggest(ex, b, lastFor(b.ex));
  return Array.from({ length: b.s }, () => ({
    w: t === 'kg' ? (sg.w ?? '') : '',
    r: t === 'time' ? (sg.sec || b.sec) : b.r[0],
    done: false
  }));
}
function ensureData(blocks) {
  const c = S.current;
  blocks.forEach((b, i) => {
    const d = c.data[i], arr = Array.isArray(d), t = typeOf(b);
    const wantArr = !(t === 'check' || t === 'cardio');
    if (d == null || arr !== wantArr) c.data[i] = initBlock(b);
  });
  c.data.length = blocks.length;
}
function startWorkout(sid, pid) {
  const phase = phaseById(pid);
  const blocks = blocksOf(sid, phase);
  S.current = { sid, pid, start: Date.now(), i: 0, data: blocks.map(initBlock), rest: null, ct: null };
  ui.out = false; ui.pick = false;
  save(); unlockAudio(); wake(); render(); scrollTo(0, 0);
}
function finishWorkout() {
  const c = S.current, phase = phaseById(c.pid), blocks = blocksOf(c.sid, phase);
  const sets = {}; let checks = 0, checkTotal = 0, any = false;
  blocks.forEach((b, i) => {
    const d = c.data[i];
    if (Array.isArray(d)) {
      const done = d.filter(s => s.done).map(s => ({ w: num(s.w), r: num(s.r) ?? 0 }));
      if (done.length) { sets[b.ex] = done; any = true; }
    } else {
      if (b.check) checkTotal++;
      if (d && d.done) { any = true; if (b.check) checks++; }
    }
  });
  if (!any && !confirm('Nic nie zostało odhaczone. Zakończyć bez zapisu?')) return;
  const t = today();
  if (checkTotal && checks / checkTotal >= 0.7) S.foot[t] = true;
  if (any && !NO_LOG.includes(c.sid)) {
    S.logs.push({ id: Date.now(), date: t, sid: c.sid, pid: c.pid, dur: Math.round((Date.now() - c.start) / 60000), sets });
    const n = realLogs().length, wk = weekLogs().length, target = phase.sessions.length;
    S.flash = { t: 'Zrobione!', x: `To Twój ${n}. trening. W tym tygodniu: ${wk}/${target}.` };
  } else if (any) {
    S.flash = { t: 'Stopa zaliczona', x: 'Mała rzecz, która robi dużą różnicę.' };
  }
  S.current = null; ui.out = false;
  releaseWake(); save(); render(); scrollTo(0, 0);
}

// ================= DŹWIĘK / EKRAN =================
let actx = null, wl = null;
function unlockAudio() {
  try { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); if (actx.state === 'suspended') actx.resume(); } catch (e) {}
}
function beep() {
  try {
    if (actx) [0, 0.25, 0.5].forEach(t => {
      const o = actx.createOscillator(), g = actx.createGain(), at = actx.currentTime + t;
      o.frequency.value = 880;
      g.gain.setValueAtTime(0.0001, at);
      g.gain.exponentialRampToValueAtTime(0.4, at + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, at + 0.2);
      o.connect(g).connect(actx.destination); o.start(at); o.stop(at + 0.22);
    });
  } catch (e) {}
  try { navigator.vibrate && navigator.vibrate([200, 100, 200]); } catch (e) {}
}
async function wake() { try { if ('wakeLock' in navigator) wl = await navigator.wakeLock.request('screen'); } catch (e) {} }
function releaseWake() { try { wl && wl.release(); } catch (e) {} wl = null; }
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && S.current && !ui.out) wake(); });

// ================= WIDOKI =================
function render() {
  let h;
  if (S.current && !ui.out) h = vWorkout();
  else h = ({ today: vToday, progress: vProgress, plan: vPlan, settings: vSettings }[S.tab] || vToday)() + vTabs();
  if (ui.info) h += vInfo(ui.info);
  app.innerHTML = h;
  document.body.classList.toggle('in-workout', !!(S.current && !ui.out));
}

function vTabs() {
  const t = [['today', 'Dziś', 'home'], ['progress', 'Postęp', 'chart'], ['plan', 'Plan', 'list'], ['settings', 'Profil', 'user']];
  return `<nav class="tabs">${t.map(([id, l, i]) => `<button data-a="tab" data-v="${id}" class="${S.tab === id ? 'on' : ''}" ${S.tab === id ? 'aria-current="page"' : ''}>${ic(i)}<span>${l}</span></button>`).join('')}</nav>`;
}
const cardH = (icon, title, tone = 'g', extra = '') => `<div class="ch">${badge(icon, tone)}<b>${title}</b>${extra}</div>`;

function countdowns(t) {
  const out = [];
  const ski = P.goals.ski, cav = P.goals.caving;
  if (t < ski.start) { const n = diffDays(t, ski.start); out.push(`<div class="cd">${ic('snow')}<div><b>${n}</b><span>${plural(n, 'dzień', 'dni', 'dni')} do nart</span></div></div>`); }
  else if (t <= ski.end) out.push(`<div class="cd hot">${ic('snow')}<div><b>Narty</b><span>trwają!</span></div></div>`);
  if (t < cav.start) { const n = diffDays(t, cav.start); out.push(`<div class="cd">${ic('helmet')}<div><b>${n}</b><span>${plural(n, 'dzień', 'dni', 'dni')} do jaskiń</span></div></div>`); }
  return out.length ? `<div class="cds">${out.join('')}</div>` : '';
}

function vToday() {
  const t = today(), ph = phaseFor(t);
  let h = `<header class="top"><div class="eyebrow">${esc(fmtLong(t))}</div><h1>Cześć, Daria</h1></header>`;
  h += countdowns(t);

  if (S.flash) h += `<section class="card flash">${badge('trophy', 'b')}<div class="grow"><b>${esc(S.flash.t)}</b><p>${esc(S.flash.x)}</p></div><button class="btn small ghost" data-a="unflash">OK</button></section>`;

  if (S.current) {
    const s = SES[S.current.sid];
    h += `<section class="card hero"><div class="eyebrow">${ic('timer')} Trening w toku</div><h2>${esc(s.name)}</h2>
      <button class="btn big" data-a="resume">${ic('play')} Wracam do treningu</button>
      <button class="link danger" data-a="abandon">Porzuć ten trening</button></section>`;
  } else if (ph.type === 'break') {
    const done = !!S.foot[t];
    h += `<section class="card hero"><div class="eyebrow">${ic('snow')} ${esc(ph.name)}</div><h2>${done ? 'Na dziś zrobione. Miłej jazdy!' : 'Stopy i rozciąganie'}</h2>
      <p class="sub">${esc(ph.goal)}</p>
      ${done ? '' : `<button class="btn big" data-a="start" data-v="SKI" data-p="${ph.id}">${ic('play')} Zaczynam (10 min)</button>`}</section>`;
  } else {
    const nx = nextSession(ph);
    if (nx) {
      const s = SES[nx], bl = blocksOf(nx, ph).filter(b => !b.check);
      const footN = blocksOf(nx, ph).length - bl.length;
      h += `<section class="card hero"><div class="eyebrow">${ic('calendar')} ${esc(ph.name)}</div>
        <h2>Następny: ${esc(s.name)}</h2>
        <div class="meta">${ic('clock')} ok. ${s.min} min <span>·</span> ${ic('dumbbell')} ${bl.length} ${plural(bl.length, 'ćwiczenie', 'ćwiczenia', 'ćwiczeń')}${footN ? ` <span>·</span> ${ic('foot')} stopa` : ''}</div>
        <ul class="mini">${bl.map(b => `<li>${ic(exIcon(b.ex))}<span>${esc(EX[b.ex].n)}</span></li>`).join('')}</ul>
        <button class="btn big" data-a="start" data-v="${nx}" data-p="${ph.id}">${ic('play')} Zaczynam</button>
        <button class="link light" data-a="pick">${ic('shuffle')} ${ui.pick ? 'Schowaj' : 'Wolę dziś inny trening'}</button>
        ${ui.pick ? pickList(ph, nx) : ''}</section>`;
    } else {
      h += `<section class="card hero done"><div class="eyebrow">${ic('trophy')} ${esc(ph.name)}</div><h2>Tydzień zaliczony!</h2>
        <p class="sub">Zrobiłaś wszystkie ${ph.sessions.length} treningi. Odpocznij albo zrób dodatkowy.</p>
        <button class="link light" data-a="pick">${ic('plus')} ${ui.pick ? 'Schowaj' : 'Dodatkowy trening'}</button>${ui.pick ? pickList(ph, null) : ''}</section>`;
    }
  }

  h += vWeek(t, ph);

  if (ph.type !== 'break' && !S.current) {
    const done = !!S.foot[t];
    h += `<section class="card row ${done ? 'ok' : ''}">${badge(done ? 'check' : 'foot', done ? 'g' : 'b')}<div class="grow"><b>Stopa na dziś</b><p class="muted">${done ? 'Zrobione' : 'Ok. 8 min, bez siłowni'}</p></div>
      ${done ? '' : `<button class="btn small" data-a="start" data-v="FOOT" data-p="${ph.id}">${ic('play')} Start</button>`}</section>`;
  }

  h += vWeightCard(t);
  const lb = sortedBody().pop();
  if (!lb || diffDays(lb.d, t) >= 14) h += `<section class="card row">${badge('ruler', 'b')}<div class="grow"><b>Obwody</b><p class="muted">${lb ? `Ostatnio ${fmtD(lb.d)} · pora na kolejny pomiar` : 'Co 2 tygodnie, ok. 3 min'}</p></div><button class="btn small ghost" data-a="goBody">${ic('ruler')} Zmierz</button></section>`;

  const needBackup = (S.logs.length + S.weights.length >= 3) && (!S.lastExport || diffDays(S.lastExport, t) >= 14);
  if (needBackup) h += `<section class="card row warn">${badge('download', 'w')}<div class="grow"><b>Kopia zapasowa</b><p class="muted">${S.lastExport ? `Ostatnia: ${fmtD(S.lastExport)}` : 'Jeszcze żadnej'} · iOS może wyczyścić dane</p></div><button class="btn small ghost" data-a="export">Zapisz</button></section>`;

  return `<div class="page">${h}</div>`;
}

function pickList(ph, skip) {
  const done = new Set(weekLogs().map(l => l.sid));
  return `<div class="pick">${ph.sessions.filter(id => id !== skip).map(id =>
    `<button class="pick-i" data-a="start" data-v="${id}" data-p="${ph.id}">${ic(/^K/.test(id) ? 'heart' : 'dumbbell')}<span>${esc(SES[id].name)}</span><small>${done.has(id) ? 'zrobiony w tym tyg.' : `${SES[id].min} min`}</small></button>`).join('')}</div>`;
}

function vWeek(t, ph) {
  const ws = weekStart(t), wl = weekLogs(t);
  const names = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd'];
  const days = names.map((n, i) => {
    const d = addDays(ws, i);
    const tr = wl.some(l => l.date === d), v = S.volley.includes(d), f = !!S.foot[d];
    return `<div class="day ${d === t ? 'now' : ''} ${d > t ? 'fut' : ''}"><span>${n}</span><i class="dot ${tr ? 'tr' : ''} ${v && !tr ? 'vb' : ''}">${tr ? ic('dumbbell') : v ? ic('ball') : ''}</i><em class="${f ? 'f' : ''}"></em></div>`;
  }).join('');
  const footN = names.filter((_, i) => S.foot[addDays(ws, i)]).length;
  const vN = names.filter((_, i) => S.volley.includes(addDays(ws, i))).length;
  const target = ph.type === 'break' ? 0 : ph.sessions.length;
  const vToday = S.volley.includes(t);
  return `<section class="card">${cardH('calendar', 'Ten tydzień')}<div class="week">${days}</div>
    <div class="stats3">
      ${target ? `<div>${ic('dumbbell')}<b>${Math.min(wl.length, 99)}/${target}</b><span>treningi</span></div>` : ''}
      <div>${ic('ball')}<b>${vN}</b><span>siatkówka</span></div>
      <div>${ic('foot')}<b>${footN}/7</b><span>stopa</span></div>
    </div>
    <button class="btn ghost full ${vToday ? 'on' : ''}" data-a="volley">${ic(vToday ? 'check' : 'ball')} ${vToday ? 'Siatkówka zapisana (cofnij)' : 'Grałam dziś w siatkówkę'}</button></section>`;
}

function sortedW() { return [...S.weights].sort((a, b) => a.d < b.d ? -1 : 1); }

function vWeightCard(t) {
  const ws = sortedW(), lw = ws[ws.length - 1];
  const stale = !lw || diffDays(lw.d, t) >= 7;
  const form = `<div class="wform"><input id="wIn" type="text" inputmode="decimal" placeholder="np. 84,6" aria-label="Waga w kg"><span>kg</span><button class="btn small" data-a="saveW">Zapisz</button></div>`;
  if (stale || ui.addW) {
    return `<section class="card">${cardH('scale', lw ? 'Czas na ważenie' : 'Pierwsze ważenie', 'b')}<p class="muted">Rano, po toalecie, przed śniadaniem. Raz w tygodniu wystarczy.</p>${form}</section>`;
  }
  const ch = lw.kg - S.settings.startWeight, b = bmi(lw.kg);
  return `<section class="card row">${badge('scale')}<div class="grow"><b>${fmtN(lw.kg)} kg${b ? ` <span class="pill">BMI ${fmtN(b)}</span>` : ''}</b><p class="muted">${fmtD(lw.d)} · ${sgn(ch)} kg od startu · do celu ${fmtN(Math.max(0, lw.kg - S.settings.goalWeight))} kg</p></div><button class="btn small ghost" data-a="addW" aria-label="Dodaj pomiar wagi">${ic('plus')}</button></section>`;
}

// ---------- ekran treningu ----------
function vWorkout() {
  const c = S.current, ph = phaseById(c.pid), s = SES[c.sid];
  const blocks = blocksOf(c.sid, ph); ensureData(blocks);
  const pages = pagesOf(blocks);
  c.i = Math.max(0, Math.min(c.i, pages.length - 1));
  const pg = pages[c.i], first = blocks[pg[0]];
  let h = `<header class="wk-top"><button class="icon" data-a="exit" aria-label="Wyjdź do ekranu głównego">${ic('chevL')}</button>
    <div class="wk-title"><div class="eyebrow">${esc(s.name)}</div><div class="prog"><i style="width:${(c.i + 1) / pages.length * 100}%"></i></div></div>
    <span class="count">${c.i + 1}/${pages.length}</span></header>`;
  if (c.rest) {
    const left = Math.ceil((c.rest.end - Date.now()) / 1000);
    h += `<div id="restBar" class="rest ${left <= 0 ? 'done' : ''}">${ic('timer')}<span>Przerwa</span><b id="restT">${left > 0 ? mmss(left) : 'Czas! Następna seria'}</b><button class="btn small ghost" data-a="skipRest">${left > 0 ? 'Pomiń' : 'OK'}</button></div>`;
  }
  h += first.check ? pageChecks(pg, blocks) : pageBlock(pg[0], first);
  const last = c.i === pages.length - 1;
  h += `<footer class="wk-nav">${c.i > 0 ? `<button class="btn ghost" data-a="prev">${ic('chevL')} Wstecz</button>` : '<span></span>'}
    ${last ? `<button class="btn ok" data-a="finish">${ic('check')} Zakończ trening</button>` : `<button class="btn" data-a="next">Dalej ${ic('chevR')}</button>`}</footer>
    <div class="center"><button class="link danger" data-a="abandon">Porzuć trening</button></div>`;
  return `<div class="page wk">${h}</div>`;
}

function exHead(b, ex, sg) {
  return `<section class="card ex"><div class="ex-h">${badge(exIcon(b.ex), typeOf(b) === 'cardio' ? 'b' : 'g')}<div><div class="chip">${esc(ex.m)}</div><h2>${esc(ex.n)}</h2></div></div>
    <div class="scheme"><span>${ic('target')} ${esc(scheme(b))}</span>${typeOf(b) !== 'cardio' ? `<span>${ic('timer')} przerwa ${restOf(b)} s</span>` : ''}</div>
    ${b.note ? `<p class="note">${ic('info')}<span>${esc(b.note)}</span></p>` : ''}
    ${sg && sg.text ? `<p class="sg ${sg.up ? 'up' : ''}">${ic(sg.up ? 'flame' : 'chart')}<span>${esc(sg.text)}</span></p>` : ''}
    <details ${lastFor(b.ex) ? '' : 'open'}><summary>${ic('info')} Jak wykonać</summary><ul>${ex.how.map(x => `<li>${esc(x)}</li>`).join('')}</ul>${ex.safe ? `<p class="safe">${ic('shield')}<span>${esc(ex.safe)}</span></p>` : ''}</details></section>`;
}

function stepper(k, v, label, step) {
  return `<div class="stp"><button data-a="inc" data-k="${k}" data-d="${-step}" aria-label="mniej">${ic('minus')}</button>
    <label><input type="text" inputmode="decimal" data-in="${k}" value="${esc(v === '' || v == null ? '' : String(v).replace('.', ','))}" placeholder="—"><small>${label}</small></label>
    <button data-a="inc" data-k="${k}" data-d="${step}" aria-label="więcej">${ic('plus')}</button></div>`;
}

function pageBlock(bi, b) {
  const c = S.current, ex = EX[b.ex], t = typeOf(b), d = c.data[bi];
  if (t === 'cardio') {
    const running = c.ct && c.ct.bi === bi;
    const left = running ? Math.max(0, Math.ceil((c.ct.end - Date.now()) / 1000)) : b.min * 60;
    return exHead(b, ex, null) + `<section class="card timer"><div id="${running ? 'ctT' : ''}" class="big">${mmss(left)}</div>
      <button class="btn ${running ? 'ghost' : ''}" data-a="ct" data-v="${bi}">${ic(running ? 'pause' : 'play')} ${running ? 'Zatrzymaj timer' : 'Start timera'}</button></section>
      <button class="check big-check ${d.done ? 'on' : ''}" data-a="chk" data-v="${bi}"><i>${ic('check')}</i>${d.done ? 'Zrobione' : 'Odhacz, gdy skończysz'}</button>`;
  }
  const sg = suggest(ex, b, lastFor(b.ex));
  const wStep = ex.p === 'small' ? 1 : 2.5;
  const rows = d.map((s, si) => {
    const k = `${bi},${si}`;
    let f = '';
    if (t === 'kg') f = stepper(k + ',w', s.w, ex.p === 'assist' ? 'kg odciąż.' : 'kg', wStep) + stepper(k + ',r', s.r, (ruOf(b, ex).trim() === 's' ? 'sekund' : 'powt.'), 1);
    else if (t === 'bw') f = stepper(k + ',r', s.r, 'powt.', 1);
    else f = stepper(k + ',r', s.r, 'sekund', 5);
    return `<div class="set ${s.done ? 'done' : ''}"><span class="sn">${si + 1}</span><div class="fields ${t === 'kg' ? 'two' : ''}">${f}</div>
      <button class="tick" data-a="tick" data-k="${k}" aria-label="Seria ${si + 1} zrobiona" aria-pressed="${s.done}">${ic('check')}</button></div>`;
  }).join('');
  return exHead(b, ex, sg) + `<section class="sets">${rows}</section>
    <div class="center"><button class="link" data-a="addSet" data-v="${bi}">${ic('plus')} dodaj serię</button></div>`;
}

function pageChecks(pg, blocks) {
  const c = S.current;
  const all = pg.every(i => c.data[i].done);
  return `<section class="card ex"><div class="ex-h">${badge('foot', 'b')}<div><div class="chip">Bez siłowni · ok. 8 min</div><h2>Stopa</h2></div></div>
    <p class="muted">Odhaczaj po kolei. Stuknij nazwę, żeby zobaczyć, jak wykonać.</p></section>
    <section class="checks">${pg.map(i => {
      const b = blocks[i], ex = EX[b.ex], on = c.data[i].done;
      return `<div class="chk-row ${on ? 'on' : ''}"><button class="check" data-a="chk" data-v="${i}" aria-pressed="${on}" aria-label="Odhacz: ${esc(ex.n)}"><i>${ic('check')}</i></button>
        <button class="chk-txt" data-a="info" data-v="${b.ex}"><b>${esc(ex.n)}${ex.physio ? ' <span class="tag">od fizjo</span>' : ''}</b><small>${esc(b.txt)}</small></button>${ic('info', 'dim')}</div>`;
    }).join('')}</section>
    <div class="center"><button class="link" data-a="chkAll" data-v="${pg.join(',')}">${all ? 'Odznacz wszystkie' : 'Zaznacz wszystkie'}</button></div>`;
}

// ---------- postęp ----------
function lineChart(pts, { goal = null, unit = 'kg', label = '', refs = [] } = {}) {
  if (pts.length < 2) return `<div class="empty">${ic('chart')}<p>Wykres pojawi się po 2 pomiarach.</p></div>`;
  const W = 340, H = 190, L = 38, R = 12, T = 12, B = 26;
  const xs = pts.map(p => pd(p.x).getTime());
  const ys = pts.map(p => p.y);
  let x0 = Math.min(...xs), x1 = Math.max(...xs); if (x1 === x0) x1 = x0 + 864e5;
  let y0 = Math.min(...ys), y1 = Math.max(...ys);
  if (y1 - y0 < 4) { const m = (y0 + y1) / 2; y0 = m - 2; y1 = m + 2; }
  const pd_ = (y1 - y0) * 0.12; y0 -= pd_; y1 += pd_;
  if (goal != null && goal >= y0 - (y1 - y0) * 0.6 && goal < y0) y0 = goal - (y1 - y0) * 0.05;
  const X = v => L + (v - x0) / (x1 - x0) * (W - L - R), Y = v => T + (1 - (v - y0) / (y1 - y0)) * (H - T - B);
  let g = '';
  for (const r of refs) if (r.v >= y0 && r.v <= y1) g += `<line x1="${L}" x2="${W - R}" y1="${Y(r.v)}" y2="${Y(r.v)}" class="ref"/><text x="${L + 4}" y="${Y(r.v) - 4}" class="ax ref-t">${esc(r.label)}</text>`;
  for (let i = 0; i <= 3; i++) { const v = y0 + (y1 - y0) * i / 3; g += `<line x1="${L}" x2="${W - R}" y1="${Y(v)}" y2="${Y(v)}" class="grid"/><text x="${L - 6}" y="${Y(v) + 4}" class="ax" text-anchor="end">${(y1 - y0) < 10 ? fmtN(Math.round(v * 2) / 2) : Math.round(v)}</text>`; }
  if (goal != null && goal >= y0 && goal <= y1) g += `<line x1="${L}" x2="${W - R}" y1="${Y(goal)}" y2="${Y(goal)}" class="goal"/><text x="${W - R}" y="${Y(goal) - 5}" class="ax goal-t" text-anchor="end">cel ${fmtN(goal)} ${unit}</text>`;
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${X(xs[i]).toFixed(1)},${Y(p.y).toFixed(1)}`).join('');
  const lp = pts[pts.length - 1];
  g += `<path d="${d}" class="ln"/>` + pts.map((p, i) => `<circle cx="${X(xs[i])}" cy="${Y(p.y)}" r="${i === pts.length - 1 ? 4.5 : 2.5}" class="pt"/>`).join('');
  g += `<text x="${L}" y="${H - 6}" class="ax">${fmtD(pts[0].x)}</text><text x="${W - R}" y="${H - 6}" class="ax" text-anchor="end">${fmtD(lp.x)}</text>`;
  return `<svg viewBox="0 0 ${W} ${H}" class="chart" role="img" aria-label="${esc(label)}">${g}</svg>`;
}

function vProgress() {
  const segs = [['weight', 'Waga', 'scale'], ['body', 'Obwody', 'ruler'], ['strength', 'Siła', 'dumbbell'], ['stats', 'Razem', 'trophy']];
  let h = `<header class="top"><h1>Postęp</h1></header>
    <div class="seg" role="tablist">${segs.map(([id, l, i]) => `<button role="tab" aria-selected="${ui.pt === id}" class="${ui.pt === id ? 'on' : ''}" data-a="pt" data-v="${id}">${ic(i)}<span>${l}</span></button>`).join('')}</div>`;
  h += ({ weight: pWeight, body: pBody, strength: pStrength, stats: pStats }[ui.pt] || pWeight)();
  return `<div class="page">${h}</div>`;
}

function pWeight() {
  const ws = sortedW(), st = S.settings, lw = ws[ws.length - 1];
  let tempo = '—';
  if (ws.length >= 2) {
    const ref = [...ws].reverse().find(w => diffDays(w.d, lw.d) >= 21) || ws[0];
    const days = diffDays(ref.d, lw.d);
    if (days > 0) tempo = sgn((lw.kg - ref.kg) / days * 7);
  }
  let h = `<section class="card">${cardH('scale', 'Waga')}
    <div class="stats3">
      <div><b>${lw ? fmtN(lw.kg) : '—'}</b><span>kg teraz</span></div>
      <div><b>${lw ? sgn(lw.kg - st.startWeight) : '—'}</b><span>kg od startu</span></div>
      <div><b>${tempo}</b><span>kg / tydzień</span></div>
    </div>
    ${lineChart(ws.map(w => ({ x: w.d, y: w.kg })), { goal: st.goalWeight, label: 'Wykres wagi' })}
    <p class="hint">${ic('target')}<span>Do celu (${fmtN(st.goalWeight)} kg): <b>${lw ? fmtN(Math.max(0, lw.kg - st.goalWeight)) : '—'} kg</b>. Zdrowe tempo to 0,5–1 kg na tydzień.</span></p>
    <button class="btn ghost full" data-a="tabAddW">${ic('plus')} Dodaj pomiar wagi</button>
  </section>`;

  // BMI
  if (!num(st.height)) {
    h += `<section class="card">${cardH('body', 'BMI', 'b')}<p class="muted">Wpisz wzrost w profilu, a BMI policzy się samo przy każdym ważeniu.</p>
      <button class="btn ghost full" data-a="tab" data-v="settings">${ic('user')} Uzupełnij profil</button></section>`;
  } else {
    const pts = ws.map(w => ({ x: w.d, y: bmi(w.kg) }));
    const cur = lw ? bmi(lw.kg) : null, first = pts[0];
    const goalB = bmi(st.goalWeight);
    h += `<section class="card">${cardH('body', 'BMI', 'b')}
      <div class="stats3">
        <div><b>${cur ? fmtN(cur) : '—'}</b><span>${cur ? bmiCat(cur) : 'teraz'}</span></div>
        <div><b>${cur && first ? sgn(cur - first.y) : '—'}</b><span>od pierwszego</span></div>
        <div><b>${fmtN(goalB)}</b><span>przy celu</span></div>
      </div>
      ${lineChart(pts, { goal: goalB, unit: '', label: 'Wykres BMI', refs: [{ v: 25, label: '25 · górna granica normy' }, { v: 30, label: '30' }] })}
      <p class="hint">${ic('info')}<span>BMI liczy się z wagi i wzrostu (${fmtN(st.height)} cm). Nie widzi mięśni, dlatego warto patrzeć na nie razem z obwodami.</span></p>
    </section>`;
  }

  if (ws.length) h += `<section class="card">${cardH('calendar', `Wszystkie pomiary (${ws.length})`)}<ul class="wl">${[...ws].reverse().map(w => `<li><span>${fmtD(w.d)}</span><b>${fmtN(w.kg)} kg</b>${bmi(w.kg) ? `<small>BMI ${fmtN(bmi(w.kg))}</small>` : ''}<button class="icon-btn" data-a="delW" data-v="${w.d}" aria-label="Usuń pomiar z ${fmtD(w.d)}">${ic('trash')}</button></li>`).join('')}</ul></section>`;
  return h;
}

function bodyForm() {
  const last = sortedBody().pop() || {};
  return `<section class="card form-card">${cardH('ruler', 'Nowy pomiar obwodów', 'b')}
    <p class="hint">${ic('info')}<span>Rano, przed jedzeniem. Zawsze ta sama strona ciała (np. prawa). Centymetr przylega, ale nie uciska.</span></p>
    ${BODY.map(([k, n, how]) => `<label class="bfld"><span class="bl"><b>${n}</b><small>${how}</small></span>
      <span class="bin"><input id="b_${k}" type="text" inputmode="decimal" placeholder="${last[k] ? fmtN(last[k]) : '—'}" aria-label="${n} w cm"><em>cm</em></span></label>`).join('')}
    <p class="muted small">Puste pola możesz pominąć.</p>
    <div class="row2"><button class="btn ghost" data-a="cancelBody">Anuluj</button><button class="btn" data-a="saveBody">${ic('check')} Zapisz</button></div>
  </section>`;
}

function pBody() {
  const bs = sortedBody();
  let h = '';
  if (ui.addBody) h += bodyForm();
  if (!bs.length) {
    if (!ui.addBody) h += `<section class="card">${cardH('ruler', 'Obwody', 'b')}<div class="empty">${ic('ruler')}<p>Obwody często pokazują postęp wtedy, gdy waga stoi w miejscu. Mierz co 2 tygodnie.</p></div>
      <button class="btn full" data-a="addBody">${ic('plus')} Pierwszy pomiar</button></section>`;
    return h;
  }
  const first = bs[0], last = bs[bs.length - 1];
  let total = 0;
  const rows = BODY.map(([k, n]) => {
    const f = bs.find(b => b[k] != null), l = [...bs].reverse().find(b => b[k] != null);
    if (!f) return `<li class="${ui.bodyKey === k ? 'on' : ''}"><button data-a="bodyKey" data-v="${k}"><span>${n}</span><b>—</b><small></small></button></li>`;
    const d = l[k] - f[k]; if (f !== l) total += d;
    return `<li class="${ui.bodyKey === k ? 'on' : ''}"><button data-a="bodyKey" data-v="${k}"><span>${n}</span><b>${fmtN(l[k])} cm</b><small class="${d < 0 ? 'down' : d > 0 ? 'up' : ''}">${f === l ? 'start' : sgn(d)}</small></button></li>`;
  }).join('');
  const k = ui.bodyKey, pts = bs.filter(b => b[k] != null).map(b => ({ x: b.d, y: b[k] }));
  const h_ = num(S.settings.height), whr = h_ && last.waist ? last.waist / h_ : null;
  h += `<section class="card">${cardH('ruler', 'Obwody', 'b', `<small class="ch-r">${fmtD(last.d)}</small>`)}
    ${bs.length > 1 ? `<div class="big-stat"><b>${sgn(total)} cm</b><span>razem od ${fmtD(first.d)}</span></div>` : ''}
    <ul class="blist">${rows}</ul>
    <p class="muted small">Stuknij obwód, żeby zobaczyć jego wykres.</p>
    <div class="ch sub">${ic('chart')}<b>${bodyName(k)}</b></div>
    ${lineChart(pts, { unit: 'cm', label: 'Wykres: ' + bodyName(k) })}
    ${whr ? `<p class="hint">${ic('info')}<span>Talia / wzrost: <b>${fmtN(Math.round(whr * 100) / 100)}</b>. Wartość poniżej 0,5 uznaje się za korzystną dla zdrowia.</span></p>` : ''}
    ${ui.addBody ? '' : `<button class="btn full" data-a="addBody">${ic('plus')} Nowy pomiar</button>`}
  </section>
  <section class="card">${cardH('calendar', `Historia (${bs.length})`)}<ul class="wl">${[...bs].reverse().map(b => `<li><span>${fmtD(b.d)}</span><b class="small">${BODY.filter(([k]) => b[k] != null).map(([k, n]) => `${n.slice(0, 3).toLowerCase()} ${fmtN(b[k])}`).join(' · ')}</b><button class="icon-btn" data-a="delBody" data-v="${b.d}" aria-label="Usuń pomiar z ${fmtD(b.d)}">${ic('trash')}</button></li>`).join('')}</ul></section>`;
  return h;
}

function pStrength() {
  const exIds = [...new Set(realLogs().flatMap(l => Object.keys(l.sets || {})))].filter(id => EX[id] && EX[id].t === 'kg');
  if (!exIds.length) return `<section class="card">${cardH('dumbbell', 'Siła')}<div class="empty">${ic('dumbbell')}<p>Wykresy siły pojawią się po pierwszym treningu z ciężarami.</p></div></section>`;
  const sel = exIds.includes(S.progEx) ? S.progEx : exIds[0];
  const ex = EX[sel];
  const pts = realLogs().filter(l => l.sets && l.sets[sel]).map(l => {
    const ws_ = l.sets[sel].map(s => s.w ?? 0);
    return { x: l.date, y: ex.p === 'assist' ? Math.min(...ws_) : Math.max(...ws_), sets: l.sets[sel] };
  });
  const first = pts[0], lst = pts[pts.length - 1];
  const diff = lst.y - first.y, gain = ex.p === 'assist' ? -diff : diff;
  return `<section class="card">${cardH('dumbbell', 'Siła')}
    <select id="progEx" aria-label="Ćwiczenie">${exIds.map(id => `<option value="${id}" ${id === sel ? 'selected' : ''}>${esc(EX[id].n)}</option>`).join('')}</select>
    ${pts.length > 1 ? `<div class="big-stat"><b>${gain >= 0 ? '+' : '−'}${fmtN(Math.abs(diff))} kg</b><span>${ex.p === 'assist' ? 'mniej odciążenia' : 'więcej'} niż ${fmtD(first.x)}</span></div>` : ''}
    ${lineChart(pts, { label: 'Wykres siły: ' + ex.n })}
    <p class="hint">${ic('info')}<span>${ex.p === 'assist' ? 'Kg odciążenia: im mniej, tym silniejsza jesteś.' : 'Najcięższa seria na każdym treningu.'} Ostatnio: ${esc(summ(lst.sets, ex))}.</span></p>
  </section>`;
}

function pStats() {
  const all = realLogs();
  const weeks = new Set(all.map(l => weekStart(l.date)));
  const goodWeeks = [...weeks].filter(w => all.filter(l => weekStart(l.date) === w).length >= 3).length;
  const mins = all.reduce((a, l) => a + (l.dur || 0), 0);
  return `<section class="card">${cardH('trophy', 'Razem', 'b')}<div class="stats3">
    <div>${ic('dumbbell')}<b>${all.length}</b><span>treningów</span></div>
    <div>${ic('flame')}<b>${goodWeeks}</b><span>tyg. z 3+</span></div>
    <div>${ic('clock')}<b>${Math.round(mins / 60)}</b><span>godzin</span></div></div>
    <div class="stats3">
    <div>${ic('foot')}<b>${Object.keys(S.foot).length}</b><span>dni ze stopą</span></div>
    <div>${ic('ball')}<b>${S.volley.length}</b><span>siatkówka</span></div>
    <div>${ic('ruler')}<b>${S.body.length}</b><span>pomiarów obw.</span></div></div>
  </section>
  ${all.length ? `<section class="card">${cardH('calendar', 'Historia treningów')}<ul class="wl">${[...all].reverse().slice(0, 40).map(l => `<li><span>${fmtD(l.date)}</span><b>${esc(SES[l.sid] ? SES[l.sid].name : l.sid)}</b><small>${l.dur || 0} min</small></li>`).join('')}</ul></section>` : ''}`;
}

// ---------- plan ----------
function vPlan() {
  const t = today(), cur = phaseFor(t);
  let h = `<header class="top"><h1>Plan</h1><p class="muted">Kolejność treningów w tygodniu jest dowolna — aplikacja zawsze podpowiada następny niezrobiony. Opuszczony dzień nic nie psuje.</p></header>`;
  h += P.phases.map(ph => {
    const isCur = ph.id === cur.id, past = ph.end < t;
    const end = ph.end > '2090' ? '…' : fmtD(ph.end);
    return `<details class="card phase ${isCur ? 'cur' : ''} ${past ? 'past' : ''}" ${isCur ? 'open' : ''}>
      <summary>${badge(ph.type === 'break' ? 'snow' : ph.id === 'p3' || ph.id === 'p4' ? 'helmet' : ph.id === 'p2' ? 'snow' : 'flame', isCur ? 'g' : 'n')}<div><b>${esc(ph.name)}</b><small>${fmtD(ph.start)} – ${end}${isCur ? ' · teraz' : ''}</small></div></summary>
      <p class="muted">${esc(ph.goal)}</p>
      ${ph.sessions.map(sid => {
        const s = SES[sid], bl = blocksOf(sid, ph);
        return `<div class="sess"><div class="sess-h"><b>${esc(s.name)}</b><small>${ic('clock')} ${s.min} min</small></div>
          <ul class="exl">${bl.map(b => `<li><button class="plain" data-a="info" data-v="${b.ex}">${ic(exIcon(b.ex))}<span>${esc(EX[b.ex].n)}</span></button><small>${esc(scheme(b))}</small></li>`).join('')}</ul>
          ${S.current ? '' : `<button class="btn small ghost" data-a="start" data-v="${sid}" data-p="${ph.id}">${ic('play')} Zrób teraz</button>`}</div>`;
      }).join('')}
    </details>`;
  }).join('');
  h += `<section class="card safe-card">${cardH('shield', 'Zasady bezpieczeństwa', 'b')}<ul>
    <li>Ostry ból w stawie (bark, kolano, kostka) = przerwij ćwiczenie. Zmęczenie mięśni jest OK.</li>
    <li>Bark: nic za głową, bez bujania na drążku, kontrolowany ruch.</li>
    <li>Gorszy dzień? Zrób trening z jedną serią mniej. Lepiej tak niż wcale.</li>
    <li>Kilka dni przerwy (choroba, wyjazd) — wróć z ciężarami o 10–20% lżejszymi.</li></ul></section>`;
  return `<div class="page">${h}</div>`;
}

// ---------- ustawienia ----------
function vSettings() {
  const st = S.settings, lw = sortedW().pop();
  const b = lw ? bmi(lw.kg) : null;
  const f = (id, label, val, unit, icon) => `<label class="fld">${ic(icon)}<span>${label}</span><span class="bin"><input id="${id}" type="text" inputmode="decimal" value="${val == null || val === '' ? '' : fmtN(val)}" placeholder="—"><em>${unit}</em></span></label>`;
  return `<div class="page"><header class="top"><h1>Profil</h1></header>
  <section class="card">${cardH('user', 'O Tobie')}
    ${f('sHeight', 'Wzrost', st.height, 'cm', 'ruler')}
    ${f('sAge', 'Wiek', st.age, 'lat', 'calendar')}
    ${f('sStart', 'Waga startowa', st.startWeight, 'kg', 'scale')}
    ${f('sGoal', 'Waga docelowa', st.goalWeight, 'kg', 'target')}
    <button class="btn full" data-a="saveSet">${ic('check')} Zapisz</button>
    ${b ? `<p class="hint">${ic('body')}<span>Aktualne BMI: <b>${fmtN(b)}</b> (${bmiCat(b)}). Przy wadze docelowej: <b>${fmtN(bmi(st.goalWeight))}</b>.</span></p>` : ''}
  </section>
  <section class="card">${cardH('download', 'Kopia zapasowa', 'b')}
    <p class="muted">Dane są tylko w tym telefonie. Zapisuj kopię co 1–2 tygodnie, np. do Plików lub na iCloud Drive.</p>
    <p class="small">Ostatnia kopia: <b>${S.lastExport ? fmtD(S.lastExport) : 'brak'}</b></p>
    <button class="btn full" data-a="export">${ic('download')} Zapisz kopię</button>
    <button class="btn ghost full" data-a="import">${ic('upload')} Wczytaj kopię</button>
    <input id="importFile" type="file" accept="application/json,.json" hidden>
  </section>
  <section class="card">${cardH('list', 'Dane')}
    <p class="muted small">${realLogs().length} treningów · ${S.weights.length} ważeń · ${S.body.length} pomiarów obwodów · ${Object.keys(S.foot).length} dni ze stopą</p>
    <p class="muted small">Daty nart i szkolenia oraz cały plan zmieniasz w pliku <code>plan.js</code>.</p>
    <button class="btn ghost full danger" data-a="reset">${ic('trash')} Usuń wszystkie dane</button>
  </section></div>`;
}

function vInfo(id) {
  const ex = EX[id]; if (!ex) return '';
  return `<div class="modal" data-a="closeInfo"><div class="sheet" role="dialog" aria-modal="true" aria-label="${esc(ex.n)}" data-stop="1">
    <div class="ex-h">${badge(exIcon(id), ex.t === 'check' ? 'b' : 'g')}<div><div class="chip">${esc(ex.m)}</div><h2>${esc(ex.n)}</h2></div></div>
    <ul>${ex.how.map(x => `<li>${esc(x)}</li>`).join('')}</ul>${ex.safe ? `<p class="safe">${ic('shield')}<span>${esc(ex.safe)}</span></p>` : ''}
    <button class="btn full" data-a="closeInfo">Zamknij</button></div></div>`;
}

// ================= AKCJE =================
function toast(msg) {
  const el = document.getElementById('toast'); if (!el) return;
  el.textContent = msg; el.classList.add('show');
  clearTimeout(toast._t); toast._t = setTimeout(() => el.classList.remove('show'), 2600);
}
function setVal(k, val) {
  const [bi, si, f] = k.split(',');
  const s = S.current.data[+bi][+si];
  s[f] = val;
}

const act = {
  tab(v) { S.tab = v; ui.pick = false; ui.addW = false; ui.addBody = false; ui.info = null; save(); render(); scrollTo(0, 0); },
  start(v, el) {
    const pid = el.dataset.p || phaseFor(today()).id;
    if (S.current && !confirm('Masz rozpoczęty trening. Zacząć nowy? Tamten nie zostanie zapisany.')) return;
    startWorkout(v, pid);
  },
  resume() { ui.out = false; wake(); render(); scrollTo(0, 0); },
  exit() { ui.out = true; S.tab = 'today'; save(); render(); },
  abandon() {
    if (!confirm('Porzucić trening? Odhaczone serie nie zostaną zapisane.')) return;
    S.current = null; ui.out = false; releaseWake(); save(); render();
  },
  prev() { S.current.i--; save(); render(); scrollTo(0, 0); },
  next() { S.current.i++; save(); render(); scrollTo(0, 0); },
  inc(_, el) {
    const k = el.dataset.k, d = +el.dataset.d;
    const [bi, si, f] = k.split(',');
    const s = S.current.data[+bi][+si];
    const cur = num(s[f]) ?? 0;
    s[f] = Math.max(0, Math.round((cur + d) * 10) / 10);
    save();
    const inp = app.querySelector(`[data-in="${k}"]`);
    if (inp) inp.value = String(s[f]).replace('.', ',');
  },
  tick(_, el) {
    const [bi, si] = el.dataset.k.split(',').map(Number);
    const c = S.current, s = c.data[bi][si];
    const b = blocksOf(c.sid, phaseById(c.pid))[bi];
    s.done = !s.done;
    if (s.done) {
      if (num(s.r) == null) s.r = typeOf(b) === 'time' ? b.sec : b.r[0];
      const allDone = c.data[bi].every(x => x.done);
      c.rest = { end: Date.now() + restOf(b) * 1000, beeped: false };
      unlockAudio();
      if (allDone) toast('Ćwiczenie zrobione — stuknij „Dalej”');
    }
    save(); render();
  },
  addSet(v) {
    const arr = S.current.data[+v]; const lastS = arr[arr.length - 1];
    arr.push({ w: lastS.w, r: lastS.r, done: false }); save(); render();
  },
  skipRest() { S.current.rest = null; save(); render(); },
  chk(v) { const d = S.current.data[+v]; d.done = !d.done; save(); render(); },
  chkAll(v) {
    const ids = v.split(',').map(Number), all = ids.every(i => S.current.data[i].done);
    ids.forEach(i => S.current.data[i].done = !all); save(); render();
  },
  ct(v) {
    const c = S.current, bi = +v;
    if (c.ct && c.ct.bi === bi) c.ct = null;
    else { const b = blocksOf(c.sid, phaseById(c.pid))[bi]; c.ct = { bi, end: Date.now() + b.min * 60000, beeped: false }; unlockAudio(); wake(); }
    save(); render();
  },
  finish() { finishWorkout(); },
  info(v) { ui.info = v; render(); },
  closeInfo(_, el, e) { if (e.target.closest('[data-stop]') && !e.target.closest('.btn')) return; ui.info = null; render(); },
  pick() { ui.pick = !ui.pick; render(); },
  volley() {
    const t = today(), i = S.volley.indexOf(t);
    if (i >= 0) S.volley.splice(i, 1); else { S.volley.push(t); toast('Zapisane. Siatkówka się liczy!'); }
    save(); render();
  },
  addW() { ui.addW = true; render(); setTimeout(() => document.getElementById('wIn')?.focus(), 50); },
  tabAddW() { S.tab = 'today'; ui.addW = true; render(); scrollTo(0, 0); setTimeout(() => document.getElementById('wIn')?.focus(), 50); },
  saveW() {
    const v = num(document.getElementById('wIn')?.value);
    if (v == null || v < 30 || v > 250) { toast('Wpisz wagę w kg, np. 84,6'); return; }
    const t = today();
    S.weights = S.weights.filter(w => w.d !== t); S.weights.push({ d: t, kg: v });
    ui.addW = false; save(); render(); toast('Zapisane ✓');
  },
  delW(v) { if (!confirm('Usunąć ten pomiar?')) return; S.weights = S.weights.filter(w => w.d !== v); save(); render(); },
  unflash() { S.flash = null; save(); render(); },
  saveSet() {
    const g = id => num(document.getElementById(id).value);
    const a = g('sStart'), b = g('sGoal'), hgt = g('sHeight'), age = g('sAge');
    if (a == null || b == null) { toast('Uzupełnij wagę startową i docelową'); return; }
    if (hgt != null && (hgt < 120 || hgt > 220)) { toast('Wzrost wpisz w cm, np. 168'); return; }
    if (age != null && (age < 10 || age > 100)) { toast('Sprawdź wiek'); return; }
    Object.assign(S.settings, { startWeight: a, goalWeight: b, height: hgt, age: age == null ? null : Math.round(age) });
    save(); render(); toast('Zapisane ✓');
  },
  pt(v) { ui.pt = v; render(); },
  goBody() { S.tab = 'progress'; ui.pt = 'body'; ui.addBody = true; save(); render(); scrollTo(0, 0); },
  addBody() { ui.addBody = true; render(); scrollTo(0, 0); },
  cancelBody() { ui.addBody = false; render(); },
  bodyKey(v) { ui.bodyKey = v; render(); },
  saveBody() {
    const e = { d: today() }; let n = 0, bad = false;
    for (const [k] of BODY) {
      const v = num(document.getElementById('b_' + k)?.value);
      if (v == null) continue;
      if (v < 15 || v > 200) bad = true;
      e[k] = v; n++;
    }
    if (bad) { toast('Któryś wymiar wygląda dziwnie — wpisz w cm'); return; }
    if (!n) { toast('Wpisz co najmniej jeden obwód'); return; }
    const prev = S.body.find(b => b.d === e.d);
    S.body = S.body.filter(b => b.d !== e.d); S.body.push(Object.assign({}, prev, e));
    if (e[ui.bodyKey] == null) ui.bodyKey = Object.keys(e).find(k => k !== 'd');
    ui.addBody = false; save(); render(); scrollTo(0, 0); toast('Obwody zapisane ✓');
  },
  delBody(v) { if (!confirm('Usunąć ten pomiar obwodów?')) return; S.body = S.body.filter(b => b.d !== v); save(); render(); },
  async export() {
    const name = `forma-kopia-${today()}.json`;
    const json = JSON.stringify(S);
    const done = () => { S.lastExport = today(); save(); render(); toast('Kopia zapisana ✓'); };
    try {
      const file = new File([json], name, { type: 'application/json' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: name }); done(); return; }
    } catch (e) { if (e && e.name === 'AbortError') return; }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([json], { type: 'application/json' })); a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    done();
  },
  import() { document.getElementById('importFile')?.click(); },
  reset() {
    if (!confirm('Na pewno usunąć wszystkie dane? Tego nie da się cofnąć (chyba że masz kopię).')) return;
    S = fresh(); save(); render(); toast('Dane usunięte');
  }
};

app.addEventListener('click', e => {
  const el = e.target.closest('[data-a]'); if (!el) return;
  const fn = act[el.dataset.a]; if (!fn) return;
  if (el.dataset.a !== 'closeInfo') e.stopPropagation();
  fn(el.dataset.v, el, e);
});
app.addEventListener('change', e => {
  const el = e.target;
  if (el.dataset.in && S.current) {
    const v = num(el.value);
    setVal(el.dataset.in, v == null ? '' : v); save();
  } else if (el.id === 'progEx') { S.progEx = el.value; save(); render(); }
  else if (el.id === 'importFile' && el.files[0]) {
    const r = new FileReader();
    r.onload = () => {
      try {
        const d = JSON.parse(r.result);
        if (!d || !Array.isArray(d.logs) || !Array.isArray(d.weights)) throw new Error('format');
        if (!Array.isArray(d.body)) d.body = [];
        if (!confirm(`Wczytać kopię? (${d.logs.length} wpisów treningów, ${d.weights.length} pomiarów). Obecne dane zostaną zastąpione.`)) return;
        S = Object.assign(fresh(), d); S.settings = Object.assign(fresh().settings, d.settings); S.current = null; save(); render(); toast('Kopia wczytana ✓');
      } catch (err) { toast('To nie jest plik kopii z tej aplikacji'); }
    };
    r.readAsText(el.files[0]);
  }
});
app.addEventListener('keydown', e => {
  if (e.key === 'Enter' && e.target.id === 'wIn') act.saveW();
  if (e.key === 'Enter' && e.target.id && e.target.id.startsWith('b_')) {
    const ins = [...app.querySelectorAll('[id^="b_"]')], i = ins.indexOf(e.target);
    if (ins[i + 1]) ins[i + 1].focus(); else act.saveBody();
  }
  if (e.key === 'Escape' && ui.info) { ui.info = null; render(); }
});

// ================= TIMERY =================
setInterval(() => {
  const c = S && S.current; if (!c || ui.out) return;
  const now = Date.now();
  if (c.rest) {
    const left = Math.ceil((c.rest.end - now) / 1000), el = document.getElementById('restT');
    if (left <= 0) {
      if (!c.rest.beeped) { c.rest.beeped = true; beep(); save(); }
      if (el && !el.dataset.done) { el.dataset.done = 1; el.textContent = 'Czas! Następna seria'; document.getElementById('restBar')?.classList.add('done'); }
    } else if (el) el.textContent = mmss(left);
  }
  if (c.ct) {
    const left = Math.ceil((c.ct.end - now) / 1000), el = document.getElementById('ctT');
    if (left <= 0) {
      if (!c.ct.beeped) {
        c.ct.beeped = true; beep();
        const d = c.data[c.ct.bi]; if (d && !Array.isArray(d)) d.done = true;
        c.ct = null; save(); render(); toast('Czas minął — zrobione ✓');
      }
    } else if (el) el.textContent = mmss(left);
  }
}, 500);

// ================= START =================
load();
try { navigator.storage && navigator.storage.persist && navigator.storage.persist(); } catch (e) {}
render();
})();
