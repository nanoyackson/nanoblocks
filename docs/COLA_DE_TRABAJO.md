# Cola de trabajo de la constructora

La escribe la orquestadora y es la **única fuente de verdad del orden**. Si un mensaje viejo dice otra cosa, manda este archivo.
- La constructora marca `[x]` lo que cierra, en el mismo commit de la versión.
- Las versiones se numeran en orden; si algo se mueve, se renumera.
- Al cerrar cada versión: reportar y seguir con la siguiente sin esperar respuesta, salvo donde diga **PAUSA**.
- **Regla de contexto (nanoyackson, 12-nov; el límite de 5 h se gastó en 10 min por contextos llenos):**
  - Una versión por conversación. Al cerrarla, todo lo que la próxima necesita queda en este archivo, en el CHANGELOG y en el árbol. Después la orquestadora limpia la sesión (`/clear`) y la retoma desde aquí.
  - Para leer, usar `grep` o leer por tramos (`offset`/`limit`), nunca el archivo entero si pasa de ~300 líneas.
  - La salida larga (build, lint, bots de economía y duelos) va a un subagente `vault-panel:verificador` o se corta con `| tail -30`. Al contexto solo entra el resultado.
  - La investigadora tampoco lee `src/` completo: busca con `grep` y lee los tramos que necesita.

Última actualización: 13-nov-2026 (orquestadora): PLAN FINAL.

## ★ PLAN FINAL (nanoyackson, 13-nov): terminar y jugar en línea con amistades. MANDA SOBRE TODO LO DE ABAJO
nanoyackson pasó al plan de $20: hay poco token semanal. **Solo se hace esta lista, en este orden, con versiones cortas.** Todo lo demás de este archivo queda **DESCARTADO por nanoyackson (13-nov): no se hace**. Eso incluye Gráficos 2 (rayos, reflejos, sombras, Ultra), las sobras de C2 y C5, pedir arte NUEVO a Codex (el que ya está generado SÍ se aplica, ver v12.8.9), las fases 2C+ de jefes y las revisiones de la investigadora salvo la de seguridad final. Lo que esté sin marcar abajo se ignora; ni se pregunta.
Base técnica: `docs/revisiones/ESPEC_PWA_MULTIJUGADOR.md` (leerla **por secciones**, con grep `^## `, no entera).
- [x] **v12.8.8** fase 2B-bis (en curso): cerrarla corta. Si un jefe no cuadra en 2 tandas, dejarlo «aceptable» y seguir.
- [x] *(hecho, tag v12.8.9)* **v12.8.9 CONECTAR EL ARTE YA HECHO** (nanoyackson, 13-nov: «el arte y lo que ya se había hecho sí quiero aplicarlo»): en `assets-src/chatgpt/` hay ~235 PNG generados y solo ~128 están en `public/sprites/arte/`. Con el pipeline de siempre, conectar TODO lo que falte (íconos, retratos de jefe, billetes y monedas, HUD de billetera, chanchito, texturas `tex-*`, logo, menú), con script y sin leer los PNG uno a uno; el juego debe funcionar igual si alguno falla. Si un PNG no tiene dónde usarse hoy, dejarlo copiado y anotarlo en `PEDIDOS_ARTE.md`. Versión corta: lint, build, `npm run revisar` y una mirada en tab-1 a inventario, retratos de jefe y billetera.
- [x] *(hecho, tag v12.9.0; íconos provisionales con la N del logo; P3 mínima: aviso en Ajustes y consejo en partida)* **v12.9.0 PWA** (P1+P2 juntas): manifest, íconos provisionales hechos con el arte que ya existe (sin pedir arte nuevo), SW generado, «Instalar» en Ajustes. P3 (aviso de versión nueva) en su forma mínima.
- [x] **v12.10.0 Costuras (F0, mínima)**: `saveWorld` en una transacción, `SAVE_FORMAT` con `meta.jugadores`, `src/red/validar.js` y `limites.js`, `damagePlayer(…, objetivo)`, `g.remotos`. `avisar()` solo donde el multijugador lo necesite, no los ~970 toasts.
- [x] *(hecho, tag v12.11.0; probado con 2 pestañas y relés Nostr reales)* **v12.11.0 Sala (F1)**: Trystero 0.27.0 exacto, en su propio trozo. Abrir sala con código, unirse, aprobar o expulsar, avatares, hora y clima del anfitrión, chat. STUN público; TURN opcional en Ajustes (cada anfitrión pega su clave de Open Relay si la conexión directa falla).
- [x] *(hecho, tag v12.12.0; probado con 2–3 pestañas y relés Nostr reales)* **v12.12.0 Construir juntos (F2)**: el invitado pone y rompe, el anfitrión valida y difunde, entrada tardía por trozos, reparación al volver, portales apagados.
- [x] *(hecho, tag v12.13.0; probado con 3 pestañas y relés Nostr reales; cofres, hornos y cocina cerrados a invitados, puertas y camas por la red quedan para después)* **v12.13.0 Fichas (F3)**: supervivencia real para los invitados, con su inventario guardado por el anfitrión; cofres, hornos, puertas y camas por la red.
- [x] *(v12.14.0 hecha, tag v12.14.0; v12.14.1 hecha, tag v12.14.1: jefes y leyendas en red, probada con 2 pestañas y relés Nostr reales)* **v12.14.0 Criaturas en red (F4)** + [x] **v12.14.1 Jefes y leyendas en red** (nanoyackson, 13-nov: «la idea es poder pasar el juego entero y con todo su contenido también en multiplayer»; se ANULA lo de «no nacen si hay invitados»). v12.14.0: criaturas que usan `atacar()`, simuladas por el anfitrión, apuntan a cualquier jugador (`damagePlayer(…, objetivo)`, `g.remotos`), botín a quien da el último golpe, sin fuego amigo. v12.14.1: TODOS los jefes y leyendas con invitados: simulados por el anfitrión, barra de jefe y retrato visibles para todos, fases y avisos difundidos, cualquier jugador puede pegarle y recibir daño; la campaña de la abuela sigue siendo del anfitrión, pero el progreso (jefe vencido) cuenta para el mundo y los invitados ven el logro; la recompensa del jefe llega a todos los que participaron.
- [x] *(hecho, tag v12.15.0; probado con 3 pestañas y relés Nostr reales; TURN no probado: sin credencial real)* **v12.15.0 Cierre**: cofre con cerrojo simple (lo mínimo de F5), dormir por votación, prueba de 2–3 personas con dos ventanas y la guía corta «Cómo jugar con amistades».
- [x] *(v12.15.1 C6 «Manos de maestro» hecha, tag v12.15.1: oficios, talleres, libros, mostrador; ver CHANGELOG para lo simplificado)* *(v12.15.2 C7 «Fuego de la tierra» hecha, tag v12.15.2: tubos de lava, Guardián, fumarolas, termales y equipo; observatorio/erupción/ceniza fértil quedaron SIN hacer, ver CHANGELOG)* **v12.15.1–v12.15.4 CONTENIDO C6–C8** (v12.15.3 C8-C «Comité de Caminos» hecha, tag v12.15.3; v12.15.4 C8-B «Fiesta patronal» hecha, tag v12.15.4: ES EL ÚLTIMO CONTENIDO, sigue v13.0.0) (nanoyackson, 13-nov: «sí, dale»; reabierto): una versión por conversación, en el orden de `docs/revisiones/DISENO_CONTENIDO_C5-C8.md` §0.5, **solo lo que ya está diseñado**, con el arte ya generado y sin pedir arte nuevo: v12.15.1 C6 Manos de maestro (oficios); v12.15.2 C7 Fuego de la tierra (volcán y cuevas); v12.15.3 C8-C Comité de Caminos; v12.15.4 C8-B Fiesta patronal. Reglas: lo que toque estado va por el anfitrión (nada nuevo en red salvo lo mínimo); si un punto choca con el multijugador, se deja desactivado en red y se anota. Si el presupuesto no alcanza, se corta aquí y se publica sin lo que falte: **v13.0.0 no espera**.
- [x] *(hecho, tag v12.15.5: M1, M2, M3 y la nota CSP de SEGURIDAD_FINAL_v13.md, con pruebas en revisar-cofres)* **v12.15.5 Seguridad final**
- [x] *(hecho, tag v12.15.6: C-1, C-2, C-4 (git grep), D1–D3, D5–D7, E1 y E4 del checklist; falta lo de nanoyackson A1–A6 y el alojamiento)* **v12.15.6 Preparar la publicación**
- [ ] **v12.16.x JEFE FINAL: EL REY** (nanoyackson, 14-nov: «sí, antes de publicar»; REABRE las fases de `docs/revisiones/DISENO_JEFES_Y_FINAL.md` que siguen abiertas = CHECKLIST_PUBLICAR B1–B7). Una fase por conversación, versiones cortas, en red desde el inicio (anfitrión simula, como v12.14.1): *(v12.16.0 HECHA, tag v12.16.0: avisos del tramo C; la vida/golpe quedan en `jefes-balance.js`)* *(v12.16.1 HECHA, tag v12.16.1: Arena del Rey, `reyfinal.js`; falta ver con 2 pestañas, la Jefa de Ventanilla y la posada de la Arpía jugadas)* *(v12.16.3 HECHA, tag v12.16.3: música `composeRey` y 5 cinemáticas en `reycine.js`, valen también para invitados; vida del Rey decidida: se queda; falta oírla/verla jugada por nanoyackson)* *(v12.16.4 HECHA, tag v12.16.4: arreglos de la deuda de `docs/revisiones/DEUDA_v12.16.md` puntos 1–5; punto 6 probado con 2 pestañas)* *(v12.16.5 HECHA, tag v12.16.5: gente y trama + remate y epílogo; `src/reyremate.js` (vecinos inmortales en la ladera con sus frases y ayudas, remate, premios una vez por persona, créditos con nombres reales), `src/manasjefe.js` (9 mañas de jefe), carta `zopilote`, ítems 1190/1191 y bloque 698, `/prueba final fase2|fase3|fase4|creditos|epilogo`; SAVE_FORMAT 9; probado en tab-1 con vencer al Rey dos veces; falta que nanoyackson revise los nombres y las frases listados en el CHANGELOG, y probar con 2 pestañas los créditos del invitado)* *(v12.16.2 HECHA, tag v12.16.2: cerebro del Rey con 4 fases; vida 2 900, presión 0.25, hábil 79 s y 8,0 recibido, promedio 86 s, torpe 240 s y pierde a veces; ver `BALANCE.md`; pendiente de nanoyackson: la banda 100–130 s por perfil)* v12.16.0 fase 2 restante (avisos y lecciones); v12.16.1 Arena del Rey (`reyfinal.js`); v12.16.2 cerebro del Rey (meta ~1 muerte de media con `bot-pelea.js`); v12.16.3 música y cámara; v12.16.4 HECHA (arreglos de red: invitado que explora nunca se expulsa, redondel completo bajo el tope, Arpía siempre avisa, CSP, guardia de fichas); v12.16.5 HECHA (gente, trama, remate y epílogo; la historia no exige vencer al Rey). Quedan: fase 8 (el arte de la pluma de oro; la foto no muestra la imagen, solo el marco de tablas) y fase 9 (BALANCE y cierre). Arte: solo el ya generado; lo que falte procedural y anotado. A5 propuesto por la orquestadora (14-nov; nanoyackson lo revisa al jugar): vida del Rey **1 000** (×escala de red de v12.14.1); la historia **no exige** al Rey (el epílogo lo cuenta si ocurrió); «épico» = **~1 muerte de media** con `habil`; nombres de mañas y textos de la gente los escribe la constructora en tono tico, «usted», neutro, y se listan en el CHANGELOG para que nanoyackson los cambie si quiere. Fase 8 (5 objetos únicos): procedural por ahora, anotados en `PEDIDOS_ARTE.md`.
- Decisiones de publicación (nanoyackson, 14-nov): **A1** el nombre de pila del autor se reemplaza por «nanoyackson» en CHANGELOG, docs y comentarios; **A3** alojamiento en **GitHub Pages** (subruta, rutas relativas). Falta **A2**: usuario de GitHub y correo noreply (se pide al llegar a v13.0.0).
- [ ] *(v13.0.0 HECHA, tag v13.0.0: copia pública armada en ../NanoBlocks-publico, sin push; falta H5 crear repo y empujar, H6 Pages) (v12.16.6 HECHA, tag v12.16.6: checklist al día, A1 aplicado, THIRD_PARTY cotejado, H1 y E6 en verde, CONTRIBUTING y plantilla de PR; sin publicar. Abierto: A2 usuario/correo noreply, A6 íconos definitivos, B8 prueba con una persona, D8 capturas, E5/E6 teléfono real, G3 README, G4 menú, H2 borrar docs de trabajo, H3–H6)* **v13.0.0 Publicar**: `docs/revisiones/CHECKLIST_PUBLICAR.md` (repo nuevo, un solo commit huérfano, MIT + CC BY 4.0, GitHub Pages). El usuario de GitHub lo da nanoyackson al final.
**Decisiones tomadas (orquestadora, 13-nov, con la licencia creativa de nanoyackson):**
- La campaña de la abuela es del anfitrión; los invitados ayudan.
- El botín es de quien da el último golpe, y no hay fuego amigo.
- Los portales quedan apagados en red.
- Los invitados nuevos arrancan con el equipo inicial.
- `appId` = `nanoblocks-nanoyackson`.
- La clave TURN la pone cada anfitrión, es opcional.
- Si hay dos pestañas con la misma llave, se rechaza la segunda.
- La vida de los jefes escala suave con la cantidad de jugadores presentes (+50 % por jugador extra, tope ×2,5), para que en grupo no sea un paseo.

## 0. URGENTE (nanoyackson, 12-nov) — antes que todo lo demás
- [x] *(hecho en v12.1.3)* v12.1.1: el parpadeo de TODOS los íconos y el tironcito al hacer clic con el inventario abierto (actualizar solo las casillas que cambian; sprites ya decodificados).
- [x] *(hecho en v12.1.3; `tools/revisar-fisica.mjs`)* v12.1.1: el viento metió al jugador bajo tierra, lo lanzó y lo sacó ~100 bloques arriba. El empuje va con colisión y velocidad topada; el desatascador sube al hueco libre más cercano. Revisar todos los empujones.
- [x] *(hecho en v12.1.1)* v12.1.2: corrección de la hora dorada (atardecer real, sin verse lavado, capturas a tres horas).
- [x] *(hecho en v12.1.2)* v12.1.3: conectar el lote 3 de arte (75) y los retratos de jefe.

- [x] *(hecho en v12.2.1, cb0e7e7)* v12.2.1 (nanoyackson, 12-nov): calidad MEDIO por defecto. Migrar el «bajo» que no se eligió a mano (marca `calidadElegida`) y avisar una vez si hay menos de ~40 fps sostenidos.
- [x] *(hecho en v12.4.5; `meta.minVersion` en v12.4.6)* v12.4.5 URGENTE, LIVIANO (orquestadora, 12-nov): partir el chunk index (699.93 de 700 kB): `manualChunks` con three aparte, sin ciclos, e import dinámico de los paneles que se abren a mano (final, libreta, bestiario, cuaderno, recetario, tienda). Meta: menos de 500 kB. Además `meta.minVersion`, para que un juego viejo no abra un mundo más nuevo. Probar en tab-1 que cada panel abre y que la consola no da errores de carga.
- [x] *(hecho en v12.4.8: fase 0 medida y fase 1 aplicada; falta probarla con una persona)* Jefes, cierre de la fase 0 (después de las sobras de C3 y C4): agregar a `tools/bot-pelea.js` los duelos y los equipos que faltan según `docs/revisiones/FASE0_CURVA_JEFES.md` §6, y los perfiles promedio y hábil. Correrlos y, con esos datos, aplicar la fase 1: armadura `min(0.80, puntos·0.03+dureza·0.02)`, rayos del Rey con armadura a medias y la tabla 5.2.
- [ ] v12.4.8: terminar la fase 1 de los jefes. Aplicar `fase1.py` (está en las notas de la constructora), volver a medir con `JEFES()`, corregir una vez, tag y docs. La tabla está en `docs/BALANCE.md` § Jefes.
- [x] *(hecho en v12.4.9)* v12.4.9 NOVENA REVISIÓN (orquestadora, 12-nov): los 6 puntos de «Para la constructora, en orden» de `docs/revisiones/REVISION_v12.4.4-v12.4.7.md`:
  - la mecedora en `meta`;
  - animales que empujan paredes;
  - la casita que tapa otras estructuras;
  - `.catch` en los `import()` y `tools/revisar-trozos.mjs`;
  - MIN_VERSION atado a los ids;
  - el capote contra la gotera y `calmaActiva`.
- [x] *(hecho en v12.4.13)* v12.4.13 DÉCIMA REVISIÓN, antes de C5-B (orquestadora, 12-nov), de `docs/revisiones/REVISION_v12.4.7-v12.4.9.md`:
  - 1: la presión no alcanza los golpes sin el nombre corto; Don Cornudo nunca recibe su ×1.4. Pasar el id del jefe en vez de buscarlo por texto.
  - 2: el Murciélago Rey cambia de fase con `health < 55`; que sea un % de la vida máxima.
  - 3: la armadura nueva empeora todos los mobs: medir noches y asedios con el bot y, si hace falta, separar la fórmula de los jefes de la del resto.
  - 4: los golpes que pasan la vida sin armadura.
  - 6: BALANCE.md con la fórmula nueva.
  - 8: la orilla donde ya bebe.
  - 9: presionJefe con varios jefes.
  - Volver a medir con `JEFES()` después de arreglar el 1 y el 2.
- [x] *(hecho en v12.5.1; falta sumar los perfiles «pescador» y «artesano» a bot-economia, con C5 y C6)* v12.5.1 UNDÉCIMA REVISIÓN, justo después de la v12.5.0 de gráficos y ANTES de C5-B (orquestadora, 12-nov): los 8 puntos de §9 de `docs/revisiones/REVISION_v12.4.10-v12.4.12.md`. Lo más urgente:
  - MIN_IDS ciego a los ids bajos: que la prueba mire TODOS los ids nuevos, no solo el máximo;
  - los encargos aceptados no se pueden entregar al día siguiente;
  - los mandados se pagan solos con el bus;
  - el pago mayor que el precio de compra;
  - el cupo por vecino, que no limita.
- [x] *(hecho en v12.5.2)* v12.5.2 DUODÉCIMA REVISIÓN, ANTES de C5-B (orquestadora, 12-nov): §5 de `docs/revisiones/REVISION_v12.4.13-v12.5.0.md`.
  - 3: el regulador guarda la calidad bajada en settings, y Ultra queda en Medio para siempre. Que lo bajado viva solo en memoria.
  - 1: el regulador oscila. Que recuerde la resolución que falló y espere más antes de volver a probarla.
  - 2: la meta es «lo mejor que se ha visto»: falla a 30 Hz con batería y con máquinas lentas parejas.
  - 4: jefeDelGolpe se la atribuye a secuaces, proyectiles y bichos comunes.
  - 5: los mipmaps oscurecen las plantas y el vidrio porque los píxeles transparentes son negros. Sangrar el color al borde.
  - 3 del medidor: que no quede encendido sin el panel.
- [x] *(hecho en v12.6.3; quedan para nanoyackson la mecánica del saqueador y los mundos viejos sin coral blanco)* v12.6.3 DECIMOTERCERA REVISIÓN (el agua salió como v12.6.2), justo después del agua «de material» (orquestadora, 12-nov): §7 de `docs/revisiones/REVISION_v12.5.2-v12.6.0.md`.
  - saqueadores: tope de capturas por noche;
  - fragmentos de coral infinitos moviendo el coral: guardar por coral y día, no por posición;
  - buzos que pagan en cualquier playa: que sea cerca del arrecife revivido y que cuente en el tope;
  - la estaca convierte nidos de decoración en nidos que pagan;
  - la firma de MIN_IDS no obliga a subir MIN_VERSION.
- [x] *(hecho en v12.6.4)* v12.6.4 «Agua que se nota», ANTES de C5-A (orquestadora, 12-nov): espuma, estela del sol, profundidad turquesa → azul oscuro y Fresnel más fuerte, con capturas en Bajo, en Alto y a la hora dorada; los nidos de la lora nacen a la quinta noche; el coral de los mundos viejos se resolvió con la opción (a): aviso en la ayuda.
- [x] *(hecho en v12.6.5; la costura con el lod queda suavizada, no borrada)* v12.6.5, ANTES de C5-A (orquestadora, 12-nov): `docs/revisiones/REVISION_v12.6.2-v12.6.3.md`, sus puntos 1 a 5, más el sol con nublado y los nidos huérfanos.
- [ ] Gráficos 2, intercalados con C5–C8 según `docs/revisiones/PLAN_GRAFICOS_2.md` §2:
  - [x] *(hecho en v12.5.0)* v12.5.0, después de la v12.4.13: medidor de GPU + `costo()`, regulador automático y nitidez de texturas.
  - [x] *(hecho en v12.6.2; el agua lejana del lod queda sin el efecto)* Agua «de material» en Medio y Alto, justo después de C5-B (tortugas y arrecife).
  - [x] *(hecho en v12.8.0)* Agua lejana del lod con reflejo de cielo (opción (b) de la costura, v12.6.5; decidido por la orquestadora). Va con PostFX + bloom.
  - [x] *(hecho en v12.8.0; faltan el SMAA, los halos de Medio y el hombro en el pase final)* PostFX base + bloom, después de C5-A.
  - [ ] Rayos de luz + reflejo barato y refracción, después de C6.
  - [ ] Sombras por mapa de alturas, después de C7.
  - [ ] Ultra, al final.
  - En cada entrega: capturas en Bajo, Medio y Alto en `docs/capturas/<versión>/` y el costo medido en ms.
- [ ] Contenido C5–C8 (orquestadora, 12-nov), DESPUÉS del cierre de la fase 0 y de la fase 1 de jefes, en el orden de `docs/revisiones/DISENO_CONTENIDO_C5-C8.md` §0.5:
  - [x] *(hecho en v12.4.11; `/dar` y el inventario en el juego quedan para el primer ítem real de C5)* 0. `EXT_ITEM = 1100` (rango de ítems 1100–1299) más la prueba mínima de §0.4: `/dar` 1100, guardar, cargar, cofre y billetera. Sube MIN_VERSION.
  - [x] *(hecho en v12.4.12; los encargos de oficio, pesca, obra y volcán llegan con C5–C7)* 1. C8-A: Encargos 2.0 y el tablón, más el cupo del comprador (30 u por día y después 40 %).
  - [x] *(hecho en v12.6.0; Doña Lía, las fragatas, la banderita +25 % y la mantarraya de los 150, en v12.7.1)* 2. C5-B: Tortugas y arrecife.
  - [ ] 3. C5-A: Pesca a fondo. *(C5-A1 hecho en v12.7.0: zonas, carnada, cañas, 8 especies y libro; C5-A2 en v12.7.2: nasa por zona, mariscos, veda, cocina y secadero; faltan la pelea del atún, la boya y C5-A3, que es opcional: muelle y bote de vela)*
  - [ ] 4. C6: Manos de maestro (oficios).
  - [ ] 5. C7: Fuego de la tierra (volcán y cuevas).
  - [ ] 6. C8-C: El Comité de Caminos.
  - [ ] 7. C8-B: Fiesta patronal.
  - Entre una tanda y otra, una fase de jefes (2 a 9) de `DISENO_JEFES_Y_FINAL.md`, para que el final avance a la par.
    - [ ] Fase 2 («Avisos y lecciones», `PREPARACION_C5_Y_JEFES_F2.md` §3): *(infraestructura y tramo A hechos en v12.8.1; faltan el tramo B —5 a 10— y el C —11 a 16—, cada uno con su medición)*
  - Arte: la orquestadora genera en Codex los ~118 íconos de la sección «Pedidos de arte» del diseño, en `assets-src/chatgpt/`, con los mismos nombres. Conectarlos en `public/sprites/arte/` con el pipeline de siempre, NO en `src/assets/items-gpt/` (esa ruta del diseño no se usa).
- [ ] Pendiente de C2: poses de acostarse y de recoger *(la cojera animada quedó en v12.3.0)*.
- [x] *(hecho en v12.4.6)* Pendiente de C3 (después de C4): goteras bajo techo roto, cultivos por temporada, barril de lluvia, sudor y aire caliente con calor.
- [x] *(hecho en v12.4.1)* v12.4.1 ANTES de seguir con C4 (orquestadora, 12-nov): los 5 hallazgos de `docs/revisiones/REVISION_v12.0.0-v12.2.1.md`. (1) la cojera no impide correr: `player.js:73`; (2) las pilas de comida mezclan la fecha: `juntar()` con promedio ponderado de `dia`, en `Inventory.add` y las 6 uniones de `ui.js`; (3) horizonte en Bajo: tope de 1536 y `despachar()` al llegar cada baldosa; (4) `tickLena` borra las fogatas de chunks no cargados: `isLoaded`; (5) rodar en enfriamiento igual rebaja el golpe, y hay que limpiar `caidaPend` al cambiar de mundo. Más la clave del shader con nombre (`cloud|`). La carreta, el zaguate y el concurso pasan a v12.4.2.
- [x] *(hecho en v12.4.4; la seguridad salió antes como v12.4.3)* v12.4.3 OCTAVA REVISIÓN, primero (orquestadora, 12-nov): los 7 puntos de «Para la constructora, en orden» de `docs/revisiones/REVISION_v12.2.1-v12.4.x.md` (mecedora sin tope, tirón de cámara cada 20 s sentado, reventa de mazorca en la feria, la siesta que hace retroceder el reloj, `despachar()` con el horizonte apagado, la cobija, el aguacero en los eventos y el guarapo podrido con su balde).
- [x] *(hecho en v12.4.3, con LICENSE y LICENSE-ARTE)* v12.4.4 SEGURIDAD DEL CÓDIGO, justo después de v12.4.3 (orquestadora, 12-nov), de `docs/revisiones/AUDITORIA_SEGURIDAD_PREVIA.md`: C3 `esc(e.i)` en `diario.js:35` y revisar las filas «por confirmar» de la tabla de sumideros; C4 `validarMundo()` en `save.js` (tope de 64 MB, lista blanca de campos con tipos y rangos, ids de bloque < BLOCKS.length, slots de `be` válidos; probar con `__proto__`, números gigantes e ids negativos); A1 rutas `/ui/...` en JS con `import.meta.env.BASE_URL` y probar `vite preview --base /NanoBlocks/`; A2 CSP en `<meta>` y cambiar los `onerror` en línea por listeners; A3 completar `THIRD_PARTY.md` (three MIT, arte generado con GPT). La publicación (repo nuevo de un solo commit, LICENSE MIT + CC BY 4.0 y limpieza de `docs/`) va en la tanda «Antes de publicar», sección 8; nanoyackson ya la decidió.

- [x] *(hecho en v12.6.6; hojas en docs/capturas/v12.6.6/)* v12.6.6 URGENTE (nanoyackson, 12-nov): «mejorar la mano como agarra algunas cosas; la galleta la agarra rarísimo». En primera persona la galleta sale enorme, tapa media pantalla y la mano la sostiene por el centro, por detrás. Agarre por tipo de objeto:
  - comida y objetos pequeños, más chicos, entre los dedos y de frente;
  - herramientas y armas, por el mango;
  - bloques, en la palma;
  - planos, papeles y libros, abiertos;
  - recipientes, de pie.
  Revisar TODOS los ítems con un script que pase por cada uno y tome capturas en una hoja de contactos (`docs/capturas/v12.6.6/mano-*.jpg`). Ajustar escala, giro, punto de agarre y los dedos. Que se vea igual de bien en tercera persona.

- [x] *(hecho en v12.8.2, con los halos de Medio; el 12.8.1 ya era de los jefes)* v12.7.3 ANTES de PostFX (orquestadora, 12-nov):
  - (A) Balance del pescador, meta ~45 u/día con la caña de fibra: que el muelle no venda el pargo ni la corvina (o que los venda a más de 1.25× lo que paga), que el perfil del bot arranque en el río con lombriz, y si queda por debajo de 40, subir la orilla. Tabla en BALANCE.md.
  - (B) Decimoquinta revisión, `REVISION_v12.6.4-v12.6.6.md`:
    - fallback visible en `itemCanvas` y prueba de que ningún ítem quede sin dibujo;
    - tabla EXPLICITO en agarre.js, con los tipos nuevos `escudo` y `grande`, y `tools/revisar-agarre.mjs`;
    - hojas de la mano de nuevo, con armaduras y escudos;
    - `mix(a,1,lejosA)` para la costura del lod;
    - migrarVivos solo con corales bajo el mar.

- [x] *(hecho en v12.8.3)* v12.8.3 DECIMOSEXTA REVISIÓN (orquestadora, 12-nov), `REVISION_v12.7.0-v12.7.2.md`: PIDE (panadera y carnicero) y `tools/revisar-pide.mjs`, bot-economia con las tablas de `pesca.js`, `zonaDe` sin huecos, agotamiento con vecinas y nasas (orilla y la séptima).

- [x] *(hecho en v12.8.4)* v12.8.4 DECIMOSÉPTIMA REVISIÓN (orquestadora, 12-nov), `REVISION_v12.8.0-v12.8.2.md`: el emisor después del grado, el Cocodrilo esquivable y `revisar-avisos` con el tramo B pendiente, el pescador a 42–48, los halos solo en luces y el bloom apagado sin HalfFloat.

- [x] *(hecho en v12.8.5)* v12.8.5 URGENTE (orquestadora, 12-nov): que los mundos no se pierdan. El 12-nov el panel del navegador se cerró solo y al volver no había ni ajustes ni mundos: IndexedDB y localStorage vacíos en el origen localhost:5199.
  - Llamar a `navigator.storage.persist()` al arrancar y mostrar el estado en Ajustes.
  - Copia de respaldo automática y rotativa de cada mundo: un archivo exportable con un botón «Descargar respaldo», y un aviso suave cada N horas de juego si no se ha bajado ninguno.
  - Al arrancar con el almacenamiento vacío pero con mundos conocidos, avisar e indicar cómo importar el respaldo.
  - Probar en tab-1.

- [x] *(hecho en v12.8.6)* v12.8.6 DECIMOCTAVA REVISIÓN (orquestadora, 12-nov), `REVISION_v12.8.3-v12.8.4.md`: el aviso del Cocodrilo (una sola mordida con `preGiro` y el brillo con candado), las luces (`animDe`, `LUCES` completa, `SIN_RESPLANDOR` y `tools/revisar-luces.mjs`), el hombro de verdad y el bloom de día y de lejos, el lujo paga menos el pescado (con la variante «con lujo» del bot) y `revisar-pide` con comentarios de bloque, llaves e ids.

- [x] *(hecho en v12.8.7)* v12.8.7 FASE 2B, LOS JEFES DEL MONTE AVISAN (`PLAN_CIERRE_FINAL.md`): anillo verde de la Reina y 3 crías, parry a la Cascabel, Cornudo ×1.25 de costado y ×2 trabado, la masticada del Tata una vez y charcos visibles, carril azul del Cangrejo y stunT 5, anillo del Ciempiés en 0.8 s sin pegar barriéndose o en el aire, la Ofrenda con 3 días por jefe y `ATAQUES_B` en `revisar-avisos`.
- [x] *(hecho en v12.8.8)* fase 2B-bis: Cascabel 165·0.25 (anillo de salida, veneno 2 s), Cornudo 300·0.8, Tata 750·1.1; `g.diag` con `quien` y mangos (`g.diagDe`). Tabla en `BALANCE.md`. Quedan «aceptables»: torpe vs Cascabel p 1; Tata recibido 4–5 (tabla 8–10). Después, fase 2C.
- [x] *(texto original de la 2B-bis)* fase 2B-bis (balance, de la medición de la v12.8.7 en `BALANCE.md`)**: la Cascabel la gana el torpe (p 1) y ≈ 25 % de su daño llega sin aviso; Don Cornudo cae en 7 s con el hábil (tabla ~34); el Tata en 16 (25). Retocar `jefes-balance.js` uno por uno con `JEFES({ solo:[…], perfiles:['torpe','habil'], veces:10 })` (correr con `new Bot(game, …)` y `bot.seguir(25000)` en tandas cortas). Falta también lo suelto de 2B: **`g.diag`** (`game.js damagePlayer`) atribuir los mangos y los avisos sin `quien`. **Decidido (orquestadora, 13-nov): la Ofrenda descansa 3 días por jefe, no global; queda como está.** Después, fase 2C.

## Regla de arte (nanoyackson, 11-nov): todo objeto nuevo lleva arte de calidad generado con GPT
- Por cada objeto, bloque, criatura, billete o ícono nuevo (y los viejos que se vean pobres), anotá un pedido en `docs/PEDIDOS_ARTE.md`. Usá una fila por imagen, con:
  - el nombre exacto del archivo de salida (`assets-src/chatgpt/<nombre>.png`), el tamaño y si lleva fondo transparente;
  - el prompt completo en español, en el estilo de `docs/PROMPTS_CHATGPT.md` (plano tipo Kenney para íconos; nada copiado de otros juegos);
  - el `sprite` o el uso donde se va a conectar.
- Mientras el PNG no exista, dejá el arte procedural. El juego debe funcionar igual sin la imagen.
- La orquestadora corre los pedidos en Codex por tandas y deja los PNG. Al ver uno nuevo en `assets-src/chatgpt/`, convertilo a `public/sprites/` y conectalo, y marcá el pedido como hecho.

## Decisiones tomadas (no volver a preguntarlas)
- La jabalina y demás objetos simples respetan su `stack` declarado (se arregla ya).
- Barril de lluvia: da agua **limpia**.
- Insolación: se deja la hora de inicio actual.
- Logros con género («Sentadito» y similares): se cambian por nombres neutros con jerga tica.
- Pausa al abrir mapa, libreta y tienda: sí, activada por defecto. El inventario, los cofres y la mesa **no** pausan.
- Avisos que nacen dentro del inventario: se muestran ahí mismo, en una línea discreta del panel. No van a la cola.
- «Ordenar la casa»: antes de mover nada, mostrar «Va a tocar N cofres» con la lista y un botón para confirmar.
- Escarabajo y Escarabajo Hércules: no se tocan hasta que nanoyackson pelee con ellos.

## 1. v11.10.2 «Que Chrome no estorbe» (la v11.9.3 que quedó sin hacer; la v11.10.1 fue la tercera revisión)
- [x] Pointer lock:
  - [x] que no se pierda al craftear ni al cerrar ventanas, y que vuelva a pedirse en el mismo gesto;
  - [x] recuperarlo con un clic que no golpee ni ponga un bloque;
  - [x] `unadjustedMovement` con respaldo;
  - [x] capa «clic para jugar» discreta.
- [x] Atajos de Chrome bloqueados mientras se juega:
  - [x] Ctrl + rueda, Ctrl +/−/0, Ctrl+S/D/P/F/R, F5, F1, F3, F7, Alt suelto, Retroceso, Ctrl + Espacio;
  - [x] Keyboard Lock en pantalla completa;
  - [x] `beforeunload` si hay cambios sin guardar;
  - [x] nada de esto en campos de texto.
- [x] Teclas 1–9 sobre una casilla (inventario, cofre, baúl, mesa, horno y la salida del crafteo) pasan el objeto a esa casilla de la barra rápida, intercambiando. Respeta las casillas fijas; nada se pierde ni se duplica.
- [x] Reparto al arrastrar:
  - [x] clic derecho deja uno por casilla al pasar; clic izquierdo reparte en partes iguales y recalcula en vivo;
  - [x] animación de aparición (escala 0.6→1 en ~120 ms y brillo; sin rebote con `calmaActiva`) y clic suave;
  - [x] resultado de la receta en vivo;
  - [x] Esc o soltar fuera devuelve todo; se saltan las casillas con otro objeto;
  - [x] vale en todas las rejillas.
- [x] El texto del jugador se pinta con `textContent` o escapado, con tope de largo: nombres de cofre (32), mundo, personaje, carteles, libreta y mundos importados. Barrido de `innerHTML`.
- [x] Flechas, piedras y demás proyectiles respetan `world.cajas()`.
- [x] El banner de región y el título de jefe pasan por el locutor como `importante`; el locutor se calla mientras haya un `dialog()` abierto.
- [x] (v11.10.1) Hallazgos de `docs/revisiones/REVISION_v11.8.0-v11.9.x.md`, con la **Tanda 1** completa de `docs/revisiones/PROXIMAS_TANDAS.md`: locutor afinado (los falsos urgentes, `enCombate`, la prueba `revisar-avisos`), cantimplora `cruda`, «Ordenar la casa» con lista. *(Hecho en v11.10.1 y v11.10.2; quedan sin hacer los «por confirmar» P2, P4 y C5 de la Tanda 1, punto 9.)*
- [x] `stack` declarado respetado en los objetos simples.

## 1b. v11.10.3 + v11.10.4 «Colones de verdad» (decisión de nanoyackson, 11-nov) — la 11.10.3 hizo la plata (K = ₡500); la 11.10.4, ingresos y bot de economía
- [x] Denominaciones reales, con arte ORIGINAL (no copia de los billetes ni monedas del BCCR):
  - [x] monedas de ₡5, ₡10, ₡25, ₡50, ₡100 y ₡500;
  - [x] billetes de ₡1000, ₡2000, ₡5000, ₡10 000 y ₡20 000.
  - [x] Los billetes de ₡20, ₡50 y ₡100 de la v11.10 (ids 385–387) se reemplazan o se migran.
- [x] Economía a escala de precios reales de Costa Rica en 2026 (inflación incluida):
  - [x] canasta de referencia: un casado ~₡4500, un gallo pinto ~₡3000, un pan ~₡800, un café ~₡1500, un machete ~₡7000, una noche de hotel ~₡25 000;
  - [x] calcular el factor K contra los precios actuales del juego y aplicarlo a TODO lo que cobra o paga (tiendas, encargos, sueldos, recibidor, rifas, multas, préstamos, banco);
  - [x] ideal: una sola función `precio(n)` o una tabla central; redondear a montos «tico» (múltiplos de 5, 25, 50, 100 o 500 según el tamaño).
- [x] Migración de guardados (subir `SAVE_FORMAT`): la plata de cada jugador se multiplica por K y se convierte a la combinación de menos piezas.
- [x] Pagar y dar vuelto con la menor cantidad de piezas; `count(COLON)` sigue contando por valor.
- [x] Ventanilla «Cambiar plata» en banco, pulpería y comerciantes.
- [x] **Billetera** (nanoyackson, 11-nov; va en la v11.10.4): la plata NO ocupa casillas del inventario.
  - [x] *(v11.10.5: va en `meta.inventory.billetera`, junto con el inventario)* `meta.billetera` guarda la cantidad de cada denominación.
  - [x] Lo que se recoge entra directo a la billetera.
  - [x] `inventory.count(COLON)` y `remove(COLON)` leen y pagan desde la billetera.
  - [x] HUD: el total («₡12 500») discreto a un lado de la barra rápida, con una animación corta al cambiar.
  - [x] En el inventario, un panel «Billetera» con el desglose y los íconos nuevos. Botón «Sacar» para volverla objeto (dar, botar o guardar en un cofre); arrastrar plata a la billetera la hace entrar.
  - [x] Los cofres guardan plata como objeto.
  - [x] Al morir se le cae parte de la plata (nanoyackson, 11-nov): una parte de la billetera queda en el bolso donde murió y se recupera si vuelve por ella.
    - [x] Fácil: 0 %. Normal: 50 %. Difícil: 100 %.
    - [x] Redondear a piezas reales.
    - [x] Avisarlo en la pantalla de muerte («Se le cayeron ₡6500 en el bolso»).
    - [x] Lo guardado en el banco y en la alcancía nunca se pierde. *(el banco, en la v11.10.5; la alcancía, con el chanchito)*
- [x] **Chanchito de barro** (alcancía; idea de nanoyackson, diseño propio y no copiado): un objeto raro que se pone como bloque. Funciona como un cofre «enlazado».
  - [x] Todos los chanchitos de un jugador comparten el mismo contenido (27 casillas, con plata y objetos), estén donde estén.
  - [x] Lo que hay adentro nunca se pierde: ni al morir, ni si rompen el chanchito, que suelta solo el chanchito vacío.
  - [ ] *(queda para el multijugador: hoy es `meta.chanchito`; con B.10 pasa a `meta.chanchitos[jugador]`)* En el multijugador, cada jugador tiene el suyo, guardado por el anfitrión según B.10.
  - [x] Cómo se consigue (raro):
    - [x] a veces en cofres de estructuras o ruinas;
    - [x] como premio de un encargo de la abuela o de la feria;
    - [x] o se compra muy caro a un alfarero ambulante que pasa de vez en cuando por el pueblo.
  - [ ] *(modelo de bloques y dibujo propio hechos en la v11.10.7; el ícono de GPT pedido en `PEDIDOS_ARTE.md`)* Arte: modelo 3D de chanchito de barro pintado a mano (barro rojizo con dibujos geométricos sencillos) y un ícono por `PEDIDOS_ARTE.md`.
  - [x] Sonido al abrir: un tintineo de monedas de los bancos CC0.
  - [x] Consejo único la primera vez que lo encuentra.
  - [x] Migración: los colones del inventario y de la barra pasan a la billetera; los de cofres y bolsos se quedan como objeto.
- [x] *(K = 500: el bot de la v11.10.4 pasa los tres criterios con él)* Factor K: la v11.10.3 usó K = 500 y `docs/revisiones/MAPA_ECONOMIA.md` sugiere 800. Que decida el bot de economía de la v11.10.4.
- [x] Mostrar montos con separador de miles («₡12 500»).
- [ ] Toque satírico opcional, solo contra instituciones ficticias: el «Banco Central de Tiquicia» y una inflación anual leve en el juego (precios que suben poco a poco con los años del juego). Si se hace, con interruptor y balance anotado.
- [x] Arte: la orquestadora deja los PNG en `assets-src/chatgpt/` (`moneda-5.png` … `moneda-500.png`, `billete-1000.png` … `billete-20000.png`, 512×512 con fondo transparente). Convertirlos a `public/sprites/` como los demás. Si todavía no están, dejar el arte procedural y cambiarlo cuando lleguen.
- [x] Ingresos a la misma escala (pedido de nanoyackson): lo que uno GANA debe calzar con los precios nuevos.
  - [x] Pago por trabajo según el oficio y el esfuerzo. Referencia: una jornada sencilla en el pueblo ~₡12 000–15 000; un oficio calificado o peligroso (mina de Abangares, pesca de altura, cajuelas en cosecha) más.
  - [x] Recompensa en plata por matar, según el peligro de cada bicho: bichos comunes poco o nada, bravos y élites algo, «Se busca» y minijefes bastante, jefes un premio grande. Se paga por recompensa o por encargo, no por cada pollito (que matar animales mansos no dé plata).
  - [x] Encargos, rifas, concursos *(a la escala ×500 por `plata.js`; solo la cajuela se reescaló aparte)*, el recibidor de café y la venta a comerciantes, todos reescalados.
  - [x] Meta de ritmo: con un día de juego de trabajo honrado se compra la comida del día y sobra algo; una herramienta buena cuesta unos 3–5 días de trabajo; una casa o un lote, semanas. Medilo y anotalo.
  - [ ] Si se activa la inflación del juego, sueldos y recompensas suben al mismo ritmo que los precios.
- [x] **Balance comprobado, no supuesto** (nanoyackson: «que quede bien balanceado»). Hacé `tools/bot-economia.js`, que simule tres perfiles de jugador durante 30 días de juego:
  - «trabajador»: encargos y oficios;
  - «cazador»: recompensas y botín;
  - «comerciante»: cultivar o pescar y vender.
- [x] Para cada perfil, medí cuántos días tarda en pagar: comida diaria, herramienta de hierro, armadura de cuero y de hierro, baúl grande, carreta, lote o casa, y la Ofrenda de cada jefe si cuesta plata.
- [x] Criterios para darlo por bueno:
  - [x] ningún perfil se queda sin poder comer;
  - [x] ninguno se hace rico de forma absurda: tras 30 días, no comprar TODO con sobra;
  - [x] los tres perfiles terminan a no más de ~1.5× entre sí;
  - [x] no hay ningún bucle de plata infinita (comprar y vender lo mismo con ganancia, o un enemigo que se pueda «cultivar» por recompensa).
- [x] Si algo falla, ajustá y volvé a medir hasta que pase. Anotá la tabla final en `docs/BALANCE.md`.
- [x] De paso (seguridad, barato): subir `vite` a ≥ 6.4.6 y `eslint` a ≥ 9.39.5 (`npm audit`, ver `PROXIMAS_TANDAS.md`, D1), y arreglar el `e.message` sin escapar de `ui.js` (X1).

## 1c. v11.10.6 «Cuarta revisión: plata» (VA ANTES del chanchito, que pasa a ser la v11.10.7)
- [x] *(#1 y #6 ya los resolvía la billetera: comprobado en `tools/revisar-plata.mjs`; #7b, #9 y la soda también van)* Todos los hallazgos de `docs/revisiones/REVISION_v11.9.2-v11.10.4.md`. Si la billetera de la v11.10.5 ya resolvió alguno (el #1 del vuelto o el #6 de pagar con la moneda en la mano), comprobalo con una prueba y anotalo.
- [x] #2 Jefes que se pueden «cultivar»: la paga de cada jefe se da UNA vez por jefe y por mundo; las siguientes veces, solo una fracción pequeña (10 %). Las leyendas, los minijefes y los «Se busca» llevan un enfriamiento por día de juego.
- [x] #3 Corregí los SUPUESTOS de `bot-economia.js` para que calcen con el código real, VOLVÉ A MEDIR y ajustá hasta que pasen los criterios. Tabla nueva en `BALANCE.md`.
- [x] #5 Sombras ladronas (decisión): pueden robar plata de la billetera, pero poca (como mucho el 10 % o ₡5000, lo que sea menor). La sueltan completa al morir, con un aviso claro.
- [x] #7 Los animales mansos (`cuche_monte` y similares) no pagan.
- [x] #8 Precios de cosas baratas redondeados a montos que usen monedas chicas cuando calce (₡25, ₡50, ₡100…), para que esas monedas existan en el juego. Sin volver los precios feos.
- [x] #4 `aColones`: solo montos de verdad, con prueba sobre todos los literales.

## 2. v11.11.0 «Brillo y nada flota» *(partida: el brillo salió en la v11.11.0; «nada flota» va en la v11.11.1)*
- [x] Deslizador de brillo de 0 a 100 %. El valor por defecto queda idéntico a hoy (captura comparada). *(50 % = idéntico por construcción: con `BRILLO` en 0 la curva no toca la luz, y el filtro viejo a 0 no hacía nada)*
  - [x] Que levante las sombras y la noche con una curva o un piso de luz en `makeMaterial`, no con un filtro CSS.
  - [x] Solo mundo y mano, no la interfaz.
  - [x] Vista previa en vivo; se guarda en `settings`.
  - [x] Capturas de noche y en una cueva, a 0, por defecto y al 100.
- [x] `tools/revisar-modelos.js`: piezas que no tocan a su padre o se meten de más.
  - [x] Modelos: jugador en primera y tercera persona, vecinos, criaturas y jefes.
  - [x] Poses: quieto, caminando, golpe, parry, barrido, sentado y nadando.
- [x] Arreglar todo lo que reporte, empezando por:
  - [x] *(en tercera persona cuelgan del antebrazo y tocan la mano en todas las poses; en primera persona, con algo en la mano no se dibuja el puño: es así a propósito)* objetos en la mano dentro del puño y bien orientados (arma, herramienta, antorcha, escudo);
  - [x] equipaje pegado al cuerpo y siguiendo la pose (armadura, bolsos, mochila, gorras, capas);
  - [x] uniones de hombros, codos y caderas;
  - [ ] más detalle donde se vea pobre de cerca. *(queda abierto: va mejor con los íconos y modelos de GPT y en la tanda de gráficos)*
- [x] Capturas de cerca antes y después. *(después: el escudo de hierro en el muñeco del inventario; el antes quedó medido por la herramienta, 5 cm de hueco, no en captura)*

## 2b. v11.11.2 «Nada flota, parte 2» (pedido de nanoyackson: «que los elementos usando no queden flotando»)
- [x] Primera persona: mano o puño con la piel y la manga (camisa o armadura) agarrando espada, herramientas, antorcha, escudo, comida, bloques (por abajo), cantimplora, arco, honda y jabalina, siguiendo golpe, comer, beber, poner bloque y parry.
- [x] Tercera persona con la animación real: caminando, corriendo, golpeando y barriéndose, con espada, antorcha, mochila y armadura completa. Arreglado: la mochila no se veía en el cuerpo y barrerse no tenía pose.
- [x] Capturas de antes y después en `docs/capturas/v11.11.2/`.

## 3. v11.12.0 «Inventario a la medida» *(partida: el inventario en la v11.12.0; Tanda 2 en la v11.12.1; Tanda 3 y el diseño de estados en la v11.12.2)*
- [x] Rediseño de inventario, cofre, baúl, mesa, horno y estaciones:
  - [x] se ajusta solo de 1280×720 a 4K;
  - [x] la estación a un lado y el inventario completo visible.
- [x] Pestañas por categoría (`categorias.js`) con contador e ícono.
- [x] Buscador (`/` o Ctrl+F con la ventana abierta), sin tildes, con resaltado; Esc limpia.
- [x] Orden elegible: categoría, nombre, cantidad, recientes. Se recuerda. *(«recientes» cuenta desde que se abrió la partida: no se guarda)*
- [x] Recetario con buscador:
  - [x] lo que se puede hacer ahora, resaltado;
  - [x] lo que falta, a la vista;
  - [x] clic coloca los materiales; Mayús+clic hace el máximo.
- [x] *(variables `--s`, `--acento`, `--tinta`, `--zoom-ui`; borde por categoría; hover, foco y deshabilitado; contrastes de la Tanda 3)* Diseño bonito y coherente: variables CSS, borde por categoría, hover, foco y deshabilitado, contraste ≥ 4.5:1.
- [x] *(Tanda 2 en la v11.12.1; Tanda 3 en la v11.12.2. Quedan para después: las etiquetas del mapa a los 8 puntos más cercanos y el botón «Créditos» del menú —los créditos tienen ancla `#creditos` en Novedades— y los tokens `--fs-*`)* **Tanda 2** («Teclado, foco y pausa») y **Tanda 3** («Que se lea bien») de `PROXIMAS_TANDAS.md`, con las decisiones de arriba.
- [x] Capturas en 3 tamaños de cada pantalla y prueba de que nada se pierde al filtrar o buscar.

## 3b. v11.13.1 + v11.13.2 «Vidrio» (decisión de nanoyackson: dirección A)
- [x] v11.13.1: tokens únicos, paneles de juego (inventario, mesa, recetario, cofre, baúl, chanchito, horno, tienda) y HUD en vidrio; íconos de ordenar, depositar y buscar; categorías como filtros del recetario; billetera literal; `tools/revisar-estilo.mjs`; capturas antes y después.
- [x] *(hecha; Inter desde el repo llegó en la v11.13.4)* v11.13.2: libreta y todas sus hojas, mapa, álbum, menús, mundos, mundo nuevo, carga, novedades, ajustes, pausa, muerte, diálogos, barras de jefe, banner, minijuegos y modo foto; `style.css` sin colores sueltos (`revisar-estilo --estricto`); Inter desde el repo; recorrido de capturas de todo.
- [x] v11.13.3 «Pulido de vidrio + quinta revisión»: hallazgos de `REVISION_v11.10.5-v11.12.2.md` (F1 y B3 confirmados en el juego), logo del menú legible, ajustes anchos (dos columnas, 16 px), mapa agrupado al alejar con leyenda que filtra por capa y etiquetas en los 8 más cercanos.
- [x] v11.13.5 «Sexta revisión»: G1 (texto invisible: papel con tinta y `--on-color`), G2/G3 (velo → vidrio .88 y letra a 14 px), `revisar-estilo` con contraste calculado, M1 (inicio del compacto fuera de la feria y el cementerio), blur fuera donde no se ve y apagado con «Movimiento tranquilo»; capturas de cartas, álbum, logros, bingo y HUD con cielo y nieve.

## 4. v11.13.0 «Tiquicia de bolsillo» (mundo compacto)
- [x] Tal como está en el mensaje de la TANDA 6b:
  - [x] tipo de mundo Normal o Compacto;
  - [x] biomas 2–2.5 veces más chicos;
  - [x] estructuras a un tercio de distancia, sin encimarse;
  - [x] *(pueblo a ~70 siempre; 77 tipos no caben en 300 (ocupan ~241 000 de los ~271 000 bloques² del anillo): garantía a 600 con ~35 dentro de 300; los de grilla propia y el aeropuerto quedan sin acercar, ver CHANGELOG)* todo dentro de 300 bloques y pueblos dentro de 150;
  - [x] anillo seguro de 60;
  - [x] `tools/` con la tabla por semillas y capturas del mapa.

## 5. v12.0.0 «Hora dorada» (gráficos, fase 0 + atmósfera) — **PAUSA**
- [x] *(v12.0.0: fases 0 y ★2; el `PostFX` queda para la 12.1, después del visto bueno)* Según `docs/revisiones/PLAN_GRAFICOS.md`: `PostFX` propio (antes, una prueba de 1 día con `postprocessing`); three 0.170.
- [x] Niveles Bajo, Medio, Alto, Ultra y Personalizado en «Opciones de video»; Bajo es idéntico a hoy.
- [x] El brillo de la v11.11 se integra a esta pantalla.
- [x] *(los ms no son confiables con el panel oculto; ver CHANGELOG)* Capturas al atardecer en Bajo, Medio y Alto, con fps y ms por cuadro.
- [x] **PAUSA:** mandar las capturas a la orquestadora y no seguir con 12.1+ hasta el visto bueno de nanoyackson. Mientras tanto, seguir con la sección 6.
- [x] **DECISIÓN DE NANOYACKSON (12-nov):** aprobó el look de la hora dorada (v12.1.1) y la calidad por defecto es **Medio** (v12.2.1: migración del «Bajo» de fábrica, `calidadElegida`, aviso del locutor si va a menos de 40 fps).

## 6. Contenido (permiso creativo pre-aprobado de nanoyackson: «entre más contenido, mejor»)
Cada tanda es una versión. Si algo parecido ya existe, se profundiza en vez de duplicarlo. En todas: `revisar-recetas` y `revisar-nombres` en 0, ayuda o libreta al día, consejos por el locutor.
- [x] *(v12.1.0; íconos provisionales)* C1 «Fogón y despensa»: leña y fogata que se apaga, fogón, ahumar y salar, comida que se echa a perder despacio, mesa servida con bono, botica con infusiones.
- [x] *(v12.2.0; quedan las poses de acostarse y recoger y la cojera animada)* C2 «El cuerpo que siente» (= Tanda 4 de `PROXIMAS_TANDAS.md`): rodar al aterrizar, señales del cuerpo, sentarse y acostarse con el cuerpo, agacharse a recoger, beber con las manos, despertar con sobresalto, cojera suave.
- [x] *(v12.3.0 y v12.4.6: completo)* C3 «Lluvia y verano» (incluye la Tanda 5 de `PROXIMAS_TANDAS.md`): temperatura del cuerpo y ropa, lluvia sobre el zinc, temporadas lluviosa y seca.
- [x] *(v12.4.0, v12.4.2 y v12.4.7: completo)* C4 «Pura vida en la finca»:
  - [ ] trapiche y tapa de dulce;
  - [ ] café en verano, con cajuela, recibidor y chorreado;
  - [ ] carreta pintada con bueyes;
  - [ ] hamaca y mecedora;
  - [ ] zaguate compañero;
  - [ ] feria del agricultor los sábados;
  - [ ] set de construcción tradicional;
  - [ ] animales con rutinas.

## 5b. v12.0.x «Horizonte lejano» (pedido de nanoyackson, 11-nov). Va dentro de la pausa de la v12.0, porque no depende del visto bueno de la atmósfera.
- [x] *(v12.0.1)* En «Opciones de video», «Distancia de vista» en chunks con un rango más amplio que hoy. Avisar del costo con un indicador de fps.
- [x] *(v12.0.1)* Horizonte lejano: más allá de la distancia de vista, un anillo de terreno en baja resolución que se ve hasta mucho más lejos.
  - [x] *(desde el generador; los chunks guardados quedan para la fase 3 del plan)* Mallas por niveles de detalle (LOD 2×, 4×, 8×) armadas desde el generador o desde los chunks guardados, en un worker, sin bloquear.
  - [x] Colores por bioma y agua; la niebla fundiendo el borde.
  - [x] Sin colisión ni entidades: solo vista.
  - [x] Ajuste «Horizonte: apagado / cerca / lejos / muy lejos».
- [x] Que la calidad baje con la distancia sin saltos feos (fundido entre niveles), y que se vea mejor de lejos que hoy.
- [x] Partir de `docs/revisiones/PLAN_HORIZONTE.md` (lo está haciendo la investigadora).
- [x] *(memoria y triángulos medidos; los fps, con la pestaña al frente)* Medir fps y memoria en cada nivel y anotarlo en el CHANGELOG. «Bajo» sigue igual que hoy.

## 7. Gráficos 12.1+ (después del visto bueno)
- [ ] 12.1 nitidez de texturas.
- [ ] 12.2 agua con espuma de orilla y cascadas.
- [ ] 12.3 `PostFX` con bloom, rayos de sol y SMAA.
- [ ] 12.4 detección automática y regulador.
- [ ] Luego sombras, texturas HD y personajes.

## 8. Antes de publicar (lo último, en este orden)
- [ ] PWA instalable y alojamiento gratis (`ESTUDIO_APP_Y_MULTIJUGADOR.md`, A y B.9).
- [ ] Multijugador:
  - [ ] WebRTC con Trystero/Nostr, STUN y TURN de Open Relay;
  - [ ] el anfitrión es el autoritativo y guarda a cada invitado (B.10);
  - [ ] por fases B.5.
- [ ] Jefes y final épico: según `docs/revisiones/DISENO_JEFES_Y_FINAL.md`, fases 0 a 9 en ese orden, una versión por fase o por par de fases. No se publica sin que la fase 0 confirme la curva.
  - Decisiones de la orquestadora:
    - [ ] La vida del Rey la decide la medición de la fase 0.
    - [ ] La historia NO exige vencer al Rey; el epílogo lo cuenta si ocurrió.
    - [ ] Meta épica: alrededor de 1 muerte de media en la pelea final.
    - [ ] Los textos de la gente y los nombres de las mañas los revisa nanoyackson al jugarlo.
  - Puede empezarse antes que la PWA y el multijugador (no depende de ellos), justo después de las tandas de contenido.
- [ ] Auditoría de ciberseguridad: el historial de git entero, XSS, importaciones, dependencias y los invitados maliciosos.
- [ ] Publicar en un GitHub público, sin Actions hasta entonces.
  - Decisiones de nanoyackson (12-nov):
    - NO se reescribe el historial. Se publica un repositorio NUEVO con un solo commit (`git checkout --orphan`). Este repositorio se queda local y privado y nunca se sube.
    - Licencia libre y gratis: MIT para el código y CC BY 4.0 para el arte, los textos y la música propios (propuesta de la orquestadora). Respetar las licencias de terceros de `THIRD_PARTY.md`.
    - `docs/` se publica, `docs/revisiones/` incluido, pero antes se limpian en el árbol: la ruta personal de Windows, el correo personal y `docs/PROMPT_SIGUIENTE_SESION.md` (se borra).
    - La marca «nanoyackson» puede salir en el juego.
    - Antes del commit único: `gitleaks` o `trufflehog` sobre el árbol, `git config user.email` con el `noreply` de GitHub y revisar a ojo `docs/capturas/`.
