import sys
import traceback

print("SCRIPT STARTED: test_clip.py is executing!")
print("Importing torch...")
import torch
print("Importing open_clip...")
import open_clip

print("Creating CLIP model with pretrained='openai'...")
try:
    model, _, preprocess = open_clip.create_model_and_transforms(
        "ViT-L-14",
        pretrained="openai"
    )
    print("CLIP loaded successfully!")
except BaseException as e:
    print("Caught exception:", type(e), e, file=sys.stderr)
    traceback.print_exc()
    sys.exit(1)
