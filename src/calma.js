// «Movimiento tranquilo»: la opción propia o la reducción de movimiento del sistema. La usan la interfaz y la cámara, así las dos
// se calman igual (antes el juego solo miraba la opción y el sistema se quedaba con el temblor completo).
const sistema = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null;
// si el sistema cambia la preferencia con el juego abierto, la interfaz se entera
if (sistema && sistema.addEventListener) sistema.addEventListener('change', () => { if (typeof document !== 'undefined') document.body.classList.toggle('calma', !!(window.nanoblocks && calmaActiva(window.nanoblocks.game)) || sistema.matches); });
export function calmaActiva(g) { return !!(g && g.settings && g.settings.calma) || !!(sistema && sistema.matches); }
