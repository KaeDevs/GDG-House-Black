"""
SchoolSync Backend — FastAPI Entry Point

Starts the server with CORS enabled so the Vite frontend on :5173
can call these endpoints during local development.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes.schools import router as schools_router
from routes.recommendations import router as recommendations_router

app = FastAPI(
    title="SchoolSync API",
    description="Constituency School Resource Rationalization Engine",
    version="1.0.0",
)

# Allow requests dynamically based on CORS_ORIGINS environment variable
import os

cors_origins = os.getenv("CORS_ORIGINS")
if cors_origins:
    origins = [origin.strip() for origin in cors_origins.split(",")]
else:
    # Default to local development origins and allow-all wildcard for ease of deployment
    origins = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "*"
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False if "*" in origins else True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(schools_router, prefix="/api")
app.include_router(recommendations_router, prefix="/api")


@app.get("/")
async def root():
    return {
        "message": "SchoolSync API is running",
        "docs": "/docs",
        "endpoints": ["/api/schools", "/api/recommendations"],
    }
