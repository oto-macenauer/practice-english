#!/usr/bin/env python3
"""
Generate educational illustrations for the Practice English app.

Backends:
  together  — Together AI, free $5 signup credit (~500 images) [default]
  gemini    — Google Gemini, free tier (geo-restricted for images)
  imagen    — Google Imagen 4, paid plans only

Usage:
  1. Create a .env file in the project root with your API key:
       TOGETHER_API_KEY=your_key_here     (for Together AI)
       GEMINI_API_KEY=your_key_here       (for Gemini/Imagen)

  2. Install dependencies:
       pip install -r tools/requirements.txt

  3. Run:
       python tools/generate_images.py                        # Together (default)
       python tools/generate_images.py --model gemini          # Gemini
       python tools/generate_images.py --only modules          # only module cards
       python tools/generate_images.py --only topics           # only topic images
       python tools/generate_images.py --only mod-vocabulary   # single image by ID
       python tools/generate_images.py --force                 # regenerate existing
       python tools/generate_images.py --list                  # list all image IDs
"""

import argparse
import io
import os
import sys
import time
from pathlib import Path

# ---------------------------------------------------------------------------
# Resolve project root (one level up from tools/)
# ---------------------------------------------------------------------------
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

# Load .env from project root
try:
    from dotenv import load_dotenv
    load_dotenv(PROJECT_ROOT / ".env")
except ImportError:
    pass  # dotenv is optional if env var is set directly

from google import genai
from PIL import Image

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
TOGETHER_API_KEY = os.environ.get("TOGETHER_API_KEY", "")
OUTPUT_DIR = PROJECT_ROOT / "images"
SIZE = (512, 512)

# Model options (pick via --model flag):
#   gemini   = gemini-2.5-flash-image  (needs GEMINI_API_KEY, geo-restricted)
#   imagen   = imagen-4.0-generate-001 (needs GEMINI_API_KEY, paid plans only)
#   together = FLUX.1-schnell-Free     (needs TOGETHER_API_KEY, free $5 signup credit)
DEFAULT_MODEL = "together"
MODEL_MAP = {
    "gemini": "gemini-2.5-flash-image",
    "imagen": "imagen-4.0-generate-001",
    "together": "black-forest-labs/FLUX.1-schnell-Free",
}

STYLE_PREFIX = (
    "Flat vector illustration, bright cheerful colours, simple shapes, "
    "child-friendly educational style, white background, no text, no words, "
    "no letters, clean minimal design. "
)

# ---------------------------------------------------------------------------
# Image definitions
# ---------------------------------------------------------------------------
IMAGES: dict[str, dict] = {}


def img(id: str, path: str, prompt: str, group: str = "misc"):
    """Register an image to generate."""
    IMAGES[id] = {"path": path, "prompt": STYLE_PREFIX + prompt, "group": group}


# --- Module cards (homepage) ---
img("mod-vocabulary",  "modules/vocabulary.webp",
    "A stack of colourful flashcards with simple pictures on them, word bubbles floating around, learning vocabulary concept.",
    group="modules")

img("mod-grammar",     "modules/grammar.webp",
    "A large friendly pencil writing on lined paper, with colourful sentence parts (subject, verb, object) highlighted in different colours.",
    group="modules")

img("mod-spelling",    "modules/spelling.webp",
    "Colourful wooden letter blocks A B C scattered playfully, a child's hand placing a letter, spelling bee concept.",
    group="modules")

img("mod-reading",     "modules/reading.webp",
    "A happy child sitting cross-legged reading a big open book, colourful illustrations flying out of the pages.",
    group="modules")

img("mod-listening",   "modules/listening.webp",
    "A pair of bright headphones with colourful sound waves and musical notes coming out, listening and audio concept.",
    group="modules")

img("mod-tests",       "modules/tests.webp",
    "A test paper with green checkmarks and a gold star sticker, a pencil beside it, school exam concept.",
    group="modules")

# --- Unit 7 topic illustrations ---
img("topic-jobs",      "topics/unit7-jobs.webp",
    "A group of diverse workers standing together: a chef in white hat, a photographer with camera, a waiter with tray, a singer with microphone, a farmer with pitchfork. Cartoon style.",
    group="topics")

img("topic-adjectives","topics/unit7-adjectives.webp",
    "Six cartoon faces showing different personality traits: one kind and smiling, one clever with glasses, one lazy yawning, one brave with a cape, one friendly waving, one popular surrounded by friends.",
    group="topics")

img("topic-zero-cond", "topics/unit7-zero-conditional.webp",
    "A simple cause-and-effect diagram: on the left the sun shining on ice, an arrow in the middle, on the right a puddle of water. Science experiment feel.",
    group="topics")

img("topic-look-like", "topics/unit7-look-like.webp",
    "A cartoon family portrait showing people with different features: tall dad with brown hair, short mum with blonde hair, child with curly red hair, grandma with glasses. Appearance and description concept.",
    group="topics")

img("topic-passive",   "topics/unit5-passive.webp",
    "A factory conveyor belt with cars being assembled by robot arms, showing the concept of 'cars are made in factories', passive voice illustration.",
    group="topics")

img("topic-subjects",  "topics/unit6-subjects.webp",
    "A circle of school subject icons: a flask for science, a paintbrush for art, a football for sports, a musical note for music, a globe for geography, a calculator for maths.",
    group="topics")

img("topic-altamira",  "topics/unit7-altamira.webp",
    "Inside a dimly lit cave with prehistoric cave paintings of bison and horses on the rocky walls, warm torchlight illuminating the ancient art. Altamira Caves in Spain.",
    group="topics")

img("topic-quixote",   "topics/unit7-quixote.webp",
    "Don Quixote on his horse charging at windmills in a sunny Spanish landscape, Sancho Panza watching from behind, cartoon adventure style.",
    group="topics")

# --- Unit 6 topic illustrations ---
img("topic-maps",      "topics/unit6-maps.webp",
    "A colourful treasure-style map with a compass rose, dotted path, landmarks like a school, park, library, and directional arrows.",
    group="topics")

img("topic-technology","topics/unit6-technology.webp",
    "A laptop, tablet and smartphone arranged on a desk with wifi symbol, download arrow, and browser window showing a search engine.",
    group="topics")

img("topic-modals",    "topics/unit6-modals.webp",
    "Three road signs side by side: a green one with a thumbs up (should), a blue one with an exclamation mark (must), and a red one with an X (mustn't). Rules and advice concept.",
    group="topics")

# --- Listening illustrations ---
img("listen-directions","topics/listen-directions.webp",
    "A cartoon person standing at a street crossroads looking at directional signs, a friendly map pin character pointing the way.",
    group="topics")

img("listen-appearance","topics/listen-appearance.webp",
    "Two cartoon children describing each other: speech bubbles with simple icons of hair colour, eye colour, height. Describing people concept.",
    group="topics")


# ---------------------------------------------------------------------------
# Generation logic
# ---------------------------------------------------------------------------

def save_image(image_data: bytes, output_path: Path):
    """Resize and save image bytes as WebP."""
    image = Image.open(io.BytesIO(image_data))
    image = image.resize(SIZE, Image.LANCZOS)
    image.save(str(output_path), "WEBP", quality=85)
    file_size = output_path.stat().st_size / 1024
    print(f"    Saved ({file_size:.0f} KB)")


def generate_gemini(client, model_id: str, prompt: str, output_path: Path):
    """Generate via Gemini generate_content (supports image output)."""
    response = client.models.generate_content(
        model=model_id,
        contents=prompt,
        config=genai.types.GenerateContentConfig(
            response_modalities=["image", "text"],
        ),
    )
    for part in response.candidates[0].content.parts:
        if part.inline_data is not None:
            save_image(part.inline_data.data, output_path)
            return True
    print("    WARNING: No image in response")
    return False


def generate_imagen(client, model_id: str, prompt: str, output_path: Path):
    """Generate via Imagen dedicated image model."""
    response = client.models.generate_images(
        model=model_id,
        prompt=prompt,
        config=genai.types.GenerateImagesConfig(
            number_of_images=1,
        ),
    )
    if response.generated_images:
        save_image(response.generated_images[0].image.image_bytes, output_path)
        return True
    print("    WARNING: No image in response")
    return False


def generate_together(api_key: str, model_id: str, prompt: str, output_path: Path):
    """Generate via Together AI (free signup credits, FLUX.1-schnell-Free)."""
    import urllib.request
    import json
    import base64

    url = "https://api.together.xyz/v1/images/generations"
    data = json.dumps({
        "model": model_id,
        "prompt": prompt,
        "width": SIZE[0],
        "height": SIZE[1],
        "n": 1,
        "response_format": "b64_json",
    }).encode()

    req = urllib.request.Request(url, data=data, headers={
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}",
    })
    resp = urllib.request.urlopen(req, timeout=120)
    result = json.loads(resp.read())
    b64 = result["data"][0]["b64_json"]
    image_bytes = base64.b64decode(b64)
    save_image(image_bytes, output_path)
    return True


def generate_image(client, backend: str, model_id: str, prompt: str, output_path: Path):
    """Generate a single image and save it."""
    output_path.parent.mkdir(parents=True, exist_ok=True)

    if output_path.exists():
        print(f"  SKIP (exists): {output_path.relative_to(PROJECT_ROOT)}")
        return True

    print(f"  Generating: {output_path.relative_to(PROJECT_ROOT)}")
    print(f"    Prompt: {prompt[:80]}...")

    try:
        if backend == "together":
            return generate_together(TOGETHER_API_KEY, model_id, prompt, output_path)
        elif backend == "imagen":
            return generate_imagen(client, model_id, prompt, output_path)
        else:
            return generate_gemini(client, model_id, prompt, output_path)
    except Exception as e:
        print(f"    ERROR: {e}")
        return False


def main():
    parser = argparse.ArgumentParser(description="Generate images for Practice English")
    parser.add_argument("--only", type=str, default=None,
                        help="Only generate a specific group (modules, topics) or image ID")
    parser.add_argument("--list", action="store_true",
                        help="List all image IDs and exit")
    parser.add_argument("--force", action="store_true",
                        help="Regenerate even if file exists")
    parser.add_argument("--model", type=str, default=DEFAULT_MODEL,
                        choices=["gemini", "imagen", "together"],
                        help="Backend to use (default: together)")
    args = parser.parse_args()

    if args.list:
        for id, info in IMAGES.items():
            print(f"  {id:25s}  [{info['group']:8s}]  {info['path']}")
        return

    backend = args.model
    model_id = MODEL_MAP.get(backend, "")
    client = None

    if backend == "together":
        if not TOGETHER_API_KEY:
            print("ERROR: TOGETHER_API_KEY not set.")
            print("Set it in .env file or as an environment variable.")
            print("Get a free key at: https://api.together.xyz/settings/api-keys")
            print("  (free signup gives $5 credit, enough for ~500 images)")
            sys.exit(1)
    elif backend in ("gemini", "imagen"):
        if not GEMINI_API_KEY:
            print("ERROR: GEMINI_API_KEY not set.")
            print("Set it in .env file or as an environment variable.")
            print("Get a free key at: https://aistudio.google.com/apikey")
            print("\nNote: Gemini image generation is geo-restricted.")
            print("If it doesn't work, try --model together instead.")
            sys.exit(1)
        client = genai.Client(api_key=GEMINI_API_KEY)

    # Filter images
    to_generate = IMAGES
    if args.only:
        # Match by group name or individual ID
        filtered = {k: v for k, v in IMAGES.items()
                    if v["group"] == args.only or k == args.only}
        if not filtered:
            print(f"No images matching '{args.only}'. Use --list to see all IDs.")
            sys.exit(1)
        to_generate = filtered

    if args.force:
        # Remove existing files so they get regenerated
        for info in to_generate.values():
            path = OUTPUT_DIR / info["path"]
            if path.exists():
                path.unlink()

    print(f"Generating {len(to_generate)} images via {backend}...\n")

    success = 0
    failed = 0

    for id, info in to_generate.items():
        output_path = OUTPUT_DIR / info["path"]
        print(f"[{id}]")
        if generate_image(client, backend, model_id, info["prompt"], output_path):
            success += 1
        else:
            failed += 1

        # Rate limiting — be gentle with APIs
        time.sleep(2)

    print(f"\nDone: {success} generated, {failed} failed, "
          f"{len(to_generate) - success - failed} skipped")


if __name__ == "__main__":
    main()
