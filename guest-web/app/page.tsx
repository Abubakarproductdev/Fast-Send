"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Webcam from "react-webcam";
import { Camera, Loader2 } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [selfie, setSelfie] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const webcamRef = useRef<Webcam>(null);

  // Default to a test trip code if available in URL or let user type it
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("trip");
    if (code) setInviteCode(code);
  }, []);

  const capture = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      setSelfie(imageSrc);
    }
  }, [webcamRef]);

  const retake = () => {
    setSelfie(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !inviteCode || !selfie) {
      setError("Please fill in all fields and take a selfie.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("http://localhost:8000/api/v1/guest/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          trip_invite_code: inviteCode,
          name: name,
          selfie_base64: selfie,
        }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.detail || "Registration failed");
      }

      localStorage.setItem("guestToken", data.token);
      router.push("/gallery");
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
        <h2 className="text-xl font-semibold">Finding you in the photos...</h2>
      </div>
    );
  }

  return (
    <main className="flex-1 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Join the Trip</h1>
          <p className="text-gray-400">Take a selfie to find your photos.</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Invite Code</label>
            <input
              type="text"
              required
              className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              placeholder="e.g. 3A8F2B1C"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Your Name</label>
            <input
              type="text"
              required
              className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Selfie</label>
            {!selfie ? (
              <div className="relative rounded-lg overflow-hidden bg-black aspect-square flex items-center justify-center">
                <Webcam
                  audio={false}
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  videoConstraints={{ facingMode: "user" }}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={capture}
                  className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white text-black p-3 rounded-full hover:scale-105 transition-transform"
                >
                  <Camera className="w-6 h-6" />
                </button>
              </div>
            ) : (
              <div className="relative rounded-lg overflow-hidden bg-black aspect-square">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={selfie} alt="Selfie" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={retake}
                  className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-gray-900/80 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-800 transition-colors"
                >
                  Retake
                </button>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={!selfie || !name || !inviteCode}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Find My Photos
          </button>
        </form>
      </div>
    </main>
  );
}
