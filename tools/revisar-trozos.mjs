// v12.4.9 (novena revisión): después de `npm run build`, busca ciclos de imports ESTÁTICOS entre los trozos de dist/assets (los
// import() dinámicos no cuentan). Un ciclo entre trozos es lo que dieron «vida» y «datos» al partirlos a mano. Uso: node tools/revisar-trozos.mjs
import fs from 'node:fs';
import path from 'node:path';

const dir = 'dist/assets';
if (!fs.existsSync(dir)) { console.log('✘ falta dist/: correr npm run build primero'); process.exit(1); }
const trozos = fs.readdirSync(dir).filter((f) => f.endsWith('.js'));
const grafo = {};
for (const f of trozos) {
  const s = fs.readFileSync(path.join(dir, f), 'utf8');
  const deps = new Set();
  // import{…}from"./x.js" · import"./x.js" · export{…}from"./x.js" (no import("./x.js"))
  for (const m of s.matchAll(/(?:^|[;}\s])(?:import|export)\s*(?:[^'"()]*?\bfrom\s*)?["']\.\/([\w.-]+\.js)["']/g)) if (m[1] !== f) deps.add(m[1]);
  grafo[f] = [...deps];
}
const ciclos = [];
const estado = {};
const pila = [];
function visitar(n) {
  estado[n] = 1; pila.push(n);
  for (const d of grafo[n] || []) {
    if (estado[d] === 1) ciclos.push([...pila.slice(pila.indexOf(d)), d].join(' → '));
    else if (!estado[d]) visitar(d);
  }
  pila.pop(); estado[n] = 2;
}
for (const n of Object.keys(grafo)) if (!estado[n]) visitar(n);
for (const [f, d] of Object.entries(grafo)) console.log(`  ${f}: ${d.join(', ') || '—'}`);
console.log(ciclos.length ? `\n✘ ${ciclos.length} ciclo(s):\n${ciclos.join('\n')}` : `\nTodo bien: ${trozos.length} trozos, ningún ciclo estático entre ellos.`);
if (ciclos.length) process.exitCode = 1;
