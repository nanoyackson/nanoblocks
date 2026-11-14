// Incendio en el pueblo: muy de vez en cuando se prende una casa (una plantilla que se quedó encendida, dicen). Llamas, humo, la
// gente que grita y sale corriendo. Uno puede apagarla a baldazos de agua (clic derecho con el balde lleno sobre las llamas). Si no,
// al rato llegan los Bomberos de Tiquicia (ficticios) con su camión, la sirena y la manguera. Las llamas son de ver: no queman
// bloques. Estado: g.incendio (no se guarda), meta.incendioCd (día).
import * as THREE from 'three';
import { SOLID } from './blocks.js';
import { decir } from './misiones.js';
import { disposeModel } from './models.js';
import { anotar } from './diario.js';

const COLON = 360, LLEGAN = 75;
let llamas = null;
function focosDe(g, casa) {
  const w = g.world, F = [];
  for (let dx = -4; dx <= 4; dx++) for (let dz = -4; dz <= 4; dz++) for (let dy = 0; dy <= 6; dy++) {
    const x = casa.x + dx, y = casa.y + dy, z = casa.z + dz;
    if (!SOLID[w.getBlock(x, y, z)]) continue;
    // la cara de afuera de una pared o el techo: donde se ve el fuego
    if (SOLID[w.getBlock(x, y + 1, z)] && SOLID[w.getBlock(x + 1, y, z)] && SOLID[w.getBlock(x - 1, y, z)] && SOLID[w.getBlock(x, y, z + 1)] && SOLID[w.getBlock(x, y, z - 1)]) continue;
    if (Math.random() < 0.3) F.push({ x: x + 0.5, y: y + 1, z: z + 0.5, vivo: true, k: Math.random() * 6 });
  }
  return F.slice(0, 26);
}
function camion() {
  const g = new THREE.Group(), mb = (c) => new THREE.MeshBasicMaterial({ color: c });
  const c = (w, h, d, col, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mb(col)); m.position.set(x, y, z); g.add(m); return m; };
  c(2.2, 1.2, 5.6, 0xc81a1a, 0, 1.1, 0); c(2.2, 1, 1.6, 0xd82a2a, 0, 2.1, 2); c(2, 0.5, 0.05, 0x9ad0f0, 0, 2.2, 2.82); // la cabina y el vidrio
  c(2.25, 0.18, 5.65, 0xf0f0f0, 0, 1.35, 0); // la franja blanca
  for (const [x, z] of [[-1.05, 1.8], [1.05, 1.8], [-1.05, -1.8], [1.05, -1.8]]) c(0.3, 0.8, 0.8, 0x1a1a1a, x, 0.4, z);
  c(0.25, 0.25, 4.4, 0xc0c0c8, 0.6, 1.95, -0.6); c(0.25, 0.25, 4.4, 0xc0c0c8, -0.6, 1.95, -0.6); // la escalera
  for (let i = 0; i < 8; i++) c(1.2, 0.08, 0.08, 0xc0c0c8, 0, 1.95, -2.6 + i * 0.55);
  const luces = [c(0.4, 0.2, 0.3, 0xff2020, -0.5, 2.7, 2), c(0.4, 0.2, 0.3, 0x2050ff, 0.5, 2.7, 2)];
  g.userData = { luces };
  return g;
}
function llegarCamion(g, I) {
  const p = I.casa, a = Math.random() * Math.PI * 2, x = p.x + Math.cos(a) * 9, z = p.z + Math.sin(a) * 9;
  let y = p.y + 6; while (y > 1 && !SOLID[g.world.getBlock(Math.floor(x), y - 1, Math.floor(z))]) y--;
  const cam = camion(); cam.position.set(x, y, z); cam.rotation.y = Math.atan2(p.x - x, p.z - z);
  g.scene.add(cam); I.camion = cam; I.chorro = { x, y: y + 2.2, z };
  g.ui.toast('🚒 ¡Llegaron los Bomberos de Tiquicia (ficticios)! Sirena, manguera y a echarle agua', 4200);
  g.audio.play('pito', { pos: { x, y, z }, vol: 1, pitch: 0.8 });
}
export function limpiarIncendio(g) {
  const I = g.incendio;
  if (llamas) llamas.count = 0;
  if (!I) return;
  if (I.camion) { g.scene.remove(I.camion); disposeModel(I.camion); }
  g.audio.setEmitter('incendio', null, null);
  g.incendio = null;
}
function empezar(g, casa, duenno) {
  const F = focosDe(g, casa);
  if (F.length < 6) return false;
  g.incendio = { casa, focos: F, total: F.length, t: 0, apagadosUno: 0, camion: null, duenno, dijo: 0 };
  g.audio.play('grito', { ui: true, vol: 0.6 });
  g.ui.toast('🔥 ¡Se quema una casa! Apáguela a baldazos (balde con agua, clic derecho)', 5200, 'urgente');
  return true;
}
// cada segundo
export function tickIncendio(g) {
  const I = g.incendio;
  if (I) {
    I.t++;
    if (g.dim !== 'tierra' || Math.hypot(g.player.body.pos.x - I.casa.x, g.player.body.pos.z - I.casa.z) > 120) { limpiarIncendio(g); return; }
    // la gente grita y se aparta
    for (const m of g.entities.mobs) if (m.type === 'vecino' && !m.dead && Math.hypot(m.body.pos.x - I.casa.x, m.body.pos.z - I.casa.z) < 14 && Math.random() < 0.08) { decir(g, m, ['¡Fuego, fuego!', '¡Traigan agua!', '¡Llamen a los bomberos!', '¡Ay, Dios mío, la casa de doña Toya!'][Math.floor(Math.random() * 4)], 2); m.panic = 2; }
    if (!I.camion && I.t >= LLEGAN) llegarCamion(g, I);
    return;
  }
  if (g.dim !== 'tierra' || !g.meta || (g.day || 1) < 6 || (g.meta.incendioCd || 0) > (g.day || 1) || Math.random() > 1 / 500) return;
  const p = g.player.body.pos, v = g.nearestVillage && g.nearestVillage(p.x, p.z);
  if (!v || v.dist > 45) return;
  const casas = g.entities.mobs.filter((m) => m.type === 'vecino' && m.data.home && m.data.vid && !String(m.data.vid).startsWith('suelto') && !m.data.animo && !m.data.impostor && m.data.role !== 'jurado' && Math.hypot(m.data.home.x - p.x, m.data.home.z - p.z) < 40 && Math.hypot(m.data.home.x - p.x, m.data.home.z - p.z) > 8);
  if (!casas.length) return;
  const d = casas[Math.floor(Math.random() * casas.length)];
  if (empezar(g, { ...d.data.home }, d)) g.meta.incendioCd = (g.day || 1) + 6;
}
// clic derecho con el balde lleno (lo llama game.js)
export function apagarIncendio(g, x, y, z) {
  const I = g.incendio;
  if (!I) return false;
  let n = 0;
  for (const f of I.focos) if (f.vivo && Math.hypot(f.x - x - 0.5, f.z - z - 0.5) < 2.6 && Math.abs(f.y - y - 1) < 3.5) { f.vivo = false; n++; }
  if (!n) return false;
  I.apagadosUno += n;
  for (let i = 0; i < 30; i++) g.particles.spawn(x + Math.random() * 2 - 0.5, y + 1 + Math.random(), z + Math.random() * 2 - 0.5, [0.85, 0.85, 0.88], (Math.random() - 0.5), 2 + Math.random(), (Math.random() - 0.5), 1.6, -1);
  g.audio.play('splash', { pos: { x: x + 0.5, y: y + 1, z: z + 0.5 }, vol: 0.8 });
  return true;
}
function terminar(g) {
  const I = g.incendio;
  const parte = I.apagadosUno / I.total;
  if (parte >= 0.5) {
    g.giveItem(COLON, 25);
    g.meta.reputation = (g.meta.reputation || 0) + 3;
    if (I.duenno && !I.duenno.dead) decir(g, I.duenno, '¡Usted nos salvó la casa! Que Dios se lo pague… y yo también, ahí le va una platica.', 4);
    g.ui.toast(`🧯 ¡Apagado! Usted apagó ${I.apagadosUno} de ${I.total} focos. La familia le da las gracias y ₡25; en el pueblo ya se habla de usted`, 5000);
    g.achieve('incendio', 'Bombero voluntario');
    anotar(g, 'Se quemaba una casa en el pueblo y la apagué a baldazos.', '🧯');
  } else g.ui.toast('🚒 Los bomberos apagaron el fuego. La casa quedó chamuscada, pero la familia está bien', 4200);
  limpiarIncendio(g);
}
// cada cuadro: las llamas, el humo, los bomberos echando agua
export function cuadroIncendio(g, dt) {
  const I = g.incendio;
  if (!I) { if (llamas) llamas.count = 0; return; }
  const t = (g.clock || 0);
  if (!llamas || llamas.parent !== g.scene) { llamas = new THREE.InstancedMesh(new THREE.BoxGeometry(0.5, 0.9, 0.5), new THREE.MeshBasicMaterial({ color: 0xffffff, fog: false }), 80); llamas.frustumCulled = false; g.scene.add(llamas); }
  const k = cuadroIncendio, m4 = k.m4 || (k.m4 = new THREE.Matrix4()), q = k.q || (k.q = new THREE.Quaternion()), v = k.v || (k.v = new THREE.Vector3()), s = k.s || (k.s = new THREE.Vector3()), col = k.c || (k.c = new THREE.Color());
  let n = 0;
  for (const f of I.focos) {
    if (!f.vivo) continue;
    for (let j = 0; j < 3 && n < 80; j++) {
      const h = 0.6 + Math.sin(t * 9 + f.k + j * 2) * 0.3 + j * 0.25;
      v.set(f.x + Math.sin(t * 5 + f.k + j) * 0.15, f.y + h * 0.5 + j * 0.2, f.z + Math.cos(t * 4 + f.k + j) * 0.15); s.set(0.8 - j * 0.2, h, 0.8 - j * 0.2); q.identity();
      m4.compose(v, q, s); llamas.setMatrixAt(n, m4); llamas.setColorAt(n, col.setHex(j === 0 ? 0xff5a10 : j === 1 ? 0xff9a20 : 0xffe060)); n++;
    }
    if (Math.random() < dt * 4) g.particles.spawn(f.x, f.y + 1.6, f.z, [0.25, 0.24, 0.24], (Math.random() - 0.5) * 0.6, 2.2, (Math.random() - 0.5) * 0.6, 4, -0.3);
  }
  llamas.count = n; llamas.instanceMatrix.needsUpdate = true; if (llamas.instanceColor) llamas.instanceColor.needsUpdate = true;
  const vivos = I.focos.filter((f) => f.vivo);
  if (vivos.length) g.audio.setEmitter('incendio', 'loop.fire', { x: I.casa.x, y: I.casa.y + 2, z: I.casa.z }, 1);
  // los bomberos: luces que giran y la manguera apagando foco por foco
  if (I.camion) {
    I.camion.userData.luces.forEach((l, i) => { l.visible = Math.floor(t * 4 + i) % 2 === 0; });
    I.manguera = (I.manguera || 0) - dt;
    if (I.manguera <= 0 && vivos.length) { I.manguera = 1.4; const f = vivos[0]; f.vivo = false; for (let i = 0; i < 14; i++) { const kk = i / 14; g.particles.spawn(I.chorro.x + (f.x - I.chorro.x) * kk, I.chorro.y + (f.y - I.chorro.y) * kk + Math.sin(kk * Math.PI) * 1.5, I.chorro.z + (f.z - I.chorro.z) * kk, [0.7, 0.85, 1], 0, -0.5, 0, 0.6, 2); } }
  }
  if (!vivos.length) terminar(g);
}
export function pruebaIncendio(g) {
  limpiarIncendio(g);
  const p = g.player.body.pos, casas = g.entities.mobs.filter((m) => m.type === 'vecino' && m.data.home && Math.hypot(m.data.home.x - p.x, m.data.home.z - p.z) < 40);
  if (!casas.length) return 'No hay casas cerca: pruébelo en un pueblo';
  const d = casas[0];
  return empezar(g, { ...d.data.home }, d) ? '¡Se prende una casa! Agarre un balde con agua (o espere a los bomberos, a los 75 s)' : 'Esa casa no tiene paredes a la vista: pruebe en otra parte del pueblo';
}
