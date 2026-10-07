// ============================================================
//  CW PLAY Sinema - AYARLAR
//  Sitede değiştirmen gereken her şey bu dosyada.
// ============================================================
window.CW_AYAR = {
  siteAdi: "CW PLAY Sinema",

  // Videoların durduğu klasör (sitenin ana klasörüne göre)
  videoKlasoru: "videos",
  videoSunucusu: "https://medya.cwplaymusic.com",

  // GitHub deposu: doldurursan site videos klasörünü KENDİSİ tarar,
  // yeni video yükleyince hiçbir listeyi güncellemen gerekmez.
  // Boş bırakırsan js/liste.js dosyasındaki liste kullanılır.
  github: {
    kullanici: "",   // örn: "coldworkspaceentertainment"
    depo: "",        // örn: "series"
    dal: "main"
  },

  // true  -> bilet almak için bilet kodu gerekir (bilet-uretici.html ile üretilir)
  // false -> herkes ücretsiz bilet alabilir (sadece isim + koltuk seçer)
  biletKoduGerekli: true,

  // Kod gerekmeyen modda biletin kaç gün geçerli olacağı
  ucretsizBiletGun: 30,

  // bilet-uretici.html'in verdiği satırları buraya yapıştır.
  // Bir kodu iptal etmek için satırını silmen yeterli.
  biletler: [
    { h: "e5fe69fc27057c43499543e3515ba8d36c666be007fc19797dc3d81278429c54", seri: "the-7th-cycle-of-death", gun: 30, sonTarih: "2026-10-16" },
    { h: "fd5c28d597445df574dc99ce0bae43ff3aa065bb7070cfbb9fb786070686d2eb", seri: "the-7th-cycle-of-death", gun: 30, sonTarih: "2026-10-16" },
    { h: "0354427a2ee9a64a95eb7fbce95efe332426314c887fa5b4398d21d4b4cd98b4", seri: "the-7th-cycle-of-death", gun: 30, sonTarih: "2026-10-16" },
    { h: "f14332fe4112fbc32b29d7666c5548fbf0ae00e35cc9dc8e04f8798500c41ef4", seri: "the-7th-cycle-of-death", gun: 30, sonTarih: "2026-10-16" },
    { h: "767143d41f902bc8b3f017dff230b26d6ff669811375ac6987557f6096d78dc5", seri: "the-7th-cycle-of-death", gun: 30, sonTarih: "2026-10-16" },
    { h: "fff63511f66d1a6d204ddeaa9c303f5b906fb72946dd99e96ae21f5d29025327", seri: "the-7th-cycle-of-death", gun: 30, sonTarih: "275760-02-15", not: "For Efe Ozen" },
    { h: "e9f05c646d6859adb3341a73ca8369c31d79da4089bc655fe1191a5425f8e00d", seri: "the-7th-cycle-of-death", gun: 30, not: "DEX 287" },
  ]
};
