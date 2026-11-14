// Las demás personas de la sala, vistas en el mundo (v12.11.0). Cada una es un Avatar con nombre encima que se mueve suave entre las
// posiciones que llegan (10 por segundo). No importa Avatar ni game: se los pasa quien lo crea (así el trozo «red» no se cuelga
// del núcleo y no hay ciclos). Lo único que se toma de la red son números ya validados (validar.js).
import * as THREE from 'three';

const SUAVE = 12; // qué tan rápido alcanza la posición que llegó (1/s)
const FLAGS = { agacha: 1, corre: 2, vuela: 4, suelo: 8, agua: 16 };
const sinCuerpo = () => ({ camisa: 0, piel: 0, pelo: 0 });

// el nombre sobre la cabeza: un letrero que siempre mira a la cámara
function letrero(nombre) {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 64;
  const x = c.getContext('2d');
  x.font = 'bold 30px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillStyle = 'rgba(0,0,0,0.55)';
  const w = Math.min(244, x.measureText(nombre).width + 24);
  x.fillRect(128 - w / 2, 8, w, 48);
  x.fillStyle = '#fff'; x.fillText(nombre, 128, 33, 232);
  const tex = new THREE.CanvasTexture(c);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true }));
  s.scale.set(1.6, 0.4, 1); s.renderOrder = 999;
  return s;
}

// una propiedad que ya puede venir heredada del juego (como accesor): se pisa sin que falle
const poner = (o, kv) => { for (const k of Object.keys(kv)) Object.defineProperty(o, k, { value: kv[k], writable: true, configurable: true, enumerable: true }); };

export class Remotos {
  constructor(game, Avatar) {
    this.game = game; this.Avatar = Avatar;
    this.por = new Map(); // pid → { avatar, g, sprite, nombre, meta{x,y,z,yaw,pitch,flags}, visto }
  }

  // v12.14.0 (F4): los «jugador» de las demás personas (para que las criaturas del anfitrión los vean y los ataquen) y a quién pertenece cada uno
  jugadores() { return [...this.por.values()].map((r) => r.g.player); }
  pidDe(jugador) { for (const [pid, r] of this.por) if (r.g.player === jugador) return pid; return -1; }
  // vivo o caído, según la última vida que dijo esa persona (la F4 solo ataca a quien está en pie)
  vivo(pid, si) { const r = this.por.get(pid); if (r) r.g.player.alive = !!si; }

  nombreDe(pid) { const r = this.por.get(pid); return r ? r.nombre : 'Alguien'; }

  // la lista nueva que mandó el anfitrión: altas, bajas y cambios de rumbo
  poner(lista) {
    const vivos = new Set();
    for (const e of lista) {
      vivos.add(e.pid);
      let r = this.por.get(e.pid);
      if (!r) r = this.crear(e);
      r.meta = e;
      if (e.nombre !== r.nombre) { r.nombre = e.nombre; this.cambiarLetrero(r); }
      const c = r.g.meta.apariencia;
      if (c.camisa !== e.cuerpo.camisa || c.piel !== e.cuerpo.piel || c.pelo !== e.cuerpo.pelo) r.g.meta.apariencia = { camisa: e.cuerpo.camisa, piel: e.cuerpo.piel, pelo: e.cuerpo.pelo };
    }
    for (const pid of [...this.por.keys()]) if (!vivos.has(pid)) this.quitar(pid);
  }

  crear(e) {
    const game = this.game;
    const g = Object.create(game); // el «g» de este avatar: lo del juego (mundo, luz, reloj) pero con SU cuerpo
    const cuerpo = e.cuerpo || sinCuerpo();
    poner(g, {
      player: { body: { pos: { x: e.x, y: e.y, z: e.z }, vel: { x: 0, y: 0, z: 0 }, onGround: true, inWater: false }, yaw: e.yaw, pitch: e.pitch, sneaking: false, sprinting: false, flying: false, effects: {}, hurtFlash: 0, alive: true },
      meta: { apariencia: { camisa: cuerpo.camisa, piel: cuerpo.piel, pelo: cuerpo.pelo } },
      inventory: { armor: [null, null, null, null, null], held: null, count: () => 0 },
      riding: null, foto: null, muerte: null, zip: null, monta: null, parapente: null, saco: null, surf: null, slide: null, sentado: null, planeo: null,
      blocking: false, eating: false, golpeAnim: null, handGolpe: 0, manoT: 0, parryT: 0, swing: 0, meceAng: 0, clock: 0,
    });
    const avatar = new this.Avatar(game.scene);
    const r = { avatar, g, sprite: null, nombre: e.nombre, meta: e, arma: -1 };
    r.sprite = letrero(e.nombre); game.scene.add(r.sprite);
    this.por.set(e.pid, r);
    return r;
  }
  cambiarLetrero(r) {
    const vieja = r.sprite;
    r.sprite = letrero(r.nombre); this.game.scene.add(r.sprite);
    this.soltarLetrero(vieja);
  }
  soltarLetrero(s) { s.removeFromParent(); if (s.material.map) s.material.map.dispose(); s.material.dispose(); }
  quitar(pid) {
    const r = this.por.get(pid);
    if (!r) return;
    r.avatar.root.removeFromParent();
    this.soltarLetrero(r.sprite);
    this.por.delete(pid);
  }

  // cada cuadro: se acercan a donde dijo el anfitrión y se animan como cualquier avatar
  update(dt) {
    const k = Math.min(1, dt * SUAVE);
    for (const r of this.por.values()) {
      const e = r.meta, p = r.g.player, b = p.body.pos;
      const antes = { x: b.x, z: b.z };
      if (Math.hypot(e.x - b.x, e.z - b.z) > 8 || Math.abs(e.y - b.y) > 8) { b.x = e.x; b.y = e.y; b.z = e.z; } else { b.x += (e.x - b.x) * k; b.y += (e.y - b.y) * k; b.z += (e.z - b.z) * k; }
      p.body.vel.x = dt > 0 ? (b.x - antes.x) / dt : 0; p.body.vel.z = dt > 0 ? (b.z - antes.z) / dt : 0;
      p.body.vel.y = 0;
      let dy = e.yaw - p.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); // por el camino corto
      p.yaw += dy * k; p.pitch += (e.pitch - p.pitch) * k;
      const f = e.flags;
      p.sneaking = !!(f & FLAGS.agacha); p.sprinting = !!(f & FLAGS.corre); p.flying = !!(f & FLAGS.vuela);
      p.body.onGround = !!(f & FLAGS.suelo); p.body.inWater = !!(f & FLAGS.agua);
      if (e.arma !== r.arma) { r.arma = e.arma; r.g.inventory.held = e.arma ? { id: e.arma, count: 1 } : null; }
      r.g.clock = this.game.clock;
      r.avatar.update(dt, r.g, true);
      r.sprite.position.set(b.x, b.y + 2.25, b.z);
    }
  }

  limpiar() { for (const pid of [...this.por.keys()]) this.quitar(pid); }
}
