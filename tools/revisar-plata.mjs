// Prueba de la plata (v11.10.6, cuarta revisión): que nunca se pierda un colón y que los textos digan montos de verdad.
// Uso: node tools/revisar-plata.mjs  (sale con error si algo falla)
//  1. Pagar con billete grande y la mochila llena: antes − pagado == después (la plata vive en la billetera, no ocupa casillas).
//  2. Cambiar y recibir no pierden nada; los billetes viejos se cambian por su valor.
//  3. Las migraciones 2→3→4 no botan plata aunque la mochila esté llena.
//  4. La paga por peligro: lo manso no paga; un jefe paga completo una vez por mundo; minijefes y leyendas, una vez por día.
//  5. aColones sobre todos los literales del juego que dicen «colones» o «₡»: nada mutilado, nada convertido dos veces.
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { Inventory, SLOTS } from '../src/inventory.js';
import { migrate } from '../src/save.js';
import { VALOR, K, aColones, fmtColones, precioBonito } from '../src/plata.js';
import { premioBaja } from '../src/precios.js';

let fallas = 0;
const ok = (cond, msg) => { if (!cond) { fallas++; console.log('✘ ' + msg); } else console.log('✔ ' + msg); };
const llena = (inv) => { for (let i = 0; i < SLOTS; i++) if (!inv.slots[i]) inv.slots[i] = { id: 1, count: 64 }; };

// 1 y 2
{
  const inv = new Inventory();
  llena(inv);
  inv.add(370, 1); // un billete de ₡20 000
  const antes = inv.colones();
  const pagado = inv.pagarColones(500);
  ok(antes - pagado === inv.colones() && inv.colones() === 19500, `pagar ₡500 con un billete de ₡20 000 y la mochila llena deja ${fmtColones(inv.colones())}`);
  inv.cambiar(false);
  ok(inv.colones() === 19500, 'partir en monedas no pierde nada');
  inv.cambiar(true);
  ok(inv.colones() === 19500, 'juntar en billetes no pierde nada');
  inv.add(387, 1);
  ok(inv.colones() === 69500 && !inv.billetera[387], 'un billete viejo de ₡50 000 entra por su valor, en piezas de verdad');
  inv.add(360, 3);
  ok(inv.colones() === 71000, 'recibir 3 unidades suma ₡1 500');
  ok(inv.count(360) === Math.floor(71000 / K), 'count(COLON) cuenta en unidades');
}
// 3
{
  const slots = Array.from({ length: SLOTS }, () => ({ id: 1, count: 64 }));
  slots[0] = { id: 360, count: 999 }; slots[1] = { id: 387, count: 3 };
  const m = migrate({ format: 2, inventory: { slots, selected: 0 } });
  const total = Object.entries(m.inventory.billetera || {}).reduce((a, [id, n]) => a + VALOR[id] * n, 0) + m.inventory.slots.reduce((a, s) => a + (s && VALOR[s.id] ? VALOR[s.id] * s.count : 0), 0);
  ok(total === 999 * 500 + 3 * 50000, `migración 2→4 con la mochila llena conserva ${fmtColones(total)}`);
  ok(!m.inventory.slots.some((s) => s && VALOR[s.id]), 'después de migrar, la plata no ocupa casillas');
}
// 4
{
  const g = { meta: {}, day: 3 };
  const mob = (type, extra) => ({ type, kind: { hostile: true, boss: false, ...extra }, data: {} });
  ok(premioBaja(mob('cuche_monte', { hostile: false }), g).u === 0, 'el cuche de monte (manso) no paga');
  const j1 = premioBaja(mob('sapo_tata', { boss: true }), g), j2 = premioBaja(mob('sapo_tata', { boss: true }), g);
  ok(j1.completo && !j2.completo && j2.u < j1.u / 5, `un jefe paga completo una vez (${j1.u}) y después poquito (${j2.u})`);
  const l1 = premioBaja(mob('cadejos'), g), l2 = premioBaja(mob('segua'), g);
  g.day = 4;
  const l3 = premioBaja(mob('llorona'), g);
  ok(l1.completo && !l2.completo && l3.completo, 'la primera leyenda del día paga completo; la segunda del mismo día no; al otro día, sí');
}
// precios bonitos
ok(precioBonito(0.9, true) * K === 450 && precioBonito(0.91, true) * K === 475 && precioBonito(0.91, false) * K === 450, 'precios con monedas chicas: ₡450, ₡475');
// 5
{
  const casos = [['Son 40 colones, mi cepa', `Son ${fmtColones(20000)}, mi cepa`], ['a 300 000 colones', 'a 300 000 colones'], [`Le cayeron ${fmtColones(500)}`, `Le cayeron ${fmtColones(500)}`], ['₡6 y ₡1.4', `${fmtColones(3000)} y ${fmtColones(700)}`]];
  for (const [a, b] of casos) ok(aColones(a) === b, `aColones(«${a}») → «${aColones(a).replace(/⁠/g, '')}»`);
  const dir = fileURLToPath(new URL('../src/', import.meta.url));
  let n = 0;
  const malos = [];
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.js') && !['plata.js', 'version.js'].includes(x))) {
    const t = readFileSync(dir + f, 'utf8').split(/\r?\n/).filter((l) => !/^\s*\/\//.test(l)).join('\n');
    for (const m of t.matchAll(/(['`])((?:(?!\1)[^\\\n]|\\.)*?(?:₡|colones|colón)(?:(?!\1)[^\\\n]|\\.)*?)\1/g)) {
      const lit = m[2], sal = aColones(lit.replace(/\$\{[^}]*\}/g, '7'));
      n++;
      // mutilado (un «₡0» suelto o cifras partidas) o convertido a montos absurdos (más de ₡10 millones)
      const cifras = [...sal.matchAll(/₡⁠?([\d ]+)/g)].map((x) => Number(x[1].replace(/ /g, '')));
      if (/₡⁠?0(?![\d ])/.test(sal) || cifras.some((c) => c > 1e7)) malos.push(`${f}: «${lit.slice(0, 80)}» → «${sal.replace(/⁠/g, '').slice(0, 80)}»`);
    }
  }
  ok(!malos.length, `aColones sobre ${n} literales con montos: ${malos.length} raros${malos.length ? '\n    ' + malos.join('\n    ') : ''}`);
}
if (fallas) { console.log(`\n${fallas} falla(s)`); process.exitCode = 1; } else console.log('\nTodo bien: ni un colón perdido.');
