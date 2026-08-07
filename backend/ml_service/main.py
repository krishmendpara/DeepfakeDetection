import os
import logging
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from inference import AIFaceDetectionService

# Setup logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ml_service")

app = FastAPI(title="Deepfake Detection ML Service")

# Allow CORS just in case
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
    checkpoint_path = os.getenv("CHECKPOINT_PATH", "checkpoints/best_final_model.pt")
    logger.info(f"Initializing AI Detection Service with checkpoint: {checkpoint_path}")
    
    if not os.path.exists(checkpoint_path):
        raise FileNotFoundError(
            f"Checkpoint not found at {checkpoint_path}. "
            "Please ensure best_final_model.pt is placed in backend/ml_service/checkpoints/"
        )
    
    service = AIFaceDetectionService(checkpoint_path=checkpoint_path)
    logger.info("AI Detection Service successfully loaded and ready for requests.")

@app.get("/health")
def health_check():
    if service is None:
        raise HTTPException(status_code=503, detail="Model service is starting up")
    return {"status": "healthy"}

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
        
        # Return response matching the required contract
        return {
            "label": result["label"],
            "confidence": result["confidence"],
            "raw_probability": result["raw_probability"]
        }
        
    except Exception as e:
        logger.exception("Inference failed")
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")
