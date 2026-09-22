import React, { useState } from 'react';
import type { RecommendationResponse } from '../types';
import { Layers, Activity, Zap, Info, ShieldCheck, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ReasoningPageProps {
  recommendation: RecommendationResponse | null;
  demoMode: boolean;
}

export const ReasoningPage: React.FC<ReasoningPageProps> = ({ recommendation }) => {
  const [activeTab, setActiveTab] = useState<'xai' | 'fc' | 'fuzzy' | 'bayesian'>('xai');

  if (!recommendation) {
    return (
      <div className="max-w-3xl mx-auto py-20 px-4 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-[#161616] border border-white/[0.08] flex items-center justify-center mx-auto text-[#8E8B85]">
          <Info className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-semibold text-[#EDEDEC]">No Inference Trace Available</h2>
        <p className="text-xs text-[#8E8B85]">Complete the decision questionnaire to generate an auditable multi-paradigm trace.</p>
        <Link
          to="/questionnaire"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#C86B3C] to-[#D97745] text-white text-xs font-semibold hover:from-[#D97745] hover:to-[#FF9D66] transition-all"
        >
          Start Decision Questionnaire
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    );
  }

  const { forward_chaining_result, fuzzy_result, bayesian_result, explanations, derived_facts, top_vehicles, vehicle_rankings } = recommendation;
  const topVehicle = (top_vehicles && top_vehicles[0]) || (vehicle_rankings && vehicle_rankings[0]);
  const rawScore = topVehicle?.score ?? 0;
  const topScore = rawScore <= 1.0 ? Math.min(100, Math.max(0, rawScore * 100)) : Math.min(100, Math.max(0, rawScore));

  return (
    <div className="max-w-5xl mx-auto py-12 px-4 sm:px-6 space-y-10">
      {/* Title Header */}
      <div className="space-y-2 border-b border-white/[0.06] pb-6">
        <div className="text-xs font-mono uppercase text-[#FF9D66] tracking-wider">
          Explainable AI (XAI) &amp; Decision Audit Deck
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#EDEDEC]">
          Why These Vehicles Were Recommended
        </h1>
        <p className="text-xs sm:text-sm text-[#8E8B85] max-w-2xl leading-relaxed">
          Transparent, human-readable rationale grounded in multi-paradigm AI: expert production rules, Mamdani fuzzy logic, and Bayesian belief updating.
        </p>
      </div>

      {/* Top Recommended Vehicle Rationale Spotlight Card */}
      {topVehicle && (
        <div className="bg-[#111111] border border-[#C86B3C]/40 rounded-2xl p-6 sm:p-8 space-y-5 relative overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#C86B3C]/10 to-transparent rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-5">
            <div>
              <span className="text-[11px] font-mono uppercase text-[#FF9D66] tracking-widest">
                #1 Top Matched Vehicle
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-[#EDEDEC] mt-0.5">
                {topVehicle.brand} {topVehicle.model_name || topVehicle.name} {topVehicle.variant_name || ''}
              </h2>
              <div className="flex items-center gap-2 mt-1 text-xs text-[#8E8B85]">
                <span className="uppercase font-mono">{topVehicle.fuel_type}</span>
                <span>•</span>
                <span>{topVehicle.segment || 'Segment'}</span>
                <span>•</span>
                <span>{topVehicle.is_used ? 'Listed Price: ' : 'Ex-Showroom: '}₹{(topVehicle.price_inr / 100000).toFixed(2)} Lakh</span>
              </div>
            </div>

            <div className="shrink-0 bg-[#161616] border border-[#C86B3C]/30 rounded-xl px-5 py-3 text-center">
              <div className="text-2xl font-mono font-bold text-[#FF9D66]">{topScore.toFixed(1)}%</div>
              <div className="text-[10px] font-mono uppercase text-[#8E8B85] tracking-wider">Overall Fit Score</div>
            </div>
          </div>

          {/* Key Factor Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <span className="text-xs font-mono uppercase text-[#32D583] flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Primary Decision Drivers
              </span>
              <ul className="space-y-1.5">
                {topVehicle.positive_factors?.slice(0, 3).map((factor, idx) => (
                  <li key={idx} className="text-xs text-[#EDEDEC] bg-[#161616] p-2.5 rounded-lg border border-white/[0.04]">
                    {factor}
                  </li>
                )) || <li className="text-xs text-[#8E8B85]">Strong performance across prioritized categories.</li>}
              </ul>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-mono uppercase text-[#E5A93C] flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                Trade-offs &amp; Considerations
              </span>
              <ul className="space-y-1.5">
                {topVehicle.negative_factors?.slice(0, 3).map((factor, idx) => (
                  <li key={idx} className="text-xs text-[#EDEDEC] bg-[#161616] p-2.5 rounded-lg border border-white/[0.04]">
                    {factor}
                  </li>
                )) || <li className="text-xs text-[#8E8B85]">No significant negative constraints identified.</li>}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-white/[0.06] space-x-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab('xai')}
          className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'xai'
              ? 'border-[#C86B3C] text-[#EDEDEC] bg-[#161616]'
              : 'border-transparent text-[#8E8B85] hover:text-[#EDEDEC]'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>01. Synthesized Rationale (Human-First)</span>
        </button>

        <button
          onClick={() => setActiveTab('fc')}
          className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'fc'
              ? 'border-[#C86B3C] text-[#EDEDEC] bg-[#161616]'
              : 'border-transparent text-[#8E8B85] hover:text-[#EDEDEC]'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>02. Forward Chaining ({forward_chaining_result.rules_fired.length} Rules)</span>
        </button>

        <button
          onClick={() => setActiveTab('fuzzy')}
          className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'fuzzy'
              ? 'border-[#C86B3C] text-[#EDEDEC] bg-[#161616]'
              : 'border-transparent text-[#8E8B85] hover:text-[#EDEDEC]'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>03. Fuzzy Defuzzification</span>
        </button>

        <button
          onClick={() => setActiveTab('bayesian')}
          className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'bayesian'
              ? 'border-[#C86B3C] text-[#EDEDEC] bg-[#161616]'
              : 'border-transparent text-[#8E8B85] hover:text-[#EDEDEC]'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>04. Bayesian Uncertainty</span>
        </button>
      </div>

      {/* Tab 1: Human-First Explanations */}
      {activeTab === 'xai' && (
        <div className="space-y-4">
          <div className="text-xs font-mono uppercase text-[#8E8B85] tracking-wider">
            Sequential Pipeline Rationale
          </div>
          {explanations.map((exp, idx) => (
            <div key={idx} className="bg-[#111111] border border-white/[0.08] rounded-xl p-5 space-y-2 hover:border-[#C86B3C]/30 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase text-[#FF9D66]">
                  Stage: {exp.stage}
                </span>
                <span className="text-[10px] font-mono text-[#8E8B85]">Step 0{idx + 1}</span>
              </div>
              <h3 className="text-sm font-semibold text-[#EDEDEC]">{exp.title}</h3>
              <p className="text-xs text-[#8E8B85] leading-relaxed whitespace-pre-line">{exp.detail}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Forward Chaining */}
      {activeTab === 'fc' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-[#111111] border border-white/[0.08] rounded-xl p-4 space-y-1">
              <div className="text-xs text-[#8E8B85]">Iterations to Fixed-Point</div>
              <div className="text-2xl font-bold text-[#EDEDEC] font-mono">{forward_chaining_result.iterations}</div>
            </div>
            <div className="bg-[#111111] border border-white/[0.08] rounded-xl p-4 space-y-1">
              <div className="text-xs text-[#8E8B85]">Production Rules Fired</div>
              <div className="text-2xl font-bold text-[#FF9D66] font-mono">{forward_chaining_result.rules_fired.length}</div>
            </div>
            <div className="bg-[#111111] border border-white/[0.08] rounded-xl p-4 space-y-1">
              <div className="text-xs text-[#8E8B85]">Derived Assertions</div>
              <div className="text-2xl font-bold text-[#EDEDEC] font-mono">{Object.keys(derived_facts).length}</div>
            </div>
          </div>

          {/* Derived Facts Summary */}
          <div className="bg-[#111111] border border-white/[0.08] rounded-xl p-6 space-y-3">
            <div className="text-xs font-mono uppercase text-[#8E8B85] tracking-wider">Derived Fact Store</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {Object.entries(derived_facts).map(([k, v]) => (
                <div key={k} className="p-2.5 rounded-lg bg-[#161616] border border-white/[0.04] space-y-1">
                  <div className="text-[10px] text-[#8E8B85] font-mono truncate" title={k}>{k}</div>
                  <div className="text-xs font-medium text-[#FF9D66] font-mono truncate" title={String(v)}>{String(v)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Inference Step Trace */}
          <div className="bg-[#111111] border border-white/[0.08] rounded-xl p-6 space-y-4">
            <div className="text-xs font-mono uppercase text-[#8E8B85] tracking-wider">Production Rule Firing Log</div>
            <div className="space-y-3">
              {forward_chaining_result.inference_trace.map((step, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-[#161616] border border-white/[0.04] space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-medium text-[#EDEDEC]">{step.rule_id}: {step.rule_description}</span>
                    <span className="px-2 py-0.5 rounded bg-[#111111] text-[#8E8B85] font-mono text-[10px]">
                      Iteration {step.iteration}
                    </span>
                  </div>

                  <div className="text-xs text-[#8E8B85] grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-white/[0.04]">
                    <div>
                      <span className="text-[10px] text-[#8E8B85] font-mono">Matched Preconditions:</span>
                      <pre className="text-[11px] text-[#8E8B85] font-mono bg-[#0A0A0A] p-2 rounded mt-1 overflow-x-auto border border-white/[0.04]">
                        {JSON.stringify(step.conditions_matched, null, 2)}
                      </pre>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#8E8B85] font-mono">Inferred Postconditions:</span>
                      <pre className="text-[11px] text-[#32D583] font-mono bg-[#0A0A0A] p-2 rounded mt-1 overflow-x-auto border border-white/[0.04]">
                        {JSON.stringify(step.facts_derived, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Fuzzy Logic */}
      {activeTab === 'fuzzy' && (
        <div className="space-y-6">
          <div className="bg-[#111111] border border-white/[0.08] rounded-xl p-6 space-y-4">
            <div className="text-xs font-mono uppercase text-[#8E8B85] tracking-wider">Crisp-to-Fuzzy Membership Degrees</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {fuzzy_result.memberships.map((m) => (
                <div key={m.variable} className="p-4 rounded-xl bg-[#161616] border border-white/[0.04] space-y-2.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-[#EDEDEC] font-mono">{m.variable}</span>
                    <span className="text-[#8E8B85] font-mono text-[11px]">Crisp: {m.crisp_value}</span>
                  </div>
                  <div className="space-y-1.5">
                    {Object.entries(m.memberships).map(([set, mu]) => (
                      <div key={set} className="flex items-center justify-between text-xs">
                        <span className="text-[#8E8B85] capitalize">{set}:</span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-[#0A0A0A] h-1.5 rounded-full overflow-hidden border border-white/[0.04]">
                            <div
                              className="bg-gradient-to-r from-[#C86B3C] to-[#FF9D66] h-full"
                              style={{ width: `${mu * 100}%` }}
                            ></div>
                          </div>
                          <span className="font-mono text-[#EDEDEC] text-[11px] w-8 text-right">{(mu).toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#111111] border border-white/[0.08] rounded-xl p-6 space-y-3">
            <div className="text-xs font-mono uppercase text-[#8E8B85] tracking-wider">Centroid Defuzzified Weights</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {Object.entries(fuzzy_result.preference_scores).map(([k, v]) => (
                <div key={k} className="p-3 rounded-lg bg-[#161616] border border-white/[0.04] space-y-1">
                  <div className="text-[10px] text-[#8E8B85] capitalize">{k.replace('priority_', '')}</div>
                  <div className="text-sm font-semibold text-[#FF9D66] font-mono">{(v * 100).toFixed(1)}%</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Bayesian */}
      {activeTab === 'bayesian' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bayesian_result.nodes.map((node) => (
              <div key={node.node_name} className="bg-[#111111] border border-white/[0.08] rounded-xl p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-sm font-semibold text-[#EDEDEC] capitalize">{node.node_name.replace(/_/g, ' ')}</h3>
                    <p className="text-xs text-[#8E8B85]">{node.description}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-[#161616] border border-[#C86B3C]/30 text-[#FF9D66] text-[10px] font-mono font-medium uppercase">
                    {node.dominant_state}
                  </span>
                </div>

                {/* Prior vs Posterior */}
                <div className="space-y-2 pt-2 border-t border-white/[0.04]">
                  <div className="text-[11px] font-mono text-[#8E8B85] flex justify-between">
                    <span>State</span>
                    <span>Prior → Posterior</span>
                  </div>
                  {Object.keys(node.posterior).map((state) => {
                    const priorVal = node.prior[state] || 0;
                    const postVal = node.posterior[state] || 0;
                    return (
                      <div key={state} className="flex justify-between items-center text-xs">
                        <span className="capitalize text-[#8E8B85]">{state}</span>
                        <div className="font-mono text-xs flex items-center gap-2">
                          <span className="text-[#697386]">{(priorVal * 100).toFixed(0)}%</span>
                          <span className="text-[#697386]">→</span>
                          <span className="text-[#EDEDEC] font-medium">{(postVal * 100).toFixed(1)}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Evidence Applied & Entropy */}
                <div className="text-xs text-[#8E8B85] pt-2 border-t border-white/[0.04] space-y-1">
                  <div><strong>Evidence Applied:</strong> {node.evidence_applied.join(', ') || 'None'}</div>
                  <div><strong>Shannon Entropy Uncertainty:</strong> {(node.uncertainty_level * 100).toFixed(1)}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
