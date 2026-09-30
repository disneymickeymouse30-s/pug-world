/* =========================================================
 * パグの世界 - sw.js（PUG PUG GARDEN の sw.js を流用）
 * ネットにつながるときは最新を取りにいき、つながらないときは保存分を使う
 * ========================================================= */
'use strict';
const CACHE = 'pugworld-v1';
const FILES = [
  './', './index.html', './manifest.json', './css/style.css',
  './js/config.js', './data/characters.js', './data/items.js', './data/stages.js', './data/story.js',
  './js/save.js', './js/audio.js', './js/pugArt.js', './js/treatArt.js', './js/backgrounds.js',
  './js/puzzle.js', './js/battle.js', './js/story.js', './js/ui.js', './js/main.js',
  './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(FILES); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k.indexOf('pugworld-') === 0 && k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  const req = e.request;
  if (req.method !== 'GET') return;
  e.respondWith(fetch(req).then(function (res) {
    if (res && res.ok && (req.url.indexOf(self.location.origin) === 0 || req.url.indexOf('fonts.g') > 0)) {
      const copy = res.clone();
      caches.open(CACHE).then(function (c) { c.put(req, copy); });
    }
    return res;
  }).catch(function () {
    return caches.match(req).then(function (hit) { return hit || caches.match('./index.html'); });
  }));
});
