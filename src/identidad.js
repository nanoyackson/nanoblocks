// v13.3.5 (BI0 del plan de contenido del mundo, §9 B3): la IDENTIDAD de cada bioma en TIEMPO REAL, sin tocar el terreno (sin generador: vale
// también en los mundos viejos). Cada bioma ya tenía fauna, flora y sonido; faltaba algo propio «para ir a buscar». Aquí:
//  · un recurso por bioma, que sale al picar lo que ya hay: orquídea de neblina (nuboso), esquirlas del páramo (la roca de las alturas suelta
//    cristal), tuna (el cactus del desierto), coco (las palmas de la playa) y cacao silvestre (la selva); recetas: té de orquídea;
//  · una nota de libreta la primera vez que se pisa cada bioma, con lo que se busca ahí;
//  · fauna que faltaba donde el bioma la pide: el desierto ya no está vacío (zorro pelón, armadillo), el páramo (coyote) y el nuboso (rana dardo).
// Todo lo decide el anfitrión o quien juega solo; nada paga dinero (los ítems comunes no pagan).
import { BLOCK_BY_KEY as K } from './blocks.js';
import { difOf } from './supervivencia.js';
import { anotar } from './diario.js';

export const ORQUIDEA = 1196, TUNA = 1197, COCO = 1198, TE_ORQUIDEA = 1199;
const ESQUIRLA = 1192, CACAO = 408;

// el bioma de una columna, con el páramo también por altura (como el resto del juego: h > 98 es cordillera)
export const biomaDe = (g, x, z) => { const c = g.world.gen.column(Math.floor(x), Math.floor(z)); return c.biome === 'paramo' || c.h > 98 ? 'paramo' : c.biome; };

// al picar (survival): lo propio de cada bioma. `azar` se puede inyectar para probarlo.
export function alPicarBioma(g, b, x, y, z, azar = Math.random) {
  if (g.dim !== 'tierra' || !g.world || g.mode !== 'survival') return null;
  const drop = (id, n = 1) => g.entities.dropItem(id, n, x + 0.5, y + 0.4, z + 0.5);
  const bio = biomaDe(g, x, z);
  if (b.key === 'cactus' && azar() < 0.45) { drop(TUNA, 1 + (azar() < 0.3 ? 1 : 0)); return 'tuna'; }
  if ((b.leafy || b.key === 'tronco_musgoso' || b.key === 'musgo') && bio === 'nuboso' && azar() < 0.08) { drop(ORQUIDEA); return 'orquidea'; }
  if (b.leafy && bio === 'beach' && azar() < 0.14) { drop(COCO); return 'coco'; }
  if (b.leafy && bio === 'jungle' && azar() < 0.05) { drop(CACAO); return 'cacao'; }
  if (bio === 'paramo' && (b.key === 'stone' || b.key === 'cobble' || b.key === 'dirt') && azar() < 0.04) { drop(ESQUIRLA); return 'cristal_altura'; }
  return null;
}

// ---------- la libreta: una nota por bioma, la primera vez ----------
export const NOTAS = {
  nuboso: ['☁', 'Bosque nuboso: entre el musgo cuelgan orquídeas; al picar hojas y troncos musgosos a veces caen. Con una y agua se hace un té que calma.'],
  jungle: ['🌴', 'Selva: las hojas guardan cacao silvestre. El chocolate sale de ahí, y los hongos y las lapas también.'],
  desert: ['🌵', 'Desierto: el cactus da tuna (comida y sed). De día hay zorros pelones y armadillos; de noche, alacranes: no duerma en la arena.'],
  paramo: ['🏔', 'Páramo: la roca de las alturas suelta esquirlas de cristal frío. Abríguese, y llévese el cristal para el farol y el eco.'],
  beach: ['🏖', 'Playa: las palmas dan cocos. Con un poco de suerte, tortugas y nidos.'],
  bosque_seco: ['🌾', 'Bosque seco: guanacastes con su oreja de semilla, venados y zopilotes. En verano el aire quema.'],
  manglar: ['🐊', 'Manglar: raíces zancudas, cangrejos y garzas. El agua de aquí es dulce y salada a la vez; las perlas viven cerca.'],
  volcano: ['🌋', 'Volcán: azufre, obsidiana y fumarolas. La mascarilla y las botas de ceniza lo hacen soportable.'],
  mountains: ['⛰', 'Montaña: roca desnuda y viento. Desde arriba se ve todo el camino recorrido.'],
};
function visto(g, k) { const V = (g.meta.biomasVistos ||= {}); if (V[k]) return true; V[k] = 1; return false; }

// ---------- fauna que faltaba (la pide el anfitrión desde trySpawn) ----------
export function identidadSpawn(E, g) {
  if (g.dim !== 'tierra' || !g.world || g.meta.invitado) return false;
  const pl = g.player.body.pos, w = g.world, day = g.daylight > 0.5;
  const a = Math.random() * Math.PI * 2, r = 14 + Math.random() * 22, x = Math.floor(pl.x + Math.cos(a) * r), z = Math.floor(pl.z + Math.sin(a) * r);
  if (!w.isLoaded(x, z)) return false;
  const bio = biomaDe(g, x, z), cuenta = (t) => E.mobs.filter((m) => !m.dead && m.type === t).length;
  let tipo = null, tope = 2, quiere = day;
  if (bio === 'desert') { tipo = Math.random() < 0.55 ? 'zorro_pelon' : 'armadillo'; tope = 2; quiere = day || tipo === 'armadillo'; }
  else if (bio === 'paramo') { tipo = 'coyote'; tope = 2; }
  else if (bio === 'nuboso') { tipo = 'rana_dardo'; tope = 3; quiere = true; }
  if (!tipo || !quiere || cuenta(tipo) >= tope) return false;
  if (tipo === 'coyote' && (g.mode !== 'survival' || !g.settings.hostiles || !difOf(g).hostiles)) return false; // el coyote puede morder: solo donde hay peligros
  for (let y = Math.floor(pl.y) + 6; y > Math.floor(pl.y) - 10; y--) {
    const sol = w.getBlock(x, y - 1, z);
    if (sol && w.getBlock(x, y, z) === 0 && w.getBlock(x, y + 1, z) === 0 && sol !== K.water) return !!E.spawnMob(tipo, x + 0.5, y + 0.02, z + 0.5);
  }
  return false;
}

// una vez por cuadro: la nota al pisar un bioma nuevo
export function tickIdentidad(g, dt) {
  if (g.dim !== 'tierra' || !g.env || !g.player || !g.player.alive || g.meta.invitado) return;
  g.identT = (g.identT || 0) - dt; if (g.identT > 0) return; g.identT = 1;
  const bio = biomaDe(g, g.player.body.pos.x, g.player.body.pos.z), N = NOTAS[bio];
  if (N && !visto(g, bio)) anotar(g, N[1], N[0]);
}

// al comer: el té de orquídea calma
export function alComerIdentidad(g, id) {
  if (id !== TE_ORQUIDEA) return;
  g.addEffect('calma', 90);
  g.ui.toast('🌸 El té de orquídea le calma los nervios: 90 segundos con menos hambre y sin sobresaltos', 2600);
  g.achieve('te_orquidea', 'Té de orquídea del bosque nuboso');
}
