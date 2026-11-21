// Saz Akorları – arayüz
(function () {
  'use strict';
  const K = window.Kuram, S = window.Ses;
  const $ = id => document.getElementById(id);
  const NS = 'http://www.w3.org/2000/svg';

  // ---------- Kayıt ----------
  const ANAHTAR = 'saz-akorlari-v1';
  const varsayilan = { ahenk: 0, denemeler: {}, seri: 0, sonGun: null, turkuler: null, sonAkor: 'Lam' };
  let D;
  try { D = Object.assign({}, varsayilan, JSON.parse(localStorage.getItem(ANAHTAR) || '{}')); } catch (e) { D = Object.assign({}, varsayilan); }
  if (!D.turkuler) D.turkuler = [
    { id: 1, ad: 'Örnek alıştırma – La karar', akorlar: 'Lam Sol Fa Mi', usul: '4/4', tempo: 70, not: 'Kendi türkülerini "Yeni türkü ekle" ile kaydet.' },
    { id: 2, ad: 'Örnek alıştırma – 9/8 oyun havası', akorlar: 'Lam Rem Mi Lam', usul: '9/8', tempo: 90, not: '' }
  ];
  function kaydet() { try { localStorage.setItem(ANAHTAR, JSON.stringify(D)); } catch (e) {} }

  function bildir(m) {
    const b = $('bildirim'); b.textContent = m; b.hidden = false;
    clearTimeout(bildir.t); bildir.t = setTimeout(() => (b.hidden = true), 2600);
  }

  // ---------- Seviyeler ----------
  function seviyeDurum(i) {
    const d = D.denemeler[i] || [];
    const son = d.slice(-10), dogru = son.filter(Boolean).length;
    return { deneme: d.length, son: son.length, dogru, gecti: son.length >= 10 && dogru >= 8 };
  }
  function seviyeAcik(i) { return i === 0 || seviyeDurum(i - 1).gecti; }
  function simdikiSeviye() {
    for (let i = 0; i < K.SEVIYELER.length; i++) if (!seviyeDurum(i).gecti) return i;
    return K.SEVIYELER.length - 1;
  }
  function akorAcik(a) { return a.seviye == null || seviyeAcik(a.seviye); }

  // ---------- Sap çizimi ----------
  const poz = c => 1 - Math.pow(2, -c / 1200);
  function el(ad, ozellik, ebeveyn) {
    const e = document.createElementNS(NS, ad);
    for (const k in ozellik) e.setAttribute(k, ozellik[k]);
    if (ebeveyn) ebeveyn.appendChild(e);
    return e;
  }
  // secenek: { basilis:[3], ilk, son, isaret:{yanlis:[telIdx]}, sinif, etiket:true, tikla(tel, perde) }
  function sapCiz(svg, s) {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    const ilk = s.ilk || 0, son = s.son;
    const W = 200, ustBos = 34, H = s.yukseklik || 380, alt = 22;
    svg.setAttribute('viewBox', `0 0 ${W} ${ustBos + H + alt}`);
    const x = [62, 110, 158];
    const y = c => ustBos + (poz(c) - poz(K.PERDELER[ilk])) / (poz(K.PERDELER[son]) - poz(K.PERDELER[ilk])) * H;
    el('rect', { x: 40, y: ustBos, width: 140, height: H, rx: 3, class: 'zemin' }, svg);
    if (ilk === 0) el('rect', { x: 38, y: ustBos - 5, width: 144, height: 6, rx: 1, class: 'esik' }, svg);
    for (let p = ilk + 1; p <= son; p++) {
      const b = K.perdeBilgi(p), yy = y(b.sent);
      el('line', { x1: 40, x2: 180, y1: yy, y2: yy, class: 'perde' + (b.koma ? ' koma' : '') }, svg);
      const t = el('text', { x: 32, y: yy + 4, 'text-anchor': 'end', class: 'pno' }, svg);
      t.textContent = p;
    }
    // sapta süs noktaları (bağlamada yaygın değil ama yön bulmayı kolaylaştırır): yok
    x.forEach((xx, i) => el('line', { x1: xx, x2: xx, y1: ustBos - 4, y2: ustBos + H, class: 'tel', 'stroke-width': i === 1 ? 1.4 : 1.8 }, svg));
    K.DUZEN.teller.forEach((t, i) => {
      const e = el('text', { x: x[i], y: ustBos + H + 16, 'text-anchor': 'middle', class: 'tad' }, svg);
      e.textContent = t.ad + ' ' + K.NOTA[t.nota];
    });
    // basılı noktalar
    const nokY = p => {
      const y1 = y(K.PERDELER[p - 1]), y2 = y(K.PERDELER[p]);
      return y2 - y1 < 26 ? y2 - Math.min(11, (y2 - y1) / 2 + 4) : (y1 + y2) / 2;
    };
    if (s.basilis) s.basilis.forEach((p, i) => {
      if (p == null) return;
      const yanlis = s.isaret && s.isaret.yanlis && s.isaret.yanlis.includes(i);
      const sinif = (yanlis ? ' yanlis' : '') + (s.secim ? ' secim' : '');
      const nota = K.perdeNota(K.DUZEN.teller[i].nota, p);
      const ad = nota == null ? 'k' : K.NOTA[nota];
      if (p === 0) {
        el('circle', { cx: x[i], cy: 13, r: 10, class: 'bos' + sinif }, svg);
        if (s.etiket !== false) { const t = el('text', { x: x[i], y: 17, 'text-anchor': 'middle', class: 'bosyazi' }, svg); t.textContent = ad; }
      } else if (p > ilk && p <= son) {
        const cy = nokY(p);
        el('circle', { cx: x[i], cy, r: 12, class: 'nokta' + sinif }, svg);
        if (s.etiket !== false) { const t = el('text', { x: x[i], y: cy + 4, 'text-anchor': 'middle', class: 'nyazi' }, svg); t.textContent = ad; }
      } else if (p > son || p <= ilk) {
        const t = el('text', { x: x[i], y: p > son ? ustBos + H - 4 : ustBos + 14, 'text-anchor': 'middle', class: 'pno' }, svg);
        t.textContent = (p > son ? '▼ ' : '▲ ') + p;
      }
    });
    if (s.tikla) {
      const r = el('rect', { x: 0, y: 0, width: W, height: ustBos + H, class: 'dokun' }, svg);
      r.addEventListener('pointerdown', ev => {
        const k = svg.getScreenCTM().inverse();
        const pt = svg.createSVGPoint(); pt.x = ev.clientX; pt.y = ev.clientY;
        const q = pt.matrixTransform(k);
        let tel = 0, mesafe = 1e9;
        x.forEach((xx, i) => { const m = Math.abs(q.x - xx); if (m < mesafe) { mesafe = m; tel = i; } });
        let perde;
        if (q.y < ustBos) perde = ilk === 0 ? 0 : null;
        if (perde === undefined) {
          let en = 1e9;
          for (let p = ilk + 1; p <= son; p++) { const m = Math.abs(q.y - nokY(p)); if (m < en) { en = m; perde = p; } }
        }
        if (perde != null) s.tikla(tel, perde);
      });
    }
  }
  // Bir basılış için uygun pencere
  function pencere(perdeler, uzunluk = 9) {
    const basili = perdeler.filter(p => p > 0);
    if (!basili.length) return { ilk: 0, son: uzunluk };
    const mn = Math.min(...basili), mx = Math.max(...basili);
    let ilk = mx <= uzunluk ? 0 : Math.max(0, mn - 2);
    let son = Math.max(ilk + uzunluk, mx + 1);
    son = Math.min(son, K.PERDELER.length - 1);
    return { ilk, son };
  }

  // ---------- Çalma ----------
  function basilisCal(perdeler, tezene = true, gecikme = 0) {
    S.baglam();
    perdeler.forEach((p, i) => {
      if (p == null) return;
      const f = K.frekans(i, p, D.ahenk);
      const bam = i !== 1; // üst ve alt telde bam var
      S.sazTeli(f, bam, gecikme + (tezene ? i * 0.028 : i * 0.45), 0.28);
    });
  }

  // ---------- Sekmeler ----------
  const BASLIK = { akorlar: 'Akorlar', alistirma: 'Alıştırma', gecisler: 'Geçişler', defter: 'Türkü defteri', akort: 'Akort' };
  let aktifSayfa = 'akorlar';
  function sayfaAc(ad) {
    if (aktifSayfa === 'akort' && ad !== 'akort') akortDurdur();
    if (aktifSayfa === 'alistirma' && ad !== 'alistirma') dinlemeDurdur();
    aktifSayfa = ad;
    document.querySelectorAll('.sayfa').forEach(s => s.classList.toggle('aktif', s.id === 's-' + ad));
    document.querySelectorAll('#altMenu button').forEach(b => b.classList.toggle('aktif', b.dataset.sayfa === ad));
    $('baslik').textContent = BASLIK[ad];
    if (ad === 'alistirma') alistirmaCiz();
    if (ad === 'akorlar') akorListeCiz();
    if (ad === 'gecisler') gecisKaynakDoldur();
    if (ad === 'defter') defterCiz();
    window.scrollTo(0, 0);
  }
  document.querySelectorAll('#altMenu button').forEach(b => b.addEventListener('click', () => sayfaAc(b.dataset.sayfa)));

  // ---------- AKORLAR ----------
  let secAkor = null, secBasilislar = [], secNo = 0;
  function akorListeCiz() {
    const kutu = $('akorListe'); kutu.innerHTML = '';
    K.SEVIYELER.forEach((s, i) => {
      const g = document.createElement('div'); g.className = 'sev-grup';
      const b = document.createElement('div'); b.className = 'sev-ad'; b.textContent = s.ad; g.appendChild(b);
      s.akorlar.forEach(a => {
        const c = document.createElement('button');
        c.className = 'cip' + (secAkor && secAkor.id === a.id ? ' secili' : '') + (seviyeAcik(i) ? '' : ' kilitli');
        c.textContent = a.ad;
        c.addEventListener('click', () => {
          if (!seviyeAcik(i)) {
            bildir(`${a.ad} ${i + 1}. seviyede açılır. Alıştırma'da önceki seviyeyi geç. Yine de gösteriyorum.`);
          }
          akorSec(a);
        });
        g.appendChild(c);
      });
      kutu.appendChild(g);
    });
  }
  function akorSec(a) {
    secAkor = a; secBasilislar = K.basilislar(a); secNo = 0;
    D.sonAkor = a.ad; kaydet();
    akorListeCiz(); akorGoster();
  }
  function akorGoster() {
    const a = secAkor, b = secBasilislar[secNo];
    $('akorAd').textContent = a.ad;
    $('akorUzun').textContent = a.uzun;
    $('akorTonlar').innerHTML = a.tonlar.map(t => `<span class="ton">${K.NOTA[t]}</span>`).join('');
    if (!b) {
      $('basilisNo').textContent = '0 / 0'; $('basilisKonum').textContent = 'Bu akor için rahat bir basılış bulunamadı.';
      sapCiz($('akorSap'), { ilk: 0, son: 9 }); $('akorIpucu').textContent = ''; return;
    }
    $('basilisNo').textContent = `${secNo + 1} / ${secBasilislar.length}`;
    const pen = pencere(b.perdeler);
    $('basilisKonum').textContent = b.konum === 0 ? 'Sapın başında' : `${b.perdeler.filter(p => p > 0).sort((x, y) => x - y)[0]}. perde civarı`;
    sapCiz($('akorSap'), Object.assign({ basilis: b.perdeler }, pen));
    $('akorIpucu').textContent = ipucu(a, b);
  }
  function ipucu(a, b) {
    const bos = b.perdeler.map((p, i) => p === 0 ? K.DUZEN.teller[i].ad.toLowerCase() : null).filter(Boolean);
    const parca = [];
    if (bos.length === 3) parca.push('Üç tel de boş çalınır, sol el serbest.');
    else if (bos.length) parca.push(`Boş tel: ${bos.join(' ve ')} tel. Ona dokunmadan bas.`);
    if (!b.tamTon) {
      const eksik = a.tonlar.filter(t => !b.sesler.includes(t)).map(t => K.NOTA[t]);
      parca.push(`3 tel olduğu için ${eksik.join(', ')} sesi bu basılışta yok, akor yine tanınır.`);
    }
    if (b.sesler[0] === a.kok) parca.push(`Kök ses (${K.NOTA[a.kok]}) üst telde, akor dolgun duyulur.`);
    const basili = b.perdeler.filter(p => p > 0);
    if (basili.length >= 2 && Math.max(...basili) - Math.min(...basili) >= 4) parca.push('Perdeler arası açık: parmaklarını yay.');
    return parca.join(' ');
  }
  $('oncekiBasilis').addEventListener('click', () => { if (secBasilislar.length) { secNo = (secNo - 1 + secBasilislar.length) % secBasilislar.length; akorGoster(); } });
  $('sonrakiBasilis').addEventListener('click', () => { if (secBasilislar.length) { secNo = (secNo + 1) % secBasilislar.length; akorGoster(); } });
  $('calTopluca').addEventListener('click', () => { const b = secBasilislar[secNo]; if (b) basilisCal(b.perdeler, true); });
  $('calTelTel').addEventListener('click', () => { const b = secBasilislar[secNo]; if (b) basilisCal(b.perdeler, false); });
  function serbestGoster() {
    const v = $('serbestAkor').value, a = K.akorBul(v);
    if (!v.trim()) { $('serbestHata').textContent = 'Önce bir akor adı yaz.'; return; }
    if (!a) { $('serbestHata').textContent = 'Bu akoru tanımadım. Örnek: Fa#m, Sol7, Si♭ (Sib de olur), Resus4.'; return; }
    $('serbestHata').textContent = ''; akorSec(a);
  }
  $('serbestGoster').addEventListener('click', serbestGoster);
  $('serbestAkor').addEventListener('keydown', e => { if (e.key === 'Enter') serbestGoster(); });
  $('serbestAkor').addEventListener('input', () => ($('serbestHata').textContent = ''));

  // ---------- ALIŞTIRMA ----------
  let soru = null, cevap = [null, null, null], soruIlk = 0, soruKayitli = false, soruBitti = false;
  function alistirmaCiz() {
    // istatistik
    $('istSeri').textContent = D.seri || 0;
    $('istAcik').textContent = K.TUM_AKORLAR.filter(akorAcik).length;
    const hepsi = Object.values(D.denemeler).flat().slice(-50);
    $('istOran').textContent = hepsi.length ? Math.round(100 * hepsi.filter(Boolean).length / hepsi.length) + '%' : '–';
    const yol = $('seviyeYolu'); yol.innerHTML = '';
    const sim = simdikiSeviye();
    K.SEVIYELER.forEach((s, i) => {
      const d = seviyeDurum(i), acik = seviyeAcik(i);
      const k = document.createElement('div');
      k.className = 'sev-kutu' + (i === sim ? ' simdi' : '') + (acik ? '' : ' kilit');
      const durum = d.gecti ? '✓ Geçildi' : acik ? `Son 10: ${d.dogru}/${d.son} (8 gerekli)` : '🔒 Kilitli';
      k.innerHTML = `<b>${i + 1}. seviye</b><div class="ikincil">${s.akorlar.map(a => a.ad).join(' · ')}</div><div class="ikincil">${durum}</div><div class="cubuk"><i style="width:${d.gecti ? 100 : Math.round(d.dogru / 8 * 100)}%"></i></div>`;
      yol.appendChild(k);
      if (i === sim) setTimeout(() => k.scrollIntoView({ inline: 'center', block: 'nearest' }), 0);
    });
    if (!soru) yeniSoru();
    else soruCiz();
  }
  function yeniSoru() {
    dinlemeDurdur();
    const sim = simdikiSeviye();
    const acik = K.TUM_AKORLAR.filter(akorAcik);
    const simAkor = acik.filter(a => a.seviye === sim);
    let havuz = Math.random() < 0.6 && simAkor.length ? simAkor : acik;
    if (soru && havuz.length > 1) havuz = havuz.filter(a => a.id !== soru.id);
    soru = havuz[Math.floor(Math.random() * havuz.length)];
    cevap = [null, null, null]; soruIlk = 0; soruKayitli = false; soruBitti = false;
    $('geriBildirim').hidden = true;
    soruCiz();
  }
  function soruCiz(isaret, goster) {
    $('soruAd').textContent = soru.ad;
    const son = Math.min(soruIlk + 12, K.PERDELER.length - 1);
    sapCiz($('soruSap'), {
      basilis: goster || cevap, ilk: soruIlk, son, yukseklik: 430, isaret, secim: !isaret && !goster,
      etiket: !!(isaret || goster),
      tikla: (tel, perde) => {
        if (soruBitti) return;
        cevap[tel] = cevap[tel] === perde ? null : perde;
        $('geriBildirim').hidden = true;
        S.baglam(); if (cevap[tel] != null) S.sazTeli(K.frekans(tel, perde, D.ahenk), tel !== 1, 0, 0.22);
        soruCiz();
      }
    });
  }
  $('sapYukari').addEventListener('click', () => { soruIlk = Math.max(0, soruIlk - 6); soruCiz(); });
  $('sapAsagi').addEventListener('click', () => { soruIlk = Math.min(K.PERDELER.length - 13, soruIlk + 6); soruCiz(); });
  function kayitEt(dogru) {
    if (soruKayitli) return;
    soruKayitli = true;
    const sv = soru.seviye ?? 0;
    const onceGecti = seviyeDurum(sv).gecti;
    (D.denemeler[sv] = D.denemeler[sv] || []).push(dogru);
    D.denemeler[sv] = D.denemeler[sv].slice(-40);
    if (dogru) {
      const bugun = new Date().toDateString(), dun = new Date(Date.now() - 864e5).toDateString();
      if (D.sonGun !== bugun) { D.seri = D.sonGun === dun ? (D.seri || 0) + 1 : 1; D.sonGun = bugun; }
    }
    kaydet();
    if (!onceGecti && seviyeDurum(sv).gecti && sv + 1 < K.SEVIYELER.length) {
      bildir(`Tebrikler! ${sv + 2}. seviye açıldı: ${K.SEVIYELER[sv + 1].akorlar.map(a => a.ad).join(', ')}`);
    }
    alistirmaCiz();
  }
  function geriBildirim(sinif, metin) { const g = $('geriBildirim'); g.className = 'geri-bildirim ' + sinif; g.textContent = metin; g.hidden = false; }
  $('kontrolEt').addEventListener('click', () => {
    if (cevap.some(p => p == null)) { geriBildirim('bilgi', 'Her telde bir perde seç (ya da sapın üstüne dokunup boş bırak).'); return; }
    const k = K.basilisKontrol(soru, cevap);
    if (k.dogru) {
      kayitEt(true); soruBitti = true;
      geriBildirim('iyi', `Doğru! Sesler: ${k.sesler.map(s => K.NOTA[s]).join(' · ')}.`);
      soruCiz({ yanlis: [] }); basilisCal(cevap, true);
    } else {
      kayitEt(false);
      const telAd = k.yanlisTel.map(i => K.DUZEN.teller[i].ad.toLowerCase() + ' tel');
      let m = '';
      if (k.yanlisTel.length) {
        const komali = k.yanlisTel.filter(i => k.sesler[i] == null);
        m += `${telAd.join(', ')} bu akorda yok`;
        if (komali.length) m += ' (koma perdesine bastın)';
        m += '. ';
      }
      if (k.eksik.length) m += `Eksik ses: ${k.eksik.map(s => K.NOTA[s]).join(', ')}. `;
      m += `${soru.ad} = ${soru.tonlar.map(t => K.NOTA[t]).join(' · ')}. Tekrar dene.`;
      geriBildirim('kotu', m);
      soruCiz({ yanlis: k.yanlisTel });
    }
  });
  $('cevapGoster').addEventListener('click', () => {
    const b = K.basilislar(soru)[0]; if (!b) return;
    kayitEt(false); soruBitti = true;
    const pen = pencere(b.perdeler, 12); soruIlk = Math.min(pen.ilk, K.PERDELER.length - 13);
    geriBildirim('bilgi', `Bir basılış: üst ${b.perdeler[0]}, orta ${b.perdeler[1]}, alt ${b.perdeler[2]}. perde (0 = boş). Akorlar sekmesinde diğerlerini gör.`);
    soruCiz(null, b.perdeler);
    basilisCal(b.perdeler, true);
  });
  $('soruDinle').addEventListener('click', () => { const b = K.basilislar(soru)[0]; if (b) basilisCal(b.perdeler, true); });
  $('sonrakiSoru').addEventListener('click', yeniSoru);

  // Mikrofonla kontrol
  let dinleZaman = null, dinleSayac = 0;
  function dinlemeDurdur() {
    if (dinleZaman) { cancelAnimationFrame(dinleZaman); dinleZaman = null; }
    if (aktifSayfa !== 'akort') S.mikrofonKapat();
    $('kroma').hidden = true; $('dinleKontrol').textContent = '🎤 Çalarak kontrol';
  }
  $('dinleKontrol').addEventListener('click', async () => {
    if (dinleZaman) { dinlemeDurdur(); return; }
    try { await S.mikrofonAc(); } catch (e) { geriBildirim('kotu', 'Mikrofon açılamadı: ' + (e.message || e) + ' Tarayıcı ayarlarından izin ver.'); return; }
    const kr = $('kroma'); kr.hidden = false;
    kr.innerHTML = K.NOTA.map(n => `<div><i></i>${n}</div>`).join('');
    const cubuk = [...kr.querySelectorAll('i')];
    $('dinleKontrol').textContent = '■ Durdur';
    geriBildirim('bilgi', `${soru.ad} akorunu bas ve tezeneyle birkaç kez vur.`);
    dinleSayac = 0;
    const dongu = () => {
      const r = S.kroma(D.ahenk);
      if (r) {
        r.k.forEach((v, i) => { cubuk[i].style.height = Math.round(v * 100) + '%'; cubuk[i].classList.toggle('akorda', soru.tonlar.includes(i)); });
        const yeterli = r.guc > 1e-5;
        const zorunluVar = soru.zorunlu.every(t => r.k[t] > 0.3);
        const disari = K.NOTA.map((_, i) => i).filter(i => !soru.tonlar.includes(i));
        const disMax = Math.max(...disari.map(i => r.k[i]));
        if (yeterli && zorunluVar && disMax < 0.45) dinleSayac++; else dinleSayac = Math.max(0, dinleSayac - 1);
        if (dinleSayac > 10) {
          kayitEt(true); soruBitti = true;
          geriBildirim('iyi', `Duydum, ${soru.ad} doğru çalındı!`);
          dinleZaman = null; S.mikrofonKapat(); $('dinleKontrol').textContent = '🎤 Çalarak kontrol';
          return;
        }
      }
      dinleZaman = requestAnimationFrame(dongu);
    };
    dongu();
  });

  // ---------- GEÇİŞLER ----------
  const USULLER = {
    '4/4': { vurus: [1, 0, 0, 0], ad: '4/4' },
    '3/4': { vurus: [1, 0, 0], ad: '3/4' },
    '2/4': { vurus: [1, 0], ad: '2/4' },
    '9/8': { vurus: [1, 0, 1, 0, 1, 0, 1, 0, 0], ad: '9/8 (2+2+2+3)', alt: 2 },
    '7/8': { vurus: [1, 0, 1, 0, 1, 0, 0], ad: '7/8 (2+2+3)', alt: 2 },
    '5/8': { vurus: [1, 0, 1, 0, 0], ad: '5/8 (2+3)', alt: 2 }
  };
  let usul = '4/4', olcuAkor = 2, calisiyor = false, zamanlayici = null;
  function cipDoldur(kutu, secenek, secili, degis) {
    kutu.innerHTML = '';
    secenek.forEach(([d, ad]) => {
      const b = document.createElement('button'); b.className = 'cip' + (d === secili ? ' secili' : ''); b.textContent = ad;
      b.addEventListener('click', () => { degis(d); cipDoldur(kutu, secenek, d, degis); });
      kutu.appendChild(b);
    });
  }
  function usulCipleri() { cipDoldur($('usulCip'), Object.keys(USULLER).map(k => [k, k]), usul, d => { usul = d; gecisHazirla(); }); }
  usulCipleri();
  cipDoldur($('olcuCip'), [[1, '1'], [2, '2'], [4, '4']], olcuAkor, d => { olcuAkor = d; });
  $('tempo').addEventListener('input', e => ($('tempoDeger').textContent = e.target.value));

  function gecisKaynakDoldur() {
    const s = $('gecisKaynak'), onceki = s.value;
    s.innerHTML = '<option value="">Serbest – akorları kendin yaz</option>' + D.turkuler.map(t => `<option value="${t.id}">${kacis(t.ad)}</option>`).join('');
    if ([...s.options].some(o => o.value === onceki)) s.value = onceki;
  }
  $('gecisKaynak').addEventListener('change', () => {
    const t = D.turkuler.find(x => String(x.id) === $('gecisKaynak').value);
    if (t) { $('gecisAkorlar').value = t.akorlar; usul = t.usul; usulCipleri(); $('tempo').value = t.tempo; $('tempoDeger').textContent = t.tempo; }
    gecisHazirla();
  });
  function akorDizisi(metin) {
    const parca = metin.split(/[\s,|\-–]+/).filter(Boolean);
    const bilinmeyen = [], dizi = [];
    parca.forEach(p => { const a = K.akorBul(p); if (a) dizi.push(a); else bilinmeyen.push(p); });
    return { dizi, bilinmeyen };
  }
  let gDizi = [], gIndex = 0, gVurus = 0;
  function gecisHazirla() {
    const { dizi, bilinmeyen } = akorDizisi($('gecisAkorlar').value);
    $('gecisHata').textContent = bilinmeyen.length ? `Tanınmayan: ${bilinmeyen.join(', ')}` : (dizi.length ? '' : 'En az bir akor yaz.');
    gDizi = dizi; if (gIndex >= gDizi.length) gIndex = 0;
    gecisCiz();
  }
  function gecisCiz() {
    const k = $('gecisKartlar'); k.innerHTML = '';
    gDizi.forEach((a, i) => {
      const d = document.createElement('div');
      d.className = 'gk' + (i === gIndex ? ' simdi' : '') + (i === (gIndex + 1) % gDizi.length && gDizi.length > 1 ? ' sonraki' : '');
      d.textContent = a.ad; k.appendChild(d);
      if (i === gIndex) d.scrollIntoView({ inline: 'center', block: 'nearest' });
    });
    const u = USULLER[usul];
    $('vuruslar').innerHTML = u.vurus.map((v, i) => `<i class="${v ? 'vurgulu' : ''}${calisiyor && i === gVurus ? ' yanik' : ''}"></i>`).join('');
    const ciz = (svg, a) => {
      if (!a) { while (svg.firstChild) svg.removeChild(svg.firstChild); return; }
      const b = K.basilislar(a)[0];
      if (b) sapCiz(svg, Object.assign({ basilis: b.perdeler, yukseklik: 260 }, pencere(b.perdeler, 8)));
    };
    ciz($('gecisSapSimdi'), gDizi[gIndex]);
    ciz($('gecisSapSonraki'), gDizi.length > 1 ? gDizi[(gIndex + 1) % gDizi.length] : null);
  }
  $('gecisAkorlar').addEventListener('input', () => { gIndex = 0; gecisHazirla(); });

  function gecisDurdur() {
    calisiyor = false; clearTimeout(zamanlayici); $('gecisBasla').textContent = '▶ Başla'; gVurus = 0; gecisCiz();
  }
  $('gecisBasla').addEventListener('click', () => {
    if (calisiyor) { gecisDurdur(); return; }
    gecisHazirla(); if (!gDizi.length) return;
    S.baglam(); calisiyor = true; $('gecisBasla').textContent = '■ Durdur';
    gIndex = 0; gVurus = 0;
    let olcu = 0, sonraki = S.simdi() + 0.15;
    // Görsel durumla plan durumunu ayır
    let pV = 0, pI = 0;
    const planla2 = () => {
      if (!calisiyor) return;
      const u = USULLER[usul];
      const adim = 60 / +$('tempo').value / (u.alt || 1);
      while (sonraki < S.simdi() + 0.12) {
        const v = pV, i = pI, z = Math.max(0, sonraki - S.simdi());
        if (v === 0) S.tik(z, true); else if (u.vurus[v]) S.tik(z, false); else if (!u.alt) S.tik(z, false);
        if (v === 0 && olcu === 0 && $('akorCal').checked) {
          const b = K.basilislar(gDizi[i])[0]; if (b) basilisCal(b.perdeler, true, z);
        }
        setTimeout(() => { if (calisiyor) { gVurus = v; gIndex = i; gecisCiz(); } }, z * 1000);
        pV = (pV + 1) % u.vurus.length;
        if (pV === 0) { olcu++; if (olcu >= olcuAkor) { olcu = 0; pI = (pI + 1) % gDizi.length; } }
        sonraki += adim;
      }
      zamanlayici = setTimeout(planla2, 25);
    };
    planla2();
  });

  // ---------- TÜRKÜ DEFTERİ ----------
  let duzenlenen = null;
  function kacis(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
  $('tUsul').innerHTML = Object.keys(USULLER).map(k => `<option value="${k}">${USULLER[k].ad}</option>`).join('');
  function defterCiz() {
    const l = $('turkuListe'); l.innerHTML = '';
    if (!D.turkuler.length) { l.innerHTML = '<div class="bos">Defterin boş. Çalmak istediğin türkünün akorlarını ekle.</div>'; return; }
    D.turkuler.forEach(t => {
      const d = document.createElement('div'); d.className = 'turku';
      const { dizi } = akorDizisi(t.akorlar);
      d.innerHTML = `<h3>${kacis(t.ad)}</h3><div class="ikincil kucuk-yazi">${kacis(USULLER[t.usul] ? USULLER[t.usul].ad : t.usul)} · ${t.tempo} vuruş/dk</div>
        <div class="akorlar">${dizi.map(a => `<button class="cip" data-akor="${kacis(a.ad)}">${kacis(a.ad)}</button>`).join('')}</div>
        ${t.not ? `<div class="not">${kacis(t.not)}</div>` : ''}
        <div class="dugme-satir"><button class="birincil" data-is="calis">Geçişlerde çalış</button><button data-is="duzenle">Düzenle</button><button data-is="sil">Sil</button></div>`;
      d.querySelectorAll('[data-akor]').forEach(b => b.addEventListener('click', () => { sayfaAc('akorlar'); akorSec(K.akorBul(b.dataset.akor)); }));
      d.querySelector('[data-is=calis]').addEventListener('click', () => {
        sayfaAc('gecisler'); $('gecisKaynak').value = String(t.id); $('gecisKaynak').dispatchEvent(new Event('change'));
      });
      d.querySelector('[data-is=duzenle]').addEventListener('click', () => formAc(t));
      const sil = d.querySelector('[data-is=sil]');
      sil.addEventListener('click', () => {
        if (sil.dataset.emin) { D.turkuler = D.turkuler.filter(x => x.id !== t.id); kaydet(); defterCiz(); }
        else { sil.dataset.emin = '1'; sil.textContent = 'Emin misin?'; setTimeout(() => { sil.dataset.emin = ''; sil.textContent = 'Sil'; }, 3000); }
      });
      l.appendChild(d);
    });
  }
  function formAc(t) {
    duzenlenen = t || null;
    $('tAd').value = t ? t.ad : ''; $('tAkor').value = t ? t.akorlar : ''; $('tUsul').value = t ? t.usul : '4/4';
    $('tTempo').value = t ? t.tempo : 80; $('tNot').value = t ? t.not : ''; $('tHata').textContent = '';
    $('turkuForm').hidden = false; $('yeniTurku').hidden = true;
    $('turkuForm').scrollIntoView({ behavior: 'smooth' });
  }
  function formKapat() { $('turkuForm').hidden = true; $('yeniTurku').hidden = false; }
  $('yeniTurku').addEventListener('click', () => formAc(null));
  $('tIptal').addEventListener('click', formKapat);
  ['tAd', 'tAkor', 'tTempo'].forEach(i => $(i).addEventListener('input', () => ($('tHata').textContent = '')));
  $('tKaydet').addEventListener('click', () => {
    const ad = $('tAd').value.trim(), akorlar = $('tAkor').value.trim(), tempo = +$('tTempo').value;
    if (!ad) { $('tHata').textContent = 'Türkünün adını yaz.'; return; }
    const { dizi, bilinmeyen } = akorDizisi(akorlar);
    if (!dizi.length) { $('tHata').textContent = 'En az bir akor yaz, örnek: Lam Sol Fa Mi.'; return; }
    if (bilinmeyen.length) { $('tHata').textContent = `Tanınmayan akor: ${bilinmeyen.join(', ')}. Örnek yazım: Lam, Sol7, Fa#m, Sib.`; return; }
    if (!(tempo >= 40 && tempo <= 200)) { $('tHata').textContent = 'Tempo 40 ile 200 arasında olmalı.'; return; }
    const kayit = { id: duzenlenen ? duzenlenen.id : Date.now(), ad, akorlar: dizi.map(a => a.ad).join(' '), usul: $('tUsul').value, tempo, not: $('tNot').value.trim() };
    if (duzenlenen) D.turkuler = D.turkuler.map(x => x.id === kayit.id ? kayit : x); else D.turkuler.unshift(kayit);
    kaydet(); formKapat(); defterCiz(); bildir('Kaydedildi');
  });

  // ---------- AKORT ----------
  let akortTel = 'oto', akortDongu = null, sonNotaZaman = 0, yumusak = null;
  $('ahenk').innerHTML = K.AHENKLER.map(a => `<option value="${a.id}">${a.ad}</option>`).join('');
  $('ahenk').value = String(D.ahenk);
  $('ahenk').addEventListener('change', () => { D.ahenk = +$('ahenk').value; kaydet(); bildir('Ahenk kaydedildi'); });
  function telCipleri() {
    cipDoldur($('telCip'), [['oto', 'Otomatik'], ...K.DUZEN.teller.map((t, i) => [i, `${t.ad} · ${K.NOTA[t.nota]}`])], akortTel, d => { akortTel = d; });
  }
  telCipleri();
  function ibreCiz(sent, durum) {
    const svg = $('ibre'); while (svg.firstChild) svg.removeChild(svg.firstChild);
    const cx = 120, cy = 125, r = 100;
    const nokta = d => { const a = (-90 + d * 1.6) * Math.PI / 180; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; };
    const [x1, y1] = nokta(-50), [x2, y2] = nokta(50);
    el('path', { d: `M${x1} ${y1} A${r} ${r} 0 0 1 ${x2} ${y2}`, fill: 'none', stroke: 'var(--cizgi)', 'stroke-width': 3 }, svg);
    const [g1x, g1y] = nokta(-5), [g2x, g2y] = nokta(5);
    el('path', { d: `M${g1x} ${g1y} A${r} ${r} 0 0 1 ${g2x} ${g2y}`, fill: 'none', stroke: 'var(--yesil)', 'stroke-width': 8 }, svg);
    [-50, -25, 0, 25, 50].forEach(d => {
      const [a, b] = nokta(d), t = el('text', { x: a, y: b - 8, 'text-anchor': 'middle', 'font-size': 11, fill: 'var(--ikincil)' }, svg);
      t.textContent = d > 0 ? '+' + d : d;
    });
    if (sent != null) {
      const s = Math.max(-50, Math.min(50, sent)), [px, py] = nokta(s);
      const renk = durum === 'iyi' ? 'var(--yesil)' : 'var(--yazi)';
      el('line', { x1: cx, y1: cy, x2: px, y2: py, stroke: renk, 'stroke-width': 3, 'stroke-linecap': 'round' }, svg);
    }
    el('circle', { cx, cy, r: 5, fill: 'var(--yazi)' }, svg);
  }
  ibreCiz(null);
  function akortDurdur() {
    if (akortDongu) { cancelAnimationFrame(akortDongu); akortDongu = null; }
    S.mikrofonKapat(); $('akortDinle').textContent = '🎤 Dinle';
  }
  $('akortDinle').addEventListener('click', async () => {
    if (akortDongu) { akortDurdur(); $('akortDurum').textContent = 'Durduruldu'; $('akortDurum').className = 'akort-durum'; return; }
    try { await S.mikrofonAc(); } catch (e) { $('akortDurum').textContent = 'Mikrofon açılamadı. Tarayıcı ayarlarından izin ver.'; return; }
    $('akortDinle').textContent = '■ Durdur';
    $('akortDurum').textContent = 'Teli çal…';
    yumusak = null;
    const dongu = () => {
      const r = S.perdeBul();
      if (r && r.f) {
        const n = K.frekanstanNota(r.f, D.ahenk);
        let hedef = n.nota, sapma = n.sent;
        if (akortTel !== 'oto') {
          hedef = K.DUZEN.teller[+akortTel].nota;
          // hedefe göre sent (oktavdan bağımsız)
          let fark = ((n.midi - hedef) % 12 + 12) % 12; if (fark > 6) fark -= 12;
          sapma = Math.round(fark * 100);
        }
        yumusak = yumusak == null ? sapma : yumusak * 0.7 + sapma * 0.3;
        const s = Math.round(yumusak);
        $('akortNota').textContent = K.NOTA[hedef];
        const d = $('akortDurum');
        if (Math.abs(s) > 300) { d.textContent = `Çok uzak: şu an ${K.NOTA[n.nota]} çalıyor`; d.className = 'akort-durum uyari'; }
        else if (Math.abs(s) <= 5) { d.textContent = 'Tamam, akortlu ✓'; d.className = 'akort-durum iyi'; }
        else if (s < 0) { d.textContent = `${s} sent · pes, burguyu sık`; d.className = 'akort-durum uyari'; }
        else { d.textContent = `+${s} sent · tiz, burguyu gevşet`; d.className = 'akort-durum uyari'; }
        ibreCiz(s, Math.abs(s) <= 5 ? 'iyi' : '');
        sonNotaZaman = performance.now();
      } else if (performance.now() - sonNotaZaman > 1500) {
        $('akortDurum').textContent = 'Teli çal…'; $('akortDurum').className = 'akort-durum'; ibreCiz(null); yumusak = null;
      }
      akortDongu = requestAnimationFrame(dongu);
    };
    dongu();
  });
  $('akortReferans').addEventListener('click', () => {
    const i = akortTel === 'oto' ? 2 : +akortTel;
    S.referans(K.frekans(i, 0, D.ahenk), 2.2);
    if (akortTel === 'oto') bildir('Alt tel (La) referans sesi');
  });

  // ---------- Başlat ----------
  akorSec(K.akorBul(D.sonAkor) || K.TUM_AKORLAR[0]);
  gecisKaynakDoldur(); gecisHazirla();
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
  document.addEventListener('visibilitychange', () => { if (document.hidden) { akortDurdur(); dinlemeDurdur(); gecisDurdur(); } });
})();
