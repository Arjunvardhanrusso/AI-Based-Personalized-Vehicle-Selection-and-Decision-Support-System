import React, { useState, useEffect, useMemo } from 'react';
import type { UserProfile } from '../types';
import { fetchQuestions } from '../services/api';
import { 
  X, 
  ChevronRight, 
  Sliders, 
} from 'lucide-react';

interface QuestionnaireModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  onComplete: () => void;
  onLogTelemetry: (msg: string) => void;
}

const TARGET_QUESTIONS = [
  'first_time_owner',
  'experience',
  'daily_distance',
  'driving_frequency',
  'driving_environment',
  'long_distance_frequency',
  'purchase_budget',
  'running_cost_preference',
  'maintenance_preference',
  'vehicle_condition_preference',
  'transmission_preference',
  'performance_importance',
  'seating_requirement',
  'boot_space_need',
  'ground_clearance_need'
];

export const QuestionnaireModal: React.FC<QuestionnaireModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  setUserProfile,
  onComplete,
  onLogTelemetry
}) => {
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuestions()
      .then((data) => {
        const allQuestions = (data.steps || []).flatMap((step: any) => step.questions || []);
        // Filter to only the 15 requested questions
        const filtered = TARGET_QUESTIONS.map(id => allQuestions.find((q: any) => q.id === id)).filter(Boolean);
        setQuestions(filtered);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handleOptionSelect = (field: string, value: any) => {
    setUserProfile((prev) => ({
      ...prev,
      [field]: value,
    }));
    onLogTelemetry(`PROFILER_INPUT: ${field} = ${JSON.stringify(value)}`);
  };

  const answeredCount = useMemo(() => {
    return questions.filter(q => {
      const val = userProfile[q.id as keyof UserProfile];
      if (Array.isArray(val)) return val.length > 0;
      return val !== undefined && val !== null && val !== '';
    }).length;
  }, [questions, userProfile]);

  const isComplete = answeredCount === 15;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-viq-surface-container-lowest/80 backdrop-blur-xl flex items-center justify-center p-4">
      <div className="bg-viq-surface-container-high w-full max-w-3xl rounded-2xl shadow-[0_20px_70px_rgba(0,0,0,0.9)] border border-viq-outline-variant/60 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-viq-surface-container px-6 py-4 flex items-center justify-between border-b border-viq-outline-variant/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-viq-primary-container/20 text-viq-primary-container">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-jakarta text-base font-bold text-viq-primary">
                15-Question Automotive Decision Profiler
              </h2>
              <span className="font-mono text-xs text-viq-outline">
                {answeredCount}/15 answered
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-viq-on-surface-variant hover:text-viq-on-surface hover:bg-viq-surface-container-high transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body - Single Scrollable Page */}
        <div className="p-6 overflow-y-auto flex flex-col gap-8 flex-grow">
          {loading ? (
            <div className="py-12 text-center font-mono text-xs text-viq-outline">
              Loading calibrated telemetry questionnaire parameters...
            </div>
          ) : (
            <div className="flex flex-col gap-8">
              {questions.map((q: any, index: number) => {
                const currentValue = userProfile[q.id as keyof UserProfile];
                const isAnswered = currentValue !== undefined && currentValue !== null && currentValue !== '';

                return (
                  <div key={q.id} className={`flex flex-col gap-3 p-4 rounded-xl border transition-all ${
                    isAnswered ? 'border-viq-outline-variant/30 bg-viq-surface-container/30' : 'border-viq-primary-container/50 bg-viq-surface-container shadow-[0_0_15px_rgba(0,242,254,0.05)]'
                  }`}>
                    <label className="font-jakarta text-sm font-bold text-viq-primary flex items-center gap-2">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-viq-surface-container-highest text-viq-on-surface text-xs font-mono">
                        {index + 1}
                      </span>
                      {q.text}
                      {!isAnswered && <span className="text-viq-error text-xs ml-auto font-mono">*Required</span>}
                    </label>

                    {/* Custom handling for Budget and Daily Distance */}
                    {q.id === 'purchase_budget' ? (
                      <div className="flex flex-col gap-2 mt-2">
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-viq-on-surface-variant font-mono">₹</span>
                          <input
                            type="number"
                            min="10000"
                            step="10000"
                            placeholder="e.g. 1500000"
                            value={currentValue !== undefined ? (currentValue as number) : ''}
                            onChange={(e) => handleOptionSelect(q.id, e.target.value ? Number(e.target.value) : undefined)}
                            className="w-full bg-viq-surface-container-highest border border-viq-outline-variant/50 rounded-lg py-2.5 pl-8 pr-4 text-viq-on-surface font-mono text-sm focus:outline-none focus:border-viq-primary-container transition-colors"
                          />
                        </div>
                        <p className="text-[11px] font-mono text-viq-outline">Enter numerical value (e.g. 1500000 for 15 Lakh)</p>
                      </div>
                    ) : q.id === 'daily_distance' ? (
                      <div className="flex flex-col gap-2 mt-2">
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            step="1"
                            placeholder="e.g. 40"
                            value={currentValue !== undefined ? (currentValue as number) : ''}
                            onChange={(e) => handleOptionSelect(q.id, e.target.value ? Number(e.target.value) : undefined)}
                            className="w-full bg-viq-surface-container-highest border border-viq-outline-variant/50 rounded-lg py-2.5 px-4 pr-12 text-viq-on-surface font-mono text-sm focus:outline-none focus:border-viq-primary-container transition-colors"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-viq-on-surface-variant font-mono text-sm">km</span>
                        </div>
                        <p className="text-[11px] font-mono text-viq-outline">Average kilometers driven per day</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                        {q.options?.map((opt: any) => {
                          const isSelected = currentValue === opt.value;
                          return (
                            <button
                              type="button"
                              key={opt.value}
                              onClick={() => handleOptionSelect(q.id, opt.value)}
                              className={`p-3 rounded-lg border text-left font-jakarta text-xs transition-all ${
                                isSelected
                                  ? 'bg-viq-primary-container/20 border-viq-primary-container text-viq-primary font-bold shadow-sm'
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
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="bg-viq-surface-container px-6 py-4 flex items-center justify-between border-t border-viq-outline-variant/40 shrink-0">
          <div className="font-mono text-xs">
            <span className={isComplete ? "text-viq-primary" : "text-viq-error"}>
              {answeredCount} of 15 completed
            </span>
          </div>

          <button
            onClick={() => {
              onComplete();
              onClose();
            }}
            disabled={!isComplete}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-jakarta text-xs font-bold uppercase tracking-wider transition-all ${
              isComplete
                ? 'bg-gradient-to-r from-[#C86B3C] to-[#E68A57] text-white shadow-[0_0_15px_rgba(200,107,60,0.3)] hover:brightness-110'
                : 'bg-viq-surface-container-highest text-viq-outline cursor-not-allowed'
            }`}
          >
            <span>Compute Recommendations</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
