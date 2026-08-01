import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, Image as ImageIcon } from 'lucide-react';
import { API_BASE_URL } from '../config/api';

export default function GalleryScreen() {
  const { tripId, attendeeId } = useParams<{ tripId: string; attendeeId: string }>();
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGallery = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/trips/${tripId}/gallery/${attendeeId}`);
        if (!res.ok) {
          throw new Error('Failed to load gallery');
        }
        const data = await res.json();
        setImages(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchGallery();
    // Poll every 5 seconds for new photos
    const interval = setInterval(fetchGallery, 5000);
    return () => clearInterval(interval);
  }, [tripId, attendeeId]);

  if (loading && images.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: '16px' }}>
        <Loader2 className="animate-pulse" size={48} color="var(--primary)" />
        <p style={{ color: 'var(--text-secondary)' }}>Finding your photos...</p>
      </div>
    );
  }

  if (error && images.length === 0) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <p style={{ color: 'var(--error)' }}>{error}</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ padding: '16px', maxWidth: '800px', margin: '0 auto', minHeight: '100vh' }}>
      <div style={{ textAlign: 'center', margin: '32px 0' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '8px' }}>Your Gallery</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Photos you appear in will show up here automatically.</p>
      </div>

      {images.length === 0 ? (
        <div className="glass-panel" style={{ padding: '48px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', marginTop: '32px' }}>
          <ImageIcon size={48} color="var(--text-secondary)" />
          <h3 style={{ fontSize: '20px', fontWeight: '600' }}>No photos found yet</h3>
          <p style={{ color: 'var(--text-secondary)' }}>Wait for the photographer to snap your picture! They will appear here instantly.</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
          gap: '12px',
          alignItems: 'start' // Important for masonry-ish feel
        }}>
          {images.map((img) => (
            <div key={img.id} style={{
              borderRadius: '16px',
              overflow: 'hidden',
              backgroundColor: 'rgba(0,0,0,0.2)',
              position: 'relative',
              aspectRatio: '3/4'
            }}>
              <img 
                src={img.proxy_blob_url} 
                alt="Matched photo" 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                loading="lazy"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
