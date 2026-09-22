import React from 'react';

export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 space-y-10">
      <div className="space-y-2 border-b border-white/[0.06] pb-6">
        <div className="text-xs font-mono uppercase text-[#C86B3C] tracking-wider font-semibold">
          Academic Documentation
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F5F5F5]">
          VehicleIQ Architecture &amp; Methodology
        </h1>
        <p className="text-xs sm:text-sm text-[#A3A3A3] max-w-xl leading-relaxed">
          Engineered for the Fundamentals of Artificial Intelligence course, integrating declarative knowledge representation, forward chaining rule inference, fuzzy set defuzzification, and Bayesian belief updating.
        </p>
      </div>

      <div className="bg-[#111111] border border-white/[0.06] rounded-2xl p-6 sm:p-8 space-y-6">
        <h2 className="text-base font-semibold text-[#F5F5F5] border-b border-white/[0.04] pb-3">
          Core AI Paradigms Demonstrated
        </h2>

        <div className="space-y-3 text-xs text-[#A3A3A3]">
          <div className="p-4 rounded-xl bg-[#161616] border border-white/[0.04] space-y-1.5">
            <h3 className="font-semibold text-[#F5F5F5] text-sm">1. Declarative Knowledge &amp; Production Rules</h3>
            <p className="text-[#A3A3A3] leading-relaxed">
              Rules defined in declarative JSON and executed by an iterative forward-chaining inference engine until fixed-point closure is reached.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#161616] border border-white/[0.04] space-y-1.5">
            <h3 className="font-semibold text-[#F5F5F5] text-sm">2. Fuzzy Set Theory &amp; Centroid Defuzzification</h3>
            <p className="text-[#A3A3A3] leading-relaxed">
              Continuous variables such as mileage and price boundaries are mapped to trapezoidal membership curves and translated into defuzzified weight distributions.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#161616] border border-white/[0.04] space-y-1.5">
            <h3 className="font-semibold text-[#F5F5F5] text-sm">3. Bayesian Reasoning Under Uncertainty</h3>
            <p className="text-[#A3A3A3] leading-relaxed">
              Calculates posterior likelihoods for unverified real-world infrastructure (such as overnight EV charging and CNG station proximity), computing Shannon entropy to quantify confidence.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#161616] border border-white/[0.04] space-y-1.5">
            <h3 className="font-semibold text-[#F5F5F5] text-sm">4. Explainable AI (XAI)</h3>
            <p className="text-[#A3A3A3] leading-relaxed">
              Synthesizes end-to-end transparent reasoning traces, documenting rule firings and mathematical updates without relying on opaque black-box models.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-[#161616] border border-white/[0.06] rounded-xl p-4 text-xs text-[#737373] space-y-1">
        <div className="font-mono uppercase text-[#A3A3A3] text-[10px] tracking-wider">Course Project Notice</div>
        <p className="leading-relaxed">
          Developed strictly for academic demonstration and decision analysis research. Specifications, pricing, and operational cost metrics represent illustrative benchmarks.
        </p>
      </div>
    </div>
  );
};
