// Platos con efecto: la comida buena no solo llena, también deja algo por un rato. Solo vale uno a la vez (el último que comió),
// así que antes de un asedio o de ir por un nido conviene pensar qué se come. Los efectos los leen `ventaja` (progreso.js) y tickSed.
import { mana } from './progreso.js';

export const PLATOS = {
  351: 'fuerza', 352: 'fuerza', // casado, chifrijo
  392: 'coraza', 481: 'coraza', // olla de carne, vigorón
  350: 'aguante', 484: 'aguante', // gallo pinto con huevo, arroz con pollo
  366: 'fresco', // ceviche
  417: 'lleno', 353: 'lleno', // sopa negra, tamal
};
const NOMBRE = {
  fuerza: '💪 Con fuerza: 15 % más de daño',
  coraza: '🛡 Bien comido: 12 % menos de daño',
  aguante: '⚡ Con aguante: la estamina vuelve 40 % más rápido',
  fresco: '🧊 Fresco: la mitad de sed',
  lleno: '🍲 Lleno: 40 % menos hambre y sed',
};
const DURA = 300;
export const efectoPlato = (id) => NOMBRE[PLATOS[id]] || '';
export function comerPlato(g, id) {
  const ef = PLATOS[id];
  if (!ef || g.mode !== 'survival') return;
  for (const k of Object.keys(NOMBRE)) delete g.player.effects[k];
  const dura = DURA * (g.meta.cuaderno && g.meta.cuaderno.cocina ? 1.5 : 1) * (mana(g, 'buena_mano') ? 1.5 : 1);
  g.addEffect(ef, dura);
  g.ui.toast(`${NOMBRE[ef]}, por ${Math.round(dura / 60)} minutos`, 2800);
  g.achieve('plato', 'Comí bien antes de salir');
}
