// Las noticias de Radio Marimba (ficticia): entre pieza y pieza, el locutor cuenta lo que uno ha hecho, a su manera. Se arman con el estado de la
// partida, así que cada una es distinta. Sátira solo con instituciones inventadas.
const NADA = [
  'En deportes: el equipo del pueblo perdió otra vez. El entrenador dice que fue el zacate.',
  'El clima: lluvia en la tarde. Como siempre. Como nunca se avisa.',
  'La Municipalidad informa que la calle principal se arreglará pronto. No dijo de qué año.',
  'Se busca un perro café, responde a cualquier nombre si hay comida.',
  'Precio del gallo pinto estable. Precio de todo lo demás, no tanto.',
];
export function noticias(g) {
  const M = g.meta || {}, H = M.hist || {}, L = [];
  const P = (H.pedazos && Object.keys(H.pedazos).length) || 0;
  if (H.fin) L.push('Desde que la cepa de doña Zenaida juntó el Corazón, las noches están más tranquilas. Expertos dicen que es el alumbrado. Nadie les cree.');
  else if (P) L.push(`Se rumora que alguien anda juntando los pedazos de una piedra vieja. Ya llevaría ${P}. La Municipalidad dice que la piedra no está en el catastro.`);
  if (M.nemesisVencidas && M.nemesisVencidas.length) L.push(`Vecinos confirman: «${M.nemesisVencidas[M.nemesisVencidas.length - 1]}» ya no asusta a nadie. Le ganaron en buena lid.`);
  if (M.nemesis) L.push(`Atención: una Sombra que le dicen «${M.nemesis.nombre}» anda buscando a alguien de por aquí. Se recomienda comer bien y no andar a solas.`);
  if (M.archivo && M.archivo.fase >= 5) L.push('Cerró la Ventanilla 3 del Archivo Municipal. Es la primera vez que cierra a la hora.');
  if (M.expediente && M.expediente.fase >= 4) L.push('La Ruta del Progreso dará la vuelta. La entrega sigue en el 2049, pero ahora por otro lado.');
  if (H.asedios) L.push(`${H.asedios === 1 ? 'Por primera vez, una casa del monte aguantó' : `Ya van ${H.asedios} veces que una casa del monte aguanta`} a las Sombras. El dueño de la ferretería dice que fue su cemento.`);
  if (M.cumple && M.cumple.fase >= 2) L.push('Felicitamos a Doña Eulalia por sus noventa años. Pidió que no dijéramos la edad. Ya la dijimos.');
  if (M.prima && M.prima.fase >= 5) L.push('Inmobiliaria local retira proyecto de hotel boutique. La gerente dice que «se le pasó».');
  if (M.anselmo && M.anselmo.fase >= 5) L.push('Un señor que salió por cigarros en el 62 volvió. Dice que había fila. Estamos verificando.');
  if (M.gente && Object.values(M.gente.p || {}).filter((q) => q.fase === 2).length >= 4) L.push('Un caserío nuevo en el monte ya tiene herrero, cocinera, curandera y vigilante. Le falta solo la pulpería, y un bus.');
  if ((M.comensales || []).length >= 6) L.push('Dicen que en una casa del monte le sirven comida hasta a las Sombras. Los vecinos piden que también a ellos.');
  if (M.album && M.album.completo) L.push('Un álbum de estampas de Tiquicia se completó por primera vez en la historia del cantón. Don Mario lo quiere enmarcar.');
  if (!L.length || Math.random() < 0.3) L.push(...NADA);
  return L;
}
// cada vez que empieza una pieza nueva, a veces el locutor habla
export function locutor(g) {
  if (g.mode !== 'survival' || Math.random() > 0.5 || (g.clock || 0) < (g.locutorT || 0)) return;
  g.locutorT = (g.clock || 0) + 180;
  const L = noticias(g), vistas = (g.noticiasVistas ||= new Set()), nuevas = L.filter((t) => !vistas.has(t));
  const t = (nuevas.length ? nuevas : L)[Math.floor(Math.random() * (nuevas.length || L.length))];
  vistas.add(t);
  g.ui.toast(`📻 ${t}`, 6500, 'ambiente');
}
