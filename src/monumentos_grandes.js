// Monumentos a lo grande (generador v6): Ruinas de Cartago largas y altas, Fortín de Heredia con su parque,
// y el guanacaste monumental con raíces enormes, hueco en el tronco, escalera y mirador en las ramas.
// Cada builder recibe el contexto de construcción de estructuras.js (coordenadas locales con rotación).
// Sin gráficos (lo usa el generador).
import { BLOCK_BY_KEY as K } from './blocks.js';

const sector = (x, z, n) => { const a = Math.atan2(z, x), s = (Math.PI * 2) / n; return Math.abs(a - Math.round(a / s) * s); };

// ---------- Ruinas de Santiago Apóstol (Cartago), 26 x 52 ----------
export function buildRuinasGrande(c0) {
  const c = c0.frame(0, 26, 0); // el centro de la estructura queda en el origen
  const W = 11, D = 48;
  c.foundation(-W - 6, -D - 5, W + 6, 12, K.cobble, K.grass, 26);
  // plaza al frente con faroles y bancas
  for (let z = 1; z <= 12; z++) for (let x = -W - 5; x <= W + 5; x++) c.set(x, 0, z, (x * 3 + z) % 5 === 0 ? K.smooth_stone : K.cobble);
  for (const x of [-W - 3, W + 3]) for (const z of [4, 9]) { c.fill(x, 1, z, x, 2, z, K.cerca); c.set(x, 3, z, K.farol); }
  for (const x of [-9, -8, -7, 7, 8, 9]) c.stair(K.escalera_piedra, x, 1, 11, 0);
  // muros laterales (2 de grosor) con ventanales en arco, contrafuertes y partes caídas por los terremotos
  for (let z = -D; z <= -2; z++) {
    const m = ((z % 6) + 6) % 6;
    for (const s of [-1, 1]) {
      const bay = Math.floor(-z / 6);
      const broken = (bay * 7 + (s > 0 ? 3 : 0)) % 5 === 1;
      const top = 16 - Math.floor(c.rnd() * 3) - (broken ? 5 + Math.floor(c.rnd() * 4) : 0);
      for (const t of [0, 1]) {
        const x = s * (W + t);
        for (let y = 1; y <= top; y++) {
          const arch = y >= 4 && (y <= 10 ? Math.abs(m - 3) <= 1 : y === 11 && m === 3);
          if (arch && t === 0) continue;
          if (arch && t === 1 && Math.abs(m - 3) <= 1) continue;
          c.set(x, y, z, y === 1 ? K.smooth_stone : c.rnd() < 0.3 ? K.mossy : y % 6 === 0 ? K.smooth_stone : K.cobble);
        }
      }
      // contrafuertes escalonados
      if (m === 0) for (let y = 1; y <= 12; y++) { c.set(s * (W + 2), y, z, K.cobble); if (y <= 8) c.set(s * (W + 3), y, z, K.mossy); if (y <= 4) c.set(s * (W + 4), y, z, K.cobble); }
      // bejucos que cuelgan por dentro
      if (c.rnd() < 0.22) { const vy = 3 + Math.floor(c.rnd() * 9); for (let y = vy; y < vy + 5 && y < top; y++) c.set(s * (W - 1), y, z, K.vine); }
      // piedras caídas al pie de los muros rotos
      if (broken && c.rnd() < 0.5) c.set(s * (W - 2 - Math.floor(c.rnd() * 2)), 1, z, c.rnd() < 0.5 ? K.mossy : K.cobble);
    }
  }
  // ábside del fondo con un rosetón vacío y el presbiterio elevado
  for (let x = -W - 1; x <= W + 1; x++) for (const z of [-D - 1, -D]) for (let y = 1; y <= 18 - Math.floor(Math.abs(x) / 3); y++) {
    if (Math.hypot(x, y - 12) <= 2.4) continue;
    c.set(x, y, z, Math.hypot(x, y - 12) <= 3.4 ? K.smooth_stone : c.rnd() < 0.25 ? K.mossy : K.cobble);
  }
  for (let z = -D + 1; z <= -D + 5; z++) for (let x = -W + 1; x <= W - 1; x++) c.set(x, 1, z, K.smooth_stone);
  for (let x = -W + 1; x <= W - 1; x++) c.stair(K.escalera_piedra, x, 1, -D + 6, 0);
  c.fill(-2, 2, -D + 2, 2, 2, -D + 3, K.calcite);
  c.set(0, 3, -D + 2, K.farol);
  // fachada alta (2 de grosor) con arco mayor, puertas laterales, pilastras y ventana redonda
  for (let x = -W - 1; x <= W + 1; x++) {
    const top = 22 - Math.floor(Math.abs(x) * 0.75);
    for (const z of [-1, 0]) for (let y = 1; y <= top; y++) {
      const main = (Math.abs(x) <= 2 && y <= 9) || (Math.abs(x) <= 1 && y === 10) || (x === 0 && y === 11);
      const side = Math.abs(Math.abs(x) - 7) <= 1 && (y <= 5 || (Math.abs(x) === 7 && y === 6));
      const rose = Math.hypot(x, y - 15) <= 1.8;
      const bell = y >= top - 4 && y <= top - 2 && Math.abs(x) <= 1 && top >= 20;
      if (main || side || rose || bell) continue;
      c.set(x, y, z, y === 1 || Math.hypot(x, y - 15) <= 2.9 ? K.smooth_stone : (y + x) % 7 === 0 && c.rnd() < 0.5 ? K.mossy : K.cobble);
    }
    // pilastras que sobresalen
    if ([4, 10].includes(Math.abs(x))) for (let y = 1; y <= top - 3; y++) c.set(x, y, 1, y % 4 === 0 ? K.smooth_stone : K.cobble);
  }
  // jardín por dentro: caminos en cruz, estanque, árboles, flores, bancas y faroles
  const mid = -26;
  for (let z = -D + 7; z <= -2; z++) for (let x = -1; x <= 1; x++) c.set(x, 0, z, K.gravel);
  for (let x = -W + 1; x <= W - 1; x++) for (let z = mid - 1; z <= mid + 1; z++) c.set(x, 0, z, K.gravel);
  c.circle(4.2, (x, z, d) => {
    if (d > 3.3) { c.set(x, 0, z + mid, K.smooth_stone); c.set(x, 1, z + mid, K.losa_lisa); } else c.set(x, 0, z + mid, K.water);
  });
  c.fill(0, 0, mid, 0, 1, mid, K.smooth_stone); c.set(0, 2, mid, K.farol);
  for (const [x, z] of [[-6, -9], [6, -15], [-6, -36], [6, -40], [-7, -20], [7, -32]]) {
    c.fill(x, 1, z, x, 4, z, K.log);
    c.circle(2.4, (dx, dz, d) => { c.set(x + dx, 5, z + dz, K.leaves); if (d <= 1.6) c.set(x + dx, 6, z + dz, K.leaves); });
    c.set(x, 7, z, K.leaves);
  }
  for (let z = -D + 7; z <= -3; z++) for (const x of [-2, 2]) if (c.rnd() < 0.35) c.set(x, 1, z, c.rnd() < 0.5 ? K.flower_red : K.flower_yellow);
  for (let z = -42; z <= -6; z += 9) for (const s of [-1, 1]) c.stair(K.escalera_piedra, s * 4, 1, z, s > 0 ? 3 : 1);
  for (const z of [-10, -40]) for (const x of [-2, 2]) { c.set(x, 1, z, K.cerca); c.set(x, 2, z, K.farol); }
  // columnas caídas tiradas en el pasto
  for (const [x, z, ax] of [[-5, -28, 1], [4, -44, 0], [-8, -12, 0]]) for (let k = 0; k < 3; k++) c.set(x + (ax ? k : 0), 1, z + (ax ? 0 : k), K.mossy);
  c.chest(W - 2, 1, -D + 2, 0, c.loot([[360, 8, 24], [K.mossy, 8, 16], [259, 1, 3], [377, 2, 5], [384, 1, 2], [299, 1, 3]], 6));
  c.placa(3, 1, 3, 0, 'Ruinas de Santiago Apóstol', 'En Cartago. La iglesia se empezó varias veces y los terremotos la botaron cada vez; la de 1910 la dejó así para siempre. Dicen que no se termina por una maldición… hoy es un jardín enorme entre muros de piedra.');
  c.npc(-4, 1, 6, { role: 'guia', name: 'Doña Marta (guía)' });
  c.npc(2, 1, -14, { role: 'vecino', name: 'Novios de Cartago' });
  c.npc(-3, 1, -33, { role: 'beata', name: 'Doña Ofelia' });
}

// ---------- Fortín de Heredia con su parque, 41 x 41 ----------
export function buildFortinGrande(c) {
  const S = 20;
  c.foundation(-S, -S, S, S, K.cobble, K.grass, 30);
  // caminos de piedra en cruz y por las orillas
  for (let z = -S; z <= S; z++) for (let x = -S; x <= S; x++) {
    const path = Math.abs(x) <= 1 || Math.abs(z) <= 1 || Math.abs(x) >= S - 1 || Math.abs(z) >= S - 1 || Math.abs(Math.abs(x) - Math.abs(z)) <= 0;
    if (path) c.set(x, 0, z, (x + z) % 4 === 0 ? K.smooth_stone : K.cobble);
  }
  // pedestal de la torre
  c.circle(8.5, (x, z, d) => { c.set(x, 0, z, K.smooth_stone); if (d > 7.6) c.set(x, 1, z, K.losa_lisa); });
  c.circle(7.4, (x, z) => c.set(x, 1, z, K.smooth_stone));
  for (let x = -1; x <= 1; x++) { c.set(x, 1, -8, K.losa_lisa); c.stair(K.escalera_piedra, x, 1, -7, 2); }
  // la torre: muro de 2 de grosor, zócalo de ladrillo, cornisas y troneras que se abren hacia afuera
  const TOP = 21;
  for (let y = 2; y <= TOP; y++) c.circle(6.2, (x, z, d) => {
    if (d <= 4.2) { c.set(x, y, z, 0); return; }
    const outer = d > 5.2;
    const lvl = y === 5 || y === 6 || y === 11 || y === 12 || y === 17 || y === 18;
    const sx = sector(x, z, 8) * d;
    if (lvl && (outer ? sx < 1.6 : sx < 0.6)) { c.set(x, y, z, 0); return; }
    c.set(x, y, z, y <= 3 ? K.bricks : y === 8 || y === 14 || y === 20 ? K.smooth_stone : K.plaster);
  });
  // pisos con el hueco de la escalera
  for (const fy of [8, 14, 20]) c.circle(5, (x, z) => { if (Math.abs(x) > 1 || Math.abs(z) > 1) c.set(x, fy, z, fy === 20 ? K.smooth_stone : K.planks); });
  c.spiral(K.escalera_piedra, 2, 19, K.smooth_stone);
  // puerta (el muro es doble: se abre el de afuera)
  c.door(0, 2, -5, 2); c.set(0, 2, -6, 0); c.set(0, 3, -6, 0);
  // azotea con almenas, cañones y bandera
  c.circle(6.2, (x, z, d) => { if (d > 5.2) { c.set(x, TOP + 1, z, K.plaster); if (sector(x, z, 16) * d < 0.9) c.set(x, TOP + 2, z, K.plaster); } });
  for (const [x, z, f] of [[0, 4, 0], [4, 0, 1], [-4, 0, 3]]) { c.set(x, TOP + 1, z, K.log); c.set(x, TOP + 2, z, K.basalt); const [ax, az] = f === 0 ? [0, 1] : f === 1 ? [1, 0] : [-1, 0]; c.set(x + ax, TOP + 2, z + az, K.basalt); }
  c.fill(-3, TOP + 1, -3, -3, TOP + 7, -3, K.cerca);
  const stripes = [K.paint_blue, K.plaster, K.repello_rojo, K.repello_rojo, K.plaster, K.paint_blue];
  stripes.forEach((id, i) => c.fill(-8, TOP + 7 - i, -3, -4, TOP + 7 - i, -3, id));
  // museo adentro: estantes de historia, faroles y el cofre del guarda en el segundo piso
  for (let y = 3; y <= 19; y += 6) for (const [x, z] of [[4, 0], [-4, 0], [0, 4]]) c.set(x, y + 2, z, K.lamp);
  for (const [x, z] of [[3, 2], [-3, 2], [2, 3], [-2, 3]]) c.set(x, 2, z, K.bookshelf);
  c.chest(3, 9, -2, 3, c.loot([[360, 10, 30], [379, 2, 6], [374, 2, 5], [259, 1, 3], [327, 6, 16], [326, 1, 1], [258, 2, 5]], 7));
  // quiosco del parque
  const qk = c.frame(12, 12, 0);
  qk.circle(4.4, (x, z, d) => { qk.set(x, 0, z, K.smooth_stone); qk.set(x, 1, z, d > 3.6 ? K.losa_lisa : K.smooth_stone); });
  for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; const x = Math.round(Math.cos(a) * 3.3), z = Math.round(Math.sin(a) * 3.3); qk.fill(x, 2, z, x, 5, z, K.plaster); }
  qk.circle(4.8, (x, z, d) => { qk.set(x, 6, z, d > 4 ? K.losa_teja : K.teja); if (d <= 3.2) qk.set(x, 7, z, K.teja); if (d <= 1.6) qk.set(x, 8, z, K.teja); });
  qk.set(0, 9, 0, K.oro_volcanico); qk.set(0, 5, 0, K.farol);
  // fuente, árboles de mango, bancas, flores y faroles
  c.circle(3.2, (x, z, d) => { c.set(x - 12, 0, z + 12, d > 2.3 ? K.smooth_stone : K.water); if (d > 2.3) c.set(x - 12, 1, z + 12, K.losa_lisa); });
  c.fill(-12, 1, 12, -12, 2, 12, K.smooth_stone); c.set(-12, 3, 12, K.farol);
  for (const [x, z] of [[-13, -13], [13, -13], [-15, -4], [15, 4], [-5, 16], [5, -16]]) {
    c.fill(x, 1, z, x, 4, z, K.log);
    c.circle(2.6, (dx, dz, d) => { c.set(x + dx, 5, z + dz, K.leaves); if (d <= 1.8) c.set(x + dx, 6, z + dz, K.leaves); });
  }
  for (const [x, z, f] of [[-3, -12, 1], [3, -12, 3], [-12, -3, 0], [12, 3, 2], [-3, 13, 1], [3, 18, 3]]) c.stair(K.escalera_tablas, x, 1, z, f);
  for (let k = 0; k < 40; k++) { const x = Math.floor(c.rnd() * 36) - 18, z = Math.floor(c.rnd() * 36) - 18; if (Math.hypot(x, z) > 9.5 && Math.abs(x) > 2 && Math.abs(z) > 2) c.set(x, 1, z, c.rnd() < 0.5 ? K.flower_red : K.flower_yellow); }
  for (const [x, z] of [[-2, -18], [2, 18], [-18, 2], [18, -2], [8, -8], [-8, 8]]) { c.set(x, 1, z, K.cerca); c.set(x, 2, z, K.cerca); c.set(x, 3, z, K.farol); }
  c.placa(2, 1, -9, 2, 'El Fortín de Heredia', 'Torre redonda de 1876 en el corazón de Heredia. Sus troneras son famosas porque se abren hacia afuera, al revés de lo normal. Junto al parque central, es el símbolo de la ciudad de las flores.');
  c.npc(-2, 1, -10, { role: 'guarda', name: 'Don Rodolfo (guarda)' });
  c.npc(8, 1, 10, { role: 'vecino', name: 'Doña Lilliana' });
  c.npc(-10, 1, -6, { role: 'vecino', name: 'Mae Dylan' });
}

// ---------- guanacaste monumental ----------
export function buildGuanacasteGigante(c) {
  const H = 15;
  const put = (x, y, z, id, leaf) => { if (!leaf || c.getMaybe(x, y, z)) c.set(x, y, z, id); };
  // tronco enorme (5 de ancho) con la base más abierta y un hueco por dentro
  for (let y = -3; y <= H; y++) c.circle(y <= 3 ? 2.9 : 2.3, (x, z, d) => {
    const hollow = y >= 1 && y <= 3 && d <= 1.2;
    const door = y >= 1 && y <= 2 && x === 0 && z < 0;
    c.set(x, y, z, hollow || door ? 0 : K.log);
  });
  c.chest(0, 1, 1, 2, c.loot([[384, 2, 5], [360, 6, 20], [377, 2, 6], [279, 1, 3], [277, 1, 3], [299, 1, 2]], 6));
  c.set(1, 1, 0, K.glow_mushroom);
  // raíces gigantes que se abren por el suelo
  for (let k = 0; k < 10; k++) {
    const a = (k / 10) * Math.PI * 2 + c.rnd() * 0.3, L = 7 + Math.floor(c.rnd() * 4);
    for (let r = 2; r <= L; r++) {
      const x = Math.round(Math.cos(a) * r), z = Math.round(Math.sin(a) * r);
      const g = c.ground(x, z);
      const hr = Math.max(1, Math.round(4.5 * (1 - r / (L + 1))));
      for (let y = g - 1; y <= g + hr; y++) c.set(x, y, z, K.log);
    }
  }
  // ramas gruesas y largas, con ramitas
  const tips = [];
  for (let k = 0; k < 7; k++) {
    const a = (k / 7) * Math.PI * 2 + c.rnd() * 0.4;
    for (let r = 1; r <= 13; r++) {
      const x = Math.round(Math.cos(a) * r), z = Math.round(Math.sin(a) * r), y = H + Math.round(r * 0.42);
      put(x, y, z, K.log, false);
      if (r <= 6) { put(x, y - 1, z, K.log, false); put(x + (Math.abs(Math.sin(a)) > 0.7 ? 1 : 0), y, z + (Math.abs(Math.sin(a)) > 0.7 ? 0 : 1), K.log, false); }
      if (r === 8) for (const s of [-1, 1]) for (let q = 1; q <= 5; q++) put(Math.round(x + Math.cos(a + s * 0.9) * q), y + Math.round(q * 0.3), Math.round(z + Math.sin(a + s * 0.9) * q), K.log, false);
    }
    tips.push(a);
  }
  // copa enorme, plana como sombrilla, con la orilla un poco caída
  const Rc = 18, c0 = H + 7;
  for (let z = -Rc - 1; z <= Rc + 1; z++) for (let x = -Rc - 1; x <= Rc + 1; x++) {
    const d = Math.hypot(x, z * 1.08) + c.rnd() * 1.2;
    if (d > Rc) continue;
    if (d > Rc - 3) put(x, c0 - 1, z, K.leaves, true);
    if (c.rnd() > 0.06) put(x, c0, z, K.leaves, true);
    if (d <= Rc - 2) put(x, c0 + 1, z, K.leaves, true);
    if (d <= Rc - 7) put(x, c0 + 2, z, K.leaves, true);
    if (d <= Rc - 12) put(x, c0 + 3, z, K.leaves, true);
  }
  // escalera rústica de losas y tablas que sube alrededor del tronco hasta el mirador
  const ring = [];
  for (let z = -4; z <= 4; z++) for (let x = -4; x <= 4; x++) { const d = Math.hypot(x, z); if (d >= 3.1 && d < 4.1) ring.push([x, z, Math.atan2(z, x)]); }
  ring.sort((p, q) => p[2] - q[2]);
  const start = ring.findIndex(([x, z]) => x === 0 && z < 0);
  const step = (i) => {
    const [x, z] = ring[(start + i) % ring.length];
    const surf = 1 + 0.5 * (i + 1);
    if (surf % 1) c.set(x, Math.floor(surf), z, K.losa_tablas); else c.set(x, surf - 1, z, K.planks);
    for (let y = Math.ceil(surf); y <= Math.ceil(surf) + 2; y++) c.set(x, y, z, 0);
    if (i % 6 === 5) c.set(x, Math.floor(surf - 0.5) - 1, z, K.cerca);
  };
  for (let i = 0; i < 2 * H - 2; i++) step(i);
  // mirador de tablas alrededor del tronco, con baranda; los últimos escalones abren su hueco en el piso
  c.circle(5.2, (x, z, d) => { if (d > 2.4) { c.set(x, H - 1, z, K.planks); if (d > 4.4) c.set(x, H, z, K.cerca); } });
  for (let i = 2 * H - 12; i < 2 * H - 2; i++) step(i);
  c.set(0, H + 1, -5, K.farol);
  const a0 = tips[2];
  c.set(Math.round(Math.cos(a0) * 9), H + 3, Math.round(Math.sin(a0) * 9), K.hive);
  c.chest(4, H, 1, 3, c.loot([[384, 1, 3], [277, 1, 2], [360, 4, 12], [279, 1, 2]], 4));
  c.placa(2, 1, -6, 2, 'Guanacaste monumental', 'El árbol nacional de Costa Rica. Este tiene cientos de años: su copa da sombra a todo un potrero y en sus ramas anidan pájaros. Sus frutos parecen orejas, por eso le dicen guanacaste de oreja.');
  c.npc(-4, 1, -8, { role: 'sabanero', name: 'Don Chalo (sabanero)' });
}
