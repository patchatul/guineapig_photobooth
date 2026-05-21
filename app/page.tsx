"use client";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import PhotoSlot from "./camera/photoslot";
// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE CONFIG  (must match decorate/page.tsx)
// All box coords in native image pixels (2160 × 3840)
// ─────────────────────────────────────────────────────────────────────────────
const TEMPLATE_SRC = "/phototemplate.png";
const TEMPLATE_W = 2160;
const TEMPLATE_H = 3840;

const TEMPLATE_BOXES = [
  { x: 364, y: 381, w: 1434, h: 875 }, // Box 1 – top
  { x: 363, y: 1452, w: 1433, h: 871 }, // Box 2 – middle
  { x: 365, y: 2528, w: 1433, h: 869 }, // Box 3 – bottom
];
export default function Main() {
  const router = useRouter();

  const [photos, setPhotos] = useState<(string | undefined)[]>([
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
  const decorate = () => {
    // Store photos in sessionStorage so the /decorate route can read them
    sessionStorage.setItem("wb_photos", JSON.stringify(photos));
    router.push("/decorate");
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center gap-10 px-4 py-12">
     <div>
          <h1 className="sm:text-5xl text-3xl font-bold text-pink-500">
            Guinea Pig Photobooth
          </h1>
        </div>

      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "480px", // fits comfortably on mobile and desktop
          aspectRatio: `${TEMPLATE_W} / ${TEMPLATE_H}`,
        }}
      >
        <img
          src={TEMPLATE_SRC}
          alt=""
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            display: "block",
          }}
          draggable={false}
        />

        {TEMPLATE_BOXES.map((box, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${(box.x / TEMPLATE_W) * 100}%`,
              top: `${(box.y / TEMPLATE_H) * 100}%`,
              width: `${(box.w / TEMPLATE_W) * 100}%`,
              height: `${(box.h / TEMPLATE_H) * 100}%`,
              overflow: "hidden",
              borderRadius: "4px",
            }}
          >
            <PhotoSlot index={i} image={photos[i]} onCapture={handleCapture} />
          </div>
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
