// ============================================================
//  CW PLAY Sinema - AYARLAR
//  Sitede değiştirmen gereken her şey bu dosyada.
// ============================================================
window.CW_AYAR = {
  siteAdi: "CW PLAY Sinema",

  // Videoların durduğu klasör (sitenin ana klasörüne göre)
  videoKlasoru: "videos",

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
    // { h: "....", seri: "all", gun: 30, not: "örnek" },
        { h: "ca3d45466b1bc377056ba6ee513071aa200b5b5b08156785893ad327f78cbef4", seri: "all", gun: 30, sonTarih: "2026-10-07", not: "CWPLAY" },
  ]
};
