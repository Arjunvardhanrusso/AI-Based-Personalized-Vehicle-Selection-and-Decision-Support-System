import {
  AlertCircle,
  Armchair,
  ChevronLeft,
  ChevronRight,
  Coins,
  Gauge,
  IndianRupee,
  Info,
  Leaf,
  Navigation,
  RotateCcw,
  Wrench,
  Zap
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchQuestions } from '../services/api';
import type { UserProfile } from '../types';

interface QuestionnairePageProps {
  userProfile: UserProfile;
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  demoMode: boolean;
}

const PRIORITY_ITEMS = [
  {
    key: 'priority_running_cost',
    title: 'Low Running Cost',
    desc: 'Lowest energy or fuel expense per kilometer',
    Icon: Gauge,
  },
  {
    key: 'priority_maintenance',
    title: 'Low Maintenance Burden',
    desc: 'Predictable servicing costs and parts availability',
    Icon: Wrench,
  },
  {
    key: 'priority_performance',
    title: 'Engine Responsiveness & Power',
    desc: 'Strong acceleration and highway overtaking reserve',
    Icon: Zap,
  },
  {
    key: 'priority_environment',
    title: 'Environmental Impact',
    desc: 'Minimal emissions and sustainable powertrain tech',
    Icon: Leaf,
  },
  {
    key: 'priority_purchase_price',
    title: 'Initial Purchase Affordability',
    desc: 'Maximum acquisition value within allocated capital',
    Icon: Coins,
  },
  {
    key: 'priority_long_distance',
    title: 'Long-Distance Capability',
    desc: 'Intercity endurance, quick refueling and highway poise',
    Icon: Navigation,
  },
  {
    key: 'priority_comfort',
    title: 'Ride Quality & Quietness',
    desc: 'Compliant suspension, acoustic insulation and ergonomic ease',
    Icon: Armchair,
  },
] as const;

export const QuestionnairePage: React.FC<QuestionnairePageProps> = ({
  userProfile,
  setUserProfile,
  demoMode,
}) => {
  const navigate = useNavigate();
  const [steps, setSteps] = useState<any[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Track Top 3 Priorities in order [1st, 2nd, 3rd]
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>(() => {
    const entries = PRIORITY_ITEMS.map((item) => ({
      key: item.key,
      weight: Number(userProfile[item.key as keyof UserProfile] || 0.2),
    }));
    entries.sort((a, b) => b.weight - a.weight);
    return entries.filter((e) => e.weight > 0.3).slice(0, 3).map((e) => e.key);
  });

  useEffect(() => {
    let active = true;

    fetchQuestions()
      .then((data) => {
        if (!active) return;
        setSteps(Array.isArray(data?.steps) ? data.steps : []);
      })
      .catch((err) => {
        if (!active) return;
        console.error(err);
        setLoadError('Unable to load the questionnaire. Please retry.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const currentStep = steps[currentStepIndex];

  const updateProfileField = (field: keyof UserProfile, value: any) => {
    setUserProfile((prev) => ({ ...prev, [field]: value }));
  };

  const handleTogglePriority = (key: string) => {
    let next: string[];
    if (selectedPriorities.includes(key)) {
      next = selectedPriorities.filter((k) => k !== key);
    } else {
      if (selectedPriorities.length >= 3) {
        next = [...selectedPriorities.slice(0, 2), key];
      } else {
        next = [...selectedPriorities, key];
      }
    }
    setSelectedPriorities(next);

    const weights: Record<string, number> = {
      priority_running_cost: 0.2,
      priority_maintenance: 0.2,
      priority_performance: 0.2,
      priority_environment: 0.2,
      priority_purchase_price: 0.2,
      priority_long_distance: 0.2,
      priority_comfort: 0.2,
    };

    if (next[0]) weights[next[0]] = 1.0;
    if (next[1]) weights[next[1]] = 0.75;
    if (next[2]) weights[next[2]] = 0.50;

    setUserProfile((prev) => ({ ...prev, ...weights }));
  };

  const handleResetPriorities = () => {
    setSelectedPriorities([]);
    setUserProfile((prev) => ({
      ...prev,
      priority_running_cost: 0.2,
      priority_maintenance: 0.2,
      priority_performance: 0.2,
      priority_environment: 0.2,
      priority_purchase_price: 0.2,
      priority_long_distance: 0.2,
      priority_comfort: 0.2,
    }));
  };

  const handleNext = () => {
    setValidationError(null);

    if (isPrioritiesStep && selectedPriorities.length === 0) {
      setValidationError('Select at least one priority before continuing.');
      return;
    }

    if (!isPrioritiesStep) {
      const unanswered = (currentStep?.questions || []).filter((q: any) => {
        if (q.required === false) return false;
        const value = userProfile[q.maps_to as keyof UserProfile];
        return value === undefined || value === null || value === '' ||
          (Array.isArray(value) && value.length === 0);
      });

      if (unanswered.length > 0) {
        setValidationError('Please answer the required questions before continuing.');
        return;
      }
    }

    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      navigate('/review');
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-[#C86B3C] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#111111] p-6 text-center">
          <h1 className="text-base font-semibold text-[#EDEDEC]">Questionnaire unavailable</h1>
          <p className="mt-2 text-sm text-[#8E8B85]">{loadError}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-5 rounded-xl bg-[#C86B3C] px-4 py-2.5 text-xs font-semibold text-white"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!currentStep) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="rounded-2xl border border-white/[0.08] bg-[#111111] px-6 py-5 text-sm text-[#8E8B85]">
          No questionnaire steps are available.
        </div>
      </div>
    );
  }

  const isPrioritiesStep = currentStep.id === 'priorities' || currentStep.type === 'top_3_priorities';

  return (
    <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 space-y-10">
      {/* Progress & Step Metadata */}
      <div className="space-y-3">
        {demoMode && (
          <div className="flex items-center justify-between rounded-lg border border-[#C86B3C]/20 bg-[#C86B3C]/5 px-3 py-2">
            <span className="text-[9px] font-mono uppercase tracking-wider text-[#C86B3C]">AI Demonstration Mode</span>
            <span className="text-[9px] font-mono text-[#8E8B85]">Inference trace enabled</span>
          </div>
        )}
        <div className="flex items-center justify-between text-xs text-[#8E8B85] font-mono uppercase tracking-wider">
          <span>Step {String(currentStepIndex + 1).padStart(2, '0')} / {String(steps.length).padStart(2, '0')}</span>
          <span>{currentStep.title}</span>
        </div>

        {/* Subtle, Linear-level Progress Bar */}
        <div className="w-full bg-[#161616] h-1.5 rounded-full overflow-hidden border border-white/[0.04]">
          <div
            className="bg-gradient-to-r from-[#C86B3C] to-[#FF9D66] h-full transition-all duration-300 ease-out"
            style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Main Form Content Container */}
      <div className="bg-[#111111] border border-white/[0.08] rounded-2xl p-6 sm:p-10 space-y-8 shadow-xl">
        <div className="space-y-2 border-b border-white/[0.06] pb-6">
          <h1 className="text-2xl font-bold tracking-tight text-[#EDEDEC]">
            {currentStep.title}
          </h1>
          <p className="text-sm text-[#8E8B85] leading-relaxed">
            {currentStep.description}
          </p>
        </div>

        {/* Priority Top 3 Selector UI */}
        {isPrioritiesStep ? (
          <div className="space-y-8">
            {/* Top 3 Slots */}
            <div className="bg-[#161616] border border-white/[0.06] rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase text-[#A7B0BE] tracking-wider">
                  Ranked Priority Weighting ({selectedPriorities.length}/3 Assigned)
                </span>
                {selectedPriorities.length > 0 && (
                  <button
                    type="button"
                    onClick={handleResetPriorities}
                    className="text-xs text-[#8E8B85] hover:text-[#FF5C67] flex items-center gap-1.5 transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Clear all</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { rank: '01', weight: '100% Weight', rankLabel: 'Primary' },
                  { rank: '02', weight: '75% Weight', rankLabel: 'Secondary' },
                  { rank: '03', weight: '50% Weight', rankLabel: 'Tertiary' },
                ].map((slot, idx) => {
                  const key = selectedPriorities[idx];
                  const item = PRIORITY_ITEMS.find((p) => p.key === key);

                  return (
                    <div
                      key={slot.rank}
                      onClick={() => key && handleTogglePriority(key)}
                      className={`p-4 rounded-xl border transition-all flex flex-col justify-between min-h-[96px] ${item
                          ? 'bg-[#1F1F1F] border-[#C86B3C]/60 cursor-pointer text-[#EDEDEC] shadow-sm'
                          : 'border-dashed border-white/[0.08] bg-[#111111] text-[#697386]'
                        }`}
                    >
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className={item ? 'text-[#FF9D66] font-semibold' : 'text-[#697386]'}>
                          {slot.rank} • {slot.rankLabel}
                        </span>
                        {item && <span className="text-[11px] text-[#8E8B85] hover:text-[#FF5C67]">✕</span>}
                      </div>

                      {item ? (
                        <div className="mt-2">
                          <div className="text-sm font-semibold text-[#EDEDEC] flex items-center gap-2">
                            <item.Icon className="w-3.5 h-3.5 text-[#FF9D66]" />
                            <span>{item.title}</span>
                          </div>
                          <div className="text-[11px] font-mono text-[#8E8B85] mt-0.5">{slot.weight}</div>
                        </div>
                      ) : (
                        <div className="mt-3 text-xs text-[#697386]">
                          Select from options below
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Selection Options List */}
            <div className="space-y-3">
              <label className="block text-xs font-mono uppercase text-[#8E8B85] tracking-wider">
                Select your Top 3 priorities in order:
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {PRIORITY_ITEMS.map((item) => {
                  const indexInTop3 = selectedPriorities.indexOf(item.key);
                  const isSelected = indexInTop3 !== -1;
                  const rankNumber = indexInTop3 + 1;
                  const IconComponent = item.Icon;

                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => handleTogglePriority(item.key)}
                      className={`p-4 rounded-xl text-left border transition-all flex items-start justify-between gap-3 ${isSelected
                          ? 'bg-[#1F1F1F] border-[#C86B3C]/60 text-[#EDEDEC]'
                          : 'bg-[#161616] border-white/[0.06] hover:border-white/[0.12] text-[#8E8B85] hover:text-[#EDEDEC]'
                        }`}
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2">
                          <IconComponent className={`w-4 h-4 ${isSelected ? 'text-[#FF9D66]' : 'text-[#8E8B85]'}`} />
                          <span className="text-sm font-semibold text-[#EDEDEC]">{item.title}</span>
                        </div>
                        <p className="text-xs text-[#8E8B85] leading-relaxed">{item.desc}</p>
                      </div>

                      <div className="shrink-0 pt-0.5">
                        {isSelected ? (
                          <span className="w-6 h-6 rounded-md bg-[#C86B3C] text-white font-mono text-xs font-bold flex items-center justify-center">
                            0{rankNumber}
                          </span>
                        ) : (
                          <span className="w-6 h-6 rounded-md border border-white/[0.08] text-[#8E8B85] flex items-center justify-center text-xs">
                            +
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          /* Standard Questions */
          <div className="space-y-8">
            {currentStep.questions && currentStep.questions.map((q: any) => {
              const val = userProfile[q.maps_to as keyof UserProfile];
              const isBudgetQuestion = q.maps_to === 'purchase_budget';

              return (
                <div key={q.id} className="space-y-4">
                  <label className="block text-base font-semibold text-[#EDEDEC]">
                    {q.text}
                  </label>

                  {/* Special Custom Numeric Budget Input */}
                  {isBudgetQuestion && (
                    <div className="p-4 bg-[#161616] border border-white/[0.08] rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono uppercase text-[#8E8B85] tracking-wider">
                          Exact Budget Amount (INR)
                        </span>
                        {val && (
                          <span className="text-xs font-mono text-[#FF9D66] font-semibold">
                            ₹{Number(val).toLocaleString('en-IN')} ({
                              Number(val) < 100000
                                ? `₹${(Number(val) / 1000).toFixed(0)}K`
                                : Number(val) < 10000000
                                  ? `₹${(Number(val) / 100000).toFixed(2)} Lakh`
                                  : `₹${(Number(val) / 10000000).toFixed(2)} Cr`
                            })
                          </span>
                        )}
                      </div>

                      <div className="relative flex items-center">
                        <div className="absolute left-3.5 text-[#8E8B85] flex items-center pointer-events-none">
                          <IndianRupee className="w-4 h-4" />
                        </div>
                        <input
                          type="number"
                          placeholder="e.g. 50000, 450000, 1200000"
                          value={typeof val === 'number' ? val : (typeof val === 'string' ? val : '')}
                          onChange={(e) => {
                            const num = Number(e.target.value);
                            updateProfileField(q.maps_to, num > 0 ? num : 0);
                          }}
                          className="w-full bg-[#111111] border border-white/[0.1] rounded-lg py-2.5 pl-9 pr-4 text-sm text-[#EDEDEC] placeholder-[#555] focus:outline-none focus:border-[#C86B3C] font-mono"
                        />
                      </div>

                      {/* Low budget pre-owned notice */}
                      {Number(val) > 0 && Number(val) <= 300000 && (
                        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-[#C86B3C]/10 border border-[#C86B3C]/20 text-xs text-[#FF9D66]">
                          <Info className="w-4 h-4 shrink-0 mt-0.5" />
                          <span>
                            <strong>Pre-Owned Opportunity:</strong> At lower budgets, pre-owned vehicles may provide more available options than new vehicles. Final recommendations depend on the loaded dataset and inference rules.
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Single Choice Options */}
                  {(q.type === 'single_choice' || q.type === 'radio') && Array.isArray(q.options) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {q.options.map((opt: any) => {
                        const selected = val === opt.value;
                        return (
                          <label
                            key={String(opt.value)}
                            className={`relative flex items-center justify-between p-4 rounded-xl cursor-pointer border transition-all ${selected
                                ? 'bg-[#1F1F1F] border-[#C86B3C]/60 text-[#EDEDEC] shadow-sm shadow-[#C86B3C]/10'
                                : 'bg-[#161616] border-white/[0.06] text-[#8E8B85] hover:border-white/[0.12] hover:text-[#EDEDEC]'
                              }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-colors ${selected ? 'border-[#C86B3C] bg-[#C86B3C]' : 'border-[#8E8B85] bg-transparent'
                                }`}>
                                {selected && <div className="w-1.5 h-1.5 rounded-full bg-[#111111]" />}
                              </div>
                              <span className="text-sm font-medium">{opt.label}</span>
                            </div>
                            <input
                              type="radio"
                              name={q.id}
                              value={String(opt.value)}
                              checked={selected}
                              onChange={() => updateProfileField(q.maps_to, opt.value)}
                              className="sr-only"
                            />
                          </label>
                        );
                      })}
                    </div>
                  )}

                  {(q.type === 'multi_choice' || q.type === 'checkbox') && Array.isArray(q.options) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {q.options.map((opt: any) => {
                        const values = Array.isArray(val) ? val : [];
                        const selected = values.some((item) => String(item) === String(opt.value));

                        return (
                          <label
                            key={String(opt.value)}
                            className={`relative flex items-center justify-between p-4 rounded-xl cursor-pointer border transition-all ${selected
                                ? 'bg-[#1F1F1F] border-[#C86B3C]/60 text-[#EDEDEC]'
                                : 'bg-[#161616] border-white/[0.06] text-[#8E8B85] hover:border-white/[0.12] hover:text-[#EDEDEC]'
                              }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${selected ? 'border-[#C86B3C] bg-[#C86B3C]' : 'border-[#8E8B85]'
                                }`}>
                                {selected && <span className="text-[10px] font-bold text-white">✓</span>}
                              </div>
                              <span className="text-sm font-medium">{opt.label}</span>
                            </div>
                            <input
                              type="checkbox"
                              checked={selected}
                              onChange={() => {
                                const next = selected
                                  ? values.filter((item) => String(item) !== String(opt.value))
                                  : [...values, opt.value];
                                updateProfileField(q.maps_to, next);
                              }}
                              className="sr-only"
                            />
                          </label>
                        );
                      })}
                    </div>
                  )}

                  {!['single_choice', 'radio', 'multi_choice', 'checkbox'].includes(q.type) && !isBudgetQuestion && (
                    <div className="rounded-xl border border-dashed border-white/[0.08] bg-[#161616] px-4 py-3 text-xs text-[#8E8B85]">
                      Unsupported question type: {String(q.type || 'unknown')}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Validation Error Alert */}
        {validationError && (
          <div className="p-3.5 rounded-xl bg-[#FF5C67]/10 border border-[#FF5C67]/20 text-[#FF5C67] text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Action / Navigation Controls */}
        <div className="flex items-center justify-between pt-6 border-t border-white/[0.06]">
          <button
            type="button"
            onClick={handleBack}
            disabled={currentStepIndex === 0}
            className={`px-4 py-2.5 rounded-xl text-xs font-medium flex items-center gap-2 border transition-colors ${currentStepIndex === 0
                ? 'opacity-30 cursor-not-allowed border-transparent text-[#697386]'
                : 'border-white/[0.06] bg-[#161616] hover:bg-[#1F1F1F] text-[#8E8B85] hover:text-[#EDEDEC]'
              }`}
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <button
            type="button"
            onClick={handleNext}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#C86B3C] to-[#D97745] hover:from-[#D97745] hover:to-[#FF9D66] text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-md shadow-[#C86B3C]/20"
          >
            <span>{currentStepIndex === steps.length - 1 ? 'Review Fact Base' : 'Next Step'}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
