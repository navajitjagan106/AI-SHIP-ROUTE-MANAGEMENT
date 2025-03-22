import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "./Shipmap.css"; // Import CSS for styling

// 🚢 Custom ship icon
const shipIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/252/252025.png",
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20],
});

// API Base URL
const API_BASE_URL = "http://127.0.0.1:8000";

const ShipMap = () => {
  const [ships, setShips] = useState([]); // Store ship data
  const [selectedShip, setSelectedShip] = useState(null); // Selected ship details
  const [darkMode, setDarkMode] = useState(false); // Dark mode toggle

  // ✅ Fetch ship data from backend API
  useEffect(() => {
    const fetchShips = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/ship-traffic`);
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("Fetched Ships:", data);

        if (data.ships && Array.isArray(data.ships)) {
          setShips(data.ships);
        } else {
          console.error("Invalid ship data format:", data);
        }
      } catch (error) {
        console.error("🚨 Error fetching ship data:", error);
        alert("🚨 Error fetching ship data! Backend might not be running.");
      }
    };

    fetchShips();
    const interval = setInterval(fetchShips, 5000); // ✅ Fetch every 5 sec

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`map-container ${darkMode ? "dark-mode" : ""}`}>
      <h1>Live Ship Tracking</h1>

      {/* Dark Mode Toggle */}
      <label className="switch">
        <input type="checkbox" onChange={() => setDarkMode(!darkMode)} />
        <span className="slider"></span> Dark Mode
      </label>

      {/* Ship List */}
      <div className="ship-list">
        <h2>Ships List</h2>
        <ul>
          {ships.map((ship) => (
            <li key={ship.mmsi} onClick={() => setSelectedShip(ship)}>
              {ship.name || "Unknown Ship"} (MMSI: {ship.mmsi})
            </li>
          ))}
        </ul>
      </div>

      {/* Map Component */}
      <MapContainer center={[20.0, 70.0]} zoom={5} className="map">
        <TileLayer
          url={
            darkMode
              ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          }
        />

        {ships.map((ship) => {
          const lat = parseFloat(ship.latitude);
          const lon = parseFloat(ship.longitude);

          if (!isNaN(lat) && !isNaN(lon)) {
            return (
              <Marker
                key={ship.mmsi}
                position={[lat, lon]}
                icon={shipIcon}
                eventHandlers={{ click: () => setSelectedShip(ship) }}
              >
                <Popup>
                  <strong>{ship.name || "Unknown Ship"}</strong>
                  <br />
                  MMSI: {ship.mmsi}
                  <br />
                  Speed: {ship.sog || "N/A"} knots
                  <br />
                  Course: {ship.cog || "N/A"}°
                  <br />
                  Status: {ship.navigationalstatus || "Unknown"}
                </Popup>
              </Marker>
            );
          }
          return null;
        })}
      </MapContainer>
    </div>
  );
};

export default ShipMap;
