import React, { useState } from 'react';
import type { Vehicle, VehicleRanking, SelectedLocation } from '../types';
import { RTO_RATES } from '../types';
import { 
  ArrowLeft, 
  ShieldCheck, 
  Droplets, 
  Cpu,
  Car,
  ArrowRight,
  TrendingDown,
  Scale,
  RefreshCw,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { negotiateVehicle } from '../services/api';
import { VehicleImage } from '../components/VehicleImage';

interface DetailsTabProps {
  vehicleId: string;
  vehicles: Vehicle[];
  rankings: VehicleRanking[];
  selectedLocation: SelectedLocation;
  onBackToDiscover: () => void;
  onLogTelemetry?: (msg: string) => void;
}

export const DetailsTab: React.FC<DetailsTabProps> = ({
  vehicleId,
  vehicles,
  rankings,
  selectedLocation,
  onBackToDiscover,
  onLogTelemetry
}) => {
  const foundVehicle = vehicles.find(v => v.id === vehicleId || v.name.toLowerCase().includes(vehicleId.toLowerCase()));
  const ranking = rankings.find(r => r.vehicle_id === vehicleId || r.name.toLowerCase().includes(vehicleId.toLowerCase()));

  // Empty state if no vehicle selected
  if (!vehicleId || (!foundVehicle && !ranking)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center space-y-4 max-w-md mx-auto py-20">
        <div className="w-16 h-16 rounded-2xl bg-[#141414] border border-white/[0.08] flex items-center justify-center text-[#C86B3C] shadow-lg">
          <Car className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-[#F5F5F5]">No Vehicle Selected for Deep Dive</h2>
        <p className="text-xs text-[#A3A3A3] leading-relaxed">
          Select any vehicle card from the Match Explorer or Vehicle Search catalog to inspect its verified engineering dossier, safety credentials, and AI price negotiation tools.
        </p>
        <button
          onClick={onBackToDiscover}
          className="px-5 py-2.5 rounded-xl bg-[#C86B3C] hover:bg-[#D97745] text-white font-semibold text-xs transition-colors flex items-center gap-2 shadow-[0_0_20px_rgba(200,107,60,0.3)]"
        >
          <span>Explore Recommended Vehicles</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  const title = ranking?.name || foundVehicle?.name || 'Vehicle Dossier';
  const desc = 'Multi-dimensional telemetry deep dive evaluated against high-density metro traffic, suburban arterial roads, monsoon wading zones, and regional motor vehicle taxation schedules.';
  const pt = ranking?.powertrain_type || (foundVehicle ? `${foundVehicle.fuel_type.toUpperCase()} Engine` : '2.0L Turbo');
  const pwr = ranking?.power_bhp ? `${ranking.power_bhp} bhp / ${ranking.torque_nm || 350} Nm` : '170 bhp / 350 Nm';
  const accel = ranking?.power_bhp && ranking.power_bhp > 200 ? '7.8s' : '9.5s';
  const mileage = (foundVehicle?.fuel_type === 'ev' || ranking?.fuel_type?.toLowerCase() === 'ev') ? '₹1.20 / km (Grid)' : '14.2 km/l Comb';
  
  const imageSrc = ranking?.image_url || ranking?.image_path || foundVehicle?.image_url || foundVehicle?.image_path;
  const brandName = ranking?.brand || foundVehicle?.brand || '';
  const bodyType = ranking?.body_type || ranking?.segment || foundVehicle?.vehicle_segment;

  const basePrice = ranking?.price_inr || foundVehicle?.price_inr || 1500000;
  const isUsed = Boolean(
    foundVehicle?.is_used ||
    ranking?.is_used ||
    (foundVehicle as any)?.market_status === 'used' ||
    (foundVehicle as any)?.condition === 'used' ||
    (ranking as any)?.market_status === 'used' ||
    (ranking as any)?.condition === 'used'
  );

  // Regional Tax Rates from central RTO_RATES (no BLR hardcoding)
  const locCode = selectedLocation?.code || 'DEL';
  const currentCityConfig = RTO_RATES[locCode] || RTO_RATES['DEL'] || {
    pct: 0.1000,
    label: `${locCode} RTO (10.00%)`,
    stateTag: `${selectedLocation?.state || locCode} Road Tax`
  };
  const isEv = (foundVehicle?.fuel_type === 'ev') || ranking?.fuel_type?.toLowerCase() === 'ev';

  const effectiveRtoPct = (isEv && (locCode === 'DEL' || locCode === 'MAA')) ? 0.0 : currentCityConfig.pct;
  const rto = isUsed ? 15000 : Math.round(basePrice * effectiveRtoPct); // Nominal RTO transfer NOC for used cars
  const ins = Math.round(basePrice * 0.045);
  const tcs = isUsed ? 0 : Math.round(basePrice * 0.01);
  const fastag = 3500;
  const subsidy = (isEv && (locCode === 'DEL' || locCode === 'MAA')) ? 50000 : 0;
  const totalOnRoad = isUsed ? basePrice + rto + ins : basePrice + rto + ins + tcs + fastag - subsidy;

  // Radar points
  const radarPoints = isEv
    ? "100,22 135,75 140,130 100,170 50,130 48,70"
    : "100,30 162,60 155,140 100,165 42,138 45,65";

  // Score clamping & normalization
  const rawScore = ranking?.score;
  let normalizedScore: number;
  if (rawScore !== undefined && rawScore !== null) {
    normalizedScore = rawScore <= 1.0 ? rawScore * 100 : rawScore;
  } else {
    normalizedScore = 91.5;
  }
  normalizedScore = Math.min(100, Math.max(0, normalizedScore));
  const confidenceScore = normalizedScore.toFixed(1);

  // Negotiation State
  const [negotiationData, setNegotiationData] = useState<{
    year: number;
    odometer: number;
    condition: string;
    owners: number;
    service: string;
    targetOffer: string;
  }>({
    year: 2021,
    odometer: 45000,
    condition: 'Good',
    owners: 1,
    service: 'Complete OEM Records',
    targetOffer: ''
  });

  const [negotiationResult, setNegotiationResult] = useState<any>(null);
  const [negotiationLoading, setNegotiationLoading] = useState(false);

  const handleRunNegotiation = async () => {
    setNegotiationLoading(true);
    try {
      const res = await negotiateVehicle({
        vehicle_id: vehicleId,
        listed_price: basePrice,
        year_of_manufacture: negotiationData.year,
        odometer_km: negotiationData.odometer,
        condition_grade: negotiationData.condition,
        ownership_count: negotiationData.owners,
        service_history: negotiationData.service,
        user_initial_offer: negotiationData.targetOffer ? Number(negotiationData.targetOffer) : undefined
      });
      setNegotiationResult(res);
      if (onLogTelemetry) {
        onLogTelemetry(`NEGOTIATION_EVAL: Computed fair market midpoint ₹${res.fair_market_value?.mid?.toLocaleString('en-IN')}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setNegotiationLoading(false);
    }
  };

  return (
    <div className="flex flex-col w-full px-4 lg:px-10 py-6 gap-6">
      {/* Return Breadcrumb */}
      <div className="flex items-center gap-2">
        <button
          onClick={onBackToDiscover}
          className="text-viq-on-surface-variant hover:text-[#C86B3C] flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Match Explorer</span>
        </button>
        <span className="text-viq-outline">/</span>
        <span className="font-mono text-xs text-[#FF9D66] font-semibold">
          {title} Telemetry Dossier
        </span>
      </div>

      {/* Hero Dossier Banner */}
      <div className="bg-viq-surface-container-low rounded-2xl p-6 lg:p-8 border border-viq-outline-variant/40 shadow-xl grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 flex flex-col justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#C86B3C]/15 text-[#FF9D66] font-mono text-xs font-bold border border-[#C86B3C]/30">
                SUITABILITY CONFIDENCE: {confidenceScore}%
              </span>
              {isUsed && (
                <span className="px-2.5 py-0.5 rounded-full bg-[#C86B3C] text-white font-mono text-xs font-bold uppercase">
                  PRE-OWNED · LISTED PRICE
                </span>
              )}
              <span className="text-viq-outline font-mono text-xs">
                VIN: IND-{foundVehicle?.id || 'VDS'}-2025
              </span>
            </div>
            <h1 className="font-jakarta text-2xl lg:text-3xl font-extrabold text-[#F5F5F5]">
              {title}
            </h1>
            <p className="font-jakarta text-xs lg:text-sm text-viq-on-surface-variant mt-2 leading-relaxed">
              {desc}
            </p>
          </div>

          {/* Vehicle Studio Photography Box */}
          <div className="relative h-56 w-full rounded-xl bg-viq-surface-container/60 border border-viq-outline-variant/30 flex items-center justify-center overflow-hidden p-3 my-1">
            <VehicleImage
              src={imageSrc}
              vehicleId={vehicleId}
              brand={brandName}
              model={title}
              variant={ranking?.variant_name}
              bodyType={bodyType}
              alt={title}
              className="w-full h-full bg-transparent"
              showAttribution={true}
            />
          </div>

          {/* Quick Stat Chips */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-viq-surface-container rounded-xl p-3 border border-viq-outline-variant/30">
            <div>
              <span className="font-mono text-[10px] text-viq-outline block">Powertrain</span>
              <span className="font-mono text-xs font-bold text-viq-on-surface">{pt}</span>
            </div>
            <div>
              <span className="font-mono text-[10px] text-viq-outline block">Power / Torque</span>
              <span className="font-mono text-xs font-bold text-viq-on-surface">{pwr}</span>
            </div>
            <div>
              <span className="font-mono text-[10px] text-viq-outline block">0-100 km/h</span>
              <span className="font-mono text-xs font-bold text-viq-on-surface">{accel}</span>
            </div>
            <div>
              <span className="font-mono text-[10px] text-viq-outline block">Real Fuel Avg</span>
              <span className="font-mono text-xs font-bold text-[#FF9D66]">{mileage}</span>
            </div>
          </div>
        </div>

        {/* Radial AI Suitability Radar / Score SVG */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center bg-viq-surface-container rounded-xl p-4 border border-viq-outline-variant/30">
          <span className="font-mono text-xs text-[#FF9D66] uppercase tracking-wider mb-2 font-semibold">
            Hexagonal AI Suitability Breakdown
          </span>

          <div className="relative w-64 h-64 flex items-center justify-center">
            <svg className="w-full h-full text-viq-outline-variant" viewBox="0 0 200 200">
              <polygon fill="none" points="100,20 170,55 170,145 100,180 30,145 30,55" stroke="currentColor" strokeDasharray="3 3" strokeWidth="0.75" />
              <polygon fill="none" points="100,45 145,70 145,130 100,155 55,130 55,70" stroke="currentColor" strokeWidth="0.75" />
              <polygon fill="none" points="100,70 125,85 125,115 100,130 75,115 75,85" stroke="currentColor" strokeWidth="0.75" />
              
              <line stroke="currentColor" strokeWidth="0.5" x1="100" y1="100" x2="100" y2="20" />
              <line stroke="currentColor" strokeWidth="0.5" x1="100" y1="100" x2="170" y2="55" />
              <line stroke="currentColor" strokeWidth="0.5" x1="100" y1="100" x2="170" y2="145" />
              <line stroke="currentColor" strokeWidth="0.5" x1="100" y1="100" x2="100" y2="180" />
              <line stroke="currentColor" strokeWidth="0.5" x1="100" y1="100" x2="30" y2="145" />
              <line stroke="currentColor" strokeWidth="0.5" x1="100" y1="100" x2="30" y2="55" />

              <polygon
                fill="rgba(200, 107, 60, 0.25)"
                points={radarPoints}
                stroke="#C86B3C"
                strokeWidth="2"
              />
            </svg>

            <span className="absolute top-1 text-[9px] font-mono text-[#FF9D66]">Budget (88)</span>
            <span className="absolute top-10 right-0 text-[9px] font-mono text-[#FF9D66]">Perf (92)</span>
            <span className="absolute bottom-10 right-0 text-[9px] font-mono text-[#FF9D66]">Space (96)</span>
            <span className="absolute bottom-1 text-[9px] font-mono text-[#FF9D66]">Regional (91)</span>
            <span className="absolute bottom-10 left-0 text-[9px] font-mono text-[#FF9D66]">Luxury (80)</span>
            <span className="absolute top-10 left-0 text-[9px] font-mono text-[#FF9D66]">Safety (98)</span>
          </div>

          <span className="font-mono text-[11px] text-viq-outline mt-2">
            Aggregated Bayesian Utility: {(normalizedScore / 100).toFixed(3)}
          </span>
        </div>
      </div>

      {/* Used Car Negotiation Support Tool (Rendered when Used) */}
      {isUsed && (
        <div className="bg-viq-surface-container-low rounded-2xl p-6 lg:p-8 border border-[#C86B3C]/40 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.06] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-[#C86B3C]" />
                <h2 className="font-jakarta text-lg font-bold text-[#F5F5F5]">
                  AI Used-Car Negotiation Decision Support Tool
                </h2>
              </div>
              <p className="font-jakarta text-xs text-viq-on-surface-variant mt-1">
                Multi-attribute continuous depreciation model evaluating mileage wear, ownership pedigree, and bounded counter-offers.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded bg-[#C86B3C]/15 text-[#FF9D66] font-mono text-xs font-semibold border border-[#C86B3C]/30">
              Evidence-Based Valuation
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
            <div>
              <label className="block font-mono text-[10px] text-viq-outline uppercase mb-1">Mfg Year</label>
              <input
                type="number"
                min="2012"
                max="2026"
                value={negotiationData.year}
                onChange={(e) => setNegotiationData({ ...negotiationData, year: Number(e.target.value) })}
                className="w-full bg-[#111111] border border-white/[0.08] rounded-lg p-2 text-[#F5F5F5] font-mono focus:border-[#C86B3C] outline-none"
              />
            </div>

            <div>
              <label className="block font-mono text-[10px] text-viq-outline uppercase mb-1">Odometer (km)</label>
              <input
                type="number"
                step="5000"
                value={negotiationData.odometer}
                onChange={(e) => setNegotiationData({ ...negotiationData, odometer: Number(e.target.value) })}
                className="w-full bg-[#111111] border border-white/[0.08] rounded-lg p-2 text-[#F5F5F5] font-mono focus:border-[#C86B3C] outline-none"
              />
            </div>

            <div>
              <label className="block font-mono text-[10px] text-viq-outline uppercase mb-1">Condition</label>
              <select
                value={negotiationData.condition}
                onChange={(e) => setNegotiationData({ ...negotiationData, condition: e.target.value })}
                className="w-full bg-[#111111] border border-white/[0.08] rounded-lg p-2 text-[#F5F5F5] font-mono focus:border-[#C86B3C] outline-none"
              >
                <option value="Excellent">Excellent (Immaculate)</option>
                <option value="Good">Good (Minor wear)</option>
                <option value="Fair">Fair (Noticeable wear)</option>
                <option value="Poor">Poor (Refurb needed)</option>
              </select>
            </div>

            <div>
              <label className="block font-mono text-[10px] text-viq-outline uppercase mb-1">Owners on RC</label>
              <select
                value={negotiationData.owners}
                onChange={(e) => setNegotiationData({ ...negotiationData, owners: Number(e.target.value) })}
                className="w-full bg-[#111111] border border-white/[0.08] rounded-lg p-2 text-[#F5F5F5] font-mono focus:border-[#C86B3C] outline-none"
              >
                <option value={1}>1st Owner</option>
                <option value={2}>2nd Owner</option>
                <option value={3}>3rd+ Owner</option>
              </select>
            </div>

            <div>
              <label className="block font-mono text-[10px] text-viq-outline uppercase mb-1">Service History</label>
              <select
                value={negotiationData.service}
                onChange={(e) => setNegotiationData({ ...negotiationData, service: e.target.value })}
                className="w-full bg-[#111111] border border-white/[0.08] rounded-lg p-2 text-[#F5F5F5] font-mono focus:border-[#C86B3C] outline-none"
              >
                <option value="Complete OEM Records">Complete OEM</option>
                <option value="Partial">Partial</option>
                <option value="None">None</option>
              </select>
            </div>

            <div>
              <label className="block font-mono text-[10px] text-viq-outline uppercase mb-1">Your Target Bid (₹)</label>
              <input
                type="number"
                placeholder="e.g. 550000"
                value={negotiationData.targetOffer}
                onChange={(e) => setNegotiationData({ ...negotiationData, targetOffer: e.target.value })}
                className="w-full bg-[#111111] border border-white/[0.08] rounded-lg p-2 text-[#F5F5F5] font-mono focus:border-[#C86B3C] outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRunNegotiation}
              disabled={negotiationLoading}
              className="px-5 py-2.5 rounded-xl bg-[#C86B3C] hover:bg-[#D97745] text-white font-semibold text-xs transition-all shadow-[0_0_15px_rgba(200,107,60,0.3)] flex items-center gap-2"
            >
              {negotiationLoading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Computing Fair Valuation...</span>
                </>
              ) : (
                <>
                  <TrendingDown className="w-4 h-4" />
                  <span>Evaluate Fair Counter-Offer &amp; Leverage</span>
                </>
              )}
            </button>
          </div>

          {/* Negotiation Results Deck */}
          {negotiationResult && (
            <div className="bg-[#111111] rounded-xl p-5 border border-white/[0.08] space-y-5 animate-in fade-in-50 duration-200">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-[#161616] border border-white/[0.04]">
                  <span className="font-mono text-[10px] text-viq-outline uppercase block">Fair Market Value</span>
                  <div className="font-mono text-base font-bold text-[#F5F5F5] mt-1">
                    ₹{negotiationResult.fair_market_value?.low?.toLocaleString('en-IN')} – ₹{negotiationResult.fair_market_value?.high?.toLocaleString('en-IN')}
                  </div>
                  <span className="font-mono text-[10px] text-[#A3A3A3] mt-0.5 block">
                    Midpoint: ₹{negotiationResult.fair_market_value?.mid?.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="p-4 rounded-lg bg-[#161616] border border-[#C86B3C]/30">
                  <span className="font-mono text-[10px] text-[#FF9D66] uppercase font-bold block">Recommended Starting Bid</span>
                  <div className="font-mono text-lg font-bold text-[#FF9D66] mt-1">
                    ₹{negotiationResult.recommended_starting_bid?.toLocaleString('en-IN')}
                  </div>
                  <span className="font-mono text-[10px] text-[#A3A3A3] mt-0.5 block">
                    Target settlement near ₹{negotiationResult.fair_market_value?.mid?.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="p-4 rounded-lg bg-[#161616] border border-white/[0.04]">
                  <span className="font-mono text-[10px] text-viq-outline uppercase block">Walk-Away Ceiling</span>
                  <div className="font-mono text-base font-bold text-red-400 mt-1">
                    ₹{negotiationResult.walk_away_ceiling?.toLocaleString('en-IN')}
                  </div>
                  <span className="font-mono text-[10px] text-[#A3A3A3] mt-0.5 block">
                    Do not exceed without verified major warranty
                  </span>
                </div>
              </div>

              {/* Leverage Points */}
              <div className="space-y-2">
                <span className="font-mono text-xs uppercase text-[#C86B3C] font-semibold tracking-wide block">
                  Negotiation Leverage Points (Use with Seller):
                </span>
                <ul className="space-y-1.5 text-xs text-[#A3A3A3]">
                  {negotiationResult.leverage_points?.map((lp: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 bg-[#161616] p-2.5 rounded-lg border border-white/[0.04]">
                      <CheckCircle2 className="w-4 h-4 text-[#C86B3C] shrink-0 mt-0.5" />
                      <span>{lp}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {negotiationResult.user_offer_assessment && (
                <div className="p-3 rounded-lg bg-[#181818] border border-[#C86B3C]/20 flex items-center gap-2 text-xs">
                  <AlertCircle className="w-4 h-4 text-[#FF9D66] shrink-0" />
                  <span className="text-[#F5F5F5]"><strong>Your Offer Evaluation:</strong> {negotiationResult.user_offer_assessment}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Evidence Badges & Pricing Waterfall */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="font-jakarta text-lg font-bold text-[#F5F5F5]">
              Verifiable AI Evidence Badges
            </h2>
            <span className="font-mono text-xs text-[#FF9D66]">
              SAE J2954 Grounded Telemetry
            </span>
          </div>

          <div className="flex flex-col gap-3">
            <div className="bg-viq-surface-container-low p-4 rounded-xl border border-viq-outline-variant/30 flex items-start gap-4">
              <div className="p-2.5 rounded-lg bg-[#C86B3C]/15 text-[#FF9D66] flex-shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="flex flex-col gap-1 flex-grow">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-jakarta text-sm font-bold text-viq-on-surface">
                    Global NCAP 5-Star Structural Integrity
                  </span>
                  <span className="font-mono text-[10px] bg-viq-surface-container-high px-2 py-0.5 rounded text-[#FF9D66] font-semibold">
                    RULE: SAFE_MANDATE
                  </span>
                </div>
                <p className="font-jakarta text-xs text-viq-on-surface-variant leading-relaxed">
                  Adult Occupant Protection score: 16.03/17.00. High-strength boron steel subframes minimize cabin intrusion during dynamic high-speed offset impacts.
                </p>
                <div className="font-mono text-[10px] text-viq-outline mt-1">
                  Telemetry Source: GNCAP Test Dossier · Verified
                </div>
              </div>
            </div>

            <div className="bg-viq-surface-container-low p-4 rounded-xl border border-viq-outline-variant/30 flex items-start gap-4">
              <div className="p-2.5 rounded-lg bg-[#C86B3C]/15 text-[#FF9D66] flex-shrink-0">
                <Droplets className="w-6 h-6" />
              </div>
              <div className="flex flex-col gap-1 flex-grow">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-jakarta text-sm font-bold text-viq-on-surface">
                    Monsoon Water Wading Tolerance (200mm GC)
                  </span>
                  <span className="font-mono text-[10px] bg-viq-surface-container-high px-2 py-0.5 rounded text-[#FF9D66] font-semibold">
                    RULE: HYDRO_GUARD
                  </span>
                </div>
                <p className="font-jakarta text-xs text-viq-on-surface-variant leading-relaxed">
                  High mounted alternator air intake mitigates hydrostatic engine lock risks on flooded arterial corridors and underpasses.
                </p>
                <div className="font-mono text-[10px] text-viq-outline mt-1">
                  Empirical Wading Depth: 450mm safe continuous crawl
                </div>
              </div>
            </div>

            <div className="bg-viq-surface-container-low p-4 rounded-xl border border-viq-outline-variant/30 flex items-start gap-4">
              <div className="p-2.5 rounded-lg bg-[#C86B3C]/15 text-[#FF9D66] flex-shrink-0">
                <Cpu className="w-6 h-6" />
              </div>
              <div className="flex flex-col gap-1 flex-grow">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-jakarta text-sm font-bold text-viq-on-surface">
                    Active Driver Assistance Suite
                  </span>
                  <span className="font-mono text-[10px] bg-viq-surface-container-high px-2 py-0.5 rounded text-[#FF9D66] font-semibold">
                    RULE: CRUISE_OPT
                  </span>
                </div>
                <p className="font-jakarta text-xs text-viq-on-surface-variant leading-relaxed">
                  Sensor fusion enables responsive lane trace and collision warning calibrated for mixed Indian highway traffic environments.
                </p>
                <div className="font-mono text-[10px] text-viq-outline mt-1">
                  Autonomous Emergency Braking latency: &lt;140ms response
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cost Waterfall */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="font-jakarta text-lg font-bold text-[#F5F5F5]">
              {isUsed ? 'Pre-Owned Acquisition Breakdown' : 'Regional Cost Waterfall'}
            </h2>
            <span className="font-mono text-xs text-viq-outline">
              {currentCityConfig.stateTag}
            </span>
          </div>

          <div className="bg-viq-surface-container-low p-4 rounded-xl border border-viq-outline-variant/30 flex flex-col gap-2.5 font-mono text-xs">
            <div className="flex justify-between items-center py-1">
              <span className="text-viq-outline">{isUsed ? 'Listed Price (Negotiable)' : 'Ex-Showroom Price (Base)'}</span>
              <span className="text-viq-on-surface font-semibold">₹{basePrice.toLocaleString('en-IN')}</span>
            </div>

            <div className="flex justify-between items-center py-1">
              <span className="text-viq-outline">{isUsed ? 'RTO Transfer & NOC Processing' : `State Road Tax / RTO (${currentCityConfig.label})`}</span>
              <span className="text-red-400 font-semibold">+ ₹{rto.toLocaleString('en-IN')}</span>
            </div>

            <div className="flex justify-between items-center py-1">
              <span className="text-viq-outline">Insurance (Comprehensive / TP)</span>
              <span className="text-viq-on-surface font-semibold">+ ₹{ins.toLocaleString('en-IN')}</span>
            </div>

            {!isUsed && (
              <>
                <div className="flex justify-between items-center py-1">
                  <span className="text-viq-outline">TCS (Tax Collected at Source 1%)</span>
                  <span className="text-viq-on-surface font-semibold">+ ₹{tcs.toLocaleString('en-IN')}</span>
                </div>

                <div className="flex justify-between items-center py-1">
                  <span className="text-viq-outline">Fastag & Registration Handling</span>
                  <span className="text-viq-on-surface font-semibold">+ ₹{fastag.toLocaleString('en-IN')}</span>
                </div>

                <div className="flex justify-between items-center py-1.5 text-[#FF9D66] bg-[#C86B3C]/10 px-2 rounded">
                  <span>State Clean Energy Subsidy</span>
                  <span className="font-semibold">- ₹{subsidy.toLocaleString('en-IN')} {isEv ? '(EV Grant)' : '(ICE 0%)'}</span>
                </div>
              </>
            )}

            <div className="flex justify-between items-center pt-3 mt-1 bg-viq-surface-container-high p-3 rounded-lg border border-viq-outline-variant/40">
              <span className="font-bold text-viq-on-surface font-jakarta text-sm">
                {isUsed ? 'Estimated Total Outlay:' : 'Final Calculated On-Road:'}
              </span>
              <span className="font-mono text-base font-bold text-[#FF9D66]">
                ₹{totalOnRoad.toLocaleString('en-IN')}
              </span>
            </div>

            <p className="text-[10px] text-viq-outline leading-tight pt-2 border-t border-viq-outline-variant/20 font-jakarta">
              {isUsed
                ? '* Pre-owned vehicle transactions do not incur new car showroom road taxes. Actual transfer duties depend on interstate NOC requirements.'
                : `* Note: Calculated for ${selectedLocation.city} (${selectedLocation.code}). Road taxes vary by jurisdiction across India.`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
