import sys
import traceback

print("SCRIPT STARTED: test_model.py is executing!")
print("Importing model_service...")
from model_service import FusionModel

print("Instantiating FusionModel...")
try:
    model = FusionModel()
    print("FusionModel instantiated successfully!")
except BaseException as e:
    print("Exception caught:", type(e), e, file=sys.stderr)
    traceback.print_exc()
    sys.exit(1)
