# Conversational Image Recognition Chatbot

An AI-powered application that combines Computer Vision and Conversational AI to enable users to upload images and interact with them using natural language.

---

## 📌 Problem Statement

Users often encounter images containing rich visual information, complex scenes, or multiple objects, but lack an intuitive, interactive way to query and explore that content conversationally. Traditional computer vision applications typically output static bounding boxes and raw confidence tables without conversational assistance.

The goal of this project is to build an AI-powered conversational chatbot where a user can upload an image, receive an automatic visual understanding breakdown, and ask questions in natural language (Visual Question Answering) to explore the visual scene interactively across multiple conversational turns.

---

## 🎯 Phase 2 Status: Conversational Image Question Answering

This repository currently implements **Phase 1 (Image Understanding)** and **Phase 2 (Conversational Question Answering)** (~66% of the complete system).

### ✨ What is working in Phase 2:
1. **Interactive Conversational UI:** Split-view responsive layout connecting visual image preview & detections with a live chat interface.
2. **Persistent Image Conversation State:** The system preserves image context across multiple conversational turns, allowing users to ask continuous follow-up questions without re-uploading the image.
3. **Context Reset on New Upload:** Selecting or uploading a new image automatically clears previous dialogue history and creates a fresh isolated conversation context.
4. **Hybrid / Dual AI Engine Architecture:**
   - **Grounded Local Vision QA Engine:** Pre-configured and running out of the box with zero external dependencies. Grounds answers directly in the computer vision pipeline (YOLOv8 detected objects, quantities, spatial positioning, aspect ratios, and dialogue history).
   - **Multimodal AI API Integration (Gemini / OpenAI):** Optional configuration via `GEMINI_API_KEY` or `OPENAI_API_KEY` for rich multimodal vision-language answering with automatic fallback.
5. **Grounded Answer Quality:**
   - Communicates uncertainty honestly if an asked detail cannot be determined from the image (e.g. *"I cannot determine that from the visible information in this image."*).
   - Avoids hallucinating objects that are not present.
   - Resolves follow-up pronouns (*"it"*, *"they"*, *"where is it?"*, *"what is it doing?"*) using recent dialogue turns.
6. **Dedicated Chat REST APIs:**
   - `POST /api/chat`: Processes natural language questions grounded in the active image session.
   - `POST /api/chat/clear`: Clears conversation history while keeping the image context.
   - `GET /api/chat/history/{conversation_id}`: Retrieves message history.
7. **Phase 1 Functionality Preserved:** Format and size validation, sub-second YOLOv8 object detection, and labeled bounding box toggles continue working seamlessly.

---

## 🛠 Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React 19, Vite, Tailwind CSS v4, Lucide Icons | Responsive conversational split-screen UI |
| **Backend** | Python 3.14 / 3.10+, FastAPI, Uvicorn | Asynchronous REST API & conversation state manager |
| **Vision Model** | Ultralytics YOLOv8 (`yolov8n.pt`), PyTorch, Pillow | Pretrained deep-learning object detection |
| **Conversational AI** | Hybrid: Grounded Vision Engine + Gemini / OpenAI API | Visual question answering & dialogue generation |
| **Testing** | Pytest, FastAPI TestClient, Oxlint | End-to-end API, Q&A logic, and frontend lint tests |

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
│   │   │   ├── ImageUpload.jsx   # Drag-and-drop upload & sample presets
│   │   │   ├── ImagePreview.jsx  # Preview canvas, controls & bounding boxes
│   │   │   ├── DetectionResults.jsx # Clean detected objects & confidence scores
│   │   │   └── ChatSection.jsx   # Interactive conversational Q&A chat
│   │   ├── services/
│   │   │   └── api.js            # Frontend API client (upload, chat, clear)
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
│   │   │   ├── image_routes.py   # REST API route handlers for image upload
│   │   │   └── chat_routes.py    # REST API route handlers for conversational Q&A
│   │   ├── services/
│   │   │   ├── image_analyzer.py # Isolated YOLOv8 inference service
│   │   │   ├── conversation_manager.py # In-memory session & dialogue history
│   │   │   └── chatbot.py        # Dedicated AI question answering service
│   │   ├── models/
│   │   │   └── schemas.py        # Pydantic request/response schemas
│   │   └── utils/
│   │       └── image_validator.py# Type, size, and image byte validation
│   ├── weights/
│   │   └── yolov8n.pt            # Pretrained YOLOv8 nano model weights
│   ├── tests/
│   │   └── test_api.py           # Automated test suite (Phase 1 & Phase 2)
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

4. *(Optional)* Configure API Keys in `backend/.env`:
   ```bash
   cp .env.example .env
   # Add GEMINI_API_KEY=your_key or OPENAI_API_KEY=your_key (optional)
   ```
   *Note: If no API key is provided, the system automatically uses the local Grounded Vision QA Engine.*

5. Start the FastAPI backend server:
   ```bash
   uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
   ```

   The backend will be live at:
   - **Base URL:** `http://127.0.0.1:8000`
   - **Interactive Swagger UI:** `http://127.0.0.1:8000/docs`
   - **Health Check Endpoint:** `http://127.0.0.1:8000/api/health`

---

### Step 3: Frontend Setup & Startup

1. In a new terminal window, navigate to the `frontend/` directory:
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

### 1. Image Analysis & Session Creation
- **Endpoint:** `POST /api/analyze-image`
- **Content-Type:** `multipart/form-data`
- **Response (200 OK):**
```json
{
  "success": true,
  "conversation_id": "da4db6766772",
  "detections": [
    {
      "label": "bus",
      "confidence": 0.87,
      "box": { "x1": 22.96, "y1": 231.14, "x2": 804.87, "y2": 756.85 }
    },
    {
      "label": "person",
      "confidence": 0.87,
      "box": { "x1": 48.49, "y1": 398.58, "x2": 245.4, "y2": 902.76 }
    }
  ],
  "total_detected": 2,
  "unique_labels": ["bus", "person"],
  "filename": "bus.jpg",
  "image_width": 810,
  "image_height": 1080,
  "message": "Detected 2 objects (bus, person)"
}
```

### 2. Conversational Image Question Answering
- **Endpoint:** `POST /api/chat`
- **Content-Type:** `application/json`
- **Request Body:**
```json
{
  "conversation_id": "da4db6766772",
  "question": "Where is the bus located?"
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "answer": "The bus is located in the center of the image.",
  "conversation_id": "da4db6766772",
  "source": "grounded_vision_engine"
}
```

### 3. Clear Conversation History
- **Endpoint:** `POST /api/chat/clear`
- **Content-Type:** `application/json`
- **Request Body:** `{"conversation_id": "da4db6766772"}`
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "Conversation history cleared successfully.",
  "conversation_id": "da4db6766772"
}
```

---

## 🔍 Conversational Image Q&A Workflow

```
[User Browser]
      │
      │ 1. Uploads Image
      ▼
[POST /api/analyze-image]
      │ 2. Validates format & dimensions
      │ 3. Pretrained YOLOv8 runs object detection
      │ 4. ConversationManager initializes session with image + detections
      │ 5. Returns conversation_id + detected objects
      ▼
[User asks: "What is in the image?"]
      │
      ▼
[POST /api/chat { conversation_id, question }]
      │ 6. ConversationManager retrieves active session & prior turns
      │ 7. Appends user question to dialogue history
      │ 8. ChatbotService executes:
      │    ├─ Option A: Multimodal API (Gemini / OpenAI) if key configured
      │    └─ Option B: Grounded Vision Engine (interprets detections, counts, positions)
      │ 9. Appends assistant response to dialogue history
      ▼
[Frontend UI renders message bubble]
      │
      ▼
[User asks follow-up: "Where is it?" without re-uploading]
      │ 10. Chatbot resolves pronoun "it" using previous dialogue context
      ▼
[Answer returned immediately in ongoing conversation]
```

---

## 🧪 Automated Testing

An automated test suite is provided in `backend/tests/test_api.py`:

```bash
cd backend
source venv/bin/activate
PYTHONPATH=. python3 tests/test_api.py
```

### Tests Covered:
- ✅ Phase 1 Health check & Root endpoint
- ✅ Image upload with multiple objects (`bus.jpg`)
- ✅ Image upload with zero detected objects (`empty_scene.jpg`)
- ✅ Rejection of invalid file types, corrupted files, and empty files
- ✅ Rejection of empty questions and missing/nonexistent conversation IDs
- ✅ Multi-turn conversation workflow:
  - "What is in this image?"
  - "What objects are visible?"
  - Follow-up question: "Where is the bus?"
  - Question about detected object: "How many people are there?"
  - Uncertain question: "What color are the socks of the driver?" (Communicates uncertainty)
- ✅ Conversation history retrieval and clear chat functionality
- ✅ Session isolation: Uploading a new image clears old context with zero cross-image leakage

---

## ⚠️ Current Limitations (Phase 2)

1. **In-Memory Conversation Store:** Conversation sessions are maintained in server memory. Restarting the backend server clears active sessions.
2. **Text-Based VQA Only:** Question answering operates via text chat. Speech/audio interaction is not yet implemented.
3. **Static Image Scope:** Only one active image is queried per conversation session.

---

## 🔮 Roadmap for Phase 3

- **Optical Character Recognition (OCR):** Reading text, street signs, and documents in images (EasyOCR / Tesseract).
- **Persistent Database:** SQLite / PostgreSQL conversation persistence across backend restarts.
- **Image Bounding Box Focusing:** Clicking a detected object chip or bounding box to ask questions specifically about that region.
- **Voice / Speech-to-Text Input:** Microphone recording for spoken natural language questions.
- **Docker Containerization:** Dockerfile and docker-compose for one-command deployment.
