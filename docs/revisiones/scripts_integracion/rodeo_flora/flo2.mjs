import fs from 'fs';
import { fileURLToPath } from 'url';
// ruta relativa al script: docs/revisiones/scripts_integracion/rodeo_flora/ -> src/ de la raíz del repo
const R = fileURLToPath(new URL('../../../../src/', import.meta.url));
const tipos = JSON.parse(fs.readFileSync('tipos.json', 'utf8'));
const cache = {};
const src = (f) => (cache[f] ??= fs.readFileSync(R + f, 'utf8').split('\r').join(''));
const cuenta = (body, lista) => lista.reduce((a, w) => a + body.split(w).length - 1, 0);
const rows = [];
for (const t of tipos) {
  const s = src(t.f);
  const m = new RegExp('function[*]? +' + t.b + '[^A-Za-z0-9_]').exec(s);
  if (!m) { rows.push({ k: t.key, nota: 'no hallado' }); continue; }
  const i = m.index;
  let j = s.indexOf('\nfunction', i + 10);
  const jj = s.indexOf('\nexport function', i + 10);
  if (jj > 0 && (j < 0 || jj < j)) j = jj;
  const body = s.slice(i, j < 0 ? s.length : j);
  rows.push({
    k: t.key, R: t.R, f: t.f, npc: !!t.npc, len: body.length,
    flora: cuenta(body, ['flora(']),
    plantas: cuenta(body, ['K.tall_grass', 'K.pajon', 'K.flower', 'K.helecho', 'K.bromelia', 'K.orquidea', 'K.cane', 'K.musgo', 'K.arbusto', 'K.mata', 'K.maceta', 'K.heliconia', 'K.banano', 'K.cactus']),
    arboles: cuenta(body, ['tree(', 'plantTree', 'palma(', 'K.log', 'K.leaves', 'K.palm', 'K.jungle_log', 'K.trunk']),
  });
}
fs.writeFileSync('flora.json', JSON.stringify(rows));
for (const r of rows) console.log([r.k, r.R, r.f, r.npc ? 'npc' : '-', 'flora=' + r.flora, 'plantas=' + r.plantas, 'arb=' + r.arboles, r.nota || ''].join(' | '));
