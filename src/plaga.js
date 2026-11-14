// La plaga de chapulines: de día, de vez en cuando baja una nube de chapulines sobre una siembra y se la va comiendo, mata por
// mata. Se espantan a puro escándalo (golpes al aire cerca de la nube, como quien pega latas), con el humo de una fogata cerca o
// soltándoles gallinas, que se los comen. Si no, se van solos cuando se llenan… y se llevan la cosecha.
// Estado: g.plaga (no se guarda), meta.plagaCd (día), meta.plagas.
import * as THREE from 'three';
import { BLOCKS } from './blocks.js';
import { anotar } from './diario.js';

const N = 140, DURA = 100, SUSTO = 14, FOGATA = 235;
let malla = null;

// las matas que se pueden comer: maíz, frijol, café y piña ya crecidos (la etapa 0 se queda)
const comible = (id) => { const b = BLOCKS[id]; return !!(b && b.crop && b.stage > 0 && BLOCKS[id - b.stage] && BLOCKS[id - b.stage].crop === b.crop); };
function matas(g, cx, cy, cz, r) {
  const L = [], w = g.world;
  for (let x = Math.floor(cx - r); x <= cx + r; x++) for (let z = Math.floor(cz - r); z <= cz + r; z++) for (let y = Math.floor(cy) - 4; y <= cy + 4; y++) {
    if (comible(w.getBlock(x, y, z))) L.push({ x, y, z });
  }
  return L;
}
const fogataCerca = (g, cx, cy, cz) => {
  for (let x = Math.floor(cx - 8); x <= cx + 8; x++) for (let z = Math.floor(cz - 8); z <= cz + 8; z++) for (let y = Math.floor(cy) - 3; y <= cy + 3; y++) if (g.world.getBlock(x, y, z) === FOGATA) return true;
  return false;
};
function soltar(g, L) {
  let sx = 0, sy = 0, sz = 0;
  for (const m of L) { sx += m.x; sy += m.y; sz += m.z; }
  const n = L.length;
  g.plaga = { x: sx / n + 0.5, y: sy / n + 1.6, z: sz / n + 0.5, cx: sx / n + 0.5, cz: sz / n + 0.5, t: DURA, come: 2, comidas: 0, susto: 0, swing: 0, avisoFogata: false };
  g.audio.play('aleteo', { ui: true, vol: 0.6, pitch: 1.6 });
  g.ui.toast('🦗 ¡Chapulines en la siembra! Espántelos: golpes al aire, humo o gallinas', 5000);
}
// cada segundo: ¿baja una plaga? (de día, sin llover, con siembra crecida cerca, y no más de una cada cuatro días)
export function tickPlaga(g) {
  if (g.plaga || g.dim !== 'tierra' || g.mode !== 'survival' || !g.meta || !g.player.alive) return;
  const M = g.meta, d = g.day || 1;
  if (d < 3 || (M.plagaCd || 0) > d || g.daylight < 0.5 || (g.weather && g.weather.type !== 'clear') || Math.random() > 1 / 240) return;
  const p = g.player.body.pos, L = matas(g, p.x, p.y, p.z, 16);
  if (L.length < 6) return;
  M.plagaCd = d + 4 + Math.floor(Math.random() * 3);
  soltar(g, L);
}
// cada cuadro: la nube revolotea, come y se asusta
export function cuadroPlaga(g, dt) {
  const P = g.plaga;
  if (!P || g.dim !== 'tierra') { if (malla) malla.count = 0; if (P) limpiarPlaga(g); return; }
  const p = g.player.body.pos, t = g.clock || 0;
  P.t -= dt;
  // se mueve hacia la mata que se está comiendo, despacito
  if (P.meta) { P.x += (P.meta.x + 0.5 - P.x) * Math.min(1, dt * 0.8); P.z += (P.meta.z + 0.5 - P.z) * Math.min(1, dt * 0.8); P.y += (P.meta.y + 1.4 - P.y) * Math.min(1, dt * 0.8); }
  const dist = Math.hypot(p.x - P.x, p.z - P.z);
  // el escándalo: cada golpe al aire cerca de la nube la asusta
  if ((g.swing || 0) > P.swing + 0.5 && dist < 7) { P.susto += 1; g.particles.burst(P.x, P.y, P.z, [[0.5, 0.55, 0.2], [0.4, 0.3, 0.15]], 6, 1.2); }
  P.swing = g.swing || 0;
  // el humo y las gallinas
  P.revisa = (P.revisa || 0) - dt;
  if (P.revisa <= 0) {
    P.revisa = 1;
    if (fogataCerca(g, P.cx, P.y, P.cz)) { P.susto += 1; if (!P.avisoFogata) { P.avisoFogata = true; g.ui.toast('🔥 El humo de la fogata los atonta: ya se van yendo', 2400); } }
    for (const m of g.entities.mobs) {
      if (m.type !== 'gallina' || m.dead || m.dying) continue;
      const dm = Math.hypot(m.body.pos.x - P.x, m.body.pos.z - P.z);
      if (dm < 14) { m.goTo(P.x, P.z, 1.3); if (dm < 3) { P.susto += 0.6; if (Math.random() < 0.3) g.audio.play('gallina', { pos: m.soundPos(), vol: 0.6 }); } }
    }
  }
  // come: cada tantos segundos, una mata baja a la etapa de recién sembrada
  P.come -= dt;
  if (P.come <= 0) {
    P.come = 2.4;
    const L = matas(g, P.cx, P.y, P.cz, 9);
    if (!L.length) { P.t = Math.min(P.t, 0); }
    else {
      const m = L.reduce((a, b) => (Math.hypot(b.x - P.x, b.z - P.z) < Math.hypot(a.x - P.x, a.z - P.z) ? b : a));
      const id = g.world.getBlock(m.x, m.y, m.z), b = BLOCKS[id];
      g.world.setBlock(m.x, m.y, m.z, id - b.stage);
      g.particles.burst(m.x + 0.5, m.y + 0.6, m.z + 0.5, [[0.35, 0.6, 0.2], [0.55, 0.7, 0.25]], 10, 1);
      P.comidas++; P.meta = m;
    }
  }
  g.audio.setEmitter('chapulines', 'loop.chicharras', dist < 40 ? { x: P.x, y: P.y, z: P.z } : null, 0.75);
  if (P.susto >= SUSTO) {
    g.ui.toast(`🦗 ¡Se fueron los chapulines! Solo alcanzaron a comerse ${P.comidas} mata${P.comidas === 1 ? '' : 's'}`, 3600);
    g.achieve('chapulines', 'Espanté la plaga de chapulines');
    if (P.comidas <= 2) g.achieve('chapulines_rapido', 'Ni probaron la siembra');
    anotar(g, 'Bajó una nube de chapulines sobre la siembra y la espanté.', '🦗');
    g.meta.plagas = (g.meta.plagas || 0) + 1;
    limpiarPlaga(g);
    return;
  }
  if (P.t <= 0) {
    g.ui.toast(P.comidas ? `🦗 Los chapulines se fueron, bien llenos: se comieron ${P.comidas} mata${P.comidas === 1 ? '' : 's'}. Toca resembrar` : '🦗 Los chapulines se fueron a buscar otra siembra', 3600);
    limpiarPlaga(g);
    return;
  }
  dibujar(g, P, t, dist);
}
function dibujar(g, P, t, dist) {
  if (!malla || malla.parent !== g.scene) {
    malla = new THREE.InstancedMesh(new THREE.BoxGeometry(0.2, 0.07, 0.08), new THREE.MeshBasicMaterial({ color: 0x9a8a32 }), N);
    malla.frustumCulled = false; malla.count = 0; g.scene.add(malla);
    malla.userData.semillas = Array.from({ length: N }, () => ({ r: Math.random() ** 0.6 * 3.4, a: Math.random() * Math.PI * 2, h: (Math.random() - 0.5) * 2.2, f: Math.random() * 10, w: 1.5 + Math.random() * 2.5 }));
  }
  if (dist > 70) { malla.count = 0; return; }
  const k = dibujar, m4 = k.m4 || (k.m4 = new THREE.Matrix4()), q = k.q || (k.q = new THREE.Quaternion()), e = k.e || (k.e = new THREE.Euler()), v = k.v || (k.v = new THREE.Vector3()), s = k.s || (k.s = new THREE.Vector3(1, 1, 1));
  // entre más asustada, más se abre la nube
  const abre = 1 + Math.min(1.2, P.susto / SUSTO);
  let n = 0;
  for (const S of malla.userData.semillas) {
    const a = S.a + t * S.w * 0.6, r = S.r * abre + Math.sin(t * 2 + S.f) * 0.4;
    v.set(P.x + Math.cos(a) * r, P.y + S.h + Math.sin(t * 9 + S.f) * 0.25, P.z + Math.sin(a) * r);
    e.set(0, -a, Math.sin(t * 30 + S.f) * 0.3); q.setFromEuler(e); m4.compose(v, q, s);
    malla.setMatrixAt(n++, m4);
  }
  malla.count = n;
  malla.instanceMatrix.needsUpdate = true;
}
export function marcaPlaga(g) { return g.plaga && g.dim === 'tierra' ? { x: g.plaga.x, z: g.plaga.z } : null; }
export function limpiarPlaga(g) { g.plaga = null; if (malla) malla.count = 0; if (g.audio) g.audio.setEmitter('chapulines', null, null); }
export function pruebaPlaga(g) {
  limpiarPlaga(g);
  const p = g.player.body.pos, d = g.player.lookDir(), n = Math.hypot(d.x, d.z) || 1;
  // una milpa de maíz crecido delante, para que tengan qué comer
  const cx = Math.floor(p.x + (d.x / n) * 6), cz = Math.floor(p.z + (d.z / n) * 6), w = g.world;
  for (let dx = -3; dx <= 3; dx++) for (let dz = -3; dz <= 3; dz++) {
    let y = Math.floor(p.y) + 4;
    while (y > 1 && w.getBlock(cx + dx, y - 1, cz + dz) === 0) y--;
    w.setBlock(cx + dx, y - 1, cz + dz, 44); w.setBlock(cx + dx, y, cz + dz, 48);
  }
  const L = matas(g, cx, p.y, cz, 5);
  if (!L.length) return 'No se pudo sembrar aquí: pruébelo en terreno plano';
  soltar(g, L);
  return `Una milpa de ${L.length} matas delante y la nube encima. Espántelos con golpes al aire, humo o gallinas`;
}
