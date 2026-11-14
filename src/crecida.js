// La cabeza de agua: cuando llueve, el río de abajo puede crecer de golpe con lo que cayó en la montaña. Se oye primero un rugido río arriba, y quien
// sale del agua a tiempo no le pasa nada. Quien se queda, se lo lleva la corriente. Es de las pocas cosas de la naturaleza que avisan, y la gente de
// aquí lo sabe de memoria. Estado: g.crecida (no se guarda); el récord, en meta.crecidas.
import { anotar } from './diario.js';
import { corriente } from './rafting.js';
import { SEA } from './worldgen.js';

const AVISO = 6, CADA = 480;
const enRio = (g) => {
  const P = g.player, b = P.body, p = b.pos;
  if (!b.inWater || g.riding || g.dim !== 'tierra') return false;
  // el cauce de un río, a la altura del agua: ni lagos de cueva, ni charcos, ni piscinas
  const x = Math.floor(p.x), z = Math.floor(p.z), col = g.world.gen.column(x, z);
  if (col.biome === 'ocean' || col.biome === 'manglar' || col.h < SEA - 3) return false; // el mar abierto no crece de golpe
  return !!corriente(g.world.gen, x, z) && Math.abs(Math.floor(p.y) - SEA) <= 3;
};
// cada segundo
export function tickCrecida(g) {
  if (!g.player.alive) { g.crecida = null; return; }
  if (g.mode !== 'survival' || !g.meta) return;
  const C = g.crecida;
  if (C) {
    C.t--;
    if (C.t === 3) g.audio.play('rumble', { ui: true, vol: 0.85 });
    if (C.t > 0) return;
    g.crecida = null;
    if (!enRio(g)) {
      g.ui.toast('🌊 Pasó la cabeza de agua: troncos, piedras y lodo. Salió a tiempo', 3200);
      g.achieve('cabeza_agua', 'Salí a tiempo');
      anotar(g, 'Vi pasar una cabeza de agua desde la orilla.', '🌊');
      return;
    }
    const P = g.player, v = P.body.vel, a = Math.random() * Math.PI * 2;
    v.x += Math.cos(a) * 14; v.z += Math.sin(a) * 14; v.y = 3;
    g.shake = 0.8;
    g.damagePlayer(7, null, null, 'Arrastre de una cabeza de agua', true, false);
    g.addEffect('escalofrio', 30);
    g.ui.toast('🌊 ¡La corriente le pasó por encima! Cuando ruge el río, se sale del agua', 3400);
    return;
  }
  if (!g.weather || g.weather.type === 'clear' || !enRio(g)) return;
  const M = g.meta;
  if ((g.clock || 0) < (M.crecidaCd || 0) || Math.random() > 0.04) return;
  M.crecidaCd = (g.clock || 0) + CADA;
  g.crecida = { t: AVISO };
  g.audio.play('trueno', { ui: true, vol: 0.5, pitch: 0.6 });
  g.ui.toast('🌊 Se oye un rugido río arriba… ¡salga del agua!', 3600);
}
export const limpiarCrecida = (g) => { g.crecida = null; };
