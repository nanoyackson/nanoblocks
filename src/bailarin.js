// El Bailarín Elegante: en las noches de fiesta, en la plaza de un pueblo, aparece un forastero muy bien vestido que saca a bailar.
// Habla bonito y regala. Quien le mira los pies (mirando para abajo, de cerca) ve que tiene pata de gallo: ahí se acaba el baile,
// huele a azufre y hay que pelear. Quien baila con él sin mirarle los pies, al rato lo ve irse… y la moneda que le dejó quema.
// Estado: g.bailarin = mob (no se guarda), meta.bailarinVisto, meta.bailarinCd.
import { atacar } from './golpes.js';
import { SOLID } from './blocks.js';
import { difOf } from './supervivencia.js';
import { armarBailarin } from './modelos-otros.js';
import { pintarBase } from './models.js';
import { fiestaHoy } from './fiestas2.js';

const ORO = 259, ESENCIA = 499, COLON = 360;
// cada segundo
export function tickBailarin(g) {
  if (g.dim !== 'tierra' || g.mode !== 'survival' || !g.meta) return;
  const M = g.bailarin, p = g.player.body.pos, t = g.time || 0, noche = t > 0.6 && t < 0.92;
  if (M && (M.dead || !noche)) {
    if (!M.dead && M.data.revelado) { g.particles.burst(M.body.pos.x, M.body.pos.y + 1, M.body.pos.z, [[0.9, 0.85, 0.3], [0.2, 0.2, 0.2]], 30, 2); M.dead = true; g.ui.toast('🎩 Con la primera luz, el Bailarín se deshizo en humo de azufre', 3000); }
    if (!M.dead && !M.data.revelado) { g.particles.burst(M.body.pos.x, M.body.pos.y + 1, M.body.pos.z, [[0.2, 0.2, 0.2], [1, 0.8, 0.2]], 20, 1.5); M.dead = true; g.ui.toast('🎩 El forastero se despidió con una venia y se perdió entre la gente. Olía a azufre', 3200); }
    g.bailarin = null; return;
  }
  if (M) return;
  if (!noche || !fiestaHoy(g) || (g.clock || 0) < (g.meta.bailarinCd || 0) || !g.settings.hostiles || !difOf(g).hostiles) return;
  const v = g.nearestVillage(p.x, p.z);
  if (!v || v.dist > 50 || !g.world.isLoaded(v.v.x, v.v.z)) return;
  const c = v.v, a = Math.random() * Math.PI * 2;
  const m = g.entities.spawnMob('bailarin', c.x + Math.cos(a) * 4, (c.y || p.y) + 1.2, c.z + Math.sin(a) * 4);
  if (!m) return;
  g.bailarin = m; g.meta.bailarinCd = (g.clock || 0) + 2400;
  g.ui.toast('🎩 Un forastero muy elegante saca a bailar a todo el mundo en la plaza', 3600);
}
export function limpiarBailarin(g) { if (g.bailarin) g.bailarin.dead = true; g.bailarin = null; }
export function pruebaBailarin(g) {
  limpiarBailarin(g);
  const p = g.player.body.pos, d = g.player.lookDir();
  const m = g.entities.spawnMob('bailarin', p.x + d.x * 4, p.y + 0.5, p.z + d.z * 4);
  g.bailarin = m; g.time = 0.7;
  return 'El forastero elegante, delante. Háblele (clic derecho) para bailar, o mírele los pies de cerca';
}
function revelar(g, m) {
  const D = m.data;
  if (D.revelado) return;
  D.revelado = true; D.provoked = true; D.angry = true;
  m.kind = { ...m.kind, hostile: true };
  const u = m.group.userData;
  if (u.patas) u.patas.forEach((pa) => { pa.visible = true; });
  if (u.zapatos) u.zapatos.forEach((z) => { z.visible = false; });
  g.audio.play('monstruo', { pos: m.soundPos(), vol: 1.2, pitch: 0.6 });
  g.particles.burst(m.body.pos.x, m.body.pos.y + 0.4, m.body.pos.z, [[1, 0.9, 0.2], [0.4, 0.35, 0.2]], 30, 2.5);
  g.addEffect('miedo', 6);
  g.ui.toast('🐓 ¡Tiene pata de gallo! Huele a azufre y la música se calló de golpe', 3600);
  g.meta.bailarinVisto = true;
  g.achieve('bailarin_pies', 'Le vi los pies');
}
export const BAILARIN = {
  bailarin: {
    name: 'El Bailarín Elegante', w: 0.62, h: 1.9, health: 120, speed: 2.4, legend: true, boss: true, attack: 5, hurtSound: 'monstruo', idleSound: null, idleEvery: [999, 999],
    particle: [[0.1, 0.1, 0.12], [1, 0.8, 0.2]], drops: [[ORO, 3, 6], [ESENCIA, 2, 3], [COLON, 20, 40]], xp: 80,
    build() { return armarBailarin(); },
    brain(m, dt, c) {
      const { g, distP, dxp, dzp, pl } = c;
      const D = m.data, b = m.body;
      D.apuro = true;
      // ¿le está mirando los pies? de cerca y mirando para abajo, hacia él
      if (!D.revelado && distP < 3.2) {
        const ld = g.player.lookDir(), l = distP || 1, hacia = ld.x * (-dxp / l) + ld.z * (-dzp / l);
        if (ld.y < -0.55 && hacia > 0.2) { D.mira = (D.mira || 0) + dt; if (D.mira > 0.6) revelar(g, m); } else D.mira = 0;
      }
      if (!D.revelado) {
        // baila solo en la plaza, dando vueltitas, siempre mirando a quien se acerca
        D.ang = (D.ang || 0) + dt * 1.2;
        if (distP < 10) m.targetYaw = Math.atan2(dxp, dzp);
        m.moving = false;
        b.vel.x = Math.cos(D.ang) * 0.8; b.vel.z = Math.sin(D.ang) * 0.8;
        return true;
      }
      if (g.mode !== 'survival' || !g.player.alive) return true;
      // revelado: se aparece por detrás y echa bocanadas de azufre
      D.salto = (D.salto ?? 5) - dt;
      if (D.salto <= 0 && distP < 18) {
        D.salto = 5 + Math.random() * 2;
        const ld = g.player.lookDir(), lh = Math.hypot(ld.x, ld.z) || 1, w = g.world;
        // detrás de uno, en un lugar con piso y dos bloques de aire; si no hay, del otro lado; si tampoco, no salta
        let dest = null;
        for (const s of [1, -1]) {
          const x = Math.floor(pl.x - (ld.x / lh) * 2.5 * s), z = Math.floor(pl.z - (ld.z / lh) * 2.5 * s);
          for (let y = Math.floor(pl.y) + 1; y >= Math.floor(pl.y) - 2 && !dest; y--) if (SOLID[w.getBlock(x, y - 1, z)] && !SOLID[w.getBlock(x, y, z)] && !SOLID[w.getBlock(x, y + 1, z)]) dest = { x: x + 0.5, y, z: z + 0.5 };
          if (dest) break;
        }
        if (!dest) return true;
        b.pos.x = dest.x; b.pos.z = dest.z; b.pos.y = dest.y; b.vel.x = b.vel.z = 0;
        g.particles.burst(b.pos.x, b.pos.y + 1, b.pos.z, [[1, 0.85, 0.2], [0.3, 0.3, 0.3]], 18, 2);
        g.audio.play('swish', { pos: m.soundPos(), vol: 1, pitch: 0.5 });
      }
      D.azufre = (D.azufre ?? 3) - dt;
      if (D.azufre <= 0 && distP < 4.5 && Math.abs(pl.y - b.pos.y) < 2) {
        D.azufre = 4;
        g.particles.burst(b.pos.x, b.pos.y + 1.2, b.pos.z, [[0.9, 0.85, 0.3], [0.6, 0.55, 0.2]], 30, 3);
        g.damagePlayer(3, b.pos.x, b.pos.z, 'El azufre del Bailarín Elegante', false, false);
        g.addEffect('mareo', 3);
      }
      m.targetYaw = Math.atan2(dxp, dzp); m.goTo(pl.x, pl.z, 1.1);
      if (distP < 1.8 && m.attackCd <= 0 && Math.abs(pl.y - b.pos.y) < 1.8) atacar(m, g, { dano: m.kind.attack, causa: 'El Bailarín Elegante', alcance: 1.8, cd: 1.2 });
      return true;
    },
    // hablarle: lo saca a bailar. Al tercer baile sin mirarle los pies, regala una moneda… que quema
    interact(m, g) {
      const D = m.data;
      if (D.revelado) return false;
      D.bailes = (D.bailes || 0) + 1;
      const frases = ['«¡Qué bien baila usted! Venga, otra pieza»', '«No mire para abajo, mire la música»', '«Ya me tengo que ir. Tenga, para que se acuerde de mí»'];
      g.ui.dialog('El forastero elegante', frases[Math.min(2, D.bailes - 1)], 3600);
      g.audio.play('nota.marimba.65', { ui: true, vol: 0.6 });
      if (D.bailes >= 3) {
        g.giveItem(ORO, 1); g.addEffect('escalofrio', 10);
        g.ui.toast('🪙 Le dejó una moneda de oro. Está tibia… no, caliente. Y él ya no está', 3600);
        g.achieve('bailarin_baile', 'Bailé con el forastero');
        g.particles.burst(m.body.pos.x, m.body.pos.y + 1, m.body.pos.z, [[0.2, 0.2, 0.2], [1, 0.8, 0.2]], 20, 1.5);
        m.dead = true;
      }
      return true;
    },
    onHurt(m, g) { if (!m.data.revelado) revelar(g, m); return true; },
    animate(m, dt, u) {
      const D = m.data;
      const sw = D.revelado ? Math.sin(m.walk) * m.walkAmt : Math.sin(m.t * 6);
      u.brazos[0].rotation.x = D.revelado ? -0.5 + sw * 0.6 : -1.2 + sw * 0.3;
      u.brazos[1].rotation.x = D.revelado ? -0.5 - sw * 0.6 : -1.2 - sw * 0.3;
      if (!D.revelado) { u.legs[0].rotation.x = Math.sin(m.t * 6) * 0.35; u.legs[1].rotation.x = -Math.sin(m.t * 6) * 0.35; u.body.rotation.y = Math.sin(m.t * 1.2) * 0.4; }
      u.ojos.children.forEach((o) => { o.userData.glow = !!D.revelado; pintarBase(o.material, D.revelado ? 0xff3010 : 0x1a1a1a); });
      if (D.revelado && Math.random() < dt * 8) { const b = m.body.pos; m.game.particles.spawn(b.x + (Math.random() - 0.5) * 0.5, b.y + 0.1, b.z + (Math.random() - 0.5) * 0.5, [0.9, 0.8, 0.25], 0, 0.6, 0, 0.9, -0.3); }
    },
    alMorir(m, g) { g.achieve('bailarin', 'Se acabó el baile'); g.ui.toast('🎩 Del Bailarín Elegante solo quedó el sombrero humeando… y unas monedas', 3200); },
  },
};
