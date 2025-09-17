# Admindashboard Calculation Concepts

This document outlines the key calculation concepts used in the `admindashboard/services.py` file, specifically focusing on Severity Distribution and Risk Score Calculation.

---

## 1. Severity Distribution Calculation

**Purpose:** Converts the raw counts of "Mild", "Moderate", and "Severe" cases (primarily derived from `HealthReport` entries) into percentages. This provides a normalized view of case severity.

**Location in Code:** `aggregate_for_village` function, Section 6.

**Formula:**

```python
total_severity_reports = sum(severity_counter.values()) or 1
severity_pct = {
    k: round((v / total_severity_reports) * 100, 1)
    for k, v in severity_counter.items()
}
```

**Concept:**
1.  `total_severity_reports`: Sums up all the counts for "Mild", "Moderate", and "Severe" cases. A default of `1` is used if there are no reports to prevent division by zero errors.
2.  For each severity level (e.g., "Mild"):
    *   Its count (`v`) is divided by the `total_severity_reports`.
    *   The result is multiplied by `100` to get a percentage.
    *   The percentage is rounded to one decimal place.

**Example:**
If `severity_counter` is `{"Mild": 40, "Moderate": 30, "Severe": 30}`:
*   `total_severity_reports` = 40 + 30 + 30 = 100
*   `severity_pct` would be `{"Mild": 40.0, "Moderate": 30.0, "Severe": 30.0}`

---

## 2. Risk Score Calculation

**Purpose:** Calculates a composite `risk_percentage` for a village and assigns a qualitative `risk_level` (e.g., "Very Low", "High"). This is a custom, "tweakable" formula that combines severity, case volume, and environmental factors.

**Location in Code:** `aggregate_for_village` function, Section 8.

**Components of Risk Calculation:**

### a. Severity Score (`severity_score`)

*   **Concept:** Assigns weights to different severity levels to reflect their impact on risk, then normalizes this weighted sum to a 0-100 scale.
*   **Formula:**
    ```python
    severe_count = severity_counter.get("Severe", 0)
    moderate_count = severity_counter.get("Moderate", 0)
    mild_count = severity_counter.get("Mild", 0)

    severity_score = min(100, (severe_count * 3 + moderate_count * 2 + mild_count * 1) / max(1, (severe_count + moderate_count + mild_count) * 3) * 100)
    ```
*   **Explanation:**
    *   "Severe" cases are weighted `3`.
    *   "Moderate" cases are weighted `2`.
    *   "Mild" cases are weighted `1`.
    *   The weighted sum is divided by `(total_severity_reports * 3)` (where `3` is the maximum weight) to normalize it.
    *   `max(1, ...)` prevents division by zero if no severity reports exist.
    *   `min(100, ...)` caps the score at 100.

### b. Case Score (`case_score`)

*   **Concept:** Normalizes the total number of cases (`total_cases`) to a 0-100 scale based on a predefined threshold.
*   **Formula:**
    ```python
    case_score = min(100, (total_cases / 20) * 100)
    ```
*   **Explanation:**
    *   Assumes that `20` total cases represent a 100% contribution to the `case_score`.
    *   `min(100, ...)` caps the score at 100.
    *   The threshold `20` is a configurable parameter.

### c. Environmental Penalties

*   **Water Risk Penalty (`water_penalty`)**
    *   **Concept:** Adds a fixed penalty if there are reports of unsafe drinking water.
    *   **Formula:**
        ```python
        water_risk_flag = nq.filter(clean_drinking_water=False).exists()
        water_penalty = 20 if water_risk_flag else 0
        ```
    *   **Explanation:** If any `NgoSurvey` for the village indicates `clean_drinking_water` is `False`, `20` points are added to the risk.

*   **Untreated Risk Penalty (`untreated_penalty`)**
    *   **Concept:** Adds a fixed penalty if the latest rule-based alert mentions untreated conditions.
    *   **Formula:**
        ```python
        untreated_flag = "no treatment" in (latest_rb_alerts or "").lower() or "untreated" in (latest_rb_alerts or "").lower()
        untreated_penalty = 15 if untreated_flag else 0
        ```
    *   **Explanation:** If the `latest_rb_alerts` text contains "no treatment" or "untreated" (case-insensitive), `15` points are added to the risk.

### d. Final Risk Percentage (`risk_percentage`)

*   **Concept:** A weighted sum of the `severity_score` and `case_score`, with additional fixed penalties from environmental factors.
*   **Formula:**
    ```python
    risk_percentage = min(100.0, (0.6 * severity_score) + (0.3 * case_score) + water_penalty + untreated_penalty)
    ```
*   **Explanation:**
    *   `severity_score` contributes `60%` to the base risk.
    *   `case_score` contributes `30%` to the base risk.
    *   `water_penalty` and `untreated_penalty` are added directly.
    *   `min(100.0, ...)` caps the total `risk_percentage` at 100%.

### e. Risk Level (`risk_level`)

*   **Concept:** Categorizes the calculated `risk_percentage` into qualitative levels for easier interpretation.
*   **Thresholds:**
    *   `> 90`: "Very High"
    *   `> 60`: "High"
    *   `> 40`: "Moderate"
    *   `> 20`: "Low"
    *   `<= 20`: "Very Low"
