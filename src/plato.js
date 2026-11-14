// Guardarle el plato: si las Sombras son los que nadie esperó (la libreta de Anselmo), también se les puede servir. Un plato servido llama de
// noche a una Sombra mansa, que viene despacio, come, deja algo y se va, y uno se entera de quién era. No reemplaza la pelea: es otra manera
// de hacer algo por las noches. Estado: meta.platos (dónde) y meta.comensales (a quiénes les sirvió).
import { BLOCK_BY_KEY as K, ITEMS, SOLID, esPescado } from './blocks.js';
import { anotar } from './diario.js';
import { puestoSombra } from './asedio.js';
import { ventaja } from './progreso.js';

const COLON = 360, ESENCIA = 499, CRUDO = { has: (id) => id === 262 || esPescado(id) }; // v12.7.0: el registro
export const QUIENES = [
  'Era Don Beto, el de la pulpería. Se murió solo, y nadie fue a la vela.',
  'Era una señora que esperó el bus de las cinco hasta que quitaron la parada.',
  'Era un muchacho que se fue a trabajar al norte. Mandó veinte cartas, y le contestaron dos.',
  'Era doña Mirta. Puso la mesa para doce, y llegaron dos.',
  'Era el profesor de marimba. Nadie volvió a preguntar por las clases.',
  'Era el sereno de una bodega que ya habían botado. Seguía dando la vuelta.',
  'Era un señor que le guardaba campo a su hermano en la mejenga. El hermano ya no venía.',
  'Era la hermana mayor, la que cuidó a todos. Cuando le tocó a ella, no había nadie.',
  'Era el cartero de un pueblo que ya no recibe cartas.',
  'Era don Eliécer, que le prestó plata a todo el mundo. Le pagaron con silencio.',
  'Era una enfermera del turno de noche. A todos se les olvidó que ella también tenía hambre.',
  'Era un abuelo que llamaba los domingos. Un domingo dejaron de contestar.',
  'Era un perro. Se comió el plato, movió la cola y se fue. Nadie sabe cómo llegó a Sombra.',
  'Era un diputado. Comió rápido y preguntó si había factura.',
  'Era una muchacha, con el vestido puesto, que esperaba en una iglesia sin techo.',
  'Era el funcionario de la Ventanilla 3. Seguía esperando que alguien le trajera el timbre.',
  'Era un señor que regaba un jardín ajeno. Ahora eso es potrero, y él sigue regando.',
  'Era el locutor de la radio del pueblo. Todavía leía los avisos de una avioneta que ya no sale.',
  'Era una tía que mandaba tamales en diciembre. Un diciembre nadie los fue a recoger.',
  'Era un futbolista de tercera. Seguía sentado en la banca, esperando que lo llamaran.',
];
const servidos = (g) => (g.meta && g.meta.comensales) || [];
export const calmaPlatos = (g) => (servidos(g).length >= 6 ? 1 : 0);

export function registrarPlato(g, x, y, z) {
  if (g.mode !== 'survival') return;
  const L = (g.meta.platos ||= []);
  if (!L.some((q) => q.x === x && q.y === y && q.z === z)) L.push({ x, y, z, dia: 0 });
  if (!g.meta.platoAviso) { g.meta.platoAviso = true; g.ui.toast('🍽 Con comida en el plato, de noche viene a comer alguien. Déjelo donde se pueda llegar', 4200); }
}
// clic derecho a un plato vacío con comida en la mano
export function llenarPlato(g, t, held) {
  const d = held && ITEMS[held.id];
  if (!d || !d.food || d.food < 5 || CRUDO.has(held.id) || d.guaro || d.trip) { g.ui.toast('🍽 Eso no se le sirve a nadie. Comida cocinada, de la que llena', 2000); return; }
  if (g.mode === 'survival') g.inventory.consumeHeld(1);
  g.world.setBlock(t.x, t.y, t.z, K.plato_servido);
  g.audio.play('craft', { ui: true, vol: 0.25 });
  registrarPlato(g, t.x, t.y, t.z);
  const L = g.meta.platos.find((q) => q.x === t.x && q.y === t.y && q.z === t.z);
  if (L && L.dia === (g.day || 1)) L.dia = 0;
}

// lo que hace la Sombra mansa: llega, come, deja algo y se va. Si le pegan, se acabó la paz.
function hacerComensal(g, q) {
  return (m, dt) => {
    if (m.data.provoked) {
      m.data.comensalFn = null;
      g.ui.toast('🌑 Venía a comer. Ya no', 2200);
      return false;
    }
    const w = g.world, b = m.body.pos, d = Math.hypot(q.x + 0.5 - b.x, q.z + 0.5 - b.z) + Math.max(0, Math.abs(b.y - q.y) - 1) * 2;
    if (w.getBlock(q.x, q.y, q.z) !== K.plato_servido && !m.data.comiendo) { m.data.irse = 1; m.data.comensalFn = () => { m.moving = false; return true; }; return true; }
    if (d > 1.5 && !m.data.comiendo) {
      m.data.paciencia = (m.data.paciencia ?? 70) - dt;
      if (m.data.paciencia <= 0) { m.data.irse = 1; m.data.comensalFn = () => { m.moving = false; return true; }; return true; }
      // sin mapa de por medio: la que se atora se pasa por lo oscuro hasta el plato
      m.data.revisa = (m.data.revisa ?? 2.5) - dt;
      if (m.data.revisa <= 0) {
        m.data.revisa = 2.5;
        if (d > (m.data.dPrev ?? Infinity) - 0.8) {
          // a un costado del plato, a su misma altura
          const lado = [[1, 0], [-1, 0], [0, 1], [0, -1]].find(([sx, sz]) => !SOLID[w.getBlock(q.x + sx, q.y, q.z + sz)] && !SOLID[w.getBlock(q.x + sx, q.y + 1, q.z + sz)]);
          if (lado) { g.particles.burst(b.x, b.y + 1, b.z, [[0.05, 0.02, 0.1], [0.3, 0.12, 0.4]], 10, 1.4); b.x = q.x + lado[0] + 0.5; b.z = q.z + lado[1] + 0.5; b.y = q.y + 0.1; m.body.vel.x = m.body.vel.z = 0; g.particles.burst(b.x, b.y + 1, b.z, [[0.05, 0.02, 0.1], [0.3, 0.12, 0.4]], 10, 1.4); }
        }
        m.data.dPrev = d;
      }
      m.goTo(q.x + 0.5, q.z + 0.5, 0.75);
      return true;
    }
    m.moving = false;
    m.data.comiendo = (m.data.comiendo || 0) + dt;
    m.targetYaw = Math.atan2(q.x + 0.5 - b.x, q.z + 0.5 - b.z);
    if (Math.random() < dt * 3) g.audio.play('eat', { vol: 0.5, pos: { x: b.x, y: b.y + 1, z: b.z } });
    if (m.data.comiendo > 3) terminarDeComer(g, m, q);
    return true;
  };
}
function terminarDeComer(g, m, q) {
  const M = g.meta, b = m.body.pos, L = (M.comensales ||= []);
  if (g.world.getBlock(q.x, q.y, q.z) === K.plato_servido) g.world.setBlock(q.x, q.y, q.z, K.plato_vacio);
  // primero quien falte; cuando ya vinieron todos, repiten
  const faltan = QUIENES.map((_, i) => i).filter((i) => !L.includes(i));
  const i = faltan.length ? faltan[Math.floor(Math.random() * faltan.length)] : Math.floor(Math.random() * QUIENES.length);
  if (faltan.length) L.push(i);
  g.particles.burst(b.x, b.y + 1, b.z, [[1, 0.9, 0.55], [1, 1, 0.9]], 26, 2.2);
  g.audio.play('hmm', { ui: true, vol: 0.3 });
  m.dead = true;
  g.ui.toast(`🍽 ${QUIENES[i]}`, 6200);
  anotar(g, QUIENES[i], '🍽');
  // deja algo
  g.entities.dropItem(COLON, ventaja.premio(g, 2 + Math.floor(Math.random() * 5)), q.x + 0.5, q.y + 0.6, q.z + 0.5);
  if (Math.random() < 0.34) g.entities.dropItem(ESENCIA, 1, q.x + 0.5, q.y + 0.6, q.z + 0.5);
  g.addXP(8);
  const n = L.length;
  g.achieve('plato1', 'Le guardé el plato');
  if (n === 6 && !M.platoCalma) { M.platoCalma = true; g.ui.regionBanner('Ya se corrió la voz', 'Con lo que come tanta gente, cada noche viene una Sombra menos a buscar pleito'); g.achieve('plato6', 'Aquí se come'); }
  if (n === 12 && !M.platoCorazon) { M.platoCorazon = true; M.vidaExtra = (M.vidaExtra || 0) + 2; g.player.vidaExtra = M.vidaExtra; g.player.health = g.player.maxHealth; g.ui.regionBanner('Un corazón más', 'El corazón también crece dando de comer'); g.achieve('plato12', 'El corazón crece dando de comer'); }
  if (n >= QUIENES.length && !M.platoTodos) { M.platoTodos = true; g.ui.regionBanner('Ya comieron todos', 'Y todavía queda un plato. Siempre queda un plato'); g.achieve('plato_todos', 'Ya comieron todos'); }
}

// cada segundo
export function tickPlatos(g) {
  const M = g.meta;
  if (!M || g.mode !== 'survival') return;
  const H = M.hist, An = M.anselmo;
  // la libreta lo da a entender: que se sepa que se puede
  if (H && H.cartas && H.cartas.includes(19) && !M.platoPista && An && (An.tp || 0) <= 0) { M.platoPista = true; g.ui.toast('🍽 Si son los que nadie esperó… en la mesa de trabajo se puede servir un Plato', 5200); }
  if (!M.platos || !M.platos.length || g.dim !== 'tierra') return;
  const t = g.time || 0, dia = g.day || 1, p = g.player.body.pos, w = g.world;
  // los que ya no están se olvidan
  for (let i = M.platos.length - 1; i >= 0; i--) { const q = M.platos[i]; if (w.isLoaded(q.x, q.z) && ![K.plato_servido, K.plato_vacio].includes(w.getBlock(q.x, q.y, q.z))) M.platos.splice(i, 1); }
  if (t < 0.54 || t > 0.92 || g.asedio || g.nocheLarga || g.apuro || g.ceniza || g.grieta || g.sleeping) return;
  if (g.entities.mobs.some((m) => !m.dead && m.data && m.data.comensalFn)) return;
  if (Math.random() > 0.05) return;
  const q = M.platos.find((c) => c.dia !== dia && Math.hypot(c.x - p.x, c.z - p.z) < 44 && w.isLoaded(c.x, c.z) && w.getBlock(c.x, c.y, c.z) === K.plato_servido);
  if (!q) return;
  const s = puestoSombra(g, q.x, q.z, q.y, Math.random() * Math.PI * 2, 13);
  if (!s) return;
  const m = g.entities.spawnMob('sombra', s.x + 0.5, s.y + 0.2, s.z + 0.5);
  if (!m) return;
  q.dia = dia;
  m.data.apuro = true; m.data.comensalFn = hacerComensal(g, q);
  if (!M.comensalVisto) { M.comensalVisto = true; g.ui.toast('🍽 Viene una Sombra, despacio, y no le está haciendo caso a usted. Déjela comer', 4200); }
}
export const platoPrueba = (g) => { g.giveItem(K.plato_servido, 3); g.giveItem(K.plato_vacio, 2); g.time = 0.56; return 'Tres platos servidos y dos vacíos. Ya es de noche'; };
export const platosHTML = (g) => {
  const L = servidos(g);
  if (!L.length) return '';
  return `<div class="plato-lista"><h4 class="mana-tit">🍽 Los que comieron en su plato <small>(${L.length}/${QUIENES.length})</small></h4>${L.map((i) => `<p>${QUIENES[i]}</p>`).join('')}</div>`;
};
