// El tío Rigo: el hijo de Zenaida que se fue a vender seguros. Desde el día 6 aparece de día en la casa, vende el Seguro contra
// Sombras (si uno se muere, no se le cae nada, una sola vez) y arrastra una historia corta: las Sombras le roban el maletín, uno se
// lo recupera, y adentro aparece la póliza que la abuela le pagó por cuarenta años. El estado vive en meta.rigo y meta.seguro.
import { BLOCK_BY_KEY as K, AIR, SOLID, FLUID, BLOCKS } from './blocks.js';
import { decir } from './misiones.js';
import { anotar } from './diario.js';
import { entregarCarta } from './historia.js';
import { difOf } from './supervivencia.js';
import { rigoAnselmo } from './anselmo.js';

export const MALETIN = 502;
const COLON = 360, ANCHO = 9, FONDO = 7, PRECIO = 25, PRECIO_FINAL = 40, SEA = 62, NOM = 'Tío Rigo';

function suelo(g, x, z, desde) {
  const w = g.world;
  let y = desde + 8;
  while (y > desde - 10 && !(SOLID[w.getBlock(x, y - 1, z)] && !SOLID[w.getBlock(x, y, z)] && !SOLID[w.getBlock(x, y + 1, z)])) y--;
  return y;
}
function llegar(g, H) {
  const x = Math.floor(H.casa.x + ANCHO / 2), z = H.casa.z + FONDO + 1, y = suelo(g, x, z, H.casa.y);
  const m = g.entities.spawnMob('vecino', x + 0.5, y + 0.2, z + 0.5);
  if (!m) return null;
  const here = { x, y, z };
  Object.assign(m.data, { home: here, plaza: { ...here }, name: NOM, role: 'vecino', vid: 'hist:rigo', seed: 19331, rigo: true });
  if (m.kind.dress) m.kind.dress(m);
  return m;
}
function lugarMaletin(g) {
  const w = g.world, p = g.player.body.pos;
  for (let i = 0; i < 60; i++) {
    const a = Math.random() * Math.PI * 2, r = 34 + Math.random() * 26;
    const x = Math.floor(p.x + Math.cos(a) * r), z = Math.floor(p.z + Math.sin(a) * r);
    if (!w.isLoaded(x, z)) continue;
    let y = 120;
    while (y > SEA && !SOLID[w.getBlock(x, y, z)]) y--;
    if (y <= SEA || FLUID[w.getBlock(x, y, z)] || BLOCKS[w.getBlock(x, y, z)].leafy) continue;
    if (w.getBlock(x, y + 1, z) !== AIR) continue;
    return { x, y: y + 1, z };
  }
  return null;
}
function esconder(g, R) {
  const q = lugarMaletin(g);
  if (!q) return false;
  g.world.setBlock(q.x, q.y, q.z, K.chest);
  g.stations.placed(K.chest, q.x, q.y, q.z, 0);
  const be = g.world.getBE(q.x, q.y, q.z);
  be.slots[0] = { id: MALETIN, count: 1 };
  g.world.touchBE(q.x, q.y, q.z);
  R.pos = q;
  return true;
}
function guardias(g, R) {
  const w = g.world, q = R.pos, dia = g.day || 1;
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2, x = Math.floor(q.x + Math.cos(a) * 5), z = Math.floor(q.z + Math.sin(a) * 5);
    if (!w.isLoaded(x, z)) continue;
    const y = suelo(g, x, z, q.y);
    const m = g.entities.spawnMob('sombra', x + 0.5, y + 0.2, z + 0.5);
    if (!m) continue;
    m.data.apuro = true; m.data.provoked = true; // el sol no las quema: están cuidando el maletín
    m.health += Math.min(14, Math.floor(dia / 2));
    g.particles.burst(x + 0.5, y + 1, z + 0.5, [[0.05, 0.02, 0.1], [0.3, 0.12, 0.4]], 12, 1.8);
  }
  g.audio.play('sombra', { ui: true, vol: 0.5 });
}
// cada segundo
export function tickRigo(g) {
  if (g.mode !== 'survival' || g.dim !== 'tierra' || !g.meta) return;
  const H = g.meta.hist;
  if (!H || !H.hogar || !H.casa || (g.day || 1) < 6) return;
  const R = (g.meta.rigo ||= { fase: 0 }), p = g.player.body.pos, t = g.time || 0;
  // el maletín
  if (R.fase === 2 && R.pos) {
    if (!R.guardias && Math.hypot(R.pos.x - p.x, R.pos.z - p.z) < 18) { R.guardias = true; if (g.settings.hostiles && difOf(g).hostiles) guardias(g, R); }
    if (g.inventory.count(MALETIN) > 0) { R.pos = null; g.ui.toast('🧳 ¡El maletín! Lléveselo al tío Rigo', 3000); }
  }
  const m = g.entities.mobs.find((q) => !q.dead && q.data && q.data.rigo);
  const deDia = t > 0.03 && t < 0.42;
  if (m) {
    if (!deDia && !m.data.irse) { decir(g, m, 'Me voy, que de noche no se cobran pólizas.', 3); m.data.irse = 4; }
    return;
  }
  if (!deDia || g.asedio || Math.hypot(H.casa.x + ANCHO / 2 - p.x, H.casa.z + FONDO / 2 - p.z) > 40 || !g.world.isLoaded(H.casa.x, H.casa.z)) return;
  if (!llegar(g, H)) return;
  if (!R.vino) { R.vino = g.day || 1; g.ui.toast('🧳 Llegó alguien a la casa: un señor de saco, con cara de que viene a vender algo', 4200); }
}
function vender(g, R, precio) {
  if (g.meta.seguro) { g.ui.dialog(NOM, 'Su póliza ya está al día. Lo demás es codicia, y de eso me encargo yo.', 3200); return; }
  if (g.inventory.count(COLON) < precio) { g.ui.dialog(NOM, `Son ${precio} colones, mi cepa. Familia es familia, pero la aseguradora es la aseguradora.`, 3600); return; }
  g.inventory.remove(COLON, precio);
  g.meta.seguro = true;
  R.vendido = true;
  g.audio.play('craft', { ui: true, vol: 0.3 });
  g.achieve('seguro', 'Con seguro');
  g.ui.dialog(NOM, 'Firme aquí, aquí y aquí. No, eso no lo lea. ¡Bienvenidos a la gran familia asegurada! Si se muere, no se le cae nada. Una sola vez.', 5200);
}
export function rigoInteract(m, g) {
  if (!m.data.rigo) return false;
  const R = (g.meta.rigo ||= { fase: 0 }), dia = g.day || 1;
  if (R.hablo && rigoAnselmo(g)) return true;
  if (R.hablo && g.meta.prima && g.meta.prima.fase >= 1 && !R.dijoPrima) { R.dijoPrima = true; g.ui.dialog(NOM, '¿Marielos? Es mi sobrina, la hija de su tía. Cuidó a mi mamá los últimos años. Nadie se lo agradeció, y ella tampoco se dejó. No le venda nada, y no le compre nada. Pero déle café.', 8000); return true; }
  if (R.fase === 0) {
    if (!R.hablo) {
      R.hablo = dia;
      g.ui.dialog(NOM, `Mi cepa, yo soy su tío Rigo. Lamento lo de mi mamá. ¿Ya pensó qué pasa si le cae una Sombra encima? Por ${PRECIO} colones le dejo el Seguro contra Sombras: si se muere, no se le cae nada de la mochila. Una sola vez, letra menuda. Hábleme otra vez para firmar.`, 8000);
      return true;
    }
    if (R.vendido || dia - R.hablo >= 3) { R.fase = 1; } else { vender(g, R, PRECIO); return true; }
  }
  if (R.fase === 1) {
    if (!esconder(g, R)) { g.ui.dialog(NOM, 'Venga mañana, que hoy ando con la cabeza en otro lado.', 3000); return true; }
    R.fase = 2; R.diaEncargo = dia;
    g.ui.dialog(NOM, `Le tengo que contar algo: las Sombras me robaron el maletín, con todas las pólizas adentro. Lo dejaron en un cofre en el monte. Se lo marqué en la brújula. ${R.vendido ? 'Y como ya tiene seguro…' : 'Y yo que le iba a vender uno…'}`, 7000);
    anotar(g, 'Las Sombras le robaron el maletín al tío Rigo.', '🧳');
    return true;
  }
  if (R.fase === 2) {
    if (g.inventory.count(MALETIN) > 0) {
      g.inventory.remove(MALETIN, 1);
      g.giveItem(COLON, 25);
      g.meta.seguro = true;
      R.fase = 3; R.diaMaletin = dia;
      g.audio.play('aplausos', { ui: true, vol: 0.4 });
      g.ui.dialog(NOM, 'Ay, mi maletín… ¡está todo! Tome 25 colones, y su próxima póliza va por la casa. Déjeme revisar estos papeles con calma. Venga en unos días.', 6000);
      anotar(g, 'Le devolví el maletín al tío Rigo.', '🧳');
    } else if (dia - R.diaEncargo >= 5) {
      // que no se trabe la historia si el cofre se perdió
      R.fase = 3; R.pos = null; R.diaMaletin = dia;
      g.ui.dialog(NOM, 'Olvídese del maletín: apareció en el carro. Déjeme revisar estos papeles con calma, y venga en unos días.', 5000);
    } else g.ui.dialog(NOM, 'Búsquemelo, mi cepa. Dicen que las Sombras lo cuidan porque les interesa la cobertura.', 4000);
    return true;
  }
  if (R.fase === 3) {
    if (dia - R.diaMaletin < 2) { g.ui.dialog(NOM, 'Todavía estoy con los papeles. Son cuarenta años de letra menuda.', 3200); return true; }
    R.fase = 4;
    g.giveItem(COLON, 80);
    g.achieve('rigo', 'La póliza de Zenaida');
    entregarCarta(g, 10);
    g.ui.dialog(NOM, 'Mire lo que encontré. Mi mamá me pagó una póliza cada mes por cuarenta años, y nunca me dijo a nombre de quién. Era a nombre suyo. Tome los 80 colones… y esta carta venía adentro.', 8000);
    return true;
  }
  // de aquí en adelante, sigue vendiendo: primero ofrece y a la segunda firma
  if (!g.meta.seguro && !R.ofrecio) { R.ofrecio = true; g.ui.dialog(NOM, `Se le venció la póliza, mi cepa. Renovarla son ${PRECIO_FINAL} colones. Hábleme otra vez para firmar. Y venga a comer un día de estos.`, 5000); return true; }
  R.ofrecio = false;
  vender(g, R, PRECIO_FINAL);
  return true;
}
// lo llama la muerte: si tenía seguro, no se le cae nada
export function cobrarSeguro(g) {
  if (g.mode !== 'survival' || !g.meta || !g.meta.seguro || difOf(g).keep === 'todo') return false;
  g.meta.seguro = false;
  g.seguroPago = true; // lo dice la pantalla de muerte
  anotar(g, 'El seguro del tío Rigo pagó.', '📄');
  return true;
}
