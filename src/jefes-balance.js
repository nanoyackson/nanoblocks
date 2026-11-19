// v12.4.9, fase 1 de los jefes (`docs/revisiones/FASE0_CURVA_JEFES.md` y `docs/BALANCE.md`, sección «Jefes»): la vida y la presión de
// cada jefe, calibradas con `tools/bot-pelea.js` (duelos reales en el juego) contra la tabla 1.3 de `DISENO_JEFES_Y_FINAL.md`.
// vida: reemplaza `kind.health` (entities.js, al armar MOB_TYPES). dano: multiplica lo que pegan los golpes PROPIOS del jefe (el
// golpe y los ataques especiales: los que salen de su cuerpo o llevan su nombre o un alias en el aviso; no las crías ni el
// ambiente), en `game.js damagePlayer` (`jefeDelGolpe`). Contra los jefes cuenta la armadura nueva y ningún golpe quita más del 60 %.
// Para recalibrar: correr los duelos (`JEFES()` en bot-pelea.js) y reescalar: vida × (TTK objetivo / TTK medido) y
// dano × (recibido objetivo / recibido medido).
export const JEFES_BALANCE = {
  terciopelo_reina: { vida: 50, dano: 1.3 },
  cocodrilo_gigante: { vida: 85, dano: 0.6, // v12.8.4: 0.5 → 0.6 (preparación §3.1; con aviso los tres perfiles ganaban siempre)
    alias: ['cocodrilo'] },
  jaguar_viejo: { vida: 105, dano: 1.45 },
  guardian_colada: { vida: 150, dano: 1, alias: ['Guardián'] }, // v12.15.2 (C7): 150 de vida y 8 de golpe del diseño; sin recalibrar con bot-pelea (pendiente)
  // v13.4.3 (CC4): los dueños de los salones; vida y daño del plan (§4), calibrados en la v13.4.4 con duelos de `tools/bot-pelea.js` (JEFES, equipo «media», 6 duelos por perfil): promedio gana 4 de 6 (igual que el Jaguar viejo, 3 de 4), torpe 0 de 6; la Madre pasó de 0,8 a 1,8 (ganaba 4 de 4 recibiendo 4,5) y la Reina de 1,2 a 1
  centinela_cristal: { vida: 95, dano: 1.1, alias: ['Centinela'] },
  madre_esporal: { vida: 85, dano: 1.8, alias: ['Madre Esporal'] },
  reina_agujas: { vida: 110, dano: 1, alias: ['Reina de las Agujas'] },
  // v13.6.0: Anguila Mayor del plan (§4). El bot no nada, así que se calibró a mano contra la Madre Esporal (bot-pelea, equipo «media», perfil promedio, 3 duelos: gana 1 de 3, 10,5 s para matarla y 14 de daño recibido): la Anguila tiene 90 de vida (≈ 11 s con el mismo equipo, el charco de 1 de hondo la deja al alcance), muerde 4 × 0,9 cada 2,4 s y descarga 3 × 0,9 cada 7 s: ≈ 15 de daño recibido en 11 s, parejo con la Madre. Sin duelo real en el agua: si resulta dura, bajar `dano`.
  tizon_mayor: { vida: 130, dano: 1.0, alias: ['Tizón Mayor'] }, // v13.7.1 (La Hondura): del plan (§4.2); v13.8.2: daño 1,3 → 1,0 y medido en mundo nuevo con bot-pelea (jefeHierro, 5 duelos por perfil: promedio gana 5 de 5 con 57 % de vida restante; ver tools/calibracion-hondura.json y revisar-calibracion-hondura.mjs)
  anguila_mayor: { vida: 90, dano: 0.9, alias: ['Anguila Mayor'] }, // v13.8.2: medida en una laguna de 3 de hondo (equipo «media»): promedio gana 4 de 4 con 47 % de vida restante; sin cambio
  llorona: { vida: 50, dano: 3 },
  segua: { vida: 70, dano: 2.95 },
  mona: { vida: 135, dano: 1.65 },
  cadejos: { vida: 150, dano: 3 },
  viejo_monte: { vida: 175, dano: 2.1 },
  tulevieja: { vida: 60, dano: 2.35 },
  mono_congo_gigante: { vida: 290, dano: 1.55 },
  reina_bananera: { vida: 220, dano: 2.3 },
  cascabel_rey: { vida: 165, dano: 0.25, alias: ['Cascabel'] },
  escarabajo_hercules: { vida: 300, dano: 0.8, alias: ['Cornudo'] },
  sapo_tata: { vida: 750, dano: 1.1 },
  cangrejo_rey: { vida: 245, dano: 1.3 },
  ciempies_rey: { vida: 520, dano: 0.4 },
  rey_murcielago: { vida: 130, dano: 3 }, // v12.4.13: con la fase 2 a la mitad, 30 s con 215
  jefa_ventanilla: { vida: 400, dano: 1.4 },
  senor_arenal: { vida: 815, dano: 2.45 },
  arpia: { vida: 345, dano: 3, alias: ['Arpía'] },
  el_olvido: { vida: 865, dano: 3 },
  sombra_madre: { vida: 600, dano: 1.5 }, // v12.4.13: con ×3 la Noche Larga (su ola final) se perdía 3 de 4 con el perfil promedio
  rey_zopilote: { vida: 2900, dano: 0.25 }, // v12.16.2: 4 fases; la vida del diseño 3.2 (×escala de red al nacer)
  // v12.4.13: con 0.8 el promedio ganó 5 de 5; con 1, 0 de 8 (falta la prueba con una persona)
};
// el nombre del jefe sin el artículo, para reconocer sus golpes en el aviso de daño («Un rayo del Rey Zopilote»)
export const nombreCorto = (n) => String(n || '').replace(/^(El|La|Los|Las|Don|Doña)\s+/, '');
