#!/usr/bin/env python3
"""Remove only the lower duplicate Lyngen label and upscale the existing four-phone asset."""
from pathlib import Path
import cv2
import numpy as np
from PIL import Image

SOURCE = Path("assets/skredvett-lyngen-telefoner.webp")
ORIGINAL_SIZE = (1536, 803)
TARGET_SIZE = (3072, 1606)

def main():
    image = Image.open(SOURCE).convert("RGBA")
    if image.size == TARGET_SIZE:
        print("Already processed, no change.")
        return
    if image.size != ORIGINAL_SIZE:
        raise RuntimeError(f"Unexpected dimensions {image.size}, refusing to alter the image.")
    pixels = np.array(image)
    rgb = pixels[:, :, :3]
    gray = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY)
    mask = np.zeros(gray.shape, dtype=np.uint8)
    # The LOWER of the two Lyngen labels is the only area modified.
    x1, y1, x2, y2 = 89, 434, 172, 467
    dark = np.where(gray[y1:y2, x1:x2] < 110, 255, 0).astype(np.uint8)
    mask[y1:y2, x1:x2] = cv2.dilate(
        dark, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))
    )
    pixels[:, :, :3] = cv2.inpaint(rgb, mask, 3, cv2.INPAINT_TELEA)
    corrected = Image.fromarray(pixels, "RGBA")
    scaled = corrected.resize(TARGET_SIZE, Image.Resampling.LANCZOS)
    scaled.save(SOURCE, format="WEBP", lossless=True, method=6)
    print(f"Removed duplicate label and increased resolution to {TARGET_SIZE}")

if __name__ == "__main__":
    main()
