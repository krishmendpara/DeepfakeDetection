import os
import sys
import logging
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware

# Ensure package imports work regardless of entry point
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

try:
    from backend.xai.inference_engine import ExplainableAIDetectionService
except ImportError:
    from inference_engine import ExplainableAIDetectionService

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("xai_service")

app = FastAPI(title="Explainable AI Deepfake Detection Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

service: ExplainableAIDetectionService = None

def resolve_checkpoint_path() -> str:
    candidates = [
        os.getenv("XAI_CHECKPOINT_PATH"),
        os.getenv("CHECKPOINT_PATH"),
        os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "ml_service", "checkpoints", "best_final_model.pt")),
        os.path.abspath(os.path.join(os.path.dirname(__file__), "checkpoints", "best_final_model.pt")),
        os.path.abspath("checkpoints/best_final_model.pt"),
    ]
    for candidate in candidates:
        if candidate and os.path.exists(candidate):
            return candidate
    return candidates[2]  # Default fallback path

@app.on_event("startup")
def startup_event():
    global service
    checkpoint_path = resolve_checkpoint_path()
    logger.info(f"Initializing Explainable AI Service with checkpoint: {checkpoint_path}")

    if not os.path.exists(checkpoint_path):
        raise FileNotFoundError(
            f"Checkpoint not found at '{checkpoint_path}'. "
            "Please ensure best_final_model.pt is present."
        )

    service = ExplainableAIDetectionService(checkpoint_path=checkpoint_path)
    logger.info("Explainable AI Service initialized and ready.")

@app.get("/health")
def health_check():
    if service is None:
        raise HTTPException(status_code=503, detail="Model service is starting up")
    return {"status": "healthy", "service": "ExplainableAIDetectionService"}

@app.post("/predict")
async def predict_image(file: UploadFile = File(...)):
    if service is None:
        raise HTTPException(status_code=503, detail="Model service is starting up")

    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Uploaded file is not an image.")

    try:
        image_bytes = await file.read()
        result = service.predict(image_bytes)

        # Return backward-compatible fields + new XAI fields
        return {
            "status": "success",
            "is_ai": result["is_ai"],
            "label": result["label"],          # "fake" or "real" (maintains exact compatibility)
            "display_label": result["display_label"], # "AI-Generated" or "Real Photo"
            "confidence": result["confidence"],
            "raw_probability": result["raw_probability"],
            "explanations": result["explanations"],
            "heatmap_base64": result["heatmap_base64"],
            "face_crop_base64": result["face_crop_base64"]
        }
    except Exception as e:
        logger.exception("XAI Inference failed")
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")
