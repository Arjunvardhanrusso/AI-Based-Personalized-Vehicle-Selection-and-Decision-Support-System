import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Layers, Activity, ShieldCheck, Zap, BatteryCharging, Flame, Fuel } from 'lucide-react';

interface LandingPageProps {
  demoMode: boolean;
}

export const LandingPage: React.FC<LandingPageProps> = () => {
  return (
    <div className="space-y-24 py-12 px-4 sm:px-6 max-w-6xl mx-auto">
      {/* Hero Section */}
      <div className="pt-8 sm:pt-16 pb-6 text-center space-y-8 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#161616] border border-white/[0.08] text-[#A3A3A3] text-xs font-mono tracking-wide">
          <span className="w-1.5 h-1.5 rounded-full bg-[#C86B3C]"></span>
          <span>Fundamentals of Artificial Intelligence • Academic Engine</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-[#F5F5F5] leading-[1.1]">
          Intelligent Vehicle Selection &amp; Decision Support
        </h1>

        <p className="text-[#A3A3A3] text-base sm:text-lg leading-relaxed max-w-2xl mx-auto font-normal">
          A multi-stage symbolic and probabilistic reasoning engine combining <span className="text-[#F5F5F5] font-medium">Forward Chaining</span> production rules, <span className="text-[#F5F5F5] font-medium">Fuzzy Logic</span> preferences, and <span className="text-[#F5F5F5] font-medium">Bayesian Inference</span> under uncertainty.
        </p>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
          <Link
            to="/questionnaire"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#C86B3C] hover:bg-[#D97745] text-white font-semibold text-sm transition-all shadow-[0_0_20px_rgba(200,107,60,0.3)] flex items-center justify-center gap-2"
          >
            <span>Start Decision Questionnaire</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/search"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#161616] hover:bg-[#1F1F1F] border border-[#C86B3C]/30 text-[#F5F5F5] font-medium text-sm transition-colors flex items-center justify-center gap-2"
          >
            <span>Search & Compare Variants</span>
          </Link>
          <Link
            to="/knowledge-base"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#161616] hover:bg-[#1F1F1F] border border-white/[0.08] text-[#A3A3A3] hover:text-[#F5F5F5] font-medium text-sm transition-colors flex items-center justify-center gap-2"
          >
            <span>Knowledge Base</span>
          </Link>
        </div>
      </div>

      {/* AI Concept Pillars - Clean, disciplined cards */}
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-white/[0.06] pb-4">
          <div>
            <h2 className="text-xl font-semibold text-[#F5F5F5]">Reasoning Architecture</h2>
            <p className="text-xs text-[#737373] mt-1">Multi-paradigm AI pipeline moving beyond deterministic database filters</p>
          </div>
          <span className="text-xs font-mono text-[#737373]">04 Inference Stages</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Pillar 1 */}
          <div className="bg-[#111111] border border-white/[0.06] rounded-2xl p-6 space-y-4 hover:border-[#C86B3C]/30 transition-colors flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-8 h-8 rounded-lg bg-[#161616] border border-white/[0.08] flex items-center justify-center text-[#C86B3C]">
                <Layers className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-[#F5F5F5]">Forward Chaining</h3>
              <p className="text-xs text-[#A3A3A3] leading-relaxed">
                Iteratively triggers production rules until a fixed-point is established, deriving higher-order facts such as usage intensity and price sensitivity.
              </p>
            </div>
            <div className="text-[11px] font-mono text-[#737373] pt-4 border-t border-white/[0.04]">
              38 Declarative Rules
            </div>
          </div>

          {/* Pillar 2 */}
          <div className="bg-[#111111] border border-white/[0.06] rounded-2xl p-6 space-y-4 hover:border-[#C86B3C]/30 transition-colors flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-8 h-8 rounded-lg bg-[#161616] border border-white/[0.08] flex items-center justify-center text-[#C86B3C]">
                <Activity className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-[#F5F5F5]">Fuzzy Logic</h3>
              <p className="text-xs text-[#A3A3A3] leading-relaxed">
                Maps continuous boundary variables (distance, budget) into trapezoidal membership sets, defuzzifying subjective user preferences via centroid estimation.
              </p>
            </div>
            <div className="text-[11px] font-mono text-[#737373] pt-4 border-t border-white/[0.04]">
              Trapezoidal Membership
            </div>
          </div>

          {/* Pillar 3 */}
          <div className="bg-[#111111] border border-white/[0.06] rounded-2xl p-6 space-y-4 hover:border-[#C86B3C]/30 transition-colors flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-8 h-8 rounded-lg bg-[#161616] border border-white/[0.08] flex items-center justify-center text-[#C86B3C]">
                <Zap className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-[#F5F5F5]">Bayesian Inference</h3>
              <p className="text-xs text-[#A3A3A3] leading-relaxed">
                Calculates posterior distributions across uncertain real-world parameters (charging access, fuel availability) with Shannon entropy quantification.
              </p>
            </div>
            <div className="text-[11px] font-mono text-[#737373] pt-4 border-t border-white/[0.04]">
              Belief Updating &amp; Entropy
            </div>
          </div>

          {/* Pillar 4 */}
          <div className="bg-[#111111] border border-white/[0.06] rounded-2xl p-6 space-y-4 hover:border-[#C86B3C]/30 transition-colors flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-8 h-8 rounded-lg bg-[#161616] border border-white/[0.08] flex items-center justify-center text-[#C86B3C]">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-[#F5F5F5]">Explainable AI (XAI)</h3>
              <p className="text-xs text-[#A3A3A3] leading-relaxed">
                Synthesizes human-interpretable justifications and transparent audit logs for each scoring decision without relying on static templates.
              </p>
            </div>
            <div className="text-[11px] font-mono text-[#737373] pt-4 border-t border-white/[0.04]">
              Auditable Decision Traces
            </div>
          </div>
        </div>
      </div>

      {/* Fuel Technologies Supported */}
      <div className="bg-[#111111] border border-white/[0.06] rounded-2xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.04] pb-4">
          <div>
            <h3 className="text-base font-semibold text-[#F5F5F5]">Powertrain Technologies Evaluated</h3>
            <p className="text-xs text-[#737373] mt-0.5">Comprehensive decision modeling covering all market powertrain segments</p>
          </div>
          <div className="text-xs font-mono text-[#737373]">29 Vehicles Benchmarked</div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="p-4 rounded-xl bg-[#161616] border border-white/[0.04] space-y-2">
            <div className="text-[#C86B3C]"><BatteryCharging className="w-4 h-4" /></div>
            <div className="text-xs font-semibold text-[#F5F5F5]">Electric (EV)</div>
            <div className="text-[11px] text-[#737373] leading-snug">Zero direct emissions, overnight home charging dependent.</div>
          </div>

          <div className="p-4 rounded-xl bg-[#161616] border border-white/[0.04] space-y-2">
            <div className="text-[#C86B3C]"><Zap className="w-4 h-4" /></div>
            <div className="text-xs font-semibold text-[#F5F5F5]">Strong Hybrid</div>
            <div className="text-[11px] text-[#737373] leading-snug">Self-charging electric assist with superior thermal efficiency.</div>
          </div>

          <div className="p-4 rounded-xl bg-[#161616] border border-white/[0.04] space-y-2">
            <div className="text-[#C86B3C]"><Flame className="w-4 h-4" /></div>
            <div className="text-xs font-semibold text-[#F5F5F5]">Petrol</div>
            <div className="text-[11px] text-[#737373] leading-snug">Lower acquisition cost, widespread accessibility, refined drive.</div>
          </div>

          <div className="p-4 rounded-xl bg-[#161616] border border-white/[0.04] space-y-2">
            <div className="text-[#C86B3C]"><Fuel className="w-4 h-4" /></div>
            <div className="text-xs font-semibold text-[#F5F5F5]">Diesel</div>
            <div className="text-[11px] text-[#737373] leading-snug">High torque delivery, exceptional long-distance highway economy.</div>
          </div>

          <div className="p-4 rounded-xl bg-[#161616] border border-white/[0.04] space-y-2">
            <div className="text-[#C86B3C]"><Fuel className="w-4 h-4" /></div>
            <div className="text-xs font-semibold text-[#F5F5F5]">CNG</div>
            <div className="text-[11px] text-[#737373] leading-snug">Economical operational cost for heavy urban driving patterns.</div>
          </div>
        </div>
      </div>
    </div>
  );
};
