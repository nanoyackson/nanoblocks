// C3 «Lluvia y verano» (v12.3.0, docs/revisiones/DISENO_CONTENIDO_C1-C4.md): las temporadas de 30 días, el aguacero de las dos en
// invierno, la temperatura del cuerpo (frío y calor) con la ropa que la cambia, y la lluvia sobre el zinc. Nada se guarda: la temporada
// sale de g.day y la temperatura (g.cuerpo) se recalcula cada segundo.
import { BLOCK_BY_KEY as K, getDef } from './blocks.js';
import { hash3 } from './noise.js';
import { difOf, consejoUnaVez } from './supervivencia.js';
import { exposicionSol, fogataCerca } from './supervivencia2.js';
import { calmaActiva } from './calma.js';

export const DIAS_TEMPORADA = 30;
export const CAPOTE = 571, SOMBRERO_PAJA = 572, COBIJA = 573;
const SOMBREROS_SOL = { [SOMBRERO_PAJA]: 15, 412: 10, 405: 10 }; // paja, sabanero, tule: cuánto sol quitan
const METALES = new Set(['iron', 'diamond', 'jade']);

// la temporada de un día (1 → verano): 30 días cada una
export const temporadaDe = (day) => (Math.floor(((day || 1) - 1) / DIAS_TEMPORADA) % 2 === 0 ? 'verano' : 'invierno');
// cuántos días le quedan a la temporada (los últimos 4 son de transición: la lluvia empieza o afloja de a poco)
export const quedanDias = (day) => DIAS_TEMPORADA - (((day || 1) - 1) % DIAS_TEMPORADA);

// lo que dice la tele del tiempo (de verdad)
export function pronostico(g) {
  const T = temporadaDe(g.day), q = quedanDias(g.day);
  if (T === 'invierno') return q <= 4 ? '📺 El pronóstico: «Ya va aflojando el invierno: pocos días de aguacero»' : '📺 El pronóstico: «Mañana: aguacero a las dos, como siempre»';
  return q <= 4 ? '📺 El pronóstico: «Se viene el invierno: alisten el capote»' : '📺 El pronóstico: «Sol y calor, época seca: cuide el agua»';
}

// ---------- la temperatura del cuerpo ----------
const BASE = { beach: 16, ocean: 14, jungle: 8, selva: 8, manglar: 8, swamp: 8, desert: 18, bosque_seco: 16, guanacaste: 16, savanna: 12, mountains: -15, snowy: -40, paramo: -35, nuboso: -8 };
function techoDe(g) {
  const q = g.player.body.pos, w = g.world, x = Math.floor(q.x), z = Math.floor(q.z);
  for (let y = Math.floor(q.y) + 2; y < Math.floor(q.y) + 25; y++) { const id = w.getBlock(x, y, z); if (id) return id; }
  return 0;
}
export function objetivoCuerpo(g) {
  const P = g.player, fx = P.effects, inv = g.inventory;
  const bio = g.env && g.env.biome, noche = (g.daylight ?? 1) < 0.35;
  let t = BASE[bio] ?? 0;
  if (bio === 'paramo' && noche) t = -55; else if (noche) t -= 15;
  t += temporadaDe(g.day) === 'verano' ? 10 : -5;
  const cabeza = inv.armor[0] ? inv.armor[0].id : 0;
  t += Math.max(0, exposicionSol(g) * 35 - (SOMBREROS_SOL[cabeza] || 0)); // pleno sol de verano en la costa: 16 + 10 + 35 = 61 → calor
  t -= (g.mojado || 0) * 0.4;
  const q = P.body.pos;
  if (fogataCerca(g, q.x, q.y, q.z, 4)) t += 40;
  if (fx.termal) t += 25; // la cobija de lana (y las aguas termales)
  // el metal (casco o pechera de hierro, diamante o jade) calienta con calor y enfría con frío
  const metal = [inv.armor[0], inv.armor[1]].some((a) => a && getDef(a.id) && METALES.has(getDef(a.id).mat));
  if (metal) t += t > 0 ? 8 : -8;
  return t;
}

// ---------- cada segundo ----------
export function tickTemporadas(g) {
  if (g.dim !== 'tierra' || !g.player.alive) return;
  const P = g.player, fx = P.effects, W = g.weather;
  // el aguacero de las dos: en invierno, casi todos los días (80 %), entre la 1:30 y las 3 de la tarde, unos 2 minutos
  const T = temporadaDe(g.day);
  if (W && T === 'invierno' && g.time > 0.3125 && g.time < 0.375 && g.aguaceroDia !== g.day && !(g.asedio || g.nocheLarga || g.torneo || g.bingo || g.meta.huracan || g.sequia || g.tsunami)) {
    g.aguaceroDia = g.day;
    const ultimos = quedanDias(g.day) <= 4;
    if (hash3(g.meta.seed || 1, g.day, 202, 7) < (ultimos ? 0.4 : 0.8)) {
      W.set('rain'); W.timer = 120;
      g.ui.toast('☔ El aguacero de las dos, como siempre: mejor bajo techo', 3000);
      g.aguaceroHoy = true;
    }
  }
  const lloviendo = W && W.type !== 'clear' && W.intensity > 0.35;
  // bajo zinc: la lluvia de afuera suena más bajito y repica en la lámina
  const techo = techoDe(g);
  g.bajoZinc = lloviendo && (techo === K.zinc || techo === K.lamina_metal);
  if (g.bajoZinc) {
    consejoUnaVez(g, 'zinc', '🏠 Techo de zinc bien puesto: sin goteras', 4200);
    if (g.aguaceroHoy && g.time > 0.3125 && g.time < 0.4) g.achieve('aguacero_dos', 'Aguacero de las dos');
  }
  // el capote: seco bajo el aguacero
  if (lloviendo && !techo && g.inventory.armor[1] && g.inventory.armor[1].id === CAPOTE) g.achieve('capote', 'Seco en pleno aguacero');
  // la temperatura del cuerpo
  if (g.mode !== 'survival') return;
  const obj = objetivoCuerpo(g);
  g.cuerpo = (g.cuerpo ?? obj) + (obj - (g.cuerpo ?? obj)) * 0.05;
  const corre = difOf(g).name === 'Tranquilo' ? 15 : 0;
  if (g.cuerpo <= -50 - corre) {
    if (!fx.escalofrio) g.ui.toast('🥶 Le entró el frío: arrímese a la fogata o póngase la cobija', 3000);
    g.addEffect('escalofrio', Math.max(fx.escalofrio || 0, 6));
  }
  if (g.cuerpo >= 60 + corre) {
    if (!fx.calor) { g.ui.toast('🥵 Hace calor: busque sombra, tome agua y use sombrero de paja', 3000); }
    g.addEffect('calor', 4);
    // v12.4.6 (C3): suda (gotitas que caen de la cabeza) y del suelo al sol sube aire tibio
    const q = g.player.body.pos;
    if (!calmaActiva(g)) for (let i = 0; i < 2; i++) g.particles.spawn(q.x + (Math.random() - 0.5) * 0.5, q.y + 1.55, q.z + (Math.random() - 0.5) * 0.5, [0.75, 0.88, 1], 0, -1.2, 0, 0.6, 0, false);
    if (g.daylight > 0.6 && !calmaActiva(g)) for (let i = 0; i < 4; i++) g.particles.spawn(q.x + (Math.random() - 0.5) * 8, q.y + 0.1, q.z + (Math.random() - 0.5) * 8, [1, 0.97, 0.9], 0, 0.7, 0, 1.4, 0, true);
  }
}
// el aguacero de afuera se oye más bajito bajo el zinc (game.js multiplica la lluvia por esto) y repica en la lámina
export function tickZinc(g, dt) {
  if (!g.bajoZinc) return 1;
  g.zincT = (g.zincT || 0) - dt;
  if (g.zincT <= 0) {
    g.zincT = 0.1 + Math.random() * 0.07; // 6 a 10 por segundo
    g.audio.play('toolbreak', { ui: true, vol: 0.06 + Math.random() * 0.04, pitch: 1.6 + Math.random() * 0.4 });
  }
  return 0.5;
}
// la cobija de lana: clic derecho, 4 minutos de abrigo (5 usos)
export function usarCobija(g) {
  const s = g.inventory.held;
  if (!s || s.id !== COBIJA) return false;
  if ((g.player.effects.termal || 0) > 60 && (g.cuerpo ?? 0) >= -20) { g.ui.toast('🧣 Ya anda bien abrigado', 1400); return true; } // v12.4.4: sin gastar usos
  g.addEffect('termal', 240);
  if (g.cuerpo !== undefined) g.cuerpo = Math.max(g.cuerpo, -20); // v12.4.4: calienta de una (antes el escalofrío volvía unos 10 s)
  delete g.player.effects.escalofrio;
  g.ui.toast('🧣 Se envolvió en la cobija de lana: 4 minutos calientito', 2200);
  if (g.mode === 'survival') { s.dur = (s.dur ?? 5) - 1; if (s.dur <= 0) g.inventory.consumeHeld(1); g.inventory.changed(); }
  return true;
}
// cambio de temporada (lo llama game.js): el aviso y el logro del invierno completo
export function alCambiarTemporada(g, antes, ahora) {
  if (!antes) return;
  g.ui.toast(ahora === 'invierno' ? '🌧 Entró el invierno: aguaceros casi todas las tardes. Los cultivos se alegran' : '☀ Entró el verano: época seca, cuide el agua', 3000);
  if (antes === 'invierno' && ahora === 'verano' && g.meta.inviernoDesde && g.day - g.meta.inviernoDesde >= DIAS_TEMPORADA - 1) g.achieve('invierno', 'Un invierno completo');
  if (ahora === 'invierno') g.meta.inviernoDesde = g.day;
}
