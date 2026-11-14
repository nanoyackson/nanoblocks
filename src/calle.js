// La «calle nueva» (sátira ficticia): cada semana la municipalidad abre una zanja en la calle del pueblo, con conos,
// barrera y un ingeniero que no sabe para qué es el hueco; a los tres días la tapan… con un parche. Y la otra semana,
// otra vez. Solo toca bloques de calle (y aire para los conos), y guarda lo que cambió para devolverlo.
import { BLOCK_BY_KEY as K, AIR } from './blocks.js';
import { decir } from './misiones.js';

const DICHOS = [
  'Estamos abriendo para meter un tubo.', 'La semana pasada la cerramos… pero se nos olvidó el tubo.',
  'Esto queda listo en dos semanas. De las nuestras.', 'No sé para qué es el hueco, a mí solo me dijeron que abriera.',
  'Es una obra de mejoramiento vial. Primero empeora, después mejora.', 'Paciencia, que la calle nueva va a quedar como nueva.',
  'Ya pedimos el material. Llega cuando llegue.', '¿El parche de la vez pasada? Ese era temporal… desde hace cinco años.',
];
const calleIds = () => new Set([K.asfalto, K.asfalto_linea, K.asfalto_parche, K.asfalto_roto]);

export function tickCalle(g, dt) {
  if (g.dim !== 'tierra' || g.mode !== 'survival') return;
  g.calleT = (g.calleT || 0) - dt;
  if (g.calleT > 0) return;
  g.calleT = 1;
  const p = g.player.body.pos, near = g.nearestVillage(p.x, p.z);
  const obras = (g.meta.calle ||= {});
  const ing = g.entities.mobs.filter((m) => m.data && m.data.obra && !m.dead);
  if (!near || near.dist > 70) { for (const m of ing) m.dead = true; return; }
  const v = near.v, vid = `${v.x},${v.z}`;
  const semana = Math.floor((g.day || 1) / 7), d7 = (g.day || 1) % 7;
  let O = obras[vid];
  // de martes a jueves (días 2 a 4 de la semana del juego) la zanja está abierta
  if (d7 >= 2 && d7 <= 4) {
    if (!O || O.semana !== semana) {
      if (O && O.fase === 'abierta' && !cerrar(g, O)) return;
      O = abrir(g, v, semana);
      if (!O) return;
      obras[vid] = O;
      if (near.dist < 50) g.ui.toast('🚧 La municipalidad abrió una zanja en la calle del pueblo. «Calle nueva», dicen', 3200);
    }
  } else if (O && O.fase === 'abierta' && cerrar(g, O)) {
    g.meta.calleVeces = (g.meta.calleVeces || 0) + 1;
    if (near.dist < 50) g.ui.toast('🚧 Taparon la zanja… con un parche. La otra semana la vuelven a abrir', 3200);
    if (g.meta.calleVeces >= 3) g.achieve('calle_nueva', 'La calle de nunca acabar');
  }
  // el ingeniero, de día, al lado de la zanja
  if (O && O.fase === 'abierta' && g.daylight > 0.4) {
    let m = ing[0];
    if (!m) {
      m = g.entities.spawnMob('vecino', O.x + 2.5, O.y + 1.1, O.z + 0.5);
      const here = { x: O.x + 2, y: O.y + 1, z: O.z };
      Object.assign(m.data, { home: here, plaza: { ...here }, name: 'Ing. Zanjas (Municipalidad)', role: 'vecino', vid: `obra:${Math.random()}`, seed: 777 + Math.floor(Math.random() * 1000), obra: true });
      if (m.kind.dress) m.kind.dress(m);
      m.frozen = true;
    }
    const d = Math.hypot(m.body.pos.x - p.x, m.body.pos.z - p.z);
    m.data.dichoT = (m.data.dichoT ?? 0) - 1;
    if (d < 7 && m.data.dichoT <= 0) { m.data.dichoT = 10; decir(g, m, DICHOS[Math.floor(Math.random() * DICHOS.length)], 4); g.achieve('ingeniero', 'Hablé con el ingeniero'); }
  } else for (const m of ing) m.dead = true;
}

function abrir(g, v, semana) {
  const w = g.world, C = calleIds();
  for (let t = 0; t < 300; t++) {
    const x = Math.floor(v.x + (Math.random() - 0.5) * 50), z = Math.floor(v.z + (Math.random() - 0.5) * 50);
    if (!w.isLoaded(x, z)) continue;
    for (let y = (v.y || 70) + 4; y > (v.y || 70) - 5; y--) {
      const id = w.getBlock(x, y, z);
      if (id === AIR) continue;
      if (!C.has(id)) break;
      // que haya calle alrededor (3 × 3) y aire arriba
      let ok = true;
      for (let dx = -1; dx <= 1 && ok; dx++) for (let dz = -1; dz <= 1 && ok; dz++) if (!C.has(w.getBlock(x + dx, y, z + dz)) || w.getBlock(x + dx, y + 1, z + dz) !== AIR) ok = false;
      if (!ok) break;
      const orig = [];
      const poner = (xx, yy, zz, id2) => { orig.push([xx, yy, zz, w.getBlock(xx, yy, zz)]); w.setBlock(xx, yy, zz, id2); };
      for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) { poner(x + dx, y, z + dz, AIR); if (w.getBlock(x + dx, y - 1, z + dz) !== K.dirt) poner(x + dx, y - 1, z + dz, K.dirt); }
      // conos en las esquinas y la barrera, solo donde haya aire encima de la calle
      for (const [dx, dz, b] of [[-2, -2, K.cono], [2, -2, K.cono], [-2, 2, K.cono], [2, 2, K.cono], [0, -2, K.barrera], [0, 2, K.barrera]]) {
        if (w.getBlock(x + dx, y + 1, z + dz) === AIR && C.has(w.getBlock(x + dx, y, z + dz))) poner(x + dx, y + 1, z + dz, b);
      }
      g.particles.burst(x + 0.5, y + 0.5, z + 0.5, [[0.4, 0.35, 0.3], [0.25, 0.25, 0.27]], 30, 3);
      return { x, y, z, semana, fase: 'abierta', orig };
    }
  }
  return null;
}

function cerrar(g, O) {
  const w = g.world;
  // solo si todo está cargado (si no, se intenta después)
  if (O.orig.some(([x, , z]) => !w.isLoaded(x, z))) return false;
  for (const [x, y, z, id] of O.orig) {
    // lo que era calle vuelve… como parche
    w.setBlock(x, y, z, id === AIR ? AIR : y === O.y && (id === K.asfalto || id === K.asfalto_linea || id === K.asfalto_roto) ? K.asfalto_parche : id);
  }
  O.fase = 'parchada';
  O.orig = [];
  return true;
}
