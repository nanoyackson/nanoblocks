# Plan maestro 4 — «Pura vida, pero más» (desde el 7-nov-2026, v2.80+)

El plan 3 quedó completo en la v2.79. nanoyackson pidió seguir sin parar y sin pedir aprobación: más contenido exagerado,
más pulido, más dinámicas. Mismas reglas: cada versión con lint y build en cero, prueba en el navegador (pestaña
aparte), CHANGELOG, `version.js`, árbol, commit con etiqueta. Estado: ✅ hecho · 🔨 en curso · ⏳ pendiente.

## E0 · Técnico (destraba todo lo demás)
- ✅ **Bloques de 16 bits**: los IDs de bloque se acabaron (solo quedan 214 y 255). Chunks en `Uint16Array`, tablas
  de bloques de 1024, y un rango nuevo para bloques extendidos (600–1023) sin tocar los ítems (256–599). Los mundos
  guardados no cambian (los cambios del jugador ya se guardan como números sueltos). Revisar todos los `< 256`.
- ✅ Medido (v2.80, en un pueblo): todos los `tick*` de cada segundo juntos cuestan ~0,7 ms; un cuadro completo ~7 ms. No hace falta optimizar.

## E1 · Transporte
- ✅ Bicicleta (rápida en calle, lenta en barro) y moto (con gasolina, como el carro).
- ✅ El tren al Caribe (pasaje con el jefe de estación, 3.4).
- ✅ Lancha por los canales de Tortuguero (lancha con motor, 2.82).

## E2 · Clima extremo
- ✅ Erupción del volcán: ceniza que cae y cubre el suelo (las bombas de lava ya existían).
- ✅ Rayos que queman árboles en las tormentas.
- ✅ Sequía en Guanacaste: ríos más bajos, cosechas más lentas, ganado con sed.
- ✅ Huracán ficticio en el Caribe (vientos que empujan, techos de zinc que vuelan).

## E3 · Mazmorras y jefes
- ✅ Caverna profunda (estilo Barra Honda) con salas, trampas, cofres y un jefe: el Murciélago Rey.
- ✅ Templo hundido con la Sirena del río (la Sirena en 2.99, el templo en 3.0, generador v14).
- ✅ Jefe de la Llorona en su forma completa, de noche en el río, con fases.

## E4 · Oficios
- ✅ Cafetalero: cogida de café por cajuela, el beneficio paga por cajuela.
- ✅ Pescador profesional: redes que se dejan en el agua y se recogen.
- ✅ Minero de oro de Abangares: batea en los ríos.
- ✅ Guía turístico: llevar turistas (NPC) a lugares y cobrar.

## E5 · Mascotas
- ✅ Loro que repite frases ticas y se para en el hombro.
- ✅ Perezoso mascota que va colgado de la mochila (calma permanente suave).
- ✅ Nombres para las mascotas (con un cartelito).

## E6 · Multitudes y eventos
- ✅ Partido de fútbol en el estadio con barras, goles y la ola.
- ✅ Tope de caballos y carnavales de Limón (comparsas con tambores).
- ✅ Concierto de marimba en el templo de la música (la retreta ya existía).

## E7 · Sátira (todo ficticio)
- ✅ «La platina»: un puente con una platina floja que suena y se arregla cada año.
- ✅ La presa eterna de la circunvalación ficticia (una calle donde siempre hay presa).
- ✅ Trámites para el permiso de la soda propia («falta un sello»).

## E8 · Mundo
- ✅ Rafting en ríos con rápidos (el bote baja solo con la corriente).
- ✅ Cataratas grandes con cueva detrás (generador v15).
- ✅ Cuevas de cristal con luz propia (generador v13).

## E9 · Calidad de vida
- ✅ Modo foto (F2): cámara libre, zoom y captura con Enter.
- ✅ Marcadores con nombre en el mapa (Shift+B).
- ✅ Atajos configurables (Ajustes → Teclas).

## E10 · Historia
- ✅ Diario del aventurero que se va escribiendo solo con lo que pasa (N).
- ✅ Un guía (personaje) que aparece al inicio y da misiones de la ruta.
