// «Nada flota» (v11.11.1): arma cada modelo (todas las criaturas, jefes y vecinos de MOB_TYPES, y el jugador en tercera persona)
// en varias poses y busca piezas que no tocan a ninguna otra (flotan) o que quedan enteras adentro de otra (metidas de más).
// Uso en la consola (con `npm run dev`): const R = await import('/tools/revisar-modelos.js'); R.revisar()  → tabla de problemas
// Se mide con las cajas de cada pieza en el mundo (Box3): es aproximado con piezas giradas, por eso hay tolerancia.
import * as THREE from 'three';
import { MOB_TYPES } from '/src/entities.js';
import { Avatar, heldMesh } from '/src/avatar.js';
import { ITEMS, BLOCK_BY_KEY } from '/src/blocks.js';
import { armarArmadura } from '/src/armadura.js';
import { disposeModel } from '/src/models.js';

const brazosDe = (u) => u.npcArms || u.brazos || u.arms || null;
const patasDe = (u) => (u.legs && u.legs.length ? u.legs : u.patas || null);
const juntaDe = (l) => l && l.junta;

// las poses: quieto, caminando (pierna adelante y atrás con rodilla), golpe (brazo arriba con codo), parry (brazos cruzados al frente),
// barrido (agachado, piernas adelante), sentado (piernas a 90°) y nadando (brazos y piernas estirados)
const POSES = {
  quieto: () => {},
  caminando: (L, A) => { if (L) L.forEach((l, i) => { l.rotation.x = (i % 2 ? -1 : 1) * 0.6; if (juntaDe(l)) juntaDe(l).rotation.x = 0.5; }); if (A) A.forEach((a, i) => { a.rotation.x = (i % 2 ? 1 : -1) * 0.5; }); },
  golpe: (L, A) => { if (A && A[0]) { A[0].rotation.x = -2.4; A[0].rotation.z = 0.3; if (juntaDe(A[0])) juntaDe(A[0]).rotation.x = -0.9; } },
  parry: (L, A) => { if (A) A.forEach((a, i) => { a.rotation.x = -1.4; a.rotation.z = (i ? -1 : 1) * 0.5; if (juntaDe(a)) juntaDe(a).rotation.x = -1.1; }); },
  barrido: (L, A) => { if (L) L.forEach((l) => { l.rotation.x = -1.2; if (juntaDe(l)) juntaDe(l).rotation.x = 0.2; }); if (A) A.forEach((a) => { a.rotation.x = 0.6; }); },
  sentado: (L) => { if (L) L.forEach((l) => { l.rotation.x = -1.4; if (juntaDe(l)) juntaDe(l).rotation.x = 1.4; }); },
  nadando: (L, A) => { if (A) A.forEach((a, i) => { a.rotation.x = -2.9; a.rotation.z = (i ? -1 : 1) * 0.2; }); if (L) L.forEach((l, i) => { l.rotation.x = (i % 2 ? 0.3 : -0.3); }); },
};

function mallas(G) {
  G.updateMatrixWorld(true);
  const out = [];
  G.traverse((o) => {
    if (!o.isMesh || !o.visible || o.userData.glow || o.userData.desechable || (o.material && o.material.transparent && o.material.opacity < 0.3)) return;
    let vis = true; for (let p = o.parent; p; p = p.parent) if (!p.visible) vis = false;
    if (!vis || !o.geometry) return;
    const b = new THREE.Box3().setFromObject(o);
    if (!b.isEmpty()) out.push({ o, b });
  });
  return out;
}
const gap = (a, b) => {
  const dx = Math.max(0, a.min.x - b.max.x, b.min.x - a.max.x), dy = Math.max(0, a.min.y - b.max.y, b.min.y - a.max.y), dz = Math.max(0, a.min.z - b.max.z, b.min.z - a.max.z);
  return Math.hypot(dx, dy, dz);
};
const contiene = (a, b, e) => a.min.x <= b.min.x - e && a.min.y <= b.min.y - e && a.min.z <= b.min.z - e && a.max.x >= b.max.x + e && a.max.y >= b.max.y + e && a.max.z >= b.max.z + e;
const nombre = (o) => { const n = []; for (let p = o; p && n.length < 3; p = p.parent) if (p.name) n.push(p.name); return n.join('<') || `${o.geometry.type}`; };

// revisa un grupo en una pose: piezas sueltas (sin vecina a menos de tol) y piezas enterradas (enteras adentro de otra más grande)
function revisarGrupo(G, quien, pose, out) {
  const M = mallas(G);
  if (M.length < 2) return;
  const total = new THREE.Box3(); for (const m of M) total.union(m.b);
  const diag = total.getSize(new THREE.Vector3()).length(), tol = 0.012 * diag + 0.004;
  for (const m of M) {
    let mejor = Infinity;
    for (const n of M) if (n !== m) mejor = Math.min(mejor, gap(m.b, n.b));
    if (mejor > tol) out.push({ modelo: quien, pose, problema: 'flota', pieza: nombre(m.o), separacion: +(mejor / diag * 100).toFixed(1) + ' %' });
    const vol = m.b.getSize(new THREE.Vector3());
    if (vol.x * vol.y * vol.z > 1e-6) for (const n of M) if (n !== m && n.o.parent !== m.o && contiene(n.b, m.b, tol * 0.5)) {
      // dentro de otra pieza: solo cuenta si la otra es maciza (no un aro, una tela o una pieza hueca de vidrio)
      if (!n.o.material || n.o.material.transparent) continue;
      out.push({ modelo: quien, pose, problema: 'metida', pieza: nombre(m.o), en: nombre(n.o) });
      break;
    }
  }
}

export function revisar({ poses = Object.keys(POSES), solo = null, max = 400 } = {}) {
  const out = [], tipos = Object.keys(MOB_TYPES).filter((t) => !solo || solo.includes(t));
  let modelos = 0;
  for (const t of tipos) {
    const kind = MOB_TYPES[t];
    if (!kind || typeof kind.build !== 'function') continue;
    for (const pose of poses) {
      let G;
      try {
        G = kind.build();
        const u = G.userData || {};
        if (u.pending && kind.dress) kind.dress({ group: G, data: { seed: 7, role: 'vecino' }, kind });
        POSES[pose](patasDe(G.userData || {}), brazosDe(G.userData || {}));
        revisarGrupo(G, t, pose, out);
      } catch (e) { if (pose === 'quieto') out.push({ modelo: t, pose, problema: 'error', pieza: String(e.message).slice(0, 80) }); }
      if (G) disposeModel(G);
    }
    modelos++;
  }
  // el jugador en tercera persona: sin nada, y con cada juego de armadura completo y algo en la mano (arma, herramienta, antorcha)
  if (!solo || solo.includes('jugador')) {
    const mats = [...new Set(Object.values(ITEMS).filter((d) => d && d.armorSlot !== undefined && d.armorSlot < 4 && d.mat).map((d) => d.mat))];
    const enMano = Object.values(ITEMS).filter((d) => d && /^(iron_sword|iron_pickaxe|machete|stone_axe)$/.test(d.key)).map((d) => d.id).concat([BLOCK_BY_KEY.torch].filter(Boolean));
    const juegos = [[null, null], ...mats.map((m, i) => [m, enMano[i % Math.max(1, enMano.length)]])];
    for (const [mat, item] of juegos) {
      const sc = new THREE.Scene(), A = new Avatar(sc), P = A.P;
      A.root.visible = true;
      const mm = new THREE.MeshBasicMaterial();
      if (mat) for (let slot = 0; slot < 5; slot++) { const def = Object.values(ITEMS).find((d) => d && d.armorSlot === slot && d.mat === mat); if (def) try { armarArmadura(slot, def, P, mm); } catch { /* pieza que no aplica */ } }
      if (item) { const h = heldMesh(item); if (h) { const j = P.armR.junta; if (j) { h.position.sub(j.position); j.add(h); } else P.armR.add(h); } }
      const quien = mat ? `jugador (${mat}${item ? ', ' + (ITEMS[item] ? ITEMS[item].key : 'antorcha') : ''})` : 'jugador';
      for (const pose of poses) {
        for (const k of ['armL', 'armR', 'legL', 'legR']) { P[k].rotation.set(0, 0, 0); if (P[k].junta) P[k].junta.rotation.set(0, 0, 0); }
        POSES[pose]([P.legL, P.legR], [P.armR, P.armL]);
        revisarGrupo(A.root, quien, pose, out);
      }
      disposeModel(A.root);
      modelos++;
    }
  }
  // lo «metido» que ya está en reposo es de diseño (ojos en la cabeza, asientos adentro del bus): se informa aparte; lo que solo
  // aparece en alguna pose es lo que hay que mirar (un brazo que se mete en el cuerpo al moverse)
  const enReposo = new Set(out.filter((f) => f.problema === 'metida' && f.pose === 'quieto').map((f) => `${f.modelo}|${f.pieza}|${f.en}`));
  for (const f of out) if (f.problema === 'metida') f.problema = enReposo.has(`${f.modelo}|${f.pieza}|${f.en}`) ? 'metida de diseño' : 'metida en pose';
  const filas = out.filter((f) => f.problema !== 'metida de diseño').slice(0, max);
  console.table(filas);
  const cuenta = {}; for (const f of out) cuenta[f.problema] = (cuenta[f.problema] || 0) + 1;
  console.log(`${modelos} modelos × ${poses.length} poses:`, cuenta);
  return { modelos, cuenta, filas: out };
}
