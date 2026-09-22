import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

interface Review {
  id: number;
  user_email: string;
  rating: number;
  review_text: string;
  created_at: string;
}

interface Props {
  variantId: string;
}

const ReviewSection: React.FC<Props> = ({ variantId }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState<number>(5);
  const [text, setText] = useState('');
  const [error, setError] = useState('');

  const fetchReviews = async () => {
    try {
      const res = await api.get(`/api/reviews/${variantId}`);
      setReviews(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [variantId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please log in to submit a review.');
        return;
      }
      await api.post(`/api/reviews/${variantId}`, { rating, review_text: text }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setText('');
      setRating(5);
      setError('');
      fetchReviews();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to submit review.');
    }
  };

  return (
    <div className="mt-8 border-t border-viq-divider pt-8">
      <h2 className="text-2xl font-bold text-viq-text mb-6">User Reviews</h2>
      
      <div className="space-y-6 mb-8">
        {reviews.map(r => (
          <div key={r.id} className="bg-viq-surface p-4 rounded-xl border border-viq-divider">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium text-viq-text">{r.user_email}</span>
              <span className="text-yellow-400">{'★'.repeat(r.rating)}{'☆'.repeat(5-r.rating)}</span>
            </div>
            <p className="text-viq-text-muted">{r.review_text}</p>
            <span className="text-xs text-viq-text-muted mt-2 block">{new Date(r.created_at).toLocaleDateString()}</span>
          </div>
        ))}
        {reviews.length === 0 && <p className="text-viq-text-muted">No reviews yet. Be the first!</p>}
      </div>

      <div className="bg-viq-surface-container p-6 rounded-xl border border-viq-divider">
        <h3 className="text-lg font-bold text-viq-text mb-4">Leave a Review</h3>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-viq-text-muted mb-1">Rating</label>
            <select 
              value={rating} 
              onChange={e => setRating(Number(e.target.value))}
              className="bg-viq-bg border border-viq-divider text-viq-text rounded-md px-3 py-2 w-full"
            >
              {[5, 4, 3, 2, 1].map(n => (
                <option key={n} value={n}>{n} Stars</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-viq-text-muted mb-1">Review</label>
            <textarea 
              value={text} 
              onChange={e => setText(e.target.value)}
              className="bg-viq-bg border border-viq-divider text-viq-text rounded-md px-3 py-2 w-full h-24"
              placeholder="Write your thoughts..."
            />
          </div>
          <button type="submit" className="bg-viq-primary px-4 py-2 rounded-md hover:bg-viq-primary-hover text-white font-medium">
            Submit Review
          </button>
        </form>
      </div>
    </div>
  );
};

export default ReviewSection;
