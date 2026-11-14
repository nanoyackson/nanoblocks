// Canopy en el bosque (generador v9): una torre-árbol con escalera de caracol hasta una plataforma en las copas,
// de ahí sale la línea de cable bajando ~40 bloques hasta la plataforma de llegada. Abajo hay guía, rótulo y un cofre
// con poleas. «Canopy Pura Adrenalina» es ficticio. Sin gráficos.
import { BLOCK_BY_KEY as K } from './blocks.js';

export function buildCanopy(c) {
  const H = 18, LEN = 42;
  const cable = c.r % 2 === 0 ? K.cable : K.cable_z;
  c.foundation(-5, -5, 5, 5, K.dirt, K.grass, 6);
  // el árbol-torre: tronco, escalera de caracol alrededor y la plataforma con baranda arriba
  c.spiral(K.escalera_tablas, 1, H, K.jungle_log);
  for (let z = -3; z <= 3; z++) for (let x = -3; x <= 3; x++) {
    c.set(x, H + 1, z, K.planks);
    const edge = Math.abs(x) === 3 || Math.abs(z) === 3;
    if (edge && !(x === 3 && Math.abs(z) <= 1)) c.set(x, H + 2, z, K.cerca);
    for (let y = H + 2; y <= H + 5; y++) if (!edge) c.set(x, y, z, 0);
  }
  // el hueco de la escalera: sobre los dos últimos escalones (la caracol da vuelta por el anillo de radio 1)
  const RING = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];
  for (const L of [H - 3, H - 2, H - 1]) { const [rx, rz] = RING[((L % 8) + 8) % 8]; c.set(rx, H + 1, rz, 0); }
  c.set(0, H + 1, 0, K.jungle_log);
  for (const [x, z] of [[-3, -3], [3, -3], [-3, 3], [3, 3]]) for (let y = 1; y <= H; y++) c.set(x, y, z, K.log);
  c.circle(5.5, (x, z, d) => { if (d > 3.6) { c.set(x, H + 6, z, K.jungle_leaves); if (d < 4.6) c.set(x, H + 7, z, K.jungle_leaves); } });
  for (let y = H + 2; y <= H + 6; y++) c.set(-3, y, -3, K.log);
  // la línea: baja de a poquito, siempre por lo menos 4 bloques sobre el terreno
  let y = H + 2;
  const ys = [];
  for (let x = 4; x <= 4 + LEN; x++) {
    const lerp = Math.round(H + 2 - ((x - 4) * (H - 4)) / LEN);
    const target = Math.max(lerp, c.ground(x, 0) + 4);
    y = Math.max(y - 1, Math.min(y + 1, target));
    ys.push(y);
    c.set(x, y, 0, cable);
    for (let yy = y - 4; yy <= y + 1; yy++) for (let z = -1; z <= 1; z++) if (yy !== y || z !== 0) c.set(x, yy, z, 0);
  }
  // postes de amarre en las dos puntas
  c.fill(4, ys[0] + 1, 1, 4, ys[0] + 2, 1, K.log);
  const xe = 4 + LEN, ye = ys[ys.length - 1];
  // plataforma de llegada debajo de la punta, con pilares hasta el suelo y sacos para el aterrizaje
  const py = ye - 3;
  for (let z = -2; z <= 2; z++) for (let x = xe - 5; x <= xe + 3; x++) {
    c.set(x, py, z, (x + z) % 2 ? K.planks : K.saco_cafe);
    if ((Math.abs(z) === 2) && (x === xe - 5 || x === xe + 3)) for (let yy = py - 1; yy > c.ground(x, z); yy--) c.set(x, yy, z, K.log);
    if (Math.abs(z) === 2 || x === xe + 3) c.set(x, py + 1, z, K.cerca);
  }
  for (let yy = py; yy > c.ground(xe + 1, 0); yy--) c.set(xe + 2, yy, 0, (yy - py) % 3 === 0 ? K.escalera_tablas : K.log);
  c.placa(xe - 1, py + 1, -1, 0, 'Llegada', '¡Pura vida! Si le temblaron las piernas, es normal. Baje con cuidado por la escalera.');
  // abajo: rótulo, guía y el cofre con las poleas
  c.placa(-4, 1, 6, 0, 'Canopy Pura Adrenalina (ficticio)', 'Suba por la escalera del árbol, agarre una polea del cofre y, arriba, clic derecho al cable. Espacio frena, Shift se suelta. Seguro incluido* (*no incluido).');
  c.chest(-5, 1, 4, 0, [{ id: 415, count: 2 }, ...new Array(26).fill(null)]);
  c.chest(-2, H + 2, -2, 0, [{ id: 415, count: 1 }, ...new Array(26).fill(null)]);
  c.npc(-3, 1, 6, { role: 'guia', name: 'Kendall (guía del canopy)' });
}
