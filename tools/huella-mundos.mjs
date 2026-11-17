// v13.3.0: la HUELLA de los mundos viejos. Genera trozos reales de los generadores 21, 22 y 23 (varias semillas y lugares, con pueblos, estructuras, carreteras,
// ríos y bocas de cueva) y saca un hash de los bloques y de las estructuras con datos. tools/huella-gen.json trae la huella tomada con el código de la v13.2.6
// (antes del generador 24): si cambia, un mundo ya creado saldría distinto (cuevas, pueblos o estructuras movidos). Uso:
//   node tools/huella-mundos.mjs           → compara con tools/huella-gen.json (código 1 si algo cambió)
//   node tools/huella-mundos.mjs --guardar → escribe tools/huella-gen.json (solo tomando la huella de una versión que se sabe buena)
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { Generator, CHUNK, HEIGHT } from '../src/worldgen.js';

const SEMILLAS = [424242, 777, 3, 2026];
// lugares en trozos: el origen, lejos, y los que cruzan pueblos y estructuras (se eligieron por tener de todo en estas semillas)
const LUGARES = [[0, 0], [-30, 40], [60, -45], [140, 110], [-120, -90], [20, 200]];
const N = 3; // 3×3 trozos por lugar
const VERSIONES = [21, 22, 23, 24, 25, 26, 27, 28, 29, 30];
const archivo = new URL('./huella-gen.json', import.meta.url);

export function huella() {
  const out = {};
  for (const ver of VERSIONES) {
    const h = createHash('sha1');
    const gen = new Generator(1, ver); void gen; // (calienta módulos)
    for (const s of SEMILLAS) {
      const g = new Generator(s, ver), buf = new Uint16Array(CHUNK * CHUNK * HEIGHT), tint = new Float32Array(CHUNK * CHUNK * 3);
      for (const [ox, oz] of LUGARES) for (let cz = oz; cz < oz + N; cz++) for (let cx = ox; cx < ox + N; cx++) {
        buf.fill(0);
        const st = g.generate(cx, cz, buf, tint) || [];
        h.update(Buffer.from(buf.buffer, buf.byteOffset, buf.byteLength));
        h.update(JSON.stringify(st.map((t) => [t.x, t.y, t.z, t.id, t.be ? t.be.type : (t.npc ? 'npc' : t.zone ? 'zona' : t.beacon ? 'faro' : '')])));
      }
    }
    out[ver] = h.digest('hex');
  }
  return out;
}

if (import.meta.url === new URL(process.argv[1], 'file://').href || process.argv[1].endsWith('huella-mundos.mjs')) {
  const ahora = huella();
  if (process.argv.includes('--guardar')) { fs.writeFileSync(archivo, JSON.stringify(ahora, null, 2) + '\n'); console.log('huella guardada', ahora); }
  else {
    const guardada = JSON.parse(fs.readFileSync(archivo, 'utf8'));
    let mal = 0;
    for (const v of VERSIONES) { const ok = guardada[v] === ahora[v]; if (!ok) mal++; console.log(`  ${ok ? '✔' : '✘'} generador ${v}: huella ${ok ? 'idéntica' : 'CAMBIÓ'}`); }
    process.exitCode = mal ? 1 : 0;
    console.log(mal ? '\n✘ un mundo viejo saldría distinto' : '\nMundos 21 a 29: idénticos.');
  }
}
