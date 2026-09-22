import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from app.api.routes import router

app = FastAPI(
    title="Intelligent Vehicle Selection & Decision Support System",
    description=(
        "An AI-based decision support system for intelligent vehicle selection. "
        "Integrates Knowledge Representation, Forward Chaining, Fuzzy Logic, "
        "Bayesian Reasoning under uncertainty, multi-criteria scoring, and Explainable AI (XAI) traces."
    ),
    version="2.0.0",
)

# CORS middleware for React frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# No-Cache middleware to prevent 304 Not Modified and guarantee 200 OK for all assets
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

class NoCacheMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        if "if-none-match" in request.headers or "if-modified-since" in request.headers:
            headers = [
                (k, v) for k, v in request.scope["headers"]
                if k.lower() not in (b"if-none-match", b"if-modified-since")
            ]
            request.scope["headers"] = headers

        response: Response = await call_next(request)
        response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate, max-age=0"
        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"
        return response

app.add_middleware(NoCacheMiddleware)

# Include API routes
app.include_router(router)

# Mount static asset directories
_BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
_FRONTEND_PUBLIC = os.path.join(_BASE_DIR, "frontend", "public")
_FRONTEND_DIST = os.path.join(_BASE_DIR, "frontend", "dist")

# Ensure public/assets/cars is mounted so car images & default_vehicle.svg are served
_PUBLIC_ASSETS = os.path.join(_FRONTEND_PUBLIC, "assets")
_DIST_ASSETS = os.path.join(_FRONTEND_DIST, "assets")

# Prefer dist assets if built (contains compiled js/css + copied public assets), else fallback to public assets
if os.path.exists(_DIST_ASSETS):
    app.mount("/assets", StaticFiles(directory=_DIST_ASSETS), name="dist-assets")
elif os.path.exists(_PUBLIC_ASSETS):
    app.mount("/assets", StaticFiles(directory=_PUBLIC_ASSETS), name="public-assets")

# Also alias /cars directly to prevent 404 on legacy image requests
_PUBLIC_CARS = os.path.join(_PUBLIC_ASSETS, "cars")
_DIST_CARS = os.path.join(_DIST_ASSETS, "cars")
if os.path.exists(_DIST_CARS):
    app.mount("/cars", StaticFiles(directory=_DIST_CARS), name="dist-cars")
elif os.path.exists(_PUBLIC_CARS):
    app.mount("/cars", StaticFiles(directory=_PUBLIC_CARS), name="public-cars")

# Mount Single Page App frontend if dist exists
if os.path.exists(_FRONTEND_DIST):
    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        if full_path.startswith("api"):
            return None
        file_path = os.path.join(_FRONTEND_DIST, full_path)
        if full_path and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(_FRONTEND_DIST, "index.html"))
else:
    @app.get("/")
    async def root():
        return {
            "name": "Intelligent Vehicle Selection System",
            "version": "2.0.0",
            "description": "AI-based decision support with Forward Chaining, Fuzzy Logic & Bayesian Reasoning",
            "endpoints": {
                "recommend": "POST /api/recommend",
                "recommend_advanced": "POST /api/recommend/advanced",
                "vehicles": "GET /api/vehicles",
                "variants": "GET /api/variants",
                "locations": "GET /api/locations",
                "search": "GET /api/search?q=",
                "compare": "POST /api/compare",
                "rules": "GET /api/rules",
                "fuzzy_sets": "GET /api/fuzzy-sets",
                "bayesian_priors": "GET /api/bayesian-priors",
            },
        }
