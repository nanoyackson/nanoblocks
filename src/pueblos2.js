// Más vida de pueblo (generador v6): feria del agricultor de los sábados, cementerio tico con sus bóvedas blancas
// y el muelle de Limón con su edificio de madera caribeño, contenedores y el barco bananero. Sin gráficos.
import { BLOCK_BY_KEY as K } from './blocks.js';
import { villageAt } from './pueblogen.js';

// v9: la feria (al sur) y el cementerio (al norte) de cada pueblo de cuadras, pegaditos a las afueras
function besideVillage(gen, gx, gz, kind, dz) {
  const v = villageAt(gen, gx, gz);
  if (!v || !v.streets || !v.L) return null;
  const x = v.x, z = v.z + dz(v.L);
  const h = gen.column(x, z).h;
  if (h < SEA + 1 || Math.abs(h - v.y) > 8) return null;
  return { x, z, y: h, rot: 0, id: `${kind}@${x},${z}`, type: kind, village: v.id };
}
export const placeFeriaPueblo = (gen, gx, gz) => besideVillage(gen, gx, gz, 'feria_pueblo', (L) => L + 17);
export const placeCementerioPueblo = (gen, gx, gz) => besideVillage(gen, gx, gz, 'cementerio_pueblo', (L) => -(L + 21));

const SEA = 62;

// ---------- Feria del agricultor ----------
export function buildFeria(c) {
  c.foundation(-18, -12, 18, 12, K.cobble, K.asfalto, 12);
  // toldos de colores en dos filas, con mesas llenas de lo que se cosecha
  const COLS = [K.paint_blue, K.repello_rojo, K.paint_green, K.paint_yellow, K.plaster, K.paint_pink];
  const goods = [K.banana_bunch, K.cafe3, K.flower_red, K.cane, K.flower_yellow, K.tall_grass];
  let k = 0;
  for (const z0 of [-9, 4]) for (let x0 = -16; x0 <= 10; x0 += 7) {
    const col = COLS[k % COLS.length];
    for (const [x, z] of [[x0, z0], [x0 + 5, z0], [x0, z0 + 4], [x0 + 5, z0 + 4]]) c.fill(x, 1, z, x, 3, z, K.poste);
    for (let x = x0 - 1; x <= x0 + 6; x++) for (let z = z0 - 1; z <= z0 + 5; z++) c.set(x, 4, z, (x + z) % 2 ? col : K.plaster);
    const front = z0 < 0 ? z0 + 4 : z0;
    for (let x = x0 + 1; x <= x0 + 4; x++) { c.set(x, 1, front, K.planks); if ((x + k) % 2) c.set(x, 2, front, goods[(k + x) % goods.length]); }
    k++;
  }
  c.placa(0, 1, 0, 0, 'Feria del agricultor', 'Los sábados en la mañana: frutas, verduras, queso tierno, tamales y café, directo del productor. ¡Lleve bolsa y regatee con cariño!');
  c.npc(-14, 1, -6, { role: 'feriante', name: 'Don Ovidio (verduras)' });
  c.npc(-7, 1, -6, { role: 'frutero', name: 'Doña Teresa (frutas)' });
  c.npc(0, 1, 5, { role: 'tamalera', name: 'Doña Chela (tamales y queso)' });
  c.npc(7, 1, 5, { role: 'caficultor', name: 'Don Rubén (café de altura)' });
  c.npc(3, 1, -1, { role: 'vecino', name: 'Señora con bolsa de manta' });
}

// ---------- Cementerio de pueblo ----------
export function buildCementerio(c) {
  c.foundation(-14, -16, 14, 16, K.dirt, K.grass, 10);
  // tapia blanca con portón de hierro
  for (let i = -14; i <= 14; i++) for (const [x, z] of [[i, -16], [i, 16], [-14, i], [14, i]]) for (let y = 1; y <= 2; y++) c.set(x, y, z, K.plaster);
  for (let x = -1; x <= 1; x++) { c.set(x, 1, 16, K.verja); c.set(x, 2, 16, K.verja); }
  for (let z = -15; z <= 15; z++) for (let x = -1; x <= 1; x++) c.set(x, 0, z, K.gravel);
  // bóvedas blancas en filas, con cruces y flores
  for (let z = -12; z <= 12; z += 5) for (const sx of [-1, 1]) for (let x0 = 3; x0 <= 11; x0 += 4) {
    const x = sx * x0;
    c.fill(x - 1, 1, z, x + 1, 1, z + 2, K.plaster);
    if ((x0 + z) % 3 === 0) c.fill(x - 1, 2, z, x + 1, 2, z + 2, K.smooth_stone);
    c.fill(x, 2 + ((x0 + z) % 3 === 0 ? 1 : 0), z, x, 3 + ((x0 + z) % 3 === 0 ? 1 : 0), z, K.plaster);
    c.set(x - 1, 3 + ((x0 + z) % 3 === 0 ? 1 : 0), z, K.plaster); c.set(x + 1, 3 + ((x0 + z) % 3 === 0 ? 1 : 0), z, K.plaster);
    c.set(x, 2 + ((x0 + z) % 3 === 0 ? 1 : 0), z + 2, (x + z) % 2 ? K.flower_red : K.flower_yellow);
  }
  // capilla al fondo y un árbol viejo
  c.fill(-3, 1, -15, 3, 5, -12, K.plaster); c.fill(-2, 1, -14, 2, 4, -13, 0);
  c.fill(-3, 6, -15, 3, 6, -12, K.teja); c.fill(0, 7, -15, 0, 9, -15, K.plaster); c.set(-1, 8, -15, K.plaster); c.set(1, 8, -15, K.plaster);
  c.set(0, 1, -12, 0); c.set(0, 2, -12, 0); c.set(0, 2, -14, K.farol);
  c.fill(10, 1, -12, 10, 6, -12, K.log); c.circle(3, (dx, dz) => c.set(10 + dx, 7, -12 + dz, K.leaves));
  c.placa(3, 1, 15, 0, 'Cementerio', 'El 2 de noviembre, Día de los Difuntos, las familias vienen a pintar las bóvedas de blanco y a traer flores. De noche… mejor no venir. Dicen que por aquí llora una mujer. (Easter egg)');
  c.zone(0, 1, 0, 'cementerio', 18);
}

// ---------- Muelle de Limón ----------
export function buildMuelleLimon(c) {
  const top = SEA - c.oy;
  c.foundation(-20, -24, 20, -2, K.cobble, K.concreto, 16);
  // muelle de concreto que entra al mar
  for (let z = -2; z <= 26; z++) for (let x = -5; x <= 5; x++) {
    c.set(x, top + 1, z, K.concreto);
    if (z % 6 === 0 && Math.abs(x) === 5) for (let y = c.ground(x, z); y <= top; y++) c.set(x, y, z, K.concreto);
  }
  for (let z = 0; z <= 26; z++) for (const x of [-5, 5]) c.set(x, top + 2, z, z % 3 ? 0 : K.cerca);
  // barco bananero atracado
  for (let z = 6; z <= 30; z++) for (let x = 8; x <= 16; x++) {
    const w = z < 10 ? z - 6 : z > 26 ? 30 - z : 4;
    if (Math.abs(x - 12) > w) continue;
    const edge = Math.abs(x - 12) === w || z === 6 || z === 30;
    c.set(x, top, z, K.paint_blue); c.set(x, top + 1, z, edge ? K.plaster : K.planks);
    if (edge) c.set(x, top + 2, z, K.plaster);
  }
  for (let z = 22; z <= 27; z++) for (let x = 10; x <= 14; x++) for (let y = top + 2; y <= top + 6; y++) c.set(x, y, z, y % 2 && (x === 10 || x === 14 || z === 22) ? K.glass : K.plaster);
  // contenedores de colores apilados
  const CC = [K.repello_rojo, K.paint_blue, K.paint_green, K.paint_yellow];
  for (let i = 0; i < 6; i++) for (let s = 0; s < 1 + (i % 3); s++) c.fill(-18 + i * 3, 1 + s * 2, -8, -17 + i * 3, 2 + s * 2, -4, CC[(i + s) % 4]);
  // edificio de madera caribeño de dos pisos con balcón
  for (let z = -22; z <= -14; z++) for (let x = -2; x <= 12; x++) {
    const edge = x === -2 || x === 12 || z === -22 || z === -14;
    for (let y = 1; y <= 8; y++) c.set(x, y, z, !edge ? (y === 4 ? K.planks : 0) : y === 4 || y === 8 ? K.paint_green : y % 4 === 2 && x % 2 ? K.glass : K.paint_yellow);
  }
  for (let x = -3; x <= 13; x++) { c.set(x, 4, -13, K.planks); c.set(x, 5, -12, K.cerca); }
  for (let x = -3; x <= 13; x++) for (let z = -23; z <= -12; z++) c.set(x, 9, z, K.repello_rojo);
  c.door(5, 1, -14, 0);
  c.placa(3, 1, -12, 0, 'Muelle de Limón', 'Puerto Limón, en el Caribe: por aquí entró el ferrocarril, salieron millones de racimos de banano y llegó la cultura afrocaribeña que le da sabor a Costa Rica: calipso, rice and beans y el carnaval de octubre.');
  c.placa(-2, top + 2, 20, 1, 'Easter egg del muelle', 'Cristóbal Colón llegó frente a Limón en 1502, a la isla Uvita. Si mira bien hacia el mar… no, ya se fue.');
  c.npc(2, top + 2, 12, { role: 'pescador', name: 'Mister Brown (estibador)' });
  c.npc(6, 1, -10, { role: 'vecino', name: 'Miss Lorraine (rice and beans)' });
}
