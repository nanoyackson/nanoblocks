// Compañeros: el peón que se contrata por un día (10 colones; lo sigue, pelea contra lo que lo ataque, le carga cosas
// y le hace conversa) y el perro zaguate que de vez en cuando sale corriendo y vuelve con algo en el hocico.
import { VALOR } from './plata.js';
import { decir } from './misiones.js';
import { extras } from './inventory.js';

const COLON = 360, PRECIO = 10;
const CHARLA = [
  '¡Diay, patrón! ¿Para dónde vamos?', 'Uy, qué calor… ¿no tendrá un fresquito?', 'Mi abuela decía que por aquí espantan.',
  'Yo le cargo lo que quiera, pero no me ponga a cargar piedras, porfa.', '¡Upe! Ese cerro está bonito para un café.',
  'Ojo, que de noche salen las Sombras.', 'Si ve un Cadejos, no corra… o sí, corra.', '¿Ya almorzó? Un casadito no le cae mal a nadie.',
  'Esta chamba está tuanis, ¡pura vida!', 'Mañana tengo mejenga, ¿se apunta?',
];
const PELEA = ['¡Venga, pues!', '¡Quítese, bicho!', '¡Le voy a dar machete!', '¡Al patrón no lo toca!'];

const ahora = (g) => (g.day || 1) + (g.time || 0);

// ---------- contratar (clic derecho con colones en la mano) y hablar con el peón ----------
export function peonInteract(m, g) {
  const d = m.data;
  if (d.peon) {
    if (g.player.sneaking || (g.keys && (g.keys.has('ShiftLeft') || g.keys.has('ShiftRight')))) {
      d.peon.quieto = !d.peon.quieto;
      decir(g, m, d.peon.quieto ? 'Listo, aquí lo espero.' : '¡Vamos, pues!');
      return true;
    }
    if (!d.chest) d.chest = new Array(18).fill(null);
    g.ui.openEntityChest(m, `Lo que carga ${d.name || 'el peón'}`);
    return true;
  }
  const held = g.inventory.held;
  const conPlata = held ? !!VALOR[held.id] : !!(g.player && g.player.sneaking); // una pieza en la mano, o agachado (paga la billetera)
  if (!conPlata || g.mode !== 'survival') return false;
  if (!(d.oferta > 0) || ahora(g) - d.oferta > 0.01) {
    d.oferta = ahora(g);
    decir(g, m, `¿Me ocupa? Por ${PRECIO} colones lo acompaño todo el día: le peleo, le cargo cosas y le hago conversa. (otro clic para cerrar el trato)`);
    return true;
  }
  if (g.inventory.count(COLON) < PRECIO) { decir(g, m, `Son ${PRECIO} colones, patrón. Ni uno menos, que la vida está cara.`); return true; }
  g.inventory.remove(COLON, PRECIO);
  d.oferta = 0;
  d.peon = { hasta: ahora(g) + 1, quieto: false, charlaT: 20 };
  d.chest = d.chest || new Array(18).fill(null);
  m.tamed = true;
  g.audio.play('monedas', { ui: true, vol: 0.5 });
  decir(g, m, '¡Trato hecho! Desde ya soy su peón hasta mañana a esta hora.');
  g.ui.toast(`🤝 Contrató a ${d.name || 'un vecino'} por un día: lo sigue y pelea · clic derecho = lo que carga · Shift + clic = espera aquí`, 4200);
  g.achieve('peon', 'Con peón y todo');
  return true;
}

// ---------- el cerebro del peón (reemplaza al de vecino mientras está contratado) ----------
export function peonBrain(m, dt, c) {
  const { g, distP, dxp, dzp } = c;
  const d = m.data, P = d.peon;
  // se acabó el día: devuelve lo que cargaba y se va para la casa
  if (ahora(g) > P.hasta) {
    terminar(m, g);
    return false;
  }
  P.charlaT -= dt;
  if (P.charlaT <= 0 && distP < 10) { P.charlaT = 40 + Math.random() * 50; decir(g, m, CHARLA[Math.floor(Math.random() * CHARLA.length)]); }
  // pelear contra lo que ande cerca del patrón
  const pl = g.player.body.pos;
  let foe = null, fd = 12;
  for (const o of g.entities.mobs) {
    if (o === m || o.dying || o.dead || !o.kind.hostile || o.data.comensalFn) continue;
    const dd = Math.hypot(o.body.pos.x - pl.x, o.body.pos.z - pl.z);
    if (dd < fd) { fd = dd; foe = o; }
  }
  P.cd = Math.max(0, (P.cd || 0) - dt);
  if (foe && !P.quieto) {
    if (!P.grito) { P.grito = true; decir(g, m, PELEA[Math.floor(Math.random() * PELEA.length)]); }
    m.goTo(foe.body.pos.x, foe.body.pos.z, 1.6);
    const dd = Math.hypot(foe.body.pos.x - m.body.pos.x, foe.body.pos.z - m.body.pos.z);
    if (dd < 1.7 && P.cd <= 0) {
      P.cd = 0.9; d.golpe = 0.3;
      foe.hurt(foe.kind.boss ? 2 : 4, m.body.pos.x, m.body.pos.z);
      g.audio.play('swish', { pos: m.soundPos(), vol: 0.5 });
      P.peleas = (P.peleas || 0) + 1;
      if (P.peleas === 10) g.achieve('peon_pelea', 'Mi peón es un león');
    }
    return true;
  }
  P.grito = false;
  if (P.quieto) { m.moving = false; return true; }
  m.follow(distP, dxp, dzp, 3);
  return true;
}

function terminar(m, g) {
  const d = m.data;
  const items = (d.chest || []).filter(Boolean);
  const p = g.player.body.pos;
  for (const s of items) {
    const left = g.inventory.add(s.id, s.count, s.dur, extras(s));
    if (left > 0) g.entities.dropItem(s.id, left, p.x, p.y + 0.5, p.z, undefined, undefined, s.dur, extras(s));
  }
  d.chest = null; d.peon = null; m.tamed = false;
  decir(g, m, items.length ? 'Se me acabó el día, patrón. Ahí le devuelvo sus cosas. ¡Pura vida!' : 'Se me acabó el día, patrón. ¡Cuando quiera me vuelve a ocupar!');
  g.ui.toast(`🤝 Terminó el día de ${d.name || 'su peón'}${items.length ? ': le devolvió lo que cargaba' : ''}`, 2600);
}

// ---------- el perro que trae cosas ----------
const TRAE = [[256, 30, 'un palo'], [368, 10, 'una bota vieja'], [261, 10, 'una manzana'], [COLON, 10, 'unos colones'], [384, 8, 'una oreja de guanacaste'], [258, 8, 'un lingote de hierro'], [259, 5, 'oro'], [273, 3, 'un fragmento de jade'], [260, 2, '¡un diamante!']];
function sorteo() {
  let r = Math.random() * TRAE.reduce((a, t) => a + t[1], 0);
  for (const t of TRAE) { r -= t[1]; if (r <= 0) return t; }
  return TRAE[0];
}
// devuelve true si el perro está ocupado buscando o trayendo algo
export function perroTrae(m, g, dt, distP) {
  const d = m.data;
  if (d.sit) { d.trae = null; return false; }
  d.traerCd = (d.traerCd ?? 50 + Math.random() * 70) - dt;
  if (!d.trae) {
    if (d.traerCd > 0 || distP > 8) return false;
    const a = Math.random() * Math.PI * 2, b = m.body.pos;
    d.trae = { fase: 'va', x: b.x + Math.cos(a) * 14, z: b.z + Math.sin(a) * 14, t: 0 };
    g.audio.play('perro', { pos: m.soundPos(), vol: 0.8 });
  }
  const T = d.trae, b = m.body.pos, pl = g.player.body.pos;
  T.t += dt;
  if (T.fase === 'va') {
    m.goTo(T.x, T.z, 1.6);
    if (T.t > 5 || Math.hypot(T.x - b.x, T.z - b.z) < 1.5) { T.fase = 'vuelve'; T.t = 0; T.cosa = sorteo(); }
    return true;
  }
  m.goTo(pl.x, pl.z, 1.7);
  if (distP < 2 || T.t > 12) {
    const [id, , nombre] = T.cosa;
    g.entities.dropItem(id, id === COLON ? 1 + Math.floor(Math.random() * 3) : 1, pl.x, pl.y + 0.5, pl.z);
    const quien = d.nombre || 'El zaguate';
    g.ui.toast(`🐕 ${quien} le trajo ${nombre}`, 2200);
    g.particles.burst(b.x, b.y + 0.8, b.z, [[1, 0.45, 0.6], [1, 0.7, 0.8]], 5, 1.2);
    g.audio.play('perro', { pos: m.soundPos(), vol: 1, pitch: 1.15 });
    g.achieve('perro_trae', '¿Quién es un buen perro?');
    if (id === 260) g.achieve('perro_diamante', 'El perro millonario');
    d.trae = null; d.traerCd = (60 + Math.random() * 90) * ((d.lealtad || 1) >= 2 ? 0.5 : 1); // v12.4.2: con lealtad 2, trae el doble de seguido
  }
  return true;
}
