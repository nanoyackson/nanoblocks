// La plata de Tiquicia (v11.10.3): monedas y billetes con denominaciones como las de verdad, con arte propio (inventado, no los del
// BCCR). Por dentro el juego sigue contando en «unidades» (lo que siempre cobró: un casado, 6), y cada unidad vale K colones de
// verdad. Así las 120 cosas que cobran y pagan siguen igual, y lo que se ve sale en colones a la escala de 2026.
//   count(COLON) y remove(COLON, n) del inventario hablan en unidades; los textos que dicen «₡6» o «6 colones» se muestran ×K.
// K = 500: la moneda de siempre (id 360) es justo la de ₡500, y el billete de 20 de la v11.10 es justo el de ₡10 000.
export const K = 500;
export const COLON = 360;
// v12.6.5: el tope de ganancia del día que comparten los encargos del tablón y los buzos del arrecife (y, con C6, el taller): hasta
// TOPE_DIA entero y lo que pase, al 40 %. Anota en meta.encargos2 (dia, ganado). Devuelve las unidades que tocan; quien llama las paga
export const TOPE_DIA = 40;
export function cobrarDelTope(g, u) {
  const M = g.meta.encargos2 && typeof g.meta.encargos2 === 'object' ? g.meta.encargos2 : (g.meta.encargos2 = {}), hoy = g.day || 1;
  if (M.dia !== hoy || !Number.isFinite(M.ganado)) { M.dia = hoy; M.ganado = 0; M.hechosHoy = []; }
  const lleno = Math.max(0, TOPE_DIA - M.ganado), dar = Math.round(Math.min(u, lleno) + Math.max(0, u - lleno) * 0.4);
  M.ganado += u;
  return dar;
}
// id → valor en colones. Las piezas «viejas» (386, 387) son de la v11.10: siguen valiendo lo suyo y se cambian solas
export const VALOR = {
  329: 5, 346: 10, 347: 25, 348: 50, 349: 100, 360: 500,
  354: 1000, 355: 2000, 359: 5000, 385: 10000, 370: 20000,
  386: 25000, 387: 50000,
};
export const VIEJAS = new Set([386, 387]);
// de mayor a menor, sin las viejas: para dar plata o vuelto con la menor cantidad de piezas
export const PIEZAS = Object.keys(VALOR).map(Number).filter((id) => !VIEJAS.has(id)).sort((a, b) => VALOR[b] - VALOR[a]);
export const esPlata = (id) => VALOR[id] !== undefined;

// en piezas: la menor cantidad (de mayor a menor)
export function desglose(colones) {
  const out = [];
  let r = Math.max(0, Math.round(colones));
  for (const id of PIEZAS) { const n = Math.floor(r / VALOR[id]); if (n) { out.push([id, n]); r -= n * VALOR[id]; } }
  return out;
}
// «₡12 500» (con espacio de miles, como se escribe aquí)
export function fmtColones(colones) {
  const n = Math.round(colones), s = String(Math.abs(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${n < 0 ? '−' : ''}₡\u2060${s}`; // \u2060 (invisible): marca de «ya está en colones», aColones no lo vuelve a convertir
}
export const fmtUnidades = (u) => fmtColones(u * K);
// los textos del juego dicen montos en unidades («₡6», «30 colones»): al mostrarlos, en colones de verdad
export function aColones(text) {
  if (typeof text !== 'string' || (!text.includes('₡') && !/colon/i.test(text))) return text;
  return text
    .replace(/₡\s?(\d+(?:\.\d+)?)(?!\s?\d)/g, (_, n) => fmtColones(Number(n) * K))
    .replace(/(?<![\d.]\s?)(\d+(?:\.\d+)?)\s(colones|colón)\b/g, (_, n) => fmtColones(Number(n) * K)); // «300 000 colones» no se toca
}
// el número sin el símbolo (donde la moneda ya se dibuja al lado)
export const sinSimbolo = (t) => t.replace(/^₡\u2060?/, '');
// v11.10.6: un precio en unidades, redondeado a un monto «de vuelto» que usa las monedas chicas cuando calza:
// menos de ₡1 000, de 25 en 25; menos de ₡5 000, de 50 en 50; menos de ₡20 000, de 100 en 100; de ahí, de 500 en 500.
// `arriba`: lo que uno paga se redondea hacia arriba y lo que le pagan, hacia abajo (así la regla de oro nunca se abre)
export function precioBonito(u, arriba) {
  const c = Math.max(0, u * K), paso = c < 1000 ? 25 : c < 5000 ? 50 : c < 20000 ? 100 : 500;
  const r = (arriba ? Math.ceil(c / paso - 1e-9) : Math.floor(c / paso + 1e-9)) * paso;
  return Math.max(25, r) / K;
}
