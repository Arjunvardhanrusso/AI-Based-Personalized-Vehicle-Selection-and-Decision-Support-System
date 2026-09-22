import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiGetGarage, fetchVariants } from '../services/api';
import type { SavedVehicle, VehicleVariant, SelectedLocation } from '../types';
import { LeadFormModal } from '../components/LeadFormModal';

interface GaragePageProps {
  selectedLocation?: SelectedLocation;
  onInspectVehicle?: (vehicleId: string) => void;
  onNavigateAuth?: () => void;
}

export const GaragePage: React.FC<GaragePageProps> = ({
  selectedLocation,
  onInspectVehicle,
  onNavigateAuth
}) => {
  const { user, loading: authLoading, toggleSaveVehicle } = useAuth();
  const [savedItems, setSavedItems] = useState<SavedVehicle[]>([]);
  const [allVariants, setAllVariants] = useState<Record<string, VehicleVariant>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [leadModalVariantId, setLeadModalVariantId] = useState<string | null>(null);

  const loadGarageData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const [garageList, variantsList] = await Promise.all([
        apiGetGarage(),
        fetchVariants(selectedLocation?.state, selectedLocation?.city).catch(() => [])
      ]);
      setSavedItems(garageList);
      
      const vMap: Record<string, VehicleVariant> = {};
      for (const v of variantsList) {
        vMap[v.id] = v;
      }
      setAllVariants(vMap);
    } catch {
      setError('Unable to fetch saved garage entries.');
    } finally {
      setLoading(false);
    }
  }, [user, selectedLocation]);

  useEffect(() => {
    loadGarageData();
  }, [loadGarageData]);

  const handleRemove = async (variantId: string) => {
    try {
      await toggleSaveVehicle(variantId);
      setSavedItems((prev) => prev.filter((item) => item.vehicle_variant_id !== variantId));
    } catch (err: any) {
      setError(err.message || 'Failed to remove from garage');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="py-20 text-center text-viq-on-surface">
        <div className="inline-block w-8 h-8 border-4 border-viq-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="font-mono text-xs uppercase tracking-widest text-viq-outline">Accessing Garage Telemetry...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="py-20 px-4 max-w-md mx-auto text-center text-viq-on-surface">
        <div className="bg-viq-surface-container-high border border-viq-outline-variant/30 rounded-2xl p-8 shadow-2xl">
          <div className="w-16 h-16 bg-viq-primary-container/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-viq-primary/30">
            <span className="material-symbols-outlined text-viq-primary text-3xl">garage</span>
          </div>
          <h2 className="text-2xl font-bold font-jakarta mb-2">My Saved Garage</h2>
          <p className="text-viq-on-surface-variant text-sm mb-6">
            Please log in to your VehicleIQ profile to bookmark, track on-road price drops, and manage your vehicle shortlist.
          </p>
          <button
            onClick={onNavigateAuth}
            className="w-full bg-viq-primary hover:bg-viq-primary-hover text-viq-on-primary font-bold text-sm py-2.5 rounded-lg transition-colors cursor-pointer"
          >
            Sign In to Access Garage
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-viq-on-surface">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-viq-outline-variant/20">
        <div>
          <span className="font-mono text-label-caps text-viq-primary uppercase tracking-widest">
            PERSISTENT SHORTLIST • {savedItems.length} SAVED
          </span>
          <h1 className="text-3xl font-bold font-jakarta mt-1">Vehicle Garage</h1>
          <p className="text-viq-on-surface-variant text-sm mt-1">
            Track real-time pricing benchmark, spec comparisons, and allocation alerts.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 text-red-400 text-sm rounded-lg">
          {error}
        </div>
      )}

      {savedItems.length === 0 ? (
        <div className="bg-viq-surface-container-low border border-viq-outline-variant/20 rounded-2xl p-12 text-center max-w-lg mx-auto">
          <span className="material-symbols-outlined text-viq-outline text-5xl mb-3">directions_car</span>
          <h3 className="text-lg font-bold font-jakarta mb-1">Your Garage is Empty</h3>
          <p className="text-viq-on-surface-variant text-xs mb-6">
            Explore recommendations or search models and click the bookmark icon to save vehicles to your garage.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedItems.map((item) => {
            const variant = allVariants[item.vehicle_variant_id];
            const title = variant ? `${variant.brand} ${variant.model_name}` : item.vehicle_variant_id;
            const subTitle = variant ? variant.variant_name : 'Saved Variant';
            const price = variant?.resolved_ex_showroom_price || variant?.price_inr || 0;
            const imgPath = variant?.image_path || '/assets/cars/default_vehicle.svg';

            return (
              <div
                key={item.id}
                className="bg-viq-surface-container-high border border-viq-outline-variant/30 rounded-2xl overflow-hidden shadow-xl hover:border-viq-primary/50 transition-all flex flex-col"
              >
                <div className="relative h-44 bg-viq-surface-container-lowest overflow-hidden flex items-center justify-center">
                  <img
                    src={imgPath}
                    alt={title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/assets/cars/default_vehicle.svg';
                    }}
                  />
                  <div className="absolute top-3 right-3 bg-viq-surface-container-lowest/80 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-mono font-bold text-viq-primary border border-viq-primary/30">
                    {variant?.fuel_type?.toUpperCase() || 'PETROL'}
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="text-xs font-mono text-viq-outline uppercase tracking-wider">
                      {variant?.brand || 'VEHICLE'}
                    </div>
                    <h3 className="text-lg font-bold font-jakarta text-viq-on-surface mt-0.5">
                      {title}
                    </h3>
                    <p className="text-xs text-viq-on-surface-variant mb-3">{subTitle}</p>

                    <div className="text-xl font-extrabold font-mono text-viq-primary mb-4">
                      {price > 0 ? `₹${(price / 100000).toFixed(2)} Lakh` : 'Price on Request'}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs font-mono text-viq-on-surface-variant bg-viq-surface-container-lowest p-2.5 rounded-lg border border-viq-outline-variant/10 mb-4">
                      <div>Transmission: <strong className="text-viq-on-surface">{variant?.transmission?.[0] || 'Manual'}</strong></div>
                      <div>Body: <strong className="text-viq-on-surface">{variant?.body_type || 'Car'}</strong></div>
                      <div>NCAP: <strong className="text-viq-on-surface">{variant?.ncap_rating ? `${variant.ncap_rating}★` : '4★'}</strong></div>
                      <div>Boot: <strong className="text-viq-on-surface">{variant?.boot_space_litres || 350}L</strong></div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-viq-outline-variant/20">
                    {onInspectVehicle && variant?.vehicle_id && (
                      <button
                        onClick={() => onInspectVehicle(variant.vehicle_id)}
                        className="flex-1 bg-viq-surface-container-lowest hover:bg-viq-surface-container border border-viq-outline-variant/30 text-xs font-bold py-2 rounded-lg transition-colors cursor-pointer text-center"
                      >
                        Inspect Dossier
                      </button>
                    )}
                    <button
                      onClick={() => setLeadModalVariantId(item.vehicle_variant_id)}
                      className="flex-1 bg-viq-primary hover:bg-viq-primary-hover text-viq-on-primary text-xs font-bold py-2 rounded-lg transition-colors cursor-pointer text-center"
                    >
                      Get Quote
                    </button>
                    <button
                      onClick={() => handleRemove(item.vehicle_variant_id)}
                      aria-label="Remove vehicle"
                      className="p-2 hover:bg-red-500/20 text-viq-outline hover:text-red-400 rounded-lg transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[20px]">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {leadModalVariantId && (
        <LeadFormModal
          variantId={leadModalVariantId}
          isOpen={true}
          onClose={() => setLeadModalVariantId(null)}
        />
      )}
    </div>
  );
};

export default GaragePage;
