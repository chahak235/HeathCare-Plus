# Hugging Face Spaces (Docker SDK) image for the skin condition model
FROM python:3.12-slim
RUN useradd -m -u 1000 user
WORKDIR /home/user/app
COPY --chown=user requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
# app.py plus, if uploaded to the Space, skin_disease_checkpoint.pt (Git LFS).
# Without the file, set HF_MODEL_REPO so it downloads at start-up (see README.md).
COPY --chown=user . .
USER user
ENV HOME=/home/user PYTHONUNBUFFERED=1
EXPOSE 7860
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "7860"]
