export const $ = (s, r = document) => r.querySelector(s);

export function h(tag, attrs, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === false || v == null) continue;
    if (k === 'class') e.className = v;
    else if (k === 'html') e.innerHTML = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(e.style, v);
    else if (k.startsWith('on') && typeof v === 'function') e.addEventListener(k.slice(2), v);
    else e.setAttribute(k, v === true ? '' : v);
  }
  for (const k of kids.flat(Infinity)) {
    if (k == null || k === false) continue;
    e.append(k.nodeType ? k : document.createTextNode(String(k)));
  }
  return e;
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function shuffle(arr, rnd = Math.random) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function toast(msg, ms = 1800) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('on');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.remove('on'), ms);
}

export function confetti(n = 46) {
  const cols = ['#f6b73c', '#ef6a5b', '#2f6fd7', '#4caf6b', '#7a62d6', '#1a9a8a'];
  for (let i = 0; i < n; i++) {
    const c = h('div', { class: 'confetti', style: { left: Math.random() * 100 + 'vw', background: cols[i % cols.length], animationDuration: 1.6 + Math.random() * 1.6 + 's', animationDelay: Math.random() * 0.4 + 's', transform: `rotate(${Math.random() * 360}deg)` } });
    document.body.append(c);
    setTimeout(() => c.remove(), 3800);
  }
}

export const dayKey = (t = Date.now()) => { const d = new Date(t); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
export const fmtTime = (sec) => { sec = Math.max(0, Math.floor(sec)); return String(Math.floor(sec / 60)).padStart(2, '0') + ':' + String(sec % 60).padStart(2, '0'); };
