"use client";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import PhotoSlot from "./camera/photoslot";

export default function Main() {
  const router = useRouter();
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
   const  decorate = () => {
    // Store photos in sessionStorage so the /decorate route can read them
    sessionStorage.setItem('wb_photos', JSON.stringify(photos))
    router.push('/decorate')
  }


  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-10">
        <div>
          <h1 className="sm:text-5xl text-3xl font-bold text-pink-500">
            Guinea Pig Photobooth
          </h1>
        </div>
        <div
          className="grid grid-cols-1"
          style={{ width: "160px" }}
        >
          {[0, 1, 2].map((i) => (
            <PhotoSlot
              key={i}
              index={i}
              image={photos[i]}
              onCapture={handleCapture}
            />
          ))}
        </div>
        <button
        onClick={decorate}
          className="btn-pastel float-anim text-xl px-10 py-4 text-pink-500"
          style={{
            background:
              "linear-gradient(135deg, #ffc8dd, #fef9c3, #b5ead7, #bde0fe)",
            fontWeight: "bold",
          }}
        >
          Next
        </button>
      </div>
  );
}
