# Guía de prueba: lo nuevo de v12.0 a v12.4.4

Para una sesión de juego de **45 a 60 minutos**. Está escrita en «usted», en el orden de juego que menos estorba. Cada paso dice **qué hacer**, **qué debería ver o sentir** y trae una casilla para anotar: **✔ bien / ✘ mal / ? rara**.

*Cómo se armó:* leí el `CHANGELOG.md` de la 12.0.0 a la 12.4.4 y el código de los comandos (`/prueba`, `/dar`, `/tiempo`, `/clima`, `/pueblo`, `/animal`) de esa versión. **No jugué ni corrí el juego** (no puedo abrir el navegador). Si un paso no responde como lo escribí, puede ser que yo lo haya leído mal: anótelo igual.

> **Nota de ubicación:** el encargo pedía `docs/GUIA_PRUEBA_v12.md`; la dejé en `docs/revisiones/` porque ahí es donde me toca escribir. Basta moverla.

---

## 0. Antes de empezar (5 min)

| | |
|---|---|
| **Correr el juego** | En la carpeta del proyecto, `npm run dev` y abrir `http://localhost:5199` en **Chrome**. En la pausa, abajo, debe decir **v12.4.4**. |
| **Mundo de prueba** | **Un jugador → Crear mundo nuevo**, nombre «Prueba v12», semilla **2026** (es la del lago con el volcán de las capturas), modo **Supervivencia**, dificultad **Normal**, tipo **Normal**. |
| **Comandos** | Pulse **`/`** y escriba. Los `/prueba …` solo andan en supervivencia y en la tierra. Los de esta guía: `/tiempo dia\|mediodia\|atardecer\|noche`, `/clima despejado\|lluvia\|tormenta`, `/prueba dia N`, `/dar <objeto> [n]`, `/prueba colones N`, `/pueblo ir`, `/animal`, `/curar`. |
| **Medidor de fps** | **Ajustes → Opciones de video → «Mostrar fps y milisegundos por cuadro»**. Déjelo prendido toda la sesión: sale arriba a la derecha con el nivel de calidad. |
| **Pestaña al frente** | Los fps solo valen con la pestaña a la vista (Chrome frena las de fondo). |
| **Si algo sale mal** | Mire «Cómo reportar» al final. Una captura vale por mil palabras. |

---

## 1. Hora dorada y calidad (6 min) — *v12.0.0, 12.1.1, 12.2.1*

| # | Haga | Debería ver | ✔ ✘ ? |
|---|---|---|---|
| 1.1 | **Ajustes → Opciones de video.** Mire la **Calidad** | Diga **Medio** (es la de fábrica desde la 12.2.1). Si usted ya tenía el juego con «Bajo» de fábrica, también debió pasar a Medio sola, una vez | |
| 1.2 | `/tiempo atardecer` y mire hacia donde se pone el sol | Cielo **naranja en el horizonte → rosa → azul profundo** arriba; luz **ámbar** sobre lo cercano y sombras **azul-violeta**; las nubes con la **panza naranja**. Debe verse más rico, no lavado ni gris | |
| 1.3 | Cambie la calidad a **Bajo** y vuelva a mirar | Se ve **como antes de la v12**: sin tono, sin niebla de altura. Los paneles pierden el desenfoque | |
| 1.4 | Ahora **Alto** | Lo de Medio más la **bruma del bioma** (verdosa en la selva, cálida en el desierto, azulada en el páramo). Más notoria a lo lejos | |
| 1.5 | `/tiempo mediodia` y `/tiempo noche` | Mediodía: casi nada de tinte (un poquito más rico que Bajo). Noche: luz de luna azul | |
| 1.6 | Escoja **Personalizado** y apague uno por uno **Tono**, **Niebla**, **Cielo**, **Bruma** | Cada casilla quita solo su efecto; tocar cualquiera pasa la calidad a «Personalizado» | |
| 1.7 | Vuelva a **Medio**. Mire el medidor de fps | Anote los fps de pie en la costa: **____ fps / ____ ms**. Si baja de 40 durante 10 s con el mundo ya listo, el locutor debe sugerir «Bajo» **una sola vez** | |

**Qué buscar:** franjas o saltos de color en el cielo, bloques que quedan «apagados» respecto de los vecinos, el agua que cambia de tono al girar, y cualquier cambio de color al abrir y cerrar el inventario.

---

## 2. Horizonte lejano (6 min) — *v12.0.1, 12.4.1, 12.4.4*

Con calidad **Medio**.

| # | Haga | Debería ver | ✔ ✘ ? |
|---|---|---|---|
| 2.1 | **Opciones de video → Horizonte lejano.** Hay 4 niveles: **Apagado, Cerca (768), Lejos (1 536), Muy lejos (3 072)** | Cambiar el nivel actúa al soltar el selector, no mientras lo arrastra (es una lista, no un deslizador) | |
| 2.2 | Suba a un cerro o una torre y mire en **Cerca** | Montañas, costas y bosques a lo lejos, **sin huecos** y sin una raya clara entre lo cercano y lo lejano | |
| 2.3 | Pase a **Muy lejos** | Se ve mucho más lejos y la niebla se aleja. **No debe bailar la profundidad** (parpadeos de las montañas lejanas) | |
| 2.4 | Camine o vuele unos 200 bloques y mire cómo entra el terreno nuevo | Entra **fundiéndose con puntitos** (tramado) en medio segundo, sin saltos ni huecos negros | |
| 2.5 | Con **Muy lejos**, anote los fps. Después pase a **Apagado** y vuelva a **Muy lejos** unas 3 veces | Los fps con el horizonte puesto: **____**. Al apagar no debe quedar nada dibujado, y al volver no debe tardar mucho en llenarse (unos 10–16 s en total) | |
| 2.6 | Entre a una **cueva** profunda | El horizonte desaparece (bajo tierra no se dibuja) y al salir vuelve | |
| 2.7 | Cambie la calidad a **Bajo** con «Muy lejos» | En Bajo el horizonte **no pasa de 1 536**: no debe pedirle más (y debe ir más liviano que en Medio) | |

**Qué buscar:** grietas en las costuras, parpadeo en la parte lejana, tirones al entrar baldosas nuevas, memoria que crece sola (en las Herramientas de Chrome, pestaña *Memoria*, si la quiere mirar).

---

## 3. Inventario sin parpadeo (3 min) — *v12.1.3*

| # | Haga | Debería ver | ✔ ✘ ? |
|---|---|---|---|
| 3.1 | `/dar iron 64`, `/dar stone 64`, `/dar log 16`. Abra el inventario con **E** y mueva pilas haciendo **clic** 20 veces seguidas | **Ningún ícono parpadea** (antes todos se ponían en blanco un cuadro) | |
| 3.2 | Abra la **mesa de trabajo** o un **cofre** y haga lo mismo | Lo mismo: sin parpadeo | |
| 3.3 | Con el recetario abierto, mueva una pila que **no** cambie ninguna receta | La lista del recetario **no se rehace** (no salta el desplazamiento) | |

---

## 4. El cuerpo que siente (10 min) — *v12.2.0, 12.4.1, 12.4.4*

### 4A. Rodar al caer

| # | Haga | Debería ver | ✔ ✘ ? |
|---|---|---|---|
| 4.1 | `/curar`. Suba a un lugar de **8 a 12 bloques** de alto y tírese **sin hacer nada** | Golpe fuerte. Con una caída así, unos **−10 u −11 de vida** y **la pierna quebrada** (efecto «Pierna quebrada», no se corre bien) | |
| 4.2 | `/curar`. Repita la caída, pero pulse **V** (voltereta) **justo antes de tocar el suelo** (un cuarto de segundo antes) | Se hace la voltereta, el golpe baja a **0.4×** (≈ **−4.4**) y **no se quiebra la pierna**. Sale «🤸 ¡Cayó como gato de potrero!» | |
| 4.3 | Repita pulsando **V** **dos o tres segundos antes**, todavía en el aire | Si en ese momento no se podía rodar (en el aire), **no debe contar**: el golpe entra entero | |
| 4.4 | Quedó con la pierna quebrada: `/dar tablilla` y úsela (clic derecho) | Sale la **cojera** 🦵 (unos 3 min): **no puede correr** (aunque mantenga Ctrl/Mayús + W) y la pierna derecha casi no se dobla al caminar | |
| 4.5 | `/dar botiquin`, quiebre otra vez la pierna y use el botiquín | El botiquín cura todo **menos el hueso**: dice que la pierna pide una tablilla | |

### 4B. Beber con las manos y señales del cuerpo

| # | Haga | Debería ver | ✔ ✘ ? |
|---|---|---|---|
| 4.6 | Con la **mano vacía**, clic derecho a un río o al mar | **Tres tragos** de 0.4 s con la cámara agachada, con sonido. Un golpe lo corta | |
| 4.7 | Deje el hambre en 6 o menos (corra mucho o espere) | Suenan las **tripas** cada 20–40 s, bajito; sale un consejo | |

### 4C. Sentarse, mecedora y siesta

| # | Haga | Debería ver | ✔ ✘ ? |
|---|---|---|---|
| 4.8 | `/dar silla`, póngala y haga clic derecho a 3 bloques de distancia | **Llega caminando en unos 0.35 s**, no se teletransporta. Sentado, el avatar toma la pose | |
| 4.9 | `/dar mecedora`, póngala, siéntese y **espere 80 segundos sin tocar nada** | Se **mece** (el cuerpo y un poquito la cámara). **No debe haber ningún tirón ni salto de la cámara** (había uno cada 20 s en la 12.2.x) | |
| 4.10 | Con la vida baja (`/curar` no, use una caída), siéntese en la mecedora | Recupera **un corazón cada 12 s** hasta **6 veces** en total; después, **5 minutos sin curar**, aunque se levante y se vuelva a sentar | |
| 4.11 | Recién golpeado (una caída pequeña), siéntese | Los **primeros 8 s no cura** ni la mecedora ni la silla | |
| 4.12 | `/dar banca_corredor`, póngala y siéntese | Igual que la silla | |
| 4.13 | `/dar bed` y póngala. A mediodía (`/tiempo mediodia`) acuéstese y quédese quieto | **Siesta**: avanza un poco el reloj (**nunca para atrás**), cura 6 y quita el cansancio **una sola vez por día** | |

**Qué buscar:** movimientos bruscos de cámara, que el jugador atraviese un bloque al sentarse, que la voltereta «se guarde» y salte después de aterrizar, que la cojera no impida correr.

---

## 5. Fogón y despensa (7 min) — *v12.1.0, 12.4.1*

| # | Haga | Debería ver | ✔ ✘ ? |
|---|---|---|---|
| 5.1 | `/dar log 4`. Abra el inventario y fabrique **leña** (2 troncos → 6 leñas) | Aparece la **leña** | |
| 5.2 | `/dar fogata`, póngala y **clic derecho con leña** en la mano | Carga hasta **8 leñas**, con un aviso («Leña en la fogata: N de 8») | |
| 5.3 | Pase unos minutos (o `/prueba dia 2`) sin echar leña | La fogata pasa a **brasas** (sigue alumbrando) y luego se **apaga** | |
| 5.4 | Apagada: haga clic derecho con leña **sin** mechero, y luego `/dar mechero` | Sin mechero en la barra: **no prende**. Con mechero y leña: **vuelve a prender** | |
| 5.5 | `/clima lluvia` junto a una fogata **sin techo**; espere un minuto | A los ~20 s pasa a **brasas** y a los ~60 s se **apaga**. Con techo, no | |
| 5.6 | `/dar stove` (fogón), póngalo y ábralo | El aviso dice **«Leña en el fogón: N de 16»**. Cada tanda que cocina **gasta 1 leña**; sin leña no cocina | |
| 5.7 | `/dar meat 6` y `/dar sal 6`. En el fogón: **2 carnes + sal** | **Carne salada**: salen **2** (no 3). Con carne + leña: **carne ahumada** | |
| 5.8 | `/dar guapote` (o pesque uno) y hágale **pescado salado** con sal | También se puede con el **guapote** | |
| 5.9 | Tenga carne cruda en la mochila y use `/prueba dia 5` (o espere) | La carne cruda pasa a **pasada** («rinde la mitad y puede caer mal») y, unos días después, a **Sobras**. **La ficha** (pase el ratón) dice cuánto le queda | |
| 5.10 | Junte una pila **vieja** de comida con otra **fresca** (arrastre una sobre otra) | La fecha **no se pierde**: la pila toma una fecha en el medio, no la de la más vieja entera | |
| 5.11 | Haga una **infusión** (agua de manzanilla, jengibre, té de hierbabuena o jarabe de sábila) en el fogón con un balde de agua | Se cocina y, al tomarla, hace su efecto (manzanilla quita el mareo, jengibre la panza…) | |

**Qué buscar:** comida que se pudre de golpe sin aviso, una fogata que gasta leña estando lejos (no debe), y fogatas lejanas que «olvidan» su leña al volver.

---

## 6. Lluvia y verano (8 min) — *v12.3.0, 12.4.4*

### 6A. Las temporadas y el aguacero

| # | Haga | Debería ver | ✔ ✘ ? |
|---|---|---|---|
| 6.1 | `/prueba dia 31` (primer día de invierno; el verano son los días 1–30 y cada temporada dura 30) | Sale el aviso de que **entró el invierno**. La ayuda (Y) tiene el tema «Verano e invierno» | |
| 6.2 | `/tiempo mediodia` y espere **1–2 minutos** a la 1:30 de la tarde, **al aire libre** | Si le toca (80 % de los días), sale **«El aguacero de las dos, como siempre»** y llueve unos 2 minutos. Si no llueve, pruebe `/prueba dia 32` | |
| 6.3 | Ya llueve: métase **bajo un techo de zinc** (`/dar zinc 16`) | La lluvia suena **a la mitad y repica en la lámina**. Sale el logro **«Aguacero de las dos»** | |
| 6.4 | `/clima tormenta` y mire que **no** salga el aguacero fijo mientras dura un huracán/tormenta fuerte | Si hay huracán, sequía o tsunami **no debe salir** el aviso del aguacero | |
| 6.5 | Encienda la **tele** (`/dar tele`) unas veces | A veces da **el pronóstico de verdad** («aguacero a las dos», «se viene el invierno»…) | |
| 6.6 | `/prueba dia 61` y compare | Vuelve el **verano**, con aviso. Una partida **vieja** (si tiene) debe cambiar de temporada **sin romperse** | |

### 6B. Calor y frío

| # | Haga | Debería ver | ✔ ✘ ? |
|---|---|---|---|
| 6.7 | Verano (`/prueba dia 5`), `/tiempo mediodia`, **sin sombrero**, a pleno sol en una **playa** o en el **bosque seco** | Después de unos 20–30 s sale **«🥵 Hace un calor que no se aguanta»** y el efecto **Calor**; la **sed sube** (×1.4) | |
| 6.8 | Con el calor, ponga un **sombrero de paja** (sección 7) | El calor se va (el sol baja) | |
| 6.9 | Frío: vaya a un **páramo** o a un cerro con **nieve**, de **noche** (`/tiempo noche`) | Sale **«🥶 Le entró el frío»** y el escalofrío | |
| 6.10 | Use la **cobija de lana** (sección 7) | El escalofrío se quita **casi de una vez** (no debe volver a los 10 s) | |
| 6.11 | Cuando se aleje del sol/frío, mire que el Calor y el escalofrío **se vayan solos** a los segundos | No deben quedarse pegados | |

---

## 7. La ropa (5 min) — *v12.3.0, 12.4.4*

`/dar capote_hule`, `/dar sombrero_paja`, `/dar cobija_lana`.

| # | Haga | Debería ver | ✔ ✘ ? |
|---|---|---|---|
| 7.1 | **Capote de hule**: clic derecho con él en la mano | Se pone en el puesto de la **pechera**: la pechera de antes **pasa a la barra** (no se pierde). Mientras lo lleva, la **protección** baja a cero (no defiende) | |
| 7.2 | `/clima lluvia`, salga al aire libre **con** el capote y, aparte, **sin** él | Sin el capote: «Ropa empapada» a los segundos. Con el capote **no se moja** y el logro **«Seco como pollo en el aguacero»** | |
| 7.3 | **Sombrero de paja** (también se hace con caña brava: ` C ` / `CCC`) | Quita el sol fuerte (ver 6.7–6.8). Se puede comprar el capote en la **pulpería** y la **ferretería** (30 unidades) | |
| 7.4 | **Cobija de lana** (se hace con 6 de lana), clic derecho | **4 minutos de abrigo**; cada clic gasta **1 de 5 usos** (barra de uso). **Si ya anda abrigado no debe gastar uso** | |
| 7.5 | Ponga el capote y **recibe daño**: ¿la armadura de la pechera de antes sigue en la barra? | Sí, intacta | |

**Qué buscar:** que el capote «desaparezca» la pechera, que el calor vuelva solo, y que la cobija se gaste de más.

---

## 8. La finca (10 min) — *v12.4.0, 12.4.2*

| # | Haga | Debería ver | ✔ ✘ ? |
|---|---|---|---|
| 8.1 | `/dar trapiche`, póngalo; `/dar cane_item 9`; clic derecho con las cañas en la mano | «El trapiche tiene N cañas» | |
| 8.2 | `/dar bucket`, con el **balde vacío** en la mano haga clic derecho al trapiche | **Un balde de guarapo** (gasta 3 cañas). Dice «Guarapo de la casa» (logro) | |
| 8.3 | Beba el guarapo | **Quita 4 de sed** y **devuelve el balde**. Si pasan 2 días sin beberlo se pudre y **devuelve igual el balde** | |
| 8.4 | Meta el guarapo en el **fogón** | Da **2 miel de caña** y devuelve el balde. **No se vende** en ninguna tienda | |
| 8.5 | Café: (con un cafeto maduro, si tiene) pase a invierno | **En invierno no da cereza** (se queda en flor); lo que ya estaba maduro se puede coger | |
| 8.6 | Construcción tradicional: `/dar bahareque 4`, `/dar bahareque_encalado 4`, `/dar horcon 4`, `/dar techo_palma 6`, `/dar postigo 2` | Pared de **bahareque** (se pone y se rompe con pala), **encalado** más claro sin zócalo repetido, **horcón** con corteza al lado, **techo de palma** en losa baja. Las texturas son pixel art provisional | |
| 8.7 | **Postigo:** clic derecho | Abre y cierra (queda a los lados) | |
| 8.8 | Recetas: barro ×2 + caña brava ×2 → 4 de bahareque; 3 troncos → 2 horcones; 6 de caña brava → 6 de techo de palma; 4 palos → 2 postigos | Las 4 recetas aparecen y funcionan | |
| 8.9 | **Animales duermen de noche:** `/tiempo noche` junto a unas vacas o gallinas, a menos de 40 bloques | Se **echan a dormir** con una «Zz» y no se mueven; se **despiertan si usted se acerca a menos de 3 bloques** o les pega. Logro «El pueblo duerme» | |

**Qué buscar:** texturas que no se vean bien al apilar, el postigo atravesable cerrado, el guarapo que se vuelve «Sobras» y se lleva el balde.

---

## 9. La feria del sábado (7 min) — *v12.4.0, 12.4.2, 12.4.4*

El sábado de feria es el día **6, 13, 20…** (los que dejan resto 6 al dividir por 7), **de 8 de la mañana a 5 de la tarde** (hora del juego).

| # | Haga | Debería ver | ✔ ✘ ? |
|---|---|---|---|
| 9.1 | `/prueba dia 6`, `/tiempo mediodia`, `/pueblo ir` | Sale el aviso **«Hoy es sábado: hay feria del agricultor en el pueblo (de 8 a 5)»**. Hay **feriante** (la señal es «Tramo de verduras de la feria») | |
| 9.2 | `/dar corn 12` y venda al feriante. **Mire el precio** | La mazorca paga un **25 % más** (como mucho, **nunca más del 90 % de lo que el mismo feriante cobra** por lo mismo): no debe poder **comprar y revender con ganancia** | |
| 9.3 | Compare con `/prueba dia 7` (domingo) y el mismo feriante | Sin el 25 % | |
| 9.4 | Abra la tienda del feriante y deje pasar las 5 de la tarde con ella abierta (o `/tiempo noche` y reabra) | El precio **vuelve a normal** al hacer clic (se recalcula) | |
| 9.5 | **Concurso:** `/prueba colones 100`, `/dar corn 8` y **Mayús + clic derecho al feriante** con las 8 en la mano | Cobra **₡1 000** de inscripción. Si le gana a los rivales de la semana: **+20 unidades (₡10 000)** y el **listón de la feria**, y entrega las 8. **Solo uno por sábado** | |

---

## 10. El zaguate (6 min) — *v12.4.2*

| # | Haga | Debería ver | ✔ ✘ ? |
|---|---|---|---|
| 10.1 | `/animal` (sin nada) para ver la lista y busque el **perro zaguate**; llame a uno (hay en los pueblos y fincas) y deles carne con `/dar meat 6` | Se hace **su amigo**: lo sigue y lo defiende. Sale un consejo: «un zaguate se hace de la familia: le gusta comer cada dos días» | |
| 10.2 | Désele de **comer de todo** (ya no solo carne): fruta, pan, platos | Acepta | |
| 10.3 | `/prueba dia N` hacia adelante, **dándole de comer cada día** | La **lealtad sube de 1 a 3** (un punto por día si comió en los últimos 2 días). Con lealtad 2 **trae cosas el doble de seguido**; con 3 **muerde +3** | |
| 10.4 | **No le dé de comer 4 días** | **Baja** (de 3 a 2…) | |
| 10.5 | `/dar collar_cuero` y **clic derecho** al zaguate | **+4 de vida** y se le ve el collar. Logro «Zaguate de toda la vida» al llegar a lealtad 3 | |

*(Si no encuentra el zaguate en `/animal`, anótelo: el comando puede usar otro nombre.)*

---

## 11. La carreta (5 min) — *v12.4.2*

| # | Haga | Debería ver | ✔ ✘ ? |
|---|---|---|---|
| 11.1 | `/dar carreta_bueyes`, **clic derecho al suelo** en un lugar abierto | «La carreta con sus bueyes está lista». Clic derecho para sentarse | |
| 11.2 | `/dar brocha`, `/dar paint_green 4`, `/dar paint_blue 4`. Con la **brocha en la mano**, clic derecho a la carreta | Pinta la **caja** de color (rojo, celeste, verde, amarillo o rosado de Sarchí), **gasta una madera y un uso de la brocha** | |
| 11.3 | **Mayús + clic derecho** a la carreta | Abre la **carga de 9 casillas** | |
| 11.4 | Meta cosas, guarde (`/guardar`), salga y vuelva a entrar | El **color y la carga se conservan** | |

---

## 12. Recorrido de cierre (3 min)

| # | Haga | Debería ver | ✔ ✘ ? |
|---|---|---|---|
| 12.1 | Ajustes → **Restablecer** (si lo usa) y vuelva a Opciones de video | Calidad en **Medio**, horizonte en **Cerca (768)** | |
| 12.2 | **Guarde y salga al menú**, entre otra vez al mundo | Nada se pierde: las fogatas con su leña, la fecha de la comida, el color de la carreta, la lealtad del zaguate | |
| 12.3 | **Exporte** el mundo (Mundos → ⬇) y **vuélvalo a importar** | Entra bien, con el nombre «… (importado)» | |
| 12.4 | Mire el medidor de fps una última vez en el lugar de siempre | **____ fps**. Compárelo con el del paso 1.7 | |

---

## Cómo reportar

Para cada cosa que salga mal o rara, mándelo así (cuanto más corto, mejor):

```
Paso: 4.2   Versión: v12.4.4   Calidad: Medio   Horizonte: Cerca
Esperaba:  el golpe baja a −4.4 y no se quiebra la pierna
Pasó:      se quebró la pierna igual y el golpe fue −11
Pasos para repetirlo:  caída de 10 bloques, V un cuarto de segundo antes
fps (si importa): 48 / 18 ms        Captura: sí/no
```

Si es **rendimiento** (se pone lento): diga el **nivel de calidad**, el **horizonte**, la **distancia de visión** y los fps del medidor. Si es **algo que se ve mal**, adjunte una **captura** y la **hora del día** (`/tiempo …`). Si es **un error de la consola** (F12 → Consola), pegue las líneas en rojo.

**Lo que más me interesa saber** (si solo tiene tiempo para tres cosas): (1) ¿los fps en **Medio** con **Muy lejos** son aceptables?; (2) ¿rodar al caer se siente justo, o hay que tocar **V** demasiado pronto o demasiado tarde?; (3) ¿el **aguacero de las dos** y el **calor** se sienten como una ayuda para jugar o como una molestia?

*Escrita por la sesión investigadora. No se corrió el juego: todo está leído del código y de los registros de versiones.*
