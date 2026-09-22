import React, { useMemo } from 'react';
import type { VehicleRanking, Vehicle, UserProfile, SelectedLocation } from '../types';
import { VehicleCard } from '../components/VehicleCard';
import { 
  MapPin, 
  RotateCcw,
  Zap,
  ArrowRight,
  Sliders,
  CheckCircle2
} from 'lucide-react';

interface DiscoverTabProps {
  rankings: VehicleRanking[];
  vehicles: Vehicle[];
  userProfile: UserProfile;
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  onInspectVehicle: (vehicleId: string) => void;
  onToggleCompare: (vehicleId: string) => void;
  compareSlots: string[];
  selectedLocation: SelectedLocation;
  demoMode: boolean;
  onOpenQuestionnaire: () => void;
  onLogTelemetry: (msg: string) => void;
  loading: boolean;
  onRecalculate: () => void;
}

interface QuestionDef {
  id: keyof UserProfile;
  text: string;
  type: 'select' | 'number';
  placeholder?: string;
  prefix?: string;
  suffix?: string;
  options?: { label: string; value: any }[];
}

const QUESTION_DEFINITIONS: QuestionDef[] = [
  {
    id: 'first_time_owner',
    text: 'Are you a first-time vehicle owner?',
    type: 'select',
    options: [
      { label: 'Yes, first vehicle', value: true },
      { label: 'No, experienced owner', value: false }
    ]
  },
  {
    id: 'experience',
    text: 'What is your driving experience level?',
    type: 'select',
    options: [
      { label: 'Beginner / Learner', value: 'beginner' },
      { label: 'Intermediate', value: 'intermediate' },
      { label: 'Experienced / Expert', value: 'experienced' }
    ]
  },
  {
    id: 'daily_distance',
    text: 'Average daily driving distance?',
    type: 'number',
    placeholder: 'e.g. 40',
    suffix: 'km'
  },
  {
    id: 'driving_frequency',
    text: 'How frequently will you drive this vehicle?',
    type: 'select',
    options: [
      { label: 'Daily Commute', value: 'daily' },
      { label: '3-4 times a week', value: 'frequent' },
      { label: 'Weekend / Occasional', value: 'occasional' }
    ]
  },
  {
    id: 'driving_environment',
    text: 'Primary driving environment?',
    type: 'select',
    options: [
      { label: 'City Commute Only', value: 'city' },
      { label: 'Mixed (City + Highway)', value: 'mixed' },
      { label: 'Highway / Intercity', value: 'highway' }
    ]
  },
  {
    id: 'long_distance_frequency',
    text: 'Frequency of long-distance trips (>300km)?',
    type: 'select',
    options: [
      { label: 'Rarely / Never', value: 'rare' },
      { label: 'Monthly', value: 'occasional' },
      { label: 'Weekly / Frequent', value: 'frequent' }
    ]
  },
  {
    id: 'purchase_budget',
    text: 'Maximum on-road budget (INR)?',
    type: 'number',
    placeholder: 'e.g. 1500000',
    prefix: '₹'
  },
  {
    id: 'running_cost_importance',
    text: 'Low running cost (fuel/EV efficiency) priority?',
    type: 'select',
    options: [
      { label: 'Crucial (Lowest per-km cost)', value: 'very_high' },
      { label: 'High Priority', value: 'high' },
      { label: 'Moderate Priority', value: 'medium' },
      { label: 'Low Priority', value: 'low' }
    ]
  },
  {
    id: 'maintenance_importance',
    text: 'Maintenance & servicing cost preference?',
    type: 'select',
    options: [
      { label: 'Low & predictable maintenance', value: 'very_high' },
      { label: 'Standard maintenance acceptable', value: 'medium' },
      { label: 'High performance / Premium ok', value: 'low' }
    ]
  },
  {
    id: 'vehicle_condition_preference',
    text: 'Vehicle condition preference?',
    type: 'select',
    options: [
      { label: 'Brand New Only', value: 'new_only' },
      { label: 'Prefer New', value: 'prefer_new' },
      { label: 'Used / Pre-owned OK', value: 'prefer_used' },
      { label: 'Either (Best Value)', value: 'no_preference' }
    ]
  },
  {
    id: 'transmission_preference',
    text: 'Preferred transmission type?',
    type: 'select',
    options: [
      { label: 'Automatic (AMT/CVT/DCT)', value: 'automatic' },
      { label: 'Manual Transmission', value: 'manual' },
      { label: 'No Preference', value: 'unknown' }
    ]
  },
  {
    id: 'performance_importance',
    text: 'Engine power & performance importance?',
    type: 'select',
    options: [
      { label: 'High Performance & Quick Acceleration', value: 'very_high' },
      { label: 'Adequate / Balanced Power', value: 'medium' },
      { label: 'Efficiency Over Performance', value: 'low' }
    ]
  },
  {
    id: 'seating_requirement',
    text: 'Seating capacity requirement?',
    type: 'select',
    options: [
      { label: '4-Seater (Compact)', value: 4 },
      { label: '5-Seater (Standard)', value: 5 },
      { label: '7-Seater (Family/3-Row)', value: 7 }
    ]
  },
  {
    id: 'boot_space_need',
    text: 'Boot space / luggage capacity need?',
    type: 'select',
    options: [
      { label: 'Large (350L+ luggage/travel)', value: 'large' },
      { label: 'Moderate (250-350L standard)', value: 'medium' },
      { label: 'Minimal (City bags)', value: 'small' }
    ]
  },
  {
    id: 'ground_clearance_need',
    text: 'Ground clearance / rough road need?',
    type: 'select',
    options: [
      { label: 'High (180mm+ for rough roads/potholes)', value: 'high' },
      { label: 'Standard (160-180mm city/highway)', value: 'medium' },
      { label: 'Low / Sports stance OK', value: 'low' }
    ]
  }
];

export const DiscoverTab: React.FC<DiscoverTabProps> = ({
  rankings,
  vehicles,
  userProfile,
  setUserProfile,
  onInspectVehicle,
  onToggleCompare,
  compareSlots,
  selectedLocation,
  onLogTelemetry,
  onRecalculate
}) => {
  const handleOptionSelect = (field: keyof UserProfile, value: any) => {
    setUserProfile((prev) => ({
      ...prev,
      [field]: value,
    }));
    onLogTelemetry(`QUESTIONNAIRE_INPUT: ${field} = ${JSON.stringify(value)}`);
  };

  const answeredCount = useMemo(() => {
    return QUESTION_DEFINITIONS.filter(q => {
      const val = userProfile[q.id];
      if (Array.isArray(val)) return val.length > 0;
      return val !== undefined && val !== null && val !== '';
    }).length;
  }, [userProfile]);

  const handleCompute = () => {
    onLogTelemetry(`INFERENCE_TRIGGER: Processing recommendations for ${answeredCount}/15 answered questions.`);
    onRecalculate();
    const elem = document.getElementById('recommendations-section');
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleResetAll = () => {
    setUserProfile(prev => ({
      ...prev,
      first_time_owner: undefined,
      experience: undefined,
      driving_confidence: undefined,
      daily_distance: undefined,
      driving_frequency: undefined,
      driving_environment: undefined,
      long_distance_frequency: undefined,
      purchase_budget: undefined,
      running_cost_importance: undefined,
      maintenance_importance: undefined,
      transmission_preference: undefined,
      performance_importance: undefined,
      seating_requirement: undefined,
      boot_space_need: undefined,
      ground_clearance_need: undefined,
      parking: undefined,
      charging_knowledge: undefined,
      fuel_station_access: undefined,
      environmental_preference: undefined,
      vehicle_condition_preference: undefined,
    }));
    onLogTelemetry('QUESTIONNAIRE_RESET: Cleared all profile choices.');
    onRecalculate();
  };

  return (
    <div className="flex flex-col w-full px-4 lg:px-10 py-6 gap-8">
      
      {/* Top Questionnaire Header & Status */}
      <div className="flex flex-col gap-4 border-b border-viq-outline-variant/30 pb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-jakarta text-2xl lg:text-3xl font-extrabold text-viq-on-surface tracking-tight flex items-center gap-3">
              <Sliders className="w-7 h-7 text-[#0066FF]" />
              <span>Vehicle Selection Questionnaire</span>
            </h1>
            <div className="flex items-center gap-3 mt-2 font-mono text-xs text-viq-on-surface-variant">
              <span className="font-semibold text-viq-on-surface">15 Questions</span>
              <span>•</span>
              <span className={answeredCount === 15 ? "text-viq-primary font-bold" : "text-viq-on-surface-variant font-medium"}>
                {answeredCount} / 15 answered
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={handleResetAll}
              className="px-4 py-2.5 rounded-xl border border-viq-outline-variant/40 hover:bg-viq-surface-container text-viq-on-surface-variant hover:text-viq-on-surface font-jakarta text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Answers</span>
            </button>

            <button
              type="button"
              onClick={handleCompute}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#C86B3C] to-[#E68A57] hover:brightness-110 text-white font-jakarta text-xs font-bold uppercase tracking-wider transition-all shadow-md flex items-center gap-2 cursor-pointer"
            >
              <Zap className="w-4 h-4" />
              <span>Compute Recommendations</span>
            </button>
          </div>
        </div>
      </div>

      {/* 15 Questions Grid - Primary Visible Interface */}
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {QUESTION_DEFINITIONS.map((q, index) => {
            const currentValue = userProfile[q.id];
            const isAnswered = currentValue !== undefined && currentValue !== null && currentValue !== '';

            return (
              <div 
                key={q.id} 
                className={`flex flex-col gap-3 p-5 rounded-2xl border transition-all ${
                  isAnswered 
                    ? 'border border-viq-outline-variant/40 bg-viq-surface-container-low' 
                    : 'border border-viq-primary-container/40 bg-viq-surface-container-low/90 shadow-[0_0_15px_rgba(0,102,255,0.04)]'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <label className="font-jakarta text-sm font-bold text-viq-on-surface flex items-start gap-2.5 leading-snug">
                    <span className={`flex items-center justify-center w-5 h-5 rounded-full text-[11px] font-mono shrink-0 ${
                      isAnswered ? 'bg-[#0066FF] text-white font-bold' : 'bg-viq-surface-container-high text-viq-on-surface-variant'
                    }`}>
                      {index + 1}
                    </span>
                    <span>{q.text}</span>
                  </label>
                  {isAnswered && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  )}
                </div>

                {/* Input Controls */}
                {q.type === 'number' ? (
                  <div className="flex flex-col gap-1.5 mt-1">
                    <div className="relative">
                      {q.prefix && (
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-viq-on-surface-variant font-mono text-sm">{q.prefix}</span>
                      )}
                      <input
                        type="number"
                        min="0"
                        placeholder={q.placeholder}
                        value={currentValue !== undefined ? (currentValue as number) : ''}
                        onChange={(e) => handleOptionSelect(q.id, e.target.value ? Number(e.target.value) : undefined)}
                        className={`w-full bg-viq-surface-container border border-viq-outline-variant/50 rounded-xl py-2.5 text-xs text-viq-on-surface font-mono outline-none focus:border-[#0066FF] transition-colors ${
                          q.prefix ? 'pl-7 pr-3' : q.suffix ? 'pl-3 pr-10' : 'px-3'
                        }`}
                      />
                      {q.suffix && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-viq-on-surface-variant font-mono text-xs">{q.suffix}</span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2 mt-1">
                    {q.options?.map((opt) => {
                      const isSelected = currentValue === opt.value;
                      return (
                        <button
                          type="button"
                          key={String(opt.value)}
                          onClick={() => handleOptionSelect(q.id, opt.value)}
                          className={`p-2.5 rounded-xl border text-left font-jakarta text-xs transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#0066FF]/20 border-[#0066FF] text-white font-bold shadow-sm'
                              : 'bg-viq-surface-container border-viq-outline-variant/30 text-viq-on-surface-variant hover:text-viq-on-surface hover:border-viq-outline-variant/60'
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom Questionnaire Submit Action Bar */}
        <div className="bg-viq-surface-container-low border border-viq-outline-variant/40 p-5 rounded-2xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 mt-2">
          <div>
            <h3 className="font-jakarta text-base font-bold text-viq-on-surface">
              Completed {answeredCount} of 15 Questions
            </h3>
            <p className="font-jakarta text-xs text-viq-on-surface-variant mt-0.5 font-mono">
              Click below to calculate and update your personalized vehicle recommendations.
            </p>
          </div>

          <button
            type="button"
            onClick={handleCompute}
            disabled={loading}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-[#C86B3C] to-[#E68A57] hover:brightness-110 text-white font-jakarta text-xs font-bold uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 disabled:cursor-wait"
          >
            {loading ? (
              <div className="animate-spin w-4 h-4 border-2 border-white/50 border-t-white rounded-full"></div>
            ) : (
              <Zap className="w-4 h-4" />
            )}
            <span>{loading ? 'Analyzing Data & Scoring...' : 'Compute Recommendations'}</span>
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Recommended Vehicles Section */}
      <div id="recommendations-section" className="flex flex-col gap-6 pt-6 border-t border-viq-outline-variant/30">
        
        {/* Regional City Card Header */}
        <div className="bg-viq-surface-container-low rounded-2xl p-4 border border-viq-outline-variant/40 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-viq-surface-container text-viq-primary">
              <MapPin className="w-5 h-5 text-viq-primary" />
            </div>
            <div>
              <span className="font-mono text-xs font-bold text-viq-on-surface">
                {selectedLocation.city} ({selectedLocation.code})
              </span>
              <p className="font-jakarta text-xs text-viq-on-surface-variant">
                On-road prices will be calculated for your city
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              const el = document.querySelector('[aria-label="Select city"]') as HTMLElement;
              if (el) el.click();
            }}
            className="px-4 py-2 rounded-xl border border-viq-outline-variant/60 hover:bg-viq-surface-container text-viq-on-surface font-mono text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer"
          >
            Change City
          </button>
        </div>

        {/* Recommended Vehicles Section Title */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-jakarta text-xl font-bold text-viq-on-surface">
              Recommended Vehicles
            </h2>
            <p className="font-jakarta text-xs text-viq-on-surface-variant mt-0.5">
              Based on your profile and questionnaire responses
            </p>
          </div>
        </div>

        {/* Grid of Vehicle Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {rankings.length > 0 ? (
            rankings.slice(0, 6).map((rnk, idx) => (
              <VehicleCard
                key={rnk.vehicle_id || idx}
                ranking={rnk}
                rankIndex={idx}
                onInspect={onInspectVehicle}
                onToggleCompare={onToggleCompare}
                isCompared={compareSlots.includes(rnk.vehicle_id || rnk.name)}
                selectedLocation={selectedLocation}
              />
            ))
          ) : (
            vehicles.slice(0, 6).map((veh, idx) => (
              <VehicleCard
                key={veh.id || idx}
                vehicle={veh}
                rankIndex={idx}
                onInspect={onInspectVehicle}
                onToggleCompare={onToggleCompare}
                isCompared={compareSlots.includes(veh.id || veh.name)}
                selectedLocation={selectedLocation}
              />
            ))
          )}
        </div>

      </div>

    </div>
  );
};

