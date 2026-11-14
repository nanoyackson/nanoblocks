// v12.15.4 (C8-B): lo único de la fiesta patronal que lee la economía (sin dependencias, para que corra también en node).
// Las ventas del mostrador (oficios2.js) valen ×1.5 si es mayordomo y la fiesta de ese pueblo está en curso (meta.patronal.mayor, ver patronal.js).
export function factorMayordomo(g) {
  const Y = g.meta && g.meta.patronal && g.meta.patronal.mayor;
  return Y && Y.fase === 'hecho' && (g.day || 1) >= Y.inicio && (g.day || 1) <= Y.inicio + 2 ? 1.5 : 1;
}
