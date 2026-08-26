"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ChevronRight, Database, Download, Image as ImageIcon, Images, Loader2, LockKeyhole, UserRound, Users, X } from "lucide-react";
import { API_BASE_URL } from "../lib/api";

type DownloadPermission = "mine" | "mine_plus_group" | "all";
type GalleryFilter = "mine" | "mine_plus_group" | "all";

type MeData = {
  name: string;
  matched_photo_count: number;
  total_trip_photos: number;
  total_size_bytes: number;
  my_photos_size_bytes: number;
  my_group_count: number;
  my_solo_count: number;
  selfie_status: "pending" | "ok" | "no_face_detected" | "multiple_faces_detected";
  has_pending_photos: boolean;
  download_permission?: DownloadPermission;
};

type Photo = {
  id: string;
  proxy_url: string;
  original_url?: string;
  media_type: string;
  created_at: string;
  face_count: number;
};

const FILTER_LABELS: Record<GalleryFilter, string> = {
  mine: "Mine Photos",
  mine_plus_group: "Mine + Group",
  all: "All Photos",
};

async function downloadUrl(url: string, filename: string) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Photo download failed");
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  } catch {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}

export default function GalleryPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [me, setMe] = useState<MeData | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [activeFilter, setActiveFilter] = useState<GalleryFilter>("mine");
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [photoError, setPhotoError] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);
  const [lightboxPhoto, setLightboxPhoto] = useState<Photo | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem("guestToken");
    if (!storedToken) {
      router.replace("/");
      return;
    }
    setToken(storedToken);
  }, [router]);

  useEffect(() => {
    if (!token) return;
    const fetchMe = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/guest/me`, { headers: { Authorization: `Bearer ${token}` } });
        if (response.status === 401) {
          localStorage.removeItem("guestToken");
          router.replace("/");
          return;
        }
        if (!response.ok) throw new Error("Your guest session could not be loaded.");
        setMe(await response.json());
        setPageError("");
      } catch (error: unknown) {
        setPageError(error instanceof Error ? error.message : "Your guest session could not be loaded.");
      }
    };
    fetchMe();
  }, [router, token]);

  const fetchPhotos = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setPhotoError("");
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/guest/photos?filter=${activeFilter}`, { headers: { Authorization: `Bearer ${token}` } });
      if (response.status === 401) {
        localStorage.removeItem("guestToken");
        router.replace("/");
        return;
      }
      if (!response.ok) throw new Error("Your photos could not be loaded right now.");
      setPhotos(await response.json());
    } catch (error: unknown) {
      setPhotoError(error instanceof Error ? error.message : "Your photos could not be loaded right now.");
    } finally {
      setLoading(false);
    }
  }, [activeFilter, router, token]);

  useEffect(() => { fetchPhotos(); }, [fetchPhotos]);

  const permission = me?.download_permission || "mine";
  const filterOptions = useMemo(() => {
    const options: GalleryFilter[] = ["mine"];
    if (permission === "mine_plus_group" || permission === "all") options.push("mine_plus_group");
    if (permission === "all") options.push("all");
    return options;
  }, [permission]);

  useEffect(() => {
    if (!filterOptions.includes(activeFilter)) setActiveFilter("mine");
  }, [activeFilter, filterOptions]);

  const handleDownload = async () => {
    if (!token || isDownloading) return;
    setIsDownloading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/guest/download?filter=${activeFilter}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) throw new Error("Download failed");
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = `fastsend-${activeFilter}.zip`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch (error: unknown) {
      setPhotoError(error instanceof Error ? error.message : "Download failed. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (!bytes) return "0 MB";
    const megabytes = bytes / (1024 * 1024);
    return megabytes >= 1024 ? `${(megabytes / 1024).toFixed(1)} GB` : `${Math.max(1, megabytes).toFixed(0)} MB`;
  };

  if (!me) {
    return <main className="gallery-page"><div className="loading-state"><Loader2 size={30} className="animate-spin" /></div>{pageError && <div className="empty-gallery"><strong>We could not open this collection.</strong><p>{pageError}</p><button className="primary-button" onClick={() => router.replace("/")}>Return to join</button></div>}</main>;
  }

  return (
    <main className="gallery-page">
      <div className="gallery-shell">
        <header className="gallery-header">
          <div><div className="gallery-brand"><span className="gallery-brand-mark"><CameraIcon /></span><span>FASTSEND</span></div><p className="gallery-welcome">Welcome, {me.name}</p></div>
          <button type="button" onClick={handleDownload} disabled={isDownloading} className="download-button">{isDownloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}<span>{isDownloading ? "Preparing..." : `Download ${FILTER_LABELS[activeFilter]}`}</span></button>
        </header>

        <div className="gallery-main">
          {me.selfie_status === "no_face_detected" && <div className="gallery-banner alert"><ImageIcon size={18} /><p><strong>We could not detect a face.</strong>Please return to the join page and choose a clearer, well-lit photo.</p></div>}
          {me.selfie_status === "multiple_faces_detected" && <div className="gallery-banner alert"><Users size={18} /><p><strong>Multiple faces were detected.</strong>Please register again with a selfie showing only you.</p></div>}
          {me.has_pending_photos && <div className="gallery-banner"><Loader2 size={18} className="animate-spin" /><p><strong>Your collection is still growing.</strong>Some trip photos are being processed and may appear shortly.</p></div>}

          <section className="summary-card"><div className="summary-heading"><Database size={15} /> YOUR COLLECTION AT A GLANCE</div><div className="summary-grid"><div className="summary-item"><small>Matched photos</small><strong>{me.matched_photo_count}</strong><span>{formatSize(me.my_photos_size_bytes)}</span></div><div className="summary-item"><small>Solo moments</small><strong>{me.my_solo_count}</strong><span>just you</span></div><div className="summary-item"><small>Group moments</small><strong>{me.my_group_count}</strong><span>with others</span></div><div className="summary-item"><small>Trip album</small><strong>{me.total_trip_photos}</strong><span>{formatSize(me.total_size_bytes)}</span></div></div></section>

          <section className="permission-card"><strong><LockKeyhole size={14} /> Organizer sharing setting</strong><p>{permission === "all" ? "You can explore the complete trip collection." : permission === "mine_plus_group" ? "You can explore your photos and group moments you are in." : "You can explore your personal solo photos."}</p></section>

          <section>
            <div className="gallery-nav" role="tablist" aria-label="Photo collection views">
              {filterOptions.map((filter) => <button type="button" role="tab" aria-selected={activeFilter === filter} key={filter} className={`gallery-tab ${activeFilter === filter ? "active" : ""}`} onClick={() => setActiveFilter(filter)}>{filter === "mine" ? <UserRound size={15} /> : filter === "mine_plus_group" ? <Users size={15} /> : <Images size={15} />}{FILTER_LABELS[filter]}</button>)}
              <span className="gallery-count">{photos.length} shown</span>
            </div>

            {photoError ? <div className="empty-gallery"><strong>We could not load these photos.</strong><p>{photoError}</p><button type="button" className="primary-button" onClick={fetchPhotos}>Try again <ChevronRight size={16} /></button></div> : loading ? <div className="loading-state"><Loader2 size={30} className="animate-spin" /></div> : photos.length === 0 ? <div className="empty-gallery"><CheckCircle2 size={24} color="#5D927B" /><strong>No photos here yet.</strong><p>Keep this page open while the trip collection is being processed.</p></div> : <div className="photo-grid">{photos.map((photo) => <button type="button" className="photo-tile" key={photo.id} onClick={() => setLightboxPhoto(photo)} aria-label="Open photo"><img src={photo.proxy_url} alt="Trip moment" loading="lazy" /><span className="photo-overlay"><span>{photo.face_count > 1 ? `${photo.face_count} people` : "Personal moment"}</span><span className="photo-download" onClick={(event) => { event.stopPropagation(); void downloadUrl(photo.original_url || photo.proxy_url, `fastsend-${photo.id}.jpg`); }} aria-label="Download photo"><Download size={15} /></span></span></button>)}</div>}
          </section>
        </div>
      </div>

      {lightboxPhoto && <div className="lightbox" role="dialog" aria-modal="true" aria-label="Photo preview" onClick={() => setLightboxPhoto(null)}><div className="lightbox-content" onClick={(event) => event.stopPropagation()}><button type="button" className="lightbox-close" onClick={() => setLightboxPhoto(null)} aria-label="Close photo"><X size={19} /></button><img src={lightboxPhoto.original_url || lightboxPhoto.proxy_url} alt="Trip moment preview" /><div className="lightbox-actions"><button type="button" className="download-button" onClick={() => void downloadUrl(lightboxPhoto.original_url || lightboxPhoto.proxy_url, `fastsend-${lightboxPhoto.id}.jpg`)}><Download size={16} /> Download photo</button></div></div></div>}
    </main>
  );
}

function CameraIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14.5 4h-5L8 7H4.5A2.5 2.5 0 0 0 2 9.5v7A2.5 2.5 0 0 0 4.5 19h15a2.5 2.5 0 0 0 2.5-2.5v-7A2.5 2.5 0 0 0 19.5 7H16z" /><circle cx="12" cy="13" r="3.5" /></svg>;
}
