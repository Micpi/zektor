#!/usr/bin/env python3
"""
Create HA-compliant icons: 256x256 & 512x512, interlaced, transparent.
Uses pypng for native interlacing support.
"""

import sys
from pathlib import Path

try:
    import png
    from PIL import Image
except ImportError as e:
    print(f"Error: Missing required module: {e}")
    print("Install with: pip install pypng pillow")
    sys.exit(1)


def pil_to_interlaced_png(pil_image, output_path):
    """Convert PIL image to interlaced PNG with alpha channel."""
    # Ensure RGBA
    if pil_image.mode != "RGBA":
        pil_image = pil_image.convert("RGBA")

    width, height = pil_image.size

    # Get pixel data as list of tuples (R, G, B, A)
    rows = []
    for y in range(height):
        row = []
        for x in range(width):
            r, g, b, a = pil_image.getpixel((x, y))
            row.extend([r, g, b, a])  # RGBA values as flat list
        rows.append(row)

    # Write interlaced PNG with alpha channel (8-bit, 4 bytes per pixel = RGBA)
    writer = png.Writer(
        width=width,
        height=height,
        alpha=True,
        interlace=True,
        greyscale=False,
        bitdepth=8,
    )
    with open(output_path, "wb") as f:
        writer.write(f, rows)


def create_ha_icon(source_path, output_256, output_512):
    """Create both icon sizes with HA specs."""
    img = Image.open(source_path)
    print(f"Source image: {img.size} {img.mode}")

    for size, output_path in [(256, output_256), (512, output_512)]:
        # Create square canvas with transparent background
        new_img = Image.new("RGBA", (size, size), (0, 0, 0, 0))

        # Calculate scaling to center (90% of canvas)
        max_dimension = int(size * 0.9)
        scale = min(max_dimension / img.width, max_dimension / img.height)
        new_width = int(img.width * scale)
        new_height = int(img.height * scale)

        # Resize with high quality
        resized = img.resize((new_width, new_height), Image.Resampling.LANCZOS)

        # Center on canvas
        x = (size - new_width) // 2
        y = (size - new_height) // 2
        new_img.paste(resized, (x, y), resized)

        # Save as interlaced PNG
        try:
            pil_to_interlaced_png(new_img, output_path)
            size_kb = Path(output_path).stat().st_size / 1024
            print(
                f"✓ Created: {output_path} ({size}×{size}, {size_kb:.1f}KB, interlaced)"
            )
        except Exception as e:
            print(f"✗ Error writing {output_path}: {e}")
            raise


if __name__ == "__main__":
    src = "integrations/img/blaze.png"
    dest_256 = "integrations/Blaze/custom_components/blaze_powerzone/brand/icon.png"
    dest_512 = "integrations/Blaze/custom_components/blaze_powerzone/brand/icon@2x.png"

    print("Creating HA-compliant icons (interlaced PNG with transparency)...\n")
    create_ha_icon(src, dest_256, dest_512)
    print("\n✓ Done! Icons are ready for Home Assistant.")
    print("  - Interlaced (progressive)")
    print("  - Transparent background (RGBA)")
    print("  - Web-optimized (lossless)")
