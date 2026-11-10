---
title: HealthCare Plus Skin Model
emoji: 🩺
colorFrom: blue
colorTo: indigo
sdk: docker
app_port: 7860
pinned: false
---

# HealthCare+ skin condition model

ConvNeXt-XL (ImageNet-22K), 23 skin conditions, 384x384 input.
Test accuracy: 80.65% top-1, 94.09% top-3 (2,300 test images).

The HealthCare+ API (`backend/src/routes/skin.routes.ts`) sends the image here and
shows the top 5 results. Visitors' browsers never call this service directly.

## Endpoints

- `GET /health` model info
- `POST /predict` form field `file` (JPG/PNG, max 10 MB) → top 5 `{class, label, probability}`

## Deploy on Hugging Face Spaces (free CPU, 16 GB RAM)

1. Create a Space: SDK **Docker**, hardware **CPU basic (free)**.
2. Upload `app.py`, `requirements.txt`, `Dockerfile`, this `README.md`, and
   `skin_disease_checkpoint.pt` (about 700 MB; the web uploader stores it with Git LFS).
3. Optional: in Space **Settings → Variables and secrets**, add secret `SKIN_SERVICE_KEY`.
4. When the Space shows **Running**, open `https://<user>-<space>.hf.space/health`.
5. On Render set `SKIN_MODEL_URL=https://<user>-<space>.hf.space` (and `SKIN_SERVICE_KEY` if you set one).

Free Spaces sleep after 48 hours without use; the first request after that takes a few minutes.

## Run locally

```bash
pip install -r requirements.txt
MODEL_PATH=/path/to/skin_disease_checkpoint.pt uvicorn app:app --port 5001
```
