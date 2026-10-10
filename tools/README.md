# Doğrulama araçları

Uygulamayı tarayıcı olmadan (jsdom) yükleyip sınar. Uygulama dosyaları bu klasörün bir üstünde (depo kökü).

```
npm install          # ilk seferde
npm run selftest     # uygulamadaki "Kendini sına" (v0.20: 44/44)
npm run akis         # arayüz akışı senaryosu (ui-akis.js; v0.17 senaryosu + 2B | 3B anahtarı)
npm run harita       # 3B verisi uygulamanın çözücüleriyle: arazi = resmî GPX rakımı, yön, yollar, önbellek listesi
npm run tahmin       # veriden tahmin: JS (tahmin-js.js) ile bağımsız Python (ref/) aynı mı
```

- `boot.js`: index.html'deki betikleri sırayla çalıştırır, `window.K63`'ü verir. `K63DIR` ortam değişkeniyle başka bir klasör denenebilir.
- `ref/`: Python referans hesapları (numpy). `ref.py` parkur ve plan, `ref_fc2.py` GPX analizi, `tahmin_karsilastir.py` parkur boyunca birikimli süre karşılaştırması.
- `veri/`: kullanıcının iki antrenman koşusu (27 Eylül, 4 Ekim; Strava GPX). Kişisel veri, git dışı; yalnızca yerelde. `akis` ve `tahmin` bunlar olmadan çalışmaz.
- `3b/uret.py`: 3B arazi verisini üretir (kökteki `terrain.bin`, `terrain.jpg`, `trails.json`). İnternet ve `pip install rasterio numpy pillow` ister (sanal ortamda); depo kökünden `python3 -I tools/3b/uret.py`, kaynakları yeniden indirmek için `--yeniden`. Çıktıyı `npm run harita` ile denetle.
- `out/`: üretilen ara dosyalar (git'e girmez).
