# Guide: Integrating the Outbreak Analysis Logic into Django

This guide provides all the code and structure needed to create a Django API endpoint that reads data from your database, processes it using the summarizer logic, and returns a structured JSON response.

## Overview

The process is as follows:

1. A URL request is made to our Django endpoint with a specific report ID.
2. The endpoint's **view** fetches the corresponding report from the PostgreSQL database.
3. The view passes the report's text to a **service** function that contains our core analysis logic.
4. The **service** function performs the two-step LLM process (extract, then summarize) and the risk calculation.
5. The final result is returned as a JSON response.

---

## Step 1: Create `services.py`

This file will contain the core logic, keeping it separate from the view. In your Django app directory (e.g., `your_app/`), create a new file named `services.py`.

```python
# your_app/services.py

import ollama
import json
from pydantic import BaseModel, Field
from typing import List, Literal, Optional

# --- Pydantic Schemas for Data Extraction ---
class IndividualReport(BaseModel):
    severity: Literal["Mild", "Moderate", "Severe"] = Field(..., description="The severity of the case for one individual.")
    age: int = Field(..., description="The age of the individual.")
    symptoms: List[Literal["Vomiting", "Diarrhea", "Fever"]] = Field(..., description="A list of high-risk symptoms observed. Can be empty.")
    water_quality: Literal["Poor", "Good"] = Field(..., description="The quality of the water source for the individual.")
    treatment_given: Optional[Literal["Yes", "None"]] = Field(None, description="Whether treatment has been administered to the individual.")

class ExtractedData(BaseModel):
    individuals: List[IndividualReport] = Field(..., description="A list of all individuals mentioned in the report.")

# --- Risk Calculation Logic ---
def calculate_outbreak_risk(individuals: List[IndividualReport]):
    if not individuals:
        return 0.0, "Very Low"

    total_individual_score = 0
    max_possible_score = 39

    for person in individuals:
        s_individual = 0
        if person.severity == "Severe": s_individual += 10
        elif person.severity == "Moderate": s_individual += 5
        elif person.severity == "Mild": s_individual += 1

        if person.age < 10 or person.age > 60: s_individual += 5
        for symptom in person.symptoms:
            if symptom in ["Vomiting", "Diarrhea", "Fever"]: s_individual += 3
        if person.water_quality == "Poor": s_individual += 5
        if person.treatment_given == "None": s_individual += 10

        total_individual_score += s_individual

    average_individual_score = total_individual_score / len(individuals)
    r_outbreak = (average_individual_score / max_possible_score) * 100

    if r_outbreak > 80: level = "Very High"
    elif r_outbreak > 60: level = "High"
    elif r_outbreak > 40: level = "Moderate"
    elif r_outbreak > 20: level = "Low"
    else: level = "Very Low"

    return r_outbreak, level

# --- Main Orchestration Logic ---
def run_analysis_from_text(input_text: str):
    """
    Orchestrates the entire analysis process: data extraction, calculation, and summary.
    """
    # 1. First LLM Call: Extract structured data
    extraction_prompt = f'''Analyze the following field report. Your task is to extract key information for every individual mentioned into a structured JSON object.
    The JSON object must conform to this schema: {json.dumps(ExtractedData.model_json_schema(), indent=2)}

    **Field Report:**
    {input_text}

    **Instructions:**
    - You must include all fields for each individual.
    - If `treatment_given` is not mentioned, assume it was "Yes".
    - Only output the JSON object.
    '

    try:
        extraction_response = ollama.chat(
            model='gemma3:1b',
            messages=[{'role': 'user', 'content': extraction_prompt}],
            format='json',
            options={'temperature': 0}
        )
        extracted_data_json = extraction_response['message']['content']
        validated_data = ExtractedData.model_validate_json(extracted_data_json)
    except Exception as e:
        # Handle potential JSON or validation errors from the LLM
        raise RuntimeError(f"Failed to extract valid data from report: {e}")

    # 2. Calculate Risk using the formula
    risk_percentage, risk_level = calculate_outbreak_risk(validated_data.individuals)
    risk_output_line = f"Outbreak Risk: {risk_level} ({risk_percentage:.1f}%)"

    # 3. Second LLM Call: Generate simple summary
    summary_prompt = f'''**Analysis Context:**
    - **Original Report:** '{input_text}'
    - **Calculated Risk:** {risk_output_line}

    **Your Task:**
    Write a short, concise, and to-the-point summary of the situation for ASHA and NGO workers. It must be easy to understand and actionable. Avoid jargon. Do not repeat the risk level.
    ''

    summary_response = ollama.generate(
        model='gemma3:1b',
        prompt=summary_prompt,
        stream=False
    )
    summary_output = summary_response['response']

    # 4. Return final structured result
    return {
        "risk_level": risk_level,
        "risk_percentage": round(risk_percentage, 1),
        "summary": summary_output.strip()
    }
```

---

## Step 2: Example `models.py`

This is an example of what your model could look like. **You will need to replace this with your actual model definition.**

```python
# your_app/models.py

from django.db import models

class FieldReport(models.Model):
    # Example fields - replace with your own
    title = models.CharField(max_length=200)
    location = models.CharField(max_length=100)
    content = models.TextField(help_text="The full text content of the report.")
    reported_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title
```

---

## Step 3: Create the API View in `views.py`

This view will handle the incoming web request, fetch data from the model, and call the service.

```python
# your_app/views.py

from django.http import JsonResponse, Http404
from .models import FieldReport  # <-- IMPORTANT: Replace with your model
from .services import run_analysis_from_text
import logging

logger = logging.getLogger(__name__)

def generate_report_summary(request, report_id):
    """
    An API view to generate a briefing note for a specific field report.
    """
    try:
        # 1. Fetch the report object from the database
        report = FieldReport.objects.get(pk=report_id)

        # 2. Combine fields to create the input text for the analysis
        #    IMPORTANT: Adjust this part to match your model's fields
        input_text = f"Report from {report.location}: {report.title}\n\n{report.content}"

        # 3. Call the analysis service
        analysis_result = run_analysis_from_text(input_text)

        # 4. Return the successful JSON response
        return JsonResponse(analysis_result)

    except FieldReport.DoesNotExist:
        return JsonResponse({"error": "Report not found."}, status=404)

    except Exception as e:
        logger.error(f"An error occurred during analysis for report {report_id}: {e}")
        return JsonResponse({"error": "An internal error occurred during analysis."}, status=500)

```

---

## Step 4: Configure the URL in `urls.py`

Finally, create a URL for your new view. If you don't have a `urls.py` in your app, create one.

```python
# your_app/urls.py

from django.urls import path
from . import views

urlpatterns = [
    # Example URL: /api/reports/1/summarize/
    path('reports/<int:report_id>/summarize/', views.generate_report_summary, name='summarize_report'),
]
```

You will also need to include this app's `urls.py` in your main project's `urls.py`:

```python
# your_project/urls.py

from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('your_app.urls')), # <-- Add this line
]
```

---

## How to Use

1. Place the files and code in the correct locations in your Django project.
2. **Adapt the code** to use your actual app name and model definition.
3. Run your Django development server (`python manage.py runserver`).
4. Access the endpoint URL in your browser or with a tool like `curl`, replacing `1` with a real ID from your database:
   `http://127.0.0.1:8000/api/reports/1/summarize/`

The server will return a JSON response like this:

```json
{
  "risk_level": "Moderate",
  "risk_percentage": 47.4,
  "summary": "A summary for ASHA and NGO workers..."
}
```
