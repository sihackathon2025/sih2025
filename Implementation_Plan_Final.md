
# Project Sentinel: Implementation Plan

## 1. Abstract

Project Sentinel is a comprehensive, AI-powered public health surveillance system designed for the North Eastern Region of India. Its primary objective is to enable real-time disease monitoring, facilitate early outbreak prediction, and streamline alert dissemination among key stakeholders: the Ministry of Development, ASHA workers, NGOs, and local clinics. By leveraging a modern technology stack, the platform ingests data from multiple sources, processes it through rule-based and AI-driven models, and presents actionable insights on role-based dashboards, thereby strengthening the region's public health infrastructure.

## 2. System Architecture

The architecture is designed for scalability and efficiency, ensuring a seamless flow of information from data collection to actionable intelligence.

-   **Data Sources:**
    -   **ASHA Workers:** Submit individual health reports via a mobile-friendly web interface.
    -   **NGOs & Clinics:** Provide survey data and aggregated case numbers through dedicated web forms.
    -   **IVR & SMS:** The system is architected to support data submission from rural villagers via Interactive Voice Response and to send out mass alerts via SMS.
    -   **IoT Sensors:** Future provision for real-time water quality sensor data.

-   **Backend (Django):**
    -   **Core Modules:** The server is built around distinct modules for **Data Collection**, **User Authentication**, **Prediction**, and **Alerting**.
    -   **Database:** A robust **PostgreSQL** database stores all structured data, from user information to health reports.
    -   **Processing Pipeline:**
        1.  **Rule-Based Engine:** A preliminary engine (`utils/rule_based_model.py`) scans incoming data for immediate red flags (e.g., a sudden spike in fever cases) and generates an initial text-based alert.
        2.  **AI-Powered Analysis (`prediction` app):** This is the core of our intelligent system. An `Ollama`-powered local LLM processes the initial alerts, extracts structured information (symptoms, severity, age groups), and calculates a nuanced **Outbreak Risk Score**.
        3.  **Actionable Summaries:** Based on the risk score and extracted data, the LLM generates a concise, actionable HTML summary with clear recommendations for health officials.
        4.  **Asynchronous Tasks:** **Celery** and **Redis** are used to run AI processing tasks asynchronously, ensuring the platform remains responsive.

-   **Frontend (React & Vite):**
    -   **Role-Based Dashboards:** The UI provides four distinct dashboards tailored to the needs of Admins, ASHA Workers, NGOs, and Clinics.
    -   **Admin Dashboard:** The central monitoring hub, featuring:
        -   An interactive **Leaflet map** visualizing all villages with color-coded risk levels.
        -   Dynamic charts (**Recharts**) for symptom distribution, severity breakdown, and monthly case trends.
        -   A comprehensive village watchlist and access to AI-generated summaries.
    -   **Data Entry Interfaces:** Intuitive forms for other user roles to submit data efficiently.

## 3. Core Features Implemented

-   **Multi-Source Data Ingestion:** The system successfully collects and processes data from ASHA workers, NGOs, and clinics.
-   **Role-Based Access Control (RBAC):** Secure authentication and authorization for four user roles, ensuring users only see relevant data and functionality.
-   **Dynamic Risk Scoring:** A sophisticated algorithm in the `admindashboard` service calculates a village's risk by weighting factors like case severity, volume, and environmental data from NGO surveys.
-   **AI-Powered Prediction & Summarization:** The `prediction` service uses an LLM to transform raw alerts into structured, actionable intelligence, including a calculated risk score and a ready-to-use summary report.
-   **Interactive Data Visualization:** The admin dashboard provides a rich, interactive experience with a live map and multiple charts, allowing for intuitive monitoring of the public health landscape.
-   **IVR & SMS Reporting:** The architecture is designed to seamlessly integrate with communication APIs like Twilio to support data reporting and alert dissemination for citizens in low-connectivity areas.

## 4. Technology Stack

-   **Backend:** Python, Django, Django REST Framework, Celery, Redis, PostgreSQL
-   **Frontend:** React, TypeScript, Vite, Tailwind CSS, shadcn/ui, Recharts, Leaflet
-   **AI/ML:** Ollama (Gemma model) for local LLM processing.

## 5. Future Scope & Enhancements

-   **Enhanced Prediction with Vector Databases:**
    -   **Objective:** To move beyond real-time data analysis and leverage historical patterns for more accurate, predictive insights.
    -   **Implementation:**
        1.  **Embedding:** Convert all historical and incoming data (reports, surveys, alerts, environmental notes) into numerical vector embeddings.
        2.  **Vector DB:** Store these embeddings in a specialized vector database (e.g., ChromaDB, Pinecone).
        3.  **Similarity Search:** When new data arrives, its vector will be used to find historically similar events. This allows the model to identify complex, non-obvious correlations (e.g., "a specific combination of mild symptoms during monsoon season in a village with poor drainage has previously led to a cholera outbreak").
    -   **Benefit:** This will significantly improve the accuracy and lead time of outbreak predictions, enabling truly pre-emptive action.

-   **Full-Scale IVR & SMS Implementation:** Build out the two-way IVR system to allow any citizen to report symptoms via a simple phone call and receive automated health advice in their local language.

-   **Offline-First Mobile Application:** Develop a native mobile app for ASHA workers and NGOs that allows for offline data collection and syncs automatically when connectivity is restored.

-   **Expanded IoT Sensor Network:** Deploy a wider network of IoT sensors for real-time monitoring of water quality (pH, turbidity, contaminants) and environmental data (humidity, temperature), feeding this data directly into the AI prediction models.
