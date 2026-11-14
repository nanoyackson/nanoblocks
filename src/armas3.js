// Armas con maña (v4.97): cada arma pega a su manera. Antes todas eran «un número de daño y un tiempo de espera»; ahora cada clase
// tiene su tipo de daño (corte, contundente o punta), su cadena de golpes, su alcance, su empuje, cuánto aturde y cuánto aguante
// gasta. Sin aguante no se puede pegar (se queda uno sin aire), cada criatura es débil o resistente a un tipo de daño, a la que
// se le llena el aturdimiento queda tambaleando, el golpe se siente (el mundo se frena un instante al pegar) y por la espalda se
// pega más. Además: el mazo pega en área, el hacha rompe escudos, la lanza llega más lejos y su golpe fuerte atraviesa, y con
// cualquier arma se puede cubrir (peor que con escudo).
// Lo usan game.js (attack, heavyAttack, updateTarget, el bloqueo), combate.js (strike, onPlayerHit) y entities.js (hurt).

// ---------- las clases ----------
// cd: segundos entre golpes · cost: aguante por golpe · combo: multiplicador de cada golpe de la cadena · alcance: bloques
// empuje: cuánto tira para atrás · aturde: cuánto llena la barra de aturdimiento · bloqueo: lo que ataja al cubrirse sin escudo
import { isBlockId } from './blocks.js';
import { consejoUnaVez } from './supervivencia.js';
export const CLASES = {
  puno: { nombre: 'Puño', tipo: 'contundente', cd: 0.38, cost: 3, combo: [1, 1, 1.25], alcance: 3.2, empuje: 0.55, aturde: 1.3, bloqueo: 0 },
  cuchillo: { nombre: 'Cuchillo', tipo: 'punta', cd: 0.3, cost: 4, combo: [1, 1, 1.2], alcance: 2.8, empuje: 0.4, aturde: 0.5, bloqueo: 0.2, espalda: 3 },
  machete: { nombre: 'Machete', tipo: 'corte', cd: 0.4, cost: 6, combo: [1, 1, 1.4], alcance: 3.1, empuje: 0.8, aturde: 0.8, bloqueo: 0.3 },
  espada: { nombre: 'Espada', tipo: 'corte', cd: 0.5, cost: 8, combo: [1, 1.1, 1.7], alcance: 3.4, empuje: 1, aturde: 1, bloqueo: 0.45 },
  hacha: { nombre: 'Hacha', tipo: 'corte', cd: 0.78, cost: 12, combo: [1, 1.45], alcance: 3.2, empuje: 1.35, aturde: 1.5, bloqueo: 0.35, rompe: true },
  garrote: { nombre: 'Garrote', tipo: 'contundente', cd: 0.72, cost: 10, combo: [1, 1.2, 1.6], alcance: 3.1, empuje: 1.5, aturde: 2.1, bloqueo: 0.35, area: true },
  mazo: { nombre: 'Mazo', tipo: 'contundente', cd: 1.0, cost: 15, combo: [1, 1.25, 1.9], alcance: 3.1, empuje: 1.9, aturde: 2.7, bloqueo: 0.5, area: true, rompe: true },
  lanza: { nombre: 'Lanza', tipo: 'punta', cd: 0.62, cost: 8, combo: [1, 1, 1.35], alcance: 4.6, empuje: 0.9, aturde: 0.9, bloqueo: 0.3, atraviesa: true },
  pico: { nombre: 'Pico', tipo: 'punta', cd: 0.8, cost: 10, combo: [1, 1.15], alcance: 3.3, empuje: 0.9, aturde: 1, bloqueo: 0 },
  herramienta: { nombre: 'Herramienta', tipo: 'contundente', cd: 0.6, cost: 7, combo: [1, 1], alcance: 3.3, empuje: 0.7, aturde: 0.8, bloqueo: 0 }, // con el pico y las herramientas el clic derecho es para trabajar
};
export function claseDe(def) {
  if (!def || isBlockId(def.id)) return 'puno'; // un bloque en la mano pega como la mano, aunque su ficha diga con qué se pica
  if (def.clase && CLASES[def.clase]) return def.clase;
  if (def.key === 'mazo' || def.key === 'sello_goma') return 'mazo';
  if (def.key === 'garrote') return 'garrote';
  if (def.thrust) return 'lanza';
  if (def.machete) return 'machete';
  if (def.tool === 'sword') return 'espada';
  if (def.tool === 'axe') return 'hacha';
  if (def.tool === 'pickaxe') return 'pico';
  if (def.tool) return 'herramienta';
  if (def.damage) return 'garrote';
  return 'puno';
}
export const perfil = (def) => CLASES[claseDe(def)];

// ---------- debilidades ----------
const AFIN = {
  // los de caparazón: lo contundente los quiebra, el filo resbala
  caparazon: { contundente: 1.6, corte: 0.6, punta: 0.85 },
  // las Sombras son tela y humo: el filo las rasga, la punta pasa sin agarrar casi nada
  sombra: { corte: 1.2, contundente: 0.9, punta: 0.75 },
  // la del escudo y las armaduras: lo contundente les hace sentir el golpe a través
  blindado: { contundente: 1.4, corte: 0.8, punta: 0.9 },
  // espantos y ánimas: casi nada les entra
  espanto: { corte: 0.7, contundente: 0.6, punta: 0.6 },
  // los de cuero y músculo: la punta entra hondo
  cuero: { punta: 1.35, corte: 1, contundente: 0.85 },
  // los de escama: la punta entre las escamas; el filo rebota
  reptil: { punta: 1.3, corte: 0.75, contundente: 1.1 },
  // los de piedra, ceniza o hueso: solo lo contundente los quiebra
  piedra: { contundente: 1.5, corte: 0.65, punta: 0.6 },
  // los que vuelan: livianos, la punta los ensarta
  volador: { punta: 1.4, corte: 1.1, contundente: 0.8 },
  // la gente (Chatas, la bruja): el filo
  gente: { corte: 1.15, contundente: 1, punta: 1 },
};
const GRUPO = {
  sombra: 'sombra', sombra_hondera: 'sombra', sombra_ladrona: 'sombra', sombra_apagadora: 'sombra', sombra_brincona: 'sombra', sombra_acechadora: 'sombra', sombra_grande: 'sombra', sombra_madre: 'sombra', sombra_capitana: 'blindado', sombra_escudo: 'blindado', el_olvido: 'sombra', jefa_ventanilla: 'blindado',
  alacran: 'caparazon', tarantula: 'caparazon', hormiga_bala: 'caparazon', escarabajo: 'caparazon', cangrejo: 'caparazon', armadillo: 'caparazon',
  alma_en_pena: 'espanto', anima_marinera: 'espanto', capitan_goleta: 'espanto', llorona: 'espanto', tulevieja: 'espanto', segua: 'espanto', carreta_sin_bueyes: 'espanto', duende: 'espanto',
  saino: 'cuero', cuche_monte: 'cuero', toro_guaco: 'cuero', puma: 'cuero', jaguar_viejo: 'cuero', chupacabras: 'cuero', cadejos: 'cuero', cadejos_blanco: 'cuero', mono_congo_gigante: 'cuero', mico_malo: 'cuero', mona: 'cuero', viejo_monte: 'cuero', chompipe: 'cuero', toro_redondel: 'cuero',
  cocodrilo_gigante: 'reptil', becquer: 'reptil', terciopelo_reina: 'reptil', coral: 'reptil', falsa_coral: 'reptil', bocaraca: 'reptil', cocodrilo: 'reptil',
  ceniciento: 'piedra', senor_arenal: 'piedra', padre: 'piedra',
  vampiro: 'volador', murcielago: 'volador', rey_murcielago: 'volador', arpia: 'volador', zancudo: 'volador',
  reina_bananera: 'caparazon', escarabajo_hercules: 'caparazon', rey_zopilote: 'volador',
  chata: 'gente', bruja_zarate: 'gente', bailarin: 'gente', sirena: 'gente',
};
export const grupoDe = (m) => (m.data && m.data.grupo) || (m.kind && m.kind.grupo) || GRUPO[m.type] || null; // data.grupo: el muñeco de práctica
// la primera vez que un caparazón o una tenaza le ataja un corte (una sola vez por mundo)
export function pistaCaparazon(g) {
  if (g.meta && g.meta.tenazaAviso) (g.meta.consejosVistos ||= []).includes('caparazon') || g.meta.consejosVistos.push('caparazon'); // los mundos que ya vieron el aviso viejo de la tenaza
  consejoUnaVez(g, 'caparazon', '🦀 Diay, la cáscara le ataja el filo. Eso pide algo contundente (mazo, garrote, hasta la mano) o pegarle de lado');
}
export function afinidad(m, tipo) {
  const G = grupoDe(m);
  return (G && AFIN[G] && AFIN[G][tipo]) || 1;
}
export const NOMBRE_TIPO = { corte: 'corte', contundente: 'contundente', punta: 'punta' };
// para la ficha y el bestiario: a qué es débil y a qué resiste
export function debilidadTexto(m) {
  const G = grupoDe(m), A = G && AFIN[G];
  if (!A) return '';
  const deb = Object.keys(A).filter((k) => A[k] > 1.15), res = Object.keys(A).filter((k) => A[k] < 0.85);
  return [deb.length ? `débil a ${deb.join(' y ')}` : '', res.length ? `resiste ${res.join(' y ')}` : ''].filter(Boolean).join(' · ');
}

// ---------- aguante ----------
export const AGUANTE_MAX = (g) => 100 + (g.aguanteExtra || 0);
// ¿alcanza el aire para este golpe? (sin aire no se pega: es lo que obliga a medir la pelea)
export function hayAire(g, cost) {
  if (g.mode !== 'survival') return true;
  if ((g.stamina ?? 100) >= cost * 0.35) return true;
  if ((g.sinAireAviso || 0) < (g.clock || 0)) {
    g.sinAireAviso = (g.clock || 0) + 1.2;
    g.ui.combatFlash('break', 'Sin aire');
    g.audio.play('resoplido', { ui: true, vol: 0.3, pitch: 1.7 }); // un resoplido de cansancio
  }
  const el = typeof document !== 'undefined' && document.getElementById('stamina');
  if (el) { el.classList.remove('sinaire'); void el.offsetWidth; el.classList.add('sinaire'); }
  return false;
}

// cuánto aguanta cada criatura antes de tambalearse (con la espada, más o menos dos tercios de su vida)
// con la vida real (estrellas, días, asedios): antes usaba la del tipo y una Sombra 2★ se tambaleaba con un golpe de madera (v11.7)
const topeAturde = (m) => Math.max(10, (m.data.vmax || m.kind.health || 20) * 0.8) * (m.kind.boss ? 1.8 : 1);
// ---------- el golpe ----------
// ¿le está dando la espalda? (o ni lo ha visto venir)
function porLaEspalda(g, m) {
  const p = g.player.body.pos, b = m.body.pos;
  const haciaJug = Math.atan2(p.x - b.x, p.z - b.z);
  let d = haciaJug - (m.yaw || 0);
  d = Math.atan2(Math.sin(d), Math.cos(d));
  return Math.abs(d) > 2.1;
}
// calcula todo lo del golpe antes de pegarlo: el multiplicador por debilidad, la espalda, y deja listos empuje y aturdimiento
export function prepararGolpe(g, m, heavy, paso) {
  const P = perfil(g.heldDef());
  m.data.vmax = Math.max(m.data.vmax || 0, m.health, m.kind.health || 0); // la vida máxima real, antes del primer golpe (para topeAturde)
  let mult = afinidad(m, P.tipo);
  const avisos = [];
  if (mult > 1.15) avisos.push('¡Débil!'); else if (mult < 0.85) avisos.push('Resiste');
  if (P.tipo === 'corte' && grupoDe(m) === 'caparazon') pistaCaparazon(g);
  if (!m.kind.boss && porLaEspalda(g, m)) { const e = P.espalda || 1.5; mult *= e; avisos.push(e >= 3 ? '¡Puñalada!' : '¡Por la espalda!'); }
  const ultimo = paso === P.combo.length - 1;
  g.kbGolpe = P.empuje * (heavy ? 1.7 : ultimo ? 1.3 : 1) / Math.max(1, (m.kind.w || 0.6) * (m.kind.h || 1) / 1.2) * (m.kind.boss ? 0.35 : 1);
  g.rompeEscudo = !!P.rompe;
  return { mult, avisos, P, ultimo };
}
// después de pegar: aturdimiento, el frenón del golpe, el área del mazo
export function despuesGolpe(g, m, dmg, heavy, G) {
  g.kbGolpe = null; g.rompeEscudo = false;
  const P = G.P;
  // la barra de aturdimiento: se llena con cada golpe según el arma; llena, la criatura se tambalea
  if (!m.dying && !m.dead) {
    const tope = topeAturde(m);
    m.aturde = (m.aturde || 0) + dmg * P.aturde * (heavy ? 1.8 : 1);
    if (m.aturde >= tope) {
      m.aturde = 0;
      m.stunT = Math.max(m.stunT || 0, m.kind.boss ? 1.2 : 2);
      m.windT = 0;
      g.ui.combatFlash('crit', '¡Tambalea!');
      g.audio.play('punch', { pos: m.soundPos(), vol: 0.9, pitch: 0.7 });
      g.achieve('tambalea', 'A tambalearse');
    }
    m.aturdeT = g.clock || 0;
  }
  // el frenón: el mundo se detiene un instante al conectar (más con lo pesado)
  g.hitStop = Math.max(g.hitStop || 0, 0.035 + P.empuje * 0.025 + (heavy ? 0.04 : 0) + (G.ultimo ? 0.02 : 0));
  g.shake = Math.max(g.shake || 0, 0.06 + P.empuje * 0.06 + (heavy ? 0.12 : 0));
  if (G.avisos.length && g.mode === 'survival') avisoGolpe(g, m, G.avisos[G.avisos.length - 1], G.mult);
  if (G.mult >= 1.5 && G.P.espalda) g.achieve('punalada', 'Puñalada trapera');
  if (G.mult > 1.15 && !G.avisos.some((a) => /espalda|Puñalada/.test(a))) g.achieve('debilidad', 'Con el arma correcta');
}
// el letrerito sobre la criatura: «¡Débil!», «Resiste», «¡Por la espalda!»
function avisoGolpe(g, m, txt, mult) {
  const S = g.settings;
  if (S && S.numeros === false) return;
  const c = g.camera, b = m.body.pos, v = c.position.clone().set(b.x, b.y + (m.kind.h || 1) + 0.7, b.z).project(c);
  if (v.z > 1 || Math.abs(v.x) > 1 || Math.abs(v.y) > 1 || typeof document === 'undefined') return;
  const el = document.createElement('div');
  el.className = `num-dano aviso-golpe${mult > 1 ? ' bueno' : ' malo'}`;
  el.textContent = txt;
  el.style.left = `${(v.x * 0.5 + 0.5) * 100}%`;
  el.style.top = `${(-v.y * 0.5 + 0.5) * 100}%`;
  el.style.setProperty('--dx', '0px');
  const hud = document.getElementById('hud') || document.body;
  hud.appendChild(el);
  setTimeout(() => el.remove(), 1100);
}
// a quiénes más les llega el golpe: el mazo y el garrote en el último golpe (o el fuerte) pegan en redondo; la lanza fuerte atraviesa
export function otrosAlcanzados(g, m, heavy, G) {
  const P = G.P, out = [];
  const p = g.player.body.pos, d = g.player.lookDir();
  if (P.area && (heavy || G.ultimo)) {
    const cx = p.x + d.x * 1.8, cz = p.z + d.z * 1.8;
    for (const o of g.entities.mobs) if (o !== m && !o.dead && !o.dying && !o.tamed && !o.kind.boat && !o.data.sigue && (o.kind.hostile || o.data.provoked) && Math.hypot(o.body.pos.x - cx, o.body.pos.z - cz) < 2.8 && Math.abs(o.body.pos.y - p.y) < 2.5) out.push({ m: o, k: 0.6 });
    g.particles.burst(cx, p.y + 0.15, cz, [[0.55, 0.48, 0.38], [0.8, 0.75, 0.6]], 26, 4.5);
    g.audio.play('dig.stone', { pos: { x: cx, y: p.y, z: cz }, vol: 0.9, pitch: 0.6 });
  }
  if (P.atraviesa && heavy) {
    for (const o of g.entities.mobs) {
      if (o === m || o.dead || o.dying || o.tamed || o.kind.boat || o.data.sigue || !(o.kind.hostile || o.data.provoked)) continue;
      const rx = o.body.pos.x - p.x, rz = o.body.pos.z - p.z, a = rx * d.x + rz * d.z, lat = Math.abs(rx * d.z - rz * d.x);
      if (a > 0 && a < P.alcance + 1.5 && lat < 0.9) out.push({ m: o, k: 0.8 });
    }
  }
  return out;
}
// cada cuadro: el aturdimiento se va vaciando si no le pegan
export function tickAturde(g, dt) {
  for (const m of g.entities.mobs) if (m.aturde > 0 && (g.clock || 0) - (m.aturdeT || 0) > 1.5) m.aturde = Math.max(0, m.aturde - dt * topeAturde(m) * 0.25);
}
// /prueba armas: una de cada clase en la barra y tres muñecos de práctica delante (una Sombra, una con escudo y un alacrán)
export function pruebaArmas(g) {
  const ids = [315, 306, 403, 402, 404, 325];
  ids.forEach((id, i) => { g.inventory.slots[i] = { id, count: 1 }; });
  g.inventory.changed();
  const p = g.player.body.pos, d = g.player.lookDir();
  ['sombra', 'sombra_escudo', 'alacran'].forEach((t, i) => {
    const o = (i - 1) * 2.2, m = g.entities.spawnMob(t, p.x + d.x * 6 - d.z * o, p.y + 0.3, p.z + d.z * 6 + d.x * o);
    if (m) m.data.apuro = true; // que el sol no se las lleve
  });
  return 'Espada, hacha, mazo, lanza, garrote y machete en la barra. Delante: una Sombra (débil al corte), una con escudo (el hacha y el mazo se lo rompen) y un alacrán (débil a lo contundente)';
}
// los puntitos de la cadena bajo la mira: cuántos golpes lleva y cuánto queda para seguirla
export function cuadroCombo(g) {
  if (typeof document === 'undefined') return;
  let el = document.getElementById('combo-pips');
  const V = g.comboVis, ck = g.clock || 0, ver = V && ck < V.hasta && g.mode === 'survival' && V.n > 1;
  if (!ver) { if (el) el.style.display = 'none'; return; }
  if (!el) { el = document.createElement('div'); el.id = 'combo-pips'; (document.getElementById('hud') || document.body).appendChild(el); }
  el.style.display = '';
  const firma = `${V.n}|${V.paso}|${V.desde}`;
  if (el.dataset.firma !== firma) { el.dataset.firma = firma; el.innerHTML = Array.from({ length: V.n }, (_, i) => `<i class="${i <= V.paso ? 'si' : ''}${i === V.n - 1 ? ' remate' : ''}"></i>`).join('') + '<b></b>'; }
  const k = Math.max(0, (V.hasta - ck) / (V.hasta - V.desde));
  el.lastChild.style.width = `${k * 100}%`;
}
// la ficha del arma (para fichaItem): «Corte · 7 de daño · combo de 3 · gasta 10 de aguante»
export function fichaArma(def) {
  if (!def || !(def.damage || def.machete || def.tool)) return '';
  const k = claseDe(def), P = CLASES[k];
  const extra = [P.area ? 'pega en área' : '', P.rompe ? 'rompe escudos' : '', P.atraviesa ? 'el golpe fuerte atraviesa' : '', P.espalda ? 'triple por la espalda' : ''].filter(Boolean).join(', ');
  return `${P.nombre} · ${NOMBRE_TIPO[P.tipo]} · combo de ${P.combo.length} · ${P.cost} de aguante por golpe · alcance ${P.alcance}${extra ? ` · ${extra}` : ''}`;
}
