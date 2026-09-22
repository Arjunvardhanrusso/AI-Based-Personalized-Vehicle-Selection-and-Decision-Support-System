"""
schema.py — canonical vocabulary + normalization for the Vehicle-DSS knowledge base.
 
The provided dataset mixes casing and label conventions across its two collections
(`vehicles` and `variants`). This module defines the ONE canonical vocabulary the
rest of the system uses, plus pure functions that map raw values onto it.
 
Nothing here invents data: unrecognized values return None and are reported by the
loader, never guessed or overwritten.
"""
from __future__ import annotations
 
# --- Canonical enums -------------------------------------------------------
 
FUEL_TYPES = {"petrol", "diesel", "cng", "ev", "hybrid"}
_FUEL_ALIASES = {
    "petrol": "petrol", "gasoline": "petrol",
    "diesel": "diesel",
    "cng": "cng",
    "ev": "ev", "electric": "ev", "bev": "ev",
    "hybrid": "hybrid", "mild-hybrid": "hybrid", "mild_hybrid": "hybrid",
    "strong-hybrid": "hybrid", "strong_hybrid": "hybrid",
    "phev": "hybrid", "plug-in-hybrid": "hybrid", "plugin-hybrid": "hybrid",
}
 
VEHICLE_SEGMENTS = {
    "hatchback", "sedan", "suv", "muv", "mpv", "crossover",
    "luxury", "supercar", "coupe", "convertible", "pickup", "van",
}
_SEGMENT_ALIASES = {
    "hatchback": "hatchback", "hatch": "hatchback",
    "sedan": "sedan",
    "suv": "suv", "compact-suv": "suv", "compact suv": "suv", "mid-suv": "suv",
    "muv": "muv", "mpv": "mpv",
    "crossover": "crossover",
    "luxury": "luxury",
    "supercar": "supercar", "hypercar": "supercar",
    "coupe": "coupe", "convertible": "convertible", "roadster": "convertible",
    "pickup": "pickup", "van": "van",
}
 
TRANSMISSIONS = {"manual", "automatic"}
_TRANSMISSION_ALIASES = {
    "manual": "manual", "mt": "manual",
    "automatic": "automatic", "auto": "automatic", "at": "automatic",
    "amt": "automatic", "cvt": "automatic", "dct": "automatic",
    "torque-converter": "automatic", "imt": "automatic",
}
 
# Ordinal price tiers. Thresholds (INR) are PROVISIONAL and used only for coarse
# labelling / cross-checking the messy text `price_segment`. The fuzzy module owns
# the real, smooth budget membership functions.
PRICE_TIERS = [
    ("entry",         0,           500_000),
    ("budget",        500_000,     800_000),
    ("mid",           800_000,     1_500_000),
    ("premium",       1_500_000,   3_500_000),
    ("luxury",        3_500_000,   7_500_000),
    ("ultra_luxury",  7_500_000,   20_000_000),
    ("exotic",        20_000_000,  float("inf")),
]
 
# Best-effort mapping of the raw text labels onto the tiers above (cross-check only).
_PRICE_LABEL_ALIASES = {
    "ultra-budget used": "entry", "budget used": "entry", "ultra-budget": "entry",
    "budget": "budget",
    "mid": "mid", "medium": "mid",
    "premium": "premium", "premium used": "premium",
    "luxury": "luxury", "high luxury": "luxury", "high-luxury": "luxury",
    "ultra-luxury": "ultra_luxury", "hyper-luxury ev": "ultra_luxury",
    "supercar": "exotic", "hypercar": "exotic",
}
 
# 0..1 score fields treated as authoritative and used in scoring.
SCORE_FIELDS = [
    "maintenance_index", "performance_score", "city_score", "highway_score",
    "environment_score", "charging_dependency", "fuel_infrastructure_dependency",
    "cng_infrastructure_dependency", "beginner_friendly", "resale_value_index",
]
 
# Variant fields the dataset metadata flags as representative/templated — kept for
# display but never scored on.
NON_AUTHORITATIVE_VARIANT_FIELDS = ["engine_cc", "power_bhp", "torque_nm"]
 
 
def _norm_key(value):
    return value.strip().lower() if isinstance(value, str) else value
 
 
def normalize_fuel(value):
    return _FUEL_ALIASES.get(_norm_key(value))
 
 
def normalize_segment(value):
    return _SEGMENT_ALIASES.get(_norm_key(value))
 
 
def normalize_transmission(value):
    return _TRANSMISSION_ALIASES.get(_norm_key(value))
 
 
def normalize_price_label(value):
    return _PRICE_LABEL_ALIASES.get(_norm_key(value))
 
 
def price_tier_from_inr(price):
    """Source-of-truth budget tier from the numeric price (not the text label)."""
    if not isinstance(price, (int, float)) or price <= 0:
        return None
    for name, lo, hi in PRICE_TIERS:
        if lo <= price < hi:
            return name
    return None
 
 
def is_unit_interval(x):
    return isinstance(x, (int, float)) and 0.0 <= x <= 1.0
