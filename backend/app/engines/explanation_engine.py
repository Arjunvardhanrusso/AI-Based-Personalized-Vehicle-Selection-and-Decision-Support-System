"""
Explanation Engine

Generates human-readable, trace-based explanations for all AI reasoning stages.
This is the core of the Explainable AI (XAI) component.

Never generates hardcoded explanations — all output is derived from actual
inference, fuzzy, Bayesian, and scoring data.
"""
from typing import Any, Dict, List
from app.models.reasoning import (
    BayesianResult,
    CategoryScore,
    ForwardChainingResult,
    FuzzyResult,
    ReasoningExplanation,
)
from app.models.vehicle import VehicleScore


class ExplanationEngine:
    """
    Generates structured, trace-based explanations for the recommendation.
    """

    def generate_all(
        self,
        fc_result: ForwardChainingResult,
        fuzzy_result: FuzzyResult,
        bayesian_result: BayesianResult,
        category_scores: List[CategoryScore],
        vehicle_scores: List[VehicleScore],
        facts: Dict[str, Any],
    ) -> List[ReasoningExplanation]:
        """Generate explanations for all reasoning stages."""
        explanations = []

        explanations.extend(self._explain_input(facts, fc_result))
        explanations.extend(self._explain_forward_chaining(fc_result))
        explanations.extend(self._explain_fuzzy(fuzzy_result))
        explanations.extend(self._explain_bayesian(bayesian_result))
        explanations.extend(
            self._explain_scoring(category_scores, vehicle_scores)
        )
        explanations.extend(self._explain_conflicts(facts))

        return explanations

    def _explain_input(
        self, facts: Dict[str, Any], fc_result: ForwardChainingResult
    ) -> List[ReasoningExplanation]:
        """Explain the input normalization stage."""
        initial = fc_result.initial_facts
        key_inputs = {}
        for key in [
            "daily_distance",
            "driving_environment",
            "experience",
            "transmission_preference",
            "charging_knowledge",
            "parking",
            "purchase_budget",
        ]:
            if key in initial:
                key_inputs[key] = initial[key]

        return [
            ReasoningExplanation(
                stage="input",
                title="User Input Extraction",
                detail=(
                    f"Extracted {len(initial)} facts from user responses. "
                    f"Key inputs include daily distance of {initial.get('daily_distance', '?')} km, "
                    f"{initial.get('driving_environment', '?')} driving environment, "
                    f"and {initial.get('experience', '?')} experience level."
                ),
                data={"initial_facts": key_inputs, "total_facts": len(initial)},
            )
        ]

    def _explain_forward_chaining(
        self, fc_result: ForwardChainingResult
    ) -> List[ReasoningExplanation]:
        """Explain the forward chaining inference process."""
        explanations = []

        # Overall summary
        explanations.append(
            ReasoningExplanation(
                stage="forward_chaining",
                title="Forward Chaining Summary",
                detail=(
                    f"The inference engine fired {len(fc_result.rules_fired)} rules "
                    f"across {fc_result.iterations} iterations, deriving "
                    f"{len(fc_result.derived_facts)} new facts from the initial "
                    f"{len(fc_result.initial_facts)} user-provided facts."
                ),
                data={
                    "rules_fired": fc_result.rules_fired,
                    "iterations": fc_result.iterations,
                    "derived_count": len(fc_result.derived_facts),
                },
            )
        )

        # Inference trace details
        trace_data = []
        for step in fc_result.inference_trace:
            trace_data.append(
                {
                    "rule": step.rule_id,
                    "description": step.rule_description,
                    "conditions": step.conditions_matched,
                    "derived": step.facts_derived,
                    "iteration": step.iteration,
                }
            )

        if trace_data:
            explanations.append(
                ReasoningExplanation(
                    stage="forward_chaining",
                    title="Inference Trace",
                    detail="Detailed trace of each rule that fired during inference.",
                    data={"trace": trace_data},
                )
            )

        # Key derived facts
        key_derived = {}
        important_facts = [
            "daily_usage", "urban_usage", "highway_usage",
            "charging_feasibility", "home_charging_potential",
            "experience_level", "manual_preference", "auto_preference",
            "transmission_flexible", "price_sensitivity",
            "ev_strong_candidate", "diesel_advantage",
        ]
        for fact_name in important_facts:
            if fact_name in fc_result.derived_facts:
                key_derived[fact_name] = fc_result.derived_facts[fact_name]

        if key_derived:
            explanations.append(
                ReasoningExplanation(
                    stage="forward_chaining",
                    title="Key Derived Facts",
                    detail=(
                        "Important conclusions derived through rule-based reasoning."
                    ),
                    data={"key_facts": key_derived},
                )
            )

        return explanations

    def _explain_fuzzy(
        self, fuzzy_result: FuzzyResult
    ) -> List[ReasoningExplanation]:
        """Explain the fuzzy reasoning results."""
        explanations = []

        # Membership details
        membership_data = {}
        for m in fuzzy_result.memberships:
            # Only include memberships with non-zero values
            non_zero = {k: v for k, v in m.memberships.items() if v > 0}
            if non_zero:
                membership_data[m.variable] = {
                    "crisp_value": m.crisp_value,
                    "memberships": non_zero,
                }

        if membership_data:
            # Find an interesting example
            example_var = None
            for var, data in membership_data.items():
                if len(data["memberships"]) > 1:
                    example_var = var
                    break

            detail = "Fuzzy reasoning converted crisp inputs into graded membership values."
            if example_var:
                m = membership_data[example_var]
                memberships_str = ", ".join(
                    f"{k}: {v:.2f}" for k, v in m["memberships"].items()
                )
                detail += (
                    f" For example, {example_var} = {m['crisp_value']} "
                    f"has memberships: {memberships_str}."
                )

            explanations.append(
                ReasoningExplanation(
                    stage="fuzzy",
                    title="Fuzzy Membership Analysis",
                    detail=detail,
                    data={"memberships": membership_data},
                )
            )

        # Preference scores
        if fuzzy_result.preference_scores:
            explanations.append(
                ReasoningExplanation(
                    stage="fuzzy",
                    title="Fuzzy Preference Scores",
                    detail=(
                        "User priorities were processed through fuzzy importance "
                        "membership functions to produce graded preference weights."
                    ),
                    data={"scores": fuzzy_result.preference_scores},
                )
            )

        return explanations

    def _explain_bayesian(
        self, bayesian_result: BayesianResult
    ) -> List[ReasoningExplanation]:
        """Explain the Bayesian inference results."""
        explanations = []

        for node in bayesian_result.nodes:
            detail = ""
            for expl in bayesian_result.explanations:
                if node.node_name in expl.lower():
                    detail = expl
                    break

            if not detail:
                detail = (
                    f"Bayesian inference for {node.node_name}: "
                    f"dominant state = {node.dominant_state}, "
                    f"uncertainty = {node.uncertainty_level:.0%}."
                )

            explanations.append(
                ReasoningExplanation(
                    stage="bayesian",
                    title=f"Bayesian: {node.description}",
                    detail=detail,
                    data={
                        "node": node.node_name,
                        "prior": node.prior,
                        "posterior": node.posterior,
                        "evidence": node.evidence_applied,
                        "uncertainty": node.uncertainty_level,
                    },
                )
            )

        return explanations

    def _explain_scoring(
        self,
        category_scores: List[CategoryScore],
        vehicle_scores: List[VehicleScore],
    ) -> List[ReasoningExplanation]:
        """Explain the final scoring and ranking."""
        explanations = []

        # Category ranking
        if category_scores:
            ranking = {cs.category: cs.score for cs in category_scores}
            top = category_scores[0]

            reasons = []
            for factor in top.positive_factors[:3]:
                reasons.append(f"• {factor}")

            detail = (
                f"{top.category.upper()} ranked highest with a score of "
                f"{top.score}/100."
            )
            if reasons:
                detail += " Key strengths:\n" + "\n".join(reasons)

            explanations.append(
                ReasoningExplanation(
                    stage="scoring",
                    title="Vehicle Category Ranking",
                    detail=detail,
                    data={
                        "ranking": ranking,
                        "top_category": top.category,
                        "top_positives": top.positive_factors,
                        "top_negatives": top.negative_factors,
                    },
                )
            )

        # Top vehicle
        if vehicle_scores:
            top_v = vehicle_scores[0]
            explanations.append(
                ReasoningExplanation(
                    stage="scoring",
                    title="Top Recommended Vehicle",
                    detail=(
                        f"{top_v.vehicle.brand} {top_v.vehicle.name} "
                        f"({top_v.vehicle.fuel_type}) scored {top_v.total_score}/100. "
                        f"Strengths: {', '.join(top_v.positive_factors[:3])}."
                    ),
                    data={
                        "vehicle": f"{top_v.vehicle.brand} {top_v.vehicle.name}",
                        "score": top_v.total_score,
                        "components": top_v.weighted_components,
                    },
                )
            )

        return explanations

    def _explain_conflicts(
        self, facts: Dict[str, Any]
    ) -> List[ReasoningExplanation]:
        """Detect and explain conflicting preferences."""
        conflicts = []

        # Low budget + High performance
        budget = facts.get("purchase_budget", 1000000)
        perf_p = facts.get("priority_performance", 0.5)
        if budget < 700000 and perf_p > 0.7:
            conflicts.append(
                "You want high performance but have a lower budget. "
                "The system prioritized budget-friendly options while "
                "still considering performance where possible."
            )

        # Manual preference + EV interest
        if (
            facts.get("transmission_preference") == "manual"
            and facts.get("eco_conscious") == "true"
        ):
            conflicts.append(
                "You prefer manual transmission and value environmental friendliness. "
                "Most EVs and hybrids only offer automatic transmission. "
                "The system balanced both preferences in the scoring."
            )

        # Low running cost + Low purchase price
        if facts.get("priority_running_cost", 0) > 0.7 and facts.get(
            "priority_purchase_price", 0
        ) > 0.7:
            if budget < 1000000:
                conflicts.append(
                    "You want both low running cost and low purchase price. "
                    "The most fuel-efficient vehicles (EVs, hybrids) tend to have higher "
                    "purchase prices. The system found the best balance for your needs."
                )

        if conflicts:
            return [
                ReasoningExplanation(
                    stage="conflicts",
                    title="Preference Conflicts Detected",
                    detail="\n\n".join(conflicts),
                    data={"conflict_count": len(conflicts), "conflicts": conflicts},
                )
            ]
        return []
