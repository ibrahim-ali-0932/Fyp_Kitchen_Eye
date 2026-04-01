"""Compatibility package for running uvicorn from inside backend/.

When launched from the backend directory with app string `backend.app.main:app`,
Python expects a `backend` package under the current working directory. This
shim extends package search to the parent backend directory so `backend.app`
resolves to `backend/app`.
"""

from pathlib import Path

_pkg_dir = Path(__file__).resolve().parent
_parent_backend_dir = _pkg_dir.parent

# Ensure imports like backend.app.* resolve to modules in ../app
if str(_parent_backend_dir) not in __path__:
    __path__.append(str(_parent_backend_dir))
