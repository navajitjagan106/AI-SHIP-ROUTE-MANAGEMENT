import React, { useEffect } from "react";
import { MapContainer, TileLayer, useMapEvents, LayersControl } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import axios from "axios";

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
    <MapContainer center={[20, 80]} zoom={3} style={{ height: "90vh", width: "100%" }}>
      <LayersControl position="topright">
        {/* Base Map */}
        <LayersControl.BaseLayer checked name="Default Map">
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        </LayersControl.BaseLayer>

        {/* Weather Overlays */}
        <LayersControl.Overlay name="Wind Layer">
          <TileLayer
            url={`https://tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png?appid=${API_KEY}`}
            opacity={0.6}
          />
        </LayersControl.Overlay>

        <LayersControl.Overlay name="Temperature Layer">
          <TileLayer
            url={`https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=${API_KEY}`}
            opacity={0.5}
          />
        </LayersControl.Overlay>

        <LayersControl.Overlay name="Pressure Layer">
          <TileLayer
            url={`https://tile.openweathermap.org/map/pressure_new/{z}/{x}/{y}.png?appid=${API_KEY}`}
            opacity={0.5}
          />
        </LayersControl.Overlay>
      </LayersControl>

      <MapClickHandler />
    </MapContainer>
  );
};

export default WeatherMap;
