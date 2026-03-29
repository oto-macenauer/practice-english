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
SIZE = (768, 400)  # wide banner format matching card display (≈300x160)

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

# ---------------------------------------------------------------------------
# Modular prompt system
# ---------------------------------------------------------------------------
# [Core Style] + [Subject & Action] + [Characters & Setting] + [Refinement]

CORE_STYLE = (
    "An energetic educational app illustration in wide landscape format, "
    "comic book art style inspired by modern DC Comics, "
    "cinematic and dynamic composition, high-contrast, "
    "detailed ink line work. "
    "Muted color palette with shades of slate gray, charcoal, and deep browns. "
    "Important content centered horizontally in the frame. "
)

REFINEMENT = (
    "Dramatic lighting with strong shadows and bright highlights, "
    "focused on an engaging atmosphere. No labels or text."
)


def build_prompt(subject_action: str, characters_setting: str) -> str:
    """Assemble a full prompt from the modular blocks."""
    return f"{CORE_STYLE}{subject_action} {characters_setting} {REFINEMENT}"


# ---------------------------------------------------------------------------
# Image definitions
# ---------------------------------------------------------------------------
IMAGES: dict[str, dict] = {}


def img(id: str, path: str, subject: str, scene: str, group: str = "misc"):
    """Register an image to generate."""
    IMAGES[id] = {
        "path": path,
        "prompt": build_prompt(subject, scene),
        "group": group,
    }


# --- Module cards (homepage) ---
# Each has a UNIQUE composition — no repeated "person standing with hands up" pattern.

img("mod-vocabulary",  "modules/vocabulary.webp",
    "Close-up of a desk covered with scattered flashcards, each card showing a vivid picture — an apple, a dog, a house. Glowing blue connections link related cards together like a web.",
    "Seen from above at an angle, hands of two students reaching for cards. Warm desk lamp lighting.",
    group="modules")

img("mod-grammar",     "modules/grammar.webp",
    "A giant open notebook fills the frame, with colourful sentence diagrams drawn across the pages. Glowing blue lines connect subject, verb, and object blocks like a circuit board.",
    "A pencil rests on the page mid-sentence, ink still wet. Bird's-eye view, dramatic shadows from a desk lamp.",
    group="modules")

img("mod-spelling",    "modules/spelling.webp",
    "Wooden letter tiles tumble through the air in slow motion, mid-fall, forming a word. Some tiles glow blue as they snap into the correct position.",
    "Dark background with spotlight on the falling tiles, dynamic diagonal composition.",
    group="modules")

img("mod-reading",     "modules/reading.webp",
    "A massive open book lies flat, and from its pages rise miniature 3D scenes — a tiny castle, a sailing ship, a dragon curled around a tower — like a pop-up book come to life.",
    "Viewed from a low angle looking across the pages. Warm golden light spills from the book onto the surrounding dark room.",
    group="modules")

img("mod-listening",   "modules/listening.webp",
    "A pair of large vintage headphones rests on a wooden table. From the ear cups, visible sound waves ripple outward — glowing blue rings expanding into the air, carrying tiny musical notes.",
    "Side view, shallow depth of field, the headphones sharp in focus against a blurred classroom background.",
    group="modules")

img("mod-tests",       "modules/tests.webp",
    "A desk viewed from above: a test paper with rows of checkboxes (some ticked in blue), a sharpened pencil, an eraser, and a small trophy with a star on top. Everything arranged neatly.",
    "Overhead flat-lay composition, clean and organized, strong shadows from directional light.",
    group="modules")

# --- Unit 7 topic illustrations ---
img("topic-jobs",      "topics/unit7-jobs.webp",
    "A wide street scene split into panels like a comic strip: a chef flipping a pan in a kitchen, a photographer crouching to take a shot, a waiter balancing a tray, a farmer driving a tractor.",
    "Each panel has its own color accent. The panels are arranged horizontally across the wide frame.",
    group="topics")

img("topic-adjectives","topics/unit7-adjectives.webp",
    "Six comic-book portrait panels in a 3x2 grid, each showing a close-up face with an exaggerated expression: beaming smile (kind), raised eyebrow with glasses (clever), huge yawn (lazy), clenched fist and determined jaw (brave), wide grin and waving hand (friendly), crowd of tiny admirers around (popular).",
    "Each panel has a distinct background colour. Tight framing on faces.",
    group="topics")

img("topic-zero-cond", "topics/unit7-zero-conditional.webp",
    "A split-panel scene divided by a bold glowing blue lightning-bolt line: LEFT side shows blazing sun melting an ice cube, RIGHT side shows a puddle of water with steam rising.",
    "Wide landscape format, dramatic contrast between the hot left and cool right side. No people, pure cause-and-effect imagery.",
    group="topics")

img("topic-look-like", "topics/unit7-look-like.webp",
    "A family of four walking towards the viewer on a tree-lined street: tall dad with brown hair, shorter mum with blonde bob, energetic child with wild curly red hair mid-jump, grandma with round glasses and silver bun using a walking stick.",
    "Wide shot, golden afternoon light, long shadows stretching towards the camera.",
    group="topics")

img("topic-passive",   "topics/unit5-passive.webp",
    "A wide factory floor seen from a high angle: a conveyor belt stretches across the frame with half-assembled cars. Robot arms weld and bolt parts together, orange sparks flying.",
    "Industrial blue-grey tones, glowing welding light illuminating the scene. No people, pure machinery.",
    group="topics")

img("topic-subjects",  "topics/unit6-subjects.webp",
    "A school hallway with six open classroom doors, each revealing a different subject: a bubbling chemistry flask, an easel with paint, a football on grass, a piano keyboard, a spinning globe, a chalkboard with equations.",
    "Wide perspective shot down the hallway, each door glowing with its own colour.",
    group="topics")

img("topic-altamira",  "topics/unit7-altamira.webp",
    "A wide panoramic view inside a prehistoric cave: ancient paintings of running bison and horse herds stretch across the curved rock wall, lit by warm amber firelight from the bottom.",
    "No people — just the ancient art and the cave. Deep shadows above, warm glow below. Landscape framing.",
    group="topics")

img("topic-quixote",   "topics/unit7-quixote.webp",
    "Wide landscape: Don Quixote on his skinny horse charges from the left towards three towering windmills on the right, silhouetted against a fiery sunset. Sancho Panza sits on a donkey far behind, a tiny figure.",
    "Rolling golden Spanish plains stretch across the frame. Epic cinematic wide shot.",
    group="topics")

# --- Unit 6 topic illustrations ---
img("topic-maps",      "topics/unit6-maps.webp",
    "An old parchment map fills the entire frame, seen from directly above. Dotted paths wind between 3D miniature landmarks — a tiny school building, a green park with trees, a library with columns. A glowing compass rose sits in the corner.",
    "Flat overhead view, the map edges curl up slightly. Warm parchment tones against the grey palette.",
    group="topics")

img("topic-technology","topics/unit6-technology.webp",
    "A modern desk from a three-quarter overhead angle: a laptop screen glows blue, a tablet and phone lie beside it, holographic wifi arcs and download arrows float above the devices.",
    "Clean minimalist desk, dark background, the devices are the only light source. No people.",
    group="topics")

img("topic-modals",    "topics/unit6-modals.webp",
    "A crossroads seen from above: three bold road signs point in different directions — a green circular sign (allowed), a blue square sign (required), and a red triangular sign (forbidden). The roads glow faintly where they lead.",
    "Overhead perspective, the intersection centered in the wide frame. No people.",
    group="topics")

# --- Listening illustrations ---
img("listen-directions","topics/listen-directions.webp",
    "An aerial view of a miniature city model on a table: tiny buildings, streets, and parks. Glowing blue dotted arrows trace a route through the streets, showing directions.",
    "Tilt-shift photography feel, shallow depth of field, warm lighting on the model.",
    group="topics")

img("listen-appearance","topics/listen-appearance.webp",
    "Two comic-book character profiles face each other from opposite sides of the frame, with a VS-style split between them. Each has exaggerated distinct features: one with short dark curly hair and freckles, the other with long straight blonde hair and glasses.",
    "Bold comic panel divider in the center, each side with its own color accent.",
    group="topics")


# ---------------------------------------------------------------------------
# Generation logic
# ---------------------------------------------------------------------------

def save_image(image_data: bytes, output_path: Path):
    """Center-crop to target aspect ratio, then resize. Saves as WebP."""
    image = Image.open(io.BytesIO(image_data))
    w, h = image.size
    target_w, target_h = SIZE
    target_ratio = target_w / target_h  # e.g. 768/400 = 1.92

    # Crop to target aspect ratio from center
    current_ratio = w / h
    if current_ratio > target_ratio:
        # Image is wider than needed — crop sides
        new_w = int(h * target_ratio)
        left = (w - new_w) // 2
        image = image.crop((left, 0, left + new_w, h))
    elif current_ratio < target_ratio:
        # Image is taller than needed — crop top/bottom
        new_h = int(w / target_ratio)
        top = (h - new_h) // 2
        image = image.crop((0, top, w, top + new_h))

    # Resize to exact target
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
