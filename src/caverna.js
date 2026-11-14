// La Caverna del Rey (generador v12): una boca de piedra con escalera de caracol que baja ~26 bloques a una sala con
// pilares, un foso de lava con puente angosto, pasillos con telarañas, dos cuartos con cofres y, al fondo, el trono
// del Murciélago Rey: al entrar a su sala despierta el jefe (una vez por caverna).
import { armarReyMurcielago } from './modelos-otros.js';
import { BLOCK_BY_KEY as K } from './blocks.js';
import { atacar, avisoEmbestida } from './golpes.js';

const D = 26;
export function buildCaverna(c) {
  // la boca: anillo de piedra musgosa con dos antorchas y una placa
  c.circle(4.5, (x, z, d) => { if (d > 3.2) { c.set(x, 0, z, K.mossy); c.set(x, 1, z, d > 3.8 && (x + z) % 3 === 0 ? K.mossy : 0); } });
  c.placa(3, 1, 4, 2, 'La Caverna del Rey', 'Dicen los viejos que allá abajo duerme el Murciélago Rey. Nadie que bajó con la luz apagada volvió a contarlo.');
  c.set(-4, 1, 0, K.torch); c.set(4, 1, 0, K.torch);
  // el pozo con la escalera de caracol
  c.fill(-2, -D, -2, 2, 0, 2, 0);
  c.spiral(K.escalera_piedra, -D, -1, K.cobble);
  for (let y = -D; y <= -1; y += 5) c.set(2, y + 2, 2, K.torch);
  // la gran sala (al norte del pozo): 17 de ancho, 7 de alto, con pilares
  const S0 = -D - 1;
  c.fill(-8, S0, -22, 8, S0, -3, K.cobble);
  c.fill(-8, S0 + 1, -22, 8, S0 + 7, -3, 0);
  c.fill(-9, S0, -23, 9, S0 + 8, -23, K.stone); c.fill(-9, S0, -2, 9, S0 + 8, -2, K.stone);
  c.fill(-9, S0, -23, -9, S0 + 8, -2, K.stone); c.fill(9, S0, -23, 9, S0 + 8, -2, K.stone);
  c.fill(-8, S0 + 8, -22, 8, S0 + 8, -3, K.stone);
  c.fill(-1, S0 + 1, -2, 1, S0 + 3, -2, 0); // la entrada desde el pozo
  for (const [x, z] of [[-5, -7], [5, -7], [-5, -15], [5, -15]]) { c.fill(x, S0 + 1, z, x, S0 + 7, z, K.mossy); c.set(x, S0 + 4, z + 1, K.torch); }
  // telarañas en las esquinas
  for (const [x, z] of [[-7, -4], [7, -4], [-7, -21], [7, -21], [-6, -12], [6, -12]]) { c.set(x, S0 + 6, z, K.cobweb); c.set(x, S0 + 7, z, K.cobweb); }
  // el foso de lava con el puente angosto
  c.fill(-8, S0 - 2, -13, 8, S0, -10, K.stone);
  c.fill(-8, S0, -12, 8, S0, -11, K.lava);
  c.fill(0, S0, -12, 0, S0, -11, K.cobble);
  // cuartos con cofres a los lados (con telarañas en la puerta)
  for (const s of [-1, 1]) {
    const x0 = s * 10, x1 = s * 15;
    c.fill(Math.min(x0, x1), S0, -9, Math.max(x0, x1), S0 + 5, -5, K.stone);
    c.fill(Math.min(x0, x1) + (s > 0 ? 0 : 1), S0 + 1, -8, Math.max(x0, x1) - (s > 0 ? 1 : 0), S0 + 4, -6, 0);
    c.fill(s * 9, S0 + 1, -7, s * 9, S0 + 2, -7, 0);
    c.set(s * 9, S0 + 2, -7, K.cobweb);
    c.chest(s * 13, S0 + 1, -7, s > 0 ? 3 : 1, c.loot([[259, 2, 5], [258, 3, 8], [257, 6, 14], [260, 0, 2], [274, 1, 2], [369, 1, 3], [440, 2, 4], [360, 10, 30]], 6));
    c.set(s * 12, S0 + 3, -8, K.torch);
  }
  // la sala del trono al fondo (más allá del foso): trono de piedra y huesos
  c.fill(-3, S0 + 1, -21, 3, S0 + 1, -19, K.mossy);
  c.fill(-1, S0 + 2, -21, 1, S0 + 4, -21, K.basalto_columnar || K.stone);
  c.set(0, S0 + 2, -20, K.escalera_piedra);
  c.chest(0, S0 + 2, -19, 0, c.loot([[259, 6, 12], [260, 2, 4], [274, 2, 4], [278, 1, 2], [444, 1, 1], [451, 1, 1], [360, 30, 60]], 7));
  c.zone(0, S0 + 2, -18, 'rey_murcielago', 9);
}

// ---------- el Murciélago Rey ----------
export const REY = {
  name: 'El Murciélago Rey', w: 1.6, h: 1.2, health: 110, speed: 6, hostile: true, flying: true, boss: true, cave: true, attack: 5,
  hurtSound: 'murcielago', idleSound: 'murcielago', idleEvery: [2, 4], particle: [[0.15, 0.12, 0.1], [0.6, 0.1, 0.1]], drops: [[259, 4, 8], [260, 1, 3], [278, 1, 1]],
  build() { return armarReyMurcielago(); },
  flyGoal(m, g) {
    const pl = g.player.body.pos, b = m.body.pos, ck = g.clock || 0, d = m.data;
    d.fase = m.health < (m.kind.health || 110) * 0.5 ? 2 : 1; // v12.4.13: a la mitad de su vida (antes 55 fijo: con la vida nueva, al 26 %)
    d.t0 = d.t0 ?? ck;
    // en picada contra el jugador cada tanto; si no, da vueltas por encima
    d.picada = (d.picada ?? 3) - 1 / 60;
    // v12.16.0: la picada avisa con un carril rojo de 0.7 s hacia donde está uno (antes salía sin aviso)
    if (d.picada <= 0 && !d.pre && !(d.cansa > 0) && !(d.ataca > 0)) {
      d.pre = 0.7; m.targetYaw = m.yaw = Math.atan2(pl.x - b.x, pl.z - b.z);
      avisoEmbestida(m, g, 0.7, Math.min(14, Math.hypot(pl.x - b.x, pl.z - b.z) + 2), 1.4);
      g.audio.play('murcielago', { pos: m.soundPos(), vol: 1.0, pitch: 0.7 });
    }
    if (d.pre > 0) {
      d.pre -= 1 / 60;
      if (d.pre <= 0) { d.pre = 0; d.picada = d.fase === 2 ? 2.5 : 4; d.ataca = 1.2; g.audio.play('murcielago', { pos: m.soundPos(), vol: 1.2, pitch: 0.5 }); }
      else return { x: b.x, y: b.y, z: b.z };
    }
    // en la segunda fase se cansa: 3 s en el suelo después de la picada, golpeable
    if (d.ataca > 0 && d.ataca <= 1 / 60 + 1e-6 && d.fase === 2) { d.cansa = 3; d.picada = Math.max(d.picada, 1); }
    d.ataca = Math.max(0, (d.ataca || 0) - 1 / 60);
    if (d.cansa > 0) {
      d.cansa -= 1 / 60; d.picada = Math.max(d.picada, 1.2); // al levantarse tarda un poco en picar otra vez
      if (Math.random() < 0.2) g.particles.spawn(b.x, b.y + 0.8, b.z, [0.7, 0.7, 0.75], 0, 0.3, 0, 0.35, 0, true);
      return { x: b.x, y: (d.cy ?? pl.y) + 0.6, z: b.z };
    }
    // chillido: miedo y mareo; en la segunda fase llama a sus murciélagos
    d.chillido = (d.chillido ?? 6) - 1 / 60;
    if (d.chillido <= 0) {
      d.chillido = d.fase === 2 ? 7 : 11;
      g.audio.play('murcielago', { pos: m.soundPos(), vol: 1.4, pitch: 0.35 });
      if (Math.hypot(pl.x - b.x, pl.z - b.z) < 14) { g.addEffect('miedo', 3); g.addEffect('mareo', 2); g.shake = Math.max(g.shake || 0, 0.5); }
      if (d.fase === 2) for (let k = 0; k < 3; k++) g.entities.spawnMob('murcielago', b.x + (Math.random() - 0.5) * 2, b.y, b.z + (Math.random() - 0.5) * 2);
    }
    if (d.ataca > 0) {
      const dist = Math.hypot(pl.x - b.x, pl.y + 1 - b.y, pl.z - b.z);
      if (dist < 2 && ck > (d.mordida || 0) && g.mode === 'survival' && atacar(m, g, { dano: d.fase === 2 ? 6 : 5, causa: 'El Murciélago Rey lo despedazó', alcance: 1.6, tipo: 'mordida', prep: 0.42, cadena: 1, cd: 1 })) d.mordida = ck + 1; // con aviso y parry (golpes.js)
      return { x: pl.x, y: pl.y + 1, z: pl.z };
    }
    const a = (ck - d.t0) * 0.8;
    return { x: (d.cx ?? pl.x) + Math.cos(a) * 5, y: (d.cy ?? pl.y) + 4, z: (d.cz ?? pl.z) + Math.sin(a) * 5 };
  },
  animate(m, dt, u) { u.wings.forEach(({ p, side }) => { p.rotation.z = side * Math.sin(m.t * 9) * 0.7; }); },
};

// la zona del trono: al entrar despierta (una sola vez por caverna)
export function tickCaverna(g, zn) {
  const p = g.player.body.pos;
  if (Math.hypot(zn.x - p.x, zn.z - p.z) > zn.r || Math.abs(zn.y - p.y) > 6) return;
  const V = (g.meta.reyVencido = g.meta.reyVencido || {});
  if (V[zn.id] || g.entities.mobs.some((m) => m.type === 'rey_murcielago' && !m.dead)) return;
  if (g.mode !== 'survival') return;
  const m = g.entities.spawnMob('rey_murcielago', zn.x + 0.5, zn.y + 4, zn.z - 2.5);
  m.data.cx = zn.x + 0.5; m.data.cy = zn.y; m.data.cz = zn.z; m.data.angry = true; m.data.zona = zn.id;
  g.ui.toast('🦇 ¡EL MURCIÉLAGO REY DESPERTÓ!', 3000);
  g.audio.play('murcielago', { ui: true, vol: 1.2, pitch: 0.3 });
  g.shake = Math.max(g.shake || 0, 0.8);
}
