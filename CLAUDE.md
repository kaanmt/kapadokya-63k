# Kapadokya 63K Planlayıcı: Claude Code çalışma kuralları

Bu depo, Salomon Cappadocia Ultra-Trail 63K (17 Ekim 2026, 07:00, Ürgüp) için Türkçe, çevrimdışı çalışan bir PWA'dır. Kullanıcı yarışı destek ekibi olmadan koşuyor; uygulamayı arkadaşları da kullanıyor. Proje claude.ai'da bir sohbette geliştirildi ve 10 Ekim 2026'da buraya taşındı; o sohbetteki her karar `docs/PLAN.md` ve `docs/arsiv/` içinde.

**Her oturumun başında:** bu dosyayı ve `docs/PLAN.md`'yi oku. Kullanıcıyla Türkçe konuş.

## Kesin kurallar (kullanıcının kararları)

1. **Kod yalnızca kullanıcı açıkça "koda uygula" (ya da "kodla") deyince yazılır.** O zamana kadar analiz, görüş, öneri ve plan belgesi. "Hazırla" gibi bir onay yalnızca söylenen işi kapsar.
2. **Varsayım yapma, doğrula.** Beklenmeyen bir sonucu tahminle açıklama; ölç, kodda bak, kaynağa bak. Veri yoksa söyle, hipotezi etiketle.
3. **Tasarım ilkesi:** başka bir yerin kopyası gibi duran şey eklenmez, gereksiz kalabalık yapılmaz. Seçim tek yerde (Plan sekmesindeki A/B/C + Plan | Veri), diğer sekmeler onu izler. Açıklayıcı küçük notlar ⓘ arkasında (`K.infoBtn`).
4. **Zaman kaygısıyla kapsam daraltma önerme.** Kendi görüşünü çekinmeden söyle; geri bildirimde fikir üret.
5. **Uygulama girdileriyle ilgili sorular uygulamada sorulur**, sohbette değil.
6. **Plan belgesi `docs/PLAN.md`:** her kullanıcı mesajından sonra önce oku, sonra güncelle, test dalına commit et. Onay isteme; yanıtında ne değiştiğini tek cümleyle söyle. Biçim korunur: en üstte checkbox'lı Sende / Karar bekleyen / Bende / Tamamlananlar / Takvim; Günlük en yeni üstte, her giriş 2-4 kısa madde; belge ~20 KB'ı geçerse eski girişler özetlenip `docs/arsiv/` altına taşınır.
7. **Sürüm numarası** her yeni sürümde bir artar (şu an 0.19 → sıradaki 0.20), sonek yok. Değişecek yerler: `app.js` içindeki `BUILD`, `sw.js` içindeki `VERSION` (`k63-0.20`). Yeni dosya eklenirse `sw.js` `ASSETS` listesine ve `app.js` içindeki `EXPECTED` sayısına da eklenir.
8. **Her sürüme ayrı test listesi:** `docs/test-listeleri/vX.md`, madde madde, kullanıcının o sürümde neyi denemesi gerektiği. Kullanıcı sonuçlarını aynı dosyaya işlenir (test günlüğü). Örnek: `docs/test-listeleri/v0.17.md`.
9. Hız birimi yok, yalnızca tempo (dk/km).

## Yayın akışı (Netlify, kredi sınırlı)

- **Tüm ara sürümler ve deneme yayınları `test` dalına** gider. Netlify dal yayını ücretsiz; adres `test--<site>.netlify.app`. Uygulama adreste `--` görünce turuncu "TEST ORTAMI" şeridi gösterir (`app.js`, `ENV`).
- **`main` dalına asla doğrudan push etme, birleştirme yapma.** Her `main` yayını 15 kredi (ücretsiz plan 300 kredi). Kilometre taşı (M1 = v0.12.1, M2 = v0.17, M3 = ?) yalnızca kullanıcı isteyince, `test` → `main` pull request'iyle olur; başlık "vX (Mn)", ör. "v0.17 (M2)". Ana adres: https://candid-zabaione-2be2ed.netlify.app/
- Değişiklikleri doğrudan `test` dalına gönder. Gereksiz yayın yaratmamak için `test`'e ayrı PR açma; doğrudan push mümkün değilse kullanıcıya söyle.
- **Geliştirme dosyaları sitede yayınlanmaz:** Netlify depo kökünü yayınlıyor (`publish = "."`); `netlify.toml` içindeki 404 kuralları `/docs/*`, `/tools/*`, `/CLAUDE.md`, `/.claude/*` yollarını kapatır (`404.html`). Kökte yeni bir geliştirme dosyası ya da klasörü açarsan kurala ekle. `tools/veri/` kişisel koşu GPX'leri içerir; uygulamaya ya da yayına koyma.

## Doğrulama (her push'tan önce)

```
cd tools && npm install        # ilk seferde (jsdom)
npm run selftest               # uygulamadaki "Kendini sına": şu an 44/44
npm run akis                   # arayüz akışı (v0.17 senaryosu + 2B | 3B anahtarı); yeni özellikte güncelle
npm run harita                 # 3B verisi: arazi = resmî GPX rakımı, yön, yollar, önbellek listesi
npm run tahmin                 # veriden tahmin: JS sonuçları = bağımsız Python hesabı (fark < 1e-7)
```

- Sayısal bir modeli değiştirdiysen bağımsız bir Python hesabıyla karşılaştır (`tools/ref/`); "çalışıyor gibi" yeterli değil.
- Yeni özelliğe uygulamanın kendi kendini sınamasına (`tools.js`, `runSelfTest`) kontrol ekle.
- Arayüz değişikliğinde 360 px genişlikte açık ve koyu temada ekran görüntüsüyle bak (Playwright varsa).
- Büyük değişiklikte ayrı bir ajanla kod incelemesi yaptır.
- Kullanıcıya "yaptım" demeden önce test listesini (`docs/test-listeleri/vX.md`) yaz.

## Uygulama yapısı

- Düz JavaScript, derleme yok. Modüller `window.K63` altında: `app.js` (sekmeler, profil grafiği, tema, ortam), `plan.js` (A/B/C planlayıcı, `selected()`, `dataResult()`), `calib.js` (GPX analizi ve veriden tahmin), `nutrition.js` (beslenme hedefleri ve takvim, Open-Meteo hava tahmini), `race.js` (yarış modu, kontrol listesi), `products.js` (24 ürün kataloğu), `map3d.js` (Profil'de 3B arazi görünümü, el yazımı WebGL 1), `tools.js` (kendini sına, rapor, yedek), `data.js` (resmî parkur: 25 m adım, 2520 nokta, 6 nokta), `nosleep.js`.
- Sekmeler: Profil / Plan / Beslenme / Yarış / Test.
- `localStorage` anahtarları `k63` ile başlar: `k63plan-v2`, `k63planview`, `k63calib-v3`, `k63nut-v2`, `k63race-v1`, `k63check-v1`, `k63tab`, `k63theme`, `k63profview` (2B | 3B). Yedek bu anahtarların hepsini taşır. Kayıt biçimi değişirse sürüm ekini artır ve eski kaydı açıkça geçersiz say.
- Service worker önbelleği `k63-<sürüm>`; çevrimdışı çalışma şart (yarışta çekim zayıf).
- 3B verisi uygulama dosyasıdır (kökte, yayınlanır, `sw.js` önbelleğinde): `terrain.bin` (Copernicus GLO-30), `terrain.jpg` (Sentinel-2), `trails.json` (OpenStreetMap, ODbL). Elle düzenlenmez; `tools/3b/uret.py` üretir (rasterio, numpy, pillow ister; indirilenler `tools/out/3b/`). Yalnızca 3B ilk açıldığında okunur. Atıf metinleri `map3d.js` içindeki ⓘ notunda ve haritanın köşesinde; kaldırma. jsdom'da WebGL yok: görsel değişiklikte gerçek tarayıcıda (Playwright + Chrome) ekran görüntüsüyle bak
- Hesap modelleri, yarış verisi (kesimler, ikmal) ve Garmin iş bölümü: `docs/PLAN.md` > Başvuru.

## Güncel durum (10 Ekim 2026)

- Ana adreste **v0.17 (M2)**. Test dalında **v0.19** (11 Ekim): v0.18'in 3B görünümü (Android'de denendi, tamam) + geri bildirim: yollar daha silik, parkura koyu kenar, kuzey oku, telefon yatayken Profil'de 2B grafik ya da 3B harita tam ekran (`app.js` `FULLQ` ve `style.css` ortam sorgusu aynı kalmalı), `manifest` dönme kilidi kalktı. Kullanıcı denemesi bekleniyor: `docs/test-listeleri/v0.19.md`. iPhone'da hiç denenmedi.
- Sıradaki: kullanıcının v0.19 geri bildirimi; tamamsa M3 = v1.0 (`test` → `main` pull request'i, yalnızca kullanıcı isteyince).
- Takvim: 12-13 Ekim dondurma (sonrası yalnızca hata düzeltme), 17 Ekim yarış.
- Yarıştan sonra: yarış GPX'iyle plan karşılaştırması ve yorulma şeklinin doğrulanması.

## Dosyalar

- `docs/PLAN.md`: plan ve günlük (tek doğru kaynak)
- `docs/arsiv/`: eski günlük girişleri ve ayrıntılı tablolar (kişisel veri içerir; git dışı, yalnızca yerelde, commit etme)
- `docs/test-listeleri/`: sürüm test listeleri
- `docs/rehberler/`: GitHub + Netlify, Garmin kurulum rehberleri
- `docs/garmin/`: FIT kurs dosyaları (gerçek saatte henüz denenmedi)
- `docs/arastirma/`: 3B veri ve lisans araştırması
- `tools/`: doğrulama araçları (jsdom, Python referans hesapları); `tools/3b/` 3B veri üretimi; `tools/veri/` koşu GPX'leri (git dışı, yalnızca yerelde)
