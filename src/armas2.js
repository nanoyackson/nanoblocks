// Armas de largo alcance nuevas (honda, cerbatana con dardos envenenados y lanza arrojadiza), el veneno en las criaturas
// y los mini-jefes del monte: el Jaguar viejo, el Cocodrilo gigante del Tárcoles y la Terciopelo reina.
import * as THREE from 'three';
import { SOLID, ITEMS, BLOCK_BY_KEY as K } from './blocks.js';
import { FAUNA } from './fauna.js';
import { difOf } from './supervivencia.js';
import { ventaja } from './progreso.js';
import { atacar, avisoCaida, apagarAviso, brilloAmago } from './golpes.js';

export const HONDA = 432, CERBATANA = 433, DARDO = 434, LANZA = 435, COLMILLO = 436, DIENTE = 437, VENENO_REINA = 438, MACHETE_DOBLE = 439; // LANZA es la jabalina (la lanza de hierro 402 es otra)

// arma → munición, si se carga (mantener clic derecho) o dispara de una, velocidad y daño según la carga
export const RANGO = {
  [HONDA]: { ammo: () => K.cobble, nombre: 'piedras (piedra labrada)', vel: [14, 22], dmg: [3, 8], grav: 18, knock: 2.2, sonido: ['arco', 1.6], forma: 'piedra' },
  [CERBATANA]: { ammo: () => DARDO, nombre: 'dardos', instant: true, vel: [30, 30], dmg: [1, 1], grav: 6, veneno: 8, sonido: ['arco', 2.2], forma: 'dardo' },
  [LANZA]: { ammo: () => LANZA, nombre: 'jabalinas', vel: [12, 26], dmg: [4, 13], grav: 14, recoge: LANZA, sonido: ['lanzar', 0.9], forma: 'lanza' },
};
export function tieneMunicion(g, id) { return g.mode !== 'survival' || g.inventory.count(RANGO[id].ammo()) >= (id === LANZA ? 1 : 1); }

const mats = {};
const mat = (c) => mats[c] || (mats[c] = new THREE.MeshBasicMaterial({ color: c }));
function forma(tipo) {
  const g = new THREE.Group();
  const caja = (w, h, d, c, z = 0) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(c)); m.position.z = z; g.add(m); };
  if (tipo === 'piedra') caja(0.16, 0.14, 0.16, 0x8a8a88);
  if (tipo === 'dardo') { caja(0.025, 0.025, 0.3, 0xd8c8a0); caja(0.05, 0.05, 0.06, 0xe8e0d0, -0.14); caja(0.03, 0.03, 0.05, 0x40c040, 0.15); }
  if (tipo === 'lanza') { caja(0.05, 0.05, 1.5, 0x8a5a2a); caja(0.1, 0.03, 0.22, 0xb8b8c0, 0.82); caja(0.07, 0.07, 0.08, 0xd03020, 0.62); }
  return g;
}

class Proyectil {
  constructor(g, x, y, z, v, cfg, dmg) {
    this.g = g; this.pos = { x, y, z }; this.vel = v; this.cfg = cfg; this.dmg = dmg; this.life = 0; this.dead = false; this.stuck = false;
    this.mesh = forma(cfg.forma); g.scene.add(this.mesh); this.orient();
  }
  orient() {
    const v = this.vel, m = this.mesh;
    m.position.set(this.pos.x, this.pos.y, this.pos.z);
    if (this.stuck) return;
    m.rotation.order = 'YXZ';
    m.rotation.y = Math.atan2(v.x, v.z);
    m.rotation.x = -Math.atan2(v.y, Math.hypot(v.x, v.z));
    if (this.cfg.forma === 'piedra') m.rotation.z = this.life * 12;
  }
  update(dt) {
    const g = this.g, p = this.pos, v = this.vel, c = this.cfg;
    this.life += dt;
    if (this.stuck) {
      const pl = g.player.body.pos;
      if (c.recoge && this.life > 0.5 && Math.hypot(pl.x - p.x, pl.y + 0.8 - p.y, pl.z - p.z) < 1.6) { if (g.mode === 'survival') g.inventory.add(c.recoge, 1); g.audio.pickup(); this.dead = true; }
      if (this.life > 90) this.dead = true;
      return;
    }
    const steps = Math.max(1, Math.ceil(Math.hypot(v.x, v.y, v.z) * dt / 0.25)), h = dt / steps;
    for (let s = 0; s < steps; s++) {
      v.y -= c.grav * h;
      p.x += v.x * h; p.y += v.y * h; p.z += v.z * h;
      for (const m of g.entities.mobs) {
        if (m.dying || m.kind.boat || m.kind.ghostly || m.kind.vehicle) continue;
        const b = m.body.pos, hw = m.kind.w / 2 + 0.15;
        if (p.x > b.x - hw && p.x < b.x + hw && p.z > b.z - hw && p.z < b.z + hw && p.y > b.y && p.y < b.y + m.kind.h + 0.1) {
          g.golpeando = m; try { m.hurt(Math.max(1, Math.round(this.dmg)) * g.damageBonus() * ventaja.tiro(g), p.x - v.x, p.z - v.z); } finally { g.golpeando = null; }
          if (c.knock) { const l = Math.hypot(v.x, v.z) || 1; m.body.vel.x += (v.x / l) * c.knock; m.body.vel.z += (v.z / l) * c.knock; }
          if (c.veneno && !m.dying) { m.data.veneno = Math.max(m.data.veneno || 0, c.veneno); }
          if (m.dying) g.killedMob(m);
          g.audio.play('flecha', { pos: p, vol: 0.6, pitch: c.forma === 'piedra' ? 0.7 : 1 });
          if (c.recoge && g.mode === 'survival') g.entities.dropItem(c.recoge, 1, p.x, p.y, p.z);
          this.dead = true; return;
        }
      }
      if (g.world.solidoEn(p.x, p.y, p.z)) {
        p.x -= v.x * h * 0.6; p.y -= v.y * h * 0.6; p.z -= v.z * h * 0.6;
        g.audio.play(c.forma === 'piedra' ? 'step.stone' : 'flecha', { pos: p, vol: 0.5 });
        g.particles.burst(p.x, p.y, p.z, [[0.6, 0.55, 0.5]], 4, 1);
        if (c.recoge) { this.stuck = true; this.life = 0; this.orient(); } else this.dead = true;
        return;
      }
    }
    if (p.y < -10 || this.life > 10) this.dead = true;
    this.orient();
  }
  remove() { this.g.scene.remove(this.mesh); this.mesh.children.forEach((ch) => ch.geometry.dispose()); }
}

// disparar con la carga c (0..1)
export function disparar(g, id, c) {
  const cfg = RANGO[id];
  if (!cfg) return;
  if (g.mode === 'survival') {
    if (g.inventory.count(cfg.ammo()) < 1) { g.ui.toast(`No tiene ${cfg.nombre}`, 1200); return; }
    g.inventory.remove(cfg.ammo(), 1);
  }
  const { e, d } = g.eyeAndDir();
  const sp = cfg.vel[0] + (cfg.vel[1] - cfg.vel[0]) * c;
  (g.proyectiles ||= []).push(new Proyectil(g, e.x + d.x * 0.5, e.y + d.y * 0.5 - 0.1, e.z + d.z * 0.5, { x: d.x * sp, y: d.y * sp, z: d.z * sp }, cfg, cfg.dmg[0] + (cfg.dmg[1] - cfg.dmg[0]) * c));
  g.audio.play(cfg.sonido[0], { vol: 0.55, pitch: cfg.sonido[1], vary: 0.08 });
  g.swing = 1;
  if (g.mode === 'survival' && id !== LANZA && g.inventory.wearHeld()) { g.audio.play('toolbreak'); g.ui.toast('¡Se rompió!'); }
  if (id === CERBATANA) g.achieve('cerbatana', 'Caza en silencio');
  if (id === HONDA) g.achieve('honda', 'David con honda');
}

// cada cuadro: proyectiles y el veneno en las criaturas
export function tickArmas(g, dt) {
  if (g.proyectiles) g.proyectiles = g.proyectiles.filter((a) => { a.update(dt); if (a.dead) { a.remove(); return false; } return true; });
  g.venT = (g.venT || 0) - dt;
  if (g.venT > 0) return;
  g.venT = 1;
  for (const m of g.entities.mobs) {
    if ((m.data.fuegoT || 0) > (g.clock || 0) && !m.dying) for (let k = 0; k < 2; k++) g.particles.spawn(m.body.pos.x + (Math.random() - 0.5) * m.kind.w, m.body.pos.y + Math.random() * m.kind.h, m.body.pos.z + (Math.random() - 0.5) * m.kind.w, Math.random() < 0.5 ? [1, 0.55, 0.12] : [1, 0.85, 0.3], 0, 1.2, 0, 0.5, -1, true);
    if (!m.data.veneno || m.dying) continue;
    m.data.veneno -= 1;
    m.hurt(1, m.body.pos.x, m.body.pos.z);
    g.particles.burst(m.body.pos.x, m.body.pos.y + m.kind.h * 0.7, m.body.pos.z, [[0.3, 0.9, 0.25], [0.6, 1, 0.3]], 5, 0.6);
    if (m.dying) g.killedMob(m);
  }
}
export function limpiarArmas(g) { for (const a of g.proyectiles || []) a.remove(); g.proyectiles = []; }

// ---------- mini-jefes ----------
function grande(base, escala, extra) {
  return {
    ...base, ...extra, boss: true, mini: true,
    w: base.w * escala * 0.85, h: base.h * escala,
    build() {
      const m = base.build();
      m.userData.babyScale = escala;
      // cicatrices y un aire de viejo: oscurece un poco los colores
      m.traverse((o) => {
        if (!o.material || !o.material.color || o.userData.glow) return;
        o.material = o.material.clone();
        o.material.color.multiplyScalar(extra.tono || 0.8);
      });
      return m;
    },
  };
}
// el golpe de las minijefas pasa por atacar() (golpes.js): se prepara, brilla y se puede parar. alGolpe corre solo si conectó
const ataca = (m, c, dano, causa, alcance = 1.9, alGolpe = null) => {
  const { g, distP, pl } = c;
  if (distP < alcance && Math.abs(pl.y - m.body.pos.y) < 2 && m.attackCd <= 0 && g.player.alive) atacar(m, g, { dano, causa, alcance, cd: 1.3, tipo: 'mordida', alGolpe: (llego) => { if (llego && alGolpe) alGolpe(); } });
};

export const MINIJEFES = {
  jaguar_viejo: grande(FAUNA.jaguar, 1.6, {
    name: 'El Jaguar viejo', health: 90, speed: 3.6, drops: [[COLMILLO, 1, 1], [271, 2, 4]], tono: 0.7,
    brain(m, dt, c) {
      const { g, distP, dxp, dzp } = c;
      m.data.angry = distP < 26;
      if (!m.data.angry || !g.player.alive || g.mode !== 'survival') return false;
      m.targetYaw = Math.atan2(dxp, dzp);
      m.data.pounceCd = Math.max(0, (m.data.pounceCd || 0) - dt);
      m.data.rugido = (m.data.rugido ?? 4) - dt;
      if (m.data.rugido <= 0) { m.data.rugido = 12; g.audio.play('jaguar', { pos: m.soundPos(), vol: 1.2, pitch: 0.7 }); if (distP < 14) { g.addEffect('miedo', 3); g.shake = Math.max(g.shake || 0, 0.4); } }
      // el brinco, como el del puma (v11.7): se agazapa 0.45 s con el círculo rojo donde está uno y brinca a ese punto; quien se sale, se salva
      const S = m.data.salto, b = m.body;
      if (S && S.fase === 'agazapa') {
        // si lo aturdieron a media preparación el anillo ya se fue: se vuelve a marcar desde cero (si no, brincaba sin aviso)
        if (S.aviso && S.aviso.t >= S.aviso.dur) Object.assign(S, { t: 0.45, tx: c.pl.x, tz: c.pl.z, aviso: avisoCaida(g, c.pl.x, c.pl.y, c.pl.z, 1.8, 0.45 + 0.9, m) });
        S.t -= dt; m.moving = false; m.data.crouch = true;
        const tx = S.tx - b.pos.x, tz = S.tz - b.pos.z, l = Math.hypot(tx, tz) || 1;
        m.targetYaw = Math.atan2(tx, tz);
        if (S.t <= 0) { const v = Math.min(11, l / 0.5); b.vel.x = (tx / l) * v; b.vel.z = (tz / l) * v; b.vel.y = 7; b.onGround = false; m.data.salto = { fase: 'vuelo', t: 0.9, aviso: S.aviso }; g.audio.play('jaguar', { pos: m.soundPos(), vol: 1, pitch: 1.1 }); }
        return true;
      }
      if (S && S.fase === 'vuelo') {
        S.t -= dt; m.moving = false;
        if (S.t <= 0 || (b.onGround && S.t < 0.6)) { apagarAviso(S.aviso); m.data.salto = null; m.data.pounceCd = 2.4; }
        return true;
      }
      m.data.crouch = distP > 6;
      if (distP > 6) { m.moving = true; m.speedMul = 0.7; }
      else if (m.data.pounceCd <= 0 && b.onGround && distP > 2.5) {
        m.data.salto = { fase: 'agazapa', t: 0.45, tx: c.pl.x, tz: c.pl.z, aviso: avisoCaida(g, c.pl.x, c.pl.y, c.pl.z, 1.8, 0.45 + 0.9, m) };
        g.audio.play('gato.bufido', { pos: m.soundPos(), vol: 0.8, pitch: 0.6 });
        return true;
      } else { m.moving = distP > 1.2; m.speedMul = 1.4; }
      ataca(m, c, 7, 'El Jaguar viejo lo cazó', 2.4); // 9 lo dejaba con la vida en 0.5 aun con hierro y cuero (BALANCE.md, 11-nov)
      return true;
    },
  }),
  cocodrilo_gigante: grande(FAUNA.cocodrilo, 2.1, {
    name: 'El Cocodrilo gigante del Tárcoles', health: 130, drops: [[DIENTE, 1, 1], [271, 3, 5], [262, 2, 4]], tono: 0.75,
    brain(m, dt, c) {
      const { g, distP } = c;
      m.data.angry = distP < 20 && g.player.alive && g.mode === 'survival';
      // v12.8.6 (decimoctava revisión, punto 1): esta es la mordida que de verdad pega (alcance 2.8; la de FAUNA casi nunca arranca).
      // El brillo dorado al empezar el amago, con candado (antes salía en cada cuadro), y la vuelta de la muerte ya no arrastra al
      // instante: arranca el aviso de 1 s (preGiro, en FAUNA.cocodrilo) y, si sigue en el anillo, gira
      if (m.data.angry && distP < 2.8 && !m.atk && m.attackCd <= 0 && !(m.data.brilloT > m.t)) { brilloAmago(m, g); m.data.brilloT = m.t + 1.2; }
      if (m.data.angry) ataca(m, c, 10, 'El cocodrilo del Tárcoles se lo llevó', 2.8, () => {
        g.audio.play('cocodrilo', { pos: m.soundPos(), vol: 1.2, pitch: 0.8 });
        if (g.player.body.inWater && !m.data.giro && !(m.data.preGiro > 0) && Math.random() < 0.5) { m.data.preGiro = 1.0; g.ui.toast('🐊 ¡Va a dar la vuelta de la muerte! Salga del anillo', 1800); }
        m.data.snap = 0.4;
      });
      return FAUNA.cocodrilo.brain(m, dt, c);
    },
  }),
  terciopelo_reina: grande(FAUNA.terciopelo, 2.6, {
    name: 'La Terciopelo reina', health: 55, speed: 2, drops: [[VENENO_REINA, 1, 2]], tono: 0.85,
    brain(m, dt, c) {
      const { g, distP, dxp, dzp, pl } = c;
      m.data.angry = distP < 18 && g.player.alive && g.mode === 'survival';
      if (!m.data.angry) return false;
      m.targetYaw = Math.atan2(dxp, dzp);
      m.data.escupe = (m.data.escupe ?? 2) - dt;
      // escupe veneno de lejos
      if (distP > 3 && distP < 10 && m.data.escupe <= 0) {
        m.data.escupe = 3;
        g.audio.play('serpiente', { pos: m.soundPos(), vol: 1.1, pitch: 0.8 });
        const b = m.body.pos;
        for (let i = 0; i <= 8; i++) { const k = i / 8; g.particles.spawn(b.x + dxp * k, b.y + 0.4 + (pl.y + 1.4 - b.y - 0.4) * k + Math.sin(k * Math.PI) * 0.8, b.z + dzp * k, [0.4, 0.95, 0.25], 0, 0.2, 0, 0.6, 0); }
        m.data.charco = { x: pl.x, y: pl.y, z: pl.z, t: 0.5 }; avisoCaida(g, pl.x, pl.y, pl.z, 1.4, 0.5, m); // v12.8.1 (fase 2): aviso de 0.5 s, el veneno cae ahí
      }
      if (m.data.charco) { const C = m.data.charco; C.t -= dt; if (C.t <= 0) { m.data.charco = null; g.particles.burst(C.x, C.y + 0.2, C.z, [[0.4, 0.95, 0.25]], 14, 1.5); if (Math.hypot(pl.x - C.x, pl.z - C.z) < 1.4 && Math.abs(pl.y - C.y) < 1.5 && Math.random() < 0.65) { g.atacante = m; g.damagePlayer(2, C.x, C.z, 'La Terciopelo reina lo escupió', true); g.atacante = null; g.addEffect('veneno', 10); g.addEffect('mareo', 3); } } } // como antes, el 65 % (si no, el torpe perdía)
      // a media vida llama a sus crías
      if (!m.data.llamo && m.health < m.kind.health / 2) {
        m.data.llamo = true;
        for (let i = 0; i < 3; i++) g.entities.spawnMob('terciopelo', m.body.pos.x + (Math.random() - 0.5) * 3, m.body.pos.y + 0.5, m.body.pos.z + (Math.random() - 0.5) * 3);
        g.ui.toast('🐍 ¡La reina llamó a sus crías!', 1800);
      }
      m.moving = distP > 2.2; m.speedMul = distP > 10 ? 1 : 0.6;
      ataca(m, c, 6, 'La Terciopelo reina lo mordió', 2.6, () => { const bota = g.inventory.armor[3]; if (!(bota && ITEMS[bota.id] && ITEMS[bota.id].antiCulebra)) g.addEffect('veneno', 20); m.data.strike = 0.35; });
      return true;
    },
  }),
};

// v12.15.2 (C7): el Guardián de la Colada, un lagarto de fuego en la cámara del magma de los tubos de lava (no sale solo: lo despierta fuego.js)
MINIJEFES.guardian_colada = grande(FAUNA.iguana, 6, {
  name: 'El Guardián de la Colada', health: 150, speed: 3, hostile: true, drops: [[1160, 4, 4], [1162, 2, 2], [1200, 1, 2]], tono: 0.55,
  brain(m, dt, c) {
    const { g, distP, dxp, dzp, pl } = c;
    m.data.angry = distP < 30 && g.player.alive && g.mode === 'survival';
    if (!m.data.angry) return false;
    m.targetYaw = Math.atan2(dxp, dzp);
    // el pisotón de lava: anillo rojo de 0.8 s (se salta), 6 de daño y quema 3 s (el ignifugo y las botas de ceniza lo anulan)
    m.data.pisa = (m.data.pisa ?? 3.5) - dt;
    if (!m.data.piso && distP < 10 && m.data.pisa <= 0) { m.data.pisa = 6; m.data.piso = { t: 0.8, x: pl.x, y: pl.y, z: pl.z }; avisoCaida(g, pl.x, pl.y, pl.z, 2.2, 0.8, m); }
    if (m.data.piso) {
      const P = m.data.piso; P.t -= dt;
      if (P.t <= 0) {
        m.data.piso = null;
        g.particles.burst(P.x, P.y + 0.2, P.z, [[1, 0.4, 0.1], [1, 0.8, 0.2]], 26, 2.4);
        g.audio.play('cocodrilo', { pos: m.soundPos(), vol: 1.1, pitch: 0.4 });
        if (Math.hypot(g.player.body.pos.x - P.x, g.player.body.pos.z - P.z) < 2.2 && Math.abs(g.player.body.pos.y - P.y) < 1.6) {
          g.atacante = m;
          g.damagePlayer(6, P.x, P.z, 'El Guardián de la Colada lo aplastó', false, false);
          const bo = g.inventory.armor[3];
          if (!g.player.effects.ignifugo && !(bo && bo.id === 1168)) { g.quemaN = 3; g.quemaT = 1; g.ui.toast('🔥 ¡Le prendió la lava!', 1600); }
        }
      }
    }
    m.moving = distP > 2.4; m.speedMul = 1;
    ataca(m, c, 8, 'El Guardián de la Colada lo pisoteó', 2.8);
    return true;
  },
});
export const NOMBRES_MINI = { jaguar_viejo: 'Vencí al Jaguar viejo', cocodrilo_gigante: 'Vencí al Cocodrilo del Tárcoles', terciopelo_reina: 'Vencí a la Terciopelo reina', guardian_colada: 'Vencí al Guardián de la Colada' };

// aparecen de vez en cuando, uno a la vez, según dónde ande
export function miniSpawn(E, g) {
  if (g.mode !== 'survival' || !g.settings.hostiles || !difOf(g).hostiles || g.dim !== 'tierra' || (g.day || 1) < 5) return false; // la Terciopelo reina y compañía no son para el novato
  g.miniCd = (g.miniCd ?? 420) - 2;
  if (g.miniCd > 0 || E.mobs.some((m) => m.kind.mini && !m.dead)) return false;
  const w = g.world, pl = g.player.body.pos, col = w.gen.column(Math.floor(pl.x), Math.floor(pl.z));
  const night = g.daylight < 0.35, water = g.env && g.env.water > 0.25;
  let type = null;
  if (water && col.h <= 66) type = 'cocodrilo_gigante';
  else if (['jungle', 'forest', 'manglar'].includes(col.biome) && night) type = 'jaguar_viejo';
  else if (['jungle', 'nuboso'].includes(col.biome)) type = 'terciopelo_reina';
  if (!type || Math.random() > 0.4) { g.miniCd = 30; return false; }
  for (let t = 0; t < 12; t++) {
    const a = Math.random() * Math.PI * 2, r = 16 + Math.random() * 8;
    const x = Math.floor(pl.x + Math.cos(a) * r), z = Math.floor(pl.z + Math.sin(a) * r);
    if (!w.isLoaded(x, z)) continue;
    let y = Math.floor(pl.y) + 8;
    while (y > 1 && !SOLID[w.getBlock(x, y - 1, z)] && !(type === 'cocodrilo_gigante' && w.getBlock(x, y - 1, z) === K.water)) y--;
    E.spawnMob(type, x + 0.5, y + 0.2, z + 0.5);
    g.miniCd = 700 + Math.random() * 500;
    const avisos = { jaguar_viejo: '🐆 Un rugido grave retumba en el monte… el Jaguar viejo anda cazando', cocodrilo_gigante: '🐊 Algo enorme se movió en el agua… dicen que es el del Tárcoles', terciopelo_reina: '🐍 Se oye un siseo largo entre las hojas… la Terciopelo reina' };
    g.ui.toast(avisos[type], 3600);
    return true;
  }
  return false;
}
