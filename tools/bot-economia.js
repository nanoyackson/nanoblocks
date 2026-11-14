// Bot de economía (v11.10.4, supuestos rehechos en la v11.10.6): simula tres maneras de ganarse la vida durante 30 días de juego y
// mide cuántos días tarda cada una en pagar las metas (comida, herramientas, armadura, baúl, carreta, lote, vehículos). Lee los precios
// y premios del juego de verdad (tiendas, encargos, carteles, la paga por peligro con sus topes, el menú de la soda); lo que no se
// puede leer —cuánto hace uno en un día— son SUPUESTOS anotados abajo, sacados de las cadencias del código (un día son 20 minutos).
// Uso en la consola (con `npm run dev`): const E = await import('/tools/bot-economia.js'); E.correr()  → tabla y criterios
import { SHOPS, ERRANDS, MENU } from '/src/pueblo.js';
import { CARTELES } from '/src/recompensas.js';
import { PREMIO_BAJA, REPITE } from '/src/precios.js';
import { K, fmtColones } from '/src/plata.js';
import { ZONAS, NASA } from '/src/pesca.js';

const media = (L) => L.reduce((a, b) => a + b, 0) / Math.max(1, L.length);
// el precio más barato de algo en las tiendas que no son de lujo (por unidad del lote)
function precio(id) {
  let best = Infinity;
  for (const [k, s] of Object.entries(SHOPS)) { if (/lujo|bartender|inmobiliaria/.test(k)) continue; for (const [i, n, p] of s.sell || []) if (i === id) best = Math.min(best, p / n); }
  return best;
}
// lo que paga una tienda por algo (el mejor, por unidad), sin el factor del día
function pago(id) {
  let best = 0;
  for (const s of Object.values(SHOPS)) for (const [i, n, p] of s.buy || []) if (i === id) best = Math.max(best, p / n);
  return best;
}
const botin = (L) => media(L.map((t) => media(PREMIO_BAJA[t] || [0])));
// n bajas de un grupo con tope por día: la primera completa y las demás al 10 % (precios.js)
const conTope = (L, n) => (n <= 0 ? 0 : botin(L) * (1 + (n - 1) * REPITE));

// supuestos de un día de juego (20 min), de un jugador activo en lo suyo. De dónde sale cada uno, al lado
export const SUPUESTOS = {
  // trabajador: mandados del pueblo (uno nuevo al terminar el anterior) y café: cada cajuela son 20 granos maduros (oficios.js)
  encargosDia: 4,
  cajuelasDia: 6,
  ofrenda: 5, // lo que cuesta la Ofrenda del monte (flor, cacao, guaro y antorcha), en unidades
  // cazador, en la selva o junto al agua y de noche afuera (las cadencias son las de los spawns):
  bravosDia: 6, // los bravos salen por bioma en cada tic de 2 s: medio por cada tres minutos
  elitesDia: 2,
  minijefesDia: 2, // armas2.js:miniSpawn — uno cada ~8–10 min reales desde el día 5
  leyendasDia: 3, // leyendas.js:legendSpawn — 2–4 por noche desde el día 4 (el Mono congo, de día, cuenta en el mismo tope)
  monosDia: 2, // monocongo.js — uno cada ~6 min de día en la selva
  carteleCada: 3, // un «Se busca» cada tres días (recompensas.js)
  jefeNuevoCada: 4, // un jefe del monte nuevo (ofrenda) cada tantos días desde el día 8; paga completo una sola vez por mundo
  revanchasDia: 1, // y una revancha por día (paga el 10 %)
  // comerciante: una finca andando, una caña y su soda
  ventaDia: { 268: 24, 294: 30, 275: 8, 361: 6 }, // mazorcas, café en cereza, bananos y pargos que vende por día
  platosSoda: 10, // economia.js:tickSoda — un cliente cada 35–75 s de día, mientras uno esté junto al rótulo
  inicial: 20, // lo que uno trae en la bolsa al empezar el mes que se mide (₡10 000)
  comida: [263, 351, 298], // lo que se come en un día: gallo pinto, casado y café
};

export const METAS = [
  ['Comida del día', () => SUPUESTOS.comida.reduce((a, id) => a + precio(id), 0)],
  ['Machete', () => precio(325)],
  ['Pico de hierro (hecho)', () => precio(302)],
  ['Arco', () => precio(326)],
  ['Cama', () => precio(89)],
  ['Baúl grande (cofres y un lingote)', () => 2 * 8 + 6],
  ['Carreta con bueyes', () => precio(487)],
  ['Bicicleta', () => precio(455)],
  ['Escritura del lote', () => precio(413)],
  ['Moto', () => precio(456)],
];

function perfil(nombre, ingresoDia) {
  const S = SUPUESTOS, gasto = METAS[0][1]();
  let plata = S.inicial;
  const cuando = {}, diario = [];
  for (let d = 1; d <= 30; d++) {
    plata += ingresoDia(d) - gasto;
    diario.push(plata);
    for (const [m, f] of METAS.slice(1)) if (cuando[m] === undefined && plata >= f()) cuando[m] = d;
  }
  const porDia = (plata - S.inicial + 30 * gasto) / 30;
  return { nombre, final: plata, minimo: Math.min(...diario), cuando, porDia, porMinuto: porDia / 20 };
}


// ---- v12.7.1: los perfiles nuevos de PREPARACION_C5_Y_JEFES_F2.md §2.1 (pegados tal cual) ----
// ---- el cupo del comprador (ui.js, v12.4.12): cada vecino paga completo 30 u al día y el 40 % de ahí en adelante ----
export const CUPO = 30;
const SIN_LUJO = /lujo|bartender|inmobiliaria/;
// quién compra algo y a cuánto (u por pieza), de mejor a peor; los de lujo no cuentan (como precio()); lo que aún no está en SHOPS usa
// el precio de la propuesta, en un comprador llamado «propuesta» (el pescador del muelle). v12.8.6 (decimoctava revisión, punto 4): con
// conLujo cuentan también los puestos de lujo (el restaurante de playa_lujo), que están en OTRO pueblo y tienen su propio cupo
export function compradores(id, propuesta = {}, conLujo = false) {
  const L = [];
  for (const [k, s] of Object.entries(SHOPS)) { if (!conLujo && SIN_LUJO.test(k)) continue; for (const [i, n, p] of s.buy || []) if (i === id) L.push({ puesto: k, p: p / n, lujo: SIN_LUJO.test(k) }); }
  if (!L.length && propuesta[id] !== undefined) L.push({ puesto: 'propuesta', p: propuesta[id] });
  return L.sort((x, y) => y.p - x.p);
}
// vende un día de cosecha: ventas = [[id, cantidad], ...]. Cada pieza va al comprador que más paga y aún tiene cupo; lo que no cabe
// va al mejor al 40 %. Devuelve lo que se cobra y cuánto se perdió por el cupo
export function venderConCupo(ventas, propuesta = {}, conLujo = false) {
  const usado = {}, filas = [];
  for (const [id, n] of ventas) for (const c of compradores(id, propuesta, conLujo)) filas.push({ id, n, ...c });
  let cobrado = 0, lleno = 0;
  const pendiente = new Map(ventas.map(([id, n]) => [id, n]));
  for (const f of filas.sort((x, y) => y.p - x.p)) {
    const quedan = pendiente.get(f.id) || 0; if (!quedan) continue;
    const u = f.lujo ? `${f.id}L` : f.id; // el lujo es otro pueblo: otro cupo
    const libre = Math.max(0, CUPO - (usado[u] || 0)), caben = Math.min(quedan, f.p > 0 ? libre / f.p : quedan); // v12.8.3: el cupo es por pueblo y por ítem (ui.js), no por puesto
    if (caben <= 0) continue;
    usado[u] = (usado[u] || 0) + caben * f.p; cobrado += caben * f.p; lleno += caben * f.p; pendiente.set(f.id, quedan - caben);
  }
  for (const [id, n] of pendiente) if (n > 0) { const c = compradores(id, propuesta, conLujo)[0]; const p = c ? c.p : 0; cobrado += n * p * 0.4; lleno += n * p; }
  return { cobrado, lleno };
}

// ---- C5: el pescador ----
export const PRECIO_C5 = { 1105: 0.5, 1106: 0.5, 1107: 1.5, 1108: 1, 1109: 1.5, 1110: 2, 1111: 4, 1112: 1.5, 1113: 6, 1114: 0.5, 1115: 0.25, 1116: 1 }; // lo que paga el muelle por pieza; sale de SHOPS cuando ya estén
export const PESCA = {
  pescaMin: 8, // minutos de pesca por día de juego (de 20)
  segPorCaptura: 16.3, // mar.js: Bobber: espera media 11 s + 1.5 s de acción + picadas que se pierden → 30 capturas en 8 min
  basura: { perla: 0.005, bota: 0.075, oro: 0.005 * 1.5 }, // pesca.js lootZona: 12 % de basura; la perla paga 18, la bota 1 y el oro (1–2 piezas) 10 en la pulpería
  // v12.8.3 (decimosexta revisión, punto 2): las tablas salen del juego (pesca.js), no se copian: antes quedaron desfasadas
  zonas: Object.fromEntries(Object.entries(ZONAS).map(([z, Z]) => [z, Z.t])),
  nasas: Object.fromEntries(Object.entries(NASA).filter(([z]) => z !== 'rio').map(([z, N]) => [z, { media: N.media, tabla: Object.fromEntries(N.presa.map(([id, , w]) => [id, w])) }])),
  precios: { cañaFibra: 30, cañaAltamar: 90, bote: 120, nasa: 4 }, // u (bote: ANCLAS de precios.js)
};
export function perfilPescador(S = PESCA, gastoDia = 17 /* METAS[0][1]() */, conLujo = false) {
  let ahorro = 20; const tiene = { fibra: false, altamar: false, bote: false, nasas: 0 };
  return (d) => {
    const capturas = (S.pescaMin * 60) / S.segPorCaptura;
    // v12.8.2 (orquestadora): empieza en el río con lombriz (gratis: se cava con la pala), y con la caña de fibra alterna estero y arrecife
    let zona = 'rio', f = 1;
    if (tiene.fibra) zona = d % 2 ? 'estero' : 'arrecife';
    if (tiene.bote && tiene.altamar) { zona = 'altamar'; f = 0.9; } // las peleas del atún comen tiempo
    const piezas = capturas * f;
    const ventas = Object.entries(S.zonas[zona]).map(([id, w]) => [+id, w * piezas]);
    const { cobrado } = venderConCupo(ventas, PRECIO_C5, conLujo);
    const basura = piezas * (S.basura.perla * 18 + S.basura.bota * 1 + S.basura.oro * 10); // la perla y la bota, al muelle; el oro, a la pulpería
    let nasas = 0;
    if (tiene.nasas) {
      const N = S.nasas[tiene.altamar ? 'arrecife' : 'estero'], presas = (1200 / N.media) * tiene.nasas;
      nasas = venderConCupo(Object.entries(N.tabla).map(([id, w]) => [+id, w * presas]), PRECIO_C5, conLujo).cobrado;
    }
    const dia = cobrado + basura + nasas;
    ahorro += dia - gastoDia;
    if (!tiene.fibra && ahorro >= S.precios.cañaFibra) { tiene.fibra = true; ahorro -= S.precios.cañaFibra; }
    else if (tiene.fibra && !tiene.nasas && ahorro >= 6 * S.precios.nasa + 15) { tiene.nasas = 6; ahorro -= 6 * S.precios.nasa; }
    else if (tiene.fibra && !tiene.bote && ahorro >= S.precios.bote + S.precios.cañaAltamar) { tiene.bote = tiene.altamar = true; ahorro -= S.precios.bote + S.precios.cañaAltamar; }
    return dia;
  };
}

export function tier(S, zona, f, conLujo = false) { const piezas = (S.pescaMin * 60) / S.segPorCaptura * f; const { cobrado, lleno } = venderConCupo(Object.entries(S.zonas[zona]).map(([id, w]) => [+id, w * piezas]), PRECIO_C5, conLujo); const basura = piezas * (S.basura.perla * 18 + S.basura.bota + S.basura.oro * 10); return { piezas: Math.round(piezas), u: +(cobrado + basura).toFixed(1), ev: +((cobrado + basura) / piezas).toFixed(2), sinCupo: +(lleno + basura).toFixed(1) }; }

// ---- C6: el artesano (DISENO_CONTENIDO_C5-C8.md §C6.2): carpintería, herrería y alfarería con nivel de oficio ----
// [nivel, pieza, materiales (u, a precio de tienda), precio de venta (u), oficio]. Los materiales los junta uno mismo (autoabasto)
export const PIEZAS_C6 = [
  [0, 'tabla fina', 0.5, 1, 'c'], [0, 'mango', 1, 1, 'c'], [1, 'mesa grande', 10, 13, 'c'], [2, 'alacena', 11, 15, 'c'], [2, 'mostrador', 7, 10, 'c'],
  [3, 'armario', 14, 18, 'c'], [4, 'puerta tallada', 7, 10, 'c'], [5, 'yugo', 7, 12, 'c'],
  [0, 'clavos x8', 3, 3, 'h'], [0, 'bisagras x2', 3, 3, 'h'], [2, 'herradura x4', 6, 7, 'h'], [3, 'candado', 7, 9, 'h'], [3, 'verja forjada x2', 12, 15, 'h'], [4, 'farol forjado', 7, 8, 'h'],
  [1, 'olla de barro', 2.4, 3, 'a'], [1, 'comal', 2.4, 3, 'a'], [2, 'tinaja', 3.6, 6, 'a'], [3, 'tejas x8', 2.4, 5, 'a'], [4, 'vajilla chorotega', 4.2, 8, 'a'], [5, 'jarron chorotega', 5.4, 9, 'a'], [6, 'chanchito', 6, 9, 'a'],
];
export const ARTESANO = {
  tallerMin: 8, // minutos de taller por día de juego (de 20)
  segPorPieza: 18, // buscar, poner, esperar la tanda y sacar: ≈ 26 piezas en 8 min
  umbrales: [10, 25, 45, 70, 100, 140, 190, 250, 320, 400], // XP por nivel (suma 1 550)
  encargosDia: 3, // máximo al día; empieza con 1 y sube 1 cada 3 niveles (C8-A: los de oficio son una parte del tablón)
  pagoEncargo: 1.25, xpEncargo: 2, // C8-A: pagan 1.25 × el precio y dan 2 × XP
  mostrador: { piezasPorDia: 5, base: 6, porNivel: 3 }, // una pieza cada ~90 s de 8 a 17 h = 450 s: 5 al día; tope 10 + 4 × nivel
  autoabasto: 0.5, // fracción de los materiales que junta uno mismo (sin gastar plata); el resto se compra
  inversion: { banco: 5, fragua: 10, torno: 6, horno: 8, libro: 40 }, // u: ≈ 70 para los tres oficios (§C6.4)
  oficios: 1, // 1 = uno solo (el primero: carpintería); 3 = los tres
};
export function perfilArtesano(S = ARTESANO) {
  let xp = 0;
  const nivelDe = (x) => { let n = 0, t = 0; for (const u of S.umbrales) { t += u; if (x >= t) n++; } return n; };
  return (d) => {
    const n = nivelDe(xp), of = ['c', 'a', 'h'].slice(0, S.oficios);
    let hay = PIEZAS_C6.filter(([nv, , , pr, o]) => nv <= n && of.includes(o) && pr >= 3);
    if (!hay.length) hay = PIEZAS_C6.filter(([nv, , , , o]) => nv <= n && of.includes(o)); // nivel 0 de carpintería: solo tablas y mangos (1 u)
    const dia0 = d <= 5 ? (S.inversion.banco + (S.oficios > 1 ? S.inversion.fragua + S.inversion.torno + S.inversion.horno : 0) + S.inversion.libro * S.oficios) : 0; 
    const precioMedio = media(hay.map((p) => p[3])), matMedio = media(hay.map((p) => p[2]));
    const tope = Math.floor((S.tallerMin * 60) / S.segPorPieza);
    // encargos del tablón (3 al día, de los oficios que tenga): 1.25 × precio; mostrador: hasta 5 piezas y el tope en plata
    const enc = Math.min(Math.min(S.encargosDia, 1 + Math.floor(n / 3)), tope), ventasPos = S.mostrador.piezasPorDia, capU = S.mostrador.base + S.mostrador.porNivel * n;
    const ventaU = Math.min(ventasPos * precioMedio, capU), ventaPiezas = ventaU / precioMedio;
    const ingreso = enc * precioMedio * S.pagoEncargo + ventaU;
    const gastoMat = (enc + ventaPiezas) * matMedio * (1 - S.autoabasto);
    // XP: 2 + precio/2 por pieza, doble en los encargos
    xp += enc * (2 + precioMedio / 2) * S.xpEncargo + ventaPiezas * (2 + precioMedio / 2);
    return ingreso - gastoMat - dia0 / 5; // la inversión (≈ 70 u para los tres oficios) se reparte en los primeros 5 días
  };
}

export function correr() {
  const S = SUPUESTOS, enc = media(ERRANDS.map((e) => e.pay)), caj = pago(459);
  const MINI = ['terciopelo_reina', 'jaguar_viejo', 'cocodrilo_gigante'], LEY = ['cadejos', 'segua', 'llorona', 'mona', 'viejo_monte', 'tulevieja', 'mono_congo_gigante'];
  const MONTE = ['reina_bananera', 'cascabel_rey', 'escarabajo_hercules', 'sapo_tata', 'cangrejo_rey', 'ciempies_rey'];
  const cartel = (d) => media(CARTELES.map((c) => c[3])) + Math.min(40, Math.floor(d / 3) * 5);
  const jefe = (d) => {
    const nuevos = d >= 8 ? Math.min(MONTE.length, Math.floor((d - 8) / S.jefeNuevoCada) + 1) : 0;
    const nuevoHoy = d >= 8 && (d - 8) % S.jefeNuevoCada === 0 && (d - 8) / S.jefeNuevoCada < MONTE.length ? botin(MONTE) : 0;
    return (nuevoHoy ? nuevoHoy - S.ofrenda : 0) + (nuevos > 0 ? S.revanchasDia * (botin(MONTE) * REPITE - S.ofrenda) : 0); // la ofrenda se paga
  };
  const P = [
    perfil('trabajador', () => S.encargosDia * enc + S.cajuelasDia * caj),
    perfil('cazador', (d) => S.bravosDia * botin(['chupacabras', 'mico_malo', 'becquer', 'puma', 'chata']) + S.elitesDia * botin(['sombra_grande', 'toro_guaco'])
      + (d >= 5 ? conTope(MINI, S.minijefesDia) : 0) + (d >= 4 ? conTope(LEY, S.leyendasDia + S.monosDia) : 0)
      + (d % S.carteleCada === 0 ? cartel(d) : 0) + jefe(d)),
    perfil('comerciante', () => Object.entries(S.ventaDia).reduce((a, [id, n]) => a + n * pago(+id), 0) + S.platosSoda * media(MENU.map((x) => x[1])) * 1.08),
    perfil('pescador', perfilPescador(PESCA, METAS[0][1]())), // v12.7.1 (C5)
    perfil('artesano', perfilArtesano(ARTESANO)), // v12.7.1 (C6, para cuando llegue)
    perfil('pescador (con lujo)', perfilPescador(PESCA, METAS[0][1](), true)), // v12.8.6: el techo honesto, vendiendo también al restaurante de lujo
  ];
  const fila = (p) => ({ perfil: p.nombre, 'gana por día': fmtColones(p.porDia * K), 'por minuto': fmtColones(p.porMinuto * K), 'al día 30': fmtColones(p.final * K), ...Object.fromEntries(METAS.slice(1).map(([m]) => [m, p.cuando[m] ? `día ${p.cuando[m]}` : '—'])) });
  const tabla = P.map(fila);
  const ingresos = P.slice(0, 3).map((p) => p.porDia), razon = Math.max(...ingresos) / Math.min(...ingresos);
  const todo = METAS.slice(1).reduce((a, [, f]) => a + f(), 0);
  const criterios = {
    'nadie se queda sin comer': P.slice(0, 3).every((p) => p.minimo >= 0), // v12.7.1: los tres de siempre (los nuevos tienen su criterio)
    'nadie compra TODO con sobra a los 30 días': P.every((p) => p.final < todo),
    'los tres a menos de 1.5× entre sí': razon <= 1.5,
    razon: Math.round(razon * 100) / 100,
  };
  const nuevos = P.slice(3).map((p) => p.porDia);
  criterios['pescador y artesano a menos de 2.3 jornadas (57 u/día)'] = nuevos.every((x) => x <= 57);
  criterios['pescador y artesano pagan la comida del día'] = P.slice(3).every((p) => p.minimo >= 0);
  const metas = Object.fromEntries(METAS.map(([m, f]) => [m, fmtColones(f() * K)]));
  console.table(tabla); console.log(metas, criterios);
  return { tabla, metas, criterios, jornada: fmtColones(25 * K) };
}
