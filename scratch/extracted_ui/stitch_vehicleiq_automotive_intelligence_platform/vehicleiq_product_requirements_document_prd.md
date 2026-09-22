# VEHICLEIQ — Product Requirements Document (PRD) & Engineering Brief
**Project Title:** VEHICLEIQ — Empirical Automotive Selection & Explainable Decision Support System  
**Academic Alignment:** Fundamentals of Artificial Intelligence (FAI) Capstone / Academic Decision Support Framework  
**Document Version:** 1.0.0-PROD  
**Target Release:** Q3 2024 / Academic Defense  
**Author / Principal:** AI Systems & Automotive Intelligence Group  

---

## 1. Executive Summary & Vision
**VEHICLEIQ** is a commercial-grade, explainable AI automotive decision intelligence platform designed to replace subjective marketing narratives and superficial car recommendation tools with rigorous, multi-paradigm artificial intelligence. 

While architected to meet and exceed academic criteria for **Fundamentals of Artificial Intelligence (FAI)**, the platform's visual execution, data density, and user experience reflect the standards of Tier-1 automotive brands, institutional fintech terminals (e.g., Bloomberg/FactSet), and modern AI software interfaces.

### Core Value Proposition
- **Multi-Paradigm Inference:** Combines deterministic knowledge representation, forward chaining rule evaluation, continuous fuzzy logic preference mapping, and Bayesian probabilistic belief updates into a unified ranking engine.
- **Explainable AI (XAI):** Every single vehicle recommendation provides an unbroken inference trace detailing exact rules triggered, membership degrees, evidentiary prior-to-posterior shifts, and honest real-world trade-offs.
- **Location-Aware Precision Economics:** Dynamically factors Indian multi-tier state registration road taxes, RTO charges, high-voltage charging density, and monsoon terrain parameters into the decision pipeline.

---

## 2. System Architecture & Separation of Concerns

The project maintains a strict boundary between the **React Presentation Layer** and the **Python / FastAPI Inference Engine**. Decision logic is never evaluated client-side.

```
┌──────────────────────────────────────────────────────────────────────────┐
│                   FRONTEND: REACT 18 + TYPESCRIPT + VITE                │
│  - State Management & Multi-Select Active Logic Matrix (AND / OR)        │
│  - Real-Time Command Palette (Ctrl + K) & Geo-Tax Calibration Selector   │
│  - Animated Inference Graph Visualizations & Radar Suitability Breakdowns │
│  - Explainable Reasoning Traces & Interactive FAI Lab HUD                │
└────────────────────────────────────┬─────────────────────────────────────┘
                                     │ JSON over HTTPS (REST API)
┌────────────────────────────────────▼─────────────────────────────────────┐
│                 BACKEND: FASTAPI (PYTHON 3.11+ ASYNC)                    │
│  ┌────────────────────────┐  ┌────────────────────────────────────────┐  │
│  │ Knowledge Representation│  │       Rule Engine (Forward Chaining)   │  │
│  │ (Ontology & Variant DB)│  │       - Pattern matching on facts      │  │
│  └───────────┬────────────┘  │       - Hard constraint qualification  │  │
│              │               └───────────────────┬────────────────────┘  │
│  ┌───────────▼────────────┐  ┌───────────────────▼────────────────────┐  │
│  │  Fuzzy Preference Model│  │      Bayesian Belief Network           │  │
│  │  - Triangular & Sigmoid│  │      - Prior probability updates       │  │
│  │  - Comfort, Sportiness │  │      - Posterior P(V_i | Evidence)     │  │
│  └───────────┬────────────┘  └───────────────────┬────────────────────┘  │
│              └─────────────────┬─────────────────┘                       │
│                                ▼                                         │
│                 Multi-Criteria Scoring & Ranking Engine                  │
│                                │                                         │
│                 Location-Aware Road Tax & TCO Calculator                 │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 3. FAI Academic Decision Paradigms

### 3.1. Knowledge Representation & Ontology
The vehicle universe is structured as an inheritance graph:
$$\text{Brand} \longrightarrow \text{Model Family} \longrightarrow \text{Model} \longrightarrow \text{Variant}$$
Attributes captured at variant level:
- Powertrain: `petrol`, `diesel`, `cng`, `mild_hybrid`, `strong_hybrid`, `phev`, `bev`
- Dynamic Specs: Peak Power (PS/kW), Torque (Nm), 0–100 km/h, Top Speed, Kerb Weight
- Dimension & Terrain: Ground Clearance (unladen/laden in mm), Water-wading depth, Approach/Departure angles
- Practicality: ISOFIX anchors, GNCAP / BNCAP crash safety star rating, Boot capacity (litres), Turning radius
- Regional Economics: Ex-factory price, Ex-showroom, State RTO Tax %, Insurance, Municipal charges

### 3.2. Forward Chaining Rule Engine
- **Working Memory (Facts):** User inputs (Budget threshold, passenger count, preferred powertrain, region).
- **Rule Base:** Production rules formatted as:
  $$\text{RULE } R_k: \text{IF } (c_1 \land c_2 \land \dots \land c_m) \implies \text{THEN } (\text{Action / Suitability Adjustment})$$
- *Example Activated Rule:*
  - `RULE F-017`: `IF (body_type == SUV) AND (seating_capacity >= 6) AND (min_ground_clearance >= 190mm) THEN (family_intercity_suitability = HIGH, boost = +14.5%)`

### 3.3. Fuzzy Logic Preference Engine
Accommodates non-binary, qualitative human requirements (e.g., *"comfortable ride with spirited overtaking capability"*).
- **Fuzzy Sets:** $\mu_{\text{Comfort}}(x)$, $\mu_{\text{Sportiness}}(x)$, $\mu_{\text{Economy}}(x)$, $\mu_{\text{UrbanAgility}}(x) \in [0, 1]$
- **Membership Formulations:** Standard triangular and trapezoidal membership functions parameterized against benchmark telemetry.
- **Defuzzification:** Centroid method mapping multi-variable fuzzy inputs into crisp multi-criteria utility scores.

### 3.4. Bayesian Reasoning Network
Handles uncertainty and evidence-weighted probabilistic qualification.
$$P(V_k \text{ optimal} \mid E) = \frac{P(E \mid V_k) \cdot P(V_k)}{\sum_{j=1}^{N} P(E \mid V_j) \cdot P(V_j)}$$
- Sequential updating:
  1. Base Prior $P(V_k)$ based on segment historical satisfaction data.
  2. Evidence $E_1$: Budget compliance.
  3. Evidence $E_2$: Powertrain & stop-go urban commute stress profile.
  4. Evidence $E_3$: Regional road conditions and monsoon submersion thresholds.

---

## 4. Feature Specifications & User Journeys

### 4.1. Core Screens & Navigation Architecture
1. **`/discover` — Empiric Vehicle Discovery & Recommendation Hub (Primary View)**
   - Guided Persona presets (*Urban Tech Pioneer*, *Intercity Family Strategist*, *Executive Performance*, *Apex Track & Weekend*).
   - Boolean Logic Matrix Visualizer displaying compound filter rules (`Brand: A OR B` $\land$ `Powertrain: C OR D`).
   - Algorithmic Match Results cards featuring real ex-showroom vs. on-road breakdown, AI match percentage, safety ratings, and highlighted real-world trade-offs.
2. **`/ai-reasoning` — AI Reasoning Lab & Interactive Inference HUD**
   - Sequential Forward Chaining trace graph with inspectable rule activation nodes.
   - Real-time membership curves for fuzzy preference modeling.
   - Dynamic Bayesian belief transition pipeline.
3. **`/compare` — Multi-Vehicle Benchmark Matrix**
   - Head-to-head comparison of up to 4 vehicles.
   - Automated AI Verdict detailing relative strengths and opportunity costs.
4. **`/knowledge-base` — Ontology Explorer**
   - Interactive tree exploration of the automotive knowledge base down to variant-specific engineering parameters.
5. **`/vehicle/:id` — Deep Dive Diagnostic Screen**
   - Radial radar suitability breakdown across 6 core dimensions: Budget, Performance, Practicality, Luxury, Location, and Powertrain.
   - Complete "Why this vehicle?" reasoning breakdown and telemetry logs.

### 4.2. Location-Aware Calibration Engine
- Integrated regional profiles (e.g., Bengaluru KA 18.87% luxury road tax vs. Delhi EV incentive vs. Mumbai octroi).
- Live urban constraint calculations: Urban crawl speed (14.8 km/h), high-voltage DC charger density per $10\text{km}^2$, and monsoon flood tolerance threshold.

---

## 5. API Interface Contract (FastAPI / OpenAPI Spec)

| Endpoint | Method | Payload Summary | Response Summary |
|---|---|---|---|
| `/api/v1/recommend` | `POST` | User preferences, budget, location, weights | Ranked vehicle candidates, Bayesian posteriors, match % |
| `/api/v1/reasoning/trace` | `POST` | `vehicle_id`, user fact set | Fired rule IDs, activation state, explanations |
| `/api/v1/fuzzy/evaluate` | `POST` | Qualitative sliders (comfort, sportiness) | Membership degrees $\mu(x)$, defuzzified scores |
| `/api/v1/pricing/calculate`| `POST` | `variant_id`, `state_code`, `city` | Ex-factory, GST, State RTO, cess, estimated on-road |
| `/api/v1/ontology/tree` | `GET` | Filter query / brand param | Hierarchical JSON ontology graph |

---

## 6. Engineering & Non-Functional Requirements
- **Performance:** Sub-100ms client-side filter updates; sub-300ms async API response for full Bayesian recalculation.
- **Visual Design Standard:** Autonomous Kinetic Intelligence design system with `#00f2fe` electric cyan, `#8b5cf6` violet accents, `#10131a` obsidian surface containers, and Plus Jakarta Sans / JetBrains Mono typography.
- **Fail-Safe Operation:** Dedicated offline demo-mode mock data layer that executes genuine forward-chaining and fuzzy algorithms in TypeScript if the FastAPI backend is offline.
- **Telemetry & Traceability:** Compliant with academic transparency standards; zero black-box scoring.
