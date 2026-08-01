import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Camera, ArrowRight, Loader2, ImagePlus } from 'lucide-react';
import { API_BASE_URL } from '../config/api';

export default function JoinScreen() {
  const { inviteCode } = useParams<{ inviteCode: string }>();
  const navigate = useNavigate();

  const [trip, setTrip] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchTrip = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/trips/join/${inviteCode}`);
        if (!res.ok) {
          throw new Error('Trip not found or invalid invite code.');
        }
        const data = await res.json();
        if (!data.is_active) {
          throw new Error('This trip has ended and is no longer accepting new guests.');
        }
        setTrip(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchTrip();
  }, [inviteCode]);

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !photo || !trip) return;

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('phone_number', phone);
      formData.append('gallery_preference', 'all');
      formData.append('selfie', photo);

      const res = await fetch(`${API_BASE_URL}/api/v1/trips/${trip.id}/register`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || 'Registration failed');
      }

      const data = await res.json();
      // Redirect to gallery
      navigate(`/trip/${trip.id}/gallery/${data.id}`);
    } catch (err: any) {
      alert('Error: ' + err.message);
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: '16px' }}>
        <Loader2 className="animate-pulse" size={48} color="var(--primary)" />
        <p style={{ color: 'var(--text-secondary)' }}>Loading trip details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', padding: '24px', textAlign: 'center' }}>
        <div className="glass-panel" style={{ padding: '32px', maxWidth: '400px', width: '100%' }}>
          <h2 style={{ color: 'var(--error)', marginBottom: '16px' }}>Oops!</h2>
          <p style={{ color: 'var(--text-secondary)' }}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ padding: '24px', maxWidth: '480px', margin: '0 auto', paddingTop: '48px' }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '8px' }}>You're Invited!</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Join the event to get your personalized photos in real-time.</p>
      </div>

      <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Photo Capture Section */}
        <div 
          onClick={() => fileInputRef.current?.click()}
          style={{ 
            height: '160px', 
            borderRadius: '16px', 
            border: '2px dashed var(--glass-border)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flexDirection: 'column',
            gap: '12px',
            cursor: 'pointer',
            backgroundColor: 'rgba(0,0,0,0.2)',
            overflow: 'hidden',
            position: 'relative'
          }}
        >
          {photoPreview ? (
            <img src={photoPreview} alt="Selfie" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <>
              <div style={{ padding: '16px', backgroundColor: 'var(--primary)', borderRadius: '50%', color: '#000' }}>
                <Camera size={32} />
              </div>
              <span style={{ color: 'var(--primary)', fontWeight: '600' }}>Take a Selfie</span>
              <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Used to find your photos</span>
            </>
          )}
          
          <input 
            type="file" 
            accept="image/*" 
            capture="user" 
            ref={fileInputRef}
            onChange={handlePhotoCapture}
            style={{ display: 'none' }} 
            required
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '14px' }}>Full Name</label>
          <input 
            type="text" 
            className="input-field" 
            placeholder="John Doe" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '14px' }}>Phone Number</label>
          <input 
            type="tel" 
            className="input-field" 
            placeholder="+1 234 567 8900" 
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
        </div>

        <button type="submit" className="btn-primary" disabled={submitting || !name || !phone || !photo} style={{ marginTop: '8px' }}>
          {submitting ? 'Registering...' : 'Join Trip'}
          {!submitting && <ArrowRight size={20} />}
        </button>
      </form>
    </div>
  );
}
