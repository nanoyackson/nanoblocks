// La fuerza de la comida y el descanso (v5.2). Dos ideas de progreso «cómodo» (nanoyackson pidió supervivencia más cómoda y con progreso):
// · Comer bien da fuerza: hasta tres comidas distintas a la vez. Cada una sube la vida máxima (1 o 2 corazones) y el aguante
//   máximo (+2.5 por punto de comida, hasta 25) mientras dura (de 4 a 9 minutos); al final se va desinflando. Lo mismo otra vez solo se puede
//   cuando ya le queda menos de la mitad. Se ve arriba de los corazones, con su barrita. Estado: meta.fuerza (se guarda).
// · Descansado: después de dormir, o quieto un rato bajo techo junto al fuego, uno queda descansado: el aguante vuelve 50 % más
//   rápido y se gana 25 % más de experiencia. Dura más entre más cómodo el lugar (cama, silla, mesa, alfombra, flores, trofeos, luz,
//   fuego) y entre más arreglada la casa de la abuela. Es el efecto 'descansado'.
import { ITEMS, BLOCKS, BLOCK_BY_KEY as K, esPescado } from './blocks.js';
import { itemCanvas } from './textures.js';

const MAX = 3;
const CRUDO = { has: (id) => id === 262 || esPescado(id) }; // v12.7.0: la carne y todos los pescados crudos (blocks.js) // la carne y el pescado crudos llenan, pero no dan fuerza
const valor = (id) => { const d = ITEMS[id]; return d && d.food && !d.guaro && d.key !== 'antidoto' && !d.sip && !CRUDO.has(id) ? d.food : 0; };
export function comidaFuerza(g, id) {
  if (g.mode !== 'survival' || !g.meta) return;
  const f = valor(id);
  if (f < 3) return; // lo que casi no llena tampoco da fuerza
  const L = (g.meta.fuerza ||= []);
  const vida = f >= 7 ? 4 : 2, aguante = Math.min(25, Math.round(f * 2.5)), dura = 240 + f * 30;
  const ya = L.find((q) => q.id === id);
  if (ya) {
    if (ya.t > ya.max * 0.5) { g.ui.toast('🍽 Eso ya lo tiene en la panza: espere a que se le baje un poco', 1800); return; }
    Object.assign(ya, { t: dura, max: dura, vida, aguante });
  } else if (L.length < MAX) L.push({ id, t: dura, max: dura, vida, aguante });
  else {
    // la que le queda menos, si ya va por la mitad
    const vieja = L.reduce((a, b) => (a.t / a.max < b.t / b.max ? a : b));
    if (vieja.t > vieja.max * 0.5) { g.ui.toast('🍽 Ya no le cabe más: tres comidas. Cuando se baje alguna, cabe otra', 2000); return; }
    Object.assign(vieja, { id, t: dura, max: dura, vida, aguante });
  }
  aplicar(g);
  g.ui.toast(`💪 Comida con fuerza: +${vida / 2} ${vida > 2 ? 'corazones' : 'corazón'} y +${aguante} de aguante por ${Math.round(dura / 60)} min`, 2400);
  g.achieve('fuerza', 'Comer bien da fuerza');
  if (L.length >= 3) g.achieve('fuerza3', 'Tres tiempos de comida');
}
// lo que suma cada comida (al final se va desinflando)
function aplicar(g) {
  const L = (g.meta && g.meta.fuerza) || [];
  let v = 0, a = 0;
  for (const q of L) { const k = Math.min(1, q.t / (q.max * 0.3)); v += q.vida * k; a += q.aguante * k; }
  g.player.vidaComida = Math.round(v / 2) * 2;
  g.aguanteExtra = Math.round(a);
  if (g.player.health > g.player.maxHealth) g.player.health = g.player.maxHealth;
  if (g.stamina > 100 + g.aguanteExtra) g.stamina = 100 + g.aguanteExtra;
  dibujar(g, L);
}
// cada segundo
export function tickFuerza(g) {
  if (!g.meta) return;
  const L = (g.meta.fuerza ||= []);
  if (g.mode === 'survival' && g.player.alive) for (const q of L) q.t -= 1;
  const antes = L.length;
  g.meta.fuerza = L.filter((q) => q.t > 0);
  if (g.meta.fuerza.length < antes) g.ui.toast('🍽 Se le bajó una comida: hay campo para otra', 1800);
  aplicar(g);
  tickDescanso(g);
}
// al morir se pierde la fuerza de lo comido
export function perderFuerza(g) { if (g.meta) g.meta.fuerza = []; aplicar(g); }
// los iconitos arriba de los corazones
function dibujar(g, L) {
  if (typeof document === 'undefined') return;
  let el = document.getElementById('fuerza');
  if (!el) {
    const hud = document.getElementById('hud');
    if (!hud) return;
    el = document.createElement('div'); el.id = 'fuerza'; hud.appendChild(el);
  }
  const ver = g.mode === 'survival' && L.length > 0;
  el.style.display = ver ? '' : 'none';
  if (!ver) return;
  const firma = L.map((q) => q.id).join(',');
  if (el.dataset.firma !== firma) {
    el.dataset.firma = firma;
    el.innerHTML = L.map((q) => { let src = ''; try { src = itemCanvas(q.id).toDataURL(); } catch { /* sin dibujo */ } return `<div class="fz"><img src="${src}" alt=""><i></i></div>`; }).join('');
  }
  [...el.children].forEach((c, i) => { const q = L[i]; if (q) { c.querySelector('i').style.width = `${Math.max(0, q.t / q.max) * 100}%`; c.classList.toggle('baja', q.t < q.max * 0.3); } });
}

// /prueba fuerza: tres comidas buenas en la mano y descansado
export function pruebaFuerza(g) { for (const id of [263, 265, 270]) g.giveItem(id, 2); darDescanso(g, 'prueba'); return 'Gallo pinto, carne asada y tortillas en la mochila: cómalas y vea los corazones subir. Y queda descansado'; }

// ---------- descansado ----------
const FUEGO = new Set(['fogata', 'stove', 'furnace_lit', 'chimenea'].map((k) => K[k]).filter(Boolean));
const LUZ = new Set(['torch', 'wall_torch0', 'wall_torch1', 'wall_torch2', 'wall_torch3', 'farol', 'lamp', 'farol_zenaida', 'lampara'].map((k) => K[k]).filter(Boolean));
const CATEGORIAS = [
  ['cama', (b) => /^bed|cama|hamaca/.test(b.key)],
  ['asiento', (b) => /silla|banco|sofa|mecedora|chair/.test(b.key)],
  ['mesa', (b) => /mesa|table/.test(b.key)],
  ['alfombra', (b) => /wool|alfombra|lana|cortina/.test(b.key)],
  ['flores', (b) => /maceta|flower|flor_/.test(b.key)],
  ['trofeo', (b) => !!b.trofeo],
  ['mueble_fino', (b) => ['mesa_grande', 'alacena', 'armario', 'mostrador'].includes(b.key)], // v12.15.1 (C6)
  ['ceramica', (b) => b.key === 'jarron_chorotega' || b.key === 'tinaja'],
  ['talla', (b) => b.key === 'puerta_tallada'],
  ['pecera', (b) => b.key === 'pecera'], // v12.6.0: solo con un pez (comodidadAqui mira la entidad)
  ['luz', (b) => LUZ.has(b.id)],
  ['fuego', (b) => FUEGO.has(b.id)],
];
// qué tan cómodo es el lugar: una por cada clase de cosa a 5 bloques, más el nivel de la casa
export function comodidadAqui(g) {
  const w = g.world, p = g.player.body.pos, x0 = Math.floor(p.x), y0 = Math.floor(p.y), z0 = Math.floor(p.z), hay = new Set();
  for (let dx = -5; dx <= 5; dx++) for (let dz = -5; dz <= 5; dz++) for (let dy = -1; dy <= 3; dy++) {
    const b = BLOCKS[w.getBlock(x0 + dx, y0 + dy, z0 + dz)];
    if (!b || !b.key) continue;
    if (b.key === 'pecera' && !((w.getBE(x0 + dx, y0 + dy, z0 + dz) || {}).pez)) continue; // v12.6.0: la pecera vacía no cuenta
    for (const [n, f] of CATEGORIAS) if (!hay.has(n) && f(b)) hay.add(n);
  }
  const H = g.meta && g.meta.hist, casa = H && H.casa && Math.hypot(H.casa.x - p.x, H.casa.z - p.z) < 20 ? (H.nivel || 1) : 0;
  return { n: hay.size + casa, hay, casa };
}
export function darDescanso(g, como) {
  if (g.mode !== 'survival') return;
  const C = comodidadAqui(g), seg = Math.min(900, 180 + C.n * 60);
  g.addEffect('descansado', seg);
  g.ui.toast(`😌 Buen descanso (comodidad ${C.n}): el aguante vuelve más rápido y se aprende más, por ${Math.round(seg / 60)} min${como === 'fuego' ? '. Junto al fuego se está bien' : ''}`, 3400);
  g.achieve('descansado', 'Un buen descanso');
  if (C.n >= 8) g.achieve('comodidad8', 'Casa cómoda de verdad');
}
// quieto bajo techo junto al fuego, un ratito: descansado
function tickDescanso(g) {
  if (g.mode !== 'survival' || !g.player.alive || g.dim === 'cielo') { g.reposoT = 0; return; }
  const fx = g.player.effects, b = g.player.body;
  if ((fx.descansado || 0) > 60) { g.reposoT = 0; return; }
  const quieto = Math.hypot(b.vel.x, b.vel.z) < 0.3 && b.onGround;
  if (!quieto) { g.reposoT = 0; return; }
  const w = g.world, p = b.pos, x0 = Math.floor(p.x), y0 = Math.floor(p.y), z0 = Math.floor(p.z);
  let fuego = false, techo = false;
  for (let dx = -3; dx <= 3 && !fuego; dx++) for (let dz = -3; dz <= 3 && !fuego; dz++) for (let dy = -1; dy <= 1; dy++) if (FUEGO.has(w.getBlock(x0 + dx, y0 + dy, z0 + dz))) { fuego = true; break; }
  for (let y = y0 + 2; y < y0 + 8; y++) if (BLOCKS[w.getBlock(x0, y, z0)] && BLOCKS[w.getBlock(x0, y, z0)].opaque) { techo = true; break; }
  if (!fuego || !techo) { g.reposoT = 0; return; }
  g.reposoT = (g.reposoT || 0) + 1;
  if (g.reposoT === 4) g.ui.toast('🔥 Qué rico se está junto al fuego…', 1600);
  if (g.reposoT >= 10) { g.reposoT = 0; darDescanso(g, 'fuego'); }
}
