import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { UserProfile, RecommendationResponse } from '../types';
import { getRecommendation } from '../services/api';
import { ArrowRight, RefreshCw } from 'lucide-react';

interface ProfileReviewPageProps {
  userProfile: UserProfile;
  setRecommendation: (res: RecommendationResponse) => void;
  demoMode: boolean;
}

export const ProfileReviewPage: React.FC<ProfileReviewPageProps> = ({
  userProfile,
  setRecommendation,
}) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getRecommendation(userProfile);
      setRecommendation(res);
      navigate('/results');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to run AI engine');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 space-y-10">
      <div className="space-y-2 border-b border-white/[0.06] pb-6">
        <div className="text-xs font-mono uppercase text-[#C86B3C] tracking-wider font-semibold">
          Pre-Inference Verification
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F5F5F5]">
          Fact Base Review
        </h1>
        <p className="text-xs sm:text-sm text-[#A3A3A3] max-w-xl leading-relaxed">
          The pipeline structure groups inputs into deterministic parameters, driving characteristics, weighted preferences, and probabilistic boundary nodes.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
          <strong>Inference Pipeline Error:</strong> {error}
        </div>
      )}

      {/* Facts Breakdown Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Known Facts */}
        <div className="bg-[#111111] border border-white/[0.06] rounded-xl p-5 space-y-3">
          <div className="text-xs font-mono uppercase text-[#A3A3A3] font-medium tracking-wider">
            01. Deterministic Facts
          </div>
          <ul className="text-xs space-y-2 text-[#A3A3A3]">
            <li className="flex justify-between border-b border-white/[0.04] pb-1.5">
              <span>Daily Travel:</span>
              <span className="font-mono text-[#F5F5F5]">{userProfile.daily_distance} km/day</span>
            </li>
            <li className="flex justify-between border-b border-white/[0.04] pb-1.5">
              <span>Capital Budget:</span>
              <span className="font-mono text-[#F5F5F5]">₹{Number(userProfile.purchase_budget).toLocaleString('en-IN')}</span>
            </li>
            <li className="flex justify-between border-b border-white/[0.04] pb-1.5">
              <span>Usage Environment:</span>
              <span className="capitalize text-[#F5F5F5]">{userProfile.driving_environment}</span>
            </li>
            <li className="flex justify-between border-b border-white/[0.04] pb-1.5">
              <span>Fuel Station Access:</span>
              <span className="capitalize text-[#F5F5F5]">{userProfile.fuel_station_access}</span>
            </li>
          </ul>
        </div>

        {/* Driving Experience */}
        <div className="bg-[#111111] border border-white/[0.06] rounded-xl p-5 space-y-3">
          <div className="text-xs font-mono uppercase text-[#A3A3A3] font-medium tracking-wider">
            02. Driver Persona
          </div>
          <ul className="text-xs space-y-2 text-[#A3A3A3]">
            <li className="flex justify-between border-b border-white/[0.04] pb-1.5">
              <span>First-Time Vehicle Owner:</span>
              <span className="font-mono text-[#F5F5F5]">{userProfile.first_time_owner ? 'Yes' : 'No'}</span>
            </li>
            <li className="flex justify-between border-b border-white/[0.04] pb-1.5">
              <span>Experience Classification:</span>
              <span className="capitalize text-[#F5F5F5]">{userProfile.experience}</span>
            </li>
            <li className="flex justify-between border-b border-white/[0.04] pb-1.5">
              <span>Confidence Level:</span>
              <span className="capitalize text-[#F5F5F5]">{userProfile.driving_confidence}</span>
            </li>
          </ul>
        </div>

        {/* Preferences & Priorities */}
        <div className="bg-[#111111] border border-white/[0.06] rounded-xl p-5 space-y-3">
          <div className="text-xs font-mono uppercase text-[#A3A3A3] font-medium tracking-wider">
            03. Prioritized Criteria
          </div>
          <ul className="text-xs space-y-2 text-[#A3A3A3]">
            <li className="flex justify-between border-b border-white/[0.04] pb-1.5">
              <span>Transmission Preference:</span>
              <span className="capitalize text-[#F5F5F5]">{userProfile.transmission_preference}</span>
            </li>
            {(() => {
              const priorityNames: Record<string, string> = {
                priority_running_cost: 'Low Running Cost',
                priority_maintenance: 'Low Maintenance',
                priority_performance: 'Performance',
                priority_environment: 'Eco-Friendliness',
                priority_purchase_price: 'Purchase Price',
                priority_long_distance: 'Long Distance',
                priority_comfort: 'Driving Comfort',
              };
              const items = Object.entries(priorityNames).map(([key, label]) => ({
                label,
                weight: Number(userProfile[key as keyof UserProfile] || 0.2),
              }));
              items.sort((a, b) => b.weight - a.weight);
              const top3 = items.slice(0, 3);
              const rankPrefix = ['01', '02', '03'];

              return top3.map((item, idx) => (
                <li key={item.label} className="flex justify-between border-b border-white/[0.04] pb-1.5">
                  <span className="font-mono text-[11px] text-[#737373]">Priority #{rankPrefix[idx]}</span>
                  <span className="font-medium text-[#F5F5F5]">{item.label}</span>
                </li>
              ));
            })()}
          </ul>
        </div>

        {/* Uncertain Infrastructure */}
        <div className="bg-[#111111] border border-white/[0.06] rounded-xl p-5 space-y-3">
          <div className="text-xs font-mono uppercase text-[#A3A3A3] font-medium tracking-wider">
            04. Infrastructure Conditions
          </div>
          <ul className="text-xs space-y-2 text-[#A3A3A3]">
            <li className="flex justify-between border-b border-white/[0.04] pb-1.5">
              <span>Dedicated Parking:</span>
              <span className="capitalize text-[#F5F5F5]">{userProfile.parking ? userProfile.parking.replace(/_/g, ' ') : 'Unknown'}</span>
            </li>
            <li className="flex justify-between border-b border-white/[0.04] pb-1.5">
              <span>Charging Awareness:</span>
              <span className="capitalize text-[#F5F5F5]">{userProfile.charging_knowledge}</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Action Button */}
      <div className="flex justify-center pt-4">
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="px-8 py-3.5 rounded-xl bg-[#C86B3C] hover:bg-[#D97745] text-white font-semibold text-sm transition-all shadow-[0_0_20px_rgba(200,107,60,0.3)] flex items-center gap-3 disabled:opacity-50"
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Executing AI Reasoning Pipeline...</span>
            </>
          ) : (
            <>
              <span>Execute Inference &amp; Generate Recommendations</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
