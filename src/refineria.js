// «La refinería que no refina» (generador v6): planta ficticia y satírica en la costa con tanques de combustible,
// tuberías, muelle con buque tanquero, estación de cisternas, edificio administrativo, laboratorio… y la vieja unidad
// de refinación oxidada y fuera de servicio. Exageración artística del juego, no un retrato de ninguna empresa real.
// +z local mira al mar. Sin gráficos.
import { BLOCK_BY_KEY as K } from './blocks.js';

function tank(c, x, z, r, h, label, empty) {
  c.circle(r + 0.4, (dx, dz, d) => {
    c.set(x + dx, 0, z + dz, K.concreto);
    for (let y = 1; y <= h; y++) c.set(x + dx, y, z + dz, d > r - 0.6 ? (y % 4 === 0 ? K.lamina_metal : K.plaster) : 0);
    c.set(x + dx, h + 1, z + dz, d > r - 2 ? K.lamina_metal : K.plaster);
  });
  // escalera de caracol por fuera, hasta el techo
  for (let y = 1; y <= h; y++) {
    const a = y * 0.16, sx = Math.round(x + Math.cos(a) * (r + 1.2)), sz = Math.round(z + Math.sin(a) * (r + 1.2));
    c.set(sx, y, sz, K.smooth_stone);
  }
  c.placa(x, 2, z + Math.round(r) + 1, 0, `Tanque ${label}`, empty ? 'Capacidad: 50 000 barriles. Contenido: aire acondicionado natural desde 2011.' : `Almacenamiento de ${label.toLowerCase()}. El combustible llega listo en barco: aquí solo se guarda y se reparte.`);
}

function pipeX(c, x0, x1, y, z) { for (let x = x0; x <= x1; x++) c.set(x, y, z, K.tuberia_x); }
function pipeZ(c, x, y, z0, z1) { for (let z = z0; z <= z1; z++) c.set(x, y, z, K.tuberia); }

export function buildRefineria(c) {
  c.foundation(-46, -46, 46, 8, K.cobble, K.concreto, 34);
  // malla perimetral con portón y torre de vigilancia
  for (let i = -46; i <= 46; i++) for (const [x, z] of [[i, -46], [-46, i > 8 ? 8 : i], [46, i > 8 ? 8 : i]]) { c.set(x, 1, z, K.verja); c.set(x, 2, z, K.verja); }
  for (let x = -3; x <= 3; x++) { c.set(x, 1, -46, x === 0 ? K.barrera : 0); c.set(x, 2, -46, 0); }
  c.set(-1, 2, -46, K.barrera); c.set(1, 2, -46, K.barrera);
  c.fill(-6, 1, -45, -6, 7, -45, K.andamio); c.fill(-7, 8, -46, -5, 8, -44, K.planks); c.fill(-7, 10, -46, -5, 10, -44, K.zinc); c.set(-6, 9, -45, K.lamp);
  c.placa(3, 2, -47, 2, 'RECOPA · Refinadora Costarricense… de Palabra', 'Planta ficticia de NanoBlocks. Refinería de nombre, distribución de profesión. «La refinería no refina, pero el portón funciona».');
  // tanques de almacenamiento
  const T = [[-32, -30, 'Súper', false], [-16, -30, 'Regular', false], [0, -30, 'Diésel', false], [16, -30, 'Búnker', false], [-32, -14, 'Jet', false], [-16, -14, 'Vacío', true]];
  for (const [x, z, label, empty] of T) tank(c, x, z, 5.5, 10, label, empty);
  // tuberías: rack que va de los tanques al muelle
  for (const y of [2, 3]) { pipeX(c, -40, 30, y, -21); pipeX(c, -40, 30, y + 2, -22); }
  for (let x = -38; x <= 28; x += 6) c.fill(x, 1, -21, x, 1, -22, K.lamina_metal);
  for (const x of [24, 25]) pipeZ(c, x, 2, -21, 30);
  // vieja unidad de refinación: torres oxidadas, chimenea apagada, pasarelas rotas
  for (const [x, z, h] of [[26, -36, 20], [32, -34, 16], [38, -38, 24], [32, -42, 12]]) {
    c.circle(1.6, (dx, dz) => { for (let y = 1; y <= h; y++) if ((y * 7 + dx * 3 + dz) % 11 !== 0) c.set(x + dx, y, z + dz, y % 5 === 0 ? K.lamina_metal : K.oxido); });
    for (let y = 4; y < h; y += 6) for (const [dx, dz] of [[2, 0], [-2, 0], [0, 2], [0, -2], [2, 1], [-2, -1]]) if ((x + y + dx) % 4) c.set(x + dx, y, z + dz, K.andamio);
    c.set(x, h + 1, z, K.varilla);
  }
  for (let y = 1; y <= 30; y++) c.circle(1.5, (dx, dz, d) => c.set(40 + dx, y, -26 + dz, d > 0.8 ? (y > 26 ? K.basalt : K.bricks) : 0));
  for (let x = 26; x <= 38; x++) if (x % 5 !== 2) c.set(x, 10, -36 + Math.round((x - 26) / 6), K.andamio);
  for (const [x, z] of [[28, -30], [35, -39], [30, -40]]) for (let y = 1; y <= 2; y++) c.set(x, y, z, K.cobweb);
  for (let k = 0; k < 6; k++) c.set(26 + k * 2, 1 + (k % 2), -28 - k, K.oxido);
  c.placa(30, 2, -28, 0, 'Unidad de refinación (fuera de servicio)', '«La refinadora está en mantenimiento desde antes de que yo llegara». Aquí se refinan presupuestos, estudios de factibilidad y nostalgia.');
  // edificio administrativo de dos pisos con bandera
  for (let z = -10; z <= 0; z++) for (let x = 2; x <= 18; x++) {
    const edge = x === 2 || x === 18 || z === -10 || z === 0;
    for (let y = 1; y <= 9; y++) c.set(x, y, z, y === 5 || y === 9 ? K.concreto : edge ? (y % 4 === 2 || y % 4 === 3 ? K.glass : K.concreto) : 0);
  }
  c.door(10, 1, 0, 0); c.set(10, 3, 0, K.concreto);
  for (let i = 0; i < 4; i++) c.set(16 - i, 1 + i, -8, K.planks);
  for (let i = 0; i < 4; i++) c.set(16 - i, 5, -8, 0);
  c.fill(4, 1, -8, 8, 1, -8, K.planks); c.fill(4, 6, -8, 8, 6, -8, K.bookshelf);
  c.set(6, 4, -5, K.lamp); c.set(12, 8, -5, K.lamp);
  c.fill(3, 10, -1, 3, 16, -1, K.cerca);
  [K.paint_blue, K.plaster, K.repello_rojo, K.repello_rojo, K.plaster, K.paint_blue].forEach((id, i) => c.fill(4, 16 - i, -1, 8, 16 - i, -1, id));
  c.chest(16, 6, -2, 0, c.loot([[360, 10, 30], [390, 2, 5], [257, 8, 16], [258, 2, 6]], 5));
  c.placa(12, 2, 1, 0, 'Edificio administrativo', 'Gerencia de Estudios para la Futura Refinación (fundada hace 40 años). Horario de atención: cuando haya sistema.');
  // laboratorio
  for (let z = -10; z <= -4; z++) for (let x = -14; x <= -6; x++) {
    const edge = x === -14 || x === -6 || z === -10 || z === -4;
    for (let y = 1; y <= 4; y++) c.set(x, y, z, edge ? (y === 2 ? K.glass : K.plaster) : 0);
    c.set(x, 5, z, K.concreto);
  }
  c.door(-10, 1, -4, 0); c.fill(-13, 1, -9, -7, 1, -9, K.calcite); c.set(-12, 2, -9, K.glass); c.set(-9, 2, -9, K.glass); c.set(-10, 4, -7, K.lamp);
  c.placa(-12, 2, -3, 0, 'Laboratorio de calidad', 'Aquí se revisa que el combustible que llega del barco sea el mismo que sale en la cisterna. Spoiler: sí.');
  // estación de carga de cisternas
  for (let z = -4; z <= 6; z++) for (let x = -44; x <= -22; x++) c.set(x, 7, z, K.lamina_metal);
  for (const [x, z] of [[-44, -4], [-22, -4], [-44, 6], [-22, 6]]) c.fill(x, 1, z, x, 6, z, K.concreto);
  for (const z0 of [-2, 3]) {
    for (let x = -40; x <= -32; x++) for (const z of [z0, z0 + 1]) { c.set(x, 1, z, x === -40 || x === -34 ? K.basalt : K.lamina_metal); c.set(x, 2, z, x <= -36 ? K.plaster : K.lamina_metal); c.set(x, 3, z, x <= -36 ? K.plaster : 0); }
    for (const z of [z0, z0 + 1]) { c.set(-31, 1, z, K.basalt); c.set(-31, 2, z, K.repello_rojo); c.set(-30, 1, z, K.repello_rojo); c.set(-30, 2, z, K.glass); c.set(-31, 3, z, K.repello_rojo); }
    pipeZ(c, -36, 5, z0 - 1, z0 + 2);
  }
  c.placa(-23, 2, 7, 0, 'Carga de cisternas', 'De aquí sale el combustible en camiones cisterna hacia las bombas de todo el país. Lleve un bidón a la bomba del pueblo y le pagan.');
  // muelle con buque tanquero
  for (let z = 8; z <= 44; z++) for (let x = 22; x <= 27; x++) {
    c.set(x, 0, z, K.concreto);
    if (z % 6 === 0 && (x === 22 || x === 27)) for (let y = c.ground(x, z); y < 0; y++) c.set(x, y, z, K.concreto);
  }
  for (const x of [24, 25]) pipeZ(c, x, 1, 8, 40);
  for (let z = 16; z <= 52; z++) for (let x = 30; x <= 38; x++) {
    const w = z < 20 ? z - 16 : z > 48 ? 52 - z : 4;
    if (Math.abs(x - 34) > w) continue;
    const edge = Math.abs(x - 34) === w || z === 16 || z === 52;
    c.set(x, -1, z, K.repello_rojo); c.set(x, 0, z, edge ? K.basalt : K.lamina_metal); c.set(x, 1, z, edge ? K.basalt : 0);
  }
  for (let z = 44; z <= 49; z++) for (let x = 31; x <= 37; x++) for (let y = 1; y <= 6; y++) c.set(x, y, z, y % 2 === 0 && (x === 31 || x === 37 || z === 44) ? K.glass : K.plaster);
  c.fill(34, 7, 47, 34, 10, 47, K.basalt);
  c.placa(23, 1, 9, 0, 'Muelle petrolero', 'El buque trae el combustible ya refinado desde afuera. Se bombea a los tanques por esta tubería. Y listo: «el combustible viene listo, mae».');
  // estación de bombeo
  for (let z = -2; z <= 4; z++) for (let x = 28; x <= 34; x++) for (let y = 1; y <= 4; y++) c.set(x, y, z, (x === 28 || x === 34 || z === -2 || z === 4) ? (y === 4 ? K.zinc : K.bloque_concreto) : y === 4 ? K.zinc : y === 1 && (x + z) % 2 ? K.maquina : 0);
  c.door(31, 1, 4, 0);
  c.zone(0, 1, 0, 'refineria', 46);
  c.npc(0, 1, -40, { role: 'guarda_planta', name: 'Don Ulises (guarda del portón)' });
  c.npc(10, 1, -4, { role: 'funcionario', name: 'Lic. Barquero (gerencia)' });
  c.npc(-30, 1, 1, { role: 'operador', name: 'Don Minor (operador)' });
  c.npc(26, 1, 20, { role: 'operador', name: 'Mae Josué (muelle)' });
  c.npc(30, 1, -31, { role: 'ingeniero', name: 'Ing. Solano (estudio de factibilidad #12)' });
}
