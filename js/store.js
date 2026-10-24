// 진도 저장 (localStorage). 접근 불가해도 앱은 동작한다.
import { dayKey } from './util.js';

const KEY = 'talk-save-v1';
const blank = () => ({
  xp: 0, streak: 0, bestStreak: 0, lastDay: '', today: { day: '', xp: 0 }, goal: 60,
  nodes: {},        // { [scenarioId]: 별 0~3 }
  best: {},         // { [scenarioId]: 최고 점수(0~100) }
  skills: {},       // { [skillKey]: [얻은 점수, 가능한 점수] } (모든 도전 누적, 최근 반영을 위해 감쇠하지 않음)
  runs: 0,
  settings: { open: false, theme: '', showKo: true },
});

let mem = null;
function read() {
  try { const t = localStorage.getItem(KEY); if (t) return JSON.parse(t); } catch (e) { /* */ }
  return null;
}
const base = blank();
const loaded = read();
mem = loaded ? { ...base, ...loaded, settings: { ...base.settings, ...(loaded.settings || {}) } } : base;

export const store = {
  get s() { return mem; },
  save() { try { localStorage.setItem(KEY, JSON.stringify(mem)); } catch (e) { /* */ } },
  reset() { mem = blank(); this.save(); },
  addXp(n) {
    const d = dayKey();
    if (mem.today.day !== d) mem.today = { day: d, xp: 0 };
    mem.today.xp += n; mem.xp += n;
    if (mem.lastDay !== d) {
      const y = dayKey(Date.now() - 86400000);
      mem.streak = mem.lastDay === y ? mem.streak + 1 : 1;
      mem.lastDay = d;
      mem.bestStreak = Math.max(mem.bestStreak || 0, mem.streak);
    }
    this.save();
  },
  todayXp() { return mem.today.day === dayKey() ? mem.today.xp : 0; },
  streakNow() { const d = dayKey(), y = dayKey(Date.now() - 86400000); return mem.lastDay === d || mem.lastDay === y ? mem.streak : 0; },
  star(id) { return mem.nodes[id] || 0; },
  // 결과 기록: 별(최고값), 최고 점수, 스킬 누적
  record(id, { stars, score, skills }) {
    mem.nodes[id] = Math.max(mem.nodes[id] || 0, stars);
    mem.best[id] = Math.max(mem.best[id] || 0, score);
    for (const [k, [a, b]] of Object.entries(skills || {})) { const s = mem.skills[k] || (mem.skills[k] = [0, 0]); s[0] += a; s[1] += b; }
    mem.runs++;
    this.save();
  },
  skillPct(k) { const s = mem.skills[k]; return s && s[1] ? s[0] / s[1] : null; },
};

export const LEVELS = [
  [0, 'Listener', '👂'], [300, 'Conversationalist', '💬'], [900, 'Skilled Negotiator', '🤝'], [2000, 'Trusted Advisor', '🧭'], [4000, 'Master Communicator', '🏆'],
];
export function levelOf(xp) {
  let i = 0;
  for (let k = 0; k < LEVELS.length; k++) if (xp >= LEVELS[k][0]) i = k;
  const next = LEVELS[i + 1];
  return { name: LEVELS[i][1], icon: LEVELS[i][2], next: next ? next[0] - xp : 0, idx: i };
}
