// El Canelo: el perro de la abuela. Cuando la casa queda arreglada, aparece flaco en el patio. Con cualquier comida se queda con uno
// para siempre: muerde lo que venga, ladra cuando algo se acerca de noche y, si queda muy golpeado, se va y vuelve al otro día.
// No se muere de verdad: es de la familia. El estado vive en meta.canelo; el perro se guarda con las demás mascotas (meta.pets).
import { SOLID, getDef } from './blocks.js';
import { hearts } from './fauna.js';
import { anotar } from './diario.js';

const ANCHO = 9, FONDO = 7;
const esCanelo = (m) => !m.dead && m.type === 'perro' && m.data && m.data.canelo;
function suelo(g, x, z, desde) {
  const w = g.world;
  let y = desde + 8;
  while (y > desde - 12 && !(SOLID[w.getBlock(x, y - 1, z)] && !SOLID[w.getBlock(x, y, z)])) y--;
  return y;
}
function aparecer(g, x, z, yRef, adoptado) {
  const y = suelo(g, x, z, yRef);
  const m = g.entities.spawnMob('perro', x + 0.5, y + 0.2, z + 0.5);
  if (!m) return null;
  m.data.canelo = true;
  m.data.nombre = 'Canelo';
  if (adoptado) m.tamed = true;
  return m;
}
// cada segundo
export function tickCanelo(g) {
  if (g.mode !== 'survival' || g.dim !== 'tierra' || !g.meta) return;
  const H = g.meta.hist;
  if (!H || !H.hogar || !H.casa) return;
  const C = (g.meta.canelo ||= {}), p = g.player.body.pos, dia = g.day || 1;
  if (g.pendingPets && g.pendingPets.some((q) => q.data && q.data.canelo)) return; // todavía no ha cargado
  if ((g.awayPets || []).some((q) => q.data && q.data.canelo)) return; // anda en otra dimensión
  const m = g.entities.mobs.find(esCanelo);
  if (!C.adoptado) {
    if (m || Math.hypot(H.casa.x + ANCHO / 2 - p.x, H.casa.z + FONDO / 2 - p.z) > 40 || !g.world.isLoaded(H.casa.x, H.casa.z)) return;
    if (aparecer(g, H.casa.x + 2, H.casa.z + FONDO + 2, H.casa.y, false) && !C.visto) {
      C.visto = dia;
      g.ui.toast('🐕 Hay un perro flaco en el patio de la casa. Tiene cara de que alguien le daba de comer', 4600);
    }
    return;
  }
  if (!m) {
    // se fue golpeado o se quedó lejos: vuelve al otro día, buscando a uno
    if (C.vuelve == null) { C.vuelve = dia + 1; return; }
    if (dia < C.vuelve || !g.player.alive) return;
    const a = Math.random() * 6.28, x = Math.floor(p.x + Math.cos(a) * 7), z = Math.floor(p.z + Math.sin(a) * 7);
    if (!g.world.isLoaded(x, z) || !aparecer(g, x, z, Math.floor(p.y), true)) return;
    C.vuelve = null;
    g.ui.toast('🐕 Volvió el Canelo, moviendo la cola como si nada', 3000);
    return;
  }
  // muy golpeado: se va a lamerse las heridas
  if (m.health <= 4 && !m.dying) {
    g.particles.burst(m.body.pos.x, m.body.pos.y + 0.6, m.body.pos.z, [[0.7, 0.55, 0.35]], 10, 1.4);
    g.audio.play('perro', { pos: m.soundPos(), vol: 0.8, pitch: 1.3 });
    m.dead = true;
    C.vuelve = dia + 1;
    g.ui.toast('🐕 El Canelo salió corriendo, muy golpeado. Mañana vuelve', 3400);
    return;
  }
  // de mañana, una vez por día, escarba y saca algo: un perro de finca siempre sabe dónde hay
  if (C.escarbo !== dia && (g.time || 0) > 0.04 && (g.time || 0) < 0.4 && Math.hypot(m.body.pos.x - p.x, m.body.pos.z - p.z) < 12 && Math.random() < 0.015) {
    C.escarbo = dia;
    const b = m.body.pos, r = Math.random();
    const [id, n, que] = r < 0.06 ? [499, 1, 'esencia de Sombra'] : r < 0.22 ? [521, 1, 'un sobre de estampas'] : r < 0.5 ? [360, 2 + Math.floor(Math.random() * 6), 'unos colones enterrados'] : r < 0.75 ? [267, 3, 'semillas'] : [261, 2, 'manzanas'];
    g.particles.burst(b.x, b.y + 0.3, b.z, [[0.45, 0.32, 0.2], [0.35, 0.25, 0.15]], 16, 1.6);
    g.audio.play('perro', { pos: m.soundPos(), vol: 0.7, pitch: 1.15 });
    g.entities.dropItem(id, n, b.x, b.y + 0.4, b.z);
    g.ui.toast(`🐕 El Canelo escarbó y sacó ${que}`, 2600);
    g.achieve('canelo_escarba', 'Perro de finca');
  }
  // ladra si algo viene de noche, antes de que llegue
  C.ladra = (C.ladra || 0) - 1;
  if (C.ladra > 0 || g.daylight > 0.4 || g.asedio || g.nocheLarga || g.apuro) return;
  const algo = g.entities.mobs.find((o) => !o.dead && !o.dying && o.kind.hostile && o.type !== 'zancudo' && Math.hypot(o.body.pos.x - p.x, o.body.pos.z - p.z) < 20);
  if (!algo) return;
  C.ladra = 25;
  g.audio.play('perro', { pos: m.soundPos(), vol: 1 });
  if (!C.avisoLadra) { C.avisoLadra = true; g.ui.toast('🐕 El Canelo ladra: algo viene por ahí', 2600); }
}
export function caneloInteract(m, g, held) {
  if (!m.data.canelo || m.tamed) return false;
  const def = held && getDef(held.id);
  if (!def || !def.food) { g.ui.toast('🐕 Lo mira con hambre. Con cualquier comida en la mano, clic derecho', 2400); return true; }
  if (g.mode === 'survival') g.inventory.consumeHeld(1);
  m.tamed = true;
  (g.meta.canelo ||= {}).adoptado = g.day || 1;
  hearts(g, m.body.pos, 14);
  g.audio.play('perro', { pos: m.soundPos() });
  g.ui.regionBanner('El Canelo', 'Era el perro de la abuela. Ahora anda con usted');
  g.achieve('canelo', 'El perro de la abuela');
  anotar(g, 'El Canelo, el perro de la abuela, se vino conmigo.', '🐕');
  return true;
}
