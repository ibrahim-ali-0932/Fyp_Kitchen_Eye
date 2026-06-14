import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from .router import (
    signup,
    login,
    profile,
    stats,
    violations,
    users,
    cameras,
    reports,
    detection,
)

app = FastAPI(title="KitchenEye API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1|\[::1\])(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

app.include_router(signup.router, prefix="/auth")
app.include_router(login.router, prefix="/auth")
app.include_router(profile.router, prefix="/auth")
app.include_router(stats.router)
app.include_router(violations.router)
app.include_router(reports.router)
app.include_router(users.router, prefix="/auth")
app.include_router(cameras.router, prefix="/auth")
app.include_router(detection.router)

# Mount static files for video serving
videos_dir_candidates = [
    os.path.join(os.path.dirname(__file__), "videos"),
    os.path.join(os.path.dirname(__file__), "..", "videos"),
]
videos_dir = next(
    (path for path in videos_dir_candidates if os.path.isdir(path)),
    videos_dir_candidates[0],
)
if not os.path.exists(videos_dir):
    os.makedirs(videos_dir)
app.mount("/videos", StaticFiles(directory=videos_dir), name="videos")


@app.get("/")
def read_root():
    return {"message": "KitchenEye API is running"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}
