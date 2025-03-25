import React, { useEffect } from "react";
import { MapContainer, TileLayer, useMapEvents, LayersControl,ZoomControl } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import axios from "axios";
import "../Styles/Weather.css"
import Navbar from "./Navbar";
const WeatherMap = () => {
  const API_KEY = "7241d7ea06b7b4aa3ac2d86e95f8b652"; // Replace with your API key

  const handleMapClick = async (e) => {
    const { lat, lng } = e.latlng;
    const weatherURL = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${API_KEY}&units=metric`;

    try {
      const { data } = await axios.get(weatherURL);
      const { wind, main, weather } = data;

      L.popup()
        .setLatLng([lat, lng])
        .setContent(
          `<b>Weather Info:</b><br>
           🌡️ Temperature: ${main.temp}°C<br>
           🌬️ Wind Speed: ${wind.speed} m/s<br>
           💨 Pressure: ${main.pressure} hPa<br>
           🌩️ Condition: ${weather[0].description}`
        )
        .openOn(e.target);
    } catch (error) {
      console.error("Error fetching weather data:", error);
    }
  };

  function MapClickHandler() {
    useMapEvents({ click: handleMapClick });
    return null;
  }

  return (
    <div>
      <Navbar />
      <div className="Weather-map">
        <h1 style={{color:"#004080"}}>Weather Status</h1>
        <MapContainer center={[20, 80]} zoom={3} style={{ height: "70vh", width: "80vw" }} worldCopyJump={true}
          minZoom={3}
          maxBounds={[[-85, -180], [85, 180]]}
          zoomControl={false}
          maxBoundsViscosity={1.0}>
        <LayersControl position="topright">
        {/* Base Map */}
        <LayersControl.BaseLayer checked name="Default Map">
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"  noWrap={true}/>
        </LayersControl.BaseLayer>

        {/* Weather Overlays */}
        <LayersControl.Overlay name="Wind Layer">
          <TileLayer
            url={`https://tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png?appid=${API_KEY}`}
            opacity={0.6}
            noWrap={true}
          />
        </LayersControl.Overlay>

        <LayersControl.Overlay name="Temperature Layer">
          <TileLayer
            url={`https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=${API_KEY}`}
            opacity={0.5}
            noWrap={true}
          />
        </LayersControl.Overlay>

        <LayersControl.Overlay name="Pressure Layer">
          <TileLayer
            url={`https://tile.openweathermap.org/map/pressure_new/{z}/{x}/{y}.png?appid=${API_KEY}`}
            opacity={0.5}
            noWrap={true}
          />
        </LayersControl.Overlay>
      </LayersControl>

      <MapClickHandler />
      <ZoomControl position="bottomright" />
    </MapContainer>
    </div>
    </div>
  );
};

export default WeatherMap;
