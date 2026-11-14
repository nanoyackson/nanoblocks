// La gente y el remate de la Noche del Rey (v12.16.5, fases 6 y 7 del diseño de jefes y final).
// Fase 6 «Gente y trama»: cuando la Corona está en el altar, los vecinos que la partida YA CONOCE suben con faroles por el sendero y se
// quedan en la ladera del redondel, inmortales (`m.data.inmortal`, `m.data.reyGente`). Ninguno muere ni se atasca: están sobre el sendero
// de piedra (siempre firme, afuera del anillo que se achica), no caminan, y se limpian con el redondel (`quitarGente`). Cada uno dice lo
// suyo con `decir` (globo, sin quitar el control) y hace lo suyo (bendición, plato, flechas, arreglo, borde tapado). Solo el anfitrión
// simula todo esto; los vecinos son criaturas normales y viajan en la sincronía de siempre.
// Fase 7 «Remate»: el golpe final, el alba (el reloj sube al amanecer y los faroles se encienden de uno en uno), el remate hablado, los
// premios (una vez por persona: `meta.reyPremio`), los créditos con nombres reales y la maña «Rey de la cumbre». Vencer al Rey otra vez
// no repite premios ni créditos.
import { decir } from './misiones.js';
import { anotar } from './diario.js';
import { PERSONAS } from './gente.js';
import { ayudaEnPelea } from './defensa.js';
import { entregarCartaRey } from './correo.js';
import { puestoLadera, taparBorde } from './reyfinal.js';
import { calmaActiva } from './calma.js';

export const CAMPANA = 1190, MANTILLA = 1191, FOTO = 698, CIGARROS = 510;

// quién es cada uno: nombre, ícono, semilla del cuerpo y de dónde sabe la partida que existe
const GENTE = {
  chema: { nom: 'Don Chema', i: '✉', seed: 19351, conoce: (M) => !!(M.correo && Object.keys(M.correo.leidas || {}).length >= 1) },
  eulalia: { nom: 'Doña Eulalia', i: '🍰', seed: 19330, conoce: (M) => !!(M.hist && M.hist.cap >= 2) },
  chepa: { nom: PERSONAS.chepa.nom, i: PERSONAS.chepa.i, seed: PERSONAS.chepa.seed, conoce: (M) => visto(M, 'chepa') },
  flor: { nom: PERSONAS.flor.nom, i: PERSONAS.flor.i, seed: PERSONAS.flor.seed, conoce: (M) => visto(M, 'flor') },
  tino: { nom: PERSONAS.tino.nom, i: PERSONAS.tino.i, seed: PERSONAS.tino.seed, conoce: (M) => visto(M, 'tino') },
  wilber: { nom: PERSONAS.wilber.nom, i: PERSONAS.wilber.i, seed: PERSONAS.wilber.seed, conoce: (M) => visto(M, 'wilber') },
  anselmo: { nom: 'Don Anselmo', i: '🚬', seed: 19362, conoce: (M) => !!(M.anselmo && M.anselmo.fase >= 1) },
  rigo: { nom: 'Tío Rigo', i: '📄', seed: 19331, conoce: (M) => !!(M.rigo && M.rigo.fase >= 1) },
  marielos: { nom: 'Prima Marielos', i: '🏷', seed: 19350, conoce: (M) => !!(M.prima && M.prima.fase >= 1) },
  yendry: { nom: 'Yendry', i: '🔔', seed: 19334, conoce: (M) => !!(M.hist && M.hist.guila && M.hist.guila.fase >= 1) },
};
const visto = (M, k) => !!(M.gente && M.gente.p && M.gente.p[k] && M.gente.p[k].fase >= 1);
const ORDEN = ['chema', 'eulalia', 'chepa', 'flor', 'tino', 'wilber', 'anselmo', 'rigo', 'marielos', 'yendry'];
export const quienesSuben = (g) => ORDEN.filter((k) => GENTE[k].conoce(g.meta || {}));
const conCanelo = (g) => !!(g.meta && g.meta.canelo && g.meta.canelo.adoptado);
// el remate: cada línea sale a su hora (segundos desde que cayó el Rey)
const FRASES = {
  chema: { pre: '¡Alcanzó, alcanzó! Llegó esta mañana, sin remitente. Ya sabe cómo es doña Zenaida.', f4: 'La doña dejó otra línea al pie: «Cuando suene la campana, no se quede mirando.»' },
  eulalia: { pre: 'Mijo, mija, yo le llevo un tres leches, que sin comer no se pelea.', rem: '¿Ya ven? Se podía.' },
  chepa: { pre: 'Coma, coma, que después no hay tiempo.', rem: '¡A comer!' },
  flor: { f3: '¡Aguante, que ya casi!' },
  tino: { f2: '¡Esa espada llega rota, déjeme verla!', rem: 'Y esa espada, mañana me la trae.' },
  wilber: { f1: '¡Esos zopilotes son míos!' },
  anselmo: { f2: 'Yo ya tapé una grieta. Esta me la dejo con gusto.', alba: 'Nunca fui a comprar los cigarros…', rem: 'Voy por los cigarros.' },
  rigo: { pre: '¿Seguro contra Sombras? Cobré por adelantado, mi cepa.' },
  marielos: { f2: 'Le doy 300 colones por este cerro, ¡se ve mucho mejor sin el pájaro!', f3: '¡Aquí firma, aquí firma, que ya le tengo comprador al cerro!', rem: 'Yo siempre dije que la vista era lo mejor.' },
  yendry: { f4: '¡Ahora, ahora!', rem: '¡Tome, es de la casa! Para que nos llame cuando haya que comer.' },
};
const TOQUES_YENDRY = ['¡Ahora, ahora!', '¡Otra vez!', '¡Ya casi, ya casi!', '¡El último!'];

// ---------- armar: los vecinos suben ----------
export function armarGente(g) {
  const R = g.rey;
  if (!R || (g.meta && g.meta.invitado)) return;
  const lista = quienesSuben(g);
  const G = R.gente = { lista: [], hecho: {}, P: {}, wilberT: 0, caneloT: 0, rayosVistos: 0, t: 0 };
  let n = 0;
  for (const k of lista) {
    const fila = 1 + Math.floor(n / 3), lado = (n % 3) - 1, pos = puestoLadera(g, fila, lado);
    n++;
    if (!pos) continue;
    const m = g.entities.spawnMob('vecino', pos.x + 0.5, pos.y + 0.2, pos.z + 0.5);
    if (!m) continue;
    const q = GENTE[k], aqui = { x: pos.x, y: pos.y, z: pos.z };
    Object.assign(m.data, { home: aqui, plaza: { ...aqui }, name: q.nom, role: 'vecino', vid: `rey:${k}`, seed: q.seed, reyGente: k, inmortal: true, provoked: false });
    if (m.kind.dress) m.kind.dress(m);
    m.health = 20;
    G.lista.push({ k, m, pos });
    const P = g.meta.gente && g.meta.gente.p && g.meta.gente.p[k];
    G.P[k] = { nivel: (P && P.nivel) || 1, ayudaT: 0 };
  }
}
const decirK = (g, G, k, texto, seg = 3.8) => { const e = G.lista.find((q) => q.k === k); if (e && e.m && !e.m.dead) decir(g, e.m, texto, seg, true); };
const hay = (G, k) => G.lista.some((q) => q.k === k && q.m && !q.m.dead);
const una = (G, clave, fn) => { if (G.hecho[clave]) return; G.hecho[clave] = true; fn(); };

// ---------- cada cuadro (solo el anfitrión) ----------
export function cuadroGente(g, dt) {
  const R = g.rey;
  if (!R || !R.gente || g.paused || (g.meta && g.meta.invitado)) return;
  const G = R.gente;
  G.t += dt;
  const c = { x: R.cx + 0.5, z: R.cz + 0.5 };
  for (const e of G.lista) { // inmortales y quietos, de cara al centro
    const m = e.m;
    if (!m || m.dead) continue;
    m.health = Math.max(m.health, 20);
    m.yaw = m.targetYaw = Math.atan2(c.x - m.body.pos.x, c.z - m.body.pos.z);
    if (m.body.pos.y < R.fy - 14) { m.body.pos.x = e.pos.x + 0.5; m.body.pos.y = e.pos.y + 0.2; m.body.pos.z = e.pos.z + 0.5; m.body.vel.y = 0; } // jamás se pierde
    if (Math.random() < dt * 5) g.particles.spawn(m.body.pos.x + 0.35, m.body.pos.y + 1.2, m.body.pos.z, [1, 0.8, 0.35], 0, 0.2, 0, 0.5, 0, true); // el farol
  }
  if (R.vencido) { remate(g, R, G, dt); return; }
  const t = R.t, fase = R.fase;
  // preludio
  if (t > 1.5) una(G, 'carta', () => cartaDeZenaida(g, G));
  if (t > 3.5) una(G, 'eulalia', () => { if (!hay(G, 'eulalia')) return; decirK(g, G, 'eulalia', FRASES.eulalia.pre); g.addEffect('aguante', 360); g.ui.toast('🍰 Doña Eulalia le dio un tres leches: aguante por 6 minutos', 3200); });
  if (t > 5.5) una(G, 'chepa', () => { if (!hay(G, 'chepa')) return; decirK(g, G, 'chepa', FRASES.chepa.pre); g.addEffect('fuerza', 360); g.ui.toast('🍲 Niña Chepa le dio de comer: fuerza por 6 minutos', 3200); });
  if (t > 8) una(G, 'rigo', () => { decirK(g, G, 'rigo', FRASES.rigo.pre); if (hay(G, 'rigo') && g.meta.seguro) g.ui.toast('📄 El Seguro del tío Rigo sigue al día: si se cae aquí, no pierde nada', 3600); });
  if (fase === 1 && t > 11) una(G, 'wilber1', () => decirK(g, G, 'wilber', FRASES.wilber.f1));
  if (fase >= 2) una(G, 'f2', () => { decirK(g, G, 'tino', FRASES.tino.f2); setTimeout(() => { if (g.rey === R) decirK(g, G, 'marielos', FRASES.marielos.f2); }, 4200); });
  if (fase >= 2) { G.tapaT = (G.tapaT ?? 14) - dt; if (G.tapaT <= 0 && hay(G, 'anselmo')) una(G, 'tapa', () => { decirK(g, G, 'anselmo', FRASES.anselmo.f2); if (taparBorde(g)) g.ui.toast('🚬 Don Anselmo tapó una grieta del borde con basalto', 3000); }); }
  if (fase >= 3) una(G, 'f3', () => { decirK(g, G, 'flor', FRASES.flor.f3); setTimeout(() => { if (g.rey === R) decirK(g, G, 'marielos', FRASES.marielos.f3); }, 5000); });
  if (fase >= 4) una(G, 'f4', () => { decirK(g, G, 'chema', FRASES.chema.f4); cartaDeZenaida(g, G, true); });
  // lo que hacen
  G.seg = (G.seg || 0) + dt;
  if (G.seg >= 1) { G.seg = 0; porSegundo(g, R, G); }
  tickWilberYCanelo(g, R, G, dt);
}
function cartaDeZenaida(g, G, corta = false) {
  if (!hay(G, 'chema') || corta) return;
  entregarCartaRey(g); // queda en el cuaderno de cartas (si ya estaba, no se repite)
  decirK(g, G, 'chema', FRASES.chema.pre, 4.5);
  g.ui.dialog('Carta de Zenaida (la trae Don Chema)', 'Mi güila: si ya llegó arriba es porque ya no le quedan Sombras por aprenderse. Lo que viene no se vence a golpes: se vence con la mesa llena.', 4000);
  if (g.meta.corazon) { g.player.health = g.player.maxHealth; g.particles.burst(g.player.body.pos.x, g.player.body.pos.y + 1, g.player.body.pos.z, [[1, 0.4, 0.4], [1, 0.8, 0.6]], 18, 2); g.ui.toast('❤ El Corazón de Tiquicia brilla en la repisa: se siente entero', 3000); }
}
// Flor, Chepa (F3: otro plato si tiene hambre), Tino (arregla el arma una vez) cada segundo
function porSegundo(g, R, G) {
  for (const e of G.lista) {
    if (!e.m || e.m.dead) continue;
    if (e.k === 'flor' || e.k === 'chepa') { const P = G.P[e.k]; if (e.k === 'chepa' && R.fase < 3) continue; ayudaEnPelea(g, e.k, e.m, P); }
  }
  if (hay(G, 'tino') && !G.tinoArreglo) {
    const s = g.inventory.held, d = s && g.heldDef();
    if (s && d && d.durability && (s.dur ?? d.durability) < d.durability * 0.2) {
      G.tinoArreglo = true; s.dur = d.durability; g.inventory.changed();
      g.audio.play('yunque', { ui: true, vol: 0.6 });
      g.ui.toast('🔨 Ñor Tino le arregló el arma desde la ladera', 3000);
      decirK(g, G, 'tino', '¡Se la dejé como nueva!');
    }
  }
}
function tickWilberYCanelo(g, R, G, dt) {
  const escoltas = g.entities.mobs.filter((m) => !m.dead && !m.dying && m.data && m.data.escolta);
  // Mae Wilber derriba a los zopilotes de la escolta: una flecha de 5 cada 2 s
  G.wilberT -= dt;
  const w = G.lista.find((q) => q.k === 'wilber');
  if (w && w.m && !w.m.dead && G.wilberT <= 0 && escoltas.length) {
    const b = w.m.body.pos, o = escoltas.reduce((a, q) => (Math.hypot(q.body.pos.x - b.x, q.body.pos.z - b.z) < Math.hypot(a.body.pos.x - b.x, a.body.pos.z - b.z) ? q : a));
    if (Math.hypot(o.body.pos.x - b.x, o.body.pos.z - b.z) < 34) {
      G.wilberT = 2;
      for (let k = 1; k <= 8; k++) g.particles.spawn(b.x + (o.body.pos.x - b.x) * k / 9, b.y + 1.4 + (o.body.pos.y - b.y) * k / 9, b.z + (o.body.pos.z - b.z) * k / 9, [0.9, 0.85, 0.7], 0, 0, 0, 0.3, 0, true);
      o.hurt(5, b.x, b.z); if (o.dying) g.killedMob(o);
      g.audio.play('arco', { pos: w.m.soundPos(), vol: 0.5 });
    }
  }
  // El Canelo (si es de la casa y anda con uno): muerde a los zopilotes chicos y avisa de los rayos con un ladrido
  const perro = conCanelo(g) ? g.entities.mobs.find((m) => !m.dead && m.type === 'perro' && m.data && m.data.canelo) : null;
  if (perro) {
    const p = perro.body.pos;
    G.caneloT -= dt;
    const nuevos = (g.rayosRey || []).length;
    if (nuevos > G.rayosVistos && g.rayosRey.some((r) => r.t > 0.9)) { g.audio.play('perro', { pos: perro.soundPos(), vol: 0.9, pitch: 1.2 }); if (!calmaActiva(g)) decir(g, perro, '¡Guau, guau!', 1.6); }
    G.rayosVistos = nuevos;
    if (G.caneloT <= 0 && escoltas.length) {
      const o = escoltas.find((q) => Math.hypot(q.body.pos.x - p.x, q.body.pos.z - p.z) < 9);
      if (o) { G.caneloT = 3; o.hurt(3, p.x, p.z); if (o.dying) g.killedMob(o); g.audio.play('perro', { pos: perro.soundPos(), vol: 0.7, pitch: 1.4 }); }
    }
  }
}
// cada toque del coro de la fase 4 (lo llama final.js): Yendry toca el cencerro y grita
export function yendryToque(g, n) {
  const R = g.rey;
  if (!R || !R.gente) return;
  decirK(g, R.gente, 'yendry', TOQUES_YENDRY[Math.max(0, Math.min(3, n - 1))], 2.2);
}

// ---------- el remate: golpe final, alba, premios ----------
function remate(g, R, G, dt) {
  if (G.primera === undefined) G.primera = !(g.meta.reyPremio && g.meta.reyPremio.hecho);
  const t = R.remT = (R.remT || 0) + dt, primera = G.primera;
  // el alba: el reloj sube hasta la mañana (con «Movimiento tranquilo» también: es luz, no sacudida)
  if (t > 2 && !G.alba) { G.alba = true; G.t0 = g.time || 0; }
  if (G.alba && !G.albaFin) {
    const falta = ((g.time || 0) > 0.5 ? 1 - g.time + 0.06 : Math.max(0, 0.06 - g.time)), paso = Math.max(0.02, falta / 6) * dt;
    if (falta > 0.005) g.time = (g.time || 0) + paso; else G.albaFin = true;
    if (t > 12) G.albaFin = true;
  }
  // los faroles se encienden de uno en uno
  G.farolI = G.farolI ?? 0;
  if (t > 3 && G.farolI < R.faroles.length && t > 3 + G.farolI * 0.7) {
    const f = R.faroles[G.farolI++];
    g.particles.burst(f.x + 0.5, f.y + 0.6, f.z + 0.5, [[1, 0.85, 0.4], [1, 0.6, 0.2]], 16, 2);
    g.audio.play('campana', { pos: { x: f.x, y: f.y, z: f.z }, vol: 0.35, pitch: 1.4 + G.farolI * 0.05 });
  }
  if (t > 6) una(G, 'anselmo-alba', () => decirK(g, G, 'anselmo', FRASES.anselmo.alba, 4));
  if (!primera) { una(G, 'otra', () => g.ui.toast('🌄 Otra vez amaneció en la cumbre. La campana ya la tiene', 3600)); return; }
  // el remate hablado: 6–8 s, uno detrás de otro (cada globo dura 3 s)
  const L = [['chepa', 9], ['tino', 11.2], ['eulalia', 13.4], ['marielos', 15.6], ['anselmo', 17.8]];
  for (const [k, h] of L) if (t > h) una(G, `rem-${k}`, () => decirK(g, G, k, FRASES[k].rem, 3.4));
  if (t > 20.5) una(G, 'premios', () => premiar(g, R, G));
}
// una sola vez por persona (host: meta.reyPremio.host; invitados: por userId). Yendry entrega la campana; lo demás, por la trama
function premiar(g, R, G) {
  const M = g.meta, P = (M.reyPremio ||= { hecho: false });
  const gente = G.lista.length > 0;
  const lote = (esAnselmo) => {
    const l = [[CAMPANA, 1]];
    if (gente) l.push([FOTO, 1]);
    if (esAnselmo) l.push([CIGARROS, 1]);
    return l;
  };
  const anselmo = hay(G, 'anselmo');
  if (!P.host) {
    P.host = true;
    decirK(g, G, 'yendry', FRASES.yendry.rem, 4.5);
    for (const [id, n] of lote(anselmo && g.inventory.count(CIGARROS) === 0)) g.giveItem(id, n);
    g.ui.toast('🔔 Yendry le entregó la Campana de la casa' + (gente ? ' y le dejaron la Foto de la cumbre' : '') + (anselmo ? ' · Don Anselmo le soltó un cigarro de los de 1962' : ''), 5200, 'importante');
    anotar(g, 'Amaneció en la cumbre. Yendry me dio la campana de la casa.', '🔔');
  }
  if (g.red && g.red.dentro) {
    for (const j of g.red.dentro()) { // cada persona que está en la sala, una vez
      if (!j.userId || P[j.userId]) continue;
      P[j.userId] = true;
      if (g.red.botin) g.red.botin(j.pid, lote(false));
    }
  }
  P.hecho = true;
}

// ---------- la Campana de la casa: clic derecho en el patio ----------
export function usarCampana(g) {
  const M = g.meta, H = M && M.hist;
  if (g.mode !== 'survival' || !M) return false;
  const p = g.player.body.pos;
  if (!H || !H.casa || Math.hypot(H.casa.x + 4.5 - p.x, H.casa.z + 3.5 - p.z) > 22) { g.ui.toast('🔔 La campana se toca en el patio de la casa: ahí la oye la gente', 2800); return true; }
  g.audio.play('campana', { ui: true, vol: 1, pitch: 0.85 });
  g.audio.play('campana', { ui: true, vol: 0.6, pitch: 1.3 });
  const hoy = g.day || 1;
  if (M.campanaDia === hoy) { g.ui.toast('🔔 Ya llamó a la mesa hoy. Que se enfríe un poco la olla', 2600); return true; }
  M.campanaDia = hoy;
  g.player.health = Math.min(g.player.maxHealth, g.player.health + 6);
  g.player.food = Math.min(20, (g.player.food || 0) + 4);
  const v = g.nearestVillage ? g.nearestVillage(p.x, p.z, 8) : null;
  if (v && v.v) { const rp = (M.repPueblo ||= {}); rp[v.v.id] = (rp[v.v.id] || 0) + 1; }
  g.particles.burst(p.x, p.y + 1.5, p.z, [[1, 0.85, 0.4], [1, 1, 0.8]], 20, 3);
  g.ui.toast('🔔 ¡A la mesa! Cura 6, la comida sube un poco y la gente del pueblo lo nota', 3600);
  return true;
}

// ---------- los créditos con nombres reales ----------
const CIERRE = {
  chema: 'Trajo la última carta', eulalia: 'Hizo el tres leches', chepa: 'No dejó la olla vacía', flor: 'Hizo florear la mata', tino: 'Hizo sonar el yunque',
  wilber: 'Cuidó el cerro de los zopilotes', anselmo: 'Se quedó con las ganas de los cigarros', rigo: 'Cobró la póliza a favor de la casa', marielos: 'Vendió hasta lo que no era suyo', yendry: 'Tocó la campana',
};
export function rolloCreditos(g) {
  const M = g.meta || {}, dia = g.day || 1, jefes = Object.keys(M.premioJefe || {}).length;
  const L = [['NanoBlocks', 'Tiquicia, de bloque en bloque'], ['El Rey Zopilote cayó', 'Las cumbres vuelven a ser de los que suben a verlas']];
  const sub = quienesSuben(g);
  if (sub.length) L.push(['Subieron con faroles', sub.map((k) => `${GENTE[k].i} ${GENTE[k].nom}`).join(' · ')]);
  for (const k of sub) L.push([`${GENTE[k].i} ${GENTE[k].nom}`, (PERSONAS[k] && PERSONAS[k].frases[0]) || CIERRE[k]]);
  if (conCanelo(g)) L.push(['🐕 El Canelo', 'Ladró antes de cada rayo, sin que nadie se lo pidiera']);
  L.push(['Su partida', `${dia} ${dia === 1 ? 'día' : 'días'} · ${M.muertes || 0} ${(M.muertes || 0) === 1 ? 'caída' : 'caídas'} · ${jefes} ${jefes === 1 ? 'jefe vencido' : 'jefes vencidos'}`]);
  L.push(['Su trofeo', 'La Cabeza del Rey Zopilote: cuélguela en la casa, donde se vea']);
  L.push(['Un juego de', 'nanoyackson']);
  L.push(['Con sonidos de', 'Freesound (CC0), Kenney y la gente que los grabó']);
  L.push(['Íconos', 'con ayuda de GPT']);
  L.push(['Letra', 'Inter, de Rasmus Andersson (SIL Open Font License)']);
  L.push(['Y usted', 'que llegó hasta aquí']);
  L.push(['Esto no se acaba', 'El mundo sigue: siembre, construya, pasee, vuele. Pura vida']);
  return L;
}
