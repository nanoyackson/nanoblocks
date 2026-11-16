// v12.15.2 (C7 «Fuego de la tierra»): los tubos de lava de los volcanes (generador v21: solo mundos nuevos), las fumarolas, la cámara del magma con
// su Guardián, el balneario de aguas termales y lo que se hace con ellos (pase, huevo de poza, botas, casco). Diseño: docs/revisiones/DISENO_CONTENIDO_C5-C8.md §C7.
// Sin gráficos al importar el generador: lo que toca la partida (tickFuego, usarFuego, tickColada) solo usa lo que le pasa game.js.
import { BLOCK_BY_KEY as K } from './blocks.js';
import { hash3, mulberry32 } from './noise.js';
import { villageAt, CELL as VCELL } from './pueblogen.js';

export const VOLCANO_CELL = 640, GEN_TUBOS = 21;
const PASO = 0.7;
const MASCARILLA = 525, HUEVO = 287, PASE = 1169, HUEVO_TERMAL = 1165, BOTAS = 1168, CASCO = 1167;

// ---------- el trazado de un tubo (puro: sale de la semilla y del terreno, igual en todos los trozos) ----------
function lejosDeTodo(gen, x, z) {
  if (Math.hypot(x, z) < 200) return false; // el inicio
  const cx = Math.floor(x / VCELL), cz = Math.floor(z / VCELL);
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const v = villageAt(gen, cx + dx, cz + dz);
    if (v && Math.hypot(v.x - x, v.z - z) < 200) return false;
  }
  return true;
}

export function tuboDe(gen, gx, gz) {
  gen.tubos = gen.tubos || new Map();
  const key = `${gx},${gz}`;
  if (gen.tubos.has(key)) return gen.tubos.get(key);
  let T = null;
  const v = gen.version >= GEN_TUBOS && gen.v2 && gen.v2.volcanoIn(gx, gz);
  if (v) {
    const seed = gen.seed;
    const dc = Math.round(v.r * 0.5), a0 = hash3(seed, gx, 8801, gz) * Math.PI * 2, dir = hash3(seed, gx, 8802, gz) < 0.5 ? -1 : 1;
    const largo = hash3(seed, gx, 8803, gz) < 0.5;
    const L0 = largo ? 120 + Math.floor(hash3(seed, gx, 8804, gz) * 60) : 60 + Math.floor(hash3(seed, gx, 8805, gz) * 30);
    const L = Math.min(L0, Math.floor(4.4 * dc));
    const en = (s) => { const th = a0 + (dir * s) / dc; return [v.x + Math.cos(th) * dc, v.z + Math.sin(th) * dc]; };
    if ([0, L / 2, L].every((s) => { const [x, z] = en(s); return lejosDeTodo(gen, x, z); })) {
      const pts = [];
      let y = null;
      const n = Math.ceil(L / PASO);
      for (let i = 0; i <= n; i++) {
        const s = Math.min(L, i * PASO), [px, pz] = en(s);
        const h = gen.column(Math.round(px), Math.round(pz)).h;
        const target = Math.max(8, h - Math.min(8, 1 + s * 0.5));
        if (y === null) y = target; else if (i % 3 === 0) y += Math.max(-1, Math.min(1, target - y));
        pts.push(y);
      }
      T = { gx, gz, vx: v.x, vz: v.z, dc, a0, dir, L, largo, ys: pts, id: `colada:${gx},${gz}` };
      if (largo) {
        const th = a0 + (dir * L) / dc, tx = -Math.sin(th) * dir, tz = Math.cos(th) * dir, [ex, ez] = en(L);
        T.cam = { x: Math.round(ex + tx * 9), z: Math.round(ez + tz * 9), y: pts[pts.length - 1], tx, tz };
      }
    }
  }
  gen.tubos.set(key, T);
  return T;
}

// ¿esta columna es del tubo? devuelve { oo (−3…3 de lado), y (el piso), s (metros desde la boca) } o null
export function celdaTubo(T, wx, wz) {
  const dx = wx - T.vx, dz = wz - T.vz, r = Math.hypot(dx, dz), oo = Math.round(r - T.dc);
  if (oo < -3 || oo > 3) return null;
  let delta = (Math.atan2(dz, dx) - T.a0) * T.dir;
  delta = ((delta % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  const s = delta * T.dc;
  if (s > T.L) return null;
  return { oo, s, y: T.ys[Math.min(T.ys.length - 1, Math.round(s / PASO))] };
}

// ---------- el trozo: cavar el tubo y la cámara ----------
export function buildFuegoInChunk(gen, cx, cz, blocks, idx, colAt) {
  const out = [];
  if (gen.version < GEN_TUBOS || !gen.v2) return out;
  const x0 = cx * 16, z0 = cz * 16, xc = x0 + 8, zc = z0 + 8;
  const vcx = Math.floor(xc / VOLCANO_CELL), vcz = Math.floor(zc / VOLCANO_CELL);
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const T = tuboDe(gen, vcx + dx, vcz + dz);
    if (!T) continue;
    const enAnillo = Math.abs(Math.hypot(xc - T.vx, zc - T.vz) - T.dc) < 22;
    const enCamara = T.cam && Math.hypot(xc - T.cam.x, zc - T.cam.z) < 24;
    if (!enAnillo && !enCamara) continue;
    if (enAnillo) cavarTubo(gen, T, x0, z0, blocks, idx, colAt, out);
    if (enCamara) cavarCamara(gen, T, x0, z0, blocks, idx, out);
  }
  return out;
}

const mk = (gen, x0, z0, blocks, idx) => ({
  get(wx, y, wz) { const lx = wx - x0, lz = wz - z0; return lx < 0 || lx > 15 || lz < 0 || lz > 15 || y < 2 || y > 125 ? -1 : blocks[idx(lx, y, lz)]; },
  put(wx, y, wz, id) { const lx = wx - x0, lz = wz - z0; if (lx < 0 || lx > 15 || lz < 0 || lz > 15 || y < 2 || y > 125) return; blocks[idx(lx, y, lz)] = id; },
});

function cavarTubo(gen, T, x0, z0, blocks, idx, colAt, out) {
  const seed = gen.seed, { get, put } = mk(gen, x0, z0, blocks, idx);
  for (let lz = 0; lz < 16; lz++) for (let lx = 0; lx < 16; lx++) {
    const wx = x0 + lx, wz = z0 + lz, c = celdaTubo(T, wx, wz);
    if (!c) continue;
    const { oo, y, s } = c, boca = s < 14;
    if (Math.abs(oo) === 3) { // paredes: tapar lo que quede abierto y salpicar vetas, cristales y pómez
      if (boca) continue;
      for (let k = 0; k <= 3; k++) {
        const b = get(wx, y + k, wz);
        if (b === 0) put(wx, y + k, wz, K.basalt);
        else if (k === 1 || k === 2) {
          const r = hash3(seed, wx, y + k, wz + 77);
          if (r < 0.05) put(wx, y + k, wz, K.veta_obsidiana); else if (r < 0.075) put(wx, y + k, wz, K.cristal_azufre_bloque); else if (r < 0.115) put(wx, y + k, wz, K.pomez_bloque);
        }
      }
      continue;
    }
    // la boca es una zanja abierta hasta la superficie; después el techo se cierra
    const h = colAt ? colAt(lx, lz).h : y + 8;
    const tope = boca ? Math.max(y + 3, h + 1) : y + 3;
    for (let k = 0; k <= tope - y; k++) put(wx, y + k, wz, 0);
    // piso y canal de lava (a un lado, desde los 10 m de la boca)
    if (oo === 2 && s > 10) { put(wx, y - 2, wz, K.basalt); put(wx, y - 1, wz, K.lava); }
    else {
      const rf = hash3(seed, wx, y, wz + 31);
      put(wx, y - 1, wz, !boca && oo <= 0 && rf < 0.012 ? K.fumarola : K.basalt);
    }
    if (!boca) {
      const rt = hash3(seed, wx, y + 9, wz + 5);
      if (get(wx, y + 4, wz) === 0) put(wx, y + 4, wz, K.basalt);
      if (oo < 2 && rt < 0.06) { put(wx, y + 3, wz, K.obsidian); if (rt < 0.02) put(wx, y + 2, wz, K.obsidian); } // estalactitas
      else if (rt > 0.97) put(wx, y + 4, wz, K.pomez_bloque);
    }
    // la placa de la entrada y dos antorchas
    if (boca && oo === -2 && Math.round(s) === 6) {
      put(wx, y, wz, K.placa);
      out.push({ x: lx, y, z: lz, be: { type: 'placa', facing: 0, title: 'Tubo de lava', text: 'Un tubo que dejó la lava al correr. Lleve mascarilla (las fumarolas queman los pulmones), no pise junto al canal rojo y no se meta sin luz.' } });
    }
    if (boca && oo === 2 && Math.round(s) % 5 === 0 && s > 2) put(wx, y, wz, K.torch);
  }
}

function cavarCamara(gen, T, x0, z0, blocks, idx, out) {
  const seed = gen.seed, { get, put } = mk(gen, x0, z0, blocks, idx), C = T.cam, y = C.y;
  for (let lz = 0; lz < 16; lz++) for (let lx = 0; lx < 16; lx++) {
    const wx = x0 + lx, wz = z0 + lz, d = Math.hypot(wx - C.x, wz - C.z);
    if (d > 10.5) continue;
    const techo = d <= 9.5 ? Math.floor(7 * Math.sqrt(Math.max(0, 1 - (d / 9.5) * (d / 9.5))) + 1.2) : 0;
    if (d <= 9.5) for (let k = 0; k <= techo; k++) put(wx, y + k, wz, 0);
    // el casco de piedra de la sala
    for (let k = 0; k <= 9; k++) if (k > techo && get(wx, y + k, wz) === 0 && k <= techo + 1 && !(d > 9.5 && celdaTubo(T, wx, wz))) put(wx, y + k, wz, K.basalt);
    if (d <= 10.5) {
      put(wx, y - 1, wz, d <= 5.5 ? K.lava : K.basalt);
      put(wx, y - 2, wz, d <= 5.5 ? K.lava : K.basalt);
      put(wx, y - 3, wz, K.basalt);
      if (d > 9.5 && !celdaTubo(T, wx, wz)) for (let k = 0; k <= 4; k++) if (get(wx, y + k, wz) === 0) put(wx, y + k, wz, K.basalt); // (menos donde entra el tubo)
    }
    if (d > 6.2 && d < 9 && hash3(seed, wx, y + 3, wz) < 0.02) put(wx, y, wz, K.cristal_azufre_bloque);
  }
  // el cofre de colada en la orilla de enfrente, y la zona donde despierta el Guardián
  const chx = Math.round(C.x + C.tx * 7.5), chz = Math.round(C.z + C.tz * 7.5);
  if (chx >= x0 && chx < x0 + 16 && chz >= z0 && chz < z0 + 16) {
    const rnd = mulberry32((chx * 73856093) ^ (chz * 19349663) ^ seed);
    const pool = [[1160, 2, 5], [1162, 2, 4], [1163, 2, 4], [259, 1, 2], [258, 2, 4], [271, 1, 3]];
    const slots = new Array(27).fill(null);
    const n = 3 + Math.floor(rnd() * 2);
    for (let k = 0; k < n; k++) { const [id, a, b] = pool[Math.floor(rnd() * pool.length)]; let i = Math.floor(rnd() * 27); while (slots[i]) i = (i + 1) % 27; slots[i] = { id, count: a + Math.floor(rnd() * (b - a + 1)) }; }
    if (rnd() < 0.12) { let i = 0; while (slots[i]) i++; slots[i] = { id: 1167, count: 1 }; } // alguna vez, el casco armado
    put(chx, y, chz, K.chest);
    out.push({ x: chx - x0, y, z: chz - z0, be: { type: 'chest', facing: 0, slots, viejo: true } });
  }
  if (C.x >= x0 && C.x < x0 + 16 && C.z >= z0 && C.z < z0 + 16) out.push({ zone: { kind: 'colada', x: C.x, y: C.y, z: C.z, r: 11, id: T.id } });
}

// ---------- las Termales (estructura al pie de un volcán; la grilla de estructuras la llama con Ctx) ----------
export function buildTermales(c) {
  c.foundation(-11, -9, 11, 9, K.basalt, K.gravel, 8);
  for (const [px, pz] of [[-8, 2], [-3, 5], [3, 5], [8, 2], [0, 0]]) {
    c.circle(3.4, (x, z, d) => {
      if (d <= 2.4) { c.set(px + x, -1, pz + z, K.basalt); c.set(px + x, 0, pz + z, K.aguas_termales); } // un bloque de hondo: se camina dentro y no ahoga
      else c.set(px + x, 0, pz + z, K.stone);
    });
  }
  // la taquilla: una casita de tablas con el mostrador y la taquillera
  c.fill(-3, 0, -9, 3, 0, -5, K.planks);
  for (let y = 1; y <= 3; y++) for (let x = -3; x <= 3; x++) for (let z = -9; z <= -5; z++) c.set(x, y, z, x === -3 || x === 3 || z === -9 || z === -5 ? K.planks : 0);
  for (let y = 1; y <= 2; y++) c.set(0, y, -5, 0);
  c.fill(-3, 4, -9, 3, 4, -5, K.planks);
  c.set(-1, 1, -6, K.planks); c.set(0, 1, -6, K.planks); c.set(1, 1, -6, K.planks);
  c.set(-2, 3, -5, K.torch); c.set(2, 3, -5, K.torch);
  c.npc(0, 1, -7, { role: 'taquillera', name: 'Doña Mayela (taquilla)' });
  c.placa(2, 1, -4, 0, 'Aguas termales', '♨ Seis colones el pase y diez minutos en las pozas: calientan, curan y descansan. Los huevos se cuecen en 60 segundos.');
}

// ---------- la partida ----------
const dentro = (g, f) => g.player.body.touchingBlock(g.world, f);
// en la poza o flotando encima (el cuerpo flota en la superficie: la caja no toca el agua)
const enPoza = (g) => { const p = g.player.body.pos; return dentro(g, (b) => b.termal) || [0.3, -0.3].some((d) => g.world.getBlock(Math.floor(p.x), Math.floor(p.y + d), Math.floor(p.z)) === K.aguas_termales); };

export function usarFuego(g, held) {
  if (held.id === PASE) {
    if ((g.termalHasta || 0) > (g.clock || 0)) { g.ui.toast('♨ Ya tiene el pase: le quedan ' + Math.ceil((g.termalHasta - g.clock) / 60) + ' minutos', 2200); return true; }
    g.inventory.remove(PASE, 1);
    g.termalHasta = (g.clock || 0) + 600;
    g.ui.toast('♨ Pase sellado: diez minutos en las pozas', 2600);
    return true;
  }
  if (held.id === HUEVO && enPoza(g)) {
  if (g.huevoTermal) { g.ui.toast('♨ Ya hay un huevo cociéndose', 1800); return true; }
    g.inventory.remove(HUEVO, 1);
    g.huevoTermal = { t: 60 };
    g.ui.toast('🥚 El huevo se cuece en la poza: 60 segundos (con sal volcánica)', 3000);
    return true;
  }
  return false;
}

export function tickFuego(g, dt) {
  if (g.dim !== 'tierra' || !g.player.alive || !g.world) return;
  const p0 = g.player.body.pos;
  if (g.huevoTermal) {
    g.huevoTermal.t -= dt;
    if (g.huevoTermal.t <= 0) { g.huevoTermal = null; const s = g.inventory.add(HUEVO_TERMAL, 1); if (s) g.entities.dropItem(HUEVO_TERMAL, s, p0.x, p0.y + 1, p0.z); g.ui.toast('🥚 El huevo de aguas termales está listo', 2400); }
  }
  if (g.quemaN > 0) {
    g.quemaT = (g.quemaT || 0) - dt;
    if (g.quemaT <= 0) { g.quemaT = 1; g.quemaN--; g.damagePlayer(1, null, null, 'Se quemó con la lava del Guardián', true, true); }
  }
  g.fuegoT = (g.fuegoT || 0) - dt;
  if (g.fuegoT > 0) return;
  g.fuegoT = 0.5;
  const w = g.world, p = g.player.body.pos, fx = Math.floor(p.x), fy = Math.floor(p.y), fz = Math.floor(p.z);
  // las pozas: con pase calientan y descansan; sin pase, solo hay agua tibia
  if (enPoza(g)) {
    if ((g.termalHasta || 0) > (g.clock || 0)) {
      if (!g.player.effects.termal) { g.ui.toast('♨ ¡Qué rico! Las aguas termales descansan de verdad', 2200); g.achieve('termales', 'Baño en aguas termales'); }
      g.addEffect('termal', 4);
      delete g.player.effects.escalofrio;
      if (!g.player.effects.descansado) g.addEffect('descansado', 240);
    } else if (g.clock > (g.avisoTermal || 0)) { g.avisoTermal = g.clock + 20; g.ui.toast('♨ Las pozas son de pago: el pase de 6 colones se saca en la taquilla', 3000); }
  }
  // las fumarolas queman los pulmones si no hay mascarilla
  let cerca = false;
  for (let dx = -1; dx <= 1 && !cerca; dx++) for (let dz = -1; dz <= 1 && !cerca; dz++) for (let dy = -1; dy <= 1; dy++) if (w.getBlock(fx + dx, fy + dy, fz + dz) === K.fumarola) { cerca = true; break; }
  if (cerca) {
    g.fumT = (g.fumT || 0) + 1;
    if (g.inventory.count(MASCARILLA)) { if (g.fumT === 1) g.ui.toast('😷 Una fumarola: con la mascarilla, se pica sin peligro', 2400); }
    else if (g.fumT % 4 === 1) { g.damagePlayer(1, null, null, 'Los gases de una fumarola', true, true); g.addEffect('mareo', 2); g.ui.toast('😷 ¡Las fumarolas queman los pulmones: póngase la mascarilla!', 2600); }
  } else g.fumT = 0;
  // la fauna del tubo: el ceniciento y los murciélagos andan por los tubos
  g.tuboT = (g.tuboT || 0) - 0.5;
  if (g.tuboT <= 0) {
    g.tuboT = 12 + Math.random() * 8;
    const gen = w.gen, vcx = Math.floor(p.x / VOLCANO_CELL), vcz = Math.floor(p.z / VOLCANO_CELL);
    let T = null;
    for (let dz = -1; dz <= 1 && !T; dz++) for (let dx = -1; dx <= 1; dx++) { const t = tuboDe(gen, vcx + dx, vcz + dz); if (t && celdaTubo(t, fx, fz)) { T = t; break; } }
    if (T && g.mode === 'survival' && g.settings.hostiles !== false) {
      const E = g.entities, cuenta = (k) => E.mobs.filter((m) => m.type === k && !m.dead).length;
      const kind = Math.random() < 0.6 ? 'ceniciento' : 'murcielago';
      if (cuenta(kind) < 2 && E.spawnMob) for (let t = 0; t < 8; t++) {
        const a = Math.random() * Math.PI * 2, r = 6 + Math.random() * 4, x = Math.floor(p.x + Math.cos(a) * r), z = Math.floor(p.z + Math.sin(a) * r);
        if (w.getBlock(x, fy, z) === 0 && w.getBlock(x, fy + 1, z) === 0 && w.getBlock(x, fy - 1, z) !== 0 && w.getBlock(x, fy - 1, z) !== K.lava) { E.spawnMob(kind, x + 0.5, fy + 0.2, z + 0.5); break; }
      }
    }
  }
}

// el Guardián despierta cuando se entra en la cámara del magma (una vez por cámara, como el Murciélago Rey)
export function tickColada(g, zn) {
  if (g.meta.invitado) return; // v12.15.3: el Guardián lo despierta y lo simula el anfitrión (a una invitada se le tiraría)
  const pl = g.jugadorMasCercano ? g.jugadorMasCercano(zn.x, zn.z) : g.player, p = pl.body.pos; // v12.15.3: también despierta si entra una persona invitada
  if (Math.hypot(zn.x - p.x, zn.z - p.z) > zn.r || Math.abs(zn.y - p.y) > 6 || g.mode !== 'survival') return;
  const V = (g.meta.coladaVencida = g.meta.coladaVencida || {});
  if (V[zn.id] || g.entities.mobs.some((m) => m.type === 'guardian_colada' && !m.dead)) return;
  const m = g.entities.spawnMob('guardian_colada', zn.x + 0.5, zn.y + 0.2, zn.z + 6.5);
  if (!m) return;
  m.data.zona = zn.id; m.data.angry = true;
  g.ui.toast('🌋 ¡EL GUARDIÁN DE LA COLADA DESPERTÓ!', 3000);
  g.audio.play('cocodrilo', { ui: true, vol: 1, pitch: 0.5 });
  g.shake = Math.max(g.shake || 0, 0.8);
}

export const botasDeCeniza = (g) => { const b = g.inventory.armor && g.inventory.armor[3]; return !!(b && b.id === BOTAS); };
export const conCasco = (g) => { const h = g.inventory.armor && g.inventory.armor[0]; return !!(h && (h.id === CASCO || h.id === 1194)); }; // v13.3.4: el casco con lente también alumbra
