"""
Pydantic models for user input profiles and advanced multi-filtering.
"""

from enum import Enum
from typing import Optional, List

from pydantic import BaseModel, Field, ConfigDict


class ExperienceLevel(str, Enum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    EXPERIENCED = "experienced"


class DrivingEnvironment(str, Enum):
    CITY = "city"
    HIGHWAY = "highway"
    MIXED = "mixed"


class TransmissionPreference(str, Enum):
    MANUAL = "manual"
    AUTOMATIC = "automatic"
    UNKNOWN = "unknown"


class ChargingKnowledge(str, Enum):
    AVAILABLE = "available"
    AT_WORK = "at_work"
    PUBLIC_ONLY = "public_only"
    UNAVAILABLE = "unavailable"
    UNKNOWN = "unknown"


class ParkingType(str, Enum):
    PRIVATE_HOUSE = "private_house"
    APARTMENT_WITH_DEDICATED = "apartment_with_dedicated"
    APARTMENT_WITHOUT_DEDICATED = "apartment_without_dedicated"
    STREET_PARKING = "street_parking"
    UNKNOWN = "unknown"


class ImportanceLevel(str, Enum):
    VERY_HIGH = "very_high"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class LongDistanceFrequency(str, Enum):
    FREQUENT = "frequent"
    OCCASIONAL = "occasional"
    RARE = "rare"


class BootSpaceNeed(str, Enum):
    SMALL = "small"
    MEDIUM = "medium"
    LARGE = "large"


class GroundClearanceNeed(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class DrivingFrequency(str, Enum):
    DAILY = "daily"
    FREQUENT = "frequent"
    OCCASIONAL = "occasional"
    RARE = "rare"


class ConfidenceLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class FuelStationAccess(str, Enum):
    EASY = "easy"
    MODERATE = "moderate"
    DIFFICULT = "difficult"


class VehicleConditionPref(str, Enum):
    NEW_ONLY = "new_only"
    PREFER_NEW = "prefer_new"
    NO_PREFERENCE = "no_preference"
    PREFER_USED = "prefer_used"


class VehicleType(str, Enum):
    HATCHBACK = "hatchback"
    SEDAN = "sedan"
    SUV = "suv"
    COUPE = "coupe"
    COUPE_SUV = "coupe_suv"
    CONVERTIBLE = "convertible"
    ROADSTER = "roadster"
    SPORTS_CAR = "sports_car"
    SUPERCAR = "supercar"
    HYPERCAR = "hypercar"
    HYPERSPORT = "hypersport"
    GRAND_TOURER = "grand_tourer"
    LUXURY = "luxury"
    LIMOUSINE = "limousine"
    MPV = "mpv"
    MUV = "muv"
    WAGON = "wagon"
    ESTATE = "estate"
    SHOOTING_BRAKE = "shooting_brake"
    CROSSOVER = "crossover"
    PICKUP = "pickup"
    VAN = "van"
    MINIVAN = "minivan"
    OFF_ROAD = "off_road"
    FOUR_BY_FOUR = "4x4"
    MICROCAR = "microcar"
    CITY_CAR = "city_car"
    COMMERCIAL_VAN = "commercial_van"
    NO_PREFERENCE = "no_preference"
    UNKNOWN = "unknown"


class PerformanceType(str, Enum):
    ECONOMY = "economy"
    STANDARD = "standard"
    SPORTY = "sporty"
    PERFORMANCE = "performance"
    SPORTS_CAR = "sports_car"
    SUPERSPORT = "supersport"
    SUPERCAR = "supercar"
    HYPERCAR = "hypercar"
    HYPERSPORT = "hypersport"
    GRAND_TOURER = "grand_tourer"
    OFF_ROAD = "off_road"
    LUXURY = "luxury"
    TRACK_FOCUSED = "track_focused"
    NO_PREFERENCE = "no_preference"
    UNKNOWN = "unknown"


class UserProfile(BaseModel):
    """Complete user input profile from the questionnaire."""

    state: Optional[str] = None
    city: Optional[str] = None

    first_time_owner: Optional[bool] = True
    experience: Optional[ExperienceLevel] = ExperienceLevel.BEGINNER
    driving_confidence: Optional[ConfidenceLevel] = ConfidenceLevel.MEDIUM

    daily_distance: Optional[float] = Field(
        default=30,
        ge=0,
        le=300,
        description="Daily distance in km",
    )

    driving_frequency: Optional[DrivingFrequency] = DrivingFrequency.FREQUENT
    driving_environment: Optional[DrivingEnvironment] = DrivingEnvironment.MIXED
    long_distance_frequency: Optional[LongDistanceFrequency] = LongDistanceFrequency.OCCASIONAL

    purchase_budget: Optional[float] = Field(
        default=1000000,
        ge=0,
        description="Maximum budget in INR",
    )

    running_cost_importance: Optional[ImportanceLevel] = ImportanceLevel.MEDIUM
    maintenance_importance: Optional[ImportanceLevel] = ImportanceLevel.MEDIUM

    transmission_preference: Optional[TransmissionPreference] = TransmissionPreference.UNKNOWN
    performance_importance: Optional[ImportanceLevel] = ImportanceLevel.MEDIUM

    seating_requirement: Optional[int] = Field(
        default=5,
        ge=1,
        le=10,
    )

    boot_space_need: Optional[BootSpaceNeed] = BootSpaceNeed.MEDIUM
    ground_clearance_need: Optional[GroundClearanceNeed] = GroundClearanceNeed.MEDIUM

    parking: Optional[ParkingType] = ParkingType.UNKNOWN
    charging_knowledge: Optional[ChargingKnowledge] = ChargingKnowledge.UNKNOWN
    fuel_station_access: Optional[FuelStationAccess] = FuelStationAccess.EASY

    environmental_preference: Optional[ImportanceLevel] = ImportanceLevel.MEDIUM

    vehicle_condition_preference: Optional[VehicleConditionPref] = (
        VehicleConditionPref.NO_PREFERENCE
    )

    preferred_brands: Optional[List[str]] = Field(
        default=None,
        description="Optional list of user-preferred brand names",
    )

    preferred_vehicle_types: Optional[List[VehicleType]] = Field(
        default=None,
        description="Optional preferred vehicle types",
    )

    preferred_performance_types: Optional[List[PerformanceType]] = Field(
        default=None,
        description="Optional preferred performance categories",
    )

    priority_running_cost: Optional[float] = Field(
        default=0.5,
        ge=0,
        le=1,
    )

    priority_maintenance: Optional[float] = Field(
        default=0.5,
        ge=0,
        le=1,
    )

    priority_performance: Optional[float] = Field(
        default=0.5,
        ge=0,
        le=1,
    )

    priority_environment: Optional[float] = Field(
        default=0.5,
        ge=0,
        le=1,
    )

    priority_purchase_price: Optional[float] = Field(
        default=0.5,
        ge=0,
        le=1,
    )

    priority_long_distance: Optional[float] = Field(
        default=0.5,
        ge=0,
        le=1,
    )

    priority_comfort: Optional[float] = Field(
        default=0.5,
        ge=0,
        le=1,
    )


class AdvancedFilterQuery(BaseModel):
    """
    Advanced multi-criteria vehicle filtering.

    OR is applied within the same category.

    AND is applied between different categories.

    Example:

    SUV OR COUPE_SUV
    AND
    CNG OR HYBRID
    AND
    used
    AND
    price range
    """

    model_config = ConfigDict(protected_namespaces=())

    search_query: Optional[str] = None

    state: Optional[str] = None
    city: Optional[str] = None

    min_price_inr: Optional[float] = Field(
        default=None,
        ge=0,
    )

    max_price_inr: Optional[float] = Field(
        default=None,
        gt=0,
    )

    brands: Optional[List[str]] = Field(
        default_factory=list,
    )

    model_families: Optional[List[str]] = Field(
        default_factory=list,
    )

    models: Optional[List[str]] = Field(
        default_factory=list,
    )

    variants: Optional[List[str]] = Field(
        default_factory=list,
    )

    body_types: Optional[List[VehicleType]] = Field(
        default_factory=list,
    )

    vehicle_types: Optional[List[VehicleType]] = Field(
        default_factory=list,
    )

    performance_types: Optional[List[PerformanceType]] = Field(
        default_factory=list,
    )

    powertrains: Optional[List[str]] = Field(
        default_factory=list,
    )

    transmissions: Optional[List[str]] = Field(
        default_factory=list,
    )

    seating_capacities: Optional[List[int]] = Field(
        default_factory=list,
    )

    conditions: Optional[List[str]] = Field(
        default_factory=list,
    )

    required_features: Optional[List[str]] = Field(
        default_factory=list,
    )

    preferred_features: Optional[List[str]] = Field(
        default_factory=list,
    )

    sort_by: str = "ai_suitability"

    page: int = Field(
        default=1,
        ge=1,
        description="Page number for pagination",
    )

    limit: Optional[int] = Field(
        default=24,
        ge=1,
        le=200,
        description="Items per page",
    )

    user_profile: Optional[UserProfile] = None