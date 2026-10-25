# Deepfake & AI Image Detection System

This repository contains a full-stack MERN application integrated with a PyTorch-based hybrid deepfake detection pipeline (utilizing ResNet50 and CLIP backbones).

## Project Architecture

```
DeepfakeDetection/
├── backend/
│   ├── IPD_F1.ipynb ... IPD_Production.ipynb, IPD_XAI.ipynb
│   ├── ml_service/           # FastAPI service running PyTorch inference
│   │   ├── checkpoints/      # Model weights (best_final_model.pt)
│   │   ├── main.py           # FastAPI server with XAI integration
│   │   └── requirements.txt  # Python requirements (including captum)
│   └── xai/                  # Dedicated Explainable AI module
│       ├── model.py          # FusionModel with CLIP text & vision encoders
│       ├── preprocessing.py  # Production face preprocessor (buffalo_l)
│       ├── inference_engine.py # Captum Saliency & CLIP concept explainer
│       ├── xai_service.py    # Dedicated XAI FastAPI microservice
│       └── requirements.txt  # XAI requirements
├── server/                   # Node/Express backend server
│   ├── config/               # Database config
│   ├── controllers/          # Auth & Prediction controller logic
│   ├── middleware/           # JWT security & Multer file uploading
│   ├── models/               # MongoDB models (User, Prediction with XAI fields)
│   ├── routes/               # Express endpoints
│   ├── utils/                # JWT token helpers
│   ├── uploads/              # Uploaded static image storage (images, heatmaps)
│   ├── server.js             # Main express application entrypoint
│   └── .env                  # Port, MongoDB connection, JWT Secret config
└── frontend/                 # Vite & React landing page frontend (UI/UX)
```

---

## Explainable AI (XAI) Feature

The application provides transparent, interpretable deepfake detection using Explainable AI:
1. **Spatial Attribution Heatmap (Captum Saliency)**: Overlays a pixel attribution heatmap highlighting the exact facial regions (eyes, nose, skin boundaries) that influenced the model's decision (red/warm regions = strongest influence).
2. **Semantic Concept Insights (CLIP ViT-L-14)**: Computes zero-shot similarity scores across synthetic/authentic facial concepts (e.g., unnatural smooth skin texture, asymmetric pupils, artificial glow) to yield top-3 ranked explanatory attributes with relevance percentages.
3. **Graceful Fallback & Full Backward Compatibility**: Existing database records and API consumers remain 100% compatible. Old history entries without XAI metadata render cleanly without errors or layout shifts.

### New Dependency
*   `captum>=0.7.0` (PyTorch model interpretability library).

Install via:
```bash
pip install captum
# OR
pip install -r backend/ml_service/requirements.txt
```

### New Response Fields
The `/predict` and `/api/prediction/analyze` endpoints return the existing contract plus additive XAI fields:
*   `label`: `"fake"` or `"real"` (original contract preserved)
*   `display_label`: `"AI-Generated"` or `"Real Photo"`
*   `confidence`: `0.0` - `100.0`
*   `explanations`: Top-3 CLIP semantic concepts with relevance scores:
    ```json
    [
      { "concept": "asymmetric facial features or pupils", "relevance_pct": 32.5 },
      { "concept": "unnatural smooth skin texture", "relevance_pct": 24.6 },
      { "concept": "synthetic lighting and artificial glow", "relevance_pct": 22.1 }
    ]
    ```
*   `heatmapUrl`: Static URL serving the saved Captum overlay PNG in `server/uploads/`
*   `heatmap_base64`: Direct PNG data URI (`data:image/png;base64,...`) for instant rendering
*   `faceCropUrl` / `face_crop_base64`: Preprocessed face crop used for side-by-side forensic comparison

---

## Getting Started

Follow the instructions below to set up and run the entire stack.

### 1. Python Inference Service
Ensure you have Python 3.10+ installed.

```bash
# Navigate to the Python microservice directory
cd backend/ml_service

# Install dependencies (includes torch, torchvision, open-clip-torch, insightface, captum, etc.)
pip install -r requirements.txt

# Run the FastAPI server on port 8000
uvicorn main:app --host 0.0.0.0 --port 8000
```
The ML service will start up, load the `buffalo_l` face detector, the PyTorch weights (`checkpoints/best_final_model.pt`), and the Captum interpretability engine into memory once, exposing `http://localhost:8000/predict`.

---

### 2. Node/Express Backend Server
Ensure you have Node.js 18+ installed.

```bash
# Navigate to the Express server directory
cd server

# Install NPM dependencies
npm install

# Start the dev server with nodemon (runs on http://localhost:5000)
npm run dev
```

The Express server handles authentication, MongoDB Atlas persistence (including optional heatmap and explanations metadata), static file serving (`/uploads`), and forwards image uploads to the FastAPI microservice.

---

### 3. React Frontend Website
Ensure you have Node.js installed.

```bash
# Navigate to the React frontend directory
cd frontend

# Install package dependencies
npm install

# Run the Vite development server (usually runs on http://localhost:5173)
npm run dev
```

Visit the application in your browser at `http://localhost:5173`.

---

## Configuration (`server/.env`)

The Express backend configures connection credentials through `server/.env`:
*   `PORT=5000`
*   `MONGO_URL=mongodb+srv://krishmendpara4:krish3329@atlasclustertest.rjcrnb7.mongodb.net/ipdProject`
*   `JWT_SECRET=supersecretkeyjwt12345`
*   `ML_SERVICE_URL=http://localhost:8000/predict`
*   `XAI_CHECKPOINT_PATH` *(optional)*: Override path to `best_final_model.pt` if stored in a custom directory.
