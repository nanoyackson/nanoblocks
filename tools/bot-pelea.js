// Bot de balance: pelea solo en un mundo de prueba y mide cuánto dura. No cubre ni esquiva, y pega con un 35 % de probabilidad en
// cada cuadro listo, así que hace de jugador torpe: si él sobrevive, un jugador de verdad va sobrado.
// Uso en la consola del navegador (solo con `npm run dev`, en un mundo de prueba porque le cambia el inventario y la historia):
//   const { Bot, ESCENARIOS } = await import('/tools/bot-pelea.js');
//   window.bot = new Bot(window.nanoblocks.game, ESCENARIOS);
//   bot.seguir(25000);  // corre 25 s y dice cómo va; repetir hasta que `queda` sea 0 y no haya `actual`. Después: bot.resultados
// Duelos (uno contra uno, bicho por bicho): `new Bot(game, DUELOS)`; cada resultado trae el tiempo para matar y el daño recibido.
// Desde la v11.3 el golpe propio conecta después del clic (`golpePend` → `asestar`): las bajas se cuentan en `killedMob` y los
// golpes en `asestar`, envolviendo esos métodos mientras el bot corre (`bot.terminar()` los devuelve). Antes se contaba en el clic y
// siempre salía 0.
// v12.4.8 (fase 0 de los jefes, `docs/revisiones/FASE0_CURVA_JEFES.md` §6): perfiles `torpe` / `promedio` / `habil` (parry al ver
// el brillo dorado, voltereta ante lo rojo y arco contra lo que vuela), los equipos de jefe y los duelos de los 19 jefes:
//   const { Bot, JEFES, resumen } = await import('/tools/bot-pelea.js');
//   window.bot = new Bot(game, JEFES({ perfiles: ['torpe', 'promedio'], veces: 5 })); bot.seguir(25000) … resumen(bot.resultados)
import { ponerEstrellas } from '/src/estrellas.js';
import { startBlock, stopBlock, tryRoll } from '/src/combate.js';

const JUEGOS = { ninguna: [], cuero: [330, 331, 332, 333], hierro: [334, 335, 336, 337], diamante: [338, 339, 340, 341], jade: [342, 343, 344, 345] };
const MADERA = 312, PIEDRA = 313, HIERRO = 314, DIAMANTE = 315, JADE = 324, ARCO = 326, FLECHA = 327;
// la habilidad: cuánto pega, qué tanto cubre al ver el brillo dorado (parry), qué tanto rueda ante lo rojo y si usa el arco con lo que vuela
export const PERFILES = { torpe: { punteria: 0.35, cubre: 0, esquiva: 0, arco: false, fuerte: 0 }, promedio: { punteria: 0.5, cubre: 0.4, esquiva: 0.25, arco: true, fuerte: 0.3 }, habil: { punteria: 0.7, cubre: 0.75, esquiva: 0.5, arco: true, fuerte: 0.7 } };
const noche1 = (name, arma, set) => ({ name, modo: 'noche1', day: 1, t: 0.5, arma, set, foods: 6, max: 620 });
const asedio = (day, arma, set) => ({ name: `asedio día ${day}, ${set}`, modo: 'asedio', casa: true, day, t: 0.52, arma, set, foods: 8, max: 400 });
const larga = (day, arma, set, vida) => ({ name: `noche larga día ${day}, ${set}, +${vida / 2} corazones`, modo: 'noche', casa: true, day, t: 0.6, arma, set, foods: 10, vida, max: 600 });
export const ESCENARIOS = [
  noche1('primera noche, a mano', null, 'ninguna'),
  noche1('primera noche, madera', MADERA, 'ninguna'),
  noche1('primera noche, piedra y cuero', PIEDRA, 'cuero'),
  asedio(5, PIEDRA, 'cuero'), asedio(10, HIERRO, 'cuero'), asedio(10, HIERRO, 'hierro'), asedio(15, HIERRO, 'hierro'), asedio(30, DIAMANTE, 'diamante'),
  larga(20, HIERRO, 'hierro', 6), larga(30, DIAMANTE, 'diamante', 8),
];

// lo mismo, pero con todo lo que el jugador puede preparar: 3 estrellas en arma y armadura, un plato con efecto y todas las hojas
const preparado = (o, plato) => ({ ...o, name: `${o.name}, preparado (${plato})`, mejora: 3, plato, hojas: true });
export const ESCENARIOS_PREPARADOS = [
  preparado(asedio(5, PIEDRA, 'cuero'), 'fuerza'), preparado(asedio(10, HIERRO, 'hierro'), 'coraza'), preparado(asedio(15, HIERRO, 'hierro'), 'fuerza'),
  preparado(larga(20, HIERRO, 'hierro', 6), 'coraza'), preparado(larga(30, DIAMANTE, 'diamante', 8), 'fuerza'),
];
// uno contra uno: el bicho nace a 7 bloques, de noche (de día los hostiles se queman) y sin nadie más en la cancha
export const EQUIPOS = {
  temprana: { arma: MADERA, set: 'ninguna' }, media: { arma: HIERRO, set: 'cuero' }, tardia: { arma: DIAMANTE, set: 'diamante' },
  // v12.4.8: los de jefe (diseño 1.2): el bot sube un escalón para compensar que no cubre
  jefeHierro: { arma: HIERRO, set: 'hierro', mejora: 1, plato: 'coraza' },
  jefeDiamante: { arma: DIAMANTE, set: 'diamante', mejora: 3, plato: 'fuerza', hojas: true },
  jefeJade: { arma: JADE, set: 'jade', mejora: 3, plato: 'fuerza', hojas: true },
};
const duelo = (mob, equipo, extra = {}) => ({ name: `${mob}${extra.estrellas ? ` ${extra.estrellas}★` : ''}, ${equipo}`, modo: 'duelo', mob, equipo, day: extra.day || 10, t: 0.6, ...EQUIPOS[equipo], foods: 4, max: extra.max || 150, ...extra });
const DUELO_MOBS = [
  ['sombra'], ['sombra_hondera'], ['sombra_brincona'], ['arana_bananera'], ['escarabajo'], ['sapo_bufo'], ['ciempies'], ['cangrejo_tenaza'],
  ['luz_mala'], ['mico_malo'], ['chupacabras'], ['puma'], ['becquer'], ['chata'],
  ['sombra', { estrellas: 1 }], ['sombra', { estrellas: 2 }], ['sombra_grande'], ['sombra_escudo'], ['toro_guaco'],
  ['reina_bananera', { max: 300 }], ['escarabajo_hercules', { max: 300 }], ['cangrejo_rey', { max: 300 }], ['jaguar_viejo', { max: 300 }],
];
export const DUELOS = ['temprana', 'media', 'tardia'].flatMap((e) => DUELO_MOBS.map(([m, x]) => duelo(m, e, x)));
// v12.4.8: los 19 jefes con el equipo esperado de la tabla 1.3 del diseño (los del cielo, con arco)
export const JEFES_LISTA = [
  ['terciopelo_reina', 'media'], ['cocodrilo_gigante', 'media'], ['jaguar_viejo', 'media'], ['llorona', 'media'], ['segua', 'media'], ['mona', 'media'], ['cadejos', 'media'],
  ['viejo_monte', 'media'], ['tulevieja', 'media', { arco: true }], ['mono_congo_gigante', 'media'], // el capitán de la goleta no se mide: fuera de su barco no pelea (sale con 0 s)
  ['reina_bananera', 'jefeHierro'], ['cascabel_rey', 'jefeHierro'], ['escarabajo_hercules', 'jefeHierro'], ['sapo_tata', 'jefeHierro'], ['cangrejo_rey', 'jefeHierro'], ['ciempies_rey', 'jefeHierro'],
  ['rey_murcielago', 'jefeHierro', { arco: true }], ['jefa_ventanilla', 'jefeHierro'],
  ['senor_arenal', 'jefeDiamante'], ['arpia', 'jefeDiamante', { arco: true }], ['el_olvido', 'jefeDiamante'], ['sombra_madre', 'jefeDiamante'],
  ['rey_zopilote', 'jefeJade', { arco: true, max: 400 }],
];
export function JEFES({ perfiles = ['torpe', 'promedio', 'habil'], veces = 10, solo = null, revancha = false } = {}) {
  const out = [];
  for (const [mob, equipo, x = {}] of JEFES_LISTA) {
    if (solo && !solo.includes(mob)) continue;
    for (const perfil of perfiles) for (let i = 0; i < veces; i++) out.push(duelo(mob, equipo, { max: 300, ...x, perfil, revancha, name: `${mob}${revancha ? ' (revancha)' : ''}, ${equipo}, ${perfil}` }));
  }
  return out;
}
// resumen de una tanda de duelos repetidos: promedio de tiempo para matar y de daño recibido, y cuántas veces murió el bot
export function resumen(res) {
  const por = {};
  for (const r of res) (por[r.n] = por[r.n] || []).push(r);
  return Object.entries(por).map(([n, L]) => {
    const g = L.filter((r) => r.fin === 'ganó'), prom = (k) => (g.length ? Math.round(g.reduce((a, r) => a + r[k], 0) / g.length * 10) / 10 : null);
    const p = g.length / L.length; // v12.4.8: la probabilidad de ganar a la primera y las muertes esperadas antes de ganar
    return { n, veces: L.length, ganó: g.length, murió: L.filter((r) => r.fin === 'murió').length, p: Math.round(p * 100) / 100, muertesEsperadas: p ? Math.round((1 - p) / p * 100) / 100 : null, ttk: prom('ttk'), recibido: prom('recibido'), sinAvisoPct: (() => { const t = L.reduce((a, r) => a + (r.conAviso || 0) + (r.sinAviso || 0), 0); return t ? Math.round(L.reduce((a, r) => a + (r.sinAviso || 0), 0) / t * 100) : null; })(), golpes: prom('golpes'), exposicion: prom('exposicion'), parrys: prom('parrys'), ruedas: prom('ruedas'), vidaMin: Math.min(...L.map((r) => r.vidaMin)) };
  });
}
const HOJAS = ['comida', 'sed', 'zancudos', 'aguante', 'vendas', 'trampas', 'ojo', 'desgaste', 'cocina', 'caminar', 'manos'];

// crea un mundo de prueba y espera a que esté listo (el nombre es el que después reconoce borrarPruebas)
export async function mundoDePrueba() {
  const espera = (ms) => new Promise((r) => { setTimeout(r, ms); });
  for (let i = 0; i < 60 && !(window.nanoblocks && window.nanoblocks.ui && document.getElementById('new-form')); i++) await espera(250);
  await espera(600);
  const nombre = `Prueba bot ${Date.now()}`;
  document.querySelector('#new-form input').value = nombre;
  document.getElementById('new-form').requestSubmit();
  for (let i = 0; i < 40; i++) { await espera(400); const g = window.nanoblocks.game; if (g && g.player && g.meta && g.meta.name === nombre) break; }
  const g = window.nanoblocks.game, t0 = performance.now();
  while (performance.now() - t0 < 10000 && !(g.ready && g.meta.hist)) g.update(1 / 20);
  for (let i = 0; i < 20; i++) g.update(1 / 12);
  return g;
}
// borra los mundos de prueba. Hay que llamarla desde el menú: al salir de un mundo, este se guarda y reaparece.
export async function borrarPruebas() {
  const S = await import('/src/save.js'), L = await S.listWorlds(), mios = L.filter((w) => /^Prueba bot \d{13}$/.test(w.name));
  for (const w of mios) await S.deleteWorld(w.id);
  return { borrados: mios.length, quedan: (await S.listWorlds()).map((w) => w.name) };
}

export class Bot {
  constructor(g, escenarios, paso = 1 / 12, puntería = 0.35) {
    Object.assign(this, { g, cola: [...escenarios], paso, puntería, actual: null, resultados: [] });
    const p = g.player.body.pos;
    this.inicio = { x: p.x, y: p.y, z: p.z };
    // una cancha plana para que el terreno no ensucie la medición (ni agua donde ahogarse ni barrancos donde caerse); se limpia hasta
    // 48 de alto porque hay riscos que cuelgan encima y las Sombras se quedaban paradas ahí arriba
    const cx = Math.floor(p.x), cz = Math.floor(p.z), y0 = Math.max(63, g.world.gen.column(cx, cz).h); // el suelo, no la copa de un árbol
    Object.assign(this.inicio, { y: y0 + 1, cx, cz, y0 });
    this.cancha();
    const dibujar = g.renderer.render;
    g.renderer.render = () => {}; // sin dibujar corre más rápido (g.render no se puede quitar: ahí se calcula la luz del día)
    // bajas y golpes contados de verdad: cuando el golpe conecta, no en el clic
    const matar = g.killedMob, asestar = g.asestar, bot = this;
    g.killedMob = function (m) { if (bot.actual && (m.kind.hostile || m.kind.boss || m.kind.legend || m.kind.mini)) bot.actual.muertes++; return matar.call(this, m); };
    g.asestar = function (m, ...r) { const A = bot.actual, antes = m.health; const v = asestar.call(this, m, ...r); if (A && (!A.blanco || m === A.blanco)) { A.golpes++; A.hecho += Math.max(0, antes - Math.max(0, m.health)); if (A.t1 == null) A.t1 = A.seg; } return v; };
    this.terminar = () => { g.renderer.render = dibujar; g.killedMob = matar; g.asestar = asestar; };
  }
  // la cancha se repara antes de cada pelea: los asedios dejan la casa construida en el centro y los duelos quedaban encima
  cancha() {
    const { cx, cz, y0 } = this.inicio, w = this.g.world;
    for (let dx = -24; dx <= 24; dx++) for (let dz = -24; dz <= 24; dz++) {
      if (w.getBlock(cx + dx, y0, cz + dz) !== 2) w.setBlock(cx + dx, y0, cz + dz, 2);
      for (let y = 1; y <= 48; y++) if (w.getBlock(cx + dx, y0 + y, cz + dz)) w.setBlock(cx + dx, y0 + y, cz + dz, 0);
    }
  }
  empezar(o) {
    const g = this.g, p = g.player, b = this.inicio, inv = g.inventory, H = g.meta.hist;
    if (!p.alive) g.respawn();
    this.cancha();
    g.entities.spawnT = 2;
    for (const m of g.entities.mobs) if (m.kind.hostile || m.kind.legend || m.kind.mini || m.kind.boss) m.dead = true; // si no, la minijefa de una prueba sigue viva en la otra
    g.meta.nidos = []; g.meta.nidoDia = 1e9; g.miniCd = 1e9; g.legendCd = 1e9; g.congoCd = 1e9; g.zarateCd = 1e9; // solo se mide la pelea: nadie que venga de visita
    p.effects = {}; p.body.fallStart = null; if (p.body.vel) Object.assign(p.body.vel, { x: 0, y: 0, z: 0 });
    Object.assign(p.body.pos, { x: b.x, y: b.y + 0.2, z: b.z });
    p.vidaExtra = o.vida || 0; p.vidaComida = 0; p.necrosis = 0; p.health = p.maxHealth; p.food = 20; p.water = 20; p.effects = {};
    inv.slots.fill(null); inv.selected = 0; if (o.arma) { inv.add(o.arma, 1); if (o.mejora) inv.slots[0].mejora = o.mejora; }
    const P = PERFILES[o.perfil || 'torpe'];
    if (o.arco && P.arco) { inv.slots[1] = { id: ARCO, count: 1 }; inv.slots[2] = { id: FLECHA, count: 64 }; inv.slots[3] = { id: FLECHA, count: 64 }; }
    g.blocking = false; g.mouse.right = false; g.bowDraw = null;
    inv.armor = [null, null, null, null, null];
    JUEGOS[o.set].forEach((id, i) => { inv.armor[i] = { id, count: 1, ...(o.mejora ? { mejora: o.mejora } : {}) }; });
    g.meta.cuaderno = {}; if (o.hojas) for (const k of HOJAS) g.meta.cuaderno[k] = 1;
    if (o.plato) g.addEffect(o.plato, 900);
    g.day = o.day; g.time = o.t; g.nocheLarga = null; g.asedio = null;
    Object.assign(H, { hogar: !!o.casa, casa: o.casa ? { x: Math.floor(b.x) - 4, y: Math.floor(b.y), z: Math.floor(b.z) - 3 } : null, construida: false, asedioDia: 0, asedioAviso: 0, noche: false, nocheGanada: false, asedios: 0, fin: false, cap: o.modo === 'noche' ? 8 : 1, paso: o.modo === 'noche' ? 1 : 0 });
    g.diag = {}; // v12.8.1 (fase 2): el daño de los jefes con y sin aviso (golpes.js marcarAviso, game.js damagePlayer)
    this.actual = { o, P, seg: 0, vidaMin: p.health, muertes: 0, golpes: 0, hecho: 0, t1: null, recibido: 0, comida: o.foods, antes: p.health, fin: null, pico: 0, blanco: null, vistos: new Set(g.entities.mobs), expuesto: 0, parrys: 0, ruedas: 0, fases: {}, soltar: 0, arcoT: 0 };
    if (o.modo === 'duelo') {
      const m = g.entities.spawnMob(o.mob, b.x + 7, b.y + 0.2, b.z);
      if (o.estrellas) ponerEstrellas(m, o.estrellas);
      if (o.revancha) { m.data.revancha = true; m.health *= 1.5; m.data.vmax = m.health; m.kind = { ...m.kind, attack: Math.round(m.kind.attack * 1.3) }; } // como usarOfrenda
      this.actual.blanco = m; this.actual.vidaBlanco = m.health;
      // v12.4.8: en la cancha solo queda el jefe. Antes se colaban las culebras terciopelo y los zancudos del monte (no son «hostiles»)
      // y casi la mitad del daño medido era de ellos
      for (const x of g.entities.mobs) if (x !== m) x.dead = true;
      this.actual.vistos = new Set(g.entities.mobs);
      g.addEffect('repelente', 9999);
    }
  }
  cuadro() {
    const g = this.g, A = this.actual, p = g.player, dt = this.paso;
    g.meta.manaVista = 99; // la oferta de mañas pausa el juego: el bot no escoge
    g.meta.creditosPendientes = false; // v12.4.8: los créditos del Rey vencido frenaban los duelos siguientes
    if (g.ui.state !== 'playing' && g.ui.state !== 'libreta') { g.ui.hideScreens(); g.ui.state = 'playing'; }
    g.paused = false;
    if (g.ui.state === 'libreta') g.ui.closeLibreta();
    if (A.blanco) { // en un duelo no nace nada solo; lo que aparezca lejos del blanco se va (los refuerzos del jefe nacen a su lado y sí cuentan)
      g.entities.spawnT = 1e9; const q = A.blanco.body.pos;
      for (const m of g.entities.mobs) if (m !== A.blanco && !m.dead && !A.vistos.has(m)) { A.vistos.add(m); if (Math.hypot(m.body.pos.x - q.x, m.body.pos.z - q.z) > 6) m.dead = true; } // v12.4.8: solo las crías que nacen al lado del jefe
    }
    g.update(dt); A.seg += dt;
    if (this.contar()) return;
    const hostiles = g.entities.mobs.filter((m) => !m.dead && !m.dying && (m.kind.hostile || m.kind.legend || m.kind.mini) && m.type !== 'zancudo');
    A.pico = Math.max(A.pico, hostiles.length);
    let cerca = null, d = 1e9;
    for (const m of hostiles) { if (Math.abs(m.body.pos.y - p.body.pos.y) > 3.5) continue; const e = Math.hypot(m.body.pos.x - p.body.pos.x, m.body.pos.z - p.body.pos.z); if (e < d) { d = e; cerca = m; } }
    // v12.4.8: lo que hace un jugador de verdad, según el perfil
    const P = A.P, q = p.body.pos;
    if (A.blanco) {
      const B = A.blanco.body.pos, dB = Math.hypot(B.x - q.x, B.z - q.z);
      if (dB < 3 && Math.abs(B.y - q.y) < 3.5) A.expuesto += dt; // al alcance de la espada
      if (A.blanco.data && A.blanco.data.fase) A.fases[A.blanco.data.fase] = (A.fases[A.blanco.data.fase] || 0) + dt;
    }
    if (A.soltar && A.seg >= A.soltar) { stopBlock(g); g.mouse.right = false; A.soltar = 0; }
    for (const m of hostiles) { // el brillo del golpe: dorado se cubre (parry), rojo se rueda
      const k = m.atk;
      if (!k || !k.aviso || k.botVisto) continue;
      k.botVisto = true;
      if (Math.hypot(m.body.pos.x - q.x, m.body.pos.z - q.z) > 5) continue;
      if (!k.o.esquivar && Math.random() < P.cubre) { p.yaw = Math.atan2(q.x - m.body.pos.x, q.z - m.body.pos.z); g.mouse.right = true; startBlock(g); A.soltar = A.seg + 0.4; A.parrys++; } // el bloqueo se sostiene con el clic derecho (combate.js)
      else if (k.o.esquivar && Math.random() < P.esquiva && tryRoll(g)) A.ruedas++;
    }
    for (const f of g.fxGolpes || []) { // los anillos y carriles rojos en el suelo: rueda justo antes de que caiga
      if (f.botVisto || !(f.caida || f.carril) || f.t < f.dur - 0.35) continue;
      f.botVisto = true;
      const r = f.caida ? ((f.m.geometry && f.m.geometry.parameters && f.m.geometry.parameters.outerRadius) || 2) + 0.8 : 0;
      const amenaza = f.caida ? Math.hypot(f.m.position.x - q.x, f.m.position.z - q.z) < r : f.quien && Math.hypot(f.quien.body.pos.x - q.x, f.quien.body.pos.z - q.z) < 14;
      if (amenaza && Math.random() < P.esquiva && tryRoll(g)) A.ruedas++;
    }
    // el arco: si el blanco vuela fuera del alcance de la espada, se carga 0.8 s apuntando y se suelta
    const B = A.blanco && !A.blanco.dead && A.blanco.body.pos;
    const lejos = B && (Math.abs(B.y - q.y) > 3 || Math.hypot(B.x - q.x, B.z - q.z) > 4);
    if (A.o.arco && P.arco && B && lejos && (A.blanco.kind.flying || Math.abs(B.y - q.y) > 3)) {
      const inv = g.inventory, dx = B.x - q.x, dz = B.z - q.z, h = Math.hypot(dx, dz) || 1, dy = B.y + (A.blanco.kind.h || 1) * 0.5 - (q.y + 1.6);
      if (inv.selected !== 1 && inv.slots[1]) { inv.selected = 1; g.mouse.right = false; A.arcoT = 0; }
      p.yaw = Math.atan2(-dx, -dz); p.pitch = Math.max(-1.3, Math.min(1.3, Math.atan2(dy + h * 0.04, h))); // un poquito arriba por la caída
      A.arcoT += dt;
      g.mouse.right = A.arcoT < 0.8;
      if (A.arcoT > 0.9) A.arcoT = 0;
      if (h < 26) { g.update(dt); A.seg += dt; return this.contar(); }
    } else if (g.inventory.selected !== 0) { g.inventory.selected = 0; g.mouse.right = false; p.pitch = 0; }
    const pend = g.golpePend && g.golpePend.mob; // mientras el arma viaja, sigue de frente al que le está pegando (no al más cercano: con varios, el golpe se iba al aire)
    if (pend && !pend.dead) p.yaw = Math.atan2(p.body.pos.x - pend.body.pos.x, p.body.pos.z - pend.body.pos.z);
    if (cerca && d < 3 && g.attackCd <= 0 && !g.blocking && Math.random() < (P ? P.punteria : this.puntería)) { // cubriéndose no pega
      p.yaw = Math.atan2(p.body.pos.x - cerca.body.pos.x, p.body.pos.z - cerca.body.pos.z); // desde la v11.4 el golpe tiene que ir de frente
      g.attack(cerca, cerca.type === 'sombra_escudo' || (cerca.type === 'rey_zopilote' && cerca.data.cor && Math.random() < (P ? P.fuerte || 0 : 0))); // v12.16.2: la coraza del Rey solo se rompe con golpe fuerte; al del escudo, golpe cargado: es lo que dice el juego que se haga
    } else if (cerca && d > 2.2 && d < 30) {
      const b = this.inicio, x = p.body.pos.x + (cerca.body.pos.x - p.body.pos.x) / d * 4.3 * dt, z = p.body.pos.z + (cerca.body.pos.z - p.body.pos.z) / d * 4.3 * dt;
      if (Math.abs(x - b.x) < 20 && Math.abs(z - b.z) < 20) { p.body.pos.x = x; p.body.pos.z = z; } // no sale de la cancha
    }
    const H = g.meta.hist;
    if (A.blanco && (A.blanco.dying || A.blanco.dead)) A.fin = 'ganó';
    if (A.o.modo === 'noche' && H.nocheGanada) A.fin = 'ganó';
    if (A.o.modo === 'asedio' && H.asedios > 0) A.fin = 'ganó';
    if (A.o.modo === 'noche1' && g.day > A.o.day) A.fin = 'amaneció';
  }
  // lo de cada cuadro después de mover el mundo: el daño recibido, la comida y si murió (true si se acabó)
  contar() {
    const g = this.g, A = this.actual, p = g.player;
    if (p.health < A.antes) A.recibido += A.antes - p.health;
    A.antes = p.health; A.vidaMin = Math.min(A.vidaMin, p.health);
    p.water = 20;
    if (p.food < 14 && A.comida > 0) { p.food = Math.min(20, p.food + 6); A.comida--; }
    if (!p.alive) { A.fin = 'murió'; return true; }
    if (A.blanco && (A.blanco.dying || A.blanco.dead)) { A.fin = 'ganó'; return true; }
    return false;
  }
  seguir(ms = 25000) {
    const g = this.g, t0 = performance.now(), hechos = [];
    while (performance.now() - t0 < ms) {
      if (!this.actual) { const o = this.cola.shift(); if (!o) break; this.empezar(o); }
      const A = this.actual;
      this.cuadro();
      if (A.fin || A.seg >= A.o.max) {
        const r = { n: A.o.name, fin: A.fin || `tope (asedio ${g.asedio ? `ola ${g.asedio.ola} ${g.asedio.fase}, quedan ${g.asedio.mobs.length}` : 'no activo'})`, seg: Math.round(A.seg), vidaMin: Math.round(A.vidaMin * 10) / 10, muertes: A.muertes, golpes: A.golpes, recibido: Math.round(A.recibido * 10) / 10, comida: A.o.foods - A.comida, pico: A.pico };
        { let ca = 0, sa = 0; for (const D of Object.values(g.diag || {})) { ca += D.conAviso; sa += D.sinAviso; } r.conAviso = Math.round(ca * 10) / 10; r.sinAviso = Math.round(sa * 10) / 10; } // v12.8.1
        if (A.blanco) Object.assign(r, { ttk: Math.round(A.seg * 10) / 10, vidaBlanco: Math.round(A.vidaBlanco), hecho: Math.round(A.hecho), dps: A.t1 != null ? Math.round(A.hecho / Math.max(0.1, A.seg - A.t1) * 10) / 10 : 0, exposicion: Math.round(A.expuesto / Math.max(0.1, A.seg) * 100) / 100, parrys: A.parrys, ruedas: A.ruedas, fases: Object.fromEntries(Object.entries(A.fases).map(([k, v]) => [k, Math.round(v)])) });
        this.g.blocking = false; this.g.mouse.right = false; this.g.bowDraw = null;
        this.resultados.push(r); hechos.push(r); this.actual = null;
      }
    }
    return { hechos, queda: this.cola.length, actual: this.actual && { n: this.actual.o.name, seg: Math.round(this.actual.seg), vida: this.g.player.health } };
  }
}
