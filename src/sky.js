// Cielo: cúpula con degradado (cenit → horizonte), resplandor del sol, sol y luna pixelados,
// estrellas y nubes en bloque con volumen que se mueven con el viento.
import * as THREE from 'three';
import { mulberry32, Simplex } from './noise.js';
import { ATMOS, GLSL_GRADO, parcheAtmos } from './atmosfera.js';

export const DAY_LENGTH = 1200; // segundos por día completo (20 min)

function pixelTexture(size, paint) {
  const c = document.createElement('canvas');
  c.width = size; c.height = size;
  paint(c.getContext('2d'), size);
  const t = new THREE.CanvasTexture(c);
  t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.generateMipmaps = false;
  return t;
}

const C = (r, g, b) => new THREE.Color(r, g, b);
// [cenit, horizonte] por momento del día
const DAY = [C(0.25, 0.5, 0.92), C(0.66, 0.8, 0.96)];
const SUNSET = [C(0.24, 0.3, 0.58), C(0.98, 0.58, 0.32)];
const NIGHT = [C(0.008, 0.016, 0.045), C(0.03, 0.06, 0.12)];

const CLOUD_CELL = 12; // tamaño de cada bloque de nube
const CLOUD_N = 32; // celdas por lado del patrón (se repite)
const CLOUD_Y = 128;

export class Sky {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    scene.add(this.group);
    this.zenith = new THREE.Color();
    this.horizon = new THREE.Color();

    // cúpula
    this.domeMat = new THREE.ShaderMaterial({
      uniforms: {
        uTop: { value: new THREE.Color() },
        uHorizon: { value: new THREE.Color() },
        uSunDir: { value: new THREE.Vector3(1, 0, 0) },
        uGlow: { value: new THREE.Color(1, 0.6, 0.3) },
        uGlowAmt: { value: 0 },
        ...ATMOS,
      },
      vertexShader: `varying vec3 vDir;
        void main() { vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `uniform vec3 uTop; uniform vec3 uHorizon; uniform vec3 uGlow; uniform float uGlowAmt;
        #if defined(ATMOS_CIELO) || defined(ATMOS_TONO)
        uniform vec3 uSunCol; uniform vec3 uLuzTinte; uniform vec3 uSombraTinte; uniform vec4 uGrado; uniform vec4 uNiebla; uniform vec4 uBruma; uniform vec2 uHora;
        #endif
        uniform vec3 uSunDir;
        #ifdef ATMOS_TONO${GLSL_GRADO}
        #endif
        varying vec3 vDir;
        void main() {
          vec3 d = normalize(vDir);
          float h = d.y;
          float s = max(dot(d, normalize(uSunDir)), 0.0);
          #ifdef ATMOS_CIELO
          // v12.0.0, cielo mejorado: degradado más largo, banda clara de dispersión en el horizonte, el lado del sol más cálido
          float hh = max(h, 0.0);
          vec3 col = mix(uHorizon, uTop, pow(smoothstep(-0.02, 0.62, h), 0.75));
          col += uHorizon * 0.16 * exp(-hh * 9.0);
          vec2 hs = normalize(uSunDir.xz + vec2(1e-4)), hd = normalize(d.xz + vec2(1e-4));
          float lado = pow(max(dot(hs, hd), 0.0), 3.0) * exp(-hh * 3.5);
          col = mix(col, col * vec3(1.14, 0.94, 0.8) + uGlow * 0.14, lado * uGlowAmt * 0.85);
          col += uGlow * uGlowAmt * pow(s, 3.0) * 0.22;
          // v12.1.1: al ponerse el sol, el degradado naranja (horizonte) -> rosa -> azul profundo (arriba), más encendido del lado del sol
          vec3 atar = mix(vec3(1.0, 0.5, 0.2), vec3(0.93, 0.47, 0.6), smoothstep(0.0, 0.16, h));
          atar = mix(atar, vec3(0.32, 0.3, 0.62), smoothstep(0.12, 0.34, h));
          atar = mix(atar, vec3(0.08, 0.12, 0.38), smoothstep(0.3, 0.75, h));
          atar *= 0.62 + 0.5 * lado + 0.25 * pow(s, 4.0);
          col = mix(col, atar, uHora.x * 0.88 * smoothstep(-0.08, 0.02, h));
          col = mix(col, col * uBruma.rgb, uBruma.w * exp(-hh * 6.0));
          #else
          vec3 col = mix(uHorizon, uTop, smoothstep(-0.02, 0.55, h));
          #endif
          if (h < 0.0) col = mix(uHorizon, uHorizon * 0.55, smoothstep(0.0, -0.4, h));
          col += uGlow * uGlowAmt * (pow(s, 6.0) * 0.55 + pow(s, 40.0) * 0.5) * smoothstep(-0.25, 0.1, h);
          #ifdef ATMOS_TONO
          col = atmosGrado(col);
          #endif
          gl_FragColor = vec4(col, 1.0);
        }`,
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
    });
    this.dome = new THREE.Mesh(new THREE.SphereGeometry(500, 32, 16), this.domeMat);
    this.dome.renderOrder = -20;
    this.group.add(this.dome);

    // sol y luna en pixel art, con halo suave
    const sunTex = pixelTexture(16, (ctx) => {
      const rows = ['....YYYYYYYY....', '..YYyyyyyyyyYY..', '.YyyWWWWWWWWyyY.', '.YyWWWWWWWWWWyY.', 'YyWWWWWWWWWWWWyY', 'YyWWWWWWWWWWWWyY', 'YyWWWWWWWWWWWWyY', 'YyWWWWWWWWWWWWyY', 'YyWWWWWWWWWWWWyY', 'YyWWWWWWWWWWWWyY', 'YyWWWWWWWWWWWWyY', 'YyWWWWWWWWWWWWyY', '.YyWWWWWWWWWWyY.', '.YyyWWWWWWWWyyY.', '..YYyyyyyyyyYY..', '....YYYYYYYY....'];
      const pal = { Y: '#ffb52e', y: '#ffd75a', W: '#fff6c8' };
      rows.forEach((r, y) => [...r].forEach((ch, x) => { if (pal[ch]) { ctx.fillStyle = pal[ch]; ctx.fillRect(x, y, 1, 1); } }));
    });
    const moonTex = pixelTexture(16, (ctx) => {
      ctx.fillStyle = '#c9cfdd';
      for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) if ((x - 7.5) ** 2 + (y - 7.5) ** 2 < 56) ctx.fillRect(x, y, 1, 1);
      ctx.fillStyle = '#e8ecf5';
      for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) if ((x - 6) ** 2 + (y - 6) ** 2 < 20) ctx.fillRect(x, y, 1, 1);
      ctx.fillStyle = '#9ea6ba';
      for (const [x, y, w] of [[4, 9, 3], [9, 4, 2], [9, 10, 2], [5, 4, 1]]) ctx.fillRect(x, y, w, w);
    });
    const glowTex = (() => {
      const c = document.createElement('canvas');
      c.width = 64; c.height = 64;
      const g = c.getContext('2d');
      const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      gr.addColorStop(0, 'rgba(255,255,255,0.9)'); gr.addColorStop(0.3, 'rgba(255,255,255,0.25)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
      return new THREE.CanvasTexture(c);
    })();
    const quad = (tex, size, opts = {}) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.MeshBasicMaterial({ map: tex, fog: false, transparent: true, depthWrite: false, ...opts }));
      m.renderOrder = -10;
      return m;
    };
    // lejos (detrás del horizonte lejano) y escalados para verse del mismo tamaño
    this.sun = quad(sunTex, 40 * 3.6);
    this.sunHalo = quad(glowTex, 150 * 3.6, { blending: THREE.AdditiveBlending, color: 0xffd28a });
    this.moon = quad(moonTex, 28 * 3.6);
    this.moonHalo = quad(glowTex, 90 * 3.6, { blending: THREE.AdditiveBlending, color: 0x8ea4d8 });
    this.group.add(this.sunHalo, this.sun, this.moonHalo, this.moon);

    // estrellas con distinto brillo
    const rnd = mulberry32(42);
    const pts = [], cols = [];
    for (let i = 0; i < 1400; i++) {
      const u = rnd() * 1.2 - 0.2, a = rnd() * Math.PI * 2;
      const r = Math.sqrt(1 - u * u);
      pts.push(Math.cos(a) * r * 420, u * 420, Math.sin(a) * r * 420);
      const b = 0.35 + rnd() * rnd() * 0.65;
      const tint = rnd();
      cols.push(b * (tint < 0.15 ? 1 : 0.85), b * 0.9, b * (tint > 0.85 ? 1 : 0.95));
    }
    const sg = new THREE.BufferGeometry();
    sg.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    sg.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
    this.starMat = new THREE.PointsMaterial({ size: 1.7, sizeAttenuation: false, fog: false, transparent: true, depthWrite: false, vertexColors: true });
    this.stars = new THREE.Points(sg, this.starMat);
    this.stars.renderOrder = -15;
    this.group.add(this.stars);
    // la Vía Láctea: una banda de estrellitas tenues y bruma, inclinada; gira con las demás estrellas y solo se ve
    // bien lejos de las luces de los pueblos (viaK la pone noches.js)
    {
      const n = new THREE.Vector3(0.35, 0.45, 0.82).normalize(), ea = new THREE.Vector3(1, 0, 0).cross(n).normalize(), eb = n.clone().cross(ea);
      const vp = [], vc = [], hp = [], hc = [];
      const gauss = () => (rnd() + rnd() + rnd() - 1.5) / 1.5;
      for (let i = 0; i < 6000; i++) {
        const th = rnd() * Math.PI * 2, off = gauss() * 0.17 * (1 + 0.5 * Math.sin(th * 3));
        const v = ea.clone().multiplyScalar(Math.cos(th)).addScaledVector(eb, Math.sin(th)).multiplyScalar(Math.cos(off)).addScaledVector(n, Math.sin(off)).multiplyScalar(410);
        vp.push(v.x, v.y, v.z);
        const b = 0.25 + rnd() * rnd() * 0.55;
        vc.push(b * 0.92, b * 0.95, b);
      }
      for (let i = 0; i < 4000; i++) {
        const th = rnd() * Math.PI * 2, off = gauss() * 0.2, nube = 0.5 + 0.5 * Math.sin(th * 5 + 1.3) * Math.sin(th * 2.2);
        const v = ea.clone().multiplyScalar(Math.cos(th)).addScaledVector(eb, Math.sin(th)).multiplyScalar(Math.cos(off)).addScaledVector(n, Math.sin(off)).multiplyScalar(412);
        hp.push(v.x, v.y, v.z);
        const b = 0.03 + 0.045 * nube;
        hc.push(b * 0.95, b * 0.92, b * 1.05);
      }
      const geo = (P, C) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); return g; };
      this.viaMat = new THREE.PointsMaterial({ size: 1.1, sizeAttenuation: false, fog: false, transparent: true, depthWrite: false, vertexColors: true, opacity: 0 });
      this.viaBruma = new THREE.PointsMaterial({ size: 5, sizeAttenuation: false, fog: false, transparent: true, depthWrite: false, vertexColors: true, opacity: 0, blending: THREE.AdditiveBlending });
      const via = new THREE.Points(geo(vp, vc), this.viaMat), bruma = new THREE.Points(geo(hp, hc), this.viaBruma);
      via.renderOrder = -15; bruma.renderOrder = -16;
      this.stars.add(via, bruma);
      this.viaK = 1;
    }

    this.buildClouds();
  }

  // Nubes: patrón de manchas (ruido) convertido en bloques con caras sombreadas.
  buildClouds() {
    const n = new Simplex(9);
    const map = [];
    for (let z = 0; z < CLOUD_N; z++) for (let x = 0; x < CLOUD_N; x++) {
      // ruido periódico: se muestrea sobre un toro para que el patrón se repita sin costuras
      const a = (x / CLOUD_N) * Math.PI * 2, b = (z / CLOUD_N) * Math.PI * 2;
      const v = n.noise3(Math.cos(a) * 1.6, Math.sin(a) * 1.6 + Math.cos(b) * 1.6, Math.sin(b) * 1.6) * 0.7 + n.noise3(Math.cos(a) * 4, Math.sin(b) * 4, Math.sin(a) * 4 + Math.cos(b) * 4) * 0.3;
      map.push(v > 0.18 ? 1 : 0);
    }
    const at = (x, z) => map[((z % CLOUD_N) + CLOUD_N) % CLOUD_N * CLOUD_N + ((x % CLOUD_N) + CLOUD_N) % CLOUD_N];
    const pos = [], col = [], idx = [];
    const H = 4, S = CLOUD_CELL;
    const quad = (v, c) => {
      const b = pos.length / 3;
      for (const p of v) { pos.push(...p); col.push(c, c, c); }
      idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
    };
    for (let z = 0; z < CLOUD_N; z++) for (let x = 0; x < CLOUD_N; x++) {
      if (!at(x, z)) continue;
      const x0 = x * S, x1 = x0 + S, z0 = z * S, z1 = z0 + S;
      quad([[x0, H, z0], [x0, H, z1], [x1, H, z1], [x1, H, z0]], 1);
      quad([[x0, 0, z0], [x1, 0, z0], [x1, 0, z1], [x0, 0, z1]], 0.72);
      if (!at(x + 1, z)) quad([[x1, 0, z1], [x1, 0, z0], [x1, H, z0], [x1, H, z1]], 0.86);
      if (!at(x - 1, z)) quad([[x0, 0, z0], [x0, 0, z1], [x0, H, z1], [x0, H, z0]], 0.86);
      if (!at(x, z + 1)) quad([[x0, 0, z1], [x1, 0, z1], [x1, H, z1], [x0, H, z1]], 0.8);
      if (!at(x, z - 1)) quad([[x1, 0, z0], [x0, 0, z0], [x0, H, z0], [x1, H, z0]], 0.8);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    g.setIndex(idx);
    this.cloudMat = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.86, fog: false });
    this.cloudMat.userData.atmosNombre = 'cloud';
    // v12.0.0: las nubes con el mismo tono que lo demás; v12.1.1: al ponerse el sol, la panza de la nube se enciende en naranja
    this.cloudMat.onBeforeCompile = (sh) => {
      parcheAtmos(sh);
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', '#include <common>\n#ifdef ATMOS_CIELO\nuniform vec2 uHora;\n#endif')
        .replace('#include <color_fragment>', `#include <color_fragment>
        #ifdef ATMOS_CIELO
          float panza = 1.0 - smoothstep(0.74, 0.95, vColor.r);
          diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(1.45, 0.86, 0.62) + vec3(0.22, 0.07, 0.02), uHora.x * (0.08 + 0.72 * panza));
        #endif`);
    };
    this.clouds = new THREE.Group();
    for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) {
      const m = new THREE.Mesh(g, this.cloudMat);
      m.position.set(dx * CLOUD_N * S, 0, dz * CLOUD_N * S);
      m.renderOrder = 3;
      this.clouds.add(m);
    }
    this.scene.add(this.clouds);
  }

  // time: 0..1 (0 = amanecer, 0.25 = mediodía, 0.5 = atardecer, 0.75 = medianoche)
  // overcast: 0..1 cuánto nublado (lluvia/tormenta); flash: relámpago 0..1
  update(time, camera, fog, renderer, overcast = 0, flash = 0) {
    const ang = time * Math.PI * 2;
    const sunH = Math.sin(ang);
    let daylight = THREE.MathUtils.clamp(sunH * 2.2 + 0.45, 0.12, 1);
    const clearDay = daylight;
    daylight = Math.max(0.1, daylight * (1 - overcast * 0.45));
    const twilight = Math.max(0, 1 - Math.abs(sunH) * 3.2);
    const dayK = THREE.MathUtils.clamp((daylight - 0.12) / 0.88, 0, 1);

    this.zenith.copy(NIGHT[0]).lerp(DAY[0], dayK).lerp(SUNSET[0], twilight * 0.5 * (sunH > -0.2 ? 1 : 0));
    this.horizon.copy(NIGHT[1]).lerp(DAY[1], dayK).lerp(SUNSET[1], twilight * 0.75);
    const u = this.domeMat.uniforms;
    u.uTop.value.copy(this.zenith);
    u.uHorizon.value.copy(this.horizon);
    const dir = new THREE.Vector3(Math.cos(ang), Math.sin(ang), 0.15).normalize();
    u.uSunDir.value.copy(dir);
    u.uGlowAmt.value = twilight * 0.9 + dayK * 0.15;
    if (overcast > 0) {
      // nublado: el cielo se vuelve gris según la luz del día
      const gray = new THREE.Color(0.42, 0.45, 0.5).multiplyScalar(Math.max(0.12, clearDay));
      this.zenith.lerp(gray, overcast * 0.85);
      this.horizon.lerp(gray.clone().multiplyScalar(1.1), overcast * 0.8);
      u.uTop.value.copy(this.zenith);
      u.uHorizon.value.copy(this.horizon);
      u.uGlowAmt.value *= 1 - overcast;
    }
    ATMOS.uCieloHoriz.value.copy(this.horizon); ATMOS.uCieloCenit.value.copy(this.zenith); // v12.6.2: para el reflejo del agua
    if (flash > 0) {
      const f = flash * flash;
      this.horizon.lerp(new THREE.Color(0.85, 0.88, 1), f * 0.7);
      u.uTop.value.lerp(new THREE.Color(0.8, 0.85, 1), f * 0.7);
      u.uHorizon.value.copy(this.horizon);
      daylight = Math.min(1, daylight + f * 0.6);
    }
    renderer.setClearColor(this.horizon);
    if (fog) fog.color.copy(this.horizon);

    const cp = camera.position;
    this.group.position.copy(cp);
    this.sun.position.copy(dir).multiplyScalar(1080);
    this.sunHalo.position.copy(dir).multiplyScalar(1098);
    this.moon.position.copy(dir).multiplyScalar(-1080);
    this.moonHalo.position.copy(dir).multiplyScalar(-1098);
    this.group.updateMatrixWorld();
    for (const o of [this.sun, this.sunHalo, this.moon, this.moonHalo]) o.lookAt(cp);
    this.sunHalo.material.opacity = 0.5 + twilight * 0.5;
    this.moonHalo.material.opacity = (1 - dayK) * 0.6;
    this.starMat.opacity = THREE.MathUtils.clamp(1 - daylight * 1.7, 0, 1);
    this.stars.rotation.z = ang;

    // nubes: siguen al jugador en pasos del patrón y avanzan con el viento
    const span = CLOUD_N * CLOUD_CELL;
    // el viento de las nubes (en time-lapse corre más rápido)
    const ahora = performance.now() / 1000;
    const dtr = this.antes ? Math.min(0.1, ahora - this.antes) : 0;
    this.antes = ahora;
    this.drift = (this.drift ?? ahora * 1.2) + dtr * 1.2 * (this.velNubes || 1);
    const drift = this.drift;
    const ox = Math.floor((cp.x - drift) / span) * span + drift;
    const oz = Math.floor(cp.z / span) * span;
    this.clouds.position.set(ox, CLOUD_Y, oz);
    const cl = Math.max(0.18, daylight);
    this.cloudMat.color.setRGB(cl * (1 + twilight * 0.15), cl * (1 - twilight * 0.05), cl * (1 - twilight * 0.15)).multiplyScalar(1 - overcast * 0.45);
    this.cloudMat.opacity = 0.86 + overcast * 0.12;
    this.sun.material.opacity = 1 - overcast;
    this.sunHalo.material.opacity *= 1 - overcast;
    this.starMat.opacity *= 1 - overcast;
    this.viaMat.opacity = this.starMat.opacity * (this.viaK ?? 1);
    this.viaBruma.opacity = this.starMat.opacity * (this.viaK ?? 1);
    return daylight;
  }
}
