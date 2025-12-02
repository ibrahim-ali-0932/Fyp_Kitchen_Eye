# app/db.py
import firebase_admin
from firebase_admin import credentials, firestore

cred = credentials.Certificate(
    "app/credentials/kitchen-eye-f607f-firebase-adminsdk-fbsvc-2d8eb5ab8e.json")
firebase_admin.initialize_app(cred)

db = firestore.client()
