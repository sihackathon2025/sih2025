from django.shortcuts import render

import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from .models import HealthReport


@csrf_exempt
@require_http_methods(["POST"])
def health_report_from_aasha(request):
    try:
        data = json.loads(request.body.decode("utf-8"))

        # Required fields check
        required_fields = [
            "patient_name", "age", "gender", "village_id", "symptoms",
            "severity", "date_of_reporting", "water_source",
            "treatment_given", "asha_worker_id", "state", "district", "village"
        ]

        for field in required_fields:
            if field not in data:
                return JsonResponse(
                    {"error": f"Missing field: {field}"}, status=400
                )

        # Save to DB
        report = HealthReport.objects.create(
            patient_name=data["patient_name"],
            age=int(data["age"]),
            gender=data["gender"],
            village_id=int(data["village_id"]),
            symptoms=data["symptoms"],
            severity=data["severity"],
            date_of_reporting=data["date_of_reporting"],
            water_source=data["water_source"],
            treatment_given=data["treatment_given"],
            asha_worker_id=int(data["asha_worker_id"]),
            state=data["state"],
            district=data["district"],
            village=data["village"],
        )

        return JsonResponse({
            "message": "Health report created successfully",
            "report_id": report.report_id
        }, status=201)

    except Exception as e:
        print("Error details:", e)
        return JsonResponse({"error": str(e)}, status=500)

