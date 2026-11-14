// El alfarero ambulante (v11.10.7): de vez en cuando, de día, un alfarero pasa por la plaza del pueblo con su carretillo de
// barro y vende chanchitos pintados a mano, caros (es trabajo de semanas). Uno por visita. A los cuatro minutos sigue su camino.
// Clic derecho para que ofrezca y otro para comprar (paga la billetera). Estado: g.alfarero (no se guarda), meta.alfareroDia.
import * as THREE from 'three';
import { SOLID, BLOCK_BY_KEY as K } from './blocks.js';
import { disposeModel } from './models.js';
import { decir } from './misiones.js';

const COLON = 360, PRECIO = 140, QUEDA = 240, CADA = 4; // ₡70 000; como mucho una visita cada cuatro días
function carretillo() {
  const g = new THREE.Group(), mb = (c) => new THREE.MeshBasicMaterial({ color: c });
  const c = (w, h, d, col, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mb(col)); m.position.set(x, y, z); g.add(m); return m; };
  c(0.9, 0.08, 1.3, 0x7a5232, 0, 0.45, 0); // la tabla
  for (const sx of [-1, 1]) c(0.06, 0.3, 1.3, 0x6a4628, sx * 0.45, 0.6, 0);
  c(0.12, 0.42, 0.42, 0x2a2a2a, 0, 0.21, 0.55); // la rueda
  for (const sx of [-1, 1]) c(0.05, 0.05, 0.9, 0x6a4628, sx * 0.3, 0.55, -0.95); // las varas
  // la carga: ollas, una tinaja y dos chanchitos pintados
  c(0.3, 0.26, 0.3, 0xb85c34, -0.2, 0.62, -0.3); c(0.28, 0.36, 0.28, 0xa04a2a, 0.2, 0.67, -0.25);
  c(0.26, 0.2, 0.36, 0xc86a3c, -0.15, 0.6, 0.25); c(0.18, 0.04, 0.37, 0xf2e4c4, -0.15, 0.66, 0.25);
  c(0.26, 0.2, 0.36, 0xbc5e38, 0.2, 0.6, 0.2); c(0.18, 0.04, 0.37, 0xf0c040, 0.2, 0.66, 0.2);
  return g;
}
function suelo(g, x, z) { let y = 120; while (y > 1 && !SOLID[g.world.getBlock(Math.floor(x), y - 1, Math.floor(z))]) y--; return y; }
export function limpiarAlfarero(g) {
  const A = g.alfarero;
  if (!A) return;
  g.scene.remove(A.carro); disposeModel(A.carro);
  if (A.m && !A.m.dead) A.m.dead = true;
  g.alfarero = null;
}
function llegar(g, v) {
  const x = v.x + 4 + Math.random() * 3, z = v.z + 2 + Math.random() * 3, y = suelo(g, x, z);
  const m = g.entities.spawnMob('vecino', x, y + 0.1, z);
  if (!m) return false;
  Object.assign(m.data, { role: 'vecino', name: 'Don Ubaldo, alfarero', alfarero: true, seed: 7307, home: { x: Math.floor(x), y, z: Math.floor(z) }, plaza: { x: Math.floor(x), y, z: Math.floor(z) }, vid: 'alfarero' });
  if (m.kind.dress) m.kind.dress(m);
  const carro = carretillo(); carro.position.set(x + 1.2, y, z); g.scene.add(carro);
  g.alfarero = { m, carro, t: 0, x, z, vendido: false };
  g.meta.alfareroDia = g.day || 1;
  decir(g, m, '¡Ollas, tinajas y chanchitos pintados a mano! ¡Barro del bueno, hecho en el taller!', 4);
  if (Math.hypot(g.player.body.pos.x - x, g.player.body.pos.z - z) < 70) g.ui.toast('🏺 Pasó por la plaza Don Ubaldo, el alfarero: trae chanchitos de barro (clic derecho)', 4600);
  return true;
}
// cada segundo
export function tickAlfarero(g) {
  const A = g.alfarero;
  if (A) {
    A.t++;
    if (g.dim !== 'tierra' || A.t > QUEDA || !A.m || A.m.dead || Math.hypot(g.player.body.pos.x - A.x, g.player.body.pos.z - A.z) > 140) {
      if (A.m && !A.m.dead && A.t > QUEDA) decir(g, A.m, 'Bueno, me voy, que el camino es largo. ¡Pura vida!', 3);
      limpiarAlfarero(g);
    }
    return;
  }
  const t = g.time || 0, d = g.day || 1, M = g.meta;
  if (!M || g.dim !== 'tierra' || g.mode !== 'survival' || t < 0.3 || t > 0.55 || d - (M.alfareroDia || -99) < CADA || Math.random() > 1 / 90) return;
  const v = g.nearestVillage && g.nearestVillage(g.player.body.pos.x, g.player.body.pos.z);
  if (!v || Math.hypot(v.x - g.player.body.pos.x, v.z - g.player.body.pos.z) > 90) return;
  llegar(g, v);
}
// clic derecho a Don Ubaldo: el primero ofrece, el segundo compra
export function alfareroInteract(m, g) {
  if (!m.data.alfarero) return false;
  const A = g.alfarero;
  if (!A || A.m !== m) return false;
  if (A.vendido) { decir(g, m, 'Diay, ya se me acabaron los chanchitos. Las ollas no se las vendo, que son encargadas.', 3); return true; }
  if (!A.oferta) {
    A.oferta = true;
    decir(g, m, `Un chanchito de barro, pintado a mano. Lo que echa ahí lo encuentra en cualquier chanchito suyo, y no se pierde nunca. Son ${PRECIO} colones, que es trabajo de semanas. (otro clic para llevárselo)`, 6);
    return true;
  }
  if (g.inventory.count(COLON) < PRECIO) { decir(g, m, `Son ${PRECIO} colones, mi estimado. Junte y la próxima vez que pase se lo guardo.`, 3.5); return true; }
  g.inventory.remove(COLON, PRECIO);
  g.giveItem(K.chanchito, 1);
  A.vendido = true;
  g.audio.play('monedas', { ui: true, vol: 0.6 });
  decir(g, m, '¡Que le dure! Y no lo quiebre, que el barro no perdona… aunque lo de adentro sí se salva.', 3.5);
  g.achieve('alfarero', 'Le compré al alfarero');
  return true;
}
export function pruebaAlfarero(g) {
  limpiarAlfarero(g);
  const p = g.player.body.pos;
  return llegar(g, { x: p.x + 2, z: p.z + 2 }) ? 'Don Ubaldo, el alfarero, llegó a la par suya' : 'No se pudo poner al alfarero aquí';
}
