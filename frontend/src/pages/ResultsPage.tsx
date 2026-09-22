import { ArrowRight, BatteryCharging, Eye, Flame, Fuel, Info, Layers, Printer, Scale, X, Zap } from 'lucide-react';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { RecommendationResponse, VehicleRanking } from '../types';
import { VehicleImage } from '../components/VehicleImage';


const formatPrice = (value: number | null | undefined) => {
  const price = Number(value);
  if (!Number.isFinite(price) || price <= 0) return 'Price unavailable';
  if (price < 100000) return `₹${price.toLocaleString('en-IN')}`;
  if (price < 10000000) {
    const lakh = price / 100000;
    return `₹${lakh.toFixed(lakh >= 10 ? 1 : 2)} Lakh`;
  }
  const crore = price / 10000000;
  return `₹${crore.toFixed(crore >= 10 ? 1 : 2)} Cr`;
};

const score100 = (value: unknown): number | null => {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.max(0, Math.min(100, n <= 1 ? n * 100 : n));
};

const stableId = (vehicle: VehicleRanking) =>
  String(vehicle.variant_id ?? vehicle.vehicle_id ?? (vehicle as any).id ?? vehicle.name ?? '');

const safeFactors = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];

const safeComponentScores = (value: unknown): Record<string, number> => {
  if (!value || typeof value !== 'object') return {};
  const rec = value as Record<string, unknown>;
  const result: Record<string, number> = {};
  for (const [key, val] of Object.entries(rec)) {
    const num = Number(val);
    if (Number.isFinite(num)) {
      result[key] = Math.max(0, Math.min(100, num));
    }
  }
  return result;
};

interface ResultsPageProps {
  recommendation: RecommendationResponse | null;
  demoMode: boolean;
}

export const ResultsPage: React.FC<ResultsPageProps> = ({ recommendation, demoMode: _demoMode }) => {
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleRanking | null>(null);
  const [compareList, setCompareList] = useState<VehicleRanking[]>([]);
  const [showCompareModal, setShowCompareModal] = useState(false);

  if (!recommendation) {
    return (
      <div className="max-w-3xl mx-auto py-20 px-4 text-center space-y-4">
        <div className="w-10 h-10 rounded-full bg-[#161616] border border-white/[0.08] flex items-center justify-center mx-auto text-[#737373]">
          <Info className="w-5 h-5" />
        </div>
        <h2 className="text-xl font-semibold text-[#F5F5F5]">No Recommendation Generated Yet</h2>
        <p className="text-xs text-[#A3A3A3] max-w-sm mx-auto">Please complete the questionnaire first to initiate the multi-stage AI reasoning pipeline.</p>
        <div className="pt-2">
          <Link
            to="/questionnaire"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#C86B3C] hover:bg-[#D97745] text-white font-semibold text-xs transition-all shadow-[0_0_15px_rgba(200,107,60,0.3)]"
          >
            <span>Start Decision Questionnaire</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    );
  }

  const category_scores = Array.isArray(recommendation.category_scores)
    ? recommendation.category_scores
    : [];
  const vehicle_rankings = Array.isArray(recommendation.vehicle_rankings)
    ? recommendation.vehicle_rankings
    : [];
  const top_vehicles = Array.isArray(recommendation.top_vehicles)
    ? recommendation.top_vehicles
    : [];
  const conflicts = Array.isArray(recommendation.conflicts)
    ? recommendation.conflicts
    : [];

  // Chart data
  const chartData = category_scores.map((cs) => ({
    name: cs.category.toUpperCase(),
    score: score100(cs.score) ?? 0,
    category: cs.category,
  }));

  const getCategoryColor = (cat: string) => {
    switch (cat.toLowerCase()) {
      case 'ev': return '#C86B3C';
      case 'hybrid': return '#D97745';
      default: return '#898686ff';
    }
  };

  const getFuelIcon = (fuel: string) => {
    switch (fuel.toLowerCase()) {
      case 'ev': return <BatteryCharging className="w-3.5 h-3.5 text-[#C86B3C]" />;
      case 'hybrid': return <Zap className="w-3.5 h-3.5 text-[#D97745]" />;
      case 'cng': return <Fuel className="w-3.5 h-3.5 text-[#A3A3A3]" />;
      case 'diesel': return <Fuel className="w-3.5 h-3.5 text-[#A3A3A3]" />;
      default: return <Flame className="w-3.5 h-3.5 text-[#A3A3A3]" />;
    }
  };

  const toggleCompare = (v: VehicleRanking) => {
    if (compareList.some((c) => stableId(c) === stableId(v))) {
      setCompareList(compareList.filter((c) => stableId(c) !== stableId(v)));
    } else {
      if (compareList.length < 4) {
        setCompareList([...compareList, v]);
      }
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 space-y-12">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/[0.06] pb-6 print:hidden">
        <div className="space-y-1">
          <div className="text-xs font-mono uppercase text-[#C86B3C] tracking-wider font-semibold">
            Inference Results
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F5F5F5]">
            Vehicle Suitability Rankings
          </h1>
        </div>
        <div className="flex items-center gap-2.5">
          <Link
            to="/search"
            className="px-3.5 py-2 rounded-lg bg-[#161616] hover:bg-[#1F1F1F] border border-white/[0.08] text-[#A3A3A3] hover:text-[#F5F5F5] text-xs font-medium flex items-center gap-2 transition-colors"
          >
            <span>Explore All Variants</span>
          </Link>
          <button
            onClick={handlePrint}
            className="px-3.5 py-2 rounded-lg bg-[#161616] hover:bg-[#1F1F1F] border border-white/[0.08] text-[#A3A3A3] hover:text-[#F5F5F5] text-xs font-medium flex items-center gap-2 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Export Report</span>
          </button>
          <Link
            to="/reasoning"
            className="px-3.5 py-2 rounded-lg bg-[#161616] hover:bg-[#1F1F1F] border border-[#C86B3C]/30 text-[#F5F5F5] text-xs font-medium flex items-center gap-2 transition-colors"
          >
            <Layers className="w-3.5 h-3.5 text-[#C86B3C]" />
            <span>Inspect Reasoning Trace</span>
          </Link>
        </div>
      </div>

      {/* Conflict Notification if any */}
      {conflicts && conflicts.length > 0 && (
        <div className="bg-[#161616] border border-amber-500/30 rounded-xl p-4 space-y-1 print:hidden">
          <div className="text-xs font-mono uppercase text-amber-400 font-medium tracking-wide">
            Resolved Requirement Trade-Offs
          </div>
          <ul className="text-xs text-[#A3A3A3] space-y-1 list-disc list-inside">
            {conflicts.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Category Scores Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-1 bg-[#111111] border border-white/[0.06] rounded-2xl p-6 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-[#F5F5F5]">Powertrain Fit Scores</h3>
            <p className="text-xs text-[#737373]">Aggregate technology compatibility rating (0–100)</p>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <XAxis type="number" domain={[0, 100]} stroke="#737373" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis dataKey="name" type="category" stroke="#A3A3A3" fontSize={11} width={60} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111111', borderColor: 'rgba(255,255,255,0.08)', borderRadius: '8px', fontSize: '11px', color: '#F5F5F5' }}
                  formatter={(val: any) => [`${val} / 100`, 'Fit Score']}
                />
                <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={12}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getCategoryColor(entry.category)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Cards */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {category_scores.map((cs, idx) => (
            <div
              key={cs.category}
              className={`bg-[#111111] border rounded-xl p-5 space-y-3 relative ${idx === 0 ? 'border-[#C86B3C]/50' : 'border-white/[0.06]'
                }`}
            >
              {(score100(cs.score) ?? 0) >= 80 && (
                <span className="absolute top-3 right-3 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-[#C86B3C]/20 text-[#FF9D66]">
                  Strong Fit
                </span>
              )}
              <div className="flex items-center gap-2">
                {getFuelIcon(cs.category)}
                <span className="font-semibold text-[#F5F5F5] text-xs uppercase tracking-wide">{cs.category}</span>
              </div>
              <div className="text-2xl font-bold tracking-tight text-[#F5F5F5]">
                {score100(cs.score) ?? '—'} <span className="text-xs text-[#737373] font-normal">/ 100</span>
              </div>

              {cs.positive_factors && cs.positive_factors.length > 0 && (
                <div className="space-y-1 pt-2 border-t border-white/[0.04]">
                  <ul className="text-[11px] text-[#A3A3A3] space-y-1">
                    {cs.positive_factors.slice(0, 2).map((pf, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-emerald-400 mt-0.5">•</span>
                        <span className="line-clamp-1">{pf}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Top Ranked Vehicles */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
          <div>
            <h2 className="text-lg font-semibold text-[#F5F5F5]">
              Top Recommended Vehicles & Variants
            </h2>
            <p className="text-xs text-[#737373]">
              Ranked by multi-paradigm AI reasoning (Bayesian posterior × Fuzzy weights × Criteria scores)
            </p>
          </div>
          <span className="text-xs font-mono text-[#737373]">{vehicle_rankings.length} Evaluated</span>
        </div>

        {top_vehicles.length === 0 ? (
          <div className="bg-[#111111] border border-white/[0.06] rounded-2xl p-12 text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-[#161616] border border-white/[0.08] flex items-center justify-center mx-auto text-[#737373]">
              <Info className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-[#F5F5F5]">No eligible vehicles in this budget boundary</h3>
            <p className="text-xs text-[#A3A3A3] max-w-sm mx-auto">
              The rule base could not identify matching vehicles within your exact financial threshold. Consider broadening your capital allocation range.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {top_vehicles.map((v) => {
              const isComparing = compareList.some((c) => stableId(c) === stableId(v));
              const isTopRank = v.rank === 1;

              return (
                <div
                  key={stableId(v)}
                  className={`bg-[#111111] border rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all ${isTopRank
                      ? 'border-[#C86B3C]/60 shadow-[0_0_20px_rgba(200,107,60,0.15)]'
                      : 'border-white/[0.06] hover:border-white/[0.14]'
                    }`}
                >
                  {/* Vehicle Info */}
                  <div className="flex items-start gap-4">
                    <div className="w-28 h-20 shrink-0 bg-[#161616] rounded-lg overflow-hidden border border-white/[0.06] relative hidden sm:block">
                      <VehicleImage
                        src={v.image_url || v.image_path}
                        vehicleId={v.variant_id || v.vehicle_id}
                        brand={v.brand}
                        model={v.name}
                        variant={v.variant_name}
                        bodyType={v.body_type || v.segment}
                        alt={v.name}
                        className="w-full h-full bg-transparent"
                      />
                      {isTopRank && (
                        <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-[9px] font-mono bg-[#C86B3C] text-white font-bold uppercase z-10">
                          Top Choice
                        </span>
                      )}
                    </div>

                    <div className="space-y-1.5 max-w-lg">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="w-6 h-6 rounded bg-[#161616] text-[#A3A3A3] border border-white/[0.08] font-mono text-xs font-medium flex items-center justify-center">
                          {String(v.rank).padStart(2, '0')}
                        </span>
                        <span className="text-[10px] font-mono text-[#FF9D66] uppercase px-1.5 py-0.5 rounded bg-[#C86B3C]/10 border border-[#C86B3C]/20">
                          {v.brand}
                        </span>
                        <h3 className="text-base font-semibold text-[#F5F5F5]">
                          {v.model_name || v.name}{' '}
                          {v.variant_name && (
                            <span className="text-xs font-normal text-[#A3A3A3]">• {v.variant_name}</span>
                          )}
                        </h3>
                        <div className="px-2 py-0.5 rounded bg-[#161616] text-[#A3A3A3] text-[11px] font-medium uppercase flex items-center gap-1 border border-white/[0.06]">
                          {getFuelIcon(v.fuel_type)}
                          <span>{v.fuel_type}</span>
                        </div>
                      </div>

                      <div className="text-xs text-[#737373] flex flex-wrap items-center gap-2.5">
                        <span className="font-mono text-[#F5F5F5] font-medium">
                          {formatPrice(v.price_inr)}
                        </span>
                        <span>•</span>
                        <span className="text-[11px] text-[#A3A3A3]">
                          {v.is_used ? 'Used Market / Listed Price' : (v.price_location_label || 'Ex-Showroom')}
                        </span>
                        {v.transmission && (
                          <>
                            <span>•</span>
                            <span>{v.transmission}</span>
                          </>
                        )}
                        {v.ncap_rating && (
                          <>
                            <span>•</span>
                            <span className="text-emerald-400 font-medium">
                              {v.ncap_rating}★ NCAP
                            </span>
                          </>
                        )}
                        {v.tco_5yr_est_inr && (
                          <>
                            <span>•</span>
                            <span className="text-[#A3A3A3]">
                              5-Yr TCO: ₹{(v.tco_5yr_est_inr / 100000).toFixed(1)}L
                            </span>
                          </>
                        )}
                      </div>

                      {/* Top Rank Reason */}                      {isTopRank && safeFactors(v.positive_factors).length > 0 && (
                        <div className="text-[11px] text-[#FF9D66] bg-[#C86B3C]/10 border border-[#C86B3C]/25 px-2.5 py-1 rounded-md">
                          <strong>Rank 1 evidence:</strong> {safeFactors(v.positive_factors)[0]}
                        </div>
                      )}

                      {/* Factors */}
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {safeFactors(v.positive_factors).slice(0, 3).map((pf, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded text-[10px] bg-[#161616] text-[#A3A3A3] border border-white/[0.04]"
                          >
                            {pf}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Score & Actions */}
                  <div className="flex items-center gap-6 justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-white/[0.04]">
                    <div className="text-right">
                      <div className="text-[10px] text-[#737373] font-mono uppercase tracking-wider">Fit Score</div>
                      <div className="text-2xl font-bold text-[#F5F5F5] tracking-tight">
                        {score100(v.score) ?? '—'} <span className="text-xs text-[#737373] font-normal">/ 100</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleCompare(v)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${isComparing
                            ? 'bg-[#1F1F1F] border-[#C86B3C] text-[#FF9D66]'
                            : 'bg-[#161616] hover:bg-[#1F1F1F] border-white/[0.06] text-[#A3A3A3] hover:text-[#F5F5F5]'
                          }`}
                      >
                        {isComparing ? 'Comparing' : '+ Compare'}
                      </button>

                      <button
                        onClick={() => setSelectedVehicle(v)}
                        className="px-3 py-1.5 rounded-lg bg-[#161616] hover:bg-[#1F1F1F] border border-white/[0.06] text-[#A3A3A3] hover:text-[#F5F5F5] text-xs font-medium transition-colors flex items-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Breakdown</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Compare Action Bar */}
      {compareList.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[#111111] border border-white/[0.12] rounded-xl p-3 px-5 shadow-2xl flex items-center gap-6">
          <div className="flex items-center gap-2.5">
            <Scale className="w-4 h-4 text-[#C86B3C]" />
            <div className="text-xs font-mono text-[#F5F5F5]">
              <span className="font-semibold text-[#FF9D66]">{compareList.length}/4</span> Selected for Comparison
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCompareList([])}
              className="px-2.5 py-1 text-xs text-[#737373] hover:text-red-400 transition-colors"
            >
              Clear
            </button>
            <button
              onClick={() => setShowCompareModal(true)}
              className="px-4 py-1.5 rounded-lg bg-[#C86B3C] hover:bg-[#D97745] text-white font-medium text-xs transition-colors shadow-sm"
            >
              Compare Matrix
            </button>
          </div>
        </div>
      )}

      {/* Side-by-Side Comparison Modal */}
      {showCompareModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111111] border border-white/[0.12] rounded-2xl p-6 sm:p-8 max-w-4xl w-full max-h-[85vh] overflow-y-auto space-y-6 shadow-2xl relative">
            <button
              onClick={() => setShowCompareModal(false)}
              className="absolute top-5 right-5 p-1.5 rounded-md text-[#737373] hover:text-[#F5F5F5] hover:bg-[#161616] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1">
              <div className="text-xs font-mono uppercase text-[#C86B3C] font-semibold">Evaluation Matrix</div>
              <h3 className="text-xl font-bold text-[#F5F5F5]">Vehicle Comparison Analysis</h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/[0.06] text-[#737373]">
                    <th className="p-3 w-36 font-mono uppercase font-normal">Attribute</th>
                    {compareList.map((c) => (
                      <th key={stableId(c)} className="p-3 font-semibold text-[#F5F5F5] text-sm">
                        <div>{c.name}</div>
                        {c.variant_name && <div className="text-xs text-[#A3A3A3] font-normal">{c.variant_name}</div>}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04] text-[#A3A3A3]">
                  <tr>
                    <td className="p-3 text-[#737373]">Fit Score</td>
                    {compareList.map((c) => (
                      <td key={c.vehicle_id} className="p-3 font-bold text-[#FF9D66] text-sm">
                        {score100(c.score) ?? '—'} / 100
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 text-[#737373]">Purchase Price</td>
                    {compareList.map((c) => (
                      <td key={c.vehicle_id} className="p-3 font-mono text-[#F5F5F5]">
                        {formatPrice(c.price_inr)}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 text-[#737373]">5-Yr TCO Estimate</td>
                    {compareList.map((c) => (
                      <td key={c.vehicle_id} className="p-3 font-mono text-[#F5F5F5]">
                        {c.tco_5yr_est_inr != null ? formatPrice(c.tco_5yr_est_inr) : 'Not provided'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 text-[#737373]">Fuel Technology</td>
                    {compareList.map((c) => (
                      <td key={c.vehicle_id} className="p-3 uppercase font-medium text-[#F5F5F5]">
                        {c.fuel_type}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 text-[#737373]">Safety Rating</td>
                    {compareList.map((c) => (
                      <td key={c.vehicle_id} className="p-3 text-[#F5F5F5]">
                        {c.ncap_rating != null ? `${c.ncap_rating}★ NCAP` : 'Not provided'}
                      </td>
                    ))}
                  </tr>
                  {['cost', 'usage', 'infrastructure', 'maintenance', 'performance', 'environment', 'practicality'].map((compKey) => (
                    <tr key={compKey}>
                      <td className="p-3 text-[#737373] capitalize">{compKey} Alignment</td>
                      {compareList.map((c) => (
                        <td key={c.vehicle_id} className="p-3 font-mono text-[#F5F5F5]">
                          {c.component_scores[compKey as keyof typeof c.component_scores] ?? '-'}%
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal for Detailed Vehicle Breakdown */}
      {selectedVehicle && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111111] border border-white/[0.12] rounded-2xl p-6 sm:p-8 max-w-xl w-full max-h-[85vh] overflow-y-auto space-y-6 shadow-2xl relative">
            <button
              onClick={() => setSelectedVehicle(null)}
              className="absolute top-5 right-5 p-1.5 rounded-md text-[#737373] hover:text-[#F5F5F5] hover:bg-[#161616] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1">
              <div className="text-xs font-mono uppercase text-[#C86B3C] font-semibold">Component Diagnostics</div>
              <h3 className="text-xl font-bold text-[#F5F5F5]">{selectedVehicle.name}</h3>
              <p className="text-xs text-[#737373]">Overall Score: {score100(selectedVehicle.score) ?? '—'}/100 • {selectedVehicle.fuel_type.toUpperCase()} • 5-Yr TCO Est: {selectedVehicle.tco_5yr_est_inr != null ? formatPrice(selectedVehicle.tco_5yr_est_inr) : 'Not provided'}</p>
            </div>

            <div className="space-y-3">
              <div className="text-xs font-mono uppercase text-[#A3A3A3]">9-Component Score Matrix</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {Object.entries(safeComponentScores(selectedVehicle.component_scores)).map(([key, val]) => (
                  <div key={key} className="p-3 rounded-lg bg-[#161616] border border-white/[0.04] space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[#A3A3A3] capitalize">{key.replace(/_/g, ' ')}</span>
                      <span className="font-mono text-[#F5F5F5] font-medium">{Number(val).toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-[#080808] h-1 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#C86B3C]"
                        style={{ width: `${Math.max(0, Math.min(100, Number(val)))}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-white/[0.06]">
              <div className="text-xs font-mono uppercase text-[#A3A3A3]">Alignment Factors</div>
              <ul className="text-xs text-[#A3A3A3] space-y-1">
                {safeFactors(selectedVehicle.positive_factors).map((pf, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-emerald-400 mt-0.5">•</span>
                    <span>{pf}</span>
                  </li>
                ))}
              </ul>
            </div>

            {safeFactors(selectedVehicle.negative_factors).length > 0 && (
              <div className="space-y-2 pt-2 border-t border-white/[0.06]">
                <div className="text-xs font-mono uppercase text-[#A3A3A3]">Trade-off Considerations</div>
                <ul className="text-xs text-[#A3A3A3] space-y-1">
                  {safeFactors(selectedVehicle.negative_factors).map((nf, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-red-400 mt-0.5">•</span>
                      <span>{nf}</span>
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
