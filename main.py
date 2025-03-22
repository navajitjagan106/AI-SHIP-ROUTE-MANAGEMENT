from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import random
import time
import threading

app = FastAPI()

# ✅ Enable CORS for frontend
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

# ✅ Generate random coordinates
def generate_initial_coordinates():
    return {
        "latitude": round(random.uniform(-80, 80), 6),
        "longitude": round(random.uniform(-180, 180), 6)
    }

# ✅ Initialize ships with random coordinates
for mmsi in ais_data["mmsi"]:
    ship_positions[mmsi] = generate_initial_coordinates()

# ✅ Function to update a single ship's position dynamically
def update_ship_position(mmsi):
    if mmsi not in ship_positions:
        ship_positions[mmsi] = generate_initial_coordinates()

    sog = pd.to_numeric(ais_data.loc[ais_data["mmsi"] == mmsi, "sog"].values[0], errors="coerce")
    cog = pd.to_numeric(ais_data.loc[ais_data["mmsi"] == mmsi, "cog"].values[0], errors="coerce")

    # Ensure valid numbers
    sog = sog if not pd.isna(sog) else 0
    cog = cog if not pd.isna(cog) else 0

    # ✅ Simulate movement using speed and direction
    lat_change = (sog * 0.0001) * random.uniform(-1, 1)
    lon_change = (sog * 0.0001) * random.uniform(-1, 1)

    ship_positions[mmsi]["latitude"] += lat_change
    ship_positions[mmsi]["longitude"] += lon_change

    return ship_positions[mmsi]

# ✅ Route to get all ships' data (updates positions dynamically)
@app.get("/ship-traffic")
def get_ship_traffic():
    ships = []
    for mmsi in ship_positions:
        new_position = update_ship_position(mmsi)  # Update every request
        ship_info = ais_data[ais_data["mmsi"] == mmsi]
        
        if not ship_info.empty:
            ship = ship_info.iloc[0].to_dict()
            ship["latitude"] = new_position["latitude"]
            ship["longitude"] = new_position["longitude"]
            ships.append(ship)
    
    return {"ships": ships}

# ✅ Route to get a specific ship's location
@app.get("/ship/{mmsi}")
def get_ship_by_mmsi(mmsi: str):
    if mmsi not in ship_positions:
        raise HTTPException(status_code=404, detail="Ship not found")

    new_position = update_ship_position(mmsi)
    ship_info = ais_data[ais_data["mmsi"] == mmsi]

    if ship_info.empty:
        raise HTTPException(status_code=404, detail="Ship data not found")

    ship_data = ship_info.iloc[0].to_dict()
    ship_data["latitude"] = new_position["latitude"]
    ship_data["longitude"] = new_position["longitude"]

    return ship_data

# ✅ Home route
@app.get("/")
def home():
    return {"message": "AIS Ship Tracking API is running with real-time movement"}
