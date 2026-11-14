# Cómo contribuir a NanoBlocks

¡Gracias por querer ayudar! NanoBlocks es un juego voxel propio hecho con Vite y three.js, sin servidor propio.

## Antes de empezar
- Abre primero un *issue* para contar la idea o el error (con pasos para repetirlo y la versión que ves en Ajustes). Así evitamos trabajo doble.
- Los nombres, el arte, las criaturas y el estilo son originales: no se aceptan copias de otros juegos ni arte o sonidos sin licencia clara. Todo material nuevo debe ser CC0, MIT o propio, y anotarse en `THIRD_PARTY.md`.

## Correr el proyecto
```bash
npm ci
npm run dev        # http://localhost:5199
```

## Lo que se revisa en cada *pull request*
- `npm run lint` en cero avisos.
- `npm run build` sin líneas «(!)» ni «Circular».
- `npm run revisar` en verde.
- Probado a mano en el navegador, sin errores en la consola.
- Si cambias lo que se guarda en el mundo, sube `SAVE_FORMAT` y agrega la migración en `src/save.js`: los mundos viejos nunca deben romperse.
- Una idea nueva sube `GAME_VERSION` (`src/version.js`), suma una entrada al `CHANGELOG` y actualiza `docs/ARBOL_CONOCIMIENTO.md`.

## Licencias
Al contribuir aceptas que tu código se publique bajo MIT (`LICENSE`) y tu arte o textos bajo CC BY 4.0 (`LICENSE-ARTE`).
