// La casa de la abuela también progresa: se arregla (rancho), se amuebla (casa de verdad) y se pone a producir (finca). Cada
// nivel da ventajas reales y la ruta (J) dice qué le falta. Y la carpa, para dormir lejos cuando uno sale de expedición.
import { BLOCK_BY_KEY as K } from './blocks.js';
import { anotar } from './diario.js';
import { BLOCKS } from './blocks.js';

const ANCHO = 9, FONDO = 7, MARGEN = 7, COCINA = new Set([K.stove, K.furnace, K.furnace_lit].filter(Boolean)), LUCES = new Set([K.farol, K.lamp].filter(Boolean));
export const NIVELES = [
  { t: 'Rancho arreglado', ventaja: 'Sombras lejos y descanso adentro' },
  { t: 'Casa de verdad', ventaja: 'La comida casera llena 25 % más y dormir aquí lo deja como nuevo' },
  { t: 'Finca de la abuela', ventaja: 'Las Sombras nacen más lejos y cada mañana la finca deja comida en el cofre' },
  { t: 'Casa de leyenda', ventaja: 'Las Sombras nacen mucho más lejos y dormir aquí quita todos los malestares' },
  { t: 'La casa de todos', ventaja: 'Las Sombras nacen lejísimos, la finca da el doble y en los asedios vienen menos' },
];
// los trofeos: cada jefe vencido deja uno, una sola vez, para ponerlo en la casa
const TROFEO_DE = { reina_bananera: 'trofeo_reina', escarabajo_hercules: 'trofeo_cornudo', sapo_tata: 'trofeo_tata', cascabel_rey: 'trofeo_cascabel', cangrejo_rey: 'trofeo_cangrejo', ciempies_rey: 'trofeo_ciempies', rey_zopilote: 'trofeo_rey_zopilote', rey_murcielago: 'trofeo_rey_murcielago', senor_arenal: 'trofeo_senor_arenal', arpia: 'trofeo_arpia', sombra_madre: 'trofeo_sombra_madre', el_olvido: 'trofeo_olvido', mono_congo_gigante: 'trofeo_mono_congo_gigante', cadejos: 'trofeo_cadejos', toro_guaco: 'trofeo_toro_guaco', cuche_monte: 'trofeo_cuche_monte', chupacabras: 'trofeo_chupacabras', becquer: 'trofeo_becquer', puma: 'trofeo_puma', bailarin: 'trofeo_bailarin', padre: 'trofeo_padre' };
export function darTrofeo(g, m) {
  const k = TROFEO_DE[m.type];
  if (!k || g.mode !== 'survival' || !g.meta) return;
  const T = (g.meta.trofeos ||= {});
  if (T[k]) return;
  T[k] = g.day || 1;
  g.giveItem(K[k], 1);
  g.ui.toast(`🏆 ${BLOCKS[K[k]].name}. Póngalo en la casa: con tres, es Casa de leyenda`, 4200);
  g.achieve('trofeo', 'El primer trofeo');
  if (Object.keys(T).length >= 6) g.achieve('trofeos6', 'No queda ni uno');
  if (Object.keys(T).length >= 12) g.achieve('trofeos12', 'La sala de los trofeos');
}
function contar(g, H) {
  const { x, y, z } = H.casa, w = g.world;
  const n = { cocina: 0, cofre: 0, mesa: 0, silla: 0, barril: 0, luz: 0, cultivos: 0, trofeos: 0 };
  // la gente que vive aquí
  const G = (g.meta.gente && g.meta.gente.p) || {};
  n.gente = Object.values(G).filter((P) => P.fase === 2).length;
  n.abuelo = g.meta.anselmo && g.meta.anselmo.fase >= 5 ? 1 : 0;
  n.prima = g.meta.prima && g.meta.prima.fase >= 5 ? 1 : 0;
  for (let dx = -MARGEN; dx < ANCHO + MARGEN; dx++) for (let dz = -MARGEN; dz < FONDO + MARGEN; dz++) for (let dy = -1; dy <= 4; dy++) {
    const id = w.getBlock(x + dx, y + dy, z + dz);
    if (!id) continue;
    if (COCINA.has(id)) n.cocina++;
    else if (id === K.chest || id === K.baul) n.cofre++;
    else if (id === K.mesa_comedor) n.mesa++;
    else if (id === K.silla) n.silla++;
    else if (id === K.barril) n.barril++;
    else if (LUCES.has(id)) n.luz++;
    else if (BLOCKS[id] && BLOCKS[id].trofeo) n.trofeos++;
  }
  for (const k of w.crops) { const [cx, , cz] = k.split(',').map(Number); if (Math.hypot(cx - x - ANCHO / 2, cz - z - FONDO / 2) < 24) n.cultivos++; }
  return n;
}
const faltan = (nivel, n) => (nivel === 2
  ? [['Fogón u horno', n.cocina, 1], ['Otro cofre', n.cofre, 2], ['Mesa de comedor', n.mesa, 1], ['Silla', n.silla, 1]]
  : nivel === 3 ? [['Cultivos', n.cultivos, 6], ['Barril de lluvia', n.barril, 1], ['Faroles o lámparas', n.luz, 2]]
    : nivel === 4 ? [['Trofeos de jefes', n.trofeos || 0, 3]]
      : [['Gente viviendo aquí', n.gente || 0, 4], ['Don Anselmo de vuelta', n.abuelo || 0, 1], ['Marielos a la mesa', n.prima || 0, 1], ['Sillas para todos', n.silla, 8], ['Mesas de comedor', n.mesa, 2]]);

// cada segundo, si la casa ya está arreglada
export function tickNivelCasa(g, H) {
  if (!H.hogar || !H.casa || !H.construida) return;
  H.nivel = H.nivel || 1;
  // la finca produce aunque uno ande lejos
  const dia = g.day || 1;
  if (H.nivel >= 3 && H.diaFinca !== dia && g.time < 0.25) {
    H.diaFinca = dia;
    const be = g.world.getBE(H.casa.x + 1, H.casa.y + 1, H.casa.z + 5);
    if (be && be.slots) {
      for (const [id, c0] of [[263, 2], [261, 2], [270, 2]]) {
        const c = H.nivel >= 5 ? c0 * 2 : c0;
        const i = be.slots.findIndex((s) => s && s.id === id && s.count < 16), j = i >= 0 ? i : be.slots.findIndex((s) => !s);
        if (j < 0) continue;
        if (be.slots[j]) be.slots[j].count += c; else be.slots[j] = { id, count: c };
      }
      g.world.touchBE(H.casa.x + 1, H.casa.y + 1, H.casa.z + 5);
    }
  }
  if (H.nivel >= NIVELES.length) return;
  H.nivelT = (H.nivelT || 0) - 1;
  if (H.nivelT > 0) return;
  H.nivelT = 4;
  const p = g.player.body.pos;
  if (g.dim !== 'tierra' || !g.world.isLoaded(H.casa.x, H.casa.z) || Math.hypot(H.casa.x - p.x, H.casa.z - p.z) > 40) return;
  const n = contar(g, H);
  H.cuenta = n;
  if (faltan(H.nivel + 1, n).every(([, a, b]) => a >= b)) {
    H.nivel++;
    const N = NIVELES[H.nivel - 1];
    g.ui.regionBanner(`Su casa ahora es: ${N.t}`, N.ventaja);
    g.audio.play('aplausos', { ui: true, vol: 0.5 });
    g.achieve(`casa_nivel${H.nivel}`, N.t);
    g.addXP(H.nivel * 25);
    anotar(g, `La casa de la abuela ya es: ${N.t}.`, '🏡');
  }
}
const adentro = (g, H) => { const p = g.player.body.pos; return g.dim === 'tierra' && H && H.casa && p.x >= H.casa.x && p.x <= H.casa.x + ANCHO && p.z >= H.casa.z && p.z <= H.casa.z + FONDO && Math.abs(p.y - H.casa.y) < 5; };
const cerca = (g, H, r) => { const p = g.player.body.pos; return g.dim === 'tierra' && H && H.casa && Math.hypot(H.casa.x + ANCHO / 2 - p.x, H.casa.z + FONDO / 2 - p.z) < r; };
// lo que usa el juego
export const casa = {
  comida: (g) => { const H = g.meta && g.meta.hist; return H && (H.nivel || 1) >= 2 && adentro(g, H) ? 1.25 : 1; },
  durmioAqui: (g) => { const H = g.meta && g.meta.hist; return !!(H && (H.nivel || 1) >= 2 && cerca(g, H, 16)); },
  radio: (g) => { const H = g.meta && g.meta.hist, n = (H && H.nivel) || 1; return n >= 5 ? 90 : n >= 4 ? 70 : n >= 3 ? 52 : 34; },
  menosAsedio: (g) => { const H = g.meta && g.meta.hist; return H && (H.nivel || 1) >= 5 ? 2 : 0; },
  curaTodo: (g) => { const H = g.meta && g.meta.hist; return !!(H && (H.nivel || 1) >= 4 && cerca(g, H, 16)); },
};
export function hogarHTML(g) {
  const H = g.meta && g.meta.hist;
  if (!H || !H.hogar) return '';
  const nv = H.nivel || 1, N = NIVELES[nv - 1];
  let h = `<div class="prog-casa"><b>🏡 ${N.t}</b><span>${N.ventaja}</span>`;
  if (nv < NIVELES.length) {
    const n = H.cuenta || { cocina: 0, cofre: 0, mesa: 0, silla: 0, barril: 0, luz: 0, cultivos: 0, trofeos: 0, gente: 0, abuelo: 0, prima: 0 };
    h += `<small>Para «${NIVELES[nv].t}» (${NIVELES[nv].ventaja}): ${faltan(nv + 1, n).map(([t, a, b]) => `${a >= b ? '✔' : '✘'} ${t}${b > 1 ? ` ${Math.min(a, b)}/${b}` : ''}`).join(' · ')}</small>`;
  }
  return `${h}</div>`;
}

// ---------- la carpa: el campamento de uno (solo una a la vez cuenta) ----------
export function carpaPuesta(g, x, y, z) {
  const antes = g.meta.carpa;
  g.meta.carpa = { x, y, z };
  if (antes && !(antes.x === x && antes.z === z)) g.ui.toast('⛺ Su campamento ahora es este; el anterior ya no lo protege', 2600);
  else g.ui.toast('⛺ Campamento listo: duerma adentro para guardar este lugar. Las Sombras nacen más lejos', 3200);
  g.achieve('carpa', 'Campamento armado');
}
export function zonaCarpa(g, x, z) {
  const C = g.meta && g.meta.carpa;
  if (!C || g.dim !== 'tierra') return false;
  if (g.world.isLoaded(C.x, C.z) && g.world.getBlock(C.x, C.y, C.z) !== K.carpa) { g.meta.carpa = null; return false; }
  return Math.hypot(C.x - x, C.z - z) < 26;
}
