// El jefe final (v5.1): el Rey Zopilote, dueño de las cumbres. Se le llama con la Corona del monte (tejida con los seis trofeos de
// los jefes del monte), de noche y en lo más alto (de la altura 95 para arriba, con cielo abierto). Tres fases:
// 1. En el aire: da vueltas alto y se tira en picada (chilla y encoge las alas: ese es el aviso). Después de cada picada se queda
//    posado en el suelo un rato: ahí sí se le llega con el arma. Las flechas, la honda y la lanza le pegan en el aire.
// 2. La tormenta (dos tercios de vida): llama rayos (un círculo que brilla en el suelo, hay que salirse) y tira plumas como dardos.
// 3. Con las alas rotas (un tercio): ya no vuela. Brinca, barre con las alas (se abren antes: aviso) y suelta ceniza que ciega.
// Al caer: la Cabeza del Rey Zopilote (trofeo para colgar en la casa), sus plumas (para las Alas del Rey) y los créditos. Después
// se sigue jugando como uno quiera. Estado: meta.reyZopilote (día en que se venció).
import { avisoCaida, atacar, avisoEmbestida } from './golpes.js';
import { perfil } from './armas3.js';
import * as THREE from 'three';
import { SOLID } from './blocks.js';
import { presentarJefe, anilloAviso } from './jefes3.js';
import { armarRey } from './modelos-jefes.js';
import { abrirModal } from './ermitas.js';
import { cuadroReyCine } from './reycine.js';
import { armarRedondel, alFase, reyVencido, cuadroRey, soltarEscolta, quitarEscolta } from './reyfinal.js';
// v12.16.5: la gente, el remate y el epílogo los pone game.js (REMATE) para que este archivo no arrastre al epílogo ni a la gente (ciclos entre trozos del build)
export const REMATE = {};

export const CORONA = 552;
const jugando = (g) => g.mode === 'survival' && g.player.alive;
// rayos: un círculo que brilla en el suelo y al ratito cae el rayo
function rayo(g, x, z, y, m = null) { (g.rayosRey ||= []).push({ x, z, y, t: 1.2 }); avisoCaida(g, x, y, z, 1.8, 1.2, m); }
export function cuadroFinal(g, dt) {
  REMATE.cuadroGente(g, dt); // v12.16.5: la gente de la ladera y el remate (antes de cuadroRey: él puede deshacer el redondel)
  cuadroRey(g, dt);
  cuadroReyCine(g, dt); // v12.16.3: música y cinemáticas (también en la máquina de quien visita)
  const V = g.reyCine; // v12.16.5: quien visita ve los créditos y el cierre cuando el Rey cae (el anfitrión los ve por creditosPendientes)
  if (V && V.fin && V.finT > 9 && !V.cred && g.meta && g.meta.invitado && g.player.alive) { V.cred = true; creditos(g); }
  // los créditos salen cuando se puede: vivo, jugando y sin otra pantalla encima
  if (g.meta && g.meta.creditosPendientes && g.player.alive && g.ui.state === 'playing' && !g.paused && (g.creditosT = (g.creditosT ?? 0) - dt) <= 0) { g.meta.creditosPendientes = false; creditos(g); }
  if (!g.rayosRey || !g.rayosRey.length) return;
  const pl = g.player.body.pos;
  g.rayosRey = g.rayosRey.filter((R) => {
    R.t -= dt;
    if (R.t > 0) { for (let k = 0; k < 3; k++) { const a = Math.random() * Math.PI * 2; g.particles.spawn(R.x + Math.cos(a) * 1.6, R.y + 0.1, R.z + Math.sin(a) * 1.6, [0.7, 0.85, 1], 0, 0.6, 0, 0.4, 0, true); } return true; }
    for (let k = 0; k < 24; k++) g.particles.spawn(R.x + (Math.random() - 0.5) * 0.4, R.y + k * 0.8, R.z + (Math.random() - 0.5) * 0.4, [0.85, 0.92, 1], 0, 0, 0, 0.35, 0, true);
    g.particles.burst(R.x, R.y + 0.3, R.z, [[1, 1, 1], [0.6, 0.8, 1]], 24, 5);
    g.audio.play('trueno', { pos: { x: R.x, y: R.y, z: R.z }, vol: 1 });
    g.shake = Math.max(g.shake || 0, 0.3);
    if (jugando(g) && Math.hypot(pl.x - R.x, pl.z - R.z) < 1.8 && Math.abs(pl.y - R.y) < 3) g.damagePlayer(6, null, null, 'Un rayo del Rey Zopilote', true, 'media'); // v12.4.9: con media armadura
    return false;
  });
}
class Pluma {
  constructor(g, x, y, z, v) {
    this.g = g; this.pos = { x, y, z }; this.vel = v; this.life = 0; this.dead = false;
    this.mesh = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.04, 0.6), new THREE.MeshBasicMaterial({ color: 0x1a1a1e }));
    this.mesh.lookAt(v.x, v.y, v.z); g.scene.add(this.mesh);
  }
  update(dt) {
    const g = this.g, p = this.pos, v = this.vel;
    this.life += dt; p.x += v.x * dt; p.y += v.y * dt; p.z += v.z * dt;
    this.mesh.position.set(p.x, p.y, p.z); this.mesh.lookAt(p.x + v.x, p.y + v.y, p.z + v.z);
    const pl = g.player.body.pos;
    if (Math.abs(p.x - pl.x) < 0.5 && Math.abs(p.z - pl.z) < 0.5 && p.y > pl.y && p.y < pl.y + 1.9) { this.dead = true; if (jugando(g)) g.damagePlayer(3, p.x - v.x, p.z - v.z, 'Una pluma del Rey Zopilote', false, true); return; }
    if (g.world.solidoEn(p.x, p.y, p.z) || this.life > 3) this.dead = true;
  }
  remove() { this.g.scene.remove(this.mesh); this.mesh.geometry.dispose(); this.mesh.material.dispose(); }
}

// cuánto de cada golpe le entra al Rey según la fase (v12.16.2, medido con `tools/bot-pelea.js`; ver `docs/BALANCE.md`)
export const AGUANTE_FASE = { 1: 1, 2: 1, 3: 0.4, 4: 0.3 };
export const FINAL = {
  rey_zopilote: {
    name: 'El Rey Zopilote', w: 2.4, h: 2.2, health: 1000, speed: 2.6, hostile: true, boss: true, attack: 8, hurtSound: 'arpia', idleSound: 'arpia', idleEvery: [4, 7],
    particle: [[0.1, 0.1, 0.12], [0.9, 0.45, 0.15]], drops: [[551, 4, 6]], xp: 600, grupo: 'volador',
    build: armarRey,
    update(m, dt) {
      const g = m.game, D = m.data, b = m.body.pos, pl = g.player.body.pos;
      D.apuro = true;
      if (!D.f) { D.f = 'vuela'; D.t = 4; D.ang = Math.random() * Math.PI * 2; m.noGravity = true; }
      // v12.16.2 (fase 4 del diseño): cuatro fases con los umbrales 70 / 40 / 12 % (de la vida máxima real, la que escala con la red)
      const frac = m.health / (D.vmax || m.kind.health);
      const fase = frac > 0.7 ? 1 : frac > 0.4 ? 2 : frac > 0.12 ? 3 : 4;
      if (fase !== D.fase) {
        D.fase = fase;
        if (fase === 2) g.ui.toast('⛈ ¡El Rey Zopilote llama la tormenta! Fíjese en los círculos del suelo', 3600);
        if (fase >= 3 && D.f !== 'tierra' && D.f !== 'cae') { D.f = 'cae'; D.t = 2; }
        if (fase === 3) { D.cor = true; D.corT = 0; D.ceniz = 8; D.ras = null; D.rasCd = 4; g.ui.toast('🪶 ¡Se le rompieron las alas! Trae una coraza de ceniza: solo un golpe fuerte (clic central o F) la rompe', 4400); }
        if (fase === 4) { D.cor = false; D.coroN = 0; D.coroT = 3; D.comboCd = 4; D.ras = null; g.ui.toast('🌅 ¡Amanece! Cubra el golpe dorado justo a tiempo: cada parry le quita vida', 4200); }
        g.audio.play('arpia', { ui: true, vol: 1, pitch: 0.6 });
        alFase(g, fase);
      }
      const aturdido = (m.stunT || 0) > 0;
      if (D.cor === false && D.corT > 0 && fase === 3) { D.corT -= dt; if (D.corT <= 0) { D.cor = true; g.ui.toast('🌫 La coraza de ceniza se le volvió a formar', 2000); } }
      if (D.cor) for (let k = 0; k < 2; k++) g.particles.spawn(b.x + (Math.random() - 0.5) * 2.4, b.y + Math.random() * 2.2, b.z + (Math.random() - 0.5) * 2.4, [0.45, 0.43, 0.42], 0, 0.1, 0, 0.6, 0, true);
      const dx = pl.x - b.x, dz = pl.z - b.z, d = Math.hypot(dx, dz) || 1;
      D.t -= dt;
      const vivo = jugando(g);
      // ---- en el aire ----
      if (D.f === 'vuela') {
        D.ang += dt * 0.5;
        const tx = pl.x + Math.cos(D.ang) * 14, tz = pl.z + Math.sin(D.ang) * 14, ty = pl.y + 11;
        b.x += (tx - b.x) * dt * 1.2; b.y += (ty - b.y) * dt * 1.2; b.z += (tz - b.z) * dt * 1.2;
        m.yaw = Math.atan2(tx - b.x, tz - b.z);
        D.plumaCd = (D.plumaCd ?? 2) - dt;
        if (fase >= 2 && D.plumaCd <= 0 && vivo) { D.plumaCd = 1.6; for (let k = -1; k <= 1; k++) { const a = Math.atan2(dx, dz) + k * 0.12, h = Math.hypot(d, pl.y + 1 - b.y), vv = 20; (g.proy3 ||= []).push(new Pluma(g, b.x, b.y, b.z, { x: Math.sin(a) * vv * d / h, y: ((pl.y + 1 - b.y) / h) * vv, z: Math.cos(a) * vv * d / h })); } }
        D.rayoCd = (D.rayoCd ?? 3) - dt;
        if (fase >= 2 && D.rayoCd <= 0 && vivo) { D.rayoCd = 2.2; g.audio.play('trueno', { ui: true, vol: 0.25, pitch: 1.4 }); for (let k = 0; k < 3; k++) rayo(g, pl.x + (k ? (Math.random() - 0.5) * 7 : 0), pl.z + (k ? (Math.random() - 0.5) * 7 : 0), pl.y, m); }
        D.escCd = (D.escCd ?? 2) - dt;
        if (fase === 1 && D.escCd <= 0 && vivo) { D.escCd = 22; soltarEscolta(g, m, 3, 3); } // la escolta: 3 zopilotes chicos (6 de vida) que bajan a molestar
        if (D.t <= 0 && vivo) { D.f = 'chilla'; D.t = 0.9; g.audio.play('arpia', { pos: m.soundPos(), vol: 1, pitch: 1.3 }); avisoEmbestida(m, g, 0.9, 20, 3); } // el carril rojo de la picada (esquivar rodando)
      } else if (D.f === 'chilla') {
        m.yaw = Math.atan2(dx, dz);
        if (D.t <= 0) { const h = Math.hypot(d, pl.y + 0.8 - b.y) || 1; D.dir = { x: dx / h, y: (pl.y + 0.8 - b.y) / h, z: dz / h }; D.f = 'picada'; D.t = 1.6; D.pego = false; }
      } else if (D.f === 'picada') {
        const v = 26;
        b.x += D.dir.x * v * dt; b.y += D.dir.y * v * dt; b.z += D.dir.z * v * dt;
        for (let k = 0; k < 2; k++) g.particles.spawn(b.x, b.y + 1, b.z, [0.9, 0.3, 0.2], 0, 0, 0, 0.4, 0, true);
        if (!D.pego && vivo && Math.hypot(pl.x - b.x, pl.z - b.z) < 2.4 && Math.abs(pl.y + 1 - (b.y + 1)) < 2.5) { D.pego = true; g.damagePlayer(m.kind.attack, b.x, b.z, 'La picada del Rey Zopilote', false, true); g.player.body.vel.y = 8; g.shake = Math.max(g.shake || 0, 0.6); }
        // llega al suelo: se queda posado (la oportunidad)
        const suelo = SOLID[g.world.getBlock(Math.floor(b.x), Math.floor(b.y - 0.1), Math.floor(b.z))];
        if (suelo || D.t <= 0 || b.y < pl.y - 1) {
          let y = Math.floor(b.y) + 3; while (y > 2 && !SOLID[g.world.getBlock(Math.floor(b.x), y - 1, Math.floor(b.z))]) y--;
          while (y < 250 && (SOLID[g.world.getBlock(Math.floor(b.x), y, Math.floor(b.z))] || SOLID[g.world.getBlock(Math.floor(b.x), y + 1, Math.floor(b.z))])) y++; // no posarse dentro de un árbol o una ladera
          b.y = y; D.f = 'posado'; D.t = fase === 1 ? 4 : 3;
          g.particles.burst(b.x, b.y + 0.3, b.z, [[0.5, 0.42, 0.3]], 30, 4); g.shake = Math.max(g.shake || 0, 0.4);
          if (!D.avisoPosado) { D.avisoPosado = true; g.ui.toast('🪶 ¡Se posó! Ahora sí se le llega con el arma', 2200); }
        }
      } else if (D.f === 'posado') {
        m.yaw = Math.atan2(dx, dz);
        // de cerca, picotazo
        D.pico = (D.pico ?? 1) - dt;
        if (d < 3.2 && D.pico <= 0 && vivo && Math.abs(pl.y - b.y) < 2 && atacar(m, g, { dano: 5, causa: 'Picotazo del Rey Zopilote', alcance: 3.2, tipo: 'mordida', cd: 1.4, alSoltar: () => { D.picoAnim = 0.3; } })) D.pico = 1.4; // con aviso y parry (golpes.js)
        if (D.t <= 0) { D.f = 'vuela'; D.t = fase === 1 ? 5 : 4; g.audio.play('aleteo', { pos: m.soundPos(), vol: 1, pitch: 0.5 }); }
      } else if (D.f === 'cae') {
        // se viene abajo con las alas rotas
        let y = Math.floor(b.y) + 1; while (y > 2 && !SOLID[g.world.getBlock(Math.floor(b.x), y - 1, Math.floor(b.z))]) y--;
        b.y += (y - b.y) * Math.min(1, dt * 3);
        if (D.t <= 0) { D.f = 'tierra'; D.t = 2; b.y = y; g.shake = Math.max(g.shake || 0, 0.8); g.audio.play('dig.stone', { pos: m.soundPos(), vol: 1, pitch: 0.3 }); }
      } else if (D.f === 'tierra') {
        // ---- fases 3 y 4, en el suelo ----
        if (!D.ras) m.yaw = Math.atan2(dx, dz);
        let y = Math.floor(b.y) + 2; while (y > 2 && !SOLID[g.world.getBlock(Math.floor(b.x), y - 1, Math.floor(b.z))]) y--;
        D.vy = (D.vy || 0) - 30 * dt; b.y += D.vy * dt; if (b.y <= y) { b.y = y; D.vy = 0; }
        if (D.rodillas) {
          // el golpe final: de rodillas, con un destello dorado. El próximo golpe (cualquiera) lo termina (onHurt)
          for (let k = 0; k < 3; k++) g.particles.spawn(b.x + (Math.random() - 0.5) * 2, b.y + 0.5 + Math.random() * 3, b.z + (Math.random() - 0.5) * 2, [1, 0.85, 0.3], 0, 1.2, 0, 0.8, 0, true);
        } else if (!aturdido) {
          if (d > 3 && b.y <= y + 0.01) { const s = Math.min(1, dt * 3.4); b.x += (dx / d) * s; b.z += (dz / d) * s; }
          if (fase === 3) {
            D.brinco = (D.brinco ?? 2) - dt; D.barre = (D.barre ?? 4) - dt; D.ceniza = (D.ceniza ?? 6) - dt;
            if (D.brinco <= 0 && d > 5 && b.y <= y + 0.01) { D.brinco = 3; D.vy = 11; D.salta = { x: dx / d, z: dz / d, t: 0.8 }; avisoCaida(g, b.x + (dx / d) * 7.2, y, b.z + (dz / d) * 7.2, 3.5, 0.8, m); }
            if (D.barre <= 0 && d < 7) { D.barre = 4.5; D.abre = 0.8; g.audio.play('arpia', { pos: m.soundPos(), vol: 1, pitch: 0.8 }); }
            if (D.ceniza <= 0) { D.ceniza = 9; D.nube = 3; if (vivo && d < 8) { g.addEffect('mareo', 4); g.ui.toast('🌫 ¡Ceniza en los ojos!', 1400); } }
            D.ceniz = (D.ceniz ?? 12) - dt; // 2 zopilotes de ceniza cada 20 s (6 de vida)
            if (D.ceniz <= 0 && vivo) { D.ceniz = 20; soltarEscolta(g, m, 2, 4); }
            D.rayoCd = (D.rayoCd ?? 3) - dt;
            if (D.rayoCd <= 0 && vivo) { D.rayoCd = 3.5; rayo(g, pl.x, pl.z, pl.y, m); }
          } else {
            // fase 4: el combo de tres golpes dorados cada 6 s y el coro que lo frena
            D.comboCd = (D.comboCd ?? 4) - dt;
            if (D.comboCd <= 0 && d < 3.9 && vivo && !(g.meta && g.meta.dificultad === 'tranquilo') &&  Math.abs(pl.y - b.y) < 2.2 && atacar(m, g, { get dano() { return D.comboN >= 2 ? 6 : 5; }, causa: 'El combo del Rey Zopilote', alcance: 3.4, tipo: 'mordida', cadena: 3, prep: 0.5, cd: 1, alSoltar: () => { D.picoAnim = 0.3; }, alGolpe: () => { D.comboN = (D.comboN || 0) + 1; } })) { D.comboCd = 6; D.comboN = 0; }
            D.coroT = (D.coroT ?? 3) - dt;
            if (D.coroN < 4 && D.coroT <= 0) {
              D.coroN++; D.coroT = 10; m.stunT = D.coroN === 4 ? 5 : 3; m.atk = null;
              g.audio.play('campana', { ui: true, vol: 0.9, pitch: 0.9 + D.coroN * 0.08 });
              REMATE.yendryToque(g, D.coroN);
              g.ui.toast(D.coroN === 4 ? '🔔 ¡El último toque! El Rey cae de rodillas: ¡péguele fuerte!' : `🔔 ¡Toca la campana de la casa! (${D.coroN}/4) Aproveche`, 2200);
            }
          }
          // el aletazo: el rasante (ola baja, carril blanco: se salta o se pasa barriéndose) y el barrido en anillo de la fase 3
          D.rasCd = (D.rasCd ?? 5) - dt;
          if (!D.ras && D.rasCd <= 0 && d > 3 && d < 13 && vivo) { D.rasCd = fase === 3 ? 6 : 8; m.yaw = Math.atan2(dx, dz); D.ras = { t: 0.85, ux: Math.sin(m.yaw), uz: Math.cos(m.yaw) }; avisoEmbestida(m, g, 0.85, 14, 2.5, 0xffffff); g.audio.play('arpia', { pos: m.soundPos(), vol: 0.8, pitch: 0.9 }); }
        }
        if (D.salta) { D.salta.t -= dt; b.x += D.salta.x * dt * 9; b.z += D.salta.z * dt * 9; if (D.salta.t <= 0) { D.salta = null; if (vivo && d < 3.5) g.damagePlayer(7, b.x, b.z, 'El Rey Zopilote le cayó encima', false, true); g.shake = Math.max(g.shake || 0, 0.5); } }
        if (D.abre > 0) { anilloAviso(g, b.x, b.y, b.z, 6.5, dt, m); D.abre -= dt; if (D.abre <= 0 && vivo && d < 6.5 && Math.abs(pl.y - b.y) < 2.5) { g.damagePlayer(6, b.x, b.z, 'Un aletazo del Rey Zopilote', false, true); g.player.body.vel.x += (dx / d) * 14; g.player.body.vel.z += (dz / d) * 14; g.player.body.vel.y = 6; } }
        if (D.ras) {
          D.ras.t -= dt;
          if (D.ras.t <= 0) {
            const R = D.ras, rx = pl.x - b.x, rz = pl.z - b.z, along = rx * R.ux + rz * R.uz, lat = Math.abs(rx * R.uz - rz * R.ux);
            for (let k = 1; k <= 14; k += 1) g.particles.spawn(b.x + R.ux * k, b.y + 0.3, b.z + R.uz * k, [0.9, 0.9, 0.95], 0, 0.5, 0, 0.5, 0, true);
            if (vivo && along > 0 && along < 14.5 && lat < 1.4 && pl.y - b.y < 0.9) g.damagePlayer(4, b.x, b.z, 'La ola rasante del Rey Zopilote', false, true); // el brinco la salta; rodando o barriéndose, el golpe no cuenta
            D.ras = null;
          }
        }
        if (D.nube > 0) { D.nube -= dt; for (let k = 0; k < 6; k++) { const a = Math.random() * Math.PI * 2, r = Math.random() * 7; g.particles.spawn(b.x + Math.cos(a) * r, b.y + Math.random() * 2, b.z + Math.sin(a) * r, [0.35, 0.33, 0.32], 0, 0.3, 0, 1.4, -0.1); } }
        // el golpe final: con el 5 % o menos, de rodillas
        if (fase === 4 && !D.rodillas && m.health <= (D.vmax || m.kind.health) * 0.051) { D.rodillas = true; m.stunT = 0; m.atk = null; g.audio.play('campana', { ui: true, vol: 1, pitch: 0.7 }); g.ui.toast('✨ ¡Está de rodillas! Un golpe más y se acaba', 3000); }
      }
      m.body.vel.x = m.body.vel.y = m.body.vel.z = 0;
      m.group.position.set(b.x, b.y, b.z);
      m.group.rotation.y = m.yaw || 0;
      // las alas
      const u = m.group.userData, aire = D.f === 'vuela' || D.f === 'chilla' || D.f === 'picada';
      const aleteo = aire ? (D.f === 'picada' || D.f === 'chilla' ? -0.9 : Math.sin(m.t * 3.2) * 0.45) : (D.abre > 0 ? 0.6 : D.f === 'tierra' ? 1.1 : 1.4);
      for (const A of u.alas) {
        A.hombro.rotation.z = A.s * (aire ? aleteo * 0.8 : -aleteo * 0.6) + (D.f === 'tierra' ? A.s * 0.3 : 0);
        A.codo.rotation.y = A.s * (aire ? (D.f === 'picada' ? 1.2 : 0.1) : 2.2);
        A.punta.rotation.z = A.s * (aire ? aleteo * 0.4 : 0.3);
      }
      u.body.rotation.x = D.f === 'picada' ? 0.6 : 0;
      D.picoAnim = Math.max(0, (D.picoAnim || 0) - dt);
      u.cabeza.rotation.x = D.picoAnim > 0 ? 0.7 : Math.sin(m.t * 1.5) * 0.08;
      if (D.f === 'tierra' && Math.random() < dt * 4) g.particles.spawn(b.x, b.y + 2.4, b.z, [0.3, 0.3, 0.32], (Math.random() - 0.5), 0.6, (Math.random() - 0.5), 1, -0.2); // humea, quebrado
    },
    // en el aire solo le entran los tiros (flechas, honda, lanza arrojadiza)
    onHurt(m, g, dmg) {
      const D = m.data, aire = D.f === 'vuela' || D.f === 'chilla' || D.f === 'picada';
      if (aire && g.golpeando === m && g.cuerpoACuerpo) { g.ui.combatFlash('break', 'Está muy alto: espere a que se pose o tírele de lejos'); return false; }
      const vmax = D.vmax || m.kind.health;
      let k = 1;
      if (D.fase === 3 && D.cor) { // la coraza de ceniza: absorbe el 65 % hasta que un golpe fuerte (clic central o F) o un arma contundente la rompe
        const fuerte = g.golpeando === m && (g.golpeCargado || perfil(g.heldDef()).tipo === 'contundente');
        if (fuerte) { D.cor = false; D.corT = 12; m.stunT = Math.max(m.stunT || 0, 5.5); g.ui.combatFlash('crit', '¡Le rompió la coraza!'); g.audio.play('dig.stone', { pos: m.soundPos(), vol: 1, pitch: 0.5 }); g.particles.burst(m.body.pos.x, m.body.pos.y + 1.5, m.body.pos.z, [[0.45, 0.43, 0.42], [0.8, 0.8, 0.8]], 28, 5); }
        else { k = 0.35; D.avisoCoraza = (D.avisoCoraza || 0) + 1; if (D.avisoCoraza === 1 || D.avisoCoraza % 12 === 0) g.ui.combatFlash('break', 'La coraza de ceniza lo ataja: golpe fuerte (clic central o F)'); }
      }
      if (!D.rodillas) k *= AGUANTE_FASE[D.fase] ?? 1; // a pie aguanta más (calibrado con bot-pelea.js: el arma de jade en el suelo pega ×3 que al aire)
      if (D.rodillas) { k = (m.health + 1) / Math.max(0.01, dmg); g.slowmo = Math.max(g.slowmo || 0, 0.6); } // el golpe final: lo termina el que sea, en cámara lenta (0,6 s; el anfitrión simula, así que no desincroniza a nadie)
      else if (m.health - dmg * k < vmax * 0.05) k = Math.max(0, (m.health - vmax * 0.05) / Math.max(0.01, dmg)); // no cae sin pasar de rodillas
      if (m.health - dmg * k <= 0) vencerRey(g, m);
      return k;
    },
    // el parry bien hecho (combate.js): en la fase 4 le resta un 3 % de su vida
    alParry(m, g) {
      const D = m.data, vmax = D.vmax || m.kind.health;
      if (D.fase === 4 && !D.rodillas) { m.health = Math.max(vmax * 0.05 + 0.5, m.health - vmax * 0.03); D.parrys = (D.parrys || 0) + 1; g.ui.toast('⚔ ¡Parry! Le quitó un 3 % de vida', 1400); }
    },
  },
};

// ---------- el final ----------
function vencerRey(g, m) {
  if (m.data.vencido) return;
  m.data.vencido = true;
  reyVencido(g);
  const primera = !g.meta.reyZopilote;
  g.meta.reyZopilote = g.meta.reyZopilote || g.day || 1;
  g.achieve('rey_zopilote', 'El Rey de las cumbres cayó');
  g.audio.play('aplausos', { ui: true, vol: 1 });
  // la tormenta se acaba con él
  g.rayosRey = [];
  quitarEscolta(g);
  if (g.proy3) g.proy3 = g.proy3.filter((q) => { if (q instanceof Pluma) { q.remove(); return false; } return true; });
  if (primera) { g.meta.creditosPendientes = true; g.creditosT = 26; } // después del alba y el remate hablado (reyremate.js)
  else g.ui.toast('🏆 ¡Otra vez el Rey Zopilote al suelo!', 3600);
}
export function creditos(g) {
  if (typeof document === 'undefined' || document.getElementById('creditos-final')) return;
  const el = document.createElement('div');
  el.id = 'creditos-final';
  el.innerHTML = `<div class="cf-rollo">${REMATE.rolloCreditos(g).map(([a, b]) => `<h2>${a}</h2><p>${b}</p>`).join('')}</div><button class="cf-seguir">Seguir jugando</button>`;
  const cerrar = abrirModal(g, el, () => { g.audio.play('aplausos', { ui: true, vol: 0.8 }); if (g.meta && g.meta.invitado) REMATE.epilogoRey(g); if (g.running) g.ui.toast('🌄 El mundo sigue. Pura vida', 3000); });
  if (g.music && g.music.concert) g.music.concert(); // v12.16.5: el himno de marimba de día mientras sube el rollo
  el.querySelector('.cf-seguir').addEventListener('click', () => cerrar(true));
}

// ---------- el camino: la hoja de etapas (en la hoja de la partida) ----------
const JEFES = [
  ['reina_bananera', '🕷', 'La Reina Bananera', 'la selva', 'chaleco de seda'],
  ['escarabajo_hercules', '🪲', 'Don Cornudo', 'el bosque', 'mazo de cuerno'],
  ['sapo_tata', '🐸', 'El Tata Sapo', 'el manglar', 'antídoto'],
  ['cascabel_rey', '🐍', 'La Cascabel del Llano', 'los llanos secos', 'botas de cascabel'],
  ['cangrejo_rey', '🦀', 'El Cangrejo Rey', 'la playa', 'cuchillo de pinza'],
  ['ciempies_rey', '🐛', 'El Ciempiés Rey', 'la montaña o las cuevas', 'lanza de colmillo'],
];
export function etapasHTML(g) {
  const M = g.meta || {}, J = M.jefes2 || {}, n = JEFES.filter(([k]) => J[k]).length;
  const paso = (ok, txt) => `<li class="${ok ? 'hecho' : ''}">${ok ? '✔' : '○'} ${txt}</li>`;
  const L = [
    paso((g.day || 1) >= 2, 'Sobrevivir la primera noche'),
    paso(g.xpInfo && g.xpInfo.level >= 5, 'Llegar al nivel 5 (armas de hierro y una buena armadura)'),
    paso(n >= 1, 'Hacer la Ofrenda del monte (flor amarilla, cacao, guaro y antorcha) y llamar al primer jefe, de noche'),
    ...JEFES.map(([k, ic, nom, donde, da]) => paso(!!J[k], `<img class="etapa-jefe" src="./ui/jefes/${k}.png" alt="">${ic} ${nom}, en ${donde}${J[k] ? ` (día ${J[k]})` : ''}: da ${da}`)),
    paso(n >= 6, `Tejer la Corona del monte con los seis trofeos (${n}/6)`),
    paso(!!M.reyZopilote, '<img class="etapa-jefe" src="./ui/jefes/rey_zopilote.png" alt="">👑 Vencer al Rey Zopilote, de noche y en lo más alto'),
    paso(!!M.alasAviso, '🪶 Planear con las Alas del Rey'),
  ];
  return `<h4 class="mana-tit">🗺 El camino</h4><ul class="pend etapas">${L.join('')}</ul>`;
}

// ---------- la Corona del monte: de noche y en lo más alto ----------
export function usarCorona(g, id) {
  if (id !== CORONA || g.mode !== 'survival') return false;
  const p = g.player.body.pos;
  if (g.meta && g.meta.invitado) { g.ui.toast('👑 La Corona se ofrece en el mundo de quien abrió la sala', 2600); return true; }
  if (g.dim !== 'tierra') { g.ui.toast('La Corona es para las cumbres de aquí', 2000); return true; }
  if (g.daylight > 0.35) { g.ui.toast('👑 La Corona se ofrece de noche', 2200); return true; }
  let techo = false;
  for (let y = Math.floor(p.y) + 2; y < Math.floor(p.y) + 30; y++) if (SOLID[g.world.getBlock(Math.floor(p.x), y, Math.floor(p.z))]) { techo = true; break; }
  if (p.y < 95 || techo) { g.ui.toast(`👑 La Corona se ofrece en lo más alto, con el cielo abierto: suba a una cumbre (va en la altura ${Math.floor(p.y)}, hace falta 95)`, 3800); return true; }
  if (g.entities.mobs.some((m) => !m.dead && m.type === 'rey_zopilote')) { g.ui.toast('Ya está aquí', 1500); return true; }
  const d = g.player.lookDir();
  const m = g.entities.spawnMob('rey_zopilote', p.x + d.x * 18, p.y + 12, p.z + d.z * 18);
  if (!m) return true;
  m.data.provoked = true;
  g.inventory.consumeHeld(1);
  presentarJefe(g, m);
  g.shake = Math.max(g.shake || 0, 0.8);
  g.audio.play('trueno', { ui: true, vol: 1 });
  g.audio.play('arpia', { ui: true, vol: 1, pitch: 0.5 });
  g.ui.toast('👑 El viento se para. Una sombra enorme tapa la luna… ¡el Rey Zopilote!', 5000);
  armarRedondel(g, p.x, p.y, p.z, d.x, d.z); // v12.16.1: el Redondel de la Cumbre (se restaura solo al terminar, morir, salir o cargar)
  REMATE.armarGente(g); // v12.16.5: los vecinos que la partida conoce suben con faroles
  return true;
}
// /prueba zopilote [fase2|fase3|fase4] · /prueba final fase2|fase3|fase4|creditos|epilogo: el Rey delante (y las alas con bombetas); con una fase,
// el redondel y la gente ya armados y el Rey con la vida de esa fase
export function pruebaFinal(g, que) {
  if (que === 'creditos') { creditos(g); return 'Los créditos'; }
  if (que === 'epilogo') return REMATE.pruebaEpilogo(g);
  const p = g.player.body.pos, d = g.player.lookDir();
  const m = g.entities.spawnMob('rey_zopilote', p.x + d.x * 18, p.y + 12, p.z + d.z * 18);
  if (m) m.data.provoked = true;
  g.giveItem(CORONA, 1); g.giveItem(549, 1); g.giveItem(374, 16);
  const F = { fase2: 0.66, fase3: 0.36, fase4: 0.1 }[que];
  if (F && m) {
    armarRedondel(g, p.x, p.y, p.z, d.x, d.z); REMATE.armarGente(g);
    m.data.vmax = m.data.vmax || m.kind.health; m.health = m.data.vmax * F;
    return `El Rey Zopilote en la ${que.replace('fase', 'fase ')} (con el redondel y la gente de la ladera)`;
  }
  return 'El Rey Zopilote viene (y una Corona, las Alas del Rey y 16 bombetas)';
}
