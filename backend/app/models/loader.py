"""
loader.py — load, normalize, link and validate the Vehicle-DSS knowledge base.
 
Design decisions (kept deliberately transparent for review):
  1. Two collections, two roles. Base `vehicles` drive type+segment scoring;
     `variants` (linked by `vehicle_id`) are ranked underneath a chosen vehicle.
  2. `price_inr` (numeric) is the source of truth for budgeting. The text
     `price_segment` is normalized only to cross-check, and flagged on mismatch.
  3. Nothing is invented or silently fixed. Casing is normalized; genuine data
     problems (out-of-range scores, orphan links, duplicate ids, templated
     engine/power/torque, missing images) are surfaced in a validation report,
     split into ERRORS (block scoring) and WARNINGS (normalized / review).
 
Run:
  python loader.py --demo                                  # tiny synthetic fixture
  python loader.py --vehicles data/vehicles.json --variants data/variants.json
"""
from __future__ import annotations
 
import argparse
import json
import os
from collections import Counter
from dataclasses import dataclass, field
 
try:  # works both as a package module and as a plain script
    from .schema import (
        normalize_fuel, normalize_segment, normalize_transmission,
        normalize_price_label, price_tier_from_inr, is_unit_interval,
        SCORE_FIELDS, NON_AUTHORITATIVE_VARIANT_FIELDS,
    )
except ImportError:
    from schema import (
        normalize_fuel, normalize_segment, normalize_transmission,
        normalize_price_label, price_tier_from_inr, is_unit_interval,
        SCORE_FIELDS, NON_AUTHORITATIVE_VARIANT_FIELDS,
    )
 
 
@dataclass
class Issue:
    level: str      # "error" | "warning"
    category: str
    ref: str        # record id it refers to
    message: str
 
 
@dataclass
class KnowledgeBase:
    vehicles: dict = field(default_factory=dict)            # id -> normalized vehicle
    variants_by_vehicle: dict = field(default_factory=dict)  # vehicle_id -> [variants]
    issues: list = field(default_factory=list)
    stats: dict = field(default_factory=dict)
 
    def errors(self):
        return [i for i in self.issues if i.level == "error"]
 
    def warnings(self):
        return [i for i in self.issues if i.level == "warning"]
 
    def variants_for(self, vehicle_id):
        return self.variants_by_vehicle.get(vehicle_id, [])
 
    def vehicles_in_segment(self, segment):
        return [v for v in self.vehicles.values() if v.get("vehicle_segment") == segment]
 
    def format_report(self):
        s, out = self.stats, []
        out.append("=" * 66)
        out.append("VEHICLE-DSS KNOWLEDGE BASE — VALIDATION REPORT")
        out.append("=" * 66)
        out.append(f"vehicles loaded       : {s.get('n_vehicles', 0)}")
        out.append(f"variants loaded       : {s.get('n_variants', 0)}")
        out.append(f"unique image files    : {s.get('n_images', 0)}")
        out.append(f"vehicles w/o variants : {s.get('n_vehicles_no_variants', 0)}")
        out.append(f"segments              : {', '.join(s.get('segments', [])) or '-'}")
        out.append(f"fuel types            : {', '.join(s.get('fuels', [])) or '-'}")
        errs, warns = self.errors(), self.warnings()
        out.append(f"\nERRORS   : {len(errs)}   (block scoring — must resolve)")
        out.append(f"WARNINGS : {len(warns)}   (normalized or flagged for your review)")
 
        def dump(title, items):
            out.append(f"\n--- {title} ---")
            if not items:
                out.append("  (none)")
                return
            by_cat = {}
            for it in items:
                by_cat.setdefault(it.category, []).append(it)
            for cat, group in sorted(by_cat.items()):
                out.append(f"  [{cat}] x{len(group)}")
                for it in group[:10]:
                    out.append(f"      {it.ref}: {it.message}")
                if len(group) > 10:
                    out.append(f"      ... and {len(group) - 10} more")
 
        dump("ERRORS", errs)
        dump("WARNINGS", warns)
        out.append("=" * 66)
        return "\n".join(out)
 
 
def _load_json(path):
    if not path or not os.path.exists(path):
        return None, []
    with open(path, "r", encoding="utf-8") as fh:
        data = json.load(fh)
    if isinstance(data, list):
        return None, data
    meta = data.get("_metadata")
    for key in ("vehicles", "variants", "records", "data"):
        if isinstance(data.get(key), list):
            return meta, data[key]
    for value in data.values():
        if isinstance(value, list):
            return meta, value
    return meta, []
 
 
def _effective_price(rec):
    if rec.get("is_used") and isinstance(rec.get("used_price_inr"), (int, float)):
        return rec["used_price_inr"]
    return rec.get("price_inr")
 
 
def _check_scores(rec, ref, issues):
    for f in SCORE_FIELDS:
        if rec.get(f) is None:
            continue  # not every score applies to every record
        if not is_unit_interval(rec[f]):
            issues.append(Issue("error", "score-out-of-range", ref,
                                f"{f}={rec[f]!r} is outside 0..1"))
 
 
def _normalize_vehicle(raw, issues):
    ref = raw.get("id") or raw.get("name") or "<no-id>"
    if not raw.get("id"):
        issues.append(Issue("error", "missing-id", ref, "vehicle has no id"))
    v = dict(raw)  # keep every original field; override the normalized keys
 
    price = _effective_price(raw)
    if not isinstance(price, (int, float)) or price <= 0:
        issues.append(Issue("error", "missing-price", ref,
                            "no usable price_inr / used_price_inr"))
        v["_effective_price"] = None
        v["_price_tier"] = None
    else:
        v["_effective_price"] = price
        v["_price_tier"] = price_tier_from_inr(price)
        label_tier = normalize_price_label(raw.get("price_segment"))
        if label_tier and label_tier != v["_price_tier"]:
            issues.append(Issue("warning", "price-label-mismatch", ref,
                                f"price_segment {raw.get('price_segment')!r} -> {label_tier}, "
                                f"but price_inr implies {v['_price_tier']}"))
 
    seg = normalize_segment(raw.get("vehicle_segment"))
    if seg is None and raw.get("vehicle_segment") is not None:
        issues.append(Issue("warning", "unknown-segment", ref,
                            f"unrecognized vehicle_segment {raw.get('vehicle_segment')!r} (kept raw)"))
    v["vehicle_segment"] = seg or (str(raw.get("vehicle_segment")).lower()
                                   if raw.get("vehicle_segment") else None)
 
    fuel = normalize_fuel(raw.get("fuel_type"))
    if fuel is None and raw.get("fuel_type") is not None:
        issues.append(Issue("warning", "unknown-fuel", ref,
                            f"unrecognized fuel_type {raw.get('fuel_type')!r} (kept raw)"))
    v["fuel_type"] = fuel or (str(raw.get("fuel_type")).lower()
                              if raw.get("fuel_type") else None)
 
    trans = raw.get("transmission")
    if isinstance(trans, list):
        v["transmission"] = sorted({normalize_transmission(t) or str(t).lower() for t in trans})
    elif trans is not None:
        v["transmission"] = [normalize_transmission(trans) or str(trans).lower()]
 
    _check_scores(raw, ref, issues)
    if not raw.get("image_path"):
        issues.append(Issue("warning", "missing-image", ref, "no image_path"))
    return v
 
 
def _normalize_variant(raw, occurrence, vehicle_ids, issues):
    ref = raw.get("id") or "<no-id>"
    v = dict(raw)
    if occurrence > 1:
        v["_uid"] = f"{ref}#{occurrence}"
        issues.append(Issue("warning", "duplicate-variant-id", ref,
                            f"duplicate id (occurrence {occurrence}); internal uid {v['_uid']}"))
    else:
        v["_uid"] = ref
 
    vid = raw.get("vehicle_id")
    if vid not in vehicle_ids:
        issues.append(Issue("error", "orphan-variant", ref,
                            f"vehicle_id {vid!r} has no matching vehicle"))
 
    raw_fuel = raw.get("fuel_type") or raw.get("powertrain_type")
    fuel = normalize_fuel(raw_fuel)
    if fuel is None and raw_fuel is not None:
        issues.append(Issue("warning", "unknown-fuel", ref,
                            f"unrecognized fuel/powertrain {raw_fuel!r} (kept raw)"))
    v["fuel_type"] = fuel or (str(raw_fuel).lower() if raw_fuel else None)
 
    price = _effective_price(raw)
    if not isinstance(price, (int, float)) or price <= 0:
        issues.append(Issue("error", "missing-price", ref, "no usable price for variant"))
    v["_effective_price"] = price
 
    _check_scores(raw, ref, issues)
    return v
 
 
def build_knowledge_base(vehicles_path=None, variants_path=None,
                         vehicles_data=None, variants_data=None):
    issues = []
    v_meta, v_list = ((None, vehicles_data) if vehicles_data is not None
                      else _load_json(vehicles_path))
    x_meta, x_list = ((None, variants_data) if variants_data is not None
                      else _load_json(variants_path))
    v_list, x_list = v_list or [], x_list or []
 
    kb = KnowledgeBase()
    for raw in v_list:
        nv = _normalize_vehicle(raw, issues)
        vid = raw.get("id")
        if vid:
            if vid in kb.vehicles:
                issues.append(Issue("error", "duplicate-vehicle-id", vid, "duplicate vehicle id"))
            kb.vehicles[vid] = nv
 
    vehicle_ids = set(kb.vehicles.keys())
 
    seen = Counter()
    for raw in x_list:
        rid = raw.get("id")
        seen[rid] += 1
        nv = _normalize_variant(raw, seen[rid], vehicle_ids, issues)
        kb.variants_by_vehicle.setdefault(raw.get("vehicle_id"), []).append(nv)
 
    # one summary warning for templated numeric fields (avoid per-row noise)
    present = [f for f in NON_AUTHORITATIVE_VARIANT_FIELDS if any(f in r for r in x_list)]
    if present:
        issues.append(Issue("warning", "non-authoritative-fields", "<variants>",
                            f"{', '.join(present)} are representative/templated per dataset "
                            "metadata — excluded from scoring, display only"))
 
    images = {os.path.basename(r["image_path"]) for r in (v_list + x_list) if r.get("image_path")}
    segs = sorted({v["vehicle_segment"] for v in kb.vehicles.values() if v.get("vehicle_segment")})
    fuels = sorted({v["fuel_type"] for v in kb.vehicles.values() if v.get("fuel_type")})
    no_var = [vid for vid in vehicle_ids if vid not in kb.variants_by_vehicle]
 
    kb.issues = issues
    kb.stats = {
        "n_vehicles": len(kb.vehicles),
        "n_variants": len(x_list),
        "n_images": len(images),
        "n_vehicles_no_variants": len(no_var),
        "segments": segs,
        "fuels": fuels,
        "vehicles_meta": v_meta,
        "variants_meta": x_meta,
    }
    return kb
 
 
# --- demo fixture (clearly SYNTHETIC — only exercises the loader's code paths) ---
_DEMO_VEHICLES = [
    {"id": "D001", "name": "Demo Hatch", "brand": "Acme", "price_inr": 600000,
     "price_segment": "Budget", "vehicle_segment": "Hatchback", "fuel_type": "Petrol",
     "transmission": ["manual", "automatic"], "maintenance_index": 0.3,
     "city_score": 0.9, "highway_score": 0.5, "image_path": "/assets/cars/demo_hatch.jpg"},
    {"id": "D002", "name": "Demo Lux", "brand": "Acme", "price_inr": 9000000,
     "price_segment": "Budget",              # deliberate mismatch vs numeric price
     "vehicle_segment": "sedan", "fuel_type": "electric",
     "transmission": ["automatic"], "environment_score": 1.4,   # deliberate out-of-range
     "image_path": ""},                      # deliberate missing image
]
_DEMO_VARIANTS = [
    {"id": "D001_base", "vehicle_id": "D001", "brand": "Acme", "model_name": "Demo Hatch",
     "powertrain_type": "Petrol", "price_inr": 600000, "city_score": 0.9,
     "engine_cc": 1197, "power_bhp": 85, "torque_nm": 115,
     "image_path": "/assets/cars/demo_hatch.jpg"},
    {"id": "D001_base", "vehicle_id": "D001", "brand": "Acme", "model_name": "Demo Hatch Plus",
     "powertrain_type": "Cng", "price_inr": 650000,               # duplicate id
     "image_path": "/assets/cars/demo_hatch.jpg"},
    {"id": "D999_x", "vehicle_id": "NOPE", "brand": "Ghost", "model_name": "Orphan",
     "powertrain_type": "Ev", "price_inr": 500000},               # orphan FK
]
 
 
def main():
    ap = argparse.ArgumentParser(description="Validate the Vehicle-DSS knowledge base.")
    ap.add_argument("--vehicles", help="path to vehicles JSON")
    ap.add_argument("--variants", help="path to variants JSON")
    ap.add_argument("--demo", action="store_true", help="run on a tiny synthetic fixture")
    args = ap.parse_args()
 
    if args.demo:
        kb = build_knowledge_base(vehicles_data=_DEMO_VEHICLES, variants_data=_DEMO_VARIANTS)
    else:
        if not args.vehicles:
            ap.error("pass --vehicles (and optionally --variants), or use --demo")
        kb = build_knowledge_base(args.vehicles, args.variants)
 
    print(kb.format_report())
    raise SystemExit(1 if kb.errors() else 0)
 
 
if __name__ == "__main__":
    main()
