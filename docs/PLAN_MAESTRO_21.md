# Plan maestro 21 — «Que se sienta natural»

Pedido de nanoyackson el 10-nov-2026: «Quiero que sigas mejorando supervivencia, mejorar la UI, mejorar animaciones y transiciones de todo, que se vea y se sienta natural las interacciones y movimientos».

## A. El jugador y la cámara

Hecho en v10.9 y v11.0: balanceo suave, aterrizaje con resorte, inclinación, flotación y chapuzón.

## B. La mano en primera persona

Hecho en v10.9 y v11.0: inercia, golpe, comer, poner y brazada.

## C. Las criaturas

Hecho en v10.9: giro limitado, pasitos, respiración y patas por paso. En v11.0: voladores y nadadores se ladean suave.

## D. El mundo: puertas, cofres, bloques, ítems

Hecho en v11.0: recoger, unir montones, portones, cortinas y pulso de la grieta.

## E. La interfaz: abrir y cerrar, barra, corazones, avisos

Hecho en v11.0: fundidos comunes (`.saliendo`), botones, barra, barras de vida, tooltip, `calma` y `prefers-reduced-motion`.

## F. Supervivencia: calidad de vida

Hecho en v11.0: mochila llena, registro, avisos de hambre y sed, consejos por estado, varios bolsos (`meta.bolsos`), casillas fijas (`meta.fijas`), herramienta automática y vista previa de comida.

## G. Coyunturas y reacciones (v11.1)

Hecho: `articular`, `doblarRodilla` y `doblarCodo` en `anatomia.js`; amago en `pegar` (bravos.js) y `amagoK`; gestos en `pueblo.js`; roce, polvo y ondas en `pulido.js`; `tickMojado` en `supervivencia3.js`.

## H. Combate que se lee (v11.3 y v11.4)

Pedido de nanoyackson el 10-nov: animaciones de ataque físicas, en las que se vea venir el golpe para saber cuándo hacer parry. Hecho: `golpes.js` (preparar, soltar, recuperar; brillo; arco; cadenas), migración de los golpes cuerpo a cuerpo, golpe propio con contacto a medio camino (`golpePend`, `asestar`), cámara y paso (`armasmano.js`), tercera persona (`avatar.js`) y gesto de tocar (`tocar`, `manoT`). En v11.5 las embestidas y los saltos marcan carril o círculo rojo (`avisoEmbestida`, `avisoCaida`) y el brillo rojo dice «quítese». En v11.6 también los ataques a distancia: la honda se carga, los escupitajos brillan y rayos, mangos y cañonazos marcan dónde caen. En v11.6.1 el bot de balance vuelve a medir (contaba bajas en el clic y daba 0): duelos por enemigo y equipo, y una lista de ajustes propuestos en `docs/BALANCE.md`. En v11.6.2, los arreglos de la revisión independiente (`docs/revisiones/REVISION_v10.7-v11.6.md`): saltos al punto marcado, mordidas por `atacar()`, carril único de Don Cornudo, avisos en pausa, portones, bolsos y duplicados. En v11.7.0, los ajustes de balance medidos (aturdimiento con la vida real, escarabajo, tenaza, Jaguar viejo, Don Cornudo) y la remedición en `docs/BALANCE.md`. En v11.8.0, pedidos de nanoyackson jugando: herramienta sola al mantener el clic, clic central para elegir bloque, tirar desde el inventario, cofres con nombre, baúl grande y «Ordenar la casa», interfaz de mesa e inventario sin cortes, mapa que se arrastra, formas reales al chocar y apuntar, patas con muslo, arena que cae y bote que no trepa. En v11.9.0 «Un texto a la vez»: el locutor central con categorías, cola, presupuesto, historial y ajustes, y textos recortados. En v11.9.1, «Lo que estorbaba»: recetas tapadas, chequeos de nombres y recetas, arena sin apoyo, insolación con techo, agua hervida y golpes de los bravos con aviso. En v11.9.2, los arreglos de la segunda revisión independiente. En v11.10.0: billetes, comida variada con premio, barrido en cualquier dirección, el cofre que marca lo que calza y el mapa con WASD. En v11.10.1, la tercera revisión (clasificación del locutor, importante en pelea, confirmación de «Ordenar la casa»). En v11.10.2, «Que Chrome no estorbe» (sección 1 de `docs/COLA_DE_TRABAJO.md`). En v11.10.3, «Colones de verdad», primera parte: denominaciones, escala ×500, vuelto en la menor cantidad de piezas y migración al formato 3. En v11.10.4, segunda parte: precios e ingresos a la escala de 2026, paga por peligro y `tools/bot-economia.js`. En v11.10.5, la billetera (la plata fuera de las casillas, formato 4), la plata que se cae al morir y el arte de monedas y billetes. En v11.11.0, el brillo en la luz del mundo (`brillo.js`); en v11.11.1, «nada flota» (`tools/revisar-modelos.js`, escudo y muñeco); en v12.0.1, el horizonte lejano por niveles (hasta 3 072 bloques, faldones, fundido, segunda pasada); en v12.0.0, la «Hora dorada» (calidad Bajo a Ultra, tono por hora, niebla de altura, cielo mejorado, bruma por bioma; PAUSA para el visto bueno); en v11.13.1 a v11.13.5, la interfaz «vidrio» en toda la interfaz (legible y medida con contraste), con la billetera literal, el mapa agrupado con leyenda y la quinta revisión; en v11.13.0, el mundo compacto «Tiquicia de bolsillo»; en v11.12.2, que se lea bien (Tanda 3); en v11.12.1, teclado, foco y pausa (Tanda 2); en v11.12.0, el inventario a la medida (de 720p a 4K, pestañas, buscador, orden y recetario); en v11.11.3, los íconos del lote 1 de GPT y el chanchito retocado; en v11.11.2, la mano que agarra en primera persona, la mochila en la espalda y la pose de barrerse. De v12.1.0 a v12.4.4: la despensa con fechas (C1), el cuerpo con poses (C2), lluvia y verano con temporadas de 30 días (C3), «Pura vida en la finca» en dos partes (C4: guarapo, mecedora, feria y concurso, zaguate con lealtad, carreta pintada, rutinas), la hora dorada de verdad, el lote 3 de arte, calidad Medio por defecto, la séptima y octava revisión y la seguridad antes de publicar (`importar.js`, CSP, licencias). En v11.10.7, el chanchito de barro (alcancía enlazada, formato 5) y el alfarero ambulante. En v11.10.6, la cuarta revisión: topes contra cultivar jefes, la economía medida con las cadencias reales y precios con monedas chicas.
