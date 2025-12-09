from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .router import signup, login, profile
from .router import stats

app = FastAPI(title="KitchenEye API")

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://localhost:3001"],  # Your frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Include routers with /auth prefix
app.include_router(signup.router, prefix="/auth")
app.include_router(login.router, prefix="/auth")
app.include_router(profile.router, prefix="/auth")
app.include_router(stats.router)

@app.get("/")
def read_root():
    return {"message": "KitchenEye API is running"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}