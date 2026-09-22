"""
Forward Chaining Inference Engine

Implements a genuine forward-chaining inference system that:
1. Takes initial facts from user input
2. Matches rules against the current fact base
3. Fires applicable rules to derive new facts
4. Repeats until no new facts can be inferred (fixed-point)
5. Preserves a complete inference trace for explainability
"""
from typing import Any, Dict, List, Set, Tuple
from app.models.reasoning import (
    ForwardChainingResult,
    InferenceStep,
    Rule,
    RuleCondition,
    RuleConclusion,
)
import json
import os


class ForwardChainingEngine:
    """
    A rule-based forward chaining inference engine.

    The engine loads rules from the knowledge base and applies them
    iteratively to a set of facts until no new facts can be derived.
    """

    def __init__(self, rules: List[Rule] = None):
        self.rules: List[Rule] = rules or []
        self.facts: Dict[str, Any] = {}
        self.derived_facts: Dict[str, Any] = {}
        self.inference_trace: List[InferenceStep] = []
        self.fired_rules: Set[str] = set()
        self._initial_facts: Dict[str, Any] = {}

    def load_rules_from_file(self, filepath: str) -> None:
        """Load rules from a JSON file."""
        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)

        self.rules = []
        for rule_data in data.get("rules", []):
            rule = Rule(
                id=rule_data["id"],
                description=rule_data["description"],
                conditions=[
                    RuleCondition(**c) for c in rule_data["conditions"]
                ],
                conclusions=[
                    RuleConclusion(**c) for c in rule_data["conclusions"]
                ],
                priority=rule_data.get("priority", 1),
            )
            self.rules.append(rule)

        # Sort rules by priority (lower priority fires first)
        self.rules.sort(key=lambda r: r.priority)

    def set_facts(self, facts: Dict[str, Any]) -> None:
        """Set the initial fact base from user input."""
        self.facts = dict(facts)
        self._initial_facts = dict(facts)
        self.derived_facts = {}
        self.inference_trace = []
        self.fired_rules = set()

    def _evaluate_condition(self, condition: RuleCondition) -> bool:
        """Evaluate whether a single rule condition is satisfied."""
        fact_name = condition.fact
        if fact_name not in self.facts:
            return False

        fact_value = self.facts[fact_name]
        expected = condition.value
        op = condition.operator

        try:
            if op == "==":
                return fact_value == expected
            elif op == "!=":
                return fact_value != expected
            elif op == ">":
                return float(fact_value) > float(expected)
            elif op == "<":
                return float(fact_value) < float(expected)
            elif op == ">=":
                return float(fact_value) >= float(expected)
            elif op == "<=":
                return float(fact_value) <= float(expected)
            elif op == "in":
                if isinstance(expected, list):
                    return fact_value in expected
                return False
            else:
                return False
        except (ValueError, TypeError):
            return False

    def _match_rule(self, rule: Rule) -> bool:
        """Check if all conditions of a rule are satisfied by current facts."""
        return all(
            self._evaluate_condition(cond) for cond in rule.conditions
        )

    def _fire_rule(self, rule: Rule, iteration: int) -> bool:
        """
        Fire a rule: apply its conclusions to the fact base.
        Returns True if any new facts were derived.
        """
        new_facts_derived = False
        derived_fact_descriptions = []
        condition_descriptions = []

        # Record conditions matched
        for cond in rule.conditions:
            fact_val = self.facts.get(cond.fact, "?")
            condition_descriptions.append(
                f"{cond.fact} {cond.operator} {cond.value} (actual: {fact_val})"
            )

        # Apply conclusions
        for conclusion in rule.conclusions:
            fact_name = conclusion.fact
            fact_value = conclusion.value

            # Only derive if the fact doesn't already exist with the same value
            if fact_name not in self.facts or self.facts[fact_name] != fact_value:
                self.facts[fact_name] = fact_value
                self.derived_facts[fact_name] = fact_value
                new_facts_derived = True
                derived_fact_descriptions.append(
                    f"{fact_name} = {fact_value}"
                )

        if new_facts_derived:
            step = InferenceStep(
                rule_id=rule.id,
                rule_description=rule.description,
                conditions_matched=condition_descriptions,
                facts_derived=derived_fact_descriptions,
                iteration=iteration,
            )
            self.inference_trace.append(step)
            self.fired_rules.add(rule.id)

        return new_facts_derived

    def infer(self, max_iterations: int = 50) -> ForwardChainingResult:
        """
        Run forward chaining inference.

        Repeatedly matches and fires rules until:
        - No new facts can be derived (fixed-point reached), or
        - Maximum iterations exceeded (safety limit)

        Returns a ForwardChainingResult with full trace.
        """
        iteration = 0

        while iteration < max_iterations:
            iteration += 1
            new_fact_derived_this_iteration = False

            for rule in self.rules:
                # Skip rules that have already fired (prevent infinite loops)
                if rule.id in self.fired_rules:
                    continue

                if self._match_rule(rule):
                    if self._fire_rule(rule, iteration):
                        new_fact_derived_this_iteration = True

            # Fixed-point reached — no new facts derived
            if not new_fact_derived_this_iteration:
                break

        return ForwardChainingResult(
            initial_facts=dict(self._initial_facts),
            derived_facts=dict(self.derived_facts),
            all_facts=dict(self.facts),
            inference_trace=self.inference_trace,
            rules_fired=list(self.fired_rules),
            iterations=iteration,
        )

    def get_rules(self) -> List[Dict]:
        """Return all rules in a serializable format."""
        return [
            {
                "id": r.id,
                "description": r.description,
                "conditions": [
                    {"fact": c.fact, "operator": c.operator, "value": c.value}
                    for c in r.conditions
                ],
                "conclusions": [
                    {"fact": c.fact, "value": c.value}
                    for c in r.conclusions
                ],
                "priority": r.priority,
            }
            for r in self.rules
        ]
