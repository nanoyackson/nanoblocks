// "Horizonte lejano": más allá de la distancia de visión normal se dibuja el terreno en baja resolución
// (montañas, costas, bosques, nieve). Se calcula Y SE ARMA en un hilo aparte (lodworker.js + lodmesh.js) y se esconde con el
// shader donde ya hay chunks de verdad, así no se superponen.
// v12.0.1 (PLAN_HORIZONTE, fase 1): las baldosas forman un árbol cuaternario. Raíces de 1 024 bloques que se parten en cuatro
// mientras están cerca (distancia < k·lado), hasta 128 bloques (64 desde «Medio»: paso 2 junto a los chunks). Cada baldosa tiene
// 32×32 celdas, así que el paso crece con la distancia (2, 4, 8, 16, 32) y las hojas nunca se pisan. Faldones contra las grietas
// y un fundido tramado de 0.5 s cuando una baldosa reemplaza a otra. En «Bajo» las baldosas son las de antes (128 bloques, paso
// 4/8/16 por distancia), con faldones y fundido: cuesta lo mismo que antes.
import * as THREE from 'three';
import { SKY_LIGHT } from './world.js';
import { CHUNK, SEA } from './worldgen.js';
import { parcheAtmos } from './atmosfera.js';

const RAIZ = 1024, CELDAS = 32, FUNDIDO = 0.5;
const VISIBLE = { value: 1 };

export class FarTerrain {
  constructor(scene, seed, genVersion = 1, tipo = 'normal') {
    this.scene = scene;
    this.tiles = new Map(); // "x0,z0,lado" -> { mesh, lado, fade }
    this.pending = new Map();
    this.distance = 768;
    this.fina = false; // desde «Medio»: el árbol cuaternario con paso 2 junto a los chunks
    this.minLado = 128;
    this.parte = 1.5; // se parte si la distancia es menor que parte·lado
    this.nextId = 1;
    this.group = new THREE.Group();
    scene.add(this.group);
    this.uniforms = { uCenter: { value: new THREE.Vector2() }, uHide: { value: 0 }, uDaylight: { value: 1 }, uSkyColor: SKY_LIGHT };
    this.mat = new THREE.MeshBasicMaterial({ vertexColors: true });
    this.mat.userData.atmosNombre = 'lejos'; // v12.4.1
    const self = this;
    // función común (no flecha): «this» es el material, así cada baldosa que entra fundiéndose lleva su propio uFade
    this.mat.onBeforeCompile = function (sh) {
      Object.assign(sh.uniforms, self.uniforms);
      sh.uniforms.uFade = (this.userData && this.userData.fade) || VISIBLE;
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vWorldLod;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvWorldLod = (modelMatrix * vec4(position, 1.0)).xyz;');
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', `#include <common>
          varying vec3 vWorldLod;
          uniform vec2 uCenter;
          uniform float uHide;
          uniform float uDaylight;
          uniform vec3 uSkyColor;
          uniform float uFade;
          float bayer2(vec2 a) { a = floor(a); return fract(a.x / 2.0 + a.y * a.y * 0.75); }
          float bayer4(vec2 a) { return bayer2(0.5 * a) * 0.25 + bayer2(a); }`)
        .replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>
          if (max(abs(vWorldLod.x - uCenter.x), abs(vWorldLod.z - uCenter.y)) < uHide) discard;
          if (uFade < 1.0 && bayer4(gl_FragCoord.xy) >= uFade) discard;`)
        .replace('#include <color_fragment>', `#include <color_fragment>
          // mismo color de luz que lo cercano (sol dorado, luna azul) y la misma saturación
          diffuseColor.rgb *= max(uDaylight, 0.08) * mix(vec3(1.0), uSkyColor, 0.85);
          float lum = dot(diffuseColor.rgb, vec3(0.299, 0.587, 0.114));
          diffuseColor.rgb = mix(vec3(lum), diffuseColor.rgb, 1.14);
#ifdef ATMOS_AGUA
          // v12.8.0: el agua lejana (la cara de arriba a SEA + 0.875, azul) refleja el cielo por el ángulo y brilla con el sol,
          // como la cercana de lejos (world.js, uAgua): así no hay costura al atardecer
          if (abs(vWorldLod.y - ${SEA + 0.875}) < 0.06 && diffuseColor.b > diffuseColor.r * 1.4) {
            vec3 vL = normalize(cameraPosition - vWorldLod);
            float fL = (0.03 + 0.97 * pow(1.0 - clamp(vL.y, 0.0, 1.0), 5.0)) * 0.15;
            vec3 cieloL = mix(uCieloHoriz, uCieloCenit, 0.25) * max(uDaylight, 0.12);
            diffuseColor.rgb = mix(diffuseColor.rgb, cieloL, min(0.6, fL * 3.0));
            vec3 rL = reflect(-vL, vec3(0.0, 1.0, 0.0));
            diffuseColor.rgb += pow(max(dot(rL, uSunDir), 0.0), 60.0) * uSunCol * 0.35 * (1.0 - uAgua.z) * step(0.0, uSunDir.y);
          }
#endif`);
      parcheAtmos(sh); // v12.0.0
    };
    this.worker = new Worker(new URL('./lodworker.js', import.meta.url), { type: 'module' });
    this.worker.postMessage({ type: 'init', seed, genVersion, tipo });
    this.worker.onmessage = (e) => this.onTile(e.data);
    this.inFlight = 0;
  }

  setDistance(d) {
    this.distance = d;
    this.group.visible = d > 0;
    if (d <= 0) { for (const [k, t] of [...this.tiles]) this.quitar(k, t); this.cola = []; this.want = new Map(); this.pending.clear(); } // v12.4.1: apagado, se libera la GPU; v12.4.4: y no se sigue pidiendo
  }
  // v12.4.1: en Bajo, el horizonte llega hasta 1 536 (con baldosas de 128, «muy lejos» eran 2 401 mallas)
  alcance() { return this.fina ? this.distance : Math.min(this.distance, 1536); }
  // v12.0.1: «paso 2» junto a los chunks y bandas más anchas desde la calidad Media (en Bajo cuesta lo de antes)
  setCalidad(fina) {
    this.fina = !!fina;
    this.minLado = fina ? 64 : 128;
    this.parte = 1.5; // bandas: 64 hasta ~192 bloques, 128 hasta ~384, 256 hasta ~768, 512 hasta ~1 536
  }

  dispose() {
    this.worker.terminate();
    for (const t of this.tiles.values()) { t.mesh.geometry.dispose(); if (t.mesh.material !== this.mat) t.mesh.material.dispose(); }
    this.tiles.clear();
    if (this.group.parent) this.group.parent.remove(this.group);
    this.mat.dispose();
  }

  // las hojas del árbol: baldosas que no se pisan, más chicas cerca del jugador
  hojas(px, pz, D) {
    const out = [];
    const hide = this.uniforms.uHide.value, ux = this.uniforms.uCenter.value.x, uz = this.uniforms.uCenter.value.y;
    const visitar = (x0, z0, lado) => {
      const dx = Math.max(x0 - px, 0, px - (x0 + lado)), dz = Math.max(z0 - pz, 0, pz - (z0 + lado));
      const dist = Math.max(dx, dz);
      if (dist > D) return;
      // entera dentro de los chunks cargados: no hace falta
      if (Math.abs(x0 - ux) < hide && Math.abs(x0 + lado - ux) < hide && Math.abs(z0 - uz) < hide && Math.abs(z0 + lado - uz) < hide) return;
      // en Bajo, las baldosas de antes: todas de 128 bloques, con paso 4, 8 o 16 según la distancia (cuesta lo mismo que antes)
      if (!this.fina) {
        if (lado > 128) { const m = lado / 2; visitar(x0, z0, m); visitar(x0 + m, z0, m); visitar(x0, z0 + m, m); visitar(x0 + m, z0 + m, m); return; }
        const step = dist < 384 ? 4 : dist < 768 ? 8 : 16;
        out.push({ key: `${x0},${z0},${lado},${step}`, x0, z0, lado, dist, step });
        return;
      }
      if (lado > this.minLado && dist < this.parte * lado) {
        const m = lado / 2;
        visitar(x0, z0, m); visitar(x0 + m, z0, m); visitar(x0, z0 + m, m); visitar(x0 + m, z0 + m, m);
        return;
      }
      out.push({ key: `${x0},${z0},${lado}`, x0, z0, lado, dist, step: lado / CELDAS });
    };
    const r0x = Math.floor((px - D) / RAIZ), r1x = Math.floor((px + D) / RAIZ), r0z = Math.floor((pz - D) / RAIZ), r1z = Math.floor((pz + D) / RAIZ);
    for (let rz = r0z; rz <= r1z; rz++) for (let rx = r0x; rx <= r1x; rx++) visitar(rx * RAIZ, rz * RAIZ, RAIZ);
    return out;
  }

  update(px, pz, renderDistance, daylight) {
    const pcx = Math.floor(px / CHUNK), pcz = Math.floor(pz / CHUNK);
    this.uniforms.uCenter.value.set((pcx + 0.5) * CHUNK, (pcz + 0.5) * CHUNK);
    this.uniforms.uHide.value = (renderDistance + 0.5) * CHUNK - 3;
    this.uniforms.uDaylight.value = daylight;
    if (this.distance <= 0) return;
    const lista = this.hojas(px, pz, this.alcance());
    this.ultPos = { px, pz };
    const want = new Map(lista.map((o) => [o.key, o]));
    lista.sort((a, b) => a.dist - b.dist);
    this.cola = lista;
    this.despachar();
    // quitar las que ya no sirven, pero solo cuando lo que las reemplaza ya está y terminó de fundirse (sin huecos)
    const listas = (x0, z0, lado) => {
      for (const o of want.values()) {
        if (o.x0 >= x0 + lado || o.x0 + o.lado <= x0 || o.z0 >= z0 + lado || o.z0 + o.lado <= z0) continue;
        const t = this.tiles.get(o.key);
        if (!t || t.fade < 1) return false;
      }
      return true;
    };
    for (const [key, t] of this.tiles) {
      if (want.has(key)) continue;
      if (!listas(t.mesh.position.x, t.mesh.position.z, t.lado)) continue;
      this.quitar(key, t);
    }
    // si se cancelaron pedidos que ya no hacen falta, que no estorben
    for (const k of [...this.pending.keys()]) if (!want.has(k)) this.pending.delete(k);
    this.want = want;
  }

  // v12.4.1: manda al worker lo que falta, hasta 5 en vuelo; se llama al actualizar y cada vez que llega una baldosa
  despachar() {
    for (const o of this.cola || []) {
      if (this.inFlight >= 5) break;
      if (this.tiles.has(o.key) || this.pending.has(o.key)) continue;
      const id = this.nextId++;
      this.pending.set(o.key, id);
      this.inFlight++;
      this.worker.postMessage({ type: 'tile', id, x0: o.x0, z0: o.z0, cells: o.lado / o.step, step: o.step, key: o.key });
    }
  }

  quitar(key, t) {
    this.group.remove(t.mesh); t.mesh.geometry.dispose();
    if (t.mesh.material !== this.mat) t.mesh.material.dispose();
    this.tiles.delete(key);
  }

  // cada cuadro: el fundido de las baldosas que van entrando
  tick(dt) {
    for (const t of this.tiles.values()) {
      if (t.fade >= 1) continue;
      t.fade = Math.min(1, t.fade + dt / FUNDIDO);
      t.mesh.material.userData.fade.value = t.fade;
      if (t.fade >= 1) { const m = t.mesh.material; t.mesh.material = this.mat; m.dispose(); }
    }
  }

  onTile(d) {
    this.inFlight = Math.max(0, this.inFlight - 1);
    let key = null;
    for (const [k, id] of this.pending) if (id === d.id) { key = k; break; }
    if (!key) return;
    this.pending.delete(key);
    if (this.distance <= 0) return; // v12.4.4
    // v12.4.4: despachar() DESPUÉS de anotar la baldosa: antes se llamaba aquí, con la clave ya fuera de «pending» y todavía no en
    // «tiles», y la volvía a pedir; la segunda copia pisaba a la primera en el Map y esa malla quedaba huérfana en la GPU (cada baldosa, dos veces)
    if (this.want && !this.want.has(key)) { this.despachar(); return; }
    const vieja = this.tiles.get(key);
    if (vieja) this.quitar(key, vieja); // por si acaso: nunca dos mallas con la misma clave
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(d.pos, 3));
    g.setAttribute('color', new THREE.BufferAttribute(d.col, 3));
    g.setIndex(new THREE.BufferAttribute(d.idx, 1));
    g.computeBoundingSphere();
    // si cubre algo que ya se ve, entra fundiéndose; si no (hueco), aparece de una
    const tapa = [...this.tiles.values()].some((t) => {
      const [x0, z0] = [t.mesh.position.x, t.mesh.position.z];
      return !(x0 >= d.x0 + d.cells * d.step || x0 + t.lado <= d.x0 || z0 >= d.z0 + d.cells * d.step || z0 + t.lado <= d.z0);
    });
    let mat = this.mat, fade = 1;
    if (tapa) {
      mat = this.mat.clone();
      mat.onBeforeCompile = this.mat.onBeforeCompile;
      mat.defines = { ...(this.mat.defines || {}) };
      mat.customProgramCacheKey = this.mat.customProgramCacheKey;
      mat.userData = { ...this.mat.userData, fade: { value: 0 } };
      fade = 0;
    }
    const mesh = new THREE.Mesh(g, mat);
    mesh.position.set(d.x0, 0, d.z0);
    mesh.matrixAutoUpdate = false; mesh.updateMatrix();
    this.group.add(mesh);
    this.tiles.set(key, { mesh, lado: d.cells * d.step, fade });
    this.despachar();
  }
}
