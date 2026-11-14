// Ruta del aventurero: las metas de supervivencia en orden, desde la primera noche hasta vencer al Señor del Arenal
// y subir al cielo. Se abre con la J; cada meta cumplida avisa cuál sigue, y al terminar todo se «pasa el juego».
import { viviendaHTML } from './vivienda.js';
import { objetivoHistoria } from './historia.js';
import { hogarHTML } from './hogar.js';
import { retosHTML } from './retos.js';
import { corazonHTML } from './corazon.js';
import { darPremio, premioTexto, rangoIdx, RANGOS, progresoHTML } from './progreso.js';

const crafted = (g, ...ids) => ids.some((id) => g.meta.crafted && g.meta.crafted[id]);
const ach = (g, ...keys) => keys.some((k) => g.achievements && g.achievements.has(k));

export const RUTA = [
  { title: 'Sobrevivir la primera noche', hint: 'Haga un refugio y una cama, o aguante hasta que salga el sol.', done: (g) => (g.day || 1) >= 2 },
  { title: 'Herramientas de piedra', hint: 'Mesa de trabajo, palos y piedra: un pico de piedra abre la minería.', done: (g) => crafted(g, 301, 305, 309, 313) },
  { title: 'Conocer un pueblo', hint: 'Siga las carreteras: los pueblos tienen pulpería, soda y gente que paga encargos.', done: (g) => ach(g, 'pueblo') },
  { title: 'Primer hierro', hint: 'Funda hierro en el horno y haga un pico de hierro.', done: (g) => crafted(g, 302, 306, 310, 314) },
  { title: 'Un escudo para pelear', hint: 'Escudo de madera o de hierro: con clic derecho se bloquea, y a buen tiempo se hace parry.', done: (g) => crafted(g, 399, 400, 401) },
  { title: 'Armadura de hierro', hint: 'Cuatro piezas de hierro le quitan más de la mitad del daño.', done: (g) => [[334, 335, 336, 337], [338, 339, 340, 341], [342, 343, 344, 345]].some((p) => p.every((id) => crafted(g, id))) },
  { title: 'Vencer a una leyenda', hint: 'Desde el día 4, de noche: el Cadejos, la Segua, la Llorona o la Tulevieja. Bloquee el amago y pegue cuando quedan aturdidos.', done: (g) => ach(g, 'vencer_cadejos', 'vencer_segua', 'vencer_llorona', 'vencer_tulevieja', 'vencer_mona', 'vencer_duende', 'vencer_viejo_monte') },
  { title: 'Diamante', hint: 'Baje hondo a las cuevas: el diamante está cerca del fondo.', done: (g) => crafted(g, 303, 307, 311, 315, 338, 339, 340, 341) },
  { title: 'Bajar al Inframundo', hint: 'Marco de 10 de obsidiana (cima de volcanes con pico de diamante, o Don Carlos) encendido con la Llave del volcán: se hace con un diamante, oro y obsidiana (a veces sale en cofres viejos).', done: (g) => ach(g, 'inframundo') },
  { title: 'Vencer al Señor del Arenal', hint: 'Quédese en el Inframundo: sale cerca de usted a los pocos minutos. Escudo, estamina y paciencia: las bombas se esquivan rodando.', done: (g) => ach(g, 'vencer_senor_arenal') },
  { title: 'Subir a las Tierras del Cielo', hint: 'Marco de 10 de calcita (geodas bajo tierra, o Don Carlos) encendido con una pluma de quetzal (la suelta el Murciélago Rey).', done: (g) => ach(g, 'cielo') },
  { title: 'Patrimonio nacional', hint: 'Descubra diez lugares distintos de Costa Rica.', done: (g) => ach(g, 'patrimonio') },
  { title: 'Vencer a la Arpía de la Tormenta', hint: 'Se queda un rato en las islas del cielo y baja de las nubes. Los rayos se esquivan rodando (V); la ráfaga se aguanta con el escudo; bloquee la picada para aturdirla.', done: (g) => ach(g, 'vencer_arpia') },
];

// revisa la ruta cada tanto: avisa lo nuevo y, al completarla, se pasa el juego
export function tickRuta(g) {
  const st = (g.meta.ruta = g.meta.ruta || {});
  for (let i = 0; i < RUTA.length; i++) {
    if (st[i] || !RUTA[i].done(g)) continue;
    const antes = rangoIdx(g);
    st[i] = g.day || 1;
    darPremio(g, i);
    const next = RUTA.findIndex((r, j) => !st[j] && j !== i);
    g.ui.toast(`🧭 ✔ ${RUTA[i].title} · Premio: ${premioTexto(i)}${next >= 0 ? ` · Sigue: ${RUTA[next].title} (J)` : ''}`, 5200);
    g.audio.play('nivel', { ui: true, vol: 0.4 });
    const ahora = rangoIdx(g);
    if (ahora > antes) { g.ui.regionBanner(`Ahora es: ${RANGOS[ahora].t}`, RANGOS[ahora].perk); g.achieve(`rango_${ahora}`, `Rango: ${RANGOS[ahora].t}`); g.audio.play('aplausos', { ui: true, vol: 0.4 }); }
  }
  if (!st.final && RUTA.every((_, i) => st[i])) {
    st.final = g.day || 1;
    g.ui.regionBanner('¡Leyenda de Tiquicia!', 'Pasó NanoBlocks. Pero el mundo es infinito… ¡pura vida!');
    g.achieve('final', 'Leyenda de Tiquicia');
    g.audio.play('aplausos', { ui: true, vol: 0.6 });
  }
}

// lo que se ve siempre en pantalla: el capítulo y lo que falta (se apaga en Ajustes)
export function tickObjetivo(g) {
  if (g.mode !== 'survival' || (g.settings && g.settings.objetivo === false)) { g.ui.objetivo(null); return; }
  // la ruta ya tiene su renglón bajo el minimapa: aquí va lo de la historia
  g.ui.objetivo(objetivoHistoria(g));
}

const hechas = (st) => { const n = RUTA.filter((_, i) => st[i]).length; return n ? `<li class="ok"><b>✔ ${n} de ${RUTA.length} metas cumplidas</b></li>` : ''; };
export function rutaHTML(g) {
  const st = g.meta.ruta || {};
  const firstOpen = RUTA.findIndex((_, i) => !st[i]);
  // primero lo que sigue; lo demás, debajo
  return progresoHTML(g) + hechas(st) + RUTA.map((r, i) => {
    // las hechas ya se contaron arriba, y de las que faltan basta con ver las próximas: si no, el panel no cabe en la pantalla
    if (st[i] || (firstOpen >= 0 && i > firstOpen + 2)) return '';
    return `<li class="${i === firstOpen ? 'next' : ''}"><b>${i === firstOpen ? '➜' : '·'} ${r.title}</b>${i === firstOpen ? `<span>${r.hint}</span><span class="premio">🎁 Premio: ${premioTexto(i)}</span>` : ''}</li>`;
  }).join('') + retosHTML(g) + corazonHTML(g) + hogarHTML(g) +
    (st.final ? '<li class="ok final"><b>🏆 Leyenda de Tiquicia</b><span>Pasó el juego. Siga explorando: hay parques, leyendas y secretos por todo el mapa.</span></li>' : '') +
    viviendaHTML(g);
}
