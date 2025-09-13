# API Endpoints

This document outlines the API endpoints available in the backend.

## 1. User Management

**Base Path:** `/api/users/`

| Endpoint                 | Method | Functionality                                  |
| :----------------------- | :----- | :--------------------------------------------- |
| `/api/users/users/`      | GET    | List all users                                 |
| `/api/users/users/`      | POST   | Create a new user                              |
| `/api/users/users/<int:pk>/` | GET    | Retrieve a specific user by ID                 |
| `/api/users/users/<int:pk>/` | PUT/PATCH | Update a specific user by ID                   |
| `/api/users/users/<int:pk>/` | DELETE | Delete a specific user by ID                   |
| `/api/users/register/`   | POST   | Register a new user                            |
| `/api/users/login/`      | POST   | Log in a user (obtain authentication token)    |

## 2. Alert Management

**Base Path:** `/api/alerts/`

| Endpoint                 | Method | Functionality                                  |
| :----------------------- | :----- | :--------------------------------------------- |
| `/api/alerts/alerts/`    | GET    | List all alerts                                |
| `/api/alerts/alerts/`    | POST   | Create a new alert                             |
| `/api/alerts/alerts/<int:pk>/` | GET    | Retrieve a specific alert by ID                |
| `/api/alerts/alerts/<int:pk>/` | PUT/PATCH | Update a specific alert by ID                  |
| `/api/alerts/alerts/<int:pk>/` | DELETE | Delete a specific alert by ID                  |

## 3. Data Collection

**Base Path:** `/api/data/`

| Endpoint                 | Method | Functionality                                  |
| :----------------------- | :----- | :--------------------------------------------- |
| `/api/data/datapoints/`  | GET    | List all data points                           |
| `/api/data/datapoints/`  | POST   | Create a new data point                        |
| `/api/data/datapoints/<int:pk>/` | GET    | Retrieve a specific data point by ID           |
| `/api/data/datapoints/<int:pk>/` | PUT/PATCH | Update a specific data point by ID             |
| `/api/data/datapoints/<int:pk>/` | DELETE | Delete a specific data point by ID             |

## 4. Admin Interface

| Endpoint                 | Method | Functionality                                  |
| :----------------------- | :----- | :--------------------------------------------- |
| `/admin/`                | GET/POST | Django administration interface                |
