'use client';

import Image from "next/image";

import { useCallback, useRef, useState, useEffect } from "react";

// PhotoSlot component handles individual photo capture and display
export default function PhotoSlot({index, image, onCapture}: Readonly<{
  index: number;
  image?: string;
  onCapture: (index: number, dataUrl: string) => void;
}>) {
  //frame picture
  const frameColor = ["#ffc8dd", "#b5ead7", "#bde0fe", "#fef9c3"][index % 4];
  const [model, setModel] = useState<"idle" | "capturing" | "processing">("idle");
  
  //use camera
  const [countdown, setCountdown] = useState<number | null>(null)
  const videoRef    = useRef<HTMLVideoElement>(null)
  const streamRef   = useRef<MediaStream | null>(null)
  const canvasRef   = useRef<HTMLCanvasElement>(null)
  //open camera and start video stream
  const openCamera = useCallback(async() => {
    setModel("capturing");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      }, 50)
    } catch (err) {
      alert("Failed to access camera: " + err);
      setModel("idle");
    }
  }, [])
  //close camera and stop stream
  const closeCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setModel("idle");
  }, [])
  //capture photo from video stream to canvas, convert to data URL and pass to parent
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth ||640;
    canvas.height = video.videoHeight ||480;
    const ctx = canvas.getContext("2d");
    //draw current video frame to canvas
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/png");
    onCapture(index, dataUrl);
    setModel("processing");
    //close camera after capture
    closeCamera();
  }, [index, onCapture, closeCamera])
   
//3-second countdown then capture 
  const startCountdown = useCallback(() => {
    let c = 3
    setCountdown(c)
    const iv = setInterval(() => {
      c--
      if (c <= 0) { clearInterval(iv); setCountdown(null); capturePhoto() }
      else setCountdown(c)
    }, 1000)
  }, [capturePhoto])

  useEffect(() => {
    return () => {
      closeCamera();
    }
  }, [closeCamera])

  //handle file upload from input
   const handleUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => onCapture(index, ev.target?.result as string)
    reader.readAsDataURL(file)
    // Reset input so same file can be re-selected
    e.target.value = ''
  }, [index, onCapture])

  return (
    <div
      className="photo-slot"
      style={{
        border: `5px solid ${frameColor}`,
        // Each slot fills its grid cell, with a minimum square size
        width: '100%', aspectRatio: '1 / 1',
      }}
    >
      {/* ── CAPTURED: show the photo ── */}
      {image && (
        <div className="relative w-full h-full group">
          <img src={image} alt={`Slot ${index + 1}`} className="w-full h-full object-cover" />
          {/* Retake overlay */}
          <button
            onClick={() => { onCapture(index, ''); setModel('idle') }}
            className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all
                       flex items-center justify-center opacity-0 group-hover:opacity-100"
            style={{ borderRadius: '10px' }}
            title="Retake"
          >
            <span className=" text-white text-sm bg-black/50 px-3 py-1 rounded-full">
              🔄 Retake
            </span>
          </button>
        </div>
      )}

      {/* ── CAMERA MODE: live preview ── */}
      {!image && model === 'capturing' && (
        <div className="relative w-full h-full bg-black flex items-center justify-center">
          <video ref={videoRef} autoPlay playsInline muted className="video-mirror w-full h-full object-cover" />

          {/* Countdown overlay */}
          {countdown !== null && (
            <div className="countdown-overlay">
              <span className="countdown-number">{countdown}</span>
            </div>
          )}

          {/* Camera controls */}
          <div className="absolute bottom-2 left-0 right-0 flex justify-center z-20">
            <button
              onClick={capturePhoto}
              disabled={countdown !== null}
              className="hover:cursor-pointer text-sm w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: frameColor }}
            >📸</button>
            <button
              onClick={startCountdown}
              disabled={countdown !== null}
              className="hover:cursor-pointer text-md w-8 h-8  rounded-full flex items-center justify-center bg-white"
            >⏱</button>
            <button
              onClick={closeCamera}
                className="hover:cursor-pointer text-sm w-8 h-8  rounded-full flex items-center justify-center bg-white text-gray-500"
              >✕</button>
          </div>
        </div>
      )}

      {/* ── IDLE: action buttons ── */}
      {!image && model === 'idle' && (
        <div className="w-full h-full flex flex-col items-center justify-center gap-3 p-3"
             style={{ background: `${frameColor}22` }}>
          {/* Slot number badge */}
          <div className="text-2xl font-bold" style={{ color: "#c4497a", }}>
            {index + 1}
          </div>

          <button
            onClick={openCamera}
            className="cursor-pointer text-sm w-24 h-8  rounded-full flex items-center justify-center"
            style={{ background: frameColor }}
          >
            📷 Camera
          </button>

          <label
            className="cursor-pointer text-sm w-24 h-8  rounded-full flex items-center justify-center"
            style={{ background: `${frameColor}80` }}
          >
            🖼 Upload
            <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
          </label>
        </div>
      )}

      {/* Hidden canvas for frame capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
