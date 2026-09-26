import io
from pathlib import Path
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)
ROOT_DIR = Path(__file__).resolve().parent.parent.parent
SAMPLE_DIR = ROOT_DIR / "sample_images"


def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["phase"] == 1
    assert data["model_loaded"] is True
    print("✓ Health check passed")


def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["phase"] == 2
    assert data["status"] == "online"
    assert data["chat_endpoint"] == "/api/chat"
    print("✓ Root endpoint passed (Phase 2)")


def test_analyze_image_with_objects():
    bus_path = SAMPLE_DIR / "bus.jpg"
    assert bus_path.exists(), f"Sample image {bus_path} not found"

    with open(bus_path, "rb") as f:
        response = client.post(
            "/api/analyze-image",
            files={"file": ("bus.jpg", f, "image/jpeg")},
        )

    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["total_detected"] > 0
    assert len(data["detections"]) > 0
    assert "conversation_id" in data and data["conversation_id"] is not None

    # Verify detection structure
    first_det = data["detections"][0]
    assert "label" in first_det
    assert "confidence" in first_det
    assert isinstance(first_det["label"], str)
    assert 0.0 <= first_det["confidence"] <= 1.0

    labels = [d["label"] for d in data["detections"]]
    assert "bus" in labels or "person" in labels
    print(f"✓ Detected objects in bus.jpg: {data['unique_labels']} (session: {data['conversation_id']})")
    return data["conversation_id"]


def test_analyze_transparent_man_laptop_chair_image():
    chair_path = SAMPLE_DIR / "man_laptop_chair.png"
    assert chair_path.exists(), f"Sample image {chair_path} not found"

    with open(chair_path, "rb") as f:
        response = client.post(
            "/api/analyze-image",
            files={"file": ("man_laptop_chair.png", f, "image/png")},
        )

    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True

    labels = [d["label"] for d in data["detections"]]
    class_ids = [d.get("class_id") for d in data["detections"]]

    print(f"✓ Detections for man_laptop_chair: {labels} (class_ids: {class_ids})")

    # 1. Verify umbrella is NOT detected (was a black background artifact)
    assert "umbrella" not in labels, f"Error: umbrella falsely detected: {labels}"

    # 2. Verify laptop IS detected
    assert "laptop" in labels, f"Error: laptop missing from detections: {labels}"

    # 3. Verify person and chair are detected
    assert "person" in labels, f"Error: person missing from detections: {labels}"
    assert "chair" in labels, f"Error: chair missing from detections: {labels}"

    # 4. Verify class IDs correspond correctly to COCO taxonomy
    for det in data["detections"]:
        if det["label"] == "person":
            assert det["class_id"] == 0
        elif det["label"] == "chair":
            assert det["class_id"] == 56
        elif det["label"] == "laptop":
            assert det["class_id"] == 63

    print("✓ Successfully verified correct detection of Person, Laptop, and Chair with zero Umbrella!")
    return data["conversation_id"]


def test_analyze_image_no_objects():
    empty_path = SAMPLE_DIR / "empty_scene.jpg"
    assert empty_path.exists(), f"Sample image {empty_path} not found"

    with open(empty_path, "rb") as f:
        response = client.post(
            "/api/analyze-image",
            files={"file": ("empty_scene.jpg", f, "image/jpeg")},
        )

    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["total_detected"] == 0
    assert len(data["detections"]) == 0
    assert len(data["unique_labels"]) == 0
    assert "conversation_id" in data
    print("✓ Successfully handled image with 0 detected objects")
    return data["conversation_id"]


def test_analyze_invalid_extension():
    response = client.post(
        "/api/analyze-image",
        files={"file": ("document.txt", io.BytesIO(b"Hello world!"), "text/plain")},
    )
    assert response.status_code == 400
    data = response.json()
    assert data["success"] is False
    assert "Unsupported file format" in data["error"] or "Invalid content type" in data["error"]
    print(f"✓ Invalid extension rejected correctly: {data['error']}")


def test_analyze_corrupt_image():
    corrupt_bytes = b"NOT_A_REAL_IMAGE_RANDOM_GARBAGE_BYTES_123456"
    response = client.post(
        "/api/analyze-image",
        files={"file": ("fake.jpg", io.BytesIO(corrupt_bytes), "image/jpeg")},
    )
    assert response.status_code == 400
    data = response.json()
    assert data["success"] is False
    assert "not a valid image" in data["error"].lower() or "corrupt" in data["error"].lower()
    print(f"✓ Corrupted image rejected correctly: {data['error']}")


def test_analyze_empty_file():
    response = client.post(
        "/api/analyze-image",
        files={"file": ("empty.jpg", io.BytesIO(b""), "image/jpeg")},
    )
    assert response.status_code == 400
    data = response.json()
    assert data["success"] is False
    assert "empty" in data["error"].lower()
    print(f"✓ Empty file rejected correctly: {data['error']}")


# =========================================================================
# Phase 2 Conversational Image Question Answering Tests
# =========================================================================

def test_chat_invalid_inputs():
    # 1. Non-existent conversation ID
    res = client.post("/api/chat", json={"conversation_id": "nonexistent_999", "question": "What is this?"})
    assert res.status_code == 404
    assert res.json()["success"] is False
    assert "No active image" in res.json()["error"]
    print("✓ Nonexistent conversation ID rejected correctly with 404")

    # 2. Empty question
    res = client.post("/api/chat", json={"conversation_id": "some_id", "question": "   "})
    assert res.status_code == 400
    assert res.json()["success"] is False
    assert "cannot be empty" in res.json()["error"]
    print("✓ Empty question rejected correctly with 400")

    # 3. Missing conversation ID
    res = client.post("/api/chat", json={"conversation_id": "", "question": "Hello?"})
    assert res.status_code == 400
    assert res.json()["success"] is False
    print("✓ Missing conversation ID rejected correctly with 400")


def test_chat_conversation_workflow():
    # 1. Upload image
    bus_path = SAMPLE_DIR / "bus.jpg"
    with open(bus_path, "rb") as f:
        upload_res = client.post("/api/analyze-image", files={"file": ("bus.jpg", f, "image/jpeg")})
    assert upload_res.status_code == 200
    cid = upload_res.json()["conversation_id"]
    assert cid is not None
    print(f"✓ Started conversation session: {cid}")

    # 2. Ask "What is in this image?"
    res1 = client.post("/api/chat", json={"conversation_id": cid, "question": "What is in this image?"})
    assert res1.status_code == 200
    data1 = res1.json()
    assert data1["success"] is True
    assert "bus" in data1["answer"].lower() or "person" in data1["answer"].lower()
    print(f"✓ Q: 'What is in this image?' -> A: '{data1['answer']}'")

    # 3. Ask "What objects are visible?"
    res2 = client.post("/api/chat", json={"conversation_id": cid, "question": "What objects are visible?"})
    assert res2.status_code == 200
    data2 = res2.json()
    assert data2["success"] is True
    assert "bus" in data2["answer"].lower()
    print(f"✓ Q: 'What objects are visible?' -> A: '{data2['answer']}'")

    # 4. Ask about a specific detected object: "Where is the bus?"
    res3 = client.post("/api/chat", json={"conversation_id": cid, "question": "Where is the bus?"})
    assert res3.status_code == 200
    data3 = res3.json()
    assert data3["success"] is True
    assert "bus" in data3["answer"].lower()
    print(f"✓ Q: 'Where is the bus?' -> A: '{data3['answer']}'")

    # 5. Ask count question: "How many people are there?"
    res4 = client.post("/api/chat", json={"conversation_id": cid, "question": "How many people are there?"})
    assert res4.status_code == 200
    data4 = res4.json()
    assert data4["success"] is True
    assert "people" in data4["answer"].lower() or "person" in data4["answer"].lower()
    print(f"✓ Q: 'How many people are there?' -> A: '{data4['answer']}'")

    # 6. Ask something that cannot be determined: "What color are the socks of the driver?"
    res5 = client.post("/api/chat", json={"conversation_id": cid, "question": "What color are the socks of the driver?"})
    assert res5.status_code == 200
    data5 = res5.json()
    assert data5["success"] is True
    assert "cannot determine" in data5["answer"].lower()
    print(f"✓ Q: 'What color are the socks...?' -> A: '{data5['answer']}'")

    # 7. Check message history
    hist_res = client.get(f"/api/chat/history/{cid}")
    assert hist_res.status_code == 200
    hist_data = hist_res.json()
    assert hist_data["message_count"] == 10  # 5 user questions + 5 assistant answers
    print(f"✓ Verified conversation history has {hist_data['message_count']} messages")

    # 8. Clear conversation history
    clear_res = client.post("/api/chat/clear", json={"conversation_id": cid})
    assert clear_res.status_code == 200
    assert clear_res.json()["success"] is True

    # 9. Verify history is cleared but session is still valid for new questions
    hist_res_after = client.get(f"/api/chat/history/{cid}")
    assert hist_res_after.json()["message_count"] == 0

    res_post_clear = client.post("/api/chat", json={"conversation_id": cid, "question": "Is there a bus?"})
    assert res_post_clear.status_code == 200
    assert "yes" in res_post_clear.json()["answer"].lower()
    print("✓ Successfully continued conversation on the same image after clearing chat history")


def test_new_image_resets_context():
    # Session 1: Bus image
    bus_path = SAMPLE_DIR / "bus.jpg"
    with open(bus_path, "rb") as f:
        res1 = client.post("/api/analyze-image", files={"file": ("bus.jpg", f, "image/jpeg")})
    cid1 = res1.json()["conversation_id"]

    # Session 2: Empty scene image
    empty_path = SAMPLE_DIR / "empty_scene.jpg"
    with open(empty_path, "rb") as f:
        res2 = client.post("/api/analyze-image", files={"file": ("empty_scene.jpg", f, "image/jpeg")})
    cid2 = res2.json()["conversation_id"]

    assert cid1 != cid2

    # Ask about the bus in the empty image session
    chat_empty = client.post("/api/chat", json={"conversation_id": cid2, "question": "Is there a bus?"})
    assert chat_empty.status_code == 200
    assert "no" in chat_empty.json()["answer"].lower() or "cannot" in chat_empty.json()["answer"].lower()
    print("✓ Verified uploading a new image starts a distinct conversation context with no leakage")


if __name__ == "__main__":
    print("Running Phase 1 & Phase 2 Test Suite...\n")
    test_health_check()
    test_root_endpoint()
    test_analyze_image_with_objects()
    test_analyze_transparent_man_laptop_chair_image()
    test_analyze_image_no_objects()
    test_analyze_invalid_extension()
    test_analyze_corrupt_image()
    test_analyze_empty_file()
    print("\nRunning Chatbot Q&A Tests...")
    test_chat_invalid_inputs()
    test_chat_conversation_workflow()
    test_new_image_resets_context()
    print("\nALL PHASE 1 & PHASE 2 TESTS PASSED PERFECTLY! 🎉🚀")
