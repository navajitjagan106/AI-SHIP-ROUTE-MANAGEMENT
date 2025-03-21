from fastapi import FastAPI
import requests
from pymongo import MongoClient

app = FastAPI()

# MongoDB Connection
client = MongoClient("mongodb://localhost:27017/")
db = client.ship_routing
routes_collection = db.routes

# NOAA Weather API (Example)
NOAA_API_URL = "https://api.weather.gov/gridpoints/MPX/116,72/forecast"

@app.get("/")
def home():
    return {"message": "Ship Route Optimization API is running"}

# Fetch Weather Data
@app.get("/weather")
def get_weather():
    response = requests.get(NOAA_API_URL)
    if response.status_code == 200:
        return response.json()
    return {"error": "Failed to fetch weather data"}

# Fetch Ship Traffic Data (Placeholder for AIS API)
@app.get("/ship-traffic")
def get_ship_traffic():
    # Placeholder - Replace with actual AIS API call
    return {"ships": [{"id": 1, "lat": 37.7749, "lon": -122.4194, "status": "moving"}]}

# Store Optimized Route
@app.post("/save-route")
def save_route(route_data: dict):
    routes_collection.insert_one(route_data)
    return {"message": "Route saved successfully"}

# Get All Saved Routes
@app.get("/routes")
def get_routes():
    return list(routes_collection.find({}, {"_id": 0}))
