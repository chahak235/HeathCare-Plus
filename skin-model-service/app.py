"""
Skin condition model server (ConvNeXt-XL, 23 classes) for HealthCare+.

Runs on Google Cloud Run, a Hugging Face Space (Docker), or any machine with
~4 GB RAM. The HealthCare+ API calls POST /predict; browsers never call this.

Environment:
  MODEL_PATH        local checkpoint path (default: skin_disease_checkpoint.pt)
  MODEL_GCS_URI     gs://bucket/path/skin_disease_checkpoint.pt  (Cloud Run: read
                    with the service's own identity, no keys needed)
  HF_MODEL_REPO     Hugging Face model repo to download the checkpoint from
  HF_MODEL_FILE     file name inside that repo (default: skin_disease_checkpoint.pt)
  SKIN_SERVICE_KEY  optional shared secret; when set, requests need header X-Api-Key
  PORT              port to listen on (Cloud Run sets 8080; default 7860)

The web server starts at once and the model loads in the background, so the
host's start-up check passes; /predict waits for the model if it is still loading.
"""
import io
import json
import os
import shutil
import threading
import time
import urllib.parse
import urllib.request

import numpy as np
import timm
import torch
import torch.nn.functional as F
from fastapi import FastAPI, File, Header, HTTPException, UploadFile
from PIL import Image, UnidentifiedImageError
from torchvision import transforms

MAX_BYTES = 10 * 1024 * 1024
TOP_K = 5
LOAD_WAIT_S = 240

torch.set_num_threads(max(1, os.cpu_count() or 1))


def _download_gcs(uri: str) -> str:
    """Download gs://bucket/object using the Cloud Run service account (metadata server token)."""
    bucket, _, obj = uri[len("gs://"):].partition("/")
    token_req = urllib.request.Request(
        "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token",
        headers={"Metadata-Flavor": "Google"},
    )
    with urllib.request.urlopen(token_req, timeout=10) as r:
        token = json.load(r)["access_token"]
    url = f"https://storage.googleapis.com/storage/v1/b/{bucket}/o/{urllib.parse.quote(obj, safe='')}?alt=media"
    dest = "/tmp/skin_disease_checkpoint.pt"
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {token}"})
    t = time.time()
    with urllib.request.urlopen(req, timeout=600) as r, open(dest, "wb") as f:
        shutil.copyfileobj(r, f, length=8 * 1024 * 1024)
    print(f"Downloaded {uri} in {time.time() - t:.1f}s", flush=True)
    return dest


def checkpoint_path() -> str:
    path = os.environ.get("MODEL_PATH", "skin_disease_checkpoint.pt")
    if os.path.exists(path):
        return path
    gcs = os.environ.get("MODEL_GCS_URI")
    if gcs:
        return _download_gcs(gcs)
    repo = os.environ.get("HF_MODEL_REPO")
    if repo:
        from huggingface_hub import hf_hub_download

        return hf_hub_download(repo_id=repo, filename=os.environ.get("HF_MODEL_FILE", "skin_disease_checkpoint.pt"))
    raise FileNotFoundError(f"Checkpoint not found at {path}; set MODEL_GCS_URI or HF_MODEL_REPO")


def load_model():
    path = checkpoint_path()
    # weights_only keeps loading safe: only tensors plus the numpy scalars the checkpoint stores
    safe = [np._core.multiarray.scalar, np.dtype, type(np.dtype("float64")), type(np.dtype("float32"))]
    with torch.serialization.safe_globals(safe):
        ckpt = torch.load(path, map_location="cpu", weights_only=True)
    if path.startswith("/tmp/"):
        os.remove(path)  # /tmp on Cloud Run uses memory: free it once loaded
    names = list(ckpt["class_names"])
    info = {
        "model": ckpt.get("model_name", "convnext_xlarge.fb_in22k_ft_in1k_384"),
        "img_size": int(ckpt.get("img_size", 384)),
        "top1_acc": float(ckpt.get("top1_acc", 0)),
        "top3_acc": float(ckpt.get("top3_acc", 0)),
        "classes": names,
    }
    model = timm.create_model(info["model"], pretrained=False, num_classes=len(names))
    model.load_state_dict(ckpt["model_state"])
    del ckpt
    model = model.float().eval()  # float32 is faster than bfloat16 on most CPUs
    return model, info


STATE = {"model": None, "info": None, "error": None, "transform": None}
READY = threading.Event()


def _load_in_background():
    t0 = time.time()
    try:
        model, info = load_model()
        size = info["img_size"]
        STATE["info"] = info
        norm = transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
        STATE["transform"] = transforms.Compose([transforms.Resize(size + 32), transforms.CenterCrop(size), transforms.ToTensor(), norm])
        STATE["model"] = model
        print(f"Model ready ({len(info['classes'])} classes) in {time.time() - t0:.1f}s", flush=True)
    except Exception as e:  # keep serving so /health can report the problem
        STATE["error"] = f"{type(e).__name__}: {e}"
        print(f"Model failed to load: {STATE['error']}", flush=True)
    finally:
        READY.set()


threading.Thread(target=_load_in_background, daemon=True).start()

app = FastAPI(title="HealthCare+ skin model")


@app.get("/")
@app.get("/health")
def health():
    if STATE["error"]:
        return {"status": "error", "error": STATE["error"]}
    if not STATE["model"]:
        return {"status": "loading"}
    info = STATE["info"]
    return {"status": "ok", "model": info["model"], "classes": len(info["classes"]), "top1_acc": info["top1_acc"], "top3_acc": info["top3_acc"]}


@torch.no_grad()
def predict(img: Image.Image):
    x = STATE["transform"](img.convert("RGB")).unsqueeze(0)
    # Two-view test-time augmentation (original + mirror): steadier than one view, half the cost of five
    batch = torch.cat([x, torch.flip(x, dims=[3])], dim=0)
    probs = F.softmax(STATE["model"](batch), dim=-1).mean(dim=0).numpy()
    names = STATE["info"]["classes"]
    order = np.argsort(probs)[::-1][:TOP_K]
    return [{"class": names[i], "label": names[i].replace("_", " "), "probability": float(probs[i])} for i in order]


@app.post("/predict")
async def predict_route(file: UploadFile = File(...), x_api_key: str | None = Header(default=None)):
    key = os.environ.get("SKIN_SERVICE_KEY")
    if key and x_api_key != key:
        raise HTTPException(status_code=401, detail="Invalid API key")
    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="Empty file")
    if len(data) > MAX_BYTES:
        raise HTTPException(status_code=413, detail="Image larger than 10 MB")
    try:
        img = Image.open(io.BytesIO(data))
        img.load()
    except (UnidentifiedImageError, OSError):
        raise HTTPException(status_code=400, detail="Not a readable image")
    if not READY.wait(LOAD_WAIT_S) or not STATE["model"]:
        raise HTTPException(status_code=503, detail=STATE["error"] or "Model is still loading, try again shortly")
    start = time.time()
    preds = predict(img)
    info = STATE["info"]
    return {
        "predictions": preds,
        "model": info["model"],
        "top1_acc": info["top1_acc"],
        "top3_acc": info["top3_acc"],
        "processing_ms": int((time.time() - start) * 1000),
    }
