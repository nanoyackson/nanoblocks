# v12.9.0: íconos provisionales de la PWA, hechos con el logo que ya existe (la «N» de pasto). Uso: python tools/hacer-iconos.py
from PIL import Image
logo = Image.open('public/ui/logo.png').convert('RGBA')
n = logo.crop((90, 70, 238, 255))            # la N de pasto y tierra
bb = n.getbbox(); n = n.crop(bb)
FONDO = (29, 26, 22, 255)                    # #1d1a16, el mismo del manifiesto
def lienzo(lado, ocupa):
    im = Image.new('RGBA', (lado, lado), FONDO)
    k = lado * ocupa / max(n.size)
    g = n.resize((round(n.width * k), round(n.height * k)), Image.LANCZOS)
    im.alpha_composite(g, ((lado - g.width) // 2, (lado - g.height) // 2))
    return im.convert('RGB')
lienzo(512, 0.74).save('public/icons/icon-512.png')
lienzo(192, 0.74).save('public/icons/icon-192.png')
lienzo(512, 0.58).save('public/icons/maskable-512.png')   # todo dentro del 80 % central
lienzo(180, 0.74).save('public/icons/apple-touch-icon.png')
lienzo(32, 0.86).save('public/icons/favicon-32.png')
print('listo')
