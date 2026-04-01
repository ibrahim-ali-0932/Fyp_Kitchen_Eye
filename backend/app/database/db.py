# backend/app/database/db.py
import os
from pathlib import Path
import firebase_admin
from dotenv import load_dotenv
from firebase_admin import credentials, firestore

_BACKEND_DIR     = Path(__file__).resolve().parents[2]
_ENV_PATH        = _BACKEND_DIR / ".env"
_CREDENTIALS_DIR = _BACKEND_DIR / "app" / "credentials"


def _load_env_file():
    if _ENV_PATH.is_file():
        load_dotenv(_ENV_PATH)


def _resolve_cred_path() -> Path:
    env_cred = os.getenv("FIREBASE_CREDENTIALS", "").strip()
    candidates = []
    if env_cred:
        env_path = Path(env_cred)
        candidates.extend([env_path, Path.cwd() / env_path, _BACKEND_DIR / env_path])
    candidates.extend(sorted(_CREDENTIALS_DIR.glob("*.json")))

    seen = set()
    for candidate in candidates:
        resolved = candidate.resolve()
        if str(resolved) in seen:
            continue
        seen.add(str(resolved))
        if resolved.exists() and resolved.is_file():
            return resolved

    raise RuntimeError(
        "Firebase credentials not found. Set FIREBASE_CREDENTIALS in .env"
    )


_load_env_file()

if not firebase_admin._apps:
    cred_path = _resolve_cred_path()
    firebase_admin.initialize_app(credentials.Certificate(str(cred_path)))

db = firestore.client()