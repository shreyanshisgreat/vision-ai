import os
import time
from pathlib import Path
from typing import List, Optional, Tuple
from PIL import Image
from ultralytics import YOLO

from app.models.schemas import BoundingBox, DetectionItem


def preprocess_image_for_vision(image: Image.Image) -> Image.Image:
    """
    Properly handles images before feeding them to the computer vision model.
    If the image has transparency (RGBA, LA, or Palette mode with transparency),
    naively calling image.convert('RGB') replaces transparent pixels with pitch black [0, 0, 0],
    which creates severe artificial dark silhouette boundaries (e.g. false umbrella detections).
    This function composites transparent images over a neutral solid white background.
    """
    if image.mode in ("RGBA", "LA") or (image.mode == "P" and "transparency" in image.info):
        rgba = image.convert("RGBA")
        white_bg = Image.new("RGBA", rgba.size, (255, 255, 255, 255))
        composited = Image.alpha_composite(white_bg, rgba)
        return composited.convert("RGB")
    elif image.mode != "RGB":
        return image.convert("RGB")
    return image


class ImageAnalyzerService:
    """
    Encapsulates pretrained Computer Vision model for object detection.
    Keeps model loading and inference logic isolated from API endpoints.
    """

    def __init__(self, model_path: Optional[str] = None, confidence_threshold: float = 0.25):
        self.confidence_threshold = float(
            os.getenv("DETECTION_CONFIDENCE_THRESHOLD", confidence_threshold)
        )
        
        # Determine model path: prefer yolov8s for high accuracy, fallback to yolov8n
        if model_path:
            self.model_path = model_path
        else:
            env_path = os.getenv("MODEL_PATH")
            if env_path and os.path.exists(env_path):
                self.model_path = env_path
            else:
                base_dir = Path(__file__).resolve().parent.parent.parent
                s_path = base_dir / "weights" / "yolov8s.pt"
                n_path = base_dir / "weights" / "yolov8n.pt"
                if s_path.exists():
                    self.model_path = str(s_path)
                elif n_path.exists():
                    self.model_path = str(n_path)
                else:
                    self.model_path = "yolov8s.pt"

        self._model: Optional[YOLO] = None
        self._load_model()

    def _load_model(self) -> None:
        """Load pretrained YOLO model weights."""
        try:
            print(f"[ImageAnalyzerService] Loading model from: {self.model_path}")
            self._model = YOLO(self.model_path)
            print(f"[ImageAnalyzerService] Pretrained COCO model loaded ({len(self._model.names)} classes).")
        except Exception as exc:
            print(f"[ImageAnalyzerService] Error loading model: {exc}")
            raise RuntimeError(f"Failed to load image recognition model: {exc}")

    def analyze(
        self, image: Image.Image, conf_threshold: Optional[float] = None
    ) -> Tuple[List[DetectionItem], List[str], float]:
        """
        Run object detection inference on an image.
        Returns:
            - detections: list of DetectionItem sorted by confidence
            - unique_labels: list of unique detected object classes
            - inference_duration_ms: elapsed inference time in milliseconds
        """
        if self._model is None:
            self._load_model()

        threshold = conf_threshold if conf_threshold is not None else self.confidence_threshold

        # Preprocess image to safely handle alpha transparency and color channels
        processed_image = preprocess_image_for_vision(image)

        start_time = time.perf_counter()
        
        # Run inference (verbose=False to avoid cluttering console output)
        results = self._model(processed_image, conf=threshold, verbose=False)
        
        inference_duration_ms = (time.perf_counter() - start_time) * 1000.0

        detections: List[DetectionItem] = []
        unique_labels_set = set()

        if results and len(results) > 0:
            result = results[0]
            boxes = result.boxes
            names = self._model.names

            if boxes is not None and len(boxes) > 0:
                print(f"[Vision Inference] Raw detections count: {len(boxes)}")
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

                    # Print raw debug telemetry requested by user
                    print(
                        f"  -> class_id: {cls_id}, class_name: {label}, "
                        f"confidence: {confidence:.4f}, bbox: [{bbox.x1}, {bbox.y1}, {bbox.x2}, {bbox.y2}]"
                    )

                    detections.append(
                        DetectionItem(
                            class_id=cls_id,
                            label=label,
                            confidence=round(confidence, 2),
                            box=bbox,
                        )
                    )
                    unique_labels_set.add(label)
            else:
                print("[Vision Inference] No objects detected above confidence threshold.")

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
