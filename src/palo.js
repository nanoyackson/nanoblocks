// El palo encebado: en los días de fiesta, de día, en la plaza del pueblo paran un palo alto untado de grasa con un premio arriba.
// Se sube a puro brinco (Espacio, una y otra vez), pero la grasa le hace resbalar todo el tiempo. Quien llega arriba, se lo lleva.
// Estado: g.palo (no se guarda), meta.paloDia (premio ya ganado), meta.paloAviso (día del aviso).
import * as THREE from 'three';
import { SOLID } from './blocks.js';
import { fiestaHoy } from './fiestas2.js';
import { disposeModel } from './models.js';

const ALTO = 7, COLON = 360, PREMIOS = [[263, 2], [421, 2], [298, 2], [499, 1], [380, 1]];
const deDia = (g) => { const t = g.time || 0; return t > 0.03 && t < 0.42; }; // con la hora, no con la luz (un relámpago la sube)
function armar(g, v) {
  const x = Math.floor(v.x) + 6, z = Math.floor(v.z) + 2;
  let y = Math.floor(v.y || g.player.body.pos.y) + 8;
  while (y > 1 && !SOLID[g.world.getBlock(x, y - 1, z)]) y--;
  const grupo = new THREE.Group();
  const madera = new THREE.MeshBasicMaterial({ color: 0x8a6438 });
  const palo = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, ALTO, 8), madera);
  palo.position.y = ALTO / 2; grupo.add(palo);
  // el brillo de la grasa
  const grasa = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.23, ALTO * 0.9, 8), new THREE.MeshBasicMaterial({ color: 0xf0e0b0, transparent: true, opacity: 0.25 }));
  grasa.position.y = ALTO * 0.45; grupo.add(grasa);
  // arriba: el premio en un saco y una banderita tica
  const saco = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.4, 0.45), new THREE.MeshBasicMaterial({ color: 0xc8a868 }));
  saco.position.y = ALTO + 0.2; grupo.add(saco);
  const bandera = new THREE.Group(); bandera.position.set(0, ALTO + 0.8, 0);
  const fr = [0x1a3aa8, 0xf4f4f4, 0xd02020, 0xf4f4f4, 0x1a3aa8];
  fr.forEach((c, i) => { const f = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.08, 0.02), new THREE.MeshBasicMaterial({ color: c })); f.position.set(0.32, 0.18 - i * 0.08 - (i > 2 ? 0.04 : i === 2 ? 0.02 : 0), 0); bandera.add(f); });
  bandera.children[2].scale.y = 2; // la franja roja es más ancha
  const asta = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.7, 0.03), madera); asta.position.y = 0.05; bandera.add(asta);
  grupo.add(bandera);
  grupo.position.set(x + 0.5, y, z + 0.5);
  g.scene.add(grupo);
  g.palo = { x: x + 0.5, y, z: z + 0.5, grupo, bandera, sube: 0, quieto: 0 };
}
export function quitarPalo(g) {
  const P = g.palo;
  if (!P) return;
  if (P.sube > 0) g.sinCaida = (g.clock || 0) + 4; // si estaba trepando, que no cobre la caída
  g.scene.remove(P.grupo); disposeModel(P.grupo);
  g.palo = null;
}
// ¿puede trepar ahora? (ni a caballo, ni en la tirolesa, ni en el modo foto, ni dormido, ni muerto)
const libre = (g) => g.player.alive && !g.riding && !g.zip && !g.foto && !g.sleeping && !g.sentado && g.mode === 'survival';
// cada segundo: lo paran y lo quitan
export function tickPalo(g) {
  if (g.dim !== 'tierra') { quitarPalo(g); return; }
  const p = g.player.body.pos, dia = !!fiestaHoy(g) && deDia(g);
  if (g.palo && ((!dia && !g.palo.prueba) || Math.hypot(p.x - g.palo.x, p.z - g.palo.z) > 90)) { quitarPalo(g); return; }
  if (g.palo || !dia) return;
  const v = g.nearestVillage(p.x, p.z);
  if (!v || v.dist > 50 || !g.world.isLoaded(v.v.x + 6, v.v.z + 2)) return;
  armar(g, v.v);
  const M = g.meta, hoy = g.day || 1;
  if (g.mode === 'survival' && (M.paloDia || 0) !== hoy && M.paloAviso !== hoy) { M.paloAviso = hoy; g.ui.toast('🎪 En la plaza pararon el palo encebado. Arriba hay premio: súbase a brincos (Espacio)', 4200); }
}
// Espacio: si uno está pegado al palo, brinca para arriba (lo llama onKeyDown)
export function brincoPalo(g) {
  const P = g.palo;
  if (!P || !libre(g)) return false;
  const p = g.player.body.pos;
  if (Math.hypot(p.x - P.x, p.z - P.z) > 1.1 || p.y > P.y + ALTO + 1 || p.y < P.y - 0.5) return false;
  if ((g.meta.paloDia || 0) === (g.day || 1)) {
    if (!P.yaDijo) { P.yaDijo = true; g.ui.toast('🎪 El premio de hoy ya se lo llevó usted. Mañana hay más fiesta', 1800); }
    return false;
  }
  P.sube = Math.min(ALTO, P.sube + 0.5);
  P.quieto = 0;
  g.audio.play('swish', { ui: true, vol: 0.25, pitch: 1.5 });
  return true;
}
// cada cuadro: la grasa le hace resbalar, y arriba está el premio
export function cuadroPalo(g, dt) {
  const P = g.palo;
  if (!P) return;
  P.bandera.rotation.y = Math.sin((g.clock || 0) * 2) * 0.4;
  if (P.sube <= 0) return;
  const b = g.player.body;
  if (!libre(g)) { P.sube = 0; g.sinCaida = (g.clock || 0) + 4; return; }
  P.quieto += dt;
  // resbala: más rápido entre más arriba y si uno deja de brincar
  P.sube = Math.max(0, P.sube - dt * (0.8 + P.sube * 0.09 + (P.quieto > 0.5 ? 1.5 : 0)));
  g.sinCaida = (g.clock || 0) + 2; // resbalar del palo no es caerse
  const a = Math.atan2(b.pos.x - P.x, b.pos.z - P.z) || 0;
  const nx = P.x + Math.sin(a) * 0.45, ny = P.y + P.sube, nz = P.z + Math.cos(a) * 0.45, hw = b.w / 2;
  // si ahí hay un bloque (un árbol, algo construido), se suelta del palo
  if (b.boxHitsSolid(g.world, nx - hw, ny + 0.05, nz - hw, nx + hw, ny + b.h, nz + hw)) { P.sube = 0; g.sinCaida = (g.clock || 0) + 4; return; }
  b.pos.x = nx; b.pos.z = nz; b.pos.y = ny; b.vel.x = b.vel.z = 0; b.vel.y = 0;
  b.fallStart = null; // trepando no hay caída que cobrar
  if (Math.random() < dt * 8) g.particles.spawn(b.pos.x, b.pos.y + 0.2, b.pos.z, [0.95, 0.88, 0.6], 0, -1, 0, 0.5, 6);
  if (P.sube >= ALTO - 0.05) {
    P.sube = 0;
    g.meta.paloDia = g.day || 1;
    b.pos.y = P.y; b.fallStart = null; // baja al pie del palo, ya con el premio
    const [id, n] = PREMIOS[Math.floor(Math.random() * PREMIOS.length)];
    g.giveItem(COLON, 30); g.giveItem(id, n);
    g.audio.play('aplausos', { ui: true, vol: 0.8 });
    g.ui.toast('🎪 ¡Llegó arriba del palo encebado! Aplausos, ₡30 y lo que había en el saco', 3600);
    g.achieve('palo_encebado', 'Arriba del palo encebado');
  }
}
export function pruebaPalo(g) {
  quitarPalo(g);
  const p = g.player.body.pos, d = g.player.lookDir();
  armar(g, { x: p.x + d.x * 3 - 6, z: p.z + d.z * 3 - 2, y: p.y });
  g.palo.prueba = true; // el de prueba no se quita aunque no sea fiesta
  g.meta.paloDia = 0;
  return 'Un palo encebado delante: péguese a él y brinque (Espacio) una y otra vez';
}
