"""
Baseline test suite for stats_service.py — KitchenEye FYP.
Tests the 5 target functions: _map_category, _hygiene_score,
_pct_change, _date_strings_for_range, _aggregate_days.
"""
import pytest
from unittest.mock import patch, MagicMock
from datetime import datetime, timedelta, timezone

from services.stats_service import (
    _map_category,
    _hygiene_score,
    _pct_change,
    _date_strings_for_range,
    _aggregate_days,
    CATEGORY_APRON,
    CATEGORY_GLOVES,
    CATEGORY_HAIRNET,
    CATEGORY_FIRE,
)


# ── _map_category ─────────────────────────────────────────────
class TestMapCategory:
    def test_known_type_no_apron(self):
        assert _map_category("no_apron") == CATEGORY_APRON

    def test_known_type_fire(self):
        assert _map_category("fire") == CATEGORY_FIRE

    def test_unknown_type_returns_none(self):
        assert _map_category("unknown_thing") is None


# ── _hygiene_score ────────────────────────────────────────────
class TestHygieneScore:
    def test_perfect_score_no_violations(self):
        assert _hygiene_score(0, 0, 0, 0) == 100

    def test_single_apron_violation(self):
        # 100 - (1*2) = 98
        assert _hygiene_score(1, 0, 0, 0) == 98

    def test_mixed_violations(self):
        # 100 - (2*2 + 1*1 + 1*3 + 0*5) = 100 - 8 = 92
        assert _hygiene_score(2, 1, 1, 0) == 92

    def test_hygiene_score_high_violations_severe_penalty(self):
        """Many violations should push score toward 0, not increase it."""
        score = _hygiene_score(10, 10, 10, 10)
        # penalty = 10*2 + 10*1 + 10*3 + 10*5 = 110 → max(0, 100-110) = 0
        assert score == 0

    def test_hygiene_score_more_violations_means_lower_score(self):
        """Score must decrease monotonically with more violations."""
        high = _hygiene_score(0, 0, 0, 0)
        low = _hygiene_score(5, 5, 5, 5)
        assert high > low

    def test_hygiene_score_weight_multiplication_not_addition(self):
        """Verify penalty uses multiplication: 5 aprons = 5*2=10, not 5+2=7."""
        score = _hygiene_score(5, 0, 0, 0)
        # 100 - (5*2) = 90, NOT 100 - (5+2) = 93
        assert score == 90


# ── _pct_change ───────────────────────────────────────────────
class TestPctChange:
    def test_increase(self):
        # (10 - 5) / 5 * 100 = 100%
        assert _pct_change(10, 5) == 100

    def test_decrease(self):
        # (3 - 6) / 6 * 100 = -50%
        assert _pct_change(3, 6) == -50

    def test_no_change(self):
        assert _pct_change(5, 5) == 0

    def test_pct_change_yesterday_zero_today_positive(self):
        """When yesterday=0 and today>0, should return 100 (new activity)."""
        assert _pct_change(5, 0) == 100


# ── _date_strings_for_range ───────────────────────────────────
class TestDateStringsForRange:
    def test_single_day(self):
        result = _date_strings_for_range(1)
        assert len(result) == 1

    def test_seven_days(self):
        result = _date_strings_for_range(7)
        assert len(result) == 7


# ── _aggregate_days ───────────────────────────────────────────
class TestAggregateDays:
    @patch("services.stats_service._get_daily")
    def test_single_day_aggregation(self, mock_get_daily):
        mock_get_daily.return_value = {
            "apron_count": 2, "gloves_count": 1,
            "hairnet_count": 0, "fire_count": 0,
        }
        result = _aggregate_days("user123", ["2026-05-01"])
        assert result["apron_count"] == 2
        assert result["total_count"] == 3
