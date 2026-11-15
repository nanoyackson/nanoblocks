// v12.9.0: la app instalable (PWA). El juego funciona igual sin service worker: todo aquí es opcional y a prueba de fallos.
// Solo se registra en producción (en `npm run dev` no hay service worker).
// v13.2.1: se actualiza SOLA, pero nunca a media partida: en el menú (o al arrancar) activa la versión nueva y recarga una vez; con un mundo
// abierto deja un aviso fijo «Actualizar ahora» y la aplica al volver al menú, ya guardado. Una recarga automática por versión como máximo
// (sessionStorage), y si el SW nuevo no se instala el juego sigue con el viejo sin errores. Qué hacer en cada caso: `decidir` (sin navegador).
let reg = null;          // el registro del service worker
let esperando = null;    // un SW nuevo listo para activar
let instalador = null;   // el evento beforeinstallprompt
let recargando = false;
let versionNueva = '';   // la versión del SW que espera (la dice él mismo)
let aplicando = false;   // se está pasando a la versión nueva (el aviso dice «Actualizando…»)
let aplazada = false;    // el anfitrión salió con invitados: no se aplica sola, se avisa
const K_INTENTO = 'nb.pwa.intento';
let enlace = { mundoAbierto: () => false, guardar: async () => {} };
const leerIntento = () => { try { return sessionStorage.getItem(K_INTENTO) || ''; } catch { return ''; } };
const marcarIntento = (v) => { try { sessionStorage.setItem(K_INTENTO, v); } catch { /* sin sessionStorage */ } };
const oyentes = new Set();
const avisar = () => oyentes.forEach((f) => { try { f(); } catch { /* un oyente roto no tumba a los demás */ } });

export const INTERVALO_BUSCAR = 15 * 60 * 1000; // v13.2.1: cada 15 min (antes 6 h)
/** Qué hacer con una versión nueva que espera: 'aplicar' (sola), 'avisar' (aviso fijo y botón) o 'nada'. Nunca 'aplicar' con un mundo abierto,
 *  con un anfitrión que salió con invitados, ni dos veces con la misma versión (sin bucles). */
export function decidir({ hayNueva, version, intento, mundoAbierto, aplazada: ap }) {
  if (!hayNueva) return 'nada';
  if (mundoAbierto || ap) return 'avisar';
  if (intento && intento === (version || 'nueva')) return 'avisar';
  return 'aplicar';
}

export const pwa = {
  /** ¿corre ya como app instalada? */
  instalada: () => (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true,
  puedeInstalar: () => !!instalador && !pwa.instalada(),
  hayNueva: () => !!esperando,
  aplicando: () => aplicando,
  versionNueva: () => versionNueva,
  /** 'sin' (no hay SW: desarrollo o navegador viejo) · 'activo' (juega sin conexión) */
  estado: () => (reg && reg.active ? 'activo' : 'sin'),
  alCambiar(f) { oyentes.add(f); return () => oyentes.delete(f); },
  /** ui.js: cómo saber si hay un mundo abierto y cómo guardarlo */
  enlazar(o) { enlace = { ...enlace, ...o }; },
  /** se salió del mundo (ya guardado): si hay versión nueva se aplica sola, salvo un anfitrión que dejó invitados (entonces solo se avisa) */
  salioDelMundo(conInvitados) { aplazada = !!conInvitados; revisar(); },
  revisar,
  async instalar() {
    if (!instalador) return false;
    const ev = instalador; instalador = null;
    try { ev.prompt(); await ev.userChoice; } catch { /* cerró el diálogo */ }
    avisar();
    return true;
  },
  /** el botón «Actualizar ahora»: guarda (enlace.guardar) y pasa a la versión nueva */
  async actualizar() { if (esperando) await aplicar(false); else buscar(); },
  buscar,
};

function preguntarVersion(sw) {
  return new Promise((res) => {
    try {
      const c = new MessageChannel(), t = setTimeout(() => res(''), 1500);
      c.port1.onmessage = (e) => { clearTimeout(t); res(String(e.data || '')); };
      sw.postMessage('version', [c.port2]);
    } catch { res(''); }
  });
}
async function aplicar(auto) {
  if (!esperando || aplicando) return;
  aplicando = true; marcarIntento(versionNueva || 'nueva'); avisar(); // el aviso «Actualizando…» se alcanza a ver
  if (auto) await new Promise((r) => setTimeout(r, 900));
  try { await enlace.guardar(); } catch { /* el juego guarda también solo */ }
  try { esperando.postMessage('activar'); } catch { /* el SW se fue */ }
  setTimeout(() => { aplicando = false; avisar(); }, 8000); // si no cambió el controlador, se abandona (sin bucle: el intento ya quedó marcado)
}
async function revisar() {
  if (!esperando || aplicando) return;
  const accion = decidir({ hayNueva: true, version: versionNueva, intento: leerIntento(), mundoAbierto: !!enlace.mundoAbierto(), aplazada });
  if (accion === 'aplicar') await aplicar(true);
  else avisar();
}
function nuevo(sw) {
  esperando = sw; versionNueva = ''; avisar();
  preguntarVersion(sw).then((v) => { if (esperando === sw) { versionNueva = v; avisar(); revisar(); } });
}

function buscar() { try { return reg && reg.update().catch(() => {}); } catch { return null; } }

function vigilar(sw) {
  if (!sw) return;
  const mira = () => {
    if (sw.state === 'installed' && navigator.serviceWorker.controller) nuevo(sw);
    else if (sw.state === 'redundant' && esperando === sw) { esperando = null; aplicando = false; avisar(); } // el nuevo falló o lo reemplazó otro: se sigue con el que hay
  };
  sw.addEventListener('statechange', mira); mira();
}

export function iniciarPwa() {
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); instalador = e; avisar(); });
  window.addEventListener('appinstalled', () => { instalador = null; avisar(); });
  if (!('serviceWorker' in navigator) || !import.meta.env.PROD) return;
  let habia = !!navigator.serviceWorker.controller; // en la primera instalación el SW toma el control sin recargar
  navigator.serviceWorker.register('./sw.js', { scope: './', updateViaCache: 'none' }).then((r) => {
    reg = r;
    if (r.waiting && navigator.serviceWorker.controller) nuevo(r.waiting);
    r.addEventListener('updatefound', () => vigilar(r.installing));
    avisar();
    navigator.serviceWorker.ready.then(avisar).catch(() => {});
    navigator.storage?.persist?.().catch(() => {});
    buscar(); // al arrancar: la versión nueva sale en cuanto se instala
    setInterval(buscar, INTERVALO_BUSCAR);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) buscar(); });
    window.addEventListener('focus', buscar);
  }).catch(() => { /* sin service worker el juego sigue igual */ });
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (recargando) return; if (!habia) { habia = true; return; } recargando = true; location.reload(); });
}
