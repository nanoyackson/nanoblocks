# Revisión v12.8.5 + v12.8.6 (versión corta: críticos y medios)

Solo lectura; nada probado en el navegador (lo marcado «por confirmar» va a tab-1). Líneas aproximadas.

**No se encontró nada que pise o borre un mundo existente** (`importarUno`, save.js:214, siempre crea id nuevo). Sin críticos puros.

## Medios

1. **Respaldo sin tope, puede ser inimportable** — save.js:188 (`descargarRespaldo`) mete todos los mundos en un solo `JSON.stringify`: puede fallar con «Invalid string length», o generar > 256 MB que `importWorld` (save.js:200) rechaza.
   Arreglo: medir tamaño al armar; un archivo por mundo o por lotes < 200 MB; misma constante de tope en exportar e importar.

2. **Importación no atómica y errores mudos** — `saveWorld` escribe meta antes que chunks (save.js:135-143): si falla a mitad queda un mundo vacío que parece restaurado. El `catch {}` de save.js:207 oculta mundos corruptos o de versión futura; el toast dice «Respaldo cargado: N» sin contar los saltados.
   Arreglo: chunks primero y meta al final (o borrar al fallar); devolver `{hechos, fallidos:[{nombre, motivo}]}` y mostrarlo.

3. **Falso positivo del aviso de «mundos perdidos»** — ui.js:375-384: la cookie `nanoblocks_mundos` se comparte entre puertos del mismo host pero IndexedDB no; abrir otro puerto (p. ej. `vite preview`) avisa que se perdieron.
   Arreglo: guardar origen/puerto en la cookie y avisar solo si coincide; permitir descartar el aviso.

4. **Cocodrilo (por confirmar)** — armas2.js:184-198 / fauna.js:261-292. Nadando (2.37 m/s, sprint 3.09) el aviso de 1 s sale del anillo (r 1.8) salvo pegado al centro (necesita 1.8 m; con 0.3 s de reacción andando no llega).
   Arreglo si falla en tab-1: aviso 1.2 s o anillo 1.5.

5. **Bloom de día en cuevas (por confirmar)** — postfx.js:81-82 usa `g.daylight` global: en cuevas de día el umbral sube y los emisores casi no brillan.
   Arreglo: luz del cielo en la cámara o `uDaylight` local.

6. **Pescador con lujo 51.7 u/día (meta 42–48)** — pueblo.js:297-301, bot-economia.js:100: la ganancia extra viene del segundo cupo (`${id}L`), no del precio.
   Arreglo: cupo compartido del pescado (clave común, p. ej. `mar:${id}`, en ui.js:1399 y sin la `L` en el bot); estimado ~48. Alternativa: cupo propio del lujo de ~15 u. Por confirmar con el bot en el navegador.

## Resumen de 5 líneas

1. Nada pisa ni borra mundos; sin críticos.
2. v12.8.5: respaldo sin tope (puede no poder importarse), importación no atómica con errores mudos, aviso falso entre puertos.
3. Cocodrilo: 1 s alcanza nadando salvo pegado al centro; confirmar en tab-1.
4. Bloom de día usa luz global (cuevas); luces y hombro por lo demás correctos.
5. Pescador con lujo se pasa por el segundo cupo: compartir el cupo del pescado.
