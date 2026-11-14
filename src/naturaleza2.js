// Más naturaleza tica (generador v6): cráter del Irazú con su laguna verde y el paisaje de ceniza, Rincón de la Vieja
// con pailas de lodo hirviendo, fumarolas y pozas termales, la caverna de Barra Honda con su bajada en caracol y
// el Puente de la Amistad atirantado sobre un río ancho. Sin gráficos.
import { hash3 } from './noise.js';
import { BLOCK_BY_KEY as K } from './blocks.js';

const SEA = 62;

// ---------- Volcán Irazú ----------
export function buildIrazu(c) {
  const R = 22;
  // cráter: un tazón de ceniza y basalto con la laguna verde al fondo
  c.circle(R + 8, (x, z, d) => {
    const g = c.ground(x, z);
    if (d > R) { for (let y = g - 1; y <= g; y++) c.set(x, y, z, (x * 7 + z * 3) % 5 ? K.ceniza : K.basalt); for (let y = g + 1; y <= g + 8; y++) c.set(x, y, z, 0); return; }
    const depth = Math.round(14 * Math.sqrt(1 - (d / R) ** 2));
    for (let y = -depth; y <= Math.max(g, 2) + 6; y++) c.set(x, y, z, 0);
    c.set(x, -depth - 1, z, d > R - 3 ? K.basalt : K.ceniza);
    for (let y = -depth; y <= 0; y++) if (d > R - 1.5 || (y < -depth + 2 && d > R * 0.5)) c.set(x, y, z, (x + y) % 3 ? K.ceniza : K.basalt);
    if (d < R * 0.42) { c.set(x, -depth, z, K.agua_acida); c.set(x, -depth + 1, z, d < R * 0.32 ? K.agua_acida : 0); }
    if (d > R - 1.5) for (let y = 1; y <= 1; y++) c.set(x, y, z, K.ceniza);
  });
  // mirador con baranda y sendero
  for (let x = -4; x <= 4; x++) for (let z = R + 1; z <= R + 4; z++) c.set(x, 0, z, K.planks);
  for (let x = -4; x <= 4; x++) c.set(x, 1, R + 1, K.cerca);
  for (let z = R + 5; z <= R + 12; z++) c.set(0, 0, z, K.gravel);
  c.placa(2, 1, R + 3, 0, 'Volcán Irazú', 'El volcán más alto de Costa Rica, en Cartago. Su cráter principal guarda una laguna de color verde que cambia con los años. En días despejados se ven los dos océanos.');
  c.zone(0, -6, 0, 'fumarola', 60);
  c.npc(-2, 1, R + 3, { role: 'guardaparques', name: 'Guardaparques del Irazú' });
}

// ---------- Rincón de la Vieja: pailas de lodo, fumarolas y pozas termales ----------
export function buildRinconVieja(c) {
  c.foundation(-20, -20, 20, 20, K.dirt, K.grass, 10);
  const pools = [[-8, -6, 3.2], [6, -9, 2.6], [-4, 8, 2.8], [10, 6, 2.2], [-13, 4, 2]];
  pools.forEach(([x, z, r], i) => c.circle(r + 1.2, (dx, dz, d) => {
    const lodo = i < 3;
    if (d > r) { c.set(x + dx, 0, z + dz, i % 2 ? K.azufre_bloque : K.travertino); return; }
    c.set(x + dx, -1, z + dz, K.stone);
    c.set(x + dx, 0, z + dz, lodo ? K.lodo : K.water);
  }));
  // sendero de tablas entre las pailas
  for (let z = -18; z <= 18; z++) { c.set(0, 0, z, K.planks); c.set(1, 0, z, K.planks); }
  for (let x = -18; x <= 18; x++) { c.set(x, 0, -1, K.planks); }
  for (const [x, z] of [[-1, -10], [2, 10], [-10, -2], [10, 0]]) { c.set(x, 1, z, K.cerca); c.set(x, 2, z, K.cerca); }
  c.placa(3, 1, 16, 0, 'Rincón de la Vieja', 'En Guanacaste: un volcán vivo con pailas de lodo que hierven, fumarolas que huelen a azufre y pozas de agua caliente. No se salga del sendero, el suelo quema.');
  c.zone(0, 1, 0, 'lodo', 26);
  c.zone(-8, 1, -6, 'fumarola', 30);
  c.npc(2, 1, 14, { role: 'guardaparques', name: 'Guía del Rincón de la Vieja' });
}

// ---------- caverna de Barra Honda ----------
export function buildBarraHonda(c) {
  c.foundation(-7, -7, 7, 7, K.stone, K.grass, 8);
  // boca en la loma con baranda
  for (const [x, z] of [[-2, -2], [2, -2], [-2, 2], [2, 2]]) c.fill(x, 1, z, x, 2, z, K.cerca);
  // la bajada: escalera de caracol por un pozo
  const D = 22;
  for (let y = -D; y <= 0; y++) for (let z = -1; z <= 1; z++) for (let x = -1; x <= 1; x++) c.set(x, y, z, 0);
  for (let y = -D; y <= 0; y++) for (const [x, z] of [[-2, -1], [-2, 0], [-2, 1], [2, -1], [2, 0], [2, 1], [-1, -2], [0, -2], [1, -2], [-1, 2], [0, 2], [1, 2]]) c.set(x, y, z, y % 4 === 0 ? K.calcite : K.stone);
  // la sala: bóveda grande con estalactitas, estalagmitas, columnas y hongos que brillan
  const cy = -D - 5;
  for (let y = -7; y <= 7; y++) for (let z = -12; z <= 12; z++) for (let x = -12; x <= 12; x++) {
    const d = Math.hypot(x / 12, y / 7, z / 12);
    if (d < 1) c.set(x, cy + y, z, 0);
    else if (d < 1.25) c.set(x, cy + y, z, (x * 3 + y + z) % 7 === 0 ? K.calcite : K.stone);
  }
  for (let x = -1; x <= 1; x++) for (let z = -1; z <= 1; z++) for (let y = cy + 2; y <= -D; y++) c.set(x, y, z, 0);
  // escalera de caracol desde la boca hasta el piso de la sala (en la sala queda colgando, libre)
  c.spiral(K.escalera_piedra, cy - 6, -1, K.calcite);
  for (let k = 0; k < 70; k++) {
    const x = Math.floor(hash3(k, 1, 2, 3) * 22) - 11, z = Math.floor(hash3(k, 4, 5, 6) * 22) - 11;
    if (Math.hypot(x / 12, z / 12) > 0.85 || (Math.abs(x) < 3 && Math.abs(z) < 3)) continue;
    const top = cy + Math.floor(7 * Math.sqrt(Math.max(0, 1 - (x / 12) ** 2 - (z / 12) ** 2))) - 1;
    const floor = cy - Math.floor(7 * Math.sqrt(Math.max(0, 1 - (x / 12) ** 2 - (z / 12) ** 2))) + 1;
    if (k % 3 === 0) c.set(x, top, z, K.stalactite);
    else if (k % 3 === 1) c.set(x, floor, z, k % 2 ? K.stalagmite : K.glow_mushroom);
    else if (k % 7 === 2) c.fill(x, floor, z, x, top, z, K.calcite);
  }
  const fy = (x, z) => cy - Math.floor(7 * Math.sqrt(Math.max(0, 1 - (x / 12) ** 2 - (z / 12) ** 2))) + 1;
  c.chest(5, fy(5, 5), 5, 2, c.loot([[260, 1, 2], [273, 2, 5], [259, 2, 6], [360, 5, 15], [369, 1, 2]], 5));
  c.set(-5, fy(-5, -5), -5, K.glow_mushroom); c.set(-6, fy(-6, 4), 4, K.lamp);
  c.placa(3, 1, 0, 1, 'Caverna de Barra Honda', 'En Nicoya, Guanacaste: cavernas de piedra caliza con estalactitas y estalagmitas que tardaron miles de años en formarse. Se baja con cuidado… y con casco.');
  c.npc(4, 1, 4, { role: 'guardaparques', name: 'Guía de Barra Honda' });
}

// ---------- Puente de la Amistad: busca un río ancho ----------
export function placeAmistad(gen, gx, gz) {
  const cell = 1600;
  for (let k = 0; k < 60; k++) {
    const x = Math.floor(gx * cell + 80 + hash3(gen.seed, gx, 6100 + k, gz) * (cell - 160));
    const z = Math.floor(gz * cell + 80 + hash3(gen.seed, gx, 6200 + k, gz) * (cell - 160));
    const c = gen.column(x, z);
    if (c.h >= SEA - 1 || c.biome === 'ocean') continue;
    for (const [ax, az, rot] of [[1, 0, 1], [0, 1, 0]]) {
      let a = 0, b = 0;
      while (a < 40 && gen.column(x - ax * (a + 1), z - az * (a + 1)).h < SEA) a++;
      while (b < 40 && gen.column(x + ax * (b + 1), z + az * (b + 1)).h < SEA) b++;
      if (a >= 40 || b >= 40 || a + b < 14) continue;
      const mid = Math.floor((b - a) / 2);
      return { x: x + ax * mid, z: z + az * mid, y: SEA, rot, half: Math.ceil((a + b) / 2) + 5, id: `amistad@${x},${z}`, type: 'amistad' };
    }
  }
  return null;
}
export function buildAmistad(c, P) {
  const L = P.half, deck = 8;
  // tablero de concreto de dos carriles con baranda y línea amarilla
  for (let s = -L; s <= L; s++) {
    const ramp = Math.max(0, Math.abs(s) - (L - 8));
    const y = deck - ramp;
    for (let x = -3; x <= 3; x++) {
      c.set(x, y, s, Math.abs(x) === 3 ? K.concreto : x === 0 && s % 4 < 2 ? K.asfalto_linea : K.asfalto);
      for (let yy = y + 1; yy <= y + 4; yy++) c.set(x, yy, s, 0);
      if (ramp > 0) { const g = c.ground(x, s); for (let yy = g; yy < y; yy++) c.set(x, yy, s, K.concreto); }
    }
    for (const x of [-3, 3]) c.set(x, y + 1, s, K.verja);
    if (ramp === 0 && s % 10 === 0 && Math.abs(s) > 4) for (const x of [-2, 2]) { const g = c.ground(x, s); for (let yy = g; yy < y; yy++) c.set(x, yy, s, K.concreto); }
  }
  // torre central (pilón) y tirantes en abanico
  const H = 34;
  for (const x of [-4, 4]) for (let y = 0; y <= deck + H; y++) c.set(x, y, 0, K.concreto);
  for (let y = deck + 12; y <= deck + H; y += 11) c.fill(-4, y, 0, 4, y, 0, K.concreto);
  for (let i = 1; i <= 6; i++) for (const sgn of [-1, 1]) for (const x of [-3, 3]) {
    const s1 = sgn * i * Math.floor((L - 4) / 6), y0 = deck + H - 2 - i;
    const n = Math.abs(s1) + 4;
    for (let k = 0; k <= n; k++) { const t = k / n; c.set(x, Math.round(y0 + (deck + 1 - y0) * t), Math.round(s1 * t), c.r % 2 ? K.cable : K.cable_z); }
  }
  c.set(0, deck + H + 1, 0, K.lamp);
  c.placa(4, deck + 1, -L + 2, 0, 'Puente de la Amistad', 'El puente atirantado sobre el río Tempisque, en Guanacaste, hecho con ayuda de Taiwán en 2003. Antes había que cruzar en panga y hacer fila horas.');
}
