import React, { useState } from 'react';
import { apiCreateLead } from '../services/api';

interface Props {
  variantId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const LeadFormModal: React.FC<Props> = ({ variantId, isOpen, onClose }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    try {
      await apiCreateLead({
        vehicle_variant_id: variantId,
        name,
        phone,
        message: message.trim() || undefined
      });
      setStatus('success');
      setTimeout(() => {
        onClose();
        setStatus('idle');
        setName('');
        setPhone('');
        setMessage('');
      }, 2000);
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-viq-surface-container-high border border-viq-outline-variant/30 rounded-2xl p-6 w-full max-w-md shadow-2xl relative text-viq-on-surface">
        <button 
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 text-viq-on-surface-variant hover:text-viq-on-surface cursor-pointer"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="text-2xl font-bold font-jakarta mb-2">Connect with Dealership</h2>
        <p className="text-viq-on-surface-variant text-sm mb-6">
          Request official verified on-road quote, test drive scheduling, and dealer allocation.
        </p>

        {status === 'success' ? (
          <div className="bg-emerald-500/20 text-emerald-400 p-4 rounded-lg text-center border border-emerald-500/30">
            ✓ Callback requested! An authorized dealership coordinator will reach out shortly.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-viq-outline mb-1">Full Name</label>
              <input 
                required
                type="text"
                placeholder="Enter your full name"
                value={name} 
                onChange={e => setName(e.target.value)}
                className="bg-viq-surface-container-lowest border border-viq-outline-variant/30 text-viq-on-surface rounded-lg px-3 py-2 w-full focus:outline-none focus:border-viq-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-viq-outline mb-1">Contact Phone</label>
              <input 
                required
                type="tel"
                placeholder="+91 98765 43210"
                value={phone} 
                onChange={e => setPhone(e.target.value)}
                className="bg-viq-surface-container-lowest border border-viq-outline-variant/30 text-viq-on-surface rounded-lg px-3 py-2 w-full focus:outline-none focus:border-viq-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-viq-outline mb-1">Inquiry / Requirements (Optional)</label>
              <textarea 
                placeholder="E.g., Preferred delivery date, trade-in exchange inquiry, test drive slot..."
                value={message} 
                onChange={e => setMessage(e.target.value)}
                className="bg-viq-surface-container-lowest border border-viq-outline-variant/30 text-viq-on-surface rounded-lg px-3 py-2 w-full h-24 focus:outline-none focus:border-viq-primary"
              />
            </div>
            {status === 'error' && <p className="text-red-400 text-xs">Failed to transmit request. Please verify your phone number.</p>}
            <button 
              type="submit" 
              disabled={status === 'submitting'}
              className="w-full bg-viq-primary px-4 py-2.5 rounded-lg hover:bg-viq-primary-hover text-viq-on-primary font-bold text-sm tracking-wide transition-colors disabled:opacity-50 cursor-pointer"
            >
              {status === 'submitting' ? 'Submitting Request...' : 'Submit Callback Request'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default LeadFormModal;
