// El sereno (v8.3): de noche, en el pueblo donde uno anda, Don Fermín hace la ronda con su farol y su garrote. Da vueltas por la plaza
// y las calles y, si una criatura brava se mete al pueblo, se le va encima («¡Fuera de aquí, sinvergüenza!»). No es invencible: si
// lo dejan solo con muchas, se esconde. Al amanecer se va a dormir. Estado: g.sereno (no se guarda).
import * as THREE from 'three';
import { SOLID } from './blocks.js';
import { decir } from './misiones.js';

const GRITOS = ['¡Fuera de aquí, sinvergüenza!', '¡A mi pueblo no se me mete nadie!', '¡Vaya a asustar a su abuela!', '¡Ey! ¡Échese para allá!'];
function suelo(g, x, z, y0) { let y = y0; while (y > 2 && !SOLID[g.world.getBlock(Math.floor(x), y - 1, Math.floor(z))]) y--; return y; }
export function limpiarSereno(g) { const S = g.sereno; if (S && S.m && !S.m.dead) S.m.dead = true; g.sereno = null; }
const ESPERA_SI_CAE = 240; // si lo tumban, el pueblo se queda sin sereno un rato
// cada segundo: sale de noche si uno anda en el pueblo
export function tickSereno(g) {
  const S = g.sereno;
  if (S) {
    if (S.m.dead || S.m.dying) { g.serenoCd = (g.clock || 0) + ESPERA_SI_CAE; g.sereno = null; return; }
    // al amanecer se despide y se va unos segundos después, para que se alcance a oír
    if (g.daylight > 0.4 && S.sale === undefined) { S.sale = 3; decir(g, S.m, 'Bueno, ya amaneció. A dormir se ha dicho.', 3); }
    if (S.sale !== undefined && --S.sale > 0) return;
    if (S.sale !== undefined || g.dim !== 'tierra' || Math.hypot(S.v.x - g.player.body.pos.x, S.v.z - g.player.body.pos.z) > 160) limpiarSereno(g);
    return;
  }
  if (g.dim !== 'tierra' || g.daylight > 0.3 || g.mode !== 'survival' || (g.clock || 0) < (g.serenoCd || 0)) return;
  const p = g.player.body.pos, near = g.nearestVillage && g.nearestVillage(p.x, p.z);
  if (!near || near.dist > (near.v.R || 60) || near.v.city) return;
  const v = near.v, x = v.x + 3, z = v.z + 3;
  if (!g.world.isLoaded(x, z)) return;
  const m = g.entities.spawnMob('vecino', x, suelo(g, x, z, Math.max(Math.floor(p.y) + 6, g.world.gen.column(Math.floor(x), Math.floor(z)).h + 8)) + 0.1, z); // desde arriba de la plaza, aunque uno ande en una cueva abajo
  if (!m) return;
  Object.assign(m.data, { role: 'vecino', name: 'Don Fermín, el sereno', seed: 7311, home: { x: Math.floor(x), y: 0, z: Math.floor(z) }, plaza: { x: Math.floor(x), y: 0, z: Math.floor(z) }, vid: 'sereno', animo: { tipo: 'sereno' }, sereno: true });
  if (m.kind.dress) m.kind.dress(m);
  // el farol en la mano
  const farol = new THREE.Group(); farol.position.set(0.42, 0.75, 0.15);
  const luz = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.2, 0.16), new THREE.MeshBasicMaterial({ color: 0xffd060 })); luz.userData.glow = true;
  const halo = new THREE.Mesh(new THREE.SphereGeometry(0.45, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffb040, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false })); halo.userData.glow = true;
  farol.add(luz, halo); m.group.add(farol);
  g.sereno = { m, v, t: 0, punto: null, golpe: 0, gritoT: 0 };
}
// cada cuadro: la ronda y la pelea
export function cuadroSereno(g, dt) {
  const S = g.sereno;
  if (!S || S.m.dead || S.m.dying) return;
  const m = S.m, b = m.body.pos;
  S.t += dt; S.golpe = Math.max(0, S.golpe - dt); S.gritoT = Math.max(0, S.gritoT - dt);
  // ¿hay algo bravo en el pueblo?
  let presa = null, pd = 12;
  for (const o of g.entities.mobs) {
    if (o.dead || o.dying || !o.kind.hostile || o.kind.boss || o.kind.legend || o.kind.pasivo || o.type === 'zancudo' || Math.abs(o.body.pos.y - b.y) > 2.5 || (S.ignora && S.ignora.has(o))) continue;
    const d = Math.hypot(o.body.pos.x - b.x, o.body.pos.z - b.z);
    if (d < pd && Math.hypot(o.body.pos.x - S.v.x, o.body.pos.z - S.v.z) < (S.v.R || 60)) { pd = d; presa = o; }
  }
  const cuantas = presa ? g.entities.mobs.filter((o) => !o.dead && o.kind.hostile && Math.hypot(o.body.pos.x - b.x, o.body.pos.z - b.z) < 6).length : 0;
  // si en unos segundos no la alcanza (una pared, un hueco), la deja y sigue la ronda
  if (presa !== S.presa) { S.presa = presa; S.presaT = 0; } else if (presa && pd > 1.5 && (S.presaT += dt) > 6) { (S.ignora ||= new WeakSet()).add(presa); S.presa = null; presa = null; }
  if (presa && cuantas < 4) {
    if (S.gritoT <= 0) { S.gritoT = 6; decir(g, m, GRITOS[Math.floor(Math.random() * GRITOS.length)], 2.4); }
    if (pd > 1.5) m.goTo(presa.body.pos.x, presa.body.pos.z, 1.5);
    else {
      m.moving = false; m.targetYaw = Math.atan2(presa.body.pos.x - b.x, presa.body.pos.z - b.z);
      if (S.golpe <= 0) {
        S.golpe = 1;
        presa.hurt(4, b.x, b.z);
        presa.data.provoked = false; // el del garrote es él: que no se la cobre a uno
        g.audio.play('punch', { pos: m.soundPos(), vol: 0.8, pitch: 0.8 });
        if (presa.dying && !g.meta.serenoAviso) { g.meta.serenoAviso = true; g.ui.toast('🏮 Don Fermín, el sereno, sacó a una criatura del pueblo a garrotazos', 3200); g.achieve('sereno', 'El sereno cuida el pueblo'); }
      }
    }
    return;
  }
  if (presa && cuantas >= 4) { if (S.gritoT <= 0) { S.gritoT = 8; decir(g, m, '¡Son muchas! ¡Me escondo, ayúdeme!', 2.6); } m.goTo(S.v.x, S.v.z, 1.4); return; }
  // la ronda: un punto al azar por la plaza y las calles, cada tanto
  if (!S.punto || Math.hypot(S.punto.x - b.x, S.punto.z - b.z) < 1.2 || (S.t % 9) < dt) { const a = Math.random() * Math.PI * 2, r = 4 + Math.random() * Math.min(26, (S.v.R || 40) * 0.5); S.punto = { x: S.v.x + Math.cos(a) * r, z: S.v.z + Math.sin(a) * r }; }
  m.goTo(S.punto.x, S.punto.z, 0.7);
  if (Math.random() < dt * 0.05) decir(g, m, ['Las doce y todo sereno…', 'Buenas noches, ¿todo bien?', 'Con este frío, un agua dulce…'][Math.floor(Math.random() * 3)], 2.6);
}
