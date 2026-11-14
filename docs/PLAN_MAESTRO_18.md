# Plan maestro 18 — «Que valga la pena sobrevivir» (desde el 8-nov-2026, v3.60+)

nanoyackson pidió (8-nov): más contenido de supervivencia, mejor calidad de vida, mejor historia, mejor sentido de progresión y
balancear el juego en supervivencia. Reglas de siempre: lint y build en cero, prueba en pestaña aparte (borrando el mundo de
prueba), animaciones suaves, sonidos reales CC0, CHANGELOG, `version.js`, árbol y commit con etiqueta. Sátira ficticia. No
detenerse a preguntar. Estado: ✅ hecho · 🔨 en curso · ⏳ pendiente.

## A · Calidad de vida
- ✅ Reparar herramientas y armadura en la cuadrícula; juntar dos gastadas iguales (v3.60).
- ✅ La herramienta rota se reemplaza sola; aviso cuando está por romperse (v3.60).
- ✅ Ficha completa al pasar sobre un objeto; letrerito de lo que se mira y el pico que pide (v3.60).
- ✅ Objetivo siempre en pantalla (v3.60).

- ✅ Avisos en fila, comer rápido, resembrar con azada y la dirección del golpe (v3.73).
- ✅ Recoger el bolso de un clic y destino en el mapa (v3.76).

- ✅ Pendientes y lo que viene, en la hoja de la partida (v3.95).

- ✅ La ficha de cada objeto dice de dónde sale y para qué sirve (v3.99).

- ✅ Hoja de Ayuda y consejo en la pantalla de muerte (v4.5).

- ✅ Traer de los cofres lo que falta a la receta fijada (v4.9).

## B · Balance
- ✅ Auditoría de números y ajustes de supervivencia: economía sin dinero infinito, sed, luz contra Sombras, cama temprana, armas, armadura, parry, zancudos y frío (v3.62; ver `docs/BALANCE.md`).

## C · Progresión
- ✅ Cada meta de la ruta da recompensa; rangos con ventajas (v3.63).
- ✅ Corazones extra como recompensa de los grandes jefes (v3.61).

- ✅ Mañas: una decisión de personaje cada tantos niveles (v3.91).

- ✅ Álbum de estampas de Tiquicia (v4.8).

- ✅ Nivel 5 de la casa, «La casa de todos», y postales para el álbum (v4.18).

## D · Historia: «Las cartas de la abuela»
- ✅ (v3.61) Campaña por capítulos: la herencia de la abuela Zenaida, la casa que se arregla, el Corazón de Tiquicia partido en cuatro pedazos que guardan los jefes, y una noche final en casa.
- ✅ Pantalla de cartas y sección para releerlas (v3.61).

- ✅ Los cigarros de Anselmo: libreta en cada pedazo, carta oculta, la Grieta, El Olvido y la escena con Rigo (v3.93).

- ✅ La Ruta del Progreso: firmas, escritura y audiencia con tres salidas (v3.95).

- ✅ Sueños al dormir y recuerdos en la casa (v3.97).

- ✅ La prima Marielos: ofertas, sobre, carta y ayuda en la Noche Larga (v4.0).

- ✅ Don Chema y el correo: cartas, regalos, la otra chancleta y la hija de Tino (v4.2).

- ✅ Los noventa de Doña Eulalia y la carta de Don Tobías (v4.5).

- ✅ Epílogo con los números de la partida y créditos (v4.6).

## E · Más supervivencia
- ✅ Trampas, nasa de pesca, barril de lluvia, estacas y fiebre con su remedio (v3.64).
- ✅ Carpa de campamento y casa por niveles (v3.66).
- ✅ Cencerro de alarma y asedios a la casa, con puertas que se tumban (v3.67).
- ✅ El pueblo comenta la historia, Doña Eulalia sigue dando consejos, tumba de la abuela y el final cambia el mundo (v3.67).

- ✅ Nidos de Sombra, aceite de filo y farol de Zenaida (v3.68).
- ✅ Racha de días sin morir, resumen del amanecer y pueblo en apuros (v3.68).
- ✅ Cuaderno de la abuela con 12 hojas, platos con efecto y candela de regreso (v3.69).
- ✅ Yunque con mejoras de equipo, historia del tío Rigo con su seguro, y compostera (v3.70).
- ✅ El Canelo, Sombras ladrona y grande, buhonero y retos de la semana (v3.72).
- ✅ Los cinco escondites de Zenaida con reliquias y la chancleta (v3.74).
- ✅ Pierna quebrada, derrumbes y puntales; el Corazón después del final y la Noche de Ceniza (v3.75).
- ✅ La tranca y el peón de la finca (v3.76).
- ✅ Trofeos de jefes y Casa de leyenda (v3.80).
- ✅ Hallazgos al caminar (v3.81).
- ✅ Boca de mina y Yendry con la carta propia (v3.87).

- ✅ La Sombra que lo mata se queda con nombre y vuelve (v3.92).

- ✅ Plato servido: las Sombras comen y se sabe quiénes eran (v3.94).

- ✅ Rescates y gente que se viene a vivir a la casa (v3.96).

- ✅ Encargos personales, mirador y mesa larga (v3.99).

- ✅ El Archivo Municipal: mazmorra, Jefa de Ventanilla y Sello de goma (v4.3).

- ✅ Olla caliente, alambre, ayuda de la gente en la pelea y Sombra apagadora (v4.4).

- ✅ La cabeza de agua (v4.10).

## F · Probar jugando
- ✅ Bot de balance que mide las peleas (`tools/bot-pelea.js`) y ajustes con lo que encontró (v3.68; tabla en `docs/BALANCE.md`).
- ✅ Balance con equipo mejorado, platos y hojas (v3.71).
- ✅ Comandos `/prueba` y `docs/GUIA_DE_PRUEBA.md` (v3.87).
- ⏳ Una partida real de punta a punta: el bot mide peleas, no cuánto tarda cada capítulo ni si se entiende qué hacer.

## G · Revisión
- ✅ Revisión independiente del código de la v3.68 a la v3.76: 12 errores encontrados y corregidos (v3.82).
- ✅ Segunda revisión, de la v3.76 a la v3.82: 10 errores más, varios causados por los arreglos anteriores (v3.86).
- ✅ Revisiones automáticas de recetas y datos (v3.84, v3.85).
- ✅ Auditoría de la historia como jugador nuevo: 14 arreglos (v3.90).

- ✅ Tercera revisión independiente, de la v3.86 a la v3.91: 8 arreglos, entre ellos la misión de Yendry (v3.93).

- ✅ Cuarta revisión independiente, de la v3.91 a la v3.96: 15 arreglos (v3.98).

- ✅ Quinta revisión, de código y de toda la trama, de la v3.98 a la v4.0: 24 arreglos (v4.1).

- ✅ Sexta revisión, de la v4.1 a la v4.4, simulando el Archivo en 107 mundos: 15 arreglos (v4.7).

- ✅ Séptima revisión, de la v4.5 a la v4.9: 8 arreglos, entre ellos el escudo que no bloqueaba mirando al enemigo (v4.14).

- ✅ Octava revisión, de la v4.10 a la v4.16: 12 arreglos (v4.17).
- ✅ Novena revisión, de la v4.17 a la v4.20: 6 arreglos, y el build otra vez sin advertencias (v4.21).
- ✅ Quemas de verano en el bosque seco: humo, baldazos, cortafuegos y la brigada (v4.22).
- ✅ El monte quemado rebrota con la lluvia (v4.23).
- ✅ Bomba de espalda de la brigada, a la tercera quema apagada (v4.24).
- ✅ Décima revisión, de la v4.21 a la v4.24: 10 arreglos (v4.25).
- ✅ Generador v16: ríos que no quedan colgados en cerros y volcanes (v4.26, pedido de nanoyackson).
- ✅ Carne cruda y cuero, ya no «de danta» (v4.27); barrerse con Z (v4.28); noches bravas con la Sombra brincona (v4.29). Pedidos de nanoyackson.
- ✅ Lo de la mano con grosor y nítido (v4.30, pedido de nanoyackson).
- ✅ Criaturas bravas: saínos, chupacabras, Toro Guaco y los Chatas (v4.31, pedido de nanoyackson).
- ✅ De la lista de ideas de nanoyackson: cuche de monte, Mico Malo y bécquer (v4.32); Segua con pavor, Padre con báculo y agua bendita, Llorona que jala al agua, Cadejos que huele guaro y plata, llanto de la Tulevieja (v4.33).
- ✅ Veneno que baja la vida máxima (terciopelo + guaco) y vuelta de la muerte del cocodrilo común (v4.34).
- ✅ La neblina del Cerro de la Muerte con almas en pena, los gases del cráter y la mascarilla (v4.35).
- ✅ Undécima revisión (v4.26 a v4.35): 10 arreglos, más trofeos nuevos y bestiario (v4.36).
- ✅ El puma (v4.37) y la marabunta (v4.38).
- ✅ Medidas con el bot las primeras noches después de v4.29 (en BALANCE.md, 9-nov).

## Después (ambientación que quedó para luego)
- ✅ Pescador de atarraya; cangrejos y ermitaños; pizotes en manada (v3.71).
