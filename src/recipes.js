// Recetas de crafteo en cuadrícula (con forma o sin forma) y recetas del horno.
import { BLOCK_BY_KEY as K, TOOL_IDS as TL, ARMOR_IDS as AR } from './blocks.js';

const STICK = 256, COAL = 257, IRON = 258, GOLD = 259, DIAMOND = 260, APPLE = 261, MEAT = 262;
const BREAD = 263, BRICK = 264, COOKED = 265, DOOR = 266;
const CORN = 268, BEANS = 269, TORTILLA = 270, LEATHER = 271, QUARTZ = 272, JADE_SHARD = 273, JADE = 274;

// pattern: filas de igual largo; ' ' = vacío. key: letra -> id
const shaped = (out, n, pattern, key) => ({ out: [out, n], pattern, key });
const shapeless = (out, n, items) => ({ out: [out, n], items });
// recetas del fogón: cook = true; returns = lo que te devuelve (el balde vacío)
const cook = (out, n, items, returns) => ({ out: [out, n], items, cook: true, returns });

const TOOLS = [];
for (const [mat, m] of [['wood', K.planks], ['stone', K.cobble], ['iron', IRON], ['diamond', DIAMOND]]) {
  TOOLS.push(
    shaped(TL[`${mat}_pickaxe`], 1, ['MMM', ' S ', ' S '], { M: m, S: STICK }),
    shaped(TL[`${mat}_axe`], 1, ['MM', 'MS', ' S'], { M: m, S: STICK }),
    shaped(TL[`${mat}_shovel`], 1, ['M', 'S', 'S'], { M: m, S: STICK }),
    shaped(TL[`${mat}_sword`], 1, ['M', 'M', 'S'], { M: m, S: STICK }),
    shaped(TL[`${mat}_hoe`], 1, ['MM', ' S', ' S'], { M: m, S: STICK }),
  );
}
// el jade mejora las herramientas de diamante (sin perder el trabajo hecho)
for (const kind of ['pickaxe', 'axe', 'shovel', 'sword', 'hoe']) TOOLS.push(shapeless(TL[`jade_${kind}`], 1, [TL[`diamond_${kind}`], JADE]));
const ARMOR = [];
for (const [mat, m] of [['leather', LEATHER], ['iron', IRON], ['diamond', DIAMOND]]) {
  ARMOR.push(
    shaped(AR[`${mat}_head`], 1, ['MMM', 'M M'], { M: m }),
    shaped(AR[`${mat}_chest`], 1, ['M M', 'MMM', 'MMM'], { M: m }),
    shaped(AR[`${mat}_legs`], 1, ['MMM', 'M M', 'M M'], { M: m }),
    shaped(AR[`${mat}_feet`], 1, ['M M', 'M M'], { M: m }),
  );
}
for (const slot of ['head', 'chest', 'legs', 'feet']) ARMOR.push(shapeless(AR[`jade_${slot}`], 1, [AR[`diamond_${slot}`], JADE]));

// C6 (v12.15.1): recetas de taller. oficio+nivel: se piden a `req` («of:oficio:n», lo arma saberes.js: conocidas); herr: la herramienta que hay que llevar
// (no se gasta); lena: gasta una leña por tanda. Los números salen de docs/revisiones/DISENO_CONTENIDO_C5-C8.md §C6.2 (algunas cantidades bajan para caber en 3×3)
const FINA = 1138, CLAVOS = 1135, BISAGRAS = 1136, MANGO = 1137, AMASADO = 1139, E_ROJO = 1140, E_NEGRO = 1141, E_CREMA = 1142;
const SERRUCHO = 1130, CEPILLO = 1131, FORMON = 1132, MARTILLO = 1133, TENAZAS = 1134, CALCITA = 'calcite';
const tl = (taller, oficio, nivel, out, n, items, extra = {}) => ({ out: [out, n], items, taller, oficio, nivel, req: nivel > 0 ? `of:${oficio}:${nivel}` : undefined, ...extra });
const rep = (id, n) => new Array(n).fill(id);
const OFICIOS_RECETAS = [
  // carpintería (banco)
  tl('carpinteria', 'carpinteria', 0, FINA, 1, [K.planks], { herr: CEPILLO }),
  tl('carpinteria', 'carpinteria', 0, MANGO, 2, [FINA]),
  tl('carpinteria', 'carpinteria', 0, SERRUCHO, 1, [IRON, STICK, STICK]),
  tl('carpinteria', 'carpinteria', 0, CEPILLO, 1, [IRON, K.planks, STICK]),
  tl('carpinteria', 'carpinteria', 0, FORMON, 1, [IRON, STICK]),
  tl('carpinteria', 'carpinteria', 1, K.mesa_grande, 1, [...rep(FINA, 6), K.log, K.log]),
  tl('carpinteria', 'carpinteria', 2, K.alacena, 1, [...rep(FINA, 7), BISAGRAS, BISAGRAS]),
  tl('carpinteria', 'carpinteria', 2, K.mostrador, 1, [...rep(FINA, 6), CLAVOS, CLAVOS]),
  tl('carpinteria', 'carpinteria', 3, K.armario, 1, [...rep(FINA, 6), CLAVOS, CLAVOS, BISAGRAS]),
  tl('carpinteria', 'carpinteria', 3, 1148, 1, [K.log, ...rep(FINA, 4)], { herr: FORMON }),
  tl('carpinteria', 'carpinteria', 4, K.puerta_tallada, 1, [...rep(FINA, 4), BISAGRAS, BISAGRAS], { herr: FORMON }),
  tl('carpinteria', 'carpinteria', 5, 1149, 1, [FINA, FINA, LEATHER, LEATHER, E_ROJO]),
  // herrería (fragua, gasta leña)
  tl('herreria', 'herreria', 0, CLAVOS, 8, [IRON], { lena: true }),
  tl('herreria', 'herreria', 0, BISAGRAS, 2, [IRON, CLAVOS], { lena: true }),
  tl('herreria', 'herreria', 1, MARTILLO, 1, [IRON, IRON, MANGO], { lena: true }),
  tl('herreria', 'herreria', 1, TENAZAS, 1, [IRON, IRON, STICK, STICK], { lena: true }),
  tl('herreria', 'herreria', 2, 1143, 4, [IRON, IRON], { lena: true, herr: MARTILLO }),
  tl('herreria', 'herreria', 3, 1144, 1, [IRON, IRON, CLAVOS], { lena: true, herr: MARTILLO }),
  tl('herreria', 'herreria', 3, K.verja_forjada, 2, rep(IRON, 4), { lena: true, herr: MARTILLO }),
  tl('herreria', 'herreria', 4, K.farol_forjado, 1, [IRON, IRON, K.glass, K.torch], { lena: true, herr: MARTILLO }),
  tl('herreria', 'herreria', 6, 1153, 1, [GOLD, GOLD, IRON, IRON], { lena: true, herr: MARTILLO }),
  // alfarería: el torno amasa y pinta; el horno de barro cuece (gasta leña)
  tl('alfareria', 'alfareria', 0, AMASADO, 2, [K.clay, K.clay, 290], { returns: [289] }),
  tl('alfareria', 'alfareria', 0, E_ROJO, 4, [IRON]),
  tl('alfareria', 'alfareria', 0, E_NEGRO, 4, [COAL]),
  tl('alfareria', 'alfareria', 0, E_CREMA, 4, [K[CALCITA]]),
  tl('horno', 'alfareria', 1, 1145, 1, rep(AMASADO, 3), { lena: true }),
  tl('horno', 'alfareria', 1, 1146, 1, rep(AMASADO, 2), { lena: true }),
  tl('horno', 'alfareria', 2, K.tinaja, 1, rep(AMASADO, 6), { lena: true }),
  tl('horno', 'alfareria', 3, K.teja, 8, rep(K.clay, 4), { lena: true }),
  tl('horno', 'alfareria', 4, 1147, 1, [AMASADO, AMASADO, E_ROJO, E_NEGRO, E_CREMA], { lena: true }),
  tl('horno', 'alfareria', 5, K.jarron_chorotega, 1, [...rep(AMASADO, 4), E_ROJO, E_NEGRO, E_CREMA], { lena: true }),
  tl('horno', 'alfareria', 6, K.chanchito, 1, [...rep(AMASADO, 6), E_ROJO, E_CREMA], { lena: true }),
];
// el modo de una receta: 'craft' (mesa), 'cook' (fogón) o 'taller:<cual>'
export const modoDe = (r) => (r.taller ? `taller:${r.taller}` : r.cook ? 'cook' : 'craft');

export const RECIPES = [
  shapeless(K.mojon_camino, 1, [K.cobble, K.cobble, K.cobble, K.cobble, 1163]), // v12.15.3 (C8-C): 4 piedra y 1 pómez
  shapeless(K.mojon_camino, 1, [K.cobble, K.cobble, K.cobble, K.cobble, K.clay]), // …o 1 arcilla, para quien no tiene volcán a la mano
  shapeless(K.planks, 4, [K.log]),
  shapeless(525, 1, [K.wool, 257, 257, 271]), // mascarilla de gases: lana, carbón y una correa de cuero
  shaped(527, 1, ['M M', 'M M'], { M: 526 }), // botas de bécquer: cuatro pieles
  shapeless(K.planks, 4, [K.birch_log]),
  shaped(STICK, 4, ['P', 'P'], { P: K.planks }),
  shaped(K.table, 1, ['PP', 'PP'], { P: K.planks }),
  shaped(K.torch, 4, ['C', 'S'], { C: COAL, S: STICK }),
  shaped(K.furnace, 1, ['CCC', 'C C', 'CCC'], { C: K.cobble }),
  shaped(K.chest, 1, ['PPP', 'P P', 'PPP'], { P: K.planks }),
  shaped(K.baul, 1, ['CIC'], { C: K.chest, I: IRON }), // dos cofres con un lingote: el baúl grande (54 espacios)
  shaped(DOOR, 3, ['PP', 'PP', 'PP'], { P: K.planks }),
  ...TOOLS,
  ...ARMOR,
  shapeless(JADE, 1, [JADE_SHARD, JADE_SHARD, JADE_SHARD, JADE_SHARD, GOLD, GOLD, GOLD, GOLD]),
  shaped(TORTILLA, 2, ['CCC'], { C: CORN }),
  shapeless(BREAD, 2, [BEANS, BEANS, TORTILLA]),
  shaped(K.quartz_lamp, 1, ['QQ', 'QQ'], { Q: QUARTZ }),
  shapeless(267, 2, [CORN]),
  shaped(K.smooth_stone, 4, ['SS', 'SS'], { S: K.stone }),
  shaped(K.wool, 1, ['LL'], { L: LEATHER }),
  shaped(K.bed, 1, ['WWW', 'PPP'], { W: K.wool, P: K.planks }),
  shapeless(K.paint_yellow, 4, [K.planks, K.planks, K.planks, K.planks, K.flower_yellow]),
  shapeless(K.paint_pink, 4, [K.planks, K.planks, K.planks, K.planks, K.flower_red]),
  shapeless(K.paint_green, 4, [K.planks, K.planks, K.planks, K.planks, K.leaves]),
  shapeless(K.paint_blue, 4, [K.planks, K.planks, K.planks, K.planks, 277]),
  shapeless(K.adobe, 4, [K.clay, K.clay, K.dirt, K.dirt]),
  shapeless(K.plaster, 4, [K.calcite, K.calcite, K.sand, K.sand]),
  shapeless(K.teja, 4, [264, 264, 264]),
  shaped(357, 1, ['  S', ' SW', 'S W'], { S: STICK, W: K.wool }),
  shaped(358, 1, ['P P', 'PPP'], { P: K.planks }),
  shaped(325, 1, ['  I', ' I ', 'S  '], { I: IRON, S: STICK }),
  shapeless(328, 1, [325, 371, JADE]),
  shaped(326, 1, [' SW', 'S W', ' SW'], { S: STICK, W: K.wool }),
  shapeless(327, 4, [K.gravel, STICK, STICK]),
  shapeless(374, 4, [K.dynamite, STICK, STICK]),
  shaped(376, 1, ['WPW', 'W W'], { W: K.wool, P: K.paint_pink }),
  // v12.15.4 (C8-B): las fiestas patronales (cartón pintado, humor y cimarrona)
  shaped(1182, 1, ['WPW', 'W W'], { W: K.wool, P: K.paint_yellow }), shaped(1183, 1, ['WPW', 'W W'], { W: K.wool, P: K.paint_green }), shaped(1184, 1, ['WPW', 'WWW'], { W: K.wool, P: K.paint_pink }),
  shaped(1180, 1, ['LLL', 'PWP', 'LLL'], { L: LEATHER, P: K.planks, W: K.wool }),
  shaped(1181, 1, ['  G', 'G G', ' G '], { G: GOLD }),
  shapeless(1186, 3, [STICK, 279, K.wool]),
  shaped(693, 1, ['WWW', 'WWW', ' S '], { W: K.wool, S: STICK }), shaped(694, 1, ['PPP', 'PPP'], { P: K.planks }), shaped(695, 1, ['PPP', 'P P', 'P P'], { P: K.planks }),
  shapeless(378, 1, [DIAMOND, K.obsidian, GOLD]),
  // v3.64: vivir del monte
  shaped(K.trampa, 1, ['S S', ' L ', 'SSS'], { S: STICK, L: LEATHER }),
  shaped(K.nasa, 1, ['SSS', 'SLS', 'SSS'], { S: STICK, L: LEATHER }),
  shaped(K.barril, 1, ['P P', 'PIP', 'PPP'], { P: K.planks, I: IRON }),
  shaped(K.estacas, 4, ['S S', 'SSS'], { S: STICK }),
  shaped(K.olla_caliente, 1, ['I I', 'III'], { I: IRON }),
  shaped(K.alambre, 6, ['ISI', 'ISI'], { I: IRON, S: STICK }),
  shaped(K.puntal, 2, ['S', 'P', 'S'], { S: STICK, P: K.planks }),
  shaped(K.pararrayos, 1, ['G', 'I', 'I'], { G: GOLD, I: IRON }),
  shaped(508, 1, ['S', 'V', 'S'], { S: STICK, V: 440 }),
  shaped(509, 2, ['SIS'], { S: K.planks, I: IRON }),
  shaped(K.yunque, 1, ['III', ' I ', 'SSS'], { I: IRON, S: K.cobble }),
  shaped(K.compostera, 1, ['P P', 'P P', 'PPP'], { P: K.planks }),
  shaped(K.plato_vacio, 2, [' P ', 'PPP'], { P: K.planks }), // antes 'P P/PPP', la misma del bote: nunca salía
  shapeless(K.plato_servido, 1, [K.plato_vacio, BREAD]),
  shaped(K.farol_zenaida, 1, [' E ', 'EFE', ' G '], { E: 499, F: K.farol, G: GOLD }),
  shaped(500, 2, ['E', 'C'], { E: 499, C: COAL }),
  shapeless(501, 2, [499, STICK, COAL]),
  shaped(K.cencerro, 1, ['SSS', 'S I'], { S: STICK, I: IRON }),
  shaped(K.carpa, 1, [' W ', 'W W', 'S S'], { W: K.wool, S: STICK }),
  shapeless(K.madera_carreta, 4, [K.planks, K.planks, K.planks, K.planks, K.flower_red, K.flower_yellow]),
  shaped(K.rueda_carreta, 2, [' M ', 'MSM', ' M '], { M: K.madera_carreta, S: STICK }),
  shapeless(K.repello_rojo, 4, [K.plaster, K.plaster, K.plaster, K.plaster, K.flower_red]),
  shaped(K.placa, 1, ['GGG', 'SSS'], { G: GOLD, S: K.smooth_stone }),
  shapeless(K.dynamite, 2, [379, COAL, K.sand]),
  // mechero: un poquito de hierro, carbón y azufre para la chispa
  shapeless(391, 1, [IRON, COAL, 379]),
  // escudos y armas
  shaped(399, 1, ['PPP', 'PPP', ' P '], { P: K.planks }),
  // la Capa de la Arpía: plumas de la jefa del cielo, cuero y una pluma dorada
  shaped(407, 1, ['A A', 'ALA', 'ADA'], { A: 406, L: LEATHER, D: 388 }),
  shaped(400, 1, ['IPI', 'III', ' I '], { I: IRON, P: K.planks }),
  shapeless(401, 1, [400, JADE, JADE]),
  shaped(402, 1, ['  I', ' S ', 'S  '], { I: IRON, S: STICK }),
  shaped(403, 1, ['II ', 'II ', ' S '], { I: IRON, S: STICK }),
  shaped(404, 1, ['L', 'S'], { L: K.log, S: STICK }),
  shapeless(391, 1, [IRON, COAL, COAL]),
  shapeless(374, 6, [379, COAL, STICK, STICK]),
  shaped(K.cerca, 3, ['PSP', 'PSP'], { P: K.planks, S: STICK }),
  shaped(K.farol, 1, [' I ', 'ITI', ' I '], { I: IRON, T: K.torch }),
  shaped(K.losa_tablas, 6, ['MMM'], { M: K.planks }),
  shaped(K.losa_piedra, 6, ['MMM'], { M: K.cobble }),
  shaped(K.losa_lisa, 6, ['MMM'], { M: K.smooth_stone }),
  shaped(K.losa_teja, 6, ['MMM'], { M: K.teja }),
  shaped(K.losa_adobe, 6, ['MMM'], { M: K.adobe }),
  shaped(K.escalera_tablas, 4, ['M  ', 'MM ', 'MMM'], { M: K.planks }),
  shaped(K.escalera_piedra, 4, ['M  ', 'MM ', 'MMM'], { M: K.cobble }),
  shaped(K.escalera_teja, 4, ['M  ', 'MM ', 'MMM'], { M: K.teja }),
  shaped(K.escalera_adobe, 4, ['M  ', 'MM ', 'MMM'], { M: K.adobe }),
  shaped(282, 1, ['WW', 'WS', ' S'], { W: K.wool, S: STICK }),
  shaped(283, 3, ['G G', ' G '], { G: K.glass }),
  shapeless(281, 1, [283, 279, 261]),
  shapeless(423, 2, [367, 375]),
  shapeless(285, 1, [278, JADE, GOLD]),
  shaped(K.hive, 1, ['PPP', 'PHP', 'PPP'], { P: K.planks, H: 279 }),
  shaped(289, 1, ['I I', ' I '], { I: IRON }),
  shaped(K.trapiche, 1, ['LSL', 'PPP'], { L: K.log, S: STICK, P: K.planks }),
  shaped(K.stove, 1, ['BBB', 'B B', 'CCC'], { B: K.bricks, C: K.cobble }),
  // v12.1.0 C1: lo que se guarda (sal y humo) y la botica de infusiones (todo en el fogón)
  cook(564, 2, [MEAT, MEAT, 562]), // v12.4.1: 2 por 2 (antes 3: daba más comida que la asada y no se pudría)
  cook(563, 1, [MEAT, 561]),
  cook(1199, 1, [1196, 299]), // v13.3.5 (BI0): el té de orquídea
  cook(1195, 1, [K.glow_mushroom, K.glow_mushroom, 299]), // v13.3.4 (CC1): la sopa de hongo
  cook(565, 1, [361, 562]), cook(565, 1, [362, 562]), cook(565, 1, [363, 562]), cook(565, 1, [364, 562]), // v12.4.1: el guapote también
  ...[1105, 1106, 1107, 1108, 1109, 1110, 1111, 1112].map((id) => cook(565, 1, [id, 562])), // v12.7.0: las especies nuevas, saladas
  cook(566, 3, [290, 429, 297], [289]),
  cook(567, 3, [290, 431, 367], [289]),
  cook(568, 3, [290, 430, 297], [289]),
  cook(569, 2, [290, 428, 279], [289]),
  cook(298, 3, [295, 290], [289]),
  cook(299, 3, [297, 290], [289]),
  cook(350, 1, [BREAD, 288]),
  // olla de carne, empanadas y chorreadas
  cook(392, 1, [MEAT, CORN, 356, 290], [289]),
  cook(392, 1, [MEAT, CORN, 275, 290], [289]),
  cook(393, 2, [TORTILLA, MEAT]),
  cook(393, 2, [TORTILLA, BEANS]),
  cook(394, 2, [CORN, CORN, 287]),
  cook(396, 3, [292, 297], [289]),
  // v2.42: chocolate bribri, queso Turrialba, natilla y sombrero de sabanero
  cook(409, 2, [408, 408, 297]),
  cook(410, 2, [292, 292], [289]),
  cook(411, 2, [292, 367], [289]),
  shaped(412, 1, [' L ', 'LLL'], { L: LEATHER }),
  // v2.47: polea de tirolesa
  shaped(415, 1, ['I I', ' I ', ' S '], { I: IRON, S: STICK }),
  // v2.51: comida tica
  cook(416, 2, [422, 292, 297], [289]),
  cook(417, 2, [BEANS, BEANS, 287, 290], [289]),
  cook(418, 3, [TORTILLA, 356, MEAT]),
  cook(419, 1, [356, 410]),
  cook(420, 2, [292, 292, 287, 263], [289]),
  cook(421, 1, [298, 292], [289]),
  // v3.46: pejibayes (se cocinan en el fogón; la mayonesa es huevo con limón)
  cook(493, 3, [492], [289]),
  cook(494, 2, [493, 493, 287, 367]),
  // v3.42: arco de cintas
  shapeless(488, 1, [K.planks, K.planks, K.planks, K.planks, K.planks, K.wool, K.wool]),
  // v3.41: carreta con bueyes
  shapeless(487, 1, [K.madera_carreta, K.madera_carreta, K.madera_carreta, K.rueda_carreta, K.rueda_carreta, 256, 256, 293]),
  // v3.27: comida guanacasteca
  cook(481, 1, [480, 397, 367]),
  cook(482, 3, [268, 268, 410]),
  cook(483, 2, [268, 410, 297]),
  cook(484, 2, [422, 422, 262]),
  // v3.26: tabla de surf
  shapeless(479, 1, [K.planks, K.planks, K.planks, K.wool]),
  // v3.25: bandera de circuito
  shapeless(478, 1, [256, K.wool, K.wool]),
  // v3.23: avioneta
  shapeless(477, 1, [258, 258, 258, 258, 258, K.planks, K.planks, K.wool, 390]),
  // v3.22: parapente
  shapeless(476, 1, [K.wool, K.wool, K.wool, K.wool, 256, 256]),
  // v3.18: papalote y trompo
  shapeless(473, 1, [256, 256, 256, K.wool]),
  shapeless(474, 1, [K.planks, 256]),
  // v3.8: piña
  cook(468, 2, [467, 297, 290], [289]),
  cook(469, 2, [467, 467, 297]),
  shapeless(466, 1, [467]),
  // v2.77: recetas que se aprenden (aprende: clave en meta.recetas)
  { ...shapeless(448, 2, [270, 287, 279]), aprende: 'pan_casero' },
  { ...shapeless(449, 2, [299, 431, 367]), aprende: 'agua_de_sapo' },
  { ...cook(450, 3, [422, 292, 279], 289), aprende: 'arroz_con_leche' },
  // v2.92: red de pesca
  shaped(463, 1, ['W W', ' W ', 'W W'], { W: K.wool }),
  // v2.86: cartelito
  shaped(462, 2, ['P', 'S'], { P: K.planks, S: STICK }), // la tabla arriba y el palo abajo: sin forma era la misma del trompo
  // v2.85: oficios
  shaped(458, 1, ['SSS', 'S S'], { S: STICK }), // la cajuela, boca abajo: al derecho era la de las estacas
  shaped(460, 1, ['P P', ' P '], { P: K.planks }),
  shapeless(259, 1, [461, 461, 461, 461]),
  // v2.81: bicicleta
  shaped(455, 1, ['I I', 'ISI', 'L L'], { I: IRON, S: STICK, L: LEATHER }),
  // v2.80: baldosa roja (el primer bloque extendido)
  shaped(K.baldosa_roja, 4, ['AA', 'AA'], { A: K.clay || K.adobe }),
  // v2.76: mochila de cuero
  shaped(447, 1, ['LSL', 'L L', 'LLL'], { L: LEATHER, S: STICK }),
  // v2.75: construcción
  shapeless(K.repello_celeste, 4, [K.plaster, K.plaster, K.plaster, K.plaster, K.paint_blue]),
  shapeless(K.repello_amarillo, 4, [K.plaster, K.plaster, K.plaster, K.plaster, K.flower_yellow]),
  shapeless(K.repello_verde, 4, [K.plaster, K.plaster, K.plaster, K.plaster, K.leaves]),
  shaped(K.azulejo, 4, ['GP', 'PG'], { G: K.glass, P: K.plaster }),
  shaped(K.mosaico, 4, ['RY', 'BG'], { R: K.flower_red, Y: K.flower_yellow, B: K.paint_blue, G: K.paint_green }),
  shaped(K.reja, 8, ['III', 'I I', 'III'], { I: IRON }),
  shaped(446, 1, ['W', 'S', 'S'], { W: K.wool, S: STICK }),
  // v2.72: muebles
  shaped(K.silla, 2, ['P  ', 'PPP', 'S S'], { P: K.planks, S: STICK }),
  shaped(K.mesa_comedor, 1, ['PPP', 'S S'], { P: K.planks, S: STICK }),
  shaped(K.hamaca, 1, ['S S', 'WWW'], { S: STICK, W: K.wool }),
  shaped(K.tele, 1, ['PPP', 'PGP', 'PIP'], { P: K.planks, G: K.glass, I: IRON }),
  shaped(K.radio, 1, ['PIP', 'PSP'], { P: K.planks, I: IRON, S: STICK }),
  shaped(K.refri, 1, ['III', 'IGI', 'III'], { I: IRON, G: K.glass }),
  // v2.67: rótulo de soda
  shapeless(K.rotulo_soda, 1, [K.planks, K.paint_pink, K.planks]),
  // v2.66: careta de buceo
  shaped(445, 1, ['LGL'], { L: LEATHER, G: K.glass }),
  // v2.64: botiquín
  shapeless(440, 3, [K.wool]),
  shapeless(441, 1, [375, 283]),
  shapeless(443, 1, [440, 441, 442]),
  // v2.62: honda, cerbatana, dardos, lanzas y el machete de doble filo (con los trofeos de los mini-jefes)
  shaped(432, 1, ['S S', ' L ', ' S '], { S: STICK, L: LEATHER }),
  shaped(433, 1, ['C', 'C', 'C'], { C: 296 }), // el ítem: el bloque de caña nunca llega a la mochila
  shapeless(434, 6, [284, STICK]),
  shapeless(434, 12, [438, STICK]),
  shaped(435, 2, ['  I', ' S ', 'SS '], { I: IRON, S: STICK }), // la jabalina lleva dos palos abajo: con uno era la lanza
  shapeless(439, 1, [325, 436, 437]),
  // v4.99: el cuchillo, la ofrenda y lo que se hace con los trofeos de los jefes del monte
  shapeless(535, 1, [IRON, STICK]),
  shapeless(542, 1, [29, 408, 375, K.torch]),
  shapeless(543, 1, [537, STICK, LEATHER]),
  shapeless(546, 1, [536, 536, 536, LEATHER]),
  shapeless(544, 1, [541, STICK, STICK]),
  shapeless(545, 1, [540, LEATHER]),
  shapeless(547, 1, [539, LEATHER, LEATHER]),
  shapeless(548, 2, [538, 29]),
  // v5.1: la Corona del monte (los seis trofeos), las alas del Rey y las bombetas
  shapeless(552, 1, [536, 537, 538, 539, 540, 541]),
  shapeless(549, 1, [551, 551, 551, 551, LEATHER, LEATHER]),
  shapeless(553, 2, [COAL, 379]),
  shapeless(554, 2, [296]), // la caña de azúcar que se lleva en la mochila (el bloque 98 no llega)
  shapeless(374, 6, [553, 554]), // bombetas con pólvora y caña brava
  // v6.1: flechas especiales (armas.js): de fuego con carbón y azufre, envenenadas con el veneno de la terciopelo o la glándula del Tata
  shapeless(557, 1, [325, 551, 551, JADE]), // el Machete del Viento (legendarias.js)
  shapeless(558, 1, [IRON, IRON, IRON, LEATHER, LEATHER]), // el gancho con mecate (gancho.js)
  shapeless(560, 1, [540, 537, IRON, IRON]), // el escudo de concha: pinza del Cangrejo Rey y cuerno de Don Cornudo
  shapeless(559, 1, [K.planks, K.planks, STICK, STICK, K.wool]), // el muñeco de práctica (muneco.js)
  shapeless(555, 4, [327, 327, 327, 327, COAL, 379]),
  shapeless(556, 4, [327, 327, 327, 327, 438]),
  shapeless(556, 8, [327, 327, 327, 327, 327, 327, 327, 327, 538]),
  shapeless(K.ermita, 1, [K.stone, K.stone, K.stone, K.torch, 29]), // la ermita de camino (ermitas.js)
  // v2.60: fogata y cantimplora
  shaped(K.fogata, 1, [' S ', 'SLS'], { S: STICK, L: K.log }),
  // v12.7.2 (C5-A2): la cocina del mar (en el fogón) y el secadero
  ...[361, 362, 363, 1105, 1106].map((id) => cook(1117, 1, [1114, 1114, 1115, 1115, id, 290], 289)),
  cook(1118, 1, [422, 1114, 1114, 1114, 367]),
  cook(1119, 1, [1113, 410, 367]),
  shaped(670, 1, ['CCC', 'B B'], { C: 554, B: STICK }),
  // v12.7.0 (C5-A1): las cañas y el señuelo
  shaped(1100, 1, ['  C', ' CB', 'CHB'], { C: 554, B: 1126, H: 258 }),
  shaped(1101, 1, ['  H', ' HB', 'HLH'], { H: 258, B: 1126, L: 271 }),
  shapeless(1104, 3, [1105, STICK, 1126]), shapeless(1104, 3, [361, STICK, 1126]),
  // v12.6.0 (C5-B): la cabuya (2 caña brava → 3), la estaca de nido, el vivero y la pecera
  shapeless(1126, 3, [554, 554]),
  shapeless(1124, 1, [STICK, STICK, 1126]),
  shaped(669, 1, ['SCS', 'BCB', 'CBC'], { S: STICK, C: 1126, B: 554 }),
  shaped(671, 1, ['G G', 'GGG'], { G: K.glass }),
  // v12.4.12 (C8-A): el tablón, para los pueblos de mundos viejos (se pone a menos de 120 bloques del centro)
  shaped(692, 1, ['PPP', 'PPP', 'S S'], { P: K.planks, S: STICK }),
  // v12.4.2: el collar del zaguate
  shaped(576, 1, ['S S', ' L '], { S: STICK, L: LEATHER }),
  // v12.4.0 C4: la miel de caña, la mecedora, la banca y la construcción tradicional
  cook(575, 2, [574], [289]),
  shaped(K.mecedora, 1, ['P  ', 'PPP', 'SPS'], { P: K.planks, S: STICK }),
  shaped(K.banca_corredor, 2, ['PPP', ' S '], { P: K.planks, S: STICK }),
  shapeless(K.bahareque, 4, [K.clay, K.clay, 554, 554]),
  shapeless(K.bahareque_encalado, 4, [K.bahareque, K.bahareque, K.bahareque, K.bahareque, K.calcite]),
  shaped(K.horcon, 2, ['L', 'L', 'L'], { L: K.log }),
  shaped(K.techo_palma, 6, ['CCC', 'CCC'], { C: 554 }),
  shaped(K.postigo, 2, ['SS', 'SS'], { S: STICK }),
  // v12.3.0 C3: el sombrero de paja (caña brava) y la cobija de lana
  shaped(572, 1, [' C ', 'CCC'], { C: 554 }),
  shaped(573, 1, ['WWW', 'WWW'], { W: K.wool }),
  // v12.1.0 C1 «Fogón y despensa»: leña de cualquier tronco (2 troncos → 6 leñas)
  shaped(561, 6, ['L', 'L'], { L: K.log }),
  shaped(561, 6, ['L', 'L'], { L: K.birch_log }),
  shaped(561, 6, ['L', 'L'], { L: K.jungle_log }),
  shaped(426, 1, [' S ', 'L L', ' L '], { S: STICK, L: LEATHER }),
  // v2.49: portón, cortinas, maceta y palanca
  shaped(K.porton, 1, ['SPS', 'SPS'], { S: STICK, P: K.planks }),
  shaped(K.cortina, 2, ['WW', 'WW', 'WW'], { W: K.wool }),
  shaped(K.maceta, 1, ['F', 'C'], { F: K.flower_red, C: K.clay }),
  shaped(K.maceta, 1, ['F', 'C'], { F: K.flower_yellow, C: K.clay }),
  shaped(K.palanca, 1, ['S', 'C'], { S: STICK, C: K.cobble }),
  cook(397, 3, [MEAT, MEAT]),
  cook(375, 2, [296, 296, 296, 290], [289]),
  cook(380, 1, [K.hongo_fuego, K.hongo_fuego, 290], [289]),
  cook(366, 1, [362, 367, 367]),
  cook(366, 1, [361, 367, 367]),
  cook(366, 2, [364, 367, 367, 367]),
  cook(351, 2, [COOKED, BEANS, TORTILLA, 356]),
  cook(352, 2, [BEANS, BEANS, COOKED, TORTILLA]),
  cook(353, 2, [CORN, CORN, COOKED, 275]),
  cook(288, 1, [287]),
  cook(356, 1, [275]),
  shaped(293, 1, ['LLL', 'LIL'], { L: LEATHER, I: IRON }),
  shapeless(BREAD, 1, [BEANS, 275, COOKED]),
  shaped(K.sandstone, 1, ['SS', 'SS'], { S: K.sand }),
  shaped(K.bricks, 1, ['BB', 'BB'], { B: BRICK }),
  shaped(K.bookshelf, 1, ['PPP', 'SSS', 'PPP'], { P: K.planks, S: STICK }),
  shaped(K.lamp, 1, [' G ', 'GTG', ' G '], { G: K.glass, T: K.torch }),
  shaped(K.dynamite, 1, ['SCS', 'CSC', 'SCS'], { S: K.sand, C: COAL }),
  shapeless(K.mossy, 1, [K.cobble, K.tall_grass]),
  shapeless(BREAD, 1, [COOKED, APPLE]),
  shapeless(K.planks, 4, [K.jungle_log]),
  // v12.15.1 C6 «Manos de maestro»: los cuatro talleres se hacen en la mesa; lo que sale de ellos va por `taller` (oficios2.js: nivel, libro, leña)
  shaped(K.banco_carpintero, 1, ['PPP', 'PIP', 'PPP'], { P: K.planks, I: IRON }),
  shaped(K.fragua, 1, ['CCC', 'BLB', 'BBB'], { C: K.cobble, B: K.bricks, L: LEATHER }),
  shaped(K.torno_alfarero, 1, [' P ', 'PLP', 'CPC'], { P: K.planks, L: K.log, C: K.cobble }),
  shaped(K.horno_barro, 1, ['BBB', 'B B', 'BBB'], { B: K.bricks }),
  ...OFICIOS_RECETAS,
  // v12.15.2 C7 «Fuego de la tierra» (cantidades del diseño; las botas piden un cristal de azufre en vez de la ceniza fértil, que no salió en esta versión)
  shapeless(1161, 1, [1160, 1160, STICK, 1126]),
  shapeless(1168, 1, [LEATHER, LEATHER, LEATHER, 1163, 1163, 1163, 1163, 1162]),
  shapeless(1167, 1, [IRON, IRON, IRON, IRON, LEATHER, LEATHER, K.torch, K.glass]),
  // v13.3.4 (CC1): lo que se arma con esquirlas de cristal (cuevacosas.js) y la sopa de hongo
  shapeless(K.farol_cristal, 1, [1192, 1192, 1192, K.torch]),
  shapeless(K.cuerda, 6, [1126, 1126, 1126]), // v13.4.3 (CC4): tres cabuyas, seis cuerdas
  shapeless(1193, 1, [1192, 1192, 1192, 1192, IRON]),
  shapeless(1194, 1, [1167, 1192, 1192]),
  // v13.7.1 (La Hondura): los dos decorativos
  shapeless(K.basalto_columnar, 2, [K.basalt, K.basalt]),
  shapeless(K.cristal_ahumado, 2, [K.glass, K.glass, COAL]),
];

// Horno: entrada -> salida, combustible -> segundos que arde
export const SMELT = {
  [K.iron_ore]: IRON, [K.gold_ore]: GOLD, [K.sand]: K.glass, [K.cobble]: K.stone,
  [K.clay]: BRICK, [MEAT]: COOKED, [K.log]: COAL, [K.birch_log]: COAL, [K.jungle_log]: COAL,
  [287]: 288, [275]: 356, [K.oro_volcanico]: GOLD, [K.ceniza]: K.glass, [361]: 365, [362]: 365, [363]: 365, [364]: 365, [1105]: 365, [1106]: 365, [1107]: 365, [1108]: 365, [1109]: 365, [1110]: 365, [1111]: 365, [1112]: 365, [294]: 295, [K.deep_iron_ore]: IRON, [K.deep_gold_ore]: GOLD, [K.deep_rock]: K.smooth_stone, [K.stone]: K.smooth_stone,
};
export const FUEL = { [291]: 80, [COAL]: 40, [K.log]: 8, [K.birch_log]: 8, [K.planks]: 8, [STICK]: 2.5, [K.table]: 8, [K.bookshelf]: 8, [K.chest]: 8, [1200]: 80 }; // v13.4.3: la brasa viva quema 8 ítems
export const COOK_TIME = 5; // segundos por ítem

// Recorta la cuadrícula a su caja mínima: devuelve filas de ids (0 = vacío)
function trim(grid, size) {
  let x0 = size, y0 = size, x1 = -1, y1 = -1;
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    if (grid[y * size + x]) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  }
  if (x1 < 0) return null;
  const rows = [];
  for (let y = y0; y <= y1; y++) {
    const r = [];
    for (let x = x0; x <= x1; x++) { const s = grid[y * size + x]; r.push(s ? s.id : 0); }
    rows.push(r);
  }
  return rows;
}

// el patrón sin filas ni columnas vacías en el borde (así se compara con la cuadrícula recortada; el Mazo, con una columna
// vacía a la derecha, nunca coincidía)
function recortar(pat) {
  let p = pat.slice();
  while (p.length && !p[0].trim()) p.shift();
  while (p.length && !p[p.length - 1].trim()) p.pop();
  const w = Math.max(...p.map((r) => r.length)); p = p.map((r) => r.padEnd(w, ' '));
  let a = 0, b = w;
  while (a < b && p.every((r) => r[a] === ' ')) a++;
  while (b > a && p.every((r) => r[b - 1] === ' ')) b--;
  return p.map((r) => r.slice(a, b));
}
function matchShaped(rec, rows, mirror) {
  const pat = rec.recorte || (rec.recorte = recortar(rec.pattern));
  if (pat.length !== rows.length || pat[0].length !== rows[0].length) return false;
  for (let y = 0; y < pat.length; y++) for (let x = 0; x < pat[0].length; x++) {
    const ch = pat[y][mirror ? pat[0].length - 1 - x : x];
    const want = ch === ' ' ? 0 : rec.key[ch];
    if (want !== rows[y][x]) return false;
  }
  return true;
}

// Busca la receta que corresponde a la cuadrícula (size 2 o 3).
export function findRecipe(grid, size, mode = 'craft', sabe = null) {
  const rows = trim(grid, size);
  if (!rows) return null;
  const ids = rows.flat().filter(Boolean).sort((a, b) => a - b);
  // primero las de forma y después las sueltas: una receta con forma le gana a una sin forma con los mismos ingredientes
  // (el cartelito, tabla sobre palo, y el trompo, tabla y palo como sea)
  let suelta = null;
  for (const rec of RECIPES) {
    if (modoDe(rec) !== mode) continue;
    if (rec.req && !(sabe && sabe.has(rec.req))) continue;
    if (rec.aprende && !(sabe && sabe.has(rec.aprende))) continue;
    if (rec.pattern) {
      const pat = rec.recorte || (rec.recorte = recortar(rec.pattern));
      if (pat.length > size || pat[0].length > size) continue;
      if (matchShaped(rec, rows, false) || matchShaped(rec, rows, true)) return rec;
    } else if (!suelta) {
      const want = [...rec.items].sort((a, b) => a - b);
      if (want.length === ids.length && want.every((v, i) => v === ids[i])) suelta = rec;
    }
  }
  return suelta;
}

// Lista de ingredientes (id -> cantidad) de una receta
export function ingredients(rec) {
  const need = new Map();
  const add = (id) => need.set(id, (need.get(id) || 0) + 1);
  if (rec.pattern) for (const row of rec.pattern) for (const ch of row) { if (ch !== ' ') add(rec.key[ch]); }
  else rec.items.forEach(add);
  return need;
}

// Celdas donde va cada ingrediente al acomodarlo en una cuadrícula de `size`
export function layout(rec, size) {
  const cells = [];
  if (rec.pattern) {
    if (rec.pattern.length > size || rec.pattern[0].length > size) return null;
    rec.pattern.forEach((row, y) => [...row].forEach((ch, x) => { if (ch !== ' ') cells.push({ cell: y * size + x, id: rec.key[ch] }); }));
  } else {
    if (rec.items.length > size * size) return null;
    rec.items.forEach((id, i) => cells.push({ cell: i, id }));
  }
  return cells;
}

export function fitsIn(rec, size) {
  if (rec.pattern) return rec.pattern.length <= size && rec.pattern[0].length <= size;
  return rec.items.length <= size * size;
}
