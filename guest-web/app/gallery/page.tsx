"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Loader2, Image as ImageIcon, Users, Clock, Database, Check } from "lucide-react";

type MeData = {
  name: string;
  trip_id: string;
  matched_photo_count: number;
  total_trip_photos: number;
  total_size_bytes: number;
  my_photos_size_bytes: number;
  my_group_count: number;
  my_solo_count: number;
  most_frequent_partner_name: string | null;
  portrait_count: number;
  group_count: number;
  nature_count: number;
  peak_hour: number | null;
  gallery_preference: string;
  selfie_status: "pending" | "ok" | "no_face_detected" | "multiple_faces_detected";
  has_pending_photos: boolean;
};

type Photo = {
  id: string;
  proxy_url: string;
  media_type: string;
  created_at: string;
  face_count: number;
};

type UnknownFace = {
  id: string;
  asset_id: string;
  thumbnail_url: string;
};

export default function GalleryPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [me, setMe] = useState<MeData | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [unknownFaces, setUnknownFaces] = useState<UnknownFace[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"mine_only" | "group" | "nature" | "all">("mine_only");
  const [claiming, setClaiming] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    const t = localStorage.getItem("guestToken");
    if (!t) {
      router.push("/");
      return;
    }
    setToken(t);
  }, [router]);

  useEffect(() => {
    if (!token) return;

    const fetchMe = async () => {
      try {
        const res = await fetch("http://localhost:8000/api/v1/guest/me", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) {
          localStorage.removeItem("guestToken");
          router.push("/");
          return;
        }
        setMe(await res.json());
      } catch (e) {
        console.error(e);
      }
    };
    fetchMe();
  }, [token, router]);

  useEffect(() => {
    if (!token) return;

    const fetchPhotos = async () => {
      try {
        const res = await fetch(`http://localhost:8000/api/v1/guest/photos?filter=${activeTab}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          setPhotos(await res.json());
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    setLoading(true);
    fetchPhotos();
  }, [token, activeTab]);

  useEffect(() => {
    if (!token) return;
    const fetchUnknowns = async () => {
      try {
        const res = await fetch("http://localhost:8000/api/v1/guest/unknown-faces", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          setUnknownFaces(await res.json());
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchUnknowns();
  }, [token]);

  const handleDownload = async () => {
    if (!token || isDownloading) return;
    setIsDownloading(true);
    try {
      const res = await fetch(
        `http://localhost:8000/api/v1/guest/download?filter=${activeTab}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `fastsend-photos-${activeTab}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Download error:", e);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleClaim = async (faceId: string) => {
    setClaiming(faceId);
    try {
      await fetch(`http://localhost:8000/api/v1/guest/claim/${faceId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      setUnknownFaces((prev) => prev.filter((f) => f.id !== faceId));
    } catch (e) {
      console.error(e);
    } finally {
      setClaiming(null);
    }
  };

  if (!me) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const formatSize = (bytes: number) => {
    const gb = bytes / (1024 * 1024 * 1024);
    return gb > 1 ? `${gb.toFixed(1)} GB` : `${(bytes / (1024 * 1024)).toFixed(0)} MB`;
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-gray-950/80 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Trip Gallery</h1>
            <p className="text-sm text-gray-400">Welcome, {me.name}</p>
          </div>
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isDownloading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">
              {isDownloading ? "Preparing ZIP..." : "Download Collection"}
            </span>
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 mt-8 space-y-12">
        {/* Selfie Error Banner */}
        {me.selfie_status === "no_face_detected" && (
          <div className="bg-red-900/40 border border-red-500/40 rounded-2xl p-4 text-center">
            <p className="text-red-300 font-medium">⚠️ We couldn&apos;t detect a face in your selfie.</p>
            <p className="text-red-400/70 text-sm mt-1">Please go back and re-register with a clearer, well-lit photo of your face.</p>
          </div>
        )}
        {me.selfie_status === "multiple_faces_detected" && (
          <div className="bg-yellow-900/40 border border-yellow-500/40 rounded-2xl p-4 text-center">
            <p className="text-yellow-300 font-medium">⚠️ Multiple faces detected in your selfie.</p>
            <p className="text-yellow-400/70 text-sm mt-1">Please re-register with a selfie showing only your face.</p>
          </div>
        )}
        {/* Processing banner: shown while Celery is still working on photos */}
        {me.has_pending_photos && (
          <div className="bg-blue-900/40 border border-blue-500/40 rounded-2xl p-4 flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-blue-400 animate-spin shrink-0" />
            <div>
              <p className="text-blue-300 font-medium">⏳ Some photos are still being processed.</p>
              <p className="text-blue-400/70 text-sm mt-0.5">Check back in a few minutes — more of your photos may appear soon!</p>
            </div>
          </div>
        )}
        {/* AI Summary Card */}
        <section className="bg-gradient-to-br from-blue-900/40 to-purple-900/40 border border-blue-500/20 rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-400" /> AI Summary
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            <div>
              <p className="text-gray-400 text-sm mb-1">Your Photos</p>
              <p className="text-2xl font-bold">{me.matched_photo_count} <span className="text-sm font-normal text-gray-500">({formatSize(me.my_photos_size_bytes || 0)})</span></p>
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-1">Photo Types</p>
              <p className="text-2xl font-bold">{me.my_group_count} <span className="text-sm font-normal text-gray-500">Group</span> / {me.my_solo_count} <span className="text-sm font-normal text-gray-500">Solo</span></p>
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-1">Most seen with</p>
              <p className="text-lg font-bold truncate" title={me.most_frequent_partner_name || "N/A"}>
                {me.most_frequent_partner_name || "N/A"}
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-1">Peak Activity</p>
              <p className="text-2xl font-bold flex items-center gap-2">
                <Clock className="w-5 h-5 text-gray-500" />
                {me.peak_hour !== null ? `${me.peak_hour}:00` : "--"}
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-1">Total Trip Album</p>
              <p className="text-lg font-bold">{me.total_trip_photos} photos ({formatSize(me.total_size_bytes)})</p>
            </div>
          </div>
        </section>

        {/* Gallery */}
        <section>
          {/* Tabs */}
          <div className="flex overflow-x-auto gap-2 pb-4 mb-4 hide-scrollbar">
            {[
              { id: "mine_only", label: "My Photos", icon: ImageIcon },
              { id: "group", label: "Group", icon: Users },
              { id: "nature", label: "Nature", icon: ImageIcon },
              { id: "all", label: "All Photos", icon: Database },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? "bg-white text-black"
                      : "bg-gray-900 text-gray-400 hover:bg-gray-800"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {loading ? (
            <div className="py-20 flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
            </div>
          ) : photos.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              No photos found for this category.
            </div>
          ) : (
            <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
              {photos.map((photo) => (
                <div
                  key={photo.id}
                  className="relative group rounded-xl overflow-hidden bg-gray-900 break-inside-avoid"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.proxy_url}
                    alt="Trip photo"
                    loading="lazy"
                    className="w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-3 left-3 text-xs font-medium text-white/80">
                      {photo.face_count > 0 ? `${photo.face_count} faces` : "Nature"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Claim Faces */}
        {unknownFaces.length > 0 && (
          <section className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
            <h2 className="text-lg font-semibold mb-4">Is this you?</h2>
            <p className="text-sm text-gray-400 mb-6">
              Claim these faces to have them added to your personal gallery.
            </p>
            <div className="flex gap-4 overflow-x-auto pb-4">
              {unknownFaces.map((face) => (
                <div key={face.id} className="shrink-0 w-24">
                  <div className="aspect-square rounded-lg overflow-hidden bg-gray-800 mb-2 relative group">
                    {face.thumbnail_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={face.thumbnail_url} alt="Unknown face" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">?</div>
                    )}
                    <button
                      onClick={() => handleClaim(face.id)}
                      disabled={claiming === face.id}
                      className="absolute inset-0 bg-blue-600/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-100"
                    >
                      {claiming === face.id ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Check className="w-6 h-6" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
