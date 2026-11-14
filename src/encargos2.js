// C8-A «Encargos 2.0 y el tablón» (v12.4.12, docs/revisiones/DISENO_CONTENIDO_C5-C8.md §C8-A). Cada pueblo tiene un tablón en la
// plaza con 3 a 5 encargos que cambian cada día (deterministas: la misma semilla, el mismo día y el mismo pueblo dan lo mismo,
// aunque se recargue). Lo que se pide sale de quién vive en el pueblo (la soda pide pescado, la pulpería cosechas…). Clic derecho
// al tablón: pasa de un encargo al otro; Mayús + clic: aceptarlo o entregarlo. El pago sigue la «regla de oro» de precios.js (nunca
// menos que vender, nunca mucho más que comprar), con un tope de 40 unidades al día (de ahí en adelante, al 40 %).
// Guardado: meta.encargos2 = { activos: [...], hechos, dia, ganado, libro } (opcional, se lee con ??): sin SAVE_FORMAT nuevo.
import { getDef } from './blocks.js';
import { hash3 } from './noise.js';
import { SHOPS } from './pueblo.js';
import { COSECHAS } from './economia.js';
import { cobrarDelTope } from './plata.js';

export const LIBRO_ENCARGOS = 1187;
const COLON = 360, K_UNIDAD = 500, MAX_ACTIVOS = 5;
// lo que pide cada oficio del pueblo (ids que ya existen); los de C5–C7 (pesca, oficios, volcán) se suman en su tanda
// v12.8.3 (decimosexta revisión, punto 1): un comentario se había tragado a la panadera y el carnicero (tools/revisar-pide.mjs lo vigila)
export const PIDE = {
  pulpero: COSECHAS, feriante: COSECHAS, frutero: [275, 276, 377], caficultor: [295, 297, 268],
  sodera: [361, 363, 262, 287], sodera_playa: [361, 363, 366, 1105, 1106, 1112], // v12.7.0: las especies nuevas baratas (no atún ni langosta)
  panadera: [263, 287, 292], carnicero: [262, 271],
  herrero: [258, 257], ferretero: [258, 257, 561], vecino: [268, 269, 561, 287],
};
const PLATOS = [351, 350, 353, 393, 365]; // casado, gallo pinto con huevo, tamal, empanada, pescado frito
const QUIEN = ['Doña Rosa', 'Don Beto', 'Doña Lupita', 'Don Memo', 'Doña Chela', 'Don Toño', 'la maestra', 'el cura', 'Doña Mireya', 'Don Rigo'];

// lo que vale una pieza: lo que cobra la tienda (sell) o, si no la vende, el 80 % de lo que paga (buy); si no, poquito
export function precios(id) {
  let compra = Infinity, venta = 0;
  for (const S of Object.values(SHOPS)) {
    for (const [i, n, b] of S.sell || []) if (i === id) compra = Math.min(compra, b / n);
    if (!S.lujo) for (const [i, n, b] of S.buy || []) if (i === id) venta = Math.max(venta, b / n); // v12.8.4: sin el de lujo (con el pargo, el tablón pagaba 2 u por pieza)
  }
  return { compra, venta };
}
export function valorRef(id) { const { compra, venta } = precios(id); return compra < Infinity ? compra : venta > 0 ? venta * 0.8 : 0.3; }
// v12.5.1 (undécima revisión, hallazgo 5): lo que se puede comprar nunca paga más del 95 % de comprarlo (antes 1.25 ×: comprar y entregar
// daba ganancia); lo que no se compra (cosechas que solo se venden, lo de los oficios y la pesca) paga 1.25 ×. El grande, ×1.1 (antes 1.4)
export function pagoDe(e) {
  const { compra } = precios(e.id), base = valorRef(e.id) * e.n * (1.25 + (e.urgente ? 0.15 : 0)) * (e.grande ? 1.1 : 1);
  return Math.max(1, compra < Infinity ? Math.min(Math.ceil(base), Math.floor(compra * e.n * 0.95)) : Math.ceil(base)); // hacia abajo: siempre menos que comprarlo
}

const nombre = (id) => ((getDef(id) || {}).name || 'algo').replace(/\s*\(.*$/, '').toLowerCase();
// v12.5.1: el estado siempre con la forma que se espera (un mundo importado o dañado no rompe el tic de 1 s)
function E2(g) {
  const M = (g.meta.encargos2 && typeof g.meta.encargos2 === 'object') ? g.meta.encargos2 : (g.meta.encargos2 = {});
  if (!Array.isArray(M.activos)) M.activos = [];
  M.activos = M.activos.filter((a) => a && typeof a === 'object' && a.k && (a.tipo !== 'mandado' || (a.destino && a.destino.id)));
  for (const k of ['hechos', 'dia', 'ganado']) if (!Number.isFinite(M[k])) M[k] = 0;
  if (!Array.isArray(M.hechosHoy)) M.hechosHoy = [];
  if (!M.famaDia || typeof M.famaDia !== 'object') M.famaDia = {};
  return M;
}

// los oficios que hay en el pueblo (de su gente); sin datos, un pueblo de vecinos
function oficios(v) {
  const r = new Set((v.npcs || []).map((n) => n.role).filter((x) => PIDE[x]));
  if (!r.size) r.add('vecino');
  return [...r];
}

// los encargos de hoy en un pueblo (siempre los mismos para ese día)
export function encargosDelDia(g, v, otros = []) {
  const s = g.meta.seed || 1, dia = g.day || 1, vx = v.x, vz = v.z;
  const rnd = (k) => hash3(s, dia * 128 + k, vx, vz); // v12.5.1: ×128 (con ×31 las tiradas de días vecinos se repetían corridas)
  const M = E2(g), clave = `${v.id}:${dia}`;
  if (M.famaDia[clave] === undefined) { for (const c of Object.keys(M.famaDia)) if (!c.endsWith(`:${dia}`)) delete M.famaDia[c]; M.famaDia[clave] = ((g.meta.repPueblo || {})[v.id]) || 0; } // v12.5.1: la fama del comienzo del día
  const ofs = oficios(v), n = 3 + Math.floor(rnd(1) * 3), rep = M.famaDia[clave];
  const out = [];
  for (let i = 0; i < n; i++) {
    const t = rnd(10 + i), urgente = rnd(20 + i) < 0.25, quien = QUIEN[Math.floor(rnd(30 + i) * QUIEN.length)];
    const k = `${v.id}:${dia}:${i}`;
    let e;
    const destino = otros.length && t > 0.82 ? otros[Math.floor(rnd(40 + i) * otros.length)] : null;
    if (destino) e = { k, tipo: 'mandado', quien, id: 0, n: 1, destino: { id: destino.id, nombre: destino.name || 'el otro pueblo', x: destino.x, z: destino.z }, urgente: false };
    else if (t > 0.65) { const id = PLATOS[Math.floor(rnd(50 + i) * PLATOS.length)]; e = { k, tipo: 'comida', quien, id, n: 1 + Math.floor(rnd(60 + i) * 2), urgente }; }
    else {
      const of = ofs[Math.floor(rnd(70 + i) * ofs.length)], L = PIDE[of], id = L[Math.floor(rnd(80 + i) * L.length)];
      const cuantos = Math.max(2, Math.min(16, Math.round(7 / (valorRef(id) * 1.25))));
      e = { k, tipo: 'entrega', quien, id, n: cuantos, urgente };
    }
    if (rep >= 5 && i === 0 && e.tipo !== 'mandado') { e.grande = true; e.n *= 3; } // con buena fama, un encargo grande (×3, paga 1.4 ×)
    e.pago = e.tipo === 'mandado' ? Math.max(4, Math.round(Math.hypot(e.destino.x - vx, e.destino.z - vz) / 60)) : pagoDe(e);
    e.vid = v.id; e.vnombre = v.name || 'el pueblo';
    out.push(e);
  }
  return out;
}
const texto = (e) => (e.tipo === 'mandado' ? `${e.quien} manda un recado a ${e.destino.nombre}` : `${e.quien} pide ${e.n} de ${nombre(e.id)}`) + `${e.grande ? ' (encargo grande)' : ''} · paga ${e.pago} u${e.urgente ? ' · ¡para hoy!' : ''}`;

// los pueblos a 150–600 bloques (para los mandados)
function vecinos(g, v) {
  const out = [];
  if (!g.nearestVillage) return out;
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]) {
    const w = g.nearestVillage(v.x + dx * 400, v.z + dz * 400);
    if (w && w.v.id !== v.id && !out.some((o) => o.id === w.v.id)) { const d = Math.hypot(w.v.x - v.x, w.v.z - v.z); if (d >= 150 && d <= 600) out.push(w.v); }
  }
  return out;
}

// clic derecho al tablón
export function usarTablon(g, x, y, z) {
  const near = g.nearestVillage && g.nearestVillage(x, z);
  if (!near || near.dist > 60) { g.ui.toast('📋 Este tablón está muy lejos de un pueblo (tiene que estar a menos de 60 bloques del centro): nadie deja encargos aquí', 3000); return true; } // v12.5.1: antes 120
  const v = near.v, M = E2(g), hoy = encargosDelDia(g, v, vecinos(g, v));
  // v12.5.1 (hallazgo 1): primero lo aceptado de otros días que sigue vigente (antes quedaba huérfano al cambiar la lista del día)
  const lista = [...M.activos.filter((a) => a.vid === v.id && !hoy.some((e) => e.k === a.k)), ...hoy];
  const sneak = g.keys.has('ShiftLeft') || g.keys.has('ShiftRight');
  const vista = (g.tablonVista ||= {});
  if (!sneak) vista[v.id] = ((vista[v.id] ?? -1) + 1) % lista.length;
  const i = vista[v.id] ?? 0, e = lista[i];
  if (!e) return true;
  const activo = M.activos.find((a) => a.k === e.k);
  const hecho = (M.hechosHoy || []).includes(e.k);
  if (!sneak) {
    const estado = hecho ? ' ✔ (ya lo hizo)' : activo ? ' (aceptado: Mayús + clic para entregar)' : ' · Mayús + clic: aceptar';
    g.ui.dialog(`Tablón de ${v.name || 'encargos'} (${i + 1}/${lista.length})`, texto(e) + estado, 5200);
    if (!M.vioTablon) { M.vioTablon = true; g.achieve('tablon', 'Lo que pide el pueblo'); }
    return true;
  }
  if (hecho) { g.ui.toast('📋 Ese encargo ya lo cumplió hoy', 1800); return true; }
  if (activo) return entregar(g, activo);
  if (M.activos.length >= MAX_ACTIVOS) { g.ui.toast(`📋 Ya lleva ${MAX_ACTIVOS} encargos: cumpla alguno primero`, 2400); return true; }
  if (e.tipo === 'mandado' && M.activos.some((a) => a.tipo === 'mandado' && a.destino.id === e.destino.id)) { g.ui.toast(`📋 Ya lleva un recado para ${e.destino.nombre}: uno por pueblo`, 2400); return true; } // v12.5.1
  // un urgente aceptado de noche vence al día siguiente (antes vencía en minutos, al cambiar el día)
  M.activos.push({ ...e, vence: (g.day || 1) + (e.urgente ? ((g.time || 0) > 0.55 ? 1 : 0) : 2) });
  if (!M.libro) { M.libro = true; g.inventory.add(LIBRO_ENCARGOS, 1); g.ui.toast('📒 Le dieron un Libro de encargos: ahí lleva la cuenta (clic derecho con él en la mano)', 3600); }
  g.ui.toast(`📋 Aceptado: ${texto(e)}`, 3000);
  return true;
}

// entregar un encargo de entrega o de comida (en el tablón de ese pueblo)
function entregar(g, a) {
  if (a.tipo === 'mandado') { g.ui.toast(`📋 Este recado se entrega en ${a.destino.nombre}: háblele a cualquier vecino de allá`, 2800); return true; }
  const tiene = g.inventory.count(a.id);
  if (g.mode === 'survival' && tiene < a.n) { g.ui.toast(`📋 Le faltan ${a.n - tiene} de ${nombre(a.id)}`, 2200); return true; }
  if (g.mode === 'survival') g.inventory.remove(a.id, a.n);
  cumplir(g, a);
  return true;
}

// el mandado: al hablarle a un vecino del pueblo de destino (lo llama pueblo.js)
export function entregarMandado(m, g) {
  if (!g.meta.encargos2) return false;
  const p = g.player.body.pos, near = g.nearestVillage && g.nearestVillage(p.x, p.z);
  if (!near || near.dist > 120) return false;
  const a = E2(g).activos.find((e) => e.tipo === 'mandado' && e.destino && e.destino.id === near.v.id);
  if (!a) return false;
  // v12.5.1 (hallazgo 2): si llegó en bus hace menos de 10 min, el recado no costó el viaje: paga la tercera parte
  const enBus = g.llegoEnBus !== undefined && (g.clock || 0) - g.llegoEnBus < 600;
  if (enBus) a.pago = Math.max(1, Math.round(a.pago / 3));
  g.ui.dialog((m.data && m.data.name) || 'Vecino', `¡Ah, el recado de ${a.quien}! Muchas gracias por traerlo hasta acá. Firmado.${enBus ? ' (Como vino en bus, le pagan menos)' : ''}`, 3200);
  cumplir(g, a);
  return true;
}

// pagar y anotar la fama (en el pueblo que lo pidió)
function cumplir(g, a) {
  const M = E2(g), hoy = g.day || 1;
  M.activos = M.activos.filter((e) => e !== a);
  if (M.dia !== hoy) { M.dia = hoy; M.ganado = 0; M.hechosHoy = []; }
  a.pago = Math.max(0, Math.min(100, Number(a.pago) || 0)); // v12.5.1: un pago enorme de un mundo importado se topa
  const pago = cobrarDelTope(g, a.pago); // v12.6.5: la cuenta del tope vive en plata.js (la comparten los buzos)
  M.hechos = (M.hechos || 0) + 1; (M.hechosHoy ||= []).push(a.k);
  if (g.inventory.darColones) g.inventory.darColones(pago * K_UNIDAD); else g.inventory.add(COLON, pago);
  const R = (g.meta.repPueblo ||= {}), mas = a.urgente && hoy <= a.vence ? 2 : 1;
  R[a.vid] = (R[a.vid] || 0) + mas;
  g.ui.toast(`📋 ¡Encargo cumplido! ${pago} u${pago < a.pago ? ' (ya ganó bastante hoy: paga menos)' : ''} · ${a.vnombre} le agradece (+${mas})`, 3400);
  g.audio.play('caja', { ui: true, vol: 0.35 });
  g.achieve('encargo2', 'Encargo del tablón');
  if (M.hechos >= 10) g.achieve('encargos10', 'De confianza en el pueblo');
}

// clic derecho con el libro: lo que lleva
export function verLibro(g) {
  const M = E2(g);
  if (!M.activos.length) { g.ui.toast('📒 No lleva encargos. Los ve en el tablón de la plaza de cada pueblo', 2600); return true; }
  const hoy = g.day || 1;
  g.ui.dialog('Libro de encargos', M.activos.map((a) => `• ${a.vnombre}: ${texto(a)}${a.vence <= hoy ? ' (vence hoy)' : ''}`).join('\n'), 6500);
  return true;
}

// una vez por segundo: los vencidos se borran; un urgente que se dejó vencer baja la fama
export function tickEncargos(g) {
  if (!g.meta.encargos2) return;
  const M = E2(g);
  if (!M.activos.length) return;
  const hoy = g.day || 1, vencidos = M.activos.filter((a) => a.vence < hoy);
  if (!vencidos.length) return;
  M.activos = M.activos.filter((a) => a.vence >= hoy);
  const R = (g.meta.repPueblo ||= {});
  for (const a of vencidos) if (a.urgente) R[a.vid] = (R[a.vid] || 0) - 1;
  const urg = vencidos.filter((a) => a.urgente).length;
  const pueblos = [...new Set(vencidos.filter((a) => a.urgente).map((a) => a.vnombre))].join(', ');
  g.ui.toast(urg ? `📒 Se le vencieron ${vencidos.length} encargos (${urg} urgente${urg > 1 ? 's' : ''}: ${pueblos} le baja la fama ${urg})` : `📒 Se le vencieron ${vencidos.length} encargos`, 3200);
}

// ---------- el cupo del comprador (§0.4): en cada pueblo, cada cosa se paga completa hasta 30 u por día; de ahí en adelante, el 40 % ----------
// (v12.5.1: la clave es pueblo + ítem; antes era por vecino y no limitaba, porque las cosechas las compran 4–7 puestos)
export const CUPO_DIA = 30;
export function cupoUsado(g, clave) {
  const C = g.meta.cupoDia;
  return C && C.dia === (g.day || 1) ? C[clave] || 0 : 0;
}
// cuánto paga de verdad y lo anota
export function pagarConCupo(g, clave, precio) {
  const hoy = g.day || 1, C = (g.meta.cupoDia && g.meta.cupoDia.dia === hoy) ? g.meta.cupoDia : (g.meta.cupoDia = { dia: hoy });
  const usado = C[clave] || 0, libre = Math.max(0, CUPO_DIA - usado);
  C[clave] = usado + precio;
  return Math.min(precio, libre) + Math.max(0, precio - libre) * 0.4;
}
