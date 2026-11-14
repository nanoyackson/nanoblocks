// El chompipe: el pavo de las fincas, negro con el moco rojo. Anda tranquilo picoteando, pero si uno se le arrima mucho se esponja,
// abre la cola en abanico, hace «glu-glu-glu» y lo corretea a uno un rato, a picotazos (duelen poquito y no matan). Si se le pega,
// sale corriendo. Estado: nada que guardar; aparece de día en los potreros cerca de los pueblos.
import { atacar } from './golpes.js';
import { armarChompipe } from './modelos-mar.js';

export const CHOMPIPE = {
  chompipe: {
    name: 'Chompipe', w: 0.55, h: 0.9, health: 8, speed: 1.3, hostile: false, hurtSound: 'gallina', idleSound: 'gallina', idleEvery: [8, 15],
    particle: [[0.15, 0.15, 0.17]], drops: [[262, 1, 2]], xp: 3,
    build() { return armarChompipe(); },
    brain(m, dt, c) {
      const { g, distP, dxp, dzp } = c;
      const D = m.data;
      D.bravo = Math.max(0, (D.bravo || 0) - dt);
      if (m.panic > 0) { D.bravo = 0; return false; }
      if (!D.bravo && distP < 4 && g.player.alive && g.mode === 'survival' && (D.calma || 0) <= 0) {
        D.bravo = 7; D.calma = 20;
        g.audio.play('gallina', { pos: m.soundPos(), vol: 1, pitch: 0.55 });
        g.ui.toast('🦃 ¡Glu-glu-glu! El chompipe se esponjó y viene por usted', 2600);
      }
      D.calma = Math.max(0, (D.calma || 0) - dt);
      if (D.bravo > 0) {
        m.targetYaw = Math.atan2(dxp, dzp); m.goTo(c.pl.x, c.pl.z, 2.2);
        if (distP < 1.2 && m.attackCd <= 0 && g.player.alive) {
          const P = g.player, dano = Math.min(1, Math.max(0, P.health - 1));
          atacar(m, g, { tipo: 'mordida', prep: 0.42, dano, causa: 'Picotazo de chompipe', alcance: 1.2, armored: false, cd: 1.1, alGolpe: (llego) => {
            if (!llego) return;
            if (Math.random() < 0.3) g.audio.play('gallina', { pos: m.soundPos(), vol: 0.9, pitch: 0.6 });
            g.achieve('chompipe', 'Me correteó el chompipe');
          } });
        }
        return true;
      }
      return false;
    },
    onHurt(m) { m.panic = 4; m.data.bravo = 0; return true; },
    animate(m, dt, u) {
      const bravo = (m.data.bravo || 0) > 0;
      u.abre = (u.abre || 0) + ((bravo ? 1 : 0) - (u.abre || 0)) * Math.min(1, dt * 5);
      u.plumas.forEach((p, i) => { p.rotation.z = (i - 4) * 0.2 * (0.25 + u.abre * 0.75); p.rotation.x = -0.3 - u.abre * 0.9; });
      u.cola.scale.setScalar(0.7 + u.abre * 0.5);
      u.body.scale.set(1 + u.abre * 0.12, 1 + u.abre * 0.08, 1);
      u.headRx = bravo ? Math.sin(m.t * 18) * 0.15 : Math.sin(m.t * 2) * 0.1 + (m.moving ? 0 : Math.max(0, Math.sin(m.t * 0.8)) * 0.6); // picotea el suelo
      u.moco.rotation.z = Math.sin(m.t * (bravo ? 20 : 3)) * 0.3;
      u.legs.forEach((l, i) => { l.rotation.x = m.moving ? Math.sin(m.t * 12 + i * Math.PI) * 0.6 : 0; });
    },
  },
};
// cada segundo: de día, en el potrero cerca de un pueblo, de vez en cuando aparece uno
export function tickChompipes(g) {
  if (g.dim !== 'tierra' || g.daylight < 0.45 || Math.random() > 1 / 40) return;
  const p = g.player.body.pos, bio = g.env && g.env.biome;
  if (bio !== 'plains' && bio !== 'forest') return;
  const v = g.nearestVillage && g.nearestVillage(p.x, p.z);
  if (!v || v.dist > 80 || v.dist < 20) return;
  if (g.entities.mobs.filter((m) => m.type === 'chompipe' && !m.dead).length >= 2) return;
  const a = Math.random() * Math.PI * 2, x = p.x + Math.cos(a) * 18, z = p.z + Math.sin(a) * 18;
  if (!g.world.isLoaded(x, z)) return;
  let y = Math.floor(p.y) + 8; while (y > 1 && !g.world.getBlock(Math.floor(x), y - 1, Math.floor(z))) y--;
  g.entities.spawnMob('chompipe', x, y + 0.1, z);
}
export function pruebaChompipe(g) {
  const p = g.player.body.pos, d = g.player.lookDir();
  g.entities.spawnMob('chompipe', p.x + d.x * 6, p.y + 0.3, p.z + d.z * 6);
  return 'Un chompipe adelante: arrímesele y verá';
}
