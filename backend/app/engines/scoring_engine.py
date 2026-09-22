"""
Vehicle Scoring & Decision Engine

Implements the weighted multi-criteria decision scoring system:
1. Evaluates each vehicle/variant against the user profile and inferred facts.
2. Calculates component scores (cost, usage, infrastructure, maintenance, etc.)
3. Applies configurable weights dynamically scaled by fuzzy preference centroids.
4. Integrates Bayesian posterior beliefs for infrastructure uncertainty.
5. Produces variant-level rankings with evidence-based pros and cons.
6. Guarantees consistency: pros/cons strictly mirror component scores.
"""
from typing import Any, Dict, List, Tuple, Optional
from app.models.vehicle import Vehicle, VehicleScore, VehicleVariant, VariantScore
from app.models.reasoning import (
    BayesianResult,
    CategoryScore,
    FuzzyResult,
)
import math


# Default scoring weights — configurable
DEFAULT_WEIGHTS = {
    "cost": 0.18,
    "usage_compatibility": 0.15,
    "infrastructure": 0.15,
    "maintenance": 0.10,
    "transmission": 0.08,
    "experience": 0.08,
    "performance": 0.10,
    "environment": 0.10,
    "practicality": 0.06,
}


class ScoringEngine:
    """
    Multi-criteria weighted scoring engine for vehicle suitability assessment.
    Works seamlessly on both Vehicle and VehicleVariant objects.
    """

    def __init__(self, weights: Dict[str, float] = None):
        self.weights = weights or dict(DEFAULT_WEIGHTS)

    def _cost_score(
        self, v: Any, budget: float, running_cost_priority: float
    ) -> float:
        """Score based on purchase price fit and running cost."""
        price = getattr(v, "effective_price", getattr(v, "price_inr", 1000000))
        # Relative price fit
        if budget > 0:
            ratio = price / budget
            if 0.7 <= ratio <= 1.05:
                price_fit = 1.0
            elif ratio < 0.7:
                price_fit = 0.85 + 0.15 * (ratio / 0.7)
            else:
                price_fit = max(0.0, 1.0 - (ratio - 1.05) * 2.0)
        else:
            price_fit = 0.8

        running_cost = getattr(v, "running_cost_per_km", 6.0)
        max_running_cost = 25.0
        running_score = max(0.0, 1.0 - (running_cost / max_running_cost))

        combined = 0.5 * price_fit + 0.5 * (
            running_score * running_cost_priority
            + price_fit * (1 - running_cost_priority)
        )
        return min(1.0, max(0.0, round(combined, 4)))

    def _usage_compatibility(
        self, v: Any, facts: Dict[str, Any], bayesian: BayesianResult
    ) -> float:
        """Score based on city/highway driving patterns."""
        env = facts.get("driving_environment", "mixed")
        city_score = getattr(v, "city_score", 0.7)
        hwy_score = getattr(v, "highway_score", 0.7)

        if env == "city":
            env_score = city_score * 0.8 + hwy_score * 0.2
        elif env == "highway":
            env_score = city_score * 0.2 + hwy_score * 0.8
        else:
            env_score = city_score * 0.5 + hwy_score * 0.5

        # Range check for EVs
        fuel = getattr(v, "fuel_type", "petrol")
        if fuel == "ev":
            daily_dist = facts.get("daily_distance", 30)
            range_km = getattr(v, "range_km", 350) or 350
            if daily_dist > 0 and range_km / daily_dist < 2.0:
                env_score = max(0.2, env_score - 0.25)

        return min(1.0, max(0.0, round(env_score, 4)))

    def _infrastructure_compatibility(
        self, v: Any, facts: Dict[str, Any], bayesian: BayesianResult
    ) -> float:
        """Score infrastructure alignment (EV charging, CNG stations, fuel accessibility)."""
        fuel = getattr(v, "fuel_type", "petrol")
        if fuel == "ev":
            chg_node = next((n for n in bayesian.nodes if n.node_name == "charging_feasibility"), None)
            if chg_node:
                post = chg_node.posterior
                avail_p = post.get("available", post.get("high", 0.3))
                uncert_p = post.get("uncertain", post.get("medium", 0.4))
                unavail_p = post.get("unavailable", post.get("low", 0.3))
                score = avail_p * 0.98 + uncert_p * 0.60 + unavail_p * 0.15
            else:
                score = 0.5
            return min(1.0, max(0.0, round(score, 4)))

        elif fuel == "cng":
            cng_node = next((n for n in bayesian.nodes if n.node_name == "cng_suitability"), None)
            if cng_node:
                post = cng_node.posterior
                score = post.get("high", 0.3) * 1.0 + post.get("medium", 0.4) * 0.7 + post.get("low", 0.3) * 0.35
            else:
                fuel_access = facts.get("fuel_station_access", "easy")
                score = 0.90 if fuel_access == "easy" else (0.70 if fuel_access == "moderate" else 0.45)
            return min(1.0, max(0.0, round(score, 4)))

        elif fuel == "hybrid":
            fuel_access = facts.get("fuel_station_access", "easy")
            score = 0.95 if fuel_access == "easy" else (0.82 if fuel_access == "moderate" else 0.65)
            return score
        else:
            fuel_access = facts.get("fuel_station_access", "easy")
            score = 0.98 if fuel_access == "easy" else (0.80 if fuel_access == "moderate" else 0.60)
            return score

    def _maintenance_compatibility(self, v: Any, maintenance_priority: float) -> float:
        maint_idx = getattr(v, "maintenance_index", 0.3)
        maint_quality = 1.0 - maint_idx
        score = maint_quality * maintenance_priority + 0.5 * (1 - maintenance_priority)
        return min(1.0, max(0.0, round(score, 4)))

    def _transmission_compatibility(self, v: Any, facts: Dict[str, Any]) -> float:
        pref = facts.get("transmission_preference", "unknown")
        trans = getattr(v, "transmission", ["manual"])

        if pref == "unknown":
            if facts.get("auto_transmission_suggested") == "true":
                return 0.75 if "automatic" in trans else 0.55
            return 0.60
        elif pref == "manual":
            return 0.95 if "manual" in trans else 0.25
        elif pref == "automatic":
            return 0.95 if "automatic" in trans else 0.30
        return 0.5

    def _experience_compatibility(self, v: Any, facts: Dict[str, Any]) -> float:
        exp = facts.get("experience", "intermediate")
        bf = getattr(v, "beginner_friendly", 0.7)
        ps = getattr(v, "performance_score", 0.5)

        if exp == "beginner":
            return bf
        elif exp == "intermediate":
            return 0.5 + 0.3 * bf
        else:
            return 0.7 + 0.2 * ps

    def _performance_compatibility(self, v: Any, perf_priority: float) -> float:
        ps = getattr(v, "performance_score", 0.5)
        if perf_priority < 0.3:
            return 0.6 + 0.2 * ps
        return ps * perf_priority + 0.3 * (1 - perf_priority)

    def _environmental_compatibility(self, v: Any, env_priority: float) -> float:
        es = getattr(v, "environment_score", 0.5)
        return es * env_priority + 0.5 * (1 - env_priority)

    def _practicality_score(self, v: Any, facts: Dict[str, Any]) -> float:
        req_seats = facts.get("seating_requirement", 5)
        seats = getattr(v, "seating_capacity", 5)
        seat_score = 1.0 if seats >= req_seats else max(0.0, 1.0 - 0.3 * (req_seats - seats))

        boot_need = facts.get("boot_space_need", "medium")
        boot = getattr(v, "boot_space_litres", 350)
        if boot_need == "large":
            boot_score = 1.0 if boot >= 450 else boot / 450
        elif boot_need == "medium":
            boot_score = 1.0 if boot >= 300 else boot / 300
        else:
            boot_score = 0.8

        gc_need = facts.get("ground_clearance_need", "medium")
        gc = getattr(v, "ground_clearance_mm", 170)
        if gc_need == "high":
            gc_score = 1.0 if gc >= 190 else gc / 190
        elif gc_need == "medium":
            gc_score = 1.0 if gc >= 165 else gc / 165
        else:
            gc_score = 0.8

        return min(1.0, max(0.0, round(seat_score * 0.45 + boot_score * 0.30 + gc_score * 0.25, 4)))

    def score_variant(
        self,
        variant: VehicleVariant,
        facts: Dict[str, Any],
        fuzzy: FuzzyResult,
        bayesian: BayesianResult,
        preferred_features: Optional[List[str]] = None
    ) -> VariantScore:
        """Calculates suitability score (0-100) and pros/cons for a specific Variant."""
        pref_scores = fuzzy.preference_scores
        rc_p = pref_scores.get("priority_running_cost", 0.5)
        maint_p = pref_scores.get("priority_maintenance", 0.5)
        perf_p = pref_scores.get("priority_performance", 0.5)
        env_p = pref_scores.get("priority_environment", 0.5)

        budget = facts.get("purchase_budget", 1000000)
        cost = self._cost_score(variant, budget, rc_p)
        usage = self._usage_compatibility(variant, facts, bayesian)
        infra = self._infrastructure_compatibility(variant, facts, bayesian)
        maint = self._maintenance_compatibility(variant, maint_p)
        trans = self._transmission_compatibility(variant, facts)
        exp = self._experience_compatibility(variant, facts)
        perf = self._performance_compatibility(variant, perf_p)
        env = self._environmental_compatibility(variant, env_p)
        prac = self._practicality_score(variant, facts)

        # Dynamic weight normalization
        dynamic_weights = {
            "cost": self.weights["cost"] * (0.6 + 0.8 * rc_p),
            "usage_compatibility": self.weights["usage_compatibility"],
            "infrastructure": self.weights["infrastructure"],
            "maintenance": self.weights["maintenance"] * (0.6 + 0.8 * maint_p),
            "transmission": self.weights["transmission"],
            "experience": self.weights["experience"],
            "performance": self.weights["performance"] * (0.6 + 0.8 * perf_p),
            "environment": self.weights["environment"] * (0.5 + 1.5 * env_p),
            "practicality": self.weights["practicality"],
        }
        w_sum = sum(dynamic_weights.values())
        norm_weights = {k: v / w_sum for k, v in dynamic_weights.items()}

        weighted = {
            "cost": cost * norm_weights["cost"],
            "usage_compatibility": usage * norm_weights["usage_compatibility"],
            "infrastructure": infra * norm_weights["infrastructure"],
            "maintenance": maint * norm_weights["maintenance"],
            "transmission": trans * norm_weights["transmission"],
            "experience": exp * norm_weights["experience"],
            "performance": perf * norm_weights["performance"],
            "environment": env * norm_weights["environment"],
            "practicality": prac * norm_weights["practicality"],
        }
        total = sum(weighted.values()) * 100

        # Feature preference boost (e.g. user prefers sunroof / ADAS / 360 camera)
        if preferred_features:
            var_features_lower = set(f.lower() for f in variant.features)
            for pf in preferred_features:
                if any(pf.lower() in vf for vf in var_features_lower):
                    total += 3.0  # +3% per preferred feature match

        # EV infrastructure penalty
        if variant.fuel_type == "ev" and infra < 0.35:
            total *= 0.65

        # Condition preference adjustment
        cond_pref = facts.get("vehicle_condition_preference", "no_preference")
        if variant.is_used:
            if cond_pref == "new_only":
                total -= 35.0
            elif cond_pref == "prefer_new":
                total -= 12.0
            elif cond_pref == "prefer_used":
                total += 10.0
        else:
            if cond_pref == "prefer_used":
                total -= 10.0
            elif cond_pref == "new_only":
                total += 5.0

        total = min(100.0, max(0.0, total))

        positives, negatives = self._identify_variant_factors(
            variant, facts, cost, usage, infra, maint, trans, exp, perf, env, prac
        )

        return VariantScore(
            variant=variant,
            total_score=round(total, 1),
            cost_score=cost,
            usage_compatibility=usage,
            infrastructure_compatibility=infra,
            maintenance_compatibility=maint,
            transmission_compatibility=trans,
            experience_compatibility=exp,
            performance_compatibility=perf,
            environmental_compatibility=env,
            practicality_score=prac,
            weighted_components=weighted,
            positive_factors=positives,
            negative_factors=negatives,
        )

    def _identify_variant_factors(
        self,
        v: VehicleVariant,
        facts: Dict[str, Any],
        cost: float,
        usage: float,
        infra: float,
        maint: float,
        trans: float,
        exp: float,
        perf: float,
        env: float,
        prac: float,
    ) -> Tuple[List[str], List[str]]:
        """Identify personalized 3-5 pros and 2-4 cons that never contradict scores."""
        pos = []
        neg = []

        price_lakh = (v.effective_price) / 100000.0
        loc_label = v.price_location_label or "Ex-Showroom"

        # Brand match pro
        pref_brands = facts.get("preferred_brands")
        if pref_brands and isinstance(pref_brands, list):
            norm_b = {b.strip().lower() for b in pref_brands if isinstance(b, str) and b.strip()}
            if v.brand.strip().lower() in norm_b:
                pos.append(f"Matches your preferred brand ({v.brand}).")

        # Pricing pro/con
        if cost >= 0.70:
            pos.append(f"Price of ₹{price_lakh:.2f}L ({loc_label}) provides high purchase affordability within your criteria.")
        elif cost < 0.45:
            neg.append(f"Price of ₹{price_lakh:.2f}L sits near the upper ceiling of your financial allocation.")

        # Fuel & Running cost
        if v.fuel_type == "ev":
            pos.append(f"Zero direct emissions with low running cost (~₹{v.running_cost_per_km:.1f}/km).")
            if infra < 0.50:
                neg.append("Relies on regular home/overnight charging infrastructure availability.")
        elif v.fuel_type == "cng":
            pos.append(f"Economical running expense with factory-fitted CNG (~₹{v.running_cost_per_km:.1f}/km).")
            if infra < 0.50:
                neg.append("Refueling dependent on local CNG dispensing station queues and availability.")
        elif v.fuel_type == "hybrid":
            pos.append(f"Strong regenerative hybrid efficiency (~₹{v.running_cost_per_km:.1f}/km) without charging plug dependency.")
        else:
            if v.running_cost_per_km > 10.0:
                neg.append(f"Higher continuous fuel expenditure (~₹{v.running_cost_per_km:.1f}/km).")
            else:
                pos.append(f"Widespread pan-India fuel station accessibility with manageable ~₹{v.running_cost_per_km:.1f}/km running cost.")

        # Transmission
        pref_trans = facts.get("transmission_preference", "unknown")
        if pref_trans != "unknown":
            if trans >= 0.85:
                pos.append(f"Delivers your preferred {v.transmission[0].capitalize()} transmission configuration.")
            else:
                neg.append(f"Transmission format ({', '.join(v.transmission)}) does not strictly align with your '{pref_trans}' preference.")

        # Performance vs Experience
        exp_lvl = facts.get("experience", "intermediate")
        if exp_lvl == "beginner":
            if v.beginner_friendly >= 0.80:
                pos.append("Intuitive controls and forgiving road dynamics make it suitable for first-time owners.")
            elif v.performance_score > 0.80:
                neg.append("High power output and aggressive dynamics require seasoned throttle moderation.")

        if perf >= 0.80:
            pos.append(f"Robust powertrain delivering {v.power_bhp:.0f} bhp and {v.torque_nm:.0f} Nm torque for confident highway cruising.")

        # Maintenance
        if maint >= 0.70:
            pos.append("Low maintenance index with accessible service support and reasonable parts cost.")
        elif maint < 0.40:
            neg.append("High maintenance index; specialized servicing and premium spares elevate upkeep costs.")

        # Features & Safety
        if v.has_adas:
            pos.append("Equipped with advanced driver-assistance systems (ADAS) for proactive safety.")
        if v.has_360_camera:
            pos.append("Equipped with 360-degree surround camera facilitating tight urban maneuvers.")
        if v.ncap_rating and v.ncap_rating >= 5:
            pos.append(f"Tested {v.ncap_rating}-Star NCAP vehicle safety benchmark.")

        # Ensure between 3-5 pros and 2-4 cons
        if len(pos) < 3:
            pos.append(f"{v.seating_capacity}-seater {v.body_type} layout accommodating everyday utility requirements.")
        if len(neg) < 2:
            if v.boot_space_litres < 300:
                neg.append(f"Boot volume ({v.boot_space_litres}L) is modest for multi-luggage family road trips.")
            else:
                neg.append("Depreciation and periodic insurance renewal should be budgeted over 5-year ownership.")

        return pos[:5], neg[:4]

    # Backward compatibility for base Vehicle model
    def score_vehicle(
        self,
        vehicle: Vehicle,
        facts: Dict[str, Any],
        fuzzy: FuzzyResult,
        bayesian: BayesianResult,
    ) -> VehicleScore:
        """Legacy scoring for Vehicle entity."""
        # Convert vehicle into a mock variant for consistent unified scoring
        v_variant = VehicleVariant(
            id=vehicle.id,
            vehicle_id=vehicle.id,
            brand=vehicle.brand,
            model_family=vehicle.name.split()[0],
            model_name=vehicle.name,
            variant_name="Standard",
            fuel_type=vehicle.fuel_type,
            transmission=vehicle.transmission,
            price_inr=vehicle.price_inr,
            is_used=vehicle.is_used,
            used_price_inr=vehicle.used_price_inr,
            body_type=vehicle.vehicle_segment,
            vehicle_type=vehicle.vehicle_segment,
            performance_type="Standard",
            seating_capacity=vehicle.seating_capacity,
            ground_clearance_mm=vehicle.ground_clearance_mm,
            boot_space_litres=vehicle.boot_space_litres,
            running_cost_per_km=vehicle.running_cost_per_km,
            maintenance_index=vehicle.maintenance_index,
            performance_score=vehicle.performance_score,
            city_score=vehicle.city_score,
            highway_score=vehicle.highway_score,
            environment_score=vehicle.environment_score,
            charging_dependency=vehicle.charging_dependency,
            fuel_infrastructure_dependency=vehicle.fuel_infrastructure_dependency,
            cng_infrastructure_dependency=vehicle.cng_infrastructure_dependency or 0.0,
            beginner_friendly=vehicle.beginner_friendly,
            resale_value_index=vehicle.resale_value_index,
            image_path=vehicle.image_path,
            ncap_rating=vehicle.ncap_rating or 4,
            has_adas=vehicle.has_adas or False,
            has_360_camera=vehicle.has_360_camera or False,
        )
        scored_var = self.score_variant(v_variant, facts, fuzzy, bayesian)
        return VehicleScore(
            vehicle=vehicle,
            total_score=scored_var.total_score,
            cost_score=scored_var.cost_score,
            usage_compatibility=scored_var.usage_compatibility,
            infrastructure_compatibility=scored_var.infrastructure_compatibility,
            maintenance_compatibility=scored_var.maintenance_compatibility,
            transmission_compatibility=scored_var.transmission_compatibility,
            experience_compatibility=scored_var.experience_compatibility,
            performance_compatibility=scored_var.performance_compatibility,
            environmental_compatibility=scored_var.environmental_compatibility,
            practicality_score=scored_var.practicality_score,
            weighted_components=scored_var.weighted_components,
            positive_factors=scored_var.positive_factors,
            negative_factors=scored_var.negative_factors,
            image_path=vehicle.image_path
        )

    def score_all_vehicles(
        self,
        vehicles: List[Vehicle],
        facts: Dict[str, Any],
        fuzzy: FuzzyResult,
        bayesian: BayesianResult,
    ) -> List[VehicleScore]:
        scored = [self.score_vehicle(v, facts, fuzzy, bayesian) for v in vehicles]
        scored.sort(key=lambda s: s.total_score, reverse=True)
        return scored

    def score_categories(
        self,
        vehicle_scores: List[Any],
    ) -> List[CategoryScore]:
        """Aggregate vehicle/variant scores into category-level scores."""
        categories: Dict[str, List[Any]] = {}
        for vs in vehicle_scores:
            ft = getattr(getattr(vs, "vehicle", None) or getattr(vs, "variant", None), "fuel_type", "petrol")
            if ft not in categories:
                categories[ft] = []
            categories[ft].append(vs)

        results = []
        for category, scores in categories.items():
            scores.sort(key=lambda s: s.total_score, reverse=True)
            top = scores[:3]
            avg_score = sum(s.total_score for s in top) / len(top)

            components = [
                "cost_score",
                "usage_compatibility",
                "infrastructure_compatibility",
                "maintenance_compatibility",
                "transmission_compatibility",
                "experience_compatibility",
                "performance_compatibility",
                "environmental_compatibility",
                "practicality_score",
            ]
            component_avgs = {}
            for comp in components:
                vals = [getattr(s, comp, 0.5) for s in top]
                component_avgs[comp] = round(sum(vals) / len(vals), 4)

            all_pos = set()
            all_neg = set()
            for s in top:
                all_pos.update(s.positive_factors)
                all_neg.update(s.negative_factors)

            results.append(
                CategoryScore(
                    category=category,
                    score=round(avg_score, 1),
                    component_scores=component_avgs,
                    positive_factors=list(all_pos)[:5],
                    negative_factors=list(all_neg)[:4],
                )
            )

        results.sort(key=lambda c: c.score, reverse=True)
        return results
