from safetensors.torch import load_file
import os
import sys

path = r"C:\Users\krish\.cache\huggingface\hub\models--timm--vit_large_patch14_clip_224.openai\snapshots\18d0535469bb561bf468d76c1d73aa35156c922b\open_clip_model.safetensors"

if not os.path.exists(path):
    print(f"Error: Path does not exist: {path}")
    sys.exit(1)

print("File size:", os.path.getsize(path))
print("Attempting to load safetensors file...")
try:
    weights = load_file(path)
    print("Keys loaded successfully! Number of keys:", len(weights.keys()))
except Exception as e:
    import traceback
    traceback.print_exc()
    sys.exit(1)
