// Gera os ícones PNG do app a partir do desenho do logo (duas setas em ciclo), com o Edge.
const { chromium } = require('playwright');
const path = require('path');
const destino = process.argv[2];
const setas = (cor) => `
  <path d="M12.68 26.82 A20 20 0 0 1 51.32 26.82" stroke="${cor}" stroke-width="7" stroke-linecap="round" fill="none"/>
  <polygon points="57.6,25.1 45.0,28.5 53.4,35.0" fill="${cor}"/>
  <path d="M51.32 37.18 A20 20 0 0 1 12.68 37.18" stroke="${cor}" stroke-width="7" stroke-linecap="round" fill="none"/>
  <polygon points="6.4,38.9 19.0,35.5 10.6,29.0" fill="${cor}"/>`;
// "any": quadrado de cantos arredondados; "maskable": fundo cheio e logo menor (zona segura de 80%)
const svgAny = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#17673f"/><g transform="translate(6.4 6.4) scale(0.8)">${setas('#ffffff')}</g></svg>`;
const svgMask = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#17673f"/><g transform="translate(14.08 14.08) scale(0.56)">${setas('#ffffff')}</g></svg>`;
(async () => {
  const b = await chromium.launch({ channel: 'msedge' });
  for (const [nome, svg, tam, transp] of [['icone-192.png', svgAny, 192, true], ['icone-512.png', svgAny, 512, true], ['icone-maskable-512.png', svgMask, 512, false], ['apple-touch-icon.png', svgMask, 180, false]]) {
    const p = await b.newPage({ viewport: { width: tam, height: tam } });
    await p.setContent(`<html><body style="margin:0;background:transparent">${svg.replace('<svg ', `<svg width="${tam}" height="${tam}" `)}</body></html>`);
    await p.screenshot({ path: path.join(destino, nome), omitBackground: transp });
    await p.close();
  }
  await b.close();
})();
