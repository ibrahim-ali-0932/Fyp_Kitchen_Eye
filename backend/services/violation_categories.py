from __future__ import annotations

from typing import Optional

# Canonical flat categories used by stats logic.
CATEGORY_APRON = "apron"
CATEGORY_GLOVES = "gloves"
CATEGORY_HAIR_NET = "hair_net"
CATEGORY_FIRE = "fire"

CANONICAL_CATEGORIES = (
    CATEGORY_APRON,
    CATEGORY_GLOVES,
    CATEGORY_HAIR_NET,
    CATEGORY_FIRE,
)

# Canonical violation types expected for new records.
TYPE_NO_APRON = "no_apron"
TYPE_NO_GLOVES = "no_gloves"
TYPE_NO_HAIR_NET = "no_hair_net"
TYPE_FIRE_DETECTED = "fire_detected"

CANONICAL_VIOLATION_TYPES = (
    TYPE_NO_APRON,
    TYPE_NO_GLOVES,
    TYPE_NO_HAIR_NET,
    TYPE_FIRE_DETECTED,
)

# Legacy aliases are normalized so older producers/data still map correctly.
_VIOLATION_ALIASES = {
    "no_hairnet": TYPE_NO_HAIR_NET,
    "fire": TYPE_FIRE_DETECTED,
}

# Explicit flat mapping table (no grouped PPE/apron bucket behavior).
VIOLATION_TYPE_TO_CATEGORY = {
    TYPE_NO_APRON: CATEGORY_APRON,
    TYPE_NO_GLOVES: CATEGORY_GLOVES,
    TYPE_NO_HAIR_NET: CATEGORY_HAIR_NET,
    TYPE_FIRE_DETECTED: CATEGORY_FIRE,
    # Legacy type remaps for old historical records.
    "spill": CATEGORY_GLOVES,
    "pest": CATEGORY_HAIR_NET,
}


def normalize_violation_type(raw_type: str) -> str:
    value = str(raw_type or "").strip().lower()
    if not value:
        return ""
    return _VIOLATION_ALIASES.get(value, value)


def map_violation_to_category(raw_type: str) -> Optional[str]:
    normalized = normalize_violation_type(raw_type)
    return VIOLATION_TYPE_TO_CATEGORY.get(normalized)
