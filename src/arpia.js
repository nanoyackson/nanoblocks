// La Arpía de la Tormenta: jefa de las Tierras del Cielo (el águila arpía es el ave rapaz más grande de Costa Rica;
// esta es una de tormenta, con copete doble y alas de nubarrón). Cierra la escala de jefes:
//  - picada con amago (chillido): bloquear a tiempo hace parry y la deja aturdida al nivel del jugador,
//  - rayos marcados en el suelo con un círculo que crece: no se bloquean, se esquivan rodando o corriendo,
//  - ráfaga de viento que empuja hacia el borde de la isla: con el escudo arriba se aguanta.
// Con menos de la mitad de vida tira tres rayos y las ráfagas salen más seguido. Suelta plumas para la Capa de la Arpía.
import { brilloAmago, arcoGolpe, avisoCaida, anilloAviso, COLOR_AVISO } from './golpes.js';
import { armarArpia } from './modelos-volcan.js';


export const ARPIA = {
  name: 'La Arpía de la Tormenta', w: 1.2, h: 1.5, health: 260, speed: 8, flying: true, flyHigh: true, boss: true, hostile: true, attack: 6, xp: 180,
  hurtSound: 'arpia', idleSound: 'arpia', idleEvery: [5, 10], particle: [[0.55, 0.58, 0.65], [0.9, 0.9, 1]],
  drops: [[406, 3, 5], [388, 1, 2]],
  build() { return armarArpia(); },
  flyGoal(m, g) {
    const pl = g.player.body.pos, b = m.body.pos, ck = g.clock || 0;
    const dt = Math.min(0.1, ck - (m.data.lastCk ?? ck)); m.data.lastCk = ck;
    m.data.angry = true;
    tickStrikes(m, g, dt);
    if (g.mode !== 'survival' || !g.player.alive) return { x: b.x, y: b.y + 4, z: b.z };
    const enraged = m.health < ARPIA.health / 2;
    if (enraged && !m.data.rage) { m.data.rage = true; g.ui.toast('⚡ ¡La Arpía se enfurece! Más rayos y más viento', 2600); g.audio.play('trueno', { vol: 0.8 }); }
    // aturdida (parry): queda aleteando torpe a la altura del jugador, ahí se le pega
    if ((m.stunT || 0) > 0) {
      m.stunT -= dt;
      if (Math.random() < 0.3) g.particles.spawn(b.x, b.y + 1.8, b.z, [0.8, 0.9, 1], 0, 0.2, 0, 0.35, 0, true);
      return { x: b.x, y: pl.y + 0.6, z: b.z };
    }
    const d = Math.hypot(pl.x - b.x, pl.y + 1 - b.y, pl.z - b.z);
    // el amago: frena en el aire, levanta el copete y chilla antes del zarpazo
    if ((m.windT || 0) > 0) {
      m.windT -= dt;
      if (m.windT < 0.26 && !m.data.brillo) { m.data.brillo = true; brilloAmago(m, g); }
      if (m.windT <= 0) {
        m.data.brillo = false; arcoGolpe(g, b.x, b.y + 1, b.z, m.yaw || 0, false, 1.8);
        if (d < 3.4) g.damagePlayer(6, b.x, b.z, 'La Arpía de la Tormenta le clavó las garras', false, true);
        else m.data.posa = ck + 2;
        m.data.up = ck + (enraged ? 2 : 3);
      }
      return { x: b.x, y: b.y, z: b.z };
    }
    // rayos: marca el suelo donde estás (y alrededor si está furiosa)
    if (ck > (m.data.boltCd || 6)) {
      m.data.boltCd = ck + (enraged ? 4.5 : 6.5);
      const n = enraged ? 3 : 1;
      for (let k = 0; k < n; k++) {
        const a = Math.random() * Math.PI * 2, r = k === 0 ? 0 : 2.5 + Math.random() * 2;
        const S = { x: pl.x + Math.cos(a) * r, y: pl.y, z: pl.z + Math.sin(a) * r, t: 1.3 + k * 0.25 };
        (m.data.strikes ||= []).push(S); avisoCaida(g, S.x, S.y, S.z, 1.8, S.t, m);
      }
      g.audio.play('arpia', { pos: { x: b.x, y: b.y, z: b.z }, vol: 0.6, pitch: 1.1 });
    }
    // ráfaga: aletazo que empuja hacia afuera; con el escudo arriba se aguanta.
    // v12.16.0: furiosa, la ráfaga se avisa con un silbido 1 s antes
    const soltarRafaga = () => {
      m.data.flapT = 0.8;
      const dx = pl.x - b.x, dz = pl.z - b.z, l = Math.hypot(dx, dz) || 1;
      const k = g.blocking ? 0.25 : 1;
      g.player.body.vel.x += (dx / l) * 13 * k; g.player.body.vel.z += (dz / l) * 13 * k; g.player.body.vel.y = Math.max(g.player.body.vel.y, 4 * k);
      g.audio.play('rafaga', { vol: 0.9 });
      g.shake = Math.max(g.shake || 0, 0.4);
      for (let i = 0; i < 30; i++) g.particles.spawn(b.x + (Math.random() - 0.5) * 3, b.y + Math.random() * 2, b.z + (Math.random() - 0.5) * 3, [0.92, 0.95, 1], (dx / l) * 9, 0.5, (dz / l) * 9, 0.8, 0, true);
      g.ui.toast(g.blocking ? '🛡 Aguantó la ráfaga con el escudo' : '🌬 ¡Ráfaga! Levante el escudo para aguantarla', 1600);
    };
    if (m.data.gustPre > 0) {
      m.data.gustPre -= dt;
      anilloAviso(g, b.x, b.y, b.z, 3, dt, m, COLOR_AVISO.azul);
      if (m.data.gustPre <= 0) soltarRafaga();
    } else if (d < 16 && ck > (m.data.gustCd || 10)) {
      m.data.gustCd = ck + (enraged ? 7 : 10);
      // v12.16.4: SIEMPRE avisa (silbido + anillo): 0,6 s con vida normal, 1,0 s furiosa
      m.data.gustPre = enraged ? 1 : 0.6; g.audio.play('arpia', { pos: { x: b.x, y: b.y, z: b.z }, vol: 0.8, pitch: enraged ? 1.7 : 1.5 }); g.ui.toast('🌬 Se oye el silbido… ¡escudo arriba!', 1100);
    }
    // se posa 2 s tras una picada fallida: ahí se le pega
    if (ck < (m.data.posa || 0)) {
      if (Math.random() < 0.3) g.particles.spawn(b.x, b.y + 1.5, b.z, [0.8, 0.9, 1], 0, 0.2, 0, 0.35, 0, true);
      return { x: b.x, y: pl.y + 0.3, z: b.z };
    }
    // después de atacar sube a dar vueltas alto
    if (ck < (m.data.up || 0)) {
      const a = ck * 0.7;
      return { x: pl.x + Math.cos(a) * 12, y: pl.y + 10, z: pl.z + Math.sin(a) * 12 };
    }
    if (d < 2.6 && ck > (m.data.cd || 0)) {
      m.data.cd = ck + (enraged ? 2.4 : 3.2);
      m.windT = 0.6; m.data.brillo = false; // si el amago anterior lo cortó un parry o un tambaleo, el flag se quedaba pegado y no volvía a brillar
      g.audio.play('arpia', { pos: { x: b.x, y: b.y, z: b.z }, vol: 0.9, pitch: 1.2 });
      g.particles.spawn(b.x, b.y + 1.9, b.z, [1, 1, 0.5], 0, 0.6, 0, 0.5, 0, true);
      return { x: b.x, y: b.y, z: b.z };
    }
    return { x: pl.x, y: pl.y + 1.3, z: pl.z };
  },
  animate(m, dt, u) {
    m.data.flapT = Math.max(0, (m.data.flapT || 0) - dt);
    const up = (m.windT || 0) > 0 || m.data.flapT > 0 ? 1 : 0;
    u.crest.forEach((c, i) => { c.rotation.x = -0.3 - up * 0.9; c.rotation.z = (i ? 1 : -1) * up * 0.3; });
    if (m.data.flapT > 0) u.wings.forEach(({ p, side }) => { p.rotation.z = side * Math.sin(m.data.flapT * 20) * 1.1; });
  },
};

// los rayos: un círculo que se cierra en el suelo y después cae la descarga
function tickStrikes(m, g, dt) {
  const list = m.data.strikes;
  if (!list || !list.length) return;
  for (const s of list) {
    s.t -= dt;
    const r = 0.4 + Math.max(0, s.t) * 1.4;
    if (Math.random() < 0.8) { const a = Math.random() * Math.PI * 2; g.particles.spawn(s.x + Math.cos(a) * r, s.y + 0.15, s.z + Math.sin(a) * r, [0.7, 0.85, 1], 0, 0.3, 0, 0.4, 0, true); }
    if (s.t > 0) continue;
    for (let y = 0; y < 18; y += 0.6) g.particles.spawn(s.x + (Math.random() - 0.5) * 0.5, s.y + y, s.z + (Math.random() - 0.5) * 0.5, [0.85, 0.95, 1], 0, 0, 0, 0.3, 0, true);
    for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2; g.particles.spawn(s.x, s.y + 0.3, s.z, [1, 1, 0.7], Math.cos(a) * 5, 2, Math.sin(a) * 5, 0.5, 2, true); }
    g.audio.play('trueno', { pos: { x: s.x, y: s.y, z: s.z }, vol: 0.85, pitch: 1.1 });
    if (g.weather) g.weather.flash = Math.max(g.weather.flash || 0, 0.7);
    const p = g.player.body.pos;
    if (Math.hypot(p.x - s.x, p.z - s.z) < 1.8 && Math.abs(p.y - s.y) < 3) g.damagePlayer(6, null, null, 'Le cayó un rayo de la Arpía', true, true);
  }
  m.data.strikes = list.filter((s) => s.t > 0);
}

// en el cielo, de vez en cuando aparece (una a la vez, con descanso entre apariciones)
export function arpiaSpawn(E, g) {
  if (g.mode !== 'survival' || E.mobs.some((m) => m.type === 'arpia' && !m.dead)) return false;
  const ck = g.clock || 0;
  if ((g.dimT || 0) < 45 || ck < (g.arpiaCdLocal || 0) || Math.random() > 0.05) return false;
  g.arpiaCdLocal = ck + (g.meta.hist && g.meta.hist.cap === 7 ? 120 : 420);
  const pl = g.player.body.pos, a = Math.random() * Math.PI * 2;
  const m = E.spawnMob('arpia', pl.x + Math.cos(a) * 20, pl.y + 14, pl.z + Math.sin(a) * 20);
  m.data.angry = true;
  g.ui.toast('⛈ ¡La Arpía de la Tormenta baja de las nubes!', 3200);
  g.audio.play('arpia', { vol: 1 });
  g.audio.play('trueno', { vol: 0.7 });
  return true;
}
