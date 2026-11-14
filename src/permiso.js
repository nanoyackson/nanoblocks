// El trámite eterno (sátira ficticia): el oficial del pueblo pregunta por el «Permiso de Todo» y empieza la vuelta:
// municipalidad → banco (constancia de no deudor) → pulpería (timbre) → municipalidad → escuela (la fotocopia, que la
// maestra hace a mano porque la fotocopiadora está mala desde el 2019) → municipalidad («se cayó el sistema, vuelva
// mañana») → al otro día, el Permiso de Todo sellado siete veces. Arriba a la izquierda se ve qué sigue.
import { decir } from './misiones.js';

export const PERMISO = 490;
const COLON = 360;
const PASOS = [
  { rol: 'policia', donde: 'Hable con el oficial del pueblo' },
  { rol: 'funcionario', donde: 'Vaya a la municipalidad' },
  { rol: 'cajera', donde: 'Pida la constancia de no deudor en el banco' },
  { rol: 'pulpero', donde: 'Compre el timbre fiscal en la pulpería (2 colones)' },
  { rol: 'funcionario', donde: 'Vuelva a la municipalidad' },
  { rol: 'maestra', donde: 'Saque la fotocopia de la cédula en la escuela' },
  { rol: 'funcionario', donde: 'Lleve todo a la municipalidad' },
  { rol: 'funcionario', donde: 'Vuelva mañana a la municipalidad' },
];

function pintar(g) {
  const T = g.meta.permisoTodo;
  let el = document.getElementById('tramite');
  if (!T || T.listo || g.hudHidden || g.foto) { if (el) el.remove(); return; }
  if (!el) { el = document.createElement('div'); el.id = 'tramite'; document.getElementById('hud').appendChild(el); }
  const txt = `📋 Permiso de Todo · ${PASOS[T.paso].donde}`;
  if (el.textContent !== txt) { el.textContent = txt; el.classList.remove('cambio'); void el.offsetWidth; el.classList.add('cambio'); }
}
export function tickPermiso(g) {
  g.permT = (g.permT || 0) - 1;
  if (g.permT > 0) return;
  g.permT = 30;
  pintar(g);
}

export function permisoInteract(m, g) {
  const rol = m.data.role, M = g.meta;
  const T = M.permisoTodo;
  // lo empieza el oficial
  if (!T) {
    if (rol !== 'policia' || g.mode !== 'survival') return false;
    M.permisoTodo = { paso: 1, dia: 0 };
    decir(g, m, '¿Y el Permiso de Todo? Sin eso no puede andar por aquí, ni en bici. Sáquelo en la municipalidad.', 5);
    g.ui.toast('📋 Empezó el trámite del «Permiso de Todo». Arriba a la izquierda dice adónde ir', 3600);
    g.achieve('permiso_inicio', 'Me pidieron el Permiso de Todo');
    pintar(g);
    return true;
  }
  if (T.listo) {
    if (rol === 'policia') { decir(g, m, 'Todo en orden, ciudadano. ¡Qué permiso más bonito!', 3); return true; }
    return false;
  }
  if (PASOS[T.paso].rol !== rol) return false;
  const day = g.day || 1;
  const sigue = (txt, seg = 4.5) => { decir(g, m, txt, seg); T.paso++; g.audio.play('click', { ui: true, vol: 0.6, pitch: 0.7 }); pintar(g); };
  switch (T.paso) {
    case 1: sigue('¿El Permiso de Todo? Claro. Primero tráigame la constancia de que no debe nada. Eso es en el banco.'); break;
    case 2: sigue('Constancia de no deudor… listo, firmada y sellada. Pero ocupa un timbre fiscal: lo venden en la pulpería.'); break;
    case 3:
      if (g.inventory.count(COLON) < 2) { decir(g, m, 'El timbre fiscal vale 2 colones, mi amor.', 3); return true; }
      g.inventory.remove(COLON, 2);
      sigue('Aquí tiene su timbre. ¿Para qué es? ¿El Permiso de Todo? ¡Uy, suerte!');
      break;
    case 4: sigue('Muy bien, constancia y timbre. Ahora ocupo la fotocopia de la cédula… la fotocopiadora de aquí está mala. Pruebe en la escuela.'); break;
    case 5: sigue('¿Fotocopia? La de la escuela está mala desde el 2019. Tranquilo, se la hago a mano, con letra bonita.'); break;
    case 6: sigue('Constancia, timbre, fotocopia… ¡todo en orden! Ay, no… se cayó el sistema. Vuelva mañana.', 5); T.dia = day; break;
    case 7:
      if (day <= T.dia) { decir(g, m, 'Sigue caído el sistema. Vuelva mañana, sin falta.', 3.5); return true; }
      T.listo = true;
      g.giveItem(PERMISO, 1);
      g.giveItem(COLON, 10);
      M.reputation = (M.reputation || 0) + 2;
      decir(g, m, '¡Listo! Aquí está su Permiso de Todo, sellado siete veces. Y le devolvemos 10 colones por la molestia. Se renueva… cuando nos acordemos.', 6);
      g.audio.play('aplausos', { ui: true, vol: 0.5 });
      g.ui.toast('📋 ¡Sobrevivió al trámite! Ya tiene el Permiso de Todo', 3200);
      g.achieve('permiso_todo', 'Sobreviví al trámite');
      pintar(g);
      break;
    default: return false;
  }
  return true;
}
