import numpy as np
import cv2
from PIL import Image
import torch
import albumentations as A
from albumentations.pytorch import ToTensorV2
from insightface.app import FaceAnalysis

class ProductionFacePreprocessor:
    def __init__(self, device: str = "cpu", offline_margin: float = 1.4, master_size: int = 384):
        self.device = device
        self.offline_margin = offline_margin
        self.master_size = master_size
        self.fallback_center_crop_frac = 0.8

        self.detector = FaceAnalysis(
            name="buffalo_l",
            allowed_modules=["detection"],
            providers=["CUDAExecutionProvider"] if device == "cuda" else ["CPUExecutionProvider"],
        )
        self.detector.prepare(ctx_id=0 if device == "cuda" else -1, det_size=(640, 640))
        self.transform = A.Compose([ToTensorV2()])

    def _expand_and_square_box(self, box, margin):
        x1, y1, x2, y2 = box
        cx, cy = (x1 + x2) / 2, (y1 + y2) / 2
        side = max(x2 - x1, y2 - y1) * margin
        half = side / 2
        return cx - half, cy - half, cx + half, cy + half

    def _crop_with_reflect_pad(self, image_pil, box):
        img_w, img_h = image_pil.size
        x1, y1, x2, y2 = [int(round(v)) for v in box]
        pad_left = max(0, -x1)
        pad_top = max(0, -y1)
        pad_right = max(0, x2 - img_w)
        pad_bottom = max(0, y2 - img_h)

        if any([pad_left, pad_top, pad_right, pad_bottom]):
            arr = np.array(image_pil)
            arr = np.pad(arr, ((pad_top, pad_bottom), (pad_left, pad_right), (0, 0)), mode="reflect")
            image_pil = Image.fromarray(arr)
            x1, y1, x2, y2 = x1 + pad_left, y1 + pad_top, x2 + pad_left, y2 + pad_top

        return image_pil.crop((x1, y1, x2, y2))

    def process_pil_image(self, image_pil: Image.Image) -> tuple[torch.Tensor, Image.Image]:
        """Returns both the tensor (1, 3, 384, 384) and the cropped PIL image (needed for heatmap overlay)."""
        image_pil = image_pil.convert("RGB")
        bgr = np.array(image_pil)[:, :, ::-1]
        faces = self.detector.get(bgr)

        if not faces:
            img_w, img_h = image_pil.size
            side = min(img_w, img_h) * self.fallback_center_crop_frac
            cx, cy = img_w / 2, img_h / 2
            inner_box = (cx - side / 2, cy - side / 2, cx + side / 2, cy + side / 2)
        else:
            best = max(faces, key=lambda f: f.det_score)
            x1, y1, x2, y2 = best.bbox
            inner_box = (float(x1), float(y1), float(x2), float(y2))

        box = self._expand_and_square_box(inner_box, self.offline_margin)
        cropped = self._crop_with_reflect_pad(image_pil, box)
        resized_crop = cropped.resize((self.master_size, self.master_size), Image.Resampling.LANCZOS)

        img_array = np.array(resized_crop)
        tensor = self.transform(image=img_array)["image"].float() / 255.0
        return tensor.unsqueeze(0), resized_crop
