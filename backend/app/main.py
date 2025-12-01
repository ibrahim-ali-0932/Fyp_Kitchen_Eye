from fastapi import FastAPI
from .router import signup
from .router import profile
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # allow req from any website like frontend
    allow_credentials=True,  # allow sending cookies,tokens
    allow_methods=["*"],  # allow methods get,post,del
    # allow frontend to send any custom header like tokens
    allow_headers=["*"],
)
# defining routes
app.include_router(signup.router)
app.include_router(profile.router)
