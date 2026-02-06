#!/usr/bin/env python3
import argparse
import hashlib
import json
import os
from datetime import datetime
from typing import Optional, Tuple, List

try:
    from PIL import Image  # type: ignore
    import pytesseract  # type: ignore
    OCR_AVAILABLE = True
except Exception:
    OCR_AVAILABLE = False

KEYWORDS = ["kbz", "aya", "cb", "kpay", "wave", "transfer", "payment", "success", "reference", "txn", "trxn"]


def sha256_file(path: str) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            h.update(chunk)
    return h.hexdigest()


def ocr_text(path: str) -> str:
    if not OCR_AVAILABLE:
        return ""
    try:
        img = Image.open(path)
        text = pytesseract.image_to_string(img)
        return text
    except Exception:
        return ""


def score_slip(text: str, amount: Optional[str]) -> Tuple[float, List[str]]:
    notes: List[str] = []
    score = 0.0

    t = text.lower()
    if any(k in t for k in KEYWORDS):
        score += 40
    else:
        notes.append("keywords_missing")

    if amount and amount.strip():
        if amount.replace(",", "") in t:
            score += 30
        else:
            notes.append("amount_not_found")

    if len(t.strip()) > 20:
        score += 20
    else:
        notes.append("low_text")

    # Date sanity check (very basic)
    now = datetime.now().date()
    for fmt in ["%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y"]:
        try:
            if fmt in t:
                break
        except Exception:
            pass

    # If future date detected in text, lower confidence (naive)
    for token in t.replace("/", "-").split():
        if len(token) == 10 and token.count("-") == 2:
            try:
                d = datetime.strptime(token, "%Y-%m-%d").date()
                if d > now:
                    score -= 10
                    notes.append("future_date")
            except Exception:
                pass

    return max(score, 0.0), notes


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--image", required=True)
    parser.add_argument("--amount")
    args = parser.parse_args()

    if not os.path.exists(args.image):
        print(json.dumps({"error": "image_not_found"}))
        return

    slip_hash = sha256_file(args.image)
    text = ocr_text(args.image)
    score, notes = score_slip(text, args.amount)

    if score >= 70:
        verdict = "ok"
    elif score >= 40:
        verdict = "suspicious"
    else:
        verdict = "manual"

    print(
        json.dumps(
            {
                "verdict": verdict,
                "score": round(score, 2),
                "hash": slip_hash,
                "notes": notes,
                "ocr_available": OCR_AVAILABLE,
                "text": text[:2000],
            }
        )
    )


if __name__ == "__main__":
    main()
