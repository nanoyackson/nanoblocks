// Planos de casas ticas: se compran en la ferretería; con el plano en la mano y los materiales en la mochila,
// clic derecho en el suelo y la casa se levanta sola, bloque por bloque, mirando hacia uno.
import { BLOCK_BY_KEY as K, SOLID, BLOCKS } from './blocks.js';
import { facingFromLook } from './stations.js';

export const PLANOS = {
  452: {
    nombre: 'Casita de adobe', w: 5, d: 5, h: 3,
    pared: () => K.adobe, piso: () => K.planks, techo: () => K.teja, ventana: () => K.glass,
    mats: () => [[K.adobe, 40], [K.teja, 25], [K.planks, 25], [K.glass, 2], [266, 1]],
  },
  453: {
    nombre: 'Casa de madera con corredor', w: 7, d: 6, h: 3, corredor: true,
    pared: () => K.paint_blue, piso: () => K.planks, techo: () => K.zinc, ventana: () => K.glass,
    mats: () => [[K.paint_blue, 56], [K.zinc, 50], [K.planks, 60], [K.glass, 4], [K.cerca, 8], [266, 1]],
  },
  // v12.4.7 (C4): la casa tradicional: bahareque encalado, horcones en el corredor, postigos y techo de palma
  578: {
    nombre: 'Casa de bahareque con corredor', w: 7, d: 6, h: 3, corredor: true, logro: ['bahareque', 'Casa de bahareque'],
    pared: () => K.bahareque_encalado, piso: () => K.planks, techo: () => K.techo_palma, ventana: () => K.postigo, poste: () => K.horcon,
    mats: () => [[K.bahareque_encalado, 56], [K.techo_palma, 50], [K.planks, 60], [K.postigo, 4], [K.horcon, 8], [K.cerca, 4], [266, 1]],
  },
  454: {
    nombre: 'Rancho de playa', w: 5, d: 5, h: 3, abierto: true,
    pared: () => K.log, piso: () => K.planks, techo: () => K.hay || K.leaves, ventana: () => 0,
    mats: () => [[K.log, 12], [K.planks, 25], [K.hay || K.leaves, 30]],
  },
};

const blando = (id) => !id || !SOLID[id] || BLOCKS[id].render === 'cross';

// arma la lista de bloques de la casa (en coordenadas del mundo), con la puerta mirando hacia el jugador
function bloques(P, x0, y0, z0, fwd) {
  const out = [];
  const W = P.w, D = P.d, H = P.h;
  // lz crece alejándose del jugador (fwd); lx va de lado
  const right = [-fwd[1], fwd[0]];
  const rot = (lx, lz) => [lx * right[0] + lz * fwd[0], lx * right[1] + lz * fwd[1]];
  const put = (lx, ly, lz, id) => { const [rx, rz] = rot(lx, lz); out.push([x0 + rx, y0 + ly, z0 + rz, id]); };
  const hw = Math.floor(W / 2);
  const zIni = P.corredor ? -2 : 0;
  // piso (y corredor al frente)
  for (let lx = -hw; lx <= hw; lx++) for (let lz = zIni; lz < D; lz++) put(lx, 0, lz, P.piso());
  // paredes
  for (let ly = 1; ly <= H; ly++) for (let lx = -hw; lx <= hw; lx++) for (let lz = 0; lz < D; lz++) {
    const borde = lx === -hw || lx === hw || lz === 0 || lz === D - 1;
    if (!borde) { put(lx, ly, lz, 0); continue; }
    const esquina = (lx === -hw || lx === hw) && (lz === 0 || lz === D - 1);
    if (P.abierto && !esquina) { put(lx, ly, lz, 0); continue; }
    const puerta = lz === 0 && lx === 0 && ly <= 2;
    const ventana = ly === 2 && !esquina && !puerta && ((lz === 0 && Math.abs(lx) === 2) || ((lx === -hw || lx === hw) && lz === Math.floor(D / 2)));
    let vid = ventana && P.ventana() ? P.ventana() : 0;
    // v12.4.9: el postigo va a lo largo de su pared (las de los lados corren hacia adelante; si se mira por x, al revés)
    if (vid === K.postigo && ((lx === -hw || lx === hw) !== (fwd[0] !== 0))) vid = K.postigo_z;
    put(lx, ly, lz, puerta ? 0 : vid || P.pared());
  }
  // corredor con baranda y postes
  const poste = P.poste ? P.poste() : K.log; // v12.4.7: el bahareque lleva horcones
  if (P.corredor) for (let lx = -hw; lx <= hw; lx++) { put(lx, 1, -2, Math.abs(lx) === hw || lx === 0 ? (lx === 0 ? 0 : poste) : K.cerca); put(lx, 2, -2, Math.abs(lx) === hw ? poste : 0); put(lx, 3, -2, Math.abs(lx) === hw ? poste : 0); }
  // techo a dos aguas (escalonado)
  const sube = Math.ceil((W + 2) / 2);
  for (let k = 0; k < sube; k++) for (let lz = zIni - 1; lz <= D; lz++) {
    for (const s of [-1, 1]) { const lx = s * (hw + 1 - k); put(lx, H + 1 + k, lz, P.techo()); }
    if (k === sube - 1) put(0, H + 1 + k, lz, P.techo());
  }
  return out;
}

export function usarPlano(g, id, t) {
  const P = PLANOS[id];
  if (!P || !t) { g.ui.toast('Apunte al suelo donde quiere la casa', 1600); return false; }
  if (g.obra) { g.ui.toast('Ya hay una obra en construcción', 1400); return false; }
  const d = g.player.lookDir();
  // hacia adónde mira el jugador (redondeado): la casa crece para allá, con la puerta de frente a uno
  const fwd = Math.abs(d.z) > Math.abs(d.x) ? [0, d.z > 0 ? 1 : -1] : [d.x > 0 ? 1 : -1, 0];
  const x0 = t.x + fwd[0], z0 = t.z + fwd[1], y0 = t.y + 1;
  const lista = bloques(P, x0, y0 - 1, z0, fwd);
  // ¿cabe? (no tumba más de un 8 % de bloques sólidos)
  const w = g.world;
  let estorba = 0;
  // el piso reemplaza al suelo a propósito: solo cuenta lo que está de ahí para arriba
  for (const [x, y, z, b] of lista) if (y >= y0 && b && !blando(w.getBlock(x, y, z))) estorba++;
  if (estorba > lista.length * 0.08) { g.ui.toast('🚧 No cabe: hay muchos bloques en el camino. Busque un lugar más plano y despejado', 2600); return false; }
  // materiales
  if (g.mode === 'survival') {
    const faltan = P.mats().filter(([mid, n]) => g.inventory.count(mid) < n);
    if (faltan.length) { g.ui.toast(`📐 Faltan materiales: ${faltan.map(([mid, n]) => `${n - g.inventory.count(mid)} ${BLOCKS[mid] ? BLOCKS[mid].name.toLowerCase() : 'puerta'}`).join(', ')}`, 3600); return false; }
    for (const [mid, n] of P.mats()) g.inventory.remove(mid, n);
  }
  g.obra = { lista, i: 0, x0, y0, z0, fd: facingFromLook(d.x, d.z), nombre: P.nombre, logro: P.logro, puerta: P.mats().some(([m]) => m === 266) };
  g.ui.toast(`🏗 ¡Manos a la obra! Levantando: ${P.nombre}`, 2200);
  return true;
}

// la obra avanza unos bloques por cuadro, con polvo y sonido
export function tickObra(g, dt) {
  const O = g.obra;
  if (!O) return;
  O.t = (O.t || 0) + dt;
  const n = Math.max(1, Math.floor(O.t * 40) - O.i);
  const w = g.world;
  for (let k = 0; k < n && O.i < O.lista.length; k++, O.i++) {
    const [x, y, z, id] = O.lista[O.i];
    if (!id && !blando(w.getBlock(x, y, z))) continue;
    w.setBlock(x, y, z, id, { updates: false });
    if (id && O.i % 3 === 0) { g.particles.blockBreak(x, y, z, id, 4); if (O.i % 9 === 0) g.audio.material(BLOCKS[id].sound, 'place', { x: x + 0.5, y: y + 0.5, z: z + 0.5 }); }
  }
  if (O.i >= O.lista.length) {
    if (O.puerta) g.stations.placeDoor(O.x0, O.y0, O.z0, O.fd);
    g.ui.toast(`🏠 ¡Listo! ${O.nombre} terminada. ¡Pura vida!`, 2600);
    g.achieve('plano', 'Casa en un ratito');
    if (O.logro) g.achieve(...O.logro); // v12.4.7
    g.obra = null;
  }
}
