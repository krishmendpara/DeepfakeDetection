import torch
import torchvision.models as models
import sys

print("Loading ResNet50...")
try:
    model = models.resnet50(weights=None)
    print("ResNet50 loaded successfully!")
except Exception as e:
    import traceback
    traceback.print_exc()
    sys.exit(1)
