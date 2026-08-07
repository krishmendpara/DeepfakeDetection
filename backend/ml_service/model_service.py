from dataclasses import dataclass
import torch
import torch.nn as nn
import torch.nn.functional as F
import torchvision.models as models
import open_clip

@dataclass
class ModelConfig:
    hidden1: int = 512
    hidden2: int = 256
    feature_dropout: float = 0.1
    fc_dropout: float = 0.4

class FrozenFaceBackbone(nn.Module):
    embedding_dim = 512
    def __init__(self):
        super().__init__()
        self.model = models.resnet50(weights=None)
        self.model.fc = nn.Linear(self.model.fc.in_features, self.embedding_dim)
        self.model.eval()
        for p in self.model.parameters():
            p.requires_grad_(False)

        self.register_buffer("mean", torch.tensor([0.5, 0.5, 0.5]).view(1, 3, 1, 1))
        self.register_buffer("std", torch.tensor([0.5, 0.5, 0.5]).view(1, 3, 1, 1))

    def forward(self, x01):
        x = (x01 - self.mean) / self.std
        emb = self.model(x)
        return F.normalize(emb, dim=1)


class FrozenCLIPBackbone(nn.Module):
    embedding_dim = 768
    def __init__(self):
        super().__init__()
        model, _, _ = open_clip.create_model_and_transforms('ViT-L-14', pretrained='openai')
        self.model = model.visual
        self.model.eval()
        for p in self.model.parameters():
            p.requires_grad_(False)

        clip_mean = [0.48145466, 0.4578275, 0.40821073]
        clip_std = [0.26862954, 0.26130258, 0.27577711]
        self.register_buffer("mean", torch.tensor(clip_mean).view(1, 3, 1, 1))
        self.register_buffer("std", torch.tensor(clip_std).view(1, 3, 1, 1))

    def forward(self, x01):
        x = (x01 - self.mean) / self.std
        feat = self.model(x)
        return F.normalize(feat.float(), dim=1)


class FusionHead(nn.Module):
    def __init__(self, face_dim: int, clip_dim: int, hidden1: int, hidden2: int, feat_drop: float, fc_drop: float):
        super().__init__()
        self.input_norm = nn.LayerNorm(face_dim + clip_dim)
        self.feature_dropout = nn.Dropout(feat_drop)
        self.net = nn.Sequential(
            nn.Linear(face_dim + clip_dim, hidden1),
            nn.BatchNorm1d(hidden1),
            nn.GELU(),
            nn.Dropout(fc_drop),
            nn.Linear(hidden1, hidden2),
            nn.BatchNorm1d(hidden2),
            nn.GELU(),
            nn.Dropout(fc_drop),
            nn.Linear(hidden2, 1),
        )

    def forward(self, face_emb, clip_emb):
        x = torch.cat([face_emb, clip_emb], dim=1)
        return self.net(self.feature_dropout(self.input_norm(x))).squeeze(1)


class FusionModel(nn.Module):
    def __init__(self, cfg: ModelConfig = ModelConfig()):
        super().__init__()
        self.face_backbone = FrozenFaceBackbone()
        self.clip_backbone = FrozenCLIPBackbone()
        self.head = FusionHead(
            self.face_backbone.embedding_dim,
            self.clip_backbone.embedding_dim,
            cfg.hidden1, cfg.hidden2, cfg.feature_dropout, cfg.fc_dropout
        )

    def forward(self, x_384):
        clip_input = F.interpolate(x_384, size=(224, 224), mode='bicubic', antialias=True)
        crop_size = int(x_384.shape[-1] * 0.8)
        start = (x_384.shape[-1] - crop_size) // 2
        face_crop = x_384[:, :, start:start + crop_size, start:start + crop_size]
        face_input = F.interpolate(face_crop, size=(112, 112), mode='bicubic', antialias=True)
        return self.head(self.face_backbone(face_input), self.clip_backbone(clip_input))
