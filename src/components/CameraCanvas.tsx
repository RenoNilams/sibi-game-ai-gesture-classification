// src/components/CameraCanvas.tsx
import { useEffect, useRef } from "react";
import { Hands, HAND_CONNECTIONS } from "@mediapipe/hands";
import { drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils";

type CameraCanvasProps = {
  onLandmarks?: (landmarks: number[]) => void;
};

type Landmark = { x: number; y: number; z?: number };

function makeNormalizedFeatures(multiHandLandmarks: Landmark[][], multiHandedness: any[]): number[] {
  let leftHandFeatures = new Array(42).fill(0.0);
  let rightHandFeatures = new Array(42).fill(0.0);

  if (!multiHandLandmarks || multiHandLandmarks.length === 0) {
    return [...leftHandFeatures, ...rightHandFeatures];
  }

  for (let i = 0; i < multiHandLandmarks.length; i++) {
    const landmarks = multiHandLandmarks[i];
    const actualHand = multiHandedness[i].label; 

    if (landmarks.length >= 21) {
      const wristX = 1.0 - landmarks[0].x;
      const wristY = landmarks[0].y;

      const middleMcpX = 1.0 - landmarks[9].x;
      const middleMcpY = landmarks[9].y;

      const dx = middleMcpX - wristX;
      const dy = middleMcpY - wristY;
      let scale = Math.sqrt(dx * dx + dy * dy);
      if (scale < 1e-6) scale = 1e-6;

      const normFeats: number[] = [];
      for (const p of landmarks) {
        const flippedX = 1.0 - p.x;
        const flippedY = p.y;
        const nx = (flippedX - wristX) / scale;
        const ny = (flippedY - wristY) / scale;
        normFeats.push(nx, ny);
      }

      if (actualHand === "Left") {
        leftHandFeatures = normFeats;
      } else {
        rightHandFeatures = normFeats;
      }
    }
  }

  return [...leftHandFeatures, ...rightHandFeatures];
}

export function CameraCanvas({ onLandmarks }: CameraCanvasProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    async function setupCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 },
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch (err) {
        console.error("Gagal akses kamera:", err);
      }
    }
    setupCamera();
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const hands = new Hands({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });

    hands.setOptions({
      maxNumHands: 2, 
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    hands.onResults((results: any) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

      if (results.multiHandLandmarks) {
        for (const landmarks of results.multiHandLandmarks) {
          drawConnectors(ctx, landmarks, HAND_CONNECTIONS, { color: '#00E5FF', lineWidth: 3 });
          drawLandmarks(ctx, landmarks, { color: '#2C3E50', lineWidth: 0.5, radius: 4 });
        }
      }
      ctx.restore(); 

      if (!onLandmarks) return;
      
      const feats = makeNormalizedFeatures(
        results.multiHandLandmarks || [], 
        results.multiHandedness || []
      );
      
      if (feats.length === 84) {
         onLandmarks(feats);
      }
    });

    let animationFrameId: number;

    const processFrame = async () => {
      if (video.readyState >= 2) {
        await hands.send({ image: video });
      }
      animationFrameId = requestAnimationFrame(processFrame);
    };

    processFrame();

    return () => {
      cancelAnimationFrame(animationFrameId);
      hands.close();
    };
  }, [onLandmarks]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <video ref={videoRef} style={{ display: "none" }} playsInline muted />
      {/* FIX: Canvas dibuat melar 100% menggunakan objectFit cover, tapi resolusi aslinya tetap 640x480 */}
      <canvas
        ref={canvasRef}
        width={640}
        height={480}
        style={{ 
          width: '100%', 
          height: '100%', 
          objectFit: 'cover', // Memotong sisa pinggir hitam agar penuh
          display: 'block' // Menghilangkan jarak aneh di bawah canvas
        }}
      />
    </div>
  );
}