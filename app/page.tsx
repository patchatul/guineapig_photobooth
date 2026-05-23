"use client";
import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import PhotoSlot from "./camera/photoslot";
import { dataUrlToBlob, savePhotoBlobs } from "./lib/photosDb";
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

async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function compressPhotoDataUrl(rawDataUrl: string) {
  const img = await loadImage(rawDataUrl);
  const maxDimension = 1400;
  const width = img.naturalWidth;
  const height = img.naturalHeight;
  const scale = Math.min(1, maxDimension / Math.max(width, height));
  if (scale >= 1) {
    return rawDataUrl;
  }
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) return rawDataUrl;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.75);
}
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

  const handleCapture = useCallback(async (index: number, dataUrl: string) => {
    const compressed = await compressPhotoDataUrl(dataUrl);
    setPhotos((prev) => {
      const newPhotos = [...prev];
      newPhotos[index] = compressed;
      return newPhotos;
    });
  }, []);

  const decorate = async () => {
    try {
      const blobs = await Promise.all(
        photos.map(async (photo) => (photo ? dataUrlToBlob(photo) : null)),
      );
      await savePhotoBlobs(blobs);
      await router.push("/decorate");
    } catch (err) {
      console.error("Error during navigation:", err);
      alert(
        "Storage Error: Photo data is ${sizeInMB.toFixed(2)}MB. Try capturing at lower resolution",
      );
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center px-4 py-6">
      <div className="mb-4 text-center">
        <h1 className="sm:text-5xl text-3xl font-bold text-pink-500">
          Guinea Pig Photobooth
        </h1>
        
        <p className="text-sm text-gray-500">open in Google Chrome or Laptop for best experience</p>
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
                left: `${(box.x / TEMPLATE_W) * 100}%`,
                top: `${(box.y / TEMPLATE_H) * 100}%`,
                width: `${(box.w / TEMPLATE_W) * 100}%`,
                height: `${(box.h / TEMPLATE_H) * 100}%`,
                overflow: "hidden",
                /* z-index 0: sits below the template overlay (z-index 1) */
                zIndex: 0,
              }}
            >
              <PhotoSlot
                index={i}
                image={photos[i]}
                onCapture={handleCapture}
              />
            </div>
          ))}
          <img
            src={TEMPLATE_SRC}
            alt=""
            draggable={false}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              display: "block",
              /* Sit on top of photos so the frame/decorations overlay them */
              zIndex: 1,
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
            background:
              "linear-gradient(135deg, #ffc8dd, #fef9c3, #b5ead7, #bde0fe)",
            fontWeight: "bold",
          }}
        >
          Next →
        </button>
      </div>
    </div>
  );
}
