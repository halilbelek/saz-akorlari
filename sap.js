// Gerçekçi dikey bağlama sapı (SVG). Burgu üstte, gövde altta; soldan sağa: üst, orta, alt tel.
(function (root) {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  let sayac = 0;

  function el(ad, oz, eb) {
    const e = document.createElementNS(NS, ad);
    for (const k in oz) e.setAttribute(k, oz[k]);
    if (eb) eb.appendChild(e);
    return e;
  }

  // s: { K (Kuram), basilis:[ü,o,a] (null = yok), ilk, son, isaret:{yanlis:[]}, secim, etiket, tikla(tel,perde), yukseklik }
  function ciz(svg, s) {
    const K = s.K;
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    const id = 'sp' + (++sayac);
    const ilk = s.ilk || 0, son = s.son;
    const W = 300, burgu = ilk === 0 ? 120 : 26, H = s.yukseklik || 620, alt = 30;
    const top = burgu;
    svg.setAttribute('viewBox', `0 0 ${W} ${top + H + alt}`);
    const cx = W / 2;
    const poz = c => 1 - Math.pow(2, -c / 1200);
    const y = c => top + (poz(c) - poz(K.PERDELER[ilk])) / (poz(K.PERDELER[son] + 40) - poz(K.PERDELER[ilk])) * H;
    // sap genişliği: eşikte dar, aşağı doğru açılır (gerçek kısa sap ~ 3.6 → 4.4 cm)
    const genislik = yy => 118 + 26 * ((yy - top) / H) + (ilk > 0 ? 8 : 0);
    const kenar = yy => [cx - genislik(yy) / 2, cx + genislik(yy) / 2];

    const defs = el('defs', {}, svg);
    const dur = (gid, stops, oz) => { const g = el('linearGradient', Object.assign({ id: id + gid }, oz || { x1: '0', x2: '1', y1: '0', y2: '0' }), defs);
      stops.forEach(([o, c, a]) => el('stop', { offset: o, 'stop-color': c, 'stop-opacity': a == null ? 1 : a }, g)); return g; };
    // Sedef parıltısı: dalgalı, yanardöner desen
    const f = el('filter', { id: id + 'sf', x: '0', y: '0', width: '1', height: '1' }, defs);
    el('feTurbulence', { type: 'turbulence', baseFrequency: '0.016 0.045', numOctaves: '3', seed: String(7 + ilk), result: 'n' }, f);
    el('feColorMatrix', { in: 'n', type: 'matrix', values: '2.2 0 0 0 0.2  0 2.4 0 0 0.3  0 0 2.6 0 0.25  0 0 0 0 0.6', result: 'r' }, f);
    el('feComposite', { in: 'r', in2: 'SourceGraphic', operator: 'in' }, f);
    // Sapın yuvarlaklığı (kenarlar hafif koyu, ortada parlama)
    dur('yu', [['0', '#3a2a18', .5], ['.1', '#000', .08], ['.42', '#fff', .18], ['.5', '#fff', .28], ['.58', '#fff', .1], ['.9', '#000', .1], ['1', '#3a2a18', .5]]);
    // Kenar şeridi (açık ahşap)
    dur('ks', [['0', '#8a6a44'], ['.5', '#d8b98a'], ['1', '#7a5a36']]);
    // Burgu kutusu: açık, hafif saydam görünüm
    dur('bk', [['0', '#cfc6b8'], ['.5', '#f1ece3'], ['1', '#bdb3a4']]);
    dur('es', [['0', '#fbf4e2'], ['.6', '#e6d6b3'], ['1', '#b9a57d']], { x1: '0', x2: '0', y1: '0', y2: '1' });
    // Siyah perde bağı
    dur('pb', [['0', '#5a5a5a'], ['.35', '#222'], ['1', '#050505']], { x1: '0', x2: '0', y1: '0', y2: '1' });
    dur('ct', [['0', '#8a9098'], ['.45', '#ffffff'], ['1', '#9aa0a7']]);
    const pt = el('pattern', { id: id + 'bm', width: '3', height: '2', patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(-35)' }, defs);
    el('rect', { width: 3, height: 2, fill: '#c8b48c' }, pt);
    el('rect', { width: 3, height: 0.8, fill: '#8a7550' }, pt);
    const gl = el('filter', { id: id + 'gl', x: '-20%', y: '-5%', width: '140%', height: '115%' }, defs);
    el('feDropShadow', { dx: '2', dy: '4', stdDeviation: '6', 'flood-color': '#3a2a18', 'flood-opacity': '.35' }, gl);
    const gk = el('filter', { id: id + 'gk', x: '-50%', y: '-50%', width: '200%', height: '200%' }, defs);
    el('feDropShadow', { dx: '1', dy: '1.6', stdDeviation: '1.1', 'flood-color': '#000', 'flood-opacity': '.45' }, gk);
    const rad = (gid, renk) => { const g = el('radialGradient', { id: id + gid, cx: '.38', cy: '.32', r: '.75' }, defs);
      renk.forEach(([o, c]) => el('stop', { offset: o, 'stop-color': c }, g)); };
    rad('nk', [['0', '#57d39a'], ['.55', '#1f9a64'], ['1', '#0b5a39']]);
    rad('ny', [['0', '#ff9c8f'], ['.55', '#d0453a'], ['1', '#7d1d16']]);
    rad('ns', [['0', '#ffcf8a'], ['.55', '#d98a1c'], ['1', '#7a4508']]);

    // Burgu kutusu ve burgular (siyah tutamaklı)
    if (ilk === 0) {
      const [l0, r0] = kenar(top);
      const yol = `M${l0 - 2},${top} L${l0 - 8},10 L${r0 + 8},10 L${r0 + 2},${top} Z`;
      el('path', { d: yol, fill: `url(#${id}bk)`, filter: `url(#${id}gl)` }, svg);
      el('path', { d: yol, fill: 'none', stroke: '#a99c88', 'stroke-width': 1 }, svg);
      const burgu = (x, yy, yon) => {
        el('rect', { x: yon < 0 ? x - 16 : x, y: yy - 5, width: 16, height: 10, rx: 2, fill: '#9a9a9a' }, svg);
        el('rect', { x: yon < 0 ? x - 18 : x + 12, y: yy - 6, width: 6, height: 12, rx: 1.5, fill: '#cfcfcf' }, svg);
        el('rect', { x: yon < 0 ? x - 46 : x + 18, y: yy - 13, width: 28, height: 26, rx: 9, fill: '#1b1b1b', filter: `url(#${id}gk)` }, svg);
        el('rect', { x: yon < 0 ? x - 42 : x + 22, y: yy - 10, width: 8, height: 8, rx: 3, fill: '#fff', opacity: .12 }, svg);
      };
      [26, 52, 78].forEach(yy => burgu(l0 - 6, yy, -1));
      [38, 64, 90].forEach(yy => burgu(r0 + 6, yy, 1));
    }
    // Sap: kenar şeritleri + sedef klavye
    const [l1, r1] = kenar(top), [l2, r2] = kenar(top + H + alt);
    const disYol = `M${l1 - 4},${top - 2} L${r1 + 4},${top - 2} L${r2 + 4},${top + H + alt} L${l2 - 4},${top + H + alt} Z`;
    el('path', { d: disYol, fill: `url(#${id}ks)`, filter: `url(#${id}gl)` }, svg);
    const ic = (dx) => `M${l1 + dx},${top - 2} L${r1 - dx},${top - 2} L${r2 - dx},${top + H + alt} L${l2 + dx},${top + H + alt} Z`;
    el('path', { d: ic(3), fill: '#e7e2d6' }, svg);
    // Sedef karolar: her perde aralığında birkaç parça, pastel yanardöner tonlar
    const tonlar = ['#cfe3d2', '#d9c9e6', '#ecd3d8', '#c6dccf', '#e6dcc2', '#d3d6ea', '#b9cbbd'];
    let tohum = 11;
    const rnd = () => (tohum = (tohum * 9301 + 49297) % 233280) / 233280;
    const sinirlar = [top - 2];
    for (let p = ilk + 1; p <= son; p++) sinirlar.push(y(K.PERDELER[p]));
    sinirlar.push(top + H + alt);
    for (let k = 0; k < sinirlar.length - 1; k++) {
      let y1 = sinirlar[k];
      const y2 = sinirlar[k + 1];
      const parca = y2 - y1 > 60 ? 2 : 1;
      for (let j = 0; j < parca; j++) {
        const ya = y1 + (y2 - y1) * j / parca, yb = y1 + (y2 - y1) * (j + 1) / parca;
        const [a1, b1] = kenar(ya), [a2, b2] = kenar(yb);
        const d = `M${a1 + 3},${ya} L${b1 - 3},${ya} L${b2 - 3},${yb} L${a2 + 3},${yb} Z`;
        el('path', { d, fill: tonlar[Math.floor(rnd() * tonlar.length)] }, svg);
        el('path', { d, fill: '#fff', filter: `url(#${id}sf)`, opacity: .45 + rnd() * .35 }, svg);
        el('line', { x1: a1 + 3, x2: b1 - 3, y1: ya, y2: ya, stroke: '#b8ab95', 'stroke-width': .6, opacity: .7 }, svg);
      }
    }
    el('path', { d: ic(3), fill: `url(#${id}yu)` }, svg);
    // Eşik
    if (ilk === 0) el('rect', { x: l1 - 5, y: top - 7, width: r1 - l1 + 10, height: 8, rx: 2, fill: `url(#${id}es)`, filter: `url(#${id}gk)` }, svg);
    // Siyah perde bağları (sapın etrafına sarılı)
    for (let p = ilk + 1; p <= son; p++) {
      const b = K.perdeBilgi(p), yy = y(b.sent), [a, c] = kenar(yy);
      el('rect', { x: a - 5, y: yy - 2.4, width: c - a + 10, height: 4.8, rx: 2.4, fill: `url(#${id}pb)`, filter: `url(#${id}gk)` }, svg);
      el('line', { x1: a - 3, x2: c + 3, y1: yy - 1.3, y2: yy - 1.3, stroke: '#fff', 'stroke-width': .5, opacity: .35 }, svg);
      const t = el('text', { x: a - 14, y: yy + 4, 'text-anchor': 'end', class: 'pno' + (b.koma ? ' koma' : '') }, svg);
      t.textContent = p;
    }
    // Teller: [üst: çelik+bam], [orta: 2 çelik], [alt: bam+2 çelik]
    const telX = (t, yy) => { const [a, c] = kenar(yy); return a + (c - a) * (0.2 + 0.3 * t); };
    const gruplar = [[['c', -4], ['b', 4]], [['c', -3.5], ['c', 3.5]], [['b', -6], ['c', 0], ['c', 6]]];
    const ySon = top + H + alt;
    gruplar.forEach((gr, t) => gr.forEach(([tur, d]) => {
      const xa = telX(t, top) + d * 0.85, xb = telX(t, ySon) + d;
      const ust = ilk === 0 ? top - 4 : 0;
      const w = tur === 'b' ? 2.2 : 1.1;
      el('line', { x1: xa + 1.4, y1: ust, x2: xb + 1.4, y2: ySon, stroke: '#3a3020', 'stroke-width': w, opacity: .25 }, svg);
      el('line', { x1: xa, y1: ust, x2: xb, y2: ySon, stroke: tur === 'b' ? `url(#${id}bm)` : `url(#${id}ct)`, 'stroke-width': w }, svg);
      if (ilk === 0) el('line', { x1: xa, y1: ust, x2: cx + (xa - cx) * 1.25, y2: 22 + t * 24, stroke: tur === 'b' ? '#b9a57a' : '#d6dade', 'stroke-width': w * 0.7, opacity: .9 }, svg);
    }));
    // Basılı noktalar
    const nokY = p => {
      const y1 = y(K.PERDELER[p - 1]), y2 = y(K.PERDELER[p]);
      return y2 - y1 < 34 ? y2 - Math.min(13, (y2 - y1) / 2 + 5) : y2 - 17;
    };
    (s.basilis || []).forEach((p, i) => {
      if (p == null) return;
      const yanlis = s.isaret && s.isaret.yanlis && s.isaret.yanlis.includes(i);
      const dolgu = yanlis ? 'ny' : s.secim ? 'ns' : 'nk';
      const nota = K.perdeNota(K.DUZEN.teller[i].nota, p);
      const ad = nota == null ? 'koma' : K.NOTA[nota];
      if (p === 0) {
        const yy = ilk === 0 ? top - 26 : top - 6, xx = telX(i, top);
        if (ilk === 0) {
          el('circle', { cx: xx, cy: yy, r: 15, fill: '#fffaf0', stroke: yanlis ? '#d0453a' : s.secim ? '#b06a2a' : '#1f9a64', 'stroke-width': 3, filter: `url(#${id}gk)` }, svg);
          if (s.etiket !== false) { const t = el('text', { x: xx, y: yy + 4.5, 'text-anchor': 'middle', class: 'bosyazi' }, svg); t.textContent = ad; }
        }
      } else if (p > ilk && p <= son) {
        const yy = nokY(p), xx = telX(i, yy);
        el('circle', { cx: xx, cy: yy, r: 17, fill: `url(#${id}${dolgu})`, stroke: 'rgba(255,255,255,.55)', 'stroke-width': 1.5, filter: `url(#${id}gk)` }, svg);
        if (s.etiket !== false) { const t = el('text', { x: xx, y: yy + 5, 'text-anchor': 'middle', class: 'nyazi' }, svg); t.textContent = ad; }
      } else {
        const t = el('text', { x: telX(i, top + 20), y: p > son ? top + H + 20 : top + 16, 'text-anchor': 'middle', class: 'pno ok' }, svg);
        t.textContent = (p > son ? '▼ ' : '▲ ') + p;
      }
    });
    // Tel adları (altta)
    K.DUZEN.teller.forEach((t, i) => {
      const e = el('text', { x: telX(i, top + H + alt), y: top + H + alt - 6, 'text-anchor': 'middle', class: 'tad' }, svg);
      e.textContent = t.ad;
    });
    // Dokunma
    if (s.tikla) {
      const r = el('rect', { x: 0, y: 0, width: W, height: top + H + alt, fill: 'transparent' }, svg);
      r.addEventListener('pointerdown', ev => {
        const pt = svg.createSVGPoint(); pt.x = ev.clientX; pt.y = ev.clientY;
        const q = pt.matrixTransform(svg.getScreenCTM().inverse());
        let tel = 0, m = 1e9;
        for (let i = 0; i < 3; i++) { const d = Math.abs(q.x - telX(i, q.y)); if (d < m) { m = d; tel = i; } }
        let perde;
        if (q.y < top) perde = ilk === 0 ? 0 : null;
        else { let en = 1e9; for (let p = ilk + 1; p <= son; p++) { const d = Math.abs(q.y - nokY(p)); if (d < en) { en = d; perde = p; } } }
        if (perde != null) s.tikla(tel, perde);
      });
    }
  }
  root.GercekSap = { ciz };
})(this);
