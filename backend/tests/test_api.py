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
    assert data["phase"] == 1
    assert data["status"] == "online"
    print("✓ Root endpoint passed")


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

    # Verify detection structure
    first_det = data["detections"][0]
    assert "label" in first_det
    assert "confidence" in first_det
    assert isinstance(first_det["label"], str)
    assert 0.0 <= first_det["confidence"] <= 1.0

    labels = [d["label"] for d in data["detections"]]
    assert "bus" in labels or "person" in labels
    print(f"✓ Detected objects in bus.jpg: {data['unique_labels']} (total: {data['total_detected']})")


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
    print("✓ Successfully handled image with 0 detected objects")


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
    # Corrupt content disguised as JPEG
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


def test_analyze_missing_file():
    response = client.post("/api/analyze-image")
    assert response.status_code == 400
    data = response.json()
    assert data["success"] is False
    print(f"✓ Missing file rejected correctly: {data['error']}")


if __name__ == "__main__":
    print("Running test suite...")
    test_health_check()
    test_root_endpoint()
    test_analyze_image_with_objects()
    test_analyze_image_no_objects()
    test_analyze_invalid_extension()
    test_analyze_corrupt_image()
    test_analyze_empty_file()
    test_analyze_missing_file()
    print("\nALL BACKEND TESTS PASSED SUCCESSFULLY! 🎉")
