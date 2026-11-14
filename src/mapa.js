// Mapa del mundo: se pinta desde el generador (bioma, altura y agua) en baldosas de 64 px que se guardan,
// con sombreado de relieve. Marcadores: jugador, cama/aparición, pueblos (los visitados resaltados).
import { roadsNear } from './carreteras.js';
import { SEA } from './worldgen.js';
import { villageAt, CELL as VILLAGE_CELL } from './pueblogen.js';
import { structuresNear } from './estructuras.js';
import { marcaHistoria } from './historia.js';
import { todosBolsos } from './supervivencia.js';

const BIOME_COL = {
  plains: [124, 184, 74], forest: [74, 138, 52], jungle: [46, 122, 42], desert: [224, 200, 136], beach: [232, 216, 160],
  snowy: [236, 242, 246], paramo: [168, 150, 90], mountains: [150, 150, 150], volcano: [80, 64, 58], nuboso: [62, 122, 90], manglar: [74, 106, 58], bosque_seco: [168, 160, 80],
};
const TILE = 64;
const cache = new Map();

function colorAt(gen, x, z) {
  const c = gen.column(x, z);
  if (c.biome === 'cielo') return c.island ? [110, 180, 90] : [220, 228, 238];
  if (c.biome === 'inframundo') {
    if (c.lavaSea) return [230, 90, 20];
    const v = Math.max(0.6, Math.min(1.3, 0.8 + (c.floor - 40) * 0.02));
    return [70 * v, 52 * v, 50 * v];
  }
  if (c.h < SEA) {
    const depth = Math.min(1, (SEA - c.h) / 22);
    return [30 + 40 * (1 - depth), 70 + 70 * (1 - depth), 140 + 70 * (1 - depth)];
  }
  let col = BIOME_COL[c.biome] || BIOME_COL.plains;
  if (c.biome === 'mountains' && c.h > 104) col = [240, 244, 248];
  if (c.biome === 'volcano' && c.lavaTop) col = [220, 80, 20];
  if (c.acidTop) col = [60, 200, 180];
  else if (c.biome === 'volcano' && c.volcanoK > 0.82) col = [34, 26, 40];
  // relieve: más claro hacia el noroeste
  const n = gen.column(x - 2, z - 2).h;
  const shade = Math.max(0.7, Math.min(1.25, 1 + (c.h - n) * 0.05));
  return col.map((v) => Math.min(255, v * shade));
}

function tile(gen, scale, tx, tz) {
  const key = `${gen.seed}:${gen.version}:${gen.tipo || 'normal'}:${scale}:${tx}:${tz}`;
  if (cache.has(key)) return cache.get(key);
  const cv = document.createElement('canvas');
  cv.width = cv.height = TILE;
  const ctx = cv.getContext('2d');
  const img = ctx.createImageData(TILE, TILE);
  for (let j = 0; j < TILE; j++) for (let i = 0; i < TILE; i++) {
    const c = colorAt(gen, (tx * TILE + i) * scale, (tz * TILE + j) * scale);
    const o = (j * TILE + i) * 4;
    img.data[o] = c[0]; img.data[o + 1] = c[1]; img.data[o + 2] = c[2]; img.data[o + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  cache.set(key, cv);
  if (cache.size > 400) cache.delete(cache.keys().next().value);
  return cv;
}

// Dibuja el mapa en el canvas; `budget` = baldosas nuevas por llamada (lo demás sale del caché).
// Devuelve true si quedó completo.
// sinEtiquetas: para el minimapa (solo los puntos, sin los nombres)
let SIN_ETIQUETAS = false;
// v11.13.3: las capas de la leyenda (se pueden esconder) y cuántos marcadores hay de cada una en la vista
export const CAPAS_MAPA = [
  { id: 'pueblos', nombre: 'Pueblos', color: '#ffd84a' },
  { id: 'naturaleza', nombre: 'Naturaleza', color: '#6ee59a' },
  { id: 'lugares', nombre: 'Lugares', color: '#7ad0ff' },
  { id: 'misiones', nombre: 'Misiones', color: '#ffb040' },
  { id: 'suyo', nombre: 'Lo suyo', color: '#ff7aa8' },
];
const NATURALEZA = new Set(['mirador_poas', 'mirador_arenal', 'cumbre', 'refugio', 'tarcoles', 'guanacaste', 'catarata', 'puente_colgante', 'irazu', 'rincon_vieja', 'barra_honda', 'amistad', 'marino_ballena', 'corcovado', 'manuel_antonio', 'tortuguero', 'cahuita', 'tenorio', 'monteverde', 'palo_verde', 'isla_coco', 'conchal', 'turrialba', 'cerro_muerte', 'braulio', 'juan_castro', 'carara', 'canopy', 'caverna_rey', 'catarata_escondida', 'amistad_parque', 'rincon_parque']);
let CAPA = null, OCULTAS = new Set(), CUENTA = {};
export const cuentaMapa = () => CUENTA;
export function drawMap(canvas, game, scale, budget = 6, opts = {}) {
  SIN_ETIQUETAS = !!opts.sinEtiquetas;
  OCULTAS = opts.ocultas || new Set(); CUENTA = {}; CAPA = null;
  const g = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const gen = game.world.gen;
  const pl = game.player.body.pos, p = opts.centro || pl; // el centro: uno, o adonde se haya arrastrado el mapa
  const cx = p.x / scale, cz = p.z / scale; // centro en píxeles del mapa
  g.fillStyle = '#1a1612'; g.fillRect(0, 0, W, H);
  const tx0 = Math.floor((cx - W / 2) / TILE), tx1 = Math.floor((cx + W / 2) / TILE);
  const tz0 = Math.floor((cz - H / 2) / TILE), tz1 = Math.floor((cz + H / 2) / TILE);
  let done = true, made = 0;
  g.imageSmoothingEnabled = false;
  for (let tz = tz0; tz <= tz1; tz++) for (let tx = tx0; tx <= tx1; tx++) {
    const key = `${gen.seed}:${gen.version}:${gen.tipo || 'normal'}:${scale}:${tx}:${tz}`;
    if (!cache.has(key) && made >= budget) { done = false; continue; }
    if (!cache.has(key)) made++;
    g.drawImage(tile(gen, scale, tx, tz), Math.round(tx * TILE - cx + W / 2), Math.round(tz * TILE - cz + H / 2));
  }
  const toScreen = (x, z) => [(x / scale - cx) + W / 2, (z / scale - cz) + H / 2];
  // carreteras (v6)
  if (gen.version >= 6 && game.dim === 'tierra') {
    for (const seg of roadsNear(gen, p.x, p.z, (Math.max(W, H) / 2) * scale)) {
      g.strokeStyle = seg.kind === 'nacional' ? '#e8d070' : seg.kind === 'cantonal' ? '#c8c0b0' : '#a08860';
      g.lineWidth = seg.kind === 'nacional' ? 3 : 2;
      g.beginPath();
      for (let i = 0; i < seg.n; i += 4) { const [sx, sy] = toScreen(seg.xs[i], seg.zs[i]); if (i) g.lineTo(sx, sy); else g.moveTo(sx, sy); }
      g.stroke();
    }
  }
  // los pueblos y los lugares del mapa van primero a una lista: al alejar se agrupan (un número por grupo) y solo los 8 más cercanos llevan nombre
  const pts = [];
  const punto = (x, z, color, largo, corto, cat) => { const [sx, sy] = toScreen(x, z); if (sx < -20 || sy < -20 || sx > W + 20 || sy > H + 20) return; pts.push({ sx, sy, wx: x / scale, wz: z / scale, color, largo, corto, cat, d: Math.hypot(x - p.x, z - p.z) }); };
  // pueblos
  if (gen.version >= 3 && game.dim === 'tierra') {
    const r = (Math.max(W, H) / 2) * scale;
    const vx0 = Math.floor((p.x - r) / VILLAGE_CELL), vx1 = Math.floor((p.x + r) / VILLAGE_CELL);
    const vz0 = Math.floor((p.z - r) / VILLAGE_CELL), vz1 = Math.floor((p.z + r) / VILLAGE_CELL);
    for (let vz = vz0; vz <= vz1; vz++) for (let vx = vx0; vx <= vx1; vx++) {
      const v = villageAt(gen, vx, vz);
      if (!v) continue;
      const known = game.meta.villages && game.meta.villages[v.id], ic = v.city ? '🏙' : '⛪';
      punto(v.x, v.z, known ? '#ffd84a' : '#d8c8a0', known ? `${ic} ${v.name || 'Pueblo'}` : ic, ic, 'pueblos');
    }
  }
  // monumentos ticos
  if (gen.version >= 5 && game.dim === 'tierra') {
    const icons = { faro: '🗼 Faro', churchill: '🍧 Churchill', caldera: '⚓ Caldera', fortin: '🏰 Fortín', carreta: '🐂', casita_bahareque: '🏡', estatua: '🗿', fuente: '⛲', capital: '🏙 San José', mirador_poas: '🌋 Poás', mirador_arenal: '🌋 Arenal', cumbre: '⛰ Chirripó', refugio: '🏠 Crestones', basilica: '⛪ Basílica', ruinas: '🏛 Ruinas', orosi: '⛪ Orosi', tarcoles: '🐊 Tárcoles', guanacaste: '🌳 Guanacaste', estadio_nacional: '🏟 Estadio Nacional', estadio_obra: '🚧 Estadio', estacion: '🚂 Estación', monumento_nacional: '🗽 Monumento', templo_musica: '🎼 Templo', playa_lujo: '🏝 Playa de lujo', refineria: '🛢 Refinería', sanatorio: '🏚 Sanatorio', metalico: '🏫 Metálico', correos: '📮 Correos', museo_ninos: '🏰 Museo', grecia: '⛪ Grecia', coronado: '⛪ Coronado', ujarras: '🏛 Ujarrás', santa_rosa: '🏠 Santa Rosa', esferas: '⚪ Esferas', aduana: '🏭 Aduana', beneficio: '☕ Beneficio', trapiche: '🍬 Trapiche', hacienda: '🐄 Hacienda', bananera: '🍌 Bananera', catarata: '💧 Catarata', puente_colgante: '🌉 Puente colgante', irazu: '🌋 Irazú', rincon_vieja: '♨ Rincón de la Vieja', barra_honda: '🕳 Barra Honda', amistad: '🌉 La Amistad', marino_ballena: '🐋 Marino Ballena', corcovado: '🦜 Corcovado', manuel_antonio: '🐒 Manuel Antonio', tortuguero: '🐢 Tortuguero', cahuita: '🐠 Cahuita', tenorio: '💙 Río Celeste', monteverde: '☁ Monteverde', palo_verde: '🦩 Palo Verde', isla_coco: '🏝 Isla del Coco', feria: '🥬 Feria', cementerio: '✝ Cementerio', muelle_limon: '⚓ Limón', zapote: '🎡 Zapote', aeropuerto: '✈ Aeropuerto', zurqui: '🚇 Zurquí', cerro_muerte: '🏔 Cerro de la Muerte', conchal: '🐚 Conchal', turrialba: '🌋 Turrialba', san_lucas: '⛓ San Lucas', braulio: '🌿 Braulio Carrillo', juan_castro: '💧 Juan Castro', carara: '🦜 Carara', canopy: '🪢 Canopy', sitio_arqueologico: '🗿 Sitio arqueológico', caverna_rey: '🦇 Caverna del Rey', templo_hundido: '🏛 Templo hundido', catarata_escondida: '💧 Catarata escondida', amistad_parque: '🌳 La Amistad', rincon_parque: '♨ Las Pailas', feria_pueblo: '🥬', cementerio_pueblo: '✝', cacaotal: '🍫 Cacaotal', lecheria: '🥛 Lechería' };
    for (const s of structuresNear(gen, p.x, p.z, (Math.max(W, H) / 2) * scale)) {
      const t = icons[s.type] || '', nat = NATURALEZA.has(s.type);
      punto(s.x, s.z, nat ? '#6ee59a' : '#7ad0ff', t, t.split(' ')[0], nat ? 'naturaleza' : 'lugares');
    }
  }
  pintarPuntos(g, pts, SIN_ETIQUETAS ? 0 : ({ 2: 28, 4: 48, 8: 72, 16: 96 }[scale] || 0));
  // el punto marcado con B y lo propio
  CAPA = 'suyo';
  if (game.meta.hist && game.meta.hist.casa && game.dim === 'tierra') { const [cx, cy] = toScreen(game.meta.hist.casa.x, game.meta.hist.casa.z); marker(g, cx, cy, '#e8b840', '🏡 Casa de la abuela'); }
  { const mh = game.dim === 'tierra' ? marcaHistoria(game) : null; if (mh) { const [hx, hy] = toScreen(mh.x, mh.z); marker(g, hx, hy, '#ffe680', '📖 Historia'); } }
  CAPA = 'misiones';
  { const R = game.meta.escondites; if (R && !R.fin && R.x != null && game.dim === 'tierra') { const [ex, ey] = toScreen(R.x, R.z); marker(g, ex, ey, '#d8b040', '📦 Escondite'); } }
  if (game.meta.rigo && game.meta.rigo.pos && game.dim === 'tierra') { const [mx, my] = toScreen(game.meta.rigo.pos.x, game.meta.rigo.pos.z); marker(g, mx, my, '#c8a050', '🧳 Maletín'); }
  if (game.meta.nidos && game.dim === 'tierra') for (const q of game.meta.nidos) { const [nx, ny] = toScreen(q.x, q.z); marker(g, nx, ny, '#7a3fae', '🕸 Nido'); }
  if (game.meta.tesoro && game.dim === 'tierra') { const [tx, ty] = toScreen(game.meta.tesoro.x, game.meta.tesoro.z); marker(g, tx, ty, '#e02020', '❌ Tesoro'); }
  if (game.meta.historia && game.meta.historia.pos && game.dim === 'tierra') { const [hx, hy] = toScreen(game.meta.historia.pos.x, game.meta.historia.pos.z); marker(g, hx, hy, '#ffc040', '❗ Historia'); }
  if (game.meta.tour && game.dim === 'tierra') { const [ux, uy] = toScreen(game.meta.tour.pos.x, game.meta.tour.pos.z); marker(g, ux, uy, '#60e0a0', `🏕 ${game.meta.tour.nombre}`); }
  CAPA = 'suyo';
  if (game.meta.marcadores && game.dim === 'tierra') for (const mk of game.meta.marcadores) { const [ax, ay] = toScreen(mk.x, mk.z); marker(g, ax, ay, '#ffd060', `🔖 ${mk.n}`); }
  // lo nuevo: la Grieta, el Archivo, la escritura, la audiencia, los encargos y quien pide auxilio
  if (game.dim === 'tierra') {
    const M = game.meta, L = [];
    if (M.anselmo && M.anselmo.pos && M.anselmo.fase >= 2) L.push([M.anselmo.pos, '#c04060', M.anselmo.fase >= 5 ? '🚬 La Grieta (cerrada)' : '🚬 La Grieta']);
    if (M.archivo && (M.archivo.boca || M.archivo.pos)) L.push([M.archivo.boca || M.archivo.pos, '#a0a0c0', M.archivo.fase >= 5 ? '📁 Archivo (cerrado)' : '📁 Archivo Municipal']);
    if (M.expediente && M.expediente.fase === 1 && M.expediente.pos && !M.expediente.esc) L.push([M.expediente.pos, '#d8b060', '📜 Marca vieja']);
    if (M.expediente && M.expediente.fase === 2 && M.expediente.plaza) L.push([M.expediente.plaza, '#d8b060', '📋 Audiencia']);
    if (M.gente) for (const P of Object.values(M.gente.p || {})) if (P.enc && !P.enc.hecho && P.enc.pos) L.push([P.enc.pos, '#e0a040', '📌 Encargo']);
    if (game.rescate && !game.rescate.listo) L.push([game.rescate.pos, '#ff5050', '🆘 Auxilio']);
    if (game.quema && game.quema.centro) L.push([game.quema.centro, '#ff7030', '🔥 Quema']);
    if (game.asalto) L.push([{ x: game.asalto.x, z: game.asalto.z }, '#e04040', '🏪 Asalto']);
    if (game.marabunta) L.push([{ x: game.marabunta.x, z: game.marabunta.z }, '#a04020', '🐜 Marabunta']);
    CAPA = 'misiones';
    for (const [q, c, t] of L) { const [x, y] = toScreen(q.x, q.z); marker(g, x, y, c, t); }
    CAPA = 'suyo';
  }
  if (game.meta.marca && game.dim === 'tierra') { const [mx, my] = toScreen(game.meta.marca.x, game.meta.marca.z); marker(g, mx, my, '#ff4060', '📍 Marca'); }
  // el bolso que quedó al morir
  if (game.dim === 'tierra') for (const q of todosBolsos(game)) if (q && (q.dim || 'tierra') === 'tierra') { const [bx, by] = toScreen(q.x, q.z); marker(g, bx, by, '#ff6a40', '🎒 Sus cosas'); }
  // las ermitas de camino (ermitas.js)
  if (game.dim === 'tierra') for (const e of game.meta.ermitas || []) { const [ex, ey] = toScreen(e.x, e.z); marker(g, ex, ey, '#e8e8f0', `⛪ ${e.nombre}`); }
  // el lote propio
  if (game.meta.lote && game.dim === 'tierra') { const [lx, ly] = toScreen(game.meta.lote.x, game.meta.lote.z); marker(g, lx, ly, '#ffd060', '🏠'); }
  // aparición / cama
  if (game.meta.spawn && game.dim !== 'inframundo') { const [sx, sy] = toScreen(game.meta.spawn.x, game.meta.spawn.z); marker(g, sx, sy, '#ff7aa8', '🛏'); }
  CAPA = null;
  // jugador: flecha según hacia dónde mira
  const [px, py] = toScreen(pl.x, pl.z);
  const yaw = game.player.yaw;
  g.save(); g.translate(px, py); g.rotate(-yaw);
  g.fillStyle = '#fff'; g.strokeStyle = '#000'; g.lineWidth = 2;
  g.beginPath(); g.moveTo(0, -9); g.lineTo(6, 7); g.lineTo(0, 3); g.lineTo(-6, 7); g.closePath(); g.fill(); g.stroke();
  g.restore();
  return done;
}

// los puntos de pueblos y lugares: los escondidos no se pintan; al alejar, los cercanos entre sí se juntan en un círculo con el número
// celda: el lado (en píxeles del mapa) de la rejilla que junta; la rejilla va pegada al mundo, así los grupos no saltan al arrastrar
function pintarPuntos(g, pts, celda) {
  pts.sort((a, b) => a.d - b.d);
  const grupos = [], porCelda = new Map();
  for (const q of pts) {
    CUENTA[q.cat] = (CUENTA[q.cat] || 0) + 1;
    if (OCULTAS.has(q.cat)) continue;
    const k = celda ? `${Math.floor(q.wx / celda)},${Math.floor(q.wz / celda)}` : null, gr = k && porCelda.get(k);
    if (gr) { gr.n++; gr.cats[q.cat] = (gr.cats[q.cat] || 0) + 1; gr.mx += q.sx; gr.my += q.sy; continue; }
    const nuevo = { ...q, n: 1, cats: { [q.cat]: 1 }, mx: q.sx, my: q.sy };
    grupos.push(nuevo); if (k) porCelda.set(k, nuevo);
  }
  for (const o of grupos) if (o.n > 1) { o.sx = o.mx / o.n; o.sy = o.my / o.n; }
  let rango = 0;
  for (const o of grupos) {
    if (o.n === 1) { marker(g, o.sx, o.sy, o.color, rango++ < 8 ? o.largo : o.corto); continue; }
    const cat = Object.entries(o.cats).sort((a, b) => b[1] - a[1])[0][0], c = CAPAS_MAPA.find((k) => k.id === cat), r = o.n > 99 ? 13 : o.n > 9 ? 11 : 9;
    g.fillStyle = c ? c.color : '#7ad0ff'; g.strokeStyle = '#000'; g.lineWidth = 2;
    g.beginPath(); g.arc(o.sx, o.sy, r, 0, Math.PI * 2); g.fill(); g.stroke();
    g.fillStyle = '#06121c'; g.font = '700 11px "Segoe UI Variable", "Segoe UI", system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(String(o.n), o.sx, o.sy + 0.5); g.textAlign = 'start'; g.textBaseline = 'alphabetic';
  }
}

function marker(g, x, y, color, label) {
  if (CAPA) { CUENTA[CAPA] = (CUENTA[CAPA] || 0) + 1; if (OCULTAS.has(CAPA)) return; }
  g.fillStyle = color; g.strokeStyle = '#000'; g.lineWidth = 2;
  g.beginPath(); g.arc(x, y, 5, 0, Math.PI * 2); g.fill(); g.stroke();
  if (label && !SIN_ETIQUETAS) { g.font = '600 12px "Segoe UI Variable", "Segoe UI", system-ui, sans-serif'; g.lineWidth = 3; g.strokeText(label, x + 8, y + 5); g.fillStyle = '#fff'; g.fillText(label, x + 8, y + 5); }
}
