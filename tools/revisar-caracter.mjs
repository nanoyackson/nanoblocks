// v13.4.1 (generador 28): el carácter de los salones (tipos por bioma de arriba) y los lugares de cueva (campamento, cámara de eco, isla del silencio, altar).
// Mide con 6 semillas y una ventana de 2 400 × 2 400 alrededor del inicio; genera trozos de verdad para comprobar que cada lugar trae su cofre y su placa.
// Uso: node tools/revisar-caracter.mjs
import { Generator } from '../src/worldgen.js';
import { BLOCK_BY_KEY as K } from '../src/blocks.js';
import { GEN_CARACTER } from '../src/worldgen2.js';

let fallas = 0;
const ok = (c, m) => { console.log((c ? '  ✔ ' : '  ✘ ') + m); if (!c) fallas++; };
const RC = 96, SEMILLAS = [101, 202, 303, 404, 505, 606];
const tipos = {}, lug = { campamento: 0, camara_eco: 0, isla: 0, altar: 0 }, porZona = [0, 0, 0], salonesZona = [0, 0, 0];
let sal = 0, conLugar = 0, probados = 0, sinCofre = 0, sinPlaca = 0, enLiquido = 0, iniMax = 0;
const buf = new Uint16Array(16 * 16 * 128), tint = new Float32Array(768);
for (const seed of SEMILLAS) {
  const g = new Generator(seed, GEN_CARACTER, 'tierra', 'normal'), sp = g.findSpawn();
  for (let gz = Math.floor((sp.z - 1200) / RC); gz <= Math.floor((sp.z + 1200) / RC); gz++) for (let gx = Math.floor((sp.x - 1200) / RC); gx <= Math.floor((sp.x + 1200) / RC); gx++) {
    const n = g.v2.cmNodo(gx, gz); if (!n.salon) continue;
    sal++; tipos[n.tipo] = (tipos[n.tipo] || 0) + 1;
    const z = n.dO < 300 ? 0 : n.dO < 1000 ? 1 : 2; salonesZona[z]++;
    if (!n.lugar) continue;
    conLugar++; lug[n.lugar.tipo]++; porZona[z]++;
    if (z === 0 && n.lugar.tipo !== 'campamento' && n.lugar.tipo !== 'camara_eco') iniMax++;
    if (probados < 24 && probados * 3 < conLugar) { // se generan los trozos del lugar y se busca el cofre y la placa
      probados++;
      const L = n.lugar; let cofre = 0, placa = 0;
      for (let cz = Math.floor((L.z - 3) / 16); cz <= Math.floor((L.z + 3) / 16); cz++) for (let cx = Math.floor((L.x - 3) / 16); cx <= Math.floor((L.x + 3) / 16); cx++) {
        buf.fill(0); const st = g.generate(cx, cz, buf, tint) || [];
        for (const t of st) { const wx = cx * 16 + t.x, wz = cz * 16 + t.z; if (Math.abs(wx - L.x) <= 3 && Math.abs(wz - L.z) <= 3) { if (t.be && t.be.type === 'chest') cofre++; if (t.be && t.be.type === 'placa') placa++; } }
      }
      if (!cofre) sinCofre++; if (!placa) sinPlaca++;
      // el centro del lugar tiene piso firme y aire encima (4 de alto), salvo isla: agua alrededor
      const cx = Math.floor(L.x / 16), cz = Math.floor(L.z / 16); buf.fill(0); g.generate(cx, cz, buf, tint);
      const i = (L.x - cx * 16) + (L.z - cz * 16) * 16, solido = buf[i + L.y * 256], aire = buf[i + (L.y + 3) * 256];
      if (!(solido && solido !== K.water && solido !== K.lava && aire === 0)) enLiquido++;
    }
  }
}
const pct = (a, b) => (100 * a / (b || 1)).toFixed(1);
console.log(`Carácter de los salones (generador ${GEN_CARACTER}, ${SEMILLAS.length} semillas, ${sal} salones)`);
console.log('  tipos: ' + Object.entries(tipos).map(([t, v]) => `${t} ${pct(v, sal)} %`).join(', '));
console.log('  lugares: ' + Object.entries(lug).map(([t, v]) => `${t} ${v}`).join(', ') + ` · por zona (% de salones): Z1 ${pct(porZona[0], salonesZona[0])}, Z2 ${pct(porZona[1], salonesZona[1])}, Z3 ${pct(porZona[2], salonesZona[2])}`);
ok(['candil', 'hongueada', 'agujas', 'laguna', 'caldera'].every((t) => tipos[t] > 0), 'salen los cinco tipos de salón');
ok(+pct(tipos.laguna || 0, sal) <= 20 && +pct(tipos.caldera || 0, sal) <= 20, 'lagunas y calderas son minoría (≤ 20 % cada una)');
ok(+pct(conLugar, sal) >= 8 && +pct(conLugar, sal) <= 40, `lugares en ${pct(conLugar, sal)} % de los salones (8-40 %)`);
ok(+pct(porZona[0], salonesZona[0]) < +pct(porZona[2], salonesZona[2]), 'hay más lugares lejos del inicio que cerca');
ok(iniMax === 0, 'en la zona 1 solo campamento y cámara de eco (nada de isla ni altar)');
ok(lug.campamento > 0 && lug.camara_eco > 0 && lug.isla > 0 && lug.altar > 0, 'salen los cuatro lugares');
ok(probados >= 12 && sinCofre === 0 && sinPlaca === 0, `los ${probados} lugares generados traen su cofre y su placa`);
ok(enLiquido === 0, 'el centro de cada lugar probado tiene piso firme y aire encima');
console.log(fallas ? `\n✘ ${fallas} falla(s)` : '\nCarácter de los salones: todo bien.');
process.exitCode = fallas ? 1 : 0;
