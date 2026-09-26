import os
import time
from pathlib import Path
from typing import List, Optional, Tuple
from PIL import Image
from ultralytics import YOLO

from app.models.schemas import BoundingBox, DetectionItem


class ImageAnalyzerService:
    """
    Encapsulates pretrained Computer Vision model for object detection.
    Keeps model loading and inference logic isolated from API endpoints.
    """

    def __init__(self, model_path: Optional[str] = None, confidence_threshold: float = 0.25):
        self.confidence_threshold = float(
            os.getenv("DETECTION_CONFIDENCE_THRESHOLD", confidence_threshold)
        )
        
        # Determine model path
        if model_path:
            self.model_path = model_path
        else:
            # Check environment variable or standard locations
            env_path = os.getenv("MODEL_PATH")
            if env_path and os.path.exists(env_path):
                self.model_path = env_path
            else:
                # Relative to project directory or current file
                base_dir = Path(__file__).resolve().parent.parent.parent
                weights_path = base_dir / "weights" / "yolov8n.pt"
                if weights_path.exists():
                    self.model_path = str(weights_path)
                else:
                    self.model_path = "yolov8n.pt"

        self._model: Optional[YOLO] = None
        self._load_model()

    def _load_model(self) -> None:
        """Load pretrained YOLO model weights."""
        try:
            print(f"[ImageAnalyzerService] Loading model from: {self.model_path}")
            self._model = YOLO(self.model_path)
            print("[ImageAnalyzerService] Model successfully loaded.")
        except Exception as exc:
            print(f"[ImageAnalyzerService] Error loading model: {exc}")
            raise RuntimeError(f"Failed to load image recognition model: {exc}")

    def analyze(
        self, image: Image.Image, conf_threshold: Optional[float] = None
    ) -> Tuple[List[DetectionItem], List[str], float]:
        """
        Run object detection inference on a PIL image.
        Returns:
            - detections: list of DetectionItem sorted by confidence
            - unique_labels: list of unique detected object classes
            - inference_duration_ms: elapsed inference time in milliseconds
        """
        if self._model is None:
            self._load_model()

        threshold = conf_threshold if conf_threshold is not None else self.confidence_threshold

        # Ensure image is in RGB mode for YOLO
        if image.mode != "RGB":
            image = image.convert("RGB")

        start_time = time.perf_counter()
        
        # Run inference (verbose=False to avoid cluttering console output)
        results = self._model(image, conf=threshold, verbose=False)
        
        inference_duration_ms = (time.perf_counter() - start_time) * 1000.0

        detections: List[DetectionItem] = []
        unique_labels_set = set()

        if results and len(results) > 0:
            result = results[0]
            boxes = result.boxes
            names = self._model.names

            if boxes is not None and len(boxes) > 0:
                for box in boxes:
                    cls_id = int(box.cls[0].item())
                    label = names.get(cls_id, f"class_{cls_id}")
                    confidence = float(box.conf[0].item())
                    
                    # Extract bounding box [x1, y1, x2, y2]
                    coords = box.xyxy[0].tolist()
                    bbox = BoundingBox(
                        x1=round(coords[0], 2),
                        y1=round(coords[1], 2),
                        x2=round(coords[2], 2),
                        y2=round(coords[3], 2),
                    )

                    detections.append(
                        DetectionItem(
                            label=label,
                            confidence=round(confidence, 2),
                            box=bbox,
                        )
                    )
                    unique_labels_set.add(label)

        # Sort detections by confidence descending
        detections.sort(key=lambda d: d.confidence, reverse=True)
        unique_labels = sorted(list(unique_labels_set))

        return detections, unique_labels, round(inference_duration_ms, 2)


# Global singleton instance for efficient reuse across requests
_analyzer_instance: Optional[ImageAnalyzerService] = None


def get_analyzer_service() -> ImageAnalyzerService:
    """Retrieve or initialize the singleton image analyzer service."""
    global _analyzer_instance
    if _analyzer_instance is None:
        _analyzer_instance = ImageAnalyzerService()
    return _analyzer_instance
