// Mundo vivo de los pueblos: historias encadenadas con los vecinos (el perro perdido, la vaca que se escapó, la abuela
// que necesita leña y el novio que no llega), vecinos que conversan entre ellos con globitos, y los apagones.
import * as THREE from 'three';
import { aColones } from './plata.js';
import { BLOCKS, BLOCK_BY_KEY as K, SOLID } from './blocks.js';
import { aprender } from './saberes.js';

const COLON = 360;
const LOGS = BLOCKS.filter((b) => b && /log$/.test(b.key) && !b.key.includes('stripped')).map((b) => b.id);
const contarTroncos = (g) => LOGS.reduce((n, id) => n + g.inventory.count(id), 0);
const quitarTroncos = (g, n) => { for (const id of LOGS) { const k = Math.min(n, g.inventory.count(id)); if (k) { g.inventory.remove(id, k); n -= k; } if (!n) break; } };
const habla = (g, quien, texto) => { g.ui.dialog(quien, texto, 5200); g.audio.play('hmm', { ui: true, vol: 0.4, vary: 0.12 }); };
const pagar = (g, n) => { const left = g.inventory.add(COLON, n); const p = g.player.body.pos; if (left) g.entities.dropItem(COLON, left, p.x, p.y + 1, p.z); g.audio.play('monedas', { ui: true, vol: 0.5 }); };

// ---------- las historias ----------
const HISTORIAS = {
  perro: {
    titulo: 'El perro perdido',
    inicio: () => `¡Ay, qué angustia! Se me perdió el Canelo, mi perro. Se fue detrás de un pizote para el monte… ¿me ayuda a buscarlo? Le pago bien.`,
    pasos: { buscar: 'Busque al Canelo (❗ en la brújula)', traer: 'Lleve al Canelo con su dueña' },
    mob: 'perro', nombreMob: 'Canelo', lejos: [60, 100],
    fin: { pago: 25, texto: '¡CANELO! ¡Mi chiquito! Ay, muchas gracias, tome, se lo ganó. Venga cuando quiera a tomarse un cafecito.', logro: ['perro_perdido', 'Encontré al Canelo'] },
  },
  vaca: {
    titulo: 'La vaca que se escapó',
    inicio: () => 'Diay, la Pinta se brincó la cerca otra vez y anda por ahí comiéndose los jardines de todo mundo. ¿Me la trae? Con acercarse ella lo sigue, es muy confianzuda.',
    pasos: { buscar: 'Busque a la Pinta (❗ en la brújula)', traer: 'Lleve a la Pinta de vuelta al potrero' },
    mob: 'vaca', nombreMob: 'la Pinta', lejos: [50, 90],
    fin: { pago: 20, extra: [292, 1], texto: '¡Esa es mi Pinta! Gracias, mae. Tome, y llévese un balde de leche fresquita.', logro: ['vaca_escapada', 'Arreo de pueblo'] },
  },
  abuela: {
    titulo: 'La abuela y la leña',
    inicio: () => 'Mijo, venga acá. Se me acabó la leña del fogón y así no puedo hacer las tortillas. ¿Me trae 12 troncos? Dios se lo pague.',
    pasos: { lena: 'Lleve 12 troncos a la abuela', maiz: 'Lleve 6 mazorcas de maíz a la abuela' },
    fin: { pago: 20, extra: [417, 2], extra2: [652, 1], texto: '¡Ya está la olla en el fogón! Siéntese, coma con nosotros. Y tome estas dos sopas negras para el camino, mi amor. Ah, y este chanchito de barro, que era de cuando yo era chiquilla: lo que eche ahí no se pierde nunca.', logro: ['abuela', 'El cariño de la abuela'] },
  },
  novio: {
    titulo: 'El novio que no llega',
    inicio: () => 'Mi novio Chepe quedó de venir a pedirme la mano HOY y no aparece… Dicen que lo vieron por allá, sentado debajo de un árbol. ¿Me lo va a buscar?',
    pasos: { buscar: 'Busque a Chepe (❗ en la brújula)', flor: 'Consiga una flor roja para Chepe', traer: 'Lleve a Chepe con su novia' },
    lejos: [55, 90],
    fin: { pago: 30, texto: '¡Chepe! ¿Y esa flor? … ¡SÍ, ACEPTO! ¡Hay boda en el pueblo! Gracias por todo, usted es el padrino.', logro: ['novio', 'Celestino del pueblo'] },
  },
};
export const NOMBRES_HISTORIAS = Object.fromEntries(Object.values(HISTORIAS).map((h) => [h.fin.logro[0], h.fin.logro[1]]));

function sitioLejos(g, desde, [a, b]) {
  for (let t = 0; t < 30; t++) {
    const ang = Math.random() * Math.PI * 2, r = a + Math.random() * (b - a);
    const x = Math.round(desde.x + Math.cos(ang) * r), z = Math.round(desde.z + Math.sin(ang) * r);
    const col = g.world.gen.column(x, z);
    if (col.h > 63 && col.biome !== 'ocean') return { x, z };
  }
  return { x: Math.round(desde.x + 70), z: Math.round(desde.z) };
}
const pisoEn = (g, x, z) => { const w = g.world; let y = 120; while (y > 2 && !SOLID[w.getBlock(x, y - 1, z)]) y--; return y; };

function crearChepe(g, x, y, z) {
  const m = g.entities.spawnMob('vecino', x + 0.5, y + 0.2, z + 0.5);
  m.data = { vid: 'mision:chepe', name: 'Chepe', role: 'vecino', seed: 424242, home: { x, y, z }, plaza: { x: x + 0.5, y, z: z + 0.5 }, inside: false, mision: 'novio' };
  m.kind.dress(m);
  return m;
}

// ¿empieza una historia? (al hablar con un vecino cualquiera, a veces)
function empezar(m, g) {
  const M = g.meta;
  if (M.historia || m.data.sereno || (g.clock || 0) < (M.historiaCd || 0) || m.data.role !== 'vecino' || g.mode !== 'survival') return false; // el sereno solo existe de noche: no puede dar encargos
  const hechas = (M.historiasHechas = M.historiasHechas || {});
  const libres = Object.keys(HISTORIAS).filter((k) => (hechas[k] || 0) < 2);
  if (!libres.length || Math.random() > 0.35) return false;
  const id = libres[Math.floor(Math.random() * libres.length)];
  const H = HISTORIAS[id];
  const b = m.body.pos;
  const h = { id, giver: m.data.vid, quien: m.data.name, casa: { x: Math.round(b.x), z: Math.round(b.z) } };
  if (H.lejos) { h.paso = 'buscar'; h.pos = sitioLejos(g, b, H.lejos); }
  else { h.paso = 'lena'; h.pos = h.casa; }
  M.historia = h;
  habla(g, m.data.name, H.inicio());
  g.ui.toast(`📜 Historia nueva: ${H.titulo}`, 2600);
  return true;
}

function terminar(g, h, quienHabla) {
  const H = HISTORIAS[h.id], M = g.meta;
  habla(g, quienHabla, H.fin.texto);
  pagar(g, H.fin.pago);
  if (H.fin.extra) g.inventory.add(H.fin.extra[0], H.fin.extra[1]);
  if (H.fin.extra2 && !(M.historiasHechas && M.historiasHechas[h.id])) g.giveItem(H.fin.extra2[0], H.fin.extra2[1]); // solo la primera vez
  g.achieve(...H.fin.logro);
  g.addXP(15);
  M.reputation = (M.reputation || 0) + 2;
  (M.historiasHechas = M.historiasHechas || {})[h.id] = ((M.historiasHechas[h.id]) || 0) + 1;
  M.historia = null;
  M.historiaCd = (g.clock || 0) + 240;
  const p = g.player.body.pos;
  g.particles.burst(p.x, p.y + 2, p.z, [[1, 0.85, 0.3], [1, 0.4, 0.5], [0.5, 0.8, 1]], 40, 4);
  if (h.id === 'novio') g.audio.play('campana', { ui: true, vol: 0.6 });
  if (h.id === 'abuela') aprender(g, 'pan_casero');
  if (Object.keys(HISTORIAS).every((k) => M.historiasHechas[k])) g.achieve('historias', 'Cuentacuentos del pueblo');
}

// al hablar con un vecino: lo de las historias va primero. Devuelve true si ya habló.
export function misionInteract(m, g) {
  const h = g.meta.historia, d = m.data;
  // Chepe
  if (d.mision === 'novio' && h && h.id === 'novio') {
    if (h.paso === 'buscar' || h.paso === 'flor') {
      if (g.inventory.count(K.flower_red) > 0) {
        g.inventory.remove(K.flower_red, 1);
        h.paso = 'traer'; d.sigue = true;
        habla(g, 'Chepe', '¡Una flor roja! Es su favorita… Bueno, ya, ya me animé. Vamos, usted me acompaña que me tiemblan las piernas.');
      } else {
        h.paso = 'flor';
        habla(g, 'Chepe', 'Diay… es que me da vergüenza llegar con las manos vacías. Si tuviera una flor roja… de esas que salen en el zacate.');
      }
      return true;
    }
    if (h.paso === 'traer') { habla(g, 'Chepe', 'Sí, sí, ahí voy detrás suyo. Qué nervios, mae.'); return true; }
  }
  if (!h) return empezar(m, g);
  if (d.vid !== h.giver) return false;
  const H = HISTORIAS[h.id];
  if (h.id === 'abuela') {
    if (h.paso === 'lena') {
      if (contarTroncos(g) >= 12) { quitarTroncos(g, 12); h.paso = 'maiz'; habla(g, d.name, '¡Qué buena leña! Ahora sí prendo el fogón… ay, pero no tengo maíz para las tortillas. ¿Me trae 6 mazorcas?'); }
      else habla(g, d.name, `Todavía me faltan troncos, mi cielo: lleva ${contarTroncos(g)} de 12.`);
      return true;
    }
    if (h.paso === 'maiz') {
      if (g.inventory.count(268) >= 6) { g.inventory.remove(268, 6); terminar(g, h, d.name); }
      else habla(g, d.name, `Me faltan mazorcas: tiene ${g.inventory.count(268)} de 6. En los maizales de las fincas hay.`);
      return true;
    }
  }
  habla(g, d.name, `¿Y? ${H.pasos[h.paso]}… no se me olvide, por favor.`);
  return true;
}

// cada segundo: aparece lo que hay que buscar, se sigue y se entrega
export function tickMision(g) {
  const h = g.meta.historia;
  g.ui.mision(h ? `📜 ${HISTORIAS[h.id].titulo}: ${HISTORIAS[h.id].pasos[h.paso]}` : null);
  if (!h || g.dim !== 'tierra' || g.mode !== 'survival') return;
  const H = HISTORIAS[h.id], p = g.player.body.pos, E = g.entities;
  let mob = E.mobs.find((o) => !o.dead && o.data && o.data.mision === h.id);
  if (h.paso === 'buscar' || h.paso === 'flor') {
    const dist = Math.hypot(h.pos.x - p.x, h.pos.z - p.z);
    if (!mob && dist < 40 && g.world.isLoaded(h.pos.x, h.pos.z)) {
      const y = pisoEn(g, h.pos.x, h.pos.z);
      mob = h.id === 'novio' ? crearChepe(g, h.pos.x, y, h.pos.z) : E.spawnMob(H.mob, h.pos.x + 0.5, y + 0.3, h.pos.z + 0.5);
      if (h.id !== 'novio') mob.data.mision = h.id;
      if (h.id === 'novio') mob.frozen = true;
    }
    if (mob && h.id !== 'novio' && Math.hypot(mob.body.pos.x - p.x, mob.body.pos.z - p.z) < 3.5) {
      h.paso = 'traer'; mob.data.sigue = true;
      g.audio.play(H.mob, { pos: mob.soundPos(), vol: 0.9 });
      g.ui.toast(`🐾 ¡Encontró a ${H.nombreMob}! Ahora lo sigue: llévelo con ${h.quien}`, 2800);
    }
    if (mob) h.pos = { x: Math.round(mob.body.pos.x), z: Math.round(mob.body.pos.z) };
  }
  if (h.paso === 'traer') {
    if (mob && h.id === 'novio') mob.frozen = false;
    // si se recargó el mundo y se perdió, vuelve a aparecer al lado
    if (!mob) {
      const y = pisoEn(g, Math.floor(p.x) + 2, Math.floor(p.z));
      mob = h.id === 'novio' ? crearChepe(g, Math.floor(p.x) + 2, y, Math.floor(p.z)) : E.spawnMob(H.mob, p.x + 2, y + 0.3, p.z);
      mob.data.mision = h.id;
    }
    mob.data.sigue = true;
    h.pos = h.casa;
    const giver = E.mobs.find((o) => !o.dead && o.data && o.data.vid === h.giver);
    const meta = giver ? giver.body.pos : { x: h.casa.x, z: h.casa.z };
    if (Math.hypot(mob.body.pos.x - meta.x, mob.body.pos.z - meta.z) < 6 && Math.hypot(p.x - meta.x, p.z - meta.z) < 8) {
      mob.data.sigue = false;
      if (h.id === 'novio') { mob.data.mision = null; mob.data.vid = `mision:chepe:${g.clock}`; }
      else mob.data.mision = null;
      terminar(g, h, h.quien);
    }
  }
}

// ---------- globitos: los vecinos conversan entre ellos ----------
const CHARLAS = [
  ['¿Ya supo lo de la vecina?', '¡No me diga! ¿Otra vez?'],
  ['¡Qué calor más feo!', 'Diay, es que ya viene el verano.'],
  ['¿Va para la feria el sábado?', 'Si no llueve, sí.'],
  ['Se fue la luz anoche…', '¡Como siempre! Ni se diga.'],
  ['¿Y la mejenga del domingo?', 'Perdimos 3 a 0, mae.'],
  ['Esa gente nueva ayuda mucho.', 'Sí, son muy serviciales.'],
  ['¡Qué precio el del arroz!', 'Todo está carísimo, mi amor.'],
  ['¿Usted cree que llueva?', 'Esas nubes no mienten.'],
  ['Mi chiquito ya camina.', '¡Qué rico! ¡Felicidades!'],
  ['¿Oyó el temblor?', '¡Casi me caigo de la cama!'],
  ['El bus pasó lleno otra vez.', 'Hay que madrugar, diay.'],
  ['¿Le debe plata al pulpero?', 'Shh… ¡no lo diga tan alto!'],
];
const burbujaTex = new Map();
function burbuja(texto) {
  if (burbujaTex.has(texto)) return burbujaTex.get(texto);
  const c = document.createElement('canvas');
  const ctx = c.getContext('2d');
  // v11.12.3: el globo en vidrio, con los colores de los tokens (src/tokens.css)
  const css = getComputedStyle(document.documentElement), tok = (n) => css.getPropertyValue(n).trim();
  const letra = `600 25px ${tok('--font') || 'sans-serif'}`;
  ctx.font = letra;
  const w = Math.min(560, Math.ceil(ctx.measureText(texto).width) + 32);
  c.width = w; c.height = 54;
  ctx.font = letra;
  ctx.fillStyle = tok('--surface-solida'); ctx.strokeStyle = tok('--border-strong'); ctx.lineWidth = 2;
  ctx.beginPath(); ctx.roundRect(2, 2, w - 4, 44, 14); ctx.fill(); ctx.stroke();
  ctx.fillStyle = tok('--text'); ctx.textBaseline = 'middle'; ctx.fillText(texto, 16, 25, w - 32);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const out = { tex, aspect: w / 54 };
  if (burbujaTex.size > 40) { const [k, v] = burbujaTex.entries().next().value; v.tex.dispose(); burbujaTex.delete(k); }
  burbujaTex.set(texto, out);
  return out;
}
export function decir(g, m, texto, seg = 3.2, lejos = false) { // lejos: se dice aunque uno no esté cerca (la gente de la ladera del Rey, v12.16.5)
  // v11.9: a lo lejos no se lee, y con más de tres globos encima no se entiende ninguno. Lo dicho queda en el historial
  const pp = g.player && g.player.body.pos, d = pp ? Math.hypot(m.body.pos.x - pp.x, m.body.pos.z - pp.z) : 0;
  if (d > 14 && !lejos) return;
  if (pp && !m.data.globo) {
    const otros = g.entities.mobs.filter((o) => o !== m && o.data && o.data.globo);
    if (otros.length >= 3) {
      const lejos = otros.reduce((a, o) => (Math.hypot(o.body.pos.x - pp.x, o.body.pos.z - pp.z) > Math.hypot(a.body.pos.x - pp.x, a.body.pos.z - pp.z) ? o : a));
      if (Math.hypot(lejos.body.pos.x - pp.x, lejos.body.pos.z - pp.z) <= d) return;
      lejos.group.remove(lejos.data.globo); lejos.data.globo.material.dispose(); lejos.data.globo = null;
    }
  }
  if (g.ui && g.ui.locutor) g.ui.locutor.anotar({ text: `💬 ${(m.data && m.data.name) || (m.kind && m.kind.name) || 'Alguien'}: ${texto}`, cat: 'ambiente' }, 'dicho');
  if (m.data.globo) { m.group.remove(m.data.globo); m.data.globo.material.dispose(); }
  const b = burbuja(aColones(texto));
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: b.tex, depthTest: true, transparent: true }));
  const esc = 1 / (m.group.scale.x || 1);
  s.scale.set(0.42 * b.aspect * esc, 0.42 * esc, 1);
  s.position.y = (m.kind.h + 0.55) * esc;
  m.group.add(s);
  if (lejos && d > 14) { s.scale.multiplyScalar(Math.min(4.5, d / 8)); s.position.y *= 1.15; } // de lejos se lee: más grande
  m.data.globo = s; m.data.globoT = seg;
}
export function tickCharlas(g, dt) {
  for (const m of g.entities.mobs) {
    if (!m.data || !m.data.globo) continue;
    m.data.globoT -= dt;
    if (m.data.globoT <= 0 || m.dead) { m.group.remove(m.data.globo); m.data.globo.material.dispose(); m.data.globo = null; continue; }
    // v13.6.1 (PU-30): con la cámara pegada al globo (un NPC al lado de la cara) el cartel se pintaba enorme: se encoge a menos de 2,5 bloques, hasta 1/3 de su tamaño
    const s = m.data.globo, pp = g.player.body.pos, d = Math.hypot(m.body.pos.x - pp.x, m.body.pos.y + m.kind.h - (pp.y + 1.6), m.body.pos.z - pp.z);
    if (!s.userData.base) s.userData.base = { x: s.scale.x, y: s.scale.y };
    const k = Math.max(0.33, Math.min(1, d / 2.5));
    s.scale.set(s.userData.base.x * k, s.userData.base.y * k, 1);
  }
  // la respuesta llega al ratito
  const c = g.charla;
  if (c) {
    c.t -= dt;
    if (c.t <= 0) { if (!c.b.dead) decir(g, c.b, c.linea); g.charla = null; }
    return;
  }
  g.charlaT = (g.charlaT ?? 6) - dt;
  if (g.charlaT > 0) return;
  g.charlaT = 8 + Math.random() * 10;
  if ((g.envPueblo || 0) < 0.2 || g.daylight < 0.3) return;
  const p = g.player.body.pos;
  const cerca = g.entities.mobs.filter((m) => m.type === 'vecino' && !m.dead && m.data && m.data.role === 'vecino' && !m.data.talk && Math.hypot(m.body.pos.x - p.x, m.body.pos.z - p.z) < 22);
  for (const a of cerca) {
    const b = cerca.find((o) => o !== a && Math.hypot(o.body.pos.x - a.body.pos.x, o.body.pos.z - a.body.pos.z) < 5);
    if (!b) continue;
    const [l1, l2] = CHARLAS[Math.floor(Math.random() * CHARLAS.length)];
    // se miran
    a.targetYaw = Math.atan2(b.body.pos.x - a.body.pos.x, b.body.pos.z - a.body.pos.z);
    b.targetYaw = Math.atan2(a.body.pos.x - b.body.pos.x, a.body.pos.z - b.body.pos.z);
    decir(g, a, l1);
    g.charla = { b, linea: l2, t: 1.8 };
    return;
  }
}

// ---------- apagones: de noche, de vez en cuando se va la luz en el pueblo ----------
export function tickApagon(g) {
  if (g.dim !== 'tierra') return;
  const A = g.apagon;
  if (A) {
    A.t -= 1;
    if (A.t > 0) return;
    for (const [x, y, z] of A.luces) if (/_off$/.test(BLOCKS[g.world.getBlock(x, y, z)].key)) g.toggleBlock(x, y, z);
    g.apagon = null;
    g.ui.toast('💡 ¡Volvió la luz! (los vecinos aplauden)', 2200);
    return;
  }
  g.apagonCd = (g.apagonCd ?? 900) - 1;
  if (g.apagonCd > 0 || g.daylight > 0.3 || (g.envPueblo || 0) < 0.4) return;
  g.apagonCd = 1200 + Math.random() * 1200;
  const w = g.world, p = g.player.body.pos, luces = [];
  for (let dx = -26; dx <= 26; dx++) for (let dz = -26; dz <= 26; dz++) for (let dy = -6; dy <= 10; dy++) {
    const x = Math.floor(p.x) + dx, y = Math.floor(p.y) + dy, z = Math.floor(p.z) + dz, id = w.getBlock(x, y, z);
    if (id === K.lamp || id === K.farol) luces.push([x, y, z]);
  }
  if (luces.length < 2) return;
  for (const [x, y, z] of luces) g.toggleBlock(x, y, z);
  g.apagon = { t: 45 + Math.random() * 45, luces };
  g.audio.play('rumble', { ui: true, vol: 0.25, pitch: 2 });
  g.ui.toast('⚡ ¡Se fue la luz en todo el pueblo! La Compañía de Luz (ficticia) dice que «ya viene»', 3200);
  g.achieve('apagon', 'Se fue la luz');
}
