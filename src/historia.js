// La historia de supervivencia: «Las cartas de la abuela». La abuela Zenaida le deja al jugador una casa vieja y una tarea
// pendiente: era la última que cuidaba el Corazón de Tiquicia, la esfera de piedra que tenía las noches en paz, y que se
// partió en cuatro pedazos. La campaña va por capítulos, usa los jefes y lugares que ya existen y termina con una noche
// de oleadas en la casa que uno mismo arregló. El estado vive en meta.hist.
import { BLOCK_BY_KEY as K, BLOCKS, SOLID, AIR } from './blocks.js';
import { SEA } from './worldgen.js';
import { structuresNear, structRadius } from './estructuras.js';
import { decir } from './misiones.js';
import { anotar } from './diario.js';
import { casa, zonaCarpa, tickNivelCasa } from './hogar.js';
import { golpearPuertas, rezagadas, puestoSombra } from './asedio.js';
import { zonaFarol } from './nidos.js';
import { difOf } from './supervivencia.js';
import { cuadernoHTML } from './cuaderno.js';
import { prologo } from './prologo.js';
import { zonaCorazon } from './corazon.js';
import { fraseNemesis } from './nemesis.js';
import { CARTAS_ANSELMO, CARTA_PRIMA } from './anselmo_cartas.js';
import { CARTAS_CORREO } from './correo_cartas.js';
import { marcaAnselmo, objetivoAnselmo, eulaliaAnselmo } from './anselmo.js';
import { expedienteEulalia } from './expediente.js';
import { cumpleEulalia } from './cumple.js';

const crafted = (g, ...ids) => ids.some((id) => g.meta.crafted && g.meta.crafted[id]);
// la pechera vale aunque se la hayan encontrado en una ruina
const PECHERAS = [335, 339, 343, 504];
const tienePechera = (g) => crafted(g, ...PECHERAS) || PECHERAS.some((id) => g.inventory.count(id) > 0 || (g.inventory.armor[1] && g.inventory.armor[1].id === id));
const ach = (g, ...keys) => keys.some((k) => g.achievements && g.achievements.has(k));

// ---------- las cartas (y lo que cuenta la gente) ----------
export const CARTAS = [
  { de: 'Abuela Zenaida', titulo: 'La primera carta', texto: 'Mi güila:\n\nSi esto le llegó es porque ya me fui a descansar. No se me ponga triste, que viví noventa y un años y me comí todos los tamales que quise.\n\nLe dejo lo único que tengo: la casa vieja, allá en el monte. Está medio caída, igual que yo. Vaya, arréglela y busque lo que le dejé adentro. Don Tobías le dará una mano los primeros días, aunque habla más que un radio.\n\nY una cosa: cuando oscurezca, no ande afuera. Las Sombras no son cuento de viejas.\n\nCon todo el cariño,\nsu abuela Zenaida' },
  { de: 'Abuela Zenaida', titulo: 'La carta de la mesa', texto: 'Mi güila:\n\nYa vio: el techo tiene más huecos que una calle de pueblo. Tápelos, póngale cama y puerta, y prenda un fueguito. Las Sombras le tienen miedo a una casa donde hay vida, y eso sí es verdad comprobada.\n\nCuando la casa esté lista, baje al pueblo y pregunte por mi comadre, Doña Eulalia. Ella sabe lo que yo cuidaba todos estos años, y se lo va a contar con detalles que ni le pedí.\n\nComa bien, que la vida es larga.\n\nZenaida' },
  { de: 'Lo que contó Doña Eulalia', titulo: 'El Corazón de Tiquicia', texto: '«¡Ay, usted es la cepa de Zenaida! Siéntese.\n\nSu abuela era la última que cuidaba el Corazón de Tiquicia: una esfera de piedra, de las redondas de los antiguos, que tenía la tierra en paz. En el temblor grande se partió en cuatro, y cada pedazo fue a dar donde no debía. Desde entonces las noches son de las Sombras.\n\nLa gente dice que es por falta de alumbrado. La municipalidad dice que está en estudio.\n\nZenaida juntó fuerzas para ir por ellos, pero ya no le dieron las rodillas. Antes de que usted salga a hacerse la gran cosa, póngase algo encima: hágase una pechera de hierro y vuelva a verme. Ella me dejó algo para ese día.»' },
  { de: 'Abuela Zenaida', titulo: 'La carta que guardaba Eulalia', texto: 'Mi güila:\n\nSi Eulalia le dio esto es porque ya anda con hierro encima. Bien.\n\nLos cuatro pedazos los tienen el Murciélago Rey en su caverna, la Sirena en el río, el Señor del Arenal allá abajo y la Arpía allá arriba. Con esta carta va la aguja que fue de mi mamá: cuando se sabe dónde queda lo que sigue, le apunta en la brújula.\n\nPero primero vénzale a una leyenda de las que salen de noche. Las leyendas no son malas, son vecinas que se quedaron sin descanso. Usted tiene que saber que se les puede ganar, porque si no sabe eso, no llega a ningún lado.\n\nZenaida' },
  { de: 'Abuela Zenaida', titulo: 'La carta del corazón', texto: 'Mi güila:\n\nYa ve que se puede. Yo la primera vez lloré del susto y después me comí un gallo pinto entero.\n\nDecía mi mamá que el corazón crece a golpes, y es cierto: de hoy en adelante aguanta más. Cuando junte un pedazo, va a sentir lo mismo.\n\nAhora sí, el primero: el Murciélago Rey, en la caverna. Es un creído, pero bien alimentado. Lleve antorchas de sobra, escudo y algo para comer. No vaya con hambre, que a esa cueva le sobran bocas.\n\nZenaida' },
  { de: 'Abuela Zenaida', titulo: 'El pedazo de la tierra', texto: 'Mi güila:\n\n¡Lo tiene! Sienta cómo pesa: es la tierra misma.\n\nEl que sigue no se gana a golpes. A la Sirena no se le pega; yo lo intenté en el 62 y perdí una chancleta. Búsquela de noche en el río, y no se le quede oyendo el canto, que hunde a cualquiera. Llévele una flor roja: es vanidosa, pero es buena gente.\n\nZenaida' },
  { de: 'Abuela Zenaida', titulo: 'El pedazo del agua', texto: 'Mi güila:\n\nLe dije que era vanidosa.\n\nAhora viene lo feo. El tercer pedazo está en el Inframundo, en manos del Señor del Arenal. Va a necesitar la Llave del volcán y un marco de obsidiana. Abajo no hay agua ni descanso: llévese de todo, deje la casa ordenada y no se me vaya sin comer.\n\nSi le da miedo, está bien. A mí también. Se va igual.\n\nZenaida' },
  { de: 'Abuela Zenaida', titulo: 'El pedazo del fuego', texto: 'Mi güila:\n\nSi está leyendo esto, salió de allá abajo, y eso ya es más de lo que hizo su tío Rigo, que se fue a vender seguros.\n\nFalta uno, y es el más lejos. Para subir a las Tierras del Cielo necesita un marco de calcita y una pluma de quetzal. La Arpía de la Tormenta se lo llevó a lo más alto, porque le gusta que la miren. Los rayos se esquivan rodando. El viento, con el escudo.\n\nYa casi, mi güila.\n\nZenaida' },
  { de: 'Abuela Zenaida', titulo: 'El pedazo del cielo', texto: 'Mi güila:\n\nLos cuatro. Yo nunca pasé de dos.\n\nTráigalos a la casa. Cuando se junten, el Corazón va a llamar a todo lo que anda suelto, y a la que manda a las Sombras: la Sombra Madre, la que salió de la grieta aquella noche. Va a venir a la casa, de noche, y no va a venir sola.\n\nPor eso le pedí que la arreglara. No era por las goteras.\n\nPrepárese bien. Muros, luz, comida, vendas. Espérela adentro y no le abra.\n\nSu abuela, que le tiene tanto cariño' },
  { de: 'Abuela Zenaida', titulo: 'La última carta', texto: 'Mi güila:\n\nEsta se la dejé debajo de la mesa, porque sabía que algún día alguien la iba a leer.\n\nSi amaneció, ya no hay nada que yo le pueda enseñar. Las noches van a seguir teniendo sus sustos, porque esta tierra es así, pero ya no van a ser de ellas: van a ser suyas.\n\nLa casa es suya. El Corazón es suyo. Cuídelo, y cuando le pese la edad, busque a un güila que le haga caso y déjele una carta.\n\nY coma bien, por favor.\n\nPura vida,\nZenaida' },
  // no es de la campaña: la entrega el tío Rigo (rigo.js)
  { de: 'Abuela Zenaida', titulo: 'La póliza', texto: 'Mi güila:\n\nSi esto le llegó, su tío Rigo por fin revisó los papeles, y ya era hora.\n\nLe pagué esa póliza cuarenta años. No porque creyera en el seguro, que es un invento para sacarle plata a la gente, sino porque así él tenía que venir a cobrarme cada mes, y yo lo sentaba a comer.\n\nAsí se cuida a la gente, mi güila: con excusas.\n\nNo sea duro con él. Y no le firme nada sin leer.\n\nZenaida' },
  // los escondites (reliquias.js)
  { de: 'Nota de Zenaida', titulo: 'El primer escondite', texto: 'Mi güila:\n\nYo no confío en los bancos: guardé lo mío en cofrecitos por todo el país, y los fui contando para que no se me olvidara.\n\nEste machete cortó más caña que todos los bueyes de Grecia. No lo preste.\n\nEl siguiente está más lejos. Dicen que uno no conoce el país hasta que le duelen los pies.\n\nZenaida' },
  { de: 'Nota de Zenaida', titulo: 'El segundo escondite', texto: 'Mi güila:\n\nEste delantal aguanta aceite hirviendo, chismes y un par de mordiscos. Mejor que esas pecheras de hierro que pesan como un pecado.\n\nNo me lo vaya a lavar con cloro.\n\nZenaida' },
  { de: 'Nota de Zenaida', titulo: 'El tercer escondite', texto: 'Mi güila:\n\nLa chancleta. Mi mamá me enseñó a tirarla para que volviera sola: no hubo güila en este país que la esquivara, y su tío Rigo todavía se agacha cuando la oye.\n\nLa otra se la quedó la Sirena en el 62. Déjela, que le queda grande.\n\nZenaida' },
  { de: 'Nota de Zenaida', titulo: 'El cuarto escondite', texto: 'Mi güila:\n\nCon este sombrero vi pasar tres terremotos, dos erupciones y un cometa que nadie más vio. Le queda mal a todo el mundo, y por eso nadie se lo roba.\n\nYa falta poco. El último es el que más quería.\n\nZenaida' },
  { de: 'Nota de Zenaida', titulo: 'El último escondite', texto: 'Mi güila:\n\nEl cucharón. Con este le di de comer a medio pueblo, a dos leyendas y a un diputado, que fue el que más comió.\n\nLo demás que le dejé sirve para pelear. Este sirve para lo otro: para que alguien tenga adónde volver.\n\nYa no hay más escondites. Lo que falta lo tiene usted.\n\nZenaida' },
  // la que uno mismo le deja a Yendry (guila.js): el texto se arma con lo que pasó en la partida
  { de: 'Usted', titulo: 'La carta que usted escribió', texto: '' },
  // la libreta de Anselmo y lo que sigue (índices 17 a 22)
  ...CARTAS_ANSELMO,
  CARTA_PRIMA,
  // el correo de Don Chema (índices 24 en adelante)
  ...CARTAS_CORREO,
];

// ---------- la casa de la abuela ----------
const ANCHO = 9, FONDO = 7;
function escogerSitio(g) {
  const p = g.player.body.pos, gen = g.world.gen;
  const base = g.meta.spawn || p;
  // primero cerca y parejo; si no hay, más lejos y con más tolerancia
  for (const [tolerancia, rMax, cerca] of [[2, 130, 45], [3, 220, 45], [5, 320, 30]]) {
    for (let t = 0; t < 300; t++) {
      const a = Math.random() * Math.PI * 2, r = 40 + (t / 300) * (rMax - 40);
      const x = Math.floor(base.x + Math.cos(a) * r), z = Math.floor(base.z + Math.sin(a) * r);
      const c = gen.column(x, z);
      // ni en el agua ni en las cumbres, donde el frío no deja vivir
      if (c.h <= SEA + 1 || c.h > 96 || ['ocean', 'beach', 'manglar', 'volcano', 'snowy', 'paramo'].includes(c.biome)) continue;
      let plano = true;
      for (let dx = -2; dx <= ANCHO + 2 && plano; dx += 2) for (let dz = -2; dz <= FONDO + 2; dz += 2) { const h = gen.column(x + dx, z + dz).h; if (Math.abs(h - c.h) > tolerancia || h <= SEA) { plano = false; break; } }
      if (!plano) continue;
      const v = g.nearestVillage(x, z);
      if (v && v.dist < cerca) continue;
      // structuresNear trae lo de toda la celda: aquí importa lo que de verdad queda encima
      if (structuresNear(gen, x, z, 28).some((q) => Math.hypot(q.x - x, q.z - z) < structRadius(gen, q.type) + 14)) continue;
      return { x, y: c.h, z };
    }
  }
  // último recurso (una isla, un pantano): una casa sobre pilotes, siempre por encima del agua
  const x = Math.floor(base.x) + 30, z = Math.floor(base.z);
  return { x, y: Math.max(gen.column(x, z).h, SEA + 2), z };
}
function construirCasa(g, H) {
  const { x, y, z } = H.casa, w = g.world;
  const set = (bx, by, bz, id) => w.setBlock(bx, by, bz, id);
  // el terreno parejo y limpio
  for (let dx = -1; dx <= ANCHO; dx++) for (let dz = -3; dz <= FONDO; dz++) {
    for (let dy = 1; dy <= 9; dy++) if (w.getBlock(x + dx, y + dy, z + dz) !== AIR) set(x + dx, y + dy, z + dz, AIR);
    // el terreno parejo debajo (hasta dar con suelo: en lo hondo quedan como pilotes)
    for (let dy = 0; dy >= -24; dy--) { if (SOLID[w.getBlock(x + dx, y + dy, z + dz)] && dy < 0) break; set(x + dx, y + dy, z + dz, dy === 0 ? K.cobble : K.dirt); }
  }
  for (let dx = 0; dx < ANCHO; dx++) for (let dz = 0; dz < FONDO; dz++) {
    const borde = dx === 0 || dz === 0 || dx === ANCHO - 1 || dz === FONDO - 1;
    set(x + dx, y, z + dz, K.planks);
    if (borde) {
      const esquina = (dx === 0 || dx === ANCHO - 1) && (dz === 0 || dz === FONDO - 1);
      for (let dy = 1; dy <= 3; dy++) set(x + dx, y + dy, z + dz, esquina ? K.log : dy === 1 ? K.adobe : K.planks);
    }
    set(x + dx, y + 4, z + dz, K.teja || K.planks);
  }
  // la puerta (un hueco al frente), dos ventanas y paredes con años encima
  const puertaX = x + 4;
  set(puertaX, y + 1, z, AIR); set(puertaX, y + 2, z, AIR);
  for (const [vx, vz] of [[x + 2, z], [x + 6, z], [x + ANCHO - 1, z + 3]]) set(vx, y + 2, vz, K.glass);
  set(x + 2, y + 3, z + FONDO - 1, AIR); set(x + 6, y + 3, z + FONDO - 1, AIR);
  // los huecos del techo (lo que uno tiene que tapar)
  const huecos = [];
  for (const [dx, dz] of [[2, 2], [3, 4], [5, 2], [6, 4], [4, 3], [6, 1], [2, 5], [7, 3]]) { set(x + dx, y + 4, z + dz, AIR); huecos.push([x + dx, y + 4, z + dz]); }
  H.huecos = huecos;
  // adentro: la mesa con la carta, el cofre de la abuela y maleza
  set(x + 7, y + 1, z + 5, K.table || K.planks);
  set(x + 1, y + 1, z + 5, K.chest);
  g.stations.placed(K.chest, x + 1, y + 1, z + 5, 0);
  const be = w.getBE(x + 1, y + 1, z + 5);
  if (be && be.slots) {
    [[325, 1, 90], [K.torch, 12], [K.planks, 24], [263, 4], [K.wool, 3], [261, 3]].forEach(([id, n, dur], i) => { be.slots[i] = { id, count: n, ...(dur ? { dur } : {}) }; });
    w.touchBE(x + 1, y + 1, z + 5);
  }
  // lo que se quedó en la casa: nadie lo explica, y más adelante la libreta de Anselmo lo aclara
  for (const [dx, title, text] of [[3, 'Un retrato de boda', 'Ella, con cara de regaño. Él, con cara de que ya almorzó. Alguien lo sigue limpiando.'], [4, 'Un almanaque', 'Del 62, detenido en un jueves de junio. Tiene un mandado apuntado con letra de hombre: «Cigarros».']]) {
    set(x + dx, y + 1, z + 5, K.placa);
    w.setBE(x + dx, y + 1, z + 5, { title, text });
  }
  // el plato de siempre, bajo la ventana: nadie explica por qué (plato.js)
  set(x + 6, y + 1, z + 1, K.plato_vacio);
  (g.meta.platos ||= []).push({ x: x + 6, y: y + 1, z: z + 1, dia: 0 });
  for (const [dx, dz] of [[3, 1], [5, 5], [2, 3], [6, 2]]) if (K.tall_grass) set(x + dx, y + 1, z + dz, K.tall_grass);
  if (K.cobweb) { set(x + 1, y + 3, z + 1, K.cobweb); set(x + 7, y + 3, z + 1, K.cobweb); }
  // el corredor, con su cerca caída
  for (let dx = 0; dx < ANCHO; dx++) if (K.cerca && dx !== 4 && dx % 3 !== 1) set(x + dx, y + 1, z - 2, K.cerca);
  // la tumba de la abuela, en el patio de atrás, con sus flores
  const tx = x + 4, tz = z + FONDO + 2, ty = g.world.gen.column(tx, tz).h;
  let tumbaY = ty;
  while (tumbaY < y + 6 && SOLID[w.getBlock(tx, tumbaY + 1, tz)]) tumbaY++;
  while (tumbaY > y - 8 && !SOLID[w.getBlock(tx, tumbaY, tz)]) tumbaY--;
  if (w.getBlock(tx, tumbaY + 1, tz) === AIR || !SOLID[w.getBlock(tx, tumbaY + 1, tz)]) {
    set(tx, tumbaY + 1, tz, K.placa);
    w.setBE(tx, tumbaY + 1, tz, { title: 'Zenaida', text: 'Aquí descansa Zenaida, que cuidó el Corazón de Tiquicia y nunca dejó a nadie irse sin comer. «Coma bien, que la vida es larga.»' });
    for (const [fx, fz, fl] of [[tx - 1, tz, K.flower_red], [tx + 1, tz, K.flower_yellow || K.flower_red]]) if (fl && SOLID[w.getBlock(fx, tumbaY, fz)] && w.getBlock(fx, tumbaY + 1, fz) === AIR) set(fx, tumbaY + 1, fz, fl);
  }
  H.construida = true;
}
const LUZ = new Set(['torch', 'wall_torch0', 'wall_torch1', 'wall_torch2', 'wall_torch3', 'fogata', 'stove', 'furnace_lit', 'farol', 'lamp'].map((k) => K[k]).filter(Boolean));
function estadoCasa(g, H) {
  const { x, y, z } = H.casa, w = g.world;
  let cama = false, puerta = false, luz = false;
  for (let dx = 0; dx < ANCHO; dx++) for (let dz = 0; dz < FONDO; dz++) for (let dy = 1; dy <= 3; dy++) {
    const id = w.getBlock(x + dx, y + dy, z + dz), b = BLOCKS[id];
    if (!b) continue;
    if (b.bed) cama = true;
    if (b.door) puerta = true;
    if (LUZ.has(id)) luz = true;
  }
  const tapados = (H.huecos || []).filter(([hx, hy, hz]) => SOLID[w.getBlock(hx, hy, hz)]).length;
  return { cama, puerta, luz, tapados, total: (H.huecos || []).length, lista: cama && puerta && luz && tapados === (H.huecos || []).length };
}

// ---------- los capítulos ----------
const cercaDe = (g, q, r) => q && g.dim === 'tierra' && Math.hypot(q.x - g.player.body.pos.x, q.z - g.player.body.pos.z) < r;
const estructura = (g, tipo) => {
  const p = g.player.body.pos;
  if (g.dim !== 'tierra') return null;
  const l = structuresNear(g.world.gen, p.x, p.z, 3200).filter((s) => s.type === tipo);
  l.sort((a, b) => Math.hypot(a.x - p.x, a.z - p.z) - Math.hypot(b.x - p.x, b.z - p.z));
  return l[0] || null;
};
const marcaEstable = (H, k, fn) => { if (!H[k]) { const m = fn(); if (m) H[k] = { x: m.x, z: m.z }; } return H[k] || null; };
const OK = (v) => (v ? '✔' : '✘');
export const PEDAZOS = { tierra: 495, agua: 496, fuego: 497, cielo: 498 };

export const CAPITULOS = [
  {
    titulo: 'La herencia', carta: 0,
    pasos: [{ t: () => 'Llegue a la casa de la abuela (📖 en la brújula): ahí le dejó tablas, comida y una mesa', marca: (g, H) => H.casa, done: (g, H) => H.construida && cercaDe(g, H.casa, 7) }],
  },
  {
    titulo: 'La casa vieja', carta: 1,
    pasos: [{
      t: (g, H) => { const e = H.estado || {}; return `Arregle la casa: cama ${OK(e.cama)} · puerta ${OK(e.puerta)} · luz ${OK(e.luz)} · techo ${e.tapados || 0}/${e.total || 8} (los huecos brillan)`; },
      marca: (g, H) => H.casa,
      done: (g, H) => { if (!H.casa || !H.construida || !g.world.isLoaded(H.casa.x, H.casa.z) || g.dim !== 'tierra') return false; H.estado = estadoCasa(g, H); return H.estado.lista; },
    }],
    fin: (g, H) => { H.hogar = true; g.giveItem(360, 15); g.addXP(30); g.achieve('casa_abuela', 'La casa de la abuela'); g.ui.regionBanner('¡Ya es su casa!', 'Las Sombras ya no nacen cerca, y adentro se recupera más rápido'); },
  },
  {
    titulo: 'La comadre', pasos: [
      { t: () => 'Vaya al pueblo y busque a Doña Eulalia (📖 en la brújula)', marca: (g, H) => (H.eulaliaPos || H.pueblo), done: (g, H) => H.eulaliaHablo >= 1 },
      { t: () => 'Hágase una pechera de hierro y vuelva a ver a Doña Eulalia', marca: (g, H) => (tienePechera(g) ? (H.eulaliaPos || H.pueblo) : null), done: (g, H) => H.eulaliaHablo >= 2 },
    ],
    fin: (g) => { g.giveItem(360, 25); g.addXP(40); },
  },
  {
    titulo: 'Se les puede ganar', carta: 3,
    pasos: [{ t: () => 'Vénzale a una leyenda: de noche, desde el día 4 (Cadejos, Segua, Llorona, Tulevieja…)', done: (g) => !difOf(g).hostiles || !g.settings.hostiles || ach(g, 'vencer_cadejos', 'vencer_segua', 'vencer_llorona', 'vencer_tulevieja', 'vencer_mona', 'vencer_duende', 'vencer_viejo_monte') }],
    fin: (g) => { sumarCorazon(g, 'El corazón crece a golpes'); g.addXP(50); },
  },
  {
    titulo: 'El pedazo de la tierra', carta: 4,
    pasos: [{ t: (g) => (g.world.gen.version >= 12 ? 'Vénzale al Murciélago Rey en su caverna (📖 en la brújula)' : 'Quítele el sombrero a la Tulevieja: ella sabe dónde quedó el pedazo'), marca: (g, H) => (g.world.gen.version >= 12 ? marcaEstable(H, 'mCaverna', () => estructura(g, 'caverna_rey')) : null), done: (g) => ach(g, 'vencer_rey_murcielago') || (g.world.gen.version < 12 && ach(g, 'vencer_tulevieja')) }],
    fin: (g) => { darPedazo(g, 'tierra'); },
  },
  {
    titulo: 'El pedazo del agua', carta: 5,
    pasos: [{ t: () => 'Llévele una flor roja a la Sirena: de noche, junto al agua. Cuando oiga cantar, está cerca', done: (g) => ach(g, 'sirena_flor') }],
    fin: (g) => { darPedazo(g, 'agua'); },
  },
  {
    titulo: 'El pedazo del fuego', carta: 6,
    pasos: [
      { t: () => 'Baje al Inframundo: marco de 10 de obsidiana (cima de volcanes, o se la vende Don Carlos) y la Llave del volcán', done: (g) => ach(g, 'inframundo') },
      { t: () => 'Aguante en el Inframundo: el Señor del Arenal sale cerca de usted a los pocos minutos', done: (g) => ach(g, 'vencer_senor_arenal') },
    ],
    fin: (g) => { darPedazo(g, 'fuego'); },
  },
  {
    titulo: 'El pedazo del cielo', carta: 7,
    pasos: [
      { t: () => 'Suba a las Tierras del Cielo: marco de 10 de calcita (geodas bajo tierra, o Don Carlos) y una pluma de quetzal (la suelta el Murciélago Rey)', done: (g) => ach(g, 'cielo') },
      { t: () => 'Quédese en las islas: la Arpía de la Tormenta baja al rato, y vuelve si se le escapa', done: (g) => ach(g, 'vencer_arpia') },
    ],
    fin: (g) => { darPedazo(g, 'cielo'); },
  },
  {
    titulo: 'La noche larga', carta: 8,
    pasos: [
      { t: () => 'Vuelva a la casa de la abuela con los cuatro pedazos', marca: (g, H) => H.casa, done: (g, H) => cercaDe(g, H.casa, 10) },
      { t: () => 'Prepárese y espere la noche en la casa (si se va lejos, ella también espera)', marca: (g, H) => H.casa, done: (g, H) => !!H.nocheGanada },
    ],
    fin: (g, H) => { H.fin = g.day || 1; sumarCorazon(g, 'El Corazón de Tiquicia late otra vez'); g.addXP(200); g.giveItem(260, 3); g.achieve('corazon_tiquicia', 'El Corazón de Tiquicia'); g.audio.play('aplausos', { ui: true, vol: 0.7 }); g.ui.regionBanner('El Corazón de Tiquicia', 'Amaneció. Las noches ya no son de ellas. Pura vida.'); },
  },
];

function sumarCorazon(g, porque) {
  g.meta.vidaExtra = (g.meta.vidaExtra || 0) + 2;
  g.player.vidaExtra = g.meta.vidaExtra;
  g.player.health = g.player.maxHealth;
  g.ui.toast(`❤ ¡Un corazón más! ${porque}`, 3600);
  g.audio.play('nivel', { ui: true, vol: 0.6 });
  anotar(g, `Gané un corazón más: ${porque}.`, '❤');
}
function darPedazo(g, cual) {
  const H = g.meta.hist;
  (H.pedazos ||= {})[cual] = g.day || 1;
  g.giveItem(PEDAZOS[cual], 1);
  sumarCorazon(g, `El pedazo ${{ tierra: 'de la tierra', agua: 'del agua', fuego: 'del fuego', cielo: 'del cielo' }[cual]} late en la mochila`);
  g.addXP(80);
  g.achieve(`pedazo_${cual}`, `El pedazo ${{ tierra: 'de la tierra', agua: 'del agua', fuego: 'del fuego', cielo: 'del cielo' }[cual]}`);
}

// ---------- entregar cartas ----------
export function entregarCarta(g, i, abrir = false) {
  const H = g.meta.hist;
  if ((H.cartas ||= []).includes(i)) return;
  H.cartas.push(i);
  H.sinLeer = i;
  anotar(g, `Carta: ${CARTAS[i].titulo}.`, '✉');
  g.audio.play('hmm', { ui: true, vol: 0.2 });
  if (abrir && g.ui.state === 'playing') g.ui.openLibreta('cartas');
  else g.ui.toast(`✉ ${CARTAS[i].de}: «${CARTAS[i].titulo}». Léala con C`, 4200);
}
export function cartasHTML(g) {
  const H = g.meta && g.meta.hist;
  if (!H || !H.cartas || !H.cartas.length) return '<p class="lib-nada">Todavía no le ha llegado ninguna carta. La historia es para el modo supervivencia.</p>';
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const orden = [...H.cartas].reverse();
  let h = `<div class="lib-scroll cartas">${cuadernoHTML(g)}`;
  orden.forEach((i, n) => {
    const c = CARTAS[i];
    h += `<article class="carta${n === 0 ? ' nueva' : ''}"><header><b>${esc(c.titulo)}</b><span>${esc(c.de)}</span></header><p>${esc(i === 16 ? H.cartaPropia || '' : c.texto)}</p></article>`;
  });
  H.sinLeer = null;
  return h + '</div>';
}

// ---------- el avance ----------
function estado(g) {
  const M = g.meta;
  if (!M.hist) M.hist = { cap: 0, paso: 0, cartas: [], pedazos: {} };
  return M.hist;
}
export function capituloActual(g) {
  const H = g.meta && g.meta.hist;
  if (!H || H.fin || !CAPITULOS[H.cap]) return null;
  const C = CAPITULOS[H.cap], P = C.pasos[H.paso];
  return { H, C, P, n: H.cap + 1 };
}
export function marcaHistoria(g) {
  const a = capituloActual(g);
  if (!a) return marcaAnselmo(g);
  if (!a.P.marca) return null;
  return a.P.marca(g, a.H);
}
export function objetivoHistoria(g) {
  const a = capituloActual(g);
  if (!a) return objetivoAnselmo(g);
  return { rotulo: `📖 Capítulo ${a.n}/${CAPITULOS.length} · ${a.C.titulo} (C)`, texto: a.P.t(g, a.H) };
}
export function tickHistoria(g) {
  if (g.mode !== 'survival') return;
  const H = estado(g);
  if (g.meta.vidaExtra && g.player.vidaExtra !== g.meta.vidaExtra) g.player.vidaExtra = g.meta.vidaExtra;
  if (g.dim === 'tierra') {
    if (!H.casa) H.casa = escogerSitio(g);
    if (!H.construida && [[-3, -3], [ANCHO + 3, -3], [-3, FONDO + 4], [ANCHO + 3, FONDO + 4]].every(([dx, dz]) => g.world.isLoaded(H.casa.x + dx, H.casa.z + dz))) construirCasa(g, H);
    tickEulalia(g, H);
    tickHogar(g, H);
    tickNivelCasa(g, H);
    tickNocheLarga(g, H);
  }
  if (H.cap === 1 && g.dim === 'tierra' && H.huecos && cercaDe(g, H.casa, 30)) for (const [hx, hy, hz] of H.huecos) if (!SOLID[g.world.getBlock(hx, hy, hz)]) g.particles.burst(hx + 0.5, hy + 0.5, hz + 0.5, [[1, 0.9, 0.4], [1, 1, 0.7]], 4, 0.6);
  // la primera carta llega a los pocos segundos de empezar
  H.t = (H.t || 0) + 1;
  if (H.t === 1 && !H.prologo && H.cap === 0 && H.paso === 0 && !(H.cartas || []).length) { H.prologo = true; prologo(); }
  if (H.cap === 0 && H.paso === 0 && H.t > 9) entregarCarta(g, 0);
  const C = CAPITULOS[H.cap];
  if (!C || H.fin) return;
  const P = C.pasos[H.paso];
  if (!P.done(g, H)) return;
  H.paso++;
  if (H.paso < C.pasos.length) { g.audio.play('nivel', { ui: true, vol: 0.3 }); return; }
  if (C.fin) C.fin(g, H);
  H.cap++; H.paso = 0;
  anotar(g, `Capítulo terminado: ${C.titulo}.`, '📖');
  const sig = CAPITULOS[H.cap];
  if (sig) {
    if (sig.carta != null) entregarCarta(g, sig.carta);
    g.ui.regionBanner(`Capítulo ${H.cap + 1}`, sig.titulo);
  } else entregarCarta(g, 9, true);
}

// ---------- Doña Eulalia ----------
function tickEulalia(g, H) {
  if (H.cap < 2) return;
  const p = g.player.body.pos;
  if (!H.pueblo) { const v = g.nearestVillage(p.x, p.z, 6); if (v) H.pueblo = { x: v.v.x, y: v.v.y, z: v.v.z }; else return; }
  let E = g.entities.mobs.find((m) => !m.dead && m.data && m.data.eulalia);
  if (!E && Math.hypot(H.pueblo.x - p.x, H.pueblo.z - p.z) < 60 && g.world.isLoaded(Math.floor(H.pueblo.x), Math.floor(H.pueblo.z))) {
    const x = Math.floor(H.pueblo.x) + 3, z = Math.floor(H.pueblo.z) + 3;
    let y = (H.pueblo.y ?? 100) + 6; while (y > 2 && (!SOLID[g.world.getBlock(x, y - 1, z)] || SOLID[g.world.getBlock(x, y, z)])) y--;
    E = g.entities.spawnMob('vecino', x + 0.5, y + 0.2, z + 0.5);
    const here = { x, y, z };
    Object.assign(E.data, { home: here, plaza: { ...here }, name: 'Doña Eulalia', role: 'vecino', vid: 'hist:eulalia', seed: 19330, eulalia: true });
    if (E.kind.dress) E.kind.dress(E);
  }
  if (E) {
    H.eulaliaPos = { x: E.body.pos.x, z: E.body.pos.z };
    H.eulaT = (H.eulaT || 0) - 1;
    if (H.cap === 2 && H.eulaT <= 0 && Math.hypot(E.body.pos.x - p.x, E.body.pos.z - p.z) < 14) { H.eulaT = 12; decir(g, E, H.paso === 0 ? '¿Usted es la cepa de Zenaida? ¡Venga, venga!' : '¿Y esa pechera, ya?', 3); }
  }
}
export function historiaInteract(m, g) {
  const H = g.meta.hist;
  if (!m.data.eulalia || !H) return false;
  const nom = 'Doña Eulalia';
  if (eulaliaAnselmo(g)) return true;
  if (H.cap !== 2 && expedienteEulalia(g)) return true;
  if (cumpleEulalia(m, g)) return true;
  if (H.cap === 2 && H.paso === 0) { H.eulaliaHablo = 1; g.ui.dialog(nom, '¡Ay, Dios mío, la misma cara de su abuela! Siéntese, que le cuento…', 3000); entregarCarta(g, 2, true); return true; }
  if (H.cap === 2 && H.paso === 1) {
    if (tienePechera(g)) { H.eulaliaHablo = 2; g.ui.dialog(nom, 'Ahí sí. Tome: esto me lo dejó Zenaida para este día. Y la aguja de su mamá, para que no se pierda.', 5000); return true; }
    g.ui.dialog(nom, 'Todavía no, mi amor: sin pechera de hierro no me voy a responsabilizar por usted. Hierro, horno y mesa.', 4500);
    return true;
  }
  const CONSEJOS = {
    3: 'Las leyendas salen de noche. Lleve escudo: si les para el golpe justo a tiempo, se quedan aturdidas.',
    4: 'El Murciélago Rey vuela rápido. Pelee con la espalda contra la pared y no se le vaya sin antorchas.',
    5: 'Flor roja, de noche, en el río. Y tápese los oídos si hace falta. Zenaida perdió una chancleta en eso.',
    6: 'La obsidiana sale de lo alto de los volcanes, con pico de diamante, y Don Carlos a veces la trae. Allá abajo no se puede dormir ni hay agua: lleve de todo.',
    7: 'La calcita está en las geodas, bajo tierra, y la pluma la suelta el Murciélago Rey. Dicen que la Arpía baja con la tormenta. Ruede cuando vea la marca del rayo, y aguante el viento con el escudo.',
    8: 'Ya viene la noche larga, ¿verdad? Póngale estacas al patio, un cencerro y guarde comida. Y no le abra a nadie.',
  };
  g.ui.dialog(nom, H.fin ? 'Zenaida estaría orgullosa. ¿Ya almorzó?' : (CONSEJOS[H.cap] || 'Coma algo, que la vida es larga.'), 6000);
  return true;
}

// ---------- la casa arreglada ----------
// para /prueba terminada: como si ya hubiera pasado la Noche Larga
export function escenaFinal(g, H) {
  H.cap = CAPITULOS.length; H.paso = 0; H.fin = g.day || 1; H.nocheGanada = true;
  H.pedazos = { tierra: 1, agua: 1, fuego: 1, cielo: 1 };
  entregarCarta(g, 9);
}
export function zonaSegura(g, x, z) {
  if (zonaCarpa(g, x, z) || zonaFarol(g, x, z) || zonaCorazon(g, x, z)) return true;
  const H = g.meta && g.meta.hist;
  if (!H || !H.hogar || !H.casa || g.dim !== 'tierra' || H.noche || g.asedio) return false;
  return Math.hypot(H.casa.x + ANCHO / 2 - x, H.casa.z + FONDO / 2 - z) < casa.radio(g);
}
function tickHogar(g, H) {
  if (!H.hogar || !H.casa) return;
  const p = g.player.body.pos;
  if (!(p.x >= H.casa.x && p.x <= H.casa.x + ANCHO && p.z >= H.casa.z && p.z <= H.casa.z + FONDO && Math.abs(p.y - H.casa.y) < 5)) return;
  // adentro se descansa: vida despacito sin gastar comida
  H.hogarT = (H.hogarT || 0) + 1;
  if (H.hogarT >= 5) { H.hogarT = 0; if (g.player.health < g.player.maxHealth) g.player.health = Math.min(g.player.maxHealth, g.player.health + 1); }
}

// ---------- la noche larga: oleadas en la casa y la Sombra Madre ----------
const OLAS = [
  ['sombra', 'sombra', 'sombra', 'sombra'],
  ['sombra', 'sombra', 'sombra_escudo', 'sombra_hondera', 'sombra_hondera'],
  ['sombra_capitana', 'sombra_escudo', 'sombra_escudo', 'sombra', 'sombra', 'sombra_hondera'],
  ['sombra_madre', 'sombra_escudo', 'sombra_hondera'],
];
function soltarOla(g, H) {
  const N = g.nocheLarga, cx = H.casa.x + ANCHO / 2, cz = H.casa.z + FONDO / 2;
  OLAS[N.ola].forEach((tipo, i) => {
    const a = (i / OLAS[N.ola].length) * Math.PI * 2 + Math.random();
    const r = tipo === 'sombra_madre' ? 16 : 12 + i * 2.5 + Math.random() * 2; // van llegando de a poco
    const q = puestoSombra(g, cx, cz, H.casa.y + 1, a, r);
    if (!q) return;
    const { x, y, z } = q;
    const m = g.entities.spawnMob(tipo, x + 0.5, y + 0.2, z + 0.5);
    m.data.noche = true; m.data.provoked = true; m.data.angry = true;
    if (tipo !== 'sombra_madre') m.health += Math.min(10, Math.floor((g.day || 1) / 3));
    g.particles.burst(x + 0.5, y + 1, z + 0.5, [[0.05, 0.02, 0.1], [0.4, 0.15, 0.5]], 18, 2.2);
    N.mobs.push(m);
  });
  g.audio.play('sombra', { ui: true, vol: 0.8 });
  if (OLAS[N.ola].includes('sombra_madre')) { g.shake = 1.2; g.audio.play('rumble', { ui: true, vol: 0.9 }); g.ui.regionBanner('La Sombra Madre', 'La que salió de la grieta'); } else g.ui.toast(`🌑 Vienen más… (${N.ola + 1}/${OLAS.length})`, 2200);
}
// la Madre llama refuerzos cuando la hieren y se hunde en el suelo para salir al lado de uno (con aviso)
function tickMadre(g, H, N, M) {
  const f = M.health / M.kind.health, p = g.player.body.pos, w = g.world;
  for (const [corte, tipos] of [[0.66, ['sombra', 'sombra_hondera']], [0.33, ['sombra_escudo', 'sombra']]]) {
    if (f > corte || N[`llamo${corte}`]) continue;
    N[`llamo${corte}`] = true;
    g.ui.toast('🌑 ¡La Sombra Madre llama a sus hijas!', 2000);
    g.audio.play('sombra', { ui: true, vol: 0.9 });
    for (const t of tipos) {
      const a = Math.random() * 6.28, x = Math.floor(M.body.pos.x + Math.cos(a) * 4), z = Math.floor(M.body.pos.z + Math.sin(a) * 4);
      let y = Math.floor(M.body.pos.y) + 5; while (y > M.body.pos.y - 8 && !SOLID[w.getBlock(x, y - 1, z)]) y--;
      const o = g.entities.spawnMob(t, x + 0.5, y + 0.2, z + 0.5); o.data.noche = true; o.data.provoked = true; N.mobs.push(o);
    }
  }
  N.saltoT = (N.saltoT ?? 9) - 1;
  if (N.salto) {
    // ya avisó: sale ahí
    const s = N.salto; N.salto = null;
    g.particles.burst(M.body.pos.x, M.body.pos.y + 1, M.body.pos.z, [[0.05, 0.02, 0.1], [0.4, 0.15, 0.5]], 22, 2.4);
    M.body.pos.x = s.x; M.body.pos.y = s.y; M.body.pos.z = s.z; M.body.vel.x = M.body.vel.z = 0;
    g.particles.burst(s.x, s.y + 1, s.z, [[0.05, 0.02, 0.1], [0.4, 0.15, 0.5]], 30, 3);
    g.audio.play('sombra.hurt', { pos: s, vol: 1, pitch: 0.7 });
    g.shake = Math.max(g.shake || 0, 0.5);
  } else if (N.saltoT <= 0) {
    N.saltoT = f < 0.33 ? 6 : 9;
    for (let k = 0; k < 8; k++) {
      const a = Math.random() * 6.28, x = Math.floor(p.x + Math.cos(a) * 3), z = Math.floor(p.z + Math.sin(a) * 3), y = Math.floor(p.y);
      if (SOLID[w.getBlock(x, y - 1, z)] && !SOLID[w.getBlock(x, y, z)] && !SOLID[w.getBlock(x, y + 1, z)]) { N.salto = { x: x + 0.5, y, z: z + 0.5 }; break; }
    }
    // el aviso: el suelo se pone negro donde va a salir
    if (N.salto) for (let k = 0; k < 26; k++) g.particles.spawn(N.salto.x + (Math.random() - 0.5) * 1.4, N.salto.y + 0.1, N.salto.z + (Math.random() - 0.5) * 1.4, [0.25, 0.08, 0.32], 0, 1.4, 0, 1, 0, true);
  }
}
function tickNocheLarga(g, H) {
  const a = capituloActual(g);
  const enPaso = a && a.C.titulo === 'La noche larga' && H.paso === 1;
  let N = g.nocheLarga;
  if (!N) {
    H.noche = false; // si se guardó en plena pelea, no queda marcada para siempre
    if (!enPaso || g.daylight > 0.3 || !cercaDe(g, H.casa, 26) || !g.player.alive) return;
    N = g.nocheLarga = { ola: 0, t: 6, mobs: [], fase: 'espera', puertas: new Map() };
    H.noche = true;
    g.ui.regionBanner('La noche larga', 'El Corazón llama. Algo viene por el monte…');
    g.audio.play('rumble', { ui: true, vol: 0.7 });
    g.shake = 0.8;
    return;
  }
  // mientras dure no amanece
  if (g.time > 0.92) g.time = 0.92;
  if (g.time < 0.55) g.time = 0.7;
  if (!g.player.alive || !cercaDe(g, H.casa, 70)) {
    for (const m of N.mobs) if (!m.dead) m.dead = true;
    g.nocheLarga = null; H.noche = false;
    g.ui.toast('🌑 Las Sombras se retiraron… pero van a volver la próxima noche', 3200);
    return;
  }
  const madre = N.mobs.find((m) => m.type === 'sombra_madre' && !m.dead && !m.dying);
  if (madre) tickMadre(g, H, N, madre);
  N.mobs = N.mobs.filter((m) => !m.dead && !m.dying);
  golpearPuertas(g, H, N);
  if (N.fase === 'espera') { N.t -= 1; if (N.t <= 0) { soltarOla(g, H); N.fase = 'pelea'; N.peleaT = 0; } return; }
  if (N.mobs.length) { rezagadas(g, H, N, madre ? 1e9 : 100); return; }
  N.ola++;
  if (N.ola >= OLAS.length) {
    g.nocheLarga = null; H.noche = false; H.nocheGanada = true;
    g.ui.sleepFade(() => { g.time = 0.02; g.day = (g.day || 1) + 1; }, () => {});
    return;
  }
  N.fase = 'espera'; N.t = 9;
  g.giveItem(263, 1);
  g.ui.toast('🌑 Un respiro… coma algo y reacomódese', 2400);
}
export function limpiarHistoria(g) { if (g.nocheLarga) { for (const m of g.nocheLarga.mobs) m.dead = true; g.nocheLarga = null; if (g.meta && g.meta.hist) g.meta.hist.noche = false; } }

// ---------- el pueblo también habla de la historia ----------
const RUMORES = [
  ['Allá en el monte hay una casa vieja, la de doña Zenaida. Dicen que le dejó todo a una cepa suya.'],
  ['Doña Zenaida siempre decía: casa con fuego no deja entrar a las Sombras. Yo le creo.'],
  ['¿Ya habló con Doña Eulalia? Esa señora sabe de todo, hasta de lo que no ha pasado.'],
  ['Mi abuelo le ganó al Cadejos con un escudo y buena puntería. O eso cuenta él.', 'Las leyendas se aturden si uno les para el golpe justo a tiempo.'],
  ['Dicen que hay un murciélago del tamaño de un carro en una caverna. Yo ni loco voy.', 'El que entra a la caverna del Rey sin antorchas, no sale.'],
  ['Hay noches en que se oye cantar a la Sirena en el río. Dicen que le gustan las flores rojas.', 'A la Sirena no se le pega, ¿oyó? A esa se le lleva serenata o flores.'],
  ['Para bajar al Inframundo hace falta una llave: diamante, oro y obsidiana, eso decía mi tata.', 'Allá abajo no hay agua. Lleve de todo.'],
  ['Con la pluma de un quetzal y un marco de calcita se sube al cielo, dicen.', 'La Arpía baja con la tormenta. Los rayos se esquivan rodando.'],
  ['Algo anda raro por el monte estas noches. Hasta los perros están callados.', 'Dicen que la Sombra Madre salió de la grieta del temblor grande.'],
];
// lo que la gente ya sabe de uno: cada cosa grande que se hace llega al pueblo
function comentarios(g) {
  const M = g.meta, H = M.hist || {}, L = [], R = M.racha || {};
  if (R.dias >= 7) L.push(`¿Es cierto que lleva ${R.dias} días sin que nada le gane? Aquí ya hay apuestas.`);
  if ((M.muertes || 0) >= 5) L.push('Me dijeron que usted se ha muerto varias veces. Se ve bien, para todo lo que ha pasado.');
  if ((M.nidosRotos || 0) >= 3) L.push('Desde que anda partiendo nidos, las noches están más tranquilas. Algo es algo.');
  if (M.canelo && M.canelo.adoptado) L.push('Ese perro era de doña Zenaida. Nadie lo había podido agarrar. Y se fue detrás de usted.');
  if (M.seguro) L.push('¿Le vendió un seguro el Rigo? Lea la letra menuda. A mí me vendió uno contra granizo.');
  if (H.peon) L.push('Don Chepito dice que usted paga a tiempo. Eso aquí es noticia.');
  if (M.inspector && M.inspector.legal === 'permiso') L.push('¿Usted tiene el Permiso de Todo? ¿Sellado siete veces? Déjeme tocarlo.');
  if (M.inspector && M.inspector.legal === 'multa') L.push('¿Le pagó la multa a Porras? A mí también me dijo lo del catastro. Y yo vivo en la plaza.');
  if (M.ceniza && M.ceniza.record >= 5) L.push(`¿${M.ceniza.record} oleadas en la Noche de Ceniza? Con razón se veía esa luz por allá.`);
  if ((H.nivel || 1) >= 4) L.push('Dicen que su casa tiene trofeos. Yo tengo una foto de un primo.');
  if (M.escondites && M.escondites.fin) L.push('Encontró todo lo de doña Zenaida. Ella sabía que alguien iba a ir hasta el último cofre.');
  // lo nuevo del monte: lo que uno ha hecho llega al pueblo
  if (M.pulperiaSalvada) L.push(M.pulperiaSalvada >= 2 ? 'Don Mario ya le dice «el ángel de la pulpería». Se lo juro.' : '¡Usted fue quien sacó a los Chatas de la pulpería! Don Mario no habla de otra cosa.');
  if (M.chataDeudor) L.push(`¿Así que «${M.chataDeudor.nombre}» se le fue con la plata? Ese siempre vuelve a pasar por la carretera. Espérelo.`);
  if ((M.sebuscaHechos || 0) >= 2) L.push('Ya no pegan carteles de «Se busca» sin preguntar primero si usted anda por aquí.');
  if ((M.quemasApagadas || 0) >= 1) L.push('Los de la brigada dicen que usted apaga quemas como si nada. Les hace falta gente así.');
  if (M.trofeos && M.trofeos.trofeo_toro_guaco) L.push('¿Usted toreó al Toro Guaco? Mi tío lo vio una vez y no volvió a salir de noche.');
  if (M.trofeos && M.trofeos.trofeo_bailarin) L.push('Desde que usted le vio los pies al forastero, en los bailes todo el mundo mira para abajo.');
  // los jefes del monte y el Rey (jefes2.js, final.js): el pueblo se entera
  const J2 = M.jefes2 || {};
  if (J2.reina_bananera) L.push('Dicen que usted bajó a la Reina Bananera. Desde entonces en la bananera de Don Lalo ya nadie revisa los racimos con miedo.');
  if (J2.escarabajo_hercules) L.push('¿Fue usted quien le quitó el cuerno a Don Cornudo? Mi abuelo decía que ese escarabajo tumbaba guarumos.');
  if (J2.sapo_tata) L.push('Desde que usted le ganó al Tata Sapo, en el manglar se oyen los sapos más bajito. Como con respeto.');
  if (J2.cascabel_rey) L.push('Los sabaneros dicen que ya se puede pasar por el llano sin oír ese cascabel. Le deben una.');
  if (J2.cangrejo_rey) L.push('Los pescadores de la playa le mandan a decir que gracias por lo del Cangrejo Rey. Que cuando quiera, una pesca gratis.');
  if (J2.ciempies_rey) L.push('¿El Ciempiés Rey? ¿Usted? Yo no entro a una cueva ni que me paguen, y usted fue y lo sacó.');
  if (Object.keys(J2).length >= 6 && !M.reyZopilote) L.push('Seis jefes del monte… Dicen los viejos que con sus seis trofeos se teje una corona, y que en lo más alto hay alguien esperándola.');
  if (M.reyZopilote) L.push('¡Usted fue quien bajó al Rey Zopilote! En la iglesia hasta tocaron las campanas. Ahora las cumbres son de todos.');
  if (M.ermitas && M.ermitas.length >= 3) L.push('Ya vi sus ermitas por los caminos. Bonitas. Hasta la gente se persigna al pasar.');
  // y los consejos de siempre, según lo que ya anda suelto
  const dia = g.day || 1, C = [
    'De noche no ande por la carretera sin necesidad: salen los Chatas. Dicen que con un pañuelo de ellos uno pasa por uno más.',
    'A los saínos, si castañetean, déjelos. Uno no le gana a una manada.',
    'En la playa, si el agua le jala, nade de lado, nunca para la orilla derecho. Así se ahogó un primo de mi cuñada.',
    'En el agua bajita camine arrastrando los pies. Las rayas se espantan solas.',
    'Una culebra con anillos: si el rojo toca al amarillo, aléjese. Si toca al negro, es la buena.',
  ];
  if (dia >= 3) C.push('Al puma no se le da la espalda. Mírelo a los ojos y vaya para atrás, despacio.', 'Si oye que las ánimas pasan rezando, acompáñelas en silencio. Y no se le ocurra pegarles.');
  if (dia >= 4) C.push('El Toro Guaco embiste derecho. Póngase con un palo de mango detrás y quítese a tiempo.', 'Cuando llueve en el volcán, el que oye rugir para arriba tiene cinco segundos.');
  L.push(C[Math.floor(Math.random() * C.length)]);
  return L;
}
export function frasesHistoria(g) {
  const H = g.meta && g.meta.hist;
  if (!H) return [];
  const extra = comentarios(g);
  if (fraseNemesis(g)) extra.push(fraseNemesis(g));
  const nido = g.meta.nidos && g.meta.nidos.length ? ['Dicen que creció un nido de Sombra por el monte. Hay que partirlo con hacha, y no ir sin comida.'] : [];
  if (g.meta.apuros) nido.push(g.meta.apuros >= 3 ? 'Otra vez usted por aquí. Aquí no se le olvida a nadie lo de la plaza.' : '¡Usted fue quien se quedó a defender la plaza! Eso no lo hace cualquiera.');
  if (H.fin) return ['¡Usted es la cepa de doña Zenaida! Desde que juntó el Corazón, se duerme mejor en este pueblo.', 'Hasta la municipalidad quiere ponerle su nombre a una calle. Está en estudio.', ...nido, ...extra];
  return [...(RUMORES[H.cap] || []), ...nido, ...extra];
}
