// Bichos del monte seco y de las cuevas: el alacrán (chiquito, con la cola enroscada; pica si uno se le pone encima, y a veces sale
// de un cofre viejo) y la tarántula (grande, peluda y fea, pero inofensiva: solo asusta). Le dan vida al suelo.
import { atacar } from './golpes.js';
import { difOf } from './supervivencia.js';
import { armarAlacran, armarTarantula } from './modelos-alimanas.js';
import { AIR, SOLID } from './blocks.js';

export const BICHOS = {
  alacran: {
    name: 'Alacrán', w: 0.35, h: 0.2, health: 3, speed: 1.4, hurtSound: null, idleSound: null, idleEvery: [999, 999], noJump: true,
    particle: [[0.45, 0.32, 0.18]], drops: [], xp: 2,
    build() { return armarAlacran(); },
    brain(m, dt, c) {
      const { g, distP, dxp, dzp, pl } = c;
      m.data.apuro = true;
      if (g.mode !== 'survival' || !g.player.alive) return false;
      if (distP < 1.3 && Math.abs(pl.y - m.body.pos.y) < 1.2) {
        m.moving = false; m.targetYaw = Math.atan2(dxp, dzp);
        if (m.attackCd <= 0) {
          atacar(m, g, { tipo: 'pinza', prep: 0.5, dano: 2, causa: 'Picadura de alacrán', alcance: 1.3, armored: false, cd: 2, alSoltar: () => { m.data.pica = 0.3; }, alGolpe: (llego) => {
            if (!llego) return;
            const bota = g.inventory.armor[3];
            if (!(bota && bota.id === 527)) { g.addEffect('veneno', 6, 'arana'); g.addEffect('ardor', 20); }
            g.ui.toast('🦂 ¡Un alacrán! Arde y da veneno. La sábila calma el ardor', 2600);
            g.achieve('alacran', 'Me picó un alacrán');
          } });
        }
        return true;
      }
      return false;
    },
    animate(m, dt, u) { m.data.pica = Math.max(0, (m.data.pica || 0) - dt); u.cola.rotation.x = m.data.pica > 0 ? -0.6 : Math.sin(m.t * 3) * 0.08; },
  },
  tarantula: {
    name: 'Tarántula', w: 0.45, h: 0.25, health: 4, speed: 0.9, hurtSound: null, idleSound: null, idleEvery: [999, 999], noJump: true,
    particle: [[0.25, 0.18, 0.12]], drops: [], xp: 1,
    build() { return armarTarantula(); },
    brain(m, dt, c) {
      const { g, distP } = c;
      if (g.mode === 'survival' && distP < 2 && !m.data.asusto) { m.data.asusto = true; g.addEffect('miedo', 2); g.ui.toast('🕷 ¡Uy, una tarántula! Peluda y fea… pero no hace nada', 2400); g.achieve('tarantula', 'No hace nada… creo'); }
      return false;
    },
    animate(m, dt, u) { u.patas.forEach((l, i) => { l.rotation.x = Math.sin(m.t * 10 + i) * 0.3 * m.walkAmt; }); },
  },
};
export function bichosSpawn(E, g) {
  if (g.dim !== 'tierra' || g.mode !== 'survival' || !g.settings.hostiles || !difOf(g).hostiles) return false;
  const w = g.world, pl = g.player.body.pos;
  const a = Math.random() * Math.PI * 2, r = 8 + Math.random() * 18;
  const x = Math.floor(pl.x + Math.cos(a) * r), z = Math.floor(pl.z + Math.sin(a) * r);
  if (!w.isLoaded(x, z)) return false;
  const col = w.gen.column(x, z);
  const count = (t) => E.mobs.filter((m) => m.type === t && !m.dead).length;
  // en el suelo de verdad, cerca de donde está uno (también en cuevas)
  let y = Math.floor(pl.y) + 3;
  while (y > Math.floor(pl.y) - 6 && !(SOLID[w.getBlock(x, y - 1, z)] && w.getBlock(x, y, z) === AIR && w.getBlock(x, y + 1, z) === AIR)) y--;
  if (!(SOLID[w.getBlock(x, y - 1, z)] && w.getBlock(x, y, z) === AIR)) return false;
  const cueva = y < col.h - 4;
  const seco = col.biome === 'bosque_seco' || col.biome === 'desert' || col.biome === 'plains';
  if ((seco || cueva) && count('alacran') < 2 && Math.random() < 0.06) { E.spawnMob('alacran', x + 0.5, y + 0.05, z + 0.5); return true; }
  if (seco && g.daylight < 0.6 && count('tarantula') < 2 && Math.random() < 0.05) { E.spawnMob('tarantula', x + 0.5, y + 0.05, z + 0.5); return true; }
  return false;
}
// al abrir un cofre viejo (de una estructura), a veces sale un alacrán
export function quizaAlacranDeCofre(g, x, y, z) {
  if (g.mode !== 'survival' || g.dim !== 'tierra' || !g.settings.hostiles || !difOf(g).hostiles || Math.random() > 0.12) return;
  const m = g.entities.spawnMob('alacran', x + 0.5, y + 1.05, z + 0.5);
  if (m) g.ui.toast('🦂 Del cofre salió un alacrán. Sacuda antes de meter la mano', 2600);
}
