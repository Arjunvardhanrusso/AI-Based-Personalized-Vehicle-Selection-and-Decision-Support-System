import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiGetAdminStats, apiGetLeads, apiTriggerScraper } from '../services/api';
import type { AdminStats, Lead } from '../types';

interface AdminDashboardProps {
  onNavigateAuth?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigateAuth }) => {
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [error, setError] = useState<string>('');
  const [msg, setMsg] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [triggering, setTriggering] = useState<boolean>(false);

  const fetchAdminData = useCallback(async () => {
    if (!user || !user.is_admin) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const [statsData, leadsData] = await Promise.all([
        apiGetAdminStats(),
        apiGetLeads()
      ]);
      setStats(statsData);
      setLeads(leadsData);
    } catch (err: any) {
      setError(err.message || 'Admin access authorization failed.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  const handleTriggerScraper = async () => {
    setTriggering(true);
    setMsg('');
    try {
      const res = await apiTriggerScraper();
      setMsg(res.message || 'Scraper background ingestion pipeline triggered.');
      setTimeout(() => setMsg(''), 5000);
    } catch {
      setError('Failed to trigger scraper process.');
    } finally {
      setTriggering(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="py-20 text-center text-viq-on-surface">
        <div className="inline-block w-8 h-8 border-4 border-viq-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="font-mono text-xs uppercase tracking-widest text-viq-outline">Verifying Admin Privileges...</p>
      </div>
    );
  }

  if (!user || !user.is_admin) {
    return (
      <div className="py-20 px-4 max-w-md mx-auto text-center text-viq-on-surface">
        <div className="bg-viq-surface-container-high border border-red-500/30 rounded-2xl p-8 shadow-2xl">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/30">
            <span className="material-symbols-outlined text-red-400 text-3xl">lock</span>
          </div>
          <h2 className="text-2xl font-bold font-jakarta mb-2">Restricted Access</h2>
          <p className="text-viq-on-surface-variant text-sm mb-6">
            Administrator credentials are required to view system telemetry, lead queues, and trigger scraper tasks.
          </p>
          <button
            onClick={onNavigateAuth}
            className="w-full bg-viq-primary hover:bg-viq-primary-hover text-viq-on-primary font-bold text-sm py-2.5 rounded-lg transition-colors cursor-pointer"
          >
            Sign In with Admin Account
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
            ADMINISTRATIVE CONSOLE • SECURE ACCESS
          </span>
          <h1 className="text-3xl font-bold font-jakarta mt-1">Platform Operations</h1>
          <p className="text-viq-on-surface-variant text-sm mt-1">
            System overview, customer interest queue, and knowledge base ingestion pipelines.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleTriggerScraper}
            disabled={triggering}
            className="flex items-center gap-2 bg-viq-primary hover:bg-viq-primary-hover text-viq-on-primary px-4 py-2.5 rounded-lg font-bold text-sm transition-colors cursor-pointer disabled:opacity-50 shadow-lg shadow-viq-primary/20"
          >
            <span className="material-symbols-outlined text-[18px]">sync</span>
            {triggering ? 'Ingesting Data...' : 'Run Web Ingestion Scraper'}
          </button>
        </div>
      </div>

      {msg && (
        <div className="mb-6 p-4 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-sm rounded-lg flex items-center gap-2">
          <span className="material-symbols-outlined text-lg">check_circle</span>
          {msg}
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 text-red-400 text-sm rounded-lg">
          {error}
        </div>
      )}

      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-viq-surface-container-high p-5 rounded-2xl border border-viq-outline-variant/30">
            <span className="text-xs font-mono text-viq-outline uppercase tracking-wider">Registered Users</span>
            <div className="text-3xl font-extrabold font-mono text-viq-on-surface mt-1">{stats.users_count}</div>
          </div>
          <div className="bg-viq-surface-container-high p-5 rounded-2xl border border-viq-outline-variant/30">
            <span className="text-xs font-mono text-viq-outline uppercase tracking-wider">Dealer Inquiries</span>
            <div className="text-3xl font-extrabold font-mono text-viq-primary mt-1">{stats.leads_count}</div>
          </div>
          <div className="bg-viq-surface-container-high p-5 rounded-2xl border border-viq-outline-variant/30">
            <span className="text-xs font-mono text-viq-outline uppercase tracking-wider">User Reviews</span>
            <div className="text-3xl font-extrabold font-mono text-emerald-400 mt-1">{stats.reviews_count}</div>
          </div>
          <div className="bg-viq-surface-container-high p-5 rounded-2xl border border-viq-outline-variant/30">
            <span className="text-xs font-mono text-viq-outline uppercase tracking-wider">Garage Bookmarks</span>
            <div className="text-3xl font-extrabold font-mono text-cyan-400 mt-1">{stats.garage_saves_count}</div>
          </div>
        </div>
      )}

      <div className="bg-viq-surface-container-high border border-viq-outline-variant/30 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-6 border-b border-viq-outline-variant/20 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold font-jakarta">Dealer Callback Inquiries</h2>
            <p className="text-viq-on-surface-variant text-xs mt-0.5">Real-time purchase inquiries and price quotes requested by buyers.</p>
          </div>
          <span className="text-xs font-mono px-3 py-1 bg-viq-surface-container-lowest rounded-full border border-viq-outline-variant/20">
            {leads.length} Total Records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm font-sans">
            <thead className="bg-viq-surface-container-lowest text-viq-outline text-xs uppercase font-mono tracking-wider border-b border-viq-outline-variant/20">
              <tr>
                <th className="px-6 py-3.5">Submission Date</th>
                <th className="px-6 py-3.5">Customer Name</th>
                <th className="px-6 py-3.5">Phone Number</th>
                <th className="px-6 py-3.5">Variant Spec</th>
                <th className="px-6 py-3.5">Customer Notes</th>
                <th className="px-6 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-viq-outline-variant/10 text-viq-on-surface">
              {leads.map((l) => (
                <tr key={l.id} className="hover:bg-viq-surface-container-lowest/50 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs text-viq-outline">
                    {new Date(l.created_at).toLocaleDateString()} {new Date(l.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-6 py-4 font-bold">{l.name}</td>
                  <td className="px-6 py-4 font-mono text-viq-primary">{l.phone}</td>
                  <td className="px-6 py-4 font-mono text-xs text-viq-on-surface-variant">{l.vehicle_variant_id}</td>
                  <td className="px-6 py-4 text-xs max-w-xs truncate">{l.message || 'No additional notes'}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-medium ${l.is_contacted ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                      {l.is_contacted ? 'Contacted' : 'Pending Callback'}
                    </span>
                  </td>
                </tr>
              ))}
              {leads.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-viq-outline font-mono text-xs">
                    No customer lead inquiries recorded in the system.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
