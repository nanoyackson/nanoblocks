// Más naturaleza tica: las colonias de oropéndolas con sus nidos colgantes (que se mecen con el viento; los machos
// hacen la reverencia y gorgotean) y el granizo que a veces cae en las tormentas fuertes (rebota, se queda un rato
// blanqueando el suelo y se derrite).
import * as THREE from 'three';
import { BLOCKS, AIR } from './blocks.js';

const ease = (k) => k * k * (3 - 2 * k);

// ===== oropéndolas =====
function nido() {
  const g = new THREE.Group();
  const paja = new THREE.MeshBasicMaterial({ color: 0x8a7148 });
  const cuerda = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.6, 0.05), paja); cuerda.position.y = -0.3; g.add(cuerda);
  const bolsa = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.2, 0.85, 7), paja); bolsa.position.y = -1.0; g.add(bolsa);
  const fondo = new THREE.Mesh(new THREE.SphereGeometry(0.2, 7, 5, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), paja); fondo.position.y = -1.42; g.add(fondo);
  const rayas = new THREE.MeshBasicMaterial({ color: 0x6e5a36 });
  for (const yy of [-0.78, -1.05, -1.3]) { const r = new THREE.Mesh(new THREE.CylinderGeometry(0.2 - (yy + 1.42) * 0.1 + 0.012, 0.2 - (yy + 1.42) * 0.1 + 0.012, 0.03, 7), rayas); r.position.y = yy; g.add(r); }
  const boca = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.12, 0.02), new THREE.MeshBasicMaterial({ color: 0x2a2014 })); boca.position.set(0, -0.72, 0.15); g.add(boca);
  return g;
}
function oropendola() {
  const g = new THREE.Group();
  const body = new THREE.Group(); g.add(body);
  const castano = new THREE.MeshBasicMaterial({ color: 0x5a2e1a });
  const cuerpo = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.2, 0.42), castano); cuerpo.position.y = 0.16; body.add(cuerpo);
  const cabeza = new THREE.Group(); cabeza.position.set(0, 0.3, 0.2); body.add(cabeza);
  cabeza.add(new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.14, 0.15), new THREE.MeshBasicMaterial({ color: 0x1a1414 })));
  const mejilla = new THREE.MeshBasicMaterial({ color: 0x9ac0e0 });
  for (const s of [-1, 1]) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.05, 0.06), mejilla); m.position.set(s * 0.076, -0.01, 0.02); cabeza.add(m); }
  const pico = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.16), new THREE.MeshBasicMaterial({ color: 0x1a1a1a })); pico.position.set(0, -0.01, 0.14); cabeza.add(pico);
  const punta = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.06), new THREE.MeshBasicMaterial({ color: 0xf08a20 })); punta.position.set(0, -0.01, 0.24); cabeza.add(punta);
  const cola = new THREE.Group(); cola.position.set(0, 0.18, -0.2); body.add(cola);
  const plumas = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.04, 0.3), new THREE.MeshBasicMaterial({ color: 0xf2c418 })); plumas.position.z = -0.14; cola.add(plumas);
  const alas = [];
  for (const s of [-1, 1]) {
    const piv = new THREE.Group(); piv.position.set(s * 0.11, 0.22, 0.02);
    const ala = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.03, 0.26), castano); ala.position.x = s * 0.16; piv.add(ala);
    body.add(piv); alas.push({ piv, s });
  }
  g.userData = { body, cabeza, cola, alas };
  return g;
}
// un buen colgadero: hojas arriba y aire alrededor (lejos del tronco, para que el nido cuelgue libre)
function libre(w, x, y, z) {
  if (!BLOCKS[w.getBlock(x, y, z)].leafy) return false;
  for (let dy = 1; dy <= 3; dy++) if (w.getBlock(x, y - dy, z) !== AIR) return false;
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) for (let dy = 1; dy <= 2; dy++) if (w.getBlock(x + dx, y - dy, z + dz) !== AIR) return false;
  return true;
}
// busca la copa de un árbol alto: hojas con aire abajo, bien arriba del suelo
function copa(g, cx, cz) {
  const w = g.world;
  for (let k = 0; k < 40; k++) {
    const x = Math.floor(cx + (Math.random() - 0.5) * 40), z = Math.floor(cz + (Math.random() - 0.5) * 40);
    if (!w.isLoaded(x, z)) continue;
    const suelo = w.gen.column(x, z).h;
    for (let y = suelo + 6; y < suelo + 22; y++) {
      if (BLOCKS[w.getBlock(x, y, z)].leafy) { if (libre(w, x, y, z)) return { x, y, z }; break; }
    }
  }
  return null;
}
function colgaderos(g, c) {
  // varios nidos bajo la misma copa
  const w = g.world, out = [c];
  for (let k = 0; k < 90 && out.length < 6; k++) {
    const x = c.x + Math.round((Math.random() - 0.5) * 9), z = c.z + Math.round((Math.random() - 0.5) * 9);
    for (let y = c.y + 2; y >= c.y - 2; y--) {
      if (libre(w, x, y, z)) {
        if (!out.some((o) => o.x === x && o.z === z)) out.push({ x, y, z });
        break;
      }
    }
  }
  return out;
}
export function tickOropendolas(g, dt) {
  if (g.dim !== 'tierra') { limpiarNaturaleza4(g); return; }
  const p = g.player.body.pos, bio = g.env && g.env.biome;
  let C = g.oropendolas;
  if (C && Math.hypot(C.x - p.x, C.z - p.z) > 70) { limpiarOropendolas(g); C = null; }
  if (!C) {
    if (!['jungle', 'forest', 'nuboso'].includes(bio)) return;
    g.oroT = (g.oroT || 0) - dt;
    if (g.oroT > 0) return;
    g.oroT = 6;
    const c = copa(g, p.x, p.z);
    if (!c) return;
    const nidos = colgaderos(g, c).map((h, i) => {
      const m = nido(); m.position.set(h.x + 0.5, h.y, h.z + 0.5); m.rotation.y = Math.random() * Math.PI * 2;
      const largo = 0.8 + Math.random() * 0.5; m.scale.set(1, largo, 1);
      g.scene.add(m);
      return { m, ph: i * 1.7 + Math.random(), largo, x: h.x + 0.5, y: h.y, z: h.z + 0.5 };
    });
    if (nidos.length < 3) { for (const n of nidos) g.scene.remove(n.m); return; }
    const aves = [];
    for (let i = 0; i < Math.min(4, nidos.length - 1); i++) {
      const m = oropendola(); g.scene.add(m);
      const a = { m, nido: i, t: Math.random() * 5, vuelo: null, quieto: 1 + Math.random() * 4, rev: 0 };
      posarEn(a, nidos[i]); aves.push(a);
    }
    g.oropendolas = C = { x: c.x, z: c.z, nidos, aves, t: 0 };
    if (!g.meta.oroAviso) { g.meta.oroAviso = true; g.ui.toast('🪺 Unos nidos largos cuelgan de aquel árbol: una colonia de oropéndolas', 3200); }
  }
  C.t += dt;
  const viento = g.weather ? g.weather.intensity * 0.6 : 0;
  // los nidos se mecen (cada uno a su ritmo; el más largo, más lento)
  for (const n of C.nidos) {
    const f = 1.4 / Math.sqrt(n.largo);
    n.m.rotation.x = Math.sin(C.t * f + n.ph) * (0.06 + viento * 0.12);
    n.m.rotation.z = Math.cos(C.t * f * 0.8 + n.ph * 1.3) * (0.05 + viento * 0.1);
  }
  for (const a of C.aves) tickAve(g, C, a, dt, p);
}
function bocaDe(n) {
  // la entrada del nido, siguiendo cómo se mece
  const v = new THREE.Vector3(0, -0.72 * n.largo, 0.22).applyEuler(n.m.rotation);
  return { x: n.x + v.x, y: n.y + v.y, z: n.z + v.z };
}
function posarEn(a, n) { const b = bocaDe(n); a.m.position.set(b.x, b.y - 0.15, b.z); }
function tickAve(g, C, a, dt, p) {
  const u = a.m.userData, o = a.m.position;
  a.t += dt;
  if (a.vuelo) {
    const V = a.vuelo;
    V.k = Math.min(1, V.k + dt / V.dur);
    const k = ease(V.k);
    const fin = V.aNido != null ? bocaDe(C.nidos[V.aNido]) : V.fin;
    const finY = V.aNido != null ? fin.y - 0.15 : fin.y;
    const x = V.ini.x + (fin.x - V.ini.x) * k, z = V.ini.z + (fin.z - V.ini.z) * k;
    const y = V.ini.y + (finY - V.ini.y) * k + Math.sin(V.k * Math.PI) * V.arco;
    const dx = x - o.x, dz = z - o.z;
    if (Math.abs(dx) + Math.abs(dz) > 1e-4) {
      const yaw = Math.atan2(dx, dz);
      let d = yaw - a.m.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d));
      a.m.rotation.y += d * Math.min(1, dt * 10);
    }
    o.set(x, y, z);
    // aletea rápido al despegar y planea al llegar
    const aleteo = V.k < 0.75 ? 1 : (1 - V.k) / 0.25;
    for (const w of u.alas) w.piv.rotation.z = w.s * (Math.sin(a.t * 26) * 0.9 * aleteo + (1 - aleteo) * -0.2);
    u.body.rotation.x += (-0.15 - u.body.rotation.x) * Math.min(1, dt * 8);
    u.cola.rotation.x = 0.2 * (1 - aleteo);
    if (V.k >= 1) {
      a.vuelo = null;
      if (V.aNido != null) { a.nido = V.aNido; a.quieto = 3 + Math.random() * 6; a.volver = false; } else { a.quieto = 0; a.volver = true; }
    }
    return;
  }
  // posado en la boca del nido (se mece con él)
  if (a.nido != null) posarEn(a, C.nidos[a.nido]);
  for (const w of u.alas) w.piv.rotation.z += (0 - w.piv.rotation.z) * Math.min(1, dt * 10);
  // la reverencia: se inclina hasta casi colgar, abre las alas y gorgotea
  if (a.rev > 0) {
    a.rev -= dt;
    const k = Math.sin(Math.min(1, (2.2 - a.rev) / 2.2) * Math.PI);
    u.body.rotation.x = k * 1.25;
    u.cola.rotation.x = -k * 0.6;
    for (const w of u.alas) w.piv.rotation.z = w.s * k * 0.7;
  } else {
    u.body.rotation.x += (0 - u.body.rotation.x) * Math.min(1, dt * 6);
    u.cola.rotation.x += (0 - u.cola.rotation.x) * Math.min(1, dt * 6);
    u.cabeza.rotation.y = Math.sin(a.t * 0.9 + a.nido) * 0.5;
  }
  const d = Math.hypot(o.x - p.x, o.y - p.y, o.z - p.z);
  a.quieto -= dt;
  if (d < 3 || a.quieto <= 0) {
    if (d >= 3 && a.rev <= 0 && a.nido != null && Math.random() < 0.5) {
      a.rev = 2.2; a.quieto = 2.6 + Math.random() * 3;
      if (d < 30) g.audio.play('oropendola', { pos: { x: o.x, y: o.y, z: o.z }, vol: 0.85, pitch: 0.95 + Math.random() * 0.1 });
      if (d < 15) g.achieve('oropendolas', 'La reverencia de la oropéndola');
      return;
    }
    // a otro nido (o una vuelta por la copa y de regreso)
    const libres = C.nidos.map((_, i) => i).filter((i) => i !== a.nido && !C.aves.some((b) => b !== a && (b.nido === i || (b.vuelo && b.vuelo.aNido === i))));
    const ini = { x: o.x, y: o.y, z: o.z };
    // una vuelta por ahí: un punto al aire libre cerca de la colonia (nunca metido en las hojas)
    let fin = null;
    if (!a.volver && (!libres.length || Math.random() < 0.3)) {
      for (let k = 0; k < 10 && !fin; k++) {
        const ang = Math.random() * Math.PI * 2, r = 4 + Math.random() * 8, y = o.y - 1 - Math.random() * 3;
        const f = { x: C.x + Math.cos(ang) * r, y, z: C.z + Math.sin(ang) * r };
        if (g.world.getBlock(Math.floor(f.x), Math.floor(f.y), Math.floor(f.z)) === AIR && g.world.getBlock(Math.floor(f.x), Math.floor(f.y) + 1, Math.floor(f.z)) === AIR) fin = f;
      }
    }
    if (fin) a.vuelo = { ini, fin, k: 0, dur: 0.6 + Math.hypot(fin.x - ini.x, fin.z - ini.z) / 6, arco: 1.2 };
    else if (libres.length) {
      const i = libres[(Math.random() * libres.length) | 0], f = bocaDe(C.nidos[i]);
      a.vuelo = { ini, aNido: i, k: 0, dur: 0.6 + Math.hypot(f.x - ini.x, f.z - ini.z) / 6, arco: 0.6 + Math.random() };
    } else return;
    a.nido = null;
    a.quieto = 0;
  }
}
function limpiarOropendolas(g) {
  const C = g.oropendolas;
  if (!C) return;
  for (const n of C.nidos) g.scene.remove(n.m);
  for (const a of C.aves) g.scene.remove(a.m);
  g.oropendolas = null;
}

// ===== granizo =====
const N = 700, REPOSO = 340; // bolitas en total y como mucho cuántas blanqueando el suelo
export function tickGranizo(g, dt) {
  if (g.dim !== 'tierra') return;
  const W = g.weather, p = g.player.body.pos, bio = g.env && g.env.biome;
  let H = g.granizo;
  g.granizoT = (g.granizoT ?? 60) - dt;
  if ((!H || !H.on) && W && W.type === 'storm' && W.intensity > 0.6 && g.granizoT <= 0 && !['desert', 'beach', 'ocean', 'snowy'].includes(bio)) {
    g.granizoT = 30;
    if (Math.random() < 0.18) {
      g.granizoT = 300 + Math.random() * 300;
      if (!H) {
        const mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(0.12, 0.12, 0.12), new THREE.MeshBasicMaterial({ color: 0xf2f6ff }), N);
        mesh.frustumCulled = false; mesh.count = 0; g.scene.add(mesh);
        H = g.granizo = { mesh, P: [], on: false, t: 0, dur: 0, golpe: 3 };
      }
      H.on = true; H.t = 0; H.dur = 35 + Math.random() * 20;
      g.ui.toast('🧊 ¡Está cayendo granizo! Mejor métase bajo techo', 3000);
      g.achieve('granizo', 'Cayó granizo');
    }
  }
  if (!H) return;
  let k = 0;
  if (H.on) {
    H.t += dt;
    k = Math.min(1, H.t / 5, (H.dur - H.t) / 5);
    if (H.t >= H.dur || !W || W.type !== 'storm') { H.on = false; k = 0; }
  }
  const cam = g.camera.position;
  // nacen bolitas arriba (cuántas, según qué tan fuerte esté)
  let nuevas = H.on ? 160 * k * dt : 0;
  while (nuevas > 0 && H.P.length < N) {
    if (nuevas < 1 && Math.random() > nuevas) break;
    nuevas--;
    const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * 15;
    H.P.push({ x: cam.x + Math.cos(a) * r, y: cam.y + 14 + Math.random() * 6, z: cam.z + Math.sin(a) * r, vx: 0.6, vy: -16 - Math.random() * 4, vz: 0, s: 0, vida: 0, rot: Math.random() * 6, tam: 0.7 + Math.random() * 0.6 });
  }
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), S = new THREE.Vector3(), T = new THREE.Vector3();
  let n = 0, ruidito = 0, reposo = 0;
  for (let i = H.P.length - 1; i >= 0; i--) {
    const b = H.P[i];
    if (b.s < 2) {
      b.vy -= (b.s === 1 ? 25 : 0) * dt;
      b.x += b.vx * dt; b.y += b.vy * dt; b.z += b.vz * dt;
      b.rot += dt * 8;
      const fx = Math.floor(b.x), fz = Math.floor(b.z), top = W ? W.top(fx, fz) : -1;
      if (b.y <= top + 1.05 && b.vy < 0) {
        const bl = BLOCKS[g.world.getBlock(fx, top, fz)];
        // en el agua se hunde con una salpicadita
        if (bl && bl.key === 'water') { if (Math.random() < 0.2) g.particles.spawn(b.x, top + 1.02, b.z, [0.8, 0.88, 1], 0, 1.2, 0, 0.2, 20); H.P.splice(i, 1); continue; }
        if (b.s === 0) {
          // rebota
          b.s = 1; b.vy = 2 + Math.random() * 2; b.vx = (Math.random() - 0.5) * 2; b.vz = (Math.random() - 0.5) * 2; b.y = top + 1.06;
          if (ruidito < 2 && Math.hypot(b.x - p.x, b.z - p.z) < 6 && Math.random() < 0.15) { ruidito++; g.particles.spawn(b.x, top + 1.05, b.z, [0.95, 0.97, 1], 0, 0.8, 0, 0.2, 20); }
        } else { b.s = 2; b.y = top + 1.05; b.vida = (H.reposo || 0) < REPOSO ? 6 + Math.random() * 8 : 0.4; }
      }
      if (b.y < cam.y - 20 || Math.hypot(b.x - cam.x, b.z - cam.z) > 24) { H.P.splice(i, 1); continue; }
    } else {
      // en el suelo: se va derritiendo
      b.vida -= dt;
      if (b.vida <= 0) { H.P.splice(i, 1); continue; }
      reposo++;
    }
    const derrite = b.s === 2 ? Math.min(1, b.vida / 3) : 1;
    T.set(b.x, b.y, b.z);
    Q.setFromEuler(E.set(b.rot, b.rot * 0.7, 0));
    S.setScalar(b.tam * derrite);
    M.compose(T, Q, S);
    H.mesh.setMatrixAt(n++, M);
  }
  H.mesh.count = n;
  H.reposo = reposo;
  H.mesh.instanceMatrix.needsUpdate = true;
  // el ruido sobre los techos y el zacate
  g.audio.setEmitter('granizo', 'loop.granizo', k > 0.02 ? { x: p.x, y: p.y + 2, z: p.z } : null, 0.9 * k);
  // a la intemperie, duele
  if (H.on && k > 0.5 && g.mode === 'survival' && W) {
    const techo = W.top(Math.floor(p.x), Math.floor(p.z)) > p.y + 1.6;
    H.golpe -= dt;
    if (!techo && H.golpe <= 0) { H.golpe = 4; g.damagePlayer(1, null, null, 'Lo agarró el granizo', true, true); }
  }
  if (!H.on && !H.P.length) { g.scene.remove(H.mesh); H.mesh.geometry.dispose(); g.granizo = null; }
}

export function limpiarNaturaleza4(g) {
  limpiarOropendolas(g);
  if (g.granizo) { g.scene.remove(g.granizo.mesh); g.granizo = null; }
  g.audio.setEmitter('granizo', null, null);
}
