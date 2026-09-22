from sqlalchemy import (
    Column, Integer, String, Float, Boolean, ForeignKey, Text, DateTime, Index
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_admin = Column(Boolean, default=False, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    saved_vehicles = relationship("SavedVehicle", back_populates="user", cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="user", cascade="all, delete-orphan")
    leads = relationship("Lead", back_populates="user")


class SavedVehicle(Base):
    __tablename__ = "saved_vehicles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    vehicle_variant_id = Column(String, index=True, nullable=False)
    saved_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    user = relationship("User", back_populates="saved_vehicles")

    __table_args__ = (
        Index("ix_saved_vehicle_user_variant", "user_id", "vehicle_variant_id", unique=True),
    )


class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    vehicle_variant_id = Column(String, index=True, nullable=False)
    rating = Column(Integer, nullable=False)  # 1 to 5
    review_text = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    user = relationship("User", back_populates="reviews")

    __table_args__ = (
        Index("ix_reviews_variant_created", "vehicle_variant_id", "created_at"),
    )


class VehicleModel(Base):
    __tablename__ = "vehicles"

    id = Column(String, primary_key=True, index=True)
    brand = Column(String, index=True, nullable=False)
    model_family = Column(String, index=True, nullable=False)
    model_name = Column(String, nullable=False)
    body_type = Column(String, index=True, nullable=False)
    vehicle_type = Column(String, nullable=False)
    year_introduced = Column(Integer, nullable=True)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    variants = relationship("VehicleVariantModel", back_populates="vehicle", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_vehicles_brand_body", "brand", "body_type"),
    )


class VehicleVariantModel(Base):
    __tablename__ = "vehicle_variants"

    id = Column(String, primary_key=True, index=True)
    vehicle_id = Column(String, ForeignKey("vehicles.id", ondelete="CASCADE"), nullable=False)
    brand = Column(String, index=True, nullable=False)
    model_family = Column(String, index=True, nullable=False)
    model_name = Column(String, nullable=False)
    variant_name = Column(String, nullable=False)
    
    fuel_type = Column(String, index=True, nullable=False)
    powertrain_type = Column(String, nullable=True)
    transmission = Column(String, index=True, nullable=False)
    
    price_inr = Column(Float, index=True, nullable=False)
    is_used = Column(Boolean, default=False, nullable=False)
    used_price_inr = Column(Float, nullable=True)
    
    body_type = Column(String, index=True, nullable=False)
    vehicle_type = Column(String, nullable=False)
    performance_type = Column(String, nullable=False)
    
    engine_cc = Column(Float, nullable=True)
    power_bhp = Column(Float, nullable=True)
    torque_nm = Column(Float, nullable=True)
    
    seating_capacity = Column(Integer, default=5, nullable=False)
    boot_space_litres = Column(Integer, default=350, nullable=False)
    ground_clearance_mm = Column(Integer, default=170, nullable=False)
    
    features = Column(Text, nullable=True)  # JSON string
    ncap_rating = Column(Integer, nullable=True)
    has_adas = Column(Boolean, default=False, nullable=False)
    has_360_camera = Column(Boolean, default=False, nullable=False)
    
    running_cost_per_km = Column(Float, default=6.0, nullable=False)
    maintenance_index = Column(Float, default=0.3, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    vehicle = relationship("VehicleModel", back_populates="variants")
    prices = relationship("VehiclePriceModel", back_populates="variant", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_variants_brand_price", "brand", "price_inr"),
        Index("ix_variants_fuel_body", "fuel_type", "body_type"),
    )


class VehiclePriceModel(Base):
    __tablename__ = "vehicle_prices"
    
    id = Column(Integer, primary_key=True, index=True)
    vehicle_variant_id = Column(String, ForeignKey("vehicle_variants.id", ondelete="CASCADE"), nullable=False)
    state = Column(String, index=True, nullable=False)
    city = Column(String, index=True, nullable=True)
    ex_showroom_price_inr = Column(Float, nullable=False)
    effective_from = Column(String, nullable=True)
    effective_to = Column(String, nullable=True)
    source = Column(String, nullable=True)
    last_verified = Column(String, nullable=True)
    is_verified = Column(Boolean, default=True, nullable=False)

    variant = relationship("VehicleVariantModel", back_populates="prices")

    __table_args__ = (
        Index("ix_vehicle_prices_loc", "vehicle_variant_id", "state", "city"),
    )


class Lead(Base):
    __tablename__ = "leads"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    vehicle_variant_id = Column(String, index=True, nullable=False)
    name = Column(String, nullable=False)
    phone = Column(String, nullable=False)
    message = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    is_contacted = Column(Boolean, default=False, nullable=False)

    user = relationship("User", back_populates="leads")
