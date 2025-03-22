from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import random
import time
import threading

app = FastAPI()

# ✅ Enable CORS for frontend connection
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Load AIS Data
ais_file = "ais_data.csv"
ais_data = pd.read_csv(ais_file)

# ✅ Convert MMSI to string
ais_data["mmsi"] = ais_data["mmsi"].astype(str)
ais_data.fillna("Unknown", inplace=True)  # Fill NaN values

# ✅ Store live ship positions globally
ship_positions = {}

# ✅ Function to generate initial random coordinates
def generate_initial_coordinates():
    return {
        "latitude": round(random.uniform(-80, 80), 6),
        "longitude": round(random.uniform(-180, 180), 6)
    }

# ✅ Initialize ships with random coordinates
for mmsi in ais_data["mmsi"]:
    ship_positions[mmsi] = generate_initial_coordinates()

# ✅ Function to update ship positions dynamically
def update_ship_positions():
    while True:
        for mmsi in ship_positions:
            ship_data = ais_data[ais_data["mmsi"] == mmsi]

            if ship_data.empty:
                continue

            sog = pd.to_numeric(ship_data["sog"].values[0], errors="coerce")
            cog = pd.to_numeric(ship_data["cog"].values[0], errors="coerce")

            # Ensure valid values
            sog = sog if not pd.isna(sog) else 0
            cog = cog if not pd.isna(cog) else 0

            # ✅ Update coordinates based on speed and course
            lat_change = (sog * 0.0001) * random.uniform(-1, 1)
            lon_change = (sog * 0.0001) * random.uniform(-1, 1)

            ship_positions[mmsi]["latitude"] += lat_change
            ship_positions[mmsi]["longitude"] += lon_change

        time.sleep(5)  # Update every 5 seconds

# ✅ Start background thread for live updates
threading.Thread(target=update_ship_positions, daemon=True).start()

# ✅ Route to get all ships' data with filters
@app.get("/ship-traffic")
def get_ship_traffic(
    ship_type: str = Query(None, description="Filter by ship type (e.g., Cargo, Fishing)"),
    min_speed: float = Query(0, description="Minimum speed in knots"),
    max_speed: float = Query(100, description="Maximum speed in knots"),
    status: str = Query(None, description="Filter by navigational status (e.g., Underway, Moored)"),
    min_lat: float = Query(None, description="Minimum latitude"),
    max_lat: float = Query(None, description="Maximum latitude"),
    min_lon: float = Query(None, description="Minimum longitude"),
    max_lon: float = Query(None, description="Maximum longitude")
):
    filtered_data = ais_data.copy()

    # Convert "sog" column to numeric and replace "Unknown" with 0
    filtered_data["sog"] = pd.to_numeric(filtered_data["sog"], errors="coerce").fillna(0)

    # Apply ship type filter
    if ship_type:
        filtered_data = filtered_data[filtered_data["shiptype"].str.lower() == ship_type.lower()]

    # Apply speed filters
    filtered_data = filtered_data[(filtered_data["sog"] >= min_speed) & 
                                  (filtered_data["sog"] <= max_speed)]

    # Apply navigational status filter
    if status:
        filtered_data = filtered_data[filtered_data["navigationalstatus"].str.lower() == status.lower()]

    # Convert to dictionary and add live coordinates
    ships = filtered_data.to_dict(orient="records")
    for ship in ships:
        mmsi = ship["mmsi"]
        if mmsi in ship_positions:
            ship["latitude"] = ship_positions[mmsi]["latitude"]
            ship["longitude"] = ship_positions[mmsi]["longitude"]

    # Apply location filters
    if min_lat is not None:
        ships = [ship for ship in ships if ship["latitude"] >= min_lat]
    if max_lat is not None:
        ships = [ship for ship in ships if ship["latitude"] <= max_lat]
    if min_lon is not None:
        ships = [ship for ship in ships if ship["longitude"] >= min_lon]
    if max_lon is not None:
        ships = [ship for ship in ships if ship["longitude"] <= max_lon]

    return {"ships": ships}

# ✅ Route to get a specific ship's location by MMSI
@app.get("/ship/{mmsi}")
def get_ship_by_mmsi(mmsi: str):
    if mmsi not in ship_positions:
        raise HTTPException(status_code=404, detail="Ship not found")

    ship_info = ais_data[ais_data["mmsi"] == mmsi]
    if ship_info.empty:
        raise HTTPException(status_code=404, detail="Ship data not found")

    ship_data = ship_info.iloc[0].to_dict()
    ship_data["latitude"] = ship_positions[mmsi]["latitude"]
    ship_data["longitude"] = ship_positions[mmsi]["longitude"]

    return ship_data

# ✅ Home route
@app.get("/")
def home():
    return {"message": "AIS Ship Tracking API is running with real-time movement & location filters"}
