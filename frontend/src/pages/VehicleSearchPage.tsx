import {
  AlertTriangle,
  BatteryCharging,
  Calendar,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Eye,
  Flame,
  Fuel,
  Info,
  MapPin,
  RotateCcw,
  Scale,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  X,
  Zap
} from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import SkeletonCard from '../components/SkeletonCard';
import { VehicleImage } from '../components/VehicleImage';
import {
  compareVariants,
  executeAdvancedSearch,
  fetchFilterOptions,
  fetchLocations,
  fetchSearchSuggestions,
} from '../services/api';
import type {
  AdvancedFilterQuery,
  AdvancedSearchResponse,
  LocationData,
  VehicleRanking,
} from '../types';


type SearchOptionSet = {
  brands: string[];
  body_types: string[];
  vehicle_types: string[];
  performance_types: string[];
  powertrains: string[];
  transmissions: string[];
  seating_capacities: number[];
  features: string[];
  luxury_levels?: string[];
  offroad_capabilities?: string[];
};

type ComparisonRecord = Record<string, any>;

const DEFAULT_IMAGE = '/assets/cars/default_vehicle.svg';
const MAX_COMPARE = 4;

const formatPrice = (value: number | null | undefined) => {
  if (value == null || !Number.isFinite(Number(value))) return 'Price unavailable';
  const price = Number(value);
  if (price < 100000) return `₹${Math.round(price).toLocaleString('en-IN')}`;
  if (price < 10000000) {
    const lakh = price / 100000;
    return `₹${lakh.toFixed(lakh >= 10 ? 1 : 2)} Lakh`;
  }
  const crore = price / 10000000;
  return `₹${crore.toFixed(crore >= 10 ? 1 : 2)} Cr`;
};

const formatLakhsInput = (value: number | null) =>
  value == null ? '' : String(value / 100000);

const normalizeScore = (value: unknown) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.round(Math.max(0, Math.min(1, n <= 1 ? n : n / 100)) * 100);
};

const getRecordId = (value: ComparisonRecord) =>
  String(value.variant_id ?? value.vehicle_id ?? value.id ?? '');

const getImageUrl = (value: ComparisonRecord) =>
  String(value.image_url ?? value.image_path ?? DEFAULT_IMAGE);

const getAvailabilityText = (value: unknown) =>
  value == null || value === '' ? 'Not specified' : String(value);

export const VehicleSearchPage: React.FC = () => {
  // Master Filter Options from backend
  const [filterOptions, setFilterOptions] = useState<SearchOptionSet | null>(null);

  // Pan-India Locations
  const [locations, setLocations] = useState<LocationData | null>(null);
  const [selectedState, setSelectedState] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('');

  // Search query & Autocomplete
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [suggestions, setSuggestions] = useState<Array<{
    id: string;
    label: string;
    brand: string;
    model_name: string;
    variant_name: string;
    fuel_type: string;
    price_inr: number;
    image_path: string;
  }>>([]);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);

  // Filter States
  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [brandFilterSearch, setBrandFilterSearch] = useState<string>('');
  const [selectedBodyTypes, setSelectedBodyTypes] = useState<string[]>([]);
  const [selectedVehicleTypes, setSelectedVehicleTypes] = useState<string[]>([]);
  const [selectedPerformanceTypes, setSelectedPerformanceTypes] = useState<string[]>([]);
  const [selectedPowertrains, setSelectedPowertrains] = useState<string[]>([]);
  const [selectedTransmissions, setSelectedTransmissions] = useState<string[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [requiredFeatures, setRequiredFeatures] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<string>('ai_score');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 20;

  // UI States
  const [loading, setLoading] = useState<boolean>(false);
  const [searchResponse, setSearchResponse] = useState<AdvancedSearchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showExcluded, setShowExcluded] = useState<boolean>(false);
  const [selectedVariant, setSelectedVariant] = useState<VehicleRanking | null>(null);
  const [compareList, setCompareList] = useState<VehicleRanking[]>([]);
  const [showCompareModal, setShowCompareModal] = useState<boolean>(false);
  const [compareData, setCompareData] = useState<ComparisonRecord[]>([]);
  const [compareError, setCompareError] = useState<string | null>(null);
  const requestIdRef = useRef(0);
  const [comparingLoading, setComparingLoading] = useState<boolean>(false);

  // Collapsible filter sections
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    locationBudget: true,
    powertrain: true,
    body: true,
    features: false,
    brands: false,
  });

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      setError(null);
      try {
        const [locs, opts] = await Promise.all([fetchLocations(), fetchFilterOptions()]);
        if (!mounted) return;
        setLocations(locs);
        setFilterOptions(opts);
        const firstState = locs?.states?.[0];
        const firstCity = firstState?.cities?.[0];
        if (firstState && firstCity) {
          setSelectedState(firstState.state);
          setSelectedCity(firstCity);
        }
      } catch (err: any) {
        if (!mounted) return;
        setError(err?.message || 'Unable to load search metadata.');
      }
    };

    init();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const query = searchQuery.trim();
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    let active = true;
    const timer = setTimeout(async () => {
      try {
        const res = await fetchSearchSuggestions(query);
        if (active) setSuggestions(Array.isArray(res) ? res : []);
      } catch {
        if (active) setSuggestions([]);
      }
    }, 300);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [searchQuery]);

  const runSearch = useCallback(async (queryOverride?: string) => {
    if (!selectedState || !selectedCity) return;

    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);

    try {
      const query: AdvancedFilterQuery = {
        search_query: (queryOverride ?? searchQuery).trim() || undefined,
        state: selectedState,
        city: selectedCity,
        min_price_inr: minPrice > 0 ? minPrice : undefined,
        max_price_inr: maxPrice != null ? maxPrice : undefined,
        brands: selectedBrands.length ? selectedBrands : undefined,
        body_types: selectedBodyTypes.length ? selectedBodyTypes : undefined,
        vehicle_types: selectedVehicleTypes.length ? selectedVehicleTypes : undefined,
        performance_types: selectedPerformanceTypes.length ? selectedPerformanceTypes : undefined,
        powertrains: selectedPowertrains.length ? selectedPowertrains : undefined,
        transmissions: selectedTransmissions.length ? selectedTransmissions : undefined,
        seating_capacities: selectedSeats.length ? selectedSeats : undefined,
        conditions: selectedConditions.length ? selectedConditions : undefined,
        required_features: requiredFeatures.length ? requiredFeatures : undefined,
        sort_by: sortBy,
        page: currentPage,
        limit: pageSize,
      };

      const res = await executeAdvancedSearch(query);

      if (requestId === requestIdRef.current) {
        setSearchResponse(res);
      }
    } catch (err: any) {
      if (requestId === requestIdRef.current) {
        setError(err?.message || 'Failed to execute vehicle search.');
        setSearchResponse(null);
      }
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, [
    searchQuery,
    selectedState,
    selectedCity,
    minPrice,
    maxPrice,
    selectedBrands,
    selectedBodyTypes,
    selectedVehicleTypes,
    selectedPerformanceTypes,
    selectedPowertrains,
    selectedTransmissions,
    selectedSeats,
    selectedConditions,
    requiredFeatures,
    sortBy,
    currentPage,
  ]);

  useEffect(() => {
    if (selectedState && selectedCity) {
      runSearch();
    }
  }, [selectedState, selectedCity, sortBy, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchQuery,
    minPrice,
    maxPrice,
    selectedBrands,
    selectedBodyTypes,
    selectedVehicleTypes,
    selectedPerformanceTypes,
    selectedPowertrains,
    selectedTransmissions,
    selectedSeats,
    selectedConditions,
    requiredFeatures,
  ]);

  useEffect(() => {
    if (!showCompareModal && !selectedVariant) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowCompareModal(false);
        setSelectedVariant(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showCompareModal, selectedVariant]);

  useEffect(() => {
    if (!showCompareModal && !selectedVariant) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [showCompareModal, selectedVariant]);

  const resetFilters = () => {
    setSearchQuery('');
    setMinPrice(0);
    setMaxPrice(null);
    setSelectedBrands([]);
    setBrandFilterSearch('');
    setSelectedBodyTypes([]);
    setSelectedVehicleTypes([]);
    setSelectedPerformanceTypes([]);
    setSelectedPowertrains([]);
    setSelectedTransmissions([]);
    setSelectedSeats([]);
    setSelectedConditions([]);
    setRequiredFeatures([]);
    setSortBy('ai_score');
    setCurrentPage(1);
    setShowSuggestions(false);
  };

  // Helper multi-select toggles
  const toggleSelection = (item: string, list: string[], setter: (v: string[]) => void) => {
    if (list.includes(item)) {
      setter(list.filter((x) => x !== item));
    } else {
      setter([...list, item]);
    }
  };

  const toggleNumberSelection = (item: number, list: number[], setter: (v: number[]) => void) => {
    if (list.includes(item)) {
      setter(list.filter((x) => x !== item));
    } else {
      setter([...list, item]);
    }
  };

  const toggleCompare = (vehicle: VehicleRanking) => {
    const id = getRecordId(vehicle as ComparisonRecord);
    if (!id) return;

    setCompareList((current) => {
      if (current.some((item) => getRecordId(item as ComparisonRecord) === id)) {
        return current.filter((item) => getRecordId(item as ComparisonRecord) !== id);
      }
      if (current.length >= MAX_COMPARE) return current;
      return [...current, vehicle];
    });
  };

  const openCompareModal = async () => {
    if (compareList.length < 2) return;

    const ids = compareList
      .map((vehicle) => getRecordId(vehicle as ComparisonRecord))
      .filter(Boolean);

    if (ids.length < 2) return;

    setShowCompareModal(true);
    setComparingLoading(true);
    setCompareError(null);

    try {
      const response = await compareVariants(ids, selectedState, selectedCity);
      const variants = response?.variants ?? response;
      setCompareData(Array.isArray(variants) ? variants : []);
    } catch (err: any) {
      setCompareData([]);
      setCompareError(err?.message || 'Unable to load the comparison matrix.');
    } finally {
      setComparingLoading(false);
    }
  };

  // Fuel icon helper
  const getFuelIcon = (fuel?: string) => {
    switch ((fuel || '').toLowerCase()) {
      case 'ev':
      case 'electric':
        return <BatteryCharging className="w-3.5 h-3.5 text-[#FF9D66]" />;
      case 'hybrid':
      case 'strong hybrid':
      case 'mild hybrid':
        return <Zap className="w-3.5 h-3.5 text-[#32D583]" />;
      case 'cng':
      case 'diesel':
        return <Fuel className="w-3.5 h-3.5 text-[#8E8B85]" />;
      default:
        return <Flame className="w-3.5 h-3.5 text-[#FF8447]" />;
    }
  };

  // Available cities for selected state
  const availableCities = locations?.states.find((s) => s.state === selectedState)?.cities || [];

  const renderStringOptions = (
    values: string[] | undefined,
    selected: string[],
    setter: (value: string[]) => void,
  ) =>
    (values || []).map((item) => {
      const isSelected = selected.includes(item);
      return (
        <button
          type="button"
          key={item}
          aria-pressed={isSelected}
          onClick={() => toggleSelection(item, selected, setter)}
          className={`px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors ${isSelected
              ? 'bg-[#C86B3C]/15 border-[#C86B3C]/60 text-[#FF9D66]'
              : 'bg-[#161616] border-white/[0.04] text-[#8E8B85] hover:text-[#EDEDEC]'
            }`}
        >
          {item}
        </button>
      );
    });

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 space-y-8">
      {/* Top Banner / Headline */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/[0.06] pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase text-[#FF9D66] tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Pan-India Multi-Criteria Decision Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#EDEDEC]">
            Vehicle &amp; Variant Search
          </h1>
          <p className="text-xs text-[#8E8B85] mt-1 max-w-2xl">
            Search backend vehicle records by location, price, vehicle attributes, powertrain, features, and decision-engine score.
          </p>
        </div>

        {/* Global Action / Search Button */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={resetFilters}
            className="px-3 py-2 rounded-lg bg-[#161616] hover:bg-[#1F1F1F] border border-white/[0.08] text-[#8E8B85] hover:text-[#EDEDEC] text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Filters</span>
          </button>
          <button
            onClick={() => runSearch()}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#C86B3C] to-[#D97745] hover:from-[#D97745] hover:to-[#FF9D66] text-white font-semibold text-xs flex items-center gap-2 transition-all shadow-md shadow-[#C86B3C]/20 disabled:opacity-50"
          >
            <Search className="w-3.5 h-3.5" />
            <span>{loading ? 'Searching...' : 'Apply Filters'}</span>
          </button>
        </div>
      </div>

      {/* Main Search Bar with Autocomplete & Location Selector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 bg-[#111111] border border-white/[0.08] p-3 rounded-2xl shadow-xl relative z-20">
        {/* Autocomplete Input */}
        <div className="lg:col-span-6 relative">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-[#8E8B85] absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              placeholder="Search by brand, model (e.g. Nexon, Creta, 911, Defender), or variant (e.g. ZXi, SX(O))..."
              className="w-full bg-[#161616] border border-white/[0.06] focus:border-[#C86B3C]/60 rounded-xl pl-10 pr-10 py-2.5 text-xs text-[#EDEDEC] placeholder-[#8E8B85] focus:outline-none transition-colors font-sans"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 text-[#8E8B85] hover:text-[#EDEDEC] p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Autocomplete Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-[#111111] border border-white/[0.12] rounded-xl shadow-2xl overflow-hidden max-h-72 overflow-y-auto z-30">
              <div className="p-2 border-b border-white/[0.06] text-[10px] font-mono uppercase text-[#8E8B85]">
                Matching Suggestions ({suggestions.length})
              </div>
              {suggestions.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setSearchQuery(s.label);
                    setShowSuggestions(false);
                    setCurrentPage(1);
                    runSearch(s.label);
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-[#1F1F1F] flex items-center justify-between border-b border-white/[0.03] transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded bg-[#161616] border border-white/[0.06] overflow-hidden flex items-center justify-center shrink-0">
                      <VehicleImage
                        src={getImageUrl(s as ComparisonRecord)}
                        alt={s.label}
                        brand={(s as any).brand}
                        model={s.label}
                        className="w-full h-full bg-transparent"
                      />
                    </div>
                    <div>
                      <div className="text-xs font-medium text-[#EDEDEC]">{s.label}</div>
                      <div className="text-[10px] text-[#8E8B85]">
                        {s.brand} • {s.fuel_type} • {formatPrice(s.price_inr)}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-[#FF9D66] px-2 py-0.5 rounded bg-[#C86B3C]/15 border border-[#C86B3C]/30">
                    Select
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Pan-India Location Dropdowns */}
        <div className="lg:col-span-4 grid grid-cols-2 gap-2">
          {/* State */}
          <div className="relative">
            <div className="absolute left-2.5 top-2.5 text-[#8E8B85] pointer-events-none">
              <MapPin className="w-3.5 h-3.5" />
            </div>
            <select
              value={selectedState}
              onChange={(e) => {
                const newState = e.target.value;
                setSelectedState(newState);
                const stObj = locations?.states.find((s) => s.state === newState);
                if (stObj && stObj.cities.length > 0) {
                  setSelectedCity(stObj.cities[0]);
                }
              }}
              className="w-full bg-[#161616] border border-white/[0.06] rounded-xl pl-8 pr-3 py-2.5 text-xs text-[#EDEDEC] appearance-none focus:outline-none focus:border-[#C86B3C]/60"
            >
              {locations?.states.map((s) => (
                <option key={s.state} value={s.state} className="bg-[#111111] text-[#EDEDEC]">
                  {s.state}
                </option>
              ))}
            </select>
          </div>

          {/* City */}
          <div>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full bg-[#161616] border border-white/[0.06] rounded-xl px-3 py-2.5 text-xs text-[#EDEDEC] appearance-none focus:outline-none focus:border-[#C86B3C]/60"
            >
              {availableCities.map((c) => (
                <option key={c} value={c} className="bg-[#111111] text-[#EDEDEC]">
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Sort selector */}
        <div className="lg:col-span-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full bg-[#161616] border border-white/[0.06] rounded-xl px-3 py-2.5 text-xs text-[#EDEDEC] appearance-none focus:outline-none focus:border-[#C86B3C]/60 font-mono"
          >
            <option value="ai_score" className="bg-[#111111]">Sort: AI Suitability</option>
            <option value="price_asc" className="bg-[#111111]">Price: Low → High</option>
            <option value="price_desc" className="bg-[#111111]">Price: High → Low</option>
            <option value="running_cost" className="bg-[#111111]">Running Cost (Low)</option>
            <option value="performance" className="bg-[#111111]">Performance (High)</option>
            <option value="maintenance" className="bg-[#111111]">Low Maintenance</option>
          </select>
        </div>
      </div>

      {/* Main Content Layout: Left Filters Sidebar, Right Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT SIDEBAR: FILTERS */}
        <div className="lg:col-span-4 space-y-4 bg-[#111111] border border-white/[0.08] rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-[#FF9D66]" />
              <span className="text-xs font-semibold text-[#EDEDEC] uppercase tracking-wide">
                Filter Parameters
              </span>
            </div>
            <span className="text-[11px] font-mono text-[#8E8B85]">
              {selectedBrands.length +
                selectedBodyTypes.length +
                selectedPowertrains.length +
                selectedTransmissions.length +
                selectedSeats.length +
                requiredFeatures.length}{' '}
              Active
            </span>
          </div>

          {/* 1. Budget Filter Section */}
          <div className="space-y-2 border-b border-white/[0.04] pb-4">
            <button
              onClick={() => toggleSection('locationBudget')}
              className="w-full flex items-center justify-between text-xs font-medium text-[#EDEDEC]"
            >
              <span>Budget (New ex-showroom / Used listed price)</span>
              {expandedSections.locationBudget ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            {expandedSections.locationBudget && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between text-[11px] text-[#8E8B85] font-mono">
                  <span>{formatPrice(minPrice)}</span>
                  <span>{maxPrice == null ? 'No maximum' : formatPrice(maxPrice)}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-[#8E8B85]">Min (Lakhs)</label>
                    <input
                      type="number"
                      value={formatLakhsInput(minPrice)}
                      onChange={(e) => setMinPrice(Math.max(0, Number(e.target.value || 0) * 100000))}
                      className="w-full bg-[#161616] border border-white/[0.06] rounded-lg px-2.5 py-1.5 text-xs text-[#EDEDEC] focus:outline-none focus:border-[#C86B3C]/60"
                      min="0"
                      step="1"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#8E8B85]">Max (Lakhs)</label>
                    <input
                      type="number"
                      value={formatLakhsInput(maxPrice)}
                      onChange={(e) => setMaxPrice(e.target.value === "" ? null : Math.max(0, Number(e.target.value) * 100000))}
                      className="w-full bg-[#161616] border border-white/[0.06] rounded-lg px-2.5 py-1.5 text-xs text-[#EDEDEC] focus:outline-none focus:border-[#C86B3C]/60"
                      min="0"
                      step="0.1"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 2. Powertrain & Transmission Section */}
          <div className="space-y-2 border-b border-white/[0.04] pb-4">
            <button
              onClick={() => toggleSection('powertrain')}
              className="w-full flex items-center justify-between text-xs font-medium text-[#EDEDEC]"
            >
              <span>Powertrain &amp; Transmission</span>
              {expandedSections.powertrain ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            {expandedSections.powertrain && (
              <div className="space-y-3 pt-2">
                <div>
                  <div className="text-[10px] font-mono text-[#8E8B85] uppercase mb-1.5">Fuel / Powertrain</div>
                  <div className="flex flex-wrap gap-1.5">
                    {filterOptions?.powertrains.map((p) => {
                      const isSelected = selectedPowertrains.includes(p);
                      return (
                        <button
                          key={p}
                          onClick={() => toggleSelection(p, selectedPowertrains, setSelectedPowertrains)}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors ${isSelected
                              ? 'bg-[#C86B3C]/15 border-[#C86B3C]/60 text-[#FF9D66]'
                              : 'bg-[#161616] border-white/[0.04] text-[#8E8B85] hover:text-[#EDEDEC]'
                            }`}
                        >
                          {p}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-mono text-[#8E8B85] uppercase mb-1.5">Transmission</div>
                  <div className="flex flex-wrap gap-1.5">
                    {filterOptions?.transmissions.map((t) => {
                      const isSelected = selectedTransmissions.includes(t);
                      return (
                        <button
                          key={t}
                          onClick={() => toggleSelection(t, selectedTransmissions, setSelectedTransmissions)}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors ${isSelected
                              ? 'bg-[#C86B3C]/15 border-[#C86B3C]/60 text-[#FF9D66]'
                              : 'bg-[#161616] border-white/[0.04] text-[#8E8B85] hover:text-[#EDEDEC]'
                            }`}
                        >
                          {t}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 3. Body Type & Seating */}
          <div className="space-y-2 border-b border-white/[0.04] pb-4">
            <button
              onClick={() => toggleSection('body')}
              className="w-full flex items-center justify-between text-xs font-medium text-[#EDEDEC]"
            >
              <span>Body Type &amp; Seating</span>
              {expandedSections.body ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            {expandedSections.body && (
              <div className="space-y-3 pt-2">
                <div>
                  <div className="text-[10px] font-mono text-[#8E8B85] uppercase mb-1.5">Body Silhouette</div>
                  <div className="flex flex-wrap gap-1.5">
                    {filterOptions?.body_types.map((bt) => {
                      const isSelected = selectedBodyTypes.includes(bt);
                      return (
                        <button
                          key={bt}
                          onClick={() => toggleSelection(bt, selectedBodyTypes, setSelectedBodyTypes)}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors capitalize ${isSelected
                              ? 'bg-[#C86B3C]/15 border-[#C86B3C]/60 text-[#FF9D66]'
                              : 'bg-[#161616] border-white/[0.04] text-[#8E8B85] hover:text-[#EDEDEC]'
                            }`}
                        >
                          {bt}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-mono text-[#8E8B85] uppercase mb-1.5">Seating Capacity</div>
                  <div className="flex flex-wrap gap-1.5">
                    {filterOptions?.seating_capacities.map((seat) => {
                      const isSelected = selectedSeats.includes(seat);
                      return (
                        <button
                          key={seat}
                          onClick={() => toggleNumberSelection(seat, selectedSeats, setSelectedSeats)}
                          className={`px-3 py-1 rounded-md text-[11px] font-medium border transition-colors ${isSelected
                              ? 'bg-[#C86B3C]/15 border-[#C86B3C]/60 text-[#FF9D66]'
                              : 'bg-[#161616] border-white/[0.04] text-[#8E8B85] hover:text-[#EDEDEC]'
                            }`}
                        >
                          {seat} Seats
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2 border-b border-white/[0.04] pb-4">
            <button
              type="button"
              onClick={() => toggleSection('classification')}
              className="w-full flex items-center justify-between text-xs font-medium text-[#EDEDEC]"
            >
              <span>Vehicle Classification</span>
              {expandedSections.classification ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            {expandedSections.classification && (
              <div className="space-y-3 pt-2">
                <div>
                  <div className="text-[10px] font-mono text-[#8E8B85] uppercase mb-1.5">Vehicle Type</div>
                  <div className="flex flex-wrap gap-1.5">
                    {renderStringOptions(filterOptions?.vehicle_types, selectedVehicleTypes, setSelectedVehicleTypes)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-mono text-[#8E8B85] uppercase mb-1.5">Performance Type</div>
                  <div className="flex flex-wrap gap-1.5">
                    {renderStringOptions(filterOptions?.performance_types, selectedPerformanceTypes, setSelectedPerformanceTypes)}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2 border-b border-white/[0.04] pb-4">
            <button
              type="button"
              onClick={() => toggleSection('market')}
              className="w-full flex items-center justify-between text-xs font-medium text-[#EDEDEC]"
            >
              <span>Market Condition</span>
              {expandedSections.market ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            {expandedSections.market && (
              <div className="flex flex-wrap gap-1.5 pt-2">
                {['new', 'used'].map((condition) => {
                  const selected = selectedConditions.includes(condition);
                  return (
                    <button
                      type="button"
                      key={condition}
                      aria-pressed={selected}
                      onClick={() => toggleSelection(condition, selectedConditions, setSelectedConditions)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors ${selected
                          ? 'bg-[#C86B3C]/15 border-[#C86B3C]/60 text-[#FF9D66]'
                          : 'bg-[#161616] border-white/[0.04] text-[#8E8B85] hover:text-[#EDEDEC]'
                        }`}
                    >
                      {condition === 'used' ? 'Pre-Owned' : 'New'}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 4. Brand Multi-Select */}
          <div className="space-y-2 border-b border-white/[0.04] pb-4">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => toggleSection('brands')}
                className="flex items-center gap-1.5 text-xs font-medium text-[#EDEDEC]"
              >
                <span>Brands ({filterOptions?.brands.length || 0})</span>
                {expandedSections.brands ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
              {selectedBrands.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedBrands([])}
                  className="text-[10px] font-mono text-[#FF9D66] hover:underline"
                >
                  Clear ({selectedBrands.length})
                </button>
              )}
            </div>

            {expandedSections.brands && (
              <div className="space-y-2 pt-2">
                {(filterOptions?.brands.length || 0) > 8 && (
                  <div className="relative">
                    <Search className="w-3 h-3 text-[#8E8B85] absolute left-2 top-2 pointer-events-none" />
                    <input
                      type="text"
                      value={brandFilterSearch}
                      onChange={(e) => setBrandFilterSearch(e.target.value)}
                      placeholder="Filter brands..."
                      className="w-full bg-[#161616] border border-white/[0.06] rounded-md pl-7 pr-2 py-1 text-[11px] text-[#EDEDEC] placeholder-[#8E8B85] focus:outline-none focus:border-[#C86B3C]/60"
                    />
                  </div>
                )}
                <div className="pt-1 max-h-48 overflow-y-auto space-y-1.5 pr-1">
                  {filterOptions?.brands
                    .filter((b) => !brandFilterSearch || b.toLowerCase().includes(brandFilterSearch.trim().toLowerCase()))
                    .map((b) => {
                      const isSelected = selectedBrands.includes(b);
                      return (
                        <label
                          key={b}
                          className="flex items-center gap-2 text-xs text-[#8E8B85] hover:text-[#EDEDEC] cursor-pointer py-0.5"
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelection(b, selectedBrands, setSelectedBrands)}
                            className="rounded bg-[#161616] border-white/[0.1] text-[#C86B3C] focus:ring-0"
                          />
                          <span>{b}</span>
                        </label>
                      );
                    })}
                </div>
              </div>
            )}
          </div>

          {/* 5. Features & Safety */}
          <div className="space-y-2">
            <button
              onClick={() => toggleSection('features')}
              className="w-full flex items-center justify-between text-xs font-medium text-[#EDEDEC]"
            >
              <span>Required Features ({requiredFeatures.length})</span>
              {expandedSections.features ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            {expandedSections.features && (
              <div className="pt-2 space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {filterOptions?.features.map((feat) => {
                  const isSelected = requiredFeatures.includes(feat);
                  return (
                    <label
                      key={feat}
                      className="flex items-center gap-2 text-xs text-[#8E8B85] hover:text-[#EDEDEC] cursor-pointer py-0.5"
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelection(feat, requiredFeatures, setRequiredFeatures)}
                        className="rounded bg-[#161616] border-white/[0.1] text-[#C86B3C] focus:ring-0"
                      />
                      <span className="text-[11px]">{feat}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT AREA: RESULTS GRID */}
        <div className="lg:col-span-8 space-y-6">
          {/* Header Stats Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#111111] border border-white/[0.08] p-4 rounded-xl shadow-sm">
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-[#EDEDEC]">
                <strong className="text-[#FF9D66] text-sm">
                  {searchResponse?.eligible_count ?? 0}
                </strong>{' '}
                Eligible Variants
              </span>
              <span className="text-[#8E8B85] text-xs">•</span>
              <span className="text-xs font-mono text-[#8E8B85]">
                Location: {selectedCity}, {selectedState}
              </span>
            </div>

            {searchResponse && searchResponse.excluded_diagnostics.length > 0 && (
              <button
                onClick={() => setShowExcluded(!showExcluded)}
                className="text-xs font-mono text-[#8E8B85] hover:text-[#EDEDEC] flex items-center gap-1.5 transition-colors"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-[#E5A93C]" />
                <span>
                  {showExcluded ? 'Hide' : 'Show'} Exclusion Diagnostics (
                  {searchResponse.excluded_diagnostics.length})
                </span>
              </button>
            )}
          </div>

          {/* Exclusion Diagnostics Drawer */}
          {showExcluded && searchResponse && searchResponse.excluded_diagnostics.length > 0 && (
            <div className="bg-[#161616] border border-[#E5A93C]/30 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-[#E5A93C]" />
                  <span className="text-xs font-semibold text-[#E5A93C] uppercase tracking-wide">
                    Why Were These Variants Excluded?
                  </span>
                </div>
                <span className="text-[10px] text-[#8E8B85] font-mono">
                  Hard Constraints Rule Filter
                </span>
              </div>
              <div className="max-h-56 overflow-y-auto space-y-2 pr-1 divide-y divide-white/[0.04]">
                {searchResponse.excluded_diagnostics.slice(0, 30).map((ex, idx) => (
                  <div key={idx} className="pt-2 first:pt-0 flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs font-medium text-[#EDEDEC]">{ex.name}</div>
                      <div className="text-[11px] text-[#FF8447]">{ex.reason}</div>
                    </div>
                    <span className="text-[11px] font-mono text-[#8E8B85] shrink-0">
                      {formatPrice(ex.price_inr)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-[#1C1215] border border-[#FF5C67]/40 rounded-xl p-4 text-xs text-[#FF5C67] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Results Grid / List */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(6)].map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : searchResponse?.results.length === 0 ? (
            <div className="bg-[#111111] border border-white/[0.08] rounded-2xl p-12 text-center space-y-3 shadow-lg">
              <div className="w-10 h-10 rounded-full bg-[#161616] border border-white/[0.08] flex items-center justify-center mx-auto text-[#8E8B85]">
                <Info className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-[#EDEDEC]">No Matching Variants Found</h3>
              <p className="text-xs text-[#8E8B85] max-w-sm mx-auto">
                No vehicles matched all hard constraints (e.g. price range, brand, fuel, or features). Try
                loosening some filters to discover more options.
              </p>
              <button
                onClick={resetFilters}
                className="mt-2 px-4 py-1.5 rounded-lg bg-[#161616] hover:bg-[#1F1F1F] border border-white/[0.08] text-xs text-[#FF9D66] font-medium transition-colors"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {searchResponse?.results.map((v) => {
                const isComparing = compareList.some(
                  (c) => (c.variant_id || c.vehicle_id) === (v.variant_id || v.vehicle_id)
                );
                const displayScore = normalizeScore(v.score);

                return (
                  <div
                    key={v.variant_id || v.vehicle_id}
                    className="bg-[#111111] border border-white/[0.08] hover:border-[#C86B3C]/50 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all shadow-md"
                  >
                    {/* Vehicle Identity & Visual */}
                    <div className="flex items-start gap-4">
                      {/* Car Thumbnail */}
                      <div className="w-28 h-20 shrink-0 bg-[#161616] rounded-lg overflow-hidden border border-white/[0.06] relative">
                        <VehicleImage
                          src={getImageUrl(v as ComparisonRecord)}
                          vehicleId={v.variant_id || v.vehicle_id}
                          brand={v.brand}
                          model={v.name}
                          bodyType={v.body_type || v.segment}
                          alt={v.name}
                          className="w-full h-full bg-transparent"
                        />
                        {v.is_city_specific_price && (
                          <span className="absolute bottom-1 right-1 px-1 py-0.5 rounded text-[8px] font-mono bg-[#1F1F1F]/95 text-[#FF9D66] border border-[#C86B3C]/30 font-bold z-10">
                            CITY PRICE
                          </span>
                        )}
                      </div>

                      {/* Details */}
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-mono text-[#FF9D66] uppercase px-1.5 py-0.5 rounded bg-[#C86B3C]/15 border border-[#C86B3C]/30">
                            {v.brand}
                          </span>
                          {v.is_used && (
                            <span className="text-[10px] font-mono text-[#FF9D66] uppercase px-1.5 py-0.5 rounded bg-[#C86B3C]/20 border border-[#C86B3C]/40 font-bold">
                              Pre-Owned
                            </span>
                          )}
                          <h3 className="text-base font-semibold text-[#EDEDEC]">
                            {v.model_name || v.name}{' '}
                            <span className="text-[#8E8B85] font-normal text-xs">
                              {v.variant_name ? `• ${v.variant_name}` : ''}
                            </span>
                          </h3>
                        </div>

                        {/* Location Ex-Showroom / Listed Price */}
                        <div className="flex flex-wrap items-baseline gap-2">
                          <span className="text-lg font-bold font-mono text-[#EDEDEC]">
                            {formatPrice(v.price_inr)}
                          </span>
                          <span className="text-[10px] text-[#8E8B85]">
                            {v.is_used ? 'Listed Price (Pre-Owned)' : (v.price_location_label || 'Ex-Showroom Benchmark')}
                          </span>
                        </div>

                        {/* Specs badges */}
                        <div className="flex flex-wrap items-center gap-2 text-xs text-[#8E8B85]">
                          <div className="px-2 py-0.5 rounded bg-[#161616] text-[11px] font-medium uppercase flex items-center gap-1 border border-white/[0.04]">
                            {getFuelIcon(v.fuel_type)}
                            <span>{v.fuel_type}</span>
                          </div>
                          {v.transmission && (
                            <span className="px-2 py-0.5 rounded bg-[#161616] text-[11px] border border-white/[0.04]">
                              {v.transmission}
                            </span>
                          )}
                          {v.seating_capacity && (
                            <span className="px-2 py-0.5 rounded bg-[#161616] text-[11px] border border-white/[0.04]">
                              {v.seating_capacity} Seater
                            </span>
                          )}
                          {v.ncap_rating && (
                            <span className="px-2 py-0.5 rounded bg-[#161616] text-[11px] text-[#32D583] border border-white/[0.04] flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3" />
                              <span>{v.ncap_rating}★ NCAP</span>
                            </span>
                          )}
                        </div>

                        {/* Verification metadata */}
                        {v.price_last_verified && (
                          <div className="text-[10px] font-mono text-[#8E8B85] flex items-center gap-1 pt-0.5">
                            <Calendar className="w-3 h-3" />
                            <span>Verified {v.price_last_verified} ({v.price_source || 'Verified Source'})</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* AI Score & Action Buttons */}
                    <div className="flex md:flex-col items-end justify-between md:justify-center gap-3 border-t md:border-t-0 pt-3 md:pt-0 border-white/[0.04]">
                      <div className="text-left md:text-right">
                        <div className="text-[10px] text-[#8E8B85] font-mono uppercase tracking-wider">
                          AI Suitability
                        </div>
                        <div className="text-2xl font-bold text-[#FF9D66] font-mono tracking-tight">
                          {displayScore}{' '}
                          <span className="text-xs text-[#8E8B85] font-normal font-sans">/ 100</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleCompare(v)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${isComparing
                              ? 'bg-[#1F1F1F] border-[#C86B3C]/60 text-[#FF9D66]'
                              : 'bg-[#161616] hover:bg-[#1F1F1F] border-white/[0.06] text-[#8E8B85] hover:text-[#EDEDEC]'
                            }`}
                        >
                          {isComparing ? 'Selected' : '+ Compare'}
                        </button>
                        <button
                          onClick={() => setSelectedVariant(v)}
                          className="px-3 py-1.5 rounded-lg bg-[#161616] hover:bg-[#1F1F1F] border border-white/[0.06] text-[#8E8B85] hover:text-[#EDEDEC] text-xs font-medium transition-colors flex items-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Specs</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Pagination Controls */}
              {searchResponse && (searchResponse.total_pages || 1) > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-white/[0.06] mt-6">
                  <span className="text-xs font-mono text-[#8E8B85]">
                    Showing Page <strong className="text-[#EDEDEC]">{currentPage}</strong> of{' '}
                    <strong className="text-[#EDEDEC]">{searchResponse.total_pages}</strong> (
                    {searchResponse.eligible_count} total variants)
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage <= 1 || loading}
                      className="px-3 py-1.5 rounded-lg bg-[#161616] hover:bg-[#1F1F1F] border border-white/[0.06] text-xs font-medium text-[#8E8B85] hover:text-[#EDEDEC] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Previous</span>
                    </button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, searchResponse.total_pages || 1) }, (_, i) => {
                        let pageNum = i + 1;
                        const total = searchResponse.total_pages || 1;
                        if (total > 5 && currentPage > 3) {
                          pageNum = Math.min(total - 4 + i, currentPage - 2 + i);
                        }
                        const isCurrent = pageNum === currentPage;
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`w-7 h-7 rounded-md text-xs font-mono transition-colors ${isCurrent
                                ? 'bg-[#C86B3C] text-white font-bold'
                                : 'bg-[#161616] border border-white/[0.04] text-[#8E8B85] hover:text-[#EDEDEC]'
                              }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => setCurrentPage((p) => Math.min(searchResponse.total_pages || 1, p + 1))}
                      disabled={currentPage >= (searchResponse.total_pages || 1) || loading}
                      className="px-3 py-1.5 rounded-lg bg-[#161616] hover:bg-[#1F1F1F] border border-white/[0.06] text-xs font-medium text-[#8E8B85] hover:text-[#EDEDEC] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                      <span>Next</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Floating Compare Action Bar */}
      {compareList.length > 0 && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 z-40 bg-[#111111] border border-white/[0.15] rounded-xl p-3 px-4 sm:px-5 shadow-2xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Scale className="w-4 h-4 text-[#FF9D66]" />
            <div className="text-xs font-mono text-[#EDEDEC]">
              <span className="font-semibold text-[#FF9D66]">{compareList.length}/4</span> Selected
              to Compare
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCompareList([])}
              className="px-2.5 py-1 text-xs text-[#8E8B85] hover:text-[#FF5C67] transition-colors"
            >
              Clear
            </button>
            <button
              onClick={openCompareModal}
              disabled={compareList.length < 2}
              className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-[#C86B3C] to-[#D97745] hover:from-[#D97745] hover:to-[#FF9D66] text-white font-medium text-xs transition-all shadow-sm disabled:opacity-50"
            >
              Compare Matrix
            </button>
          </div>
        </div>
      )}

      {/* Side-by-Side Comparison Modal (Up to 4 vehicles) */}
      {showCompareModal && (
        <div
          className="fixed inset-0 z-50 bg-[#0A0A0A]/85 backdrop-blur-md flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Vehicle comparison"
        >
          <div className="bg-[#111111] border border-white/[0.12] rounded-2xl p-6 sm:p-8 max-w-5xl w-full max-h-[90vh] overflow-y-auto space-y-6 shadow-2xl relative">
            <button
              onClick={() => setShowCompareModal(false)}
              className="absolute top-5 right-5 p-1.5 rounded-md text-[#8E8B85] hover:text-[#EDEDEC] hover:bg-[#161616] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1">
              <div className="text-xs font-mono uppercase text-[#FF9D66]">Decision Matrix</div>
              <h3 className="text-xl font-bold text-[#EDEDEC]">
                Multi-Variant Comparison ({selectedCity}, {selectedState})
              </h3>
            </div>

            {comparingLoading ? (
              <div className="py-12 text-center text-xs text-[#8E8B85]">Loading comparison...</div>
            ) : compareError ? (
              <div className="py-12 text-center space-y-3">
                <AlertTriangle className="w-5 h-5 text-[#FF5C67] mx-auto" />
                <p className="text-xs text-[#FF5C67]">{compareError}</p>
                <button
                  type="button"
                  onClick={openCompareModal}
                  className="px-3 py-1.5 rounded-lg bg-[#161616] border border-white/[0.08] text-xs text-[#FF9D66]"
                >
                  Retry
                </button>
              </div>
            ) : compareData.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#8E8B85]">No comparison data returned.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/[0.08] text-[#8E8B85]">
                      <th className="p-3 w-40 font-mono uppercase font-normal">Spec / Factor</th>
                      {compareData.map((c) => (
                        <th key={getRecordId(c)} className="p-3 font-semibold text-[#EDEDEC] min-w-44">
                          <div className="space-y-1">
                            <div className="text-[10px] text-[#FF9D66] uppercase font-mono">{c.brand}</div>
                            <div className="text-sm">{c.model_name}</div>
                            <div className="text-[11px] text-[#8E8B85] font-normal">{c.variant_name}</div>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04] text-[#8E8B85]">
                    <tr>
                      <td className="p-3 text-[#8E8B85] font-medium">Ex-Showroom / Listed Price</td>
                      {compareData.map((c) => (
                        <td key={getRecordId(c)} className="p-3 font-mono font-bold text-[#EDEDEC] text-sm">
                          {formatPrice(c.price_inr)} {c.is_used ? '(Listed)' : ''}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-3 text-[#8E8B85]">Fuel / Powertrain</td>
                      {compareData.map((c) => (
                        <td key={getRecordId(c)} className="p-3 uppercase font-medium text-[#EDEDEC]">
                          {c.fuel_type}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-3 text-[#8E8B85]">Transmission</td>
                      {compareData.map((c) => (
                        <td key={getRecordId(c)} className="p-3 text-[#EDEDEC]">
                          {getAvailabilityText(c.transmission)}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-3 text-[#8E8B85]">Engine / Power</td>
                      {compareData.map((c) => (
                        <td key={getRecordId(c)} className="p-3 text-[#EDEDEC]">
                          {c.engine_cc ? `${c.engine_cc}cc` : '-'} • {c.power_bhp ? `${c.power_bhp} bhp` : '-'}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-3 text-[#8E8B85]">Torque</td>
                      {compareData.map((c) => (
                        <td key={getRecordId(c)} className="p-3 text-[#EDEDEC]">
                          {c.torque_nm ? `${c.torque_nm} Nm` : '-'}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-3 text-[#8E8B85]">Boot Space</td>
                      {compareData.map((c) => (
                        <td key={getRecordId(c)} className="p-3 text-[#EDEDEC]">
                          {c.boot_space_litres ? `${c.boot_space_litres} Litres` : '-'}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-3 text-[#8E8B85]">Ground Clearance</td>
                      {compareData.map((c) => (
                        <td key={getRecordId(c)} className="p-3 text-[#EDEDEC]">
                          {c.ground_clearance_mm ? `${c.ground_clearance_mm} mm` : '-'}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-3 text-[#8E8B85]">Safety &amp; NCAP</td>
                      {compareData.map((c) => (
                        <td key={getRecordId(c)} className="p-3 text-[#32D583] font-medium">
                          {c.ncap_rating ? `${c.ncap_rating}★ NCAP` : 'NCAP not rated'} • {c.airbags != null ? `${c.airbags} Airbags` : 'Airbags not specified'}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-3 text-[#8E8B85]">ADAS &amp; 360 Camera</td>
                      {compareData.map((c) => (
                        <td key={getRecordId(c)} className="p-3 text-[#EDEDEC]">
                          {c.has_adas == null ? 'ADAS not specified' : c.has_adas ? 'ADAS available' : 'No ADAS'} • {c.has_360_camera == null ? '360° camera not specified' : c.has_360_camera ? '360° Cam' : 'No 360° camera'}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-3 text-[#8E8B85]">Key Features</td>
                      {compareData.map((c) => (
                        <td key={getRecordId(c)} className="p-3 text-[#8E8B85]">
                          <ul className="space-y-0.5 text-[11px]">
                            {c.features?.slice(0, 4).map((f: string, i: number) => (
                              <li key={i} className="flex items-center gap-1">
                                <Check className="w-3 h-3 text-[#32D583]" />
                                <span>{f}</span>
                              </li>
                            ))}
                          </ul>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Detailed Variant Spec Modal */}
      {selectedVariant && (
        <div
          className="fixed inset-0 z-50 bg-[#0A0A0A]/85 backdrop-blur-md flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Vehicle specifications"
        >
          <div className="bg-[#111111] border border-white/[0.12] rounded-2xl p-6 sm:p-8 max-w-xl w-full max-h-[85vh] overflow-y-auto space-y-6 shadow-2xl relative">
            <button
              onClick={() => setSelectedVariant(null)}
              className="absolute top-5 right-5 p-1.5 rounded-md text-[#8E8B85] hover:text-[#EDEDEC] hover:bg-[#161616] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1">
              <div className="text-xs font-mono uppercase text-[#FF9D66]">{selectedVariant.brand}</div>
              <h3 className="text-xl font-bold text-[#EDEDEC]">
                {selectedVariant.model_name || selectedVariant.name}{' '}
                <span className="text-[#8E8B85] text-base font-normal">
                  {selectedVariant.variant_name}
                </span>
              </h3>
              <p className="text-xs text-[#8E8B85]">
                {formatPrice(selectedVariant.price_inr)} •{' '}
                {selectedVariant.is_used ? 'Listed Price' : (selectedVariant.price_location_label || 'Ex-Showroom')}
              </p>
            </div>

            {/* Visual */}
            <div className="w-full h-48 bg-[#161616] rounded-xl overflow-hidden border border-white/[0.08] flex items-center justify-center p-2">
              <VehicleImage
                src={getImageUrl(selectedVariant as ComparisonRecord)}
                vehicleId={selectedVariant.variant_id || selectedVariant.vehicle_id}
                brand={selectedVariant.brand}
                model={selectedVariant.name}
                variant={selectedVariant.variant_name}
                bodyType={selectedVariant.body_type || selectedVariant.segment}
                alt={selectedVariant.name}
                className="w-full h-full bg-transparent"
                showAttribution={true}
              />
            </div>

            {/* Key Technical Specs */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-[#161616] border border-white/[0.04]">
                <span className="text-[#8E8B85] block text-[10px]">Powertrain</span>
                <span className="font-semibold text-[#EDEDEC] uppercase">{selectedVariant.fuel_type}</span>
              </div>
              <div className="p-3 rounded-lg bg-[#161616] border border-white/[0.04]">
                <span className="text-[#8E8B85] block text-[10px]">Transmission</span>
                <span className="font-semibold text-[#EDEDEC]">{getAvailabilityText(selectedVariant.transmission)}</span>
              </div>
              <div className="p-3 rounded-lg bg-[#161616] border border-white/[0.04]">
                <span className="text-[#8E8B85] block text-[10px]">Engine &amp; Power</span>
                <span className="font-semibold text-[#EDEDEC]">
                  {selectedVariant.engine_cc ? `${selectedVariant.engine_cc}cc` : '-'} •{' '}
                  {selectedVariant.power_bhp ? `${selectedVariant.power_bhp} bhp` : '-'}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-[#161616] border border-white/[0.04]">
                <span className="text-[#8E8B85] block text-[10px]">Torque</span>
                <span className="font-semibold text-[#EDEDEC]">
                  {selectedVariant.torque_nm ? `${selectedVariant.torque_nm} Nm` : '-'}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-[#161616] border border-white/[0.04]">
                <span className="text-[#8E8B85] block text-[10px]">Boot Space</span>
                <span className="font-semibold text-[#EDEDEC]">
                  {selectedVariant.boot_space_litres ? `${selectedVariant.boot_space_litres} L` : '-'}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-[#161616] border border-white/[0.04]">
                <span className="text-[#8E8B85] block text-[10px]">Safety Rating</span>
                <span className="font-semibold text-[#32D583]">
                  {selectedVariant.ncap_rating ? `${selectedVariant.ncap_rating}★ NCAP` : 'Not Tested'}
                </span>
              </div>
            </div>

            {/* Features */}
            {selectedVariant.features && selectedVariant.features.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-mono uppercase text-[#8E8B85]">Standard Features</div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedVariant.features.map((feat, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded bg-[#161616] text-[11px] text-[#8E8B85] border border-white/[0.04]"
                    >
                      {feat}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Pros & Cons if available */}
            {selectedVariant.positive_factors && selectedVariant.positive_factors.length > 0 && (
              <div className="space-y-1.5 pt-2 border-t border-white/[0.04]">
                <div className="text-xs font-mono uppercase text-[#32D583]">Key Strengths</div>
                <ul className="text-xs text-[#8E8B85] space-y-1">
                  {selectedVariant.positive_factors.map((p, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-[#32D583] mt-0.5">•</span>
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

