// v13.3.4 (CC1 del plan de contenido del mundo): botín, recetas y peligros de las cuevas en TIEMPO REAL (sin generador: valen también en los
// mundos viejos). Lo que hay aquí:
//  · esquirlas de cristal que sueltan los racimos y los bloques de cristal al picarlos (`alPicarCueva`);
//  · el Cristal de eco (clic derecho bajo tierra: marca 20 s los salones y hitos a ≤ 120 bloques en el minimapa; 12 usos) (`usarCuevaCosas`);
//  · la lente del casco (+ luz bajo tierra) (`bonoLuzCueva`) y la sopa de hongo (visión nocturna 2 minutos, `alComerCuevaCosa`);
//  · dos peligros que decide el anfitrión o quien juega solo: el AIRE MALO (bolsas fijas por semilla, bajo y 46, 3 de daño como máximo por
//    evento, cura: picar un hueco para ventilar, la mascarilla en la mochila, la linterna de cristal o salir) y la ESTALACTITA QUE CAE
//    (solo por el ruido de picar, con sombra 1,2 s antes y 3 de daño). Apagados en modo pacífico y creativo. Ninguno mata de un golpe.
import { AIR, BLOCK_BY_KEY as K } from './blocks.js';
import { hash3 } from './noise.js';
import { difOf } from './supervivencia.js';
import { anotar } from './diario.js';
import { hondoAqui } from './salonlugar.js';

export const ESQUIRLA = 1192, ECO = 1193, LENTE = 1194, SOPA = 1195;
const MASCARILLA = 525;

// ---------- el aire malo: bolsas de 20 × 12 × 20 bloques, por semilla ----------
const CELDA = 20, ALTO = 12, PROB_AIRE = 0.07, Y_AIRE = 46;
export function bolsaDeAire(seed, x, y, z) {
  if (y >= Y_AIRE || y < 4) return null;
  const cx = Math.floor(x / CELDA), cy = Math.floor(y / ALTO), cz = Math.floor(z / CELDA);
  return hash3(seed ^ 0x5a17, cx, cy * 17 + 3, cz) < PROB_AIRE ? `${cx},${cy},${cz}` : null;
}
// v13.7.1 (La Hondura): toda cámara de azufre es una bolsa de aire malo (la mascarilla protege y picar un hueco ventila, como en cualquier bolsa)
export function bolsaAqui(gen, x, y, z) {
  const hn = hondoAqui(gen, x, y, z);
  return hn && hn.tipo === 'azufre' ? `h${hn.gx},${hn.gz}` : bolsaDeAire(gen.seed, x, y, z);
}
const FUENTES_LUZ = () => [K.farol_cristal];
function llevaProteccion(g) {
  if (g.inventory.count(MASCARILLA) > 0) return true;
  // un farol de cristal en la mano o la barra mantiene el aire limpio cerca
  const h = g.inventory.slots[g.inventory.selected];
  return !!(h && FUENTES_LUZ().includes(h.id));
}
export const conLente = (g) => { const h = g.inventory.armor && g.inventory.armor[0]; return !!(h && h.id === LENTE); };
// lo que sube el brillo bajo tierra con la lente (se suma en game.js a lo del casco)
export const bonoLuzCueva = (g) => (conLente(g) ? 0.14 : 0);

function estado(g) { return g.cuevaCosas || (g.cuevaCosas = { aire: 0, aviso: 0, ventilados: new Map(), caida: null, cdEvento: 0, eco: 0 }); }

// una vez por cuadro (con `dt` real)
export function tickCuevaCosas(g, dt) {
  const S = estado(g);
  if (S.eco > 0) S.eco -= dt;
  if (g.dim !== 'tierra' || !g.world || !g.player || !g.player.alive) { S.aire = 0; return; }
  S.cdEvento -= dt;
  const p = g.player.body.pos, peligro = g.mode === 'survival' && g.settings.hostiles !== false && difOf(g).hostiles; // v13.3.4-red: también el invitado (su vida es suya; el bloque que cae viaja al anfitrión por redCambio)
  // --- la estalactita en el aire (sombra y caída) ---
  if (S.caida) {
    const c = S.caida; c.t -= dt;
    if (c.t > 0) { if (Math.random() < dt * 12) g.particles.spawn(c.x + 0.5 + (Math.random() - 0.5) * 0.9, c.piso + 0.15, c.z + 0.5 + (Math.random() - 0.5) * 0.9, [0.1, 0.1, 0.1], 0, 0.02, 0, 0.5, 0, true); }
    else {
      S.caida = null;
      if (g.world.getBlock(c.x, c.y, c.z) === K.stalactite) {
        g.world.setBlock(c.x, c.y, c.z, AIR);
        g.particles.blockBreak(c.x, c.y, c.z, K.stalactite);
        g.audio.material('stone', 'break', { x: c.x + 0.5, y: c.y + 0.5, z: c.z + 0.5 });
        if (Math.hypot(p.x - (c.x + 0.5), p.z - (c.z + 0.5)) < 1.3 && p.y < c.y + 1 && p.y > c.piso - 1) {
          g.damagePlayer(3, c.x + 0.5, c.z + 0.5, 'Le cayó una estalactita');
        } else { g.achieve('estalactita_esquivada', 'Se la quitó de encima: una estalactita falló'); }
      }
    }
  }
  // --- el aire malo ---
  if (!peligro || !g.env || g.env.cave < 0.6) { S.aire = Math.max(0, S.aire - dt * 2); return; }
  // v13.7.1: el calor de horno en las cámaras de fragua y ceniza: efecto «calor» (más hambre y sed); se va al salir
  const hc = hondoAqui(g.world.gen, p.x, p.y, p.z);
  if (hc && (hc.tipo === 'fragua' || hc.tipo === 'ceniza')) {
    S.calorT = (S.calorT || 0) - dt;
    if (S.calorT <= 0) { S.calorT = 1; g.addEffect('calor', 3); if (!S.calorAviso) { S.calorAviso = 1; g.ui.toast('🔥 Hace un calor de horno: da más hambre y más sed. Salga o refresque con agua', 3200); } }
  } else S.calorAviso = 0;
  const bolsa = bolsaAqui(g.world.gen, p.x, p.y, p.z);
  const ventil = bolsa ? S.ventilados.get(bolsa) : 0;
  if (!bolsa || (ventil && ventil > (g.clock || 0)) || llevaProteccion(g)) { S.aire = Math.max(0, S.aire - dt * 2); S.aviso = 0; return; }
  if (S.aviso === 0) { S.aviso = 1; g.ui.toast('💨 Aire malo: las antorchas se ahogan. Pique un hueco para ventilar, o salga', 3200); anotarUna(g, 'aire', 'El aire malo se junta en bolsas hondas: picar un hueco lo ventila; con mascarilla en la mochila no pasa nada.'); }
  S.aire += dt;
  if (Math.random() < dt * 4) g.particles.spawn(p.x + (Math.random() - 0.5) * 3, p.y + 0.5 + Math.random() * 1.5, p.z + (Math.random() - 0.5) * 3, [0.35, 0.55, 0.2], 0, 0.03, 0, 1.2, 0, true);
  if (S.aire >= 6 && S.cdEvento <= 0) { S.cdEvento = 10; S.aire = 4; g.damagePlayer(1, null, null, 'Se asfixió con el aire malo', true, true); }
}

// al picar un bloque (survival): esquirlas, ventilar y el ruido que tumba una estalactita
export function alPicarCueva(g, b, x, y, z) {
  if (g.dim !== 'tierra') return;
  if (b.key === 'cristal' || b.key === 'cristal_bloque') {
    const n = b.key === 'cristal' ? 1 + (Math.random() < 0.4 ? 1 : 0) : 2 + (Math.random() < 0.5 ? 1 : 0);
    g.entities.dropItem(ESQUIRLA, n, x + 0.5, y + 0.4, z + 0.5);
    anotarUna(g, 'esquirla', 'Los racimos de cristal sueltan esquirlas: con ellas se arma un farol que no se apaga y un cristal que hace eco.');
  }
  if (!g.world || g.mode !== 'survival') return;
  const S = estado(g);
  // ventilar: picar dentro de una bolsa de aire malo la limpia 2 minutos
  const bolsa = bolsaAqui(g.world.gen, x, y, z);
  if (bolsa) { S.ventilados.set(bolsa, (g.clock || 0) + 120); if (S.aire > 0) { g.ui.toast('🌬 Ventiló: el aire vuelve a correr', 1800); g.achieve('ventilo', 'Ventiló una bolsa de aire malo'); } }
  // el ruido: una estalactita arriba, a ≤ 7 bloques a lo ancho, puede caer (≥ 10 s entre eventos)
  if (S.caida || S.cdEvento > 0 || !difOf(g).hostiles || g.settings.hostiles === false || Math.random() > 0.08) return;
  const w = g.world;
  for (let k = 0; k < 14; k++) {
    const sx = Math.floor(x + (Math.random() - 0.5) * 14), sz = Math.floor(z + (Math.random() - 0.5) * 14), sy0 = Math.floor(y + 1 + Math.random() * 5);
    if (w.getBlock(sx, sy0, sz) !== K.stalactite) continue;
    let piso = sy0 - 1; while (piso > 2 && w.getBlock(sx, piso, sz) === AIR) piso--;
    if (sy0 - piso > 12) continue;
    S.caida = { x: sx, y: sy0, z: sz, piso: piso + 1, t: 1.2 }; S.cdEvento = 10;
    g.ui.toast('🪨 ¡Algo cruje arriba!', 1400);
    anotarUna(g, 'estalactita', 'El ruido de picar puede soltar una estalactita: la sombra en el piso avisa un segundo antes.');
    return;
  }
}

// clic derecho con el Cristal de eco en la mano
export function usarCuevaCosas(g, held) {
  if (held.id !== ECO) return false;
  if (g.dim !== 'tierra' || !g.env || g.env.cave < 0.5) { g.ui.toast('🔔 El cristal solo hace eco bajo tierra', 1800); return true; }
  const S = estado(g);
  S.eco = 20;
  g.ui.toast('🔔 El cristal suena: salones y hitos a 120 bloques quedan marcados 20 s en el minimapa', 2800);
  g.audio.play('craft', { ui: true, vol: 0.4, pitch: 0.6 });
  if (g.mode === 'survival') g.inventory.wearHeld();
  g.achieve('cristal_eco', 'Un cristal que habla: el Cristal de eco');
  return true;
}
export const ecoActivo = (g) => !!(g.cuevaCosas && g.cuevaCosas.eco > 0);

// al comer: la sopa de hongo da vista nocturna
export function alComerCuevaCosa(g, id) {
  if (id !== SOPA) return;
  g.addEffect('vista_noche', 120);
  g.ui.toast('🍄 La sopa le abre los ojos: vista nocturna 2 minutos', 2600);
  g.achieve('sopa_hongo', 'Sopa de hongo');
}

function anotarUna(g, k, texto) {
  const V = (g.meta.cuevasVistas ||= {});
  if (V[k] || g.meta.invitado) return;
  V[k] = 1; anotar(g, texto, '📖');
}
