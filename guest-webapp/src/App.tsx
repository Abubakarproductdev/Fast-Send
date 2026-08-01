import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import JoinScreen from './screens/JoinScreen';
import GalleryScreen from './screens/GalleryScreen';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/join/:inviteCode" element={<JoinScreen />} />
        <Route path="/trip/:tripId/gallery/:attendeeId" element={<GalleryScreen />} />
        
        {/* Fallback route */}
        <Route path="*" element={
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
            <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>FastSend</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Please scan a QR code to join a trip.</p>
          </div>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
