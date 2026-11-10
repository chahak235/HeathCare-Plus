"""
Skin condition model server (ConvNeXt-XL, 23 classes) for HealthCare+.

Runs on a free Hugging Face Space (Docker) or any machine with ~3 GB RAM.
The HealthCare+ API calls POST /predict; browsers never call this directly.

Environment:
  MODEL_PATH        local checkpoint path (default: skin_disease_checkpoint.pt)
  HF_MODEL_REPO     optional Hugging Face model repo to download the checkpoint from
  HF_MODEL_FILE     file name inside that repo (default: skin_disease_checkpoint.pt)
  SKIN_SERVICE_KEY  optional shared secret; when set, requests need header X-Api-Key
"""
import io
import os
import time

import numpy as np
import timm
import torch
import torch.nn.functional as F
from fastapi import FastAPI, File, Header, HTTPException, UploadFile
from PIL import Image, UnidentifiedImageError
from torchvision import transforms

MAX_BYTES = 10 * 1024 * 1024
TOP_K = 5

torch.set_num_threads(max(1, os.cpu_count() or 1))


def checkpoint_path() -> str:
    path = os.environ.get("MODEL_PATH", "skin_disease_checkpoint.pt")
    if os.path.exists(path):
        return path
    repo = os.environ.get("HF_MODEL_REPO")
    if repo:
        from huggingface_hub import hf_hub_download

        return hf_hub_download(repo_id=repo, filename=os.environ.get("HF_MODEL_FILE", "skin_disease_checkpoint.pt"))
    raise FileNotFoundError(f"Checkpoint not found at {path} and HF_MODEL_REPO is not set")


def load_model():
    # weights_only keeps loading safe: only tensors plus the numpy scalars the checkpoint stores
    safe = [np._core.multiarray.scalar, np.dtype, type(np.dtype("float64")), type(np.dtype("float32"))]
    with torch.serialization.safe_globals(safe):
        ckpt = torch.load(checkpoint_path(), map_location="cpu", weights_only=True)
    names = list(ckpt["class_names"])
    model = timm.create_model(ckpt.get("model_name", "convnext_xlarge.fb_in22k_ft_in1k_384"), pretrained=False, num_classes=len(names))
    model.load_state_dict(ckpt["model_state"])
    model = model.float().eval()  # float32 is faster than bfloat16 on most CPUs
    info = {
        "model": ckpt.get("model_name"),
        "img_size": int(ckpt.get("img_size", 384)),
        "top1_acc": float(ckpt.get("top1_acc", 0)),
        "top3_acc": float(ckpt.get("top3_acc", 0)),
        "classes": names,
    }
    return model, info


t0 = time.time()
MODEL, INFO = load_model()
SIZE = INFO["img_size"]
print(f"Loaded {INFO['model']} ({len(INFO['classes'])} classes) in {time.time() - t0:.1f}s", flush=True)

_norm = transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
_base = transforms.Compose([transforms.Resize(SIZE + 32), transforms.CenterCrop(SIZE), transforms.ToTensor(), _norm])

app = FastAPI(title="HealthCare+ skin model")


@app.get("/")
@app.get("/health")
def health():
    return {"status": "ok", "model": INFO["model"], "classes": len(INFO["classes"]), "top1_acc": INFO["top1_acc"], "top3_acc": INFO["top3_acc"]}


@torch.no_grad()
def predict(img: Image.Image):
    x = _base(img.convert("RGB")).unsqueeze(0)
    # Two-view test-time augmentation (original + mirror): steadier than one view, half the cost of five
    batch = torch.cat([x, torch.flip(x, dims=[3])], dim=0)
    probs = F.softmax(MODEL(batch), dim=-1).mean(dim=0).numpy()
    order = np.argsort(probs)[::-1][:TOP_K]
    return [{"class": INFO["classes"][i], "label": INFO["classes"][i].replace("_", " "), "probability": float(probs[i])} for i in order]


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
    start = time.time()
    preds = predict(img)
    return {
        "predictions": preds,
        "model": INFO["model"],
        "top1_acc": INFO["top1_acc"],
        "top3_acc": INFO["top3_acc"],
        "processing_ms": int((time.time() - start) * 1000),
    }
