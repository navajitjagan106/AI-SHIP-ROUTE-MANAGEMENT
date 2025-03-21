from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import requests
from pymongo import MongoClient

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React frontend
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
)

# MongoDB Connection
client = MongoClient("mongodb://localhost:27017/")
db = client.ship_routing
routes_collection = db.routes

NOAA_API_URL = "https://api.weather.gov/gridpoints/MPX/116,72/forecast"

@app.get("/")
def home():
    return {"message": "Ship Route Optimization API is running"}

# Other routes remain unchanged...


# Fetch Weather Data
@app.get("/weather")
def get_weather():
    response = requests.get(NOAA_API_URL)
    if response.status_code == 200:
        return response.json()
    return {"error": "Failed to fetch weather data"}

# Fetch Ship Traffic Data (Placeholder for AIS API)
@app.get("/ship/{ship_id}")
def get_ship(ship_id: int):
    """
    Fetches ship data from an AIS API (simulated here).
    Replace with actual AIS API integration if available.
    """
    # Simulating ship data (replace with actual API call)
    ship_data = {
        "id": ship_id,
        "latitude": 37.7749,  # Example: San Francisco
        "longitude": -122.4194,
        "status": "moving"
    }

    # Ensure valid data is returned
    if "latitude" not in ship_data or "longitude" not in ship_data:
        raise HTTPException(status_code=404, detail="Ship location not found")

    return ship_data

# Store Optimized Route
@app.post("/save-route")
def save_route(route_data: dict):
    routes_collection.insert_one(route_data)
    return {"message": "Route saved successfully"}

# Get All Saved Routes
@app.get("/routes")
def get_routes():
    return list(routes_collection.find({}, {"_id": 0}))
