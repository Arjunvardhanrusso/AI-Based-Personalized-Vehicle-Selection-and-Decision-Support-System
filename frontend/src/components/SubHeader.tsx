import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  Sliders,
  Terminal,
  MapPin,
  Sparkles,
  Compass,
  Car,
  GitCompare,
  BrainCircuit,
  Check,
  ChevronDown,
  Sun,
  Moon,
  Search
} from 'lucide-react';
import type { SelectedLocation } from '../types';
import { KNOWN_LOCATIONS } from '../types';
import { fetchLocations } from '../services/api';

interface SubHeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedLocation: SelectedLocation;
  setSelectedLocation: (loc: SelectedLocation) => void;
  telemetryOpen: boolean;
  setTelemetryOpen: (open: boolean) => void;
  demoMode: boolean;
  setDemoMode: (demo: boolean) => void;
  onOpenQuestionnaire?: () => void;
}

export const SubHeader: React.FC<SubHeaderProps> = ({
  activeTab,
  setActiveTab,
  selectedLocation,
  setSelectedLocation,
  telemetryOpen,
  setTelemetryOpen,
  demoMode,
  setDemoMode,
  onOpenQuestionnaire
}) => {
  const tabs = [
    { id: 'discover',  label: '1. Discover & Match', icon: <Compass className="w-4 h-4" /> },
    { id: 'details',   label: '2. Deep Dive (Why?)',  icon: <Car className="w-4 h-4" /> },
    { id: 'compare',   label: '3. Compare Matrix',    icon: <GitCompare className="w-4 h-4" /> },
    { id: 'reasoning', label: '4. AI Reasoning Lab',  icon: <BrainCircuit className="w-4 h-4" /> },
  ];

  // Custom dropdown state & locations list
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [locationsList, setLocationsList] = useState<SelectedLocation[]>(KNOWN_LOCATIONS);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Theme state: Sleek Slate Dark vs Sleek Slate Light
  const [themeMode, setThemeMode] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('viq_theme');
    return saved === 'light' ? 'light' : 'dark';
  });

  useEffect(() => {
    if (themeMode === 'light') {
      document.documentElement.classList.add('light-theme');
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.classList.remove('light-theme');
      document.documentElement.setAttribute('data-theme', 'dark');
    }
    localStorage.setItem('viq_theme', themeMode);
  }, [themeMode]);

  const toggleTheme = () => {
    setThemeMode(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Fetch locations from /api/locations on mount
  useEffect(() => {
    let isMounted = true;
    const loadLocations = async () => {
      try {
        const data = await fetchLocations();
        const stateList = data.states_and_uts || data.states || [];
        if (data && Array.isArray(stateList) && stateList.length > 0) {
          const apiLocations: SelectedLocation[] = [];
          stateList.forEach((st: any) => {
            if (st.cities && Array.isArray(st.cities)) {
              st.cities.forEach((cityName: string) => {
                const known = KNOWN_LOCATIONS.find(
                  (k) => k.city.toLowerCase() === cityName.toLowerCase()
                );
                if (known) {
                  apiLocations.push(known);
                } else {
                  const id = cityName.toLowerCase().replace(/\s+/g, '');
                  const code = st.code || cityName.slice(0, 3).toUpperCase();
                  apiLocations.push({
                    id,
                    city: cityName,
                    state: st.state,
                    code,
                    category: st.category || `${st.state} Region`
                  });
                }
              });
            }
          });

          if (isMounted && apiLocations.length > 0) {
            // Deduplicate by city id
            const uniqueMap = new Map<string, SelectedLocation>();
            KNOWN_LOCATIONS.forEach(loc => uniqueMap.set(loc.id, loc));
            apiLocations.forEach(loc => uniqueMap.set(loc.id, loc));
            setLocationsList(Array.from(uniqueMap.values()));
          }
        }
      } catch (err) {
        console.warn('Locations API unavailable, falling back to preset locations list', err);
      }
    };
    loadLocations();
    return () => { isMounted = false; };
  }, []);

  // Filter locations by search input
  const filteredLocations = useMemo(() => {
    if (!searchFilter.trim()) return locationsList;
    const query = searchFilter.toLowerCase();
    return locationsList.filter(
      loc => loc.city.toLowerCase().includes(query) || 
             loc.state.toLowerCase().includes(query) || 
             (loc.category && loc.category.toLowerCase().includes(query)) ||
             loc.code.toLowerCase().includes(query)
    );
  }, [locationsList, searchFilter]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Close dropdown on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDropdownOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const handleSelect = (loc: SelectedLocation) => {
    setSelectedLocation(loc);
    setDropdownOpen(false);
    setSearchFilter('');
  };

  return (
    <div className="w-full bg-viq-surface-container-low border-b border-viq-outline-variant/30 sticky top-14 z-30 shadow-md">
      <div className="max-w-[1600px] mx-auto px-4 lg:px-10 flex items-center justify-between h-12">
        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto scrollbar-none py-1">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-jakarta text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-viq-surface-container-highest text-viq-primary shadow-sm border border-viq-outline-variant/40'
                    : 'text-viq-on-surface-variant hover:text-viq-on-surface hover:bg-viq-surface-container'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Controls Area */}
        <div className="flex items-center gap-3 shrink-0">

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            type="button"
            className="flex items-center gap-1.5 bg-viq-surface-container px-2.5 py-1 rounded-lg border border-viq-outline-variant/40 hover:border-viq-outline-variant/80 hover:bg-viq-surface-container-high font-mono text-xs transition-all cursor-pointer text-viq-on-surface"
            title="Toggle Sleek Slate Theme (Dark / Light)"
          >
            {themeMode === 'dark' ? (
              <>
                <Moon className="w-3.5 h-3.5 text-blue-400" />
                <span className="font-bold text-blue-400">DARK</span>
              </>
            ) : (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span className="font-bold text-amber-600">LIGHT</span>
              </>
            )}
          </button>

          {/* Custom Sleek Slate Searchable Location Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen(prev => !prev)}
              aria-haspopup="listbox"
              aria-expanded={dropdownOpen}
              aria-label="Select city"
              className="flex items-center gap-1.5 bg-viq-surface-container px-2.5 py-1 rounded-lg border border-viq-outline-variant/40 hover:border-viq-outline-variant/80 hover:bg-viq-surface-container-high transition-all cursor-pointer"
            >
              <MapPin className="w-3.5 h-3.5 text-viq-primary-fixed-dim shrink-0" />
              <span className="text-xs font-mono text-viq-on-surface whitespace-nowrap">
                {selectedLocation.city} ({selectedLocation.code})
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-viq-outline transition-transform shrink-0 ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {dropdownOpen && (
              <div
                role="listbox"
                aria-label="Select city"
                className="absolute right-0 top-full mt-1.5 w-80 z-50 bg-viq-surface-container-high border border-viq-outline-variant/50 rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.7)] overflow-hidden animate-in fade-in-50 slide-in-from-top-2 duration-150"
              >
                <div className="px-3 py-2 border-b border-viq-outline-variant/30 flex justify-between items-center bg-viq-surface-container">
                  <span className="font-mono text-[10px] text-viq-outline uppercase tracking-wider">
                    Select Location ({filteredLocations.length} / {locationsList.length})
                  </span>
                  <span className="font-mono text-[9px] text-viq-primary-container font-semibold">
                    Pan-India Master
                  </span>
                </div>

                {/* Filter Search Input */}
                <div className="p-2 border-b border-viq-outline-variant/30 bg-viq-surface-container-low flex items-center gap-2">
                  <Search className="w-3.5 h-3.5 text-viq-outline shrink-0 ml-1" />
                  <input
                    type="text"
                    placeholder="Search 250+ cities, states, tiers..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className="w-full bg-viq-surface-container border border-viq-outline-variant/50 rounded-lg px-2.5 py-1.5 text-xs text-viq-on-surface font-mono outline-none focus:border-[#0066FF]"
                    autoFocus
                  />
                </div>

                <div className="max-h-72 overflow-y-auto py-1">
                  {filteredLocations.map((loc) => {
                    const isSelected = loc.id === selectedLocation.id || loc.city.toLowerCase() === selectedLocation.city.toLowerCase();
                    return (
                      <button
                        key={loc.id}
                        role="option"
                        aria-selected={isSelected}
                        type="button"
                        onClick={() => handleSelect(loc)}
                        className={`w-full flex items-center justify-between px-3 py-2 text-xs font-mono transition-colors text-left border-b border-viq-outline-variant/10 ${
                          isSelected
                            ? 'bg-[#0066FF]/20 text-white font-bold'
                            : 'text-viq-on-surface hover:bg-viq-surface-container-highest'
                        }`}
                      >
                        <div className="flex flex-col truncate max-w-[200px]">
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="font-semibold text-viq-on-surface">{loc.city}</span>
                            <span className="text-viq-outline text-[10px]">({loc.state})</span>
                          </div>
                          {loc.category && (
                            <span className="text-[9px] text-viq-on-surface-variant font-sans truncate">{loc.category}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-viq-outline text-[10px] bg-viq-surface-container px-1.5 py-0.5 rounded font-bold">{loc.code}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-[#0066FF] shrink-0" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 15-Question Survey Modal Trigger */}
          {onOpenQuestionnaire && (
            <button
              onClick={onOpenQuestionnaire}
              className="flex items-center gap-1.5 bg-gradient-to-r from-viq-primary-container/20 to-viq-secondary-container/20 hover:from-viq-primary-container/30 hover:to-viq-secondary-container/30 border border-viq-primary-container/40 text-viq-primary px-3 py-1 rounded-lg font-jakarta text-xs font-semibold transition-all shadow-[0_0_10px_rgba(0,242,254,0.1)]"
            >
              <Sliders className="w-3.5 h-3.5 text-viq-primary-container" />
              <span>Full 15-Q Survey</span>
            </button>
          )}

          {/* Academic Demo Mode Toggle */}
          <button
            onClick={() => setDemoMode(!demoMode)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-mono text-xs transition-all border ${
              demoMode
                ? 'bg-viq-secondary-container/30 text-viq-secondary-fixed border-viq-secondary-container'
                : 'bg-viq-surface-container text-viq-outline border-viq-outline-variant/40 hover:text-viq-on-surface'
            }`}
            title="Academic Demo Mode exposes naive baseline comparisons and deep telemetry math"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Academic Mode:</span>
            <span className="font-bold">{demoMode ? 'ON' : 'OFF'}</span>
          </button>

          {/* Live Telemetry HUD Drawer Toggle */}
          <button
            onClick={() => setTelemetryOpen(!telemetryOpen)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-mono text-xs transition-all border ${
              telemetryOpen
                ? 'bg-viq-tertiary-container/20 text-viq-tertiary-fixed border-viq-tertiary-fixed/40'
                : 'bg-viq-surface-container text-viq-outline border-viq-outline-variant/40 hover:text-viq-on-surface'
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-viq-tertiary-fixed-dim" />
            <span className="hidden md:inline">Telemetry HUD</span>
            <span className={`w-1.5 h-1.5 rounded-full ${telemetryOpen ? 'bg-viq-tertiary-fixed animate-ping' : 'bg-viq-outline'}`} />
          </button>
        </div>
      </div>
    </div>
  );
};
