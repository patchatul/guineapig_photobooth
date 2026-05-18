"use client";
import { useState, useCallback } from "react";
import PhotoSlot from "./page/camera";

export default function Main() {
  const [photos, setPhotos] = useState<(string | undefined)[]>([
    undefined,
    undefined,
    undefined,
    undefined,
  ]);
  const handleCapture = useCallback((index: number, dataUrl: string) => {
    setPhotos((prev) => {
      const newPhotos = [...prev];
      newPhotos[index] = dataUrl;
      return newPhotos;
    });
  }, []);
  const filledCount = photos.filter(Boolean).length;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-10">
        <div>
          <h1 className="text-5xl font-bold" style={{ color: "#c4497a" }}>
            GuineaPig Photobooth
          </h1>
        </div>
        <div
          className="grid grid-cols-2 gap-3 w-full"
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
        <button
          className="btn-pastel float-anim text-xl px-10 py-4"
          style={{
            background:
              "linear-gradient(135deg, #ffc8dd, #fef9c3, #b5ead7, #bde0fe)",
            color: "#c4497a",
            fontWeight: "bold",
          }}
        >
          Next
        </button>
      </div>
  );
}
