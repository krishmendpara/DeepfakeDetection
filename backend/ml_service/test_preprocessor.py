import sys
import traceback

print("SCRIPT STARTED: test_preprocessor.py is executing!")
print("Importing preprocessor...")
from preprocessor import ProductionFacePreprocessor

print("Initializing preprocessor...")
try:
    preprocessor = ProductionFacePreprocessor()
    print("Preprocessor loaded successfully!")
except BaseException as e:
    print("Exception caught:", type(e), e, file=sys.stderr)
    traceback.print_exc()
    sys.exit(1)
