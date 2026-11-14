// v12.9.0: genera dist/sw.js (service worker) después de `vite build`. Sin librerías. Uso: node tools/generar-sw.mjs
// Cada archivo lleva una clave: su URL, y para los que no llevan hash en el nombre, la URL con ?v=<hash corto>. Al actualizar solo se baja lo que cambió.
import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, relative } from 'node:path';

const DIST = 'dist';
const version = JSON.parse(readFileSync('package.json', 'utf8')).version;
const todos = [];
(function recorre(d) { for (const n of readdirSync(d)) { const p = join(d, n); if (statSync(p).isDirectory()) recorre(p); else todos.push(relative(DIST, p).replaceAll('\\', '/')); } })(DIST);

const hash = (f) => createHash('sha1').update(readFileSync(join(DIST, f))).digest('hex').slice(0, 8);
const conHash = (f) => /^assets\/.+-[A-Za-z0-9_-]{8}\.[a-z0-9]+$/.test(f); // los de Vite ya cambian de nombre con el contenido
const par = (f) => [f, conHash(f) ? f : `${f}?v=${hash(f)}`];

const sonidos = todos.filter((f) => f.endsWith('.ogg')).sort().map(par);
const precache = todos.filter((f) => f !== 'sw.js' && f !== 'manifest.webmanifest' && !f.endsWith('.ogg') && !f.endsWith('.map')).sort().map(par);

const plantilla = `// sw.js (generado por tools/generar-sw.mjs; no editar)
const VERSION = ${JSON.stringify(version)};
const PRECACHE = ${JSON.stringify(precache)};
const SONIDOS = ${JSON.stringify(sonidos)};
const abs = (u) => new URL(u, self.location).href;
const POR_URL = new Map([...PRECACHE, ...SONIDOS].map(([u, k]) => [abs(u), abs(k)]));
const fetchOk = async (u) => { const r = await fetch(u, { cache: 'reload' }); if (!r.ok) throw new Error(u + ' ' + r.status); return r; };

self.addEventListener('install', (e) => e.waitUntil((async () => {
  const c = await caches.open('nb-estatico');
  const tengo = new Set((await c.keys()).map((r) => r.url));
  for (const [u, k] of PRECACHE) if (!tengo.has(abs(k))) await c.put(abs(k), await fetchOk(u)); // si uno falla, falla la instalación (nunca una versión a medias)
  if (!self.registration.active) self.skipWaiting(); // primera instalación: no hay versión vieja a la que esperar
})()));

self.addEventListener('message', (e) => { if (e.data === 'activar') self.skipWaiting(); });

async function bajarSonidos() {
  const c = await caches.open('nb-sonidos');
  const tengo = new Set((await c.keys()).map((r) => r.url));
  const faltan = SONIDOS.filter(([, k]) => !tengo.has(abs(k)));
  let i = 0;
  await Promise.all(Array.from({ length: 4 }, async () => { while (i < faltan.length) { const [u, k] = faltan[i++]; try { await c.put(abs(k), await fetchOk(u)); } catch { /* se pide a la red al usarse */ } } }));
}

self.addEventListener('activate', (e) => e.waitUntil((async () => {
  const buenas = new Set(POR_URL.values());
  for (const nombre of ['nb-estatico', 'nb-sonidos']) {
    const c = await caches.open(nombre);
    for (const r of await c.keys()) if (!buenas.has(r.url)) await c.delete(r);
  }
  await self.clients.claim();
  bajarSonidos().catch(() => {});
})()));

self.addEventListener('fetch', (e) => {
  const q = e.request;
  if (q.method !== 'GET' || q.headers.has('range')) return;
  const url = new URL(q.url);
  if (url.origin !== self.location.origin) return;
  const sinQuery = url.origin + url.pathname;
  const base = abs('./');
  const clave = POR_URL.get(q.mode === 'navigate' ? (sinQuery === base || sinQuery === base + 'index.html' ? abs('index.html') : sinQuery) : sinQuery);
  if (!clave) return; // lo que no conocemos va a la red
  e.respondWith((async () => (await caches.match(clave)) || fetch(q))());
});
`;
writeFileSync(join(DIST, 'sw.js'), plantilla);
console.log(`sw.js ${version}: ${precache.length} archivos para jugar, ${sonidos.length} sonidos`);
