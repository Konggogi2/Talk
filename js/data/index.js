import { NEG_BRANCH } from './neg_branch.js';
import { NEG_NUM } from './neg_num.js';
import { CONV_A } from './conv_a.js';
import { CONV_B } from './conv_b.js';
import { CONV_C } from './conv_c.js';
import { TUNE } from './tune.js';
import { BEST, TUNE_EXTRA } from './tune2.js';
import { BEST3, EXTRA3 } from './tune3.js';

export const TRACKS = [
  { id: 'neg', ko: '협상', en: 'Negotiation', icon: '🤝', color: '#d9534f', skills: { info: '정보 탐색', prep: '준비·BATNA', value: '가치 창출', firm: '단호함·앵커', rel: '관계·마무리' }, mentor: { name: 'Coach Reed', emoji: '🦅', role: '협상 코치' } },
  { id: 'conv', ko: '대화 기술', en: 'Conversation', icon: '💬', color: '#1a9a8a', skills: { listen: '경청·반영', ask: '질문', empathy: '공감', clear: '명료·솔직', flow: '분위기·흐름' }, mentor: { name: 'Coach Lumi', emoji: '🦉', role: '대화 코치' } },
];
export const TRACK = Object.fromEntries(TRACKS.map((t) => [t.id, t]));

export const CHAPTERS = [
  { id: 'n1', track: 'neg', title: '입장 말고 이해관계', color: '#d9534f', story: '협상은 "무엇을 원하는가"가 아니라 "왜 원하는가"에서 시작해요. 같은 방을 두고 다투는 상황에서 이유를 묻는 연습을 해요.' },
  { id: 'n2', track: 'neg', title: 'BATNA와 ZOPA', color: '#e0703f', story: '내 협상력은 대안(BATNA)에서 나와요. 중고 노트북 거래로 합의 가능 구간(ZOPA)을 감으로 느끼고, 공급업체의 가격 인상에 맞서 대안을 준비해요.' },
  { id: 'n3', track: 'neg', title: '앵커링과 첫 제안', color: '#c0527a', story: '처음 나온 숫자는 이후 모든 흥정의 기준이 돼요. 내가 먼저 앵커를 던지는 법, 상대의 낮은 앵커에 끌려가지 않는 법을 익혀요.' },
  { id: 'n4', track: 'neg', title: '양보와 교환', color: '#7a62d6', story: '양보는 공짜가 아니에요. 항목마다 우선순위가 다른 점을 이용해 파이를 키우는 로그롤링을 해 보아요.' },
  { id: 'n5', track: 'neg', title: '어려운 상대와 연봉', color: '#2f6fd7', story: '시간 압박, 낮은 첫 제안, 영어 협상, 그리고 연봉 협상. 압박 속에서 질문과 근거로 대응하는 실전 단계예요.' },
  { id: 'k1', track: 'conv', title: '경청과 반영', color: '#1a9a8a', story: '편한 대화의 출발은 "잘 들어 주는 사람"이에요. 상대의 감정과 내용을 되돌려 주는 반영 연습을 해요.' },
  { id: 'k2', track: 'conv', title: '질문의 기술', color: '#2f9bd7', story: '질문은 대화의 엔진이에요. 닫힌 질문과 열린 질문, 후속 질문으로 어색한 침묵을 이야기로 바꿔요.' },
  { id: 'k3', track: 'conv', title: '스몰토크와 친밀감', color: '#4caf6b', story: '낯선 사람과 시작하고, 이어 가고, 우아하게 끝내는 스몰토크. 가벼운 대화가 관계의 문을 열어요.' },
  { id: 'k4', track: 'conv', title: '이야기·유머·분위기', color: '#f0a020', story: '재미있게 이야기하고, 농담이 실패했을 때 분위기를 되돌리는 법을 연습해요.' },
  { id: 'k5', track: 'conv', title: '어려운 대화', color: '#c0527a', story: '거절, 피드백, 사과처럼 불편한 대화도 편한 대화의 연장이에요. 관계를 지키며 솔직하게 말하는 법을 배워요.' },
  { id: 'k6', track: 'conv', title: '회의와 메신저', color: '#7a62d6', story: '회의에서 한 번에 이해시키는 발언, 그리고 글로 인한 오해를 푸는 법을 연습해요.' },
  { id: 'k7', track: 'conv', title: '영어로 대화하기', color: '#2f6fd7', story: '영어 스몰토크, 회의에서 되묻고 끼어들기, 정중한 거절. 영어 장면에서 쓰는 틀을 익혀요. (한국어 해석 보기 가능)' },
];
export const CH = Object.fromEntries(CHAPTERS.map((c) => [c.id, c]));

// 선택지 길이 균형(tune.js): 무난·미흡 선택지를 모범 선택지와 비슷한 수준으로 구체화
function tune(list) {
  list.forEach((sc) => { const bs = { ...(BEST[sc.id] || {}), ...(BEST3[sc.id] || {}) }; Object.entries(bs).forEach(([i, v]) => { const c = sc.turns[+i].choices.find((x) => x.q === 'best'); if (Array.isArray(v)) { c.t = v[0]; c.ko = v[1]; } else c.t = v; }); const t = { ...(TUNE[sc.id] || {}), ...(TUNE_EXTRA[sc.id] || {}), ...(EXTRA3[sc.id] || {}) }; if (!Object.keys(t).length) return; Object.entries(t).forEach(([i, pair]) => { const turn = sc.turns[+i]; ['ok', 'poor'].forEach((q, k) => { const c = turn.choices.find((x) => x.q === q); const v = pair[k]; if (Array.isArray(v)) { c.t = v[0]; c.ko = v[1]; } else c.t = v; }); }); });
  return list;
}
export const SCENARIOS = [
  ...tune(NEG_BRANCH).map((s) => ({ ...s, kind: 'branch' })),
  ...NEG_NUM.map((s) => ({ ...s, kind: s.type === 'pkg' ? 'pkg' : 'price' })),
  ...tune(CONV_A).map((s) => ({ ...s, kind: 'branch' })),
  ...tune(CONV_B).map((s) => ({ ...s, kind: 'branch' })),
  ...tune(CONV_C).map((s) => ({ ...s, kind: 'branch' })),
].sort((a, b) => CHAPTERS.findIndex((c) => c.id === a.ch) - CHAPTERS.findIndex((c) => c.id === b.ch) || (a.id < b.id ? -1 : 1));
export const SC = Object.fromEntries(SCENARIOS.map((s) => [s.id, s]));
export const byTrack = (t) => SCENARIOS.filter((s) => CH[s.ch].track === t);
