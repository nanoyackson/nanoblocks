// Los toros a la tica: en los días de fiesta, de día, arman en la plaza un redondel de postes y sueltan un toro. Nadie le hace daño al
// toro: los improvisados se meten, lo torean y salen corriendo. Quien aguanta 30 segundos adentro sin que lo revuelque tres veces,
// se lleva los aplausos. Estado: g.toros (no se guarda), meta.torosDia.
import { avisoEmbestida } from './golpes.js';
import * as THREE from 'three';
import { armarToroRedondel } from './modelos-otros.js';
import { SOLID } from './blocks.js';
import { fiestaHoy } from './fiestas2.js';
import { disposeModel } from './models.js';

const R = 8, COLON = 360, META = 30, ALTO_OK = 1.6;
const deDia = (g) => { const t = g.time || 0; return t > 0.03 && t < 0.42; };
function suelo(g, x, z, y0) { let y = Math.floor(y0) + 8; while (y > 1 && !SOLID[g.world.getBlock(Math.floor(x), y - 1, Math.floor(z))]) y--; return y; }
// ¿cabe el redondel aquí? suelo parejo (±1) en el borde y nada sólido adentro, a la altura de uno
function claro(g, cx, cz, y) {
  const w = g.world;
  for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2; if (Math.abs(suelo(g, cx + Math.cos(a) * R, cz + Math.sin(a) * R, y + 2) - y) > 1) return false; }
  for (let dx = -R + 1; dx <= R - 1; dx++) for (let dz = -R + 1; dz <= R - 1; dz++) {
    if (dx * dx + dz * dz > (R - 0.5) * (R - 0.5)) continue;
    for (let dy = 0; dy < 3; dy++) if (SOLID[w.getBlock(Math.floor(cx + dx), y + dy, Math.floor(cz + dz))]) return false;
  }
  return true;
}
function sitio(g, v) {
  const y0 = v.y || g.player.body.pos.y;
  // los pueblos nuevos traen su redondel de bloques: ahí mismo
  const r = (v.buildings || []).find((b) => b.kind === 'redondel');
  if (r) { const cx = r.x + Math.floor(r.w / 2) + 0.5, cz = r.z + Math.floor(r.d / 2) + 0.5; return { cx, cz, y: suelo(g, cx, cz, y0), fijo: true }; }
  for (const [dx, dz] of [[-10, 0], [-14, 10], [-14, -10], [12, 14], [0, 18], [0, -20], [18, 0], [-22, 0]]) {
    const cx = Math.floor(v.x) + dx + 0.5, cz = Math.floor(v.z) + dz + 0.5, y = suelo(g, cx, cz, y0);
    if (claro(g, cx, cz, y)) return { cx, cz, y };
  }
  return null;
}
function armar(g, v, s = sitio(g, v)) {
  if (!s) return false;
  const { cx, cz, y } = s;
  // el redondel: postes y dos tablas alrededor (solo de ver; no son bloques)
  const grupo = new THREE.Group();
  const mad = new THREE.MeshBasicMaterial({ color: 0x9a7040 }), mad2 = new THREE.MeshBasicMaterial({ color: 0xc8a060 });
  for (let i = 0; i < 28; i++) {
    const a = (i / 28) * Math.PI * 2, x = Math.cos(a) * R, z = Math.sin(a) * R;
    const poste = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.4, 0.2), mad); poste.position.set(x, 0.7, z); grupo.add(poste);
    for (const h of [0.5, 1.1]) { const t = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.14, 2 * R * Math.sin(Math.PI / 28) + 0.1), mad2); t.position.set(Math.cos(a + Math.PI / 28) * R, h, Math.sin(a + Math.PI / 28) * R); t.rotation.y = -(a + Math.PI / 28); grupo.add(t); }
  }
  grupo.position.set(cx, y, cz);
  g.scene.add(grupo);
  const toro = g.entities.spawnMob('toro_redondel', cx, y + 0.2, cz);
  g.toros = { x: cx, y, z: cz, grupo, toro, tiempo: 0, revolcones: 0, oles: 0, dentro: false, fuera: false, fijo: !!s.fijo };
  if (s.fijo) grupo.visible = false; // el de bloques ya tiene sus tablas
  return true;
}
export function quitarToros(g) {
  const T = g.toros;
  if (!T) return;
  g.scene.remove(T.grupo); disposeModel(T.grupo);
  if (T.toro) T.toro.dead = true;
  quitarMonta(g);
  g.toros = null;
}
// cada segundo
export function tickToros(g) {
  if (g.dim !== 'tierra') { quitarToros(g); return; }
  const p = g.player.body.pos, T = g.toros, dia = !!fiestaHoy(g) && deDia(g);
  if (T && ((!dia && !T.prueba) || Math.hypot(p.x - T.x, p.z - T.z) > 90 || !T.toro || T.toro.dead)) { quitarToros(g); return; }
  if (!T) {
    if (!dia) return;
    const v = g.nearestVillage(p.x, p.z);
    if (!v || v.dist > 50 || !g.world.isLoaded(v.v.x - 10, v.v.z) || g.torosNo === v.v.id) return;
    if (!armar(g, v.v)) { g.torosNo = v.v.id; return; } // aquí no cabe: no seguir buscando cada segundo
    const M = g.meta, hoy = g.day || 1;
    if (g.mode === 'survival' && M.torosAviso !== hoy) { M.torosAviso = hoy; g.ui.toast('🐂 ¡Toros a la tica! Métase al redondel de improvisado: aguante 30 segundos', 4200); }
    return;
  }
  if (g.mode !== 'survival' || !g.player.alive || g.monta) return;
  // la altura se mide con los pies en el suelo (en el aire, por un revolcón, sigue contando como antes)
  const b = g.player.body, alto = b.onGround || b.inWater ? p.y - T.y < ALTO_OK && p.y - T.y > -1.5 : true;
  const dentro = Math.hypot(p.x - T.x, p.z - T.z) < R - 0.4 && alto && !g.riding;
  if (!dentro) { T.dentro = false; T.fuera = false; return; }
  if (T.fuera) return; // lo revolcó tres veces: tiene que salir y volver a entrar
  if (!T.dentro) { T.tiempo = 0; T.revolcones = 0; T.oles = 0; g.ui.toast('🐂 ¡Adentro del redondel! Que no le revuelque tres veces en 30 segundos', 2600); }
  T.dentro = true;
  if ((g.meta.torosDia || 0) === (g.day || 1)) return; // los aplausos de hoy ya fueron suyos
  T.tiempo++;
  if (T.tiempo >= META) {
    g.meta.torosDia = g.day || 1;
    const premio = 20 + T.oles * 5;
    g.giveItem(COLON, premio);
    g.audio.play('aplausos', { ui: true, vol: 0.9 });
    g.ui.toast(`🐂 ¡Treinta segundos con el toro! La gradería aplaude: ₡${premio}${T.oles ? ` (${T.oles} «¡olé!»)` : ''}. Ahora salga, que el toro sigue`, 4200);
    g.achieve('toros', 'Improvisado del redondel');
    if (T.oles >= 5) g.achieve('toros_ole', 'Cinco olés en una tanda');
  }
}
// el toro le pega a uno: revuelca y saca volando, pero no mata (deja por lo menos medio corazón)
function revolcar(g, T, ex, ez) {
  if (T.dentro) T.revolcones++;
  const P = g.player, dano = Math.min(2, Math.max(0, P.health - 1));
  if (dano > 0) g.damagePlayer(dano, null, null, 'Revolcón del toro del redondel', true, false);
  const v = P.body.vel; v.x += ex * 9; v.z += ez * 9; v.y = 6;
  g.sinCaida = (g.clock || 0) + 2.5; // la caída del revolcón no cuenta
  g.ui.toast(T.fuera ? '🐂 ¡Ya le revolcó tres veces! Salga del redondel' : T.revolcones >= 3 && T.dentro ? '🐂 ¡Tres revolcones! Salga y vuelva a entrar para intentarlo otra vez' : T.dentro ? `🐂 ¡Le revolcó! (${T.revolcones} de 3)` : '🐂 ¡Le revolcó!', 2000);
  if (T.revolcones >= 3 && T.dentro) { T.fuera = true; T.dentro = false; }
}
// ---------- el toro del redondel: café, bravo pero de fiesta; embiste, revuelca y no mata ----------
export const TORO = {
  toro_redondel: {
    name: 'Toro del redondel', w: 0.95, h: 1.35, health: 999, speed: 2, hurtSound: 'vaca', idleSound: 'resoplido', idleEvery: [5, 10],
    particle: [[0.45, 0.3, 0.18]], drops: [], xp: 0,
    build() { return armarToroRedondel(); },
    brain(m, dt, c) {
      const { g, distP, dxp, dzp, pl } = c;
      const T = g.toros, D = m.data, b = m.body;
      D.apuro = true;
      if (!T || T.toro !== m) { m.dead = true; return true; }
      // con alguien encima: corcovea, da vueltas y brinca en su sitio
      if (g.monta && g.monta.toro === m) {
        m.moving = false; D.embiste = null;
        m.targetYaw = (m.targetYaw || 0) + Math.sin(m.t * 3) * dt * 4;
        b.vel.x = Math.cos(m.t * 1.7) * 1.2; b.vel.z = Math.sin(m.t * 1.3) * 1.2;
        return true;
      }
      // no sale del redondel
      const fuera = Math.hypot(b.pos.x - T.x, b.pos.z - T.z) > R - 1.2;
      const E = D.embiste;
      if (E) {
        E.t -= dt;
        if (E.fase === 'rasca') { m.moving = false; m.targetYaw = Math.atan2(dxp, dzp); if (E.t <= 0) { const l = distP || 1; D.embiste = { fase: 'corre', t: 1.6, x: dxp / l, z: dzp / l, pego: false, cerca: 99 }; g.audio.play('galope', { pos: m.soundPos(), vol: 0.8 }); } return true; }
        m.moving = false; b.vel.x = E.x * 8; b.vel.z = E.z * 8; m.targetYaw = Math.atan2(E.x, E.z);
        const d = Math.hypot(pl.x - b.pos.x, pl.z - b.pos.z); E.cerca = Math.min(E.cerca, d);
        if (!E.pego && d < 1.4 && pl.y - b.pos.y < ALTO_OK + 0.4 && pl.y - b.pos.y > -1.5 && g.mode === 'survival') { E.pego = true; revolcar(g, T, E.x, E.z); }
        if (E.t <= 0 || fuera || b.hitWall) {
          if (!E.pego && E.cerca < 2.6 && T.dentro && T.tiempo > 0) { T.oles++; g.ui.toast('🎉 ¡Olé!', 900); g.audio.play('aplausos', { ui: true, vol: 0.35 }); }
          D.embiste = null; D.cd = 2 + Math.random() * 1.5;
        }
        return true;
      }
      if (fuera) { m.goTo(T.x, T.z, 0.8); return true; }
      D.cd = Math.max(0, (D.cd ?? 2) - dt);
      const adentro = Math.hypot(pl.x - T.x, pl.z - T.z) < R && g.player.alive;
      if (adentro && D.cd <= 0 && distP > 2.5 && b.onGround) { D.embiste = { fase: 'rasca', t: 0.9 }; avisoEmbestida(m, g, 0.9, 12); g.audio.play('resoplido', { pos: m.soundPos(), vol: 1 }); return true; }
      // pegado a él no se salva nadie: cabezazo de cerca
      if (adentro && D.cd <= 0 && distP <= 1.6 && g.mode === 'survival' && pl.y - b.pos.y < ALTO_OK + 0.4) {
        const l = distP || 1; D.cd = 2.2; m.targetYaw = Math.atan2(dxp, dzp);
        revolcar(g, T, dxp / l, dzp / l);
        return true;
      }
      // da vueltas al redondel
      D.ang = (D.ang || 0) + dt * 0.4;
      m.goTo(T.x + Math.cos(D.ang) * 3, T.z + Math.sin(D.ang) * 3, 0.5);
      return true;
    },
    onHurt(m, g) { g.ui.toast('🐂 Al toro no se le pega: aquí se torea (o se monta: clic derecho de cerca)', 1800); return false; },
    interact(m, g) { return subirse(g, m); },
    animate(m, dt, u) { const E = m.data.embiste; u.headRx = E && E.fase === 'corre' ? 0.5 : 0; if (E && E.fase === 'rasca') u.legs[0].rotation.x = Math.sin(m.t * 14) * 0.7; },
  },
};
// ---------- la monta: subirse al toro y aguantar ocho segundos ----------
// clic derecho al toro (de cerca) para subirse; A y D para echarse al lado contrario de donde se tira. Estado: g.monta (no se guarda),
// meta.montaDia (premio del día), meta.montaRecord.
const MONTA = 8;
function barraMonta(on) {
  let el = document.getElementById('monta-barra');
  if (!on) { if (el) el.remove(); return null; }
  if (!el) {
    el = document.createElement('div'); el.id = 'monta-barra';
    // v11.13.5: el estilo vive en vidrio.css (#monta-barra, #monta-marca, #monta-tiempo)
    const m = document.createElement('div'); m.id = 'monta-marca';
    const t = document.createElement('div'); t.id = 'monta-tiempo';
    el.append(m, t); document.body.append(el);
  }
  return el;
}
function subirse(g, m) {
  const T = g.toros;
  if (!T || T.toro !== m || g.monta || g.mode !== 'survival' || !g.player.alive || g.riding) return false;
  if ((g.meta.montaDia || 0) === (g.day || 1)) { g.ui.toast('🐂 La monta de hoy ya fue suya. Mañana, si hay fiesta, otra vez', 2000); return true; }
  m.data.embiste = null;
  g.monta = { toro: m, t: 0, bal: 0, vel: 0, tiro: 0.8 };
  g.audio.play('resoplido', { pos: m.soundPos(), vol: 1 });
  g.ui.toast('🐂 ¡Arriba del toro! Échese con A y D al lado contrario de donde le tira. ¡Ocho segundos!', 3200);
  return true;
}
function bajarse(g, gano) {
  const S = g.monta;
  if (!S) return;
  g.monta = null; barraMonta(false);
  const P = g.player, b = P.body, M = g.meta, seg = Math.round(S.t * 10) / 10;
  M.montaRecord = Math.max(M.montaRecord || 0, seg);
  g.sinCaida = (g.clock || 0) + 3;
  const lado = S.bal >= 0 ? 1 : -1, yaw = S.toro.yaw || 0, rx = Math.cos(yaw) * lado, rz = -Math.sin(yaw) * lado;
  b.vel.x = rx * (gano ? 4 : 8); b.vel.z = rz * (gano ? 4 : 8); b.vel.y = gano ? 5 : 7;
  if (S.toro.data) S.toro.data.cd = 3;
  if (gano) {
    M.montaDia = g.day || 1;
    const premio = 30;
    g.giveItem(COLON, premio);
    g.audio.play('aplausos', { ui: true, vol: 1 });
    g.ui.toast(`🐂 ¡Ocho segundos encima del toro! La gradería se cae a aplausos: ₡${premio}`, 4200);
    g.achieve('monta_toro', 'Montador de redondel');
  } else {
    const dano = Math.min(2, Math.max(0, P.health - 1));
    if (dano > 0) g.damagePlayer(dano, null, null, 'Botada del toro del redondel', true, false);
    g.ui.toast(`🐂 ¡El toro le botó! Aguantó ${seg.toFixed(1)} segundos${M.montaRecord > seg ? ` (su mejor: ${M.montaRecord.toFixed(1)})` : ''}`, 3200);
    g.audio.play('aplausos', { ui: true, vol: 0.3, pitch: 0.8 });
  }
}
// cada cuadro mientras va montado (lo llama game.js en vez de mover al jugador)
export function montaUpdate(g, dt, input) {
  const S = g.monta;
  if (!S) return;
  const m = S.toro, P = g.player, b = P.body;
  if (m.dead || !g.toros || !P.alive || g.mode !== 'survival') { g.monta = null; barraMonta(false); return; }
  S.t += dt;
  // el toro corcovea: cada tanto un tirón hacia un lado, más fuerte con el tiempo
  S.tiro -= dt;
  if (S.tiro <= 0) {
    S.tiro = 0.45 + Math.random() * 0.6;
    S.vel += (Math.random() < 0.5 ? -1 : 1) * (0.9 + Math.random() * 0.8 + S.t * 0.07);
    if (m.body.onGround) m.body.vel.y = 4.5;
    g.audio.play(Math.random() < 0.5 ? 'resoplido' : 'vaca', { pos: m.soundPos(), vol: 0.7, pitch: 0.8 });
  }
  // el equilibrio: inestable (si se va de un lado, se sigue yendo) y uno lo corrige con A y D
  S.vel += S.bal * 1.2 * dt;
  if (input.left) S.vel -= 6.5 * dt;
  if (input.right) S.vel += 6.5 * dt;
  S.vel *= Math.exp(-1.6 * dt);
  S.bal += S.vel * dt;
  // uno, sentado en el lomo
  b.pos.x = m.body.pos.x; b.pos.z = m.body.pos.z; b.pos.y = m.body.pos.y + 1.2;
  b.vel.x = b.vel.y = b.vel.z = 0; b.fallStart = null;
  g.camRollMonta = -S.bal * 0.5;
  g.shake = Math.max(g.shake || 0, 0.12);
  const el = barraMonta(true);
  el.querySelector('#monta-marca').style.left = `${50 + Math.max(-1, Math.min(1, S.bal)) * 50}%`;
  el.querySelector('#monta-tiempo').textContent = `${S.t.toFixed(1)} / ${MONTA} s`;
  if (Math.abs(S.bal) >= 1) bajarse(g, false);
  else if (S.t >= MONTA) bajarse(g, true);
}
export const quitarMonta = (g) => { g.monta = null; barraMonta(false); };
export function barraMontaVisible(g, on) { const el = document.getElementById('monta-barra'); if (el) el.style.display = on && g.monta ? '' : 'none'; }
export function pruebaToros(g) {
  quitarToros(g);
  const p = g.player.body.pos, d = g.player.lookDir();
  const cx = Math.floor(p.x + d.x * 14) + 0.5, cz = Math.floor(p.z + d.z * 14) + 0.5;
  armar(g, null, { cx, cz, y: suelo(g, cx, cz, p.y) });
  g.toros.prueba = true; g.meta.torosDia = 0;
  return 'Un redondel con su toro, delante. Métase y aguante 30 segundos';
}
