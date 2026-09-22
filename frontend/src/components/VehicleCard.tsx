import React from 'react';
import type { VehicleRanking, Vehicle, SelectedLocation } from '../types';
import {
  Heart,
  Fuel,
  Gauge,
  Users,
  Info
} from 'lucide-react';
import { VehicleImage } from './VehicleImage';
import { useAuth } from '../context/AuthContext';

interface VehicleCardProps {
  ranking?: VehicleRanking;
  vehicle?: Vehicle;
  rankIndex: number;
  onInspect: (vehicleId: string) => void;
  onToggleCompare: (vehicleId: string) => void;
  isCompared: boolean;
  selectedLocation?: SelectedLocation;
  selectedCity?: string;
}

type FuelType =
  | 'petrol'
  | 'diesel'
  | 'cng'
  | 'lpg'
  | 'ev'
  | 'electric'
  | 'hybrid'
  | 'phev'
  | 'offroad(4X4)'
  | '4x4'
  | 'unknown';

interface RegistrationResult {
  stateCode: string;
  stateName: string;
  registrationFee: number;
  roadTax: number;
  otherRegistrationCharges: number;
  estimatedInsurance: number;
  estimatedTcs: number;
  estimatedOnRoad: number;
  taxMethod: string;
  status: 'RULE-BASED' | 'CENTRAL-FEE' | 'OFFICIAL-RATE-REQUIRED';
  note: string;
}

interface StateConfig {
  code: string;
  name: string;
}

const INDIA_JURISDICTIONS: StateConfig[] = [
  { code: 'AP', name: 'Andhra Pradesh' },
  { code: 'AR', name: 'Arunachal Pradesh' },
  { code: 'AS', name: 'Assam' },
  { code: 'BR', name: 'Bihar' },
  { code: 'CG', name: 'Chhattisgarh' },
  { code: 'GA', name: 'Goa' },
  { code: 'GJ', name: 'Gujarat' },
  { code: 'HR', name: 'Haryana' },
  { code: 'HP', name: 'Himachal Pradesh' },
  { code: 'JH', name: 'Jharkhand' },
  { code: 'KA', name: 'Karnataka' },
  { code: 'KL', name: 'Kerala' },
  { code: 'MP', name: 'Madhya Pradesh' },
  { code: 'MH', name: 'Maharashtra' },
  { code: 'MN', name: 'Manipur' },
  { code: 'ML', name: 'Meghalaya' },
  { code: 'MZ', name: 'Mizoram' },
  { code: 'NL', name: 'Nagaland' },
  { code: 'OD', name: 'Odisha' },
  { code: 'PB', name: 'Punjab' },
  { code: 'RJ', name: 'Rajasthan' },
  { code: 'SK', name: 'Sikkim' },
  { code: 'TN', name: 'Tamil Nadu' },
  { code: 'TS', name: 'Telangana' },
  { code: 'TR', name: 'Tripura' },
  { code: 'UP', name: 'Uttar Pradesh' },
  { code: 'UK', name: 'Uttarakhand' },
  { code: 'WB', name: 'West Bengal' },
  { code: 'AN', name: 'Andaman and Nicobar Islands' },
  { code: 'CH', name: 'Chandigarh' },
  { code: 'DN', name: 'Dadra and Nagar Haveli and Daman and Diu' },
  { code: 'DL', name: 'Delhi' },
  { code: 'JK', name: 'Jammu and Kashmir' },
  { code: 'LA', name: 'Ladakh' },
  { code: 'LD', name: 'Lakshadweep' },
  { code: 'PY', name: 'Puducherry' }
];

const LOCATION_TO_STATE: Record<string, string> = {
  BLR: 'KA',
  MAA: 'TN',
  DEL: 'DL',
  BOM: 'MH',
  BENGALURU: 'KA',
  BANGALORE: 'KA',
  CHENNAI: 'TN',
  MUMBAI: 'MH',
  DELHI: 'DL',
  HYDERABAD: 'TS',
  PUNE: 'MH',
  KOLKATA: 'WB',
  AHMEDABAD: 'GJ',
  JAIPUR: 'RJ',
  LUCKNOW: 'UP',
};

const normalizeFuel = (fuel?: string): FuelType => {
  const value = (fuel || '').toLowerCase().trim();
  if (value.includes('electric') || value === 'ev') return 'ev';
  if (value.includes('diesel')) return 'diesel';
  if (value.includes('petrol') || value.includes('gasoline')) return 'petrol';
  if (value.includes('cng')) return 'cng';
  if (value.includes('lpg')) return 'lpg';
  if (value.includes('phev')) return 'phev';
  if (value.includes('hybrid')) return 'hybrid';
  return 'unknown';
};

const resolveState = (selectedLoc?: SelectedLocation | string): StateConfig => {
  let codeStr = '';
  let nameStr = '';

  if (typeof selectedLoc === 'object' && selectedLoc !== null) {
    codeStr = selectedLoc.code || '';
    nameStr = selectedLoc.state || selectedLoc.city || '';
  } else if (typeof selectedLoc === 'string') {
    codeStr = selectedLoc;
    nameStr = selectedLoc;
  }

  const normalizedCode = codeStr.trim().toUpperCase();
  const normalizedName = nameStr.trim().toUpperCase().replace(/\s+/g, ' ');

  const mappedCode = LOCATION_TO_STATE[normalizedCode] || LOCATION_TO_STATE[normalizedName];
  if (mappedCode) {
    const found = INDIA_JURISDICTIONS.find(s => s.code === mappedCode);
    if (found) return found;
  }

  const directMatch = INDIA_JURISDICTIONS.find(
    s => s.code === normalizedCode || s.name.toUpperCase() === normalizedName
  );
  if (directMatch) return directMatch;

  return {
    code: normalizedCode || 'DL',
    name: nameStr || 'Delhi'
  };
};

const calculateRegistration = (
  selectedLoc: SelectedLocation | string | undefined,
  exShowroom: number,
  fuel: FuelType
): RegistrationResult => {
  const state = resolveState(selectedLoc);
  const registrationFee = 5000;
  const insurance = Math.round(exShowroom * 0.045);
  const tcs = exShowroom > 1000000 ? Math.round(exShowroom * 0.01) : 0;
  let roadTax = Math.round(exShowroom * 0.12);

  if (state.code === 'MH') roadTax = Math.round(exShowroom * 0.12);
  else if (state.code === 'KA') roadTax = Math.round(exShowroom * 0.1887);
  else if (state.code === 'TN') roadTax = Math.round(exShowroom * 0.15);
  else if (state.code === 'DL') roadTax = fuel === 'ev' ? 0 : Math.round(exShowroom * 0.10);

  const estimatedOnRoad = exShowroom + roadTax + registrationFee + insurance + tcs;

  return {
    stateCode: state.code,
    stateName: state.name,
    registrationFee,
    roadTax,
    otherRegistrationCharges: 0,
    estimatedInsurance: insurance,
    estimatedTcs: tcs,
    estimatedOnRoad,
    taxMethod: `${state.name} Road Tax`,
    status: 'RULE-BASED',
    note: `Calculated for ${state.name}`
  };
};

export const VehicleCard: React.FC<VehicleCardProps> = ({
  ranking,
  vehicle,
  rankIndex,
  onInspect,
  onToggleCompare,
  isCompared,
  selectedLocation,
  selectedCity
}) => {
  const { user, isVehicleSaved, toggleSaveVehicle } = useAuth();
  const vehName = ranking?.name || vehicle?.name || 'Hyundai Creta';
  const brandName = ranking?.brand || vehicle?.brand || 'Hyundai';
  const fuel = ranking?.fuel_type || vehicle?.fuel_type || 'petrol';
  
  const variantName = ranking?.variant_name || (ranking as any)?.model_name 
    ? `${ranking?.variant_name || ranking?.model_name}` 
    : (fuel === 'ev' ? 'Electric Long Range' : 'SX(O) 1.5 Turbo DCT');

  const exShowroom = ranking?.price_inr || vehicle?.price_inr || 1945000;
  const normalizedFuel = normalizeFuel(fuel);
  const registration = calculateRegistration(selectedLocation || selectedCity, exShowroom, normalizedFuel);
  const onRoad = registration.estimatedOnRoad;

  const seating = ranking?.seating_capacity || vehicle?.seating_capacity || 5;
  const transList = ranking?.all_transmissions || ranking?.transmission || vehicle?.transmission;
  const trans = Array.isArray(transList) && transList.length > 0 
    ? transList[0].toUpperCase() 
    : (fuel === 'ev' ? 'Automatic' : 'Automatic');

  const formatLakhs = (amount: number) => {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
    return `₹${(amount / 100000).toFixed(2)} Lakh`;
  };

  const vehId = ranking?.vehicle_id || ranking?.variant_id || vehicle?.id || vehName.toLowerCase().replace(/\s+/g, '_');
  const imageSrc = ranking?.image_url || ranking?.image_path || vehicle?.image_url || vehicle?.image_path;

  return (
    <div className="flex flex-col bg-viq-surface-container-low rounded-2xl overflow-hidden border border-viq-outline-variant/30 hover:border-viq-outline-variant/70 shadow-xl transition-all duration-300 group">
      
      {/* Car Studio Image Box — Exact layout as reference photo */}
      <div className="relative h-44 w-full bg-viq-surface-container flex items-center justify-center p-3 overflow-hidden">
        
        {/* Top Left Match Badge */}
        <div className="absolute top-3 left-3 bg-[#0066FF] text-white px-2.5 py-0.5 rounded-md font-mono text-[11px] font-bold shadow-md z-10">
          #{rankIndex + 1} Match
        </div>

        {/* Top Right Heart Favorite / Garage Save Button */}
        <button
          type="button"
          onClick={async (e) => {
            e.stopPropagation();
            if (user) {
              try {
                await toggleSaveVehicle(vehId);
              } catch {
                onToggleCompare(vehId);
              }
            } else {
              onToggleCompare(vehId);
            }
          }}
          className="absolute top-3 right-3 text-viq-outline hover:text-red-400 p-1.5 rounded-full bg-viq-surface-container-lowest/80 backdrop-blur-md border border-white/10 transition-colors z-10 cursor-pointer"
          title={isVehicleSaved(vehId) || isCompared ? 'Saved in Garage / Benchmark' : 'Save to Garage'}
        >
          <Heart className={`w-4 h-4 ${(isVehicleSaved(vehId) || isCompared) ? 'fill-red-500 text-red-500' : 'text-viq-outline'}`} />
        </button>

        {/* Studio Car Photo — Unclipped Studio Cutout with cascading fallbacks */}
        <VehicleImage
          src={imageSrc}
          vehicleId={vehId}
          brand={brandName}
          model={vehName}
          variant={ranking?.variant_name}
          bodyType={ranking?.body_type || ranking?.segment || vehicle?.vehicle_segment}
          alt={`${brandName} ${vehName}`}
          className="w-full h-full bg-transparent"
          imageClassName="group-hover:scale-105 transition-transform duration-300"
        />
      </div>

      {/* Card Body */}
      <div className="p-4 flex flex-col justify-between gap-3 flex-grow">
        <div>
          <h3 className="font-jakarta text-base font-bold text-viq-on-surface leading-snug">
            {vehName}
          </h3>
          <p className="font-jakarta text-xs text-viq-on-surface-variant mt-0.5 truncate">
            {variantName}
          </p>
        </div>

        {/* Inline Specs */}
        <div className="flex items-center gap-4 text-xs font-mono text-viq-on-surface-variant py-1">
          <span className="flex items-center gap-1">
            <Fuel className="w-3.5 h-3.5 text-viq-outline" />
            <span className="capitalize">{fuel}</span>
          </span>
          <span className="flex items-center gap-1">
            <Gauge className="w-3.5 h-3.5 text-viq-outline" />
            <span>{trans}</span>
          </span>
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-viq-outline" />
            <span>{seating} Seater</span>
          </span>
        </div>

        {/* Price Breakdown Matrix */}
        <div className="flex items-center justify-between pt-2.5 border-t border-viq-outline-variant/30 font-mono">
          <div>
            <span className="text-[10px] text-viq-outline uppercase block">
              {ranking?.is_used || vehicle?.is_used ? 'Used Price' : 'Ex-Showroom'}
            </span>
            <span className="text-sm font-bold text-viq-on-surface">
              {formatLakhs(exShowroom)}
            </span>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-viq-outline uppercase block">
              {ranking?.is_used || vehicle?.is_used ? 'Est. Total / Transfer' : 'Estimated On-Road'}
            </span>
            <span className="text-sm font-bold text-viq-on-surface flex items-center gap-1 justify-end">
              {formatLakhs(onRoad)}
              <span title={registration.note}>
                <Info className="w-3 h-3 text-viq-outline cursor-pointer hover:text-viq-primary" />
              </span>
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-2">
          <button
            type="button"
            onClick={() => onInspect(vehId)}
            className="py-2 px-3 rounded-xl border border-viq-outline-variant/60 text-viq-on-surface hover:bg-viq-surface-container font-jakarta text-xs font-semibold transition-colors text-center"
          >
            View Variants
          </button>
          <button
            type="button"
            onClick={() => onInspect(vehId)}
            className="py-2 px-3 rounded-xl bg-[#0066FF] hover:bg-blue-600 text-white font-jakarta text-xs font-semibold transition-colors shadow-md text-center"
          >
            Select Vehicle
          </button>
        </div>

      </div>
    </div>
  );
};
