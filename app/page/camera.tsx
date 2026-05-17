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
  const frameColor = ["#FFB6C1", "#87CEFA", "#90EE90", "#FFD700"][index % 4];
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
    <div className="relative w-full" style={{paddingTop: "75%"}}>
      <div className="absolute inset-0 border-8 rounded-lg" style={{borderColor: frameColor}}>
        {image ? (
          <Image src={image} alt={`Captured photo ${index + 1}`} layout="fill" objectFit="cover" className="rounded-lg" />
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-2"> 
            <button
              onClick={openCamera}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Capture Photo
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
