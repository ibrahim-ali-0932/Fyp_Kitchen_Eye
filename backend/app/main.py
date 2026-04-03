from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .router import signup, login, profile, stats, violations, users, cameras, reports

app = FastAPI(title="KitchenEye API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
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


@app.get("/")
def read_root():
    return {"message": "KitchenEye API is running"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}