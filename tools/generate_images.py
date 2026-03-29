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

# ---------------------------------------------------------------------------
# Modular prompt system
# ---------------------------------------------------------------------------
# [Core Style] + [Subject & Action] + [Characters & Setting] + [Refinement]

CORE_STYLE = (
    "An energetic educational app illustration, "
    "comic book art style inspired by modern DC Comics, "
    "cinematic and dynamic composition, high-contrast, "
    "detailed ink line work. "
    "Muted color palette with shades of slate gray, charcoal, and deep browns. "
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
img("mod-vocabulary",  "modules/vocabulary.webp",
    "A charismatic teacher figure conjures swirling, glowing blue 3D word bubbles and flashcards from an open book.",
    "Diverse students in a bright modern classroom reach up to catch the floating words, amazed.",
    group="modules")

img("mod-grammar",     "modules/grammar.webp",
    "A charismatic figure conjures swirling, glowing blue 3D punctuation marks and sentence fragments from their hands.",
    "An enthusiastic teacher and diverse students inside a modern school library, looking up in wonder.",
    group="modules")

img("mod-spelling",    "modules/spelling.webp",
    "A confident student figure assembles glowing blue 3D letter blocks into words mid-air, like building blocks.",
    "Other students watch and cheer inside a colorful modern classroom.",
    group="modules")

img("mod-reading",     "modules/reading.webp",
    "A young hero figure holds open a massive glowing book, and vivid 3D illustrations — castles, dragons, ships — pour out of the pages.",
    "Students sit cross-legged on the floor of a grand library, captivated by the scenes emerging from the book.",
    group="modules")

img("mod-listening",   "modules/listening.webp",
    "A figure wearing an elegant robe stands inside a grand amphitheater, smiling as complex, glowing blue sound waves, musical notes, and symbols gently swirl towards the group.",
    "Students in the foreground wear large headphones and look up in awe, actively listening and absorbing the symbols.",
    group="modules")

img("mod-tests",       "modules/tests.webp",
    "A figure wearing a graduation cap stands confidently over a giant, 3D glowing blue puzzle block, using a wrench to fit the final glowing piece into place.",
    "A team of diverse students works together, offering tools and celebrating.",
    group="modules")

# --- Unit 7 topic illustrations ---
img("topic-jobs",      "topics/unit7-jobs.webp",
    "A panoramic scene of diverse workers in action: a chef cooking with flames, a photographer snapping photos, a singer performing on stage, a farmer harvesting crops.",
    "Each worker glows with blue energy outlines, standing in their respective environments merged into one dynamic cityscape.",
    group="topics")

img("topic-adjectives","topics/unit7-adjectives.webp",
    "Six expressive character portraits arranged in a comic panel grid, each showing a distinct personality: kind and warm, clever and focused, lazy and yawning, brave and determined, friendly and waving, popular and surrounded by admirers.",
    "Each portrait has a different background tone reflecting the mood of the trait.",
    group="topics")

img("topic-zero-cond", "topics/unit7-zero-conditional.webp",
    "A dramatic split-panel illustration: on one side, the blazing sun shines down on a block of ice; on the other side, a puddle of water with steam rising. A glowing blue arrow connects the two scenes.",
    "A young scientist figure stands between the panels, gesturing to demonstrate the cause and effect.",
    group="topics")

img("topic-look-like", "topics/unit7-look-like.webp",
    "A family portrait scene with distinct character designs: a tall father with brown hair, a shorter mother with blonde hair, a child with wild curly red hair, and a grandmother with glasses and silver hair.",
    "They stand together on a porch, each with exaggerated comic-book features to emphasize their unique appearance.",
    group="topics")

img("topic-passive",   "topics/unit5-passive.webp",
    "A dramatic factory scene with a conveyor belt where glowing cars are being assembled by powerful robot arms, sparks flying.",
    "A student figure watches through a viewing window, taking notes on a clipboard.",
    group="topics")

img("topic-subjects",  "topics/unit6-subjects.webp",
    "A dynamic ring of floating school subject icons orbiting a central glowing globe: a bubbling flask, a paintbrush with paint splatter, a football mid-kick, a musical note, a calculator, a compass.",
    "Students stand below looking up at the orbiting icons in a grand school hall.",
    group="topics")

img("topic-altamira",  "topics/unit7-altamira.webp",
    "Inside a vast, dimly lit prehistoric cave, ancient paintings of bison and horses glow on the rocky walls with warm amber torchlight.",
    "A young explorer figure holds up a torch, illuminating the cave art with dramatic shadows cast across the cavern.",
    group="topics")

img("topic-quixote",   "topics/unit7-quixote.webp",
    "Don Quixote in battered armor charges on his thin horse towards enormous windmills silhouetted against a dramatic sunset sky.",
    "Sancho Panza watches from behind a rock, shaking his head. The Spanish countryside stretches out with rolling golden hills.",
    group="topics")

# --- Unit 6 topic illustrations ---
img("topic-maps",      "topics/unit6-maps.webp",
    "A giant treasure-style map unfurls across a table, with a glowing blue compass rose, dotted paths, and 3D landmark icons rising from the surface — a school, park, library.",
    "A group of students leans over the map, tracing routes with their fingers, an adventure-planning scene.",
    group="topics")

img("topic-technology","topics/unit6-technology.webp",
    "A sleek desk setup with a glowing laptop, tablet and smartphone, holographic wifi symbols and download arrows floating above the screens.",
    "A student figure interacts with the holographic interface, swiping and tapping mid-air.",
    group="topics")

img("topic-modals",    "topics/unit6-modals.webp",
    "Three imposing road signs dominate the scene: a green sign with a glowing thumbs up, a blue sign with a bold exclamation mark, and a red sign with a sharp X.",
    "Students walk along a path, choosing which direction to follow at the crossroads of rules.",
    group="topics")

# --- Listening illustrations ---
img("listen-directions","topics/listen-directions.webp",
    "A person stands at a city crossroads, looking at glowing directional signs and floating map pins pointing different ways.",
    "Buildings frame the scene, and blue navigation arrows hover in the air showing possible routes.",
    group="topics")

img("listen-appearance","topics/listen-appearance.webp",
    "Two young characters face each other, with glowing blue holographic icons floating between them — icons of different hairstyles, eye colours, and heights.",
    "They gesture at the icons as if describing each other, in a bright modern school courtyard.",
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
