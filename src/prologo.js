// El prólogo: al empezar un mundo nuevo en supervivencia, unos segundos en negro con el principio de la historia. Cualquier tecla lo salta.
// Solo capa de pantalla: el mundo sigue cargando detrás.
const LINEAS = ['A su casa llegó una carta.', 'La letra es de alguien que ya no está.', '«Mi cielo: si esto le llegó, ya me fui a descansar…»'];
export function prologo() {
  const el = document.createElement('div');
  el.id = 'prologo';
  el.innerHTML = `${LINEAS.map((t, i) => `<p style="animation-delay:${0.3 + i * 1.7}s">${t}</p>`).join('')}<h2 style="animation-delay:5.5s">Las cartas de la abuela</h2>`;
  document.body.appendChild(el);
  let listo = false, teniaMouse = false;
  // entrar al juego captura el ratón y no debe cortarlo; soltarlo sí (Esc no llega como tecla mientras está capturado)
  const soltar = () => { if (document.pointerLockElement) teniaMouse = true; else if (teniaMouse) fin(); };
  const fin = () => {
    if (listo) return;
    listo = true;
    window.removeEventListener('keydown', fin, true);
    document.removeEventListener('pointerlockchange', soltar);
    el.classList.add('fuera');
    setTimeout(() => el.remove(), 900);
  };
  window.addEventListener('keydown', fin, true);
  // v13.5.6 (PU-02): sin «mousedown»: el primer clic obligatorio (capturar el ratón) cortaba el prólogo en la primera línea; sigue cortándose con una tecla, al soltar el ratón o a los 8,6 s
  document.addEventListener('pointerlockchange', soltar);
  setTimeout(fin, 8600);
}
