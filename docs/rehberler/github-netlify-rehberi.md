# GitHub + Netlify: ücretsiz test sürümleri rehberi

**Amaç:** Ara sürümler ücretsiz bir **test adresinde** (test--SITEADI.netlify.app) yayınlansın; sadece kilometre taşı sürümleri ana adrese (15 kredi) gitsin.

Etiketler: **[SEN]** senin yapacağın, **[CLAUDE]** benim yapacağım. Kurulum bilgisayardan en rahatı.

---

## A. Kurulum (bir kez)

**A1. [CLAUDE] Depoya hazır dosyalar** ✅ Hazır: `kapadokya-63k-v0.12.1-depo.zip`. İçinde 19 dosya: uygulama dosyaları, `netlify.toml` (Netlify'a "derleme yok, kökten yayınla" der) ve `README.md`. Uygulama test adresinde açılınca en üstte turuncu **"TEST ORTAMI"** şeridi çıkar, ana adreste çıkmaz.

**A2. [SEN] GitHub hesabı** (yoksa): github.com > Sign up. Ücretsiz.

**A3. [SEN] Depo oluştur:** Sağ üstte **+ > New repository**
- Repository name: `kapadokya-63k`
- **Private** (önerilir; Public de çalışır)
- "Add a README file" **işaretleme** (README bizim dosyalarda var)
- **Create repository**

**A4. [SEN] Dosyaları ana dala (main) yükle:**
1. ZIP'i bilgisayarında aç (klasöre çıkar)
2. Yeni depo sayfasında **"uploading an existing file"** bağlantısına tıkla (ya da **Add file > Upload files**)
3. Klasördeki **19 dosyanın hepsini** seç ve sayfaya sürükle (klasörü değil, içindeki dosyaları)
4. Alttaki "Commit changes" kutusuna `v0.12.1` yaz, **Commit directly to the main branch** seçili olsun, **Commit changes**
5. Kontrol: depo sayfasında `index.html`, `netlify.toml`, `sw.js` gibi dosyalar en üst seviyede görünmeli

**A5. [SEN] Test dalını oluştur:** Depo sayfasında dosya listesinin üstündeki **main** düğmesine tıkla > kutuya `test` yaz > **Create branch: test from main**

**A6. [SEN] Netlify'da mevcut siteyi depoya bağla:**
1. app.netlify.com > siten > **Project configuration > Build & deploy > Continuous deployment**
2. **Link repository** (veya "Link to Git provider") > **GitHub** > izin ver (yalnızca `kapadokya-63k` deposuna izin vermen yeterli) > depoyu seç
3. Production branch: **main**; Build command: **boş**; Publish directory: **.** (nokta). `netlify.toml` bunları zaten söylüyor
4. **Deploy** / **Link** ile bitir
- ⚠️ Bu bağlama bir **üretim yayını** yapar (15 kredi). Bu bizim **M1 = v0.12.1** yayınımız olur
- ⚠️ Mevcut sitede "Link repository" seçeneği yoksa: **Add new project > Import an existing project > GitHub** ile yeni site aç. Bu durumda **adres değişir**: telefonda yeni adresi ana ekrana ekle, eski uygulamadan **Test > Yedekleme** ile yedek alıp yenisine geri yükle. Bana yaz, ona göre ilerleriz

**A7. [SEN] Dal yayınlarını aç:**
**Project configuration > Build & deploy > Continuous deployment > Branches and deploy contexts > Configure**
- Branch deploys: **Let me add individual branches** > `test` > **Save**
- (Netlify'ın belgelerine göre dal yayınları varsayılan olarak kapalıdır; bu ayar şart)

**A8. [SEN] İlk test yayınını tetikle ve doğrula:**
1. GitHub'da dal düğmesinden **test** dalına geç
2. `README.md` dosyasını aç > kalem simgesi (Edit) > en sona boş bir satır ekle > **Commit changes** (test dalına)
3. Netlify > **Deploys**: listede **"Branch deploy: test"** görünmeli
4. Telefonda `https://test--SITEADI.netlify.app` adresini aç (SITEADI = sitenin Netlify adı): üstte **TEST ORTAMI** şeridi ve **0.12.1** sürümü görünmeli
5. Test sekmesinde **Kendini sına**: **20 / 20**
6. **Kredi kontrolü:** Netlify > Billing/Usage ekranında bu dal yayınının kredi düşmediğini gör (doğrulanması gereken nokta)

**A9. [SEN] Ana uygulamayı kontrol et:** Telefondaki ana uygulamayı aç > "Yeni sürüm hazır" > **Yenile** > Kendini sına **20 / 20** > Test > Yedekleme ile **yedek al**

---

## B. Her ara sürümde

1. **[CLAUDE]** Yeni sürümü hazırlarım: ZIP + hangi dosyaların değiştiği listesi (genelde 3-6 dosya). Silinmesi gereken dosya olursa ayrıca söylerim
2. **[SEN]** GitHub > dal düğmesinden **test** > **Add file > Upload files** > değişen dosyaları sürükle (aynı adlı dosyaların üzerine yazar) > commit mesajına sürümü yaz (ör. `v0.13-test-1`) > **Commit directly to the test branch**
3. **[SEN]** 1-2 dakika sonra telefonda **test--SITEADI.netlify.app** > "Yeni sürüm hazır" > **Yenile** > **Kendini sına**
4. **[SEN]** Dene, sonucu bana yaz (gerekirse Test > "Test sonuçlarını kopyala")

İpucu: Test adresindeki uygulama ayrı bir site gibidir (ayrı ana ekran simgesi, ayrı veriler). Ana uygulamadaki ayarlarla denemek için: ana uygulamada **Test > Yedekleme > Yedeği göster ve kopyala**, test adresinde **Yedeği geri yükle**.

---

## C. Kilometre taşı (ana adrese yayın)

1. **[CLAUDE]** "Bu sürüm kilometre taşı olabilir" derim (M2: kalibrasyon sonrası, M3: 12 Ekim v1.0)
2. **[SEN]** GitHub > **Pull requests > New pull request** > base: **main** ← compare: **test** > **Create pull request** > **Merge pull request** > **Confirm**
3. Netlify ana adrese üretim yayını yapar (**15 kredi**)
4. **[SEN]** Telefonda ana uygulama > **Yenile** > **Kendini sına** > **yedek al**

---

## Sorun olursa

- **Netlify derleme hatası:** Deploys > hatalı yayın > log metnini bana gönder
- **Dosyalar alt klasörde kaldı** (ör. `kapadokya-63k-v0.12.1-depo/index.html`): dosyaları depo köküne yükle; `index.html` en üst seviyede olmalı
- **Test adresinde eski sürüm:** sayfayı tamamen kapatıp aç; Kendini sına önbellek satırına bak
- **Kredi düştüyse:** hangi yayının düşürdüğünü (Billing/Usage) bana yaz

## Kaynaklar
- Netlify kredi kuralı (üretim yayını 15 kredi, önizleme ve dal yayınları ücretsiz): https://www.netlify.com/changelog/netlify-pricing-update-introducing-credit-based-plans/
- Netlify dal yayınları ayarı: https://docs.netlify.com/deploy/deploy-types/branch-deploys/
