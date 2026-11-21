// Saz Akorları – ses: tel sentezi (Karplus-Strong), metronom, mikrofon analizi
(function (root) {
  'use strict';
  let ctx = null, ana = null;
  const tampon = new Map();

  // iPhone: sessiz mod düğmesi açıkken Web Audio susar. Ses oturumunu "playback" yap
  // ve sessiz bir <audio> çalarak kilidi aç.
  const SESSIZ = 'data:audio/wav;base64,UklGRsQPAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YaAPAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA';
  let kilitAcik = false, sessizEl = null;
  function kilidiAc() {
    if (kilitAcik) return;
    kilitAcik = true;
    try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) {}
    try {
      sessizEl = new Audio(SESSIZ);
      sessizEl.loop = true; sessizEl.setAttribute('playsinline', '');
      const p = sessizEl.play(); if (p && p.catch) p.catch(() => { kilitAcik = false; });
    } catch (e) { kilitAcik = false; }
    if (ctx) {
      // boş bir tampon çal (eski iOS sürümleri için)
      const b = ctx.createBuffer(1, 1, 22050), k = ctx.createBufferSource();
      k.buffer = b; k.connect(ctx.destination); k.start(0);
    }
  }
  ['touchend', 'pointerup', 'click', 'keydown'].forEach(o =>
    document.addEventListener(o, () => { baglam(); kilidiAc(); }, { capture: true, passive: true }));
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { if (sessizEl) sessizEl.pause(); return; }
    if (sessizEl) { const p = sessizEl.play(); if (p && p.catch) p.catch(() => {}); }
    if (ctx && ctx.state !== 'running') ctx.resume();
  });

  function baglam() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      ctx = new AC();
      ana = ctx.createGain(); ana.gain.value = 0.8;
      const komp = ctx.createDynamicsCompressor();
      ana.connect(komp); komp.connect(ctx.destination);
    }
    if (ctx.state !== 'running') { const r = ctx.resume(); if (r && r.catch) r.catch(() => {}); }
    return ctx;
  }

  // Telli çalgı sesi: metalik, parlak, hızlı sönen
  function telTamponu(f) {
    const anahtar = Math.round(f * 10);
    if (tampon.has(anahtar)) return tampon.get(anahtar);
    const c = baglam(), sr = c.sampleRate, sure = 2.2;
    const N = Math.floor(sr * sure), buf = c.createBuffer(1, N, sr), d = buf.getChannelData(0);
    // Filtre (1-p) örnek gecikme ekler
    const p = 0.62; // >0.5: daha parlak (metalik tel)
    const L = Math.max(2, Math.round(sr / f - (1 - p)));
    const hat = new Float32Array(L);
    let onceki = 0;
    for (let i = 0; i < L; i++) { const r = Math.random() * 2 - 1; hat[i] = 0.75 * r + 0.25 * onceki; onceki = hat[i]; }
    const sonum = Math.pow(0.002, 1 / (sure * f)); // ~sure saniyede sön
    for (let i = 0; i < N; i++) {
      const j = i % L, a = hat[j], b = hat[(j + 1) % L];
      d[i] = a;
      hat[j] = sonum * (p * a + (1 - p) * b);
    }
    // giriş tıkını yumuşat
    for (let i = 0; i < 64 && i < N; i++) d[i] *= i / 64;
    tampon.set(anahtar, buf);
    return buf;
  }

  function nota(f, zaman = 0, ses = 0.35) {
    const c = baglam();
    const t = c.currentTime + zaman;
    const kaynak = c.createBufferSource();
    kaynak.buffer = telTamponu(f);
    const g = c.createGain(); g.gain.value = ses;
    kaynak.connect(g); g.connect(ana);
    kaynak.start(t);
  }

  // Bir saz telini çal: çift tel + bam (oktav pes) varsa
  function sazTeli(f, bam, zaman = 0, ses = 0.3) {
    nota(f, zaman, ses);
    nota(f * 1.0025, zaman + 0.004, ses * 0.8);
    if (bam) nota(f / 2, zaman + 0.002, ses * 0.7);
  }

  // Metronom tıkı
  function tik(zaman, vurgulu) {
    const c = baglam();
    const t = c.currentTime + zaman;
    const o = c.createOscillator(), g = c.createGain();
    o.frequency.value = vurgulu ? 1600 : 1000;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vurgulu ? 0.5 : 0.25, t + 0.002);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
    o.connect(g); g.connect(ana);
    o.start(t); o.stop(t + 0.06);
  }

  function referans(f, sure = 2) {
    const c = baglam(), t = c.currentTime;
    const o = c.createOscillator(), g = c.createGain();
    o.type = 'triangle'; o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.25, t + 0.05);
    g.gain.setValueAtTime(0.25, t + sure - 0.3);
    g.gain.exponentialRampToValueAtTime(0.0001, t + sure);
    o.connect(g); g.connect(ana); o.start(t); o.stop(t + sure);
  }

  // ---- Mikrofon ----
  let mik = null;
  async function mikrofonAc() {
    if (mik) return mik;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error('Bu tarayıcı mikrofonu desteklemiyor.');
    const c = baglam();
    const akim = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
    const kaynak = c.createMediaStreamSource(akim);
    const analiz = c.createAnalyser();
    analiz.fftSize = 8192; analiz.smoothingTimeConstant = 0.6;
    kaynak.connect(analiz);
    mik = { akim, kaynak, analiz, zaman: new Float32Array(analiz.fftSize), frek: new Float32Array(analiz.frequencyBinCount) };
    return mik;
  }
  // ---- Ham ses kaydı (Sazımı tanıt sırasında) ----
  let kayit = null;
  function kayitBasla() {
    if (!mik) return;
    const c = ctx, isl = c.createScriptProcessor(4096, 1, 1), sifir = c.createGain();
    sifir.gain.value = 0;
    kayit = { parcalar: [], uzunluk: 0, isl, sifir, sr: c.sampleRate };
    isl.onaudioprocess = e => {
      if (!kayit) return;
      const d = e.inputBuffer.getChannelData(0);
      // 2'ye indir (yarı örnekleme hızı) – bellek için
      const y = new Float32Array(d.length >> 1);
      for (let i = 0; i < y.length; i++) y[i] = 0.5 * (d[2 * i] + d[2 * i + 1]);
      kayit.parcalar.push(y); kayit.uzunluk += y.length;
      if (kayit.uzunluk > kayit.sr / 2 * 300) { const at = kayit.parcalar.shift().length; kayit.uzunluk -= at; kayit.atilan = (kayit.atilan || 0) + at; }
    };
    mik.kaynak.connect(isl); isl.connect(sifir); sifir.connect(c.destination);
  }
  function kayitKonum() { return kayit ? kayit.uzunluk + (kayit.atilan || 0) : 0; }
  function kayitBitir() {
    if (!kayit) return null;
    try { mik && mik.kaynak.disconnect(kayit.isl); } catch (e) {}
    try { kayit.isl.disconnect(); kayit.sifir.disconnect(); } catch (e) {}
    const tum = new Float32Array(kayit.uzunluk); let o = 0;
    for (const p of kayit.parcalar) { tum.set(p, o); o += p.length; }
    const sonuc = { veri: tum, sr: kayit.sr / 2 };
    kayit = null;
    return sonuc;
  }

  // ---- Kendi saz sesinden örnekler ----
  let ornekler = []; // {tel, perde, f, buf}
  function orneklerYukle(liste, sr) {
    const c = baglam();
    ornekler = (liste || []).map(o => {
      const veri = o.veri instanceof Float32Array ? o.veri : Float32Array.from(o.veri);
      const b = c.createBuffer(1, veri.length, sr); b.getChannelData(0).set(veri);
      return { tel: o.tel, perde: o.perde, f: o.f, buf: b };
    });
    return ornekler.length;
  }
  function ornekVar() { return ornekler.length > 0; }
  function ornekCal(tel, perde, f, zaman = 0, ses = 0.6) {
    if (!ornekler.length) return false;
    let en = null, enP = 1e9;
    for (const o of ornekler) {
      const fark = Math.abs(1200 * Math.log2(f / o.f));
      let p = fark;
      if (o.tel === tel && o.perde === perde) p = -1;
      else if (o.tel !== tel) p += 150; // aynı telin sesini tercih et
      if (p < enP) { enP = p; en = o; }
    }
    const c = baglam(), t = c.currentTime + zaman;
    const k = c.createBufferSource(); k.buffer = en.buf;
    k.playbackRate.value = f / en.f;
    const g = c.createGain(); g.gain.value = ses;
    k.connect(g); g.connect(ana); k.start(t);
    return true;
  }

  function mikrofonKapat() {
    if (kayit) kayitBitir();
    if (!mik) return;
    mik.akim.getTracks().forEach(t => t.stop());
    try { mik.kaynak.disconnect(); } catch (e) {}
    mik = null;
  }

  // Ses yüksekliği tespiti (otokorelasyon + parabolik ara değer)
  function perdeBul() {
    if (!mik) return null;
    const x = mik.zaman; mik.analiz.getFloatTimeDomainData(x);
    const n = 4096; // son 4096 örnek yeter
    const bas = x.length - n;
    let rms = 0; for (let i = bas; i < x.length; i++) rms += x[i] * x[i];
    rms = Math.sqrt(rms / n);
    if (rms < 0.008) return { rms, f: null };
    const sr = ctx.sampleRate, minL = Math.floor(sr / 1200), maxL = Math.floor(sr / 65);
    const r = new Float32Array(maxL + 2);
    for (let l = minL; l <= maxL + 1; l++) {
      let s = 0; for (let i = bas; i < x.length - l; i++) s += x[i] * x[i + l];
      r[l] = s;
    }
    let r0 = 0; for (let i = bas; i < x.length; i++) r0 += x[i] * x[i];
    // ilk güçlü tepeyi seç (oktav hatasını azaltır)
    let enIyi = -1, enDeger = 0;
    for (let l = minL + 1; l <= maxL; l++) if (r[l] > enDeger) { enDeger = r[l]; enIyi = l; }
    if (enIyi < 0 || enDeger / r0 < 0.3) return { rms, f: null };
    for (let l = minL + 1; l <= maxL; l++) {
      if (r[l] > r[l - 1] && r[l] >= r[l + 1] && r[l] > 0.88 * enDeger) { enIyi = l; break; }
    }
    const a = r[enIyi - 1], b = r[enIyi], c2 = r[enIyi + 1];
    const kay = (a - c2) / (2 * (a - 2 * b + c2)) || 0;
    return { rms, f: sr / (enIyi + kay), netlik: enDeger / r0 };
  }

  // 12 sesli kroma (notasyona göre: ahenk düşülür)
  function kroma(ahenk = 0) {
    if (!mik) return null;
    const fr = mik.frek; mik.analiz.getFloatFrequencyData(fr);
    const sr = ctx.sampleRate, bin = sr / mik.analiz.fftSize;
    const k = new Float32Array(12); let toplam = 0;
    for (let i = Math.floor(110 / bin); i < Math.min(fr.length, Math.floor(2000 / bin)); i++) {
      const db = fr[i]; if (db < -85) continue;
      // yerel tepe olmayanları atla
      if (!(fr[i] >= fr[i - 1] && fr[i] >= fr[i + 1])) continue;
      const m = Math.pow(10, db / 20);
      const midi = 69 + 12 * Math.log2(i * bin / 440) - ahenk;
      const pc = ((Math.round(midi) % 12) + 12) % 12;
      const w = m * m * (i * bin < 700 ? 1 : 0.6);
      k[pc] += w; toplam += w;
    }
    let mx = 0; for (const v of k) mx = Math.max(mx, v);
    if (mx > 0) for (let i = 0; i < 12; i++) k[i] /= mx;
    return { k, guc: toplam };
  }

  root.Ses = { baglam, nota, sazTeli, tik, referans, mikrofonAc, mikrofonKapat, perdeBul, kroma,
    kayitBasla, kayitKonum, kayitBitir, orneklerYukle, ornekVar, ornekCal, simdi: () => baglam().currentTime };
})(this);
