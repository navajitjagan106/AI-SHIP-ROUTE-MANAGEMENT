import React, { useState, useEffect, useMemo, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "../Styles/ShipMap.css";
import Navbar from "./Navbar";
import SP from "../Img/ship.png";

const API_BASE_URL = "http://127.0.0.1:8000";

const ShipMap = () => {
  const [ships, setShips] = useState([]); 
  const [error, setError] = useState(null); // ✅ Track API errors

  // ✅ Memoized ship icon to prevent unnecessary re-creation
  const shipIcon = useMemo(
    () =>
      new L.Icon({
        iconUrl: SP,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        popupAnchor: [0, -20],
      }),
    []
  );

  // ✅ Fetch ships data
  const fetchShips = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/ship-traffic`);
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

      const data = await response.json();
      if (data.ships && Array.isArray(data.ships)) {
        setShips(data.ships);
        setError(null); // Reset error if fetch succeeds
      } else {
        throw new Error("Invalid ship data format");
      }
    } catch (err) {
      setError("🚨 Error fetching ship data. Backend might not be running.");
      console.error(err);
    }
  }, []);

  // ✅ Fetch data every 5 seconds, cleanup on unmount
  useEffect(() => {
    fetchShips();
    const interval = setInterval(fetchShips, 5000);
    return () => clearInterval(interval);
  }, [fetchShips]);

  return (
    <div className="map-body">
      <Navbar />
      <div className="map-title">
        <h1>NeoECDIS</h1>
      </div>

      {/* ✅ Show error message if API fails */}
      {error && <div className="error">{error}</div>}

      <div className="map-container">
        <MapContainer
          center={[20.0, 70.0]}
          zoom={5}
          className="map"
          worldCopyJump={true}
          minZoom={3}
          maxBounds={[[-85, -180], [85, 180]]}
          maxBoundsViscosity={1.0}
        >
          <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" noWrap={true} />

          {ships.map((ship) => {
            const lat = parseFloat(ship.latitude);
            const lon = parseFloat(ship.longitude);
            if (!isNaN(lat) && !isNaN(lon)) {
              return (
                <Marker key={ship.mmsi} position={[lat, lon]} icon={shipIcon}>
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
    </div>
  );
};

export default ShipMap;
