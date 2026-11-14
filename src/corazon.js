// Después del final: el Corazón de Tiquicia queda en manos de uno. Puesto en la casa, las Sombras no nacen a 70 bloques y cerca de él la
// vida vuelve sola. Y de noche, con clic derecho, llama a la Noche de Ceniza: oleadas sin fin para ver cuántas se aguantan, con récord.
// Es lo que queda para los que ya terminaron la historia (y para los videos). Estado: meta.corazon y meta.ceniza; la pelea, g.ceniza.
import { BLOCK_BY_KEY as K } from './blocks.js';
import { anotar } from './diario.js';
import { ventaja } from './progreso.js';
import { darTrofeo } from './hogar.js';
import { golpearPuertas, rezagadas, contarBajas, olaGanada, puestoSombra } from './asedio.js';

const RADIO = 70, RADIO_VIDA = 18, COLON = 360, ESENCIA = 499;

export function registrarCorazon(g, x, y, z) {
  g.meta.corazon = { x, y, z };
  g.ui.regionBanner('El Corazón late aquí', `Las Sombras no nacen a ${RADIO} bloques. De noche, clic derecho llama a la Noche de Ceniza`);
  g.achieve('corazon_puesto', 'El Corazón en su lugar');
}
export function zonaCorazon(g, x, z) {
  const C = g.meta && g.meta.corazon;
  return !!(C && !g.ceniza && g.dim === 'tierra' && Math.hypot(C.x - x, C.z - z) < RADIO);
}
function soltar(g, A) {
  const ola = A.ola, n = Math.min(14, 4 + ola);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * 6.283 + Math.random(), r = 13 + i * 2 + Math.random() * 2;
    const q = puestoSombra(g, A.x, A.z, A.y, a, r);
    if (!q) continue;
    const { x, y, z } = q;
    const jefa = ola >= 4 && (ola + 1) % 5 === 0 && i === 0;
    const tipo = jefa ? 'sombra_capitana' : ola >= 7 && i % 5 === 2 ? 'sombra_grande' : ola >= 2 && i % 4 === 1 ? 'sombra_escudo' : ola >= 1 && i % 4 === 3 ? 'sombra_hondera' : 'sombra';
    const m = g.entities.spawnMob(tipo, x + 0.5, y + 0.2, z + 0.5);
    if (!m) continue;
    m.data.provoked = true; m.data.ceniza = true;
    m.health += Math.min(30, ola * 2);
    g.particles.burst(x + 0.5, y + 1, z + 0.5, [[0.3, 0.3, 0.3], [0.5, 0.2, 0.1]], 12, 1.8);
    A.mobs.push(m);
  }
  A.peleaT = 0; A.nOla = A.mobs.length; A.bajas = 0;
  g.audio.play('sombra', { ui: true, vol: 0.7 });
  g.ui.regionBanner(`Oleada ${ola + 1}`, A.mobs.length ? `Vienen ${A.mobs.length}` : '');
}
export function usarCorazon(g, t) {
  if (g.mode !== 'survival') { g.ui.toast('El Corazón late despacio', 1800); return; }
  if (g.ceniza) { g.ui.toast('🌋 Ya está en eso. Aguante', 1600); return; }
  if (g.daylight > 0.35) { g.ui.toast('🌋 De día el Corazón descansa. De noche, llama a la Noche de Ceniza', 2600); return; }
  if (g.asedio || g.nocheLarga || g.apuro) { g.ui.toast('🌋 Termine primero lo que empezó', 2000); return; }
  g.ceniza = { x: t.x, y: t.y, z: t.z, ola: 0, t: 8, fase: 'espera', mobs: [], puertas: new Map() };
  g.cenizaHasta = (g.clock || 0) + 3600;
  g.audio.play('rumble', { ui: true, vol: 0.8 });
  g.shake = 0.7;
  g.ui.regionBanner('La Noche de Ceniza', 'No se acaba hasta que usted se muera o se vaya lejos. Prepárese');
}
function terminar(g, A, razon) {
  const hechas = A.ola, M = (g.meta.ceniza ||= { record: 0 });
  for (const m of A.mobs) if (!m.dead && !m.data.irse) m.data.irse = 2;
  g.ceniza = null;
  g.cenizaHasta = 0;
  const nuevo = hechas > M.record;
  if (nuevo) M.record = hechas;
  g.ui.toast(`🌋 ${razon}: ${hechas} ${hechas === 1 ? 'oleada' : 'oleadas'}. ${nuevo ? '¡Récord nuevo!' : `Su récord: ${M.record}`}`, 5000);
  if (hechas > 0) anotar(g, `Noche de Ceniza: aguanté ${hechas} ${hechas === 1 ? 'oleada' : 'oleadas'}.`, '🌋');
}
// cada segundo
export function tickCorazon(g) {
  if (g.mode !== 'survival' || !g.meta) return;
  const H = g.meta.hist, P = g.player, p = P.body.pos;
  if (H && H.fin && !g.meta.corazonDado) {
    g.meta.corazonDado = true;
    g.giveItem(K.corazon_tiquicia, 1);
    g.ui.toast('🧱 El Corazón es suyo: póngalo donde quiera cuidar', 4000);
  }
  if (H && H.fin && !(g.meta.trofeos && g.meta.trofeos.trofeo_sombra_madre)) darTrofeo(g, { type: 'sombra_madre' }); // partidas de antes de los trofeos
  const C = g.meta.corazon;
  if (C && g.dim === 'tierra' && g.world.isLoaded(C.x, C.z) && g.world.getBlock(C.x, C.y, C.z) !== K.corazon_tiquicia) { g.meta.corazon = null; }
  // cerca de él, la vida vuelve sola
  if (C && g.dim === 'tierra' && P.alive && P.health < P.maxHealth && !g.ceniza && Math.hypot(C.x - p.x, C.z - p.z) < RADIO_VIDA) P.health = Math.min(P.maxHealth, P.health + 0.5);
  const A = g.ceniza;
  if (!A) return;
  if (g.time > 0.92) g.time = 0.92; // mientras dure no amanece
  if (g.time < 0.55) g.time = 0.7;
  if (!P.alive) { terminar(g, A, 'La ceniza pudo más'); return; }
  if (g.dim !== 'tierra' || Math.hypot(A.x - p.x, A.z - p.z) > RADIO) { terminar(g, A, 'Se alejó del Corazón'); return; }
  contarBajas(A);
  const fake = { casa: { x: A.x - 4.5, y: A.y, z: A.z - 3.5 } };
  golpearPuertas(g, fake, A);
  if (A.fase === 'espera') { A.t -= 1; if (A.t <= 0) { soltar(g, A); A.fase = 'pelea'; } return; }
  if (A.mobs.length) { rezagadas(g, fake, A, 120); return; }
  if (!olaGanada(A)) { terminar(g, A, 'Las Sombras se fueron sin pelea'); return; }
  A.ola++;
  const paga = ventaja.premio(g, 6 + A.ola * 3);
  g.giveItem(COLON, paga);
  g.addXP(5 + A.ola * 2);
  if (A.ola % 3 === 0) g.giveItem(ESENCIA, 1);
  g.ui.toast(`🌋 Oleada ${A.ola} superada: ${paga} colones${A.ola % 3 === 0 ? ' y 1 de esencia' : ''}. Un respiro…`, 2800);
  if (A.ola === 5) g.achieve('ceniza5', 'Cinco oleadas de ceniza');
  if (A.ola === 10) g.achieve('ceniza10', 'Diez oleadas de ceniza');
  if (A.ola === 20) g.achieve('ceniza20', 'Sin cansancio');
  A.fase = 'espera'; A.t = 10;
}
export function limpiarCeniza(g) { if (g.ceniza) { for (const m of g.ceniza.mobs) m.dead = true; g.ceniza = null; g.cenizaHasta = 0; } }
export function corazonHTML(g) {
  const C = g.meta && g.meta.ceniza, H = g.meta && g.meta.hist;
  if (!H || !H.fin) return '';
  return `<div class="prog-casa"><b>🌋 Noche de Ceniza</b><span>Su récord: ${(C && C.record) || 0} oleadas. Se llama de noche, con clic derecho al Corazón</span></div>`;
}
