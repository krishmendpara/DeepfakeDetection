import os
import sys
import logging
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware

# Ensure backend.xai and root can be resolved
repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if repo_root not in sys.path:
    sys.path.insert(0, repo_root)
xai_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "xai"))
if xai_dir not in sys.path:
    sys.path.insert(0, xai_dir)

try:
    from backend.xai.inference_engine import ExplainableAIDetectionService
except ImportError:
    try:
        from inference_engine import ExplainableAIDetectionService
    except ImportError:
        ExplainableAIDetectionService = None

from inference import AIFaceDetectionService

# Setup logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ml_service")

app = FastAPI(title="Deepfake Detection ML Service with XAI")

# Allow CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global service instance
service = None

@app.on_event("startup")
def load_model():
    global service
    checkpoint_path = os.getenv(
        "XAI_CHECKPOINT_PATH",
        os.getenv("CHECKPOINT_PATH", "checkpoints/best_final_model.pt")
    )
    
    # Check alternate locations if relative path fails
    if not os.path.exists(checkpoint_path):
        candidates = [
            os.path.abspath(os.path.join(os.path.dirname(__file__), "checkpoints", "best_final_model.pt")),
            os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "ml_service", "checkpoints", "best_final_model.pt")),
        ]
        for candidate in candidates:
            if os.path.exists(candidate):
                checkpoint_path = candidate
                break

    logger.info(f"Initializing AI Detection Service with checkpoint: {checkpoint_path}")
    
    if not os.path.exists(checkpoint_path):
        raise FileNotFoundError(
            f"Checkpoint not found at {checkpoint_path}. "
            "Please ensure best_final_model.pt is placed in backend/ml_service/checkpoints/"
        )
    
    if ExplainableAIDetectionService is not None:
        logger.info("Loading ExplainableAIDetectionService (XAI mode enabled)...")
        service = ExplainableAIDetectionService(checkpoint_path=checkpoint_path)
    else:
        logger.warning("ExplainableAIDetectionService not available; falling back to AIFaceDetectionService.")
        service = AIFaceDetectionService(checkpoint_path=checkpoint_path)

    logger.info("AI Detection Service successfully loaded and ready for requests.")

@app.get("/health")
def health_check():
    if service is None:
        raise HTTPException(status_code=503, detail="Model service is starting up")
    return {
        "status": "healthy",
        "service": type(service).__name__
    }

@app.post("/predict")
async def predict_image(file: UploadFile = File(...)):
    if service is None:
        raise HTTPException(status_code=503, detail="Model service is starting up")
    
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Uploaded file is not an image.")
    
    try:
        # Read raw image bytes
        image_bytes = await file.read()
        
        # Run inference
        result = service.predict(image_bytes)
        
        # Build response preserving existing contract + adding XAI fields
        response_data = {
            "status": result.get("status", "success"),
            "is_ai": result.get("is_ai", result["label"] == "fake"),
            "label": result["label"], # "fake" or "real" (contract preserved)
            "display_label": result.get("display_label", "AI-Generated" if result["label"] == "fake" else "Real Photo"),
            "confidence": result["confidence"],
            "raw_probability": result.get("raw_probability")
        }

        if "explanations" in result:
            response_data["explanations"] = result["explanations"]
        if "heatmap_base64" in result:
            response_data["heatmap_base64"] = result["heatmap_base64"]
        if "face_crop_base64" in result:
            response_data["face_crop_base64"] = result["face_crop_base64"]

        return response_data
        
    except Exception as e:
        logger.exception("Inference failed")
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")
