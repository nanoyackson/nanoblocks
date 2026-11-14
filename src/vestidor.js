// Vestidor del inventario: tu personaje en 3D sobre una tarima, que respira, mira el cursor y se puede girar
// arrastrando. Cada pieza de armadura entra con su propia animación (el casco baja, la pechera llega de frente,
// las botas y el pantalón suben), un destello al calzar, chispas y la cámara que se acerca a esa parte.
import * as THREE from 'three';
import { ITEMS } from './blocks.js';
import { armarPersonaje } from './personaje.js';
import { armarArmadura } from './armadura.js';

const easeOutBack = (t) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2; };
const easeOut = (t) => 1 - (1 - t) ** 3;
const SLOT_Y = [1.72, 1.12, 0.6, 0.16, 1.0]; // altura de cada parte (para la cámara y las chispas)

export class Vestidor {
  constructor(canvas, fxLayer) {
    this.canvas = canvas; this.fx = fxLayer;
    this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    this.renderer.setSize(canvas.clientWidth || 220, canvas.clientHeight || 280, false);
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(28, (canvas.clientWidth || 220) / (canvas.clientHeight || 280), 0.1, 30);
    this.scene.add(new THREE.HemisphereLight(0xfff4e0, 0x404858, 1.6));
    const sun = new THREE.DirectionalLight(0xffffff, 1.6); sun.position.set(2, 4, 3); this.scene.add(sun);
    const rim = new THREE.DirectionalLight(0x9fc4ff, 0.8); rim.position.set(-3, 2, -2); this.scene.add(rim);
    // tarima de madera
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.78, 0.86, 0.12, 32), new THREE.MeshLambertMaterial({ color: 0x7a5232 }));
    base.position.y = -0.06; this.scene.add(base);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.025, 8, 48), new THREE.MeshBasicMaterial({ color: 0xffd860 }));
    ring.rotation.x = Math.PI / 2; ring.position.y = 0.005; this.scene.add(ring);
    this.ring = ring;
    this.buildAvatar();
    this.pieces = [null, null, null, null, null];
    this.anims = [];
    this.yaw = -0.45; this.yawTarget = -0.45; this.drag = null; this.lastDrag = 0;
    this.mouse = { x: 0, y: 0 };
    this.zoom = { y: 1.0, d: 5.4, ty: 1.0, td: 5.4 };
    this.bounce = 0; this.t = 0;
    canvas.addEventListener('pointerdown', (e) => { this.drag = { x: e.clientX, yaw: this.yawTarget }; canvas.setPointerCapture(e.pointerId); });
    canvas.addEventListener('pointermove', (e) => {
      const r = canvas.getBoundingClientRect();
      this.mouse.x = ((e.clientX - r.left) / r.width) * 2 - 1; this.mouse.y = ((e.clientY - r.top) / r.height) * 2 - 1;
      if (this.drag) { this.yawTarget = this.drag.yaw + (e.clientX - this.drag.x) * 0.012; this.lastDrag = this.t; }
    });
    canvas.addEventListener('pointerup', () => { this.drag = null; });
    window.addEventListener('pointermove', (e) => {
      if (this.drag) return;
      const r = canvas.getBoundingClientRect();
      this.mouse.x = Math.max(-1.5, Math.min(1.5, ((e.clientX - r.left) / r.width) * 2 - 1));
      this.mouse.y = Math.max(-1.5, Math.min(1.5, ((e.clientY - r.top) / r.height) * 2 - 1));
    });
  }

  // personaje tico: piel morena, pelo negro, camisa celeste con cuello blanco, jeans y botas de trabajo, sombrero de paja
  buildAvatar() {
    const A = new THREE.Group();
    this.avatar = A; this.scene.add(A);
    const P = {};
    const part = (name, px, py, pz) => { const g = new THREE.Group(); g.position.set(px, py, pz); A.add(g); P[name] = g; return g; };
    part('head', 0, 1.5, 0); part('body', 0, 0.75, 0);
    part('armL', -0.375, 1.5, 0); part('armR', 0.375, 1.5, 0);
    part('legL', -0.125, 0.75, 0); part('legR', 0.125, 0.75, 0);
    // el personaje con sus texturas pintadas (personaje.js); los pivotes de arriba son los de siempre
    armarPersonaje(A, P, this.ap || {});
    this.hat = A.userData.hat;
    this.P = P;
  }

  pieceMeshes(slot, def) {
    const mat = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 1 });
    const out = armarArmadura(slot, def, this.P, mat);
    out.forEach((m) => { m.userData.base = m.position.clone(); });
    return { meshes: out, mat };
  }

  // poner la armadura; anim = true hace la entrada y la salida animadas
  setArmor(armor, anim = true) {
    for (let s = 0; s < 5; s++) {
      const id = armor[s] ? armor[s].id : null;
      const cur = this.pieces[s];
      if ((cur ? cur.id : null) === id) continue;
      if (cur) {
        if (anim) { cur.mat.transparent = true; cur.mat.needsUpdate = true; this.anims.push({ kind: 'out', slot: s, piece: cur, t: 0 }); }
        else this.removePiece(cur);
      }
      this.pieces[s] = null;
      if (id && ITEMS[id]) {
        const p = { id, ...this.pieceMeshes(s, ITEMS[id]) };
        this.pieces[s] = p;
        if (anim) { this.anims.push({ kind: 'in', slot: s, piece: p, t: 0 }); this.focus(s); } else this.applyIn(p, s, 1);
      }
    }
    this.hat.visible = !this.pieces[0] && !this.avatar.userData.sinSombrero;
  }

  // cambiar la apariencia (camisa, piel, pelo, sombrero): se rearma el personaje con los mismos pivotes
  apariencia(ap) {
    this.ap = ap || {};
    const quitar = [];
    this.avatar.traverse((o) => { if (o.userData.pj) quitar.push(o); });
    for (const o of quitar) { o.parent && o.parent.remove(o); o.traverse((q) => { if (q.isMesh) { q.geometry.dispose(); (Array.isArray(q.material) ? q.material : [q.material]).forEach((m) => m.dispose()); } }); }
    armarPersonaje(this.avatar, this.P, this.ap);
    this.hat = this.avatar.userData.hat;
    this.hat.visible = !this.pieces[0] && !this.avatar.userData.sinSombrero;
  }

  removePiece(p) { p.meshes.forEach((m) => { m.parent && m.parent.remove(m); m.geometry.dispose(); }); p.mat.dispose(); }

  focus(slot) {
    this.zoom.ty = SLOT_Y[slot]; this.zoom.td = 3.7; this.focusT = 1.1;
    this.yawTarget = Math.max(-0.5, Math.min(0.5, this.yawTarget * 0.3));
  }

  applyIn(p, slot, t) {
    const k = easeOutBack(Math.min(1, t / 0.7));
    const off = [[0, 1.1, 0], [0, 0.1, 0.9], [0, -0.6, 0.2], [0, -0.5, 0.3], [-0.8, 0, 0.4]][slot];
    const sc = slot === 1 ? 1.6 - 0.6 * k : 1.25 - 0.25 * k;
    p.meshes.forEach((m) => { m.position.set(m.userData.base.x + off[0] * (1 - k), m.userData.base.y + off[1] * (1 - k), m.userData.base.z + off[2] * (1 - k)); m.scale.setScalar(Math.max(0.01, sc)); });
    p.mat.opacity = Math.min(1, t * 4);
    // destello cuando calza
    p.mat.color.setScalar(1 + (t < 0.62 ? 0 : Math.max(0, 1.2 * (1 - (t - 0.62) / 0.38))));
    const translucida = t < 0.25; // ya calzada no entra al paso de lo transparente, que se ordena mal contra el agua
    if (p.mat.transparent !== translucida) { p.mat.transparent = translucida; p.mat.needsUpdate = true; }
  }

  sparks(slot, color) {
    if (!this.fx) return;
    const v = new THREE.Vector3(0, SLOT_Y[slot], 0.3).applyMatrix4(this.avatar.matrixWorld).project(this.camera);
    const x = (v.x * 0.5 + 0.5) * 100, y = (-v.y * 0.5 + 0.5) * 100;
    for (let i = 0; i < 18; i++) {
      const s = document.createElement('i');
      const a = (i / 18) * Math.PI * 2 + Math.random() * 0.3, d = 40 + Math.random() * 50;
      s.style.left = `${x}%`; s.style.top = `${y}%`;
      s.style.setProperty('--dx', `${Math.cos(a) * d}px`); s.style.setProperty('--dy', `${Math.sin(a) * d}px`);
      s.style.background = i % 3 ? color : 'var(--warn)';
      s.style.animationDelay = `${Math.random() * 0.08}s`;
      this.fx.appendChild(s);
      setTimeout(() => s.remove(), 900);
    }
    const ringEl = document.createElement('b');
    ringEl.style.left = `${x}%`; ringEl.style.top = `${y}%`; ringEl.style.borderColor = color;
    this.fx.appendChild(ringEl); setTimeout(() => ringEl.remove(), 700);
  }

  resize() {
    const w = this.canvas.clientWidth, h = this.canvas.clientHeight;
    if (!w || !h) return;
    if (this.size !== `${w}x${h}`) { this.size = `${w}x${h}`; this.renderer.setSize(w, h, false); this.camera.aspect = w / h; this.camera.updateProjectionMatrix(); }
  }

  update(dt) {
    this.t += dt;
    this.resize();
    // girar solo de vuelta a tres cuartos si nadie lo arrastra
    if (!this.drag && this.t - this.lastDrag > 2.5) this.yawTarget += (-0.45 - this.yawTarget) * Math.min(1, dt * 1.2);
    this.yaw += (this.yawTarget - this.yaw) * Math.min(1, dt * 10);
    this.avatar.rotation.y = this.yaw;
    // respira, balancea los brazos y sigue el cursor con la cabeza
    const P = this.P, br = Math.sin(this.t * 2.1);
    P.body.scale.y = 1 + br * 0.008;
    P.head.rotation.y += ((this.mouse.x * 0.6) - P.head.rotation.y) * Math.min(1, dt * 6);
    P.head.rotation.x += ((this.mouse.y * 0.35) - P.head.rotation.x) * Math.min(1, dt * 6);
    this.bounce = Math.max(0, this.bounce - dt * 2.4);
    const raise = Math.sin(Math.min(1, this.bounce) * Math.PI) * 0.5;
    P.armL.rotation.z = -0.06 - br * 0.02 - raise; P.armR.rotation.z = 0.06 + br * 0.02 + raise;
    P.armL.rotation.x = Math.sin(this.t * 1.3) * 0.04; P.armR.rotation.x = -Math.sin(this.t * 1.3) * 0.04;
    this.avatar.position.y = Math.sin(Math.min(1, this.bounce) * Math.PI) * 0.06;
    this.avatar.scale.set(1 + raise * 0.03, 1 - raise * 0.04, 1 + raise * 0.03);
    this.ring.material.color.setHSL(0.13, 1, 0.55 + Math.sin(this.t * 3) * 0.1);
    // animaciones de las piezas
    for (const a of this.anims) {
      a.t += dt;
      if (a.kind === 'in') {
        this.applyIn(a.piece, a.slot, Math.min(1, a.t / 0.75));
        if (!a.hit && a.t > 0.75 * 0.62) { a.hit = true; this.bounce = 1; this.sparks(a.slot, ITEMS[a.piece.id].color); if (this.onImpact) this.onImpact(a.slot, a.piece.id); }
      } else {
        const k = easeOut(Math.min(1, a.t / 0.45));
        a.piece.meshes.forEach((m) => { m.position.y = m.userData.base.y + k * 0.5; m.position.x = m.userData.base.x + (m.userData.base.x >= 0 ? 1 : -1) * k * 0.3; });
        a.piece.mat.opacity = 1 - k;
      }
    }
    this.anims = this.anims.filter((a) => {
      if (a.kind === 'in' && a.t >= 0.75) { this.applyIn(a.piece, a.slot, 1); a.piece.mat.transparent = false; return false; }
      if (a.kind === 'out' && a.t >= 0.45) { this.removePiece(a.piece); return false; }
      return true;
    });
    // cámara: se acerca a la pieza nueva y vuelve
    this.focusT = Math.max(0, (this.focusT || 0) - dt);
    if (this.focusT <= 0) { this.zoom.ty = 1.0; this.zoom.td = 5.4; }
    this.zoom.y += (this.zoom.ty - this.zoom.y) * Math.min(1, dt * 5);
    this.zoom.d += (this.zoom.td - this.zoom.d) * Math.min(1, dt * 5);
    this.camera.position.set(0, this.zoom.y + 0.25, this.zoom.d);
    this.camera.lookAt(0, this.zoom.y, 0);
    this.renderer.render(this.scene, this.camera);
  }
}
