# Deuda encontrada por el verificador (14-nov, después de v12.16.2)

Arreglar en **v12.16.4**, antes de la trama. Decisiones ya tomadas por la orquestadora.

1. **Invitado expulsado por «demasiados mensajes» al volar a terreno sin cargar** (≈40–60 s de vuelo a 6–10 bloques/s). Sospecha: `src/red/limites.js` (`chunks_pide` 5/s, `pos` 15/s). Un invitado honesto que explora NUNCA debe ser expulsado: el pedido de trozos debe ir en cola/lote del lado del cliente (no ráfagas) y el anfitrión debe **descartar o demorar** el exceso de pedidos de trozos en vez de expulsar; la expulsión queda solo para abuso claro y sostenido. Agregar prueba en `npm run revisar`: simular un vuelo largo y comprobar que no expulsa.
2. **Redondel del Rey en red al tope `MAX_CAMBIOS = 3000`**: el diario llega justo a 3000, así que faroles, altar o cornisa pueden quedar fuera. Subir el tope con margen (o mandar el redondel por lotes) y comprobar que el invitado recibe el redondel completo.
3. **Arpía**: la ráfaga solo avisa con <50 % de vida; con vida normal sale sin aviso. Decidido: **siempre avisa** (silbido + anillo; 0,6 s con vida normal, 1,0 s furiosa).
4. **CSP**: `onclick="this.select()"` inline en `#red-codigo-ver` (`src/pantallas.js`) da error de CSP. Pasarlo a `addEventListener`.
5. **`pantallas.js:89`**: `Anfitrion.hola → fichas()` lanza «Cannot read properties of null (reading 'jugadores')» si el anfitrión tiene el menú abierto sin partida cargada. Proteger con guardia.
6. Pendiente de probar después del arreglo 1: invitado dentro de un tubo de lava/termal (C7), con 2 pestañas.
