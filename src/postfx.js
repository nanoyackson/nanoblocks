// v12.8.0 (PLAN_GRAFICOS_2.md §5): postproceso propio, por ahora con bloom. Solo existe en Alto y Ultra (bandera «bloom»).
// El cuadro (cielo y horizonte, lo cercano) se dibuja en un render target de media precisión (HalfFloat, si la tarjeta deja
// escribir en él; si no, 8 bits). Con #define POST_HDR los emisores (antorchas, lámparas, lava) pasan de 1 en world.js; el bloom
// toma lo que pasa del umbral, lo reduce en N niveles (Alto 4, Ultra 5), lo vuelve a subir sumando y el pase final lo suma a la
// escena. La mano va después, directo a pantalla, sin bloom (como en el plan). Sin el RT (Bajo y Medio) no hay nada de esto.
import * as THREE from 'three';

const VERT = 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';
// el umbral suave: lo que pasa de uUmbral, con una rodilla de ancho uRodilla
const BRILLO = `uniform sampler2D tSrc; uniform float uUmbral; uniform float uRodilla; varying vec2 vUv;
void main() {
  vec3 c = texture2D(tSrc, vUv).rgb;
  float l = max(c.r, max(c.g, c.b));
  float s = clamp(l - uUmbral + uRodilla, 0.0, 2.0 * uRodilla); s = s * s / (4.0 * uRodilla + 1e-4);
  float k = max(s, l - uUmbral) / max(l, 1e-4);
  gl_FragColor = vec4(c * k, 1.0);
}`;
// reducción con 4 muestras en diagonal (un poco más suave que un promedio de 2 × 2)
const BAJAR = `uniform sampler2D tSrc; uniform vec2 uTexel; varying vec2 vUv;
void main() {
  vec3 c = texture2D(tSrc, vUv + uTexel * vec2(-1.0, -1.0)).rgb + texture2D(tSrc, vUv + uTexel * vec2(1.0, -1.0)).rgb
         + texture2D(tSrc, vUv + uTexel * vec2(-1.0, 1.0)).rgb + texture2D(tSrc, vUv + uTexel * vec2(1.0, 1.0)).rgb;
  gl_FragColor = vec4(c * 0.25, 1.0);
}`;
// subida en tienda de 9 muestras, que se SUMA (blending aditivo) al nivel de arriba
const SUBIR = `uniform sampler2D tSrc; uniform vec2 uTexel; uniform float uPeso; varying vec2 vUv;
void main() {
  vec3 c = texture2D(tSrc, vUv).rgb * 4.0;
  c += (texture2D(tSrc, vUv + vec2(uTexel.x, 0.0)).rgb + texture2D(tSrc, vUv - vec2(uTexel.x, 0.0)).rgb + texture2D(tSrc, vUv + vec2(0.0, uTexel.y)).rgb + texture2D(tSrc, vUv - vec2(0.0, uTexel.y)).rgb) * 2.0;
  c += texture2D(tSrc, vUv + uTexel).rgb + texture2D(tSrc, vUv - uTexel).rgb + texture2D(tSrc, vUv + vec2(uTexel.x, -uTexel.y)).rgb + texture2D(tSrc, vUv + vec2(-uTexel.x, uTexel.y)).rgb;
  gl_FragColor = vec4(c / 16.0 * uPeso, 1.0);
}`;
// el pase final: la escena más el bloom. v12.8.6 (decimoctava revisión, punto 3): el hombro es una curva de verdad (antes c / c = 1, un
// recorte) y va sobre el canal más alto, escalando los tres: la lava (2.7, 1.4, 0.1) sale naranja y no amarilla. Igual hasta 0.9;
// después se acerca a 1 sin tocarlo
const FINAL = `uniform sampler2D tEscena; uniform sampler2D tBloom; uniform float uFuerza; varying vec2 vUv;
void main() {
  vec3 c = texture2D(tEscena, vUv).rgb + texture2D(tBloom, vUv).rgb * uFuerza;
  float l = max(max(c.r, c.g), c.b);
  float h = l <= 0.9 ? l : 0.9 + 0.1 * (1.0 - exp(-(l - 0.9) / 0.1));
  gl_FragColor = vec4(l > 0.0 ? c * (h / l) : c, 1.0);
}`;

export class PostFX {
  constructor(renderer) {
    this.r = renderer;
    const gl = renderer.getContext();
    // ¿se puede dibujar en media precisión? (WebGL2 con EXT_color_buffer_float o _half_float)
    this.hdr = !!(renderer.capabilities.isWebGL2 && (gl.getExtension('EXT_color_buffer_float') || gl.getExtension('EXT_color_buffer_half_float')));
    this.tipo = this.hdr ? THREE.HalfFloatType : THREE.UnsignedByteType;
    this.escena = null; this.niveles = []; this.w = 0; this.h = 0; this.n = 0;
    this.cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), null);
    this.quad.frustumCulled = false;
    this.sc = new THREE.Scene(); this.sc.add(this.quad);
    const mat = (frag, uni, extra = {}) => new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: frag, uniforms: uni, depthTest: false, depthWrite: false, ...extra });
    this.mBrillo = mat(BRILLO, { tSrc: { value: null }, uUmbral: { value: 0.95 }, uRodilla: { value: 0.3 } });
    this.mBajar = mat(BAJAR, { tSrc: { value: null }, uTexel: { value: new THREE.Vector2() } });
    this.mSubir = mat(SUBIR, { tSrc: { value: null }, uTexel: { value: new THREE.Vector2() }, uPeso: { value: 1 } }, { blending: THREE.AdditiveBlending, transparent: true });
    this.mFinal = mat(FINAL, { tEscena: { value: null }, tBloom: { value: null }, uFuerza: { value: 0.6 } });
  }
  rt(w, h, prof) {
    const t = new THREE.WebGLRenderTarget(Math.max(1, w), Math.max(1, h), { type: this.tipo, magFilter: THREE.LinearFilter, minFilter: THREE.LinearFilter, depthBuffer: prof, stencilBuffer: false });
    t.texture.generateMipmaps = false;
    return t;
  }
  // arma (o rehace) los render targets al tamaño de la pantalla, con n niveles de bloom
  preparar(w, h, n) {
    if (this.escena && w === this.w && h === this.h && n === this.n) return;
    this.liberar();
    this.w = w; this.h = h; this.n = n;
    this.escena = this.rt(w, h, true);
    for (let i = 0; i < n; i++) this.niveles.push(this.rt(w >> (i + 1), h >> (i + 1), false));
  }
  // a partir de aquí, el cuadro va al RT
  empezar() { this.r.setRenderTarget(this.escena); this.r.clear(); }
  pase(m, destino) { this.quad.material = m; this.r.setRenderTarget(destino); this.r.render(this.sc, this.cam); }
  // el bloom y el vuelco a pantalla; deja el destino en la pantalla (para la mano). v12.8.6 (punto 3): de día (dia = 1) el umbral sube a
  // 1.3 y la fuerza baja a la mitad: el cielo, las nubes y la nieve no sangran una orla clara sobre los árboles
  terminar(fuerza, dia = 0) {
    this.mBrillo.uniforms.uUmbral.value = 0.95 + 0.35 * dia;
    fuerza *= 1 - 0.5 * dia;
    const r = this.r, N = this.niveles, autoClear = r.autoClear;
    r.autoClear = true;
    this.mBrillo.uniforms.tSrc.value = this.escena.texture; this.pase(this.mBrillo, N[0]);
    for (let i = 1; i < N.length; i++) { const u = this.mBajar.uniforms; u.tSrc.value = N[i - 1].texture; u.uTexel.value.set(1 / N[i - 1].width, 1 / N[i - 1].height); this.pase(this.mBajar, N[i]); }
    r.autoClear = false; // la subida se suma a lo que ya tiene el nivel de arriba
    for (let i = N.length - 1; i > 0; i--) { const u = this.mSubir.uniforms; u.tSrc.value = N[i].texture; u.uTexel.value.set(1 / N[i].width, 1 / N[i].height); u.uPeso.value = 1; this.pase(this.mSubir, N[i - 1]); }
    r.autoClear = true;
    const f = this.mFinal.uniforms; f.tEscena.value = this.escena.texture; f.tBloom.value = N[0].texture; f.uFuerza.value = fuerza;
    this.pase(this.mFinal, null);
    r.autoClear = autoClear;
  }
  liberar() { if (this.escena) this.escena.dispose(); for (const t of this.niveles) t.dispose(); this.escena = null; this.niveles = []; this.w = this.h = this.n = 0; }
  // memoria aproximada (MB) del RT y los niveles
  memoria() { const b = this.hdr ? 8 : 4; let s = this.w * this.h * (b + 4); for (const t of this.niveles) s += t.width * t.height * b; return +(s / 1048576).toFixed(1); }
}
