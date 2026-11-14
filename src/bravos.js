// Criaturas bravas de Costa Rica: los saínos (chanchos de monte que avisan castañeteando y después cargan en manada), el
// chupacabras de los potreros (va primero por las gallinas y las vacas), el Toro Guaco de los llanos (embiste en línea recta y
// si choca queda atontado) y los Chatas, asaltantes del camino que salen de noche a quitarle a uno la plata (atajan de frente y
// aguantan mucho). Cada uno con su modelo, su aviso y su manera de ganarle.
import { avisoEmbestida, avisoCaida, apagarAviso, atacar } from './golpes.js';
import { armarCulebrita } from './modelos-alimanas.js';
import { SOLID, AIR, FLUID, BLOCKS, ITEMS, itemName } from './blocks.js';
import { esUnico } from './inventory.js';
import { Piedra } from './sombras2.js';
import { SEA } from './worldgen.js';
import { regionAt } from './regiones.js';
import { armarChupacabras, armarToroGuaco, armarPuma } from './modelos-bravos.js';
import { armarSaino, armarMicoMalo, armarBecquer, armarChata } from './modelos-monte.js';
import { difOf } from './supervivencia.js';
import { CHUNK, idx } from './worldgen.js';
import { key } from './world.js';

const COLON = 360, CARNE = 262, CUERO = 271, ESENCIA = 499;
const ASFALTO = new Set([183, 184, 198, 199]);
const frente = (m, g) => {
  const p = g.player.body.pos, b = m.body.pos;
  let d = Math.atan2(p.x - b.x, p.z - b.z) - m.yaw;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return Math.abs(d) < 1.0;
};
// `amago`: cuánto se prepara antes de soltar el golpe (los que embisten corriendo no lo llevan: van de paso)
// v11.9.1: por defecto el golpe lleva amago (pasa por atacar(), con brillo y parry); amago 0 solo para el choque de la estampida,
// que ya avisa con el castañeteo y el carril
const pegar = (m, g, dmg, causa, alcance = 1.6, amago = 0.45, alGolpe = null) => {
  const pl = g.player.body.pos, b = m.body.pos;
  if (m.attackCd > 0 || Math.hypot(pl.x - b.x, pl.z - b.z) > alcance || Math.abs(pl.y - b.y) > 1.8) return false;
  if (amago) { atacar(m, g, { dano: dmg, causa, alcance, prep: amago, cd: 1.2, alGolpe: (llego) => { if (llego && alGolpe) alGolpe(); } }); return false; }
  g.damagePlayer(dmg, b.x, b.z, causa, false, true);
  m.attackCd = 1.2;
  return true;
};

const tocado = (w, x, y, z) => { const cx = Math.floor(x / CHUNK), cz = Math.floor(z / CHUNK), m = w.mods.get(key(cx, cz)); return !!m && m.has(idx(x - cx * CHUNK, y, z - cz * CHUNK)); };
// la manada de saínos (y su cuche): avisan castañeteando; si uno se queda, o le pega a uno, cargan todos
function manada(m, dt, c, dano, cuche) {
  const { g, distP, dxp, dzp } = c;
  const D = m.data;
  if (g.mode !== 'survival' || !g.player.alive) return false;
  if (D.provoked && !D.bravo) { D.bravo = 8; for (const o of g.entities.mobs) if ((o.type === 'saino' || o.type === 'cuche_monte') && !o.dead && Math.hypot(o.body.pos.x - m.body.pos.x, o.body.pos.z - m.body.pos.z) < 16) o.data.bravo = 8; }
  if (D.bravo > 0) {
    D.bravo -= dt;
    if (distP > 18) { D.bravo = 0; D.aviso = 0; return false; }
    m.targetYaw = Math.atan2(dxp, dzp); m.goTo(c.pl.x, c.pl.z, cuche ? 1.7 : 1.55);
    // el cuche se lleva las matas y las hojas de por medio
    if (cuche && Math.random() < dt * 6) {
      const b = m.body.pos, l = distP || 1, x = Math.floor(b.x + (dxp / l) * 1.2), z = Math.floor(b.z + (dzp / l) * 1.2);
      for (const y of [Math.floor(b.y), Math.floor(b.y) + 1]) { const id = g.world.getBlock(x, y, z), bl = BLOCKS[id]; if (bl && (bl.leafy || (bl.render === 'cross' && !bl.crop)) && !tocado(g.world, x, y, z)) { g.world.setBlock(x, y, z, AIR); g.particles.burst(x + 0.5, y + 0.5, z + 0.5, [[0.3, 0.55, 0.2]], 5, 1.5); } }
    }
    if (pegar(m, g, dano, cuche ? 'El cuche de monte le abrió una herida' : 'Una manada de saínos le pasó por encima', cuche ? 1.8 : 1.4, 0)) {
      D.bravo = Math.max(D.bravo, 4); m.sqV -= 4;
      if (cuche && g.mode === 'survival') { if (!g.player.effects.sangrando) g.ui.toast('🩸 ¡El colmillo del cuche lo dejó sangrando! Una venda lo para', 2600); g.addEffect('sangrando', 60); }
    }
    return true;
  }
  if (distP < (cuche ? 9 : 7)) {
    D.aviso = (D.aviso || 0) + dt;
    m.moving = false; m.targetYaw = Math.atan2(dxp, dzp);
    if (!D.avisoSono) { D.avisoSono = true; g.audio.play('chancho', { pos: m.soundPos(), vol: 1, pitch: cuche ? 0.8 : 1.7 }); if (!g.meta.sainoAviso) { g.meta.sainoAviso = true; g.ui.toast('🐗 ¡Los saínos castañetean los dientes! Aléjese despacio o van a cargar', 3200); } }
    if (D.aviso > (cuche ? 1.6 : 2.2)) { D.bravo = 6; D.avisoSono = false; }
    return true;
  }
  D.aviso = Math.max(0, (D.aviso || 0) - dt); D.avisoSono = false;
  return false;
}
// lo que la Bécquer tiene apretado: el jugador no se mueve y pierde vida hasta zafarse
function apretar(g, m, dt) {
  const A = m.data.aprieta, P = g.player.body;
  if (!A) return;
  if (Math.hypot(m.body.pos.x - A.x, m.body.pos.z - A.z) > 2.5) { m.data.aprieta = null; m.data.suelta = 6; return; } // si la movieron lejos, suelta
  P.pos.x = A.x; P.pos.z = A.z; P.vel.x = P.vel.z = 0; if (P.vel.y > 0) P.vel.y = 0;
  A.t -= dt; A.tick -= dt;
  if (A.tick <= 0) { A.tick = 1; g.damagePlayer(1.5, m.body.pos.x, m.body.pos.z, 'Lo apretó una bécquer', true, false); }
  if (A.t <= 0 || !g.player.alive) { m.data.aprieta = null; m.data.suelta = 6; g.ui.toast('🐍 ¡Se zafó! Aléjese de la bécquer', 2000); }
}

export const BRAVOS = {
  // ===== Saíno: chancho de monte con collar blanco; andan en manada. Castañetean los dientes de aviso y, si uno se queda, cargan =====
  saino: {
    name: 'Saíno', w: 0.55, h: 0.62, health: 14, speed: 2.6, hostile: false, hurtSound: 'chancho.chillido', idleSound: 'chancho', idleEvery: [10, 25],
    particle: [[0.25, 0.22, 0.2], [0.45, 0.4, 0.36]], drops: [[CARNE, 1, 2], [CUERO, 0, 1]], xp: 6,
    build() { return armarSaino(); },
    brain(m, dt, c) { return manada(m, dt, c, 3, false); },
    animate(m, dt, u) {
      const D = m.data;
      u.headRx = D.aviso > 0 && !(D.bravo > 0) ? Math.sin(m.t * 26) * 0.18 : (D.bravo > 0 ? 0.25 : 0);
    },
  },

  // ===== Chupacabras: flaco, gris, con espinas moradas en el lomo y ojos rojos. De noche busca las gallinas y las vacas;
  // después viene por uno. Pega y se aparta, y vuelve: hay que esperarlo con el arma lista =====
  chupacabras: {
    name: 'Chupacabras', w: 0.6, h: 1.25, health: 30, speed: 3.6, hostile: true, attack: 4, hurtSound: 'gato.bufido', idleSound: 'monstruo', idleEvery: [8, 18],
    particle: [[0.4, 0.45, 0.4], [0.5, 0.2, 0.45]], drops: [[CUERO, 0, 1], [ESENCIA, 0, 1]], xp: 22,
    build() { return armarChupacabras(); },
    brain(m, dt, c) {
      const { g, distP, dxp, dzp, pl } = c;
      const D = m.data, b = m.body.pos;
      if (g.daylight > 0.45) { m.goTo(b.x - dxp * 3, b.z - dzp * 3, 1.5); D.vete = (D.vete || 0) + dt; if (D.vete > 6) m.dead = true; return true; } // con el sol se esconde
      // pega y se aparta: después de cada golpe se retira unos segundos
      if (D.retira > 0) { D.retira -= dt; m.goTo(b.x - dxp * 2, b.z - dzp * 2, 1.4); return true; }
      // primero los animales de la finca
      D.buscaT = (D.buscaT || 0) - dt;
      if (D.buscaT <= 0) {
        D.buscaT = 1;
        D.presa = g.entities.mobs.find((o) => !o.dead && !o.dying && (o.type === 'gallina' || o.type === 'vaca') && Math.hypot(o.body.pos.x - b.x, o.body.pos.z - b.z) < 22) || null;
        if (D.presa && !D.avisoPresa && distP < 40) { D.avisoPresa = true; g.ui.toast('🩸 Algo anda detrás de los animales en el potrero…', 3000); g.audio.play('monstruo', { pos: m.soundPos(), vol: 1 }); }
      }
      const P = D.presa;
      if (P && !P.dead && !P.dying && !D.provoked && distP > 6) {
        m.goTo(P.body.pos.x, P.body.pos.z, 1.2);
        if (Math.hypot(P.body.pos.x - b.x, P.body.pos.z - b.z) < 1.4 && m.attackCd <= 0) { P.hurt(6, b.x, b.z); m.attackCd = 1; g.particles.burst(P.body.pos.x, P.body.pos.y + 0.6, P.body.pos.z, [[0.6, 0.05, 0.05]], 8, 1.5); }
        return true;
      }
      if (g.mode !== 'survival' || !g.player.alive || distP > 30) return false;
      m.targetYaw = Math.atan2(dxp, dzp); m.goTo(pl.x, pl.z, 1.1);
      pegar(m, g, m.kind.attack, 'Lo agarró el chupacabras', 1.5, 0.5, () => { D.retira = 1.6 + Math.random(); g.audio.play('gato.bufido', { pos: m.soundPos(), vol: 0.9, pitch: 0.7 }); });
      return true;
    },
    animate(m, dt, u) {
      if (m.attackCd > 0.8) u.brazos.forEach((a, i) => { a.rotation.x = -1.2 + Math.sin(m.t * 30 + i * Math.PI) * 0.3; }); // zarpazo
      u.brillo.scale.setScalar(m.data.retira > 0 ? 0.6 : 1 + Math.sin(m.t * 6) * 0.15);
      u.tail.rotation.y = Math.sin(m.t * 4) * 0.35;
    },
    alMorir(m, g) { g.achieve('chupacabras', 'Sí existía el chupacabras'); },
  },

  // ===== Toro Guaco: un toro negro, enorme, con los ojos como brasas y humo en el lomo. Rasca el suelo, resopla y embiste en
  // línea recta. Hay que quitarse de lado: si choca con algo, queda atontado y ahí se le pega =====
  toro_guaco: {
    name: 'El Toro Guaco', w: 1.05, h: 1.45, health: 80, speed: 2.1, hostile: true, attack: 7, hurtSound: 'vaca', idleSound: 'resoplido', idleEvery: [6, 12],
    particle: [[0.08, 0.08, 0.1], [0.9, 0.3, 0.1]], drops: [[CUERO, 2, 4], [CARNE, 2, 3], [ESENCIA, 1, 2], [529, 1, 1]], xp: 45,
    build() { return armarToroGuaco(); },
    brain(m, dt, c) {
      const { g, distP, dxp, dzp, pl } = c;
      const D = m.data, b = m.body;
      if (g.daylight > 0.45) { D.vete = (D.vete || 0) + dt; m.moving = false; if (D.vete > 3) { g.particles.burst(b.pos.x, b.pos.y + 1, b.pos.z, m.kind.particle, 30, 2.5); m.dead = true; } return true; } // al aclarar se deshace en humo
      if (Math.random() < dt * 5) g.particles.spawn(b.pos.x + (Math.random() - 0.5) * 0.6, b.pos.y + 1.5, b.pos.z + (Math.random() - 0.5) * 0.8, [0.15, 0.15, 0.17], 0, 0.8, 0, 1.6, -0.3);
      if (D.atontado > 0) { D.atontado -= dt; m.moving = false; return true; }
      if (g.mode !== 'survival' || !g.player.alive || distP > 34) return false;
      const E = D.embiste;
      if (E && E.fase === 'rasca') {
        E.t -= dt; m.moving = false; m.targetYaw = Math.atan2(dxp, dzp);
        if (E.t <= 0) {
          const l = distP || 1;
          D.embiste = { fase: 'corre', t: 2.4, x: dxp / l, z: dzp / l, pego: false };
          g.audio.play('galope', { pos: m.soundPos(), vol: 1, pitch: 0.7 });
        }
        return true;
      }
      if (E && E.fase === 'corre') {
        E.t -= dt; m.moving = false;
        b.vel.x = E.x * 11; b.vel.z = E.z * 11;
        m.targetYaw = Math.atan2(E.x, E.z);
        if (Math.random() < dt * 20) g.particles.spawn(b.pos.x, b.pos.y + 0.1, b.pos.z, [0.45, 0.38, 0.3], (Math.random() - 0.5), 1, (Math.random() - 0.5), 0.6, 4);
        if (!E.pego && Math.hypot(pl.x - b.pos.x, pl.z - b.pos.z) < 1.5 && Math.abs(pl.y - b.pos.y) < 2) {
          E.pego = true;
          g.damagePlayer(m.kind.attack, b.pos.x - E.x * 3, b.pos.z - E.z * 3, 'Lo embistió el Toro Guaco', true, true);
          const v = g.player.body.vel; v.x += E.x * 12; v.z += E.z * 12; v.y = 7; g.shake = Math.max(g.shake || 0, 0.6);
        }
        if (b.hitWall) {
          D.embiste = null; D.atontado = 2.6; D.cd = 2;
          g.shake = Math.max(g.shake || 0, 0.3);
          g.audio.play('puerta.golpe', { pos: m.soundPos(), vol: 1, pitch: 0.6 });
          g.particles.burst(b.pos.x, b.pos.y + 1.4, b.pos.z, [[1, 0.95, 0.5]], 10, 1.5);
          if (!g.meta.toroAviso) { g.meta.toroAviso = true; g.ui.toast('🐂 ¡Se dio contra algo y quedó atontado! Ahora: péguele', 2600); }
          return true;
        }
        if (E.t <= 0) { D.embiste = null; D.cd = 1.5; }
        return true;
      }
      D.cd = Math.max(0, (D.cd ?? 1) - dt);
      m.targetYaw = Math.atan2(dxp, dzp);
      if (D.cd <= 0 && distP > 4 && distP < 24 && b.onGround) {
        D.embiste = { fase: 'rasca', t: 1.3 };
        avisoEmbestida(m, g, 1.3, 16);
        g.audio.play('resoplido', { pos: m.soundPos(), vol: 1, pitch: 0.6 });
        if (!g.meta.toroAviso0) { g.meta.toroAviso0 = true; g.ui.toast('🐂 El Toro Guaco rasca el suelo… ¡quítese de lado cuando arranque!', 3200); }
        return true;
      }
      // de cerca camina hacia uno y da cornadas
      m.goTo(pl.x, pl.z, 0.9);
      pegar(m, g, 5, 'Una cornada del Toro Guaco', 1.9);
      return true;
    },
    animate(m, dt, u) {
      const E = m.data.embiste;
      u.headRx = E && E.fase === 'corre' ? 0.45 : (m.data.atontado > 0 ? 0.6 + Math.sin(m.t * 5) * 0.1 : 0);
      u.head.rotation.z = m.data.atontado > 0 ? Math.sin(m.t * 3) * 0.25 : 0;
      if (E && E.fase === 'rasca') u.legs[0].rotation.x = Math.sin(m.t * 14) * 0.7;
      u.tail.rotation.z = Math.sin(m.t * 2.2) * 0.3;
      u.brasa.scale.setScalar(E ? 1.4 : 1);
    },
    alMorir(m, g) { g.achieve('toro_guaco', 'Toreé al Toro Guaco'); },
  },

  // ===== Chatas: asaltantes del camino. Pañuelo en la cara, gorra y machete. Salen de noche en las carreteras, en grupitos.
  // Le quitan colones y salen corriendo; atajan los golpes de frente con el machete y aguantan mucho. Si se alcanzan, se recupera la plata =====
  chata: {
    name: 'Chata', w: 0.62, h: 1.8, health: 38, speed: 2.9, hostile: true, attack: 4, hurtSound: 'hurt', idleSound: 'silbido', idleEvery: [7, 16],
    particle: [[0.25, 0.3, 0.5], [0.6, 0.15, 0.15]], drops: [[528, 0, 1]], xp: 18,
    build() { return armarChata(); },
    brain(m, dt, c) {
      const { g, distP, dxp, dzp, pl } = c;
      const D = m.data, b = m.body.pos;
      D.apuro = true; // el sol no los quema: son gente
      if (g.daylight > 0.45 && !D.robado) { m.goTo(b.x - dxp * 3, b.z - dzp * 3, 1.3); if (distP > 40) m.dead = true; return true; }
      // con la plata, sale corriendo; si se le alcanza, se recupera
      if (D.robado) {
        D.huye -= dt;
        m.goTo(b.x - dxp * 3, b.z - dzp * 3, 1.5);
        if (D.huye <= 0 && distP > 20) { anotarDeudor(g, D.robado.n); D.robado = null; m.dead = true; }
        return true;
      }
      D.esquiva = Math.max(0, (D.esquiva || 0) - dt);
      if (g.mode !== 'survival' || !g.player.alive || distP > 28) return false;
      const cab = g.inventory.armor[0];
      if (cab && ITEMS[cab.id] && ITEMS[cab.id].disfrazChata && !D.provoked) {
        m.moving = false; m.targetYaw = Math.atan2(dxp, dzp);
        if (!D.saludo && distP < 10) { D.saludo = true; g.audio.play('silbido', { pos: m.soundPos(), vol: 0.8, pitch: 1.2 }); g.ui.toast('🧣 «¿Diay, mae, qué hubo?» Con el pañuelo, los Chatas creen que es de la banda', 3200); g.achieve('panuelo', 'De la banda'); }
        return true;
      }
      if (!D.grito && distP < 16) {
        D.grito = true;
        g.audio.play('silbido', { pos: m.soundPos(), vol: 1 });
        if (!g.asaltoT || g.clock - g.asaltoT > 60) { g.asaltoT = g.clock; g.ui.toast('🔪 «¡Alto ahí! ¡Suelte la plata!» Le salieron los Chatas', 3400); }
      }
      // se hacen a un lado de un brinco
      if (distP < 4 && D.esquiva <= 0 && m.body.onGround && Math.random() < dt * 0.5) {
        D.esquiva = 3; const lado = Math.random() < 0.5 ? 1 : -1, l = distP || 1;
        m.body.vel.x += (-dzp / l) * 6 * lado; m.body.vel.z += (dxp / l) * 6 * lado; m.body.vel.y = 4;
      }
      m.targetYaw = Math.atan2(dxp, dzp); m.goTo(pl.x, pl.z, 1);
      if (Math.hypot(pl.x - b.x, pl.z - b.z) < 1.6 && m.attackCd <= 0) {
        // el primer machetazo que conecta, además le saca plata
        pegar(m, g, m.kind.attack, 'Asalto de los Chatas', 1.6, 0.55, () => {
          const plata = g.inventory.count(COLON);
          if (!(plata > 0 && (g.clock || 0) > (g.chatasRobaronT || 0))) return;
          const n = Math.min(plata, Math.max(1, Math.min(60, Math.ceil(plata * 0.3))));
          g.inventory.remove(COLON, n);
          D.robado = { id: COLON, n }; D.huye = 20; g.chatasRobaronT = (g.clock || 0) + 20; // uno solo roba por asalto
          g.audio.play('monedas', { ui: true, vol: 0.8 });
          g.ui.toast(`💸 ¡Le sacaron ₡${n}! Si alcanza al que se los llevó, los recupera`, 3600);
        });
      }
      return true;
    },
    // atajan con el machete lo que viene de frente (salvo los golpes cargados)
    onHurt(m, g, dmg) {
      if (m.data.robado) return true;
      const pesado = g.golpeCargado || dmg >= 9 || g.rompeEscudo;
      if (frente(m, g) && !pesado && Math.random() < 0.4) {
        g.audio.play('armadura.metal', { pos: m.soundPos(), vol: 0.9, pitch: 1.3 });
        g.particles.burst(m.body.pos.x, m.body.pos.y + 1.3, m.body.pos.z, [[1, 0.95, 0.6], [0.8, 0.8, 0.85]], 8, 2);
        if (!g.meta.chataAviso) { g.meta.chataAviso = true; g.ui.toast('⚔ ¡Lo atajó con el machete! Rodéelo o péguele un golpe cargado', 2600); }
        m.attackCd = Math.max(m.attackCd, 0.35);
        return false;
      }
      return true;
    },
    animate(m, dt, u) {
      m.data.tajo = Math.max(0, (m.data.tajo || 0) - dt);
      const k = m.data.tajo > 0 ? Math.sin((1 - m.data.tajo / 0.35) * Math.PI) : 0;
      u.brazos[1].rotation.x = -0.4 - k * 1.8 + (m.data.robado ? 0.6 : 0);
      u.brazos[0].rotation.x = Math.sin(m.walk) * 0.5 * m.walkAmt;
    },
    alMorir(m, g) {
      g.achieve('chatas', 'A los Chatas se les acabó la noche');
      if (m.data.deudor && g.mode === 'survival' && Math.hypot(m.body.pos.x - g.player.body.pos.x, m.body.pos.z - g.player.body.pos.z) < 80) cobrarDeudor(g);
    },
  },

  // ===== El cuche de monte: el macho viejo que manda a los saínos. Grandote, de colmillos largos y ojos rojos; carga de lejos,
  // se lleva las matas y deja sangrando =====
  cuche_monte: {
    name: 'Cuche de monte', w: 0.9, h: 1.0, health: 55, speed: 2.7, hostile: false, hurtSound: 'chancho.chillido', idleSound: 'chancho', idleEvery: [8, 18],
    particle: [[0.18, 0.16, 0.15], [0.5, 0.1, 0.08]], drops: [[CARNE, 3, 5], [CUERO, 1, 3], [ESENCIA, 0, 1]], xp: 30,
    build() { const m = armarSaino(true); m.userData.babyScale = 1.7; return m; },
    brain(m, dt, c) { return manada(m, dt, c, 5, true); },
    animate(m, dt, u) { BRAVOS.saino.animate(m, dt, u); },
    alMorir(m, g) { g.achieve('cuche_monte', 'El cuche de monte'); },
  },

  // ===== El Mico Malo: un mono negro de ojos que echan fuego, que vive en lo alto de los árboles. Tira piedras desde arriba, se
  // tira encima a arañar y se lleva algo de la mochila. Si se le alcanza, devuelve lo robado =====
  mico_malo: {
    name: 'Mico Malo', w: 0.55, h: 1.0, health: 24, speed: 3.4, hostile: true, attack: 3, hurtSound: 'mono', idleSound: 'mono', idleEvery: [6, 14],
    particle: [[0.12, 0.1, 0.1], [1, 0.5, 0.1]], drops: [[ESENCIA, 0, 1]], xp: 20,
    build() { return armarMicoMalo(); },
    brain(m, dt, c) {
      const { g, distP, dxp, dzp, pl } = c;
      const D = m.data, b = m.body;
      D.apuro = true; // es del monte, no de la noche: el sol no lo quema
      if (D.robado) {
        D.huye -= dt; m.goTo(b.pos.x - dxp * 3, b.pos.z - dzp * 3, 1.6);
        if (b.hitWall && b.onGround) b.vel.y = 9; // trepa
        if (D.huye <= 0 && distP > 22) { g.ui.toast(`🐒 El Mico Malo se fue con ${D.robado.n} ${itemName(D.robado.id)}`, 3000); D.robado = null; m.dead = true; }
        return true;
      }
      if (g.mode !== 'survival' || !g.player.alive || distP > 26) return false;
      m.targetYaw = Math.atan2(dxp, dzp);
      const arriba = b.pos.y - pl.y > 2.5;
      D.tiro = (D.tiro ?? 1.2) - dt;
      // desde lo alto tira piedras y se queda quieto; abajo, se tira a arañar y robar
      if (arriba || distP > 7) {
        if (!arriba) m.goTo(pl.x, pl.z, 0.9); else m.moving = false;
        if (D.tiro <= 0 && distP > 3 && distP < 18) {
          D.tiro = 2.2 + Math.random(); D.lanza = 0.3;
          const pv = g.player.body.vel, t = distP / 14;
          const tx = pl.x + pv.x * t * 0.5, tz = pl.z + pv.z * t * 0.5, ty = pl.y + 1.2;
          const sx = b.pos.x, sy = b.pos.y + 1.1, sz = b.pos.z;
          const dx = tx - sx, dz = tz - sz, dh = Math.hypot(dx, dz) || 1, vh = 14, tt = dh / vh, vy = (ty - sy) / tt + 0.5 * 14 * tt;
          (g.piedras ||= []).push(new Piedra(g, sx, sy, sz, { x: (dx / dh) * vh, y: vy, z: (dz / dh) * vh }, 'El Mico Malo le tiró una piedra', true));
          g.audio.play('mono', { pos: m.soundPos(), vol: 0.9, pitch: 1.3 });
        }
        return true;
      }
      m.goTo(pl.x, pl.z, 1.3);
      pegar(m, g, m.kind.attack, 'Lo arañó el Mico Malo', 1.4, 0.42, () => {
        if (D.robo) return;
        D.robo = true;
        const inv = g.inventory, L = [];
        inv.slots.forEach((st, i) => { if (st && i !== inv.selected && !(ITEMS[st.id] && ITEMS[st.id].durability) && !esUnico(st.id)) L.push(i); });
        if (L.length) {
          const st = inv.slots[L[(Math.random() * L.length) | 0]], n = Math.min(st.count, 6);
          inv.remove(st.id, n); D.robado = { id: st.id, n }; D.huye = 18;
          g.audio.play('mono', { pos: m.soundPos(), vol: 1, pitch: 1.6 });
          g.ui.toast(`🐒 ¡El Mico Malo le arrebató ${n} ${itemName(st.id)}! Si lo alcanza, se lo devuelve`, 3400);
        }
      });
      return true;
    },
    animate(m, dt, u) {
      m.data.lanza = Math.max(0, (m.data.lanza || 0) - dt);
      if (m.data.lanza > 0) u.brazos[1].rotation.x = -2.6;
      u.tail.rotation.y = Math.sin(m.t * 3) * 0.4;
      u.fuego.scale.setScalar(1 + Math.sin(m.t * 11) * 0.25);
    },
    alMorir(m, g) { g.achieve('mico_malo', 'Al Mico Malo se le acabó la maña'); },
  },

  // ===== La Bécquer: la boa grandísima de las historias del sur. Quieta parece un tronco caído; si uno pasa encima o al lado,
  // lo agarra y lo aprieta. Pegándole se zafa uno más rápido =====
  becquer: {
    name: 'Bécquer', w: 0.8, h: 0.45, health: 50, speed: 1.3, hostile: true, attack: 3, hurtSound: 'serpiente', idleSound: null, idleEvery: [999, 999],
    particle: [[0.4, 0.33, 0.2], [0.25, 0.2, 0.12]], drops: [[526, 2, 3], [CUERO, 1, 2], [CARNE, 1, 2]], xp: 26, noJump: true,
    build() { return armarBecquer(); },
    brain(m, dt, c) {
      const { g, distP, dxp, dzp, pl } = c;
      const D = m.data;
      D.apuro = true; // de día también anda
      D.suelta = Math.max(0, (D.suelta || 0) - dt);
      if (D.aprieta) { apretar(g, m, dt); m.moving = false; return true; }
      if (g.mode !== 'survival' || !g.player.alive) { m.moving = false; return true; }
      // escondida, quieta como un tronco, hasta que uno le pasa encima o al lado
      if (!D.provoked && !D.despierta) {
        m.moving = false;
        if (distP < 1.6 && Math.abs(pl.y - m.body.pos.y) < 1.5 && D.suelta <= 0) {
          D.despierta = true;
          D.aprieta = { t: 3.5, tick: 0.3, x: pl.x, z: pl.z };
          g.audio.play('serpiente', { pos: m.soundPos(), vol: 1, pitch: 0.6 });
          g.ui.toast('🐍 ¡Ese «tronco» era una bécquer y le tiene apretado el cuerpo! Péguele para zafarse', 3200);
        }
        return true;
      }
      if (distP > 20) return false;
      m.targetYaw = Math.atan2(dxp, dzp); m.goTo(pl.x, pl.z, 1);
      if (D.suelta <= 0 && distP < 1.5 && m.attackCd <= 0 && Math.random() < 0.5) { D.aprieta = { t: 2.5, tick: 0.3, x: pl.x, z: pl.z }; g.audio.play('serpiente', { pos: m.soundPos(), vol: 1, pitch: 0.6 }); return true; }
      pegar(m, g, m.kind.attack, 'La mordida de una bécquer', 1.5, 0.42);
      return true;
    },
    // pegarle mientras aprieta la hace soltar antes
    onHurt(m) { if (m.data.aprieta) m.data.aprieta.t -= 0.9; m.data.despierta = true; return true; },
    animate(m, dt, u) {
      const quieta = !m.data.despierta && !m.data.provoked;
      u.segs.forEach((s, i) => { s.position.x = quieta ? Math.sin(i * 0.4) * 0.04 : Math.sin(m.t * 6 - i * 0.8) * 0.12 * (m.moving ? 1 : 0.4); s.scale.y = m.data.aprieta ? 1 + Math.sin(m.t * 10 + i) * 0.08 : 1; });
      u.ojos.visible = !quieta;
      u.lengua.visible = !quieta && Math.sin(m.t * 7) > 0.3;
      u.head.position.x = u.segs[0].position.x;
    },
    alMorir(m, g) { g.achieve('becquer', 'Se zafó de la bécquer'); },
  },

  // ===== El puma: el león de montaña, café claro, de cola larga. Acecha por detrás; si uno lo mira, gruñe y se echa para
  // atrás; si uno le da la espalda, se tira encima. Mirarlo de frente es la defensa =====
  puma: {
    name: 'Puma', w: 0.7, h: 0.9, health: 40, speed: 3.6, hostile: true, attack: 5, hurtSound: 'jaguar', idleSound: null, idleEvery: [999, 999],
    particle: [[0.7, 0.55, 0.38], [0.85, 0.75, 0.6]], drops: [[CUERO, 1, 3], [CARNE, 1, 2]], xp: 30,
    build() { return armarPuma(); },
    brain(m, dt, c) {
      const { g, distP, dxp, dzp, pl } = c;
      const D = m.data, b = m.body;
      D.apuro = true;
      if (g.daylight > 0.55) { m.goTo(b.pos.x - dxp * 3, b.pos.z - dzp * 3, 1.2); if (distP > 40) m.dead = true; return true; }
      if (g.mode !== 'survival' || !g.player.alive || distP > 34) return false;
      // ¿lo está mirando uno?
      const ld = g.player.lookDir(), l = distP || 1, mirado = (ld.x * (-dxp / l) + ld.z * (-dzp / l)) > 0.75;
      const S = D.salto;
      if (S && S.fase === 'agazapa') {
        // si lo aturdieron a media preparación el anillo ya se fue: se vuelve a marcar desde cero (si no, brincaba sin aviso)
        if (S.aviso && S.aviso.t >= S.aviso.dur) Object.assign(S, { t: 0.45, tx: pl.x, tz: pl.z, aviso: avisoCaida(g, pl.x, pl.y, pl.z, 1.6, 0.45 + 0.9, m) });
        // salta al punto que marcó el anillo al agazaparse, no a donde esté uno ahora: quien se sale del anillo se salva
        const tx = S.tx - b.pos.x, tz = S.tz - b.pos.z, dt2 = Math.hypot(tx, tz) || 1;
        S.t -= dt; m.moving = false; m.targetYaw = Math.atan2(tx, tz);
        if (S.t <= 0) {
          const vy = 7, vuelo = (2 * vy) / 30, v = Math.min(15, Math.max(6, (dt2 - 0.5) / (vuelo * 0.8)));
          b.vel.x = (tx / dt2) * v; b.vel.z = (tz / dt2) * v; b.vel.y = vy; b.onGround = false;
          D.salto = { fase: 'vuelo', t: 0.9, pego: false, aviso: S.aviso };
          g.audio.play('jaguar', { pos: m.soundPos(), vol: 1, pitch: 1.1 });
        }
        return true;
      }
      if (S && S.fase === 'vuelo') {
        S.t -= dt; m.moving = false;
        if (!S.pego && Math.hypot(pl.x - b.pos.x, pl.z - b.pos.z) < 1.7 && Math.abs(pl.y - b.pos.y) < 1.8) {
          S.pego = true;
          g.damagePlayer(m.kind.attack, b.pos.x - b.vel.x, b.pos.z - b.vel.z, 'Un puma le cayó por la espalda', false, true);
          g.shake = Math.max(g.shake || 0, 0.5);
        }
        if (S.t <= 0 || (b.onGround && S.t < 0.5)) { apagarAviso(S.aviso); D.salto = null; D.cd = 4; D.pelea = 6; }
        return true;
      }
      D.cd = Math.max(0, (D.cd ?? 2) - dt);
      // con la vida baja se va
      if (m.health < m.kind.health * 0.35) { m.goTo(b.pos.x - dxp * 3, b.pos.z - dzp * 3, 1.5); if (distP > 30) m.dead = true; return true; }
      if (D.pelea > 0) { D.pelea -= dt; m.targetYaw = Math.atan2(dxp, dzp); m.goTo(pl.x, pl.z, 1); pegar(m, g, 4, 'Un zarpazo de puma', 1.6); return true; }
      if (mirado && !D.provoked) {
        // lo vieron: se agacha, gruñe y se echa para atrás despacio
        D.visto = (D.visto || 0) + dt; D.espalda = 0;
        m.targetYaw = Math.atan2(dxp, dzp);
        if (distP < 12) m.goTo(b.pos.x - dxp, b.pos.z - dzp, 0.35); else m.moving = false;
        if (!D.gruno || D.visto > 6) { D.gruno = true; D.visto = 0; g.audio.play('jaguar', { pos: m.soundPos(), vol: 0.8, pitch: 1.35 }); if (!g.meta.pumaAviso) { g.meta.pumaAviso = true; g.ui.toast('🐆 Un puma no le quita los ojos: mientras lo mire, no se tira', 3600); } }
        return true;
      }
      // de espaldas: se acerca agachado y, cuando está a tiro, se tira
      D.espalda = (D.espalda || 0) + dt;
      m.targetYaw = Math.atan2(dxp, dzp);
      if (distP > 7) { m.goTo(pl.x, pl.z, 0.7); return true; }
      if (D.cd <= 0 && D.espalda > 1 && b.onGround && distP > 2.5 && Math.abs(pl.y - b.pos.y) < 2.5) {
        D.salto = { fase: 'agazapa', t: 0.45, tx: pl.x, tz: pl.z, aviso: avisoCaida(g, pl.x, pl.y, pl.z, 1.6, 0.45 + 0.9, m) }; // se agazapa: es el momento de voltearse
        g.audio.play('gato.bufido', { pos: m.soundPos(), vol: 0.6, pitch: 0.8 });
        return true;
      }
      m.goTo(pl.x, pl.z, 0.8);
      return true;
    },
    animate(m, dt, u) {
      const agachado = m.moving && m.speedMul < 0.8 ? 1 : 0;
      u.body.position.y = -agachado * 0.12;
      u.tail.rotation.y = Math.sin(m.t * (m.data.visto > 0 ? 6 : 2)) * 0.35;
      u.ojos.scale.setScalar(m.data.salto ? 1.5 : 1);
    },
    alMorir(m, g) { g.achieve('puma', 'Le sostuve la mirada al puma'); },
  },
  // ===== La coral y la falsa coral: dos culebritas de anillos casi iguales. En la de verdad el rojo toca al amarillo, y su
  // mordida paraliza; en la falsa el rojo toca al negro, y no hace nada =====
  coral: culebrita(true),
  falsa_coral: culebrita(false),
};

function culebrita(venenosa) {
  return {
    name: venenosa ? 'Coral' : 'Falsa coral', w: 0.35, h: 0.2, health: 6, speed: 1.2, hurtSound: 'serpiente', idleSound: null, idleEvery: [999, 999], noJump: true,
    particle: [[0.8, 0.2, 0.1], [0.1, 0.1, 0.1]], drops: [], xp: 4,
    build() { return armarCulebrita(venenosa); },
    brain(m, dt, c) {
      const { g, distP, dxp, dzp, pl } = c;
      if (g.mode !== 'survival' || !g.player.alive) return false;
      if (distP < 1.6 && !g.player.sneaking && Math.abs(pl.y - m.body.pos.y) < 1.2) {
        m.targetYaw = Math.atan2(dxp, dzp); m.moving = false;
        if (m.attackCd <= 0) {
          atacar(m, g, { tipo: 'latigazo', prep: 0.42, dano: venenosa ? 2 : 0, causa: 'Mordida de coral', alcance: 1.5, cd: 2.5, alSoltar: () => { m.data.strike = 0.3; g.audio.play('serpiente', { pos: m.soundPos(), vol: 0.8, pitch: 1.4 }); }, alGolpe: (llego) => {
            if (!llego) return;
            if (!venenosa) { g.ui.toast('🐍 Era la falsa coral: el rojo tocaba al negro. Mordisquito y nada más', 2600); g.achieve('falsa_coral', 'Rojo con negro, amigo del monte'); return; }
            const bota = g.inventory.armor[3];
            if (bota && ITEMS[bota.id] && ITEMS[bota.id].antiCulebra) { g.ui.toast('🥾 Las botas de bécquer aguantaron a la coral', 2000); return; }
          // el veneno de la coral no pudre: paraliza (no se puede correr ni brincar casi) y envenena
          g.addEffect('paralisis', 25); g.addEffect('veneno', 15);
          g.ui.toast('🐍 ¡Coral de verdad! Las piernas no responden. Suero antiofídico o guaco', 3600);
          g.achieve('coral', 'Rojo con amarillo, veneno');
          } });
        }
        return true;
      }
      return false;
    },
    animate(m, dt, u) {
      m.data.strike = Math.max(0, (m.data.strike || 0) - dt);
      u.segs.forEach((sg, i) => { sg.position.x = Math.sin(m.t * 5 - i * 0.9) * 0.05 * (m.moving ? 1 : 0.3); });
      u.head.position.x = u.segs[0].position.x;
      u.head.position.z = 0.36 + m.data.strike * 0.6;
    },
  };
}

// ---------- el Chata que se le escapó con la plata: queda con nombre y otra noche vuelve a pasar por la carretera ----------
const APODOS = ['Pelón', 'Chiringo', 'Zancudo', 'Cachetes', 'Mecha Corta', 'Patas de Hule', 'el Gato', 'Tapa de Olla', 'Chayote', 'Pocillo'];
const APELLIDOS = ['Rodríguez', 'Mora', 'Jiménez', 'Vargas', 'Solís', 'Quesada', 'Araya', 'Rojas', 'Calderón', 'Brenes'];
function anotarDeudor(g, n) {
  const M = g.meta;
  if (!M.chataDeudor) M.chataDeudor = { nombre: `${APODOS[Math.floor(Math.random() * APODOS.length)]} ${APELLIDOS[Math.floor(Math.random() * APELLIDOS.length)]}`, n: 0 };
  M.chataDeudor.n += n; M.chataDeudor.dia = g.day || 1;
  g.ui.toast(`💸 «${M.chataDeudor.nombre}» se le fue con ₡${n}. Ya volverá a pasar por la carretera…`, 3600);
}
function cobrarDeudor(g) {
  const D = g.meta.chataDeudor;
  if (!D) return;
  const paga = D.n + 10; // lo suyo, y diez de más por las molestias (dejarse robar no da negocio)
  g.meta.chataDeudor = null;
  g.giveItem(COLON, paga);
  g.ui.toast(`💸 ¡Agarró a «${D.nombre}»! Le devolvió los ₡${D.n}, y diez de más por las molestias`, 4000);
  g.achieve('chata_deudor', 'El que la debe, la paga');
}
// para la hoja de la partida
export function deudorTexto(g) {
  const D = g.meta && g.meta.chataDeudor;
  if (!g.settings.hostiles || !difOf(g).hostiles) return null;
  return D ? `💸 «${D.nombre}» le debe ₡${D.n}. Sale de noche por las carreteras` : null;
}

// ---------- el cacho del Toro Guaco: soplado, espanta a todo lo que no sea jefe ----------
export const CACHO = 529;
export function soplarCacho(g) {
  if ((g.cachoCd || 0) > (g.clock || 0)) { g.ui.toast('Todavía no recupera el aire para soplar el cacho…', 1200); return; }
  g.cachoCd = (g.clock || 0) + 45;
  g.audio.play('resoplido', { vol: 1.4, pitch: 0.45 }); g.audio.play('vaca', { vol: 1.2, pitch: 0.5 });
  g.shake = Math.max(g.shake || 0, 0.3);
  const p = g.player.body.pos;
  let n = 0;
  for (const m of g.entities.mobs) {
    if (!m.kind.hostile || m.kind.boss || m.dead || m.dying) continue;
    if (m.data.comensalFn) continue; // la Sombra mansa que viene a comer no se espanta
    if (Math.hypot(m.body.pos.x - p.x, m.body.pos.z - p.z) < 16) { m.panic = 8; m.data.espanto = (g.clock || 0) + 8; if (m.data.aprieta) { m.data.aprieta = null; m.data.suelta = 6; } n++; }
  }
  g.ui.toast(n ? `📯 ¡BUUUUUU! ${n} criatura${n > 1 ? 's salieron' : ' salió'} corriendo` : '📯 ¡BUUUUUU! (se oyó en todo el llano)', 2000);
  g.achieve('cacho', 'Soplé el cacho del Toro Guaco');
}

// ---------- el pavor (lo deja la Segua): la vista se cierra en negro unos segundos ----------
let velo = null;
export function tickPavor(g) {
  const t = (g.player && g.player.effects && g.player.effects.pavor) || 0;
  if (!velo) {
    if (!t) return;
    velo = document.createElement('div');
    velo.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:5;background:radial-gradient(circle at 50% 50%, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.97) 38%);transition:opacity .4s'; // contenido: la oscuridad de la cueva, no interfaz
    document.body.appendChild(velo);
  }
  velo.style.opacity = t > 0 ? String(Math.min(1, t / 1.2)) : '0';
}

// ---------- dónde y cuándo salen ----------
const libre = (w, x, y, z) => w.getBlock(x, y, z) === AIR && w.getBlock(x, y + 1, z) === AIR && SOLID[w.getBlock(x, y - 1, z)] && !FLUID[w.getBlock(x, y - 1, z)];
// el suelo de verdad: las hojas y los troncos no cuentan (si no, nacían arriba de los árboles)
function suelo(w, x, z, y0) {
  for (let y = y0 + 8; y > Math.max(SEA, y0 - 10); y--) { const id = w.getBlock(x, y, z), b = BLOCKS[id]; if (SOLID[id] && !(b && (b.leafy || /(^|_)log$/.test(b.key)))) return y + 1; }
  return null;
}
export function bravosSpawn(E, g) {
  if (g.dim !== 'tierra' || g.mode !== 'survival' || !g.settings.hostiles || !difOf(g).hostiles) return false;
  const w = g.world, pl = g.player.body.pos, dia = g.day || 1;
  const count = (t) => E.mobs.filter((m) => m.type === t && !m.dead).length;
  const a = Math.random() * Math.PI * 2, r = 22 + Math.random() * 20;
  const x = Math.floor(pl.x + Math.cos(a) * r), z = Math.floor(pl.z + Math.sin(a) * r);
  if (!w.isLoaded(x, z)) return false;
  const col = w.gen.column(x, z), bio = col.biome;
  const y = suelo(w, x, z, col.h);
  if (y === null || !libre(w, x, y, z)) return false;
  const noche = g.daylight < 0.3, dia_ = g.daylight > 0.5, R = Math.random();
  const sec = bio === 'bosque_seco' || (bio === 'plains' && regionAt(w.gen, x, z) === 'guanacaste');
  // saínos: de día, en el monte, una manada a la vez; desde el día 5 a veces los manda el cuche de monte
  if (dia_ && ['forest', 'jungle', 'bosque_seco'].includes(bio) && count('saino') === 0 && R < 0.05) {
    const n = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < n; i++) E.spawnMob('saino', x + 0.5 + (i % 3) * 0.9, y + 0.1, z + 0.5 + Math.floor(i / 3) * 0.9);
    if (dia >= 5 && Math.random() < 0.35) E.spawnMob('cuche_monte', x + 0.5, y + 0.1, z - 1.5);
    return true;
  }
  // el Mico Malo: en la selva y el bosque, arriba de un árbol (sobre las hojas), desde el día 3
  if (dia >= 3 && ['jungle', 'forest'].includes(bio) && count('mico_malo') === 0 && R < 0.03) {
    for (let yy = y + 3; yy < y + 16; yy++) {
      if (BLOCKS[w.getBlock(x, yy - 1, z)] && BLOCKS[w.getBlock(x, yy - 1, z)].leafy && w.getBlock(x, yy, z) === AIR && w.getBlock(x, yy + 1, z) === AIR) { E.spawnMob('mico_malo', x + 0.5, yy + 0.1, z + 0.5); return true; }
    }
  }
  // el puma: en las montañas, el bosque nuboso y el páramo, al atardecer y de noche, desde el día 3
  if (g.daylight < 0.4 && dia >= 3 && ['nuboso', 'paramo', 'mountains', 'forest'].includes(bio) && (bio !== 'forest' || col.h > 78) && count('puma') === 0 && Math.random() < 0.025) {
    E.spawnMob('puma', x + 0.5, y + 0.1, z + 0.5);
    return true;
  }
  // las corales: de día en el suelo del bosque y la selva; la mitad de las veces es la falsa
  if (dia_ && ['forest', 'jungle', 'nuboso'].includes(bio) && count('coral') + count('falsa_coral') < 2 && Math.random() < 0.03) {
    E.spawnMob(Math.random() < 0.5 ? 'coral' : 'falsa_coral', x + 0.5, y + 0.05, z + 0.5);
    return true;
  }
  // la Bécquer: quieta en el suelo de la selva y el manglar, cerca del agua; rara
  if (['jungle', 'manglar'].includes(bio) && count('becquer') === 0 && R < 0.02 && Math.hypot(x - pl.x, z - pl.z) > 18) {
    const m = E.spawnMob('becquer', x + 0.5, y + 0.05, z + 0.5);
    if (m) m.yaw = Math.random() * Math.PI * 2;
    return true;
  }
  // Toro Guaco: de noche, solo en los llanos y el bosque seco, raro y desde el día 4
  if (noche && dia >= 4 && sec && count('toro_guaco') === 0 && Math.random() < 0.012) {
    E.spawnMob('toro_guaco', x + 0.5, y + 0.1, z + 0.5);
    g.audio.play('resoplido', { ui: true, vol: 0.5, pitch: 0.5 });
    return true;
  }
  // chupacabras: de noche, en potreros y llanos; más si hay animales de finca cerca
  if (noche && dia >= 3 && ['plains', 'forest', 'bosque_seco'].includes(bio) && count('chupacabras') === 0) {
    const finca = E.mobs.some((m) => !m.dead && (m.type === 'gallina' || m.type === 'vaca') && Math.hypot(m.body.pos.x - pl.x, m.body.pos.z - pl.z) < 40);
    if (R < (finca ? 0.06 : 0.02)) { E.spawnMob('chupacabras', x + 0.5, y + 0.1, z + 0.5); return true; }
  }
  // Chatas: de noche, en las carreteras (asfalto), en grupitos de 2 o 3, desde el día 2
  if (noche && dia >= 2 && count('chata') === 0 && R < 0.08) {
    for (let k = 0; k < 10; k++) {
      const aa = Math.random() * Math.PI * 2, rr = 20 + Math.random() * 16;
      const qx = Math.floor(pl.x + Math.cos(aa) * rr), qz = Math.floor(pl.z + Math.sin(aa) * rr);
      if (!w.isLoaded(qx, qz)) continue;
      const qy = suelo(w, qx, qz, Math.floor(pl.y));
      if (qy === null || !ASFALTO.has(w.getBlock(qx, qy - 1, qz)) || !libre(w, qx, qy, qz)) continue;
      const n = 2 + (Math.random() < 0.4 ? 1 : 0), Dd = g.meta.chataDeudor;
      for (let i = 0; i < n; i++) {
        const c = E.spawnMob('chata', qx + 0.5 + i * 0.8, qy + 0.1, qz + 0.5);
        if (c && i === 0 && Dd && (g.day || 1) > Dd.dia && !E.mobs.some((o) => o.data && o.data.deudor && !o.dead)) { c.data.deudor = true; c.data.name = `«${Dd.nombre}»`; c.health = 55; g.ui.toast(`🔪 Entre los Chatas viene «${Dd.nombre}», el que se le llevó ₡${Dd.n}`, 3600); }
      }
      return true;
    }
  }
  return false;
}
// para /prueba bravos: uno de cada uno, delante
export function pruebaBravos(g, cual) {
  const p = g.player.body.pos, d = g.player.lookDir();
  const tipos = cual && BRAVOS[cual] ? [cual] : Object.keys(BRAVOS);
  let i = 0;
  for (const t of tipos) {
    const n = t === 'saino' ? 4 : t === 'chata' ? 2 : 1;
    for (let k = 0; k < n; k++) {
      const x = p.x + d.x * (10 + i * 2) + (k - n / 2) * 1.2, z = p.z + d.z * (10 + i * 2) + (k % 2);
      const y = suelo(g.world, Math.floor(x), Math.floor(z), Math.floor(p.y)) ?? p.y;
      g.entities.spawnMob(t, x, y + 0.1, z);
    }
    i++;
  }
  return `Delante: ${tipos.map((t) => BRAVOS[t].name).join(', ')}`;
}
