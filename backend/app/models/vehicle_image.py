"""
Pydantic models for vehicle images, resolution metadata, and caching.
"""
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class VehicleImageRecord(BaseModel):
    """Represents a cached or persistent vehicle image record."""
    model_config = ConfigDict(protected_namespaces=())

    id: str
    vehicle_id: str
    image_url: str
    image_source: str = Field(description="Source of the image: 'carapi', 'wikimedia', 'local_catalog', 'body_type_fallback', 'local_fallback'")
    image_license: Optional[str] = "CC BY-SA / Fair Use"
    image_attribution: Optional[str] = None
    image_type: str = Field(description="'exact_variant', 'model', 'brand_model', 'body_type', 'fallback'")
    is_primary: bool = True
    is_fallback: bool = False
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class VehicleImageResponse(BaseModel):
    """API response for vehicle image resolution endpoint."""
    model_config = ConfigDict(protected_namespaces=())

    vehicle_id: str
    image_url: str
    source: str
    license: Optional[str] = None
    attribution: Optional[str] = None
    image_type: str
    is_fallback: bool = False
