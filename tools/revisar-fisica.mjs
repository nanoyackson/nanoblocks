// Revisa que ningún empujón meta al jugador dentro de los bloques ni lo suba como un ascensor (v12.1.3, el bug de la ráfaga del
// papagayo que lo sacó 100 bloques arriba). Uso: node tools/revisar-fisica.mjs → sale con código 1 si algo falla.
// Arma tres escenas con bloques de piedra (pared alta, cueva, ladera en escalones) y empuja un cuerpo de jugador (0.6 × 1.8) con
// viento fuerte durante 2 minutos de juego, por la física (moveStep), con gravedad y saltitos. Después prueba el «ascensor» viejo:
// la caja metida 4 cm de costado en una pared alta no debe subir.
import { Body } from '../src/physics.js';
import { BLOCK_BY_KEY as K } from '../src/blocks.js';

const PIEDRA = K.stone;
function mundo(llenar) {
  const m = new Map();
  const put = (x, y, z) => m.set(`${x},${y},${z}`, PIEDRA);
  llenar(put);
  return { getBlock: (x, y, z) => (y < 0 ? PIEDRA : m.get(`${x},${y},${z}`) || 0), cajas: () => null };
}
const ESCENAS = {
  // suelo en y=0 y una pared de 40 de alto en x=3 (el viento empuja hacia +x)
  pared: mundo((put) => { for (let x = -10; x <= 10; x++) for (let z = -10; z <= 10; z++) put(x, 0, z); for (let y = 1; y <= 40; y++) for (let z = -10; z <= 10; z++) put(3, y, z); }),
  // un túnel de 2 de alto (techo en y=3) que termina contra la roca en x=4
  cueva: mundo((put) => { for (let x = -10; x <= 10; x++) for (let z = -10; z <= 10; z++) { put(x, 0, z); put(x, 3, z); for (let y = 4; y <= 30; y++) put(x, y, z); if (x >= 4) for (let y = 1; y <= 3; y++) put(x, y, z); } for (let x = -10; x <= 10; x++) for (let y = 1; y <= 2; y++) { put(x, y, -2); put(x, y, 2); } }),
  // ladera: escalones de un bloque cada dos, contra el viento
  ladera: mundo((put) => { for (let x = -10; x <= 30; x++) for (let z = -10; z <= 10; z++) { const h = x < 0 ? 0 : Math.floor(x / 2); for (let y = 0; y <= h; y++) put(x, y, z); } }),
};
let fallas = 0;
const mal = (t) => { fallas++; console.log(`✘ ${t}`); };
for (const [nombre, w] of Object.entries(ESCENAS)) {
  for (const dir of [[1, 0], [0.7, 0.7], [1, 0.25]]) {
    const b = new Body(0.6, 1.8);
    b.pos.x = 0.5; b.pos.y = 1; b.pos.z = 0.5;
    let maxY = b.pos.y, prevY = b.pos.y, peorSalto = 0, adentro = 0;
    for (let i = 0; i < 60 * 120; i++) {
      const dt = 1 / 60;
      // la ráfaga fuerte (el papagayo: 0.08 por cuadro como máximo) y, a veces, un saltito
      b.moveStep(w, 'x', dir[0] * 0.08, b.onGround);
      b.moveStep(w, 'z', dir[1] * 0.08, b.onGround);
      if (b.onGround && i % 90 === 0) b.vel.y = 8;
      b.step(w, dt, {});
      if (b.atascado(w)) adentro++;
      peorSalto = Math.max(peorSalto, b.pos.y - prevY);
      prevY = b.pos.y; maxY = Math.max(maxY, b.pos.y);
    }
    const tope = nombre === 'ladera' ? 22 : 4; // en la ladera sí sube (camina cuesta arriba), pero de a escalones
    if (adentro) mal(`${nombre} ${dir}: ${adentro} cuadros dentro de un bloque`);
    if (maxY > tope) mal(`${nombre} ${dir}: subió hasta y = ${maxY.toFixed(1)} (tope ${tope})`);
    if (peorSalto > 0.9) mal(`${nombre} ${dir}: subió ${peorSalto.toFixed(2)} en un solo cuadro`);
    if (!fallas) console.log(`✔ ${nombre} ${dir.join(',')}: 2 min de viento, máximo y ${maxY.toFixed(2)}, peor subida por cuadro ${peorSalto.toFixed(2)}`);
  }
}
// el «ascensor»: la caja metida 4 cm de costado en la pared alta, cayendo
{
  const w = ESCENAS.pared, b = new Body(0.6, 1.8);
  b.pos.x = 3 - 0.3 + 0.04; b.pos.y = 1; b.pos.z = 0.5;
  for (let i = 0; i < 120; i++) b.step(w, 1 / 60, {});
  if (b.pos.y > 1.6 || b.atascado(w)) mal(`ascensor: metido de costado en la pared subió a y = ${b.pos.y.toFixed(1)}`);
  else console.log(`✔ ascensor: metido de costado en la pared, queda en y = ${b.pos.y.toFixed(2)} (lo saca de lado a x = ${b.pos.x.toFixed(2)})`);
}
// un bloque que aparece encima (se pone uno donde está la cabeza): sale al hueco más cercano, no a la superficie lejana
{
  const w = mundo((put) => { for (let x = -10; x <= 10; x++) for (let z = -10; z <= 10; z++) { put(x, 0, z); for (let y = 2; y <= 60; y++) if (!(x === 1 && z === 0)) put(x, y, z); } });
  const b = new Body(0.6, 1.8);
  b.pos.x = 0.5; b.pos.y = 1; b.pos.z = 0.5;
  for (let i = 0; i < 30; i++) b.step(w, 1 / 60, {});
  if (b.pos.y > 4 || b.atascado(w)) mal(`enterrado: quedó en x ${b.pos.x.toFixed(2)}, y ${b.pos.y.toFixed(1)} (debía salir al hueco de al lado)`);
  else console.log(`✔ enterrado: salió al hueco de al lado (x ${b.pos.x.toFixed(2)}, y ${b.pos.y.toFixed(2)})`);
}
console.log(fallas ? `\n${fallas} falla(s)` : '\nTodo bien: ningún empujón mete al jugador en los bloques ni lo sube como ascensor.');
if (fallas) process.exitCode = 1;
