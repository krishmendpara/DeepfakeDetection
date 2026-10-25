import io
import base64
import torch
import torch.nn as nn
import numpy as np
import cv2
from PIL import Image
from typing import Dict, Any, Union
from captum.attr import Saliency

from .model import FusionModel, ModelConfig
from .preprocessing import ProductionFacePreprocessor

class CaptumWrapper(nn.Module):
    def __init__(self, model):
        super().__init__()
        self.model = model

    def forward(self, x):
        return self.model(x).unsqueeze(1)


def pil_to_base64(img: Image.Image, format: str = "PNG") -> str:
    buf = io.BytesIO()
    img.save(buf, format=format)
    return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode("utf-8")


class ExplainableAIDetectionService:
    def __init__(self, checkpoint_path: str, optimal_temperature: float = 0.7712, device: str = None):
        self.device = device or ("cuda" if torch.cuda.is_available() else "cpu")
        self.optimal_temp = optimal_temperature

        print(f"[Init] Starting Explainable AI Service on {self.device}...")
        self.preprocessor = ProductionFacePreprocessor(device=self.device)
        self.model = FusionModel(ModelConfig()).to(self.device)

        checkpoint = torch.load(checkpoint_path, map_location=self.device)

        # strict=False allows skipping missing CLIP text encoder keys from older weights
        if isinstance(checkpoint, dict) and "model_state_dict" in checkpoint:
            self.model.load_state_dict(checkpoint["model_state_dict"], strict=False)
        else:
            self.model.load_state_dict(checkpoint, strict=False)

        self.model.eval()
        self.saliency_engine = Saliency(CaptumWrapper(self.model))
        self._init_concepts()

        print("[Init] Explainable AI Service successfully initialized and ready!")

    def _init_concepts(self):
        self.ai_concepts = [
            "unnatural smooth skin texture",
            "asymmetric facial features or pupils",
            "synthetic lighting and artificial glow",
            "blurry edges and digital artifacts"
        ]
        self.real_concepts = [
            "natural skin pores and fine wrinkles",
            "authentic camera lighting and shadow depth",
            "realistic hair strands",
            "natural photo grain"
        ]
        self.ai_embeds = self.model.clip_backbone.encode_concepts(self.ai_concepts, self.device)
        self.real_embeds = self.model.clip_backbone.encode_concepts(self.real_concepts, self.device)

    def _generate_heatmap_base64(self, input_tensor: torch.Tensor, face_crop_pil: Image.Image) -> str:
        input_tensor.requires_grad_()
        grads = self.saliency_engine.attribute(input_tensor, target=0)

        # 1. Get raw pixel gradients
        grads = grads.squeeze().cpu().detach().numpy()
        grads = np.max(np.abs(grads), axis=0)

        # 2. Heavy Gaussian Blur
        grads = cv2.GaussianBlur(grads, (75, 75), 0)

        # 3. Widen the hotspots
        p90 = np.percentile(grads, 90.0)
        grads = np.clip(grads, 0, p90)

        # 4. Standard Normalize
        grads = (grads - np.min(grads)) / (np.max(grads) - np.min(grads) + 1e-8)

        # 5. Reveal more areas (Noise floor)
        grads[grads < 0.05] = 0

        # 6. Apply Colors
        heatmap = np.uint8(255 * grads)
        heatmap_color = cv2.applyColorMap(heatmap, cv2.COLORMAP_JET)

        # 7. Alpha Blending (Translucent overlay)
        orig_cv = cv2.cvtColor(np.array(face_crop_pil), cv2.COLOR_RGB2BGR)
        alpha = np.expand_dims(grads, axis=-1)

        # Multiply by 1.5 to keep colors vibrant, but HARD CAP at 0.55 (55% opacity)
        alpha = np.clip(alpha * 1.5, 0, 0.55)

        superimposed = (orig_cv * (1 - alpha) + heatmap_color * alpha).astype(np.uint8)

        _, buffer = cv2.imencode('.png', superimposed)
        return "data:image/png;base64," + base64.b64encode(buffer).decode('utf-8')

    @torch.no_grad()
    def _get_concept_explanations(self, clip_embed: torch.Tensor, is_ai: bool) -> list:
        concepts = self.ai_concepts if is_ai else self.real_concepts
        text_embeds = self.ai_embeds if is_ai else self.real_embeds

        similarities = (clip_embed @ text_embeds.T).squeeze(0)
        scores = torch.softmax(similarities * 10, dim=-1).cpu().numpy()

        results = []
        for i, concept in enumerate(concepts):
            results.append({
                "concept": concept,
                "relevance_pct": round(float(scores[i]) * 100, 1)
            })

        results.sort(key=lambda x: x["relevance_pct"], reverse=True)
        return results[:3]

    def predict(self, image_input: Union[str, bytes, Image.Image]) -> Dict[str, Any]:
        if isinstance(image_input, str):
            image_pil = Image.open(image_input)
        elif isinstance(image_input, bytes):
            image_pil = Image.open(io.BytesIO(image_input))
        elif isinstance(image_input, Image.Image):
            image_pil = image_input
        else:
            raise ValueError("Unsupported image input type. Pass a file path, bytes, or PIL Image.")

        tensor, face_crop_pil = self.preprocessor.process_pil_image(image_pil)
        tensor = tensor.to(self.device)

        with torch.no_grad():
            logits = self.model(tensor)
            clip_embed = self.model.get_clip_embedding(tensor)
            prob = torch.sigmoid(logits / self.optimal_temp).item()

        is_ai = prob >= 0.5
        confidence = prob if is_ai else (1.0 - prob)

        explanations = self._get_concept_explanations(clip_embed, is_ai)

        with torch.enable_grad():
            heatmap_b64 = self._generate_heatmap_base64(tensor.clone(), face_crop_pil)

        face_crop_b64 = pil_to_base64(face_crop_pil)

        return {
            "status": "success",
            "is_ai": is_ai,
            "label": "fake" if is_ai else "real",
            "display_label": "AI-Generated" if is_ai else "Real Photo",
            "confidence": round(confidence * 100, 2),
            "raw_probability": round(prob, 4),
            "explanations": explanations,
            "heatmap_base64": heatmap_b64,
            "face_crop_base64": face_crop_b64,
            "cropped_image": face_crop_pil
        }
