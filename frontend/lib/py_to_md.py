from pathlib import Path

# Root = current directory
ROOT = Path.cwd()

# Output file
OUTPUT = ROOT / "NEXTJS_PROJECT_SOURCE.md"

# Folders to include (relative to project root)
INCLUDED_DIRS = {
    "api",
    "",
}

# Specific root-level files to include
INCLUDED_FILES = {
    "package.json",
    "tsconfig.json",
    "next.config.ts",
    "next.config.js",
    "next.config.mjs",
    "postcss.config.mjs",
    "tailwind.config.ts",
    "tailwind.config.js",
    "eslint.config.mjs",
}

# Folders to ignore even inside included directories
EXCLUDED_DIRS = {
    "node_modules",
    ".next",
    ".git",
    ".vercel",
    "dist",
    "build",
    "coverage",
}

# Files to ignore
EXCLUDED_FILES = {
    OUTPUT.name,
    "package-lock.json",
    "yarn.lock",
    "pnpm-lock.yaml",
    "bun.lock",
}


def should_skip(path: Path) -> bool:
    """Check whether a file is inside an excluded folder."""
    return any(
        part in EXCLUDED_DIRS
        for part in path.relative_to(ROOT).parts
    )


def collect_files():
    """Collect files only from specified folders and root-level files."""
    files = set()

    # Include explicitly selected root-level files
    for filename in INCLUDED_FILES:
        path = ROOT / filename
        if path.is_file() and path.name not in EXCLUDED_FILES:
            files.add(path)

    # Include files recursively from selected directories
    for folder in INCLUDED_DIRS:
        folder_path = ROOT / folder

        if not folder_path.is_dir():
            continue

        for path in folder_path.rglob("*"):
            if (
                path.is_file()
                and not should_skip(path)
                and path.name not in EXCLUDED_FILES
            ):
                files.add(path)

    return sorted(files)


def create_markdown():
    files = collect_files()

    with OUTPUT.open("w", encoding="utf-8") as md:
        md.write("# Next.js Project Source\n\n")
        md.write(
            "This document contains source files from selected "
            "Next.js project directories and configuration files.\n\n"
        )

        md.write(f"**Project root:** `{ROOT}`\n\n")
        md.write(f"**Files included:** {len(files)}\n\n")
        md.write("---\n\n")

        for file_path in files:
            relative_path = file_path.relative_to(ROOT)

            md.write(f"## `{relative_path}`\n\n")
            md.write(f"**File:** `{relative_path}`\n\n")

            try:
                content = file_path.read_text(encoding="utf-8")
            except (UnicodeDecodeError, OSError):
                md.write("> ⚠️ Could not read this file as UTF-8. Skipped.\n\n")
                md.write("---\n\n")
                continue

            fence = "````" if "```" in content else "```"

            md.write(f"{fence}text\n")
            md.write(content)

            if content and not content.endswith("\n"):
                md.write("\n")

            md.write(f"{fence}\n\n")
            md.write("---\n\n")

    print(f"Created: {OUTPUT}")
    print(f"Files included: {len(files)}")


if __name__ == "__main__":
    create_markdown()