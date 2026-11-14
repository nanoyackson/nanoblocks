import * as THREE from 'three';
// Sátira (todo ficticio): «la platina» que suena en los puentes de un carril, y el permiso de funcionamiento de la
// soda propia (el trámite de tres días en la municipalidad… y el inspector que multa a las sodas sin permiso).
import { BLOCK_BY_KEY as K, FLUID } from './blocks.js';
import { hash3 } from './noise.js';
import { decir } from './misiones.js';
import { structuresNear } from './estructuras.js';

// ---------- la platina ----------
export function tickPlatina(g, dt) {
  if (g.dim !== 'tierra') return;
  g.platinaT = (g.platinaT || 0) - dt;
  if (g.platinaT > 0) return;
  g.platinaT = 0.1;
  const p = g.player.body.pos, w = g.world;
  const x = Math.floor(p.x), z = Math.floor(p.z), y = Math.floor(p.y - 0.5);
  if (w.getBlock(x, y, z) !== K.concreto) return;
  // ¿es un puente? (agua abajo)
  let agua = false;
  for (let yy = y - 1; yy > y - 8; yy--) { const id = w.getBlock(x, yy, z); if (FLUID[id] === 1) { agua = true; break; } if (id) break; }
  if (!agua) return;
  // una losa de cada tantas es la platina (siempre la misma)
  if (hash3(911, x, 0, z) > 0.07) return;
  const k = `${x},${z}`;
  if (g.platinaUlt === k) return;
  g.platinaUlt = k;
  g.audio.play('hueco', { pos: { x: x + 0.5, y: y + 1, z: z + 0.5 }, vol: 1, pitch: 1.7 });
  g.audio.play('dig.stone', { pos: { x: x + 0.5, y: y + 1, z: z + 0.5 }, vol: 0.8, pitch: 0.6 });
  g.shake = Math.max(g.shake || 0, g.riding ? 0.5 : 0.25);
  if (g.riding && g.riding.data) g.riding.data.bumpT = 0.35;
  g.meta.platinas = (g.meta.platinas || 0) + 1;
  if (g.meta.platinas === 1) g.ui.toast('🔩 ¡CLANG! La platina del puente… la «arreglan» todos los años (ficticio)', 3200);
  g.achieve('platina', 'La famosa platina');
  if (g.meta.platinas >= 20) g.achieve('platina20', 'Ya me sé todas las platinas');
}

// ---------- el permiso de la soda ----------
const PASOS = [
  'Para el permiso de funcionamiento de la soda ocupa el permiso de Salud, la patente y un timbre. Hoy no hay sistema: vuelva mañana.',
  'Ah, usted es el de la soda… le falta el sello del Ministerio. Y la jefa que firma está de vacaciones. Vuelva mañana.',
  'Ya llegó la jefa… pero el formulario es el viejo. Llene este nuevo y vuelva mañana, sin falta.',
];
export function tramiteSoda(m, g) {
  const M = g.meta;
  if (M.permisoSoda || !(M.sodaClientes > 0) || m.data.role !== 'funcionario') return false;
  const d = g.day || 1;
  M.tramSoda = M.tramSoda || { paso: 0, dia: 0 };
  const T = M.tramSoda;
  if (T.paso > 0 && d <= T.dia) { decir(g, m, 'Ya le dije: vuelva mañana. El sistema sigue lento.', 4); g.ui.dialog(m.data.name, 'Ya le dije: vuelva mañana. El sistema sigue lento.', 3600); return true; }
  if (T.paso < PASOS.length) {
    g.ui.dialog(m.data.name, PASOS[T.paso], 5600);
    T.paso++; T.dia = d;
    g.achieve('tramite_soda', 'Trámite eterno');
    return true;
  }
  if (g.inventory.count(360) < 20) { g.ui.dialog(m.data.name, 'Listo, ya salió su permiso… son 20 colones del timbre. ¿No los tiene? Vuelva cuando los tenga.', 4800); return true; }
  g.inventory.remove(360, 20);
  M.permisoSoda = true;
  g.ui.dialog(m.data.name, '¡Felicidades! Aquí está su permiso de funcionamiento. Póngalo en un lugar visible. Se renueva cada año… o cuando nos acordemos.', 6000);
  g.audio.play('monedas', { ui: true, vol: 0.5 });
  g.achieve('permiso_soda', 'Soda con todos los permisos');
  return true;
}

// el inspector: en una soda sin permiso, de vez en cuando llega con multa y la cierra un rato
export function quizaInspector(g, S) {
  if (g.meta.permisoSoda || !(g.meta.sodaClientes >= 3) || Math.random() > 0.18) return false;
  const p = g.player.body.pos;
  const m = g.entities.spawnMob('vecino', S.x + 2.5, S.y + 0.1, S.z + 0.5);
  m.data = { vid: `inspector:${g.clock}`, name: 'Inspector municipal', role: 'vecino', seed: 77777, home: { x: S.x, y: S.y, z: S.z }, plaza: { x: S.x, y: S.y, z: S.z }, irse: 12 };
  m.kind.dress(m);
  m.frozen = true; m.yaw = m.targetYaw = Math.atan2(p.x - m.body.pos.x, p.z - m.body.pos.z);
  const multa = Math.min(15, g.inventory.count(360));
  if (multa) g.inventory.remove(360, multa);
  setTimeout(() => { if (!m.dead) decir(g, m, '¿Y el permiso de funcionamiento? ¡Multa!', 5); }, 300);
  g.ui.toast(`🧾 Llegó el inspector municipal: la soda no tiene permiso. Multa de ${multa} colones y cerrada 2 minutos (el permiso se saca en la municipalidad)`, 4800);
  g.sodaCerradaHasta = (g.clock || 0) + 120;
  g.achieve('multa_soda', 'Me cerraron la soda');
  return true;
}

// ---------- la presa eterna de la circunvalación (ficticia) ----------
// cerca de la capital, en cualquier calle de asfalto, siempre hay presa: carros parados adelante y atrás, y pitos
// en la capital las calles son de piedra lisa o concreto; afuera, asfalto
const CALLE = () => new Set([K.asfalto, K.asfalto_linea, K.asfalto_parche, K.asfalto_roto, K.smooth_stone, K.concreto].filter(Boolean));
const VENDE = [
  { nombre: 'Vendedor de agua', grito: '¡Agua, agua fría! ¡Pipa fría!', id: 382, precio: 1, color: 0x3a8ae8 },
  { nombre: 'Vendedora de maní', grito: '¡Maní, maní tostadito!', id: 397, precio: 1, color: 0xc8883a },
  { nombre: 'Vendedor de cargadores', grito: '¡Cargadores para el celular! ¡Audífonos! ¡Lleve, lleve!', id: null, precio: 0, color: 0x2a2a2e },
];
// clic derecho a un vendedor de la presa
export function vendedorPresaInteract(m, g) {
  const V = m.data.vendePresa;
  if (!V) return false;
  if (!V.id) { decir(g, m, 'Jefe, el cargador es universal… para casi ningún celular. ¡Pero baratico!', 3.5); g.achieve('cargador', 'El cargador universal'); return true; }
  if (g.mode === 'survival') {
    if (g.inventory.count(360) < V.precio) { decir(g, m, '¡Es un colón nada más, patrón!', 2.5); return true; }
    g.inventory.remove(360, V.precio);
  }
  g.giveItem(V.id, 1);
  g.audio.play('monedas', { ui: true, vol: 0.4 });
  decir(g, m, '¡Pura vida! ¡Que le rinda la presa!', 2.5);
  g.achieve('vendedor_presa', 'Compras en la presa');
  return true;
}
export function tickPresaEterna(g) {
  if (g.dim !== 'tierra' || g.mode !== 'survival') return;
  const p = g.player.body.pos, w = g.world;
  g.capitalT = (g.capitalT || 0) - 1;
  if (g.capitalT <= 0) { g.capitalT = 10; g.cerCapital = structuresNear(w.gen, p.x, p.z, 260, new Set(['capital'])).length > 0; }
  const carros = g.entities.mobs.filter((m) => m.data && m.data.presaEterna && !m.dead);
  const enCalle = CALLE().has(w.getBlock(Math.floor(p.x), Math.floor(p.y - 0.5), Math.floor(p.z)));
  if (!g.cerCapital || !enCalle) {
    for (const m of carros) if (Math.hypot(m.body.pos.x - p.x, m.body.pos.z - p.z) > 40) m.dead = true;
    return;
  }
  if (!g.meta.presaAviso) { g.meta.presaAviso = true; g.ui.toast('🚗🚗🚗 Bienvenidos a la Circunvalación (ficticia): presa desde 1979. Tiempo estimado: sí', 4200); g.achieve('presa_eterna', 'La presa eterna'); }
  // carros parados en la calle alrededor (hasta 8)
  if (carros.length < 8) {
    const a = Math.random() * Math.PI * 2, r = 8 + Math.random() * 14;
    const x = Math.floor(p.x + Math.cos(a) * r), z = Math.floor(p.z + Math.sin(a) * r);
    for (let y = Math.floor(p.y) + 3; y > p.y - 4; y--) {
      if (CALLE().has(w.getBlock(x, y, z)) && w.getBlock(x, y + 1, z) === 0 && w.getBlock(x, y + 2, z) === 0) {
        const m = g.entities.spawnMob('carro', x + 0.5, y + 1.05, z + 0.5);
        m.frozen = true; m.data.presaEterna = true; m.yaw = m.targetYaw = Math.round(Math.random() * 4) * (Math.PI / 2);
        break;
      }
    }
  }
  // vendedores que caminan entre los carros
  const vendedores = g.entities.mobs.filter((m) => m.data && m.data.vendePresa && !m.dead);
  if (vendedores.length < 3 && carros.length > 3 && Math.random() < 0.35) {
    const c = carros[Math.floor(Math.random() * carros.length)];
    const v = g.entities.spawnMob('vecino', c.body.pos.x + 1.5, c.body.pos.y + 0.2, c.body.pos.z + 1.5);
    const here = { x: Math.floor(c.body.pos.x), y: Math.floor(c.body.pos.y), z: Math.floor(c.body.pos.z) };
    const V = VENDE[vendedores.length % VENDE.length];
    Object.assign(v.data, { home: here, plaza: { ...here }, name: V.nombre, role: 'vecino', vid: `presa:${Math.random()}`, seed: 300 + Math.floor(Math.random() * 99), vendePresa: V });
    if (v.kind.dress) v.kind.dress(v);
  }
  for (const v of vendedores) {
    const V = v.data.vendePresa, u = v.group.userData;
    // la cajita con la mercadería en la mano
    if (!u.pending && !u.cajita && u.npcArms) { const cj = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.2, 0.26), new THREE.MeshBasicMaterial({ color: V.color })); cj.position.set(0, -0.62, 0.18); u.npcArms[1].add(cj); u.cajita = cj; }
    v.data.gritoT = (v.data.gritoT ?? Math.random() * 3) - 1; // esto corre una vez por segundo
    if (v.data.gritoT <= 0 && Math.hypot(v.body.pos.x - p.x, v.body.pos.z - p.z) < 20) { v.data.gritoT = 5 + Math.random() * 5; decir(g, v, V.grito, 2.6); }
    if (Math.hypot(v.body.pos.x - p.x, v.body.pos.z - p.z) > 45) v.dead = true;
  }
  // pitos de la gente desesperada
  if (carros.length && Math.random() < 0.35) { const m = carros[Math.floor(Math.random() * carros.length)]; g.audio.play('pito', { pos: m.soundPos(), vol: 0.8, pitch: 0.85 + Math.random() * 0.4 }); }
}
