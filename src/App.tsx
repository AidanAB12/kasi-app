import React, { useCallback, useEffect, useRef, useState } from "react";
import "./App.css";
import { Buffer } from "buffer";
import { saveAs } from "file-saver";
import { FirebaseError } from "firebase/app";
interface Box {
  x_center: number;
  y_center: number;
  w: number;
  h: number;
  angle: number;
  score: number;
  class_name: string;
}

interface Prediction {
  boxes: Box[];
}

interface PredictionResult {
  timestamp_start: string;
  timestamp_end: string;
  predictions: Prediction[];
}

function App() {
  const videoRef = useRef<HTMLVideoElement>(null!);
  const streamRef = useRef<MediaStream>(null!);
  const offscreenRef = useRef<OffscreenCanvas>(null!);
  const drawCanvasRef = useRef<HTMLCanvasElement>(null!);
  const [b64, setB64] = useState<String>("");
  const [lastBlob, setLastBlob] = useState<Blob>(null!);
  const [lastPrediction, setLastPrediction] = useState<PredictionResult>(null!);
  const [isCapturing, setIsCapturing] = useState(false);
  const [videoDevices, setVideoDevices] = useState<InputDeviceInfo[]>([]);
  const selectRef = useRef<HTMLSelectElement>(null!);
  const [filebase64, setFileBase64] = useState<string>("");
  const [fileRef, setFileRef] = useState<File | null>(null);
  const [base64DataUrl, setBase64DataUrl] = useState<string | null>(null); // Declare base64DataUrl at a higher scope

  // ...

  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then((devices) => {
      const videos = devices.filter((device) => device.kind === "videoinput");
      setVideoDevices(videos);
    });
  }, []);

  const createCanvas = () => {
    if (!offscreenRef.current) {
      offscreenRef.current = new OffscreenCanvas(640, 480);
    }
  };
  function convertFile(files: FileList | null) {
    if (files) {
      const fileRef = files[0] || "";
      const fileType: string = fileRef.type || "";
      console.log("This file upload is of type:", fileType);
      const reader = new FileReader();

      reader.onload = (ev: any) => {
        // convert it to base64
        const base64DataUrl = ev.target.result;
        console.log(base64DataUrl);

        // Display the Base64 Data URL in an image tag
        const imgElement = document.createElement("img");
        imgElement.src = base64DataUrl;
        document.body.appendChild(imgElement); // You can append it to any HTML element
        setBase64DataUrl(base64DataUrl); // Update the global variable
      };

      reader.readAsDataURL(fileRef);
    }
  }

  const upload = async () => {
    // File object is already a Blob
    let final = base64DataUrl?.replace("data:image/jpeg;base64,", "");
    final = final?.replace("data:image/png;base64,", "");
    const body = JSON.stringify({ image_data: [final] });

    const b64 = base64DataUrl;
    const url = "http://10.27.3.67/predict";
    const response = await fetch(url, {
      method: "post",
      body: body,
      headers: { "Content-Type": "application/json" },
    });
    const data = await response.json();
    setLastPrediction(data as PredictionResult);

    setTimeout(() => draw(), 100);
  };

  const start = async () => {
    const idx = selectRef.current.selectedIndex;
    const device = videoDevices[idx];

    if (isCapturing) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      setIsCapturing(false);
    } else {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: device.deviceId,
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
      });
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setIsCapturing(true);
    }
  };

  function delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  const capture = async () => {
    await delay(100);
    createCanvas();

    console.log("capture");
    const bitmap = await createImageBitmap(videoRef.current);
    console.log("bitmap", bitmap);
    console.log("bitmap data", JSON.stringify(bitmap));

    offscreenRef.current.width = bitmap.width;
    offscreenRef.current.height = bitmap.height;

    const renderCtx = offscreenRef.current.getContext(
      "bitmaprenderer"
    ) as ImageBitmapRenderingContext;
    renderCtx.transferFromImageBitmap(bitmap);

    const blob = await offscreenRef.current.convertToBlob({
      type: "image/jpeg",
    });
    setLastBlob(blob);

    const text = await blob.arrayBuffer();
    const b64 = Buffer.from(text).toString("base64");
    setB64(b64);

    const body = JSON.stringify({ image_data: [b64] });
    const url = "http://10.27.3.67/predict";
    const response = await fetch(url, {
      method: "post",
      body: body,
      headers: { "Content-Type": "application/json" },
    });
    const data = await response.json();
    setLastPrediction(data as PredictionResult);

    setTimeout(() => draw(), 100);
  };

  const save = () => {
    const filename = lastPrediction.timestamp_start + ".jpg";
    saveAs(lastBlob, filename);
  };

  const draw = () => {
    if (!drawCanvasRef.current) return;
    if (!lastBlob) return;

    console.log("draw");
    const ctx = drawCanvasRef.current.getContext("2d");
    if (ctx) {
      const img = new Image();
      img.src = URL.createObjectURL(lastBlob);
      img.onload = () => {
        console.log("dragin image");
        ctx.drawImage(img, 0, 0);

        lastPrediction.predictions.forEach((prediction) => {
          prediction.boxes.forEach((box) => {
            if (box.class_name !== "placeholder_form") {
              ctx.strokeStyle = "black";
              const l = box.x_center - box.w / 2;
              const t = box.y_center - box.h / 2;
              ctx.strokeRect(l, t, box.w, box.h);

              ctx.strokeText(box.class_name, l, t);
            }
          });
        });
      };
    }
  };

  return (
    <div className="App">
      <div>
        <select ref={selectRef}>
          {videoDevices.map((dev) => (
            <option key={dev.deviceId}>{dev.label}</option>
          ))}
        </select>
        <button onClick={start}>{isCapturing ? "Stop" : "Start"}</button>
        <button onClick={capture}>Capture</button>

        <button onClick={save} disabled={lastBlob === null}>
          Save
        </button>

        <button onClick={draw} disabled={lastBlob === null}>
          Draw
        </button>
        <button onClick={upload}> Upload</button>
        <input type="file" onChange={(e) => convertFile(e.target.files)} />
      </div>
      <video ref={videoRef} autoPlay={true} muted={true} playsInline={true} />
      <canvas ref={drawCanvasRef} width={640} height={480} />
      <pre>{JSON.stringify(lastPrediction, null, 2)}</pre>
    </div>
  );
}

export default App;
