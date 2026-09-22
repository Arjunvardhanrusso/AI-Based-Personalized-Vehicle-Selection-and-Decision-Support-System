import React from 'react';
import type { Vehicle, VehicleRanking, SelectedLocation } from '../types';
import { 
  GitCompare, 
  Trash2, 
  ArrowRight
} from 'lucide-react';
import { VehicleImage } from '../components/VehicleImage';

interface CompareTabProps {
  compareSlots: string[];
  vehicles: Vehicle[];
  rankings: VehicleRanking[];
  onRemoveSlot: (vehicleId: string) => void;
  onClearAll: () => void;
  onInspectVehicle: (vehicleId: string) => void;
  selectedLocation: SelectedLocation;
}

export const CompareTab: React.FC<CompareTabProps> = ({
  compareSlots,
  vehicles,
  rankings,
  onRemoveSlot,
  onClearAll,
  onInspectVehicle,
  selectedLocation
}) => {
  const comparedVehicles: Array<{
    id: string;
    name: string;
    brand: string;
    fuel_type: string;
    price_inr: number;
    power_bhp: number;
    torque_nm: number;
    ground_clearance_mm: number;
    seating_capacity: number;
    boot_space_litres: number;
    ncap_rating: number;
    image_src?: string;
    body_type?: string;
    variant_name?: string;
  }> = compareSlots.map(slotId => {
    const foundRnk = rankings.find(r => r.vehicle_id === slotId || r.name.toLowerCase() === slotId.toLowerCase());
    if (foundRnk) {
      return {
        id: foundRnk.vehicle_id,
        name: foundRnk.name,
        brand: foundRnk.brand,
        fuel_type: foundRnk.fuel_type,
        price_inr: foundRnk.price_inr,
        power_bhp: foundRnk.power_bhp || 180,
        torque_nm: foundRnk.torque_nm || 350,
        ground_clearance_mm: foundRnk.ground_clearance_mm || 190,
        seating_capacity: foundRnk.seating_capacity || 5,
        boot_space_litres: foundRnk.boot_space_litres || 450,
        ncap_rating: foundRnk.ncap_rating || 5,
        image_src: foundRnk.image_url || foundRnk.image_path,
        body_type: foundRnk.body_type || foundRnk.segment,
        variant_name: foundRnk.variant_name,
      };
    }
    const foundVeh = vehicles.find(v => v.id === slotId || v.name.toLowerCase() === slotId.toLowerCase());
    if (foundVeh) {
      return {
        id: foundVeh.id,
        name: foundVeh.name,
        brand: foundVeh.brand,
        fuel_type: foundVeh.fuel_type,
        price_inr: foundVeh.price_inr,
        power_bhp: 160,
        torque_nm: 300,
        ground_clearance_mm: foundVeh.ground_clearance_mm,
        seating_capacity: foundVeh.seating_capacity,
        boot_space_litres: foundVeh.boot_space_litres,
        ncap_rating: foundVeh.ncap_rating || 5,
        image_src: foundVeh.image_url || foundVeh.image_path,
        body_type: foundVeh.vehicle_segment,
        variant_name: undefined,
      };
    }
    return {
      id: slotId,
      name: slotId,
      brand: 'Selected',
      fuel_type: slotId.toLowerCase().includes('ev') ? 'ev' : 'petrol',
      price_inr: 2000000,
      power_bhp: 180,
      torque_nm: 350,
      ground_clearance_mm: 190,
      seating_capacity: 5,
      boot_space_litres: 450,
      ncap_rating: 5,
      image_src: undefined,
      body_type: undefined,
      variant_name: undefined,
    };
  });

  const formatLakhs = (amount: number) => {
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(2)} Cr`;
    }
    return `₹${(amount / 100000).toFixed(2)} Lakh`;
  };

  return (
    <div className="flex flex-col w-full px-4 lg:px-10 py-6 gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <GitCompare className="w-5 h-5 text-amber-400" />
            <h1 className="font-jakarta text-2xl font-extrabold text-viq-primary">
              Multi-Vehicle Benchmark Matrix
            </h1>
          </div>
          <p className="font-jakarta text-xs text-viq-on-surface-variant">
            Cross-evaluate telemetry attributes, 5-year running cost TCO, structural safety credentials, and on-road pricing for {selectedLocation.city} ({selectedLocation.code}).
          </p>
        </div>

        {compareSlots.length > 0 && (
          <button
            onClick={onClearAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-viq-surface-container hover:bg-viq-error-container/20 text-viq-error font-mono text-xs border border-viq-outline-variant/30 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Comparison Slots</span>
          </button>
        )}
      </div>

      {comparedVehicles.length === 0 ? (
        <div className="bg-viq-surface-container-low rounded-2xl p-12 border border-viq-outline-variant/30 text-center flex flex-col items-center justify-center gap-4">
          <div className="p-4 rounded-full bg-viq-surface-container text-viq-outline">
            <GitCompare className="w-8 h-8" />
          </div>
          <h3 className="font-jakarta text-lg font-bold text-viq-primary">
            No Vehicles Selected for Benchmarking
          </h3>
          <p className="font-jakarta text-xs text-viq-on-surface-variant max-w-md">
            Click the compare button on any vehicle card in the Match Explorer to build your side-by-side telemetry benchmark.
          </p>
        </div>
      ) : (
        <div className="bg-viq-surface-container-low rounded-2xl border border-viq-outline-variant/30 overflow-x-auto shadow-xl">
          <table className="w-full text-left border-collapse font-mono text-xs">
            <thead>
              <tr className="bg-viq-surface-container border-b border-viq-outline-variant/40">
                <th className="p-4 w-64 text-viq-outline uppercase font-semibold">Attribute / Vehicle</th>
                {comparedVehicles.map((veh) => (
                  <th key={veh.id} className="p-4 min-w-[240px] border-l border-viq-outline-variant/30">
                    <div className="flex flex-col gap-2">
                      {/* Vehicle Thumbnail Box */}
                      <div className="relative h-28 w-full rounded-lg bg-viq-surface-container-high/60 border border-viq-outline-variant/30 overflow-hidden p-2 flex items-center justify-center">
                        <VehicleImage
                          src={veh.image_src}
                          vehicleId={veh.id}
                          brand={veh.brand}
                          model={veh.name}
                          variant={veh.variant_name}
                          bodyType={veh.body_type}
                          alt={`${veh.brand} ${veh.name}`}
                          className="w-full h-full bg-transparent"
                        />
                      </div>
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] text-viq-primary-fixed uppercase tracking-wider block font-semibold">
                            {veh.brand}
                          </span>
                          <h4 className="font-jakarta text-sm font-bold text-viq-primary">
                            {veh.name}
                          </h4>
                        </div>
                        <button
                          onClick={() => onRemoveSlot(veh.id)}
                          className="p-1 rounded text-viq-outline hover:text-viq-error transition-colors"
                          title="Remove from comparison"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <span className="font-mono text-xs font-bold text-viq-tertiary-fixed">
                        {formatLakhs(veh.price_inr)} Ex-Showroom
                      </span>
                      <button
                        onClick={() => onInspectVehicle(veh.id)}
                        className="mt-1 py-1 px-2.5 rounded bg-viq-surface-container-highest hover:bg-viq-primary-container hover:text-viq-on-primary text-viq-primary font-jakarta text-[11px] font-semibold transition-all flex items-center justify-center gap-1"
                      >
                        <span>Deep Dive</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-viq-outline-variant/20">
              <tr className="bg-viq-surface-container-high/40">
                <td colSpan={comparedVehicles.length + 1} className="p-2.5 font-bold text-viq-primary font-jakarta text-xs uppercase tracking-wider">
                  Powertrain & Track Dynamics
                </td>
              </tr>
              <tr>
                <td className="p-3.5 text-viq-outline">Fuel Type & Architecture</td>
                {comparedVehicles.map(v => (
                  <td key={v.id} className="p-3.5 text-viq-on-surface border-l border-viq-outline-variant/20 uppercase">
                    {v.fuel_type}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-3.5 text-viq-outline">Power Output</td>
                {comparedVehicles.map(v => (
                  <td key={v.id} className="p-3.5 text-viq-primary-container font-semibold border-l border-viq-outline-variant/20">
                    {v.power_bhp} bhp
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-3.5 text-viq-outline">Peak Torque</td>
                {comparedVehicles.map(v => (
                  <td key={v.id} className="p-3.5 text-viq-on-surface border-l border-viq-outline-variant/20">
                    {v.torque_nm} Nm
                  </td>
                ))}
              </tr>

              <tr className="bg-viq-surface-container-high/40">
                <td colSpan={comparedVehicles.length + 1} className="p-2.5 font-bold text-viq-primary font-jakarta text-xs uppercase tracking-wider">
                  Practicality & Indian Road Readiness
                </td>
              </tr>
              <tr>
                <td className="p-3.5 text-viq-outline">Ground Clearance (Monsoon Wading)</td>
                {comparedVehicles.map(v => {
                  const gc = v.ground_clearance_mm;
                  const isSafe = gc >= 190;
                  return (
                    <td key={v.id} className={`p-3.5 font-semibold border-l border-viq-outline-variant/20 ${isSafe ? 'text-viq-tertiary-fixed' : 'text-amber-400'}`}>
                      {gc} mm {isSafe ? '(High Clearance)' : '(Ramp Scrape Risk)'}
                    </td>
                  );
                })}
              </tr>
              <tr>
                <td className="p-3.5 text-viq-outline">Seating Capacity</td>
                {comparedVehicles.map(v => (
                  <td key={v.id} className="p-3.5 text-viq-on-surface border-l border-viq-outline-variant/20">
                    {v.seating_capacity} Occupants
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-3.5 text-viq-outline">Boot Storage Volume</td>
                {comparedVehicles.map(v => (
                  <td key={v.id} className="p-3.5 text-viq-on-surface border-l border-viq-outline-variant/20">
                    {v.boot_space_litres} Litres
                  </td>
                ))}
              </tr>

              <tr className="bg-viq-surface-container-high/40">
                <td colSpan={comparedVehicles.length + 1} className="p-2.5 font-bold text-viq-primary font-jakarta text-xs uppercase tracking-wider">
                  Safety & Crashworthiness
                </td>
              </tr>
              <tr>
                <td className="p-3.5 text-viq-outline">Global NCAP Crash Rating</td>
                {comparedVehicles.map(v => (
                  <td key={v.id} className="p-3.5 text-viq-tertiary-fixed font-bold border-l border-viq-outline-variant/20">
                    ★ ★ ★ ★ ★ ({v.ncap_rating}-Star)
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
