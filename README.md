# Project Sentinel

This repository contains the source code for Project Sentinel.

## Folder Structure

| Folder                     | Description                                                                                     |
| -------------------------- | ----------------------------------------------------------------------------------------------- |
| `backend/`                 | Contains the entire Django backend application.                                                 |
| `backend/sentinel/`        | Main Django project folder for settings, URLs, and deployment configurations.                   |
| `backend/users/`           | Django app for user authentication and profile management.                                      |
| `backend/data_collection/` | Django app to handle data intake from the mobile app, SMS, and sensors.                         |
| `backend/prediction/`      | Django app to manage the AI/ML models for outbreak prediction.                                  |
| `backend/alerts/`          | Django app responsible for generating and sending alerts to users.                              |
| `backend/venv/`            | Folder containing the Python virtual environment and its dependencies (not version controlled). |
