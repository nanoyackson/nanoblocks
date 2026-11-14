// v12.15.3 (C8-C «El Comité de Caminos»): la misión larga de la red de pueblos. Don Evelio, presidente del Comité, aparece en la plaza del
// pueblo que toca (el de la casa, y después cada pueblo vecino) y pide, etapa por etapa: mojones en el camino, tablas finas para un puente,
// faroles forjados, tejas, comida para la minga y, al final, la Gran Minga en el pueblo de la casa. Diseño: docs/revisiones/DISENO_CONTENIDO_C5-C8.md §C8-C.
// Estado (se guarda): meta.comite = { pueblos: [{ id, x, y, z, name }], paso, mojones: [[x, y, z]], hecho }.
// Simplificado a propósito (anotado en el CHANGELOG): sin cimarrona (viene con C8-B), las placas y el mercado regional quedan para después;
// «obra» del puente = entregar las tablas finas. En red solo lo hace el anfitrión (los invitados no ven a Don Evelio).
import { BLOCK_BY_KEY as K } from './blocks.js';
import { villageAt, CELL as VCELL } from './pueblogen.js';
import { decir } from './misiones.js';

export const MOJON = 696, SELLO = 1188, PASE_CAMINOS = 1189;
const COLON = 360, PREMIO = 200, TABLA_FINA = 1138, SOPA = 1117, TAMAL = 353;
const NOMBRE = 'Don Evelio (presidente del Comité de Caminos)';
const MAX_PUEBLOS = 5, ALCANCE = 1200, FRANJA = 12, SEPARACION = 20, NECESITA_MOJONES = 6;

// los pueblos del Comité: los más cercanos a la casa (a ≤ 1 200 bloques), ordenados por distancia; mínimo 2
export function pueblosDelComite(g) {
  const s = g.meta.spawn;
  if (!s || g.world.gen.version < 3) return [];
  const gen = g.world.gen, cx = Math.floor(s.x / VCELL), cz = Math.floor(s.z / VCELL), res = [];
  for (let dz = -4; dz <= 4; dz++) for (let dx = -4; dx <= 4; dx++) {
    const v = villageAt(gen, cx + dx, cz + dz);
    if (!v || !v.streets) continue;
    const d = Math.hypot(v.x - s.x, v.z - s.z);
    if (d <= ALCANCE) res.push({ id: v.id, x: v.x, y: v.y, z: v.z, name: v.name || 'el pueblo', d });
  }
  return res.sort((a, b) => a.d - b.d).slice(0, MAX_PUEBLOS).map((q) => ({ id: q.id, x: q.x, y: q.y, z: q.z, name: q.name }));
}

// qué se pide en cada paso (paso i → pueblo i; el último paso es la Gran Minga, en el pueblo de la casa)
export function pasoDe(C) {
  const n = C.pueblos.length, i = C.paso;
  if (i >= n) return { tipo: 'minga', pueblo: C.pueblos[0] };
  const p = C.pueblos[i];
  if (i === 0) return { tipo: 'mojones', pueblo: p, titulo: 'El mojón cero' };
  if (i === 1) return { tipo: 'dar', pueblo: p, titulo: 'El puente', pide: [[[TABLA_FINA], 12, 'tablas finas']], alt: [[[K.planks], 24, 'tablas']] };
  if (i === 2) return { tipo: 'dar', pueblo: p, titulo: 'La luz de la plaza', pide: [[[K.farol_forjado], 4, 'faroles forjados']] };
  if (i === 3) return { tipo: 'dar', pueblo: p, titulo: 'El techo de la escuela', pide: [[[K.teja], 20, 'tejas']] };
  return { tipo: 'dar', pueblo: p, titulo: 'La minga', pide: [[[SOPA], 10, 'sopas de mariscos']], alt: [[[TAMAL], 20, 'tamales']] };
}

const estado = (g) => (g.meta.comite && typeof g.meta.comite === 'object' ? g.meta.comite : null);
const solo = (g) => !g.meta.invitado && g.mode === 'survival' && g.dim === 'tierra';

// los mojones que de verdad cuentan: siguen puestos, a ≤ 12 bloques de la recta casa → pueblo B y separados entre sí
export function mojonesBuenos(g, C) {
  const A = C.pueblos[0], B = C.pueblos[1];
  if (!A || !B) return [];
  const dx = B.x - A.x, dz = B.z - A.z, L2 = dx * dx + dz * dz || 1, buenos = [];
  for (const [x, y, z] of C.mojones || []) {
    if (g.world.isLoaded(x, z) && g.world.getBlock(x, y, z) !== MOJON) continue; // lejos y sin cargar: se confía en lo anotado (si lo rompen, alCambiarBloqueComite lo borra)
    const t = ((x - A.x) * dx + (z - A.z) * dz) / L2;
    if (t < -0.05 || t > 1.05) continue;
    if (Math.hypot(A.x + dx * t - x, A.z + dz * t - z) > FRANJA) continue;
    if (buenos.some((b) => Math.hypot(b[0] - x, b[2] - z) < SEPARACION)) continue;
    buenos.push([x, y, z]);
  }
  return buenos;
}

// al poner un mojón se anota (game.js lo llama desde onBlockChange)
export function alCambiarBloqueComite(g, x, y, z, old, id) {
  const C = estado(g);
  if (!C || g.meta.invitado) return;
  if (old === MOJON && id !== MOJON && C.mojones) C.mojones = C.mojones.filter((m) => !(m[0] === x && m[1] === y && m[2] === z));
  if (id === MOJON && old !== MOJON) {
    if (!(C.mojones ||= []).some((m) => m[0] === x && m[1] === y && m[2] === z)) C.mojones.push([x, y, z]);
    if (C.paso === 0) g.ui.toast(`🪨 Mojón puesto: ${mojonesBuenos(g, C).length} de ${NECESITA_MOJONES} que cuentan para el Comité`, 2400);
  }
}

function crear(g, p) {
  const m = g.entities.spawnMob('vecino', p.x + 3, p.y + 1, p.z + 3);
  m.data = { vid: `comite:${p.id}`, name: NOMBRE, role: 'presidente_comite', seed: 4242, home: { x: p.x + 3, y: p.y + 1, z: p.z + 3 }, plaza: { x: p.x + 3, y: p.y + 1, z: p.z + 3 }, comite: true };
  m.kind.dress(m);
  return m;
}

// cada segundo: Don Evelio aparece en la plaza del pueblo que toca y se va cuando uno se aleja
export function tickComite(g) {
  if (!solo(g)) return;
  const p = g.player.body.pos, M = g.meta;
  let C = estado(g);
  const evs = g.entities.mobs.filter((m) => !m.dead && m.data && m.data.comite);
  let meta = null; // el pueblo donde debería estar
  if (C && C.hecho) meta = null;
  else if (C) meta = pasoDe(C).pueblo;
  else {
    if ((g.day || 1) < 2) return;
    if (!g.comiteBuscado || g.comiteBuscado < (g.clock || 0)) { g.comiteBuscado = (g.clock || 0) + 20; g.comiteLista = pueblosDelComite(g); }
    if (g.comiteLista && g.comiteLista.length >= 2) meta = g.comiteLista[0];
  }
  for (const m of evs) {
    if (!meta || m.data.vid !== `comite:${meta.id}` || Math.hypot(m.body.pos.x - p.x, m.body.pos.z - p.z) > 140) { if (!m.data.irse) m.data.irse = 2; }
  }
  if (!meta || g.dim !== 'tierra' || evs.some((m) => !m.data.irse)) return;
  if (Math.hypot(meta.x - p.x, meta.z - p.z) > 70 || g.daylight < 0.3) return;
  crear(g, meta);
  if (!C && !M.comiteAviso) { M.comiteAviso = true; g.ui.toast('🛣 El Comité de Caminos necesita manos: Don Evelio lo espera en la plaza', 3600); }
}

const falta = (g, p) => {
  const total = p[0].reduce((s, id) => s + g.inventory.count(id), 0);
  return { total, ok: total >= p[1] };
};
function quitar(g, p) {
  let r = p[1];
  for (const id of p[0]) { const n = Math.min(r, g.inventory.count(id)); if (n) { g.inventory.remove(id, n); r -= n; } }
}

// clic derecho a Don Evelio
export function comiteInteract(m, g) {
  if (!m.data || !m.data.comite) return false;
  const dlg = (t, ms) => g.ui.dialog(m.data.name, t, ms || 5200);
  let C = estado(g);
  if (!C) {
    const lista = pueblosDelComite(g);
    if (lista.length < 2) { dlg('Aquí hacen falta caminos, pero en este rincón no hay otros pueblos a la mano. Ya veremos.'); return true; }
    C = g.meta.comite = { pueblos: lista, paso: 0, mojones: [], hecho: false };
    g.giveItem(SELLO, 1);
    dlg(`El Comité de Caminos quiere unir ${lista.length} pueblos: ${lista.map((p) => p.name).join(', ')}. Empezamos por el mojón cero: ponga ${NECESITA_MOJONES} mojones (4 piedra y 1 pómez o arcilla) a lo largo del camino hacia ${lista[1].name}, uno cada 20 bloques o más. Tome el sello del Comité.`, 9000);
    return true;
  }
  if (C.hecho) { dlg('¡Qué caminos los que hicimos, mae! Con el pase viaja gratis entre nuestros pueblos.'); return true; }
  const P = pasoDe(C);
  if (P.tipo === 'mojones') {
    const n = mojonesBuenos(g, C).length;
    if (n < NECESITA_MOJONES) { dlg(`Van ${n} de ${NECESITA_MOJONES} mojones en el camino a ${C.pueblos[1].name} (a menos de ${FRANJA} bloques de la línea recta y separados 20 bloques). Se hacen con 4 piedra y 1 pómez (o 1 arcilla).`); return true; }
    C.paso = 1;
    g.addXP && g.addXP(15);
    g.achieve('comite_mojones', 'El mojón cero');
    dlg(`¡Quedó derechito el camino! Ahora sígame a ${C.pueblos[1].name}: ahí hay que hacer el puente.`);
    return true;
  }
  if (P.tipo === 'dar') {
    const q = [P.pide[0], ...(P.alt || [])].find((o) => falta(g, o).ok);
    if (!q) {
      const a = P.pide[0];
      dlg(`${P.titulo}: lléveme ${a[1]} ${a[2]}${P.alt ? ` (o ${P.alt[0][1]} ${P.alt[0][2]})` : ''}. Le faltan ${Math.max(0, a[1] - falta(g, a).total)}.`);
      return true;
    }
    quitar(g, q);
    C.paso++;
    g.addXP && g.addXP(20);
    g.audio.play('monedas', { ui: true, vol: 0.5 });
    const sig = pasoDe(C);
    dlg(`¡Eso es! ${P.titulo} está cumplido. ${sig.tipo === 'minga' ? `Ahora a ${sig.pueblo.name} para la Gran Minga.` : `Siga con ${sig.pueblo.name}: ahí lo espero.`}`);
    return true;
  }
  // la Gran Minga
  dlg('¡Hoy es la Gran Minga! Los vecinos de los pueblos se juntaron en la plaza y no hay cimarrona, pero sí marimba en el corazón. ¡Gracias, mae!', 7000);
  C.hecho = true;
  g.giveItem(COLON, PREMIO);
  g.giveItem(PASE_CAMINOS, 1);
  const R = (g.meta.repPueblo ||= {});
  for (const p of C.pueblos) R[p.id] = (R[p.id] || 0) + 5;
  g.audio.play('monedas', { ui: true, vol: 0.8 });
  g.ui.toast(`🛣 Gran Minga: ₡${PREMIO * 500} de premio, el Pase de los Caminos y +5 de reputación en ${C.pueblos.length} pueblos`, 4800, 'importante');
  g.achieve('comite_caminos', 'El Comité de Caminos');
  g.addXP && g.addXP(120);
  decir(g, m, '¡Pura vida, Comité!', 4);
  return true;
}

// el bus: gratis entre los pueblos del Comité con el pase en la mochila (bus.js)
export function viajaGratis(g, origenId, destinoId) {
  const C = estado(g);
  if (!C || !C.hecho || g.inventory.count(PASE_CAMINOS) < 1) return false;
  const ids = C.pueblos.map((p) => p.id);
  return ids.includes(origenId) && ids.includes(destinoId);
}
