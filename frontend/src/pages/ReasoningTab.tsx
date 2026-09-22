import React, { useState } from 'react';
import { 
  ChevronDown, 
  ChevronUp,
  ShieldCheck,
  TrendingUp,
  Scale,
  Cpu
} from 'lucide-react';

interface ReasoningTabProps {
  onLogTelemetry: (msg: string) => void;
}

export const ReasoningTab: React.FC<ReasoningTabProps> = ({ onLogTelemetry }) => {
  const [openRules, setOpenRules] = useState<Record<string, boolean>>({
    rule1: true,
    rule2: false,
    rule3: false
  });

  const [fuzzyBias, setFuzzyBias] = useState<number>(50);

  const toggleRule = (ruleKey: string) => {
    setOpenRules(prev => ({ ...prev, [ruleKey]: !prev[ruleKey] }));
  };

  let muCity = 0;
  let muBalanced = 0;
  let muHighway = 0;

  if (fuzzyBias <= 50) {
    muCity = (50 - fuzzyBias) / 50;
    muBalanced = fuzzyBias / 50;
    muHighway = 0;
  } else {
    muCity = 0;
    muBalanced = (100 - fuzzyBias) / 50;
    muHighway = (fuzzyBias - 50) / 50;
  }

  const indicatorX = 20 + (fuzzyBias / 100) * 260;

  const pipelineSteps = [
    { num: '01', code: 'INGEST', label: 'User Profile & City' },
    { num: '02', code: 'TAX_GEO', label: 'RTO & Tax Schedules' },
    { num: '03', code: 'HARD_FILTER', label: 'Budget/Seating Prune' },
    { num: '04', code: 'FORWARD_CHAIN', label: 'Rule Base Exec' },
    { num: '05', code: 'MAMDANI_FUZZY', label: 'Continuous Sets' },
    { num: '06', code: 'BAYESIAN_UPDATE', label: 'Prior → Posterior' },
    { num: '07', code: 'SENSITIVITY', label: 'Weight Perturbation' },
    { num: '08', code: 'RANKED_OUTPUT', label: 'Final Pareto Deck' }
  ];

  return (
    <div className="flex flex-col w-full px-4 lg:px-10 py-6 gap-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full bg-viq-secondary-container/25 text-viq-secondary-fixed font-mono text-xs font-semibold border border-viq-secondary-container/40">
            EXPLAINABLE AI ENGINE
          </span>
          <span className="text-viq-outline font-mono text-xs">
            TRANSPARENT DECISION SUPPORT
          </span>
        </div>
        <h1 className="font-jakarta text-2xl lg:text-3xl font-extrabold text-viq-primary">
          How VehicleIQ Thinks &amp; Recommends
        </h1>
        <p className="font-jakarta text-sm text-viq-on-surface-variant max-w-4xl leading-relaxed">
          Unlike opaque algorithms, VehicleIQ explains every vehicle recommendation using verified engineering domain rules, continuous fuzzy membership logic, and regional road tax optimization.
        </p>
      </div>

      {/* SIMPLIFIED USER VIEW: Core Pillars of AI Recommendations */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-viq-surface-container-low p-6 rounded-2xl border border-viq-outline-variant/30 flex flex-col gap-3 shadow-lg">
          <div className="w-10 h-10 rounded-xl bg-viq-primary-container/20 text-viq-primary-container flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="font-jakarta text-base font-bold text-viq-primary">
            1. Structural Safety &amp; Terrain Guardrails
          </h3>
          <p className="font-jakarta text-xs text-viq-on-surface-variant leading-relaxed">
            Rule-based forward chaining checks Global NCAP ratings, ground clearance for monsoon wading, and cabin air intake position before suggesting any vehicle for high-flood or highway regions.
          </p>
        </div>

        <div className="bg-viq-surface-container-low p-6 rounded-2xl border border-viq-outline-variant/30 flex flex-col gap-3 shadow-lg">
          <div className="w-10 h-10 rounded-xl bg-viq-tertiary-container/20 text-viq-tertiary-fixed flex items-center justify-center">
            <Scale className="w-5 h-5" />
          </div>
          <h3 className="font-jakarta text-base font-bold text-viq-primary">
            2. Regional Tax &amp; On-Road TCO Optimization
          </h3>
          <p className="font-jakarta text-xs text-viq-on-surface-variant leading-relaxed">
            State-specific road tax rates (e.g. Karnataka RTO 18.87% vs Delhi EV exemptions) are dynamically integrated to calculate true 5-year Total Cost of Ownership (TCO).
          </p>
        </div>

        <div className="bg-viq-surface-container-low p-6 rounded-2xl border border-viq-outline-variant/30 flex flex-col gap-3 shadow-lg">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
          <h3 className="font-jakarta text-base font-bold text-viq-primary">
            3. Continuous Fuzzy Driving Needs
          </h3>
          <p className="font-jakarta text-xs text-viq-on-surface-variant leading-relaxed">
            Instead of hard cutoffs, Mamdani fuzzy logic models smooth transitions between city commuting, mixed usage, and long-distance highway cruising based on your daily mileage.
          </p>
        </div>
      </div>

      {/* COLLAPSIBLE TECHNICAL DETAILS SECTION */}
      <details className="bg-viq-surface-container-lowest rounded-2xl border border-viq-outline-variant/40 overflow-hidden group">
        <summary className="p-5 bg-viq-surface-container-low hover:bg-viq-surface-container transition-colors cursor-pointer flex items-center justify-between font-jakarta text-sm font-bold text-viq-primary select-none">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-viq-secondary-container/20 text-viq-secondary-fixed">
              <Cpu className="w-4 h-4" />
            </div>
            <span>Inspect Deep Technical Reasoning &amp; Mathematical Matrix (8-Stage Pipeline, Rules, Fuzzy Graphs, Bayesian Priors)</span>
          </div>
          <span className="font-mono text-xs text-viq-outline group-open:rotate-180 transition-transform">
            ▼ Click to expand / collapse
          </span>
        </summary>

        <div className="p-6 flex flex-col gap-6 border-t border-viq-outline-variant/30 bg-viq-surface-container-low/50">

          {/* Sequential 8-Stage Inference Pipeline */}
          <div className="bg-viq-surface-container-low rounded-2xl p-4 lg:p-6 border border-viq-outline-variant/30">
            <span className="font-mono text-xs text-viq-primary uppercase tracking-wider mb-3 block font-semibold">
              Sequential 8-Stage Inference Pipeline
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
              {pipelineSteps.map((step) => (
                <div
                  key={step.num}
                  className="bg-viq-surface-container p-2.5 rounded-xl border border-viq-outline-variant/30 flex flex-col items-center text-center hover:border-viq-primary-container/40 transition-colors"
                >
                  <span className="font-mono text-xs font-bold text-viq-primary-container">
                    {step.num}. {step.code}
                  </span>
                  <span className="text-[10px] font-jakarta text-viq-on-surface-variant mt-1">
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Active Production Rules */}
            <div className="lg:col-span-6 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="font-jakarta text-lg font-bold text-viq-primary">
                  Active Production Rules (Forward Chaining)
                </h2>
                <span className="font-mono text-xs text-viq-tertiary-fixed">
                  28 Rules Fired
                </span>
              </div>

              <div className="bg-viq-surface-container-low rounded-xl border border-viq-outline-variant/30 overflow-hidden">
                <button
                  onClick={() => toggleRule('rule1')}
                  className="w-full p-4 flex items-center justify-between text-left hover:bg-viq-surface-container transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 rounded font-mono text-xs font-bold bg-viq-tertiary-container/15 text-viq-tertiary-fixed border border-viq-tertiary-fixed/30">
                      RULE_F017
                    </span>
                    <span className="font-jakarta text-sm font-bold text-viq-on-surface">
                      Monsoon Underpass Submersion Guard
                    </span>
                  </div>
                  {openRules.rule1 ? <ChevronUp className="w-4 h-4 text-viq-outline" /> : <ChevronDown className="w-4 h-4 text-viq-outline" />}
                </button>

                {openRules.rule1 && (
                  <div className="p-4 pt-0 font-mono text-xs flex flex-col gap-2 border-t border-viq-outline-variant/20 bg-viq-surface-container-lowest/50">
                    <div className="bg-viq-surface-container p-3 rounded-lg text-viq-primary leading-relaxed">
                      <span className="text-viq-outline">// Preconditions:</span><br />
                      <span className="text-[#FF9D66] font-bold">IF</span> (City == 'BLR' OR City == 'MAA') <br />
                      <span className="text-[#FF9D66] font-bold">AND</span> (User.PrimaryUse == 'CityCommute') <br />
                      <span className="text-[#FF9D66] font-bold">AND</span> (Vehicle.GroundClearance &lt; 180mm) <br />
                      <span className="text-amber-400">THEN</span> ApplyPenalty(Weight = 0.85, Tag = 'HYDRO_LOCK_RISK')
                    </div>
                    <p className="font-jakarta text-xs text-viq-on-surface-variant">
                      <strong>Rationale:</strong> Bangalore Outer Ring Road and Chennai arterial corridors experience seasonal waterlogging exceeding 150mm. Low-slung sedans suffer hydraulic lock risks.
                    </p>
                  </div>
                )}
              </div>

              <div className="bg-viq-surface-container-low rounded-xl border border-viq-outline-variant/30 overflow-hidden">
                <button
                  onClick={() => toggleRule('rule2')}
                  className="w-full p-4 flex items-center justify-between text-left hover:bg-viq-surface-container transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 rounded font-mono text-xs font-bold bg-viq-primary-container/15 text-viq-primary-fixed border border-viq-primary-container/30">
                      RULE_F024
                    </span>
                    <span className="font-jakarta text-sm font-bold text-viq-on-surface">
                      Delhi / Tamil Nadu Zero EV Road Tax Offset
                    </span>
                  </div>
                  {openRules.rule2 ? <ChevronUp className="w-4 h-4 text-viq-outline" /> : <ChevronDown className="w-4 h-4 text-viq-outline" />}
                </button>

                {openRules.rule2 && (
                  <div className="p-4 pt-0 font-mono text-xs flex flex-col gap-2 border-t border-viq-outline-variant/20 bg-viq-surface-container-lowest/50">
                    <div className="bg-viq-surface-container p-3 rounded-lg text-viq-primary leading-relaxed">
                      <span className="text-viq-outline">// Preconditions:</span><br />
                      <span className="text-[#FF9D66] font-bold">IF</span> (Vehicle.Powertrain == 'Electric') <br />
                      <span className="text-[#FF9D66] font-bold">AND</span> (City IN ['DEL', 'MAA']) <br />
                      <span className="text-amber-400">THEN</span> OverrideRTO(Rate = 0.00), GrantSubsidy(INR = 50000)
                    </div>
                    <p className="font-jakarta text-xs text-viq-on-surface-variant">
                      <strong>Rationale:</strong> State governments in Delhi and Tamil Nadu waive 100% of motor vehicle registration taxes on zero-emission battery EVs.
                    </p>
                  </div>
                )}
              </div>

              <div className="bg-viq-surface-container-low rounded-xl border border-viq-outline-variant/30 overflow-hidden">
                <button
                  onClick={() => toggleRule('rule3')}
                  className="w-full p-4 flex items-center justify-between text-left hover:bg-viq-surface-container transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 rounded font-mono text-xs font-bold bg-[#C86B3C]/15 text-[#FF9D66] border border-[#C86B3C]/30">
                      RULE_F039
                    </span>
                    <span className="font-jakarta text-sm font-bold text-viq-on-surface">
                      High Daily Run EV TCO Inflection Point
                    </span>
                  </div>
                  {openRules.rule3 ? <ChevronUp className="w-4 h-4 text-viq-outline" /> : <ChevronDown className="w-4 h-4 text-viq-outline" />}
                </button>

                {openRules.rule3 && (
                  <div className="p-4 pt-0 font-mono text-xs flex flex-col gap-2 border-t border-viq-outline-variant/20 bg-viq-surface-container-lowest/50">
                    <div className="bg-viq-surface-container p-3 rounded-lg text-viq-primary leading-relaxed">
                      <span className="text-viq-outline">// Preconditions:</span><br />
                      <span className="text-[#FF9D66] font-bold">IF</span> (User.DailyDistanceKm &gt;= 50) <br />
                      <span className="text-[#FF9D66] font-bold">AND</span> (User.PriorityRunningCost &gt;= 0.7) <br />
                      <span className="text-amber-400">THEN</span> BoostScore(EV_Hybrid = +0.25)
                    </div>
                    <p className="font-jakarta text-xs text-viq-on-surface-variant">
                      <strong>Rationale:</strong> Beyond 18,000 km annually, EV electricity running cost (₹1.20/km) offsets higher battery acquisition capital over a 5-year TCO horizon.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Continuous Fuzzy & Bayesian Lab */}
            <div className="lg:col-span-6 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="font-jakarta text-lg font-bold text-viq-primary">
                  Continuous Fuzzy &amp; Bayesian Lab
                </h2>
                <span className="font-mono text-xs text-viq-secondary-fixed">
                  Real-time Mathematical Visualizer
                </span>
              </div>

              <div className="bg-viq-surface-container-low rounded-xl p-4 border border-viq-outline-variant/30 flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <span className="font-mono text-xs font-bold text-viq-on-surface uppercase">
                    Mamdani Triangular Fuzzy Sets (Daily Distance)
                  </span>
                  <span className="font-mono text-xs text-viq-primary-container font-bold">
                    Value: {fuzzyBias} km/day
                  </span>
                </div>

                <input
                  type="range"
                  min={0}
                  max={100}
                  value={fuzzyBias}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setFuzzyBias(val);
                    onLogTelemetry(`FUZZY_INPUT: Shifted membership vector to [City: ${muCity.toFixed(2)}, Balanced: ${muBalanced.toFixed(2)}, Highway: ${muHighway.toFixed(2)}]`);
                  }}
                  className="w-full accent-viq-primary-container cursor-pointer"
                />

                <div className="relative h-32 w-full bg-viq-surface-container rounded-lg p-2 border border-viq-outline-variant/30">
                  <svg className="w-full h-full" viewBox="0 0 300 100">
                    <polygon points="20,80 20,20 150,80" fill="rgba(0, 242, 254, 0.15)" stroke="#00dce6" strokeWidth="1.5" />
                    <polygon points="20,80 150,20 280,80" fill="rgba(239, 219, 255, 0.15)" stroke="#dcb8ff" strokeWidth="1.5" />
                    <polygon points="150,80 280,20 280,80" fill="rgba(111, 251, 190, 0.15)" stroke="#6ffbbe" strokeWidth="1.5" />

                    <line x1={indicatorX} y1={10} x2={indicatorX} y2={85} stroke="#ffffff" strokeWidth="2" strokeDasharray="3 3" />
                    <circle cx={indicatorX} cy={45} r="4" fill="#00f2fe" />
                  </svg>
                </div>

                <div className="grid grid-cols-3 gap-2 font-mono text-xs text-center">
                  <div className="bg-viq-surface-container p-2 rounded border border-viq-outline-variant/30">
                    <span className="text-viq-outline block text-[10px]">μ(City Short)</span>
                    <span className="text-viq-primary-container font-bold">{muCity.toFixed(2)}</span>
                  </div>
                  <div className="bg-viq-surface-container p-2 rounded border border-viq-outline-variant/30">
                    <span className="text-viq-outline block text-[10px]">μ(Balanced Metro)</span>
                    <span className="text-viq-secondary-fixed font-bold">{muBalanced.toFixed(2)}</span>
                  </div>
                  <div className="bg-viq-surface-container p-2 rounded border border-viq-outline-variant/30">
                    <span className="text-viq-outline block text-[10px]">μ(Intercity Highway)</span>
                    <span className="text-viq-tertiary-fixed font-bold">{muHighway.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-viq-surface-container-low rounded-xl p-4 border border-viq-outline-variant/30 flex flex-col gap-3 font-mono text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-viq-on-surface uppercase">
                    Bayesian Prior-to-Posterior Parameter Updates
                  </span>
                  <span className="text-viq-tertiary-fixed font-bold">P(H|E) = 0.948</span>
                </div>

                <div className="bg-viq-surface-container p-3 rounded-lg flex flex-col gap-2 border border-viq-outline-variant/30">
                  <div className="flex justify-between">
                    <span className="text-viq-outline">Prior Belief P(Match):</span>
                    <span className="text-viq-on-surface">0.420 (Uniform across segment)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-viq-outline">Evidence P(Ground Clearance &gt; 200mm | Terrain):</span>
                    <span className="text-viq-primary-fixed">0.890 (High confidence)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-viq-outline">Likelihood P(NCAP 5-Star | Family Safety):</span>
                    <span className="text-viq-tertiary-fixed">0.965 (GNCAP audited)</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-viq-outline-variant/20 font-bold">
                    <span className="text-viq-primary">Normalized Posterior P(Suitability | UserTelemetry):</span>
                    <span className="text-viq-primary-container">0.948 (Rank #1)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </details>
    </div>
  );
};
