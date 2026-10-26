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

## Persistent Remote Storage & Cross-Device Access (Step F)

The system supports cross-device persistence: all uploads, analysis history, heatmaps, and crops are stored remotely in cloud storage and MongoDB Atlas, accessible from any device upon login.

### 1. MongoDB Atlas Setup Guide
1. **Create Free Tier Cluster**:
   - Sign up / log in to [MongoDB Atlas](https://www.mongodb.com/atlas).
   - Create an M0 Free Tier Shared Cluster (select your preferred cloud provider and region).
2. **Create Database User**:
   - Under **Security** -> **Database Access**, click **Add New Database User**.
   - Choose Password authentication, enter a username and strong password, and assign **Read and write to any database** privilege.
3. **Configure Network Access**:
   - Under **Security** -> **Network Access**, click **Add IP Address**.
   - Add `0.0.0.0/0` (Allow Access from Anywhere) for seamless cross-device testing, or add your specific IP address.
4. **Get Connection String**:
   - In **Databases**, click **Connect** -> **Drivers** (Node.js).
   - Copy the SRV connection URI: `mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority`.
   - Paste into `server/.env` as `MONGO_URI`.

### 2. One-Time Data Migration Script
To copy existing scan history, users, and metadata from your local database (`mongodb_data` / local mongod) to MongoDB Atlas without creating duplicates:
```bash
node server/utils/migrateLocalData.js
```
The script uses idempotent upserts (`upsert: true`), making it completely safe to re-run at any time.

### 3. Remote Image Storage: Cloudinary with MongoDB GridFS Fallback
The backend uses in-memory file buffers (`multer.memoryStorage()`) and never relies on local disk storage (`server/uploads/`):
* **Cloudinary (Recommended)**: Images, heatmaps, and face crops are uploaded to Cloudinary's global CDN. URLs (`https://res.cloudinary.com/...`) are stored in MongoDB.
  - Keeps the MongoDB Atlas 512 MB free tier quota from exhausting.
  - Fast, global CDN delivery to all devices.
* **MongoDB GridFS (Automatic Fallback)**: If Cloudinary credentials are not provided in `.env`, the server automatically streams binary image chunks into MongoDB Atlas via GridFS and serves them through `/api/media/:id`.

### 4. Cross-Device & LAN Deployment
To access the app from another laptop, tablet, or phone on the same local network:
1. **Find Host Laptop's Local IP**:
   - On Windows: run `ipconfig` (e.g. `192.168.1.50`).
2. **Configure Frontend**:
   - In `frontend/.env`:
     ```env
     VITE_API_URL=http://192.168.1.50:5001/api
     ```
3. **Configure Server CORS**:
   - In `server/.env`:
     ```env
     CLIENT_URL=http://localhost:5173,http://192.168.1.50:5173
     ```
4. **Run Services**:
   - On host laptop, run `npm run dev -- --host` inside `frontend`.
   - On the second device, open `http://192.168.1.50:5173` in any browser. All scans, login sessions, and history will sync in real time!

---

## Configuration Reference

### Server Environment (`server/.env` / `server/.env.example`)
* `PORT`: Express server listening port (default: `5001`).
* `MONGO_URI`: MongoDB Atlas connection string (or local fallback).
* `JWT_SECRET`: Secret key for signing and verifying JWT tokens.
* `ML_SERVICE_URL`: URL to the FastAPI inference microservice (`http://localhost:8000/predict`).
* `CLIENT_URL`: Allowed CORS origin(s) separated by commas (e.g. `http://localhost:5173,http://192.168.1.50:5173`).
* `CLOUDINARY_CLOUD_NAME`: *(Optional)* Cloudinary cloud name.
* `CLOUDINARY_API_KEY`: *(Optional)* Cloudinary API key.
* `CLOUDINARY_API_SECRET`: *(Optional)* Cloudinary API secret.

### Frontend Environment (`frontend/.env` / `frontend/.env.example`)
* `VITE_API_URL`: Base API endpoint for backend calls (e.g. `http://localhost:5001/api` or `http://<LAN-IP>:5001/api`).

