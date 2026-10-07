(() => {
  "use strict";
  const A = window.CW_AYAR || {};
  const KLASOR = (A.videoKlasoru || "videos").replace(/\/+$/, "");
  const $ = (s, r = document) => r.querySelector(s);
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const cmp = (a, b) => a.localeCompare(b, "tr", { numeric: true, sensitivity: "base" });
  // Videolar başka bir sunucudaysa (ayarlar.js > videoSunucusu) tüm medya oradan gelir
  const SUNUCU = String(A.videoSunucusu || "").trim().replace(/\/+$/, "");
  const yol = p => (SUNUCU ? SUNUCU + "/" : "") + p.split("/").map(encodeURIComponent).join("/");
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

  let _kutuphane = null;
  async function kutuphane() {
    if (_kutuphane) return _kutuphane;
    const tum = await dosyalar();
    const kume = new Set(tum);
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
      const adlar = Object.keys(sezonlar).sort((a, b) => (a === "" ? -1 : b === "" ? 1 : cmp(a, b)));
      // Videosu olmayan ama posteri ya da bilgisi olan seri "Yakında" olarak gösterilir
      const yakinda = !adlar.length;
      if (yakinda && !poster && !infoVar && !(window.CW_BILGI || {})[klasor]) continue;

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
          const kokAd = tam.replace(/\.[^.]+$/, "");
          const kucuk = [".jpg", ".jpeg", ".png", ".webp"].map(e => kokAd + e).find(x => kume.has(x)) || null;
          const b = { no: i + 1, baslik: temizBaslik(rel.split("/").pop()), yol: tam, kucuk, sezon: ad, seri: slug };
          b.sira = duz.push(b);
          return b;
        });
        return { ad: ad || "Bölümler", bolumler };
      });
      seriler.push({
        slug, klasor, baslik: info.title || klasor, aciklama: info.description || "",
        yil: info.year || "", tur: info.genre || "", yas: info.age || "", one: !!info.featured,
        poster, banner, sezonlar: sezonListesi, duz,
        yakinda, cikis: info.comingSoon || ""
      });
    }
    _kutuphane = { seriler, slug: Object.fromEntries(seriler.map(s => [s.slug, s])) };
    return _kutuphane;
  }

  // ------------------------------------------------------------ ortak parçalar
  function ilerlemeler() { return oku("cw-ilerleme", {}); }

  function posterHTML(s) {
    return `<a class="poster" href="seri.html?s=${encodeURIComponent(s.slug)}">
      ${s.poster ? `<img src="${esc(yol(s.poster))}" alt="" loading="lazy">` : `<span class="poster-type">${esc(s.baslik)}</span>`}
      ${s.yakinda ? `<span class="lock">Yakında</span>` : ""}
      <span class="poster-cap"><b>${esc(s.baslik)}</b><small>${s.yakinda ? esc(s.cikis || "Yakında") : s.duz.length + " bölüm"}</small></span></a>`;
  }
  function heroHTML(s, butonlar) {
    const arka = s.banner ? `<img class="hero-bg" src="${esc(yol(s.banner))}" alt="">`
      : s.poster ? `<img class="hero-bg hero-bg-blur" src="${esc(yol(s.poster))}" alt="">` : "";
    const meta = [s.yil, s.tur].filter(Boolean).map(x => `<span>${esc(x)}</span>`).join("")
      + (s.yas ? `<span class="age">${esc(s.yas)}</span>` : "")
      + (s.yakinda ? `<span class="soon">Yakında${s.cikis ? " · " + esc(s.cikis) : ""}</span>` : `<span>${s.duz.length} bölüm</span>`);
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
  const sayfalar = {};

  sayfalar.salon = async () => {
    const lib = await kutuphane();
    const ana = $("#icerik");
    if (!lib.seriler.length) return (ana.innerHTML = bos(bosMesaj));
    const one = lib.seriler.find(s => s.one) || lib.seriler.find(s => !s.yakinda) || lib.seriler[0];
    let html = `<section class="hero">${heroHTML(one,
      `<a class="btn" href="seri.html?s=${encodeURIComponent(one.slug)}">${one.yakinda ? "Seriyi incele" : "Bölümleri gör"}</a>`)}</section>`;

    const ilr = ilerlemeler();
    const devam = [];
    for (const s of lib.seriler) for (const b of s.duz) {
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
    const gosterimde = lib.seriler.filter(s => !s.yakinda), yakindakiler = lib.seriler.filter(s => s.yakinda);
    if (gosterimde.length) html += `<section class="row"><h2>Gösterimdeki seriler</h2><div class="rail">${gosterimde.map(s => posterHTML(s)).join("")}</div></section>`;
    if (yakindakiler.length) html += `<section class="row"><h2>Yakında</h2><div class="rail">${yakindakiler.map(s => posterHTML(s)).join("")}</div></section>`;
    ana.innerHTML = html;
  };

  sayfalar.seri = async () => {
    const lib = await kutuphane();
    const s = lib.slug[params.get("s")];
    const ana = $("#icerik");
    if (!s) return (ana.innerHTML = `<section class="empty"><h1>Seri bulunamadı</h1><a class="btn" href="index.html">Salona dön</a></section>`);
    document.title = `${s.baslik} · ${A.siteAdi}`;
    if (s.yakinda) {
      ana.innerHTML = `<section class="hero hero-series">${heroHTML(s, `<span class="soon-big">Çok yakında burada</span>`)}</section>`;
      return;
    }
    const ilr = ilerlemeler();
    const izlenen = s.duz.filter(b => ilr[b.yol]).sort((a, b) => ilr[b.yol].t - ilr[a.yol].t)[0];
    let devam = s.duz[0];
    if (izlenen) {
      const p = ilr[izlenen.yol];
      devam = p.dur && p.pos / p.dur >= 0.95 && s.duz[izlenen.sira] ? s.duz[izlenen.sira] : izlenen;
    }
    const buton = `<a class="btn" href="izle.html?s=${encodeURIComponent(s.slug)}&b=${devam.sira}">${izlenen ? "Devam et" : "İzlemeye başla"}</a>`;
    let html = `<section class="hero hero-series">${heroHTML(s, buton)}</section>`;
    for (const se of s.sezonlar) {
      html += `<section class="episodes"><h2>${esc(se.ad)}</h2><ol class="ep-list">${se.bolumler.map(b => {
        const p = ilr[b.yol];
        const link = `izle.html?s=${encodeURIComponent(s.slug)}&b=${b.sira}`;
        return `<li><a class="ep" href="${link}"><span class="ep-num">${b.no}</span>
          <span class="ep-img">${b.kucuk ? `<img src="${esc(yol(b.kucuk))}" alt="" loading="lazy">` : ""}</span>
          <span class="ep-title">${esc(b.baslik)}${p && p.dur ? `<span class="bar"><i data-progress="${(p.pos / p.dur).toFixed(3)}"></i></span>` : ""}</span></a></li>`;
      }).join("")}</ol></section>`;
    }
    ana.innerHTML = html;
  };

  sayfalar.izle = async () => {
    const lib = await kutuphane();
    const s = lib.slug[params.get("s")];
    const b = s?.duz[(parseInt(params.get("b"), 10) || 1) - 1];
    if (!s || !b) return location.replace("index.html");

    const sonraki = s.duz[b.sira] || null;
    const sezon = s.sezonlar.find(x => x.bolumler.includes(b));
    document.title = `${b.no}. ${b.baslik} · ${s.baslik}`;
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
        <h1>${b.no}. ${esc(b.baslik)}</h1></div>
        ${sonraki ? `<a class="btn btn-ghost" href="izle.html?s=${encodeURIComponent(s.slug)}&b=${sonraki.sira}">Sonraki bölüm</a>` : ""}</div>
      <ol class="ep-list ep-list-compact">${sezon.bolumler.map(e => `<li><a class="ep${e === b ? " ep-current" : ""}"
        href="izle.html?s=${encodeURIComponent(s.slug)}&b=${e.sira}"><span class="ep-num">${e.no}</span><span class="ep-title">${esc(e.baslik)}</span></a></li>`).join("")}</ol>
    </section>`;

    const video = $("#player"), kutu = $("#player-wrap");
    video.src = yol(b.yol);
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

  // ------------------------------------------------------------ başlat
  document.addEventListener("DOMContentLoaded", async () => {
    document.querySelectorAll("[data-site-adi]").forEach(el => (el.textContent = A.siteAdi || "CW PLAY Sinema"));
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
