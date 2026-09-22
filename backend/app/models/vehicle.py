"""
Pydantic models for vehicle, variant, and location-specific pricing data.
"""
from pydantic import BaseModel, Field, ConfigDict, computed_field
from typing import List, Optional, Dict, Any


class VehiclePrice(BaseModel):
    """Represents location-specific ex-showroom price point."""
    model_config = ConfigDict(protected_namespaces=())

    vehicle_variant_id: str
    state: str
    city: Optional[str] = None
    ex_showroom_price_inr: float
    effective_from: Optional[str] = "2026-01-01"
    effective_to: Optional[str] = None
    source: Optional[str] = "Official Manufacturer Ex-Showroom Portal"
    last_verified: Optional[str] = "September 2026"
    is_verified: bool = True


class VehicleVariant(BaseModel):
    """First-class vehicle variant entity with manufacturer variant hierarchy."""
    model_config = ConfigDict(protected_namespaces=())

    id: str
    vehicle_id: str
    brand: str
    model_family: str
    model_name: str
    variant_name: str

    fuel_type: str
    powertrain_type: Optional[str] = None
    transmission: List[str]

    price_inr: float  # Base/Pan-India starting ex-showroom
    is_used: bool = False
    used_price_inr: Optional[float] = None

    body_type: str
    vehicle_type: str
    performance_type: str

    engine_cc: Optional[float] = None
    power_bhp: Optional[float] = None
    torque_nm: Optional[float] = None

    seating_capacity: int = 5
    boot_space_litres: int = 350
    ground_clearance_mm: int = 170

    features: List[str] = Field(default_factory=list)
    ncap_rating: Optional[int] = 4
    has_adas: Optional[bool] = False
    has_360_camera: Optional[bool] = False

    running_cost_per_km: float = 6.0
    maintenance_index: float = 0.3
    performance_score: float = 0.5
    city_score: float = 0.7
    highway_score: float = 0.7
    environment_score: float = 0.5
    charging_dependency: float = 0.0
    fuel_infrastructure_dependency: float = 0.8
    cng_infrastructure_dependency: float = 0.0
    beginner_friendly: float = 0.7
    resale_value_index: float = 0.7

    image_path: Optional[str] = None
    image_url: Optional[str] = None
    image_source: Optional[str] = None
    image_license: Optional[str] = None
    image_attribution: Optional[str] = None
    is_fallback: Optional[bool] = False
    market_status: str = "Current"

    # Contextual resolved pricing
    resolved_ex_showroom_price: Optional[float] = None
    price_location_label: Optional[str] = None
    price_source_label: Optional[str] = None
    price_last_verified: Optional[str] = None
    is_city_specific_price: bool = False

    @property
    def effective_price(self) -> float:
        if self.resolved_ex_showroom_price is not None:
            return self.resolved_ex_showroom_price
        if self.is_used and self.used_price_inr is not None:
            return self.used_price_inr
        return self.price_inr

    @computed_field
    @property
    def name(self) -> str:
        return f"{self.brand} {self.model_name} {self.variant_name}".strip()


class Vehicle(BaseModel):
    """Represents a base vehicle model from the knowledge base (backward compatible)."""
    model_config = ConfigDict(protected_namespaces=())

    id: str
    name: str
    brand: str
    price_inr: float
    price_segment: str
    vehicle_segment: str
    fuel_type: str
    transmission: List[str]
    running_cost_per_km: float
    maintenance_index: float
    performance_score: float
    city_score: float
    highway_score: float
    environment_score: float
    charging_dependency: float
    fuel_infrastructure_dependency: float
    seating_capacity: int
    ground_clearance_mm: int
    boot_space_litres: int
    used_market_available: bool
    beginner_friendly: float
    resale_value_index: float

    range_km: Optional[float] = None
    charging_time_hours: Optional[float] = None
    fast_charge_available: Optional[bool] = None
    cng_infrastructure_dependency: Optional[float] = 0.0

    is_used: bool = False
    used_price_inr: Optional[float] = None

    ncap_rating: Optional[int] = 4
    airbags: Optional[int] = 2
    has_adas: Optional[bool] = False
    has_360_camera: Optional[bool] = False
    image_path: Optional[str] = None
    image_url: Optional[str] = None
    image_source: Optional[str] = None
    image_license: Optional[str] = None
    image_attribution: Optional[str] = None
    is_fallback: Optional[bool] = False

    @property
    def effective_price(self) -> float:
        if self.is_used and self.used_price_inr is not None:
            return self.used_price_inr
        return self.price_inr


class VehicleScore(BaseModel):
    """Scored vehicle with component breakdowns."""
    model_config = ConfigDict(protected_namespaces=())

    vehicle: Vehicle
    total_score: float = Field(description="Final suitability score 0-100")

    cost_score: float = 0.0
    usage_compatibility: float = 0.0
    infrastructure_compatibility: float = 0.0
    maintenance_compatibility: float = 0.0
    transmission_compatibility: float = 0.0
    experience_compatibility: float = 0.0
    performance_compatibility: float = 0.0
    environmental_compatibility: float = 0.0
    practicality_score: float = 0.0

    weighted_components: dict = Field(default_factory=dict)
    positive_factors: List[str] = Field(default_factory=list)
    negative_factors: List[str] = Field(default_factory=list)
    image_path: Optional[str] = None


class VariantScore(BaseModel):
    """Scored variant entity with full explainability trace."""
    model_config = ConfigDict(protected_namespaces=())

    variant: VehicleVariant
    total_score: float
    cost_score: float = 0.0
    usage_compatibility: float = 0.0
    infrastructure_compatibility: float = 0.0
    maintenance_compatibility: float = 0.0
    transmission_compatibility: float = 0.0
    experience_compatibility: float = 0.0
    performance_compatibility: float = 0.0
    environmental_compatibility: float = 0.0
    practicality_score: float = 0.0
    weighted_components: dict = Field(default_factory=dict)
    positive_factors: List[str] = Field(default_factory=list)
    negative_factors: List[str] = Field(default_factory=list)
