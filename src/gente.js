// La gente de la casa: cada tantos días, alguien pide auxilio en el monte. Si uno espanta a las Sombras y tiene cama de sobra en la casa, se viene
// a vivir: un herrero que repara, una cocinera que guarda un plato, una curandera y un vigilante que dispara en los asedios. Así la casa deja de
// ser un lugar donde se duerme y pasa a ser un lugar donde vive gente, que es de lo que iba todo. Estado: meta.gente; el rescate en curso, g.rescate.
import { getDef, ITEMS, BLOCKS } from './blocks.js';
import { decir } from './misiones.js';
import { anotar } from './diario.js';
import { puestoSombra, sueloCerca } from './asedio.js';
import { difOf } from './supervivencia.js';
import { materialDe } from './comodidad.js';
import { encargoInteract, tickEncargos, encargosTexto } from './encargos.js';
import { ayudaEnPelea } from './defensa.js';

const COLON = 360, VENDA = 440, ANCHO = 9, FONDO = 7, CADA = 3, PRIMER_DIA = 3;
export const PERSONAS = {
  tino: {
    nom: 'Ñor Tino', i: '🔨', seed: 19340, oficio: 'herrero',
    auxilio: '¡Auxilio! ¡Me quieren quitar el yunque, y yo ni ando yunque!',
    gracias: 'Diay, gracias. Yo tenía una herrería, pero el pueblo se vació y ya nadie trae nada que arreglar. ¿Usted tiene un cuarto? Póngame una cama en la casa y le dejo las herramientas como nuevas, una por día.',
    frases: ['Una herramienta bien cuidada no le falla a nadie. Lo mío ya es otra historia.', 'Hacía años que nadie me decía «buenos días».', 'Traiga lo que tenga gastado. Una cosa por día, que tengo mi edad.'],
    servir: (g, P) => {
      if ((P.nivel || 1) >= 2) {
        let n = 0;
        for (const q of [g.inventory.held, ...g.inventory.armor]) { const dq = q && getDef(q.id); if (dq && dq.durability && (q.dur ?? dq.durability) < dq.durability) { q.dur = dq.durability; n++; } }
        if (!n) return 'Todo lo que trae está bueno. Vuelva cuando lo haya maltratado.';
        g.inventory.changed(); P.dia = g.day || 1;
        g.audio.play('yunque', { ui: true, vol: 0.5 });
        return `Listo: ${n === 1 ? 'una pieza como nueva' : `${n} piezas como nuevas`}. Mañana, otra pasada.`;
      }
      const s = g.inventory.held, def = s && getDef(s.id);
      if (!def || !def.durability || !materialDe(def)) return 'Póngase en la mano lo que quiere que le arregle. Una cosa por día.';
      if ((s.dur ?? def.durability) >= def.durability) return 'Eso está bueno. No me haga trabajar de gratis.';
      s.dur = def.durability; g.inventory.changed(); P.dia = g.day || 1;
      g.audio.play('yunque', { ui: true, vol: 0.5 });
      return `Listo: ${def.name}, como nueva. Mañana, otra.`;
    },
  },
  chepa: {
    nom: 'Niña Chepa', i: '🍲', seed: 19341, oficio: 'cocinera',
    auxilio: '¡Socorro! ¡Se me comieron el almuerzo, y ahora me quieren comer a mí!',
    gracias: 'Ay, Dios se lo pague. Yo tenía una soda, pero cerró cuando hicieron la pista y dejó de pasar gente. Si en esa casa hay una cama para mí, hay un plato para usted todos los días. Yo no sé vivir sin cocinarle a alguien.',
    frases: ['¿Ya comió? No me diga que sí, que se le ve en la cara.', 'Doña Zenaida me enseñó a echarle culantro hasta al café. Es broma. No es broma.', 'Aquí nadie se va sin comer.'],
    servir: (g, P) => {
      const plato = [351, 352, 392, 350, 484, 417, 353][Math.floor(Math.random() * 7)];
      g.giveItem(plato, 1); P.dia = g.day || 1;
      if ((P.nivel || 1) >= 2) g.giveItem([351, 392, 484][Math.floor(Math.random() * 3)], 1);
      g.audio.play('craft', { ui: true, vol: 0.3 });
      return `Tome: ${ITEMS[plato].name}. Cómaselo caliente, que mañana hay otro.`;
    },
  },
  flor: {
    nom: 'Doña Flor', i: '🌿', seed: 19342, oficio: 'curandera',
    auxilio: '¡Ayúdeme! ¡Estas no se curan con nada!',
    gracias: 'Gracias, mi criatura. Yo curaba a todo el valle, hasta que pusieron la clínica y me dejaron de venir a ver. Si me hace un campito en su casa, le quito lo que traiga una vez por día. Hasta el mal de ojo, si se deja.',
    frases: ['Eso que tiene es hambre. Casi todo es hambre.', 'Antes venían de lejos. Ahora vienen cuando ya no hay remedio.', 'Déjeme verle esa cara. Hmm. Coma algo.'],
    servir: (g, P) => {
      const J = g.player;
      for (const k of ['sangrando', 'veneno', 'panza', 'mareo', 'escalofrio', 'fiebre', 'quebrado', 'paralisis', 'cansado', 'miedo']) delete J.effects[k];
      J.health = J.maxHealth; P.dia = g.day || 1;
      g.giveItem(VENDA, 2);
      if ((P.nivel || 1) >= 2) g.giveItem(443, 1);
      g.audio.play('hmm', { ui: true, vol: 0.35 });
      g.particles.burst(J.body.pos.x, J.body.pos.y + 1, J.body.pos.z, [[0.5, 1, 0.5], [1, 1, 0.8]], 18, 2);
      return 'Ya. El cuerpo le queda como nuevo, y dos vendas para que no me moleste hasta mañana.';
    },
  },
  wilber: {
    nom: 'Mae Wilber', i: '🏹', seed: 19343, oficio: 'vigilante',
    auxilio: '¡Mae, mae, mae! ¡Ayúdeme, que se me acabaron las flechas!',
    gracias: 'Pura vida, mae. Yo cuidaba una finca que vendieron con todo y yo adentro, y nadie me avisó. Ya no tengo nada que cuidar. Póngame una cama, y de noche le cuido la casa. Soy malo para todo, menos para esto.',
    frases: ['Hoy está tranquilo. No me gusta.', 'Cuando vengan, usted a la puerta y yo disparo. Es lo único que sé.', 'Ya voy afinando la puntería, mae. Ayer le pegué a algo.'],
    servir: (g) => {
      const dia = g.day || 1, f = dia % 5 === 0 ? 0 : 5 - (dia % 5);
      return f === 0 ? 'Hoy es, mae. Hoy vienen. Coma algo y deje la puerta trancada.' : `Faltan ${f} ${f === 1 ? 'día' : 'días'} para que vengan a la casa. Yo aquí estoy.`;
    },
  },
};
const ORDEN = ['tino', 'chepa', 'flor', 'wilber'];
const est = (g) => (g.meta.gente ||= { p: {} });
export const genteEnCasa = (g) => Object.values((g.meta && g.meta.gente && g.meta.gente.p) || {}).filter((P) => P.fase === 2).length;

function camasEnCasa(g, H) {
  const w = g.world;
  let n = 0;
  for (let dx = -10; dx <= ANCHO + 10; dx++) for (let dz = -10; dz <= FONDO + 10; dz++) for (let dy = -3; dy <= 9; dy++) {
    const b = BLOCKS[w.getBlock(H.casa.x + dx, H.casa.y + dy, H.casa.z + dz)];
    if (b && b.bed) { const be = w.getBE(H.casa.x + dx, H.casa.y + dy, H.casa.z + dz); if (be && be.type === 'bed') n++; }
  }
  return n;
}
function ponerPersona(g, k, x, z, y0, extra) {
  const y = sueloCerca(g.world, x, z, y0);
  if (y == null) return null;
  const Q = PERSONAS[k], m = g.entities.spawnMob('vecino', x + 0.5, y + 0.2, z + 0.5);
  if (!m) return null;
  const here = { x, y, z };
  Object.assign(m.data, { home: here, plaza: { ...here }, name: Q.nom, role: 'vecino', vid: `hist:${k}`, seed: Q.seed, gente: k }, extra);
  if (m.kind.dress) m.kind.dress(m);
  return m;
}

// ---------- el rescate ----------
function empezarRescate(g, G, k) {
  const p = g.player.body.pos, dia = g.day || 1;
  const a = Math.random() * Math.PI * 2, r = 34 + Math.random() * 12;
  const x = Math.floor(p.x + Math.cos(a) * r), z = Math.floor(p.z + Math.sin(a) * r);
  if (!g.world.isLoaded(x, z) || !g.world.isLoaded(x + 8, z + 8) || !g.world.isLoaded(x - 8, z - 8)) return false;
  const m = ponerPersona(g, k, x, z, Math.floor(p.y), { rescatando: true });
  if (!m) return false;
  const n = 2 + Math.min(3, Math.floor(dia / 8)), mobs = [];
  for (let i = 0; i < n; i++) {
    const q = puestoSombra(g, x, z, Math.floor(m.body.pos.y), (i / n) * Math.PI * 2, 4);
    if (!q) continue;
    const s = g.entities.spawnMob(i === 2 && dia >= 8 ? 'sombra_hondera' : 'sombra', q.x + 0.5, q.y + 0.2, q.z + 0.5);
    if (!s) continue;
    s.data.apuro = true; s.data.rescate = true;
    s.health += Math.min(10, Math.floor(dia / 3));
    mobs.push(s);
  }
  g.rescate = { k, m, mobs, t: 240, pos: { x, y: Math.floor(m.body.pos.y), z }, habla: 1 };
  G.ultimo = dia;
  g.ui.toast(`🆘 Alguien pide auxilio cerca. La brújula lo marca`, 4200);
  g.audio.play('hmm', { ui: true, vol: 0.5 });
  return true;
}
function tickRescate(g, G) {
  const R = g.rescate, p = g.player.body.pos;
  R.t--;
  R.mobs = R.mobs.filter((m) => !m.dead);
  const quedan = R.mobs.filter((m) => !m.dying), cerca = Math.hypot(R.pos.x - p.x, R.pos.z - p.z);
  // se quedan con la persona hasta que uno se acerque
  if (cerca < 16) for (const m of quedan) m.data.provoked = true;
  if (R.m.dead || (!R.listo && R.t <= 0) || (!R.listo && !g.player.alive) || cerca > 130) {
    for (const m of R.mobs) m.data.irse = 1;
    if (R.m && !R.m.dead) R.m.data.irse = 1;
    if (R.t <= 0) g.ui.toast('🆘 Ya no se oye a nadie. Vaya a saber', 3000);
    g.rescate = null;
    return;
  }
  R.habla--;
  if (quedan.length && R.habla <= 0) { R.habla = 8; decir(g, R.m, PERSONAS[R.k].auxilio, 3.6); }
  if (!quedan.length && !R.listo) {
    R.listo = true;
    (G.p[R.k] ||= { fase: 0 }).fase = 1;
    g.addXP(25);
    g.giveItem(COLON, 10);
    g.ui.toast(`${PERSONAS[R.k].i} Le salvó el pellejo a ${PERSONAS[R.k].nom}. Vaya a hablarle`, 4200);
    anotar(g, `Le quité unas Sombras de encima a ${PERSONAS[R.k].nom}.`, '🆘');
    g.achieve('rescate', 'Pasaba por ahí');
  }
  if (R.listo) {
    // ya está a salvo: se queda un rato y se va a esperar a la casa
    R.tGracias = (R.tGracias ?? 60) - 1;
    if (R.tGracias <= 0) {
      R.m.data.irse = 1; g.rescate = null;
      if (!G.p[R.k].pidio) { G.p[R.k].pidio = true; g.ui.toast(`${PERSONAS[R.k].i} ${PERSONAS[R.k].nom} le mandó a decir: si tiene una cama de sobra en la casa, se viene a vivir`, 5000); }
    }
  }
}

// ---------- cada segundo ----------
export function tickGente(g) {
  if (g.mode !== 'survival' || g.dim !== 'tierra' || !g.meta || !g.meta.hist) return;
  const H = g.meta.hist;
  if (!H.hogar || !H.casa) return;
  const G = est(g), dia = g.day || 1, t = g.time || 0, p = g.player.body.pos;
  if (g.rescate) tickRescate(g, G);
  else if (g.settings.hostiles && difOf(g).hostiles && dia >= PRIMER_DIA && (G.ultimo == null || dia - G.ultimo >= CADA) && t > 0.05 && t < 0.42 && !g.asedio && !g.nocheLarga && !g.apuro && !g.ceniza && !g.grieta) {
    const k = ORDEN.find((q) => !G.p[q]);
    // lejos de la casa: es en el monte donde pasan estas cosas
    if (k && Math.hypot(H.casa.x - p.x, H.casa.z - p.z) > 60 && Math.random() < 0.012) empezarRescate(g, G, k);
  }
  // los que esperan cama
  G.camasT = (G.camasT || 0) - 1;
  const cx = H.casa.x + ANCHO / 2, cz = H.casa.z + FONDO / 2, enCasa = Math.hypot(cx - p.x, cz - p.z) < 44 && g.world.isLoaded(H.casa.x, H.casa.z);
  const esperan = ORDEN.filter((k) => G.p[k] && G.p[k].fase === 1);
  if (enCasa && esperan.length && G.camasT <= 0) {
    G.camasT = 8;
    const libres = camasEnCasa(g, H) - 1 - genteEnCasa(g); // la primera es de uno
    if (libres > 0) {
      const k = esperan[0];
      G.p[k].fase = 2; G.p[k].desde = g.day || 1;
      g.ui.regionBanner(`${PERSONAS[k].i} ${PERSONAS[k].nom} ya vive aquí`, `${PERSONAS[k].oficio[0].toUpperCase()}${PERSONAS[k].oficio.slice(1)} · hable con ${k === 'chepa' || k === 'flor' ? 'ella' : 'él'} todos los días`);
      anotar(g, `${PERSONAS[k].nom} se vino a vivir a la casa.`, PERSONAS[k].i);
      g.achieve('gente1', 'Ya no vivo sin nadie');
      if (genteEnCasa(g) === 4) { g.ui.regionBanner('Esto ya es un caserío', 'Cada mañana le dejan su parte: 8 colones'); g.achieve('gente4', 'El caserío de Zenaida'); }
    }
  }
  if (enCasa) tickCaserio(g, H, G);
  tickEncargos(g, G, H);
}
function tickCaserio(g, H, G) {
  const dia = g.day || 1, p = g.player.body.pos;
  ORDEN.forEach((k, i) => {
    const P = G.p[k];
    if (!P || P.fase !== 2) return;
    let m = g.entities.mobs.find((q) => !q.dead && q.data && q.data.gente === k && !q.data.rescatando);
    if (!m) {
      const arriba = k === 'wilber' && H.mirador;
      m = arriba ? ponerPersona(g, k, H.mirador.x, H.mirador.z, H.mirador.y) : ponerPersona(g, k, H.casa.x - 2 + i * 4, H.casa.z - 5, H.casa.y);
      if (!m) return;
    }
    if (Math.hypot(m.body.pos.x - p.x, m.body.pos.z - p.z) < 12) {
      m.data.charla = (m.data.charla ?? 8 + i * 9) - 1;
      if (m.data.charla <= 0) { m.data.charla = 55 + Math.random() * 55; const F = PERSONAS[k].frases; decir(g, m, F[Math.floor(Math.random() * F.length)], 3.4); }
    }
    if (k === 'wilber') disparar(g, m);
    else ayudaEnPelea(g, k, m, P);
  });
  // la parte que le dejan, con la casa llena
  if (genteEnCasa(g) >= 4 && G.cuota !== dia && (g.time || 0) < 0.3) { G.cuota = dia; g.giveItem(COLON, 8); g.ui.toast('🏘 El caserío le dejó su parte: 8 colones', 2200); }
}
// el vigilante le dispara a lo que venga por la casa
function disparar(g, W) {
  W.data.cd = (W.data.cd || 0) - 1;
  if (W.data.cd > 0) return;
  const P = g.meta.gente.p.wilber, fuerte = (P.nivel || 1) >= 2;
  let mejor = null, d = fuerte ? 28 : 18;
  for (const m of g.entities.mobs) {
    if (m.dead || m.dying || !m.kind.hostile || m.kind.boss || m.data.comensalFn) continue;
    const q = Math.hypot(m.body.pos.x - W.body.pos.x, m.body.pos.z - W.body.pos.z);
    if (q < d) { d = q; mejor = m; }
  }
  if (!mejor) return;
  W.data.cd = 2;
  W.targetYaw = Math.atan2(mejor.body.pos.x - W.body.pos.x, mejor.body.pos.z - W.body.pos.z);
  const a = W.body.pos, b = mejor.body.pos;
  for (let i = 1; i <= 8; i++) { const f = i / 8; g.particles.spawn(a.x + (b.x - a.x) * f, a.y + 1.3 + (b.y + 0.8 - a.y - 1.3) * f, a.z + (b.z - a.z) * f, [0.9, 0.85, 0.6], 0, 0, 0, 0.25, 0); }
  g.audio.play('flecha', { pos: { x: b.x, y: b.y + 1, z: b.z }, vol: 0.6 });
  mejor.hurt(fuerte ? 9 : 5, a.x, a.z);
  if (mejor.dying) g.killedMob(mejor);
}
// ---------- hablarles ----------
export function genteInteract(m, g) {
  const k = m.data.gente;
  if (!k) return false;
  const G = est(g), P = G.p[k], Q = PERSONAS[k], diga = (t, ms = 6500) => g.ui.dialog(Q.nom, t, ms), dia = g.day || 1;
  if (!P || P.fase === 0) { diga('¡Primero quíteme estas de encima!', 2500); return true; }
  if (P.fase === 1) {
    if (!P.pidio) { P.pidio = true; diga(Q.gracias, 11000); return true; }
    diga('¿Ya tiene la cama? Con una más de las que usted ocupa, en la casa. Yo llego solo.', 4500);
    return true;
  }
  if (encargoInteract(g, k, P, g.meta.hist, diga)) return true;
  if (P.dia === dia && k !== 'wilber') { diga(Q.frases[Math.floor(Math.random() * Q.frases.length)], 4000); return true; }
  diga(Q.servir(g, P), 5500);
  return true;
}
export const marcaRescate = (g) => (g.rescate && !g.rescate.listo ? g.rescate.pos : null);
export function limpiarGente(g) { g.rescate = null; }
export function pruebaGente(g) {
  const G = est(g), k = ORDEN.find((q) => !G.p[q]);
  g.meta.hist.hogar = true;
  if (!k) return 'Ya vinieron todos';
  g.time = 0.1;
  return empezarRescate(g, G, k) ? `Rescate de ${PERSONAS[k].nom}: la brújula lo marca` : 'Falta cargar el terreno: pruebe otra vez';
}
export function pruebaCaserio(g) {
  const G = est(g), dia = g.day || 1;
  g.meta.hist.hogar = true;
  for (const k of ORDEN) if (!G.p[k] || G.p[k].fase !== 2) G.p[k] = { fase: 2, pidio: true, desde: dia - 2 };
  return 'Los cuatro viven en la casa, y ya le quieren pedir algo';
}
export function genteTexto(g) {
  const G = g.meta && g.meta.gente;
  if (!G) return [];
  const L = [];
  for (const k of ORDEN) {
    const P = G.p[k];
    if (P && P.fase === 1) L.push(`${PERSONAS[k].i} ${PERSONAS[k].nom} espera una cama de sobra en la casa`);
    if (P && P.fase === 2 && !(P.enc && !P.enc.hecho) && (P.nivel || 1) < 2 && P.desde != null && (g.day || 1) - P.desde >= 1 && !P.enc) L.push(`${PERSONAS[k].i} ${PERSONAS[k].nom} le quiere pedir un favor`);
    if (P && P.fase === 2 && k !== 'wilber' && P.dia !== (g.day || 1)) L.push(`${PERSONAS[k].i} ${PERSONAS[k].nom}, ${PERSONAS[k].oficio}: hoy no le ha hablado`);
  }
  return [...L, ...encargosTexto(g)];
}
