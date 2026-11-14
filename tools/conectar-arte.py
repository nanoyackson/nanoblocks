# v12.8.9: conecta el arte de assets-src/chatgpt/ que aun no esta en public/sprites/arte/ (128 px, cabe en cuadro, transparente).
# item-<clave>.png -> arte/<clave>.png ; moneda-N / billete-N -> arte/<clave del item de plata>.png. Idempotente: no pisa lo que ya existe.
# Uso: python tools/conectar-arte.py   (imprime la lista de claves nuevas para ARTE en src/blocks.js)
import os, sys
from PIL import Image
raiz = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src = os.path.join(raiz, 'assets-src', 'chatgpt'); dst = os.path.join(raiz, 'public', 'sprites', 'arte')
PLATA = {'moneda-5': 'moneda_5', 'moneda-10': 'moneda_10', 'moneda-25': 'moneda_25', 'moneda-50': 'moneda_50', 'moneda-100': 'moneda_100',
         'moneda-500': 'colon', 'billete-1000': 'billete_1000', 'billete-2000': 'billete_2000', 'billete-5000': 'billete_5000',
         'billete-10000': 'billete_20', 'billete-20000': 'billete_20000'}
nuevas = []
for f in sorted(os.listdir(src)):
    n, e = os.path.splitext(f)
    if e != '.png': continue
    k = n[5:] if n.startswith('item-') else PLATA.get(n)
    if not k: continue
    out = os.path.join(dst, k + '.png')
    if os.path.exists(out): continue
    im = Image.open(os.path.join(src, f)).convert('RGBA'); im.thumbnail((128, 128), Image.LANCZOS)
    lienzo = Image.new('RGBA', (128, 128), (0, 0, 0, 0)); lienzo.paste(im, ((128 - im.width) // 2, (128 - im.height) // 2))
    lienzo.save(out, optimize=True); nuevas.append(k)
print(' '.join("'%s'" % k for k in nuevas)); print(len(nuevas), 'nuevas', file=sys.stderr)
