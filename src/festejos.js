// Fiestas y obras grandes (generador v6): las fiestas de fin de año en Zapote con chinamos, chicago, carrusel y
// redondel de toros a la tica; el aeropuerto Juan Santamaría con pista, torre y avión; y el túnel Zurquí que
// atraviesa la montaña en la ruta a Limón. Sin gráficos.
import { hash3 } from './noise.js';
import { BLOCK_BY_KEY as K } from './blocks.js';

// ---------- Fiestas de Zapote ----------
export function buildZapote(c) {
  c.foundation(-30, -30, 30, 30, K.dirt, K.dirt, 24);
  // redondel de madera con gradería y toro
  c.circle(13.5, (x, z, d) => {
    if (d <= 9) { c.set(x, 0, z, K.sand); return; }
    if (d <= 10) { for (let y = 1; y <= 3; y++) c.set(x, y, z, Math.abs(x) <= 1 && z > 0 ? 0 : K.planks); return; }
    const row = Math.floor(d - 10) + 1;
    for (let y = 1; y < row; y++) c.set(x, y, z, K.log);
    c.set(x, row, z, K.losa_tablas);
  });
  for (let k = 0; k < 16; k++) { const a = (k / 16) * Math.PI * 2; c.fill(Math.round(Math.cos(a) * 13.5), 5, Math.round(Math.sin(a) * 13.5), Math.round(Math.cos(a) * 13.5), 7, Math.round(Math.sin(a) * 13.5), K.poste); c.set(Math.round(Math.cos(a) * 13.5), 8, Math.round(Math.sin(a) * 13.5), k % 2 ? K.lamp : K.farol); }
  c.npc(0, 1, 0, { mob: 'vaca', name: 'toro de Zapote' });
  for (let k = 0; k < 3; k++) c.npc(-3 + k * 3, 1, -4, { role: 'aficionado', name: ['Improvisado valiente', 'Improvisado con miedo', 'Payaso del redondel'][k] });
  // chinamos de comida y juegos
  const COLS = [K.repello_rojo, K.paint_yellow, K.paint_blue, K.paint_green];
  for (let i = 0; i < 6; i++) {
    const x0 = -26 + i * 9, z0 = 18;
    for (let x = x0; x <= x0 + 6; x++) for (let z = z0; z <= z0 + 5; z++) { c.set(x, 4, z, COLS[(i + x) % 4]); if (z === z0) c.set(x, 1, z, K.planks); }
    for (const [x, z] of [[x0, z0], [x0 + 6, z0], [x0, z0 + 5], [x0 + 6, z0 + 5]]) c.fill(x, 1, z, x, 3, z, K.log);
    c.set(x0 + 3, 3, z0 + 1, K.farol);
  }
  // chicago (rueda de Chicago) de hierro con canastas de colores
  const cx = 22, cz = -14, R = 8;
  for (const s of [-1, 1]) for (let y = 1; y <= R + 1; y++) { c.set(cx + Math.round((R + 1 - y) * 0.35) * s, y, cz - 2, K.lamina_metal); c.set(cx + Math.round((R + 1 - y) * 0.35) * s, y, cz + 2, K.lamina_metal); }
  for (let k = 0; k < 40; k++) { const a = (k / 40) * Math.PI * 2; c.set(cx + Math.round(Math.cos(a) * R), R + 1 + Math.round(Math.sin(a) * R), cz, K.lamina_metal); }
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2;
    for (let r = 1; r < R; r++) c.set(cx + Math.round(Math.cos(a) * r), R + 1 + Math.round(Math.sin(a) * r), cz, K.cerca);
    const bx = cx + Math.round(Math.cos(a) * R), by = R + Math.round(Math.sin(a) * R);
    for (const dz of [-1, 1]) c.set(bx, by, cz + dz, COLS[k % 4]);
    c.set(bx, by - 1, cz + 1, K.lamp);
  }
  c.fill(cx, R + 1, cz - 2, cx, R + 1, cz + 2, K.lamina_metal);
  // carrusel con caballitos
  c.circle(5.4, (x, z, d) => { c.set(x - 20, 1, z - 14, d > 4.6 ? K.paint_yellow : K.planks); if (d < 5.4) c.set(x - 20, 7, z - 14, (Math.round(Math.atan2(z, x) * 3) & 1) ? K.repello_rojo : K.plaster); });
  c.fill(-20, 2, -14, -20, 6, -14, K.oro_volcanico);
  for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2, x = -20 + Math.round(Math.cos(a) * 3.5), z = -14 + Math.round(Math.sin(a) * 3.5); c.fill(x, 2, z, x, 6, z, K.cerca); c.set(x, 3, z, k % 2 ? K.plaster : K.madera_carreta); }
  c.placa(2, 1, 26, 0, 'Fiestas de Zapote', 'Del 25 de diciembre al 1.º de enero: toros a la tica, chinamos, chicago, carrusel, vigorón y mucha gente. El que se tira al redondel es un improvisado… y el toro casi siempre gana.');
  c.zone(0, 2, 0, 'retreta', 26);
  c.npc(-14, 1, 16, { role: 'frutero', name: 'Chinamo de vigorón' });
  c.npc(4, 1, 16, { role: 'cantinero', name: 'Chinamo de guaro y boquitas' });
  c.npc(-20, 1, -8, { role: 'copero', name: 'Copos del carrusel' });
}

// ---------- Aeropuerto Juan Santamaría ----------
export function buildAeropuerto(c) {
  c.foundation(-60, -14, 60, 26, K.concreto, K.grass, 18);
  // pista con línea central y números
  for (let x = -58; x <= 58; x++) for (let z = -8; z <= 8; z++) c.set(x, 0, z, Math.abs(z) === 8 ? K.plaster : z === 0 && x % 6 < 3 ? K.plaster : K.asfalto);
  for (const s of [-1, 1]) for (let z = -6; z <= 6; z += 2) for (let k = 0; k < 4; k++) c.set(s * (54 - k), 0, z, K.plaster);
  for (let x = -58; x <= 58; x += 8) for (const z of [-9, 9]) c.set(x, 1, z, K.lamp);
  // terminal de vidrio y concreto con techo ondulado
  for (let x = -24; x <= 24; x++) for (let z = 14; z <= 24; z++) {
    const edge = Math.abs(x) === 24 || z === 14 || z === 24;
    for (let y = 1; y <= 7; y++) c.set(x, y, z, edge ? (z === 14 && y >= 2 && y <= 6 ? K.glass : K.concreto) : y === 4 ? K.concreto : 0);
    c.set(x, 8 + (Math.round(Math.sin(x * 0.2) * 1.2)), z, K.plaster);
  }
  for (let x = -2; x <= 2; x++) for (let y = 1; y <= 3; y++) c.set(x, y, 24, 0);
  for (let x = -20; x <= 20; x += 5) c.fill(x, 1, 18, x, 1, 18, K.escalera_tablas);
  // torre de control
  c.fill(34, 1, 18, 36, 18, 20, K.concreto);
  for (let x = 32; x <= 38; x++) for (let z = 16; z <= 22; z++) { c.set(x, 19, z, K.concreto); c.set(x, 20, z, (x === 32 || x === 38 || z === 16 || z === 22) ? K.glass : 0); c.set(x, 21, z, K.concreto); }
  c.set(35, 22, 19, K.lamp);
  // avión estacionado (fuselaje blanco, alas, cola con los colores de la bandera)
  const ax = -10, az = 4;
  for (let x = ax - 12; x <= ax + 12; x++) for (let y = 1; y <= 3; y++) for (let z = az - 1; z <= az + 1; z++) if (!(Math.abs(x - ax) === 12 && y === 3)) c.set(x, y, z, (y === 2 && z !== az && x % 2 === 0 && Math.abs(x - ax) < 10) ? K.glass : K.plaster);
  for (let z = az - 10; z <= az + 10; z++) c.set(ax, 2, z, K.plaster);
  for (let z = az - 4; z <= az + 4; z++) c.set(ax + 11, 3, z, K.plaster);
  [K.paint_blue, K.plaster, K.repello_rojo, K.plaster, K.paint_blue].forEach((id, i) => c.set(ax + 12, 4 + i, az, id));
  c.set(ax - 13, 2, az, K.glass);
  for (const z of [az - 6, az + 6]) c.set(ax, 1, z, K.basalt);
  c.placa(0, 1, 13, 0, 'Aeropuerto Internacional Juan Santamaría', 'En Alajuela: la puerta de Costa Rica al mundo. Lleva el nombre del héroe nacional. Antes de despegar, el último gallo pinto en la soda de la terminal.');
  c.npc(0, 1, 16, { role: 'turista', name: 'Turista recién llegado' });
  c.npc(6, 1, 20, { role: 'chofer', name: 'Taxista del aeropuerto' });
}

// ---------- Túnel Zurquí: busca una loma alta y la atraviesa ----------
export function placeZurqui(gen, gx, gz) {
  const cell = 1800;
  for (let k = 0; k < 60; k++) {
    const x = Math.floor(gx * cell + 100 + hash3(gen.seed, gx, 8100 + k, gz) * (cell - 200));
    const z = Math.floor(gz * cell + 100 + hash3(gen.seed, gx, 8200 + k, gz) * (cell - 200));
    const c = gen.column(x, z);
    if (c.h < 88 || c.biome === 'ocean') continue;
    for (const [ax, az, rot] of [[1, 0, 1], [0, 1, 0]]) {
      const a = gen.column(x - ax * 26, z - az * 26).h, b = gen.column(x + ax * 26, z + az * 26).h;
      if (Math.max(a, b) > c.h - 10 || Math.abs(a - b) > 8) continue;
      return { x, z, y: Math.max(a, b) + 1, rot, id: `zurqui@${x},${z}`, type: 'zurqui' };
    }
  }
  return null;
}
export function buildZurqui(c) {
  const L = 30;
  for (let s = -L; s <= L; s++) {
    for (let x = -4; x <= 4; x++) {
      for (let y = 0; y <= 6; y++) {
        const wall = Math.abs(x) === 4 || y === 6;
        c.set(x, y, s, y === 0 ? (Math.abs(x) <= 2 ? (x === 0 && s % 4 < 2 ? K.asfalto_linea : K.asfalto) : K.acera) : wall ? (y === 6 && s % 6 === 0 ? K.lamp : K.concreto) : 0);
      }
      // apoyos bajo la calzada si hay hueco
      const g = c.ground(x, s);
      for (let y = g + 1; y < 0; y++) c.set(x, y, s, K.concreto);
    }
    // portales de concreto con el nombre
    if (Math.abs(s) === L) for (let x = -5; x <= 5; x++) for (let y = 0; y <= 8; y++) if (Math.abs(x) === 5 || y >= 7) c.set(x, y, s, K.concreto);
  }
  c.placa(0, 7, -L - 1, 2, 'Túnel Zurquí', 'En la ruta 32 a Limón, dentro del Parque Nacional Braulio Carrillo: el único túnel de carretera del país. Adentro se oye todo el eco… y afuera casi siempre hay neblina.');
  c.placa(0, 7, L + 1, 0, 'Túnel Zurquí', 'Maneje con las luces encendidas. Salida hacia el Valle Central / hacia el Caribe.');
}
