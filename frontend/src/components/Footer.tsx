import React from 'react';
import { CheckCircle } from 'lucide-react';

interface FooterProps {
  onNavigate?: (tabId: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const handleNav = (tabId: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (onNavigate) onNavigate(tabId);
  };

  return (
    <footer className="w-full bg-viq-surface-container-lowest py-10 border-t border-viq-outline-variant/30 mt-16">
      <div className="w-full px-4 lg:px-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Column 1: Brand & FAI Accreditation */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <img
                alt="VehicleIQ Minimalist Automotive AI Logo"
                className="h-6 w-auto object-contain"
                src="https://lh3.googleusercontent.com/aida/AEtjO1XgIZFuux3YHc1zZsCskn0XBTO9BXPkGUysw1PyxCBrxwGLkKsbd9gay3lnhLGDetj3ht0CiFhPMVNmHFHWHGJqKZ6KOyb0tjrSZ7MJlH8AlO4z3B5-veVSbt9uoSwpZimC4lPu3hGLV6-UNK0f5PjBfRwTuhj6fm3pEKbneKbdJxllQxHi2tEPHscQiwbgLxnGDbQWrV_jtgIkBm4FWZhvqGPKORQ8w1s8TVE_kBa9L86DAaz2F-hKcik"
              />
              <span className="font-jakarta text-lg font-bold tracking-tight text-viq-primary uppercase">
                VehicleIQ
              </span>
            </div>
            <p className="font-jakarta text-xs text-viq-on-surface-variant leading-relaxed">
              Autonomous automotive decision-support infrastructure powered by Forward Chaining rule bases, continuous Mamdani Fuzzy inference, and dynamic Bayesian Networks.
            </p>
            <div className="flex items-center gap-1.5 text-viq-outline font-mono text-[11px]">
              <CheckCircle className="w-3.5 h-3.5 text-viq-tertiary-fixed" />
              <span>Certified FAI Level-4 Architecture</span>
            </div>
          </div>

          {/* Column 2: Telemetry Matrix Links */}
          <div className="flex flex-col gap-2">
            <span className="font-mono text-[10px] text-viq-primary uppercase tracking-widest mb-1 font-semibold">
              Telemetry Matrix
            </span>
            <a 
              href="#discover" 
              onClick={(e) => handleNav('discover', e)}
              className="font-jakarta text-xs text-viq-on-surface-variant hover:text-viq-primary transition-colors"
            >
              Powertrain & Real-World Efficiency
            </a>
            <a 
              href="#compare" 
              onClick={(e) => handleNav('compare', e)}
              className="font-jakarta text-xs text-viq-on-surface-variant hover:text-viq-primary transition-colors"
            >
              Multi-Vehicle Benchmark Matrix
            </a>
            <a 
              href="#details" 
              onClick={(e) => handleNav('details', e)}
              className="font-jakarta text-xs text-viq-on-surface-variant hover:text-viq-primary transition-colors"
            >
              Regional RTO Tax Waterfall Breakdown
            </a>
            <a 
              href="#discover" 
              onClick={(e) => handleNav('discover', e)}
              className="font-jakarta text-xs text-viq-on-surface-variant hover:text-viq-primary transition-colors"
            >
              Urban Monsoon Clearance Index
            </a>
          </div>

          {/* Column 3: Autonomous Core Links */}
          <div className="flex flex-col gap-2">
            <span className="font-mono text-[10px] text-viq-primary uppercase tracking-widest mb-1 font-semibold">
              Autonomous Core
            </span>
            <a 
              href="#reasoning" 
              onClick={(e) => handleNav('reasoning', e)}
              className="font-jakarta text-xs text-viq-on-surface-variant hover:text-viq-primary transition-colors"
            >
              Explainable AI (XAI) Reasoning Deck
            </a>
            <a 
              href="#reasoning" 
              onClick={(e) => handleNav('reasoning', e)}
              className="font-jakarta text-xs text-viq-on-surface-variant hover:text-viq-primary transition-colors"
            >
              Fuzzy Logic Membership Visualizer
            </a>
            <a 
              href="#reasoning" 
              onClick={(e) => handleNav('reasoning', e)}
              className="font-jakarta text-xs text-viq-on-surface-variant hover:text-viq-primary transition-colors"
            >
              Bayesian Prior-to-Posterior Updates
            </a>
          </div>

          {/* Column 4: Credentials & Security Status */}
          <div className="flex flex-col gap-1.5">
            <span className="font-mono text-[10px] text-viq-primary uppercase tracking-widest mb-1 font-semibold">
              Credentials & Security
            </span>
            <span className="font-mono text-xs text-viq-on-surface-variant">ISO/SAE 21434 Compliant</span>
            <span className="font-mono text-xs text-viq-on-surface-variant">FAI Neural Node #09941</span>
            <span className="font-mono text-xs text-viq-on-surface-variant">Latency: 14ms (IN-WEST-1)</span>
            <div className="mt-2 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-viq-tertiary-fixed animate-pulse"></span>
              <span className="font-mono text-[11px] text-viq-tertiary-fixed uppercase font-semibold">
                Grid Telemetry Synced
              </span>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 border-t border-viq-outline-variant/20">
          <span className="font-mono text-xs text-viq-outline">
            © 2025 VehicleIQ AI Labs · Foundations of AI Decision Support Platform
          </span>
          <div className="flex items-center gap-4 text-xs font-mono text-viq-outline">
            <span>ISO 26262 ASIL-B</span>
            <span>Privacy Policy</span>
            <span>Academic Docs</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
