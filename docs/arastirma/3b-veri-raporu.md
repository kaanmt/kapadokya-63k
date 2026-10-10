# 3B görünüm için veri ve lisans araştırması (9 Ekim 2026, özet)

Soru: Profil sekmesine çevrimdışı 3B arazi görünümü için 30 m'den iyi yükseklik verisi ve tek patikalar (singletrack) gösterilebilir mi? Veri uygulamaya gömülecek (çalışma anında indirilmez); lisans, herkese açık bir web uygulamasında atıfla yeniden dağıtıma izin vermeli.

Alan: parkur kutusu yaklaşık enlem 38,596–38,672 K, boylam 34,805–34,910 D (9,1 × 8,4 km; payla ~11 × 10 km).

Bu bir mühendislik özeti, hukuki görüş değildir. HGM alıntıları arama sonucu özetlerinden alındı; ticari fiyatlar bayi sayfalarından ve değişebilir.

## Sonuç (önerilen bedava ve kaliteli birleşim)

| Katman | Kaynak | Lisans | Boyut (~11 × 10 km) |
|---|---|---|---|
| Arazi (yükseklik) | Copernicus DEM GLO-30 | Açık, atıf ister | ~0,25 MB ham (uint16 desimetre), sıkıştırılmış ~0,1–0,15 MB |
| Görüntü | Sentinel-2 L2A, 10 m, yaz (Temmuz–Eylül) bulutsuz kompozit, kendimiz üretiriz | Copernicus açık veri | ~0,2–0,4 MB (JPEG/WebP) |
| Patikalar | OpenStreetMap `highway=path|footway|track` | ODbL | ~0,1–0,3 MB |

Toplam ~1 MB. Tek patikalar 10 m görüntüde seçilmez (0,5–1,5 m genişlik); araziye oturtulmuş çizgi olarak çizilir. Yarış parkuru kalın, ayrı renk. Gölgeleme (hillshade) ve eğim tonlaması vadi okunurluğunu en çok artırır. 30 m: ana vadiler, sırtlar, Uçhisar tepesi görünür; dar kanyon tabanları yuvarlanır; peribacaları görünmez. GLO-30 bir yüzey modelidir (bina ve ağaç yüksek görünür).

İsteğe bağlı: GLO-30'u 15 m'ye bikübik yükseltip hafif yumuşatmak görünümü güzelleştirir (yeni bilgi eklemez). Parkur çizgisinin yüksekliği DEM'den örneklenir (çizgi araziye otursun); sayılar (km, rakım, eğim) uygulamadaki resmî GPX'ten kalır.

## Elenen seçenekler (neden)

- **Copernicus EEA-10 (10 m):** Türkiye'yi kapsıyor ama yalnızca yetkili kurumlara açık; bireye ve yeniden dağıtıma kapalı.
- **ASF ALOS PALSAR RTC "12,5 m":** gerçek 12,5 m değil; ABD dışı için SRTM 30 m'den yeniden örneklenmiş. GLO-30'dan kötü.
- **TanDEM-X 12 m:** yalnızca onaylı bilimsel projelere; yeniden dağıtılamaz.
- **HGM SYM5 / SYM12 / SAM12:** gerçek ve tüzel kişilere satılmıyor; kamu kurumunun aldığı veri de çoğaltılıp yayımlanamaz. DTED-2 (~30 m) satılıyor ama GLO-30'dan iyi değil ve telif kısıtlı.
- **Ticari 5 m (Airbus WorldDEM Neo ~€800–1.000 / 110 km²; NTT AW3D; Intermap):** standart lisans genelde dahili kullanım; herkese açık uygulamada gömmek için yazılı izin gerekir. Dik yamaçta hata artar.
- **Görüntü:** Esri, Google, Mapbox, Bing, MapTiler çevrimdışı saklama ve yeniden dağıtıma izin vermez. TKGM/HGM ortofotoları açık lisanslı değil. EOX Sentinel-2 cloudless: yalnızca **2016** sürümü CC BY 4.0; 2018 ve sonrası CC BY-NC-SA (kullanmayın).
- **Patika kaynakları:** Strava Heatmap yalnızca OSM'ye çizim için izinli; Wikiloc yalnızca kişisel kullanım. Gömülemez. OSM tek yasal kaynak.

## OSM kapsamını ölçme

overpass-turbo sorgusu:

```
way[highway~"path|footway|track"](38.59,34.80,38.68,34.92);
out geom;
```

Sonra resmî yarış GPX'iyle karşılaştır: parkur noktalarının yüzde kaçı bir OSM yoluna 10–15 m'den yakın. Eksikler kullanıcı isterse OSM'ye eklenebilir (Strava izni yalnızca bunun için).

## ODbL uyumu

- Ekranda tıklama gerektirmeden "© OpenStreetMap contributors" (openstreetmap.org/copyright bağlantılı).
- OSM çıkarımını ayrı dosyada tut; "OSM verisi ODbL lisanslıdır" notu ve bağlantı.
- Yarış GPX'i ayrı katman/dosya kalsın (OSM'den türetilmiş veritabanına karışmasın). Uygulama kodu ODbL'ye tabi olmaz.

## Gereken atıf metinleri

- "produced using Copernicus WorldDEM-30 © DLR e.V. 2010-2014 and © Airbus Defence and Space GmbH 2014-2018 provided under COPERNICUS by the European Union and ESA; all rights reserved"
- Yasal not: "The organisations in charge of the Copernicus programme by law or by delegation do not incur any liability for any use of the Copernicus WorldDEM-30"
- "Contains modified Copernicus Sentinel data 2025" (EOX 2016 kullanılırsa: "Sentinel-2 cloudless - https://s2maps.eu by EOX IT Services GmbH (Contains modified Copernicus Sentinel data 2016 & 2017)")
- "© OpenStreetMap contributors" + "OSM verisi ODbL lisanslıdır"

## Teknik notlar

- WebGL doku boyutu: Android'de 4096 px güvenli sınır (8192 yalnızca ~%76).
- 30 m ızgara ~123 bin nokta; 10 m ~1,1 M nokta / ~2,2 M üçgen (düşük telefonlarda ayrıntı seviyesi gerekir).
- Çizim yalnızca etkileşimde (sürekli döngü yok), pil için.
- Yeni dosyalar `sw.js` ASSETS listesine ve `app.js` EXPECTED sayısına eklenir.

## Veri erişimi

claude.ai sohbet ortamından Copernicus, Sentinel ve Overpass erişilemedi (izin listesi). Claude Code'da: bulut ortamında ağ erişimi "Custom" (ilgili alan adları) ya da "Full" yapılmalı; yerel çalışmada bilgisayarın interneti kullanılır. Copernicus Data Space ve Sentinel için ücretsiz hesap gerekebilir (kullanıcı açar).

## Başlıca kaynaklar

- Copernicus DEM ürün el kitabı ve erişim kategorileri: dataspace.copernicus.eu
- ASF RTC ürün kılavuzu: asf.alaska.edu (rtc_product_guide_v1.2.pdf); NASA Earthdata ALOS PALSAR RTC
- TanDEM-X bilim hizmeti: tandemx-science.dlr.de
- HGM ürün ve telif sayfaları: harita.gov.tr
- EOX Sentinel-2 cloudless lisansları: eox.at, cloudless.eox.at/pricing
- OSMF Produced Work kılavuzu: osmfoundation.org; OSM wiki Strava sayfası
- Esri, Google Map Tiles politikaları; Wikiloc kullanım koşulları
