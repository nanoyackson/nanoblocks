// Criaturas con estrellas (v5.5): de noche, desde el día 4, a veces sale una versión más brava de una criatura hostil común. Se
// reconoce por las estrellas doradas que flotan sobre la cabeza y porque es más grande:
// · ⭐: el doble de vida, pega 1.5 veces más, un 15 % más grande, suelta el doble y da el doble de experiencia.
// · ⭐⭐ (desde el día 9): 3.5 veces la vida, pega el doble, un 30 % más grande, suelta el triple y da el triple de experiencia.
// Los jefes, las leyendas y los bichitos (zancudos, vampiros) no tienen estrellas. Estado: m.data.estrellas.
import * as THREE from 'three';

const NO = new Set(['zancudo', 'vampiro', 'murcielago', 'hongo_reventon']);
const MATS = {};
function insignia(n) {
  if (MATS[n]) { const s = new THREE.Sprite(MATS[n]); s.scale.set(n > 1 ? 0.9 : 0.6, 0.4, 1); s.userData.glow = true; return s; }
  const c = document.createElement('canvas'); c.width = 64; c.height = 32;
  const x = c.getContext('2d');
  x.font = 'bold 26px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.lineWidth = 5; x.strokeStyle = '#3a2400'; x.fillStyle = n > 1 ? '#ffd040' : '#ffe680';
  const t = n > 1 ? '★★' : '★';
  x.strokeText(t, 32, 17); x.fillText(t, 32, 17);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  MATS[n] = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, fog: false }); // uno solo por clase de estrella, para todas
  const s = new THREE.Sprite(MATS[n]);
  s.scale.set(n > 1 ? 0.9 : 0.6, 0.4, 1); s.userData.glow = true;
  return s;
}
// la llama la aparición de criaturas de noche (entities.js)
export function quizaEstrellas(g, m) {
  if (!m || g.mode !== 'survival' || !m.kind.hostile || m.kind.boss || m.kind.legend || NO.has(m.type) || g.daylight > 0.35) return;
  const dia = g.day || 1;
  if (dia < 4) return;
  const r = Math.random(), p2 = dia >= 9 ? Math.min(0.08, (dia - 8) * 0.01) : 0, p1 = Math.min(0.22, (dia - 3) * 0.02);
  const n = r < p2 ? 2 : r < p2 + p1 ? 1 : 0;
  if (!n) return;
  ponerEstrellas(m, n);
}
export function ponerEstrellas(m, n) {
  m.data.estrellas = n;
  m.health *= n > 1 ? 3.5 : 2;
  m.data.vmax = m.health;
  m.data.fuerza = (m.data.fuerza || 1) * (n > 1 ? 2 : 1.5);
  const u = m.group.userData, antes = u.babyScale || 1;
  u.babyScale = antes * (n > 1 ? 1.3 : 1.15);
  m.escHit = n > 1 ? 1.3 : 1.15; // la caja de golpe crece con el cuerpo (flechas y mira)
  const s = insignia(n);
  s.position.y = (m.kind.h || 1.8) / antes + 0.6; // en el espacio del modelo (antes de escalarlo)
  m.group.add(s);
}
// /prueba estrellas: una Sombra de una estrella y otra de dos, delante
export function pruebaEstrellas(g) {
  const p = g.player.body.pos, d = g.player.lookDir();
  [1, 2].forEach((n, i) => { const m = g.entities.spawnMob('sombra', p.x + d.x * 6 + (i ? 1.5 : -1.5) * -d.z, p.y + 0.3, p.z + d.z * 6 + (i ? 1.5 : -1.5) * d.x); if (m) { m.data.apuro = true; ponerEstrellas(m, n); } });
  return 'Una Sombra ★ y una ★★ delante';
}
