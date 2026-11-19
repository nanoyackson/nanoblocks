// Límites de mensajes por segundo para el multijugador (ESPEC_PWA_MULTIJUGADOR §3.3). Funciones PURAS: sin Three.js, sin DOM, sin relojes
// propios (el reloj entra por parámetro, así se prueban en Node con un reloj falso). Nada de red todavía: F1 las usa.
// Un cubo de fichas por invitado y tipo de mensaje: repone `rate` fichas por segundo hasta `cap` (la ráfaga permitida).
export const LIMITES = {
  pos: { rate: 15, cap: 30 },
  bloque: { rate: 20, cap: 40 }, // v13.5.4: antes 10 y 20; el invitado manda a 16 por segundo (sesion.js), con margen para la demora de la red
  rompe_inicio: { rate: 10, cap: 20 },
  inv_op: { rate: 10, cap: 15 },
  inv: { rate: 2, cap: 4 }, // v12.13.0: la foto de la mochila (el invitado manda 1 cada 0,5 s como mucho)
  golpe: { rate: 5, cap: 8 },
  cofre_abre: { rate: 1, cap: 3 }, // v12.15.0
  cofre_cierra: { rate: 1, cap: 3 },
  cama: { rate: 1, cap: 4 },
  chunks_pide: { rate: 5, cap: 10 },
  chat: { rate: 1, cap: 3 },
  estacion: { rate: 5, cap: 10 },
  tienda: { rate: 5, cap: 10 },
  hola: { rate: 0.2, cap: 1 },
  salud: { rate: 0.5, cap: 2 },
};
// v12.16.4: lo que se DESCARTA sin castigo cuando excede (el cliente lo repite solo: posición y pedido de trozos). Un invitado honesto que
// explora jamás se expulsa por esto; solo un inundador sostenido (más de FLOOD_MAX descartes en 5 s).
// v13.5.4: «bloque» también (un relleno grande en ráfaga no se castiga: el exceso se descarta y se le corrige con el bloque verdadero; solo el inundador sostenido sale)
const BLANDOS = new Set(['pos', 'chunks_pide', 'bloque']);
export const FLOOD_MAX = 400;
export const TOPE_ANFITRION = 300; // mensajes por segundo entre todos los invitados juntos

const conocido = (tipo) => Object.prototype.hasOwnProperty.call(LIMITES, tipo);

export function nuevoCubo(tipo, ahora) {
  return conocido(tipo) ? { tipo, fichas: LIMITES[tipo].cap, t: ahora } : null;
}
// ¿pasa este mensaje? Gasta una ficha. true = pasa; false = se descarta (el que llama cuenta el descarte)
export function gastar(cubo, ahora) {
  if (!cubo) return false; // tipo desconocido: nunca pasa (lista blanca)
  const L = LIMITES[cubo.tipo];
  const dt = Math.max(0, (ahora - cubo.t) / 1000);
  cubo.t = ahora;
  cubo.fichas = Math.min(L.cap, cubo.fichas + dt * L.rate);
  if (cubo.fichas < 1) return false;
  cubo.fichas -= 1;
  return true;
}

// Un invitado: sus cubos y su ventana de mensajes. `mirada` aplica la escalera de §3.3:
// > 20 % descartado durante 5 s → 'aviso'; > 50 % durante 20 s → 'expulsa'; si no, 'ok'
export function nuevoInvitado(ahora) {
  return { cubos: Object.create(null), ok: 0, malos: 0, desde: ahora, ventana: [] };
}
export function recibir(inv, tipo, ahora) {
  if (!conocido(tipo)) { inv.malos++; anotar(inv, ahora, false); return false; }
  const cubo = (inv.cubos[tipo] ||= nuevoCubo(tipo, ahora));
  const pasa = gastar(cubo, ahora);
  if (!pasa && BLANDOS.has(tipo)) { (inv.flood ||= []).push(ahora); while (inv.flood.length && ahora - inv.flood[0] > 5000) inv.flood.shift(); return false; }
  if (pasa) inv.ok++; else inv.malos++;
  anotar(inv, ahora, pasa);
  return pasa;
}
function anotar(inv, ahora, pasa) {
  inv.ventana.push([ahora, pasa ? 1 : 0]);
  while (inv.ventana.length && ahora - inv.ventana[0][0] > 20000) inv.ventana.shift();
  if (inv.ventana.length > 4000) inv.ventana.splice(0, inv.ventana.length - 4000); // memoria acotada ante un inundador
}
function fraccionMala(inv, ahora, ms) {
  let n = 0, m = 0;
  for (const [t, ok] of inv.ventana) if (ahora - t <= ms) { n++; if (!ok) m++; }
  return n >= 10 ? m / n : 0; // con muy pocos mensajes no se juzga
}
export function mirada(inv, ahora) {
  if (inv.flood && inv.flood.length > FLOOD_MAX && ahora - inv.flood[inv.flood.length - 1] <= 5000) return 'expulsa'; // inundador sostenido de posiciones o pedidos
  if (fraccionMala(inv, ahora, 20000) > 0.5) return 'expulsa';
  if (fraccionMala(inv, ahora, 5000) > 0.2) return 'aviso';
  return 'ok';
}

// el tope del anfitrión entre todos: un cubo único de TOPE_ANFITRION por segundo
export function nuevoGlobal(ahora) { return { fichas: TOPE_ANFITRION, t: ahora }; }
export function gastarGlobal(cubo, ahora) {
  const dt = Math.max(0, (ahora - cubo.t) / 1000);
  cubo.t = ahora;
  cubo.fichas = Math.min(TOPE_ANFITRION, cubo.fichas + dt * TOPE_ANFITRION);
  if (cubo.fichas < 1) return false;
  cubo.fichas -= 1;
  return true;
}
