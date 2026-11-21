// Saz Akorları – müzik kuramı: perdeler, akorlar, basılış arama
// Tüm notalar bağlama notasyonuna göre (La karar). Gerçek ses "ahenk" ile kaydırılır.
(function (root) {
  'use strict';

  // Nota adları (perde sınıfı 0 = Do)
  const NOTA = ['Do', 'Do#', 'Re', 'Mi♭', 'Mi', 'Fa', 'Fa#', 'Sol', 'Sol#', 'La', 'Si♭', 'Si'];

  // Kısa sap bağlama, 17 aralıklı perde sistemi (bir sekizli, sent)
  // Koma perdeler: 180, 384, 678, 882, 1086
  const OKTAV = [90, 180, 204, 294, 384, 408, 498, 588, 678, 702, 792, 882, 906, 996, 1086, 1110, 1200];
  const KOMA = new Set([180, 384, 678, 882, 1086]);

  // Sap: açık tel (0) + perdeler. Varsayılan 17 aralıklı düzen; "Sazımı tanıt" ile kullanıcının
  // kendi sazından ölçülen değerlerle değiştirilebilir (ayarla()).
  const PERDELER = [0];
  let BILGI = [];
  function varsayilanPerdeler() {
    const l = [];
    for (let o = 0; o < 2; o++) for (const c of OKTAV) { const v = c + o * 1200; if (v <= 1698) l.push(v); }
    return l;
  }
  // Her perdeyi en yakın yarım sese ata; aynı yarım sese düşenlerden en yakını "asıl", diğerleri koma.
  function siniflandir(liste) {
    const b = [{ no: 0, sent: 0, koma: false, yarim: 0 }];
    const enIyi = {};
    liste.forEach((c, i) => {
      const y = Math.round(c / 100), sap = Math.abs(c - y * 100);
      if (sap <= 30 && (!(y in enIyi) || sap < enIyi[y].sap)) enIyi[y] = { i, sap };
    });
    liste.forEach((c, i) => {
      const y = Math.round(c / 100);
      const asil = enIyi[y] && enIyi[y].i === i && y > 0;
      b.push({ no: i + 1, sent: c, koma: !asil, yarim: asil ? y : null });
    });
    return b;
  }
  function ayarla(liste) {
    liste = (liste && liste.length >= 5) ? liste.slice().sort((a, b) => a - b) : varsayilanPerdeler();
    PERDELER.length = 0; PERDELER.push(0, ...liste);
    BILGI = siniflandir(liste);
    return PERDELER.length - 1;
  }
  ayarla(null);

  function perdeBilgi(i) { return BILGI[i]; }

  // Bağlama düzeni: üst tel Re, orta tel Sol, alt tel La (notada)
  // Soldan sağa çizim sırası: üst, orta, alt
  const DUZEN = {
    id: 'baglama',
    ad: 'Bağlama düzeni',
    teller: [
      { id: 'ust', ad: 'Üst', nota: 2, oktav: 4 },   // Re4
      { id: 'orta', ad: 'Orta', nota: 7, oktav: 4 }, // Sol4
      { id: 'alt', ad: 'Alt', nota: 9, oktav: 4 }    // La4
    ]
  };

  // Akor türleri: aralıklar ve zorunlu tonlar (3 tel olduğu için)
  const TUR = {
    '':   { ad: 'majör',        ara: [0, 4, 7],     zorunlu: [0, 4] },
    'm':  { ad: 'minör',        ara: [0, 3, 7],     zorunlu: [0, 3] },
    '7':  { ad: 'dominant 7',   ara: [0, 4, 7, 10], zorunlu: [0, 4, 10] },
    'm7': { ad: 'minör 7',      ara: [0, 3, 7, 10], zorunlu: [0, 3, 10] },
    'sus2': { ad: 'sus2',       ara: [0, 2, 7],     zorunlu: [0, 2] },
    'sus4': { ad: 'sus4',       ara: [0, 5, 7],     zorunlu: [0, 5] },
    '5':  { ad: 'beşli (güç akoru)', ara: [0, 7],   zorunlu: [0, 7] }
  };

  function akor(kok, tur) {
    const t = TUR[tur];
    return {
      id: NOTA[kok] + tur, ad: NOTA[kok] + tur, kok, tur,
      uzun: NOTA[kok] + ' ' + t.ad,
      tonlar: t.ara.map(a => (kok + a) % 12),
      zorunlu: t.zorunlu.map(a => (kok + a) % 12)
    };
  }

  // Seviyeli öğrenme yolu
  const SEVIYELER = [
    { ad: 'Seviye 1 – İlk adım', akorlar: [akor(9, 'm'), akor(7, ''), akor(2, '')] },        // Lam, Sol, Re
    { ad: 'Seviye 2 – Türkü temeli', akorlar: [akor(0, ''), akor(4, 'm'), akor(2, 'm')] },  // Do, Mim, Rem
    { ad: 'Seviye 3 – Renk', akorlar: [akor(5, ''), akor(4, ''), akor(9, '')] },            // Fa, Mi, La
    { ad: 'Seviye 4 – Yedililer', akorlar: [akor(4, '7'), akor(9, '7'), akor(2, '7')] },   // Mi7, La7, Re7
    { ad: 'Seviye 5 – Yeni tonlar', akorlar: [akor(11, 'm'), akor(10, ''), akor(7, '7')] },// Sim, Si♭, Sol7
    { ad: 'Seviye 6 – İleri', akorlar: [akor(9, 'm7'), akor(2, 'm7'), akor(6, 'm'), akor(0, '7')] },
    { ad: 'Seviye 7 – Boşluklu akorlar', akorlar: [akor(9, 'sus4'), akor(2, 'sus2'), akor(4, '5'), akor(9, '5')] }
  ];
  const TUM_AKORLAR = SEVIYELER.flatMap((s, i) => s.akorlar.map(a => Object.assign(a, { seviye: i })));

  function akorBul(ad) {
    ad = String(ad).trim().replace(/b(?=m|7|$|s|5)/, '♭');
    const hazir = TUM_AKORLAR.find(a => a.ad.toLowerCase() === ad.toLowerCase());
    if (hazir) return hazir;
    // Serbest yazım: Do, Do#, Re, Mib, Mi, Fa, Fa#, Sol, Sol#, La, Sib, Si + tür
    const m = ad.match(/^(do#|do|re|mi♭|mi|fa#|fa|sol#|sol|la|si♭|si)(m7|m|7|sus2|sus4|5)?$/i);
    if (!m) return null;
    const kok = NOTA.findIndex(n => n.toLowerCase() === m[1].toLowerCase());
    const tur = (m[2] || '').toLowerCase();
    const a = akor(kok, tur);
    a.seviye = null;
    return a;
  }

  // Bir telde bir perdenin notası (perde sınıfı) – koma perdede null
  function perdeNota(telNota, perdeNo) {
    const p = perdeBilgi(perdeNo);
    return p.koma ? null : (telNota + p.yarim) % 12;
  }

  // Bir basılışı değerlendir: [üst, orta, alt] perde numaraları
  function basilisKontrol(ak, basilis, duzen = DUZEN) {
    const sesler = basilis.map((p, i) => perdeNota(duzen.teller[i].nota, p));
    const yanlisTel = [];
    sesler.forEach((s, i) => { if (s === null || !ak.tonlar.includes(s)) yanlisTel.push(i); });
    const eksik = ak.zorunlu.filter(t => !sesler.includes(t));
    return { dogru: yanlisTel.length === 0 && eksik.length === 0, sesler, yanlisTel, eksik };
  }

  // Tüm makul basılışları bul ve sırala
  function basilislar(ak, duzen = DUZEN, enFazla = 8, ustPerde = 20) {
    ustPerde = Math.min(ustPerde, PERDELER.length - 1);
    const secenek = duzen.teller.map(t => {
      const s = [];
      for (let p = 0; p <= ustPerde; p++) {
        const n = perdeNota(t.nota, p);
        if (n !== null && ak.tonlar.includes(n)) s.push(p);
      }
      return s;
    });
    const sonuc = [];
    for (const a of secenek[0]) for (const b of secenek[1]) for (const c of secenek[2]) {
      const bs = [a, b, c];
      const k = basilisKontrol(ak, bs, duzen);
      if (!k.dogru) continue;
      const basili = bs.filter(p => p > 0);
      const yarimlar = basili.map(p => perdeBilgi(p).yarim);
      const aralik = basili.length ? Math.max(...yarimlar) - Math.min(...yarimlar) : 0;
      if (aralik > 4) continue;
      const enAlt = basili.length ? Math.min(...yarimlar) : 0;
      const tamTon = new Set(k.sesler).size === ak.tonlar.length;
      // Puan: düşük konum, az aralık, boş tel, tüm tonlar, kök üst telde
      let puan = enAlt * 2 + aralik * 1.5 - (3 - basili.length) * 1.2;
      if (tamTon) puan -= 2;
      if (k.sesler[0] === ak.kok) puan -= 1.5;
      if (enAlt > 0 && basili.length < 3 && bs.some(p => p === 0)) puan += enAlt * 0.6; // yüksekte boş tel zor
      sonuc.push({ perdeler: bs, sesler: k.sesler, puan, konum: enAlt, tamTon });
    }
    sonuc.sort((x, y) => x.puan - y.puan);
    // Konuma göre çeşitlendir: aynı konumdan en fazla 2
    const sayac = {}, secilen = [];
    for (const s of sonuc) {
      const kb = Math.floor(s.konum / 3);
      sayac[kb] = (sayac[kb] || 0) + 1;
      if (sayac[kb] <= 2) secilen.push(s);
      if (secilen.length >= enFazla) break;
    }
    return secilen;
  }

  // Ahenk: notadaki La'nın gerçekte hangi ses olarak çıktığı (yarım ses kaydırma, La=0)
  const AHENKLER = [
    { id: 2, ad: 'Si (B)' }, { id: 1, ad: 'La# / Si♭ (A#)' }, { id: 0, ad: 'La (A)' },
    { id: -1, ad: 'Sol# (G#)' }, { id: -2, ad: 'Sol (G)' }, { id: -3, ad: 'Fa# (F#)' },
    { id: -4, ad: 'Fa (F)' }, { id: -5, ad: 'Mi (E)' }, { id: -7, ad: 'Re (D)' }, { id: -9, ad: 'Do (C)' }
  ];

  // Notadaki sesin gerçek frekansı (sent hassasiyetinde)
  function frekans(telIndex, perdeNo, ahenk = 0, duzen = DUZEN) {
    const t = duzen.teller[telIndex];
    const midi = 12 * (t.oktav + 1) + t.nota + ahenk; // La4 = 69
    const sent = (midi - 69) * 100 + PERDELER[perdeNo];
    return 440 * Math.pow(2, sent / 1200);
  }

  // Gerçek frekans -> nota (notasyonda) ve sent sapması
  function frekanstanNota(f, ahenk = 0) {
    const midiF = 69 + 12 * Math.log2(f / 440) - ahenk;
    const yuvarlak = Math.round(midiF);
    return { nota: ((yuvarlak % 12) + 12) % 12, sent: Math.round((midiF - yuvarlak) * 100), midi: midiF };
  }

  const api = { NOTA, OKTAV, KOMA, PERDELER, perdeBilgi, ayarla, varsayilanPerdeler, DUZEN, TUR, akor, SEVIYELER, TUM_AKORLAR, akorBul,
    perdeNota, basilisKontrol, basilislar, AHENKLER, frekans, frekanstanNota };
  if (typeof module !== 'undefined') module.exports = api; else root.Kuram = api;
})(this);
