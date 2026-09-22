from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, Text, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    saved_vehicles = relationship("SavedVehicle", back_populates="user")
    reviews = relationship("Review", back_populates="user")
    leads = relationship("Lead", back_populates="user")

class SavedVehicle(Base):
    __tablename__ = "saved_vehicles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    vehicle_variant_id = Column(String, index=True, nullable=False) # Maps to the variant ID
    saved_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="saved_vehicles")

class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    vehicle_variant_id = Column(String, index=True, nullable=False)
    rating = Column(Integer, nullable=False) # 1 to 5
    review_text = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="reviews")

class VehicleModel(Base):
    __tablename__ = "vehicles"

    id = Column(String, primary_key=True, index=True)
    brand = Column(String, index=True, nullable=False)
    model_family = Column(String, index=True, nullable=False)
    model_name = Column(String, nullable=False)
    body_type = Column(String, nullable=False)
    vehicle_type = Column(String, nullable=False)
    year_introduced = Column(Integer, nullable=True)
    description = Column(Text, nullable=True)

class VehicleVariantModel(Base):
    __tablename__ = "vehicle_variants"

    id = Column(String, primary_key=True, index=True)
    vehicle_id = Column(String, ForeignKey("vehicles.id"), nullable=False)
    brand = Column(String, nullable=False)
    model_family = Column(String, nullable=False)
    model_name = Column(String, nullable=False)
    variant_name = Column(String, nullable=False)
    
    fuel_type = Column(String, nullable=False)
    powertrain_type = Column(String, nullable=True)
    transmission = Column(String, nullable=False) # Store as comma-separated
    
    price_inr = Column(Float, nullable=False)
    is_used = Column(Boolean, default=False)
    used_price_inr = Column(Float, nullable=True)
    
    body_type = Column(String, nullable=False)
    vehicle_type = Column(String, nullable=False)
    performance_type = Column(String, nullable=False)
    
    engine_cc = Column(Float, nullable=True)
    power_bhp = Column(Float, nullable=True)
    torque_nm = Column(Float, nullable=True)
    
    seating_capacity = Column(Integer, default=5)
    boot_space_litres = Column(Integer, default=350)
    ground_clearance_mm = Column(Integer, default=170)
    
    features = Column(Text, nullable=True) # JSON string
    ncap_rating = Column(Integer, nullable=True)
    has_adas = Column(Boolean, default=False)
    has_360_camera = Column(Boolean, default=False)
    
    running_cost_per_km = Column(Float, default=6.0)
    maintenance_index = Column(Float, default=0.3)

class VehiclePriceModel(Base):
    __tablename__ = "vehicle_prices"
    
    id = Column(Integer, primary_key=True, index=True)
    vehicle_variant_id = Column(String, ForeignKey("vehicle_variants.id"), nullable=False)
    state = Column(String, nullable=False)
    city = Column(String, nullable=True)
    ex_showroom_price_inr = Column(Float, nullable=False)
    effective_from = Column(String, nullable=True)
    effective_to = Column(String, nullable=True)
    source = Column(String, nullable=True)
    last_verified = Column(String, nullable=True)
    is_verified = Column(Boolean, default=True)

class Lead(Base):
    __tablename__ = "leads"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    vehicle_variant_id = Column(String, nullable=False)
    name = Column(String, nullable=False)
    phone = Column(String, nullable=False)
    message = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    is_contacted = Column(Boolean, default=False)

    user = relationship("User", back_populates="leads")
