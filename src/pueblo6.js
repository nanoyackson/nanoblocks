// Pueblos y ciudades ticas del generador v6: cuadras alrededor del parque central con quiosco, iglesia de dos torres,
// municipalidad, escuela con bandera, plaza de deportes, pulpería, soda, minisúper, cantina, panadería, carnicería,
// barbería, farmacia, Ebáis, delegación, salón comunal; calles de asfalto con aceras, postes y cables; casas de bloques,
// de madera y de adobe a lo largo de las avenidas. Las ciudades suman banco, súper, ferretería, gasolinera, taller,
// bomberos, liceo y terminal de buses. Sin gráficos (lo usa el generador).
import { mulberry32 } from './noise.js';
import { BLOCK_BY_KEY as K } from './blocks.js';
import { REGIONES, regionOf } from './regiones.js';

const SEA = 62;
const FLAG = () => [K.paint_blue, K.plaster, K.repello_rojo, K.repello_rojo, K.plaster, K.paint_blue];
const TOWNS = ['San Rafael', 'Santa Bárbara', 'San Isidro', 'Palmares', 'San Ramón', 'Atenas', 'Naranjo', 'Sarchí', 'Tilarán', 'Nicoya', 'Santa Cruz', 'Liberia', 'Turrialba', 'Paraíso', 'Guápiles', 'Siquirres', 'Pérez Zeledón', 'San Vito', 'Upala', 'Los Chiles', 'Esparza', 'Orotina', 'Acosta', 'Puriscal'];
const MEN = ['Don Chepe', 'Don Beto', 'Mae Kevin', 'Don Rigo', 'Jefry', 'Don Tito', 'Maikol', 'Don Lalo', 'Brayan', 'Don Toño', 'Abuelo Pancho', 'Don Minor', 'Yeison', 'Don Olman', 'Steven', 'Don Juvenal'];
const WOMEN = ['Doña Lucía', 'Maritza', 'Doña Flor', 'Yorleny', 'Cindy', 'Doña Toña', 'Abuela Chayo', 'Pamela', 'Doña Mireya', 'Kimberly', 'Doña Cuca', 'Hazel', 'Doña Xinia', 'Dayana', 'Doña Ligia', 'Yendry'];
const HOUSE_COLORS = ['paint_blue', 'paint_green', 'paint_yellow', 'paint_pink', 'plaster', 'repello_rojo'];

// ---------- plano ----------
export function planVillage6(gen, x, z, y, r) {
  const rnd = mulberry32(Math.floor(r * 1e9) ^ 0x6a6a);
  if (r < 0.28) return null; // caserío: el pueblito de siempre (lo arma pueblogen)
  const city = r > 0.8;
  const L = city ? 74 : 56;
  // el nombre sale de la región donde está (Liberia en Guanacaste, Guápiles en el Caribe…)
  const reg = REGIONES[regionOf(gen.column(x, z))];
  const pool = reg && reg.towns.length ? reg.towns : TOWNS;
  const name = pool[Math.floor(rnd() * pool.length)];
  const v = { id: `${x},${z}`, x, z, y, buildings: [], npcs: [], streets: [], R: L + 34, L, city, name };
  const add = (kind, dx, dz, w, d, face, extra = {}) => { const b = { kind, x: x + dx, z: z + dz, w, d, face, ...extra }; v.buildings.push(b); return v.buildings.length - 1; };
  // calles en forma de numeral (#) alrededor del parque, de 7 de ancho con acera
  v.streets.push({ x: x - L, z: z - 16, w: 2 * L + 1, d: 7, axis: 'x' }, { x: x - L, z: z + 10, w: 2 * L + 1, d: 7, axis: 'x' });
  v.streets.push({ x: x - 16, z: z - L, w: 7, d: 2 * L + 1, axis: 'z' }, { x: x + 10, z: z - L, w: 7, d: 2 * L + 1, axis: 'z' });
  add('parque', -9, -9, 19, 19, 0, { name });
  const ig = add('iglesia6', -7, -40, 15, 23, 0);
  add('escuela', -8, 18, 17, 10, 2, { name });
  add('plaza', -9, 31, 19, 13, 0);
  add('municipalidad', 17, -31, 15, 14, 0, { name });
  add('salon', -31, -29, 15, 12, 0, { name });
  const pul = add('pulperia6', 17, -9, 9, 8, 3);
  const soda = add('soda6', 17, 1, 9, 8, 3);
  add('cantina', -25, -9, 9, 8, 1);
  add('panaderia', -25, 1, 9, 8, 1);
  add('farmacia', 17, 17, 9, 8, 2);
  add('minisuper', 28, 17, 10, 9, 2);
  add('ebais', 17, 28, 11, 9, 3);
  add('carniceria', -25, 17, 9, 8, 2);
  add('barberia', -36, 17, 10, 8, 2);
  add('delegacion', -28, 28, 12, 9, 1);
  add('parada', 2, 6, 5, 3, 0);
  add('frutas', L - 6, 18, 5, 4, 2);
  // el campo alrededor del pueblo, según la región: cafetales, potreros, bananales o milpas
  const regKey = regionOf(gen.column(x, z));
  const campo = regKey === 'valle' || regKey === 'nuboso' ? 'cafetal' : regKey === 'guanacaste' || regKey === 'pacifico' ? 'potrero' : regKey === 'caribe' || regKey === 'sur' ? 'bananal' : 'milpa';
  for (const [sx, sz] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) {
    const kind = (sx + sz === 0) && campo !== 'milpa' ? 'milpa' : campo;
    add(kind, sx > 0 ? L + 4 : -(L + 4) - 19, sz > 0 ? 20 : -20 - 19, 20, 20, 0);
  }
  // v7: redondel de toros al oeste y el turno (fiesta con chinamos y rueda) al este, a las afueras
  if (gen.version >= 7) {
    const ex = mulberry32(Math.floor(r * 1e9) ^ 0x7b7b);
    if (ex() < 0.75) add('redondel', -(L + 4) - 26, -13, 27, 27, 1, { name });
    if (ex() < 0.65) add('turno', L + 4, -13, 20, 27, 3, { name });
  }
  // lotes a lo largo de las avenidas: primero los locales grandes de la ciudad, después casas
  const special = city ? ['banco', 'supermercado', 'ferreteria', 'gasolinera', 'taller', 'bomberos', 'liceo', 'terminal', 'llantera', 'cabinas'] : ['ferreteria', 'taller', 'cabinas'];
  const lots = [];
  for (const sx of [1, -1]) for (const [front, face, zf] of [[-17, 0, 'n'], [-9, 2, 's'], [9, 0, 'n'], [17, 2, 's']]) {
    let cur = 39;
    while (true) {
      const big = special.length && lots.length % 3 === 0;
      const w = big ? 13 : 7 + Math.floor(rnd() * 3), d = big ? 11 : 7 + Math.floor(rnd() * 2);
      if (cur + w > L) break;
      const x0 = sx > 0 ? cur : -(cur + w - 1);
      const z0 = zf === 'n' ? front - d + 1 : front;
      lots.push([x0, z0, w, d, face, big]);
      cur += w + 2;
    }
  }
  for (const sz of [1, -1]) for (const [front, face, xf] of [[-17, 3, 'w'], [-9, 1, 'e'], [9, 3, 'w'], [17, 1, 'e']]) {
    let cur = 46;
    while (true) {
      const inner = front === -9 || front === 9;
      const w = inner ? 7 : 7 + Math.floor(rnd() * 3), d = 7 + Math.floor(rnd() * 2);
      if (cur + d > L) break;
      const z0 = sz > 0 ? cur : -(cur + d - 1);
      const x0 = xf === 'w' ? front - w + 1 : front;
      lots.push([x0, z0, w, d, face === 3 ? 1 : 3, false]);
      cur += d + 2;
    }
  }
  for (const [x0, z0, w, d, face, big] of lots) {
    if (big && special.length) add(special.shift(), x0, z0, w, d, face);
    else add('casa6', x0, z0, w, d, face, { color: HOUSE_COLORS[Math.floor(rnd() * HOUSE_COLORS.length)], style: Math.floor(rnd() * 3) });
  }
  // altura de cada edificio; los que caen en agua o en una loma muy alta no se construyen
  v.buildings = v.buildings.filter((b) => {
    if (b.kind === 'parque' || b.kind === 'parada' || b.kind === 'plaza') { b.y = y; return true; }
    if (['cafetal', 'potrero', 'bananal', 'milpa'].includes(b.kind)) { const h = gen.column(b.x + 10, b.z + 10).h; b.y = h; return h >= SEA && Math.abs(h - y) <= 14; }
    const h = gen.column(b.x + (b.w >> 1), b.z + (b.d >> 1)).h;
    b.y = Math.max(SEA + 1, h);
    return h >= SEA && Math.abs(h - y) <= 10;
  });
  const iglesia = v.buildings.find((b) => b.kind === 'iglesia6');
  if (iglesia) v.bell = { x: iglesia.x + 1, y: iglesia.y + 15, z: iglesia.z + iglesia.d - 2 };
  // vecinos
  const mix = (a) => a.map((n) => [rnd(), n]).sort((p, q) => p[0] - q[0]).map((p) => p[1]);
  const men = mix(MEN), women = mix(WOMEN);
  let mi = 0, wi = 0;
  const ROLE = { pulperia6: ['pulpero', 'Don Mario (pulpero)'], soda6: ['sodera', 'Doña Rosa (soda)'], minisuper: ['minisuper', 'Don Wilson (minisúper)'], cantina: ['cantinero', 'Don Cholo (cantina)'],
    panaderia: ['panadera', 'Doña Rocío (panadería)'], carniceria: ['carnicero', 'Don Fello (carnicería)'], barberia: ['barbero', 'Mae Jason (barbería)'], farmacia: ['farmaceutica', 'Dra. Vanessa (farmacia)'],
    ebais: ['doctora', 'Dra. Mónica (Ebáis)'], delegacion: ['policia', 'Oficial Picado'], municipalidad: ['funcionario', 'Don Evaristo (municipalidad)'], escuela: ['maestra', 'Niña Lorena (maestra)'],
    ferreteria: ['ferretero', 'Don Gerardo (ferretería)'], banco: ['cajera', 'Joselyn (cajera)'], supermercado: ['cajero', 'Josué (cajero)'], gasolinera: ['pistero', 'Mae Andrey (bomba)'],
    taller: ['mecanico', 'Don Macho (mecánico)'], bomberos: ['bombero', 'Bombero Solís'], liceo: ['profesor', 'Profe Arturo'], terminal: ['chofer', 'Don Memo (chofer)'], llantera: ['mecanico', 'Mae Brandon (llantera)'],
    cabinas: ['vecino', 'Doña Eida (cabinas)'], redondel: ['montador', 'Mae Kevin (montador)'], turno: ['feriante', 'Doña Lupe (chinamo)'], frutas: ['frutero', 'Don Cristian (frutas)'], salon: ['vecino', 'Doña Marielos (salón comunal)'], parque: ['copero', 'Don Copito (copos)'] };
  v.buildings.forEach((b, i) => {
    const cx = b.x + (b.w >> 1), cz = b.z + (b.d >> 1);
    if (ROLE[b.kind]) v.npcs.push({ role: ROLE[b.kind][0], name: ROLE[b.kind][1], x: cx, z: cz, home: i });
    if (b.kind === 'iglesia6') v.npcs.push({ role: 'beata', name: women[wi++], x: cx, z: cz, home: i });
    if (b.kind === 'municipalidad') for (let k = 0; k < 2; k++) v.npcs.push({ role: 'fila', name: k ? men[mi++ % men.length] : women[wi++ % women.length], x: cx, z: cz, home: i });
    if (b.kind === 'casa6' && rnd() < 0.7) {
      const role = rnd() < 0.25 ? 'sabanero' : 'vecino';
      v.npcs.push({ role, name: role === 'sabanero' || rnd() < 0.5 ? men[mi++ % men.length] : women[wi++ % women.length], x: cx, z: cz, home: i });
    }
  });
  v.pulperia = pul; v.soda = soda; v.iglesia = ig;
  return v;
}

// ---------- calles ----------
export function buildStreets(c, v) {
  for (const s of v.streets) {
    for (let z = s.z; z < s.z + s.d; z++) for (let x = s.x; x < s.x + s.w; x++) {
      if (!c.inChunk(x, z)) continue;
      const h = c.gen.column(x, z).h;
      if (h < SEA - 1) {
        // v13.3.0 (I2): sobre el agua la calle es un puente de concreto con baranda (antes se cortaba)
        if (c.gen.version >= 24 && h >= SEA - 12) {
          const ac = s.axis === 'x' ? z - s.z : x - s.x;
          for (let yy = SEA + 1; yy < SEA + 6; yy++) c.set(x, yy, z, 0);
          c.set(x, SEA, z, K.concreto);
          if (ac === 0 || ac === 6) c.set(x, SEA + 1, z, K.cerca);
        }
        continue;
      }
      const across = s.axis === 'x' ? z - s.z : x - s.x, along = s.axis === 'x' ? x : z;
      const y = Math.max(h, SEA);
      for (let yy = y + 1; yy < y + 8; yy++) c.set(x, yy, z, 0);
      c.set(x, y - 1, z, K.dirt);
      let id = across === 0 || across === 6 ? K.acera : across === 3 && ((along % 6) + 6) % 6 < 3 ? K.asfalto_linea : K.asfalto;
      // algún hueco y algún parche (esto es Costa Rica)
      const hh = Math.abs((x * 73856093) ^ (z * 19349663) ^ c.gen.seed) % 1000;
      if (id === K.asfalto && hh < 6) { c.set(x, y - 1, z, K.dirt); id = hh < 3 ? K.water : 0; }
      else if (id === K.asfalto && hh < 30) id = K.cobble;
      c.set(x, y, z, id);
      // postes cada 9 sobre la acera, con cable de uno al otro
      if (across === 0 && ((along % 9) + 9) % 9 === 0) for (let yy = y + 1; yy <= y + 7; yy++) c.set(x, yy, z, K.poste);
      else if (across === 0) c.set(x, y + 7, z, s.axis === 'x' ? K.cable : K.cable_z);
      if (across === 0 && ((along % 9) + 9) % 9 === 0) c.set(x, y + 6, z, K.farol);
    }
  }
}

// ---------- edificios ----------
// marco local: u a lo ancho del frente, v hacia el fondo (v = 0 es la fachada)
function frameOf(b) {
  const { x, z, w, d } = b, f = b.face ?? 0;
  const U = f === 1 || f === 3 ? d : w, V = f === 1 || f === 3 ? w : d;
  const lp = (u, v) => (f === 0 ? [x + u, z + d - 1 - v] : f === 2 ? [x + w - 1 - u, z + v] : f === 1 ? [x + w - 1 - v, z + u] : [x + v, z + d - 1 - u]);
  return { U, V, lp, f };
}

function local(c, b) {
  const { U, V, lp, f } = frameOf(b);
  const S = (u, dy, v, id) => { const [wx, wz] = lp(u, v); c.set(wx, b.y + dy, wz, id); };
  const BE = (u, dy, v, id, data) => { const [wx, wz] = lp(u, v); c.set(wx, b.y + dy, wz, id); if (c.inChunk(wx, wz)) c.out.push({ x: wx, y: b.y + dy, z: wz, id, be: data }); };
  const fill = (u0, y0, v0, u1, y1, v1, id) => { for (let yy = y0; yy <= y1; yy++) for (let v = v0; v <= v1; v++) for (let u = u0; u <= u1; u++) S(u, yy, v, id); };
  // las escaleras y bancas: f local 0 = mira a la fachada, 2 = al fondo, 1/3 a los lados
  const stairF = (lf) => (lf === 0 ? f : lf === 2 ? (f + 2) % 4 : lf === 1 ? (f + 1) % 4 : (f + 3) % 4);
  return { U, V, f, S, BE, fill, lp, stairF, b };
}

const placa = (k, u, dy, v, title, text) => k.BE(u, dy, v, K.placa, { type: 'placa', facing: k.f, title, text });
const chest = (k, u, dy, v, slots) => k.BE(u, dy, v, K.chest, { type: 'chest', facing: k.f, slots, viejo: true });
function flag(k, u, v, dy0, len = 5) {
  k.fill(u, dy0, v, u, dy0 + 7, v, K.cerca);
  FLAG().forEach((id, i) => k.fill(u + 1, dy0 + 7 - i, v, u + len, dy0 + 7 - i, v, id));
}

// caja genérica: paredes, ventanas, corredor, techo y puerta
function edifice(c, b, o) {
  const k = local(c, b);
  const { U, V, S } = k;
  const H = o.H, P = o.porch || 0;
  c.foundation(b);
  for (let v = 0; v < V; v++) for (let u = 0; u < U; u++) S(u, 0, v, v < P ? (o.porchFloor || K.acera) : (o.floor || K.planks));
  for (let v = P; v < V; v++) for (let u = 0; u < U; u++) {
    const edge = u === 0 || u === U - 1 || v === P || v === V - 1;
    for (let dy = 1; dy <= H; dy++) {
      if (!edge) { S(u, dy, v, 0); continue; }
      const corner = (u === 0 || u === U - 1) && (v === P || v === V - 1);
      let id = corner ? o.corner || o.wall : o.wall;
      if (!corner) {
        if (v === P && o.open) id = dy >= H ? o.wall : 0;
        else if (v === P && o.win === 'big' && dy >= 2 && dy <= 3 && Math.abs(u - (U >> 1)) >= 2) id = K.glass;
        else if (dy === 2 && (u + v) % 3 === 0) id = K.glass;
      }
      if (o.band && v === P && dy === H) id = o.band;
      S(u, dy, v, id);
    }
  }
  if (P) for (let u = 0; u < U; u++) {
    if (u === 0 || u === U - 1) for (let dy = 1; dy <= H; dy++) S(u, dy, 0, o.post || K.log);
    else if (o.rail && Math.abs(u - (U >> 1)) > 0) S(u, 1, 0, o.rail);
  }
  // techo
  const top = H + 1;
  let roofTop = top;
  if (o.roof === 'flat') {
    for (let v = 0; v < V; v++) for (let u = 0; u < U; u++) { S(u, top, v, K.concreto); if (v >= P && (u === 0 || u === U - 1 || v === P || v === V - 1)) S(u, top + 1, v, o.parapet || K.concreto); }
    roofTop = top + 1;
  } else if (o.roof === 'zinc') {
    for (let v = -1; v <= V; v++) {
      const dy = top + Math.floor((V - v) / 4);
      roofTop = Math.max(roofTop, dy);
      for (let u = -1; u <= U; u++) S(u, dy, v, K.zinc);
      if (v >= P && v < V) for (const u of [0, U - 1]) for (let yy = top; yy < dy; yy++) S(u, yy, v, o.wall);
      if (v === P) for (let u = 1; u < U - 1; u++) for (let yy = top; yy < dy; yy++) S(u, yy, v, o.wall);
    }
  } else {
    for (let v = -1; v <= V; v++) {
      const dist = Math.min(v + 1, V - v), dy = top + Math.floor(dist * 0.6);
      roofTop = Math.max(roofTop, dy);
      const step = dist > 0 && Math.floor(dist * 0.6) !== Math.floor((dist - 1) * 0.6);
      for (let u = -1; u <= U; u++) { S(u, dy, v, K.teja); if (step) S(u, dy - 1, v, K.teja); }
      if (v >= P && v < V) for (const u of [0, U - 1]) for (let yy = top; yy < dy - (step ? 1 : 0); yy++) S(u, yy, v, o.wall);
    }
  }
  if (!o.open && o.door !== false) {
    const [wx, wz] = k.lp(U >> 1, P);
    c.door(wx, b.y + 1, wz, b.face);
    if (P) S(U >> 1, 1, 0, 0);
  }
  if (o.sign) placa(k, Math.max(1, (U >> 1) - 2), 2, P, o.sign[0], o.sign[1]);
  if (o.tank) { S(U - 2, roofTop + 1, V - 2, K.tanque_agua); }
  k.top = top; k.roofTop = roofTop; k.P = P;
  return k;
}

// carro de juguete hecho de bloques (a lo largo de u)
function car(k, u0, v0, color) {
  k.fill(u0, 1, v0, u0 + 4, 1, v0 + 1, color);
  for (const u of [u0, u0 + 4]) for (const v of [v0, v0 + 1]) k.S(u, 1, v, K.basalt);
  for (const v of [v0, v0 + 1]) { k.S(u0 + 1, 2, v, K.glass); k.S(u0 + 2, 2, v, color); k.S(u0 + 3, 2, v, K.glass); }
}
function bus(k, u0, v0, color) {
  k.fill(u0, 1, v0, u0 + 10, 1, v0 + 2, color);
  for (const u of [u0 + 1, u0 + 9]) for (const v of [v0, v0 + 2]) k.S(u, 1, v, K.basalt);
  for (let u = u0; u <= u0 + 10; u++) for (let v = v0; v <= v0 + 2; v++) { k.S(u, 2, v, v === v0 + 1 && u > u0 && u < u0 + 10 ? 0 : u % 2 ? K.glass : color); k.S(u, 3, v, K.plaster); }
}

// parcela de campo: se adapta al terreno columna por columna (no aplana la loma)
function parcela(c, b, fn) {
  for (let z = b.z; z < b.z + b.d; z++) for (let x = b.x; x < b.x + b.w; x++) {
    if (!c.inChunk(x, z)) continue;
    const h = c.gen.column(x, z).h;
    if (h < SEA) continue;
    for (let y = h + 1; y < h + 9; y++) c.set(x, y, z, 0);
    const edge = x === b.x || z === b.z || x === b.x + b.w - 1 || z === b.z + b.d - 1;
    fn(x, h, z, edge, x - b.x, z - b.z);
  }
}

const DEC = {
  cafetal(c, b) {
    parcela(c, b, (x, h, z, edge, u, v) => {
      c.set(x, h, z, K.grass);
      if (edge) { if ((u + v) % 3 === 0) c.set(x, h + 1, z, K.cerca); return; }
      if (v % 3 === 1) c.set(x, h + 1, z, (u * 7 + v) % 5 ? K.cafe3 : K.cafe2);
      // árboles de sombra (poró) cada tanto
      if (u % 8 === 4 && v % 9 === 4) { for (let y = h + 1; y <= h + 4; y++) c.set(x, y, z, K.log); for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) c.set(x + dx, h + 5, z + dz, K.leaves); }
    });
    if (c.inChunk(b.x + 10, b.z + 10)) c.out.push({ npc: { role: 'caficultor', name: 'Coyera del cafetal', x: b.x + 10, z: b.z + 10, y: b.y + 1, vx: b.x + 10, vz: b.z + 10, vy: b.y + 1, village: `${b.x},${b.z}:campo` } });
  },
  potrero(c, b) {
    parcela(c, b, (x, h, z, edge, u, v) => {
      c.set(x, h, z, K.grass);
      if (edge) { c.set(x, h + 1, z, (u === 10 && v === 0) ? 0 : K.cerca); return; }
      if (u === 3 && v >= 3 && v <= 6) c.set(x, h, z, K.water);
      if ((u * 13 + v * 7) % 41 === 0) c.set(x, h + 1, z, K.bonita);
    });
    if (c.inChunk(b.x + 10, b.z + 10)) for (let k = 0; k < 3; k++) c.out.push({ npc: { mob: 'vaca', name: `vaca del potrero ${k}`, x: b.x + 6 + k * 4, z: b.z + 10, y: b.y + 1, vx: b.x + 6, vz: b.z + 10, vy: b.y + 1, village: `${b.x},${b.z}:campo` } });
  },
  bananal(c, b) {
    parcela(c, b, (x, h, z, edge, u, v) => {
      c.set(x, h, z, K.grass);
      if (edge || u % 4 !== 2 || v % 4 !== 2) return;
      for (let y = h + 1; y <= h + 3; y++) c.set(x, y, z, K.jungle_log);
      for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1], [0, 0]]) c.set(x + dx, h + 4, z + dz, K.jungle_leaves);
      if ((u + v) % 8 === 4) c.set(x + 1, h + 3, z, K.banana_bunch);
    });
  },
  milpa(c, b) {
    parcela(c, b, (x, h, z, edge, u, v) => {
      if (edge) { c.set(x, h, z, K.grass); if ((u + v) % 4 === 0) c.set(x, h + 1, z, K.cerca); return; }
      if (u % 5 === 0) { c.set(x, h, z, K.water); return; }
      c.set(x, h, z, K.farmland_wet || K.farmland);
      c.set(x, h + 1, z, v % 2 ? K.corn3 : K.beans3 || K.corn3);
    });
  },
  parque(c, b) {
    const k = local(c, b);
    const { S } = k;
    const M = 9;
    for (let v = 0; v < 19; v++) for (let u = 0; u < 19; u++) {
      const [wx, wz] = k.lp(u, v);
      if (!c.inChunk(wx, wz)) continue;
      const h = c.gen.column(wx, wz).h;
      for (let yy = Math.min(h, b.y); yy < b.y; yy++) S(u, yy - b.y, v, K.dirt);
      for (let yy = 1; yy < 10; yy++) S(u, yy, v, 0);
      const du = u - M, dv = v - M;
      const path = Math.abs(du) <= 0 || Math.abs(dv) <= 0 || Math.abs(Math.abs(du) - Math.abs(dv)) === 0 || u === 0 || v === 0 || u === 18 || v === 18;
      S(u, 0, v, path ? K.acera : K.grass);
    }
    // quiosco
    const q = (du, dy, dv, id) => S(M + du, dy, M + dv, id);
    for (let dv = -4; dv <= 4; dv++) for (let du = -4; du <= 4; du++) {
      const d = Math.hypot(du, dv);
      if (d <= 4.4) { q(du, 0, dv, K.smooth_stone); q(du, 1, dv, d > 3.6 ? K.losa_lisa : K.smooth_stone); }
      if (d <= 4.8) q(du, 6, dv, d > 4 ? K.losa_teja : K.teja);
      if (d <= 3.2) q(du, 7, dv, K.teja);
      if (d <= 1.6) q(du, 8, dv, K.teja);
    }
    for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; const du = Math.round(Math.cos(a) * 3.3), dv = Math.round(Math.sin(a) * 3.3); for (let dy = 2; dy <= 5; dy++) q(du, dy, dv, K.plaster); }
    q(0, 5, 0, K.farol); q(0, 9, 0, K.oro_volcanico);
    // árboles de mango y de guarumo, bancas, flores y faroles
    for (const [u, v] of [[3, 3], [15, 3], [3, 15], [15, 15]]) {
      k.fill(u, 1, v, u, 4, v, K.log);
      for (let dv = -2; dv <= 2; dv++) for (let du = -2; du <= 2; du++) { const d = Math.hypot(du, dv); if (d <= 2.5) S(u + du, 5, v + dv, K.leaves); if (d <= 1.6) S(u + du, 6, v + dv, K.leaves); }
    }
    for (const [u, v, lf] of [[6, 2, 0], [12, 2, 0], [2, 6, 1], [2, 12, 1], [16, 6, 3], [16, 12, 3], [6, 16, 2], [12, 16, 2]]) S(u, 1, v, K.escalera_tablas + k.stairF(lf));
    for (const [u, v] of [[1, 1], [17, 1], [1, 17], [17, 17], [9, 1], [9, 17], [1, 9], [17, 9]]) { S(u, 1, v, K.poste); S(u, 2, v, K.poste); S(u, 3, v, K.farol); }
    for (const [u, v] of [[5, 7], [7, 5], [11, 13], [13, 11], [5, 11], [13, 7]]) S(u, 1, v, (u + v) % 2 ? K.flower_red : K.flower_yellow);
    // carrito de copos
    S(13, 1, 4, K.madera_carreta); S(14, 1, 4, K.madera_carreta); S(13, 2, 4, K.cerca); S(14, 2, 4, K.ice);
    if (c.gen.version >= 19) S(4, 1, 1, K.tablon_encargos); // v12.4.12 (C8-A): el tablón de encargos
    placa(k, 9, 1, 13, `Parque central de ${b.name}`, 'El corazón del pueblo: aquí se juntan los vecinos a conversar, los güilas a jugar y los enamorados a pasear. Los domingos hay retreta en el quiosco.');
  },
  iglesia6(c, b) {
    const k = local(c, b);
    const { S, fill, U, V } = k;
    c.foundation(b);
    fill(0, 0, 0, U - 1, 0, V - 1, K.smooth_stone);
    const H = 9, P = 3;
    // nave
    for (let v = P; v < V; v++) for (let u = 0; u < U; u++) {
      const edge = u === 0 || u === U - 1 || v === P || v === V - 1;
      for (let dy = 1; dy <= H; dy++) {
        if (!edge) { S(u, dy, v, 0); continue; }
        const win = (u === 0 || u === U - 1) && dy >= 3 && dy <= 6 && v % 3 === 0 && v < V - 1;
        S(u, dy, v, win ? K.glass : dy === 1 ? K.smooth_stone : K.plaster);
      }
    }
    for (let v = P - 1; v <= V; v++) for (let u = -1; u <= U; u++) {
      const dist = Math.min(u + 1, U - u), dy = H + 1 + Math.floor(dist * 0.7);
      S(u, dy, v, K.teja);
      if (dist > 0 && Math.floor(dist * 0.7) !== Math.floor((dist - 1) * 0.7)) S(u, dy - 1, v, K.teja);
      if ((v === P || v === V - 1) && u >= 0 && u < U) for (let yy = H + 1; yy < dy; yy++) S(u, yy, v, K.plaster);
    }
    // dos torres al frente con campanario y techito en punta
    for (const u0 of [0, U - 4]) {
      for (let dy = 1; dy <= H + 9; dy++) for (let v = 0; v < 4; v++) for (let u = u0; u < u0 + 4; u++) {
        const edge = u === u0 || u === u0 + 3 || v === 0 || v === 3;
        const belfry = dy >= H + 5 && dy <= H + 7 && (u === u0 + 1 || u === u0 + 2 || v === 1 || v === 2);
        S(u, dy, v, edge && !belfry ? (dy === H + 4 || dy === H + 8 ? K.smooth_stone : K.plaster) : 0);
      }
      S(u0 + 1, H + 6, 1, K.lamp);
      for (let s = 0; s < 3; s++) fill(u0 + s, H + 10 + s, s, u0 + 3 - s, H + 10 + s, 3 - s, K.teja);
      S(u0 + 1, H + 13, 1, K.cerca); S(u0 + 1, H + 14, 1, K.oro_volcanico);
    }
    // portada: puerta grande y gradas
    for (let u = 4; u <= U - 5; u++) { S(u, 0, 0, K.escalera_piedra + k.stairF(2)); S(u, 0, 1, K.smooth_stone); S(u, 0, 2, K.smooth_stone); for (let dy = 1; dy <= H; dy++) { S(u, dy, 0, 0); S(u, dy, 1, 0); S(u, dy, 2, 0); } }
    const mid = U >> 1;
    for (const u of [mid - 1, mid + 1]) { const [wx, wz] = k.lp(u, P); c.door(wx, b.y + 1, wz, b.face); }
    S(mid, 1, P, 0); S(mid, 2, P, 0);
    for (let dy = 6; dy <= 8; dy++) S(mid, dy, P, K.glass);
    // bancas, columnas y altar
    for (let v = P + 3; v < V - 4; v += 2) for (let u = 2; u < U - 2; u++) if (Math.abs(u - mid) > 1) S(u, 1, v, K.escalera_tablas + k.stairF(0));
    for (let v = P + 2; v < V - 2; v += 4) for (const u of [2, U - 3]) fill(u, 1, v, u, H, v, K.smooth_stone);
    fill(mid - 2, 1, V - 3, mid + 2, 1, V - 2, K.smooth_stone);
    S(mid, 2, V - 2, K.oro_volcanico); S(mid - 2, 2, V - 2, K.farol); S(mid + 2, 2, V - 2, K.farol);
    for (let v = P + 3; v < V - 2; v += 5) S(mid, H, v, K.lamp);
    placa(k, 3, 1, 0, 'Iglesia del pueblo', 'Cada pueblo tico tiene su iglesia frente al parque. Las campanas llaman a misa y los turnos se hacen en el atrio.');
  },
  escuela(c, b) {
    const k = edifice(c, b, { H: 4, wall: K.plaster, band: K.paint_blue, corner: K.paint_blue, roof: 'zinc', porch: 2, rail: K.verja, post: K.concreto, sign: [`Escuela de ${b.name}`, 'Escuela pública: aquí los güilas aprenden a leer, el himno y a sacar punta con los dientes. A las 12 suena el timbre del recreo.'] });
    const { S, U, V } = k;
    flag(k, 1, -1, k.roofTop - 2);
    for (let v = 4; v < V - 1; v++) S(U >> 1, 1, v, 0);
    for (let v = 4; v < V - 1; v += 2) for (let u = 2; u < U - 2; u++) if (u % 3 !== 0 && Math.abs(u - (U >> 1)) > 0) S(u, 1, v, K.escalera_tablas + k.stairF(0));
    for (let u = 2; u < U - 2; u++) { S(u, 2, V - 2, K.basalt); S(u, 3, V - 2, K.basalt); }
    S(1, 3, 3, K.lamp); S(U - 2, 3, 3, K.lamp);
  },
  municipalidad(c, b) {
    const k = edifice(c, b, { H: 6, wall: K.plaster, corner: K.smooth_stone, roof: 'flat', porch: 3, post: K.smooth_stone, porchFloor: K.smooth_stone, win: 'big', sign: [`Municipalidad de ${b.name}`, 'Horario: lunes a viernes de 8 a 4. Hoy no hay sistema. Traiga copia de la cédula, copia de la copia y una foto tamaño pasaporte. Vuelva mañana.'] });
    const { S, U, V, fill } = k;
    for (const u of [3, 6, U - 7, U - 4]) fill(u, 1, 0, u, 6, 0, K.smooth_stone);
    flag(k, U >> 1, 1, k.roofTop + 1);
    fill(2, 1, V - 4, U - 3, 1, V - 4, K.planks);
    for (let u = 2; u < U - 2; u += 3) S(u, 2, V - 4, K.glass);
    for (let u = 2; u < U - 2; u++) S(u, 1, V - 2, K.bookshelf);
    S(2, 5, 5, K.lamp); S(U - 3, 5, 5, K.lamp);
    chest(k, 1, 1, V - 2, [{ id: 360, count: 3 }, ...new Array(26).fill(null)]);
  },
  salon(c, b) {
    const k = edifice(c, b, { H: 5, wall: K.bloque_concreto, band: K.paint_green, roof: 'zinc', win: 'big', tank: true, sign: [`Salón comunal de ${b.name}`, 'Bingo el sábado, baile el domingo, reunión de la Asociación de Desarrollo el lunes… si llegan.'] });
    const { S, U, V } = k;
    for (let v = 3; v < V - 2; v += 3) for (let u = 2; u < U - 2; u += 4) { S(u, 1, v, K.planks); S(u + 1, 1, v, K.planks); }
    for (let u = 2; u < U - 2; u++) S(u, 1, V - 2, K.losa_tablas);
    S(U >> 1, 4, V >> 1, K.lamp);
  },
  pulperia6(c, b) {
    const k = edifice(c, b, { H: 4, wall: K.paint_yellow, corner: K.log, roof: 'teja', porch: 2, rail: K.cerca, win: 'big', sign: ['Pulpería La Favorita', 'Aquí hay de todo, como en botica. Se fía solo a conocidos (y a veces ni a esos).'] });
    const { S, U, V, fill } = k;
    fill(1, 1, 5, U - 2, 1, 5, K.planks); S(U >> 1, 1, 5, 0);
    for (let u = 1; u < U - 1; u++) { S(u, 1, V - 2, K.estante); S(u, 2, V - 2, K.estante); }
    S(2, 3, 4, K.lamp); S(1, 1, 1, K.escalera_tablas + k.stairF(1));
  },
  soda6(c, b) {
    const k = edifice(c, b, { H: 4, wall: K.paint_green, corner: K.log, roof: 'teja', porch: 2, rail: K.cerca, sign: ['Soda La Cazuelita', 'Casado, gallo pinto, olla de carne los jueves. El fresco de cas es de la casa.'] });
    const { S, U, V } = k;
    for (const [u, v] of [[2, 4], [5, 4], [2, 6]]) { S(u, 1, v, K.planks); S(u + 1, 1, v, K.escalera_tablas + k.stairF(3)); }
    S(U - 2, 1, V - 2, K.stove); k.BE(U - 2, 1, V - 2, K.stove, { type: 'stove', facing: k.f, grid: new Array(9).fill(null) });
    S(U >> 1, 3, 4, K.lamp);
  },
  minisuper(c, b) {
    const k = edifice(c, b, { H: 4, wall: K.bloque_concreto, band: K.repello_rojo, roof: 'flat', win: 'big', parapet: K.repello_rojo, sign: ['Minisúper El Dragón Dorado', 'Abierto de 7 a 10, todos los días, hasta el 1.º de enero. Hay de todo y si no hay, se pide.'] });
    const { S, U, V } = k;
    for (const u of [2, 4, 6]) for (let v = 3; v < V - 1; v++) { S(u, 1, v, K.estante); S(u, 2, v, K.estante); }
    for (let u = 1; u < U - 1; u++) S(u, 1, V - 2, K.estante);
    S(U - 2, 1, 2, K.planks); S(U - 2, 3, 3, K.lamp); S(3, 3, 3, K.lamp);
  },
  cantina(c, b) {
    const k = edifice(c, b, { H: 4, wall: K.adobe, band: K.paint_green, roof: 'zinc', porch: 2, rail: K.cerca, sign: ['Cantina El Último Trago', 'Boca con cada guaro. Prohibido hablar de política y de fútbol (nadie hace caso).'] });
    const { S, U, V, fill } = k;
    fill(1, 1, V - 3, U - 2, 1, V - 3, K.planks);
    for (let u = 1; u < U - 1; u++) S(u, 2, V - 2, K.estante);
    for (let u = 2; u < U - 2; u += 2) S(u, 1, V - 4, K.cerca);
    S(1, 1, 3, K.planks); S(U - 2, 1, 3, K.wool); S(U >> 1, 3, 4, K.lamp);
  },
  panaderia(c, b) {
    const k = edifice(c, b, { H: 4, wall: K.plaster, band: K.paint_yellow, roof: 'teja', win: 'big', sign: ['Panadería El Trigal', 'Pan casero, cajetas, empanadas de chiverre y prestiños. A las 4 de la tarde sale el pan caliente.'] });
    const { S, U, V, fill } = k;
    fill(1, 1, 3, U - 2, 1, 3, K.glass); S(U >> 1, 1, 3, 0);
    S(1, 1, V - 2, K.furnace); S(2, 1, V - 2, K.furnace);
    for (let u = 3; u < U - 1; u++) S(u, 2, V - 2, K.estante);
    S(U >> 1, 3, V >> 1, K.lamp);
  },
  carniceria(c, b) {
    const k = edifice(c, b, { H: 4, wall: K.calcite, band: K.repello_rojo, roof: 'zinc', win: 'big', sign: ['Carnicería El Novillo', 'Posta, bistec, costilla para la olla de carne y chicharrón los domingos.'] });
    const { S, U, fill } = k;
    fill(1, 1, 3, U - 2, 1, 3, K.calcite); S(U >> 1, 1, 3, 0);
    S(U >> 1, 3, 4, K.lamp);
  },
  barberia(c, b) {
    const k = edifice(c, b, { H: 4, wall: K.paint_blue, roof: 'zinc', win: 'big', sign: ['Barbería El Mae Fino', 'Corte, barba y conversación. El degradado sale en 20 minutos (o en 2 horas si llega el primo).'] });
    const { S, U, V } = k;
    for (let u = 2; u < U - 1; u += 3) { S(u, 1, V - 3, K.escalera_tablas + k.stairF(0)); S(u, 2, V - 2, K.glass); S(u, 3, V - 2, K.glass); }
    for (let dy = 1; dy <= 3; dy++) S(0, dy, -1, dy % 2 ? K.repello_rojo : K.plaster);
    S(U >> 1, 3, 3, K.lamp);
  },
  farmacia(c, b) {
    const k = edifice(c, b, { H: 4, wall: K.plaster, band: K.paint_green, roof: 'flat', win: 'big', sign: ['Farmacia La Salud', 'Pastillas, jarabes, suero oral y consejos gratis de la farmacéutica (que sabe más que el doctor).'] });
    const { S, U, V } = k;
    const m = U >> 1;
    for (const [du, dy] of [[0, 0], [-1, 1], [0, 1], [1, 1], [0, 2]]) S(m + du, k.roofTop + 1 + dy, 0, K.paint_green);
    for (let u = 1; u < U - 1; u++) { S(u, 1, V - 2, K.estante); S(u, 2, V - 2, K.estante); }
    for (let u = 1; u < U - 1; u++) if (u !== m) S(u, 1, 4, K.planks);
    S(m, 3, 3, K.lamp);
  },
  ebais(c, b) {
    const k = edifice(c, b, { H: 4, wall: K.plaster, band: K.paint_blue, corner: K.paint_blue, roof: 'zinc', porch: 2, rail: K.verja, post: K.concreto, sign: ['Ebáis', 'Equipo Básico de Atención Integral en Salud. Las fichas se reparten a las 6 de la mañana: llegue a las 5.'] });
    const { S, U, V } = k;
    for (let u = 2; u < U - 1; u += 3) k.BE(u, 1, V - 2, K.bed, { type: 'bed', facing: k.f });
    for (let u = 1; u < U - 1; u += 2) S(u, 1, 3, K.escalera_tablas + k.stairF(0));
    S(U >> 1, 3, V >> 1, K.lamp);
  },
  delegacion(c, b) {
    const k = edifice(c, b, { H: 4, wall: K.paint_blue, band: K.plaster, corner: K.plaster, roof: 'flat', porch: 2, rail: K.verja, post: K.plaster, sign: ['Delegación de policía', 'Fuerza Pública. Costa Rica no tiene ejército desde 1948: aquí cuidan el orden con paciencia y café.'] });
    const { S, U, V, fill } = k;
    flag(k, 1, 1, k.roofTop + 1);
    fill(U - 4, 1, V - 4, U - 4, 3, V - 2, K.verja);
    fill(1, 1, 4, 4, 1, 4, K.planks);
    S(2, 3, 3, K.lamp);
  },
  ferreteria(c, b) {
    const k = edifice(c, b, { H: 5, wall: K.bloque_concreto, band: K.paint_yellow, roof: 'zinc', win: 'big', tank: true, sign: ['Ferretería El Clavo', 'Varilla, cemento, zinc, clavos, tornillos y el consejo del dependiente que sabe hacer de todo.'] });
    const { S, U, V } = k;
    for (const u of [2, 5, 8]) for (let v = 3; v < V - 1; v++) { S(u, 1, v, K.estante); S(u, 2, v, K.estante); }
    for (let v = 3; v < V - 1; v += 2) S(U - 2, 1, v, K.zinc);
    S(U >> 1, 4, V >> 1, K.lamp);
  },
  banco(c, b) {
    const k = edifice(c, b, { H: 6, wall: K.smooth_stone, corner: K.concreto, roof: 'flat', win: 'big', porch: 2, post: K.concreto, porchFloor: K.smooth_stone, sign: ['Banco Nacional del Pueblo', 'Fila única. Tiempo de espera estimado: 2 horas. El cajero automático está fuera de servicio desde el martes.'] });
    const { S, U, V, fill } = k;
    fill(2, 1, V - 4, U - 3, 1, V - 4, K.planks);
    for (let u = 2; u < U - 2; u += 2) fill(u, 2, V - 4, u, 3, V - 4, K.glass);
    chest(k, U - 2, 1, V - 2, [{ id: 360, count: 12 }, { id: 259, count: 2 }, ...new Array(25).fill(null)]);
    S(U >> 1, 5, V >> 1, K.lamp);
  },
  supermercado(c, b) {
    const k = edifice(c, b, { H: 5, wall: K.concreto, band: K.paint_blue, roof: 'flat', win: 'big', sign: ['Súper La Canasta', 'Ofertas de la semana: arroz, frijoles, café y Salsa de la casa. Traiga su bolsa.'] });
    const { S, U, V } = k;
    for (let u = 2; u < U - 2; u += 3) for (let v = 4; v < V - 1; v++) { S(u, 1, v, K.estante); S(u, 2, v, K.estante); }
    for (const u of [2, 5]) S(u, 1, 2, K.planks);
    S(U >> 1, 4, 4, K.lamp); S(U >> 1, 4, V - 3, K.lamp);
  },
  gasolinera(c, b) {
    const k = local(c, b);
    const { S, U, V, fill } = k;
    c.foundation(b);
    fill(0, 0, 0, U - 1, 0, V - 1, K.concreto);
    for (const [u, v] of [[1, 1], [U - 2, 1], [1, 6], [U - 2, 6]]) fill(u, 1, v, u, 5, v, K.concreto);
    fill(0, 6, 0, U - 1, 6, 7, K.concreto); fill(0, 6, 0, U - 1, 6, 0, K.repello_rojo);
    for (const u of [4, U - 5]) { S(u, 1, 3, K.repello_rojo); S(u, 2, 3, K.plaster); S(u, 3, 3, K.farol); }
    S(4, 5, 4, K.lamp); S(U - 5, 5, 4, K.lamp);
    car(k, 5, 4, K.paint_blue);
    // tiendita al fondo
    fill(0, 1, 8, U - 1, 4, V - 1, K.bloque_concreto); fill(1, 1, 9, U - 2, 3, V - 2, 0); fill(0, 5, 8, U - 1, 5, V - 1, K.concreto);
    const [wx, wz] = k.lp(U >> 1, 8); c.door(wx, b.y + 1, wz, b.face);
    placa(k, 2, 2, 8, 'Bomba La Económica', 'Súper, regular y diésel. El combustible viene de un plantel en la costa… que no refina nada, pero eso es otra historia.');
  },
  taller(c, b) {
    const k = edifice(c, b, { H: 5, wall: K.bloque_concreto, roof: 'zinc', open: true, floor: K.concreto, sign: null });
    const { S, U, V } = k;
    car(k, 3, 3, K.repello_rojo);
    for (let v = 2; v < V - 1; v += 2) { S(U - 2, 1, v, K.basalt); S(U - 2, 2, v, K.basalt); }
    for (let u = 1; u < U - 1; u++) S(u, 1, V - 2, K.estante);
    chest(k, 1, 1, V - 2, [{ id: 258, count: 4 }, { id: 257, count: 6 }, ...new Array(25).fill(null)]);
    S(U >> 1, 4, V >> 1, K.lamp);
    placa(k, 1, 2, 1, 'Taller Don Macho', 'Enderezado, pintura, mecánica general. «Se lo tengo para el viernes» (no dice de cuál año).');
  },
  llantera(c, b) {
    const k = edifice(c, b, { H: 4, wall: K.bloque_concreto, band: K.paint_yellow, roof: 'zinc', open: true, floor: K.concreto });
    const { S, U, V } = k;
    for (let u = 1; u < U - 1; u += 2) for (let dy = 1; dy <= 2 + (u % 3); dy++) S(u, dy, V - 2, K.basalt);
    for (let u = 2; u < U - 2; u += 3) S(u, 1, 3, K.basalt);
    placa(k, 1, 2, 1, 'Llantera 24 horas', 'Reparamos llantas pinchadas por huecos. Trabajo no nos falta.');
  },
  bomberos(c, b) {
    const k = edifice(c, b, { H: 6, wall: K.repello_rojo, band: K.plaster, roof: 'flat', open: true, floor: K.concreto });
    const { S, U, V, fill } = k;
    fill(2, 1, 2, 4, 2, 9, K.repello_rojo); fill(2, 3, 3, 4, 3, 5, K.glass); for (const v of [2, 8]) for (const u of [2, 4]) S(u, 1, v, K.basalt);
    S(3, 4, 6, K.lamp);
    for (let v = 3; v < V - 1; v += 2) S(U - 2, 1, v, K.wool);
    placa(k, 1, 2, 1, 'Benemérito Cuerpo de Bomberos', 'Llegan cuando hay que llegar. Emergencias al 9-1-1.');
  },
  liceo(c, b) {
    const k = edifice(c, b, { H: 8, wall: K.plaster, band: K.paint_green, corner: K.paint_green, roof: 'zinc', porch: 2, rail: K.verja, post: K.concreto, sign: [`Liceo de ${b.name}`, 'Colegio público. Aquí se sufre con matemática, se ríe en el recreo y se baila en el festival.'] });
    const { S, U, V, fill } = k;
    fill(1, 4, 3, U - 2, 4, V - 2, K.planks);
    for (let i = 0; i < 4; i++) S(U - 2 - i, 1 + i, V - 2, K.planks);
    for (let i = 0; i < 4; i++) S(U - 2 - i, 4, V - 2, 0);
    for (const dy of [1, 5]) for (let v = 4; v < V - 1; v += 2) for (let u = 2; u < U - 5; u++) if (u % 3) S(u, dy, v, K.escalera_tablas + k.stairF(0));
    flag(k, 1, -1, k.roofTop - 3);
  },
  terminal(c, b) {
    const k = local(c, b);
    const { S, U, V, fill } = k;
    c.foundation(b);
    fill(0, 0, 0, U - 1, 0, V - 1, K.concreto);
    for (let u = 0; u < U; u += 4) for (const v of [0, V - 1]) fill(u, 1, v, u, 4, v, K.poste);
    fill(-1, 5, -1, U, 5, V, K.zinc);
    for (let u = 1; u < U - 1; u++) S(u, 1, V - 2, K.escalera_tablas + k.stairF(0));
    bus(k, 1, 2, K.paint_yellow);
    S(U >> 1, 4, V >> 1, K.lamp);
    placa(k, 0, 1, V - 2, 'Terminal de buses', 'Sale cada media hora (en teoría). El chofer espera a que se llene. Lleve menudo.');
  },
  cabinas(c, b) {
    const k = edifice(c, b, { H: 3, wall: K.paint_pink, roof: 'zinc', porch: 2, rail: K.cerca, door: false, sign: ['Cabinas Pura Vida', 'Cabinas con ventilador y agua caliente (a veces). ₡20 000 la noche. Pregunte por Doña Eida.'] });
    const { S, U, V } = k;
    for (let u = 2; u < U - 1; u += 4) { const [wx, wz] = k.lp(u, 2); c.door(wx, b.y + 1, wz, b.face); k.BE(u, 1, V - 2, K.bed, { type: 'bed', facing: k.f }); }
    for (let u = 4; u < U - 1; u += 4) for (let v = 3; v < V - 1; v++) for (let dy = 1; dy <= 3; dy++) S(u, dy, v, K.paint_pink);
  },
  frutas(c, b) {
    const k = local(c, b);
    const { S, U, V, fill } = k;
    c.foundation(b);
    fill(0, 0, 0, U - 1, 0, V - 1, K.gravel);
    for (const [u, v] of [[0, 0], [U - 1, 0], [0, V - 1], [U - 1, V - 1]]) fill(u, 1, v, u, 3, v, K.log);
    fill(-1, 4, -1, U, 4, V, K.zinc);
    fill(1, 1, 0, U - 2, 1, 0, K.planks);
    S(1, 2, 0, K.banana_bunch); S(U - 2, 2, 0, K.banana_bunch);
    placa(k, U >> 1, 1, 1, 'Venta de frutas', '¡Mango, piña, papaya, sandía, pipas frías! Todo de la zona, recién bajado.');
  },
  // redondel de toros: ruedo de arena, barrera de tablas, gradería, toril y el toro
  redondel(c, b) {
    const k = local(c, b);
    const { S } = k;
    const M = 13;
    c.foundation(b);
    for (let v = 0; v < 27; v++) for (let u = 0; u < 27; u++) {
      const d = Math.hypot(u - M, v - M);
      for (let y = 1; y < 9; y++) S(u, y, v, 0);
      if (d <= 9) S(u, 0, v, K.sand);
      else if (d <= 10.2) { S(u, 0, v, K.planks); S(u, 1, v, K.planks); S(u, 2, v, (u + v) % 2 ? K.planks : K.cerca); }
      else if (d <= 13.2) {
        // gradería: tres escalones que suben hacia afuera
        const step = Math.min(3, Math.floor(d - 10.2) + 1);
        for (let y = 0; y < step; y++) S(u, y, v, K.planks);
        S(u, step, v, (u * 3 + v) % 7 === 0 ? K.cerca : 0);
      } else S(u, 0, v, K.grass);
    }
    // postes con bombillos alrededor
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2, u = Math.round(M + Math.cos(a) * 12.6), v = Math.round(M + Math.sin(a) * 12.6);
      for (let y = 3; y <= 7; y++) S(u, y, v, K.poste);
      S(u, 8, v, K.farol);
    }
    // toril con portón de verja hacia el ruedo
    k.fill(M - 2, 1, 0, M + 2, 3, 2, K.planks); k.fill(M - 1, 1, 1, M + 1, 2, 1, 0);
    k.fill(M - 1, 1, 3, M + 1, 2, 3, K.verja);
    k.fill(M - 2, 4, 0, M + 2, 4, 2, K.zinc);
    // la cabina del narrador
    k.fill(M - 2, 4, 25, M + 2, 4, 26, K.planks); S(M, 5, 25, K.lamp);
    placa(k, M, 1, 26, `Redondel de ${b.name}`, '¡Toros a la tica! Aquí no se mata al toro: los «improvisados» se tiran al ruedo a ver cuánto aguantan antes de que el toro los levante. La cimarrona toca, el narrador grita y la gradería se ríe. ¡Entre bajo su propio riesgo!');
    const [tx, tz] = k.lp(M, M - 3);
    if (c.inChunk(tx, tz)) c.out.push({ npc: { mob: 'vaca', name: 'el toro Malacrianza II', x: tx, z: tz, y: b.y + 1, vx: tx, vz: tz, vy: b.y + 1, village: `${b.x},${b.z}:redondel` } });
    const [zx, zz] = k.lp(M, M);
    if (c.inChunk(zx, zz)) c.out.push({ zone: { kind: 'redondel', x: zx, y: b.y, z: zz, r: 9, id: `${b.x},${b.z}:redondel` } });
  },
  // el turno: chinamos de comida, la rueda de Chicago, tómbola y bombetas
  turno(c, b) {
    const k = local(c, b);
    const { S, U, V } = k;
    c.foundation(b);
    for (let v = 0; v < V; v++) for (let u = 0; u < U; u++) { for (let y = 1; y < 15; y++) S(u, y, v, 0); S(u, 0, v, (u + v) % 5 ? K.grass : K.gravel); }
    for (let v = 0; v < V; v++) S(U >> 1, 0, v, K.gravel);
    // chinamos a los dos lados del pasillo: postes, mostrador y techo de zinc con franja de color
    const colors = [K.paint_blue, K.repello_rojo, K.paint_yellow, K.paint_green, K.paint_pink];
    let n = 0;
    for (const u0 of [1, U - 6]) for (let v0 = 2; v0 + 4 < V - 10; v0 += 6) {
      const col = colors[n++ % colors.length];
      for (const [du, dv] of [[0, 0], [4, 0], [0, 4], [4, 4]]) k.fill(u0 + du, 1, v0 + dv, u0 + du, 3, v0 + dv, K.log);
      k.fill(u0, 4, v0, u0 + 4, 4, v0 + 4, K.zinc);
      k.fill(u0, 4, v0, u0 + 4, 4, v0, col);
      const front = u0 === 1 ? u0 + 4 : u0;
      k.fill(front, 1, v0 + 1, front, 1, v0 + 3, K.planks);
      S(u0 + 2, 1, v0 + 2, n % 2 ? K.stove : K.table);
    }
    // la rueda de Chicago al fondo
    const cu = U >> 1, cv = V - 4, R = 6;
    for (let a = 0; a < 64; a++) {
      const t = (a / 64) * Math.PI * 2;
      S(cu + Math.round(Math.cos(t) * R), 8 + Math.round(Math.sin(t) * R), cv, K.metal_rojo);
    }
    for (let i = 0; i < 8; i++) {
      const t = (i / 8) * Math.PI * 2;
      for (let s = 1; s < R; s++) S(cu + Math.round(Math.cos(t) * s), 8 + Math.round(Math.sin(t) * s), cv, K.varilla);
      S(cu + Math.round(Math.cos(t) * (R + 1)), 8 + Math.round(Math.sin(t) * (R + 1)), cv, i % 2 ? K.paint_yellow : K.paint_blue);
    }
    for (const du of [-1, 1]) for (let y = 1; y <= 7; y++) S(cu + du * Math.max(0, Math.round((7 - y) / 2)), y, cv - 1, K.andamio);
    S(cu, 8, cv, K.lamp);
    // tómbola: cofre con bombetas, copos y cajetas
    chest(k, U - 3, 1, V - 2, [{ id: 374, count: 6 }, { id: 383, count: 2 }, { id: 396, count: 2 }, ...new Array(24).fill(null)]);
    placa(k, cu, 1, 1, `Turno de ${b.name}`, '¡Fiestas patronales! Hay chinamos con vigorón, tamal asado, churros y cajetas, la rueda de Chicago, la tómbola y bombetas toda la noche. Lo que se recoge es para el salón comunal.');
    const [zx, zz] = k.lp(cu, V >> 1);
    if (c.inChunk(zx, zz)) c.out.push({ zone: { kind: 'turno', x: zx, y: b.y, z: zz, r: 16, id: `${b.x},${b.z}:turno` } });
  },
  casa6(c, b) {
    const st = b.style;
    const wall = st === 0 ? K.bloque_concreto : st === 1 ? K[b.color] || K.paint_blue : K.adobe;
    const k = edifice(c, b, { H: 4, wall, band: st === 0 ? K[b.color] : null, corner: st === 2 ? K.log : null, roof: st === 2 ? 'teja' : 'zinc', porch: 2, rail: st === 0 ? K.verja : K.cerca, post: st === 0 ? K.concreto : K.log, porchFloor: st === 2 ? K.adobe : K.acera, tank: st !== 2 });
    const { S, U, V } = k;
    k.BE(1, 1, V - 2, K.bed, { type: 'bed', facing: k.f });
    k.BE(U - 2, 1, V - 2, K.stove, { type: 'stove', facing: k.f, grid: new Array(9).fill(null) });
    k.BE(U - 2, 1, 3, K.table, { type: 'table', grid: new Array(9).fill(null) });
    S(1, 3, 3, K.lamp);
    // matas en el corredor y alguna hamaca
    S(1, 1, 1, (b.x + b.z) % 2 ? K.flower_red : K.flower_yellow);
    if (U > 7) S(U - 2, 1, 1, K.escalera_tablas + k.stairF(3));
  },
};

export function buildKind6(c, b) {
  const fn = DEC[b.kind];
  if (!fn) return false;
  fn(c, b);
  return true;
}
