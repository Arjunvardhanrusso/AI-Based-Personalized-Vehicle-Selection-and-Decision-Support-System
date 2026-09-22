import json
import time
from io import BytesIO
from pathlib import Path
from urllib.parse import quote, urlparse

import requests
from bs4 import BeautifulSoup
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
MANIFEST_PATH = ROOT / "data" / "image_search_test.json"
OUTPUT_DIR = ROOT / "frontend" / "public" / "cars"
RESULT_PATH = ROOT / "data" / "vehicle_images.json"

OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/153.0 Safari/537.36",
    "Accept-Language": "en-US,en;q=0.9"
}

session = requests.Session()
session.headers.update(HEADERS)


def valid_image(content):
    try:
        image = Image.open(BytesIO(content))
        image.verify()
        return True
    except Exception:
        return False


def get_image_size(content):
    try:
        image = Image.open(BytesIO(content))
        return image.size
    except Exception:
        return 0, 0


def search_bing(query):
    url = "https://www.bing.com/images/search?q=" + quote(query)

    try:
        response = session.get(url, timeout=30)
        response.raise_for_status()
    except Exception as e:
        print(f"    Search error: {e}")
        return []

    soup = BeautifulSoup(response.text, "html.parser")
    candidates = []

    for item in soup.find_all("a", class_="iusc"):
        metadata = item.get("m")

        if not metadata:
            continue

        try:
            data = json.loads(metadata)
        except Exception:
            continue

        image_url = data.get("turl")
        source_url = data.get("purl")
        title = data.get("t", "")

        if image_url:
            candidates.append({
                "image_url": image_url,
                "source_url": source_url or "",
                "title": title
            })

    return candidates


def download_image(url):
    try:
        response = session.get(url, timeout=30, allow_redirects=True)

        if response.status_code != 200:
            return None

        content = response.content

        if not valid_image(content):
            return None

        width, height = get_image_size(content)

        if width < 500 or height < 300:
            return None

        return content

    except Exception:
        return None


def save_image(content, path):
    try:
        image = Image.open(BytesIO(content)).convert("RGB")

        if max(image.size) > 1600:
            image.thumbnail((1600, 1600))

        image.save(
            path,
            "JPEG",
            quality=90,
            optimize=True
        )

        return True

    except Exception:
        return False


def process_vehicle(vehicle):
    vehicle_id = vehicle["vehicle_id"]
    name = vehicle["vehicle_name"]
    brand = vehicle["brand"]
    output_path = OUTPUT_DIR / vehicle["image_filename"]

    if output_path.exists():
        print("    Already exists")

        return {
            **vehicle,
            "status": "EXISTS",
            "local_path": str(output_path.relative_to(ROOT))
        }

    for query in vehicle["queries"]:
        print(f"    Search: {query}")

        candidates = search_bing(query)

        print(f"    Candidates: {len(candidates)}")

        for number, candidate in enumerate(candidates[:15], 1):
            print(
                f"      Candidate {number}: "
                f"{candidate['title'][:80]}"
            )

            content = download_image(candidate["image_url"])

            if content is None:
                continue

            if not save_image(content, output_path):
                continue

            source_url = candidate["source_url"]

            try:
                source_name = urlparse(source_url).netloc
            except Exception:
                source_name = ""

            print(f"      DOWNLOADED: {output_path.name}")

            return {
                **vehicle,
                "status": "REVIEW_REQUIRED",
                "local_path": str(output_path.relative_to(ROOT)),
                "source_url": source_url,
                "source_name": source_name,
                "candidate_image_url": candidate["image_url"],
                "candidate_title": candidate["title"],
                "search_query": query
            }

        time.sleep(0.5)

    print(f"    NOT FOUND: {brand} {name}")

    return {
        **vehicle,
        "status": "NOT_FOUND",
        "local_path": "",
        "source_url": "",
        "source_name": ""
    }


def main():
    with open(MANIFEST_PATH, "r", encoding="utf-8") as f:
        vehicles = json.load(f)

    results = []

    print("=" * 70)
    print("REAL VEHICLE IMAGE ACQUISITION")
    print("=" * 70)
    print(f"Vehicles: {len(vehicles)}")
    print(f"Output:   {OUTPUT_DIR}")
    print()

    for index, vehicle in enumerate(vehicles, 1):
        print(
            f"[{index}/{len(vehicles)}] "
            f"{vehicle['brand']} {vehicle['vehicle_name']}"
        )

        result = process_vehicle(vehicle)
        results.append(result)

        with open(RESULT_PATH, "w", encoding="utf-8") as f:
            json.dump(
                results,
                f,
                indent=2,
                ensure_ascii=False
            )

        time.sleep(0.5)

    status_counts = {}

    for result in results:
        status = result["status"]
        status_counts[status] = status_counts.get(status, 0) + 1

    print()
    print("=" * 70)
    print("COMPLETE")
    print("=" * 70)

    for status, count in status_counts.items():
        print(f"{status}: {count}")

    print()
    print(f"Manifest: {RESULT_PATH}")


if __name__ == "__main__":
    main()