#!/usr/bin/env python3

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA_FILE = ROOT / "_data" / "drafts.json"

with open(DATA_FILE, "r", encoding="utf-8") as f:
    drafts = json.load(f)

drafts_by_name = {
    d["shortName"].strip(): d
    for d in drafts
}

# Regex to match YAML block at the beginning of the file
FRONT_MATTER_REGEX = re.compile(r"^---\s*\n(.*?)\n---\s*\n", re.DOTALL)

def process_directory(lang):
    directory = ROOT / "drafts" / lang
    files = list(directory.glob("*.md")) + list(directory.glob("*.html"))

    for filepath in files:
        short_name = filepath.stem.strip()
        draft = drafts_by_name.get(short_name)

        if not draft:
            print(f"SKIP: {filepath} — no entry in drafts.json")
            continue

        if lang == "hi":
            title = (
                draft.get("hiTitleLong")
                or draft.get("hiTitle")
                or draft["shortName"]
            )
            description = draft.get("hiDesc") or ""
        else:
            title = (
                draft.get("enTitleLong")
                or draft.get("enTitle")
                or draft["shortName"]
            )
            description = draft.get("enDesc") or ""

        escaped_title = title.replace('"', '\\"')
        escaped_desc = description.replace('"', '\\"').replace("\n", " ")

        new_front_matter = f"""---
title: "{escaped_title}"
description: "{escaped_desc}"
lang: {lang}
---

"""

        content = filepath.read_text(encoding="utf-8")

        # If front matter exists, replace it; otherwise, prepend it
        if FRONT_MATTER_REGEX.match(content):
            updated_content = FRONT_MATTER_REGEX.sub(new_front_matter, content, count=1)
        else:
            updated_content = new_front_matter + content

        filepath.write_text(updated_content, encoding="utf-8")
        print(f"UPDATED: {filepath}")

process_directory("hi")
process_directory("en")

