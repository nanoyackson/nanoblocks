// Brillo (v11.11.0): una curva de luz para el mundo y la mano (no la interfaz). El deslizador va de 0 a 100 % y el 50 % es
// exactamente la luz de siempre. Arriba de 50 se levantan las sombras y la noche (curva más suave y un piso de luz); abajo
// se oscurecen los medios tonos. La misma cuenta está en el shader de los bloques (world.js) y aquí para los modelos.
export const BRILLO = { value: 0 }; // −1 … 1 (lo pone game.js cada cuadro desde settings.luz)
export const luzDeAjuste = (luz) => (Math.max(0, Math.min(100, luz ?? 50)) - 50) / 50;
export function curvaLuz(l) {
  const b = BRILLO.value;
  if (b > 0) return Math.max(Math.pow(l, 1 - 0.5 * b), 0.32 * b);
  if (b < 0) return Math.pow(l, 1 - 0.6 * b);
  return l;
}
// el mismo pedazo en GLSL (va después de calcular L, la luz del vértice)
export const CURVA_GLSL = `
        if (uBrillo > 0.0) L = max(pow(max(L, vec3(0.0)), vec3(1.0 - 0.5 * uBrillo)), vec3(0.30, 0.31, 0.34) * uBrillo);
        else if (uBrillo < 0.0) L = pow(max(L, vec3(0.0)), vec3(1.0 - 0.6 * uBrillo));`;
