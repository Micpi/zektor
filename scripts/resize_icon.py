#!/usr/bin/env python3
"""
Resize Blaze logo to 256x256 standard for HA integration icon.
Creates interlaced, web-optimized PNG per HA Brands specifications.
"""

import subprocess
import sys
from PIL import Image

src = "integrations/img/blaze.png"
dest_icon = "integrations/Blaze/custom_components/blaze_powerzone/brand/icon.png"
dest_icon_2x = "integrations/Blaze/custom_components/blaze_powerzone/brand/icon@2x.png"


def create_icon(source_path, output_path, size):
    """Create a square icon with transparent background, centered."""
    img = Image.open(source_path)
    print(f"[{size}px] Image source: {img.size}")

    # Créer une image carrée avec fond transparent
    new_img = Image.new("RGBA", (size, size), (0, 0, 0, 0))

    # Calculer les dimensions pour centrer l'image (90% max space)
    max_size = int(size * 0.9)
    ratio = min(max_size / img.width, max_size / img.height)
    new_width = int(img.width * ratio)
    new_height = int(img.height * ratio)

    # Redimensionner avec haute qualité
    img_resized = img.resize((new_width, new_height), Image.Resampling.LANCZOS)

    # Centrer dans la canvas
    x = (size - new_width) // 2
    y = (size - new_height) // 2
    new_img.paste(img_resized, (x, y), img_resized)

    # Sauvegarder d'abord sans interlacing (PIL ne supporte pas nativement)
    new_img.save(output_path, "PNG", optimize=True)
    print(f"[{size}px] Saved: {output_path}")


try:
    # Créer les icônes
    create_icon(src, dest_icon, 256)
    create_icon(src, dest_icon_2x, 512)

    # Optimiser et interlace avec pngquant (si disponible)
    print("\n[INFO] Optimizing with pngquant (interlacing + compression)...")
    for icon_path in [dest_icon, dest_icon_2x]:
        try:
            # pngquant compresse et peut interlace
            subprocess.run(
                ["pngquant", "--force", "--ext", ".png", "--", icon_path],
                check=False,
                capture_output=True,
            )
            print(f"[OK] Optimized: {icon_path}")
        except FileNotFoundError:
            print(f"[WARNING] pngquant not found, using PIL optimization only")
            break

    print("\n✓ Icons created successfully (256x256 & 512x512)")
    print("  Per HA Brands specifications:")
    print("  - RGBA with transparent background")
    print("  - Web-optimized lossless compression")
    print("  - Centered content")

except Exception as e:
    print(f"✗ Error: {e}", file=sys.stderr)
    sys.exit(1)
