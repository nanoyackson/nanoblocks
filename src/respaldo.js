// v12.8.5 (urgente, «Que los mundos no se pierdan»): el 12-nov el navegador se cerró y se llevó IndexedDB y localStorage de
// localhost:5199 (todos los mundos). Tres cosas para que no vuelva a doler:
// 1. Al arrancar se pide almacenamiento PERSISTENTE (navigator.storage.persist): el navegador no lo borra solo para hacer campo.
//    Ajustes dice si quedó persistente o no.
// 2. El respaldo: «Descargar respaldo» (save.js descargarRespaldo) baja todos los mundos en un archivo, que se vuelve a cargar con
//    «Importar mundo». Cada ~2 horas de juego sin respaldo sale un aviso suave (se apaga en Ajustes).
// 3. Una marca aparte (una cookie con cuántos mundos había): si al arrancar no hay ninguno pero la marca dice que había, se avisa
//    y se explica cómo importar el respaldo. (Si el navegador borró también las cookies, no hay cómo saberlo.)
const MARCA = 'nanoblocks_mundos', DOS_HORAS = 2 * 3600;
let estado = { pedido: false, persistente: null, uso: null };

export async function pedirPersistencia() {
  const st = typeof navigator !== 'undefined' && navigator.storage;
  if (!st) { estado = { pedido: true, persistente: null, uso: null }; return estado; }
  try {
    let p = st.persisted ? await st.persisted() : false;
    if (!p && st.persist) p = await st.persist();
    estado = { pedido: true, persistente: !!p, uso: null };
    if (st.estimate) { const e = await st.estimate(); estado.uso = e && e.usage ? Math.round(e.usage / 1048576) : 0; }
  } catch { estado = { pedido: true, persistente: null, uso: null }; }
  return estado;
}
export const estadoAlmacen = () => estado;
// el texto para Ajustes
export function textoAlmacen() {
  let r = null;
  try { r = JSON.parse(localStorage.getItem('nanoblocks.respaldo') || 'null'); } catch { r = null; }
  const ultimo = r && r.t ? `Último respaldo: ${new Date(r.t).toLocaleString('es-CR')} (${r.n} mundo${r.n === 1 ? '' : 's'}).` : 'Todavía no ha descargado ningún respaldo.';
  const alm = estado.persistente === true ? '✔ El navegador guarda los mundos de forma persistente (no los borra solo).'
    : estado.persistente === false ? '⚠ El navegador puede borrar los mundos si se queda sin espacio o al limpiar los datos del sitio: descargue respaldos de vez en cuando.'
      : '⚠ No se sabe si el navegador guarda los mundos de forma persistente: descargue respaldos de vez en cuando.';
  return `${alm} ${ultimo}`;
}

// la marca de que había mundos (cookie: va aparte de IndexedDB y localStorage)
export function marcarMundos(n) {
  try { document.cookie = `${MARCA}=${Math.max(0, n | 0)}; max-age=31536000; path=/; SameSite=Lax`; } catch { /* sin cookies */ }
}
export function mundosMarcados() {
  try { const m = document.cookie.match(new RegExp(`(?:^|; )${MARCA}=(\\d+)`)); return m ? +m[1] : 0; } catch { return 0; }
}

// cada segundo de juego (game.js): cuenta el tiempo sin respaldo y avisa cada ~2 h (se guarda de a minuto)
let acum = 0;
export function tickRespaldo(g, dt) {
  if (g.settings && g.settings.avisoRespaldo === false) return;
  acum += dt;
  if (acum < 60) return;
  let s = 0;
  try { s = (Number(localStorage.getItem('nanoblocks.sinRespaldo')) || 0) + acum; localStorage.setItem('nanoblocks.sinRespaldo', String(s)); } catch { s += acum; }
  acum = 0;
  if (s >= DOS_HORAS) {
    try { localStorage.setItem('nanoblocks.sinRespaldo', '0'); } catch { /* nada */ }
    g.ui.toast('💾 Lleva un buen rato sin respaldo de sus mundos: en el menú, «Escoja un mundo» → «Descargar respaldo» (el aviso se apaga en Ajustes)', 6000);
  }
}
