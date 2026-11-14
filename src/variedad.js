// Comer variado (v11.10): repetir comida ya no castiga, siempre llena igual. Lo que se premia es la variedad del día:
// tres comidas distintas en el día dan aguante por 6 minutos, y cinco, además, fuerza (más daño) por 6 minutos.
// Se cuenta por día del juego en meta.variedad = { dia, ids }; cada premio sale una vez por día.
const AGUANTE_EN = 3, FUERZA_EN = 5, DURA = 360;

export function comerVariado(g, id) {
  if (g.mode !== 'survival') return;
  const hoy = g.day || 1;
  let V = g.meta.variedad;
  if (!V || V.dia !== hoy) V = g.meta.variedad = { dia: hoy, ids: [], premios: 0 };
  if (V.ids.includes(id)) return;
  V.ids.push(id);
  const n = V.ids.length;
  if (n === AGUANTE_EN && V.premios < 1) {
    V.premios = 1; g.addEffect('aguante', DURA);
    g.ui.toast('🥗 ¡Comida variada! Tres distintas hoy: más aguante por 6 minutos', 2600, 'importante');
    g.achieve('variado', 'Tres tiempos y de todo un poco');
  } else if (n === FUERZA_EN && V.premios < 2) {
    V.premios = 2; g.addEffect('fuerza', DURA);
    g.ui.toast('🥗 ¡Cinco comidas distintas hoy! Además, más fuerza por 6 minutos', 2600, 'importante');
    g.achieve('variado5', 'Mesa de domingo');
  }
}
