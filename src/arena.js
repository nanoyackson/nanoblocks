// La arena de retos: con el silbato del reto (se compra en la pulpería), clic derecho en terreno abierto arma una
// cancha de arena cercada con antorchas y empiezan 5 oleadas de Sombras (la última con la Sombra capitana).
// Cada oleada vencida da colones; la final, un diamante y la Copa del reto. Si sale de la cancha, pierde el reto.
import { BLOCK_BY_KEY as K, SOLID, AIR } from './blocks.js';
import { influencerEvento } from './influencer.js';

export const SILBATO = 471, COPA = 472;
const R = 7; // radio de la cancha (por dentro)
const OLAS = [
  ['sombra', 'sombra', 'sombra'],
  ['sombra', 'sombra', 'sombra', 'sombra_hondera', 'sombra'],
  ['sombra_escudo', 'sombra', 'sombra_hondera', 'sombra_escudo', 'sombra'],
  ['sombra_escudo', 'sombra_escudo', 'sombra_hondera', 'sombra_hondera', 'sombra', 'sombra', 'sombra'],
  ['sombra_capitana', 'sombra_escudo', 'sombra_hondera', 'sombra', 'sombra'],
];

// la Sombra capitana: más grande, más brava y con barra de jefe
export function capitana(SOMBRA) {
  return {
    ...SOMBRA, name: 'La Sombra capitana', health: 70, attack: 5, speed: 2.3, boss: true, xp: 60,
    drops: [[257, 2, 4], [271, 1, 3]],
    build() {
      const m = SOMBRA.build();
      m.userData.babyScale = 1.5;
      m.traverse((o) => { if (o.material && o.material.color && !o.userData.glow) { o.material = o.material.clone(); o.material.color.multiplyScalar(0.85); } });
      return m;
    },
  };
}

// la Sombra Madre: la jefa final de la historia (la manda historia.js)
export function sombraMadre(SOMBRA) {
  return {
    ...SOMBRA, name: 'La Sombra Madre', health: 220, attack: 7, speed: 2.5, boss: true, xp: 200,
    drops: [[257, 4, 8], [271, 2, 4], [260, 1, 2]],
    build() {
      const m = SOMBRA.build();
      m.userData.babyScale = 2.1;
      m.traverse((o) => { if (o.material && o.material.color && !o.userData.glow) { o.material = o.material.clone(); o.material.color.multiplyScalar(0.72); o.material.color.b += 0.2; } });
      return m;
    },
  };
}

// La Jefa de Ventanilla: la del Archivo Municipal (archivo.js)
export function jefaVentanilla(SOMBRA) {
  return {
    ...SOMBRA, name: 'La Jefa de Ventanilla', health: 240, attack: 6, speed: 2.2, boss: true, xp: 120,
    drops: [],
    build() {
      const m = SOMBRA.build();
      m.userData.babyScale = 1.7;
      m.traverse((o) => { if (o.material && o.material.color && !o.userData.glow) { o.material = o.material.clone(); o.material.color.multiplyScalar(0.78); o.material.color.b += 0.25; } });
      return m;
    },
  };
}

// El Olvido: lo que Anselmo tenía tapado en la Grieta (anselmo.js)
export function elOlvido(SOMBRA) {
  return {
    ...SOMBRA, name: 'El Olvido', health: 340, attack: 8, speed: 2.7, boss: true, xp: 300,
    drops: [],
    build() {
      const m = SOMBRA.build();
      m.userData.babyScale = 2.5;
      m.traverse((o) => { if (o.material && o.material.color && !o.userData.glow) { o.material = o.material.clone(); o.material.color.multiplyScalar(0.6); o.material.color.r += 0.3; } });
      return m;
    },
  };
}

export function usarSilbato(g) {
  if (g.arena) { g.ui.toast('Ya hay un reto en marcha', 1200); return false; }
  if (g.mode !== 'survival') { g.ui.toast('La arena de retos es para el modo supervivencia', 1600); return false; }
  if (g.dim !== 'tierra') { g.ui.toast('Aquí no se puede armar la cancha', 1400); return false; }
  const w = g.world, p = g.player.body.pos;
  const cx = Math.floor(p.x), cz = Math.floor(p.z), y = Math.floor(p.y);
  // que el piso sea más o menos parejo
  let malos = 0;
  for (let dx = -R - 1; dx <= R + 1; dx++) for (let dz = -R - 1; dz <= R + 1; dz++) {
    if (!w.isLoaded(cx + dx, cz + dz)) return falla(g, 'Falta cargar el terreno, espere un toque');
    let h = y + 3;
    while (h > y - 4 && !SOLID[w.getBlock(cx + dx, h - 1, cz + dz)]) h--;
    if (Math.abs(h - y) > 2) malos++;
  }
  if (malos > 90) return falla(g, 'Aquí está muy quebrado: busque un llano para la cancha');
  // la cancha se arma poco a poco, del centro hacia afuera (anillo por anillo)
  const obra = [];
  for (let dx = -R - 1; dx <= R + 1; dx++) for (let dz = -R - 1; dz <= R + 1; dz++) obra.push([dx, dz, Math.max(Math.abs(dx), Math.abs(dz))]);
  obra.sort((a, b) => b[2] - a[2]); // se saca del final: primero el centro
  g.arena = { cx: cx + 0.5, cz: cz + 0.5, x0: cx, y, ola: 0, fase: 'obra', t: 4, mobs: [], obra, z0: cz };
  g.audio.play('picar', { ui: true, vol: 0.6 });
  g.ui.toast('📣 ¡Arena de retos! Están armando la cancha… 5 oleadas de Sombras. No salga de la cancha', 3600);
  g.achieve('arena', 'Al ruedo');
  return true;
}
function falla(g, txt) { g.ui.toast(txt, 1800); return false; }

export function tickArena(g, dt) {
  const A = g.arena;
  if (!A) return;
  const p = g.player.body.pos;
  if (!g.player.alive) { terminar(g, '💀 Lo vencieron en la arena. ¡A la próxima!'); return; }
  if (Math.max(Math.abs(p.x - A.cx), Math.abs(p.z - A.cz)) > R + 3) { terminar(g, '🏃 Se salió de la cancha: perdió el reto'); return; }
  // las Sombras de la arena no se van ni se queman con el sol
  A.mobs = A.mobs.filter((m) => !m.dead && !m.dying && g.entities.mobs.includes(m));
  if (A.fase === 'obra') {
    const w = g.world;
    for (let n = 0; n < 4 && A.obra.length; n++) {
      const [dx, dz, anillo] = A.obra.pop();
      const x = A.x0 + dx, z = A.z0 + dz, y = A.y, borde = anillo === R + 1;
      for (let yy = y - 3; yy < y - 1; yy++) if (!SOLID[w.getBlock(x, yy, z)]) w.setBlock(x, yy, z, K.dirt);
      w.setBlock(x, y - 1, z, borde ? K.planks : K.sand);
      for (let yy = y; yy < y + 5; yy++) {
        const id = w.getBlock(x, yy, z);
        if (id === K.chest || id === K.bedrock) continue;
        w.setBlock(x, yy, z, AIR);
      }
      if (borde) {
        w.setBlock(x, y, z, K.cerca);
        if (Math.abs(dx) === Math.abs(dz) || dx === 0 || dz === 0) { w.setBlock(x, y + 1, z, K.planks); w.setBlock(x, y + 2, z, K.torch); }
      }
      if (Math.random() < 0.35) g.particles.burst(x + 0.5, y + 0.2, z + 0.5, [[0.9, 0.82, 0.55], [0.7, 0.6, 0.4]], 4, 1.5);
    }
    if (Math.random() < 0.15) g.audio.play('picar', { ui: true, vol: 0.35, pitch: 0.9 + Math.random() * 0.3 });
    if (!A.obra.length) { A.fase = 'cuenta'; A.t = 4; g.audio.play('silbato', { ui: true, vol: 0.9 }); g.ui.toast('📣 ¡Lista la cancha! ¡Que empiece la primera oleada!', 2200); }
    return;
  }
  if (A.fase === 'cuenta') {
    const antes = Math.ceil(A.t);
    A.t -= dt;
    if (Math.ceil(A.t) !== antes && A.t > 0) { g.ui.toast(`Oleada ${A.ola + 1} en ${Math.ceil(A.t)}…`, 800); g.audio.play('click', { ui: true, vol: 0.6, pitch: 1.2 }); }
    if (A.t <= 0) soltar(g, A);
    return;
  }
  if (A.fase === 'pelea' && A.mobs.length === 0) {
    A.ola++;
    const premio = A.ola * 4;
    g.giveItem(360, premio);
    g.audio.play('aplausos', { vol: 0.6 });
    g.addXP(4 * A.ola);
    influencerEvento(g, `oleada ${A.ola} en la arena`, 12000);
    if (A.ola >= OLAS.length) {
      g.giveItem(260, 1); g.giveItem(COPA, 1);
      g.ui.toast(`🏆 ¡Venció las ${OLAS.length} oleadas! Premio: ${premio} colones, un diamante y la Copa del reto`, 4200);
      g.achieve('arena_campeon', 'Gané la arena');
      g.meta.arenasGanadas = (g.meta.arenasGanadas || 0) + 1;
      if (g.meta.arenasGanadas >= 3) g.achieve('arena3', 'Leyenda de la arena');
      g.arena = null;
      return;
    }
    g.ui.toast(`✅ ¡Oleada ${A.ola} vencida! +${premio} colones. Descanse un toque…`, 2600);
    A.fase = 'cuenta'; A.t = 8;
  }
}

function soltar(g, A) {
  const tipos = OLAS[A.ola];
  tipos.forEach((t, i) => {
    const a = (i / tipos.length) * Math.PI * 2 + Math.random() * 0.4;
    const x = A.cx + Math.cos(a) * (R - 1), z = A.cz + Math.sin(a) * (R - 1);
    const m = g.entities.spawnMob(t, x, A.y + 0.2, z);
    m.data.arena = true; m.data.provoked = true;
    g.particles.burst(x, A.y + 1, z, [[0.1, 0.05, 0.15], [0.4, 0.2, 0.5]], 16, 2);
    A.mobs.push(m);
  });
  if (A.ola === OLAS.length - 1) g.ui.toast('👑 ¡Última oleada: la Sombra capitana!', 2400);
  else g.ui.toast(`⚔ ¡Oleada ${A.ola + 1}!`, 1400);
  g.audio.play('silbato', { ui: true, vol: 0.7 });
  A.fase = 'pelea';
}

function terminar(g, txt) {
  const A = g.arena;
  for (const m of A.mobs) { m.dead = true; g.particles.burst(m.body.pos.x, m.body.pos.y + 1, m.body.pos.z, [[0.1, 0.05, 0.15]], 12, 2); }
  g.arena = null;
  g.ui.toast(txt, 2600);
}
export function limpiarArena(g) { if (g.arena) { for (const m of g.arena.mobs) m.dead = true; g.arena = null; } }
