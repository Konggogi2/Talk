// 숫자 협상 시뮬레이터 화면 (단일 이슈 가격·연봉, 다중 이슈 패키지)
import { h, toast, confetti } from './util.js';
import * as N from './nego.js';

const face = (m) => (m <= 2 ? '😠' : m <= 4 ? '😟' : m === 5 ? '😐' : m <= 7 ? '🙂' : '😊');
const fmt = (v, u) => `${Math.round(v * 10) / 10}${u}`;

function partnerLine(note, p, u, name) {
  const P = fmt(p, u);
  return {
    ok: `${name}: 음, 그렇다면 ${P}까지는 맞춰 볼 수 있어요.`, reciprocal: `${name}: 양보해 주셔서 저도 ${P}로 조정할게요.`, nochange: `${name}: 제안이 그대로라서… 저는 ${P}에서 조금만 움직일게요.`,
    beyond: `${name}: 그건 저희가 받아들이기 어려운 수준이에요. 지금은 ${P}가 최선이에요.`, insult: `${name}: 그 제안은 진지하게 받아들이기 어렵네요. 저희 입장은 ${P}예요.`, accept: `${name}: 좋아요, 그 조건으로 하죠!`, partner_walk: `${name}: 더 이상 이야기가 어렵겠네요. 오늘은 여기까지 하죠.`,
  }[note] || `${name}: ${P}입니다.`;
}

// ---------- 단일 이슈 ----------
export function runPrice(root, { scn, onExit, onFinish }) {
  const cfg = scn.cfg, u = cfg.unit;
  const st = N.startNego(cfg);
  const log = [{ who: 'p', text: `${scn.partner.name}: 저희 입장은 ${fmt(cfg.open, u)}입니다.` }];
  let done = false;
  const usedAsks = new Set();
  root.innerHTML = '';
  const hd = h('div', { class: 'hd', style: { padding: 'calc(var(--safe-t) + 12px) 16px 0' } }, h('button', { class: 'back', onclick: () => { if (st.offers === 0 || done || confirm('나가면 이번 협상은 저장되지 않아요. 나갈까요?')) onExit(); } }, '←'), h('h2', null, scn.emoji + ' ' + scn.title));
  const scr = h('div', { class: 'scr nonav' });
  root.append(hd, scr);
  const status = h('div', { class: 'card nstat' });
  const chat = h('div', { class: 'chat' });
  const actions = h('div');
  const out = h('div');
  const slider = h('input', { type: 'range', class: 'slider', min: cfg.min, max: cfg.max, step: Math.max(1, Math.round((cfg.max - cfg.min) / 300)), value: Math.round((cfg.b + cfg.open) / 2) });
  const sval = h('b', null, '');
  slider.addEventListener('input', () => { sval.textContent = fmt(+slider.value, u); });

  function paint() {
    status.innerHTML = '';
    status.append(h('div', { class: 'srow2' }, h('div', null, h('small', null, '상대의 현재 입장'), h('div', { class: 'big2' }, fmt(st.p, u))), h('div', null, h('small', null, '라운드'), h('div', { class: 'big2' }, `${Math.min(st.offers + (st.done ? 0 : 1), cfg.rounds)}/${cfg.rounds}`)), h('div', null, h('small', null, '상대의 분위기'), h('div', { class: 'big2' }, face(st.mood)))));
    status.append(h('div', { class: 'small' }, `내 역할: ${cfg.youAre} · 내 BATNA: ${cfg.bLabel}`));
    chat.innerHTML = '';
    log.forEach((l) => chat.append(h('div', { class: 'bub ' + (l.who === 'me' ? 'me' : l.who === 'p' ? 'them' : 'sys') }, h('div', { class: 'bt' }, l.text))));
    actions.innerHTML = '';
    if (st.done) return finish();
    sval.textContent = fmt(+slider.value, u);
    if (!st.final) actions.append(h('div', { class: 'card' }, h('h3', null, '💬 제안하기'), h('div', { class: 'small' }, '내 제안 값'), h('div', { style: { display: 'flex', justifyContent: 'space-between', margin: '4px 0' } }, h('small', null, fmt(cfg.min, u)), sval, h('small', null, fmt(cfg.max, u))), slider,
      h('button', { class: 'btn teal', style: { marginTop: '8px' }, onclick: doOffer }, '이 값으로 제안')));
    const tools = h('div', { class: 'card' }, h('h3', null, '🧰 다른 행동'));
    const row = (label, fn, dis, cls) => h('button', { class: 'btn sm' + (cls ? ' ' + cls : ''), disabled: dis, style: { margin: '4px 4px 0 0' }, onclick: fn }, label);
    cfg.asks.forEach((a, i) => tools.append(row('❓ ' + a.q, () => { const r = N.ask(st, i); if (!r) { toast('질문은 두 번까지만 할 수 있어요'); return; } usedAsks.add(i); log.push({ who: 'me', text: '나: ' + r.q }, { who: 'p', text: `${scn.partner.name}: ${r.a}` }); paint(); }, st.asks >= 2 || usedAsks.has(i))));
    if (st.critUsed == null) cfg.criteria.forEach((c, i) => tools.append(row('📊 ' + c.text, () => { const r = N.useCriteria(st, i); log.push({ who: 'me', text: '나: ' + c.text }, { who: 'sys', text: (r.valid ? '✅ ' : '⚠️ ') + r.fb }); paint(); })));
    if (!st.batnaUsed) { tools.append(row('🧭 ' + cfg.batnaText, () => { N.mentionBatna(st, true); log.push({ who: 'me', text: '나: ' + cfg.batnaText }, { who: 'sys', text: '대안을 사실대로 알렸어요. 약간의 협상력이 생겨요.' }); paint(); })); tools.append(row('🎭 (없는) 더 좋은 대안이 있다고 부풀려 말하기', () => { N.mentionBatna(st, false); log.push({ who: 'me', text: '나: 사실 훨씬 좋은 제안이 따로 있어요.' }, { who: 'sys', text: '⚠️ 상대는 과장을 눈치챘어요. 신뢰가 떨어졌어요.' }); paint(); }, false, 'trap')); }
    tools.append(row(`✅ 상대 입장(${fmt(st.p, u)})으로 합의`, () => { N.accept(st); log.push({ who: 'me', text: `나: 좋아요, ${fmt(st.p, u)}로 하죠.` }); paint(); }, false));
    tools.append(row('🚪 협상 종료(떠나기)', () => { if (confirm('합의 없이 떠나면 BATNA로 돌아가요. 떠날까요?')) { N.walk(st); log.push({ who: 'sys', text: '협상을 종료했어요.' }); paint(); } }));
    actions.append(tools);
    if (st.final) actions.append(h('div', { class: 'warn' }, '마지막 라운드까지 왔어요. 상대의 마지막 입장을 받아들이거나 떠나야 해요.'));
    scr.scrollTop = scr.scrollHeight;
  }
  function doOffer() {
    if (st.final) { toast('마지막 라운드예요. 합의하거나 떠나세요'); return; }
    const o = +slider.value;
    log.push({ who: 'me', text: `나: ${fmt(o, u)}에 하면 어떨까요?` });
    const before = st.p;
    const r = N.offer(st, o);
    if (r.accepted) { log.push({ who: 'p', text: partnerLine('accept', st.deal, u, scn.partner.name) }); if (cfg.dir * o < cfg.dir * before - 1e-9) log.push({ who: 'sys', text: `💡 상대는 이미 ${fmt(before, u)}까지 양보해 있었어요. 제 제안이 상대 입장보다 불리해서 더 좋은 값을 놓쳤어요.` }); }
    else log.push({ who: 'p', text: partnerLine(r.note, st.p, u, scn.partner.name) });
    paint();
  }
  function finish() {
    if (done) return; done = true;
    const s = N.summarize(st);
    window.__nego = { st, s };
    const lo = Math.min(...s.zopa, cfg.open, st.deal == null ? cfg.open : st.deal) - (cfg.max - cfg.min) * 0.04, hi = Math.max(...s.zopa, cfg.open, st.deal == null ? cfg.open : st.deal) + (cfg.max - cfg.min) * 0.04;
    const pos = (v) => ((v - lo) / (hi - lo)) * 100;
    const bar = h('div', { class: 'zbar' }, h('div', { class: 'zopa', style: { left: pos(s.zopa[0]) + '%', width: pos(s.zopa[1]) - pos(s.zopa[0]) + '%' } }, 'ZOPA'),
      h('div', { class: 'mk open', style: { left: pos(cfg.open) + '%' } }, h('small', null, '상대 시작')),
      h('div', { class: 'mk batna', style: { left: pos(cfg.b) + '%' } }, h('small', null, '내 BATNA')),
      h('div', { class: 'mk rsv', style: { left: pos(cfg.r) + '%' } }, h('small', null, '상대 한계')),
      st.deal != null ? h('div', { class: 'mk deal', style: { left: pos(st.deal) + '%' } }, h('small', null, '합의')) : null);
    out.innerHTML = '';
    out.append(h('div', { class: 'result' }, h('div', { class: 'big' }, s.stars === 3 ? '🎉' : s.stars >= 1 ? '🙂' : '📘'), h('h2', { style: { margin: '8px 0' } }, st.deal != null ? `${fmt(st.deal, u)}에 합의` : '합의하지 못했어요'), h('div', { class: 'stars', style: { fontSize: '36px', color: '#e8a410' } }, '★'.repeat(s.stars) + '☆'.repeat(3 - s.stars)), h('div', { class: 'score' }, s.total + '점')));
    out.append(h('div', { class: 'card' }, h('h3', null, '📈 결과 해설'), bar, h('div', { class: 'small', style: { marginTop: '26px', lineHeight: 1.7 } },
      `합의 가능 구간(ZOPA): ${fmt(s.zopa[0], u)} ~ ${fmt(s.zopa[1], u)}`, h('br'), `가치 확보(구간 내 내 몫): ${Math.round(s.value * 100)}% · 관계(분위기): ${Math.round(s.rel * 100)}% · 과정: ${s.process}/20점`, h('br'),
      s.tip ? '💡 ' + s.tip : '', s.tip ? h('br') : '', s.firstOk ? '✅ 첫 제안이 "근거 있는 앵커" 구간에 있었어요.' : '⚠️ 첫 제안이 앵커로는 아쉬웠어요(너무 낮거나 상대 한계를 크게 넘었어요).')));
    out.append(h('div', { class: 'card' }, h('h3', null, '📌 기억할 것'), scn.brief.map((t) => h('div', { class: 'small', style: { margin: '4px 0' } }, '• ' + t))));
    out.append(h('div', { class: 'row' }, h('button', { class: 'btn', onclick: () => runPrice(root, { scn: { ...scn, cfg: JSON.parse(JSON.stringify({ ...cfg, asks: cfg.asks.map((a) => ({ q: a.q, a: a.a })) })) }, onExit, onFinish }) }, '다시 도전'), h('button', { class: 'btn pri', onclick: () => { if (s.stars === 3) confetti(); onFinish({ stars: s.stars, score: s.total, skills: { info: [st.asks ? 2 : 0, 2], prep: [(st.critUsed != null && cfg.criteria[st.critUsed].valid ? 1 : 0) + (s.firstOk ? 1 : 0), 2], value: [Math.round(s.value * 2), 2], firm: [Math.round(s.value * 2), 2], rel: [Math.round(s.rel * 2), 2] }, xp: 20 + Math.round(s.total * 0.6) }); } }, '저장하고 나가기')));
  }
  scr.append(h('div', { class: 'scene' }, h('div', { class: 'pl' }, scn.partner.emoji + ' ' + scn.partner.name + ' · ' + scn.partner.traits), h('div', { class: 'tx' }, scn.setting)),
    h('details', { class: 'card gram' }, h('summary', { style: { fontWeight: 800 } }, '🎓 핵심 개념'), scn.brief.map((b) => h('div', { class: 'small', style: { margin: '4px 0' } }, '• ' + b))), status, chat, actions, out);
  paint();
  window.__price = { st, slider, doOffer, paint, scn, ask: (i) => { N.ask(st, i); paint(); }, finish };
}

// ---------- 다중 이슈 패키지 ----------
export function runPkg(root, { scn, onExit, onFinish }) {
  const cfg = scn.cfg;
  const st = N.startPkg(cfg);
  const sel = cfg.issues.map(() => 1);
  let done = false, asked = null;
  const log = [{ who: 'sys', text: `${scn.partner.name}: 네 가지 조건을 함께 정해 봅시다. 먼저 제안해 주세요.` }];
  root.innerHTML = '';
  const hd = h('div', { class: 'hd', style: { padding: 'calc(var(--safe-t) + 12px) 16px 0' } }, h('button', { class: 'back', onclick: () => { if (st.round === 0 || done || confirm('나가면 이번 협상은 저장되지 않아요. 나갈까요?')) onExit(); } }, '←'), h('h2', null, scn.emoji + ' ' + scn.title));
  const scr = h('div', { class: 'scr nonav' });
  root.append(hd, scr);
  const chat = h('div', { class: 'chat' });
  const body = h('div');
  const pkgText = (pkg) => cfg.issues.map((i, n) => `${i.label}: ${i.levels[pkg[n]]}`).join(' · ');

  function paint() {
    chat.innerHTML = '';
    log.forEach((l) => chat.append(h('div', { class: 'bub ' + (l.who === 'me' ? 'me' : l.who === 'p' ? 'them' : 'sys') }, h('div', { class: 'bt' }, l.text))));
    body.innerHTML = '';
    if (st.done) return finish();
    const um = N.utility(cfg, sel, 'me');
    const tbl = h('div', { class: 'card' }, h('h3', null, `📝 내 제안 (라운드 ${Math.min(st.round + 1, cfg.rounds)}/${cfg.rounds})`));
    cfg.issues.forEach((is, n) => {
      tbl.append(h('div', { class: 'iss' }, h('div', { class: 'il' }, h('b', null, is.label), h('small', null, `내 중요도 ${'★'.repeat(Math.round(is.wMe / 1.5)).slice(0, 5)}`)),
        h('div', { class: 'lv' }, is.levels.map((lv, k) => h('button', { class: 'cbtn' + (sel[n] === k ? ' sel' : ''), onclick: () => { sel[n] = k; paint(); } }, lv)))));
    });
    tbl.append(h('div', { class: 'small', style: { margin: '8px 0' } }, `이 제안의 내 만족도: ${Math.round(um * 100)}%`), h('div', { class: 'mbar' }, h('i', { style: { width: um * 100 + '%', background: 'var(--teal)' } })));
    if (st.final) tbl.append(h('div', { class: 'warn', style: { marginTop: '8px' } }, '마지막 라운드예요. 상대의 마지막 제안을 받아들이거나 떠나야 해요.'));
    else tbl.append(h('button', { class: 'btn teal', style: { marginTop: '10px' }, onclick: propose }, '이 패키지로 제안'));
    body.append(tbl);
    if (st.counter) body.append(h('div', { class: 'card' }, h('h3', null, `📨 ${scn.partner.name}의 현재 제안`), h('div', { class: 'small', style: { lineHeight: 1.7 } }, pkgText(st.counter)), h('div', { class: 'small' }, `내 만족도 ${Math.round(N.utility(cfg, st.counter, 'me') * 100)}%`), h('button', { class: 'btn pri', style: { marginTop: '8px' }, onclick: () => { N.acceptCounter(st); log.push({ who: 'me', text: '나: 그 제안으로 하죠.' }); paint(); } }, '이 제안 수락')));
    body.append(h('div', { class: 'card' }, h('h3', null, '🧰 다른 행동'),
      h('button', { class: 'btn sm', disabled: !!asked, style: { margin: '4px 4px 0 0' }, onclick: () => { N.askPkg(st); asked = cfg.askAnswer; log.push({ who: 'me', text: '나: ' + cfg.askText }, { who: 'p', text: `${scn.partner.name}: ${cfg.askAnswer}` }); paint(); } }, '❓ 상대의 우선순위 묻기'),
      h('button', { class: 'btn sm', style: { margin: '4px 4px 0 0' }, onclick: () => { if (confirm('합의 없이 떠날까요?')) { N.walkPkg(st); log.push({ who: 'sys', text: '협상을 종료했어요.' }); paint(); } } }, '🚪 떠나기')));
    scr.scrollTop = scr.scrollHeight;
  }
  function propose() {
    log.push({ who: 'me', text: '나: ' + pkgText(sel) });
    const r = N.proposePkg(st, sel.slice());
    if (r.accepted) log.push({ who: 'p', text: `${scn.partner.name}: 좋아요, 그 조건으로 합의하죠!` });
    else log.push({ who: 'p', text: `${scn.partner.name}: ${r.note === 'beyond' ? '그 조건은 저희에게 너무 어려워요. ' : r.note === 'reciprocal' ? '양보해 주셔서 저도 조정했어요. ' : ''}대신 이렇게 어떨까요? ${pkgText(r.counter)}` });
    paint();
  }
  function finish() {
    if (done) return; done = true;
    const s = N.summarizePkg(st);
    window.__pkg = { st, s };
    body.append(h('div', { class: 'result' }, h('div', { class: 'big' }, s.stars === 3 ? '🎉' : s.stars >= 1 ? '🙂' : '📘'), h('h2', { style: { margin: '8px 0' } }, st.deal ? '합의 완료' : '합의하지 못했어요'), h('div', { class: 'stars', style: { fontSize: '36px', color: '#e8a410' } }, '★'.repeat(s.stars) + '☆'.repeat(3 - s.stars)), h('div', { class: 'score' }, s.total + '점')));
    body.append(h('div', { class: 'card' }, h('h3', null, '📈 결과 해설'), h('div', { class: 'small', style: { lineHeight: 1.8 } },
      st.deal ? `내 합의안: ${pkgText(st.deal)}` : '합의안 없음', h('br'), `내 만족도 ${Math.round((s.um || 0) * 100)}% · 가능한 최선(상대 최소 만족을 지키는 범위) ${Math.round(s.opt.u * 100)}% → 효율 ${Math.round((s.eff || 0) * 100)}%`, h('br'),
      `이론상 최선 패키지: ${pkgText(s.opt.pkg)}`, h('br'), '💡 가격 하나에 매달리기보다, 내게 중요하고 상대에게 덜 중요한 항목(납기·보증)을 챙기고 상대가 중시하는 항목(가격·결제)을 내주는 교환이 파이를 키워요.')));
    body.append(h('div', { class: 'card' }, h('h3', null, '📌 기억할 것'), scn.brief.map((t) => h('div', { class: 'small', style: { margin: '4px 0' } }, '• ' + t))));
    body.append(h('div', { class: 'row' }, h('button', { class: 'btn', onclick: () => runPkg(root, { scn, onExit, onFinish }) }, '다시 도전'), h('button', { class: 'btn pri', onclick: () => { if (s.stars === 3) confetti(); onFinish({ stars: s.stars, score: s.total, skills: { info: [st.asked ? 2 : 0, 2], prep: [1, 2], value: [Math.round((s.eff || 0) * 2), 2], firm: [Math.round((s.eff || 0) * 2), 2], rel: [st.deal ? 2 : 0, 2] }, xp: 20 + Math.round(s.total * 0.6) }); } }, '저장하고 나가기')));
  }
  scr.append(h('div', { class: 'scene' }, h('div', { class: 'pl' }, scn.partner.emoji + ' ' + scn.partner.name + ' · ' + scn.partner.traits), h('div', { class: 'tx' }, scn.setting)),
    h('details', { class: 'card gram' }, h('summary', { style: { fontWeight: 800 } }, '🎓 핵심 개념'), scn.brief.map((b) => h('div', { class: 'small', style: { margin: '4px 0' } }, '• ' + b))), chat, body);
  paint();
  window.__pkgUI = { st, sel, propose, paint, scn };
}
