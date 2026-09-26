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
    assert data["phase"] == 3
    assert data["detector"] == "Ultralytics YOLOv8s"
    assert data["classes_count"] == 80
    assert data["model_loaded"] is True
    print("✓ Health check passed (Phase 3)")


def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["phase"] == 3
    assert data["status"] == "online"
    assert data["detector"] == "Ultralytics YOLOv8s"
    assert data["chat_endpoint"] == "/api/chat"
    print("✓ Root endpoint passed (Phase 3)")


# =========================================================================
# TEST 1: Man + Laptop + Chair (Verifies umbrella bug remains 100% fixed)
# =========================================================================

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

    # 1. Verify umbrella is NOT detected (was a black alpha-background artifact)
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

    # Test conversational Q&A on this session
    cid = data["conversation_id"]
    res_laptop = client.post("/api/chat", json={"conversation_id": cid, "question": "Is there a laptop?"})
    assert res_laptop.status_code == 200
    assert "yes" in res_laptop.json()["answer"].lower()
    assert "laptop" in res_laptop.json()["answer"].lower()

    res_action = client.post("/api/chat", json={"conversation_id": cid, "question": "What is the person doing?"})
    assert res_action.status_code == 200
    assert "laptop" in res_action.json()["answer"].lower() or "working" in res_action.json()["answer"].lower()

    print("✓ TEST 1 PASSED: Person, Laptop, and Chair correctly detected with zero Umbrella, and conversational Q&A answered accurately!")
    return cid


# =========================================================================
# TEST 2: Real-World Desk Scene (Person + Laptop + Phone + Chair + Bottle)
# =========================================================================

def test_analyze_multi_coco_objects_image():
    img_path = SAMPLE_DIR / "study_group_desk.jpg"
    assert img_path.exists(), f"Sample image {img_path} not found"

    with open(img_path, "rb") as f:
        response = client.post(
            "/api/analyze-image",
            files={"file": ("study_group_desk.jpg", f, "image/jpeg")},
        )

    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True

    labels = set([d["label"] for d in data["detections"]])
    print(f"✓ Detections for study_group_desk: {sorted(list(labels))}")

    # Verify all 5 requested COCO classes are detected
    expected_classes = ["person", "laptop", "bottle", "chair", "cell phone"]
    for expected in expected_classes:
        assert expected in labels, f"Expected COCO class '{expected}' was not detected in {labels}"

    print(f"✓ TEST 2 PASSED: All 5 requested COCO objects verified: {expected_classes}")
    return data["conversation_id"]


# =========================================================================
# TEST 3: Open-Vocabulary Scene (YOLO + VLM Combination)
# Laptop, Calculator, Pencil sharpener, Pencil, Notebook, Phone, Chair, Person
# =========================================================================

def test_phase3_open_vocabulary_study_desk():
    img_path = SAMPLE_DIR / "study_desk_open_vocab.jpg"
    assert img_path.exists(), f"Sample image {img_path} not found"

    with open(img_path, "rb") as f:
        response = client.post(
            "/api/analyze-image",
            files={"file": ("study_desk_open_vocab.jpg", f, "image/jpeg")},
        )

    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    cid = data["conversation_id"]

    yolo_labels = set([d["label"] for d in data["detections"]])
    print(f"✓ YOLO detected COCO categories: {sorted(list(yolo_labels))}")

    # A. Verify what YOLO detects (COCO classes)
    assert "person" in yolo_labels
    assert "laptop" in yolo_labels
    assert "chair" in yolo_labels
    assert "cell phone" in yolo_labels

    # Critical requirement: YOLO must NOT claim non-COCO classes like calculator or pencil sharpener
    assert "calculator" not in yolo_labels, "Error: YOLO should not output 'calculator' as it's not in COCO-80"
    assert "pencil sharpener" not in yolo_labels, "Error: YOLO should not output 'pencil sharpener'"

    # B. Conversational Q&A verifying VLM handles non-COCO open-vocabulary objects
    # 1. "Is there a laptop?" -> Answered via YOLO detection
    q_laptop = client.post("/api/chat", json={"conversation_id": cid, "question": "Is there a laptop?"})
    assert q_laptop.status_code == 200
    ans_laptop = q_laptop.json()["answer"]
    assert "yes" in ans_laptop.lower() and "laptop" in ans_laptop.lower()
    print(f"✓ Q: 'Is there a laptop?' -> A: '{ans_laptop}' (source: {q_laptop.json().get('source')})")

    # 2. "Is there a calculator?" -> Answered via VLM visual understanding
    q_calc = client.post("/api/chat", json={"conversation_id": cid, "question": "Is there a calculator?"})
    assert q_calc.status_code == 200
    ans_calc = q_calc.json()["answer"]
    assert "yes" in ans_calc.lower() and "calculator" in ans_calc.lower()
    assert "coco" in ans_calc.lower() or "visual understanding" in ans_calc.lower() or "not part of yolo" in ans_calc.lower()
    print(f"✓ Q: 'Is there a calculator?' -> A: '{ans_calc}' (source: {q_calc.json().get('source')})")

    # 3. "Is there a pencil sharpener?" -> Answered via VLM visual understanding
    q_sharp = client.post("/api/chat", json={"conversation_id": cid, "question": "Is there a pencil sharpener?"})
    assert q_sharp.status_code == 200
    ans_sharp = q_sharp.json()["answer"]
    assert "yes" in ans_sharp.lower() and "pencil sharpener" in ans_sharp.lower()
    print(f"✓ Q: 'Is there a pencil sharpener?' -> A: '{ans_sharp}' (source: {q_sharp.json().get('source')})")

    # 4. "What objects are visible?" -> Hybrid summary
    q_vis = client.post("/api/chat", json={"conversation_id": cid, "question": "What objects are visible?"})
    assert q_vis.status_code == 200
    ans_vis = q_vis.json()["answer"]
    assert "laptop" in ans_vis.lower() or "person" in ans_vis.lower()
    print(f"✓ Q: 'What objects are visible?' -> A: '{ans_vis}'")

    # 5. "What is the person doing?" -> Action recognition
    q_doing = client.post("/api/chat", json={"conversation_id": cid, "question": "What is the person doing?"})
    assert q_doing.status_code == 200
    ans_doing = q_doing.json()["answer"]
    assert "studying" in ans_doing.lower() or "collaborating" in ans_doing.lower() or "working" in ans_doing.lower()
    print(f"✓ Q: 'What is the person doing?' -> A: '{ans_doing}'")

    # 6. "What is next to the laptop?" -> Spatial reasoning
    q_next = client.post("/api/chat", json={"conversation_id": cid, "question": "What is next to the laptop?"})
    assert q_next.status_code == 200
    ans_next = q_next.json()["answer"]
    assert "phone" in ans_next.lower() or "stationery" in ans_next.lower() or "calculator" in ans_next.lower()
    print(f"✓ Q: 'What is next to the laptop?' -> A: '{ans_next}'")

    # 7. "Is this suitable for studying?" -> Contextual evaluation
    q_suit = client.post("/api/chat", json={"conversation_id": cid, "question": "Is this suitable for studying?"})
    assert q_suit.status_code == 200
    ans_suit = q_suit.json()["answer"]
    assert "yes" in ans_suit.lower() and "study" in ans_suit.lower()
    print(f"✓ Q: 'Is this suitable for studying?' -> A: '{ans_suit}'")

    # 8. "What is unusual about this image?"
    q_unusual = client.post("/api/chat", json={"conversation_id": cid, "question": "What is unusual about this image?"})
    assert q_unusual.status_code == 200
    ans_unusual = q_unusual.json()["answer"]
    assert "nothing" in ans_unusual.lower() or "normal" in ans_unusual.lower()
    print(f"✓ Q: 'What is unusual about this image?' -> A: '{ans_unusual}'")

    # 9. "What color is the laptop?"
    q_color = client.post("/api/chat", json={"conversation_id": cid, "question": "What color is the laptop?"})
    assert q_color.status_code == 200
    ans_color = q_color.json()["answer"]
    assert "grey" in ans_color.lower() or "silver" in ans_color.lower() or "dark" in ans_color.lower()
    print(f"✓ Q: 'What color is the laptop?' -> A: '{ans_color}'")

    # 10. Uncertainty check: "What color are the socks of the person?"
    q_socks = client.post("/api/chat", json={"conversation_id": cid, "question": "What color are the socks of the person?"})
    assert q_socks.status_code == 200
    ans_socks = q_socks.json()["answer"]
    assert "cannot determine" in ans_socks.lower() or "can't identify" in ans_socks.lower()
    print(f"✓ Uncertainty test: '{ans_socks}'")

    print("✓ TEST 3 & 4 PASSED: Open-vocabulary objects, activities, spatial relations, and uncertainty handled properly!")


# =========================================================================
# TEST 5: New Image Upload Resets Context Completely
# =========================================================================

def test_new_image_resets_context():
    # Upload Scene A (Bus)
    bus_path = SAMPLE_DIR / "bus.jpg"
    with open(bus_path, "rb") as f:
        res1 = client.post("/api/analyze-image", files={"file": ("bus.jpg", f, "image/jpeg")})
    cid1 = res1.json()["conversation_id"]

    # Upload Scene B (Empty scene)
    empty_path = SAMPLE_DIR / "empty_scene.jpg"
    with open(empty_path, "rb") as f:
        res2 = client.post("/api/analyze-image", files={"file": ("empty_scene.jpg", f, "image/jpeg")})
    cid2 = res2.json()["conversation_id"]

    assert cid1 != cid2, "Error: Each image upload must generate a distinct conversation ID"

    # In Session B (Empty image), verify no leakage of Bus from Session A
    chat_empty = client.post("/api/chat", json={"conversation_id": cid2, "question": "Is there a bus?"})
    assert chat_empty.status_code == 200
    ans = chat_empty.json()["answer"].lower()
    assert "no" in ans or "cannot determine" in ans or "not detected" in ans or "no recognized" in ans
    assert "detected by yolov8s" not in ans, "Error: Session B leaked Session A bus detections!"

    print("✓ TEST 5 PASSED: Uploading a new image establishes a clean, isolated conversation session with zero leakage!")


# =========================================================================
# TEST 6: Error Handling & Invalid Inputs
# =========================================================================

def test_security_and_validation():
    # 1. Invalid file extension (.txt)
    res_txt = client.post(
        "/api/analyze-image",
        files={"file": ("notes.txt", io.BytesIO(b"Hello from test"), "text/plain")},
    )
    assert res_txt.status_code == 400
    assert "unsupported file format" in res_txt.json()["error"].lower()
    print("✓ Invalid extension (.txt) rejected with 400")

    # 2. Corrupt / fake image bytes
    res_corrupt = client.post(
        "/api/analyze-image",
        files={"file": ("corrupt.jpg", io.BytesIO(b"RANDOM_NON_IMAGE_DATA_BYTES_999"), "image/jpeg")},
    )
    assert res_corrupt.status_code == 400
    assert "not a valid image" in res_corrupt.json()["error"].lower()
    print("✓ Corrupt image rejected with 400")

    # 3. Empty file (0 bytes)
    res_empty = client.post(
        "/api/analyze-image",
        files={"file": ("empty.jpg", io.BytesIO(b""), "image/jpeg")},
    )
    assert res_empty.status_code == 400
    assert "empty" in res_empty.json()["error"].lower()
    print("✓ Empty file rejected with 400")

    # 4. Chat with invalid/expired session ID
    res_bad_cid = client.post("/api/chat", json={"conversation_id": "invalid_session_id", "question": "What is this?"})
    assert res_bad_cid.status_code == 404
    print("✓ Non-existent conversation session rejected with 404")

    # 5. Chat with empty question
    res_empty_q = client.post("/api/chat", json={"conversation_id": "some_id", "question": "   "})
    assert res_empty_q.status_code == 400
    print("✓ Empty question rejected with 400")

    print("✓ TEST 6 PASSED: Security, validation, and error guards verified!")


if __name__ == "__main__":
    print("==================================================================")
    print("RUNNING COMPREHENSIVE PHASE 3 TEST SUITE (YOLOv8s + VLM)")
    print("==================================================================\n")
    test_health_check()
    test_root_endpoint()
    test_analyze_transparent_man_laptop_chair_image()
    test_analyze_multi_coco_objects_image()
    test_phase3_open_vocabulary_study_desk()
    test_new_image_resets_context()
    test_security_and_validation()
    print("\n==================================================================")
    print("🎉 ALL PHASE 3 TESTS COMPLETED AND VERIFIED 100% PERFECTLY! 🚀")
    print("==================================================================")
