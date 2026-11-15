// El juego en marcha: render, entrada, interacción con bloques, combate, supervivencia y guardado.
import { BRILLO, luzDeAjuste } from './brillo.js';
import { alCambiarBloqueOficio, tickMostradores, usarTaller, usarLibroOficio, bonoOficio, velocidadCaballo } from './oficios2.js';
import { fogatas, usarFogata, usarFogon, alCambiarBloque, tickLena, tickDespensa, factorComida, bonoMesa, alComerDespensa } from './despensa.js';
import { flagsDe, aplicarDefines, actualizarAtmosfera, ANISO } from './atmosfera.js';
import { premioBaja, esJefe } from './precios.js';
import { tickFxGolpes, limpiarFxGolpes, avisoVivo } from './golpes.js';
import { calmaActiva } from './calma.js';
import * as THREE from 'three';
import { World, SHADER_TIME, SKY_LIGHT } from './world.js';
import { Player } from './player.js';
import { Inventory } from './inventory.js';
import { Entities, MOB_TYPES } from './entities.js';
import { Stations, facingFromLook, FACING_VEC } from './stations.js';
import { Sky, DAY_LENGTH } from './sky.js';
import { FarTerrain } from './lod.js';
import { Weather } from './weather.js';
import { tickNests } from './fauna.js';
import { spawnVillager, BELL_TIMES } from './pueblo.js';
import { boatRide, Bobber, fishLoot } from './mar.js';
import { carRide, CARRO_ITEM } from './vehiculos.js';
import { tickBus, busRide } from './bus.js';
import { POLEA, startZip, zipUpdate } from './tirolesa.js';
import { Avatar } from './avatar.js';
import { tickCharcos } from './charcos.js';
import { difOf, dropBolso, tickBolso, tickFrio, bolsitoInicio, tickConsejos, tickCuerpo } from './supervivencia.js';
import { animarAbrir, tickPortones } from './portones.js';
import { tickZancudos, REPELENTE } from './zancudos.js';
import { tickMejenga, BOLA_ITEM, ponerBola } from './mejenga.js';
import { comerVariado } from './variedad.js';
import { tickSed, beber, beberDelRio, tomarCantimplora, hierbaDeMatorral, usarHierba, cocinarEnFogata, tickFogatas, tickTemblor, AGUA, HIERBAS, CANTIMPLORA, CANTIMPLORA_VACIA } from './supervivencia2.js';
import { Arrow, BOW, ARROW, levelOf, ORE_XP, FLECHAS, flechaQueToca } from './armas.js';
import { Rocket, BOMBETA } from './fiesta.js';
import { Music } from './musica.js';
import { findFrame, buildPortal, KEY_ITEM } from './inframundo.js';
import { LAVA_SEA } from './infragen.js';
import { REGIONES, regionAt } from './regiones.js';
import { tickRuta, tickObjetivo, rutaHTML } from './ruta.js';
import { ESCRITURAS, useEscritura, tickVivienda } from './vivienda.js';
import { structuresNear, scanStep, STRUCT_NAMES, STRUCT_RARE, STRUCT_ACH, structRadius, guanacasteShape } from './estructuras.js';
import { tickVolcanoes } from './volcanes.js';
import { villageAt, CELL as VILLAGE_CELL } from './pueblogen.js';
import { BLOCKS, ITEMS, BLOCK_BY_KEY as K, TOOL_IDS, AIR, SOLID, FLUID, getDef, itemName, isBlockId, esCana, esPescado } from './blocks.js';
import { crackTextures, aplicarNitidez } from './textures.js';
import { shieldDef, blockHand, startBlock, stopBlock, tryDodge, tryRoll, trySlide, toggleLock, tryHop, onPlayerHit, strike, afterStrike, tickCombat, updateShieldHand } from './combate.js';
import { makeItemMesh, makeHeldItemMesh, makeMacheteMesh, LIGHT_TINT } from './models.js';
import { saveWorld } from './save.js';
import { HEIGHT, BIOMES } from './worldgen.js';
import { GAME_VERSION } from './version.js';
import { gainSkill, mult, velocidadPicar, lv as skillLv } from './habilidades.js';
import { tickMision, tickCharlas, tickApagon } from './misiones.js';
import { tickPrecios, tickSoda } from './economia.js';
import { tickFiestas, tickBaile } from './fiestas2.js';
import { tickBestiario } from './bestiario.js';
import { tickPulido } from './pulido.js';
import { tickPiedras } from './sombras2.js';
import { usarMueble, tickMuebles, MUEBLES } from './muebles.js';
import { tickVida2 } from './vida2.js';
import { revisarAcertijo } from './ruinas2.js';
import { leerLibro, alComer, tickReputacion, LIBRO } from './saberes.js';
import { PLANOS, usarPlano, tickObra } from './planos.js';
import { ponerDosRuedas } from './vehiculos2.js';
import { tickRayos, tickCeniza } from './clima2.js';
import { tickCaverna } from './caverna.js';
import { cogerConCajuela, batear, tickBatea, BATEA } from './oficios.js';
import { tickMascotas } from './mascotas.js';
import { anotar, tickDiario } from './diario.js';
import { tickPlatina, tickPresaEterna } from './satira.js';
import { tickSequia, tickHuracan } from './clima3.js';
import { RED, tirarRed, recogerRed } from './redes.js';
import { tickGuia } from './guia.js';
import { tickTuristas } from './turistas.js';
import { usarEscama, ESCAMA } from './sirena.js';
import { tickTemplo } from './templo.js';
import { tickArcoiris } from './catarata2.js';
import { tickPartido } from './partido.js';
import { tickTren } from './tren.js';
import { tickMinimapa, toggleMinimapa } from './minimapa.js';
import { tickCielo, usarFragmento, FRAGMENTO } from './cielo2.js';
import { tickMonoCongo, limpiarMangos, usarMechon, MECHON } from './monocongo.js';
import { tickArena, limpiarArena, usarSilbato, SILBATO } from './arena.js';
import { tickMundo2, nieblaAmanecer } from './mundo2.js';
import { tickElecciones } from './elecciones.js';
import { tickCalle } from './calle.js';
import { tickIndicadores } from './indicadores.js';
import { tickJuegos, limpiarJuegos, usarPapalote, tirarTrompo, PAPALOTE, TROMPO } from './juegos.js';
import { tickBingo, cerrar as cerrarBingo } from './bingo.js';
import { carrona, tickZopilotes, limpiarZopilotes } from './fauna3.js';
import { manoPeluda } from './leyendas2.js';
import { abrirParapente, tickParapente, limpiarAire, tickVelas, PARAPENTE } from './aire.js';
import { ponerAvioneta, AVIONETA_ITEM } from './avioneta.js';
import { ponerCarreta, CARRETA_ITEM } from './carreta.js';
import { usarArco, tickCintas, limpiarCintas, ARCO } from './cintas.js';
import { tickNaturaleza3, limpiarNaturaleza3, tickPericos, tickRocio } from './naturaleza3.js';
import { tickPermiso } from './permiso.js';
import { usarSaco, tickSacos, limpiarSacos, SACO } from './sacos.js';
import { tickHuecosMata } from './extras10.js';
import { tickBailes } from './bailes.js';
import { tickPuebloVivo, limpiarPuebloVivo } from './pueblovivo.js';
import { tickBarcos, tickTrombas, tickLucesRaras, limpiarMarCielo } from './marcielo.js';
import { tickYiguirros, tickQuedo, tickCarretillero, limpiarVida2 } from './vidapueblo2.js';
import { tickOropendolas, tickGranizo, limpiarNaturaleza4 } from './naturaleza4.js';
import { tickSabanero, limpiarCampo } from './campo.js';
import { tickCosta, limpiarCosta } from './costa.js';
import { tickPlaya, limpiarPlaya } from './playa.js';
import { tickLavanderas, limpiarLavanderas, tickChanchos, limpiarChanchos } from './rioypatio.js';
import { tickNoches, limpiarNoches } from './noches.js';
import { tickMirando, avisarDesgaste, tickRecetaFija, tickReloj } from './comodidad.js';
import { tickHistoria, limpiarHistoria } from './historia.js';
import { tickMonte, barrilInteract } from './monte.js';
import { casa } from './hogar.js';
import { tickAsedio, tickCencerros, limpiarAsedio } from './asedio.js';
import { tickNidos, filoGolpe, untarFilo, ACEITE, CANDELA, encenderCandela, tickCandela } from './nidos.js';
import { tickAmanecer, anotarBaja, rachaMurio } from './amanecer.js';
import { tickApuros, limpiarApuro } from './apuros.js';
import { tickCuaderno } from './cuaderno.js';
import { tickManas, tickManasCuadro, tumbarArbol, NIVELES } from './manas.js';
import { anotarNemesis, tickNemesis, vencerNemesis } from './nemesis.js';
import { tickAnselmo, tickAnselmoCuadro, vencerOlvido, limpiarAnselmo } from './anselmo.js';
import { tickPlatos, llenarPlato } from './plato.js';
import { tickExpediente } from './expediente.js';
import { tickGente, limpiarGente } from './gente.js';
import { soñar } from './suenos.js';
import { tickPrima } from './prima.js';
import { tickCorreo } from './correo.js';
import { tickDefensa, usarOlla } from './defensa.js';
import { consejoMuerte } from './ayuda.js';
import { tickCumple, limpiarCumple } from './cumple.js';
import { tickEpilogo } from './epilogo.js';
import { abrirSobre, sobreDeBaja, postal, SOBRE as SOBRE_EST } from './album.js';
import { tickCrecida, limpiarCrecida } from './crecida.js';
import { quizaAvispero, tickAvispas, limpiarAvispas } from './avispas.js';
import { tickQuema, limpiarQuema, apagarConBalde, dibujarQuema, usarBomba, BOMBA } from './quema.js';
import { tickPavor, soplarCacho, CACHO } from './bravos.js';
import { tickNeblina, limpiarNeblina, neblinaMuerteK } from './neblina.js';
import { tickMarabunta, dibujarMarabunta, limpiarMarabunta } from './marabunta.js';
import { tickRecompensas, recompensaBaja } from './recompensas.js';
import { tickProcesion, limpiarProcesion } from './procesion.js';
import { tickBailarin, limpiarBailarin } from './bailarin.js';
import { tickResaca } from './playa2.js';
import { tickAsalto, limpiarAsalto } from './asalto.js';
import { tickLahar, limpiarLahar } from './lahar.js';
import { tickPalo, quitarPalo, brincoPalo, cuadroPalo } from './palo.js';
import { tickToros, quitarToros, montaUpdate, quitarMonta, barraMontaVisible } from './toros.js';
import { cuadroTsunami, limpiarTsunami } from './tsunami.js';
import { tickPlaga, cuadroPlaga, limpiarPlaga } from './plaga.js';
import { tickBichos2, taparTorsalo } from './bichos2.js';
import { animarArma, golpeCamara, empujarAlGolpe, golpeLlega } from './armasmano.js';
// bloques que el clic derecho usa (no hay que cubrirse con el arma cuando se les apunta)
const USABLES_CLIC = new Set(['secadero', 'nido_marcado', 'coral_blanco', 'vivero_coral', 'pecera', 'tablon_encargos', 'yunque', 'trapiche', 'compostera', 'olla_caliente', 'plato_vacio', 'corazon_tiquicia', 'fogata', 'fogata_brasas', 'fogata_apagada', 'hive', 'chest', 'stove', 'furnace', 'furnace_lit', 'crafting', 'cafe_maduro', 'ermita']);
import { cuadroBichos3, limpiarBichos3 } from './bichos3.js';
import { usarOfrenda } from './jefes2.js';
import { usarCorona, cuadroFinal, REMATE } from './final.js';
import { epilogoRey, pruebaEpilogo } from './epilogo.js';
import { armarGente, cuadroGente, yendryToque, rolloCreditos } from './reyremate.js';
import { limpiarRey } from './reyfinal.js';
import { comidaFuerza, tickFuerza, perderFuerza, darDescanso } from './fuerza.js';
import { usarErmita, revisarErmitas } from './ermitas.js';
import { cuadroBarras } from './barras.js';
import { tickIncursiones, limpiarIncursion } from './incursiones.js';
import { tickConjunto } from './conjuntos.js';
import { tickAbejas } from './abejas.js';
import { tajoDeViento } from './legendarias.js';
import { GANCHO, usarGancho, ganchoUpdate, soltarGancho } from './gancho.js';
import { armarBrazoMano, AGARRE, PALMA } from './personaje.js';
import { ponerMuneco, tickMunecos } from './muneco.js';
import { tickSereno, cuadroSereno, limpiarSereno } from './sereno.js';
import { cuadroHongos, limpiarHongos } from './hongos.js';
import { cuadroCueva, limpiarCueva } from './cuevavida.js';
import { ganarMaestria, bonoDano, bonoAguante } from './maestria.js';
import { empezarPlaneo, planeoUpdate, usarBombeta, fovPlaneo, terminarPlaneo } from './alas.js';
import { cuadroCombo } from './armas3.js';
import { claseDe, perfil, hayAire, prepararGolpe, despuesGolpe, otrosAlcanzados, tickAturde } from './armas3.js';
import { empezarMuerte, tickMuerte, camaraMuerte, filtroMuerte, muriendo, hud as hudMuerte } from './muerte.js';
import { tickGoleta, cuadroGoleta, limpiarGoleta } from './goleta.js';
import { quizaPezVela, recogerPezVela, cuadroPezVela, limpiarPezVela } from './pezvela.js';
import { tickBombas, limpiarBombas } from './bombas.js';
import { tickLunaRoja, limpiarLunaRoja } from './lunaroja.js';
import { tickMinaOro, vagonUpdate, limpiarVagon } from './minaoro.js';
import { tickAnimales2, cuadroAnimales2 } from './animales2.js';
import { tickFestival, cuadroFestival, limpiarFestival } from './festival.js';
import { tickRifa } from './rifa.js';
import { tickAbigeato, cuadroAbigeato, limpiarAbigeato } from './abigeato.js';
import { tickConcurso, quitarConcurso } from './concurso.js';
import { tickSerenata, cuadroSerenata, limpiarSerenata } from './serenata.js';
import { tickClasico, limpiarClasico } from './clasico.js';
import { tickTerremoto, limpiarTerremoto } from './terremoto.js';
import { tickImpostor, cuadroImpostor, limpiarImpostor } from './impostor.js';
import { tickFurtivos, cuadroFurtivos, limpiarFurtivos } from './furtivos.js';
import { tickPerezosoCalle, cuadroPerezosoCalle, limpiarPerezosoCalle } from './perezosocalle.js';
import { tickIncendio, cuadroIncendio, limpiarIncendio, apagarIncendio } from './incendio.js';
import { tickChompipes } from './chompipe.js';
import { tickGlobo, globoUpdate, limpiarGlobo, posGuardableGlobo } from './globo.js';
import { tickRanas, cuadroRanas, limpiarRanas } from './ranas.js';
import { tickArcoirisCielo, cuadroArcoirisCielo, limpiarArcoirisCielo } from './arcoiris.js';
import { tickFauna4 } from './fauna4.js';
import { tickCarrera, cuadroCarrera, quitarCarrera } from './carrera.js';
import { tickFumiga, cuadroFumiga, limpiarFumiga } from './fumigadora.js';
import { tickPanga, cuadroPanga, limpiarPanga } from './panga.js';
import { tickAlfarero, limpiarAlfarero } from './alfarero.js';
import { tickTrenFantasma, cuadroTrenFantasma, limpiarTrenFantasma } from './trenfantasma.js';
const PERMANENTES = new Set(['garrapatas', 'torsalo']);
// lo que se puede guardar de m.data (fuera referencias a otros mobs, globitos y demás objetos vivos)
function datosGuardables(d) { const out = {}; for (const [k, v] of Object.entries(d || {})) { try { out[k] = structuredClone(v); } catch { /* no se guarda */ } } delete out.animo; return out; }
import { esUnico } from './inventory.js';
import { tickArchivo, tickArchivoCuadro, limpiarArchivo, selloGolpe } from './archivo.js';
import { mana } from './progreso.js';
import { manaJefe, darManaJefe } from './manasjefe.js';
Object.assign(REMATE, { armarGente, cuadroGente, yendryToque, rolloCreditos, epilogoRey, pruebaEpilogo }); // v12.16.5: ver final.js
import { usarCampana, CAMPANA } from './reyremate.js';
import { comerPlato } from './platos.js';
import { recogerBolso } from './supervivencia.js';
import { TRANCA, trancar } from './asedio.js';
import { tickPeon } from './peon.js';
import { tickGuila } from './guila.js';
import { tickInspector } from './inspector.js';
import { tickVidaBaja } from './comodidad.js';
import { tickHallazgos } from './hallazgos.js';
import { terminarRapido, resembrar } from './comodidad.js';
import { usarYunque, usarCompostera, factorMejora } from './yunque.js';
import { tickRigo, cobrarSeguro } from './rigo.js';
import { quizaDerrumbe, tickDerrumbe, limpiarDerrumbe } from './mina.js';
import { tickCorazon, usarCorazon, limpiarCeniza } from './corazon.js';
import { tickEscondites, tickChancleta, lanzarChancleta, limpiarChancleta, CHANCLETA } from './reliquias.js';
import { tickCanelo } from './canelo.js';
import { tickBuhonero, limpiarBuhonero } from './buhonero.js';
import { tickRetos } from './retos.js';
import { soltarBotin } from './sombras2.js';
import { extras } from './inventory.js';
import { tickRio } from './rio.js';
import { usarBandera, tickAros, limpiarAros, BANDERA } from './aros.js';
import { usarTabla, tickSurf, limpiarSurf, TABLA } from './surf.js';
import { tickArribada } from './arribada.js';
import { tickTorneo, pescaEnTorneo, limpiarTorneo } from './torneo.js';
import { tickInfluencer, influencerEvento, limpiarInfluencer } from './influencer.js';
import { tickTiro, limpiarTiro } from './tiro.js';
import { tickMariposas, limpiarMariposas } from './mariposas.js';
import { tickCuidacarros, limpiarCuidacarros } from './cuidacarros.js';
import { es as esTecla } from './teclas.js';
import { toggleFoto, tickFoto, camaraFoto, zoomFoto, pedirFoto, guardarSiToca, fotoTecla } from './foto.js';
import { usarMapa, mapaDelCoco, cavarTesoro, usarCareta, perlaDe, MAPA, CARETA } from './tesoros.js';
import { quizaSangra, usarCura, CURAS, tickHeridas, durmio, siestita } from './supervivencia3.js';
import { cuadroProfundidad, brilloProf, nieblaProf } from './profundidad.js';
import { tickFuego, usarFuego, tickColada, conCasco } from './fuego.js';
import { tickComite, alCambiarBloqueComite } from './comite.js';
import { tickPatronal, usarPatronal } from './patronal.js';
import { RANGO, disparar, tieneMunicion, tickArmas, limpiarArmas, NOMBRES_MINI } from './armas2.js';
import { achIcon } from './logros.js';
import { tickCuerpo2, despertarSusto } from './cuerpo.js';
import { temporadaDe, tickTemporadas, tickZinc, usarCobija, alCambiarTemporada, COBIJA } from './temporadas.js';
import { tickRutinas, tickMolienda } from './finca2.js';
import { JEFES_BALANCE, nombreCorto } from './jefes-balance.js';
import { usarTablon, verLibro, tickEncargos, LIBRO_ENCARGOS } from './encargos2.js';
import { empezarCuadro, terminarCuadro } from './medidor.js';
import { usarArrecife, tickTortugasArrecife } from './arrecife.js';
import { tipoAgarre, AGARRES, agarreDe } from './agarre.js';
import { pescar, usarMarisco, avisoVeda } from './pesca.js';
import { PostFX } from './postfx.js';
import { cuadroHalos } from './halos.js';
import { tickRespaldo } from './respaldo.js';

const REACH_SURVIVAL = 4.6;
const REACH_CREATIVE = 6;

// el ícono de cada logro, según de qué se trata
const rareXP = (r) => ({ común: 6, rara: 12, épica: 20, legendaria: 30 }[r] || 6);

// los rumores hablan de lugares que valen el viaje, no de cada carreta
const RUMOR_SKIP = new Set(['carreta', 'casita_bahareque', 'estatua', 'churchill', 'fuente', 'trapiche', 'feria', 'cementerio', 'feria_pueblo', 'cementerio_pueblo']);

// lo que la brocha puede pintar, en el orden en que cambia de color
const PINTABLE = [K.plaster, K.repello_celeste, K.repello_amarillo, K.repello_verde, K.adobe];

export class Game {
  constructor(canvas, audio, settings) {
    this.canvas = canvas;
    this.audio = audio;
    audio.onCaption = (name, pos) => { if (this.settings.subtitulos && this.ui) this.ui.caption(name, pos, this.player); };
    this.settings = settings;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
    // Pérdida del contexto WebGL (GPU reiniciada o sin memoria): guardar y avisar en vez de colgarse.
    canvas.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      this.contextLost = true;
      this.save();
      if (this.ui) this.ui.toast('La tarjeta gráfica se reinició. Partida guardada: recargue la página.', 10000);
    });
    this.renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
    this.renderer.autoClear = false;
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(0x88aaff, 40, 100);
    this.camera = new THREE.PerspectiveCamera(settings.fov, 1, 0.05, 1200);
    this.camera.rotation.order = 'YXZ';
    this.sky = new Sky(this.scene);

    // mano / ítem en primera persona (escena aparte para que no atraviese paredes)
    this.handScene = new THREE.Scene();
    this.handCamera = new THREE.PerspectiveCamera(70, 1, 0.01, 10);
    this.hand = new THREE.Group();
    this.handScene.add(this.hand);
    this.handHeldId = -1;
    this.swing = 0;

    // contorno del bloque apuntado y grietas
    const edges = new THREE.EdgesGeometry(new THREE.BoxGeometry(1.004, 1.004, 1.004));
    this.outline = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.55 }));
    this.outline.visible = false;
    this.scene.add(this.outline);
    this.crack = new THREE.Mesh(new THREE.BoxGeometry(1.006, 1.006, 1.006), new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }));
    this.crack.visible = false;
    this.scene.add(this.crack);

    this.player = new Player();
    this.remotos = new Map(); // v12.10.0 (F0 del multijugador): jugadores de otras personas, id → { id, nombre, player }. Vacío hasta la F1
    this.inventory = new Inventory();
    this.inventory.onWear = (st) => avisarDesgaste(this, st);
    this.entities = new Entities(this);
    this.stations = new Stations(this);
    this.placeFx = [];
    this.cine = null; this.lying = null;
    this.keys = new Set();
    this.intentarRodar = () => tryRoll(this); // v12.4.1: cuerpo.js rueda al aterrizar sin importar combate.js (que haría un ciclo)
    this.mouse = { left: false, right: false };
    this.running = false;
    this.paused = true;
    this.daylight = 1;
    this.time = 0.05;
    this.day = 1;
    this.mode = 'survival';
    this.target = null;
    this.breaking = null;
    this.actionCd = 0;
    this.attackCd = 0;
    this.useCd = 0;
    this.shake = 0;
    this.fovCurrent = settings.fov;
    this.fps = 0;
    this.ui = null;
    this.world = null;
    this.meta = null;
    this.lastSave = 0;
    this.saving = false;
    this.hudHidden = false;
    this.lastSpace = 0;
    this.lastW = 0;
    this.sprintKey = false;
    this.ready = false;

    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    const w = window.innerWidth, h = window.innerHeight;
    // pixel art: no hace falta la densidad completa de pantallas retina (mucho trabajo para la GPU)
    this.renderer.setPixelRatio((this.settings.renderScale || 1) * (this.escalaAuto || 1)); // v12.5.0: el regulador la multiplica
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.handCamera.aspect = w / h;
    this.handCamera.updateProjectionMatrix();
  }

  // ---------- ciclo de vida ----------
  start(meta, mods, be) {
    this.AvatarClase = Avatar; // v12.11.0: el trozo «red» lo recibe de aquí (no importa el juego)
    this.meta = meta;
    this.mode = meta.mode || 'survival';
    this.time = meta.time ?? 0.05;
    this.day = meta.day || 1;
    // dimensiones: los chunks del inframundo se guardan con el prefijo «inf:» en la misma partida
    this.dims = { tierra: { mods: new Map(), be: new Map() }, inframundo: { mods: new Map(), be: new Map() }, cielo: { mods: new Map(), be: new Map() } };
    const dimOf = (k) => (k.startsWith('inf:') ? ['inframundo', k.slice(4)] : k.startsWith('sky:') ? ['cielo', k.slice(4)] : ['tierra', k]);
    for (const [k, m] of mods || []) { const [d, kk] = dimOf(k); this.dims[d].mods.set(kk, m); }
    for (const [k, m] of be || []) { const [d, kk] = dimOf(k); this.dims[d].be.set(kk, m); }
    this.dim = meta.dim || 'tierra';
    this.world = new World(this.scene, meta.seed, this.dims[this.dim].mods, this.dims[this.dim].be, meta.genVersion || 1, this.dim, meta.tipoMundo || 'normal');
    this.world.renderDistance = this.settings.renderDistance;
    if (this.far) this.far.dispose();
    this.far = this.dim === 'tierra' ? new FarTerrain(this.scene, meta.seed, meta.genVersion || 1, meta.tipoMundo || 'normal') : null;
    if (!this.weather) this.weather = new Weather(this);
    this.weather.load(meta.weather || null);
    if (!meta.weather) { this.weather.type = 'clear'; this.weather.intensity = 0; }
    if (this.far) this.far.setDistance(this.settings.farDistance ?? 768);
    this.hookWorld();
    this.player = new Player();
    this.player.necrosis = meta.necrosis || 0; // la herida de la terciopelo sigue podrida al volver
    this.startRest(meta);
  }

  // conecta los avisos del mundo con el juego (se vuelve a llamar al cambiar de dimensión)
  hookWorld() {
    // multijugador (v12.12.0): cada cambio del mundo de la Tierra le avisa a la sesión; el invitado no simula (el anfitrión manda)
    this.world.red = this.meta.invitado ? 'cliente' : null;
    this.world.redCambio = (x, y, z, old, id) => { if (this.red && this.dim === 'tierra') this.red.bloqueCambiado(x, y, z, old, id); };
    this.world.onDrop = (x, y, z, id) => this.dropFromBlock(id, x, y, z);
    // si desaparece un bloque especial (por pico, explosión o lo que sea), suelta su contenido
    this.world.onBlockChange = (x, y, z, old, id) => {
      const ob = BLOCKS[old], nb = BLOCKS[id];
      const family = (b) => (b.door ? 'door' : b.key === 'furnace_lit' ? 'furnace' : b.key);
      if ((ob.station || ob.door || ob.bed || ob.barril) && family(ob) !== family(nb)) this.stations.broken(old, x, y, z);
      alCambiarBloque(this, x, y, z, old, id); // v12.1.0: las fogatas con leña
      alCambiarBloqueOficio(this, x, y, z, old, id); // v12.15.1: los mostradores
      alCambiarBloqueComite(this, x, y, z, old, id); // v12.15.3: los mojones del Comité
    };
    this.world.onBlockEntity = (x, y, z) => this.stations.changed(x, y, z);
    this.world.onFall = (x, y, z, id) => this.entities.spawnFalling(id, x, y, z);
    this.world.onFluidMix = (x, y, z) => {
      this.audio.play('ignite', { pos: { x: x + 0.5, y: y + 0.5, z: z + 0.5 }, vol: 0.4, pitch: 1.4 });
      this.particles.burst(x + 0.5, y + 1, z + 0.5, [[0.6, 0.6, 0.6], [0.8, 0.8, 0.8]], 14, 1.5);
    };
  }

  startRest(meta) {
    this.player.vidaExtra = meta.vidaExtra || 0;
    if (meta.player) this.player.load(meta.player);
    else {
      const s = meta.spawn;
      this.player.body.pos.x = s.x; this.player.body.pos.y = s.y; this.player.body.pos.z = s.z;
    }
    this.inventory = new Inventory();
    this.inventory.onWear = (st) => avisarDesgaste(this, st);
    this.inventory.onChange = () => this.ui && this.ui.refreshHotbar();
    if (meta.inventory) this.inventory.load(meta.inventory);
    else this.giveStarterKit();
    this.entities.clear();
    this.stations.clear();
    this.cine = null; this.lying = null;
    this.achievements = new Set(meta.achievements || []);
    this.clock = meta.clock || 0;
    this.sinCaida = 0; // es una marca de g.clock: de otra partida no sirve
    this.pararrayosLista = null; this.pararrayosT = 0;
    this.proxTemblor = null; this.temblor = null; this.terremoto = null; this.globoHoy = 0; this.serenataNoche = 0; this.impostorNoche = 0; this.festivalNoche = 0; this.ultimaGrieta = null;
    this.pendingPets = (meta.pets || []).filter((pt) => (pt.dim || 'tierra') === this.dim);
    this.awayPets = (meta.pets || []).filter((pt) => (pt.dim || 'tierra') !== this.dim);
    this.player.effects = meta.effects || {};
    this.running = true;
    this.ready = false;
    this.lastSave = performance.now();
    this.ui.refreshHotbar();
    this.ui.refreshBars();
  }

  giveStarterKit() {
    if (this.mode === 'creative') {
      const kit = [K.grass, K.stone, K.planks, K.log, K.glass, K.bricks, K.lamp, K.dynamite, K.table];
      kit.forEach((id, i) => { this.inventory.slots[i] = { id, count: 64 }; });
    } else bolsitoInicio(this);
    this.inventory.changed();
  }

  async stop() {
    if (this.red) { this.red.cerrar(); this.red = null; } // v12.11.0: salir del mundo cierra la sala
    if (this.remotos && typeof this.remotos.limpiar === 'function') { this.remotos.limpiar(); this.remotos = new Map(); } // v12.16.1: en solitario es un Map vacío (sin limpiar): antes lanzaba y salir al menú no terminaba
    limpiarRey(this); // v12.16.1: si había pelea del Rey, el redondel se deshace antes de guardar
    this.recogerUnicos();
    await this.save();
    this.running = false;
    // que no siga sonando el mundo en el menú: ambiente, lluvia, motores y la música que estaba programada
    this.audio.silenceWorld();
    if (this.music && this.music.gain) this.music.gain.disconnect();
    this.music = null;
    this.riding = null;
    if (this.bingo) cerrarBingo(this);
    limpiarAnselmo(this);
    limpiarGente(this);
    limpiarArchivo(this);
    limpiarCumple(this);
    limpiarCrecida(this);
    limpiarAvispas(this);
    limpiarQuema(this);
    limpiarNeblina(this);
    limpiarMarabunta(this);
    limpiarProcesion(this);
    limpiarBailarin(this);
    this.resaca = null;
    limpiarAsalto(this);
    limpiarLahar(this);
    quitarPalo(this);
    quitarToros(this);
    limpiarTsunami(this);
    limpiarPlaga(this);
    limpiarGoleta(this);
    limpiarBombas(this);
    limpiarLunaRoja(this); this.lunaRojaPrueba = false;
    limpiarPezVela(this); if (this.fishing) { this.fishing.remove(); this.fishing = null; }
    quitarMonta(this); limpiarVagon(this); limpiarFestival(this); limpiarAbigeato(this); quitarConcurso(this); limpiarSerenata(this); limpiarClasico(this); limpiarCueva(this); limpiarTerremoto(this); limpiarImpostor(this); limpiarFurtivos(this, true); limpiarPerezosoCalle(this); limpiarIncendio(this); limpiarGlobo(this); limpiarRanas(this); limpiarArcoirisCielo(this); quitarCarrera(this); limpiarFumiga(this); this.fumigaCd = 0; limpiarPanga(this); this.pangaDia = 0; limpiarAlfarero(this); limpiarTrenFantasma(this); this.trenFantasmaNoche = 0; if (this.muerte) hudMuerte(1); this.muerte = null; limpiarBichos3(this); limpiarIncursion(this); soltarGancho(this); limpiarSereno(this); limpiarHongos(this); this.planeo = null; this.rayosRey = null; this.slowmo = 0; this.contra = 0; this.hitStop = 0; this.perfectoCd = 0; this.lastHitT = 0; this.comboVis = null; this.comboPaso = -1; for (const id of ['ermitas', 'creditos-final']) { const el = document.getElementById(id); if (el) el.remove(); }
    this.locutorT = 0; this.noticiasVistas = null;
    limpiarZopilotes(this); limpiarAire(this); limpiarAros(this); limpiarSurf(this); limpiarTorneo(this); limpiarInfluencer(this); limpiarTiro(this); limpiarMariposas(this); limpiarCuidacarros(this); limpiarCintas(this); limpiarNaturaleza3(this); limpiarSacos(this); limpiarPuebloVivo(this); limpiarMarCielo(this); limpiarVida2(this); limpiarNaturaleza4(this); limpiarCampo(this); limpiarCosta(this); limpiarPlaya(this); limpiarLavanderas(this); limpiarChanchos(this); limpiarNoches(this); limpiarHistoria(this); limpiarAsedio(this); limpiarApuro(this); this.seguroPago = false; this.ui.limpiarAvisos(true); limpiarBuhonero(this); limpiarDerrumbe(this); limpiarCeniza(this); limpiarChancleta(this); this.candela = null;
    limpiarArmas(this); limpiarMangos(this); limpiarArena(this); limpiarJuegos(this);
    limpiarFxGolpes(this);
    this.golpePend = null; this.golpeAnim = null; // un golpe a medio camino no se resuelve contra un bicho del mundo anterior
    this.caidaPend = null; this.bebeManos = null; this.rollIntento = null; // v12.4.1
    this.danoT = -99; this.jefeCerca = null; // v12.4.9: el «recién golpeado» y el jefe cercano no pasan al mundo nuevo
    this.entities.clear();
    this.stations.clear();
    if (this.far) { this.far.dispose(); this.far = null; }
    if (this.world) this.world.dispose();
    this.world = null;
  }

  async save() {
    if (!this.world || !this.meta || this.saving) return;
    if (this.meta.invitado) return; // v12.11.0: el mundo del anfitrión no se guarda en la máquina de quien lo visita
    this.saving = true;
    let dirty = null;
    try {
      if (this.red && this.red.rol === 'anfitrion') this.red.volcarTodo(); // v12.13.0: las fichas de quienes están dentro (dónde están) van en la misma transacción
      this.meta.player = this.player.toJSON();
      { const q = posGuardableGlobo(this); if (q) Object.assign(this.meta.player, q); } // en pleno vuelo se guarda en el suelo
      this.meta.inventory = this.inventory.toJSON();
      this.meta.time = this.time;
      this.meta.day = this.day;
      this.meta.mode = this.mode;
      if (this.weather) this.meta.weather = this.weather.toJSON();
      // mascotas (animales domesticados) viajan con la partida
      this.meta.pets = [...this.entities.mobs.filter((m) => m.tamed && !m.dead).map((m) => ({ type: m.type, x: m.body.pos.x, y: m.body.pos.y, z: m.body.pos.z, data: datosGuardables(m.data), dim: this.dim })), ...(this.pendingPets || []).map((pt) => ({ ...pt, data: datosGuardables(pt.data), dim: pt.dim || this.dim })), ...(this.awayPets || [])]; // las que esperan que cargue su chunk también viajan
      this.meta.dim = this.dim;
      this.meta.effects = this.player.effects;
      this.meta.achievements = [...(this.achievements || [])];
      this.meta.clock = this.clock;
      dirty = new Set(this.world.dirtyMods);
      this.world.dirtyMods.clear();
      if (this.dim === 'tierra') await saveWorld(this.meta, this.world.mods, dirty, this.world.blockEntities);
      else {
        // la otra dimensión se guarda con su prefijo
        const pre = this.dim === 'cielo' ? 'sky:' : 'inf:';
        const mods = new Map(), be = new Map();
        for (const k of dirty) { if (this.world.mods.get(k)) mods.set(pre + k, this.world.mods.get(k)); if (this.world.blockEntities.get(k)) be.set(pre + k, this.world.blockEntities.get(k)); }
        await saveWorld(this.meta, mods, new Set(mods.keys()), be);
      }
      this.lastSave = performance.now();
    } catch (e) {
      console.error('Error al guardar', e);
      if (dirty) for (const k of dirty) this.world.dirtyMods.add(k); // que esos chunks se intenten guardar la próxima vez
      this.ui.toast('No se pudo guardar la partida');
    } finally {
      this.saving = false;
    }
  }

  // ---------- entrada ----------
  onKeyDown(e) {
    if (muriendo(this)) return; // mientras cae, no hay teclas
    const code = e.code;
    if (this.foto && !e.repeat && fotoTecla(this, code)) return;
    if (code === 'Space') {
      const now = performance.now();
      if (!e.repeat && this.mode === 'creative' && now - this.lastSpace < 300) {
        this.player.flying = !this.player.flying;
        this.player.body.vel.y = 0;
        this.ui.toast(this.player.flying ? 'Volando' : 'Caminando', 900);
      }
      if (!e.repeat) this.lastSpace = now;
    }
    // correr con un toque de Ctrl (ajuste)
    if (this.settings.correrToggle && (code === 'ControlLeft' || code === 'ControlRight') && !e.repeat) this.sprintKey = !this.sprintKey;
    if (code === 'KeyW' && !e.repeat) {
      const now = performance.now();
      if (now - this.lastW < 280) this.sprintKey = true;
      this.lastW = now;
    }
    if (code.startsWith('Digit')) {
      const n = Number(code.slice(5));
      if (n >= 1 && n <= 9) this.selectSlot(n - 1);
    }
    if (code === 'F3') { e.preventDefault(); this.ui.toggleDebug(); }
    // cámara: primera persona → de espaldas → de frente
    const S = this.settings;
    if ((code === 'F5' || esTecla(S, 'camara', code)) && !e.repeat) {
      e.preventDefault();
      this.view = ((this.view || 0) + 1) % 3;
      const ch = document.getElementById('crosshair'); if (ch) ch.style.opacity = this.view === 2 ? '0' : '1';
      this.ui.toast(['🎥 Cámara: primera persona', '🎥 Cámara: tercera persona (de espaldas)', '🎥 Cámara: de frente (¡pose para la foto!)'][this.view], 1600);
    }
    if (code === 'F1') { e.preventDefault(); if (!this.foto) { this.hudHidden = !this.hudHidden; this.ui.setHudHidden(this.hudHidden); } }
    if (esTecla(S, 'minimapa', code) && !e.repeat) toggleMinimapa(this);
    if (esTecla(S, 'foto', code) && !e.repeat) { e.preventDefault(); toggleFoto(this); }
    if ((code === 'Enter' || code === 'NumpadEnter') && this.foto) { e.preventDefault(); pedirFoto(this); }
    if (esTecla(S, 'soltar', code)) this.dropHeld(e.ctrlKey);
    if (esTecla(S, 'cargado', code) && !e.repeat && this.mode === 'survival') this.heavyAttack();
    if (code === 'Space' && !e.repeat && this.gancho) { soltarGancho(this); return; } // soltar el gancho
    if (code === 'Space' && !e.repeat && this.mode === 'survival' && empezarPlaneo(this)) return; // las alas del Rey (alas.js)
    if (code === 'Space' && !e.repeat) { if (brincoPalo(this)) { /* trepando el palo encebado */ } else if (this.blocking) tryDodge(this); else if (e.ctrlKey && this.mode === 'survival') trySlide(this); else if (this.lockOn) tryHop(this); } // Ctrl + Espacio: barrerse sin escudo (v11.10)
    if (esTecla(S, 'voltereta', code) && !e.repeat) { if (!tryRoll(this) && !this.player.body.onGround) this.rollIntento = this.clock || 0; } // v12.4.1: en el aire no se puede rodar todavía; se recuerda el intento
    if (esTecla(S, 'ruta', code) && !e.repeat) { this.rutaOpen = !this.rutaOpen; this.ui.showRuta(this.rutaOpen ? rutaHTML(this) : null); }
    if (esTecla(S, 'enfoque', code) && !e.repeat) toggleLock(this);
    if (esTecla(S, 'deslizada', code) && !e.repeat) trySlide(this);
    this.keys.add(code);
  }
  onKeyUp(e) {
    if (this.rapido && e.code === this.rapido.code) { this.eating = null; terminarRapido(this); }
    this.keys.delete(e.code);
    if (e.code === 'KeyW' && !this.settings.correrToggle) this.sprintKey = false;
  }
  releaseAll() {
    this.keys.clear();
    this.mouse.left = false; this.mouse.right = false;
    this.breaking = null;
    this.sprintKey = false;
  }

  onMouseMove(dx, dy) {
    const s = 0.0022 * this.settings.sensitivity;
    this.player.yaw -= dx * s;
    this.player.pitch -= dy * s;
    const lim = Math.PI / 2 - 0.001;
    this.player.pitch = Math.max(-lim, Math.min(lim, this.player.pitch));
    if (this.handLag) {
      this.handLag.x = Math.max(-0.08, Math.min(0.08, this.handLag.x + dx * 0.00025));
      this.handLag.y = Math.max(-0.08, Math.min(0.08, this.handLag.y - dy * 0.00025));
    }
  }

  onMouseDown(button) {
    if (muriendo(this)) return;
    if (button === 0) { this.mouse.left = true; this.actionCd = 0; this.leftClick(); }
    if (button === 2) {
      this.mouse.right = true; this.useCd = 0;
      // con escudo y un arma (o la mano vacía) el clic derecho bloquea; si apuntás a algo que se usa, se usa
      const t = this.target, TB = t && BLOCKS[t.id], usable = t && (MUEBLES.has(TB.key) || TB.station || TB.door || TB.bed || TB.barril || TB.key === 'placa' || TB.explosive || TB.toggleTo || TB.crop || USABLES_CLIC.has(TB.key));
      if ((shieldDef(this) ? blockHand(this.heldDef()) : this.mode === 'survival' && perfil(this.heldDef()).bloqueo > 0) && !(this.inventory.held && this.inventory.held.id === CHANCLETA) && !usable && !(this.mobTarget && !(this.mobTarget.mob.kind.hostile || this.mobTarget.mob.kind.legend || this.mobTarget.mob.kind.boss))) startBlock(this); else this.rightClick();
    }
    if (button === 1) { if (this.mode === 'survival' && this.mobAlAlcance()) { this.heavyAttack(); return; } this.pickBlock(); } // con un bicho a tiro el clic central es siempre el golpe fuerte (aunque el arma esté enfriando): nunca le cambia el arma // clic central: golpe fuerte si hay a quién; si no, elegir el bloque (F sigue siendo el golpe fuerte)
  }
  onMouseUp(button) {
    if (button === 0) { this.mouse.left = false; this.breaking = null; }
    if (button === 2) { this.mouse.right = false; stopBlock(this); }
  }

  // ataque fuerte (clic del medio o F): más lento, gasta más estamina, empuja y aturde
  heavyAttack() {
    const d = this.heldDef();
    if (!d || !(d.damage || d.machete) || this.attackCd > 0) return false;
    if (!hayAire(this, perfil(d).cost * 2.2 * bonoAguante(this, claseDe(d)))) { this.attackCd = 0.3; return true; }
    if (this.mobAlAlcance()) this.attack(this.mobTarget.mob, true);
    else { strike(this, { stunT: 0, kind: { h: 1 } }, true); this.golpeAnim = { clase: claseDe(d), paso: 0, heavy: true }; this.swing = 1; this.heavyT = 1; this.attackCd = 0.8; this.audio.slash(false); }
    if (this.mode === 'survival') tajoDeViento(this, this.inventory.held, (d.damage || 1) * 2.1 * this.damageBonus()); // el Machete del Viento (legendarias.js)
    // la lanza arremete: el golpe fuerte lo tira a uno para adelante con la estocada (y atraviesa, armas3.js)
    if (this.mode === 'survival' && claseDe(d) === 'lanza' && this.player.body.onGround && !this.slide && this.hayPisoAdelante(3.2)) { const yaw = this.player.yaw; this.slide = { t: 0.36, vx: -Math.sin(yaw) * 16, vz: -Math.cos(yaw) * 16, lanza: true }; this.iframes = Math.max(this.iframes || 0, 0.2); this.audio.play('swish', { ui: true, vol: 0.6, pitch: 0.7 }); }
    return true;
  }
  // ¿hay piso en los próximos bloques? (la arremetida no lo tira a uno por un barranco ni a la lava)
  hayPisoAdelante(dist) {
    const p = this.player.body.pos, yaw = this.player.yaw, y = Math.floor(p.y - 0.1);
    for (let d = 1; d <= dist; d += 0.5) {
      const x = Math.floor(p.x - Math.sin(yaw) * d), z = Math.floor(p.z - Math.cos(yaw) * d);
      if (!SOLID[this.world.getBlock(x, y, z)] && !SOLID[this.world.getBlock(x, y - 1, z)]) return false;
    }
    return true;
  }
  onWheel(dy) {
    if (zoomFoto(this, dy)) return;
    const dir = dy > 0 ? 1 : -1;
    this.selectSlot((this.inventory.selected + dir + 9) % 9);
  }

  selectSlot(i) {
    this.inventory.selected = i;
    this.ui.refreshHotbar();
    const s = this.inventory.held;
    this.ui.showItemName(s ? itemName(s.id) : '');
  }

  // Q tira 1 del ítem en la mano hacia adelante (Ctrl+Q tira todo el montón).
  dropHeld(all = false) {
    const s = this.inventory.held;
    if (!s) return;
    const n = all ? s.count : 1;
    const { e, d } = this.eyeAndDir();
    this.entities.dropItem(s.id, n, e.x + d.x * 0.4, e.y - 0.3 + d.y * 0.4, e.z + d.z * 0.4, { x: d.x * 5, y: d.y * 5 + 1.5, z: d.z * 5 }, 1.5, s.dur, extras(s));
    this.inventory.consumeHeld(n);
    this.swing = 1;
    this.audio.drop();
  }

  // ---------- interacción ----------
  eyeAndDir() {
    const e = this.player.eye;
    const d = this.player.lookDir();
    return { e, d };
  }

  updateTarget() {
    const { e, d } = this.eyeAndDir();
    const reach = this.mode === 'creative' ? REACH_CREATIVE : REACH_SURVIVAL;
    this.target = this.world.raycast(e.x, e.y, e.z, d.x, d.y, d.z, reach);
    this.mobTarget = this.entities.raycastMob(e.x, e.y, e.z, d.x, d.y, d.z, Math.max(3.6, this.mode === 'survival' ? perfil(this.heldDef()).alcance : 3.6)); // la lanza llega más lejos; el alcance de cada arma se mide al pegar
    if (this.mobTarget && this.target && this.target.dist < this.mobTarget.dist) this.mobTarget = null;
    if (this.target) {
      this.outline.visible = true;
      const t = this.target;
      const b = BLOCKS[t.id];
      const cj = this.world.cajas(t.x, t.y, t.z, t.id, true);
      if (cj && cj.length) {
        // el contorno abraza la forma de verdad (losa, cerca, puerta, planta): la caja que junta todas sus partes
        let x0 = 1, y0 = 1, z0 = 1, x1 = 0, y1 = 0, z1 = 0;
        for (const q of cj) { x0 = Math.min(x0, q[0]); y0 = Math.min(y0, q[1]); z0 = Math.min(z0, q[2]); x1 = Math.max(x1, q[3]); y1 = Math.max(y1, Math.min(q[4], 1.5)); z1 = Math.max(z1, q[5]); }
        this.outline.scale.set(Math.max(0.02, x1 - x0), Math.max(0.02, y1 - y0), Math.max(0.02, z1 - z0));
        this.outline.position.set(t.x + (x0 + x1) / 2, t.y + (y0 + y1) / 2, t.z + (z0 + z1) / 2);
      } else if (b.render === 'cross') {
        this.outline.scale.set(0.7, 0.85, 0.7);
        this.outline.position.set(t.x + 0.5, t.y + 0.425, t.z + 0.5);
      } else {
        this.outline.scale.set(1, 1, 1);
        this.outline.position.set(t.x + 0.5, t.y + 0.5, t.z + 0.5);
      }
    } else this.outline.visible = false;
    tickMirando(this);
  }

  // para picar: un bloque en la mano no cuenta como herramienta aunque su ficha diga con qué se pica
  herramientaEnMano() { const s = this.inventory.held; return s && !isBlockId(s.id) ? getDef(s.id) : null; }
  heldDef() {
    const s = this.inventory.held;
    return s ? getDef(s.id) : null;
  }

  // al empezar a picar, si en la barra hay una herramienta mejor y la mano no anda ocupada con un bloque o comida, la agarra sola
  herramientaSola(id) {
    if (this.settings.herramientaSola === false || this.mode !== 'survival') return;
    const b = BLOCKS[id], inv = this.inventory, h = inv.held, hd = h ? getDef(h.id) : null;
    if (!b.tool || (h && (isBlockId(h.id) || !(hd && hd.tool))) || (hd && hd.tool === b.tool)) return;
    // con un arma en la mano y un bicho bravo cerca, no: en plena pelea uno no quiere soltar la espada aunque le pegue al piso
    const pp = this.player.body.pos;
    const arma = hd && (hd.tool === 'sword' || hd.machete || (!hd.tool && hd.damage)); // las herramientas también traen daño: eso no es un arma
    if (arma && (this.clock || 0) - (this.lastHitT || -99) < 1.5) return; // acaba de tirar un espadazo
    if (arma && this.entities.mobs.some((m) => !m.dead && !m.dying && (m.kind.hostile || m.kind.boss || m.atk) && Math.hypot(m.body.pos.x - pp.x, m.body.pos.z - pp.z) < 5)) return;
    let mejor = -1, vel = 0;
    for (let i = 0; i < 9; i++) { const s = inv.slots[i], d = s && !isBlockId(s.id) && getDef(s.id); if (d && d.tool === b.tool && (d.speed || 1) > vel) { vel = d.speed || 1; mejor = i; } }
    if (mejor >= 0) this.selectSlot(mejor);
  }

  breakTime(blockId) {
    const b = BLOCKS[blockId];
    if (b.hardness < 0) return Infinity;
    if (b.hardness === 0) return 0.05;
    const held = this.herramientaEnMano();
    if (held && held.machete && (b.leafy || b.render === 'cross' || b.cane || b.key === 'vine')) return 0.05;
    let t = b.hardness * 1.5;
    if (held && held.machete && b.tool === 'axe') t /= 2.5;
    const rightTool = held && held.tool && held.tool === b.tool;
    if (b.tier > 0 && !(held && held.tool === 'pickaxe' && held.tier >= b.tier)) t *= 3.3;
    if (held && held.tool === 'sword' && b.leafy) t /= 2;
    // v13.0.5: yunque + habilidad + hoja + maña se SUMAN y topan en ×1.5 sobre la velocidad base de la herramienta
    if (rightTool) t /= velocidadPicar(this, held, (this.inventory.held && this.inventory.held.mejora) || 0);
    if (this.player.body.inWater && !this.player.body.onGround) t *= 5;
    else if (this.player.body.inWater) t *= 2;
    return t;
  }

  canHarvest(blockId) {
    const b = BLOCKS[blockId];
    if (!b.tier) return true;
    const held = this.herramientaEnMano();
    return !!(held && held.tool === 'pickaxe' && held.tier >= b.tier);
  }

  // ¿la criatura de la mira está al alcance del arma? (más lejos, el clic sigue al bloque o es un golpe al aire)
  mobAlAlcance() { return this.mobTarget && (this.mode !== 'survival' || this.mobTarget.dist <= perfil(this.heldDef()).alcance) ? this.mobTarget : null; }
  leftClick() {
    if (this.mobAlAlcance() && this.attackCd <= 0) { this.attack(this.mobTarget.mob); return; }
    // con el machete se puede tirar un tajo al aire
    const held = this.heldDef();
    if (held && held.machete && !this.target && !this.mobAlAlcance() && this.attackCd <= 0) { this.swing = 1; this.attackCd = 0.38; this.audio.slash(false); return; }
    // con cualquier arma se puede tirar el golpe al aire (gasta aire y sigue la cadena): para medir distancias y amagar
    if (held && held.damage && (!held.tool || held.tool === 'sword' || held.tool === 'axe') && !this.target && !this.mobAlAlcance() && this.attackCd <= 0 && this.mode === 'survival') {
      const P = perfil(held);
      if (!hayAire(this, P.cost)) { this.attackCd = 0.3; return; }
      const info = strike(this, { stunT: 0, kind: { h: 1 } }, false);
      this.golpeAnim = { clase: claseDe(held), paso: info.paso, heavy: false };
      this.attackCd = P.cd; this.swingRate = 1 / Math.max(0.22, P.cd * 0.8); this.swing = 1;
      this.audio.play('swish', { ui: true, vol: 0.4, pitch: 1.3 - Math.min(0.6, P.empuje * 0.3) });
      return;
    }
    if (this.mode === 'creative' && this.target) { this.breakBlock(this.target, false); this.actionCd = 0.22; }
  }

  attack(mob, heavy = false) {
    const held = this.heldDef();
    // cada arma tiene su alcance (armas3.js): más allá, el golpe no llega
    if (this.mode === 'survival' && this.mobTarget && this.mobTarget.mob === mob && this.mobTarget.dist > perfil(held).alcance) return;
    // sin aire no se pega (armas3.js): hay que medir la pelea
    if (!hayAire(this, perfil(held).cost * (heavy ? 2.2 : 1) * bonoAguante(this, claseDe(held)))) { this.attackCd = 0.3; return; }
    this.golpeCargado = heavy;
    const info = strike(this, mob, heavy);
    // el brazo arranca ya; el daño cae cuando el arma llega, a medio camino del golpe
    this.golpeAnim = { clase: claseDe(held), paso: info.paso, heavy };
    this.attackCd = info.ws.cd * (heavy ? 1.7 : 1);
    this.swingRate = 1 / Math.max(0.22, this.attackCd * 0.8);
    this.swing = 1;
    this.heavyT = heavy ? 1 : 0;
    empujarAlGolpe(this, claseDe(held), heavy);
    this.golpePend = { t: ((heavy ? 0.3 : 0.18) + 0.16) / this.swingRate, mob, heavy, info, held, itemId: this.inventory.held ? this.inventory.held.id : 0 };
  }

  // el arma llegó: si la criatura sigue ahí, conecta; si se quitó, el golpe se va al aire
  tickGolpePropio(dt) {
    // el golpe corre también en tercera persona (antes solo avanzaba al dibujar la mano, y el personaje se quedaba tieso)
    this.swing = Math.max(0, this.swing - dt * (this.swingRate || 3.4));
    if (this.swing <= 0) { this.swingRate = 3.4; this.heavyT = 0; }
    this.handGolpe = Math.max(0, (this.handGolpe || 0) - dt * 5);
    this.ponerT = Math.max(0, (this.ponerT || 0) - dt);
    this.manoT = Math.max(0, (this.manoT || 0) - dt);
    const A = this.golpePend;
    if (!A) return;
    A.t -= dt;
    if (A.t > 0) return;
    this.golpePend = null;
    const s = this.inventory.held, m = A.mob, p = this.player.body.pos;
    if ((s ? s.id : 0) !== A.itemId || !this.player.alive) return;
    if (m.dead || m.dying || !golpeLlega(this, m, perfil(A.held).alcance)) { this.audio.play('swish', { ui: true, vol: 0.45, pitch: 1.2 - Math.min(0.5, perfil(A.held).empuje * 0.25) }); return; }
    this.asestar(m, A.heavy, A.info, A.held, p);
  }

  asestar(mob, heavy, info, held, p) {
    // v12.14.0 (F4): la criatura de otra persona es un títere: no se le pega aquí, se le dice al anfitrión «le pegué» y él decide
    if (mob.titere) {
      if (this.red && this.red.golpear) this.red.golpear(mob.nid, heavy);
      this.audio.play('punch', { pos: { x: mob.body.pos.x, y: mob.body.pos.y + 0.8, z: mob.body.pos.z }, vol: 0.6, pitch: 1 });
      if (this.mode === 'survival' && held && held.durability && this.inventory.wearHeld()) { this.audio.play('toolbreak'); this.ui.toast('¡Se rompió la herramienta!', 2000, 'urgente'); }
      return;
    }
    let dmg = 1;
    if (held && held.damage) dmg = held.damage;
    const G = prepararGolpe(this, mob, heavy, info.paso);
    const total = this.mode === 'creative' ? 100 : dmg * this.damageBonus() * info.mult * G.mult * filoGolpe(this) * factorMejora(this.inventory.held) * bonoDano(this, claseDe(held)); // la maestría del arma (maestria.js)
    const otros = this.mode === 'survival' ? otrosAlcanzados(this, mob, heavy, G) : [];
    let entro = false;
    try {
      this.golpeando = mob; // para saber quién pegó (la procesión solo se ofende con los golpes de uno)
      this.cuerpoACuerpo = true; // las flechas también marcan golpeando; esto es solo el arma en la mano
      entro = mob.hurt(total, p.x, p.z) !== false;
      // el mazo en redondo, la lanza que atraviesa
      for (const o of otros) { this.golpeando = o.m; o.m.hurt(total * o.k, p.x, p.z); if (o.m.dying) this.killedMob(o.m); }
    } finally { this.golpeando = null; this.cuerpoACuerpo = false; this.kbGolpe = null; this.rompeEscudo = false; }
    // lo atajado (escudo, concha, caparazón de frente) no aturde ni envenena
    if (entro) { despuesGolpe(this, mob, total, heavy, G); if (mob.type !== 'muneco') ganarMaestria(this, claseDe(held), total); } // el muñeco no sube la maestría
    if (entro && held && (held.veneno || held.key === 'cuchillo_pinza') && !mob.dying && this.mode === 'survival') mob.data.veneno = Math.max(mob.data.veneno || 0, held.veneno ? 6 : 4);
    afterStrike(this, mob, heavy, info);
    selloGolpe(this, mob, held);
    if (mob.dying) this.killedMob(mob);
    { // cada tipo de daño suena a lo suyo: el filo corta, lo contundente suena seco y grave, la punta entra
      const sp = { x: mob.body.pos.x, y: mob.body.pos.y + 0.8, z: mob.body.pos.z }, P = perfil(held);
      if (!entro) { /* lo atajado ya suena en su onHurt */ } else if (P.tipo === 'contundente' && held) { this.audio.play('punch', { pos: sp, vol: 0.9, pitch: 0.75 - Math.min(0.25, P.empuje * 0.1) }); this.audio.play('dig.stone', { pos: sp, vol: 0.35, pitch: 0.5 }); }
      else if (P.tipo === 'punta' && held) this.audio.play('flecha', { pos: sp, vol: 0.8, pitch: 0.75 });
      else if (held && (held.machete || held.damage >= 4)) this.audio.slash(true, sp);
    }
    if (this.mode === 'survival' && held && held.durability) {
      if (this.inventory.wearHeld()) { this.audio.play('toolbreak'); this.ui.toast('¡Se rompió la herramienta!', 2000, 'urgente'); }
    }
  }

  breakBlock(t, survival) {
    const id = t.id;
    const b = BLOCKS[id];
    if (b.hardness < 0) return;
    if (b.key === 'nido_marcado' && survival && !this.player.sneaking) { this.ui.toast('🐢 Es un nido protegido: para quitarlo, agáchese (Mayús)', 2000); return; } // v12.6.1
    this.world.setBlock(t.x, t.y, t.z, AIR);
    if (b.key === 'nido_marcado') this.world.setBE(t.x, t.y, t.z, null); // v12.6.3: si no, el nido huérfano seguía naciendo
    this.particles.blockBreak(t.x, t.y, t.z, id);
    this.audio.material(b.sound, 'break', { x: t.x + 0.5, y: t.y + 0.5, z: t.z + 0.5 });
    this.swing = 1;
    if (survival) {
      const held = this.herramientaEnMano();
      cavarTesoro(this, t);
      quizaDerrumbe(this, t, b);
      quizaAvispero(this, b, t.x, t.y, t.z);
      perlaDe(this, b, t.x, t.y, t.z);
      if (this.canHarvest(id)) {
        this.dropFromBlock(id, t.x, t.y, t.z);
        if (held && held.tool === 'shovel' && (b.key === 'dirt' || b.key === 'grass') && Math.random() < 0.25 && aguaCerca(this.world, t.x, t.y, t.z)) this.entities.dropItem(1102, 1, t.x + 0.5, t.y + 0.4, t.z + 0.5); // v12.7.0: una lombriz
        resembrar(this, b, t, held);
        if (ORE_XP[b.key]) this.addXP(ORE_XP[b.key]);
        const tronco = b.tool === 'axe' && /log|tronco/.test(b.key);
        if (b.tool === 'pickaxe' && b.hardness > 0) {
          gainSkill(this, 'mineria', ORE_XP[b.key] ? 3 + ORE_XP[b.key] : 0.5);
          if (ORE_XP[b.key] && (mult.doble(this, 'mineria') || (mana(this, 'buen_ojo') && Math.random() < 0.15))) { this.dropFromBlock(id, t.x, t.y, t.z); this.ui.toast('⛏️ ¡Veta doble!', 900); }
          if (!ORE_XP[b.key] && skillLv(this, 'mineria') >= 5 && Math.random() < 0.05) this.entities.dropItem(257, 1, t.x + 0.5, t.y + 0.4, t.z + 0.5);
        }
        if (tronco) {
          gainSkill(this, 'tala', 1.5);
          if (held && held.tool === 'axe') tumbarArbol(this, t);
          if (mult.doble(this, 'tala')) this.dropFromBlock(id, t.x, t.y, t.z);
          if (skillLv(this, 'tala') >= 5 && Math.random() < 0.08) this.entities.dropItem(Math.random() < 0.5 ? 261 : 256, 1, t.x + 0.5, t.y + 0.4, t.z + 0.5);
        }
      }
      const ahorra = held && ((held.tool === 'pickaxe' && skillLv(this, 'mineria') >= 10) || (held.tool === 'axe' && skillLv(this, 'tala') >= 10)) && Math.random() < 0.5;
      if (held && held.durability && b.hardness > 0 && !ahorra) {
        if (this.inventory.wearHeld()) { this.audio.play('toolbreak'); this.ui.toast('¡Se rompió la herramienta!', 2000, 'urgente'); }
      }
      this.player.hungerT += 0.5;
    }
  }

  // Lo que suelta un bloque cae al suelo como ítem que se puede recoger.
  dropFromBlock(id, x, y, z) {
    if (this.mode !== 'survival') return;
    const b = BLOCKS[id];
    const drop = (item) => this.entities.dropItem(item, 1, x + 0.5, y + 0.4, z + 0.5);
    if (b.door) { drop(266); return; }
    if (b.leafy && Math.random() < 0.12) drop(id); // de vez en cuando, la hoja misma: la piden recetas y la compostera
    if (b.key === 'leaves' && Math.random() < 0.06) drop(261);
    if (b.key === 'leaves' && Math.random() < 0.05 && this.world.gen.column(x, z).biome === 'jungle') drop(492);
    if (b.key === 'leaves' && Math.random() < 0.12 && ['bosque_seco', 'plains'].includes(this.world.gen.column(x, z).biome)) drop(384);
    if (b.key === 'turtle_nest') { this.ui.toast('¡Rompió un nido de tortuga!', 1800); this.world.setBE(x, y, z, null); return; }
    if (b.key === 'tall_grass') {
      if (Math.random() < 0.3) drop(K.tall_grass);
      const r = Math.random();
      if (r < 0.12) drop(267); else if (r < 0.2) drop(269);
      else if (r < 0.26 && ['norte', 'caribe'].includes(regionAt(this.world.gen, x, z))) drop(466);
      else if (r < 0.3 && regionAt(this.world.gen, x, z) === 'guanacaste') drop(480);
    }
    if (b.key === 'tall_grass' || b.key === 'helecho') { const h = hierbaDeMatorral(this, { x, z }); if (h) drop(h); }
    if (b.crop === 'pina') {
      if (b.stage === 3) {
        for (let k = 0; k < (1 + (Math.random() < 0.35 ? 1 : 0)) * (mult.doble(this, 'agricultura') ? 2 : 1); k++) drop(467);
        gainSkill(this, 'agricultura', 4);
        this.achieve('pina', 'Piñero de la Zona Norte');
      }
      drop(466);
      return;
    }
    if (b.crop === 'cafe') { drop(294); if (b.stage === 3) { drop(294); drop(294); } return; }
    if (b.crop && b.crop !== 'cane') {
      const seeds = b.crop === 'corn' ? 267 : 269;
      if (b.stage === 3) {
        const n = b.crop === 'corn' ? 1 + Math.floor(Math.random() * 2) : 2 + Math.floor(Math.random() * 3);
        const veces = n * (mult.doble(this, 'agricultura') || (mana(this, 'mano_verde') && Math.random() < 0.3) ? 2 : 1);
        for (let k = 0; k < veces; k++) drop(b.crop === 'corn' ? 268 : 269);
        gainSkill(this, 'agricultura', 3);
        if (skillLv(this, 'agricultura') >= 5) drop(seeds);
        if (skillLv(this, 'agricultura') >= 10 && Math.random() < 0.15) drop(280);
        if (b.crop === 'corn') for (let k = 0; k < 1 + Math.floor(Math.random() * 2); k++) drop(seeds);
      } else drop(seeds);
      return;
    }
    if (b.drop) drop(b.drop);
    if (b.tier > 0 && b.drop && this.inventory.count(285) > 0 && Math.random() < 0.3) { drop(b.drop); this.particles.burst(x + 0.5, y + 0.5, z + 0.5, [[0.3, 0.9, 0.5]], 8, 1.5); }
  }

  giveItem(id, n) {
    const left = this.inventory.add(id, n);
    if (left < n) this.audio.pickup();
    if (left > 0) { const q = this.player.body.pos; this.entities.dropItem(id, left, q.x, q.y + 1, q.z); } // con la mochila llena, los premios no se pierden
  }

  // estirar la mano para abrir, agarrar, usar: un gesto distinto al de pegar
  tocar() { this.manoT = 0.3; }

  rightClick() {
    const t = this.target;
    const held = this.inventory.held;
    // la ofrenda del monte y la corona llaman a los jefes (jefes2.js, final.js); la bombeta, planeando, da un empujón (alas.js)
    if (held && this.mode === 'survival' && (usarOfrenda(this, held.id) || usarCorona(this, held.id))) { this.useCd = 0.8; return; }
    if (held && usarBombeta(this, held.id)) { this.useCd = 0.4; return; }
    if (held && held.id === GANCHO && usarGancho(this, held.id)) { this.useCd = 0.35; return; } // el gancho con mecate (gancho.js)
    if (held && ponerMuneco(this, held.id, t)) { this.useCd = 0.4; return; } // el muñeco de práctica (muneco.js)
    if (t && usarMarisco(this, t, held)) { this.tocar(); this.useCd = 0.35; return; } // v12.7.2 (C5-A2): piangua, ostión y secadero
    if (t && usarArrecife(this, t, held)) { this.tocar(); this.useCd = 0.35; return; } // v12.6.0 (C5-B): nidos, coral, vivero y pecera
    // tomar agua del río (mano vacía) o llenar la cantimplora; tomar de la cantimplora; las hierbas del monte
    if (!held || held.id === CANTIMPLORA_VACIA) {
      const { e, d } = this.eyeAndDir();
      const ft = this.world.raycast(e.x, e.y, e.z, d.x, d.y, d.z, 4, true);
      if (ft && FLUID[ft.id] && (!t || Math.hypot(ft.x - e.x, ft.y - e.y, ft.z - e.z) <= Math.hypot(t.x - e.x, t.y - e.y, t.z - e.z)) && (held || (this.player.water ?? 20) < 20) && beberDelRio(this, ft, held)) { this.useCd = 0.6; this.tocar(); return; }
    }
    if (held && held.id === CANTIMPLORA && (this.player.water ?? 20) < 20 && this.mode === 'survival' && !(this.inventory.held.cruda && this.target && this.target.id === K.fogata)) { tomarCantimplora(this); this.useCd = 0.8; this.tocar(); return; } // apuntando a la fogata con agua sin hervir, la hierve
    // brocha: pinta el repello (cicla los colores)
    if (held && held.id === 446 && t && PINTABLE.includes(t.id)) {
      const sig = PINTABLE[(PINTABLE.indexOf(t.id) + 1) % PINTABLE.length];
      this.world.setBlock(t.x, t.y, t.z, sig);
      this.particles.blockBreak(t.x, t.y, t.z, sig, 8);
      this.audio.play('dig.cloth', { pos: { x: t.x + 0.5, y: t.y + 0.5, z: t.z + 0.5 }, vol: 0.5, pitch: 1.3 });
      if (this.mode === 'survival' && this.inventory.wearHeld()) this.ui.toast('Se gastó la brocha');
      this.achieve('brocha', 'Pintor de brocha gorda');
      this.useCd = 0.25; this.tocar();
      return;
    }
    if (held && (held.id === 455 || held.id === 456) && ponerDosRuedas(this, held, t)) { this.useCd = 0.4; this.tocar(); return; }
    if (held && held.id === AVIONETA_ITEM && ponerAvioneta(this, held, t)) { this.useCd = 0.5; this.tocar(); return; }
    if (held && held.id === CARRETA_ITEM && ponerCarreta(this, held, t)) { this.useCd = 0.5; this.tocar(); return; }
    if (held && PLANOS[held.id]) { if (usarPlano(this, held.id, t) && this.mode === 'survival') this.inventory.consumeHeld(1); this.useCd = 0.6; this.tocar(); return; }
    if (held && held.id === LIBRO) { if (leerLibro(this) && this.mode === 'survival') this.inventory.consumeHeld(1); this.useCd = 0.6; this.tocar(); return; }
    if (t && t.id === K.red_pesca) { recogerRed(this, t); this.useCd = 0.5; this.tocar(); return; }
    if (held && held.id === SACO) { usarSaco(this); this.useCd = 0.6; return; }
    if (held && held.id === ARCO) { if (usarArco(this) && this.mode === 'survival') this.inventory.consumeHeld(1); this.useCd = 0.6; this.tocar(); return; }
    if (held && held.id === TABLA) { usarTabla(this); this.useCd = 0.5; return; }
    if (held && held.id === BANDERA) { usarBandera(this); this.useCd = 0.6; this.tocar(); return; }
    if (held && held.id === PARAPENTE) { abrirParapente(this); this.useCd = 0.4; return; }
    if (held && held.id === PAPALOTE) { usarPapalote(this); this.useCd = 0.5; this.tocar(); return; }
    if (held && held.id === TROMPO) { if (tirarTrompo(this) && this.mode === 'survival') this.inventory.consumeHeld(1); this.useCd = 0.6; this.tocar(); return; }
    if (held && held.id === SILBATO) { if (usarSilbato(this) && this.mode === 'survival') this.inventory.consumeHeld(1); this.useCd = 1; this.tocar(); return; }
    if (held && held.id === MECHON) { usarMechon(this); this.useCd = 0.6; this.tocar(); return; }
    if (held && held.id === CACHO) { soplarCacho(this); this.useCd = 0.6; this.tocar(); return; }
    if (held && held.id === FRAGMENTO) { usarFragmento(this); if (this.mode === 'survival') this.inventory.consumeHeld(1); this.useCd = 0.6; this.tocar(); return; }
    if (held && held.id === ESCAMA) { usarEscama(this); if (this.mode === 'survival') this.inventory.consumeHeld(1); this.useCd = 0.6; this.tocar(); return; }
    if (held && held.id === RED) { const { e, d } = this.eyeAndDir(); const ft = this.world.raycast(e.x, e.y, e.z, d.x, d.y, d.z, 6, true); if (tirarRed(this, ft) && this.mode === 'survival') this.inventory.consumeHeld(1); this.useCd = 0.5; this.tocar(); return; }
    if (held && held.id === BATEA) { const { e, d } = this.eyeAndDir(); const ft = this.world.raycast(e.x, e.y, e.z, d.x, d.y, d.z, 5, true); if (batear(this, ft)) { this.useCd = 0.4; return; } }
    if (held && held.id === 447) { this.ui.openMochila(); this.useCd = 0.4; return; }
    if (held && held.id === MAPA) { usarMapa(this); this.useCd = 0.8; this.tocar(); return; }
    if (held && held.id === CARETA) { usarCareta(this); if (this.mode === 'survival') this.inventory.consumeHeld(1); this.useCd = 0.8; this.tocar(); return; }
    if (held && held.id === CHANCLETA) { lanzarChancleta(this); this.useCd = 0.5; this.tocar(); return; }
    if (held && held.id === CANDELA) { if (encenderCandela(this) && this.mode === 'survival') this.inventory.consumeHeld(1); this.useCd = 0.8; this.tocar(); return; }
    if (held && held.id === SOBRE_EST && this.mode === 'survival') { abrirSobre(this); this.inventory.consumeHeld(1); this.useCd = 0.5; this.tocar(); return; }
    if (held && held.id === ACEITE) { if (untarFilo(this) && this.mode === 'survival') this.inventory.consumeHeld(1); this.useCd = 0.6; this.tocar(); return; }
    if (held && CURAS[held.id] && this.mode === 'survival' && !(this.mobTarget && this.mobTarget.mob.data && this.mobTarget.mob.data.guila)) { usarCura(this, held.id); this.inventory.consumeHeld(1); this.useCd = 0.7; this.tocar(); return; }
    if (held && HIERBAS[held.id]) { usarHierba(this, held.id); this.inventory.consumeHeld(1); this.useCd = 0.6; this.tocar(); return; }
    if (held && held.id === COBIJA && usarCobija(this)) { this.useCd = 0.8; this.tocar(); return; } // v12.3.0
    if (t && fogatas().has(t.id) && !(this.keys.has('ShiftLeft') || this.keys.has('ShiftRight'))) { if (!usarFogata(this, t, held)) cocinarEnFogata(this, t, held); this.useCd = 0.35; this.tocar(); return; }
    if (held && held.id >= 1150 && held.id <= 1152 && usarLibroOficio(this, held)) { this.useCd = 0.5; this.tocar(); return; } // v12.15.1 (C6)
    if (t && usarTaller(this, t, held)) { this.useCd = 0.25; this.tocar(); return; }
    if (t && t.id === K.stove && usarFogon(this, t, held)) { this.useCd = 0.25; this.tocar(); return; } // v12.1.0: cargar el fogón con leña
    if (this.mobTarget && this.mobTarget.mob.interact(held)) { this.tocar(); this.useCd = 0.35; return; }
    const hdef = held ? getDef(held.id) : null;
    const sneak = this.keys.has('ShiftLeft') || this.keys.has('ShiftRight');
    // bloques que se usan
    if (t && t.id === K.corazon_tiquicia && !sneak) { usarCorazon(this, t); this.useCd = 0.6; this.tocar(); return; }
    if (t && t.id === K.yunque && !sneak) { usarYunque(this, t); this.useCd = 0.5; this.tocar(); return; }
    if (t && !sneak && usarErmita(this, t)) { this.useCd = 0.5; return; } // la ermita de camino (ermitas.js)
    if (t && t.id === K.olla_caliente && !sneak) { usarOlla(this, t, this.inventory.held); this.useCd = 0.3; this.tocar(); return; }
    if (t && t.id === K.plato_vacio && !sneak && held) { llenarPlato(this, t, held); this.useCd = 0.4; this.tocar(); return; }
    if (t && t.id === K.compostera && !sneak) { usarCompostera(this, t); this.useCd = 0.25; this.tocar(); return; }
    if (t && held && held.id === K.bonita && BLOCKS[t.id].crop && BLOCKS[t.id + 1] && BLOCKS[t.id + 1].crop === BLOCKS[t.id].crop) {
      // abono de boñiga: el cultivo crece una etapa
      this.world.setBlock(t.x, t.y, t.z, t.id + 1);
      this.particles.burst(t.x + 0.5, t.y + 0.6, t.z + 0.5, [[0.3, 0.7, 0.2], [0.5, 0.35, 0.2]], 10, 1);
      if (this.mode === 'survival') this.inventory.remove(K.bonita, 1);
      this.achieve('abono', 'Abono natural');
      this.useCd = 0.3; this.tocar(); return;
    }
    if (t && !sneak) {
      const b = BLOCKS[t.id];
      if (b.explosive) {
        // hace falta fuego: el mechero (se gasta) o una antorcha; en creativo, cualquier cosa
        const fire = held && (held.id === 391 || held.id === K.torch);
        if (!fire && this.mode !== 'creative') { this.ui.toast('🧨 Ocupa un mechero o una antorcha en la mano para encenderla', 2600); this.useCd = 0.3; return; }
        this.entities.lightDynamite(t.x, t.y, t.z);
        this.audio.play('ignite', { pos: { x: t.x + 0.5, y: t.y + 0.5, z: t.z + 0.5 }, vol: 0.5 });
        this.particles.burst(t.x + 0.5, t.y + 1.05, t.z + 0.5, [[1, 0.8, 0.3], [1, 0.5, 0.1]], 8, 0.8);
        if (held && held.id === 391 && this.mode === 'survival' && this.inventory.wearHeld()) this.ui.toast('Se acabó el gas del mechero');
        this.tocar(); this.useCd = 0.3; return;
      }
      if (b.key === 'placa') {
        const be = this.world.getBE(t.x, t.y, t.z);
        this.ui.dialog(be && be.title ? be.title : 'Placa', be && be.text ? be.text : 'La placa está gastada y no se lee nada.', 9000);
        this.audio.play('pop', { ui: true, vol: 0.25, pitch: 0.8 });
        if (be && be.title) {
          this.meta.monuments = this.meta.monuments || {};
          if (!this.meta.monuments[be.title]) {
            this.meta.monuments[be.title] = this.day || 1;
            this.achieve('turista', 'Turismo con curiosidad');
            if (Object.keys(this.meta.monuments).length >= 5) this.achieve('conocedor', 'Conocedor de Costa Rica');
          }
        }
        this.useCd = 0.5;
        return;
      }
      if (b.door && held && held.id === TRANCA) { if (trancar(this, t) && this.mode === 'survival') this.inventory.consumeHeld(1); this.tocar(); this.useCd = 0.4; return; }
      if (b.door) { this.stations.toggleDoor(t.x, t.y, t.z); this.tocar(); this.useCd = 0.3; return; }
      if (b.toggleTo && !(held && BLOCKS[held.id] && this.player.sneaking)) { this.toggleBlock(t.x, t.y, t.z); this.tocar(); this.useCd = 0.3; return; }
      if (b.bed) { this.trySleep(t.x, t.y, t.z); this.useCd = 0.5; return; }
      if (b.barril) { barrilInteract(this, t.x, t.y, t.z); this.tocar(); this.useCd = 0.35; return; }
      if (b.key === 'tablon_encargos') { usarTablon(this, t.x, t.y, t.z); this.tocar(); this.useCd = 0.35; return; } // v12.4.12 (C8-A)
      if (b.key === 'trapiche') {
        let be = this.world.getBE(t.x, t.y, t.z);
        if (!be) { be = { type: 'trapiche', cane: 0, made: 0, t: 0 }; this.world.setBE(t.x, t.y, t.z, be); }
        if (held && held.id === 296) {
          be.cane += held.count; this.inventory.slots[this.inventory.selected] = null; this.inventory.changed();
          this.world.touchBE(t.x, t.y, t.z);
          this.ui.toast(`El trapiche tiene ${be.cane} cañas (3 cañas = 1 tapa de dulce)`, 1800);
        } else if (held && held.id === 289) { // v12.4.0: con un balde vacío, guarapo (3 cañas)
          if (be.cane < 3) { this.ui.toast('🍯 Para un balde de guarapo hacen falta 3 cañas en el trapiche', 1800); }
          else { be.cane -= 3; this.inventory.consumeHeld(1); this.inventory.add(574, 1); this.world.touchBE(t.x, t.y, t.z); this.audio.play('splash', { ui: true, vol: 0.35, pitch: 1.2 }); this.ui.toast('🥤 Un balde de guarapo, recién molido', 1800); this.achieve('guarapo', 'Guarapo de la casa'); }
        } else if (be.made > 0) {
          const pp = this.player.body.pos;
          this.entities.dropItem(297, be.made, t.x + 0.5, t.y + 1.2, t.z + 0.5, { x: (pp.x - t.x - 0.5) * 1.6, y: 3, z: (pp.z - t.z - 0.5) * 1.6 }, 0.2); be.made = 0; this.world.touchBE(t.x, t.y, t.z);
          this.audio.pickup();
        } else this.ui.toast(be.cane >= 3 ? 'Moliendo la caña…' : 'Ponga caña de azúcar en el trapiche', 1500);
        this.useCd = 0.4; this.tocar();
        return;
      }
      if (b.crop === 'cafe' && b.stage === 3) {
        this.world.setBlock(t.x, t.y, t.z, K.cafe1, { updates: false });
        const pp = this.player.body.pos;
        if (cogerConCajuela(this, 2 + Math.floor(Math.random() * 2))) { this.audio.material('leaves', 'hit', { x: t.x + 0.5, y: t.y + 0.5, z: t.z + 0.5 }); this.tocar(); this.useCd = 0.3; return; }
        this.entities.dropItem(294, 2 + Math.floor(Math.random() * 2), t.x + 0.5, t.y + 0.6, t.z + 0.5, { x: (pp.x - t.x - 0.5) * 1.6, y: 3, z: (pp.z - t.z - 0.5) * 1.6 }, 0.2);
        this.audio.material('leaves', 'hit', { x: t.x + 0.5, y: t.y + 0.5, z: t.z + 0.5 });
        this.achieve('cafe', '¡A coger café!');
        this.tocar(); this.useCd = 0.3;
        return;
      }
      if (MUEBLES.has(b.key) && !(this.keys.has('ShiftLeft') || this.keys.has('ShiftRight')) && usarMueble(this, t)) { this.useCd = 0.4; this.tocar(); return; }
      if (b.station === 'chest' && this.meta.invitado && this.red && this.red.pedirCofre) { this.red.pedirCofre(t.x, t.y, t.z); this.useCd = 0.5; return; } // v12.15.0: el anfitrión da el contenido y pone el candado
      if (b.station && this.meta.invitado && ['chest', 'furnace', 'cooking', 'taller'].includes(b.station)) { this.ui.toast('En el mundo de otra persona los hornos, fogones y talleres aún no se abren (los cofres sí)', 2600); this.useCd = 0.4; return; } // v12.13.0: sin cofres no hay forma de duplicar lo que se guarda en ellos
      if (b.station) {
        // mundos viejos: la mesa no tenía datos guardados
        if (!this.world.getBE(t.x, t.y, t.z)) this.stations.placed(t.id === K.furnace_lit ? K.furnace : t.id, t.x, t.y, t.z, 0);
        if (b.key === 'chest' && recogerBolso(this, t.x, t.y, t.z)) { this.useCd = 0.3; return; }
        if (b.station === 'chest' && this.red && this.red.rol === 'anfitrion') { // v12.15.0: si una persona invitada lo tiene abierto, no se abre
          const c = this.red.cofreHostAbre(t.x, t.y, t.z);
          if (!c.ok) { this.ui.toast(`🔒 ${c.quien} tiene abierto ese cofre. Espere a que lo cierre`, 2400); this.useCd = 0.5; return; }
        }
        this.ui.openStation(b.station, t.x, t.y, t.z);
        if (b.station === 'chest' && this.red && this.red.rol === 'anfitrion' && !(this.ui.station && this.ui.station.type === 'chest')) this.red.cofreHostCierra(t.x, t.y, t.z); // no llegó a abrirse (chanchito…)
        this.useCd = 0.3;
        return;
      }
    }
    // honda, cerbatana y lanza: la cerbatana dispara de una; las otras se cargan como el arco
    if (held && RANGO[held.id]) {
      if (!tieneMunicion(this, held.id)) { this.ui.toast(`No tiene ${RANGO[held.id].nombre}`, 1200); this.useCd = 0.5; return; }
      if (RANGO[held.id].instant) { disparar(this, held.id, 1); this.useCd = 0.8; return; }
      if (!this.bowDraw) this.bowDraw = { t: 0 };
      return;
    }
    // arco: se carga manteniendo el clic derecho
    if (held && held.id === BOW) {
      if (this.mode === 'survival' && !flechaQueToca(this.inventory)) { this.ui.toast('No anda flechas', 1200); this.useCd = 0.5; return; }
      if (!this.bowDraw) this.bowDraw = { t: 0 };
      return;
    }
    // pluma de quetzal sobre un marco de calcita: enciende el portal del cielo
    if (held && held.id === 278 && t && t.id === K.calcite) {
      const cells = findFrame(this.world, t.x, t.y, t.z, K.calcite);
      this.useCd = 0.5; this.tocar();
      if (!cells) { this.ui.toast('Marco de calcita (2 de ancho, 3 de alto por dentro) y tóquelo con una pluma de quetzal', 2600); return; }
      for (const [x, y, z] of cells) this.world.setBlock(x, y, z, K.portal_cielo, { updates: false });
      if (this.mode === 'survival') this.inventory.consumeHeld(1);
      this.audio.play('portal', { pos: { x: t.x + 0.5, y: t.y + 0.5, z: t.z + 0.5 }, vol: 0.9, pitch: 1.4 });
      this.particles.burst(t.x + 0.5, t.y + 1.5, t.z + 0.5, [[0.6, 0.8, 1], [1, 0.9, 0.5]], 40, 3);
      this.achieve('portal_cielo', 'Portal al cielo');
      return;
    }
    // bola de fútbol: se pone en el suelo
    if (held && held.id === BOLA_ITEM) { if (t && SOLID[t.id]) { ponerBola(this, t); this.useCd = 0.4; this.tocar(); } return; }
    // repelente: los zancudos no se arriman por 5 minutos
    if (held && held.id === LIBRO_ENCARGOS) { verLibro(this); this.useCd = 0.5; return; } // v12.4.12
    if (held && held.id === REPELENTE) { this.addEffect('repelente', 300); this.inventory.consumeHeld(1); this.ui.toast('🦟 Huele a limón y a guaro… los zancudos ni se arriman (5 min)', 2400); this.useCd = 0.5; this.tocar(); return; }
    // polea sobre un cable: ¡tirolesa!
    if (held && held.id === POLEA && t && (t.id === K.cable || t.id === K.cable_z) && !this.zip && !this.riding) { startZip(this, t); this.useCd = 0.5; this.tocar(); return; }
    // escritura de lote: este pedazo de tierra ahora es suyo
    if (held && ESCRITURAS.includes(held.id)) { useEscritura(this, held, t); this.useCd = 0.6; this.tocar(); return; }
    if (held && held.id === CAMPANA && usarCampana(this)) { this.useCd = 0.6; this.tocar(); return; } // v12.16.5: la Campana de la casa
    // v12.15.4 (C8-B): tambor, trompeta y vela de la novena
    if (held && (held.id === 1180 || held.id === 1181 || held.id === 1186) && usarPatronal(this, held)) { this.useCd = 0.45; this.tocar(); return; }
    // v12.15.2 (C7): el pase de los termales y el huevo en la poza
    if (held && (held.id === 1169 || held.id === 287) && usarFuego(this, held)) { this.useCd = 0.5; this.tocar(); return; }
    // pluma dorada: caída lenta
    if (held && held.id === 388) {
      this.addEffect('pluma', 180);
      this.ui.toast('🪶 Pluma dorada: cae despacito como una hoja', 2000);
      this.audio.play('aleteo', { vol: 0.6 });
      this.useCd = 0.5; this.tocar();
      return;
    }
    // llave del volcán sobre un marco de obsidiana: enciende el portal
    if (held && held.id === KEY_ITEM && t && t.id === K.obsidian) {
      const cells = findFrame(this.world, t.x, t.y, t.z);
      this.useCd = 0.5; this.tocar();
      if (!cells) { this.ui.toast('Haga un marco de obsidiana (por dentro 2 de ancho y 3 de alto) y tóquelo con la llave', 2600); return; }
      for (const [x, y, z] of cells) this.world.setBlock(x, y, z, K.portal, { updates: false });
      this.audio.play('portal', { pos: { x: t.x + 0.5, y: t.y + 0.5, z: t.z + 0.5 }, vol: 0.9 });
      this.particles.burst(t.x + 0.5, t.y + 1.5, t.z + 0.5, [[1, 0.4, 0.2], [0.8, 0.2, 0.6]], 40, 3);
      this.achieve('portal', 'Portal volcánico');
      return;
    }
    // caña de pescar
    if (held && esCana(held.id)) { this.useRod(); return; } // v12.7.0: las tres cañas (esCana)
    // bombeta: sale desde el bloque al que apuntás (o desde tus pies)
    if (held && held.id === BOMBETA) {
      const p = this.player.body.pos;
      const sx = t ? t.x + 0.5 + t.nx * 0.5 : p.x, sy = t ? t.y + 0.5 + t.ny * 0.6 : p.y + 0.2, sz = t ? t.z + 0.5 + t.nz * 0.5 : p.z;
      (this.rockets ||= []).push(new Rocket(this, sx, sy, sz));
      if (this.mode === 'survival') this.inventory.consumeHeld(1);
      this.useCd = 0.5; this.tocar();
      return;
    }
    // carro viejo: se pone en el suelo
    if (held && held.id === CARRO_ITEM) {
      if (t && SOLID[t.id] && this.dim === 'tierra') {
        const m = this.entities.spawnMob('carro', t.x + 0.5, t.y + 1.05, t.z + 0.5);
        m.tamed = true; m.yaw = this.player.yaw + Math.PI; m.data.fuel = 60; m.data.llantas = 4;
        if (this.mode === 'survival') this.inventory.consumeHeld(1);
        this.audio.play('hueco', { pos: { x: t.x + 0.5, y: t.y + 1, z: t.z + 0.5 }, vol: 0.5 });
        this.ui.toast('🚗 Su carro de segunda. Clic derecho para subirse; con un bidón le echa gasolina', 2600);
        this.useCd = 0.4; this.tocar();
      } else this.ui.toast('El carro se pone en el suelo', 1400);
      return;
    }
    // bote: se pone sobre el agua
    if (held && (held.id === 358 || held.id === 457 || held.id === 1148)) {
      const { e, d } = this.eyeAndDir();
      const ft = this.world.raycast(e.x, e.y, e.z, d.x, d.y, d.z, 6, true);
      if (ft && FLUID[ft.id] === 1) {
        const m = this.entities.spawnMob('bote', ft.x + 0.5, ft.y + 0.7, ft.z + 0.5);
        m.tamed = true; m.yaw = this.player.yaw + Math.PI;
        if (held.id === 1148) m.data.cayuco = true; // v12.15.1 (C6): la canoa de un tronco, al 70 % del bote
        if (held.id === 457) { m.data.motor = true; m.data.fuel = 60; this.ui.toast('🚤 Lancha: W acelera (Ctrl a fondo) · el bidón le echa gasolina', 2600); }
        if (this.mode === 'survival') this.inventory.consumeHeld(1);
        this.audio.play('splash', { pos: { x: ft.x + 0.5, y: ft.y + 1, z: ft.z + 0.5 }, vol: 0.5 });
        this.useCd = 0.4; this.tocar();
      } else this.ui.toast('El bote se pone en el agua', 1400);
      return;
    }
    // la bomba de espalda: rocía lejos sobre la quema; se llena apuntando al agua
    if (held && held.id === BOMBA) { usarBomba(this); return; }
    // baldes: juntar y vaciar agua o lava
    if (hdef && hdef.bucket) {
      const { e, d } = this.eyeAndDir();
      const ft = this.world.raycast(e.x, e.y, e.z, d.x, d.y, d.z, this.mode === 'creative' ? 6 : 4.6, true);
      if (!ft) return;
      if (hdef.bucket === 'empty') {
        if (FLUID[ft.id] && BLOCKS[ft.id].source) {
          this.world.setBlock(ft.x, ft.y, ft.z, AIR);
          if (this.mode === 'survival') this.inventory.consumeHeld(1);
          this.inventory.add(FLUID[ft.id] === 1 ? 290 : 291, 1);
          this.audio.play('balde', { pos: { x: ft.x + 0.5, y: ft.y + 0.5, z: ft.z + 0.5 }, vol: 0.6 });
          this.useCd = 0.3; this.tocar();
        }
        return;
      }
      // un baldazo sobre la quema la apaga, sin dejar el charco
      if (hdef.bucket === 'water' && (apagarConBalde(this, ft.x, ft.y, ft.z) || apagarIncendio(this, ft.x, ft.y, ft.z))) {
        if (this.mode === 'survival') { this.inventory.consumeHeld(1); this.inventory.add(289, 1); }
        this.useCd = 0.3; this.tocar();
        return;
      }
      const px = ft.x + ft.nx, py = ft.y + ft.ny, pz = ft.z + ft.nz;
      const ex = this.world.getBlock(px, py, pz);
      if (ex !== AIR && !FLUID[ex] && BLOCKS[ex].render !== 'cross') return;
      this.world.setBlock(px, py, pz, hdef.bucket === 'water' ? K.water : K.lava);
      this.world.scheduleFluid(px, py, pz, 50);
      if (this.mode === 'survival') { this.inventory.consumeHeld(1); this.inventory.add(289, 1); }
      this.audio.play(hdef.bucket === 'water' ? 'splash' : 'ignite', { pos: { x: px + 0.5, y: py + 0.5, z: pz + 0.5 }, vol: 0.5 });
      this.useCd = 0.3; this.tocar();
      return;
    }
    // agua bendita: por 3 minutos los golpes le entran a los espantos (el Padre sin Cabeza)
    if (hdef && hdef.bendita) {
      this.addEffect('bendicion', 180);
      if (this.mode === 'survival') { this.inventory.consumeHeld(1); this.inventory.add(283, 1); }
      this.particles.burst(this.player.body.pos.x, this.player.body.pos.y + 1.2, this.player.body.pos.z, [[0.8, 0.9, 1], [1, 1, 0.8]], 18, 1.6);
      this.audio.play('splash', { ui: true, vol: 0.4, pitch: 1.4 });
      this.ui.toast('✝ Con la bendición por 3 minutos: ahora sus golpes le entran a los espantos', 2600);
      this.useCd = 0.5;
      return;
    }
    // suero antiofídico: se toma de una
    if (hdef && hdef.drink) {
      delete this.player.effects.veneno; delete this.player.effects.paralisis;
      if (this.player.necrosis) { this.player.necrosis = 0; this.meta.necrosis = 0; this.ui.toast('💉 El suero paró la necrosis: vuelve su vida de siempre', 2400); }
      this.inventory.consumeHeld(1);
      this.inventory.add(283, 1);
      this.audio.play('eat', { vol: 0.4, pitch: 1.3 });
      this.ui.toast('Se le quitó el veneno', 1400);
      this.useCd = 0.5;
      return;
    }
    // guano: abono que hace crecer un cultivo
    if (t && hdef && hdef.fertilizer && BLOCKS[t.id].crop) {
      const b = BLOCKS[t.id];
      if (b.stage < 3) {
        this.world.setBlock(t.x, t.y, t.z, K[`${b.crop}${b.stage + 1}`], { updates: false });
        this.particles.burst(t.x + 0.5, t.y + 0.5, t.z + 0.5, [[0.5, 0.9, 0.4], [0.8, 1, 0.6]], 10, 1.4);
        if (this.mode === 'survival') this.inventory.consumeHeld(1);
        this.useCd = 0.25; this.tocar();
      }
      return;
    }
    // colmena de meliponas: miel cada cierto tiempo
    if (t && BLOCKS[t.id].hive && !sneak) {
      let be = this.world.getBE(t.x, t.y, t.z);
      if (!be) { be = { type: 'hive', last: -9999, facing: 0 }; this.world.setBE(t.x, t.y, t.z, be); }
      if ((this.clock || 0) - be.last > 180) {
        be.last = this.clock; this.world.touchBE(t.x, t.y, t.z);
        this.entities.dropItem(279, 1 + Math.floor(Math.random() * 2), t.x + 0.5, t.y + 1, t.z + 0.5);
        this.particles.burst(t.x + 0.5, t.y + 0.7, t.z + 0.5, [[1, 0.85, 0.2], [0.2, 0.15, 0.05]], 12, 1.5);
        this.ui.toast('Las meliponas le regalaron miel', 1400);
      } else this.ui.toast('Las meliponas todavía están haciendo miel', 1400);
      this.useCd = 0.4; this.tocar();
      return;
    }
    // comer
    if (hdef && hdef.food && this.mode === 'survival') {
      if (usarOfrenda(this, held.id) || usarCorona(this, held.id)) { this.useCd = 0.8; return; }
      if (usarBombeta(this, held.id)) { this.useCd = 0.4; return; } // la ofrenda del monte llama al jefe del bioma (jefes2.js)
      if (taparTorsalo(this, held.id)) { this.useCd = 0.5; return; } // con tórsalo, el chicharrón va sobre el piquete
      if (this.player.food < 20 && !this.eating) this.eating = { t: 0, id: held.id, chew: 0 };
      return;
    }
    // azada: arar pasto o tierra
    if (t && hdef && hdef.tool === 'hoe' && (t.id === K.grass || t.id === K.dirt || t.id === K.snow_grass) && this.world.getBlock(t.x, t.y + 1, t.z) === AIR) {
      this.world.setBlock(t.x, t.y, t.z, this.hydrated(t.x, t.y, t.z) ? K.farmland_wet : K.farmland);
      this.audio.material('gravel', 'place', { x: t.x + 0.5, y: t.y + 1, z: t.z + 0.5 });
      this.particles.dust(t.x + 0.5, t.y + 1, t.z + 0.5, K.dirt, 8);
      this.tocar(); this.useCd = 0.25;
      if (this.mode === 'survival' && this.inventory.wearHeld()) { this.audio.play('toolbreak'); this.ui.toast('¡Se rompió la herramienta!', 2000, 'urgente'); }
      return;
    }
    // armadura: clic derecho con una pieza en la mano la equipa
    if (hdef && hdef.armor) {
      const inv = this.inventory;
      const slot = hdef.armorSlot;
      const old = inv.armor[slot];
      inv.armor[slot] = { ...held };
      inv.slots[inv.selected] = old;
      inv.changed();
      this.audio.armor(hdef.mat);
      this.ui.equipPop(held.id, inv.armorValue().points);
      this.tocar();
      this.useCd = 0.3;
      return;
    }
    // colocar
    if (!t || !held) return;
    let placeId = isBlockId(held.id) ? held.id : (ITEMS[held.id] && ITEMS[held.id].places);
    if (!placeId) return;
    // losa sobre la misma losa: se vuelve el bloque entero
    if (BLOCKS[placeId].slab && t.id === placeId && t.ny === 1) {
      this.world.setBlock(t.x, t.y, t.z, K[BLOCKS[placeId].full]);
      this.audio.material(BLOCKS[placeId].sound, 'place', { x: t.x + 0.5, y: t.y + 0.5, z: t.z + 0.5 });
      this.tocar(); this.useCd = 0.22;
      if (this.mode === 'survival') this.inventory.consumeHeld(1);
      return;
    }
    // escaleras: la parte alta queda hacia donde mira el jugador
    if (BLOCKS[placeId].stairBase !== undefined) {
      const dd = this.player.lookDir();
      placeId = BLOCKS[placeId].stairBase + ((facingFromLook(dd.x, dd.z) + 2) % 4);
    }
    // portones y cortinas: atravesados a donde mira (el panel queda de frente)
    if (placeId === K.porton || placeId === K.cortina) { const dd = this.player.lookDir(); if (Math.abs(dd.x) > Math.abs(dd.z)) placeId = placeId === K.porton ? K.porton_z : K.cortina_z; }
    if (placeId === K.postigo) { const dd = this.player.lookDir(); if (Math.abs(dd.x) > Math.abs(dd.z)) placeId = K.postigo_z; } // v12.4.9
    // cables: a lo largo de hacia donde mira (así se arman tirolesas)
    if (placeId === K.cable) { const dd = this.player.lookDir(); if (Math.abs(dd.z) > Math.abs(dd.x)) placeId = K.cable_z; }
    let px = t.x + t.nx, py = t.y + t.ny, pz = t.z + t.nz;
    if (BLOCKS[t.id].render === 'cross') { px = t.x; py = t.y; pz = t.z; }
    if (py < 0 || py >= HEIGHT) return;
    const existing = this.world.getBlock(px, py, pz);
    if (existing !== AIR && !FLUID[existing] && BLOCKS[existing].render !== 'cross') return;
    let nb = BLOCKS[placeId];
    if (nb.key === 'torch') {
      if (t.ny === -1) return;
      if (t.ny === 0) {
        if (!SOLID[t.id]) return;
        const f = t.nz === 1 ? 0 : t.nx === 1 ? 1 : t.nz === -1 ? 2 : 3;
        placeId = K[`wall_torch${f}`];
        nb = BLOCKS[placeId];
      }
    }
    const tall = nb.door ? 2 : 1;
    if (nb.solid || nb.door) {
      for (let k = 0; k < tall; k++) {
        if (this.player.body.intersectsBlock(px, py + k, pz)) return;
        for (const m of this.entities.mobs) if (m.body.intersectsBlock(px, py + k, pz)) return;
      }
    }
    if (nb.needsSupport && !nb.needsSupport.includes(this.world.getBlock(px, py - 1, pz))) return;
    if (nb.needsSolidBelow && !SOLID[this.world.getBlock(px, py - 1, pz)]) return;
    if (nb.cane && !this.world.caneOk(px, py, pz)) { this.ui.toast('La caña se siembra junto al agua', 1400); return; }
    const d = this.player.lookDir();
    const facing = facingFromLook(d.x, d.z);
    if (nb.door) {
      if (!this.stations.placeDoor(px, py, pz, facing)) return;
    } else {
      this.world.setBlock(px, py, pz, placeId);
      this.stations.placed(placeId, px, py, pz, facing, true); // propio: lo puso uno con la mano
      revisarAcertijo(this, px, py, pz, placeId);
      if (nb.render === 'cube' || nb.render === 'cutout') this.addPlaceFx(placeId, px, py, pz);
      else if (nb.tex) this.particles.chip({ x: px, y: py, z: pz, id: placeId, nx: 0, ny: 1, nz: 0 }); // lo que no es cubo suelta un poquito de polvo al asentarse
    }
    this.audio.material(nb.sound, 'place', { x: px + 0.5, y: py + 0.5, z: pz + 0.5 });
    this.ponerT = 0.16; // un empujoncito, no un golpe
    this.useCd = 0.22;
    if (this.mode === 'survival') this.inventory.consumeHeld(1);
  }

  // ---------- portones, cortinas y palancas ----------
  toggleBlock(x, y, z) {
    const w = this.world, b = BLOCKS[w.getBlock(x, y, z)];
    const to = K[b.toggleTo];
    if (!to) return;
    // un portón no se cierra encima de alguien
    if (BLOCKS[to].solid && [this.player.body, ...this.entities.mobs.map((m) => m.body)].some((bd) => bd.intersectsBlock(x, y, z))) return;
    animarAbrir(this, x, y, z, b, BLOCKS[to]);
    w.setBlock(x, y, z, to, { updates: false });
    const pos = { x: x + 0.5, y: y + 0.5, z: z + 0.5 };
    if (b.key.startsWith('porton')) this.audio.play(BLOCKS[to].solid ? 'door.close' : 'creak', { pos, vol: 0.7, pitch: 0.85 });
    else if (b.key.startsWith('cortina')) this.audio.material('cloth', 'place', pos);
    else if (/^(lamp|farol)/.test(b.key)) this.audio.play('door.close', { pos, vol: 0.25, pitch: 2.6 });
    else this.audio.play('door.close', { pos, vol: 0.5, pitch: 1.8 });
    // la palanca: abre (o cierra) todo lo que se abre a 5 bloques: puertas, portones y cortinas
    if (b.lever) {
      const abrir = BLOCKS[to].key === 'palanca_on';
      let n = 0;
      for (let dz = -5; dz <= 5; dz++) for (let dy = -3; dy <= 3; dy++) for (let dx = -5; dx <= 5; dx++) {
        const X = x + dx, Y = y + dy, Z = z + dz, nb = BLOCKS[w.getBlock(X, Y, Z)];
        if (nb.lever) continue;
        if (nb.door && !nb.upper) { const be = w.getBE(X, Y, Z); if (be && be.open !== abrir) { this.stations.toggleDoor(X, Y, Z); n++; } continue; }
        if (/^(lamp|farol)(_off)?$/.test(nb.key)) { if (nb.key.endsWith('_off') === abrir) { this.toggleBlock(X, Y, Z); n++; } continue; }
        if (nb.toggleTo && nb.key.endsWith('_open') !== abrir) { this.toggleBlock(X, Y, Z); n++; }
      }
      this.particles.burst(pos.x, pos.y, pos.z, [[1, 0.3, 0.2], [1, 0.8, 0.3]], 6, 1);
      if (n) this.achieve('palanca', 'Ingeniero de la casa');
    }
  }

  // ---------- bote ----------
  mountBoat(m) {
    this.riding = m;
    m.data.ridden = true;
    this.player.flying = false;
    this.audio.play('dig.wood', { pos: m.soundPos(), vol: 0.5 });
    this.ui.toast('W para remar · Ctrl rema fuerte · Shift para bajarse', 2200);
  }

  // ---------- arco ----------
  tickBow(dt) {
    const held = this.inventory.held;
    if (!held || (held.id !== BOW && !RANGO[held.id])) { this.bowDraw = null; return; }
    if (this.mouse.right) {
      const before = this.bowDraw.t;
      this.bowDraw.t = Math.min(1.2, this.bowDraw.t + dt);
      if (before < 1 && this.bowDraw.t >= 1) this.audio.play('creak', { vol: 0.25, pitch: 1.6 });
      return;
    }
    // soltar: dispara si alcanzó a tensar
    const c = Math.min(1, this.bowDraw.t);
    this.bowDraw = null;
    if (c < 0.15) return;
    if (held.id !== BOW) { disparar(this, held.id, c); this.useCd = 0.3; return; }
    const { e, d } = this.eyeAndDir();
    const sp = 12 + 28 * c;
    const flecha = this.mode === 'survival' ? flechaQueToca(this.inventory) : ARROW;
    const A = new Arrow(this, e.x + d.x * 0.5, e.y + d.y * 0.5 - 0.1, e.z + d.z * 0.5, d.x * sp, d.y * sp, d.z * sp, (2 + 7 * c) * factorMejora(held), FLECHAS[flecha] || null);
    A.item = flecha || ARROW;
    (this.arrows ||= []).push(A);
    this.audio.play('arco', { vol: 0.6, vary: 0.08 });
    this.swing = 1;
    if (this.mode === 'survival') {
      if (flecha) this.inventory.remove(flecha, 1);
      if (this.inventory.wearHeld()) { this.audio.play('toolbreak'); this.ui.toast('¡Se rompió el arco!'); }
    }
    this.useCd = 0.3;
  }

  // ---------- experiencia ----------
  get xpInfo() { return levelOf(this.meta.xp || 0); }
  damageBonus() { return (1 + Math.min(0.5, this.xpInfo.level * 0.05)) * mult.dano(this) * (this.conjunto === 'diamond' ? 1.1 : 1); } // el conjunto de diamante (conjuntos.js)

  addXP(n) {
    if (!n || this.mode !== 'survival') return;
    if (this.lunaRoja) n *= 2;
    if (this.player.effects.descansado) n *= 1.25; // descansado se aprende más (fuerza.js)
    const before = this.xpInfo.level;
    this.meta.xp = (this.meta.xp || 0) + n;
    const after = this.xpInfo.level;
    if (after > before) {
      this.audio.play('nivel', { ui: true, vol: 0.6 });
      this.ui.toast(`¡Nivel ${after}! +2 corazones${after <= 10 ? ` · +${after * 5}% de daño` : ''}${NIVELES.some((q) => q > before && q <= after) ? ' · 🌟 Maña nueva' : ''}`, 2400);
      // antes llenaba vida y comida: con tanto nivel en una pelea, uno no se moría nunca. Ahora solo da un respiro
      this.player.health = Math.min(this.player.maxHealth, this.player.health + 4);
      const p = this.player.body.pos;
      this.particles.burst(p.x, p.y + 1, p.z, [[0.6, 1, 0.25], [1, 1, 0.5]], 30, 3);
      if (after >= 5) this.achieve('nivel5', 'Aventura de nivel 5');
      if (after >= 15) this.achieve('nivel15', 'Leyenda viviente');
    }
  }

  // lo que no se puede volver a conseguir no se queda tirado al salir o al cruzar un portal
  recogerUnicos() {
    if (this.mode !== 'survival') return;
    for (const it of this.entities.items) {
      if (it.dead || !esUnico(it.id)) continue;
      const left = this.inventory.add(it.id, it.count, it.dur, it.extra);
      // lo que no cupo se devuelve al volver
      if (left > 0) (this.meta.unicosPendientes ||= []).push({ id: it.id, count: left, dur: it.dur, extra: it.extra });
      it.dead = true;
    }
  }
  devolverUnicos() {
    const L = this.meta && this.meta.unicosPendientes;
    if (!L || !L.length || !this.player.alive || this.mode !== 'survival') return;
    this.meta.unicosPendientes = null;
    for (const u of L) { const left = this.inventory.add(u.id, u.count, u.dur, u.extra); if (left > 0) { const p = this.player.body.pos; this.entities.dropItem(u.id, left, p.x, p.y + 1, p.z, null, 0.35, u.dur, u.extra); } }
    this.ui.toast('🎒 Lo que había quedado en el suelo volvió con usted', 3000);
  }

  // v12.14.1: la recompensa de un jefe o leyenda llega a TODAS las personas que le pegaron (cada una con su propio sorteo del botín y las mismas monedas)
  repartirJefe(m, u) {
    if (!(m.kind.boss || m.kind.legend) || !this.red || !this.red.botin || !m.partRed || this.mode !== 'survival') return;
    const pids = [...m.partRed];
    for (const pid of pids) {
      const l = m.sortearBotin();
      for (let r = u; r > 0; r -= 999) l.push([360, Math.min(999, r)]);
      if (l.length) this.red.botin(pid, l);
    }
    if (pids.length) this.red.aviso(`🏆 ¡${m.kind.name} cayó! Recompensa para quienes ayudaron`);
  }

  killedMob(m) {
    if (m.kind.alMorir) m.kind.alMorir(m, this);
    // paga por peligro (precios.js): los jefes, directo; los demás, en monedas junto al cuerpo
    let uJefe = 0;
    if (this.mode === 'survival' && !m.pagado) {
      m.pagado = true;
      darManaJefe(this, m); // v12.16.5: la maña propia del jefe, la primera vez
      const { u, completo } = premioBaja(m, this);
      uJefe = u || 0;
      if (u > 0) {
        if (esJefe(m.type)) { this.giveItem(360, u); this.ui.toast(completo ? `💰 Recompensa por ${m.kind.name}: ₡${u}` : `💰 Por ${m.kind.name} ya le habían pagado: esta vez, ₡${u} de propina`, 3000, 'importante'); this.audio.play('monedas', { ui: true, vol: 0.8 }); }
        else this.entities.dropItem(360, u, m.body.pos.x, m.body.pos.y + 0.6, m.body.pos.z);
      }
    }
    this.repartirJefe(m, uJefe);
    recompensaBaja(this, m);
    anotarBaja(this, m);
    vencerNemesis(this, m);
    vencerOlvido(this, m);
    sobreDeBaja(this, m);
    soltarBotin(this, m);
    if (m.kind.hostile || m.kind.boss) influencerEvento(this, m.kind.boss ? `¡venció a ${m.kind.name}!` : `pelea con ${m.kind.name}`, m.kind.boss ? 45000 : 9000);
    if (m.kind.health >= 8) carrona(this, m.body.pos);
    this.addXP((m.kind.xp ?? (m.kind.hostile ? 5 : 1)) * (1 + (m.data.estrellas || 0) + (m.data.revancha ? 1 : 0)));
    if (m.data.estrellas === 1) this.achieve('estrellas1', 'Una con estrella');
    if (m.data.estrellas === 2) this.achieve('estrellas2', 'Dos estrellas al suelo');
    if (m.kind.hostile || m.kind.legend) {
      gainSkill(this, 'combate', Math.max(2, Math.round((m.kind.health || 10) / 4)) * (m.kind.boss || m.kind.legend ? 3 : 1));
      if (skillLv(this, 'combate') >= 5 && this.player.alive) this.player.health = Math.min(this.player.maxHealth, this.player.health + 1);
      if (mana(this, 'sangre_caliente') && this.player.alive) this.player.health = Math.min(this.player.maxHealth, this.player.health + 2);
    }
    // cazar demasiados animales del monte despierta al Viejo del Monte
    if (!m.kind.hostile && !m.kind.legend && !m.tamed && ['danta', 'venado', 'armadillo', 'tepezcuintle', 'pizote', 'mono', 'cara_blanca', 'titi', 'lapa', 'tucan', 'quetzal', 'perezoso', 'iguana', 'jaguar'].includes(m.type)) {
      const now = this.clock || 0;
      this.meta.caza = (this.meta.caza || []).filter((t) => now - t < 600);
      this.meta.caza.push(now);
      if (this.meta.caza.length === 5) this.ui.toast('🌳 Se oye un crujido entre los árboles… el monte está bravo', 2400);
      if (this.meta.caza.length >= 8 && difOf(this).hostiles && this.dim === 'tierra' && !this.entities.mobs.some((o) => o.type === 'viejo_monte' && !o.dead)) {
        this.meta.caza = [];
        const p = this.player.body.pos, a = Math.random() * Math.PI * 2;
        const x = p.x + Math.cos(a) * 12, z = p.z + Math.sin(a) * 12;
        const h = this.world.gen.column(Math.floor(x), Math.floor(z)).h;
        this.entities.spawnMob('viejo_monte', x, h + 1.2, z);
      }
    }
    if (m.kind.legend || m.kind.boss) {
      const names = { viejo_monte: 'Hice las paces con el Viejo del Monte', mona: 'Le gané a la Mona', duende: 'Atrapé al Duende', arpia: 'Vencí a la Arpía de la Tormenta', tulevieja: 'Le quité el sombrero a la Tulevieja', senor_arenal: 'Vencí al Señor del Arenal', cadejos: 'Venciste al Cadejos', segua: 'Venciste a la Segua', llorona: 'Descansá en paz, Llorona', mono_congo_gigante: 'Vencí al Mono congo gigante', sombra_capitana: 'Vencí a la Sombra capitana' };
      if (names[m.type]) this.achieve(`vencer_${m.type}`, names[m.type]);
      if (m.type === 'rey_murcielago') { (this.meta.reyVencido = this.meta.reyVencido || {})[m.data.zona] = true; this.achieve('vencer_rey_murcielago', 'Vencí al Murciélago Rey'); this.addXP(60); this.ui.toast('🦇 ¡El Murciélago Rey cayó! La caverna quedó en paz', 3200); }
      if (NOMBRES_MINI[m.type]) { this.achieve(`vencer_${m.type}`, NOMBRES_MINI[m.type]); this.addXP(40); this.ui.toast(`🏆 ¡${m.kind.name} cayó! Su trofeo sirve para el machete de doble filo`, 3200); }
      if (m.type === 'guardian_colada') (this.meta.coladaVencida = this.meta.coladaVencida || {})[m.data.zona] = true;
      if (Object.keys(NOMBRES_MINI).filter((k) => k !== 'guardian_colada').every((k) => this.achievements.has(`vencer_${k}`))) this.achieve('mini_jefes', 'Mandamás del monte');
    }
  }

  updateBossBar() {
    const p = this.player.body.pos;
    let best = null, bd = 40;
    for (const m of this.entities.mobs) {
      if (!m.kind.boss || m.dead || !(m.data.angry || m.data.transformed || m.data.provoked || m.type === 'llorona')) continue; // provoked: los jefes del monte y el Rey (no usan angry)
      const d = Math.hypot(m.body.pos.x - p.x, m.body.pos.z - p.z);
      if (d < bd) { bd = d; best = m; }
    }
    this.ui.bossBar(best ? best.kind.name + (best.data.revancha ? ' (revancha)' : '') : null, best ? best.health / Math.max(best.kind.health, best.data.vmax || 0) : 0, best ? best.type : null);
    this.ui.renderXP(this.xpInfo, this.mode === 'survival');
  }

  // ---------- pesca ----------
  useRod() {
    if (recogerPezVela(this)) return; // peleando con un pez vela: cada clic recoge cuerda
    const f = this.fishing;
    const { e, d } = this.eyeAndDir();
    this.swing = 1; this.useCd = 0.4;
    if (!f) {
      this.fishing = new Bobber(this, e.x + d.x * 0.6, e.y + d.y * 0.6, e.z + d.z * 0.6, d.x * 13, d.y * 13 + 4, d.z * 13);
      this.audio.play('lanzar', { vol: 0.6 });
      return;
    }
    // recoger: si picó, sale el pescado volando hacia el jugador
    if (f.state === 'bite') {
      if (quizaPezVela(this, f)) return;
      const loot = f.zona ? pescar(this, f) : fishLoot(f.salt); // v12.7.0 (C5-A1): por zona, carnada y caña (pesca.js)
      const p = this.player.body.pos;
      const dx = p.x - f.pos.x, dz = p.z - f.pos.z, dy = p.y + 1 - f.pos.y;
      this.entities.dropItem(loot.id, loot.n, f.pos.x, f.pos.y + 0.3, f.pos.z, { x: dx * 1.4, y: 4 + Math.max(0, dy) * 1.1, z: dz * 1.4 }, 0.1);
      this.audio.play('carrete', { vol: 0.6 });
      this.audio.play('pez', { pos: f.pos, vol: 0.7 });
      this.particles.burst(f.pos.x, f.pos.y + 0.2, f.pos.z, [[0.8, 0.9, 1], [1, 1, 1]], 16, 3);
      if (loot.msg && !this.torneo) this.ui.toast(loot.msg, 1600);
      pescaEnTorneo(this, loot.id);
      influencerEvento(this, loot.id === 364 ? '¡un dorado!' : 'pesca', loot.id === 364 ? 16000 : 5000);
      this.achieve('pesca', '¡Picó!');
      this.addXP(3);
      gainSkill(this, 'pesca', 4);
      if (mult.doble(this, 'pesca')) this.entities.dropItem(loot.id, loot.n, f.pos.x, f.pos.y + 0.3, f.pos.z, { x: dx * 1.4, y: 4.4 + Math.max(0, dy) * 1.1, z: dz * 1.4 }, 0.1);
      if (skillLv(this, 'pesca') >= 10 && Math.random() < 0.06) { this.entities.dropItem(Math.random() < 0.7 ? 259 : 260, 1, f.pos.x, f.pos.y + 0.3, f.pos.z, { x: dx * 1.3, y: 4.6 + Math.max(0, dy) * 1.1, z: dz * 1.3 }, 0.1); this.ui.toast('🎣 ¡Algo brilla en el anzuelo!', 1600); }
      if (loot.id === 364) this.achieve('dorado', 'Dorados al anzuelo');
      if (this.mode === 'survival' && this.inventory.wearHeld()) this.audio.play('toolbreak');
    } else this.audio.play('carrete', { vol: 0.35 });
    f.remove();
    this.fishing = null;
  }

  updateFishing(dt) {
    if (cuadroPezVela(this, dt)) return;
    const f = this.fishing;
    if (!f) return;
    const held = this.inventory.held;
    const p = this.player.body.pos;
    if (!held || !esCana(held.id) || !this.player.alive || Math.hypot(f.pos.x - p.x, f.pos.z - p.z) > 32 || f.state === 'ground' || f.pos.y < -5) { f.remove(); this.fishing = null; return; }
    // punta de la caña: adelante y a la derecha de los ojos
    const e = this.player.eye, d = this.player.lookDir();
    const rx = Math.cos(this.player.yaw), rz = -Math.sin(this.player.yaw);
    f.update(dt, { x: e.x + d.x * 1.1 + rx * 0.35, y: e.y + d.y * 1.1 + 0.25, z: e.z + d.z * 1.1 + rz * 0.35 });
  }

  // ---------- montar a caballo ----------
  mount(m) {
    this.riding = m;
    m.data.ridden = true;
    this.player.flying = false;
    this.audio.play('montura', { pos: m.soundPos(), vol: 0.7 });
    this.ui.toast('Shift para bajarte del caballo', 1600);
  }

  dismount() {
    const m = this.riding;
    if (!m) return;
    for (const em of ['moto', 'lancha', 'avioneta']) this.audio.setEmitter(em, 'loop.motor', null);
    m.data.ridden = false;
    m.frozen = false;
    this.riding = null;
    const p = this.player.body.pos;
    p.x = m.body.pos.x + Math.cos(m.yaw) * 1.2; p.z = m.body.pos.z - Math.sin(m.yaw) * 1.2; p.y = m.body.pos.y + 0.5;
    this.player.body.vel.x = this.player.body.vel.y = this.player.body.vel.z = 0;
    this.player.body.fallStart = null;
  }

  rideUpdate(dt, input) {
    const m = this.riding, p = this.player;
    if (!m || m.dead || m.dying) { this.riding = null; return; }
    if (m.kind.boat) { boatRide(this, m, dt, input); return; }
    if (m.kind.vehicle) { (m.kind.ride || ((gg, mm, d2, inp) => carRide(gg, mm, d2, inp)))(this, m, dt, input); return; }
    if (m.kind.bus) { busRide(this, m, dt, input); return; }
    if (input.sneak) { this.dismount(); return; }
    const b = m.body;
    // el caballo gira hacia donde mirás
    let dy = (p.yaw + Math.PI) - m.yaw;
    while (dy > Math.PI) dy -= Math.PI * 2;
    while (dy < -Math.PI) dy += Math.PI * 2;
    m.yaw += dy * Math.min(1, dt * 6);
    m.targetYaw = m.yaw;
    let f = 0, s = 0;
    if (input.forward) f += 1;
    if (input.back) f -= 0.5;
    if (input.left) s -= 0.6;
    if (input.right) s += 0.6;
    const speed = (input.sprint ? 11 : 7) * velocidadCaballo(this); // v12.15.1: la herradura en la mochila
    const fx = Math.sin(m.yaw), fz = Math.cos(m.yaw);
    const rx = -fz, rz = fx;
    const tx = (fx * f + rx * s) * speed, tz = (fz * f + rz * s) * speed;
    const k = 1 - Math.exp(-(b.onGround ? 6 : 1.5) * dt);
    b.vel.x += (tx - b.vel.x) * k; b.vel.z += (tz - b.vel.z) * k;
    if (input.jump && b.onGround) b.vel.y = 9.2;
    const bx = b.pos.x, bz = b.pos.z;
    b.step(this.world, dt);
    if (b.hitWall && b.onGround && f > 0) b.vel.y = 8.2; // salta escalones solo
    const moved = Math.hypot(b.pos.x - bx, b.pos.z - bz);
    m.walk += moved * 2.4;
    m.walkAmt += (Math.min(1, moved / dt / 5) - m.walkAmt) * Math.min(1, dt * 8);
    // galope
    this.gallopT = (this.gallopT || 0) - moved;
    if (this.gallopT <= 0 && moved > 0) { this.gallopT = 1.4; this.audio.play('galope', { pos: b.pos, vol: 0.5 }); }
    if (Math.random() < dt * 0.05) this.audio.play('resoplido', { pos: b.pos, vol: 0.5 });
    // el jugador va sentado en la albarda
    p.body.pos.x = b.pos.x; p.body.pos.z = b.pos.z; p.body.pos.y = b.pos.y + 0.95;
    p.body.vel.x = p.body.vel.y = p.body.vel.z = 0;
    p.body.onGround = true; p.body.fallStart = null;
    p.eyeHeight = 1.45;
  }

  // Cama: de noche (o en tormenta) dormís hasta la mañana; siempre guarda el punto de reaparición
  trySleep(x, y, z) {
    if (this.dim === 'inframundo') { this.ui.toast('Aquí abajo nadie puede dormir…', 1800); return; }
    if (this.nocheLarga || this.asedio || this.apuro || this.ceniza || this.grieta || this.ventanilla) { this.ui.toast('Esta noche nadie duerme: todavía vienen más', 2000); return; }
    if (this.player.effects.torsalo && !this.meta.torsaloSale && this.mode === 'survival') { this.ui.toast('🪱 Con el tórsalo moviéndose no hay quien duerma. Tápelo con chicharrón o use el botiquín', 2600); return; }
    this.meta.spawn = { x: x + 0.5, y: y + 1, z: z + 0.5 };
    const storm = this.weather && this.weather.type === 'storm';
    const near = this.entities.mobs.some((m) => m.kind.hostile && !m.kind.pasivo && Math.hypot(m.body.pos.x - x, m.body.pos.y - y, m.body.pos.z - z) < 10);
    if (near && this.mode === 'survival') { this.ui.toast('No se puede acostar: hay Sombras cerca', 1800); return; }
    if (this.lying) return;
    this.lieDown(x, y, z, this.daylight > 0.4 && !storm);
  }

  // Acostarse: la cámara baja a la almohada mirando hacia los pies. De noche se duerme hasta la mañana;
  // de día, si uno se queda quieto un rato, se hace una siesta. Cualquier tecla de movimiento lo levanta.
  lieDown(x, y, z, day) {
    const be = this.world.getBE(x, y, z);
    const th = [0, Math.PI / 2, Math.PI, -Math.PI / 2][(be && be.facing) || 0];
    const hx = -Math.sin(th), hz = -Math.cos(th); // hacia la cabecera
    const pos = new THREE.Vector3(x + 0.5 + hx * 0.28, y + 0.78, z + 0.5 + hz * 0.28);
    const look = new THREE.Vector3(x + 0.5 - hx * 1.4, y + 1.35, z + 0.5 - hz * 1.4);
    const quat = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().lookAt(pos, look, new THREE.Vector3(0, 1, 0)));
    this.cine = { pos, quat, t: this.cine ? this.cine.t : 0, dir: 1 };
    this.lying = { x, y, z, t: 0, day, done: false };
    this.releaseAll();
    this.audio.play('dig.cloth', { pos: { x: x + 0.5, y: y + 0.5, z: z + 0.5 }, vol: 0.5, pitch: 0.8 });
    this.ui.toast(day ? '🛏 Ya está en la cama. Sin moverse, hace una siesta (al moverse se levanta)' : '🛏 Buenas noches…', 2600);
    this.achieve('cama', 'A la camita');
  }

  getUp() {
    if (!this.lying) return;
    this.lying = null;
    if (this.red && this.red.rol === 'invitado') this.red.cama(false); // v12.15.0: ya no cuenta como persona en cama
    if (this.cine) this.cine.dir = -1;
    this.audio.play('dig.cloth', { vol: 0.35, pitch: 1 });
  }

  tickLying(dt) {
    const L = this.lying;
    L.t += dt;
    const k = this.keys;
    if (!this.sleeping && ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space', 'ShiftLeft', 'ShiftRight'].some((c) => k.has(c))) { this.getUp(); return; }
    this.player.body.vel.x = 0; this.player.body.vel.z = 0;
    if (L.espera && !this.sleeping) { // v12.15.0 (anfitrión con sala): la noche pasa cuando todas las personas presentes están en cama
      const v = this.red.votoDormir();
      if (v.listo) { L.espera = false; this.red.amanece(); this.sleepNight(); }
      else if (v.falta !== L.faltaAnt) { L.faltaAnt = v.falta; this.red.anunciaSueno(v); }
      return;
    }
    if (L.done || L.t < (L.day ? 4 : 1.3)) return;
    L.done = true;
    if (L.day) this.siesta();
    else if (this.red && this.red.rol === 'invitado') { this.red.cama(true); this.ui.toast('🛏 Esperando a que todas las personas estén en cama…', 2600); } // el anfitrión decide cuándo amanece
    else if (this.red && this.red.rol === 'anfitrion') { L.espera = true; L.faltaAnt = -1; }
    else this.sleepNight();
  }

  siesta() {
    this.sleeping = true;
    this.ui.sleepFade(() => {
      const t0 = this.time || 0, mediodia = t0 > 0.12 && t0 < 0.42; // v12.4.4: la hora de ANTES de dormir
      this.time = Math.max(t0, Math.min(0.48, t0 + 0.12)); // nunca para atrás (a las 0.55 quedaba en 0.48)
      if (this.meta.siestaCura !== this.day) { this.meta.siestaCura = this.day; this.player.health = Math.min(this.player.maxHealth, this.player.health + 6); } // la cura grande, una vez por día
      siestita(this);
      darDescanso(this, 'siesta');
      if (mediodia && this.meta.siestaDia !== this.day) { this.meta.siestaDia = this.day; delete this.player.effects.cansado; } // v12.4.0: la siesta de mediodía
    }, () => { this.sleeping = false; this.getUp(); this.ui.toast('😴 ¡Qué rica siesta! Ya se siente mejor', 2400); this.achieve('siesta', 'Siesta tica'); });
  }

  sleepNight() {
    this.sleeping = true;
    this.sobresalto = false;
    this.releaseAll();
    this.ui.sleepFade(() => {
      if (this.sobresalto) return; // v12.2.0: lo despertó un golpe: no pasó la noche ni descansó
      if (this.time > 0.5) this.day++;
      this.time = 0.02;
      delete this.player.effects.fiebre;
      durmio(this);
      darDescanso(this, 'cama');
      if (this.weather && this.weather.type !== 'clear' && Math.random() < 0.6) { this.weather.set('clear'); this.weather.intensity = 0; }
      this.player.health = casa.durmioAqui(this) || mana(this, 'sueno_pesado') ? this.player.maxHealth : Math.min(this.player.maxHealth, this.player.health + 4);
      if (casa.curaTodo(this) || mana(this, 'sueno_pesado')) { this.player.necrosis = 0; this.meta.necrosis = 0; }
      if (casa.curaTodo(this) || mana(this, 'sueno_pesado')) for (const k of ['sangrando', 'veneno', 'panza', 'mareo', 'escalofrio', 'fiebre', 'quebrado', 'paralisis', 'garrapatas']) delete this.player.effects[k];
      // las sombras se desvanecen con la mañana
      this.entities.mobs.forEach((m) => { if (m.kind.hostile) m.dead = true; });
    }, () => { if (this.sobresalto) { this.sobresalto = false; return; } const cama = this.lying && { ...this.lying }; this.sleeping = false; this.getUp(); this.ui.toast(`Día ${this.day} · ¡Buenos días!`, 2000); setTimeout(() => manoPeluda(this, cama), 2200); }, soñar(this));
  }

  // Efecto de "pop" al colocar: el bloque rebota un instante antes de quedar quieto.
  addPlaceFx(id, x, y, z) {
    const m = makeItemMesh(id, 1);
    m.position.set(x + 0.5, y + 0.5, z + 0.5);
    m.material.polygonOffset = true; m.material.polygonOffsetFactor = -1; m.material.polygonOffsetUnits = -1;
    m.userData.t = 0;
    this.scene.add(m);
    this.placeFx.push(m);
  }

  updatePlaceFx(dt) {
    this.placeFx = this.placeFx.filter((m) => {
      m.userData.t += dt / 0.16;
      const t = Math.min(1, m.userData.t);
      m.scale.setScalar(1 + Math.sin(t * Math.PI) * 0.09);
      m.material.color.setScalar(this.entities.lightAt(m.position.x, m.position.y, m.position.z));
      if (t >= 1) { this.scene.remove(m); m.geometry.dispose(); m.material.dispose(); return false; }
      return true;
    });
  }

  // ---------- cámara cinematográfica en las estaciones ----------
  enterStation(type, x, y, z) {
    const be = this.world.getBE(x, y, z);
    const c = new THREE.Vector3(x + 0.5, y + 0.5, z + 0.5);
    const eye = this.player.eye;
    const ex = eye.x - c.x, ez = eye.z - c.z, el = Math.hypot(ex, ez) || 1;
    // las direcciones posibles para la toma: la de siempre primero; si una pared o un techo tapa la vista, se prueba otra
    const dirs = [];
    if (type !== 'crafting') dirs.push(FACING_VEC[(be && be.facing) || 0]);
    dirs.push([ex / el, ez / el], [1, 0], [-1, 0], [0, 1], [0, -1]);
    const toma = (fx, fz) => {
      let pos, look;
      if (type === 'crafting') {
        pos = new THREE.Vector3(c.x + fx * 0.95, y + 1.95, c.z + fz * 0.95);
        look = new THREE.Vector3(c.x - fx * 0.05, y + 1.0, c.z - fz * 0.05);
      } else {
        const side = type === 'chest' ? 0.3 : 0;
        pos = new THREE.Vector3(c.x + fx * 1.55 - fz * side, y + (type === 'chest' ? 1.55 : 1.05), c.z + fz * 1.55 + fx * side);
        look = new THREE.Vector3(c.x, y + (type === 'chest' ? 0.55 : 0.45), c.z);
      }
      // mover la toma a la izquierda para dejar espacio al panel de la derecha
      const m = new THREE.Matrix4().lookAt(pos, look, new THREE.Vector3(0, 1, 0));
      const right = new THREE.Vector3().setFromMatrixColumn(m, 0);
      pos.addScaledVector(right, 0.42); look.addScaledVector(right, 0.42);
      return { pos, look };
    };
    const tapa = (px, py, pz) => { const id = this.world.getBlock(Math.floor(px), Math.floor(py), Math.floor(pz)); return SOLID[id] && !(Math.floor(px) === x && Math.floor(py) === y && Math.floor(pz) === z); };
    const libre = ({ pos }) => {
      // la cámara no puede quedar dentro de un bloque ni tener uno entre ella y la estación
      for (const [ox, oy, oz] of [[0, 0, 0], [0.2, 0, 0], [-0.2, 0, 0], [0, 0.2, 0], [0, -0.2, 0], [0, 0, 0.2], [0, 0, -0.2]]) if (tapa(pos.x + ox, pos.y + oy, pos.z + oz)) return false;
      for (let t = 0.25; t < 1; t += 0.08) if (tapa(c.x + (pos.x - c.x) * t, c.y + 0.3 + (pos.y - c.y - 0.3) * t, c.z + (pos.z - c.z) * t)) return false;
      return true;
    };
    let T = null;
    for (const [fx, fz] of dirs) { const q = toma(fx, fz); if (libre(q)) { T = q; break; } }
    this.stations.open = { type, x, y, z };
    this.swing = 1;
    // si no hay por dónde, la vista se queda donde está (mejor eso que una pared en la cara)
    if (!T) { if (this.cine) this.cine.dir = -1; return; }
    const quat = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().lookAt(T.pos, T.look, new THREE.Vector3(0, 1, 0)));
    this.cine = { pos: T.pos, quat, t: this.cine ? this.cine.t : 0, dir: 1 };
  }

  exitStation() {
    const st = this.ui && this.ui.station;
    if (st && st.type === 'chest' && !st.entity && st.y >= 0 && this.red) { // v12.15.0: se suelta el candado; el invitado manda cómo quedó y su copia se tira
      if (this.red.rol === 'anfitrion') this.red.cofreHostCierra(st.x, st.y, st.z);
      else if (this.red.cerrarCofre) { this.red.cerrarCofre(st.x, st.y, st.z, st.be && st.be.slots ? st.be.slots : null); this.world.setBE(st.x, st.y, st.z, null); }
    }
    if (this.cine) this.cine.dir = -1;
    this.stations.open = null;
  }

  // clic central sobre un bloque: en creativo lo copia a la mano; en supervivencia, si lo anda encima, se lo pone en la mano
  // (de la barra lo selecciona; de la mochila lo trae a la casilla de la mano, cambiándolo por lo que hubiera ahí)
  pickBlock() {
    if (!this.target) return;
    const b = BLOCKS[this.target.id], id = b.door ? 266 : b.key === 'furnace_lit' ? K.furnace : b.drop > 0 && !b.crop ? b.drop : this.target.id; // el objeto de ese bloque (puerta, antorcha de pared, horno prendido…)
    const fijas = new Set(this.meta.fijas || []);
    const inv = this.inventory;
    for (let i = 0; i < 9; i++) if (inv.slots[i] && inv.slots[i].id === id) { this.selectSlot(i); return; }
    if (this.mode === 'creative') { inv.slots[inv.selected] = { id, count: 64 }; inv.changed(); return; }
    if (this.mode !== 'survival') return;
    let j = -1;
    for (let i = 9; i < inv.slots.length; i++) if (inv.slots[i] && inv.slots[i].id === id && !fijas.has(i)) { j = i; break; }
    if (j < 0) { this.ui.toast(`No anda ${itemName(id).toLowerCase()} encima`, 1200); return; }
    let k = inv.selected;
    if (inv.slots[k] || fijas.has(k)) { const vacia = inv.slots.slice(0, 9).findIndex((x, i) => !x && !fijas.has(i)); if (vacia >= 0) k = vacia; } // mejor una casilla vacía de la barra que mover lo que tiene en la mano
    if (fijas.has(k)) { this.ui.toast('La casilla de la mano está fija (Alt+clic en el inventario)', 1600, 'registro'); return; }
    [inv.slots[k], inv.slots[j]] = [inv.slots[j], inv.slots[k]];
    if (k !== inv.selected) this.selectSlot(k);
    inv.changed();
    this.audio.play('select', { ui: true, vol: 0.3 });
  }

  // ---------- daño / muerte ----------
  // armored: la armadura reduce el daño de criaturas, explosiones, lava y cactus (no caídas, hambre ni ahogo)
  // v12.10.0 (F0): jugador más cercano a un punto entre el local y los remotos (g.remotos). Sin remotos: siempre el local
  jugadorMasCercano(x, z) {
    let mejor = this.player, d = this.player.alive ? Math.hypot(this.player.body.pos.x - x, this.player.body.pos.z - z) : Infinity;
    for (const pl of this.otrosJugadores()) {
      if (!pl.alive) continue;
      const dr = Math.hypot(pl.body.pos.x - x, pl.body.pos.z - z);
      if (dr < d) { d = dr; mejor = pl; }
    }
    return mejor;
  }
  // v12.14.0 (F4): los jugadores de otras personas (los «jugador» de g.remotos); sin sala: lista vacía
  otrosJugadores() { return this.remotos && this.remotos.jugadores ? this.remotos.jugadores() : []; }
  // un punto donde puede nacer algo: el de cualquiera de las personas vivas, al azar (así hay criaturas también donde está la otra persona)
  puntoDeSpawn() {
    const l = [this.player, ...this.otrosJugadores()].filter((p) => p.alive);
    return (l.length ? l[Math.floor(Math.random() * l.length)] : this.player).body.pos;
  }

  // objetivo (v12.10.0, F0): a quién va el daño. Sin él (o el jugador local) es como siempre; si es un jugador remoto, lo calcula y
  // lo aplica la ficha de esa persona (alDanarRemoto, que enchufa la F4); sin ese enchufe no pasa nada. Nada de red todavía
  damagePlayer(amount, fromX, fromZ, cause, ignoreCd = false, armored = false, objetivo = null) {
    if (this.jugadorReal) { if (!objetivo) objetivo = this.player; if (objetivo === this.jugadorReal) return; } // v12.14.1: un jefe que pensaba con otra persona
    if (objetivo && objetivo !== this.player) { if (this.alDanarRemoto) this.alDanarRemoto(objetivo, amount, fromX, fromZ, cause, ignoreCd, armored); return; }
    if (this.mode !== 'survival' || !this.player.alive) return;
    if (!ignoreCd && this.player.hurtCd > 0) return;
    amount = onPlayerHit(this, amount, fromX, fromZ);
    if (amount <= 0) return;
    if (this.lying) despertarSusto(this); // v12.2.0: si le pegan acostado, se levanta de un brinco
    this.danoT = this.clock || 0; // el locutor calla lo que no es urgente mientras uno pelea
    // la dificultad pesa sobre lo que le pegan las criaturas
    if (fromX !== null && fromX !== undefined) amount *= difOf(this).dmg * mult.recibido(this);
    if (manaJefe(this, 'piel_ceniza') && /lava|fuego|llama|ceniza|quem|arenal/i.test(cause || '')) amount *= 0.7; // v12.16.5: «Piel de ceniza»
    this.player.hurtCd = 0.5;
    // v12.4.9 (fase 1 de los jefes): la presión del jefe con el que se pelea, sobre sus propios golpes
    // v12.4.9: la presión del jefe sobre sus propios golpes; v12.4.13: el jefe sale del origen del golpe (o del nombre, con alias)
    const jefe = jefeDelGolpe(this, cause);
    if (jefe) amount *= jefe.dano;
    // v12.8.8 (fase 2B-bis): lo que tira un jefe sin su presión (los mangos del Mono congo) también cuenta, con `g.diagDe`
    const tipoDiag = jefe ? jefe.m.type : (this.diagDe && JEFES_BALANCE[this.diagDe.type] ? this.diagDe.type : null);
    if (tipoDiag) { const D = ((this.diag ||= {})[tipoDiag] ||= { conAviso: 0, sinAviso: 0 }); D[avisoVivo(this, tipoDiag) ? 'conAviso' : 'sinAviso'] += amount; } // v12.8.1 (fase 2): para el bot
    if (armored) {
      const { points, tough } = this.inventory.armorValue();
      // v12.4.13 (décima revisión): la armadura nueva, min(0.80, puntos·0.03 + dureza·0.02), es solo contra los jefes (con ella se
      // calibraron). Contra todo lo demás vuelve la de siempre, min(0.88, puntos·0.04 + dureza·0.02): con la nueva la Noche Larga
      // pasó de ganarse a perderse (4 de 4 con el bot). armored = 'media' (los rayos del Rey): la mitad de la rebaja
      const rebaja = jefe ? Math.min(0.80, points * 0.03 + tough * 0.02) : Math.min(0.88, points * 0.04 + tough * 0.02);
      amount *= 1 - rebaja * (armored === 'media' ? 0.5 : 1);
      if (this.inventory.wearArmor()) { this.audio.play('toolbreak'); this.ui.toast('¡Se rompió una pieza de armadura!'); }
    }
    // v12.4.13: ningún golpe de jefe quita más del 60 % de la vida de una vez (al que llega con menos equipo del que toca)
    if (jefe) amount = Math.min(amount, this.player.maxHealth * 0.6);
    this.player.health = Math.max(0, Math.round((this.player.health - amount) * 2) / 2);
    if (this.player.health <= 0 && mana(this, 'por_un_pelito') && this.meta.pelitoDia !== this.day) {
      this.meta.pelitoDia = this.day; this.player.health = 2; this.player.hurtCd = 2;
      this.ui.toast('🍀 ¡Por un pelito! Hoy ya no hay otra', 3000);
      this.achieve('por_un_pelito', 'Por un pelito');
    }
    quizaSangra(this, amount, fromX !== null && fromX !== undefined);
    this.audio.play('hurt', { vol: 0.55 });
    this.audio.play('punch', { vol: 0.35 });
    this.ui.hurtFlash();
    if (fromX !== null && fromX !== undefined) this.ui.golpeDesde(fromX - this.player.body.pos.x, fromZ - this.player.body.pos.z, this.player.yaw);
    if (fromX !== null && fromX !== undefined) { const pp = this.player.body.pos, gx = fromX - pp.x, gz = fromZ - pp.z, gl = Math.hypot(gx, gz) || 1; this.hurtTilt = -((gx * Math.cos(this.player.yaw) - gz * Math.sin(this.player.yaw)) / gl) * 0.13; } else this.hurtTilt = (Math.random() < 0.5 ? -1 : 1) * 0.1;
    this.handGolpe = 1;
    this.shake = 0.25;
    if (fromX !== null && fromX !== undefined) {
      const p = this.player.body.pos;
      const dx = p.x - fromX, dz = p.z - fromZ;
      const l = Math.hypot(dx, dz) || 1;
      const emp = this.conjunto === 'iron' ? 0.5 : 1; // el conjunto de hierro: los golpes empujan la mitad
      this.player.body.vel.x += (dx / l) * 6 * emp;
      this.player.body.vel.z += (dz / l) * 6 * emp;
      this.player.body.vel.y = 5.5 * (emp < 1 ? 0.7 : 1);
    }
    if (this.player.health <= 0) {
      this.player.alive = false;
      const avisoNemesis = anotarNemesis(this, fromX, fromZ, cause);
      rachaMurio(this);
      perderFuerza(this); // al morir se pierde la fuerza de lo comido
      terminarPlaneo(this); soltarGancho(this);
      this.eating = null; terminarRapido(this); // que el arma vuelva a la mano antes de que se caiga lo demás
      this.releaseAll();
      this.riding = null; this.zip = null;
      if (this.ui.state === 'inventory') this.ui.closeInventory(); // v11.13.3: lo del cursor y la mesa 2×2 entra en la cuenta
      if (!cobrarSeguro(this)) dropBolso(this);
      anotar(this, `Me morí: ${cause || 'quién sabe cómo'}.`, '💀');
      // la pantalla de muerte sale después de la caída (muerte.js)
      empezarMuerte(this, fromX, fromZ, () => {
        this.ui.showDeath(cause);
        const tip = document.getElementById('death-tip'), consejo = consejoMuerte(cause, this); if (tip) tip.textContent = [tip.textContent, avisoNemesis, consejo].filter(Boolean).join('\n');
      });
    }
  }

  respawn() {
    const s = this.meta.spawn;
    const p = this.player;
    p.body.pos.x = s.x; p.body.pos.y = s.y; p.body.pos.z = s.z;
    p.body.vel.x = p.body.vel.y = p.body.vel.z = 0;
    p.health = p.maxHealth; p.food = this.mode === 'survival' ? difOf(this).respawnFood : 20; p.water = 20; p.air = 10; p.alive = true; p.body.fallStart = null;
    p.hungerT = 0; this.golpePend = null; this.golpeAnim = null; this.cuerpo = undefined; // v12.4.4: sin escalofrío heredado
    this.muerte = null; terminarPlaneo(this);
    this.ready = false;
    quitarMonta(this); limpiarTsunami(this); limpiarVagon(this); limpiarGlobo(this); limpiarPerezosoCalle(this);
    if (this.dim !== 'tierra') this.switchDim('tierra', null);
  }

  // ---------- color de la luz según la hora ----------
  updateLightColor(infra) {
    const ang = this.time * Math.PI * 2, sunH = Math.sin(ang);
    const noon = this.lcNoon || (this.lcNoon = new THREE.Color(1.0, 0.97, 0.9));
    const gold = this.lcGold || (this.lcGold = new THREE.Color(1.08, 0.72, 0.46));
    const moon = this.lcMoon || (this.lcMoon = new THREE.Color(0.62, 0.74, 1.12));
    const gray = this.lcGray || (this.lcGray = new THREE.Color(0.86, 0.9, 0.95));
    const fire = this.lcFire || (this.lcFire = new THREE.Color(1.0, 0.62, 0.45));
    const c = SKY_LIGHT.value;
    if (infra) c.copy(fire);
    else {
      const dayK = Math.max(0, Math.min(1, (sunH + 0.08) / 0.4));
      const golden = sunH > -0.18 ? Math.max(0, 1 - Math.abs(sunH - 0.06) * 3.6) : 0;
      c.copy(moon).lerp(noon, dayK).lerp(gold, golden * 0.75);
      const over = this.weather ? this.weather.intensity : 0;
      if (over > 0) c.lerp(gray, over * 0.6);
    }
    LIGHT_TINT.copy(c);
  }

  // ---------- zonas de las estructuras ----------
  // descubrir lugares al llegar cerca: aviso, rareza y logros
  tickDiscover(dt) {
    this.discT = (this.discT || 0) - dt;
    if (this.discT > 0 || this.dim !== 'tierra' || this.world.gen.version < 5) return;
    this.discT = 1.5;
    const p = this.player.body.pos;
    // región: se anuncia cuando uno lleva un ratito en una nueva (para que no parpadee en los bordes)
    const rg = regionAt(this.world.gen, p.x, p.z);
    if (rg !== this.regionNow) { this.regionNow = rg; this.regionT = 0; }
    else if (rg !== this.regionShown && (this.regionT = (this.regionT || 0) + 1) >= 2) {
      this.regionShown = rg;
      const R = REGIONES[rg];
      if (R && rg !== 'mar') {
        this.ui.regionBanner(R.name, R.lema);
        this.meta.regions = this.meta.regions || {};
        if (!this.meta.regions[rg]) { this.meta.regions[rg] = this.day || 1; if (Object.keys(this.meta.regions).length >= 6) this.achieve('regiones', 'Pueblo por pueblo'); }
      }
    }
    // caer en un hueco de la carretera
    if (this.world.getBlock(Math.floor(p.x), Math.floor(p.y - 0.5), Math.floor(p.z)) === K.fondo_hueco && !this.achievements.has('hueco')) {
      this.ui.toast('🕳 ¡Pum! Cayó en un hueco. Aquí hay más huecos que calle.', 2600);
      this.achieve('hueco', 'Cuidado con el hueco');
    }
    const disc = (this.meta.discovered = this.meta.discovered || {});
    // lo que hay en ~900 bloques, de a un tipo por vez: de ahí salen los rumores de los vecinos
    this.scanI = (this.scanI || 0) + 1;
    const seen = (this.nearSeen = this.nearSeen || new Map());
    for (const s of scanStep(this.world.gen, this.scanI, p.x, p.z, 900)) seen.set(s.id, s);
    for (const s of structuresNear(this.world.gen, p.x, p.z, 60)) {
      if (disc[s.id] || Math.hypot(s.x - p.x, s.z - p.z) > structRadius(this.world.gen, s.type) * 0.8 + 6) continue;
      disc[s.id] = s.type;
      gainSkill(this, 'exploracion', rareXP(STRUCT_RARE[s.type]));
      if (skillLv(this, 'exploracion') >= 5) this.addXP(rareXP(STRUCT_RARE[s.type]));
      const rare = STRUCT_RARE[s.type] || 'común';
      this.ui.toast(`📍 Descubrió: ${STRUCT_NAMES[s.type]} · ${rare}`, 3200);
      postal(this, s.type);
      anotar(this, `Descubrí ${STRUCT_NAMES[s.type]} (${rare}).`, '📍');
      this.audio.play('pop', { ui: true, vol: 0.35, pitch: rare === 'legendaria' ? 0.7 : 1 });
      if (STRUCT_ACH[s.type]) this.achieve(...STRUCT_ACH[s.type]);
      if (s.type === 'isla_coco') mapaDelCoco(this, s);
      const types = new Set(Object.values(disc));
      if (types.size >= 10) this.achieve('patrimonio', 'Patrimonio nacional');
      if ([...types].filter((t) => STRUCT_RARE[t] === 'legendaria').length >= 4) this.achieve('explorador_tico', 'Exploración a lo tico');
      if (['marino_ballena', 'corcovado', 'manuel_antonio', 'tortuguero', 'irazu', 'rincon_vieja', 'barra_honda', 'cumbre', 'cahuita', 'tenorio', 'monteverde', 'palo_verde', 'isla_coco', 'braulio', 'juan_castro', 'carara', 'turrialba', 'amistad_parque', 'rincon_parque'].filter((t) => types.has(t)).length >= 4) this.achieve('parques', 'Guardaparques honorario');
    }
  }

  // un vecino le cuenta de un lugar cercano que usted todavía no conoce
  rumor() {
    const p = this.player.body.pos, disc = this.meta.discovered || {}, told = (this.meta.rumors = this.meta.rumors || {});
    let best = null, bd = 1e9;
    for (const s of (this.nearSeen || new Map()).values()) {
      if (disc[s.id] || told[s.id] || !STRUCT_NAMES[s.type] || RUMOR_SKIP.has(s.type)) continue;
      const d = Math.hypot(s.x - p.x, s.z - p.z);
      if (d > 60 && d < bd) { bd = d; best = s; }
    }
    if (!best) return null;
    told[best.id] = true;
    const dirs = ['norte', 'noreste', 'este', 'sureste', 'sur', 'suroeste', 'oeste', 'noroeste'];
    const dir = dirs[(Math.round(Math.atan2(best.x - p.x, -(best.z - p.z)) / (Math.PI / 4)) + 8) % 8];
    const m = Math.round(bd / 50) * 50, name = STRUCT_NAMES[best.type];
    const lines = [`¿Ya fue a ${name}? Queda como a ${m} metros hacia el ${dir}.`, `Mi compadre dice que hacia el ${dir}, a unos ${m} metros, está ${name}. ¡Vale la pena!`,
      `Si sigue para el ${dir} unos ${m} metros se topa con ${name}. Lleve agua.`, `Dicen que por el ${dir}, a ${m} metros más o menos, está ${name}. Yo fui una vez de güila.`];
    this.achieve('rumor', 'Me contaron un chisme');
    return lines[Math.floor(Math.random() * lines.length)];
  }

  tickZones(dt) {
    this.zoneT = (this.zoneT || 0) - dt;
    if (this.zoneT > 0 || this.dim !== 'tierra') return;
    this.zoneT = 1;
    const p = this.player.body.pos;
    this.zoneState = this.zoneState || {};
    this.envVolcan = 0;
    for (const zn of this.world.zones.values()) {
      const d = Math.hypot(zn.x - p.x, zn.z - p.z);
      if (zn.kind === 'rey_murcielago') { if (d < 40) tickCaverna(this, zn); continue; }
      if (zn.kind === 'colada') { if (d < 40 || this.otrosJugadores().length) tickColada(this, zn); continue; }
      if (zn.kind === 'templo_hundido') { tickTemplo(this, zn, d); continue; }
      if (zn.kind === 'arcoiris') { tickArcoiris(this, zn, d); continue; }
      if (zn.kind === 'erupcion' || zn.kind === 'fumarola' || zn.kind === 'cumbre') {
        if (d < 320) tickVolcanoes(this, zn, d, this.zoneState[zn.id] || (this.zoneState[zn.id] = {}));
        continue;
      }
      if (zn.kind === 'lodo') {
        // pailas de lodo que hierven: burbujas y el borboteo (grabación real)
        const near = d < zn.r + 10;
        this.audio.setEmitter(zn.id, 'loop.hervir', near ? { x: zn.x, y: zn.y, z: zn.z } : null, 0.7);
        if (near) for (let k = 0; k < 6; k++) {
          const bx = Math.floor(zn.x + (Math.random() - 0.5) * 30), bz = Math.floor(zn.z + (Math.random() - 0.5) * 30);
          for (let by = zn.y + 2; by > zn.y - 4; by--) if (this.world.getBlock(bx, by, bz) === K.lodo) { this.particles.burst(bx + 0.5, by + 1.05, bz + 0.5, [[0.45, 0.4, 0.34], [0.6, 0.55, 0.48]], 3, 0.7); break; }
        }
        continue;
      }
      if (zn.kind === 'turno') {
        // fiestas patronales: de noche suben bombetas y suena la fiesta
        const st = this.zoneState[zn.id] || (this.zoneState[zn.id] = {});
        const night = this.daylight < 0.35, near = d < zn.r + 30;
        if (near && !st.told) { st.told = true; this.ui.toast('🎡 ¡Hay turno en el pueblo! Chinamos, rueda de Chicago y bombetas', 2600); this.achieve('turno', 'Fui al turno'); }
        if (!near) st.told = false;
        if (night && near && Math.random() < 0.18) (this.rockets ||= []).push(new Rocket(this, zn.x + (Math.random() - 0.5) * 16, zn.y + 2, zn.z + (Math.random() - 0.5) * 16));
        this.audio.setEmitter(zn.id, 'loop.pueblo', near ? { x: zn.x, y: zn.y + 2, z: zn.z } : null, 0.8);
        continue;
      }
      if (zn.kind === 'redondel') {
        // el improvisado que se tira al ruedo: el toro lo puede levantar
        const st = this.zoneState[zn.id] || (this.zoneState[zn.id] = {});
        const inside = d < zn.r && Math.abs(p.y - zn.y - 1) < 2.5;
        if (inside && !st.inside) { this.ui.toast('🐂 ¡Un improvisado al ruedo! La gradería grita…', 2400); this.achieve('improvisado', 'Improvisado en el redondel'); st.t = 0; }
        st.inside = inside;
        if (inside && this.mode === 'survival') {
          st.t = (st.t || 0) + 1;
          const toro = this.entities.mobs.find((m) => m.type === 'vaca' && !m.dead && Math.hypot(m.body.pos.x - zn.x, m.body.pos.z - zn.z) < zn.r + 2);
          if (toro && Math.random() < 0.3) {
            const pb = this.player.body;
            pb.vel.y = 9; pb.vel.x += (Math.random() - 0.5) * 10; pb.vel.z += (Math.random() - 0.5) * 10;
            this.damagePlayer(2, toro.body.pos.x, toro.body.pos.z, 'El toro lo levantó en el redondel', true, true);
            this.audio.play('vaca', { pos: toro.body.pos, vol: 1, pitch: 0.7 });
            this.ui.toast('🐂 ¡El toro lo levantó! ¡Uyyy!', 1600);
          }
          if (st.t === 20) { this.ui.toast('🏆 ¡Aguantó 20 segundos en el ruedo! La gradería lo aplaude', 2600); this.audio.play('aplausos', { vol: 0.6 }); this.achieve('valiente_redondel', 'Valiente del redondel'); this.addXP(25); }
        }
        continue;
      }
      if (zn.kind === 'cementerio') {
        // de noche se oye llorar a una mujer entre las bóvedas
        const night = this.daylight < 0.3, near = d < zn.r + 6;
        this.audio.setEmitter(zn.id, 'loop.llanto', night && near ? { x: zn.x, y: zn.y + 1, z: zn.z - 8 } : null, 0.5);
        const st = this.zoneState[zn.id] || (this.zoneState[zn.id] = {});
        if (night && near && !st.told) { st.told = true; this.ui.toast('😱 Se oye un llanto entre las bóvedas…', 2600); this.achieve('cementerio', 'De noche en el cementerio'); }
        if (!night) st.told = false;
        continue;
      }
      if (zn.kind === 'sanatorio') {
        const st = this.zoneState[zn.id] || (this.zoneState[zn.id] = {});
        if (d < zn.r && this.daylight < 0.35 && (this.clock || 0) > (st.next || 0)) {
          st.next = (this.clock || 0) + 25 + Math.random() * 30;
          this.audio.play(Math.random() < 0.5 ? 'susurro' : 'creak', { pos: { x: zn.x + (Math.random() - 0.5) * 20, y: zn.y + 4, z: zn.z + (Math.random() - 0.5) * 10 }, vol: 0.8 });
          this.ui.toast(['Se oyen pasos en el corredor…', 'Una puerta se cerró sola allá arriba.', '¿Quién anda ahí?'][Math.floor(Math.random() * 3)], 2200, { cat: 'ambiente', clave: 'sanatorio' });
        }
        continue;
      }
      if (zn.kind === 'estadio') tickPartido(this, zn, d);
      if (zn.kind === 'estadio' || zn.kind === 'tren') {
        const st = this.zoneState[zn.id] || (this.zoneState[zn.id] = {});
        if (d < zn.r + 20 && (this.clock || 0) > (st.next || 0)) {
          st.next = (this.clock || 0) + (zn.kind === 'tren' ? 50 : 35) + Math.random() * 30;
          if (zn.kind === 'tren') this.audio.play('tren', { pos: { x: zn.x, y: zn.y + 3, z: zn.z }, vol: 0.9 });
          else { this.audio.play('gol', { pos: { x: zn.x, y: zn.y + 6, z: zn.z }, vol: 1 }); if (d < zn.r) this.ui.toast(['⚽ ¡Gooool de la Sele!', '⚽ ¡GOOOOL! ¡Pura vida!', '⚽ ¡Qué golazo, mae!'][Math.floor(Math.random() * 3)], 2200, { cat: 'ambiente', clave: 'estadio' }); }
        }
        continue;
      }
      if (zn.kind === 'teatro' || zn.kind === 'retreta') {
        const inside = d < zn.r && Math.abs(p.y - zn.y) < 6;
        const st = this.zoneState[zn.id] || (this.zoneState[zn.id] = { t: 0 });
        if (inside && !st.playing && (this.clock || 0) > (st.next || 0)) {
          // empieza la función: marimba en vivo y al final, aplausos
          st.playing = true;
          const len = this.music ? this.music.concert() : 30;
          if (zn.kind === 'retreta') this.ui.toast('🎼 ¡Retreta en el Templo de la Música!', 2400);
          else { this.ui.toast('🎭 ¡Empieza la función en el Teatro Nacional!', 2400); this.achieve('teatro', 'Una noche en el Teatro Nacional'); }
          st.end = (this.clock || 0) + len;
        }
        if (st.playing && (this.clock || 0) > st.end) {
          st.playing = false; st.next = (this.clock || 0) + 90;
          if (d < zn.r + 6) this.audio.play('aplausos', { pos: { x: zn.x, y: zn.y + 2, z: zn.z }, vol: 1 });
        }
      } else if (zn.kind === 'campana' && d < zn.r) {
        for (const bt of BELL_TIMES) {
          const key = `${zn.id}:${this.day}:${bt}`;
          if (this.time >= bt && this.time < bt + 0.01 && this.zoneState[key] !== 1) {
            this.zoneState[key] = 1;
            for (let k = 0; k < 4; k++) setTimeout(() => this.audio.play('campana', { pos: { x: zn.x, y: zn.y, z: zn.z }, vol: 1, vary: 0.02 }), k * 1500);
          }
        }
      } else if (zn.kind === 'capital' && d < zn.r && !(this.meta.villages && this.meta.villages[zn.id])) {
        this.meta.villages = this.meta.villages || {};
        this.meta.villages[zn.id] = { found: this.day || 1 };
        this.ui.toast('🏙 ¡Llegó a San José, la capital!', 2600);
        this.achieve('capital', 'Llegué a Chepe');
      }
    }
  }

  // ---------- haz de luz del faro (de noche) ----------
  updateBeacons(dt) {
    const p = this.player.body.pos;
    let best = null, bd = 420;
    if (this.dim === 'tierra' && this.daylight < 0.5) for (const k of this.world.beacons) {
      const [x, y, z] = k.split(',').map(Number);
      const d = Math.hypot(x - p.x, z - p.z);
      if (d < bd) { bd = d; best = [x, y, z]; }
    }
    if (!best) { if (this.beam) this.beam.visible = false; return; }
    if (!this.beam) {
      this.beam = new THREE.Group();
      const mat = new THREE.MeshBasicMaterial({ color: 0xfff0b0, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false });
      for (const s of [1, -1]) {
        const geo = new THREE.CylinderGeometry(0.25, 2.4, 80, 16, 1, true);
        geo.translate(0, 40.6, 0);
        geo.rotateZ(-Math.PI / 2 * s);
        this.beam.add(new THREE.Mesh(geo, mat));
      }
      this.scene.add(this.beam);
    }
    this.beam.visible = true;
    this.beam.position.set(best[0] + 0.5, best[1] + 0.5, best[2] + 0.5);
    this.beam.rotation.y += dt * 0.8;
  }

  // ---------- dimensiones ----------
  async switchDim(target, dest) {
    this.dimT = 0;
    if (this.switching) return;
    soltarGancho(this);
    this.switching = true;
    this.lastDim = this.dim;
    if (this.dim === 'tierra') { const q = this.player.body.pos; this.meta.portal = { x: Math.floor(q.x), y: Math.floor(q.y), z: Math.floor(q.z) }; }
    limpiarCrecida(this);
    limpiarAvispas(this);
    limpiarQuema(this);
    limpiarNeblina(this);
    limpiarMarabunta(this);
    limpiarProcesion(this);
    limpiarBailarin(this);
    this.resaca = null;
    limpiarAsalto(this);
    limpiarLahar(this);
    quitarPalo(this);
    quitarToros(this);
    limpiarTsunami(this);
    limpiarPlaga(this);
    limpiarGoleta(this);
    this.locutorT = 0; this.noticiasVistas = null;
    this.recogerUnicos();
    await this.save();
    if (this.riding) this.dismount();
    if (this.fishing) { this.fishing.remove(); this.fishing = null; }
    limpiarPezVela(this);
    for (const a of this.arrows || []) a.remove();
    for (const r of this.rockets || []) r.remove();
    this.arrows = []; this.rockets = [];
    limpiarAsedio(this); limpiarApuro(this); limpiarCeniza(this); limpiarChancleta(this); limpiarDerrumbe(this); this.candela = null; // las peleas de la tierra no siguen en otra dimensión
    limpiarArmas(this); limpiarMangos(this); limpiarArena(this); limpiarJuegos(this); limpiarZopilotes(this); limpiarAire(this); limpiarAros(this); limpiarSurf(this); limpiarMariposas(this);
    const p = this.player.body.pos;
    const to = dest || { x: Math.floor(this.meta.spawn.x), z: Math.floor(this.meta.spawn.z) };
    // las mascotas que andan cerca cruzan el portal con uno; los botes y las lejanas se quedan
    const pets = [...(this.awayPets || [])];
    for (const m of this.entities.mobs) {
      if (!m.tamed || m.dead) continue;
      const near = !m.kind.boat && Math.hypot(m.body.pos.x - p.x, m.body.pos.z - p.z) < 10 && dest;
      pets.push(near ? { type: m.type, x: to.x + 0.5 + Math.random(), y: 100, z: to.z + 2.5, data: m.data, dim: target } : { type: m.type, x: m.body.pos.x, y: m.body.pos.y, z: m.body.pos.z, data: m.data, dim: this.dim });
    }
    this.pendingPets = pets.filter((pt) => pt.dim === target);
    this.awayPets = pets.filter((pt) => pt.dim !== target);
    this.entities.clear();
    this.stations.clear();
    this.world.dispose();
    this.dim = target;
    this.meta.dim = target;
    this.world = new World(this.scene, this.meta.seed, this.dims[target].mods, this.dims[target].be, this.meta.genVersion || 1, target, this.meta.tipoMundo || 'normal');
    this.world.renderDistance = this.settings.renderDistance;
    this.hookWorld();
    if (target === 'tierra') {
      if (!this.far) { this.far = new FarTerrain(this.scene, this.meta.seed, this.meta.genVersion || 1, this.meta.tipoMundo || 'normal'); this.far.setDistance(this.settings.farDistance ?? 768); }
    } else if (this.far) { this.far.dispose(); this.far = null; }
    if (dest) { p.x = to.x + 0.5; p.z = to.z + 0.5; p.y = 110; this.arrival = { x: to.x, z: to.z, kind: target === 'tierra' ? this.lastDim : target }; }
    else { p.x = this.meta.spawn.x; p.y = this.meta.spawn.y; p.z = this.meta.spawn.z; }
    this.player.body.vel.x = this.player.body.vel.y = this.player.body.vel.z = 0;
    this.player.body.fallStart = null;
    this.player.flying = false;
    this.portalCd = 4;
    this.ready = false;
    this.switching = false;
    this.audio.play('portal', { ui: true, vol: 0.8 });
    if (target === 'inframundo') this.achieve('inframundo', 'Bajé al Inframundo Volcánico');
    if (target === 'cielo') this.achieve('cielo', 'Subí a las Tierras del Cielo');
  }

  // al llegar: pararse frente al portal que ya hay, o construir uno nuevo para volver
  finishArrival() {
    const a = this.arrival;
    this.arrival = null;
    const w = this.world, p = this.player.body.pos;
    for (let r = 0; r <= 12; r++) for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dz)) !== r) continue;
      for (let y = 2; y < 126; y++) {
        const pid = w.getBlock(a.x + dx, y, a.z + dz);
        if (pid !== K.portal && pid !== K.portal_cielo) continue;
        if ((pid === K.portal_cielo) !== (a.kind === 'cielo')) continue;
        let fy = y;
        while (w.getBlock(a.x + dx, fy - 1, a.z + dz) === pid) fy--;
        const side = SOLID[w.getBlock(a.x + dx, fy, a.z + dz + 1)] ? -1 : 1;
        p.x = a.x + dx + 0.5; p.y = fy; p.z = a.z + dz + 0.5 + side * 1.2;
        return;
      }
    }
    let y = null;
    if (this.dim === 'cielo') {
      // el portal va sobre la isla más cercana (o en una plataforma de piedra celeste)
      let best = null;
      for (let r = 0; r <= 40 && !best; r += 2) for (let dz = -r; dz <= r && !best; dz += 2) for (let dx = -r; dx <= r && !best; dx += 2) {
        if (Math.max(Math.abs(dx), Math.abs(dz)) !== r) continue;
        const c = w.gen.column(a.x + dx, a.z + dz);
        if (c.island && w.gen.column(a.x + dx + 3, a.z + dz).island) best = { x: a.x + dx, z: a.z + dz, y: c.h + 1 };
      }
      if (best) { a.x = best.x; a.z = best.z; y = best.y; } else y = 70;
      buildPortal(w, a.x, y, a.z, K.calcite, K.portal_cielo);
      p.x = a.x + 2; p.y = y; p.z = a.z + 1.5;
      return;
    }
    if (this.dim === 'inframundo') {
      // buscar cerca un piso firme, fuera de la lava y sin columnas encima
      let best = null;
      for (let r = 0; r <= 24 && !best; r += 2) for (let dz = -r; dz <= r && !best; dz += 2) for (let dx = -r; dx <= r && !best; dx += 2) {
        if (Math.max(Math.abs(dx), Math.abs(dz)) !== r) continue;
        const c = w.gen.column(a.x + dx, a.z + dz);
        if (c.floor <= LAVA_SEA + 1) continue;
        let free = true;
        for (let ex = -1; ex <= 4 && free; ex++) for (let ey = 1; ey <= 5 && free; ey++) if (w.getBlock(a.x + dx + ex, c.floor + ey, a.z + dz) !== AIR) free = false;
        if (free) best = { x: a.x + dx, z: a.z + dz, y: c.floor + 1 };
      }
      if (best) { a.x = best.x; a.z = best.z; y = best.y; } else y = Math.max(LAVA_SEA + 2, w.gen.column(a.x, a.z).floor + 1);
    } else {
      y = 126;
      while (y > 2 && (!SOLID[w.getBlock(a.x, y, a.z)] || BLOCKS[w.getBlock(a.x, y, a.z)].leafy)) y--;
      y = Math.max(y + 1, 64);
    }
    if (a.kind === 'cielo') buildPortal(w, a.x, y, a.z, K.calcite, K.portal_cielo);
    else buildPortal(w, a.x, y, a.z);
    p.x = a.x + 2; p.y = y; p.z = a.z + 1.5;
  }

  travelThroughPortal(kind = this.portalKind || 'inframundo') {
    const p = this.player.body.pos;
    if (this.dim === 'tierra' && kind === 'cielo') this.switchDim('cielo', { x: Math.floor(p.x), z: Math.floor(p.z) });
    else if (this.dim === 'tierra') this.switchDim('inframundo', { x: Math.floor(p.x / 8), z: Math.floor(p.z / 8) });
    else if (this.dim === 'cielo') this.switchDim('tierra', { x: Math.floor(p.x), z: Math.floor(p.z) });
    else this.switchDim('tierra', { x: Math.floor(p.x * 8), z: Math.floor(p.z * 8) });
  }

  explode(x, y, z, r) {
    const w = this.world;
    const r2 = r * r;
    const ri = Math.ceil(r);
    for (let dy = -ri; dy <= ri; dy++) for (let dz = -ri; dz <= ri; dz++) for (let dx = -ri; dx <= ri; dx++) {
      const d2 = dx * dx + dy * dy + dz * dz;
      if (d2 > r2 * (0.75 + Math.random() * 0.4)) continue;
      const bx = Math.floor(x + dx), by = Math.floor(y + dy), bz = Math.floor(z + dz);
      const id = w.getBlock(bx, by, bz);
      if (id === AIR || FLUID[id] || BLOCKS[id].hardness < 0) continue;
      if (BLOCKS[id].explosive) { this.entities.lightDynamite(bx, by, bz, 0.3 + Math.random() * 0.6); continue; }
      w.setBlock(bx, by, bz, AIR);
      if (Math.random() < 0.08) this.particles.blockBreak(bx, by, bz, id);
      if (this.mode === 'survival' && Math.random() < 0.25 && BLOCKS[id].drop) this.entities.dropItem(BLOCKS[id].drop, 1, bx + 0.5, by + 0.5, bz + 0.5);
    }
    this.particles.burst(x, y, z, [0.95, 0.6, 0.2], 60, 12);
    this.particles.burst(x, y, z, [0.3, 0.3, 0.3], 80, 8);
    this.audio.play('explode', { pos: { x, y, z }, vol: 1, vary: 0.1 });
    this.audio.play('rumble', { pos: { x, y, z }, vol: 0.8, range: 60, vary: 0.05 });
    // daño
    const p = this.player.body.pos;
    const dp = Math.hypot(p.x - x, p.y + 0.9 - y, p.z - z);
    if (dp < r * 2) {
      const dmg = Math.round((1 - dp / (r * 2)) * 22);
      this.damagePlayer(dmg, x, z, 'Voló por los aires', true, true);
      this.shake = Math.max(this.shake, (1 - dp / (r * 2)) * 0.9);
    } else if (dp < r * 6) this.shake = Math.max(this.shake, 0.2);
    for (const m of this.entities.mobs) {
      const dm = Math.hypot(m.body.pos.x - x, m.body.pos.y - y, m.body.pos.z - z);
      if (dm < r * 2) m.hurt(Math.round((1 - dm / (r * 2)) * 22), x, z);
    }
  }

  // ---------- comandos (tecla T) ----------
  runCommand(text) {
    const parts = text.trim().replace(/^\//, '').split(/\s+/);
    const cmd = (parts[0] || '').toLowerCase();
    const p = this.player.body.pos;
    switch (cmd) {
      // v12.4.5: los comandos de prueba se cargan al usarlos (no van en el archivo principal)
      case 'prueba': import('./pruebas.js').then((m) => { for (const l of m.comandoPrueba(this, parts) || []) this.ui.chat(l); }).catch(() => this.ui.chat('No se pudieron cargar los comandos de prueba: recargue la página')); return [];
      case 'ayuda': case 'help':
        return ['/prueba (salta a cualquier parte del juego; sin nada, la lista)', '/animal <tipo> [n] (sin tipo: lista)', '/tiempo dia|noche|atardecer', '/clima despejado|lluvia|tormenta', '/modo creativo|supervivencia', '/tp x y z', '/dar <bloque o ítem> [cantidad]', '/danta [n]  /sombra [n]', '/semilla  /curar  /guardar', '/pueblo [ir]', '/lugar [tipo] [ir]', '/inframundo', '/lista (nombres para /dar)'];
      case 'tiempo': {
        const v = { dia: 0.05, día: 0.05, mediodia: 0.25, atardecer: 0.47, noche: 0.6, medianoche: 0.75 }[(parts[1] || '').toLowerCase()];
        if (v === undefined) return ['Uso: /tiempo dia|mediodia|atardecer|noche|medianoche'];
        this.time = v; return [`Hora cambiada a ${parts[1]}`];
      }
      case 'modo': {
        const m = (parts[1] || '').toLowerCase();
        if (m.startsWith('crea')) this.mode = 'creative';
        else if (m.startsWith('super')) { this.mode = 'survival'; this.player.flying = false; }
        else return ['Uso: /modo creativo|supervivencia'];
        this.ui.refreshBars();
        return [`Modo: ${this.mode === 'creative' ? 'Creativo' : 'Supervivencia'}`];
      }
      case 'tp': {
        const [x, y, z] = parts.slice(1, 4).map(Number);
        if ([x, y, z].some((n) => Number.isNaN(n))) return ['Uso: /tp x y z'];
        p.x = x; p.y = y; p.z = z; this.player.body.vel.y = 0; this.player.body.fallStart = null; this.ready = false;
        return [`Teletransportado a ${x} ${y} ${z}`];
      }
      case 'dar': case 'give': {
        const name = (parts[1] || '').toLowerCase();
        const n = Math.max(1, Math.min(640, Number(parts[2]) || 1));
        let id = K[name];
        if (id === undefined) {
          const it = Object.values(ITEMS).find((i) => i.key === name);
          if (it) id = it.id;
        }
        if (id === undefined) id = TOOL_IDS[name];
        if (id === undefined) return [`No conozco "${name}". Pruebe /lista`];
        this.inventory.add(id, n);
        return [`Le di ${n} × ${itemName(id)}`];
      }
      case 'lista':
        return [Object.keys(K).filter((k) => k !== 'air').join(', '), Object.values(ITEMS).map((i) => i.key).join(', ')];
      case 'lugar': case 'lugares': {
        if (this.world.gen.version < 5) return ['Los monumentos salen en mundos creados desde la versión 2.6'];
        const want = (parts[1] || '').toLowerCase() === 'ir' ? '' : (parts[1] || '').toLowerCase();
        const list = structuresNear(this.world.gen, p.x, p.z, this.world.gen.version >= 6 ? 3200 : 1600).filter((s) => !want || s.type.startsWith(want)).map((s) => ({ ...s, d: Math.hypot(s.x - p.x, s.z - p.z) })).sort((a, b) => a.d - b.d);
        const pick = list[0];
        if (!pick) return [`No encontré lugares cerca. Tipos: ${Object.keys(STRUCT_NAMES).join(', ')}`];
        if (parts.includes('ir')) { const rr = structRadius(this.world.gen, pick.type); p.x = pick.x + 0.5; p.z = pick.z - Math.max(8.5, rr * 0.8); p.y = pick.y + 12 + Math.min(20, rr * 0.4); this.player.flying = this.mode === 'creative'; return [`Teletransportado a: ${STRUCT_NAMES[pick.type]}`]; }
        const disc = this.meta.discovered || {};
        return list.slice(0, 8).map((s) => `${disc[s.id] ? '✔' : '·'} ${STRUCT_NAMES[s.type]} [${STRUCT_RARE[s.type] || 'común'}]: ${Math.round(s.d)} bloques (${s.x}, ${s.z})`).concat([`Descubiertos: ${Object.keys(disc).length} · /lugar <tipo> ir  para ir`]);
      }
      case 'puravida': case 'pura': {
        // easter egg: confeti tico y un logro secreto
        const pp = this.player.body.pos;
        this.particles.burst(pp.x, pp.y + 1.8, pp.z, [[0.1, 0.3, 0.8], [1, 1, 1], [0.85, 0.1, 0.12]], 40, 4);
        this.audio.play('aplausos', { ui: true, vol: 0.4 });
        this.achieve('puravida', '¡Pura vida, mae!');
        return ['¡Pura vida! 🇨🇷 Usted encontró un secreto. Hay más escondidos en los parques nacionales…'];
      }
      case 'cielo': {
        this.portalKind = 'cielo';
        this.travelThroughPortal('cielo');
        return [this.dim === 'tierra' ? 'Subiendo a las Tierras del Cielo…' : 'Volviendo a la superficie…'];
      }
      case 'inframundo': case 'superficie': {
        this.travelThroughPortal(this.dim === 'cielo' ? 'cielo' : 'inframundo');
        return [this.dim === 'tierra' ? 'Bajando al Inframundo Volcánico…' : 'Volviendo a la superficie…'];
      }
      case 'pueblo': {
        const n = this.nearestVillage(p.x, p.z, 4);
        if (this.world.gen.version < 3) return ['Los pueblos solo salen en mundos creados desde la versión 1.8'];
        if (!n) return ['No hay pueblos cerca'];
        if (parts[1] === 'ir') { p.x = n.v.x + 0.5; p.z = n.v.z + 8.5; p.y = n.v.y + 3; this.player.body.vel.y = 0; return [`Teletransportado al pueblo (${n.v.x}, ${n.v.z})`]; }
        const ang = Math.atan2(n.v.x - p.x, n.v.z - p.z) * 180 / Math.PI;
        const dirs = ['sur', 'sureste', 'este', 'noreste', 'norte', 'noroeste', 'oeste', 'suroeste'];
        return [`Pueblo más cercano: ${Math.round(n.dist)} bloques al ${dirs[((Math.round(ang / 45) % 8) + 8) % 8]} (${n.v.x}, ${n.v.z}). /pueblo ir para ir`];
      }
      case 'animal': {
        const tipo = (parts[1] || '').toLowerCase();
        if (!MOB_TYPES[tipo]) return [`Animales: ${Object.keys(MOB_TYPES).join(', ')}`];
        const n = Math.max(1, Math.min(20, Number(parts[2]) || 1));
        const d = this.player.lookDir();
        for (let i = 0; i < n; i++) this.entities.spawnMob(tipo, p.x + d.x * 3 + (Math.random() - 0.5), p.y + 1, p.z + d.z * 3 + (Math.random() - 0.5));
        return [`Apareció: ${MOB_TYPES[tipo].name} ×${n}`];
      }
      case 'danta': case 'sombra': {
        const n = Math.max(1, Math.min(20, Number(parts[1]) || 1));
        const d = this.player.lookDir();
        for (let i = 0; i < n; i++) this.entities.spawnMob(cmd, p.x + d.x * 3 + (Math.random() - 0.5), p.y + 1, p.z + d.z * 3 + (Math.random() - 0.5));
        return [`Aparecieron ${n} ${cmd === 'danta' ? 'danta(s)' : 'sombra(s)'}`];
      }
      case 'clima': {
        const t = { despejado: 'clear', sol: 'clear', lluvia: 'rain', tormenta: 'storm' }[(parts[1] || '').toLowerCase()];
        if (!t) return ['Uso: /clima despejado|lluvia|tormenta'];
        this.weather.set(t);
        return [`Clima: ${parts[1]}`];
      }
      case 'semilla': return [`Semilla: ${this.meta.seedText || this.meta.seed}`];
      case 'curar': this.player.health = this.player.maxHealth; this.player.food = 20; return ['Vida y comida al máximo'];
      case 'guardar': this.save().then(() => this.ui.toast('Partida guardada')); return ['Guardando…'];
      default: return [`Comando desconocido: ${cmd}. Escriba /ayuda`];
    }
  }

  // ---------- mano en primera persona ----------
  // Brazo con manga pintada; los ítems se sostienen con una postura según su tipo.
  armMesh(opts) {
    // la manga: la de la pechera si lleva una (su color), si no la de la camisa
    const pe = this.inventory && this.inventory.armor && this.inventory.armor[1], def = pe && getDef(pe.id);
    return armarBrazoMano((this.meta && this.meta.apariencia) || {}, { ...opts, manga: def && def.color ? def.color : null });
  }
  // v11.11.2: con algo en la mano, el brazo lo agarra. Se arma una vez por objeto en la pose de reposo, como hijo del mismo grupo
  // que el objeto: así acompaña el golpe, comer, poner bloque, el parry y todo lo demás sin cuentas extra.
  // Las cosas con mango, en puño (el mango cruza la mano de lado a lado y la cabeza sale por el lado del pulgar);
  // los bloques, apoyados en la palma abierta, por abajo.
  agarrar(root, item, pose) {
    const ag = item.userData.agarre, bloque = item.userData.kind === 'block';
    if (!ag && !bloque) return;
    // con mano, todo va un poco más arriba (si no, el puño queda detrás de la barra rápida); el bloque, más chico y a la vista, sobre la palma
    if (bloque) { pose.p[0] = 0.34; pose.p[1] = -0.19; pose.p[2] = -0.74; item.scale.setScalar(0.72); } else { pose.p[1] += 0.13; pose.p[0] -= 0.03; }
    item.updateMatrix();
    const base = new THREE.Matrix4().compose(new THREE.Vector3(...pose.p), new THREE.Quaternion().setFromEuler(new THREE.Euler(...pose.r)), new THREE.Vector3(1, 1, 1));
    const enMano = base.clone().multiply(item.matrix); // del objeto al espacio de la mano
    // el antebrazo sale hacia abajo y a la derecha, hacia la cámara; con un bloque entra más de lado, con los dedos por debajo
    const atras = (bloque ? new THREE.Vector3(1, -0.35, 0.12) : new THREE.Vector3(0.5, -0.62, 0.62)).normalize();
    let X, Y, Z, punto, local;
    if (bloque) {
      const lado = (item.geometry.parameters ? item.geometry.parameters.height : 0.36);
      punto = new THREE.Vector3(lado * 0.42, -lado / 2 - 0.004, lado * 0.42).applyMatrix4(enMano); // en la esquina de abajo que da a la cámara: así se ve la mano
      const arriba = new THREE.Vector3(0, 1, 0).transformDirection(enMano);
      Y = arriba.clone().negate(); // la palma (−Y del brazo) mira para arriba
      Z = atras.clone().sub(Y.clone().multiplyScalar(atras.dot(Y))).normalize();
      X = new THREE.Vector3().crossVectors(Y, Z).normalize();
      local = new THREE.Vector3(...PALMA);
    } else {
      // el arco se agarra por el medio y la jabalina un poco más adelante del cabo; lo demás, cerca del mango
      const def = getDef(this.handHeldId), k = def && def.bow ? 0.5 : def && def.key === 'jabalina' ? 0.38 : null;
      punto = (k !== null && ag.a ? new THREE.Vector3(...ag.a).lerp(new THREE.Vector3(...ag.b), k) : new THREE.Vector3(...ag.p)).applyMatrix4(enMano);
      X = new THREE.Vector3(...ag.d).transformDirection(enMano).negate(); // del pulgar al meñique: al revés de la cabeza
      Z = atras.clone().sub(X.clone().multiplyScalar(atras.dot(X))).normalize();
      Y = new THREE.Vector3().crossVectors(Z, X).normalize();
      local = new THREE.Vector3(...AGARRE);
    }
    const R = new THREE.Matrix4().makeBasis(X, Y, Z);
    const pos = punto.clone().sub(local.applyMatrix4(R));
    const brazoEnMano = R.clone().setPosition(pos);
    const brazo = this.armMesh({ puno: !bloque });
    new THREE.Matrix4().copy(base).invert().multiply(brazoEnMano).decompose(brazo.position, brazo.quaternion, brazo.scale);
    brazo.userData.brazo = true;
    root.add(brazo);
  }


  rebuildHand(id) {
    this.handHeldId = id;
    while (this.hand.children.length) {
      const c = this.hand.children.pop();
      c.traverse((o) => {
        if (!o.isMesh) return;
        o.geometry.dispose();
        const ms = Array.isArray(o.material) ? o.material : [o.material];
        ms.forEach((m) => { if (m.map && !m.userData.sharedMap) m.map.dispose(); m.dispose(); });
      });
    }
    const root = new THREE.Group();
    let pose;
    if (id === null) {
      const arm = this.armMesh();
      root.add(arm);
      pose = { p: [0.42, -0.4, -0.5], r: [0.25, -0.15, 0.1] };
    } else if (getDef(id) && getDef(id).machete && getDef(id).key !== 'sello_goma') {
      // machete en 3D con su propio tajo (ver updateHand)
      const mm = makeMacheteMesh(getDef(id).key === 'machete_cadejos');
      root.add(mm);
      root.userData.machete = true;
      root.userData.dark = getDef(id).key === 'machete_cadejos';
      pose = { p: [0.36, -0.4, -0.62], r: [-0.7, 0.15, 0.3] };
      this.agarrar(root, mm, pose);
    } else {
      // los bloques, como cubito; lo demás, el ícono con grosor (un poco más chico que la lámina de antes, que tapaba media pantalla)
      // v12.6.6: el tamaño, la pose y el punto de agarre dependen del tipo de objeto (agarre.js)
      const tipo = tipoAgarre(id), T = AGARRES[tipo];
      const mesh = tipo === 'bloque' || (isBlockId(id) && getDef(id).render === 'torch') ? makeItemMesh(id, 0.36) : makeHeldItemMesh(id, T.tam);
      root.add(mesh);
      if (mesh.userData.kind === 'block') pose = { p: [0.46, -0.42, -0.72], r: [0.05, 0.75, 0] };
      else {
        const def = getDef(id);
        pose = { p: [...(T || AGARRES.herramienta).p], r: [...(T || AGARRES.herramienta).r] };
        if (T && tipo !== 'herramienta' && mesh.userData.kind === 'flat') mesh.userData.agarre = agarreDe(mesh, tipo);
        // el hacha tiene el filo de un solo lado: se refleja sobre el mango para que corte hacia adelante
        if (def && def.tool === 'axe') { mesh.scale.x = -1; mesh.rotation.z = -Math.PI / 2; }
      }
      root.userData.tipo = tipo;
      this.agarrar(root, mesh, pose);
    }
    root.userData.pose = pose;
    root.position.set(...pose.p);
    root.rotation.set(...pose.r);
    this.hand.add(root);
    this.equip = 0;
  }

  updateHand(dt, light) {
    const pe = this.inventory.armor[1] ? this.inventory.armor[1].id : 0;
    if (pe !== this.handPechera) { this.handPechera = pe; this.handHeldId = -1; if (this.shieldMesh) this.shieldMesh.userData.id = -1; } // v11.13.3: la manga nueva
    const s = this.inventory.held;
    const id = s ? s.id : null;
    if (id !== this.handHeldId) {
      // bajar la mano, cambiar el ítem y subirla
      if (this.equip > 0.5 || this.handHeldId === -1) this.equipDir = -1;
      if (this.equip <= 0.02 || this.handHeldId === -1) { this.rebuildHand(id); this.equipDir = 1; }
    } else this.equipDir = 1;
    this.equip = Math.max(0, Math.min(1, (this.equip ?? 1) + (this.equipDir || 1) * dt * 6));
    const root = this.hand.children[0];
    if (!root) return;
    const pose = root.userData.pose;
    // cada arma tiene su peso: lo liviano se mueve rápido, lo pesado despacio
    const p = 1 - this.swing; // progreso del golpe 0..1 (lo avanza tickGolpePropio)
    const active = this.swing > 0;
    const s1 = active ? Math.sin(p * Math.PI) : 0;
    const s2 = active ? Math.sin(Math.sqrt(p) * Math.PI) : 0;
    const bob = this.settings.viewBobbing ? this.player.bob : 0;
    const amp = Math.min(1, Math.hypot(this.player.body.vel.x, this.player.body.vel.z) / 4.3) * (this.player.body.onGround ? 1 : 0.3);
    // el objeto nuevo sube con un rebotito (sale un pelito de más y se acomoda)
    const e1 = this.equip - 1;
    const drop = (1 - (1 + 2.2 * e1 * e1 * e1 + 1.2 * e1 * e1)) * 0.6;
    // vaivén al mirar (la mano se queda un poquito atrás)
    this.handLag = this.handLag || { x: 0, y: 0 };
    // inercia: al caer la mano sube un poquito, al saltar baja; respira en reposo; corriendo se inclina
    const vy = this.player.body.onGround ? 0 : this.player.body.vel.y;
    const nada = this.player.body.inWater && !this.player.flying && !this.player.body.onGround ? 1 : 0; // nadando, la mano va bajita y bracea
    this.handAire = (this.handAire || 0) + (Math.max(-0.07, Math.min(0.07, -vy * 0.006)) - nada * (0.07 + Math.sin((this.clock || 0) * 3.4) * 0.035) - (this.handAire || 0)) * Math.min(1, dt * 8);
    this.handAire -= (this.landDip || 0) * 0.04;
    const corre = this.player.sprinting && amp > 0.5 ? 1 : 0;
    this.handCorre = (this.handCorre || 0) + (corre - (this.handCorre || 0)) * Math.min(1, dt * 6);
    const respira = Math.sin((this.clock || 0) * 1.7) * 0.006 * (1 - amp);
    // lo que se suma a cualquier pose: el cuerpo en el aire, al correr y al recibir un golpe
    const extra = () => { root.position.y += this.handAire - this.handCorre * 0.05 - this.handGolpe * 0.05; root.rotation.y += this.handLag.x * 1.3; root.rotation.x += this.handLag.y * 1.3; };
    if (root.userData.machete) { if (this.armaFx) this.armaFx.visible = false; this.macheteHand(root, pose, dt, bob, amp, drop); extra(); this.handLag.x *= Math.pow(0.002, dt); this.handLag.y *= Math.pow(0.002, dt); this.tintHand(root, light); return; }
    if (this.slashFx) this.slashFx.visible = false;
    // cada clase de arma con su movida (armasmano.js)
    if (animarArma(this, root, pose, dt, bob, amp, drop)) { root.rotation.y += this.handLag.x * 1.3; root.rotation.x += this.handLag.y * 1.3; root.position.y -= this.handGolpe * 0.05; this.handLag.x *= Math.pow(0.002, dt); this.handLag.y *= Math.pow(0.002, dt); this.tintHand(root, light); return; }
    root.position.set(
      pose.p[0] - s2 * 0.22 + Math.sin(bob) * 0.025 * amp + this.handLag.x,
      pose.p[1] + Math.sin(Math.sqrt(p) * Math.PI * 2) * (active ? 0.1 : 0) - Math.abs(Math.cos(bob)) * 0.03 * amp - drop + this.handLag.y + this.handAire + respira - this.handCorre * 0.05,
      pose.p[2] - s1 * 0.18 + this.handCorre * 0.03,
    );
    root.rotation.set(pose.r[0] - s1 * 0.9 - this.handCorre * 0.18 + this.handLag.y * 1.3, pose.r[1] + s2 * 0.35 + this.handLag.x * 1.3, pose.r[2] - s1 * 0.25 + this.handCorre * 0.12);
    root.position.y -= this.handGolpe * 0.05;
    if (this.ponerT > 0) { const k = Math.sin((1 - this.ponerT / 0.16) * Math.PI); root.position.z = pose.p[2] - k * 0.14; root.position.y += k * 0.05; root.rotation.x -= k * 0.25; }
    if (this.manoT > 0) { const k = Math.sin((1 - this.manoT / 0.3) * Math.PI); root.position.z -= k * 0.3; root.position.y += k * 0.1; root.position.x -= k * 0.08; root.rotation.x += k * 0.4; root.rotation.y += k * 0.2; }
    // armas: la lanza da estocadas, el mazo y los golpes fuertes van de arriba para abajo con más fuerza
    const wd = this.heldDef();
    const heavyK = (this.heavyT || 0) > 0 ? 1.7 : 1;
    if (wd && wd.thrust && active) { root.position.z = pose.p[2] - Math.sin(p * Math.PI) * 0.45 * heavyK; root.position.x = pose.p[0] - Math.sin(p * Math.PI) * 0.12; root.rotation.set(pose.r[0] - 0.3, pose.r[1], pose.r[2]); }
    else if (wd && (wd.damage >= 4 || wd.slow) && active) { root.rotation.x = pose.r[0] + Math.sin(Math.sqrt(p) * Math.PI) * 0.6 * heavyK - s1 * 1.6 * heavyK; root.position.y += s1 * 0.12 * heavyK; }
    this.comerK = (this.comerK || 0) + ((this.eating ? Math.min(1, this.eating.t / 0.25) : 0) - (this.comerK || 0)) * Math.min(1, dt * 14);
    if (this.comerK > 0.003) {
      // llevar la comida a la boca y masticar, y volver con calma al terminar
      const k = this.comerK;
      const chew = this.eating ? Math.sin(this.eating.t * 22) * 0.025 * k : 0;
      root.position.set(pose.p[0] + (0.08 - pose.p[0]) * k, pose.p[1] + (-0.3 - pose.p[1]) * k + chew, pose.p[2] + (-0.42 - pose.p[2]) * k);
      root.rotation.set(pose.r[0] + 0.5 * k, pose.r[1] - 0.6 * k, pose.r[2] + 0.2 * k);
    }
    this.handLag.x *= Math.pow(0.002, dt); this.handLag.y *= Math.pow(0.002, dt);
    this.tintHand(root, light);
  }

  tintHand(root, light) {
    root.traverse((o) => {
      if (!o.isMesh) return;
      const ms = Array.isArray(o.material) ? o.material : [o.material];
      ms.forEach((m) => m.color.setScalar(light));
    });
  }

  // Tajo del machete: se arma (sube atrás), corta en diagonal rapidísimo dejando una estela, se queda un instante
  // al final y vuelve. Cada golpe alterna derecho y revés, como un machetero de verdad.
  macheteHand(root, pose, dt, bob, amp, drop) {
    if (this.swing > (this.lastSwing ?? 0) + 0.3) this.slashDir = this.slashDir === 1 ? -1 : 1;
    this.lastSwing = this.swing;
    const active = this.swing > 0, t = active ? 1 - this.swing : 1, D = this.slashDir || 1;
    const REST = pose;
    const H = (this.heavyT || 0) > 0;
    const UP = H ? { p: [0.22, 0.02, -0.5], r: [0.9, 0.1, 0.05] } : D > 0 ? { p: [0.42, -0.2, -0.55], r: [0.35, 0.3, -0.4] } : { p: [0.06, -0.16, -0.6], r: [0.3, -0.3, 0.6] };
    const END = H ? { p: [0.18, -0.62, -0.78], r: [-1.75, 0.05, 0.1] } : D > 0 ? { p: [-0.1, -0.5, -0.7], r: [-1.45, -0.2, 1.3] } : { p: [0.6, -0.55, -0.62], r: [-1.4, 0.4, -0.9] };
    const easeOut = (k) => 1 - (1 - k) * (1 - k), easeIn = (k) => k * k * k, easeIO = (k) => k * k * (3 - 2 * k);
    let a = REST, b = REST, k = 0;
    if (active) {
      if (t < 0.18) { a = REST; b = UP; k = easeOut(t / 0.18); }
      else if (t < 0.42) { a = UP; b = END; k = easeIn((t - 0.18) / 0.24); }
      else if (t < 0.55) { a = END; b = END; k = 0; }
      else { a = END; b = REST; k = easeIO((t - 0.55) / 0.45); }
    }
    const L = (i, key) => a[key][i] + (b[key][i] - a[key][i]) * k;
    // quieto: respira un poquito y el filo brilla al moverse
    const idle = active ? 0 : Math.sin((this.clock || 0) * 1.8) * 0.008;
    const kick = active && t >= 0.42 && t < 0.55 ? Math.sin((t - 0.42) * 120) * 0.006 : 0;
    root.position.set(L(0, 'p') + Math.sin(bob) * 0.025 * amp + this.handLag.x + kick, L(1, 'p') + idle - Math.abs(Math.cos(bob)) * 0.03 * amp - drop + this.handLag.y, L(2, 'p'));
    root.rotation.set(L(0, 'r'), L(1, 'r'), L(2, 'r'));
    this.handLag.x *= Math.pow(0.002, dt); this.handLag.y *= Math.pow(0.002, dt);
    // estela del corte
    if (!this.slashFx) {
      this.slashFx = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, depthTest: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }));
      this.slashFx.position.set(0.18, -0.24, -0.95);
      this.slashFx.renderOrder = 10;
      this.handScene.add(this.slashFx);
    }
    const fx = this.slashFx;
    const on = active && t > 0.18 && t < 0.66;
    fx.visible = on;
    if (!on) return;
    const grow = Math.min(1, (t - 0.18) / 0.24);
    const len = Math.PI * 0.95 * grow;
    const start = D > 0 ? 0.55 : Math.PI - 0.55 - len;
    fx.geometry.dispose();
    fx.geometry = new THREE.RingGeometry(0.4, 0.4 + 0.12 * (0.4 + grow * 0.6), 28, 1, start, Math.max(0.01, len));
    fx.material.color.set(root.userData.dark ? 0xff3a2a : 0xdff0ff);
    fx.material.opacity = (t < 0.42 ? 0.55 : 0.55 * (1 - (t - 0.42) / 0.24));
  }

  // v13.2.3: «Cargando terreno…» mientras el trozo del jugador no está (cada 3 s como mucho)
  avisarCargando() {
    const t = performance.now();
    if (t - (this.cargandoAviso || 0) < 3000) return;
    this.cargandoAviso = t;
    if (this.ui) this.ui.toast('⏳ Cargando terreno…', 2200, { cat: 'consejo', clave: 'cargando-terreno' });
  }
  // v13.2.3: si el cuadro falla una y otra vez (un error que no se va), se tira lo cargado y se genera de nuevo: el mundo no queda congelado
  recuperarTrozos() {
    const w = this.world; if (!w) return;
    for (const c of w.chunks.values()) w.disposeMeshes(c);
    w.chunks.clear(); if (w.fluidQueue) w.fluidQueue.clear(); if (w.caidas) w.caidas.length = 0; if (w.caidasSet) w.caidasSet.clear();
    this.esperaT = 0;
  }

  // ---------- cuadro ----------
  update(dt) {
    if (!this.running || !this.world) return;
    // cámara lenta del modo foto: el mundo va más despacio, la cámara no
    const realDt = dt;
    if (this.foto && this.camaraLenta) dt *= this.camaraLenta;
    if (this.muerte) dt *= tickMuerte(this, realDt); // al morir, cámara lenta un instante
    if (this.hitStop > 0) { this.hitStop -= realDt; dt *= 0.08; } // el frenón del golpe (armas3.js)
    if (this.slowmo > 0) { this.slowmo -= realDt; dt *= 0.35; } // el esquive perfecto (combate.js)
    const p = this.player;
    const pos = p.body.pos;

    // cargar mundo alrededor
    const busyBudget = this.ready ? 6 : 30;
    this.world.update(pos.x, pos.z, busyBudget);
    if (!this.ready) {
      if (this.world.readyAt(pos.x, pos.z)) {
        if (this.arrival) this.finishArrival();
        // salir de dentro de bloques (árboles en el punto de aparición)
        // v12.1.3: primero el hueco libre más cercano (a los lados o hasta 2 arriba); después hasta 12 bloques; y si sigue enterrado,
        // la superficie de esa columna (antes subía hasta 200 por dentro de la roca)
        p.body.desatascar(this.world);
        let guard = 0;
        while (guard++ < 12 && p.body.atascado(this.world)) pos.y += 1;
        if (p.body.atascado(this.world)) { let y = HEIGHT - 2; const bl = (yy) => this.world.getBlock(Math.floor(pos.x), yy, Math.floor(pos.z)); while (y > 1 && (!SOLID[bl(y)] || BLOCKS[bl(y)].leafy)) y--; pos.y = y + 1; } // v12.4.1: sin copas de árbol
        p.body.fallStart = null;
        this.ready = true;
        this.ui.hideLoading();
      } else {
        const total = (this.world.renderDistance * 2 + 1) ** 2;
        this.ui.setLoading(Math.min(0.99, this.world.stats.meshed / Math.min(total, 25)));
        this.render(dt);
        return;
      }
    }

    if (this.lying) this.tickLying(dt);
    barraMontaVisible(this, !this.paused && p.alive); // en pausa o en la pantalla de muerte, la barra se esconde
    const enFoto = tickFoto(this, realDt) || tickTren(this, dt);
    if (!this.paused && p.alive && !this.lying && !enFoto) {
      const k = this.keys;
      const input = {
        forward: k.has('KeyW'), back: k.has('KeyS'), left: k.has('KeyA'), right: k.has('KeyD'),
        jump: k.has('Space') && !this.blocking && !(this.hopLock > 0) && !this.slide, sneak: k.has('ShiftLeft') || k.has('ShiftRight') || !!this.blocking,
        sprint: (k.has('ControlLeft') || k.has('ControlRight') || this.sprintKey) && !this.blocking && (this.mode !== 'survival' || this.stamina > 2),
      };
      // no caer en chunks que aún no existen
      if (this.player.effects.mareo && (input.forward || input.back)) {
        // el guaro hace caminar en zigzag
        const s = Math.sin((this.clock || 0) * 1.6) + Math.sin((this.clock || 0) * 0.7) * 0.6;
        if (s > 0.6) input.left = true; else if (s < -0.6) input.right = true;
        this.hipT = (this.hipT || 0) - dt;
        if (this.hipT <= 0) { this.hipT = 4 + Math.random() * 6; this.audio.play('hipo', { vol: 0.5 }); }
      }
      this.disguised = !!(this.inventory.armor[0] && [376, 1182, 1183, 1184].includes(this.inventory.armor[0].id));
      this.player.capa = !!(this.inventory.armor[1] && this.inventory.armor[1].id === 407);
      if (this.dim === 'cielo' && this.player.body.pos.y < 4 && !this.switching) {
        // se cayó de las nubes: aparece cayendo sobre la superficie, despacito
        this.ui.toast('☁ ¡Se cayó de las nubes!', 2200);
        this.addEffect('pluma', 25);
        this.switchDim('tierra', null);
      }
      // portal: quedarse adentro un momento y te jala a la otra dimensión
      this.portalCd = Math.max(0, (this.portalCd || 0) - dt);
      const portalKind = this.portalCd <= 0 && !this.switching && !this.red ? (this.player.body.touchingBlock(this.world, (b) => b.key === 'portal_cielo') ? 'cielo' : this.player.body.touchingBlock(this.world, (b) => b.key === 'portal') ? 'inframundo' : null) : null;
      if (portalKind) {
        this.portalKind = portalKind;
        this.portalT = (this.portalT || 0) + dt;
        const pp = this.player.body.pos;
        for (let k = 0; k < 3; k++) this.particles.spawn(pp.x + (Math.random() - 0.5) * 1.4, pp.y + Math.random() * 2, pp.z + (Math.random() - 0.5) * 1.4, [0.9, 0.3, 0.6], 0, 0.8, 0, 0.8, -1, true);
        if (this.portalT > 1.8) { this.portalT = 0; this.travelThroughPortal(); }
      } else this.portalT = 0;
      if (this.gancho && (this.zip || this.monta || this.vagon || this.globoViaje || this.riding)) soltarGancho(this);
      if (this.zip) zipUpdate(this, dt, input);
      else if (this.monta) montaUpdate(this, dt, input);
      else if (this.vagon) vagonUpdate(this, dt);
      else if (this.globoViaje) globoUpdate(this, dt);
      else if (this.planeo) planeoUpdate(this, dt);
      else if (this.gancho) ganchoUpdate(this, dt);
      else if (this.riding && this.terrenoListo(pos)) this.rideUpdate(dt, input);
      else if (this.terrenoListo(pos)) { p.update(dt, input, this); this.esperaT = 0; }
      else if ((this.esperaT = (this.esperaT || 0) + dt) > 1.2) this.avisarCargando(); // v13.2.3: retenido esperando terreno: se avisa
      this.updateTarget();
      this.handleMouse(dt);
    } else {
      this.outline.visible = false;
      this.crack.visible = false;
    }

    // v12.11.0: la sala sigue viva aunque se pause (la pausa no congela a las demás personas)
    if (this.red) { this.red.tick(dt); if (this.remotos) this.remotos.update(dt); }
    // tiempo del día
    if (!this.paused) {
      // time-lapse del modo foto: el día corre rapidísimo (sube y baja suave, sin brincos)
      this.tlK = (this.tlK || 1) + (((this.foto && this.timelapse) || 1) - (this.tlK || 1)) * Math.min(1, dt * 2);
      this.time += (dt / DAY_LENGTH) * this.tlK;
      if (this.time >= 1) { this.time -= 1; this.day++; }
    }

    this.entities.update(this.paused ? 0 : dt);
    if (!this.paused) this.stations.update(dt);
    this.updatePlaceFx(dt);
    tickPortones(this, this.paused ? 0 : dt); // en pausa los avisos y los portones se quedan quietos, como las criaturas
    tickFxGolpes(this, this.paused ? 0 : dt);
    this.updateFishing(this.paused ? 0 : dt);
    if (this.bombs && !this.paused) this.bombs = this.bombs.filter((b) => { b.update(dt); if (b.dead) { b.remove(); return false; } return true; });
    if (this.rockets && !this.paused) this.rockets = this.rockets.filter((r) => { r.update(dt); if (r.dead) { r.remove(); return false; } return true; });
    if (!this.paused) { tickManasCuadro(this, dt); tickAnselmoCuadro(this); tickArchivoCuadro(this); tickArmas(this, dt); tickCharlas(this, dt); tickPulido(this, dt); tickPlaya(this, dt); tickChancleta(this, dt); tickDerrumbe(this, dt); tickPiedras(this, dt); tickMuebles(this, dt); tickCuerpo2(this, dt); tickObra(this, dt); tickRayos(this, dt); tickCeniza(this, dt); tickBatea(this, dt); tickMascotas(this, dt); tickPlatina(this, dt); tickSequia(this, dt); tickHuracan(this, dt); dibujarQuema(this, dt); dibujarMarabunta(this, dt); tickResaca(this, dt); cuadroPalo(this, dt); cuadroTsunami(this, dt); cuadroPlaga(this, dt); cuadroGoleta(this, dt); cuadroAnimales2(this, dt); cuadroFestival(this, dt); cuadroAbigeato(this, dt); cuadroSerenata(this, dt); cuadroImpostor(this, dt); cuadroFurtivos(this, dt); cuadroPerezosoCalle(this, dt); cuadroIncendio(this, dt); cuadroRanas(this, dt); cuadroArcoirisCielo(this, dt); cuadroCarrera(this, dt); cuadroFumiga(this, dt); cuadroPanga(this, dt); cuadroTrenFantasma(this, dt); cuadroBichos3(this, dt); cuadroFinal(this, dt); cuadroBarras(this, dt); cuadroCombo(this); cuadroSereno(this, dt); cuadroHongos(this, dt); tickBombas(this, dt); tickPavor(this); tickBaile(this); tickMinimapa(this, dt); tickCielo(this, dt); tickMonoCongo(this, dt); tickArena(this, dt); tickMundo2(this, dt); tickElecciones(this, dt); tickCalle(this, dt); tickIndicadores(this, dt); tickJuegos(this, dt); tickBingo(this); tickZopilotes(this, dt); tickRio(this, dt); tickAros(this, dt); tickArribada(this, dt); tickTorneo(this, dt); tickInfluencer(this, dt); tickTiro(this); tickMariposas(this, dt); tickCuidacarros(this, dt); tickCintas(this, dt); tickNaturaleza3(this, dt); tickPermiso(this); tickHuecosMata(this, dt); tickBailes(this, dt); tickPericos(this, dt); tickRocio(this, dt); tickPuebloVivo(this, dt); tickBarcos(this, dt); tickTrombas(this, dt); tickLucesRaras(this, dt); tickYiguirros(this, dt); tickQuedo(this, dt); tickCarretillero(this, dt); tickOropendolas(this, dt); tickGranizo(this, dt); tickSabanero(this, dt); tickCosta(this, dt); tickLavanderas(this, dt); tickChanchos(this, dt); tickNoches(this, dt); }
    if (this.arrows && !this.paused) this.arrows = this.arrows.filter((a) => { a.update(dt); if (a.dead) { a.remove(); return false; } return true; });
    if (!this.paused) this.updateBossBar();
    if (this.ui.state === 'inventory') this.ui.tickStation(dt);
    this.world.tickFluids(performance.now());
    if (!this.paused) this.tickCrops(dt);
    this.updateAmbience(dt);
    if (!this.paused) this.tickVillages(dt);
    if (!this.paused) this.tickLocas(dt);
    if (!this.paused) this.tickZones(dt);
    if (!this.paused) this.tickDiscover(dt);
    if (!this.paused) this.dimT = (this.dimT || 0) + dt;
    if (!this.paused) { this.tickGolpePropio(dt); tickCombat(this, dt); tickAturde(this, dt); tickTemblor(this, dt); tickParapente(this, dt); tickSurf(this, dt); tickVelas(this, dt); tickSacos(this, dt); }
    if (!this.paused) { this.ambientParticles(dt); this.tickEffects(dt); tickFuego(this, dt); this.clock = (this.clock || 0) + dt; this.nestT = (this.nestT || 0) - dt; if (this.nestT <= 0) { this.nestT = 1; tickNests(this); } }

    // autoguardado cada 30 s
    if (performance.now() - this.lastSave > 30000) this.save().then(() => this.ui.guardado());

    this.ui.refreshBars();
    this.ui.updateDebug();
    this.render(dt);
  }

  // ---------- pueblos ----------
  // pueblo más cercano a (x, z) dentro de las celdas vecinas (o null); solo mundos nuevos
  nearestVillage(x, z, cells = 1) {
    if (this.world.gen.version < 3) return null;
    const cx = Math.floor(x / VILLAGE_CELL), cz = Math.floor(z / VILLAGE_CELL);
    let best = null, bd = Infinity;
    for (let dz = -cells; dz <= cells; dz++) for (let dx = -cells; dx <= cells; dx++) {
      const v = villageAt(this.world.gen, cx + dx, cz + dz);
      if (!v) continue;
      const d = Math.hypot(v.x - x, v.z - z);
      if (d < bd) { bd = d; best = v; }
    }
    return best ? { v: best, dist: bd } : null;
  }

  // ---------- ideas locas: lluvia de mangos en verano y ToucanFest ----------
  tickLocas(dt) {
    this.locasT = (this.locasT || 0) - dt;
    if (this.locasT > 0) return;
    this.locasT = 1;
    const w = this.world, p = this.player.body.pos;
    this.tickPotrero(w, p);
    if (!this.meta.invitado) tickHistoria(this); // v12.14.0: la campaña de la abuela es del anfitrión (a la persona invitada se le construía una casa propia y el anfitrión la rechazaba bloque por bloque)
    tickRecetaFija(this);
    tickReloj(this);
    tickRuta(this);
    tickObjetivo(this);
    tickVivienda(this);
    tickBus(this);
    tickCharcos(this);
    tickSed(this, 1);
    tickFogatas(this);
    tickLena(this, 1); // v12.1.0 (tickLocas va una vez por segundo)
    tickTemporadas(this); // v12.3.0
    tickRutinas(this); // v12.4.2
    tickMolienda(this); // v12.4.7
    tickEncargos(this); // v12.4.12
    tickRespaldo(this, 1); // v12.8.5: el aviso de respaldo cada ~2 h de juego
    tickTortugasArrecife(this); // v12.6.0
    avisoVeda(this); // v12.7.2
    tickDespensa(this, 1);
    tickMostradores(this, 1); // v12.15.1 (C6)
    tickMision(this);
    tickHeridas(this);
    tickPrecios(this);
    tickSoda(this);
    tickFiestas(this);
    tickBestiario(this);
    tickVida2(this);
    tickReputacion(this);
    tickDiario(this);
    tickGuia(this);
    tickTuristas(this);
    tickComite(this); // v12.15.3 (C8-C)
    tickPatronal(this); // v12.15.4 (C8-B)
    tickPresaEterna(this);
    tickApagon(this);
    tickFrio(this);
    tickConsejos(this);
    tickCuerpo(this);
    tickBolso(this);
    tickZancudos(this);
    tickMonte(this);
    tickAsedio(this);
    tickNidos(this);
    tickAmanecer(this);
    tickCuaderno(this);
    tickManas(this);
    tickNemesis(this);
    tickAnselmo(this);
    tickPlatos(this);
    tickExpediente(this);
    tickGente(this);
    tickPrima(this);
    tickCorreo(this);
    tickArchivo(this);
    tickDefensa(this);
    tickCumple(this);
    tickEpilogo(this);
    tickCrecida(this);
    tickAvispas(this);
    tickQuema(this);
    tickNeblina(this);
    tickMarabunta(this);
    tickRecompensas(this);
    tickProcesion(this);
    tickBailarin(this);
    tickAsalto(this);
    tickLahar(this);
    tickPalo(this);
    tickToros(this);
    tickPlaga(this);
    tickBichos2(this);
    tickGoleta(this);
    tickLunaRoja(this);
    tickMinaOro(this);
    tickAnimales2(this);
    tickFestival(this);
    tickRifa(this);
    tickAbigeato(this);
    tickConcurso(this);
    tickSerenata(this);
    tickClasico(this);
    tickTerremoto(this);
    tickImpostor(this);
    tickFurtivos(this);
    tickPerezosoCalle(this);
    tickIncendio(this);
    tickChompipes(this);
    tickGlobo(this);
    tickRanas(this);
    tickArcoirisCielo(this);
    tickFauna4(this);
    tickCarrera(this);
    tickFumiga(this);
    tickPanga(this);
    tickAlfarero(this);
    tickTrenFantasma(this);
    tickFuerza(this);
    revisarErmitas(this);
    tickIncursiones(this);
    tickConjunto(this);
    tickAbejas(this);
    tickMunecos(this);
    tickSereno(this);
    if (this.meta.fiado && !this.meta.fiadoDia) this.meta.fiadoDia = this.day || 1; // partidas de antes: el plazo arranca hoy
    if (this.meta.fiado && !this.meta.fiadoMoroso && (this.day || 1) - (this.meta.fiadoDia || this.day || 1) > 5) { this.meta.fiadoMoroso = true; this.ui.toast('📒 Se pasó el plazo del fiado: en la pulpería ya lo apuntaron como moroso', 4600); }
    this.devolverUnicos();
    tickRigo(this);
    tickPeon(this);
    tickGuila(this);
    tickInspector(this);
    tickVidaBaja(this);
    tickHallazgos(this);
    tickCorazon(this);
    tickEscondites(this);
    tickCanelo(this);
    tickBuhonero(this);
    tickRetos(this);
    tickCandela(this);
    tickApuros(this);
    tickCencerros(this);
    tickMejenga(this);
    // aviso de luna llena al anochecer
    if (this.mode === 'survival' && (this.day || 1) % 7 === 0 && this.daylight < 0.4 && this.lunaDia !== this.day) { this.lunaDia = this.day; this.ui.regionBanner('🌕 Luna llena', 'Esta noche salen las leyendas… y más Sombras'); this.audio.play('rumble', { vol: 0.5 }); }
    if (this.rutaOpen) this.ui.showRuta(rutaHTML(this));
    // en verano, de los árboles de llanura y bosque seco caen mangos maduros (¡cuidado con la cabeza!)
    if (this.season === 'verano' && this.daylight > 0.4 && Math.random() < 0.35) {
      const col = w.gen.column(Math.floor(p.x), Math.floor(p.z));
      if (!['snowy', 'ocean', 'mountains', 'desert', 'volcano', 'inframundo'].includes(col.biome)) {
        for (let tries = 0; tries < 8; tries++) {
          const x = Math.floor(p.x + (Math.random() - 0.5) * 14), z = Math.floor(p.z + (Math.random() - 0.5) * 14);
          let y = Math.floor(p.y) + 12;
          while (y > p.y - 2 && w.getBlock(x, y, z) !== K.leaves) y--;
          if (w.getBlock(x, y, z) !== K.leaves || w.getBlock(x, y - 1, z) !== AIR) continue;
          const it = this.entities.dropItem(377, 1, x + 0.5, y - 0.3, z + 0.5, { x: 0, y: -1, z: 0 }, 0.6);
          it.mango = true;
          this.audio.material('leaves', 'hit', { x: x + 0.5, y, z: z + 0.5 });
          // si cae justo encima del jugador, le pega
          if (Math.abs(x + 0.5 - p.x) < 0.8 && Math.abs(z + 0.5 - p.z) < 0.8 && this.mode === 'survival') {
            setTimeout(() => { if (this.player.alive) { this.damagePlayer(1, null, null, 'Le cayó un mango en la cabeza', true); this.ui.toast('🥭 ¡Auch! Le cayó un mango en la cabeza', 1600); this.achieve('mango', 'Bendito mango'); } }, 450);
          }
          break;
        }
      }
    }
    // ToucanFest: cinco tucanes juntos hacen fiesta de colores
    const tucanes = this.entities.mobs.filter((m) => m.type === 'tucan' && !m.dying && Math.hypot(m.body.pos.x - p.x, m.body.pos.z - p.z) < 24);
    if (tucanes.length >= 5 && !(this.toucanFestT > 0)) {
      this.toucanFestT = 30;
      this.ui.toast('🎉 ¡ToucanFest! Los tucanes hacen fiesta', 2600);
      this.achieve('toucanfest', 'ToucanFest');
      for (const m of tucanes) {
        this.audio.play('tucan', { pos: m.soundPos(), vol: 0.9, vary: 0.2 });
        this.particles.burst(m.body.pos.x, m.body.pos.y + 0.4, m.body.pos.z, [[1, 0.85, 0.1], [1, 0.3, 0.1], [0.2, 0.8, 0.3], [0.2, 0.4, 1]], 30, 4);
      }
      // dejan plumas de regalo
      this.entities.dropItem(277, 2, tucanes[0].body.pos.x, tucanes[0].body.pos.y, tucanes[0].body.pos.z);
    }
    if (this.toucanFestT > 0) this.toucanFestT -= 1;
  }

  tickVillages(dt) {
    this.villageT = (this.villageT || 0) - dt;
    if (this.villageT > 0) return;
    this.villageT = 1;
    const p = this.player.body.pos;
    const near = this.nearestVillage(p.x, p.z);
    this.envPueblo = near ? Math.max(0, Math.min(1, (50 - near.dist) / 25)) : 0;
    // vecinos: aparecen cuando el jugador anda cerca y el suelo ya está cargado
    for (const npc of this.world.villageNpcs.values()) {
      if (Math.hypot(npc.vx - p.x, npc.vz - p.z) > 80) continue;
      if (!this.world.isLoaded(npc.x, npc.z) || !this.world.isLoaded(npc.vx, npc.vz)) continue;
      spawnVillager(this, npc);
    }
    if (!near) return;
    // llegar al pueblo
    if (near.dist < 30) {
      this.meta.villages = this.meta.villages || {};
      if (!this.meta.villages[near.v.id]) {
        this.meta.villages[near.v.id] = { found: this.day || 0 };
        this.ui.toast(near.v.name ? `¡Pura vida, llegó a ${near.v.name}! ${near.v.city ? 'Una ciudad entera.' : '¡Pura vida!'}` : '¡Llegó a un pueblo! ¡Pura vida!', 2600);
        if (near.v.city) this.achieve('ciudad', 'Ciudad tica');
        this.achieve('pueblo', 'Llegué al pueblo');
      }
    }
    // campanas de la iglesia al amanecer, mediodía y atardecer
    const t = this.time;
    for (const bt of BELL_TIMES) {
      const key = `${this.day}:${bt}`;
      if (t >= bt && t < bt + 0.01 && this.lastBell !== key && near.dist < 160) {
        this.lastBell = key;
        const v = near.v;
        const bell = v.bell || { x: v.x, y: v.y + 12, z: v.z - 20 };
        for (let k = 0; k < 3; k++) setTimeout(() => this.audio.play('campana', { pos: bell, vol: 1, vary: 0.02 }), k * 1600);
      }
    }
  }

  tickEating(dt) {
    const e = this.eating;
    const held = this.inventory.held;
    if ((!this.mouse.right && !this.rapido) || !held || held.id !== e.id) { this.eating = null; terminarRapido(this); return; }
    e.t += dt;
    e.chew -= dt;
    if (e.chew <= 0) {
      e.chew = 0.21;
      const eye = this.player.eye, d = this.player.lookDir();
      if (getDef(e.id).sip) { if (Math.random() < 0.5) this.audio.play('sorbo', { vol: 0.5 }); } else this.audio.play('eat', { vol: 0.4, vary: 0.15 });
      // migas del color de la comida
      const c = held.id === 261 ? [[0.8, 0.2, 0.15], [0.95, 0.9, 0.7]] : held.id === 270 || held.id === 268 ? [[0.95, 0.8, 0.4], [0.85, 0.65, 0.3]] : [[0.6, 0.3, 0.2], [0.85, 0.5, 0.35]];
      for (let k = 0; k < 4; k++) this.particles.spawn(eye.x + d.x * 0.4 + (Math.random() - 0.5) * 0.15, eye.y - 0.25, eye.z + d.z * 0.4 + (Math.random() - 0.5) * 0.15, c[k % 2], d.x * 0.6 + (Math.random() - 0.5), 1 + Math.random(), d.z * 0.6 + (Math.random() - 0.5), 0.6);
    }
    if (e.t >= 1.6) {
      const def = getDef(e.id);
      // comer siempre lo mismo aburre: llena menos (coma variado)
      // v11.10: repetir ya no castiga (siempre llena igual); comer variado en el día da premio (comerVariado)
      const ult = (this.meta.comidas = this.meta.comidas || []);
      ult.push(e.id); if (ult.length > 6) ult.shift();
      // v12.1.0: la comida pasada rinde la mitad; sentado a la mesa, un 15 % más
      const despK = factorComida(this, held) * bonoMesa(this, e.id);
      this.player.food = Math.min(20, this.player.food + Math.max(1, Math.round((def.food || 0) * mult.comida(this) * casa.comida(this) * despK * bonoOficio(this, e.id, def.food || 0).mult) + bonoOficio(this, e.id, def.food || 0).add));
      alComerDespensa(this, e.id);
      comerVariado(this, e.id);
      if ((def.food || 0) >= 5 && e.id !== 262 && !esPescado(e.id)) gainSkill(this, 'cocina', Math.round(def.food / 3));
      if (skillLv(this, 'cocina') >= 10) this.player.health = Math.min(this.player.maxHealth, this.player.health + 4);
      if (AGUA[e.id]) beber(this, AGUA[e.id]);
      alComer(this, e.id);
      comerPlato(this, e.id);
      comidaFuerza(this, e.id); // la comida buena sube la vida y el aguante máximos un rato (fuerza.js)
      // la carne y el pescado crudos pueden caer mal
      if (this.mode === 'survival' && (e.id === 262 || esPescado(e.id)) && skillLv(this, 'cocina') < 5 && !mana(this, 'buche') && Math.random() < 0.3) {
        this.addEffect('panza', 40);
        this.ui.toast('🤢 Estaba crudo: dolor de panza. La sopa negra o la leche lo cura', 3200);
        this.achieve('panza', 'Comí crudo');
      }
      if (def.cures) { delete this.player.effects.veneno; delete this.player.effects.panza; this.ui.toast('Se le quitó el malestar', 1400); }
      if (def.returns) this.inventory.add(def.returns, 1);
      if (def.ignifugo) { this.addEffect('ignifugo', def.ignifugo); this.ui.toast('🔥 Piel de fuego: la lava no le quema por un rato', 2000); }
      if (def.monte) { this.player.health = this.player.maxHealth; this.addEffect('monte', 600); this.addEffect('calma', 600); this.ui.toast('🌳 El corazón del monte le da calma: 10 minutos con menos hambre', 2800); }
      if (def.corazon) {
        this.addEffect('ignifugo', 900); this.player.health = this.player.maxHealth;
        this.ui.toast('❤️‍🔥 El Corazón del Arenal late en su pecho: 15 minutos de piel de fuego', 3000);
      }
      if (def.trip) {
        this.addEffect('viaje', def.trip);
        this.ui.toast('🍄 Uy… ese hongo no era de los de la olla. Todo se pone de colores…', 3200);
        this.achieve('viaje', 'Un viaje por el potrero');
      }
      if (def.key === 'antidoto') { delete this.player.effects.veneno; this.addEffect('antiveneno', 240); this.ui.toast('🧪 El antídoto del Tata: se le quita el veneno y por 4 minutos no le entra', 2600); }
      if (def.guaro) { this.addEffect('mareo', 45); this.ui.toast('🥴 ¡Salud! Todo da vueltas…', 1800); this.achieve('guaro', '¡Salud con guaro de caña!'); }
      if (def.energy) { this.addEffect('energia', def.energy); this.ui.toast('¡Con energía! Corre más rápido', 1400); }
      this.inventory.consumeHeld(1);
      this.audio.play('pop', { ui: true, vol: 0.25, pitch: 0.7 });
      this.eating = null;
      terminarRapido(this);
      this.useCd = 0.35;
    }
  }

  // ¿hay agua a 4 bloques o menos? (para la tierra arada)
  hydrated(x, y, z) {
    for (let dy = 0; dy <= 1; dy++) for (let dz = -4; dz <= 4; dz++) for (let dx = -4; dx <= 4; dx++) {
      if (FLUID[this.world.getBlock(x + dx, y + dy, z + dz)] === 1) return true;
    }
    return false;
  }

  // Crecimiento de cultivos (una vez por segundo)
  // el arbolito de guanacaste se vuelve un árbol enorme (si hay espacio)
  growGuanacaste(x, y, z) {
    const w = this.world;
    for (let dy = 1; dy <= 9; dy++) for (const [dx, dz] of [[0, 0], [1, 0], [0, 1], [1, 1]]) if (dy > 0 && w.getBlock(x + dx, y + dy, z + dz) !== AIR) return;
    for (const [dx, dz] of [[1, 0], [0, 1], [1, 1]]) if (BLOCKS[w.getBlock(x + dx, y, z + dz)].solid) return;
    w.setBlock(x, y, z, AIR, { updates: false });
    const rnd = Math.random;
    guanacasteShape((dx, dy, dz, id, onlyAir) => {
      const bx = x + dx, by = y - 1 + dy, bz = z + dz;
      if (onlyAir && w.getBlock(bx, by, bz) !== AIR) return;
      w.setBlock(bx, by, bz, id, { updates: false });
    }, rnd, false);
    this.particles.burst(x + 0.5, y + 1, z + 0.5, [[0.4, 0.8, 0.3], [0.7, 1, 0.5]], 30, 3);
    this.audio.material('leaves', 'place', { x: x + 0.5, y: y + 1, z: z + 0.5 });
    this.achieve('guanacaste', 'Sembré un guanacaste');
  }

  tickCrops(dt) {
    if (this.world.red === 'cliente') return; // el invitado no hace crecer nada: lo manda el anfitrión
    this.cropT = (this.cropT || 0) - dt;
    if (this.cropT > 0) return;
    this.cropT = 1;
    const w = this.world;
    for (const k of [...w.crops]) {
      const [x, y, z] = k.split(',').map(Number);
      if (!w.isLoaded(x, z)) continue;
      const id = w.getBlock(x, y, z);
      const b = BLOCKS[id];
      if (!b.crop) { w.crops.delete(k); continue; }
      if (b.crop === 'guanacaste') { if (Math.random() < 1 / 90) this.growGuanacaste(x, y, z); continue; }
      // sequía: en Guanacaste las cosechas crecen a la mitad
      if (this.sequia && Math.random() < 0.5 && regionAt(this.world.gen, x, z) === 'guanacaste') continue;
      const soil = w.getBlock(x, y - 1, z);
      const raining = this.weather && this.weather.intensity > 0.5 && !this.dry && !this.cold;
      const wet = raining || this.hydrated(x, y - 1, z);
      if (wet && soil === K.farmland) w.setBlock(x, y - 1, z, K.farmland_wet, { updates: false });
      if (!wet && soil === K.farmland_wet) w.setBlock(x, y - 1, z, K.farmland, { updates: false });
      if (b.crop === 'cane') {
        // crece hasta 3 de alto si hay agua al lado de la base
        let base = y; while (w.getBlock(x, base - 1, z) === K.cane) base--;
        if (y - base >= 2 || w.getBlock(x, y + 1, z) !== AIR) continue;
        let water = false;
        for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (FLUID[w.getBlock(x + dx, base - 1, z + dz)] === 1) water = true;
        if (water && Math.random() < 1 / 20) w.setBlock(x, y + 1, z, K.cane);
        continue;
      }
      if (b.stage >= 3) continue;
      if (b.crop === 'cafe' && Math.random() < 0.5) continue;
      if (b.crop === 'cafe' && b.stage >= 2 && this.season === 'invierno') continue; // v12.4.0: en invierno el cafeto florece y no da cereza
      const birds = this.entities.mobs.some((m) => m.type === 'colibri' && Math.hypot(m.body.pos.x - x, m.body.pos.z - z) < 12);
      const temporada = this.season === 'invierno' ? 1.25 : this.season === 'verano' && !this.hydrated(x, y - 1, z) ? 0.85 : 1; // v12.4.6 (C3): los cultivos y la temporada
      if (Math.random() < (wet ? 1 / 12 : 1 / 30) * (birds ? 1.8 : 1) * temporada) {
        w.setBlock(x, y, z, K[`${b.crop}${b.stage + 1}`], { updates: false });
        this.particles.burst(x + 0.5, y + 0.4, z + 0.5, [[0.5, 0.9, 0.4], [0.8, 1, 0.6]], 5, 1);
      }
    }
  }

  handleMouse(dt) {
    this.attackCd = Math.max(0, this.attackCd - dt);
    this.useCd = Math.max(0, this.useCd - dt);
    this.actionCd = Math.max(0, this.actionCd - dt);
    if (this.monta || this.vagon || this.globoViaje) { this.crack.visible = false; return; } // arriba del toro (o en la vagoneta), las dos manos van agarradas
    if (!this.mouse.right) this.ganchoEspera = false; // el gancho pide un clic nuevo, no se relanza con el botón sostenido
    if (this.bowDraw) this.tickBow(dt);
    else if (this.eating) this.tickEating(dt);
    else if (this.mouse.right && this.useCd <= 0 && !this.blocking) { this.rightClick(); if (this.useCd <= 0) this.useCd = 0.22; }
    if (!this.mouse.left) { this.crack.visible = false; return; }
    if (this.mobAlAlcance()) { if (this.attackCd <= 0) this.attack(this.mobTarget.mob); this.crack.visible = false; return; }
    const t = this.target;
    if (!t) { this.breaking = null; this.crack.visible = false; return; }
    if (this.mode === 'creative') {
      if (this.actionCd <= 0) { this.breakBlock(t, false); this.actionCd = 0.22; }
      return;
    }
    if (!this.breaking || this.breaking.x !== t.x || this.breaking.y !== t.y || this.breaking.z !== t.z || this.breaking.id !== t.id) {
      this.breaking = { x: t.x, y: t.y, z: t.z, id: t.id, progress: 0, total: this.breakTime(t.id), hitT: 0, sostenido: 0 };
    }
    const br = this.breaking;
    br.progress += dt;
    // la herramienta sola sale solo si uno MANTIENE el clic en el bloque (0.35 s): con un clic suelto (un espadazo que se fue al
    // piso en una pelea) ya no le cambia el arma
    br.sostenido += dt;
    if (!br.revisado && br.sostenido >= 0.35) {
      br.revisado = true;
      const antes = this.inventory.selected;
      this.herramientaSola(t.id);
      if (this.inventory.selected !== antes) { const k = br.progress / Math.max(0.01, br.total); br.total = this.breakTime(t.id); br.progress = k * br.total; }
    }
    br.hitT -= dt;
    if (br.hitT <= 0) {
      br.hitT = 0.25;
      const hp = { x: t.x + 0.5, y: t.y + 0.5, z: t.z + 0.5 };
      this.audio.material(BLOCKS[t.id].sound, 'hit', hp);
      // el pico contra la piedra: golpe de metal en piedra de verdad
      const hd = this.herramientaEnMano();
      if (hd && hd.tool === 'pickaxe' && BLOCKS[t.id].sound === 'stone') this.audio.play('picar', { pos: hp, vol: 0.4, vary: 0.1 });
      this.swing = 1; this.swingRate = 4.2; this.particles.chip(t);
      this.crackPulso = 1;
    }
    const frac = br.progress / br.total;
    if (frac >= 1) {
      this.breakBlock(t, true);
      this.breaking = null;
      this.crack.visible = false;
      return;
    }
    const stage = Math.min(crackTextures.length - 1, Math.floor(frac * crackTextures.length));
    this.crack.material.map = crackTextures[stage];
    this.crack.material.needsUpdate = true;
    this.crack.position.set(t.x + 0.5, t.y + 0.5, t.z + 0.5);
    // cada golpe sacude un toque la grieta: el bloque se siente, no es una barra de progreso
    this.crackPulso = Math.max(0, (this.crackPulso || 0) - dt * 9);
    this.crack.scale.setScalar(1 + this.crackPulso * 0.035);
    this.crack.visible = true;
  }

  render(dt) {
    if (this.contextLost) return;
    const p = this.player;
    const eye0 = p.eye;
    // suavizado de la cámara solo en los saltos bruscos: subir un escalón, montarse o bajarse de algo
    // (las caídas y el movimiento normal no se suavizan, para que no se sienta con retraso)
    const ev = this.eyePrev, montado = this.riding || null;
    this.camOff = this.camOff || { x: 0, y: 0, z: 0 };
    if (ev && dt > 0) {
      const dx = eye0.x - ev.x, dy = eye0.y - ev.y, dz = eye0.z - ev.z;
      const cambioMonta = montado !== this.montadoPrev;
      const escalon = p.body.onGround && dy > 0.3 && dy < 1.3 && this.ready;
      if (cambioMonta && Math.hypot(dx, dy, dz) < 6) { this.camOff.x -= dx; this.camOff.y -= dy; this.camOff.z -= dz; }
      else if (escalon && !montado) this.camOff.y -= dy;
    }
    this.eyePrev = { x: eye0.x, y: eye0.y, z: eye0.z };
    this.montadoPrev = montado;
    const kOff = Math.pow(0.0004, dt);
    this.camOff.x *= kOff; this.camOff.y *= kOff; this.camOff.z *= kOff;
    const eye = { x: eye0.x + this.camOff.x, y: eye0.y + this.camOff.y, z: eye0.z + this.camOff.z };
    // cámara
    let bobX = 0, bobY = 0;
    const ampBob = this.settings.viewBobbing && p.body.onGround ? Math.min(1, Math.hypot(p.body.vel.x, p.body.vel.z) / 4.3) : 0;
    this.bobAmt = (this.bobAmt || 0) + (ampBob - (this.bobAmt || 0)) * Math.min(1, dt * 9);
    bobX = Math.sin(p.bob) * 0.04 * this.bobAmt;
    bobY = Math.abs(Math.cos(p.bob)) * 0.06 * this.bobAmt;
    // flotando, el agua lo mece
    this.flotaK = (this.flotaK || 0) + ((p.body.inWater && !p.flying && !p.body.onGround && this.settings.viewBobbing && !calmaActiva(this) ? 1 : 0) - (this.flotaK || 0)) * Math.min(1, dt * 4);
    bobY += Math.sin((this.clock || 0) * 1.9) * 0.035 * this.flotaK;
    this.shake = Math.max(0, this.shake - dt);
    const sh = this.shake * 0.3 * (this.settings.viewBobbing ? 1 : 0.3) * (calmaActiva(this) ? 0.3 : 1), ckS = this.clock || 0;
    const shX = (Math.sin(ckS * 67) + Math.sin(ckS * 113) * 0.5) * 0.33 * sh, shY = (Math.sin(ckS * 79 + 1) + Math.sin(ckS * 131) * 0.5) * 0.33 * sh, shZ = (Math.sin(ckS * 59 + 2) + Math.sin(ckS * 101) * 0.5) * 0.33 * sh;
    // al aterrizar la cámara baja en dos o tres cuadros y vuelve despacio; al recibir daño se inclina
    this.landHit = (this.landHit || 0) * Math.pow(0.002, dt);
    this.landDip = (this.landDip || 0) + (this.landHit - (this.landDip || 0)) * Math.min(1, dt * 24);
    this.hurtTilt = (this.hurtTilt || 0) * Math.pow(0.005, dt);
    this.camera.position.set(eye.x + bobX * Math.cos(p.yaw) + shX, eye.y + bobY - this.landDip + shY, eye.z - bobX * Math.sin(p.yaw) + shZ);
    const trip = p.effects && p.effects.viaje ? Math.min(1, p.effects.viaje / 8, (this.tripT = (this.tripT || 0) + dt) / 6) : 0;
    const sway = (p.effects && p.effects.mareo ? Math.sin((this.clock || 0) * 1.3) * 0.07 * Math.min(1, p.effects.mareo / 5) : 0) + Math.sin((this.clock || 0) * 0.7) * 0.05 * trip;
    // el viaje del hongo de potrero: colores que giran, la vista que respira y se dobla
    const cv = this.renderer.domElement;
    if (trip > 0.01) {
      const ck = this.clock || 0;
      cv.style.filter = `hue-rotate(${(ck * 40) % 360}deg) saturate(${1 + trip * 1.4}) contrast(${1 + trip * 0.15}) blur(${Math.max(0, Math.sin(ck * 0.9)) * trip * 0.8}px)`;
      cv.style.transform = `scale(${1 + Math.sin(ck * 1.7) * 0.015 * trip}) skewX(${Math.sin(ck * 0.6) * 2.5 * trip}deg)`;
      this.tripOn = true;
    } else if (this.tripOn) { cv.style.filter = ''; cv.style.transform = ''; this.tripOn = false; this.tripT = 0; this.brilloFilter = null; }
    // el «ojo» de las pociones todavía aclara la imagen entera
    cuadroProfundidad(this, dt); // v13.2.0: menos luz conforme se baja (uniforme del shader) y el aviso de lava
    BRILLO.value = brilloProf(luzDeAjuste(this.settings.luz), !!(this.env && this.env.cave > 0.6 && conCasco(this)), this.profK || 0); // v13.2.0: el deslizador no lava lo hondo y el casco sube con la hondura // v12.15.2 (C7): la linterna del casco de espeleólogo // v11.11.0: el brillo va en la luz del mundo (brillo.js), ya no en un filtro
    if (!this.tripOn) { const bri = this.ojoBrillo || 0, want = (bri > 0.01 ? `brightness(${(1 + bri * 0.6).toFixed(2)}) contrast(${(1 - bri * 0.08).toFixed(2)})` : '') + (this.cansaBlur ? ` blur(${this.cansaBlur.toFixed(2)}px)` : '') + (this.fotoFiltro ? ` ${this.fotoFiltro}` : '') + filtroMuerte(this); if (this.brilloFilter !== want) { this.brilloFilter = want; cv.style.filter = want; } }
    // la cámara se inclina con la avioneta y el parapente en las curvas, y se mece sobre la tabla de surf
    const av = this.riding && this.riding.type === 'avioneta' ? this.riding.data : null;
    const rollMeta = av ? -(av.roll || 0) * 0.75 : this.monta ? (this.camRollMonta || 0) : this.parapente ? -(this.parapente.roll || 0) * 0.45 : this.surf ? Math.sin((this.clock || 0) * 1.3) * 0.035 : 0;
    const lado = this.riding || this.monta || !this.settings.viewBobbing ? 0 : p.body.vel.x * Math.cos(p.yaw) - p.body.vel.z * Math.sin(p.yaw);
    this.camRoll = (this.camRoll || 0) + (rollMeta + Math.max(-0.022, Math.min(0.022, -lado * 0.0045)) - (this.camRoll || 0)) * Math.min(1, dt * 5);
    const camG = golpeCamara(this), kCam = calmaActiva(this) ? 0.25 : 1;
    this.camera.rotation.set(p.pitch + sway * 0.4 + (this.flipPitch || 0) + camG.pitch * kCam + (this.sentado && this.meceAng && !calmaActiva(this) ? this.meceAng * 0.5 : 0), p.yaw + camG.yaw * kCam, this.hurtTilt * (calmaActiva(this) ? 0.3 : 1) + sway + this.camRoll + camG.roll * kCam);
    // tercera persona: la cámara se aleja detrás (o adelante) del personaje sin meterse en las paredes
    if (this.view && !this.cine) {
      const d = p.lookDir(), s = this.view === 1 ? -1 : 1, want = this.view === 1 ? 4.2 : 3.2;
      // solo la paran los bloques sólidos de verdad (hojas, plantas, vidrio y cables no)
      let dist = want;
      if (this.world) for (let t = 0.3; t <= want; t += 0.15) {
        const id = this.world.getBlock(Math.floor(eye.x + d.x * s * t), Math.floor(eye.y + d.y * s * t), Math.floor(eye.z + d.z * s * t));
        const B = BLOCKS[id];
        if (B && B.solid && B.render !== 'cutout' && B.render !== 'cross' && B.render !== 'shape') { dist = Math.max(0.5, t - 0.3); break; }
      }
      this.camDist = this.camDist === undefined ? dist : dist < this.camDist ? dist : this.camDist + (dist - this.camDist) * Math.min(1, dt * 4);
      this.camera.position.set(eye.x + d.x * s * this.camDist, eye.y + d.y * s * this.camDist + 0.15, eye.z + d.z * s * this.camDist);
      if (this.view === 2) this.camera.rotation.set(-p.pitch, p.yaw + Math.PI, 0);
    }
    this.ui.updateCompass(this);
    if (!this.avatar) this.avatar = new Avatar(this.scene);
    if (this.muerte) camaraMuerte(this);
    this.avatar.update(dt, this, ((!!this.view || !!this.foto) && p.alive && !this.cine) || !!this.muerte);
    camaraFoto(this);
    if (this.cine) {
      const c = this.cine;
      c.t = Math.max(0, Math.min(1, c.t + (dt / 0.5) * c.dir));
      const e = c.t < 0.5 ? 4 * c.t * c.t * c.t : 1 - Math.pow(-2 * c.t + 2, 3) / 2;
      this.camera.position.lerp(c.pos, e);
      this.camera.quaternion.slerp(c.quat, e);
      if (c.t <= 0 && c.dir < 0) this.cine = null;
    }
    SHADER_TIME.value = performance.now() / 1000;
    const targetFov = this.settings.fov + (this.tripOn ? Math.sin((this.clock || 0) * 1.1) * 9 : 0) + (p.sprinting ? 10 : 0) + (p.flying && p.sprinting ? 6 : 0) - (this.bowDraw ? Math.min(1, this.bowDraw.t) * 14 : 0)
      // velocidad: la avioneta, la ola del surf y el parapente abren un poquito la vista
      + (av ? Math.min(14, (av.v || 0) * 0.45) : 0) + (this.surf && this.surf.ola ? 8 : 0) + (this.parapente ? 4 : 0) + fovPlaneo(this);
    this.fovCurrent += (targetFov - this.fovCurrent) * Math.min(1, dt * 10);
    if (Math.abs(this.camera.fov - this.fovCurrent) > 0.01) { this.camera.fov = this.fovCurrent; this.camera.updateProjectionMatrix(); }

    // cielo, niebla y luz
    const W = this.weather;
    this.sky.velNubes = (this.tlK || 1) > 1.5 ? Math.min(45, this.tlK * 0.2) : 1;
    this.daylight = this.sky.update(this.time, this.camera, this.scene.fog, this.renderer, W ? W.overcast : 0, W ? W.flash : 0);
    const infra = this.dim === 'inframundo';
    this.sky.group.visible = !infra;
    this.sky.clouds.visible = !infra;
    if (this.dim === 'cielo' && W) { W.intensity = 0; W.type = 'clear'; W.rain.visible = false; W.snow.visible = false; }
    if (infra) {
      this.daylight = 1;
      if (W) { W.intensity = 0; W.type = 'clear'; W.rain.visible = false; W.snow.visible = false; this.audio.setRain(0, true, false); }
    }
    if (W && this.world && !this.paused && !infra && this.dim !== 'cielo') {
      this.coldT = (this.coldT || 0) - dt;
      if (this.coldT <= 0) {
        this.coldT = 1;
        const col = this.world.gen.column(Math.floor(eye.x), Math.floor(eye.z));
        this.cold = col.biome === 'snowy' || col.h > 100 || col.temp < -0.3;
        this.dry = col.biome === 'desert';
      }
      W.update(dt, this.camera, this.cold);
      // en el desierto no llueve (solo se nubla un poco)
      if (this.dry) { W.rain.visible = false; W.snow.visible = false; } else { W.rain.visible = !this.cold; W.snow.visible = this.cold; }
      const covered = this.env && this.env.cave > 0.3;
      this.audio.setRain(this.dry ? 0 : W.intensity * tickZinc(this, dt), covered, this.cold); // v12.3.0: bajo zinc, más bajito y repicando
      this.dripT = (this.dripT || 0) - dt;
      if (this.dripT <= 0 && !this.dry && !this.cold) { this.dripT = 0.12; this.audio.rainDrip(W.intensity); }
    }
    if (this.world) this.world.setDaylight(this.daylight);
    this.updateLightColor(infra);
    const R = this.world ? this.world.renderDistance : 6;
    const headId = this.world ? this.world.getBlock(Math.floor(eye.x), Math.floor(eye.y), Math.floor(eye.z)) : AIR;
    const underwater = FLUID[headId] === 1;
    this.ui.setInLava(FLUID[headId] === 2 || this.player.body.inLava);
    if (underwater) {
      this.scene.fog.color.setRGB(0.08, 0.18, 0.45).multiplyScalar(Math.max(0.3, this.daylight));
      this.scene.fog.near = 0.5; this.scene.fog.far = this.player.effects.buceo ? 34 : 14;
      this.renderer.setClearColor(this.scene.fog.color);
    } else if (this.far && this.far.distance > 0) {
      // con horizonte lejano la niebla se corre hasta el borde del terreno lejano
      const rain = this.weather ? this.weather.intensity : 0;
      // v12.0.1: desde «Medio», más nítido de cerca y desvanecido solo en el último tramo (PLAN_HORIZONTE 3.4); en Bajo, como antes
      const fina = this.settings.calidad && this.settings.calidad !== 'bajo';
      this.scene.fog.near = Math.max(R * 16 * (1 - rain * 0.5), this.far.alcance() * (fina ? 0.6 : 0.35) * (1 - rain * 0.7));
      this.scene.fog.far = this.far.alcance() * (fina ? 0.98 : 0.97) * (1 - rain * 0.55);
    } else {
      this.scene.fog.near = R * 16 * 0.55;
      this.scene.fog.far = R * 16 * 0.95;
    }
    if (infra && !underwater) {
      // humo rojizo de la caverna
      this.scene.fog.color.setRGB(0.3, 0.08, 0.03);
      this.scene.fog.near = 6; this.scene.fog.far = 78;
      this.renderer.setClearColor(this.scene.fog.color);
    }
    // v13.2.0: bajo tierra la niebla se acorta y se oscurece con la profundidad (suave: sigue a this.profK)
    if (!underwater && !infra && this.profK > 0) {
      const nb = nieblaProf(this.scene.fog.near, this.scene.fog.far, this.profK);
      this.scene.fog.near = nb.near; this.scene.fog.far = nb.far;
      this.scene.fog.color.multiplyScalar(1 - 0.92 * this.profK);
      this.renderer.setClearColor(this.scene.fog.color);
    }
    this.updateBeacons(dt);
    // neblina del bosque nuboso
    const wantMist = underwater ? 0 : Math.max(this.env && this.env.biome === 'nuboso' ? 1 : 0, nieblaAmanecer(this));
    this.mist = (this.mist || 0) + (wantMist - (this.mist || 0)) * Math.min(1, dt * 0.4);
    if (this.mist > 0.01 && !underwater) {
      this.scene.fog.near *= 1 - this.mist * 0.9;
      this.scene.fog.far *= 1 - this.mist * 0.78;
      this.mistColor = this.mistColor || new THREE.Color();
      this.mistColor.setRGB(0.78, 0.8, 0.83).multiplyScalar(Math.max(0.2, this.daylight));
      this.scene.fog.color.lerp(this.mistColor, this.mist * 0.7);
    }
    // la neblina del Cerro de la Muerte: casi no se ve nada
    const nm = neblinaMuerteK(this);
    if (nm > 0 && !underwater) {
      this.scene.fog.near = Math.min(this.scene.fog.near, 1 + (1 - nm) * 20);
      this.scene.fog.far = Math.min(this.scene.fog.far, 9 + (1 - nm) * 80);
      this.nmColor = this.nmColor || new THREE.Color();
      this.nmColor.setRGB(0.62, 0.65, 0.7).multiplyScalar(Math.max(0.25, this.daylight));
      this.scene.fog.color.lerp(this.nmColor, nm * 0.85);
    }
    // v12.0.1: «muy lejos» (más de 1 536) dibuja el horizonte en una pasada aparte con su propia cámara (near 60), así la
    // profundidad lejana no baila; lo cercano queda con camera.far = 1 200
    const dosPasadas = !!(this.far && this.far.alcance() > 1536 && this.far.group.visible);
    const wantFar = dosPasadas ? 1200 : Math.max(1200, (this.far ? this.far.alcance() : 0) * 1.35);
    if (this.camera.far !== wantFar) { this.camera.far = wantFar; this.camera.updateProjectionMatrix(); }
    if (this.far) {
      this.far.setCalidad(this.settings.calidad && this.settings.calidad !== 'bajo');
      this.far.tick(dt);
      // bajo tierra el horizonte no se ve (y no hace falta dibujarlo)
      this.far.group.visible = this.far.distance > 0 && !(this.env && this.env.cave > 0.6);
      this.farT = (this.farT || 0) - dt;
      if (this.farT <= 0) { this.farT = 0.2; this.far.update(this.player.body.pos.x, this.player.body.pos.z, Math.max(0, this.world.shownRadius(this.player.body.pos.x, this.player.body.pos.z, R)), this.daylight); }
      else this.far.uniforms.uDaylight.value = this.daylight;
    }
    this.ui.setUnderwater(underwater);
    // v12.0.0 «Hora dorada»: las banderas de calidad (recompila solo si cambian) y las uniformes de la atmósfera
    // v12.5.2: la calidad efectiva (la que bajó el regulador vive en memoria; la guardada es la del jugador)
    const sEf = this.calidadRegulada ? { ...this.settings, calidad: this.calidadRegulada } : this.settings;
    let fx = flagsDe(sEf);
    // v12.8.0 (PLAN_GRAFICOS_2.md §5): con «bloom» (Alto y Ultra) el cuadro va a un render target y postfx.js le suma el brillo.
    // v12.8.6 (punto 3): sin HalfFloat no hay bloom NI realce de emisores (POST_HDR): van los halos. flagsDe da un objeto compartido: se copia
    if (fx.bloom) { this.postfx ||= new PostFX(this.renderer); if (!this.postfx.hdr) fx = { ...fx, bloom: false, halos: true }; }
    aplicarDefines([this.world && this.world.opaqueMat, this.world && this.world.waterMat, this.far && this.far.mat, this.sky.domeMat, this.sky.cloudMat], fx);
    if (fx.tono || fx.niebla || fx.cielo) actualizarAtmosfera(this, dt, fx, underwater);
    aplicarNitidez(this.renderer, fx.nitidez ? ANISO[sEf.calidad] || 4 : 0); // v12.5.0

    const consultaGPU = empezarCuadro(this.renderer, !!this.settings.perf); // v12.5.0: el medidor de GPU (v12.5.2: solo con el panel)
    const post = !!fx.bloom; // v12.8.4 (punto 5): con 8 bits nada pasa de 1 y el bloom sería un resplandor parejo (v12.8.6: ya resuelto arriba)
    if (post) { const sz = this.renderer.getDrawingBufferSize(this.tmpV2 ||= new THREE.Vector2()); this.postfx.preparar(sz.x, sz.y, sEf.calidad === 'ultra' ? 5 : 4); }
    else if (this.postfx && this.postfx.escena) this.postfx.liberar(); // en Bajo y Medio no queda memoria ocupada
    cuadroHalos(this, dt, !!fx.halos && !post); // v12.8.2 (§5.5): los halos baratos de Medio (con bloom no hacen falta; sin HalfFloat, fx.halos)
    try {
    if (post) this.postfx.empezar(); else this.renderer.clear();
    if (dosPasadas) {
      // 1) cielo y horizonte con una cámara de near 60; 2) se borra la profundidad; 3) lo cercano encima
      this.farScene ||= new THREE.Scene();
      this.farCam ||= new THREE.PerspectiveCamera();
      this.farScene.fog = this.scene.fog;
      if (this.far.group.parent !== this.farScene) this.farScene.add(this.far.group);
      if (this.sky.group.parent !== this.farScene) this.farScene.add(this.sky.group);
      const fc = this.farCam;
      fc.position.copy(this.camera.position); fc.quaternion.copy(this.camera.quaternion);
      if (fc.fov !== this.camera.fov || fc.aspect !== this.camera.aspect || fc.far !== this.far.alcance() * 1.35) {
        fc.fov = this.camera.fov; fc.aspect = this.camera.aspect; fc.near = 60; fc.far = this.far.alcance() * 1.35; fc.updateProjectionMatrix();
      }
      fc.updateMatrixWorld();
      this.renderer.render(this.farScene, fc);
      this.renderer.clearDepth();
    } else if (this.farScene && this.sky.group.parent === this.farScene) {
      this.scene.add(this.sky.group);
      if (this.far) this.scene.add(this.far.group);
    }
    this.renderer.render(this.scene, this.camera);
    if (post) this.postfx.terminar(sEf.calidad === 'ultra' ? 1.3 : 1.0, Math.min(1, Math.max(0, this.daylight || 0))); // el bloom y el vuelco a pantalla (la mano va después, sin bloom)
    guardarSiToca(this);
    if (!this.hudHidden && this.player.alive && !this.cine && !this.view) {
      // luz de la mano: aproximada por si estás bajo techo
      const light = this.world ? this.entities.lightAt(eye.x, eye.y, eye.z) : 1;
      this.updateHand(dt, Math.max(0.2, light));
      updateShieldHand(this, dt, Math.max(0.2, light));
      this.renderer.clearDepth();
      this.renderer.render(this.handScene, this.handCamera);
    }
    } finally { terminarCuadro(consultaGPU); } // v12.5.2: si un render lanza, la consulta no queda abierta
  }

  // Muestrea el entorno (cueva, agua, árboles, altura) y se lo pasa al audio.
  updateAmbience(dt) {
    const p = this.player;
    const e = p.eye;
    this.audio.setListener(e.x, e.y, e.z, p.yaw);
    this.envT = (this.envT || 0) - dt;
    if (this.envT <= 0 || !this.env) {
      this.envT = 0.5;
      const w = this.world;
      const ex = Math.floor(e.x), ey = Math.floor(e.y), ez = Math.floor(e.z);
      // cueva: cuántas de 9 columnas tienen techo encima
      let covered = 0, water = 0, leaves = 0;
      for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
        for (let y = ey + 1; y < Math.min(HEIGHT, ey + 40); y++) {
          if (BLOCKS[w.getBlock(ex + dx * 4, y, ez + dz * 4)].opaque) { covered++; break; }
        }
      }
      for (let i = 0; i < 40; i++) {
        const id = w.getBlock(ex + Math.floor(Math.random() * 17) - 8, ey + Math.floor(Math.random() * 9) - 5, ez + Math.floor(Math.random() * 17) - 8);
        if (FLUID[id] === 1) water++;
        else if (BLOCKS[id].leafy) leaves++;
      }
      const deep = Math.max(0, Math.min(1, (60 - e.y) / 12));
      // bioma y cercanía del mar (para el ambiente sonoro)
      const col = w.gen.column(ex, ez);
      let ocean = 0;
      for (const [dx, dz] of [[0, 0], [16, 0], [-16, 0], [0, 16], [0, -16]]) { const b = w.gen.column(ex + dx, ez + dz).biome; if (b === 'ocean' || b === 'beach') ocean += 0.25; }
      let termal = 0;
      for (let i = 0; i < 24; i++) if (w.getBlock(ex + Math.floor(Math.random() * 13) - 6, ey + Math.floor(Math.random() * 5) - 3, ez + Math.floor(Math.random() * 13) - 6) === K.travertino) termal = 1;
      let hive = 0;
      for (let i = 0; i < 30; i++) if (BLOCKS[w.getBlock(ex + Math.floor(Math.random() * 13) - 6, ey + Math.floor(Math.random() * 7) - 3, ez + Math.floor(Math.random() * 13) - 6)].hive) hive = 1;
      this.env = { cave: Math.min(1, (covered / 9) * 0.7 + deep * (covered > 4 ? 0.5 : 0)), water: Math.min(1, water / 6), trees: Math.min(1, leaves / 3 + 0.2), biome: col.biome, ocean: Math.min(1, ocean), hive, termal, pueblo: this.envPueblo || 0, infra: this.dim === 'inframundo' ? 1 : 0, volcan: this.envVolcan || 0 };
    }
    const headWater = FLUID[this.world.getBlock(Math.floor(e.x), Math.floor(e.y), Math.floor(e.z))] === 1;
    if (headWater !== this.wasUnderwater) {
      if (this.ready && headWater && (this.clock || 0) - (this.chapuzonT ?? -9) > 1) this.audio.play('splash', { pos: { x: e.x, y: e.y, z: e.z }, vol: 0.6 });
      if (this.ready && !headWater) this.ui.gotas();
      this.wasUnderwater = headWater;
    }
    this.audio.ambience(dt, { ...this.env, sala: this.salaCueva ?? 0.5, y: e.y, daylight: this.daylight, underwater: headWater, rain: this.weather ? this.weather.intensity : 0 });
    // música de marimba (o arpa de noche y en cuevas) de vez en cuando
    this.music = this.music || new Music(this.audio);
    if (!this.musRegT || (this.musRegT -= dt) <= 0) { this.musRegT = 3; const pp = this.player.body.pos; this.musRegion = this.dim === 'tierra' ? regionAt(this.world.gen, pp.x, pp.z) : null; }
    this.music.update(dt, { rey: this.reyFase || 0, pelea: !!(this.asedio || this.nocheLarga || this.apuro || this.ceniza || this.grieta || this.ventanilla), volume: this.settings.music ?? 0.5, daylight: this.daylight, cave: this.env ? this.env.cave : 0, underwater: headWater, region: this.musRegion });
  }

  // Partículas que le dan vida al lugar
  ambientParticles(dt) {
    this.ambT = (this.ambT || 0) - dt;
    if (this.ambT > 0) return;
    this.ambT = 0.1;
    const w = this.world, P = this.particles, e = this.player.eye;
    const rnd = (r) => (Math.random() - 0.5) * 2 * r;
    if (this.dim === 'inframundo') {
      // brasas que suben y ceniza que cae
      for (let k = 0; k < 6; k++) P.spawn(e.x + rnd(12), e.y + rnd(5), e.z + rnd(12), [1, 0.4 + Math.random() * 0.3, 0.1], rnd(0.3), 0.6 + Math.random(), rnd(0.3), 2.5, -0.3, true);
      for (let k = 0; k < 4; k++) P.spawn(e.x + rnd(12), e.y + 6, e.z + rnd(12), [0.35, 0.33, 0.32], rnd(0.3), -0.4, rnd(0.3), 5, 0.3);
      return;
    }
    // vapor de las aguas termales
    if (this.env && this.env.termal) {
      for (let k = 0; k < 6; k++) {
        const x = Math.floor(e.x + (Math.random() - 0.5) * 16), z = Math.floor(e.z + (Math.random() - 0.5) * 16);
        for (let y = Math.floor(e.y) + 4; y > e.y - 8; y--) {
          const id = w.getBlock(x, y, z);
          if (id === AIR) continue;
          if (FLUID[id] === 1) P.spawn(x + Math.random(), y + 1, z + Math.random(), [0.92, 0.94, 0.96], (Math.random() - 0.5) * 0.3, 0.8 + Math.random() * 0.6, (Math.random() - 0.5) * 0.3, 2.2, -0.4);
          break;
        }
      }
    }
    // hojas que caen de los árboles
    for (let i = 0; i < 8; i++) {
      const x = Math.floor(e.x + rnd(10)), y = Math.floor(e.y + rnd(3) + 4), z = Math.floor(e.z + rnd(10));
      const id = w.getBlock(x, y, z);
      if (BLOCKS[id].leafy && w.getBlock(x, y - 1, z) === AIR && Math.random() < 0.35) {
        const c = id === K.birch_leaves ? [0.55, 0.7, 0.3] : id === K.jungle_leaves ? [0.2, 0.45, 0.15] : Math.random() < 0.15 ? [0.75, 0.6, 0.2] : [0.3, 0.55, 0.2];
        P.spawn(x + Math.random(), y - 0.05, z + Math.random(), c, rnd(0.6) + 0.4, -0.2, rnd(0.6), 4.5, 0.6);
      }
    }
    const night = this.daylight < 0.3;
    const raining = this.weather && this.weather.intensity > 0.3;
    // luciérnagas de noche en el pasto
    if (night && !raining && (!this.env || this.env.cave < 0.3)) {
      for (let i = 0; i < 3; i++) {
        const x = Math.floor(e.x + rnd(14)), z = Math.floor(e.z + rnd(14));
        let y = Math.floor(e.y) + 4;
        while (y > e.y - 8 && w.getBlock(x, y, z) === AIR) y--;
        const id = w.getBlock(x, y, z);
        if ((id === K.tall_grass || id === K.grass || BLOCKS[id].leafy || id === K.flower_red || id === K.flower_yellow) && Math.random() < 0.5) {
          P.spawn(x + Math.random(), y + 1 + Math.random() * 1.5, z + Math.random(), [0.85, 1, 0.35], rnd(0.4), rnd(0.25), rnd(0.4), 2.5 + Math.random() * 2, 0, true);
        }
      }
    }
    cuadroCueva(this, dt); // v13.1.2: goteo, agua corriendo, eco por sala y el brillo por región (cuevavida.js)
    // polvo flotando en las cuevas
    if (this.env && this.env.cave > 0.6) {
      for (let i = 0; i < 2; i++) {
        const x = e.x + rnd(5), y = e.y + rnd(2.5), z = e.z + rnd(5);
        if (w.getBlock(Math.floor(x), Math.floor(y), Math.floor(z)) === AIR) P.spawn(x, y, z, [0.55, 0.52, 0.48], rnd(0.1), rnd(0.05), rnd(0.1), 5, 0);
      }
    }
  }

  // Logros: un aviso dorado la primera vez
  achieve(key, text) {
    if (!this.achievements || this.achievements.has(key)) return;
    this.achievements.add(key);
    anotar(this, `Logro: ${text}`, '🏆');
    (this.meta.achTexts = this.meta.achTexts || {})[key] = text;
    this.ui.achievement(text, achIcon(key), this.achievements.size);
    this.audio.play('craft', { ui: true, vol: 0.5, pitch: 1.2 });
    if (this.red && this.red.aviso && key.startsWith('vencer_')) this.red.aviso(`🏆 Logro del mundo: ${text}`); // v12.14.1: las demás personas lo ven
  }

  // Potrero: las vacas dejan boñigas, en las boñigas salen hongos (más si llueve) y el hongo da visiones
  tickPotrero(w, p) {
    if (this.dim !== 'tierra') return;
    for (const m of this.entities.mobs) {
      if (m.type !== 'vaca' || m.dead || m.frozen || Math.random() > 1 / 200) continue;
      const x = Math.floor(m.body.pos.x), y = Math.floor(m.body.pos.y), z = Math.floor(m.body.pos.z);
      if (Math.hypot(x - p.x, z - p.z) > 48) continue;
      if (w.getBlock(x, y, z) === AIR && [K.grass, K.dirt].includes(w.getBlock(x, y - 1, z))) { w.setBlock(x, y, z, K.bonita); this.audio.play('step.gravel', { pos: { x, y, z }, vol: 0.4, pitch: 0.6 }); }
    }
    const rain = this.weather && this.weather.intensity > 0.3;
    for (let k = 0; k < 24; k++) {
      const x = Math.floor(p.x + (Math.random() - 0.5) * 40), z = Math.floor(p.z + (Math.random() - 0.5) * 40);
      for (let y = Math.floor(p.y) + 6; y > p.y - 8; y--) {
        const b = w.getBlock(x, y, z);
        if (b === AIR) continue;
        if (b === K.bonita && Math.random() < (rain ? 0.08 : 0.025)) w.setBlock(x, y, z, K.bonita_hongos);
        break;
      }
    }
    const e = this.player.effects;
    if (e.viaje && Math.random() < 0.1) {
      const L = ['🐄 La vaca le guiñó el ojo y le dijo «pura vida»…', '🌳 Ese árbol se está riendo de usted.', '🎶 Se oye una marimba que nadie está tocando.', '🦋 Las mariposas tienen cara de Don Chepe.', '🌈 El cielo sabe a cas.', '🐕 El Cadejos está bailando cumbia allá atrás.', '⛪ Las campanas suenan en colores.', '🍌 Un banano le está explicando la vida.'];
      this.ui.toast(L[Math.floor(Math.random() * L.length)], 2600, { cat: 'ambiente', clave: 'viaje' });
      // y aparecen colores flotando alrededor
      for (let i = 0; i < 12; i++) this.particles.spawn(p.x + (Math.random() - 0.5) * 8, p.y + 1 + Math.random() * 3, p.z + (Math.random() - 0.5) * 8, [Math.random(), Math.random(), Math.random()], (Math.random() - 0.5), 0.3, (Math.random() - 0.5), 3, -0.2, true);
    }
  }

  // Efectos sobre el jugador: veneno, calma, suerte…
  addEffect(name, seconds, fuente = null) {
    const e = this.player.effects;
    if (name === 'veneno' && e.antiveneno) return; // el antídoto del Tata
    if ((name === 'enredado' || (name === 'veneno' && fuente === 'arana')) && manaJefe(this, 'seda_reina')) seconds *= 0.5; // v12.16.5: «Seda de la Reina»
    if (name === 'enredado' && this.inventory.armor[1] && ITEMS[this.inventory.armor[1].id] && ITEMS[this.inventory.armor[1].id].antiTela) return; // la seda no se enreda en la seda
    e[name] = Math.max(e[name] || 0, seconds);
  }

  tickEffects(dt) {
    const e = this.player.effects;
    // aguas termales: bañarse cura
    if (this.env && this.env.termal && this.player.body.inWater) {
      if (!e.termal) { this.ui.toast('♨ ¡Qué rico! Las aguas termales curan', 1800); this.achieve('termales', 'Baño en aguas termales'); }
      this.addEffect('termal', 4);
    }
    if (e.termal) {
      this.termalT = (this.termalT || 0) - dt;
      if (this.termalT <= 0) { this.termalT = 1.5; if (this.player.health < this.player.maxHealth) this.player.health = Math.min(this.player.maxHealth, this.player.health + 1); }
    }
    // estaciones: verano (seca) e invierno (lluviosa); v12.3.0: 30 días cada una (temporadas.js)
    const season = temporadaDe(this.day);
    if (season !== this.season) {
      alCambiarTemporada(this, this.season, season);
      this.season = season;
    }
    for (const k of Object.keys(e)) {
      if (PERMANENTES.has(k)) continue; // las garrapatas y el tórsalo no se van solos
      e[k] -= dt;
      if (e[k] <= 0) delete e[k];
    }
    if (e.veneno) {
      this.poisonT = (this.poisonT || 0) - dt;
      if (this.poisonT <= 0) { this.poisonT = 1.5; if (this.player.health > 1 && !(manaJefe(this, 'panza_sapo') && Math.random() < 0.3)) this.damagePlayer(1, null, null, 'Veneno', true); } // v12.16.5: «Panza de sapo»
    }
    // mascotas pendientes de aparecer (cuando su chunk esté cargado)
    if (this.pendingPets && this.pendingPets.length) {
      this.pendingPets = this.pendingPets.filter((pet) => {
        if (!this.world.readyAt(pet.x, pet.z)) return true;
        const m = this.entities.spawnMob(pet.type, pet.x, pet.y + 0.2, pet.z);
        m.tamed = true; m.data = pet.data || {};
        return false;
      });
    }
    this.ui.renderEffects(e);
  }

  /** v13.2.3: ¿está cargado el terreno bajo el jugador (su columna y las de su alrededor)? Si no, se queda retenido arriba («Cargando terreno…»), nunca cae. */
  terrenoListo(pos) { const w = this.world, r = 0.45; return w.isLoaded(pos.x, pos.z) && w.isLoaded(pos.x - r, pos.z - r) && w.isLoaded(pos.x + r, pos.z - r) && w.isLoaded(pos.x - r, pos.z + r) && w.isLoaded(pos.x + r, pos.z + r); }
  debugText() {
    if (!this.world) return '';
    const p = this.player.body.pos;
    const col = this.world.gen.column(Math.floor(p.x), Math.floor(p.z));
    const t = this.target;
    const hours = Math.floor(((this.time * 24) + 6) % 24);
    const mins = Math.floor(((this.time * 24 * 60) + 360) % 60);
    return [
      `NanoBlocks v${GAME_VERSION}   ${this.fps} fps`,
      `XYZ: ${p.x.toFixed(2)} / ${p.y.toFixed(2)} / ${p.z.toFixed(2)}`,
      `Chunk: ${Math.floor(p.x / 16)}, ${Math.floor(p.z / 16)}   Cargados: ${this.world.chunks.size}`,
      `Bioma: ${BIOMES[col.biome]}   Altura terreno: ${col.h}`,
      `Día ${this.day}  ${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}   Luz: ${this.daylight.toFixed(2)}`,
      `Mirando: ${t ? `${BLOCKS[t.id].name} (${t.x}, ${t.y}, ${t.z})` : '—'}`,
      `Criaturas: ${this.entities.mobs.length}   Modo: ${this.mode === 'creative' ? 'Creativo' : 'Supervivencia'}${this.player.flying ? ' (volando)' : ''}`,
      `Semilla: ${this.meta.seedText || this.meta.seed}`,
      `Sólido bajo los pies: ${SOLID[this.player.body.blockUnderFeet(this.world)] ? 'sí' : 'no'}`,
    ].join('\n');
  }
}

// v12.4.9; v12.4.13; v12.5.2: de qué jefe es un golpe. Por el atacante que pasa golpes.js (g.atacante) o, si no lo hay,
// por el nombre en el aviso, sin mayúsculas, quitando el apodo después de la coma y con los alias de la tabla. Mira todos los jefes
// a menos de 40 bloques (antes solo el primero). La lista se arma una vez por medio segundo
function jefeDelGolpe(g, cause) {
  const ck = g.clock || 0;
  if (!g.jefeCerca || !g.jefeCerca.L || ck - g.jefeCerca.t > 0.5) {
    const p = g.player.body.pos, L = [];
    for (const m of g.entities.mobs) {
      const B = JEFES_BALANCE[m.type];
      if (!B || m.dead || m.dying || Math.hypot(m.body.pos.x - p.x, m.body.pos.z - p.z) > 40) continue;
      const corto = nombreCorto(m.kind.name);
      const nombres = [corto, corto.split(',')[0], ...(B.alias || [])].map((n) => n.toLowerCase().trim()).filter((n) => n.length >= 4);
      L.push({ m, dano: B.dano, nombres });
    }
    g.jefeCerca = { t: ck, L };
  }
  const L = g.jefeCerca.L;
  if (!L.length) return null;
  // v12.5.2 (duodécima revisión): si se sabe quién pega (golpes.js), es ese y nada más: una Sombra pegada al jefe ya no hereda su
  // presión. Sin atacante (rayos, veneno, embestidas y saltos que llaman directo) se mira el nombre o el alias en el aviso. El
  // origen del golpe ya no cuenta: tomaba por el jefe a los secuaces, las explosiones y los proyectiles que caían a su lado
  if (g.atacante) return L.find((J) => J.m === g.atacante) || null;
  const c = String(cause || '').toLowerCase();
  return L.find((J) => J.nombres.some((n) => c.includes(n))) || null;
}

// v12.7.0: ¿hay agua a 3 bloques? (para la lombriz)
function aguaCerca(w, x, y, z) { for (let dx = -3; dx <= 3; dx++) for (let dz = -3; dz <= 3; dz++) for (let dy = -1; dy <= 1; dy++) if (FLUID[w.getBlock(x + dx, y + dy, z + dz)] === 1) return true; return false; }
