"""
Fuzzy Reasoning Engine

Implements fuzzy logic with:
1. Trapezoidal and triangular membership functions
2. Fuzzy membership calculation for continuous inputs
3. Linguistic variable to numeric conversion
4. Preference scoring with fuzzy reasoning
5. Defuzzification for final crisp values
"""
from typing import Any, Dict, List, Optional, Tuple
from app.models.reasoning import FuzzyMembership, FuzzyResult
import json
import math


class FuzzyEngine:
    """
    Fuzzy reasoning engine using trapezoidal/triangular membership functions.

    Converts crisp input values into fuzzy memberships, applies fuzzy
    rules for preference scoring, and defuzzifies results.
    """

    def __init__(self):
        self.fuzzy_sets: Dict = {}
        self.linguistic_map: Dict[str, float] = {}

    def load_from_file(self, filepath: str) -> None:
        """Load fuzzy set definitions from a JSON file."""
        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)

        self.fuzzy_sets = data.get("fuzzy_sets", {})
        self.linguistic_map = data.get("linguistic_to_numeric", {})

    @staticmethod
    def trapezoidal_membership(x: float, a: float, b: float, c: float, d: float) -> float:
        """
        Calculate membership degree for a trapezoidal function.

        Parameters define the trapezoid shape:
            a: left foot (membership starts rising)
            b: left shoulder (membership reaches 1.0)
            c: right shoulder (membership starts falling)
            d: right foot (membership reaches 0.0)

        For triangular functions, set b == c.
        """
        if x <= a or x >= d:
            return 0.0
        elif a < x < b:
            return (x - a) / (b - a) if b != a else 1.0
        elif b <= x <= c:
            return 1.0
        elif c < x < d:
            return (d - x) / (d - c) if d != c else 1.0
        return 0.0

    @staticmethod
    def triangular_membership(x: float, a: float, b: float, c: float) -> float:
        """
        Calculate membership degree for a triangular function.

        Parameters:
            a: left foot
            b: peak (membership = 1.0)
            c: right foot
        """
        if x <= a or x >= c:
            return 0.0
        elif a < x <= b:
            return (x - a) / (b - a) if b != a else 1.0
        elif b < x < c:
            return (c - x) / (c - b) if c != b else 1.0
        return 0.0

    def calculate_membership(self, variable: str, crisp_value: float) -> FuzzyMembership:
        """
        Calculate fuzzy memberships for a given crisp value across all sets
        of a fuzzy variable.
        """
        if variable not in self.fuzzy_sets:
            return FuzzyMembership(
                variable=variable,
                crisp_value=crisp_value,
                memberships={},
            )

        var_def = self.fuzzy_sets[variable]
        sets = var_def.get("sets", {})
        memberships = {}

        for set_name, set_def in sets.items():
            params = set_def["params"]
            func_type = set_def.get("type", "trapezoidal")

            if func_type == "trapezoidal":
                memberships[set_name] = round(
                    self.trapezoidal_membership(crisp_value, *params), 4
                )
            elif func_type == "triangular":
                memberships[set_name] = round(
                    self.triangular_membership(crisp_value, *params), 4
                )

        return FuzzyMembership(
            variable=variable,
            crisp_value=crisp_value,
            memberships=memberships,
        )

    def linguistic_to_numeric(self, value: str) -> float:
        """Convert a linguistic label to a numeric value."""
        return self.linguistic_map.get(value, 0.5)

    def calculate_preference_scores(
        self, user_priorities: Dict[str, float], facts: Dict[str, Any]
    ) -> Dict[str, float]:
        """
        Calculate fuzzy preference scores based on user priorities.

        Each priority is fuzzified through the 'importance' membership
        function to produce graded preference weights.
        """
        scores = {}

        for priority_key, priority_value in user_priorities.items():
            # Fuzzify the priority value through importance membership
            membership = self.calculate_membership("importance", priority_value)
            memberships = membership.memberships

            # Calculate a weighted score using fuzzy membership values
            # Higher membership in 'very_important' → higher score
            score = (
                memberships.get("not_important", 0) * 0.1
                + memberships.get("slightly_important", 0) * 0.3
                + memberships.get("important", 0) * 0.65
                + memberships.get("very_important", 0) * 0.95
            )
            scores[priority_key] = round(score, 4)

        return scores

    def fuzzify_inputs(self, inputs: Dict[str, float]) -> List[FuzzyMembership]:
        """
        Fuzzify multiple crisp inputs.

        Maps input variable names to fuzzy set definitions and
        calculates memberships for each.
        """
        memberships = []

        # Map from input names to fuzzy set variable names
        variable_mapping = {
            "daily_distance": "daily_distance",
            "purchase_budget": "budget",
            "running_cost_per_km": "running_cost_per_km",
            "priority_running_cost": "importance",
            "priority_maintenance": "importance",
            "priority_performance": "importance",
            "priority_environment": "importance",
            "priority_purchase_price": "importance",
            "priority_long_distance": "importance",
            "priority_comfort": "importance",
        }

        for input_name, value in inputs.items():
            fuzzy_var = variable_mapping.get(input_name)
            if fuzzy_var:
                membership = self.calculate_membership(fuzzy_var, value)
                # Override the variable name with the input name for clarity
                membership.variable = input_name
                memberships.append(membership)

        return memberships

    def defuzzify_centroid(self, memberships: Dict[str, float], output_range: Tuple[float, float] = (0, 1), steps: int = 100) -> float:
        """
        Defuzzify using the centroid method.

        Calculates the center of gravity of the combined fuzzy output.
        """
        if not memberships:
            return 0.5

        # Simple weighted average defuzzification
        total_weight = sum(memberships.values())
        if total_weight == 0:
            return 0.5

        # Map linguistic labels to positions on the output range
        label_positions = {
            "very_low": 0.1,
            "low": 0.25,
            "medium": 0.5,
            "high": 0.75,
            "very_high": 0.9,
            "not_important": 0.1,
            "slightly_important": 0.3,
            "important": 0.6,
            "very_important": 0.9,
            "small": 0.2,
            "large": 0.8,
        }

        weighted_sum = 0.0
        for label, degree in memberships.items():
            position = label_positions.get(label, 0.5)
            weighted_sum += position * degree

        return round(weighted_sum / total_weight, 4)

    def reason(
        self,
        crisp_inputs: Dict[str, float],
        user_priorities: Dict[str, float],
        facts: Dict[str, Any],
    ) -> FuzzyResult:
        """
        Run the complete fuzzy reasoning pipeline.

        1. Fuzzify crisp inputs
        2. Calculate preference scores
        3. Defuzzify outputs
        """
        # Step 1: Fuzzify inputs
        memberships = self.fuzzify_inputs(crisp_inputs)

        # Step 2: Calculate preference scores
        preference_scores = self.calculate_preference_scores(
            user_priorities, facts
        )

        # Step 3: Defuzzify key memberships
        defuzzified = {}
        for m in memberships:
            if m.memberships:
                defuzzified[m.variable] = self.defuzzify_centroid(m.memberships)

        return FuzzyResult(
            memberships=memberships,
            preference_scores=preference_scores,
            defuzzified_values=defuzzified,
        )

    def get_fuzzy_sets(self) -> Dict:
        """Return all fuzzy set definitions for visualization."""
        return self.fuzzy_sets
