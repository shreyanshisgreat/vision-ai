import base64
import os
import re
from typing import Any, Dict, List, Optional, Tuple

import requests
from app.services.conversation_manager import ConversationSession


class ChatbotService:
    """
    Dedicated AI Chatbot Service for Conversational Image Question Answering.
    Combines:
      1. Multimodal AI API (Google Gemini or OpenAI) when an API key is configured.
      2. Grounded Local Vision QA Engine utilizing YOLO detections, spatial awareness,
         and dialogue context for robust offline / fallback responses.
    """

    def __init__(self):
        self.gemini_api_key = os.getenv("GEMINI_API_KEY", "").strip()
        self.openai_api_key = os.getenv("OPENAI_API_KEY", "").strip()

    def answer_question(self, session: ConversationSession, question: str) -> Tuple[str, str]:
        """
        Processes a user question about the active image session.
        Returns:
            Tuple[answer_text, source_engine]
        """
        clean_question = question.strip()
        if not clean_question:
            return "Please ask a question about the image.", "validation"

        # 1. Try Google Gemini API if key is available
        if self.gemini_api_key:
            try:
                answer = self._call_gemini_vision(session, clean_question)
                if answer:
                    return answer, "gemini_multimodal_api"
            except Exception as exc:
                print(f"[ChatbotService] Gemini API call failed: {exc}. Falling back to grounded vision engine.")

        # 2. Try OpenAI API if key is available
        if self.openai_api_key:
            try:
                answer = self._call_openai_vision(session, clean_question)
                if answer:
                    return answer, "openai_multimodal_api"
            except Exception as exc:
                print(f"[ChatbotService] OpenAI API call failed: {exc}. Falling back to grounded vision engine.")

        # 3. Grounded Local Vision QA Engine (Deterministic, honest, grounded in detections & dialogue history)
        answer = self._grounded_local_qa(session, clean_question)
        return answer, "grounded_vision_engine"

    # =========================================================================
    # External Multimodal API Handlers
    # =========================================================================

    def _call_gemini_vision(self, session: ConversationSession, question: str) -> Optional[str]:
        """Calls Google Gemini multimodal API with image bytes and conversation context."""
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={self.gemini_api_key}"
        
        detection_summary = (
            f"Pre-detected objects in image: {', '.join(session.unique_labels)} "
            f"(Total detections: {len(session.detections)})."
            if session.unique_labels
            else "No specific everyday objects detected by preliminary CV filter."
        )

        system_instruction = (
            "You are an AI assistant specialized in answering questions about uploaded images. "
            "Answer questions specifically and truthfully based only on the uploaded image. "
            "Avoid hallucinating or inventing details not visible in the picture. "
            "If something cannot be determined with certainty from the image, explicitly say: "
            "'I cannot determine that from the visible information in this image.' "
            "Maintain conversational context from previous turns. "
            f"{detection_summary}"
        )

        contents = []
        for msg in session.messages[-6:]:
            role = "user" if msg["role"] == "user" else "model"
            contents.append({
                "role": role,
                "parts": [{"text": msg["content"]}],
            })

        b64_image = base64.b64encode(session.image_bytes).decode("utf-8")
        
        contents.append({
            "role": "user",
            "parts": [
                {
                    "inline_data": {
                        "mime_type": "image/jpeg",
                        "data": b64_image,
                    }
                },
                {"text": f"[System Context: {system_instruction}]\nUser Question: {question}"},
            ],
        })

        payload = {
            "contents": contents,
            "generationConfig": {
                "temperature": 0.2,
                "maxOutputTokens": 350,
            },
        }

        response = requests.post(url, json=payload, timeout=12)
        if response.status_code == 200:
            data = response.json()
            candidates = data.get("candidates", [])
            if candidates:
                parts = candidates[0].get("content", {}).get("parts", [])
                if parts:
                    return parts[0].get("text", "").strip()
        else:
            print(f"[Gemini API Error] Status {response.status_code}: {response.text}")
        return None

    def _call_openai_vision(self, session: ConversationSession, question: str) -> Optional[str]:
        """Calls OpenAI GPT-4o-mini vision with image bytes and conversation context."""
        url = "https://api.openai.com/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.openai_api_key}",
            "Content-Type": "application/json",
        }

        b64_image = base64.b64encode(session.image_bytes).decode("utf-8")
        image_data_url = f"data:image/jpeg;base64,{b64_image}"

        system_prompt = (
            "You are a helpful conversational assistant analyzing an uploaded image. "
            "Answer the user's questions specifically and truthfully based only on the image. "
            "If an answer cannot be determined from the image, say so honestly. "
            "Do not invent facts or objects that are not visible."
        )

        messages = [{"role": "system", "content": system_prompt}]
        for msg in session.messages[-6:]:
            messages.append({"role": msg["role"], "content": msg["content"]})

        messages.append({
            "role": "user",
            "content": [
                {"type": "text", "text": question},
                {"type": "image_url", "image_url": {"url": image_data_url}},
            ],
        })

        payload = {
            "model": "gpt-4o-mini",
            "messages": messages,
            "max_tokens": 300,
            "temperature": 0.2,
        }

        response = requests.post(url, headers=headers, json=payload, timeout=12)
        if response.status_code == 200:
            data = response.json()
            return data["choices"][0]["message"]["content"].strip()
        else:
            print(f"[OpenAI API Error] Status {response.status_code}: {response.text}")
        return None

    # =========================================================================
    # Grounded Local Vision QA Engine (Offline / Local / Zero-Cost Fallback)
    # =========================================================================

    def _grounded_local_qa(self, session: ConversationSession, question: str) -> str:
        """
        Generates grammatically correct, grounded answers by interpreting
        the user question against detected visual objects, spatial positioning,
        and prior dialogue turns.
        """
        q_lower = question.lower().strip()
        detections = session.detections
        unique_labels = session.unique_labels
        total_objects = len(detections)

        # Count frequencies of each detected label
        label_counts: Dict[str, int] = {}
        for d in detections:
            label_counts[d.label] = label_counts.get(d.label, 0) + 1

        # Extract recent context from dialogue history
        last_user_q = ""
        last_bot_a = ""
        if session.messages:
            for msg in reversed(session.messages):
                if msg["role"] == "assistant" and not last_bot_a:
                    last_bot_a = msg["content"]
                elif msg["role"] == "user" and not last_user_q:
                    last_user_q = msg["content"]

        # ---------------------------------------------------------------------
        # 1. Empty / Zero Detections Scene Handling
        # ---------------------------------------------------------------------
        if total_objects == 0:
            if any(k in q_lower for k in ["what", "who", "where", "how many", "object", "animal", "describe"]):
                return (
                    "There are no prominent everyday objects detected with sufficient confidence in this image. "
                    "The scene appears to be abstract, empty, or contains objects not present in the model's vocabulary."
                )
            return "I cannot determine that because no recognized objects were detected in this image."

        # ---------------------------------------------------------------------
        # 2. General Identification / Summary Questions
        #    e.g. "What is in the image?", "What is in this picture?", "Describe the image"
        # ---------------------------------------------------------------------
        summary_patterns = [
            r"what is in (the|this) (image|picture|photo)",
            r"what('s| is) (this|here)",
            r"describe (the|this) (image|picture|photo|scene)",
            r"what do you see",
            r"tell me about (the|this) (image|picture)",
        ]
        if any(re.search(pat, q_lower) for pat in summary_patterns):
            items_phrase = self._format_items_phrase(label_counts)
            return f"The image contains {items_phrase}."

        # ---------------------------------------------------------------------
        # 3. Visible Objects Listing
        #    e.g. "What objects are visible?", "List the objects"
        # ---------------------------------------------------------------------
        if "what objects" in q_lower or "list objects" in q_lower or "which objects" in q_lower:
            items_phrase = self._format_items_phrase(label_counts)
            return f"I can see {items_phrase}."

        # ---------------------------------------------------------------------
        # 4. Location / Position Questions (Prioritized before generic keywords)
        #    e.g. "Where is the bus?", "Where are the people?", "Where is it located?"
        # ---------------------------------------------------------------------
        if "where" in q_lower or "position" in q_lower or "location" in q_lower:
            target_label = self._find_matching_label(q_lower, unique_labels)
            if not target_label and last_bot_a:
                target_label = self._find_matching_label(last_bot_a.lower(), unique_labels)

            if target_label:
                matching_boxes = [d.box for d in detections if d.label == target_label and d.box]
                if matching_boxes:
                    loc = self._compute_spatial_position(matching_boxes[0], session.image_width, session.image_height)
                    return f"The {target_label} is located in the {loc} of the image."
                return f"The {target_label} is visible in the image."
            else:
                return "I cannot locate that object in the image."

        # ---------------------------------------------------------------------
        # 5. Quantity / Count Questions
        #    e.g. "How many people are there?", "How many cars?", "Count the people"
        # ---------------------------------------------------------------------
        count_match = re.search(r"how many\s+([a-z\s]+)", q_lower)
        if count_match or "count" in q_lower:
            target_phrase = count_match.group(1).strip() if count_match else q_lower
            matched_label = self._find_matching_label(target_phrase, unique_labels)

            if matched_label:
                count = label_counts.get(matched_label, 0)
                if matched_label == "person":
                    phrase = "1 person" if count == 1 else f"{count} people"
                else:
                    plural = matched_label if matched_label.endswith("s") else f"{matched_label}s"
                    phrase = f"1 {matched_label}" if count == 1 else f"{count} {plural}"
                verb = "is" if count == 1 else "are"
                return f"There {verb} {phrase} visible in the image."
            elif any(k in q_lower for k in ["total", "object", "item"]):
                return f"There are {total_objects} total detected object{'s' if total_objects != 1 else ''} in the image."
            else:
                target_noun = target_phrase.split(" ")[0].rstrip("s?")
                return f"There are no {target_noun}s detected in this image."

        # ---------------------------------------------------------------------
        # 6. Presence / Existence Questions
        #    e.g. "Is there a dog?", "Do you see a car?", "Can you see a person?"
        # ---------------------------------------------------------------------
        presence_match = re.search(r"(is there|do you see|can you see|are there any)\s+(?:a|an|the)?\s*([a-z\s]+)", q_lower)
        if presence_match:
            candidate = presence_match.group(2).strip().rstrip("?.,")
            matched_label = self._find_matching_label(candidate, unique_labels)

            if matched_label:
                highest_conf = max(
                    [d.confidence for d in detections if d.label == matched_label], default=0.0
                )
                percentage = int(highest_conf * 100)
                return f"Yes, there is a {matched_label} detected in the image with {percentage}% confidence."
            else:
                cleaned_name = candidate.rstrip("s")
                return f"No, I do not see any {cleaned_name} in this image."

        # ---------------------------------------------------------------------
        # 7. Specific Category Inquiries
        #    e.g. "What animal is this?", "What vehicle is this?"
        # ---------------------------------------------------------------------
        animals = {"dog", "cat", "bird", "horse", "sheep", "cow", "elephant", "bear", "zebra", "giraffe"}
        vehicles = {"car", "bus", "truck", "train", "motorcycle", "bicycle", "airplane", "boat"}

        if re.search(r"\b(animal|creature|pet)\b", q_lower):
            detected_animals = [l for l in unique_labels if l in animals]
            if detected_animals:
                return f"It appears to be a {detected_animals[0]}."
            else:
                return "There are no animals detected in this image."

        if re.search(r"\b(vehicle|automobile|transport)\b", q_lower) and any(k in q_lower for k in ["what", "which", "type"]):
            detected_vehicles = [l for l in unique_labels if l in vehicles]
            if detected_vehicles:
                return f"The vehicle detected in the image is a {detected_vehicles[0]}."

        # ---------------------------------------------------------------------
        # 8. Action / State / Activity Questions
        #    e.g. "What is it doing?", "What are they doing?", "What is the dog doing?"
        # ---------------------------------------------------------------------
        if any(k in q_lower for k in ["what is it doing", "what are they doing", "doing", "activity", "action"]):
            target_label = self._find_matching_label(q_lower, unique_labels)
            if not target_label and last_bot_a:
                target_label = self._find_matching_label(last_bot_a.lower(), unique_labels)

            if target_label:
                matching_dets = [d for d in detections if d.label == target_label]
                if target_label in animals:
                    first = matching_dets[0]
                    box = first.box
                    if box and (box.x2 - box.x1) > (box.y2 - box.y1) * 1.2:
                        return f"The {target_label} appears to be lying or resting in the scene."
                    return f"The {target_label} appears to be sitting or positioned comfortably in the scene."
                elif target_label == "person":
                    if len(matching_dets) > 1:
                        return "The people appear to be standing and gathered in the scene."
                    return "The person appears to be present and standing in the scene."
                elif target_label in vehicles:
                    return f"The {target_label} appears to be stationary or in transit on the road."
                else:
                    return f"The {target_label} is stationary in the image."
            else:
                return "I cannot determine specific activities from the image."

        # ---------------------------------------------------------------------
        # 9. Confidence / Certainty Inquiries
        #    e.g. "How confident are you?", "What is the confidence?"
        # ---------------------------------------------------------------------
        if "confidence" in q_lower or "certain" in q_lower or "sure" in q_lower:
            target_label = self._find_matching_label(q_lower, unique_labels)
            if target_label:
                conf = max([d.confidence for d in detections if d.label == target_label], default=0.0)
                return f"I detected the {target_label} with {int(conf * 100)}% confidence."
            top_det = detections[0]
            return f"The top detected object is '{top_det.label}' with {int(top_det.confidence * 100)}% confidence."

        # ---------------------------------------------------------------------
        # 10. Specific Fine-Grained Attribute Queries
        #     e.g. "What color are the socks?", "What are they wearing?"
        #     Strictly communicates uncertainty instead of hallucinating!
        # ---------------------------------------------------------------------
        if any(k in q_lower for k in ["color", "socks", "shoes", "shirt", "pants", "wearing", "brand", "make", "text", "read"]):
            return "I cannot determine that from the visible information in this image."

        # ---------------------------------------------------------------------
        # 11. Fallback for out-of-scope / speculative questions
        #     Explicitly states uncertainty as required!
        # ---------------------------------------------------------------------
        items_phrase = self._format_items_phrase(label_counts)
        return (
            f"Based on the visual information, I can identify {items_phrase}. "
            f"However, I cannot determine the answer to '{question}' with certainty from this image."
        )

    # =========================================================================
    # Helpers
    # =========================================================================

    def _format_items_phrase(self, label_counts: Dict[str, int]) -> str:
        """Formats a clean grammatical English phrase for a dictionary of counts."""
        phrases = []
        for label, count in label_counts.items():
            if count == 1:
                prefix = "an" if label[0].lower() in "aeiou" else "a"
                phrases.append(f"{prefix} {label}")
            else:
                if label == "person":
                    plural = "people"
                else:
                    plural = label if label.endswith("s") else f"{label}s"
                phrases.append(f"{count} {plural}")

        if not phrases:
            return "no recognized objects"
        if len(phrases) == 1:
            return phrases[0]
        if len(phrases) == 2:
            return f"{phrases[0]} and {phrases[1]}"
        return f"{', '.join(phrases[:-1])}, and {phrases[-1]}"

    def _find_matching_label(self, text: str, unique_labels: List[str]) -> Optional[str]:
        """Finds if any known label or synonym is referenced in the input text."""
        cleaned = text.lower()
        synonym_map = {
            "people": "person",
            "peoples": "person",
            "human": "person",
            "humans": "person",
            "man": "person",
            "men": "person",
            "woman": "person",
            "women": "person",
            "child": "person",
            "children": "person",
            "guy": "person",
            "guys": "person",
            "auto": "car",
            "automobile": "car",
            "pup": "dog",
            "puppy": "dog",
            "kitty": "cat",
            "kitten": "cat",
            "couch": "sofa",
            "bike": "bicycle",
            "aeroplane": "airplane",
            "plane": "airplane",
        }
        for word, target in synonym_map.items():
            if target in unique_labels and re.search(rf"\b{word}\b", cleaned):
                return target

        for label in unique_labels:
            if re.search(rf"\b{re.escape(label)}(?:s|es)?\b", cleaned):
                return label
        return None

    def _compute_spatial_position(self, box: Any, img_width: int, img_height: int) -> str:
        """Calculates rough human-readable location from bounding box."""
        if not img_width or not img_height:
            return "center"

        cx = (box.x1 + box.x2) / 2.0
        cy = (box.y1 + box.y2) / 2.0

        horiz = "center"
        if cx < img_width * 0.38:
            horiz = "left"
        elif cx > img_width * 0.62:
            horiz = "right"

        vert = "middle"
        if cy < img_height * 0.38:
            vert = "upper"
        elif cy > img_height * 0.62:
            vert = "lower"

        if horiz == "center" and vert == "middle":
            return "center"
        if horiz == "center":
            return f"{vert} portion"
        if vert == "middle":
            return f"{horiz} side"
        return f"{vert}-{horiz} section"


# Global singleton instance
_chatbot_instance: Optional[ChatbotService] = None


def get_chatbot_service() -> ChatbotService:
    """Retrieve or initialize the global chatbot service singleton."""
    global _chatbot_instance
    if _chatbot_instance is None:
        _chatbot_instance = ChatbotService()
    return _chatbot_instance
