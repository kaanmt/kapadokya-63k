# Kapadokya Trail Uygulaması

*11 Ekim 2026. **v1.0 = M3** (v0.21 ile aynı kod), ana adrese çıkış sürecinde; [test listesi](test-listeleri/v1.0.md). Geliştirme Claude Code'da, yerelde. Yarış: 17 Ekim, 07:00, Ürgüp.*

*M = milestone (kilometre taşı): ana adrese (herkese açık sürüm) çıkan sürüm; M1 = v0.12.1, M2 = v0.17, M3 = v1.0; sonraki kilometre taşı kullanıcı söyleyince. Ara sürümler yalnızca test dalına gider.*

<nav class="top"><a href="#yapilacaklar">Yapılacaklar</a> | <a href="#gunluk">Günlük</a> | <a href="#basvuru">Başvuru</a></nav>

## Yapılacaklar {#yapilacaklar}

### Sende
- [ ] **Ana adreste kısa kontrol** (`docs/test-listeleri/v1.0.md`): başlıkta "sürüm 1.0", verilerin yerinde, 3B açılıyor
- [ ] **Sunuma bak** (`docs/tanıtım-sunumu/`, 13 sayfa; özellikle yeni 5. sayfa) ve PowerPoint'te bir kez aç (yerleşim yalnızca Keynote çıktısıyla denetlendi)
- [ ] **Yarış sabahı telefonun yön kilidini aç** (uygulamadaki kilit çalışmıyor)
- [ ] iPhone'u olan bir arkadaş test listesindeki iPhone bölümünü denesin
- [ ] iPhone'u olan bir arkadaş 3B'yi denesin (iPhone / Safari hiç denenmedi)
- [ ] Ana adreste başlık "sürüm 0.17" mi bak; verileri taşımak için test dalında Test > "Yedeği dosya olarak indir", ana adreste geri yükle
- [ ] **Garmin FIT kursunu Fenix 8'de dene**, yarıştan önceki en önemli açık; sorun çıkarsa sonraki sürümde düzeltilir ([rehber](https://claude.ai/artifact/T56PuY5jpTP6tJb7btnXad), Yol A)
    - [ ] Connect'e yüklendi
    - [ ] Up Ahead'de kontrol noktaları göründü
    - [ ] ClimbPro çalıştı
- [ ] (İsteğe bağlı) Farklı rotada, farklı arazide bir koşu daha (GPX + Garmin sayıları); ikisi aynı rota olduğu için bağımsız doğrulama sayılmaz
- [ ] (Düşük öncelik) Dışarıda "Konumumu göster" ve rota dışı uyarısı; Az/Çok ayrıntı seviyeleri

### Karar bekleyen
- [ ] (İsteğe bağlı, kod) Kontrol listesine "telefonun yön kilidini aç" maddesi ve etkisiz `orient` kodunun kaldırılması; "koda uygula" denirse v0.21

### Bende (Claude)
- [ ] İ9 (iPhone'da bağlam geri gelmezse takılma): cihaz denemesinin sonucuna göre
- [ ] Yarıştan sonra: Garmin GPX'iyle plan karşılaştırması ve 17 Ekim GPX'iyle yorulma şekli (1,5 / 2 üsleri varsayım)
- [ ] Karar yok: kalan 8 yiyeceğin değerleri; Mocha jelin 0,06 g tuzu (ambalajdan doğrulanmadı)

### Tamamlananlar
- [x] **v0.21 denendi, test listesinin tamamı tamam** (11 Ekim, Android)
- [x] **v0.21 yazıldı, doğrulandı, yerelde** (11 Ekim): yarış ekranında "kesimine kalan" ve "geçen süre" sayıları kutusuna göre küçülüyor, taşmıyor
- [x] Kararlar (11 Ekim): "85 kg" örneği depoda kalabilir; yeni 404 kuralları kullanıcıda çalıştı; kullanıcı "commit" derken GitHub'a göndermeyi kastediyor (yerel commit serbest, push kullanıcı deyince)
- [x] Commit öncesi genel kontrol (11 Ekim, 3 ajan): doğrulama, gizlilik / yayın, tarayıcı; engel yok, bir arayüz hatası bulundu
- [x] Karar (11 Ekim): yarışta ekranın dönmesi için K3, telefonun kendi yön kilidi; kod değişikliği yok
- [x] v0.20 Android'de denendi (11 Ekim): dikey kilit dışında tamam. iPhone: kullanıcı "denendi" diyene kadar denenmedi sayılır
- [x] **Tanıtım sunumu v0.20'ye güncellendi** (11 Ekim): 13 sayfa, yeni 5. sayfa "Parkura iki türlü bak: 2B | 3B", S1-S9, kapak ve Profil ekranı v0.20, pptx + pdf
- [x] Kararlar (11 Ekim): sunum akıcılık önerileri S1-S9 kabul; sunum depoya girmez; sunumda sürüm 0.20; v1.0 kullanıcı söyleyene kadar önerilmez; Claude orkestra şefi gibi çalışır (kendin yapmak yerine delege et); push / deploy yalnızca sürüm numarası artınca
- [x] **v0.20 yazıldı, doğrulandı, test dalında** (11 Ekim): inceleme düzeltmeleri İ1-İ8
- [x] v0.19 ayrı ajan incelemesi (11 Ekim): 4 ajan (2 Opus, 2 Sonnet), salt okunur; yüksek önemde hata yok
- [x] **v0.19 denendi, test listesinin tamamı tamam** (11 Ekim)
- [x] **v0.19 yazıldı, doğrulandı, test dalında** (11 Ekim): silik yollar + koyu parkur kenarı, kuzey oku, yatay tutuşta 2B / 3B tam ekran ve özet satırı, dönme kilidi kalktı, ⓘ metni
- [x] Kararlar (11 Ekim): v0.19 kapsamı, 018fb1-3 önerilerimin tümü + yatay tam ekran 2B'de de, dönme kilidi kalkar, "x1,5", kuzey oku
- [x] **v0.18 Android'de denendi, her şey tamam** (11 Ekim); iPhone yok, denenmedi
- [x] **v0.18 yazıldı, doğrulandı, test dalında** (10 Ekim): 3B arazi görünümü; kararlar H1-H4 önerildiği gibi (kendi 3B görünümümüz, veri gömülü; GLO-30 + Sentinel-2 + OSM; "2B | 3B" anahtarı; v0.18 test dalında), araç yolları soluk çizgi
- [x] Devir paketi test dalında; Claude Code yerelde bağlı; 404 kuralları test adresinde denendi (10 Ekim)
- [x] GitHub + Netlify kurulumu; v0.12.1 ana adreste (M1)
- [x] **v0.17 ana dala birleştirildi = M2** (9 Ekim)
- [x] **Claude Code devir paketi** (10 Ekim): CLAUDE.md (kurallar, yapı, yayın akışı), docs/ (plan, arşiv, test listesi, rehberler, 3B araştırması, Garmin FIT), tools/ (kendini sına, arayüz akışı, JS-Python tahmin karşılaştırması; göreli yollarla 40/40, akış HEPSİ OK, fark < 1e-7), 404 kuralı + 404.html
- [x] v0.14-test-1 yüklendi; kontrol listesi K1-K15 tamam
- [x] v0.15-test-1 yüklendi ve test edildi, sorun yok
- [x] 4 Ekim ve 27 Eylül koşuları (Strava GPX) analiz edildi
- [x] İptal: ter testi, test simgesi
- [x] Kararlar: %90 eşik kuralı, sodyum formülü C, veriden tahmin metrikleri, negatif iniş ağırlığı, 9 sn yumuşatma
- [x] v0.16-test-1 yüklendi ve test edildi, tamam (sodyum C, %90 kuralı, veriden tahmin)
- [x] Kararlar (7 Ekim): tahmin senaryoları (iyi / ana / kötü), tek tablo + anahtar, kesim payı gösterilen varışa göre, "plana uygula" kaldırılır, iniş etki satırı; uygulama v0.16-test-2'de
- [x] Kararlar (7 Ekim, öğleden sonra): Gr1 ⓘ açıklamalar (önce Plan sekmesi), Gr2 kart kaldırılır, Gr3 katalog araması kaldırılır, Gr4 kafein kontrolleri kalkar (ürün kafein bilgisi not olarak kalır)
- [x] v0.16-test-2 yazıldı, doğrulandı, test dalında denendi (Gr1-Gr4 dahil); geri bildirim 016fb1-6 v0.17'ye
- [x] Kararlar (8 Ekim): fb1-fb8 önerilerimin tümü onaylandı; M2 = v0.17
- [x] **Arkadaşlar için tanıtım sunumu** (9 Ekim): 12 sayfa, pptx + pdf, v0.17 ekranları (bir kısmı koyu tema), QR kod, tahmin sayfası
- [x] Karar (9 Ekim): v0.18 öneri paketi (Ö1-Ö5, D1-D4) ve GPX ⓘ metni alınmadı; uygulama v0.17 hâliyle kalır
- [x] **v0.17 yazıldı, doğrulandı, test dalında denendi, hepsi tamam** (8 Ekim): tek seçim (Plan | Veri, A/B/C altında), Beslenme ve Yarış seçimi izler, Veri sektör sektör, A/B/C/Veri yan yana, ⓘ tüm sekmeler; kendini sına 40 / 40

### Takvim
- **12-13 Ekim:** dondurma; bundan sonra yalnızca hata düzeltme
- **15-16 Ekim:** paket dağıtımı (15: 14:00-20:00; 16: 10:00-22:00)
- **17 Ekim:** yarış, start 07:00 (start alanı en geç 06:30)

## Günlük (en yeni en üstte) {#gunluk}

### 11 Ekim (devam): v1.0 = M3
- **Karar (kullanıcı):** v0.21 artık M3 = v1.0 olarak ana dala; sunum da v1.0'a; önce sunum, sonra gönderim
- **Yapılan:** `BUILD` 1.0, `k63-1.0`; 44/44, akış, harita, tahmin geçti. Sunum v1.0: kapak, s4 ve s5 telefon ekranları "sürüm 1.0", kapakta "SÜRÜM 1.0", alt bilgide "sürüm 1.0" ("deneme" kalktı); pptx + pdf klasörde
- **Birleştirme notu:** `main`'deki v0.17 tek commit'e sıkıştırılmıştı, `test` ile çakışıyordu (app.js, sw.js, tools.js). `test`'te `main` geçmişi içerik değiştirmeden birleştirildi (`-s ours`); PR birleştirme commit'iyle kapatılır ki sonraki kilometre taşında çakışma olmasın

### 11 Ekim (devam): v0.21 test sonucu
- **Test (kullanıcı, Android):** "tüm kontrolleri tamamladım sorun yok". Yeni geri bildirim yok; iPhone denenmedi
- **Oturum notu:** statusline'a 5 saat / 7 gün çubukları ve dolar maliyeti eklendi; telefon bildirimi için Remote Control bağlandı (depo dışı ayarlar)

### 11 Ekim (devam): v0.21, yarış ekranı taşma düzeltmesi (test dalında)
- **Karar (kullanıcı):** taşma düzeltilsin, "koda uygula". Kapsam yalnızca bu; kontrol listesi maddesi ve `orient` kodunun kaldırılması istenmedi
- **Yapılan (Opus ajanı + benim ayarım):** kök neden `.kpi b { font-size: 44px }` sabit boyut (360 px'te kutu 131, sayı 164 px). Çözüm yalnızca CSS: `.kpi` ve `.rtime` kapsayıcı, sayı `min(44px, 22cqi)` ve `min(52px, 19cqi)`, son çare satır kırılması. Ajan 20cqi önermişti (8 karakterlik değere göre); gerçekte sayı en çok 7 karakter (kesimler arası en çok 4 saat), 22cqi yaptım. 360 px'te sayı 44 → 28,8 px
- **Doğrulama:** 44/44, akış, harita, tahmin; Chrome'da 14 birleşim x 18 ölçüm, 248/252 (kalan 4: gerçekte oluşmayan "11:59:58", geniş yazı tipinde alt satıra kırılıyor, taşmıyor). Eski CSS aynı testte kalıyor
- **Denenmeyen:** gerçek telefon. Yatayda büyük düğme kutuları örtüyor (düzeltilmedi)
- **Gönderim:** kullanıcı "github a commit et" dedi; `d1b8c77` ve bekleyen beş belge commit'i test dalına push edildi

### 11 Ekim (devam): commit öncesi genel kontrol
- **Kural (kullanıcı):** kullanıcı demeden commit yok (yerel de). Önceden atılmış beş yerel commit duruyor, push edilmedi
- **Doğrulama (Sonnet):** 44/44, akış, harita, tahmin (en büyük fark 2,9e-08); sürüm 0.20 her yerde; önbellek 21/21; GitHub'dan fark yalnızca üç belge; kodda artık yok; etkisiz `orient` zararsız
- **Gizlilik / yayın (Opus):** izlenen 52 dosyada GPX, arşiv, sunum, .DS_Store yok; bekleyen farkta kişisel bilgi yok; kimlik `kaanocb` + noreply. Not: "85 kg, çok terleme" örneği depoda; ana adreste `/README.md` açık (v0.17, zararsız); test adresindeki yeni 404 kuralları sınanamadı (401)
- **Tarayıcı (Sonnet):** 7 senaryo geçti (çevrimdışı 3B, 5 sekme açık ve koyu, yatay tam ekran, yarış akışı ve Menü, plan ve beslenme). **Bulgu:** yarış ekranında "kesimine kalan" sayısı 360 px'te taşıyor (`#rCutLeft` içerik 164, kutu 131 px); v0.17'den beri var olmalı (yarış kodu değişmedi), telefonda doğrulanmadı

### 11 Ekim (devam): v0.20 test sonucu
- **Test (kullanıcı, Android):** yarış başlayınca ekran yan çevrilince dönüyor (İ2 kilidi çalışmıyor); telefonun yön kilidi açıkken dönmüyor. Gerisi tamam. "Yarışta Profil'e geç" maddesi eksik yazılmıştı (Menü düğmesi), düzeltildi
- **Kural (kullanıcı):** iPhone, kullanıcı "denendi" diyene kadar denenmedi kabul edilir
- **Ek:** yüklü uygulamada da sekmede de dönüyor. **Karar: K3** (telefonun yön kilidi). Neden reddedildiği ölçülmedi

### 10-11 Ekim: v0.18-v0.20, sunum, inceleme (arşivde)
- 3B arazi görünümü (v0.18), geri bildirim ve yatay tam ekran (v0.19), dört ajanlı inceleme ve düzeltmeler (v0.20), sunumun v0.20'ye güncellenmesi, kurallar 10-12: `docs/arsiv/plan-arsiv-2026-10-11.md`

### 9 Ekim ve öncesi (arşivde)
- v0.1-v0.17, koşu GPX analizleri, tanıtım sunumunun ilk hâli, M1 ve M2: özetleri `docs/arsiv/plan-arsiv-2026-10-11.md`, ayrıntıları önceki arşiv dosyalarında

## Başvuru {#basvuru}

### Genel kurallar
- **Varsayım yapma, doğrula:** beklenmeyen sonucu varsayımla açıklama; ölçülebilir veriyle doğrula; veri yoksa söyle, hipotezi etiketle, veriyi toplayacak yol ekle
- **Sorular uygulamada sorulur**, sohbette değil
- **Tasarım ilkesi:** başka bir yerin kopyası gibi duran şey eklenmez; gereksiz kalabalık yapılmaz. Seçim tek yerde (Plan sekmesi), diğer sekmeler izler. Zaman kaygısıyla kapsam daraltma önerilmez. Geri bildirimde kendi görüşümü çekinmeden söylerim
- **Kod yalnızca açıkça "koda uygula" denince yazılır;** o zamana kadar plan aşaması (analiz, öneri, plan belgesi). **Plan belgesi her mesajdan sonra önce okunup sonra güncellenir; onay istenmez.** Claude Code'da `docs/PLAN.md` (test dalına commit); claude.ai'daki plan artifact'i geçişten sonra arşiv
- **Plan belgesi formatı (kullanıcı onayladı, korunacak):**
    - En üstte yapılacaklar: madde madde, checkbox'lı; Sende / Karar bekleyen / Bende / Tamamlananlar / Takvim
    - Yapılan iş Tamamlananlar'a taşınır; eskiyen maddeler silinir
    - Günlük en yeni üstte; her giriş 2-4 kısa madde; uzun tablo ve paragraf yok
    - Uzun ayrıntı arşiv dosyasına gider (belge yaklaşık 20 KB'ı geçerse eski girişler özetlenip arşivlenir)
    - Güncelleme sormadan yapılır ve ne değiştiği bildirilir
- **Ara sürümler ve deneme yayınları test dalına,** kilometre taşları ana adrese (yalnızca kullanıcı isteyince, test → main birleştirmesiyle) (M1, M2, M3 = sırayla çıkan kilometre taşı sürümleri; her ana adres yayını 15 kredi). Sürüm numarası her yeni sürümde bir artar (v0.17, v0.18…), sonek yok. Ana dala birleştirmenin adı sürüm numarası + kilometre taşı: "v0.17 (M2)"; uygulamada yalnızca sürüm numarası görünür
- **Her sürüme ayrı test listesi** (`docs/test-listeleri/vX.md`, madde madde): o sürümde neyin denenmesi gerektiği; kullanıcının sonuçları aynı listeye işlenir (test günlüğü)
- Hız birimi yok, sadece tempo (dk/km)
- **Geliştirme dosyaları sitede yayınlanmaz:** `CLAUDE.md`, `docs/`, `tools/` depoda; `netlify.toml` 404 kuralı. Yeni bir geliştirme klasörü eklenirse kurala da eklenir

### Uygulama
- **Profil:** eğime göre renkli profil; km, rakım, eğim
- **Plan:** A/B/C (hedef süre veya düz tempo); altında **Plan | Veri** seçimi (uygulama geneli; Veri: antrenman GPX'inden ana tahmin, durmalar seçili plandan); Özet; sektör tablosu (Veri'de de sektör sektör; nokta satırında starttan süre ve iyi-kötü aralığı); kesim payı (60+ dk güvende, 20-59 dikkat, 20 altı tehlike); A, B, C ve Veri yan yana; "ya şöyle olursa?"; PacePro süresi; ⓘ açıklamalar
- **Beslenme:** süre ve bölümler Plan sekmesindeki seçimden (kendi seçimi yok); form (ağırlık, terleme, sıcaklık, suluk, jel sınırı, sağlık işareti); 24 ürün seçicileri (arama yok); noktalarda yiyecek seçimi ve "Burada ayrıca" notu; ter tuzluluğu seçimi, %90 yeterlilik satırları ve öneri, saatlik hedefler, uygulama takvimi, bölüm bölüm taşıma
- **Yarış:** kontrol listesi; "Neye göre?" (Plan sekmesindeki seçim; Veri ise fark ve kesim payı tahmine göre); başlatma; fark, kesim payı, "burada" kartı, konum, bitiş özeti
- **Test:** kendini sına, rapor, yedekleme

### Hesap modelleri
- **Plan:** sektör eforu = km + tırmanış/100 × a + iniş/100 × b (varsayılan 1,00 ve 0); hedef süreden durmalar çıkar, kalan hareket süresi eforla ve yavaşlama çarpanıyla dağıtılır
- **Sıvı:** 500 mL × terleme (0,9 / 1,0 / 1,2) × sıcaklık × beden (√(kg/75)) × tempo (sabit parkur eforu 83,26 km-efor / hareket saati / 7,8); en çok 750 mL. 500 taban = ISSN 450-750 mL/saat aralığından seçilmiş başlangıç (ölçüm değil)
- **Sodyum (v0.16):** sıvı × ter tuzluluğu (600 / bilmiyorum 825 / 1100 mg/L; terleme yalnızca sıvıyı belirler). **%90 kuralı:** oran = plan/hedef (karbonhidrat, sodyum): <%90 yetersiz, >%125 fazla (bilgi). **Karbonhidrat:** 60 g × tempo. **Kafein:** uygulama saymaz, sınırlamaz; yalnızca öneri kafeinli ürün seçmez
- **Takvim:** flask 5 dk'ya yuvarlı; jel aralığı 20-120 dk (saatte en fazla jel sınırı); tuz tableti 30-120 dk; seçilen ürün kullanılır
- **Veriden tahmin:** taban = hareket sn ÷ km-efor (ağırlık 0,88 / -0,24; hareket ≥0,3 m/s; 9 sn yumuşatma); yavaşlama = ikinci/ilk yarı tempo oranı; iyi gün doğrusal (x), ana x^1,5, kötü x²; kesim payı ana varışa göre; bant koşu uzunluğuna göre ±%2...±%14; parkurun her adımında saklanır (sektörler, yarış); Plan modunda Özet'te "Veriye göre" etiketi: iddialı / iyimser / gerçekçi / çok temkinli
- **Doğrulama:** bağımsız Python hesabıyla beslenme ve plan vektörleri, tahmin (noktalar ve sektörler); kendini sına 40 kontrol
- **Örnek** (85 kg, çok terleme, 15 °C, ter "bilmiyorum", A 10:00): 700 mL, 580 mg, 65 g. Plan süreleri değişince sayılar değişir

### Yarış verisi (63K, 2026)
- **GPX:** 62,97 km; tırmanış resmî 2030 m; rakım 1026-1471 m; start Ürgüp Cumhuriyet Meydanı; süre sınırı 12:30

| Nokta | Km | Kesim (saat) | Bölüm tırmanışı | İkmal |
|---|---|---|---|---|
| İbrahimpaşa | 11,0 | 2:00 (09:00) | 406 m | sade: kek, kraker, meyve, tuz |
| Uçhisar | 27,0 | 5:00 (12:00) | 575 m | zengin: ekmek, peynir, helva; **çorba** |
| Göreme | 37,1 | 7:00 (14:00) | 263 m | zengin: patates, fındık, Nutella, cezerye |
| Çavuşin | 45,8 | 9:30 (16:30) | 231 m | zengin: ekmek, peynir, helva, çikolata; **çorba** |
| Akdağ | 52,2 | 11:00 (18:00) | 338 m | en sade: kek, kraker, meyve |
| Finiş | 63,0 | 12:30 (19:30) | 217 m | bitiş büfesi |

- İbrahimpaşa-Uçhisar en uzun ve en çok tırmanışlı bölüm; Çavuşin'den hemen sonra (yaklaşık km 47-48) çok dik çıkış
- Destekçi yalnızca belirlenen alanlarda (kullanıcının destek ekibi yok); plastik bardak yok; baston bitişe kadar taşınır (yoksa 1 saat ceza); rotadan sapmak diskalifiye; acil hat +90 535 545 18 78
- Zorunlu ekipman uygulamadaki kontrol listesinde

### Garmin (Fenix 8)
- Saat koşarken süre, tempo, rota, ClimbPro, PacePro, beslenme alarmı; uygulama karar aracı
- FIT kurs dosyaları: `kapadokya-63k-kurs.fit` (6 nokta) ve dik kısımlı sürüm; doğrulandı, **gerçek saatte denenmedi**
- PacePro'ya girilecek süre: hedefin durmasız hareket süresi (Plan > "Garmin saat için")

### Teknik notlar
- Yarış günü tarayıcı Chrome; telefonda pil tasarrufu kapalı
- Ekran kapalıyken web uygulamasının zamanlayıcıları güvenilmez (uyarılar saatte); titreşim çalışmadı
- Veriler telefonda tutulur, silinmeye karşı yedek al; test ve ana adres ayrı siteler (ayrı veri)
- Ürün kataloğu ve yiyecek tabloları uygulamada (Beslenme > Ürünler); her kayıtta kaynak ve kontrol tarihi

### Dosyalar ve rehberler
- [GitHub + Netlify rehberi](https://claude.ai/artifact/ELNAiwa7EieNuGiqnw9FYc), [Garmin kurulum rehberi](https://claude.ai/artifact/T56PuY5jpTP6tJb7btnXad)
- Arşiv (tüm ayrıntı, tablolar; git dışı, yalnızca yerelde): `docs/arsiv/plan-arsiv-2026-10-10.md`, `...-10-06.md`, `...-10-02.md`; 3B araştırması: `docs/arastirma/3b-veri-raporu.md`; doğrulama araçları: `tools/`
- Depo ZIP'leri: `kapadokya-63k-v0.17-degisenler.zip`, `...-tam.zip`; Garmin: `kapadokya-63k-kurs.fit`
- Test listeleri: `docs/test-listeleri/v0.18.md`, `docs/test-listeleri/v0.17.md` (eski: [v0.17 artifact](https://claude.ai/artifact/R4dz2Hvz3bAHyTv2TmVgvq))
- Tanıtım sunumu: `kapadokya-63k-planner-tanitim.pptx`, `kapadokya-63k-planner-tanitim.pdf` (ana adres: candid-zabaione-2be2ed.netlify.app)

### Kaynaklar
- Yarış: cappadociaultratrail.com (kurallar, GPX)
- Beslenme: ISSN ultra bildirgesi (Tiller 2019, pubmed.ncbi.nlm.nih.gov/31699159), ter sodyumu normatif verisi (Baker, gssiweb.org), maraton ter sodyumu (Lara 2017, pubmed.ncbi.nlm.nih.gov/26661748), 161 km ultrada sodyum (Hoffman 2015, PMC4688305), WASSUP (Sports Med Open 2021), hiponatremi konsensüsü (aafp.org), TürKomp, ürün satıcı ve üretici sayfaları
- Garmin: Fenix 8 kılavuzu, coursepointer; yayın: docs.netlify.com
