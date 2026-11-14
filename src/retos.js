// Los retos de la semana: cada 7 días, tres encargos al azar que se miden solos (lo vencido, lo minado, lo pescado…). Cada uno paga
// colones, y los tres juntos, esencia de sombra. Sirven para tener qué hacer también después de terminar la historia.
import { anotar } from './diario.js';

const COLON = 360, ESENCIA = 499, xp = (g, k) => (g.meta.skills && g.meta.skills[k]) || 0;
const CATALOGO = [
  { k: 'bajas', t: (n) => `Venza a ${n} enemigos`, m: (g) => g.meta.bajas || 0, n: 12 },
  { k: 'nidos', t: (n) => `Parta ${n === 1 ? 'un nido' : `${n} nidos`} de Sombra`, m: (g) => g.meta.nidosRotos || 0, n: 1, si: (g) => (g.day || 1) >= 7 },
  { k: 'mineria', t: (n) => `Saque ${n} puntos de minería`, m: (g) => xp(g, 'mineria'), n: 40 },
  { k: 'tala', t: (n) => `Saque ${n} puntos de tala`, m: (g) => xp(g, 'tala'), n: 40 },
  { k: 'pesca', t: (n) => `Saque ${n} puntos de pesca`, m: (g) => xp(g, 'pesca'), n: 20 },
  { k: 'agricultura', t: (n) => `Saque ${n} puntos de agricultura`, m: (g) => xp(g, 'agricultura'), n: 30 },
  { k: 'cocina', t: (n) => `Saque ${n} puntos de cocina`, m: (g) => xp(g, 'cocina'), n: 16 },
  { k: 'exploracion', t: (n) => `Saque ${n} puntos de exploración`, m: (g) => xp(g, 'exploracion'), n: 20 },
  { k: 'apuros', t: () => 'Ayude a defender la plaza de un pueblo', m: (g) => g.meta.apuros || 0, n: 1, si: (g) => (g.day || 1) >= 6 },
  { k: 'asedios', t: () => 'Defienda la casa en un asedio', m: (g) => (g.meta.hist && g.meta.hist.asedios) || 0, n: 1, si: (g) => g.meta.hist && g.meta.hist.hogar && (g.day || 1) >= 5 },
];
const porClave = (k) => CATALOGO.find((c) => c.k === k);
function nuevos(g, semana) {
  const sirven = CATALOGO.filter((c) => !c.si || c.si(g)).sort(() => Math.random() - 0.5).slice(0, 3);
  const escala = 1 + Math.min(3, semana) * 0.5; // las primeras semanas piden menos
  return sirven.map((c) => {
    const n = c.n <= 1 ? 1 : Math.round(c.n * escala);
    return { k: c.k, n, base: c.m(g), hecho: false };
  });
}
const premio = (semana) => 15 + Math.min(10, semana) * 5;
// cada segundo
export function tickRetos(g) {
  if (g.mode !== 'survival' || !g.meta || (g.day || 1) < 2) return;
  const semana = Math.floor(((g.day || 1) - 1) / 7);
  let R = g.meta.retos;
  if (!R || R.semana !== semana) {
    R = g.meta.retos = { semana, lista: nuevos(g, semana), pagado: false };
    g.ui.toast('📋 Hay retos nuevos esta semana: los ve con la J', 3400);
    return;
  }
  for (const r of R.lista) {
    const c = porClave(r.k);
    if (r.hecho || !c || c.m(g) - r.base < r.n) continue;
    r.hecho = true;
    const col = premio(semana);
    g.giveItem(COLON, col);
    g.audio.play('nivel', { ui: true, vol: 0.4 });
    g.ui.toast(`📋 ✔ ${c.t(r.n)}: ${col} colones`, 3600);
    g.achieve('reto', 'Reto cumplido');
  }
  if (!R.pagado && R.lista.length && R.lista.every((r) => r.hecho)) {
    R.pagado = true;
    g.meta.semanas = (g.meta.semanas || 0) + 1;
    g.giveItem(ESENCIA, 2);
    g.audio.play('aplausos', { ui: true, vol: 0.5 });
    g.ui.regionBanner('¡Semana completa!', 'Tres retos cumplidos: 2 de esencia de sombra');
    if (g.meta.semanas >= 4) g.achieve('semanas4', 'Cuatro semanas completas');
    anotar(g, 'Cumplí todos los retos de la semana.', '📋');
  }
}
export function retosHTML(g) {
  const R = g.meta && g.meta.retos;
  if (!R || g.mode !== 'survival') return '';
  const filas = R.lista.map((r) => {
    const c = porClave(r.k);
    if (!c) return '';
    const v = Math.min(r.n, c.m(g) - r.base);
    return `<small>${r.hecho ? '✔' : '✘'} ${c.t(r.n)}${r.n > 1 && !r.hecho ? ` (${v}/${r.n})` : ''}</small>`;
  }).join('');
  const dias = 7 - (((g.day || 1) - 1) % 7);
  return `<div class="prog-casa"><b>📋 Retos de la semana</b><span>${R.pagado ? 'Semana completa' : `Cada uno paga ${premio(R.semana)} colones, y los tres juntos, 2 de esencia. Quedan ${dias} ${dias === 1 ? 'día' : 'días'}`}</span>${filas}</div>`;
}
