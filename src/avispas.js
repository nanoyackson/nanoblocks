// El avispero: a veces, al cortar hojas en el monte, se cae un avispero. Las avispas persiguen unos segundos; se sale de ellas corriendo lejos o
// metiéndose al agua. Quien aguanta, o vuelve después, se queda con la miel que dejó el panal. Riesgo chiquito, premio chiquito, y una carrera.
// Estado: g.avispas (no se guarda).
import { anotar } from './diario.js';
import { difOf } from './supervivencia.js';

const MIEL = 279, DURA = 9, LEJOS = 14;
// lo llama romper hojas
export function quizaAvispero(g, b, x, y, z) {
  if (g.mode !== 'survival' || g.avispas || !b.leafy || g.dim !== 'tierra' || g.player.body.inWater) return;
  const bio = g.world.gen.column(x, z).biome;
  if (!['forest', 'jungle', 'nuboso', 'bosque_seco'].includes(bio) || Math.random() > 0.015) return;
  g.avispas = { t: DURA, x: x + 0.5, y: y + 0.5, z: z + 0.5, pico: 0 };
  const miel = g.entities.dropItem(MIEL, 2, x + 0.5, y + 0.5, z + 0.5);
  if (miel) miel.vida = 900; // la miel espera un rato más que lo normal
  g.ui.toast('🐝 ¡Se cayó un avispero! Corra lejos o métase al agua', 2600);
}
// cada segundo
export function tickAvispas(g) {
  const A = g.avispas;
  if (!A) return;
  const P = g.player, p = P.body.pos;
  if (!P.alive || g.dim !== 'tierra') { limpiarAvispas(g); return; }
  A.t--;
  g.audio.setEmitter('avispas', 'loop.zancudo', { x: p.x, y: p.y + 1, z: p.z }, 1);
  const lejos = Math.hypot(p.x - A.x, p.z - A.z) > LEJOS;
  // el enjambre sigue a uno
  for (let i = 0; i < 8; i++) g.particles.spawn(p.x + (Math.random() - 0.5) * 2, p.y + 1 + Math.random(), p.z + (Math.random() - 0.5) * 2, [0.15, 0.12, 0.05], (Math.random() - 0.5), 0.3, (Math.random() - 0.5), 0.5, 0);
  if (lejos || P.body.inWater) {
    limpiarAvispas(g);
    g.ui.toast(P.body.inWater ? '🐝 Se quedaron zumbando arriba del agua. Ya se van' : '🐝 Las dejó atrás', 2200);
    g.achieve('avispas', 'Corrí de las avispas');
    if (A.pico === 0) anotar(g, 'Se cayó un avispero, y salí sin una picadura.', '🐝');
    return;
  }
  if (A.t <= 0) { limpiarAvispas(g); g.ui.toast('🐝 Se cansaron. Vaya pronto por la miel, donde cayó el panal', 2200); return; }
  A.pico++;
  g.damagePlayer(difOf(g).dmg, null, null, 'Picaduras de avispa', true, false);
}
export function limpiarAvispas(g) { g.avispas = null; if (g.audio) g.audio.setEmitter('avispas', 'loop.zancudo', null, 0); }
