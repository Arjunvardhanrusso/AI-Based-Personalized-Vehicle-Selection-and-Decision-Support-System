import React, { useState, useEffect, useRef } from 'react';
import { Search, Compass, BrainCircuit, Car, GitCompare, ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import { fetchSearchSuggestions } from '../services/api';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tabId: string) => void;
  onInspectVehicle?: (vehicleId: string) => void;
}

const SUGGESTED_SEARCHES = [
  { label: '₹10–15 Lakh', query: 'budget 10 lakh' },
  { label: 'SUV',          query: 'SUV' },
  { label: 'EV',           query: 'EV electric' },
  { label: '5+ seats',     query: '7 seater' },
  { label: 'Petrol',       query: 'petrol' },
  { label: 'Under ₹8L',    query: 'hatchback' },
];

const NAV_COMMANDS = [
  {
    id: 'discover',
    title: 'Discover & Match — Recommendation Matrix',
    badge: 'Tab 1',
    icon: <Compass className="w-4 h-4 text-viq-primary-container" />,
  },
  {
    id: 'details',
    title: 'Deep Dive — Why This Vehicle?',
    badge: 'Tab 2',
    icon: <Car className="w-4 h-4 text-viq-tertiary-fixed" />,
  },
  {
    id: 'compare',
    title: 'Compare Matrix — Side-by-Side',
    badge: 'Tab 3',
    icon: <GitCompare className="w-4 h-4 text-amber-400" />,
  },
  {
    id: 'reasoning',
    title: 'AI Reasoning — Explainable Engine',
    badge: 'Tab 4',
    icon: <BrainCircuit className="w-4 h-4 text-viq-secondary-fixed" />,
  },
];

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onInspectVehicle,
}) => {
  const [query, setQuery] = useState('');
  const [vehicleResults, setVehicleResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keyboard shortcut — Ctrl+K / Cmd+K toggles the palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // The parent opens us by toggling isCommandPaletteOpen to true
          // Dispatching a custom event so parent can react without coupling
          window.dispatchEvent(new CustomEvent('viq:open-search'));
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Auto-focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setVehicleResults([]);
      setSearchError(null);
    }
  }, [isOpen]);

  // Debounced vehicle search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query.trim()) {
      setVehicleResults([]);
      setSearchError(null);
      setSearchLoading(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setSearchLoading(true);
      setSearchError(null);
      try {
        const results = await fetchSearchSuggestions(query.trim());
        setVehicleResults(Array.isArray(results) ? results.slice(0, 8) : []);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Search failed';
        setSearchError(msg);
        console.error('[Search]', msg);
        setVehicleResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 280);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  if (!isOpen) return null;

  const filteredNav = NAV_COMMANDS.filter(
    (cmd) =>
      !query.trim() ||
      cmd.title.toLowerCase().includes(query.toLowerCase()) ||
      cmd.badge.toLowerCase().includes(query.toLowerCase())
  );

  const formatPrice = (v: number) => {
    if (!v) return '';
    const lakh = v / 100000;
    return `₹${lakh >= 10 ? lakh.toFixed(1) : lakh.toFixed(2)}L`;
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-viq-surface-container-lowest/80 backdrop-blur-xl flex items-start justify-center pt-16 px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-viq-surface-container-high w-full max-w-2xl rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.9)] border border-viq-outline-variant/60 overflow-hidden flex flex-col animate-in fade-in-50 zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-4 py-2.5 bg-viq-surface-container border-b border-viq-outline-variant/30">
          <span className="font-mono text-[10px] text-viq-outline uppercase tracking-wider">
            Search parameters
          </span>
        </div>

        {/* Input Bar */}
        <div className="flex items-center px-4 py-3 bg-viq-surface-container border-b border-viq-outline-variant/40 gap-3">
          {searchLoading
            ? <Loader2 className="w-5 h-5 text-viq-primary-container animate-spin shrink-0" />
            : <Search className="w-5 h-5 text-viq-outline shrink-0" />
          }
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search vehicles, budget, fuel type, segment..."
            className="w-full bg-transparent text-sm font-jakarta text-viq-on-surface placeholder:text-viq-outline outline-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && vehicleResults.length > 0) {
                const first = vehicleResults[0];
                const id = first.variant_id ?? first.vehicle_id ?? first.id ?? '';
                if (id && onInspectVehicle) {
                  onInspectVehicle(String(id));
                  onClose();
                }
              }
            }}
          />
          <kbd className="bg-viq-surface-container-highest text-viq-on-surface-variant px-2 py-0.5 rounded font-mono text-xs border border-viq-outline-variant/40 shrink-0">
            ESC
          </kbd>
        </div>

        {/* Body */}
        <div className="p-3 flex flex-col gap-3 max-h-[420px] overflow-y-auto">
          {/* Error */}
          {searchError && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-red-900/20 border border-red-700/30">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span className="text-xs font-mono text-red-300">Search error: {searchError}</span>
            </div>
          )}

          {/* Suggested searches (when query is empty) */}
          {!query.trim() && (
            <div className="flex flex-col gap-1.5">
              <span className="px-2 font-mono text-[10px] text-viq-outline uppercase tracking-wider">
                Suggested parameters
              </span>
              <div className="flex flex-wrap gap-2 px-2">
                {SUGGESTED_SEARCHES.map((s) => (
                  <button
                    key={s.query}
                    onClick={() => setQuery(s.query)}
                    className="px-3 py-1 rounded-full bg-viq-surface-container border border-viq-outline-variant/40 text-xs font-mono text-viq-on-surface-variant hover:text-viq-on-surface hover:border-viq-outline-variant/80 hover:bg-viq-surface-container-high transition-colors"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Vehicle search results */}
          {vehicleResults.length > 0 && (
            <div className="flex flex-col gap-1">
              <span className="px-2 font-mono text-[10px] text-viq-outline uppercase tracking-wider">
                Vehicles ({vehicleResults.length})
              </span>
              {vehicleResults.map((item, i) => {
                const id = String(item.variant_id ?? item.vehicle_id ?? item.id ?? '');
                return (
                  <button
                    key={id || i}
                    onClick={() => {
                      if (id && onInspectVehicle) onInspectVehicle(id);
                      onClose();
                    }}
                    className="w-full p-2.5 rounded-lg hover:bg-viq-surface-container-highest transition-colors flex items-center justify-between text-left group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-1.5 h-6 rounded-full bg-viq-primary-container/60 shrink-0" />
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-jakarta font-semibold text-viq-on-surface group-hover:text-viq-primary transition-colors truncate">
                          {item.label ?? `${item.brand} ${item.model_name} ${item.variant_name ?? ''}`.trim()}
                        </span>
                        <span className="text-[10px] font-mono text-viq-outline truncate">
                          {item.fuel_type ? `${item.fuel_type} · ` : ''}{formatPrice(item.price_inr)}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-viq-outline group-hover:text-viq-primary-container transition-colors shrink-0" />
                  </button>
                );
              })}
            </div>
          )}

          {/* No results message */}
          {query.trim() && !searchLoading && vehicleResults.length === 0 && !searchError && (
            <div className="px-3 py-2 text-xs font-mono text-viq-outline">
              No vehicles found for "{query}"
            </div>
          )}

          {/* Navigation commands */}
          {filteredNav.length > 0 && (
            <div className="flex flex-col gap-1">
              <span className="px-2 font-mono text-[10px] text-viq-outline uppercase tracking-wider">
                {query.trim() ? 'Navigation' : 'Quick navigation'}
              </span>
              {filteredNav.map((item) => (
                <button
                  key={item.id}
                  onClick={() => { onNavigate(item.id); onClose(); }}
                  className="w-full p-2.5 rounded-lg hover:bg-viq-surface-container-highest transition-colors flex items-center justify-between text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-md bg-viq-surface-container group-hover:bg-viq-surface-container-high">
                      {item.icon}
                    </div>
                    <span className="text-xs font-jakarta font-medium text-viq-on-surface group-hover:text-viq-primary transition-colors">
                      {item.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-viq-outline bg-viq-surface-container px-2 py-0.5 rounded border border-viq-outline-variant/30">
                      {item.badge}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-viq-outline group-hover:text-viq-primary-container transition-colors" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-viq-surface-container-lowest text-viq-outline font-mono text-[10px] flex justify-between border-t border-viq-outline-variant/30">
          <span>↵ to select first result · ESC to close</span>
          <span>VehicleIQ Search</span>
        </div>
      </div>
    </div>
  );
};
