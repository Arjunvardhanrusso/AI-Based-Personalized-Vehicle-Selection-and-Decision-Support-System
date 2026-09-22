import React, { useState, useEffect, useCallback } from 'react';
import { apiGetReviews, apiPostReview } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { Review } from '../types';

interface Props {
  variantId: string;
}

export const ReviewSection: React.FC<Props> = ({ variantId }) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState<number>(5);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchReviews = useCallback(async () => {
    try {
      const data = await apiGetReviews(variantId);
      setReviews(data);
    } catch {
      // Ignored if offline
    }
  }, [variantId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError('Please log in to submit a review.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await apiPostReview(variantId, rating, text.trim() || undefined);
      setText('');
      setRating(5);
      await fetchReviews();
    } catch (err: any) {
      setError(err.message || 'Failed to submit review.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-8 border-t border-viq-outline-variant/20 pt-8 text-viq-on-surface">
      <div className="flex items-center justify-between mb-6">
        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-viq-primary">VERIFIED REVIEWS</span>
          <h2 className="text-2xl font-bold font-jakarta">Community & Owner Feedback</h2>
        </div>
        <span className="text-xs font-mono px-3 py-1 bg-viq-surface-container-lowest rounded-full border border-viq-outline-variant/20">
          {reviews.length} Total Reviews
        </span>
      </div>
      
      <div className="space-y-4 mb-8">
        {reviews.map((r) => (
          <div key={r.id} className="bg-viq-surface-container-high p-5 rounded-2xl border border-viq-outline-variant/20 shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-viq-primary/20 text-viq-primary font-mono text-xs flex items-center justify-center font-bold">
                  {r.user_email[0].toUpperCase()}
                </div>
                <span className="font-mono text-xs text-viq-on-surface">{r.user_email}</span>
              </div>
              <span className="text-amber-400 font-mono text-sm">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
            </div>
            {r.review_text && <p className="text-sm text-viq-on-surface-variant mt-2 leading-relaxed">{r.review_text}</p>}
            <span className="text-[11px] font-mono text-viq-outline mt-3 block">{new Date(r.created_at).toLocaleDateString()}</span>
          </div>
        ))}
        {reviews.length === 0 && (
          <div className="p-8 text-center bg-viq-surface-container-low rounded-2xl border border-viq-outline-variant/10 text-viq-outline font-mono text-xs">
            No community owner reviews logged yet. Be the first verified evaluator!
          </div>
        )}
      </div>

      <div className="bg-viq-surface-container-high p-6 rounded-2xl border border-viq-outline-variant/30">
        <h3 className="text-lg font-bold font-jakarta mb-1">Submit Vehicle Rating</h3>
        <p className="text-viq-on-surface-variant text-xs mb-4">Share your driving experience, refinement appraisal, or dealership feedback.</p>
        
        {error && <div className="p-3 bg-red-500/20 text-red-400 text-xs rounded-lg mb-4 border border-red-500/30">{error}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-viq-outline mb-1">Overall Rating</label>
            <select 
              value={rating} 
              onChange={(e) => setRating(Number(e.target.value))}
              className="bg-viq-surface-container-lowest border border-viq-outline-variant/30 text-viq-on-surface rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:border-viq-primary"
            >
              <option value={5}>★★★★★ (5/5) Exceptional</option>
              <option value={4}>★★★★☆ (4/5) Very Good</option>
              <option value={3}>★★★☆☆ (3/5) Average</option>
              <option value={2}>★★☆☆☆ (2/2) Below Average</option>
              <option value={1}>★☆☆☆☆ (1/5) Poor</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-viq-outline mb-1">Review Commentary (Optional)</label>
            <textarea 
              value={text} 
              onChange={(e) => setText(e.target.value)}
              className="bg-viq-surface-container-lowest border border-viq-outline-variant/30 text-viq-on-surface rounded-lg px-3 py-2 text-sm w-full h-24 focus:outline-none focus:border-viq-primary"
              placeholder="E.g., Highway stability is impressive, real-world mileage averaged 16 km/l in city traffic..."
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="bg-viq-primary px-5 py-2.5 rounded-lg hover:bg-viq-primary-hover text-viq-on-primary font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer"
          >
            {submitting ? 'Submitting...' : 'Post Verified Review'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ReviewSection;
