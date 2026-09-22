"""
Pydantic models for reasoning data — facts, rules, traces, and engine outputs.
"""
from pydantic import BaseModel, Field
from typing import Any, Dict, List, Optional


class Fact(BaseModel):
    """A single fact in the knowledge base."""
    name: str
    value: Any
    source: str = "user_input"  # user_input, derived, default
    confidence: float = 1.0  # 0-1


class RuleCondition(BaseModel):
    """A single condition in a rule."""
    fact: str
    operator: str  # ==, !=, >, <, >=, <=, in
    value: Any


class RuleConclusion(BaseModel):
    """A conclusion derived by firing a rule."""
    fact: str
    value: Any


class Rule(BaseModel):
    """A forward chaining rule."""
    id: str
    description: str
    conditions: List[RuleCondition]
    conclusions: List[RuleConclusion]
    priority: int = 1


class InferenceStep(BaseModel):
    """A single step in the inference trace."""
    rule_id: str
    rule_description: str
    conditions_matched: List[str]
    facts_derived: List[str]
    iteration: int


class ForwardChainingResult(BaseModel):
    """Output of the forward chaining engine."""
    initial_facts: Dict[str, Any]
    derived_facts: Dict[str, Any]
    all_facts: Dict[str, Any]
    inference_trace: List[InferenceStep]
    rules_fired: List[str]
    iterations: int


class FuzzyMembership(BaseModel):
    """Fuzzy membership values for a variable."""
    variable: str
    crisp_value: float
    memberships: Dict[str, float]  # e.g. {"low": 0.3, "medium": 0.7}


class FuzzyResult(BaseModel):
    """Output of the fuzzy reasoning engine."""
    memberships: List[FuzzyMembership]
    preference_scores: Dict[str, float]
    defuzzified_values: Dict[str, float]


class BayesianNode(BaseModel):
    """Result for a single Bayesian inference node."""
    node_name: str
    description: str
    prior: Dict[str, float]
    evidence_applied: List[str]
    posterior: Dict[str, float]
    dominant_state: str
    uncertainty_level: float  # entropy-based


class BayesianResult(BaseModel):
    """Output of the Bayesian reasoning engine."""
    nodes: List[BayesianNode]
    explanations: List[str]


class ReasoningExplanation(BaseModel):
    """A single explanation entry."""
    stage: str  # forward_chaining, fuzzy, bayesian, scoring
    title: str
    detail: str
    data: Optional[Dict[str, Any]] = None


class CategoryScore(BaseModel):
    """Score for a vehicle category (EV, Hybrid, Petrol, Diesel)."""
    category: str
    score: float  # 0-100
    component_scores: Dict[str, float]
    positive_factors: List[str]
    negative_factors: List[str]


class RecommendationResponse(BaseModel):
    """Complete response from the recommendation engine."""
    # Category-level results
    category_scores: List[CategoryScore]

    # Vehicle-level results
    vehicle_rankings: List[dict]
    top_vehicles: List[dict]

    # AI reasoning data
    user_profile_summary: Dict[str, Any]
    derived_facts: Dict[str, Any]
    forward_chaining_result: ForwardChainingResult
    fuzzy_result: FuzzyResult
    bayesian_result: BayesianResult
    explanations: List[ReasoningExplanation]

    # Meta
    conflicts: List[str] = Field(default_factory=list)
    disclaimer: str = "This system provides an AI-based suitability assessment for academic and decision-support purposes. It does not replace professional automotive, financial, or technical advice."
