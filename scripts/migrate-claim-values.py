"""Migrate claim files from float[] value format to named scalar fields.

Transforms:
- value: [x]       -> value: x
- value: [x, y]    -> lower_bound: x, upper_bound: y, value: (x+y)/2

Usage:
    uv run python scripts/migrate-claim-values.py [claims_dir]

Default claims_dir: knowledge/claims/
"""

from __future__ import annotations

import sys
from pathlib import Path

import yaml


def migrate_claim(claim: dict) -> bool:
    """Migrate a single claim's value field. Returns True if modified."""
    if claim.get("type") != "parameter":
        return False

    value = claim.get("value")
    if not isinstance(value, list):
        return False  # Already migrated or no value

    modified = False

    if len(value) == 1:
        # Scalar: [x] -> x
        claim["value"] = value[0]
        modified = True
    elif len(value) == 2:
        # Range: [x, y] -> lower_bound, upper_bound, value=(x+y)/2
        lo, hi = float(min(value)), float(max(value))
        claim["lower_bound"] = lo
        claim["upper_bound"] = hi
        claim["value"] = (lo + hi) / 2
        modified = True

    return modified


def migrate_file(filepath: Path) -> int:
    """Migrate all claims in a file. Returns count of modified claims."""
    with open(filepath) as f:
        data = yaml.safe_load(f)

    if not data or "claims" not in data:
        return 0

    count = 0
    for claim in data["claims"]:
        if isinstance(claim, dict) and migrate_claim(claim):
            count += 1

    if count > 0:
        with open(filepath, "w") as f:
            yaml.dump(data, f, default_flow_style=False, allow_unicode=True, sort_keys=False)

    return count


def main():
    claims_dir = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("knowledge/claims")

    if not claims_dir.exists():
        print(f"ERROR: Claims directory '{claims_dir}' does not exist")
        sys.exit(1)

    total_files = 0
    total_claims = 0

    for entry in sorted(claims_dir.iterdir()):
        if entry.is_file() and entry.suffix == ".yaml":
            count = migrate_file(entry)
            if count > 0:
                print(f"  {entry.name}: {count} claim(s) migrated")
                total_files += 1
                total_claims += count

    print(f"\nMigrated {total_claims} claim(s) across {total_files} file(s)")


if __name__ == "__main__":
    main()
