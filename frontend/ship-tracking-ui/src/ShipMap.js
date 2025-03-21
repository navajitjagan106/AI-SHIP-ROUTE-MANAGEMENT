import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "./Shipmap.css";

const shipIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/149/149059.png",
  iconSize: [35, 35],
});

const ShipMap = () => {
  const [shipLocation, setShipLocation] = useState([20.0, 70.0]); // Default location
  const [darkMode, setDarkMode] = useState(false);

  // Fetch ship location from backend API
  useEffect(() => {
    const fetchShipData = async () => {
      try {
        const response = await fetch("http://127.0.0.1:8000/ship/219019621");
        const data = await response.json();
        console.log("Ship Data:", data); // Debugging

        // Ensure valid latitude and longitude before setting state
        if (data.latitude !== undefined && data.longitude !== undefined) {
          setShipLocation([data.latitude, data.longitude]);
        } else {
          console.error("Invalid ship location data:", data);
        }
      } catch (error) {
        console.error("Error fetching ship data:", error);
      }
    };

    fetchShipData();
    const interval = setInterval(fetchShipData, 5000); // Fetch every 5 sec

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`map-container ${darkMode ? "dark-mode" : ""}`}>
      <h1>Live Ship Tracking</h1>
      <label className="switch">
        <input type="checkbox" onChange={() => setDarkMode(!darkMode)} />
        <span className="slider"></span>
        Dark Mode
      </label>

      <MapContainer center={shipLocation} zoom={5} className="map">
        <TileLayer
          url={
            darkMode
              ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          }
        />
        {shipLocation[0] && shipLocation[1] ? ( // Prevent invalid LatLng error
          <Marker position={shipLocation} icon={shipIcon}>
            <Popup>Ship is currently at {shipLocation[0]}, {shipLocation[1]}</Popup>
          </Marker>
        ) : (
          <p>Loading ship data...</p>
        )}
      </MapContainer>
    </div>
  );
};

export default ShipMap;
