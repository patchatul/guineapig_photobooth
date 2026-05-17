'use client';
import { useState, useCallback } from "react";
import PhotoSlot from "./page/camera";

export default function Main() {
  const [photos, setPhotos] = useState<(string | undefined)[]>([undefined, undefined, undefined, undefined]);
  const handleCapture = useCallback((index: number, dataUrl: string) => {
    setPhotos(prev => {
      const newPhotos = [...prev];
      newPhotos[index] = dataUrl;
      return newPhotos;
    });
  }, []);
  const filledCount = photos.filter(Boolean).length;

  return (
    <div className="flex flex-col flex-1 items-center justify-center">
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-between py-32 px-16">
        <h1 className="text-4xl md:text-6xl shimmer-text mb-1 text-center drop-shadow">
          Guinea Pig Photobooth
        </h1>
        <div
          className="flex flex-col items-center gap-4"
          style={{ maxWidth: "400px" }}
        >
          {[0, 1, 2, 3].map((i) => (
            <PhotoSlot
              key={i}
              index={i}
              image={photos[i]}
              onCapture={handleCapture}
            />
          ))}
        </div>
        {filledCount > 0 && (
        <button
          className="btn-pastel float-anim mt-8 font-bonbon text-xl px-10 py-4"
          style={{
            background: 'linear-gradient(135deg, #ffc8dd, #fef9c3, #b5ead7, #bde0fe)',
            color: '#c4497a',
          }}
        >
          Next
        </button>
      )}
      </main>
    </div>
  );
}
