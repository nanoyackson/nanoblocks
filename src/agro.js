// Campo y naturaleza (generador v6): beneficio de café con patio de secado, trapiche de bueyes, hacienda ganadera
// con redondel de toros, bananera con cable vía y empacadora, catarata de La Fortuna con sus gradas y puente colgante
// sobre una cañada. El frente mira a +z local. Sin gráficos.
import { hash3 } from './noise.js';
import { BLOCK_BY_KEY as K } from './blocks.js';

const SEA = 62;

function shed(c, x0, z0, x1, z1, h, wall, roof = K.zinc, open = false) {
  for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) {
    const edge = x === x0 || x === x1 || z === z0 || z === z1;
    const post = (x === x0 || x === x1) && (z === z0 || z === z1 || (z - z0) % 4 === 0);
    c.set(x, 0, z, K.planks);
    for (let y = 1; y <= h; y++) c.set(x, y, z, open ? (post ? K.log : 0) : edge ? (post ? K.log : y === 2 && (x + z) % 3 === 0 ? K.glass : wall) : 0);
  }
  const W = x1 - x0;
  for (let k = 0; k <= (W >> 1) + 1; k++) for (let z = z0 - 1; z <= z1 + 1; z++) { c.set(x0 - 1 + k, h + 1 + (k >> 1), z, roof); c.set(x1 + 1 - k, h + 1 + (k >> 1), z, roof); }
}

// ---------- beneficio de café ----------
export function buildBeneficio(c) {
  c.foundation(-30, -26, 30, 20, K.cobble, K.grass, 22);
  shed(c, -20, -20, 4, -6, 7, K.paint_green);
  c.door(-8, 1, -6, 0);
  for (let y = 1; y <= 16; y++) c.circle(1.2, (x, z, d) => c.set(-17 + x, y, -17 + z, d > 0.6 ? K.bricks : 0));
  for (let x = -18; x <= 2; x += 4) { c.set(x, 1, -16, K.trapiche); c.fill(x, 1, -10, x + 1, 2, -10, K.saco_cafe); }
  c.fill(-18, 1, -8, -14, 3, -8, K.saco_cafe);
  // patio de secado con el grano al sol y el rastrillo
  for (let z = -2; z <= 14; z++) for (let x = -20; x <= 10; x++) c.set(x, 0, z, (x + z) % 6 === 0 || Math.abs(x) % 10 === 0 ? K.smooth_stone : K.cafe_secado);
  c.fill(-6, 1, 6, -6, 2, 6, K.cerca);
  // cafetal en filas
  for (let z = -24; z <= 18; z += 2) for (let x = 14; x <= 28; x++) if (c.rnd() < 0.85) { c.set(x, 0, z, K.grass); c.set(x, 1, z, (x + z) % 3 ? K.cafe3 : K.cafe2); }
  for (const [x, z] of [[16, -10], [24, 4], [20, 14]]) { c.fill(x, 1, z, x, 5, z, K.log); c.circle(2.5, (dx, dz) => c.set(x + dx, 6, z + dz, K.leaves)); }
  c.chest(2, 1, -18, 3, c.loot([[295, 4, 12], [294, 8, 20], [298, 2, 4], [360, 6, 18]], 5));
  c.placa(-4, 1, -5, 0, 'Beneficio de café', 'Aquí llega el café en cereza: se despulpa, se lava y se seca al sol en el patio. El grano de oro hizo crecer a Costa Rica desde el siglo XIX.');
  c.npc(-10, 1, 2, { role: 'caficultor', name: 'Don Rigoberto (caficultor)' });
  c.npc(20, 1, 0, { role: 'vecino', name: 'Coyera del cafetal' });
}

// ---------- trapiche de bueyes ----------
export function buildTrapicheViejo(c) {
  c.foundation(-16, -16, 16, 16, K.dirt, K.grass, 16);
  shed(c, -6, -6, 6, 6, 4, K.adobe, K.teja, true);
  c.set(0, 1, 0, K.trapiche);
  c.circle(4.6, (x, z, d) => { if (d > 3.6) c.set(x, 0, z, K.gravel); });
  c.fill(-5, 1, -5, -3, 1, -5, K.stove); c.fill(-5, 2, -5, -3, 2, -5, 0);
  c.be(-4, 1, -4, K.stove, { type: 'stove', facing: 0, grid: new Array(9).fill(null) });
  c.chest(4, 1, -5, 2, c.loot([[297, 3, 8], [296, 6, 16], [299, 2, 5]], 4));
  for (let z = -15; z <= 15; z++) for (let x = -15; x <= 15; x++) if (Math.max(Math.abs(x), Math.abs(z)) > 9 && (x + z) % 2 === 0) c.set(x, 1, z, K.cane);
  c.placa(2, 1, 7, 0, 'Trapiche', 'Los bueyes dan vueltas y el trapiche exprime la caña. El jugo se hierve en pailas hasta hacer tapa de dulce. ¡Agua dulce para todos!');
  c.npc(-3, 1, 4, { mob: 'vaca', frozen: true, name: 'buey del trapiche' });
  c.npc(3, 1, 4, { role: 'boyero', name: 'Don Celestino (trapiche)' });
}

// ---------- hacienda ganadera con redondel ----------
export function buildHacienda(c) {
  c.foundation(-40, -30, 40, 30, K.dirt, K.grass, 18);
  // casa de la hacienda
  shed(c, -34, -26, -12, -12, 4, K.adobe, K.teja);
  for (let x = -34; x <= -12; x += 3) c.fill(x, 1, -11, x, 4, -11, K.log);
  c.fill(-34, 5, -11, -12, 5, -11, K.teja);
  c.door(-23, 1, -12, 0);
  c.be(-30, 1, -24, K.bed, { type: 'bed', facing: 0 }); c.set(-16, 3, -20, K.lamp);
  // corrales, caballeriza y bebedero
  for (let x = -6; x <= 14; x++) for (const z of [-26, -12]) c.set(x, 1, z, K.cerca);
  for (let z = -26; z <= -12; z++) for (const x of [-6, 14]) c.set(x, 1, z, K.cerca);
  c.set(4, 1, -12, 0);
  c.fill(-2, 1, -20, 2, 1, -20, K.water);
  shed(c, 20, -26, 34, -16, 3, K.planks, K.zinc, true);
  for (let x = 22; x <= 32; x += 3) c.fill(x, 1, -24, x, 1, -18, K.cerca);
  // redondel de toros con gradería de madera
  c.circle(15.5, (x, z, d) => {
    const zx = x, zz = z + 14;
    if (d > 15) return;
    c.set(zx, 0, zz, d > 11 ? K.planks : K.sand);
    if (d > 10.4 && d <= 11.4) for (let y = 1; y <= 3; y++) c.set(zx, y, zz, Math.abs(x) <= 1 && z > 0 ? 0 : K.planks);
    if (d > 11.4) { const row = Math.floor(d - 11.4) + 1; for (let y = 1; y < row; y++) c.set(zx, y, zz, K.planks); c.set(zx, row, zz, K.losa_tablas); }
  });
  c.npc(0, 1, 14, { mob: 'vaca', name: 'toro del redondel' });
  c.npc(-3, 3, 27, { role: 'aficionado', name: 'Doña Tere (en el redondel)' });
  for (let k = 0; k < 4; k++) c.npc(-2 + k * 3, 1, -18, { mob: k % 2 ? 'caballo' : 'vaca', name: `ganado ${k}` });
  c.placa(-20, 1, -9, 0, 'Hacienda ganadera', 'Casa de adobe y teja, corral, caballeriza y redondel. En las fiestas hay toros a la tica: nadie le hace daño al toro, el que sale volando es el improvisado.');
  c.npc(-22, 1, -8, { role: 'sabanero', name: 'Don Ramiro (sabanero)' });
  c.npc(8, 1, -6, { role: 'sabanero', name: 'Mae Ronny (montador)' });
}

// ---------- bananera ----------
export function buildBananera(c) {
  c.foundation(-34, -34, 34, 12, K.dirt, K.grass, 16);
  for (let z = -32; z <= 10; z += 4) for (let x = -32; x <= 10; x += 3) {
    c.fill(x, 1, z, x, 3, z, K.jungle_log);
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) c.set(x + dx, 4, z + dz, K.jungle_leaves);
    c.set(x, 4, z, K.jungle_leaves);
    if ((x + z) % 2 === 0) c.set(x + 1, 3, z, K.banana_bunch);
  }
  // cable vía: postes y cable que lleva los racimos a la empacadora
  for (let x = -32; x <= 22; x++) { if (x % 8 === 0) c.fill(x, 1, -1, x, 6, -1, K.poste); else c.set(x, 6, -1, K.cable); if (x % 5 === 0) c.set(x, 5, -1, K.banana_bunch); }
  // empacadora
  shed(c, 14, -14, 32, 8, 5, K.bloque_concreto, K.zinc, true);
  for (let z = -10; z <= 4; z++) c.set(22, 1, z, K.rieles);
  for (let x = 16; x <= 30; x += 3) for (let z = -12; z <= 6; z += 6) c.fill(x, 1, z, x + 1, 2, z, K.planks);
  c.fill(26, 1, -6, 28, 1, -2, K.water);
  c.chest(30, 1, 6, 3, c.loot([[275, 8, 24], [276, 2, 6], [360, 4, 12]], 4));
  c.placa(13, 1, 9, 0, 'Bananera', 'El banano viaja colgado del cable vía hasta la empacadora, donde se lava, se corta en manos y se empaca para el barco. Costa Rica es de los que más bananos exportan en el mundo.');
  c.npc(20, 1, 0, { role: 'vecino', name: 'Mae Dennis (empacadora)' });
  c.npc(-10, 1, -3, { role: 'vecino', name: 'Don Lloyd (cortador)' });
}

// ---------- catarata de La Fortuna ----------
export function buildCatarata(c) {
  // un farallón de roca con la caída de agua en el medio, poza abajo y gradas por un lado
  c.foundation(-18, -20, 18, 14, K.stone, K.grass, 6);
  const H = 16;
  for (let z = -20; z <= -6; z++) for (let x = -16; x <= 16; x++) {
    const top = Math.round(H - Math.abs(x) * 0.15 + (z + 6) * -0.1);
    for (let y = 1; y <= top; y++) c.set(x, y, z, (x * 3 + y * 7 + z) % 11 === 0 ? K.mossy : y > top - 1 ? K.grass : K.stone);
    if (c.rnd() < 0.08) c.set(x, top + 1, z, K.helecho);
  }
  // cauce arriba, caída y poza
  for (let z = -20; z <= -6; z++) for (let x = -1; x <= 1; x++) c.set(x, H, z, K.water);
  for (let y = 1; y < H; y++) for (let x = -1; x <= 1; x++) c.set(x, y, -5, K.water_fall);
  c.circle(6.5, (x, z, d) => { const zz = z - 1; c.set(x, 0, zz, d > 5.6 ? K.stone : K.water); c.set(x, -1, zz, K.stone); if (d <= 5.6) c.set(x, -2, zz, K.stone); });
  for (let k = 0; k < 10; k++) c.set(Math.floor(c.rnd() * 12) - 6, 1, -7, K.mossy);
  // las gradas del sendero (son muchas, como las de verdad)
  for (let i = 0; i < H; i++) { c.stair(K.escalera_piedra, 10, i + 1, -5 - i, 2); for (let y = i + 2; y <= i + 4; y++) c.set(10, y, -5 - i, 0); }
  // mirador arriba
  for (let x = 6; x <= 14; x++) for (let z = -20; z <= -16; z++) c.set(x, H, z, K.planks);
  for (let x = 6; x <= 14; x++) c.set(x, H + 1, -15, K.cerca);
  c.placa(4, 1, 6, 0, 'Catarata de La Fortuna', 'Una caída de agua de unos 70 metros a los pies del volcán Arenal. Para llegar a la poza hay que bajar unas 500 gradas… y después subirlas.');
  c.npc(-6, 1, 6, { role: 'guardaparques', name: 'Guía de la catarata' });
}

// ---------- puente colgante sobre una cañada ----------
export function placePuenteColgante(gen, gx, gz) {
  const cell = 900;
  for (let k = 0; k < 90; k++) {
    const x = Math.floor(gx * cell + 60 + hash3(gen.seed, gx, 5100 + k, gz) * (cell - 120));
    const z = Math.floor(gz * cell + 60 + hash3(gen.seed, gx, 5200 + k, gz) * (cell - 120));
    const c = gen.column(x, z);
    if (!['nuboso', 'jungle', 'forest', 'mountains', 'plains'].includes(c.biome) || c.h < SEA + 2) continue;
    for (const [ax, az, rot] of [[1, 0, 1], [0, 1, 0]]) {
      const a = gen.column(x - ax * 20, z - az * 20).h, b = gen.column(x + ax * 20, z + az * 20).h;
      if (Math.abs(a - b) > 4 || Math.min(a, b) < c.h + 6) continue;
      return { x, z, y: Math.max(a, b) + 1, rot, id: `puente_colgante@${x},${z}`, type: 'puente_colgante' };
    }
  }
  return null;
}
export function buildPuenteColgante(c) {
  const L = 21;
  for (let s = -L; s <= L; s++) {
    const sag = Math.round(4 * (1 - (s / L) ** 2));
    const y = -sag;
    for (let x = -1; x <= 1; x++) { c.set(x, y, s, K.planks); for (let yy = y + 1; yy <= y + 3; yy++) c.set(x, yy, s, 0); }
    for (const x of [-2, 2]) { c.set(x, y + 1, s, K.cerca); c.set(x, y + 2, s, c.r % 2 ? K.cable : K.cable_z); }
  }
  // torres de acero en los extremos, ancladas al suelo
  for (const s of [-L - 1, L + 1]) for (const x of [-2, 2]) { const g = c.ground(x, s); for (let y = Math.min(g, 0) - 1; y <= 4; y++) c.set(x, y, s, K.lamina_metal); }
  for (const s of [-L - 2, L + 2]) for (let x = -1; x <= 1; x++) { const g = c.ground(x, s); for (let y = Math.min(g, -1); y <= -1; y++) c.set(x, y, s, K.cobble); c.set(x, 0, s, K.planks); for (let y = 1; y <= 3; y++) c.set(x, y, s, 0); }
  c.placa(3, 1, -L - 2, 2, 'Puente colgante', 'Caminar entre las copas de los árboles: se mueve un poquito, pero aguanta. Abajo se ven las hojas, arriba los pájaros. No se asome tanto.');
  c.npc(0, 1, -L - 4, { role: 'guardaparques', name: 'Guía del puente colgante' });
}
