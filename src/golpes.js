// Golpes que se ven venir (v11.3). Todo ataque cuerpo a cuerpo de una criatura pasa por tres tiempos, como un golpe de verdad:
// se prepara (el cuerpo se carga, el arma sube y justo antes de soltarlo brilla), suelta (rapidísimo, dejando un arco) y se recupera.
// El daño cae en medio del soltar, así que la preparación es lo que le dice a uno cuándo cubrirse: el brillo es el momento del parry.
// Si uno se quita del frente o se aleja, el golpe se va al aire. Las poses salen de la forma del cuerpo de cada criatura.
import * as THREE from 'three';

import { manaJefe } from './manasjefe.js';

const suave = (k) => k * k * (3 - 2 * k);
const VENTANA_AVISO = 0.26; // el brillo sale esto antes del impacto: cubrirse al verlo cae adentro de la ventana del parry
const ventana = (g) => VENTANA_AVISO + (manaJefe(g, 'oido_cascabel') ? 0.15 : 0); // v12.16.5: la maña «Oído de cascabel»

// en cada pose: U es el brazo cargado y D donde termina. x sube el brazo, z lo abre (se refleja en el izquierdo), c dobla el codo
// una sola tabla para criaturas y para el jugador en tercera persona (avatar.js, por POSE_ESTELA)
export const POSES = {
  tajo: { U: { x: -2.9, z: 0.35, c: -1.2 }, D: { x: -0.45, z: -0.25, c: -0.15 }, giro: 0.25 },
  lateral: { U: { x: -1.55, z: 1.15, c: -1 }, D: { x: -1.45, z: -0.85, c: -0.1 }, giro: 0.7 },
  estocada: { U: { x: -0.75, z: 0.15, c: -2 }, D: { x: -1.62, z: 0, c: -0.02 }, giro: 0.4 },
  zarpazo: { U: { x: -2.5, z: 0.7, c: -0.7 }, D: { x: -0.7, z: -0.4, c: -0.3 }, giro: 0.35 },
  mazazo: { U: { x: -3.05, z: 0.2, c: -0.6 }, D: { x: -0.55, z: -0.1, c: -0.1 }, giro: 0.1, ambos: true },
  reves: { U: { x: -1.4, z: -0.75, c: -1.4 }, D: { x: -1.5, z: 1, c: -0.1 }, giro: -0.55 }, // el revés del jugador (las criaturas no lo escogen)
};
// la estela de cada movida del jugador (1 derecha, -1 revés, 0 de punta, 2 de arriba) → su pose
export const POSE_ESTELA = { 1: 'lateral', [-1]: 'reves', 0: 'estocada', 2: 'tajo' };
const brazosDe = (u) => u.npcArms || u.brazos || u.arms || null;
const patasDe = (u) => u.legs && u.legs.length ? u.legs : u.patas || null;
const cabezaDe = (u) => u.head || u.cab || u.cef || u.cabeza || null;
const elegir = (l) => l[Math.floor(Math.random() * l.length)];

// qué clase de golpe le sale a cada cuerpo
function tipoPara(m) {
  const u = m.group.userData, h = m.kind.h || 1;
  if (brazosDe(u) && brazosDe(u).length >= 2) {
    if (h > 2.3) return elegir(['mazazo', 'zarpazo', 'lateral']);
    if (u.cloth) return elegir(['zarpazo', 'tajo', 'lateral']);
    return elegir(['tajo', 'lateral', 'estocada']);
  }
  if (u.segs) return 'latigazo';
  if (u.pinzas || u.grande || u.queli || u.garras) return 'pinza';
  if (u.cuerno || u.arriba || m.type === 'toro_guaco') return 'cornada';
  return patasDe(u) ? 'mordida' : 'embiste';
}

// arranca un ataque. Se puede llamar en cada cuadro: mientras haya uno en curso no hace nada.
// o: { dano, causa, alcance, armored, tipo, prep, cd, lunge, alSoltar(), alGolpe(conecto) }
export function atacar(m, g, o = {}) {
  if (m.atk || m.dying || (m.stunT || 0) > 0) return false;
  const h = m.kind.h || 1, boss = !!m.kind.boss;
  const prep = o.prep ?? Math.min(0.85, Math.max(0.42, 0.36 + h * 0.13)) + (boss ? 0.12 : 0);
  const tipo = o.tipo || tipoPara(m);
  marcarAviso(g, m, prep + 0.15); // v12.8.1: el amago del golpe es su aviso (para medir el daño sin aviso de los jefes)
  m.brazoAtk = m.brazoAtk === 1 ? 0 : 1; // alterna manos
  // los grandes y la gente encadenan: el segundo golpe llega más rápido y con la otra mano, y hay que seguir atento
  const cadena = o.cadena ?? (boss ? (Math.random() < 0.5 ? 3 : 2) : brazosDe(m.group.userData) && h >= 1.7 && Math.random() < 0.2 ? 2 : 1);
  if (o.esquivar) m.atkRojo = true; else m.atkRojo = false;
  m.atk = { t: 0, prep, suelta: tipo === 'mazazo' ? 0.16 : 0.12, sigue: cadena > 1 ? 0.12 : 0.32, tipo, brazo: m.brazoAtk, o, cadena, pego: false, aviso: false, solto: false, mira: m.yaw || 0 };
  g.audio.play('swish', { pos: m.soundPos(), vol: 0.18, pitch: 0.55 });
  return true;
}
export function cancelarGolpe(m) { m.atk = null; }
// el parry: se le devuelve el golpe y queda con el brazo botado
export function rebotarGolpe(m) { m.atk = null; m.reboteT = 0.5; }

// un punto del cuerpo en el mundo, para el brillo: la mano del brazo que pega, o la cabeza
function puntoGolpe(m, A) {
  const u = m.group.userData, br = brazosDe(u), v = new THREE.Vector3();
  m.group.updateMatrixWorld(true);
  if (br && br[A.brazo]) { const q = br[A.brazo].junta || br[A.brazo]; q.localToWorld(v.set(0, -0.32, 0.05)); return v; }
  const c = cabezaDe(u);
  if (c) return c.localToWorld(v.set(0, 0.15, 0.2));
  return v.set(m.body.pos.x, m.body.pos.y + (m.kind.h || 1) * 0.7, m.body.pos.z);
}

// el brillo del aviso: una estrellita que crece y se apaga en la mano
let texBrillo = null;
function brilloTex() {
  if (texBrillo) return texBrillo;
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const x = c.getContext('2d'), gr = x.createRadialGradient(32, 32, 0, 32, 32, 30);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,240,180,0.7)'); gr.addColorStop(1, 'rgba(255,220,120,0)');
  x.fillStyle = gr; x.fillRect(0, 0, 64, 64);
  x.fillStyle = 'rgba(255,255,255,0.95)';
  for (const [w, h] of [[2.5, 30], [30, 2.5]]) { x.beginPath(); x.moveTo(32 - w, 32); x.lineTo(32, 32 - h); x.lineTo(32 + w, 32); x.lineTo(32, 32 + h); x.closePath(); x.fill(); }
  texBrillo = new THREE.CanvasTexture(c);
  return texBrillo;
}
// dorado: se puede parar con parry · rojo: mejor quitarse (embestidas, saltos, lo que viene con todo el cuerpo)
const DORADO = 0xffffff, ROJO = 0xff4a30;
function brillo(g, p, tam, color = DORADO) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: brilloTex(), color, transparent: true, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending }));
  s.position.copy(p); s.renderOrder = 15;
  g.scene.add(s);
  (g.fxGolpes ||= []).push({ m: s, t: 0, dur: ventana(g), sigue: null, tam, brillo: true });
}
// el arco del golpe: se dibuja al soltar y se apaga enseguida
export function arcoGolpe(g, x, y, z, yaw, vertical, radio, color = 0xfff2d0) {
  const geo = new THREE.RingGeometry(radio * 0.72, radio, 26, 1, vertical ? Math.PI * 0.05 : Math.PI * 0.12, Math.PI * (vertical ? 0.9 : 0.76));
  const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.6, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }));
  mesh.position.set(x, y, z);
  mesh.rotation.order = 'YXZ';
  if (vertical) mesh.rotation.y = yaw + Math.PI / 2; else { mesh.rotation.y = yaw; mesh.rotation.x = -Math.PI / 2; }
  mesh.renderOrder = 14;
  g.scene.add(mesh);
  (g.fxGolpes ||= []).push({ m: mesh, t: 0, dur: 0.2, arco: true });
}
// la embestida: un carril rojo en el suelo por donde va a pasar, que sigue a la criatura mientras apunta. Al final, el brillo rojo
// v12.8.1 (fase 2 de los jefes, PREPARACION_C5_Y_JEFES_F2.md §3.2): cada aviso deja anotado «hay aviso vivo» del que lo da (o de
// cualquiera, '*'), y damagePlayer (game.js) reparte el daño de los jefes en g.diag[tipo] = { conAviso, sinAviso } (no se guarda:
// es para el bot). Así se mide «cada jefe enseña lo prometido»
export function marcarAviso(g, quien, dur) {
  const k = quien && quien.type ? quien.type : '*', hasta = (g.clock || 0) + dur + 0.25;
  const A = (g.avisosVivos ||= new Map());
  if (!(A.get(k) > hasta)) A.set(k, hasta);
}
export function avisoVivo(g, tipo) { const A = g.avisosVivos, ck = g.clock || 0; return !!(A && ((A.get(tipo) || 0) > ck || (A.get('*') || 0) > ck)); }
// el anillo de partículas rojas (antes en jefes3.js): se llama cada cuadro mientras dura el aviso
// v12.8.7 (fase 2B): con color (verde la nube de la Reina); sin él, rojo
export const COLOR_AVISO = { rojo: [1, 0.25, 0.15], verde: [0.45, 0.95, 0.25], azul: [0.35, 0.7, 1], dorado: [1, 0.85, 0.25] };
export function anilloAviso(g, x, y, z, r, dt, quien = null, color = COLOR_AVISO.rojo) {
  const n = Math.max(1, Math.round(dt * 160));
  for (let k = 0; k < n; k++) { const a = Math.random() * Math.PI * 2; g.particles.spawn(x + Math.cos(a) * r, y + 0.15, z + Math.sin(a) * r, color, 0, 0.15, 0, 0.35, 0, true); }
  marcarAviso(g, quien, 0.1);
}
export const AZUL_AVISO = 0x4aa8ff; // v12.8.7: el carril del chorro del Cangrejo Rey (agua, no golpe)
export function avisoEmbestida(m, g, dur, largo, ancho = 1.5, color = ROJO) {
  marcarAviso(g, m, dur);
  const geo = new THREE.PlaneGeometry(ancho, largo);
  geo.translate(0, -largo / 2, 0); geo.rotateX(-Math.PI / 2);
  const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }));
  mesh.renderOrder = 13;
  g.scene.add(mesh);
  (g.fxGolpes ||= []).push({ m: mesh, t: 0, dur, carril: true, quien: m, avisado: false });
}
// el salto: un círculo rojo donde va a caer
export function avisoCaida(g, x, y, z, r, dur, quien = null) {
  marcarAviso(g, quien, dur);
  const geo = new THREE.RingGeometry(r * 0.82, r, 36); geo.rotateX(-Math.PI / 2);
  const disco = new THREE.CircleGeometry(r * 0.82, 36); disco.rotateX(-Math.PI / 2);
  const mat = new THREE.MeshBasicMaterial({ color: ROJO, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide });
  const anillo = new THREE.Mesh(geo, mat), centro = new THREE.Mesh(disco, mat.clone());
  anillo.add(centro); anillo.position.set(x, y + 0.06, z); anillo.renderOrder = 13;
  g.scene.add(anillo);
  const f = { m: anillo, t: 0, dur, caida: true };
  (g.fxGolpes ||= []).push(f);
  g.audio.play('swish', { pos: { x, y: y + 1, z }, vol: 0.25, pitch: 0.45 });
  return f;
}
// el que salta cayó: el anillo se va en ese momento (con dur de sobra, así dura justo el amago más el vuelo)
export function apagarAviso(f) { if (f) f.t = Math.max(f.t, f.dur); }
export function brilloRojo(m, g) {
  marcarAviso(g, m, 0.6);
  const v = new THREE.Vector3(m.body.pos.x, m.body.pos.y + (m.kind.h || 1) * 0.8, m.body.pos.z);
  brillo(g, v, 0.9, ROJO);
  g.audio.play('armadura.metal', { pos: m.soundPos(), vol: 0.25, pitch: 1.5 });
}
// al cambiar de mundo: los avisos que quedaban (anillos, carriles, brillos) se van ya, no al cumplir su tiempo en el mundo nuevo
export function limpiarFxGolpes(g) {
  for (const f of g.fxGolpes || []) { g.scene.remove(f.m); f.m.traverse((o) => { if (o.geometry && (f.arco || f.carril || f.caida)) o.geometry.dispose(); if (o.material) o.material.dispose(); }); }
  g.fxGolpes = [];
}
export function tickFxGolpes(g, dt) {
  if (!g.fxGolpes || !g.fxGolpes.length) return;
  // lo que nace mientras se recorre (el brillo rojo del carril) va a una lista nueva, para no perderlo al filtrar
  const lista = g.fxGolpes;
  g.fxGolpes = [];
  const quedan = lista.filter((f) => {
    f.t += dt;
    const k = Math.min(1, f.t / f.dur);
    if (f.carril) {
      const q = f.quien;
      if (!q || q.dead || q.dying) f.t = f.dur;
      else {
        f.m.position.set(q.body.pos.x, q.body.pos.y + 0.06, q.body.pos.z); f.m.rotation.y = q.yaw || 0;
        f.m.material.opacity = (0.12 + 0.3 * k) * (0.8 + 0.2 * Math.sin(f.t * 22));
        if (!f.avisado && f.dur - f.t < ventana(g)) { f.avisado = true; brilloRojo(q, g); }
      }
    } else if (f.caida) {
      const e = (0.15 + 0.35 * k) * (0.75 + 0.25 * Math.sin(f.t * 18));
      f.m.material.opacity = e; f.m.children[0].material.opacity = e * 0.35;
      f.m.scale.setScalar(1.15 - k * 0.15);
    } else if (f.brillo) { const e = Math.sin(k * Math.PI); f.m.scale.setScalar(f.tam * (0.4 + e * 1.1)); f.m.material.opacity = e; f.m.material.rotation = k * 1.2; }
    else { f.m.material.opacity = 0.6 * (1 - k); f.m.scale.setScalar(0.88 + k * 0.16); }
    if (k < 1) return true;
    g.scene.remove(f.m);
    f.m.traverse((o) => { if (o.geometry && (f.arco || f.carril || f.caida)) o.geometry.dispose(); if (o.material) o.material.dispose(); });
    return false;
  });
  g.fxGolpes = quedan.concat(g.fxGolpes);
}

// avanza el ataque: frena a la criatura, la mantiene mirando, avisa, suelta y resuelve el daño
export function tickGolpe(m, g, dt) {
  const A = m.atk;
  if (!A) { m.reboteT = Math.max(0, (m.reboteT || 0) - dt); return; }
  const T = m.objetivo || g.player; // v12.14.0 (F4): a quién va el golpe (con invitados puede ser otra persona; las que no reapuntan, el jugador local)
  const propio = T === g.player;
  if ((m.stunT || 0) > 0 || !T.alive) { m.atk = null; return; }
  A.t += dt;
  const b = m.body.pos, p = T.body.pos, dx = p.x - b.x, dz = p.z - b.z, impacto = A.prep + A.suelta * 0.6;
  // sigue a uno mientras se carga; ya cargado queda comprometido, y ahí es cuando uno se puede quitar
  if (A.t < A.prep * 0.6) { A.mira = Math.atan2(dx, dz); m.targetYaw = A.mira; }
  else m.targetYaw = A.mira;
  if (!m.kind.flying) m.moving = false;
  if (!A.aviso && A.t >= impacto - ventana(g)) {
    A.aviso = true;
    brillo(g, puntoGolpe(m, A), 0.55 + (m.kind.h || 1) * 0.12, A.o.esquivar ? ROJO : DORADO);
    g.audio.play('armadura.metal', { pos: m.soundPos(), vol: 0.22, pitch: 2.1 });
    // si viene de un lado que uno no está viendo, la marca roja avisa de dónde
    const y = T.yaw, dd = Math.hypot(dx, dz) || 1;
    if (propio && (-dx / dd) * -Math.sin(y) + (-dz / dd) * -Math.cos(y) > -0.45) g.ui.golpeDesde(-dx, -dz, y);
  }
  if (!A.solto && A.t >= A.prep) {
    A.solto = true;
    const lunge = A.o.lunge ?? (A.tipo === 'embiste' || A.tipo === 'mordida' || A.tipo === 'latigazo' ? 8 : 5);
    m.body.vel.x += Math.sin(A.mira) * lunge; m.body.vel.z += Math.cos(A.mira) * lunge;
    m.sqV = (m.sqV || 0) - 4;
    g.audio.play('swish', { pos: m.soundPos(), vol: 0.5, pitch: A.tipo === 'mazazo' ? 0.6 : 1 });
    const h = m.kind.h || 1, radio = 0.9 + (m.kind.w || 0.6) * 0.5;
    if (POSES[A.tipo] && A.tipo !== 'estocada') arcoGolpe(g, b.x + Math.sin(A.mira) * 0.25, b.y + h * 0.62, b.z + Math.cos(A.mira) * 0.25, A.mira, A.tipo === 'tajo' || A.tipo === 'mazazo', radio);
    if (A.o.alSoltar) A.o.alSoltar();
  }
  if (!A.pego && A.t >= impacto) {
    A.pego = true;
    const o = A.o, alcance = (o.alcance ?? 1.4 + (m.kind.w || 0.6) * 0.5) + 0.6, d = Math.hypot(dx, dz) || 0.01;
    const frente = (dx / d) * Math.sin(A.mira) + (dz / d) * Math.cos(A.mira);
    const llega = d < alcance && Math.abs(p.y - b.y) < (o.altura ?? 2) && (frente > 0.15 || d < 0.9 || m.kind.boss);
    m.attackCd = o.cd ?? 1.1;
    if (llega && o.dano) { g.atacante = m; try { g.damagePlayer(o.dano, b.x, b.z, o.causa || `Golpe de ${m.kind.name}`, false, o.armored !== false, propio ? null : T); } finally { g.atacante = null; } } // v12.5.2: quién pega viaja aparte (jefeDelGolpe)
    if (!llega) m.attackCd += 0.35; // se fue al aire: se queda un momentito descubierta
    if (o.alGolpe) o.alGolpe(llega);
  }
  if (A.t >= A.prep + A.suelta + A.sigue) {
    m.atk = null;
    if (A.cadena > 1 && T.alive) { const siguiente = A.o.tipo ? A.tipo : tipoPara(m); atacar(m, g, { ...A.o, tipo: siguiente, prep: Math.max(0.3, A.prep * 0.68), cadena: A.cadena - 1, cd: (A.o.cd ?? 1.1) + 0.35 }); }
  }
}
// para los que se preparan por su cuenta (las voladoras): el mismo brillo en el momento justo
export function brilloAmago(m, g) {
  marcarAviso(g, m, 0.6);
  const v = new THREE.Vector3(m.body.pos.x, m.body.pos.y + (m.kind.h || 1) * 0.75, m.body.pos.z);
  brillo(g, v, 0.75);
  g.audio.play('armadura.metal', { pos: m.soundPos(), vol: 0.22, pitch: 2.1 });
}

// la curva del movimiento: 0 en reposo, 1 cargado, -1 al final del golpe
function curva(A) {
  if (A.t < A.prep) { const k = A.t / A.prep; return k < 0.72 ? suave(k / 0.72) : 1 + Math.sin(A.t * 55) * 0.012; }
  const t2 = A.t - A.prep;
  if (t2 < A.suelta) { const k = t2 / A.suelta; return 1 - 2 * k * k; }
  const k = Math.min(1, (t2 - A.suelta) / A.sigue);
  return -(1 - suave(k));
}
const mezclar = (a, b, k) => a + (b - a) * k;
function poseBrazo(br, q, k, lado) {
  br.rotation.x = mezclar(br.rotation.x, q.x, k);
  br.rotation.z = mezclar(br.rotation.z, q.z * lado, k);
  if (br.junta && br.children.length <= 2) br.junta.rotation.x = mezclar(br.junta.rotation.x, q.c, k);
}

// aplica la pose encima de lo que ya animó la criatura (va de último en cada cuadro)
export function poseGolpe(m) {
  const u = m.group.userData, body = u.body, cab = cabezaDe(u), br = brazosDe(u), patas = patasDe(u);
  // aturdida: se tambalea con la cabeza caída y los brazos flojos
  if ((m.stunT || 0) > 0 && !m.dying) {
    if (body) { body.rotation.z += Math.sin(m.t * 6.5) * 0.11; body.rotation.x += 0.12; }
    if (cab) cab.rotation.x += 0.42 + Math.sin(m.t * 4) * 0.08;
    if (br) br.forEach((a, i) => { a.rotation.x = mezclar(a.rotation.x, 0.15, 0.8); a.rotation.z = mezclar(a.rotation.z, (i ? 1 : -1) * 0.22, 0.8); });
  }
  // el rebote del parry: el golpe le devuelve el brazo y se va para atrás
  if ((m.reboteT || 0) > 0) {
    const k = Math.min(1, m.reboteT / 0.3);
    if (body) body.rotation.x -= 0.4 * k;
    if (br) br.forEach((a, i) => { a.rotation.x = mezclar(a.rotation.x, -2.3, k); a.rotation.z = mezclar(a.rotation.z, (i ? 1 : -1) * 0.75, k); });
    if (cab) cab.rotation.x -= 0.3 * k;
  }
  const A = m.atk;
  if (!A) return;
  const a = curva(A), adelante = a > 0 ? -a * 0.1 : -a * 0.26, G = m.group, tam = Math.min(1.6, 0.6 + (m.kind.h || 1) * 0.3);
  G.position.x += Math.sin(m.yaw || 0) * adelante * tam;
  G.position.z += Math.cos(m.yaw || 0) * adelante * tam;
  const tilt = a > 0 ? -a * 0.24 : -a * 0.34; // se echa para atrás y se va encima
  if (body) body.rotation.x += tilt;
  // en dos patas la inclinación es del tronco: las piernas se quedan abajo y dan el paso
  if (u.legs && u.legs.length === 2) u.legs.forEach((l, i) => {
    const adelanta = i === A.brazo ? 0 : 1, paso = Math.abs(a) * (a > 0 ? 0.22 : 0.42);
    l.rotation.x = -tilt + (adelanta ? -paso : paso * 0.8);
    if (l.junta) l.junta.rotation.x = Math.max(l.junta.rotation.x, adelanta ? paso * 0.9 : paso * 0.35);
  });
  m.sq = Math.max(m.sq || 0, a > 0 ? a * 0.08 : 0); // se encoge al cargar, como un resorte
  const P = POSES[A.tipo];
  if (P && br) {
    const k = Math.abs(a), q = a >= 0 ? P.U : P.D;
    br.forEach((brazo, i) => {
      const lado = i ? 1 : -1;
      if (i === A.brazo || P.ambos) poseBrazo(brazo, q, k, lado);
      else { brazo.rotation.x = mezclar(brazo.rotation.x, 0.55 * a, k); brazo.rotation.z = mezclar(brazo.rotation.z, 0.2 * lado, k); } // el otro compensa
    });
    if (body) body.rotation.y += P.giro * a * (A.brazo ? -1 : 1);
    if (cab) cab.rotation.y += P.giro * a * (A.brazo ? 0.6 : -0.6);
    return;
  }
  // los de cuatro patas y los bichos: se agazapan con la cabeza atrás y sueltan el mordisco
  if (A.tipo === 'cornada') { if (cab) cab.rotation.x += a > 0 ? a * 0.65 : a * 0.8; } else if (cab) cab.rotation.x += -a * 0.55;
  if (A.tipo === 'latigazo' && cab) { cab.position.y += Math.max(0, a) * 0.28 * tam; cab.position.z += -a * 0.3 * tam; }
  if (body && patas) body.position.y -= Math.max(0, a) * 0.1 * tam;
  if (patas) patas.forEach((l, i) => { const q = l && (l.rotation ? l : l.piv || l.p), delante = i < patas.length / 2; if (q && q.rotation) q.rotation.x += delante ? -a * 0.4 : a * 0.3; }); // algunos guardan la pata adentro de un objeto
  for (const pinza of [].concat(u.pinzas || [], u.grande || [], u.queli || [], u.garras || [], u.brazos || [])) if (pinza && pinza.rotation) pinza.rotation.x += -a * 0.7;
  if (u.dedo) u.dedo.rotation.x += a > 0 ? a * 0.6 : 0;
  if (u.tail && u.tail.rotation) u.tail.rotation.x += a * 0.3;
}
