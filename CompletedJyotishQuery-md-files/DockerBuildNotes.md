Here are the essential Dockerfile commands to follow best practices for a Python application:

### 1. Use a Slim Base Image
Start with a minimal base image to reduce size and attack surface.
```dockerfile
FROM python:3.12-slim
```

### 2. Set Environment Variables
Configure the environment to improve performance and reliability.
```dockerfile
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1
```

### 3. Set Working Directory
Define a dedicated directory for the application.
```dockerfile
WORKDIR /app
```

### 4. Copy and Install Dependencies First
Copy `requirements.txt` before source code to leverage Docker's layer caching. Dependencies are only reinstalled if this file changes.
```dockerfile
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
```

### 5. Copy Application Code
Copy the rest of the application code last, as it changes more frequently.
```dockerfile
COPY . .
```

### 6. Use a Non-Root User (Security)
Create and switch to a non-root user for running the application.
```dockerfile
RUN adduser --disabled-password --gecos '' appuser && chown -R appuser:appuser /app
USER appuser
```

### 7. Define the Startup Command
Specify the command to run your application.
```dockerfile
CMD ["python", "app.py"]
```



