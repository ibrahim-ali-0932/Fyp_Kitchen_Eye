from fastapi import Header, HTTPException
from firebase_admin import credentials, auth
import firebase_admin
import os


CLOCK_SKEW_SECONDS = 10


# ------------------------------
# Extract Bearer token correctly
# ------------------------------

async def oauth2_scheme(Authorization: str = Header(None)):
    """
    Extract Firebase ID token from the Authorization header.
    Must be: Authorization: Bearer <token>
    """

    print("🔥 Authorization header received:", Authorization)

    if Authorization is None:
        raise HTTPException(status_code=401, detail="Authorization header missing")

    if not Authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid Authorization format")

    return Authorization.replace("Bearer ", "").strip()  # return only token


# ------------------------------
# Initialize Firebase Admin SDK
# ------------------------------

current_dir = os.path.dirname(os.path.abspath(__file__))
cred_path = os.path.normpath(
    os.path.join(
        current_dir,
        "..",
        "credentials",
        "kitchen-eye-f607f-firebase-adminsdk-fbsvc-1ccac73f93.json",
        
    )
)

cred = credentials.Certificate(cred_path)

if not firebase_admin._apps:
    firebase_admin.initialize_app(cred)


# ------------------------------
# Verify Firebase ID Token
# ------------------------------

def verify_token(token: str = None, require_verified: bool = True):
    """
    Verify Firebase ID token - can be used as a dependency or called directly
    """
    if token is None:
        # If used as dependency, token should come from oauth2_scheme
        raise HTTPException(status_code=401, detail="Token is required")
    
    print("🔥 Verifying token:", token[:30] if token else "None", "...")

    try:
        decoded = auth.verify_id_token(token, clock_skew_seconds=CLOCK_SKEW_SECONDS)
    except Exception as e:
        print("🔥 Firebase token verification failed:", e)
        raise HTTPException(status_code=401, detail=f"Invalid token: {e}")

    if require_verified and not decoded.get("email_verified"):
        raise HTTPException(status_code=403, detail="Email not verified")

    return decoded


# ------------------------------
# FastAPI Dependency for verifying tokens
# ------------------------------

async def get_current_user(Authorization: str = Header(None)):
    """
    FastAPI dependency to verify Firebase token from Authorization header
    """
    if Authorization is None:
        raise HTTPException(status_code=401, detail="Authorization header missing")
    
    if not Authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid Authorization format")
    
    token = Authorization.replace("Bearer ", "").strip()
    
    print("🔥 Verifying token from dependency:", token[:30] + "...")
    
    try:
        decoded = auth.verify_id_token(token, clock_skew_seconds=CLOCK_SKEW_SECONDS)
    except Exception as e:
        print("🔥 Firebase token verification failed:", e)
        raise HTTPException(status_code=401, detail=f"Invalid token: {e}")

    # For profile access, we require email verification
    if not decoded.get("email_verified"):
        raise HTTPException(status_code=403, detail="Email not verified")

    return decoded
