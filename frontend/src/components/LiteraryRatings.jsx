import React, { useState } from 'react';
import { addRating } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function LiteraryRatings({ workId, ratings = [], averageRating = 0, isDark, onRatingAdded }) {
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const userRatingData = ratings.find(r => r.userId === user?.uid);

  const handleSubmitRating = async (score) => {
    if (loading) return;
    setLoading(true);
    try {
      const response = await addRating(workId, score);
      if (response.ok) {
        setUserRating(score);
        if (onRatingAdded) onRatingAdded(response.averageRating);
      }
    } catch (err) {
      console.error('Error al calificar:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-gray-50 border border-gray-200'}`}>
      <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
        📊 Calificaciones
      </h3>

      {/* Resumen de calificación */}
      <div className="mb-6">
        <div className="flex items-center gap-4">
          <div>
            <div className={`text-3xl font-bold ${isDark ? 'text-yellow-400' : 'text-yellow-500'}`}>
              {averageRating.toFixed(1)}
            </div>
            <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {ratings.length} calificaciones
            </div>
          </div>

          {/* Barra de calificación */}
          <div className="flex-1">
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = ratings.filter(r => r.score === stars).length;
              const percent = ratings.length > 0 ? (count / ratings.length) * 100 : 0;
              return (
                <div key={stars} className="flex items-center gap-2 mb-1">
                  <span className={`text-xs w-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {stars}⭐
                  </span>
                  <div className={`flex-1 h-2 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`}>
                    <div
                      className="h-full rounded-full bg-yellow-500 transition-all"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <span className={`text-xs w-8 text-right ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tu calificación */}
      <div>
        <p className={`text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
          Tu calificación:
        </p>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => handleSubmitRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              disabled={loading}
              className={`text-3xl transition-transform hover:scale-110 disabled:opacity-50 ${
                star <= (hoverRating || userRating || userRatingData?.score || 0)
                  ? 'opacity-100'
                  : 'opacity-40'
              }`}
            >
              ⭐
            </button>
          ))}
        </div>
        {userRatingData && (
          <p className={`text-xs mt-2 ${isDark ? 'text-green-400' : 'text-green-600'}`}>
            ✓ Tu calificación: {userRatingData.score} de 5
          </p>
        )}
      </div>
    </div>
  );
}
