// Bestiario: cada criatura que uno ve de cerca queda anotada, con su retrato (sacado del modelo 3D) y sus datos.
import * as THREE from 'three';
import { disposeModel } from './models.js';
import { debilidadTexto } from './armas3.js';

const PELIGROSOS = new Set(['jaguar', 'cocodrilo', 'terciopelo', 'coyote', 'tiburon', 'vampiro', 'zancudo', 'saino', 'cuche_monte', 'becquer', 'mico_malo']);
const FUERA = new Set(['vecino', 'bote', 'carro', 'bus', 'bola', 'pez', 'muneco']);
const DESC = {
  danta: 'El mamífero terrestre más grande de Costa Rica. Pacífica; con fruta se hace su compañera.',
  sombra: 'Sale de noche y en las cuevas. No le gusta la luz.', lapa: 'Lapa roja: grita fuerte y vuela en parejas.',
  mono: 'Mono congo: su aullido se oye a kilómetros.', murcielago: 'Vive en las cuevas y sale al anochecer.', vampiro: 'Muerde y chupa sangre. Le teme al ajo… dicen.',
  perezoso: 'Cuelga de los árboles y se mueve despacito. Su abrazo da calma.', cara_blanca: 'Mono cara blanca: curioso y ladrón de comida.',
  tucan: 'Pico enorme y colorido; come frutas.', quetzal: 'El ave más bella del bosque nuboso. Su pluma abre el cielo.',
  jaguar: 'El gran felino de la selva. Caza de noche y salta encima.', cocodrilo: 'Acecha en ríos y costas; muerde a quien nada cerca.',
  tortuga: 'Tortuga marina: de noche sale a la playa a desovar.', tortuguita: 'Recién nacida, corre hacia el mar.', colibri: 'Pequeñito y rapidísimo; visita las flores.',
  morfo: 'Mariposa de alas azul metálico.', terciopelo: 'Serpiente venenosa: pasar agachado cerca es más seguro.', pizote: 'Andan en manada y se comen las cosechas.',
  venado: 'Venado cola blanca de las llanuras.', armadillo: 'Se hace bolita cuando se asusta.', calzonuda: 'Rana de ojos rojos que sale de noche.',
  titi: 'Mono tití: el más pequeño, vive en el Pacífico sur.', tepezcuintle: 'Cazarlo está prohibido: multa del guardaparques.', iguana: 'Toma sol en la playa y en las piedras.',
  gallina: 'Pone huevos en la finca.', vaca: 'Da leche y deja boñigas donde salen hongos.', perro: 'Zaguate fiel: con carne se hace su amigo.', gato: 'Asusta al Duende y caza ratones.', caballo: 'Caballo criollo: se monta con silla.',
  cadejos: 'Perro negro de ojos de fuego que persigue a los trasnochadores.', cadejos_blanco: 'Cuida a la gente buena en el camino.', segua: 'Mujer hermosa que se vuelve yegua con cara de calavera.',
  padre: 'Un padre sin cabeza que asusta en los pueblos.', llorona: 'Llora por sus hijos a la orilla de los ríos.', carreta_sin_bueyes: 'Una carreta que anda sola por las calles de noche.',
  duende: 'Roba cosas y se esconde en el monte. Le teme a los gatos.', mona: 'Bruja que se vuelve mona y brinca de árbol en árbol.', viejo_monte: 'Protector del monte: se enoja con los cazadores.',
  delfin: 'Amigo de los marineros; acompaña los botes.', ballena: 'Ballena jorobada: llega al Pacífico a tener sus crías.', tiburon: 'Tiburón martillo: cuidado al nadar en mar abierto.',
  jefa_ventanilla: 'No atiende: despacha. Cuando le falte un timbre, quítese de donde está.',
  sombra_apagadora: 'No viene por uno: viene por la luz. Busca la antorcha más cercana y la apaga.',
  el_olvido: 'Todos los que nadie esperó, en uno solo. Cuando respira hondo, cúbrase con el escudo o se le va a olvidar lo que traía.',
  tulevieja: 'Espanto con sombrero enorme que vive en los ríos.', arpia: 'Jefa del cielo; trae la tormenta.', ceniciento: 'Criatura del inframundo hecha de ceniza.',
  zopilote_fuego: 'Zopilote en llamas del inframundo.', senor_arenal: 'El jefe del volcán. Vencerlo da el Corazón del Arenal.',
  zorro_pelon: 'Zarigüeya: si lo asustan se hace el muerto.', ardilla: 'Rápida; come maíz de la mano.', guatusa: 'Esconde semillas y así siembra el bosque.',
  coyote: 'Andan en manada de noche; le temen al fuego.', manati: 'Grandote y tranquilo, en peligro de extinción.', rana_vidrio: 'Tan transparente que se le ve el corazón latiendo. De noche, en el bosque nuboso.', tortuga_lora: 'Sale a desovar en masa en la arribada, cada 14 noches.', bruja_zarate: 'Bruja de Escazú: con un café da pócimas; si la atacan se vuelve lora.', mapache: 'De noche se acerca si uno anda comida en la mochila… y se la roba.', sapo: 'Sale a cantar en las noches de lluvia. Dicen que alguno es príncipe…', mono_congo_gigante: 'Jefe de la selva: aúlla, tira mangos y salta encima. Suelta su mechón.', mantarraya: 'Planea en grupo y salta fuera del agua dando vueltas.', pulpo: 'Vive en el fondo, cerca del coral; si lo asustan, tira tinta.', tiburon_ballena: 'El pez más grande del mar; manso, solo come plancton.', baula: 'La tortuga más grande del mundo; desova en nuestras playas.',
  sombra_ladrona: 'No pega casi nada: le roba algo de la mochila y sale corriendo. Si la alcanza, lo recupera.', sombra_grande: 'Lenta y con mucha vida, pega duro. Suelta esencia de sombra.',
  sombra_hondera: 'Tira piedras desde lejos con su honda y se aleja si uno se le acerca.', sombra_escudo: 'Ataja los golpes de frente: rodéela o péguele un golpe cargado.',
  rey_murcielago: 'Jefe de la Caverna del Rey: se tira en picada, chilla y en su segunda fase llama a sus murciélagos.',
  loro: 'Loro de frente roja: con semillas se vuelve su amigo, va en el hombro y repite frases.',
  sirena: 'Canta de noche en los ríos y encanta: agáchese para resistir. Con una flor se va contenta.',
  zancudo: 'Pica al anochecer cerca del agua. El repelente los aleja.', jaguar_viejo: 'Mini-jefe: un jaguar enorme y lleno de cicatrices.',
  centinela_cristal: 'Dueño de un Candil: de cristal e invulnerable mientras cuatro racimos lo alimentan. Rómpalos primero.', madre_esporal: 'Dueña de una Hongueada: suelta nubes de esporas que frenan y ahogan.', reina_agujas: 'Dueña de las Agujas: tiende telarañas y hace caer estalactitas.',
  cocodrilo_gigante: 'Mini-jefe: el famoso cocodrilo del Tárcoles.', terciopelo_reina: 'Mini-jefe: escupe veneno y llama a sus crías.',
  sombra_brincona: 'Se agacha con los ojos encendidos y brinca encima. Si falla, queda aturdida: ahí se le pega.',
  saino: 'Chancho de monte con collar claro. En manada; castañetean los dientes antes de cargar.', cuche_monte: 'El macho viejo que manda a los saínos. Su colmillo deja sangrando.',
  chupacabras: 'De noche en los potreros: va primero por las gallinas y las vacas. Pega y se aparta.', toro_guaco: 'El toro espanto de los llanos de Guanacaste. Embiste en línea recta; si choca, queda atontado.',
  chata: 'Los Chatas: asaltantes del camino, de noche. Atajan de frente con el machete y se llevan la plata.', mico_malo: 'Mono negro de ojos de fuego: tira piedras desde los árboles y roba.',
  coral: 'Anillos donde el rojo toca al amarillo: su mordida paraliza.', falsa_coral: 'Anillos donde el rojo toca al negro: se parece a la coral, pero no hace nada.',
  tamandua: 'El oso hormiguero de chaleco negro: anda olfateando el suelo y sacando la lengua.', martilla: 'Dorada, de ojos grandes. Sale de noche y se sube a los árboles.', pava: 'El pavo de monte, negro con la papada roja. Anda en el bosque nuboso.', chompipe: 'El pavo de la finca. Si uno se le arrima, se esponja, abre la cola y lo corretea a picotazos.', minero_fantasma: 'Don Eliseo, de Las Juntas: se quedó en la mina desde el 31 esperando la vagoneta de la salida.', vagoneta: 'Todavía corre sobre los rieles. Clic derecho para montarse.', anima_marinera: 'La tripulación de la goleta fantasma: vuela sobre el agua con el machete oxidado.', capitan_goleta: 'Tricornio, parche y farol verde. Si cae él, se hunde la goleta.', sapo_tata: 'Jefe del manglar. Infla el buche y saca la lengua en línea: muévase de lado. Al caer de un brinco retumba.', cascabel_rey: 'Jefa de los llanos secos. Suena el cascabel antes de tirarse; se entierra y sale debajo de uno: no se quede quieto.', cangrejo_rey: 'Jefe de la playa. Se encierra en la concha (solo el golpe fuerte con mazo la raja) y tira chorros que empujan.', ciempies_rey: 'Jefe de la montaña y las cuevas. Cierra un anillo alrededor de uno y se tira de frente: hay que salirse antes de que cierre.', reina_bananera: 'Jefa de la selva. Teje en abanico, tira crías, salta encima y a media vida suelta veneno alrededor. Se llama con la Ofrenda del monte.', escarabajo_hercules: 'Jefe del bosque. Embiste corrigiendo el rumbo: que se trabe el cuerno contra un árbol. A media vida pisotea: brinque.', sombra_acechadora: 'Casi no se ve: solo los ojos blancos. Le da la vuelta a uno y pega doble por la espalda. Se deja ver de cerca o cuando uno la mira de frente.', hongo_reventon: 'Parece un hongo cualquiera. Si uno se arrima, se infla y revienta en esporas que marean y envenenan. Mejor de lejos.', enjambre: 'Abejas africanizadas: persiguen y pican sin parar. El arma casi no sirve: al agua (y abajo), o humo de una antorcha en la mano o una fogata.', arana_bananera: 'Tira telaraña desde lejos (enreda) y después muerde con veneno. Ciérrele distancia o cúbrase.', escarabajo: 'Escarba el suelo y embiste. De frente aguanta casi todo: hágalo estrellarse contra un árbol y péguele atontado.', sapo_bufo: 'Si se le pega de cerca, escupe el veneno de las glándulas. De lejos, con la lanza o cubierto.', ciempies: 'Rapidísimo, en zigzag. Muerde con veneno y se va para volver por otro lado.', luz_mala: 'Una luz que flota en los llanos secos. Apagada no se le puede pegar; tira llamaradas cuando brilla.', cangrejo_tenaza: 'Ataja de frente con la tenaza y contesta con un pellizco. Con mazo, garrote o por el lado.', bocaraca: 'La víbora amarilla de pestañas: espera en las hojas y cae encima. Un casco la aguanta.', alacran: 'Pica si se le pone encima. A veces sale de un cofre viejo.', tarantula: 'Grande, peluda y fea. No hace nada.',
  aguamala: 'Flota a la deriva cerca de la orilla. Su toque deja ardor; la sábila lo calma.', raya: 'Enterrada en la arena del agua bajita. Arrastrando los pies (agachado) se espanta.',
  bailarin: 'Forastero elegante de las noches de fiesta. No le mire los pies.',
  anima: 'Pasan en procesión con velas, de noche cerca de los pueblos. Se acompañan; no se les pega.',
  cangrejo_ciego: 'Pálido y sin ojos: vive en las pozas y los ríos de las cuevas. Se guía por las vibraciones del agua.',
  grillo_cueva: 'Largas antenas y patas de brincar: canta en lo seco y oscuro de la cueva, donde no llega la luz.',
  escarabajo_calcita: 'Cubierto de costra de calcita: entre las estalagmitas parece una piedra más. Si uno se le arrima, se hace bolita.',
  puma: 'El león de montaña. Acecha por detrás; si uno lo mira de frente, no se tira.',
  becquer: 'Boa enorme: quieta parece un tronco caído. Agarra y aprieta; pegándole se zafa uno.', alma_en_pena: 'Sale en la neblina del Cerro de la Muerte si uno se queda quieto y sin fuego.',
};

// cada segundo: lo que anda cerca queda visto
export function tickBestiario(g) {
  const V = (g.meta.vistos = g.meta.vistos || {});
  const p = g.player.body.pos;
  for (const m of g.entities.mobs) {
    if (m.dead || V[m.type] || FUERA.has(m.type)) continue;
    if (Math.hypot(m.body.pos.x - p.x, m.body.pos.y - p.y, m.body.pos.z - p.z) > 14) continue;
    V[m.type] = g.day || 1;
    g.ui.toast(`📖 Bestiario: ${m.kind.name}`, 2000, 'registro');
    const n = Object.keys(V).length;
    if (n >= 10) g.achieve('bestiario10', 'Naturalista');
    if (n >= 30) g.achieve('bestiario30', 'Biólogo de campo');
  }
}

// retrato del modelo (se dibuja una vez por criatura y queda guardado)
const cache = new Map();
let rt = null;
export function retrato(g, type, kind) {
  if (cache.has(type)) return cache.get(type);
  let url = '';
  try {
    const model = kind.build();
    if (model.userData && model.userData.babyScale) model.scale.setScalar(1);
    model.rotation.y = -0.7;
    const scene = new THREE.Scene();
    scene.add(new THREE.AmbientLight(0xffffff, 1.4));
    const dl = new THREE.DirectionalLight(0xffffff, 1.4); dl.position.set(3, 5, 4); scene.add(dl);
    scene.add(model);
    model.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(model);
    const c = box.getCenter(new THREE.Vector3()), sz = box.getSize(new THREE.Vector3());
    const s = Math.max(sz.x, sz.y, sz.z) * 0.62 + 0.05;
    const cam = new THREE.OrthographicCamera(-s, s, s, -s, 0.1, 100);
    cam.position.set(c.x + 3, c.y + 2, c.z + 8); cam.lookAt(c);
    const S = 128;
    rt = rt || new THREE.WebGLRenderTarget(S, S);
    const r = g.renderer, prev = r.getRenderTarget(), cc = r.getClearColor(new THREE.Color()), ca = r.getClearAlpha();
    r.setRenderTarget(rt); r.setClearColor(0x000000, 0); r.clear(); r.render(scene, cam);
    const buf = new Uint8Array(S * S * 4);
    r.readRenderTargetPixels(rt, 0, 0, S, S, buf);
    r.setRenderTarget(prev); r.setClearColor(cc, ca);
    const cv = document.createElement('canvas'); cv.width = cv.height = S;
    const ctx = cv.getContext('2d'), img = ctx.createImageData(S, S);
    for (let y = 0; y < S; y++) img.data.set(buf.subarray((S - 1 - y) * S * 4, (S - y) * S * 4), y * S * 4);
    ctx.putImageData(img, 0, 0);
    disposeModel(model);
    url = cv.toDataURL();
  } catch { url = ''; }
  cache.set(type, url);
  return url;
}

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export function bestiarioHTML(g, MOB_TYPES) {
  const V = g.meta.vistos || {};
  const tipos = Object.keys(MOB_TYPES).filter((t) => !FUERA.has(t) && !MOB_TYPES[t].boat);
  const n = tipos.filter((t) => V[t]).length;
  const pct = Math.round((n / tipos.length) * 100);
  let h = `<div class="lib-prog"><b>${n} de ${tipos.length}</b> criaturas · ${pct} %<div class="lib-bar"><i style="width:${pct}%"></i></div></div><div class="lib-scroll"><div class="best-grid">`;
  for (const t of tipos.sort((a, b) => (V[b] ? 1 : 0) - (V[a] ? 1 : 0))) {
    const k = MOB_TYPES[t];
    if (!V[t]) { h += '<div class="best"><div class="best-img nada">?</div><div class="best-txt"><b>???</b><span>Todavía no la ha visto.</span></div></div>'; continue; }
    const img = retrato(g, t, k);
    const tag = k.boss ? '👑 Jefe' : k.legend ? '👻 Leyenda' : k.hostile || PELIGROSOS.has(t) ? '⚠️ Peligroso' : '🌿 Tranquilo';
    const datos = `❤ ${Math.round((k.health || 10) / 2)} corazones${k.attack ? ` · ⚔ ${k.attack}` : ''}`;
    h += `<div class="best"><div class="best-img">${img ? `<img src="${img}" alt="">` : '🐾'}</div><div class="best-txt"><b>${esc(k.name)}</b><small>${tag} · ${datos} · día ${V[t]}</small><span>${esc(DESC[t] || 'Una criatura de Costa Rica.')}</span>${(() => { const dt = debilidadTexto({ type: t, kind: k }); return dt ? `<em class="best-deb">⚔ ${esc(dt)}</em>` : ''; })()}</div></div>`;
  }
  return h + '</div></div>';
}
