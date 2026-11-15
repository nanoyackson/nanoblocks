// Estructuras ticas que se generan solas (generador v5): Faro de Puntarenas, puesto de Churchill,
// muelle y puestos de Caldera, Fortín de Heredia, carretas típicas con bueyes, estatuas y la Fuente de la Hispanidad.
// Cada tipo tiene una grilla propia; en cada celda puede tocar una, en un lugar que cumpla sus condiciones.
// Sin gráficos (lo usa el generador).
import { hash3, mulberry32 } from './noise.js';
import { BLOCK_BY_KEY as K } from './blocks.js';
import { villageAt, CELL as VCELL, rellenarBajoObras } from './pueblogen.js';
import { buildRuinasGrande, buildFortinGrande, buildGuanacasteGigante } from './monumentos_grandes.js';
import { buildPlayaLujo } from './lujo.js';
import { buildRefineria } from './refineria.js';
import { buildBeneficio, buildTrapicheViejo, buildHacienda, buildBananera, buildCatarata, placePuenteColgante, buildPuenteColgante } from './agro.js';
import { buildIrazu, buildRinconVieja, buildBarraHonda, placeAmistad, buildAmistad } from './naturaleza2.js';
import { buildCacaotal, buildLecheria } from './agro2.js';
import { buildCanopy } from './canopy.js';
import { buildSitioArqueologico } from './ruinas2.js';
import { buildCaverna } from './caverna.js';
import { buildCuevaBarraHonda, buildCuevaVenado, buildGeodaMayor } from './cuevas.js';
import { buildTermales } from './fuego.js';
import { buildTemplo } from './templo.js';
import { buildCatarataEscondida } from './catarata2.js';
import { buildBraulio, buildJuanCastro, buildCarara, buildAmistadParque, buildRinconParque } from './parques3.js';
import { buildCerroMuerte, buildConchal, buildTurrialba, placeSanLucas, buildSanLucas } from './lugares3.js';
import { buildZapote, buildAeropuerto, placeZurqui, buildZurqui } from './festejos.js';
import { buildFeria, buildCementerio, buildMuelleLimon, placeFeriaPueblo, placeCementerioPueblo } from './pueblos2.js';
import { buildCahuita, buildTenorio, buildMonteverde, buildPaloVerde, placeIslaCoco, buildIslaCoco } from './parques2.js';
import { buildMarinoBallena, buildCorcovado, buildManuelAntonio, buildTortuguero } from './parques.js';
import { buildSanatorio, buildMetalico, buildCorreos, buildMuseoNinos, buildGrecia, buildCoronado, buildUjarras, buildSantaRosa, buildEsferas, buildAduana } from './historicos.js';
import { buildEstadioNacional, buildEstadioObra, buildEstacion, buildMonumentoNacional, buildTemploMusica } from './estadios.js';
// v12.4.9: los bloques de forma que tienen versión girada (solo el postigo: los demás quedan como siempre para no cambiar mundos viejos)
const GIRA = { [K.postigo]: K.postigo_z, [K.postigo_z]: K.postigo, [K.postigo_abierto]: K.postigo_z_abierto, [K.postigo_z_abierto]: K.postigo_abierto };

const SEA = 62;
const CH = 16;
const TREE = new Set([K.log, K.leaves, K.birch_log, K.birch_leaves, K.jungle_log, K.jungle_leaves, K.vine, K.tronco_musgoso]);
const rot = (dx, dz, r) => (r === 0 ? [dx, dz] : r === 1 ? [-dz, dx] : r === 2 ? [-dx, -dz] : [dz, -dx]);
// orientación local (0 +z, 1 +x, 2 -z, 3 -x) a orientación del mundo
export const rotFacing = (f, r) => (f + 4 - r) % 4;
const RING = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];
const DIRF = (dx, dz) => (dz === 1 ? 0 : dx === 1 ? 1 : dz === -1 ? 2 : 3);

// ---------- herramienta de construcción con rotación, recortada al chunk ----------
class Ctx {
  constructor(gen, cx, cz, blocks, idx, out, P) {
    this.gen = gen; this.blocks = blocks; this.idx = idx; this.out = out;
    this.x0 = cx * CH; this.z0 = cz * CH;
    this.ox = P.x; this.oy = P.y; this.oz = P.z; this.r = P.rot; this.id = P.id;
    this.rnd = mulberry32((P.x * 73856093) ^ (P.z * 19349663) ^ gen.seed);
    this.toc = null; // v13.3.0 (I1): lo más bajo que escribió la obra por columna (lo pone buildStructuresInChunk)
  }
  // v13.3.0 (I1, I11): anota la columna tocada; y el agua de una obra en la costa o en mar abierto nunca queda más alta que el mar (el «domo» del templo hundido)
  anota(wx, y, wz, id) {
    if (id === 0) return true;
    if (this.toc) { const k = (wx - this.x0) + (wz - this.z0) * CH; if (y < this.toc[k]) this.toc[k] = y; }
    if (this.gen.version >= 24 && id === K.water && y > SEA) { const b = this.gen.column(wx, wz).biome; if (b === 'ocean' || b === 'beach') return false; }
    return true;
  }
  w(dx, dz) { const [rx, rz] = rot(dx, dz, this.r); return [this.ox + rx, this.oz + rz]; }
  inChunk(wx, wz) { return wx >= this.x0 && wx < this.x0 + CH && wz >= this.z0 && wz < this.z0 + CH; }
  set(dx, dy, dz, id) {
    if (this.r % 2 && GIRA[id]) id = GIRA[id]; // v12.4.9: al rotar la estructura, el postigo gira con ella
    const [wx, wz] = this.w(dx, dz), y = this.oy + dy;
    if (!this.inChunk(wx, wz) || y < 1 || y > 126) return;
    if (this.gen.version >= 24 && !this.anota(wx, y, wz, id)) return;
    this.blocks[this.idx(wx - this.x0, y, wz - this.z0)] = id;
  }
  getMaybe(dx, dy, dz) {
    const [wx, wz] = this.w(dx, dz), y = this.oy + dy;
    if (!this.inChunk(wx, wz) || y < 1 || y > 126) return false;
    const id = this.blocks[this.idx(wx - this.x0, y, wz - this.z0)];
    return id === 0 || id === K.tall_grass;
  }
  // poner un bloque en coordenadas del mundo (x, z) a la altura local dy
  setW(wx, dy, wz, id) {
    const y = this.oy + dy;
    if (!this.inChunk(wx, wz) || y < 1 || y > 126) return;
    if (this.gen.version >= 24 && !this.anota(wx, y, wz, id)) return;
    this.blocks[this.idx(wx - this.x0, y, wz - this.z0)] = id;
  }
  fill(ax, ay, az, bx, by, bz, id) { for (let y = ay; y <= by; y++) for (let z = az; z <= bz; z++) for (let x = ax; x <= bx; x++) this.set(x, y, z, id); }
  ground(dx, dz) { const [wx, wz] = this.w(dx, dz); return this.gen.column(wx, wz).h - this.oy; }
  // cimientos hasta el terreno, piso en dy=0 y aire arriba
  foundation(ax, az, bx, bz, mat = K.cobble, floor = null, clear = 14) {
    for (let z = az; z <= bz; z++) for (let x = ax; x <= bx; x++) {
      const g = this.ground(x, z);
      for (let y = Math.min(g, 0); y < 0; y++) this.set(x, y, z, mat);
      if (floor !== null) this.set(x, 0, z, floor);
      for (let y = 1; y <= clear; y++) this.set(x, y, z, 0);
    }
  }
  // despejar árboles alrededor (troncos, hojas y bejucos que quedarían flotando)
  clearTrees(R) {
    for (let z = -R; z <= R; z++) for (let x = -R; x <= R; x++) {
      const [wx, wz] = this.w(x, z);
      if (!this.inChunk(wx, wz)) continue;
      const h = this.gen.column(wx, wz).h;
      for (let y = h + 1; y < Math.min(127, h + 28); y++) {
        const i = this.idx(wx - this.x0, y, wz - this.z0);
        if (TREE.has(this.blocks[i])) this.blocks[i] = 0;
      }
    }
  }
  circle(r, fn) { const R = Math.ceil(r); for (let z = -R; z <= R; z++) for (let x = -R; x <= R; x++) { const d = Math.hypot(x, z); if (d <= r) fn(x, z, d); } }
  stair(base, dx, dy, dz, f) { this.set(dx, dy, dz, base + rotFacing(f, this.r)); }
  be(dx, dy, dz, id, data) {
    this.set(dx, dy, dz, id);
    const [wx, wz] = this.w(dx, dz), y = this.oy + dy;
    if (this.inChunk(wx, wz)) this.out.push({ x: wx - this.x0, y, z: wz - this.z0, id, be: data });
  }
  door(dx, dy, dz, f) {
    this.set(dx, dy + 1, dz, K.door_upper);
    this.be(dx, dy, dz, K.door_lower, { type: 'door', facing: rotFacing(f, this.r), hinge: 0, open: false });
  }
  placa(dx, dy, dz, f, title, text) { this.be(dx, dy, dz, K.placa, { type: 'placa', facing: rotFacing(f, this.r), title, text }); }
  chest(dx, dy, dz, f, slots) {
    // v11.10.7: uno de cada doce cofres de estructuras y ruinas trae un chanchito de barro (por posición, sin tocar el azar de la construcción)
    const [wx, wz] = this.w(dx, dz);
    if (slots && hash3(5151, wx, this.oy + dy, wz) < 1 / 12) { const i = slots.indexOf(null); if (i >= 0) slots[i] = { id: K.chanchito, count: 1 }; }
    this.be(dx, dy, dz, K.chest, { type: 'chest', facing: rotFacing(f, this.r), slots, viejo: true });
  }
  // personas y animales: se anotan una vez (en el chunk del centro)
  npc(dx, dy, dz, data) {
    if (!this.inChunk(this.ox, this.oz)) return;
    const [wx, wz] = this.w(dx, dz);
    const [fx, fz] = rot(0, 1, this.r);
    this.out.push({ npc: { ...data, x: wx, z: wz, y: this.oy + dy, vx: wx, vz: wz, vy: this.oy + dy, village: this.id, yaw: Math.atan2(fx, fz) } });
  }
  zone(dx, dy, dz, kind, r) {
    if (!this.inChunk(this.ox, this.oz)) return;
    const [wx, wz] = this.w(dx, dz);
    this.out.push({ zone: { kind, x: wx, y: this.oy + dy, z: wz, r, id: `${this.id}:${kind}` } });
  }
  frame(ox, oz, r) { return new Frame(this, ox, oz, r); }
  beacon(dx, dy, dz) {
    if (!this.inChunk(this.ox, this.oz)) return;
    const [wx, wz] = this.w(dx, dz);
    this.out.push({ beacon: { x: wx, y: this.oy + dy, z: wz } });
  }
  // escalera de caracol de radio 1 alrededor de un poste
  spiral(base, y0, y1, mat = K.log) {
    for (let y = y0; y <= y1 + 1; y++) this.set(0, y, 0, mat);
    for (let L = 0; y0 + L <= y1; L++) {
      const [x, z] = RING[L % 8], [nx, nz] = RING[(L + 1) % 8];
      this.stair(base, x, y0 + L, z, DIRF(nx - x, nz - z));
    }
  }
  loot(pool, n) {
    const slots = new Array(27).fill(null);
    for (let k = 0; k < n; k++) {
      const [id, a, b] = pool[Math.floor(this.rnd() * pool.length)];
      let i = Math.floor(this.rnd() * 27);
      while (slots[i]) i = (i + 1) % 27;
      slots[i] = { id, count: a + Math.floor(this.rnd() * (b - a + 1)) };
    }
    return slots;
  }
}

// marco: una parte de la estructura con su propio origen y rotación (cada edificio mira a la plaza)
class Frame extends Ctx {
  constructor(parent, ox, oz, r) {
    super(parent.gen, parent.x0 / CH, parent.z0 / CH, parent.blocks, parent.idx, parent.out, { x: parent.ox, y: parent.oy, z: parent.oz, rot: (parent.r + r) % 4, id: parent.id });
    this.parent = parent; this.fox = ox; this.foz = oz; this.fr = r;
    this.rnd = parent.rnd; this.toc = parent.toc;
  }
  w(dx, dz) { const [a, b] = rot(dx, dz, this.fr); return this.parent.w(this.fox + a, this.foz + b); }
}

// guanacaste (lo usan el generador, el arbolito que crece y el del parque): tronco grueso de 2x2
// (3x3 abajo en el monumental), ramas gruesas abiertas y copa enorme y plana como sombrilla
export function guanacasteShape(put, rnd, big = false) {
  const H = (big ? 8 : 6) + Math.floor(rnd() * 3);
  const trunk = [[0, 0], [1, 0], [0, 1], [1, 1]];
  for (let y = 1; y <= H; y++) for (const [dx, dz] of trunk) put(dx, y, dz, K.log, false);
  // raíces que se abren en la base
  for (const [dx, dz] of [[-1, 0], [2, 1], [0, 2], [1, -1], [-1, 1], [2, 0], [1, 2], [0, -1]]) put(dx, 1, dz, K.log, false);
  if (big) for (const [dx, dz] of [[-1, 0], [-1, 1], [2, 0], [2, 1], [0, -1], [1, -1], [0, 2], [1, 2]]) for (let y = 1; y <= 3; y++) put(dx, y, dz, K.log, false);
  const top = H;
  // ramas gruesas en ocho direcciones
  const reach = big ? 6 : 4;
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]) {
    for (let k = 1; k <= reach; k++) {
      const bx = Math.round(0.5 + dx * k), bz = Math.round(0.5 + dz * k), by = top + Math.floor(k / 2);
      put(bx, by, bz, K.log, false);
      if (k <= 2) put(bx, by - 1, bz, K.log, false);
    }
  }
  const Rc = (big ? 11 : 8) + rnd() * 2;
  const R = Math.ceil(Rc) + 1;
  for (let dz = -R; dz <= R + 1; dz++) for (let dx = -R; dx <= R + 1; dx++) {
    const d = Math.hypot(dx - 0.5, (dz - 0.5) * 1.1);
    const n = rnd();
    const c0 = top + Math.floor(reach / 2) + 1;
    if (d <= Rc && n > 0.08) put(dx, c0, dz, K.leaves, true);
    if (d <= Rc - 1.5 && n > 0.15) put(dx, c0 + 1, dz, K.leaves, true);
    if (d <= Rc - 3.5) put(dx, c0 + 2, dz, K.leaves, true);
  }
}

// ---------- condiciones de lugar ----------
function flat(gen, x, z, h, rad, tol) {
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2;
    if (Math.abs(gen.column(Math.round(x + Math.cos(a) * rad), Math.round(z + Math.sin(a) * rad)).h - h) > tol) return false;
  }
  return true;
}
const LAND = ['plains', 'forest', 'bosque_seco', 'jungle'];
// tierra alta (faldas de los volcanes y montañas del Valle Central)
const high = (rad, tol, minH) => (gen, x, z, c) => (['plains', 'forest', 'nuboso', 'mountains'].includes(c.biome) && c.h >= minH && c.h < 110 && flat(gen, x, z, c.h, rad, tol) ? {} : null);
const land = (rad, tol, biomes = LAND) => (gen, x, z, c) => (biomes.includes(c.biome) && c.h > SEA + 1 && c.h < 100 && flat(gen, x, z, c.h, rad, tol) ? {} : null);
// costa: tierra baja con el mar a un lado; la rotación deja el +z local mirando al mar
function coast(seaDist, flatRad) {
  return (gen, x, z, c) => {
    if (c.h < SEA || c.h > SEA + 3 || !['beach', 'plains', 'manglar', 'bosque_seco', 'forest'].includes(c.biome)) return null;
    const dirs = [[0, 1, 0], [-1, 0, 1], [0, -1, 2], [1, 0, 3]];
    for (const [dx, dz, r] of dirs) {
      const sea = gen.column(x + dx * seaDist, z + dz * seaDist), far = gen.column(x + dx * (seaDist + 20), z + dz * (seaDist + 20));
      if (sea.biome === 'ocean' && far.biome === 'ocean' && sea.h < SEA - 2 && gen.column(x - dx * 6, z - dz * 6).h >= SEA && flat(gen, x, z, c.h, flatRad, 2)) return { rot: r };
    }
    return null;
  };
}

// ---------- los monumentos ----------
function buildFaro(c) {
  const H = 20;
  c.foundation(-4, -4, 4, 4, K.cobble, null, H + 9);
  c.circle(4.2, (x, z) => c.set(x, 0, z, K.smooth_stone));
  for (let y = 1; y <= H; y++) c.circle(2.6, (x, z, d) => c.set(x, y, z, d > 1.5 ? (Math.floor((y - 1) / 3) % 2 ? K.repello_rojo : K.plaster) : 0));
  for (let y = 5; y < H; y += 5) { c.set(2, y, 0, K.glass); c.set(-2, y, 0, K.glass); c.set(0, y, 2, K.glass); }
  c.spiral(K.escalera_piedra, 1, H);
  c.door(0, 1, -2, 2);
  // balcón, linterna con vidrio y techo rojo
  c.circle(3.6, (x, z, d) => {
    if (d > 1.5) c.set(x, H + 1, z, K.smooth_stone);
    if (d > 2.7) c.set(x, H + 2, z, K.cerca);
    if (d > 1.5 && d <= 2.6) for (let y = H + 2; y <= H + 4; y++) c.set(x, y, z, K.glass);
    if (d <= 2.6) c.set(x, H + 5, z, K.repello_rojo);
    if (d <= 1.6) c.set(x, H + 6, z, K.repello_rojo);
  });
  c.set(0, H + 2, 2, 0); c.set(0, H + 3, 2, 0); // puerta al balcón (mirando al mar)
  c.set(0, H + 2, 0, K.lamp); c.set(0, H + 3, 0, K.lamp); c.set(0, H + 4, 0, K.lamp);
  c.set(0, H + 7, 0, K.farol);
  c.beacon(0, H + 3, 0);
  c.chest(-2, H + 2, -3, 0, c.loot([[369, 1, 2], [259, 1, 3], [367, 2, 5], [357, 1, 1], [374, 2, 4], [360, 4, 12]], 6));
  c.placa(1, 1, -4, 2, 'Faro de Puntarenas', 'En la punta de la península, el faro guía a los barcos que entran al golfo de Nicoya. Suba por la escalera de caracol: de noche su luz gira sobre el mar.');
  c.npc(-1, 1, -4, { role: 'farero', name: 'Don Eliécer (farero)' });
}

function buildChurchill(c) {
  c.foundation(-3, -4, 3, 2, K.sand, K.planks, 7);
  for (const [x, z] of [[-3, -2], [3, -2], [-3, 2], [3, 2]]) c.fill(x, 1, z, x, 3, z, K.log);
  c.fill(-2, 1, -1, 2, 1, -1, K.paint_blue); // mostrador
  c.fill(-2, 1, 2, 2, 3, 2, K.paint_yellow); // pared del fondo
  c.set(-2, 1, 1, K.snow); c.set(2, 1, 1, K.snow); // hieleras
  const roof = [K.paint_pink, K.paint_yellow, K.paint_blue, K.plaster];
  for (let z = -4; z <= 2; z++) for (let x = -3; x <= 3; x++) c.set(x, 4, z, roof[(x + 3) % 4]);
  c.set(0, 3, -2, K.farol);
  for (let x = -2; x <= 2; x += 2) c.set(x, 1, -4, K.losa_tablas);
  c.placa(3, 1, -4, 2, 'Puesto de Churchill', 'En el Paseo de los Turistas de Puntarenas se sirve el churchill: granizado con sirope, leche condensada, leche en polvo y helado. ¡Pida uno y quítese el calor!');
  c.npc(0, 1, 0, { role: 'churchillero', name: 'Doña Mayela (churchill)' });
}

function buildCaldera(c) {
  const deckY = SEA + 1 - c.oy;
  // muelle de madera hacia el mar
  for (let z = 1; z <= 24; z++) {
    const wide = z >= 20;
    for (let x = wide ? -4 : -2; x <= (wide ? 4 : 2); x++) {
      c.set(x, deckY, z, K.planks);
      for (let y = deckY + 1; y <= deckY + 4; y++) c.set(x, y, z, 0);
    }
    for (const x of wide ? [-4, 4] : [-2, 2]) c.set(x, deckY + 1, z, K.cerca);
    if (z % 4 === 0) for (const x of [-2, 2]) for (let y = c.ground(x, z); y < deckY; y++) c.set(x, y, z, K.log);
    if (z % 8 === 4) { c.set(2, deckY + 2, z, K.log); c.set(2, deckY + 3, z, K.farol); }
  }
  for (let x = -3; x <= 3; x++) c.set(x, deckY + 1, 24, K.cerca);
  c.set(0, deckY + 1, 24, 0);
  // puestos en tierra
  c.foundation(-11, -8, 11, 0, K.cobble, K.smooth_stone, 7);
  for (let i = 0; i < 3; i++) {
    const x0 = -10 + i * 7;
    const roof = [K.paint_blue, K.paint_green, K.paint_pink][i];
    for (const [x, z] of [[x0, -7], [x0 + 4, -7], [x0, -3], [x0 + 4, -3]]) c.fill(x, 1, z, x, 3, z, K.log);
    c.fill(x0, 4, -7, x0 + 4, 4, -3, roof);
    c.fill(x0 + 1, 1, -3, x0 + 3, 1, -3, K.planks);
    c.chest(x0 + 2, 1, -6, 0, c.loot([[361, 1, 3], [362, 1, 3], [364, 1, 1], [367, 1, 4], [366, 1, 2]], 4));
    c.set(x0 + 2, 3, -5, K.farol);
  }
  c.placa(0, 1, -1, 2, 'Muelle de Caldera', 'En los puestos del puerto se consigue pescado fresco, mariscos y ceviche. Los pescadores salen de madrugada en sus botes por el golfo.');
  c.npc(-1, 1, -5, { role: 'pescador', name: 'Don Pacho (mariscos)' });
  c.npc(3, deckY + 1, 22, { mob: 'bote', tamed: true, name: 'bote del muelle' });
}

function buildFortin(c) {
  c.foundation(-6, -6, 6, 6, K.cobble, null, 16);
  c.circle(6, (x, z) => c.set(x, 0, z, K.smooth_stone));
  for (let y = 1; y <= 10; y++) c.circle(3.5, (x, z, d) => {
    if (d <= 2.5) { c.set(x, y, z, 0); return; }
    const ang = Math.round(((Math.atan2(z, x) + Math.PI) / (Math.PI * 2)) * 8) % 8;
    const tronera = (y === 4 || y === 7) && d > 3 && ang % 2 === 0;
    c.set(x, y, z, tronera ? 0 : y <= 2 ? K.cobble : K.plaster);
  });
  c.spiral(K.escalera_piedra, 1, 9);
  c.door(0, 1, -3, 2);
  c.circle(3.5, (x, z, d) => {
    const well = Math.abs(x) <= 1 && Math.abs(z) <= 1 && !(x === 0 && z === 0);
    c.set(x, 10, z, well ? 0 : K.smooth_stone);
    if (d > 2.5) { const ang = Math.round(((Math.atan2(z, x) + Math.PI) / (Math.PI * 2)) * 16) % 16; c.set(x, 11, z, ang % 2 ? K.plaster : 0); }
  });
  // cañón apuntando a la plaza
  c.set(0, 11, 2, K.log); c.set(0, 12, 2, K.basalt); c.set(0, 12, 3, K.basalt);
  c.chest(-2, 11, 0, 1, c.loot([[360, 5, 20], [379, 2, 6], [374, 2, 5], [259, 1, 3], [327, 6, 16], [326, 1, 1], [258, 2, 5]], 7));
  c.placa(2, 1, -5, 2, 'El Fortín de Heredia', 'Torre redonda en el corazón de Heredia. Sus troneras son famosas porque se abren hacia afuera, al revés de lo normal. Es el símbolo de la ciudad de las flores.');
  c.npc(-2, 1, -5, { role: 'guarda', name: 'Don Rodolfo (guarda)' });
}

// v12.4.7 (C4): una casita de bahareque encalado con su corredor, horcones, postigos, techo de palma y la mecedora afuera. Solo en
// mundos nuevos (minV 18): los lugares ya explorados no cambian
function buildCasitaBahareque(c) {
  c.foundation(-5, -4, 4, 5, K.dirt, K.grass, 8); // v12.4.9: hasta x = −5, donde va la huerta
  // piso y corredor
  c.fill(-3, 0, -3, 3, 0, 4, K.planks);
  // paredes: el zócalo de bahareque sin cal y arriba encalado
  for (let y = 1; y <= 3; y++) for (let x = -3; x <= 3; x++) for (let z = 0; z <= 4; z++) {
    const borde = x === -3 || x === 3 || z === 0 || z === 4;
    c.set(x, y, z, borde ? (y === 1 ? K.bahareque : K.bahareque_encalado) : 0);
  }
  for (let y = 1; y <= 2; y++) c.set(0, y, 0, 0); // la puerta
  c.set(-2, 2, 0, K.postigo); c.set(2, 2, 0, K.postigo); c.set(-3, 2, 2, K.postigo_z); c.set(3, 2, 2, K.postigo_z); // v12.4.9: los de los lados, girados
  // el corredor: horcones en las esquinas, la banca y la mecedora
  for (const x of [-3, 3]) for (let y = 1; y <= 3; y++) c.set(x, y, -3, K.horcon);
  c.set(-2, 1, -1, K.banca_corredor); c.set(-1, 1, -1, K.banca_corredor); c.set(2, 1, -2, K.mecedora);
  // techo de palma a dos aguas, que tapa el corredor
  for (let k = 0; k < 4; k++) for (let z = -4; z <= 5; z++) { c.set(-4 + k, 4 + k, z, K.techo_palma); c.set(4 - k, 4 + k, z, K.techo_palma); }
  for (let z = -4; z <= 5; z++) c.set(0, 7, z, K.techo_palma);
  // adentro: una cama, la mesa y un farol
  c.set(-2, 1, 3, K.bed || K.planks); c.set(2, 1, 3, K.mesa_comedor || K.planks); c.set(2, 2, 3, K.farol || 0);
  // la huerta de al lado
  for (let z = 1; z <= 3; z++) c.set(-5 + 0, 0, z, K.farmland_wet || K.dirt);
}

function buildCarreta(c) {
  c.foundation(-3, -4, 3, 9, K.dirt, K.grass, 8);
  // ruedas grandes pintadas (3x3 bloques cada una), en el sentido que toque según la rotación
  const pre = c.r % 2 === 0 ? 'ruedag' : 'ruedagz';
  for (const x of [-2, 2]) {
    // el pedazo de la imagen va según el eje del mundo (si no, la rueda queda desordenada al rotar)
    const cols = [-2, -1, 0].map((z) => ({ z, w: c.w(x, z) })).sort((p, q) => (c.r % 2 === 0 ? p.w[1] - q.w[1] : p.w[0] - q.w[0]));
    cols.forEach((col, i) => { for (let j = 0; j < 3; j++) c.set(x, 3 - j, col.z, K[`${pre}_${i}_${j}`]); });
  }
  // eje, apoyo y caja de la carreta pintada de Sarchí
  c.fill(-1, 2, -1, 1, 2, -1, K.log);
  c.fill(0, 3, -2, 0, 3, 0, K.madera_carreta);
  c.fill(-1, 4, -3, 1, 4, 1, K.madera_carreta);
  for (let z = -3; z <= 1; z++) for (const x of [-1, 1]) c.set(x, 5, z, K.madera_carreta);
  c.set(0, 5, -3, K.madera_carreta);
  c.set(0, 5, 1, K.madera_carreta);
  // carga: sacos de café
  c.set(0, 5, -2, K.wool); c.set(0, 5, -1, K.wool); c.set(0, 6, -2, K.wool); c.set(0, 5, 0, K.wool);
  // lanza hacia el yugo
  c.set(0, 4, 2, K.log); c.set(0, 3, 3, K.log); c.set(0, 3, 4, K.log); c.set(0, 3, 5, K.log); c.set(0, 3, 6, K.log);
  c.fill(-2, 3, 6, 2, 3, 6, K.log); // yugo
  c.npc(-1, 1, 7, { mob: 'vaca', frozen: true, name: 'buey 1' });
  c.npc(1, 1, 7, { mob: 'vaca', frozen: true, name: 'buey 2' });
  c.npc(3, 1, 4, { role: 'boyero', name: 'Don Fulgencio (boyero)' });
}

const ESTATUAS = [
  { title: 'Juan Santamaría', text: 'El héroe nacional, el tamborcillo alajuelense que en 1856 quemó el mesón en la batalla de Rivas con una antorcha en la mano.', torch: true },
  { title: 'El Boyero', text: 'Homenaje al boyero que guiaba la carreta con sus bueyes por los caminos del Valle Central, llevando el café al puerto.', hat: true },
  { title: 'El Sabanero', text: 'Homenaje al sabanero guanacasteco: caballo, sombrero, soga y bajura. ¡Eeepa!', hat: true },
];
function buildEstatua(c) {
  const v = ESTATUAS[Math.floor(c.rnd() * ESTATUAS.length)];
  c.foundation(-4, -4, 4, 4, K.dirt, K.grass, 14);
  c.circle(4, (x, z, d) => { if (d > 2.5 && c.rnd() < 0.5) c.set(x, 1, z, c.rnd() < 0.5 ? K.flower_red : K.flower_yellow); });
  c.fill(-1, 1, -1, 1, 2, 1, K.cobble);
  c.fill(-1, 3, -1, 1, 3, 1, K.smooth_stone);
  const M = K.piedra_pomez;
  c.fill(-1, 4, 0, -1, 5, 0, M); c.fill(1, 4, 0, 1, 5, 0, M); // piernas
  c.fill(-1, 6, 0, 1, 8, 0, M); // cuerpo
  c.set(0, 9, 0, M); c.set(0, 10, 0, M); // cabeza
  c.set(-2, 7, 0, M); c.set(-2, 6, 0, M);
  if (v.torch) { c.set(2, 8, 0, M); c.set(2, 9, 0, M); c.set(2, 10, 0, K.farol); }
  else c.set(2, 7, 0, M);
  if (v.hat) c.fill(-1, 11, -1, 1, 11, 1, K.basalt);
  c.placa(0, 2, -2, 2, v.title, v.text);
}

function buildFuente(c) {
  c.foundation(-8, -8, 8, 8, K.cobble, null, 10);
  c.circle(8, (x, z) => c.set(x, 0, z, K.smooth_stone));
  c.circle(5.5, (x, z, d) => {
    if (d > 4.5) c.set(x, 1, z, K.smooth_stone);
    else if (d > 1.2) c.set(x, 1, z, K.water);
  });
  c.circle(2.6, (x, z, d) => {
    if (d <= 1.2) { for (let y = 1; y <= 5; y++) c.set(x, y, z, K.plaster); return; }
    c.set(x, 2, z, K.smooth_stone);
    c.set(x, 3, z, d > 2 ? K.smooth_stone : K.water);
  });
  c.set(0, 6, 0, K.water);
  for (const [x, z] of [[6, 6], [-6, 6], [6, -6], [-6, -6]]) { c.fill(x, 1, z, x, 2, z, K.log); c.set(x, 3, z, K.farol); }
  for (const [x, z] of [[0, 7], [7, 0], [-7, 0]]) c.set(x, 1, z, K.losa_tablas);
  c.placa(0, 1, -7, 2, 'Fuente de la Hispanidad', 'La fuente de la rotonda de la Hispanidad, en San Pedro de Montes de Oca, donde la gente sale a celebrar los triunfos de la Sele.');
}

// ---------- San José: Parque Central, Teatro Nacional, Catedral, Casa Amarilla y Mercado Central ----------
function buildCapital(c) {
  c.foundation(-34, -34, 34, 34, K.cobble, K.smooth_stone, 22);
  // calles con faroles alrededor del parque
  for (let i = -12; i <= 12; i += 6) for (const [x, z] of [[i, -12], [i, 12], [-12, i], [12, i]]) { c.fill(x, 1, z, x, 2, z, K.log); c.set(x, 3, z, K.farol); }
  // Parque Central: zacate, caminos en cruz, templete y el guanacaste monumental
  c.circle(10.5, (x, z) => c.set(x, 0, z, Math.abs(x) <= 1 || Math.abs(z) <= 1 ? K.smooth_stone : K.grass));
  c.circle(3.2, (x, z, d) => {
    c.set(x, 1, z, K.smooth_stone);
    if (d > 2.4 && Math.abs(x) > 1 && Math.abs(z) > 1) c.set(x, 2, z, K.cerca);
    c.set(x, 6, z, K.teja);
  });
  c.circle(2.1, (x, z) => c.set(x, 7, z, K.teja));
  c.set(0, 8, 0, K.teja);
  for (const [x, z] of [[2, 2], [-2, 2], [2, -2], [-2, -2]]) c.fill(x, 2, z, x, 5, z, K.plaster);
  c.set(0, 5, 0, K.farol);
  for (const [x, z] of [[6, 3], [-6, -3], [3, -6], [-3, 6]]) c.set(x, 1, z, K.losa_tablas);
  const gt = c.frame(-6, 6, 0);
  guanacasteShape((x, y, z, id, onlyAir) => { if (!onlyAir || gt.getMaybe(x, y, z)) gt.set(x, y, z, id); }, c.rnd, true);
  c.placa(-4, 1, 3, 0, 'El Guanacaste', 'Árbol nacional de Costa Rica desde 1959. Su copa es una sombrilla enorme y sus semillas parecen orejas: por eso le dicen «oreja de guanacaste». Busque las semillas bajo sus hojas y siémbrelas.');
  c.placa(2, 1, 11, 0, 'Parque Central', 'El corazón de San José, con su templete para las retretas de los domingos. Al norte el Teatro Nacional, al sur la Catedral, al este la Casa Amarilla y al oeste el Mercado Central.');
  c.zone(0, 1, 0, 'capital', 30);
  teatro(c.frame(0, -14, 0));
  catedral(c.frame(0, 14, 2));
  casaAmarilla(c.frame(14, 0, 1));
  mercado(c.frame(-14, 0, 3));
}

// cada edificio: el frente mira a +z local (hacia la plaza) en z = 0 y se extiende hacia -z
function teatro(f) {
  const W = 13, D = 27;
  f.foundation(-W - 1, -D - 1, W + 1, 4, K.cobble, K.smooth_stone, 22);
  // casco: paredes de repello con ventanales arqueados, piso de mármol en el foyer y madera en la sala
  for (let z = -D; z <= -1; z++) for (let x = -W; x <= W; x++) {
    const edge = Math.abs(x) === W || z === -D || z === -1;
    const foyer = z >= -9;
    f.set(x, 1, z, foyer ? ((x + z) % 2 ? K.calcite : K.smooth_stone) : K.planks);
    for (let y = 2; y <= 13; y++) {
      if (!edge) { f.set(x, y, z, 0); continue; }
      const win = Math.abs(x) === W && (y === 4 || y === 5 || y === 9 || y === 10) && (z % 4 === 0);
      const pil = Math.abs(x) === W && z % 4 === 2;
      f.set(x, y, z, win ? K.glass : pil || y === 7 || y === 13 ? K.smooth_stone : K.plaster);
    }
    f.set(x, 14, z, K.teja);
  }
  // ---- fachada: pórtico, columnas con capitel dorado, friso, frontón, musas y estatuas en nichos ----
  f.fill(-11, 1, 0, 11, 1, 2, K.smooth_stone);
  for (let x = -11; x <= 11; x++) f.stair(K.escalera_piedra, x, 1, 3, 2);
  for (const x of [-10, -7, -4, 4, 7, 10]) { f.fill(x, 2, 2, x, 9, 2, K.smooth_stone); f.set(x, 10, 2, K.oro_volcanico); }
  f.fill(-11, 11, 0, 11, 11, 2, K.smooth_stone);
  for (let x = -11; x <= 11; x += 2) f.set(x, 12, 2, K.oro_volcanico);
  f.fill(-11, 12, 0, 11, 12, 1, K.smooth_stone);
  for (let k = 0; k < 4; k++) f.fill(-10 + k * 3, 13 + k, 1, 10 - k * 3, 13 + k, 2, K.plaster);
  f.set(0, 14, 2, K.oro_volcanico); // escudo
  // tres musas sobre el frontón (la del centro con su corona dorada) y dos a los lados
  for (const [x, y] of [[0, 17], [-8, 13], [8, 13]]) { f.fill(x, y, 1, x, y + 2, 1, K.piedra_pomez); f.set(x - 1, y + 1, 1, K.piedra_pomez); f.set(x + 1, y + 1, 1, K.piedra_pomez); }
  f.set(0, 20, 1, K.oro_volcanico);
  // estatuas en nichos a los lados de la entrada
  for (const x of [-2, 2]) { f.set(x, 2, 0, K.smooth_stone); f.fill(x, 3, 0, x, 5, 0, K.piedra_pomez); f.set(x, 6, 0, K.oro_volcanico); }
  for (const x of [-1, 0, 1]) f.door(x, 2, -1, 0);
  for (const x of [-8, 8]) f.set(x, 6, 0, K.farol);
  // ---- foyer: escalinatas a un mezzanine con baranda dorada, arañas, y el mural en el cielo raso ----
  for (const sx of [-1, 1]) {
    for (let k = 0; k < 5; k++) { f.stair(K.escalera_piedra, sx * 11, 2 + k, -3 - k, 2); f.stair(K.escalera_piedra, sx * 10, 2 + k, -3 - k, 2); }
    for (let z = -9; z <= -2; z++) for (const x of [sx * 12, sx * 11, sx * 10]) f.set(x, 7, z, K.planks);
    for (let z = -2; z <= -1; z++) for (const x of [sx * 12, sx * 11, sx * 10]) f.set(x, 7, z, 0);
    for (let z = -9; z <= -3; z++) f.set(sx * 9, 8, z, K.cerca);
  }
  for (let x = -8; x <= 8; x++) { f.set(x, 7, -9, K.planks); f.set(x, 8, -8, K.cerca); }
  for (const x of [-6, 6]) { f.set(x, 12, -5, K.lamp); f.set(x, 11, -5, K.farol); }
  // mural del cielo raso (4x2 bloques, en los ejes del mundo para que la imagen quede entera)
  const [mx, mz] = f.w(0, -5);
  for (let j = 0; j < 2; j++) for (let i = 0; i < 4; i++) f.setW(mx - 1 + j, 13, mz - 2 + i, K[`mural_${i}_${j}`]);
  for (const [x, z] of [[-3, -3], [3, -3], [-3, -7], [3, -7]]) f.set(x, 13, z, K.oro_volcanico);
  f.placa(4, 2, -2, 0, 'El cielo raso del foyer', 'Mire hacia arriba: una alegoría de la cosecha del café y del banano con el puerto al fondo, como la famosa pintura de 1897 que salió en el billete de cinco colones.');
  // pared entre foyer y sala, con su portal
  for (let x = -W + 1; x <= W - 1; x++) for (let y = 2; y <= 12; y++) if (!(Math.abs(x) <= 2 && y <= 5) && !(Math.abs(x) >= 10 && y >= 8 && y <= 9)) f.set(x, y, -10, K.plaster);
  for (let x = -2; x <= 2; x++) f.set(x, 6, -10, K.oro_volcanico);
  // ---- sala: escenario, arco del proscenio dorado, telones, butacas rojas, palcos en herradura y cúpula ----
  const S = -D + 1;
  f.fill(-9, 2, S, 9, 3, S + 4, K.planks);
  f.fill(-9, 4, S, 9, 12, S, K.repello_rojo);
  for (const x of [-9, 9]) f.fill(x, 4, S + 1, x, 11, S + 4, K.repello_rojo);
  for (const x of [-10, 10]) f.fill(x, 2, S + 5, x, 12, S + 5, K.oro_volcanico);
  f.fill(-10, 12, S + 5, 10, 12, S + 5, K.oro_volcanico);
  f.fill(-8, 11, S + 5, 8, 11, S + 5, K.repello_rojo); // bambalina
  for (const x of [-6, -2, 2, 6]) f.set(x, 4, S + 4, K.farol); // candilejas
  for (let z = S + 8; z <= -13; z += 2) for (let x = -8; x <= 8; x++) if (Math.abs(x) > 1) f.stair(K.escalera_teja, x, 2, z, 0);
  for (const sx of [-1, 1]) for (const lvl of [6, 9]) {
    for (let z = S + 6; z <= -11; z++) { f.set(sx * 12, lvl, z, K.planks); f.set(sx * 11, lvl, z, K.planks); f.set(sx * 10, lvl + 1, z, K.cerca); }
    for (let z = S + 6; z <= -11; z += 3) f.fill(sx * 10, lvl + 1, z, sx * 10, lvl + 2, z, K.plaster);
  }
  for (let x = -9; x <= 9; x++) { f.set(x, 9, -11, K.planks); f.set(x, 10, -12, K.cerca); }
  // cúpula pintada con araña de luces
  f.circle(5, (x, z, d) => f.set(x, 13, z - 17, d > 4 ? K.oro_volcanico : d > 2 ? K.paint_blue : K.lamp));
  f.set(0, 12, -17, K.farol);
  for (let z = S + 2; z <= -12; z += 4) for (const x of [-12, 12]) f.set(x, 12, z, K.lamp);
  f.zone(0, 2, -17, 'teatro', 8);
  f.placa(5, 2, 1, 0, 'Teatro Nacional de Costa Rica', 'Inaugurado en 1897 y pagado con un impuesto a la exportación del café. Columnas, musas, mármol y oro adentro. Entre a la sala: empieza la función.');
  f.npc(0, 2, -4, { role: 'acomodador', name: 'Don Álvaro (acomodador)' });
}

function catedral(f) {
  const W = 8, D = 20;
  f.foundation(-W - 1, -D - 1, W + 1, 2, K.cobble, K.smooth_stone, 22);
  for (let z = -D; z <= -1; z++) for (let x = -W; x <= W; x++) {
    const edge = Math.abs(x) === W || z === -D || z === -1;
    f.set(x, 1, z, K.smooth_stone);
    for (let y = 2; y <= 11; y++) f.set(x, y, z, edge ? (Math.abs(x) === W && y >= 4 && y <= 8 && z % 4 === 0 ? K.glass : K.plaster) : 0);
    f.set(x, 12, z, K.teja);
  }
  for (let k = 0; k < 4; k++) f.fill(-6 + k * 2, 12 + k, -1, 6 - k * 2, 12 + k, -1, K.plaster);
  for (const x of [-5, -3, 3, 5]) f.fill(x, 2, 0, x, 10, 0, K.smooth_stone);
  // dos torres con campanas
  for (const sx of [-1, 1]) {
    const x0 = sx * 7;
    for (let y = 2; y <= 17; y++) for (let z = -3; z <= -1; z++) for (let x = x0 - 1; x <= x0 + 1; x++) {
      const edge = x === x0 - 1 || x === x0 + 1 || z === -3 || z === -1;
      f.set(x, y, z, edge ? (y >= 14 && y <= 15 && (x === x0 || z === -2) ? 0 : K.plaster) : 0);
    }
    f.set(x0, 14, -2, K.lamp);
    f.fill(x0 - 1, 18, -3, x0 + 1, 18, -1, K.teja);
    f.set(x0, 19, -2, K.oro_volcanico);
  }
  f.door(-1, 2, -1, 0); f.door(1, 2, -1, 0); f.set(0, 2, -1, 0); f.set(0, 3, -1, 0);
  // bancas y altar
  for (let z = -16; z <= -5; z += 2) for (let x = -6; x <= 6; x++) if (Math.abs(x) > 1) f.stair(K.escalera_tablas, x, 2, z, 0);
  f.fill(-2, 2, -D + 1, 2, 2, -D + 2, K.calcite);
  f.set(0, 3, -D + 1, K.oro_volcanico);
  for (const x of [-2, 2]) f.set(x, 3, -D + 1, K.farol);
  f.zone(-7, 14, -2, 'campana', 160);
  f.placa(3, 2, 1, 0, 'Catedral Metropolitana', 'Frente al Parque Central. Sus campanas suenan al amanecer, al mediodía y al atardecer.');
}

function casaAmarilla(f) {
  const W = 9, D = 12;
  f.foundation(-W - 1, -D - 1, W + 1, 6, K.cobble, K.grass, 16);
  for (let z = -D; z <= -1; z++) for (let x = -W; x <= W; x++) {
    const edge = Math.abs(x) === W || z === -D || z === -1;
    f.set(x, 1, z, K.planks);
    for (let y = 2; y <= 10; y++) {
      const win = edge && (y === 3 || y === 8) && Math.abs(x) % 3 === 1 && Math.abs(x) < W;
      f.set(x, y, z, edge ? (win ? K.glass : Math.abs(x) === W || y === 6 ? K.plaster : K.paint_yellow) : 0);
    }
    f.set(x, 6, z, edge ? K.plaster : K.planks); // segundo piso
    f.set(x, 11, z, K.teja);
  }
  // pórtico de columnas blancas con balcón
  f.fill(-5, 1, 0, 5, 1, 2, K.smooth_stone);
  for (const x of [-5, -2, 2, 5]) f.fill(x, 2, 2, x, 5, 2, K.plaster);
  f.fill(-5, 6, 0, 5, 6, 2, K.smooth_stone);
  for (let x = -5; x <= 5; x++) f.set(x, 7, 2, K.cerca);
  f.door(0, 2, -1, 0);
  f.set(0, 7, -1, 0); f.set(0, 8, -1, 0); // puerta al balcón
  // escalera recta al segundo piso
  for (let k = 0; k < 5; k++) { f.stair(K.escalera_tablas, -7, 2 + k, -3 - k, 2); f.set(-7, 6, -3 - k, 0); }
  // Salón de los Embajadores: mesa larga, sillas y libreros
  for (let x = -4; x <= 4; x++) { f.set(x, 2, -7, K.planks); f.stair(K.escalera_tablas, x, 2, -6, 0); f.stair(K.escalera_tablas, x, 2, -8, 2); }
  for (let x = -6; x <= 6; x++) { f.set(x, 2, -D + 1, K.bookshelf); f.set(x, 3, -D + 1, K.bookshelf); }
  for (const x of [-3, 3]) f.set(x, 5, -7, K.farol);
  f.chest(6, 7, -10, 0, f.loot([[360, 10, 30], [285, 1, 1], [259, 2, 4], [369, 1, 2], [298, 2, 4]], 5));
  // jardín y bandera de Costa Rica
  for (let x = -W; x <= W; x++) for (const z of [3, 4, 5]) if (Math.abs(x) > 6 || z === 5) f.set(x, 1, z, f.rnd() < 0.5 ? K.flower_red : K.flower_yellow);
  f.fill(7, 1, 4, 7, 10, 4, K.cerca);
  const stripes = [K.paint_blue, K.plaster, K.repello_rojo, K.repello_rojo, K.plaster, K.paint_blue];
  stripes.forEach((id, i) => f.fill(8, 10 - i, 4, 12, 10 - i, 4, id));
  f.placa(-3, 2, 1, 0, 'La Casa Amarilla', 'Sede de la Cancillería, en barrio Amón. En su Salón de los Embajadores se ha recibido a visitantes de todo el mundo.');
  f.npc(2, 2, -4, { role: 'canciller', name: 'Doña Elena (cancillería)' });
}

function mercado(f) {
  const W = 10, D = 16;
  f.foundation(-W - 1, -D - 1, W + 1, 2, K.cobble, K.smooth_stone, 14);
  for (let z = -D; z <= -1; z++) for (let x = -W; x <= W; x++) {
    const edge = Math.abs(x) === W || z === -D || z === -1;
    f.set(x, 1, z, K.smooth_stone);
    for (let y = 2; y <= 7; y++) {
      const arch = z === -1 && y <= 4 && Math.abs(x) % 4 !== 2;
      f.set(x, y, z, edge && !arch ? K.bricks : 0);
    }
    f.set(x, 8, z, K.planks);
  }
  // tramos con toldos de colores
  const aw = [K.paint_blue, K.paint_green, K.paint_pink, K.paint_yellow];
  for (let i = 0; i < 4; i++) for (const sx of [-1, 1]) {
    const z0 = -4 - i * 3, x0 = sx * 6;
    f.fill(x0 - 2, 2, z0, x0 + 2, 2, z0, K.planks);
    f.fill(x0 - 2, 5, z0 - 1, x0 + 2, 5, z0, aw[(i + (sx > 0 ? 1 : 0)) % 4]);
    if ((i + (sx > 0 ? 1 : 0)) % 2 === 0) f.chest(x0, 2, z0 - 1, 0, f.loot([[295, 2, 6], [297, 1, 3], [275, 2, 5], [276, 1, 3], [384, 1, 2], [294, 3, 8], [263, 1, 3]], 4));
  }
  for (let z = -3; z >= -D + 2; z -= 4) f.set(0, 7, z, K.farol);
  f.placa(2, 2, 1, 0, 'Mercado Central', 'Desde 1880 el corazón comercial de San José: sodas, café, especias, flores, hamacas… y el que vende la lotería.');
  f.npc(-6, 2, -6, { role: 'mercader', name: 'Don Chalo (tramo)' });
  f.npc(6, 2, -9, { role: 'sodera', name: 'Doña Rosa (soda del mercado)' });
  f.npc(0, 2, -3, { role: 'lotero', name: 'Don Beto (lotería)' });
}

// ---------- volcanes y cerros: miradores, cumbre y refugio (se ubican según el volcán o el cerro) ----------
const toward = (dx, dz) => (Math.abs(dz) > Math.abs(dx) ? (dz > 0 ? 0 : 2) : dx < 0 ? 1 : 3);

function placeVolcano(kind, distF) {
  return (gen, gx, gz) => {
    const v = gen.v2 && gen.v2.volcanoIn(gx, gz);
    if (!v || v.kind !== kind) return null;
    const a = hash3(gen.seed, gx, 9393, gz) * Math.PI * 2;
    const d = distF(v);
    const x = Math.floor(v.x + Math.cos(a) * d), z = Math.floor(v.z + Math.sin(a) * d);
    const c = gen.column(x, z);
    return { x, z, y: c.h, rot: toward(v.x - x, v.z - z), id: `${kind}@${Math.floor(v.x)},${Math.floor(v.z)}`, type: `mirador_${kind}`, d: Math.hypot(v.x - x, v.z - z), v };
  };
}

function buildMiradorPoas(c, P) {
  c.foundation(-4, -3, 4, 2, K.cobble, null, 8);
  c.fill(-4, 1, -3, 4, 1, 2, K.planks);
  for (const [x, z] of [[-4, -3], [4, -3], [-4, 2], [4, 2]]) for (let y = c.ground(x, z); y < 1; y++) c.set(x, y, z, K.log);
  for (let x = -4; x <= 4; x++) c.set(x, 2, 2, K.cerca);
  for (let z = -3; z <= 2; z++) { c.set(-4, 2, z, K.cerca); c.set(4, 2, z, K.cerca); }
  c.set(0, 2, -3, 0);
  c.set(-2, 2, -2, K.losa_tablas); c.set(2, 2, -2, K.losa_tablas);
  c.placa(1, 2, -3, 0, 'Volcán Poás', 'Su cráter es uno de los más grandes del mundo, con una laguna ácida de color turquesa que echa vapor y azufre. No se meta al agua: ¡quema!');
  const v = P.v;
  c.zone(0, 0, Math.round(P.d), 'fumarola', Math.round(v.r * v.crf));
  c.npc(-2, 2, 0, { role: 'guardaparques', name: 'Don Mauricio (guardaparques)' });
}

function buildMiradorArenal(c, P) {
  c.foundation(-3, -3, 3, 3, K.cobble, K.smooth_stone, 7);
  c.fill(-3, 1, -3, 3, 1, 3, K.planks);
  for (let x = -3; x <= 3; x++) c.set(x, 2, 3, K.cerca);
  for (const [x, z] of [[-3, -3], [3, -3]]) { c.fill(x, 2, z, x, 4, z, K.log); }
  c.fill(-3, 5, -3, 3, 5, -1, K.teja);
  c.set(0, 4, -2, K.farol);
  c.placa(-1, 2, -3, 0, 'Volcán Arenal', 'Un cono casi perfecto que estuvo activo por décadas. De vez en cuando retumba y lanza bombas de lava: mírelo desde aquí, no se acerque al cráter.');
  const v = P.v;
  c.zone(0, Math.round(v.hgt + 4), Math.round(P.d), 'erupcion', 230);
  c.npc(2, 2, 0, { role: 'guardaparques', name: 'Doña Ivannia (guardaparques)' });
}

function placeCerro(kind) {
  return (gen, gx, gz) => {
    const cc = gen.v2 && gen.v2.cerroIn(gx, gz);
    if (!cc) return null;
    if (kind === 'cumbre') {
      // el punto más alto cerca del centro
      let best = null;
      for (let dz = -12; dz <= 12; dz += 3) for (let dx = -12; dx <= 12; dx += 3) { const col = gen.column(cc.x + dx, cc.z + dz); if (!best || col.h > best.y) best = { x: cc.x + dx, z: cc.z + dz, y: col.h }; }
      return { ...best, rot: 0, id: `cumbre@${cc.x},${cc.z}`, type: 'cumbre' };
    }
    const a = hash3(gen.seed, gx, 8181, gz) * Math.PI * 2;
    for (let k = 0; k < 8; k++) {
      const d = cc.r * (0.5 + k * 0.03);
      const x = Math.floor(cc.x + Math.cos(a + k * 0.4) * d), z = Math.floor(cc.z + Math.sin(a + k * 0.4) * d);
      const col = gen.column(x, z);
      if (col.h > SEA + 4 && flat(gen, x, z, col.h, 5, 3)) return { x, z, y: col.h, rot: toward(cc.x - x, cc.z - z), id: `refugio@${cc.x},${cc.z}`, type: 'refugio' };
    }
    return null;
  };
}

function buildCumbre(c) {
  c.fill(-1, 1, -1, 1, 1, 1, K.cobble);
  c.set(0, 2, 0, K.cobble);
  c.fill(0, 3, 0, 0, 7, 0, K.log);
  c.fill(-1, 6, 0, 1, 6, 0, K.log);
  c.placa(0, 1, -2, 2, 'Cerro Chirripó', 'El punto más alto de Costa Rica. En días despejados se ven los dos océanos, el Pacífico y el Caribe. ¡Llegó a la cima!');
  c.chest(1, 2, -1, 2, c.loot([[285, 1, 1], [278, 1, 2], [298, 2, 4], [360, 10, 20], [259, 2, 4]], 4));
  c.zone(0, 1, 0, 'cumbre', 8);
}

function buildRefugio(c) {
  c.foundation(-5, -4, 5, 4, K.cobble, K.planks, 9);
  for (let z = -3; z <= 3; z++) for (let x = -4; x <= 4; x++) {
    const edge = Math.abs(x) === 4 || Math.abs(z) === 3;
    for (let y = 1; y <= 4; y++) c.set(x, y, z, edge ? (y === 2 && (x === 0 || z === 0) && !(z === 3 && x === 0) ? K.glass : K.planks) : 0);
  }
  for (let k = 0; k <= 4; k++) { c.fill(-5, 5 + Math.floor(k / 2), -4 + k, 5, 5 + Math.floor(k / 2), -4 + k, K.teja); c.fill(-5, 5 + Math.floor(k / 2), 4 - k, 5, 5 + Math.floor(k / 2), 4 - k, K.teja); }
  c.door(0, 1, 3, 0);
  for (const x of [-3, -1]) c.be(x, 1, -2, K.bed, { type: 'bed', facing: 0 });
  c.be(3, 1, -2, K.stove, { type: 'stove', facing: 3, grid: new Array(9).fill(null) });
  c.be(3, 1, 1, K.table, { type: 'table', grid: new Array(9).fill(null) });
  c.set(0, 4, 0, K.farol);
  c.placa(2, 1, 4, 0, 'Base Crestones', 'Refugio para descansar antes de subir al Chirripó. Las camas sirven para dormir y el fogón para un café chorreado bien caliente: arriba hace frío.');
  c.npc(-2, 1, 1, { role: 'guardaparques', name: 'Don Gerardo (guardaparques)' });
}

// ---------- Cartago, Orosi y el Tárcoles ----------
function buildBasilica(c) {
  const W = 6, D = 24;
  c.foundation(-W - 3, -D - 2, W + 3, 6, K.cobble, K.smooth_stone, 30);
  // atrio con faroles
  for (const x of [-W - 2, W + 2]) for (const z of [2, 5]) { c.fill(x, 1, z, x, 2, z, K.log); c.set(x, 3, z, K.farol); }
  // nave de piedra gris con molduras blancas
  for (let z = -D; z <= -1; z++) for (let x = -W; x <= W; x++) {
    const edge = Math.abs(x) === W || z === -D || z === -1;
    c.set(x, 1, z, (x + z) % 2 ? K.calcite : K.smooth_stone);
    for (let y = 2; y <= 12; y++) {
      if (!edge) { c.set(x, y, z, 0); continue; }
      const win = Math.abs(x) === W && y >= 5 && y <= 8 && z % 4 === -2;
      c.set(x, y, z, win ? K.glass : y === 12 || y === 2 ? K.plaster : K.piedra_pomez);
    }
    c.set(x, 13, z, K.basalt);
  }
  // cúpula sobre el crucero
  c.circle(4.5, (x, z, d) => { c.set(x, 13, z - 17, K.plaster); if (d <= 3.5) c.set(x, 14, z - 17, K.basalt); if (d <= 2.2) c.set(x, 15, z - 17, K.basalt); });
  c.set(0, 16, -17, K.oro_volcanico);
  // torre del frente con su remate
  for (let y = 2; y <= 22; y++) for (let z = -1; z <= 1; z++) for (let x = -2; x <= 2; x++) {
    const edge = Math.abs(x) === 2 || Math.abs(z) === 1;
    const bell = y >= 17 && y <= 19 && (x === 0 || z === 0);
    if (z === -1 && y < 13) continue;
    c.set(x, y, z, edge && !bell ? (y % 5 === 0 ? K.plaster : K.piedra_pomez) : 0);
  }
  c.set(0, 18, 0, K.lamp);
  c.circle(2.2, (x, z) => c.set(x, 23, z, K.basalt));
  c.set(0, 24, 0, K.basalt);
  c.fill(0, 25, 0, 0, 27, 0, K.plaster); c.fill(-1, 26, 0, 1, 26, 0, K.plaster); // cruz
  // puerta y escalinata
  c.door(-1, 2, 1, 0); c.door(1, 2, 1, 0); c.set(0, 2, 1, 0); c.set(0, 3, 1, 0);
  for (let x = -2; x <= 2; x++) c.stair(K.escalera_piedra, x, 1, 2, 2);
  // bancas, altar dorado con la imagen y candelas
  for (let z = -20; z <= -4; z += 2) for (let x = -4; x <= 4; x++) if (Math.abs(x) > 1) c.stair(K.escalera_tablas, x, 2, z, 0);
  c.fill(-2, 2, -D + 1, 2, 3, -D + 2, K.calcite);
  c.set(0, 4, -D + 1, K.oro_volcanico);
  for (const x of [-2, 2]) c.set(x, 4, -D + 1, K.farol);
  for (let z = -D + 3; z <= -3; z += 4) for (const x of [-5, 5]) c.set(x, 11, z, K.lamp);
  // la fuente de agua bendita detrás
  c.circle(2, (x, z, d) => c.set(x, 1, z - D - 1, d > 1.2 ? K.smooth_stone : K.water));
  c.zone(0, 18, 0, 'campana', 160);
  c.placa(3, 2, 3, 0, 'Basílica de Nuestra Señora de los Ángeles', 'En Cartago está la Negrita, patrona de Costa Rica. Cada 2 de agosto miles de romeros caminan desde todo el país para llegar a la Basílica.');
  for (let k = 0; k < 3; k++) c.npc(-3 + k * 3, 1, 5 + k, { role: 'peregrino', name: ['Doña Olga (romera)', 'Jeison (romero)', 'Abuela Tina (romera)'][k] });
}

function buildRuinas(c) {
  const W = 6, D = 20;
  c.foundation(-W - 3, -D - 3, W + 3, 4, K.cobble, K.grass, 18);
  for (let z = -D; z <= -1; z++) for (let x = -W; x <= W; x++) {
    const edge = Math.abs(x) === W || z === -D || z === -1;
    if (!edge) { if (c.rnd() < 0.08) c.set(x, 1, z, c.rnd() < 0.5 ? K.flower_red : K.flower_yellow); continue; }
    // muros sin techo, gastados por los terremotos
    const top = 6 + Math.floor(c.rnd() * 6) - (Math.abs(x) === W && z % 5 === 0 ? 3 : 0);
    for (let y = 1; y <= top; y++) {
      const arch = Math.abs(x) === W && y >= 3 && y <= 5 && (z % 5 === -2);
      const door = z === -1 && Math.abs(x) <= 1 && y <= 4;
      if (!arch && !door) c.set(x, y, z, c.rnd() < 0.3 ? K.mossy : K.cobble);
    }
  }
  // fachada más alta con su arco
  for (let x = -W; x <= W; x++) for (let y = 1; y <= 12 - Math.abs(x); y++) if (!(Math.abs(x) <= 1 && y <= 4)) c.set(x, y, -1, K.cobble);
  // jardín: árboles pequeños, bancas y caminito
  for (const [x, z] of [[-3, -6], [3, -12], [-3, -16]]) { c.fill(x, 1, z, x, 3, z, K.log); c.circle(1.6, (dx, dz) => { c.set(x + dx, 4, z + dz, K.leaves); c.set(x + dx, 5, z + dz, dx === 0 || dz === 0 ? K.leaves : 0); }); }
  for (let z = -D + 1; z <= -2; z++) c.set(0, 0, z, K.gravel);
  for (const z of [-5, -10, -15]) c.set(2, 1, z, K.losa_tablas);
  c.placa(2, 1, 1, 0, 'Ruinas de Santiago Apóstol', 'En Cartago: la iglesia que nunca se terminó por culpa de los terremotos. Hoy es un jardín entre muros de piedra.');
}

function buildOrosi(c) {
  const W = 5, D = 16;
  c.foundation(-W - 7, -D - 2, W + 3, 7, K.cobble, K.grass, 18);
  // atrio con tapia baja de adobe
  for (let x = -W - 6; x <= W + 2; x++) { c.set(x, 1, 6, K.adobe); }
  c.set(0, 1, 6, 0); c.set(-1, 1, 6, 0);
  for (let z = -D; z <= -1; z++) for (let x = -W; x <= W; x++) {
    const edge = Math.abs(x) === W || z === -D || z === -1;
    c.set(x, 1, z, K.planks);
    for (let y = 2; y <= 7; y++) c.set(x, y, z, edge ? (y === 2 ? K.adobe : Math.abs(x) === W && y === 4 && z % 4 === -2 ? K.glass : K.plaster) : 0);
  }
  // techo de teja a dos aguas
  for (let k = 0; k <= W + 1; k++) for (let z = -D - 1; z <= 0; z++) { c.set(-W - 1 + k, 8 + Math.floor(k / 2), z, K.teja); c.set(W + 1 - k, 8 + Math.floor(k / 2), z, K.teja); }
  for (let k = 0; k <= W; k++) for (let y = 8; y < 8 + Math.floor(k / 2); y++) { c.set(-W + k, y, -1, K.plaster); c.set(W - k, y, -1, K.plaster); }
  c.door(0, 2, -1, 0);
  // campanario aparte, a la izquierda
  for (let y = 1; y <= 12; y++) for (let z = -3; z <= -1; z++) for (let x = -W - 5; x <= -W - 3; x++) {
    const edge = x === -W - 5 || x === -W - 3 || z === -3 || z === -1;
    const open = y >= 9 && y <= 10 && (x === -W - 4 || z === -2);
    c.set(x, y, z, edge && !open ? K.plaster : 0);
  }
  c.set(-W - 4, 10, -2, K.lamp);
  c.fill(-W - 5, 13, -3, -W - 3, 13, -1, K.teja);
  // altar de madera con imágenes y el museo de arte colonial
  for (let z = -13; z <= -4; z += 2) for (let x = -3; x <= 3; x++) if (x !== 0) c.stair(K.escalera_tablas, x, 2, z, 0);
  c.fill(-2, 2, -D + 1, 2, 4, -D + 1, K.madera_carreta);
  c.set(0, 5, -D + 1, K.oro_volcanico);
  for (const x of [-3, 3]) c.set(x, 3, -D + 1, K.farol);
  for (let z = -D + 2; z <= -3; z++) c.set(-W + 1, 2, z, K.bookshelf);
  c.zone(-W - 4, 10, -2, 'campana', 140);
  c.placa(2, 1, 2, 0, 'Iglesia de Orosi', 'La iglesia colonial más antigua del país que sigue en uso, de adobe y teja, en el valle de Orosi. Ha resistido terremotos por siglos.');
}

// puente sobre un río ancho, con cocodrilos abajo
function placeTarcoles(gen, gx, gz) {
  const cell = 700;
  for (let k = 0; k < 40; k++) {
    const x = Math.floor(gx * cell + 50 + hash3(gen.seed, gx, 4100 + k, gz) * (cell - 100));
    const z = Math.floor(gz * cell + 50 + hash3(gen.seed, gx, 4200 + k, gz) * (cell - 100));
    const c = gen.column(x, z);
    if (c.h >= SEA - 1 || c.biome === 'ocean' || c.biome === 'beach' || c.biome === 'snowy' || c.temp < 0.08) continue;
    for (const [ax, az, rot] of [[1, 0, 0], [0, 1, 1]]) {
      let a = 0, b = 0;
      while (a < 14 && gen.column(x - ax * (a + 1), z - az * (a + 1)).h < SEA) a++;
      while (b < 14 && gen.column(x + ax * (b + 1), z + az * (b + 1)).h < SEA) b++;
      if (a >= 14 || b >= 14 || a + b < 6) continue;
      const mid = Math.floor((b - a) / 2);
      return { x: x + ax * mid, z: z + az * mid, y: SEA, rot, half: Math.ceil((a + b) / 2) + 3, id: `tarcoles@${x},${z}`, type: 'tarcoles' };
    }
  }
  return null;
}

function buildTarcoles(c, P) {
  const L = P.half;
  const deck = 3;
  for (let x = -L; x <= L; x++) {
    for (let z = -1; z <= 1; z++) { c.set(x, deck, z, K.planks); for (let y = deck + 1; y <= deck + 4; y++) c.set(x, y, z, 0); }
    for (const z of [-2, 2]) c.set(x, deck + 1, z, K.cerca);
    c.set(x, deck, -2, K.planks); c.set(x, deck, 2, K.planks);
    if (x % 5 === 0) for (const z of [-2, 2]) for (let y = c.ground(x, z); y < deck; y++) c.set(x, y, z, K.cobble);
    if (x % 6 === 0) { c.fill(x, deck + 2, 2, x, deck + 3, 2, K.log); c.set(x, deck + 4, 2, K.farol); }
  }
  // rampas en las orillas
  for (const sx of [-1, 1]) for (let k = 1; k <= 3; k++) for (let z = -1; z <= 1; z++) {
    const x = sx * (L + k);
    const g = c.ground(x, z);
    for (let y = g + 1; y <= deck - k; y++) c.set(x, y, z, K.cobble);
  }
  c.placa(-L + 1, deck + 1, -2, 2, 'Puente del río Tárcoles', 'Desde aquí se ven los cocodrilos más grandes de Costa Rica asoleándose en la orilla. ¡No se tire al agua!');
  for (let k = 0; k < 3; k++) c.npc(-4 + k * 4, -1, 5 - k * 8, { mob: 'cocodrilo', name: `cocodrilo ${k}` });
  c.npc(2, deck + 1, 0, { role: 'vecino', name: 'Turista gringo' });
}

// ---------- registro ----------
const TYPES = [
  // v9: van primero para que los demás lugares los esquiven (los mundos viejos no los ven: minV 9)
  { key: 'feria_pueblo', minV: 9, cell: VCELL, R: 19, place: placeFeriaPueblo, build: buildFeria },
  { key: 'cementerio_pueblo', minV: 9, cell: VCELL, R: 17, place: placeCementerioPueblo, build: buildCementerio },
  { key: 'faro', cell: 560, chance: 0.8, R: 5, salt: 101, tries: 60, fits: coast(16, 4), build: buildFaro },
  { key: 'churchill', cell: 300, chance: 0.65, R: 5, salt: 202, tries: 50, fits: coast(10, 3), build: buildChurchill },
  { key: 'caldera', cell: 820, chance: 0.75, R: 26, salt: 303, tries: 60, fits: coast(22, 6), build: buildCaldera },
  { key: 'fortin', cell: 720, chance: 0.65, R: 7, salt: 404, fits: land(6, 3), build: buildFortin,
    v6: { cell: 1800, R: 21, clearR: 21, tries: 40, fits: land(15, 4, ['plains', 'forest', 'bosque_seco']), build: buildFortinGrande } },
  { key: 'carreta', cell: 240, chance: 0.4, R: 10, salt: 505, fits: land(4, 1, ['plains', 'bosque_seco', 'forest']), build: buildCarreta },
  { key: 'estatua', cell: 500, chance: 0.5, R: 5, salt: 606, fits: land(4, 2), build: buildEstatua },
  { key: 'capital', cell: 1500, chance: 0.9, R: 44, clearR: 42, salt: 808, tries: 40, fits: land(22, 6, ['plains', 'bosque_seco', 'forest']), build: buildCapital, v6: { cell: 3000, tries: 60 } },
  { key: 'mirador_poas', cell: 640, R: 6, place: placeVolcano('poas', (v) => v.r * v.crf + 5), build: buildMiradorPoas },
  { key: 'mirador_arenal', cell: 640, R: 5, place: placeVolcano('arenal', (v) => v.r * 0.92), build: buildMiradorArenal },
  { key: 'cumbre', cell: 1300, R: 3, place: placeCerro('cumbre'), build: buildCumbre },
  { key: 'refugio', cell: 1300, R: 7, place: placeCerro('refugio'), build: buildRefugio },
  { key: 'basilica', cell: 1700, chance: 0.65, R: 30, clearR: 30, salt: 909, tries: 30, fits: land(12, 4, ['plains', 'forest', 'bosque_seco']), build: buildBasilica, v6: { cell: 2600, tries: 50 } },
  { key: 'ruinas', cell: 1100, chance: 0.6, R: 24, clearR: 24, salt: 1010, tries: 30, fits: land(10, 3, ['plains', 'forest', 'bosque_seco']), build: buildRuinas,
    v6: { cell: 2200, R: 40, clearR: 42, tries: 50, fits: land(18, 5, ['plains', 'forest', 'bosque_seco']), build: buildRuinasGrande } },
  { key: 'guanacaste', minV: 6, cell: 1100, chance: 0.6, R: 20, clearR: 19, salt: 1212, tries: 30, fits: land(6, 2, ['bosque_seco', 'plains']), build: buildGuanacasteGigante },
  { key: 'orosi', cell: 950, chance: 0.6, R: 20, clearR: 20, salt: 1111, tries: 30, fits: land(9, 3, ['plains', 'forest', 'jungle', 'nuboso']), build: buildOrosi },
  { key: 'tarcoles', cell: 700, R: 22, place: placeTarcoles, build: buildTarcoles },
  { key: 'estadio_nacional', minV: 6, cell: 3200, chance: 0.85, R: 42, clearR: 42, salt: 1313, tries: 60, fits: land(26, 5, ['plains', 'forest', 'bosque_seco']), build: buildEstadioNacional },
  { key: 'estadio_obra', minV: 6, cell: 2400, chance: 0.75, R: 38, clearR: 38, salt: 1414, tries: 50, fits: land(22, 5, ['plains', 'forest', 'bosque_seco']), build: buildEstadioObra },
  { key: 'estacion', minV: 6, cell: 1100, chance: 0.6, R: 25, clearR: 25, salt: 1515, tries: 30, fits: land(16, 2, ['plains', 'forest', 'jungle', 'bosque_seco']), build: buildEstacion },
  { key: 'monumento_nacional', minV: 6, cell: 1800, chance: 0.6, R: 11, salt: 1616, tries: 30, fits: land(10, 2, ['plains', 'forest', 'bosque_seco']), build: buildMonumentoNacional },
  { key: 'templo_musica', minV: 6, cell: 1200, chance: 0.6, R: 12, salt: 1717, tries: 30, fits: land(11, 2, ['plains', 'forest', 'bosque_seco']), build: buildTemploMusica },
  { key: 'playa_lujo', minV: 6, cell: 1400, chance: 0.8, R: 50, clearR: 48, salt: 1818, tries: 80, fits: coast(28, 10), build: buildPlayaLujo },
  { key: 'refineria', minV: 6, cell: 2600, chance: 0.85, R: 54, clearR: 50, salt: 1919, tries: 90, fits: coast(30, 8), build: buildRefineria },
  { key: 'sanatorio', minV: 6, cell: 2400, chance: 0.75, R: 30, clearR: 30, salt: 2020, tries: 90, fits: high(13, 7, 76), build: buildSanatorio },
  { key: 'metalico', minV: 6, cell: 1400, chance: 0.55, R: 17, salt: 2121, tries: 30, fits: land(14, 3, ['plains', 'forest']), build: buildMetalico },
  { key: 'correos', minV: 6, cell: 1400, chance: 0.55, R: 15, salt: 2222, tries: 30, fits: land(13, 3, ['plains', 'forest']), build: buildCorreos },
  { key: 'museo_ninos', minV: 6, cell: 1600, chance: 0.55, R: 19, salt: 2323, tries: 30, fits: land(16, 3, ['plains', 'forest', 'bosque_seco']), build: buildMuseoNinos },
  { key: 'grecia', minV: 6, cell: 1400, chance: 0.55, R: 33, clearR: 30, salt: 2424, tries: 30, fits: land(14, 3, ['plains', 'forest']), build: buildGrecia },
  { key: 'coronado', minV: 6, cell: 1500, chance: 0.55, R: 37, clearR: 34, salt: 2525, tries: 30, fits: high(14, 4, 74), build: buildCoronado },
  { key: 'ujarras', minV: 6, cell: 1300, chance: 0.55, R: 29, clearR: 26, salt: 2626, tries: 30, fits: land(12, 3, ['plains', 'forest', 'jungle']), build: buildUjarras },
  { key: 'santa_rosa', minV: 6, cell: 1600, chance: 0.65, R: 23, clearR: 22, salt: 2727, tries: 40, fits: land(16, 3, ['bosque_seco', 'plains']), build: buildSantaRosa },
  { key: 'esferas', minV: 6, cell: 1200, chance: 0.55, R: 15, salt: 2828, tries: 30, fits: land(12, 2, ['jungle', 'forest']), build: buildEsferas },
  { key: 'aduana', minV: 6, cell: 1200, chance: 0.5, R: 23, salt: 2929, tries: 30, fits: land(18, 3, ['plains', 'forest', 'bosque_seco']), build: buildAduana },
  { key: 'beneficio', minV: 6, cell: 1300, chance: 0.6, R: 31, clearR: 30, salt: 3030, tries: 30, fits: land(18, 4, ['plains', 'forest']), build: buildBeneficio },
  { key: 'trapiche', minV: 6, cell: 900, chance: 0.55, R: 17, salt: 3131, tries: 20, fits: land(11, 2, ['plains', 'forest', 'bosque_seco']), build: buildTrapicheViejo },
  { key: 'hacienda', minV: 6, cell: 1500, chance: 0.7, R: 42, clearR: 40, salt: 3232, tries: 40, fits: land(24, 4, ['bosque_seco', 'plains']), build: buildHacienda },
  { key: 'bananera', minV: 6, cell: 1300, chance: 0.7, R: 35, clearR: 34, salt: 3333, tries: 40, fits: land(20, 4, ['jungle', 'forest']), build: buildBananera },
  { key: 'catarata', minV: 6, cell: 1600, chance: 0.7, R: 21, salt: 3434, tries: 40, fits: land(12, 3, ['jungle', 'forest', 'nuboso']), build: buildCatarata },
  { key: 'puente_colgante', minV: 6, cell: 900, R: 25, place: placePuenteColgante, build: buildPuenteColgante },
  { key: 'irazu', minV: 6, cell: 2600, chance: 0.8, R: 32, clearR: 32, salt: 3535, tries: 120, fits: high(12, 14, 84), build: buildIrazu },
  { key: 'rincon_vieja', minV: 6, cell: 1800, chance: 0.7, R: 21, salt: 3636, tries: 40, fits: land(14, 3, ['bosque_seco', 'plains', 'forest']), build: buildRinconVieja },
  { key: 'barra_honda', minV: 6, cell: 1400, chance: 0.65, R: 13, salt: 3737, tries: 30, fits: land(8, 3, ['bosque_seco', 'plains', 'forest']), build: buildBarraHonda },
  { key: 'amistad', minV: 6, cell: 1600, R: 46, place: placeAmistad, build: buildAmistad },
  { key: 'marino_ballena', minV: 6, cell: 1700, chance: 0.95, R: 62, clearR: 30, salt: 3838, tries: 240, fits: coast(10, 4), build: buildMarinoBallena },
  { key: 'corcovado', minV: 6, cell: 2000, chance: 0.8, R: 18, salt: 3939, tries: 60, fits: land(14, 4, ['jungle']), build: buildCorcovado },
  { key: 'manuel_antonio', minV: 6, cell: 1500, chance: 0.8, R: 24, salt: 4040, tries: 160, fits: coast(10, 4), build: buildManuelAntonio },
  { key: 'tortuguero', minV: 6, cell: 1800, chance: 0.75, R: 26, salt: 4141, tries: 90, fits: coast(12, 5), build: buildTortuguero },
  { key: 'cahuita', minV: 6, cell: 1800, chance: 0.8, R: 32, clearR: 22, salt: 4242, tries: 160, fits: coast(8, 4), build: buildCahuita },
  { key: 'tenorio', minV: 6, cell: 1800, chance: 0.8, R: 26, clearR: 26, salt: 4343, tries: 60, fits: land(14, 4, ['jungle', 'forest', 'nuboso']), build: buildTenorio },
  { key: 'monteverde', minV: 6, cell: 1600, chance: 0.85, R: 20, clearR: 20, salt: 4444, tries: 80, fits: land(12, 5, ['nuboso', 'forest']), build: buildMonteverde },
  { key: 'palo_verde', minV: 6, cell: 1800, chance: 0.8, R: 24, clearR: 24, salt: 4545, tries: 60, fits: land(16, 3, ['bosque_seco', 'plains', 'manglar']), build: buildPaloVerde },
  { key: 'isla_coco', minV: 6, cell: 3000, R: 30, place: placeIslaCoco, build: buildIslaCoco },
  { key: 'feria', minV: 6, cell: 1100, chance: 0.6, R: 19, salt: 4646, tries: 30, fits: land(14, 2, ['plains', 'forest', 'bosque_seco']), build: buildFeria },
  { key: 'cementerio', minV: 6, cell: 1000, chance: 0.55, R: 17, salt: 4747, tries: 30, fits: land(12, 2, ['plains', 'forest', 'bosque_seco', 'jungle']), build: buildCementerio },
  { key: 'muelle_limon', minV: 6, cell: 2000, chance: 0.85, R: 32, clearR: 24, salt: 4848, tries: 160, fits: coast(10, 4), build: buildMuelleLimon },
  { key: 'zapote', minV: 6, cell: 2400, chance: 0.8, R: 32, clearR: 32, salt: 4949, tries: 60, fits: land(22, 3, ['plains', 'forest']), build: buildZapote },
  { key: 'aeropuerto', minV: 6, cell: 3000, chance: 0.85, R: 62, clearR: 40, salt: 5050, tries: 90, fits: land(40, 3, ['plains', 'bosque_seco']), build: buildAeropuerto },
  { key: 'zurqui', minV: 6, cell: 1800, R: 34, place: placeZurqui, build: buildZurqui },
  { key: 'cerro_muerte', minV: 6, cell: 1800, chance: 0.75, R: 15, salt: 5151, tries: 100, fits: high(10, 6, 88), build: buildCerroMuerte },
  { key: 'conchal', minV: 6, cell: 1600, chance: 0.8, R: 26, clearR: 20, salt: 5252, tries: 120, fits: coast(10, 4), build: buildConchal },
  { key: 'turrialba', minV: 6, cell: 2200, chance: 0.4, R: 24, clearR: 24, salt: 5353, tries: 80, fits: high(12, 10, 80), build: buildTurrialba },
  { key: 'san_lucas', minV: 6, cell: 2400, R: 22, place: placeSanLucas, build: buildSanLucas },
  { key: 'braulio', minV: 6, cell: 1800, chance: 0.75, R: 30, clearR: 30, salt: 5454, tries: 80, fits: land(14, 7, ['jungle', 'nuboso', 'forest']), build: buildBraulio },
  { key: 'juan_castro', minV: 6, cell: 1800, chance: 0.7, R: 19, salt: 5555, tries: 80, fits: high(12, 5, 76), build: buildJuanCastro },
  { key: 'carara', minV: 6, cell: 1700, chance: 0.75, R: 24, clearR: 24, salt: 5656, tries: 80, fits: land(14, 5, ['forest', 'jungle', 'bosque_seco']), build: buildCarara },
  { key: 'cacaotal', minV: 6, cell: 1500, chance: 0.75, R: 20, salt: 5757, tries: 80, fits: land(16, 4, ['jungle', 'forest']), build: buildCacaotal },
  { key: 'lecheria', minV: 6, cell: 1500, chance: 0.75, R: 22, salt: 5858, tries: 80, fits: land(18, 4, ['plains', 'nuboso', 'forest']), build: buildLecheria },
  { key: 'amistad_parque', minV: 9, cell: 2000, chance: 0.75, R: 28, clearR: 26, salt: 6060, tries: 80, fits: high(12, 8, 84), build: buildAmistadParque },
  { key: 'rincon_parque', minV: 9, cell: 1900, chance: 0.75, R: 24, clearR: 24, salt: 6161, tries: 80, fits: land(20, 5, ['bosque_seco', 'plains', 'forest']), build: buildRinconParque },
  { key: 'catarata_escondida', minV: 15, cell: 1400, chance: 0.75, R: 24, clearR: 22, salt: 6565, tries: 80, fits: land(16, 5, ['jungle', 'forest', 'nuboso']), build: buildCatarataEscondida },
  { key: 'templo_hundido', minV: 14, cell: 1500, chance: 0.75, R: 14, clearR: 0, salt: 6464, tries: 120, fits: (gen, x, z, c) => (c.biome === 'ocean' && c.h >= SEA - 16 && c.h <= SEA - 6 && flat(gen, x, z, c.h, 8, 3) ? {} : null), build: buildTemplo },
  { key: 'caverna_rey', minV: 12, cell: 1500, chance: 0.7, R: 26, clearR: 6, salt: 6363, tries: 80, fits: land(6, 3, ['forest', 'jungle', 'plains', 'bosque_seco', 'nuboso']), build: buildCaverna },
  { key: 'sitio_arqueologico', minV: 11, cell: 1400, chance: 0.75, R: 24, clearR: 22, salt: 6262, tries: 80, fits: land(20, 4, ['jungle', 'forest', 'plains', 'bosque_seco']), build: buildSitioArqueologico },
  { key: 'canopy', minV: 9, cell: 1300, chance: 0.8, R: 52, clearR: 8, salt: 5959, tries: 80, fits: land(10, 4, ['nuboso', 'jungle', 'forest']), build: buildCanopy },
  // v12.15.2 (C7, generador v21): el balneario de aguas termales al pie de un volcán
  { key: 'termales', minV: 21, cell: 640, chance: 1, R: 14, clearR: 14, salt: 7373, tries: 160, fits: (gen, x, z, c) => (c.volcanoK > 0.06 && c.volcanoK < 0.4 && c.h > SEA + 2 && c.h < 100 && flat(gen, x, z, c.h, 9, 5) ? {} : null), build: buildTermales },
  // v13.1.1 (C3 de cuevas, generador 22): tres sitios kársticos bajo tierra, cada uno con su cofre, su placa y su entrada en la libreta
  { key: 'cueva_barra_honda', minV: 22, cell: 1100, chance: 0.7, R: 26, clearR: 6, salt: 7474, tries: 80, fits: land(5, 3, ['bosque_seco', 'plains', 'forest', 'nuboso']), build: buildCuevaBarraHonda },
  { key: 'cueva_venado', minV: 22, cell: 1200, chance: 0.7, R: 30, clearR: 6, salt: 7575, tries: 80, fits: land(5, 3, ['forest', 'jungle', 'nuboso', 'plains']), build: buildCuevaVenado },
  { key: 'geoda_mayor', minV: 22, cell: 1400, chance: 0.65, R: 22, clearR: 6, salt: 7676, tries: 80, fits: land(5, 3, ['forest', 'jungle', 'plains', 'bosque_seco', 'nuboso']), build: buildGeodaMayor },
  { key: 'fuente', cell: 640, chance: 0.45, R: 9, salt: 707, fits: land(8, 2, ['plains', 'bosque_seco', 'forest']), build: buildFuente },
  // v12.4.7; v12.4.9: al final, para que ceda ante todos los demás (no le quita lugar a nadie)
  { key: 'casita_bahareque', minV: 18, cell: 520, chance: 0.6, R: 7, salt: 7171, tries: 50, fits: land(6, 2, ['plains', 'forest']), build: buildCasitaBahareque }, // v12.4.7
];

// v13.3.0 (I8): el radio de verdad de lo que dibujan (medido por tools/revisar-integracion.mjs)
const RADIOS24 = { irazu: 34, san_lucas: 26, cueva_venado: 35, marino_ballena: 75 };
// lo que se construye A PROPÓSITO sobre el vacío o bajo tierra: no se le rellena nada debajo (v13.3.0, I1)
const SIN_RELLENO = new Set(['caverna_rey', 'canopy', 'puente_colgante', 'templo_hundido', 'cueva_barra_honda', 'cueva_venado', 'geoda_mayor', 'catarata', 'catarata_escondida', 'termales']);

// v13.3.0 (I1): ¿hay una obra a menos de R+22 (estructura) o R+26 (pueblo) de (x, z)? Las bocas de cueva no se abren ahí.
export function cercaDeObra(gen, x, z) {
  for (const T of typesFor(gen)) {
    const gap = T.R + 22;
    for (let gz = Math.floor((z - gap) / T.cell); gz <= Math.floor((z + gap) / T.cell); gz++) for (let gx = Math.floor((x - gap) / T.cell); gx <= Math.floor((x + gap) / T.cell); gx++) {
      const P = placeOf(gen, T, gx, gz);
      if (P && Math.abs(P.x - x) < gap && Math.abs(P.z - z) < gap) return true;
    }
  }
  const cx = Math.floor(x / VCELL), cz = Math.floor(z / VCELL);
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const v = villageAt(gen, cx + dx, cz + dz);
    if (v) { const VR = (v.R || 46) + 26; if (Math.abs(v.x - x) < VR && Math.abs(v.z - z) < VR) return true; }
  }
  return false;
}

// tipos que existen en este mundo (lo nuevo solo en mundos nuevos; v6 trae versiones más grandes)
function typesFor(gen) {
  if (!gen.structTypes) {
    gen.structTypes = TYPES.filter((T) => (T.minV || 5) <= gen.version).map((T) => (gen.version >= 6 && T.v6 ? { ...T, ...T.v6 } : T))
      // v8: los lugares grandes (parques, monumentos) quedan ~25 % más juntos; los chiquitos y los de colocación propia, igual
      .map((T) => (gen.version >= 8 && !T.place && T.cell >= 1000 ? { ...T, cell: Math.round(T.cell * 0.78) } : T))
      // v11.13.0, mundo compacto: la grilla a un tercio (sin bajar de lo que ocupa la estructura más un margen)
      .map((T) => (gen.compacto && !T.place ? { ...T, cell: Math.max(Math.round(T.cell / 3), 2 * T.R + 90) } : T))
      // v13.3.0 (I8, generador 24): estos cuatro dibujaban más allá de su radio y quedaban recortados en línea recta según cómo cayera el trozo
      .map((T) => (gen.version >= 24 && RADIOS24[T.key] ? { ...T, R: RADIOS24[T.key], clearR: T.clearR ? Math.max(T.clearR, RADIOS24[T.key]) : T.clearR } : T));
  }
  return gen.structTypes;
}

// rumores: revisa de a UN tipo por llamada lo que hay alrededor (barato; se va llenando con el tiempo)
export function scanStep(gen, i, x, z, radius) {
  const types = typesFor(gen);
  const T = types[i % types.length];
  return structuresNear(gen, x, z, radius, new Set([T.key]));
}

export const cuantosTipos = (gen) => typesFor(gen).length; // v13.0.2: el mapa los revisa de a uno por vuelta (scanStep)

// v6: que no se monte encima de otra estructura (se revisan solo los tipos anteriores en la lista)
function overlaps(gen, T, x, z) {
  const types = typesFor(gen);
  const me = types.findIndex((t) => t.key === T.key);
  for (let i = 0; i < me; i++) {
    const T2 = types[i], gap = T.R + T2.R + 8;
    for (let gz = Math.floor((z - gap) / T2.cell); gz <= Math.floor((z + gap) / T2.cell); gz++) for (let gx = Math.floor((x - gap) / T2.cell); gx <= Math.floor((x + gap) / T2.cell); gx++) {
      const P2 = placeOf(gen, T2, gx, gz);
      if (P2 && Math.abs(P2.x - x) < gap && Math.abs(P2.z - z) < gap) return true;
    }
  }
  return false;
}

function placeOf(gen, T, gx, gz) {
  gen.structCache = gen.structCache || new Map();
  const key = `${T.key}:${gx},${gz}`;
  if (gen.structCache.has(key)) return gen.structCache.get(key);
  let P = null;
  // mundo compacto: alrededor del inicio manda el anillo (un sitio fijo por tipo); la grilla no entra ahí
  const anillo = gen.compacto ? sitiosAnillo(gen) : null, A = anillo && !T.place ? anillo.get(T.key) : null;
  if (A && Math.floor(A.x / T.cell) === gx && Math.floor(A.z / T.cell) === gz) { gen.structCache.set(key, A); return A; }
  const enZona = (x, z) => anillo && Math.hypot(x - gen.inicioC.x, z - gen.inicioC.z) < gen.zonaAnillo;
  const pisaAnillo = (x, z, R) => anillo && gen.anilloPuestos.some((q) => Math.abs(q.x - x) < q.R + R + 8 && Math.abs(q.z - z) < q.R + R + 8);
  if (T.place) { P = T.place(gen, gx, gz); if (P && gen.version >= 6 && overlaps(gen, T, P.x, P.z)) P = null; if (P && pisaAnillo(P.x, P.z, T.R)) P = null; }
  else if (hash3(gen.seed, gx, T.salt, gz) < T.chance) {
    const m = Math.min(60, T.cell / 4);
    for (let k = 0; k < (T.tries || 14) && !P; k++) {
      const x = Math.floor(gx * T.cell + m + hash3(gen.seed, gx, T.salt + k * 13 + 1, gz) * (T.cell - 2 * m));
      const z = Math.floor(gz * T.cell + m + hash3(gen.seed, gx, T.salt + k * 13 + 2, gz) * (T.cell - 2 * m));
      if (enZona(x, z)) continue;
      const c = gen.column(x, z);
      const f = T.fits(gen, x, z, c);
      if (!f) continue;
      // que no caiga encima de un pueblo
      const v = villageAt(gen, Math.floor(x / VCELL), Math.floor(z / VCELL));
      if (v && Math.hypot(v.x - x, v.z - z) < 90 + (gen.version >= 6 ? T.R : 0)) continue;
      if (gen.version >= 6 && overlaps(gen, T, x, z)) continue;
      P = { x, z, y: c.h, rot: f.rot ?? Math.floor(hash3(gen.seed, x, T.salt, z) * 4), id: `${T.key}@${x},${z}`, type: T.key };
    }
  }
  gen.structCache.set(key, P);
  return P;
}

// ---------- v11.13.0 «Tiquicia de bolsillo»: el mundo compacto ----------
// El inicio queda a 70–140 bloques del pueblo más cercano al origen (así hay pueblo a menos de 150). Alrededor, cada tipo de
// estructura que se ubica por el terreno recibe UN sitio fijo entre 60 y 600 bloques (los chicos primero, más cerca; lo peligroso,
// de 150 para afuera), sin encimarse con los otros sitios ni con los pueblos. Más allá, la grilla normal a un tercio.
// Todo sale de la semilla: misma semilla y mismo tipo, mismo mundo.
const ANILLO = 600, SEGURO = 60, PELIGROSO = new Set(['caverna_rey']), LEJOS_PELIGRO = 150;
export function inicioCompacto(gen) {
  if (gen.inicioC) return gen.inicioC;
  let pueblo = null;
  for (let r = 0; r < 10 && !pueblo; r++) {
    for (let cz = -r; cz <= r; cz++) for (let cx = -r; cx <= r; cx++) {
      if (Math.max(Math.abs(cx), Math.abs(cz)) !== r) continue;
      const v = villageAt(gen, cx, cz);
      if (v && (!pueblo || Math.hypot(v.x, v.z) < Math.hypot(pueblo.x, pueblo.z))) pueblo = v;
    }
  }
  let p = null;
  if (pueblo) {
    // v11.13.5 (sexta revisión, M1): lo que se arma a la par del pueblo (feria, cementerio…) no pasa por el anillo; el inicio también
    // les guarda el anillo seguro (60 + R). Si no hay sitio así, al menos fuera de su caja (R + 8), nunca encima de un techo
    const pegados = typesFor(gen).filter((T) => T.place && T.cell === VCELL).map((T) => { const q = T.place(gen, Math.floor(pueblo.x / VCELL), Math.floor(pueblo.z / VCELL)); return q && { x: q.x, z: q.z, R: T.R }; }).filter(Boolean);
    for (const margen of [SEGURO, 8]) {
      for (let d = 70; d <= 140 && !p; d += 10) for (let k = 0; k < 24 && !p; k++) {
        const a = (k / 24) * Math.PI * 2 + hash3(gen.seed, d, 77, k) * 0.25, x = Math.round(pueblo.x + Math.cos(a) * d), z = Math.round(pueblo.z + Math.sin(a) * d);
        if (pegados.some((q) => Math.hypot(q.x - x, q.z - z) < q.R + margen)) continue;
        const c = gen.column(x, z);
        if (c.h > SEA + 1 && c.h < 90 && ['plains', 'forest', 'jungle', 'bosque_seco'].includes(c.biome)) p = { x: x + 0.5, y: c.h + 1, z: z + 0.5 };
      }
      if (p) break;
    }
  }
  gen.inicioC = p || gen.findSpawn();
  return gen.inicioC;
}
function cercaDePueblo(gen, x, z, R) {
  const cx = Math.floor(x / VCELL), cz = Math.floor(z / VCELL);
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const v = villageAt(gen, cx + dx, cz + dz);
    if (v && Math.hypot(v.x - x, v.z - z) < 90 + R) return true;
  }
  return false;
}
export function sitiosAnillo(gen) {
  if (gen.anillo) return gen.anillo;
  const S = inicioCompacto(gen), out = new Map(), puestos = [];
  gen.anillo = out; gen.anilloPuestos = puestos; gen.zonaAnillo = 0;
  const tipos = typesFor(gen).filter((T) => !T.place && T.fits).sort((a, b) => a.R - b.R || (a.key < b.key ? -1 : 1));
  for (const T of tipos) {
    const desde = Math.max(SEGURO, PELIGROSO.has(T.key) ? LEJOS_PELIGRO : 0) + T.R, a0 = hash3(gen.seed, T.salt, 31, 7) * Math.PI * 2;
    let P = null;
    for (let d = desde; d <= ANILLO + 300 - T.R && !P; d += 10) {
      const n = Math.max(8, Math.floor(d / 14));
      for (let k = 0; k < n && !P; k++) {
        const a = a0 + (k / n) * Math.PI * 2, x = Math.floor(S.x + Math.cos(a) * d), z = Math.floor(S.z + Math.sin(a) * d);
        if (puestos.some((q) => Math.abs(q.x - x) < q.R + T.R + 8 && Math.abs(q.z - z) < q.R + T.R + 8)) continue;
        const c = gen.column(x, z), f = T.fits(gen, x, z, c);
        if (!f || cercaDePueblo(gen, x, z, T.R)) continue;
        P = { x, z, y: c.h, rot: f.rot ?? Math.floor(hash3(gen.seed, x, T.salt, z) * 4), id: `${T.key}@${x},${z}`, type: T.key };
      }
    }
    if (P) { out.set(T.key, P); puestos.push({ x: P.x, z: P.z, R: T.R }); gen.zonaAnillo = Math.max(gen.zonaAnillo, Math.hypot(P.x - S.x, P.z - S.z) + T.R + 70); }
  }
  return out;
}

// todas las estructuras de un tipo cerca de (x, z) (para el mapa y los comandos)
export function structuresNear(gen, x, z, radius, only = null) {
  const res = [];
  for (const T of typesFor(gen)) {
    if (only && !only.has(T.key)) continue;
    const g0x = Math.floor((x - radius) / T.cell), g1x = Math.floor((x + radius) / T.cell);
    const g0z = Math.floor((z - radius) / T.cell), g1z = Math.floor((z + radius) / T.cell);
    for (let gz = g0z; gz <= g1z; gz++) for (let gx = g0x; gx <= g1x; gx++) { const P = placeOf(gen, T, gx, gz); if (P) res.push(P); }
  }
  return res;
}

export const STRUCT_NAMES = { faro: 'Faro', churchill: 'Puesto de Churchill', caldera: 'Muelle de Caldera', fortin: 'Fortín', carreta: 'Carreta', estatua: 'Estatua', fuente: 'Fuente de la Hispanidad', capital: 'San José (capital)', mirador_poas: 'Volcán Poás', mirador_arenal: 'Volcán Arenal', cumbre: 'Cerro Chirripó (cumbre)', refugio: 'Base Crestones (Chirripó)', basilica: 'Basílica de los Ángeles', ruinas: 'Ruinas de Cartago', orosi: 'Iglesia de Orosi', tarcoles: 'Puente del Tárcoles',
  guanacaste: 'Guanacaste monumental', estadio_nacional: 'Estadio Nacional', estadio_obra: 'Estadio en remodelación', estacion: 'Estación del tren', monumento_nacional: 'Monumento Nacional', templo_musica: 'Templo de la Música', playa_lujo: 'Playa de lujo', refineria: 'La refinería que no refina',
  sanatorio: 'Sanatorio Durán', metalico: 'Edificio Metálico', correos: 'Correos y Telégrafos', museo_ninos: 'Museo de los Niños', grecia: 'Iglesia metálica de Grecia', coronado: 'Iglesia de Coronado', ujarras: 'Ruinas de Ujarrás', santa_rosa: 'Casona de Santa Rosa', esferas: 'Esferas del Diquís', aduana: 'Antigua Aduana',
  beneficio: 'Beneficio de café', trapiche: 'Trapiche', hacienda: 'Hacienda ganadera', bananera: 'Bananera', catarata: 'Catarata de La Fortuna', puente_colgante: 'Puente colgante',
  irazu: 'Volcán Irazú', rincon_vieja: 'Rincón de la Vieja', barra_honda: 'Caverna de Barra Honda', amistad: 'Puente de la Amistad',
  marino_ballena: 'Parque Nacional Marino Ballena', corcovado: 'Parque Nacional Corcovado', manuel_antonio: 'Parque Nacional Manuel Antonio', tortuguero: 'Parque Nacional Tortuguero',
  cahuita: 'Parque Nacional Cahuita', tenorio: 'Río Celeste (Tenorio)', monteverde: 'Reserva de Monteverde', palo_verde: 'Parque Nacional Palo Verde', isla_coco: 'Isla del Coco',
  feria: 'Feria del agricultor', cementerio: 'Cementerio', muelle_limon: 'Muelle de Limón',
  zapote: 'Fiestas de Zapote', aeropuerto: 'Aeropuerto Juan Santamaría', zurqui: 'Túnel Zurquí',
  cerro_muerte: 'Cerro de la Muerte', conchal: 'Playa Conchal', turrialba: 'Volcán Turrialba', san_lucas: 'Isla San Lucas',
  feria_pueblo: 'Feria del agricultor', cementerio_pueblo: 'Cementerio del pueblo', canopy: 'Canopy Pura Adrenalina', sitio_arqueologico: 'Sitio arqueológico', caverna_rey: 'La Caverna del Rey', templo_hundido: 'El templo hundido', catarata_escondida: 'La catarata escondida', amistad_parque: 'Parque Internacional La Amistad', rincon_parque: 'Rincón de la Vieja (Las Pailas)',
  braulio: 'Parque Nacional Braulio Carrillo', juan_castro: 'Parque Nacional Juan Castro Blanco', carara: 'Parque Nacional Carara',
  cacaotal: 'Cacaotal bribri', lecheria: 'Lechería La Vaquita', termales: 'Aguas termales', cueva_barra_honda: 'Cueva de Barra Honda', cueva_venado: 'Cueva de Venado', geoda_mayor: 'Geoda mayor' };
// rareza y logro al descubrir cada lugar
export const STRUCT_RARE = { faro: 'rara', churchill: 'común', caldera: 'poco común', fortin: 'legendaria', carreta: 'común', estatua: 'común', fuente: 'poco común', capital: 'legendaria',
  mirador_poas: 'rara', mirador_arenal: 'rara', cumbre: 'legendaria', refugio: 'rara', basilica: 'legendaria', ruinas: 'legendaria', orosi: 'rara', tarcoles: 'rara', guanacaste: 'legendaria',
  estadio_nacional: 'legendaria', estadio_obra: 'rara', estacion: 'poco común', monumento_nacional: 'rara', templo_musica: 'poco común', playa_lujo: 'poco común', refineria: 'rara',
  sanatorio: 'legendaria', metalico: 'rara', correos: 'rara', museo_ninos: 'rara', grecia: 'rara', coronado: 'rara', ujarras: 'rara', santa_rosa: 'rara', esferas: 'rara', aduana: 'poco común',
  beneficio: 'poco común', trapiche: 'común', hacienda: 'poco común', bananera: 'poco común', catarata: 'rara', puente_colgante: 'rara',
  irazu: 'legendaria', rincon_vieja: 'rara', barra_honda: 'rara', amistad: 'legendaria',
  marino_ballena: 'legendaria', corcovado: 'legendaria', manuel_antonio: 'rara', tortuguero: 'rara',
  cahuita: 'rara', tenorio: 'rara', monteverde: 'rara', palo_verde: 'rara', isla_coco: 'legendaria',
  feria: 'común', cementerio: 'común', muelle_limon: 'rara',
  zapote: 'rara', aeropuerto: 'legendaria', zurqui: 'rara',
  cerro_muerte: 'rara', conchal: 'rara', turrialba: 'legendaria', san_lucas: 'rara',
  braulio: 'rara', juan_castro: 'rara', carara: 'rara', feria_pueblo: 'común', cementerio_pueblo: 'común', canopy: 'poco común', sitio_arqueologico: 'rara', caverna_rey: 'épica', templo_hundido: 'legendaria', catarata_escondida: 'rara', amistad_parque: 'legendaria', rincon_parque: 'rara',
  cacaotal: 'poco común', lecheria: 'poco común', termales: 'poco común', cueva_barra_honda: 'rara', cueva_venado: 'rara', geoda_mayor: 'legendaria' };
export const STRUCT_ACH = { fortin: ['fortin', 'De Heredia para el mundo'], guanacaste: ['guanacaste_eterno', 'Guanacaste eterno'], ruinas: ['ruinas', 'La iglesia que nunca se terminó'],
  basilica: ['basilica', 'Romero de corazón'], faro: ['faro', 'Luz del Pacífico'], cumbre: ['chirripo', 'En el techo de Costa Rica'], mirador_poas: ['poas', 'Cráter del Poás'], mirador_arenal: ['arenal', 'Frente al Arenal'],
  estadio_nacional: ['sabana', 'La Sabana se llenó'], estadio_obra: ['sigue_construccion', 'Sigue en construcción'], estacion: ['tren', 'Pasajero del tren'], templo_musica: ['retreta', 'Domingo de retreta'], playa_lujo: ['gentrificacion', 'Bienvenidos al paraíso (en dólares)'], refineria: ['refinamiento', 'Visité la refinería que no refina'],
  sanatorio: ['sanatorio', 'Pasos en el corredor'], esferas: ['esferas', 'Patrimonio de la Humanidad'], santa_rosa: ['santa_rosa', 'Catorce minutos'], grecia: ['grecia', 'La iglesia de metal'],
  beneficio: ['beneficio', 'Grano de oro'], hacienda: ['hacienda', '¡Eeepa, toros!'], catarata: ['catarata', 'Quinientas gradas'], puente_colgante: ['puente_colgante', 'Entre las copas'],
  irazu: ['irazu', 'Se ven los dos mares'], rincon_vieja: ['rincon_vieja', 'Lodo que hierve'], barra_honda: ['barra_honda', 'Bajo tierra en Nicoya'], amistad: ['amistad', 'Ya no hay que esperar la panga'],
  marino_ballena: ['marino_ballena', 'La cola de la ballena'], corcovado: ['corcovado', 'Lo más intenso del planeta'], manuel_antonio: ['manuel_antonio', 'Me robaron el almuerzo'], tortuguero: ['tortuguero', 'Noche de tortugas'],
  cahuita: ['cahuita', 'Calipso en Cahuita'], tenorio: ['tenorio', 'Donde Dios lavó los pinceles'], monteverde: ['monteverde', 'Entre las nubes'], palo_verde: ['palo_verde', 'Mil garzas'], isla_coco: ['isla_coco', 'El tesoro de la Isla del Coco'],
  feria: ['feria', 'Sábado de feria'], muelle_limon: ['limon', 'Pura vida, Limón'],
  zapote: ['zapote', 'Improvisado en Zapote'], aeropuerto: ['aeropuerto', 'Bienvenidos a Costa Rica'], zurqui: ['zurqui', 'Eco en el Zurquí'],
  cerro_muerte: ['cerro_muerte', 'Frío en el Cerro de la Muerte'], conchal: ['conchal', 'Arena de conchas'], turrialba: ['turrialba', 'Ceniza en el pelo'], san_lucas: ['san_lucas', 'Preso en San Lucas'],
  canopy: ['canopy_lugar', 'Entre las copas en tirolesa'], sitio_arqueologico: ['sitio_arqueologico', 'Arqueólogo aficionado'], caverna_rey: ['caverna_rey', 'A la boca de la caverna'], templo_hundido: ['templo_hundido', 'El templo bajo el mar'], catarata_escondida: ['catarata_escondida', 'Detrás del agua'], amistad_parque: ['amistad_parque', 'Un pie en cada país'], rincon_parque: ['rincon_parque', 'La poza celeste de La Cangreja'], feria_pueblo: ['feria', 'Sábado de feria'], cementerio_pueblo: ['cementerio_pueblo', 'Bóvedas blancas'],
  braulio: ['braulio', 'La Ruta 32 cerrada'], juan_castro: ['juan_castro', 'Trucha de la naciente'], carara: ['carara', 'Lapas al atardecer'],
  cacaotal: ['cacaotal', 'Bebida de los dioses'], lecheria: ['lecheria', 'Ordeño a las 4 a. m.'] };
// radio para contar como descubierto
export function structRadius(gen, type) { const T = typesFor(gen).find((t) => t.key === type); return T ? T.R : 8; }

export function buildStructuresInChunk(gen, cx, cz, blocks, idx) {
  const out = [];
  const toc = gen.version >= 24 ? new Int16Array(256).fill(32767) : null; // v13.3.0 (I1)
  const x0 = cx * CH, z0 = cz * CH;
  for (const T of typesFor(gen)) {
    const g0x = Math.floor((x0 - T.R) / T.cell), g1x = Math.floor((x0 + CH + T.R) / T.cell);
    const g0z = Math.floor((z0 - T.R) / T.cell), g1z = Math.floor((z0 + CH + T.R) / T.cell);
    for (let gz = g0z; gz <= g1z; gz++) for (let gx = g0x; gx <= g1x; gx++) {
      const P = placeOf(gen, T, gx, gz);
      if (!P || Math.abs(P.x - (x0 + 8)) > T.R + 9 || Math.abs(P.z - (z0 + 8)) > T.R + 9) continue;
      const ctx = new Ctx(gen, cx, cz, blocks, idx, out, P);
      if (toc && !SIN_RELLENO.has(T.key)) ctx.toc = toc;
      // v13.3.0 (I5): en el generador 24 el despeje de árboles no tiene el tope de 14 y llega 6 más allá del radio (copas sueltas del borde)
      ctx.clearTrees(T.clearR || (gen.version >= 24 ? T.R + 6 : Math.min(T.R + 3, 14)));
      T.build(ctx, P);
    }
  }
  if (toc) rellenarBajoObras(blocks, idx, toc);
  return out;
}
