// Defender la casa: cada tantas noches las Sombras vienen por la casa arreglada (y golpean la puerta hasta tumbarla), y el
// cencerro avisa cuando algo se acerca. Es lo que le da sentido a las estacas, la luz, las paredes y tener comida guardada.
import { BLOCKS, BLOCK_BY_KEY as K, AIR, SOLID } from './blocks.js';
import { anotar } from './diario.js';
import { ventaja } from './progreso.js';
import { difOf } from './supervivencia.js';
import { nidosVivos } from './nidos.js';
import { casa } from './hogar.js';

const ANCHO = 9, FONDO = 7, CADA = 5; // cada cuántos días hay asedio
const cercaCasa = (g, H, r) => { const p = g.player.body.pos; return Math.hypot(H.casa.x + ANCHO / 2 - p.x, H.casa.z + FONDO / 2 - p.z) < r; };
export const hayAsedioHoy = (g) => (g.day || 1) >= CADA && (g.day || 1) % CADA === 0;

function soltar(g, H, A) {
  const cx = H.casa.x + ANCHO / 2, cz = H.casa.z + FONDO / 2, dia = g.day || 1;
  const n = Math.max(2, Math.min(9, 3 + Math.floor(dia / CADA) + A.ola) + nidosVivos(g) - casa.menosAsedio(g)); // cada nido vivo manda una más; la casa de todos, dos menos
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + Math.random(), r = 14 + i * 2.5 + Math.random() * 2; // van llegando de a poco, no todas de golpe
    const q = puestoSombra(g, cx, cz, H.casa.y + 1, a, r);
    if (!q) continue;
    const { x, y, z } = q;
    const tipo = dia >= 10 && i % 4 === 1 ? 'sombra_escudo' : dia >= 5 && i % 4 === 3 ? 'sombra_hondera' : 'sombra';
    const m = g.entities.spawnMob(tipo, x + 0.5, y + 0.2, z + 0.5);
    m.data.asedio = true; m.data.provoked = true;
    m.health += Math.min(10, Math.floor(dia / 3)); // con los días vienen más duras, igual que las de cada noche
    g.particles.burst(x + 0.5, y + 1, z + 0.5, [[0.05, 0.02, 0.1], [0.3, 0.12, 0.4]], 12, 1.8);
    A.mobs.push(m);
  }
  A.peleaT = 0; A.nOla = A.mobs.length; A.bajas = 0;
  g.audio.play('sombra', { ui: true, vol: 0.7 });
}
export function sueloCerca(w, x, z, y0) {
  for (let d = 0; d <= 14; d++) for (const y of d ? [y0 + d, y0 - d] : [y0]) {
    if (SOLID[w.getBlock(x, y - 1, z)] && !SOLID[w.getBlock(x, y, z)] && !SOLID[w.getBlock(x, y + 1, z)]) return y;
  }
  return null;
}
// busca dónde poner una Sombra alrededor de un centro; si el terreno no da, cerca de uno
export function puestoSombra(g, cx, cz, y0, a, r) {
  const w = g.world;
  for (let k = 0; k < 6; k++) {
    const an = a + k * 1.05, x = Math.floor(cx + Math.cos(an) * r), z = Math.floor(cz + Math.sin(an) * r);
    if (!w.isLoaded(x, z)) continue;
    const y = sueloCerca(w, x, z, y0);
    if (y != null) return { x, y, z };
  }
  const p = g.player.body.pos;
  for (let k = 0; k < 8; k++) {
    const an = a + k * 0.8, x = Math.floor(p.x + Math.cos(an) * 8), z = Math.floor(p.z + Math.sin(an) * 8);
    if (!w.isLoaded(x, z)) continue;
    const y = sueloCerca(w, x, z, Math.floor(p.y));
    if (y != null) return { x, y, z };
  }
  return null;
}
// lleva la cuenta de las vencidas: una oleada que se fue sola (uno lejos o encerrado) no se paga
export function contarBajas(W) {
  W.mobs = W.mobs.filter((m) => {
    if (!m.dead && !m.dying) return true;
    if (m.dying) W.bajas = (W.bajas || 0) + 1;
    return false;
  });
}
export const olaGanada = (W) => (W.bajas || 0) >= Math.ceil((W.nOla || 1) / 3); // un tercio: en terreno quebrado alguna se queda atorada
// una Sombra que se cayó a una cueva o se quedó atorada no puede dejar la pelea colgada: las que se alejan o tardan demasiado
// se van, y la Madre, que tiene que estar, vuelve al patio
export function rezagadas(g, H, W, tope = 80) {
  W.peleaT = (W.peleaT || 0) + 1;
  const cx = H.casa.x + ANCHO / 2, cz = H.casa.z + FONDO / 2, p = g.player.body.pos;
  for (const m of W.mobs) {
    const b = m.body.pos;
    // lejos de uno, no de la casa: las que lo persiguen hasta el potrero siguen en la pelea
    const lejos = Math.hypot(b.x - p.x, b.z - p.z) > 50 || Math.abs(b.y - p.y) > 16;
    if (m.type === 'sombra_madre') { if (Math.hypot(b.x - cx, b.z - cz) > 44 || Math.abs(b.y - H.casa.y) > 14) { b.x = cx; b.z = cz + FONDO; b.y = H.casa.y + 2; m.body.vel.y = 0; } continue; }
    if ((lejos || W.peleaT >= tope) && !m.data.irse) m.data.irse = lejos ? 0.5 : 2;
    subirse(g, m);
  }
}
// subirse a un pilar no salva a nadie: la Sombra que no alcanza se pasa por lo oscuro hasta donde uno está
function subirse(g, m) {
  const w = g.world, p = g.player.body.pos, b = m.body.pos;
  if (Math.hypot(p.x - b.x, p.z - b.z) > 12 || p.y - b.y < 2.2) { m.data.varada = 0; return; }
  m.data.varada = (m.data.varada || 0) + 1;
  if (m.data.varada < 7) return;
  m.data.varada = 0;
  const py = Math.floor(p.y);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.random(), x = Math.floor(p.x + Math.cos(a) * 1.8), z = Math.floor(p.z + Math.sin(a) * 1.8);
    if (!SOLID[w.getBlock(x, py - 1, z)] || SOLID[w.getBlock(x, py, z)] || SOLID[w.getBlock(x, py + 1, z)]) continue;
    g.particles.burst(b.x, b.y + 1, b.z, [[0.05, 0.02, 0.1], [0.3, 0.12, 0.4]], 10, 1.6);
    Object.assign(b, { x: x + 0.5, y: py + 0.05, z: z + 0.5 });
    g.particles.burst(b.x, b.y + 1, b.z, [[0.05, 0.02, 0.1], [0.3, 0.12, 0.4]], 10, 1.6);
    g.audio.play('sombra', { pos: b, vol: 0.5 });
    return;
  }
}
// cada segundo
export function tickAsedio(g) {
  if (g.mode !== 'survival' || g.dim !== 'tierra' || !difOf(g).hostiles) return; // en modo Tranquilo no hay asedios
  const H = g.meta.hist;
  if (!H || !H.hogar || !H.casa || g.nocheLarga || g.ceniza) return;
  let A = g.asedio;
  const dia = g.day || 1, t = g.time || 0;
  if (!A) {
    if (!hayAsedioHoy(g) || H.asedioDia === dia) return;
    // el aviso, en la tarde, para que dé tiempo de prepararse (uno decide si va o no)
    if (t > 0.38 && t < 0.5 && H.asedioAviso !== dia) {
      H.asedioAviso = dia;
      const nv = nidosVivos(g);
      g.ui.toast(`🌑 Esta noche las Sombras vienen por la casa de la abuela. Prepare defensas (o no vaya: se la dejan en paz)${nv ? `. Con ${nv} ${nv === 1 ? 'nido vivo' : 'nidos vivos'}, vienen más` : ''}`, 5000);
    }
    if (g.daylight > 0.3 || t < 0.5 || !cercaCasa(g, H, 34) || !g.player.alive) return;
    H.asedioDia = dia;
    A = g.asedio = { ola: 0, t: 4, fase: 'espera', mobs: [], puertas: new Map() };
    g.ui.regionBanner('¡Asedio!', 'Vienen por la casa');
    g.audio.play('rumble', { ui: true, vol: 0.6 });
    return;
  }
  // termina al amanecer o si uno se va o se muere (sin premio)
  // la hora y no la luz: el destello de un rayo subía la luz y cancelaba el asedio sin premio
  if ((t > 0.03 && t < 0.4) || !g.player.alive || !cercaCasa(g, H, 80)) {
    for (const m of A.mobs) if (!m.dead && m.data.asedio) m.data.irse = 2;
    g.asedio = null;
    if (g.player.alive) g.ui.toast('🌅 Las Sombras se retiraron', 2200);
    return;
  }
  contarBajas(A);
  golpearPuertas(g, H, A);
  if (A.fase === 'espera') { A.t -= 1; if (A.t <= 0) { soltar(g, H, A); A.fase = 'pelea'; } return; }
  if (A.mobs.length) { rezagadas(g, H, A); return; }
  if (!olaGanada(A)) { g.asedio = null; g.ui.toast('🌑 Las Sombras se fueron sin pelea. Esta vez no hay de qué hablar en el pueblo', 3200); return; }
  A.ola++;
  const olas = dia >= 15 ? 3 : 2;
  if (A.ola >= olas) {
    const premio = ventaja.premio(g, 12 + dia * 2);
    g.giveItem(360, premio); g.addXP(20 + dia);
    g.audio.play('aplausos', { ui: true, vol: 0.5 });
    g.ui.toast(`🏡 ¡Defendió la casa! Los vecinos se enteraron: ${premio} colones`, 3600);
    g.achieve('asedio', 'Defendí la casa');
    H.asedios = (H.asedios || 0) + 1;
    if (H.asedios >= 5) g.achieve('asedio5', 'A esta casa no entra nadie');
    anotar(g, 'Defendí la casa de un asedio de Sombras.', '🏡');
    g.asedio = null;
    return;
  }
  A.fase = 'espera'; A.t = 8;
  g.ui.toast('🌑 Un respiro… todavía vienen más', 2200);
}
// la tranca: una puerta trancada aguanta el doble de golpes
export const TRANCA = 509;
export function trancar(g, t) {
  const w = g.world, b = BLOCKS[t.id], y = b.upper ? t.y - 1 : t.y, be = w.getBE(t.x, y, t.z);
  if (!be) return false;
  if (be.tranca) { g.ui.toast('🚪 Esa puerta ya tiene tranca', 1600); return false; }
  be.tranca = true;
  w.touchBE(t.x, y, t.z);
  g.audio.play('dig.wood', { pos: { x: t.x + 0.5, y: y + 1, z: t.z + 0.5 }, vol: 0.8 });
  g.particles.burst(t.x + 0.5, y + 1, t.z + 0.5, [[0.5, 0.36, 0.2]], 8, 1.2);
  g.ui.toast('🚪 Puerta trancada: aguanta el doble de golpes', 2200);
  g.achieve('tranca', 'Bien trancada');
  return true;
}
// las Sombras del asedio tumban las puertas a golpes (no se puede uno encerrar y esperar)
export function golpearPuertas(g, H, A) {
  const w = g.world;
  for (const m of A.mobs) {
    const x = Math.floor(m.body.pos.x), y = Math.floor(m.body.pos.y), z = Math.floor(m.body.pos.z);
    for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
      const px = x + dx, pz = z + dz;
      const b = BLOCKS[w.getBlock(px, y, pz)];
      if (!b || !b.door || b.upper) continue;
      const be = w.getBE(px, y, pz);
      if (be && be.open) continue; // abierta no hay nada que tumbar
      const k = `${px},${y},${pz}`;
      const vida = (A.puertas.get(k) ?? (be && be.tranca ? 16 : 8)) - 1;
      A.puertas.set(k, vida);
      g.audio.play('puerta.golpe', { pos: { x: px + 0.5, y: y + 1, z: pz + 0.5 }, vol: 0.9 });
      g.particles.burst(px + 0.5, y + 1, pz + 0.5, [[0.5, 0.36, 0.2], [0.35, 0.25, 0.14]], 8, 1.6);
      m.lunge = 0.3;
      if (vida === 4) g.ui.toast('🚪 ¡Están tumbando la puerta!', 2000);
      if (vida <= 0) {
        w.setBlock(px, y, pz, AIR); w.setBlock(px, y + 1, pz, AIR);
        A.puertas.delete(k);
        g.ui.toast('🚪 ¡Tumbaron la puerta!', 2200);
        g.shake = Math.max(g.shake || 0, 0.4);
      }
      return; // un golpe por segundo: que dé tiempo de reaccionar
    }
  }
}
export function limpiarAsedio(g) { if (g.asedio) { for (const m of g.asedio.mobs) m.dead = true; g.asedio = null; } }

// ---------- el cencerro: suena si algo hostil anda cerca, de día o de noche ----------
export function registrarCencerro(g, x, y, z) { (g.meta.cencerros ||= []).push({ x, y, z }); }
export function tickCencerros(g) {
  const L = g.meta.cencerros;
  if (!L || !L.length || g.mode !== 'survival' || g.dim !== 'tierra') return;
  const w = g.world, p = g.player.body.pos, ck = g.clock || 0;
  for (let i = L.length - 1; i >= 0; i--) {
    const c = L[i];
    if (!w.isLoaded(c.x, c.z)) continue;
    if (w.getBlock(c.x, c.y, c.z) !== K.cencerro) { L.splice(i, 1); continue; }
    if (Math.hypot(c.x - p.x, c.z - p.z) > 56 || ck < (c.cd || 0)) continue;
    const intruso = g.entities.mobs.find((m) => !m.dead && (m.kind.hostile || m.kind.legend) && !m.kind.pasivo && m.type !== 'zancudo' && Math.hypot(m.body.pos.x - c.x, m.body.pos.z - c.z) < 14);
    if (!intruso) continue;
    c.cd = ck + 9;
    g.audio.play('cencerro', { pos: { x: c.x + 0.5, y: c.y + 0.5, z: c.z + 0.5 }, vol: 1 });
    g.ui.toast(`🔔 El cencerro: anda ${intruso.kind.name ? intruso.kind.name.toLowerCase() : 'algo'} cerca`, 2200);
    g.achieve('cencerro', 'Sonó el cencerro');
  }
}
