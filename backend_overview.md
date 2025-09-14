# Project Sentinel: Backend Documentation

This document provides a comprehensive overview of the Django-based backend for Project Sentinel, a digital health platform designed to combat water-borne diseases. The documentation is structured to be understood by both human developers and AI agents.

## 1. High-Level Overview

Project Sentinel's backend is a RESTful API service built with Django and Django Rest Framework. Its primary purpose is to serve as the central hub for data collection, user management, real-time alerting, and predictive analysis related to disease outbreaks.

### Key Functionalities:
- **User Management:** Handles different user roles (Admin, NGO, ASHA Worker) with role-based access control.
- **Data Collection:** Ingests health data from on-ground ASHA workers and environmental/infrastructural data from NGOs.
- **Alerting System:** Generates and dispatches alerts via multiple channels when outbreak risks are detected.
- **Prediction Engine:** Utilizes machine learning models to predict the probability of disease outbreaks based on collected data.

### Technology Stack:
- **Framework:** Django, Django Rest Framework
- **Database:** PostgreSQL (configured via `dj_database_url`)
- **Authentication:** JSON Web Tokens (JWT) using `rest_framework_simplejwt`
- **Asynchronous Tasks:** (Implied for alerts/predictions)
- **Deployment:** Gunicorn
- **ML Libraries:** Scikit-learn, XGBoost

---

## 2. Project Structure

The backend is organized into several Django apps, each with a distinct responsibility.

- `sentinel/`: The main Django project directory. It contains global settings (`settings.py`), root URL configuration (`urls.py`), and deployment configurations (WSGI/ASGI).
- `users/`: Manages all aspects of user authentication, registration, and profiles.
- `data_collection/`: Responsible for all data ingestion endpoints, including health reports and NGO surveys.
- `alerts/`: Manages the creation, storage, and dispatch of system-generated alerts.
- `prediction/`: Contains the logic for the AI/ML-powered outbreak prediction models.

---

## 3. Application Details

### 3.1. `sentinel` (Main Project)

- **`settings.py`:**
    - Configures `INSTALLED_APPS`, connecting all the project's applications.
    - Sets up the PostgreSQL database connection.
    - Defines `CORS_ALLOWED_ORIGINS` to allow requests from the frontend (e.g., `http://localhost:5173`).
    - Specifies the custom user model: `AUTH_USER_MODEL = 'users.User'`.
    - Configures `SIMPLE_JWT` for token lifetimes.
    - Sets up `REST_FRAMEWORK` to use JWT for authentication by default.
- **`urls.py`:**
    - The primary URL router for the project.
    - Routes all API-related traffic to the respective app's URL configuration under the `/api/` prefix.
    - Example: A request to `/api/users/login/` is forwarded to the `users` app.

### 3.2. `users` App

Handles user identity and access control.

- **`models.py` (`User` model):**
    - A custom `AbstractBaseUser` model.
    - Uses `email` as the `USERNAME_FIELD` for authentication.
    - `role` field defines user type, with choices: `('ngo', 'NGO')`, `('admin', 'Admin')`.
    - Can be linked to a `data_collection.Village` via a ForeignKey, associating a user with a specific location.
- **`serializers.py`:**
    - `UserRegistrationSerializer`: Validates and creates new users. Has fields for `name`, `email`, `password`, `role`, and `village`.
    - `UserLoginSerializer`: Serializes user data and includes fields for `access` and `refresh` tokens upon successful login.
    - `UserProfileSerializer`: Provides a representation of a user's profile (`user_id`, `name`, `email`, `role`, `village`).
- **`views.py`:**
    - `UserRegistrationView`:
        - **Route:** `POST /api/users/register`
        - **Function:** Allows any user (no authentication required) to register a new account.
    - `UserLoginView`:
        - **Route:** `POST /api/users/login/`
        - **Function:** Authenticates a user with `email` and `password`. On success, returns the user's profile data along with a new JWT `access` and `refresh` token.
- **`permissions.py`:**
    - `IsNgoUser`: Permission class that checks if `request.user.role == 'ngo'`.
    - `IsAdminUser`: Permission class that checks if `request.user.role == 'admin'`.

### 3.3. `data_collection` App

The core of data ingestion.

- **`models.py`:**
    - `Village`: Stores details of villages, including `state`, `district`, `village_name`, and geographic coordinates (`latitude`, `longitude`).
    - `HealthReport`: A detailed record submitted by an ASHA worker. Includes patient info, `symptoms`, `severity`, `date_of_reporting`, `water_source`, and is linked to a `Village`.
    - `NgoSurvey`: Data submitted by an NGO about a village's conditions (e.g., `clean_drinking_water`, `toilet_coverage`, recent disease cases). Linked to a `Village` and the `User` (NGO).
    - `Ngo_HealthReport`: A simplified report model for NGOs.
- **`serializers.py`:**
    - `VillageSerializer`: For creating and reading `Village` instances.
    - `NgoSurveySerializer`: For creating and reading `NgoSurvey` instances.
- **`views.py`:**
    - `health_report_from_aasha` (Function-based view):
        - **Route:** `POST /api/health-reports/`
        - **Function:** An open endpoint for ASHA workers to submit `HealthReport` data as a JSON payload.
    - `VillageCreateView`:
        - **Route:** `POST /api/villages`
        - **Function:** An admin-only endpoint to create new `Village` entries.
    - `NgoSurveyView`:
        - **Route:** `GET, POST /api/ngo-surveys`
        - **Function:** An NGO-only endpoint to submit new surveys and retrieve past surveys submitted by that NGO.
    - `NgoDashboardSummaryView`:
        - **Route:** `GET /api/ngo-dashboard/summary`
        - **Function:** An NGO-only endpoint that provides summary statistics (total villages, surveyed, pending).
    - `AdminMapDataView`:
        - **Route:** `GET /api/admin-dashboard/map-data`
        - **Function:** An admin-only endpoint that aggregates health report data by village to calculate a `risk_level` (`High`, `Moderate`, `Low`) for map visualization.

### 3.4. `alerts` App

Manages the system's real-time alerting functionality.

- **`models.py` (`Alert` model):**
    - A simple model to store alert information: `title`, `message`, and `created_at`.
- **`serializers.py` (`AlertSerializer`):**
    - A standard `ModelSerializer` for the `Alert` model.
- **`views.py` (`AlertViewSet`):**
    - A `ModelViewSet` that provides a full set of CRUD API endpoints for `Alert` objects.
    - **Routes:**
        - `GET, POST /api/alerts/alerts`
        - `GET, PUT, DELETE /api/alerts/alerts/<int:pk>`
- **Functionality Note:** The README for this app mentions that it generates alerts based on ML predictions and sends notifications (SMS, etc.). The logic for triggering these alerts is likely housed in a separate service or task queue that is not visible in the views.

### 3.5. `prediction` App

Intended to house the core machine learning logic for outbreak prediction.

- **`README.md`:** Describes the app's purpose: to process data, run ML models (e.g., XGBoost), and predict outbreak probabilities.
- **Current State:** The `models.py` and `views.py` files are currently placeholders. The actual prediction logic and API endpoints are not yet implemented. The presence of `scikit-learn` and `xgboost` in `requirements.txt` confirms the intended toolset. The `django_integration_guide.md` file provides a detailed plan for how to integrate such a prediction service.
