import ollama
import json
from .models import AlertSummary
from .pydantic_schemas import ExtractedData  # 

def calculate_outbreak_risk(individuals):
    """
    Calculates the outbreak risk percentage and level.
    """
    if not individuals:
        return 0.0, "Very Low"

    total_individual_score = 0
    max_possible_score = 39  #  individual

    for person in individuals:
        s_individual = 0
        if person.severity == "Severe":
            s_individual += 10
        elif person.severity == "Moderate":
            s_individual += 5
        elif person.severity == "Mild":
            s_individual += 1

        if person.age < 10 or person.age > 60:
            s_individual += 5

        for symptom in person.symptoms:
            if symptom in ["Vomiting", "Diarrhea", "Fever"]:
                s_individual += 3

        if person.water_quality == "Poor":
            s_individual += 5

        if person.treatment_given == "None":
            s_individual += 10

        total_individual_score += s_individual

    avg_score = total_individual_score / len(individuals)
    r_outbreak = (avg_score / max_possible_score) * 100

    if r_outbreak > 80:
        level = "Very High"
    elif r_outbreak > 60:
        level = "High"
    elif r_outbreak > 40:
        level = "Moderate"
    elif r_outbreak > 20:
        level = "Low"
    else:
        level = "Very Low"

    return r_outbreak, level


def clean_summary_output(raw_text):
    """
    Cleans and strictly formats the HTML summary from the LLM.
    It ensures ONLY the predefined headings and subheadings are bold.
    """
    clean_text = raw_text.strip()

    # 1. Remove markdown code block fences
    if clean_text.startswith("```html"):
        clean_text = clean_text[len("```html"):].strip()
    if clean_text.endswith("```"):
        clean_text = clean_text[:-len("```")].strip()

    # 2. Remove any and all bold formatting (HTML or markdown)
    clean_text = clean_text.replace("<strong>", "").replace("</strong>", "")
    clean_text = clean_text.replace("**", "")

    # 3. Re-apply bolding ONLY to the specific, known headings.
    headings_to_bold = [
        "1. Risk Overview",
        "2. Key Findings",
        "3. Immediate Actions Required",
        "4. Monitoring Guidance",
        "For ASHA Workers:",
        "For NGOs:",
        "Escalation Protocol:"
    ]

    for heading in headings_to_bold:
        clean_text = clean_text.replace(heading, f"<strong>{heading}</strong>")

    return clean_text

def process_alert(alert_obj):
    """
    Takes an EarlyWarningAlert object, processes it with the model,
    calculates risk, generates a summary, and stores it in AlertSummary.
    """

    rbalert_text = alert_obj.rbalert

    #  Extract structured data
    extraction_prompt = f"""Analyze the following rule-based alert and extract structured JSON data 
according to this schema: {json.dumps(ExtractedData.model_json_schema(), indent=2)}

Alert:
{rbalert_text}

Output only the JSON, no extra text.
"""

    extraction_response = ollama.chat(
        model="gemma3:1b",
        messages=[{"role": "user", "content": extraction_prompt}],
        format="json",
        options={"temperature": 0},
    )

    extracted_data_json = extraction_response["message"]["content"]
    validated_data = ExtractedData.model_validate_json(extracted_data_json)

  #Calculate risk
    risk_percentage, risk_level = calculate_outbreak_risk(validated_data.individuals)

    #plain-language summary
    summary_prompt = f"""You are a senior public health analyst for the Indian Ministry of the North Eastern Region, tasked with writing an urgent field directive. Your writing style must be official, clear, and direct. Avoid jargon and AI-like conversational phrases. The output must be a pure, clean HTML snippet.

**Context for Directive:**
- **Raw Field Alert Data:** {rbalert_text}
- **Calculated Outbreak Risk:** {risk_level} ({risk_percentage:.1f}%)
- **Structured Case Data:** {validated_data.model_dump_json(indent=2)}

**Your Task:**
Generate an HTML summary based *only* on the provided context. Adhere strictly to the following rules and HTML structure.

**CRITICAL RULES:**
1.  **HTML Only:** Your entire output must be valid HTML. Do not include any text or characters outside of the HTML structure provided.
2.  **No Markdown:** Do NOT use any markdown syntax (e.g., `**`, `*`, `#`). All formatting must be done with HTML tags.
3.  **Strict Bolding:** Use `<strong>` tags ONLY for the main numbered headings (e.g., `<strong>1. Risk Overview</strong>`) and the specific subheadings within the "Immediate Actions Required" list (e.g., `<strong>For ASHA Workers:</strong>`). No other text should be bold.
4.  **Human Tone:** Write as a human expert. Be authoritative and concise. Do not use filler words or phrases that sound like a language model (e.g., "Based on the data...", "It is important to...").
5.  **Fill Placeholders:** Replace the bracketed `[...]` content in the template with specific, data-driven findings from the context.

**Mandatory HTML Structure:**

<strong>1. Risk Overview</strong>
<p>Risk Level: {risk_level} ({risk_percentage:.1f}%). [Directly state the primary reason for this risk level based on key factors like severity, age, and treatment gaps.]</p>

<strong>2. Key Findings</strong>
<ul>
  <li>[Identify the most vulnerable groups based on age and severity from the structured data.]</li>
  <li>[List the most prevalent symptoms observed in the cases.]</li>
  <li>[Specify environmental factors mentioned, such as water quality.]</li>
  <li>[State the number or proportion of individuals who have not received treatment.]</li>
</ul>

<strong>3. Immediate Actions Required</strong>
<ol>
  <li><strong>For ASHA Workers:</strong> [Provide a clear, actionable instruction, e.g., "Immediately begin screening all households in the affected area, focusing on children under 10..."]</li>
  <li><strong>For NGOs:</strong> [Provide a clear, actionable instruction, e.g., "Coordinate with local health centers to distribute ORS and water purification tablets..."]</li>
  <li><strong>Escalation Protocol:</strong> [Define the trigger for escalation, e.g., "If more than 5 new severe cases are reported in a 24-hour period, immediately escalate to the District Surveillance Officer."].</li>
</ol>

<strong>4. Monitoring Guidance</strong>
<ul>
  <li>[Specify key metrics to monitor, e.g., "Track the number of new cases and their severity daily."].</li>
  <li>[List specific warning signs of a worsening outbreak, e.g., "An increase in the proportion of severe cases or spread to new geographical clusters."].</li>
</ul>
"""

    summary_response = ollama.generate(
        model="gemma3:1b",
        prompt=summary_prompt,
        stream=False,
    )

    raw_summary_output = summary_response["response"].strip()
    
    # Clean the output to enforce strict formatting
    summary_output = clean_summary_output(raw_summary_output)

    AlertSummary.objects.create(
        alert=alert_obj,
        risk_percentage=risk_percentage,
        risk_level=risk_level,
        summary_text=summary_output,
    )

    return {
        "risk_percentage": risk_percentage,
        "risk_level": risk_level,
        "summary": summary_output,
    }

