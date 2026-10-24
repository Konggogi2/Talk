// 자동 생성 (tools/make_sw.mjs). 수정하지 마세요.
const CACHE = 'talk-vmvlhpz35';
const FILES = [
 "./",
 "./css/style.css",
 "./icons/icon-180.png",
 "./icons/icon-192.png",
 "./icons/icon-512.png",
 "./icons/icon-maskable-512.png",
 "./icons/icon.svg",
 "./index.html",
 "./js/data/conv_a.js",
 "./js/data/conv_b.js",
 "./js/data/conv_c.js",
 "./js/data/index.js",
 "./js/data/neg_branch.js",
 "./js/data/neg_num.js",
 "./js/data/tune.js",
 "./js/data/tune2.js",
 "./js/data/tune3.js",
 "./js/main.js",
 "./js/nego.js",
 "./js/negoui.js",
 "./js/screens.js",
 "./js/sim.js",
 "./js/simui.js",
 "./js/store.js",
 "./js/util.js",
 "./manifest.webmanifest"
];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then((hit) => hit || fetch(e.request).then((res) => {
    const copy = res.clone();
    caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
    return res;
  }).catch(() => caches.match('./index.html'))));
});
