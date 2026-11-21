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
  K.ayarla(D.perdeler || null);
  // Ses kayıtları IndexedDB'de (localStorage'a sığmaz)
  function depo(islem) {
    return new Promise((ok, hata) => {
      let r; try { r = indexedDB.open('saz-akorlari', 1); } catch (e) { hata(e); return; }
      r.onupgradeneeded = () => r.result.createObjectStore('sesler');
      r.onerror = () => hata(r.error);
      r.onsuccess = () => {
        const db = r.result, tx = db.transaction('sesler', 'readwrite'), st = tx.objectStore('sesler');
        const q = islem(st); tx.oncomplete = () => ok(q && q.result); tx.onerror = () => hata(tx.error);
      };
    });
  }
  function mikHata(e) {
    const ad = e && e.name;
    if (ad === 'NotAllowedError') return 'Mikrofon izni verilmedi. iPhone: Ayarlar › Uygulamalar › Safari › Mikrofon › "Sor" ya da "İzin ver". Sonra uygulamayı kapatıp yeniden aç.';
    if (ad === 'NotFoundError') return 'Mikrofon bulunamadı.';
    if (ad === 'NotReadableError') return 'Mikrofon başka bir uygulama tarafından kullanılıyor. Diğer uygulamayı kapatıp tekrar dene.';
    return 'Mikrofon açılamadı (' + (ad || (e && e.message) || 'bilinmeyen hata') + ').';
  }
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
  function sapCiz(svg, s) { window.GercekSap.ciz(svg, Object.assign({ K }, s)); }
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
  function telCal(i, p, zaman = 0, ses = 0.28) {
    const f = K.frekans(i, p, D.ahenk);
    if (D.ornekKullan !== false && S.ornekVar() && S.ornekCal(i, p, f, zaman, ses * 2)) return;
    S.sazTeli(f, i !== 1, zaman, ses); // üst ve alt telde bam var
  }
  function basilisCal(perdeler, tezene = true, gecikme = 0) {
    S.baglam();
    perdeler.forEach((p, i) => { if (p != null) telCal(i, p, gecikme + (tezene ? i * 0.028 : i * 0.45)); });
  }

  // ---------- Sekmeler ----------
  const BASLIK = { akorlar: 'Akorlar', alistirma: 'Alıştırma', gecisler: 'Geçişler', defter: 'Türkü defteri', akort: 'Akort' };
  let aktifSayfa = 'akorlar';
  function sayfaAc(ad) {
    if (aktifSayfa === 'akort' && ad !== 'akort') { akortDurdur(); tanitDurdur(); }
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
      sapCiz($('akorSap'), { ilk: 0, son: Math.min(10, K.PERDELER.length - 1) }); $('akorIpucu').textContent = ''; return;
    }
    $('basilisNo').textContent = `${secNo + 1} / ${secBasilislar.length}`;
    const pen = pencere(b.perdeler, 10);
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
    const son = Math.min(soruIlk + 10, K.PERDELER.length - 1);
    sapCiz($('soruSap'), {
      basilis: goster || cevap, ilk: soruIlk, son, isaret, secim: !isaret && !goster,
      etiket: !!(isaret || goster),
      tikla: (tel, perde) => {
        if (soruBitti) return;
        cevap[tel] = cevap[tel] === perde ? null : perde;
        $('geriBildirim').hidden = true;
        S.baglam(); if (cevap[tel] != null) telCal(tel, perde, 0, 0.22);
        soruCiz();
      }
    });
  }
  $('sapYukari').addEventListener('click', () => { soruIlk = Math.max(0, soruIlk - 6); soruCiz(); });
  $('sapAsagi').addEventListener('click', () => { soruIlk = Math.max(0, Math.min(K.PERDELER.length - 11, soruIlk + 6)); soruCiz(); });
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
    const pen = pencere(b.perdeler, 10); soruIlk = Math.max(0, Math.min(pen.ilk, K.PERDELER.length - 11));
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
    try { await S.mikrofonAc(); } catch (e) { geriBildirim('kotu', mikHata(e)); return; }
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
    s.innerHTML = '<option value="">Serbest – akorları kendin yaz</option>' +
      '<optgroup label="Hazır türküler">' + HAZIR.map(t => `<option value="${t.id}">${kacis(t.ad)}</option>`).join('') + '</optgroup>' +
      (D.turkuler.length ? '<optgroup label="Benim defterim">' + D.turkuler.map(t => `<option value="${t.id}">${kacis(t.ad)}</option>`).join('') + '</optgroup>' : '');
    if ([...s.options].some(o => o.value === onceki)) s.value = onceki;
  }
  $('gecisKaynak').addEventListener('change', () => {
    const t = tumTurkuler().find(x => String(x.id) === $('gecisKaynak').value);
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
      if (b) sapCiz(svg, Object.assign({ basilis: b.perdeler, yukseklik: 380 }, pencere(b.perdeler, 8)));
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
  const HAZIR = (window.HAZIR_TURKULER || []).map(t => Object.assign({}, t, {
    akorlar: t.bolumler.flatMap(b => b.satirlar).join(' ')
  }));
  function tumTurkuler() { return HAZIR.concat(D.turkuler); }
  let duzenlenen = null, defterSekme = 'hazir';
  document.querySelectorAll('#defterSekme button').forEach(b => b.addEventListener('click', () => {
    defterSekme = b.dataset.d;
    document.querySelectorAll('#defterSekme button').forEach(x => x.classList.toggle('secili', x === b));
    defterCiz();
  }));
  function gecisteCalis(t) {
    sayfaAc('gecisler'); $('gecisKaynak').value = String(t.id); $('gecisKaynak').dispatchEvent(new Event('change'));
  }
  function akorCipleri(metin) {
    return akorDizisi(metin).dizi.map(a => `<button class="cip" data-akor="${kacis(a.ad)}">${kacis(a.ad)}</button>`).join('');
  }
  function hazirCiz() {
    const l = $('hazirListe'); l.innerHTML = '';
    HAZIR.forEach(t => {
      const d = document.createElement('div'); d.className = 'turku';
      const farkli = [...new Set(akorDizisi(t.akorlar).dizi.map(a => a.ad))];
      const kilitli = farkli.filter(ad => { const a = K.akorBul(ad); return a && !akorAcik(a); });
      d.innerHTML = `<h3>${kacis(t.ad)}<span class="zorluk">${kacis(t.seviye)}</span></h3>
        <div class="ikincil kucuk-yazi">${kacis(t.yore)} · ${kacis(USULLER[t.usul].ad)} · ~${t.tempo} vuruş/dk · Akorlar: ${farkli.map(kacis).join(', ')}</div>
        ${t.bolumler.map(b => `<div class="bolum"><div class="bolum-ad">${kacis(b.ad)}</div>${b.satirlar.map((s, i) => `<div class="dize"><span class="no">${i + 1}</span>${akorCipleri(s)}</div>`).join('')}</div>`).join('')}
        ${t.not ? `<div class="not">${kacis(t.not)}</div>` : ''}
        ${kilitli.length ? `<div class="not">Henüz açılmamış akorlar: ${kilitli.map(kacis).join(', ')}. Akorlar sekmesinde yine de görebilirsin.</div>` : ''}
        <div class="dugme-satir"><button class="birincil" data-is="calis">Geçişlerde çalış</button><button data-is="kopya">Kopyala, düzenle</button></div>`;
      d.querySelectorAll('[data-akor]').forEach(b => b.addEventListener('click', () => { sayfaAc('akorlar'); akorSec(K.akorBul(b.dataset.akor)); }));
      d.querySelector('[data-is=calis]').addEventListener('click', () => gecisteCalis(t));
      d.querySelector('[data-is=kopya]').addEventListener('click', () => {
        defterSekme = 'benim';
        document.querySelectorAll('#defterSekme button').forEach(x => x.classList.toggle('secili', x.dataset.d === 'benim'));
        defterCiz();
        formAc({ ad: t.ad, akorlar: t.akorlar, usul: t.usul, tempo: t.tempo, not: t.not }, true);
      });
      l.appendChild(d);
    });
    const a = document.createElement('p'); a.className = 'aciklama';
    a.textContent = 'Akorlar gitar akor kaynaklarından alınıp La karara çevrildi. Sözler eklenmedi. Usul ve tempo yaklaşıktır, kaydı dinleyip ayarla. Yanlış bulduğun bir yer olursa Kopyala, düzenle ile kendi defterine al ve düzelt.';
    l.appendChild(a);
  }
  function kacis(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
  $('tUsul').innerHTML = Object.keys(USULLER).map(k => `<option value="${k}">${USULLER[k].ad}</option>`).join('');
  function defterCiz() {
    $('hazirListe').hidden = defterSekme !== 'hazir'; $('benimKutu').hidden = defterSekme !== 'benim';
    if (defterSekme === 'hazir') { hazirCiz(); return; }
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
      d.querySelector('[data-is=calis]').addEventListener('click', () => gecisteCalis(t));
      d.querySelector('[data-is=duzenle]').addEventListener('click', () => formAc(t));
      const sil = d.querySelector('[data-is=sil]');
      sil.addEventListener('click', () => {
        if (sil.dataset.emin) { D.turkuler = D.turkuler.filter(x => x.id !== t.id); kaydet(); defterCiz(); }
        else { sil.dataset.emin = '1'; sil.textContent = 'Emin misin?'; setTimeout(() => { sil.dataset.emin = ''; sil.textContent = 'Sil'; }, 3000); }
      });
      l.appendChild(d);
    });
  }
  function formAc(t, kopya) {
    duzenlenen = kopya ? null : (t || null);
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
    try { await S.mikrofonAc(); } catch (e) { $('akortDurum').textContent = mikHata(e); return; }
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


  // ---------- SAZIMI TANIT ----------
  let tanit = null;
  function tanitDurumYaz() {
    $('tanitDurum').textContent = D.perdeler
      ? `Senin sazından ölçülen ${D.perdeler.length} perde kullanılıyor.`
      : 'Şu an standart 17 aralıklı perde düzeni kullanılıyor. Kendi sazının perdelerini ölçtürmek için başla.';
    $('tanitSifirla').hidden = !D.perdeler;
  }
  function tanitEtiket(c) {
    const y = Math.round(c / 100), sap = Math.round(c - y * 100);
    return { ad: K.NOTA[(9 + y) % 12], sap, koma: Math.abs(sap) > 30 };
  }
  function tanitListeCiz(liste) {
    $('tanitListe').innerHTML = liste.map((c, i) => {
      const e = tanitEtiket(c);
      return `<span class="${e.koma ? 'koma' : ''}">${i + 1}: ${e.ad}${e.sap ? (e.sap > 0 ? ' +' : ' ') + e.sap : ''}</span>`;
    }).join('');
  }
  function tanitYonerge() {
    const n = tanit.liste.length;
    const y = { orta: 'Şimdi orta teli boş çal', ust: 'Son olarak üst teli boş çal' }[tanit.asama];
    $('tanitYonerge').textContent = y || (tanit.f0 == null ? 'Alt teli boş çal' : `${n + 1}. perdeye bas, alt teli çal`);
    $('tanitGeri').disabled = tanit.f0 == null || tanit.asama !== 'perde';
    $('tanitAtla').hidden = tanit.asama === 'perde';
    $('tanitBitir').hidden = tanit.asama !== 'perde';
  }
  function tanitDurdur() {
    if (!tanit) return;
    cancelAnimationFrame(tanit.dongu); S.kayitBitir(); S.mikrofonKapat();
    tanit = null; $('tanitAdim').hidden = true; $('tanitDugmeler').hidden = false;
  }
  $('tanitBasla').addEventListener('click', async () => {
    akortDurdur();
    try { await S.mikrofonAc(); } catch (e) { $('tanitHata').textContent = mikHata(e); return; }
    $('tanitHata').textContent = '';
    tanit = { f0: null, liste: [], okuma: [], dongu: 0, asama: 'perde', isaret: [] };
    S.kayitBasla();
    $('tanitAdim').hidden = false; $('tanitDugmeler').hidden = true;
    tanitListeCiz([]); tanitYonerge();
    const dongu = () => {
      if (!tanit) return;
      const r = S.perdeBul();
      if (r && r.f) {
        const onceki = tanit.liste.length ? tanit.liste[tanit.liste.length - 1] : 0;
        let c = tanit.f0 == null ? 0 : 1200 * Math.log2(r.f / tanit.f0);
        if (tanit.f0 != null) { while (c < onceki - 300) c += 1200; while (c > onceki + 900) c -= 1200; }
        tanit.okuma.push(tanit.f0 == null ? 1200 * Math.log2(r.f / 440) : c);
        if (tanit.okuma.length > 14) tanit.okuma.shift();
        const o = tanit.okuma, ort = o.reduce((a, b) => a + b, 0) / o.length;
        const kararli = o.length >= 12 && Math.max(...o) - Math.min(...o) < 12;
        $('tanitCubuk').style.width = Math.round(100 * Math.min(1, o.length / 12) * (kararli ? 1 : 0.6)) + '%';
        if (tanit.asama !== 'perde') {
          const n = K.frekanstanNota(r.f, D.ahenk);
          $('tanitOlcum').textContent = `Duyulan: ${K.NOTA[n.nota]} ${n.sent > 0 ? '+' : ''}${n.sent} sent`;
          const tel0 = tanit.asama === 'orta' ? 1 : 0;
          const bek = 1200 * Math.log2(tanit.f0 / 440) + (tel0 === 1 ? -200 : -700);
          let fark = ((ort - bek) % 1200 + 1200) % 1200; if (fark > 600) fark -= 1200;
          if (kararli && Math.abs(fark) > 80) $('tanitOlcum').textContent += ' · bu, beklenen tel değil';
          if (kararli && Math.abs(fark) <= 80) {
            const tel = tel0;
            tanit.isaret.push({ tel, perde: 0, f: 440 * Math.pow(2, ort / 1200), konum: S.kayitKonum() });
            tanit.okuma = []; bildir((tel === 1 ? 'Orta' : 'Üst') + ' tel kaydedildi');
            if (tel === 1) { tanit.asama = 'ust'; tanitYonerge(); } else { tanitKaydet(); return; }
          }
        } else if (tanit.f0 == null) {
          const n = K.frekanstanNota(r.f, D.ahenk);
          $('tanitOlcum').textContent = `Duyulan: ${K.NOTA[n.nota]} ${n.sent > 0 ? '+' : ''}${n.sent} sent`;
          if (kararli) {
            tanit.f0 = 440 * Math.pow(2, ort / 1200); tanit.okuma = [];
            tanit.isaret.push({ tel: 2, perde: 0, f: tanit.f0, konum: S.kayitKonum() });
            bildir('Boş tel kaydedildi'); tanitYonerge();
          }
        } else {
          const e = tanitEtiket(c);
          $('tanitOlcum').textContent = `Duyulan: ${e.ad} (${Math.round(c)} sent)`;
          if (kararli) {
            if (ort > onceki + 12 && ort < onceki + 260) {
              tanit.liste.push(Math.round(ort)); tanit.okuma = [];
              tanit.isaret.push({ tel: 2, perde: tanit.liste.length, f: tanit.f0 * Math.pow(2, ort / 1200), konum: S.kayitKonum() });
              tanitListeCiz(tanit.liste); tanitYonerge();
              if (ort > 1750) { $('tanitBitir').click(); return; }
            } else if (ort <= onceki + 12 && Math.abs(ort - onceki) > 30) {
              $('tanitOlcum').textContent = 'Bu ses bir önceki perdeden pes. Bir sonraki perdeye bas.';
            }
          }
        }
      } else if (tanit.okuma.length) tanit.okuma = [];
      tanit.dongu = requestAnimationFrame(dongu);
    };
    dongu();
  });
  $('tanitGeri').addEventListener('click', () => {
    if (!tanit) return;
    if (tanit.liste.length) tanit.liste.pop(); else tanit.f0 = null;
    tanit.isaret.pop();
    tanit.okuma = []; tanitListeCiz(tanit.liste); tanitYonerge();
  });
  $('tanitBitir').addEventListener('click', () => {
    if (!tanit) return;
    if (tanit.liste.length < 5) { $('tanitHata').textContent = 'En az 5 perde ölçmelisin. Devam et ya da Geri ile düzelt.'; return; }
    tanit.asama = 'orta'; tanit.okuma = []; tanitYonerge();
  });
  $('tanitAtla').addEventListener('click', () => {
    if (!tanit) return;
    if (tanit.asama === 'orta') { tanit.asama = 'ust'; tanitYonerge(); } else tanitKaydet();
  });
  // Kayıttan her işaret için bir ses parçası kes
  function parcala(kayit, isaretler) {
    const { veri, sr } = kayit, blok = Math.round(sr * 0.01);
    const rms = i0 => { let t = 0; for (let i = i0; i < i0 + blok && i < veri.length; i++) t += veri[i] * veri[i]; return Math.sqrt(t / blok); };
    const bas = [];
    isaretler.forEach((m, k) => {
      const ust = Math.min(m.konum, veri.length) - blok;
      const alt = Math.max(0, m.konum - Math.round(sr * 1.3), k ? isaretler[k - 1].konum : 0);
      let tepe = 0, tepeI = alt;
      for (let i = alt; i < ust; i += blok) { const v = rms(i); if (v > tepe) { tepe = v; tepeI = i; } }
      let on = tepeI;
      while (on - blok > alt && rms(on - blok) > tepe * 0.2) on -= blok;
      bas.push(Math.max(0, on - Math.round(sr * 0.01)));
    });
    return isaretler.map((m, k) => {
      const b = bas[k], son = Math.min(b + Math.round(sr * 2.2), k + 1 < bas.length ? bas[k + 1] - Math.round(sr * 0.02) : veri.length, veri.length);
      const v = veri.slice(b, Math.max(b + 1, son));
      let mx = 0; for (const x of v) mx = Math.max(mx, Math.abs(x));
      const k2 = mx > 0 ? 0.8 / mx : 1, sonik = Math.round(sr * 0.08), basik = Math.round(sr * 0.004);
      for (let i = 0; i < v.length; i++) {
        let g = k2;
        if (i < basik) g *= i / basik;
        if (i > v.length - sonik) g *= (v.length - i) / sonik;
        v[i] *= g;
      }
      return { tel: m.tel, perde: m.perde, f: m.f, veri: v };
    }).filter(o => o.veri.length > sr * 0.3);
  }
  function tanitKaydet() {
    const isaret = tanit.isaret.slice();
    D.perdeler = tanit.liste.slice();
    const kayit = S.kayitBitir();
    tanitDurdur();
    if (kayit && isaret.length) {
      const liste = parcala(kayit, isaret);
      S.orneklerYukle(liste, kayit.sr);
      D.ornekKullan = true; D.ornekSayisi = liste.length;
      depo(st => st.put({ sr: kayit.sr, liste }, 'ornekler')).catch(() => bildir('Ses kayıtları bu telefonda saklanamadı'));
    }
    kaydet(); yeniDuzen(); sesAyarCiz();
    bildir(`${D.perdeler.length} perde ve ${D.ornekSayisi || 0} ses kaydedildi`);
    setTimeout(() => basilisCal([0, 0, 0], true), 400);
  }
  function sesAyarCiz() {
    $('sesAyar').hidden = !S.ornekVar();
    $('ornekKullan').checked = D.ornekKullan !== false;
    $('ornekBilgi').textContent = `Kendi sazından ${D.ornekSayisi || 0} ses kaydı var.`;
  }
  $('ornekKullan').addEventListener('change', () => { D.ornekKullan = $('ornekKullan').checked; kaydet(); basilisCal([0, 0, 0], true); });
  $('ornekSil').addEventListener('click', () => {
    const b = $('ornekSil');
    if (!b.dataset.emin) { b.dataset.emin = '1'; b.textContent = 'Emin misin?'; setTimeout(() => { b.dataset.emin = ''; b.textContent = 'Ses kayıtlarını sil'; }, 3000); return; }
    S.orneklerYukle([], 24000); D.ornekSayisi = 0; kaydet();
    depo(st => st.delete('ornekler')).catch(() => {});
    sesAyarCiz(); bildir('Ses kayıtları silindi');
  });
  depo(st => st.get('ornekler')).then(o => { if (o && o.liste) { S.orneklerYukle(o.liste, o.sr); sesAyarCiz(); } }).catch(() => {});
  $('tanitSifirla').addEventListener('click', () => {
    const b = $('tanitSifirla');
    if (!b.dataset.emin) { b.dataset.emin = '1'; b.textContent = 'Emin misin?'; setTimeout(() => { b.dataset.emin = ''; b.textContent = 'Standart düzen'; }, 3000); return; }
    D.perdeler = null; kaydet(); yeniDuzen(); bildir('Standart düzene dönüldü');
  });
  function yeniDuzen() {
    K.ayarla(D.perdeler || null);
    tanitDurumYaz(); tanitListeCiz(D.perdeler || []);
    if (secAkor) akorSec(secAkor);
    soru = null; soruIlk = 0;
    gecisHazirla();
  }
  tanitDurumYaz(); tanitListeCiz(D.perdeler || []);

  // ---------- Başlat ----------
  akorSec(K.akorBul(D.sonAkor) || K.TUM_AKORLAR[0]);
  gecisKaynakDoldur(); gecisHazirla();
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
  document.addEventListener('visibilitychange', () => { if (document.hidden) { akortDurdur(); tanitDurdur(); dinlemeDurdur(); gecisDurdur(); } });
})();
