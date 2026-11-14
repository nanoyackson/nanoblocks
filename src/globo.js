// El globo aerostático: los sábados y domingos, de día, en los pueblos, Don Fito estaciona su globo (a rayas azules, blancas y
// rojas) a la orilla de la plaza. Por ₡15 (clic derecho a la canasta) se sube uno: el globo sube con sus llamaradas, el viento lo
// lleva un buen rato por encima de todo y después baja donde caiga (si abajo hay agua, sigue hasta encontrar tierra).
// Estado: g.globoViaje (no se guarda), g.globoPueblo (el globo estacionado: un mob 'globo').
import { armarGlobo } from './modelos-cosas.js';
import { SOLID, FLUID, AIR } from './blocks.js';
import { decir } from './misiones.js';
import { anotar } from './diario.js';

const COLON = 360, PRECIO = 15, SUBE = 14, VUELA = 60, ALTO = 38;
const finde = (g) => { const d = (g.day || 1) % 7; return d === 6 || d === 0; };
function suelo(g, x, z, y0 = 130) { let y = y0; while (y > 1 && !SOLID[g.world.getBlock(Math.floor(x), y - 1, Math.floor(z))] && !FLUID[g.world.getBlock(Math.floor(x), y - 1, Math.floor(z))]) y--; return y; }
export const GLOBO = {
  globo: {
    name: 'Globo de Don Fito (clic derecho: ₡15 la vuelta)', w: 1.6, h: 1.1, health: 999, speed: 0, noJump: true, hurtSound: null, idleSound: null, idleEvery: [999, 999],
    particle: [[0.8, 0.8, 0.8]], drops: [], xp: 0,
    build() { return armarGlobo(); },
    brain(m) { m.moving = false; m.data.apuro = true; return true; },
    onHurt() { return false; },
    interact(m, g) { return subir(g, m); },
    animate(m, dt, u) { u.body.rotation.y += dt * 0.05; u.llama.visible = !!(m.game.globoViaje && m.game.globoViaje.m === m && m.game.globoViaje.llama > 0); },
  },
};
function subir(g, m) {
  if (g.globoViaje || g.riding || g.monta || g.vagon || !g.player.alive) return false;
  if (m.data.desinfla) { decir(g, m, 'Diay, ya lo estoy desinflando. El otro fin de semana.', 2.6); return true; }
  if (g.mode === 'survival') {
    if (g.inventory.count(COLON) < PRECIO) { decir(g, m, `La vuelta vale ₡${PRECIO}, mi estimado. Sin plata no hay globo.`, 3); return true; }
    g.inventory.remove(COLON, PRECIO);
  }
  const W = g.weather, ang = W && W.windDir != null ? W.windDir : Math.random() * Math.PI * 2;
  g.globoViaje = { m, fase: 'sube', t: 0, y0: m.body.pos.y, dx: Math.cos(ang), dz: Math.sin(ang), llama: 1, extra: 0 };
  m.noGravity = true;
  g.audio.play('ignite', { pos: m.soundPos(), vol: 1 });
  g.ui.toast('🎈 Don Fito prende el quemador: el viento decide adónde vamos', 4200);
  return true;
}
// cada cuadro mientras va en el globo (lo llama game.js en vez de mover al jugador)
export function globoUpdate(g, dt) {
  const V = g.globoViaje;
  if (!V) return;
  const m = V.m, b = m.body.pos, P = g.player.body;
  if (m.dead || !g.player.alive) { cortar(g); return; }
  V.t += dt; V.llama -= dt;
  if (V.fase === 'sube') {
    b.y += dt * (ALTO / SUBE);
    if (Math.random() < dt * 1.2) { V.llama = 0.8; g.audio.play('ignite', { pos: m.soundPos(), vol: 0.7 }); }
    if (V.t >= SUBE) { V.fase = 'vuela'; V.t = 0; g.achieve('globo', 'Vuelta en globo'); }
  } else if (V.fase === 'vuela') {
    b.x += V.dx * dt * 3.2; b.z += V.dz * dt * 3.2; b.y += Math.sin(V.t * 0.5) * dt * 0.4;
    // un cerro adelante: el quemador lo sube por encima
    const sueloAqui = suelo(g, b.x + V.dx * 4, b.z + V.dz * 4);
    if (b.y < sueloAqui + 12) { b.y += dt * 4; V.llama = 0.5; }
    if (Math.random() < dt * 0.4) { V.llama = 0.6; g.audio.play('ignite', { pos: m.soundPos(), vol: 0.5 }); }
    if (V.t >= VUELA) {
      // ¿abajo hay agua? sigue un rato más hasta encontrar tierra
      const y = suelo(g, b.x, b.z), id = g.world.getBlock(Math.floor(b.x), y - 1, Math.floor(b.z));
      if (FLUID[id] && V.extra < 120) { V.extra += dt; V.t -= dt; } else { V.fase = 'baja'; V.t = 0; g.ui.toast('🎈 Don Fito abre la válvula: vamos bajando', 2400); }
    }
  } else if (V.fase === 'baja') {
    const piso = suelo(g, b.x, b.z);
    b.x += V.dx * dt * 1.2; b.z += V.dz * dt * 1.2;
    b.y = Math.max(piso, b.y - dt * 3);
    if (b.y <= piso + 0.05) {
      g.globoViaje = null; m.noGravity = false;
      P.pos.x = b.x + 1.6; P.pos.z = b.z; P.pos.y = piso + 0.1; P.vel.x = P.vel.y = P.vel.z = 0;
      g.sinCaida = (g.clock || 0) + 3;
      decir(g, m, '¡Aterrizamos! Bueno… más o menos donde dijo el viento. ¡Que le vaya bien!', 4);
      g.ui.toast('🎈 ¡Aterrizaje! Don Fito se queda a desinflar el globo', 3000);
      anotar(g, 'Di una vuelta en globo con Don Fito. El viento nos llevó lejos.', '🎈');
      m.data.desinfla = 20;
      return;
    }
  }
  m.body.vel.x = m.body.vel.y = m.body.vel.z = 0;
  // uno, de pie en la canasta
  P.pos.x = b.x + 0.25; P.pos.z = b.z + 0.25; P.pos.y = b.y + 0.35; P.vel.x = P.vel.y = P.vel.z = 0; P.fallStart = null;
  if (V.llama > 0 && Math.random() < dt * 30) g.particles.spawn(b.x, b.y + 2.9, b.z, [1, 0.6, 0.15], (Math.random() - 0.5) * 0.4, 2, (Math.random() - 0.5) * 0.4, 0.4, 2, true);
}
// si el viaje se corta en el aire (el globo se perdió, uno murió, salió del mundo), que nadie se quiebre por eso
function cortar(g) {
  const V = g.globoViaje;
  if (!V) return;
  g.globoViaje = null;
  if (V.m && !V.m.dead) V.m.noGravity = false;
  const P = g.player.body;
  if (g.player.alive) { P.pos.y = suelo(g, P.pos.x, P.pos.z) + 0.1; P.vel.y = 0; g.sinCaida = (g.clock || 0) + 5; }
}
// para guardar: dónde queda uno si se sale en pleno vuelo (en el suelo, debajo)
export function posGuardableGlobo(g) { const V = g.globoViaje; if (!V) return null; const p = g.player.body.pos; return { x: p.x, y: suelo(g, p.x, p.z) + 0.1, z: p.z }; }
// cada segundo: estaciona el globo los fines de semana; lo quita después
export function tickGlobo(g) {
  const G = g.globoPueblo;
  if (G) {
    const m = G.m;
    if (m.data.desinfla) { m.data.desinfla--; if (m.data.desinfla <= 0 && !(g.globoViaje && g.globoViaje.m === m)) { m.dead = true; g.globoPueblo = null; } return; }
    if (!g.globoViaje && (m.dead || !finde(g) || g.daylight < 0.4 || Math.hypot(m.body.pos.x - g.player.body.pos.x, m.body.pos.z - g.player.body.pos.z) > 100)) { if (!m.dead) m.dead = true; g.globoPueblo = null; }
    return;
  }
  if (g.dim !== 'tierra' || !finde(g) || g.daylight < 0.5 || g.globoHoy === (g.day || 1)) return;
  const p = g.player.body.pos, v = g.nearestVillage && g.nearestVillage(p.x, p.z);
  if (!v || v.dist > 50) return;
  // un claro con cielo abierto cerca de la plaza
  for (let k = 0; k < 30; k++) {
    const a = Math.random() * Math.PI * 2, r = 8 + Math.random() * 14, x = Math.floor(v.v.x + Math.cos(a) * r), z = Math.floor(v.v.z + Math.sin(a) * r);
    if (!g.world.isLoaded(x, z)) continue;
    const y = suelo(g, x + 0.5, z + 0.5);
    if (FLUID[g.world.getBlock(x, y - 1, z)]) continue;
    let libre = true;
    for (let dx = -2; dx <= 2 && libre; dx++) for (let dz = -2; dz <= 2 && libre; dz++) for (let dy = 0; dy < 12; dy++) if (g.world.getBlock(x + dx, y + dy, z + dz) !== AIR) { libre = false; break; }
    if (!libre) continue;
    const m = g.entities.spawnMob('globo', x + 0.5, y + 0.05, z + 0.5);
    if (!m) return;
    g.globoPueblo = { m }; g.globoHoy = g.day || 1;
    if (v.dist < 40) g.ui.toast('🎈 ¡Don Fito trajo el globo a la plaza! Una vuelta por ₡15 (clic derecho a la canasta)', 4200);
    return;
  }
}
export const limpiarGlobo = (g) => { cortar(g); if (g.globoPueblo && !g.globoPueblo.m.dead) g.globoPueblo.m.dead = true; g.globoPueblo = null; };
export function pruebaGlobo(g) {
  limpiarGlobo(g);
  const p = g.player.body.pos, d = g.player.lookDir(), x = p.x + d.x * 4, z = p.z + d.z * 4;
  const m = g.entities.spawnMob('globo', x, suelo(g, x, z, Math.floor(p.y) + 8) + 0.05, z);
  if (!m) return 'No se pudo';
  g.globoPueblo = { m };
  return 'El globo de Don Fito, delante: clic derecho a la canasta (₡15)';
}
