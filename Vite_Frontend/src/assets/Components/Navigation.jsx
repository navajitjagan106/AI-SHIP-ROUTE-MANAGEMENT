import React, { useEffect } from "react";
import { MapContainer, TileLayer, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import axios from "axios";

const AIS_API_URL = "https://services.marinetraffic.com/api/exportvessels/v:5/YOUR_API_KEY";
const OPENWEATHER_API_KEY = "7241d7ea06b7b4aa3ac2d86e95f8b652";

const MarineMap = () => {
  useEffect(() => {
    const map = L.map("map").setView([20, 80], 3);

    // 📍 Base Marine Navigation Chart (Like ECDIS)
    L.tileLayer("https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png").addTo(map);
    
    // 📍 NOAA Nautical Chart
    L.tileLayer("https://tileservice.charts.noaa.gov/tiles/50000_1/{z}/{x}/{y}.png").addTo(map);

    // 🌍 Weather Layers (OpenWeatherMap)
    const windLayer = L.tileLayer(
      `https://tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png?appid=${OPENWEATHER_API_KEY}`,
      { opacity: 0.6 }
    );
    const tempLayer = L.tileLayer(
      `https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=${OPENWEATHER_API_KEY}`,
      { opacity: 0.5 }
    );
    const pressureLayer = L.tileLayer(
      `https://tile.openweathermap.org/map/pressure_new/{z}/{x}/{y}.png?appid=${OPENWEATHER_API_KEY}`,
      { opacity: 0.5 }
    );

    // 🔄 Layer Control for Weather
    L.control.layers({}, { "Wind Layer": windLayer, "Temperature Layer": tempLayer, "Pressure Layer": pressureLayer }).addTo(map);

    // 🚢 Fetch AIS Data (Real-time Ship Tracking)
    async function fetchAISData() {
      try {
        const { data } = await axios.get(AIS_API_URL);
        data.forEach((ship) => {
          const { LAT, LON, SHIPNAME, SPEED, HEADING } = ship;

          L.marker([LAT, LON], {
            icon: L.divIcon({
              className: "custom-ship-icon",
              html: `🚢`,
              iconSize: [20, 20],
            }),
          })
            .bindPopup(`<b>Ship:</b> ${SHIPNAME}<br>⚓ Speed: ${SPEED} knots<br>➡️ Heading: ${HEADING}°`)
            .addTo(map);
        });
      } catch (error) {
        console.error("Error fetching AIS data:", error);
      }
    }

    fetchAISData();

    // 🌤️ Click on the map to get weather details
    map.on("click", async (e) => {
      const { lat, lng } = e.latlng;
      const weatherURL = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${OPENWEATHER_API_KEY}&units=metric`;

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
          .openOn(map);
      } catch (error) {
        console.error("Error fetching weather data:", error);
      }
    });

    return () => map.remove();
  }, []);

  return <div id="map" style={{ height: "90vh", width: "100%" }}></div>;
};

export default MarineMap;
