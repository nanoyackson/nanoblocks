// Las mañas: cada tantos niveles uno escoge una de tres ventajas. Pasado el nivel 10 subir casi no daba nada, y nadie decidía
// nada sobre cómo quería jugar. Las ventajas se leen con `mana()` de progreso.js; aquí está el catálogo, la oferta y la hoja de la libreta.
import { BLOCKS } from './blocks.js';
import { mana } from './progreso.js';
import { gainSkill } from './habilidades.js';
import { manasJefeHTML } from './manasjefe.js';

const AIR = 0;
export const FAMILIAS = { pelea: '⚔ Pelea', monte: '🌿 Monte', oficio: '🔨 Oficio' };
export const MANAS = [
  { k: 'mano_pesada', i: '👊', f: 'pelea', t: 'Mano pesada', d: '10 % más de daño con todo' },
  { k: 'cuero_duro', i: '🛡', f: 'pelea', t: 'Cuero duro', d: 'Recibe 8 % menos de daño de las criaturas' },
  { k: 'reflejos', i: '⚡', f: 'pelea', t: 'Reflejos', d: 'Tiene la mitad más de tiempo para hacer parry con el escudo' },
  { k: 'sangre_caliente', i: '🩸', f: 'pelea', t: 'Sangre caliente', d: 'Cada enemigo vencido le devuelve un corazón' },
  { k: 'por_un_pelito', i: '🍀', f: 'pelea', t: 'Por un pelito', d: 'Una vez al día, el golpe mortal le deja un corazón' },
  { k: 'punteria', i: '🎯', f: 'pelea', t: 'Puntería', d: 'Flechas, honda, dardos y chancleta pegan 25 % más' },
  { k: 'camello', i: '💧', f: 'monte', t: 'Camello', d: 'La sed baja 25 % más lento' },
  { k: 'buche', i: '🍖', f: 'monte', t: 'Buche de hierro', d: 'Hambre y sed 15 % más lentas, y lo crudo nunca cae mal' },
  { k: 'pata_de_perro', i: '🐾', f: 'monte', t: 'Pata de perro', d: 'Camina y corre 7 % más rápido' },
  { k: 'cae_de_pie', i: '🐈', f: 'monte', t: 'Cae de pie', d: 'Las caídas pegan la mitad y no quiebran la pierna' },
  { k: 'sueno_pesado', i: '🛏', f: 'monte', t: 'Sueño pesado', d: 'Dormir en cualquier cama cura toda la vida y todos los males' },
  { k: 'ojo_de_gato', i: '👁', f: 'monte', t: 'Ojo de gato', d: 'Ve mucho más claro de noche y en las cuevas' },
  { k: 'hacha_monte', i: '🪓', f: 'oficio', t: 'Hacha de monte', d: 'Con hacha, cortar un tronco tumba el árbol entero' },
  { k: 'buen_ojo', i: '💎', f: 'oficio', t: 'Buen ojo', d: 'Cada mineral tiene 15 % de salir doble' },
  { k: 'mano_verde', i: '🌱', f: 'oficio', t: 'Mano verde', d: 'Cada cosecha tiene 30 % de salir doble' },
  { k: 'buen_brazo', i: '⛏', f: 'oficio', t: 'Buen brazo', d: 'Pica y corta 15 % más rápido' },
  { k: 'cuidadoso', i: '🔧', f: 'oficio', t: 'Cuidadoso', d: 'Las herramientas se gastan 25 % menos' },
  { k: 'se_le_pega', i: '💰', f: 'oficio', t: 'Se le pega la plata', d: 'Asedios, plazas, nidos y la Ceniza pagan 25 % más colones' },
  { k: 'buena_mano', i: '🍲', f: 'oficio', t: 'Buena mano', d: 'La comida llena 15 % más y los platos duran la mitad más' },
];
const POR_K = Object.fromEntries(MANAS.map((m) => [m.k, m]));
export const NIVELES = [2, 4, 7, 10, 13, 17, 21, 26, 31, 37];

const escogidas = (g) => Object.keys((g.meta && g.meta.manas) || {});
export const ganadas = (g) => NIVELES.filter((n) => g.xpInfo.level >= n).length;
export const pendientes = (g) => (g.mode === 'survival' && g.meta ? Math.max(0, ganadas(g) - escogidas(g).length) : 0);
export const proximoNivel = (g) => NIVELES.find((n) => g.xpInfo.level < n) || null;

// una por familia mientras se pueda; se guarda para que salir y volver no cambie lo que se ofrece
function oferta(g) {
  const M = g.meta;
  if (M.manaOferta && M.manaOferta.every((k) => POR_K[k] && !(M.manas && M.manas[k]))) return M.manaOferta;
  const quedan = MANAS.filter((m) => !(M.manas && M.manas[m.k]));
  const saca = (lista) => (lista.length ? lista[Math.floor(Math.random() * lista.length)] : null);
  const elegidas = [];
  for (const f of Object.keys(FAMILIAS)) { const m = saca(quedan.filter((x) => x.f === f)); if (m) elegidas.push(m); }
  while (elegidas.length < 3 && elegidas.length < quedan.length) { const m = saca(quedan.filter((x) => !elegidas.includes(x))); if (m) elegidas.push(m); }
  M.manaOferta = elegidas.map((m) => m.k);
  return M.manaOferta;
}

export function escogerMana(g, k) {
  const m = POR_K[k];
  if (!m || pendientes(g) < 1 || !oferta(g).includes(k)) return false;
  (g.meta.manas ||= {})[k] = g.day || 1;
  g.meta.manaOferta = null;
  g.audio.play('nivel', { ui: true, vol: 0.5 });
  g.ui.toast(`${m.i} Maña nueva: ${m.t}. ${m.d}`, 4200);
  g.achieve('mana1', 'Agarró maña');
  if (escogidas(g).length >= 5) g.achieve('mana5', 'Con muchas mañas');
  if (escogidas(g).length >= NIVELES.length) g.achieve('mana10', 'Más mañas que un viejo');
  return true;
}

// la hoja de la libreta
export function manasHTML(g) {
  if (g.mode !== 'survival') return '<p class="lib-nada">Las mañas son del modo supervivencia.</p>';
  const faltan = pendientes(g), tengo = escogidas(g), sig = proximoNivel(g), lv = g.xpInfo.level;
  let h = '<div class="lib-scroll manas">';
  if (faltan) {
    h += `<h4 class="mana-tit">🌟 Escoja una maña${faltan > 1 ? ` <small>(tiene ${faltan} por escoger)</small>` : ''}</h4><div class="mana-oferta">`;
    oferta(g).forEach((k, n) => {
      const m = POR_K[k];
      h += `<button type="button" class="mana-carta f-${m.f}" data-mana="${k}" style="--n:${n}"><i>${m.i}</i><b>${m.t}</b><span>${m.d}</span><small>${FAMILIAS[m.f]}</small></button>`;
    });
    h += '</div><p class="mana-nota">Es para toda la partida: no se cambia.</p>';
  } else if (sig) {
    h += `<p class="mana-nota">Nivel ${lv}: la próxima maña se escoge en el nivel ${sig}.</p>`;
  } else {
    h += '<p class="mana-nota">Ya tiene todas las que se pueden agarrar en una partida.</p>';
  }
  h += `<h4 class="mana-tit">Sus mañas <small>(${tengo.length}/${NIVELES.length})</small></h4>`;
  if (!tengo.length) h += `<p class="lib-nada">Todavía ninguna. Se gana experiencia peleando, minando y avanzando en la historia.</p>`;
  else h += `<div class="mana-lista">${tengo.map((k) => { const m = POR_K[k]; return m ? `<div class="mana-mia f-${m.f}"><i>${m.i}</i><b>${m.t}</b><span>${m.d}</span></div>` : ''; }).join('')}</div>`;
  return `${h}${manasJefeHTML(g)}</div>`;
}

// ---------- cada segundo: la oferta se abre sola cuando uno está tranquilo ----------
const hayPelea = (g) => g.asedio || g.nocheLarga || g.apuro || g.ceniza || g.grieta || g.ventanilla || g.entities.mobs.some((m) => {
  if (m.dead || !(m.kind.hostile || m.kind.legend || m.kind.boss)) return false;
  const p = g.player.body.pos;
  return Math.hypot(m.body.pos.x - p.x, m.body.pos.z - p.z) < 32;
});
export function tickManas(g) {
  const faltan = pendientes(g);
  // Ojo de gato: cuánto aclarar según lo oscuro que esté (el cuadro lo va acercando)
  g.ojoMeta = 0;
  if (mana(g, 'ojo_de_gato') && g.dim !== undefined) {
    const p = g.player.body.pos;
    const enCueva = g.dim === 'tierra' && g.world.gen.column(Math.floor(p.x), Math.floor(p.z)).h - p.y > 6;
    g.ojoMeta = Math.max(enCueva ? 1 : 0, 1 - Math.min(1, (g.daylight ?? 1) * 1.6)) * 0.75;
  }
  if (!faltan) { g.manaAviso = 0; return; }
  const U = g.ui;
  const b = g.player.body;
  if (U.state !== 'playing' || !g.player.alive || g.sleeping || g.riding || g.parapente || g.zip || !b.onGround || b.inWater || hayPelea(g)) return;
  // se abre sola una vez por cada una; si uno la cierra sin escoger, solo se le recuerda cada tanto
  if ((g.meta.manaVista || 0) < ganadas(g)) {
    g.meta.manaVista = ganadas(g);
    g.manaAuto = true;
    U.openLibreta('manas');
    return;
  }
  g.manaAviso = (g.manaAviso || 0) + 1;
  if (g.manaAviso >= 240) { g.manaAviso = 0; U.toast('🌟 Tiene una maña por escoger: en la libreta, tecla U', 2800); }
}

// ---------- cada cuadro ----------
export function tickManasCuadro(g, dt) {
  if (g.ojoMeta !== undefined) {
    const a = g.ojoBrillo || 0, b = g.ojoMeta;
    if (Math.abs(a - b) > 0.002) g.ojoBrillo = a + (b - a) * Math.min(1, dt * 1.5);
  }
  tickTumba(g, dt);
}

// ---------- Hacha de monte: el árbol entero se viene abajo, de abajo para arriba ----------
const esTronco = (id) => BLOCKS[id] && BLOCKS[id].tool === 'axe' && /log|tronco/.test(BLOCKS[id].key);
const clave = (x, y, z) => `${x},${y},${z}`;
const CARAS = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
const MAX_TRONCO = 48, MAX_HOJAS = 90, RADIO = 5;

export function tumbarArbol(g, t) {
  if (g.tumba || g.mode !== 'survival' || !mana(g, 'hacha_monte')) return;
  const w = g.world, troncos = [], vistos = new Set([clave(t.x, t.y, t.z)]), cola = [[t.x, t.y + 1, t.z]];
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]) cola.push([t.x + dx, t.y + 1, t.z + dz]);
  while (cola.length && troncos.length < MAX_TRONCO) {
    const [x, y, z] = cola.shift(), c = clave(x, y, z);
    if (vistos.has(c)) continue;
    vistos.add(c);
    if (y < t.y || Math.hypot(x - t.x, z - t.z) > RADIO || !esTronco(w.getBlock(x, y, z))) continue;
    troncos.push({ x, y, z });
    for (const [dx, dy, dz] of CARAS) cola.push([x + dx, y + dy, z + dz]);
    for (const [dx, dz] of [[1, 1], [-1, -1], [1, -1], [-1, 1]]) cola.push([x + dx, y + 1, z + dz]);
  }
  if (!troncos.length) return;
  // un árbol tiene copa: así no se le viene abajo un horcón de la casa
  const hojas = [], cola2 = [], vistas = new Set();
  for (const q of troncos) for (const [dx, dy, dz] of CARAS) cola2.push([q.x + dx, q.y + dy, q.z + dz, 0]);
  while (cola2.length && hojas.length < MAX_HOJAS) {
    const [x, y, z, n] = cola2.shift(), c = clave(x, y, z);
    if (vistas.has(c)) continue;
    vistas.add(c);
    const b = BLOCKS[w.getBlock(x, y, z)];
    if (!b || !b.leafy || n > 4) continue;
    hojas.push({ x, y, z });
    for (const [dx, dy, dz] of CARAS) cola2.push([x + dx, y + dy, z + dz, n + 1]);
  }
  if (hojas.length < 3) return;
  troncos.sort((a, b) => a.y - b.y);
  g.tumba = { lista: [...troncos, ...hojas], i: 0, t: 0, n: 0, w };
  g.achieve('tumbar_arbol', 'Hacha de monte');
}
function tickTumba(g, dt) {
  const T = g.tumba;
  if (!T) return;
  if (T.w !== g.world) { g.tumba = null; return; }
  T.t -= dt;
  if (T.t > 0) return;
  T.t = 0.035;
  const w = g.world;
  for (let k = 0; k < 2 && T.i < T.lista.length; k++) {
    const q = T.lista[T.i++], id = w.getBlock(q.x, q.y, q.z), b = BLOCKS[id];
    if (!b || !(b.leafy || esTronco(id))) continue;
    w.setBlock(q.x, q.y, q.z, AIR);
    g.particles.blockBreak(q.x, q.y, q.z, id);
    if (T.i % 3 === 0) g.audio.material(b.sound, 'break', { x: q.x + 0.5, y: q.y + 0.5, z: q.z + 0.5 });
    g.dropFromBlock(id, q.x, q.y, q.z);
    if (!b.leafy) {
      gainSkill(g, 'tala', 1);
      const held = g.heldDef();
      if (++T.n % 3 === 0 && held && held.tool === 'axe' && g.inventory.wearHeld()) { g.audio.play('toolbreak'); g.ui.toast('¡Se rompió la herramienta!'); T.i = T.lista.length; }
    }
  }
  if (T.i >= T.lista.length) g.tumba = null;
}
