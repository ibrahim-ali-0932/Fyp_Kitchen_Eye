from fastapi import FastAPI
from .router import signup
from .router import profile
app = FastAPI()

# defining routes
app.include_router(signup.router)
app.include_router(profile.router)
