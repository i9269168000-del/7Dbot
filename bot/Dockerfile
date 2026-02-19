FROM python:3.11-slim
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libffi-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements (bot uses same deps?)
# Ideally bot has its own requirements.txt, but we can reuse backend's for simplicity if they are mixed
# or just copy requirements.txt to root?
# Let's check if bot has separate requirements.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy bot code
COPY bot/ ./bot
# Copy shared backend config if needed? (No, bot has its own config.py)

# Set working directory to bot folder (so relative imports work if any)
WORKDIR /app/bot

# Run the bot
CMD ["python", "main.py"]
