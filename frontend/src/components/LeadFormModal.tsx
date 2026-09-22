import React, { useState } from 'react';
import { api } from '../services/api';

interface Props {
  variantId: string;
  isOpen: boolean;
  onClose: () => void;
}

const LeadFormModal: React.FC<Props> = ({ variantId, isOpen, onClose }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    try {
      await api.post('/api/leads', {
        vehicle_variant_id: variantId,
        name,
        phone,
        message
      });
      setStatus('success');
      setTimeout(() => {
        onClose();
        setStatus('idle');
      }, 2000);
    } catch (err) {
      setStatus('error');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-viq-surface border border-viq-divider rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-viq-text-muted hover:text-white"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="text-2xl font-bold text-viq-text mb-2">Contact Dealer</h2>
        <p className="text-viq-text-muted mb-6">Get the best offers for this vehicle.</p>

        {status === 'success' ? (
          <div className="bg-green-500/20 text-green-400 p-4 rounded-lg text-center">
            Successfully submitted! A dealer will contact you soon.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-viq-text-muted mb-1">Name</label>
              <input 
                required
                type="text"
                value={name} 
                onChange={e => setName(e.target.value)}
                className="bg-viq-bg border border-viq-divider text-viq-text rounded-md px-3 py-2 w-full"
              />
            </div>
            <div>
              <label className="block text-sm text-viq-text-muted mb-1">Phone</label>
              <input 
                required
                type="tel"
                value={phone} 
                onChange={e => setPhone(e.target.value)}
                className="bg-viq-bg border border-viq-divider text-viq-text rounded-md px-3 py-2 w-full"
              />
            </div>
            <div>
              <label className="block text-sm text-viq-text-muted mb-1">Message (Optional)</label>
              <textarea 
                value={message} 
                onChange={e => setMessage(e.target.value)}
                className="bg-viq-bg border border-viq-divider text-viq-text rounded-md px-3 py-2 w-full h-24"
              />
            </div>
            {status === 'error' && <p className="text-red-500 text-sm">Failed to submit lead. Please try again.</p>}
            <button 
              type="submit" 
              disabled={status === 'submitting'}
              className="w-full bg-viq-primary px-4 py-2 rounded-md hover:bg-viq-primary-hover text-white font-medium disabled:opacity-50"
            >
              {status === 'submitting' ? 'Submitting...' : 'Request Callback'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default LeadFormModal;
