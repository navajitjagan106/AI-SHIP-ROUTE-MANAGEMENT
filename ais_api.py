from fastapi import FastAPI, APIRouter, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import random
import asyncio
import os
import math
import numpy as np

# ✅ Create FastAPI App
app = FastAPI()

# ✅ Add CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins (change this for security)
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
)

router = APIRouter()

# ✅ Load AIS Data from `trip9.csv`
csv_file = "final_ship_routes.csv"

if not os.path.exists(csv_file):
    raise FileNotFoundError(f"🚨 Error: CSV file '{csv_file}' not found!")

ais_data = pd.read_csv(csv_file)

# ✅ Column Mapping Based on Your CSV File
column_mapping = {
    "MMSI": "MMSI",
    "LAT": "lat",
    "LON": "lon",
    "SOG": "sog",
    "COG": "cog",
    "Status": "status"
}
ais_data.rename(columns=column_mapping, inplace=True)

# ✅ Add Missing Columns
ais_data["cog"] = ais_data.get("cog", np.random.uniform(0, 360, len(ais_data)))
ais_data["status"] = ais_data.get("status", "Unknown")

# ✅ Ensure Required Columns Exist
required_columns = {"MMSI", "lat", "lon", "sog", "cog", "status"}
missing_columns = required_columns - set(ais_data.columns)

if missing_columns:
    raise ValueError(f"🚨 CSV file is missing required columns: {missing_columns}")

# ✅ Fix NaN Values & Invalid Data
ais_data.fillna({
    "sog": 0.0,
    "cog": random.uniform(0, 360),  # Assign a random course if missing
    "status": "Unknown",
    "lat": 0.0,
    "lon": 0.0
}, inplace=True)

# Convert all numeric columns to `float`
for col in ["sog", "cog", "lat", "lon"]:
    ais_data[col] = pd.to_numeric(ais_data[col], errors="coerce").fillna(0.0)

# ✅ Select 10 Unique Ships
num_ships = min(500, len(ais_data["MMSI"].unique()))
selected_ships = ais_data["MMSI"].drop_duplicates().sample(n=num_ships, random_state=42).tolist()

# ✅ Store 10 ship positions globally
ship_positions = {}

# ✅ Function to Check if a Ship is in Water
def is_ocean(lat, lon):
    """Ensures ships stay on water and not land."""
    if abs(lat) > 60:  # Arctic/Antarctic (Land)
        return False
    if (-20 < lat < 30 and -20 < lon < 50):  # Africa (Land)
        return False
    if (30 < lat < 60 and -130 < lon < -60):  # USA/Canada (Land)
        return False
    return True

# ✅ Initialize 10 Ships at Dataset Positions
for _, row in ais_data[ais_data["MMSI"].isin(selected_ships)].iterrows():
    lat, lon = row["lat"], row["lon"]

    # Ensure ship starts in water
    if not is_ocean(lat, lon):
        lat += 0.5
        lon += 0.5

    # Assign a random speed if missing
    sog = row["sog"]
    if sog == 0:
        sog = random.uniform(5, 15)

    ship_positions[row["MMSI"]] = {
        "latitude": lat,
        "longitude": lon,
        "sog": sog,
        "cog": row["cog"],
        "status": row["status"]
    }

# ✅ Function to Move Ships
def move_ship(mmsi):
    """Moves a ship based on its SOG (speed) and COG (direction)."""
    ship = ship_positions[mmsi]
    old_lat, old_lon = ship["latitude"], ship["longitude"]
    
    sog = ship["sog"]
    cog = ship["cog"]

    if sog == 0:
        return  # Do not move if speed is 0

    distance = sog * 0.0002  # Adjust speed for visualization
    angle = math.radians(cog)

    lat_change = distance * math.cos(angle)
    lon_change = distance * math.sin(angle)

    new_lat = old_lat + lat_change
    new_lon = old_lon + lon_change

    # Ensure ship stays in the ocean
    if is_ocean(new_lat, new_lon):
        ship_positions[mmsi]["latitude"] = new_lat
        ship_positions[mmsi]["longitude"] = new_lon
    else:
        ship_positions[mmsi]["cog"] += random.uniform(-10, 10)  # Change direction

# ✅ Background Task: Move Ships
async def update_ship_positions():
    """Continuously updates ship positions every 3 seconds."""
    while True:
        for mmsi in ship_positions:
            move_ship(mmsi)
        await asyncio.sleep(3)

# ✅ API Endpoint: Get 10 Ships' Positions
@router.get("/ship-traffic")
def get_ship_traffic():
    """Returns real-time positions of 10 ships."""
    ships = []
    for mmsi, ship in ship_positions.items():
        ships.append({
            "MMSI": mmsi,
            "latitude": float(ship["latitude"]),
            "longitude": float(ship["longitude"]),
            "sog": float(ship["sog"]),
            "cog": float(ship["cog"]),
            "status": ship["status"]
        })

    return {"ships": ships}

# ✅ API Endpoint: Get a Specific Ship's Position
@router.get("/ship/{mmsi}")
def get_ship_by_mmsi(mmsi: str):
    """Returns real-time position of a specific ship."""
    try:
        mmsi = int(mmsi)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid MMSI format")

    if mmsi not in ship_positions:
        raise HTTPException(status_code=404, detail="Ship not found")

    ship = ship_positions[mmsi]
    return {
        "MMSI": mmsi,
        "latitude": ship["latitude"],
        "longitude": ship["longitude"],
        "sog": ship["sog"],
        "cog": ship["cog"],
        "status": ship["status"]
    }

# ✅ Include Router in the App
app.include_router(router)

# ✅ Start Background Task
@app.on_event("startup")
async def start_moving_ships():
    asyncio.create_task(update_ship_positions())
