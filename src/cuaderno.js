// El cuaderno de la abuela: doce hojas que aparecen según lo que uno va haciendo. Cada una cuenta algo de Zenaida y deja una
// ventaja para siempre. Las pistas de las que faltan se ven en la pestaña de cartas, así uno sabe qué le queda por hacer.
// Las ventajas se leen de meta.cuaderno (ver `ventaja` en progreso.js y los enganches en zancudos, curas, trampas y desgaste).
import { lv as skillLv } from './habilidades.js';
import { anotar } from './diario.js';
import { mana } from './progreso.js';

const crafted = (g, id) => !!(g.meta.crafted && g.meta.crafted[id]);
const ach = (g, ...keys) => keys.some((k) => g.achievements && g.achievements.has(k));

export const PAGINAS = [
  { k: 'comida', t: 'Para que la comida rinda', pista: 'Arregle la casa de la abuela', ok: (g, H) => H && H.hogar, perk: 'La comida llena 7 % más',
    texto: 'Sal, manteca y paciencia. El que come apurado come dos veces. Y al frijol no se le apura: se le conversa.' },
  { k: 'sed', t: 'El agua del monte', pista: 'Hágase una cantimplora', ok: (g) => crafted(g, 426), perk: 'Le da 7 % menos sed',
    texto: 'Tome antes de tener sed, no después. Yo crucé el Cerro de la Muerte con una botella de guaro llena de agua, y todavía me acusan de otra cosa.' },
  { k: 'zancudos', t: 'Remedio contra zancudos', pista: 'Aguante una picada de zancudo', ok: (g) => g.meta.picado, perk: 'Los zancudos pican la mitad',
    texto: 'Limón en los tobillos y no se me queje. El zancudo huele el miedo y el agua dulce. A mi comadre la adoraban.' },
  { k: 'aguante', t: 'Lo que me enseñó mi mamá', pista: 'Pare un golpe justo a tiempo', ok: (g) => ach(g, 'parry'), perk: 'La estamina vuelve 10 % más rápido',
    texto: 'No le pegue primero al que grita más. Espere, respire, y cuando levante el brazo, ya usted está en otro lado. Con los maridos también funciona.' },
  { k: 'vendas', t: 'Cómo amarrar una venda', pista: 'Véncale a una leyenda', ok: (g) => ach(g, 'vencer_cadejos', 'vencer_segua', 'vencer_llorona', 'vencer_tulevieja'), perk: 'Las vendas curan 3 de vida más',
    texto: 'Bien apretada pero que no se ponga morado. Si se pone morado, aflójela. Si se pone verde, vaya donde el doctor y no le diga quién le puso la venda.' },
  { k: 'trampas', t: 'Dejar que el monte trabaje', pista: 'Deje armada una trampa o una nasa', ok: (g) => g.meta.monte && g.meta.monte.length > 0, perk: 'Trampas y nasas agarran 25 % más seguido',
    texto: 'Póngala donde hay caca, no donde hay bonito. El animal no anda buscando paisaje.' },
  { k: 'ojo', t: 'Dormir con un ojo abierto', pista: 'Parta un nido de Sombra', ok: (g) => ach(g, 'nido'), perk: 'Recibe 4 % menos de daño',
    texto: 'A las Sombras les gusta el que está confiado. Yo llevo sesenta años sin confiarme, y mire la salud que tengo. Bueno, tenía.' },
  { k: 'desgaste', t: 'Cuidar las herramientas', pista: 'Defienda la casa en un asedio', ok: (g) => ach(g, 'asedio'), perk: 'Las herramientas se gastan 15 % menos',
    texto: 'Lo que se presta no vuelve, y lo que vuelve, vuelve mocho. Límpielas y guárdelas secas. Y a su tío Rigo no le preste nada.' },
  { k: 'cocina', t: 'Cocinar con gusto', pista: 'Suba cocina al nivel 3', ok: (g) => skillLv(g, 'cocina') >= 3, perk: 'El efecto de los platos dura 50 % más',
    texto: 'Un casado bien hecho le da fuerza para el día entero. Un casado hecho de mala gana le da gastritis. Se nota.' },
  { k: 'caminar', t: 'Caminar sin cansarse', pista: 'Conozca 3 regiones del país', ok: (g) => Object.keys(g.meta.regions || {}).length >= 3, perk: 'Hambre y sed 3 % más lentas',
    texto: 'Paso corto y mirando el suelo. El que mira el paisaje se va de jupa en el primer hueco. Y hay huecos.' },
  { k: 'manos', t: 'Manos de trabajo', pista: 'Llegue a 7 días seguidos sin morir', ok: (g) => g.meta.racha && g.meta.racha.mejor >= 7, perk: 'Pica y corta 5 % más rápido',
    texto: 'Que le salgan callos, que eso no es feo. Feo es pedir prestado. Una semana entera sin desgracias ya es bastante para enseñarle esto.' },
  { k: 'corazon', t: 'Lo que le debo', pista: 'Junte dos pedazos del Corazón', ok: (g, H) => H && H.pedazos && Object.keys(H.pedazos).length >= 2, perk: 'Un corazón más',
    texto: 'Yo nunca pasé de dos pedazos. Si está leyendo esto, ya me alcanzó. Sígale, que de aquí para allá ya no le puedo decir nada que yo sepa.' },
];

// cada segundo
export function tickCuaderno(g) {
  if (g.mode !== 'survival' || !g.meta) return;
  const C = (g.meta.cuaderno ||= {}), H = g.meta.hist;
  g.inventory.ahorro = 1 - (C.desgaste ? 0.85 : 1) * (mana(g, 'cuidadoso') ? 0.75 : 1);
  for (const P of PAGINAS) {
    if (C[P.k] || !P.ok(g, H)) continue;
    C[P.k] = g.day || 1;
    if (P.k === 'corazon') { g.meta.vidaExtra = (g.meta.vidaExtra || 0) + 2; g.player.vidaExtra = g.meta.vidaExtra; g.player.health = g.player.maxHealth; }
    g.audio.play('nivel', { ui: true, vol: 0.35 });
    g.ui.toast(`📓 Una hoja del cuaderno de la abuela: «${P.t}». ${P.perk}. Léala con C`, 4600);
    g.achieve('cuaderno', 'El cuaderno de la abuela');
    anotar(g, `Encontré una hoja del cuaderno de la abuela: ${P.t}.`, '📓');
    if (PAGINAS.every((q) => C[q.k])) { g.achieve('cuaderno12', 'El cuaderno completo'); g.ui.regionBanner('El cuaderno completo', 'Ya sabe todo lo que Zenaida alcanzó a escribir'); }
    return; // de una en una, para que dé tiempo de leerlas
  }
}
export function cuadernoHTML(g) {
  const C = (g.meta && g.meta.cuaderno) || {}, n = PAGINAS.filter((P) => C[P.k]).length;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  let h = `<details class="cuaderno"><summary>📓 El cuaderno de la abuela · ${n} de ${PAGINAS.length} hojas</summary>`;
  for (const P of PAGINAS) {
    h += C[P.k]
      ? `<div class="hoja"><b>${esc(P.t)}</b><p>${esc(P.texto)}</p><small>✔ ${esc(P.perk)}</small></div>`
      : `<div class="hoja falta"><b>Hoja perdida</b><small>Pista: ${esc(P.pista)}. Da: ${esc(P.perk.toLowerCase())}</small></div>`;
  }
  return `${h}</details>`;
}
