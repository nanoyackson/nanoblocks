// v13.2.0 (decisión de Isaac sobre PLAN_CUEVAS.md punto 5: «¿más lava y menos luz abajo?», «Sí, más difícil»). Lo hondo es más oscuro: bajo
// y = 40 la luz de las cuevas baja de a poco, y en y = 15 casi no queda. En tiempo real (no toca el generador: sirve también en mundos
// viejos) y sin reconstruir mallas: solo se mueven unas cuantas uniformes del shader, el brillo y la niebla. Antorchas, lava, hongos y
// cristal siguen alumbrando (su luz va por otro canal), y el casco de espeleólogo gana valor. Sin Math.random en las cuentas de luz.
import { BLOCK_BY_KEY as K } from './blocks.js';
import { OSCURO } from './brillo.js';
import { anotar } from './diario.js';

export const PROF_ALTA = 40, PROF_BAJA = 15; // normal de y = 40 para arriba, casi negro de y = 15 para abajo
export const LUZ_MIN = 0.12; // lo que queda de luz ambiente en lo más hondo (siluetas, no negro absoluto)
export const NIEBLA_FAR_MIN = 46; // hasta dónde llega la niebla en lo más hondo (bloques)
const smooth = (t) => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };
// 0 en la superficie … 1 en lo más hondo (sin saltos: curva suave entre PROF_ALTA y PROF_BAJA)
export const profK = (y) => smooth((PROF_ALTA - y) / (PROF_ALTA - PROF_BAJA));
// la luz ambiente que queda a esa altura (1 = normal), siempre ≥ LUZ_MIN
export const luzAmbiente = (y, k = 1) => 1 - (1 - LUZ_MIN) * profK(y) * k;
// el brillo (brillo.js) que se usa a esa profundidad: el deslizador no deja lavada la oscuridad y el casco sube con la hondura
export function brilloProf(b, casco, k) {
  if (b > 0) b *= 1 - 0.7 * k;
  if (casco) b = Math.max(b, 0.55 + 0.2 * k);
  return b;
}
// la niebla bajo tierra: más corta y más oscura con la hondura
export function nieblaProf(near, far, k) { return { near: near + (Math.min(near, 6) - near) * k, far: far + (Math.min(far, NIEBLA_FAR_MIN) - far) * k }; }

const AVISO = 'Cuanto más hondo, más oscuro y más caliente: lleve antorchas.';
// una vez por cuadro: suaviza k, mueve la uniforme y, de vez en cuando, avisa y marca la lava cercana
export function cuadroProfundidad(g, dt) {
  const e = g.player.eye;
  const cueva = g.dim === 'tierra' && g.env ? Math.max(0, Math.min(1, (g.env.cave - 0.3) / 0.4)) : 0;
  const want = profK(e.y) * cueva;
  g.profK = (g.profK || 0) + (want - (g.profK || 0)) * Math.min(1, dt * 1.5);
  if (g.profK < 0.001) g.profK = 0;
  OSCURO.value = g.profK;
  if (g.dim !== 'tierra' || !g.world || g.paused) return;
  if (cueva > 0.5 && e.y < 34 && !g.meta.profAviso) { g.meta.profAviso = 1; g.ui.toast(AVISO, 5200, { cat: 'ambiente', clave: 'profundidad' }); anotar(g, AVISO, '🔥'); }
  g.profT = (g.profT || 0) - dt;
  if (g.profT > 0 || cueva < 0.3) return;
  g.profT = 0.35;
  avisoLava(g, e);
}
// el resplandor de las bolsas grandes: brasas que suben de la lava, visibles de lejos (hasta ~28 bloques)
function avisoLava(g, e) {
  const w = g.world, P = g.particles, ex = Math.floor(e.x), ey = Math.floor(e.y), ez = Math.floor(e.z);
  let lejos = 0;
  for (let i = 0; i < 70 && lejos < 3; i++) {
    const x = ex + Math.floor(Math.random() * 57) - 28, z = ez + Math.floor(Math.random() * 57) - 28, y = ey + Math.floor(Math.random() * 25) - 14;
    if (w.getBlock(x, y, z) !== K.lava || w.getBlock(x, y + 1, z) !== 0) continue;
    // «bolsa grande»: tiene lava a los lados (un charco suelto de un bloque no avisa)
    if (w.getBlock(x + 1, y, z) !== K.lava || w.getBlock(x, y, z + 1) !== K.lava || w.getBlock(x - 1, y, z) !== K.lava) continue;
    lejos++;
    P.spawn(x + Math.random(), y + 1.1, z + Math.random(), [1, 0.45 + Math.random() * 0.25, 0.08], (Math.random() - 0.5) * 0.3, 0.9 + Math.random() * 0.8, (Math.random() - 0.5) * 0.3, 3.2, -0.15, true);
    P.spawn(x + Math.random(), y + 1.4, z + Math.random(), [1, 0.35, 0.05], 0, 0.5, 0, 2.2, -0.1, true);
  }
}
