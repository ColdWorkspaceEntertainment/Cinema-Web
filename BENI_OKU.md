# CW PLAY Sinema (düz HTML / CSS / JS)

Sunucu yok. GitHub Pages'te çalışır, bilgisayarında `index.html`'e çift tıklayınca da açılır.

## Dosyalar
- `index.html` salon (ana sayfa), `seri.html` bölümler, `izle.html` oynatıcı, `bilet.html` bilet alma
- `bilet-uretici.html` bilet kodu üretme sayfası (sadece sen kullanırsın)
- `js/ayarlar.js` tüm ayarlar ve geçerli bilet listesi
- `js/liste.js` video listesi (GitHub ayarı boşsa kullanılır)
- `videos/` seriler ve bölümler
- `CNAME` → series.cwplaymusic.com

## Videolar klasörden nasıl gelir
`js/ayarlar.js` içinde `github` kısmına kullanıcı adını ve depo adını yaz. Site, depodaki `videos` klasörünü kendisi tarar; yeni bölüm yükleyince başka hiçbir şeyi değiştirmen gerekmez.
GitHub ayarını boş bırakırsan dosya adlarını `js/liste.js`'e yazman gerekir (tarayıcı bir klasörün içini tek başına göremez).

## Bilet sistemi
1. `bilet-uretici.html`'i aç, kod üret.
2. "Satırları" `js/ayarlar.js` içindeki `biletler` listesine yapıştır ve GitHub'a yükle.
3. "Kodları" izleyicilere ver. Bilet sayfasında koltuk seçip kodu girerler.

Bir kodu iptal etmek için satırını sil; o kodla alınan bilet de geçersiz olur.
Herkese ücretsiz bilet vermek istersen `biletKoduGerekli: false` yap.

## GitHub Pages'e kurulum
1. Yeni bir depo aç (ör. `series`) ve bu klasördeki her şeyi yükle.
2. Settings > Pages > Branch: `main`, klasör: `/ (root)`.
3. Güzel Hosting cPanel > Zone Editor: `series` için CNAME kaydı ekle → `KULLANICIADI.github.io`
4. Pages ayarında "Enforce HTTPS"i aç.
