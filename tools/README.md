# Doğrulama araçları

Uygulamayı tarayıcı olmadan (jsdom) yükleyip sınar. Uygulama dosyaları bu klasörün bir üstünde (depo kökü).

```
npm install          # ilk seferde
npm run selftest     # uygulamadaki "Kendini sına" (v0.17: 40/40)
npm run akis         # arayüz akışı senaryosu (ui-akis.js; v0.17 için yazıldı)
npm run tahmin       # veriden tahmin: JS (tahmin-js.js) ile bağımsız Python (ref/) aynı mı
```

- `boot.js`: index.html'deki betikleri sırayla çalıştırır, `window.K63`'ü verir. `K63DIR` ortam değişkeniyle başka bir klasör denenebilir.
- `ref/`: Python referans hesapları (numpy). `ref.py` parkur ve plan, `ref_fc2.py` GPX analizi, `tahmin_karsilastir.py` parkur boyunca birikimli süre karşılaştırması.
- `veri/`: kullanıcının iki antrenman koşusu (27 Eylül, 4 Ekim; Strava GPX). Kişisel veri, yayınlanmaz.
- `out/`: üretilen ara dosyalar (git'e girmez).
