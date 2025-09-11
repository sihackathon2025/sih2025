## Setup Instructions

1.  **Navigate to the backend directory:**

    ```bash
    cd backend
    ```

2.  **Create and activate a virtual environment:**

    ```bash
    python3 -m venv venv
    source venv/bin/activate
    ```

3.  **Install dependencies:**

    ```bash
    pip install -r requirements.txt
    ```

4.  **Set up environment variables:**
    - Copy the example environment file:
      ```bash
      cp .env.example .env
      ```
    - Open the `.env` file and fill in the required values (e.g., database URL, Twilio credentials).

5.  **Apply database migrations:**

    ```bash
    python manage.py migrate
    ```

6.  **Run the development server:**
    ```bash
    python manage.py runserver
    ```

The backend server will be running at `http://127.0.0.1:8000/`.
