import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "data" / "vehicle_images.json"
OUTPUT = ROOT / "data" / "image_search_manifest.json"

def clean(value):
    return re.sub(r"\s+", " ", str(value).strip())

with open(MANIFEST, "r", encoding="utf-8") as f:
    vehicles = json.load(f)

search_manifest = []

for vehicle in vehicles:
    brand = clean(vehicle.get("brand", ""))
    name = clean(vehicle.get("name", ""))
    fuel = clean(vehicle.get("fuel_type", ""))

    queries = [
        f"{brand} {name} India official",
        f"{brand} {name} India car",
        f"{brand} {name} official India"
    ]

    if fuel:
        queries.insert(1, f"{brand} {name} {fuel} India")

    search_manifest.append({
        "vehicle_id": vehicle["vehicle_id"],
        "vehicle_name": name,
        "brand": brand,
        "fuel_type": fuel,
        "image_filename": vehicle["image_filename"],
        "image_path": vehicle["image_path"],
        "queries": queries,
        "status": "PENDING"
    })

with open(OUTPUT, "w", encoding="utf-8") as f:
    json.dump(search_manifest, f, indent=2, ensure_ascii=False)

print(f"Created: {OUTPUT}")
print(f"Vehicles prepared: {len(search_manifest)}")