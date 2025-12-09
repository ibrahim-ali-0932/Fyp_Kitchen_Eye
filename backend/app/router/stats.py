# app/router/stats.py
# -----------------------
# Reads .txt files from /app/data and returns JSON.

from fastapi import APIRouter, HTTPException, Response
import os, json

router = APIRouter()

DATA_FOLDER = "app/data"

@router.get("/stats/{filename}")
async def get_stats(filename: str, response: Response):
    # Disable caching
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    
    file_path = os.path.join(DATA_FOLDER, filename)

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")

    try:
        # Always read fresh from disk
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read().strip()

            # If file is pure JSON — parse it safely
            try:
                return json.loads(content)
            except json.JSONDecodeError:
                # If simple number inside txt
                if content.isdigit():
                    return {"value": int(content)}
                return {"value": content}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
