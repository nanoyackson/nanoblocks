// La Tulevieja (leyenda costarricense): una vieja con alas y un sombrero enorme de tule que de noche vuela sobre
// los ríos. Jefa voladora: da vueltas alto, baja en picada con un chillido (el amago: momento del parry), pega con
// las garras y vuelve a subir. Aturdida cae al suelo y ahí se le puede pegar. Suelta su sombrero de tule.
import { brilloAmago, arcoGolpe } from './golpes.js';
import { armarTulevieja } from './modelos-leyendas.js';


export const TULEVIEJA = {
  name: 'La Tulevieja', w: 0.9, h: 1.8, health: 140, speed: 7, flying: true, flyHigh: true, legend: true, boss: true, hostile: true, attack: 5, xp: 70,
  hurtSound: 'grito', idleSound: 'susurro', idleEvery: [6, 12], particle: [[0.25, 0.2, 0.15], [0.8, 0.75, 0.6]],
  drops: [[405, 1, 1], [277, 1, 3]],
  build() { return armarTulevieja(); },
  flyGoal(m, g) {
    const pl = g.player.body.pos, b = m.body.pos, ck = g.clock || 0;
    const dt = Math.min(0.1, ck - (m.data.lastCk ?? ck)); m.data.lastCk = ck;
    m.data.angry = true;
    if (g.mode !== 'survival' || !g.player.alive) return { x: b.x, y: b.y + 4, z: b.z };
    // aturdida (parry): cae al suelo un rato
    if ((m.stunT || 0) > 0) {
      m.stunT -= dt;
      if (Math.random() < 0.3) g.particles.spawn(b.x, b.y + 2, b.z, [1, 0.95, 0.4], 0, 0.2, 0, 0.35, 0, true);
      return { x: b.x, y: g.world.gen.column(Math.floor(b.x), Math.floor(b.z)).h + 1, z: b.z };
    }
    const d = Math.hypot(pl.x - b.x, pl.y + 1 - b.y, pl.z - b.z);
    // el llanto: cada rato, de cerca, marea (camina en zigzag y la vista da vueltas)
    m.data.llanto = (m.data.llanto ?? 6) - dt;
    if (m.data.llanto <= 0 && d < 18) { m.data.llanto = 11 + Math.random() * 4; g.audio.play('grito', { pos: m.soundPos(), vol: 1.1, pitch: 1.35 }); g.addEffect('mareo', 3); if (!g.meta.tuleAviso) { g.meta.tuleAviso = true; g.ui.toast('🌀 El llanto de la Tulevieja lo marea. Aguante y espere la picada', 2800); } }
    // el amago: se queda quieta chillando un instante antes del zarpazo
    if ((m.windT || 0) > 0) {
      m.windT -= dt;
      if (m.windT < 0.26 && !m.data.brillo) { m.data.brillo = true; brilloAmago(m, g); }
      if (m.windT <= 0) {
        m.data.brillo = false; arcoGolpe(g, b.x, b.y + 1, b.z, m.yaw || 0, false, 1.7);
        if (d < 3.2) g.damagePlayer(5, b.x, b.z, 'La Tulevieja le clavó las garras', false, true);
        m.data.up = ck + 2.5;
      }
      return { x: b.x, y: b.y, z: b.z };
    }
    if (ck < (m.data.up || 0)) {
      const a = ck * 0.8;
      return { x: pl.x + Math.cos(a) * 10, y: pl.y + 9, z: pl.z + Math.sin(a) * 10 };
    }
    if (d < 2.4 && ck > (m.data.cd || 0)) {
      m.data.cd = ck + 3;
      m.windT = 0.55; m.data.brillo = false; // igual que la Arpía: el parry cortaba el amago y el brillo no volvía
      g.audio.play('grito', { pos: { x: b.x, y: b.y, z: b.z }, vol: 0.7, pitch: 1.3 });
      g.particles.spawn(b.x, b.y + 2.1, b.z, [1, 0.2, 0.15], 0, 0.6, 0, 0.5, 0, true);
      return { x: b.x, y: b.y, z: b.z };
    }
    return { x: pl.x, y: pl.y + 1.4, z: pl.z };
  },
};

