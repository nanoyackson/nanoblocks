// v12.9.0: la app instalable (PWA). El juego funciona igual sin service worker: todo aquí es opcional y a prueba de fallos.
// Solo se registra en producción (en `npm run dev` no hay service worker). Nunca recarga solo: avisa y la persona acepta.
let reg = null;          // el registro del service worker
let esperando = null;    // un SW nuevo listo para activar
let instalador = null;   // el evento beforeinstallprompt
let recargando = false;
const oyentes = new Set();
const avisar = () => oyentes.forEach((f) => { try { f(); } catch { /* un oyente roto no tumba a los demás */ } });

export const pwa = {
  /** ¿corre ya como app instalada? */
  instalada: () => (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true,
  puedeInstalar: () => !!instalador && !pwa.instalada(),
  hayNueva: () => !!esperando,
  /** 'sin' (no hay SW: desarrollo o navegador viejo) · 'activo' (juega sin conexión) */
  estado: () => (reg && reg.active ? 'activo' : 'sin'),
  alCambiar(f) { oyentes.add(f); return () => oyentes.delete(f); },
  async instalar() {
    if (!instalador) return false;
    const ev = instalador; instalador = null;
    try { ev.prompt(); await ev.userChoice; } catch { /* cerró el diálogo */ }
    avisar();
    return true;
  },
  /** guardar lo que haga falta (lo hace quien llama) y pasar a la versión nueva */
  actualizar() { if (esperando) esperando.postMessage('activar'); else buscar(); },
  buscar,
};

function buscar() { try { return reg && reg.update().catch(() => {}); } catch { return null; } }

function vigilar(sw) {
  if (!sw) return;
  const mira = () => { if (sw.state === 'installed' && navigator.serviceWorker.controller) { esperando = sw; avisar(); } };
  sw.addEventListener('statechange', mira); mira();
}

export function iniciarPwa() {
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); instalador = e; avisar(); });
  window.addEventListener('appinstalled', () => { instalador = null; avisar(); });
  if (!('serviceWorker' in navigator) || !import.meta.env.PROD) return;
  let habia = !!navigator.serviceWorker.controller; // en la primera instalación el SW toma el control sin recargar
  navigator.serviceWorker.register('./sw.js', { scope: './', updateViaCache: 'none' }).then((r) => {
    reg = r;
    if (r.waiting && navigator.serviceWorker.controller) esperando = r.waiting;
    r.addEventListener('updatefound', () => vigilar(r.installing));
    avisar();
    navigator.serviceWorker.ready.then(avisar).catch(() => {});
    navigator.storage?.persist?.().catch(() => {});
    setInterval(buscar, 6 * 3600 * 1000);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) buscar(); });
  }).catch(() => { /* sin service worker el juego sigue igual */ });
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (recargando) return; if (!habia) { habia = true; return; } recargando = true; location.reload(); });
}
