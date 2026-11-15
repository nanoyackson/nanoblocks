# NanoBlocks — índice

Juego voxel propio (estilo sandbox de bloques, **no** copia de ningún juego existente: nombres, arte, criaturas y look son originales).
Vite + three.js, sin backend. Mapa completo: `docs/ARBOL_CONOCIMIENTO.md`.

- Correr: `npm run dev` (puerto 5199). Terminado = `npm run lint` y `npm run build` en cero warnings + probado en el navegador.
- Cada idea nueva: subir `GAME_VERSION` en `src/version.js`, sumar entrada al `CHANGELOG` (archivo y constante) y actualizar el árbol.
- Cambio en lo que se guarda → subir `SAVE_FORMAT` + migración en `src/save.js` (nunca romper mundos viejos).
- Gotcha UI: la sección de inventario (Personaje + Inventario) no se mueve ni cambia de alto según cuántas recetas muestre la lista; Recetas va con altura fija y desplaza por dentro (Isaac, v13.0.4: al filtrar, todo el panel saltaba).
- Depurar desde la consola: `window.nanoblocks.game` / `.ui`. Con el panel oculto, `requestAnimationFrame` no corre: avanzar con `game.update(1/60)`.
