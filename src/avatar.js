// El personaje en el mundo (para la cámara en tercera persona, F5 o P): el mismo tico del vestidor, con su armadura
// puesta, que camina balanceando brazos y piernas, se agacha, mira hacia donde uno mira, pega con el brazo derecho
// y va sentado cuando monta caballo, carro o bus.
import { curvaLuz } from './brillo.js';
import { curvaGolpe, movidaDe } from './armasmano.js';
import { POSE_ESTELA, POSES_JUGADOR } from './golpes.js';
import { doblarRodilla, doblarCodo } from './anatomia.js';
import { saquito } from './sacos.js';
import * as THREE from 'three';
import { BLOCKS, isBlockId } from './blocks.js';
import { Vestidor } from './vestidor.js';
import { tintModel, makeHeldItemMesh } from './models.js';
import { poseMuerte } from './muerte.js';
import { alasAvatar, posePlaneo } from './alas.js';
import { itemCanvas, tileCanvas } from './textures.js';
import { tipoAgarre, TAM_3P } from './agarre.js';

const S = 0.9; // el jugador mide 1,8; el muñeco del vestidor, 2

// el mundo no tiene luces de escena (todo se tiñe a mano): los materiales del vestidor pasan a ser planos
function basicify(root) {
  const plano = (m) => { if (m.isMeshBasicMaterial) return m; const n = new THREE.MeshBasicMaterial({ map: m.map || null, vertexColors: !!m.vertexColors, transparent: false }); m.dispose(); return n; };
  root.traverse((o) => {
    if (!o.isMesh) return;
    o.material = Array.isArray(o.material) ? o.material.map(plano) : plano(o.material); // el personaje trae una textura por cara (personaje.js)
  });
}

const PX = 1 / 16;

// muneca: cuánto gira la hoja hacia adelante al llegar a D (la mano la lleva de apuntar arriba-atrás a apuntar adelante)
const SIN_ARMA = { heavy: false };

// v11.11.2: la mochila de cuero en la espalda (si la lleva en el inventario): cuelga del torso, así sigue cada pose
function mochilaCuero() {
  const g = new THREE.Group(), U = 1 / 16;
  const caja = (w, h, d, col, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshBasicMaterial({ color: col })); m.position.set(x, y, z); g.add(m); return m; };
  caja(5 * U, 5.6 * U, 1.9 * U, 0x7a4a24, 0, 7.4 * U, -3.05 * U); // el cuerpo
  caja(5.2 * U, 1.8 * U, 2.1 * U, 0x5e3618, 0, 9.6 * U, -3.1 * U); // la tapa
  caja(3 * U, 2 * U, 0.6 * U, 0x6a3e1e, 0, 6.6 * U, -4.2 * U); // la bolsa de afuera
  caja(0.7 * U, 0.7 * U, 0.3 * U, 0xc8a040, 0, 8.6 * U, -4.2 * U); // la hebilla
  for (const s of [-1, 1]) {
    caja(0.8 * U, 5.4 * U, 0.4 * U, 0x4a2a12, s * 1.6 * U, 9.8 * U, -2.1 * U); // los tirantes, por la espalda
    caja(0.8 * U, 0.5 * U, 4.9 * U, 0x4a2a12, s * 1.6 * U, 12.6 * U, 0.2 * U); // sobre el hombro
    caja(0.8 * U, 4 * U, 0.4 * U, 0x4a2a12, s * 1.6 * U, 10.6 * U, 2.6 * U); // y por delante (el pecho llega a 2.6)
  }
  return g;
}

// lo que lleva en la mano (v13.3.1): el dibujo del ítem EXTRUIDO (un cubito por píxel, models.js) o un cubito con la textura del bloque.
// La geometría se arma una vez por ítem y se comparte entre todos los avatares (el material es de cada uno, para que cada quien se tiña con su luz).
// Herramientas y armas: el mango queda DENTRO del puño y la hoja sale hacia adelante y arriba; en reposo se ve de lado, como se sostiene de verdad.
const HELD_GEO = new Map();
const PUNO = { x: -0.75 * PX, y: -11.3 * PX, z: 0.15 * PX }; // dónde cierra la mano derecha, en el espacio del brazo (brazoHumano: palma en y -10.7, dedos hasta -12.95)
export const AGARRE_3P = { inclina: -0.12, grueso: 1.7 }; // inclina: giro extra de la hoja (negativo la sube); grueso: cuánto se engruesa el dibujo
function heldBase(id, tam) {
  const k = id + ':' + tam;
  let e = HELD_GEO.get(k);
  if (!e) { const m = makeHeldItemMesh(id, tam * PX); e = { geo: m.geometry, agarre: m.userData.agarre || null }; m.material.dispose(); HELD_GEO.set(k, e); }
  const mesh = new THREE.Mesh(e.geo, new THREE.MeshBasicMaterial({ vertexColors: true }));
  mesh.userData.agarre = e.agarre;
  return mesh;
}
// suelta lo que se llevaba: los materiales y texturas propias; la geometría de los ítems es compartida y no se toca
export function soltarHeld(obj) {
  if (!obj) return;
  if (obj.parent) obj.parent.remove(obj);
  obj.traverse((o) => { if (!o.isMesh) return; if (!o.userData.compartida) o.geometry.dispose(); const ms = Array.isArray(o.material) ? o.material : [o.material]; ms.forEach((m) => { if (m.map) m.map.dispose(); m.dispose(); }); });
}
export function heldMesh(id) { // exportada para tools/revisar-modelos.js
  const nearest = (cv) => { const t = new THREE.CanvasTexture(cv); t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; t.colorSpace = THREE.SRGBColorSpace; return t; };
  const w = new THREE.Group();
  if (isBlockId(id)) {
    const b = BLOCKS[id];
    const name = typeof b.tex === 'string' ? b.tex : b.tex && (b.tex.side || b.tex.top);
    const cv = name && tileCanvas(name);
    if (!cv) return null;
    // el bloque chico va en el puño, apoyado sobre los dedos y asomando por delante (no flota)
    const m = new THREE.Mesh(new THREE.BoxGeometry(5 * PX, 5 * PX, 5 * PX), new THREE.MeshBasicMaterial({ map: nearest(cv), alphaTest: 0.5 }));
    m.rotation.set(0, 0.5, 0);
    w.add(m); w.position.set(PUNO.x + 0.2 * PX, PUNO.y + 0.3 * PX, PUNO.z + 2.5 * PX);
    return w;
  }
  const cv = itemCanvas(id);
  if (!cv) return null;
  // el tamaño y la pose según el tipo de objeto (agarre.js)
  const tipo = tipoAgarre(id), s = TAM_3P[tipo] || 11;
  const m = heldBase(id, s);
  m.userData.compartida = true;
  w.add(m);
  if (tipo === 'herramienta') {
    const ag = m.userData.agarre;
    m.scale.z = AGARRE_3P.grueso;
    if (ag) m.position.set(-ag.p[0], -ag.p[1], 0);
    // la lámina queda en el plano de adelante-arriba (el filo mira adelante) y el mango se cierra dentro del puño
    w.rotation.set(AGARRE_3P.inclina, -Math.PI / 2, 0);
    w.userData.rot0 = AGARRE_3P.inclina; // el giro de reposo: la muñeca lo suma durante el golpe
    w.position.set(PUNO.x, PUNO.y, PUNO.z);
  } else if (tipo === 'escudo') { w.position.set(2.4 * PX, -9 * PX, 0); w.rotation.set(0, Math.PI / 2, 0); } // al costado del antebrazo
  else {
    // lo demás sale de la mano por el borde de abajo: chico y de frente; el papel, inclinado como para leerlo; el recipiente, de pie
    w.position.set(0.3 * PX, (-12.2 + s * 0.42) * PX, (tipo === 'plano' ? 3.4 : 2.4) * PX);
    w.rotation.set(tipo === 'plano' ? -0.7 : tipo === 'recipiente' ? 0 : -0.15, 0, 0);
  }
  return w;
}


export class Avatar {
  constructor(scene) {
    this.root = new THREE.Group();
    this.root.visible = false;
    scene.add(this.root);
    // se usa el armado del vestidor sobre un «vestidor» de mentiras que pone el muñeco en este grupo
    const host = Object.create(Vestidor.prototype);
    host.scene = this.root; host.pieces = [null, null, null, null, null]; host.anims = [];
    host.buildAvatar();
    host.avatar.scale.setScalar(S);
    basicify(this.root);
    this.host = host;
    this.P = host.P;
    this.sig = '';
    this.walk = 0;
  }

  update(dt, g, visible) {
    this.root.visible = visible;
    if (!visible) return;
    const p = g.player, b = p.body.pos, P = this.P, h = this.host;
    // la apariencia que escogió en el vestidor (meta.apariencia): se rearma cuando cambia
    // el vestidor la reemplaza entera (ui.js), así que basta con mirar la referencia: el JSON solo se arma cuando cambia
    const apRef = (g.meta && g.meta.apariencia) || null;
    if (apRef !== this.apRef) {
      this.apRef = apRef;
      const apK = JSON.stringify(apRef || {});
      if (apK !== this.apK) { this.apK = apK; h.apariencia(JSON.parse(apK)); basicify(this.root); this.sig = ''; }
    }
    // armadura: se rearma cuando cambia (la firma solo se arma si algún id cambió, para no crear cadenas en cada cuadro)
    const ids = (this.armIds ||= []), arm = g.inventory.armor;
    let cambio = this.sig === '' || ids.length !== arm.length;
    for (let i = 0; i < arm.length && !cambio; i++) if ((arm[i] ? arm[i].id : 0) !== ids[i]) cambio = true;
    if (cambio) { ids.length = arm.length; arm.forEach((a, i) => { ids[i] = a ? a.id : 0; }); this.sig = ids.join(','); h.setArmor(arm, false); basicify(this.root); }
    this.agacho = (this.agacho || 0) + ((p.sneaking ? 0.12 : 0) - (this.agacho || 0)) * Math.min(1, dt * 14); // v12.2.0: agacharse sin golpe
    this.root.position.set(b.x, b.y - this.agacho, b.z);
    // en el modo foto la cámara gira libre: el personaje se queda como estaba
    const yaw = g.foto ? g.foto.yaw : p.yaw, pitch = g.foto ? g.foto.pitch : p.pitch;
    this.root.rotation.order = 'YXZ';
    this.root.rotation.y = yaw + Math.PI;
    // en la avioneta el piloto se ladea y cabecea junto con el avión
    const av = g.riding && g.riding.type === 'avioneta' ? g.riding.data : null;
    this.root.rotation.z = av ? (av.roll || 0) : 0;
    this.root.rotation.x = av ? -(av.pitch || 0) : (g.sentado && g.meceAng) || 0; // v12.4.0: en la mecedora, el cuerpo se mece
    // lo que tiene en la mano
    const held = g.inventory.held ? g.inventory.held.id : 0;
    if (held !== this.heldId) {
      this.heldId = held;
      if (this.heldObj) { soltarHeld(this.heldObj); this.heldObj = null; }
      const m = held ? heldMesh(held) : null;
      if (m) { const j = P.armR.junta; m.userData.held = true; if (j) { m.position.sub(j.position); j.add(m); } else P.armR.add(m); this.heldObj = m; } // cuelga del antebrazo: se dobla con el codo
    }
    // la mochila: se ve si la lleva (en la barra o en el inventario)
    const lleva = !!(g.inventory && g.inventory.count(447) > 0);
    if (lleva && !this.mochila) { this.mochila = mochilaCuero(); P.body.add(this.mochila); }
    if (this.mochila) this.mochila.visible = lleva;
    if (g.muerte) { poseMuerte(this, g, dt); return; }
    // caminar (el balanceo arranca y para suave, no de golpe)
    const sp = Math.hypot(p.body.vel.x, p.body.vel.z);
    const riding = !!(g.riding || g.zip || g.monta);
    const surf = !!g.surf, colgado = !!(g.zip || g.parapente);
    const t = g.clock || 0;
    const enAire = !p.body.onGround && !riding && !surf && !colgado && !p.body.inWater && !p.flying && !g.saco;
    // en la carrera de sacos: el saco hasta la cintura y las piernas juntas
    if (g.saco && !this.saco) { this.saco = saquito(0.82); this.saco.position.y = 0.42; this.root.add(this.saco); }
    if (!g.saco && this.saco) { this.root.remove(this.saco); this.saco = null; }
    this.walk += sp * dt * 2.6;
    const ampMeta = riding || surf || colgado || enAire || g.saco ? 0 : Math.min(1, sp / 4.3) * (p.sprinting ? 1.2 : 0.8);
    this.amp = (this.amp || 0) + (ampMeta - (this.amp || 0)) * Math.min(1, dt * 10);
    const amp = this.amp;
    const sw = Math.sin(this.walk) * amp;
    const k = (v, meta, vel = 12) => v + (meta - v) * Math.min(1, dt * vel);
    // en el aire: piernas un poquito abiertas y brazos que se levantan al caer
    this.aire = k(this.aire || 0, enAire ? 1 : 0, 8);
    const cae = enAire ? Math.max(0, Math.min(1, -p.body.vel.y / 12)) : 0;
    this.surfK = k(this.surfK || 0, surf ? 1 : 0, 6);
    const sentado = riding || !!g.parapente || !!g.sentado; // v12.2.0: en la silla también
    const mece = g.parapente ? Math.sin(t * 1.8) * 0.12 : 0;
    let legX = sentado ? -1.4 + mece : sw + this.aire * 0.25, legZ = sentado ? 0.12 : this.aire * 0.08 + this.surfK * 0.22;
    P.legL.rotation.x = k(P.legL.rotation.x, legX, 18);
    legX = sentado ? -1.4 - mece : -sw - this.aire * 0.2;
    // v12.3.0 (pendiente de C2): con cojera, la pierna derecha casi no se dobla y el cuerpo se hunde al pisar con ella
    if (!sentado && p.effects && p.effects.cojera) { legX *= 0.35; this.root.position.y -= Math.max(0, -sw) * 0.06; }
    P.legR.rotation.x = k(P.legR.rotation.x, legX, 18);
    P.legL.rotation.z = k(P.legL.rotation.z, legZ, 10); P.legR.rotation.z = k(P.legR.rotation.z, -legZ, 10);
    // rodillas: al paso se doblan, al correr más, agachado y en el aire también
    const rod = (p.sprinting ? 1.25 : 0.85) * Math.min(1, amp * 1.3), agacha = (p.sneaking ? 0.5 : 0) + this.surfK * 0.45, aireK = this.aire * (1 - cae * 0.7);
    doblarRodilla(P.legL, this.walk, rod, dt, Math.max(aireK, agacha / 0.55));
    doblarRodilla(P.legR, this.walk + Math.PI, rod, dt, Math.max(aireK * 0.8, agacha / 0.55));
    // v11.11.2: barrerse: piernas adelante (una más doblada), y el muñeco entero se echa para atrás y baja (se inclina el grupo
    // completo, no el torso: brazos y cabeza son hermanos del cuerpo y se despegarían)
    this.barreK = k(this.barreK || 0, g.slide && g.slide.t > 0 ? 1 : 0, 14);
    const fig = this.host && this.host.avatar;
    if (this.barreK > 0.01) {
      const b = this.barreK;
      P.legL.rotation.x += (-1.45 - P.legL.rotation.x) * b; P.legR.rotation.x += (-0.95 - P.legR.rotation.x) * b;
      if (P.legR.junta) P.legR.junta.rotation.x += (1.0 - P.legR.junta.rotation.x) * b;
      if (P.legL.junta) P.legL.junta.rotation.x *= 1 - b;
      if (fig) fig.rotation.x = -0.55 * b;
      this.root.position.y -= 0.42 * b;
      this.barriendo = true;
    } else if (this.barriendo) { if (fig) fig.rotation.x = 0; this.barriendo = false; }
    // brazos: balanceo, golpe con el derecho, agarrados arriba en la tirolesa y el parapente, abiertos en la tabla
    if (colgado) {
      // en la tirolesa, agarrados arriba; en el parapente, las manos en los frenos (y tiran del lado al que dobla)
      const freno = g.parapente ? Math.max(-0.4, Math.min(0.4, (g.parapente.roll || 0) * 1.2)) : 0;
      const arriba = g.parapente ? Math.PI - 0.55 : Math.PI - 0.15;
      P.armL.rotation.x = k(P.armL.rotation.x, arriba + Math.max(0, freno), 10); P.armR.rotation.x = k(P.armR.rotation.x, arriba + Math.max(0, -freno), 10);
      P.armL.rotation.z = k(P.armL.rotation.z, g.parapente ? -0.35 : -0.25, 10); P.armR.rotation.z = k(P.armR.rotation.z, g.parapente ? 0.35 : 0.25, 10);
    } else if (surf) {
      const eq = Math.sin(t * 2.3) * 0.15;
      P.armL.rotation.x = k(P.armL.rotation.x, -0.2, 8); P.armR.rotation.x = k(P.armR.rotation.x, -0.2, 8);
      P.armL.rotation.z = k(P.armL.rotation.z, -1.25 + eq, 8); P.armR.rotation.z = k(P.armR.rotation.z, 1.25 + eq, 8);
    } else {
      const respira = Math.sin(t * 1.6) * 0.04 * (1 - amp);
      P.armL.rotation.x = k(P.armL.rotation.x, -sw * 0.9 - cae * 2.2 - (g.blocking ? 1.2 : 0), 16);
      P.armL.rotation.z = k(P.armL.rotation.z, -0.05 - respira - this.aire * 0.25, 12);
      P.armR.rotation.x = sw * 0.9 - (g.blocking ? 1.1 : 0) - cae * 2.2;
      P.armR.rotation.z = k(P.armR.rotation.z, 0.05 + respira + this.aire * 0.25, 12);
    }
    // v13.5.9 (PU-24): nadar (brazada alterna y patada) y trepar la cuerda (manos alternas arriba) tienen pose propia en 3.ª persona
    const nadando = p.body.inWater && !p.flying && !p.body.onGround && !riding && !surf && !colgado && !g.saco && sp > 0.4;
    const trepando = !!p.body.enCuerda && !riding && !colgado && !surf;
    if (nadando || trepando) {
      const ph = nadando ? t * 5 : t * 6 * (Math.abs(p.body.vel.y) > 0.3 ? 1 : 0), sa = Math.sin(ph);
      if (nadando) {
        P.armL.rotation.x = k(P.armL.rotation.x, -2.3 + sa * 0.9, 14); P.armR.rotation.x = -2.3 - sa * 0.9;
        P.armL.rotation.z = k(P.armL.rotation.z, -0.2, 10); P.armR.rotation.z = k(P.armR.rotation.z, 0.2, 10);
        P.legL.rotation.x = k(P.legL.rotation.x, Math.sin(ph * 1.6) * 0.5, 18); P.legR.rotation.x = k(P.legR.rotation.x, -Math.sin(ph * 1.6) * 0.5, 18);
      } else {
        P.armL.rotation.x = k(P.armL.rotation.x, -2.6 + sa * 0.5, 14); P.armR.rotation.x = -2.6 - sa * 0.5;
        P.armL.rotation.z = k(P.armL.rotation.z, -0.1, 10); P.armR.rotation.z = k(P.armR.rotation.z, 0.1, 10);
        P.legL.rotation.x = k(P.legL.rotation.x, -0.5 - sa * 0.5, 18); P.legR.rotation.x = k(P.legR.rotation.x, -0.5 + sa * 0.5, 18);
      }
    }
    // los codos: libres si no agarra nada; el izquierdo lleva el escudo y el derecho lo que tenga en la mano
    doblarCodo(P.armL, dt, !g.inventory.armor[4] && !colgado && !surf);
    doblarCodo(P.armR, dt, !colgado && !surf);
    // el golpe: el brazo se arma y suelta, el cuerpo gira y las piernas dan el paso
    const conArma = !!g.golpeAnim;
    const aG = conArma ? curvaGolpe(g) : (g.swing > 0 ? curvaGolpe({ golpeAnim: SIN_ARMA, swing: g.swing }) : 0);
    if (aG && !colgado && !surf && !riding) {
      const A = g.golpeAnim || SIN_ARMA, M = conArma ? movidaDe(A) : null, dir = M ? M.estela : 1, Q = conArma ? (POSES_JUGADOR[POSE_ESTELA[dir]] || POSES_JUGADOR.lateral) : POSES_JUGADOR.trabajo, izq = M && M.izq, brazo = izq ? P.armL : P.armR, k2 = Math.abs(aG), q = aG >= 0 ? Q.U : Q.D, lado = izq ? -1 : 1, H = A.heavy ? 1.15 : 1;
      brazo.rotation.x += (q.x * H - brazo.rotation.x) * k2;
      brazo.rotation.z += (q.z * lado - brazo.rotation.z) * k2;
      if (brazo.junta) brazo.junta.rotation.x += (q.c - brazo.junta.rotation.x) * k2;
      P.body.rotation.y = Q.giro * aG * (izq ? 1 : -1);
      P.head.rotation.y = -Q.giro * aG * (izq ? 0.5 : -0.5);
      const paso = k2 * (aG > 0 ? 0.25 : 0.5);
      P.legL.rotation.x = P.legL.rotation.x + (-paso - P.legL.rotation.x) * k2;
      P.legR.rotation.x = P.legR.rotation.x + (paso * 0.8 - P.legR.rotation.x) * k2;
      if (P.legL.junta) P.legL.junta.rotation.x = Math.max(P.legL.junta.rotation.x, paso * 0.9);
    } else if (!colgado) P.body.rotation.y = k(P.body.rotation.y, 0, 10);
    // la muñeca: la hoja acompaña el golpe (en reposo vuelve a su giro)
    if (this.heldObj && this.heldObj.userData.rot0 !== undefined) {
      let mu = 0;
      if (aG < 0 && !colgado && !surf && !riding) mu = -aG * ((g.golpeAnim ? (POSES_JUGADOR[POSE_ESTELA[(movidaDe(g.golpeAnim) || { estela: 1 }).estela]] || POSES_JUGADOR.lateral) : POSES_JUGADOR.trabajo).muneca || 0);
      this.heldObj.rotation.x = this.heldObj.userData.rot0 + mu;
    }
    // recibir un golpe: el tronco acusa; cubrirse: el codo se cierra; el parry bota el brazo del escudo hacia afuera
    if ((g.handGolpe || 0) > 0) P.body.rotation.x -= g.handGolpe * 0.28;
    if (g.blocking && P.armL.junta) P.armL.junta.rotation.x = k(P.armL.junta.rotation.x, -1.35, 16);
    if ((g.parryT || 0) > 0) P.armL.rotation.z -= g.parryT * 1.5;
    // tocar algo: la mano se estira; comer: a la boca
    if ((g.manoT || 0) > 0) { const k3 = Math.sin((1 - g.manoT / 0.3) * Math.PI); P.armR.rotation.x += (-1.45 - P.armR.rotation.x) * k3; if (P.armR.junta) P.armR.junta.rotation.x += (-0.2 - P.armR.junta.rotation.x) * k3; }
    if (g.eating) { const beb = BLOCKS[g.eating.id] && BLOCKS[g.eating.id].sip; const mast = beb ? 0 : Math.sin(t * 16) * 0.08; if (beb) P.head.rotation.x = -0.45; /* v13.5.9 (PU-25): beber = trago con la cabeza hacia atrás, sin masticar */ P.armR.rotation.x = -2 + mast; P.armR.rotation.z = -0.45; if (P.armR.junta) P.armR.junta.rotation.x = -1.8; }
    // la cabeza mira hacia donde uno mira; agachado se inclina el cuerpo; corriendo se va hacia adelante
    P.head.rotation.x = -pitch * 0.8; P.head.rotation.y = 0;
    // lo que lleva en la mano no se ve mientras vuela, surfea o maneja
    if (this.heldObj) this.heldObj.visible = !(g.parapente || g.surf || g.riding);
    const inclina = (p.sneaking ? 0.35 : 0) + (p.sprinting ? amp * 0.12 : 0) + this.surfK * 0.25;
    P.body.rotation.x = k(P.body.rotation.x, inclina, 10);
    P.body.rotation.z = k(P.body.rotation.z, Math.sin(this.walk) * 0.04 * amp + (surf ? Math.sin(t * 1.9) * 0.08 : 0), 10);
    // v13.3.5: el tronco se inclina alrededor de la cadera (y 0,75) y la cabeza y los hombros se van con él: antes el cuerpo se partía al agacharse
    { const R = (this.reposo ||= { head: P.head.position.clone(), armL: P.armL.position.clone(), armR: P.armR.position.clone() }), th = P.body.rotation.x, cs = Math.cos(th), sn = Math.sin(th), HIP = 0.75;
      for (const n of ['head', 'armL', 'armR']) { const r = R[n], q = P[n].position; q.x = r.x; q.y = HIP + (r.y - HIP) * cs - r.z * sn; q.z = (r.y - HIP) * sn + r.z * cs; } }
    // rebotito del paso (y agachado sobre la tabla)
    this.root.position.y += Math.abs(Math.cos(this.walk)) * 0.05 * amp - this.surfK * 0.12;
    // las alas del Rey en la espalda, y la pose de planear
    alasAvatar(this, g, dt); posePlaneo(this, g);
    // luz: igual que las criaturas (de día afuera, oscuro bajo techo)
    let covered = false;
    for (let y = Math.floor(b.y + 2) + 1; y < Math.floor(b.y) + 20; y++) if (BLOCKS[g.world.getBlock(Math.floor(b.x), y, Math.floor(b.z))].opaque) { covered = true; break; }
    tintModel(this.root, curvaLuz(Math.max(0.15, (covered ? 0.45 : 1) * g.daylight)), g.player.hurtFlash ? 0.6 : 0);
  }
}
