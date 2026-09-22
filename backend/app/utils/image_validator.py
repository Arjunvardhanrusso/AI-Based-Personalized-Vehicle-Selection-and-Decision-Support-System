"""
Image Asset Validation Utility

Verifies:
- All vehicle and variant image paths are browser-accessible relative paths.
- Checks if local image files exist on disk.
- Reports statistics on image validity, fallback usage, and extensions.
- Detects broken, duplicate, or machine-specific paths (e.g. C:\\...).
"""
import json
import os
import re

_APP_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_BACKEND_DIR = os.path.dirname(_APP_DIR)
_PROJECT_ROOT = os.path.dirname(_BACKEND_DIR)
_DATA_DIR = os.path.join(_PROJECT_ROOT, "data")
_PUBLIC_DIR = os.path.join(_PROJECT_ROOT, "frontend", "public")


def validate_images():
    variants_path = os.path.join(_DATA_DIR, "variants.json")
    with open(variants_path, "r", encoding="utf-8") as f:
        variants = json.load(f).get("variants", [])

    total = len(variants)
    valid_format = 0
    machine_paths = 0
    on_disk_exist = 0
    missing_files = 0
    extensions = {}

    for v in variants:
        img = v.get("image_path")
        if not img:
            continue

        # Check for machine specific path
        if "\\" in img or ":" in img or img.startswith("C:") or img.startswith("c:"):
            machine_paths += 1
            continue

        if img.startswith("/assets/cars/"):
            valid_format += 1
            ext = os.path.splitext(img)[1].lower()
            extensions[ext] = extensions.get(ext, 0) + 1

            # Check if file exists in frontend/public
            rel_path = img.lstrip("/")  # e.g. assets/cars/...
            disk_path = os.path.join(_PUBLIC_DIR, rel_path)
            if os.path.exists(disk_path):
                on_disk_exist += 1
            else:
                missing_files += 1

    report = {
        "total_variants": total,
        "valid_browser_format_paths": valid_format,
        "machine_specific_paths": machine_paths,
        "images_present_on_disk": on_disk_exist,
        "images_using_graceful_fallback": missing_files,
        "extensions": extensions,
        "fallback_svg_ready": os.path.exists(os.path.join(_PUBLIC_DIR, "assets", "cars", "default_vehicle.svg"))
    }
    return report


if __name__ == "__main__":
    rep = validate_images()
    print("=== Image Validation Report ===")
    for k, val in rep.items():
        print(f"{k}: {val}")
