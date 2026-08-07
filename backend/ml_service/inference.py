import io
import torch
from PIL import Image
from typing import Dict, Any, Union
from model_service import FusionModel, ModelConfig
from preprocessor import ProductionFacePreprocessor

class AIFaceDetectionService:
    def __init__(self, checkpoint_path: str, optimal_temperature: float = 0.7712, device: str = None):
        self.device = device or ("cuda" if torch.cuda.is_available() else "cpu")
        self.optimal_temp = optimal_temperature

        # 1. Load Preprocessor
        print(f"[Init] Setting up Preprocessor on {self.device}...")
        self.preprocessor = ProductionFacePreprocessor(device=self.device)

        # 2. Load Model & Weights
        print(f"[Init] Loading Model Weights from {checkpoint_path}...")
        self.model = FusionModel(ModelConfig()).to(self.device)
        checkpoint = torch.load(checkpoint_path, map_location=self.device)

        if isinstance(checkpoint, dict) and "model_state_dict" in checkpoint:
            self.model.load_state_dict(checkpoint["model_state_dict"])
        else:
            self.model.load_state_dict(checkpoint)

        self.model.eval()
        print("[Init] AI Detection Service successfully initialized and ready!")

    @torch.no_grad()
    def predict(self, image_input: Union[str, bytes, Image.Image]) -> Dict[str, Any]:
        """
        Accepts a file path, raw image bytes, or PIL Image.
        Returns a structured JSON payload.
        """
        # Parse image source
        if isinstance(image_input, str):
            image_pil = Image.open(image_input)
        elif isinstance(image_input, bytes):
            image_pil = Image.open(io.BytesIO(image_input))
        elif isinstance(image_input, Image.Image):
            image_pil = image_input
        else:
            raise ValueError("Unsupported image input type. Pass a file path, bytes, or PIL Image.")

        # 1. Preprocess Image
        tensor = self.preprocessor.process_pil_image(image_pil).to(self.device)

        # 2. TTA Forward Pass (Original + Horizontal Flip)
        logits_normal = self.model(tensor)
        logits_flipped = self.model(torch.flip(tensor, dims=[-1]))
        logits = (logits_normal + logits_flipped) / 2.0

        # 3. Temperature Scaling & Probability
        calibrated_logits = logits / self.optimal_temp
        prob = torch.sigmoid(calibrated_logits).item()

        # 4. Format Response: P(AI) >= 0.5 -> "fake", else -> "real"
        is_ai = prob >= 0.5
        confidence = prob if is_ai else (1.0 - prob)

        return {
            "status": "success",
            "is_ai": is_ai,
            "label": "fake" if is_ai else "real",
            "confidence": round(confidence * 100, 2),
            "raw_probability": round(prob, 4)
        }
