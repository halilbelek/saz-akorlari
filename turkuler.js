// Hazır türküler – sadece akorlar (sözler yok). Hepsi La karara (bağlama düzeni) çevrildi.
// Her satır bir dize; akorlar dize boyunca sırayla çalınır.
window.HAZIR_TURKULER = [
  {
    id: 'h-canakkale', ad: 'Çanakkale Türküsü', yore: 'Anonim · Kastamonu', seviye: 'Kolay',
    usul: '4/4', tempo: 66,
    bolumler: [
      { ad: 'Kıta', satirlar: ['Lam Do Lam Rem', 'Lam Do Lam Rem'] },
      { ad: 'Nakarat', satirlar: ['Lam Rem Sol Lam', 'Do Sol Lam'] }
    ],
    not: 'Ağır, ağıt havasında çal.'
  },
  {
    id: 'h-sarigelin', ad: 'Sarı Gelin', yore: 'Anonim · Erzurum', seviye: 'Kolay',
    usul: '4/4', tempo: 72,
    bolumler: [
      { ad: 'Kıta', satirlar: ['Lam', 'Rem Fa Mi Lam'] },
      { ad: 'Nakarat', satirlar: ['Rem Lam', 'Rem Fa Mi Lam'] }
    ],
    not: 'Her kıtada aynı akorlar tekrar eder.'
  },
  {
    id: 'h-uzunince', ad: 'Uzun İnce Bir Yoldayım', yore: 'Âşık Veysel', seviye: 'Kolay',
    usul: '4/4', tempo: 76,
    bolumler: [
      { ad: 'Kıta', satirlar: ['Lam Sol Lam Sol Lam', 'Lam Sol Lam Sol Lam', 'Sol', 'Lam Rem Lam Sol Lam'] }
    ],
    not: 'Sadece iki-üç akor: Lam ve Sol çok iyi oturunca başla.'
  },
  {
    id: 'h-yemen', ad: 'Yemen Türküsü', yore: 'Anonim', seviye: 'Orta',
    usul: '4/4', tempo: 70,
    bolumler: [
      { ad: 'Kıta', satirlar: ['Rem Sol Mi Lam', 'Lam Rem Sol Do Fa', 'Rem Sol Mi Lam'] }
    ],
    not: 'Basitleştirilmiş akorlar: kaynaktaki eksik (°) ve artık akorlar çıkarıldı.'
  }
];
