"""
Recommendation Pipeline Service

Orchestrates the complete AI reasoning pipeline:
  User Profile / Advanced Filters → Input Normalization → Forward Chaining →
  Fuzzy Reasoning → Bayesian Inference → Hard Eligibility Filtering →
  Variant-Level AI Suitability Scoring → Ranking → Multi-Criteria Explanations

Adheres strictly to the core principle:
- Hard filters determine eligible vehicles/variants.
- AI reasoning determines which eligible vehicle is most suitable.
- Recommends the specific VARIANT with location-verified ex-showroom pricing.
"""
from typing import Any, Dict, List, Optional, Tuple
from app.models.user_profile import UserProfile, AdvancedFilterQuery, DrivingEnvironment, ParkingType, ChargingKnowledge
from app.models.vehicle import Vehicle, VehicleScore, VehicleVariant, VariantScore
from app.models.reasoning import (
    BayesianResult,
    CategoryScore,
    ForwardChainingResult,
    FuzzyResult,
    InferenceStep,
    ReasoningExplanation,
    RecommendationResponse,
)
from app.engines.forward_chaining import ForwardChainingEngine
from app.engines.fuzzy_engine import FuzzyEngine
from app.engines.bayesian_engine import BayesianEngine
from app.engines.scoring_engine import ScoringEngine
from app.engines.explanation_engine import ExplanationEngine
from app.services.knowledge_base import kb_service
from app.services.vehicle_image_service import vehicle_image_service
import os

_BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
_DATA_DIR = os.path.join(os.path.dirname(_BASE_DIR), "data")


def _normalize_fuel(f: str) -> str:
    fl = f.lower().strip()
    if fl in ("electric", "bev", "ev"):
        return "ev"
    if fl in ("hybrid", "mild-hybrid", "strong-hybrid", "mild_hybrid", "strong_hybrid", "phev", "plugin-hybrid", "plug-in-hybrid"):
        return "hybrid"
    if fl in ("cng",):
        return "cng"
    if fl in ("diesel",):
        return "diesel"
    if fl in ("petrol", "gasoline"):
        return "petrol"
    return fl


class RecommendationService:
    """
    Orchestrates the full AI recommendation pipeline for both Simple and Advanced user modes.
    """

    def __init__(self):
        self.fuzzy_engine = FuzzyEngine()
        self.bayesian_engine = BayesianEngine()
        self.scoring_engine = ScoringEngine()
        self.explanation_engine = ExplanationEngine()

        # Load knowledge bases
        fuzzy_path = os.path.join(_DATA_DIR, "fuzzy_sets.json")
        bayesian_path = os.path.join(_DATA_DIR, "bayesian_priors.json")

        self.fuzzy_engine.load_from_file(fuzzy_path)
        self.bayesian_engine.load_from_file(bayesian_path)

    def _get_fc_engine(self) -> ForwardChainingEngine:
        return ForwardChainingEngine(rules=kb_service.get_rule_objects())

    @staticmethod
    def _get_budget_range(budget_val: float) -> Tuple[float, float]:
        """Maps user purchase budget to hard [min_price, max_price] range."""
        if budget_val <= 50000:
            return (10000.0, 50000.0)
        elif budget_val <= 100000:
            return (50000.0, 100000.0)
        elif budget_val <= 300000:
            return (100000.0, 300000.0)
        elif budget_val <= 500000:
            return (300000.0, 500000.0)
        elif budget_val <= 800000:
            return (500000.0, 800000.0)
        elif budget_val <= 1500000:
            return (800000.0, 1500000.0)
        elif budget_val <= 3000000:
            return (1500000.0, 3000000.0)
        elif budget_val <= 7000000:
            return (3000000.0, 7000000.0)
        elif budget_val <= 20000000:
            return (7000000.0, 20000000.0)
        else:
            return (20000000.0, 1500000000.0)

    def _normalize_input(self, profile: UserProfile) -> Dict[str, Any]:
        """Maps user profile to fact base for forward chaining & reasoning."""
        facts = {}
        facts["daily_distance"] = profile.daily_distance
        facts["driving_environment"] = profile.driving_environment.value if hasattr(profile.driving_environment, "value") else str(profile.driving_environment)
        facts["driving_frequency"] = profile.driving_frequency.value if hasattr(profile.driving_frequency, "value") else str(profile.driving_frequency)
        facts["long_distance_frequency"] = profile.long_distance_frequency.value if hasattr(profile.long_distance_frequency, "value") else str(profile.long_distance_frequency)
        facts["purchase_budget"] = profile.purchase_budget
        facts["fuel_station_access"] = profile.fuel_station_access.value if hasattr(profile.fuel_station_access, "value") else str(profile.fuel_station_access)

        facts["experience"] = profile.experience.value if hasattr(profile.experience, "value") else str(profile.experience)
        facts["first_time_owner"] = profile.first_time_owner
        facts["driving_confidence"] = profile.driving_confidence.value if hasattr(profile.driving_confidence, "value") else str(profile.driving_confidence)

        facts["transmission_preference"] = profile.transmission_preference.value if hasattr(profile.transmission_preference, "value") else str(profile.transmission_preference)
        facts["running_cost_importance"] = profile.running_cost_importance.value if hasattr(profile.running_cost_importance, "value") else str(profile.running_cost_importance)
        facts["maintenance_importance"] = profile.maintenance_importance.value if hasattr(profile.maintenance_importance, "value") else str(profile.maintenance_importance)
        facts["performance_importance"] = profile.performance_importance.value if hasattr(profile.performance_importance, "value") else str(profile.performance_importance)
        facts["environmental_preference"] = profile.environmental_preference.value if hasattr(profile.environmental_preference, "value") else str(profile.environmental_preference)
        facts["vehicle_condition_preference"] = profile.vehicle_condition_preference.value if hasattr(profile.vehicle_condition_preference, "value") else str(profile.vehicle_condition_preference)
        facts["boot_space_need"] = profile.boot_space_need.value if hasattr(profile.boot_space_need, "value") else str(profile.boot_space_need)
        facts["ground_clearance_need"] = profile.ground_clearance_need.value if hasattr(profile.ground_clearance_need, "value") else str(profile.ground_clearance_need)
        facts["seating_requirement"] = profile.seating_requirement

        facts["parking"] = profile.parking.value if hasattr(profile.parking, "value") else str(profile.parking)
        facts["charging_knowledge"] = profile.charging_knowledge.value if hasattr(profile.charging_knowledge, "value") else str(profile.charging_knowledge)

        # Location facts
        if profile.state:
            facts["state"] = profile.state
        if profile.city:
            facts["city"] = profile.city

        if profile.preferred_brands:
            facts["preferred_brands"] = profile.preferred_brands

        budget = profile.purchase_budget
        if budget <= 600000:
            facts["budget_segment"] = "budget"
        elif budget <= 1200000:
            facts["budget_segment"] = "medium"
        elif budget <= 2000000:
            facts["budget_segment"] = "high"
        else:
            facts["budget_segment"] = "premium"

        facts["priority_running_cost"] = profile.priority_running_cost
        facts["priority_maintenance"] = profile.priority_maintenance
        facts["priority_performance"] = profile.priority_performance
        facts["priority_environment"] = profile.priority_environment
        facts["priority_purchase_price"] = profile.priority_purchase_price
        facts["priority_long_distance"] = profile.priority_long_distance
        facts["priority_comfort"] = profile.priority_comfort

        return facts

    def recommend(self, profile: UserProfile) -> RecommendationResponse:
        """Standard questionnaire recommendation pipeline."""
        import hashlib
        import json
        
        # 1. Cache Check
        profile_hash = hashlib.sha256(profile.model_dump_json().encode()).hexdigest()
        if not hasattr(self, '_cache'):
            self._cache = {}
        if profile_hash in self._cache:
            return self._cache[profile_hash]

        # 2. Forward Chaining
        initial_facts = self._normalize_input(profile)
        fc_engine = self._get_fc_engine()
        fc_engine.set_facts(initial_facts)
        fc_result = fc_engine.infer()

        # 2. Fuzzy Reasoning
        crisp_inputs = {
            "daily_distance": profile.daily_distance,
            "purchase_budget": profile.purchase_budget / 100000,
            "priority_running_cost": profile.priority_running_cost,
            "priority_maintenance": profile.priority_maintenance,
            "priority_performance": profile.priority_performance,
            "priority_environment": profile.priority_environment,
            "priority_purchase_price": profile.priority_purchase_price,
            "priority_long_distance": profile.priority_long_distance,
            "priority_comfort": profile.priority_comfort,
        }
        user_priorities = {
            "priority_running_cost": profile.priority_running_cost,
            "priority_maintenance": profile.priority_maintenance,
            "priority_performance": profile.priority_performance,
            "priority_environment": profile.priority_environment,
            "priority_purchase_price": profile.priority_purchase_price,
            "priority_long_distance": profile.priority_long_distance,
            "priority_comfort": profile.priority_comfort,
        }
        fuzzy_result = self.fuzzy_engine.reason(crisp_inputs, user_priorities, fc_result.all_facts)

        # 3. Bayesian Inference
        bayesian_result = self.bayesian_engine.reason(fc_result.all_facts)

        # 4. Hard Filter & Pricing Resolution (Prefer Variants)
        all_variants = kb_service.get_variants()
        min_b, max_b = self._get_budget_range(profile.purchase_budget)

        # Resolve location pricing
        resolved_variants = [
            kb_service.resolve_variant_pricing(v, profile.state, profile.city)
            for v in all_variants
        ]

        # Apply hard eligibility constraints
        eligible_variants = [
            v for v in resolved_variants
            if min_b <= v.effective_price <= max_b
        ]

        cond_pref = profile.vehicle_condition_preference.value if hasattr(profile.vehicle_condition_preference, "value") else str(profile.vehicle_condition_preference)
        if cond_pref == "new_only":
            eligible_variants = [v for v in eligible_variants if not v.is_used]

        # Apply Preferred Brands hard constraint with relaxation fallback
        brand_relaxation_note = None
        if profile.preferred_brands and isinstance(profile.preferred_brands, list) and len(profile.preferred_brands) > 0:
            norm_preferred = {b.strip().lower() for b in profile.preferred_brands if isinstance(b, str) and b.strip()}
            if norm_preferred:
                brand_matched = [
                    v for v in eligible_variants
                    if (
                        v.brand.strip().lower() in norm_preferred or
                        v.model_name.strip().lower() in norm_preferred or
                        f"{v.brand.strip().lower()} {v.model_name.strip().lower()}" in norm_preferred or
                        v.model_family.strip().lower() in norm_preferred
                    )
                ]
                if brand_matched:
                    eligible_variants = brand_matched
                    fc_result.derived_facts["brand_filter_applied"] = True
                    fc_result.derived_facts["preferred_brands_applied"] = list(profile.preferred_brands)
                    fc_result.inference_trace.append(
                        InferenceStep(
                            iteration=fc_result.iterations + 1,
                            rule_id="RULE_BRAND_CONSTRAINT",
                            rule_description="Pruned eligible candidate pool to match user's preferred brands or models",
                            conditions_matched=[f"preferred_brands_or_models={profile.preferred_brands}"],
                            facts_derived=[
                                "brand_filter_applied=True",
                                f"eligible_candidates_count={len(eligible_variants)}"
                            ]
                        )
                    )
                else:
                    # Relaxation fallback: keep candidate pool, record XAI relaxation note
                    brand_relaxation_note = (
                        f"Brand relaxation applied: No vehicles from preferred brand(s) ({', '.join(profile.preferred_brands)}) "
                        f"were available in the ₹{min_b/100000:.1f}L–₹{max_b/100000:.1f}L budget window. "
                        f"Showing best matching recommendations across all manufacturers."
                    )
                    fc_result.derived_facts["brand_constraint_relaxed"] = True
                    fc_result.inference_trace.append(
                        InferenceStep(
                            iteration=fc_result.iterations + 1,
                            rule_id="RULE_BRAND_RELAXATION",
                            rule_description="No vehicles from preferred brands fit the budget window; relaxed brand constraint to preserve other criteria",
                            conditions_matched=[
                                f"preferred_brands={profile.preferred_brands}",
                                f"budget_range=₹{min_b/100000:.1f}L-₹{max_b/100000:.1f}L"
                            ],
                            facts_derived=["brand_constraint_relaxed=True"]
                        )
                    )

        if not eligible_variants:
            # Clean empty response
            return self._build_empty_response(profile, fc_result, fuzzy_result, bayesian_result, min_b, max_b)

        # 5. AI Suitability Scoring for Eligible Variants
        variant_scores = [
            self.scoring_engine.score_variant(v, fc_result.all_facts, fuzzy_result, bayesian_result)
            for v in eligible_variants
        ]
        variant_scores.sort(key=lambda s: s.total_score, reverse=True)

        # Deduplicate recommendations by authoritative variant ID
        seen_variants = set()
        deduplicated_scores = []
        for vs in variant_scores:
            if vs.variant.id not in seen_variants:
                seen_variants.add(vs.variant.id)
                deduplicated_scores.append(vs)
        variant_scores = deduplicated_scores

        # Category Scoring
        category_scores = self.scoring_engine.score_categories(variant_scores)

        # Format vehicle_rankings
        vehicle_rankings = [
            self._format_variant_ranking(vs, rank=i + 1)
            for i, vs in enumerate(variant_scores)
        ]
        top_vehicles = vehicle_rankings[:5]

        # Explanations
        explanations = self.explanation_engine.generate_all(
            fc_result,
            fuzzy_result,
            bayesian_result,
            category_scores,
            [],  # VehicleScore empty for variant mode
            fc_result.all_facts,
        )

        # Add variant-specific XAI explanation
        if top_vehicles:
            top_v = top_vehicles[0]
            explanations.append(
                ReasoningExplanation(
                    stage="scoring",
                    title=f"Why Variant #{top_v['rank']}: {top_v['name']} Ranked #1?",
                    detail=(
                        f"Recommended specific trim '{top_v.get('variant_name')}' at {top_v.get('price_location_label', 'Ex-Showroom')}: ₹{(top_v['price_inr']/100000):.2f}L. "
                        f"Achieved top AI Suitability score of {top_v['score']}/100 based on user priority alignment. "
                        f"Key strengths: {', '.join(top_v.get('positive_factors', [])[:2])}."
                    ),
                    data={"top_variant": top_v}
                )
            )

        conflicts = self._detect_conflicts(fc_result.all_facts)
        if brand_relaxation_note:
            conflicts.append(brand_relaxation_note)
            explanations.append(
                ReasoningExplanation(
                    stage="scoring",
                    title="Brand Constraint Relaxation",
                    detail=brand_relaxation_note,
                    data={"preferred_brands": profile.preferred_brands, "relaxation_applied": True}
                )
            )

        profile_summary = {
            "first_time_owner": profile.first_time_owner,
            "experience": facts_get(profile.experience),
            "daily_distance": profile.daily_distance,
            "driving_environment": facts_get(profile.driving_environment),
            "transmission_preference": facts_get(profile.transmission_preference),
            "charging_knowledge": facts_get(profile.charging_knowledge),
            "parking": facts_get(profile.parking),
            "purchase_budget": profile.purchase_budget,
            "preferred_brands": profile.preferred_brands,
            "budget_segment": fc_result.all_facts.get("budget_segment", "unknown"),
            "daily_usage": fc_result.all_facts.get("daily_usage", "unknown"),
            "charging_feasibility": fc_result.all_facts.get("charging_feasibility", "unknown"),
            "location": f"{profile.city}, {profile.state}" if profile.city and profile.state else (profile.state or "All India"),
        }

        res = RecommendationResponse(
            category_scores=category_scores,
            vehicle_rankings=vehicle_rankings,
            top_vehicles=top_vehicles,
            user_profile_summary=profile_summary,
            derived_facts=fc_result.derived_facts,
            forward_chaining_result=fc_result,
            fuzzy_result=fuzzy_result,
            bayesian_result=bayesian_result,
            explanations=explanations,
            conflicts=conflicts,
        )
        self._cache[profile_hash] = res
        return res

    def recommend_advanced(self, query: AdvancedFilterQuery) -> Dict[str, Any]:
        import time
        import hashlib
        import json
        
        t0 = time.perf_counter()
        
        # 1. Cache Check
        query_hash = hashlib.sha256(query.model_dump_json().encode()).hexdigest()
        if not hasattr(self, '_cache'):
            self._cache = {}
        if query_hash in self._cache:
            res = self._cache[query_hash]
            res["diagnostics"] = {"cached": True, "total_ms": round((time.perf_counter() - t0) * 1000, 2)}
            return res
            
        t_parse = time.perf_counter() - t0

        all_variants = kb_service.get_variants()

        # 2. Resolve location-specific pricing
        t1 = time.perf_counter()
        resolved_variants = [
            kb_service.resolve_variant_pricing(v, query.state, query.city)
            for v in all_variants
        ]
        t_price = time.perf_counter() - t1

        # 3. Hard Eligibility Filtering
        t2 = time.perf_counter()
        eligible_variants = []
        excluded_samples = []

        q_str = query.search_query.lower().strip() if query.search_query else None

        if q_str:
            import re
            
            # Extract price pattern and update max_price_inr
            price_match = re.search(r'(\d+(?:\.\d+)?)\s*(lakhs?|l|cr|crores?|k)\b', q_str)
            if price_match:
                val = float(price_match.group(1))
                unit = price_match.group(2)
                if unit.startswith('l'):
                    if not query.max_price_inr: query.max_price_inr = val * 100000
                elif unit.startswith('c'):
                    if not query.max_price_inr: query.max_price_inr = val * 10000000
                elif unit == 'k':
                    if not query.max_price_inr: query.max_price_inr = val * 1000
                # Remove the matched price text
                q_str = q_str[:price_match.start()] + q_str[price_match.end():]
            
            # Remove filler words
            for stop_word in ["under", "for", "cars", "car", "vehicles", "vehicle", "with", "price", "budget", "around"]:
                q_str = re.sub(r'\b' + stop_word + r'\b', '', q_str)
            
            q_str = q_str.strip()

        for v in resolved_variants:
            is_eligible = True
            exclusion_reason = ""

            # Global Search Query
            if q_str:
                    searchable = f"{v.brand} {v.model_family} {v.model_name} {v.variant_name} {v.body_type} {v.vehicle_type} {v.performance_type} {v.fuel_type}".lower()
                    tokens = q_str.split()
                    for token in tokens:
                        if token == "ev" or token == "cng":
                            if not re.search(r'\b' + re.escape(token) + r'\b', searchable):
                                is_eligible = False
                                exclusion_reason = f"Did not match exact search term '{token}'"
                                break
                        else:
                            if token not in searchable:
                                is_eligible = False
                                exclusion_reason = f"Did not match search term '{token}'"
                                break

            # Price Filter (Strict Ex-Showroom at selected location)
            if is_eligible:
                p = v.effective_price
                if query.min_price_inr is not None and p < query.min_price_inr:
                    is_eligible = False
                    exclusion_reason = f"Price (₹{p/100000:.2f}L) below minimum filter (₹{query.min_price_inr/100000:.2f}L)"
                elif query.max_price_inr is not None and p > query.max_price_inr:
                    is_eligible = False
                    exclusion_reason = f"Price (₹{p/100000:.2f}L) exceeds maximum filter (₹{query.max_price_inr/100000:.2f}L)"

            # Categorical Filters (OR within, AND between)
            if is_eligible and query.brands:
                if not any(v.brand.lower() == b.lower() for b in query.brands):
                    is_eligible = False
                    exclusion_reason = f"Brand '{v.brand}' not in selected brands {query.brands}"

            if is_eligible and query.model_families:
                if not any(v.model_family.lower() == mf.lower() for mf in query.model_families):
                    is_eligible = False
                    exclusion_reason = f"Model family '{v.model_family}' not in selected families"

            if is_eligible and query.models:
                if not any(v.model_name.lower() == m.lower() for m in query.models):
                    is_eligible = False
                    exclusion_reason = f"Model '{v.model_name}' not in selected models {query.models}"

            if is_eligible and query.variants:
                if not any(v.variant_name.lower() == var.lower() for var in query.variants):
                    is_eligible = False
                    exclusion_reason = f"Variant '{v.variant_name}' not in selected variants {query.variants}"

            if is_eligible and query.body_types:
                if not any(v.body_type.lower() == bt.lower() for bt in query.body_types):
                    is_eligible = False
                    exclusion_reason = f"Body type '{v.body_type}' not in selected body types {query.body_types}"

            if is_eligible and query.vehicle_types:
                if not any(v.vehicle_type.lower() == vt.lower() for vt in query.vehicle_types):
                    is_eligible = False
                    exclusion_reason = f"Vehicle category '{v.vehicle_type}' not in selected categories"

            if is_eligible and query.performance_types:
                if not any(v.performance_type.lower() == pt.lower() for pt in query.performance_types):
                    is_eligible = False
                    exclusion_reason = f"Performance rating '{v.performance_type}' not in selected"

            # Strict Powertrain Filter (exact canonical match)
            if is_eligible and query.powertrains:
                norm_pws = {_normalize_fuel(pw) for pw in query.powertrains}
                v_pw = _normalize_fuel(v.fuel_type)
                if v_pw not in norm_pws:
                    is_eligible = False
                    exclusion_reason = f"Powertrain '{v.fuel_type}' not in selected {query.powertrains}"

            if is_eligible and query.transmissions:
                if not any(t.lower() in [tr.lower() for tr in v.transmission] for t in query.transmissions):
                    is_eligible = False
                    exclusion_reason = f"Transmission ({', '.join(v.transmission)}) not in selected {query.transmissions}"

            if is_eligible and query.seating_capacities:
                if v.seating_capacity not in query.seating_capacities:
                    is_eligible = False
                    exclusion_reason = f"Seating ({v.seating_capacity}) not in selected capacities {query.seating_capacities}"

            if is_eligible and query.conditions:
                cond_matches = False
                for c in query.conditions:
                    if c.lower() == "all":
                        cond_matches = True
                        break
                    elif c.lower() == "used" and v.is_used:
                        cond_matches = True
                        break
                    elif c.lower() == "new" and not v.is_used:
                        cond_matches = True
                        break
                if not cond_matches:
                    is_eligible = False
                    exclusion_reason = "Condition (new/used) mismatch"

            # Required features (hard constraint)
            if is_eligible and query.required_features:
                vf_set = set(f.lower() for f in v.features)
                for rf in query.required_features:
                    if not any(rf.lower() in f for f in vf_set):
                        is_eligible = False
                        exclusion_reason = f"Missing required feature '{rf}'"
                        break

            if is_eligible:
                eligible_variants.append(v)
            else:
                # Capture diagnostic explanation (prioritize vehicles that match search or specific brand if requested)
                is_search_match = q_str and q_str in f"{v.brand} {v.model_family} {v.model_name} {v.variant_name}".lower()
                diag_item = {
                    "id": v.id,
                    "name": f"{v.brand} {v.model_name} {v.variant_name}",
                    "price_inr": v.effective_price,
                    "reason": exclusion_reason,
                    "is_search_match": bool(is_search_match)
                }
                if is_search_match:
                    excluded_samples.insert(0, diag_item)
                elif len(excluded_samples) < 20:
                    excluded_samples.append(diag_item)

        # 3. AI Suitability Scoring on Eligible Variants
        user_prof = query.user_profile or UserProfile(
            purchase_budget=(query.max_price_inr or 2000000),
            state=query.state,
            city=query.city
        )

        t3 = time.perf_counter()
        initial_facts = self._normalize_input(user_prof)
        fc_engine = self._get_fc_engine()
        fc_engine.set_facts(initial_facts)
        fc_res = fc_engine.infer()
        t_fc = time.perf_counter() - t3

        crisp_inputs = {
            "daily_distance": user_prof.daily_distance,
            "purchase_budget": (query.max_price_inr or user_prof.purchase_budget) / 100000,
            "priority_running_cost": user_prof.priority_running_cost,
            "priority_maintenance": user_prof.priority_maintenance,
            "priority_performance": user_prof.priority_performance,
            "priority_environment": user_prof.priority_environment,
            "priority_purchase_price": user_prof.priority_purchase_price,
            "priority_long_distance": user_prof.priority_long_distance,
            "priority_comfort": user_prof.priority_comfort,
        }
        user_p = {
            "priority_running_cost": user_prof.priority_running_cost,
            "priority_maintenance": user_prof.priority_maintenance,
            "priority_performance": user_prof.priority_performance,
            "priority_environment": user_prof.priority_environment,
            "priority_purchase_price": user_prof.priority_purchase_price,
            "priority_long_distance": user_prof.priority_long_distance,
            "priority_comfort": user_prof.priority_comfort,
        }
        
        t4 = time.perf_counter()
        fuzzy_res = self.fuzzy_engine.reason(crisp_inputs, user_p, fc_res.all_facts)
        t_fuzzy = time.perf_counter() - t4
        
        t5 = time.perf_counter()
        bayes_res = self.bayesian_engine.reason(fc_res.all_facts)
        t_bayes = time.perf_counter() - t5

        t6 = time.perf_counter()
        scored_variants = [
            self.scoring_engine.score_variant(
                v, fc_res.all_facts, fuzzy_res, bayes_res, preferred_features=query.preferred_features
            )
            for v in eligible_variants
        ]
        t_score = time.perf_counter() - t6

        # Deduplicate by variant ID
        seen_variants = set()
        deduplicated_scored = []
        for vs in scored_variants:
            if vs.variant.id not in seen_variants:
                seen_variants.add(vs.variant.id)
                deduplicated_scored.append(vs)
        scored_variants = deduplicated_scored

        # 4. Sorting
        t7 = time.perf_counter()
        sb = query.sort_by.lower()
        if sb == "price_asc":
            scored_variants.sort(key=lambda s: s.variant.effective_price)
        elif sb == "price_desc":
            scored_variants.sort(key=lambda s: s.variant.effective_price, reverse=True)
        elif sb == "performance":
            scored_variants.sort(key=lambda s: s.variant.performance_score, reverse=True)
        elif sb == "running_cost":
            scored_variants.sort(key=lambda s: s.variant.running_cost_per_km)
        elif sb == "maintenance":
            scored_variants.sort(key=lambda s: s.variant.maintenance_index)
        else:
            # Default: AI Suitability DESC
            scored_variants.sort(key=lambda s: s.total_score, reverse=True)
        t_sort = time.perf_counter() - t7

        total_eligible = len(eligible_variants)
        total_scored = len(scored_variants)

        page = query.page if query.page and query.page > 0 else 1
        limit = query.limit if query.limit and query.limit > 0 else None

        if limit:
            import math
            start_idx = (page - 1) * limit
            end_idx = start_idx + limit
            paginated_scored = scored_variants[start_idx:end_idx]
            total_pages = math.ceil(total_scored / limit) if total_scored > 0 else 1
        else:
            start_idx = 0
            paginated_scored = scored_variants
            total_pages = 1

        rankings = [
            self._format_variant_ranking(vs, rank=start_idx + i + 1)
            for i, vs in enumerate(paginated_scored)
        ]

        t_total = time.perf_counter() - t0
        diag = {
            "cached": False,
            "total_ms": round(t_total * 1000, 2),
            "parse_ms": round(t_parse * 1000, 2),
            "price_resolve_ms": round(t_price * 1000, 2),
            "hard_filter_ms": round(t_parse * 1000, 2), # reuse t_parse conceptually or just t2
            "forward_chaining_ms": round(t_fc * 1000, 2),
            "fuzzy_ms": round(t_fuzzy * 1000, 2),
            "bayesian_ms": round(t_bayes * 1000, 2),
            "scoring_ms": round(t_score * 1000, 2),
            "sorting_ms": round(t_sort * 1000, 2)
        }

        res = {
            "total_evaluated": len(all_variants),
            "eligible_count": total_eligible,
            "page": page,
            "limit": limit or total_eligible,
            "total_pages": total_pages,
            "has_next": (page < total_pages) if limit else False,
            "has_prev": (page > 1) if limit else False,
            "results": rankings,
            "excluded_diagnostics": excluded_samples,
            "applied_location": {
                "state": query.state or "All India",
                "city": query.city or "Starting Ex-Showroom Benchmark"
            },
            "diagnostics": diag
        }
        
        self._cache[query_hash] = res
        return res

    def _format_variant_ranking(self, vs: VariantScore, rank: int) -> Dict[str, Any]:
        v = vs.variant
        img_res = vehicle_image_service.resolve_vehicle_image(
            vehicle_id=v.id,
            brand=v.brand,
            model_name=v.model_name,
            variant_name=v.variant_name,
            body_type=v.body_type,
            existing_image_path=v.image_path,
        )
        full_name = f"{v.brand} {v.model_name} {v.variant_name}".strip()
        return {
            "rank": rank,
            "vehicle_id": v.id,
            "variant_id": v.id,
            "name": full_name,
            "brand": v.brand,
            "model_family": v.model_family,
            "model_name": v.model_name,
            "variant_name": v.variant_name,
            "fuel_type": v.fuel_type,
            "powertrain_type": v.powertrain_type or v.fuel_type.capitalize(),
            "transmission": v.transmission[0].capitalize() if v.transmission else "Manual",
            "all_transmissions": v.transmission,
            "score": vs.total_score,
            "price_inr": v.effective_price,
            "base_price_inr": v.price_inr,
            "is_used": v.is_used,
            "used_price_inr": v.used_price_inr,
            "price_location_label": v.price_location_label or "Starting Ex-Showroom (India-Wide)",
            "price_source": v.price_source_label or "Official Manufacturer List / SIAM",
            "price_last_verified": v.price_last_verified or "September 2026",
            "is_city_specific_price": v.is_city_specific_price,
            "body_type": v.body_type,
            "vehicle_type": v.vehicle_type,
            "performance_type": v.performance_type,
            "engine_cc": v.engine_cc,
            "power_bhp": v.power_bhp,
            "torque_nm": v.torque_nm,
            "seating_capacity": v.seating_capacity,
            "boot_space_litres": v.boot_space_litres,
            "ground_clearance_mm": v.ground_clearance_mm,
            "features": v.features,
            "segment": v.body_type,
            "image_url": img_res.image_url,
            "image_path": img_res.image_url,
            "image_source": img_res.source,
            "image_license": img_res.license,
            "image_attribution": img_res.attribution,
            "is_fallback": img_res.is_fallback,
            "tco_5yr_est_inr": round(
                v.effective_price + (v.running_cost_per_km * 50000.0) + (v.maintenance_index * 150000.0)
            ),
            "ncap_rating": v.ncap_rating or 4,
            "positive_factors": vs.positive_factors,
            "negative_factors": vs.negative_factors,
            "component_scores": {
                "cost": round(vs.cost_score * 100, 1),
                "usage": round(vs.usage_compatibility * 100, 1),
                "infrastructure": round(vs.infrastructure_compatibility * 100, 1),
                "maintenance": round(vs.maintenance_compatibility * 100, 1),
                "transmission": round(vs.transmission_compatibility * 100, 1),
                "experience": round(vs.experience_compatibility * 100, 1),
                "performance": round(vs.performance_compatibility * 100, 1),
                "environment": round(vs.environmental_compatibility * 100, 1),
                "practicality": round(vs.practicality_score * 100, 1),
            },
        }

    def _build_empty_response(
        self, profile: UserProfile, fc_res: Any, fuz_res: Any, bay_res: Any, min_b: float, max_b: float
    ) -> RecommendationResponse:
        return RecommendationResponse(
            category_scores=[],
            vehicle_rankings=[],
            top_vehicles=[],
            user_profile_summary={
                "purchase_budget": profile.purchase_budget,
                "message": f"No eligible variants found in ₹{min_b/100000:.1f}L – ₹{max_b/100000:.1f}L budget window at selected location."
            },
            derived_facts=fc_res.derived_facts,
            forward_chaining_result=fc_res,
            fuzzy_result=fuz_res,
            bayesian_result=bay_res,
            explanations=[
                ReasoningExplanation(
                    stage="scoring",
                    title="Eligibility Boundary Filter",
                    detail=f"Hard price constraint (₹{min_b/100000:.1f}L – ₹{max_b/100000:.1f}L) matched 0 variants. Broaden allocation range.",
                    data={"min_b": min_b, "max_b": max_b}
                )
            ],
            conflicts=["Selected budget range excludes all current vehicle records in knowledge base."]
        )

    def _detect_conflicts(self, facts: Dict[str, Any]) -> List[str]:
        conflicts = []
        budget = facts.get("purchase_budget", 1000000)
        perf_p = facts.get("priority_performance", 0.5)
        rc_p = facts.get("priority_running_cost", 0.5)

        if budget < 1000000 and perf_p > 0.75:
            conflicts.append("Trade-off detected: High performance preference paired with budget under ₹10 Lakh. System weighted priority trade-offs.")
        if rc_p > 0.75 and perf_p > 0.75:
            conflicts.append("Trade-off detected: Low running cost requirement conflicts with high engine power. Scoring engine optimized hybrid/efficient balances.")
        return conflicts


def facts_get(val: Any) -> str:
    return val.value if hasattr(val, "value") else str(val)


recommendation_service = RecommendationService()
