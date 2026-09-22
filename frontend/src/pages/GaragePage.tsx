import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { VehicleVariant } from '../types';

const GaragePage: React.FC = () => {
  const [savedVehicles, setSavedVehicles] = useState<any[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchGarage = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Please log in to view your garage.');
          return;
        }
        const res = await api.get('/api/garage', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSavedVehicles(res.data);
      } catch (err) {
        setError('Failed to load garage.');
      }
    };
    fetchGarage();
  }, []);

  return (
    <div className="min-h-screen bg-viq-bg p-8">
      <h1 className="text-3xl font-bold text-viq-text mb-8">My Garage</h1>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {savedVehicles.map(sv => (
          <div key={sv.id} className="bg-viq-surface p-6 rounded-xl border border-viq-divider shadow-md">
            <h3 className="text-lg font-bold text-viq-text">Variant ID: {sv.vehicle_variant_id}</h3>
            <p className="text-sm text-viq-text-muted mt-2">Saved on: {new Date(sv.saved_at).toLocaleDateString()}</p>
          </div>
        ))}
        {savedVehicles.length === 0 && !error && (
          <p className="text-viq-text-muted">Your garage is empty. Save some vehicles!</p>
        )}
      </div>
    </div>
  );
};

export default GaragePage;
