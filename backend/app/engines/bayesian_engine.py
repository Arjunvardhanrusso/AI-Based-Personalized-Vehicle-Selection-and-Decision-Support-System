"""
Bayesian Reasoning Engine

Implements Bayesian inference for reasoning under uncertainty:
1. Maintains prior probability distributions
2. Updates beliefs based on observed evidence using Bayes' theorem
3. Handles unknown/uncertain inputs without assuming false
4. Computes posterior probabilities
5. Calculates uncertainty levels using Shannon entropy
6. Generates human-readable uncertainty explanations
"""
from typing import Any, Dict, List, Optional, Tuple
from app.models.reasoning import BayesianNode, BayesianResult
import json
import math


class BayesianEngine:
    """
    Bayesian inference engine for reasoning under uncertainty.

    Uses naive Bayes with configurable priors and conditional likelihoods
    loaded from the knowledge base.
    """

    def __init__(self):
        self.nodes: Dict[str, Dict] = {}

    def load_from_file(self, filepath: str) -> None:
        """Load Bayesian network definitions from a JSON file."""
        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)
        self.nodes = data.get("nodes", {})

    @staticmethod
    def _normalize(distribution: List[float]) -> List[float]:
        """Normalize a probability distribution to sum to 1."""
        total = sum(distribution)
        if total == 0:
            n = len(distribution)
            return [1.0 / n] * n
        return [p / total for p in distribution]

    @staticmethod
    def _entropy(distribution: List[float]) -> float:
        """
        Calculate Shannon entropy of a probability distribution.

        Higher entropy = more uncertainty.
        Returns value between 0 (certain) and log2(n) (maximum uncertainty).
        """
        entropy = 0.0
        for p in distribution:
            if p > 0:
                entropy -= p * math.log2(p)
        return entropy

    @staticmethod
    def _max_entropy(n: int) -> float:
        """Maximum possible entropy for n states (uniform distribution)."""
        if n <= 1:
            return 0.0
        return math.log2(n)

    def update_belief(
        self,
        node_name: str,
        evidence: Dict[str, str],
    ) -> Optional[BayesianNode]:
        """
        Update the belief for a single Bayesian node given evidence.

        Uses Bayes' theorem with naive independence assumption:
        P(H|E1,E2,...) ∝ P(H) × P(E1|H) × P(E2|H) × ...

        Args:
            node_name: The name of the Bayesian node to update
            evidence: Dict mapping evidence factor names to observed values

        Returns:
            BayesianNode with prior, posterior, and explanation
        """
        if node_name not in self.nodes:
            return None

        node_def = self.nodes[node_name]
        states = node_def["states"]
        prior = list(node_def["prior"])
        evidence_factors = node_def.get("evidence_factors", {})

        # Start with the prior
        posterior = list(prior)
        evidence_applied = []

        # Apply each piece of evidence
        for factor_name, factor_value in evidence.items():
            if factor_name not in evidence_factors:
                continue

            factor_table = evidence_factors[factor_name]
            if factor_value not in factor_table:
                continue

            likelihood = factor_table[factor_value]["likelihood"]
            evidence_applied.append(f"{factor_name} = {factor_value}")

            # Multiply posterior by likelihood (Bayes' theorem)
            for i in range(len(states)):
                posterior[i] *= likelihood[i]

        # Normalize
        posterior = self._normalize(posterior)

        # Calculate uncertainty
        entropy = self._entropy(posterior)
        max_ent = self._max_entropy(len(states))
        uncertainty = entropy / max_ent if max_ent > 0 else 0.0

        # Find dominant state
        max_idx = posterior.index(max(posterior))
        dominant_state = states[max_idx]

        # Build result
        prior_dict = {states[i]: round(prior[i], 4) for i in range(len(states))}
        posterior_dict = {states[i]: round(posterior[i], 4) for i in range(len(states))}

        return BayesianNode(
            node_name=node_name,
            description=node_def.get("description", ""),
            prior=prior_dict,
            evidence_applied=evidence_applied,
            posterior=posterior_dict,
            dominant_state=dominant_state,
            uncertainty_level=round(uncertainty, 4),
        )

    def reason(self, facts: Dict[str, Any]) -> BayesianResult:
        """
        Run Bayesian inference for all relevant nodes given the current facts.

        Maps facts to appropriate evidence for each Bayesian node,
        then updates beliefs.
        """
        results = []
        explanations = []

        # --- Charging Feasibility ---
        charging_evidence = {}
        if "parking" in facts:
            charging_evidence["parking"] = facts["parking"]
        if "charging_knowledge" in facts:
            charging_evidence["charging_knowledge"] = facts["charging_knowledge"]

        node = self.update_belief("charging_feasibility", charging_evidence)
        if node:
            results.append(node)
            explanations.append(
                self._explain_node(node, "charging feasibility")
            )

        # --- EV Suitability ---
        ev_evidence = {}

        # Use charging feasibility posterior to inform EV suitability
        if node:
            ev_evidence["charging_feasibility_state"] = node.dominant_state

        # Map daily usage level
        daily_usage = facts.get("daily_usage", "medium")
        ev_evidence["daily_usage_level"] = daily_usage

        # Map long distance frequency
        long_dist = facts.get("long_distance_frequency", "occasional")
        ev_evidence["long_distance_level"] = long_dist

        ev_node = self.update_belief("ev_suitability", ev_evidence)
        if ev_node:
            results.append(ev_node)
            explanations.append(
                self._explain_node(ev_node, "EV suitability")
            )

        # --- Diesel Suitability ---
        diesel_evidence = {}
        diesel_evidence["daily_usage_level"] = daily_usage

        driving_env = facts.get("driving_environment", "mixed")
        diesel_evidence["driving_environment_type"] = driving_env
        diesel_evidence["long_distance_level"] = long_dist

        diesel_node = self.update_belief("diesel_suitability", diesel_evidence)
        if diesel_node:
            results.append(diesel_node)
            explanations.append(
                self._explain_node(diesel_node, "diesel suitability")
            )

        # --- CNG Suitability ---
        if "cng_suitability" in self.nodes:
            cng_evidence = {}
            cng_evidence["daily_usage_level"] = daily_usage
            cng_evidence["driving_environment_type"] = driving_env
            cng_evidence["fuel_station_access"] = facts.get("fuel_station_access", "easy")

            cng_node = self.update_belief("cng_suitability", cng_evidence)
            if cng_node:
                results.append(cng_node)
                explanations.append(
                    self._explain_node(cng_node, "CNG suitability")
                )

        # --- Used Vehicle Preference ---
        used_evidence = {}

        # Map budget to budget_level
        budget = facts.get("purchase_budget", 1000000)
        if budget <= 500000:
            used_evidence["budget_level"] = "budget"
        elif budget <= 1200000:
            used_evidence["budget_level"] = "medium"
        elif budget <= 2000000:
            used_evidence["budget_level"] = "high"
        else:
            used_evidence["budget_level"] = "premium"

        cond_pref = facts.get("vehicle_condition_preference", "no_preference")
        used_evidence["vehicle_condition_preference"] = cond_pref

        used_node = self.update_belief("used_vehicle_preference", used_evidence)
        if used_node:
            results.append(used_node)
            explanations.append(
                self._explain_node(used_node, "used vehicle preference")
            )

        return BayesianResult(nodes=results, explanations=explanations)

    def _explain_node(self, node: BayesianNode, label: str) -> str:
        """Generate a human-readable explanation for a Bayesian node result."""
        posterior = node.posterior
        dominant = node.dominant_state
        confidence = posterior.get(dominant, 0)

        if node.uncertainty_level < 0.3:
            certainty = "high confidence"
        elif node.uncertainty_level < 0.6:
            certainty = "moderate confidence"
        elif node.uncertainty_level < 0.85:
            certainty = "low confidence"
        else:
            certainty = "very uncertain"

        evidence_str = ", ".join(node.evidence_applied) if node.evidence_applied else "no specific evidence"

        explanation = (
            f"Based on {evidence_str}, the Bayesian model estimates {label} "
            f"as '{dominant}' with {certainty} "
            f"(probability: {confidence:.0%}, uncertainty: {node.uncertainty_level:.0%})."
        )
        return explanation

    def get_priors(self) -> Dict:
        """Return all Bayesian node definitions for visualization."""
        return self.nodes
