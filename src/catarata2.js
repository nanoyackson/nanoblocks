// La catarata escondida (generador v15): un farallón alto con una caída de agua ancha y, atravesando el agua,
// una cueva secreta con musgo, hongos que brillan, cristales y un cofre. De día se forma un arcoíris en la poza.
import { BLOCK_BY_KEY as K } from './blocks.js';

export function buildCatarataEscondida(c) {
  const H = 22;
  c.foundation(-16, -22, 16, 12, K.stone, K.grass, 6);
  // el farallón
  for (let z = -22; z <= -6; z++) for (let x = -14; x <= 14; x++) {
    const top = Math.round(H - Math.abs(x) * 0.25 + (z + 6) * -0.08);
    for (let y = 1; y <= top; y++) c.set(x, y, z, (x * 5 + y * 3 + z) % 9 === 0 ? K.mossy : y === top ? K.grass : K.stone);
    if (c.rnd() < 0.1) c.set(x, top + 1, z, c.rnd() < 0.5 ? K.helecho : K.tall_grass);
  }
  // el río arriba y la caída ancha
  for (let z = -22; z <= -6; z++) for (let x = -2; x <= 2; x++) c.set(x, H, z, K.water);
  for (let y = 1; y < H; y++) for (let x = -2; x <= 2; x++) c.set(x, y, -5, K.water_fall);
  // la poza
  c.circle(8, (x, z, d) => { const zz = z; c.set(x, 0, zz, d > 7 ? K.mossy : K.water); c.set(x, -1, zz, d > 7 ? K.stone : K.water); c.set(x, -2, zz, K.stone); });
  // la cueva detrás del agua
  for (let x = -3; x <= 3; x++) for (let z = -12; z <= -6; z++) for (let y = 1; y <= 5; y++) c.set(x, y, z, 0);
  for (let x = -3; x <= 3; x++) for (let z = -12; z <= -6; z++) c.set(x, 0, z, c.rnd() < 0.6 ? K.moss || K.mossy : K.mossy);
  c.set(-3, 1, -11, K.glow_mushroom || K.torch); c.set(3, 1, -9, K.glow_mushroom || K.torch); c.set(-2, 1, -7, K.glow_mushroom || K.torch);
  if (K.cristal) { c.set(3, 1, -12, K.cristal); c.set(-3, 5, -10, K.cristal); c.set(2, 5, -7, K.cristal); }
  if (K.cristal_bloque) c.set(0, 5, -12, K.cristal_bloque);
  c.chest(0, 1, -12, 0, c.loot([[259, 3, 7], [260, 1, 2], [369, 2, 5], [274, 1, 2], [451, 1, 1], [464, 0, 1], [360, 15, 40]], 6));
  c.placa(6, 1, 9, 0, 'La catarata escondida', 'Dicen los abuelos que detrás del agua hay algo guardado. Nadie se ha mojado lo suficiente para averiguarlo.');
  c.zone(0, 1, 0, 'arcoiris', 14);
}

// de día, con sol, un arcoíris en la brisa de la poza
export function tickArcoiris(g, zn, d) {
  if (d > 60 || g.daylight < 0.6 || (g.weather && g.weather.intensity > 0.4)) return;
  const C = [[1, 0.2, 0.2], [1, 0.6, 0.1], [1, 1, 0.2], [0.3, 1, 0.3], [0.3, 0.6, 1], [0.6, 0.3, 1]];
  for (let k = 0; k < 6; k++) for (let i = 0; i < 10; i++) {
    const a = Math.PI * (i / 9), r = 7 - k * 0.35;
    g.particles.spawn(zn.x + Math.cos(a) * r, zn.y + 1 + Math.sin(a) * r * 0.8, zn.z + 2, C[k], 0, 0, 0, 1.1, 0, true);
  }
  if (d < 20) g.achieve('arcoiris', 'El arcoíris de la catarata');
}
