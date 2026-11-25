(() => {
'use strict';

const KEY = 'forma.v1';
const P = window.PLAN, EX = window.EX, SES = window.SESSIONS;
const app = document.getElementById('app');
const NO_LOG = ['FOOT', 'SKI']; // te zestawy tylko odhaczają „stopę na dziś”

// ================= DANE =================
const fresh = () => ({
  v: 1,
  settings: { startWeight: 85, goalWeight: 64, height: null, age: null, deficit: 500, startDate: '2026-11-24', dgKg: 5, dgDate: '2026-12-31' },
  weights: [], body: [], logs: [], foot: {}, volley: [], acts: [], food: {}, activity: {},
  reached: [], bestStreak: 0, weekSeen: null,
  slips: { fast: [], sweet: [], salty: [] }, treats: [],
  current: null, lastExport: null, tab: 'today', progEx: null, flash: null
});
let S;
const ui = { addAct: false, actF: null, pick: false, addW: false, info: null, out: false, pt: 'weight', addBody: false, bodyKey: 'waist', fd: null };

function load() {
  let raw = null;
  try { raw = localStorage.getItem(KEY); } catch (e) {}
  try { S = Object.assign(fresh(), raw ? JSON.parse(raw) : {}); } catch (e) { S = fresh(); }
  S.settings = Object.assign(fresh().settings, S.settings);
  if (!S.food || typeof S.food !== 'object' || Array.isArray(S.food)) S.food = {};
  if (!S.activity || typeof S.activity !== 'object' || Array.isArray(S.activity)) S.activity = {};
  S.slips = Object.assign({ fast: [], sweet: [], salty: [] }, S.slips || {});
  if (!Array.isArray(S.treats)) S.treats = [];
  migrateActs(S);
}
function migrateActs(o) {
  if (!Array.isArray(o.acts)) o.acts = [];
  if (Array.isArray(o.volley) && o.volley.length) {
    o.volley.forEach((d, i) => { if (!o.acts.some(a => a.d === d && a.type === 'volley')) o.acts.push({ id: Date.now() + i, d, type: 'volley', min: null, kcal: null }); });
    o.volley = [];
  }
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
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  utensils: '<path d="M5 3v7a3 3 0 0 0 6 0V3M8 3v18M18 3c-2.2 0-3.5 2.4-3.5 5.5S15.8 14 18 14v7"/>',
  activity: '<path d="M3 12h4l3-8 4 16 3-8h4"/>',
  burger: '<path d="M4 11a8 6 0 0 1 16 0z"/><path d="M3 15h18M5 15v1a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3v-1"/>',
  cookie: '<circle cx="12" cy="12" r="9"/><path d="M9 9h.01M14.5 8h.01M15.5 13.5h.01M10 14.5h.01M12.5 11.5h.01"/>',
  chips: '<path d="M7 3h10l-1.5 3L17 21H7l1.5-15z"/><path d="M8.5 6h7M10 11l1 1M13 14l1 1"/>',
  run: '<circle cx="14.5" cy="4" r="1.8"/><path d="m6 20 3.5-5 3 2.5V22M8.5 9.5 12 7l3 3 3 1M12 7l-1.5 6 3.5 3M4 13l3-2"/>',
  mountain: '<path d="M3 20 9.5 8l4 7 2.5-4L21 20z"/>',
  skate: '<path d="M6 3h5v8l7 2.2a2.2 2.2 0 0 1 1.5 2V17H6z"/><path d="M4 20.5h15.5a1.5 1.5 0 0 0 1.5-1.5M8.5 17v3.5M16.5 17v3.5"/>',
  roller: '<path d="M6 3h5v8l7 2.2a2.2 2.2 0 0 1 1.5 2V17H6z"/><circle cx="8" cy="19.5" r="1.6"/><circle cx="12.8" cy="19.5" r="1.6"/><circle cx="17.6" cy="19.5" r="1.6"/>',
  racket: '<ellipse cx="9.5" cy="9.5" rx="6" ry="6"/><path d="m13.8 13.8 6.7 6.7M6 9.5h7M9.5 6v7"/>',
  swim: '<circle cx="16" cy="6" r="2"/><path d="m4 13 5-5 3.5 2.5L15 9M2 18c2 0 2-1.5 4-1.5S8 18 10 18s2-1.5 4-1.5 2 1.5 4 1.5 2-1.5 4-1.5"/>',
  gift: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M5 12v9h14v-9M12 8v13M12 8S10.5 3 8 4s-1 4 4 4c5 0 6.5-3 4-4s-4 4-4 4"/>'
};
const LANDSCAPE = `<div class="scene" aria-hidden="true"><svg viewBox="0 0 400 150" preserveAspectRatio="xMidYMax slice">
  <defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e3f1ec"/><stop offset="1" stop-color="#f4f8f6"/></linearGradient></defs>
  <rect width="400" height="150" fill="url(#sky)"/>
  <circle cx="250" cy="58" r="22" fill="#f6b26b"/>
  <path d="M0 110 60 62l40 30 50-46 60 52 40-28 70 44 80-40v116H0z" fill="#a9d3c4"/>
  <path d="M0 124 70 88l50 26 60-38 70 44 50-24 100 30v24H0z" fill="#6fae9a"/>
  <path d="M0 150v-16l90-22 80 18 90-26 140 30v16z" fill="#3f8a75"/>
  ${[[38, 112, 1], [62, 118, .8], [300, 104, 1.1], [328, 112, .85], [352, 118, .7]].map(([x, y, k]) => `<path transform="translate(${x} ${y}) scale(${k})" d="M0-34 10-16h-5l9 14h-6l10 14H-18L-8-2h-6l9-14h-5z M-2 12h4v8h-4z" fill="#1f5246"/>`).join('')}
</svg></div>`;
const HERO_ART = `<svg class="hero-art" viewBox="0 0 160 90" aria-hidden="true"><path d="M0 90 55 22l22 26 23-30 60 72z" fill="rgba(255,255,255,.14)"/><path d="m55 22 9 11-6-1-5 6-4-5z" fill="rgba(255,255,255,.55)"/><path d="m100 18 9 11-5 0-6 6-5-6z" fill="rgba(255,255,255,.45)"/>${[[120, 82], [134, 86], [146, 80]].map(([x, y]) => `<path transform="translate(${x} ${y})" d="M0-26 8-12h-4l7 11h-5l8 11H-14L-6-1h-5l7-11h-4z" fill="rgba(10,40,34,.55)"/>`).join('')}</svg>`;
const ring = (pct, inner) => { const r = 52, c = 2 * Math.PI * r, v = Math.max(0, Math.min(1, pct)); return `<div class="ring"><svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="${r}" class="ring-bg"/><circle cx="60" cy="60" r="${r}" class="ring-fg" stroke-dasharray="${(c * v).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 60 60)"/></svg><div class="ring-in">${inner}</div></div>`; };
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

// ================= ENERGIA =================
const MIN_KCAL = 1200;
function weightOn(d) { const w = sortedW().filter(x => x.d <= d).pop(); return w ? w.kg : num(S.settings.startWeight); }
function energy(d) {
  const st = S.settings, h = num(st.height), a = num(st.age), w = weightOn(d);
  const meals = S.food[d] || [], eaten = meals.reduce((x, m) => x + (+m.kcal || 0), 0);
  const act = S.activity[d] || {}, steps = num(act.steps);
  const actKcal = actsOn(d).filter(a => !a.inWatch).reduce((x, a) => x + (num(a.kcal) || 0), 0);
  const watch = num(act.kcal), active = watch == null && !actKcal ? null : (watch || 0) + actKcal;
  if (!h || !a || !w) return { ok: false, eaten, active, steps, meals };
  const bmr = 10 * w + 6.25 * h - 5 * a - 161;             // Mifflin-St Jeor, kobieta
  const tdee = Math.round(Math.max(bmr * 1.2, bmr + (active || 0)));
  const budget = Math.max(MIN_KCAL, tdee - (num(st.deficit) || 0));
  return { ok: true, bmr: Math.round(bmr), tdee, budget, eaten, left: budget - eaten, deficit: tdee - eaten, active, watch, actKcal, steps, meals, floor: tdee - st.deficit < MIN_KCAL };
}
function recentMeals() {
  const seen = new Set(), out = [];
  for (const d of Object.keys(S.food).sort().reverse()) for (const m of [...S.food[d]].reverse()) {
    const k = m.n.trim().toLowerCase(); if (seen.has(k)) continue; seen.add(k); out.push(m); if (out.length >= 8) return out;
  }
  return out;
}
// ================= MOTYWACJA =================
const STEP_GOAL = 7000, WEEK_DAYS_GOAL = 5;
function dayOk(d) { const e = energy(d); return e.ok && e.meals.length > 0 && e.eaten <= e.budget; }
function streak() {
  const t = today(); if (!energy(t).ok) return { n: 0, joker: false };
  const days = Object.keys(S.food).sort(); if (!days.length) return { n: 0, joker: false };
  const first = days[0];
  let d = dayOk(t) ? t : addDays(t, -1), n = 0;
  const jokers = new Set();
  while (d >= first) {
    if (dayOk(d)) n++;
    else if (d !== t) {
      const w = weekStart(d);
      if (jokers.has(w)) break;
      jokers.add(w);
    }
    d = addDays(d, -1);
  }
  return { n, joker: jokers.has(weekStart(t)) };
}
function weekChallenge(ws) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(ws, i));
  const ok = days.filter(dayOk).length;
  const st = days.map(d => num((S.activity[d] || {}).steps)).filter(v => v != null);
  const avg = st.length ? Math.round(st.reduce((a, v) => a + v, 0) / st.length) : null;
  return { days, ok, avg, okDone: ok >= WEEK_DAYS_GOAL, stepsDone: avg != null && avg >= STEP_GOAL };
}
function milestones() {
  const st = S.settings, start = num(st.startWeight), goal = num(st.goalWeight);
  if (!start || !goal || goal >= start) return [];
  const total = Math.round((start - goal) * 10) / 10;
  const set = [3, 5, 8, 10, 15].filter(v => v < total);
  const out = set.map(v => ({ v, label: `−${v} kg` }));
  out.push({ v: total, label: 'Cel!' });
  const ski = out.find(m => m.v === 5); if (ski) ski.label = '−5 kg · na narty';
  const cav = out.find(m => m.v === 10); if (cav) cav.label = '−10 kg · do jaskiń';
  return out;
}
function checkMilestones() {
  const lw = sortedW().pop(); if (!lw) return null;
  const lost = num(S.settings.startWeight) - lw.kg; let hit = null;
  for (const m of milestones()) if (lost >= m.v - 0.05 && !S.reached.includes(m.v)) { S.reached.push(m.v); hit = m; }
  return hit;
}

// ================= NAWYKI I NAGRODY =================
const HABITS = [['fast', 'fast foodów', 'burger'], ['sweet', 'słodkiego', 'cookie'], ['salty', 'słonych przekąsek', 'chips']];
function habitStat(k) {
  const t = today(), start = S.settings.startDate || t;
  const slips = [...new Set(S.slips[k] || [])].filter(d => d >= start && d <= t).sort();
  let ref = addDays(start, -1), best = 0;
  for (const sd of slips) { best = Math.max(best, diffDays(ref, sd) - 1); ref = sd; }
  const cur = t < start ? 0 : diffDays(ref, t);
  return { cur, best: Math.max(best, cur), slipToday: slips[slips.length - 1] === t };
}
function treatDates() {
  const start = S.settings.startDate || today(), offs = [7, 14, 21, 28, 42, 56, 77];
  for (let o = 98; o <= 730; o += 21) offs.push(o);
  return offs.map(o => ({ d: addDays(start, o), o }));
}
function treatState() {
  const t = today(), start = S.settings.startDate || t, all = treatDates();
  const due = all.filter(x => x.d <= t).pop(), next = all.find(x => x.d > t);
  const prev = due ? due.d : start;
  const day = diffDays(start, t) + 1;
  const rule = day <= 30 ? 'co 7 dni' : day <= 60 ? 'co 2 tygodnie' : 'co 3 tygodnie';
  return { due, next, prev, rule, available: !!due && !S.treats.includes(due.d), started: t >= start };
}
// cel z datą
function datedGoal() {
  const st = S.settings, kg = num(st.dgKg), end = st.dgDate, start = st.startDate, w0 = num(st.startWeight);
  if (!kg || !end || !start || !w0 || end <= start) return null;
  const target = w0 - kg, span = diffDays(start, end);
  const planAt = d => { const k = Math.min(1, Math.max(0, diffDays(start, d) / span)); return w0 - kg * k; };
  const lw = sortedW().filter(w => w.d >= start).pop();
  const t = today(), left = Math.max(0, diffDays(t, end));
  if (!lw) return { kg, end, start, target, planAt, lw: null, left };
  const diff = lw.kg - planAt(lw.d);
  const status = diff <= -0.5 ? ['przed planem', 'g', 'sparkle'] : diff <= 0.3 ? ['na dobrej drodze', 'g', 'check'] : diff <= 1.5 ? ['lekko z tyłu', 'b', 'flame'] : ['z tyłu', 'b', 'flame'];
  const need = left > 0 ? (lw.kg - target) / (left / 7) : null;
  return { kg, end, start, target, planAt, lw, diff, status, left, need };
}

// ================= AKTYWNOŚCI =================
const ACT_TYPES = [['skate', 'Łyżwy', 'skate'], ['roller', 'Rolki', 'roller'], ['volley', 'Siatkówka', 'ball'], ['tennis', 'Tenis', 'racket'], ['squash', 'Squash', 'racket'],
  ['swim', 'Basen', 'swim'], ['walk', 'Spacer', 'run'], ['mountain', 'Góry / jaskinia', 'mountain'], ['other', 'Inne', 'activity']];
const actType = k => ACT_TYPES.find(a => a[0] === k) || ACT_TYPES[ACT_TYPES.length - 1];
const actName = a => a.type === 'other' && a.name ? a.name : actType(a.type)[1];
const CARDIO_MIN = 40;
const actsOn = d => S.acts.filter(a => a.d === d);
function weekActs(t = today()) { const ws = weekStart(t), we = addDays(ws, 6); return S.acts.filter(a => a.d >= ws && a.d <= we).sort((a, b) => a.d < b.d ? -1 : 1); }
// które treningi tygodnia są „zrobione” — z logów i z aktywności 40+ min (zaliczają kondycję)
function weekDone(phase, t = today()) {
  const done = new Set(weekLogs(t).map(l => l.sid));
  let credits = weekActs(t).filter(a => (num(a.min) || 0) >= CARDIO_MIN).length;
  const credited = [];
  for (const id of phase.sessions) if (credits > 0 && /^K/.test(id) && !done.has(id)) { done.add(id); credited.push(id); credits--; }
  return { done, credited };
}

const dayLabel = d => d === today() ? 'Dziś' : d === addDays(today(), -1) ? 'Wczoraj' : fmtLong(d);

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
  const { done } = weekDone(phase);
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
  else h = ({ today: vToday, food: vFood, progress: vProgress, plan: vPlan, settings: vSettings }[S.tab] || vToday)() + vTabs();
  if (ui.info) h += vInfo(ui.info);
  app.innerHTML = h;
  document.body.classList.toggle('in-workout', !!(S.current && !ui.out));
}

function vTabs() {
  const t = [['today', 'Dziś', 'home'], ['food', 'Jedzenie', 'utensils'], ['progress', 'Postęp', 'chart'], ['plan', 'Plan', 'list'], ['settings', 'Profil', 'user']];
  return `<nav class="tabs">${t.map(([id, l, i]) => `<button data-a="tab" data-v="${id}" class="${S.tab === id ? 'on' : ''}" ${S.tab === id ? 'aria-current="page"' : ''}>${ic(i)}<span>${l}</span></button>`).join('')}</nav>`;
}
const cardH = (icon, title, tone = 'g', extra = '') => `<div class="ch">${badge(icon, tone)}<b>${title}</b>${extra}</div>`;

function countdowns(t) {
  const out = [];
  const ski = P.goals.ski, cav = P.goals.caving;
  if (t < ski.start) { const n = diffDays(t, ski.start); out.push(`<div class="cd ski">${ic('snow')}<div><b>${n}</b><span>${plural(n, 'dzień', 'dni', 'dni')} do nart</span></div></div>`); }
  else if (t <= ski.end) out.push(`<div class="cd hot">${ic('snow')}<div><b>Narty</b><span>trwają!</span></div></div>`);
  if (t < cav.start) { const n = diffDays(t, cav.start); out.push(`<div class="cd cave">${ic('mountain')}<div><b>${n}</b><span>${plural(n, 'dzień', 'dni', 'dni')} do jaskiń</span></div></div>`); }
  return out.length ? `<div class="cds">${out.join('')}</div>` : '';
}

function vToday() {
  const t = today(), ph = phaseFor(t);
  let h = `<header class="top"><div class="eyebrow">${esc(fmtLong(t))}</div><h1>Cześć, Daria <span class="wave">👋</span></h1></header>`;
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
      h += `<section class="card hero">${HERO_ART}<div class="eyebrow">${ic('calendar')} ${esc(ph.name)}</div>
        <h2>Następny: ${esc(s.name)}</h2>
        <div class="meta">${ic('clock')} ok. ${s.min} min <span>·</span> ${ic('dumbbell')} ${bl.length} ${plural(bl.length, 'ćwiczenie', 'ćwiczenia', 'ćwiczeń')}${footN ? ` <span>·</span> ${ic('foot')} stopa` : ''}</div>
        <ol class="mini">${bl.map((b, i) => `<li><i>${i + 1}</i><span>${esc(EX[b.ex].n)}</span></li>`).join('')}</ol>
        <button class="btn big cta" data-a="start" data-v="${nx}" data-p="${ph.id}">${ic('play')} Zaczynam trening</button>
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

  h += vTreat(t) + vHabits(t) + vMotivation(t);
  {
    const e = energy(t);
    if (e.ok) h += `<section class="card row">${badge('utensils', e.left < 0 ? 'b' : 'g')}<div class="grow"><b>${e.left >= 0 ? `Zostało ${e.left} kcal` : `Ponad budżet o ${-e.left} kcal`}</b><p class="muted">Zjedzone ${e.eaten} z ${e.budget} kcal${e.active == null ? ' · dopisz aktywne kcal' : ''}</p></div><button class="btn small ghost" data-a="tab" data-v="food" aria-label="Dodaj posiłek">${ic('plus')}</button></section>`;
  }
  h += vWeightCard(t);
  const lb = sortedBody().pop();
  if (!lb || diffDays(lb.d, t) >= 14) h += `<section class="card row">${badge('ruler', 'b')}<div class="grow"><b>Obwody</b><p class="muted">${lb ? `Ostatnio ${fmtD(lb.d)} · pora na kolejny pomiar` : 'Co 2 tygodnie, ok. 3 min'}</p></div><button class="btn small ghost" data-a="goBody">${ic('ruler')} Zmierz</button></section>`;

  const needBackup = (S.logs.length + S.weights.length >= 3) && (!S.lastExport || diffDays(S.lastExport, t) >= 14);
  if (needBackup) h += `<section class="card row warn">${badge('download', 'w')}<div class="grow"><b>Kopia zapasowa</b><p class="muted">${S.lastExport ? `Ostatnia: ${fmtD(S.lastExport)}` : 'Jeszcze żadnej'} · iOS może wyczyścić dane</p></div><button class="btn small ghost" data-a="export">Zapisz</button></section>`;

  return `<div class="page">${h}${LANDSCAPE}</div>`;
}

function vTreat(t) {
  const ts = treatState(); if (!ts.started) return '';
  if (ts.available) return `<section class="card treat on">${badge('gift', 'b')}<div class="grow"><b>Nagroda! Dziś należy Ci się małe co nieco</b>
    <p class="muted">Bez wyrzutów sumienia. Nie zeruje liczników, ale wpisz kcal w Jedzeniu.</p></div>
    <button class="btn small" data-a="useTreat" data-v="${ts.due.d}">${ic('check')} Zjadłam</button></section>`;
  const n = diffDays(t, ts.next.d), span = diffDays(ts.prev, ts.next.d), pct = Math.min(100, (span - n) / span * 100);
  return `<section class="card treat">${cardH('gift', `Nagroda za ${n} ${plural(n, 'dzień', 'dni', 'dni')}`, 'b', `<small class="ch-r">${fmtD(ts.next.d)}</small>`)}
    <div class="bar thin"><i style="width:${pct}%"></i></div>
    <p class="muted small">Małe co nieco ${ts.rule}. Z każdym miesiącem rzadziej, bo coraz mniej go potrzebujesz.</p></section>`;
}

function vHabits(t) {
  if (t < (S.settings.startDate || t)) return '';
  return `<section class="card">${cardH('shield', 'Dni bez…')}<div class="habits">${HABITS.map(([k, n, i]) => {
    const st = habitStat(k);
    return `<div class="hb ${st.slipToday ? 'slip' : ''}">${ic(i)}<b>${st.cur}</b><span>${plural(st.cur, 'dzień', 'dni', 'dni')} bez ${n}</span><small>rekord ${st.best}</small>
      <button class="hb-btn" data-a="${st.slipToday ? 'undoSlip' : 'slip'}" data-v="${k}">${st.slipToday ? 'Cofnij' : 'Wpadka'}</button></div>`;
  }).join('')}</div>
  <p class="muted small">Licznik rośnie sam. Stuknij „Wpadka” tylko wtedy, gdy zjesz. Nagroda z kalendarza się nie liczy.</p></section>`;
}

function vMotivation(t) {
  const e = energy(t); if (!e.ok) return '';
  const sk = streak(); if (sk.n > (S.bestStreak || 0)) { S.bestStreak = sk.n; save(); }
  const wc = weekChallenge(weekStart(t));
  const names = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd'];
  const dots = wc.days.map((d, i) => {
    const has = (S.food[d] || []).length, ok = dayOk(d);
    return `<i class="wd ${d > t ? 'fut' : ''} ${ok ? 'ok' : has ? 'miss' : ''} ${d === t ? 'now' : ''}" title="${names[i]}">${ok ? ic('check') : names[i][0]}</i>`;
  }).join('');
  const stepPct = wc.avg == null ? 0 : Math.min(100, wc.avg / STEP_GOAL * 100);
  let h = '';
  // podsumowanie zeszłego tygodnia — raz, w nowym tygodniu
  const prevWs = addDays(weekStart(t), -7);
  if (S.weekSeen !== weekStart(t) && Object.keys(S.food).some(d => d >= prevWs && d < weekStart(t))) {
    const p = weekChallenge(prevWs), both = p.okDone && p.stepsDone, one = p.okDone || p.stepsDone;
    h += `<section class="card flash">${badge(both ? 'trophy' : one ? 'flame' : 'sparkle', 'b')}<div class="grow"><b>${both ? 'Wyzwanie tygodnia zaliczone!' : one ? 'Połowa wyzwania zaliczona' : 'Nowy tydzień, nowa szansa'}</b>
      <p>Zeszły tydzień: ${p.ok}/7 dni w budżecie · ${p.avg != null ? p.avg + ' kroków dziennie' : 'kroki nie wpisane'}.</p></div><button class="btn small ghost" data-a="weekSeen">OK</button></section>`;
  }
  h += `<section class="card motiv">
    <div class="streak">${badge('flame', 'b')}<div class="grow"><b>${sk.n} ${plural(sk.n, 'dzień', 'dni', 'dni')} w budżecie</b>
      <p class="muted">${sk.n ? 'z rzędu' : 'Zacznij passę: zmieść się dziś w budżecie'} · rekord ${S.bestStreak || 0} · joker ${sk.joker ? 'wykorzystany' : 'dostępny'}</p></div></div>
    <div class="ch sub">${ic('trophy')}<b>Wyzwanie tygodnia</b></div>
    <div class="ch-row"><span>${ic('utensils')} ${WEEK_DAYS_GOAL} z 7 dni w budżecie</span><b class="${wc.okDone ? 'done' : ''}">${wc.ok}/${WEEK_DAYS_GOAL}${wc.okDone ? ' ✓' : ''}</b></div>
    <div class="wdots">${dots}</div>
    <div class="ch-row"><span>${ic('run')} Średnio ${STEP_GOAL} kroków</span><b class="${wc.stepsDone ? 'done' : ''}">${wc.avg != null ? wc.avg : '—'}${wc.stepsDone ? ' ✓' : ''}</b></div>
    <div class="bar thin"><i style="width:${stepPct}%"></i></div>
    <p class="hint">${ic('info')}<span>Joker: jeden gorszy dzień w tygodniu nie przerywa passy. Jedna wpadka to nie porażka, liczy się kolejny dzień.</span></p>
  </section>`;
  return h;
}

function pickList(ph, skip) {
  const { done, credited } = weekDone(ph);
  return `<div class="pick">${ph.sessions.filter(id => id !== skip).map(id =>
    `<button class="pick-i" data-a="start" data-v="${id}" data-p="${ph.id}">${ic(/^K/.test(id) ? 'heart' : 'dumbbell')}<span>${esc(SES[id].name)}</span><small>${credited.includes(id) ? 'zaliczony aktywnością' : done.has(id) ? 'zrobiony w tym tyg.' : `${SES[id].min} min`}</small></button>`).join('')}</div>`;
}

function vWeek(t, ph) {
  const ws = weekStart(t), wl = weekLogs(t), wa = weekActs(t);
  const names = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd'];
  const days = names.map((n, i) => {
    const d = addDays(ws, i);
    const tr = wl.some(l => l.date === d), a = wa.find(x => x.d === d), f = !!S.foot[d];
    return `<div class="day ${d === t ? 'now' : ''} ${d > t ? 'fut' : ''}"><span>${n}</span><i class="dot ${tr ? 'tr' : ''} ${a && !tr ? 'vb' : ''}">${tr ? ic('check') : a ? ic(actType(a.type)[2]) : ''}</i><em class="${f ? 'f' : ''}"></em></div>`;
  }).join('');
  const footN = names.filter((_, i) => S.foot[addDays(ws, i)]).length;
  const target = ph.type === 'break' ? 0 : ph.sessions.length;
  const { done, credited } = ph.type === 'break' ? { done: new Set(), credited: [] } : weekDone(ph, t);
  const doneN = ph.sessions.filter(id => done.has(id)).length;
  const actIcons = [...new Set(wa.map(a => actType(a.type)[2]))].slice(0, 3).map(i => ic(i)).join('') || ic('activity');
  let h = `<section class="card">${cardH('calendar', 'Ten tydzień')}<div class="week">${days}</div>
    <div class="stats3 tiles">
      ${target ? `<div class="t-g">${ic('dumbbell')}<b>${doneN}/${target}</b><span>treningi</span></div>` : ''}
      <div class="t-v"><span class="icrow">${actIcons}</span><b>${wa.length}</b><span>${plural(wa.length, 'aktywność', 'aktywności', 'aktywności')}</span></div>
      <div class="t-p">${ic('foot')}<b>${footN}/7</b><span>stopa</span></div>
    </div>`;
  if (credited.length) h += `<p class="hint">${ic('check')}<span>Aktywność ${CARDIO_MIN}+ min zaliczyła ${credited.length === 1 ? 'trening' : 'treningi'}: ${credited.map(id => esc(SES[id].name)).join(', ')}.</span></p>`;
  if (wa.length) h += `<ul class="acts">${wa.map(a => `<li>${badge(actType(a.type)[2], 'v')}<div class="grow"><b>${esc(actName(a))}</b><small>${esc(dayLabel(a.d))}${a.min ? ` · ${a.min} min` : ''}${a.kcal ? ` · ${a.kcal} kcal` : ''}</small>${a.kcal ? `<button class="wtag ${a.inWatch ? 'on' : ''}" data-a="actWatch" data-v="${a.id}" aria-pressed="${!!a.inWatch}">${a.inWatch ? 'jest w Ruchu — nie dodaję' : 'dodaję do Ruchu'}</button>` : ''}</div><button class="icon-btn" data-a="delAct" data-v="${a.id}" aria-label="Usuń ${esc(actName(a))}">${ic('trash')}</button></li>`).join('')}</ul>`;
  h += ui.addAct ? actForm() : `<button class="btn ghost full" data-a="addAct">${ic('plus')} Dodaj aktywność</button>`;
  return h + '</section>';
}

function actForm() {
  const f = ui.actF || (ui.actF = { type: 'skate', day: 0 });
  return `<div class="act-form">
    <p class="lbl">Co robiłaś?</p>
    <div class="act-types">${ACT_TYPES.map(([k, n, i]) => `<button class="${f.type === k ? 'on' : ''}" data-a="actType" data-v="${k}" aria-pressed="${f.type === k}">${ic(i)}<span>${n}</span></button>`).join('')}</div>
    ${f.type === 'other' ? `<label class="fld-in"><span>Nazwa</span><input id="actName" type="text" placeholder="np. wspinaczka" value="${esc(f.name || '')}"></label>` : ''}
    <div class="two-in">
      <label><span>${ic('clock')} Czas (min)</span><input id="actMin" type="text" inputmode="numeric" placeholder="np. 60" value="${f.min ?? ''}"></label>
      <label><span>${ic('flame')} Kcal</span><input id="actKcal" type="text" inputmode="numeric" placeholder="np. 400" value="${f.kcal ?? ''}"></label>
    </div>
    <label class="cbx"><input id="actInWatch" type="checkbox" ${f.inWatch ? 'checked' : ''}><span>Zegarek już ją zarejestrował (te kcal są w „Aktywne kcal” w Ruchu)</span></label>
    <div class="daypick"><button class="${f.day === 0 ? 'on' : ''}" data-a="actDay" data-v="0">Dziś</button><button class="${f.day === 1 ? 'on' : ''}" data-a="actDay" data-v="1">Wczoraj</button></div>
    <p class="muted small">Kcal z aktywności dodają się do Ruchu. ${CARDIO_MIN}+ minut zalicza jeden trening „Kondycja” w tym tygodniu.</p>
    <div class="row2"><button class="btn ghost" data-a="cancelAct">Anuluj</button><button class="btn" data-a="saveAct2">${ic('check')} Zapisz</button></div>
  </div>`;
}

function sortedW() { return [...S.weights].sort((a, b) => a.d < b.d ? -1 : 1); }

function vWeightCard(t) {
  const ws = sortedW(), lw = ws[ws.length - 1];
  const stale = !lw || diffDays(lw.d, t) >= 7;
  const form = `<div class="wform"><input id="wIn" type="text" inputmode="decimal" placeholder="np. 84,6" aria-label="Waga w kg"><span>kg</span><button class="btn small" data-a="saveW">Zapisz</button></div>`;
  if (stale || ui.addW) {
    return `<section class="card">${cardH('scale', lw ? 'Czas na ważenie' : 'Pierwsze ważenie', 'b')}<p class="muted">Rano, po toalecie, przed śniadaniem. Raz w tygodniu wystarczy.</p>${form}</section>`;
  }
  const ch = lw.kg - S.settings.startWeight, b = bmi(lw.kg), dg = datedGoal();
  return `<section class="card row">${badge('scale')}<div class="grow"><b>${fmtN(lw.kg)} kg${b ? ` <span class="pill">BMI ${fmtN(b)}</span>` : ''}</b><p class="muted">${fmtD(lw.d)} · ${sgn(ch)} kg od startu${dg && dg.lw ? ` · −${fmtN(dg.kg)} kg do ${fmtD(dg.end)}: <b class="st-${dg.status[1]}">${dg.status[0]}</b>` : ` · do celu ${fmtN(Math.max(0, lw.kg - S.settings.goalWeight))} kg`}</p></div><button class="btn small ghost" data-a="addW" aria-label="Dodaj pomiar wagi">${ic('plus')}</button></section>`;
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

// ---------- jedzenie ----------
function barChart(days) {
  const W = 340, H = 150, L = 8, R = 8, T = 14, B = 22, n = days.length;
  const max = Math.max(300, ...days.map(x => Math.abs(x.v || 0)));
  const mid = T + (H - T - B) / 2, half = (H - T - B) / 2, bw = (W - L - R) / n;
  let g = `<line x1="${L}" x2="${W - R}" y1="${mid}" y2="${mid}" class="grid"/>`;
  days.forEach((x, i) => {
    const cx = L + bw * i + bw / 2;
    if (x.v != null) {
      const hgt = Math.abs(x.v) / max * half;
      g += `<rect x="${cx - bw * 0.32}" y="${x.v >= 0 ? mid - hgt : mid}" width="${bw * 0.64}" height="${Math.max(1.5, hgt)}" rx="3" class="${x.v >= 0 ? 'bar-ok' : 'bar-over'}"/>`;
    }
    g += `<text x="${cx}" y="${H - 6}" class="ax" text-anchor="middle">${['Nd', 'Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So'][pd(x.d).getDay()]}</text>`;
  });
  return `<svg viewBox="0 0 ${W} ${H}" class="chart" role="img" aria-label="Deficyt z ostatnich 7 dni">${g}</svg>`;
}

function vFood() {
  const t = today(); if (!ui.fd || ui.fd > t) ui.fd = t;
  const d = ui.fd, e = energy(d);
  let h = `<header class="top"><h1>Jedzenie</h1></header>
    <div class="daynav"><button class="icon" data-a="fdPrev" aria-label="Poprzedni dzień">${ic('chevL')}</button><b>${esc(dayLabel(d))}</b>
    <button class="icon" data-a="fdNext" aria-label="Następny dzień" ${d >= t ? 'disabled' : ''}>${ic('chevR')}</button></div>`;

  if (!e.ok) {
    h += `<section class="card">${cardH('user', 'Uzupełnij profil', 'b')}<p class="muted">Do policzenia zapotrzebowania potrzebny jest wzrost i wiek.</p>
      <button class="btn full" data-a="tab" data-v="settings">${ic('user')} Przejdź do profilu</button></section>`;
  } else {
    const pct = Math.min(100, e.eaten / e.budget * 100), over = e.left < 0;
    h += `<section class="card kcal ${over ? 'over' : ''}">
      <div class="kcal-top">${ring(e.eaten / e.budget, `${ic('flame')}<b>${over ? -e.left : e.left}</b><span>${over ? 'kcal ponad' : 'kcal zostało'}</span>`)}
        <ul class="kcal-list">
          <li>${ic('utensils')}<b>${e.eaten}</b><span>zjedzone</span></li>
          <li>${ic('target')}<b>${e.budget}</b><span>budżet</span></li>
          <li>${ic('flame')}<b>${e.tdee}</b><span>spalasz</span></li>
        </ul></div>
      <p class="hint">${ic('info')}<span>Deficyt: <b>${e.deficit >= 0 ? e.deficit : '−' + (-e.deficit)} kcal</b> (cel ${S.settings.deficit}). ${e.active == null ? 'Budżet urośnie, gdy dopiszesz ruch albo aktywność.' : `Spalone w ruchu: <b>${e.active} kcal</b> = ${e.watch != null ? `${e.watch} z Ruchu` : ''}${e.watch != null && e.actKcal ? ' + ' : ''}${e.actKcal ? `${e.actKcal} z aktywności` : ''}.`}${e.floor ? ' Budżet nie schodzi poniżej 1200 kcal.' : ''}</span></p>
    </section>`;
  }

  const act = S.activity[d] || {};
  h += `<section class="card">${cardH('activity', 'Ruch')}
    <div class="two-in">
      <label><span>${ic('flame')} Aktywne kcal</span><input id="aKcal" type="text" inputmode="numeric" value="${act.kcal ?? ''}" placeholder="np. 450"></label>
      <label><span>${ic('run')} Kroki</span><input id="aSteps" type="text" inputmode="numeric" value="${act.steps ?? ''}" placeholder="np. 8000"></label>
    </div>
    <button class="btn ghost full" data-a="saveAct">${ic('check')} Zapisz ruch</button>
    <p class="hint">${ic('info')}<span>Aktywne kcal: Fitness (czerwony pierścień „Ruch”) albo Zdrowie → Aktywność → Aktywna energia, wieczorem za cały dzień. Kcal z aktywności (siatkówka, rolki…) dodają się do tej liczby.</span></p>
  </section>`;

  const rec = recentMeals();
  h += `<section class="card">${cardH('plus', 'Dodaj posiłek', 'b')}
    <div class="meal-in"><input id="mName" type="text" placeholder="Co zjadłaś?" aria-label="Nazwa posiłku" autocomplete="off">
      <span class="bin"><input id="mKcal" type="text" inputmode="numeric" placeholder="kcal" aria-label="Kalorie"></span></div>
    <button class="btn full" data-a="addMeal">${ic('plus')} Dodaj</button>
    ${rec.length ? `<p class="muted small">Szybko dodaj:</p><div class="chips">${rec.map((m, i) => `<button class="chip-btn" data-a="quickMeal" data-v="${i}">${esc(m.n)} <b>${m.kcal}</b></button>`).join('')}</div>` : ''}
  </section>`;

  h += `<section class="card">${cardH('utensils', `Posiłki (${e.meals.length})`)}
    ${e.meals.length ? `<ul class="wl">${e.meals.map(m => `<li><span>${esc(m.t || '')}</span><b>${esc(m.n)}</b><small>${m.kcal} kcal</small><button class="icon-btn" data-a="delMeal" data-v="${m.id}" aria-label="Usuń ${esc(m.n)}">${ic('trash')}</button></li>`).join('')}</ul>`
      : `<div class="empty">${ic('utensils')}<p>Jeszcze nic. Dodaj pierwszy posiłek powyżej.</p></div>`}
  </section>`;

  if (e.ok) {
    const days = Array.from({ length: 7 }, (_, i) => addDays(t, i - 6)).map(x => {
      const en = energy(x); return { d: x, v: (S.food[x] || []).length ? en.deficit : null };
    });
    const logged = days.filter(x => x.v != null), sum = logged.reduce((a, x) => a + x.v, 0);
    const stepsDays = days.map(x => num((S.activity[x.d] || {}).steps)).filter(v => v != null);
    h += `<section class="card">${cardH('chart', 'Ostatnie 7 dni')}
      ${logged.length ? barChart(days) + `<div class="stats3">
        <div><b>${sum >= 0 ? '' : '−'}${Math.abs(sum)}</b><span>kcal deficytu</span></div>
        <div><b>≈ ${fmtN(Math.max(0, sum) / 7700)}</b><span>kg tłuszczu</span></div>
        <div><b>${stepsDays.length ? Math.round(stepsDays.reduce((a, v) => a + v, 0) / stepsDays.length) : '—'}</b><span>kroków / dzień</span></div></div>
        <p class="hint">${ic('info')}<span>Zielone słupki to deficyt, terakotowe to dni ponad zapotrzebowanie. Liczone są tylko dni z wpisanym jedzeniem. Kilogramy to szacunek (7700 kcal ≈ 1 kg), prawdziwy wynik pokaże waga.</span></p>`
      : `<div class="empty">${ic('chart')}<p>Wykres pojawi się po pierwszym dniu z wpisanym jedzeniem.</p></div>`}
    </section>`;
  }
  return `<div class="page">${h}</div>`;
}

// ---------- postęp ----------
function lineChart(pts, { goal = null, unit = 'kg', label = '', refs = [], plan = null } = {}) {
  if (pts.length < (plan ? 1 : 2)) return `<div class="empty">${ic('chart')}<p>Wykres pojawi się po ${plan ? 'pierwszym pomiarze' : '2 pomiarach'}.</p></div>`;
  const W = 340, H = 190, L = 38, R = 12, T = 12, B = 26;
  const xs = pts.map(p => pd(p.x).getTime());
  const ys = pts.map(p => p.y);
  const pxs = plan ? plan.map(p => pd(p.x).getTime()) : [], pys = plan ? plan.map(p => p.y) : [];
  let x0 = Math.min(...xs, ...pxs), x1 = Math.max(...xs, ...pxs); if (x1 === x0) x1 = x0 + 864e5;
  let y0 = Math.min(...ys, ...pys), y1 = Math.max(...ys, ...pys);
  if (y1 - y0 < 4) { const m = (y0 + y1) / 2; y0 = m - 2; y1 = m + 2; }
  const pd_ = (y1 - y0) * 0.12; y0 -= pd_; y1 += pd_;
  if (goal != null && goal >= y0 - (y1 - y0) * 0.6 && goal < y0) y0 = goal - (y1 - y0) * 0.05;
  const X = v => L + (v - x0) / (x1 - x0) * (W - L - R), Y = v => T + (1 - (v - y0) / (y1 - y0)) * (H - T - B);
  let g = '';
  for (const r of refs) if (r.v >= y0 && r.v <= y1) g += `<line x1="${L}" x2="${W - R}" y1="${Y(r.v)}" y2="${Y(r.v)}" class="ref"/><text x="${L + 4}" y="${Y(r.v) - 4}" class="ax ref-t">${esc(r.label)}</text>`;
  for (let i = 0; i <= 3; i++) { const v = y0 + (y1 - y0) * i / 3; g += `<line x1="${L}" x2="${W - R}" y1="${Y(v)}" y2="${Y(v)}" class="grid"/><text x="${L - 6}" y="${Y(v) + 4}" class="ax" text-anchor="end">${(y1 - y0) < 10 ? fmtN(Math.round(v * 2) / 2) : Math.round(v)}</text>`; }
  if (goal != null && goal >= y0 && goal <= y1) g += `<line x1="${L}" x2="${W - R}" y1="${Y(goal)}" y2="${Y(goal)}" class="goal"/><text x="${W - R}" y="${Y(goal) - 5}" class="ax goal-t" text-anchor="end">cel ${fmtN(goal)} ${unit}</text>`;
  if (plan) g += `<path d="M${X(pxs[0]).toFixed(1)},${Y(pys[0]).toFixed(1)}L${X(pxs[1]).toFixed(1)},${Y(pys[1]).toFixed(1)}" class="plan"/><text x="${X(pxs[1]) - 2}" y="${Y(pys[1]) + 14}" class="ax goal-t" text-anchor="end">plan ${fmtN(pys[1])}</text>`;
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${X(xs[i]).toFixed(1)},${Y(p.y).toFixed(1)}`).join('');
  const lp = pts[pts.length - 1];
  g += `<path d="${d}" class="ln"/>` + pts.map((p, i) => `<circle cx="${X(xs[i])}" cy="${Y(p.y)}" r="${i === pts.length - 1 ? 4.5 : 2.5}" class="pt"/>`).join('');
  g += `<text x="${L}" y="${H - 6}" class="ax">${fmtD(ds(new Date(x0)))}</text><text x="${W - R}" y="${H - 6}" class="ax" text-anchor="end">${fmtD(ds(new Date(x1)))}</text>`;
  return `<svg viewBox="0 0 ${W} ${H}" class="chart" role="img" aria-label="${esc(label)}">${g}</svg>`;
}

function vProgress() {
  const segs = [['weight', 'Waga', 'scale'], ['body', 'Obwody', 'ruler'], ['strength', 'Siła', 'dumbbell'], ['stats', 'Razem', 'trophy']];
  let h = `<header class="top"><h1>Postęp</h1></header>
    <div class="seg" role="tablist">${segs.map(([id, l, i]) => `<button role="tab" aria-selected="${ui.pt === id}" class="${ui.pt === id ? 'on' : ''}" data-a="pt" data-v="${id}">${ic(i)}<span>${l}</span></button>`).join('')}</div>`;
  h += ({ weight: pWeight, body: pBody, strength: pStrength, stats: pStats }[ui.pt] || pWeight)();
  return `<div class="page">${h}${LANDSCAPE}</div>`;
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
    ${(() => { const dg = datedGoal(); return lineChart(ws.map(w => ({ x: w.d, y: w.kg })), { goal: dg ? null : st.goalWeight, label: 'Wykres wagi', plan: dg ? [{ x: dg.start, y: num(st.startWeight) }, { x: dg.end, y: dg.target }] : null }); })()}
    <p class="hint">${ic('target')}<span>Do celu (${fmtN(st.goalWeight)} kg): <b>${lw ? fmtN(Math.max(0, lw.kg - st.goalWeight)) : '—'} kg</b>. Zdrowe tempo to 0,5–1 kg na tydzień.</span></p>
    <button class="btn ghost full" data-a="tabAddW">${ic('plus')} Dodaj pomiar wagi</button>
  </section>`;
  h += vDatedGoal() + vMilestones(lw);

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

function vDatedGoal() {
  const dg = datedGoal(); if (!dg) return '';
  if (!dg.lw) return `<section class="card">${cardH('calendar', `−${fmtN(dg.kg)} kg do ${fmtD(dg.end)}`, 'b')}<p class="muted">Zważ się, żeby zobaczyć, czy idziesz zgodnie z planem.</p></section>`;
  const [label, tone, icon] = dg.status;
  return `<section class="card">${cardH('calendar', `−${fmtN(dg.kg)} kg do ${fmtD(dg.end)}`, 'b', `<small class="ch-r">zostało ${dg.left} dni</small>`)}
    <div class="status st-${tone}">${ic(icon)}<b>${label}</b></div>
    <div class="stats3">
      <div><b>${fmtN(dg.lw.kg)}</b><span>teraz</span></div>
      <div><b>${fmtN(dg.planAt(dg.lw.d))}</b><span>plan na ${fmtD(dg.lw.d)}</span></div>
      <div><b>${fmtN(dg.target)}</b><span>cel</span></div>
    </div>
    <p class="hint">${ic('info')}<span>Przerywana linia na wykresie to plan. ${dg.need != null ? `Żeby zdążyć, potrzebujesz teraz ok. <b>${fmtN(Math.max(0, dg.need))} kg/tydz.</b>${dg.need > 1 ? ' To dużo — lepiej wydłużyć termin niż ciąć jedzenie.' : ''}` : ''} Na początku waga często spada szybciej (woda), potem wolniej, i to normalne.</span></p>
  </section>`;
}

function vMilestones(lw) {
  const ms = milestones(); if (!ms.length) return '';
  const start = num(S.settings.startWeight), total = ms[ms.length - 1].v;
  const lost = lw ? Math.max(0, start - lw.kg) : 0, pct = Math.min(100, lost / total * 100);
  const next = ms.find(m => lost < m.v - 0.05);
  return `<section class="card">${cardH('trophy', 'Kamienie milowe', 'b')}
    <div class="big-stat"><b>${fmtN(lost)} kg</b><span>${next ? `do „${next.label}” zostało ${fmtN(next.v - lost)} kg` : 'Cel osiągnięty!'}</span></div>
    <div class="mtrack"><div class="bar"><i style="width:${pct}%"></i></div>${ms.map(m => `<em style="left:${m.v / total * 100}%" class="${lost >= m.v - 0.05 ? 'hit' : ''}"></em>`).join('')}</div>
    <ul class="mlist">${ms.map(m => { const hit = lost >= m.v - 0.05; return `<li class="${hit ? 'hit' : m === next ? 'next' : ''}">${ic(hit ? 'check' : m === next ? 'target' : 'flame')}<span>${esc(m.label)}</span><small>${fmtN(start - m.v)} kg</small></li>`; }).join('')}</ul>
  </section>`;
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
    <div>${ic('activity')}<b>${S.acts.length}</b><span>aktywności</span></div>
    <div>${ic('ruler')}<b>${S.body.length}</b><span>pomiarów obw.</span></div></div>
  </section>
  ${S.acts.length ? `<section class="card">${cardH('activity', 'Aktywności', 'v', `<small class="ch-r">${fmtN(S.acts.reduce((x, a) => x + (num(a.min) || 0), 0) / 60)} h</small>`)}<ul class="wl">${[...S.acts].sort((a, b) => a.d < b.d ? 1 : -1).slice(0, 40).map(a => `<li><span>${fmtD(a.d)}</span><b>${esc(actName(a))}</b><small>${a.min ? a.min + ' min' : ''}${a.kcal ? ' · ' + a.kcal + ' kcal' : ''}</small></li>`).join('')}</ul></section>` : ''}
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
    <label class="fld">${ic('play')}<span>Start programu</span><span class="bin"><input id="sStartDate" type="date" value="${esc(st.startDate || '')}"></span></label>
    ${f('sDgKg', 'Cel pośredni: schudnąć', st.dgKg, 'kg', 'flame')}
    <label class="fld">${ic('calendar')}<span>…do dnia</span><span class="bin"><input id="sDgDate" type="date" value="${esc(st.dgDate || '')}"></span></label>
    <button class="btn full" data-a="saveSet">${ic('check')} Zapisz</button>
    <div class="ch sub">${ic('flame')}<b>Dzienny deficyt</b></div>
    <div class="seg seg3">${[[300, 'łagodny'], [500, 'standard'], [700, 'szybszy']].map(([v, l]) => `<button class="${+st.deficit === v ? 'on' : ''}" data-a="setDef" data-v="${v}"><b>${v} kcal</b><span>${l}</span></button>`).join('')}</div>
    <p class="muted small">500 kcal dziennie to ok. 0,5 kg tygodniowo. Zapotrzebowanie liczę wzorem Mifflina-St Jeora (dla kobiet) z wagi, wzrostu i wieku.</p>
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
    <p class="muted small">${realLogs().length} treningów · ${S.weights.length} ważeń · ${S.body.length} pomiarów obwodów · ${Object.keys(S.food).length} dni z jedzeniem · ${Object.keys(S.foot).length} dni ze stopą</p>
    <p class="muted small">Daty nart i szkolenia oraz cały plan zmieniasz w pliku <code>plan.js</code>.</p>
    <button class="btn ghost full danger" data-a="reset">${ic('trash')} Usuń wszystkie dane</button>
  </section>${LANDSCAPE}</div>`;
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

function keepActF() {
  const f = ui.actF || (ui.actF = { type: 'skate', day: 0 }), g = id => document.getElementById(id);
  if (g('actInWatch')) f.inWatch = g('actInWatch').checked;
  if (g('actMin')) f.min = g('actMin').value; if (g('actKcal')) f.kcal = g('actKcal').value; if (g('actName')) f.name = g('actName').value;
}
function pushMeal(n, kcal) {
  const d = ui.fd || today(), now = new Date();
  (S.food[d] = S.food[d] || []).push({ id: Date.now(), n, kcal, t: d === today() ? `${pad(now.getHours())}:${pad(now.getMinutes())}` : '' });
  save(); render(); toast(`Dodano: ${n} (${kcal} kcal)`);
}

const act = {
  tab(v) { S.tab = v; ui.fd = null; ui.addAct = false; ui.pick = false; ui.addW = false; ui.addBody = false; ui.info = null; save(); render(); scrollTo(0, 0); },
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
  addAct() { ui.addAct = true; ui.actF = { type: 'skate', day: 0 }; render(); },
  cancelAct() { ui.addAct = false; render(); },
  actType(v) { keepActF(); ui.actF.type = v; render(); },
  actDay(v) { keepActF(); ui.actF.day = +v; render(); },
  saveAct2() {
    keepActF(); const f = ui.actF, min = num(f.min), kcal = num(f.kcal);
    if (f.type === 'other' && !(f.name || '').trim()) { toast('Wpisz nazwę aktywności'); return; }
    if (min == null || min <= 0 || min > 900) { toast('Wpisz czas w minutach'); return; }
    if (kcal != null && (kcal < 0 || kcal > 4000)) { toast('Kcal: od 0 do 4000'); return; }
    const a = { id: Date.now(), d: addDays(today(), -f.day), type: f.type, min: Math.round(min), kcal: kcal == null ? null : Math.round(kcal) };
    if (f.type === 'other') a.name = f.name.trim();
    if (f.inWatch) a.inWatch = true;
    S.acts.push(a); ui.addAct = false; save(); render();
    toast(min >= CARDIO_MIN ? `Zapisane! ${actName(a)} zalicza kondycję.` : `Zapisane: ${actName(a)}`);
  },
  actWatch(v) { const a = S.acts.find(x => String(x.id) === String(v)); if (!a) return; a.inWatch = !a.inWatch; save(); render(); toast(a.inWatch ? 'Nie dodaję — jest już w Ruchu' : 'Dodaję do Ruchu'); },
  delAct(v) { if (!confirm('Usunąć tę aktywność?')) return; S.acts = S.acts.filter(a => String(a.id) !== String(v)); save(); render(); },
  addW() { ui.addW = true; render(); setTimeout(() => document.getElementById('wIn')?.focus(), 50); },
  tabAddW() { S.tab = 'today'; ui.addW = true; render(); scrollTo(0, 0); setTimeout(() => document.getElementById('wIn')?.focus(), 50); },
  saveW() {
    const v = num(document.getElementById('wIn')?.value);
    if (v == null || v < 30 || v > 250) { toast('Wpisz wagę w kg, np. 84,6'); return; }
    const t = today();
    S.weights = S.weights.filter(w => w.d !== t); S.weights.push({ d: t, kg: v });
    ui.addW = false;
    const hit = checkMilestones();
    if (hit) S.flash = { t: `Kamień milowy: ${hit.label}!`, x: `Od startu ${fmtN(num(S.settings.startWeight) - v)} kg mniej. To jest prawdziwy postęp.` };
    save(); render(); scrollTo(0, 0); toast(hit ? 'Kamień milowy!' : 'Zapisane ✓');
  },
  weekSeen() { S.weekSeen = weekStart(today()); save(); render(); },
  slip(v) {
    const n = (HABITS.find(h => h[0] === v) || [])[1];
    if (!confirm(`Zapisać wpadkę (${n})? Licznik zacznie od nowa. Rekord zostaje.`)) return;
    S.slips[v] = [...new Set([...(S.slips[v] || []), today()])]; save(); render(); toast('Zapisane. Jutro nowy licznik — dasz radę.');
  },
  undoSlip(v) { S.slips[v] = (S.slips[v] || []).filter(d => d !== today()); save(); render(); toast('Cofnięte'); },
  useTreat(v) { if (!S.treats.includes(v)) S.treats.push(v); save(); render(); toast('Smacznego! Następna nagroda już się liczy.'); },
  delW(v) { if (!confirm('Usunąć ten pomiar?')) return; S.weights = S.weights.filter(w => w.d !== v); save(); render(); },
  unflash() { S.flash = null; save(); render(); },
  saveSet() {
    const g = id => num(document.getElementById(id).value);
    const a = g('sStart'), b = g('sGoal'), hgt = g('sHeight'), age = g('sAge');
    if (a == null || b == null) { toast('Uzupełnij wagę startową i docelową'); return; }
    if (hgt != null && (hgt < 120 || hgt > 220)) { toast('Wzrost wpisz w cm, np. 168'); return; }
    if (age != null && (age < 10 || age > 100)) { toast('Sprawdź wiek'); return; }
    const sd = document.getElementById('sStartDate').value, dgd = document.getElementById('sDgDate').value, dgk = g('sDgKg');
    if (dgk != null && (dgk <= 0 || dgk > 30)) { toast('Cel pośredni: od 0,5 do 30 kg'); return; }
    if (sd && dgd && dgd <= sd) { toast('Data celu musi być po dacie startu'); return; }
    Object.assign(S.settings, { startWeight: a, goalWeight: b, height: hgt, age: age == null ? null : Math.round(age), startDate: sd || S.settings.startDate, dgKg: dgk, dgDate: dgd || null });
    save(); render(); toast('Zapisane ✓');
  },
  pt(v) { ui.pt = v; render(); },
  setDef(v) { S.settings.deficit = +v; save(); render(); toast('Deficyt: ' + v + ' kcal'); },
  fdPrev() { ui.fd = addDays(ui.fd || today(), -1); render(); },
  fdNext() { const n = addDays(ui.fd || today(), 1); if (n <= today()) { ui.fd = n; render(); } },
  saveAct() {
    const k = num(document.getElementById('aKcal').value), st = num(document.getElementById('aSteps').value);
    if (k != null && (k < 0 || k > 4000)) { toast('Aktywne kcal: od 0 do 4000'); return; }
    if (st != null && (st < 0 || st > 100000)) { toast('Sprawdź liczbę kroków'); return; }
    const d = ui.fd || today();
    if (k == null && st == null) delete S.activity[d]; else S.activity[d] = { kcal: k == null ? null : Math.round(k), steps: st == null ? null : Math.round(st) };
    save(); render(); toast('Ruch zapisany ✓');
  },
  addMeal() {
    const n = (document.getElementById('mName').value || '').trim(), k = num(document.getElementById('mKcal').value);
    if (!n) { toast('Wpisz, co zjadłaś'); document.getElementById('mName').focus(); return; }
    if (k == null || k <= 0 || k > 3000) { toast('Wpisz kcal (1–3000)'); document.getElementById('mKcal').focus(); return; }
    pushMeal(n, Math.round(k));
  },
  quickMeal(v) { const m = recentMeals()[+v]; if (m) pushMeal(m.n, m.kcal); },
  delMeal(v) {
    const d = ui.fd || today(); S.food[d] = (S.food[d] || []).filter(m => String(m.id) !== String(v));
    if (!S.food[d].length) delete S.food[d]; save(); render();
  },
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
        if (!d.food || typeof d.food !== 'object') d.food = {};
        if (!d.activity || typeof d.activity !== 'object') d.activity = {};
        d.slips = Object.assign({ fast: [], sweet: [], salty: [] }, d.slips || {});
        if (!Array.isArray(d.treats)) d.treats = [];
        migrateActs(d);
        if (!confirm(`Wczytać kopię? (${d.logs.length} wpisów treningów, ${d.weights.length} pomiarów). Obecne dane zostaną zastąpione.`)) return;
        S = Object.assign(fresh(), d); S.settings = Object.assign(fresh().settings, d.settings); S.current = null; save(); render(); toast('Kopia wczytana ✓');
      } catch (err) { toast('To nie jest plik kopii z tej aplikacji'); }
    };
    r.readAsText(el.files[0]);
  }
});
app.addEventListener('keydown', e => {
  if (e.key === 'Enter' && e.target.id === 'wIn') act.saveW();
  if (e.key === 'Enter' && e.target.id === 'mName') document.getElementById('mKcal').focus();
  if (e.key === 'Enter' && e.target.id === 'mKcal') act.addMeal();
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
