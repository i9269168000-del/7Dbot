# ─── Stage 1: Build Frontend ──────────────────────────────────────────────────
FROM node:18-alpine as frontend_build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
# Build generates dist/ folder
RUN npm run build

# ─── Stage 2: Setup Backend ───────────────────────────────────────────────────
FROM python:3.11-slim
WORKDIR /app

# Install system dependencies (if needed)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libffi-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy root requirements (context is root)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ ./backend

# Copy built frontend assets from Stage 1 to backend/frontend/dist
# Our main.py expects: Path(__file__).parent.parent / "frontend" / "dist"
# So inside container: /app/backend/../frontend/dist -> /app/frontend/dist
COPY --from=frontend_build /app/frontend/dist /app/frontend/dist

# Set working directory to backend where main.py is
WORKDIR /app/backend

# Expose port
EXPOSE 8000

# Command to run
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
