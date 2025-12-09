from fastapi import Header, HTTPException
from firebase_admin import credentials, auth
import firebase_admin
import os


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
        "kitchen-eye-f607f-firebase-adminsdk-fbsvc-2d8eb5ab8e.json",
    )
)

cred = credentials.Certificate(cred_path)

if not firebase_admin._apps:
    firebase_admin.initialize_app(cred)


# ------------------------------
# Verify Firebase ID Token
# ------------------------------

def verify_token(token: str, require_verified: bool = True):
    print("🔥 Verifying token:", token[:30], "...")

    try:
        decoded = auth.verify_id_token(token)
    except Exception as e:
        print("🔥 Firebase token verification failed:", e)
        raise HTTPException(status_code=401, detail="Invalid token")

    if require_verified and not decoded.get("email_verified"):
        raise HTTPException(status_code=403, detail="Email not verified")

    return decoded
