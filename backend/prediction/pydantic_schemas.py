# prediction/pydantic_schema.py

from pydantic import BaseModel, Field
from typing import List, Literal, Optional

# --- Schema for One Person ---
class IndividualReport(BaseModel):
    severity: Literal["Mild", "Moderate", "Severe"] = Field(
        ..., description="The severity of the case for one individual."
    )
    age: int = Field(..., description="The age of the individual.")
    symptoms: List[Literal["Vomiting","Cough", "Diarrhea", "Fever"]] = Field(
        ..., description="A list of high-risk symptoms observed. Can be empty."
    )
    water_quality: Literal["Poor", "Good"] = Field(
        ..., description="The quality of the water source for the individual."
    )
    treatment_given: Optional[Literal["Yes", "None"]] = Field(
        None, description="Whether treatment has been administered to the individual."
    )

# --- Schema for Entire Report ---
class ExtractedData(BaseModel):
    individuals: List[IndividualReport] = Field(
        ..., description="A list of all individuals mentioned in the report."
    )
