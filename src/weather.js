// Clima: lluvia, tormentas con relámpagos y truenos, y nieve donde hace frío.
// La lluvia no cae bajo techo (se mira la columna de cada gota) y se oye apagada adentro.
import * as THREE from 'three';
import { HEIGHT } from './worldgen.js';

const DROPS = 1400;
const R = 22; // radio alrededor del jugador
const TOP = 26; // altura sobre el jugador donde nacen las gotas

export class Weather {
  constructor(game) {
    this.game = game;
    this.type = 'clear'; // clear | rain | storm
    this.intensity = 0; // 0..1 suavizado
    this.timer = 300 + Math.random() * 400;
    this.flash = 0;
    this.thunderQueue = [];
    this.colTop = new Map(); // "x,z" -> y del primer bloque que tapa la lluvia
    this.colT = 0;
    // gotas como segmentos (líneas) y copos como puntos
    this.pos = new Float32Array(DROPS * 6);
    this.vel = new Float32Array(DROPS);
    this.alive = new Uint8Array(DROPS);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    this.rainMat = new THREE.LineBasicMaterial({ color: 0x9fb4d8, transparent: true, opacity: 0.55, depthWrite: false });
    this.rain = new THREE.LineSegments(g, this.rainMat);
    this.rain.frustumCulled = false;
    this.rain.renderOrder = 4;
    game.scene.add(this.rain);
    this.snowPos = new Float32Array(DROPS * 3);
    const sg = new THREE.BufferGeometry();
    sg.setAttribute('position', new THREE.BufferAttribute(this.snowPos, 3));
    this.snowMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.09, transparent: true, opacity: 0.9, depthWrite: false });
    this.snow = new THREE.Points(sg, this.snowMat);
    this.snow.frustumCulled = false;
    game.scene.add(this.snow);
    this.snowing = false;
    for (let i = 0; i < DROPS; i++) { this.pos[i * 6 + 1] = -999; this.pos[i * 6 + 4] = -999; this.snowPos[i * 3 + 1] = -999; }
  }

  toJSON() { return { type: this.type, timer: this.timer }; }
  load(d) {
    if (!d) return;
    this.type = d.type || 'clear';
    this.timer = d.timer || 300;
    this.intensity = this.type === 'clear' ? 0 : 1;
  }

  set(type) {
    this.type = type;
    const wet = this.game.season === 'invierno';
    this.timer = type === 'clear' ? (wet ? 200 + Math.random() * 300 : 600 + Math.random() * 900) : (wet ? 200 + Math.random() * 360 : 80 + Math.random() * 120);
  }

  // ¿dónde está el techo de esta columna? (cacheado y refrescado de a poco)
  top(x, z) {
    const k = `${x},${z}`;
    let t = this.colTop.get(k);
    if (t === undefined) {
      const w = this.game.world;
      t = -1;
      // la lluvia se detiene en el primer bloque que encuentra (techos, hojas, agua)
      for (let y = HEIGHT - 1; y > 0; y--) {
        if (w.getBlock(x, y, z) !== 0) { t = y; break; }
      }
      this.colTop.set(k, t);
    }
    return t;
  }

  // Mezcla del clima en el cielo: cuánto oscurece
  get overcast() { return this.intensity * (this.type === 'storm' ? 0.85 : 0.6); }

  update(dt, camera, biomeCold) {
    const g = this.game;
    // ciclo del clima
    this.timer -= dt;
    if (this.timer <= 0 && g.meta && g.meta.invitado) this.timer = 60; // v12.11.0: en la sala del anfitrión el clima lo manda él
    else if (this.timer <= 0) {
      if (this.type === 'clear') this.set(Math.random() < 0.3 ? 'storm' : 'rain');
      else this.set('clear');
    }
    const target = this.type === 'clear' ? 0 : 1;
    this.intensity += (target - this.intensity) * Math.min(1, dt * 0.15);
    this.snowing = biomeCold;

    // refrescar techos cerca de vez en cuando (por si construyeron)
    this.colT -= dt;
    if (this.colT <= 0) { this.colT = 2; this.colTop.clear(); }

    const cp = camera.position;
    const want = Math.floor(DROPS * Math.min(1, this.intensity * 1.1));
    let hits = 0;
    for (let i = 0; i < DROPS; i++) {
      const o = i * 6, so = i * 3;
      if (i >= want) { this.pos[o + 1] = this.pos[o + 4] = -999; this.snowPos[so + 1] = -999; this.alive[i] = 0; continue; }
      if (!this.alive[i]) {
        const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * R;
        const x = cp.x + Math.cos(a) * r, z = cp.z + Math.sin(a) * r;
        const y = cp.y + TOP * (0.4 + Math.random() * 0.6);
        this.pos[o] = x; this.pos[o + 1] = y; this.pos[o + 2] = z;
        this.vel[i] = this.snowing ? 1.6 + Math.random() * 0.8 : 22 + Math.random() * 6;
        this.alive[i] = 1;
      }
      let x = this.pos[o], y = this.pos[o + 1], z = this.pos[o + 2];
      if (this.snowing) {
        y -= this.vel[i] * dt;
        x += Math.sin(y * 0.8 + i) * dt * 0.6;
        z += Math.cos(y * 0.7 + i * 1.3) * dt * 0.6;
      } else {
        y -= this.vel[i] * dt;
        x += 0.8 * dt; // un poco de viento
      }
      const t = this.top(Math.floor(x), Math.floor(z));
      if (y <= t + 1 || y < cp.y - 14 || Math.hypot(x - cp.x, z - cp.z) > R + 2) {
        // salpicadura al tocar el suelo (solo algunas, cerca)
        if (!this.snowing && y <= t + 1 && hits < 6 && Math.random() < 0.3 && Math.abs(t - cp.y) < 12) {
          hits++;
          g.particles.spawn(x, t + 1.02, z, [0.75, 0.82, 0.95], (Math.random() - 0.5) * 1.2, 1 + Math.random(), (Math.random() - 0.5) * 1.2, 0.25, 20);
        }
        this.alive[i] = 0;
        this.pos[o + 1] = this.pos[o + 4] = -999; this.snowPos[so + 1] = -999;
        continue;
      }
      this.pos[o] = x; this.pos[o + 1] = y; this.pos[o + 2] = z;
      if (this.snowing) {
        this.pos[o + 4] = -999;
        this.snowPos[so] = x; this.snowPos[so + 1] = y; this.snowPos[so + 2] = z;
      } else {
        this.snowPos[so + 1] = -999;
        this.pos[o + 3] = x - 0.02; this.pos[o + 4] = y + 0.55; this.pos[o + 5] = z;
      }
    }
    this.rain.geometry.attributes.position.needsUpdate = true;
    this.snow.geometry.attributes.position.needsUpdate = true;
    const light = Math.max(0.25, g.daylight);
    this.rainMat.color.setRGB(0.62 * light, 0.7 * light, 0.85 * light);
    this.snowMat.color.setScalar(Math.max(0.35, light));

    // relámpagos y truenos
    this.flash = Math.max(0, this.flash - dt * 3);
    if (this.type === 'storm' && this.intensity > 0.6 && Math.random() < dt * 0.06) {
      this.flash = 1;
      const dist = 40 + Math.random() * 300;
      this.thunderQueue.push({ t: dist / 340, dist });
    }
    this.thunderQueue = this.thunderQueue.filter((q) => {
      q.t -= dt;
      if (q.t > 0) return true;
      g.audio.thunder(q.dist);
      return false;
    });
  }
}
