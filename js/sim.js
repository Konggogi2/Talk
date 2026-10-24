// 분기 대화 시뮬레이션 엔진 (순수 로직: 화면·무작위와 무관). 상대의 반응과 점수는 모두 데이터와 규칙으로 계산한다.
// 시나리오: { turns: [ { id?, skill, say: [[이름, 대사, 한국어?]], ask?, choices: [ { t, ko?, q: 'best'|'ok'|'poor', r: 상대 반응, fb: 피드백, go?: 턴 id | 'end' } ], rec?: true, back?: 턴 id } ], endings: { good, ok, bad } }
export const PTS = { best: 2, ok: 1, poor: 0 };
const MOOD = { best: 2, ok: 0, poor: -2 };

export function indexTurns(scn) {
  const idx = new Map();
  scn.turns.forEach((t, i) => { if (t.id) idx.set(t.id, i); });
  return idx;
}
// 복구 턴(rec)을 건너뛰고 다음 "본 줄기" 턴 번호를 찾는다
function nextMain(scn, from) {
  for (let i = from + 1; i < scn.turns.length; i++) if (!scn.turns[i].rec) return i;
  return scn.turns.length;
}

export function startRun(scn) { return { scn, at: 0, mood: 5, pts: 0, max: 0, log: [], done: false, skills: {} }; }

// 선택 처리. choice는 scn.turns[run.at].choices 중 하나(객체)여야 한다.
export function choose(run, choice) {
  if (run.done) throw new Error('이미 끝난 시뮬레이션');
  const turn = run.scn.turns[run.at];
  if (!turn.choices.includes(choice)) throw new Error('이 턴의 선택지가 아님');
  const p = PTS[choice.q];
  run.pts += p; run.max += 2;
  run.mood = Math.max(0, Math.min(10, run.mood + MOOD[choice.q]));
  const sk = run.skills[turn.skill] || (run.skills[turn.skill] = [0, 0]);
  sk[0] += p; sk[1] += 2;
  run.log.push({ turn: run.at, id: turn.id || null, choice, best: turn.choices.find((c) => c.q === 'best'), skill: turn.skill, q: choice.q });
  let next;
  if (choice.go === 'end') next = run.scn.turns.length;
  else if (choice.go) { const i = indexTurns(run.scn).get(choice.go); if (i == null) throw new Error('이동할 턴 없음: ' + choice.go); next = i; }
  else if (turn.rec && turn.back) { const i = indexTurns(run.scn).get(turn.back); next = i == null ? run.scn.turns.length : i; }
  else next = nextMain(run.scn, run.at);
  if (next >= run.scn.turns.length) { run.done = true; run.at = run.scn.turns.length; } else run.at = next;
  return run;
}

export function result(run) {
  const pct = run.max ? run.pts / run.max : 0;
  const tier = pct >= 0.8 ? 'good' : pct >= 0.5 ? 'ok' : 'bad';
  const stars = pct >= 0.85 ? 3 : pct >= 0.65 ? 2 : pct >= 0.45 ? 1 : 0;
  const skills = Object.fromEntries(Object.entries(run.skills).map(([k, [a, b]]) => [k, b ? a / b : 0]));
  const misses = run.log.filter((l) => l.q !== 'best');
  return { pct, tier, stars, skills, misses, ending: run.scn.endings[tier], moodEnd: run.mood };
}

// 모든 경로를 훑어 시나리오가 끝까지 도달하는지, 점수 범위가 올바른지 확인(검증용)
export function walkAll(scn, maxPaths = 20000) {
  let paths = 0, minPct = 1, maxPct = 0, maxLen = 0;
  const rec = (run) => {
    if (paths > maxPaths) return;
    if (run.done) { paths++; const r = result(run); minPct = Math.min(minPct, r.pct); maxPct = Math.max(maxPct, r.pct); maxLen = Math.max(maxLen, run.log.length); return; }
    for (const c of scn.turns[run.at].choices) {
      const copy = { ...run, log: run.log.slice(), skills: Object.fromEntries(Object.entries(run.skills).map(([k, v]) => [k, v.slice()])) };
      if (run.log.length > scn.turns.length + 4) throw new Error('무한 순환 의심');
      rec(choose(copy, c));
    }
  };
  rec(startRun(scn));
  return { paths, minPct, maxPct, maxLen };
}
