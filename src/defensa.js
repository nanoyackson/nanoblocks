// Defender la casa: la olla caliente (se llena de carbón y le cae encima a lo que se arrime), el alambre de púas (enreda y lastima a lo que pase) y la
// gente de la casa, que en plena pelea hace lo suyo: Tino remienda la puerta, Flor cura y Chepa saca comida. Estado: meta.ollas; la carga de cada olla,
// en su bloque. Las Sombras apagadoras se definen en sombras2.js.
import { BLOCK_BY_KEY as K, AIR } from './blocks.js';
import { decir } from './misiones.js';

const CARBON = 257, MAX_CARGA = 8, RADIO = 3.6, DANO = 7;
export function registrarOlla(g, x, y, z) {
  if (g.mode !== 'survival') return;
  (g.meta.ollas ||= []).push({ x, y, z });
  g.world.setBE(x, y, z, { type: 'olla', carga: 0 });
  if (!g.meta.ollaAviso) { g.meta.ollaAviso = true; g.ui.toast('🍲 Cárguela con carbón (clic derecho). A lo hostil que se arrime le cae agua hirviendo', 4200); }
}
export function usarOlla(g, t, held) {
  const w = g.world, be = w.getBE(t.x, t.y, t.z) || {};
  if (!held || held.id !== CARBON) { g.ui.toast(`🍲 Olla caliente: ${be.carga || 0}/${MAX_CARGA} de carbón. Clic derecho con carbón en la mano`, 2200); return; }
  if ((be.carga || 0) >= MAX_CARGA) { g.ui.toast('🍲 Ya está llena', 1200); return; }
  w.setBE(t.x, t.y, t.z, { ...be, type: 'olla', carga: (be.carga || 0) + 1 });
  if (g.mode === 'survival') g.inventory.consumeHeld(1);
  g.audio.play('ignite', { ui: true, vol: 0.3 });
  if (!(g.meta.ollas || []).some((q) => q.x === t.x && q.y === t.y && q.z === t.z)) (g.meta.ollas ||= []).push({ x: t.x, y: t.y, z: t.z });
  g.ui.toast(`🍲 ${(be.carga || 0) + 1}/${MAX_CARGA}`, 800);
}
function tickOllas(g) {
  const L = g.meta.ollas;
  if (!L || !L.length) return;
  const w = g.world, p = g.player.body.pos;
  for (let i = L.length - 1; i >= 0; i--) {
    const q = L[i];
    if (!w.isLoaded(q.x, q.z)) continue;
    if (w.getBlock(q.x, q.y, q.z) !== K.olla_caliente) {
      const viejo = w.getBE(q.x, q.y, q.z);
      if (viejo && viejo.type === 'olla') { if (viejo.carga) g.entities.dropItem(CARBON, viejo.carga, q.x + 0.5, q.y + 0.5, q.z + 0.5); w.setBE(q.x, q.y, q.z, null); }
      L.splice(i, 1);
      continue;
    }
    if (Math.hypot(q.x - p.x, q.z - p.z) > 60) continue;
    const be = w.getBE(q.x, q.y, q.z);
    if (!be || !be.carga) continue;
    q.cd = (q.cd || 0) - 1;
    if (q.cd > 0) continue;
    let pego = 0;
    for (const m of g.entities.mobs) {
      if (m.dead || m.dying || !(m.kind.hostile || m.kind.legend) || m.kind.flying || m.data.comensalFn || m.type === 'cadejos_blanco') continue;
      if (Math.hypot(m.body.pos.x - q.x - 0.5, m.body.pos.z - q.z - 0.5) > RADIO || Math.abs(m.body.pos.y - q.y) > 3) continue;
      const antes = m.health;
      m.hurt(DANO, q.x + 0.5, q.z + 0.5);
      if (m.dying) g.killedMob(m);
      if (m.health < antes) pego++;
    }
    if (!pego) continue;
    q.cd = 4;
    w.setBE(q.x, q.y, q.z, { ...be, carga: be.carga - 1 });
    g.particles.burst(q.x + 0.5, q.y + 1, q.z + 0.5, [[0.9, 0.95, 1], [1, 1, 1], [1, 0.6, 0.2]], 28, 3.4);
    g.audio.play('splash', { pos: { x: q.x + 0.5, y: q.y + 1, z: q.z + 0.5 }, vol: 0.8 });
    g.achieve('olla', 'Como en los castillos, pero con frijoles');
    if (be.carga === 1) g.ui.toast('🍲 Se acabó el carbón de una olla', 2200);
  }
}
// el alambre: al que lo pisa lo enreda y le duele, y a uno no le hace nada
function tickAlambre(g) {
  const w = g.world, p = g.player.body.pos;
  for (const m of g.entities.mobs) {
    if (m.dead || m.dying || !m.kind.hostile || m.kind.flying || m.data.comensalFn) continue; // las leyendas no se enredan
    if (Math.hypot(m.body.pos.x - p.x, m.body.pos.z - p.z) > 48) continue;
    const x = Math.floor(m.body.pos.x), y = Math.floor(m.body.pos.y + 0.1), z = Math.floor(m.body.pos.z);
    if (w.getBlock(x, y, z) !== K.alambre) continue;
    m.data.enredo = 2;
    m.hurt(2, x + 0.5, z + 0.5);
    if (m.dying) g.killedMob(m);
    g.particles.burst(x + 0.5, y + 0.5, z + 0.5, [[0.5, 0.5, 0.55], [0.7, 0.1, 0.1]], 5, 1);
    if (Math.random() < 0.08) { w.setBlock(x, y, z, AIR); g.audio.material('metal', 'dig', { x: x + 0.5, y: y + 0.5, z: z + 0.5 }); }
    g.achieve('alambre', 'Propiedad privada');
  }
}
// la gente de la casa, en plena pelea
const GRITOS = {
  tino: ['¡Yo le pego la puerta!', '¡Aguante, que ya casi!', '¡Hágase a un lado, que aquí hay clavos!'],
  flor: ['Venga para acá, que está sangrando.', 'No se mueva. Esto no le va a gustar.', 'Tome. Y no me discuta.'],
  chepa: ['¡Coma algo, que así no se puede pelear!', '¡Tome, que todavía está caliente!', '¡Con el estómago vacío no gana nadie!'],
};
const dicho = (L) => L[Math.floor(Math.random() * L.length)];
export function ayudaEnPelea(g, k, m, P) {
  const pelea = g.asedio || g.nocheLarga || g.rey; // v12.16.5: también la Noche del Rey (g.rey)
  if (!pelea) return;
  const J = g.player, cerca = Math.hypot(m.body.pos.x - J.body.pos.x, m.body.pos.z - J.body.pos.z) < 22;
  P.ayudaT = (P.ayudaT || 0) - 1;
  if (P.ayudaT > 0 || !cerca || !J.alive) return;
  const mejor = (P.nivel || 1) >= 2;
  if (k === 'flor' && J.health < J.maxHealth * 0.5) {
    J.health = Math.min(J.maxHealth, J.health + (mejor ? 10 : 6));
    delete J.effects.sangrando; delete J.effects.veneno;
    P.ayudaT = mejor ? 35 : 50;
    g.particles.burst(J.body.pos.x, J.body.pos.y + 1, J.body.pos.z, [[0.5, 1, 0.5], [1, 1, 0.8]], 14, 2);
    decir(g, m, dicho(GRITOS.flor), 3);
  } else if (k === 'chepa' && J.food < 12) {
    J.food = Math.min(20, J.food + (mejor ? 10 : 7));
    P.ayudaT = mejor ? 40 : 60;
    g.audio.play('eat', { ui: true, vol: 0.5 });
    decir(g, m, dicho(GRITOS.chepa), 3);
  } else if (k === 'tino' && pelea.puertas && pelea.puertas.size) {
    let arreglo = false;
    for (const [c, v] of pelea.puertas) {
      const [x, y, z] = c.split(',').map(Number), be = g.world.getBE(x, y, z), tope = be && be.tranca ? 16 : 8;
      if (v < tope) { pelea.puertas.set(c, Math.min(tope, v + (mejor ? 4 : 2))); arreglo = true; }
    }
    if (!arreglo) return;
    P.ayudaT = 20;
    g.audio.play('yunque', { pos: m.soundPos(), vol: 0.6 });
    decir(g, m, dicho(GRITOS.tino), 3);
  }
}
// cada segundo
export function tickDefensa(g) {
  if (g.mode !== 'survival' || g.dim !== 'tierra' || !g.meta) return;
  tickOllas(g);
  tickAlambre(g);
}
