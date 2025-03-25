import React, { useState } from "react";
import { MapContainer, TileLayer, Marker, Polyline,ZoomControl } from "react-leaflet";
import axios from "axios";
import L from "leaflet";
import "../Styles/Routes.css";
import SP from "../Img/ship.png";
import Navbar from "./Navbar";

const shipIcon = new L.Icon({
  iconUrl: SP,
  iconSize: [40, 40],
});

const portLocations = {
  "Port A": [33.7405, -118.2519],
  "Port B": [40.6728, -74.1536],
  "Port C": [29.7305, -95.0892],
  "Port D": [25.7785, -80.1826],
  "Port E": [32.0835, -81.0998],
  "Port F": [47.6019, -122.3381],
};

const Routess = () => {
  const [shipId, setShipId] = useState("");
  const [startPort, setStartPort] = useState("");
  const [endPort, setEndPort] = useState("");
  const [route, setRoute] = useState([]);
  const [shipPosition, setShipPosition] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const getOptimizedRoute = async () => {
    setLoading(true);
    try {
      const response = await axios.post("http://127.0.0.1:8000/get_optimized_route/", {
        ship_id: shipId,
        start: startPort,
        end: endPort,
      });

      const optimizedRoute = response.data.optimized_route;
      if (optimizedRoute.length > 0) {
        setRoute(optimizedRoute);
        setShipPosition(optimizedRoute[0]);
        animateShip(optimizedRoute);
      }
    } catch (error) {
      console.error("Error fetching route:", error);
    }
    setLoading(false);
    setShowForm(false);
  };

  const animateShip = (optimizedRoute) => {
    let index = 0;
    const interval = setInterval(() => {
      if (index < optimizedRoute.length) {
        setShipPosition([...optimizedRoute[index]]);
        index++;
      } else {
        clearInterval(interval);
      }
    }, 2000);
  };

  return (
    <div>
      <Navbar />
      <div className="Route-Map">
        <h2 className="route-title">Ship Route Optimization & Simulation</h2>

        {/* Button to show the overlay form */}
        <button className="open-form-btn" onClick={() => setShowForm(true)}>Open Form</button>

        {/* Overlay Form */}
        {showForm && (
          <div className="overlay">
            <div className="form-container">
              <button className="close-form-btn" onClick={() => setShowForm(false)}>Close</button>
              <form className="route-form" onSubmit={(e) => { e.preventDefault(); getOptimizedRoute(); }}>
                <input
                  type="text"
                  className="route-input"
                  placeholder="Ship ID"
                  value={shipId}
                  onChange={(e) => setShipId(e.target.value)}
                  required
                />
                <select className="route-select" value={startPort} onChange={(e) => setStartPort(e.target.value)} required>
                  <option value="">Select Start Port</option>
                  {Object.keys(portLocations).map((port) => (
                    <option key={port} value={port}>{port}</option>
                  ))}
                </select>
                <select className="route-select" value={endPort} onChange={(e) => setEndPort(e.target.value)} required>
                  <option value="">Select End Port</option>
                  {Object.keys(portLocations).map((port) => (
                    <option key={port} value={port}>{port}</option>
                  ))}
                </select>
                <button type="submit" className="route-submit-btn" disabled={loading}>
                  {loading ? "Calculating..." : "Get Route"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Map */}
        <MapContainer center={[30, -95]} zoom={4} style={{ height: "80vh", width: "80vw" }} zoomControl={false}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {Object.entries(portLocations).map(([port, coords]) => (
            <Marker key={port} position={coords} />
          ))}
          {shipPosition && Array.isArray(shipPosition) && shipPosition.length === 2 && (
            <Marker position={shipPosition} icon={shipIcon} />
          )}
          {route.length > 1 && Array.isArray(route[0]) && (
            <Polyline positions={route} color="blue" />
          )}
          <ZoomControl position="bottomright" />
        </MapContainer>
        
      </div>
    </div>
  );
};

export default Routess;
