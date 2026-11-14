// Parques nacionales (generador v6): Marino Ballena con la cola de ballena de arena entrando al mar, Corcovado con su
// estación en la selva, Manuel Antonio con monos en la playa y Tortuguero con canales y tortugas desovando.
// Cada uno con su arco de bienvenida, guardaparques y algún secreto escondido. +z local mira al mar. Sin gráficos.
import { BLOCK_BY_KEY as K } from './blocks.js';

const SEA = 62;

// arco de bienvenida de madera con el rótulo del parque
function arco(c, x, z, title, text) {
  for (const s of [-1, 1]) c.fill(x + s * 4, 1, z, x + s * 4, 5, z, K.log);
  c.fill(x - 5, 6, z, x + 5, 6, z, K.log);
  c.fill(x - 3, 5, z, x + 3, 5, z, K.planks);
  c.fill(x - 4, 7, z, x + 4, 7, z, K.teja);
  c.placa(x, 4, z, 0, title, text);
  for (const s of [-1, 1]) { c.set(x + s * 5, 1, z, K.helecho); c.set(x + s * 6, 1, z + 1, K.bromelia); }
}
// caseta de guardaparques en pilotes con techo de zinc
function caseta(c, x0, z0, ranger) {
  for (const [x, z] of [[x0, z0], [x0 + 6, z0], [x0, z0 + 5], [x0 + 6, z0 + 5]]) { const g = c.ground(x, z); for (let y = Math.min(g, 0); y <= 1; y++) c.set(x, y, z, K.log); }
  for (let z = z0; z <= z0 + 5; z++) for (let x = x0; x <= x0 + 6; x++) {
    c.set(x, 2, z, K.planks);
    const edge = x === x0 || x === x0 + 6 || z === z0 || z === z0 + 5;
    for (let y = 3; y <= 5; y++) c.set(x, y, z, edge ? (y === 4 && (x + z) % 2 ? K.glass : K.paint_green) : 0);
    c.set(x, 6, z, K.zinc);
  }
  c.door(x0 + 3, 3, z0 + 5, 0);
  for (let k = 0; k < 3; k++) c.stair(K.escalera_tablas, x0 + 3, 2 - k, z0 + 6 + k, 2);
  c.set(x0 + 1, 3, z0 + 1, K.bookshelf); c.set(x0 + 5, 5, z0 + 2, K.lamp);
  c.npc(x0 + 3, 3, z0 + 2, { role: 'guardaparques', name: ranger });
}
function palm(c, x, z, h = 6) {
  const g = c.ground(x, z);
  for (let y = g + 1; y <= g + h; y++) c.set(x, y, z, K.jungle_log);
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1], [2, 0], [-2, 0], [0, 2], [0, -2], [1, 1], [-1, -1], [1, -1], [-1, 1]]) c.set(x + dx, g + h + (Math.abs(dx) + Math.abs(dz) > 1 ? 0 : 1), z + dz, K.jungle_leaves);
  c.set(x, g + h + 1, z, K.jungle_leaves);
}

// ---------- Parque Nacional Marino Ballena: la cola de la ballena en la arena ----------
export function buildMarinoBallena(c) {
  const top = SEA - c.oy; // la arena queda justo sobre el agua (marea baja)
  // Como la Punta Uvita de verdad (unos 700 m de largo y 250 m de ancho): un istmo largo de arena que nace ancho
  // en la playa, se angosta y se curva un poco, y al final se abre en dos aletas en media luna con las puntas
  // hacia la playa, alrededor de un islote de roca con árboles. Escala aproximada 1:10.
  const stemX = (z) => 2.5 * Math.sin((z / 52) * Math.PI);
  const stemHW = (z) => (z < 30 ? 3 + 4 * ((30 - z) / 30) ** 2 : 3 + 3 * ((z - 30) / 22) ** 2);
  const inTail = (x, z) => {
    if (z >= 0 && z <= 54 && Math.abs(x - stemX(z)) <= stemHW(z)) return true;
    if (z > 70 || z < 40) return false;
    for (const sd of [-1, 1]) {
      // aleta = elipse grande menos una elipse corrida hacia la playa (queda una media luna)
      const a = sd * 0.42;
      const rot = (cx, cz) => { const dx = x - cx, dz = z - cz; return [dx * Math.cos(a) - dz * Math.sin(a), dx * Math.sin(a) + dz * Math.cos(a)]; };
      const [u1, v1] = rot(sd * 13, 60);
      const [u2, v2] = rot(sd * 14.5, 55);
      const outer = (u1 / 16) ** 2 + (v1 / 7.5) ** 2 <= 1;
      const inner = (u2 / 13) ** 2 + (v2 / 5.2) ** 2 <= 1;
      if (outer && !inner && !(Math.abs(x) < 2.2 && z > 64)) return true;
    }
    return false;
  };
  const isle = (x, z) => Math.hypot(x / 5, (z - 61) / 4) <= 1;
  // bajos de arena: el agua alrededor se ve clarita porque la arena está a un bloque o dos
  for (let z = -4; z <= 78; z++) for (let x = -36; x <= 36; x++) {
    const [wx, wz] = c.w(x, z);
    if (!c.inChunk(wx, wz)) continue; // solo lo de este chunk (la búsqueda de cercanía es cara)
    let near = 99;
    for (let r = 0; r <= 6 && near === 99; r++) for (const [ox, oz] of [[r, 0], [-r, 0], [0, r], [0, -r], [r, r], [-r, -r], [r, -r], [-r, r]]) if (inTail(x + ox, z + oz) || isle(x + ox, z + oz)) { near = r; break; }
    if (near === 99) continue;
    const g = c.ground(x, z);
    if (near === 0) {
      for (let y = Math.min(g, top) - 1; y <= top; y++) c.set(x, y, z, K.sand);
      for (let y = top + 1; y <= top + 5; y++) c.set(x, y, z, 0);
      if (near === 0 && (x * 7 + z * 13) % 23 === 0) c.set(x, top, z, K.gravel); // conchas y piedritas
    } else if (g < top - 1) {
      const sb = top - 1 - Math.min(3, Math.ceil(near / 2));
      for (let y = g; y <= sb; y++) c.set(x, y, z, K.sand);
    }
  }
  // el islote de la punta: roca con musgo y unos arbolitos
  c.circle(5.5, (dx, dz) => {
    const x = dx, z = 61 + Math.round(dz * 0.8);
    if (!isle(x, z)) return;
    const h = Math.round(4 * (1 - Math.hypot(x / 5, (z - 61) / 4)));
    for (let y = top - 1; y <= top + h; y++) c.set(x, y, z, (x + y + z) % 3 ? K.stone : K.mossy);
    c.set(x, top + h + 1, z, h > 2 && (x + z) % 3 === 0 ? K.helecho : 0);
  });
  for (const [x, z] of [[-1, 60], [2, 62]]) palm(c, x, z, 5);
  // playa con almendros y palmeras, arco de bienvenida y caseta
  c.foundation(-22, -26, 22, -3, K.sand, K.sand, 12);
  for (const [x, z] of [[-18, -8], [-12, -18], [14, -10], [19, -20], [-6, -22]]) palm(c, x, z, 6 + ((x + z) & 1));
  arco(c, 0, -6, 'Bienvenidos al Parque Nacional Marino Ballena', 'En Uvita, Puntarenas. La arena y las rocas forman una cola de ballena que solo se ve completa con la marea baja. De julio a noviembre y de diciembre a abril llegan las ballenas jorobadas a tener sus crías.');
  caseta(c, 10, -24, 'Guardaparques de Uvita');
  for (let z = -26; z <= -7; z++) c.set(0, 0, z, K.planks);
  c.placa(-3, 1, -4, 0, 'Reglas del parque', 'No deje basura, no alimente a los animales, no se lleve conchas ni arena. Las ballenas se miran de lejos. ¡Pura vida!');
  // secreto: en la punta de la aleta izquierda hay un cofre enterrado
  // la punta de la aleta izquierda (la más alejada de la playa en x)
  let tx = 0, tz = 0;
  for (let z = 40; z <= 70; z++) for (let x = -36; x < 0; x++) if (inTail(x, z) && x < tx) { tx = x; tz = z; }
  c.chest(tx + 1, top - 1, tz, 0, c.loot([[369, 2, 4], [360, 15, 40], [259, 2, 5], [285, 1, 1]], 5));
  c.set(tx + 1, top, tz, K.sand);
  c.placa(tx + 2, top + 1, tz, 3, '¿Y esta placa?', 'Si llegó hasta la punta de la cola, escarbe justo aquí al lado: los piratas también sabían de la ballena. (Easter egg de NanoBlocks)');
  // ballenas jorobadas y delfines afuera
  // solo donde hay agua honda (que no queden varadas en la arena)
  for (const [x, z, mob, name] of [[-28, 40, 'ballena', 'ballena jorobada'], [30, 46, 'ballena', 'ballenato'], [0, 82, 'ballena', 'ballena madre'], [14, 30, 'delfin', 'delfín del parque']]) {
    if (c.ground(x, z) < top - 3) c.npc(x, top - 3, z, { mob, name });
  }
}

// ---------- Parque Nacional Corcovado ----------
export function buildCorcovado(c) {
  c.foundation(-16, -16, 16, 16, K.dirt, K.grass, 16);
  arco(c, 0, 12, 'Parque Nacional Corcovado', 'En la península de Osa. Lo han llamado el lugar biológicamente más intenso del planeta: dantas, jaguares, cuatro especies de monos y lapas rojas por todo lado.');
  caseta(c, -12, -12, 'Guardaparques de la estación Sirena');
  // plataforma de acampar y sendero
  for (let x = 2; x <= 10; x++) for (let z = -12; z <= -6; z++) c.set(x, 1, z, K.losa_tablas);
  for (const [x, z] of [[4, -10], [8, -8]]) { c.set(x, 2, z, K.wool); c.set(x + 1, 2, z, K.wool); }
  for (let z = -15; z <= 11; z++) c.set(0, 0, z, (z & 1) ? K.gravel : K.dirt);
  // árboles gigantes con bejucos
  for (const [x, z] of [[-9, 4], [10, 6], [-5, -2], [12, -14]]) {
    c.fill(x, 1, z, x, 12, z, K.jungle_log); c.fill(x + 1, 1, z, x + 1, 10, z, K.jungle_log);
    c.circle(4.5, (dx, dz, d) => { c.set(x + dx, 12, z + dz, K.jungle_leaves); if (d < 3) c.set(x + dx, 13, z + dz, K.jungle_leaves); if (d > 3.5 && (dx + dz) % 3 === 0) for (let y = 8; y < 12; y++) c.set(x + dx, y, z + dz, K.vine); });
  }
  for (let k = 0; k < 30; k++) c.set(Math.floor(c.rnd() * 30) - 15, 1, Math.floor(c.rnd() * 30) - 15, k % 3 ? K.helecho : K.bromelia);
  // secreto: el oro de los oreros
  c.chest(13, -1, 12, 3, c.loot([[259, 6, 14], [360, 10, 30], [374, 1, 3]], 4));
  c.placa(14, 1, 11, 3, 'Batea vieja', 'Aquí trabajaban los oreros de Osa buscando oro en las quebradas, antes de que esto fuera parque. Dicen que alguno dejó algo enterrado… justo debajo. (Easter egg)');
  c.npc(-6, 1, 8, { mob: 'lapa', name: 'lapa roja' });
  c.npc(6, 1, 2, { mob: 'lapa', name: 'lapa roja 2' });
  c.npc(-10, 1, -2, { mob: 'danta', name: 'danta de Corcovado' });
  c.npc(9, 1, -2, { mob: 'mono', name: 'mono congo' });
}

// ---------- Parque Nacional Manuel Antonio ----------
export function buildManuelAntonio(c) {
  c.foundation(-16, -20, 16, -2, K.sand, K.sand, 12);
  arco(c, 0, -16, 'Parque Nacional Manuel Antonio', 'En Quepos: selva que baja hasta playas de arena blanca. Monos cara blanca, perezosos y mapaches que se roban la comida de las mochilas.');
  for (const [x, z] of [[-12, -8], [-6, -4], [8, -6], [13, -12], [-14, -16]]) palm(c, x, z, 6);
  c.placa(5, 1, -10, 0, 'Prohibido dar comida a los monos', 'Los monos se enferman con la comida de la gente. Y si usted no les da… igual se la roban. Cuide su almuerzo. (Easter egg: ya se lo robaron)');
  caseta(c, -14, -2, 'Guardaparques de Manuel Antonio');
  for (let z = -20; z <= -3; z++) c.set(1, 0, z, K.planks);
  c.npc(-4, 1, -8, { mob: 'cara_blanca', name: 'mono cara blanca' });
  c.npc(6, 1, -4, { mob: 'cara_blanca', name: 'mono ladrón' });
  c.npc(-10, 1, -12, { mob: 'perezoso', name: 'perezoso del parque' });
  c.npc(3, 1, -6, { role: 'turista', name: 'Turista sin almuerzo' });
}

// ---------- Parque Nacional Tortuguero ----------
export function buildTortuguero(c) {
  c.foundation(-18, -22, 18, -2, K.sand, K.sand, 12);
  arco(c, 0, -18, 'Parque Nacional Tortuguero', 'En el Caribe, solo se llega en lancha o avioneta. Por sus canales pasan manatíes y caimanes, y en sus playas desovan las tortugas verde y baula.');
  // canal con muelle y lanchas
  for (let x = -18; x <= 18; x++) for (let z = -24; z <= -21; z++) { c.set(x, -1, z, K.sand); c.set(x, 0, z, K.water); }
  for (let x = -4; x <= 4; x++) c.set(x, 0, -20, K.planks);
  c.npc(-2, 0, -22, { mob: 'bote', tamed: true, name: 'lancha del canal' });
  // nidos de tortuga en la arena, con estacas
  for (const [x, z] of [[-8, -6], [-3, -4], [5, -5], [10, -8], [-12, -9]]) { c.set(x, 0, z, K.turtle_nest); c.set(x + 1, 1, z, K.cerca); }
  for (const [x, z] of [[-15, -14], [14, -14], [-6, -12], [8, -15]]) palm(c, x, z, 7);
  caseta(c, 10, -12, 'Guardaparques de Tortuguero');
  c.placa(-3, 1, -2, 0, 'Desove de tortugas', 'De noche, con luz roja y en silencio: las tortugas salen del mar a poner sus huevos. Prohibido usar el celular con flash.');
  c.npc(-5, 1, 2, { mob: 'tortuga', name: 'tortuga verde' });
  c.npc(4, 1, 4, { mob: 'tortuga', name: 'tortuga baula' });
}
