// Mar adentro y cielo arriba: barcos pesqueros que pasan despacito por el horizonte (de noche con sus lucecitas), las
// trombas marinas que bajan de las nubes en las tormentas sobre el mar y, muy de vez en cuando, unas luces raras que
// se mueven en el cielo de noche y desaparecen… («¿Vio eso?»).
import * as THREE from 'three';
import { SEA } from './worldgen.js';

// ---------- dónde queda el mar abierto (dirección, si hay) ----------
export function haciaMar(g) {
  const p = g.player.body.pos;
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    let ok = true;
    for (const d of [70, 110, 150]) { const c = g.world.gen.column(Math.floor(p.x + Math.cos(a) * d), Math.floor(p.z + Math.sin(a) * d)); if (c.h > SEA - 4) { ok = false; break; } }
    if (ok) return a;
  }
  return null;
}

// ---------- los barcos ----------
function barco() {
  const g = new THREE.Group();
  const mb = (c) => new THREE.MeshBasicMaterial({ color: c });
  const casco = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.8, 3.6), mb([0x1a3a7a, 0x8a1a1a, 0x1a6a3a][(Math.random() * 3) | 0]));
  casco.position.y = 0.4; g.add(casco);
  const borda = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.12, 3.7), mb(0xf0f0ec)); borda.position.y = 0.82; g.add(borda);
  const cabina = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.9, 1.1), mb(0xf4f4f0)); cabina.position.set(0, 1.3, -0.6); g.add(cabina);
  const mastil = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.6, 0.08), mb(0x5a4a3a)); mastil.position.set(0, 2.1, 0.8); g.add(mastil);
  const pluma = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 2.2), mb(0x5a4a3a)); pluma.position.set(0, 2.6, 0.2); pluma.rotation.x = 0.4; g.add(pluma);
  // luces de navegación (se prenden de noche)
  const luces = [];
  for (const [c, x, y, z] of [[0xfff2a0, 0, 3.45, 0.8], [0xff3030, -0.76, 0.9, 1.4], [0x30ff60, 0.76, 0.9, 1.4], [0xfff2a0, 0, 1.6, -1.18]]) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.18), mb(c)); l.position.set(x, y, z); g.add(l); luces.push(l); }
  g.userData.luces = luces;
  return g;
}
export function tickBarcos(g, dt) {
  const B = (g.barcos ||= []);
  if (g.dim !== 'tierra') { limpiarMarCielo(g); return; }
  const p = g.player.body.pos;
  g.barcoT = (g.barcoT || 0) - dt;
  if (g.barcoT <= 0) {
    g.barcoT = 5;
    const a = haciaMar(g);
    if (a == null) { for (const b of B) b.irse = true; }
    else if (B.filter((b) => !b.irse).length < 3) {
      const d = 95 + Math.random() * 50, lat = (Math.random() - 0.5) * 120;
      const x = p.x + Math.cos(a) * d - Math.sin(a) * lat, z = p.z + Math.sin(a) * d + Math.cos(a) * lat;
      const m = barco();
      m.position.set(x, SEA + 0.8, z);
      const dir = Math.random() < 0.5 ? 1 : -1;
      m.rotation.y = Math.atan2(-Math.sin(a) * dir, Math.cos(a) * dir) + Math.PI / 2;
      g.scene.add(m);
      B.push({ m, vx: -Math.sin(a) * dir * 1.2, vz: Math.cos(a) * dir * 1.2, t: Math.random() * 10, op: 0 });
    }
  }
  const noche = g.daylight < 0.35;
  for (let i = B.length - 1; i >= 0; i--) {
    const b = B[i];
    b.t += dt;
    b.m.position.x += b.vx * dt; b.m.position.z += b.vz * dt;
    // se mece con las olas
    b.m.position.y = SEA + 0.8 + Math.sin(b.t * 0.9) * 0.15;
    b.m.rotation.z = Math.sin(b.t * 0.7) * 0.05; b.m.rotation.x = Math.sin(b.t * 0.55 + 1) * 0.03;
    for (const l of b.m.userData.luces) l.visible = noche;
    if (b.irse || Math.hypot(b.m.position.x - p.x, b.m.position.z - p.z) > 220) { g.scene.remove(b.m); B.splice(i, 1); }
  }
  if (B.length && Math.hypot(B[0].m.position.x - p.x, B[0].m.position.z - p.z) < 160) g.achieve('barcos', 'Barcos en el horizonte');
}

// ---------- trombas marinas ----------
export function tickTrombas(g, dt) {
  if (g.dim !== 'tierra') return;
  const W = g.weather, p = g.player.body.pos;
  const tormenta = W && W.type === 'storm' && W.intensity > 0.6;
  g.trombaT = (g.trombaT ?? 20) - dt;
  if (tormenta && !g.tromba && g.trombaT <= 0) {
    g.trombaT = 70 + Math.random() * 80;
    const a = haciaMar(g);
    if (a != null) {
      const d = 45 + Math.random() * 25;
      g.tromba = { x: p.x + Math.cos(a) * d, z: p.z + Math.sin(a) * d, t: 0, dur: 30, vx: (Math.random() - 0.5) * 2, vz: (Math.random() - 0.5) * 2, ang: 0 };
      if (!g.meta.trombaAviso) { g.meta.trombaAviso = true; g.ui.toast('🌪 ¡Una tromba marina! Una columna de agua baja de las nubes en el mar', 3400); }
      g.achieve('tromba', 'Vi una tromba marina');
    }
  }
  const T = g.tromba;
  if (!T) return;
  T.t += dt; T.ang += dt * 4;
  T.x += T.vx * dt; T.z += T.vz * dt;
  const k = Math.min(1, T.t / 4, (T.dur - T.t) / 4); // aparece y se deshace suave
  if (k <= 0 || T.t > T.dur) { g.tromba = null; return; }
  // el embudo: partículas en espiral, angosto abajo y ancho arriba
  for (let n = 0; n < 40; n++) {
    if (Math.random() > k) continue;
    const h = Math.random(), y = SEA + 1 + h * 55;
    const r = 0.8 + h * h * 7, a = T.ang * (1.5 - h) + Math.random() * Math.PI * 2;
    const tono = 0.55 + Math.random() * 0.25;
    g.particles.spawn(T.x + Math.cos(a) * r, y, T.z + Math.sin(a) * r, [tono, tono + 0.03, tono + 0.08], -Math.sin(a) * 6, 2 + Math.random() * 2, Math.cos(a) * 6, 1.8, -0.5);
  }
  // la espuma en la base
  for (let n = 0; n < 4; n++) { const a = Math.random() * Math.PI * 2, r = 1 + Math.random() * 3; g.particles.spawn(T.x + Math.cos(a) * r, SEA + 1.2, T.z + Math.sin(a) * r, [0.95, 0.97, 1], Math.cos(a) * 3, 1.5, Math.sin(a) * 3, 0.9, 3); }
  g.audio.setEmitter('tromba', 'loop.wind', { x: T.x, y: SEA + 5, z: T.z }, 0.8 * k);
  if (T.t + dt > T.dur) g.audio.setEmitter('tromba', 'loop.wind', null);
}

// ---------- luces raras en el cielo ----------
export function tickLucesRaras(g, dt) {
  if (g.dim !== 'tierra') return;
  const p = g.player.body.pos;
  const L = g.luces;
  if (!L) {
    if (g.daylight > 0.2 || (g.weather && g.weather.intensity > 0.3) || (g.meta.lucesDia || 0) + 3 > (g.day || 1)) return;
    if (Math.random() > dt * 0.004) return;
    g.meta.lucesDia = g.day || 1;
    const grupo = new THREE.Group();
    const bolas = [];
    for (let i = 0; i < 3; i++) {
      const b = new THREE.Mesh(new THREE.SphereGeometry(1.7, 12, 10), new THREE.MeshBasicMaterial({ color: i === 1 ? 0xffffff : 0xffa040, transparent: true, opacity: 0.95 }));
      // el halo alrededor (se ve de lejos)
      b.add(new THREE.Mesh(new THREE.SphereGeometry(3.4, 12, 10), new THREE.MeshBasicMaterial({ color: i === 1 ? 0xbfe0ff : 0xffc080, transparent: true, opacity: 0.22, depthWrite: false })));
      b.position.set((i - 1) * 9, Math.abs(i - 1) * -3.5, 0);
      grupo.add(b); bolas.push(b);
    }
    const a = Math.random() * Math.PI * 2;
    grupo.position.set(p.x + Math.cos(a) * 70, p.y + 55, p.z + Math.sin(a) * 70);
    g.scene.add(grupo);
    g.luces = { grupo, bolas, t: 0, fase: 'quieto', dir: Math.random() * Math.PI * 2 };
    return;
  }
  L.t += dt;
  const gr = L.grupo;
  // flotan quietitas y titilan; después hacen zigzag rapidísimo y se van
  L.bolas.forEach((b, i) => { b.material.opacity = 0.7 + Math.sin(L.t * 6 + i * 2) * 0.25; b.scale.setScalar(1 + Math.sin(L.t * 3 + i) * 0.1); });
  if (L.t < 9) { gr.position.y += Math.sin(L.t * 0.8) * 0.02; gr.rotation.y += dt * 0.2; }
  else if (L.t < 11) { gr.position.x += Math.cos(L.dir + Math.sin(L.t * 9) * 1.5) * 40 * dt; gr.position.z += Math.sin(L.dir + Math.sin(L.t * 9) * 1.5) * 40 * dt; }
  else { gr.position.y += 160 * dt; gr.scale.multiplyScalar(Math.pow(0.2, dt)); }
  if (L.t > 2 && !L.avisado) {
    const d = Math.hypot(gr.position.x - p.x, gr.position.z - p.z);
    if (d < 120) { L.avisado = true; g.ui.toast('👀 ¿Vio eso? Unas luces raras se mueven en el cielo…', 3200); }
  }
  if (L.t > 13) {
    g.scene.remove(gr);
    g.luces = null;
    if (L.avisado) { g.ui.toast('🤫 …y desaparecieron. Mejor ni le cuente a nadie', 2600); g.achieve('luces_raras', '¿Vio eso?'); }
  }
}

export function limpiarMarCielo(g) {
  for (const b of g.barcos || []) g.scene.remove(b.m);
  g.barcos = [];
  if (g.tromba) { g.tromba = null; g.audio.setEmitter('tromba', 'loop.wind', null); }
  if (g.luces) { g.scene.remove(g.luces.grupo); g.luces = null; }
}
