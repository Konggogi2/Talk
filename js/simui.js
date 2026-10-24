// 분기 대화 시뮬레이션 화면
import { h, shuffle, confetti } from './util.js';
import { store } from './store.js';
import { startRun, choose, result } from './sim.js';
import { TRACK, CH } from './data/index.js';

const QL = { best: ['👍 모범', 'best'], ok: ['🙂 무난', 'ok'], poor: ['⚠️ 아쉬움', 'poor'] };
const moodFace = (m) => (m <= 2 ? '😠' : m <= 4 ? '😟' : m === 5 ? '😐' : m <= 7 ? '🙂' : '😊');

function bubble(who, text, ko, side, showKo) {
  if (!who) return h('div', { class: 'narr' }, text);
  return h('div', { class: 'bub ' + side }, h('div', { class: 'bn' }, who), h('div', { class: 'bt' }, text), ko && showKo ? h('div', { class: 'bko' }, ko) : null);
}

export function runSim(root, { scn, onExit, onFinish }) {
  const run = startRun(scn);
  const tr = TRACK[CH[scn.ch].track];
  let showKo = store.s.settings.showKo;
  root.innerHTML = '';
  const hd = h('div', { class: 'hd', style: { padding: 'calc(var(--safe-t) + 12px) 16px 0' } }, h('button', { class: 'back', onclick: () => { if (run.log.length === 0 || confirm('나가면 이번 시도는 저장되지 않아요. 나갈까요?')) onExit(); } }, '←'), h('h2', null, scn.emoji + ' ' + scn.title));
  const moodEl = h('div', { class: 'mood' }, moodFace(run.mood));
  const koBtn = scn.lang === 'en' ? h('button', { class: 'btn sm', onclick: () => { showKo = !showKo; store.s.settings.showKo = showKo; store.save(); paint(); } }, '해석') : null;
  hd.append(koBtn || '', moodEl);
  const scr = h('div', { class: 'scr nonav' });
  root.append(hd, scr);
  let started = false, pending = null, transcript = [];

  function intro() {
    scr.innerHTML = '';
    scr.append(h('div', { class: 'scene' }, h('div', { class: 'pl' }, scn.partner.emoji + ' ' + scn.partner.name + ' · ' + scn.partner.traits), h('div', { class: 'tx' }, scn.setting)));
    scr.append(h('div', { class: 'card' }, h('h3', null, '🎓 이번 연습의 핵심'), scn.brief.map((b) => h('div', { class: 'small', style: { margin: '6px 0' } }, '• ' + b))));
    scr.append(h('div', { class: 'small', style: { margin: '6px 4px 10px' } }, `선택마다 상대가 반응하고, 신뢰(얼굴)가 달라져요. 끝나면 스킬별 결과와 더 나은 선택을 알려 줘요. (${scn.turns.filter((t) => !t.rec).length}번의 선택)`));
    scr.append(h('button', { class: 'btn teal', onclick: () => { started = true; paint(); } }, '시작하기'));
  }

  function paint() {
    if (!started) return intro();
    scr.innerHTML = '';
    moodEl.textContent = moodFace(run.mood);
    const chat = h('div', { class: 'chat' });
    transcript.forEach((t) => chat.append(...t));
    scr.append(chat);
    if (pending) {
      // 선택 직후: 상대 말, 내 말, 상대 반응, 피드백
      const c = pending.choice, turn = pending.turn;
      const cur = [...turn.say.map(([w, t, ko]) => bubble(w, t, ko, 'them', showKo)), bubble('나', c.t, c.ko, 'me', showKo)];
      if (c.r) cur.push(bubble(scn.partner.name, c.r, null, 'them', false));
      scr.append(h('div', { class: 'chat' }, ...cur));
      const [lab, cls] = QL[c.q];
      scr.append(h('div', { class: 'fbk ' + cls }, h('div', { class: 'fh' }, h('b', null, lab), h('span', null, '신뢰 ' + moodFace(run.mood))), h('div', { class: 'ft' }, c.fb),
        c.q !== 'best' && pending.best ? h('div', { class: 'fbest' }, h('b', null, '더 나은 선택: '), pending.best.t) : null));
      scr.append(h('button', { class: 'btn pri', style: { marginTop: '10px' }, onclick: () => { transcript.push(cur); pending = null; paint(); } }, run.done ? '결과 보기' : '다음'));
      scr.scrollTop = scr.scrollHeight;
      return;
    }
    if (run.done) return finish();
    const turn = scn.turns[run.at];
    window.__turn = turn;
    const cur = h('div', { class: 'chat' });
    turn.say.forEach(([w, t, ko]) => cur.append(bubble(w, t, ko, 'them', showKo)));
    scr.append(cur);
    scr.append(h('div', { class: 'ask' }, turn.ask));
    const opts = h('div', { class: 'opts' });
    shuffle(turn.choices).forEach((c, k) => opts.append(h('button', { class: 'opt', onclick: () => pick(c) }, h('span', { class: 'ol' }, String.fromCharCode(65 + k)), h('span', { class: 'ot' }, c.t, c.ko && showKo ? h('small', { class: 'cko' }, c.ko) : null))));
    scr.append(opts);
    scr.scrollTop = scr.scrollHeight;
  }
  function pick(c) {
    const turn = scn.turns[run.at];
    const best = turn.choices.find((x) => x.q === 'best');
    choose(run, c);
    pending = { choice: c, best, turn };
    window.__run = run;
    paint();
  }
  function finish() {
    const r = result(run);
    const sc = h('div');
    sc.append(h('div', { class: 'result' }, h('div', { class: 'big' }, r.tier === 'good' ? '🎉' : r.tier === 'ok' ? '🙂' : '📘'), h('h2', { style: { margin: '8px 0' } }, r.tier === 'good' ? '훌륭해요!' : r.tier === 'ok' ? '괜찮았어요' : '다시 도전해 볼까요?'),
      h('div', { class: 'stars', style: { fontSize: '36px', color: '#e8a410' } }, '★'.repeat(r.stars) + '☆'.repeat(3 - r.stars)), h('div', { class: 'score' }, Math.round(r.pct * 100) + '점')));
    sc.append(h('div', { class: 'card' }, h('h3', null, '🎬 결말'), h('div', { style: { fontSize: '14.5px', lineHeight: 1.7 } }, r.ending)));
    const sk = h('div', { class: 'card' }, h('h3', null, '📊 스킬별 결과'));
    Object.entries(r.skills).forEach(([k, v]) => sk.append(h('div', { class: 'mrow' }, h('span', null, tr.skills[k] || k), h('div', { class: 'mbar' }, h('i', { style: { width: Math.round(v * 100) + '%', background: tr.color } })), h('b', null, Math.round(v * 100) + '%'))));
    sc.append(sk);
    if (r.misses.length) {
      const ms = h('div', { class: 'card' }, h('h3', null, '🔍 다시 보기'));
      r.misses.forEach((l) => ms.append(h('div', { class: 'miss' }, h('div', { class: 'small' }, `[${tr.skills[l.skill] || l.skill}]`), h('div', { class: 'mine' }, '내 선택: ' + l.choice.t), l.best ? h('div', { class: 'good' }, '모범: ' + l.best.t) : null, h('div', { class: 'small' }, l.choice.fb))));
      sc.append(ms);
    }
    sc.append(h('div', { class: 'card' }, h('h3', null, '📌 기억할 것'), scn.takeaway.map((t) => h('div', { class: 'small', style: { margin: '4px 0' } }, '• ' + t))));
    sc.append(h('div', { class: 'row' }, h('button', { class: 'btn', onclick: () => runSim(root, { scn, onExit, onFinish }) }, '다시 도전'), h('button', { class: 'btn pri', onclick: () => { if (r.stars === 3) confetti(); onFinish({ stars: r.stars, score: Math.round(r.pct * 100), skills: run.skills, xp: 20 + Math.round(r.pct * 60) }); } }, '저장하고 나가기')));
    scr.append(sc);
    window.__result = r;
  }
  paint();
  window.__sim = { run, scn, pick, get pending() { return pending; }, next: () => { const b = scr.querySelector('.btn.pri'); b && b.click(); } };
}
