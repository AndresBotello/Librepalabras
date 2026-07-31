import React, { useState } from 'react';

export default function LiteraryGallery({ works = [], isDark }) {
  const [selectedWork, setSelectedWork] = useState(null);

  if (works.length === 0) {
    return (
      <div className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
        <p>No hay obras para mostrar</p>
      </div>
    );
  }

  return (
    <>
      {/* Grid de portadas */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {works.map((work) => (
          <div
            key={work.id}
            onClick={() => setSelectedWork(work)}
            className="cursor-pointer group"
          >
            <div
              className={`relative aspect-[3/4] rounded-lg overflow-hidden shadow-lg transition-transform hover:scale-105 border ${isDark ? 'border-gray-700' : 'border-gray-300'}`}
            >
              {work.cover ? (
                <img
                  src={work.cover}
                  alt={work.title}
                  className="w-full h-full object-cover"
                  onError={(e) => (e.target.style.display = 'none')}
                />
              ) : (
                <div
                  className={`w-full h-full flex items-center justify-center text-4xl ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`}
                >
                  📘
                </div>
              )}

              {/* Overlay con info */}
              <div
                className={`absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-70 transition-all flex flex-col justify-end p-3 opacity-0 group-hover:opacity-100`}
              >
                <h3 className="text-white font-bold text-sm line-clamp-2 mb-1">
                  {work.title}
                </h3>
                <p className="text-gray-200 text-xs mb-2">{work.author}</p>
                {work.averageRating > 0 && (
                  <div className="text-yellow-400 text-sm">
                    ⭐ {work.averageRating.toFixed(1)}
                  </div>
                )}
              </div>

              {/* Badge de tipo */}
              {work.type === 'pdfSale' && (
                <div className="absolute top-2 right-2 bg-green-600 text-white text-xs px-2 py-1 rounded-full font-semibold">
                  💰 ${work.price}
                </div>
              )}
              {work.type === 'free' && (
                <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full font-semibold">
                  Gratis
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal de vista previa */}
      {selectedWork && (
        <div
          className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedWork(null)}
        >
          <div
            className={`rounded-lg p-6 max-w-2xl w-full max-h-96 overflow-auto ${isDark ? 'bg-gray-900' : 'bg-white'}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex gap-6">
              {/* Portada grande */}
              <div className="flex-shrink-0">
                {selectedWork.cover ? (
                  <img
                    src={selectedWork.cover}
                    alt={selectedWork.title}
                    className="w-48 rounded-lg shadow-lg object-cover aspect-[3/4]"
                  />
                ) : (
                  <div className={`w-48 aspect-[3/4] rounded-lg flex items-center justify-center text-6xl ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`}>
                    📘
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1">
                <h2 className={`text-2xl font-bold mb-2 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                  {selectedWork.title}
                </h2>
                <p className={`mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Por: <strong>{selectedWork.author}</strong>
                </p>

                {selectedWork.description && (
                  <p className={`mb-4 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {selectedWork.description}
                  </p>
                )}

                {/* Stats */}
                <div className="flex flex-wrap gap-4 mb-4 text-sm">
                  <div className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                    👁️ {selectedWork.views || 0} vistas
                  </div>
                  {selectedWork.averageRating > 0 && (
                    <div className={isDark ? 'text-yellow-400' : 'text-yellow-500'}>
                      ⭐ {selectedWork.averageRating.toFixed(1)} ({selectedWork.totalRatings || 0})
                    </div>
                  )}
                  {selectedWork.type === 'pdfSale' && (
                    <div className={isDark ? 'text-green-400' : 'text-green-600'}>
                      💰 ${selectedWork.price}
                    </div>
                  )}
                </div>

                {selectedWork.tags && selectedWork.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {selectedWork.tags.slice(0, 3).map((tag, idx) => (
                      <span
                        key={idx}
                        className={`text-xs px-2 py-1 rounded ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`}
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                <button
                  className={`w-full px-4 py-2 rounded-lg font-semibold text-white transition-colors ${
                    selectedWork.type === 'pdfSale'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {selectedWork.type === 'pdfSale' ? `💳 Comprar - $${selectedWork.price}` : '📥 Leer Ahora'}
                </button>
              </div>
            </div>

            <button
              onClick={() => setSelectedWork(null)}
              className={`mt-4 w-full px-4 py-2 rounded-lg font-semibold transition-colors ${isDark ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </>
  );
}
