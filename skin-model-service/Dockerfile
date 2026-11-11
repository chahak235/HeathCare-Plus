# Image for the skin condition model: Google Cloud Run or Hugging Face Spaces (Docker)
FROM python:3.12-slim
RUN useradd -m -u 1000 user
WORKDIR /home/user/app
COPY --chown=user requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
# app.py (plus skin_disease_checkpoint.pt when it was uploaded next to it).
# Cloud Run: keep the file in Cloud Storage and set MODEL_GCS_URI (see README.md).
COPY --chown=user . .
USER user
ENV HOME=/home/user PYTHONUNBUFFERED=1
EXPOSE 7860
# Cloud Run sets PORT (8080); Hugging Face Spaces uses 7860
CMD ["sh", "-c", "uvicorn app:app --host 0.0.0.0 --port ${PORT:-7860}"]
