import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "../Styles/ShipMap.css";
import Navbar from "./Navbar";


const shipIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/252/252025.png",
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20],
});

const API_BASE_URL = "http://127.0.0.1:8000";

const ShipMap = () => {
  const [ships, setShips] = useState([]); 
  const [selectedShip, setSelectedShip] = useState(null); 


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
        // alert("🚨 Error fetching ship data! Backend might not be running.");
      }
    };

    fetchShips();
    const interval = setInterval(fetchShips, 5000); // ✅ Fetch every 5 sec

    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <Navbar />
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
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          noWrap={true}
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
    </div>
  );
};

export default ShipMap;
