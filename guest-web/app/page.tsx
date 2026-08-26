"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Webcam from "react-webcam";
import { ArrowRight, Camera, Image as ImageIcon, Loader2, ShieldCheck } from "lucide-react";
import { API_BASE_URL } from "./lib/api";

type Step = "landing" | "details" | "method" | "camera" | "uploading";

const REQUEST_TIMEOUT_MS = 45000;

function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit = {}, timeoutMs = REQUEST_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);
  return fetch(input, { ...init, signal: controller.signal }).finally(() => window.clearTimeout(timeoutId));
}

async function resizeSelfie(source: Blob | string): Promise<string> {
  const imageUrl = typeof source === "string" ? source : URL.createObjectURL(source);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new window.Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error("This image format could not be read by your browser."));
      element.src = imageUrl;
    });

    const maxDimension = 640;
    const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Your browser could not prepare this image.");
    context.drawImage(image, 0, 0, width, height);

    const compressed = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.82));
    if (!compressed) return canvas.toDataURL("image/jpeg", 0.82);

    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("Your browser could not prepare this image."));
      reader.readAsDataURL(compressed);
    });
  } finally {
    if (typeof source !== "string") URL.revokeObjectURL(imageUrl);
  }
}

export default function Home() {
  const router = useRouter();
  const webcamRef = useRef<Webcam>(null);
  const [step, setStep] = useState<Step>("landing");
  const [name, setName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("trip");
    if (code) setInviteCode(code.toUpperCase());
  }, []);

  const handleNext = () => {
    setError("");
    if (step === "landing") {
      setStep("details");
      return;
    }
    if (step === "details") {
      if (!name.trim() || !inviteCode.trim()) {
        setError("Please enter your name and invite code.");
        return;
      }
      setStep("method");
    }
  };

  const submitRegistration = async (base64Image: string) => {
    setStep("uploading");
    setError("");
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/api/v1/guest/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ trip_invite_code: inviteCode.trim().toUpperCase(), name: name.trim(), selfie_base64: base64Image }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.detail || "We could not join this trip. Please try again.");
      localStorage.setItem("guestToken", data.token);
      router.replace("/gallery");
    } catch (err: unknown) {
      const message = err instanceof Error && err.name === "AbortError"
        ? "The connection is taking too long. Please check your signal and try again."
        : err instanceof Error ? err.message : "We could not upload your photo. Please try again.";
      setError(message);
      setStep("method");
    }
  };

  const handleGalleryUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setError("");
    try {
      const resized = await resizeSelfie(file);
      await submitRegistration(resized);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "This photo could not be prepared. Please choose a clear JPEG or PNG photo.");
      setStep("method");
    }
  };

  const requestCameraPermission = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Camera access is unavailable in this browser. Please choose a photo from your gallery.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach((track) => track.stop());
      setError("");
      setStep("camera");
    } catch {
      setError("Camera access was not granted. You can still choose a photo from your gallery.");
    }
  };

  const captureCamera = async () => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (!imageSrc) {
      setError("The camera is not ready yet. Please try again.");
      return;
    }
    try {
      await submitRegistration(await resizeSelfie(imageSrc));
    } catch {
      setError("The camera photo could not be prepared. Please try again or choose a gallery photo.");
      setStep("method");
    }
  };

  const progressStep = step === "details" ? 1 : step === "method" || step === "camera" ? 2 : 3;

  return (
    <main className="guest-page">
      <div className="guest-card">
        <div className="guest-brand"><span className="guest-brand-mark"><Camera size={20} /></span><span>FASTSEND</span></div>
        {step !== "landing" && step !== "uploading" && (
          <div className="step-progress" aria-label={`Step ${progressStep} of 3`}>
            {[1, 2, 3].map((item) => <span key={item} className={item <= progressStep ? "step-bar step-bar-active" : "step-bar"} />)}
          </div>
        )}

        {error && <div className="guest-alert" role="alert"><span>!</span><p>{error}</p></div>}

        {step === "landing" && (
          <section className="guest-screen guest-screen-landing">
            <div className="hero-mark"><Camera size={31} /></div>
            <p className="eyebrow">YOUR MOMENTS, DELIVERED</p>
            <h1>Find yourself in the moment.</h1>
            <p className="lead">FastSend uses one quick selfie to bring your trip photos together.</p>
            <div className="feature-list">
              {["Share a quick face photo", "Let FastSend find your moments", "Keep your personal collection"].map((label, index) => (
                <div className="feature-row" key={label}><span className="number-chip">{index + 1}</span><span>{label}</span></div>
              ))}
            </div>
            <button type="button" onClick={handleNext} className="primary-button touch-target">Get Started <ArrowRight size={18} /></button>
            <p className="quiet-note"><ShieldCheck size={15} /> Your photo is used only to match you to this trip.</p>
          </section>
        )}

        {step === "details" && (
          <section className="guest-screen">
            <p className="eyebrow">STEP 01 / JOIN THE TRIP</p>
            <h2>Let&apos;s get you connected.</h2>
            <p className="lead">Enter the invite code shared by your organizer.</p>
            <div className="form-stack">
              <label>Invite code<input value={inviteCode} onChange={(event) => setInviteCode(event.target.value.toUpperCase())} placeholder="e.g. 3A8F2B" autoCapitalize="characters" autoComplete="off" /></label>
              <label>Your name<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Enter your name" autoComplete="name" /></label>
              <button type="button" onClick={handleNext} disabled={!name.trim() || !inviteCode.trim()} className="primary-button touch-target">Continue <ArrowRight size={18} /></button>
            </div>
          </section>
        )}

        {step === "method" && (
          <section className="guest-screen">
            <p className="eyebrow">STEP 02 / YOUR REFERENCE PHOTO</p>
            <h2>Show us your face.</h2>
            <p className="lead">Choose the easiest way to help FastSend recognize your photos.</p>
            <div className="method-list">
              <button type="button" onClick={requestCameraPermission} className="method-card touch-target"><span className="method-icon coral"><Camera size={21} /></span><span><strong>Take a selfie</strong><small>Use your camera right now</small></span><ArrowRight size={17} /></button>
              <label className="method-card touch-target"><input type="file" accept="image/*" onChange={handleGalleryUpload} /><span className="method-icon blue"><ImageIcon size={21} /></span><span><strong>Choose a photo</strong><small>Use a clear photo from your gallery</small></span><ArrowRight size={17} /></label>
            </div>
            <p className="quiet-note"><ShieldCheck size={15} /> A clear, well-lit photo works best.</p>
          </section>
        )}

        {step === "camera" && (
          <section className="guest-screen">
            <p className="eyebrow">STEP 02 / SELFIE</p>
            <h2>Center your face.</h2>
            <div className="camera-frame"><Webcam audio={false} ref={webcamRef} screenshotFormat="image/jpeg" videoConstraints={{ facingMode: "user" }} className="camera-video" /><div className="camera-guide" /><button type="button" onClick={captureCamera} className="capture-button touch-target" aria-label="Take selfie"><Camera size={25} /></button></div>
            <button type="button" onClick={() => setStep("method")} className="text-button touch-target">Choose another way</button>
          </section>
        )}

        {step === "uploading" && (
          <section className="guest-screen upload-state"><div className="upload-orbit"><Loader2 size={42} /></div><p className="eyebrow">ONE MOMENT</p><h2>Finding your moments.</h2><p className="lead">Your photo is being matched securely to the trip.</p></section>
        )}
      </div>
    </main>
  );
}
