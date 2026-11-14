// Jefes del monte (v4.99): cada bioma tiene su jefe, y se le llama con la Ofrenda del monte (una jícara con candela, flores, cacao y
// guaro), de noche y en su bioma. Cada uno pelea distinto y suelta su trofeo, que sirve para hacer algo nuevo (un arma, una
// armadura, un remedio). Vencerlo queda anotado en meta.jefes2 (lo usa la hoja de etapas).
// · La Reina Bananera (selva): teje en abanico, tira crías, se levanta y cae encima de uno; a media vida suelta veneno alrededor.
//   Se le gana con lo contundente y moviéndose de lado.
// · Don Cornudo, el escarabajo Hércules (bosque): embiste corrigiendo el rumbo; contra un árbol o una pared se queda trabado (ahí
//   recibe todo). De frente, el caparazón aguanta casi todo. A media vida pega pisotones que hay que saltar.
import { avisoEmbestida, avisoCaida, apagarAviso, COLOR_AVISO } from './golpes.js';
import { SOLID } from './blocks.js';
import { manaJefe } from './manasjefe.js';
import { Tela } from './bichos3.js';
import { perfil } from './armas3.js';
import { armarReina, armarCornudo } from './modelos-jefes.js';
import { JEFES3, JEFE_DE3, AVISO3, vencido, presentarJefe, anilloAviso } from './jefes3.js';
import { regionAt } from './regiones.js';

export const OFRENDA = 542;
const jugando = (g) => g.mode === 'survival' && g.player.alive;
const frente = (m, x, z) => { let d = Math.atan2(x - m.body.pos.x, z - m.body.pos.z) - (m.yaw || 0); d = Math.atan2(Math.sin(d), Math.cos(d)); return Math.abs(d); };

// ---------- la Reina Bananera ----------
// ---------- Don Cornudo, el escarabajo Hércules ----------

export const JEFES2 = {
  reina_bananera: {
    name: 'La Reina Bananera', w: 1.9, h: 1.3, health: 260, speed: 2.4, hostile: true, boss: true, attack: 6, hurtSound: 'gato.bufido', idleSound: 'monstruo', idleEvery: [5, 9],
    particle: [[0.3, 0.18, 0.1], [0.65, 0.12, 0.08]], drops: [[536, 3, 3], [271, 2, 4]], xp: 200, grupo: 'caparazon',
    build: armarReina,
    brain(m, dt, c) {
      const { g, distP, dxp, dzp, pl } = c, D = m.data, b = m.body;
      D.apuro = true;
      if (!jugando(g)) return false;
      const fase2 = m.health < (D.vmax || m.kind.health) * 0.5;
      if (fase2 && !D.fase2) { D.fase2 = true; g.ui.toast('🕷 ¡La Reina se enfurece! El aire alrededor se llena de veneno', 3200); g.audio.play('monstruo', { pos: m.soundPos(), vol: 1, pitch: 0.7 }); }
      m.targetYaw = Math.atan2(dxp, dzp);
      // el salto: se levanta (el aviso) y cae encima
      const S = D.salto;
      if (S) {
        S.t -= dt;
        // cae en el punto que marcó el anillo al levantarse, no donde ande uno: quien se sale del anillo se salva
        if (S.fase === 'alza' && S.aviso && S.aviso.t >= S.aviso.dur) Object.assign(S, { t: 0.7, tx: pl.x, tz: pl.z, aviso: avisoCaida(g, pl.x, pl.y, pl.z, 2.6, 0.7 + 2.2, m) }); // si lo aturdieron a media preparación el anillo ya se fue: se vuelve a marcar desde cero (si no, brincaba sin aviso)
        if (S.fase === 'alza') { m.moving = false; const tx = S.tx - b.pos.x, tz = S.tz - b.pos.z, l = Math.hypot(tx, tz) || 1; m.targetYaw = Math.atan2(tx, tz); if (S.t <= 0) { const v = Math.min(14, l / 0.7); b.vel.x = (tx / l) * v; b.vel.z = (tz / l) * v; b.vel.y = 9; b.onGround = false; S.fase = 'vuela'; S.t = 1; } }
        else if (S.t <= 0.8 && (b.onGround || b.inWater || S.t < -1)) {
          apagarAviso(S.aviso); D.salto = null; D.saltoCd = fase2 ? 5 : 8;
          g.shake = Math.max(g.shake || 0, 0.5);
          g.particles.burst(b.pos.x, b.pos.y + 0.2, b.pos.z, [[0.5, 0.4, 0.3]], 26, 4);
          if (Math.hypot(pl.x - b.pos.x, pl.z - b.pos.z) < 2.6 && Math.abs(pl.y - b.pos.y) < 2) g.damagePlayer(9, b.pos.x, b.pos.z, 'La Reina Bananera le cayó encima', false, true);
        }
        return true;
      }
      D.saltoCd = (D.saltoCd ?? 6) - dt; D.telaCd = (D.telaCd ?? 2) - dt; D.criasCd = (D.criasCd ?? 8) - dt; D.venenoCd = (D.venenoCd ?? 4) - dt;
      if (D.saltoCd <= 0 && distP > 3 && distP < 13 && b.onGround) { D.salto = { fase: 'alza', t: 0.7, tx: pl.x, tz: pl.z, aviso: avisoCaida(g, pl.x, pl.y, pl.z, 2.6, 0.7 + 2.2, m) }; g.audio.play('gato.bufido', { pos: m.soundPos(), vol: 1, pitch: 0.5 }); return true; }
      // telaraña en abanico (tres o cinco)
      if (D.telaCd <= 0 && distP > 3 && distP < 16) {
        D.telaCd = fase2 ? 2.4 : 3.4;
        const n = fase2 ? 5 : 3, base = Math.atan2(dxp, dzp), sy = b.pos.y + 1, t = distP / 12, vy = (pl.y + 1 - sy) / t + 0.5 * 9 * t;
        for (let k = 0; k < n; k++) { const a = base + (k - (n - 1) / 2) * 0.16; (g.proy3 ||= []).push(new Tela(g, b.pos.x, sy, b.pos.z, { x: Math.sin(a) * 12, y: vy, z: Math.cos(a) * 12 })); }
        g.audio.play('swish', { pos: m.soundPos(), vol: 0.8, pitch: 1.4 });
      }
      // las crías: de a dos, hasta cuatro vivas
      if (D.criasCd <= 0) {
        D.criasCd = fase2 ? 9 : 13;
        const vivas = g.entities.mobs.filter((o) => !o.dead && o.data.cria === m).length;
        for (let k = 0; k < Math.min(2, 3 - vivas); k++) { const o = g.entities.spawnMob('arana_bananera', b.pos.x + (k ? 1 : -1), b.pos.y + 0.3, b.pos.z - 1); if (o) { o.data.cria = m; o.health = 6; o.data.apuro = true; if (o.group) o.group.userData.babyScale = 0.6; } }
        g.particles.burst(b.pos.x, b.pos.y + 0.8, b.pos.z, [[0.95, 0.93, 0.85]], 18, 2);
      }
      // segunda fase: veneno alrededor (hay que salirse del círculo verde)
      if (fase2 && D.venenoCd <= 0) {
        D.venenoCd = 7; D.nube = 2.5;
        g.audio.play('resoplido', { pos: m.soundPos(), vol: 1, pitch: 0.5 });
      }
      if (D.nube > 0) {
        D.nube -= dt;
        anilloAviso(g, b.pos.x, b.pos.y, b.pos.z, 4.5, dt, m, COLOR_AVISO.verde); // v12.8.7 (fase 2B): el borde real de la nube (antes solo la niebla verde)
        for (let k = 0; k < 6; k++) { const a = Math.random() * Math.PI * 2, r = Math.random() * 4.5; g.particles.spawn(b.pos.x + Math.cos(a) * r, b.pos.y + 0.3, b.pos.z + Math.sin(a) * r, [0.55, 0.85, 0.25], 0, 0.6, 0, 1.2, -0.2, true); }
        if (distP < 4.5 && D.nube < 2) { g.addEffect('veneno', 2); D.toque = (D.toque || 0) + dt; if (D.toque > 1) { D.toque = 0; g.damagePlayer(1, null, null, 'El veneno de la Reina Bananera', true); } }
      }
      // da vueltas alrededor a media distancia (de cerca muerde como cualquiera)
      if (distP > 2.6) { const l = distP || 1, giro = 0.9; m.goTo(pl.x - (dxp / l) * 5 + (-dzp / l) * giro * 3, pl.z - (dzp / l) * 5 + (dxp / l) * giro * 3, 1.1); return true; }
      return false;
    },
    onHurt(m, g, dmg) { if (m.health - dmg <= 0) { vencido(g, m, 'reina_bananera', 'la Reina Bananera'); g.achieve('jefe_reina', 'Le gané a la Reina Bananera'); } return true; },
    animate(m, dt, u) {
      const S = m.data.salto, v = m.walk * 2.4;
      for (const P of u.patas) P.piv.rotation.z = Math.sin(v + P.i * 1.4 + (P.s > 0 ? 0 : Math.PI)) * 0.22 * (0.1 + m.walkAmt * 0.9) + (S && S.fase === 'alza' ? 0.4 : 0);
      u.body.rotation.x = S && S.fase === 'alza' ? -0.7 : 0;
      for (const q of u.queli) q.rotation.x = Math.sin(m.t * 6) * 0.15 - (S ? 0.4 : 0);
    },
  },
  escarabajo_hercules: {
    name: 'Don Cornudo, el escarabajo Hércules', w: 2.2, h: 1.6, health: 280, speed: 1.6, hostile: true, boss: true, attack: 7, hurtSound: 'dig.wood', idleSound: 'resoplido', idleEvery: [6, 10],
    particle: [[0.5, 0.5, 0.2], [0.15, 0.1, 0.08]], drops: [[537, 1, 1], [271, 3, 5]], xp: 220, grupo: 'caparazon',
    build: armarCornudo,
    brain(m, dt, c) {
      const { g, distP, dxp, dzp, pl } = c, D = m.data, b = m.body;
      D.apuro = true;
      if ((m.stunT || 0) <= 0) D.trabado = false; // v12.8.7: se destrabó
      if ((m.stunT || 0) > 0 || !jugando(g)) return false;
      const fase2 = m.health < (D.vmax || m.kind.health) * 0.5;
      if (fase2 && !D.fase2) { D.fase2 = true; g.ui.toast('🪲 ¡Don Cornudo pisotea el suelo! Brinque cuando levante las patas', 3200); }
      const E = D.emb;
      if (E && E.fase === 'escarba') {
        E.t -= dt; m.moving = false; m.targetYaw = Math.atan2(dxp, dzp); E.yaw = m.targetYaw;
        if (Math.random() < dt * 30) g.particles.spawn(b.pos.x - Math.sin(m.yaw) * 1.2, b.pos.y + 0.1, b.pos.z - Math.cos(m.yaw) * 1.2, [0.45, 0.36, 0.26], (Math.random() - 0.5) * 3, 2, (Math.random() - 0.5) * 3, 0.8, 6);
        if (E.t <= 0) { E.fase = 'corre'; E.t = 2.4; E.pego = false; g.audio.play('resoplido', { pos: m.soundPos(), vol: 1, pitch: 0.5 }); }
        return true;
      }
      if (E && E.fase === 'corre') {
        E.t -= dt;
        // corrige el rumbo un poquito hacia uno (hay que esquivarlo a última hora)
        let dy = Math.atan2(dxp, dzp) - E.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy));
        E.yaw += Math.max(-1, Math.min(1, dy)) * dt * 0.9;
        m.targetYaw = E.yaw; m.yaw = E.yaw; m.moving = true; m.speedMul = 10.5 / m.kind.speed;
        if (!E.pego && Math.hypot(pl.x - b.pos.x, pl.z - b.pos.z) < 2 && Math.abs(pl.y - b.pos.y) < 2) {
          E.pego = true;
          g.damagePlayer(m.kind.attack, b.pos.x, b.pos.z, 'Embestida de Don Cornudo', false, true);
          const firme = manaJefe(g, 'cuerno_firme') ? 0.5 : 1; // v12.16.5: la maña «Cuerno firme»
          g.player.body.vel.x += Math.sin(E.yaw) * 14 * firme; g.player.body.vel.z += Math.cos(E.yaw) * 14 * firme; g.player.body.vel.y = 7 * (firme === 1 ? 1 : 0.8);
          g.shake = Math.max(g.shake || 0, 0.7);
        }
        if (b.hitWall) {
          const fx = Math.floor(b.pos.x + Math.sin(E.yaw) * 1.5), fz = Math.floor(b.pos.z + Math.cos(E.yaw) * 1.5), fy = Math.floor(b.pos.y);
          if (SOLID[g.world.getBlock(fx, fy + 1, fz)] || SOLID[g.world.getBlock(fx, fy + 2, fz)]) {
            // se trabó el cuerno: la oportunidad
            m.stunT = 4; D.emb = null; m.moving = false; D.trabado = true;
            g.audio.play('dig.wood', { pos: m.soundPos(), vol: 1, pitch: 0.4 }); g.shake = Math.max(g.shake || 0, 0.4);
            g.particles.burst(b.pos.x + Math.sin(E.yaw) * 1.4, b.pos.y + 1, b.pos.z + Math.cos(E.yaw) * 1.4, [[0.5, 0.4, 0.3], [1, 0.95, 0.5]], 24, 3);
            g.ui.toast('🪲 ¡Se le trabó el cuerno! ¡Ahora, con todo!', 1800);
            return true;
          } else if (b.onGround) { b.vel.y = 7; b.onGround = false; }
        }
        if (E.t <= 0) { D.emb = { fase: 'resuella', t: 1.2 }; m.moving = false; }
        return true;
      }
      if (E && E.fase === 'resuella') { E.t -= dt; m.moving = false; if (E.t <= 0) D.emb = null; return true; }
      // de cerca no puede tomar impulso: se echa para atrás y después embiste
      if (E && E.fase === 'atras') { E.t -= dt; const l = distP || 1; m.goTo(b.pos.x - (dxp / l) * 4, b.pos.z - (dzp / l) * 4, 1.3); if (E.t <= 0 || b.hitWall) { D.emb = { fase: 'escarba', t: 0.8, yaw: Math.atan2(dxp, dzp) }; avisoEmbestida(m, g, 0.8, 18, 2.2); } return true; } // el carril, una sola vez al empezar a escarbar (antes salía uno por cuadro)
      // el pisotón (segunda fase): levanta las patas de adelante (aviso) y golpea el suelo: hay que estar en el aire
      const P = D.piso;
      if (P) {
        P.t -= dt; m.moving = false;
        anilloAviso(g, b.pos.x, b.pos.y, b.pos.z, 7, dt, m);
        if (P.t <= 0) {
          D.piso = null; D.pisoCd = 6;
          g.shake = Math.max(g.shake || 0, 0.8);
          g.audio.play('dig.stone', { pos: m.soundPos(), vol: 1, pitch: 0.3 });
          for (let k = 0; k < 40; k++) { const a = (k / 40) * Math.PI * 2; g.particles.spawn(b.pos.x + Math.cos(a) * 3, b.pos.y + 0.2, b.pos.z + Math.sin(a) * 3, [0.5, 0.42, 0.3], Math.cos(a) * 5, 1, Math.sin(a) * 5, 0.7, 3); }
          if (distP < 7 && g.player.body.onGround && Math.abs(pl.y - b.pos.y) < 1.5) { g.damagePlayer(5, b.pos.x, b.pos.z, 'El pisotón de Don Cornudo', false, true); g.player.body.vel.y = 6; }
        }
        return true;
      }
      D.cd = (D.cd ?? 2.5) - dt; D.pisoCd = (D.pisoCd ?? 4) - dt;
      m.targetYaw = Math.atan2(dxp, dzp);
      if (fase2 && D.pisoCd <= 0 && distP < 7) { D.piso = { t: 0.9 }; g.audio.play('resoplido', { pos: m.soundPos(), vol: 1, pitch: 0.4 }); return true; }
      if (distP <= 3 && D.cd <= 0) { D.cd = fase2 ? 2.5 : 4; D.emb = { fase: 'atras', t: 1.1 }; return true; }
      if (distP > 3 && distP < 22 && D.cd <= 0) { D.cd = fase2 ? 2.5 : 4; D.emb = { fase: 'escarba', t: fase2 ? 0.7 : 1, yaw: Math.atan2(dxp, dzp) }; avisoEmbestida(m, g, fase2 ? 0.7 : 1, 18, 2.2); return true; }
      return false;
    },
    onHurt(m, g, dmg) {
      const p = g.player.body.pos;
      const P = perfil(g.heldDef());
      if ((m.stunT || 0) <= 0 && frente(m, p.x, p.z) < 1.1 && g.golpeando === m && !(P.tipo === 'contundente' && g.golpeCargado)) {
        const queda = dmg * 0.2;
        if (m.health - queda <= 0) { { vencido(g, m, 'escarabajo_hercules', 'Don Cornudo'); g.achieve('jefe_cornudo', 'Le gané a Don Cornudo'); } return true; }
        m.health -= queda;
        g.audio.play('armadura.metal', { pos: m.soundPos(), vol: 0.8, pitch: 0.6 });
        g.particles.burst(m.body.pos.x, m.body.pos.y + 1, m.body.pos.z, [[1, 0.95, 0.6]], 8, 2);
        if (!m.data.avisoFrente) { m.data.avisoFrente = true; g.ui.toast('🪲 De frente no le entra. Que se estrelle contra un árbol, o péguele por el lado', 3000); }
        return false;
      }
      // v12.8.7 (fase 2B): el filo le entra a 0.75 y no a 0.6 (el perfil caparazon es de todos: el arreglo es solo para él), y trabado
      // contra el árbol o la pared, el doble
      const k = (g.golpeando === m && P.tipo === 'corte' ? 0.75 / 0.6 : 1) * (m.data.trabado && (m.stunT || 0) > 0 ? 2 : 1);
      if (m.health - dmg * k <= 0) { vencido(g, m, 'escarabajo_hercules', 'Don Cornudo'); g.achieve('jefe_cornudo', 'Le gané a Don Cornudo'); }
      return k;
    },
    animate(m, dt, u) {
      const E = m.data.emb, P = m.data.piso, v = m.walk * 2;
      for (const Q of u.patas) Q.piv.rotation.z = Math.sin(v + Q.i * 2 + (Q.s > 0 ? 0 : Math.PI)) * 0.3 * m.walkAmt + (P && Q.i === 0 ? 0.8 : 0);
      u.body.rotation.x = P ? -0.35 * Math.min(1, (0.9 - P.t) * 3) : E && E.fase === 'escarba' ? 0.1 + Math.sin(m.t * 30) * 0.05 : 0;
      u.arriba.rotation.x = E && E.fase === 'escarba' ? -0.25 : 0;
      u.body.rotation.z = m.stunT > 0 ? Math.sin(m.t * 9) * 0.1 : 0;
    },
  },
};

// un hueco de 3 de alto y 3 de ancho con suelo, delante de uno (más lejos primero), subiendo o bajando desde la altura de uno
function lugarJefe(g) {
  const p = g.player.body.pos, d = g.player.lookDir(), w = g.world, h = Math.hypot(d.x, d.z) || 1;
  const libre = (x, y, z) => !SOLID[w.getBlock(x, y, z)] && !SOLID[w.getBlock(x, y + 1, z)] && !SOLID[w.getBlock(x, y + 2, z)];
  for (const dist of [12, 9, 6, 4]) for (const giro of [0, 0.6, -0.6, 1.2, -1.2]) {
    const a = Math.atan2(d.x / h, d.z / h) + giro, x = Math.floor(p.x + Math.sin(a) * dist), z = Math.floor(p.z + Math.cos(a) * dist);
    for (let k = 0; k <= 10; k++) for (const s of k ? [1, -1] : [1]) {
      const y = Math.floor(p.y) + k * s;
      if (SOLID[w.getBlock(x, y - 1, z)] && libre(x, y, z) && libre(x + 1, y, z) && libre(x - 1, y, z) && libre(x, y, z + 1) && libre(x, y, z - 1)) return { x: x + 0.5, y, z: z + 0.5 };
    }
  }
  return null;
}
// ---------- la ofrenda: de noche, en el bioma del jefe ----------
const JEFE_DE = { jungle: 'reina_bananera', forest: 'escarabajo_hercules', ...JEFE_DE3 };
const esJefe = (m) => !!(JEFES2[m.type] || JEFES3[m.type]);
export function usarOfrenda(g, id) {
  if (id !== OFRENDA || g.mode !== 'survival') return false;
  if (g.dim !== 'tierra') { g.ui.toast('La ofrenda es para el monte de aquí abajo', 2000); return true; }
  if (g.daylight > 0.35) { g.ui.toast('🕯 La ofrenda se pone de noche: de día el monte no contesta', 2400); return true; }
  if (g.entities.mobs.some((m) => !m.dead && esJefe(m))) { g.ui.toast('Ya hay un jefe despierto', 1800); return true; }
  const p = g.player.body.pos, bio = g.world.gen.column(Math.floor(p.x), Math.floor(p.z)).biome;
  let t = JEFE_DE[bio];
  if (!t && bio === 'plains' && regionAt(g.world.gen, p.x, p.z) === 'guanacaste') t = 'cascabel_rey';
  if (!t && p.y < 45) t = 'ciempies_rey'; // en las cuevas hondas
  if (!t) { g.ui.toast('🕯 Aquí no vive ningún jefe: cada uno tiene su bioma (selva, manglar, playa, montaña…)', 3600); return true; }
  // v12.8.7 (PLAN_CIERRE_FINAL, lo suelto de la fase 2): el mismo jefe no se vuelve a llamar hasta 3 días después
  const OD = (g.meta.ofrendaDia ||= {}), hoy = g.day || 1;
  if (OD[t] && hoy - OD[t] < 3) { const f = 3 - (hoy - OD[t]); g.ui.toast(`🕯 El monte todavía descansa de esa pelea: vuelva a ponerla ${f === 1 ? 'mañana' : `en ${f} días`}`, 3000); return true; }
  const L = lugarJefe(g);
  if (!L) { g.ui.toast('🕯 La candela tiembla, pero aquí no hay campo para que salga: busque un lugar más abierto', 2800); return true; }
  const m = g.entities.spawnMob(t, L.x, L.y + 0.2, L.z);
  if (!m) { g.ui.toast('El monte no contestó', 1500); return true; }
  m.data.provoked = true; m.data.apuro = true;
  g.inventory.consumeHeld(1);
  OD[t] = hoy;
  // la revancha: si ya se le venció, vuelve más bravo (más vida, pega más) y suelta el doble
  const J = g.meta.jefes2 || {};
  if (J[t]) { m.data.revancha = true; m.health *= 1.5; m.data.vmax = m.health; m.kind = { ...m.kind, attack: Math.round(m.kind.attack * 1.3) }; g.achieve('revancha', 'La revancha'); } // el kind es copia: solo este pega más
  presentarJefe(g, m);
  g.shake = Math.max(g.shake || 0, 0.6);
  g.audio.play('monstruo', { ui: true, vol: 1, pitch: 0.5 });
  g.particles.burst(p.x, p.y + 1, p.z, [[1, 0.8, 0.3], [0.9, 0.5, 0.2]], 30, 2.5);
  g.ui.toast(AVISO3[t] || (t === 'reina_bananera' ? '🕷 Las hojas se mueven solas… ¡baja la Reina Bananera!' : '🪲 El suelo retumba… ¡viene Don Cornudo, el escarabajo Hércules!'), 4200);
  g.achieve('ofrenda', 'El monte contestó');
  return true;
}
// /prueba jefes2 [reina|cornudo]
export function pruebaJefes2(g, cual) {
  const t = { cornudo: 'escarabajo_hercules', tata: 'sapo_tata', cascabel: 'cascabel_rey', cangrejo: 'cangrejo_rey', ciempies: 'ciempies_rey' }[cual] || 'reina_bananera';
  const p = g.player.body.pos, d = g.player.lookDir();
  const m = g.entities.spawnMob(t, p.x + d.x * 12, p.y + 0.5, p.z + d.z * 12);
  if (m) { m.data.provoked = true; m.data.apuro = true; }
  g.giveItem(OFRENDA, 2);
  return `${(JEFES2[t] || JEFES3[t]).name} delante (y dos ofrendas, para llamar a los jefes de noche en su bioma)`;
}
