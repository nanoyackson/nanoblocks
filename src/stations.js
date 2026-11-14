// Estaciones y bloques interactivos: horno (funde de verdad), cofre (tapa con resorte), puerta (bisagra animada),
// mesa de trabajo (los ingredientes quedan sobre la mesa) y llamas de antorchas.
// Inspirado en la idea de "interacciones cinematográficas" y "mundo con animaciones suaves", hecho a nuestra manera.
import { quizaAlacranDeCofre } from './bichos.js';
import { extras } from './inventory.js';
import * as THREE from 'three';
import { BLOCKS, BLOCK_BY_KEY as K, AIR, SOLID, maxStack } from './blocks.js';
import { SMELT, FUEL, COOK_TIME, findRecipe } from './recipes.js';
import { tileCanvas } from './textures.js';
import { makeItemMesh, tintModel, disposeModel } from './models.js';
import { CHUNK } from './worldgen.js';
import { registrarMonte } from './monte.js';
import { carpaPuesta } from './hogar.js';
import { registrarCencerro } from './asedio.js';
import { registrarFarol } from './nidos.js';
import { registrarPlato } from './plato.js';
import { registrarOlla } from './defensa.js';
import { registrarCorazon } from './corazon.js';
import { yugoCerca } from './finca2.js';

export const FACING_VEC = [[0, 1], [1, 0], [0, -1], [-1, 0]]; // (x, z) del frente

// orientación hacia el jugador según hacia dónde mira
export function facingFromLook(dx, dz) {
  if (Math.abs(dx) > Math.abs(dz)) return dx > 0 ? 3 : 1;
  return dz > 0 ? 2 : 0;
}

const tileTexCache = new Map();
function tileMat(name) {
  let t = tileTexCache.get(name);
  if (!t) {
    t = new THREE.CanvasTexture(tileCanvas(name));
    t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.generateMipmaps = false;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    tileTexCache.set(name, t);
  }
  const m = new THREE.MeshBasicMaterial({ map: t });
  m.userData.sharedMap = true;
  return m;
}

// caja con texturas de tiles; uvs recortadas a la porción que corresponde al tamaño
function tileBox(w, h, d, faces) {
  const g = new THREE.BoxGeometry(w, h, d);
  const uv = g.attributes.uv;
  const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++) {
    const i = f * 4 + k;
    uv.setXY(i, uv.getX(i) * dims[f][0], uv.getY(i) * dims[f][1]);
  }
  return new THREE.Mesh(g, faces.map((n) => tileMat(n)));
}

// aro o disco de luz aditivo (no lo oscurece la luz del mundo)
function glowRing(r, color, disc = false) {
  const g = disc ? new THREE.CircleGeometry(r, 32) : new THREE.RingGeometry(r * 0.7, r, 40);
  const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
  m.userData.glow = true;
  return m;
}

// Cofre de madera con flejes de hierro: caja hueca forrada de terciopelo rojo, tapa hueca con bisagras,
// cerradura de bronce con pestillo que se levanta, agarraderas a los lados y lo que guarda adentro a la vista.
const WALL = 0.0625, CW = 0.875, CH = 0.58, LH = 0.28;
function buildChest(v, group) {
  const body = new THREE.Group();
  group.add(body); v.body = body;
  const add = (parent, w, h, d, faces, x, y, z) => { const m = tileBox(w, h, d, faces); m.position.set(x, y, z); parent.add(m); return m; };
  const W = 'cofre_madera', F = 'cofre_forro', I = 'hierro_cofre', O = 'oro_cofre', T = 'cofre_tapa';
  // caja: piso y cuatro paredes (cara de adentro forrada)
  add(body, CW, WALL, CW, [W, W, F, W, W, W], 0, WALL / 2, 0);
  add(body, CW, CH, WALL, [W, W, W, W, W, F], 0, CH / 2, CW / 2 - WALL / 2);
  add(body, CW, CH, WALL, [W, W, W, W, F, W], 0, CH / 2, -CW / 2 + WALL / 2);
  add(body, WALL, CH, CW - 2 * WALL, [F, W, W, W, W, W], -CW / 2 + WALL / 2, CH / 2, 0);
  add(body, WALL, CH, CW - 2 * WALL, [W, F, W, W, W, W], CW / 2 - WALL / 2, CH / 2, 0);
  // flejes de hierro: esquinas y dos bandas que dan la vuelta
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(body, 0.07, CH + 0.01, 0.07, Array(6).fill(I), sx * (CW / 2 - 0.025), CH / 2, sz * (CW / 2 - 0.025));
  for (const bx of [-0.24, 0.24]) { add(body, 0.06, CH, 0.012, Array(6).fill(I), bx, CH / 2, CW / 2 + 0.004); add(body, 0.06, CH, 0.012, Array(6).fill(I), bx, CH / 2, -CW / 2 - 0.004); }
  add(body, CW + 0.012, 0.05, CW + 0.012, [I, I, W, W, I, I], 0, 0.06, 0);
  // cerradura y agarraderas
  add(body, 0.17, 0.2, 0.03, Array(6).fill(O), 0, CH - 0.12, CW / 2 + 0.014);
  add(body, 0.03, 0.06, 0.012, Array(6).fill('obsidian'), 0, CH - 0.14, CW / 2 + 0.032);
  for (const sx of [-1, 1]) { add(body, 0.02, 0.05, 0.2, Array(6).fill(I), sx * (CW / 2 + 0.02), CH * 0.62, 0); add(body, 0.03, 0.12, 0.03, Array(6).fill(I), sx * (CW / 2 + 0.02), CH * 0.55, -0.09); add(body, 0.03, 0.12, 0.03, Array(6).fill(I), sx * (CW / 2 + 0.02), CH * 0.55, 0.09); }
  // tapa hueca con bisagra atrás
  const lid = new THREE.Group();
  lid.position.set(0, CH, -CW / 2);
  body.add(lid);
  const lg = new THREE.Group(); lg.position.z = CW / 2; lid.add(lg);
  add(lg, CW, WALL, CW, [W, W, T, F, W, W], 0, LH - WALL / 2, 0);
  add(lg, CW, LH - WALL, WALL, [W, W, W, F, W, F], 0, (LH - WALL) / 2, CW / 2 - WALL / 2);
  add(lg, CW, LH - WALL, WALL, [W, W, W, F, F, W], 0, (LH - WALL) / 2, -CW / 2 + WALL / 2);
  add(lg, WALL, LH - WALL, CW - 2 * WALL, [F, W, W, F, W, W], -CW / 2 + WALL / 2, (LH - WALL) / 2, 0);
  add(lg, WALL, LH - WALL, CW - 2 * WALL, [W, F, W, F, W, W], CW / 2 - WALL / 2, (LH - WALL) / 2, 0);
  for (const bx of [-0.24, 0.24]) add(lg, 0.06, 0.012, CW + 0.01, Array(6).fill(I), bx, LH + 0.004, 0);
  for (const bx of [-0.24, 0.24]) { add(lg, 0.06, LH, 0.012, Array(6).fill(I), bx, LH / 2, CW / 2 + 0.004); add(lg, 0.06, LH, 0.012, Array(6).fill(I), bx, LH / 2, -CW / 2 - 0.004); }
  for (const sx of [-1, 1]) add(lid, 0.12, 0.06, 0.05, Array(6).fill(I), sx * 0.24, 0, -0.02);
  // pestillo de bronce: cuelga de la tapa y se levanta antes de abrir
  v.latch = new THREE.Group(); v.latch.position.set(0, LH - 0.04, CW / 2 + 0.03); lg.add(v.latch);
  const lt = tileBox(0.12, 0.17, 0.025, Array(6).fill(O)); lt.position.set(0, -0.085, 0); v.latch.add(lt);
  v.lid = lid;
  // lo de adentro y el brillo que sale al abrir
  v.contents = new THREE.Group(); v.contents.position.y = WALL; body.add(v.contents);
  v.inGlow = new THREE.Mesh(new THREE.PlaneGeometry(CW - 2 * WALL, CW - 2 * WALL), new THREE.MeshBasicMaterial({ color: 0xffd890, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
  v.inGlow.rotation.x = -Math.PI / 2; v.inGlow.position.y = CH - 0.04; v.inGlow.userData.glow = true;
  body.add(v.inGlow);
}

const TREASURE = new Set([259, 260, 273, 274, 278, 285, 360, 369, 388, 378]);
// muestra lo que guarda el cofre: hasta 9 cosas acomodadas en el fondo; si hay mucho, se ve un montoncito encima
function refreshChest(v) {
  while (v.contents.children.length) { const c = v.contents.children.pop(); disposeModel(c); }
  const slots = (v.be.slots || []).filter(Boolean);
  v.treasure = slots.some((s) => TREASURE.has(s.id));
  slots.slice(0, 9).forEach((s, i) => {
    const gx = (i % 3) - 1, gz = Math.floor(i / 3) - 1;
    const layers = s.count >= 32 ? 3 : s.count >= 8 ? 2 : 1;
    for (let L = 0; L < layers; L++) {
      const m = makeItemMesh(s.id, 0.15);
      const block = m.userData.kind === 'block';
      const jx = ((i * 13 + L * 7) % 5 - 2) * 0.012, jz = ((i * 7 + L * 11) % 5 - 2) * 0.012;
      m.position.set(gx * 0.23 + jx, block ? 0.075 + L * 0.15 : 0.006 + L * 0.012, gz * 0.23 + jz);
      if (!block) m.rotation.x = -Math.PI / 2;
      m.rotation.z = ((i * 37 + L * 19) % 9 - 4) * 0.12;
      if (block) m.rotation.y = ((i * 31 + L * 5) % 7 - 3) * 0.1;
      v.contents.add(m);
    }
  });
}

// resorte amortiguado: da el rebote natural de tapas y puertas
function spring(state, target, dt, k = 120, damp = 14) {
  const a = (target - state.x) * k - state.v * damp;
  state.v += a * dt;
  state.x += state.v * dt;
}

export class Stations {
  constructor(game) {
    this.game = game;
    this.visuals = new Map(); // "x,y,z" -> visual
    this.syncT = 0;
    this.open = null; // { type, x, y, z } estación abierta por el jugador
    this.flameT = 0;
  }

  key(x, y, z) { return `${x},${y},${z}`; }

  clear() {
    for (const v of this.visuals.values()) this.disposeVisual(v);
    this.visuals.clear();
  }

  // ---------- colocar / romper ----------
  // Se llama después de colocar un bloque especial.
  placed(id, x, y, z, facing, propio = false) {
    const w = this.game.world;
    const b = BLOCKS[id];
    if (b.key === 'furnace') w.setBE(x, y, z, { type: 'furnace', facing, slots: [null, null, null], burn: 0, burnMax: 0, cook: 0 });
    else if (b.key === 'chest') w.setBE(x, y, z, { type: 'chest', facing, slots: new Array(27).fill(null), ...(propio ? { propio: true } : {}) }); // los de misión y botín no son «de la casa»
    else if (b.key === 'chanchito') w.setBE(x, y, z, { type: 'chanchito', facing }); // sin casillas propias: abre meta.chanchito
    else if (b.key === 'baul') w.setBE(x, y, z, { type: 'baul', facing, slots: new Array(54).fill(null), ...(propio ? { propio: true } : {}) });
    else if (b.key === 'refri') w.setBE(x, y, z, { type: 'refri', facing, slots: new Array(27).fill(null) });
    else if (b.key === 'trampa' || b.key === 'nasa') {
      w.setBE(x, y, z, { type: b.key, facing, slots: new Array(27).fill(null) });
      if (registrarMonte(this.game, b.key, x, y, z) === false) { // v12.8.3: la séptima nasa no se queda puesta (y se devuelve)
        w.setBE(x, y, z, null); w.setBlock(x, y, z, 0);
        if (this.game.mode === 'survival') this.game.giveItem(id, 1);
      }
    }
    else if (b.key === 'barril') { w.setBE(x, y, z, { type: 'barril', agua: 0 }); registrarMonte(this.game, 'barril', x, y, z); }
    else if (b.key === 'table') w.setBE(x, y, z, { type: 'table', grid: new Array(9).fill(null) });
    else if (b.key === 'bed') w.setBE(x, y, z, { type: 'bed', facing });
    else if (b.station === 'taller') w.setBE(x, y, z, { type: 'taller', taller: b.taller, facing, grid: new Array(9).fill(null), lena: 0 }); // v12.15.1 (C6)
    else if (b.key === 'alacena') w.setBE(x, y, z, { type: 'alacena', facing, slots: new Array(27).fill(null) });
    else if (b.key === 'armario') w.setBE(x, y, z, { type: 'armario', facing, slots: new Array(18).fill(null) });
    else if (b.key === 'tinaja') w.setBE(x, y, z, { type: 'tinaja', facing, slots: new Array(9).fill(null) });
    else if (b.key === 'mostrador') w.setBE(x, y, z, { type: 'mostrador', facing, slots: new Array(9).fill(null), caja: 0, t: 0 });
    else if (b.key === 'cencerro') registrarCencerro(this.game, x, y, z);
    else if (b.key === 'farol_zenaida') registrarFarol(this.game, x, y, z);
    else if (b.key === 'plato_servido' || b.key === 'plato_vacio') registrarPlato(this.game, x, y, z);
    else if (b.key === 'olla_caliente') registrarOlla(this.game, x, y, z);
    else if (b.key === 'corazon_tiquicia') registrarCorazon(this.game, x, y, z);
    else if (b.key === 'carpa') { w.setBE(x, y, z, { type: 'carpa', facing }); carpaPuesta(this.game, x, y, z); }
    else if (b.key === 'stove') w.setBE(x, y, z, { type: 'stove', facing, grid: new Array(9).fill(null) });
    else if (b.key === 'trapiche') w.setBE(x, y, z, { type: 'trapiche', cane: 0, made: 0, t: 0 });
  }

  // Al romper: suelta lo que tenía adentro y limpia.
  broken(id, x, y, z) {
    const w = this.game.world;
    const be = w.getBE(x, y, z);
    if (be) {
      const items = be.slots || be.grid || [];
      for (const s of items) if (s) this.game.entities.dropItem(s.id, s.count, x + 0.5, y + 0.5, z + 0.5, null, 0.4, s.dur, extras(s));
      w.setBE(x, y, z, null);
    }
    const b = BLOCKS[id];
    if (b.door) {
      // la otra mitad de la puerta se va con esta
      const oy = b.upper ? y - 1 : y + 1;
      const other = w.getBlock(x, oy, z);
      if (BLOCKS[other].door) w.setBlock(x, oy, z, AIR, { updates: false });
      const by = b.upper ? y - 1 : y;
      w.setBE(x, by, z, null);
    }
    if (this.open && this.open.x === x && this.open.y === y && this.open.z === z) this.game.ui.closeInventory();
  }

  // Coloca una puerta de 2 bloques. Devuelve true si se pudo.
  placeDoor(x, y, z, facing) {
    const w = this.game.world;
    if (w.getBlock(x, y + 1, z) !== AIR) return false;
    if (!SOLID[w.getBlock(x, y - 1, z)]) return false;
    // bisagra al lado que tenga pared (o a la izquierda por defecto)
    const [fx, fz] = FACING_VEC[facing];
    const lx = -fz, lz = fx; // izquierda mirando de frente
    const hinge = SOLID[w.getBlock(x + lx, y, z + lz)] ? 0 : SOLID[w.getBlock(x - lx, y, z - lz)] ? 1 : 0;
    w.setBlock(x, y, z, K.door_lower, { updates: false });
    w.setBlock(x, y + 1, z, K.door_upper, { updates: false });
    w.setBE(x, y, z, { type: 'door', facing, hinge, open: false });
    return true;
  }

  toggleDoor(x, y, z) {
    const w = this.game.world;
    const b = BLOCKS[w.getBlock(x, y, z)];
    const by = b.upper ? y - 1 : y;
    const be = w.getBE(x, by, z);
    if (!be) return;
    // no cerrar sobre una criatura o el jugador
    const opening = !be.open;
    if (!opening) {
      const blocks = [this.game.player.body, ...this.game.entities.mobs.map((m) => m.body)];
      if (blocks.some((bd) => bd.intersectsBlock(x, by, z) || bd.intersectsBlock(x, by + 1, z))) return;
    }
    be.open = opening;
    w.setBlock(x, by, z, opening ? K.door_lower_open : K.door_lower, { updates: false });
    w.setBlock(x, by + 1, z, opening ? K.door_upper_open : K.door_upper, { updates: false });
    w.touchBE(x, by, z);
    this.game.audio.play(opening ? 'door.open' : 'door.close', { pos: { x: x + 0.5, y: by + 1, z: z + 0.5 }, vol: 0.6 });
  }

  // ---------- visuales ----------
  disposeVisual(v) {
    this.game.scene.remove(v.group);
    disposeModel(v.group);
  }

  buildVisual(type, x, y, z, be) {
    const group = new THREE.Group();
    group.position.set(x + 0.5, y, z + 0.5);
    const v = { type, x, y, z, group, be, anim: { x: 0, v: 0 }, version: -1, t: Math.random() * 10 };
    if (type === 'chest') {
      group.rotation.y = [0, Math.PI / 2, Math.PI, -Math.PI / 2][be.facing || 0];
      buildChest(v, group);
    } else if (type === 'door') {
      const facing = be.facing || 0;
      group.rotation.y = [0, Math.PI / 2, Math.PI, -Math.PI / 2][facing];
      const hingeX = be.hinge ? 0.5 : -0.5;
      const pivot = new THREE.Group();
      pivot.position.set(hingeX, 0, 0.5 - 0.09);
      const panel = tileBox(1, 2, 0.18, ['door', 'door', 'door', 'door', 'door', 'door']);
      panel.position.set(-hingeX, 1, 0);
      pivot.add(panel);
      group.add(pivot);
      v.pivot = pivot;
      v.hingeSign = be.hinge ? -1 : 1;
      v.anim.x = be.open ? 1 : 0;
    } else if (type === 'bed') {
      group.rotation.y = [0, Math.PI / 2, Math.PI, -Math.PI / 2][be.facing || 0];
      // cama de madera: patas, marco, respaldar, colchón con sábana, cobija acolchada que cae a los lados y almohada
      const add = (w, h, d, faces, x, y, z) => { const m = tileBox(w, h, d, typeof faces === 'string' ? Array(6).fill(faces) : faces); m.position.set(x, y, z); group.add(m); return m; };
      for (const [lx, lz] of [[-0.44, -0.44], [0.44, -0.44], [0.44, 0.44], [-0.44, 0.44]]) add(0.1, 0.2, 0.1, 'log_side', lx, 0.1, lz);
      add(1, 0.1, 1, 'planks', 0, 0.24, 0);
      add(1, 0.62, 0.08, 'planks', 0, 0.5, -0.46);
      add(1.04, 0.07, 0.12, 'log_side', 0, 0.83, -0.46);
      add(0.96, 0.16, 0.9, ['cama_sabana', 'cama_sabana', 'cama_sabana', 'planks', 'cama_sabana', 'cama_sabana'], 0, 0.37, 0.03);
      add(1.0, 0.05, 0.64, ['cama_manta', 'cama_manta', 'cama_manta', 'cama_manta', 'cama_manta', 'cama_manta'], 0, 0.475, 0.17);
      for (const sx of [-1, 1]) add(0.03, 0.2, 0.64, 'cama_manta', sx * 0.5, 0.37, 0.17);
      add(1.0, 0.2, 0.03, 'cama_manta', 0, 0.37, 0.495);
      add(0.68, 0.11, 0.26, ['cama_almohada', 'cama_almohada', 'cama_almohada', 'cama_almohada', 'cama_almohada', 'cama_almohada'], 0, 0.5, -0.29);
    } else if (type === 'chanchito') {
      // el chanchito de barro (como la hoja de referencia): un cuerpo con la cara al frente, el hocico salido, orejas paradas en
      // las esquinas, cuatro patitas y la colita enrollada atrás
      group.rotation.y = [0, Math.PI / 2, Math.PI, -Math.PI / 2][be.facing || 0];
      const L = 'chanchito_lado', H = 'chanchito_hocico', add = (w, h, d, faces, x, y, z) => { const m = tileBox(w, h, d, typeof faces === 'string' ? Array(6).fill(faces) : faces); m.position.set(x, y, z); group.add(m); return m; };
      add(0.6, 0.46, 0.78, [L, L, 'chanchito_lomo', L, 'chanchito_cara', L], 0, 0.38, -0.02);
      add(0.24, 0.16, 0.08, H, 0, 0.33, 0.41);
      for (const sx of [-1, 1]) add(0.12, 0.13, 0.08, H, sx * 0.21, 0.66, 0.29);
      for (const [lx, lz] of [[-0.19, -0.26], [0.19, -0.26], [-0.19, 0.22], [0.19, 0.22]]) add(0.13, 0.15, 0.13, L, lx, 0.075, lz);
      add(0.05, 0.12, 0.05, H, 0, 0.6, -0.43); add(0.05, 0.05, 0.1, H, 0, 0.68, -0.47); add(0.05, 0.08, 0.05, H, 0, 0.62, -0.51); // la colita
    } else if (type === 'carpa') {
      // la carpa: dos lonas inclinadas sobre una vara, con el piso de petate
      group.rotation.y = [0, Math.PI / 2, Math.PI, -Math.PI / 2][be.facing || 0];
      for (const s of [-1, 1]) {
        const lona = tileBox(0.72, 0.03, 1.02, Array(6).fill('cama_manta'));
        lona.position.set(s * 0.25, 0.42, 0); lona.rotation.z = s * -0.86; group.add(lona);
      }
      const vara = tileBox(0.04, 0.04, 1.08, Array(6).fill('log_side')); vara.position.y = 0.72; group.add(vara);
      for (const z of [-0.5, 0.5]) { const p = tileBox(0.04, 0.72, 0.04, Array(6).fill('log_side')); p.position.set(0, 0.36, z); group.add(p); }
      const piso = tileBox(0.9, 0.03, 1, Array(6).fill('cama_sabana')); piso.position.y = 0.02; group.add(piso);
    } else if (type === 'trapiche') {
      // trapiche de madera: dos rodillos verticales y una palanca (el yugo) que da vueltas
      const base = tileBox(1, 0.3, 1, ['trapiche', 'trapiche', 'trapiche_top', 'planks', 'trapiche', 'trapiche']);
      base.position.y = 0.15;
      v.rollers = [];
      for (const rx of [-0.17, 0.17]) {
        const r = tileBox(0.3, 0.75, 0.3, ['log_side', 'log_side', 'log_top', 'log_top', 'log_side', 'log_side']);
        r.position.set(rx, 0.68, 0); group.add(r); v.rollers.push(r);
      }
      const top = tileBox(1, 0.12, 0.5, ['planks', 'planks', 'planks', 'planks', 'planks', 'planks']); top.position.y = 1.1;
      v.yoke = new THREE.Group(); v.yoke.position.set(-0.17, 1.2, 0);
      const arm = tileBox(2.2, 0.1, 0.1, ['log_side', 'log_side', 'log_side', 'log_side', 'log_side', 'log_side']); arm.position.x = 0.9;
      v.yoke.add(arm);
      group.add(base, top, v.yoke);
    } else if (type === 'table' || type === 'stove') {
      v.items = new THREE.Group();
      v.items.position.y = 1.0;
      group.add(v.items);
      // aro de luz debajo del resultado listo
      v.ready = glowRing(0.2, 0xffd860);
      v.ready.position.y = 1.02; v.ready.rotation.x = -Math.PI / 2;
      group.add(v.ready);
      if (type === 'table') {
        // martillo de verdad sobre la mesa: golpea cuando se fabrica algo
        v.hammer = new THREE.Group();
        v.hammer.position.set(0.36, 1.0, -0.4);
        v.hammer.rotation.y = -0.5;
        const handle = tileBox(0.045, 0.045, 0.34, Array(6).fill('log_side')); handle.position.set(0, 0.025, 0.12);
        const head = tileBox(0.14, 0.07, 0.07, Array(6).fill('hierro_cofre')); head.position.set(0, 0.04, 0.28);
        v.hammer.add(handle, head);
        group.add(v.hammer);
      }
    } else if (type === 'furnace') {
      const [fx, fz] = FACING_VEC[be.facing || 0];
      const glow = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.5), new THREE.MeshBasicMaterial({ color: 0xff8a2a, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
      glow.position.set(fx * 0.52, 0.32, fz * 0.52);
      glow.rotation.y = Math.atan2(fx, fz);
      glow.userData.glow = true;
      group.add(glow);
      v.glow = glow;
      // charco de luz en el piso frente a la boca
      const pool = glowRing(0.55, 0xff8a2a, true);
      pool.position.set(fx * 0.9, 0.02, fz * 0.9); pool.rotation.x = -Math.PI / 2;
      group.add(pool); v.pool = pool;
      // puerta de hierro con bisagra (se abre cuando abrís el horno) y chimenea
      v.doorPivot = new THREE.Group();
      v.doorPivot.position.set(fx * 0.515 + fz * 0.32, 0.36, fz * 0.515 - fx * 0.32);
      v.doorPivot.rotation.y = Math.atan2(fx, fz);
      const door = tileBox(0.62, 0.48, 0.04, Array(6).fill('puerta_horno'));
      door.position.set(-0.31, 0, 0.02);
      v.doorPivot.add(door);
      group.add(v.doorPivot);
      v.doorAnim = { x: 0, v: 0 };
      const chimney = tileBox(0.26, 0.38, 0.26, ['cobble', 'cobble', 'furnace_top', 'cobble', 'cobble', 'cobble']);
      chimney.position.set(-fx * 0.22, 1.19, -fz * 0.22);
      group.add(chimney);
      v.chimney = { x: -fx * 0.22, z: -fz * 0.22 };
      v.inside = new THREE.Group();
      v.inside.position.set(fx * 0.38, 0.2, fz * 0.38);
      v.inside.rotation.y = Math.atan2(fx, fz);
      group.add(v.inside);
    }
    this.game.scene.add(group);
    return v;
  }

  // Pone los ítems de la mesa sobre la mesa (y el resultado flotando encima).
  refreshTable(v) {
    const be = v.be;
    while (v.items.children.length) { const c = v.items.children.pop(); disposeModel(c); }
    be.grid.forEach((s, i) => {
      if (!s) return;
      const m = makeItemMesh(s.id, 0.2);
      const gx = (i % 3) - 1, gz = Math.floor(i / 3) - 1;
      m.position.set(gx * 0.27, m.userData.kind === 'block' ? 0.1 : 0.012, gz * 0.27);
      if (m.userData.kind !== 'block') m.rotation.x = -Math.PI / 2;
      m.rotation.z = ((i * 37) % 7 - 3) * 0.06;
      m.userData.pop = 0;
      v.items.add(m);
    });
    const rec = findRecipe(be.grid, 3, be.type === 'stove' ? 'cook' : 'craft', new Set(this.game.meta.recetas || []));
    v.result = null;
    if (rec) {
      const r = makeItemMesh(rec.out[0], 0.28);
      r.position.set(0, 0.55, 0);
      r.userData.result = true;
      v.items.add(r);
      v.result = r;
    }
  }

  refreshFurnace(v) {
    while (v.inside.children.length) { const c = v.inside.children.pop(); disposeModel(c); }
    const s = v.be.slots[0];
    if (s) {
      const m = makeItemMesh(s.id, 0.18);
      m.position.set(0, m.userData.kind === 'block' ? 0.09 : 0.1, 0);
      v.inside.add(m);
    }
  }

  sync() {
    const g = this.game, w = g.world;
    const p = g.player.body.pos;
    const R = 40;
    const want = new Set();
    for (const [ck, m] of w.blockEntities) {
      const [cx, cz] = ck.split(',').map(Number);
      if (Math.abs(cx * CHUNK + 8 - p.x) > R + 8 || Math.abs(cz * CHUNK + 8 - p.z) > R + 8) continue;
      if (!w.getChunk(cx, cz)) continue;
      for (const [i, be] of m) {
        if (!['chest', 'door', 'table', 'furnace', 'bed', 'carpa', 'stove', 'trapiche', 'chanchito'].includes(be.type)) continue;
        const lx = i % CHUNK, lz = Math.floor(i / CHUNK) % CHUNK, y = Math.floor(i / (CHUNK * CHUNK));
        const x = cx * CHUNK + lx, z = cz * CHUNK + lz;
        const k = this.key(x, y, z);
        want.add(k);
        let v = this.visuals.get(k);
        if (v && (v.be !== be || v.facing !== be.facing)) { this.disposeVisual(v); this.visuals.delete(k); v = null; }
        if (!v) { v = this.buildVisual(be.type, x, y, z, be); v.facing = be.facing; this.visuals.set(k, v); }
      }
    }
    for (const [k, v] of this.visuals) if (!want.has(k)) { this.disposeVisual(v); this.visuals.delete(k); }
  }

  // Cuando cambia el contenido de una entidad, se refresca su visual.
  changed(x, y, z) {
    const v = this.visuals.get(this.key(x, y, z));
    if (v) v.version = -1;
    this.syncT = 0;
  }

  // ---------- lógica por cuadro ----------
  update(dt) {
    const g = this.game, w = g.world;
    this.syncT -= dt;
    if (this.syncT <= 0) { this.syncT = 0.5; this.sync(); }

    // hornos: funden aunque no estés mirando (mientras su chunk esté cargado)
    for (const [ck, m] of w.blockEntities) {
      const [cx, cz] = ck.split(',').map(Number);
      if (!w.getChunk(cx, cz)) continue;
      for (const [i, be] of m) if (be.type === 'trapiche' && be.cane >= 3) {
        const tx = cx * CHUNK + (i % CHUNK), tz = cz * CHUNK + (Math.floor(i / CHUNK) % CHUNK);
        be.t += dt * (yugoCerca(g, tx, tz) ? 2 : 1); // v12.4.7: el yugo con bueyes muele el doble
        if (be.t >= 6) { be.t = 0; be.cane -= 3; be.made++; w.touchBE(cx * CHUNK + (i % CHUNK), Math.floor(i / (CHUNK * CHUNK)), cz * CHUNK + (Math.floor(i / CHUNK) % CHUNK)); }
      }
      for (const [i, be] of m) if (be.type === 'furnace') this.tickFurnace(be, cx * CHUNK + (i % CHUNK), Math.floor(i / (CHUNK * CHUNK)), cz * CHUNK + (Math.floor(i / CHUNK) % CHUNK), dt);
    }

    for (const [k, v] of this.visuals) {
      v.t += dt;
      const lv = g.entities.lightAt(v.x + 0.5, v.y + 0.5, v.z + 0.5);
      if (v.type === 'chest') {
        const isOpen = this.open && this.open.type === 'chest' && this.key(this.open.x, this.open.y, this.open.z) === k;
        const pos = { x: v.x + 0.5, y: v.y + 0.5, z: v.z + 0.5 };
        if (isOpen !== v.wasOpen) {
          g.audio.chest(isOpen, pos);
          if (isOpen) { const be0 = g.world.getBE(v.x, v.y, v.z); if (be0 && be0.viejo && !be0.abierto) { be0.abierto = true; g.world.touchBE(v.x, v.y, v.z); quizaAlacranDeCofre(g, v.x, v.y, v.z); } }
          if (isOpen) { v.hop = 1; v.latchT = 0; g.particles.burst(v.x + 0.5, v.y + 0.85, v.z + 0.5, [[0.55, 0.45, 0.32], [0.7, 0.62, 0.5]], 8, 0.8); }
          v.closing = !isOpen;
          v.wasOpen = isOpen;
        }
        if (v.version !== 1) { refreshChest(v); v.version = 1; }
        // primero se levanta el pestillo, después la tapa (con rebote de resorte)
        v.latchT = Math.min(1, (v.latchT ?? 1) + dt * 6);
        const lidTarget = isOpen ? (v.latchT > 0.6 ? 1 : 0) : 0;
        spring(v.anim, lidTarget, dt, isOpen ? 90 : 170, isOpen ? 10 : 8);
        v.lid.rotation.x = -Math.max(-0.04, v.anim.x) * 1.5;
        v.latch.rotation.x = isOpen ? -Math.min(1, v.latchT * 1.6) * 1.3 : -Math.max(0, v.anim.x) * 1.3;
        // el cofre da un saltito al abrir y se asienta al cerrar
        v.hop = Math.max(0, (v.hop || 0) - dt * 3.5);
        const sq = Math.sin(v.hop * Math.PI) * 0.05;
        v.body.scale.set(1 + sq * 0.5, 1 - sq, 1 + sq * 0.5);
        if (v.closing && v.anim.x < 0.03 && v.anim.v < -0.5) {
          v.closing = false; v.hop = 0.5;
          g.particles.burst(v.x + 0.5, v.y + 0.62, v.z + 0.5, [[0.6, 0.5, 0.38], [0.45, 0.38, 0.3]], 10, 1.1);
        }
        const open = Math.max(0, v.anim.x);
        v.contents.visible = open > 0.03;
        v.inGlow.material.opacity = Math.min(1, open) * (v.treasure ? 0.55 : 0.22);
        if (v.treasure && open > 0.5 && Math.random() < dt * 14) g.particles.spawn(v.x + 0.5 + (Math.random() - 0.5) * 0.5, v.y + 0.55, v.z + 0.5 + (Math.random() - 0.5) * 0.5, [1, 0.85 + Math.random() * 0.15, 0.35], (Math.random() - 0.5) * 0.3, 0.9 + Math.random() * 0.6, (Math.random() - 0.5) * 0.3, 0.8, -0.6, true);
        tintModel(v.group, lv);
        tintModel(v.contents, Math.max(lv, open * 0.9));
      } else if (v.type === 'bed' || v.type === 'carpa') {
        tintModel(v.group, lv);
      } else if (v.type === 'door') {
        spring(v.anim, v.be.open ? 1 : 0, dt, 110, 13);
        v.pivot.rotation.y = v.anim.x * (Math.PI / 2) * v.hingeSign;
        tintModel(v.group, lv);
      } else if (v.type === 'trapiche') {
        const busy = v.be.cane >= 3;
        v.spin = (v.spin || 0) + dt * (busy ? 1.6 : 0);
        v.rollers[0].rotation.y = v.spin * 2; v.rollers[1].rotation.y = -v.spin * 2;
        v.yoke.rotation.y = v.spin * 0.5;
        if (busy && Math.random() < dt * 6) g.particles.spawn(v.x + 0.5, v.y + 0.35, v.z + 0.5, [0.75, 0.85, 0.35], (Math.random() - 0.5), 0.5, (Math.random() - 0.5), 0.5);
        if (busy && Math.random() < dt * 0.6) g.audio.play('creak', { pos: { x: v.x + 0.5, y: v.y + 1, z: v.z + 0.5 }, vol: 0.4, pitch: 0.7 });
        tintModel(v.group, lv);
      } else if (v.type === 'table' || v.type === 'stove') {
        if (v.version !== 1) { this.refreshTable(v); v.version = 1; }
        if (v.type === 'stove') v.items.position.y = 1.0;
        // aro que late debajo del resultado listo y el martillo que golpea al fabricar
        const ready = !!v.result;
        v.readyA = (v.readyA || 0) + ((ready ? 1 : 0) - (v.readyA || 0)) * Math.min(1, dt * 6);
        v.ready.material.opacity = v.readyA * (0.45 + Math.sin(v.t * 4) * 0.15);
        v.ready.scale.setScalar(1 + Math.sin(v.t * 4) * 0.08);
        if (v.hammer) {
          v.hitT = Math.max(0, (v.hitT || 0) - dt);
          const h = v.hitT > 0 ? Math.abs(Math.sin((0.6 - v.hitT) * Math.PI * 3.3)) : 0;
          v.hammer.rotation.x = -h * 0.9;
          v.hammer.position.y = 1.0 + h * 0.08;
        }
        v.items.children.forEach((c) => {
          if (c.userData.result) {
            c.position.y = 0.55 + Math.sin(v.t * 2.4) * 0.05;
            c.rotation.y += dt * 1.4;
          } else if (c.userData.pop < 1) {
            c.userData.pop = Math.min(1, c.userData.pop + dt * 6);
            const s = c.userData.pop; const e = 1 + 2.7 * Math.pow(s - 1, 3) + 1.7 * Math.pow(s - 1, 2); // easeOutBack
            c.scale.setScalar(Math.max(0.01, e));
          }
        });
        tintModel(v.group, lv);
      } else if (v.type === 'furnace') {
        if (v.version !== 1) { this.refreshFurnace(v); v.version = 1; }
        const lit = v.be.burn > 0;
        const flick = 0.55 + Math.sin(v.t * 13) * 0.12 + Math.sin(v.t * 7.3) * 0.1 + Math.random() * 0.08;
        v.glow.material.opacity = lit ? flick * 0.55 : 0;
        v.pool.material.opacity = lit ? flick * 0.32 : 0;
        // la puerta de hierro se abre cuando el jugador abre el horno
        const fOpen = this.open && this.open.type === 'furnace' && this.key(this.open.x, this.open.y, this.open.z) === k;
        if (fOpen !== v.wasOpen) { g.audio.play(fOpen ? 'creak' : 'door.close', { pos: { x: v.x + 0.5, y: v.y + 0.5, z: v.z + 0.5 }, vol: 0.4, pitch: fOpen ? 1.3 : 1.2 }); v.wasOpen = fOpen; }
        spring(v.doorAnim, fOpen ? 1 : 0, dt, 80, 9);
        v.doorPivot.rotation.y = Math.atan2(...FACING_VEC[v.be.facing || 0]) - Math.max(-0.05, v.doorAnim.x) * 1.9;
        // chispas que saltan de la boca
        if (lit && Math.random() < dt * (fOpen ? 10 : 3)) {
          const [fx, fz] = FACING_VEC[v.be.facing || 0];
          g.particles.spawn(v.x + 0.5 + fx * 0.55 + (Math.random() - 0.5) * 0.3, v.y + 0.3, v.z + 0.5 + fz * 0.55 + (Math.random() - 0.5) * 0.3, [1, 0.6 + Math.random() * 0.3, 0.15], fx * (0.6 + Math.random()), 1.5 + Math.random() * 1.5, fz * (0.6 + Math.random()), 0.7, 9, true);
        }
        // cuando sale algo fundido, un soplo de brasas
        const outN = v.be.slots[2] ? v.be.slots[2].count : 0;
        if (v.lastOut !== undefined && outN > v.lastOut) {
          const [fx, fz] = FACING_VEC[v.be.facing || 0];
          g.particles.burst(v.x + 0.5 + fx * 0.6, v.y + 0.4, v.z + 0.5 + fz * 0.6, [[1, 0.7, 0.2], [1, 0.45, 0.1], [0.5, 0.5, 0.5]], 14, 1.6);
          g.audio.play('step.stone', { pos: { x: v.x + 0.5, y: v.y + 0.5, z: v.z + 0.5 }, vol: 0.5, pitch: 1.2 });
        }
        v.lastOut = outN;
        tintModel(v.doorPivot, lv);
        if (v.inside.children[0]) v.inside.children[0].rotation.y += dt * (v.be.cook > 0 ? 0.8 : 0);
        tintModel(v.inside, lit ? 1 : lv);
      }
    }

    // llamas y humo: antorchas y hornos encendidos cerca del jugador
    this.flameT -= dt;
    if (this.flameT <= 0) {
      this.flameT = 0.08;
      this.emitFlames();
    }
  }

  tickFurnace(be, x, y, z, dt) {
    const g = this.game, w = g.world;
    const [inp, fuel, out] = be.slots;
    const result = inp ? SMELT[inp.id] : undefined;
    const canSmelt = result !== undefined && (!out || (out.id === result && out.count < maxStack(result)));
    if (be.burn <= 0 && canSmelt && fuel && FUEL[fuel.id]) {
      be.burn = be.burnMax = FUEL[fuel.id];
      const wasLavaBucket = fuel.id === 291;
      fuel.count--;
      if (fuel.count <= 0) be.slots[1] = wasLavaBucket ? { id: 289, count: 1 } : null;
      g.audio.play('ignite', { pos: { x: x + 0.5, y: y + 0.5, z: z + 0.5 }, vol: 0.45 });
      w.touchBE(x, y, z);
    }
    const wasLit = w.getBlock(x, y, z) === K.furnace_lit;
    if (be.burn > 0) {
      be.burn = Math.max(0, be.burn - dt);
      if (canSmelt) {
        be.cook += dt;
        if (be.cook >= COOK_TIME) {
          be.cook = 0;
          inp.count--;
          if (inp.count <= 0) be.slots[0] = null;
          if (be.slots[2]) be.slots[2].count++;
          else be.slots[2] = { id: result, count: 1 };
          w.touchBE(x, y, z);
          this.changed(x, y, z);
        }
      } else be.cook = 0;
    } else be.cook = Math.max(0, be.cook - dt * 2);
    const lit = be.burn > 0;
    if (lit !== wasLit && (w.getBlock(x, y, z) === K.furnace || w.getBlock(x, y, z) === K.furnace_lit)) {
      w.setBlock(x, y, z, lit ? K.furnace_lit : K.furnace, { updates: false });
    }
    // sonido de fuego en bucle mientras arde
    g.audio.setEmitter(`furnace:${x},${y},${z}`, 'loop.fire', lit ? { x: x + 0.5, y: y + 0.5, z: z + 0.5 } : null, 0.6);
  }

  emitFlames() {
    const g = this.game, w = g.world, P = g.particles;
    const p = g.player.body.pos;
    const R = 12;
    // antorchas: se buscan en un cubo alrededor del jugador, de a pedazos para no gastar
    this.scanY = ((this.scanY || 0) + 1) % 6;
    if (!this.torches || this.scanY === 0) {
      this.torches = [];
      const px = Math.floor(p.x), py = Math.floor(p.y), pz = Math.floor(p.z);
      for (let y = py - 6; y <= py + 6; y++) for (let z = pz - R; z <= pz + R; z++) for (let x = px - R; x <= px + R; x++) {
        if (w.getBlock(x, y, z) === K.torch) this.torches.push([x, y, z]);
      }
    }
    for (const [x, y, z] of this.torches) {
      if (Math.random() < 0.6) P.spawn(x + 0.5 + (Math.random() - 0.5) * 0.06, y + 0.72, z + 0.5 + (Math.random() - 0.5) * 0.06, [1, 0.75 + Math.random() * 0.2, 0.3], 0, 0.5 + Math.random() * 0.3, 0, 0.25, -1, true);
      if (Math.random() < 0.15) P.spawn(x + 0.5, y + 0.8, z + 0.5, [0.35, 0.35, 0.35], (Math.random() - 0.5) * 0.2, 0.9, (Math.random() - 0.5) * 0.2, 1.2, -0.6);
    }
    for (const v of this.visuals.values()) {
      if (v.type !== 'furnace' || v.be.burn <= 0) continue;
      const [fx, fz] = FACING_VEC[v.be.facing || 0];
      if (Math.random() < 0.5) P.spawn(v.x + 0.5 + fx * 0.55 + (Math.random() - 0.5) * 0.4, v.y + 0.25 + Math.random() * 0.2, v.z + 0.5 + fz * 0.55 + (Math.random() - 0.5) * 0.4, [1, 0.55 + Math.random() * 0.3, 0.15], fx * 0.3, 0.6, fz * 0.3, 0.35, -0.5, true);
      if (Math.random() < 0.45) P.spawn(v.x + 0.5 + v.chimney.x + (Math.random() - 0.5) * 0.1, v.y + 1.42, v.z + 0.5 + v.chimney.z + (Math.random() - 0.5) * 0.1, [0.42, 0.4, 0.4], (Math.random() - 0.5) * 0.2, 1.1, (Math.random() - 0.5) * 0.2, 1.8, -0.5);
    }
  }
}
