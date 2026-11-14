// Economía: precios que cambian cada día en las tiendas (y avisos de la feria), la soda propia (rótulo + clientes
// que llegan a pedir comida) y la cuenta de ahorros en el banco (con intereses… y la fila eterna).
import { VALOR, K as KP, precioBonito, fmtUnidades } from './plata.js';
import { BLOCK_BY_KEY as K, getDef } from './blocks.js';
import { hash3 } from './noise.js';
import { decir } from './misiones.js';
import { quizaInspector } from './satira.js';

const COLON = 360;

// ---------- precios del día: lo que compran las tiendas sube o baja (60 % a 160 %) ----------
export function factorDia(g, id) {
  const d = g.day || 1;
  const h = hash3(77, d, id, 3);
  return 0.8 + h * 0.45; // los precios se mueven, pero no alcanzan para hacerse rico comprando y revendiendo
}
export function precioDia(g, id, base) { return Math.max(1, Math.round(base * factorDia(g, id))); }
export function flecha(g, id) { const f = factorDia(g, id); return f > 1.12 ? ' ▲' : f < 0.9 ? ' ▼' : ''; }

// cada mañana, el precio estrella de la feria
export const COSECHAS = [268, 269, 294, 275, 276, 297, 377];
// v12.4.0: el sábado de 8 de la mañana a 5 de la tarde es día de feria
export const diaDeFeria = (g) => ((g.day || 1) % 7) === 6 && g.time > 0.083 && g.time < 0.458;
export function tickPrecios(g) {
  const d = g.day || 1;
  if (g.meta.diaPrecios === d) return;
  g.meta.diaPrecios = d;
  if (d === 1 || g.daylight < 0.3) return;
  if ((d % 7) === 6) { g.ui.toast('🐂 Sábado de feria del agricultor, de 8 a 5: sus cosechas valen más con el feriante', 3600); }
  let best = COSECHAS[0], bf = 0;
  for (const id of COSECHAS) { const f = factorDia(g, id); if (f > bf) { bf = f; best = id; } }
  const def = getDef(best);
  if (bf > 1.3) g.ui.toast(`📈 Feria: hoy ${def ? def.name.toLowerCase() : 'la cosecha'} se paga ${Math.round(bf * 100)} %`, 4200);
}

// ---------- la soda propia ----------
export const MENU = [[270, 3], [265, 4], [298, 3], [393, 5], [353, 7], [417, 8], [351, 10], [392, 9]];
const PIDE = { 270: '¡Unas tortillas, por favor!', 265: '¿Me da una carne asada?', 298: 'Un cafecito chorreado, porfa.', 393: '¡Una empanada!', 353: '¿Tiene tamal?', 417: 'Una sopa negra, que hace frío.', 351: '¡Un casado completo!', 392: 'Una olla de carne, por favor.' };
export function tickSoda(g) {
  if (g.dim !== 'tierra') return;
  // los que «se van» (clientes, bailarines, lavanderas, el arreo…) desaparecen en cualquier modo de juego
  for (const m of g.entities.mobs) if (m.data && m.data.irse > 0 && (m.data.irse -= 1) <= 0) { g.particles.burst(m.body.pos.x, m.body.pos.y + 1, m.body.pos.z, [[0.9, 0.9, 0.9]], 10, 1.5); m.dead = true; }
  if (g.mode !== 'survival') return;
  const w = g.world, p = g.player.body.pos;
  // buscar el rótulo cerca (cada 5 s)
  g.sodaT = (g.sodaT || 0) - 1;
  if (g.sodaT <= 0) {
    g.sodaT = 5;
    g.soda = null;
    for (let dx = -8; dx <= 8 && !g.soda; dx++) for (let dz = -8; dz <= 8 && !g.soda; dz++) for (let dy = -3; dy <= 3; dy++) {
      const x = Math.floor(p.x) + dx, y = Math.floor(p.y) + dy, z = Math.floor(p.z) + dz;
      if (w.getBlock(x, y, z) === K.rotulo_soda) { g.soda = { x, y, z }; break; }
    }
  }
  const S = g.soda;
  const clientes = g.entities.mobs.filter((m) => !m.dead && m.data && m.data.cliente);
  for (const c of clientes) {
    c.data.cliente.t -= 1;
    if (c.data.cliente.t === 25) decir(g, c, '¿Y mi comida?', 3);
    if (c.data.cliente.t <= 0 || !S) {
      if (S) { decir(g, c, '¡Qué servicio más lento! Me voy.', 3); g.meta.reputation = (g.meta.reputation || 0) - 1; }
      c.data.cliente = null; c.frozen = false; c.data.irse = 4;
    }
  }
  if (!S || g.daylight < 0.4 || clientes.length >= 2 || (g.clock || 0) < (g.sodaCerradaHasta || 0)) return;
  g.sodaCd = (g.sodaCd ?? 20) - 1;
  if (g.sodaCd > 0) return;
  g.sodaCd = 35 + Math.random() * 40;
  if (quizaInspector(g, S)) return;
  // llega un cliente
  for (let k = 0; k < 10; k++) {
    const a = Math.random() * Math.PI * 2, x = Math.floor(S.x + Math.cos(a) * 2.5), z = Math.floor(S.z + Math.sin(a) * 2.5);
    let y = S.y + 2;
    while (y > S.y - 4 && w.getBlock(x, y - 1, z) === 0) y--;
    if (w.getBlock(x, y, z) !== 0 || w.getBlock(x, y + 1, z) !== 0) continue;
    const m = g.entities.spawnMob('vecino', x + 0.5, y + 0.1, z + 0.5);
    const [id, precio] = MENU[Math.floor(Math.random() * MENU.length)];
    m.data = { vid: `cliente:${g.clock}`, name: 'Cliente', role: 'cliente', seed: Math.floor(Math.random() * 1e6) + 1, home: { x, y, z }, plaza: { x, y, z }, cliente: { id, precio, t: 75 } };
    m.kind.dress(m);
    m.frozen = true;
    m.yaw = m.targetYaw = Math.atan2(S.x + 0.5 - (x + 0.5), S.z + 0.5 - (z + 0.5));
    g.particles.burst(x + 0.5, y + 1, z + 0.5, [[1, 0.9, 0.6]], 8, 1.2);
    setTimeout(() => { if (!m.dead) decir(g, m, PIDE[id], 6); }, 400);
    if (!g.meta.sodaAviso) { g.meta.sodaAviso = true; g.ui.toast('🍽 ¡Cliente en la soda! Vea qué pide (el globito) y sírvale con clic derecho', 4200); }
    return;
  }
}

// ---------- el banco ----------
function banco(m, g) {
  const M = g.meta, inv = g.inventory, held = inv.held;
  const d = g.day || 1;
  // intereses: 3 % por día, hasta 30 colones por día
  if (M.banco && M.bancoDia && d > M.bancoDia) {
    const gan = Math.min(30 * (d - M.bancoDia), Math.floor(M.banco * (Math.pow(1.03, d - M.bancoDia) - 1)));
    if (gan > 0) { M.banco += gan; g.ui.toast(`🏦 Intereses: +${gan} colones`, 2200); }
  }
  M.bancoDia = d;
  // la fila (la primera vez del día)
  if (M.filaDia !== d) {
    M.filaDia = d;
    g.ui.dialog(m.data.name, `Saque su ficha… usted es el número ${100 + Math.floor(Math.random() * 300)}. Vamos por el ${1 + Math.floor(Math.random() * 30)}. Vuelva a hablarme en un ratito.`, 5200);
    M.filaT = (g.clock || 0) + 12;
    g.achieve('fila_banco', 'La fila del banco');
    return true;
  }
  if ((g.clock || 0) < (M.filaT || 0)) { g.ui.dialog(m.data.name, 'Todavía no es su número… paciencia. El sistema está lento.', 3000); return true; }
  const enMano = held && VALOR[held.id], agachado = g.player && g.player.sneaking;
  if (enMano || (agachado && inv.enBilletera() >= KP)) {
    // v11.10.5: con plata sacada en la mano se deposita esa pila; agachado, toda la billetera (en unidades del juego)
    let n;
    if (enMano) {
      const val = held.count * VALOR[held.id];
      n = Math.floor(val / KP); inv.slots[inv.selected] = null;
      if (val - n * KP > 0) inv.darColones(val - n * KP); // el sencillo que no hace una unidad vuelve a la billetera
      inv.changed();
    } else { n = Math.floor(inv.enBilletera() / KP); inv.pagarColones(n * KP); }
    M.banco = (M.banco || 0) + n;
    g.ui.dialog(m.data.name, `Depositados ${n} colones. Su saldo: ${M.banco}. Gana 3 % por día. ¿Algo más?`, 4200);
    g.audio.play('monedas', { ui: true, vol: 0.5 });
    g.achieve('banco', 'Cuenta de ahorros');
    if (M.banco >= 500) g.achieve('ricachon', 'Medio millón… de colones de juego');
    return true;
  }
  if (M.banco) {
    const n = M.banco;
    M.banco = 0;
    const left = inv.add(COLON, n);
    if (left) g.entities.dropItem(COLON, left, g.player.body.pos.x, g.player.body.pos.y + 1, g.player.body.pos.z);
    g.ui.dialog(m.data.name, `Aquí tiene sus ${n} colones. (Para depositar, háblele agachado: deposita lo de la billetera.)`, 4200);
    g.audio.play('monedas', { ui: true, vol: 0.5 });
    return true;
  }
  g.ui.dialog(m.data.name, 'Para abrir una cuenta, háblele agachado y le deposito lo de la billetera. Pagamos 3 % por día… mientras dure.', 4200);
  return true;
}

// al hablar con alguien: clientes de la soda y la cajera del banco
export function economiaInteract(m, g) {
  const d = m.data;
  if (d.cliente) {
    const held = g.inventory.held;
    if (held && held.id === d.cliente.id) {
      g.inventory.consumeHeld(1);
      const propina = Math.random() < 0.4 ? precioBonito(d.cliente.precio * (0.1 + Math.random() * 0.2), false) : 0; // del 10 al 30 % del plato
      const pago = d.cliente.precio + propina;
      const left = g.inventory.add(COLON, pago);
      if (left) g.entities.dropItem(COLON, left, g.player.body.pos.x, g.player.body.pos.y + 1, g.player.body.pos.z);
      decir(g, m, propina ? `¡Riquísimo! Tome, y ${fmtUnidades(propina)} de propina.` : '¡Qué rico! Gracias.', 3);
      g.audio.play('monedas', { ui: true, vol: 0.5 });
      g.meta.sodaClientes = (g.meta.sodaClientes || 0) + 1;
      g.achieve('soda_propia', 'Mi propia soda');
      if (g.meta.sodaClientes >= 15) g.achieve('sodero', 'La soda del año');
      g.meta.reputation = (g.meta.reputation || 0) + 1;
      d.cliente = null; d.irse = 3;
    } else decir(g, m, PIDE[d.cliente.id], 4);
    return true;
  }
  if (d.role === 'cajera') return banco(m, g);
  return false;
}
