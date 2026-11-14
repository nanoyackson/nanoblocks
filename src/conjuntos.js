// Conjuntos de armadura (v6.5): con las cuatro piezas del mismo material (casco, pechera, pantalón y botas) se gana un bono propio:
// · cuero: «Andar de baquiano», un 8 % más rápido y, agachado, las criaturas lo notan a uno de más cerca (la mitad de distancia).
// · hierro: «Pecho de hierro», cubrirse gasta un 25 % menos de aire y los golpes empujan la mitad.
// · diamante: «Filo de diamante», un 10 % más de daño.
// · jade: «Corazón de jade», la vida se recupera sola, medio corazón cada 6 segundos, aunque no esté lleno.
// Estado: g.conjunto ('leather' | 'iron' | 'diamond' | 'jade' | null), se recalcula cada segundo.
import { ITEMS } from './blocks.js';

export const CONJUNTOS = {
  leather: { nombre: 'Andar de baquiano', txt: 'un poco más rápido, y al agacharse lo notan de más cerca' },
  iron: { nombre: 'Pecho de hierro', txt: 'cubrirse gasta menos aire y los golpes empujan la mitad' },
  diamond: { nombre: 'Filo de diamante', txt: '10 % más de daño' },
  jade: { nombre: 'Corazón de jade', txt: 'la vida se recupera sola, despacito' },
};
function calcular(g) {
  const A = g.inventory.armor;
  let mat = null;
  for (let i = 0; i < 4; i++) {
    const d = A[i] && ITEMS[A[i].id];
    if (!d || !CONJUNTOS[d.mat]) return null;
    if (mat && d.mat !== mat) return null;
    mat = d.mat;
  }
  return mat;
}
// cada segundo
export function tickConjunto(g) {
  const antes = g.conjunto;
  g.conjunto = g.mode === 'survival' ? calcular(g) : null;
  if (g.conjunto && g.conjunto !== antes) {
    const C = CONJUNTOS[g.conjunto];
    g.ui.toast(`🛡 Conjunto completo: «${C.nombre}» (${C.txt})`, 3400);
    g.achieve('conjunto', 'Conjunto completo');
  }
  if (g.conjunto === 'jade' && g.player.alive && g.player.health < g.player.maxHealth) {
    g.jadeT = (g.jadeT || 0) + 1;
    if (g.jadeT >= 6) { g.jadeT = 0; g.player.health = Math.min(g.player.maxHealth, g.player.health + 1); }
  }
}
export const bono = (g, mat) => g.conjunto === mat;
// la ficha del ítem: qué da el conjunto de su material
export function fichaConjunto(def) { const C = def && def.armor && CONJUNTOS[def.mat]; return C ? `Con las cuatro piezas de este material: «${C.nombre}» (${C.txt})` : ''; }
