"""
Vehicle Image Resolver Service

Provides a production-quality, multi-tiered automotive image resolution system:
Level 1: Memory & Persistent Cache (data/vehicle_images.json) - verified external/local images only
Level 2: Curated / local catalog image (if verified to exist on disk)
Level 3: Brand + Model CarAPI lookup (https://carapi.trustcar.info/getImage)
Level 4: Model alias / alternative name lookup via CarAPI
Level 5: Brand alternative lookup (e.g. Maruti Suzuki -> Suzuki)
Level 6: Curated verified Wikimedia Commons photography (for models not in CarAPI)
Level 7: Neutral vehicle body-type vector fallback (/images/fallbacks/{body_type}.svg)
Level 8: Neutral generic automotive vector placeholder (/images/fallbacks/default-car.svg)

Features:
- Accurate model name normalization (preserving core models like Grand i10 Nios, Exter, Aura, Nexon)
- Real CarAPI 302 redirect & Location header parsing
- Detection and rejection of CarAPI placeholder SVGs
- Extraction and preservation of Wikimedia license and attribution metadata
- Cache validation rejecting dead local paths, error URLs, and fake placeholders
"""
import os
import re
import json
import logging
import urllib.parse
from datetime import datetime
from typing import Dict, Any, Optional, List, Tuple
import requests

from app.models.vehicle_image import VehicleImageRecord, VehicleImageResponse

logger = logging.getLogger("vehicle_image_service")

# Resolve paths
_CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
_APP_DIR = os.path.dirname(_CURRENT_DIR)
_BACKEND_DIR = os.path.dirname(_APP_DIR)
_PROJECT_ROOT = os.path.dirname(_BACKEND_DIR)
_DATA_DIR = os.path.join(_PROJECT_ROOT, "data")
_PUBLIC_CARS_DIR = os.path.join(_PROJECT_ROOT, "frontend", "public", "assets", "cars")

CACHE_FILE_PATH = os.path.join(_DATA_DIR, "vehicle_images.json")

# Brand Normalization Mapping
BRAND_NORMALIZATION: Dict[str, str] = {
    "toyota motor corporation": "Toyota",
    "toyota motors": "Toyota",
    "toyota kirloskar motor": "Toyota",
    "toyota": "Toyota",
    "hyundai motor india": "Hyundai",
    "hyundai motors": "Hyundai",
    "hyundai": "Hyundai",
    "maruti suzuki india": "Maruti Suzuki",
    "maruti suzuki": "Maruti Suzuki",
    "maruti": "Maruti Suzuki",
    "tata motors": "Tata",
    "tata passenger electric mobility": "Tata",
    "tata": "Tata",
    "mahindra & mahindra": "Mahindra",
    "mahindra auto": "Mahindra",
    "mahindra": "Mahindra",
    "bmw india": "BMW",
    "bmw group": "BMW",
    "bmw": "BMW",
    "mercedes-benz": "Mercedes-Benz",
    "mercedes benz": "Mercedes-Benz",
    "mercedes": "Mercedes-Benz",
    "audi ag": "Audi",
    "audi india": "Audi",
    "audi": "Audi",
    "volkswagen passenger cars": "Volkswagen",
    "volkswagen": "Volkswagen",
    "vw": "Volkswagen",
    "kia india": "Kia",
    "kia motors": "Kia",
    "kia": "Kia",
    "honda cars india": "Honda",
    "honda motor": "Honda",
    "honda": "Honda",
    "mg motor india": "MG",
    "morris garages": "MG",
    "mg": "MG",
    "renault india": "Renault",
    "renault": "Renault",
    "nissan motor india": "Nissan",
    "nissan": "Nissan",
    "skoda auto india": "Skoda",
    "skoda": "Skoda",
    "land rover": "Land Rover",
    "range rover": "Land Rover",
    "rolls-royce": "Rolls-Royce",
    "rolls royce": "Rolls-Royce",
    "aston martin": "Aston Martin",
    "porsche": "Porsche",
    "ferrari": "Ferrari",
    "lamborghini": "Lamborghini",
    "bentley": "Bentley",
    "maserati": "Maserati",
    "mclaren": "McLaren",
    "volvo cars": "Volvo",
    "volvo": "Volvo",
    "byd auto": "BYD",
    "byd": "BYD",
    "force motors": "Force Motors",
    "force": "Force Motors",
    "isuzu motors": "Isuzu",
    "isuzu": "Isuzu",
    "jeep india": "Jeep",
    "jeep": "Jeep",
    "lexus india": "Lexus",
    "lexus": "Lexus",
    "jaguar": "Jaguar",
}

# Model Alias Fallbacks (for provider-specific naming in CarAPI)
MODEL_ALIASES: Dict[Tuple[str, str], Tuple[str, str]] = {
    # Hyundai
    ("Hyundai", "Grand i10 Nios"): ("Hyundai", "i10"),
    # Mahindra
    ("Mahindra", "Scorpio-N"): ("Mahindra", "Scorpio"),
    ("Mahindra", "Scorpio Classic"): ("Mahindra", "Scorpio"),
    ("Mahindra", "XUV 3XO"): ("Mahindra", "XUV300"),
    # Toyota
    ("Toyota", "Innova Hycross"): ("Toyota", "Innova"),
    ("Toyota", "Innova Crysta"): ("Toyota", "Innova"),
    ("Toyota", "Urban Cruiser Hyryder"): ("Toyota", "Urban Cruiser"),
    # Maruti Suzuki
    ("Maruti Suzuki", "Brezza"): ("Maruti Suzuki", "Vitara Brezza"),
    ("Maruti Suzuki", "Alto K10"): ("Suzuki", "Alto"),
    ("Maruti Suzuki", "Alto"): ("Suzuki", "Alto"),
    ("Maruti Suzuki", "Ertiga"): ("Suzuki", "Ertiga"),
    ("Maruti Suzuki", "Wagon R"): ("Suzuki", "Wagon R"),
    ("Maruti Suzuki", "Dzire"): ("Suzuki", "Swift"),
    ("Maruti Suzuki", "Ciaz"): ("Suzuki", "Ciaz"),
    ("Maruti Suzuki", "Ignis"): ("Suzuki", "Ignis"),
    ("Maruti Suzuki", "Grand Vitara"): ("Suzuki", "Vitara"),
    ("Maruti Suzuki", "Fronx"): ("Suzuki", "Baleno"),
    ("Maruti Suzuki", "XL6"): ("Suzuki", "Ertiga"),
    ("Maruti Suzuki", "S-Presso"): ("Suzuki", "Ignis"),
    # Tata
    ("Tata", "Nexon EV"): ("Tata", "Nexon"),
    ("Tata", "Punch EV"): ("Tata", "Punch"),
    ("Tata", "Curvv EV"): ("Tata", "Curvv"),
    ("Tata", "Tiago EV"): ("Tata", "Tiago"),
    ("Tata", "Tigor EV"): ("Tata", "Tigor"),
    # Honda
    ("Honda", "City e:HEV"): ("Honda", "City"),
    # MG
    ("MG", "Comet EV"): ("MG", "Comet"),
    ("MG", "Windsor EV"): ("MG", "Windsor"),
    ("MG", "ZS EV"): ("MG", "ZS"),
    # Luxury / Performance
    ("Land Rover", "Defender 110"): ("Land Rover", "Defender"),
    ("Lamborghini", "Urus SE"): ("Lamborghini", "Urus"),
    ("Mercedes-Benz", "GLE 450"): ("Mercedes-Benz", "GLE"),
    ("Rolls-Royce", "Phantom VIII"): ("Rolls-Royce", "Phantom"),
    ("Volvo", "XC90 Recharge Hybrid"): ("Volvo", "XC90"),
    ("Volvo", "XC40 Recharge"): ("Volvo", "XC40"),
    ("Porsche", "Cayenne Coupe"): ("Porsche", "Cayenne"),
    ("Porsche", "911 Carrera GTS"): ("Porsche", "911 Carrera"),
    ("Porsche", "Taycan 4S"): ("Porsche", "Taycan"),
    ("Aston Martin", "DBX707"): ("Aston Martin", "DBX"),
}

# Curated Wikimedia direct photo URLs for models missing in CarAPI
CURATED_WIKIMEDIA: Dict[Tuple[str, str], Dict[str, str]] = {
    ("Mahindra", "Bolero"): {
        "image_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Mahindra_Bolero_GLX.jpg/640px-Mahindra_Bolero_GLX.jpg",
        "source": "wikimedia",
        "license": "CC BY-SA 4.0",
        "attribution": "Mahindra Bolero GLX via Wikimedia Commons",
        "source_url": "https://commons.wikimedia.org/wiki/File:Mahindra_Bolero_GLX.jpg"
    },
    ("Mahindra", "XUV400"): {
        "image_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Mahindra_XUV400_EV_Auto_Expo_2023.jpg/640px-Mahindra_XUV400_EV_Auto_Expo_2023.jpg",
        "source": "wikimedia",
        "license": "CC BY-SA 4.0",
        "attribution": "Mahindra XUV400 EV via Wikimedia Commons",
        "source_url": "https://commons.wikimedia.org/wiki/File:Mahindra_XUV400_EV_Auto_Expo_2023.jpg"
    }
}

BODY_TYPE_FALLBACKS: Dict[str, str] = {
    "suv": "/images/fallbacks/suv.svg",
    "compact suv": "/images/fallbacks/suv.svg",
    "mid-size suv": "/images/fallbacks/suv.svg",
    "full-size suv": "/images/fallbacks/suv.svg",
    "sedan": "/images/fallbacks/sedan.svg",
    "compact sedan": "/images/fallbacks/sedan.svg",
    "executive sedan": "/images/fallbacks/sedan.svg",
    "luxury sedan": "/images/fallbacks/luxury.svg",
    "hatchback": "/images/fallbacks/hatchback.svg",
    "premium hatchback": "/images/fallbacks/hatchback.svg",
    "mpv": "/images/fallbacks/mpv.svg",
    "coupe": "/images/fallbacks/coupe.svg",
    "convertible": "/images/fallbacks/convertible.svg",
    "sports car": "/images/fallbacks/sports-car.svg",
    "supercar": "/images/fallbacks/supercar.svg",
    "hypercar": "/images/fallbacks/supercar.svg",
    "luxury": "/images/fallbacks/luxury.svg",
    "pickup": "/images/fallbacks/pickup.svg",
    "offroad": "/images/fallbacks/offroad.svg",
    "4x4": "/images/fallbacks/offroad.svg",
    "crossover": "/images/fallbacks/suv.svg",
}

DEFAULT_FALLBACK_IMAGE = "/images/fallbacks/default-car.svg"


class VehicleImageService:
    """Centralized Vehicle Image Resolver with multi-level fallback & persistent caching."""

    def __init__(self):
        self._cache: Dict[str, VehicleImageRecord] = {}
        self._local_cars_index: Dict[str, str] = {}
        self._loaded = False
        self._session = requests.Session()
        self._session.headers.update({
            "User-Agent": "VehicleIQ-Intelligence-System/2.0 (Automotive Catalog Platform)"
        })

    def load(self):
        if self._loaded:
            return

        # 1. Index available local car images in frontend/public/assets/cars (if genuine files exist)
        if os.path.exists(_PUBLIC_CARS_DIR):
            for fname in os.listdir(_PUBLIC_CARS_DIR):
                if fname.lower().endswith((".jpg", ".jpeg", ".png", ".webp")) and not fname.startswith("default"):
                    base = os.path.splitext(fname)[0].lower()
                    rel_path = f"/assets/cars/{fname}"
                    self._local_cars_index[base] = rel_path

        # 2. Load persistent cache and validate every record
        if os.path.exists(CACHE_FILE_PATH):
            try:
                with open(CACHE_FILE_PATH, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    records = data.get("images", {})
                    valid_count = 0
                    for vid, rec in records.items():
                        url = rec.get("image_url", "")
                        is_fb = rec.get("is_fallback", False)
                        
                        # Validate cache record:
                        # If marked as not fallback, it must be a valid external URL or an existing local file
                        if not is_fb:
                            if not self._is_valid_image_url(url):
                                continue
                        
                        try:
                            self._cache[vid] = VehicleImageRecord(**rec)
                            valid_count += 1
                        except Exception:
                            continue
                    logger.info(f"Loaded {valid_count} valid cached vehicle images (discarded invalid).")
            except Exception as e:
                logger.warning(f"Failed to load vehicle_images.json: {e}")

        self._loaded = True

    def _is_valid_image_url(self, url: Optional[str]) -> bool:
        """Validate if image URL is a real usable image."""
        if not url or not isinstance(url, str):
            return False
        url_clean = url.strip()
        if not url_clean:
            return False
        # Reject placeholders and SVG error files
        if "car-placeholder" in url_clean or "placehold.co" in url_clean:
            return False
        if url_clean.startswith("http://") or url_clean.startswith("https://"):
            return not url_clean.lower().endswith(".svg")
        if url_clean.startswith("/assets/cars/"):
            fname = url_clean.replace("/assets/cars/", "")
            return os.path.exists(os.path.join(_PUBLIC_CARS_DIR, fname))
        return False

    def save_cache(self):
        """Persist cache to data/vehicle_images.json."""
        try:
            os.makedirs(os.path.dirname(CACHE_FILE_PATH), exist_ok=True)
            data = {
                "_metadata": {
                    "description": "Cached vehicle images resolved via CarAPI, curated Wikimedia, and neutral fallbacks.",
                    "updated_at": datetime.utcnow().isoformat(),
                    "total_cached": len(self._cache)
                },
                "images": {vid: rec.model_dump() for vid, rec in self._cache.items()}
            }
            with open(CACHE_FILE_PATH, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2)
        except Exception as e:
            logger.error(f"Error saving vehicle_images.json: {e}")

    @staticmethod
    def normalize_brand(brand: Optional[str]) -> str:
        """Normalize manufacturer name to standard canonical brand."""
        if not brand:
            return "Unknown"
        b_clean = brand.lower().strip()
        return BRAND_NORMALIZATION.get(b_clean, brand.strip())

    @staticmethod
    def normalize_model(model_raw: Optional[str], brand: Optional[str] = None) -> str:
        """
        Normalize vehicle model name for image search.
        Strips trim lines, engine specifications, years, and variant badges.
        Crucially preserves core vehicle identities:
        e.g. Grand i10 Nios, Exter, Aura, Nexon, Fortuner, Scorpio-N, Alto K10.
        """
        if not model_raw:
            return "Unknown"
        
        m = model_raw.strip()

        # 1. Remove used car / pre-owned prefixes & years: e.g. "Pre-Owned Swift VXi 2020"
        m = re.sub(r"(?i)^(pre-owned|used)\s+", "", m)
        m = re.sub(r"\s*\(?\b(19\d\d|20\d\d)\b\)?", "", m)

        # 2. Remove brand if repeated inside model: e.g. "Hyundai Creta" -> "Creta"
        if brand and m.lower().startswith(brand.lower()):
            m = m[len(brand):].strip()

        # 3. Remove engine displacement: e.g. "1.5", "2.0", "1.2L", "800", etc.
        m = re.sub(r"\b\d+\.\d+\s*(?:L|l|Turbo|TSI|MPI|VTVT|CRDI)?\b", "", m)

        # 4. Remove parenthesized qualifiers like (O), (Opt), (CNG), (Standard Trim)
        m = re.sub(r"\s*\([A-Za-z0-9_+\- ]+\)", "", m)

        # 5. Remove compound powertrain tokens first
        compound_powertrain = [
            r"\b(?:Mild|Strong|Smart)\s+Hybrid\b",
            r"\b(?:Long|Standard)\s+Range\b",
        ]
        for cp in compound_powertrain:
            m = re.sub(cp, "", m, flags=re.IGNORECASE)

        # 6. Remove individual powertrain / fuel / transmission tokens
        powertrain_tokens = [
            r"\bCNG\b", r"\bDiesel\b", r"\bPetrol\b", r"\bHybrid\b", r"\be:HEV\b",
            r"\bEV\b", r"\bElectric\b",
            r"\bDCT\b", r"\bAT\b", r"\bMT\b", r"\bCVT\b", r"\bAMT\b", r"\biMT\b",
            r"\b4x4\b", r"\b4x2\b", r"\b4WD\b", r"\bAWD\b"
        ]
        for pt in powertrain_tokens:
            m = re.sub(pt, "", m, flags=re.IGNORECASE)

        # 7. Remove trim designations (careful not to match 'S' in 'S-Presso')
        trim_tokens = [
            r"\bSportz\b", r"\bAdventure\b", r"\bCreative\b", r"\bFearless\b", r"\bPure\b", r"\bSmart\b",
            r"\bSX(?:\(O\))?\b", r"\bEX\b", r"(?<!-)\bS\b(?!-)", r"\bE\b",
            r"\bLXi\b", r"\bVXi\b", r"\bZXi\+?\b", r"\bLDi\b", r"\bVDi\b", r"\bZDi\+?\b",
            r"\bXZ\+?\b", r"\bXT\+?\b", r"\bXM\+?\b", r"\bXE\b",
            r"\bAlpha\b", r"\bZeta\b", r"\bDelta\b", r"\bSigma\b",
            r"\bAsta(?:\(O\))?\b", r"\bMagna\b", r"\bEra\b",
            r"\bVX\b", r"\bZX\b", r"\bGX\b", r"\bDX\b", r"\bAX\b",
            r"\bHTE\b", r"\bHTK\+?\b", r"\bHTX\+?\b", r"\bGTX\+?\b",
            r"\bAX5\b", r"\bAX7L?\b", r"\bLX\b", r"\bW[468]\b"
        ]
        for tt in trim_tokens:
            m = re.sub(tt, "", m, flags=re.IGNORECASE)

        # 8. Cleanup extra whitespace, plus signs, and trailing punctuation
        m = re.sub(r"\+", "", m)
        m = re.sub(r"\s+", " ", m).strip(" -_,()")
        return m if m else model_raw.strip()

    def _query_carapi(self, brand: str, model: str) -> Optional[Dict[str, str]]:
        """
        Queries CarAPI / trustcarinfo endpoint without auto-following redirects.
        Returns image metadata dict {image_url, source, license, attribution, source_url}
        or None if no real photograph exists.
        """
        try:
            query = urllib.parse.urlencode({"make": brand, "model": model})
            url = f"https://carapi.trustcar.info/getImage?{query}"

            # Request with 5 second timeout and allow_redirects=False (VERIFICATION ENABLED)
            resp = self._session.get(url, allow_redirects=False, timeout=5.0)

            # Case 1: 301, 302, 307, 308 redirect containing CDN image URL
            if resp.status_code in (301, 302, 303, 307, 308):
                location = resp.headers.get("Location")
                if not location:
                    return None
                
                # Check for placeholder SVG or invalid targets
                if "car-placeholder" in location or location.lower().endswith(".svg") or not location.startswith("http"):
                    return None

                return {
                    "image_url": location,
                    "source": resp.headers.get("x-image-source", "carapi"),
                    "license": resp.headers.get("x-image-license", "CC BY-SA"),
                    "attribution": resp.headers.get("x-image-attribution", f"{brand} {model} via CarAPI / Wikimedia Commons"),
                    "source_url": resp.headers.get("x-image-source-url", "")
                }

            # Case 2: 200 OK
            if resp.status_code == 200:
                content_type = resp.headers.get("content-type", "").lower()
                # Check for JSON response
                if "json" in content_type:
                    try:
                        data = resp.json()
                        img_url = data.get("image_url") or data.get("url") or data.get("location")
                        if self._is_valid_image_url(img_url):
                            return {
                                "image_url": img_url,
                                "source": data.get("source", "carapi"),
                                "license": data.get("license", "CC BY-SA"),
                                "attribution": data.get("attribution", f"{brand} {model} via CarAPI"),
                                "source_url": data.get("source_url", "")
                            }
                    except Exception:
                        pass
                # Check for direct image bytes
                elif "image" in content_type and "svg" not in content_type:
                    return {
                        "image_url": url,
                        "source": resp.headers.get("x-image-source", "carapi"),
                        "license": resp.headers.get("x-image-license", "CC BY-SA"),
                        "attribution": resp.headers.get("x-image-attribution", f"{brand} {model} via CarAPI / Wikimedia"),
                        "source_url": resp.headers.get("x-image-source-url", "")
                    }

        except Exception as e:
            logger.debug(f"CarAPI lookup for {brand} {model} failed: {e}")
        return None

    def resolve_body_type_fallback(self, body_type: Optional[str]) -> str:
        """Resolve body type fallback graphic."""
        if not body_type:
            return DEFAULT_FALLBACK_IMAGE
        b_clean = body_type.lower().strip()
        return BODY_TYPE_FALLBACKS.get(b_clean, DEFAULT_FALLBACK_IMAGE)

    def resolve_vehicle_image(
        self,
        vehicle_id: str,
        brand: str,
        model_name: str,
        variant_name: Optional[str] = None,
        body_type: Optional[str] = None,
        existing_image_path: Optional[str] = None,
        live_lookup: bool = False
    ) -> VehicleImageResponse:
        """
        Resolves the best available image for a vehicle.
        Priority:
        1. Memory / Persistent Cache (validated)
        2. Verified local catalog image (must exist on disk)
        3. Direct CarAPI Online Lookup (make + normalized model) [IF live_lookup]
        4. Model Alias CarAPI Lookup (e.g. Grand i10 Nios -> i10) [IF live_lookup]
        5. Brand Alternative Lookup (e.g. Maruti Suzuki -> Suzuki) [IF live_lookup]
        6. Curated Wikimedia Photography (e.g. Mahindra Bolero)
        7. Body-Type Vector Fallback
        8. Generic Automotive Vector Fallback
        """
        self.load()

        # LEVEL 1: Check Cache first (validate that it isn't an invalid/dead URL)
        if vehicle_id in self._cache:
            c = self._cache[vehicle_id]
            if not c.is_fallback and self._is_valid_image_url(c.image_url):
                return VehicleImageResponse(
                    vehicle_id=c.vehicle_id,
                    image_url=c.image_url,
                    source=c.image_source,
                    license=c.image_license,
                    attribution=c.image_attribution,
                    image_type=c.image_type,
                    is_fallback=False,
                )
            elif c.is_fallback and c.image_url and (c.image_url.startswith("/images/fallbacks/") or c.image_url.startswith("http")):
                return VehicleImageResponse(
                    vehicle_id=c.vehicle_id,
                    image_url=c.image_url,
                    source=c.image_source,
                    license=c.image_license,
                    attribution=c.image_attribution,
                    image_type=c.image_type,
                    is_fallback=True,
                )
            else:
                # Invalidate bad cache entry
                del self._cache[vehicle_id]

        norm_brand = self.normalize_brand(brand)
        norm_model = self.normalize_model(model_name or variant_name or "", norm_brand)

        # LEVEL 2: Verified local file (must actually exist on disk)
        if existing_image_path and self._is_valid_image_url(existing_image_path):
            # Resolve the full path on disk
            import os
            base_name = os.path.basename(existing_image_path)
            local_full_path = os.path.join(_PUBLIC_CARS_DIR, base_name)
            
            if os.path.exists(local_full_path) or existing_image_path.startswith("http") or existing_image_path.startswith("/images/fallbacks/"):
                record = VehicleImageRecord(
                    id=f"img_{vehicle_id}",
                    vehicle_id=vehicle_id,
                    image_url=existing_image_path.strip(),
                    image_source="local_catalog",
                    image_license="Official Manufacturer / Editorial",
                    image_attribution=f"{norm_brand} Media Center",
                    image_type="model",
                    is_fallback=False if not existing_image_path.startswith("/images/fallbacks/") else True,
                    created_at=datetime.utcnow().isoformat(),
                    updated_at=datetime.utcnow().isoformat()
                )
                self._cache[vehicle_id] = record
                return VehicleImageResponse(
                    vehicle_id=vehicle_id,
                    image_url=record.image_url,
                    source=record.image_source,
                    license=record.image_license,
                    attribution=record.image_attribution,
                    image_type=record.image_type,
                    is_fallback=record.is_fallback
                )

        if live_lookup:
            # LEVEL 3: Direct CarAPI Query
            carapi_res = self._query_carapi(norm_brand, norm_model)
            if carapi_res and self._is_valid_image_url(carapi_res["image_url"]):
                record = VehicleImageRecord(
                    id=f"img_{vehicle_id}",
                    vehicle_id=vehicle_id,
                    image_url=carapi_res["image_url"],
                    image_source=carapi_res.get("source", "carapi"),
                    image_license=carapi_res.get("license", "CC BY-SA"),
                    image_attribution=carapi_res.get("attribution", f"{norm_brand} {norm_model} via CarAPI / Wikimedia"),
                    image_type="model",
                    is_fallback=False,
                    created_at=datetime.utcnow().isoformat(),
                    updated_at=datetime.utcnow().isoformat()
                )
                self._cache[vehicle_id] = record
                return VehicleImageResponse(
                    vehicle_id=vehicle_id,
                    image_url=record.image_url,
                    source=record.image_source,
                    license=record.image_license,
                    attribution=record.image_attribution,
                    image_type=record.image_type,
                    is_fallback=False
                )

            # LEVEL 4: Model Alias CarAPI Lookup
            if (norm_brand, norm_model) in MODEL_ALIASES:
                alt_brand, alt_model = MODEL_ALIASES[(norm_brand, norm_model)]
                alias_res = self._query_carapi(alt_brand, alt_model)
                if alias_res and self._is_valid_image_url(alias_res["image_url"]):
                    record = VehicleImageRecord(
                        id=f"img_{vehicle_id}",
                        vehicle_id=vehicle_id,
                        image_url=alias_res["image_url"],
                        image_source=alias_res.get("source", "carapi"),
                        image_license=alias_res.get("license", "CC BY-SA"),
                        image_attribution=alias_res.get("attribution", f"{norm_brand} {norm_model} via CarAPI / Wikimedia"),
                        image_type="brand_model",
                        is_fallback=False,
                        created_at=datetime.utcnow().isoformat(),
                        updated_at=datetime.utcnow().isoformat()
                    )
                    self._cache[vehicle_id] = record
                    return VehicleImageResponse(
                        vehicle_id=vehicle_id,
                        image_url=record.image_url,
                        source=record.image_source,
                        license=record.image_license,
                        attribution=record.image_attribution,
                        image_type=record.image_type,
                        is_fallback=False
                    )

            # LEVEL 5: Brand Alternative Lookup (e.g. Maruti Suzuki -> Suzuki)
            if norm_brand.lower() == "maruti suzuki":
                suzuki_res = self._query_carapi("Suzuki", norm_model)
                if suzuki_res and self._is_valid_image_url(suzuki_res["image_url"]):
                    record = VehicleImageRecord(
                        id=f"img_{vehicle_id}",
                        vehicle_id=vehicle_id,
                        image_url=suzuki_res["image_url"],
                        image_source=suzuki_res.get("source", "carapi"),
                        image_license=suzuki_res.get("license", "CC BY-SA"),
                        image_attribution=suzuki_res.get("attribution", f"{norm_brand} {norm_model} via CarAPI / Wikimedia"),
                        image_type="model",
                        is_fallback=False,
                        created_at=datetime.utcnow().isoformat(),
                        updated_at=datetime.utcnow().isoformat()
                    )
                    self._cache[vehicle_id] = record
                    return VehicleImageResponse(
                        vehicle_id=vehicle_id,
                        image_url=record.image_url,
                        source=record.image_source,
                        license=record.image_license,
                        attribution=record.image_attribution,
                        image_type=record.image_type,
                        is_fallback=False
                    )

        # LEVEL 6: Curated Wikimedia Direct Photos
        if (norm_brand, norm_model) in CURATED_WIKIMEDIA:
            curated = CURATED_WIKIMEDIA[(norm_brand, norm_model)]
            record = VehicleImageRecord(
                id=f"img_{vehicle_id}",
                vehicle_id=vehicle_id,
                image_url=curated["image_url"],
                image_source=curated.get("source", "wikimedia"),
                image_license=curated.get("license", "CC BY-SA 4.0"),
                image_attribution=curated.get("attribution"),
                image_type="model",
                is_fallback=False,
                created_at=datetime.utcnow().isoformat(),
                updated_at=datetime.utcnow().isoformat()
            )
            self._cache[vehicle_id] = record
            return VehicleImageResponse(
                vehicle_id=vehicle_id,
                image_url=record.image_url,
                source=record.image_source,
                license=record.image_license,
                attribution=record.image_attribution,
                image_type=record.image_type,
                is_fallback=False
            )

        # LEVEL 7: Body-Type Fallback
        body_fallback = self.resolve_body_type_fallback(body_type)
        if body_fallback:
            record = VehicleImageRecord(
                id=f"img_{vehicle_id}",
                vehicle_id=vehicle_id,
                image_url=body_fallback,
                image_source="body_type_fallback",
                image_license="VehicleIQ Vector Asset",
                image_attribution="VehicleIQ Sleek Slate",
                image_type="body_type",
                is_fallback=True,
                created_at=datetime.utcnow().isoformat(),
                updated_at=datetime.utcnow().isoformat()
            )
            self._cache[vehicle_id] = record
            return VehicleImageResponse(
                vehicle_id=vehicle_id,
                image_url=record.image_url,
                source=record.image_source,
                license=record.image_license,
                attribution=record.image_attribution,
                image_type=record.image_type,
                is_fallback=True
            )

        # LEVEL 8: Generic Automotive Fallback
        record = VehicleImageRecord(
            id=f"img_{vehicle_id}",
            vehicle_id=vehicle_id,
            image_url=DEFAULT_FALLBACK_IMAGE,
            image_source="local_fallback",
            image_license="VehicleIQ Vector Asset",
            image_attribution="VehicleIQ Sleek Slate",
            image_type="fallback",
            is_fallback=True,
            created_at=datetime.utcnow().isoformat(),
            updated_at=datetime.utcnow().isoformat()
        )
        self._cache[vehicle_id] = record
        return VehicleImageResponse(
            vehicle_id=vehicle_id,
            image_url=record.image_url,
            source=record.image_source,
            license=record.image_license,
            attribution=record.image_attribution,
            image_type=record.image_type,
            is_fallback=True
        )

    def resolve_catalogue_bulk(self, vehicles: List[Any], batch_size: int = 20) -> int:
        """
        Controlled batch resolution for the catalogue.
        Saves updated cache to disk.
        """
        self.load()
        resolved_count = 0
        for i in range(0, len(vehicles), batch_size):
            batch = vehicles[i:i + batch_size]
            for v in batch:
                vid = getattr(v, "id", None) or getattr(v, "vehicle_id", None)
                if not vid:
                    continue
                brand = getattr(v, "brand", "")
                model = getattr(v, "model_name", None) or getattr(v, "name", "")
                variant = getattr(v, "variant_name", None)
                body = getattr(v, "body_type", None) or getattr(v, "vehicle_segment", None)
                img_path = getattr(v, "image_path", None)
                self.resolve_vehicle_image(
                    vehicle_id=vid,
                    brand=brand,
                    model_name=model,
                    variant_name=variant,
                    body_type=body,
                    existing_image_path=img_path,
                    live_lookup=True
                )
                resolved_count += 1
        
        self.save_cache()
        return resolved_count


vehicle_image_service = VehicleImageService()
normalize_model = VehicleImageService.normalize_model
normalize_brand = VehicleImageService.normalize_brand
