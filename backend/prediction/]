
import ollama
import json
from django.db import connection
from pydantic import BaseModel
from typing import List, Literal, Optional

# --- Pydantic Schemas ---
class IndividualReport(BaseModel):
    severity: Literal["Mild", "Moderate", "Severe"]
    age: int
    symptoms: List[Literal["Vomiting", "Diarrhea", "Fever"]]
    water_quality: Literal["Poor", "Good"]
    treatment_given: Optional[Literal["Yes", "None"]]


class ExtractedData(BaseModel):
    individuals: List[IndividualReport]


# --- Risk Calculation ---
def calculate_outbreak_risk(individuals: List[IndividualReport]):
    if not individuals:
        return 0.0, "Very Low"

    total_score = 0
    max_score = 39  # Max possible score per person

    for p in individuals:
        s = 0
        if p.severity == "Severe": s += 10
        elif p.severity == "Moderate": s += 5
        elif p.severity == "Mild": s += 1

        if p.age < 10 or p.age > 60: s += 5
        for symptom in p.symptoms:
            if symptom in ["Vomiting", "Diarrhea", "Fever"]:
                s += 3
        if p.water_quality == "Poor": s += 5
        if p.treatment_given == "None": s += 10

        total_score += s

    avg_score = total_score / len(individuals)
    risk_percent = (avg_score / max_score) * 100

    if risk_percent > 80:
        level = "Very High"
    elif risk_percent > 60:
        level = "High"
    elif risk_percent > 40:
        level = "Moderate"
    elif risk_percent > 20:
        level = "Low"
    else:
        level = "Very Low"

    return risk_percent, level


# --- Fetch & Process Alert ---
def generate_alert_summary(alert_id: int):
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT village_name, district_name, state_name, rbalert
            FROM extensions.prediction_earlywarningalert
            WHERE id = %s
        """, [alert_id])
        row = cursor.fetchone()

    if not row:
        return {"error": "Alert not found"}

    village, district, state, rbalert = row

    # --- First LLM call: extract structured data ---
    extraction_prompt = f"""
    Analyze the following outbreak alerts and extract structured data.

    JSON Schema:
    {json.dumps(ExtractedData.model_json_schema(), indent=2)}

    **Alert Data:**
    {rbalert}

    Instructions:
    - Fill all fields (`severity`, `age`, `symptoms`, `water_quality`, `treatment_given`).
    - Default `treatment_given` = "Yes" unless explicitly "None".
    - Output ONLY valid JSON.
    """

    extraction_response = ollama.chat(
        model="gemma3:1b",
        messages=[{"role": "user", "content": extraction_prompt}],
        format="json",
        options={"temperature": 0}
    )

    extracted_json = extraction_response["message"]["content"]
    validated_data = ExtractedData.model_validate_json(extracted_json)

    # --- Risk Calculation ---
    risk_percent, risk_level = calculate_outbreak_risk(validated_data.individuals)
    risk_output = f"{risk_level} ({risk_percent:.1f}%)"

    # --- Second LLM call: Summary ---
    summary_prompt = f"""
    You are an analyst writing a simple, actionable summary for NGO/ASHA workers.

    **Raw Alerts:** {rbalert}
    **Calculated Risk:** {risk_output}

    Write a short, clear, and actionable summary.
    """

    summary_response = ollama.generate(
        model="gemma3:1b",
        prompt=summary_prompt,
        stream=False
    )
    summary_text = summary_response["response"]

    return {
        "village_name": village,
        "district_name": district,
        "state_name": state,
        "risk_level": risk_level,
        "risk_percentage": round(risk_percent, 1),
        "summary": summary_text.strip()
    }
