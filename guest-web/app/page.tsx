"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Webcam from "react-webcam";
import { Camera, Loader2, Image as ImageIcon, ArrowRight, CheckCircle2, ShieldCheck } from "lucide-react";

type Step = "landing" | "details" | "method" | "camera" | "uploading";

export default function Home() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("landing");
  const [name, setName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [selfie, setSelfie] = useState<string | null>(null);
  const [error, setError] = useState("");
  const webcamRef = useRef<Webcam>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("trip");
    if (code) setInviteCode(code);
  }, []);

  const handleNext = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    console.log("handleNext triggered, current step:", step);
    setError("");
    if (step === "landing") {
      setStep("details");
    } else if (step === "details") {
      if (!name.trim() || !inviteCode.trim()) {
        setError("Please enter your name and invite code.");
        return;
      }
      setStep("method");
    }
  };

  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelfie(reader.result as string);
        submitRegistration(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const requestCameraPermission = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ video: true });
      setStep("camera");
    } catch (err) {
      setError("Camera permission denied. Please allow camera access or use the gallery option.");
    }
  };

  const captureCamera = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        setSelfie(imageSrc);
        submitRegistration(imageSrc);
      }
    }
  }, [webcamRef]);

  const submitRegistration = async (base64Image: string) => {
    setStep("uploading");
    setError("");

    try {
      const res = await fetch("http://192.168.10.4:8000/api/v1/guest/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trip_invite_code: inviteCode,
          name: name,
          selfie_base64: base64Image,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Registration failed");

      localStorage.setItem("guestToken", data.token);
      router.push("/gallery");
    } catch (err: any) {
      setError(err.message);
      setStep("method"); // go back to let them try again
    }
  };

  return (
    <main className="flex-1 flex flex-col items-center justify-center p-4 min-h-screen">
      <div className="w-full max-w-md bg-bg-card border border-border rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        
        {/* Progress indicator */}
        {step !== "landing" && step !== "uploading" && (
          <div className="flex gap-2 mb-8">
            <div className={`h-1 flex-1 rounded-full ${step === "details" || step === "method" || step === "camera" ? "bg-amber" : "bg-border"}`} />
            <div className={`h-1 flex-1 rounded-full ${step === "method" || step === "camera" ? "bg-amber" : "bg-border"}`} />
            <div className={`h-1 flex-1 rounded-full ${step === "camera" ? "bg-amber" : "bg-border"}`} />
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-xl mb-6 text-sm flex items-center gap-2">
            ⚠️ {error}
          </div>
        )}

        {/* STEP 1: LANDING */}
        {step === "landing" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="w-16 h-16 bg-amber/10 rounded-2xl flex items-center justify-center mb-6 mx-auto border border-amber/20">
              <Camera className="w-8 h-8 text-amber" />
            </div>
            <h1 className="text-3xl font-bold text-center mb-2">Trip Gallery</h1>
            <p className="text-text-secondary text-center mb-8">Find all your photos instantly using AI.</p>
            
            <div className="space-y-6 mb-8">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-bg-elevated border border-border flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-amber font-semibold text-sm">1</span>
                </div>
                <div>
                  <h3 className="font-semibold text-text-primary">Provide a Photo</h3>
                  <p className="text-sm text-text-secondary mt-1">Take a quick selfie or upload a photo of your face.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-bg-elevated border border-border flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-amber font-semibold text-sm">2</span>
                </div>
                <div>
                  <h3 className="font-semibold text-text-primary">AI Matching</h3>
                  <p className="text-sm text-text-secondary mt-1">We securely scan the trip album to find every photo you're in.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-bg-elevated border border-border flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-amber font-semibold text-sm">3</span>
                </div>
                <div>
                  <h3 className="font-semibold text-text-primary">Download Collection</h3>
                  <p className="text-sm text-text-secondary mt-1">Get your personalized, high-quality photo gallery instantly.</p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleNext()}
              className="w-full bg-amber hover:bg-amber-hover text-black font-semibold py-3.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer relative z-10"
            >
              Get Started <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* STEP 2: DETAILS */}
        {step === "details" && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-2xl font-bold mb-1">Your Details</h2>
            <p className="text-text-secondary mb-6">Let's get you connected to the trip.</p>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">Invite Code</label>
                <input
                  type="text"
                  className="w-full bg-bg-elevated border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-amber uppercase transition-colors"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  placeholder="e.g. 3A8F2B"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">Your Name</label>
                <input
                  type="text"
                  className="w-full bg-bg-elevated border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-amber transition-colors"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                />
              </div>
              <button
                type="button"
                onClick={handleNext}
                disabled={!name.trim() || !inviteCode.trim()}
                className="w-full bg-amber hover:bg-amber-hover text-black font-semibold py-3.5 px-4 rounded-xl transition-colors mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: METHOD SELECTION */}
        {step === "method" && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-2xl font-bold mb-1">Face Recognition</h2>
            <p className="text-text-secondary mb-6 text-sm">How would you like to provide your reference photo?</p>

            <div className="space-y-4">
              <button
                onClick={requestCameraPermission}
                className="w-full bg-bg-elevated hover:bg-border border border-border p-5 rounded-2xl transition-all flex flex-col items-center justify-center gap-3 group"
              >
                <div className="w-12 h-12 rounded-full bg-amber/10 text-amber flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Camera className="w-6 h-6" />
                </div>
                <div className="text-center">
                  <h3 className="font-semibold text-text-primary">Take a Selfie</h3>
                  <p className="text-xs text-text-secondary mt-1">Use your camera right now</p>
                </div>
              </button>

              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleGalleryUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="w-full bg-bg-elevated hover:bg-border border border-border p-5 rounded-2xl transition-all flex flex-col items-center justify-center gap-3 group">
                  <div className="w-12 h-12 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <ImageIcon className="w-6 h-6" />
                  </div>
                  <div className="text-center">
                    <h3 className="font-semibold text-text-primary">Choose from Gallery</h3>
                    <p className="text-xs text-text-secondary mt-1">Upload an existing photo</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-text-secondary">
              <ShieldCheck className="w-4 h-4 text-green-500" />
              <span>Your photo is encrypted and used only for matching.</span>
            </div>
          </div>
        )}

        {/* STEP 4: CAMERA CAPTURE */}
        {step === "camera" && (
          <div className="animate-in fade-in zoom-in-95 duration-300">
            <h2 className="text-xl font-bold mb-4 text-center">Position your face</h2>
            <div className="relative rounded-2xl overflow-hidden bg-black aspect-[3/4] border border-border shadow-inner">
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                videoConstraints={{ facingMode: "user" }}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 pointer-events-none border-[4px] border-amber/20 rounded-2xl m-4"></div>
              
              <button
                type="button"
                onClick={captureCamera}
                className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-amber hover:bg-amber-hover text-black p-4 rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95"
              >
                <Camera className="w-7 h-7" />
              </button>
            </div>
            <button
              onClick={() => setStep("method")}
              className="w-full mt-4 py-2 text-text-secondary hover:text-text-primary text-sm transition-colors"
            >
              Cancel
            </button>
          </div>
        )}

        {/* STEP 5: UPLOADING */}
        {step === "uploading" && (
          <div className="py-12 flex flex-col items-center justify-center text-center animate-in fade-in duration-300">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-amber/20 rounded-full blur-xl animate-pulse"></div>
              <Loader2 className="w-16 h-16 text-amber animate-spin relative z-10" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Analyzing...</h2>
            <p className="text-text-secondary">Finding you in the trip photos.</p>
          </div>
        )}

      </div>
    </main>
  );
}
