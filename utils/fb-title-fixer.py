import os
import re
from pathlib import Path

TARGET_DIR = Path("fb-export")

processed_count = 0
updated_count = 0
error_count = 0

def process_file(file_path: Path):
    global processed_count, updated_count, error_count
    processed_count += 1

    try:
        content = file_path.read_text(encoding="utf-8")
    except Exception as e:
        print(f"[ERROR] Could not read {file_path}: {e}")
        error_count += 1
        return

    # Extract YAML front matter between --- markers
    match = re.match(r"^---\r?\n(.*?)\r?\n---\r?\n(.*)$", content, re.DOTALL)
    if not match:
        print(f"[ERROR] No valid front matter found in: {file_path}")
        error_count += 1
        return

    front_matter_raw = match.group(1)
    body_content = match.group(2)

    # Extract required and optional fields using regex
    author_match = re.search(r'^author:\s*["\']?(.*?)["\']?\s*$', front_matter_raw, re.MULTILINE)
    date_match = re.search(r'^date:\s*["\']?(.*?)["\']?\s*$', front_matter_raw, re.MULTILINE)
    group_match = re.search(r'^group:\s*["\']?(.*?)["\']?\s*$', front_matter_raw, re.MULTILINE)

    # Validate author and date
    missing = []
    author = author_match.group(1).strip() if author_match else ""
    date_val = date_match.group(1).strip() if date_match else ""
    group = group_match.group(1).strip() if group_match else ""

    if not author:
        missing.append("author")
    if not date_val:
        missing.append("date")

    if missing:
        print(f"[ERROR] Missing required field(s) [{', '.join(missing)}] in: {file_path}")
        error_count += 1
        return

    # Extract just the YYYY-MM-DD portion from ISO timestamp or date string
    date_clean = date_val.split("T")[0].strip("\"'")

    # Build title components
    title_parts = ["Facebook Archive"]
    if group:
        title_parts.append(group)
    title_parts.append(author)
    title_parts.append(date_clean)

    new_title = " | ".join(title_parts)
    # Escape inner double quotes if any exist in the title string
    escaped_title = new_title.replace('"', '\\"')

    # Replace the existing title line in the front matter
    updated_front_matter, subs = re.subn(
        r'^title:.*$',
        f'title: "{escaped_title}"',
        front_matter_raw,
        count=1,
        flags=re.MULTILINE
    )

    if subs == 0:
        print(f"[ERROR] Could not find a 'title:' key to replace in: {file_path}")
        error_count += 1
        return

    # Reassemble and write back to file
    updated_full_content = f"---\n{updated_front_matter}\n---\n{body_content}"
    file_path.write_text(updated_full_content, encoding="utf-8")
    updated_count += 1

def main():
    if not TARGET_DIR.exists():
        print(f"[ERROR] Directory '{TARGET_DIR}' does not exist.")
        return

    print(f"Scanning directory: {TARGET_DIR.resolve()} ...")
    for file_path in TARGET_DIR.rglob("*.html"):
        process_file(file_path)

    print("\n--- Summary ---")
    print(f"Total processed : {processed_count}")
    print(f"Updated         : {updated_count}")
    print(f"Errors          : {error_count}")

if __name__ == "__main__":
    main()

