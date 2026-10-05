// Ürün veritabanı (Faz 2). Değerler satıcı sayfalarından alındı; her kayıtta kaynak ve kontrol tarihi var.
// Birimler: karbonhidrat g, sodyum/potasyum/magnezyum/kafein mg, hacim mL (tablet/toz nasıl çözülür), porsiyon başına.
// "na" her zaman SODYUM (mg). Etiket "tuz" veriyorsa naNote'ta belirtilir (AB etiket kuralı: sodyum = tuz / 2,5).
(function () {
var E = 'enduranlar.com', D = 'decathlon.com.tr', W = 'wupsport.com', S = 'supplementler.com', B = 'bigjoy.com.tr';
function ev(u, vendor, values) { return { vendor: vendor || E, url: u, values: values !== false }; }
window.PRODUCTS = [
  /* ---------- Jeller ---------- */
  { id: 'wup-neo3-elma', brand: 'WUP', name: 'Boost NEO3 İzotonik Enerji Jeli, Elma', type: 'gel', unit: 'saşe', size: '45 g',
    kcal: 104, carb: 26, na: 0, k: null, mg: null, caf: 0, vol: null, naNote: 'Etikette tuz 0 g',
    note: 'Üretici (wupsport.com): 26 g karbonhidrat, 104 kcal; enduranlar.com tablosunda 25,7 g ve 103 kcal. Üç tip karbonhidrat; üretici 25-30 dakikada bir saşe öneriyor.',
    src: [ev('https://enduranlar.com/en/products/wup-boost-neo3-isotonic-energy-gel-apple'), ev('https://www.wupsport.com/en/product/wup-boost-neo-energy-gel-apple-14-portions', W)], checked: '2026-10-01', conf: 'Satıcı sayfası (besin tablosu)' },
  { id: 'ingobio-mango', brand: 'InGoBio', name: 'PowerGEL, Mango', type: 'gel', unit: 'saşe', size: '50 g',
    kcal: 106, carb: 26.5, na: 9.8, k: 19.5, mg: 5, caf: 0, vol: null, naNote: 'Etikette sodyum 9,84 mg',
    note: 'Maltodekstrin ve glikoz; kalsiyum 5 mg, B1 0,2 mg.',
    src: [ev('https://enduranlar.com/en/products/ingobio-powergel-mango')], checked: '2026-10-01', conf: 'Satıcı sayfası (besin tablosu)' },
  { id: 'ingobio-cherry-50', brand: 'InGoBio', name: 'PowerGEL, Kiraz + 50 mg kafein', type: 'gel', unit: 'saşe', size: '50 g',
    kcal: 106, carb: 26.5, na: 9.8, k: 19.5, mg: 5, caf: 50, vol: null, naNote: 'Etikette sodyum 9,84 mg',
    note: 'Kafein 50 mg.', src: [ev('https://enduranlar.com/en/products/ingobio-powergel-cherry-50mg-caffeine')], checked: '2026-10-01', conf: 'Satıcı sayfası (besin tablosu)' },
  { id: 'ingobio-espresso-150', brand: 'InGoBio', name: 'PowerGEL, Espresso + 150 mg kafein', type: 'gel', unit: 'saşe', size: '50 g',
    kcal: 106, carb: 26.5, na: 9.8, k: 19.5, mg: 5, caf: 150, vol: null, naNote: 'Etikette sodyum 9,84 mg',
    note: 'Kafein 150 mg (yüksek).', src: [ev('https://enduranlar.com/en/products/ingobio-powergel-espresso-150mg-caffeine')], checked: '2026-10-01', conf: 'Satıcı sayfası (besin tablosu)' },
  { id: 'onthego-progel-portakal', brand: 'On The Go', name: 'Progel Enerji Jeli, Portakal veya Elma', type: 'gel', unit: 'saşe', size: '60 mL',
    kcal: 96, carb: 24, na: 120, k: null, mg: null, caf: 0, vol: null, naNote: 'Ambalaj etiketinde TUZ 0,3 g (kullanıcı ambalajdan kontrol etti); sodyum = 0,3 g / 2,5 = 120 mg. bigjoy.com.tr sayfasında 0,03 g yazıyor, o değer hatalı; enduranlar.com ve Decathlon 0,3 g ile uyumlu',
    note: 'İzotonik; üretici 25-30 dakikada bir öneriyor.',
    src: [{ vendor: 'bigjoy.com.tr (satış sayfası; tuz değeri hatalı)', url: 'https://www.bigjoy.com.tr/onthego-progel-24x60', values: false }, ev('https://enduranlar.com/en/products/onthego-progel-orange-box-24-pieces'), ev('https://www.decathlon.com.tr/p/on-the-go-progel-enerji-jeli-elma/_/R-p-X8762613', D)], checked: '2026-10-02', conf: 'Ambalaj etiketiyle doğrulandı (kullanıcı); BigJoy sayfasındaki 0,03 g hatalı' },
  { id: 'onthego-progel-mocha-150', brand: 'On The Go', name: 'Kafeinli Progel, Caffe Mocha', type: 'gel', unit: 'saşe', size: '60 mL',
    kcal: 96, carb: 24, na: 24, k: null, mg: null, caf: 150, vol: null, naNote: 'Etikette TUZ 0,06 g; sodyum = 0,06 g / 2,5 = 24 mg (hesaplandı). Progel jellerindeki ondalık hatası görüldüğü için bu değerin ambalajdan kontrol edilmesi iyi olur (henüz doğrulanmadı)',
    note: 'Kafein 150 mg. Üretici günde en fazla 2 jel öneriyor (bilgi; planda sınırlanmaz, kafein toplamı kullanıcı sınırına göre kontrol edilir).', src: [ev('https://enduranlar.com/products/onthego-kafeinli-progel-caffe-mocha-aromali'), ev('https://www.decathlon.com.tr/p/on-the-go-progel-coffee-mocha/_/R-p-X8762614', D)], checked: '2026-10-02', conf: 'İki satıcı sayfası aynı (tuzdan hesaplandı)' },
  { id: 'sis-go-energy-caf-150', brand: 'SiS', name: 'GO Energy + Kafein Jeli, Espresso', type: 'gel', unit: 'saşe', size: '60 mL',
    kcal: 87, carb: 22, na: 16, k: null, mg: null, caf: 150, vol: null, naNote: 'Etikette TUZ 0,04 g; sodyum = 0,04 g / 2,5 = 16 mg (hesaplandı)',
    note: 'Kafein 150 mg; B6, folik asit, B12 içerir.', src: [ev('https://enduranlar.com/en/products/sis-go-energy-caffeine-energy-gel-espresso-flavored')], checked: '2026-10-01', conf: 'Satıcı sayfası (tuzdan hesaplandı)' },
  { id: 'sis-go-isotonic', brand: 'SiS', name: 'GO Isotonic Energy Gel', type: 'gel', unit: 'saşe', size: '60 mL',
    kcal: 87, carb: 22, na: 0, naUnknown: true, k: null, mg: null, caf: 0, vol: null, naNote: 'Sodyum değeri kaynakta görülmedi (0 sayıldı, etiketten kontrol et)',
    note: 'Her saşede 22 g karbonhidrat (maltodekstrin).', src: [ev('https://www.supplementler.com/urun/sis-go-isotonic-energy-gel-60-ml-30-adet-25284', S)], checked: '2026-10-01', conf: 'Satıcı sayfası (karbonhidrat, kcal); sodyum bilinmiyor' },
  { id: 'torq-peach', brand: 'Torq', name: 'Energel, Şeftali', type: 'gel', unit: 'saşe', size: '40 g',
    kcal: 84.4, carb: 21.1, na: 40, k: null, mg: null, caf: 0, vol: null, naNote: 'Etikette TUZ 0,101 g; sodyum = 0,101 g / 2,5 = 40 mg (hesaplandı)',
    note: '', src: [ev('https://enduranlar.com/en/products/torq-nutrition-energel-peach'), ev('https://www.decathlon.com.tr/p/energel-enerji-ve-performans-jeli-seftali-40-gr/_/R-p-X8746673', D, false)], checked: '2026-10-02', conf: 'Satıcı sayfası (tuzdan hesaplandı); Decathlon yalnızca satış' },
  { id: 'torq-coffee-50', brand: 'Torq', name: 'Energel, Kahve + 50 mg kafein', type: 'gel', unit: 'saşe', size: '40 g',
    kcal: 84.4, carb: 21.1, na: 103, k: null, mg: null, caf: 58, vol: null, naNote: 'Üretici ve enduranlar.com: tuz 257 mg, sodyum 103 mg. Decathlon sayfası: tuz 0,101 g (sodyum 40 mg). Tutarsız; üretici değeri alındı',
    note: 'Kafein: enduranlar.com 50 mg, Decathlon sayfası 57,75 (birimi yanlış yazılmış, mg olmalı); yüksek olan (58 mg) alındı.', src: [ev('https://enduranlar.com/en/products/torq-nutrition-energel-coffee'), { vendor: 'torqnutrition.com.tr (üretici)', url: 'https://www.torqnutrition.com.tr/energel-caffeine-enerji-ve-performans-jeli-40-mg', values: true }, ev('https://www.decathlon.com.tr/p/energel-caffeine-enerji-ve-performans-jeli-kafein-40-gr/_/R-p-X8746674', D)], checked: '2026-10-02', conf: 'Kaynaklar arasında tutarsızlık var (kayıttaki notlara bak)' },

  { id: 'dec-energygel-plus-kola', brand: 'Decathlon (Aptonia)', name: 'Energy Gel+ Kolalı Enerji Jeli', type: 'gel', unit: 'jel', size: '32 g',
    kcal: 88, carb: 22, na: 0, naUnknown: true, k: null, mg: null, caf: 20, vol: null, naNote: 'Sodyum sitrat içeriyor ama sodyum/tuz miktarı kaynakta görülmedi (0 sayıldı, etiketten kontrol et)',
    note: 'Kafein 20 mg; 240 mg BCAA; B1, B6, B12, E vitaminleri ve çinko.', src: [ev('https://www.decathlon.com.tr/p/kolali-enerji-jeli-1-x-32-g-energy-gel/_/R-p-311093', D)], checked: '2026-10-02', conf: 'Satıcı sayfası; sodyum bilinmiyor' },
  { id: 'dec-energygel-orman', brand: 'Decathlon', name: 'Energy Gel Orman Meyveleri', type: 'gel', unit: 'jel', size: '46 g (35 mL)',
    kcal: 120, carb: 30, na: 0, k: null, mg: null, caf: 0, vol: null, naNote: 'Etikette tuz 0 g',
    note: 'B1, B6, B12 vitaminleri. Kafein belirtilmemiş (0 sayıldı).', src: [ev('https://www.decathlon.com.tr/p/energy-gel-orman-meyveleri-aromali-enerji-jeli-x1/_/R-p-341328', D)], checked: '2026-10-02', conf: 'Satıcı sayfası (besin tablosu)' },
  { id: 'dec-meyveli-jel', brand: 'Decathlon', name: 'Meyveli Jel (pestil), Kırmızı Meyveler', type: 'gel', unit: 'paket', size: '25 g',
    kcal: 84, carb: 21, na: 48, k: null, mg: null, caf: 0, vol: null, naNote: 'Etikette TUZ 0,12 g; sodyum = 0,12 g / 2,5 = 48 mg (hesaplandı)',
    note: 'Yarısı meyve ezmesi olan katı jel (pestil); B1, B3, B6, C vitaminleri.', src: [ev('https://www.decathlon.com.tr/p/meyveli-jel-kirmizi-meyveler-5-x-25-g/_/R-p-311064', D)], checked: '2026-10-02', conf: 'Satıcı sayfası (tuzdan hesaplandı)' },

  { id: 'wup-boost-iso-portakal', brand: 'WUP', name: 'Boost ISO İzotonik Enerji Jeli, Portakal', type: 'gel', unit: 'saşe', size: '',
    kcal: null, carb: 25, na: 194, k: null, mg: null, caf: 0, vol: null, naNote: 'Kaynakta tuz 485 mg; sodyum = 485 / 2,5 = 194 mg (hesaplandı)',
    note: 'İzotonik, su gerektirmez; iki tip karbonhidrat. Kafein belirtilmemiş (0 sayıldı).', src: [ev('https://enduranlar.com/en/blogs/blog/wup-energy-guide')], checked: '2026-10-02', conf: 'Satıcının ürün rehberi (enerji değeri yok)' },
  { id: 'onthego-energy-chews', brand: 'On The Go (BigJoy)', name: 'Energy Chews (6 parça, 30 g)', type: 'gel', unit: 'paket', size: '30 g',
    kcal: 104, carb: 25, na: 177, k: null, mg: null, caf: 0, cafUnknown: true, vol: null, naNote: 'Etikette sodyum 177 mg; aynı tabloda tuz 0,59 g (= 236 mg) yazıyor, tutarsız; sodyum değeri alındı',
    note: 'GUARANA (kafein kaynağı) içerir, kafein miktarı yazmıyor: kafein toplamına katılamaz, otomatik öneriye girmez. Kalsiyum 65,6 mg.', src: [{ vendor: 'bigjoy.com.tr (üretici)', url: 'https://www.bigjoy.com.tr/onthego-energy-chews', values: true }], checked: '2026-10-02', conf: 'Üretici sayfası; kafein bilinmiyor' },

  /* ---------- Efervesan tabletler ve tozlar ---------- */
  { id: 'wup-hydractive-limon', brand: 'WUP', name: 'Hydractive Elektrolit ve Kafeinli Efervesan Tablet, Limon', type: 'tablet', unit: 'tablet', size: '1 tablet',
    kcal: null, carb: 0, na: 200, k: 100, mg: 90, caf: 95, vol: 500, naNote: 'Etikette sodyum 200 mg',
    note: 'KAFEİNLİ: tablet başına 95 mg (Decathlon ve enduranlar.com ürün sayfası); enduranlar.com üzerindeki başka bir sayfada 80 mg yazıyor, yüksek olan alındı. C vitamini 80 mg. 500 mL suda çözülür. Karbonhidrat belirtilmemiş (0 sayıldı).',
    src: [{ vendor: 'wupsport.com (üretici)', url: 'https://www.wupsport.com/en/product/wup-water-up-hydractive-sports-supplement-electrolyte-caffeine-10x20-effervescent-tablet', values: true }, ev('https://www.decathlon.com.tr/p/wup-hydractive-elektrolit-efervesan-tablet-20-tablet/_/R-p-X8744102', D), ev('https://enduranlar.com/en/products/wup-hydractive-lemon-20-effervescent-tablet')], checked: '2026-10-02', conf: 'Üretici sayfası 95 mg kafeini doğruluyor' },
  { id: 'wup-hydractive-elma', brand: 'WUP', name: 'Hydractive Efervesan Tablet, Elma (kafeinsiz)', type: 'tablet', unit: 'tablet', size: '1 tablet',
    kcal: null, carb: 0, na: 200, k: 100, mg: 90, caf: 0, vol: 500, naNote: 'Ürün açıklamasında sodyum 200 mg',
    note: 'Lösin 100 mg, C vitamini 80 mg, kalsiyum 20 mg. Kafein belirtilmemiş (0 sayıldı, etiketten kontrol et). 500 mL suda çözülür.',
    src: [ev('https://enduranlar.com/en/products/wup-hydractive-apple-20-effervescent-tablet-2')], checked: '2026-10-01', conf: 'Satıcı sayfası (ürün açıklaması)' },
  { id: 'onthego-elektrolit-limon', brand: 'On The Go', name: 'Elektrolit Efervesan Tablet, Limon veya Wildberry', type: 'tablet', unit: 'tablet', size: '1 tablet',
    kcal: 0, carb: 0, na: 360, k: 65, mg: 8.1, caf: 0, vol: 450, naNote: 'Etikette TUZ 0,9 g; sodyum = 0,9 g / 2,5 = 360 mg (hesaplandı)',
    note: 'Kalsiyum 102 mg; B1, B6, B12; yeşil çay özütü ve lösin içerir, kafein miktarı yazmıyor (0 sayıldı, kontrol et). 400-500 mL suda çözülür. Limon ve Wildberry aynı değerlerde.',
    src: [ev('https://www.decathlon.com.tr/p/on-the-go-elektrolit-limon-tablet/_/R-p-X8762651', D), ev('https://enduranlar.com/en/products/onthego-electrolyte-lemon-20-effervescent-tablet'), { vendor: 'bigjoy.com.tr (üretici)', url: 'https://www.bigjoy.com.tr/onthego-electrolyte-sports-drink1', values: true }], checked: '2026-10-02', conf: 'Satıcı sayfaları; üretici kalsiyum, potasyum, magnezyumu doğruluyor (tuz üretici sayfasında görülmedi)' },
  { id: 'wup-carb3-elma', brand: 'WUP', name: 'Carb3+ Karbonhidrat ve Elektrolit Saşe, Elma veya Limon', type: 'powder', unit: 'saşe', size: '30 g',
    kcal: 104, carb: 26, na: 400, k: 100, mg: 70, caf: 0, vol: 500, naNote: 'Üretici ve Decathlon: sodyum 400 mg (enduranlar.com sayfasındaki "tuz 0,55 g" ifadesi bununla tutmuyor; üretici değeri alındı)',
    note: 'Üç tip karbonhidrat; kalsiyum 60 mg, çinko 10 mg. 1 saşe 500 mL suya (üretici ve Decathlon).',
    src: [{ vendor: 'wupsport.com (üretici)', url: 'https://www.wupsport.com/en/product/wup-carb3-lemon-24-packs-effervescent-powder', values: true }, ev('https://www.decathlon.com.tr/p/wup-carb3-yuksek-karbonhidrat-enerji-ve-elektrolit-elma-sase/_/R-p-X8850339', D), ev('https://enduranlar.com/en/products/wup-carb3-apple-box-24-pieces')], checked: '2026-10-02', conf: 'Üretici ve satıcı sayfası' },

  { id: 'dec-iso-plus', brand: 'Decathlon', name: 'ISO+ İzotonik Toz İçecek (1 doz 38 g)', type: 'powder', unit: 'doz', size: '38 g',
    kcal: 131, carb: 33, na: 0, naUnknown: true, k: null, mg: null, caf: 0, vol: 500, naNote: 'Sodyum içerdiği belirtiliyor ama miktarı kaynakta görülmedi (0 sayıldı, etiketten kontrol et)',
    note: 'Üretici 1 dozu 500 mL suda öneriyor; 33 g karbonhidrat.', src: [ev('https://www.decathlon.com.tr/p/izotonik-toz-icecek-650-g-cilekli-kirazli-iso/_/R-p-304199', D)], checked: '2026-10-02', conf: 'Satıcı sayfası; sodyum bilinmiyor' },

  { id: 'ingobio-isocarbo', brand: 'InGoBio', name: 'IsoCarbo Karbonhidrat ve Elektrolit Tozu (1 saşe 30 g)', type: 'powder', unit: 'saşe', size: '30 g',
    kcal: 96, carb: 24, na: 515, k: 585, mg: 30, caf: 0, vol: 400, naNote: 'Üretici: porsiyonda sodyum 515 mg; hazırlanmış içeceğin 100 mL\'sinde sodyum 128,7, potasyum 146,25, magnezyum 7,5 mg (400 mL ile çarpıldı)',
    note: 'Üretici 400 mL suya öneriyor. enduranlar.com sayfası 25 g karbonhidrat yazıyor ve magnezyum ile potasyumu karıştırmış görünüyor (585 mg magnezyum, 19,5 mg potasyum); üretici değerleri alındı. Kalsiyum 20 mg.',
    src: [{ vendor: 'ingobio.com (üretici)', url: 'https://ingobio.com/isocarbo-izotonik-icecek/', values: true }, ev('https://enduranlar.com/en/products/ingobio-isocarbo')], checked: '2026-10-02', conf: 'Üretici sayfası (satıcı sayfasıyla tutarsızlık notta)' },
  { id: 'ingobio-electrolyte-mango', brand: 'InGoBio', name: 'Electrolyte Elektrolit Tozu, Mango (1 saşe)', type: 'powder', unit: 'saşe', size: '',
    kcal: null, carb: 12.75, na: 297, k: 195, mg: 10, caf: 0, vol: 500, naNote: 'Satıcı sayfasında sodyum 296,75 mg (tuz 500 mg)',
    note: 'Kalsiyum 10 mg. Hazırlama hacmi kaynakta görülmedi: 500 mL VARSAYILDI, etiketten kontrol et. Kiraz ve mojito aromaları da var (değerleri ayrıca doğrulanmadı).',
    src: [ev('https://enduranlar.com/en/products/ingobio-electrolyte-mango')], checked: '2026-10-02', conf: 'Satıcı sayfası; hazırlama hacmi varsayım' },

  /* ---------- Tuz tableti ---------- */
  { id: 'wup-salt-tablet', brand: 'WUP', name: 'Electrolyte Boost Tuz Tableti', type: 'salt', unit: 'tablet', size: '1 tablet',
    kcal: null, carb: 0, na: 100, k: 50, mg: 60, caf: 0, vol: null, naNote: 'Ürün açıklamasında tablet başına sodyum 100 mg',
    note: 'C vitamini 40 mg, D3 10 µg. Tatlandırıcı ve aroma içermez; suyla yutulur.', src: [ev('https://enduranlar.com/en/products/wup-electrolyte-boost-salt-tablet')], checked: '2026-10-01', conf: 'Satıcı sayfası (ürün açıklaması)' },
  { id: 'bigjoy-sodium-plus', brand: 'On The Go (BigJoy)', name: 'Sodium Plus Kapsül', type: 'salt', unit: 'kapsül', size: '1 kapsül',
    kcal: null, carb: 0, na: 200, k: 30, mg: 30, caf: 0, vol: null, naNote: 'Üretici: kapsül başına sodyum 200 mg',
    note: 'Kalsiyum 30 mg. Üretici günde 1 kapsül öneriyor (bilgi; planda sınırlanmaz).', src: [{ vendor: 'bigjoy.com.tr (üretici)', url: 'https://www.bigjoy.com.tr/sodium-plus', values: true }], checked: '2026-10-02', conf: 'Üretici sayfası' }
];
})();

// Kontrol noktalarında bulunan yiyecekler (resmî 2026 kurallar sayfasındaki listeden) ve YAKLAŞIK besin değerleri.
// Değerler genel besin veri tabanlarına göre kaba tahmindir (marka, hazırlık ve porsiyona göre değişir); porsiyon sayısını kullanıcı seçer.
// kcal, carb g, na mg (sodyum), k mg, mg mg, caf mg; her biri belirtilen porsiyon için.
window.FOODS = [
  { id: 'muz', name: 'Muz', portion: '1 orta muz (yaklaşık 120 g yenebilir)', kcal: 105, carb: 21, na: 2, k: 191, mg: 32, caf: 0,
    ver: 'Karbonhidrat, sodyum, potasyum: TürKomp (ithal muz, 100 g\'da 17,64 g, 2 mg, 159 mg). Enerji ve magnezyum doğrulanmadı.', src: [{ label: 'TürKomp', url: 'https://turkomp.tarimorman.gov.tr/food-muz-ithal-cesit-396' }] },
  { id: 'portakal', name: 'Portakal', portion: '1 orta portakal (yaklaşık 130 g yenebilir)', kcal: 62, carb: 14, na: 5, k: 260, mg: 13, caf: 0,
    ver: 'Karbonhidrat, sodyum, potasyum: TürKomp (Washington Navel, 100 g\'da 10,49 g, 4 mg, 200 mg). Enerji ve magnezyum doğrulanmadı.', src: [{ label: 'TürKomp', url: 'https://turkomp.tarimorman.gov.tr/food-portakal-washington-navel-gobekli-portakali-300' }] },
  { id: 'elma', name: 'Elma', portion: '1 orta elma', kcal: 95, carb: 25, na: 2, k: 195, mg: 9, caf: 0, ver: 'Doğrulanmadı (genel tahmin).' },
  { id: 'uzum', name: 'Üzüm', portion: '1 avuç (100 g)', kcal: 69, carb: 18, na: 2, k: 191, mg: 7, caf: 0, ver: 'Doğrulanmadı (genel tahmin).' },
  { id: 'kek', name: 'Kek', portion: '1 dilim (50 g)', kcal: 190, carb: 26, na: 140, k: 50, mg: 8, caf: 0, ver: 'Doğrulanmadı (genel tahmin; kek türüne göre çok değişir).' },
  { id: 'kraker', name: 'Tuzlu kraker', portion: '4 adet (15 g)', kcal: 65, carb: 11, na: 170, k: 25, mg: 5, caf: 0, ver: 'Doğrulanmadı (genel tahmin; markaya göre değişir).' },
  { id: 'ekmek', name: 'Ekmek', portion: '1 dilim (30 g)', kcal: 83, carb: 15, na: 103, k: 34, mg: 8, caf: 0,
    ver: 'Enerji, sodyum, potasyum, magnezyum: TürKomp (beyaz ekmek, 100 g\'da 276 kcal, 343 mg, 113 mg, 25 mg). Karbonhidrat doğrulanmadı.', src: [{ label: 'TürKomp', url: 'https://turkomp.tarimorman.gov.tr/food-ekmek-beyaz-126' }] },
  { id: 'peynir', name: 'Beyaz peynir', portion: '1 dilim (30 g)', kcal: 93, carb: 1, na: 384, k: 31, mg: 5, caf: 0,
    ver: 'Enerji, sodyum, potasyum, magnezyum: TürKomp (tam yağlı beyaz peynir, 100 g\'da 309 kcal, 1281 mg, 103 mg, 18 mg). Karbonhidrat doğrulanmadı.', src: [{ label: 'TürKomp', url: 'https://turkomp.tarimorman.gov.tr/food-peynir-beyaz-tam-yagli-yag-kuru-maddede---45-8' }] },
  { id: 'helva', name: 'Helva', portion: '1 dilim (30 g)', kcal: 150, carb: 15, na: 38, k: 130, mg: 45, caf: 0,
    ver: 'Sodyum: TürKomp (Safranbolu tahin helvası, 100 g\'da 128 mg). Diğerleri doğrulanmadı.', src: [{ label: 'TürKomp', url: 'https://turkomp.tarimorman.gov.tr/component_result-sodyum-na-26' }] },
  { id: 'nutella', name: 'Nutella (fındık kreması)', portion: '1 yemek kaşığı (20 g)', kcal: 105, carb: 11, na: 3, k: 89, mg: 10, caf: 0,
    ver: 'Karbonhidrat, sodyum, potasyum, magnezyum: TürKomp (kakaolu fındık kreması, 100 g\'da 55,49 g, 13 mg, 443 mg, 49 mg). Enerji doğrulanmadı.', src: [{ label: 'TürKomp', url: 'https://turkomp.tarimorman.gov.tr/food-findik-kremasi-kakaolu-607' }] },
  { id: 'cezerye', name: 'Cezerye', portion: '1 küçük dilim (30 g)', kcal: 100, carb: 20, na: 5, k: 40, mg: 10, caf: 0, ver: 'Doğrulanmadı (kaba tahmin).' },
  { id: 'findik', name: 'Fındık-fıstık', portion: '1 avuç (30 g)', kcal: 185, carb: 6, na: 2, k: 194, mg: 80, caf: 0,
    ver: 'Potasyum: TürKomp (kavrulmuş iç fındık, 100 g\'da 645 mg). Diğerleri doğrulanmadı; tuzsuz varsayıldı, tuzlu ise sodyum çok daha yüksek.', src: [{ label: 'TürKomp', url: 'https://turkomp.tarimorman.gov.tr/component_result-potasyum-k-25' }] },
  { id: 'patates', name: 'Haşlanmış patates', portion: '1 küçük (100 g)', kcal: 87, carb: 20, na: 6, k: 328, mg: 22, caf: 0, ver: 'Doğrulanmadı (tuzsuz; tuz serpilirse "Tuz" ayrıca seçilmeli).' },
  { id: 'cikolata', name: 'Çikolata', portion: '2 kare (20 g)', kcal: 110, carb: 12, na: 10, k: 100, mg: 30, caf: 0, ver: 'Doğrulanmadı (genel tahmin; bitter çikolatada biraz kafein olabilir).' },
  { id: 'tuz', name: 'Tuz', portion: '1 çimdik (yaklaşık 0,5 g)', kcal: 0, carb: 0, na: 200, k: 0, mg: 0, caf: 0, ver: 'Sodyum = tuz / 2,5 kuralıyla hesaplandı; bir çimdiğin 0,5 g olduğu varsayımdır.' },
  { id: 'corba', name: 'Çorba', portion: '1 orta porsiyon (mercimek çorbası)', kcal: 137, carb: 25, na: 260, k: 400, mg: 25, caf: 0,
    ver: 'Karbonhidrat, sodyum, potasyum, enerji: tek bir kaynak (mercimek çorbası, 1 orta porsiyon: 24,85 g, 262 mg, 403 mg, 137 kcal). Noktadaki çorba türü ve tuzu farklı olabilir; magnezyum doğrulanmadı.', src: [{ label: 'cnnturk.com', url: 'https://www.cnnturk.com/yemek-tarifleri/mercimek-besin-degeri-mercimek-kac-kalori-mercimek-corbasi-besin-degerleri-2095345' }] },
  { id: 'kola', name: 'Kola', portion: '1 bardak (200 mL)', kcal: 85, carb: 21, na: 0, k: 0, mg: 0, caf: 20,
    ver: 'Karbonhidrat ve kafein: Coca-Cola Türkiye (100 mL\'de 10,6 g, litrede 98 mg kafein). Noktadaki kola markası farklı olabilir; enerji yaklaşık.', src: [{ label: 'coca-cola.com/tr', url: 'https://www.coca-cola.com/tr/tr/brands/coca-cola' }] }
];
// Her kontrol noktasında bulunanlar (sırayla: İbrahimpaşa, Uçhisar, Göreme, Çavuşin, Akdağ)
window.AID_MENU = [
  ['muz', 'portakal', 'kek', 'kraker', 'tuz', 'kola'],
  ['muz', 'portakal', 'elma', 'kek', 'kraker', 'ekmek', 'peynir', 'helva', 'tuz', 'corba', 'kola'],
  ['muz', 'portakal', 'elma', 'uzum', 'kek', 'kraker', 'ekmek', 'nutella', 'cezerye', 'findik', 'patates', 'tuz', 'kola'],
  ['muz', 'portakal', 'elma', 'kek', 'kraker', 'ekmek', 'peynir', 'helva', 'cikolata', 'tuz', 'corba', 'kola'],
  ['muz', 'portakal', 'elma', 'kek', 'kraker', 'kola']
];
