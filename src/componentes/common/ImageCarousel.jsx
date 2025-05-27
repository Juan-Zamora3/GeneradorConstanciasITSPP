import React, { useState, useEffect } from 'react';

export default function ImageCarousel({
  images = [],
  auto = true,
  interval = 3000,
}) {
  const [idx, setIdx] = useState(0);

  /* autoplay */
  useEffect(() => {
    if (!auto || images.length <= 1) return;
    const id = setInterval(
      () => setIdx(i => (i + 1) % images.length),
      interval
    );
    return () => clearInterval(id);
  }, [images, auto, interval]);

  if (images.length === 0) return null;

  const prev = () => setIdx(i => (i - 1 + images.length) % images.length);
  const next = () => setIdx(i => (i + 1) % images.length);

  return (
    <div className="relative w-full h-64">
      {/* imagen actual */}
      <img
        src={images[idx]}
        alt={`img-${idx}`}
        className="w-full h-full object-cover rounded-lg shadow"
      />

      {/* flechas; ahora NO disparan submit */}
      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 text-white px-2 rounded-full"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 text-white px-2 rounded-full"
          >
            ›
          </button>
        </>
      )}
    </div>
  );
}
