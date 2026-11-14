// Estadios y monumentos urbanos (generador v6): Estadio Nacional con su cubierta, un estadio ficticio en remodelación
// eterna, estación del tren con locomotora, Monumento Nacional y Templo de la Música.
// Cada builder recibe el contexto de estructuras.js (coordenadas locales con rotación). Sin gráficos.
import { BLOCK_BY_KEY as K } from './blocks.js';

// fila de gradería para un punto fuera del rectángulo interior (0 = adentro) y hacia dónde mira (afuera)
function standRow(x, z, W0, H0) {
  const ox = Math.max(Math.abs(x) - W0, 0), oz = Math.max(Math.abs(z) - H0, 0);
  const d = Math.hypot(ox, oz);
  const f = ox > oz ? (x > 0 ? 1 : 3) : z > 0 ? 0 : 2;
  return [d > 0 ? Math.ceil(d) : 0, f];
}

function field(c, FW, FH) {
  for (let z = -FH; z <= FH; z++) for (let x = -FW; x <= FW; x++) {
    const line = Math.abs(x) === FW || Math.abs(z) === FH || x === 0 || Math.abs(Math.hypot(x, z) - 4) < 0.5 ||
      (Math.abs(x) === FW - 6 && Math.abs(z) <= 6) || (Math.abs(z) === 6 && Math.abs(x) >= FW - 6) || (Math.abs(x) === FW - 2 && Math.abs(z) <= 3) || (Math.abs(z) === 3 && Math.abs(x) >= FW - 2);
    c.set(x, 0, z, line ? K.calcite : K.cesped);
  }
  for (const s of [-1, 1]) {
    for (const z of [-3, 3]) c.fill(s * FW, 1, z, s * FW, 2, z, K.plaster);
    c.fill(s * FW, 3, -3, s * FW, 3, 3, K.plaster);
    c.fill(s * (FW + 1), 1, -3, s * (FW + 1), 2, 3, K.cobweb);
  }
}

// ---------- Estadio Nacional ----------
export function buildEstadioNacional(c) {
  const FW = 20, FH = 13, W0 = 23, H0 = 16, ROWS = 13, OUT = ROWS + 2;
  c.foundation(-W0 - OUT, -H0 - OUT, W0 + OUT, H0 + OUT, K.concreto, K.concreto, 30);
  // pista atlética alrededor de la cancha
  for (let z = -H0; z <= H0; z++) for (let x = -W0; x <= W0; x++) if (Math.abs(x) > FW || Math.abs(z) > FH) c.set(x, 0, z, (Math.abs(x) + Math.abs(z)) % 7 === 0 ? K.plaster : K.repello_rojo);
  field(c, FW, FH);
  // graderías con filas de colores, muro de afuera con vidrio y entradas
  for (let z = -H0 - OUT; z <= H0 + OUT; z++) for (let x = -W0 - OUT; x <= W0 + OUT; x++) {
    const [k, f] = standRow(x, z, W0, H0);
    if (k === 0 || k > ROWS + 1) continue;
    const gate = (Math.abs(x) <= 1 && Math.abs(z) > H0) || (Math.abs(z) <= 1 && Math.abs(x) > W0);
    if (k <= ROWS) {
      for (let y = 1; y < k; y++) c.set(x, y, z, gate && y <= 3 ? 0 : K.concreto);
      if (!(gate && k <= 3)) c.stair(k % 4 === 0 ? K.escalera_teja : k % 4 === 2 ? K.escalera_adobe : K.escalera_piedra, x, k, z, f);
      for (let y = k + 1; y <= ROWS + 3; y++) c.set(x, y, z, 0);
    } else for (let y = 1; y <= ROWS + 3; y++) c.set(x, y, z, gate && y <= 3 ? 0 : y % 4 === 0 ? K.glass : K.concreto);
    // cubierta blanca curva sobre los lados largos
    if (Math.abs(z) > H0 && Math.abs(x) <= W0 + 6 && k >= 4) c.set(x, ROWS + 4 + Math.floor((k - 4) * 0.3), z, K.plaster);
    if (Math.abs(z) > H0 && Math.abs(x) <= W0 + 6 && k === 4) c.set(x, ROWS + 3, z, K.plaster);
  }
  // torres de luz
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const x = sx * (W0 + ROWS - 1), z = sz * (H0 + ROWS - 1);
    c.fill(x, 1, z, x, ROWS + 12, z, K.poste);
    c.fill(x - 1, ROWS + 13, z - 1, x + 1, ROWS + 14, z + 1, K.lamp);
  }
  // marcador en un fondo
  const mx = -(W0 + ROWS);
  c.fill(mx, ROWS + 3, -5, mx, ROWS + 8, 5, K.basalt);
  for (const [z, y] of [[-3, 5], [-3, 6], [-3, 7], [-2, 7], [-2, 5], [2, 5], [2, 6], [2, 7], [3, 7], [3, 6], [3, 5], [0, 6]]) c.set(mx + 1, ROWS + y, z, K.lamp);
  // vestidores bajo la gradería del frente
  for (let x = 4; x <= 9; x++) for (let k = 2; k <= 6; k++) for (let y = 1; y <= 2; y++) c.set(x, y, H0 + k, 0);
  for (let x = 4; x <= 9; x++) c.stair(K.escalera_tablas, x, 1, H0 + 6, 2);
  c.chest(9, 1, H0 + 3, 3, c.loot([[360, 10, 30], [263, 2, 6], [299, 2, 4], [374, 1, 4]], 5));
  c.set(6, 2, H0 + 4, K.lamp);
  c.placa(3, 1, H0 + OUT + 1, 0, 'Estadio Nacional', 'En La Sabana, San José: la casa de la Sele. Su cubierta blanca se ve desde todo el parque. Cuando hay partido, el grito de gol se oye hasta Pavas.');
  c.zone(0, 1, 0, 'estadio', 40);
  c.npc(-6, 1, -2, { role: 'futbolista', name: 'Chalo (portero)' });
  c.npc(5, 1, 3, { role: 'futbolista', name: 'Bryan (delantero)' });
  c.npc(-2, 1, 6, { role: 'futbolista', name: 'Celso (volante)' });
  c.npc(2, ROWS - 4, H0 + ROWS - 4, { role: 'aficionado', name: 'Aficionado de la Sele' });
  c.npc(-8, ROWS - 6, -H0 - ROWS + 6, { role: 'aficionado', name: 'Doña Maribel (con la camiseta)' });
  c.npc(1, 1, H0 + OUT + 2, { role: 'copero', name: 'Vendedor de copos' });
}

// ---------- estadio en remodelación eterna (ficticio) ----------
export function buildEstadioObra(c) {
  const FW = 14, FH = 9, W0 = 17, H0 = 12, ROWS = 10, OUT = ROWS + 2;
  c.foundation(-W0 - OUT - 6, -H0 - OUT - 6, W0 + OUT + 6, H0 + OUT + 6, K.dirt, K.dirt, 30);
  // cancha: la mitad con zacate y la otra mitad todavía es barro con estacas
  for (let z = -FH; z <= FH; z++) for (let x = -FW; x <= FW; x++) c.set(x, 0, z, x < 0 ? K.cesped : (x + z) % 9 === 0 ? K.gravel : K.dirt);
  for (let x = 2; x <= FW; x += 4) for (let z = -FH; z <= FH; z += 6) c.set(x, 1, z, K.cerca);
  for (const z of [-3, 3]) c.fill(-FW, 1, z, -FW, 2, z, K.plaster);
  c.fill(-FW, 3, -3, -FW, 3, 3, K.plaster);
  for (let z = -H0 - OUT; z <= H0 + OUT; z++) for (let x = -W0 - OUT; x <= W0 + OUT; x++) {
    const [k, f] = standRow(x, z, W0, H0);
    if (k === 0 || k > ROWS + 1) continue;
    // lado sur terminado, lado norte a medias (hasta donde alcanzó el presupuesto), los fondos son puro esqueleto
    const done = z > H0 || (z < -H0 && x < -4 + Math.floor(Math.sin(x * 0.7) * 2));
    if (done && k <= ROWS) {
      for (let y = 1; y < k; y++) c.set(x, y, z, K.concreto);
      c.stair(K.escalera_piedra, x, k, z, f);
    } else if (done) for (let y = 1; y <= ROWS + 2; y++) c.set(x, y, z, y === ROWS + 2 ? K.varilla : K.concreto);
    else if ((x % 5 === 0 || z % 5 === 0) && (x + z) % 5 === 0) {
      // columnas de concreto con varillas saliendo
      const top = Math.min(k + 2, ROWS);
      for (let y = 1; y <= top; y++) c.set(x, y, z, K.concreto);
      c.set(x, top + 1, z, K.varilla); c.set(x, top + 2, z, K.varilla);
    } else if (k % 3 === 0 && (x + z) % 2 === 0) c.set(x, Math.min(k, 6), z, K.andamio);
  }
  // andamios en la parte a medias
  for (let x = -2; x <= 12; x += 2) for (let y = 1; y <= 8; y++) c.set(x, y, -H0 - 6, (y + x) % 3 === 0 ? K.planks : K.andamio);
  // grúa torre
  const gx = W0 + OUT + 2, gz = -H0 - OUT - 2;
  c.fill(gx, 1, gz, gx, 30, gz, K.andamio);
  c.fill(gx - 14, 31, gz, gx + 5, 31, gz, K.maquina);
  c.fill(gx + 3, 30, gz, gx + 5, 30, gz, K.concreto);
  c.fill(gx - 12, 18, gz, gx - 12, 30, gz, K.cerca);
  c.fill(gx - 13, 17, gz, gx - 11, 17, gz, K.maquina);
  // mezcladora, montones de arena y bloques
  for (let x = 0; x < 3; x++) for (let z = 0; z < 2; z++) { c.set(W0 + 4 + x, 1, H0 + OUT + 2 + z, K.maquina); c.set(W0 + 4 + x, 2, H0 + OUT + 2 + z, x === 1 ? K.basalt : K.maquina); }
  for (let k = 0; k < 4; k++) for (let y = 1; y <= 3 - (k > 1 ? 1 : 0); y++) c.set(-W0 - 4 - k, y, H0 + OUT + 3, K.gravel);
  c.fill(-W0 - 4, 1, -H0 - OUT - 3, -W0 - 2, 2, -H0 - OUT - 2, K.bloque_concreto);
  c.placa(2, 1, H0 + OUT + 4, 0, 'Estadio de la Ciudad de las Flores (en remodelación)', 'Remodelación fase 1 de 14. Inicio de obras: hace mucho. Inauguración: próximamente. Presupuesto: ampliación número 7. (Estadio ficticio de NanoBlocks.)');
  c.placa(-6, 1, H0 + OUT + 4, 0, 'Rótulo de la obra', 'Trabajamos para usted. Se ruega no preguntar cuándo se termina.');
  c.zone(0, 1, 0, 'estadio_obra', 40);
  c.npc(4, 1, -2, { role: 'constructor', name: 'Don Lencho (cuadrilla)' });
  c.npc(-6, 1, 4, { role: 'ingeniero', name: 'Ing. Quirós (el de la obra)' });
  c.npc(8, 1, H0 + OUT + 3, { role: 'constructor', name: 'Mae Yeiner (cuadrilla)' });
  c.npc(-10, 1, 0, { role: 'aficionado', name: 'Don Rolando (aficionado paciente)' });
}

// ---------- estación del tren ----------
export function buildEstacion(c) {
  c.foundation(-24, -6, 24, 10, K.gravel, K.gravel, 14);
  // vía a lo largo, con durmientes
  for (let x = -24; x <= 24; x++) for (const z of [-2, -1]) c.set(x, 1, z, K.rieles);
  // andén de concreto
  for (let x = -14; x <= 14; x++) for (let z = 0; z <= 2; z++) c.set(x, 1, z, K.acera);
  // edificio de madera pintada con corredor y techo de zinc
  for (let x = -8; x <= 8; x++) for (let z = 3; z <= 9; z++) {
    const edge = Math.abs(x) === 8 || z === 3 || z === 9;
    c.set(x, 1, z, K.planks);
    for (let y = 2; y <= 5; y++) c.set(x, y, z, edge ? (y === 3 && (x % 3 === 0) ? K.glass : y === 5 ? K.paint_green : K.paint_yellow) : 0);
  }
  for (let x = -9; x <= 9; x++) for (let z = 0; z <= 10; z++) c.set(x, 6 + (z > 5 ? 0 : 1) - (z === 0 ? 1 : 0), z, K.zinc);
  for (const x of [-8, -3, 3, 8]) c.fill(x, 2, 0, x, 5, 0, K.log);
  c.door(0, 2, 3, 2);
  c.fill(-6, 2, 4, -3, 2, 4, K.planks); c.set(-4, 3, 4, K.glass);
  for (let x = 2; x <= 6; x += 2) c.stair(K.escalera_tablas, x, 2, 1, 0);
  c.set(0, 5, 4, K.lamp); c.set(-6, 5, 1, K.farol);
  // locomotora negra con chimenea y un vagón
  const L = -20;
  c.fill(L, 2, -2, L + 5, 3, -1, K.basalt);
  c.fill(L + 4, 4, -2, L + 5, 4, -1, K.basalt);
  c.fill(L, 4, -2, L + 1, 5, -1, K.repello_rojo); c.set(L + 1, 5, -2, K.glass);
  c.set(L + 4, 5, -2, K.basalt); c.set(L + 4, 6, -2, K.basalt);
  for (const x of [L + 1, L + 4]) for (const z of [-2, -1]) c.set(x, 2, z, K.repello_rojo);
  for (let x = L + 7; x <= L + 14; x++) for (const z of [-2, -1]) { c.set(x, 2, z, K.basalt); c.set(x, 3, z, K.paint_yellow); c.set(x, 4, z, x % 2 ? K.glass : K.paint_yellow); c.set(x, 5, z, K.plaster); }
  c.placa(-2, 2, 2, 0, 'Estación del tren', 'Por aquí pasaba el tren al Atlántico, el que empezó a construirse en 1871 para sacar el café al puerto. El silbato todavía se oye en la memoria de los abuelos.');
  c.zone(-17, 3, -2, 'tren', 24);
  c.npc(-1, 2, 1, { role: 'jefe_estacion', name: 'Don Fermín (jefe de estación)' });
}

// ---------- Monumento Nacional ----------
export function buildMonumentoNacional(c) {
  c.foundation(-10, -10, 10, 10, K.cobble, K.smooth_stone, 16);
  c.circle(10, (x, z, d) => { c.set(x, 0, z, d > 8 ? K.acera : (x + z) % 2 ? K.smooth_stone : K.calcite); if (d > 8.5 && d < 9.5 && (x * z) % 3 === 0) c.set(x, 1, z, c.rnd() < 0.5 ? K.flower_red : K.flower_yellow); });
  // pedestal escalonado de piedra
  c.fill(-5, 1, -3, 5, 1, 3, K.smooth_stone);
  c.fill(-4, 2, -2, 4, 3, 2, K.basalt);
  c.fill(-4, 4, -2, 4, 4, 2, K.smooth_stone);
  // cinco figuras (las cinco naciones) que empujan al invasor, en bronce oscuro
  const B = K.piedra_pomez;
  for (let i = 0; i < 5; i++) {
    const x = Math.floor(-3 + i * 1.5), z = i % 2 ? -1 : 1;
    c.fill(x, 5, z, x, 6, z, B); c.set(x, 7, z, B);
    c.set(x + 1, 6, z, B);
  }
  c.fill(4, 5, 0, 4, 6, 0, K.basalt); c.set(4, 7, 0, K.basalt); c.set(5, 5, 0, K.basalt);
  c.set(-3, 8, 1, K.farol);
  for (const [x, z] of [[-8, -8], [8, -8], [-8, 8], [8, 8]]) { c.fill(x, 1, z, x, 2, z, K.poste); c.set(x, 3, z, K.farol); }
  c.placa(0, 1, -4, 2, 'Monumento Nacional', 'Las cinco naciones de Centroamérica, unidas, echan al invasor en la Campaña Nacional de 1856-1857. Está en el Parque Nacional de San José, frente a la Asamblea.');
  c.npc(-6, 1, 6, { role: 'vecino', name: 'Profe de historia de paseo' });
}

// ---------- Templo de la Música ----------
export function buildTemploMusica(c) {
  c.foundation(-11, -11, 11, 11, K.dirt, K.grass, 16);
  for (let z = -11; z <= 11; z++) for (let x = -11; x <= 11; x++) if (Math.abs(x) <= 1 || Math.abs(z) <= 1 || Math.abs(Math.abs(x) - Math.abs(z)) === 0) c.set(x, 0, z, K.acera);
  c.circle(6.4, (x, z, d) => { c.set(x, 1, z, K.smooth_stone); c.set(x, 2, z, d > 5.6 ? K.losa_lisa : K.smooth_stone); });
  for (let x = -1; x <= 1; x++) c.stair(K.escalera_piedra, x, 1, -7, 2);
  // columnas blancas en círculo, cornisa y cúpula
  for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; const x = Math.round(Math.cos(a) * 5), z = Math.round(Math.sin(a) * 5); c.fill(x, 3, z, x, 8, z, K.calcite); }
  c.circle(6, (x, z, d) => { if (d > 4.4) c.set(x, 9, z, K.plaster); });
  for (let y = 0; y < 5; y++) c.circle(5.4 - y * 1.1, (x, z, d) => { if (d > 4.3 - y * 1.1 || y === 4) c.set(x, 10 + y, z, K.plaster); });
  c.set(0, 15, 0, K.oro_volcanico);
  c.set(0, 8, 0, K.farol);
  for (const [x, z] of [[-8, -8], [8, -8], [-8, 8], [8, 8]]) { c.fill(x, 1, z, x, 4, z, K.log); c.circle(2.3, (dx, dz) => { c.set(x + dx, 5, z + dz, K.leaves); c.set(x + dx, 6, z + dz, dx === 0 || dz === 0 ? K.leaves : 0); }); }
  for (const [x, z, f] of [[-4, -9, 2], [4, -9, 2], [-9, 4, 3], [9, -4, 1]]) c.stair(K.escalera_tablas, x, 1, z, f);
  c.placa(2, 1, -8, 2, 'Templo de la Música', 'En el Parque Morazán, San José. Aquí tocaban las bandas los domingos y las parejas daban vueltas al parque. Hoy sigue siendo el lugar más romántico de Chepe.');
  c.zone(0, 3, 0, 'retreta', 7);
  c.npc(-2, 3, 2, { role: 'acomodador', name: 'Director de la banda' });
  c.npc(7, 1, 3, { role: 'vecino', name: 'Pareja de novios' });
}
