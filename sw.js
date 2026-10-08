// CW PLAY Sinema - service worker
// Sayfalar önce internetten alınır (güncellemeler hemen görünsün diye),
// internet yoksa son kaydedilen kopya gösterilir.
// Videolar ve medya sunucusu hiç önbelleğe alınmaz.
const ONBELLEK = "cw-sinema-v1";
const TEMEL = [
  "./", "./index.html", "./seri.html", "./izle.html", "./bilet.html",
  "./css/style.css", "./js/app.js", "./js/ayarlar.js", "./js/liste.js",
  "./manifest.json", "./ikonlar/ikon-192.png", "./ikonlar/ikon-512.png"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(ONBELLEK).then(c => c.addAll(TEMEL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(adlar => Promise.all(adlar.filter(a => a !== ONBELLEK).map(a => caches.delete(a))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const istek = e.request;
  const url = new URL(istek.url);
  // Sadece bu sitenin kendi dosyaları; videolar, liste.php ve yazı tipleri dokunulmadan geçer
  if (istek.method !== "GET" || url.origin !== location.origin || istek.headers.has("range")) return;

  e.respondWith(
    fetch(istek, { cache: "no-cache" })
      .then(cevap => {
        if (cevap.ok) {
          const kopya = cevap.clone();
          caches.open(ONBELLEK).then(c => c.put(istek, kopya));
        }
        return cevap;
      })
      .catch(() => caches.match(istek, { ignoreSearch: true }).then(c => c || caches.match("./index.html")))
  );
});
