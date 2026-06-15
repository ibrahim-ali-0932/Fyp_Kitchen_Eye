import unittest

from services.plan_limits_config import (
    DEFAULT_PLAN_LIMITS,
    UNLIMITED,
    build_quantifiable_features,
    normalize_plan,
    sanitize_limit,
)


class PlanLimitsConfigTests(unittest.TestCase):
    def test_normalize_plan_defaults_to_basic(self):
        self.assertEqual(normalize_plan(None), "basic")
        self.assertEqual(normalize_plan(""), "basic")

    def test_normalize_plan_lowercases_and_trims(self):
        self.assertEqual(normalize_plan("  Pro "), "pro")

    def test_sanitize_limit_accepts_unlimited(self):
        self.assertEqual(sanitize_limit(-1, 5), UNLIMITED)

    def test_sanitize_limit_rejects_values_below_unlimited(self):
        self.assertEqual(sanitize_limit(-3, 5), 5)

    def test_sanitize_limit_rejects_non_numeric(self):
        self.assertEqual(sanitize_limit("abc", 7), 7)

    def test_default_pro_limits(self):
        self.assertEqual(DEFAULT_PLAN_LIMITS["pro"]["max_cameras"], 10)
        self.assertEqual(DEFAULT_PLAN_LIMITS["pro"]["max_branches"], 3)

    def test_feature_text_generation(self):
        features = build_quantifiable_features(
            {
                "max_cameras": 10,
                "max_branches": 3,
                "max_users": UNLIMITED,
            }
        )
        self.assertIn("Up to 10 camera feeds", features)
        self.assertIn("Up to 3 branches", features)
        self.assertIn("Unlimited users", features)


if __name__ == "__main__":
    unittest.main()
