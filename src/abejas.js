// El enjambre de abejas africanizadas (v7.5): de día, en el bosque, el bosque seco, la selva o los llanos, a veces uno pasa cerca de
// donde tienen el panal y sale el enjambre. Se oye el zumbido, la nube amarilla y negra lo persigue a uno más rápido que caminando,
// y adentro de la nube pican sin parar. Con el arma solo se espantan unas cuantas (cada golpe le baja un poco). Lo que sirve:
// · tirarse al agua y quedarse abajo: el enjambre pierde el rastro y se va;
// · el humo: una antorcha en la mano o una fogata a 4 bloques las mantienen a raya (no se acercan);
// · correr lejos: si uno le saca 30 bloques, se devuelven al panal.
// Estado: el mob 'enjambre' (no se guarda), meta.abejasDia.
import * as THREE from 'three';
import { BLOCKS, BLOCK_BY_KEY as K } from './blocks.js';
import { difOf } from './supervivencia.js';

const N = 46;
const HUMO = new Set(['fogata', 'stove', 'furnace_lit'].map((k) => K[k]).filter(Boolean)); // lo que echa humo de verdad
const MAT = new THREE.Matrix4(), Q = new THREE.Quaternion(), EU = new THREE.Euler(), UNO = new THREE.Vector3(1, 1, 1), PV = new THREE.Vector3();
function humoCerca(g) {
  const held = g.inventory.held;
  if (held && held.id === K.torch) return true;
  const w = g.world, p = g.player.body.pos, x0 = Math.floor(p.x), y0 = Math.floor(p.y), z0 = Math.floor(p.z);
  for (let dx = -4; dx <= 4; dx++) for (let dz = -4; dz <= 4; dz++) for (let dy = -1; dy <= 2; dy++) if (HUMO.has(w.getBlock(x0 + dx, y0 + dy, z0 + dz))) return true;
  return false;
}
export const ENJAMBRE = {
  enjambre: {
    name: 'Enjambre de abejas africanizadas', w: 1.6, h: 1.6, health: 30, speed: 0, hostile: true, attack: 1, hurtSound: null, idleSound: null, idleEvery: [999, 999],
    particle: [[1, 0.85, 0.2], [0.15, 0.12, 0.05]], drops: [[279, 0, 1]], xp: 12, grupo: 'volador', noGravity: true,
    build() {
      const g = new THREE.Group();
      const geo = new THREE.BoxGeometry(0.13, 0.1, 0.16); // más grandes que de verdad, para que se vean de lejos
      const im = new THREE.InstancedMesh(geo, new THREE.MeshBasicMaterial({ color: 0xffffff }), N);
      const c = new THREE.Color();
      for (let i = 0; i < N; i++) im.setColorAt(i, c.setHex(i % 3 ? 0xe8b820 : 0x2a2010));
      im.instanceColor.needsUpdate = true; im.userData.glow = true;
      g.add(im);
      g.userData = { im, fases: Array.from({ length: N }, () => [Math.random() * 6.28, Math.random() * 6.28, 0.3 + Math.random() * 0.7, 2 + Math.random() * 3]) };
      return g;
    },
    update(m, dt) {
      const g = m.game, D = m.data, b = m.body.pos, pl = g.player.body.pos;
      D.apuro = true;
      D.t = (D.t || 0) + dt;
      const dx = pl.x - b.x, dz = pl.z - b.z, d = Math.hypot(dx, dz) || 1;
      const bajoAgua = g.player.body.headInWater || (g.player.body.inWater && g.player.sneaking);
      // se va: pierde el rastro en el agua, se cansa de seguirlo o lo dejaron atrás
      if (!D.vete && (D.t > 70 || d > 30 || g.mode !== 'survival' || !g.player.alive)) { D.vete = true; if (d <= 30 && D.t > 70) g.ui.toast('🐝 El enjambre se devolvió al panal', 1800); }
      if (bajoAgua) { D.agua = (D.agua || 0) + dt; if (D.agua > 3.5 && !D.vete) { D.vete = true; g.ui.toast('🐝 Debajo del agua le perdieron el rastro: el enjambre se fue', 2600); g.achieve('abejas_agua', 'Al agua, que vienen las abejas'); } } else D.agua = 0;
      let tx = pl.x, ty = pl.y + 0.2, tz = pl.z; // el centro de la nube (b) va a la altura de los pies: la caja de golpe cubre el cuerpo
      const humo = !D.vete && humoCerca(g);
      if (D.vete) { tx = b.x - dx * 3; tz = b.z - dz * 3; ty = b.y + 6; if ((D.fuera = (D.fuera || 0) + dt) > 6) { m.dead = true; g.audio.setEmitter('enjambre', 'loop.zancudo', null); return; } }
      else if (humo && d < 5) { tx = pl.x - (dx / d) * 5; tz = pl.z - (dz / d) * 5; if (!D.avisoHumo) { D.avisoHumo = true; g.ui.toast('🔥 El humo las mantiene a raya', 1600); } }
      else if (bajoAgua) ty = pl.y + 2.5; // se quedan zumbando encima del agua
      const v = D.vete ? 6 : 4.9, k = Math.min(1, dt * v / Math.max(0.5, Math.hypot(tx - b.x, ty - b.y, tz - b.z)));
      b.x += (tx - b.x) * k; b.y += (ty - b.y) * k; b.z += (tz - b.z) * k;
      m.body.vel.x = m.body.vel.y = m.body.vel.z = 0;
      m.group.position.set(b.x, b.y, b.z);
      // pican adentro de la nube
      const dentro = !D.vete && !bajoAgua && Math.hypot(pl.x - b.x, pl.y + 1 - (b.y + 0.8), pl.z - b.z) < 1.7;
      D.pica = (D.pica || 0) - dt;
      if (dentro && D.pica <= 0 && g.mode === 'survival') {
        D.pica = 0.55;
        g.damagePlayer(1, null, null, 'Picaduras de abejas africanizadas', true);
        g.addEffect('ardor', 6);
        if (!D.avisoPica) { D.avisoPica = true; g.ui.toast('🐝 ¡Abejas africanizadas! Al agua, o humo (una antorcha en la mano)', 3200); }
      }
      // el zumbido
      g.audio.setEmitter('enjambre', 'loop.zancudo', { x: b.x, y: b.y, z: b.z }, D.vete ? 0.2 : 0.75);
      // la nube: cada abeja da vueltas a su manera
      const u = m.group.userData;
      const vivas = Math.max(6, Math.round(N * (m.health / 30)));
      u.im.count = vivas;
      for (let i = 0; i < vivas; i++) {
        const [a, c, r, w] = u.fases[i], t = D.t * w;
        PV.set(Math.cos(a + t) * r * 1.3, 0.8 + Math.sin(c + t * 1.3) * r * 0.7, Math.sin(a + t * 0.9) * r * 1.3);
        EU.set(0, a + t, 0); Q.setFromEuler(EU);
        MAT.compose(PV, Q, UNO); u.im.setMatrixAt(i, MAT);
      }
      u.im.instanceMatrix.needsUpdate = true;
    },
    // cada golpe espanta unas cuantas (el arma no sirve de mucho)
    onHurt(m, g, dmg) {
      if (m.health - Math.min(dmg, 4) <= 0) { g.achieve('abejas_espantadas', 'Espanté el enjambre'); g.audio.setEmitter('enjambre', 'loop.zancudo', null); return true; }
      m.health -= Math.min(dmg, 4);
      m.data.golpeT = g.clock || 0;
      g.particles.burst(m.body.pos.x, m.body.pos.y, m.body.pos.z, [[1, 0.85, 0.2], [0.15, 0.12, 0.05]], 6, 2);
      return false;
    },
  },
};
// cada segundo: ¿pasa cerca de un panal?
export function tickAbejas(g) {
  if (!g.entities.mobs.some((m) => !m.dead && !m.dying && m.type === 'enjambre')) g.audio.setEmitter('enjambre', 'loop.zancudo', null); // que no quede zumbando
  if (g.mode !== 'survival' || g.dim !== 'tierra' || !g.settings.hostiles || !difOf(g).hostiles || g.daylight < 0.45 || (g.day || 1) < 3) return;
  if (g.meta.abejasDia === (g.day || 1) || Math.random() > 1 / 420) return;
  if (g.entities.mobs.some((m) => !m.dead && m.type === 'enjambre')) return;
  const p = g.player.body.pos, bio = g.world.gen.column(Math.floor(p.x), Math.floor(p.z)).biome;
  if (!['forest', 'bosque_seco', 'jungle', 'plains'].includes(bio)) return;
  // el panal está en un árbol: hacen falta hojas cerca
  const w = g.world, x0 = Math.floor(p.x), y0 = Math.floor(p.y), z0 = Math.floor(p.z);
  let hoja = null;
  for (let k = 0; k < 40 && !hoja; k++) { const x = x0 + Math.floor((Math.random() - 0.5) * 16), z = z0 + Math.floor((Math.random() - 0.5) * 16), y = y0 + 2 + Math.floor(Math.random() * 6); const B = BLOCKS[w.getBlock(x, y, z)]; if (B && B.leafy) hoja = { x, y, z }; }
  if (!hoja) return;
  sacarEnjambre(g, hoja.x + 0.5, hoja.y, hoja.z + 0.5);
}
function sacarEnjambre(g, x, y, z) {
  const m = g.entities.spawnMob('enjambre', x, y, z);
  if (!m) return null;
  m.data.provoked = true;
  g.meta.abejasDia = g.day || 1;
  g.ui.toast('🐝 Bzzzzz… ¡un enjambre de abejas africanizadas salió del árbol!', 3200);
  return m;
}
export function pruebaAbejas(g) {
  const p = g.player.body.pos, d = g.player.lookDir();
  sacarEnjambre(g, p.x + d.x * 8, p.y + 3, p.z + d.z * 8);
  return 'Un enjambre delante: al agua, o una antorcha en la mano';
}
