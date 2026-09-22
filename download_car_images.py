#!/usr/bin/env python3
"""
download_car_images.py
======================
Fetch ONE real photo per vehicle in the Vehicle-DSS knowledge base and save it
under the exact filename each record already references in its `image_path`.
 
WHY THIS RUNS ON YOUR MACHINE (and not inside the assistant):
    The assistant's environment has no outbound internet, so it cannot search
    for or download images. This script does that work locally, where you DO
    have internet.
 
PIPELINE (mirrors your diagram):
    vehicle DB  ->  canonical id / image_path  ->  image search  ->  download
                ->  save to <out_dir>  ->  (optional) verify  ->  VehicleCard
 
It de-duplicates by image_path first, so your ~1000 variant rows collapse to the
~150 unique images actually needed (all "Alto K10" variants share one photo).
 
BACKENDS (choose one with --backend):
    serpapi     Google Images via SerpAPI        env: SERPAPI_KEY
    google_cse  Google Programmable Search JSON   env: GOOGLE_API_KEY, GOOGLE_CSE_ID
    manual      read source URLs from a CSV you fill in yourself
 
QUICK START:
    pip install requests pillow
 
    # Option A - automatic search (needs a key, see README_images.md)
    python download_car_images.py \
        --vehicles data/vehicles.json --variants data/variants.json \
        --out ./frontend/public/assets/cars --backend serpapi
 
    # Option B - no API key: emit a template, fill URLs, then download
    python download_car_images.py --vehicles data/vehicles.json \
        --backend manual --sources image_sources.csv --emit-template
    #   ...open image_sources.csv, paste one URL per row...
    python download_car_images.py --vehicles data/vehicles.json \
        --backend manual --sources image_sources.csv --out ./frontend/public/assets/cars
 
    # Build an HTML contact sheet to eyeball matches (the "verify" step)
    python download_car_images.py --out ./frontend/public/assets/cars --contact-sheet verify.html
"""
 
import argparse
import csv
import json
import os
import re
import sys
import time
from urllib.parse import urlparse
 
try:
    import requests
except ImportError:
    sys.exit("This script needs `requests`.  Install it with:  pip install requests")
 
try:
    from PIL import Image  # optional, only used to validate downloads
    HAVE_PIL = True
except ImportError:
    HAVE_PIL = False
 
UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/124.0 Safari/537.36")
 
 
# --------------------------------------------------------------------------- #
# Loading the knowledge base
# --------------------------------------------------------------------------- #
def load_records(path):
    """Accept {vehicles:[...]}, {variants:[...]}, or a bare [...] list."""
    if not path or not os.path.exists(path):
        return []
    with open(path, "r", encoding="utf-8") as fh:
        data = json.load(fh)
    if isinstance(data, list):
        return data
    for key in ("vehicles", "variants", "records", "data"):
        if isinstance(data.get(key), list):
            return data[key]
    # last resort: first list value found
    for v in data.values():
        if isinstance(v, list):
            return v
    return []
 
 
def load_records_from_url(url):
    """Fetch vehicle records from a running API (e.g. http://localhost:8000/api/vehicles)."""
    resp = requests.get(url, headers={"User-Agent": UA}, timeout=30)
    resp.raise_for_status()
    data = resp.json()
    if isinstance(data, list):
        return data
    if isinstance(data, dict):
        for key in ("vehicles", "variants", "records", "data", "results"):
            if isinstance(data.get(key), list):
                return data[key]
        for v in data.values():
            if isinstance(v, list):
                return v
    return []
 
 
def clean_label(text):
    """Turn 'Pre-Owned Swift VXi (2020)' into a cleaner search term."""
    text = re.sub(r"\(.*?\)", "", text)                       # drop (2020) etc.
    text = re.sub(r"\b(Pre-?Owned|Used|Certified)\b", "", text, flags=re.I)
    return re.sub(r"\s+", " ", text).strip()
 
 
def collect_targets(records):
    """
    Return dict: filename -> {'query': str, 'image_path': str, 'label': str}
    De-duplicated by the basename of image_path.
    """
    targets = {}
    for r in records:
        img = r.get("image_path")
        if not img:
            continue
        fname = os.path.basename(img)
        if fname in targets:
            continue
        brand = (r.get("brand") or "").strip()
        label = (r.get("model_name") or r.get("name") or "").strip()
        query = clean_label(f"{brand} {label}".strip()) + " car"
        targets[fname] = {"query": query, "image_path": img, "label": f"{brand} {label}".strip()}
    return targets
 
 
# --------------------------------------------------------------------------- #
# Search backends -> return a single best image URL (or None)
# --------------------------------------------------------------------------- #
def serpapi_search(query):
    key = os.environ.get("SERPAPI_KEY")
    if not key:
        raise RuntimeError("SERPAPI_KEY not set in environment.")
    resp = requests.get(
        "https://serpapi.com/search.json",
        params={"engine": "google_images", "q": query, "ijn": "0", "api_key": key},
        timeout=30,
    )
    resp.raise_for_status()
    for item in resp.json().get("images_results", []):
        url = item.get("original") or item.get("thumbnail")
        if url:
            return url
    return None
 
 
def google_cse_search(query):
    key = os.environ.get("GOOGLE_API_KEY")
    cx = os.environ.get("GOOGLE_CSE_ID")
    if not (key and cx):
        raise RuntimeError("GOOGLE_API_KEY and/or GOOGLE_CSE_ID not set in environment.")
    resp = requests.get(
        "https://www.googleapis.com/customsearch/v1",
        params={"q": query, "searchType": "image", "num": 1,
                "key": key, "cx": cx, "safe": "active"},
        timeout=30,
    )
    resp.raise_for_status()
    items = resp.json().get("items", [])
    return items[0]["link"] if items else None
 
 
def load_manual_sources(path):
    """CSV with columns: filename,image_path,label,source_url"""
    mapping = {}
    if not os.path.exists(path):
        return mapping
    with open(path, newline="", encoding="utf-8") as fh:
        for row in csv.DictReader(fh):
            fn = (row.get("filename") or "").strip()
            url = (row.get("source_url") or "").strip()
            if fn and url:
                mapping[fn] = url
    return mapping
 
 
# --------------------------------------------------------------------------- #
# Download + validate
# --------------------------------------------------------------------------- #
def download(url, dest):
    r = requests.get(url, headers={"User-Agent": UA}, timeout=45, stream=True)
    r.raise_for_status()
    ctype = r.headers.get("Content-Type", "")
    if "image" not in ctype and not re.search(r"\.(jpg|jpeg|png|webp)(\?|$)", url, re.I):
        raise ValueError(f"URL does not look like an image (Content-Type: {ctype!r})")
    tmp = dest + ".part"
    with open(tmp, "wb") as fh:
        for chunk in r.iter_content(8192):
            fh.write(chunk)
    if HAVE_PIL:
        try:
            with Image.open(tmp) as im:
                im.verify()
        except Exception as exc:
            os.remove(tmp)
            raise ValueError(f"downloaded file is not a valid image: {exc}")
    os.replace(tmp, dest)
 
 
# --------------------------------------------------------------------------- #
# Contact sheet (the "verify" step, no extra API needed)
# --------------------------------------------------------------------------- #
def build_contact_sheet(targets, out_dir, html_path):
    rows = []
    for fname, meta in sorted(targets.items(), key=lambda kv: kv[1]["label"]):
        fpath = os.path.join(out_dir, fname)
        exists = os.path.exists(fpath)
        rel = os.path.relpath(fpath, os.path.dirname(os.path.abspath(html_path)) or ".")
        cell = (f'<img src="{rel}" loading="lazy" '
                f'style="width:220px;height:150px;object-fit:cover;border-radius:6px">'
                if exists else
                '<div style="width:220px;height:150px;display:flex;align-items:center;'
                'justify-content:center;background:#f3f3f3;color:#c00;border-radius:6px">MISSING</div>')
        rows.append(
            f'<figure style="margin:0;font:13px/1.4 system-ui">{cell}'
            f'<figcaption style="margin-top:6px"><b>{meta["label"]}</b><br>'
            f'<span style="color:#666">{fname}</span></figcaption></figure>')
    html = ('<!doctype html><meta charset="utf-8"><title>Car image verification</title>'
            '<body style="background:#fff;color:#111;padding:24px">'
            f'<h1 style="font:600 20px system-ui">Verify car images ({len(rows)} models)</h1>'
            '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));'
            'gap:20px;margin-top:16px">' + "".join(rows) + "</div></body>")
    with open(html_path, "w", encoding="utf-8") as fh:
        fh.write(html)
    print(f"[contact-sheet] wrote {html_path} - open it in a browser to verify matches.")
 
 
# --------------------------------------------------------------------------- #
# Main
# --------------------------------------------------------------------------- #
def main():
    ap = argparse.ArgumentParser(description="Download one real photo per vehicle in the DSS knowledge base.")
    ap.add_argument("--vehicles", help="path to vehicles JSON (base models)")
    ap.add_argument("--variants", help="path to variants JSON (optional)")
    ap.add_argument("--api-url", help="read records from a running API instead of files, "
                                      "e.g. http://localhost:8000/api/vehicles")
    ap.add_argument("--out", default="./assets/cars", help="output folder (default ./assets/cars)")
    ap.add_argument("--backend", choices=["serpapi", "google_cse", "manual"], default="serpapi")
    ap.add_argument("--sources", default="image_sources.csv", help="CSV for the manual backend")
    ap.add_argument("--emit-template", action="store_true", help="write a blank image_sources.csv and exit")
    ap.add_argument("--contact-sheet", metavar="HTML", help="build an HTML verify sheet and exit")
    ap.add_argument("--limit", type=int, default=0, help="only process the first N images (testing)")
    ap.add_argument("--sleep", type=float, default=1.0, help="seconds between searches (rate limit)")
    ap.add_argument("--force", action="store_true", help="re-download even if the file already exists")
    args = ap.parse_args()
 
    if args.api_url:
        records = load_records_from_url(args.api_url)
    else:
        records = load_records(args.vehicles) + load_records(args.variants)
    if not records and not args.contact_sheet:
        sys.exit("No records loaded. Use --api-url, or --vehicles/--variants pointing at your JSON files.")
 
    targets = collect_targets(records)
    os.makedirs(args.out, exist_ok=True)
    print(f"[info] {len(records)} records -> {len(targets)} unique images needed.")
 
    # --- emit manual template and exit ---
    if args.emit_template:
        with open(args.sources, "w", newline="", encoding="utf-8") as fh:
            w = csv.writer(fh)
            w.writerow(["filename", "image_path", "label", "source_url"])
            for fname, meta in sorted(targets.items(), key=lambda kv: kv[1]["label"]):
                w.writerow([fname, meta["image_path"], meta["label"], ""])
        print(f"[template] wrote {args.sources} with {len(targets)} rows. "
              "Fill the source_url column, then re-run with --backend manual.")
        return
 
    # --- contact sheet and exit ---
    if args.contact_sheet:
        build_contact_sheet(targets, args.out, args.contact_sheet)
        return
 
    manual_map = load_manual_sources(args.sources) if args.backend == "manual" else {}
    search = {"serpapi": serpapi_search, "google_cse": google_cse_search}.get(args.backend)
 
    log_path = os.path.join(args.out, "images_log.csv")
    log = open(log_path, "w", newline="", encoding="utf-8")
    logw = csv.writer(log)
    logw.writerow(["filename", "label", "query", "source_url", "status"])
 
    ok = skipped = failed = 0
    for i, (fname, meta) in enumerate(sorted(targets.items(), key=lambda kv: kv[1]["label"])):
        if args.limit and i >= args.limit:
            break
        dest = os.path.join(args.out, fname)
        if os.path.exists(dest) and not args.force:
            skipped += 1
            logw.writerow([fname, meta["label"], meta["query"], "", "skipped-exists"])
            continue
        try:
            if args.backend == "manual":
                url = manual_map.get(fname)
                if not url:
                    raise RuntimeError("no source_url in CSV (run --emit-template, then fill it in)")
            else:
                url = search(meta["query"])
                if not url:
                    raise RuntimeError("no image result returned")
                time.sleep(args.sleep)  # be polite to the API
 
            download(url, dest)
            ok += 1
            print(f"[ok]   {meta['label']:<45} -> {fname}")
            logw.writerow([fname, meta["label"], meta["query"], url, "ok"])
        except Exception as exc:
            failed += 1
            print(f"[FAIL] {meta['label']:<45} : {exc}", file=sys.stderr)
            logw.writerow([fname, meta["label"], meta["query"], locals().get("url", ""), f"error: {exc}"])
 
    log.close()
    print(f"\nDone. ok={ok}  skipped={skipped}  failed={failed}")
    print(f"Log written to {log_path}")
    print("Tip: run again with --contact-sheet verify.html to eyeball the results.")
 
 
if __name__ == "__main__":
    main()
