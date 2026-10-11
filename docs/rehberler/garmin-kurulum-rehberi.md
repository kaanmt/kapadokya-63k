# Kapadokya 63K: Garmin Fenix ve Forerunner kurulum rehberi

Bu rehber, Kapadokya 63K parkurunu Garmin saatine yüklemek ve uygulamayla birlikte kullanmak için. Menü adları saat modeline ve yazılım sürümüne göre küçük farklar gösterebilir. Bu rehber **Fenix 8 AMOLED 47 mm** için yazıldı; Forerunner'larda özellikler modele göre değişir.

## Uygulama ile saat nasıl paylaşıyor?

- **Saat:** koşarken süre, mesafe, tempo, rota, tırmanış bilgisi, uyarılar ve beslenme alarmı.
- **Uygulama (Yarış sekmesi):** kontrol noktasında "CP'ye vardım" ile kesim payı ve plana fark, sonraki sektörün tempo ve eğim özeti.
- Koşarken telefona bakman gerekmez. Telefon ekranı kendi kapansın.

## Dosyalar

| Dosya | İçerik |
|---|---|
| `kapadokya-63k-kurs.fit` | Resmî 2026 parkuru + **6 kontrol noktası** (önerilen) |
| `kapadokya-63k-kurs-dik-noktali.fit` | Aynısı + **15 dik kısım işareti** (%15 üstü eğim) |

**İkisinden yalnızca birini yükle.** Aynı isimli iki kurs saatte karışıklık yaratır.

Kontrol noktası adları kısa ve Türkçe karaktersiz, kesim **saati** (start 07:00 varsayımıyla) adın içinde:

| Ad (saatte) | Nokta | Parkur km | Kesim süresi | Kesim saati |
|---|---|---|---|---|
| CP1 Ibr 09:00 | İbrahimpaşa | 11,0 | 2:00 | 09:00 |
| CP2 Uch 12:00 | Uçhisar | 27,0 | 5:00 | 12:00 |
| CP3 Gor 14:00 | Göreme | 37,1 | 7:00 | 14:00 |
| CP4 Cav 16:30 | Çavuşin | 45,8 | 9:30 | 16:30 |
| CP5 Akd 18:00 | Akdağ | 52,2 | 11:00 | 18:00 |
| FINIS 19:30 | Finiş (Ürgüp) | 63,0 | 12:30 | 19:30 |

Dik kısım işaretleri "DIK CIKIS %36" veya "DIK INIS %24" gibi adlandırıldı (sayı, o kısımdaki en dik eğim yüzdesi).

## Adım 1: Kursu saate yükle

### Yol A: Garmin Connect web (önerilen, bilgisayardan)
1. connect.garmin.com'a gir.
2. **Eğitim ve Planlama (Training & Planning) > Kurslar (Courses) > İçe Aktar (Import)**.
3. `.fit` dosyasını seç, kursu kaydet.
4. Kursu aç, **Cihaza Gönder (Send to Device)** de ve saati senkronla (telefondaki Garmin Connect uygulaması üzerinden).
5. Kurs "Etkinlik" (Activity) olarak görünürse yanlış yerden yüklemişsin; "Veri İçe Aktar" yerine **Kurslar > İçe Aktar** kullan.

### Yol B: USB ile kopyalama (yedek)
1. Saati USB ile bilgisayara bağla, saat bir sürücü olarak açılır.
2. `.fit` dosyasını saatteki `GARMIN/NewFiles` klasörüne kopyala (olmazsa `GARMIN/Courses`).
3. Saati çıkar. Dosya Kurslar menüsünde görünmeli. Klasör adı modele göre değişebilir; Yol A daha güvenli.

### Yol C: Yedek, dosya sorun çıkarırsa
1. Resmî GPX'i (`CMT_2026_v1.0.gpx`) Yol A'daki gibi Garmin Connect'e **kurs olarak** yükle.
2. Garmin, üçüncü taraf GPX'teki noktaların korunmayabileceğini söylüyor. Bu yüzden Connect'teki kurs düzenleyicide **6 kontrol noktasını kurs noktası (course point) olarak elle ekle**. Nokta adları ve koordinatlar:

| Ad | Enlem | Boylam | Rakım (m) |
|---|---|---|---|
| CP1 Ibr 09:00 | 38,598428 | 34,844043 | 1289 |
| CP2 Uch 12:00 | 38,629874 | 34,806091 | 1340 |
| CP3 Gor 14:00 | 38,636822 | 34,853150 | 1220 |
| CP4 Cav 16:30 | 38,668334 | 34,841938 | 1037 |
| CP5 Akd 18:00 | 38,664081 | 34,889295 | 1135 |
| FINIS 19:30 | 38,631053 | 34,909584 | 1080 |

3. Kursu saate gönder (Yol A, adım 4).

## Adım 2: Saatte kursu başlat ve ekranları ayarla

1. Saatte **Trail Run** (veya koştuğun spor profili) aç, **Navigasyon / Kurslar** menüsünden kursu seç ve "Kursu yap" (Do Course) ile başlat.
2. Veri ekranlarına **Up Ahead** (yaklaşan kurs noktaları, kalan mesafe) ve **ClimbPro** (yaklaşan tırmanış) ekle. Modele göre ekran adları değişebilir.
3. Rota dışı uyarısı saatte kurs navigasyonuyla birlikte gelir; uygulamadaki rota dışı uyarısına gerek kalmaz (uygulamadakini yedek say).
4. **Up Ahead'de noktalar görünmüyorsa:** kurs noktaları olarak değil, sıradan nokta olarak yüklenmiş olabilir. Yol C ile elle ekle.

## Adım 3: PacePro planı (eğime göre hedef tempo)

1. Garmin Connect uygulamasında **PacePro** planı oluştur: kursu seç (Kapadokya 63K), hedef süreyi gir, stratejide eğime göre ayarlanan seçeneği seç.
2. **Hangi süreyi gireceksin?** Uygulamanın **Plan sekmesindeki "Garmin saat için" kartında** her senaryo için **PacePro süresi** yazar. Bu, hedef bitiş süresinden durma sürelerinin çıkarılmış hâlidir (varsayılan değerlerle A: 9:45, B: 10:37, C: 11:22). Sebep: PacePro kontrol noktalarındaki duraklamaları ve kesim saatlerini bilmez.
3. Planı saate gönder, koşu öncesi saatte PacePro'yu başlat.
4. PacePro size **km bölümlerinde yokuş ve inişe göre** hedef tempo verir; uygulamanın sektör tempo tablosuyla karşılaştır, büyük bir fark varsa kendi antrenman verine göre hangisine güveneceğini sen seç.

## Adım 4: Beslenme alarmı

1. Aktivite ayarlarında **Uyarılar (Alerts) > Yeni ekle > Zaman**, **tekrarlayan** olarak seç (ör. her 30 dakikada bir).
2. Alarmın aralığını beslenme planı belli olunca netleştireceğiz. Uygulamadaki ses sadece "CP'ye vardım" onayı için; asıl hatırlatıcı saatte.

## Adım 5: Pil

- Fenix 8 AMOLED 47 mm için çoklu bant, tüm uyduların açık olduğu modda kılavuz değeri yaklaşık 35 saat, yani 12,5 saatlik yarış için yeterli. Rakamlar yaşa ve ekran ayarlarına göre değişir.
- **Yarıştan 1-2 hafta önce** aynı ayarlarla 3-4 saatlik bir antrenmanda pil düşüşünü ölç, sonra yarış süresine oranla.

## Yarış sabahı saat kontrol listesi

- [ ] Saat tam şarjlı, telefonla senkron
- [ ] Kurs saatte yüklü, "Up Ahead" ve "ClimbPro" ekranları açık
- [ ] PacePro planı yüklü (kullanacaksan)
- [ ] Beslenme alarmı kurulu
- [ ] GPS/uydu modu yarışa uygun (antrenmanda denediğin mod)
- [ ] Telefon: Chrome'da uygulamayı aç, yarış sekmesinde planı seç, pil tasarrufu kapalı

## Arkadaşlar için (Fenix, Forerunner)

- Aynı dosya Garmin'de çalışmalı. Forerunner'larda kurs noktası sınırı daha düşük olabilir (kaynaklara göre 50 civarı); 6 nokta dosyası sorun çıkarmaz, 21 noktalı dik kısımlı dosya da sınırın altında.
- **ClimbPro ve PacePro desteği modele göre değişir.** Kendi modelinin kılavuzunda kontrol et. Yoksa saat yine kurs ve rota dışı uyarısı sağlar, tırmanış ve tempo bilgisi için uygulamanın sektör tablosuna bakılabilir.

## Dürüst notlar

- FIT kurs dosyaları spesifikasyona göre üretildi ve bağımsız bir kod çözücüyle doğrulandı (yapı, mesafeler, zamanlar, nokta adları). **Gerçek bir Garmin saatte henüz denenmedi.** Sorun çıkarsa Yol C.
- Kurs içindeki zaman damgaları yapay (10 dk/km varsayımıyla); saatin kurs üzerinden gösterdiği tempo veya tahmini varış bilgisi için kullanma.
- Ad uzunluğu sınırı yüzünden kontrol noktası adlarında kısaltma ve kesim saati var; saat 07:00 başlangıcı varsayıyor.

## Kaynaklar

- Garmin kurs içe aktarma adımları ve GPX noktalarının korunmaması uyarısı: https://www.itechguides.com/how-to-add-gpx-routes-to-a-garmin-gps-watch/ ve https://rottenwifi.com/how-to-add-gpx-routes-to-a-garmin-gps-watch/
- GPX noktalarının FIT kurs noktasına çevrilmesi ve Up Ahead: https://github.com/mshroyer/coursepointer
- Garmin forumu, GPX noktalarının Up Ahead ile uyumu: https://forums.garmin.com/apps-software/mobile-apps-web/f/garmin-connect-web/340060/when-importing-a-gpx-course-with-waypoints-automatically-convert-waypoints-to-course-points
- PacePro ve eğime göre tempo planı: https://tomsguide.com/wellness/smartwatches/ive-run-14-marathons-heres-how-i-set-up-my-garmin-watch-to-help-me-pace-them
- Fenix 8 kullanım kılavuzu (PacePro ve ClimbPro bölümleri): https://www.adorama.com/col/productManuals/GP0100290620.pdf
