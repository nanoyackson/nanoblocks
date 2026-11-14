// Leyendas ticas que salen de noche: el Cadejos (negro que acecha y ataca, blanco que cuida a quien ayuda al pueblo),
// la Segua (mujer en el camino que se vuelve monstruo con cara de caballo), el Padre sin Cabeza (cerca de las iglesias)
// y la Llorona (llora junto a los ríos). Se van con el amanecer.
import { avisoCaida, apagarAviso, atacar } from './golpes.js';
import { extras, esUnico } from './inventory.js';
import { BLOCKS, BLOCK_BY_KEY as K, SOLID, FLUID, AIR, itemName } from './blocks.js';
const itemNameOf = (id) => itemName(id);
import { difOf } from './supervivencia.js';
import { armarCadejos, armarSegua, armarPadre, armarLlorona, armarCarreta, armarDuende, armarMona, armarViejoMonte } from './modelos-leyendas.js';

const poof = (m, g, msg) => {
  const p = m.body.pos;
  g.particles.burst(p.x, p.y + m.kind.h * 0.5, p.z, [[0.1, 0.1, 0.12], [0.3, 0.3, 0.35], [0.8, 0.8, 0.85]], 40, 3);
  g.audio.play('susurro', { pos: m.soundPos(), vol: 0.6 });
  if (msg && Math.hypot(p.x - g.player.body.pos.x, p.z - g.player.body.pos.z) < 40) g.ui.toast(msg, 2400);
  m.dead = true;
};
const dawn = (g) => g.daylight > 0.45;
const face = (m, dxp, dzp) => { m.targetYaw = Math.atan2(dxp, dzp); };

// ---------- el Cadejos ----------

const CADEJOS = {
  name: 'El Cadejos', w: 1.0, h: 1.6, health: 90, speed: 2.6, legend: true, boss: true, xp: 60,
  hurtSound: 'cadejos', idleSound: 'cadejos', idleEvery: [7, 14], particle: [[0.05, 0.05, 0.06], [0.6, 0.05, 0.02]], drops: [[371, 1, 1]],
  build: () => armarCadejos(false),
  brain(m, dt, c) {
    const { g, distP, dxp, dzp } = c;
    const d = m.data;
    if (dawn(g)) { poof(m, g, 'El Cadejos se fue con el amanecer…'); return true; }
    d.t = (d.t || 0) + dt;
    // al que anda tomado o carga mucha plata, lo huele de lejos
    if (!d.angry && g.mode === 'survival' && ((g.player.effects.mareo || 0) > 8 || g.inventory.count(360) >= 300)) { d.angry = true; g.ui.toast((g.player.effects.mareo || 0) > 8 ? '🐕 El Cadejos le olió el guaro…' : '🐕 El Cadejos le olió la plata…', 2600); g.audio.play('cadejos', { pos: m.soundPos(), vol: 1, pitch: 0.7 }); }
    if (!d.angry && (distP < 5 || d.t > 45)) { d.angry = true; g.audio.play('cadejos', { pos: m.soundPos(), vol: 1, pitch: 0.7 }); }
    // arrastra las cadenas
    d.chainT = (d.chainT || 0) - dt;
    if (m.moving && d.chainT <= 0) { d.chainT = 2.5 + Math.random() * 2; g.audio.play('cadenas', { pos: m.soundPos(), vol: 0.7 }); }
    if (!d.angry) {
      // acecha a unos 10 bloques
      if (distP > 12) m.goTo(m.body.pos.x + dxp, m.body.pos.z + dzp, 0.6);
      else if (distP < 8) m.goTo(m.body.pos.x - dxp, m.body.pos.z - dzp, 0.6);
      else { m.moving = false; face(m, dxp, dzp); }
      return true;
    }
    m.goTo(m.body.pos.x + dxp, m.body.pos.z + dzp, 2);
    if (distP < 1.9 && m.attackCd <= 0 && g.mode === 'survival') {
      atacar(m, g, { tipo: 'mordida', dano: 4, causa: 'El Cadejos le dio alcance', alcance: 1.9, cd: 1.5, alSoltar: () => g.audio.play('cadejos', { pos: m.soundPos(), vol: 1 }) });
    }
    return true;
  },
  animate(m, dt, u) {
    if (u.chains) u.chains.forEach((ch, i) => { ch.rotation.x = Math.sin(m.t * 6 + i) * 0.4 * (0.3 + m.walkAmt); });
    // brasas rojas que se le desprenden (se ve en lo oscuro aunque el pelo sea negro)
    if (Math.random() < dt * 10) { const b = m.body.pos; m.game.particles.spawn(b.x + (Math.random() - 0.5) * 1.1, b.y + 0.6 + Math.random() * 1, b.z + (Math.random() - 0.5) * 1.1, [1, 0.25 + Math.random() * 0.2, 0.05], 0, 0.5, 0, 0.7, 0, true); }
    // y el sonido de las cadenas al andar
    if (m.walkAmt > 0.3 && (m.data.chainT = (m.data.chainT || 0) - dt) <= 0) { m.data.chainT = 1.4; m.game.audio.play('cadenas', { pos: m.soundPos(), vol: 0.45, pitch: 0.9 }); }
  },
  onHurt(m) { m.data.angry = true; },
};

const CADEJOS_BLANCO = {
  name: 'El Cadejos blanco', w: 1.0, h: 1.6, health: 90, speed: 2.8, legend: true, ghostly: true,
  hurtSound: 'perro', idleSound: null, particle: [[0.9, 0.9, 0.9]], drops: [],
  build: () => armarCadejos(true),
  brain(m, dt, c) {
    const { g, distP, dxp, dzp } = c;
    const d = m.data;
    if (dawn(g)) { poof(m, g, 'El Cadejos blanco le cuidó el sueño toda la noche. ¡Gracias!'); g.achieve('cadejos_blanco', 'Protegido por el Cadejos blanco'); return true; }
    // defiende al jugador de las Sombras y del Cadejos negro
    const b = m.body.pos;
    let foe = null, fd = 12;
    for (const o of g.entities.mobs) {
      if (o.dying || o.data.comensalFn || !(o.kind.hostile || o.type === 'cadejos' || o.type === 'segua')) continue;
      const dd = Math.hypot(o.body.pos.x - b.x, o.body.pos.z - b.z);
      if (dd < fd) { fd = dd; foe = o; }
    }
    if (foe) {
      m.goTo(foe.body.pos.x, foe.body.pos.z, 2);
      if (fd < 1.9 && m.attackCd <= 0) { m.attackCd = 0.9; foe.hurt(7, b.x, b.z); g.audio.play('perro.gruñido', { pos: m.soundPos(), vol: 0.8 }); }
      return true;
    }
    if (distP > 5) m.goTo(b.x + dxp, b.z + dzp, distP > 10 ? 1.6 : 1);
    else { m.moving = false; face(m, dxp, dzp); }
    if (!d.greeted && distP < 8) { d.greeted = true; g.ui.toast('🐕 El Cadejos blanco anda con usted esta noche', 2400); }
    return true;
  },
  onHurt(m, g) { g.ui.toast('El Cadejos blanco anda de su lado… no le pegue', 1600); return false; },
};

// ---------- la Segua ----------
const SEGUA = {
  name: 'La Segua', w: 0.7, h: 1.9, health: 70, speed: 2.4, legend: true, boss: true, xp: 50,
  hurtSound: 'relincho', idleSound: null, particle: [[0.9, 0.9, 0.85], [0.1, 0.1, 0.1]], drops: [[372, 1, 1]],
  build() { return armarSegua(); },
  brain(m, dt, c) {
    const { g, distP, dxp, dzp } = c;
    const d = m.data, u = m.group.userData;
    if (dawn(g)) { poof(m, g, 'La Segua desapareció en la neblina…'); return true; }
    if (!d.transformed) {
      // parada en el camino, de espaldas, esperando
      m.moving = false;
      m.targetYaw = Math.atan2(-dxp, -dzp);
      // si uno le da la espalda de cerca, se da vuelta igual
      if (distP < 12) { const ld = g.player.lookDir(), l = distP || 1; d.espalda = (ld.x * (-dxp / l) + ld.z * (-dzp / l)) < -0.3 ? (d.espalda || 0) + dt : 0; }
      if (distP < 7 || d.forceTurn || (d.espalda || 0) > 1.4) {
        d.transformed = true;
        g.addEffect('pavor', 3.5);
        if (!g.meta.pavorAviso) { g.meta.pavorAviso = true; g.ui.toast('😱 ¡Pavor! Se le nubla la vista del susto', 2600); }
        u.woman.visible = false; u.horse.visible = true; u.head = u.horse; if (u.cascos) u.cascos.visible = true;
        g.audio.play('grito', { pos: m.soundPos(), vol: 1 });
        setTimeout(() => g.audio.play('relincho', { pos: m.soundPos(), vol: 1, pitch: 0.8 }), 900);
        g.particles.burst(m.body.pos.x, m.body.pos.y + 1.6, m.body.pos.z, [[0.1, 0.1, 0.1], [0.9, 0.2, 0.1]], 30, 3);
        g.achieve('segua', '¡La Segua!');
      }
      return true;
    }
    m.goTo(m.body.pos.x + dxp, m.body.pos.z + dzp, 2.1);
    if (distP < 1.7 && m.attackCd <= 0 && g.mode === 'survival') {
      atacar(m, g, { dano: 4, causa: 'La Segua le dio alcance', alcance: 1.7, cd: 1.1, alSoltar: () => { if (Math.random() < 0.4) g.audio.play('relincho', { pos: m.soundPos(), vol: 0.8 }); } });
    }
    return true;
  },
  animate(m, dt, u) {
    const sw = Math.sin(m.walk) * m.walkAmt;
    u.arms.forEach((a, i) => { a.rotation.x = m.data.transformed ? -1.3 + Math.sin(m.t * 9 + i) * 0.3 : (i ? sw : -sw) * 0.3; });
    u.body.position.y = m.data.transformed ? Math.abs(Math.sin(m.walk)) * 0.12 : 0;
    // transformada: le sale humo del hocico y resopla
    if (m.data.transformed && Math.random() < dt * 8) { const b = m.body.pos; m.game.particles.spawn(b.x + Math.sin(m.yaw) * 0.6, b.y + 1.7, b.z + Math.cos(m.yaw) * 0.6, [0.75, 0.75, 0.78], Math.sin(m.yaw) * 0.6, 0.3, Math.cos(m.yaw) * 0.6, 0.9, 0); }
  },
  onHurt(m) { if (!m.data.transformed) m.data.forceTurn = true; },
  // hablarle es lo peor que se puede hacer
  interact(m) { if (m.data.transformed) return false; m.data.forceTurn = true; return true; },
};

// ---------- el Padre sin Cabeza ----------
const PADRE = {
  name: 'El Padre sin Cabeza', w: 0.6, h: 1.6, health: 100, speed: 0.9, legend: true, ghostly: true, xp: 40,
  hurtSound: 'susurro', idleSound: 'susurro', idleEvery: [8, 16], particle: [[0.05, 0.05, 0.05]], drops: [],
  build() { return armarPadre(); },
  brain(m, dt, c) {
    const { g, distP, dxp, dzp } = c;
    const d = m.data;
    if (dawn(g)) { poof(m, g, null); return true; }
    // la luz lo espanta
    const held = g.inventory.held;
    if (distP < 6 && held && (held.id === K.torch || held.id === K.lamp)) { poof(m, g, 'La luz espantó al Padre sin Cabeza'); return true; }
    if (distP < 10) {
      if (!d.seen) { d.seen = true; g.achieve('padre', 'Vi al Padre sin Cabeza'); g.ui.toast('…un padre sin cabeza camina hacia usted', 2400); }
      g.addEffect('escalofrio', 6);
    }
    // camina despacio hacia uno y da con el báculo: duele poco, pero deja sin aire
    if (distP > 2.2) m.goTo(m.body.pos.x + dxp, m.body.pos.z + dzp, 1); else { m.moving = false; face(m, dxp, dzp); }
    if (distP < 2.6 && m.attackCd <= 0 && g.mode === 'survival') {
      atacar(m, g, { tipo: 'tajo', dano: 3, causa: 'El báculo del Padre sin Cabeza', alcance: 2.6, cd: 1.8, alSoltar: () => { d.baculo = 0.4; }, alGolpe: (llego) => {
        if (!llego) return;
        g.stamina = Math.max(0, (g.stamina ?? 100) - 45); g.staminaT = 2;
        if (!g.meta.padreAviso) { g.meta.padreAviso = true; g.ui.toast('✝ El báculo le sacó el aire. Solo el agua bendita (pulpería) le hace daño', 3600); }
      } });
    }
    return true;
  },
  animate(m, dt, u) {
    m.data.baculo = Math.max(0, (m.data.baculo || 0) - dt);
    u.arms[0].rotation.x = m.data.baculo > 0 ? -1.6 : Math.sin(m.walk) * m.walkAmt * 0.3;
    u.body.position.y = Math.sin(m.t * 1.5) * 0.04 + 0.05; // casi flota
    // humo rojizo que le sale del cuello
    if (Math.random() < dt * 14) { const b = m.body.pos; m.game.particles.spawn(b.x + (Math.random() - 0.5) * 0.2, b.y + 1.62, b.z + (Math.random() - 0.5) * 0.2, [0.45, 0.08, 0.06], (Math.random() - 0.5) * 0.2, 0.7, (Math.random() - 0.5) * 0.2, 1.1, 0, true); }
  },
  onHurt(m, g) {
    if (g.player.effects.bendicion) { if (!m.data.herido) { m.data.herido = true; g.ui.toast('✝ ¡Con el agua bendita sí le entra!', 2000); } return true; }
    g.ui.toast('Los golpes lo atraviesan… pruebe con luz, o con agua bendita', 1800); return false;
  },
  alMorir(m, g) { g.achieve('padre_vencido', 'Descanse en paz, padre'); },
};

// ---------- la Llorona ----------
const LLORONA = {
  name: 'La Llorona', w: 0.6, h: 1.8, health: 60, speed: 1.2, legend: true, boss: true, xp: 60,
  hurtSound: 'susurro', idleSound: null, particle: [[0.9, 0.95, 1], [0.6, 0.7, 0.8]], drops: [[373, 1, 1]],
  build() { return armarLlorona(); },
  brain(m, dt, c) {
    const { g, distP, dxp, dzp } = c;
    // b es la POSICIÓN (antes se leía b.x del cuerpo físico, que no existe: daba NaN y la Llorona quedaba invisible y quieta)
    const d = m.data, b = m.body.pos;
    m.noGravity = true;
    if (dawn(g)) { poof(m, g, 'El llanto se apagó con el amanecer'); return true; }
    g.audio.setEmitter(`llorona${d.id || (d.id = Math.random())}`, 'loop.llanto', m.soundPos(), 0.9);
    // flota sobre el agua o el suelo
    let gy = Math.floor(b.y);
    while (gy > 1 && !SOLID[g.world.getBlock(Math.floor(b.x), gy, Math.floor(b.z))] && !FLUID[g.world.getBlock(Math.floor(b.x), gy, Math.floor(b.z))]) gy--;
    m.body.vel.y = ((gy + 1.6 + Math.sin(m.t * 1.3) * 0.25) - b.y) * 2;
    // se va acercando desde lejos (y llora más fuerte), despacito al final
    if (distP < 34) m.goTo(b.x + dxp, b.z + dzp, distP < 5 ? 0.6 : distP > 18 ? 1.4 : 1); else m.moving = false;
    // de cerca lo va jalando hacia el agua, y adentro lo hunde
    if (distP < 5 && g.mode === 'survival') {
      const pb = g.player.body, pp = pb.pos;
      if (pb.inWater && distP < 3) { pb.vel.y = Math.min(pb.vel.y, -1.5); if (!d.hunde) { d.hunde = true; g.ui.toast('🌊 ¡Lo está hundiendo! Salga del agua y aléjese de ella', 2600); } }
      else {
        d.aguaT = (d.aguaT || 0) - dt;
        if (d.aguaT <= 0) { d.aguaT = 1.5; d.agua = null; for (let r = 1; r < 9 && !d.agua; r++) for (let k = 0; k < 8 && !d.agua; k++) { const ax = Math.floor(pp.x + Math.cos(k * 0.785) * r), az = Math.floor(pp.z + Math.sin(k * 0.785) * r); for (let ay = Math.floor(pp.y) - 2; ay <= Math.floor(pp.y); ay++) if (FLUID[g.world.getBlock(ax, ay, az)] === 1) { d.agua = { x: ax + 0.5, z: az + 0.5 }; break; } } }
        if (d.agua) { const lx = d.agua.x - pp.x, lz = d.agua.z - pp.z, ll = Math.hypot(lx, lz) || 1; pb.vel.x += (lx / ll) * 9 * dt; pb.vel.z += (lz / ll) * 9 * dt; if (!d.jala) { d.jala = true; g.ui.toast('😢 Algo lo jala hacia el agua…', 2200); } }
      }
    }
    if (distP < 6) {
      g.addEffect('miedo', 4);
      d.drain = (d.drain || 0) - dt;
      if (d.drain <= 0 && g.mode === 'survival') { d.drain = 2.2; g.damagePlayer(1, null, null, 'La Llorona se lo llevó', true); }
      if (!d.said) { d.said = true; g.ui.toast('«¡Ay, mis hijos!»', 2200); g.achieve('llorona', 'Escuché a la Llorona'); }
    }
    // forma completa: con media vida grita y tira lágrimas; con poca vida aparece y desaparece alrededor
    const fase = m.health < m.kind.health * 0.25 ? 3 : m.health < m.kind.health * 0.5 ? 2 : 1;
    if (fase >= 2 && distP < 26 && g.mode === 'survival') {
      if (!d.fase2) { d.fase2 = true; g.ui.toast('😱 ¡La Llorona se enfureció!', 2200); g.shake = Math.max(g.shake || 0, 0.7); }
      d.grito = (d.grito ?? 3) - dt;
      if (d.grito <= 0) {
        d.grito = fase === 3 ? 6 : 9;
        g.audio.play('grito', { pos: m.soundPos(), vol: 1.3, pitch: 0.75 });
        g.shake = Math.max(g.shake || 0, 0.8);
        if (distP < 14) { g.addEffect('mareo', 3); g.addEffect('miedo', 5); const pb = g.player.body, l = distP || 1; pb.vel.x -= (dxp / l) * 8; pb.vel.z -= (dzp / l) * 8; pb.vel.y = 4; }
      }
      // lágrimas: un chorrito de gotas que viaja hasta el jugador
      d.lagrima = (d.lagrima ?? 2) - dt;
      if (d.lagrima <= 0 && distP > 3) {
        d.lagrima = fase === 3 ? 1.6 : 2.6;
        const pl = g.player.body.pos;
        for (let k = 0; k <= 10; k++) { const t = k / 10; g.particles.spawn(b.x + (pl.x - b.x) * t, b.y + 1.4 + (pl.y + 1.4 - b.y - 1.4) * t, b.z + (pl.z - b.z) * t, [0.6, 0.8, 1], 0, -0.3, 0, 0.7, 0, true); }
        if (Math.random() < 0.6) g.damagePlayer(2, b.x, b.z, 'Las lágrimas de la Llorona', true);
      }
    }
    if (fase === 3) {
      d.salto = (d.salto ?? 4) - dt;
      if (d.salto <= 0) {
        d.salto = 5;
        const pl = g.player.body.pos, a = Math.random() * Math.PI * 2;
        g.particles.burst(b.x, b.y + 1, b.z, [[0.85, 0.92, 1], [0.6, 0.7, 0.9]], 20, 2);
        b.x = pl.x + Math.cos(a) * 5; b.z = pl.z + Math.sin(a) * 5; b.y = pl.y + 0.5;
        g.particles.burst(b.x, b.y + 1, b.z, [[0.85, 0.92, 1], [0.6, 0.7, 0.9]], 20, 2);
      }
      d.drain = Math.min(d.drain || 0, 1.2);
    }
    return true;
  },
  animate(m, dt, u) {
    u.arms.forEach((a, i) => { a.rotation.x = -1.2 + Math.sin(m.t * 2 + i) * 0.15; });
    u.headRx = 0.3;
    // neblina fría alrededor del vestido
    if (Math.random() < dt * 18) { const b = m.body.pos; m.game.particles.spawn(b.x + (Math.random() - 0.5) * 1.2, b.y + Math.random() * 1.6, b.z + (Math.random() - 0.5) * 1.2, [0.85, 0.92, 1], (Math.random() - 0.5) * 0.3, 0.25, (Math.random() - 0.5) * 0.3, 1.2, 0, true); }
  },
  onRemove(m, g) { g.audio.setEmitter(`llorona${m.data.id}`, null, null); },
};


// ---------- la Carreta sin Bueyes: una carreta pintada que rueda sola por la noche, arrastrando cadenas ----------
const CARRETA = {
  name: 'La Carreta sin Bueyes', w: 1.6, h: 1.8, health: 999, speed: 0, legend: true, xp: 0, hostile: true,
  hurtSound: 'creak', idleSound: null, particle: [[0.6, 0.85, 1], [0.9, 0.9, 1]], drops: [],
  build() { return armarCarreta(); },
  brain(m, dt, c) {
    const { g, distP, dxp, dzp } = c;
    const d = m.data, b = m.body.pos;
    m.noGravity = true;
    if (dawn(g)) { poof(m, g, 'La carreta se perdió en la neblina del amanecer'); return true; }
    // pasa en línea recta hacia donde estaba uno; al rato da la vuelta y vuelve a pasar (tres pasadas y se va)
    if (!d.dir || d.left <= 0) {
      d.passes = (d.passes || 0) + 1;
      if (d.passes > 3) { poof(m, g, 'El chirrido de las cadenas se alejó…'); return true; }
      const l = Math.hypot(dxp, dzp) || 1;
      d.dir = { x: dxp / l, z: dzp / l }; d.left = distP + 14;
      m.yaw = Math.atan2(d.dir.x, d.dir.z); m.targetYaw = m.yaw;
      g.audio.play('cadenas', { pos: m.soundPos(), vol: 1, pitch: 0.8 });
    }
    const sp = 6.5;
    b.x += d.dir.x * sp * dt; b.z += d.dir.z * sp * dt; d.left -= sp * dt;
    // sigue el suelo
    let gy = Math.floor(b.y) + 2;
    while (gy > 1 && !SOLID[g.world.getBlock(Math.floor(b.x), gy, Math.floor(b.z))]) gy--;
    b.y += ((gy + 1) - b.y) * Math.min(1, dt * 8);
    m.body.vel.x = m.body.vel.y = m.body.vel.z = 0;
    m.data.spin = (m.data.spin || 0) + sp * dt * 1.6;
    if ((d.chainT = (d.chainT || 0) - dt) <= 0) { d.chainT = 1.6; g.audio.play(Math.random() < 0.5 ? 'cadenas' : 'creak', { pos: m.soundPos(), vol: 0.9, pitch: 0.7 }); }
    // si lo agarra, lo tira lejos
    if (distP < 1.6 && Math.abs(g.player.body.pos.y - b.y) < 2 && (d.hitCd = (d.hitCd || 0) - dt) <= 0) {
      d.hitCd = 1.2;
      g.damagePlayer(4, b.x - d.dir.x, b.z - d.dir.z, 'Lo atropelló la Carreta sin Bueyes', false, true);
      g.player.body.vel.x += d.dir.x * 9; g.player.body.vel.z += d.dir.z * 9;
    }
    if (distP < 14 && !d.said) { d.said = true; g.ui.toast('😱 ¡Viene una carreta sola, sin bueyes! ¡Quítese del camino!', 2600); g.achieve('carreta_sin_bueyes', 'La carreta pasó sola'); }
    return true;
  },
  animate(m, dt, u) {
    u.ruedas.forEach((w) => { w.rotation.x = m.data.spin || 0; });
    u.body.rotation.z = Math.sin(m.t * 6) * 0.03;
    if (Math.random() < dt * 20) { const b = m.body.pos; m.game.particles.spawn(b.x + (Math.random() - 0.5) * 1.4, b.y + Math.random() * 1.4, b.z + (Math.random() - 0.5) * 1.4, [0.7, 0.85, 1], 0, 0.3, 0, 0.9, 0, true); }
  },
  onHurt(m, g) { g.ui.toast('Los golpes no le hacen nada… mejor quítese del camino', 1800); return false; },
};

// ---------- el Duende: chiquitico, de gorro rojo; se le arrima a uno, le roba algo y sale corriendo ----------
const DUENDE = {
  name: 'El Duende', w: 0.45, h: 0.8, health: 10, speed: 3.6, legend: true, xp: 15,
  hurtSound: 'susurro', idleSound: null, particle: [[0.3, 0.6, 0.2], [0.8, 0.2, 0.2]], drops: [],
  build() { return armarDuende(); },
  brain(m, dt, c) {
    const { g, distP, dxp, dzp } = c;
    const d = m.data, b = m.body.pos;
    if (dawn(g) || (d.born = d.born ?? g.clock) < g.clock - 120) {
      if (d.botin) g.ui.toast(`🧙 El Duende se fue con su ${d.botin.name}…`, 2600);
      poof(m, g, null); return true;
    }
    m.group.userData.saco.scale.setScalar(d.botin ? 1.4 : 0.6);
    // con el botín: sale corriendo y se ríe
    if (d.botin) {
      m.goTo(b.x - dxp * 3, b.z - dzp * 3, 1.9);
      if (m.body.onGround && Math.random() < dt * 1.5) m.body.vel.y = 6;
      if ((d.laughT = (d.laughT || 0) - dt) <= 0) { d.laughT = 2.5; g.audio.play('susurro', { pos: m.soundPos(), vol: 0.8, pitch: 1.9 }); }
      return true;
    }
    // con un gato cerca, no se atreve
    if ((d.asustado = Math.max(0, (d.asustado || 0) - dt)) > 0) { m.goTo(b.x - dxp * 3, b.z - dzp * 3, 1.6); return true; }
    // se arrima por detrás y roba
    m.goTo(g.player.body.pos.x, g.player.body.pos.z, distP < 6 ? 1.2 : 1.6);
    if (distP < 1.3 && g.mode === 'survival') {
      const inv = g.inventory;
      const llenos = inv.slots.map((s, i) => [s, i]).filter(([s, i]) => s && i !== inv.selected && !esUnico(s.id));
      if (llenos.length) {
        const [s, i] = llenos[Math.floor(Math.random() * llenos.length)];
        d.botin = { id: s.id, count: s.count, dur: s.dur, extra: extras(s), name: itemNameOf(s.id) };
        inv.slots[i] = null; inv.changed();
        g.ui.toast(`🧙 ¡El Duende le robó ${s.count > 1 ? s.count + ' × ' : ''}${d.botin.name}! Péguele para que lo suelte`, 3200);
        g.audio.play('susurro', { pos: m.soundPos(), vol: 1, pitch: 2 });
        g.achieve('duende', 'Me robó el Duende');
      }
    }
    return true;
  },
  onHurt(m, g) {
    const d = m.data;
    if (d.botin) {
      const b = m.body.pos;
      g.entities.dropItem(d.botin.id, d.botin.count, b.x, b.y + 0.6, b.z, undefined, 0.3, d.botin.dur, d.botin.extra);
      g.ui.toast('¡Soltó lo que se había robado!', 1800);
      d.botin = null;
    }
    return true;
  },
  animate(m, dt, u) { u.arms.forEach((a, i) => { a.rotation.x = Math.sin(m.walk + i * 3) * m.walkAmt * 1.2; }); },
};

// ---------- la Mona: la bruja de Guanacaste que se vuelve un mono grande; brinca alto y cae encima ----------
const MONA = {
  name: 'La Mona', w: 0.8, h: 1.6, health: 70, speed: 2.8, legend: true, boss: true, hostile: true, attack: 4, xp: 45,
  hurtSound: 'mono', idleSound: 'mono', idleEvery: [5, 9], particle: [[0.2, 0.18, 0.16], [0.9, 0.8, 0.3]], drops: [[377, 1, 3]],
  build() { return armarMona(); },
  brain(m, dt, c) {
    const { g, distP, dxp, dzp } = c;
    const d = m.data, b = m.body.pos;
    if (dawn(g)) { poof(m, g, 'La Mona volvió a ser señora al amanecer… nadie sabe quién es'); return true; }
    if (!d.said && distP < 20) { d.said = true; g.ui.toast('🐒 ¡La Mona! La bruja que se vuelve mono… ¡cuidado que brinca!', 2800); }
    face(m, dxp, dzp);
    // aturdida (parry): queda sentada un rato
    if ((m.stunT || 0) > 0) { m.moving = false; return true; }
    // el brinco: se agacha (amago), salta alto y cae encima
    if (d.jump) {
      d.jump -= dt;
      if (m.body.onGround && d.jump < 0.9) {
        d.jump = 0; apagarAviso(d.aviso); d.aviso = null;
        g.particles.burst(b.x, b.y + 0.2, b.z, [[0.5, 0.4, 0.3], [0.3, 0.25, 0.2]], 20, 2.5);
        g.audio.play('explode', { pos: m.soundPos(), vol: 0.5, pitch: 1.4 });
        g.shake = Math.max(g.shake || 0, 0.3);
        if (distP < 2.6) g.damagePlayer(5, b.x, b.z, 'La Mona le cayó encima', false, true);
      }
      return true;
    }
    if (distP > 4 && distP < 14 && g.clock > (d.jumpCd || 0) && m.body.onGround) {
      d.jumpCd = g.clock + 4 + Math.random() * 2;
      d.prep = 0.5; d.tx = g.player.body.pos.x; d.tz = g.player.body.pos.z; // el brinco va a este punto, no a donde ande uno al soltar
      d.aviso = avisoCaida(g, d.tx, g.player.body.pos.y, d.tz, 2.6, 0.5 + 1.8, m);
      return true;
    }
    if (d.prep) {
      d.prep -= dt;
      if (d.prep <= 0) {
        d.prep = 0; d.jump = 1.6;
        const tx = d.tx - b.x, tz = d.tz - b.z, l = Math.hypot(tx, tz) || 1, T = 1.1;
        m.body.vel.x = (tx / l) * Math.min(l, 12) / T; m.body.vel.z = (tz / l) * Math.min(l, 12) / T; m.body.vel.y = 11;
        g.audio.play('mono', { pos: m.soundPos(), vol: 1, pitch: 1.3 });
      }
      return true;
    }
    return false;
  },
  animate(m, dt, u) {
    const air = !m.body.onGround;
    u.arms.forEach((a, i) => { a.rotation.x = air ? -2.6 : -0.3 + Math.sin(m.walk + i * 3) * m.walkAmt; a.rotation.z = (i ? -1 : 1) * (air ? 0.4 : 0.1); });
    u.body.rotation.x = m.data.prep ? 0.5 : 0;
  },
};

// ---------- el Viejo del Monte: guardián del bosque; sale cuando uno caza demasiados animales del monte ----------
const VIEJO_MONTE = {
  name: 'El Viejo del Monte', w: 1.2, h: 2.6, health: 130, speed: 1.6, legend: true, boss: true, hostile: true, attack: 6, xp: 70,
  hurtSound: 'creak', idleSound: 'rumble', idleEvery: [6, 12], particle: [[0.25, 0.45, 0.15], [0.45, 0.32, 0.18]], drops: [[424, 1, 1], [277, 2, 4]],
  build() { return armarViejoMonte(); },
  brain(m, dt, c) {
    const { g, distP } = c;
    const d = m.data;
    if (!d.said) { d.said = true; g.ui.toast('🌳 «¿Quién anda matando a mis animales?» — El Viejo del Monte despertó', 3400); g.audio.play('rumble', { vol: 0.9 }); g.shake = Math.max(g.shake || 0, 0.8); }
    // bejucos: si uno está a media distancia, lo enreda (lo frena) un rato
    if (distP > 3.5 && distP < 14 && g.clock > (d.vineCd || 0) && g.mode === 'survival') {
      d.vineCd = g.clock + 7;
      g.addEffect('enredado', 3);
      const p = g.player.body.pos;
      for (let i = 0; i < 25; i++) g.particles.spawn(p.x + (Math.random() - 0.5) * 1.2, p.y + Math.random() * 1.6, p.z + (Math.random() - 0.5) * 1.2, [0.2, 0.5, 0.15], 0, -0.4, 0, 0.9, 0);
      g.ui.toast('🌿 ¡Los bejucos lo agarraron de los pies!', 1600);
      g.audio.play('creak', { pos: p, vol: 0.9, pitch: 0.6 });
    }
    return false;
  },
  animate(m, dt) {
    if (Math.random() < dt * 6) { const b = m.body.pos; m.game.particles.spawn(b.x + (Math.random() - 0.5), b.y + 1 + Math.random() * 1.5, b.z + (Math.random() - 0.5), [0.35, 0.55, 0.2], 0, -0.6, 0, 1.2, 1.5); }
  },
};

export const LEYENDAS = { viejo_monte: VIEJO_MONTE, cadejos: CADEJOS, cadejos_blanco: CADEJOS_BLANCO, segua: SEGUA, padre: PADRE, llorona: LLORONA, carreta_sin_bueyes: CARRETA, duende: DUENDE, mona: MONA };

// ---------- aparición ----------
export function legendSpawn(E, g) {
  if (g.mode !== 'survival' || !g.settings.hostiles || !difOf(g).hostiles || g.daylight > 0.25) return false;
  if ((g.day || 1) < 4) return false; // las primeras noches ya tienen bastante con las Sombras (el Cadejos mataba al novato la primera noche)
  // en luna llena (cada 7 días) las leyendas salen el doble de seguido
  g.legendCd = (g.legendCd ?? 60) - ((g.day || 1) % 7 === 0 ? 4 : 2) - (g.meta.hist && g.meta.hist.cap === 3 ? 6 : 0); // el capítulo que las pide: no hacerlo esperar
  if (g.legendCd > 0) return false;
  // el Padre, el Cadejos blanco y la Carreta no se pelean: no ocupan el cupo de la que sí cuenta para la historia
  if (E.mobs.some((m) => m.kind.legend && !m.dead && !['padre', 'cadejos_blanco', 'carreta_sin_bueyes', 'sirena', 'bruja_zarate'].includes(m.type))) return false;
  if (Math.random() > 0.35) return false;
  const w = g.world, pl = g.player.body.pos;
  const nearVillage = (g.envPueblo || 0) > 0.3;
  const water = g.env && g.env.water > 0.25;
  const rep = g.meta.reputation || 0;
  let type;
  const col = w.gen.column(Math.floor(pl.x), Math.floor(pl.z));
  const enCalle = [K.asfalto, K.asfalto_linea, K.asfalto_parche, K.asfalto_roto, K.gravel].includes(w.getBlock(Math.floor(pl.x), Math.floor(pl.y - 0.5), Math.floor(pl.z)));
  const r = Math.random();
  if (enCalle && r < 0.45) type = 'carreta_sin_bueyes';
  else if (nearVillage) type = r < 0.33 ? 'padre' : r < 0.66 ? 'segua' : 'mona';
  else if (water) type = Math.random() < 0.45 ? 'tulevieja' : 'llorona';
  else if (rep >= 3 && Math.random() < 0.5) type = 'cadejos_blanco';
  else if (['forest', 'jungle', 'nuboso'].includes(col.biome) && r < 0.35) type = 'duende';
  else if (col.biome === 'bosque_seco' && r < 0.4) type = 'mona';
  else type = Math.random() < 0.6 ? 'cadejos' : 'segua';
  if (E.mobs.some((m) => m.type === type && !m.dead)) return false;
  const near = type === 'cadejos_blanco' || type === 'padre' || type === 'duende';
  for (let tries = 0; tries < 12; tries++) {
    const a = Math.random() * Math.PI * 2, r = near ? 10 + Math.random() * 8 : 18 + Math.random() * 12;
    const x = Math.floor(pl.x + Math.cos(a) * r), z = Math.floor(pl.z + Math.sin(a) * r);
    if (!w.isLoaded(x, z)) continue;
    let y = 120;
    while (y > 1 && !SOLID[w.getBlock(x, y, z)] && !(type === 'llorona' && FLUID[w.getBlock(x, y, z)])) y--;
    if (w.getBlock(x, y + 1, z) !== AIR && BLOCKS[w.getBlock(x, y + 1, z)].render !== 'cross' && !FLUID[w.getBlock(x, y + 1, z)]) continue;
    if (Math.abs(y - pl.y) > 12) continue;
    E.spawnMob(type, x + 0.5, y + 1.1, z + 0.5);
    g.legendCd = 150 + Math.random() * 150;
    return true;
  }
  return false;
}
