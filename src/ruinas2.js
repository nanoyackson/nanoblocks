// Sitio arqueológico (generador v11): montículos circulares de piedra, calzada empedrada, petroglifos y un acertijo.
// Hay cuatro pedestales alrededor del montículo central; las esferas de piedra andan regadas por el sitio. Al poner
// una esfera sobre cada pedestal, se abre la puerta de piedra de la bóveda del centro y adentro hay un cofre.
import { BLOCK_BY_KEY as K } from './blocks.js';
import { mulberry32 } from './noise.js';

export function buildSitioArqueologico(c) {
  const rnd = mulberry32(c.ox * 31 + c.oz * 17 + 4242);
  c.foundation(-20, -20, 20, 20, K.dirt, K.grass, 7);
  // calzada empedrada que atraviesa el sitio
  for (let x = -20; x <= 20; x++) for (let z = -1; z <= 1; z++) c.set(x, 0, z, rnd() < 0.2 ? K.mossy : K.cobble);
  // montículos circulares (bases de casas antiguas), con escalinata
  const monticulo = (cx, cz, r, h) => {
    c.circle(r, (x, z, d) => { for (let y = 1; y <= h; y++) if (d <= r - (y - 1) * 0.6) c.set(cx + x, y, cz + z, d > r - 1.2 - (y - 1) * 0.6 ? (rnd() < 0.3 ? K.mossy : K.cobble) : K.dirt); if (d <= r - (h - 1) * 0.6) c.set(cx + x, h, cz + z, K.grass); });
  };
  monticulo(-12, -11, 5, 2); monticulo(12, -11, 4.5, 2); monticulo(-12, 11, 4.5, 2); monticulo(12, 11, 5, 2);
  // montículo central con la bóveda
  monticulo(0, 0, 7.5, 3);
  c.fill(-2, 4, -2, 2, 7, 2, K.cobble);
  c.fill(-1, 4, -1, 1, 6, 1, 0);
  c.chest(0, 4, 0, 0, botinRuinas(rnd));
  // la puerta de piedra (2 de alto) mirando a la calzada
  c.set(0, 4, 2, K.puerta_piedra); c.set(0, 5, 2, K.puerta_piedra);
  for (let x = -2; x <= 2; x++) c.set(x, 8, -2 + ((x + 2) % 5), K.mossy);
  c.set(0, 7, 2, K.petroglifo);
  // los cuatro pedestales, en cruz alrededor del montículo central
  for (const [x, z] of [[0, -11], [11, 0], [0, 11], [-11, 0]]) {
    c.set(x, 1, z, K.cobble);
    c.set(x, 2, z, K.pedestal);
    for (let y = 3; y <= 6; y++) c.set(x, y, z, 0);
  }
  // petroglifos sueltos y una placa
  for (const [x, z] of [[-6, -16], [6, 16], [-17, 6], [17, -6], [3, -17]]) { c.set(x, 1, z, K.petroglifo); c.set(x, 2, z, rnd() < 0.5 ? K.petroglifo : 0); }
  c.placa(4, 1, 3, 2, 'Sitio arqueológico', 'Hace siglos aquí vivió un pueblo que hacía esferas de piedra perfectas. Dicen que la bóveda se abre cuando cada pedestal tiene su esfera.');
  // las esferas regadas por el sitio (algunas medio enterradas en el monte)
  const sitios = [[-15, -4], [16, 3], [-4, 17], [8, -15], [-17, 15], [15, -17]];
  const ini = Math.floor(rnd() * 6);
  for (let k = 0; k < 5; k++) { const [x, z] = sitios[(ini + k) % 6]; c.set(x, 1, z, K.esfera_piedra); }
  // monte encima: algunos árboles y helechos
  for (let k = 0; k < 18; k++) { const x = Math.floor(rnd() * 40) - 20, z = Math.floor(rnd() * 40) - 20; if (Math.abs(z) > 2 && Math.hypot(x, z) > 9) c.set(x, 1, z, rnd() < 0.6 ? K.helecho : K.tall_grass); }
}

function botinRuinas(rnd) {
  const slots = new Array(27).fill(null);
  const put = (id, n) => { let i = Math.floor(rnd() * 27); while (slots[i]) i = (i + 1) % 27; slots[i] = { id, count: n }; };
  put(259, 4 + Math.floor(rnd() * 5)); put(274, 2 + Math.floor(rnd() * 2)); put(273, 4 + Math.floor(rnd() * 4)); put(360, 30 + Math.floor(rnd() * 30));
  put(260, 1 + Math.floor(rnd() * 2)); put(444, 1); put(451, 1);
  return slots;
}

// al poner un bloque: ¿se completó el acertijo?
export function revisarAcertijo(g, x, y, z, id) {
  if (id !== K.esfera_piedra || g.world.getBlock(x, y - 1, z) !== K.pedestal) return;
  const w = g.world;
  g.particles.burst(x + 0.5, y + 0.6, z + 0.5, [[0.9, 0.85, 0.6], [1, 1, 0.8]], 14, 1.6);
  g.audio.play('dig.stone', { pos: { x: x + 0.5, y, z: z + 0.5 }, vol: 0.8, pitch: 0.7 });
  // cuántos pedestales cercanos tienen su esfera
  let con = 0, total = 0;
  for (let dx = -24; dx <= 24; dx++) for (let dz = -24; dz <= 24; dz++) for (let dy = -4; dy <= 4; dy++) {
    if (w.getBlock(x + dx, y - 1 + dy, z + dz) !== K.pedestal) continue;
    total++;
    if (w.getBlock(x + dx, y + dy, z + dz) === K.esfera_piedra) con++;
  }
  g.ui.toast(`⚪ Esfera en su pedestal: ${con} de ${total}`, 1800);
  if (con < Math.max(4, total)) return;
  // ¡se abre la bóveda!
  let abiertas = 0;
  for (let dx = -14; dx <= 14; dx++) for (let dz = -14; dz <= 14; dz++) for (let dy = -6; dy <= 8; dy++) {
    if (w.getBlock(x + dx, y + dy, z + dz) !== K.puerta_piedra) continue;
    w.setBlock(x + dx, y + dy, z + dz, 0);
    g.particles.burst(x + dx + 0.5, y + dy + 0.5, z + dz + 0.5, [[0.55, 0.55, 0.52], [0.7, 0.68, 0.6]], 20, 2.5);
    abiertas++;
  }
  if (abiertas) {
    g.audio.play('rumble', { vol: 0.9 });
    g.shake = Math.max(g.shake || 0, 0.6);
    g.ui.toast('🗿 ¡Las esferas se alinearon y la bóveda de piedra se abrió!', 3600);
    g.achieve('ruinas_acertijo', 'El secreto de las esferas');
    g.addXP(30);
  }
}

