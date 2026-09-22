import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Compass } from 'lucide-react';

interface NavbarProps {
  demoMode: boolean;
  setDemoMode: (val: boolean) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ demoMode, setDemoMode }) => {
  const location = useLocation();

  const navLinks = [
    { path: '/', label: 'Overview' },
    { path: '/search', label: 'Vehicle Search' },
    { path: '/questionnaire', label: 'Decision Engine' },
    { path: '/results', label: 'Rankings' },
    { path: '/reasoning', label: 'Inference Trace' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#080808]/90 backdrop-blur-md border-b border-white/[0.08]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center space-x-3 group">
          <div className="w-8 h-8 rounded-lg bg-[#141414] border border-white/[0.08] flex items-center justify-center text-[#C86B3C] group-hover:border-[#C86B3C]/50 transition-colors">
            <Compass className="w-4 h-4" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-semibold tracking-tight text-[#F5F5F5]">
              VehicleIQ
            </span>
            <span className="text-[11px] text-[#888888] font-mono hidden sm:inline">
              Automotive AI
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center space-x-1">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  isActive
                    ? 'text-white bg-[#1C1C1C] border border-white/[0.08]'
                    : 'text-[#A3A3A3] hover:text-[#F5F5F5] hover:bg-[#141414]'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* AI Demo Mode Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setDemoMode(!demoMode)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 border transition-all ${
              demoMode
                ? 'bg-[#181818] text-[#F5F5F5] border-[#C86B3C]/40 shadow-sm'
                : 'bg-[#101010] text-[#737373] border-white/[0.08] hover:text-[#A3A3A3]'
            }`}
            title="Toggle Academic AI Trace Mode to inspect mathematical inference breakdown"
          >
            <span className={`w-1.5 h-1.5 rounded-full ${demoMode ? 'bg-[#C86B3C]' : 'bg-[#555555]'}`}></span>
            <span className="text-[11px] tracking-wide">AI Trace Mode</span>
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${demoMode ? 'bg-[#C86B3C]/20 text-[#FF9D66]' : 'bg-[#1C1C1C] text-[#737373]'}`}>
              {demoMode ? 'ON' : 'OFF'}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
