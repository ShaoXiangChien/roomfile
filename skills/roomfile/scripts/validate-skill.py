#!/usr/bin/env python3
"""Dependency-free structural validator for the portable Roomfile skill."""

from pathlib import Path
import re
import sys


ROOT = Path(__file__).resolve().parents[1]
SKILL = ROOT / "SKILL.md"


def main() -> int:
    errors: list[str] = []
    text = SKILL.read_text(encoding="utf-8") if SKILL.exists() else ""
    match = re.match(r"^---\n(.*?)\n---\n", text, re.DOTALL)
    if not match:
        errors.append("SKILL.md needs YAML frontmatter")
    else:
        frontmatter = match.group(1)
        if not re.search(r"^name:\s*roomfile\s*$", frontmatter, re.MULTILINE):
            errors.append("frontmatter name must be roomfile")
        if not re.search(r"^description:\s*.+$", frontmatter, re.MULTILINE):
            errors.append("frontmatter needs a description")
        unsupported = [
            line
            for line in frontmatter.splitlines()
            if line and not line.startswith(("name:", "description:"))
        ]
        if unsupported:
            errors.append("frontmatter may contain only name and description")

    required = [
        "agents/openai.yaml",
        "references/workflows.md",
        "references/data-model.md",
        "references/rendering.md",
        "references/sourcing.md",
        "references/safety.md",
        "references/schemas/geometry.schema.json",
        "references/schemas/facts.schema.json",
        "references/schemas/concept.schema.json",
        "references/schemas/products.schema.json",
        "references/schemas/render-request.schema.json",
        "references/schemas/profile.schema.json",
        "references/schemas/style-context.schema.json",
        "scripts/init-project.mjs",
        "scripts/migrate-project.mjs",
        "scripts/resolve-style.mjs",
        "scripts/validate-style-atlas.mjs",
        "scripts/validate-project.mjs",
        "scripts/render-layout.mjs",
        "scripts/check-fit.mjs",
    ]
    for relative in required:
        if not (ROOT / relative).exists():
            errors.append(f"missing {relative}")

    if errors:
        for error in errors:
            print(f"ERROR: {error}")
        return 1
    print("Roomfile skill is valid.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
