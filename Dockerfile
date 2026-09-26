# 1) compila o frontend
FROM node:22-alpine AS frontend
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# 2) backend Python servindo a API e o frontend compilado
FROM python:3.12-slim
WORKDIR /app/backend
ENV PYTHONUNBUFFERED=1 FRONTEND_DIST=/app/frontend/dist DATABASE_URL=sqlite:////data/prospecta.db
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/ ./
COPY --from=frontend /app/frontend/dist /app/frontend/dist
RUN mkdir -p /data
EXPOSE 8000
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
