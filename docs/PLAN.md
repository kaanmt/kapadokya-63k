# Kapadokya Trail Uygulaması

*10 Ekim 2026. Ana adres: **v0.17 (M2)**, [test listesi](https://claude.ai/artifact/R4dz2Hvz3bAHyTv2TmVgvq). Claude Code'a geçiş: devir paketi hazır (CLAUDE.md, docs/, tools/, yayın kuralı). Konuşulan: Profil sekmesine 3B harita (v0.18 adayı). Yarış: 17 Ekim, 07:00, Ürgüp.*

*M = milestone (kilometre taşı): ana adrese (herkese açık sürüm) çıkan sürüm; M1 = v0.12.1, M2 = v0.17, M3 = v1.0 (yalnızca hata çıkarsa). Ara sürümler yalnızca test dalına gider.*

<nav class="top"><a href="#yapilacaklar">Yapılacaklar</a> | <a href="#gunluk">Günlük</a> | <a href="#basvuru">Başvuru</a></nav>

## Yapılacaklar {#yapilacaklar}

### Sende
- [ ] **Devir paketini test dalına yükle** (`kapadokya-63k-claude-code-devir.zip`; içindekiler depo köküne; `netlify.toml` değişir; uygulama dosyalarına dokunulmadı, sürüm 0.17 kalır). Depo Private değilse `tools/veri/` klasörünü yükleme (kişisel koşu GPX'leri)
    - [ ] Test adresinde uygulama açılıyor, başlık "sürüm 0.17"
    - [ ] Test adresinde `/docs/PLAN.md`, `/CLAUDE.md`, `/tools/package.json` "Sayfa bulunamadı" gösteriyor
    - [ ] claude.ai/code'da GitHub bağlandı, depo seçildi; ilk mesaj: "CLAUDE.md ve docs/PLAN.md'yi oku, test dalından devam edelim"
- [ ] Ana adreste başlık "sürüm 0.17" mi bak; verileri taşımak için test dalında Test > "Yedeği dosya olarak indir", ana adreste geri yükle
- [ ] **Garmin FIT kursunu Fenix 8'de dene**, yarıştan önceki en önemli açık; sorun çıkarsa v1.0'da düzeltilir ([rehber](https://claude.ai/artifact/T56PuY5jpTP6tJb7btnXad), Yol A)
    - [ ] Connect'e yüklendi
    - [ ] Up Ahead'de kontrol noktaları göründü
    - [ ] ClimbPro çalıştı
- [ ] (İsteğe bağlı) Farklı rotada, farklı arazide bir koşu daha (GPX + Garmin sayıları); ikisi aynı rota olduğu için bağımsız doğrulama sayılmaz
- [ ] (Düşük öncelik) Dışarıda "Konumumu göster" ve rota dışı uyarısı; Az/Çok ayrıntı seviyeleri

### Karar bekleyen
- [ ] **3B harita, Profil sekmesi (v0.18 adayı; görüşüm: değer, kendi verimizle çevrimdışı yapılırsa)**
    - [ ] **H1 Yol:** önerim kendi 3B görünümümüz: parkur çevresinin yükseklik verisi (yaklaşık 11 × 10 km, 30 m ızgara) uygulamaya gömülür, el yazımı WebGL ile çizilir, internet gerekmez. Alternatif: hazır harita kütüphanesi + uydu görüntüsü (internet ister, anahtar ve kullanım şartı, yarışta çalışmaz); önermiyorum
    - [ ] **H2 Görünüm (araştırmadan sonra, bedava + kaliteli):** zemin Copernicus GLO-30 (30 m'den iyisi açık değil: EEA-10 yalnızca kurumlara, ASF 12,5 m aslında yeniden örneklenmiş 30 m, HGM 5 m bireye satılmıyor, ticari 5 m ~€900 + yayın izni); üstüne Sentinel-2 10 m yaz uydu görüntüsü + gölgeleme (vadiler, bağlar, kasabalar seçilir); patikalar OpenStreetMap'ten ince çizgi, yarış parkuru kalın ayrı renk; yalnızca 6 nokta etiketi; tek parmak döndür, iki parmak yakınlaştır; yükseklik 1,5 kat abartılı. Toplam ~1 MB. Atıflar (Copernicus, Sentinel, © OpenStreetMap) köşede görünür
    - [ ] **H3 Anahtar:** profil grafiğinin üstünde "2B | 3B"; seçim hatırlanır; altındaki km / rakım / eğim satırı ikisinde de aynı (3B'de parkura dokununca)
    - [ ] **H4 Yayın:** v0.18 test dalında denenir; tamamsa M3 = v1.0 (15 kredi). Dondurma (12-13 Ekim) öncesi
    - [ ] **Veri erişimi:** üç kaynak (Copernicus, Sentinel, OSM Overpass) claude.ai sohbet ortamından erişilemiyor. Claude Code'da bulut ortamının ağı "Custom" (bu alan adları) ya da "Full" yapılırsa ya da yerel çalışılırsa Claude kendisi indirir; Copernicus/Sentinel için ücretsiz hesabı kullanıcı açar. Ayrıntı: `docs/arastirma/3b-veri-raporu.md`
- [ ] **M3 gerekli mi?** 3B girerse evet (v1.0); girmezse yalnızca hata çıkarsa

### Bende (Claude)
- [ ] Hata gelirse: düzeltme sürümü, test listesi, gerekirse v1.0 (M3)
- [ ] Yarıştan sonra: Garmin GPX'iyle plan karşılaştırması ve 17 Ekim GPX'iyle yorulma şekli (1,5 / 2 üsleri varsayım)
- [ ] Karar yok: kalan 8 yiyeceğin değerleri; Mocha jelin 0,06 g tuzu (ambalajdan doğrulanmadı)

### Tamamlananlar
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

### 10 Ekim (akşam): plan arşivleri depo dışı (uygulama kodu değişmedi)
- Depo taraması (43 dosya, desen aramasıyla): şifre, telefon, ev konumu yok; arşivlerde kilo, boy, nabız ve bir antrenman yerinin adı var
- **Karar (kullanıcı):** `docs/arsiv/` depodan çıkar. `docs/.gitignore`'a `arsiv/` eklendi; bugünkü iki commit tek commit olarak yeniden yazıldı, `test` dalına zorla gönderildi
- **Sonucu:** arşivler yalnızca bu bilgisayarda (`docs/arsiv/`), yedeği kullanıcıda; "ayrıntı arşivde" notları yerel dosyayı gösterir
- **Karar (kullanıcı):** sonraki commit'lerde yazar adı `kaanocb` (bu depoya özel git ayarı); e-posta GitHub'ın gizli noreply adresi. Kullanıcı GitHub'da "Keep my email addresses private" ve "Block command line pushes that expose my email" ayarlarını açtı

### 10 Ekim (akşam): depo Claude Code'da klonlandı; koşu GPX'leri depo dışı (uygulama kodu değişmedi)
- Devir paketi `test` dalına gönderildi; push öncesi kendini sına 40/40, akış hepsi OK, tahmin farkı < 1e-7
- **Karar (kullanıcı):** koşu GPX'leri depoda olmasın (depo herkese açık; 404 kuralı yalnızca siteyi kapatır, GitHub'ı değil). `tools/.gitignore`'a `veri/` ve `__pycache__/` eklendi
- **Sonucu:** `tools/veri/` yalnızca bu bilgisayarda; yeni bir klonda `npm run tahmin` GPX'ler elle kopyalanmadan çalışmaz (`selftest` ve `akis` etkilenmez mi, denenmedi)

### 10 Ekim (akşam): Claude Code devir paketi hazır (uygulama kodu değişmedi)
- **Karar (kullanıcı):** geliştirme dosyaları yayın kuralıyla gizlenir; deneme yayınları yine test dalına
- **Paket:** `CLAUDE.md`; `docs/` (PLAN.md bu belge, arşivler, v0.17 test listesi, rehberler, 3B veri raporu, FIT dosyaları); `tools/` (jsdom ile kendini sına, arayüz akışı, tahmin JS = Python); `netlify.toml`'a `/docs/*`, `/tools/*`, `/CLAUDE.md`, `/.claude/*` için 404 kuralı ve `404.html`. Araçlar paketlenmiş depo kopyasında çalıştırıldı: 40/40, akış hepsi OK, tahmin farkı < 1e-7. 404 kuralı Netlify CLI ile yerelde denendi: `/docs/`, `/tools/`, `/CLAUDE.md` 404; uygulama dosyaları 200
- **Kural değişikliği:** Claude Code'da plan belgesi `docs/PLAN.md`, test listeleri `docs/test-listeleri/`; bu sohbetteki plan artifact'i geçişten sonra arşiv

### 9 Ekim (gece): 3B için veri araştırması (kod değişmedi)
- Soru: 30 m'den iyisi ve tek patikalar. Sonuç: açık lisanslı, gömülebilir 30 m'den iyi yükseklik verisi yok; ayrıntıyı uydu görüntüsü (Sentinel-2 10 m) ve OSM patika çizgileri getirir. Tek patikalar görüntüde seçilmez, çizgi olarak çizilir
- Önerim H2'de güncellendi; veri ~1 MB; üç kaynağı kullanıcının indirmesi gerekiyor (ortamdan erişim yok)
- **Neden kullanıcı indiriyor:** çalışma ortamımın interneti izin listesiyle sınırlı (paket depoları, GitHub); web okuma aracım sayfayı metin özeti olarak getiriyor, ham veri dosyası (GeoTIFF, görüntü, koordinat) indiremiyor; Copernicus ve Sentinel ayrıca giriş istiyor, adına hesap açamam

### 9 Ekim (akşam): M2 yayında; 3B harita fikri (kod değişmedi)
- Kullanıcı v0.17'yi ana dala birleştirdi (M2). Yeni fikir: Profil'e 3B harita, 2B ile anahtar
- **Doğrulanan:** bugünkü "2B" bir harita değil, km-rakım profil grafiği (SVG); uygulamada hiç harita yok. Parkurun kapladığı alan 9,1 × 8,4 km (küçük; yükseklik verisi yüzlerce KB). Çalışma ortamından Copernicus ve AWS yükseklik kaynakları erişilemiyor, npm erişilebilir
- Önerim ve kararlar H1-H4 karar bekleyende

### 9 Ekim (öğle): yeni özellik fikirleri Ö1-Ö5, D1-D4 alınmadı (ayrıntı arşivde)
- Kullanıcı: "ufak tefek, kalsın"; v0.17 son hâl

### 9 Ekim (sabah): arkadaşlar için tanıtım sunumu (ayrıntı arşivde)
- 12 sayfa pptx + pdf, v0.17 ekranları (bir kısmı koyu tema), QR, "Tahmin nasıl hesaplanır?" sayfası; geri bildirimler uygulandı

### 8 Ekim (gece): v0.17 yazıldı, doğrulandı, test listesi tamam (ayrıntı arşivde)
- Kendini sına 40/40; tahmin JS = bağımsız Python (fark < 1e-7 dk); jsdom akışları; ayrı ajan kod incelemesi

### 8 Ekim: v0.16-test-2 denendi; geri bildirim fb1-fb8 tartışılıp onaylandı (ayrıntı arşivde)
- fb1-fb6 kullanıcının geri bildirimi; fb7 Beslenme'de Veri, fb8 tek seçim (Plan sekmesi); tartışmada bulduğum Beslenme-Yarış tutarsızlığı fb8 ile çözüldü

### 7 Ekim: v0.16-test-2 yazıldı; arayüz sadeleştirme Gr1-Gr4 (ayrıntı arşivde)
- Tahmin şekilleri, tek tablo + anahtar, kesim payı kuralı; Gr1 ⓘ, Gr2-Gr4 kaldırmalar; öneri kafeinli ürün seçmez

### 7 Ekim: v0.16-test-1 geri bildirimi (ayrıntı arşivde)
- Tahmin şekilleri iyi doğrusal / ana x^1,5 / kötü x²; iyi/ana/kötü A/B/C'nin yerine geçmez, yardımcı ölçüt

### v0.16-test-1: sodyum C, %90 kuralı, veriden tahmin (ayrıntı arşivde)
- Ter tuzluluğu seçimi (600 / 825 / 1100 mg/L), %90 kuralı, GPX'ten tahmin; JS = Python (fark 0,000)

### 4-6 Ekim: koşu GPX'i analizi (ayrıntı arşivde)
- 30,34 km koşu uygulamada Garmin'le tutarlı (süre 11 sn, hareket 5 sn); kalibre: tırmanış 0,88, iniş -0,24, yorulma 0,50
- Sınırlar: tek koşu; rakım (koşu 77-307 m, yarış 1026-1471 m); arazi; yorulma basamaklı

### v0.14-v0.15: beslenme takvimi, hata mesajı, ürün sınırları (ayrıntı arşivde)
- Seçilen tuz tableti kullanılıyor; Progel tuzu 0,3 g = 120 mg (ambalajdan); sınırlar kaldırıldı

### v0.13-test-1: GPX'ten kalibrasyon
- Plan > Kalibrasyon: GPX yükle; tempo, düz-eşdeğer tempo, koşu içi yavaşlama; A/B/C'ye uygula (iki dokunuş); zamansız GPX reddedilir

### v0.12.1: GitHub + Netlify yayın akışı
- **Sorun:** Netlify ücretsiz planı 300 kredi, üretim yayını 15 kredi
- **Çözüm:** ara sürümler test dalına (ücretsiz), kilometre taşları ana dala; test adresinde turuncu TEST ORTAMI şeridi

### v0.12: katalog 24 ürün (Faz 2)
- Beş satıcı ve üretici sayfaları karşılaştırıldı; arama ve filtre; sodyumu veya kafeini bilinmeyen ürünler otomatik öneriye girmez
- Yiyecekler: 17'nin 9'u kaynaklı (TürKomp, Coca-Cola Türkiye)

### v0.11: yarış öncesi kontrol listesi
- Yarış sekmesinde 32 maddelik işaretlenebilir liste (zorunlu ekipman, telefon, saat, yarış sabahı)

### v0.10: görünür ayarlar ve araçlar
- Plan ve Beslenme'de durma toplamı ile Gelişmiş ayarlar görünür; yedekleme; yarışta "burada" kartı; **Kendini sına**; hava tahmininden sıcaklık

### v0.9.x: sayı farkı dersi
- Beslenme hedefleri beklenenden yüksek çıktı; ilk açıklamam bir varsayımdı (hata)
- **Gerçek sebep:** tempo çarpanı Gelişmiş ağırlıklara bağlıydı; düzeltildi
- Ders: "varsayım yapma, doğrula" kuralı

### v0.5-v0.8
- **v0.8:** her değişiklik anında; yiyecekler porsiyonla seçilir; hedefler plana ve ağırlığa bağlı
- **v0.7:** Beslenme sekmesi, form uygulamada
- **v0.6:** Garmin iş bölümü (Fenix 8), FIT kurs dosyaları, rehber
- **v0.5:** yarış modu (CP'ye vardım, kesim payı, konum, rota dışı)

### v0.1-v0.4 ve planlama
- Çevrimdışı PWA; A/B/C planlayıcı; sektör bazlı model (Az 15, Orta 23, Çok 34); sadece tempo (dk/km); resmî GPX doğrulandı

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
- Arşiv (tüm ayrıntı, tablolar; git dışı, yalnızca yerelde): `docs/arsiv/plan-arsiv-2026-10-06.md`, `docs/arsiv/plan-arsiv-2026-10-02.md`; 3B araştırması: `docs/arastirma/3b-veri-raporu.md`; doğrulama araçları: `tools/`
- Depo ZIP'leri: `kapadokya-63k-v0.17-degisenler.zip`, `...-tam.zip`; Garmin: `kapadokya-63k-kurs.fit`
- Test listeleri: `docs/test-listeleri/v0.17.md` (eski: [v0.17 artifact](https://claude.ai/artifact/R4dz2Hvz3bAHyTv2TmVgvq))
- Tanıtım sunumu: `kapadokya-63k-planner-tanitim.pptx`, `kapadokya-63k-planner-tanitim.pdf` (ana adres: candid-zabaione-2be2ed.netlify.app)

### Kaynaklar
- Yarış: cappadociaultratrail.com (kurallar, GPX)
- Beslenme: ISSN ultra bildirgesi (Tiller 2019, pubmed.ncbi.nlm.nih.gov/31699159), ter sodyumu normatif verisi (Baker, gssiweb.org), maraton ter sodyumu (Lara 2017, pubmed.ncbi.nlm.nih.gov/26661748), 161 km ultrada sodyum (Hoffman 2015, PMC4688305), WASSUP (Sports Med Open 2021), hiponatremi konsensüsü (aafp.org), TürKomp, ürün satıcı ve üretici sayfaları
- Garmin: Fenix 8 kılavuzu, coursepointer; yayın: docs.netlify.com
