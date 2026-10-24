// 숫자 협상 시뮬레이터 (순수 로직). 상대는 AI가 아니라 "한계선·양보 규칙"으로 움직이며, 같은 입력은 항상 같은 결과를 낸다.
//
// ── 단일 이슈(가격·연봉) ──────────────────────────────────────────
// cfg: { dir: +1(내가 더 큰 값을 원함: 판매자·구직자) | -1(더 작은 값을 원함: 구매자), b: 내 BATNA, r: 상대 한계선(숨김), open: 상대의 처음 입장,
//        min, max: 입력 범위, rounds: 제안 횟수, asks: [{q,a}], criteria: [{text,valid,fb}], batnaStrength: 0~1 }
const BASE = [0.3, 0.35, 0.42, 0.5, 0.6, 0.7];
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

export function startNego(cfg) {
  return { cfg, offers: 0, p: cfg.open, first: null, lastOffer: null, lastMove: 0, mood: 5, asks: 0, critUsed: null, batnaUsed: false, bluff: false, flex: 0, concessions: 0, log: [], done: false, deal: null, how: null, final: false };
}
const width = (cfg) => Math.abs(cfg.r - cfg.b);
const adv = (cfg, x) => cfg.dir * x; // 내 입장에서의 이득 좌표 (클수록 내게 유리)

function say(st, who, text) { st.log.push({ who, text }); }
function end(st, how, deal) { st.done = true; st.how = how; st.deal = deal == null ? null : deal; }

// 제안하기. 반환: { accepted, p(상대 새 입장), note }
export function offer(st, o) {
  const cfg = st.cfg;
  if (st.done) throw new Error('끝난 협상');
  o = clamp(o, cfg.min, cfg.max);
  const oy = adv(cfg, o), py = adv(cfg, st.p), ry = adv(cfg, cfg.r);
  st.offers++;
  if (st.first == null) st.first = o;
  // 상대 입장보다 상대에게 유리(또는 같은) 제안 → 즉시 수락
  if (oy <= py + 1e-9) { say(st, 'me', `제안 ${o}`); end(st, 'accepted', o); return { accepted: true, p: st.p, note: 'accept' }; }
  const W = width(cfg);
  const over = (oy - ry) / W; // 상대 한계선을 넘은 정도(0 이하면 합의 가능 범위)
  let f = BASE[Math.min(st.offers - 1, BASE.length - 1)] + 0.02 * (st.mood - 5) + st.flex;
  let note = 'ok';
  // 호혜: 내가 양보했는지
  if (st.lastOffer != null) {
    const conc = adv(cfg, st.lastOffer) - oy; // 이번에 내가 양보한 크기(이득 좌표)
    if (conc > 1e-9) { st.concessions++; f += clamp(conc / Math.max(st.lastMove, W * 0.02), 0, 1) * 0.12; st.mood = clamp(st.mood + 1, 0, 10); note = 'reciprocal'; }
    else { f -= 0.08; note = 'nochange'; }
  }
  if (over > 0.35) { f *= 0.25; st.mood = clamp(st.mood - 2, 0, 10); note = 'insult'; }
  else if (over > 0) { f *= 0.5; st.mood = clamp(st.mood - 1, 0, 10); note = 'beyond'; }
  f = clamp(f, 0.05, 0.9);
  const newPy = py + Math.min((oy - py) * f, Math.max(0, ry - py));
  st.lastMove = newPy - py;
  st.p = cfg.dir * newPy;
  st.lastOffer = o;
  if (st.mood <= 0) { end(st, 'walked_by_partner', null); return { accepted: false, p: st.p, note: 'partner_walk' }; }
  if (st.offers >= cfg.rounds) st.final = true;
  return { accepted: false, p: st.p, note };
}

export function ask(st, i) {
  const a = st.cfg.asks[i];
  if (!a || st.asks >= 2) return null;
  st.asks++; st.flex += 0.04; st.mood = clamp(st.mood + 1, 0, 10);
  return a;
}
export function useCriteria(st, i) {
  const c = st.cfg.criteria[i];
  if (!c || st.critUsed != null) return null;
  st.critUsed = i;
  if (c.valid) st.flex += 0.1; else st.mood = clamp(st.mood - 1, 0, 10);
  return c;
}
// 대안(BATNA)을 말하기: 사실이면 작은 효과, 없는 대안을 부풀리면 신뢰 하락
export function mentionBatna(st, honest) {
  if (st.batnaUsed) return null;
  st.batnaUsed = true;
  if (honest) { st.flex += 0.08 * (st.cfg.batnaStrength || 0); return { honest: true }; }
  st.bluff = true; st.flex -= 0.05; st.mood = clamp(st.mood - 2, 0, 10);
  if (st.mood <= 0) end(st, 'walked_by_partner', null);
  return { honest: false };
}
export function accept(st) { if (st.done) throw new Error('끝난 협상'); end(st, 'accepted', st.p); }
export function walk(st) { if (st.done) throw new Error('끝난 협상'); end(st, 'walked', null); }

export function summarize(st) {
  const cfg = st.cfg, W = width(cfg);
  let value = 0, tip = '';
  if (st.deal != null) {
    const s = adv(cfg, st.deal) - adv(cfg, cfg.b);
    if (s < 0) { value = 0; tip = '합의 값이 내 BATNA(대안)보다 나빠요. 이 값이라면 합의하지 않는 편이 나았어요.'; }
    else value = clamp(s / W, 0, 1);
  } else if (adv(cfg, st.p) >= adv(cfg, cfg.b)) { value = 0; tip = '상대의 마지막 제안이 내 BATNA보다 좋았는데 합의하지 않았어요.'; }
  else { value = 0.4; tip = '상대의 마지막 제안이 BATNA보다 나빠서 합의하지 않은 건 합리적인 판단이에요.'; }
  const rel = st.mood / 10;
  const firstOk = st.first != null && adv(cfg, st.first) >= adv(cfg, cfg.r) && adv(cfg, st.first) <= adv(cfg, cfg.r) + 0.35 * W;
  const process = (st.asks >= 1 ? 6 : 0) + (st.critUsed != null && cfg.criteria[st.critUsed].valid ? 6 : 0) + (st.concessions >= 1 ? 4 : 0) + (firstOk ? 4 : 0);
  const total = Math.round(value * 60 + rel * 20 + process);
  const stars = total >= 85 ? 3 : total >= 65 ? 2 : total >= 45 ? 1 : 0;
  return { value, rel, process, total, stars, tip, firstOk, zopa: [Math.min(cfg.b, cfg.r), Math.max(cfg.b, cfg.r)], deal: st.deal, how: st.how, share: value };
}

// ── 다중 이슈(패키지) ────────────────────────────────────────────
// cfg: { issues: [{ id, label, levels: [라벨...], me: [내 효용 0~1...], pa: [상대 효용 0~1...], wMe, wPa }], rounds, reserve(상대 최소 효용) }
export const levelsOf = (cfg) => cfg.issues.map((i) => i.levels.length);
export function utility(cfg, pkg, who) {
  const k = who === 'me' ? 'me' : 'pa', w = who === 'me' ? 'wMe' : 'wPa';
  const sw = cfg.issues.reduce((s, i) => s + i[w], 0);
  return cfg.issues.reduce((s, i, n) => s + i[w] * i[k][pkg[n]], 0) / sw;
}
export function allPackages(cfg) {
  const L = levelsOf(cfg), out = [];
  const rec = (n, cur) => { if (n === L.length) { out.push(cur.slice()); return; } for (let v = 0; v < L[n]; v++) { cur.push(v); rec(n + 1, cur); cur.pop(); } };
  rec(0, []);
  return out;
}
export function bestFeasible(cfg) {
  // 상대의 최소 효용을 넘기는 패키지 중 내 효용이 가장 큰 것(협상의 이론적 최대치)
  let best = null, bu = -1;
  for (const p of allPackages(cfg)) { if (utility(cfg, p, 'pa') >= cfg.reserve - 1e-9) { const u = utility(cfg, p, 'me'); if (u > bu) { bu = u; best = p; } } }
  return { pkg: best, u: bu };
}
const PB = [0.35, 0.4, 0.45, 0.5, 0.55];
export function startPkg(cfg) { return { cfg, round: 0, m: 0.35, prevUm: null, mood: 5, asked: 0, history: [], done: false, deal: null, how: null, counter: null }; }
// 상대가 내놓는 패키지: 내 효용이 m 이상인 것 중 상대 효용이 가장 높은 것
function counterPkg(cfg, m) {
  let best = null, bp = -1, bm = -1;
  for (const p of allPackages(cfg)) { const um = utility(cfg, p, 'me'); if (um >= m - 1e-9) { const up = utility(cfg, p, 'pa'); if (up > bp + 1e-9 || (Math.abs(up - bp) < 1e-9 && um > bm)) { bp = up; bm = um; best = p; } } }
  return best || bestFeasible(cfg).pkg;
}
export function proposePkg(st, pkg) {
  const cfg = st.cfg;
  if (st.done) throw new Error('끝난 협상');
  const um = utility(cfg, pkg, 'me'), up = utility(cfg, pkg, 'pa');
  const ceil = bestFeasible(cfg).u;
  st.round++;
  let f = PB[Math.min(st.round - 1, PB.length - 1)];
  let note = 'ok';
  if (st.prevUm != null) { if (um < st.prevUm - 1e-9) { f += 0.1; note = 'reciprocal'; } else if (um >= st.prevUm - 1e-9) { f -= 0.08; note = 'nochange'; } }
  if (up < cfg.reserve - 1e-9) { f *= 0.4; note = 'beyond'; }
  f = Math.max(0.05, f);
  const target = Math.min(um, ceil);
  if (target > st.m) st.m += (target - st.m) * f;
  st.prevUm = um;
  st.counter = counterPkg(cfg, st.m);
  st.history.push({ me: pkg.slice(), up, um, note });
  const planned = utility(cfg, st.counter, 'pa');
  if (up >= cfg.reserve - 1e-9 && up >= planned - 0.05) { st.done = true; st.how = 'accepted'; st.deal = pkg.slice(); return { accepted: true, note }; }
  if (st.round >= cfg.rounds) st.final = true;
  return { accepted: false, counter: st.counter.slice(), note };
}
export function acceptCounter(st) { if (!st.counter) throw new Error('받을 제안 없음'); st.done = true; st.how = 'accepted'; st.deal = st.counter.slice(); }
export function walkPkg(st) { st.done = true; st.how = 'walked'; }
export function askPkg(st) { if (st.asked >= 1) return null; st.asked++; return true; }
export function summarizePkg(st) {
  const cfg = st.cfg, opt = bestFeasible(cfg);
  if (!st.deal) return { total: 20, stars: 0, eff: 0, um: 0, opt };
  const um = utility(cfg, st.deal, 'me'), up = utility(cfg, st.deal, 'pa');
  const eff = clamp(um / opt.u, 0, 1);
  const total = Math.round(eff * 75 + (st.asked ? 10 : 0) + (up >= cfg.reserve ? 15 : 0));
  return { total, stars: total >= 85 ? 3 : total >= 65 ? 2 : total >= 45 ? 1 : 0, eff, um, up, opt };
}
