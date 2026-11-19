// El lahar: cuando llueve en las faldas de un volcán, a veces se suelta de golpe un río de lodo, ceniza y piedras que baja por la
// pendiente. Primero se oye un rugido cuesta arriba; hay que quitarse de lado (no correr cuesta abajo, que lo alcanza).
// Estado: g.lahar (no se guarda), meta.laharCd.
import { SOLID, BLOCKS } from './blocks.js';

const AVISO = 5, ANCHO = 4, CADA = 600;
// a la intemperie y cerca de la superficie (dentro de una casa o de una mina, el lahar pasa por encima)
function intemperie(g) {
  const p = g.player.body.pos, x = Math.floor(p.x), z = Math.floor(p.z), y0 = Math.floor(p.y);
  if (p.y < g.world.gen.column(x, z).h - 2) return false;
  for (let y = y0 + 2; y < y0 + 6; y++) { const id = g.world.getBlock(x, y, z); if (SOLID[id] && !BLOCKS[id].leafy) return false; } // un techo de verdad, no la copa de un árbol
  return true;
}
// cada segundo
export function tickLahar(g) {
  if (g.dim !== 'tierra' || g.mode !== 'survival' || !g.meta) return;
  const P = g.player, p = P.body.pos, L = g.lahar;
  if (!L) {
    const llueve = g.weather && g.weather.type !== 'clear';
    if (!llueve || !P.alive || (g.clock || 0) < (g.meta.laharCd || 0) || Math.random() > 1 / 150 || !intemperie(g)) return;
    const col = g.world.gen.column(Math.floor(p.x), Math.floor(p.z)), k = col.volcanoK || 0;
    if (col.biome !== 'volcano' && k < 0.25) return;
    if (k < 0.2 || k > 0.75) return; // en las faldas (ni en el llano ni en el cráter)
    // cuesta arriba: hacia donde sube el terreno
    const h = (a, b) => g.world.gen.column(Math.floor(a), Math.floor(b)).h;
    const gx = h(p.x + 4, p.z) - h(p.x - 4, p.z), gz = h(p.x, p.z + 4) - h(p.x, p.z - 4), l = Math.hypot(gx, gz);
    if (l < 1) return;
    const ux = gx / l, uz = gz / l; // hacia arriba
    g.lahar = { t: AVISO, x: p.x, z: p.z, ux, uz, pego: false };
    g.meta.laharCd = (g.clock || 0) + CADA;
    g.audio.play('rumble', { ui: true, vol: 0.9 });
    g.ui.toast('🌋 ¡Un rugido cuesta arriba! Viene un lahar: quítese de lado, rápido (no corra para abajo)', 4200);
    return;
  }
  L.t--;
  // el lodo bajando, en una franja que pasa por donde estaba uno
  for (let i = 0; i < 40; i++) {
    const along = 12 - (AVISO - L.t) * 3 + (Math.random() - 0.5) * 6, lado = (Math.random() - 0.5) * ANCHO * 2;
    const x = L.x + L.ux * along - L.uz * lado, z = L.z + L.uz * along + L.ux * lado;
    const y = g.world.gen.column(Math.floor(x), Math.floor(z)).h + 1 + Math.random() * 1.5;
    g.particles.spawn(x, y, z, Math.random() < 0.7 ? [0.36, 0.28, 0.2] : [0.5, 0.5, 0.5], -L.ux * 4, 1 + Math.random(), -L.uz * 4, 1.2, 10);
  }
  if (L.t === 1) g.audio.play('derrumbe', { ui: true, vol: 1, sub: true });
  if (L.t > 0) return;
  // pasó: si uno sigue en la franja, se lo lleva
  const dx = p.x - L.x, dz = p.z - L.z, lateral = Math.abs(-dx * L.uz + dz * L.ux), abajo = -(dx * L.ux + dz * L.uz);
  if (L.t < 0) { if (L.t <= -3) g.lahar = null; return; } // ya pasó: solo queda el lodo bajando
  if (P.alive && lateral < ANCHO && abajo > -20 && abajo < 26 && intemperie(g)) {
    L.pego = true;
    g.damagePlayer(8, null, null, 'Arrastre de un lahar', true, false);
    const v = P.body.vel; v.x -= L.ux * 10; v.z -= L.uz * 10; v.y = 4;
    g.addEffect('enlodado', 25); g.shake = Math.max(g.shake || 0, 0.8);
    g.ui.toast('🌋 ¡El lahar le pasó por encima! Le queda el lodo encima un rato', 3200);
  } else if (P.alive && lateral >= ANCHO && lateral < 30) {
    g.ui.toast('🌋 El lahar pasó de largo, rugiendo. Se quitó a tiempo', 3000);
    g.achieve('lahar', 'Me quité del lahar');
  } else if (P.alive && lateral < ANCHO && !intemperie(g)) g.ui.toast('🌋 El lahar le pasó por encima del techo. Adentro se salvó', 3000);
  if (L.pego) g.lahar = null;
}
export function limpiarLahar(g) { g.lahar = null; }
export function pruebaLahar(g) {
  const p = g.player.body.pos, d = g.player.lookDir(), l = Math.hypot(d.x, d.z) || 1;
  g.lahar = { t: AVISO, x: p.x, z: p.z, ux: d.x / l, uz: d.z / l, pego: false };
  g.ui.toast('🌋 ¡Un rugido cuesta arriba! Viene un lahar: quítese de lado, rápido (no corra para abajo)', 4200);
  return 'Un lahar viene desde donde usted mira. Tiene 5 segundos para quitarse de lado';
}
