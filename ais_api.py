from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import random
import asyncio
import os

app = FastAPI()

# ✅ Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Allow frontend access
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Load AIS Data (with error handling)
ais_file = "ais_data.csv"

if not os.path.exists(ais_file):
    raise FileNotFoundError(f"Error: File '{ais_file}' not found!")

ais_data = pd.read_csv(ais_file)

# ✅ Fix missing data
for col in ais_data.select_dtypes(include=["object"]).columns:
    ais_data[col].fillna("Unknown", inplace=True)

for col in ais_data.select_dtypes(include=["number"]).columns:
    ais_data[col].fillna(0, inplace=True)

# ✅ Store live ship positions globally
ship_positions = {}

# ✅ Generate random coordinates for ships
def generate_initial_coordinates():
    return {
        "latitude": round(random.uniform(-80, 80), 6),
        "longitude": round(random.uniform(-180, 180), 6)
    }

# ✅ Initialize ships with random coordinates
for mmsi in ais_data["mmsi"]:
    ship_positions[mmsi] = generate_initial_coordinates()

# ✅ Function to update ship positions dynamically
async def update_ship_positions():
    while True:
        for mmsi in ship_positions:
            if mmsi not in ais_data["mmsi"].values:
                continue

            ship_data = ais_data[ais_data["mmsi"] == mmsi]
            sog = pd.to_numeric(ship_data["sog"].values[0], errors="coerce")
            cog = pd.to_numeric(ship_data["cog"].values[0], errors="coerce")

            sog = sog if not pd.isna(sog) else 0
            cog = cog if not pd.isna(cog) else 0

            # ✅ Simulate movement using speed
            lat_change = (sog * 0.0001) * random.uniform(-1, 1)
            lon_change = (sog * 0.0001) * random.uniform(-1, 1)

            ship_positions[mmsi]["latitude"] += lat_change
            ship_positions[mmsi]["longitude"] += lon_change

        await asyncio.sleep(5)  # ✅ Non-blocking sleep

# ✅ Start background task for updating ship positions
@app.on_event("startup")
async def start_background_task():
    asyncio.create_task(update_ship_positions())

# ✅ Route to get all ships' data (limited to 10 ships)
@app.get("/ship-traffic")
def get_ship_traffic():
    ships = []

    for i, mmsi in enumerate(ship_positions):
        if i >= 10:  # 🚀 Fetch only 10 ships
            break

        new_position = ship_positions[mmsi]
        ship_info = ais_data[ais_data["mmsi"] == mmsi]

        if not ship_info.empty:
            ship = ship_info.iloc[0].to_dict()
            ship["latitude"] = new_position["latitude"]
            ship["longitude"] = new_position["longitude"]
            ships.append(ship)

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
    return {"message": "AIS Ship Tracking API is running with real-time movement"}
