// Comandos de prueba: /prueba <cosa> lleva directo a cualquier parte del juego sin esperar 15 días. Son trampa a propósito: mejor usarlos en
// un mundo aparte. La guía para probar todo está en docs/GUIA_DE_PRUEBA.md.
import { BLOCK_BY_KEY as K, TOOL_IDS, ITEMS, SOLID } from './blocks.js';
import { CAPITULOS, escenaFinal } from './historia.js';
import { structuresNear } from './estructuras.js';
import { pruebaNemesis } from './nemesis.js';
import { pruebaGrieta } from './anselmo.js';
import { platoPrueba } from './plato.js';
import { pruebaExpediente } from './expediente.js';
import { pruebaGente, pruebaCaserio } from './gente.js';
import { pruebaPrima } from './prima.js';
import { pruebaCorreo } from './correo.js';
import { pruebaQuema } from './quema.js';
import { pruebaBravos } from './bravos.js';
import { pruebaNeblina } from './neblina.js';
import { pruebaMarabunta } from './marabunta.js';
import { pruebaSebusca } from './recompensas.js';
import { pruebaProcesion } from './procesion.js';
import { pruebaBailarin } from './bailarin.js';
import { pruebaPlaya } from './playa2.js';
import { pruebaAsalto } from './asalto.js';
import { pruebaLahar } from './lahar.js';
import { pruebaPalo } from './palo.js';
import { pruebaToros } from './toros.js';
import { pruebaTsunami } from './tsunami.js';
import { pruebaPlaga } from './plaga.js';
import { pruebaBichos2 } from './bichos2.js';
import { pruebaGoleta } from './goleta.js';
import { pruebaPezVela } from './pezvela.js';
import { pruebaBomba } from './bombas.js';
import { pruebaLunaRoja } from './lunaroja.js';
import { pruebaMinaOro } from './minaoro.js';
import { pruebaFestival } from './festival.js';
import { pruebaRifa } from './rifa.js';
import { pruebaAbigeato } from './abigeato.js';
import { pruebaConcurso } from './concurso.js';
import { pruebaSerenata } from './serenata.js';
import { pruebaClasico } from './clasico.js';
import { pruebaTerremoto } from './terremoto.js';
import { pruebaImpostor } from './impostor.js';
import { pruebaFurtivos } from './furtivos.js';
import { pruebaPerezosoCalle } from './perezosocalle.js';
import { pruebaIncendio } from './incendio.js';
import { pruebaChompipe } from './chompipe.js';
import { pruebaGlobo } from './globo.js';
import { pruebaRanas } from './ranas.js';
import { pruebaArcoirisCielo } from './arcoiris.js';
import { pruebaFauna4 } from './fauna4.js';
import { pruebaCarrera } from './carrera.js';
import { pruebaFumiga } from './fumigadora.js';
import { pruebaPanga } from './panga.js';
import { pruebaAlfarero } from './alfarero.js';
import { pruebaTrenFantasma } from './trenfantasma.js';
import { pruebaArmas } from './armas3.js';
import { pruebaBichos3 } from './bichos3.js';
import { pruebaJefes2 } from './jefes2.js';
import { pruebaFinal } from './final.js';
import { pruebaFuerza } from './fuerza.js';
import { pruebaEstrellas } from './estrellas.js';
import { pruebaIncursion } from './incursiones.js';
import { pruebaAbejas } from './abejas.js';
import { pruebaHongos } from './hongos.js';
import { pruebaCuevaVida } from './cuevavida.js';
import { pruebaArchivo } from './archivo.js';
import { pruebaEpilogo } from './epilogo.js';

const ANCHO = 9, FONDO = 7;
const AYUDA = [
  '/prueba equipo cuero|hierro|diamante|jade [estrellas]: arma, armadura, comida y vendas',
  '/prueba cosas: una de cada cosa nueva (yunque, tranca, aceite, candela, chancleta, trofeos…)',
  '/prueba dia N · /prueba vida · /prueba colones N',
  '/prueba casa (ir) · /prueba arreglada (la casa ya lista) · /prueba nivel 2|3|4',
  '/prueba capitulo 1 a 9 · /prueba final (la Noche Larga, ya en la casa) · /prueba terminada (historia terminada)',
  '/prueba asedio · /prueba apuro · /prueba ceniza: arrancan esa pelea',
  '/prueba nido · /prueba hallazgo · /prueba mina (boca de mina) · /prueba derrumbe',
  '/prueba rigo · /prueba canelo · /prueba buhonero · /prueba peon · /prueba guila · /prueba escondite',
  '/prueba ladrona · /prueba grande · /prueba playa · /prueba inspector · /prueba manas · /prueba nemesis · /prueba grieta · /prueba plato · /prueba expediente · /prueba gente · /prueba caserio · /prueba prima · /prueba correo · /prueba quema · /prueba neblina · /prueba marabunta · /prueba sebusca [tipo] · /prueba procesion · /prueba bailarin · /prueba playa2 · /prueba asalto · /prueba lahar · /prueba palo · /prueba toros · /prueba bravos [saino|cuche_monte|chupacabras|toro_guaco|chata|mico_malo|becquer|puma|coral|falsa_coral] · /prueba archivo · /prueba epilogo · /prueba album',
];
function ir(g, x, z) {
  const P = g.player, p = P.body.pos;
  p.x = x + 0.5; p.z = z + 0.5; p.y = Math.max(g.world.gen.column(Math.floor(x), Math.floor(z)).h + 3, 66);
  P.body.vel.x = P.body.vel.y = P.body.vel.z = 0; P.body.fallStart = null; g.ready = false;
}
const irCasa = (g) => { const H = g.meta.hist; ir(g, H.casa.x + ANCHO / 2, H.casa.z + FONDO + 3); };
function arreglada(g) {
  const H = g.meta.hist;
  H.hogar = true; H.construida = true;
  if ((H.cap || 0) < 2) { H.cap = 2; H.paso = 0; }
}
function equipo(g, mat, est) {
  const M = { cuero: ['stone', 330], hierro: ['iron', 334], diamante: ['diamond', 338], jade: ['jade', 342] }[mat];
  if (!M) return ['Uso: /prueba equipo cuero|hierro|diamante|jade [estrellas]'];
  const inv = g.inventory, mejora = Math.min(3, Number(est) || 0);
  const espada = TOOL_IDS[`${M[0]}_sword`], pico = TOOL_IDS[`${M[0]}_pickaxe`], hacha = TOOL_IDS[`${M[0]}_axe`];
  for (const id of [espada, pico, hacha]) if (id) { inv.add(id, 1); if (mejora) { const s = inv.slots.find((q) => q && q.id === id); if (s) s.mejora = mejora; } }
  for (let i = 0; i < 4; i++) inv.armor[i] = { id: M[1] + i, count: 1, dur: ITEMS[M[1] + i].durability, ...(mejora ? { mejora } : {}) };
  inv.add(351, 8); inv.add(392, 4); inv.add(440, 6); inv.add(K.torch, 16); inv.changed();
  return [`Listo: equipo de ${mat}${mejora ? ` con ${mejora} estrellas` : ''}, comida y vendas`];
}
export function comandoPrueba(g, parts) {
  const que = (parts[1] || '').toLowerCase(), H = g.meta && g.meta.hist;
  if (!que) return AYUDA;
  if (g.mode !== 'survival') return ['Los comandos de prueba son para el modo supervivencia'];
  if (!H) return ['Espere un segundo a que arranque la historia'];
  if (g.dim !== 'tierra' && que !== 'vida') return ['Solo en la tierra'];
  const conCasa = () => { if (!H.casa) return false; arreglada(g); irCasa(g); return true; };
  switch (que) {
    case 'equipo': return equipo(g, parts[2], parts[3]);
    case 'cosas': {
      for (const [id, n] of [[K.yunque, 1], [K.compostera, 1], [K.puntal, 8], [509, 4], [500, 3], [501, 3], [499, 12], [505, 1], [508, 2], [374, 6], [K.farol_zenaida, 1], [K.cencerro, 1], [K.carpa, 1], [K.estacas, 16], [K.trampa, 2], [K.nasa, 2], [K.barril, 1], [258, 32], [K.trofeo_cadejos, 1], [K.trofeo_arpia, 1], [K.trofeo_rey_murcielago, 1]]) g.giveItem(id, n);
      return ['Listo: revise la mochila'];
    }
    case 'dia': g.day = Math.max(1, Number(parts[2]) || 1); g.time = 0.1; return [`Día ${g.day}, de mañana`];
    case 'vida': { const P = g.player; P.health = P.maxHealth; P.food = 20; P.water = 20; P.effects = {}; return ['Como nuevo']; }
    case 'colones': g.giveItem(360, Math.max(1, Number(parts[2]) || 100)); return ['Colones en la mochila'];
    case 'casa': if (!H.casa) return ['Todavía no se ha escogido la casa']; irCasa(g); return ['A la casa de la abuela'];
    case 'arreglada': if (!conCasa()) return ['Todavía no se ha escogido la casa']; return ['La casa queda como arreglada'];
    case 'nivel': { H.nivel = Math.max(1, Math.min(5, Number(parts[2]) || 1)); return conCasa() ? [`La casa queda en nivel ${H.nivel}`] : ['Falta la casa']; }
    case 'capitulo': {
      const n = Math.max(1, Math.min(CAPITULOS.length, Number(parts[2]) || 1));
      H.cap = n - 1; H.paso = 0; if (n > 2) arreglada(g);
      return [`Capítulo ${n}: ${CAPITULOS[n - 1].titulo}`];
    }
    case 'final': {
      if (['fase2', 'fase3', 'fase4', 'creditos', 'epilogo'].includes(parts[2])) return [pruebaFinal(g, parts[2])]; // v12.16.5: los saltos a cada fase del Rey

      if (!conCasa()) return ['Falta la casa'];
      H.cap = CAPITULOS.length - 1; H.paso = 1; H.pedazos = { tierra: 1, agua: 1, fuego: 1, cielo: 1 }; g.time = 0.6;
      return ['Ya está en la casa, de noche: la Noche Larga arranca en un momento'];
    }
    case 'terminada': if (!conCasa()) return ['Falta la casa']; escenaFinal(g, H); return ['Historia terminada. El Corazón queda en la mochila'];
    case 'asedio': {
      if (!conCasa()) return ['Falta la casa'];
      g.day = Math.max(5, Math.ceil((g.day || 1) / 5) * 5); g.time = 0.52; H.asedioDia = 0; H.asedioAviso = 0;
      return [`Día ${g.day}, cayendo la noche: el asedio arranca en un momento`];
    }
    case 'apuro': {
      const p = g.player.body.pos, v = g.nearestVillage(p.x, p.z, 8);
      if (!v) return ['No hay un pueblo cerca'];
      g.day = Math.max(6, g.day || 1); while (g.day % 5 === 0) g.day++;
      g.meta.apuroDia = null; g.time = 0.47; ir(g, v.v.x, v.v.z);
      return [`Rumbo a la plaza. Día ${g.day}, atardeciendo`];
    }
    case 'ceniza': {
      if (!conCasa()) return ['Falta la casa'];
      H.fin = H.fin || g.day || 1; g.giveItem(K.corazon_tiquicia, 1); g.time = 0.6;
      return ['Ponga el Corazón en el suelo y déle clic derecho. Ya es de noche'];
    }
    case 'nido': g.day = Math.max(5, g.day || 1); g.meta.nidoDia = 0; g.meta.nidos = []; g.time = 0.1; return ['De mañana: un nido crece en un momento y la brújula lo marca'];
    case 'hallazgo': g.meta.hallazgo = null; g.meta.andado = 9999; return ['Camine un poco: el hallazgo aparece adelante'];
    case 'mina': g.meta.hallazgo = null; g.meta.andado = 9999; g.meta.forzarMina = true; return ['Camine un poco: la boca de mina aparece adelante'];
    case 'derrumbe': { const p = g.player.body.pos; g.derrumbe = { t: 2.4, x: Math.floor(p.x), y: Math.floor(p.y), z: Math.floor(p.z) }; g.ui.toast('🧱 ¡El techo está crujiendo!', 2000); return ['Derrumbe en camino (cae si hay techo encima)']; }
    case 'rigo': if (!conCasa()) return ['Falta la casa']; g.day = Math.max(6, g.day || 1); g.time = 0.1; return ['El tío Rigo llega a la casa en un momento'];
    case 'canelo': if (!conCasa()) return ['Falta la casa']; g.time = 0.1; return ['El Canelo está en el patio: déle comida'];
    case 'buhonero': if (!conCasa()) return ['Falta la casa']; g.day = Math.ceil(Math.max(4, g.day || 1) / 4) * 4; g.time = 0.08; return [`Día ${g.day}: Don Carlos llega a la casa en un momento`];
    case 'peon': if (!conCasa()) return ['Falta la casa']; H.nivel = Math.max(H.nivel || 1, 2); g.time = 0.1; return ['Don Chepito llega a la casa en un momento. Siembre algo cerca'];
    case 'guila': if (!conCasa()) return ['Falta la casa']; H.fin = H.fin || g.day || 1; H.finDia = (g.day || 1) - 3; g.time = 0.1; return ['Yendry llega a la casa en un momento'];
    case 'inspector': if (!conCasa()) return ['Falta la casa']; g.day = Math.ceil(Math.max(10, g.day || 1) / 10) * 10; g.time = 0.1; return [`Día ${g.day}: el inspector llega a la casa en un momento`];
    case 'escondite': {
      if (!conCasa()) return ['Falta la casa'];
      H.cap = Math.max(H.cap || 0, 3);
      return ['Mire la brújula: el 📦 marca el escondite'];
    }
    case 'ladrona': case 'grande': {
      const p = g.player.body.pos, w = g.world, x = Math.floor(p.x) + 4, z = Math.floor(p.z);
      let y = Math.floor(p.y) + 6; while (y > 2 && !SOLID[w.getBlock(x, y - 1, z)]) y--;
      g.day = Math.max(g.day || 1, 12); g.time = 0.7;
      g.entities.spawnMob(`sombra_${que}`, x + 0.5, y + 0.2, z + 0.5);
      return [`Sombra ${que}, a la derecha. Ya es de noche`];
    }
    case 'playa': {
      const p = g.player.body.pos;
      for (let r = 40; r < 2400; r += 40) for (let a = 0; a < 24; a++) {
        const x = Math.floor(p.x + Math.cos((a / 24) * 6.283) * r), z = Math.floor(p.z + Math.sin((a / 24) * 6.283) * r), c = g.world.gen.column(x, z);
        if (c.biome === 'beach' && c.h >= 62) { g.time = 0.04; ir(g, x, z); return ['A la playa, de amanecida: cangrejos, ermitaños y Don Macho']; }
      }
      return ['No encontré una playa cerca'];
    }
    case 'manas': g.addXP(Number(parts[2]) || 120); return ['Experiencia: la oferta de mañas se abre sola en un momento'];
    case 'nemesis': return [pruebaNemesis(g)];
    case 'grieta': return [pruebaGrieta(g)];
    case 'plato': return [platoPrueba(g)];
    case 'expediente': return [pruebaExpediente(g)];
    case 'gente': return [pruebaGente(g)];
    case 'caserio': return [pruebaCaserio(g)];
    case 'prima': return [pruebaPrima(g)];
    case 'correo': return [pruebaCorreo(g)];
    case 'quema': return [pruebaQuema(g)];
    case 'bravos': return [pruebaBravos(g, parts[2])];
    case 'neblina': return [pruebaNeblina(g)];
    case 'marabunta': return [pruebaMarabunta(g)];
    case 'sebusca': return [pruebaSebusca(g, parts[2])];
    case 'procesion': return [pruebaProcesion(g)];
    case 'bailarin': return [pruebaBailarin(g)];
    case 'playa2': return [pruebaPlaya(g)];
    case 'asalto': return [pruebaAsalto(g)];
    case 'lahar': return [pruebaLahar(g)];
    case 'palo': return [pruebaPalo(g)];
    case 'toros': return [pruebaToros(g)];
    case 'tsunami': return [pruebaTsunami(g)];
    case 'chapulines': return [pruebaPlaga(g)];
    case 'goleta': return [pruebaGoleta(g)];
    case 'pezvela': return [pruebaPezVela(g)];
    case 'bomba': return [pruebaBomba(g)];
    case 'lunaroja': return [pruebaLunaRoja(g)];
    case 'minaoro': return [pruebaMinaOro(g)];
    case 'festival': return [pruebaFestival(g)];
    case 'rifa': return [pruebaRifa(g)];
    case 'abigeato': return [pruebaAbigeato(g)];
    case 'concurso': return [pruebaConcurso(g)];
    case 'serenata': return [pruebaSerenata(g)];
    case 'clasico': return [pruebaClasico(g)];
    case 'terremoto': return [pruebaTerremoto(g)];
    case 'impostor': return [pruebaImpostor(g)];
    case 'furtivos': return [pruebaFurtivos(g)];
    case 'perezoso': return [pruebaPerezosoCalle(g)];
    case 'incendio': return [pruebaIncendio(g)];
    case 'chompipe': return [pruebaChompipe(g)];
    case 'globo': return [pruebaGlobo(g)];
    case 'ranas': return [pruebaRanas(g)];
    case 'arcoiris': return [pruebaArcoirisCielo(g)];
    case 'fauna4': return [pruebaFauna4(g)];
    case 'carrera': return [pruebaCarrera(g)];
    case 'fumigadora': return [pruebaFumiga(g)];
    case 'panga': return [pruebaPanga(g)];
    case 'alfarero': return [pruebaAlfarero(g)];
    case 'trenfantasma': return [pruebaTrenFantasma(g)];
    case 'armas': return [pruebaArmas(g)];
    case 'bichos3': return [pruebaBichos3(g, parts[2])];
    case 'jefes2': return [pruebaJefes2(g, parts[2])];
    case 'zopilote': return [pruebaFinal(g, parts[2])];
    case 'fuerza': return [pruebaFuerza(g)];
    case 'estrellas': return [pruebaEstrellas(g)];
    case 'incursion': return [pruebaIncursion(g)];
    case 'abejas': return [pruebaAbejas(g)];
    case 'hongos': return [pruebaHongos(g)];
    case 'cuevavida': return [pruebaCuevaVida(g)];
    case 'muneco': g.giveItem(559, 1); return ['Un muñeco de práctica en la mochila: póngalo en el suelo'];
    case 'sereno': { g.time = 0.75; return ['Ya es de noche: vaya a un pueblo y verá a Don Fermín haciendo la ronda con su farol']; }
    case 'ermitas': g.giveItem(K.ermita, 2); return ['Dos ermitas en la mochila: ponga una aquí y otra lejos'];
    case 'torsalo': case 'bala': case 'bocaraca': return [pruebaBichos2(g, que)];
    case 'archivo': return [pruebaArchivo(g)];
    case 'album': g.giveItem(521, Number(parts[2]) || 10); return ['Sobres de estampas en la mochila: clic derecho para abrirlos'];
    case 'epilogo': return [pruebaEpilogo(g)];
    case 'lugares': return [structuresNear(g.world.gen, g.player.body.pos.x, g.player.body.pos.z, 800).slice(0, 8).map((s) => s.type).join(', ') || 'nada cerca'];
    default: return AYUDA;
  }
}
