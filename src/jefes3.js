// Jefes del monte, segunda y tercera tanda (v5.0). Se llaman con la misma Ofrenda del monte (jefes2.js), de noche en su bioma:
// · El Tata Sapo (manglar): infla el buche (aviso) y saca la lengua en línea recta: si lo agarra, lo jala a la boca, lo mastica y lo
//   escupe envenenado. Se esquiva de lado. Brinca y al caer retumba. A media vida deja charcos de veneno.
// · La Cascabel del Llano (bosque seco de Guanacaste): suena el cascabel antes de tirarse. Se entierra (no se le puede pegar), el
//   polvo avanza bajo tierra hacia uno, sale un círculo de tierra (aviso) y revienta desde abajo. A media vida escupe veneno.
// · El Cangrejo Rey (playa): se encierra en la concha (solo el mazazo fuerte la raja), tira chorros de agua que empujan lejos,
//   corre de lado. A media vida llama cangrejos tenaza.
// · El Ciempiés Rey (montaña, nuboso, páramo y cuevas): da vueltas alrededor de uno y lo encierra en el anillo de su cuerpo; cuando
//   el anillo se cierra (aviso: se le prenden las patas), se tira de frente. A media vida escupe veneno y va más rápido.
// Todos dejan su trofeo y quedan anotados en meta.jefes2.
import { avisoEmbestida, avisoCaida, brilloRojo, anilloAviso, COLOR_AVISO, AZUL_AVISO } from './golpes.js';
import { SOLID } from './blocks.js';
import { pintarBase } from './models.js';
import { armarTata, armarCascabel, armarCangrejoRey, armarCiempiesRey } from './modelos-jefes.js';
import { perfil } from './armas3.js';

const jugando = (g) => g.mode === 'survival' && g.player.alive;
const lejos = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
export function vencido(g, m, clave, nombre) {
  if (m.data.vencido) return;
  m.data.vencido = true;
  const J = (g.meta.jefes2 ||= {});
  const primera = !J[clave];
  J[clave] = g.day || 1;
  g.audio.play('aplausos', { ui: true, vol: 0.5 });
  g.ui.toast(primera ? `🏆 ¡Venció a ${nombre}! Su trofeo sirve para algo nuevo: busque en las recetas` : `🏆 ¡Otra vez ${nombre} al suelo!`, 4600);
  if (Object.keys(J).length >= 2) g.achieve('jefes2_dos', 'Dos jefes del monte');
  if (Object.keys(J).length >= 6 && !g.meta.coronaAviso) { g.meta.coronaAviso = true; g.achieve('jefes2_seis', 'Los seis jefes del monte'); g.ui.toast('👑 Ya cayeron los seis jefes del monte. Con sus trofeos se teje la Corona del monte…', 5200); }
}
const fase2 = (m, g, txt) => { if (m.health < (m.data.vmax || m.kind.health) * 0.5 && !m.data.fase2) { m.data.fase2 = true; g.ui.toast(txt, 3400); g.audio.play('monstruo', { pos: m.soundPos(), vol: 1, pitch: 0.6 }); } return !!m.data.fase2; };
// un chorro o un escupitajo que vuela recto
class Bola {
  constructor(g, x, y, z, v, col, alPegar) { this.g = g; this.pos = { x, y, z }; this.vel = v; this.col = col; this.alPegar = alPegar; this.life = 0; this.dead = false; }
  update(dt) {
    const g = this.g, p = this.pos, v = this.vel;
    this.life += dt; v.y -= 6 * dt;
    p.x += v.x * dt; p.y += v.y * dt; p.z += v.z * dt;
    for (let i = 0; i < 2; i++) g.particles.spawn(p.x, p.y, p.z, this.col, (Math.random() - 0.5) * 0.6, (Math.random() - 0.5) * 0.6, (Math.random() - 0.5) * 0.6, 0.5, 2);
    const pl = g.player.body.pos;
    if (Math.abs(p.x - pl.x) < 0.6 && Math.abs(p.z - pl.z) < 0.6 && p.y > pl.y && p.y < pl.y + 1.9) { this.dead = true; if (jugando(g) && !(g.iframes > 0)) this.alPegar(g, v); return; }
    if (g.world.solidoEn(p.x, p.y, p.z) || this.life > 3.5) this.dead = true;
  }
  remove() {}
}
const tirar = (g, m, pl, vel, col, alPegar) => {
  const b = m.body.pos, sy = b.y + m.kind.h * 0.7, d = lejos(pl, b) || 1, t = d / vel;
  brilloRojo(m, g);
  (g.proy3 ||= []).push(new Bola(g, b.x, sy, b.z, { x: ((pl.x - b.x) / d) * vel, y: (pl.y + 1 - sy) / t + 3 * t, z: ((pl.z - b.z) / d) * vel }, col, alPegar));
};
// el golpe desde el suelo (aterrizaje, pisotón): pega a quien esté en el suelo dentro del radio
function retumbo(g, m, r, dmg, causa) {
  const b = m.body.pos, pl = g.player.body.pos;
  g.shake = Math.max(g.shake || 0, 0.7);
  g.audio.play('dig.stone', { pos: m.soundPos(), vol: 1, pitch: 0.35 });
  for (let k = 0; k < 36; k++) { const a = (k / 36) * Math.PI * 2; g.particles.spawn(b.x + Math.cos(a) * r * 0.5, b.y + 0.2, b.z + Math.sin(a) * r * 0.5, [0.5, 0.42, 0.3], Math.cos(a) * 5, 1, Math.sin(a) * 5, 0.7, 3); }
  if (jugando(g) && lejos(pl, b) < r && g.player.body.onGround && Math.abs(pl.y - b.y) < 1.6) { g.damagePlayer(dmg, b.x, b.z, causa, false, true); g.player.body.vel.y = 6; }
}

// ---------- modelos ----------
// el cuerpo largo sigue el camino de la cabeza (serpientes y ciempiés)
function seguirCabeza(m, u, paso = 3, alto = 0) {
  const R = u.rastro, b = m.body.pos, ya = m.yaw || 0, esc = u.babyScale || 1;
  const hx = b.x, hz = b.z;
  if (!R.length || Math.hypot(R[0].x - hx, R[0].z - hz) > 0.08) R.unshift({ x: hx, z: hz });
  const max = (u.segs.length + 2) * paso + 4;
  if (R.length > max) R.length = max;
  const c = Math.cos(-ya), s = Math.sin(-ya);
  u.segs.forEach((seg, i) => {
    const q = R[Math.min(R.length - 1, (i + 1) * paso)] || { x: hx, z: hz }, qn = R[Math.min(R.length - 1, (i + 1) * paso + 2)] || q;
    const lx = (q.x - b.x) / esc, lz = (q.z - b.z) / esc;
    seg.position.x = lx * c + lz * s; seg.position.z = -lx * s + lz * c; seg.position.y = alto;
    seg.rotation.y = Math.atan2(q.x - qn.x, q.z - qn.z) - ya;
  });
}

export const JEFES3 = {
  sapo_tata: {
    name: 'El Tata Sapo', w: 2.4, h: 1.8, health: 300, speed: 1.2, hostile: true, boss: true, attack: 7, hurtSound: 'rana', idleSound: 'rana', idleEvery: [3, 6],
    particle: [[0.4, 0.38, 0.18], [0.75, 0.8, 0.3]], drops: [[538, 2, 2]], xp: 210, grupo: 'cuero',
    build: armarTata,
    brain(m, dt, c) {
      const { g, distP, dxp, dzp, pl } = c, D = m.data, b = m.body;
      D.apuro = true;
      if (!jugando(g)) return false;
      const F2 = fase2(m, g, '🐸 ¡El Tata Sapo se pone morado! Va dejando charcos de veneno');
      const L = D.lengua;
      if (L) {
        L.t -= dt; m.moving = false;
        if (L.fase === 'buche') { m.targetYaw = Math.atan2(dxp, dzp); if (L.t <= 0) { L.fase = 'sale'; L.t = 0.35; L.yaw = Math.atan2(dxp, dzp); m.yaw = L.yaw; } } // apunta a donde está uno al soltarla: hay que moverse de lado durante el buche
        else if (L.fase === 'sale') {
          L.largo = Math.min(11, (0.35 - L.t) / 0.35 * 11);
          // ¿lo agarró? (en línea, a menos del largo, sin estar rodando)
          const rel = Math.atan2(dxp, dzp) - L.yaw, ang = Math.abs(Math.atan2(Math.sin(rel), Math.cos(rel)));
          if (!L.agarro && distP < L.largo + 0.5 && ang < Math.atan2(0.9, Math.max(1, distP)) && !(g.iframes > 0) && Math.abs(pl.y - b.pos.y) < 2.5) { L.agarro = true; g.ui.toast('🐸 ¡La lengua del Tata le alcanzó!', 1400); }
          if (L.t <= 0) { L.fase = L.agarro ? 'jala' : 'vuelve'; L.t = L.agarro ? 0.8 : 0.4; }
        } else if (L.fase === 'jala') {
          L.largo = Math.max(1.5, distP);
          const l = distP || 1; g.player.body.vel.x = (-dxp / l) * 12; g.player.body.vel.z = (-dzp / l) * 12; g.player.body.vel.y = 2;
          if (L.t <= 0 || distP < 2.4) {
            g.damagePlayer(m.kind.attack, b.pos.x, b.pos.z, 'Masticada del Tata Sapo', true, true);
            g.addEffect('mareo', 5); // v12.8.7 (fase 2B): pega una sola vez (antes, además, veneno 8)
            g.player.body.vel.x = Math.sin(m.yaw) * 13; g.player.body.vel.z = Math.cos(m.yaw) * 13; g.player.body.vel.y = 7;
            g.ui.toast('🐸 …y después, para afuera. Babas y mareo', 1800);
            D.lengua = null; D.lenguaCd = 3;
          }
        } else { L.largo = Math.max(0, (L.largo || 0) - dt * 30); if (L.t <= 0) { D.lengua = null; D.lenguaCd = F2 ? 2.5 : 3.5; } }
        return true;
      }
      const S = D.brinco;
      if (S) { S.t -= dt; anilloAviso(g, b.pos.x + b.vel.x * 0.25, b.pos.y - Math.max(0, b.vel.y) * 0.1, b.pos.z + b.vel.z * 0.25, 6, dt, m); if (S.t <= 0.9 && (b.onGround || b.inWater || S.t < -1)) { D.brinco = null; retumbo(g, m, 6, 5, 'El Tata Sapo cayó encima'); if (g.entities.mobs.filter((o) => !o.dead && o.type === 'sapo_bufo').length < 3) for (let k = 0; k < 2; k++) { const o = g.entities.spawnMob('sapo_bufo', b.pos.x + (k ? 2 : -2), b.pos.y + 0.3, b.pos.z); if (o) o.data.apuro = true; } } m.moving = false; return true; }
      D.lenguaCd = (D.lenguaCd ?? 2) - dt; D.brincoCd = (D.brincoCd ?? 6) - dt; D.charcoCd = (D.charcoCd ?? 3) - dt;
      m.targetYaw = Math.atan2(dxp, dzp);
      if (F2 && D.charcoCd <= 0) { D.charcoCd = 4; (D.charcos ||= []).push({ x: pl.x + (Math.random() - 0.5) * 3, z: pl.z + (Math.random() - 0.5) * 3, y: pl.y, t: 6 }); } // v12.8.7: 6 s (antes 9)
      if (D.charcos) {
        D.charcos = D.charcos.filter((q) => (q.t -= dt) > 0);
        // v12.8.7: el borde del charco se ve (el radio de verdad, 1.4) y sin marcar aviso: es suelo, no un golpe
        for (const q of D.charcos) { if (Math.random() < dt * 14) g.particles.spawn(q.x + (Math.random() - 0.5) * 2, q.y + 0.1, q.z + (Math.random() - 0.5) * 2, [0.55, 0.85, 0.2], 0, 0.5, 0, 1, -0.2, true); for (let k = Math.max(1, Math.round(dt * 60)); k > 0; k--) { const a = Math.random() * Math.PI * 2; g.particles.spawn(q.x + Math.cos(a) * 1.4, q.y + 0.12, q.z + Math.sin(a) * 1.4, COLOR_AVISO.verde, 0, 0.1, 0, 0.5, 0, true); } if (Math.hypot(pl.x - q.x, pl.z - q.z) < 1.4 && Math.abs(pl.y - q.y) < 1.5) g.addEffect('veneno', 2); }
      }
      if (D.brincoCd <= 0 && b.onGround && distP < 14) { D.brincoCd = F2 ? 6 : 9; const l = distP || 1, v = Math.min(9, distP / 1.1); b.vel.x = (dxp / l) * v; b.vel.z = (dzp / l) * v; b.vel.y = 11; b.onGround = false; D.brinco = { t: 1.6 }; g.audio.play('rana', { pos: m.soundPos(), vol: 1, pitch: 0.4 }); return true; }
      if (D.lenguaCd <= 0 && distP > 2.5 && distP < 11 && Math.abs(pl.y - b.pos.y) < 2.5) { D.lengua = { fase: 'buche', t: F2 ? 0.5 : 0.75 }; avisoEmbestida(m, g, F2 ? 0.5 : 0.75, 11, 0.9); g.audio.play('rana', { pos: m.soundPos(), vol: 1, pitch: 0.6 }); return true; }
      if (distP > 6) { m.goTo(pl.x, pl.z, 1); return true; }
      return false;
    },
    onHurt(m, g, dmg) { if (m.health - dmg <= 0) { vencido(g, m, 'sapo_tata', 'el Tata Sapo'); g.achieve('jefe_tata', 'Le gané al Tata Sapo'); } return true; },
    animate(m, dt, u) {
      const L = m.data.lengua;
      u.buche.scale.set(1, L && L.fase === 'buche' ? 1 + (0.75 - L.t) * 2 : 1 + Math.sin(m.t * 3) * 0.08, 1);
      u.lengua.visible = !!(L && L.largo > 0.2);
      if (L) { u.lengua.scale.z = Math.max(0.01, (L.largo || 0) / (u.babyScale || 1)); u.lengua.rotation.y = (L.yaw ?? m.yaw) - m.yaw; }
      const aire = !m.body.onGround;
      u.patas[2].rotation.x = u.patas[3].rotation.x = aire ? -0.9 : 0;
    },
  },
  cascabel_rey: {
    name: 'La Cascabel del Llano', w: 1.4, h: 0.9, health: 280, speed: 2.6, hostile: true, boss: true, attack: 7, hurtSound: 'serpiente', idleSound: 'serpiente', idleEvery: [4, 8],
    particle: [[0.6, 0.48, 0.28], [0.85, 0.75, 0.5]], drops: [[539, 1, 1]], xp: 210, grupo: 'reptil',
    build() { return armarCascabel(); },
    brain(m, dt, c) {
      const { g, distP, dxp, dzp, pl } = c, D = m.data, b = m.body;
      D.apuro = true;
      if (!jugando(g)) return false;
      const F2 = fase2(m, g, '🐍 ¡La Cascabel se encabrita! Ahora también escupe veneno');
      const T = D.tierra;
      // enterrada: el polvo avanza hacia uno y revienta desde abajo
      if (T) {
        T.t -= dt; m.moving = false; b.vel.x = b.vel.z = 0;
        if (T.fase === 'abajo') {
          const l = Math.hypot(pl.x - T.x, pl.z - T.z) || 1, v = 7 * dt;
          if (l > 0.5) { T.x += ((pl.x - T.x) / l) * Math.min(v, l); T.z += ((pl.z - T.z) / l) * Math.min(v, l); }
          if (Math.random() < dt * 30) g.particles.spawn(T.x + (Math.random() - 0.5), pl.y + 0.1, T.z + (Math.random() - 0.5), [0.6, 0.5, 0.35], 0, 1.5, 0, 0.6, 4);
          if (T.t <= 0) { T.fase = 'aviso'; T.t = 0.8; g.audio.play('serpiente', { ui: true, vol: 1, pitch: 1.6 }); avisoCaida(g, T.x, pl.y, T.z, 1.5, 0.8, m); } /* v12.8.8 (fase 2B-bis): el anillo rojo donde va a salir (antes solo el polvo: ≈ 25 % de su daño llegaba sin aviso) */
        } else if (T.fase === 'aviso') {
          for (let k = 0; k < 4; k++) { const a = Math.random() * Math.PI * 2; g.particles.spawn(T.x + Math.cos(a) * 1.3, pl.y + 0.1, T.z + Math.sin(a) * 1.3, [0.7, 0.55, 0.35], 0, 2.5, 0, 0.5, 3); }
          if (T.t <= 0) {
            b.pos.x = T.x; b.pos.z = T.z; let y = Math.floor(pl.y) + 3; while (y > 2 && !SOLID[g.world.getBlock(Math.floor(T.x), y - 1, Math.floor(T.z))]) y--; b.pos.y = y; b.vel.y = 9; b.onGround = false;
            m.group.visible = true; D.tierra = null; D.tierraCd = F2 ? 6 : 9;
            g.shake = Math.max(g.shake || 0, 0.5); g.particles.burst(T.x, y + 0.3, T.z, [[0.55, 0.45, 0.3], [0.8, 0.7, 0.5]], 30, 4);
            if (Math.hypot(pl.x - T.x, pl.z - T.z) < 1.5 && Math.abs(pl.y - y) < 2) { g.damagePlayer(m.kind.attack + 2, T.x, T.z, 'La Cascabel salió de debajo de la tierra', false, true); g.player.body.vel.y = 9; }
          }
        }
        return true;
      }
      const A = D.ataque;
      if (A) {
        A.t -= dt; m.moving = false;
        if (A.fase === 'suena') { m.targetYaw = Math.atan2(dxp, dzp); if (Math.random() < dt * 12) g.audio.play('serpiente', { pos: m.soundPos(), vol: 0.5, pitch: 2 }); if (A.t <= 0) { A.fase = 'tira'; A.t = 0.35; const l = distP || 1; b.vel.x = (dxp / l) * 14; b.vel.z = (dzp / l) * 14; b.vel.y = 3; b.onGround = false; } }
        else { if (!A.pego && distP < 1.8 && Math.abs(pl.y - b.pos.y) < 1.6) { A.pego = true; g.damagePlayer(m.kind.attack, b.pos.x, b.pos.z, 'Mordida de la Cascabel del Llano', false, true); const bota = g.inventory.armor[3]; if (!(bota && bota.id === 547)) g.addEffect('veneno', 2); } /* v12.8.8 (fase 2B-bis): veneno 10 → 2 (renovado en cada mordida daba más de la mitad del daño y no lo baja ni la armadura ni la presión) */ if (A.t <= 0) { D.ataque = null; D.ataqueCd = F2 ? 1.6 : 2.4; } }
        return true;
      }
      D.tierraCd = (D.tierraCd ?? 5) - dt; D.ataqueCd = (D.ataqueCd ?? 1.5) - dt; D.escupeCd = (D.escupeCd ?? 3) - dt;
      m.targetYaw = Math.atan2(dxp, dzp);
      if (D.tierraCd <= 0) { D.tierra = { fase: 'abajo', t: 2.2, x: b.pos.x, z: b.pos.z }; m.group.visible = false; g.particles.burst(b.pos.x, b.pos.y + 0.2, b.pos.z, [[0.55, 0.45, 0.3]], 24, 3); g.ui.toast('🐍 ¡Se metió bajo tierra! Fíjese en el polvo y no se quede quieto', 1800); return true; }
      if (F2 && D.escupeCd <= 0 && distP > 4 && distP < 14) { D.escupeCd = 2.5; tirar(g, m, pl, 12, [0.5, 0.85, 0.2], (gg) => { gg.parryT = 0; gg.damagePlayer(2, m.body.pos.x, m.body.pos.z, 'El escupitajo de la Cascabel', true); if (!(gg.parryT > 0)) gg.addEffect('veneno', 6); }); g.audio.play('serpiente', { pos: m.soundPos(), vol: 1, pitch: 1.2 }); }
      if (D.ataqueCd <= 0 && distP < 6) { D.ataque = { fase: 'suena', t: 0.6 }; avisoEmbestida(m, g, 0.6, 7, 1.1); return true; }
      if (distP > 4) { m.goTo(pl.x, pl.z, 1); return true; }
      m.moving = false; return true;
    },
    // enterrada no hay a qué pegarle
    onHurt(m, g, dmg) { if (m.data.tierra) return false; if (m.health - dmg <= 0) { m.group.visible = true; vencido(g, m, 'cascabel_rey', 'la Cascabel del Llano'); g.achieve('jefe_cascabel', 'Le gané a la Cascabel del Llano'); } return true; },
    animate(m, dt, u) {
      seguirCabeza(m, u, 3);
      const A = m.data.ataque;
      const cola = u.segs.slice(-3);
      for (const s of cola) s.rotation.z = A && A.fase === 'suena' ? Math.sin(m.t * 60) * 0.4 : Math.sin(m.t * 6) * 0.05;
      u.cab.position.y = A && A.fase === 'suena' ? 0.35 : 0.2;
      u.lenguita.visible = Math.sin(m.t * 5) > 0.3;
    },
  },
  cangrejo_rey: {
    name: 'El Cangrejo Rey', w: 2.6, h: 1.8, health: 320, speed: 1.8, hostile: true, boss: true, attack: 7, hurtSound: 'dig.stone', idleSound: null, idleEvery: [999, 999],
    particle: [[0.85, 0.35, 0.12], [0.9, 0.85, 0.75]], drops: [[540, 1, 1], [262, 3, 5]], xp: 220, grupo: 'caparazon',
    build: armarCangrejoRey,
    brain(m, dt, c) {
      const { g, distP, dxp, dzp, pl } = c, D = m.data, b = m.body;
      D.apuro = true;
      if (!jugando(g)) return false;
      const F2 = fase2(m, g, '🦀 ¡El Cangrejo Rey golpea la arena con las pinzas! Salen cangrejos de todos lados');
      if (D.concha > 0) { D.concha -= dt; m.moving = false; if (D.concha <= 0) g.audio.play('dig.stone', { pos: m.soundPos(), vol: 0.8, pitch: 0.8 }); return true; }
      const C = D.carrera;
      if (C) { C.t -= dt; m.yaw = C.yaw - Math.PI / 2; m.targetYaw = m.yaw; b.vel.x = Math.sin(C.yaw) * 9; b.vel.z = Math.cos(C.yaw) * 9; m.moving = false; if (!C.pego && distP < 2.2) { C.pego = true; g.damagePlayer(m.kind.attack, b.pos.x, b.pos.z, 'Atropellón del Cangrejo Rey', false, true); } if (C.t <= 0 || b.hitWall) D.carrera = null; return true; }
      // v12.8.7 (fase 2B): el chorro sale 0.6 s después del carril azul (antes salía sin aviso)
      if (D.chorroPre != null) {
        D.chorroPre -= dt; m.moving = false; m.targetYaw = Math.atan2(dxp, dzp);
        if (D.chorroPre <= 0) {
          D.chorroPre = null;
          tirar(g, m, pl, 16, [0.7, 0.85, 1], (gg, v) => { const l = Math.hypot(v.x, v.z) || 1; gg.player.body.vel.x += (v.x / l) * 14; gg.player.body.vel.z += (v.z / l) * 14; gg.player.body.vel.y = 5; gg.damagePlayer(2, null, null, 'El chorro del Cangrejo Rey', true); });
          g.audio.play('splash', { pos: m.soundPos(), vol: 1, pitch: 0.7 });
        }
        return true;
      }
      D.chorroCd = (D.chorroCd ?? 2) - dt; D.carreraCd = (D.carreraCd ?? 5) - dt; D.marea = (D.marea ?? 6) - dt;
      m.targetYaw = Math.atan2(dxp, dzp);
      if (F2 && D.marea <= 0) { D.marea = 14; for (let k = 0; k < 3; k++) { const a = Math.random() * Math.PI * 2, o = g.entities.spawnMob('cangrejo_tenaza', pl.x + Math.cos(a) * 6, pl.y + 0.5, pl.z + Math.sin(a) * 6); if (o) o.data.apuro = true; } }
      if (D.chorroCd <= 0 && distP > 3 && distP < 16) {
        D.chorroCd = F2 ? 1.8 : 2.8; D.chorroPre = 0.6;
        avisoEmbestida(m, g, 0.6, Math.min(16, distP + 2), 1.2, AZUL_AVISO);
        return true;
      }
      // corre de lado, cruzándose por delante de uno
      if (D.carreraCd <= 0 && distP < 14) { D.carreraCd = F2 ? 4 : 6; const lado = Math.random() < 0.5 ? 1 : -1; D.carrera = { t: 1.6, yaw: Math.atan2(dxp, dzp) + lado * 0.5, pego: false }; return true; }
      return false;
    },
    // se encierra en la concha: solo el golpe fuerte contundente la raja
    onHurt(m, g, dmg) {
      const D = m.data, P = perfil(g.heldDef());
      if (D.concha > 0) {
        if (g.golpeando === m && P.tipo === 'contundente' && g.golpeCargado) { D.concha = 0; m.stunT = 5; /* v12.8.7 (fase 2B): 5 s (antes 2.5) */ g.ui.combatFlash('crit', '¡Le rajó la concha!'); g.audio.play('dig.stone', { pos: m.soundPos(), vol: 1, pitch: 0.5 }); return true; }
        g.audio.play('dig.stone', { pos: m.soundPos(), vol: 0.8, pitch: 1.4 });
        if (!D.avisoConcha) { D.avisoConcha = true; g.ui.toast('🦀 Encerrado en la concha no le entra nada… salvo un golpe fuerte con mazo o garrote', 3000); }
        return false;
      }
      D.golpes = ((g.clock || 0) - (D.golpeT || 0) < 2.5 ? D.golpes || 0 : 0) + 1; D.golpeT = g.clock || 0;
      if (D.golpes >= 4) { D.golpes = 0; D.concha = 3; g.audio.play('dig.stone', { pos: m.soundPos(), vol: 1, pitch: 0.9 }); }
      if (m.health - dmg <= 0) { vencido(g, m, 'cangrejo_rey', 'el Cangrejo Rey'); g.achieve('jefe_cangrejo', 'Le gané al Cangrejo Rey'); }
      return true;
    },
    animate(m, dt, u) {
      const enc = m.data.concha > 0, C = m.data.carrera, v = C ? m.t * 26 : m.walk * 2.2;
      for (const P of u.patas) P.piv.rotation.z = Math.sin(v + P.i * 2 + (P.s > 0 ? 0 : Math.PI)) * 0.3 * (C || m.moving ? 1 : 0);
      u.body.position.y = enc ? 0.25 : 0.7;
      for (const p of u.pinzas) p.rotation.x = enc ? 0.9 : Math.sin(m.t * 2) * 0.1;
    },
  },
  ciempies_rey: {
    name: 'El Ciempiés Rey', w: 1.0, h: 0.7, health: 360, speed: 5, hostile: true, boss: true, attack: 7, hurtSound: 'gato.bufido', idleSound: null, idleEvery: [999, 999],
    particle: [[0.5, 0.1, 0.06], [0.95, 0.5, 0.12]], drops: [[541, 1, 1]], xp: 230, grupo: 'caparazon',
    build: armarCiempiesRey,
    brain(m, dt, c) {
      const { g, distP, dxp, dzp, pl } = c, D = m.data, b = m.body;
      D.apuro = true;
      if (!jugando(g)) return false;
      const F2 = fase2(m, g, '🐛 ¡El Ciempiés Rey se enfurece! Escupe veneno y corre más');
      const A = D.anillo;
      // el anillo: da vueltas alrededor de uno; cuando cierra la vuelta, se tira de frente
      if (A) {
        A.t -= dt;
        A.ang += dt * (F2 ? 2.8 : 2.2) * A.dir;
        const r = Math.max(3, 5.5 - A.vuelta * 0.6);
        m.goTo(A.cx + Math.cos(A.ang) * r, A.cz + Math.sin(A.ang) * r, F2 ? 1.5 : 1.3);
        if (A.t <= 0.8 && !A.aviso) { A.aviso = true; g.audio.play('gato.bufido', { pos: m.soundPos(), vol: 1, pitch: 0.4 }); }
        if (A.t <= 0.8) anilloAviso(g, pl.x, pl.y, pl.z, 1.8, dt, m); // v12.8.7 (fase 2B): donde va a caer, 0.8 s antes (se sale barriéndose o brincando)
        if (A.t <= 0) { D.anillo = null; D.tiro = { t: 0.5 }; const l = distP || 1; b.vel.x = (dxp / l) * 15; b.vel.z = (dzp / l) * 15; b.vel.y = 3; b.onGround = false; }
        return true;
      }
      if (D.tiro) { D.tiro.t -= dt; m.moving = false; if (!D.tiro.pego && distP < 1.8) { D.tiro.pego = true; if (!g.slide && g.player.body.onGround) g.damagePlayer(m.kind.attack + 2, b.pos.x, b.pos.z, 'El Ciempiés Rey se le tiró encima', false, true), g.addEffect('veneno', 10); } if (D.tiro.t <= 0) { D.tiro = null; D.anilloCd = F2 ? 4 : 6; } return true; }
      D.anilloCd = (D.anilloCd ?? 3) - dt; D.escupeCd = (D.escupeCd ?? 2) - dt;
      if (F2 && D.escupeCd <= 0 && distP < 14) { D.escupeCd = 2; tirar(g, m, pl, 13, [0.6, 0.9, 0.2], (gg) => { gg.damagePlayer(2, null, null, 'El veneno del Ciempiés Rey', true); gg.addEffect('veneno', 6); }); }
      if (D.anilloCd <= 0 && distP < 12) { D.anillo = { t: F2 ? 2.6 : 3.2, ang: Math.atan2(b.pos.z - pl.z, b.pos.x - pl.x), cx: pl.x, cz: pl.z, dir: Math.random() < 0.5 ? 1 : -1, vuelta: 0 }; g.ui.toast('🐛 ¡Le está cerrando el anillo! Sálgase antes de que cierre', 1600); return true; }
      // zigzag de acercamiento
      const l = distP || 1, zz = Math.sin(m.t * 2.6) * Math.min(1, distP / 6) * 3;
      if (distP > 2) { m.goTo(pl.x - (dzp / l) * zz, pl.z + (dxp / l) * zz, 1); return true; }
      return false;
    },
    onHurt(m, g, dmg) { if (m.health - dmg <= 0) { vencido(g, m, 'ciempies_rey', 'el Ciempiés Rey'); g.achieve('jefe_ciempies', 'Le gané al Ciempiés Rey'); } return true; },
    animate(m, dt, u) {
      seguirCabeza(m, u, 3);
      const aviso = m.data.anillo && m.data.anillo.aviso;
      u.segs.forEach((s, i) => { const k = Math.sin(m.t * 22 + i * 0.8) * 0.3; s.userData.patas[0].rotation.y = k; s.userData.patas[1].rotation.y = -k; s.userData.patas.forEach((p) => { p.userData.glow = !!aviso; pintarBase(p.material, aviso ? 0xffd040 : 0xe0802a); }); });
      for (const q of u.garras) q.rotation.y = Math.sin(m.t * 8) * 0.25;
    },
  },
};
// la presentación del jefe: su nombre en grande y su apodo, que se desvanece solo
const APODO = { reina_bananera: 'Señora de la selva', escarabajo_hercules: 'El que tumba los árboles', sapo_tata: 'El dueño del manglar', cascabel_rey: 'La que suena antes de morder', cangrejo_rey: 'Rey de la arena y la marea', ciempies_rey: 'Cien patas en la oscuridad', rey_zopilote: 'Dueño de las cumbres' };
export function presentarJefe(g, m) {
  if (typeof document === 'undefined' || !m) return;
  const nombre = `${m.kind.name}${m.data.revancha ? ' · revancha' : ''}`, apodo = m.data.revancha ? 'Regresa con más fuerza… y con más botín' : APODO[m.type] || '';
  const pintar = () => {
    const viejo = document.getElementById('jefe-titulo'); if (viejo) viejo.remove();
    const el = document.createElement('div'); el.id = 'jefe-titulo';
    const b = document.createElement('b'), s = document.createElement('span'); b.textContent = nombre; s.textContent = apodo; el.append(b, s);
    (document.getElementById('hud') || document.body).appendChild(el);
    setTimeout(() => el.remove(), 4200);
  };
  // hace fila con los demás avisos (v11.10.2): antes podía caer encima del cartel de la región
  if (g.ui && g.ui.toast) g.ui.toast(`${nombre} · ${apodo}`, 0, { cat: 'importante', clave: `jefe:${m.type}`, render: { mostrar: pintar, quitar: () => { const el = document.getElementById('jefe-titulo'); if (el) el.remove(); } } });
  else pintar();
}
// el aviso de un golpe de área: un anillo rojo en el suelo mientras se prepara (hasta dónde llega)
export { anilloAviso }; // v12.8.1: vive en golpes.js (el mismo para todos los jefes)
export const JEFE_DE3 = { manglar: 'sapo_tata', bosque_seco: 'cascabel_rey', beach: 'cangrejo_rey', mountains: 'ciempies_rey', nuboso: 'ciempies_rey', paramo: 'ciempies_rey' };
export const AVISO3 = { sapo_tata: '🐸 El agua del manglar hace burbujas… ¡sale el Tata Sapo!', cascabel_rey: '🐍 Se oye un cascabel en el zacate seco… ¡la Cascabel del Llano!', cangrejo_rey: '🦀 La arena se levanta… ¡el Cangrejo Rey sale del mar!', ciempies_rey: '🐛 Un tacatacataca de cien patas… ¡el Ciempiés Rey!' };
