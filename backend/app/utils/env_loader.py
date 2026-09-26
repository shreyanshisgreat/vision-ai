import os
from pathlib import Path
from typing import Dict, Any


def load_env_file() -> bool:
    """
    Loads environment variables from backend/.env or .env into os.environ.
    Safe, self-contained implementation with zero external dependencies.
    Never prints or logs secret credentials.
    """
    possible_paths = [
        Path(__file__).resolve().parent.parent.parent / ".env",
        Path.cwd() / "backend" / ".env",
        Path.cwd() / ".env",
    ]

    for env_path in possible_paths:
        if env_path.is_file():
            try:
                content = env_path.read_text(encoding="utf-8")
                for line in content.splitlines():
                    line = line.strip()
                    if not line or line.startswith("#") or "=" not in line:
                        continue
                    key, val = line.split("=", 1)
                    key = key.strip()
                    val = val.strip().strip("\"'")
                    if key and val:
                        os.environ[key] = val
                return True
            except Exception as exc:
                print(f"[EnvLoader] Warning reading .env file: {exc}")
    return False


def get_gemini_key_status() -> Dict[str, Any]:
    """
    Verifies the presence and format of GEMINI_API_KEY without exposing its value.
    """
    load_env_file()
    key = os.getenv("GEMINI_API_KEY", "").strip()
    return {
        "is_configured": bool(key),
        "length": len(key),
        "has_valid_prefix": key.startswith("AIza") if key else False,
    }
