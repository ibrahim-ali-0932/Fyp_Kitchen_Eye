import sys
from unittest.mock import MagicMock

# Prevent Firebase imports from failing during test collection
sys.modules.setdefault("firebase_admin", MagicMock())
sys.modules.setdefault("firebase_admin.firestore", MagicMock())
sys.modules.setdefault("app.database.db", MagicMock())
