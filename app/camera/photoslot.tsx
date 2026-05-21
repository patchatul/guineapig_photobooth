"use client";

import { useCallback, useRef, useState, useEffect } from "react";

function triggerFlash() {
  const el = document.getElementById("flashOverlay");
  if (!el) return;
  el.classList.add("active");
  setTimeout(() => el.classList.remove("active"), 400);
}
interface PhotoSlotProps {
  index: number;
  image?: string;
  onCapture: (index: number, dataUrl: string) => void;
}
// PhotoSlot component handles individual photo capture and display
export default function PhotoSlot({ index, image, onCapture }: PhotoSlotProps) {
  //mode
  const [mode, setMode] = useState<"idle" | "capturing" | "processing">("idle");
  //use camera
  const [countdown, setCountdown] = useState<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  //open camera and start video stream
  const openCamera = useCallback(async () => {
    setMode("capturing");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      }, 50);
    } catch (err) {
      alert("Failed to access camera: " + err);
      setMode("idle");
    }
  }, []);
  //close camera and stop stream
  const closeCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setMode("idle");
  }, []);
  //capture photo from video stream to canvas, convert to data URL and pass to parent
  const capturePhoto = useCallback( () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    triggerFlash();
    const dataUrl = canvas.toDataURL("image/png");
    onCapture(index, dataUrl);
    setMode("processing");
    //close camera after capture
    closeCamera();
  }, [index, onCapture, closeCamera]);

  //3-second countdown then capture
  const startCountdown = useCallback(() => {
    let c = 3;
    setCountdown(c);
    const iv = setInterval(() => {
      c--;
      if (c <= 0) {
        clearInterval(iv);
        setCountdown(null);
        capturePhoto();
      } else setCountdown(c);
    }, 1000);
  }, [capturePhoto]);

  useEffect(() => {
    return () => {
      closeCamera();
    };
  }, [closeCamera]);

  //handle file upload from input
  const handleUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => onCapture(index, ev.target?.result as string);
      reader.readAsDataURL(file);
      // Reset input so same file can be re-selected
      e.target.value = "";
    },[index, onCapture],
  );
  const cameraOption = [{
  label: "📸",
  action: capturePhoto,
  disabled: (countdown: number | null) => countdown !== null,
  style: "hover:cursor-pointer text-sm w-8 h-8 rounded-full flex items-center justify-center bg-white",
},
{
  label: "⏱",
  action:startCountdown,
  disabled: (countdown: number | null) => countdown !== null,
  style: "hover:cursor-pointer text-md w-8 h-8  rounded-full flex items-center justify-center bg-white",
},
{
  label: "✕",
  action: closeCamera,
  disabled: () => false,
  style: "hover:cursor-pointer text-sm w-8 h-8  rounded-full flex items-center justify-center bg-white text-gray-500",
}]
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* ── CAPTURED: show the photo ── */}
      {image && (
          <img
            src={image}
            alt={`Photo ${index + 1}`}
            draggable={false}
            className="absolute inset-0 z-0 block object-cover object-center w-full h-full"
          />
      )}

      {/* ── CAMERA MODE: live preview ── */}
      {!image && mode === "capturing" && (
        <div className="absolute z-10 inset-0 w-full h-full bg-black flex items-center justify-center">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="video-mirror w-full h-full object-cover"
          />

          {/* Countdown overlay */}
          {countdown !== null && (
            <div className="countdown-overlay">
              <span className="countdown-number">{countdown}</span>
            </div>
          )}

          {/* Camera controls */}
          <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-6 z-11">
            {cameraOption.map(({label, action, disabled, style}, i) => (
              <button
                key={i}
                onClick={action}
                disabled={disabled(countdown)}
                className={style}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── IDLE: action buttons ── */}
      {!image && mode === "idle" && (
        <div className="w-full h-full flex flex-col items-center justify-center gap-2">
          {/* Slot number badge */}
          <div className="text-2xl font-bold text-pink-500">
            {index + 1}
          </div>

          <button
            onClick={openCamera} 
            className="cursor-pointer text-sm w-24 h-6 bg-blue-200 rounded-full flex items-center justify-center"
          >
            📷Camera
          </button>

          <label className="cursor-pointer text-sm w-24 h-6 bg-pink-200 rounded-full flex items-center justify-center">
            🖼️Upload
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleUpload}
            />
          </label>
        </div>
      )}
  {image && (
        <button
          onClick={() => { 
            onCapture(index, ""); 
            setMode("idle"); }}
          className="absolute inset-0 z-10 flex items-center justify-center cursor-pointer opacity-0 hover:opacity-100 hover:bg-white/50 transition-opacity-300"
        >
          <span className="text-white bg-black bg-opacity-50 px-3 py-1 rounded-full text-sm">
            🔄 Retake
          </span>
        </button>
      )}
      {/* Hidden canvas for frame capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
