import React, { useEffect, useState } from 'react';
import { api } from '../services/api';

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [leads, setLeads] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const fetchAdminData = async () => {
    try {
      const token = localStorage.getItem('token');
      const statsRes = await api.get('/api/admin/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(statsRes.data);
      
      const leadsRes = await api.get('/api/leads', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLeads(leadsRes.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Admin access required.');
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const triggerScraper = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await api.post('/api/admin/trigger-scraper', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMsg(res.data.message);
    } catch (err: any) {
      setError('Failed to trigger scraper.');
    }
  };

  if (error) {
    return <div className="p-8 text-red-500 bg-viq-bg min-h-screen">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-viq-bg p-8 text-viq-text">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
      
      {stats && (
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-viq-surface p-4 rounded-xl border border-viq-divider text-center">
            <h3 className="text-sm text-viq-text-muted">Total Users</h3>
            <p className="text-2xl font-bold">{stats.users_count}</p>
          </div>
          <div className="bg-viq-surface p-4 rounded-xl border border-viq-divider text-center">
            <h3 className="text-sm text-viq-text-muted">Leads</h3>
            <p className="text-2xl font-bold">{stats.leads_count}</p>
          </div>
          <div className="bg-viq-surface p-4 rounded-xl border border-viq-divider text-center">
            <h3 className="text-sm text-viq-text-muted">Reviews</h3>
            <p className="text-2xl font-bold">{stats.reviews_count}</p>
          </div>
          <div className="bg-viq-surface p-4 rounded-xl border border-viq-divider text-center">
            <h3 className="text-sm text-viq-text-muted">Garage Saves</h3>
            <p className="text-2xl font-bold">{stats.garage_saves_count}</p>
          </div>
        </div>
      )}

      <div className="mb-8">
        <button onClick={triggerScraper} className="bg-viq-primary px-4 py-2 rounded-md hover:bg-viq-primary-hover text-white font-medium">
          Trigger Scraper Job
        </button>
        {msg && <span className="ml-4 text-green-400">{msg}</span>}
      </div>

      <h2 className="text-2xl font-bold mb-4">Recent Leads</h2>
      <div className="bg-viq-surface rounded-xl border border-viq-divider overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-viq-surface-container text-viq-text-muted">
            <tr>
              <th className="px-4 py-3 border-b border-viq-divider">Date</th>
              <th className="px-4 py-3 border-b border-viq-divider">Name</th>
              <th className="px-4 py-3 border-b border-viq-divider">Phone</th>
              <th className="px-4 py-3 border-b border-viq-divider">Variant ID</th>
              <th className="px-4 py-3 border-b border-viq-divider">Message</th>
            </tr>
          </thead>
          <tbody>
            {leads.map(l => (
              <tr key={l.id} className="border-b border-viq-divider hover:bg-viq-bg">
                <td className="px-4 py-3">{new Date(l.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-3">{l.name}</td>
                <td className="px-4 py-3">{l.phone}</td>
                <td className="px-4 py-3">{l.vehicle_variant_id}</td>
                <td className="px-4 py-3">{l.message || '-'}</td>
              </tr>
            ))}
            {leads.length === 0 && <tr><td colSpan={5} className="px-4 py-3 text-center text-viq-text-muted">No leads yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminDashboard;
