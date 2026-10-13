#!/usr/bin/env python3
"""Genera todos los assets de ícono/branding a partir de src/assets/logo.png.

Uso:
    python3 scripts/generate_app_assets.py

Requiere: Pillow.
"""
import os
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LOGO = os.path.join(ROOT, "src", "assets", "logo.png")
OUT = os.path.join(ROOT, "assets")
STORE = os.path.join(ROOT, "store")

BG = (244, 236, 216, 255)  # crema cálida, combina con el arte del logo


def paste_logo(base, logo, scale):
    w, h = base.size
    size = int(w * scale)
    r = logo.copy().resize((size, size), Image.LANCZOS)
    base.alpha_composite(r, ((w - size) // 2, (h - size) // 2))
    return base


def fg_canvas(size):
    return Image.new("RGBA", (size, size), (0, 0, 0, 0))


def bg_canvas(size):
    return Image.new("RGBA", (size, size), BG)


def main():
    logo = Image.open(LOGO).convert("RGBA")

    os.makedirs(OUT, exist_ok=True)
    os.makedirs(STORE, exist_ok=True)

    # ícono general / legacy (sin transparencia)
    paste_logo(bg_canvas(1024), logo, 0.70).convert("RGB").save(
        os.path.join(OUT, "icon.png"), format="PNG"
    )

    # adaptive icon: foreground con el logo dentro de la zona segura
    paste_logo(fg_canvas(1024), logo, 0.60).save(
        os.path.join(OUT, "android-icon-foreground.png"), format="PNG"
    )

    # adaptive icon: fondo plano
    bg_canvas(1024).save(os.path.join(OUT, "android-icon-background.png"), format="PNG")

    # monochrome: silueta blanca
    mono = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
    a = logo.copy().resize((614, 614), Image.LANCZOS).getchannel("A")
    white = Image.new("RGBA", (614, 614), (255, 255, 255, 255))
    white.putalpha(a)
    mono.alpha_composite(white, (205, 205))
    mono.save(os.path.join(OUT, "android-icon-monochrome.png"), format="PNG")

    # splash
    paste_logo(fg_canvas(1024), logo, 0.40).save(
        os.path.join(OUT, "splash-icon.png"), format="PNG"
    )

    # favicon web
    paste_logo(bg_canvas(48), logo, 0.85).convert("RGB").save(
        os.path.join(OUT, "favicon.png"), format="PNG"
    )

    # Play Store
    paste_logo(bg_canvas(512), logo, 0.70).convert("RGB").save(
        os.path.join(STORE, "play-icon-512.png"), format="PNG"
    )

    feat = bg_canvas(1024)
    feat = feat.resize((1024, 500), Image.LANCZOS)
    l = logo.copy().resize((320, 320), Image.LANCZOS)
    feat.alpha_composite(l, ((1024 - 320) // 2, (500 - 320) // 2))
    feat.convert("RGB").save(
        os.path.join(STORE, "play-feature-graphic-1024x500.png"), format="PNG"
    )

    print("OK: assets generados")


if __name__ == "__main__":
    main()