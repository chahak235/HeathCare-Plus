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

ConvNeXt-XL (ImageNet-22K), 23 skin conditions, 384x384 input. Needs ~4 GB RAM.
Test accuracy: 80.65% top-1, 94.09% top-3 (2,300 test images).

The HealthCare+ API (`backend/src/routes/skin.routes.ts`) sends the image here and
shows the top 5 results. Visitors' browsers never call this service directly.

## Endpoints

- `GET /health` model info
- `POST /predict` form field `file` (JPG/PNG, max 10 MB) → top 5 `{class, label, probability}`

## Deploy on Google Cloud Run (recommended)

Cloud Run builds this folder from GitHub and runs it only while requests come in
(scale to zero), which normally stays inside Google Cloud's monthly free tier.

1. **Billing**: Google Cloud console → Billing → link a billing account (free trial) to the project.
2. **Model file**: Cloud Storage → Buckets → Create, name e.g. `healthcareplus-models`,
   location type *Region* `asia-southeast1` (Singapore), Standard class, *uniform* access,
   public access **prevented**. Upload `skin_disease_checkpoint.pt`.
3. **Service**: Cloud Run → Deploy container → *Continuously deploy from a repository* →
   connect GitHub `chahak235/HeathCare-Plus`, branch `^main$`, build type **Dockerfile**,
   source location `/skin-model-service/Dockerfile`.
   - Service name `skin-model`, region `asia-southeast1`, **Allow unauthenticated invocations**
     (the shared key below protects it).
   - Billing: *Request-based*. Min instances `0`, max instances `2`.
   - Container → Settings: memory **4 GiB**, CPU **2**, request timeout **300** s, *Startup CPU boost* on.
   - Container → Variables: `MODEL_GCS_URI=gs://healthcareplus-models/skin_disease_checkpoint.pt`
     and `SKIN_SERVICE_KEY=<same value as in backend/.env>`.
4. When deployed, open `<service URL>/health`; it says `loading`, then `ok` (about a minute).
5. On Render set `SKIN_MODEL_URL=<service URL>` and `SKIN_SERVICE_KEY` (same value).

The service reads the bucket with its default service account (Editor on the project).
If `/health` reports a 403 error, give that account the *Storage Object Viewer* role on the bucket.
The first photo after a quiet period waits ~1 minute while the model loads.

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
