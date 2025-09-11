# Sentinel Project (Main)

This is the main Django project for Project Sentinel, a digital health platform designed to combat water-borne diseases.

**Key components and responsibilities include:**
*   **Core Settings:** Contains the primary Django settings (`settings.py`) for the entire project, including database configuration, installed apps, and middleware.
*   **URL Routing:** Defines the main URL patterns (`urls.py`) that route requests to the appropriate Django applications.
*   **WSGI/ASGI:** Configuration files (`wsgi.py`, `asgi.py`) for deploying the application with web servers.
*   **Overall Orchestration:** Connects and orchestrates the various Django applications (alerts, data_collection, prediction, users) to form a cohesive system.
