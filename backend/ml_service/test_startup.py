from inference import AIFaceDetectionService
import sys

try:
    print("Attempting to load model service...")
    service = AIFaceDetectionService(checkpoint_path="checkpoints/best_final_model.pt")
    print("Success: Model loaded successfully!")
except Exception as e:
    import traceback
    print("ERROR during startup:", file=sys.stderr)
    traceback.print_exc()
    sys.exit(1)
