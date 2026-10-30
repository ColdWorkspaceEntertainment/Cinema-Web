(() => {
  "use strict";
  const A = window.CW_AYAR || {};
  const KLASOR = (A.videoKlasoru || "videos").replace(/\/+$/, "");
  const $ = (s, r = document) => r.querySelector(s);
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const cmp = (a, b) => a.localeCompare(b, "tr", { numeric: true, sensitivity: "base" });
  // Videolar başka bir sunucudaysa (ayarlar.js > videoSunucusu) tüm medya oradan gelir
  // Discord Activity içinde mi açıldık? (Discord siteyi *.discordsays.com üzerinden açar)
  const DISCORD = /\.discordsays\.com$/.test(location.hostname);
  const DISCORD_ID = A.discordId || "1557814775973548144";
  // Discord içinde dış adreslere doğrudan bağlanılamaz; medya sunucusuna
  // Developer Portal'daki "/medya" adres eşleştirmesi üzerinden gidilir.
  const SUNUCU = DISCORD ? "/medya" : String(A.videoSunucusu || "").trim().replace(/\/+$/, "");
  const yol = p => (SUNUCU ? SUNUCU + "/" : "") + p.split("/").map(encodeURIComponent).join("/");

  // ------------------------------------------------------------ CW PLAY Cinema Pass (Fizzy's Store hesabı)
  // Netflix gibi: giriş yapıp Cinema Pass'i olmayan salona, dizilere ve oynatıcıya giremez.
  // Discord Activity içinde giriş yapılamadığı için ayarlar.js > discordAcik: false yapılmadıkça orada kapı uygulanmaz.
  const MEDYA = (SUNUCU || "https://medya.cwplaymusic.com");
  const UYE_API = MEDYA + "/fizzy/cinema.php", VIDEO_API = MEDYA + "/fizzy/video.php";
  const MAGAZA = (A.magaza || "https://cwplaymusic.com").replace(/\/+$/, "");
  const UYE_KEY = "cw-uye", UYE_CACHE = "cw-uye-durum", DONUS = "cw-donus";
  const KAPI_SAYFALARI = ["salon", "seri", "izle", "bilet"];
  const KAPI_ACIK = !(DISCORD && A.discordAcik !== false);
  let UYE = null;
  const passVar = () => UYE?.durum === "acik";
  (function uyeYakala() {
    const m = location.hash.match(/[#&]uye=([^&]+)/);
    if (!m) return;
    try { localStorage.setItem(UYE_KEY, decodeURIComponent(m[1])); sessionStorage.removeItem(UYE_CACHE); } catch {}
    history.replaceState(null, "", location.pathname + location.search);
    let donus = null;
    try { donus = JSON.parse(localStorage.getItem(DONUS)); localStorage.removeItem(DONUS); } catch {}
    if (donus && /^\/[^/]/.test(donus) && !/index\.html$/.test(donus)) location.replace(donus);
  })();
  async function uyelik(zorla) {
    let t = null;
    try { t = localStorage.getItem(UYE_KEY); } catch {}
    if (!t) return { durum: "giris" };
    if (!zorla) {
      try { const c = JSON.parse(sessionStorage.getItem(UYE_CACHE)); if (c && Date.now() - c.t < 10 * 60 * 1000) return c.d; } catch {}
    }
    try {
      const r = await fetch(UYE_API, { method: "POST", headers: { "Content-Type": "text/plain" }, body: JSON.stringify({ action: "check", token: t }) });
      const j = await r.json().catch(() => ({}));
      if (r.status === 401) { localStorage.removeItem(UYE_KEY); return { durum: "giris" }; }
      if (r.status === 403) return { durum: "engel", mesaj: j.error };
      if (!r.ok || !j.ok) return { durum: "hata" };
      const d = { ...j, durum: j.pass ? "acik" : "pass" };
      sessionStorage.setItem(UYE_CACHE, JSON.stringify({ t: Date.now(), d }));
      return d;
    } catch { return { durum: "hata" }; }
  }
  function cikis() {
    try { localStorage.removeItem(UYE_KEY); sessionStorage.removeItem(UYE_CACHE); } catch {}
    location.href = "index.html";
  }
  function girisAdresi() {
    yaz(DONUS, location.pathname + location.search);
    return MAGAZA + "/cinema-login.html";
  }
  // Kapı ekranı: giriş yok / Cinema Pass yok / engelli / bağlantı yok
  function kapi(u) {
    const buy = u.buy || MAGAZA + "/product.html?item=cinema-pass";
    const ekran = {
      giris: ["CW PLAY Sinema'ya hoş geldin", "İzlemek için Fizzy's Store hesabınla (Discord ya da CW PLAY hesabı) giriş yap. Dizileri izlemek için <b>CW PLAY Cinema Pass</b> gerekir.",
        `<a class="btn" href="${esc(girisAdresi())}">Giriş yap</a><a class="btn btn-ghost" href="${esc(buy)}">Cinema Pass nedir?</a>`],
      pass: [`Merhaba ${esc(u.name || "")}!`, "Salona girmek için <b>CW PLAY Cinema Pass</b> aboneliği gerekiyor. Pass ile bilet almadan bütün dizileri izleyebilirsin.",
        `<a class="btn" href="${esc(buy)}">Cinema Pass al</a><button class="btn btn-ghost" id="kapi-yenile" type="button">Pass aldım, yenile</button><button class="navbtn" id="kapi-cikis" type="button">Başka hesapla giriş yap</button>`],
      engel: ["Giriş yapılamıyor", esc(u.mesaj || "Hesabın CW PLAY Sinema'ya erişemiyor."), `<button class="navbtn" id="kapi-cikis" type="button">Çıkış yap</button>`],
      hata: ["Salona şu an bağlanılamadı", "Bağlantını kontrol edip tekrar dene.", `<button class="btn" id="kapi-yenile" type="button">Tekrar dene</button>`],
    }[u.durum] || ["", "", ""];
    $("#icerik").innerHTML = `<section class="marquee"><div class="marquee-lights" aria-hidden="true"></div>
      <p class="marquee-kicker">${esc(A.siteAdi || "CW PLAY™ Sinema")}</p><h1 class="marquee-title">${ekran[0]}</h1>
      <p class="marquee-text">${ekran[1]}</p><div class="actions">${ekran[2]}</div></section>`;
    $("#kapi-yenile")?.addEventListener("click", async () => { const y = await uyelik(true); if (y.durum === "acik") location.reload(); else kapi(y); });
    $("#kapi-cikis")?.addEventListener("click", cikis);
  }
  // Pass sahiplerine videolar korumalı bağlantıyla (birkaç saatte bir yenilenen bilet) gelir
  const videoAdres = p => (passVar() && UYE.vt && p.startsWith(KLASOR + "/"))
    ? `${VIDEO_API}?p=${encodeURIComponent(p.slice(KLASOR.length + 1))}&t=${encodeURIComponent(UYE.vt)}` : yol(p);
  const params = new URLSearchParams(location.search);
  const VIDEO = /\.(mp4|webm|m4v|mov)$/i, RESIM = /\.(jpe?g|png|webp)$/i;
  const GUN = 864e5;

  const oku = (k, v) => { try { return JSON.parse(localStorage.getItem(k)) ?? v; } catch { return v; } };
  const yaz = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

  function slugify(s) {
    return s.toLocaleLowerCase("tr").replace(/[çğıöşü]/g, c => ({ ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u" }[c]))
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "seri";
  }
  function temizBaslik(ad) {
    const kok = ad.replace(/\.[^.]+$/, "");
    return kok.replace(/^\s*(?:[sS]\d+\s*)?[eE]?\d+\s*[-._)]+\s*/, "").replace(/_/g, " ").trim() || kok;
  }
  const tarih = ms => new Date(ms).toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" });

  // ------------------------------------------------------------ video klasörünü okuma
  async function dosyalar() {
    if (SUNUCU) {
      const anahtar = "cw-sunucu-liste";
      try {
        const c = JSON.parse(sessionStorage.getItem(anahtar));
        if (c && Date.now() - c.t < 5 * 60 * 1000) return c.p;
      } catch {}
      try {
        const r = await fetch(SUNUCU + "/liste.php", { cache: "no-store" });
        if (!r.ok) throw new Error(r.status);
        const p = (await r.json()).map(x => KLASOR + "/" + String(x).replace(/^\/+/, ""));
        sessionStorage.setItem(anahtar, JSON.stringify({ t: Date.now(), p }));
        yaz(anahtar + "-yedek", p);
        return p;
      } catch {
        const y = oku(anahtar + "-yedek", null);
        if (y) return y;
        return [];
      }
    }
    const g = A.github || {};
    if (g.kullanici && g.depo) {
      const anahtar = "cw-agac";
      try {
        const c = JSON.parse(sessionStorage.getItem(anahtar));
        if (c && Date.now() - c.t < 10 * 60 * 1000) return c.p;
      } catch {}
      try {
        const r = await fetch(`https://api.github.com/repos/${g.kullanici}/${g.depo}/git/trees/${g.dal || "main"}?recursive=1`);
        if (!r.ok) throw new Error(r.status);
        const j = await r.json();
        const p = j.tree.filter(x => x.type === "blob" && x.path.startsWith(KLASOR + "/")).map(x => x.path);
        sessionStorage.setItem(anahtar, JSON.stringify({ t: Date.now(), p }));
        yaz(anahtar + "-yedek", p);
        return p;
      } catch {
        const y = oku(anahtar + "-yedek", null);
        if (y) return y;
      }
    }
    return (window.CW_LISTE || []).map(p => KLASOR + "/" + p.replace(/^\/+/, ""));
  }

  const FRAGMAN_KLASORU = /^(fragman(lar)?|trailers?|teasers?|önizleme|onizleme)$/i;
  let _kume = new Set();
  const kucukResim = tam => {
    const kokAd = tam.replace(/\.[^.]+$/, "");
    return [".jpg", ".jpeg", ".png", ".webp"].map(e => kokAd + e).find(x => _kume.has(x)) || null;
  };

  let _kutuphane = null;
  async function kutuphane() {
    if (_kutuphane) return _kutuphane;
    const tum = await dosyalar();
    const kume = new Set(tum);
    _kume = kume;
    const gruplar = {};
    for (const p of tum) {
      const parca = p.slice(KLASOR.length + 1).split("/");
      if (parca.length >= 2) (gruplar[parca[0]] ||= []).push(parca.slice(1));
    }
    const seriler = [];
    for (const klasor of Object.keys(gruplar).sort(cmp)) {
      const kok = `${KLASOR}/${klasor}/`;
      const sezonlar = {};
      let poster = null, banner = null, infoVar = false;
      for (const f of gruplar[klasor]) {
        if (f.length === 1) {
          const n = f[0].toLowerCase();
          if (RESIM.test(n) && /^(poster|kapak|cover)\./.test(n)) poster = kok + f[0];
          else if (RESIM.test(n) && /^(banner|backdrop|afis)\./.test(n)) banner = kok + f[0];
          else if (n === "info.json") infoVar = true;
          else if (VIDEO.test(n)) (sezonlar[""] ||= []).push(f[0]);
        } else if (f.length === 2 && VIDEO.test(f[1])) {
          (sezonlar[f[0]] ||= []).push(f[0] + "/" + f[1]);
        }
      }
      const tumAdlar = Object.keys(sezonlar).sort((a, b) => (a === "" ? -1 : b === "" ? 1 : cmp(a, b)));
      // "Fragman" gibi adlı klasörler bölüm değil fragman sayılır
      const adlar = tumAdlar.filter(a => !FRAGMAN_KLASORU.test(a));
      const fragmanAdlari = tumAdlar.filter(a => FRAGMAN_KLASORU.test(a));
      // Bölümü olmayan ama posteri, bilgisi ya da fragmanı olan seri "Yakında" olarak gösterilir
      const yakinda = !adlar.length;
      if (yakinda && !fragmanAdlari.length && !poster && !infoVar && !(window.CW_BILGI || {})[klasor]) continue;

      let info = (window.CW_BILGI || {})[klasor];
      if (!info && infoVar) {
        try { info = await (await fetch(yol(kok + "info.json"))).json(); } catch { info = null; }
      }
      info ||= {};
      const slug = slugify(info.slug || klasor);
      const duz = [];
      const sezonListesi = adlar.map(ad => {
        const bolumler = sezonlar[ad].sort(cmp).map((rel, i) => {
          const tam = kok + rel;
          const b = { no: i + 1, baslik: temizBaslik(rel.split("/").pop()), yol: tam, kucuk: kucukResim(tam), sezon: ad, seri: slug };
          b.sira = duz.push(b);
          return b;
        });
        return { ad: ad || "Bölümler", bolumler };
      });
      const fragmanlar = fragmanAdlari.flatMap(ad => sezonlar[ad].sort(cmp)).map((rel, i) => ({
        no: i + 1, baslik: temizBaslik(rel.split("/").pop()), yol: kok + rel, kucuk: kucukResim(kok + rel), fragman: true, seri: slug
      }));
      seriler.push({
        slug, klasor, baslik: info.title || klasor, aciklama: info.description || "",
        yil: info.year || "", tur: info.genre || "", yas: info.age || "", one: !!info.featured,
        poster, banner, sezonlar: sezonListesi, duz, fragmanlar,
        yakinda: yakinda && !info.unavailable, kaldirildi: !!info.unavailable, cikis: info.comingSoon || ""
      });
    }
    _kutuphane = { seriler, slug: Object.fromEntries(seriler.map(s => [s.slug, s])) };
    return _kutuphane;
  }

  // ------------------------------------------------------------ bilet sistemi
  // Kurallar: bilet tek bir seri için, 1 gün geçerli; aktif biletin varken yenisi
  // alınamaz; bilet bittikten sonra 1 saat yeni bilet alınamaz.
  const BILET_SURE = 24 * 60 * 60 * 1000;
  const BEKLEME = 60 * 60 * 1000;
  const sonBilet = () => { const b = oku("cw-bilet", null); return b && b.seri && b.bitis ? b : null; };
  const aktifBilet = () => { const b = sonBilet(); return b && b.bitis > Date.now() ? b : null; };
  const beklemeKalan = () => {
    const b = sonBilet();
    if (!b || b.bitis > Date.now()) return 0;
    return Math.max(0, b.bitis + BEKLEME - Date.now());
  };
  const erisim = slug => passVar() || aktifBilet()?.seri === slug;
  function sureYaz(ms) {
    const dk = Math.max(1, Math.ceil(ms / 60000));
    const sa = Math.floor(dk / 60), kalanDk = dk % 60;
    return sa ? `${sa} saat${kalanDk ? " " + kalanDk + " dakika" : ""}` : `${dk} dakika`;
  }
  const saatli = ms => new Date(ms).toLocaleString("tr-TR", { day: "2-digit", month: "long", hour: "2-digit", minute: "2-digit" });

  // ------------------------------------------------------------ ortak parçalar
  function ilerlemeler() { return oku("cw-ilerleme", {}); }

  function posterHTML(s) {
    return `<a class="poster${s.kaldirildi ? " poster-off" : ""}" href="seri.html?s=${encodeURIComponent(s.slug)}">
      ${s.poster ? `<img src="${esc(yol(s.poster))}" alt="" loading="lazy">` : `<span class="poster-type">${esc(s.baslik)}</span>`}
      ${s.kaldirildi ? `<span class="lock lock-off">Mevcut değil</span>` : s.yakinda ? `<span class="lock">Yakında</span>` : (!passVar() && erisim(s.slug)) ? `<span class="lock lock-ok">Biletin var</span>` : ""}
      <span class="poster-cap"><b>${esc(s.baslik)}</b><small>${s.kaldirildi ? "Artık mevcut değil" : s.yakinda ? esc(s.cikis || "Yakında") : s.duz.length + " bölüm"}</small></span></a>`;
  }
  function heroHTML(s, butonlar) {
    const arka = s.banner ? `<img class="hero-bg" src="${esc(yol(s.banner))}" alt="">`
      : s.poster ? `<img class="hero-bg hero-bg-blur" src="${esc(yol(s.poster))}" alt="">` : "";
    const meta = [s.yil, s.tur].filter(Boolean).map(x => `<span>${esc(x)}</span>`).join("")
      + (s.yas ? `<span class="age">${esc(s.yas)}</span>` : "")
      + (s.kaldirildi ? `<span class="off-tag">Artık mevcut değil</span>` : s.yakinda ? `<span class="soon">Yakında${s.cikis ? " · " + esc(s.cikis) : ""}</span>` : `<span>${s.duz.length} bölüm</span>`);
    return `${arka}<div class="hero-body"><h1 class="hero-title">${esc(s.baslik)}</h1>
      <p class="meta">${meta}</p>${s.aciklama ? `<p class="hero-text">${esc(s.aciklama)}</p>` : ""}
      <div class="actions">${butonlar}</div></div>`;
  }
  function bos(mesaj) {
    return `<section class="empty"><h1>Salon henüz boş</h1><p class="muted">${mesaj}</p></section>`;
  }
  const bosMesaj = (A.github?.depo)
    ? "videos klasöründe seri bulunamadı. Seri klasörlerini GitHub deposuna yükle."
    : "Seri bulunamadı. js/ayarlar.js içinde GitHub bilgilerini doldur ya da js/liste.js'e videolarını yaz.";

  // ------------------------------------------------------------ sayfalar
  const fragmanHTML = s => s.fragmanlar.length ? `<section class="episodes"><h2>Fragmanlar</h2><ol class="ep-list">${s.fragmanlar.map(f => `
    <li><a class="ep" href="izle.html?s=${encodeURIComponent(s.slug)}&f=${f.no}"><span class="ep-num">▶</span>
      <span class="ep-img">${f.kucuk ? `<img src="${esc(yol(f.kucuk))}" alt="" loading="lazy">` : ""}</span>
      <span class="ep-title">${esc(f.baslik)}</span></a></li>`).join("")}</ol></section>` : "";
  const fragmanButonu = (s, ghost) => s.fragmanlar.length
    ? `<a class="btn${ghost ? " btn-ghost" : ""}" href="izle.html?s=${encodeURIComponent(s.slug)}&f=1">Fragmanı izle</a>` : "";

  // ------------------------------------------------------------ "mevcut değil" ekranı
  // Kaldırılmış bir seri ya da bölüm açılmaya çalışıldığında gösterilir.
  // İzleyicinin cihazındaki izleme geçmişinden kaldırılan serinin adını bulmaya çalışır.
  function eskiAd(slug) {
    for (const yol of Object.keys(ilerlemeler())) {
      const parca = yol.split("/");
      if (parca.length > 2 && slugify(parca[1]) === slug) return parca[1];
    }
    return "";
  }

  function mevcutDegil(lib, slug, bolumMu) {
    const s = lib.slug[slug];
    const ad = s ? s.baslik : eskiAd(slug);
    document.title = `İçerik mevcut değil · ${A.siteAdi || "CW PLAY Sinema"}`;
    if (s && s.kaldirildi) bolumMu = false;
    const baslik = bolumMu && s ? "Bu bölüm artık mevcut değil" : "Bu içerik artık mevcut değil";
    const metin = bolumMu && s
      ? `${esc(ad)} serisinin bu bölümü kaldırıldı ya da adı değişti.`
      : ad
        ? `<b>${esc(ad)}</b> artık CW PLAY™ Sinema'da yayınlanmıyor.`
        : "Aradığın seri ya da bölüm kaldırıldı veya artık CW PLAY™ Sinema'da yayınlanmıyor.";
    const digerleri = lib.seriler.filter(x => x.slug !== slug && !x.kaldirildi).slice(0, 8);
    $("#icerik").innerHTML = `<section class="yok">
        <div class="yok-ikon" aria-hidden="true"><span></span></div>
        <h1>${baslik}</h1>
        <p class="muted">${metin}</p>
        <div class="actions">
          ${bolumMu && s ? `<a class="btn" href="seri.html?s=${encodeURIComponent(s.slug)}">Seriye git</a><a class="btn btn-ghost" href="index.html">Salona dön</a>`
                         : `<a class="btn" href="index.html">Salona dön</a>`}
        </div>
      </section>
      ${digerleri.length ? `<section class="row"><h2>Bunlara göz atabilirsin</h2><div class="rail">${digerleri.map(x => posterHTML(x)).join("")}</div></section>` : ""}`;
  }

  // Liste hiç yüklenemediyse (bağlantı sorunu) içeriği "kaldırıldı" sanmamak için
  function yuklenemedi() {
    $("#icerik").innerHTML = `<section class="empty"><h1>Salon şu an yüklenemedi</h1>
      <p class="muted">Bağlantını kontrol edip sayfayı yenile.</p><a class="btn" href="index.html">Salona dön</a></section>`;
  }

  const sayfalar = {};

  sayfalar.salon = async () => {
    const lib = await kutuphane();
    const ana = $("#icerik");
    if (!lib.seriler.length) return (ana.innerHTML = bos(bosMesaj));
    const one = lib.seriler.find(s => s.one && !s.kaldirildi) || lib.seriler.find(s => !s.yakinda && !s.kaldirildi) || lib.seriler.find(s => !s.kaldirildi) || lib.seriler[0];
    let html = `<section class="hero">${heroHTML(one,
      one.yakinda || erisim(one.slug)
        ? `<a class="btn" href="seri.html?s=${encodeURIComponent(one.slug)}">${one.yakinda ? "Seriyi incele" : "Bölümleri gör"}</a>${fragmanButonu(one, true)}`
        : `<a class="btn" href="seri.html?s=${encodeURIComponent(one.slug)}">Bölümleri gör</a><a class="btn btn-ghost" href="bilet.html?s=${encodeURIComponent(one.slug)}">Bilet al</a>`)}</section>`;

    const ilr = ilerlemeler();
    const devam = [];
    for (const s of lib.seriler.filter(x => !x.kaldirildi)) for (const b of s.duz) {
      const p = ilr[b.yol];
      if (p && p.dur && p.pos / p.dur < 0.95) devam.push({ s, b, p });
    }
    devam.sort((x, y) => y.p.t - x.p.t);
    if (devam.length) {
      html += `<section class="row"><h2>İzlemeye devam et</h2><div class="rail">${devam.slice(0, 12).map(({ s, b, p }) => `
        <a class="cont" href="izle.html?s=${encodeURIComponent(s.slug)}&b=${b.sira}">
          <span class="cont-img">${b.kucuk ? `<img src="${esc(yol(b.kucuk))}" alt="" loading="lazy">` : ""}</span>
          <span class="bar"><i data-progress="${(p.pos / p.dur).toFixed(3)}"></i></span>
          <b>${esc(s.baslik)}</b><small>${b.no}. bölüm: ${esc(b.baslik)}</small></a>`).join("")}</div></section>`;
    }
    const gosterimde = lib.seriler.filter(s => !s.yakinda && !s.kaldirildi), yakindakiler = lib.seriler.filter(s => s.yakinda);
    const kaldirilanlar = lib.seriler.filter(s => s.kaldirildi);
    if (gosterimde.length) html += `<section class="row"><h2>Gösterimdeki seriler</h2><div class="rail">${gosterimde.map(s => posterHTML(s)).join("")}</div></section>`;
    if (yakindakiler.length) html += `<section class="row"><h2>Yakında</h2><div class="rail">${yakindakiler.map(s => posterHTML(s)).join("")}</div></section>`;
    if (kaldirilanlar.length) html += `<section class="row"><h2>Artık mevcut değil</h2><div class="rail">${kaldirilanlar.map(s => posterHTML(s)).join("")}</div></section>`;
    ana.innerHTML = html;
  };

  sayfalar.seri = async () => {
    const lib = await kutuphane();
    const s = lib.slug[params.get("s")];
    const ana = $("#icerik");
    if (!s) return lib.seriler.length ? mevcutDegil(lib, params.get("s") || "", false) : yuklenemedi();
    document.title = `${s.baslik} · ${A.siteAdi}`;
    if (s.kaldirildi) {
      ana.innerHTML = `<section class="hero hero-series">${heroHTML(s, `<span class="soon-big off-big">Bu içerik artık mevcut değil</span>`)}</section>`;
      return;
    }
    if (s.yakinda) {
      ana.innerHTML = `<section class="hero hero-series">${heroHTML(s, `${fragmanButonu(s)}<span class="soon-big">Çok yakında burada</span>`)}</section>${fragmanHTML(s)}`;
      return;
    }
    const ilr = ilerlemeler();
    const izlenen = s.duz.filter(b => ilr[b.yol]).sort((a, b) => ilr[b.yol].t - ilr[a.yol].t)[0];
    let devam = s.duz[0];
    if (izlenen) {
      const p = ilr[izlenen.yol];
      devam = p.dur && p.pos / p.dur >= 0.95 && s.duz[izlenen.sira] ? s.duz[izlenen.sira] : izlenen;
    }
    const acik = erisim(s.slug), aktif = aktifBilet();
    let buton;
    if (acik) buton = `<a class="btn" href="izle.html?s=${encodeURIComponent(s.slug)}&b=${devam.sira}">${izlenen ? "Devam et" : "İzlemeye başla"}</a>
      <span class="muted">${aktif && !passVar() ? `Biletinin bitmesine ${sureYaz(aktif.bitis - Date.now())} var.` : "Cinema Pass ile izliyorsun."}</span>`;
    else if (aktif) buton = `<span class="muted">Aktif biletin ${esc(lib.slug[aktif.seri]?.baslik || "başka bir seri")} için. Bu seriyi izlemek için biletinin bitmesini bekle.</span>`;
    else if (beklemeKalan()) buton = `<span class="muted">Yeni bilet ${sureYaz(beklemeKalan())} sonra alınabilir.</span>`;
    else buton = `<a class="btn" href="bilet.html?s=${encodeURIComponent(s.slug)}">Bilet al</a><span class="muted">Bu seriyi izlemek için bilet gerekiyor.</span>`;
    let html = `<section class="hero hero-series">${heroHTML(s, buton)}</section>` + fragmanHTML(s);
    for (const se of s.sezonlar) {
      html += `<section class="episodes"><h2>${esc(se.ad)}</h2><ol class="ep-list">${se.bolumler.map(b => {
        const p = ilr[b.yol];
        const link = acik ? `izle.html?s=${encodeURIComponent(s.slug)}&b=${b.sira}` : `bilet.html?s=${encodeURIComponent(s.slug)}`;
        return `<li><a class="ep${acik ? "" : " ep-locked"}" href="${link}"><span class="ep-num">${b.no}</span>
          <span class="ep-img">${b.kucuk ? `<img src="${esc(yol(b.kucuk))}" alt="" loading="lazy">` : ""}</span>
          <span class="ep-title">${esc(b.baslik)}${p && p.dur ? `<span class="bar"><i data-progress="${(p.pos / p.dur).toFixed(3)}"></i></span>` : ""}</span></a></li>`;
      }).join("")}</ol></section>`;
    }
    ana.innerHTML = html;
  };

  sayfalar.izle = async () => {
    const lib = await kutuphane();
    const s = lib.slug[params.get("s")];
    const fNo = parseInt(params.get("f"), 10);
    const fragmanModu = fNo > 0;
    const b = fragmanModu ? s?.fragmanlar[fNo - 1] : s?.duz[(parseInt(params.get("b"), 10) || 1) - 1];
    if (!s || !b || s.kaldirildi) {
      if (!lib.seriler.length) return yuklenemedi();
      return mevcutDegil(lib, params.get("s") || "", !!s);
    }
    // Fragmanlar biletsiz izlenebilir
    if (!fragmanModu && !erisim(s.slug)) return location.replace(`bilet.html?s=${encodeURIComponent(s.slug)}`);
    const bilet = aktifBilet();

    const sonraki = fragmanModu ? null : s.duz[b.sira] || null;
    const sezon = fragmanModu ? { bolumler: s.fragmanlar } : s.sezonlar.find(x => x.bolumler.includes(b));
    const bagla = e => e.fragman ? `izle.html?s=${encodeURIComponent(s.slug)}&f=${e.no}` : `izle.html?s=${encodeURIComponent(s.slug)}&b=${e.sira}`;
    document.title = `${fragmanModu ? "Fragman" : b.no + "."} ${b.baslik} · ${s.baslik}`;
    $("#icerik").innerHTML = `<section class="screen">
      <div class="player" id="player-wrap">
        <video id="player" controls playsinline preload="metadata"
          controlslist="nodownload nofullscreen noremoteplayback" disablepictureinpicture disableremoteplayback></video>
        <button class="fs" id="fs" type="button">Tam ekran</button>
        ${sonraki ? `<div class="next-up" id="next-up" hidden><p>Sıradaki: ${sonraki.no}. ${esc(sonraki.baslik)}</p>
          <p class="muted"><span id="next-count">8</span> saniye içinde başlıyor</p>
          <div class="actions"><a class="btn" href="izle.html?s=${encodeURIComponent(s.slug)}&b=${sonraki.sira}">Şimdi izle</a>
          <button class="btn btn-ghost" id="next-cancel" type="button">İptal</button></div></div>` : ""}
      </div>
      <div class="now"><div><a class="muted" href="seri.html?s=${encodeURIComponent(s.slug)}">${esc(s.baslik)}</a>
        <h1>${fragmanModu ? "Fragman: " : b.no + ". "}${esc(b.baslik)}</h1>
        ${fragmanModu
          ? (s.duz.length ? `<p class="muted">${erisim(s.slug) ? `<a href="seri.html?s=${encodeURIComponent(s.slug)}">Bölümlere git</a>` : `Bölümleri izlemek için <a href="bilet.html?s=${encodeURIComponent(s.slug)}">bilet al</a>`}</p>` : `<p class="muted">${s.cikis ? "Çıkış: " + esc(s.cikis) : "Çok yakında"}</p>`)
          : (bilet && !passVar() ? `<p class="muted">Koltuk ${esc(bilet.koltuk)} · Biletinin bitmesine ${sureYaz(bilet.bitis - Date.now())} var</p>` : `<p class="muted">Cinema Pass · ${esc(UYE?.name || "")}</p>`)}</div>
        ${sonraki ? `<a class="btn btn-ghost" href="izle.html?s=${encodeURIComponent(s.slug)}&b=${sonraki.sira}">Sonraki bölüm</a>` : ""}</div>
      <ol class="ep-list ep-list-compact">${sezon.bolumler.map(e => `<li><a class="ep${e === b ? " ep-current" : ""}"
        href="${bagla(e)}"><span class="ep-num">${e.no}</span><span class="ep-title">${esc(e.baslik)}</span></a></li>`).join("")}</ol>
    </section>`;

    const video = $("#player"), kutu = $("#player-wrap");
    video.src = videoAdres(b.yol);
    [video, kutu].forEach(el => el.addEventListener("contextmenu", e => e.preventDefault()));

    const ilr = ilerlemeler();
    const bas = ilr[b.yol]?.pos || 0;
    video.addEventListener("loadedmetadata", () => {
      if (bas > 5 && bas < video.duration - 5) video.currentTime = bas;
    }, { once: true });
    let son = 0;
    const kaydet = () => {
      if (!video.duration || !isFinite(video.duration)) return;
      son = Date.now();
      const x = ilerlemeler();
      x[b.yol] = { pos: video.currentTime, dur: video.duration, t: Date.now() };
      yaz("cw-ilerleme", x);
    };
    video.addEventListener("timeupdate", () => { if (Date.now() - son > 5000) kaydet(); });
    video.addEventListener("pause", kaydet);
    window.addEventListener("pagehide", kaydet);

    const tamEkran = () => document.fullscreenElement ? document.exitFullscreen()
      : (kutu.requestFullscreen || kutu.webkitRequestFullscreen)?.call(kutu);
    $("#fs").addEventListener("click", tamEkran);
    video.addEventListener("dblclick", e => { e.preventDefault(); tamEkran(); });
    document.addEventListener("fullscreenchange", () => {
      if (document.fullscreenElement === video) document.exitFullscreen().then(() => kutu.requestFullscreen?.()).catch(() => {});
    });
    document.addEventListener("keydown", e => {
      if (e.target.matches("input, textarea")) return;
      if (e.key === "f" || e.key === "F") tamEkran();
      if (e.key === " ") { e.preventDefault(); video.paused ? video.play() : video.pause(); }
    });

    const sk = $("#next-up");
    if (sk) {
      let z = null;
      video.addEventListener("ended", () => {
        kaydet(); sk.hidden = false;
        let n = 8; const c = $("#next-count");
        z = setInterval(() => { c.textContent = --n; if (n <= 0) { clearInterval(z); location.href = sk.querySelector("a").href; } }, 1000);
      });
      $("#next-cancel").addEventListener("click", () => { clearInterval(z); sk.hidden = true; });
    } else video.addEventListener("ended", kaydet);
  };

  sayfalar.bilet = async () => {
    if (passVar()) return location.replace("index.html"); // Pass sahibi bilete ihtiyaç duymaz
    const lib = await kutuphane();
    const seriler = lib.seriler.filter(s => !s.yakinda && !s.kaldirildi);
    const form = $("#bilet-form"), durum = $("#durum");
    const aktif = aktifBilet(), bekle = beklemeKalan();

    if (aktif) {
      form.hidden = true;
      return biletGoster(lib, aktif);
    }
    if (bekle) {
      form.hidden = true;
      durum.innerHTML = `<h1>Biletinin süresi doldu</h1>
        <p class="muted">Yeni bir bilet <b>${sureYaz(bekle)}</b> sonra alabilirsin (${saatli(Date.now() + bekle)}).</p>
        <a class="btn" href="index.html">Salona dön</a>`;
      durum.hidden = false;
      return;
    }
    if (!seriler.length) {
      form.hidden = true;
      durum.innerHTML = `<h1>Gösterimde seri yok</h1><a class="btn" href="index.html">Salona dön</a>`;
      durum.hidden = false;
      return;
    }

    const sec = $("#seri");
    sec.innerHTML = seriler.map(s => `<option value="${esc(s.slug)}">${esc(s.baslik)}</option>`).join("");
    if (lib.slug[params.get("s")] && !lib.slug[params.get("s")].yakinda) sec.value = params.get("s");

    const plan = $("#koltuklar");
    plan.innerHTML = [..."ABCDEFG"].map(r => `<div class="seat-row"><span class="seat-label">${r}</span>${
      Array.from({ length: 12 }, (_, i) => `${i === 6 ? '<span class="aisle"></span>' : ""}<button type="button" class="seat" data-seat="${r}${i + 1}" aria-label="Koltuk ${r}${i + 1}" aria-pressed="false"></button>`).join("")
    }</div>`).join("");
    let koltuk = null;
    plan.addEventListener("click", e => {
      const k = e.target.closest(".seat");
      if (!k) return;
      plan.querySelectorAll(".seat").forEach(x => x.setAttribute("aria-pressed", "false"));
      k.setAttribute("aria-pressed", "true");
      koltuk = k.dataset.seat;
      $("#secilen").textContent = `Seçilen koltuk: ${koltuk}`;
    });

    const hata = m => { const h = $("#hata"); h.textContent = m; h.hidden = !m; };
    form.addEventListener("submit", e => {
      e.preventDefault();
      hata("");
      if (aktifBilet() || beklemeKalan()) return location.reload();
      const ad = $("#ad").value.trim();
      if (!lib.slug[sec.value]) return hata("Bir seri seç.");
      if (!ad) return hata("Biletin üzerine yazılacak adı gir.");
      if (!koltuk) return hata("Salondan bir koltuk seç.");
      const simdi = Date.now();
      const b = { seri: sec.value, ad: ad.slice(0, 40), koltuk, alindi: simdi, bitis: simdi + BILET_SURE };
      yaz("cw-bilet", b);
      form.hidden = true;
      biletGoster(lib, b);
      ustBilet();
    });
  };

  function biletGoster(lib, b) {
    const s = lib.slug[b.seri];
    const kutu = $("#basili");
    kutu.innerHTML = `<div class="printed">
      <div class="printed-main"><span class="muted-dark">${esc(A.siteAdi || "CW PLAY™ Sinema")}</span>
        <h2>${esc(s?.baslik || b.seri)}</h2>
        <dl><div><dt>Ad</dt><dd>${esc(b.ad)}</dd></div><div><dt>Koltuk</dt><dd>${esc(b.koltuk)}</dd></div>
        <div><dt>Geçerlilik</dt><dd>${saatli(b.bitis)}</dd></div></dl></div>
      <div class="ticket-stub"><span>Giriş</span><b>1</b><span>kişilik</span></div></div>
      <p class="muted">Biletinin bitmesine ${sureYaz(b.bitis - Date.now())} var. Bilet bitince 1 saat boyunca yeni bilet alınamaz.</p>
      <a class="btn" href="seri.html?s=${encodeURIComponent(b.seri)}">Salona gir</a>`;
    kutu.hidden = false;
  }

  // Üst menüye bilet butonu (HTML dosyalarına dokunmadan)
  function ustBilet() {
    const nav = $(".top nav");
    if (!nav) return;
    let a = nav.querySelector('a[href="bilet.html"], .uye-btn');
    if (!a) {
      a = document.createElement("a");
      a.className = "btn btn-small";
      nav.appendChild(a);
    }
    if (KAPI_ACIK) {
      a.classList.add("uye-btn");
      if (UYE && UYE.name) {
        a.href = MAGAZA + "/wallet.html";
        a.textContent = "👤 " + UYE.name;
        a.title = "Fizzy's Store hesabın";
        if (!nav.querySelector(".cikis-btn")) {
          const c = document.createElement("button");
          c.type = "button"; c.className = "navbtn cikis-btn"; c.textContent = "Çıkış";
          c.addEventListener("click", cikis);
          nav.appendChild(c);
        }
      } else {
        a.href = girisAdresi();
        a.textContent = "Giriş yap";
      }
    } else {
      a.href = "bilet.html";
      a.textContent = aktifBilet() ? "Biletim" : "Bilet al";
    }

    // Uygulama indirme bağlantısı (Discord içinde ve uygulamanın kendisinde gösterilmez)
    const uygulamada = UYGULAMADA;
    if (!DISCORD && !uygulamada && !nav.querySelector('a[href="indir.html"]')) {
      const i = document.createElement("a");
      i.href = "indir.html";
      i.textContent = "Uygulama";
      nav.insertBefore(i, a);
    }
    if (!nav.querySelector(".bildirim-btn")) bildirimButonu(nav, a);
  }

  // ------------------------------------------------------------ bildirimler
  // Yeni seri, bölüm ve fragman eklendiğinde tarayıcı bildirimi gönderilir.
  const UYGULAMADA = !!(window.chrome && window.chrome.webview);
  const BILDIRIM_ANAHTARI = A.bildirimAnahtari || "BMRKVJHPBDFDtdad6BOnkgFpgxxAlZ8Pn0E7ZtKo8VgjlwadXodtAL-82NeDGwwFFuf5RLvprVMiC2KHbAes7w0";
  const BILDIRIM_ADRES = String(A.videoSunucusu || "").trim().replace(/\/+$/, "") + "/bildirim";

  function anahtarCoz(b64) {
    const s = atob((b64 + "=".repeat((4 - b64.length % 4) % 4)).replace(/-/g, "+").replace(/_/g, "/"));
    return Uint8Array.from(s, c => c.charCodeAt(0));
  }
  // text/plain ile gönderilir; böylece tarayıcı ek bir ön izin isteği (preflight) yapmaz
  const aboneBildir = (abonelik, sil) => fetch(BILDIRIM_ADRES + "/abone.php", {
    method: "POST", headers: { "Content-Type": "text/plain" },
    body: JSON.stringify({ endpoint: abonelik.endpoint, sil: !!sil })
  });

  async function bildirimButonu(nav, once) {
    if (DISCORD || UYGULAMADA || !/^https:/.test(BILDIRIM_ADRES)) return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) return;
    const kayit = await Promise.race([navigator.serviceWorker.ready, new Promise(r => setTimeout(() => r(null), 6000))]);
    if (!kayit || nav.querySelector(".bildirim-btn")) return;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "navbtn bildirim-btn";
    nav.insertBefore(btn, once);
    const guncelle = async () => {
      const ab = await kayit.pushManager.getSubscription();
      btn.textContent = ab ? "🔔 Bildirimler açık" : "🔔 Bildirimleri aç";
      btn.title = ab ? "Yeni seri ve bölüm bildirimlerini kapatmak için tıkla" : "Yeni seri ve bölümler eklenince haber al";
      return ab;
    };
    const mevcut = await guncelle();
    // Abonelik sunucuda kaybolmasın diye günde bir kez yeniden bildirilir
    if (mevcut && Date.now() - (oku("cw-bildirim-t", 0) || 0) > 864e5) {
      aboneBildir(mevcut).then(() => yaz("cw-bildirim-t", Date.now())).catch(() => {});
    }

    btn.addEventListener("click", async () => {
      btn.disabled = true;
      try {
        const ab = await kayit.pushManager.getSubscription();
        if (ab) {
          if (confirm("Yeni seri ve bölüm bildirimleri kapatılsın mı?")) {
            await aboneBildir(ab, true).catch(() => {});
            await ab.unsubscribe();
          }
        } else {
          const izin = await Notification.requestPermission();
          if (izin !== "granted") {
            alert("Bildirimlere izin verilmedi. İzni tarayıcının adres çubuğundaki site ayarlarından açabilirsin.");
          } else {
            const yeni = await kayit.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: anahtarCoz(BILDIRIM_ANAHTARI) });
            const c = await aboneBildir(yeni);
            if (!c.ok) throw new Error("sunucu " + c.status);
            yaz("cw-bildirim-t", Date.now());
          }
        }
      } catch (err) {
        alert("Bildirimler açılamadı: " + err.message);
      }
      btn.disabled = false;
      guncelle();
    });
  }

  // ------------------------------------------------------------ Discord Activity
  // Discord'un verdiği oturum bilgileri sadece ilk sayfanın adresinde gelir;
  // sayfalar arasında geçerken kaybolmasınlar diye saklanır.
  function discordBilgileri() {
    const ANAHTAR = "cw-discord-oturum";
    const p = new URLSearchParams(location.search);
    if (p.has("frame_id")) {
      const sakla = {};
      for (const [k, v] of p) if (k !== "s" && k !== "b") sakla[k] = v;
      try { sessionStorage.setItem(ANAHTAR, JSON.stringify(sakla)); } catch {}
      return location.search;
    }
    try {
      const k = JSON.parse(sessionStorage.getItem(ANAHTAR));
      if (k) return "?" + new URLSearchParams(k).toString();
    } catch {}
    return null;
  }

  function discordBagla() {
    if (!DISCORD) return;
    const arama = discordBilgileri();
    if (!arama) return;
    const betik = document.createElement("script");
    betik.src = "js/discord-sdk.js";
    betik.onload = async () => {
      try {
        const SDK = window.CWDiscord.DiscordSDK;
        SDK.prototype._getSearch = () => arama;
        const sdk = new SDK(DISCORD_ID);
        await sdk.ready();
        window.cwDiscord = sdk;
      } catch (err) {
        console.warn("Discord bağlantısı kurulamadı:", err);
      }
    };
    document.head.appendChild(betik);
  }

  // ------------------------------------------------------------ başlat
  document.addEventListener("DOMContentLoaded", async () => {
    discordBagla();
    if (KAPI_ACIK) {
      const u = await uyelik();
      if (u.durum === "acik" || u.durum === "pass") UYE = u;
      if (KAPI_SAYFALARI.includes(document.body.dataset.sayfa) && u.durum !== "acik") {
        ustBilet();
        kapi(u);
        document.body.classList.remove("yukleniyor");
        return;
      }
    }
    ustBilet();
    document.querySelectorAll("[data-site-adi]").forEach(el => (el.textContent = A.siteAdi || "CW PLAY™ Sinema"));
    const s = sayfalar[document.body.dataset.sayfa];
    try { if (s) await s(); }
    catch (err) {
      console.error(err);
      const ana = $("#icerik");
      if (ana) ana.insertAdjacentHTML("afterbegin", `<p class="flash flash-error">Bir hata oluştu: ${esc(err.message)}</p>`);
    }
    document.querySelectorAll("[data-progress]").forEach(el => (el.style.width = Math.min(100, parseFloat(el.dataset.progress) * 100) + "%"));
    document.body.classList.remove("yukleniyor");
  });
})();
