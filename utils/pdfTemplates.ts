export const generatePdfHtml = (
  base64Image: string,
  locationData: { latitude: number; longitude: number } | null,
  address: string | null,
  timestamp: string | null,
  operator: string | null,
  fiber: string | null,
  type: string | null,
  municipalityName: string,
  municipalityLogo: string | null,
  manualMahalle?: string,
  manualSokak?: string,
  sokakTuru?: string,
  manualIlce?: string,
  bazIstasyonuOlcuCm?: string,
  trafoOlcuCm?: string
) => {
  let il = "Adana"; // Default or parsed from address
  const ilce = manualIlce?.trim() ?? '';
  const bazOlcu = bazIstasyonuOlcuCm?.trim() ?? '';
  const trafoOlcu = trafoOlcuCm?.trim() ?? '';
  const parsedMahalle = address?.split(',').find(p => p.toLowerCase().includes('mah'))?.trim() || "-";
  const parsedCadde = address?.split(',').find(p => p.toLowerCase().includes('cad'))?.trim() || "-";
  const parsedSokak = address?.split(',').find(p => p.toLowerCase().includes('sok'))?.trim() || "-";
  const parsedBulvar = address?.split(',').find(p => p.toLowerCase().includes('bul'))?.trim() || "-";
  
  const mahalle = (manualMahalle && manualMahalle.trim()) ? manualMahalle.trim() : parsedMahalle;
  const displayAddressValue = (manualSokak && manualSokak.trim()) ? manualSokak.trim() : (
    sokakTuru === 'Cadde' ? parsedCadde : 
    sokakTuru === 'Bulvar' ? parsedBulvar : 
    parsedSokak
  );

  if (address) {
    const parts = address.split(',');
    if (parts.length > 1) {
      il = parts[parts.length - 1].trim().split(' ')[0] || "Adana";
    }
  }

  let headerSubtitle = "";
  switch (type) {
    case 'Menhol':
      headerSubtitle = "ELEKTRONİK SİSTEMLER –TELEKOMÜNİKASYON ALT YAPI TESİSLERİ FİBER OPTİK YERALTI MONTAJLI KABİN ( MENHOL) KEŞİFİ SAHA TEKNİK TESPİT TUTANAĞI";
      break;
    case 'Kabin':
      headerSubtitle = "ELEKTRONİK SİSTEMLER –TELEKOMÜNİKASYON ALT YAPI TESİSLERİ FİBER OPTİK YERÜSTÜ ( OUTDOOR ) MONTAJLI KABİN –SAHA DOLABI KEŞİFİ SAHA TEKNİK TESPİT TUTANAĞI";
      break;
    case 'Trafo':
      headerSubtitle = "ELEKTRİK AYDINLATMA TRAFOSU SAHA TEKNİK TESPİT TUTANAĞI";
      break;
    case 'Aydınlatma Direği':
      headerSubtitle = "ELEKTRİK AYDINLATMA DİREĞİ KEŞİF SAHA TEKNİK TESPİT TUTANAĞI - KEŞİF RAPORU";
      break;
    case 'Elektrik Panosu':
      headerSubtitle = "ELEKTRİK AYDINLATMA PANOSU SAHA TEKNİK TESPİT TUTANAĞI";
      break;
    case 'Baz İstasyonu':
      headerSubtitle = "GSM BAZ İSTASYONU SAHA TEKNİK TESPİT RAPOR TUTANAĞI";
      break;
    case 'Doğalgaz':
      headerSubtitle = "DOĞALGAZ SAHA TEKNİK RAPOR TUTANAĞI";
      break;
    default:
      headerSubtitle = "SAHA TEKNİK TESPİT TUTANAĞI";
  }

  const baseCommonInfo = [
    { label: 'İŞLETMECİ FİRMA UNVANI', value: operator || '-' },
    { label: 'İL', value: il || '-' },
    { label: 'İLÇE', value: ilce },
    { label: 'MAHALLE', value: mahalle || '-' },
    { label: (sokakTuru || 'SOKAK').toUpperCase(), value: displayAddressValue },
    { label: 'ENLEM', value: locationData?.latitude?.toFixed(6) || '-' },
    { label: 'BOYLAM', value: locationData?.longitude?.toFixed(6) || '-' },
  ];

  const pdfTemplateConfigs: Record<string, any> = {
    'Menhol': {
      infoRows: [
        ...baseCommonInfo,
        { fullRowHtml: `<tr><td colspan="2" class="red-text">MENHOL BULUNDUĞU KONUM</td></tr>` },
        { label: 'ADA', value: '' },
        { label: 'PAFTA', value: '' },
        { label: 'PARSEL', value: '' },
        { label: 'MENHOL ADRES TARİFİ', value: address || '-' },
        { label: 'MENHOL TİPİ', value: '' },
        { label: 'MENHOL ÖLÇÜLERİ (CM) (EN-BOY)', value: '100X110' },
      ],
      tableLabel: 'MENHOL / KABİN TEKNİK DONANIMLARI',
      questions: [
        'GÖRÜNTÜ KİRLİLİĞİNE NEDEN OLUYOR MU',
        'YOLA TAŞMA DURUMU VAR MI',
        'ÖZEL MÜLKİYET ALANINA TAŞMA VAR MI',
        'MEHOL KAPAĞI YOL / KALDIRIM SEVİYESİNDE Mİ',
        'MENHOL KAPAĞI VAR MI',
        'MENHOL KAPAĞI KIRIK YADA YUVASINA OTURMAMIŞ MI',
        'MENHOL KAPAĞI ÜZERİNE BASILINCA DÖNME, DÜŞME TEHLİKESİ BARINDIRIYOR MU',
        'MENHOL KAPAĞI YERİNDEN ÇIKMAYACAK, SALLANMAYACAK ŞEKİLDE Mİ',
        'YAYA GEÇİŞİNİ ENGELLEYECEK ŞEKİLDE YÜKSELTİSİ VAR MI',
        'TAŞIT TRAFİĞİNİ ENGELLİYOR MU',
        'GÖRME ENGELLİ YAYALAR İÇİN, TEHLİKE TEŞKİL EDİYOR MU',
        'TEKERLEKLİ SANDALYE , BİSİKLET ,ÇOCUK ARABASI , PAZAR ARABASI VS. GİBİ ARAÇLARIN GEÇİŞİN DE TEHLİKE TEŞKİL EDİYOR MU',
        'MENHOL , KALDIRIM DIŞINDA ; YOL , REFÜJ , PARK BAHÇE GİBİ BELEDİYE SORUMLULUĞUNDAKİ ALANLARDA MI',
        'BELEDİYEYE PROJESİ VERİLMİŞ Mİ',
        'BELEDİYEDEN YER TAHSİSİ ONAYI ALINMIŞ MI',
        'STATİK PROJE MÜELLEFİNNCE HAZIRLANMIŞ RAPOR VAR MI',
        'FENNİ MESUL ve MÜELLİF TAAHHÜDÜ VARMI?',
        'EHABS (ELEKTRONİK HABERLEŞME ALTYAPI BİLGİ SİSTEMİ )SİSTEMİNE KAYITLI MI?'
      ],
      description: '<u>AÇIKLAMA :</u> Doğal Afet Bölgelerinde Yapılması zorunlu Zemin etüd raporları Hazırlanmamış ve Kuruma Teslim edilmemiştir',
      hasDeplase: true,
      footerText: "İşbu tespit tutanağı, tarafımızca mahallinde gerçekleştirilen tetkik, tespit ve kontroller sonucunda düzenlenmiş olup imza altına alınmıştır."
    },
    'Kabin': {
      infoRows: [
        ...baseCommonInfo,
        { fullRowHtml: `<tr><td colspan="2" class="red-text">KABİNİN BULUNDUĞU KONUM</td></tr>` },
        { label: 'ADA', value: '' },
        { label: 'PAFTA', value: '' },
        { label: 'PARSEL', value: '' },
        { label: 'KABİNİN ADRES TARİFİ', value: address || '-' },
        { label: 'KABİN TİPİ', value: '' },
        { label: 'KABİN ÖLÇÜLERİ (CM) (EN-BOY-DERİNLİK)', value: '' },
      ],
      tableLabel: 'SAHA DOLABI / KABİN TEKNİK DONANIMLARI',
      questions: [
        'SAHA DOLABI / KABİN KALDIRIMDA MI',
        'KULLANILAN KABİN TİPİ ENERJİ GEREKTİRİYOR MU',
        'ENH PROJESİ VAR MI (BEDAŞ ONAYLI SAYAÇ)',
        'SAYAÇ MÜHÜRLÜ MÜ',
        'TOPRAKLAMA YAPILMIŞ MI',
        'TOPRAKLAMA BAĞLANTILARI SAĞLAM MI',
        'GÖRÜNTÜ KİRLİLİĞİNE NEDEN OLUYOR MU',
        'REKLAM ALANI OLARAK KULLANILIYOR MU',
        'YOLA TAŞMA DURUMU VAR MI',
        'ÖZEL MÜLKİYET ALANINA TAŞMA VAR MI',
        'SAHA DOLABI KAİDESİ SAĞLAM MI',
        'SAHA DOLABININ DEVRİLME RİSKİ VAR MI',
        'KAPAKLARI YETKİSİZ ERİŞİME ENGEL OLACAK ŞEKİLDE KİLİTLİ Mİ',
        'ÜZERİNDE YETKİSİZ ERİŞİME ENGEL OLACAK UYARI LEVHALARI MEVCUT MU',
        'KABİN , KALDIRIM DIŞINDA ; YOL , REFÜJ , PARK BAHÇE GİBİ BELEDİYE SORUMLULUĞUNDAKİ ALANLARDA MI',
        'YAYA GEÇİŞİNİ ENGELLEYECEK ŞEKİLDE Mİ KONUMLANDIRILMIŞ',
        'TAŞIT TRAFİĞİNİ ENGELLİYOR MU',
        'GÖRME ENGELLİ YAYALARIN GEÇİŞİNİ ENGELLİYOR, TEHLİKE TEŞKİL EDİYOR MU',
        'GÖRME ENGELLİLER İÇİN TAHSİS EDİLEN YÜRÜYÜŞ ALANINI KISITLIYOR MU',
        'TEKERLEKLİ SANDALYE , BİSİKLET ,ÇOCUK ARABASI , PAZAR ARABASI VS. GİBİ ARAÇLARIN GEÇİŞİNE ENGEL OLUYOR MU',
        'TİCARETHANE YADA BİNA GİRİŞLERİNİ KISITLIYOR MU',
        'TİCARETHANE YADA VAKIF DERNEK GİBİ SOSYAL AMAÇLI KURULUŞLARIN YAYA GİRİŞ – ÇIKIŞLARINI VE OTOPAR / PARK GİRİŞ ÇIKIŞLARINI ENGELLİYOR MU',
        'BİNALARIN OTO PARK, DEPO VS. ARAÇ ve YAYA GİRİŞİNE ENGEL OLUYOR MU',
        'STATİK PROJE MÜELLEFİNNCE HAZIRLANMIŞ RAPOR VAR MI',
        'FENNİ MESUL ve MÜELLİF TAAHHÜDÜ VARMI',
        'EHABS (ELEKTRONİK HABERLEŞME ALTYAPI BİLGİ SİSTEMİ )SİSTEMİNE KAYITLI MI',
        'BELEDİYEYE PROJESİ VERİLMİŞ Mİ',
        'BELEDİYEDEN YER TAHSİSİ ONAYI ALINMIŞ MI'
      ],
      description: '<u>AÇIKLAMA :</u> Doğal Afet Bölgelerinde Yapılması zorunlu Zemin etüd raporları Hazırlanmamış ve Kuruma Teslim edilmemiştir',
      hasDeplase: true,
      footerText: "İşbu tespit tutanağı, tarafımızca mahallinde gerçekleştirilen tetkik, tespit ve kontroller sonucunda düzenlenmiş olup imza altına alınmıştır."
    },
    'Trafo': {
      infoRows: [
        ...baseCommonInfo,
        { fullRowHtml: `<tr><td colspan="2" class="red-text">TRAFONUN BULUNDUĞU KONUM</td></tr>` },
        { label: 'ADA', value: '' },
        { label: 'PAFTA', value: '' },
        { label: 'PARSEL', value: '' },
        { label: 'TRAFO ADRES TARİFİ', value: address || '-' },
        { label: 'TRAFONUN TİPİ', value: '' },
        { label: 'ELEKTRİK AYDINLATMA TRAFOSU ÖLÇÜLERİ (CM)', value: trafoOlcu },
      ],
      tableLabel: 'TRAFO TEKNİK DONANIMLARI',
      questions: [
        'TRAFO KALDIRIMDA MI?',
        'TOPRAKLAMA YAPILMIŞ MI?',
        'TOPRAKLAMA BAĞLANTILARI SAĞLAM MI?',
        'GÖRÜNTÜ KİRLİLİĞİNE NEDEN OLUYOR MU?',
        'REKLAM ALANI OLARAK KULLANILIYOR MU?',
        'YOLA TAŞMA DURUMU VAR MI?',
        'ÖZEL MÜLKİYET ALANINA TAŞMA VAR MI?',
        'TRAFO KAİDESİ SAĞLAM MI?',
        'TRAFO DEVRİLME RİSKİ VAR MI?',
        'KAPAKLARI YETKİSİZ ERİŞİME ENGEL OLACAK ŞEKİLDE KİLİTLİ Mİ?',
        'ÜZERİNDE YETKİSİZ ERİŞİME ENGEL OLACAK UYARI LEVHALARI MEVCUT MU?',
        'TRAFO, KALDIRIM DIŞINDA ; YOL , REFÜJ , PARK BAHÇE GİBİ BELEDİYE SORUMLULUĞUNDAKİ ALANLARDA MI?',
        'YAYA GEÇİŞİNİ ENGELLEYECEK ŞEKİLDE Mİ KONUMLANDIRILMIŞ?',
        'TAŞIT TRAFİĞİNİ ENGELLİYOR MU?',
        'GÖRME ENGELLİ YAYALARIN GEÇİŞİNİ ENGELLİYOR, TEHLİKE TEŞKİL EDİYOR MU?',
        'GÖRME ENGELLİLER İÇİN TAHSİS EDİLEN YÜRÜYÜŞ ALANINI KISITLIYOR MU?',
        'TEKERLEKLİ SANDALYE , BİSİKLET ,ÇOCUK ARABASI , PAZAR ARABASI VS. GİBİ ARAÇLARIN GEÇİŞİNE ENGEL OLUYOR MU?',
        'TİCARETHANE YADA BİNA GİRİŞLERİNİ KISITLIYOR MU?',
        'TİCARETHANE YADA VAKIF DERNEK GİBİ SOSYAL AMAÇLI KURULUŞLARIN YAYA GİRİŞ – ÇIKIŞLARINI VE OTOPAR / PARK GİRİŞ ÇIKIŞLARINI ENGELLİYOR MU ?',
        'BİNALARIN OTO PARK, DEPO VS. ARAÇ VE YAYA GİRİŞİNE ENGEL OLUYOR MU?',
        'STATİK PROJE MÜELLEFİNNCE HAZIRLANMIŞ RAPOR VAR MI',
        'FENNİ MESUL ve MÜELLİF TAAHHÜDÜ VARMI?',
        'EHABS (ELEKTRONİK HABERLEŞME ALTYAPI BİLGİ SİSTEMİ )SİSTEMİNE KAYITLI MI?',
        'BELEDİYEYE PROJESİ VERİLMİŞ Mİ?',
        'BELEDİYEDEN YER TAHSİSİ ONAYI ALINMIŞ MI?'
      ],
      description: '',
      hasDeplase: true,
      footerText: "İşbu tespit tutanağı, tarafımızca mahallinde gerçekleştirilen tetkik, tespit ve kontroller sonucunda düzenlenmiş olup imza altına alınmıştır."
    },
    'Aydınlatma Direği': {
      infoRows: [
        ...baseCommonInfo,
        { fullRowHtml: `<tr><td colspan="2" class="red-text">AYDINLATMA DİREĞİ BULUNDUĞU KONUM</td></tr>` },
        { label: 'ADA', value: '' },
        { label: 'PAFTA', value: '' },
        { label: 'PARSEL', value: '' },
        { label: 'AYDINLATMA DİREĞİ ADRES TARİFİ', value: address || '-' },
      ],
      tableLabel: 'AYDINLATMA DİREĞİ TEKNİK DONANIMLARI',
      questions: [
        'AYDINLATMA DİREĞİ KALDIRIMDA MI?',
        'TOPRAKLAMA YAPILMIŞ MI?',
        'TOPRAKLAMA BAĞLANTILARI SAĞLAM MI?',
        'GÖRÜNTÜ KİRLİLİĞİNE NEDEN OLUYOR MU?',
        'REKLAM ALANI OLARAK KULLANILIYOR MU?',
        'YOLA TAŞMA DURUMU VAR MI?',
        'ÖZEL MÜLKİYET ALANINA TAŞMA VAR MI?',
        'AYDINLATMA DİREĞİ DEVRİLME RİSKİ VAR MI?',
        'AYDINLATMA DİREĞİ , KALDIRIM DIŞINDA ; YOL , REFÜJ , PARK BAHÇE GİBİ BELEDİYE SORUMLULUĞUNDAKİ ALANLARDA MI?',
        'YAYA GEÇİŞİNİ ENGELLEYECEK ŞEKİLDE Mİ KONUMLANDIRILMIŞ?',
        'TAŞIT TRAFİĞİNİ ENGELLİYOR MU?',
        'GÖRME ENGELLİ YAYALARIN GEÇİŞİNİ ENGELLİYOR, TEHLİKE TEŞKİL EDİYOR MU?',
        'TEKERLEKLİ SANDALYE , BİSİKLET ,ÇOCUK ARABASI , PAZAR ARABASI VS. GİBİ ARAÇLARIN GEÇİŞİNE ENGEL OLUYOR MU?',
        'TİCARETHANE YADA BİNA GİRİŞLERİNİ KISITLIYOR MU?',
        'TİCARETHANE YADA VAKIF DERNEK GİBİ SOSYAL AMAÇLI KURULUŞLARIN YAYA GİRİŞ – ÇIKIŞLARINI VE OTOPAR / PARK GİRİŞ ÇIKIŞLARINI ENGELLİYOR MU ?',
        'BİNALARIN OTO PARK, DEPO VS. ARAÇ VE YAYA GİRİŞİNE ENGEL OLUYOR MU?',
        'STATİK PROJE MÜELLEFİNNCE HAZIRLANMIŞ RAPOR VAR MI',
        'FENNİ MESUL ve MÜELLİF TAAHHÜDÜ VARMI?',
        'EHABS (ELEKTRONİK HABERLEŞME ALTYAPI BİLGİ SİSTEMİ )SİSTEMİNE KAYITLI MI?',
        'BELEDİYEYE PROJESİ VERİLMİŞ Mİ?',
        'BELEDİYEDEN YER TAHSİSİ ONAYI ALINMIŞ MI?'
      ],
      description: '<u>AÇIKLAMA :</u> Doğal Afet Bölgelerinde Yapılması zorunlu Zemin etüd raporları Hazırlanmamış ve KurumaTeslim edilmemiştir',
      hasDeplase: true,
      footerText: "İşbu tespit tutanağı, tarafımızca mahallinde gerçekleştirilen tetkik, tespit ve kontroller sonucunda düzenlenmiş olup imza altına alınmıştır."
    },
    'Elektrik Panosu': {
      infoRows: [
        ...baseCommonInfo,
        { fullRowHtml: `<tr><td colspan="2" class="red-text">ELEKTRİK PANOSUNUN BULUNDUĞU KONUM</td></tr>` },
        { label: 'ADA', value: '' },
        { label: 'PAFTA', value: '' },
        { label: 'PARSEL', value: '' },
        { label: 'ELEKTRİK PANOSU ADRES TARİFİ', value: address || '-' },
        { label: 'PANONUN TİPİ', value: '' },
        { label: 'PANONUN ÖLÇÜLERİ (CM) (EN-BOY-DERİNLİK)', value: '' },
      ],
      tableLabel: 'ELEKTRİK PANOSU TEKNİK DONANIMLARI',
      questions: [
        'ELEKTRİK PANOSU KALDIRIMDA MI?',
        'TOPRAKLAMA YAPILMIŞ MI?',
        'TOPRAKLAMA BAĞLANTILARI SAĞLAM MI?',
        'GÖRÜNTÜ KİRLİLİĞİNE NEDEN OLUYOR MU?',
        'REKLAM ALANI OLARAK KULLANILIYOR MU?',
        'YOLA TAŞMA DURUMU VAR MI?',
        'ÖZEL MÜLKİYET ALANINA TAŞMA VAR MI?',
        'ELEKTRİK PANOSU KAİDESİ SAĞLAM MI?',
        'ELEKTRİK PANOSUNUN DEVRİLME RİSKİ VAR MI?',
        'KAPAKLARI YETKİSİZ ERİŞİME ENGEL OLACAK ŞEKİLDE KİLİTLİ Mİ?',
        'ÜZERİNDE YETKİSİZ ERİŞİME ENGEL OLACAK UYARI LEVHALARI MEVCUT MU?',
        'ELEKTRİK PANOSU, KALDIRIM DIŞINDA ; YOL , REFÜJ , PARK BAHÇE GİBİ BELEDİYE SORUMLULUĞUNDAKİ ALANLARDA MI?',
        'YAYA GEÇİŞİNİ ENGELLEYECEK ŞEKİLDE Mİ KONUMLANDIRILMIŞ?',
        'TAŞIT TRAFİĞİNİ ENGELLİYOR MU?',
        'GÖRME ENGELLİ YAYALARIN GEÇİŞİNİ ENGELLİYOR, TEHLİKE TEŞKİL EDİYOR MU?',
        'GÖRME ENGELLİLER İÇİN TAHSİS EDİLEN YÜRÜYÜŞ ALANINI KISITLIYOR MU?',
        'TEKERLEKLİ SANDALYE , BİSİKLET ,ÇOCUK ARABASI , PAZAR ARABASI VS. GİBİ ARAÇLARIN GEÇİŞİNE ENGEL OLUYOR MU?',
        'TİCARETHANE YADA BİNA GİRİŞLERİNİ KISITLIYOR MU?',
        'TİCARETHANE YADA VAKIF DERNEK GİBİ SOSYAL AMAÇLI KURULUŞLARIN YAYA GİRİŞ – ÇIKIŞLARINI VE OTOPAR / PARK GİRİŞ ÇIKIŞLARINI ENGELLİYOR MU ?',
        'BİNALARIN OTO PARK, DEPO VS. ARAÇ ve YAYA GİRİŞİNE ENGEL OLUYOR MU?',
        'STATİK PROJE MÜELLEFİNNCE HAZIRLANMIŞ RAPOR VAR MI',
        'FENNİ MESUL ve MÜELLİF TAAHHÜDÜ VARMI?',
        'EHABS (ELEKTRONİK HABERLEŞME ALTYAPI BİLGİ SİSTEMİ )SİSTEMİNE KAYITLI MI?',
        'BELEDİYEYE PROJESİ VERİLMİŞ Mİ?',
        'BELEDİYEDEN YER TAHSİSİ ONAYI ALINMIŞ MI?'
      ],
      description: '',
      hasDeplase: true,
      footerText: "İşbu tespit tutanağı, tarafımızca mahallinde gerçekleştirilen tetkik, tespit ve kontroller sonucunda düzenlenmiş olup imza altına alınmıştır."
    },
    'Baz İstasyonu': {
      infoRows: [
        { label: 'OPERATÖR FİRMA', value: operator || '-' },
        { label: 'İL', value: il || '-' },
        { label: 'İLÇE', value: ilce },
        { label: 'MAHALLE', value: mahalle || '-' },
        { label: (sokakTuru || 'SOKAK').toUpperCase(), value: displayAddressValue },
        { label: 'ENLEM', value: locationData?.latitude?.toFixed(6) || '-' },
        { label: 'BOYLAM', value: locationData?.longitude?.toFixed(6) || '-' },
        { label: 'YAPI TATİL NO', value: '' },
        { label: 'ADA', value: '' },
        { label: 'PAFTA', value: '' },
        { label: 'PARSEL', value: '' },
        { label: 'BAZ İSTASYONUNUN ADRESİ', value: address || '-' },
        { label: 'BAZ İSTASYONU ÖLÇÜLERİ (CM)', value: bazOlcu },
      ],
      tableLabel: 'GSM BAZ İSTASYONU TEKNİK DONANIMLARI',
      questions: [
        'BİLGİ TEKNOLOJİLERİ SERTİFİKASI VARMI',
        'ENH PROJESİ VAR MI (BEDAŞ ONAYLI SAYAÇ)',
        'PAROTONER VAR MI',
        'PARATONER RADYOAKTİF Mİ/TOPRAKLAMA YAPILMIŞMI',
        'HAVA TRAFİK İKAZ SİSTEMİ',
        'YANGIN SÖNDÜRME SİSTEMİ',
        'KLİMA ÜNİTESİ AÇIK ALANDAMI/YÖNETMELİĞE UYGUNMU',
        'GÖRÜNTÜ KİRLİLİĞİ (Gsm Baz istasyonu tasarımları kent ve yapı estetiğine uygun mu )',
        'İŞ GÜVENLİĞİ',
        '1) SİSTEME YETKİSİZ ERİŞİME ENGEL TEL ÇİT VB. VARMI)',
        '2) YÜKSEKTE ÇALIŞMA GÜVENLİK ÖNLEMLERİ ALINDIMI (YÜRÜME YOLU ÇELİK HALAT VB.GİBİ)',
        'ELEKTİRİK TESİSATI YANGIN YÖNETMELİĞİNE UYGUN OLARAK ÇEKİLMİŞ Mİ',
        'OPERATÖR YAPI RUHSATI VARMI',
        '1) MİMARİ PROJESİ',
        '2) STATİK PROJESİ',
        '3) ELEKTİRİK PROJESİ',
        '4) İTFAİYE RAPORU',
        '5) MEKANİK TESİSAT PROJESİ',
        'BİNA CEPHELERİNE 3,00 MT DEN FAZLA YAKLAŞILIYORMU (Kreş, Okul, Hastane vb.) uzaklıkları yasal sınırlar içerisinde mi ?',
        'YER SEÇİM BELGESİ VARMI / BAŞVURU YAPILMIŞ MI',
        'STATİK PROJE MÜELLEFİNNCE HAZIRLANMIŞ RAPOR VAR MI',
        'FENNİ MESUL ve MÜELLİF TAAHHÜDÜ VARMI'
      ],
      description: '<u>AÇIKLAMA :</u> Doğal Afet Bölgelerinde Yapılması zorunlu Zemin etüd raporları Hazırlanmamış ve Kuruma Teslim edilmemiştir .',
      hasDeplase: true,
      footerText: "İşbu tespit tutanağı, tarafımızca mahallinde gerçekleştirilen tetkik, tespit ve kontroller sonucunda düzenlenmiş olup imza altına alınmıştır."
    },
    'Doğalgaz': {
      infoRows: [
        { label: 'OPERATÖR FİRMA', value: operator || '-' },
        { label: 'İL', value: il || '-' },
        { label: 'İLÇE', value: ilce },
        { label: 'MAHALLE', value: mahalle || '-' },
        { label: (sokakTuru || 'SOKAK').toUpperCase(), value: displayAddressValue },
        { label: 'ENLEM', value: locationData?.latitude?.toFixed(6) || '-' },
        { label: 'BOYLAM', value: locationData?.longitude?.toFixed(6) || '-' },
        { label: 'YAPI TATİL NO', value: '' },
        { label: 'ADA', value: '' },
        { label: 'PAFTA', value: '' },
        { label: 'PARSEL', value: '' },
        { label: 'DOĞALGAZ TENSİSİNİN/İSTASYONUNUN ADRESİ', value: address || '-' },
      ],
      tableLabel: 'DOĞALGAZ TEKNİK DONANIMLARI',
      questions: [
        'BİLGİ TEKNOLOJİLERİ SERTİFİKASI VARMI',
        'ENH PROJESİ VAR MI (BEDAŞ ONAYLI SAYAÇ)',
        'PAROTONER VAR MI',
        'PARATONER RADYOAKTİF Mİ/TOPRAKLAMA YAPILMIŞMI',
        'HAVA TRAFİK İKAZ SİSTEMİ',
        'YANGIN SÖNDÜRME SİSTEMİ',
        'KLİMA ÜNİTESİ AÇIK ALANDAMI/YÖNETMELİĞE UYGUNMU',
        'GÖRÜNTÜ KİRLİLİĞİ',
        'İŞ GÜVENLİĞİ',
        '1) SİSTEME YETKİSİZ ERİŞİME ENGEL TEL ÇİT VB. VARMI)',
        '2) YÜKSEKTE ÇALIŞMA GÜVENLİK ÖNLEMLERİ ALINDIMI (YÜRÜME YOLU ÇELİK HALAT VB.GİBİ)',
        'ELEKTİRİK TESİSATI YANGIN YÖNETMELİĞİNE UYGUN OLARAK ÇEKİLMİŞ Mİ',
        'OPERATÖR YAPI RUHSATI VARMI',
        '1) MİMARİ PROJESİ',
        '2) STATİK PROJESİ',
        '3) ELEKTİRİK PROJESİ',
        '4) İTFAİYE RAPORU',
        '5) MEKANİK TESİSAT PROJESİ',
        'BİNA CEPHELERİNE 3,00 MT DEN FAZLA YAKLAŞILIYORMU (Kreş, Okul, Hastane vb.) uzaklıkları yasal sınırlar içerisinde mi ?',
        'YER SEÇİM BELGESİ VARMI / BAŞVURU YAPILMIŞ MI',
        'STATİK PROJE MÜELLEFİNNCE HAZIRLANMIŞ RAPOR VAR MI',
        'FENNİ MESUL ve MÜELLİF TAAHHÜDÜ VARMI'
      ],
      description: '<u>AÇIKLAMA :</u> Doğal Afet Bölgelerinde Yapılması zorunlu Zemin etüd raporları Hazırlanmamış ve Kuruma Teslim edilmemiştir .',
      hasDeplase: true,
      footerText: "İşbu tespit tutanağı, tarafımızca mahallinde gerçekleştirilen tetkik, tespit ve kontroller sonucunda düzenlenmiş olup imza altına alınmıştır."
    }
  };

  const fallbackType = type || 'MENHOL';
  const currentTypeConfig = type && pdfTemplateConfigs[type] ? pdfTemplateConfigs[type] : {
    infoRows: [
      ...baseCommonInfo,
      { fullRowHtml: `<tr><td colspan="2" class="red-text">${fallbackType.toUpperCase()} BULUNDUĞU KONUM</td></tr>` },
      { label: 'ADA', value: '' },
      { label: 'PAFTA', value: '' },
      { label: 'PARSEL', value: '' },
      { label: `${fallbackType.toUpperCase()} ADRES TARİFİ`, value: address || '-' },
    ],
    tableLabel: `${fallbackType.toUpperCase()} TEKNİK DONANIMLARI`,
    questions: [],
    description: '',
    hasDeplase: true,
    footerText: "İşbu tespit tutanağı, tarafımızca mahallinde gerçekleştirilen tetkik, tespit ve kontroller sonucunda düzenlenmiş olup imza altına alınmıştır."
  };

  const dynamicInfoRows = currentTypeConfig.infoRows.map((row: any) => {
    if (row.fullRowHtml) return row.fullRowHtml;
    return `<tr><td><div style="display: flex; justify-content: space-between;"><span>${row.label}</span><span>:</span></div></td><td>${row.value}</td></tr>`;
  }).join('');

  let dynamicTables = "";

  if (currentTypeConfig.questions && currentTypeConfig.questions.length > 0) {
    dynamicTables += `
        <table>
          <tr>
            <td style="color: red; font-weight: bold;">${currentTypeConfig.tableLabel}</td>
            <td>EVET</td>
            <td>HAYIR</td>
          </tr>
          ${currentTypeConfig.questions.map((q: string) => `<tr><td>${q}</td><td></td><td>X</td></tr>`).join('')}
        </table>
    `;
  }

  if (currentTypeConfig.description) {
    dynamicTables += `
        <div style="font-weight: bold; margin-bottom: 20px; text-align: center; font-size: 11px;">
          ${currentTypeConfig.description}
        </div>
    `;
  }

  if (currentTypeConfig.hasDeplase) {
    dynamicTables += `
        <div style="color: red; font-weight: bold; text-align: center; margin-bottom: 5px;">KEŞİF DEĞERLENDİRME SONUCU:</div>
        <table style="width: 80%; margin: 0 auto 30px auto;">
          <tr>
              <td style="border: none; width: 60%;"></td>
              <td style="text-align: center; font-weight: bold; width: 20%;">EVET</td>
              <td style="text-align: center; font-weight: bold; width: 20%;">HAYIR</td>
          </tr>
          <tr>
            <td style="font-weight: bold;">DEPLASE EDİLMELİ Mİ?</td>
            <td style="text-align: center; font-weight: bold; border: 1px solid #000;"></td>
            <td style="text-align: center; font-weight: bold; border: 1px solid #000;">X</td>
          </tr>
        </table>
    `;
  }

  if (currentTypeConfig.footerText) {
    if (currentTypeConfig.footerText.includes('.......')) {
      dynamicTables += `
        <div style="font-weight: bold; font-size: 11px; margin-bottom: 40px; text-align: justify; line-height: 1.5;">
          ${currentTypeConfig.footerText}
        </div>
      `;
    } else {
      dynamicTables += `
        <div class="footer-text">
          ${currentTypeConfig.footerText}
        </div>
      `;
    }
  }

  dynamicTables += `
        <div class="signatures">
          <div>Teknik Eleman</div>
          <div>Teknik Eleman</div>
          <div>Teknik Eleman</div>
        </div>
        
  `;

  return `
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
        <style>
          @page { margin: 20mm; }
          body { font-family: Arial, Helvetica, sans-serif; padding: 10px; color: #000; background-color: #fff; font-size: 11px; }
          .header { text-align: center; margin-bottom: 20px; line-height: 1.5; font-size: 14px; }
          .header-title { font-size: 20px; font-weight: bold; margin-bottom: 5px; }
          .date-right { text-align: right; font-weight: normal; margin-bottom: 10px; font-size: 12px; }
          table { border-collapse: collapse; margin-bottom: 20px; table-layout: fixed; width: 100%; }
          table td, table th { border: 1px solid #000; padding: 4px; text-align: left; word-wrap: break-word; font-size: 12px; }
          table:first-of-type td:first-child { width: 35%; }
          table:first-of-type td:last-child { width: 65%; }
          table:nth-of-type(2) td:first-child { width: 80%; font-weight: bold; }
          table:nth-of-type(2) td:not(:first-child) { width: 10%; text-align: center; font-weight: bold; }
          tr { page-break-inside: avoid; break-inside: avoid; }
          
          .red-text { color: red; font-weight: bold; text-align: center; }
          .footer-text { margin-top: 10px; margin-bottom: 50px; font-weight: bold; text-align: center; font-size: 11px; page-break-inside: avoid; break-inside: avoid; }
          .signatures { display: flex; justify-content: space-between; font-weight: bold; margin-bottom: 20px; page-break-inside: avoid; break-inside: avoid; }
          .photo-section { text-align: center; page-break-before: always; }
          .photo-section img { max-width: 90%; max-height: 90vh; margin-top: 20px; border: 1px solid #000; object-fit: contain; }
        </style>
      </head>
      <body>
        <div class="header" style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
          <div style="display: flex; align-items: center; justify-content: center; margin-bottom: 5px;">
            ${municipalityLogo ? `<img src="${municipalityLogo}" style="height: 100px; margin-right: 20px;" />` : ''}
            <div style="text-align: center;">
              <div class="header-title">${municipalityName || 'SAMSUN BÜYÜKŞEHİR BELEDİYESİ'}</div>
              <div style="font-weight: normal; font-size: 14px; max-width: 500px; margin: 0 auto;">${headerSubtitle}</div>
            </div>
          </div>
        </div>

        <div class="date-right">Tarih : ${timestamp?.split(' - ')[0] || '..../..../2020'}</div>

        <table>
${dynamicInfoRows}
        </table>

${dynamicTables}

        <div class="photo-section" style="position: relative; display: inline-block; width: 100%;">
          <h3>SAHA FOTOĞRAFI</h3>
          ${
            base64Image?.trim()
              ? `<img src="${base64Image}" style="max-width: 100%; height: auto; display: block; margin: 0 auto; object-fit: contain; max-height: 80vh;" />`
              : `<p style="padding:14px;border:1px dashed #666;border-radius:8px;color:#333;font-size:12px;text-align:center;line-height:1.5;">Bu PDF’te saha fotoğrafı yer almıyor (ör. yönetim panelinden düzenleme). Orijinal fotoğraf için sahada oluşturulan ilk rapor sürümüne bakınız.</p>`
          }
        </div>
      </body>
    </html>
  `;
};
