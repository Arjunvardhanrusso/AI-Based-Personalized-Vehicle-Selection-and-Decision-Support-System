import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import type { SelectedLocation } from '../types';

interface HeaderProps {
  selectedLocation: SelectedLocation;
  onOpenSearch: () => void;
}

export const Header: React.FC<HeaderProps> = ({ selectedLocation, onOpenSearch }) => {
  const location = useLocation();

  const navLinks = [
    { path: '/discover', label: 'Discover', icon: 'tune' },
    { path: '/compare', label: 'Compare', icon: 'compare_arrows' },
    { path: '/garage', label: 'Garage', icon: 'garage' },
    { path: '/admin', label: 'Admin', icon: 'admin_panel_settings' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-viq-surface-container-lowest/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.4)]">
      <div className="h-20 w-full px-margin flex items-center justify-between gap-gutter">
        <div className="flex items-center gap-space-lg">
          <Link to="/discover" className="flex items-center gap-space-sm">
            <img
              alt="VehicleIQ Minimalist Automotive AI Logo"
              className="h-8 w-auto object-contain"
              src="https://lh3.googleusercontent.com/aida/AEtjO1XgIZFuux3YHc1zZsCskn0XBTO9BXPkGUysw1PyxCBrxwGLkKsbd9gay3lnhLGDetj3ht0CiFhPMVNmHFHWHGJqKZ6KOyb0tjrSZ7MJlH8AlO4z3B5-veVSbt9uoSwpZimC4lPu3hGLV6-UNK0f5PjBfRwTuhj6fm3pEKbneKbdJxllQxHi2tEPHscQiwbgLxnGDbQWrV_jtgIkBm4FWZhvqGPKORQ8w1s8TVE_kBa9L86DAaz2F-hKcik"
            />
            <div className="flex flex-col">
              <span className="font-jakarta text-headline-sm font-bold tracking-tight text-viq-primary uppercase">
                VehicleIQ
              </span>
              <span className="font-mono text-label-caps text-viq-outline uppercase tracking-widest">
                Decision Telemetry v4.2
              </span>
            </div>
          </Link>
          <nav className="hidden xl:flex items-center gap-space-xs">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path || (link.path === '/discover' && location.pathname === '/');
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={
                    isActive
                      ? "px-space-md py-space-sm transition-colors bg-viq-surface-container-high text-viq-primary font-semibold rounded-lg"
                      : "px-space-md py-space-sm rounded font-jakarta text-body-sm text-viq-on-surface-variant hover:text-viq-on-surface hover:bg-viq-surface-container transition-colors"
                  }
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-space-md">
          {/* Search button — opens CommandPalette */}
          <button
            type="button"
            onClick={onOpenSearch}
            aria-label="Open search"
            className="hidden md:flex items-center bg-viq-surface-container-low px-space-md py-space-xs rounded gap-space-sm cursor-pointer hover:bg-viq-surface-container transition-colors border border-transparent hover:border-viq-outline-variant/40"
          >
            <span className="material-symbols-outlined text-viq-outline text-[18px]">search</span>
            <span className="font-jakarta text-body-sm text-viq-outline">Search parameters</span>
          </button>

          {/* Dynamic location badge reflecting actual selectedLocation */}
          <div className="hidden lg:flex items-center bg-viq-surface-container-low px-space-md py-space-xs rounded gap-space-xs border border-transparent">
            <span className="material-symbols-outlined text-viq-primary-fixed-dim text-[16px]">location_on</span>
            <span className="font-mono text-data-mono-sm text-viq-on-surface">
              {selectedLocation.city} ({selectedLocation.code})
            </span>
          </div>

          <div className="flex items-center gap-space-xs bg-viq-surface-container-low px-space-md py-space-xs rounded">
            <span className="w-2 h-2 rounded-full bg-viq-tertiary-container animate-pulse-slow"></span>
            <span className="font-mono text-label-caps text-viq-tertiary-fixed-dim uppercase tracking-wider">
              AI ENGINE ONLINE
            </span>
          </div>

          <Link to="/auth" className="w-8 h-8 rounded-full bg-viq-primary flex items-center justify-center hover:bg-viq-primary-hover transition-colors">
            <span className="material-symbols-outlined text-viq-on-primary text-[18px]">person</span>
          </Link>
        </div>
      </div>
    </header>
  );
};
