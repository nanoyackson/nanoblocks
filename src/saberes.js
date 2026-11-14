// Saberes del pueblo: recetas especiales que hay que aprender (de la abuela, de las vecinas o de un libro viejo)
// y la reputación por pueblo (cada pueblo recuerda lo que uno hizo ahí: precios, saludos).

import { conocidasOficios } from './oficios2.js';

export const PAN = 448, AGUA_SAPO = 449, ARROZ_LECHE = 450, LIBRO = 451;
export const RECETAS = {
  pan_casero: 'Pan casero de la abuela',
  agua_de_sapo: 'Agua de sapo (agua dulce con jengibre y limón)',
  arroz_con_leche: 'Arroz con leche',
};

export const conocidas = (g) => conocidasOficios(g, new Set((g.meta && g.meta.recetas) || [])); // v12.15.1: y los niveles de oficio («of:oficio:n»)

export function aprender(g, k) {
  const M = g.meta;
  M.recetas = M.recetas || [];
  if (M.recetas.includes(k)) return false;
  M.recetas.push(k);
  g.ui.toast(`📜 ¡Aprendió una receta! ${RECETAS[k]} (búsquela en el libro de recetas)`, 3600);
  g.audio.play('craft', { ui: true, vol: 0.5, pitch: 1.1 });
  g.achieve('receta', 'Recetas de la abuela');
  if (Object.keys(RECETAS).every((r) => M.recetas.includes(r))) g.achieve('recetario', 'Recetario completo');
  return true;
}

// las vecinas que cocinan a veces le enseñan una receta
const ENSENAN = { panadera: 'pan_casero', tamalera: 'pan_casero', sodera: 'agua_de_sapo', caficultor: 'agua_de_sapo', frutero: 'agua_de_sapo' };
const DICHOS = {
  pan_casero: 'Venga, le voy a enseñar el pan de mi mamá: tortilla, huevo y miel… ¡y mucho cariño!',
  agua_de_sapo: 'El secreto del agua de sapo: agua dulce y jengibre. Quita la sed y da energía.',
};
export function recetaDeVecino(m, g) {
  const k = ENSENAN[m.data.role];
  if (!k || conocidas(g).has(k) || Math.random() > 0.3) return false;
  g.ui.dialog(m.data.name, DICHOS[k], 5200);
  aprender(g, k);
  return true;
}

// el libro de recetas viejo (sale en tesoros y en el sitio arqueológico): enseña una que no sepa
export function leerLibro(g) {
  const falta = Object.keys(RECETAS).filter((k) => !conocidas(g).has(k));
  if (!falta.length) { g.ui.toast('📖 Ya se sabe todas las recetas de este libro', 1800); return false; }
  aprender(g, falta[Math.floor(Math.random() * falta.length)]);
  return true;
}

// lo especial de comer estas recetas
export function alComer(g, id) {
  const p = g.player;
  if (id === PAN) { p.health = Math.min(p.maxHealth, p.health + 4); g.ui.toast('🍞 ¡Qué rico el pan de la abuela! Le volvió el alma al cuerpo', 1800); }
  if (id === AGUA_SAPO) g.addEffect('energia', 90);
  if (id === ARROZ_LECHE) g.addEffect('calma', 120);
}

// ---------- reputación por pueblo ----------
// la reputación general ya sube y baja (encargos, historias, la soda, pegarle a alguien…): cada cambio se le
// anota al pueblo más cercano
export function tickReputacion(g) {
  const M = g.meta;
  const rep = M.reputation || 0;
  if (g.repVista === undefined) { g.repVista = rep; return; }
  if (rep === g.repVista) return;
  const delta = rep - g.repVista;
  g.repVista = rep;
  const p = g.player.body.pos;
  const v = g.nearestVillage && g.nearestVillage(p.x, p.z);
  if (!v || v.dist > 120) return;
  const R = (M.repPueblo = M.repPueblo || {});
  const antes = R[v.v.id] || 0;
  R[v.v.id] = antes + delta;
  if (antes < 5 && R[v.v.id] >= 5) { g.ui.toast(`⭐ En ${v.v.name || 'este pueblo'} ya lo quieren: le hacen rebajas en las tiendas`, 3200); g.achieve('querido', 'Querido en el pueblo'); }
  if (antes > -3 && R[v.v.id] <= -3) g.ui.toast(`😠 En ${v.v.name || 'este pueblo'} ya le tienen desconfianza: le cobran más caro`, 3200);
}
export function repDe(g, mob) {
  const R = (g.meta && g.meta.repPueblo) || {};
  const vid = mob && mob.data && mob.data.vid ? String(mob.data.vid).split(':')[0] : null;
  return vid && R[vid] !== undefined ? R[vid] : 0;
}
// cuánto cuesta (vender) y cuánto pagan (comprar) según la reputación en ese pueblo
export function factorRep(rep) { return rep >= 10 ? 0.8 : rep >= 5 ? 0.9 : rep <= -3 ? 1.25 : 1; }
export function estrellas(rep) { return rep >= 10 ? ' ⭐⭐⭐' : rep >= 5 ? ' ⭐⭐' : rep >= 2 ? ' ⭐' : rep <= -3 ? ' 😠' : ''; }
