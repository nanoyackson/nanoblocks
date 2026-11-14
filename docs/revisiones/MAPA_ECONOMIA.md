# Mapa de la economía (para pasarla a precios reales de Costa Rica 2026)

Pedido: encargo 10 de la orquestadora, para la v11.10.3 («Colones de verdad», sección 1b de `docs/COLA_DE_TRABAJO.md`). Decisiones de nanoyackson: monedas de ₡5 a ₡500, billetes de ₡1 000 a ₡20 000, precios a escala de Costa Rica 2026 con inflación, ingresos coherentes (sueldo por oficio y recompensa por matar según el peligro).

**Cómo se hizo:** solo lectura. Se recorrieron con `grep` las 432 líneas de `src/*.js` que tocan `COLON`, `colones`, `₡`, `precio`, `pago`, `sueldo`; se leyeron las funciones de cada fuente; las tiendas (`SHOPS`) se **extrajeron y se imprimieron** con un script de Node sobre una copia del `HEAD` (con nombres de ítem). Las líneas citadas son aproximadas (`grep` sobre `v11.10.x`; el árbol se mueve): lo estable es **archivo + función**. Lo que no se pudo confirmar va marcado «por confirmar». Los precios de Costa Rica se buscaron en la web con fecha (sección 3); lo que es **estimación mía** está marcado así.

---

## 0. Resumen en diez líneas

1. **La plata es un ítem**, `COLON` (id 360, apila hasta 999) más tres billetes (ids 385–387, ₡20/₡50/₡100) que `Inventory.count(COLON)` ya suma. Entra por `g.giveItem(360, n)`, `inventory.add(COLON, n)` y `entities.dropItem`; sale por `inventory.remove(COLON, n)` (que llama a `Inventory.pagar`).
2. **Está disperso:** `const COLON = 360` está redeclarado en **53 archivos**; hay **42** `giveItem(COLON/360, …)`, **50** `inventory.remove/count(COLON/360, …)` y **92** líneas con montos escritos dentro de textos («2 colones», «₡30»). **No hay tabla central.** Lo único centralizado es el multiplicador de premios (`ventaja.premio`, ×1.25 con la maña «Se le pega la plata») y el de tiendas (`ventaja.tienda`, ×0.95 con el rango «Vecino»), más `economia.js` (`precioDia`, banco, soda propia).
3. **Todo lo que cobra y paga está a escala «de juego»:** gallo pinto ₡3, casado ₡6, café ₡2, machete ₡15, pico de hierro ₡25, noche de hotel ₡60, carro viejo ₡300. Contra Costa Rica 2026 el factor va de **×420 a ×1 000** según el artículo.
4. **Excepción que choca:** `lujo.js` ya trae **precios reales** en sus rótulos (Soda La Bendición: «casado ₡3 000, café ₡900, pipa ₡700»; Grand Ocean: «₡300 000 la noche»), que contradicen los ₡6/₡2/₡2 de la misma soda en `SHOPS.sodera_playa`. Hay que alinearlos.
5. **Matar casi no paga hoy.** Sueltan colones solo: la Chata (3–12), el Mico Malo (2–8), el Bailarín (20–40), la Mona (8–16) y el Mono congo (8–15). Los jefes sueltan ítems, no plata. La plata de «peligro» viene de los carteles de «Se busca» (₡40–90), los asedios y las demás defensas.
6. **Factor K sugerido: 800** para la comida, la pulpería y las herramientas, **con anclas por categoría** que lo corrigen (machete ×500, hotel ×420, vehículos y lotes por ritmo). Detalle en las secciones 4 y 5.
7. **El ritmo se logra con la jornada:** el salario mínimo diario 2026 del trabajador no calificado es **₡12 436,41** (MTSS, decreto 45303-MTSS). Con una jornada de ₡12 500, la comida del día (₡8 500) cubre y sobran ₡4 000; un pico de hierro de ₡45 000 son 3.6 jornadas; el lote de ₡400 000 son ~32 (unas 4½ «semanas» de 7 días).
8. **Una decisión que no es mía:** el BCCR **retiró de circulación las monedas de ₡5, ₡10 y ₡25 del diseño anterior el 1-jul-2026**, y la de ₡5 **no tiene sustituta**: la denominación más chica ahora es ₡10 y las tarifas de bus ya se redondean a múltiplos de ₡10 (ver 3.1). nanoyackson pidió monedas desde ₡5. Se puede dejar como detalle de época («la moneda de ₡5, ya sin uso afuera») o empezar en ₡10: **decide nanoyackson**.
9. **Riesgos de la migración** (sección 6): los guardados traen la plata en el inventario, en `meta.banco`, `meta.fiado`, `meta.sebusca.premio`, `meta.chataDeudor.n`, en los **cofres guardados** (`be.slots` con id 360) y en textos con montos fijos; hay que subir `SAVE_FORMAT` (hoy 2) y convertir todo.
10. **No hay que tocar el balance de progresión** si K se aplica parejo a precios **y** a ingresos: todas las razones (precio ÷ ingreso) se conservan. Los números cambian solo donde se fija un **ancla** (lista en 4.2), y ahí hay que remedir.

---

## 1. Dónde entra y sale plata (inventario completo)

**Convención de las tablas:** *monto hoy* en colones de juego; *clave propuesta* es el nombre en la tabla central (sección 2). «≈ línea» = `grep` sobre `v11.10.x`. «fórmula» = depende del día, la ola o el azar.

### 1.1 Tiendas: lo que se compra y se vende (`pueblo.js`, `SHOPS`; `ui.js`)

Cada tienda tiene `sell: [id, cantidad, precio]` (lo que el jugador compra) y `buy: [id, cantidad, precio]` (lo que el jugador vende); el precio es **por lote** (el «×4» de «Mazorca×4=₡2» es la cantidad del lote). **Mecánica que cobra y paga** (todas leen de ahí):
- `ui.js` (`renderShop`, ≈ 1037 y 1053): compra = `max(1, round(base × fr × ventaja.tienda))`; venta = `max(1, round(precioDia(g, id, base) / fr))`, con `fr` = reputación del pueblo; `economia.js:factorDia` = `0.8 + h·0.45` (entre 0.8 y 1.25, cambia cada día por ítem), `precioDia`, `flecha` (▲/▼). La feria de cosechas multiplica (`economia.js:tickPrecios`, `COSECHAS`).
- **«Regla de oro»** (`pueblo.js` ≈ 354, bloque `{ … }` al final de `SHOPS`): al cargar, recorre todas las tiendas y **baja el precio de compra de la tienda (o sube la cantidad del lote) en pasos de 1** hasta que revender no dé ganancia. Con precios de miles de colones el bucle `e[2]--` sería de cientos de pasos por lote y deja de ser razonable: **hay que reescribirlo con un paso proporcional** (p. ej. `e[2] = Math.floor(e[2] × 0.97)`) o resolverlo en la tabla.
- **Cuidado con `Math.max(1, …)`**: pierde sentido a esta escala (nunca se activa); y los redondeos «a la tica» (sección 4) deben aplicarse **después** del factor del día.

**Precios actuales (imprimidos del código; lote entre paréntesis):**

| Tienda (`SHOPS.<clave>`) | Vende (precio) | Compra (precio) |
|---|---|---|
| **buhonero** · Don Carlos | Obsidiana 10 · Calcita×4 8 · Esencia de sombra 20 · Candela de regreso 14 · Aceite de filo 14 · Venda×2 6 · Farol 14 · Mapa del tesoro 30 | Mazorca×4 2 · Frijoles×8 2 · Café cereza×8 3 · Banano×4 2 · Piña×3 5 · Tapa de dulce 3 |
| **pulpero** · Don Mario *(fiado)* | Fracción de rifa 2 · Sobre de estampas 8 · Agua bendita 6 · **Gallo pinto 3** · Tortilla×2 2 · Arroz×4 2 · Bola de fútbol 6 · Semillas×4 2 · Frijoles×4 2 · Café cereza×4 3 · Balde 8 · Red mariposas 6 · Frasco×3 3 · **Antorcha×8 3** · **Cama 10** · Albarda 14 · Lámpara×2 6 · Suero antiofídico 8 · **Pico de hierro 25** · Vidrio×8 4 · Mapa del tesoro 25 · Careta de buceo 8 · Teja×16 5 · Madera pintada×8 4 · Limón×3 2 · **Caña de pescar 8** · **Bote de remos 10** · **Arco 12** · Flecha×8 3 · **Machete 15** · Bombeta×4 6 · Mechero 3 · Dinamita×2 6 · Farol×2 6 · Guaro 4 · Máscara 20 · Silbato del reto 12 · Papalote 4 · Trompo 2 · Chumicos×6 2 · Parapente 25 · Tabla de surf 15 · Saco gangoche 2 | Fragmento de meteorito 30 · Cristal×4 6 · Pepita de oro 3 · Perla 12/20 · Mazorca×4 1 · Frijoles×8 1 · Café×8 2 · Huevo×4 1 · Cuero×2 2 · Carbón×8 1 · Hierro×2 3 · Oro 10 · Diamante 15 · Jade 25 · Pluma de quetzal 30 · Miel 3 · Pluma de lapa 4 · Pescados 2–4 · Colmillo del Cadejos 30 · Calavera de la Segua 25 · Lágrima de la Llorona 25 |
| **mercader** · Don Chalo | Pejibayes 3/6 · Arco de cintas 6 · Carreta con bueyes 35 · Yuca×3 2 · Piña 2 · Café tostado×4 3 · Tapa×2 3 · Rueda de carreta×2 5 · Máscara 18 · Flores×4 1 · Cama 9 | Piña×3 4 · Café×8 2 · Banano×4 1 · Papaya×3 2 · Mazorca×4 1 |
| **churchillero**, **copero**, **frutero** | Churchill 3 · Copo 2 · Pipa fría 2 · Papaya×2 2 · Agua dulce 2 · Mango×3 2 · Banano×4 2 | Banano 1 · Papaya 1–2 · Leche 3 |
| **pescador** · Caldera | Pargo×2 3 · Corvina×2 3 · Dorado 5 · **Ceviche 6** · **Pescado frito 4** · Limón×4 2 · Caña 7 · Bote 9 | Pargo 2 · Corvina 2 · Dorado 4 · Perla 18 · Bota 1 |
| **minisuper**, **panadera**, **carnicero** | Gallo pinto×2 2 · Tortilla×3 2 · Huevo×4 2 · Agua 2 · Antorcha×8 3 · Balde 7 · Tamal 5 · Cajeta×2 3 · Café chorreado 2 · Carne cruda×3 4 · Carne asada×2 5 · Chicharrón×3 4 | Mazorca 1 · Huevo 1 · Leche 3 · Tapa 2 · Cuero 2 |
| **farmaceutica** | Suero antiofídico 9 · Miel 4 · Agua×2 3 · Repelente 4 · Venda×2 2 · Alcohol 3 · Suero oral 3 · **Botiquín 12** | Miel 3 · Rana dardo 6 |
| **cantinero**, **ferretero** | Guaro 3 · Chifrijo 5 · Pescado frito 4 · Zinc×8 4 · Bloques×16 5 · Concreto×16 5 · Verja×8 5 · Tanque de agua 6 · Polea 8 · **Pico de hierro 25** · **Planos: casita 15, casa con corredor 25, rancho 10** | Caña×4 1 · Tapa 2 · Hierro 3 · Carbón 1 |
| **bartender / chef_lujo / barista_lujo** *(lujo)* | Pipa 15 · Agua 12 · Guaro 20 · Ceviche 35 · **Casado 30** · Gallo pinto con huevo 25 · Chifrijo 28 · Café 12 · Café tostado 15 | Pescado y café (a precio de lujo bajo) |
| **funcionario** · Municipalidad | **Escritura de lote en el pueblo 40** · Cerca×8 3 · Farol 4 | — |
| **inmobiliaria** *(lujo)* | **Escritura de lote con vista al mar 999** | Perla 25 · Oro 14 |
| **sodera_playa** · La Bendición | **Casado 6** · Gallo pinto con huevo 5 · **Café chorreado 2** · **Pipa 2** · Ceviche 6 · Pescado frito 4 | Pargo/Corvina 3 · Dorado 5 |
| **mecanico** | **Carro viejo 300 · Moto 180 · Bicicleta 30 · Lancha con motor 150** · Bidón 9 | Hierro×4 3 · Bidón 6 |
| **pistero**, **operador** | Bidón 8 / 3 · Agua 2 · Gallo pinto 2 · Antorcha×4 2 | Bidón 7 · Carbón 2 · Azufre 2 |
| **caficultor** · beneficio | Cajuela 3 · Café tostado×4 3 · Café chorreado×2 3 · Saco de café 9 | **Cajuela llena de café 24** · Café cereza×8 2 · Café tostado×4 3 |
| **feriante** y otros (`origen.js`) | *(se leyeron los 24 primeros; el resto con la misma forma: por confirmar tienda por tienda al migrar)* | |

`origen.js:43` arma más precios (`S.sell`, `precio / n`) para tiendas de estructuras por tipo: **por confirmar** la lista completa (se recomienda que la tabla central los genere desde una sola lista).

### 1.2 Encargos, mandados y trabajos (entra plata)

| Qué | Archivo · función | Monto hoy | Clave propuesta |
|---|---|---|---|
| Encargos del pueblo (8 mazorcas, 10 frijoles, 12 café cereza…) | `pueblo.js`, tabla de `QUESTS` (≈ 201–210) + cobro ≈ 616 (`q.pay`) | **5–12** (mazorca 6, frijoles 6, café 10, tapa 9, huevos 5, carbón 8, hierro 12, bananos 5, plumas 10, miel 8) | `TRABAJO.mandado[tipo]` |
| Misiones del pueblo (Canelo, vaca, abuela, boda) | `misiones.js` (`fin.pago`, ≈ 21–41; cobra `pagar` ≈ 12) | 25 · 20 · 20 · 30 | `PREMIO.mision` |
| Pedidos de la finca / casa | `encargos.js` (cofre del pedido, ≈ 81) | 15 | `PREMIO.encargoCasa` |
| Recibidor de café | `SHOPS.caficultor.buy` («Cajuela llena») | **24** por cajuela | `TRABAJO.cajuela` |
| Peón de Don Chepito (contratarlo una vez) | `peon.js`, `PRECIO` (≈ 8) | **40** (sale) | `SERVICIO.peonFinca` |
| Peón «por el día» | `compas.js`, `PRECIO` (≈ 6) | **10** (sale) | `SERVICIO.peonDia` |
| El peón trae cosas | `compas.js`, `TRAE` (≈ 103; el ítem 360) | 1–3 por viaje | — |
| Turistas (llevarlos a un sitio) | `turistas.js` (≈ 75: `20 + dist/12`; propina `5 + rand(15)`) | **20+ y propina 5–19** | `TRABAJO.guia` |
| Soda propia | `economia.js`, `MENU` (≈ 33) + `economiaInteract` (propina 1–3) | tortilla 3 · carne asada 4 · café chorreado 3 · empanada 5 · tamal 7 · … hasta 10 | `PRECIO.menuSoda[id]` |
| Panga de Don Macario (vende) | `panga.js`, `PRECIO` | 6 por 3 pescados (sale) | `PRECIO.pescadoPanga` |
| Cuidacarros / vendedores | `cuidacarros.js` (≈ 82), `satira.js` (`V.precio` ≈ 87–98) | 1 (sale) | `PRECIO.monedita` |
| La gente de la casa (cuota diaria) | `gente.js` (≈ 145 rescate `10`; ≈ 210 cuota `8`/día con 4 vecinos) | 10 · 8/día | `SUELDO.cuotaVecinos` |
| Casa por etapas | `vivienda.js` (≈ 80 `+5` por paso; ≈ 96 «bono» `30`) | 5 · 30 | `PREMIO.casaPaso`, `PREMIO.bonoVivienda` |
| Retos de la semana | `retos.js`, `premio(semana)` (≈ 27) | `15 + min(10, semana)·5` (de 20 a 65) | `PREMIO.reto(semana)` |
| Racha sin morir | `amanecer.js`, `PREMIO` (≈ 11) | 3 d → 10 · 7 d → 25 · 14 d → 60 · 30 d → 150 | `PREMIO.racha[días]` |
| Meta de la ruta (premios de progreso) | `progreso.js`, tabla (≈ 40–51) | 10–150 por meta | `PREMIO.ruta[i]` |
| Álbum de estampas | `album.js` (≈ 8–12, 47) | página 40–80; álbum completo 200 | `PREMIO.album` |
| Correo (cartas con plata) | `correo.js` (≈ 19–28) | 40 · 20 · 60 | `PREMIO.correo` |
| Cumpleaños de Eulalia · prima · tío Rigo | `cumple.js` 40 · `prima.js` 120 · `rigo.js` 25 y 80 | — | `PREMIO.historia[clave]` |
| Hitos de la historia con cofre | `archivo.js` (15/15/40; premio 120) · `anselmo.js` (60) · `reliquias.js` (`10 + i·5`) · `expediente.js` (20/150/60) · `minaoro.js` (60; Don Eliseo 50) · `hallazgos.js` (`3–6 + min(14, día)`) · `tesoros.js` (`20–45 × rico`, tope 64 por pila) · `canelo.js` (2–7) · `plato.js` (2–6) | ver fórmula | `PREMIO.cofre[tipo]` |

### 1.3 Premios por combate y defensa («peligro»)

| Qué | Archivo · función | Monto hoy | Clave propuesta |
|---|---|---|---|
| **Asedio** (defender la casa) | `asedio.js` (≈ 135) `ventaja.premio(12 + día·2)` | 12 + 2·día (día 10 → 32; día 30 → 72) | `PREMIO.asedio(día)` |
| **Apuros** (salvar la plaza) | `apuros.js` (≈ 37) `15 + día·2` | día 10 → 35 | `PREMIO.apuros(día)` |
| **Nidos** | `nidos.js` (≈ 69) `8 + día` | día 10 → 18 | `PREMIO.nido(día)` |
| **Némesis** | `nemesis.js` (≈ 87) `25 + nivel·15` | nivel 1 → 40; 3 → 70 | `PREMIO.nemesis(n)` |
| **Luna roja** | `lunaroja.js` (≈ 56) `40 + ola·10` | 5 olas → 90 | `PREMIO.lunaRoja(ola)` |
| **Noche de Ceniza** | `corazon.js` (≈ 89) `6 + ola·3` | por ola | `PREMIO.ceniza(ola)` |
| **Arena de retos** | `arena.js` (≈ 139) `ola·4` | ola 5 → 20 | `PREMIO.arena(ola)` |
| **«Se busca»** (carteles) | `recompensas.js`, `CARTELES` (≈ 8–14) | Chata 50 · Bécquer 45 · Chupacabras 60 · Mico Malo 40 · Puma 55 · **Toro Guaco 90** · Cuche de monte 70 | `PREMIO.sebusca[tipo]` |
| Botín al matar | `bravos.js` (Chata ≈ 206: **3–12**; Mico Malo ≈ 293: **2–8**) · `bailarin.js` (**20–40**) · `leyendas.js` (Mona ≈ 352: **8–16**) · `monocongo.js` (≈ 16: **8–15**) | | `PREMIO.botin[tipo]` |
| Cofre del capitán de la goleta | `goleta.js` (`BOTIN`, ≈ 15) | **120** | `PREMIO.goleta` |
| Incendio / quema / furtivos / asalto a la pulpería | `incendio.js` 25 · `quema.js` 40 (20 desde 30 quemadas) · `furtivos.js` 30 · `asalto.js` 40 | | `PREMIO.civico[tipo]` |
| Chata deudor (la recupera) | `bravos.js` (≈ 513) `D.n + 10` | lo robado + 10 | `PREMIO.deudor` |
| Jefes, minijefes y leyendas | `jefes2.js`, `jefes3.js`, `armas2.js`, `final.js`, `arpia.js`, `inframundo.js`, `caverna.js`… | **ninguno** (sueltan ítems: trofeos, colmillos, esencia, plumas) | `PREMIO.jefe[tipo]` *(nuevo, 5.3)* |
| Sombras comunes y élites | `entities.js`, `armas3.js` | **ninguno** (solo xp y esencia) | — |

`ventaja.premio` multiplica **solo** a: asedio, apuros, nidos, némesis y Noche de Ceniza (`progreso.js:33`, ×1.25 con la maña `se_le_pega`). Los demás no lo usan: **decidir si el modificador debe ser global** al migrar.

### 1.4 Juegos, fiestas y azar

| Qué | Archivo | Entra | Sale |
|---|---|---|---|
| Rifa Dominical | `rifa.js` | premio chico **10**, el «gordito» **250** | fracción **2** (pulpería y minisúper) |
| Chance (tienda del pueblo) | `pueblo.js` (≈ 558–567) | gordo **40** · 8 · reintegro 2 | **2** |
| Bingo de la iglesia | `bingo.js` | 20 (entre otros premios) | cartón **2** |
| Torneo de pesca | `torneo.js` | 1.º **30** · 2.º 12 · 3.º 5 | inscripción **3** |
| Tiro al blanco | `tiro.js` | peluche | **2** |
| Carreras, concursos, palo encebado, sacos, cintas, mejenga | `carrera.js` 30 · `concurso.js` 20 · `palo.js` 30 · `sacos.js` 10 · `cintas.js` 15 · `mejenga.js` 10 | | |
| Toros | `toros.js` (≈ 86, 197) | `20 + olés·5` (30 s) · 30 (8 s montado) | multa por salirse: `min(15, plata)` (≈ 73) |
| Serenata | `serenata.js` | | propina **2** |
| Influencer | `influencer.js` | «viral» **25** | |

### 1.5 Gastos de servicios, transporte y trámites (sale plata)

| Qué | Archivo · función | Monto hoy | Clave propuesta |
|---|---|---|---|
| Bus | `bus.js` (≈ 173) `max(1, ceil(d/400))` (**d** en bloques) | 1 por cada 400 bloques | `TRANSPORTE.bus(km)` |
| Tren al Caribe | `tren.js` (≈ 31) | **6** | `TRANSPORTE.tren` |
| Globo de Don Fito | `globo.js`, `PRECIO` | **15** | `TRANSPORTE.globo` |
| Llantas | `vehiculos.js` (≈ 140–153) | **10** cada una | `SERVICIO.llanta` |
| Hotel de playa (resort) | `pueblo.js` (≈ 573) · el rótulo del recepcionista (≈ 177: «60 colones») | **60** | `HOSPEDAJE.resort` |
| Cabinas del pueblo | `pueblo6.js` (≈ 568, rótulo) | «4» según el recepcionista | `HOSPEDAJE.cabina` |
| Escritura del lote (trámite) | `pueblo.js` (≈ 592) + `SHOPS.funcionario` | **40** | `TRAMITE.escritura` |
| Timbre fiscal / permiso | `permiso.js` (≈ 59: 2; devuelve 10) · `satira.js` (≈ 56: **20**) | 2 · 20 | `TRAMITE.timbre` |
| Multa del inspector (casa) | `inspector.js`, `MULTA` | **30** (paga 100 al sobrevivir el trámite) | `TRAMITE.multaCasa` |
| Multa a la soda sin permiso | `satira.js` (≈ 73) | `min(15, plata)` | `TRAMITE.multaSoda` |
| «Mordida» al Lic. Porras | `expediente.js`, `MORDIDA` | **100** | `TRAMITE.mordida` |
| Multa por cazar tepezcuintle | `fauna.js` (≈ 619) | `min(10, plata)` | `TRAMITE.multaCaza` |
| Peaje | `pueblo.js` (≈ 603) | **1** | `TRANSPORTE.peaje` |
| Seguro contra Sombras (tío Rigo) | `rigo.js` (`PRECIO` 25; `PRECIO_FINAL` 40) | 25 · 40 | `SERVICIO.seguro`, `SERVICIO.seguroRenovar` |
| Venta del lote (la prima) | `prima.js` (≈ 13: «300 colones») | la prima ofrece **300**; paga 120 | `PRECIO.lotePrima` |
| Fiado (préstamo de la pulpería) | `ui.js:montoFiado` (≈ 44) `10 + min(4, rep/5)·5`; plazo 5 días; atraso → «moroso» | 10–30 | `BANCO.fiado(rep)` |
| Robo de la Chata | `bravos.js` (≈ 242) | un porcentaje de lo que lleva | — |

### 1.6 Banco

`economia.js:banco` (≈ 84–125): depósito (clic con colones en la mano), saldo en `meta.banco`, **interés 3 % por día con tope de 30 colones por día** (≈ 89), logro `ricachon` a 500, retiro. La ventanilla «Cambiar plata» existe en la tienda: `Inventory.cambiar(aBilletes)` deja 20 sueltas. **No hay préstamo bancario** (el único préstamo es el fiado). Hoy `BILLETES = { 387: 100, 386: 50, 385: 20 }` (`inventory.js:7`).

### 1.7 Textos con montos escritos a mano (se desactualizan solos)

Unos **60 textos** repiten el monto dentro de la frase y **hay que sacarlos de la tabla**: p. ej. bingo («vale 2 colones»), `prima.js` («300 colones»), `correo_cartas.js` («40 colones»), `peon.js`, `rigo.js`, `compas.js`, `globo.js`, `panga.js`, `tren.js`, `torneo.js`, `inspector.js`, `permiso.js`, `satira.js`, y las frases de `pueblo.js` (recepcionista «60 colones», «20 colones más»). Los **rótulos de `lujo.js` ya están a precio real** (₡300 000 la noche, ₡250 000 con vista al parqueo, entrada ₡40 000, cóctel ₡6 000, casado de autor ₡15 000, café de especialidad ₡5 000, camiseta ₡28 000, yoga ₡25 000, marina ₡2 000 000, «casado ₡3 000, café ₡900, pipa ₡700» de la soda): hay que **alinearlos con la tabla nueva** (sección 4) o la sátira se contradice con la caja registradora.

---

## 2. ¿Centralizado o disperso? Propuesta de tabla central

**Hoy:** disperso. Cada archivo declara su `COLON = 360`, su monto y su texto. La única «política» centralizada es `ventaja` (multiplicadores) y `economia.js` (precio del día, banco, soda).

**Propuesta: `src/precios.js`** (sin imports del juego, como `progreso.js`; lo usan juego, tiendas, textos y `tools/`):

```js
export const COLON = 360;                      // un solo id para toda la plata
export const K = 800;                          // factor base sobre los montos de la v11.10 (sección 4)
export const MONEDAS = [5, 10, 25, 50, 100, 500];          // ids nuevos
export const BILLETES = [1000, 2000, 5000, 10000, 20000];  // ids nuevos
export const redondeo = (n) => /* «a la tica»: ver 4.1 */;
export const fmt = (n) => `₡${n.toLocaleString('es-CR').replace(/,/g, ' ')}`;   // ₡12 500
export const infl = (g) => 1;                  // opcional (7): 1.02 ** años de juego
export const P = (clave, g) => redondeo(PRECIOS[clave] * infl(g));
```

Con **secciones** (cada clave del cuadro de la sección 1):
- `PRECIO.*` (comida, bebida, pulpería, herramientas, vehículos, lotes): sustituye a `SHOPS[..].sell/buy` (la tabla de tiendas pasa a **referenciar claves**, no a repetir números).
- `TRABAJO.*` (jornada por oficio, mandado, cajuela, guía) y `SUELDO.*` (cuota de vecinos, peones).
- `PREMIO.*` (asedio, apuros, nidos, némesis, luna roja, ceniza, arena, se busca, botín, jefe, cofre, juegos).
- `TRAMITE.*`, `TRANSPORTE.*`, `HOSPEDAJE.*`, `SERVICIO.*`, `BANCO.*`.
- Funciones con día/ola: `PREMIO.asedio(día)`, etc., **fórmulas en un solo sitio**.
- **Textos con plantilla:** `decir(g, m, \`Son ${fmt(P('TRAMITE.escritura'))}…\`)`; una regla de ESLint o una prueba en `tools/` (`revisar-precios.mjs`) que falle si queda `\d+ colones` o `₡\d+` en un literal de `src/` fuera de `precios.js`.
- **Una prueba de coherencia** (heredera de la «regla de oro»): para cada ítem, `compra_tienda_más_barata > venta_tienda_más_cara`; la reescribe sobre la tabla (no con el bucle de pasos de 1).
- `Inventory` usa `MONEDAS`/`BILLETES` y `pagar(monto)` da vuelto con **la menor cantidad de piezas** (la lógica de `Inventory.pagar` y `cambiar` ya existe; hay que pasarla a las nuevas denominaciones).

**Claves** (resumen para la constructora): `PRECIO.{gallo_pinto, casado, café, pipa, ceviche, tamal, tortilla, carne, …}` (una por ítem de `SHOPS`), `PRECIO.{machete, pico_hierro, arco, caña, balde, cama, farol, botiquín, bote, bicicleta, moto, carro, lancha, bidón}`, `TRABAJO.{jornada_peón, jornada_semi, jornada_calificado, jornada_especializado, cajuela, mandado[tipo], guia}`, `SUELDO.{peonDia, peonFinca, cuotaVecinos}`, `PREMIO.{mision, asedio, apuros, nido, nemesis, lunaRoja, ceniza, arena, sebusca[tipo], botin[tipo], jefe[tipo], goleta, ruta[i], racha[d], reto, album, correo, historia[k], cofre[tipo], juego[k]}`, `TRAMITE.{escritura, escrituraMar, timbre, multaCasa, multaSoda, multaCaza, mordida}`, `TRANSPORTE.{bus(km), tren, globo, peaje}`, `HOSPEDAJE.{cabina, resort}`, `SERVICIO.{llanta, seguro, seguroRenovar}`, `BANCO.{interesDia, topeInteres, fiado(rep)}`.

---

## 3. Precios de referencia de Costa Rica (2026)

**Fecha de la búsqueda: noviembre de 2026.** Tipo de cambio de referencia: **₡455,96 por dólar** (octubre de 2026, vía Rio Times/BCCR). Lo que **no** se pudo verificar (no hay fuente pública que encontré) está marcado **«estimación mía»**; son rangos, no cifras.

### 3.1 Datos verificados

| Dato | Valor | Fuente · fecha |
|---|---|---|
| **Salario mínimo diario, trabajador no calificado** | **₡12 436,41** (mensual ₡373 092,30) | Decreto 45303-MTSS (vigente 1-ene-2026, +1,63 %); [WageIndicator](https://wageindicator.org/es-cr/ai/trabajo-en-costa-rica/salario-minimo/), [Alegra](https://blog.alegra.com/costa-rica/salario-minimo-costa-rica/) — *fuentes secundarias; no se abrió el decreto en La Gaceta* · [página del MTSS](https://mtss.go.cr/temas-laborales/salarios/salario_minimo.html) |
| Semicalificado / Calificado / Especializado (jornada diaria) | ₡13 523,69 / ₡13 991,86 / ₡16 244,50 | [Bloomberg Línea](https://www.bloomberglinea.com/latinoamerica/costa-rica/salario-minimo-2026-en-costa-rica-nuevos-montos-para-el-sector-privado/), [WageIndicator](https://wageindicator.org/es-cr/ai/trabajo-en-costa-rica/salario-minimo/) — secundarias; diferencia de céntimos entre sitios |
| Aumento 2027 | **+1,70 %** desde el 1-ene-2027 (decisión unánime del CNS) | [MTSS, comunicado 28-oct-2026](https://www.mtss.go.cr/prensa/comunicados/2026/octubre/cp_022_2026.html) · [Delfino](https://delfino.cr/2026/10/consejo-nacional-de-salarios-aprueba-aumento-de-17-para-salarios-minimos-del-sector-privado) |
| **Monedas**: ₡5, ₡10 y ₡25 del diseño anterior **dejaron de ser medio de pago el 1-jul-2026**; la de ₡5 **no tiene sustituta** (la ₡10 nueva es la más chica); las tarifas de bus, tren, taxi y ferry pasaron a **múltiplos de ₡10** | | [BCCR](https://www.bccr.fi.cr/cr/es/noticias/listado-de-noticias/2026/monedas-de-5-10-y-25-del-diseno-anterior-dejaran-de-funcionar-como-medio-de-pago-el-1-de-julio-del-2.html), [Delfino](https://delfino.cr/2026/06/aresep-ajusta-las-tarifas-de-buses-taxis-ferrocarril-cabotaje-y-peajes-ante-el-retiro-de-las-monedas-de-5), [Teletica](https://www.teletica.com/nacional/cambio-de-antiguas-monedas-de-5-10-y-25-varia-segun-banco-esto-es-lo-que-debe-saber_412712) |
| Bus San José–Puerto Viejo | **₡6 975** (alza de 5,4 % por combustible, desde el 26-may-2026) | [Puerto Viejo Satellite](https://www.puertoviejosatellite.com/en/blog/10157284876709586/) · [Delfino, mayo 2026](https://delfino.cr/2026/05/aresep-aprueba-aumento-en-buses-y-taxis-por-alza-en-combustibles) |
| Bus Cartago–San José (Lumaca) | ₡695 hoy; **pidió ₡1 145** (sin resolver en la búsqueda) | [Delfino](https://delfino.cr/2026/06/lumaca-pide-aumento-en-su-tarifa-pasaje-entre-cartago-y-san-jose-costaria-1145-colones) |
| **Gasolina súper ₡764/L**, regular ₡719, diésel ₡785 (desde el 3-oct-2026; hay ajuste propuesto: súper ₡806) | | [Delfino](https://delfino.cr/2026/10/recope-trabaja-al-costo-que-significa-y-cuanto-representa-en-el-precio-de-los-combustibles), [Rio Times](https://www.riotimesonline.com/costa-rica-gasoline-prices-rise-october-2026/) |
| Inflación interanual | **0,55 %** en octubre de 2026 (0,34 % en septiembre, tras 16 meses negativos); meta del BCCR 3 % (rango 2–4 %); proyección de cierre de 2026 ≈ 1,3 % | [Observador](https://observador.cr/inflacion-sube-a-055-en-octubre-y-acumula-dos-meses-en-terreno-positivo/), [La República](https://www.larepublica.net/inflacion-cerrara-cercana-a-13-en-2026-segun-experto-de-mercado-de-valores/) |
| Ingreso per cápita mensual de los hogares | **₡467 197** (2026; ₡85 054 en el 1.er quintil) | [Semanario Universidad](https://semanariouniversidad.com/pais/en-promedio-cada-hogar-registro-%e2%82%a146-097-mensuales-menos-de-ingreso-en-2026/) (ENAHO) |
| Arroz 1 kg ≈ **₡1 240**, docena de huevos ≈ **₡1 800**, 1 kg de pan ≈ **₡1 600** (sep-2026; **conversión mía** de US$2,72, 3,96 y 3,51 a ₡455) | | [Preciosmundi](https://preciosmundi.com/costa-rica) — *sitio comparativo, no oficial* |
| Casado en soda: **₡1 000** (Mercado Borbón, La Bendición, más el fresco ₡1 375), **₡3 600** (Soda Lorena, con pollo), ₡7 800 (restaurante «típico») | | [La Teja](https://www.lateja.cr/nacional/johnny-araya-perdon-porque-en-pleno-2026/YTQ3UADOLVA2RKZKZHLUUQQ3PY/story/); guía de septiembre 2026 citada por la búsqueda |
| Casado: «₡4 500 a ₡7 500» | | [EnterCostaRica](https://www.entercostarica.com/information/how-much-does-food-cost) *(sin fecha)* |
| Cabinas económicas: **US$46** (Puerto Jiménez) a **US$68** (Bijagua) por noche ≈ **₡21 000 a ₡31 000** | | [KAYAK](https://www.es.kayak.com/Puerto-Jimenez-Hoteles-Cabinas-Tropicales-Puerto-Jimenez.453831.ksp) *(agregador; conversión mía)* |

**No se encontraron** (no hay fuente pública que pude abrir): precios en colones de **herramientas de ferretería**, **animales**, **hospedaje en colones**, **pan, tortilla o gallo pinto de 2026** y el costo mensual de la canasta básica (CBA). El dato más cercano de gallo pinto es de 2022 (₡2 300 en una soda de Heredia, ya viejo).

### 3.2 Lista de unos 30 artículos y servicios (V = verificado arriba · E = **estimación mía**, sin fuente)

| # | Artículo o servicio | Referencia 2026 (₡) | |
|---|---|---|---|
| 1 | Casado en soda | 4 500 (rango 3 600–7 800; baratos 1 000–3 000) | V |
| 2 | Gallo pinto con huevo (desayuno de soda) | 2 500–3 500 | E |
| 3 | Café chorreado o americano de soda | 1 000–1 500 | E |
| 4 | Pipa fría | 700–1 000 | E *(el rótulo de `lujo.js` dice 700)* |
| 5 | Ceviche (porción) | 5 000–6 000 | E |
| 6 | Tamal | 1 500–2 500 | E |
| 7 | Pan (unidad de panadería) | 300–800 | E |
| 8 | Arroz 1 kg / huevos docena / pan 1 kg | 1 240 / 1 800 / 1 600 | V (conversión) |
| 9 | Pasaje de bus urbano corto | 400–700 | E *(los interurbanos: V, 695–6 975)* |
| 10 | Pasaje largo (≈ 200 km) | 6 975 | V |
| 11 | Gasolina súper por litro | 764 | V |
| 12 | Bidón de 5 L de gasolina | ≈ 3 800 | V (764 × 5) |
| 13 | Cabinas económicas, noche | 21 000–31 000 | V |
| 14 | Hotel de lujo, noche | 250 000–300 000 | *(es sátira del juego, no dato)* |
| 15 | Jornada de peón (mínimo no calificado) | 12 436 | V |
| 16 | Jornada semicalificada / calificada / especializada | 13 524 / 13 992 / 16 245 | V |
| 17 | Machete | 7 000–9 000 | E |
| 18 | Pala | 8 000–12 000 | E |
| 19 | Piocha o pico | 12 000–18 000 | E |
| 20 | Martillo | 5 000–8 000 | E |
| 21 | Hacha | 10 000–15 000 | E |
| 22 | Botas de hule | 10 000–15 000 | E |
| 23 | Lámina de zinc (3 m) | 6 000–9 000 | E |
| 24 | Saco de cemento (50 kg) | 6 500–7 500 | E |
| 25 | Gallina | 8 000–12 000 | E |
| 26 | Lechón | 60 000–90 000 | E |
| 27 | Vaca | 600 000–1 000 000 | E |
| 28 | Caballo | 500 000–1 500 000 | E |
| 29 | Bicicleta | 80 000–150 000 | E |
| 30 | Moto usada | 700 000–1 500 000 | E |
| 31 | Carro usado | 3 000 000–8 000 000 | E |
| 32 | Lote rural | 5 000 000–30 000 000 | E |
| 33 | Fracción de lotería / chance | 1 000–2 000 | E |

**Las anclas que dio nanoyackson** (`COLA_DE_TRABAJO.md`): casado ~₡4 500, gallo pinto ~₡3 000, pan ~₡800, café ~₡1 500, machete ~₡7 000, noche de hotel ~₡25 000 (coinciden con los rangos de arriba).

---

## 4. Factor K y tabla «hoy → nuevo»

### 4.1 Cómo se eligió K

Cociente **referencia ÷ precio de hoy** para los artículos con ancla:

| Artículo | Hoy | Referencia | K |
|---|---|---|---|
| Gallo pinto | 3 | 2 500–3 000 | 830–1 000 |
| Casado | 6 | 4 500 | 750 |
| Café chorreado | 2 | 1 500 | 750 |
| Pipa fría | 2 | 700–1 000 | 350–500 |
| Machete | 15 | 7 000 | 470 |
| Pico de hierro | 25 | 12 000–18 000 *(real)*; 45 000 *(por ritmo, ver 5.3)* | 480–1 800 |
| Noche de hotel (cabina) | 60 | 25 000 | 420 |
| Bicicleta | 30 | 80 000–150 000 | 2 700–5 000 |
| Moto | 180 | 700 000–1 500 000 | 3 900–8 300 |
| Carro viejo | 300 | 3 000 000+ | 10 000+ |

**K = 800** es el centro de la comida y las herramientas (la media geométrica de los ocho primeros es ≈ 650; con la comida sola, ≈ 830). Es un **factor único para todo lo que hoy está a escala de juego**; los artículos cuya razón real se aleja mucho (vehículos, lotes, camas, botes, machete, hotel) se fijan con **ancla explícita**: la razón (precio ÷ jornada) manda, y la jornada es la de ₡12 500.

**Redondeo «a la tica»** (`redondeo(n)` en `precios.js`):

| Magnitud | Múltiplo |
|---|---|
| < ₡200 | ₡10 |
| ₡200–₡999 | ₡50 |
| ₡1 000–₡4 999 | ₡100 (₡500 en comida de plato) |
| ₡5 000–₡9 999 | ₡500 |
| ₡10 000–₡49 999 | ₡500 (₡1 000 desde ₡30 000) |
| ₡50 000–₡999 999 | ₡5 000 (₡10 000 desde ₡200 000) |
| ≥ ₡1 000 000 | ₡50 000 |

Los precios **no terminan en ₡5** (como las tarifas desde julio): el ₡5 queda para el vuelto, las propinas y los premios de reintegro (decisión de nanoyackson, 1.8).

### 4.2 Tabla «hoy → nuevo» (los 40 montos más usados)

*Hoy* es el monto de la v11.10 por lote o unidad. *K=800* es la multiplicación directa. *Nuevo* es el valor propuesto (redondeado, con ancla si la hay).

| # | Concepto (archivo) | Hoy | ×K | **Nuevo** | Nota |
|---|---|---|---|---|---|
| 1 | Gallo pinto (`pulpero`, `panadera`) | 3 | 2 400 | **2 500** | |
| 2 | Tortilla ×2 | 2 | 1 600 | **1 500** | |
| 3 | Café chorreado | 2 | 1 600 | **1 500** | |
| 4 | Pipa fría | 2 | 1 600 | **1 000** | ancla (K≈500) |
| 5 | Casado (La Bendición) | 6 | 4 800 | **4 500** | ancla nanoyackson |
| 6 | Gallo pinto con huevo | 5 | 4 000 | **3 500** | |
| 7 | Ceviche | 6 | 4 800 | **5 000** | |
| 8 | Pescado frito | 4 | 3 200 | **3 500** | |
| 9 | Tamal | 5 | 4 000 | **2 500** | ancla |
| 10 | Churchill / copo | 3 / 2 | 2 400 / 1 600 | **2 500 / 1 500** | |
| 11 | Carne cruda ×3 | 4 | 3 200 | **3 000** | |
| 12 | Fracción de rifa / chance / cartón de bingo | 2 | 1 600 | **1 000** | ancla (lotería) |
| 13 | Tiro al blanco | 2 | 1 600 | **1 500** | |
| 14 | Timbre fiscal (`permiso`) / timbre (`satira`) | 2 / 20 | 1 600 / 16 000 | **1 500 / 15 000** | |
| 15 | Machete | 15 | 12 000 | **7 500** | ancla nanoyackson (K≈500) |
| 16 | Caña de pescar | 8 | 6 400 | **6 500** | |
| 17 | Balde | 8 | 6 400 | **6 500** | |
| 18 | Antorcha ×8 | 3 | 2 400 | **2 500** | |
| 19 | Farol | 14 | 11 200 | **11 000** | |
| 20 | Cama | 10 | 8 000 | **25 000** | ancla (2 jornadas) |
| 21 | **Pico de hierro** | 25 | 20 000 | **45 000** | ancla de ritmo (3.6 jornadas) |
| 22 | Arco | 12 | 9 600 | **35 000** | ancla de ritmo (2.8 jornadas) |
| 23 | Botiquín | 12 | 9 600 | **9 500** | |
| 24 | Suero antiofídico | 8 | 6 400 | **6 500** | |
| 25 | Bote de remos | 10 | 8 000 | **60 000** | ancla (≈ 5 jornadas) |
| 26 | Bicicleta | 30 | 24 000 | **85 000** | ancla |
| 27 | Moto | 180 | 144 000 | **900 000** | ancla; **decide nanoyackson** (72 jornadas) |
| 28 | Carro viejo | 300 | 240 000 | **2 500 000** | ancla; **decide nanoyackson** (200 jornadas) |
| 29 | Lancha con motor | 150 | 120 000 | **1 500 000** | ancla |
| 30 | Bidón de combustible (`pistero`) | 8 | 6 400 | **4 000** | ancla (5 L a ₡764) |
| 31 | Pasaje de tren | 6 | 4 800 | **2 500** | E |
| 32 | Pasaje de bus | `ceil(d/400)` | | **`max(400, redondeo10(35 × km))`** | 100 km → ₡3 500 |
| 33 | Vuelta en globo | 15 | 12 000 | **12 000** | |
| 34 | Peón por el día | 10 | 8 000 | **12 500** | = 1 jornada |
| 35 | Peón de finca (una vez) | 40 | 32 000 | **30 000** | |
| 36 | Seguro de Rigo / renovación | 25 / 40 | 20 000 / 32 000 | **20 000 / 30 000** | |
| 37 | Escritura del lote (pueblo) | 40 | 32 000 | **400 000** | ancla de ritmo (32 jornadas); con vista al mar hoy 999 → **1 600 000** |
| 38 | Noche de cabina / resort | 60 | 48 000 | **25 000 / 250 000** | cabina ancla (V); resort = el «₡250 000 con vista al parqueo» del rótulo |
| 39 | Multa inspector / mordida | 30 / 100 | 24 000 / 80 000 | **25 000 / 75 000** | |
| 40 | Fiado | 10–30 | 8 000–24 000 | **10 000–25 000** | |
| 41 | Cuidacarros / vendedor de agua o maní | 1 | 800 | **500 / 1 000** | |
| 42 | Interés del banco (tope diario) | 30 | 24 000 | **25 000** | 3 %/día se mantiene |

**Efectos de las anclas** (lo único que cambia razones y obliga a remedir): el machete queda **~⅓ más barato** que el resto (7 500 en vez de 12 000: sigue siendo el arma de entrada); el pico y el arco quedan **más caros** (×2.2 y ×3.6 respecto de K) para que una herramienta buena sean 3–5 jornadas; vehículos, lotes y camas suben mucho para tener sentido de «meses»; hotel y bidón bajan. **Antes de aplicar, `tools/bot-pelea.js`/`BALANCE.md` deben decir cuántos días de juego tarda un jugador medio en juntar ₡45 000** (el sistema actual da por día de juego unos 30–80 colones de juego en total, «por medir»: de ahí sale ≈ ₡24 000–64 000 al día con K=800; si es mucho más, el pico tarda menos de 1 jornada y hay que subir las anclas).

---

## 5. Curva de ingresos propuesta

**Unidad:** una **jornada = un día de juego** (`DAY_LENGTH = 1 200 s`, 20 minutos reales) de trabajo honrado.

### 5.1 Jornada por oficio (alineada con el MTSS 2026)

| Oficio (en el juego) | Categoría MTSS | Jornada | Cómo se paga por unidad (ejemplo) |
|---|---|---|---|
| Peón, recolector, mandados del pueblo, cajuelas de café | No calificado | **₡12 500** | Cajuela llena **₡2 000** (≈ 6–7 por jornada); mandado de 8 mazorcas ₡5 000; de 12 granos de café ₡8 000 |
| Pescador de panga, soda propia, peón de la casa | Semicalificado | **₡13 500** | Pescado: 2 por ₡1 500; plato de la soda = su precio de lista |
| Herrero (Tino), cocinera (Chepa), curandera (Flor), reparaciones | Calificado | **₡14 000** | Reparar un arma = 8–15 % de su precio |
| Guía de turistas, vigilante (Wilber), minero (Don Eliseo) | Especializado | **₡16 250** | Tour: `₡12 500 + distancia` |
| **Peligroso** (mina de oro, cacería de cartel, pesca de altura) | Especializado ×1.5–2.2 | **₡25 000–₡35 000** | «Se busca», minijefes |

Con esto, **«trabajar un día» = ₡12 500–16 250**, y el «Se busca» (5.2) paga lo de 3–6 jornadas por una pelea difícil.

### 5.2 Recompensa por matar, según el peligro

| Nivel | Quién | Hoy | **Propuesta** |
|---|---|---|---|
| T0 | Sombras comunes, hondera, brincona, arañas, sapos, ciempiés, luz mala, escarabajo, tenaza, mansos | ninguno | **₡0** (xp y esencia). *Matar animales mansos no paga* |
| T1 | Bravos sueltos: Chupacabras, Mico Malo, Bécquer, Cuche, Puma, **Chata** | Chata 3–12 · Mico 2–8 | **₡2 500–10 000** de botín (mismo rango por ×800 en Chata y Mico) |
| T2 | Élites: Sombra grande/2★/escudo, **Toro Guaco** | ninguno | **₡2 000–6 000** |
| T2' | **«Se busca»** (cartel) | 40–90 | **₡30 000–70 000**: Mico 30 000 · Bécquer 35 000 · Chata 40 000 · Puma 45 000 · Chupacabras 50 000 · Cuche 55 000 · **Toro Guaco 70 000** |
| T3 | Minijefes: Terciopelo reina, Jaguar viejo, Cocodrilo del Tárcoles | ninguno | **₡25 000–40 000** |
| T4 | Leyendas: Cadejos, Segua, Llorona, Mona, Viejo del Monte, Tulevieja; Mono congo | Mona 8–16 · Mono congo 8–15 | **₡20 000–45 000** |
| T5 | Jefes del monte (6) | ninguno | **Reina Bananera 60 000 · Cascabel 75 000 · Don Cornudo 75 000 · Tata Sapo 85 000 · Cangrejo Rey 95 000 · Ciempiés Rey 110 000**; revancha ×1.5 |
| T5' | Capitán de la goleta | 120 | **100 000** (cofre) |
| T6 | Murciélago Rey · Señor del Arenal · Arpía · Jefa de Ventanilla · El Olvido · **Sombra Madre** | ninguno | **60 000 · 120 000 · 150 000 · 80 000 · 150 000 · 200 000** |
| T7 | **Rey Zopilote** | ninguno | **₡500 000** (+ créditos y trofeo) |

**Los premios por defensa y por fórmula** (asedio, apuros, nidos, némesis, luna roja, ceniza, arena) **suben con K = 800** (misma curva, sin re-diseño): p. ej. el asedio del día 10 pasa de 32 a **₡25 600 ≈ ₡25 500**, el del día 30 de 72 a ₡57 600 ≈ **₡57 500**. Redondear **después** de aplicar `ventaja.premio`.

### 5.3 Ritmo: qué se compra con cuántas jornadas (jornada de ₡12 500)

| Meta de ritmo de nanoyackson | Costo nuevo | Jornadas | ¿Cumple? |
|---|---|---|---|
| **Un día cubre la comida del día y sobra algo** | Gallo pinto 2 500 + casado 4 500 + café 1 500 = **₡8 500** | 0.7 | ✔ sobran ₡4 000 |
| Herramienta básica (machete) | 7 500 | 0.6 | ✔ |
| **Herramienta buena = 3–5 días** | Pico de hierro **45 000** (3.6) · arco 35 000 (2.8, *un poco corto*: subir a 40 000 si se quiere ≥ 3) | 3–4 | ✔ |
| Cama / bote / bici | 25 000 / 60 000 / 85 000 | 2 / 4.8 / 6.8 | ✔ (una semana la bici) |
| Cabina una noche | 25 000 | 2 | ✔ (dormir en casa sigue siendo gratis: razón para tener casa) |
| **Casa o lote = semanas** | Escritura **400 000** | 32 → **≈ 4½ semanas de 7 días** | ✔ |
| Moto / carro | 900 000 / 2 500 000 | 72 / 200 | meses: **decide nanoyackson** si son aspiracionales |

**No rompe el balance de progresión** porque: (1) los precios y los ingresos de fórmula se multiplican por el **mismo** K; (2) la «regla de oro» (nada se compra y revende con ganancia) se conserva (tabla coherente por prueba); (3) las anclas de herramientas (pico, arco) **suben** el costo del equipo de entrada: es lo que hay que **medir con el bot** (`BALANCE.md`, escenarios por días) antes de dar la versión por buena; (4) el dinero de los **jefes (nuevo)** suma como mucho **₡500 000 de los seis del monte** + ₡0.9 M del tramo final: caben «unas 3 semanas de trabajo» y compran lo que de otra forma pide 6–10 semanas (es decir, **aceleran** el final del juego; si no se quiere, bajar los premios de jefe a la mitad o pagarlos en objetos).

### 5.4 Inflación del juego (opcional, con interruptor)

`infl(g) = 1.02 ** floor(g.day / 120)` (≈ 2 % cada «año» de juego de 120 días), igual para **precios** y **sueldos/premios**; cifras de 2026: inflación 0,55 % (oct), meta del BCCR 3 %, aumento del mínimo 1,70 % para 2027. Con el interruptor apagado, `infl = 1`. **Anotar el balance** si se activa. Un guiño satírico posible: la moneda de ₡5 «ya no vale afuera».

---

## 6. Migración de guardados (para que no se pierda ni se multiplique mal)

Subir `SAVE_FORMAT` (hoy **2**) con un paso en `save.js:migrate`:

1. **Inventario del jugador** (`meta.inventory.slots`): sumar `monedas (id 360) + billetes (385–387)`, multiplicar por **K = 800**, y **reconvertir a la menor cantidad de piezas** nuevas (`₡20 000`, `₡10 000`, … `₡5`). Si las casillas no alcanzan, el resto va al **banco** (`meta.banco`) con aviso.
2. **Escalar a mano** (cada uno es un entero guardado): `meta.banco`, `meta.fiado`, `meta.sebusca.premio`, `meta.chataDeudor.n`, `meta.tour.pago`, `M.rifa…`, `meta.nemesis…` (si guarda montos), `meta.ceniza.record` (es de olas, **no** de plata: no tocar).
3. **Cofres y baúles guardados** (`be.slots` con `id === 360` en `chunks.be`): multiplicar y repartir en pilas nuevas (afecta a **todos los cofres de las estructuras**, los de misión, el del bolso y los de la casa).
4. **Objetos sueltos** en el suelo con id 360 (`entities`): no se guardan, no hace falta.
5. **Ids de los billetes viejos** (385–387: ₡20/50/100): como pasan a ser denominaciones **nuevas**, la migración los **reemplaza** por las piezas nuevas equivalentes; el arte viejo se retira.
6. **Prueba de migración:** un mundo de la v11.9 con `/prueba colones 5000`, un cofre con 40 colones, 100 en el banco y el fiado activo debe cargar con **suma × 800 exacta** (billetes + monedas + banco + cofres) y sin objetos duplicados ni perdidos.

**Otros cuidados:**
- `COLON.stack = 999` y la pila de ₡500: con `K = 800` las pilas de monedas **dejan de ser el cuello** (se paga con billetes).
- `Inventory.pagar` hoy paga **primero con monedas**; con billetes de ₡20 000 conviene pagar **primero con la mejor combinación** (menos piezas) y dar el vuelto **sin dejar monedas de más**.
- `ui.js`: `$('#shop-colones').textContent = \`${money} colones\`` y los precios de fila (`.p b`): mostrar con **separador de miles** (`fmt`).
- **Textos con monto** (1.7): pasarlos a plantilla en el mismo cambio, o quedan desfasados.

---

## 7. Qué dejo marcado como decisión de nanoyackson o por confirmar

1. **¿Moneda de ₡5?** (el BCCR la retiró en julio de 2026): empezar en ₡10, o dejar la de ₡5 como detalle de época.
2. **Moto y carro:** ¿aspiracionales (meses) o más baratos (semanas)?
3. **Resort vs cabina** (₡250 000 / ₡25 000) y el lote con vista al mar (₡1 600 000).
4. **¿`ventaja.premio` global?** Hoy solo afecta a 5 de las ~25 fuentes.
5. **Premios de jefe:** son plata nueva en el sistema (ver 5.3); ¿completos, a la mitad o en objetos?
6. **Inflación del juego:** ¿sí o no, y a qué ritmo?
7. **Por confirmar** con el bot y jugando: cuántos colones por día de juego gana hoy un jugador medio (de esto depende que el pico a ₡45 000 sea «3–5 días»); la lista completa de tiendas de `origen.js` y de `feriante`; las fórmulas de `toros.js` fuera de las dos leídas; los montos de `satira.js` más allá de timbre y multa.

---

## 8. Fuentes

[MTSS, comunicado de octubre de 2026 (+1,70 % para 2027)](https://www.mtss.go.cr/prensa/comunicados/2026/octubre/cp_022_2026.html) · [MTSS, salario mínimo](https://mtss.go.cr/temas-laborales/salarios/salario_minimo.html) · [WageIndicator: salario mínimo](https://wageindicator.org/es-cr/ai/trabajo-en-costa-rica/salario-minimo/) · [Bloomberg Línea: salario mínimo 2026](https://www.bloomberglinea.com/latinoamerica/costa-rica/salario-minimo-2026-en-costa-rica-nuevos-montos-para-el-sector-privado/) · [BCCR: retiro de las monedas de ₡5, ₡10 y ₡25](https://www.bccr.fi.cr/cr/es/noticias/listado-de-noticias/2026/monedas-de-5-10-y-25-del-diseno-anterior-dejaran-de-funcionar-como-medio-de-pago-el-1-de-julio-del-2.html) · [Delfino: tarifas redondeadas por el retiro de las monedas](https://delfino.cr/2026/06/aresep-ajusta-las-tarifas-de-buses-taxis-ferrocarril-cabotaje-y-peajes-ante-el-retiro-de-las-monedas-de-5) · [Delfino: gasolina y diésel (oct-2026)](https://delfino.cr/2026/10/recope-trabaja-al-costo-que-significa-y-cuanto-representa-en-el-precio-de-los-combustibles) · [Rio Times: gasolina octubre 2026](https://www.riotimesonline.com/costa-rica-gasoline-prices-rise-october-2026/) · [Observador: inflación de octubre](https://observador.cr/inflacion-sube-a-055-en-octubre-y-acumula-dos-meses-en-terreno-positivo/) · [La República: proyección 2026](https://www.larepublica.net/inflacion-cerrara-cercana-a-13-en-2026-segun-experto-de-mercado-de-valores/) · [Semanario Universidad: ingreso per cápita 2026](https://semanariouniversidad.com/pais/en-promedio-cada-hogar-registro-%e2%82%a146-097-mensuales-menos-de-ingreso-en-2026/) · [Preciosmundi: Costa Rica](https://preciosmundi.com/costa-rica) · [La Teja: casado de ₡1 000](https://www.lateja.cr/nacional/johnny-araya-perdon-porque-en-pleno-2026/YTQ3UADOLVA2RKZKZHLUUQQ3PY/story/) · [EnterCostaRica: costo de la comida](https://www.entercostarica.com/information/how-much-does-food-cost) · [KAYAK: cabinas Puerto Jiménez](https://www.es.kayak.com/Puerto-Jimenez-Hoteles-Cabinas-Tropicales-Puerto-Jimenez.453831.ksp).
