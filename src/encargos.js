// Los encargos de la gente de la casa: cada persona dejó algo atrás, en el lugar de donde la dejaron de esperar. Uno va por eso, a una ruina en el monte
// con Sombras cuidándola, y al traerlo esa persona sube de nivel: hace más por uno. Con los cuatro, los domingos se come en la mesa larga.
// Estado: meta.gente.p[k].enc = { pos, hecha, sacado, dia } y meta.gente.p[k].nivel.
import { BLOCK_BY_KEY as K, AIR, SOLID } from './blocks.js';
import { anotar } from './diario.js';
import { puestoSombra } from './asedio.js';
import { structuresNear, structRadius } from './estructuras.js';
import { difOf, todosBolsos } from './supervivencia.js';

const ANCHO = 9, FONDO = 7, COLON = 360;
export const ENCARGOS = {
  tino: {
    item: 513, cosa: 'el martillo de Ñor Tino', i: '🔨', lugar: 'la herrería vieja', material: () => K.cobble,
    pide: 'Le voy a pedir un favor. Mi martillo se quedó en la herrería, cuando me fui. Tiene sesenta años y es lo único que me hace caso. Se lo marco en la brújula. Cuidado, que ese pueblo ya no es de nadie.',
    gracias: 'Déjeme verlo. Sí. Sí, mire la marca que le hice en el mango cuando nació mi hija. …Bueno. Con este martillo le arreglo todo lo que trae puesto, no solo lo de la mano. Y en el yunque, ahora sí, le saco una cuarta estrella a lo que sea. Hágase para acá.',
    placa: ['La herrería', 'Un rótulo caído: «Se arregla de todo». Abajo, con otra letra: «Cerrado por falta de todo».'],
  },
  chepa: {
    item: 514, cosa: 'el recetario de Niña Chepa', i: '📖', lugar: 'la soda cerrada', material: () => K.planks,
    pide: '¿Sabe qué extraño? Mi cuaderno de recetas. Se quedó en la soda, atrás de la refri. Son cuarenta años de manchas de manteca. Si me lo trae, le cocino como se debe, no como hasta ahora.',
    gracias: '¡Ay, mi cuaderno! Mire: aquí está la sopa negra de mi mamá, y aquí la de la vecina, que es peor pero se la copié. Desde hoy, dos platos por día. Y con buena cara, que es lo más difícil.',
    placa: ['La soda', 'En la pizarra todavía se lee: «Hoy: casado». No dice de qué año.'],
  },
  flor: {
    item: 515, cosa: 'la mata de Doña Flor', i: '🌸', lugar: 'el rancho de la curandera', material: () => K.adobe,
    pide: 'En mi rancho dejé una mata que no se da en otra parte. Con ella curaba lo que no se ve. No crea que es brujería: es que la gente mejora cuando alguien le hace caso. Pero la mata ayuda. Tráigamela, mi criatura.',
    gracias: 'Sigue viva. ¿Ve? Las cosas aguantan más de lo que uno cree, si alguien vuelve por ellas. La voy a sembrar en el patio. Desde hoy, además de curarle, le dejo un botiquín por día.',
    placa: ['El rancho', 'Un letrero escrito a mano: «Se cura de todo menos de la envidia».'],
  },
  wilber: {
    item: 516, cosa: 'el catalejo de Mae Wilber', i: '🔭', lugar: 'la caseta de la finca', material: () => K.planks,
    pide: 'Mae, en la caseta de la finca dejé un catalejo. No sé por qué lo dejé. Bueno, sí sé: cuando caí en la cuenta de que no había nada que cuidar, ni volví. Tráigamelo y le hago un mirador en el patio, para ver venir lo que sea.',
    gracias: 'Pura vida. Esto lo cambia todo, mae: ya veo a lo lejos. Mire ese palo. Es un palo. Pero lo vi de lejos. Voy a levantar el mirador, y desde ahí pego más duro y más lejos.',
    placa: ['La caseta', 'Un cuaderno de turnos. La última línea: «Sin novedad». Fecha: hace nueve años.'],
  },
};
const ORDEN = ['tino', 'chepa', 'flor', 'wilber'];

// ni en un pueblo, ni sobre un monumento, ni cerca de lo que uno tenga
export function sitioLibre(g, x, z, r) {
  const gen = g.world.gen, M = g.meta, v = g.nearestVillage(x, z);
  if (v && v.dist < (v.v.R || 100) + r + 8) return false;
  if (structuresNear(gen, x, z, 28 + r).some((q) => Math.hypot(q.x - x, q.z - z) < structRadius(gen, q.type) + r + 6)) return false;
  for (const q of [M.spawn, M.lote, M.marca, ...todosBolsos(g), ...(M.marcadores || []), ...(M.faroles || [])]) if (q && Math.hypot(q.x - x, q.z - z) < r + 40) return false;
  return true;
}
function sitio(g, H) {
  const gen = g.world.gen;
  for (const [a0, b0] of [[170, 320], [140, 480], [100, 700]]) for (let t = 0; t < 200; t++) {
    const a = Math.random() * Math.PI * 2, r = a0 + Math.random() * (b0 - a0);
    const x = Math.floor(H.casa.x + Math.cos(a) * r), z = Math.floor(H.casa.z + Math.sin(a) * r), c = gen.column(x, z);
    if (c.h <= 64 || c.h > 100 || ['ocean', 'beach', 'manglar', 'volcano'].includes(c.biome)) continue;
    let plano = true;
    for (let dx = -3; dx <= 3 && plano; dx += 3) for (let dz = -3; dz <= 3; dz += 3) if (Math.abs(gen.column(x + dx, z + dz).h - c.h) > 2) { plano = false; break; }
    if (!plano) continue;
    if (!sitioLibre(g, x, z, 8)) continue;
    return { x, y: c.h, z };
  }
  return { x: Math.floor(H.casa.x) + 180, y: gen.column(Math.floor(H.casa.x) + 180, Math.floor(H.casa.z)).h, z: Math.floor(H.casa.z) };
}
// una ruina de 7×7 con el cofre adentro
function levantar(g, E, D, H) {
  const w = g.world, Q = E.pos, mat = D.material();
  const y = g.world.gen.column(Q.x, Q.z).h;
  // lo que alguien puso ahí no se toca: la ruina se va a otro lado
  for (let dx = -3; dx <= 3; dx++) for (let dz = -3; dz <= 3; dz++) for (let k = 0; k <= 6; k++) if (w.getBE(Q.x + dx, y + k, Q.z + dz)) { E.pos = sitio(g, H); return; }
  Q.y = y;
  for (let dx = -3; dx <= 3; dx++) for (let dz = -3; dz <= 3; dz++) {
    const x = Q.x + dx, z = Q.z + dz;
    for (let k = 1; k <= 6; k++) if (w.getBlock(x, y + k, z) !== AIR) w.setBlock(x, y + k, z, AIR);
    if (!SOLID[w.getBlock(x, y, z)]) w.setBlock(x, y, z, K.dirt);
    if (Math.abs(dx) === 3 || Math.abs(dz) === 3) {
      if (dx === 0 && dz === -3) continue; // la entrada
      const alto = 1 + ((dx * 7 + dz * 13 + 40) % 3); // paredes caídas, parejas no
      for (let k = 1; k <= alto; k++) w.setBlock(x, y + k, z, mat);
    }
  }
  w.setBlock(Q.x, y + 1, Q.z + 2, K.chest);
  g.stations.placed(K.chest, Q.x, y + 1, Q.z + 2, 0);
  const be = w.getBE(Q.x, y + 1, Q.z + 2);
  if (be && be.slots) { be.slots[0] = { id: D.item, count: 1 }; be.slots[1] = { id: COLON, count: 15 }; w.touchBE(Q.x, y + 1, Q.z + 2); }
  w.setBlock(Q.x + 1, y + 1, Q.z - 2, K.placa);
  w.setBE(Q.x + 1, y + 1, Q.z - 2, { title: D.placa[0], text: D.placa[1] });
  E.hecha = true;
}
function guardias(g, E) {
  const dia = g.day || 1, Q = E.pos, n = 3 + Math.min(2, Math.floor(dia / 12));
  for (let i = 0; i < n; i++) {
    const q = puestoSombra(g, Q.x, Q.z, Q.y + 1, (i / n) * Math.PI * 2, 6);
    if (!q) continue;
    const m = g.entities.spawnMob(dia >= 12 && i === 0 ? 'sombra_escudo' : 'sombra', q.x + 0.5, q.y + 0.2, q.z + 0.5);
    if (m) { m.data.apuro = true; m.data.provoked = true; m.health += Math.min(12, Math.floor(dia / 3)); }
  }
  g.audio.play('sombra', { ui: true, vol: 0.5 });
  g.ui.toast('🌑 El lugar no estaba tan solo', 2200);
}

// lo llama hablar con la persona: true si ya dijo algo
export function encargoInteract(g, k, P, H, diga) {
  const D = ENCARGOS[k], dia = g.day || 1;
  if (!D || (P.nivel || 1) >= 2) return false;
  if (!P.enc) {
    if (dia - (P.desde ?? dia) < 1) return false; // el primer día solo se acomoda
    P.enc = { pos: sitio(g, H), dia };
    diga(D.pide, 11000);
    anotar(g, `${D.cosa[0].toUpperCase()}${D.cosa.slice(1)} se quedó en ${D.lugar}.`, D.i);
    return true;
  }
  const lo = g.inventory.count(D.item) > 0;
  if (!lo && !P.enc.sacado) return false;
  if (lo) g.inventory.remove(D.item, 1);
  P.nivel = 2; P.enc = { hecho: true };
  g.addXP(40);
  g.audio.play('aplausos', { ui: true, vol: 0.4 });
  diga(lo ? D.gracias : `Se le cayó, ¿verdad? No importa: alguien me lo dejó en la puerta. ${D.gracias}`, 11000);
  g.achieve('encargo_casa', 'Volví por lo que dejaron');
  if (k === 'wilber') levantarMirador(g, H);
  if (ORDEN.every((q) => g.meta.gente.p[q] && g.meta.gente.p[q].nivel >= 2)) { g.ui.regionBanner('La mesa larga', 'Desde hoy, los domingos se come juntos en esta casa'); g.achieve('mesa_larga', 'La mesa larga'); anotar(g, 'Los domingos ya se come en la mesa larga.', '🍲'); }
  return true;
}
function levantarMirador(g, H) {
  const w = g.world;
  // la esquina del patio con menos cosas; y lo que haya ahí no se toca
  const esquinas = [[H.casa.x - 5, H.casa.z - 5], [H.casa.x + ANCHO + 2, H.casa.z - 5], [H.casa.x - 5, H.casa.z + FONDO + 5], [H.casa.x + ANCHO + 2, H.casa.z + FONDO + 5]];
  const estorbo = ([x0, z0]) => {
    const y = w.gen.column(x0 + 1, z0 + 1).h;
    let n = 0;
    for (let dx = -1; dx <= 8; dx++) for (let dz = -1; dz <= 3; dz++) for (let k = 1; k <= 7; k++) if (SOLID[w.getBlock(x0 + dx, y + k, z0 + dz)] || w.getBE(x0 + dx, y + k, z0 + dz)) n++;
    return n;
  };
  const [x0, z0] = esquinas.filter(([x, z]) => w.isLoaded(x, z) && w.isLoaded(x + 8, z + 3)).sort((p, q) => estorbo(p) - estorbo(q))[0] || [];
  if (x0 === undefined) return;
  const y = w.gen.column(x0 + 1, z0 + 1).h;
  const poner = (x, py, z, id) => { if (!SOLID[w.getBlock(x, py, z)] && !w.getBE(x, py, z)) w.setBlock(x, py, z, id); };
  for (const [dx, dz] of [[0, 0], [2, 0], [0, 2], [2, 2]]) for (let k = 1; k <= 5; k++) poner(x0 + dx, y + k, z0 + dz, K.log);
  for (let dx = -1; dx <= 3; dx++) for (let dz = -1; dz <= 3; dz++) {
    poner(x0 + dx, y + 6, z0 + dz, K.planks);
    if ((dx === -1 || dx === 3 || dz === -1 || dz === 3) && K.cerca && !(dx === 3 && dz === 1)) poner(x0 + dx, y + 7, z0 + dz, K.cerca);
  }
  // la subida: gradas que llegan al portillo de la baranda
  for (let k = 1; k <= 5; k++) poner(x0 + 9 - k, y + k, z0 + 1, K.planks);
  H.mirador = { x: x0 + 1, y: y + 7, z: z0 + 1 };
  // que se suba de una vez
  for (const m of g.entities.mobs) if (!m.dead && m.data && m.data.gente === 'wilber') m.dead = true;
}
// cada segundo
export function tickEncargos(g, G, H) {
  const p = g.player.body.pos, w = g.world, dia = g.day || 1;
  for (const k of ORDEN) {
    const P = G.p[k], E = P && P.enc;
    if (P && P.fase === 2 && P.desde == null) P.desde = dia - 1; // ya vivía aquí
    if (!E || E.hecho) continue;
    const D = ENCARGOS[k];
    if (g.inventory.count(D.item) > 0 && !E.sacado) { E.sacado = true; g.ui.toast(`${D.i} Ya tiene ${D.cosa}. Lléveselo a la casa`, 3200); }
    const d = Math.hypot(E.pos.x - p.x, E.pos.z - p.z);
    if (E.hecha && !E.sacado && w.isLoaded(E.pos.x, E.pos.z) && w.getBlock(E.pos.x, E.pos.y + 1, E.pos.z + 2) !== K.chest) E.sacado = true;
    if (!E.hecha && d < 48 && [[-4, -4], [4, 4], [-4, 4], [4, -4]].every(([a, b]) => w.isLoaded(E.pos.x + a, E.pos.z + b))) levantar(g, E, D, H);
    if (E.hecha && !E.vino && d < 14) {
      E.vino = dia;
      g.ui.toast(`${D.i} ${D.lugar[0].toUpperCase()}${D.lugar.slice(1)}. Aquí vivió alguien`, 3200);
      if (g.settings.hostiles && difOf(g).hostiles) guardias(g, E);
    }
  }
  // la mesa larga: los domingos, cerca de la casa
  if (dia % 7 === 0 && G.domingo !== dia && (g.time || 0) < 0.4 && ORDEN.every((q) => G.p[q] && G.p[q].nivel >= 2) && Math.hypot(H.casa.x + ANCHO / 2 - p.x, H.casa.z + FONDO / 2 - p.z) < 30) {
    G.domingo = dia;
    g.player.food = 20; g.player.water = 20;
    g.addEffect('lleno', 600); g.addEffect('fuerza', 600);
    g.ui.toast('🍲 Domingo de mesa larga: nadie se levanta sin comer. Fuerza y panza llena por 10 minutos', 4600);
  }
}
export const marcasEncargos = (g) => {
  const G = g.meta && g.meta.gente;
  if (!G) return [];
  return ORDEN.map((k) => G.p[k] && G.p[k].enc).filter((E) => E && !E.hecho && !E.sacado && E.pos).map((E) => E.pos);
};
export const encargosTexto = (g) => {
  const G = g.meta && g.meta.gente;
  if (!G) return [];
  const L = [];
  for (const k of ORDEN) {
    const P = G.p[k], E = P && P.enc;
    if (!E || E.hecho) continue;
    const D = ENCARGOS[k];
    L.push(E.sacado ? `${D.i} Lleve ${D.cosa} a la casa` : `${D.i} Vaya por ${D.cosa}, ${D.lugar.startsWith('el ') ? `al ${D.lugar.slice(3)}` : `a ${D.lugar}`} (📌 en la brújula)`);
  }
  return L;
};
