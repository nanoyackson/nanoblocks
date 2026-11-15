// Vecinos de los pueblos ticos: modelo por persona, horarios (de día en la plaza, de noche en la casa),
// frases ticas, encargos que pagan en colones, y las tiendas de la pulpería y la soda.
import { ANCLAS } from './precios.js';
import { precioBonito } from './plata.js';
import * as THREE from 'three';
import { hash3, mulberry32 } from './noise.js';
import { BLOCK_BY_KEY as K, TOOL_IDS } from './blocks.js';
import { repairCar } from './vehiculos.js';
import { hx, contextura, torsoVecino, cabezaVecino, sombrero, gorra, mantilla, delantal, falda, piernaVecino, brazoVecino, mecateEnrollado } from './modelos-gente.js';
import { flat } from './fauna.js';
import { misionInteract, decir } from './misiones.js';
import { juradoInteract } from './concurso.js';
import { serenateroInteract } from './serenata.js';
import { impostorInteract, revelar } from './impostor.js';
import { pangaInteract } from './panga.js';
import { alfareroInteract } from './alfarero.js';
import { historiaInteract, frasesHistoria } from './historia.js';
import { rigoInteract } from './rigo.js';
import { inspectorInteract } from './inspector.js';
import { guilaInteract } from './guila.js';
import { anselmoInteract } from './anselmo.js';
import { firmaInteract, audienciaInteract } from './expediente.js';
import { genteInteract } from './gente.js';
import { primaInteract } from './prima.js';
import { correoInteract } from './correo.js';
import { peonFincaInteract } from './peon.js';
import { atarrayaInteract } from './playa.js';
import { economiaInteract, MENU } from './economia.js';
import { cerrado, CERRADO } from './vida2.js';
import { recetaDeVecino } from './saberes.js';
import { tramiteSoda, vendedorPresaInteract } from './satira.js';
import { guiaInteract } from './guia.js';
import { turistaInteract } from './turistas.js';
import { comiteInteract } from './comite.js';
import { patronalInteract } from './patronal.js';
import { trenInteract } from './tren.js';
import { peonInteract, peonBrain } from './compas.js';
import { eleccionInteract } from './elecciones.js';
import { chumicosInteract } from './juegos.js';
import { bingoInteract } from './bingo.js';
import { torneoInteract } from './torneo.js';
import { tiroInteract } from './tiro.js';
import { cuidacarrosInteract } from './cuidacarros.js';
import { permisoInteract } from './permiso.js';
import { carretilleroInteract } from './vidapueblo2.js';
import { concursoFeria } from './finca2.js';
import { entregarMandado } from './encargos2.js';

// la cara de cada vecino, en 3D y distinta por persona: ojos con iris y pupila, cejas con expresión, nariz, orejas,
// boca con labios y, según quién sea, barba, bigote, chapas, aretes o anteojos. Devuelve el grupo de los ojos (parpadean).
const hexOf = (rgb) => (Math.round(rgb[0]) << 16) | (Math.round(rgb[1]) << 8) | Math.round(rgb[2]);
// la gente quieta no es un poste: se rasca la cabeza, se cruza de brazos, se estira, mira la muñeca y saluda al que llega
const GESTOS = {
  rasca: { dura: 1.8, poses: [null, { x: -2.75, z: -0.2, codo: -1.9 }], cabeza: 0.12 },
  cruza: { dura: 4, poses: [{ x: -1, z: 0.42, codo: -1.75 }, { x: -1.1, z: -0.42, codo: -1.75 }] },
  reloj: { dura: 1.6, poses: [{ x: -1.25, z: 0.3, codo: -1.4 }, null], cabeza: 0.3 },
  estira: { dura: 2, poses: [{ x: -3, z: -0.25, codo: -0.3 }, { x: -3, z: 0.25, codo: -0.3 }], cabeza: -0.2 },
  saluda: { dura: 1.5, poses: [null, { x: -2.85, z: 0.3, codo: -0.5, ola: 0.35 }] },
};
const GESTOS_SUELTOS = ['rasca', 'cruza', 'reloj', 'estira'];
function gestoVecino(m, dt, u) {
  const d = m.data, g = m.game, p = g.player.body.pos, b = m.body.pos;
  const quieto = !m.moving && m.walkAmt < 0.15 && !d.mojandose && !(u.sombrilla && u.sombrilla.visible);
  d.gestoT = (d.gestoT ?? 4 + Math.random() * 10) - dt;
  if (!m.gesto && quieto && u.npcArms.every((a) => a.children.length <= 2)) {
    const lejos = Math.hypot(p.x - b.x, p.z - b.z), ahora = g.clock || 0;
    if (lejos < 8 && lejos > 2.5 && ahora > (d.saludoT || 0) && g.player.alive) { d.saludoT = ahora + 120; m.gesto = { k: 'saluda', t: 0 }; }
    else if (d.gestoT <= 0) { d.gestoT = 6 + Math.random() * 12; m.gesto = { k: GESTOS_SUELTOS[Math.floor(Math.random() * GESTOS_SUELTOS.length)], t: 0 }; }
  }
  for (const a of u.npcArms) a.codoMeta = undefined;
  if (!m.gesto) return;
  const G = GESTOS[m.gesto.k];
  m.gesto.t += dt;
  if (!quieto && m.gesto.t < G.dura - 0.25) m.gesto.t = G.dura - 0.25; // si echa a andar, lo deshace
  const k = Math.max(0, Math.min(1, m.gesto.t / 0.25, (G.dura - m.gesto.t) / 0.25)), e = k * k * (3 - 2 * k);
  u.npcArms.forEach((a, i) => {
    const q = G.poses[i];
    if (!q) return;
    a.rotation.x += (q.x - a.rotation.x) * e;
    a.rotation.z += (q.z + (q.ola ? Math.sin(m.t * 11) * q.ola : 0) - a.rotation.z) * e;
    a.codoMeta = q.codo * e - 0.14 * (1 - e);
  });
  u.headRx = (G.cabeza || 0) * e;
  if (m.gesto.t >= G.dura) { m.gesto = null; u.headRx = 0; }
}

function cara(head, c, seed, role) {
  const r = mulberry32((seed * 7919) ^ 0xface);
  const Z = 0.226; // la cara está en z = 0.225 (cabeza de 0.45 centrada)
  const skin = c.skin, skinDark = hexOf(skin.map((v) => v * 0.82)), hair = hexOf(c.hair);
  const iris = [0x3a2414, 0x5a3a1c, 0x2a1a10, 0x4a3018, 0x4a6a3a, 0x3a5a7a][Math.floor(r() * (r() < 0.85 ? 4 : 6))];
  const viejo = c.hair[0] > 150;
  // ojos (en un grupo para parpadear)
  const ojos = new THREE.Group();
  for (const sx of [-1, 1]) {
    ojos.add(flat(0xf4f0e8, 0.085, 0.06, 0.01, sx * 0.095, 0, Z));
    ojos.add(flat(iris, 0.045, 0.055, 0.01, sx * 0.095 + sx * 0.008, -0.002, Z + 0.004));
    ojos.add(flat(0x0a0806, 0.022, 0.03, 0.01, sx * 0.095 + sx * 0.008, -0.004, Z + 0.008));
    ojos.add(flat(0xffffff, 0.01, 0.01, 0.01, sx * 0.095 + sx * 0.008 + 0.01, 0.012, Z + 0.011));
  }
  ojos.position.y = 0.25;
  head.add(ojos);
  // cejas: del color del pelo, con un poquito de expresión
  const enojo = (r() - 0.5) * 0.4;
  for (const sx of [-1, 1]) { const ce = flat(hair, 0.1, viejo ? 0.03 : 0.022, 0.01, sx * 0.095, 0.305, Z + 0.002); ce.rotation.z = sx * enojo; head.add(ce); }
  // nariz con volumen, orejas y boca
  head.add(flat(skinDark, 0.05, 0.075, 0.05, 0, 0.18, Z + 0.02));
  for (const sx of [-1, 1]) head.add(flat(hexOf(skin), 0.04, 0.1, 0.07, sx * 0.24, 0.22, 0));
  const labio = c.skirt && r() < 0.6 ? 0xb83a48 : 0x8a4438;
  head.add(flat(labio, 0.12, 0.026, 0.01, 0, 0.095, Z));
  if (r() < 0.6) for (const sx of [-1, 1]) head.add(flat(labio, 0.02, 0.02, 0.01, sx * 0.06, 0.108, Z)); // sonrisa
  // según la persona
  if (!c.skirt && (role === 'sabanero' || r() < 0.22)) head.add(flat(hair, 0.16, 0.03, 0.01, 0, 0.128, Z + 0.003)); // bigote
  if (!c.skirt && r() < 0.18) { head.add(flat(hair, 0.36, 0.09, 0.04, 0, 0.04, Z - 0.03)); head.add(flat(hair, 0.06, 0.12, 0.3, -0.2, 0.08, 0.06)); head.add(flat(hair, 0.06, 0.12, 0.3, 0.2, 0.08, 0.06)); } // barba
  if (c.skirt) {
    for (const sx of [-1, 1]) head.add(flat(0xe88a8a, 0.05, 0.025, 0.01, sx * 0.14, 0.16, Z)); // chapas
    if (r() < 0.45) for (const sx of [-1, 1]) head.add(flat(0xf0c040, 0.02, 0.035, 0.02, sx * 0.25, 0.15, 0.02)); // aretes
    if (r() < 0.6) head.add(flat(hair, 0.42, 0.3, 0.06, 0, 0.17, -0.25)); // pelo largo atrás
  }
  if ((viejo && r() < 0.6) || r() < 0.07) {
    // anteojos: marco oscuro alrededor de cada ojo y el puente
    for (const sx of [-1, 1]) { head.add(flat(0x222226, 0.12, 0.012, 0.01, sx * 0.095, 0.29, Z + 0.012)); head.add(flat(0x222226, 0.12, 0.012, 0.01, sx * 0.095, 0.21, Z + 0.012)); head.add(flat(0x222226, 0.012, 0.09, 0.01, sx * 0.155, 0.25, Z + 0.012)); head.add(flat(0x222226, 0.012, 0.09, 0.01, sx * 0.035, 0.25, Z + 0.012)); }
    head.add(flat(0x222226, 0.07, 0.012, 0.01, 0, 0.26, Z + 0.012));
  }
  return ojos;
}

export const COLON = 360;
// los que se quedan en su puesto (no se van a la plaza ni a la casa)
const KEEPERS = new Set(['buhonero', 'pulpero', 'sodera', 'churchillero', 'pescador', 'farero', 'guarda', 'boyero', 'acomodador', 'canciller', 'mercader', 'lotero', 'guardaparques', 'guia',
  'minisuper', 'cantinero', 'panadera', 'carnicero', 'barbero', 'farmaceutica', 'doctora', 'policia', 'funcionario', 'fila', 'maestra', 'ferretero', 'cajera', 'cajero',
  'pistero', 'mecanico', 'bombero', 'profesor', 'chofer', 'frutero', 'copero', 'constructor', 'peajero', 'futbolista', 'ingeniero', 'jefe_estacion',
  'recepcionista', 'bartender', 'chef_lujo', 'barista_lujo', 'inmobiliaria', 'yogui', 'guarda_condominio', 'sodera_playa', 'operador', 'guarda_planta', 'caficultor', 'feriante', 'tamalera', 'taquillera']);

const SKIN = [[224, 188, 150], [196, 150, 110], [160, 112, 74], [120, 82, 52]];
const SHIRTS = [[200, 40, 40], [40, 90, 180], [240, 240, 235], [60, 140, 70], [230, 180, 40], [130, 60, 150], [240, 120, 160], [30, 30, 30]];
const LINES = {
  vecino: ['¡Pura vida!', 'Diay mae, ¿todo bien?', '¡Qué chiva verlo por aquí!', 'Ahí vamos, poco a poco.', 'Dicen que en los volcanes hay jade, pero vaya con cuidado.',
    'De noche no se meta a la selva, que andan jaguares.', 'Las Sombras no aguantan el sol, mae.', '¡Upe! ¿Quién anda por ahí?', 'Si ve pizotes, cuide la milpa.',
    'Ojalá llueva, que el café lo necesita.', 'Hoy hay mejenga en la plaza, ¿se apunta?', '¡Qué torta! Se me quemó el gallo pinto.', 'Aquí todo es tuanis, mae.',
    'Si va pa\' la pulpe, me trae un fresco, ¿diay?', 'Ese perro zaguate es el más fiel del mundo.', 'En la soda de Doña Rosa hacen el mejor casado.',
    '¿Ya vio las lapas? Pasan gritando todas las tardes.', 'Mi abuelo decía que en las ruinas hay oro de los antiguos.', '¡Mae, qué calor! Ocupo un agua de pipa.'],
  sabanero: ['¡Eeepa! Buenas.', 'Un caballo criollo con albarda le cambia la vida.', 'Las vacas se ordeñan con balde, ¿verdad?', 'En la bajura hace un calor… ¡pero qué belleza!',
    '¿Usted es de por aquí o anda de paseo?', 'Al ganado hay que tratarlo con cariño.', 'Le doy un consejo: nunca le dé la espalda a un toro.'],
  beata: ['Dios le bendiga, mi cielo.', 'El domingo hay misa y después turno.', '¿Ya comió? Hay gallo pinto en la casa.', 'No ande en la calle de noche, que salen las Sombras.',
    'Las campanas suenan al amanecer, al mediodía y al atardecer.', 'Rece un padrenuestro antes de bajar a las cuevas.'],
  buhonero: ['¡Buenas! Traigo de todo, menos lo que usted anda buscando.', 'Le compro la cosecha, y a buen precio. No le digo a cuál.', 'Esta carretilla ha subido más cerros que el bus.'],
  pulpero: ['¡Pase adelante! ¿Qué se le ofrece?', 'Aquí hay de todo, como en botica.', 'Le fío… pero solo esta vez.'],
  montador: ['¿Se va a tirar al redondel? ¡Agárrese del pretal y no suelte!', 'Ese toro me levantó tres veces el año pasado.', 'Mae, el que no se ha tirado nunca no sabe lo que es la adrenalina.'],
  sodera: ['¡Siéntese, mi amor! ¿Qué le sirvo?', 'El casado de hoy viene con maduro.', 'El café está recién chorreado.'],
  churchillero: ['¡Churchill bien frío! ¿Con doble helado?', 'Con este calor de Puntarenas, un churchill es medicina.', '¡Pipas frías, copos, churchill!'],
  pescador: ['¡Pescado fresquito, recién salido!', 'Hoy hay pargo y corvina, mi amor.', 'Con limón mandarina el ceviche queda de otro mundo.'],
  farero: ['De noche la luz del faro gira para que los barcos no se pierdan.', 'Arriba se ve todo el golfo… suba por la escalera de caracol.', 'Aquí se oye el mar toda la noche, mae.'],
  guarda: ['¿Vio las troneras? Se abren hacia afuera. ¡Únicas en el mundo!', 'Arriba está el cañón; cuidado con el escalón.', 'Heredia es la ciudad de las flores, ¿sabía?'],
  peregrino: ['Venimos caminando desde San José para la romería. ¡Ya casi llegamos!', 'La Negrita nos cuida a todos.', 'Me duelen los pies, pero vale la pena.', '¿Quiere un poquito de agua? Hay que hidratarse en la romería.'],
  guia: ['¡Bienvenidos! Pasen, que la visita es gratis.', 'Estos muros los botó el terremoto de 1910 y así se quedaron.', 'Dicen que si la iglesia se termina, pasa una desgracia… por eso nadie la termina.', 'Tómese una foto en el arco grande, queda preciosa.'],
  minisuper: ['Pase, pase. Hay arroz, frijoles, de todo.', 'Abrimos todos los días, hasta el 1.º de enero.', 'Si no lo tengo, se lo pido para mañana.', 'Esta semana el café está en oferta.'],
  cantinero: ['¿Qué le sirvo, compa? La boca va por la casa.', 'Aquí no se habla de política, que después hay pleito.', 'Ese guaro es de caña, cuidado que pega.', 'El partido de hoy lo ganamos, se lo firmo.'],
  panadera: ['¡El pan está calientito, recién salido!', 'Las cajetas de leche se acaban rapidito.', 'Lleve un pan casero para el cafecito de la tarde.'],
  carnicero: ['Hoy hay posta de primera, bien suavecita.', '¿Para olla de carne? Le doy costilla con hueso.', 'El chicharrón es los domingos, no se lo pierda.'],
  barbero: ['Siéntese, ¿lo de siempre? Degradado y raya.', 'Aquí uno se entera de todo lo que pasa en el pueblo.', '¿Ya vio el partido? Siéntese que le cuento.'],
  farmaceutica: ['¿Qué tiene, mi amor? Con este jarabe se le quita.', 'Tómese mucha agua y suero, que el calor está fuerte.', 'Si lo picó una terciopelo, el antiofídico es lo único que sirve.'],
  doctora: ['Coma frutas y camine, que la salud es lo primero.', 'Para la ficha venga temprano, a las 5 de la mañana.', 'Usted está sano como un roble. ¡Siga así!'],
  policia: ['Todo tranquilo por aquí, gracias a Dios.', 'Maneje despacio, que en la ruta hay cada hueco…', 'Si ve algo raro de noche, avise.'],
  funcionario: ['Diay, el sistema está caído. Vuelva mañana.', 'Ocupa la copia de la cédula, la copia de la copia y un timbre fiscal.', 'Ese trámite es en la otra ventanilla… que abre los martes.', 'Llene este formulario, después este otro, y vuelva en 15 días hábiles.', 'Ya casi es hora del café, ¿me espera?'],
  fila: ['Llevo dos horas en esta fila…', 'Me dijeron que traiga otra copia. ¡Otra!', '¿Usted también viene por el permiso? Siéntese, va para largo.', 'Dicen que el sistema vuelve después del almuerzo.'],
  maestra: ['¡Buenos días, güilas! Saquen el cuaderno.', 'Hoy repasamos el himno nacional.', 'El que se porte bien sale primero al recreo.', 'En setiembre desfilamos con faroles para la Independencia.'],
  ferretero: ['¿Qué ocupa? Aquí hay zinc, varilla, cemento y clavos.', 'Para una casita de bloques le alcanza con esto.', 'Lleve la verja, que en estos días hay que cuidarse.'],
  cajera: ['Siguiente… perdón, el sistema está lento.', 'Tome su ficha, número 347. Vamos por el 12.', 'El cajero automático está en mantenimiento desde el martes.'],
  cajero: ['¿Encontró todo lo que buscaba?', '¿Bolsa? Se la regalo, tranquilo.', 'Hoy hay 2x1 en galletas.'],
  pistero: ['¿Lleno, súper o regular?', '¿Le reviso el aceite y el aire de las llantas?', 'La gasolina subió otra vez, ¿ya vio?'],
  mecanico: ['Diay, eso es la bomba de agua. Se lo tengo para el viernes.', 'Con tanto hueco en la calle, aquí nunca falta trabajo.', 'Esa llanta ya está más lisa que una calvicie.'],
  bombero: ['Siempre listos, de día y de noche.', 'Benemérito Cuerpo de Bomberos, para servirle.', 'No deje candelas prendidas, por favor.'],
  profesor: ['Hoy hay examen de mate, ¿estudió?', 'El festival de bandas es el 15 de setiembre, ¡prepárense!', 'Siéntese, que ya empieza la clase.'],
  chofer: ['Sale cuando se llene, mae.', 'Aquí es en efectivo, lleve menudo.', 'Por el hueco de la entrada del pueblo hay que ir despacito.'],
  frutero: ['¡Mango, piña, papaya! ¡Todo fresquito!', 'Esta pipa está bien heladita.', 'La sandía de Guanacaste es la más dulce.'],
  copero: ['¡Copos, copos! ¿Con leche en polvo y sirope?', 'Un copo con este calor es medicina.', '¡Hay de fresa, de cola y de tamarindo!'],
  constructor: ['Ahí vamos, poco a poco. Bueno, más poco que vamos.', 'Estamos esperando el material desde marzo.', 'Esto queda listo para el próximo año… o el otro.', 'Yo nada más sostengo la pala; el ingeniero viene el jueves.', '¿Tres metros? Sí, pero son tres metros bien hechos.'],
  peajero: ['Buenas, es un colón.', 'El peaje es para darle mantenimiento a la ruta… ¿no le parece que se nota?', '¡Buen viaje y cuidado con los huecos!'],
  futbolista: ['¡Pásela, pásela! ¡Aquí estoy solo!', 'El domingo jugamos el clásico. ¡Vamos!', 'Hoy no me sale ni un pase, mae.', '¡Qué golazo hice ayer en el entreno!'],
  aficionado: ['¡Vamos Sele! ¡Sí se puede!', 'Yo vengo desde Cartago a todos los partidos.', 'El árbitro está comprado, se lo juro.', '¡Ese tiro fue gol! ¡GOOOL!'],
  ingeniero: ['La obra va según el cronograma… el cronograma nuevo.', 'Estamos esperando el refrendo de la Contraloría.', 'Fase 1 de 14. Bueno, fase 1 y medio.', 'El próximo año se inaugura, ahora sí.'],
  jefe_estacion: ['El tren pasaba lleno de café y de bananos.', '¡Pasajeros al tren! …bueno, cuando llegue.', 'Mi abuelo fue maquinista en la línea al Atlántico.'],
  recepcionista: ['Welcome to paradise! La noche es de 60 colones.', 'Late check-out: 20 colones más. Early check-in: 20 colones más. Respirar: incluido.', '¿Desea la vista al mar o la vista al parqueo?'],
  bartender: ['¿Un cóctel de pipa? Viene con sombrillita.', 'Aquí todo está en dólares, pero se lo cobro en colones… muchos colones.', 'El DJ empieza a las 10, la cuenta empieza ya.'],
  chef_lujo: ['Este casado es una experiencia gastronómica de autor.', '¿Un gallo pinto? Organic Authentic Breakfast Experience, mae. Digo… monsieur.', 'El frijol viene deconstruido y el arroz en espuma.', 'Mi mamá hacía el casado igual, pero lo cobraba barato.'],
  barista_lujo: ['El café viene con energía espiritual.', 'Notas de chocolate, frutos rojos y alquiler impagable.', 'Antes aquí había una pulpería, ahora vendemos matcha.'],
  inmobiliaria: ['¿Cuánto cuesta el lote? Mejor ni pregunte.', 'Esta es una inversión segura: en cinco años vale el doble y nadie de aquí lo puede comprar.', 'Vista al mar, a la montaña y a la plusvalía.', 'Le tengo una finquita por allá, ¡con río! Bueno, con quebrada.'],
  yogui: ['Respire profundo… inhale paz, exhale el precio de la clase.', 'Namasté, mae.', 'La energía de esta playa es única. El alquiler también.'],
  guarda_condominio: ['¿Es residente? No puede pasar.', 'Las visitas tienen que estar en la lista. Usted no está.', 'La playa sí es pública, pero por este portón no se llega.'],
  sodera_playa: ['¡Pase, mi amor! El casado está a 6, con maduro.', 'Aquí el café es de chorreador, como debe ser.', 'Los de enfrente cobran cinco veces más por lo mismo, ¡imagínese!'],
  desplazado: ['Antes vivía aquí, ahora no puedo pagar el alquiler.', 'Mi abuelo pescaba en esta playa. Ahora hay un beach club.', 'Vendimos el lote barato… y ahora vale una fortuna.', 'Apoye a los de aquí: coma en la soda de Doña Mayela.'],
  turista: ['Pura vida! I love this place!', '¿El tour de perezosos está incluido?', 'Everything is so green! ¡Todo es tan verde!', '¿Dónde compro un casado barato? Me dijeron que en la soda.'],
  operador: ['Aquí refinamos presupuestos.', 'El combustible viene listo, mae. Nosotros solo lo guardamos y lo repartimos.', '¿Quiere llevar un bidón a la bomba del pueblo? Allá se lo pagan.', 'La refinadora está en mantenimiento desde antes de que yo llegara.'],
  guarda_planta: ['La refinería no refina, pero el portón funciona.', 'Pase adelante, pero no toque nada que esté oxidado… o sea, nada.', 'Refinería de nombre, distribución de profesión.'],
  caficultor: ['El mejor café del mundo se da en estas faldas, mae.', 'En la cogida se pagan las cajuelas. ¿Se anima a coger café?', 'El grano se seca al sol, con paciencia, como todo lo bueno.', '¿Ya probó el café de chorreador con tapa de dulce?'],
  feriante: ['¡Lleve, lleve, que está fresquito!', 'Tres por mil, mi amor, ¡aproveche!', 'Esto lo sembré yo mismo, sin químicos.', 'Pruebe este culantro, huela qué rico.'],
  tamalera: ['¡Tamales de cerdo y de pollo, calientitos!', 'El queso tierno es de la lechería de mi compadre.', 'Lleve una cajeta para el camino.'],
  guardaparques: ['Bienvenidos al parque nacional. No deje basura y no se salga del sendero.', 'Arriba hace frío: lleve abrigo y café.', 'Si escucha retumbar al volcán, aléjese del cráter.', 'Los quetzales anidan en el bosque nuboso de las faldas.'],
  acomodador: ['Bienvenidos al Teatro Nacional. Siéntese en una butaca y empieza la función.', 'Fíjese en el techo: la pintura es una joya.', 'Por favor, silencio durante la función.'],
  canciller: ['Bienvenidos a la Cancillería. Aquí se recibe a los embajadores.', 'Costa Rica no tiene ejército desde 1948, ¿sabía?', 'Este salón ha visto firmar muchos acuerdos.'],
  mercader: ['¡Pase, pase! Café de altura, tapa de dulce, de todo.', 'Las orejas de guanacaste se siembran y crecen enormes.', 'En el Mercado Central hay de todo, mi amor.'],
  lotero: ['¡Lotería, chances! ¡El gordo, el gordo!', '¿Un chance? Le trae suerte, se lo juro.'],
  boyero: ['¡Ehhh, buey! Estos dos son mansitos.', 'La carreta se pinta a mano en Sarchí, con flores y estrellas.', 'Antes llevábamos el café en carreta hasta el puerto.'],
};
const HURT = ['¡Ay! ¿Qué le pasa, mae?', '¡Upe! ¡Qué abusivo!', '¡Diay! ¡Más respeto!', '¡Auxilio! ¡Un loco!'];
export const ERRANDS = [
  { id: 268, n: 8, pay: 6, text: '¿Me consigue 8 mazorcas? Le pago 6 colones.' },
  { id: 269, n: 10, pay: 6, text: '¿Me trae 10 frijoles para el gallo pinto? Le doy 6 colones.' },
  { id: 294, n: 12, pay: 10, text: 'Necesito 12 granos de café en cereza. Le pago 10 colones.' },
  { id: 297, n: 3, pay: 9, text: 'Se me acabó la tapa de dulce, ¿me trae 3? Le pago 9 colones.' },
  { id: 287, n: 6, pay: 5, text: '¿Tiene 6 huevos? Le doy 5 colones.' },
  { id: 257, n: 16, pay: 8, text: 'Ocupo 16 carbones para el fogón. Le doy 8 colones.' },
  { id: 258, n: 5, pay: 12, text: 'Tráigame 5 de hierro para unas herramientas. Son 12 colones.' },
  { id: 275, n: 6, pay: 5, text: '¿Me trae 6 bananos? Le pago 5 colones.' },
  { id: 277, n: 2, pay: 10, text: 'Quiero 2 plumas de lapa para un adorno. Le doy 10 colones.' },
  { id: 279, n: 2, pay: 8, text: '¿Me consigue 2 de miel de melipona para la tos? 8 colones.' },
];

// tiendas: [id, cantidad, precio en colones]
export const SHOPS = {
  buhonero: {
    title: 'La carretilla de Don Carlos',
    sell: [[K.obsidian, 1, 10], [K.calcite, 4, 8], [499, 1, 20], [501, 1, 14], [500, 1, 14], [440, 2, 6], [K.farol, 1, 14], [444, 1, 30]],
    buy: [[268, 4, 2], [269, 8, 2], [294, 8, 3], [275, 4, 2], [467, 3, 5], [297, 1, 3]],
  },
  taquillera: { title: 'Taquilla de los termales', sell: [[1169, 1, 6]], buy: [] },
  pulpero: {
    title: 'Pulpería de Don Mario',
    sell: [[571, 1, 30], [562, 4, 2], [533, 1, 2], [521, 1, 8], [523, 1, 6], [263, 1, 3], [270, 2, 2], [422, 4, 2], [425, 1, 6], [267, 4, 2], [269, 4, 2], [294, 4, 3], [289, 1, 8], [282, 1, 6], [283, 3, 3], [K.torch, 8, 3], [K.bed, 1, 10], [293, 1, 14],
      [K.lamp, 2, 6], [281, 1, 8], [TOOL_IDS.iron_pickaxe, 1, 25], [K.glass, 8, 4], [444, 1, 25], [445, 1, 8], [K.teja, 16, 5], [K.paint_blue, 8, 4], [K.paint_pink, 8, 4], [367, 3, 2], [357, 1, 8], [358, 1, 10], [326, 1, 12], [327, 8, 3], [325, 1, 15], [374, 4, 6], [391, 1, 3], [K.dynamite, 2, 6], [K.farol, 2, 6], [375, 1, 4], [376, 1, 20], [471, 1, 12], [473, 1, 4], [474, 1, 2], [475, 6, 2], [476, 1, 25], [479, 1, 15], [491, 1, 2]],
    buy: [[465, 1, 30], [K.cristal, 4, 6], [461, 1, 3], [369, 1, 12], [268, 4, 1], [269, 8, 1], [294, 8, 2], [297, 1, 2], [287, 4, 1], [271, 2, 2], [257, 8, 1], [258, 2, 3], [259, 1, 10], [260, 1, 15], [273, 1, 25], [278, 1, 30], [279, 1, 3], [277, 1, 4], [361, 2, 2], [362, 2, 2], [363, 2, 2], [364, 1, 4], [369, 1, 20], [368, 1, 1], [371, 1, 30], [372, 1, 25], [373, 1, 25]],
    fiado: true,
  },
  mercader: {
    title: 'Tramo de Don Chalo (Mercado Central)',
    sell: [[492, 1, 3], [494, 1, 6], [488, 1, 6], [487, 1, 35], [480, 3, 2], [466, 2, 3], [467, 1, 2], [295, 4, 3], [297, 2, 3], [384, 2, 3], [K.madera_carreta, 4, 4], [K.rueda_carreta, 2, 5], [1150, 1, 40], [1151, 1, 40], [1152, 1, 40], [376, 1, 18], [K.flower_red, 4, 1], [K.flower_yellow, 4, 1], [K.bed, 1, 9]],
    buy: [[467, 3, 4], [294, 8, 2], [275, 4, 1], [276, 3, 2], [268, 4, 1], [297, 1, 2], [384, 2, 2]],
  },
  churchillero: {
    title: 'Churchill del Paseo de los Turistas',
    sell: [[381, 1, 3], [382, 1, 2], [383, 1, 2], [276, 2, 2], [299, 1, 2]],
    buy: [[275, 4, 1], [276, 3, 2], [292, 1, 3], [297, 1, 2]],
  },
  pescador: {
    title: 'Mariscos del muelle de Caldera',
    // v12.8.2 (orquestadora): el muelle ya no vende pargo ni corvina, y el dorado lo vende caro (más de 1.25 × lo que paga): si no,
    // la regla de oro (abajo) bajaba a 0.5 u lo que se paga por ellos y la pesca de orilla no daba ni para comer
    sell: [[562, 4, 2], [364, 1, 9], [366, 1, 6], [365, 1, 4], [367, 4, 2], [357, 1, 7], [358, 1, 9], [1100, 1, 30], [1102, 6, 1], [1103, 4, 1]],
    buy: [[361, 4, 3], [362, 4, 3], [363, 2, 2], [364, 1, 3], [369, 1, 18], [368, 1, 1], // v12.8.4: pargo y corvina 0.75, dorado 3 (el pescador quedaba en 57 u al día)
      [1105, 2, 1], [1106, 2, 1], [1108, 1, 1], [1107, 2, 2], [1109, 2, 2], [1110, 2, 3], [1111, 2, 5], [1112, 2, 2], [1114, 2, 1], [1116, 1, 1], [1115, 4, 1], [1113, 1, 6]], // v12.7.0: las especies nuevas; v12.7.2: los mariscos
  },
  minisuper: {
    title: 'Minisúper El Dragón Dorado',
    sell: [[562, 4, 2], [533, 1, 2], [263, 2, 2], [270, 3, 2], [287, 4, 2], [299, 1, 2], [297, 2, 3], [295, 4, 3], [367, 4, 2], [K.torch, 8, 3], [289, 1, 7], [282, 1, 6], [374, 2, 4], [K.lamp, 2, 5]],
    buy: [[268, 4, 1], [269, 8, 1], [287, 4, 1], [294, 8, 2], [275, 4, 1]],
  },
  panadera: {
    title: 'Panadería El Trigal',
    sell: [[263, 2, 3], [270, 2, 2], [353, 1, 5], [396, 2, 3], [298, 1, 2], [299, 1, 2]],
    buy: [[268, 6, 1], [287, 4, 1], [292, 1, 3], [297, 1, 2]],
  },
  carnicero: {
    title: 'Carnicería El Novillo',
    sell: [[262, 3, 4], [265, 2, 5], [397, 3, 4], [271, 2, 3]],
    buy: [[262, 2, 2], [271, 2, 2]],
  },
  farmaceutica: {
    title: 'Farmacia La Salud',
    sell: [[281, 1, 9], [279, 1, 4], [299, 2, 3], [367, 4, 2], [423, 1, 4], [440, 2, 2], [441, 1, 3], [442, 1, 3], [443, 1, 12]],
    buy: [[279, 1, 3], [284, 1, 6]],
  },
  cantinero: {
    title: 'Cantina El Último Trago',
    sell: [[375, 1, 3], [299, 1, 2], [298, 1, 2], [365, 1, 4], [352, 1, 5]],
    buy: [[296, 4, 1], [297, 1, 2], [367, 4, 1]],
  },
  ferretero: {
    title: 'Ferretería El Clavo',
    sell: [[571, 1, 30], [K.zinc, 8, 4], [K.bloque_concreto, 16, 5], [K.concreto, 16, 5], [K.verja, 8, 5], [K.acera, 16, 4], [K.asfalto, 16, 4], [K.poste, 4, 4], [K.cable, 8, 2], [415, 1, 8], [K.porton, 2, 4], [K.palanca, 1, 3],
      [K.tanque_agua, 1, 6], [K.glass, 8, 4], [K.estante, 2, 4], [K.farol, 2, 6], [K.cerca, 8, 3], [K.teja, 16, 5], [TOOL_IDS.iron_pickaxe, 1, 25], [452, 1, 15], [453, 1, 25], [454, 1, 10], [578, 1, 25], [1101, 1, 90]],
    buy: [[258, 2, 3], [257, 8, 1], [272, 2, 2]],
  },
  frutero: {
    title: 'Venta de frutas al lado de la calle',
    sell: [[275, 4, 2], [276, 2, 2], [377, 3, 2], [382, 1, 2], [367, 4, 1]],
    buy: [[275, 4, 1], [276, 3, 1], [377, 3, 1]],
  },
  copero: {
    title: 'Carrito de copos',
    sell: [[383, 1, 2], [381, 1, 3], [382, 1, 2]],
    buy: [[292, 1, 3], [276, 2, 1]],
  },
  bartender: {
    title: 'Ocean Breeze Beach Club (precios de lujo)',
    lujo: true,
    sell: [[382, 1, 15], [299, 1, 12], [375, 1, 20], [366, 1, 35], [381, 1, 18]],
    buy: [[382, 1, 1], [367, 4, 1]],
  },
  chef_lujo: {
    title: 'The Casado Experience — cocina de autor',
    lujo: true,
    sell: [[351, 1, 30], [350, 1, 25], [352, 1, 28], [353, 1, 22], [365, 1, 30]],
    buy: [[361, 4, 5], [364, 2, 9], [367, 4, 1], [1111, 2, 7], [1110, 1, 2], [1113, 1, 7], [1119, 1, 18]], // v12.8.6 (punto 4): el pescado, más cerca del muelle (pargo 1.25, dorado 4.5, atún 3.5, pez gallo 2, langosta 7)
  },
  barista_lujo: {
    title: 'Third Wave Coffee Lab',
    lujo: true,
    sell: [[298, 1, 12], [295, 2, 15], [299, 1, 10], [263, 1, 9]],
    buy: [[294, 8, 3], [295, 4, 4]],
  },
  funcionario: {
    title: 'Municipalidad — Ventanilla de catastro',
    sell: [[413, 1, 40], [K.cerca, 8, 3], [K.farol, 2, 4]],
    buy: [],
  },
  inmobiliaria: {
    title: 'Paradise Real Estate',
    lujo: true,
    sell: [[389, 1, 999]],
    buy: [[369, 1, 25], [259, 1, 14]],
  },
  sodera_playa: {
    title: 'Soda La Bendición (precios de aquí)',
    sell: [[351, 1, 6], [350, 1, 5], [298, 1, 2], [382, 1, 2], [366, 1, 6], [365, 1, 4]],
    buy: [[361, 1, 1], [362, 1, 1], [364, 2, 7], [367, 4, 1], [1107, 1, 1], [1109, 1, 1], [1110, 2, 3], [1112, 1, 1], [1117, 1, 6], [1118, 1, 5]], // v12.8.2: un poco menos (el pescador pasaba de 70 u al día)
  },
  operador: {
    title: 'Despacho de la planta',
    sell: [[390, 1, 3]],
    buy: [[257, 8, 2], [379, 2, 2]],
  },
  mecanico: {
    title: 'Taller — carros y motos de segunda (como nuevos… casi)',
    sell: [[414, 1, 300], [456, 1, 180], [455, 1, 30], [457, 1, 150], [390, 1, 9]],
    buy: [[258, 4, 3], [390, 1, 6]],
  },
  pistero: {
    title: 'Bomba del pueblo',
    sell: [[390, 1, 8], [299, 1, 2], [263, 1, 2], [K.torch, 4, 2]],
    buy: [[390, 1, 7]],
  },
  caficultor: {
    title: 'Café del beneficio',
    sell: [[458, 1, 3], [295, 4, 3], [298, 2, 3], [K.saco_cafe, 1, 9]],
    buy: [[459, 1, 24], [294, 8, 2], [295, 4, 3]],
  },
  feriante: {
    title: 'Tramo de verduras de la feria',
    sell: [[268, 6, 2], [269, 8, 2], [275, 6, 2], [276, 3, 2], [367, 6, 1], [287, 6, 2], [294, 6, 2]],
    buy: [[268, 4, 1], [269, 8, 1], [275, 6, 1], [276, 3, 1], [377, 4, 1]],
  },
  tamalera: {
    title: 'Tamales y queso de la feria',
    sell: [[353, 2, 5], [396, 3, 3], [292, 1, 4], [394, 3, 3], [393, 3, 3]],
    buy: [[268, 6, 1], [262, 2, 2], [297, 1, 2]],
  },
  sodera: {
    title: 'Soda Doña Rosa',
    sell: [[366, 1, 6], [365, 1, 4], [351, 1, 6], [350, 1, 5], [352, 1, 5], [353, 1, 5], [417, 1, 5], [418, 2, 4], [416, 1, 3], [421, 1, 2], [392, 1, 7], [393, 2, 3], [394, 2, 3], [356, 2, 3], [298, 1, 2], [299, 1, 2], [288, 2, 2], [292, 1, 4]],
    buy: [[361, 1, 1], [362, 1, 1], [364, 2, 7], [1105, 4, 3], [1106, 4, 3], [1108, 2, 3], [265, 2, 2], [292, 1, 3], [276, 3, 2], [275, 4, 1], [295, 4, 2], [288, 2, 1]],
  },
};

// v11.10.4: precios a la escala de 2026 (precios.js): la canasta y lo que solo se compra hecho, en todas las tiendas menos las de
// lujo (que cobran de más a propósito, es la sátira). La cajuela llena paga ₡2 000 (v11.10.6)
for (const [k, s] of Object.entries(SHOPS)) {
  if (/lujo|bartender|inmobiliaria/.test(k)) continue;
  for (const e of s.sell || []) if (ANCLAS[e[0]] !== undefined) e[2] = ANCLAS[e[0]] * e[1];
}
for (const e of (SHOPS.caficultor && SHOPS.caficultor.buy) || []) if (e[0] === 459) e[2] = 4; // v11.10.6: ₡2 000 (medido)

// Regla de oro de la economía: nada se puede comprar y revender con ganancia. Lo que paga una tienda (en su mejor día y
// con la mejor reputación) siempre queda por debajo de lo más barato que cuesta en cualquier otra (también en su mejor
// precio). Se aplica a todas al cargar, así que un ítem nuevo no puede volver a abrir el hueco.
{
  const pagoMax = (c) => Math.round(Math.max(1, Math.round(c * 1.25)) / 0.8);
  const ventaMin = (c) => Math.max(1, Math.round(c * 0.8));
  const minVenta = new Map();
  for (const s of Object.values(SHOPS)) for (const [id, n, c] of s.sell || []) { const u = ventaMin(c) / n; if (!minVenta.has(id) || u < minVenta.get(id)) minVenta.set(id, u); }
  for (const s of Object.values(SHOPS)) for (const e of s.buy || []) {
    const tope = minVenta.get(e[0]);
    if (tope === undefined) continue;
    while (pagoMax(e[2]) / e[1] >= tope * 0.9 && e[1] < 64) { if (e[2] > 1) e[2]--; else e[1]++; }
  }
  // v11.10.6: lo que pagan los clientes de la soda propia, por debajo de lo que cuesta comprar el plato hecho (con propina y todo)
  for (const e of MENU) { const tope = minVenta.get(e[0]); if (tope !== undefined) e[1] = Math.min(e[1], precioBonito(tope * 0.75, false)); }
}
export { MENU }; // para tools/bot-economia.js (lo lee ya topado)

function paintPerson(seed) {
  const rnd = mulberry32(seed);
  const skin = SKIN[Math.floor(rnd() * SKIN.length)], shirt = SHIRTS[Math.floor(rnd() * SHIRTS.length)];
  const pants = rnd() < 0.5 ? [50, 60, 90] : [90, 70, 50];
  return { skin, shirt, pants, hair: rnd() < 0.25 ? [180, 170, 160] : rnd() < 0.5 ? [30, 22, 18] : [70, 44, 26], hat: rnd() < 0.4, skirt: rnd() < 0.4 };
}

const say = (m, g, text) => {
  g.ui.dialog(m.data.name, text);
  g.audio.play('hmm', { pos: m.soundPos(), vol: 0.5, vary: 0.12 });
  m.data.talk = 2;
};

// la sombrilla de los que la cargan (uno de cada tres): se abre con el aguacero
const SOMBRILLAS = [0xc0302a, 0x1a3a8a, 0x1a1a1a, 0x2a7a3a, 0xd8a020, 0x8a2a8a];
function sombrilla(m) {
  const u = m.group.userData;
  if (u.sombrilla) return u.sombrilla;
  const s = new THREE.Group(), col = SOMBRILLAS[(m.data.seed || 1) % SOMBRILLAS.length];
  const mb = (c) => new THREE.MeshBasicMaterial({ color: c });
  const palo = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.95, 0.04), mb(0x3a2a1a)); palo.position.y = 0.47; s.add(palo);
  const tela = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.1, 1.15), mb(col)); tela.position.y = 0.95; s.add(tela);
  const copa = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.12, 0.7), mb(col)); copa.position.y = 1.04; s.add(copa);
  for (const [x, z] of [[0.55, 0.55], [-0.55, 0.55], [0.55, -0.55], [-0.55, -0.55]]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.06), mb(0xe8e0d0)); p.position.set(x, 0.88, z); s.add(p); }
  s.position.set(0.28, 1.05, 0.1); s.visible = false;
  (u.body || m.group).add(s);
  u.sombrilla = s;
  return s;
}
const DICHOS_LLUVIA = ['¡Qué aguacero!', '¡Diay, se vino el agua!', '¡Corra, que se moja!', 'Ya decía yo que el yigüirro estaba cantando…', '¡Se me mojó la ropa del tendedero!', 'Esto no escampa hoy.'];
export const VECINO = {
  name: 'Vecino', w: 0.6, sepW: 0.85, h: 1.8, health: 20, speed: 1.4, hurtSound: 'hmm', idleSound: null, idleEvery: [999, 999],
  particle: [[0.8, 0.6, 0.5]], drops: [],
  build() {
    const g = new THREE.Group();
    g.userData = { body: new THREE.Group(), pending: true };
    g.add(g.userData.body);
    return g;
  },
  // el modelo se arma cuando ya se sabe quién es (colores, pelo y sombrero por persona)
  dress(m) {
    const u = m.group.userData;
    if (!u.pending) return;
    const c = paintPerson(m.data.seed || 1);
    const role = m.data.role;
    const shirt = SHOPS[role] ? [238, 236, 228] : role === 'guarda' ? [40, 50, 90] : role === 'farero' ? [30, 60, 120] : role === 'acomodador' || role === 'canciller' ? [28, 28, 34] : role === 'guardaparques' ? [90, 100, 50] : c.shirt;
    const body = u.body;
    // la ropa: lisa, a cuadros, a rayas, la camiseta de la Sele o la de la afición (rojinegra o morada), sin escudos
    const rr = mulberry32((m.data.seed || 1) * 31 + 7);
    const estilo = SHOPS[role] || ['guarda', 'farero', 'acomodador', 'canciller', 'guardaparques'].includes(role) ? 'lisa' : ['lisa', 'lisa', 'cuadros', 'rayas', 'sele', 'rojinegra', 'morada'][Math.floor(rr() * 7)];
    const camisa = estilo === 'sele' ? [200, 30, 40] : estilo === 'morada' ? [90, 40, 130] : estilo === 'rojinegra' ? [180, 25, 30] : shirt;
    const mangaCorta = ['sele', 'rojinegra', 'morada'].includes(estilo);
    const conFalda = c.skirt && role !== 'sabanero' && role !== 'pulpero';
    body.add(torsoVecino(hx(camisa), estilo, hx(c.skin), hx(conFalda ? shirt.map((v) => v * 0.7) : c.pants), contextura(m.data.seed || 1, conFalda)));
    const conSombrero = c.hat || role === 'sabanero' || role === 'boyero' || role === 'guarda';
    const head = new THREE.Group(); head.position.set(0, 1.51, 0); // con cuello
    head.add(cabezaVecino(hx(c.skin), hx(c.hair), c.skirt && !conSombrero));
    u.blink = cara(head, c, m.data.seed || 1, role);
    // algunos con gorra de visera en vez de sombrero
    if (!conSombrero && rr() < 0.25) head.add(gorra(estilo === 'morada' ? 0x5a2a8a : 0x2a3a7a));
    // sombrero de lona (o de sabanero, más ancho y oscuro)
    if (conSombrero) head.add(sombrero(role === 'sabanero' ? 0x6a4a2a : 0xf0ead8, role === 'sabanero' ? 0.86 : 0.7));
    if (SHOPS[role]) body.add(delantal(role === 'sodera' ? 0xd04060 : 0x3a5a9a));
    if (role === 'beata') head.add(mantilla());
    body.add(head);
    if (conFalda) body.add(falda(hx(shirt.map((v) => v * 0.7))));
    const legs = [];
    for (const x2 of [-0.12, 0.12]) { const l = new THREE.Group(); l.position.set(x2, 0.75, 0); piernaVecino(l, hx(c.pants), role === 'sabanero' ? 0x3a2414 : 0x241c16, conFalda, hx(c.skin), role === 'sabanero' ? 0x4a2e1a : null); body.add(l); legs.push(l); }
    const arms = [];
    for (const x2 of [-0.36, 0.36]) { const a = new THREE.Group(); a.position.set(x2, 1.42, 0); brazoVecino(a, hx(camisa), hx(c.skin), mangaCorta, Math.sign(x2)); body.add(a); arms.push(a); }
    // el sabanero anda con el mecate enrollado
    if (role === 'sabanero') arms[0].add(mecateEnrollado());
    u.head = head; u.legs = legs; u.npcArms = arms;
    u.pending = false;
  },
  brain(m, dt, c) {
    const { g, distP, dxp, dzp } = c;
    const b = m.body.pos;
    const d = m.data;
    // en mejenga: a correr detrás de la bola
    if (d.mejenga && g.mejenga && g.mejenga.ball && !g.mejenga.ball.dead) { const bb = g.mejenga.ball.body.pos; m.goTo(bb.x, bb.z, 1.7); return true; }
    // parpadean de vez en cuando (cada uno a su ritmo)
    const ojos = m.group.userData.blink;
    if (ojos) ojos.scale.y = ((m.t + ((d.seed || 1) % 7)) % 4.3) < 0.12 ? 0.12 : 1;
    // vecino suelto (por comando): su casa y su plaza son donde apareció
    if (!d.home) {
      const here = { x: Math.floor(b.x), y: Math.floor(b.y), z: Math.floor(b.z) };
      Object.assign(d, { home: here, plaza: { ...here }, name: 'Vecino de paso', role: 'vecino', vid: `suelto:${Math.random()}`, seed: 1 + Math.floor(Math.random() * 1e6) });
    }
    if (m.group.userData.pending) this.dress(m);
    if (d.peon && peonBrain(m, dt, c)) return true;
    if (d.reyGente || d.cuidacarros || d.saco || d.baileP || d.torito || d.quedo || d.carretillero || d.lavar) return true; // los mueven sus archivos // los manejan cuidacarros.js, sacos.js y bailes.js
    const night = g.daylight < 0.3;
    const keeper = KEEPERS.has(d.role);
    // el aguacero: los de sombrilla la abren; los demás corren a meterse a la casa
    const W = g.weather, llueve = !!(W && W.type !== 'clear' && W.intensity > 0.35 && g.dim === 'tierra');
    const conSombrilla = (d.seed || 1) % 3 === 0;
    if (conSombrilla || m.group.userData.sombrilla) sombrilla(m).visible = llueve && conSombrilla && !d.inside;
    d.mojandose = false;
    const guion = d.sigue || d.ruta || d.guia || d.influencer || d.partido || !d.vid || String(d.vid).startsWith('suelto');
    if (llueve && !keeper && !d.inside && !conSombrilla && !night && !guion && !(m.panic > 0)) {
      if (d.dijoLluvia !== (g.day || 1) && distP < 12 && Math.random() < 0.02) { d.dijoLluvia = g.day || 1; decir(g, m, DICHOS_LLUVIA[Math.floor(Math.random() * DICHOS_LLUVIA.length)], 2.4); }
      d.lluviaT = (d.lluviaT || 0) + dt;
      if (Math.hypot(d.home.x + 0.5 - b.x, d.home.z + 0.5 - b.z) < 1.6 || distP > 18 || d.lluviaT > 10) { d.lluviaT = 0; b.x = d.home.x + 0.5; b.z = d.home.z + 0.5; b.y = d.home.y + 0.1; d.inside = true; d.walkTo = null; d.porLluvia = true; return true; }
      m.goTo(d.home.x + 0.5, d.home.z + 0.5, 2.1); d.mojandose = true; // corriendo, con las manos en la cabeza
      return true;
    }
    // asustado (le pegaron): se aleja del jugador
    if (m.panic > 0) { m.goTo(b.x - dxp, b.z - dzp, 2.2); return true; }
    // si el jugador está cerca, lo mira y se queda quieto
    if (distP < 3.5) { m.targetYaw = Math.atan2(dxp, dzp); m.moving = false; return true; }
    // de noche se meten a la casa (y de día salen), sin que el jugador los vea
    if (!keeper && distP > 14) {
      if (night && !d.inside) { b.x = d.home.x + 0.5; b.z = d.home.z + 0.5; b.y = d.home.y + 0.1; d.inside = true; d.walkTo = null; }
      else if (!night && d.inside && !(llueve && !conSombrilla)) { d.porLluvia = false; b.x = d.plaza.x + (Math.random() - 0.5) * 10; b.z = d.plaza.z + (Math.random() - 0.5) * 6; b.y = d.plaza.y + 0.5; d.inside = false; d.walkTo = null; }
    }
    if (m.thinkT <= 0) {
      m.thinkT = 3 + Math.random() * 6;
      if (keeper || d.inside) d.walkTo = Math.random() < 0.5 ? { x: d.home.x + 0.5 + (Math.random() - 0.5) * 2, z: d.home.z + 0.5 + (Math.random() - 0.5) * 2 } : null;
      else if (Math.hypot(d.plaza.x - b.x, d.plaza.z - b.z) > 14) d.walkTo = { x: d.plaza.x + (Math.random() - 0.5) * 12, z: d.plaza.z + (Math.random() - 0.5) * 8 };
      else d.walkTo = Math.random() < 0.55 ? { x: b.x + (Math.random() - 0.5) * 10, z: b.z + (Math.random() - 0.5) * 10 } : null;
    }
    if (d.walkTo) { m.goTo(d.walkTo.x, d.walkTo.z, 1); if (!m.moving) d.walkTo = null; } else m.moving = false;
    return true;
  },
  animate(m, dt, u) {
    if (m.data.baileP || m.data.lavar) return; // los brazos los mueven bailes.js y rioypatio.js
    if (m.data.guitarra && u.npcArms) { u.npcArms[0].rotation.x = -0.9; u.npcArms[0].rotation.z = 0.5; u.npcArms[1].rotation.x = -0.7 + Math.sin(m.t * 12) * 0.25; return; } // el serenatero rasguea
    // el del torito lleva el armazón con los dos brazos arriba
    if (m.data.torito && u.npcArms) { u.npcArms.forEach((a, i) => { a.rotation.x = -2.9 + Math.sin(m.t * 9 + i) * 0.08; a.rotation.z = (i ? -1 : 1) * 0.15; }); return; }
    // el cuidacarros agita la franela con el brazo arriba
    if (m.data.cuidacarros && u.npcArms) { u.npcArms[1].rotation.x = -2.6 + Math.sin(m.t * 7) * 0.35; u.npcArms[1].rotation.z = Math.sin(m.t * 3.5) * 0.4; if (u.franela) u.franela.rotation.z = Math.sin(m.t * 9) * 0.6; const sw2 = Math.sin(m.walk) * m.walkAmt; u.npcArms[0].rotation.x = -sw2 * 0.6; return; }
    if (u.bandera) { const tela = u.bandera.children[0]; tela.rotation.y = Math.sin(m.t * 7 + (m.data.seed || 0)) * 0.35; tela.scale.z = 1 + Math.sin(m.t * 9) * 0.06; }
    if (!u.npcArms) return;
    // si se moja, pega o habla, el gesto se suelta (antes el codo se quedaba doblado del último cuadro del gesto)
    if (m.data.mojandose || m.data.golpe > 0 || m.data.talk > 0) { m.gesto = null; for (const a of u.npcArms) a.codoMeta = undefined; }
    const sw = Math.sin(m.walk) * m.walkAmt;
    u.npcArms.forEach((a, i) => { a.rotation.x = (i ? sw : -sw) * 0.6; a.rotation.z = 0; });
    if (m.data.mojandose) u.npcArms.forEach((a, i) => { a.rotation.x = -2.7; a.rotation.z = (i ? -1 : 1) * 0.5; }); // corriendo del aguacero, las manos en la cabeza
    else if (u.sombrilla && u.sombrilla.visible) { u.npcArms[1].rotation.x = -1.2; u.npcArms[1].rotation.z = -0.2; } // sosteniendo la sombrilla
    if (m.data.golpe > 0) { m.data.golpe = Math.max(0, m.data.golpe - dt); const q = 1 - m.data.golpe / 0.3; u.npcArms[1].rotation.x = q < 0.35 ? -2.4 * (q / 0.35) : -2.4 + Math.sin(((q - 0.35) / 0.65) * Math.PI * 0.5) * 2.7; }
    else if (m.data.talk > 0) {
      // habla con las manos, como buen tico
      m.data.talk -= dt;
      u.npcArms[1].rotation.x = -0.7 + Math.sin(m.t * 7) * 0.35;
      u.npcArms[1].rotation.z = Math.sin(m.t * 5) * 0.2;
      u.headRx = Math.sin(m.t * 3.1) * 0.05; // asiente mientras habla
    } else gestoVecino(m, dt, u);
  },
  onHurt(m, g) {
    if (m.data.impostor) { revelar(g, 'golpe'); return false; }
    if (m.data.saqueador) return; // v12.6.3: atraparlo no es pegarle a un vecino (arrecife.js)
    m.panic = 4;
    say(m, g, HURT[Math.floor(Math.random() * HURT.length)]);
    g.meta.reputation = (g.meta.reputation || 0) - 1;
  },
  interact(m, g) {
    const d = m.data;
    if (d.alHablar && d.alHablar(m, g)) return true; // v12.7.1: vecinos con diálogo propio (Doña Lía)
    if (impostorInteract(m, g)) return true;
    if (pangaInteract(m, g)) return true;
    if (alfareroInteract(m, g)) return true;
    if (juradoInteract(m, g)) return true;
    if (serenateroInteract(m, g)) return true;
    if (firmaInteract(m, g)) return true;
    if (audienciaInteract(m, g)) return true;
    if (genteInteract(m, g)) return true;
    if (primaInteract(m, g)) return true;
    if (correoInteract(m, g)) return true;
    if (guiaInteract(m, g)) return true;
    if (permisoInteract(m, g)) return true;
    if (vendedorPresaInteract(m, g)) return true;
    if (carretilleroInteract(m, g)) return true;
    if (rigoInteract(m, g)) return true;
    if (inspectorInteract(m, g)) return true;
    if (guilaInteract(m, g, g.inventory.held)) return true;
    if (anselmoInteract(m, g, g.inventory.held)) return true;
    if (peonFincaInteract(m, g)) return true;
    if (atarrayaInteract(m, g)) return true;
    if (historiaInteract(m, g)) return true;
    if (eleccionInteract(m, g)) return true;
    if (torneoInteract(m, g)) return true;
    if (tiroInteract(m, g)) return true;
    if (cuidacarrosInteract(m, g)) return true;
    if (chumicosInteract(m, g)) return true;
    if (bingoInteract(m, g)) return true;
    if (comiteInteract(m, g)) return true; // v12.15.3 (C8-C): Don Evelio
    if (patronalInteract(m, g)) return true; // v12.15.4 (C8-B): el presidente de la junta y la cimarrona
    if (!KEEPERS.has(d.role) && peonInteract(m, g)) return true;
    if (turistaInteract(m, g)) return true;
    if (trenInteract(m, g)) return true;
    if (economiaInteract(m, g)) return true;
    if (misionInteract(m, g)) return true;
    if (d.role === 'lotero') {
      // un chance cuesta 2 colones
      if (g.inventory.count(COLON) < 2) { say(m, g, 'El chance vale 2 colones, mi amor. Vuelva cuando tenga.'); return true; }
      g.inventory.remove(COLON, 2);
      const r = Math.random();
      let win = 0, text;
      if (r < 0.04) { win = 40; text = '¡EL GORDO! ¡40 colones! ¡Pura vida, qué suerte!'; }
      else if (r < 0.16) { win = 8; text = '¡Ganó 8 colones! Se lo dije, este número era el bueno.'; }
      else if (r < 0.36) { win = 2; text = 'Reintegro: le devuelvo sus 2 colones. ¿Otro?'; }
      else text = ['Uy, casi… salió el 23. ¿Otro chance?', 'Nada esta vez. La suerte está a la vuelta.', 'No pegó… pero el próximo es el bueno.'][Math.floor(Math.random() * 3)];
      if (win) { g.inventory.add(COLON, win); g.audio.play('monedas', { ui: true, vol: 0.5 }); }
      if (win >= 40) g.achieve('gordo', '¡Me pegué el gordo!');
      say(m, g, text);
      return true;
    }
    if (d.role === 'recepcionista') {
      if (g.daylight > 0.35) { say(m, g, 'El check-in es a las 3… de la mañana siguiente. Vuelva de noche: la habitación cuesta 60 colones.'); return true; }
      if (g.inventory.count(COLON) < 60) { say(m, g, 'Lo siento, la noche es de 60 colones. Hay cabinas en el pueblo a 4… pero no tienen piscina infinita.'); g.achieve('sin_plata', 'No me alcanza ni para la pipa'); return true; }
      g.inventory.remove(COLON, 60);
      say(m, g, '¡Disfrute su estadía! El desayuno se cobra aparte.');
      g.achieve('noche_lujo', 'Noche de lujo');
      g.ui.sleepFade(() => { if (g.time > 0.5) g.day++; g.time = 0.02; g.player.health = g.player.maxHealth; }, () => g.ui.toast(`Día ${g.day} · Buenos días en el resort (la cuenta llega al rato)`, 2400));
      return true;
    }
    // el mecánico o la llantera: si hay un carro cerca con llantas reventadas, se las cambia
    if (d.role === 'mecanico') {
      const r = repairCar(g);
      if (r && !r.startsWith('Ese carro está bien')) { say(m, g, r); return true; }
    }
    // la municipalidad: primero el permiso de la soda (si tiene soda), después la escritura del lote
    if (tramiteSoda(m, g)) return true;
    if (d.role === 'funcionario') {
      const day = g.day || 1;
      if (!g.meta.tramite) { g.meta.tramite = day; say(m, g, 'Para la escritura del lote ocupa la copia de la cédula, el plano catastrado y un timbre fiscal. El sistema está caído: vuelva mañana.'); g.achieve('tramite', 'Vuelva mañana'); return true; }
      if (day <= g.meta.tramite) { say(m, g, LINES.funcionario[Math.floor(Math.random() * LINES.funcionario.length)] + ' (Vuelva mañana)'); return true; }
      say(m, g, `Ah sí, ya salió su trámite. Son ${ANCLAS[413]} colones por la escritura; las estacas van por su cuenta.`);
      g.ui.openShop(m);
      return true;
    }
    if (SHOPS[d.role] && SHOPS[d.role].lujo && g.inventory.count(COLON) < 15) g.achieve('sin_plata', 'No me alcanza ni para la pipa');
    if (recetaDeVecino(m, g)) return true;
    if (SHOPS[d.role] && cerrado(g, d.role)) { say(m, g, CERRADO[Math.floor(Math.random() * CERRADO.length)]); g.achieve('cerrado', 'Llegué tarde a la pulpe'); return true; }
    if (entregarMandado(m, g)) return true; // v12.4.12 (C8-A): el recado del tablón
    if (d.role === 'feriante' && concursoFeria(m, g)) return true; // v12.4.2: el concurso de la mejor cosecha
    if (SHOPS[d.role]) { say(m, g, LINES[d.role][Math.floor(Math.random() * LINES[d.role].length)]); g.ui.openShop(m); return true; }
    // la doctora del Ebáis lo cura (gratis: la Caja paga)
    if (d.role === 'doctora' && (g.player.health < g.player.maxHealth || g.player.effects.fiebre)) { g.player.health = g.player.maxHealth; delete g.player.effects.fiebre; say(m, g, 'Siéntese, déjeme ver… listo, como nuevo. Esto lo paga la Caja.'); g.achieve('ebais', 'Ficha en el Ebáis'); return true; }
    if (d.role === 'peajero') {
      if (g.inventory.count(COLON) >= 1) { g.inventory.remove(COLON, 1); say(m, g, 'Gracias, son 1 colón. El peaje se usa para mantener la carretera… dicen.'); g.audio.play('monedas', { ui: true, vol: 0.4 }); g.achieve('peaje', 'Pagué el peaje'); }
      else say(m, g, 'Sin plata no pasa… bueno, pase, pero no le diga a nadie.');
      return true;
    }
    if (d.role === 'constructor') { say(m, g, LINES.constructor[Math.floor(Math.random() * LINES.constructor.length)]); g.achieve('obra', 'Trabajamos para usted'); return true; }
    if (d.role === 'funcionario' || d.role === 'fila') { say(m, g, LINES[d.role][Math.floor(Math.random() * LINES[d.role].length)]); if (d.role === 'funcionario') g.achieve('tramite', 'Vuelva mañana'); return true; }
    // a veces cuentan de algún lugar cercano que usted no conoce
    if (Math.random() < 0.3) { const r = g.rumor(); if (r) { say(m, g, r); return true; } }
    // encargos (se guardan en el mundo por vecino)
    const all = g.meta.errands || (g.meta.errands = {});
    const q = all[d.vid];
    if (q && q.id && g.inventory.count(q.id) >= q.n) {
      g.inventory.remove(q.id, q.n);
      const left = g.inventory.add(COLON, q.pay);
      if (left) g.entities.dropItem(COLON, left, g.player.body.pos.x, g.player.body.pos.y + 1, g.player.body.pos.z);
      say(m, g, `¡Muchísimas gracias! Aquí están sus ${q.pay} colones. ¡Pura vida!`);
      all[d.vid] = { done: (q.done || 0) + 1, cd: (g.clock || 0) + 180 };
      g.meta.reputation = (g.meta.reputation || 0) + 1;
      g.audio.play('monedas', { ui: true, vol: 0.5 });
      g.achieve('encargo', 'Mandadero del pueblo');
      g.addXP(5);
      if (all[d.vid].done >= 3) g.achieve('vecino_fiel', 'Ya es parte del pueblo');
      return true;
    }
    if (q && q.id) { say(m, g, `Todavía le estoy esperando… ${q.text}`); return true; }
    if ((!q || (g.clock || 0) > (q.cd || 0)) && Math.random() < 0.55) {
      const e = ERRANDS[Math.floor(Math.random() * ERRANDS.length)];
      all[d.vid] = { ...e, done: q ? q.done || 0 : 0 };
      say(m, g, e.text);
      return true;
    }
    const lines = LINES[d.role] || LINES.vecino;
    if (g.disguised) { say(m, g, ['¡Qué mascarada más chiva! ¿Es para el tope?', '¡Jajaja! ¡Diay, parece el Diablo de la cimarrona!', '¿Y esa cabezona? ¡Está buenísima!'][Math.floor(Math.random() * 3)]); return true; }
    if (g.player.effects.mareo) { say(m, g, ['Mae… ¿usted anda tomado? Vaya a dormir.', '¡Upe! Ese guaro de caña pega duro, ¿verdad?'][Math.floor(Math.random() * 2)]); return true; }
    // a veces comentan el clima, la hora o lo que dicen de uno en el pueblo
    const extra = [];
    if (g.weather && g.weather.intensity > 0.4) extra.push('¡Qué aguacero, mae! Mejor ni salir.');
    if (g.daylight < 0.3) extra.push('Ya es tarde, me voy a acostar. ¡Buenas noches!');
    if ((g.meta.reputation || 0) >= 5) extra.push('¡Usted es lo máximo! Todo el pueblo habla bien de usted.');
    if ((g.meta.reputation || 0) < -2) extra.push('Mmm… a usted lo tengo en la mira.');
    extra.push(...frasesHistoria(g));
    const pool = extra.length && Math.random() < 0.5 ? extra : lines;
    say(m, g, pool[Math.floor(Math.random() * pool.length)]);
    return true;
  },
};

// Pone al vecino del pueblo si todavía no está en el mundo.
export function spawnVillager(g, npc) {
  const vid = `${npc.village}:${npc.name}`;
  if (g.entities.mobs.some((m) => m.data && m.data.vid === vid && !m.dead)) return null;
  // animales de las estructuras (bueyes de la carreta, bote del muelle)
  if (npc.mob) {
    const m = g.entities.spawnMob(npc.mob, npc.x + 0.5, npc.y + 0.3, npc.z + 0.5);
    m.data = { vid, structure: true };
    if (npc.frozen) { m.frozen = true; m.yaw = m.targetYaw = npc.yaw || 0; }
    if (npc.tamed) m.tamed = true;
    return m;
  }
  const night = g.daylight < 0.3;
  const keeper = KEEPERS.has(npc.role);
  const plaza = { x: npc.vx + 0.5, y: npc.vy, z: npc.vz + 0.5 };
  const inside = keeper || night;
  const x = inside ? npc.x + 0.5 : plaza.x + (Math.random() - 0.5) * 12;
  const z = inside ? npc.z + 0.5 : plaza.z + (Math.random() - 0.5) * 8;
  const m = g.entities.spawnMob('vecino', x, (inside ? npc.y : plaza.y) + 0.2, z);
  m.data = { vid, name: npc.name, role: npc.role, seed: Math.abs(Math.floor(hash3(7, npc.vx, npc.x, npc.z) * 1e6)) + 1, home: { x: npc.x, y: npc.y, z: npc.z }, plaza, inside };
  m.kind.dress(m);
  return m;
}

// Campanas de la iglesia (hora del juego: 0 amanecer, 0.25 mediodía, 0.5 atardecer).
export const BELL_TIMES = [0.03, 0.25, 0.47];
