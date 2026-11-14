// C5-B «Tortugas y arrecife» (v12.6.0, docs/revisiones/DISENO_CONTENIDO_C5-C8.md §C5-B). La parte del juego donde lo tico no es
// «matar nada»: cuidar los nidos de la arribada y revivir el arrecife blanqueado. Paga poco a propósito: lo que vale es el logro.
// - Nidos: con la estaca de nido (clic derecho a un nido de la arribada) se marca: queda protegido y a las 5 noches salen 8 a 12
//   tortuguitas, que van solas al mar. v12.6.4: todos los nidos de la lora nacen a la quinta noche (los sin marcar, 3–6 y sin pago),
//   así que en esas 4 noches los saqueadores tienen nidos que cavar: marcar es protegerlos. Las antorchas a 8 bloques las desorientan (el 30 % se va para tierra y se pierde).
//   En las 4 noches después de una arribada vienen saqueadores que cavan los nidos SIN marcar; golpear a uno lo atrapa
//   (el guardacostas se lo lleva y la multa paga 5 u). Nunca hay huevos en el inventario.
// - Cada tortuguita que llega al agua desde un nido protegido paga 0.3 u (tope 30 u por arribada); a las 100, la banderita azul.
// - Arrecife: con la careta en el inventario y la mano vacía, clic derecho a un coral vivo saca un fragmento (sin matarlo; uno por
//   coral cada 3 días). El fragmento sobre un coral blanco lo revive. El vivero de coral da 2 fragmentos cada 3 días.
//   Hitos: 20 / 60 / 150 corales revividos; desde 60, los buzos pagan 10 u al día si uno anda cerca del arrecife revivido.
//   v12.6.3: los fragmentos salen solo de corales del arrecife (no de uno trasplantado), 6 por día; 2 saqueadores por noche.
// - La pecera con un pez vivo da comodidad (fuerza.js).
// Guardado: meta.tortugas, meta.arrecife, meta.fragCoral (opcionales) y las entidades de bloque de los nidos, el vivero y la pecera.
import { BLOCK_BY_KEY as K, FLUID, SOLID, isBlockId } from './blocks.js';
import { SEA, CHUNK, idx } from './worldgen.js';
import { K as K_UNIDAD, COLON, cobrarDelTope } from './plata.js';
import { fragata as armarFragata } from './costa.js';

export const FRAGMENTO = 1121, ESTACA = 1124, BANDERITA = 1125, CABUYA = 1126, CARETA = 445;
const CORALES = ['coral_red', 'coral_orange', 'coral_yellow', 'coral_purple'];
const PECES = [361, 363]; // pargo y guapote (vivos, recién pescados)
const MAX_NIDOS = 12, TOPE_ARRIBADA = 30;
// v12.6.3 (decimotercera revisión): topes nuevos
const FRAG_DIA = 6, SAQUEOS_NOCHE = 2, BUZOS_R = 40, MAX_VIVOS = 400;

const numeros = (o, claves) => { for (const k of claves) if (o[k] !== undefined && !Number.isFinite(o[k])) delete o[k]; return o; }; // v12.6.3
const T = (g) => numeros(g.meta.tortugas && typeof g.meta.tortugas === 'object' ? g.meta.tortugas : (g.meta.tortugas = { liberadas: 0 }), ['liberadas', 'pagado', 'marcados', 'marcadosDe', 'arribada', 'saqueoN', 'saqueoNDia']);
const A = (g) => {
  const R = numeros(g.meta.arrecife && typeof g.meta.arrecife === 'object' ? g.meta.arrecife : (g.meta.arrecife = { revividos: 0 }), ['revividos', 'buzosDia', 'fragN', 'fragDia']);
  if (!Number.isFinite(R.revividos)) R.revividos = 0;
  if (!Array.isArray(R.vivos)) R.vivos = []; // v12.6.3: dónde están los corales revividos (los buzos y los fragmentos)
  // v12.6.5: solo textos «x,y,z» (un mundo importado con [1, null] tiraba TypeError en el tic) y con su tope
  if (R.vivos.some((s) => typeof s !== 'string' || !POS.test(s)) || R.vivos.length > MAX_VIVOS) R.vivos = R.vivos.filter((s) => typeof s === 'string' && POS.test(s)).slice(-MAX_VIVOS);
  if (!R.vivosV && g.world) migrarVivos(g, R);
  return R;
};
const POS = /^-?\d+,\d+,-?\d+$/;
// v12.6.5: los mundos de la 12.6.0–12.6.2 revivieron corales sin anotar dónde. Una sola vez: los corales de color que el jugador dejó
// (en world.mods) pasan a la lista, hasta los que diga «revividos»
function migrarVivos(g, R) {
  R.vivosV = 1;
  if (!(R.revividos > 0) || R.vivos.length >= R.revividos) return;
  const vivos = new Set(CORALES.map((k) => K[k]));
  const tierra = g.dims && g.dims.tierra && g.dims.tierra.mods ? g.dims.tierra.mods : (g.dim === 'tierra' ? g.world.mods : null);
  if (!tierra) return;
  const ya = new Set(R.vivos);
  for (const [ck, m] of tierra) {
    const [cx, cz] = ck.split(',').map(Number);
    for (const [i, id] of m) {
      if (!vivos.has(id)) continue;
      const x = cx * CHUNK + (i % CHUNK), y = Math.floor(i / (CHUNK * CHUNK)), z = cz * CHUNK + (Math.floor(i / CHUNK) % CHUNK);
      // v12.8.2 (decimoquinta revisión, punto 4): solo los corales bajo el mar (uno de adorno en la casa no cuenta)
      if (y >= SEA || (g.world.isLoaded(x, z) && FLUID[g.world.getBlock(x, y + 1, z)] !== 1)) continue;
      const s = `${x},${y},${z}`;
      if (!ya.has(s)) { R.vivos.push(s); ya.add(s); }
      if (R.vivos.length >= Math.min(R.revividos, MAX_VIVOS)) return;
    }
  }
}
// v12.6.3: ¿el bloque es como lo dejó el generador? (los que puso el jugador quedan en world.mods)
const delGenerador = (w, x, y, z) => { const cx = Math.floor(x / CHUNK), cz = Math.floor(z / CHUNK), m = w.mods.get(`${cx},${cz}`); return !m || !m.has(idx(x - cx * CHUNK, y, z - cz * CHUNK)); };
const pagar = (g, u) => { if (!(u > 0)) return; if (g.inventory.darColones) g.inventory.darColones(Math.round(u * K_UNIDAD)); else g.inventory.add(COLON, Math.round(u)); };
const tieneCareta = (g) => g.inventory.count(CARETA) > 0 || g.inventory.armor.some((s) => s && s.id === CARETA);
const LUCES = new Set([K.torch, K.lamp, K.farol].filter(Boolean));
const luzCerca = (w, x, y, z) => { for (let dx = -6; dx <= 6; dx++) for (let dz = -6; dz <= 6; dz++) for (let dy = -2; dy <= 3; dy++) if (LUCES.has(w.getBlock(x + dx, y + dy, z + dz))) return true; return false; }; // v12.6.1: también faroles y lámparas

// clic derecho a un bloque (lo llama game.js rightClick); true si lo atendió
export function usarArrecife(g, t, held) {
  const w = g.world, id = t.id, sv = g.mode === 'survival';
  if (g.player.sneaking && held && isBlockId(held.id)) return false; // v12.6.3: agachado se puede poner un bloque contra ellos
  // marcar un nido de la arribada (solo los de la tortuga lora: la baula, la verde y los del parque siguen con lo suyo)
  if (id === K.turtle_nest && held && held.id === ESTACA) {
    const be0 = w.getBE(t.x, t.y, t.z);
    if (!be0 || be0.type !== 'nest' || !be0.lora) { g.ui.toast('🐢 La estaca es para los nidos de la arribada (tortuga lora). Este nido sigue su curso solo', 2600); return true; }
    const M = T(g), ar = M.arribada || 0;
    if ((M.marcados || 0) >= MAX_NIDOS && M.marcadosDe === ar) { g.ui.toast(`🐢 Ya marcó ${MAX_NIDOS} nidos de esta arribada`, 2200); return true; }
    if (M.marcadosDe !== ar) { M.marcadosDe = ar; M.marcados = 0; }
    M.marcados++;
    w.setBlock(t.x, t.y, t.z, K.nido_marcado);
    const hoy = g.day || 1, nace = Number.isFinite(be0.eclosiona) ? be0.eclosiona : (Number(be0.dia) || hoy) + 5; // v12.6.4: la fecha del nido, no la de marcarlo
    w.setBE(t.x, t.y, t.z, { type: 'nido', eclosiona: nace, arribada: ar });
    if (sv) g.inventory.consumeHeld(1);
    const faltan = Math.max(0, nace - hoy);
    g.ui.toast(`🐢 Nido protegido: ${faltan ? `en ${faltan} noche${faltan > 1 ? 's' : ''}` : 'esta noche'} salen las tortuguitas. Apague las antorchas de la playa ese día`, 3400);
    g.achieve('nido', 'Guardián de un nido');
    return true;
  }
  if (id === K.nido_marcado) {
    const be = w.getBE(t.x, t.y, t.z), faltan = be ? Math.max(0, be.eclosiona - (g.day || 1)) : 0;
    g.ui.toast(faltan ? `🐢 Nido protegido: faltan ${faltan} noche${faltan > 1 ? 's' : ''} para que nazcan` : '🐢 Nido protegido: esta noche nacen', 2200);
    return true;
  }
  // revivir un coral blanco
  if (id === K.coral_blanco) {
    if (!held || held.id !== FRAGMENTO) { g.ui.toast('🪸 Coral blanqueado: con un fragmento de coral en la mano se puede revivir', 2600); return true; }
    w.setBlock(t.x, t.y, t.z, K[CORALES[Math.floor(Math.random() * 4)]]);
    if (sv) g.inventory.consumeHeld(1);
    const R = A(g); R.revividos++;
    R.vivos.push(`${t.x},${t.y},${t.z}`); if (R.vivos.length > MAX_VIVOS) R.vivos.shift();
    g.particles.burst(t.x + 0.5, t.y + 0.6, t.z + 0.5, [[1, 0.5, 0.55], [1, 0.8, 0.3], [0.8, 0.5, 1]], 14, 1.4);
    g.ui.toast(`🪸 ¡El coral revive! Llevan ${R.revividos}`, 2200);
    for (const [n, k, txt] of [[20, 'coral20', 'Jardinero del arrecife'], [60, 'coral60', 'El arrecife respira'], [150, 'coral150', 'Arrecife de colores']]) if (R.revividos === n) { g.achieve(k, txt); if (n === 60) g.ui.toast('🤿 Ya vienen buzos a ver el arrecife: le dejan algo cada día que ande por la playa', 3600); }
    return true;
  }
  // sacar un fragmento de un coral vivo (con la careta, mano vacía); no lo mata
  if (CORALES.some((k) => K[k] === id) && !held) {
    if (!tieneCareta(g)) { g.ui.toast('🤿 Con una careta se puede sacar un fragmento de coral sin dañarlo', 2400); return true; }
    const F = (g.meta.fragCoral && typeof g.meta.fragCoral === 'object') ? g.meta.fragCoral : (g.meta.fragCoral = {});
    const k = `${t.x},${t.y},${t.z}`, hoy = g.day || 1, R = A(g);
    // v12.6.3: un coral trasplantado no da fragmentos (si no, moverlo daba otro al instante) y hay un tope por día
    if (!delGenerador(w, t.x, t.y, t.z) && !R.vivos.includes(k)) { g.ui.toast('🪸 Este coral está recién trasplantado: los fragmentos se sacan de los corales del arrecife', 2400); return true; }
    if (R.fragDia !== hoy) { R.fragDia = hoy; R.fragN = 0; }
    if (R.fragN >= FRAG_DIA) { g.ui.toast(`🪸 Ya sacó ${FRAG_DIA} fragmentos hoy: el arrecife necesita descansar`, 2200); return true; }
    if (Number.isFinite(F[k]) && hoy - F[k] < 3) { g.ui.toast('🪸 A este coral ya se le sacó un fragmento: déjelo crecer unos días', 2000); return true; }
    const claves = Object.keys(F); if (claves.length > 400) for (const c of claves) if (hoy - F[c] >= 3) delete F[c]; // no crece sin fin
    F[k] = hoy; R.fragN++;
    g.inventory.add(FRAGMENTO, 1);
    g.ui.toast('🪸 Un fragmento de coral: plántelo en un coral blanco', 1800);
    return true;
  }
  // el vivero: 2 fragmentos cada 3 días
  if (id === K.vivero_coral) {
    if (!bajoElMar(w, t.x, t.y, t.z)) { g.ui.toast('🪸 El vivero tiene que estar bajo el agua del mar para criar coral', 2400); return true; } // v12.6.1
    let be = w.getBE(t.x, t.y, t.z);
    if (!be || be.type !== 'vivero' || !Number.isFinite(be.dia)) { be = { type: 'vivero', dia: g.day || 1 }; w.setBE(t.x, t.y, t.z, be); }
    const faltan = 3 - ((g.day || 1) - be.dia);
    if (faltan > 0) { g.ui.toast(`🪸 El vivero está criando: ${faltan} día${faltan > 1 ? 's' : ''} más`, 1800); return true; }
    be.dia = g.day || 1; w.touchBE(t.x, t.y, t.z);
    g.inventory.add(FRAGMENTO, 2);
    g.ui.toast('🪸 Del vivero salen 2 fragmentos de coral', 1800);
    return true;
  }
  // la pecera: con un pez vivo
  if (id === K.pecera) {
    const be = w.getBE(t.x, t.y, t.z);
    if (be && be.pez) { g.ui.toast('🐠 La pecera ya tiene su pez: da comodidad a la casa', 1800); return true; }
    if (!held || !PECES.includes(held.id)) { g.ui.toast('🐠 Póngale un pez vivo (un pargo o un guapote recién pescado)', 2200); return true; }
    w.setBE(t.x, t.y, t.z, { type: 'pecera', pez: held.id });
    if (sv) g.inventory.consumeHeld(1);
    g.ui.toast('🐠 ¡Qué bonita la pecera! Ya da comodidad', 2000);
    g.achieve('pecera', 'Pecera en la sala');
    return true;
  }
  return false;
}

// la noche de la arribada (lo llama arribada.js al avisar): desde ahí cuentan las 4 noches de saqueadores
export function anotarArribada(g) { const M = T(g); if (M.arribada !== g.day) { M.arribada = g.day; M.pagado = 0; } }

// una vez por segundo
export function tickTortugasArrecife(g) {
  if (g.dim !== 'tierra') return;
  quizaDonaLia(g); // v12.7.1
  const M = T(g), w = g.world, hoy = g.day || 1, noche = g.daylight < 0.3, p = g.player.body.pos;
  // los nidos protegidos que ya cumplen: nacen de noche, si el chunk está cargado y uno anda cerca
  if (noche) {
    for (const [ck, m] of w.blockEntities) {
      const [cx, cz] = ck.split(',').map(Number);
      if (!w.getChunk(cx, cz)) continue;
      for (const [i, be] of m) {
        if (be.type !== 'nido') continue;
        const bx = cx * 16 + (i % 16), bz = cz * 16 + (Math.floor(i / 16) % 16), by = Math.floor(i / 256);
        if (w.getBlock(bx, by, bz) !== K.nido_marcado) { w.setBE(bx, by, bz, null); continue; } // v12.6.5: se lo llevó una explosión o el agua
        if (!Number.isFinite(be.eclosiona)) be.eclosiona = hoy + 5; // v12.6.3: de un mundo importado
        if (be.eclosiona > hoy) continue;
        const x = cx * 16 + (i % 16), z = cz * 16 + (Math.floor(i / 16) % 16), y = Math.floor(i / 256);
        if (Math.hypot(x - p.x, z - p.z) > 48) continue;
        w.setBE(x, y, z, null);
        if (w.getBlock(x, y, z) === K.nido_marcado) w.setBlock(x, y, z, K.sand);
        const n = 8 + Math.floor(Math.random() * 5), luz = luzCerca(w, x, y, z);
        for (let k = 0; k < n; k++) {
          const t = g.entities.spawnMob('tortuguita', x + 0.3 + Math.random() * 0.4, y + 0.05, z + 0.3 + Math.random() * 0.4);
          t.data.deNido = be.arribada || 0;
          if (luz && Math.random() < 0.3) t.data.desviada = true; // la luz la confunde: camina para tierra
        }
        g.particles.dust(x + 0.5, y + 0.6, z + 0.5, K.sand, 14);
        quizaFragatas(g, x, y, z); // v12.7.1
        g.ui.toast(luz ? '🐢 ¡Nacen las tortuguitas! Ojo: hay antorchas cerca y algunas se van para tierra' : '🐢 ¡Nacen las tortuguitas! Van solitas al mar', 3200);
        return; // un nido por segundo
      }
    }
  }
  // los saqueadores: las 4 noches después de una arribada, cerca de nidos sin marcar
  if (noche && M.arribada && hoy > M.arribada && hoy <= M.arribada + 4 && g.mode === 'survival') {
    const hay = g.entities.mobs.filter((m) => m.data && m.data.saqueador && !m.dead).length;
    if (M.saqueoNDia !== hoy) { M.saqueoNDia = hoy; M.saqueoN = 0; }
    // v12.6.3: a lo sumo 2 saqueadores por noche (antes, atrapar al primero dejaba salir otro: se podía farmear)
    if (hay < 2 && M.saqueoN < SAQUEOS_NOCHE && Math.random() < 0.05) {
      const nido = buscarNido(w, p, 40);
      if (nido) {
        // aparece sobre la playa (suelo firme a la altura del mar, a 10–16 bloques del nido), no encima de un cerro
        let sx = 0, sy = 0, sz = 0;
        for (let k = 0; k < 24 && !sy; k++) {
          const a = Math.random() * Math.PI * 2, d = 10 + Math.random() * 6, x = Math.floor(nido.x + Math.cos(a) * d), z = Math.floor(nido.z + Math.sin(a) * d);
          for (let y = SEA + 1; y <= SEA + 5; y++) if (SOLID[w.getBlock(x, y - 1, z)] && !SOLID[w.getBlock(x, y, z)] && !SOLID[w.getBlock(x, y + 1, z)] && !FLUID[w.getBlock(x, y, z)]) { sx = x + 0.5; sy = y; sz = z + 0.5; break; }
        }
        const s = sy ? g.entities.spawnMob('vecino', sx, sy + 0.1, sz) : null;
        if (s) {
          M.saqueoN++;
          Object.assign(s.data, { role: 'vecino', name: 'Saqueador de nidos', saqueador: true, seed: 9191, objetivo: nido });
          s.data.comensalFn = (m, dt) => cerebroSaqueador(m, dt, g);
          if (s.kind.dress) s.kind.dress(s);
          if (M.avisoSaqueo !== hoy) { M.avisoSaqueo = hoy; g.ui.toast('🔦 Alguien anda con una linterna por la playa… viene por los nidos sin marcar. Atrápelo de un golpe', 3600); }
        }
      }
    }
  }
  // los buzos: desde 60 corales revividos, 10 u al día si uno anda de día cerca del arrecife que revivió (v12.6.3: a ≤ 40 bloques de
  // un coral revivido, no en cualquier playa, y el pago cuenta en el tope de ganancia del día de los encargos)
  const R = g.meta.arrecife && typeof g.meta.arrecife === 'object' ? A(g) : null;
  if (R && R.revividos >= 60 && !noche && R.buzosDia !== hoy && g.mode === 'survival' && cercaDeVivos(R, p)) {
    R.buzosDia = hoy;
    const u = cobrarDelTope(g, 10); pagar(g, u);
    g.ui.toast(`🤿 Los buzos que vinieron a ver el arrecife le dejaron ${u} unidades${u < 10 ? ' (ya ganó bastante hoy)' : ''}`, 2600);
  }
}
// v12.6.5: el vivero, en el mar de verdad: agua (no celeste) en toda la columna hasta el nivel del mar (una piscina bajo tierra no)
function bajoElMar(w, x, y, z) {
  if (y >= SEA) return false;
  for (let yy = y + 1; yy <= SEA; yy++) { const b = w.getBlock(x, yy, z); if (FLUID[b] !== 1 || b === K.agua_celeste) return false; }
  return true;
}
function cercaDeVivos(R, p) {
  for (const s of R.vivos) { const [x, , z] = s.split(',').map(Number); if (Math.hypot(x - p.x, z - p.z) <= BUZOS_R) return true; }
  return false;
}
// el nido sin marcar más cercano, barriendo la franja de arena a la altura del mar (solo corre cuando sale la tirada del saqueador)
function buscarNido(w, p, r) {
  const x0 = Math.floor(p.x), z0 = Math.floor(p.z);
  let mejor = null, md = Infinity;
  for (let dx = -r; dx <= r; dx++) for (let dz = -r; dz <= r; dz++) {
    const x = x0 + dx, z = z0 + dz;
    if (!w.isLoaded(x, z)) continue;
    for (let y = SEA; y <= SEA + 4; y++) if (w.getBlock(x, y, z) === K.turtle_nest) { const d = dx * dx + dz * dz; if (d < md) { md = d; mejor = { x, y, z }; } break; }
  }
  return mejor;
}
// el saqueador camina al nido, cava 4 s y se va; si lo golpean, lo atrapan
function cerebroSaqueador(m, dt, g) {
  const d = m.data, b = m.body.pos, w = g.world;
  if (m.hurtT > 0 || m.health < (m.kind.health || 20)) { atrapar(m, g); return true; }
  const o = d.objetivo;
  if (d.estado === 'huye') { m.goTo(b.x + (d.hx || 1) * 5, b.z + (d.hz || 0) * 5, 1.4); d.t = (d.t || 0) + dt; if (d.t > 12) m.dead = true; return true; }
  if (!o || w.getBlock(o.x, o.y, o.z) !== K.turtle_nest) { d.estado = 'huye'; d.t = 0; return true; } // ya no hay nido (lo marcaron)
  if (Math.hypot(o.x + 0.5 - b.x, o.z + 0.5 - b.z) > 1.2) { m.goTo(o.x + 0.5, o.z + 0.5, 1); return true; }
  m.moving = false; d.cava = (d.cava || 0) + dt;
  if (Math.random() < dt * 6) g.particles.dust(b.x, b.y, b.z, K.sand, 2);
  if (d.cava > 4) { w.setBlock(o.x, o.y, o.z, K.sand); w.setBE(o.x, o.y, o.z, null); d.estado = 'huye'; d.t = 0; d.hx = Math.sign(b.x - o.x) || 1; d.hz = 0; if (Math.hypot(b.x - g.player.body.pos.x, b.z - g.player.body.pos.z) < 32) g.ui.toast('😞 Se llevaron los huevos de un nido sin marcar', 2400); }
  return true;
}
function atrapar(m, g) {
  if (m.data.atrapado) return;
  m.data.atrapado = true; m.dead = true;
  pagar(g, 5);
  g.particles.burst(m.body.pos.x, m.body.pos.y + 1, m.body.pos.z, [[0.3, 0.5, 1], [1, 1, 1]], 12, 1.2);
  g.ui.toast('🚓 ¡Lo atrapó! El guardacostas se lleva al saqueador; la multa le da 5 unidades', 3000);
  g.achieve('saqueador', 'Los nidos no se tocan');
}

// una tortuguita de un nido protegido llegó al agua (lo llama fauna.js)
export function tortuguitaAlMar(g, m) {
  if (!m.data.deNido && m.data.deNido !== 0) return;
  const M = T(g);
  M.liberadas = (M.liberadas || 0) + 1;
  if (M.arribada === m.data.deNido || !M.arribada) {
    const antes = M.pagado || 0, dar = Math.max(0, Math.min(0.3, TOPE_ARRIBADA - antes));
    M.pagado = antes + dar; pagar(g, dar);
  }
  if (M.liberadas === 100) {
    g.inventory.add(BANDERITA, 1);
    g.ui.toast('🏳️ ¡100 tortuguitas al mar! Doña Lía, de la Asociación de Voluntarios de la Playa, le da la banderita azul: los turistas de la playa le pagan más', 4600);
    g.achieve('voluntario_tortuga', 'Voluntario de la tortuga');
  }
}
// las desviadas (por la luz) caminan para tierra y se pierden (lo llama fauna.js en su cerebro)
export function desviada(m, dt) {
  const d = m.data;
  if (!d.desviada) return false;
  if (!d.tierra) { const a = Math.random() * Math.PI * 2; d.tierra = { x: m.body.pos.x + Math.cos(a) * 30, z: m.body.pos.z + Math.sin(a) * 30 }; }
  m.goTo(d.tierra.x, d.tierra.z, 1);
  d.perdida = (d.perdida || 0) + dt;
  if (d.perdida > 20) m.dead = true;
  return true;
}
export const aguaEn = (w, x, z) => FLUID[w.getBlock(Math.floor(x), SEA, Math.floor(z))] === 1;

// ---- v12.7.1 (sobras de C5-B, DISENO §B.1 3 y 4) ----
// La fragata: cuando nace un nido protegido, a veces bajan 1 o 2 a cazar tortuguitas en la arena. Un golpe la espanta. Si alcanza a
// una tortuguita, se la lleva. Se va sola a los 50 s
export const FRAGATA = {
  name: 'Fragata', w: 0.6, h: 0.4, health: 4, speed: 5, flying: true, hurtSound: 'aleteo', idleSound: null,
  particle: [[0.1, 0.1, 0.12]], drops: [],
  build() { const m = armarFragata(); m.scale.setScalar(0.8); m.userData.wings = m.userData.alas.map((a) => ({ p: a.hombro, side: a.s })); return m; }, // flyUpdate aletea con «wings»
  flyGoal(m, g) {
    const d = m.data, b = m.body.pos;
    if (d.nace === undefined) d.nace = m.t; // flyGoal corre cada cuadro: el tiempo, con el reloj del mob
    const vida = m.t - d.nace;
    if (d.huye || vida > 50) { d.huye = true; if (d.huyeT === undefined) d.huyeT = m.t; if (m.t - d.huyeT > 12 || b.y > SEA + 40) m.dead = true; return { x: b.x + (d.hx || 1) * 20, y: b.y + 10, z: b.z + (d.hz || 0) * 20 }; }
    // la tortuguita más cercana de un nido protegido, en tierra
    let presa = null, md = 30;
    for (const t of g.entities.mobs) if (!t.dead && t.type === 'tortuguita' && t.data.deNido !== undefined) { const dd = Math.hypot(t.body.pos.x - b.x, t.body.pos.z - b.z); if (dd < md) { md = dd; presa = t; } }
    if (!presa) return { x: b.x + Math.sin(m.t * 0.6) * 8, y: SEA + 14, z: b.z + Math.cos(m.t * 0.6) * 8 };
    const tp = presa.body.pos;
    if (Math.hypot(tp.x - b.x, tp.y - b.y, tp.z - b.z) < 0.9) {
      presa.dead = true; d.huye = true; d.hx = Math.sign(b.x - g.player.body.pos.x) || 1; d.hz = 0;
      if (Math.hypot(b.x - g.player.body.pos.x, b.z - g.player.body.pos.z) < 32) g.ui.toast('🐦 Una fragata se llevó una tortuguita. Espántelas de un golpe', 2400);
      return { x: b.x, y: b.y + 8, z: b.z };
    }
    return { x: tp.x, y: tp.y + 0.3, z: tp.z };
  },
  onHurt(m, g) { m.data.huye = true; m.data.hx = Math.sign(m.body.pos.x - g.player.body.pos.x) || 1; m.data.hz = Math.sign(m.body.pos.z - g.player.body.pos.z) || 0; g.achieve('fragata', 'Fuera de la playa'); },
};
// las que bajan al nacer un nido (lo llama la eclosión de arriba)
function quizaFragatas(g, x, y, z) {
  if (g.mode !== 'survival') return;
  const hay = g.entities.mobs.filter((m) => !m.dead && m.type === 'fragata').length;
  for (let k = 0; k < 2 && hay + k < 3; k++) if (Math.random() < 0.45) g.entities.spawnMob('fragata', x + (Math.random() - 0.5) * 10, y + 7 + Math.random() * 4, z + (Math.random() - 0.5) * 10);
}

// Doña Lía, la voluntaria de la Asociación de Voluntarios de la Playa: aparece en la playa la noche de la arribada (y la de los nacimientos)
// y cuenta cómo va la cosa. Es un vecino sin tienda (no se guarda: se vuelve a poner cuando hace falta)
export function quizaDonaLia(g) {
  if (g.dim !== 'tierra' || g.mode !== 'survival') return;
  const M = T(g), hoy = g.day || 1, p = g.player.body.pos;
  const toca = M.arribada && (hoy === M.arribada || hoy === M.arribada + 5) && g.daylight < 0.35;
  const lia = g.entities.mobs.find((m) => !m.dead && m.data && m.data.lia);
  if (!toca) { if (lia && Math.hypot(lia.body.pos.x - p.x, lia.body.pos.z - p.z) > 40) lia.dead = true; return; }
  if (lia || g.world.gen.column(Math.floor(p.x), Math.floor(p.z)).biome !== 'beach') return;
  for (let k = 0; k < 20; k++) {
    const a = Math.random() * Math.PI * 2, x = Math.floor(p.x + Math.cos(a) * 6), z = Math.floor(p.z + Math.sin(a) * 6);
    for (let y = SEA + 1; y <= SEA + 5; y++) if (SOLID[g.world.getBlock(x, y - 1, z)] && !SOLID[g.world.getBlock(x, y, z)] && !SOLID[g.world.getBlock(x, y + 1, z)] && !FLUID[g.world.getBlock(x, y, z)]) {
      const s = g.entities.spawnMob('vecino', x + 0.5, y + 0.1, z + 0.5);
      if (!s) return;
      Object.assign(s.data, { role: 'vecino', name: 'Doña Lía (voluntaria)', lia: true, seed: 4242 });
      s.data.alHablar = (m, gg) => { hablaLia(gg); return true; };
      if (s.kind.dress) s.kind.dress(s);
      if (M.liaAviso !== hoy) { M.liaAviso = hoy; g.ui.toast('🔦 Doña Lía, de la Asociación de Voluntarios de la Playa, anda cuidando los nidos: háblele', 3200); }
      return;
    }
  }
}
function hablaLia(g) {
  const M = T(g), lib = M.liberadas || 0, falta = Math.max(0, 100 - lib), pag = Math.round((M.pagado || 0) * 10) / 10;
  const txt = lib >= 100 ? `¡${lib} tortuguitas al mar! Usted ya tiene la banderita azul: los turistas de esta playa le pagan más. Gracias por cuidar.`
    : `Esta arribada le hemos pagado ${pag} de ${TOPE_ARRIBADA} unidades. Lleva ${lib} tortuguitas al mar: le faltan ${falta} para la banderita azul. Marque los nidos con la estaca, apague las antorchas y espante las fragatas.`;
  g.ui.dialog('Doña Lía (voluntaria)', txt, 5200);
}
// la banderita azul: los turistas pagan +25 % (turistas.js)
export const conBanderita = (g) => ((g.meta.tortugas && g.meta.tortugas.liberadas) || 0) >= 100;
// los 150 corales: una mantarraya más cerca del arrecife revivido (mar2.js)
export function arrecifeRico(g, p) { const R = g.meta.arrecife; return !!(R && R.revividos >= 150 && Array.isArray(R.vivos) && cercaDeVivos(A(g), p)); }
