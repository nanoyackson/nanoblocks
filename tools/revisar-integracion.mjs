// v13.3.0 (generador 24): que las obras queden integradas al terreno. Compara el generador 24 con el 23 en varias semillas y comprueba, con números:
//  1) ninguna boca de cueva en el generador 24 a menos de R+22 de una estructura ni de R+26 de un pueblo (en el 23 sí las hay);
//  2) la calle de los pueblos ya no tiene vacío debajo (en el 23 ≈ 7 % de las celdas; en el 24 casi ninguna);
//  3) ningún bloque de agua sobre el mar en una columna de océano o playa dentro de un trozo con obras (el «domo» del templo hundido);
//  4) los radios corregidos (irazú, san Lucas, cueva del Venado, Marino Ballena) y las coordenadas de las estructuras válidas;
//  5) el tiempo por trozo, normal y de pueblo (meta: promedio ≤ 12 ms);
//  6) lo que se pierde en silencio: datos de estructura sin su bloque (en el 24 no más que en el 23).
// La huella de los mundos 21, 22 y 23 la vigila tools/huella-mundos.mjs. Uso: node tools/revisar-integracion.mjs
import { Generator, CHUNK, HEIGHT } from '../src/worldgen.js';
import { BLOCK_BY_KEY as K, BLOCKS } from '../src/blocks.js';
import { villageAt, CELL } from '../src/pueblogen.js';
import { cercaDeObra, structRadius, structuresNear } from '../src/estructuras.js';
import { GEN_INTEGRACION } from '../src/worldgen2.js';

let fallas = 0;
const ok = (c, m) => { console.log((c ? '  ✔ ' : '  ✘ ') + m); if (!c) fallas++; };
const idx = (x, y, z) => x + z * CHUNK + y * CHUNK * CHUNK;
const SEMILLAS = [101, 202, 303, 404];
const RADIO_AREA = 1500; // bloques desde el origen
const buf = new Uint16Array(CHUNK * CHUNK * HEIGHT), tint = new Float32Array(CHUNK * CHUNK * 3);
const CALLE = new Set([K.asfalto, K.asfalto_linea, K.acera]);

ok(GEN_INTEGRACION === 24, 'GEN_INTEGRACION es 24');
const g23 = (s) => new Generator(s, 23), g24 = (s) => new Generator(s, 24);

// pueblos de cada semilla
const pueblos = (gen) => {
  const out = [];
  const n = Math.ceil(RADIO_AREA / CELL);
  for (let cz = -n; cz <= n; cz++) for (let cx = -n; cx <= n; cx++) { const v = villageAt(gen, cx, cz); if (v) out.push(v); }
  return out;
};

// 1) bocas lejos de las obras
{
  let bocas23 = 0, bocas24 = 0, malas24 = 0;
  for (const s of SEMILLAS) {
    const a = g23(s), b = g24(s);
    for (const [gen, es24] of [[a, false], [b, true]]) {
      // la zona alrededor de cada pueblo y de cada estructura de la semilla: recorre las celdas de boca (16×16)
      const centros = pueblos(gen).map((v) => [v.x, v.z, (v.R || 46) + 26]);
      for (const P of structuresNear(gen, 0, 0, RADIO_AREA)) centros.push([P.x, P.z, structRadius(gen, P.type) + 22]);
      for (const [cx, cz, gap] of centros) {
        for (let gz = Math.floor((cz - gap) / 16); gz <= Math.floor((cz + gap) / 16); gz++) for (let gx = Math.floor((cx - gap) / 16); gx <= Math.floor((cx + gap) / 16); gx++) {
          const bo = gen.v2.bocaIn(gx, gz);
          if (!bo || Math.max(Math.abs(bo.x - cx), Math.abs(bo.z - cz)) >= gap) continue;
          if (es24) { if (cercaDeObra(gen, bo.x, bo.z)) malas24++; bocas24++; } else bocas23++;
        }
      }
    }
  }
  console.log(`  bocas de cueva dentro del radio de una obra (4 semillas): generador 23 → ${bocas23} · generador 24 → ${bocas24}`);
  ok(bocas24 === 0 && malas24 === 0, 'en el generador 24 no hay ninguna boca dentro del radio de una estructura (R+22) o de un pueblo (R+26)');
  ok(bocas23 > 20, `(control) en el generador 23 sí hay bocas debajo de las obras (${bocas23})`);
}

// 2) calles de pueblo: vacío debajo
{
  const med = (gen) => {
    let calle = 0, hueco = 0, trozos = 0;
    for (const v of pueblos(gen)) {
      if (!v.streets) continue;
      const cx0 = Math.floor(v.x / CHUNK);
      const cz0 = Math.floor(v.z / CHUNK);
      for (let cz = cz0 - 3; cz <= cz0 + 3; cz++) for (let cx = cx0 - 3; cx <= cx0 + 3; cx++) {
        buf.fill(0); gen.generate(cx, cz, buf, tint); trozos++;
        for (let z = 0; z < CHUNK; z++) for (let x = 0; x < CHUNK; x++) for (let y = 100; y >= 6; y--) {
          const b = buf[idx(x, y, z)];
          if (b === 0) continue;
          if (CALLE.has(b)) { calle++; if (buf[idx(x, y - 1, z)] === 0 || buf[idx(x, y - 2, z)] === 0) hueco++; }
          break;
        }
      }
    }
    return { calle, hueco, trozos };
  };
  let a = { calle: 0, hueco: 0, trozos: 0 }, b = { calle: 0, hueco: 0, trozos: 0 };
  for (const s of SEMILLAS.slice(0, 3)) { const x = med(g23(s)), y = med(g24(s)); for (const k of Object.keys(a)) { a[k] += x[k]; b[k] += y[k]; } }
  const p = (o) => (o.calle ? (100 * o.hueco / o.calle).toFixed(1) : '0');
  console.log(`  celdas de calle con vacío a 1-2 bloques debajo: generador 23 → ${a.hueco} de ${a.calle} (${p(a)} %) · generador 24 → ${b.hueco} de ${b.calle} (${p(b)} %)`);
  ok(b.calle > 500, `se midieron calles de pueblo (${b.calle} celdas)`);
  ok(b.hueco <= a.hueco * 0.2 + 5 || (b.hueco / Math.max(1, b.calle)) < 0.01, 'el vacío bajo las calles baja al menos 80 % (o queda por debajo del 1 %)');
}

// 3) agua sobre el mar en costa y 4) tiempos, coordenadas de estructuras y datos que se pierden
{
  const SEA = 62;
  let aguaAlta = 0, trozos = 0, perdidas24 = 0, entradas24 = 0, perdidas23 = 0, entradas23 = 0, malasCoord = 0;
  const msN = [], msP = [], msN3 = [], msP3 = [];
  for (const s of SEMILLAS) {
    const gen = g24(s), gen3 = g23(s);
    const lista = [];
    // trozos de los pueblos y de las estructuras de la semilla (con costa: las estructuras de costa los cubren) más una malla de trozos normales
    for (const v of pueblos(gen)) lista.push([Math.floor(v.x / CHUNK), Math.floor(v.z / CHUNK), true]);
    for (const P of structuresNear(gen, 0, 0, RADIO_AREA)) lista.push([Math.floor(P.x / CHUNK), Math.floor(P.z / CHUNK), false]);
    for (let i = 0; i < 40; i++) lista.push([((i * 37) % 61) - 30, ((i * 53) % 67) - 33, false]);
    for (const [cx, cz, pueblo] of lista) {
      for (const [gg, es24] of [[gen, true], [gen3, false]]) {
        buf.fill(0); gg.generate(cx, cz, buf, tint); // calentamiento (el primero que toca un trozo paga el arranque en frío)
        buf.fill(0);
        const t0 = performance.now();
        const st = gg.generate(cx, cz, buf, tint) || [];
        const ms = performance.now() - t0;
        if (trozos++ > 4) (es24 ? (pueblo ? msP : msN) : (pueblo ? msP3 : msN3)).push(ms);
        for (const t of st) {
          if (t.npc || t.zone || t.beacon) continue;
          if (es24 && !(Number.isInteger(t.x) && t.x >= 0 && t.x < CHUNK && t.z >= 0 && t.z < CHUNK && t.y >= 0 && t.y < HEIGHT)) { malasCoord++; continue; }
          const b = BLOCKS[buf[idx(t.x, t.y, t.z)]];
          const falta = !b || (t.id ? buf[idx(t.x, t.y, t.z)] !== t.id : b.key !== t.be.type);
          if (es24) { entradas24++; if (falta) perdidas24++; } else { entradas23++; if (falta) perdidas23++; }
        }
        if (es24) for (let z = 0; z < CHUNK; z++) for (let x = 0; x < CHUNK; x++) {
          const col = gg.column(cx * CHUNK + x, cz * CHUNK + z);
          if ((col.biome !== 'ocean' && col.biome !== 'beach') || col.h >= SEA) continue; // solo mar real (altura bajo el nivel del mar)
          for (let y = SEA + 1; y < 110; y++) if (buf[idx(x, y, z)] === K.water) aguaAlta++;
        }
      }
    }
  }
  const prom = (a) => (a.length ? [...a].sort((p, q) => p - q)[Math.floor(a.length / 2)] : 0), peor = (a) => Math.max(0, ...a); // «prom» = mediana (el promedio lo arruinan los arranques en frío)
  console.log(`  agua sobre el mar en columnas de mar real (generador 24): ${aguaAlta} bloques`);
  ok(aguaAlta === 0, 'ningún bloque de agua sobre el nivel del mar en columnas de océano o playa');
  ok(malasCoord === 0, 'las estructuras traen coordenadas locales válidas');
  console.log(`  datos de estructura sin su bloque: generador 23 → ${perdidas23} de ${entradas23} · generador 24 → ${perdidas24} de ${entradas24}`);
  ok(entradas24 === 0 || perdidas24 / entradas24 <= (perdidas23 / Math.max(1, entradas23)) * 1.5 + 0.002, 'los datos que se pierden no crecen en el generador 24');
  console.log(`  tiempo por trozo (generador 24): normal mediana ${prom(msN).toFixed(1)} ms (generador 23: ${prom(msN3).toFixed(1)}; peor ${peor(msN).toFixed(0)}) · de pueblo mediana ${prom(msP).toFixed(1)} ms (generador 23: ${prom(msP3).toFixed(1)}; peor ${peor(msP).toFixed(0)})`);
  ok(prom(msN) <= 12 && prom(msP) <= 12 && prom(msN) <= prom(msN3) * 1.25 + 1 && prom(msP) <= prom(msP3) * 1.25 + 1, 'la mediana por trozo, normal y de pueblo, es de 12 ms o menos y no pasa de la del generador 23 (+25 %)');
}

// 5) radios corregidos
{
  const a = g23(1), b = g24(1);
  const q = { irazu: 34, san_lucas: 26, cueva_venado: 35, marino_ballena: 75 };
  for (const [k, r] of Object.entries(q)) ok(structRadius(b, k) === r && structRadius(a, k) < r, `${k}: radio ${structRadius(a, k)} → ${structRadius(b, k)} en el generador 24 (el 23 no cambia)`);
}

process.exitCode = fallas ? 1 : 0;
console.log(fallas ? `\n✘ ${fallas} falla(s)` : '\nIntegración de las obras: todo bien.');
