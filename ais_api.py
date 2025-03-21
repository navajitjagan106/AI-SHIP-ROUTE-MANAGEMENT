from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import random
import time
import threading

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# Load AIS data
ais_file = "ais_data.csv"
ais_data = pd.read_csv(ais_file)

# Convert MMSI to string
ais_data["mmsi"] = ais_data["mmsi"].astype(str)

# Fill NaN values with defaults
ais_data = ais_data.fillna("Unknown")

# Store ship positions globally
ship_positions = {}

# Function to generate initial random coordinates
def generate_initial_coordinates():
    return {
        "latitude": round(random.uniform(-80, 80), 6),
        "longitude": round(random.uniform(-180, 180), 6)
    }

# Initialize all ships with random coordinates
for mmsi in ais_data["mmsi"]:
    ship_positions[mmsi] = generate_initial_coordinates()

# Function to update all ships' positions continuously
def update_ship_positions():
    while True:
        for mmsi in ship_positions:
            ship_data = ais_data[ais_data["mmsi"] == mmsi]

            if ship_data.empty:
                continue

            sog = pd.to_numeric(ship_data["sog"].values[0], errors="coerce")
            cog = pd.to_numeric(ship_data["cog"].values[0], errors="coerce")

            # Ensure valid numbers (replace NaN with 0)
            sog = sog if not pd.isna(sog) else 0
            cog = cog if not pd.isna(cog) else 0

            # Update coordinates based on speed and course
            lat_change = (sog * 0.0001) * random.uniform(-1, 1)
            lon_change = (sog * 0.0001) * random.uniform(-1, 1)

            ship_positions[mmsi]["latitude"] += lat_change
            ship_positions[mmsi]["longitude"] += lon_change

        time.sleep(5)  # Update every 5 seconds

# Start background thread for continuous movement
threading.Thread(target=update_ship_positions, daemon=True).start()

# Function to update a single ship's position dynamically
def update_ship_position(mmsi):
    """Ensure ship moves every time it is requested."""
    if mmsi not in ship_positions:
        ship_positions[mmsi] = generate_initial_coordinates()

    sog = pd.to_numeric(ais_data.loc[ais_data["mmsi"] == mmsi, "sog"].values[0], errors="coerce")
    cog = pd.to_numeric(ais_data.loc[ais_data["mmsi"] == mmsi, "cog"].values[0], errors="coerce")

    # Ensure valid numbers
    sog = sog if not pd.isna(sog) else 0
    cog = cog if not pd.isna(cog) else 0

    # Simulate movement using speed (`sog`) and direction (`cog`)
    lat_change = (sog * 0.0001) * random.uniform(-1, 1)
    lon_change = (sog * 0.0001) * random.uniform(-1, 1)

    # Update stored position
    ship_positions[mmsi]["latitude"] += lat_change
    ship_positions[mmsi]["longitude"] += lon_change

    return ship_positions[mmsi]

@app.get("/")
def home():
    return {"message": "AIS Ship Tracking API is running with real-time movement & location filters"}

# Fetch all ship data with filters, including location
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

# Fetch ship by MMSI (real-time lat/lon movement per request)
@app.get("/ship/{mmsi}")
def get_ship_by_mmsi(mmsi: str):
    ship_info = ais_data[ais_data["mmsi"] == mmsi]

    if ship_info.empty:
        raise HTTPException(status_code=404, detail="Ship not found")

    ship_data = ship_info.to_dict(orient="records")[0]

    # Update ship's position dynamically every API request
    new_position = update_ship_position(mmsi)

    if new_position:
        ship_data["latitude"] = new_position["latitude"]
        ship_data["longitude"] = new_position["longitude"]

    return ship_data
