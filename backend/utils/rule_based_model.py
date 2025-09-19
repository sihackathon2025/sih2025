import pandas as pd

def generate_health_alerts(df: pd.DataFrame) -> str:
    alerts = []

    # --- Rule 1: Diarrhea / Vomiting cluster (possible waterborne outbreak) ---
    waterborne_count = df[df["Symptoms"].str.contains("Diarrhea|Vomiting", case=False, na=False)].shape[0]
    if waterborne_count >= 0.1 * len(df):  # >10% population
        alerts.append(f"Possible Waterborne Outbreak: {waterborne_count} cases of Diarrhea/Vomiting detected")

    # --- Rule 2: Fever + Cough cluster (flu/viral outbreak) ---
    flu_count = df[df["Symptoms"].str.contains("Fever", case=False, na=False)].shape[0]
    cough_count = df[df["Symptoms"].str.contains("Cough", case=False, na=False)].shape[0]
    if (flu_count + cough_count) >= 0.15 * len(df):  # >15% population
        alerts.append(f"Possible Flu/Viral Outbreak: {flu_count} fever + {cough_count} cough cases")

    # --- Rule 3: Multiple Severe cases (>5%) ---
    severe_cases = df[df["Severity"].str.contains("Severe", case=False, na=False)].shape[0]
    if severe_cases >= 0.05 * len(df):
        alerts.append(f"High Severity Alert: {severe_cases} severe cases found")

    # --- Rule 4: Water Source Specific Outbreak ---
    for source in df["Water Source"].unique():
        subset = df[df["Water Source"] == source]
        severe_in_source = subset[subset["Severity"] == "Severe"].shape[0]
        if severe_in_source >= 3:  # threshold
            alerts.append(f"Outbreak Alert in {source}: {severe_in_source} severe cases")

    # --- Rule 5: Poor water quality + many illnesses ---
    poor_water = df[df["Water Quality"].str.contains("Poor", case=False, na=False)].shape[0]
    if poor_water >= 0.2 * len(df):  # 20% data has poor water
        alerts.append(f"Poor Water Quality Alert: {poor_water} entries marked poor")

    # --- Rule 6: Lack of Treatment cases ---
    no_treatment = df[df["Treatment Given"].str.contains("No Treatment", case=False, na=False)].shape[0]
    if no_treatment >= 0.1 * len(df):  # >10% not treated
        alerts.append(f"Health Risk: {no_treatment} people received no treatment")

    # --- Rule 7: Children at risk (<10 age + severe symptoms) ---
    children_severe = df[(df["Age"] < 10) & (df["Severity"] == "Severe")].shape[0]
    if children_severe > 0:
        alerts.append(f"Child Health Risk: {children_severe} severe cases in children (<10 yrs)")

    # --- Final Output ---
    if alerts:
        return "\n".join(alerts)
    else:
        return "No outbreak alerts. Situation normal."
