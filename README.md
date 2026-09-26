# Conversational Image Recognition Chatbot

An AI-powered application that combines Computer Vision and Conversational AI to enable users to upload images and interact with them using natural language.

---

## 📌 Problem Statement

Users often encounter images containing rich visual information, complex scenes, or multiple objects, but lack an intuitive, interactive way to query and explore that content conversationally. Traditional computer vision applications typically output static bounding boxes and raw confidence tables without conversational assistance. 

The goal of this project is to build an AI-powered conversational chatbot where a user can upload an image, receive an automatic visual understanding breakdown, and in subsequent phases, ask questions in natural language (Visual Question Answering) to explore the visual scene interactively.

---

## 🎯 Phase 1 Scope & Functionality

This repository contains **Phase 1: Project Foundation + Image Understanding** (~33% of the complete system).

### What is working in Phase 1:
1. **Web Interface:** Modern chatbot-style UI built with React, Vite, and Tailwind CSS.
2. **Image Ingestion:** Supports drag-and-drop, direct file browsing, and 1-click sample presets.
3. **Validation Engine:** Strict verification of image formats (`JPEG`, `PNG`, `WebP`, `BMP`), file size limits (≤10 MB), and image integrity.
4. **Pretrained Vision Model:** Integrated Ultralytics YOLOv8 nano (`yolov8n.pt`) preloaded at backend startup for sub-second object detection.
5. **Image Analysis API:** Dedicated `POST /api/analyze-image` REST endpoint returning structured JSON with detected objects, category tags, and confidence percentages.
6. **Visual Results Display:** Clean display of detected objects formatted simply (e.g., `Person — 94%`, `Bus — 87%`) with confidence visual bars and optional bounding box visualization.
7. **Graceful Error Handling:** Comprehensive handling for corrupt files, non-image formats, oversized payloads, and images with 0 detected objects.
8. **Phase 2 Ready:** Modular separation between routes, services, schemas, and UI components ready for conversational VQA integration.

---

## 🛠 Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React 19, Vite, Tailwind CSS v4, Lucide Icons | Responsive modern chatbot interface |
| **Backend** | Python 3.14 / 3.10+, FastAPI, Uvicorn | High-performance asynchronous REST API |
| **Computer Vision** | Ultralytics YOLOv8 (`yolov8n.pt`), PyTorch, Pillow | Pretrained deep-learning object detection |
| **Testing** | Pytest, FastAPI TestClient, Oxlint | End-to-end API and UI linting test suites |

---

## 📁 Project Structure

```
project-root/
│
├── frontend/                     # React + Vite frontend application
│   ├── public/
│   │   └── samples/              # Built-in sample images for 1-click testing
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.jsx        # App header & model connection status
│   │   │   ├── ImageUpload.jsx   # Drag-and-drop upload & sample selector
│   │   │   ├── ImagePreview.jsx  # Preview canvas, controls & bounding boxes
│   │   │   └── DetectionResults.jsx # Clean detected objects & confidence scores
│   │   ├── services/
│   │   │   └── api.js            # Frontend API client
│   │   ├── App.jsx               # Main conversational chatbot layout
│   │   ├── main.jsx              # React DOM entrypoint
│   │   └── index.css             # Tailwind CSS styles
│   ├── package.json
│   └── vite.config.js
│
├── backend/                      # FastAPI Python backend
│   ├── app/
│   │   ├── main.py               # FastAPI entrypoint, CORS, model lifespan
│   │   ├── routes/
│   │   │   └── image_routes.py   # REST API route handlers
│   │   ├── services/
│   │   │   └── image_analyzer.py # Isolated YOLOv8 inference service
│   │   ├── models/
│   │   │   └── schemas.py        # Pydantic request/response schemas
│   │   └── utils/
│   │       └── image_validator.py# Type, size, and image byte validation
│   ├── weights/
│   │   └── yolov8n.pt            # Pretrained YOLOv8 nano model weights
│   ├── tests/
│   │   └── test_api.py           # Automated backend test suite
│   ├── requirements.txt          # Python dependencies
│   └── .env.example              # Environment variable template
│
├── sample_images/                # Sample test images (bus, zidane, empty_scene)
├── README.md                     # Project documentation
└── .gitignore
```

---

## 🚀 Installation & Setup Instructions

### Prerequisites
- **Node.js** (v18 or higher) and `npm`
- **Python** (v3.10 or higher) and `pip`

---

### Step 1: Clone or Navigate to the Repository

```bash
cd /Applications/hacathon
```

---

### Step 2: Backend Setup & Startup

1. Navigate to the `backend/` directory:
   ```bash
   cd backend
   ```

2. Create and activate a Python virtual environment:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```

3. Install required Python packages:
   ```bash
   pip install -r requirements.txt
   ```

4. Start the FastAPI backend server:
   ```bash
   uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
   ```

   The backend will be live at:
   - **Base URL:** `http://127.0.0.1:8000`
   - **Interactive API Docs (Swagger UI):** `http://127.0.0.1:8000/docs`
   - **Health Check Endpoint:** `http://127.0.0.1:8000/api/health`

---

### Step 3: Frontend Setup & Startup

1. Open a new terminal and navigate to the `frontend/` directory:
   ```bash
   cd /Applications/hacathon/frontend
   ```

2. Install dependencies (if not already installed):
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to:
   ```
   http://127.0.0.1:5173
   ```

---

## 📡 API Documentation

### 1. Analyze Image Endpoint

- **Endpoint:** `POST /api/analyze-image`
- **Content-Type:** `multipart/form-data`
- **Form Parameters:**
  - `file` *(UploadFile, required)*: The image file to analyze (`.jpg`, `.jpeg`, `.png`, `.webp`, `.bmp`).
  - `confidence_threshold` *(float, optional)*: Custom confidence score threshold between `0.0` and `1.0` (default: `0.25`).

#### Example Request (cURL):
```bash
curl -X POST http://127.0.0.1:8000/api/analyze-image \
  -F "file=@sample_images/bus.jpg"
```

#### Example Success Response (200 OK):
```json
{
  "success": true,
  "detections": [
    {
      "label": "bus",
      "confidence": 0.87,
      "box": {
        "x1": 22.96,
        "y1": 231.14,
        "x2": 804.87,
        "y2": 756.85
      }
    },
    {
      "label": "person",
      "confidence": 0.87,
      "box": {
        "x1": 48.49,
        "y1": 398.58,
        "x2": 245.4,
        "y2": 902.76
      }
    }
  ],
  "total_detected": 2,
  "unique_labels": [
    "bus",
    "person"
  ],
  "filename": "bus.jpg",
  "image_width": 810,
  "image_height": 1080,
  "message": "Detected 2 objects (bus, person)"
}
```

#### Example Error Response (400 Bad Request):
```json
{
  "success": false,
  "error": "Unsupported file format '.pdf'. Allowed formats: .bmp, .jpeg, .jpg, .png, .webp.",
  "detections": []
}
```

### 2. Health Check Endpoint

- **Endpoint:** `GET /api/health`
- **Response (200 OK):**
```json
{
  "status": "healthy",
  "service": "Conversational Image Recognition Chatbot API",
  "phase": 1,
  "model_loaded": true
}
```

---

## 🔍 How the Image-Analysis Pipeline Works

```
[User Browser]
      │
      │ 1. Drag-and-drop or select image
      ▼
[Frontend Client]
      │ 2. Client-side MIME & size validation
      │ 3. POST /api/analyze-image (multipart/form-data)
      ▼
[FastAPI Route (image_routes.py)]
      │ 4. Read file bytes asynchronously
      │ 5. Validate file extension, MIME type, size <= 10MB
      ▼
[Image Validator (image_validator.py)]
      │ 6. Verify image byte integrity using Pillow
      │ 7. Extract image dimensions (width, height)
      ▼
[Image Analyzer Service (image_analyzer.py)]
      │ 8. Convert to RGB mode
      │ 9. Pass through preloaded YOLOv8 nano model
      │ 10. Extract object classes, confidence scores, coordinates
      │ 11. Sort detections descending by confidence score
      ▼
[Structured Response]
      │ 12. Return JSON { success: true, detections: [...] }
      ▼
[Frontend UI]
      │ 13. Display image in chat stream
      │ 14. Render detected objects (e.g. Person — 94%) & confidence bars
      │ 15. Optionally overlay bounding boxes via interactive toggle
```

---

## 🧪 Automated Testing

A test suite is included in `backend/tests/test_api.py` verifying all 10 Phase 1 requirements:

To execute the test suite:
```bash
cd backend
source venv/bin/activate
PYTHONPATH=. python3 tests/test_api.py
```

### Tests Covered:
- ✅ Backend health endpoint (`/api/health`)
- ✅ Root info endpoint (`/`)
- ✅ Image upload with multiple objects (`bus.jpg`)
- ✅ Image upload with zero detected objects (`empty_scene.jpg`)
- ✅ Rejection of invalid file extensions (e.g., `.txt`)
- ✅ Rejection of corrupted image binaries
- ✅ Rejection of empty 0-byte uploads
- ✅ Rejection of missing form payloads

---

## ⚠️ Current Limitations (Phase 1)

1. **Object Detection Only:** Phase 1 focuses exclusively on visual object detection and categorization. Natural language conversational Q&A is reserved for Phase 2.
2. **COCO Class Scope:** The YOLOv8 nano model detects 80 standard everyday object classes (people, vehicles, common animals, office items, etc.). Very specialized or abstract objects are not yet covered.
3. **Single Image Context:** The system currently processes one active image at a time. Multi-image conversation sessions will be added in future phases.

---

## 🔮 Future Roadmap (Phase 2 & Phase 3)

### Phase 2: Conversational Question Answering (VQA)
- Integrate a Vision-Language Model (VLM) or multimodal LLM (e.g., BLIP-2 / LLaVA / Gemini Vision API) to answer questions about uploaded images.
- Full conversational chat thread where users can ask questions like:
  - *"What color is the car on the left?"*
  - *"How many people are waiting near the bus?"*
  - *"What is written on the sign?"*
- Conversation history memory across multiple conversational turns.

### Phase 3: Advanced Multimodal Intelligence & Production Polish
- OCR (Optical Character Recognition) for reading text inside images.
- Image region zoom & selective querying (ask questions about specific bounding box areas).
- Voice input / speech-to-text for asking questions orally.
- Export chat session transcripts and detection reports.
- Containerization with Docker for one-command deployment.
