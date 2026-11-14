// C4 «Pura vida en la finca», parte 2 (v12.4.2): el concurso de la mejor cosecha en la feria del sábado, el zaguate con lealtad y collar,
// y las rutinas de los animales (duermen de noche). La carreta pintada y su carga están en carreta.js. Nada nuevo en el guardado fuera de
// m.data de los animales mansos (que ya se guarda) y meta.concursoDia.
import { getDef, SOLID, FLUID } from './blocks.js';
import { hash3 } from './noise.js';
import { COSECHAS, diaDeFeria } from './economia.js';
import { consejoUnaVez } from './supervivencia.js';
import { temporadaDe, DIAS_TEMPORADA } from './temporadas.js';

export const COLLAR = 576, LISTON = 577;
const COLON = 360;
const K_UNIDAD = 500;

// ---------- el concurso de la mejor cosecha ----------
// sábado de feria, Mayús + clic derecho al feriante con 8 o más de una cosecha en la mano: inscripción de 2 unidades; gana si su cosecha
// le gana a las de los rivales de esa semana (puntaje fijo por semana, como el torneo). Una vez por sábado
export function concursoFeria(m, g) {
  const held = g.inventory.held;
  const sneak = g.keys.has('ShiftLeft') || g.keys.has('ShiftRight');
  if (!sneak || !diaDeFeria(g)) return false;
  if (!held || !COSECHAS.includes(held.id)) { g.ui.dialog('El juez de la feria', 'Para el concurso de la mejor cosecha traiga 8 de algo que haya cosechado, en la mano. La inscripción son dos unidades (mil colones).', 4200); return true; }
  if (g.meta.concursoDia === g.day) { g.ui.dialog('El juez de la feria', 'Ya participó hoy. El otro sábado hay otro concurso, ¡no se lo pierda!', 3600); return true; }
  if (held.count < 8) { g.ui.dialog('El juez de la feria', `Con ${held.count} no alcanza: son 8 de la misma cosecha.`, 3000); return true; }
  if (g.mode === 'survival' && g.inventory.count(COLON) < 2) { g.ui.dialog('El juez de la feria', 'La inscripción son dos unidades (mil colones).', 3000); return true; }
  if (g.mode === 'survival') g.inventory.remove(COLON, 2);
  g.meta.concursoDia = g.day;
  // su puntaje: cuánto trae (hasta una pila) y lo bonita que salió; los rivales, fijos por semana
  const semana = Math.floor((g.day || 1) / 7);
  const suyo = Math.min(held.count, 64) * (0.8 + hash3(g.meta.seed || 1, g.day, held.id, 5) * 0.4);
  const rival = 8 + hash3(g.meta.seed || 1, semana, 909, 3) * 40;
  const nombre = (getDef(held.id) || {}).name || 'su cosecha';
  if (suyo > rival) {
    if (g.mode === 'survival') g.inventory.consumeHeld(8);
    g.inventory.darColones ? g.inventory.darColones(20 * K_UNIDAD) : g.inventory.add(COLON, 20);
    g.inventory.add(LISTON, 1);
    g.ui.toast(`🏆 ¡Ganó el concurso de la mejor cosecha con ${nombre.toLowerCase()}! 20 unidades y el listón`, 4200);
    g.achieve('feria_ganador', 'Mejor cosecha del cantón');
  } else {
    g.ui.toast(`🥈 Este sábado ganó Doña Tere con una cosecha más grande. Su cosecha de ${nombre.toLowerCase()} vuelve a su bolsa: ¡el otro sábado!`, 4200);
  }
  return true;
}

// ---------- el zaguate con lealtad ----------
// lo llama el cerebro del perro manso: una vez por día sube la lealtad (hasta 3) si comió en los últimos 2 días; si no, baja
export function lealtadZaguate(m, g) {
  const d = m.data, hoy = g.day || 1;
  if (d.comio === undefined) d.comio = hoy;
  if (d.lealtad === undefined) { d.lealtad = 1; consejoUnaVez(g, 'zaguate', '🐕 Un zaguate se encariña si lo alimenta cada dos días', 4200); }
  if (d.diaL === hoy) return;
  if (d.diaL === undefined) { d.diaL = hoy; return; }
  d.diaL = hoy;
  if (hoy - d.comio >= 3) { if (d.lealtad > 1) { d.lealtad--; g.ui.toast(`🐕 ${d.nombre ? `«${d.nombre}»` : 'El zaguate'} tiene hambre: hace días que no come`, 2600); } return; }
  if (d.lealtad < 3) {
    d.lealtad++;
    const Quien = d.nombre ? `«${d.nombre}»` : 'El zaguate'; // v12.4.7: con su nombre
    g.ui.toast(d.lealtad === 3 ? `🐕 ¡${Quien} ya es de la familia! Pelea más duro` : `🐕 ¡${Quien} le lamió la mano! Ahora trae cosas más seguido`, 3200);
    if (d.lealtad === 3) g.achieve('zaguate3', 'Zaguate de toda la vida');
  }
}
// darle de comer cualquier cosa (o ponerle el collar); devuelve true si lo atendió
export function atenderZaguate(m, g, held) {
  if (!held) return false;
  if (held.id === COLLAR) {
    if (m.data.collar) { g.ui.toast('🐕 Ya tiene su collar', 1400); return true; }
    m.data.collar = true; m.health = Math.min((m.kind.health || 16) + 4, m.health + 4);
    if (g.mode === 'survival') g.inventory.consumeHeld(1);
    g.ui.toast('🐕 ¡Qué elegante con su collar de cuero!', 2000);
    return true;
  }
  const def = getDef(held.id);
  if (!def || !def.food || def.sip) return false;
  m.data.comio = g.day || 1;
  if (g.mode === 'survival') g.inventory.consumeHeld(1);
  g.audio.play('perro', { pos: m.soundPos(), vol: 0.6 });
  g.ui.toast('🐕 Se lo comió de una, moviendo la cola', 1400);
  return true;
}

// ---------- las rutinas de los animales: de noche duermen ----------
// una vez por segundo, para los animales mansos de la finca y del monte a menos de 40 bloques: de noche se echan a dormir, no se mueven
// y se despiertan si uno se arrima a menos de 3 o les pegan (entities.js respeta data.duerme)
const NO_DUERMEN = new Set(['perro', 'carreta', 'caballo', 'murcielago', 'buho', 'lechuza', 'luciernaga', 'zancudo', 'polilla']);
export function tickRutinas(g) {
  if (g.dim !== 'tierra') return;
  const noche = g.time > 0.55 && g.time < 0.95;
  const pl = g.player.body.pos;
  let n = 0;
  for (const m of g.entities.mobs) {
    if (m.kind.hostile || m.kind.vehicle || NO_DUERMEN.has(m.type) || m.data.sigue || m.data.ruta || m.data.saqueador || m.riding) { m.data.duerme = false; m.rutina = null; continue; }
    if (!m.kind.speed) continue;
    const d = Math.hypot(m.body.pos.x - pl.x, m.body.pos.z - pl.z);
    if (d > 40 || ++n > 40) { m.rutina = null; continue; }
    const antes = m.data.duerme;
    m.data.duerme = noche && d > 3 && !(m.hurtT > 0) && !(m.panic > 0);
    if (m.data.duerme && !antes && d < 16) g.achieve('rutina', 'El pueblo duerme');
    if (m.data.duerme && Math.random() < 0.33) g.particles.spawn(m.body.pos.x, m.body.pos.y + m.kind.h + 0.3, m.body.pos.z, [0.85, 0.9, 1], 0, 0.4, 0, 1.2, 0, true); // «Zz»
    // v12.4.7: de día, a dónde ir: bajo techo con el aguacero, a la sombra en verano y al agua al mediodía (m.rutina, no se guarda)
    m.rutina = m.data.duerme || m.hurtT > 0 || m.panic > 0 || m.tamed || m.data.role || m.kind.flying || m.kind.swimmer || m.body.inWater ? null : destinoRutina(m, g); // la gente del pueblo, lo que vuela y lo del agua, no
  }
}

// adónde va un animal según la hora y el tiempo (o null). Las búsquedas se guardan 10 s por animal
const llueveFuerte = (g) => g.weather && g.weather.intensity > 0.5 && !g.dry && !g.cold;
function destinoRutina(m, g) {
  const t = g.time, b = m.body.pos;
  const tipo = llueveFuerte(g) ? 'techo' : g.season === 'verano' && t > 0.15 && t < 0.35 ? 'sombra' : t > 0.18 && t < 0.28 ? 'agua' : null;
  if (!tipo) return null;
  const ck = g.clock || 0, R = m.rutinaBusca;
  if (R && R.tipo === tipo && ck - R.t < R.dura) {
    // v12.4.9: si en 6 s no se acercó (una cerca, una pared), ese punto queda malo un minuto y se busca otro
    const P = R.punto;
    if (P && !P.llego) {
      const d = Math.hypot(P.x - b.x, P.z - b.z);
      if (d < 1.3) { P.llego = true; return P; } // v12.4.13: ya llegó (bebiendo en la orilla): no se marca la orilla como mala
      if (R.d0 === undefined || d < R.d0 - 0.5) { R.d0 = d; R.t0 = ck; }
      else if (ck - R.t0 > 6) { (m.rutinaMalas ||= []).push({ x: P.x, z: P.z, hasta: ck + 60 }); m.rutinaBusca = null; return null; }
    }
    return P;
  }
  if (!R && Math.random() < 0.6) return null; // v12.4.9: al empezar el aguacero no buscan todos en el mismo segundo
  if (m.rutinaMalas) m.rutinaMalas = m.rutinaMalas.filter((q) => q.hasta > ck);
  const punto = buscar(g.world, b.x, b.y, b.z, tipo === 'agua' ? 16 : 12, tipo, m.rutinaMalas);
  m.rutinaBusca = { tipo, t: ck, punto, dura: 8 + Math.random() * 4 }; // cada animal vuelve a buscar a su tiempo
  return punto;
}
// v12.4.9: ¿se llega en línea recta? (nada sólido a la altura de los pies ni de la cabeza)
function caminoLibre(w, x0, y, z0, x1, z1) {
  const d = Math.hypot(x1 - x0, z1 - z0), n = Math.ceil(d * 2);
  for (let i = 1; i < n; i++) {
    const x = Math.floor(x0 + (x1 - x0) * i / n), z = Math.floor(z0 + (z1 - z0) * i / n);
    if (SOLID[w.getBlock(x, y, z)] || SOLID[w.getBlock(x, y + 1, z)]) return false;
  }
  return true;
}
// ¿hay techo (o copa de árbol) encima de esta columna, a poca altura?
function tapado(w, x, y, z) {
  for (let yy = y + 2; yy < y + 10; yy++) if (SOLID[w.getBlock(x, yy, z)]) return true;
  return false;
}
// el punto más cercano que sirva, buscando en anillos alrededor del animal (pocos bloques por vuelta: corre a 1 Hz)
function buscar(w, px, py, pz, radio, tipo, malas) {
  const x0 = Math.floor(px), y0 = Math.floor(py), z0 = Math.floor(pz);
  if (tipo !== 'agua' && tapado(w, x0, y0, z0)) return { x: px, z: pz, llego: true }; // ya está bajo techo
  for (let r = 2; r <= radio; r += 2) {
    const pasos = Math.max(8, Math.round(r * 3));
    for (let i = 0; i < pasos; i++) {
      const a = (i / pasos) * Math.PI * 2, x = Math.floor(x0 + Math.cos(a) * r), z = Math.floor(z0 + Math.sin(a) * r);
      if (malas && malas.some((q) => Math.abs(q.x - x - 0.5) < 1.5 && Math.abs(q.z - z - 0.5) < 1.5)) continue;
      if (!caminoLibre(w, px, y0, pz, x + 0.5, z + 0.5)) continue; // v12.4.9: sin cercas ni paredes en el medio
      // el suelo a la altura del animal (±2)
      let y = -1;
      for (let yy = y0 + 2; yy >= y0 - 2; yy--) if (SOLID[w.getBlock(x, yy - 1, z)] && !SOLID[w.getBlock(x, yy, z)] && !SOLID[w.getBlock(x, yy + 1, z)]) { y = yy; break; }
      if (tipo === 'agua') {
        // la orilla: una casilla seca al lado de una con agua
        for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) for (const yy of [y0 - 1, y0]) if (FLUID[w.getBlock(x + dx, yy, z + dz)] === 1 && y >= 0) return { x: x + 0.5, z: z + 0.5, mira: { x: x + dx + 0.5, z: z + dz + 0.5 } };
        continue;
      }
      if (y >= 0 && tapado(w, x, y, z)) return { x: x + 0.5, z: z + 0.5 };
    }
  }
  return null;
}

// ---------- la molienda (v12.4.7) ----------
// en verano, los días 20, 21 y 22 de la temporada el pueblo muele caña: el caficultor y el pulpero la compran a 1 unidad por 3 (el
// cantinero la paga a 1 por 4 siempre) y suena la marimba. No hay mecánica nueva: precio y ambiente
export function diaDeMolienda(g) {
  const d = ((g.day || 1) - 1) % DIAS_TEMPORADA + 1;
  return temporadaDe(g.day) === 'verano' && d >= 20 && d <= 22;
}
export function comprasMolienda(g, role) {
  return diaDeMolienda(g) && (role === 'caficultor' || role === 'pulpero') ? [[296, 3, 1]] : [];
}
// una vez por segundo (game.js): el aviso del día y la marimba si hay pueblo cerca
export function tickMolienda(g) {
  if (g.dim !== 'tierra' || !diaDeMolienda(g)) return;
  if (g.meta.moliendaDia !== g.day && g.time > 0.05 && g.time < 0.45) {
    const p = g.player.body.pos;
    const cerca = g.entities.mobs.some((m) => m.data && m.data.role && Math.hypot(m.body.pos.x - p.x, m.body.pos.z - p.z) < 48);
    if (!cerca) return;
    g.meta.moliendaDia = g.day;
    g.ui.toast('🍬 ¡Día de molienda! Venda su caña en el pueblo: 3 por una unidad', 4200);
    if (g.music && g.music.concert) g.music.concert();
  }
}

// ---------- el yugo (v12.4.7): con la carreta y sus bueyes a menos de 4 bloques, el trapiche muele el doble de rápido ----------
export function yugoCerca(g, x, z) {
  return g.entities.mobs.some((m) => m.type === 'carreta' && Math.hypot(m.body.pos.x - x - 0.5, m.body.pos.z - z - 0.5) < 4);
}
