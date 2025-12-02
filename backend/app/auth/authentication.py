from fastapi import HTTPException, Header
import firebase_admin
from firebase_admin import credentials, auth 
import os


current_dir = os.path.dirname(os.path.abspath(__file__))
cred_path = os.path.join(
    current_dir, 
    "..", 
    "credentials", 
    "kitchen-eye-f607f-firebase-adminsdk-fbsvc-2d8eb5ab8e.json"
)

# Normalize the path to resolve .. properly
cred_path = os.path.normpath(cred_path)

# Initialize Firebase Admin only if not already initialized
cred = credentials.Certificate(cred_path)
if not firebase_admin._apps:
    firebase_admin.initialize_app(cred)
    
def verify_token(authorization: str = Header(None)):
    """
    Verify Firebase ID token from Authorization header
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Missing Bearer token")
    try:
        token = authorization.split(" ")[1]
        return auth.verify_id_token(token)  # returns decoded JWT (user_data)
    except Exception as e:
        # Log the error for debugging
        print(f"Token verification failed: {e}")
        raise HTTPException(401, "Invalid or expired token")