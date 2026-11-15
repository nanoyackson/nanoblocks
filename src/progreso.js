// El sentido de ir avanzando: cada meta de la ruta paga un premio, los rangos dan ventajas de verdad y fabricar algo nuevo
// le dice a uno qué acaba de abrir. Sin imports del juego para que lo pueda usar cualquiera (habilidades, tienda, jugador).
import { BLOCK_BY_KEY as K, itemName } from './blocks.js';

export const RANGOS = [
  { n: 0, t: 'Recién llegado', perk: 'Todo por delante' },
  { n: 2, t: 'Vecino', perk: 'Las tiendas le cobran 5 % menos' },
  { n: 4, t: 'Baquiano', perk: 'La estamina se recupera 20 % más rápido' },
  { n: 6, t: 'Sabanero', perk: 'Hambre y sed 8 % más lentas' },
  { n: 9, t: 'Guardián', perk: '10 % menos de daño' },
  { n: 13, t: 'Leyenda de Tiquicia', perk: 'La vida se recupera 30 % más rápido' },
];
const metasHechas = (g) => { const st = (g.meta && g.meta.ruta) || {}; let n = 0; for (let i = 0; i < 13; i++) if (st[i]) n++; return n; };
export function rangoIdx(g) { const n = metasHechas(g); let r = 0; RANGOS.forEach((x, i) => { if (n >= x.n) r = i; }); return r; }
export function rango(g) { return RANGOS[rangoIdx(g)]; }
// las ventajas que usa el juego (acumulativas: el rango alto conserva las anteriores)
// (también suman las hojas del cuaderno, meta.cuaderno, y el plato que uno comió, player.effects)
const hoja = (g, k) => !!(g.meta && g.meta.cuaderno && g.meta.cuaderno[k]);
const plato = (g, k) => !!(g.player && g.player.effects && g.player.effects[k]);
// las mañas que uno escogió (manas.js)
export const mana = (g, k) => !!(g && g.meta && ((g.meta.manas && g.meta.manas[k]) || (g.meta.manasJefe && g.meta.manasJefe[k])));
export const ventaja = {
  tienda: (g) => (rangoIdx(g) >= 1 ? 0.95 : 1),
  estamina: (g) => (rangoIdx(g) >= 2 ? 1.2 : 1) * (hoja(g, 'aguante') ? 1.15 : 1) * (plato(g, 'aguante') ? 1.4 : 1),
  gasto: (g) => (rangoIdx(g) >= 3 ? 0.92 : 1) * (hoja(g, 'caminar') ? 0.95 : 1) * (plato(g, 'lleno') ? 0.6 : 1) * (mana(g, 'buche') ? 0.85 : 1),
  recibido: (g) => (rangoIdx(g) >= 4 ? 0.9 : 1) * (hoja(g, 'ojo') ? 0.95 : 1) * (plato(g, 'coraza') ? 0.88 : 1) * (mana(g, 'cuero_duro') ? 0.92 : 1) * (g.inventory && g.inventory.count(1191) > 0 ? 0.95 : 1),
  regen: (g) => (rangoIdx(g) >= 5 ? 0.7 : 1),
  dano: (g) => (plato(g, 'fuerza') ? 1.15 : 1) * (mana(g, 'mano_pesada') ? 1.1 : 1) * (g && g.player && g.player.effects.bala ? 0.7 : 1),
  comida: (g) => (hoja(g, 'comida') ? 1.1 : 1) * (g.meta && g.meta.cucharon && g.inventory && g.inventory.count(507) > 0 ? 1.2 : 1) * (mana(g, 'buena_mano') ? 1.15 : 1),
  sed: (g) => (hoja(g, 'sed') ? 0.9 : 1) * (plato(g, 'fresco') ? 0.5 : 1) * (mana(g, 'camello') ? 0.75 : 1),
  picar: (g) => (hoja(g, 'manos') ? 0.05 : 0) + (mana(g, 'buen_brazo') ? 0.05 : 0), // v13.0.5: se SUMA al resto (antes ×1,10 y ×1,15 multiplicados)
  tiro: (g) => (mana(g, 'punteria') ? 1.25 : 1),
  premio: (g, n) => Math.round(n * (mana(g, 'se_le_pega') ? 1.25 : 1)),
};

// el premio de cada meta de la ruta (mismo orden que RUTA): lo que sirve para la meta siguiente
const COLON = 360, VENDA = 440, SUERO = 442, BOTIQUIN = 443, PINTO = 263, HIERRO = 258, DIAMANTE = 260, ASADA = 265, FRAGMENTO = 273;
export const PREMIOS = [
  [[K.torch, 8], [VENDA, 2]],
  [[COLON, 10], [PINTO, 4]],
  [[COLON, 20], [VENDA, 2]],
  [[HIERRO, 4], [COLON, 10]],
  [[BOTIQUIN, 1], [VENDA, 3]],
  [[DIAMANTE, 1], [COLON, 30]],
  [[COLON, 40], [BOTIQUIN, 1]],
  [[K.obsidian, 11], [COLON, 50]], // alcanza para el marco (10) y la Llave
  [[SUERO, 2], [ASADA, 8]],
  [[FRAGMENTO, 3], [COLON, 100]],
  [[BOTIQUIN, 2], [COLON, 60]],
  [[COLON, 100], [DIAMANTE, 2]],
  [[FRAGMENTO, 4], [COLON, 150]],
];
export const premioTexto = (i) => (PREMIOS[i] || []).map(([id, n]) => `${n} ${itemName(id)}`).join(' + ');
export function darPremio(g, i) { for (const [id, n] of PREMIOS[i] || []) g.giveItem(id, n); }

// ---------- fabricar algo por primera vez: qué le acaba de abrir ----------
const ABRE = {
  // picos
  300: 'Con el pico de madera ya puede sacar piedra y carbón',
  301: 'Con el pico de piedra ya puede sacar hierro: búsquelo en las cuevas',
  302: 'Con el pico de hierro ya puede sacar oro y diamante, en lo hondo',
  303: 'Con el pico de diamante ya puede sacar jade, casi en el fondo del mundo',
  // lo que cambia cómo se juega
  [K.furnace]: 'Con el horno ya puede fundir hierro y cocinar carne',
  [K.table]: 'Con la mesa de trabajo ya puede fabricar las recetas grandes',
  [K.bed]: 'Dormir en la cama pasa la noche y guarda el lugar donde reaparece',
  [K.fogata]: 'La fogata cocina, calienta y espanta a las Sombras y a los zancudos',
  399: 'Con escudo: clic derecho bloquea, y justo a tiempo hace parry',
  400: 'Con escudo: clic derecho bloquea, y justo a tiempo hace parry',
  378: 'La Llave del volcán enciende el marco de obsidiana hacia el Inframundo',
  426: 'Llene la cantimplora en el río: agua limpia para el camino',
  [K.trampa]: 'Póngala sobre zacate o tierra y vuelva luego: trabaja sola y guarda lo que agarra',
  [K.nasa]: 'Póngala en el río (con agua a los lados) y vuelva luego por el pescado',
  [K.barril]: 'Déjelo sin techo: cuando llueve junta agua limpia para tomar y llenar la cantimplora',
  501: 'Clic derecho con la candela en la mano: en 3 segundos vuelve a donde durmió por última vez. Si le pegan, se apaga',
  316: 'Con azada en la mano, al cosechar se vuelve a sembrar sola si anda semilla',
  [K.puntal]: 'Póngalo en la mina: a 6 bloques no se viene abajo el techo',
  509: 'Clic derecho a una puerta: aguanta el doble de golpes en un asedio',
  [K.yunque]: 'Con un arma, herramienta o pieza de armadura en la mano, clic derecho al yunque: la mejora con estrellas y la deja como nueva',
  [K.plato_vacio]: 'Póngalo donde se pueda llegar, y clic derecho con comida cocinada: de noche viene a comer alguien',
  [K.plato_servido]: 'Póngalo donde se pueda llegar: de noche viene a comer alguien. Déjela comer, y se entera de quién era',
  [K.compostera]: 'Clic derecho con sobras de comida, hojas o zacate: cada 4 sale una bolsa de abono para los cultivos',
  [K.farol_zenaida]: 'Póngalo donde quiera dormir tranquilo: a 30 bloques no nacen Sombras',
  500: 'Clic derecho con el aceite en la mano: su mejor arma pega 30 % más por 60 golpes',
  [K.cencerro]: 'Póngalo en el patio: suena cuando algo hostil se acerca a 14 bloques o menos',
  [K.carpa]: 'Arme la carpa cuando salga de expedición: se duerme adentro y las Sombras nacen más lejos',
  [K.olla_caliente]: 'Póngala junto a la puerta y cárguela con carbón (clic derecho): a lo que se arrime le cae agua hirviendo',
  [K.alambre]: 'Póngalo en el suelo del patio: enreda y lastima a lo hostil que lo pise. A usted no le hace nada',
  [K.estacas]: 'Póngalas alrededor de la casa: lastiman a lo que venga caminando. A usted no le hacen nada',
};
export function alFabricar(g, id) {
  const txt = ABRE[id];
  if (txt && g.mode === 'survival') g.ui.toast(`🔓 ${txt}`, 3600);
}

// ---------- el encabezado de la ruta (J) ----------
export function progresoHTML(g) {
  const i = rangoIdx(g), r = RANGOS[i], sig = RANGOS[i + 1], n = metasHechas(g);
  const barra = sig ? Math.round(((n - r.n) / (sig.n - r.n)) * 100) : 100;
  const P = g.player;
  const pedazos = g.meta.hist && g.meta.hist.pedazos ? Object.keys(g.meta.hist.pedazos).length : 0;
  return `<div class="prog-rango"><b>${r.t}</b><span>${r.perk}</span>
    <div class="prog-barra"><i style="width:${barra}%"></i></div>
    <small>${sig ? `${sig.t} a las ${sig.n} metas (lleva ${n}): ${sig.perk}` : '¡Rango más alto!'}</small>
    <div class="prog-datos"><span>❤ ${Math.round(P.maxHealth / 2)} corazones</span><span>🧩 ${pedazos}/4 pedazos</span><span>📅 Día ${g.day || 1}</span><span>🔥 Racha: ${(g.meta.racha && g.meta.racha.dias) || 0} (mejor ${(g.meta.racha && g.meta.racha.mejor) || 0})</span><span>⚔ Vencidos: ${g.meta.bajas || 0}</span><span>💀 Muertes: ${g.meta.muertes || 0}</span>${g.meta.seguro ? '<span>📄 Con seguro</span>' : ''}<span>📓 Hojas: ${Object.keys(g.meta.cuaderno || {}).length}/12</span><span>🌟 Mañas: ${Object.keys(g.meta.manas || {}).length}/10</span>${g.meta.escondites ? `<span>📦 Escondites: ${g.meta.escondites.fin ? 5 : g.meta.escondites.i}/5</span>` : ''}<span>🕸 ${g.meta.nidosRotos || 0} nidos partidos${g.meta.nidos && g.meta.nidos.length ? ` · ${g.meta.nidos.length} vivos` : ''}</span></div></div>`;
}
