import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"
OUTPUT = DATA_DIR / "vehicle_images.json"

def slug(value):
    value = str(value).lower().strip()
    value = re.sub(r"[^a-z0-9]+", "_", value)
    return value.strip("_")

def load_vehicles():
    candidates = [
        DATA_DIR / "vehicles.json",
        DATA_DIR / "vehicle_knowledge_base.json",
        DATA_DIR / "vehicle_knowledge_base.csv"
    ]

    for path in candidates:
        if path.exists():
            if path.suffix == ".json":
                with open(path, "r", encoding="utf-8") as f:
                    data = json.load(f)

                if isinstance(data, dict):
                    for key in ["vehicles", "data", "items"]:
                        if key in data:
                            data = data[key]
                            break

                return data

    raise FileNotFoundError("No supported vehicle database found in data/")

vehicles = load_vehicles()

manifest = []

for vehicle in vehicles:
    vehicle_id = str(vehicle.get("id", "")).strip()
    name = str(vehicle.get("name", "")).strip()
    brand = str(vehicle.get("brand", "")).strip()
    fuel = str(vehicle.get("fuel_type", "")).strip()

    if not vehicle_id or not name:
        continue

    filename = slug(f"{brand}_{name}") + ".jpg"

    manifest.append({
        "vehicle_id": vehicle_id,
        "name": name,
        "brand": brand,
        "fuel_type": fuel,
        "image_filename": filename,
        "image_path": f"/cars/{filename}",
        "source_url": "",
        "source_name": "",
        "image_status": "NOT_FOUND"
    })

OUTPUT.parent.mkdir(parents=True, exist_ok=True)

with open(OUTPUT, "w", encoding="utf-8") as f:
    json.dump(manifest, f, indent=2, ensure_ascii=False)

print(f"Created image manifest: {OUTPUT}")
print(f"Vehicles processed: {len(manifest)}")