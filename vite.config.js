import { defineConfig } from 'vite';

// los trozos fijos del build: el nombre del trozo y los archivos (sin .js) que van en él
const TROZOS = {
  // las estructuras del mundo (mucho código de construcción)
  mundo: ['estructuras', 'monumentos_grandes', 'estadios', 'lujo', 'refineria', 'historicos', 'agro', 'naturaleza2', 'parques', 'parques2', 'pueblos2', 'pueblo6', 'carreteras', 'festejos', 'regiones', 'lugares3', 'parques3', 'agro2', 'canopy'],
  // v12.0.1: los gráficos (atmósfera, cielo, horizonte lejano)
  graficos: ['atmosfera', 'sky', 'lod', 'lodmesh'],
  // las criaturas (modelos y cerebros)
  criaturas: ['fauna', 'finca', 'leyendas', 'mar', 'tulevieja', 'arpia', 'inframundo', 'armas2', 'fauna2', 'mar2', 'monocongo', 'arena', 'mundo2', 'juegos', 'bingo', 'fauna3', 'leyendas2', 'aire', 'arribada', 'tiro', 'carreta', 'avioneta', 'vehiculos2', 'mascotas', 'sirena', 'zancudos', 'mejenga', 'vehiculos', 'bus'],
  // los textos puros (el historial de versiones, la lista de logros, las cartas)
  textos: ['version', 'logros-lista', 'correo_cartas', 'anselmo_cartas'],
  // el expediente y el epílogo (con lo que arrastran); otros módulos de la trama hacen ciclo con las criaturas
  trama: ['expediente', 'epilogo'],
  // v12.11.0: jugar con amistades (Trystero + sesión + pantallas). Solo se descarga al pulsar «Jugar con amistades»; nada del núcleo lo importa de forma estática
  red: ['transporte', 'sesion', 'codigo', 'pantallas', 'remotos', 'validar', 'limites'],
};
const DE_TROZO = new Map(Object.entries(TROZOS).flatMap(([trozo, l]) => l.map((n) => [`${n}.js`, trozo])));
const NUCLEO = new Set(['main.js', 'game.js', 'ui.js']);
const archivo = (id) => id.split(/[\\/]/).pop();

// v12.4.5: el trozo «base» se calcula solo. Un módulo de src/ entra si TODO lo que importa (de forma estática, hasta el fondo) también
// puede entrar: nada de los trozos fijos ni del núcleo (main, game, ui). Así «base» nunca importa al index ni a otro trozo, y no
// puede haber ciclos entre trozos (los que dieron «vida» y «datos» al probarlos a mano). Los módulos nuevos caen donde corresponde.
// Dentro de la base, el «arte» (modelos, texturas y bloques) va en su propio trozo con la misma regla, para que ninguno pase de 700 kB:
// un módulo del arte solo importa otros del arte (o three).
const ARTE = /^(modelos-.*|lowpoly|anatomia|models|textures|pixelart|blocks|noise|arte|texturas_arte)\.js$/;
const libre = new Map(), deArte = new Map();
function enBase(id, getModuleInfo, cache = libre, permitido = () => true) {
  if (cache.has(id)) return cache.get(id);
  const vistos = new Set(), pila = [id];
  let ok = true;
  while (pila.length && ok) {
    const m = pila.pop();
    if (vistos.has(m)) continue;
    vistos.add(m);
    if (m.includes('node_modules/three')) continue; // three va en su trozo y no importa nada nuestro
    const f = archivo(m);
    if (!/[\\/]src[\\/]/.test(m) || !f.endsWith('.js') || DE_TROZO.has(f) || NUCLEO.has(f) || !permitido(f) || cache.get(m) === false) { ok = false; break; }
    const info = getModuleInfo(m);
    if (!info) { ok = false; break; }
    for (const d of info.importedIds) pila.push(d);
  }
  cache.set(id, ok);
  return ok;
}

export default defineConfig({
  base: './',
  // v12.0.0: assets-src/ (los PNG originales del arte, que llegan mientras uno juega) y docs/ no se vigilan: un PNG a medio escribir
  // tumbaba el servidor (EBUSY)
  server: { port: 5199, strictPort: true, watch: { ignored: ['**/assets-src/**', '**/docs/**'] } },
  preview: { port: 5199, strictPort: true },
  build: {
    chunkSizeWarningLimit: 700,
    // los íconos de ítems (src/assets/items) van como archivos aparte, no metidos en el JS
    assetsInlineLimit: (file) => (/[\\/]assets[\\/]items[\\/]/.test(file) ? false : undefined),
    rollupOptions: {
      output: {
        // three.js aparte, los trozos fijos y la «base» calculada; el resto (main, game, ui y lo que dependa de ellos) es el index
        manualChunks(id, { getModuleInfo }) {
          if (id.includes('node_modules/three')) return 'three';
          if (/node_modules[\\/](trystero|@trystero-p2p)[\\/]/.test(id)) return 'red';
          const fijo = DE_TROZO.get(archivo(id));
          if (fijo) return fijo;
          if (!/[\\/]src[\\/]/.test(id)) return undefined;
          if (ARTE.test(archivo(id)) && enBase(id, getModuleInfo, deArte, (f) => ARTE.test(f))) return 'arte';
          if (enBase(id, getModuleInfo)) return 'base';
          return undefined;
        },
      },
    },
  },
});
