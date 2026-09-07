import os
import argparse
from pathlib import Path
import html2text

def configure_converter():
    converter = html2text.HTML2Text()
    converter.ignore_links = False
    converter.ignore_images = False
    converter.body_width = 0  # Prevents arbitrary wrapping of long lines
    converter.mark_code = True
    return converter

def convert_directory(input_dir: str, output_dir: str = None, keep_hierarchy: bool = True):
    input_path = Path(input_dir).resolve()
    output_path = Path(output_dir).resolve() if output_dir else input_path
    
    converter = configure_converter()
    html_files = list(input_path.rglob("*.html")) + list(input_path.rglob("*.htm"))

    if not html_files:
        print(f"No HTML files found in {input_path}")
        return

    print(f"Found {len(html_files)} files. Converting...")

    for file_path in html_files:
        try:
            # Determine destination path
            if keep_hierarchy and output_dir:
                relative_path = file_path.relative_to(input_path)
                dest_file = output_path / relative_path.with_suffix(".md")
            else:
                dest_file = (output_path / file_path.name).with_suffix(".md")

            # Ensure subdirectories exist
            dest_file.parent.mkdir(parents=True, exist_ok=True)

            # Read and convert
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                html_content = f.read()

            markdown_content = converter.handle(html_content)

            # Save Markdown output
            with open(dest_file, "w", encoding="utf-8") as f:
                f.write(markdown_content)

            print(f"Converted: {file_path.name} -> {dest_file.name}")

        except Exception as e:
            print(f"Error converting {file_path}: {e}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Convert HTML files to Markdown in a directory.")
    parser.add_argument("input_dir", help="Path to the directory containing HTML files")
    parser.add_argument("-o", "--output_dir", help="Directory to save converted .md files (defaults to input dir)", default=None)

    args = parser.parse_args()
    convert_directory(args.input_dir, args.output_dir)

