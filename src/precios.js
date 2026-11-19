// Precios y premios a la escala de 2026 (v11.10.4). Todo en unidades del juego (cada una vale ₡500, plata.js).
// Una jornada de trabajo honrado son unas 25 unidades (₡12 500, el mínimo del MTSS 2026). Ver docs/BALANCE.md («Economía»).

// lo que se vende en las tiendas a precio fijo, sea la tienda que sea (pisa el número de SHOPS). La canasta va a precio de aquí
// y lo que solo se compra hecho (vehículos, el lote) va por ritmo: una herramienta buena, 3–5 jornadas; un lote, semanas
export const ANCLAS = {
  263: 5, // gallo pinto · ₡2 500
  351: 9, // casado · ₡4 500
  350: 7, // gallo pinto con huevo · ₡3 500
  298: 3, // café chorreado · ₡1 500
  302: 90, // pico de hierro hecho · ₡45 000 (con el hierro y la mesa sale mucho más barato)
  326: 70, // arco · ₡35 000
  89: 50, // cama · ₡25 000
  358: 120, // bote de remos · ₡60 000
  455: 170, // bicicleta · ₡85 000
  456: 1800, // moto · ₡900 000
  457: 3000, // lancha con motor · ₡1 500 000
  413: 600, // escritura del lote en el pueblo · ₡300 000 (unas semanas de trabajo)
};

// paga por peligro al matar (v11.10.4): matar lo manso o lo común no paga; los bravos, las élites, las leyendas y los jefes sí.
// [mínimo, máximo] en unidades. Se paga en monedas al lado del cuerpo (o directo, los jefes)
export const PREMIO_BAJA = {
  // bravos sueltos (T1): ₡500–1 500 (el cuche de monte es manso: no paga)
  chupacabras: [1, 3], mico_malo: [1, 3], becquer: [1, 3], puma: [1, 3], chata: [1, 3],
  // élites (T2): ₡500–1 000
  sombra_grande: [1, 2], toro_guaco: [1, 2],
  // minijefes (T3): ₡3 500–4 500 el primero del día, el 10 % los demás
  terciopelo_reina: [7, 9], jaguar_viejo: [7, 9], cocodrilo_gigante: [7, 9], guardian_colada: [8, 10], centinela_cristal: [7, 9], madre_esporal: [7, 9], reina_agujas: [7, 9], anguila_mayor: [7, 9], tizon_mayor: [7, 9], culebron_brasa: [1, 2], // v13.4.3 (CC4): los dueños de los salones
  // leyendas (T4): ₡2 000–4 000 la primera del día, el 10 % las demás
  cadejos: [4, 6], segua: [4, 6], llorona: [4, 6], mona: [4, 6], viejo_monte: [5, 7], tulevieja: [6, 8], mono_congo_gigante: [6, 8],
  // jefes del monte (T5): ₡20 000–35 000, una sola vez por mundo (después, el 10 %)
  reina_bananera: [40, 40], cascabel_rey: [48, 48], escarabajo_hercules: [50, 50], sapo_tata: [55, 55], cangrejo_rey: [60, 60], ciempies_rey: [70, 70],
  // jefes de la historia (T6, T7)
  rey_murcielago: [120, 120], senor_arenal: [240, 240], arpia: [300, 300], jefa_ventanilla: [160, 160], el_olvido: [300, 300], sombra_madre: [400, 400], rey_zopilote: [1000, 1000],
};
const JEFE = new Set(['reina_bananera', 'cascabel_rey', 'escarabajo_hercules', 'sapo_tata', 'cangrejo_rey', 'ciempies_rey', 'rey_murcielago', 'senor_arenal', 'arpia', 'jefa_ventanilla', 'el_olvido', 'sombra_madre', 'rey_zopilote']);

export const MINIJEFE = new Set(['terciopelo_reina', 'jaguar_viejo', 'cocodrilo_gigante', 'guardian_colada', 'centinela_cristal', 'madre_esporal', 'reina_agujas', 'anguila_mayor', 'tizon_mayor']);
export const LEYENDA = new Set(['cadejos', 'segua', 'llorona', 'mona', 'viejo_monte', 'tulevieja', 'mono_congo_gigante']);
export const REPITE = 0.1; // lo que paga un jefe ya cobrado, o la segunda leyenda o el segundo minijefe del mismo día
// lo que paga una baja (0 si no paga) y si fue la paga completa (v11.10.6, contra «cultivar» jefes):
// - lo manso no paga nunca;
// - cada jefe paga completo UNA vez por mundo (meta.premioJefe); las demás veces, el 10 %;
// - de minijefes y de leyendas paga completo el primero de cada día de juego (meta.premioDia); los demás de ese día, el 10 %.
export function premioBaja(m, g) {
  const P = PREMIO_BAJA[m.type];
  if (!P || m.tamed || (m.data && (m.data.arena || m.data.nido))) return { u: 0 };
  if (m.kind && !m.kind.hostile && !m.kind.boss) return { u: 0 };
  const [a, b] = P, base = a + Math.random() * (b - a), M = (g && g.meta) || {}, dia = (g && g.day) || 1;
  let completo = true;
  if (JEFE.has(m.type)) {
    M.premioJefe ||= {};
    completo = !M.premioJefe[m.type];
    M.premioJefe[m.type] = true;
  } else if (MINIJEFE.has(m.type) || LEYENDA.has(m.type)) {
    const k = MINIJEFE.has(m.type) ? 'mini' : 'leyenda';
    M.premioDia ||= {};
    completo = M.premioDia[k] !== dia;
    M.premioDia[k] = dia;
  }
  return { u: Math.max(1, Math.round(base * (completo ? 1 : REPITE))), completo };
}
export const esJefe = (type) => JEFE.has(type);
