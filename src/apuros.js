// El pueblo en apuros: cada tanto, al anochecer, si uno anda por un pueblo, tocan la campana porque vienen Sombras por la plaza.
// Uno decide si se queda: ayudar paga en colones y reputación, y si se va no pasa nada más que la cara de los vecinos al otro día.
// Le da sentido a tener equipo cuando uno anda de visita, y a los pueblos de noche.
import { anotar } from './diario.js';
import { ventaja } from './progreso.js';
import { difOf } from './supervivencia.js';
import { hayAsedioHoy, rezagadas, contarBajas, olaGanada, puestoSombra } from './asedio.js';

const CADA = 6, CERCA = 48, LEJOS = 90, OLAS = 2;

function soltar(g, A) {
  const dia = g.day || 1, n = Math.min(8, 3 + Math.floor(dia / CADA) + A.ola);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + Math.random(), r = 14 + i * 2.5 + Math.random() * 2;
    const q = puestoSombra(g, A.x, A.z, A.y + 1, a, r);
    if (!q) continue;
    const { x, y, z } = q;
    const tipo = dia >= 12 && i % 4 === 1 ? 'sombra_escudo' : dia >= 8 && i % 4 === 3 ? 'sombra_hondera' : 'sombra';
    const m = g.entities.spawnMob(tipo, x + 0.5, y + 0.2, z + 0.5);
    if (!m) continue;
    m.data.apuro = true; m.data.provoked = true;
    m.health += Math.min(10, Math.floor(dia / 3));
    g.particles.burst(x + 0.5, y + 1, z + 0.5, [[0.05, 0.02, 0.1], [0.3, 0.12, 0.4]], 12, 1.8);
    A.mobs.push(m);
  }
  A.peleaT = 0; A.nOla = A.mobs.length; A.bajas = 0;
  g.audio.play('sombra', { ui: true, vol: 0.6 });
}
function campana(g, A) {
  for (let k = 0; k < 4; k++) setTimeout(() => { if (g.audio) g.audio.play('campana', { pos: { x: A.x, y: A.y + 8, z: A.z }, vol: 1, vary: 0.02 }); }, k * 900);
}
function terminar(g, A, gano) {
  for (const m of A.mobs) if (!m.dead && !m.data.irse) m.data.irse = 2;
  g.meta.apuroDia = g.day || 1;
  g.apuro = null;
  if (!gano) { if (g.player.alive) g.ui.toast('🔔 Las Sombras se retiraron de la plaza', 2400); return; }
  const dia = g.day || 1, premio = ventaja.premio(g, 15 + dia * 2);
  g.giveItem(360, premio); g.addXP(20 + dia);
  g.meta.reputation = (g.meta.reputation || 0) + 2;
  g.meta.apuros = (g.meta.apuros || 0) + 1;
  g.audio.play('aplausos', { ui: true, vol: 0.6 });
  g.ui.regionBanner('¡Salvó la plaza!', `Los vecinos le juntaron ${premio} colones`);
  g.achieve('apuro', 'Salvé la plaza');
  if (g.meta.apuros >= 5) g.achieve('apuro5', 'El santo de los pueblos');
  anotar(g, 'Ayudé a defender la plaza de un pueblo.', '🔔');
}
// cada segundo
export function tickApuros(g) {
  if (g.mode !== 'survival' || g.dim !== 'tierra' || !g.settings.hostiles || !difOf(g).hostiles || g.asedio || g.nocheLarga || g.ceniza) return;
  const dia = g.day || 1, t = g.time || 0, p = g.player.body.pos;
  let A = g.apuro;
  if (!A) {
    if (dia < 6 || t < 0.46 || t > 0.56 || !g.player.alive || hayAsedioHoy(g)) return;
    if (g.meta.apuroDia && dia - g.meta.apuroDia < CADA) return;
    const v = g.nearestVillage(p.x, p.z);
    if (!v || v.dist > CERCA) return;
    A = g.apuro = { x: v.v.x, y: v.v.y, z: v.v.z, ola: 0, t: 12, fase: 'espera', mobs: [] };
    campana(g, A);
    g.ui.regionBanner('¡Tocan la campana!', 'Vienen Sombras por la plaza. Si se queda a ayudar, los vecinos pagan');
    return;
  }
  // arranca con luz todavía: lo que la corta es que ya amaneció (la mañana), no que haya sol
  if ((t > 0.03 && t < 0.4) || !g.player.alive || Math.hypot(A.x - p.x, A.z - p.z) > LEJOS) { terminar(g, A, false); return; }
  contarBajas(A);
  if (A.fase === 'espera') { A.t -= 1; if (A.t <= 0) { soltar(g, A); A.fase = 'pelea'; } return; }
  if (A.mobs.length) { rezagadas(g, { casa: { x: A.x - 4.5, y: A.y, z: A.z - 3.5 } }, A); return; }
  if (!olaGanada(A)) { terminar(g, A, false); return; }
  A.ola++;
  if (A.ola >= OLAS) { terminar(g, A, true); return; }
  A.fase = 'espera'; A.t = 8;
  g.ui.toast('🔔 Un respiro… todavía vienen más', 2200);
}
export function limpiarApuro(g) { if (g.apuro) { for (const m of g.apuro.mobs) m.dead = true; g.apuro = null; } }
