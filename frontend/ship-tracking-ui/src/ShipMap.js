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
  const [ships, setShips] = useState([]); // List of ships
  const [selectedShip, setSelectedShip] = useState(null); // Selected ship details
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const fetchShips = async () => {
      try {
        const response = await fetch("http://127.0.0.1:8000/ship-traffic"); // ✅ Fixed endpoint
        const data = await response.json();
        console.log("Fetched Ships:", data);

        if (data.ships && Array.isArray(data.ships)) {
          setShips(data.ships);
        } else {
          console.error("Invalid ship data format:", data);
        }
      } catch (error) {
        console.error("Error fetching ship data:", error);
      }
    };

    fetchShips();
    const interval = setInterval(fetchShips, 5000); // Fetch every 5 sec

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

      <MapContainer center={[20.0, 70.0]} zoom={5} className="map">
        <TileLayer
          url={
            darkMode
              ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          }
        />

        {ships.map((ship) =>
          ship.latitude !== undefined && ship.longitude !== undefined ? (
            <Marker
              key={ship.mmsi}
              position={[ship.latitude, ship.longitude]}
              icon={shipIcon}
              eventHandlers={{
                click: () => setSelectedShip(ship),
              }}
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
          ) : null
        )}
      </MapContainer>

      {selectedShip && (
        <div className="ship-details">
          <h2>Ship Details</h2>
          <p><strong>Name:</strong> {selectedShip.name || "Unknown"}</p>
          <p><strong>MMSI:</strong> {selectedShip.mmsi}</p>
          <p><strong>Latitude:</strong> {selectedShip.latitude}</p>
          <p><strong>Longitude:</strong> {selectedShip.longitude}</p>
          <p><strong>Speed:</strong> {selectedShip.sog || "N/A"} knots</p>
          <p><strong>Course:</strong> {selectedShip.cog || "N/A"}°</p>
          <p><strong>Status:</strong> {selectedShip.navigationalstatus || "Unknown"}</p>
          <button onClick={() => setSelectedShip(null)}>Close</button>
        </div>
      )}
    </div>
  );
};

export default ShipMap;
