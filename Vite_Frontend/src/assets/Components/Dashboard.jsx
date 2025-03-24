import React from 'react';
import Navbar from './Navbar';
import { MapContainer, TileLayer, Marker, Popup,ZoomControl } from 'react-leaflet';
import '../Styles/Dashboard.css'; // Importing the CSS file

const Dashboard = () => {
  return (
    <div className='dashboard-body'>
      <Navbar />
      <div className="dashboard-container">
        
        {/* Map Panel */}
        <div className="map-panel">
          <h2>Interactive Map</h2>
          <MapContainer center={[20.5937, 78.9629]} zoom={5} zoomControl={false} className="map-content">
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={[20.5937, 78.9629]}>
              <Popup>📍 Default Location (India)</Popup>
            </Marker>
            <ZoomControl position="bottomright" />
          </MapContainer>
        </div>

        {/* Notifications Panel */}
        <div className="notifications-panel">
          <h2>Live Notifications</h2>
          <ul>
            <li>🚀 System initialized successfully</li>
            <li>📍 New location update received</li>
            <li>⚠️ Alert: High traffic detected</li>
            <li>✅ Route optimization completed</li>
          </ul>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
