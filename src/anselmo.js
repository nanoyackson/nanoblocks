// Los cigarros de Anselmo: la trama que corre por debajo de las cartas. Junto a cada pedazo del Corazón aparece una página de una libreta
// vieja: el abuelo que «se fue a comprar cigarros» en el 62 se metió a tapar la grieta de donde salen las Sombras. Después del final, Doña
// Eulalia entrega la carta que Zenaida no quería dar, y uno sube a la Grieta con un plato de gallo pinto. Al fondo hay que soltarlo, y lo que
// él tenía tapado sale todo junto: oleadas y El Olvido. Al final vuelve a la casa, y el tío Rigo por fin le pregunta por los cigarros.
// El estado vive en meta.anselmo; la pelea, en g.grieta (no se guarda: si uno se va o se muere, se habla con él otra vez).
import { BLOCK_BY_KEY as K, BLOCKS, SOLID, FLUID, AIR } from './blocks.js';
import { SEA } from './worldgen.js';
import { decir } from './misiones.js';
import { anotar } from './diario.js';
import { entregarCarta } from './historia.js';
import { puestoSombra } from './asedio.js';
import { difOf } from './supervivencia.js';
import { anilloAviso } from './golpes.js';
import { sitioLibre } from './encargos.js';

export const CIGARROS = 510;
const PINTO = 263, COLON = 360, ESENCIA = 499, ANCHO = 9, FONDO = 7, NOM = 'Don Anselmo';
const PAGINAS = { tierra: 17, agua: 18, fuego: 19, cielo: 20 };
export const CARTA_ZENAIDA = 21, CARTA_ANSELMO = 22;
const FONDO_GRIETA = 24, R_POZO = 5.5, R_SALA = 10;

// ---------- lo que sale en pantalla ----------
const estado = (g) => (g.meta.anselmo ||= { fase: 0, paginas: {} });
export function marcaAnselmo(g) {
  const A = g.meta && g.meta.anselmo, H = g.meta && g.meta.hist;
  if (!A || !H || !H.fin) return null;
  if (A.fase === 1) return H.eulaliaPos || H.pueblo || null;
  if (A.fase >= 2 && A.fase <= 4) return A.pos;
  return null;
}
export function objetivoAnselmo(g) {
  const A = g.meta && g.meta.anselmo, H = g.meta && g.meta.hist;
  if (!A || !H || !H.fin) return null;
  const r = '🚬 Los cigarros de Anselmo';
  if (A.fase === 1) return { rotulo: r, texto: 'Doña Eulalia quiere hablar con usted, y dice que no es para chismear (📖 en la brújula)' };
  if (A.fase === 2) return { rotulo: r, texto: `Suba a la Grieta (📖 en la brújula) con un gallo pinto${g.inventory.count(PINTO) ? '' : ': no anda ninguno'}. Lleve comida, vendas y luz` };
  if (A.fase === 3) return { rotulo: r, texto: `Baje al fondo de la Grieta y déle el gallo pinto a quien está ahí${g.inventory.count(PINTO) ? '' : ' (no anda ninguno)'}` };
  if (A.fase === 4) return { rotulo: r, texto: g.grieta ? '¡Aguante! Todo lo que él tenía tapado está saliendo' : 'Hable con él en el fondo de la Grieta cuando guste: al soltar, sale todo junto' };
  if (A.fase === 5 && !A.escena) return { rotulo: r, texto: 'Don Anselmo y el tío Rigo tienen algo pendiente: esté en la casa de día cuando llegue Rigo' };
  return null;
}

// ---------- las veces que se habla de esto antes del final ----------
export function rigoAnselmo(g) {
  const H = g.meta.hist, A = g.meta.anselmo;
  if (!A || !H || !H.cartas || A.fase >= 5) return false; // con él sentado ahí, ya no hay nada que contar
  if (H.cartas.includes(18) && !A.r1) {
    A.r1 = true;
    g.ui.dialog('Tío Rigo', '¿De dónde sacó esa libreta? …Esa es la letra de mi papá. Se fue a comprar cigarros en el 62, cuando yo tenía seis años. Mi mamá nunca dijo nada, y yo nunca pregunté. Bueno. ¿Le vendo algo?', 8000);
    return true;
  }
  if (H.cartas.includes(20) && !A.r2) {
    A.r2 = true;
    g.ui.dialog('Tío Rigo', '¿Que él no fumaba? Eso ya lo sabía, mi cepa. Uno de güila se da cuenta. Y ella, todos los domingos, salía con un plato tapado y volvía de noche. Yo me fui a vender seguros para no preguntar. Un seguro es eso: pagar para no pensar.', 9500);
    return true;
  }
  return false;
}
export function eulaliaAnselmo(g) {
  const H = g.meta.hist, A = estado(g);
  if (A.fase === 1) {
    A.fase = 2;
    if (!A.pos) A.pos = buscarSitio(g, H);
    g.ui.dialog('Doña Eulalia', 'Siéntese, y coma algo primero. Zenaida me hizo jurar que le daba esto solo si usted amanecía con el Corazón entero. Todos los domingos salía con un plato. Yo sé a dónde. Tome: ahí va todo.', 8000);
    entregarCarta(g, CARTA_ZENAIDA, true);
    anotar(g, 'Mi abuelo no se fue a comprar cigarros. Está en la Grieta.', '🚬');
    return true;
  }
  if (!H.fin && H.cartas && H.cartas.includes(19) && !A.e1) {
    A.e1 = true;
    g.ui.dialog('Doña Eulalia', '¿De dónde sacó esa libreta? No, no me la enseñe. Guárdela, y cuando amanezca con el Corazón entero, venga a verme. Yo juré una cosa, y a Zenaida no se le falla ni después de muerta.', 7500);
    return true;
  }
  return false;
}

// ---------- la Grieta ----------
function buscarSitio(g, H, cerca) {
  const gen = g.world.gen, base = cerca ? g.player.body.pos : H.casa || g.player.body.pos;
  for (const [rMin, rMax, tol] of cerca ? [[28, 60, 5], [28, 90, 9]] : [[240, 420, 3], [200, 560, 5], [160, 800, 8]]) {
    for (let t = 0; t < 240; t++) {
      const a = Math.random() * Math.PI * 2, r = rMin + Math.random() * (rMax - rMin);
      const x = Math.floor(base.x + Math.cos(a) * r), z = Math.floor(base.z + Math.sin(a) * r), c = gen.column(x, z);
      if (c.h <= SEA + 3 || c.h > 100 || ['ocean', 'beach', 'manglar', 'volcano'].includes(c.biome)) continue;
      let plano = true;
      for (let dx = -9; dx <= 9 && plano; dx += 3) for (let dz = -9; dz <= 9; dz += 3) { const q = gen.column(x + dx, z + dz).h; if (Math.abs(q - c.h) > tol || q <= SEA) { plano = false; break; } }
      if (!plano) continue;
      if (!sitioLibre(g, x, z, 13)) continue;
      return { x, y: c.h, z };
    }
  }
  const x = Math.floor(base.x) + 300, z = Math.floor(base.z);
  return { x, y: Math.max(gen.column(x, z).h, SEA + 4), z };
}
const piso = (A) => Math.max(14, A.y - FONDO_GRIETA);
function obra(g, A) {
  // la boca queda a la altura del lado más bajo del terreno, y por ahí mismo empieza la escalera
  const gen = g.world.gen;
  let bajo = Infinity, a0 = 0;
  for (let i = 0; i < 16; i++) {
    const an = (i / 16) * Math.PI * 2, h = gen.column(Math.round(A.x + Math.cos(an) * 7), Math.round(A.z + Math.sin(an) * 7)).h;
    if (h < bajo) { bajo = h; a0 = an; }
  }
  A.y = bajo;
  const L = [], { x: cx, z: cz, y: top } = A, base = piso(A);
  const put = (x, y, z, id) => L.push([x, y, z, id]);
  // el pozo: de arriba para abajo, con las paredes selladas por si atraviesa una cueva o agua
  for (let y = top + 8; y > base + 6; y--) for (let dx = -8; dx <= 8; dx++) for (let dz = -8; dz <= 8; dz++) {
    const d = Math.hypot(dx, dz);
    if (y > top) { if (d <= 7.5) put(cx + dx, y, cz + dz, AIR); } else if (d <= R_POZO) put(cx + dx, y, cz + dz, AIR);
    else if (d <= 7 && y < gen.column(cx + dx, cz + dz).h) put(cx + dx, y, cz + dz, 'sello');
  }
  // la boca: un brocal negro
  for (let dx = -9; dx <= 9; dx++) for (let dz = -9; dz <= 9; dz++) { const d = Math.hypot(dx, dz); if (d > R_POZO && d <= 8.5) put(cx + dx, d <= 7.5 ? top : gen.column(cx + dx, cz + dz).h, cz + dz, K.basalt); }
  // la sala
  for (let y = base; y <= base + 7; y++) for (let dx = -12; dx <= 12; dx++) for (let dz = -12; dz <= 12; dz++) {
    const d = Math.hypot(dx, dz), hueco = y > base && y <= base + 6 && d <= (y > base + 4 ? R_SALA - 2 : R_SALA);
    if (hueco) put(cx + dx, y, cz + dz, AIR);
    else if (y === base && d <= 11.5) put(cx + dx, y, cz + dz, K.basalt);
    else if (y === base + 7 && d <= R_POZO) put(cx + dx, y, cz + dz, AIR);
    else if (d <= 11.5) put(cx + dx, y, cz + dz, 'sello');
  }
  // el pozo de agua al centro: el que se tira, no se mata
  for (const y of [base - 1, base - 2]) for (let dx = -3; dx <= 3; dx++) for (let dz = -3; dz <= 3; dz++) put(cx + dx, y, cz + dz, K.basalt);
  for (const y of [base, base - 1]) for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) if (Math.hypot(dx, dz) <= 2.3) put(cx + dx, y, cz + dz, K.water);
  // la escalera de caracol, pegada a la pared: una cinta sin huecos, con baranda por dentro (con portillos, para el que quiera tirarse al agua)
  let n = 0;
  for (let t = 0; ; t += 0.1) {
    const a = a0 + t * 0.3, y = top - Math.floor(t * 0.42);
    if (y <= base + 1) break;
    for (const r of [3.6, 4.2, 4.8, 5.4, 5.8]) put(cx + Math.round(Math.cos(a) * r), y, cz + Math.round(Math.sin(a) * r), K.cobble);
    n++;
    if (n % 170 === 0) put(cx + Math.round(Math.cos(a) * 5.8), y + 1, cz + Math.round(Math.sin(a) * 5.8), K.torch);
    else if (K.cerca && n % 90 > 12) put(cx + Math.round(Math.cos(a) * 3), y + 1, cz + Math.round(Math.sin(a) * 3), K.cerca);
  }
  return L;
}
function cerrarObra(g, Q, A) {
  const w = g.world, base = piso(Q);
  // los platos, los cigarros y la placa
  const px = Q.x + 8, pz = Q.z;
  w.setBlock(px, base + 1, pz, K.placa);
  w.setBE(px, base + 1, pz, { title: 'Los platos', text: 'Más de dos mil platos de peltre, lavados y apilados contra la pared. Alguien los lavaba.' });
  const cx = Q.x - 8, cz = Q.z;
  w.setBlock(cx, base + 1, cz, K.chest);
  g.stations.placed(K.chest, cx, base + 1, cz, 0);
  const be = w.getBE(cx, base + 1, cz);
  if (be && be.slots) {
    [[CIGARROS, 1], [COLON, 60], [ESENCIA, 4], [PINTO, 2]].forEach(([id, count], i) => { be.slots[i] = { id, count }; });
    w.touchBE(cx, base + 1, cz);
  }
  for (const [dx, dz] of [[6, 6], [-6, 6], [6, -6], [-6, -6]]) w.setBlock(Q.x + dx, base + 1, Q.z + dz, K.fogata || K.torch);
  for (let i = 0; i < 14; i++) {
    const a = Math.random() * Math.PI * 2, r = 7 + Math.random() * 1.5, x = Math.round(Q.x + Math.cos(a) * r), z = Math.round(Q.z + Math.sin(a) * r);
    if (SOLID[w.getBlock(x, Q.y, z)] && w.getBlock(x, Q.y + 1, z) === AIR && K.nido_raiz) w.setBlock(x, Q.y + 1, z, K.nido_raiz);
  }
  A.construida = true;
}
function tickObra(g, A) {
  const T = g.grietaObra;
  if (!T || !A.pos) return;
  const w = g.world;
  if (T.w !== w) { g.grietaObra = null; return; }
  for (let k = 0; k < 260 && T.i < T.L.length; k++) {
    const [x, y, z, id] = T.L[T.i++];
    if (id === 'sello') {
      const b = w.getBlock(x, y, z);
      if (!SOLID[b] || FLUID[b] || BLOCKS[b].leafy) w.setBlock(x, y, z, K.basalt, { updates: false });
    } else if (w.getBlock(x, y, z) !== id) w.setBlock(x, y, z, id, { updates: false }); // si no, la arena de la orilla tapa la escalera
  }
  if (T.i >= T.L.length) { g.grietaObra = null; cerrarObra(g, A.pos, A); }
}

// ---------- él ----------
const AQUI = (m) => m && !m.dead && m.data && m.data.anselmo;
function sombrear(m, oscuro) {
  m.group.traverse((o) => {
    if (!o.material || !o.material.color) return;
    if (!o.userData.colorOrig) { const b = o.material.userData.baseColor; o.userData.colorOrig = (b && b.isColor ? b : o.material.color).clone(); o.material = o.material.clone(); }
    o.material.color.copy(o.userData.colorOrig);
    if (oscuro) o.material.color.multiplyScalar(0.2);
    o.material.userData.baseColor = o.material.color.clone(); // tintModel parte de aquí
  });
}
function ponerlo(g, x, y, z, enCasa) {
  const m = g.entities.spawnMob('vecino', x + 0.5, y + 0.2, z + 0.5);
  if (!m) return null;
  const here = { x, y, z };
  Object.assign(m.data, { home: here, plaza: { ...here }, name: NOM, role: 'vecino', vid: 'hist:anselmo', seed: 19362, anselmo: true, oscuro: !enCasa });
  if (m.kind.dress) m.kind.dress(m);
  return m;
}
const FRASES_FONDO = ['¿Ya es domingo?', '…con natilla… no, sin natilla…', 'No suelte… no suelte…', 'Rigo… para el almuerzo…'];
const FRASES_CASA = ['¿Ya comió?', 'Aquí hay más gente que en mi tiempo. Mejor. Se lava menos.', 'Ese Ñor Tino me quiso arreglar la rodilla con el martillo.', 'Ese techo lo puso ella. Los parches no. Se nota.', 'Mañana voy por los cigarros.', 'Sesenta y cuatro años sin ver el sol, y lo primero que me dicen es que está muy caro todo.', 'Eulalia me vino a ver. Sigue hablando. Eso me tranquiliza.', 'Yendry pregunta más que un censo.', 'De noche ya no salen tantas. Algunas se quedan viendo la casa, nada más.'];

const frasesCasa = (g) => FRASES_CASA.filter((t) => (!t.includes('Tino') || (g.meta.gente && g.meta.gente.p && g.meta.gente.p.tino && g.meta.gente.p.tino.fase === 2)) && (!t.includes('Yendry') || (g.meta.hist.guila && g.meta.hist.guila.fase > 0)));
export function anselmoInteract(m, g, held) {
  if (!AQUI(m)) return false;
  const A = estado(g), diga = (t, ms = 6000) => g.ui.dialog(NOM, t, ms);
  if (A.fase === 3) {
    if (!held || held.id !== PINTO) { diga('…¿Ya es domingo? …¿Trajo el plato?', 3500); return true; }
    g.inventory.consumeHeld(1);
    A.fase = 4;
    m.data.oscuro = false; sombrear(m, false);
    g.audio.play('hmm', { ui: true, vol: 0.4 });
    g.particles.burst(m.body.pos.x, m.body.pos.y + 1, m.body.pos.z, [[1, 0.9, 0.6], [1, 1, 1]], 30, 2.4);
    anotar(g, 'Le di de comer a mi abuelo.', '🚬');
    g.achieve('anselmo_plato', 'Un plato en la Grieta');
    diga('Ah… sin natilla. ¿Y usted quién es? Tiene la misma cara de regaño. …¿La cepa de Zenaida? ¿Y ella? …Ya. Ya entendí. ¿Que ya puedo soltar? Mire, si suelto, eso sale todo junto. Coma algo, y cuando guste, me dice.', 11000);
    return true;
  }
  if (A.fase === 4) {
    if (g.grieta) { diga('¡Péguele, péguele! Yo aquí aguanto lo que queda.', 2500); return true; }
    if (g.player.food < 8) { diga('Con esa cara de hambre no suelto nada. Coma primero.', 3500); return true; }
    empezar(g, A);
    return true;
  }
  if (A.fase >= 5) {
    { const F = frasesCasa(g); diga(F[Math.floor(Math.random() * F.length)], 4000); }
    return true;
  }
  return false;
}

// ---------- la pelea ----------
const OLAS = [
  ['sombra', 'sombra', 'sombra', 'sombra'],
  ['sombra_escudo', 'sombra', 'sombra_hondera', 'sombra', 'sombra'],
  ['sombra_capitana', 'sombra_escudo', 'sombra_hondera', 'sombra', 'sombra', 'sombra'],
  ['el_olvido', 'sombra', 'sombra'],
];
function empezar(g, A) {
  if (!difOf(g).hostiles || !g.settings.hostiles) { terminar(g, A); return; } // sin Sombras: basta con el plato
  g.grieta = { ola: 0, t: 3, mobs: [], pausa: true };
  g.ui.regionBanner('Ya puede soltar', 'Lo que él tenía tapado viene saliendo');
  g.shake = 1;
  g.audio.play('rumble', { ui: true, vol: 0.8 });
  anotar(g, `Mi abuelo soltó la Grieta. Era el día ${g.day || 1}.`, '🚬');
}
function sacarOla(g, A) {
  const G = g.grieta, Q = A.pos, base = piso(Q), dia = g.day || 1;
  OLAS[G.ola].forEach((tipo, i) => {
    const a = (i / OLAS[G.ola].length) * Math.PI * 2 + Math.random(), q = puestoSombra(g, Q.x, Q.z, base + 1, a, tipo === 'el_olvido' ? 7 : 8);
    if (!q) return;
    const m = g.entities.spawnMob(tipo, q.x + 0.5, q.y + 0.2, q.z + 0.5);
    if (!m) return;
    m.data.apuro = true; m.data.provoked = true; m.data.grieta = true;
    if (tipo !== 'el_olvido') m.health += Math.min(12, Math.floor(dia / 3));
    G.mobs.push(m);
    g.particles.burst(q.x + 0.5, q.y + 1, q.z + 0.5, [[0.05, 0.02, 0.1], [0.3, 0.12, 0.4]], 14, 2);
    if (tipo === 'el_olvido') { G.jefe = m; G.roar = 11; G.fase = 0; m.data.angry = true; }
  });
  g.audio.play('sombra', { ui: true, vol: 0.6 });
  if (G.jefe) { g.shake = 1.4; g.audio.play('rumble', { ui: true, vol: 0.9 }); g.ui.regionBanner('El Olvido', 'Todos los que nadie esperó, en uno solo'); }
  else g.ui.toast(`🌑 Salen más de la Grieta (${G.ola + 1} de ${OLAS.length})`, 2200);
}
function acabarPelea(g, razon) {
  const G = g.grieta;
  if (!G) return;
  for (const m of G.mobs) if (!m.dead && !m.dying) { m.dead = true; g.particles.burst(m.body.pos.x, m.body.pos.y + 1, m.body.pos.z, [[0.05, 0.02, 0.1]], 8, 1); }
  g.grieta = null;
  document.body.classList.remove('olvido');
  if (razon) g.ui.toast(razon, 3600);
}
export function limpiarAnselmo(g) { if (g.grieta) acabarPelea(g); g.grietaObra = null; }

function tickPelea(g, A) {
  const G = g.grieta, p = g.player.body.pos, Q = A.pos, base = piso(Q);
  if (!g.player.alive) { acabarPelea(g, '🚬 Don Anselmo volvió a aguantar la puerta. Baje cuando guste y háblele'); return; }
  if (g.dim !== 'tierra' || Math.hypot(p.x - Q.x, p.z - Q.z) > 34 || p.y > Q.y + 4) { acabarPelea(g, '🚬 Se alejó de la Grieta, y Don Anselmo volvió a aguantar. Baje y háblele cuando guste'); return; }
  if (G.jefe && (G.jefe.dead || G.jefe.dying)) { vencerOlvido(g, G.jefe); return; }
  G.mobs = G.mobs.filter((m) => !m.dead);
  // nadie se queda atrás ni arriba de un pilar
  for (const m of G.mobs) if (Math.hypot(m.body.pos.x - Q.x, m.body.pos.z - Q.z) > 16 || m.body.pos.y > base + 8) { m.body.pos.x = Q.x + 3; m.body.pos.z = Q.z + 6; m.body.pos.y = base + 1.5; m.body.vel.y = 0; }
  if (G.jefe && !G.jefe.dead && !G.jefe.dying) jefeTick(g, G);
  if (G.mobs.some((m) => !m.dying)) return;
  if (G.jefe) return; // la pelea la termina vencerOlvido
  if (G.pausa) {
    G.t--;
    if (G.t <= 0) { G.pausa = false; sacarOla(g, A); }
    return;
  }
  G.ola++;
  G.pausa = true; G.t = 6;
  if (G.ola < OLAS.length) g.ui.toast('💨 Un respiro. Coma, véndese, prenda algo', 2400);
}
// «Se le olvida»: respira hondo con aviso; quien se cubre con el escudo no pierde nada. Si no, se apaga la pantalla un rato y cambia lo que trae en la mano.
function jefeTick(g, G) {
  const J = G.jefe, frac = J.health / J.kind.health;
  if (G.fase === 0 && frac < 0.66) { G.fase = 1; refuerzos(g, G); }
  if (G.fase === 1 && frac < 0.33) { G.fase = 2; refuerzos(g, G); }
  G.roar--;
  if (G.roar === 2 || G.roar === 1) anilloAviso(g, J.body.pos.x, J.body.pos.y, J.body.pos.z, 4, 1, J); // v12.16.0: el anillo se ve mientras respira hondo
  if (G.roar === 2) { g.ui.toast('🌫 El Olvido respira hondo… ¡cúbrase con el escudo!', 1900); g.shake = 0.5; g.audio.play('rumble', { ui: true, vol: 0.5 }); }
  if (G.roar <= 0) {
    G.roar = frac < 0.33 ? 9 : 13;
    g.audio.play('sombra', { ui: true, vol: 0.9, pitch: 0.6 });
    if (g.blocking) { g.ui.toast('🛡 ¡Se acordó de todo!', 1500); return; }
    const inv = g.inventory;
    inv.selected = Math.floor(Math.random() * 9); inv.changed();
    document.body.classList.add('olvido');
    clearTimeout(g.olvidoT);
    g.olvidoT = setTimeout(() => document.body.classList.remove('olvido'), 3500);
    g.ui.toast('🌫 ¿Qué era lo que traía en la mano?', 2000);
  }
}
function refuerzos(g, G) {
  const Q = g.meta.anselmo.pos, base = piso(Q);
  for (let i = 0; i < 3; i++) {
    const q = puestoSombra(g, Q.x, Q.z, base + 1, (i / 3) * Math.PI * 2 + Math.random(), 8);
    if (!q) continue;
    const m = g.entities.spawnMob(i === 0 ? 'sombra_hondera' : 'sombra', q.x + 0.5, q.y + 0.2, q.z + 0.5);
    if (m) { m.data.apuro = true; m.data.provoked = true; m.data.grieta = true; G.mobs.push(m); }
  }
  g.ui.toast('🌑 Se le salen más de adentro', 1800);
}
// lo llama killedMob
export function vencerOlvido(g, m) {
  if (m.type !== 'el_olvido' || !g.grieta) return;
  acabarPelea(g);
  g.achieve('vencer_olvido', 'Los que nadie esperó');
  g.giveItem(ESENCIA, 6); g.giveItem(260, 3); g.giveItem(257, 6);
  g.ui.toast('🌫 De lo que quedó: 6 de esencia, 3 diamantes y carbón', 3600);
  terminar(g, g.meta.anselmo);
}
function terminar(g, A) {
  g.addXP(250);
  g.meta.vidaExtra = (g.meta.vidaExtra || 0) + 2;
  g.player.vidaExtra = g.meta.vidaExtra;
  g.player.health = g.player.maxHealth;
  g.audio.play('aplausos', { ui: true, vol: 0.6 });
  g.ui.regionBanner('Se cerró la Grieta', 'Un corazón más, y una casa con más gente');
  anotar(g, 'Se cerró la Grieta. Mi abuelo pregunta si hay almuerzo.', '🚬');
  A.fase = 5; A.fin = g.day || 1;
  const yo = g.entities.mobs.find(AQUI);
  if (yo) decir(g, yo, 'Ya está. Ya. …¿Hay almuerzo?', 6);
  A.tapar = true; g.grietaVolviendo = true;
  setTimeout(() => {
    g.grietaVolviendo = false;
    if (!g.meta || g.meta.anselmo !== A) return; // ya salió del mundo: la boca se tapa cuando vuelva
    let movido = false;
    g.ui.sleepFade(() => { movido = volverACasa(g, A); }, () => { if (movido) g.ui.toast('🏠 De vuelta en la casa. Don Anselmo ya se sentó a la mesa', 4000); });
  }, 6500);
}
function taparBoca(g, A) {
  const Q = A.pos, w = g.world;
  if (g.dim !== 'tierra' || !A.tapar || !w.isLoaded(Q.x, Q.z)) return;
  for (let dx = -7; dx <= 7; dx++) for (let dz = -7; dz <= 7; dz++) if (Math.hypot(dx, dz) <= 6.5) w.setBlock(Q.x + dx, Q.y, Q.z + dz, K.basalt);
  w.setBlock(Q.x, Q.y + 1, Q.z, K.placa);
  w.setBE(Q.x, Q.y + 1, Q.z, { title: 'Aquí', text: 'Aquí estuvo Anselmo, sesenta y cuatro años, y una señora que subía los domingos.' });
  A.tapar = false;
}
function volverACasa(g, A) {
  const H = g.meta.hist, w = g.world;
  if (g.dim !== 'tierra' || !H.casa || !g.player.alive) return false;
  taparBoca(g, A);
  for (const m of g.entities.mobs) if (AQUI(m)) m.dead = true;
  const P = g.player, p = P.body.pos;
  p.x = H.casa.x + ANCHO / 2 + 0.5; p.z = H.casa.z + FONDO + 3.5; p.y = Math.max(w.gen.column(Math.floor(p.x), Math.floor(p.z)).h + 2, H.casa.y + 2);
  P.body.vel.x = P.body.vel.y = P.body.vel.z = 0; P.body.fallStart = null; g.ready = false;
  if ((g.time || 0) > 0.42) g.day = (g.day || 1) + 1;
  g.time = 0.06;
  return true;
}

// ---------- en la casa, después ----------
function tickCasa(g, H, A) {
  const p = g.player.body.pos, cx = H.casa.x + ANCHO / 2, cz = H.casa.z + FONDO / 2;
  if (Math.hypot(cx - p.x, cz - p.z) > 44 || !g.world.isLoaded(H.casa.x, H.casa.z)) return;
  let yo = g.entities.mobs.find(AQUI);
  if (!yo) {
    const x = Math.floor(H.casa.x + 2), z = H.casa.z - 1;
    let y = H.casa.y + 6;
    while (y > H.casa.y - 8 && !(SOLID[g.world.getBlock(x, y - 1, z)] && !SOLID[g.world.getBlock(x, y, z)])) y--;
    yo = ponerlo(g, x, y, z, true);
    if (!yo) return;
  }
  // charla suelta
  if (Math.hypot(yo.body.pos.x - p.x, yo.body.pos.z - p.z) < 12) {
    yo.data.charla = (yo.data.charla ?? 10) - 1;
    if (yo.data.charla <= 0) { yo.data.charla = 50 + Math.random() * 50; { const F = frasesCasa(g); decir(g, yo, F[Math.floor(Math.random() * F.length)], 3.6); } }
  }
  // el desayuno: todos los días le guarda un plato
  if (A.desayuno !== (g.day || 1) && (g.time || 0) < 0.3 && Math.hypot(yo.body.pos.x - p.x, yo.body.pos.z - p.z) < 16) {
    A.desayuno = g.day || 1;
    g.giveItem(PINTO, 2);
    g.ui.toast('🍳 Don Anselmo le guardó un plato. «Coma bien, que dice ella»', 3000);
  }
  escenaRigo(g, A, yo);
}
const ESCENA = [
  ['r', 'Papá…'],
  ['a', '¿Rigo? Qué viejo está.'],
  ['r', '¿Y los cigarros?'],
  ['a', 'Había fila.'],
  ['r', 'Sesenta y cuatro años.'],
  ['a', 'Mucha fila.'],
  ['r', 'Yo le dije a todo el mundo que usted se había ido con otra.'],
  ['a', '¿Yo? Su mamá me habría encontrado. ¿Ya comió?'],
  ['r', 'No. …No, todavía no.'],
  ['a', 'Siéntese. Aquí hay plato para todos.'],
];
function escenaRigo(g, A, yo) {
  if (A.escena === 'fin' || (g.time || 0) > 0.42) return;
  const rigo = g.entities.mobs.find((q) => !q.dead && q.data && q.data.rigo);
  if (!rigo) return;
  const p = g.player.body.pos;
  if (!A.escena) {
    if (Math.hypot(rigo.body.pos.x - p.x, rigo.body.pos.z - p.z) > 18) return;
    A.escena = { i: 0, t: 1 };
    g.ui.toast('🚬 El tío Rigo acaba de ver quién está sentado en el corredor', 3200);
  }
  const E = A.escena;
  E.t--;
  if (E.t > 0) return;
  const paso = ESCENA[E.i];
  if (!paso) {
    A.escena = 'fin';
    entregarCarta(g, CARTA_ANSELMO);
    g.achieve('anselmo_rigo', 'Había fila');
    anotar(g, 'Mi abuelo y mi tío almorzaron juntos. Sesenta y cuatro años tarde.', '🚬');
    g.ui.regionBanner('Los cigarros de Anselmo', 'Hasta las historias más largas terminan en la mesa');
    if (g.inventory.count(CIGARROS)) g.ui.toast('🚬 Todavía anda el paquete de cigarros sin abrir. Póngalo en el cofre: de recuerdo', 3600);
    return;
  }
  decir(g, paso[0] === 'r' ? rigo : yo, paso[1], 3.4);
  E.i++; E.t = 4;
}

// ---------- cada segundo ----------
export function tickAnselmo(g) {
  if (g.mode !== 'survival' || !g.meta || !g.meta.hist) return;
  const H = g.meta.hist, A = estado(g), dia = g.day || 1;
  // las páginas caen solas después de cada pedazo (y en partidas viejas, se ponen al día)
  A.tp = (A.tp || 0) - 1;
  if (A.tp <= 0 && H.pedazos) {
    for (const k of Object.keys(PAGINAS)) {
      if (!H.pedazos[k] || A.paginas[k]) continue;
      A.paginas[k] = dia; A.tp = 45;
      entregarCarta(g, PAGINAS[k]);
      break;
    }
  }
  if (!H.fin) return;
  if (A.fase === 0 && dia > H.fin) { A.fase = 1; g.ui.toast('🚬 Doña Eulalia mandó a decir que la vaya a ver. Que no es para chismear', 4200); }
  if (g.dim !== 'tierra') return;
  if (g.grieta) tickPelea(g, A);
  if (A.tapar && !g.grietaVolviendo) taparBoca(g, A); // se fue del mundo antes de tiempo
  if (A.fase >= 5) { tickCasa(g, H, A); return; }
  if (A.fase < 2 || !A.pos) return;
  const p = g.player.body.pos, d = Math.hypot(A.pos.x - p.x, A.pos.z - p.z);
  // se construye mientras uno se acerca
  if (!A.construida && !g.grietaObra && d < 64) {
    const w = g.world, r = 13;
    if ([[-r, -r], [r, -r], [-r, r], [r, r], [0, 0]].every(([dx, dz]) => w.isLoaded(A.pos.x + dx, A.pos.z + dz))) g.grietaObra = { L: obra(g, A.pos), i: 0, w };
  }
  if (!A.construida) return;
  if (d < 90 && d > 7) g.particles.burst(A.pos.x, A.pos.y + 3, A.pos.z, [[0.12, 0.02, 0.2], [0.35, 0.05, 0.1]], 8, 2.2);
  if (A.fase === 2 && d < 16) {
    A.fase = 3;
    g.ui.regionBanner('La Grieta', 'De aquí salieron todas');
    g.audio.play('rumble', { ui: true, vol: 0.5 });
    if (g.settings.hostiles && difOf(g).hostiles) for (let i = 0; i < 3; i++) {
      const q = puestoSombra(g, A.pos.x, A.pos.z, A.pos.y + 1, (i / 3) * Math.PI * 2, 11);
      if (!q) continue;
      const m = g.entities.spawnMob('sombra', q.x + 0.5, q.y + 0.2, q.z + 0.5);
      if (m) { m.data.apuro = true; m.data.provoked = true; m.health += Math.min(12, Math.floor(dia / 3)); }
    }
  }
  // él, al fondo
  if (A.fase >= 3 && A.fase <= 4 && d < 22 && p.y < A.pos.y - 8) {
    let yo = g.entities.mobs.find(AQUI);
    if (!yo) { yo = ponerlo(g, A.pos.x, piso(A.pos) + 1, A.pos.z + 7, false); if (yo) yo.data.oscuro = A.fase === 3; }
    if (yo && yo.data.oscuro && !yo.data.pintado && !yo.group.userData.pending) { yo.data.pintado = true; sombrear(yo, true); }
    if (yo && A.fase === 3 && Math.hypot(yo.body.pos.x - p.x, yo.body.pos.z - p.z) < 14) {
      yo.data.charla = (yo.data.charla ?? 3) - 1;
      if (yo.data.charla <= 0) { yo.data.charla = 9; decir(g, yo, FRASES_FONDO[Math.floor(Math.random() * FRASES_FONDO.length)], 3.2); }
    }
  }
}
// cada cuadro
export function tickAnselmoCuadro(g) {
  if (g.grietaObra && g.meta && g.meta.anselmo) tickObra(g, g.meta.anselmo);
}
// /prueba grieta
export function pruebaGrieta(g) {
  const H = g.meta.hist, A = estado(g);
  H.fin = H.fin || g.day || 1;
  A.fase = 2; A.construida = false; A.pos = buscarSitio(g, H, true);
  g.giveItem(PINTO, 3);
  return `Grieta a ${Math.round(Math.hypot(A.pos.x - g.player.body.pos.x, A.pos.z - g.player.body.pos.z))} bloques (📖 en la brújula), con 3 gallos pintos`;
}
