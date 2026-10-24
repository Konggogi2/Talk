import { h, toast } from './util.js';
import { store, levelOf } from './store.js';
import { TRACKS, TRACK, CHAPTERS, CH, SCENARIOS, SC, byTrack } from './data/index.js';
import { runSim } from './simui.js';
import { runPrice, runPkg } from './negoui.js';

const app = () => document.getElementById('app');
let tab = 'home';
let curTrack = 'neg';
let route = { name: 'tabs' };

export function go(name, p = {}) { route = { name, ...p }; render(); }
export function setTab(t) { tab = t; route = { name: 'tabs' }; render(); }
export function setTrack(t) { curTrack = t; }

export function render() {
  const a = app(); a.innerHTML = '';
  const t = store.s.settings.theme;
  if (t) document.documentElement.setAttribute('data-theme', t); else document.documentElement.removeAttribute('data-theme');
  const r = route;
  if (r.name === 'scn') return scnScreen(a, r.id);
  if (r.name === 'result') return resultScreen(a, r);
  tabsScreen(a);
}
function wrap(a) { const w = h('div', { style: { display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' } }); a.append(w); return w; }
const stars = (n) => '★'.repeat(n) + '☆'.repeat(3 - n);
const unlocked = (list, i) => store.s.settings.open || i === 0 || store.star(list[i - 1].id) >= 1;

// ---------- 자격 체크리스트 ----------
function checklist(trackId) {
  const list = byTrack(trackId), tr = TRACK[trackId];
  const good = list.filter((s) => store.star(s.id) >= 2).length;
  const need = trackId === 'neg' ? 10 : 13;
  const items = [];
  items.push({ t: `시나리오 ${list.length}개 중 ${need}개를 ★2 이상`, ok: good >= need, now: `${good}/${need}개` });
  if (trackId === 'neg') { const nm = list.filter((s) => s.kind !== 'branch'); const g2 = nm.filter((s) => store.star(s.id) >= 2).length; items.push({ t: `숫자 협상 ${nm.length}개를 모두 ★2 이상`, ok: g2 >= nm.length, now: `${g2}/${nm.length}개` }); }
  else { const en = list.filter((s) => s.lang === 'en'); const g2 = en.filter((s) => store.star(s.id) >= 2).length; items.push({ t: `영어 대화 ${en.length}개를 모두 ★2 이상`, ok: g2 >= en.length, now: `${g2}/${en.length}개` }); }
  const ks = Object.keys(tr.skills); const pcts = ks.map((k) => store.skillPct(k));
  const okSk = pcts.every((p) => p != null && p >= 0.7);
  items.push({ t: '모든 스킬의 누적 정답률 70% 이상', ok: okSk, now: ks.map((k, i) => `${tr.skills[k]} ${pcts[i] == null ? '–' : Math.round(pcts[i] * 100) + '%'}`).join(' · ') });
  return { items, all: items.every((i) => i.ok), done: items.filter((i) => i.ok).length };
}
function checklistCard(trackId) {
  const cl = checklist(trackId);
  const c = h('div', { class: 'card' }, h('h3', null, `🏅 ${TRACK[trackId].ko} 전문가 인증 (${cl.done}/${cl.items.length})`));
  cl.items.forEach((i) => c.append(h('div', { class: 'ck' + (i.ok ? ' ok' : '') }, h('span', null, i.ok ? '✅' : '⬜'), h('div', null, h('div', null, i.t), h('small', null, i.now)))));
  if (cl.all) c.append(h('div', { class: 'note2' }, '🎉 모든 조건을 달성했어요! 시뮬레이션에서 배운 틀을 실제 대화와 협상에서 쓸 준비가 되었어요.'));
  return c;
}
function skillCard(trackId) {
  const tr = TRACK[trackId];
  const c = h('div', { class: 'card' }, h('h3', null, '📊 나의 스킬 (누적)'));
  Object.entries(tr.skills).forEach(([k, label]) => { const p = store.skillPct(k); c.append(h('div', { class: 'mrow' }, h('span', null, label), h('div', { class: 'mbar' }, h('i', { style: { width: Math.round((p || 0) * 100) + '%', background: tr.color } })), h('b', null, p == null ? '–' : Math.round(p * 100) + '%'))); });
  return c;
}

// ---------- 탭 ----------
function tabsBar(a) {
  const mk = (id, ic, tx) => h('button', { class: tab === id ? 'on' : '', onclick: () => setTab(id) }, h('b', null, ic), tx);
  a.append(h('div', { class: 'tabs' }, mk('home', '🏠', '여정'), mk('skills', '📊', '스킬'), mk('notes', '📚', '개념'), mk('more', '⚙️', '더보기')));
}
function tabsScreen(a) {
  const scr = h('div', { class: 'scr' });
  a.append(scr);
  ({ home: homeTab, skills: skillsTab, notes: notesTab, more: moreTab }[tab] || homeTab)(scr);
  tabsBar(a);
}

function trackSwitch() {
  return h('div', { class: 'seg' }, TRACKS.map((t) => h('button', { class: curTrack === t.id ? 'on' : '', style: curTrack === t.id ? { background: t.color } : null, onclick: () => { curTrack = t.id; setTab(tab); } }, t.icon + ' ' + t.ko)));
}
const TIPS = {
  neg: ['협상 전에 BATNA(대안)를 키우세요. 협상력은 테이블 앞에서 시작되지 않아요.', '입장 뒤의 이해관계를 먼저 물으세요. "왜 그게 중요하세요?"', '양보는 if-then으로: "~해 주시면 ~하겠습니다."', '첫 숫자는 기준점이에요. 근거 있는 앵커를 준비하세요.', '압박에는 질문으로 시간을 확보하세요.'],
  conv: ['반영: 상대의 말과 감정을 내 말로 되돌려 주세요.', '닫힌 질문보다 "어떻게/무엇/기억나는 건?"', '대답 속 단어를 잡아 후속 질문하면 인터뷰가 대화가 돼요.', '농담이 실패하면 빨리 인정하고 사과하세요.', '거절은 따뜻한 시작 + 분명한 거절 + 대안이에요.'],
};
function homeTab(scr) {
  const s = store.s, lv = levelOf(s.xp), tr = TRACK[curTrack];
  const prog = Math.min(100, Math.round((store.todayXp() / s.goal) * 100));
  scr.append(h('div', { class: 'stats' },
    h('div', { class: 'chip' }, h('b', null, '🔥 ' + store.streakNow()), '연속 학습일'),
    h('div', { class: 'chip' }, h('b', null, '⭐ ' + s.xp), '총 XP'),
    h('div', { class: 'chip' }, h('b', null, lv.icon + ' Lv.' + (lv.idx + 1)), lv.name)));
  scr.append(h('div', { class: 'goal' }, h('div', { style: { display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 800 } }, h('span', null, '오늘의 목표'), h('span', null, `${Math.min(store.todayXp(), s.goal)} / ${s.goal} XP`)), h('div', { class: 'bar' }, h('i', { style: { width: prog + '%' } }))));
  scr.append(trackSwitch());
  scr.append(h('div', { class: 'mascot' }, h('div', { class: 'm' }, tr.mentor.emoji), h('div', { class: 't' }, h('b', null, tr.mentor.name + ' · ' + tr.mentor.role), h('br'), TIPS[curTrack][new Date().getDate() % TIPS[curTrack].length])));
  scr.append(skillCard(curTrack), checklistCard(curTrack));
  const list = byTrack(curTrack);
  CHAPTERS.filter((c) => c.track === curTrack).forEach((ch, ci) => {
    const nodes = list.filter((n) => n.ch === ch.id);
    scr.append(h('div', { class: 'sect', style: { background: ch.color } }, h('span', null, `Chapter ${ci + 1} · ${ch.title}`), h('small', null, nodes.length + '개 시뮬레이션')));
    scr.append(h('div', { class: 'scene' }, h('div', { class: 'tx' }, ch.story)));
    const path = h('div', { class: 'path' });
    nodes.forEach((n, k) => {
      const gi = list.indexOf(n), open = unlocked(list, gi), st = store.star(n.id);
      const off = [0, 46, 0, -46][k % 4];
      const kindIcon = n.kind === 'price' ? '💹' : n.kind === 'pkg' ? '📦' : n.emoji;
      const node = h('button', { class: 'node' + (st >= 2 ? ' done' : open ? '' : ' lock') + (n.kind !== 'branch' ? ' cp' : ''), style: open && st < 2 ? { background: ch.color } : null, onclick: () => { if (!open) { toast('앞 단계를 먼저 클리어해 주세요 (★1 이상)'); return; } go('scn', { id: n.id }); } }, open ? n.emoji : '🔒', st >= 3 ? h('span', { class: 'crown' }, '👑') : null);
      path.append(h('div', { style: { transform: `translateX(${off}px)`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' } }, node, h('div', { class: 'nlabel' }, h('b', null, n.title), open ? (n.kind === 'branch' ? '' : '🔢 숫자 협상 · ') + stars(st) : '')));
    });
    scr.append(path);
  });
}

function skillsTab(scr) {
  scr.append(h('div', { class: 'hd' }, h('h2', null, '스킬 리포트')));
  TRACKS.forEach((t) => {
    scr.append(h('h3', { style: { margin: '10px 4px' } }, t.icon + ' ' + t.ko), skillCard(t.id));
    const rows = byTrack(t.id).filter((s) => store.s.best[s.id] != null);
    if (rows.length) scr.append(h('div', { class: 'card' }, h('h3', null, '최고 점수'), rows.map((s) => h('div', { class: 'wrow' }, h('div', { class: 'w' }, h('div', { class: 'tl' }, s.emoji + ' ' + s.title), h('div', { class: 'ko' }, stars(store.star(s.id)))), h('b', null, store.s.best[s.id] + '점')))));
    scr.append(checklistCard(t.id));
  });
}

const NOTES = [
  { h: '🤝 협상 핵심 틀', b: '<ul><li><b>이해관계 vs 입장</b>: 입장은 "무엇을", 이해관계는 "왜". 이유를 알아야 대안이 생겨요.</li><li><b>BATNA</b>: 합의가 안 될 때의 최선의 대안. 협상력의 원천이에요. 협상 전에 키우세요.</li><li><b>ZOPA</b>: 합의 가능 구간(상대 한계선과 내 BATNA 사이).</li><li><b>앵커링</b>: 첫 숫자가 기준점이 돼요. 근거 있는 앵커로 시작하고, 상대의 낮은 앵커는 "수용 X, 기준 바꾸기".</li><li><b>양보</b>: 점점 작게, if-then으로, 상대의 양보에 맞춰.</li><li><b>로그롤링</b>: 우선순위가 다른 항목을 맞바꿔 파이를 키워요.</li><li><b>객관적 기준</b>: 시장 가격, 사례, 전문가 기준.</li></ul>' },
  { h: '🎯 협상 준비 체크리스트', b: '<ol><li>내 이해관계 3가지와 상대의 예상 이해관계</li><li>내 BATNA와 상대의 BATNA 추정</li><li>목표값 · 한계선(reservation) · 첫 제안(앵커)</li><li>줄 수 있는 것과 받고 싶은 것의 목록(교환 카드)</li><li>객관적 근거 자료</li><li>합의 후 서면 확인 방법</li></ol>' },
  { h: '🗣️ 압박과 어려운 상대', b: '<ul><li><b>시간 압박</b>: 이유를 묻고 시간을 확보. "마감의 이유를 알려 주실 수 있나요?"</li><li><b>낮은 제안</b>: 침묵 + 미러링 + 열린 질문. "어떻게 그 숫자를 정하셨나요?"</li><li><b>레이블링</b>: "범위가 늘어서 걱정되시는 것 같네요."</li><li><b>교정형 질문</b>: "어떻게/무엇"으로 상대가 문제를 같이 풀게 해요. "왜"는 방어를 부를 수 있어요.</li></ul>' },
  { h: '👂 경청과 질문', b: '<ul><li><b>반영</b>: 상대의 내용 + 감정을 내 말로. "다 보는 앞에서 지적받아서 창피했겠다."</li><li><b>해결책은 나중에</b>: 먼저 "지금은 들어 줄까, 같이 해결할까?"</li><li><b>열린 질문</b>: 어떻게·무엇·기억나는 건·어떤 점이</li><li><b>후속 질문</b>: 대답 속 단어를 잡아 이어 가기</li><li>피하기: 축소("별거 아냐"), 평가, 내 이야기로 전환, "그래도"</li></ul>' },
  { h: '☕ 스몰토크·이야기·유머', b: '<ul><li><b>시작</b>: 이름 + 상황 공유 + 쉬운 질문. <b>이어 가기</b>: ask-offer 균형. <b>끝내기</b>: 이유 + 즐거움 + 후속.</li><li><b>FORD</b>: Family, Occupation, Recreation, Dreams — 안전한 주제 틀.</li><li><b>이야기</b>: 결과의 궁금증 → 디테일 → 반전/감정 → 한마디. 청중을 질문으로 초대.</li><li><b>유머</b>: 듣는 사람이 웃어야 성공. 실패하면 인정·사과 → 자기 풍자로 전환.</li></ul>' },
  { h: '🧩 어려운 대화', b: '<ul><li><b>거절</b>: 따뜻한 시작 + 분명한 거절 + 짧은 이유 + 대안</li><li><b>피드백(SBI)</b>: 상황 + 행동 + 영향을 사실로, 호기심으로 마무리</li><li><b>사과</b>: 구체적 행동 + 영향 + 책임(변명 없음) + 회복 약속. "미안한데", "~했다면"은 금지</li></ul>' },
  { h: '🎙️ 회의·메신저·영어', b: '<ul><li>회의: 결론 + 이유 한 줄로 끼어들기, 합의/쟁점/다음 행동(담당·기한)으로 요약</li><li>메신저: 짧은 말은 한 줄(기한·톤)을 더하고, 오해가 커지면 통화로</li><li>영어: <i>Sorry, could you repeat…? / Just to make sure I understand… / Sorry to jump in, but… / What would it take to…? / I\'d love to help, but my plate is full.</i></li></ul>' },
  { h: '📖 참고한 일반 프레임워크', b: '<p class="small">원칙적 협상(Fisher & Ury, <i>Getting to Yes</i>), 전술적 공감(Voss, <i>Never Split the Difference</i>), 중요한 대화(Patterson 외, <i>Crucial Conversations</i>), SBI 피드백(Center for Creative Leadership)의 널리 알려진 개념을 학습용으로 요약했어요. 원문을 직접 읽어 보길 권해요. 이 앱의 시뮬레이션은 연습용이며 실제 상황의 결과를 보장하지 않아요.</p>' },
];
function notesTab(scr) {
  scr.append(h('div', { class: 'hd' }, h('h2', null, '개념 정리')));
  NOTES.forEach((n) => scr.append(h('details', { class: 'card gram' }, h('summary', { style: { fontWeight: 800, fontSize: '16px' } }, n.h), h('div', { html: n.b }))));
}

function moreTab(scr) {
  const s = store.s, lv = levelOf(s.xp);
  scr.append(h('div', { class: 'hd' }, h('h2', null, '더보기')));
  scr.append(h('div', { class: 'card' }, h('h3', null, '내 기록'), h('div', { style: { fontSize: '14px', lineHeight: 1.8 } }, `레벨 ${lv.icon} ${lv.name}${lv.next ? ` (다음 레벨까지 ${lv.next} XP)` : ''}`, h('br'), `총 XP ${s.xp} · 최고 연속 ${s.bestStreak || 0}일 · 시뮬레이션 ${s.runs}회`, h('br'), `시나리오 ${SCENARIOS.length}개 (협상 ${byTrack('neg').length} · 대화 ${byTrack('conv').length})`)));
  scr.append(h('div', { class: 'card' }, h('h3', null, '학습 설정'),
    h('div', { class: 'switch' }, h('span', null, '하루 목표'), (() => { const sel = h('select', { onchange: () => { s.goal = +sel.value; store.save(); } }, [30, 60, 100, 150].map((n) => h('option', { value: n, selected: s.goal === n }, n + ' XP'))); return sel; })()),
    h('label', { class: 'switch' }, h('span', null, '영어 시나리오에 한국어 해석 표시'), h('input', { type: 'checkbox', checked: s.settings.showKo, onchange: (e) => { s.settings.showKo = e.target.checked; store.save(); } })),
    h('label', { class: 'switch' }, h('span', null, '모든 단계 열어 두기'), h('input', { type: 'checkbox', checked: s.settings.open, onchange: (e) => { s.settings.open = e.target.checked; store.save(); } })),
    h('div', { class: 'switch' }, h('span', null, '화면 색'), (() => { const sel = h('select', { onchange: () => { s.settings.theme = sel.value; store.save(); render(); } }, [['', '자동'], ['light', '밝게'], ['dark', '어둡게']].map(([v, t]) => h('option', { value: v, selected: s.settings.theme === v }, t))); return sel; })())));
  scr.append(h('div', { class: 'warn' }, '상대의 반응과 점수는 모두 미리 정한 규칙과 수치로 계산돼요(AI·서버 없음). 실제 사람은 더 다양하게 반응해요. 이 앱은 연습용 시뮬레이션이며, 중요한 협상·법률·의료 판단을 대신하지 않아요.'));
  scr.append(h('button', { class: 'btn bad', onclick: () => { if (confirm('모든 진도를 지울까요? 되돌릴 수 없어요.')) { store.reset(); render(); toast('초기화했어요'); } } }, '진도 초기화'));
}

// ---------- 시나리오 실행 / 결과 ----------
function scnScreen(a, id) {
  const scn = SC[id], w = wrap(a);
  const back = () => setTab('home');
  const fin = (r) => { store.record(id, { stars: r.stars, score: r.score, skills: r.skills }); store.addXp(r.xp); go('result', { id, r }); };
  const common = { scn, onExit: back, onFinish: fin };
  if (scn.kind === 'price') return runPrice(w, common);
  if (scn.kind === 'pkg') return runPkg(w, common);
  return runSim(w, common);
}
function resultScreen(a, r) {
  const scn = SC[r.id], res = r.r;
  const scr = h('div', { class: 'scr nonav' });
  const msg = res.stars === 3 ? ['완벽해요!', '🎉'] : res.stars === 2 ? ['잘했어요!', '😊'] : res.stars === 1 ? ['클리어! 한 번 더 하면 별이 늘어요', '💪'] : ['한 번 더 도전해 봐요', '📘'];
  scr.append(h('div', { class: 'result' }, h('div', { class: 'big' }, msg[1]), h('h2', { style: { margin: '8px 0' } }, msg[0]), h('div', { class: 'stars', style: { fontSize: '40px', color: '#e8a410' } }, stars(res.stars)),
    h('div', { class: 'xp' }, h('div', null, h('b', null, '+' + res.xp), 'XP'), h('div', null, h('b', null, res.score + '점'), '점수'), h('div', null, h('b', null, '🔥' + store.streakNow()), '연속'))));
  scr.append(h('button', { class: 'btn pri', style: { marginBottom: '10px' }, onclick: () => go('scn', { id: r.id }) }, '다시 도전'));
  scr.append(h('button', { class: 'btn', onclick: () => { curTrack = CH[scn.ch].track; setTab('home'); } }, '여정으로'));
  a.append(scr);
}
