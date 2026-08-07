import torch
import sys
import traceback
from model_service import FusionModel

print("SCRIPT STARTED: test_load_weights.py")
print("Loading FusionModel...")
model = FusionModel()
print("Loading state dict from checkpoints/best_final_model.pt...")
try:
    checkpoint = torch.load("checkpoints/best_final_model.pt", map_location="cpu")
    print("Checkpoint loaded into CPU memory!")
    if isinstance(checkpoint, dict) and "model_state_dict" in checkpoint:
        model.load_state_dict(checkpoint["model_state_dict"])
    else:
        model.load_state_dict(checkpoint)
    print("State dict loaded successfully!")
except BaseException as e:
    print("Exception caught:", type(e), e, file=sys.stderr)
    traceback.print_exc()
    sys.exit(1)
