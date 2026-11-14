// Los sueños: al dormir de noche, de vez en cuando, una línea sobre la pantalla negra según cómo vaya la partida. Es el hilo más barato de la
// trama: cuela pistas de Zenaida y de Anselmo antes de que se entiendan, y le da algo de peso a cada noche. Cada uno sale una sola vez.
import { anotar } from './diario.js';

const pedazos = (H) => Object.keys((H && H.pedazos) || {}).length;
const SUENOS = [
  { k: 'cocina', c: (g, H) => H.hogar, t: () => 'Soñó con una cocina que olía a café. Alguien decía, sin voltear: «Ese techo ya no gotea. Ya era hora».' },
  { k: 'servir', c: (g, H) => (H.cap || 0) >= 3, t: () => 'Soñó que le servían más gallo pinto sin preguntarle. Cuando iba a decir que ya no, ya estaba servido.' },
  { k: 'sombrero', c: (g, H) => pedazos(H) >= 1, t: () => 'Soñó con un señor de sombrero que caminaba adelante, sin apuro, y nunca se daba vuelta. Le decía a alguien que ya venía.' },
  { k: 'fila', c: (g, H) => pedazos(H) >= 2, t: () => 'Soñó con una fila larguísima en una pulpería. Al final, un señor le hacía señas: «Váyase, que esto tarda».' },
  { k: 'hueco', c: (g, H) => pedazos(H) >= 3, t: () => 'Soñó con un hueco en el suelo y un plato tapado al lado. «Está caliente», decía una voz. «Ya casi no tengo rodillas, pero está caliente».' },
  { k: 'casa_llena', c: (g, H) => pedazos(H) >= 4, t: () => 'Soñó con la casa llena de gente. No conocía a nadie, y todos le guardaban campo.' },
  { k: 'zenaida', c: (g, H) => H.fin, t: () => 'Soñó con Zenaida, lavando platos. No se dio vuelta. «Coma bien», dijo. Y usted supo que ya no se lo iba a decir más en sueños.' },
  { k: 'mesa', c: (g) => (g.meta.comensales || []).length >= 3, t: () => 'Soñó con una mesa larguísima, llena de gente sin cara que comía callada. Alguien le pasó la sal.' },
  { k: 'nemesis', c: (g) => g.meta.nemesis, t: (g) => `Soñó que «${g.meta.nemesis.nombre}» estaba sentada a la orilla de la cama. No hacía nada. Esperaba. Despertó con ganas de desayunar bien.` },
  { k: 'natilla', c: (g) => g.meta.anselmo && g.meta.anselmo.fase >= 5, t: () => 'Soñó con dos personas discutiendo en la cocina por la natilla. Despertó de buen humor, sin saber por qué.' },
  { k: 'martillo', c: (g) => g.meta.gente && ['tino', 'chepa'].some((k) => g.meta.gente.p[k] && g.meta.gente.p[k].fase === 2), t: () => 'Soñó que oía martillazos y ollas. Despertó, y era cierto.' },
  { k: 'regano', c: (g) => (g.meta.muertes || 0) >= 3, t: () => 'Soñó que se moría otra vez. Una señora le decía: «¿Y usted no aprende?». Y le servía más.' },
  { k: 'carpeta', c: (g) => g.meta.prima && g.meta.prima.fase >= 4, t: () => 'Soñó con una señora y una muchacha pintando un corredor, torcido. La señora regañaba. La otra decía: «Yo lo arreglo después». Nadie lo arregló.' },
  { k: 'ventanilla', c: (g) => g.meta.archivo && g.meta.archivo.fase >= 5, t: () => 'Soñó que tenía el número 4.812 y que por fin lo llamaban. Despertó antes de llegar a la ventanilla. Mejor así.' },
  { k: 'estampas', c: (g) => g.meta.album && Object.keys(g.meta.album.tiene || {}).length >= 20, t: () => 'Soñó con un álbum donde faltaba una sola estampa: la suya. Alguien le decía: «Esa sale en el próximo sobre».' },
  { k: 'rio', c: (g) => g.achievements && g.achievements.has('cabeza_agua'), t: () => 'Soñó con el ruido del río creciendo. Esta vez estaba en la orilla, y alguien le pasaba una cobija.' },
  { k: 'cartero', c: (g) => g.meta.correo && Object.keys(g.meta.correo.leidas || {}).length >= 5, t: () => 'Soñó que Don Chema le traía una carta sin remitente. Adentro decía: «Todo bien por aquí. Coma».' },
  { k: 'porras', c: (g) => g.meta.expediente && g.meta.expediente.fase >= 1, t: () => 'Soñó con una ventanilla abierta en medio del monte. Detrás no había nadie, y aun así había que hacer fila.' },
];
const DE_ZENAIDA = ['cocina', 'servir', 'hueco', 'regano'];
// lo llama dormir de noche: devuelve el texto, o null
export function soñar(g) {
  const M = g.meta, H = M && M.hist;
  if (!H || g.mode !== 'survival') return null;
  const V = (M.suenos ||= { vistos: [], dia: 0 });
  const dia = g.day || 1;
  if (dia - V.dia < 2) return null; // no todas las noches
  let S = SUENOS.filter((q) => !V.vistos.includes(q.k) && q.c(g, H));
  // la despedida de Zenaida va de última, y después de ella no sale más de la familia
  if (V.vistos.includes('zenaida')) S = S.filter((q) => !DE_ZENAIDA.includes(q.k));
  if (S.length > 1) S = S.filter((q) => q.k !== 'zenaida');
  if (!S.length) return null;
  const q = S[Math.floor(Math.random() * S.length)];
  V.vistos.push(q.k); V.dia = dia;
  const t = q.t(g);
  anotar(g, t, '💤');
  return t;
}
