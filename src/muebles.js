// Muebles de la casa: silla (sentarse), mesa de comedor, hamaca (siesta o dormir), tele vieja (canales ficticios),
// radio (marimba mientras esté encendida) y refri (guarda cosas como un cofre).
import { BLOCKS, BLOCK_BY_KEY as K } from './blocks.js';
import { locutor } from './noticias.js';
import { pronostico } from './temporadas.js';

export const MUEBLES = new Set(['silla', 'hamaca', 'tele', 'tele_on', 'radio', 'radio_on', 'mecedora', 'banca_corredor']);
const ASIENTOS = new Set(['silla', 'mecedora', 'banca_corredor']); // v12.4.0

const CANALES = [
  '📺 Canal 7 y medio: «Hoy en la noche, el partido de la Sele… repetido del 90».',
  '📺 Telenovela «Pasión en el cafetal», capítulo 847: Doña Lupe descubre que su hijo es su sobrino.',
  '📺 Noticias: «Hoy inauguran un puente… y ya lo están remendando».',
  '📺 El pronóstico: «Sol en la mañana, aguacero a las 2, como siempre».',
  '📺 Comercial: «¡Gallo pinto instantáneo! Solo agregue gallo pinto».',
  '📺 Dibujos animados del sábado… es lunes, pero igual.',
  '📺 Programa de cocina: «Hoy: cómo hacer un casado sin gastar… no se puede».',
  '📺 Lotería en vivo: salió el 23, como siempre que usted no compra.',
];

export function usarMueble(g, t) {
  const b = BLOCKS[t.id];
  if (ASIENTOS.has(b.key)) { sentarse(g, t.x, t.y, t.z); if (b.key === 'mecedora') g.achieve('mecedora', 'Mecedora de abuela'); return true; }
  if (b.key === 'hamaca') {
    if (g.lying) return true;
    const storm = g.weather && g.weather.type === 'storm';
    g.lieDown(t.x, t.y - 0.25, t.z, g.daylight > 0.4 && !storm);
    g.achieve('hamaca', 'Hamaqueándome');
    return true;
  }
  if (b.key === 'tele' || b.key === 'tele_on') {
    g.toggleBlock(t.x, t.y, t.z);
    if (b.key === 'tele') {
      g.ui.toast(Math.random() < 0.35 ? pronostico(g) : CANALES[Math.floor(Math.random() * CANALES.length)], 4200); // v12.3.0: a veces, el pronóstico de verdad
      g.audio.play('click', { pos: { x: t.x + 0.5, y: t.y + 0.5, z: t.z + 0.5 }, vol: 0.5 });
      g.achieve('tele', 'Pegado a la tele');
    }
    return true;
  }
  if (b.key === 'radio' || b.key === 'radio_on') {
    g.toggleBlock(t.x, t.y, t.z);
    g.audio.play('click', { pos: { x: t.x + 0.5, y: t.y + 0.5, z: t.z + 0.5 }, vol: 0.5 });
    if (b.key === 'radio') { g.radio = { x: t.x, y: t.y, z: t.z, t: 0 }; g.ui.toast('📻 Radio Marimba, la que suena en todo el país (ficticia)', 2400); g.achieve('radio', 'Con la radio puesta'); }
    else g.radio = null;
    return true;
  }
  return false;
}

// sentarse en la silla: queda quieto y bajito; cualquier tecla de movimiento lo levanta
function sentarse(g, x, y, z) {
  if (g.sentado) return;
  const p = g.player.body;
  g.sentado = { x: x + 0.5, y: y + 0.35, z: z + 0.5, t: 0, desde: { x: p.pos.x, y: p.pos.y, z: p.pos.z } }; // v12.2.0: llega en 0.35 s, sin salto
  p.vel.x = p.vel.y = p.vel.z = 0;
  g.audio.play('dig.wood', { pos: { x: x + 0.5, y: y + 0.5, z: z + 0.5 }, vol: 0.4, pitch: 1.2 });
  if (!g.meta.sillaAviso) { g.meta.sillaAviso = true; g.ui.toast('🪑 En la silla se descansa (menos cansancio y hambre). Muévase para levantarse', 2600); }
  g.achieve('silla', 'A echarse un descansito');
}

// cada cuadro
export function tickMuebles(g, dt) {
  // v12.4.4: la mecedora cura 6 veces y después descansa 5 minutos, aunque uno se levante y se vuelva a sentar. v12.4.9: va en meta
  // y con el reloj del mundo (día + hora): guardar y volver, o recargar la página, ya no la deja lista (5 min = 0.25 de día)
  const MC = g.meta.mecedora, ahora = (g.day || 1) + (g.time || 0);
  if (MC && MC.hasta && ahora >= MC.hasta) { MC.n = 0; MC.hasta = 0; }
  const S = g.sentado;
  if (S) {
    const k = g.keys;
    if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space', 'ShiftLeft', 'ShiftRight'].some((c) => k.has(c)) || !ASIENTOS.has(BLOCKS[g.world.getBlock(Math.floor(S.x), Math.floor(S.y), Math.floor(S.z))].key)) {
      g.sentado = null;
      g.player.body.pos.y = Math.floor(S.y) + 1.05;
    } else {
      const b = g.player.body, D = S.desde, f = D ? Math.min(1, S.t / 0.35) : 1, e = f * f * (3 - 2 * f);
      b.pos.x = D ? D.x + (S.x - D.x) * e : S.x; b.pos.y = D ? D.y + (S.y - D.y) * e : S.y; b.pos.z = D ? D.z + (S.z - D.z) * e : S.z; b.vel.x = b.vel.y = b.vel.z = 0; b.onGround = true; b.fallStart = null;
      S.t += dt; S.rest = (S.rest || 0) + dt; // v12.4.4: S.t es el deslizamiento (no se reinicia: antes daba un tirón cada 20 s)
      // v12.4.0: la mecedora se mece y recupera un corazón cada 12 s (hasta 6 por sentada)
      if (g.world.getBlock(Math.floor(S.x), Math.floor(S.y), Math.floor(S.z)) === K.mecedora) {
        S.mece = (S.mece || 0) + dt;
        g.meceAng = Math.sin(S.mece * Math.PI * 2 * 0.6) * 0.1;
        S.cura = (S.cura || 0) + dt;
        const C = (g.meta.mecedora ||= { n: 0, hasta: 0 }), P = g.player;
        const golpeado = (g.clock || 0) - (g.danoT ?? -99) < 8; // recién golpeado no se cura (v12.4.4)
        if (S.cura >= 12) {
          S.cura = 0;
          if (C.hasta > 0 || golpeado || P.health >= P.maxHealth) { /* nada */ } else {
            C.n++; P.health = Math.min(P.maxHealth, P.health + 2); g.audio.play('dig.wood', { ui: true, vol: 0.2, pitch: 0.8 });
            if (C.n === 1) g.ui.toast('🪑 La mecedora le devuelve las fuerzas', 1800);
            if (C.n >= 6) { C.hasta = ahora + 0.25; g.ui.toast('🪑 Ya se meció bastante: vuelve a curar en 5 minutos', 2400); }
          }
        }
      } else g.meceAng = 0;
      // descansar: el hambre casi no baja y cada 20 s sentado quita un poquito de cansancio
      g.player.hungerT = Math.max(0, g.player.hungerT - dt * 0.6);
      if (S.rest > 20) { S.rest = 0; if ((g.meta.sinDormir || 0) > 0 && Math.random() < 0.2) g.meta.sinDormir--; if (g.player.health < g.player.maxHealth && (g.clock || 0) - (g.danoT ?? -99) >= 8) g.player.health = Math.min(g.player.maxHealth, g.player.health + 1); }
    }
  }
  // la radio: mientras esté encendida y uno cerca, suena una pieza tras otra
  const R = g.radio;
  if (R) {
    if (g.world.getBlock(R.x, R.y, R.z) !== K.radio_on) { g.radio = null; return; }
    const p = g.player.body.pos;
    R.t -= dt;
    if (R.t <= 0 && Math.hypot(R.x - p.x, R.z - p.z) < 14 && g.music) { R.t = g.music.concert() + 2 + Math.random() * 3; locutor(g); }
    if (Math.random() < dt * 1.2) g.particles.spawn(R.x + 0.5, R.y + 0.9, R.z + 0.5, [[1, 0.8, 0.3], [0.5, 0.8, 1], [1, 0.5, 0.8]][Math.floor(Math.random() * 3)], (Math.random() - 0.5) * 0.4, 0.8, (Math.random() - 0.5) * 0.4, 1.4, -0.2, true);
  }
}
