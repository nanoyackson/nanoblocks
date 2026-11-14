// El expediente (sátira ficticia): desde el día 20, el Lic. Porras avisa que la «Ruta del Progreso» de la Municipalidad de Tiquicia pasa por encima
// de la casa, para el 2049. Hay que juntar ocho firmas, encontrar la escritura que Zenaida enterró en el patio y presentarse a una audiencia en
// la plaza. Ahí se resuelve de tres maneras: con la escritura, con plata o invitándolo a comer, que era como Zenaida resolvía todo. Nada de
// esto castiga: lo peor que pasa es un peajero en el corredor. Estado: meta.expediente.
import { VALOR } from './plata.js';
import { BLOCK_BY_KEY as K, BLOCKS, SOLID, ITEMS, AIR, esPescado } from './blocks.js';
import { decir } from './misiones.js';
import { anotar } from './diario.js';

export const HOJA = 511, ESCRITURA = 512;
const PERMISO = 490, COLON = 360, FIRMAS = 8, MORDIDA = 100, ANCHO = 9, FONDO = 7, NOM = 'Lic. Porras';
const CRUDO = { has: (id) => id === 262 || esPescado(id) }; // v12.7.0: la carne y todos los pescados crudos (blocks.js)
const AL_FIRMAR = [
  'Firmo, pero ¿esto es para lo de la fiesta?',
  'Con mucho gusto. Zenaida me curó una tos en el 74.',
  '¿Otra carretera? La de aquí tiene más huecos que queso. Déme.',
  'Firmo sin leer, como se hace con todo.',
  '¿Es contra la Municipalidad? Déme dos hojas.',
  'Ahí le pongo la firma de mi compadre también. No, mejor no.',
  'Esa casa estaba antes que la Municipalidad. Y que yo. Y que el cura.',
  'Mi firma vale, ¿verdad? Porque en el banco dicen que no.',
];
const PUBLICO = [
  '¡Primero tapen los huecos de la que ya hay!',
  '¿Y la parada del bus? ¡Hace once años que está en estudio!',
  'Esa señora le dio de comer a medio pueblo. ¡Respeten!',
  '¿Cuatro carriles para dónde? ¡Si aquí pasan tres carros!',
  'Yo firmé sin leer. ¿Qué fue lo que firmé?',
  '¡2049! Ni mi nieto va a ver esa carretera.',
];
const LINEAS_PEAJE = ['Es un colón. …Es broma. Por ahora.', 'Yo solo trabajo aquí. Por aquí no pasa nadie, pero yo trabajo aquí.', 'Peaje provisional. Provisional desde hoy hasta que se muera alguien.', '¿Que es su casa? Sí, está en la lista de lo que hay que quitar.'];
const dF = (E) => Object.keys(E.firmas || {}).length;
const exp = (g) => (g.meta.expediente ||= { fase: 0, firmas: {} });

// ---------- empieza: lo llama el inspector ----------
export function expedienteInspector(g) {
  const E = exp(g), H = g.meta.hist, dia = g.day || 1;
  if (reponerHoja(g, E)) { g.ui.dialog(NOM, '¿Se le perdió la hoja? Eso es una falta. Tome otra. Las firmas ya constan en autos, y son lo único que consta.', 6000); return true; }
  if (E.fase !== 0 || dia < 20 || !H.hogar) return false;
  E.fase = 1; E.dia = dia;
  g.giveItem(HOJA, 1);
  esconderEscritura(g, E, H);
  g.ui.dialog(NOM, 'Le informo que cambió el reglamento, el jueves. Por aquí pasa la Ruta del Progreso: cuatro carriles, entrega en el 2049. La casa estorba. Tiene derecho a una audiencia si junta ocho firmas de vecinos y prueba que esto es suyo. Tome la hoja. Mientras tanto, le dejo a un compañero en el corredor.', 12000);
  anotar(g, 'La Municipalidad quiere pasarle una carretera a la casa, para el 2049.', '📋');
  g.achieve('expediente', 'Mi expediente está en estudio');
  return true;
}
function esconderEscritura(g, E, H) {
  const w = g.world;
  for (let i = 0; i < 40; i++) {
    const a = Math.random() * Math.PI * 2, r = 12 + Math.random() * 6;
    const x = Math.floor(H.casa.x + ANCHO / 2 + Math.cos(a) * r), z = Math.floor(H.casa.z + FONDO / 2 + Math.sin(a) * r);
    if (!w.isLoaded(x, z)) continue;
    const y = w.gen.column(x, z).h;
    // el suelo natural, sin nada encima: ni bajo un árbol ni en una pared de uno
    if (!SOLID[w.getBlock(x, y, z)] || BLOCKS[w.getBlock(x, y, z)].leafy || !SOLID[w.getBlock(x, y - 2, z)] || w.getBlock(x, y + 1, z) !== AIR || w.getBlock(x, y + 2, z) !== AIR) continue;
    w.setBlock(x, y - 2, z, K.chest);
    g.stations.placed(K.chest, x, y - 2, z, 0);
    const be = w.getBE(x, y - 2, z);
    if (!be || !be.slots) continue;
    be.slots[0] = { id: ESCRITURA, count: 1 };
    be.slots[1] = { id: COLON, count: 20 };
    w.touchBE(x, y - 2, z);
    w.setBlock(x, y + 1, z, K.placa);
    w.setBE(x, y + 1, z, { title: 'Marca vieja', text: 'Una tabla clavada, con una letra Z. Abajo suena hueco.' });
    E.pos = { x, y, z };
    return;
  }
}
// otra hoja: el formulario es lo único que no se acaba
function reponerHoja(g, E) {
  if (E.fase !== 1 || g.inventory.count(HOJA) || dF(E) >= FIRMAS) return false;
  g.giveItem(HOJA, 1);
  return true;
}
// lo que dice Doña Eulalia
export function expedienteEulalia(g) {
  const E = g.meta.expediente;
  if (E && reponerHoja(g, E)) { g.ui.dialog('Doña Eulalia', '¿Perdió la hoja? Tome, que Porras dejó un montón. Las firmas ya están apuntadas en la Municipalidad, porque eso sí lo apuntan.', 6000); return true; }
  if (!E || E.fase !== 1 || E.pista || g.inventory.count(ESCRITURA)) return false;
  E.pista = true;
  g.ui.dialog('Doña Eulalia', '¿La escritura? Zenaida no confiaba en los bancos ni en el catastro, mi amor. La enterró en el patio, a dos cuartas, y le clavó una tabla encima. Se la marqué en la brújula. Y déme esa hoja, que también le firmo.', 8000);
  return true;
}
export const marcaExpediente = (g) => {
  const E = g.meta && g.meta.expediente;
  if (!E) return { hoja: null, plaza: null };
  return { hoja: E.fase === 1 && (E.pista || (g.day || 1) - E.dia >= 3) && !E.esc ? E.pos : null, plaza: E.fase === 2 ? E.plaza : null };
};

// ---------- las firmas ----------
export function firmaInteract(m, g) {
  const held = g.inventory.held, E = g.meta.expediente;
  if (!held || held.id !== HOJA || !E || E.fase < 1 || m.data.audiencia) return false;
  const vid = m.data.vid;
  if (!vid || m.data.peaje || m.data.inspector) { decir(g, m, 'Yo no firmo nada. Trabajo aquí.', 2.4); return true; }
  if (E.firmas[vid]) { decir(g, m, 'Yo ya firmé. Una vez no más, que después salen cobrando.', 2.8); return true; }
  if (dF(E) >= FIRMAS) { decir(g, m, 'Ya no hay campo en la hoja, ¿verdad?', 2.4); return true; }
  E.firmas[vid] = g.day || 1;
  decir(g, m, AL_FIRMAR[Math.floor(Math.random() * AL_FIRMAR.length)], 3.2);
  g.audio.play('craft', { ui: true, vol: 0.2 });
  const n = dF(E);
  g.ui.toast(n >= FIRMAS ? '📋 ¡Ocho firmas! La hoja está llena' : `📋 Firmas: ${n} de ${FIRMAS}`, 1800);
  return true;
}

// ---------- cada segundo ----------
export function tickExpediente(g) {
  const E = g.meta && g.meta.expediente;
  if (!E || !E.fase || E.fase >= 4 || g.mode !== 'survival' || g.dim !== 'tierra') return;
  const H = g.meta.hist, dia = g.day || 1, t = g.time || 0, p = g.player.body.pos;
  tickPeaje(g, E, H);
  if (E.fase === 1) {
    if (!E.pos && H.casa && Math.hypot(H.casa.x - p.x, H.casa.z - p.z) < 40) esconderEscritura(g, E, H); // el patio no estaba cargado cuando se pidió
    if (!E.esc && g.inventory.count(ESCRITURA)) { E.esc = true; g.ui.toast('📜 La escritura de la casa, de 1931. Tiene más sellos que la Municipalidad', 3600); anotar(g, 'Encontré la escritura que la abuela enterró en el patio.', '📜'); }
    if (!E.pista && dia - E.dia >= 3 && !E.avisoMarca) { E.avisoMarca = true; g.ui.toast('🧭 Dicen que Zenaida enterraba las cosas en el patio. La aguja apunta para allá', 3400); }
    if (E.esc && dF(E) >= FIRMAS) {
      E.fase = 2; E.audiencia = dia + 1;
      const c = H.pueblo || p, v = (g.nearestVillage(c.x, c.z, 8) || {}).v;
      E.plaza = v ? { x: v.x, y: v.y, z: v.z } : { x: H.casa.x + 40, y: H.casa.y, z: H.casa.z };
      E.pueblo = v && v.name ? `la plaza de ${v.name}` : 'la plaza del pueblo';
      g.ui.toast(`📋 Audiencia pública: mañana en ${E.pueblo}, en horas de oficina. La brújula la marca`, 5000);
    }
    return;
  }
  if (E.fase !== 2 || dia < E.audiencia || t < 0.04 || t > 0.42 || Math.hypot(E.plaza.x - p.x, E.plaza.z - p.z) > 26) { limpiarAudiencia(g); return; }
  audiencia(g, E);
}
function limpiarAudiencia(g) {
  for (const m of g.entities.mobs) if (!m.dead && m.data && m.data.audiencia && !m.data.irse) m.data.irse = 2;
}
function ponerEn(g, x, z, y0, datos) {
  const w = g.world;
  let y = y0 + 8;
  while (y > y0 - 12 && !(SOLID[w.getBlock(x, y - 1, z)] && !SOLID[w.getBlock(x, y, z)])) y--;
  const m = g.entities.spawnMob('vecino', x + 0.5, y + 0.2, z + 0.5);
  if (!m) return null;
  const here = { x, y, z };
  Object.assign(m.data, { home: here, plaza: { ...here }, role: 'vecino' }, datos);
  if (m.kind.dress) m.kind.dress(m);
  return m;
}
function tickPeaje(g, E, H) {
  if (!H.casa || !g.world.isLoaded(H.casa.x, H.casa.z)) return;
  const p = g.player.body.pos, lejos = Math.hypot(H.casa.x + ANCHO / 2 - p.x, H.casa.z + FONDO / 2 - p.z) > 40;
  let m = g.entities.mobs.find((q) => !q.dead && q.data && q.data.peaje);
  if (!m) {
    if (lejos) return;
    m = ponerEn(g, H.casa.x + 5, H.casa.z - 4, H.casa.y, { name: 'Peajero provisional', vid: 'hist:peaje', seed: 19336, peaje: true });
    return;
  }
  if (Math.hypot(m.body.pos.x - p.x, m.body.pos.z - p.z) < 10) {
    m.data.charla = (m.data.charla ?? 3) - 1;
    if (m.data.charla <= 0) { m.data.charla = 45 + Math.random() * 45; decir(g, m, LINEAS_PEAJE[Math.floor(Math.random() * LINEAS_PEAJE.length)], 3.4); }
  }
}
function audiencia(g, E) {
  let P = g.entities.mobs.find((q) => !q.dead && q.data && q.data.audiencia);
  if (!P) {
    P = ponerEn(g, Math.floor(E.plaza.x) + 2, Math.floor(E.plaza.z) - 2, E.plaza.y ?? g.player.body.pos.y, { name: NOM, vid: 'hist:audiencia', seed: 19335, audiencia: true });
    if (!P) return;
    if (!E.empezo) {
      E.empezo = true;
      g.ui.regionBanner('Audiencia pública', 'Ruta del Progreso · Expediente 2049-B · Hable con el Lic. Porras');
      g.audio.play('campana', { vol: 0.5 });
    }
  }
  // la gente opina
  E.t = (E.t ?? 2) - 1;
  if (E.t > 0) return;
  E.t = 7 + Math.random() * 5;
  const vec = g.entities.mobs.filter((q) => !q.dead && q.data && q.data.vid && !q.data.audiencia && q.kind === P.kind && Math.hypot(q.body.pos.x - P.body.pos.x, q.body.pos.z - P.body.pos.z) < 26);
  if (vec.length) decir(g, vec[Math.floor(Math.random() * vec.length)], PUBLICO[Math.floor(Math.random() * PUBLICO.length)], 3.6);
}

// ---------- se resuelve ----------
export function audienciaInteract(m, g) {
  if (m.data.peaje) {
    const Ex = g.meta.expediente;
    if (Ex && reponerHoja(g, Ex)) g.ui.dialog('Peajero provisional', '¿La hoja? Tenga otra, aquí hay de sobra. Las firmas ya quedaron apuntadas. Eso es lo único que funciona.', 5500);
    else decir(g, m, LINEAS_PEAJE[Math.floor(Math.random() * LINEAS_PEAJE.length)], 3.4);
    return true;
  }
  if (!m.data.audiencia) return false;
  const E = g.meta.expediente, held = g.inventory.held, def = held && ITEMS[held.id], diga = (t, ms = 7000) => g.ui.dialog(NOM, t, ms);
  if (!E || E.fase !== 2) { diga('Se levanta la sesión. Vaya con Dios y con su recibo.', 3000); return true; }
  if (held && held.id === ESCRITURA) { cerrar(g, E, 'escritura'); return true; }
  if (def && def.food && def.food >= 5 && !CRUDO.has(held.id) && !def.guaro && !def.trip) { g.inventory.consumeHeld(1); cerrar(g, E, 'almuerzo'); return true; }
  if ((held && VALOR[held.id]) || (!held && g.player && g.player.sneaking)) { // el sobrecito: una pieza en la mano o, agachado, de la billetera
    if (g.inventory.count(COLON) < MORDIDA) { diga('Con eso no alcanza ni para el café del consejo. Se oye mal, ¿verdad? No oyó nada.', 4500); return true; }
    g.inventory.remove(COLON, MORDIDA); cerrar(g, E, 'mordida'); return true;
  }
  diga(`Se abre la sesión. Ocho firmas, sí. Ahora enséñeme la escritura, en la mano. O, no sé, otros traen su sobrecito: ${MORDIDA} colones, en la mano o agachadito, que nadie vea. Y apúrese, que son treinta años sin almorzar a la hora y con el hambre que tengo no leo bien.`, 11000);
  return true;
}
function cerrar(g, E, como) {
  E.fase = 4; E.como = como;
  const I = (g.meta.inspector ||= {}), H = g.meta.hist;
  I.legal = I.legal || como;
  for (const m of g.entities.mobs) if (!m.dead && m.data && m.data.peaje) m.data.irse = 2;
  const P = g.entities.mobs.find((q) => !q.dead && q.data && q.data.audiencia);
  if (P) P.data.irse = 9;
  g.inventory.remove(HOJA, 9);
  if (como === 'escritura') {
    g.giveItem(COLON, 150);
    g.audio.play('aplausos', { ui: true, vol: 0.6 });
    g.ui.dialog(NOM, '…1931. Con sello de la Junta y todo. Esto es anterior a la Municipalidad. Técnicamente, la Municipalidad está en el patio de usted. Se archiva el proyecto. Le devuelvo lo de los timbres.', 9000);
    g.ui.regionBanner('La casa se queda', 'La Ruta del Progreso va a dar la vuelta. En el 2049');
    anotar(g, 'Enseñé la escritura en la audiencia. La casa se queda.', '📜');
    g.achieve('expediente_escritura', 'Técnicamente, la Municipalidad está en mi patio');
  } else if (como === 'mordida') {
    g.meta.reputation = (g.meta.reputation || 0) - 2;
    g.audio.play('caja', { ui: true, vol: 0.5 });
    g.ui.dialog(NOM, 'No vi nada. Aquí tiene su recibo: dice «donación para el café». Se archiva. Y mire que la gente también vio, ¿eh? Yo no, pero la gente sí.', 8000);
    g.ui.regionBanner('La casa se queda', 'Pero en el pueblo ya se habla de eso');
    anotar(g, 'Le pagué a Porras en plena plaza. La casa se queda, y a mí ya no me saludan igual.', '📋');
    g.achieve('expediente_mordida', 'Una donación para el café');
  } else {
    if (!g.inventory.count(PERMISO)) g.giveItem(PERMISO, 1);
    g.giveItem(COLON, 60);
    H.porrasAmigo = true;
    g.audio.play('aplausos', { ui: true, vol: 0.7 });
    g.ui.dialog(NOM, '…¿Es para mí? Treinta años en esa ventanilla, y nadie… Disculpe. Se me metió algo en el ojo. Se me traspapeló el expediente. Qué lástima. Tome, esto lo guardaba para una emergencia: un Permiso de Todo. No le diga a nadie. ¿Los domingos se come en esa casa?', 12000);
    g.ui.regionBanner('La casa se queda', 'Nadie gana una audiencia así. Solo Zenaida');
    anotar(g, 'Le di de comer al Lic. Porras en plena audiencia, y se le traspapeló el expediente.', '🍲');
    g.achieve('expediente_almuerzo', 'Así se cuida a la gente: con excusas');
  }
  g.addXP(60);
}
// ---------- /prueba expediente ----------
export function pruebaExpediente(g) {
  const E = exp(g), H = g.meta.hist;
  H.hogar = true;
  E.fase = 0; g.day = Math.max(g.day || 1, 20);
  expedienteInspector(g);
  return `Hoja y escritura listas: ${E.pos ? `a ${Math.round(Math.hypot(E.pos.x - g.player.body.pos.x, E.pos.z - g.player.body.pos.z))} bloques` : 'falta cargar el patio'}`;
}
export const textoExpediente = (g) => {
  const E = g.meta && g.meta.expediente;
  if (!E || !E.fase || E.fase >= 4) return null;
  if (E.fase === 1) return `📋 La Ruta del Progreso: ${dF(E)} de ${FIRMAS} firmas (la hoja en la mano, clic derecho a un vecino)${E.esc ? '. Ya tiene la escritura' : '. Falta la escritura: pregúntele a Doña Eulalia'}`;
  return `📋 La Ruta del Progreso: audiencia en ${E.pueblo}, de día, desde el día ${E.audiencia}`;
};
