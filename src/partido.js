// Partido en el Estadio Nacional: al entrar de día arranca un 5 contra 5 (chalecos rojos y azules) que corren
// detrás de la bola y la patean hacia el marco contrario. Marcador, goles con aplausos y la ola en las graderías.
// Uno puede meterse a patear (la bola se patea con clic, como en la mejenga). A 3 goles o 3 minutos.
import { BLOCK_BY_KEY as K } from './blocks.js';
import { flat } from './fauna.js';

const FW = 20, FH = 13;

function orientacion(g, zn) {
  // los marcos (repello blanco) están en los extremos del eje largo: ¿x o z?
  const w = g.world, y = zn.y;
  for (const s of [-1, 1]) if (w.getBlock(Math.floor(zn.x + s * FW), y, Math.floor(zn.z + 3)) === K.plaster) return 'x';
  return 'z';
}

function chaleco(m, color) {
  const u = m.group.userData;
  if (!u.body || u.chaleco) return;
  const c = flat(color, 0.62, 0.6, 0.34, 0, 1.2, 0);
  c.add(flat(0xffffff, 0.2, 0.2, 0.02, 0, 0.05, -0.18));
  u.body.add(c); u.chaleco = c;
}

export function tickPartido(g, zn, d) {
  const st = (g.partidos = g.partidos || {});
  let P = st[zn.id];
  const p = g.player.body.pos;
  const dentro = d < 30 && Math.abs(p.y - zn.y) < 20;
  if (!P) {
    if (!dentro || g.daylight < 0.45 || (g.clock || 0) < (st.cd || 0)) return;
    // arranca el partido
    const eje = orientacion(g, zn);
    const ball = g.entities.spawnMob('bola', zn.x + 0.5, zn.y + 1.5, zn.z + 0.5);
    ball.tamed = true; ball.data.estadio = true;
    const jug = [];
    for (let k = 0; k < 10; k++) {
      const eq = k < 5 ? 0 : 1, s = eq ? 1 : -1;
      const ox = s * (4 + (k % 5) * 3), oz = ((k % 5) - 2) * 4;
      const x = zn.x + (eje === 'x' ? ox : oz), z = zn.z + (eje === 'x' ? oz : ox);
      const m = g.entities.spawnMob('vecino', x + 0.5, zn.y + 1, z + 0.5);
      m.data = { vid: `jugador:${g.clock}:${k}`, name: eq ? 'Jugador azul' : 'Jugador rojo', role: 'futbolista', seed: 1000 + k * 77, home: { x, y: zn.y, z }, plaza: { x, y: zn.y, z }, equipo: eq, jugador: true };
      m.kind.dress(m);
      jug.push(m);
    }
    P = st[zn.id] = { eje, ball, jug, rojo: 0, azul: 0, t0: g.clock || 0, ola: 10 };
    g.ui.toast('⚽ ¡Hay partido en el Estadio Nacional! Rojos contra azules. Métase a patear si quiere', 3600);
    g.achieve('partido', 'Fui al estadio');
    return;
  }
  const B = P.ball;
  const fin = !dentro && d > 60;
  if (fin || B.dead || (g.clock || 0) - P.t0 > 180 || P.rojo >= 3 || P.azul >= 3) {
    if (!fin && !B.dead) g.ui.toast(`🏁 ¡Terminó el partido! Rojos ${P.rojo} – ${P.azul} Azules`, 3200);
    for (const m of P.jug) { m.data.irse = 4; m.data.jugador = false; }
    B.dead = true;
    st[zn.id] = null; st.cd = (g.clock || 0) + 120;
    return;
  }
  for (const m of P.jug) chaleco(m, m.data.equipo ? 0x2a5ad8 : 0xd82a2a);
  const b = B.body.pos;
  const largo = P.eje === 'x' ? b.x - zn.x : b.z - zn.z, ancho = P.eje === 'x' ? b.z - zn.z : b.x - zn.x;
  // gol: la bola pasó la línea del marco entre los palos
  if (Math.abs(largo) > FW - 0.5 && Math.abs(ancho) < 3 && b.y < zn.y + 3.5) {
    const azul = largo < 0; // el azul ataca hacia el lado negativo
    if (azul) P.azul++; else P.rojo++;
    g.audio.play('gol', { pos: b, vol: 1.2 }); g.audio.play('aplausos', { ui: true, vol: 0.6 });
    g.particles.burst(b.x, b.y + 0.5, b.z, [[0.1, 0.25, 0.85], [1, 1, 1], [0.85, 0.1, 0.12]], 50, 4);
    g.ui.regionBanner(azul ? '¡GOL DE LOS AZULES!' : '¡GOL DE LOS ROJOS!', `Rojos ${P.rojo} – ${P.azul} Azules`);
    b.x = zn.x + 0.5; b.z = zn.z + 0.5; b.y = zn.y + 1.5; B.body.vel.x = B.body.vel.y = B.body.vel.z = 0;
    return;
  }
  if (Math.abs(largo) > FW + 4 || Math.abs(ancho) > FH + 4) { b.x = zn.x + 0.5; b.z = zn.z + 0.5; b.y = zn.y + 1.5; B.body.vel.x = B.body.vel.z = 0; }
  // los jugadores: el más cerca de cada equipo va a la bola; los demás se acomodan
  for (const eq of [0, 1]) {
    const mios = P.jug.filter((m) => !m.dead && m.data.equipo === eq);
    mios.sort((a, c) => Math.hypot(a.body.pos.x - b.x, a.body.pos.z - b.z) - Math.hypot(c.body.pos.x - b.x, c.body.pos.z - b.z));
    mios.forEach((m, i) => {
      m.frozen = false;
      if (i === 0) {
        m.data.ruta = null;
        const dd = Math.hypot(m.body.pos.x - b.x, m.body.pos.z - b.z);
        m.goTo(b.x, b.z, 1.6);
        if (dd < 1.2 && (g.clock || 0) > (m.data.patea || 0)) {
          m.data.patea = (g.clock || 0) + 1;
          const meta = eq ? -FW - 1 : FW + 1;
          const tx = P.eje === 'x' ? zn.x + meta : zn.x + (Math.random() - 0.5) * 4, tz = P.eje === 'x' ? zn.z + (Math.random() - 0.5) * 4 : zn.z + meta;
          const dx = tx - b.x, dz = tz - b.z, l = Math.hypot(dx, dz) || 1, f = 7 + Math.random() * 5;
          B.body.vel.x = (dx / l) * f; B.body.vel.z = (dz / l) * f; B.body.vel.y = 2 + Math.random() * 2.5;
          g.audio.play('balon', { pos: b, vol: 0.7 });
        }
      } else {
        // posición: entre la bola y su marco
        const s = eq ? 1 : -1, fx = (i - 2.5) * 4;
        const px = P.eje === 'x' ? (b.x + zn.x) / 2 + s * 5 : zn.x + fx, pz = P.eje === 'x' ? zn.z + fx : (b.z + zn.z) / 2 + s * 5;
        m.goTo(px, pz, 1.1);
      }
    });
  }
  // la ola en las graderías
  P.ola -= 1;
  if (P.ola <= 0 && dentro) {
    P.ola = 25 + Math.random() * 20;
    const C = [[1, 1, 1], [0.1, 0.25, 0.85], [0.85, 0.1, 0.12]];
    for (let k = 0; k < 60; k++) {
      const a = (k / 60) * Math.PI * 2;
      setTimeout(() => { for (let j = 0; j < 4; j++) g.particles.spawn(zn.x + Math.cos(a) * (FW + 8 + j), zn.y + 4 + j * 1.2, zn.z + Math.sin(a) * (FH + 8 + j), C[(k + j) % 3], 0, 3, 0, 0.6, 6, true); }, k * 40);
    }
    g.audio.play('aplausos', { ui: true, vol: 0.4 });
    g.ui.toast('🌊 ¡La ola en las graderías!', 1600);
    g.achieve('la_ola', 'Hice la ola');
  }
}
