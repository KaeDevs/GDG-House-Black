import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.api import router as api_router
from db import Base, async_engine
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Any startup logic (e.g., verifying DB connection)
    yield
    # Any shutdown logic

app = FastAPI(
    title="SchoolSync API",
    description="Backend for SchoolSync UDISE+ dashboard",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to the frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include the API router
app.include_router(api_router, prefix="/api")

@app.get("/")
async def root():
    return {"message": "SchoolSync UDISE+ API is running."}

if __name__ == "__main__":
    print("Starting SchoolSync Backend...")
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
