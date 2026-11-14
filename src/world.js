// El mundo: chunks en memoria, carga/descarga alrededor del jugador, cambios del jugador y mallas.
import { BRILLO, CURVA_GLSL } from './brillo.js';
import * as THREE from 'three';
import { BLOCKS, SOLID, AIR, FLUID, FLUID_LEVEL, fluidId, BLOCK_BY_KEY as K, BOXES } from './blocks.js';
import { Generator, CHUNK, HEIGHT, idx } from './worldgen.js';
import { buildChunkGeometry } from './mesher.js';
import { atlasTexture } from './textures.js';
import { parcheAtmos } from './atmosfera.js';
import { anotarLuces } from './halos.js';

export const key = (cx, cz) => `${cx},${cz}`;
const FACING_VEC = [[0, 1], [1, 0], [0, -1], [-1, 0]];

class Chunk {
  constructor(cx, cz) {
    this.cx = cx; this.cz = cz;
    this.blocks = new Uint16Array(CHUNK * CHUNK * HEIGHT);
    this.tint = new Float32Array(CHUNK * CHUNK * 3);
    this.mesh = null;
    this.waterMesh = null;
    this.dirty = true;
    this.glowCount = 0;
  }
  countGlow() {
    let n = 0;
    const b = this.blocks;
    for (let i = 0; i < b.length; i++) if (BLOCKS[b[i]].glow) n++;
    this.glowCount = n;
  }
}

// Material con luz del cielo (que cambia con el día) y luz de lámparas (que no).
// Tiempo compartido por los shaders (hojas que se mecen, plantas, olas).
export const SHADER_TIME = { value: 0 };
// color de la luz del cielo según la hora (cálido de día, dorado al atardecer, azul de luna de noche)
export const SKY_LIGHT = { value: new THREE.Color(1, 1, 1) };

function makeMaterial(opts) {
  const mat = new THREE.MeshBasicMaterial({ map: atlasTexture, vertexColors: true, ...opts });
  mat.userData.daylight = { value: 1 };
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uDaylight = mat.userData.daylight;
    shader.uniforms.uTime = SHADER_TIME;
    shader.uniforms.uSkyColor = SKY_LIGHT;
    shader.uniforms.uBrillo = BRILLO; // v11.11.0: el deslizador de brillo (brillo.js)
    // Ojo: en MeshBasicMaterial <color_vertex> va ANTES de <begin_vertex>, así que la ola se calcula ahí.
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nattribute vec2 aLight;\nattribute float aAnim;\nuniform float uBrillo;\nuniform float uDaylight;\nuniform float uTime;\nuniform vec3 uSkyColor;\nvarying vec2 vAgua;\nvarying float vEmis;\nfloat aBaseA() { return floor(aAnim + 0.001); }')
      .replace('#include <color_vertex>', `#include <color_vertex>
        vec4 wpA = modelMatrix * vec4(position, 1.0);
        float aB = aBaseA(), frA = aAnim - aB;
        float aE = step(7.5, aB); aB -= aE * 8.0; // v12.8.6: el +8 del emisor va aparte de la animación (farol y fogata: 1 + 8)
        // v12.6.2/v12.6.4: en el agua, x = profundidad (0–1) e y = orilla (0 o 1), separadas aquí para que se interpolen cada una por su lado
        float orV = step(0.45, frA);
        vAgua = aB > 2.5 ? vec2(clamp((frA - orV * 0.5) / 0.4, 0.0, 1.0), orV) : vec2(-1.0);
        vEmis = aE > 0.5 || frA > 0.85 ? 1.0 : 0.0; // v12.8.0: antorchas, lámparas y lava (solo cuenta con POST_HDR, en el material opaco)
        float waveA = 0.0;
        if (aB > 2.5 && aB < 4.5) waveA = sin(uTime * 1.3 + wpA.x * 0.8 + wpA.z * 0.25) * cos(uTime * 1.05 + wpA.z * 0.7);
        // luz del cielo con su color + luz de antorchas anaranjada que titila; se suman (sin pasarse)
        float skyK = aLight.x * uDaylight;
        vec3 skyL = skyK * uSkyColor;
        float flick = 0.93 + 0.07 * sin(uTime * 9.0 + wpA.x * 1.7 + wpA.z * 2.3) * sin(uTime * 5.3 + wpA.y);
        vec3 blkL = aLight.y * vec3(1.05, 0.68, 0.38) * flick;
        vec3 L = skyL + blkL * (1.0 - min(1.0, skyK) * 0.6);
        L = clamp(L, vec3(0.03, 0.035, 0.055), vec3(1.15));${CURVA_GLSL}
        vColor.rgb *= L;
        // un poco más de color
        float lumA = dot(vColor.rgb, vec3(0.299, 0.587, 0.114));
        vColor.rgb = max(mix(vec3(lumA), vColor.rgb, 1.14), vec3(0.0));
        if (aB > 2.5 && aB < 4.5) vColor.rgb *= 0.94 + waveA * 0.08;`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        if (aB > 0.5 && aB < 2.5) {
          float amp = aB < 1.5 ? 0.035 : 0.085;
          float s = uTime * 1.6 + wpA.x * 0.55 + wpA.z * 0.45 + wpA.y * 0.25;
          transformed.x += sin(s) * amp + sin(s * 2.3) * amp * 0.3;
          transformed.z += cos(s * 0.83 + 1.7) * amp;
        } else if (aB > 2.5 && aB < 4.5) {
          transformed.y += waveA * 0.045 - 0.045;
        }`);
    // v12.6.2 (PLAN_GRAFICOS_2.md §4.1, «agua de material»): con ATMOS_AGUA (Medio y Alto, solo el material del agua): Fresnel con
    // una normal procedural que se mueve, el cielo reflejado (los colores de la cúpula), el brillo del sol, más oscura y opaca donde
    // es honda y espuma en la orilla. Con la cámara debajo del agua, nada de reflejo. Sin textura extra ni otra pasada
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec2 vAgua;\nvarying float vEmis;\nuniform float uTime;\nuniform float uDaylight;')
      .replace('#include <color_fragment>', `#include <color_fragment>
#ifdef ATMOS_AGUA
        if (vAgua.x >= 0.0) {
          // v12.6.4 «agua que se nota»: todo más marcado que en la 12.6.2
          float profA = smoothstep(0.0, 1.0, vAgua.x), orA = vAgua.y;
          vec3 pA = vAtmosWP;
          // la normal: olas largas y rizos cortos (los rizos hacen la estela del sol)
          vec2 rz = vec2(sin(pA.x * 0.9 + uTime * 1.1) * 0.07 + sin(pA.z * 2.3 - uTime * 1.7) * 0.035 + sin((pA.x + pA.z) * 5.1 + uTime * 2.6) * 0.03,
                         cos(pA.z * 0.8 + uTime) * 0.07 + cos(pA.x * 2.1 + uTime * 1.4) * 0.035 + cos((pA.x - pA.z) * 4.7 - uTime * 2.2) * 0.03);
          vec3 nA = normalize(vec3(rz.x, 1.0, rz.y));
          vec3 vA = normalize(cameraPosition - pA);
          float abajoA = step(pA.y, cameraPosition.y); // 1 si la cámara está arriba del agua
          float luzA = clamp(dot(vColor.rgb, vec3(0.333)) * 1.25, 0.0, 1.3); // la luz que trae el vértice (día, noche, sombra)
          // la profundidad: la orilla clara y turquesa, lo hondo azul oscuro casi opaco
          // v12.6.5: lo hondo se oscurece en el COLOR y el alfa tiene tope de 0.78 (con 0.95 no se veía el arrecife); desde abajo, sin
          // la profundidad. Lejos, el color va hacia el del agua del lod y se apagan el reflejo y el sol, para que no haya costura
          float distA = length(cameraPosition - pA), lejosA = smoothstep(uAgua.x, uAgua.y, distA);
          vec3 aguaA = mix(vec3(0.30, 0.80, 0.78), vec3(0.02, 0.11, 0.30), profA) * luzA;
          aguaA = mix(aguaA, vec3(0.16, 0.34, 0.68) * mix(1.0, 0.75, profA) * luzA, lejosA * 0.8);
          diffuseColor.rgb = mix(aguaA, diffuseColor.rgb, 0.22);
          diffuseColor.a = mix(0.5, 0.78, profA * abajoA + (1.0 - abajoA) * 0.6);
          diffuseColor.a = mix(diffuseColor.a, 1.0, lejosA * 0.8); // v12.8.2 (decimoquinta revisión, punto 5): lejos, opaca como la del lod
          // Fresnel (Schlick): casi nada mirando para abajo, mucho cielo al mirar rasante
          float fA = (0.03 + 0.97 * pow(1.0 - clamp(dot(vA, nA), 0.0, 1.0), 5.0)) * abajoA * (1.0 - lejosA * 0.85);
          vec3 rA = reflect(-vA, nA);
          vec3 cieloA = mix(uCieloHoriz, uCieloCenit, smoothstep(0.0, 0.6, rA.y)) * max(uDaylight, 0.12);
          diffuseColor.rgb = mix(diffuseColor.rgb, cieloA, min(0.85, fA * 1.1));
          diffuseColor.a = max(diffuseColor.a, fA * 0.9);
          // el sol: un brillo ancho (la estela) y uno fino (los destellos), más fuerte con el sol bajo
          float dS = max(dot(rA, uSunDir), 0.0), bajoS = 1.0 + 1.5 * (1.0 - smoothstep(0.1, 0.5, uSunDir.y));
          vec3 solA = (pow(dS, 90.0) * 0.5 + pow(dS, 900.0) * 3.0) * uSunCol * bajoS * abajoA * step(0.0, uSunDir.y) * (1.0 - uAgua.z * 0.9) * (1.0 - lejosA * 0.6); // v12.6.5: casi nada con nublado o lluvia
          diffuseColor.rgb += solA;
          diffuseColor.a = max(diffuseColor.a, min(1.0, dot(solA, vec3(0.333))));
          // la espuma: una banda blanca donde el agua toca la arena o un bloque, que va y viene
          float vaivenA = sin(uTime * 1.6 + pA.x * 0.7 + pA.z * 0.5) * 0.08;
          float rotaA = 0.6 + 0.4 * sin(pA.x * 6.3 + uTime * 1.2) * sin(pA.z * 5.7 - uTime * 0.9);
          float espA = smoothstep(0.52 + vaivenA, 0.72 + vaivenA, orA) * rotaA;
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.95, 0.98, 1.0) * max(luzA, 0.2), espA * 0.9);
          diffuseColor.a = max(diffuseColor.a, espA * 0.92);
        }
#endif`);
    // v12.8.4 (decimoséptima revisión, punto 1): el emisor se sube DESPUÉS del grado de color (atmosGrado termina con un hombro que no
    // pasa de 1: subido antes, la lámpara salía amarilla y del mismo brillo que la arena). De día brilla menos que de noche
    // v12.8.6 (punto 3): de lejos ya va mezclado con la niebla: se deja de realzar entre 60 y 100 bloques (si no, halo azul en el horizonte)
    shader.fragmentShader = shader.fragmentShader.replace('#include <premultiplied_alpha_fragment>', `#ifdef POST_HDR
        float lejosE = 1.0;
#if defined(ATMOS_NIEBLA) || defined(ATMOS_TONO) || defined(ATMOS_AGUA)
        lejosE = 1.0 - smoothstep(60.0, 100.0, length(vAtmosWP - cameraPosition));
#endif
        gl_FragColor.rgb *= 1.0 + vEmis * lejosE * (0.5 + 1.6 * (1.0 - uDaylight));
#endif
#include <premultiplied_alpha_fragment>`);
    parcheAtmos(shader); // v12.0.0: tono, niebla de altura y bruma (solo con sus #define; en Bajo no hace nada)
  };
  return mat;
}

export class World {
  constructor(scene, seed, mods, blockEntities, genVersion = 1, dim = 'tierra', tipo = 'normal') {
    this.scene = scene;
    this.dim = dim;
    this.seed = seed;
    this.gen = new Generator(seed, genVersion, dim, tipo);
    this.chunks = new Map();
    this.mods = mods || new Map(); // key -> Map(index -> id): cambios del jugador
    this.dirtyMods = new Set();
    // datos de bloques especiales por chunk: key -> Map(índice -> { type, facing, slots, ... })
    this.blockEntities = blockEntities || new Map();
    this.onBlockEntity = null;
    this.villageNpcs = new Map(); // vecinos de los pueblos generados: vid -> datos
    this.beacons = new Set(); // faros: 'x,y,z'
    this.zones = new Map(); // zonas de las estructuras (teatro, campanas, capital)
    this.renderDistance = 6;
    this.opaqueMat = makeMaterial({ alphaTest: 0.5 });
    this.waterMat = makeMaterial({ transparent: true, opacity: 0.72, side: THREE.DoubleSide, depthWrite: false });
    this.opaqueMat.userData.atmosNombre = 'bloques'; this.waterMat.userData.atmosNombre = 'agua'; // v12.4.1: la clave de caché del shader
    this.genQueue = [];
    this.fluidQueue = new Map();
    this.crops = new Set();
    this.onFall = null;
    this.onFluidMix = null;
    this.onBlockChange = null; // callback(x,y,z,oldId,newId)
    // v12.12.0 (F2, multijugador): «cliente» = mundo de un invitado (sin física ni fluidos: solo genera terreno y aplica lo que manda el
    // anfitrión); redCambio avisa a la sesión de cada cambio hecho aquí, salvo los que llegan de la red (_remoto)
    this.red = null; this.redCambio = null; this._remoto = false;
    this.stats = { generated: 0, meshed: 0 };
  }

  setDaylight(v) {
    this.opaqueMat.userData.daylight.value = v;
    this.waterMat.userData.daylight.value = v;
  }

  getChunk(cx, cz) { return this.chunks.get(key(cx, cz)); }
  // no dibujar un bloque un ratito (mientras una pieza suelta hace su animación); no cambia nada de lo que se guarda
  ocultarBloque(x, y, z, on, remallar = true) {
    const cx = Math.floor(x / CHUNK), cz = Math.floor(z / CHUNK), c = this.getChunk(cx, cz);
    if (!c) return;
    const i = (x - cx * CHUNK) + (z - cz * CHUNK) * CHUNK + y * CHUNK * CHUNK;
    if (on) (c.ocultos ||= new Set()).add(i); else if (c.ocultos) c.ocultos.delete(i);
    if (remallar) c.dirty = true;
  }

  getBlock(x, y, z) {
    if (y < 0) return 12;
    if (y >= HEIGHT) return AIR;
    const cx = Math.floor(x / CHUNK), cz = Math.floor(z / CHUNK);
    const c = this.chunks.get(key(cx, cz));
    if (!c) return AIR;
    return c.blocks[idx(x - cx * CHUNK, y, z - cz * CHUNK)];
  }

  isSolidAt(x, y, z) { return SOLID[this.getBlock(x, y, z)] === 1; }
  isLoaded(x, z) { return this.chunks.has(key(Math.floor(x / CHUNK), Math.floor(z / CHUNK))); }

  // Cambia un bloque y registra el cambio para guardarlo. Devuelve el id anterior.
  setBlock(x, y, z, id, { updates = true } = {}) {
    if (y < 0 || y >= HEIGHT) return -1;
    const cx = Math.floor(x / CHUNK), cz = Math.floor(z / CHUNK);
    const c = this.chunks.get(key(cx, cz));
    if (!c) return -1;
    const lx = x - cx * CHUNK, lz = z - cz * CHUNK;
    const i = idx(lx, y, lz);
    const old = c.blocks[i];
    if (old === id) return old;
    c.blocks[i] = id;
    if (BLOCKS[old].glow) c.glowCount--;
    if (BLOCKS[id].glow) c.glowCount++;
    const k = key(cx, cz);
    let m = this.mods.get(k);
    if (!m) { m = new Map(); this.mods.set(k, m); }
    m.set(i, id);
    this.dirtyMods.add(k);
    // remallar este chunk y vecinos si toca el borde (o si hay luz que se propaga)
    const glowChange = BLOCKS[old].glow || BLOCKS[id].glow;
    this.markDirty(cx, cz);
    if (lx === 0 || glowChange) this.markDirty(cx - 1, cz);
    if (lx === CHUNK - 1 || glowChange) this.markDirty(cx + 1, cz);
    if (lz === 0 || glowChange) this.markDirty(cx, cz - 1);
    if (lz === CHUNK - 1 || glowChange) this.markDirty(cx, cz + 1);
    if (glowChange || lx === 0 || lz === 0 || lx === CHUNK - 1 || lz === CHUNK - 1) {
      this.markDirty(cx - 1, cz - 1); this.markDirty(cx + 1, cz - 1);
      this.markDirty(cx - 1, cz + 1); this.markDirty(cx + 1, cz + 1);
    }
    if (BLOCKS[old].crop || BLOCKS[id].crop) this.trackCrop(x, y, z, id);
    if (this.onBlockChange) this.onBlockChange(x, y, z, old, id);
    if (this.redCambio && !this._remoto) this.redCambio(x, y, z, old, id);
    if (updates) this.neighborUpdates(x, y, z);
    return old;
  }

  // ---------- multijugador (F2) ----------
  // un cambio que manda el anfitrión: si el chunk no está cargado, solo se anota (se aplica al generarlo en ensureChunk)
  aplicarRemoto(x, y, z, id) {
    if (y < 0 || y >= HEIGHT || !BLOCKS[id]) return;
    const cx = Math.floor(x / CHUNK), cz = Math.floor(z / CHUNK), k = key(cx, cz);
    if (this.chunks.has(k)) {
      this._remoto = true;
      try { this.setBlock(x, y, z, id, { updates: false }); } finally { this._remoto = false; }
      return;
    }
    let m = this.mods.get(k);
    if (!m) { m = new Map(); this.mods.set(k, m); }
    m.set(idx(x - cx * CHUNK, y, z - cz * CHUNK), id);
    this.dirtyMods.add(k);
  }
  // los cambios del jugador de un chunk (para mandarlos); chunksConMods lista los que tienen alguno
  modsDe(cx, cz) { const m = this.mods.get(key(cx, cz)); return m ? [...m] : []; }
  chunksConMods() {
    const l = [];
    for (const [k, m] of this.mods) if (m.size) { const [a, b] = k.split(',').map(Number); l.push([a, b]); }
    return l;
  }
  // el estado que manda el anfitrión para un chunk. reset: lo que este mundo tuviera de más vuelve al terreno generado
  aplicarMods(cx, cz, lista, reset) {
    const k = key(cx, cz), c = this.chunks.get(k), viejo = this.mods.get(k);
    const en = new Map(lista);
    if (reset && viejo && viejo.size) {
      let base = null;
      if (c) { base = new Chunk(cx, cz); this.gen.generate(cx, cz, base.blocks, base.tint); apuntalar(base.blocks); }
      for (const i of [...viejo.keys()]) {
        if (en.has(i)) continue;
        if (base) this.aplicarRemoto(cx * CHUNK + (i % CHUNK), Math.floor(i / (CHUNK * CHUNK)), cz * CHUNK + (Math.floor(i / CHUNK) % CHUNK), base.blocks[i]);
        viejo.delete(i);
      }
    }
    for (const [i, id] of en) this.aplicarRemoto(cx * CHUNK + (i % CHUNK), Math.floor(i / (CHUNK * CHUNK)), cz * CHUNK + (Math.floor(i / CHUNK) % CHUNK), id);
  }
  // un chunk que el anfitrión necesita tener a mano aunque su jugador esté lejos (para aplicar lo que pide un invitado)
  cargarFijo(cx, cz) {
    const c = this.ensureChunk(cx, cz);
    c.fijoHasta = performance.now() + 20000;
    return c;
  }

  // ---------- entidades de bloque ----------
  getBE(x, y, z) {
    const cx = Math.floor(x / CHUNK), cz = Math.floor(z / CHUNK);
    const m = this.blockEntities.get(key(cx, cz));
    return m ? m.get(idx(x - cx * CHUNK, y, z - cz * CHUNK)) || null : null;
  }

  setBE(x, y, z, data) {
    const cx = Math.floor(x / CHUNK), cz = Math.floor(z / CHUNK);
    const k = key(cx, cz);
    let m = this.blockEntities.get(k);
    if (!m && data) { m = new Map(); this.blockEntities.set(k, m); }
    if (!m) return;
    const i = idx(x - cx * CHUNK, y, z - cz * CHUNK);
    if (data) m.set(i, data); else m.delete(i);
    const c = this.getChunk(cx, cz);
    if (c) { c.be = m; c.dirty = true; }
    this.dirtyMods.add(k);
    if (!this.mods.has(k)) this.mods.set(k, new Map()); // para que el chunk se guarde aunque no tenga cambios de bloques
    if (this.onBlockEntity) this.onBlockEntity(x, y, z, data);
  }

  // Avisar que cambió el contenido (para guardarlo)
  touchBE(x, y, z) {
    this.dirtyMods.add(key(Math.floor(x / CHUNK), Math.floor(z / CHUNK)));
    if (this.onBlockEntity) this.onBlockEntity(x, y, z, this.getBE(x, y, z));
  }

  markDirty(cx, cz) {
    const c = this.getChunk(cx, cz);
    if (c) c.dirty = true;
  }

  // Reglas del mundo después de un cambio: soporte de plantas y antorchas, gravedad, fluidos.
  neighborUpdates(x, y, z) {
    if (this.red === 'cliente') return; // el invitado no simula: el anfitrión decide y avisa
    const here = this.getBlock(x, y, z);
    const above = this.getBlock(x, y + 1, z);
    const ab = BLOCKS[above];
    const breakIt = (bx, by, bz, id) => { this.setBlock(bx, by, bz, AIR); if (this.onDrop) this.onDrop(bx, by, bz, id); };
    // planta, cactus o antorcha encima sin soporte → se rompe
    if ((ab.needsSupport && !ab.needsSupport.includes(here)) || (ab.needsSolidBelow && !SOLID[here])) breakIt(x, y + 1, z, above);
    if (ab.cane && !this.caneOk(x, y + 1, z)) breakIt(x, y + 1, z, above);
    // lianas y estalactitas colgando debajo
    const below = this.getBlock(x, y - 1, z);
    const bb = BLOCKS[below];
    if ((bb.needsAbove && here === AIR) || (bb.needsSolidAbove && !SOLID[here])) breakIt(x, y - 1, z, below);
    // antorchas de pared pegadas a este bloque
    if (!SOLID[here]) {
      for (let f = 0; f < 4; f++) {
        const [fx, fz] = FACING_VEC[f];
        const id = this.getBlock(x + fx, y, z + fz);
        if (BLOCKS[id].wall === f) breakIt(x + fx, y, z + fz, id);
      }
    }
    // gravedad: arena y grava caen (animado, si el juego lo maneja)
    if (ab.gravity && !SOLID[here]) this.fall(x, y + 1, z);
    if (BLOCKS[here].gravity) this.fall(x, y, z);
    // la arena de al lado también se entera: el generador deja a veces arena flotando, y antes no caía aunque se le quitara
    // todo alrededor (solo revisaba la de arriba)
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (BLOCKS[this.getBlock(x + dx, y, z + dz)].gravity) this.fall(x + dx, y, z + dz);
    if (BLOCKS[this.getBlock(x, y - 1, z)].gravity) this.fall(x, y - 1, z);
    // fluidos: revisar esta celda y sus vecinas
    this.scheduleFluidAround(x, y, z);
  }

  // la caña necesita caña debajo, o tierra/pasto/arena con agua al lado
  caneOk(x, y, z) {
    const below = this.getBlock(x, y - 1, z);
    if (BLOCKS[below].cane) return true;
    if (below !== K.grass && below !== K.dirt && below !== K.sand) return false;
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (FLUID[this.getBlock(x + dx, y - 1, z + dz)] === 1) return true;
    return false;
  }

  fall(x, y, z) {
    const id = this.getBlock(x, y, z);
    const below = this.getBlock(x, y - 1, z);
    if (y <= 0 || SOLID[below]) return;
    if (this.onFall) {
      // a la fila: se suelta en tickCaidas, unas cuantas por cuadro (v11.9.2; antes la cadena era recursiva y sin tope)
      const k = `${x},${y},${z}`;
      if (!(this.caidasSet ||= new Set()).has(k)) { this.caidasSet.add(k); (this.caidas ||= []).push([x, y, z]); }
      return;
    }
    let ty = y;
    while (ty > 0 && !SOLID[this.getBlock(x, ty - 1, z)]) ty--;
    this.setBlock(x, y, z, AIR, { updates: false });
    this.setBlock(x, ty, z, id, { updates: false });
    this.neighborUpdates(x, y, z);
  }

  // ---------- fluidos con niveles ----------
  // Fuente = 8, cada bloque que se aleja baja 1 (agua) o 2 (lava). Cayendo = lleno.
  scheduleFluid(x, y, z, delay) {
    if (y < 0 || y >= HEIGHT) return;
    const k = `${x},${y},${z}`;
    const t = performance.now() + delay;
    const cur = this.fluidQueue.get(k);
    if (cur === undefined || cur > t) this.fluidQueue.set(k, t);
  }

  scheduleFluidAround(x, y, z) {
    for (const [dx, dy, dz] of [[0, 0, 0], [1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1], [0, 1, 0], [0, -1, 0]]) {
      const id = this.getBlock(x + dx, y + dy, z + dz);
      if (FLUID[id]) this.scheduleFluid(x + dx, y + dy, z + dz, FLUID[id] === 2 ? 1200 : 250);
    }
  }

  fluidLevel(id, fam) {
    if (FLUID[id] !== fam) return 0;
    return FLUID_LEVEL[id];
  }

  canFlowInto(id) {
    if (id === AIR) return true;
    const b = BLOCKS[id];
    return b.render === 'cross' || b.render === 'torch';
  }

  placeFluid(x, y, z, newId) {
    const old = this.getBlock(x, y, z);
    if (old !== AIR && !FLUID[old] && this.onDrop) this.onDrop(x, y, z, old);
    this.setBlock(x, y, z, newId, { updates: false });
  }

  fluidStep(x, y, z) {
    if (!this.isLoaded(x, z)) return;
    const id = this.getBlock(x, y, z);
    const fam = FLUID[id];
    if (!fam) return;
    const dec = fam === 1 ? 1 : 2;
    const delay = fam === 1 ? 250 : 1200;
    const H4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    // lava que toca agua se enfría
    if (fam === 2) {
      for (const [dx, dy, dz] of [[1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1], [0, 1, 0]]) {
        if (FLUID[this.getBlock(x + dx, y + dy, z + dz)] === 1) {
          this.setBlock(x, y, z, BLOCKS[id].source ? K.obsidian : K.cobble);
          if (this.onFluidMix) this.onFluidMix(x, y, z);
          return;
        }
      }
    }
    let level = FLUID_LEVEL[id];
    let falling = !!BLOCKS[id].falling;
    if (!BLOCKS[id].source) {
      // ¿quién me alimenta?
      let want = 0;
      falling = false;
      if (FLUID[this.getBlock(x, y + 1, z)] === fam) { want = 8; falling = true; }
      else {
        let sources = 0;
        for (const [dx, dz] of H4) {
          const n = this.getBlock(x + dx, y, z + dz);
          if (FLUID[n] !== fam) continue;
          if (BLOCKS[n].source) sources++;
          want = Math.max(want, FLUID_LEVEL[n] - dec);
        }
        // fuente infinita: agua entre dos fuentes sobre algo firme
        const under = this.getBlock(x, y - 1, z);
        if (fam === 1 && sources >= 2 && (SOLID[under] || (FLUID[under] === 1 && BLOCKS[under].source))) {
          this.setBlock(x, y, z, K.water, { updates: false });
          this.scheduleFluidAround(x, y, z);
          return;
        }
      }
      const newId = want <= 0 ? AIR : fluidId(fam, want, falling);
      if (newId !== id) {
        this.setBlock(x, y, z, newId, { updates: false });
        for (const [dx, dy, dz] of [[1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1], [0, -1, 0]]) {
          if (FLUID[this.getBlock(x + dx, y + dy, z + dz)] === fam) this.scheduleFluid(x + dx, y + dy, z + dz, delay);
        }
        if (newId === AIR) return;
      }
      level = want;
    }
    // bajar primero
    const below = this.getBlock(x, y - 1, z);
    if (FLUID[below] && FLUID[below] !== fam) {
      // agua cayendo sobre lava (o al revés)
      this.setBlock(x, y - 1, z, fam === 1 ? (BLOCKS[below].source ? K.obsidian : K.cobble) : K.stone);
      if (this.onFluidMix) this.onFluidMix(x, y - 1, z);
      return;
    }
    if (this.canFlowInto(below) || (FLUID[below] === fam && !BLOCKS[below].source && !BLOCKS[below].falling)) {
      this.placeFluid(x, y - 1, z, fluidId(fam, 8, true));
      this.scheduleFluid(x, y - 1, z, delay);
      if (!BLOCKS[id].source) return;
    }
    // y después a los lados
    const next = (falling ? 8 : level) - dec;
    if (next < 1 || (!SOLID[below] && !FLUID[below] && !BLOCKS[id].source)) return;
    for (const [dx, dz] of H4) {
      const nx = x + dx, nz = z + dz;
      const n = this.getBlock(nx, y, nz);
      if (FLUID[n] && FLUID[n] !== fam) {
        this.setBlock(nx, y, nz, fam === 1 ? (BLOCKS[n].source ? K.obsidian : K.cobble) : K.cobble);
        if (this.onFluidMix) this.onFluidMix(nx, y, nz);
        continue;
      }
      const can = this.canFlowInto(n) || (FLUID[n] === fam && !BLOCKS[n].source && !BLOCKS[n].falling && FLUID_LEVEL[n] < next);
      if (!can) continue;
      this.placeFluid(nx, y, nz, fluidId(fam, next));
      this.scheduleFluid(nx, y, nz, delay);
    }
  }

  tickFluids(now) {
    if (this.fluidQueue.size === 0 || this.red === 'cliente') return;
    let budget = 220;
    for (const [k, t] of this.fluidQueue) {
      if (t > now) continue;
      this.fluidQueue.delete(k);
      const [x, y, z] = k.split(',').map(Number);
      this.fluidStep(x, y, z);
      if (--budget <= 0) break;
    }
    if (this.fluidQueue.size > 20000) this.fluidQueue.clear();
  }

  // compatibilidad con el nombre viejo
  tickWater(now) { this.tickFluids(now); }

  // ---------- cultivos ----------
  trackCrop(x, y, z, id) {
    const k = `${x},${y},${z}`;
    if (BLOCKS[id].crop) this.crops.add(k); else this.crops.delete(k);
  }

  // ---------- carga de chunks ----------
  ensureChunk(cx, cz) {
    const k = key(cx, cz);
    let c = this.chunks.get(k);
    if (c) return c;
    c = new Chunk(cx, cz);
    const structures = this.gen.generate(cx, cz, c.blocks, c.tint) || [];
    apuntalar(c.blocks);
    const m = this.mods.get(k);
    if (m) for (const [i, id] of m) c.blocks[i] = id;
    // cofres con botín del generador: solo si el bloque sigue ahí y todavía no tiene datos guardados
    for (const st of structures) {
      if (st.npc) { this.villageNpcs.set(`${st.npc.village}:${st.npc.name}`, st.npc); continue; }
      if (st.zone) { this.zones.set(st.zone.id, st.zone); continue; }
      if (st.beacon) { this.beacons.add(`${st.beacon.x},${st.beacon.y},${st.beacon.z}`); continue; }
      const i = idx(st.x, st.y, st.z);
      if (st.id ? c.blocks[i] !== st.id : BLOCKS[c.blocks[i]].key !== st.be.type) continue;
      let bm = this.blockEntities.get(k);
      if (!bm) { bm = new Map(); this.blockEntities.set(k, bm); }
      if (!bm.has(i)) bm.set(i, st.be);
    }
    c.be = this.blockEntities.get(k) || null;
    // cultivos sembrados por el jugador (están en los cambios guardados)
    if (m) for (const [i, id] of m) if (BLOCKS[id].crop) this.crops.add(`${cx * CHUNK + (i % CHUNK)},${Math.floor(i / (CHUNK * CHUNK))},${cz * CHUNK + (Math.floor(i / CHUNK) % CHUNK)}`);
    c.countGlow();
    this.chunks.set(k, c);
    this.stats.generated++;
    return c;
  }

  neighborsReady(cx, cz) {
    for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (!this.chunks.has(key(cx + dx, cz + dz))) return false;
    return true;
  }

  meshChunk(c) {
    const nb = [];
    for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) nb.push(this.getChunk(c.cx + dx, c.cz + dz));
    const geo = buildChunkGeometry(nb, this.dim === 'inframundo' ? 6 : this.dim === 'cielo' ? 10 : 0);
    anotarLuces(c); // v12.8.2: dónde brilla algo (los halos de Medio, halos.js)
    this.disposeMeshes(c);
    const ox = c.cx * CHUNK, oz = c.cz * CHUNK;
    if (geo.opaque) {
      c.mesh = new THREE.Mesh(toGeometry(geo.opaque), this.opaqueMat);
      c.mesh.position.set(ox, 0, oz);
      c.mesh.matrixAutoUpdate = false; c.mesh.updateMatrix();
      this.scene.add(c.mesh);
    }
    if (geo.water) {
      c.waterMesh = new THREE.Mesh(toGeometry(geo.water), this.waterMat);
      c.waterMesh.position.set(ox, 0, oz);
      c.waterMesh.matrixAutoUpdate = false; c.waterMesh.updateMatrix();
      c.waterMesh.renderOrder = 1;
      this.scene.add(c.waterMesh);
    }
    c.dirty = false;
    c.shown = true;
    this.stats.meshed++;
  }

  // Radio (en chunks) del cuadrado alrededor del jugador que ya está dibujado completo. El horizonte lejano se
  // esconde solo ahí adentro, así mientras carga no quedan huecos con cielo entre lo cercano y lo lejano.
  shownRadius(px, pz, R) {
    const pcx = Math.floor(px / CHUNK), pcz = Math.floor(pz / CHUNK);
    for (let r = 0; r <= R; r++) {
      for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dz)) !== r) continue;
        const c = this.getChunk(pcx + dx, pcz + dz);
        if (!c || !c.shown) return r - 1;
      }
    }
    return R;
  }

  disposeMeshes(c) {
    if (c.mesh) { this.scene.remove(c.mesh); c.mesh.geometry.dispose(); c.mesh = null; }
    if (c.waterMesh) { this.scene.remove(c.waterMesh); c.waterMesh.geometry.dispose(); c.waterMesh = null; }
  }

  // Trabajo por cuadro con presupuesto de tiempo: genera y malla lo más cercano primero.
  tickCaidas(max = 24) {
    const C = this.caidas;
    if (!C || !C.length) return;
    for (let n = 0; n < max && C.length; n++) {
      const [x, y, z] = C.shift();
      this.caidasSet.delete(`${x},${y},${z}`);
      if (!this.isLoaded(x, z)) { const v = (this.caidasVueltas ||= new Map()), k = `${x},${y},${z}`, n = (v.get(k) || 0) + 1; if (n < 4) { v.set(k, n); this.caidasSet.add(k); C.push([x, y, z]); } else v.delete(k); break; } // su chunk no está: más tarde
      if (this.caidasVueltas) this.caidasVueltas.delete(`${x},${y},${z}`); // ya cargó: se olvida la cuenta
      const id = this.getBlock(x, y, z);
      if (!BLOCKS[id].gravity || y <= 0 || SOLID[this.getBlock(x, y - 1, z)]) continue;
      this.setBlock(x, y, z, AIR); // esto revisa a los vecinos, que se ponen en fila si les toca
      this.onFall(x, y, z, id);
    }
  }

  update(px, pz, budgetMs = 8) {
    this.tickCaidas();
    const pcx = Math.floor(px / CHUNK), pcz = Math.floor(pz / CHUNK);
    const R = this.renderDistance;
    const start = performance.now();
    // descargar lejanos
    const ahora = performance.now();
    for (const [k, c] of this.chunks) {
      if ((Math.abs(c.cx - pcx) > R + 2 || Math.abs(c.cz - pcz) > R + 2) && !(c.fijoHasta > ahora)) {
        this.disposeMeshes(c);
        this.chunks.delete(k);
      }
    }
    // lista ordenada por distancia
    if (!this._order || this._orderR !== R) {
      this._orderR = R;
      this._order = [];
      for (let dz = -R - 1; dz <= R + 1; dz++) for (let dx = -R - 1; dx <= R + 1; dx++) this._order.push([dx, dz, dx * dx + dz * dz]);
      this._order.sort((a, b) => a[2] - b[2]);
    }
    let work = 0;
    for (const [dx, dz] of this._order) {
      if (performance.now() - start > budgetMs && work > 0) break;
      const cx = pcx + dx, cz = pcz + dz;
      const inner = Math.abs(dx) <= R && Math.abs(dz) <= R;
      let c = this.getChunk(cx, cz);
      if (!c) { c = this.ensureChunk(cx, cz); work++; continue; }
      if (inner && c.dirty && this.neighborsReady(cx, cz)) { this.meshChunk(c); work++; }
    }
    return work;
  }

  // ¿Está listo el chunk del jugador para jugar?
  readyAt(x, z) {
    const c = this.getChunk(Math.floor(x / CHUNK), Math.floor(z / CHUNK));
    return !!c && !c.dirty;
  }

  dispose() {
    for (const c of this.chunks.values()) this.disposeMeshes(c);
    this.chunks.clear();
    this.opaqueMat.dispose();
    this.waterMat.dispose();
  }

  // Lanza un rayo (DDA) desde ojo en dirección dir; devuelve el bloque apuntado y la cara.
  // las cajas de un bloque en su celda (0..1), o null si es el cubo entero. seleccion: también lo que no choca (plantas,
  // puerta abierta), para apuntar y dibujar el contorno con la forma real (v11.8)
  cajas(x, y, z, id, seleccion = false) {
    const b = BLOCKS[id];
    if (b.door && b.render === 'model') {
      if (b.open && !seleccion) return [];
      const be = this.getBE(x, b.upper ? y - 1 : y, z) || {}, a = GIRO[be.facing || 0];
      // en coordenadas centradas: cerrada es la tabla del frente; abierta, la del lado de la bisagra
      const q = !b.open ? [-0.5, 0.32, 0.5, 0.5] : be.hinge ? [0.32, -0.5, 0.5, 0.41] : [-0.5, -0.5, -0.32, 0.41];
      const c = Math.cos(a), s = Math.sin(a), xs = [], zs = [];
      for (const [px, pz] of [[q[0], q[1]], [q[2], q[1]], [q[0], q[3]], [q[2], q[3]]]) { xs.push(px * c + pz * s + 0.5); zs.push(-px * s + pz * c + 0.5); }
      return [[Math.min(...xs), 0, Math.min(...zs), Math.max(...xs), 1, Math.max(...zs)]];
    }
    if (!seleccion) return BOXES[id];
    if (b.wall !== undefined) { const [fx, fz] = FACING_VEC[b.wall], cx = 0.5 - fx * 0.32, cz = 0.5 - fz * 0.32; return [[cx - 0.16, 0.1, cz - 0.16, cx + 0.16, 0.85, cz + 0.16]]; } // la antorcha de pared va pegada a su pared
    if (b.thin) return CAJA_FINA;
    if (b.fence) return null; // la cerca se une con las vecinas al dibujarse: se apunta como cubo
    if ((b.render === 'shape' || b.render === 'model') && (b.boxes || b.collide)) return (CAJAS_VISTA[id] ||= (b.boxes || b.collide).map((q) => q.map((v) => v / 16))); // lo que se ve, no la caja de choque
    return BOXES[id];
  }

  // ¿el punto (x, y, z) está adentro de algo firme? Con la forma real: una flecha pasa por encima de una losa y se clava en la
  // tabla de la puerta, no en la celda entera (v11.10.2)
  solidoEn(x, y, z) {
    const bx = Math.floor(x), by = Math.floor(y), bz = Math.floor(z), id = this.getBlock(bx, by, bz);
    if (!SOLID[id]) return false;
    const cj = this.cajas(bx, by, bz, id);
    if (!cj) return true;
    const lx = x - bx, ly = y - by, lz = z - bz;
    return cj.some((q) => lx >= q[0] && lx <= q[3] && ly >= q[1] && ly <= q[4] && lz >= q[2] && lz <= q[5]);
  }

  raycast(ox, oy, oz, dx, dy, dz, maxDist, fluids = false) {
    let x = Math.floor(ox), y = Math.floor(oy), z = Math.floor(oz);
    const stepX = dx > 0 ? 1 : -1, stepY = dy > 0 ? 1 : -1, stepZ = dz > 0 ? 1 : -1;
    const tDeltaX = dx !== 0 ? Math.abs(1 / dx) : Infinity;
    const tDeltaY = dy !== 0 ? Math.abs(1 / dy) : Infinity;
    const tDeltaZ = dz !== 0 ? Math.abs(1 / dz) : Infinity;
    let tMaxX = dx !== 0 ? ((dx > 0 ? x + 1 - ox : ox - x) * tDeltaX) : Infinity;
    let tMaxY = dy !== 0 ? ((dy > 0 ? y + 1 - oy : oy - y) * tDeltaY) : Infinity;
    let tMaxZ = dz !== 0 ? ((dz > 0 ? z + 1 - oz : oz - z) * tDeltaZ) : Infinity;
    let nx = 0, ny = 0, nz = 0, t = 0;
    while (t <= maxDist) {
      const id = this.getBlock(x, y, z);
      if (id !== AIR && (fluids ? BLOCKS[id].source || !FLUID[id] : !FLUID[id])) {
        // con forma (losa, cerca, puerta, planta): el rayo tiene que tocar alguna de sus cajas; si no, sigue de largo
        const cj = FLUID[id] ? null : this.cajas(x, y, z, id, true);
        if (!cj) return { x, y, z, id, nx, ny, nz, dist: t };
        const h = rayoCajas(ox - x, oy - y, oz - z, dx, dy, dz, cj);
        if (h && h.t <= maxDist) return { x, y, z, id, nx: h.nx, ny: h.ny, nz: h.nz, dist: h.t, caja: h.caja };
      }
      if (tMaxX < tMaxY && tMaxX < tMaxZ) { x += stepX; t = tMaxX; tMaxX += tDeltaX; nx = -stepX; ny = 0; nz = 0; }
      else if (tMaxY < tMaxZ) { y += stepY; t = tMaxY; tMaxY += tDeltaY; nx = 0; ny = -stepY; nz = 0; }
      else { z += stepZ; t = tMaxZ; tMaxZ += tDeltaZ; nx = 0; ny = 0; nz = -stepZ; }
    }
    return null;
  }
}

// v11.9.1: el generador dejaba arena (y grava) colgando sobre cuevas y ríos, y como nadie la tocaba se quedaba flotando. Al cargar el
// chunk, lo que tiene gravedad sin nada firme debajo se vuelve su versión firme (arena → arenisca, grava → piedra, ceniza → basalto).
// Es sobre lo generado, antes de aplicar lo que uno cambió: se calcula igual cada vez y no hace falta guardarlo
const CAPA = CHUNK * CHUNK;
let FIRME = null;
function apuntalar(bl) {
  if (!FIRME) { FIRME = new Uint16Array(BLOCKS.length); for (let i = 0; i < BLOCKS.length; i++) if (BLOCKS[i].gravity) FIRME[i] = BLOCKS[i].key === 'gravel' ? K.stone : BLOCKS[i].key === 'ceniza' ? (K.basalt || K.stone) : K.sandstone; }
  for (let i = CAPA; i < bl.length; i++) { const f = FIRME[bl[i]]; if (f && !SOLID[bl[i - CAPA]]) bl[i] = f; }
}
const GIRO = [0, Math.PI / 2, Math.PI, -Math.PI / 2];
const CAJA_FINA = [[0.15, 0, 0.15, 0.85, 0.85, 0.85]];
const CAJAS_VISTA = [];
// rayo contra cajas en coordenadas de la celda: la más cercana, con la cara que tocó
function rayoCajas(ox, oy, oz, dx, dy, dz, cajas) {
  let mejor = null;
  for (const c of cajas) {
    let t0 = 0, t1 = Infinity, eje = -1, sg = 0;
    const o = [ox, oy, oz], d = [dx, dy, dz];
    let ok = true;
    for (let k = 0; k < 3; k++) {
      const lo = c[k], hi = c[k + 3];
      if (Math.abs(d[k]) < 1e-9) { if (o[k] < lo || o[k] > hi) { ok = false; break; } continue; }
      let ta = (lo - o[k]) / d[k], tb = (hi - o[k]) / d[k], s = -1;
      if (ta > tb) { [ta, tb] = [tb, ta]; s = 1; }
      if (ta > t0) { t0 = ta; eje = k; sg = s; }
      t1 = Math.min(t1, tb);
      if (t0 > t1) { ok = false; break; }
    }
    if (!ok || (mejor && t0 >= mejor.t)) continue;
    mejor = { t: t0, nx: eje === 0 ? sg : 0, ny: eje === 1 ? sg : 0, nz: eje === 2 ? sg : 0, caja: c };
  }
  if (mejor && mejor.nx === 0 && mejor.ny === 0 && mejor.nz === 0) mejor.ny = 1; // el ojo adentro de la caja: que apunte arriba
  return mejor;
}

function toGeometry(d) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(d.position, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(d.uv, 2));
  g.setAttribute('color', new THREE.BufferAttribute(d.color, 3));
  g.setAttribute('aLight', new THREE.BufferAttribute(d.light, 2));
  g.setAttribute('aAnim', new THREE.BufferAttribute(d.anim, 1));
  g.setIndex(new THREE.BufferAttribute(d.index, 1));
  g.computeBoundingSphere();
  return g;
}
