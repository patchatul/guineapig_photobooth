"use client";
import { useState, useCallback, useEffect } from "react";
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
  { x: 340, y: 370, w: 1500, h: 895 }, // Box 1 – top
  { x: 340, y: 1450, w: 1500, h: 880 }, // Box 2 – middle
  { x: 340, y: 2525, w: 1500, h: 880 }, // Box 3 – bottom
];
export default function Main() {
  const router = useRouter();

  const [photos, setPhotos] = useState<(string | undefined)[]>([
    undefined,
    undefined,
    undefined,
  ]);

  useEffect(() => {
    router.prefetch("/decorate");
  }, [router]);

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
    <div className="min-h-screen w-full flex flex-col items-center px-4 py-6">
      <div className="mb-4 text-center">
        <h1 className="sm:text-5xl text-3xl font-bold text-pink-500">
          Guinea Pig Photobooth
        </h1>
      </div>

      <div className="flex-1 w-full max-w-120 flex items-center justify-center">
        <div
          style={{
            position: "relative",
            width: "100%",
            maxWidth: "100%",
            aspectRatio: `${TEMPLATE_W} / ${TEMPLATE_H}`,
            minHeight: 0,
          }}
        >
      

        {TEMPLATE_BOXES.map((box, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left:   `${(box.x / TEMPLATE_W) * 100}%`,
              top:    `${(box.y / TEMPLATE_H) * 100}%`,
              width:  `${(box.w / TEMPLATE_W) * 100}%`,
              height: `${(box.h / TEMPLATE_H) * 100}%`,
              overflow:     "hidden",
              /* z-index 0: sits below the template overlay (z-index 1) */
              zIndex: 0,
            }}
          >
            <PhotoSlot index={i} image={photos[i]} onCapture={handleCapture} />
          </div>
        ))}
        <img
          src={TEMPLATE_SRC}
          alt=""
          draggable={false}
          style={{
            position:      "absolute",
            inset:         0,
            width:         "100%",
            height:        "100%",
            display:       "block",
            /* Sit on top of photos so the frame/decorations overlay them */
            zIndex:        1,
            /* Allow mouse/touch events to fall through to photo slots below */
            pointerEvents: "none",
          }}
        />
        
        </div>
      </div>
      <div className="mt-4 w-full max-w-120 relative z-10 flex justify-center">
        <button
          onClick={decorate}
          className="btn-pastel float-anim text-lg px-8 py-3 text-pink-500"
          style={{
            background: "linear-gradient(135deg, #ffc8dd, #fef9c3, #b5ead7, #bde0fe)",
            fontWeight: "bold",
          }}
        >
          Next →
        </button>
      </div>
    </div>
  );
}
