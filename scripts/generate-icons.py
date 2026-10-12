"""Generates the PWA icons in public/icons from public/logo.png.

Run: python scripts/generate-icons.py   (needs Pillow: pip install pillow)

public/logo.png is the original artwork, kept untouched. The artwork was
exported from a paint program and includes UI leftovers around the logo (a
"file" label, a color palette, a notes icon and a few specks). Those are
painted over with the canvas gray ONLY in the copy used to build the icons.
The cleanup rectangles below are specific to this 1024x1024 file: if the logo
is replaced, review them.

Outputs (public/icons):
  icon-192.png, icon-512.png   purpose "any"
  icon-maskable-512.png        purpose "maskable" (logo inside the safe zone)
  apple-touch-icon.png         180x180, used by iOS "Add to Home Screen"
  badge-96.png                 monochrome silhouette for Android notification badge
"""

from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
LOGO = ROOT / "public" / "logo.png"
OUT = ROOT / "public" / "icons"

# Rectangles (x0, y0, x1, y1) of editor leftovers in the 1024x1024 artwork.
CLEANUP_RECTS = [
    (0, 0, 118, 62),  # "file" label
    (858, 318, 1024, 515),  # color palette
    (18, 815, 200, 1024),  # notes icon
    (215, 890, 245, 925),  # speck
    (165, 578, 195, 606),  # speck
]

# Fraction of the canvas the logo may occupy inside the maskable safe zone
# (Android masks to a circle of radius 40% of the icon size).
MASKABLE_SCALE = 0.72


def load_clean() -> tuple[Image.Image, tuple[int, int, int]]:
    logo = Image.open(LOGO).convert("RGB")
    if logo.size != (1024, 1024):
        raise SystemExit(f"Expected a 1024x1024 logo, got {logo.size}")
    # Canvas gray, sampled from an empty corner.
    gray = logo.getpixel((1000, 8))
    draw = ImageDraw.Draw(logo)
    for rect in CLEANUP_RECTS:
        draw.rectangle(rect, fill=gray)
    return logo, gray


def resized(img: Image.Image, size: int) -> Image.Image:
    return img.resize((size, size), Image.LANCZOS)


def maskable(img: Image.Image, gray: tuple[int, int, int], size: int) -> Image.Image:
    canvas = Image.new("RGB", (size, size), gray)
    inner = int(size * MASKABLE_SCALE)
    offset = (size - inner) // 2
    canvas.paste(resized(img, inner), (offset, offset))
    return canvas


def badge(img: Image.Image, size: int) -> Image.Image:
    """White silhouette of the black artwork on transparency (Android badge)."""
    small = resized(img, size).convert("L")
    alpha = small.point(lambda v: 255 if v < 70 else 0)
    out = Image.new("RGBA", (size, size), (255, 255, 255, 0))
    out.putalpha(alpha)
    white = Image.new("RGBA", (size, size), (255, 255, 255, 255))
    white.putalpha(alpha)
    return white


def main() -> None:
    clean, gray = load_clean()
    OUT.mkdir(parents=True, exist_ok=True)
    outputs = {
        "icon-192.png": resized(clean, 192),
        "icon-512.png": resized(clean, 512),
        "icon-maskable-512.png": maskable(clean, gray, 512),
        "apple-touch-icon.png": resized(clean, 180),
        "badge-96.png": badge(clean, 96),
    }
    for name, image in outputs.items():
        image.save(OUT / name, optimize=True)
        print(f"wrote public/icons/{name}")


if __name__ == "__main__":
    main()
