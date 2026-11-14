// Edificios históricos (generador v6): Sanatorio Durán, Edificio Metálico, Correos, Museo de los Niños (la antigua
// Penitenciaría), iglesia metálica de Grecia, iglesia de Coronado, ruinas de Ujarrás, Casona de Santa Rosa,
// esferas de piedra del Diquís y la Antigua Aduana. El frente mira a +z local. Sin gráficos.
import { BLOCK_BY_KEY as K } from './blocks.js';

// edificio de varios pisos: paredes, ventanas en fila, entrepisos, techo plano y puerta al frente (z1)
function hall(c, x0, z0, x1, z1, floors, fh, wall, o = {}) {
  const H = floors * fh;
  for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) {
    const edge = x === x0 || x === x1 || z === z0 || z === z1;
    c.set(x, 0, z, o.floor || K.planks);
    for (let y = 1; y <= H; y++) {
      const level = y % fh === 0;
      if (!edge) { c.set(x, y, z, level && y < H ? o.floor || K.planks : 0); continue; }
      const corner = (x === x0 || x === x1) && (z === z0 || z === z1);
      const win = !corner && y % fh >= 2 && y % fh <= (o.tall ? fh - 1 : 3) && ((x0 === x || x1 === x ? z : x) % (o.every || 3) === 0);
      const broken = o.broken && win && (x * 7 + y * 3 + z) % 5 === 0;
      c.set(x, y, z, broken ? 0 : win ? K.glass : level || corner ? o.trim || wall : wall);
    }
    c.set(x, H + 1, z, o.roof || K.concreto);
  }
  // escaleras entre pisos en una esquina de adentro
  for (let f = 0; f < floors - 1; f++) for (let i = 0; i < fh; i++) { c.set(x1 - 1 - i, f * fh + 1 + i, z0 + 1, o.floor || K.planks); c.set(x1 - 1 - i, (f + 1) * fh, z0 + 1, 0); }
  const mx = (x0 + x1) >> 1;
  c.door(mx, 1, z1, 0);
  return H;
}
function gable(c, x0, z0, x1, z1, y, id, wall) {
  const W = x1 - x0;
  for (let k = 0; k <= (W >> 1) + 1; k++) for (let z = z0 - 1; z <= z1 + 1; z++) {
    c.set(x0 - 1 + k, y + k, z, id); c.set(x1 + 1 - k, y + k, z, id);
    if (k >= 1 && (z === z0 || z === z1)) for (let yy = y; yy < y + k; yy++) { c.set(x0 - 1 + k, yy, z, wall); c.set(x1 + 1 - k, yy, z, wall); }
  }
}
const FLAG = [K.paint_blue, K.plaster, K.repello_rojo, K.repello_rojo, K.plaster, K.paint_blue];

// ---------- Sanatorio Durán ----------
export function buildSanatorio(c) {
  c.foundation(-28, -22, 28, 12, K.cobble, K.grass, 26);
  // cuerpo principal de tres pisos y dos alas hacia atrás, abandonado
  hall(c, -24, -4, 24, 8, 3, 5, K.plaster, { broken: true, trim: K.mossy, roof: K.smooth_stone, floor: K.planks });
  for (const x0 of [-24, 14]) hall(c, x0, -20, x0 + 10, -5, 3, 5, K.plaster, { broken: true, trim: K.mossy, roof: K.smooth_stone });
  // techo caído en partes, manchas de humedad, bejucos y telarañas
  for (let x = -24; x <= 24; x++) for (let z = -4; z <= 8; z++) if ((x * 13 + z * 7) % 9 === 0) { c.set(x, 16, z, 0); if (z > -4 && z < 8 && x > -24 && x < 24) c.set(x, 11, z, c.rnd() < 0.5 ? 0 : K.cobble); }
  for (let k = 0; k < 60; k++) { const x = Math.floor(c.rnd() * 48) - 24, y = 1 + Math.floor(c.rnd() * 14), z = c.rnd() < 0.5 ? 9 : -5; c.set(x, y, z, k % 3 ? K.vine : K.mossy); }
  for (let k = 0; k < 30; k++) c.set(Math.floor(c.rnd() * 44) - 22, 1 + Math.floor(c.rnd() * 3) * 5 + 3, Math.floor(c.rnd() * 10) - 3, K.cobweb);
  // corredor largo con camas viejas y una capilla
  for (let x = -20; x <= 20; x += 4) { c.be(x, 1, 6, K.bed, { type: 'bed', facing: 2 }); c.be(x, 6, 6, K.bed, { type: 'bed', facing: 2 }); }
  c.fill(-22, 1, -18, -16, 1, -18, K.planks); c.set(-19, 2, -18, K.oro_volcanico); c.set(-19, 3, -18, K.farol);
  c.chest(20, 11, -18, 0, c.loot([[360, 8, 24], [281, 1, 3], [279, 1, 3], [373, 1, 1], [283, 1, 2]], 5));
  c.chest(-20, 6, -10, 0, c.loot([[287, 2, 6], [263, 1, 4], [369, 1, 2], [374, 1, 3]], 4));
  // portón y jardín seco
  for (let x = -26; x <= 26; x++) { c.set(x, 1, 11, x % 4 === 0 ? K.cobble : K.verja); }
  for (let x = -1; x <= 1; x++) c.set(x, 1, 11, 0);
  c.placa(2, 1, 10, 0, 'Sanatorio Durán', 'En las faldas del Irazú, en Cartago: se construyó en 1918 para curar la tuberculosis con aire puro de montaña. Lleva décadas abandonado y dicen que de noche se oyen pasos en los corredores…');
  c.zone(0, 2, 0, 'sanatorio', 30);
  c.npc(-4, 1, 13, { role: 'guia', name: 'Don Ezequiel (guía de tours de miedo)' });
}

// ---------- Edificio Metálico ----------
export function buildMetalico(c) {
  c.foundation(-16, -12, 16, 10, K.cobble, K.acera, 22);
  hall(c, -14, -8, 14, 6, 2, 5, K.lamina_metal, { trim: K.metal_rojo, tall: true, every: 2, roof: K.lamina_metal });
  // frontón central y pilastras
  for (let k = 0; k < 5; k++) c.fill(-5 + k, 11 + k, 6, 5 - k, 11 + k, 6, K.metal_rojo);
  for (const x of [-14, -7, 7, 14]) c.fill(x, 1, 7, x, 10, 7, K.metal_rojo);
  for (let z = -6; z <= 4; z += 2) for (let x = -12; x <= 12; x += 3) if (x) c.stair(K.escalera_tablas, x, 1, z, 2);
  c.fill(-12, 2, -7, 12, 3, -7, K.basalt);
  c.placa(3, 1, 8, 0, 'Edificio Metálico', 'En San José, frente al parque Morazán: un edificio de hierro hecho en Bélgica, traído en piezas en barco y armado a finales del siglo XIX. Hoy sigue siendo escuela.');
  c.npc(0, 1, 2, { role: 'maestra', name: 'Niña Ana Lía (maestra)' });
}

// ---------- Correos y Telégrafos ----------
export function buildCorreos(c) {
  c.foundation(-14, -12, 14, 10, K.cobble, K.acera, 26);
  hall(c, -12, -10, 12, 6, 3, 5, K.smooth_stone, { trim: K.paint_green, tall: true, roof: K.smooth_stone, floor: K.smooth_stone });
  for (const x of [-9, -5, 5, 9]) c.fill(x, 1, 7, x, 14, 7, K.calcite);
  for (let x = -12; x <= 12; x++) { c.set(x, 16, 6, x % 2 ? K.paint_green : K.smooth_stone); }
  for (const x of [-12, 12]) for (let y = 16; y <= 20; y++) c.circle(1.6, (dx, dz) => c.set(x + dx, y, 6 + dz, y === 20 ? K.oro_volcanico : K.paint_green));
  for (let y = 1; y <= 4; y++) for (let x = -1; x <= 1; x++) c.set(x, y, 6, Math.abs(x) === 1 && y === 4 ? K.smooth_stone : 0);
  c.fill(-8, 1, -2, 8, 1, -2, K.planks);
  for (let x = -8; x <= 8; x += 2) c.set(x, 2, -2, K.glass);
  c.placa(3, 1, 8, 0, 'Correos y Telégrafos', 'Edificio de 1917 en el centro de San José, de estilo ecléctico. Antes se mandaban cartas y telegramas; hoy también es museo filatélico.');
  c.npc(0, 1, -4, { role: 'funcionario', name: 'Don Hernán (ventanilla de Correos)' });
}

// ---------- Museo de los Niños (antigua Penitenciaría) ----------
export function buildMuseoNinos(c) {
  c.foundation(-18, -18, 18, 18, K.cobble, K.grass, 22);
  for (let z = -16; z <= 16; z++) for (let x = -16; x <= 16; x++) {
    const edge = Math.abs(x) >= 15 || Math.abs(z) >= 15;
    if (!edge) continue;
    for (let y = 1; y <= 8; y++) c.set(x, y, z, y === 4 && (x + z) % 3 === 0 ? K.glass : K.sandstone);
    if (Math.abs(x) === 16 || Math.abs(z) === 16) c.set(x, 9, z, (x + z) % 2 ? K.sandstone : 0);
  }
  for (let y = 1; y <= 4; y++) for (let x = -2; x <= 2; x++) for (const z of [15, 16]) c.set(x, y, z, Math.abs(x) === 2 && y === 4 ? K.sandstone : 0);
  // torres de castillo en las esquinas
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) for (let y = 1; y <= 13; y++) c.circle(2.6, (dx, dz, d) => { if (d > 1.6 || y === 13) c.set(sx * 16 + dx, y, sz * 16 + dz, y === 13 ? K.repello_rojo : y > 11 && (dx + dz) % 2 ? 0 : K.sandstone); });
  // patio con juegos: tobogán, columpios y un trencito
  for (let i = 0; i < 4; i++) c.stair(K.escalera_tablas, -6 + i, 1 + i, 0, 1);
  for (let i = 0; i < 5; i++) c.set(-1 + i, 4 - Math.min(3, i), 1, K.losa_lisa);
  c.fill(4, 1, -4, 4, 4, -4, K.log); c.fill(8, 1, -4, 8, 4, -4, K.log); c.fill(4, 5, -4, 8, 5, -4, K.log); c.set(6, 2, -4, K.losa_tablas);
  for (let x = -8; x <= -3; x++) { c.set(x, 1, -8, x === -8 ? K.repello_rojo : K.paint_blue); c.set(x, 2, -8, x === -8 ? K.basalt : 0); }
  for (let k = 0; k < 20; k++) c.set(Math.floor(c.rnd() * 24) - 12, 1, Math.floor(c.rnd() * 24) - 12, (k % 2) ? K.flower_red : K.flower_yellow);
  c.placa(3, 1, 17, 0, 'Museo de los Niños', 'Antes fue la Penitenciaría Central de San José, con forma de castillo. Hoy es un museo donde los güilas juegan y aprenden ciencia. De cárcel a juguetería: ¡qué cambio!');
  c.npc(-2, 1, 4, { role: 'vecino', name: 'Güila de excursión' });
  c.npc(6, 1, 6, { role: 'maestra', name: 'Niña Karla (excursión)' });
}

// ---------- iglesia metálica de Grecia ----------
export function buildGrecia(c) {
  c.foundation(-11, -32, 11, 10, K.cobble, K.grass, 34);
  const W = 7, D = 26;
  for (let z = -D; z <= 0; z++) for (let x = -W; x <= W; x++) {
    const edge = Math.abs(x) === W || z === -D || z === 0;
    c.set(x, 0, z, K.smooth_stone);
    for (let y = 1; y <= 10; y++) c.set(x, y, z, !edge ? 0 : Math.abs(x) === W && y >= 3 && y <= 8 && z % 4 === -2 ? K.glass : y === 10 || y === 1 ? K.plaster : K.metal_rojo);
  }
  gable(c, -W, -D, W, 0, 11, K.metal_rojo, K.metal_rojo);
  // torre central con aguja
  for (let y = 1; y <= 22; y++) for (let z = -1; z <= 2; z++) for (let x = -2; x <= 1; x++) {
    const edge = x === -2 || x === 1 || z === -1 || z === 2;
    const open = y >= 17 && y <= 19 && (x === -1 || x === 0 || z === 0 || z === 1);
    c.set(x, y, z, edge && !open ? (y % 5 === 0 ? K.plaster : K.metal_rojo) : 0);
  }
  for (let s = 0; s < 4; s++) c.fill(-2 + (s >> 1), 23 + s, -1 + (s >> 1), 1 - (s >> 1), 23 + s, 2 - (s >> 1), K.metal_rojo);
  c.fill(-1, 27, 0, -1, 29, 0, K.plaster); c.set(-1, 30, 0, K.oro_volcanico); c.set(-1, 18, 0, K.lamp);
  c.door(-1, 1, 2, 0); c.door(0, 1, 2, 0);
  for (let z = -22; z <= -4; z += 2) for (let x = -5; x <= 5; x++) if (Math.abs(x) > 1) c.stair(K.escalera_tablas, x, 1, z, 0);
  c.fill(-2, 1, -D + 1, 2, 2, -D + 2, K.calcite); c.set(0, 3, -D + 1, K.oro_volcanico);
  c.zone(-1, 18, 0, 'campana', 140);
  c.placa(3, 1, 3, 0, 'Iglesia de la Merced de Grecia', 'La famosa iglesia de láminas de metal rojo, traídas de Bélgica a principios del siglo XX. Dicen que se hizo de metal para que no se cayera con los terremotos.');
  c.npc(4, 1, 5, { role: 'beata', name: 'Doña Celina (Grecia)' });
}

// ---------- iglesia de Coronado (neogótica) ----------
export function buildCoronado(c) {
  c.foundation(-12, -36, 12, 10, K.cobble, K.grass, 44);
  const W = 8, D = 30;
  for (let z = -D; z <= 0; z++) for (let x = -W; x <= W; x++) {
    const edge = Math.abs(x) === W || z === -D || z === 0;
    c.set(x, 0, z, K.smooth_stone);
    for (let y = 1; y <= 12; y++) {
      const ogiva = Math.abs(x) === W && z % 5 === -2 && y >= 3 && y <= 9;
      c.set(x, y, z, !edge ? 0 : ogiva ? K.glass : (z % 5 === 0 && Math.abs(x) === W) ? K.smooth_stone : K.concreto);
    }
    if (Math.abs(x) === W && z % 5 === 0) for (let y = 1; y <= 8; y++) c.set(x + Math.sign(x), y, z, K.concreto);
  }
  // techo muy empinado
  for (let k = 0; k <= W + 1; k++) for (let z = -D - 1; z <= 1; z++) for (let s = 0; s < 2; s++) { c.set(-W - 1 + k, 13 + k * 1 + s, z, K.basalt); c.set(W + 1 - k, 13 + k * 1 + s, z, K.basalt); }
  // torre central con aguja gótica muy alta
  for (let y = 1; y <= 26; y++) for (let z = -1; z <= 3; z++) for (let x = -2; x <= 2; x++) {
    const edge = Math.abs(x) === 2 || z === -1 || z === 3;
    const open = (y >= 3 && y <= 6 && x === 0 && z === 3) || (y >= 20 && y <= 23 && (Math.abs(x) <= 1 && (z === -1 || z === 3) || (z >= 0 && z <= 2 && Math.abs(x) === 2)));
    c.set(x, y, z, edge && !open ? (y % 6 === 0 ? K.smooth_stone : K.concreto) : 0);
  }
  for (let s = 0; s < 10; s++) { const r = 2.6 - s * 0.26; c.circle(r, (dx, dz) => c.set(dx, 27 + s, 1 + dz, K.concreto)); }
  c.fill(0, 37, 1, 0, 39, 1, K.calcite); c.set(-1, 38, 1, K.calcite); c.set(1, 38, 1, K.calcite);
  c.set(0, 21, 1, K.lamp);
  for (let y = 9; y <= 13; y++) for (let dx = -2; dx <= 2; dx++) if (Math.hypot(dx, y - 11) <= 1.8) c.set(dx, y, 3, K.glass);
  c.door(0, 1, 3, 0);
  for (let z = -26; z <= -4; z += 2) for (let x = -6; x <= 6; x++) if (Math.abs(x) > 1) c.stair(K.escalera_tablas, x, 1, z, 0);
  c.fill(-2, 1, -D + 1, 2, 2, -D + 2, K.calcite); c.set(0, 3, -D + 1, K.oro_volcanico);
  c.zone(0, 21, 1, 'campana', 160);
  c.placa(3, 1, 4, 0, 'Iglesia de San Isidro de Coronado', 'Iglesia de estilo neogótico, de concreto gris, con su torre en punta que se ve desde lejos entre las montañas de Coronado.');
  c.npc(4, 1, 6, { role: 'beata', name: 'Doña Odilie (Coronado)' });
}

// ---------- ruinas de Ujarrás ----------
export function buildUjarras(c) {
  c.foundation(-12, -28, 12, 10, K.dirt, K.grass, 20);
  const W = 5, D = 22;
  for (let z = -D; z <= -1; z++) for (const x of [-W, W]) {
    const top = 5 + Math.floor(c.rnd() * 4) - (z % 7 === 0 ? 3 : 0);
    for (let y = 1; y <= top; y++) if (!(y >= 3 && y <= 5 && z % 5 === -3)) c.set(x, y, z, c.rnd() < 0.35 ? K.mossy : K.cobble);
    if (c.rnd() < 0.3) for (let y = 2; y < top; y++) c.set(x - Math.sign(x), y, z, K.vine);
  }
  for (let x = -W; x <= W; x++) for (let y = 1; y <= 4 + Math.floor(c.rnd() * 3); y++) c.set(x, y, -D, K.mossy);
  for (let x = -W - 1; x <= W + 1; x++) for (let y = 1; y <= 13 - Math.abs(x); y++) if (!(Math.abs(x) <= 1 && y <= 5) && !(x === 0 && y === 6) && Math.hypot(x, y - 9) > 1) c.set(x, y, 0, c.rnd() < 0.3 ? K.mossy : K.cobble);
  for (const [x, z] of [[-2, -6], [2, -14], [0, -19]]) { c.fill(x, 1, z, x, 5, z, K.log); c.circle(2.4, (dx, dz) => { c.set(x + dx, 6, z + dz, K.leaves); c.set(x + dx, 7, z + dz, dx === 0 || dz === 0 ? K.leaves : 0); }); }
  for (let k = 0; k < 18; k++) c.set(Math.floor(c.rnd() * 8) - 4, 1, -1 - Math.floor(c.rnd() * 20), k % 3 ? K.helecho : K.flower_red);
  for (const [x, z] of [[-9, 4], [8, 6], [-7, -24], [9, -20]]) { c.fill(x, 1, z, x, 4, z, K.log); c.circle(2, (dx, dz) => c.set(x + dx, 5, z + dz, K.leaves)); }
  c.placa(2, 1, 2, 0, 'Ruinas de Ujarrás', 'En el valle de Ujarrás, Paraíso de Cartago: la iglesia colonial que se abandonó tras las inundaciones del río. Cada año se hace la romería a la Virgen de Ujarrás.');
  c.npc(-3, 1, 4, { role: 'peregrino', name: 'Romero de Ujarrás' });
}

// ---------- Casona de Santa Rosa ----------
export function buildSantaRosa(c) {
  c.foundation(-20, -22, 20, 16, K.dirt, K.grass, 18);
  // casona de adobe con corredores de madera y techo de teja
  for (let z = -12; z <= 4; z++) for (let x = -12; x <= 12; x++) {
    const inner = Math.abs(x) <= 10 && z >= -10 && z <= 2;
    const edge = inner && (Math.abs(x) === 10 || z === -10 || z === 2);
    c.set(x, 0, z, inner ? K.planks : K.cobble);
    if (!inner && (Math.abs(x) === 12 || z === -12 || z === 4) && (x + z) % 4 === 0) c.fill(x, 1, z, x, 4, z, K.log);
    for (let y = 1; y <= 4; y++) if (edge) c.set(x, y, z, y === 2 && (x + z) % 3 === 0 ? K.glass : K.adobe);
  }
  gable(c, -12, -12, 12, 4, 5, K.teja, K.adobe);
  for (const [x, z] of [[0, 2], [-6, 2], [6, 2]]) c.door(x, 1, z, 0);
  for (let x = -8; x <= -4; x++) c.set(x, 1, -8, K.planks);
  c.be(6, 1, -8, K.bed, { type: 'bed', facing: 0 }); c.set(-6, 3, -4, K.lamp); c.set(6, 3, -4, K.lamp);
  // corrales de piedra y bebedero
  for (let i = -18; i <= 18; i++) { c.set(i, 1, -20, K.cobble); c.set(-18, 1, i > 14 ? 14 : i, K.cobble); }
  for (let z = -18; z <= -14; z++) for (let x = 12; x <= 16; x++) if (z === -18 || x === 16) c.set(x, 1, z, K.cerca);
  c.fill(13, 1, -15, 15, 1, -15, K.water);
  c.fill(-16, 1, 8, -16, 6, 8, K.cerca);
  FLAG.forEach((id, i) => c.fill(-15, 6 - i, 8, -11, 6 - i, 8, id));
  c.placa(2, 1, 6, 0, 'Casona de Santa Rosa', 'En Guanacaste, en el Parque Nacional Santa Rosa: aquí, el 20 de marzo de 1856, el ejército costarricense venció a los filibusteros en apenas catorce minutos. Hoy es museo entre el bosque seco.');
  c.npc(-4, 1, 8, { role: 'guardaparques', name: 'Guardaparques de Santa Rosa' });
  c.npc(14, 1, -10, { mob: 'vaca', name: 'vaca de la hacienda' });
}

// ---------- esferas de piedra del Diquís ----------
export function buildEsferas(c) {
  c.foundation(-14, -14, 14, 14, K.dirt, K.grass, 14);
  const S = [[0, 0, 2.6], [-8, 5, 1.8], [7, -6, 2.1], [-5, -8, 1.4], [9, 7, 1.6], [3, 9, 1.2]];
  for (const [x, z, r] of S) {
    const R = Math.ceil(r);
    for (let dy = -R; dy <= R; dy++) for (let dz = -R; dz <= R; dz++) for (let dx = -R; dx <= R; dx++) if (Math.hypot(dx, dy, dz) <= r) c.set(x + dx, Math.round(r) + dy, z + dz, (dx + dy + dz) % 4 === 0 ? K.calcite : K.smooth_stone);
  }
  for (let k = 0; k < 24; k++) c.set(Math.floor(c.rnd() * 26) - 13, 1, Math.floor(c.rnd() * 26) - 13, k % 2 ? K.tall_grass : K.helecho);
  for (const [x, z] of [[-12, -12], [12, 12], [-12, 11]]) { c.fill(x, 1, z, x, 6, z, K.jungle_log); c.circle(2.5, (dx, dz) => c.set(x + dx, 7, z + dz, K.jungle_leaves)); }
  c.placa(4, 1, -3, 2, 'Esferas de piedra del Diquís', 'Esferas casi perfectas talladas en piedra por los pueblos indígenas del sur de Costa Rica hace más de mil años. Son Patrimonio de la Humanidad: se miran, se respetan y no se mueven.');
  c.npc(-3, 1, 4, { role: 'guardaparques', name: 'Guía de Finca 6' });
}

// ---------- Antigua Aduana ----------
export function buildAduana(c) {
  c.foundation(-22, -10, 22, 8, K.cobble, K.acera, 20);
  for (let z = -8; z <= 4; z++) for (let x = -20; x <= 20; x++) {
    const edge = Math.abs(x) === 20 || z === -8 || z === 4;
    c.set(x, 0, z, K.smooth_stone);
    for (let y = 1; y <= 9; y++) {
      const arch = (Math.abs(x) === 20 ? false : z === 4 || z === -8) && x % 4 === 0 && y >= 2 && y <= 6;
      c.set(x, y, z, !edge ? 0 : arch ? K.glass : y === 9 ? K.smooth_stone : K.bricks);
    }
  }
  gable(c, -20, -8, 20, 4, 10, K.zinc, K.bricks);
  for (let x = -1; x <= 1; x++) for (let y = 1; y <= 4; y++) c.set(x, y, 4, 0);
  for (let x = -16; x <= 16; x += 6) for (let z = -6; z <= 2; z += 4) c.fill(x, 1, z, x + 1, 1, z, K.planks);
  c.set(0, 7, -2, K.lamp); c.set(-12, 7, -2, K.lamp); c.set(12, 7, -2, K.lamp);
  c.placa(3, 1, 5, 0, 'Antigua Aduana', 'Enorme bodega de ladrillo de 1891 en barrio La California. Aquí se revisaba lo que entraba por el tren; hoy es centro cultural con ferias, conciertos y teatro.');
  c.npc(-4, 1, 0, { role: 'mercader', name: 'Artesana de la feria' });
}
