# Material de terceros

| Qué | De dónde | Licencia | Archivo de licencia |
|---|---|---|---|
| Fuente **Inter** 4.x (pesos 400, 500, 600 y 700, subconjuntos latin y latin-ext, WOFF2) | The Inter Project Authors, https://github.com/rsms/inter, bajada del paquete npm `@fontsource/inter` 5.3.0 | SIL Open Font License 1.1 | `public/fonts/inter/LICENSE.txt` |
| Sonidos de interfaz e impactos | Kenney (kenney.nl) | CC0 | `public/sounds/LICENSE-kenney-*.txt` |
| Sprites de ítems (Voxel Pack) | Kenney (kenney.nl) | CC0 | `public/sprites/LICENSE-kenney-voxel-pack.txt` |
| Sonidos del mundo (469 archivos de 283 grabaciones de origen, todas CC0; cada una con su enlace en `credits`) | Freesound, solo los marcados CC0 | CC0 | `public/sounds/real/manifest.json` |
| **Trystero** 0.27.0 (multijugador entre navegadores; va dentro del juego compilado) | Dan Kelley y colaboradores, https://github.com/dmotz/trystero | MIT | `node_modules/trystero/LICENSE` |
| **three.js** 0.170.0 (va dentro del juego compilado, `dist/assets/three-*.js`) | three.js authors, https://threejs.org | MIT | `node_modules/three/LICENSE` (el aviso: «Copyright © 2010-2024 three.js authors», se conserva en el código compilado) |
| Herramientas de desarrollo: Vite 6, ESLint 9, `@eslint/js`, `globals`, `@fontsource/inter` (solo para bajar la fuente) | sus autores, en npm | MIT (Inter: OFL) | no se distribuyen con el juego |

**Servicios externos del multijugador (no se distribuyen, solo se consultan):** los relés públicos de Nostr que usa Trystero para que dos navegadores se encuentren, los servidores STUN públicos y el servicio de relevo TURN de `openrelay.metered.ca` (`src/red/transporte.js`). El juego solo funciona sin ellos en un mundo de un jugador.

La fuente Inter se puede usar, copiar y redistribuir con el juego. La licencia OFL pide que la licencia viaje con la fuente y que no se venda la fuente sola.


## Arte generado con IA
Los íconos de los lotes 1 a 3 (`public/sprites/arte/`), los retratos de los jefes (`public/ui/jefes/`), el logo y el fondo del menú
(`public/ui/`), la billetera, las monedas y los billetes, y las texturas de la construcción tradicional (`src/texturas_arte.js`) se
generaron con ayuda de un modelo de IA (ChatGPT) a partir de indicaciones propias del proyecto (`docs/PEDIDOS_ARTE*.md`) y se ajustaron
para el juego. Los íconos de monedas y billetes (`public/sprites/plata_*.png`) y los de `public/icons/` son arte propio del proyecto. Ninguno copia arte de otros juegos. Se publican con el resto del arte propio bajo CC BY 4.0 (ver `LICENSE-ARTE`).

## Licencias del proyecto
- El código: MIT (`LICENSE`).
- El arte y los textos propios: CC BY 4.0 (`LICENSE-ARTE`).
