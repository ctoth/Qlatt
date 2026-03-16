"""Migrate knowledge/concepts/ from old kind: tagged union to new form: format.

Mapping rules:
  kind.category -> form: category, form_parameters: {values: [...], extensible: bool}
  kind.quantity -> form determined by unit/dimension:
    Hz, T-1            -> frequency
    seconds, T         -> time
    cm_H2O, ML-1T-2    -> pressure
    cm3_per_second, L3T-1 -> flow
    volume_velocity_per_second, L3T-2 -> flow_derivative
    dB, dimensionless   -> level
    dimensionless, dimensionless -> dimensionless_compound
    ratio, dimensionless -> duration_ratio (default for most),
                            dimensionless_compound for glottal_frequency_ratio
  range from kind.quantity -> top-level range on concept
"""

import sys
from pathlib import Path

try:
    from ruamel.yaml import YAML
    yaml = YAML()
    yaml.preserve_quotes = True
    yaml.width = 120
    USE_RUAMEL = True
except ImportError:
    import yaml as pyyaml
    USE_RUAMEL = False

CONCEPTS_DIR = Path(__file__).resolve().parent.parent / "knowledge" / "concepts"

# Concepts where unit=ratio but semantics are NOT duration ratio
FREQUENCY_RATIO_CONCEPTS = {"glottal_frequency_ratio"}

# Map (unit, dimension) -> form string
QUANTITY_FORM_MAP = {
    ("Hz", "T-1"): "frequency",
    ("Hz", None): "frequency",  # fundamental_frequency has no dimension
    ("seconds", "T"): "time",
    ("cm_H2O", "ML-1T-2"): "pressure",
    ("cm3_per_second", "L3T-1"): "flow",
    ("volume_velocity_per_second", "L3T-2"): "flow_derivative",
    ("dB", "dimensionless"): "level",
    ("dimensionless", "dimensionless"): "dimensionless_compound",
}


def determine_form_for_quantity(canonical_name, unit, dimension):
    """Determine the form string for a quantity kind concept."""
    if unit == "ratio" and dimension == "dimensionless":
        if canonical_name in FREQUENCY_RATIO_CONCEPTS:
            return "dimensionless_compound"
        return "duration_ratio"

    key = (unit, dimension)
    if key in QUANTITY_FORM_MAP:
        return QUANTITY_FORM_MAP[key]

    raise ValueError(f"No form mapping for unit={unit}, dimension={dimension} "
                     f"on concept {canonical_name}")


def build_form_parameters(form, kind_data, canonical_name):
    """Build form_parameters dict based on form type and old kind data."""
    if form == "category":
        cat = kind_data["category"]
        return {"values": list(cat["values"]), "extensible": cat["extensible"]}

    if form == "duration_ratio":
        return {"numerator": "duration", "denominator": "duration"}

    if form == "dimensionless_compound":
        return {"construction": None}

    if form == "level":
        return {"scale": "dB", "reference": None}

    if form == "pressure":
        q = kind_data["quantity"]
        unit = q.get("unit", "")
        if unit == "cm_H2O":
            return {"preferred_unit": "cmH2O"}
        return None

    # For frequency, time, flow, flow_derivative, amplitude_ratio:
    # the form file already defines everything needed
    return None


def migrate_file(filepath):
    """Migrate a single concept YAML file from kind: to form: format."""
    if USE_RUAMEL:
        data = yaml.load(filepath)
    else:
        with open(filepath) as f:
            data = pyyaml.safe_load(f)

    if "kind" not in data:
        print(f"  SKIP {filepath.name}: no kind field")
        return None

    if "form" in data:
        print(f"  SKIP {filepath.name}: already has form field")
        return None

    kind = data["kind"]
    canonical_name = data.get("canonical_name", filepath.stem)

    if "category" in kind:
        form = "category"
        form_params = build_form_parameters(form, kind, canonical_name)
        concept_range = None
    elif "quantity" in kind:
        q = kind["quantity"]
        unit = q.get("unit")
        dimension = q.get("dimension")
        concept_range = q.get("range")
        form = determine_form_for_quantity(canonical_name, unit, dimension)
        form_params = build_form_parameters(form, kind, canonical_name)
    else:
        print(f"  ERROR {filepath.name}: unknown kind type {list(kind.keys())}")
        return None

    # Remove kind, add form + form_parameters + range
    del data["kind"]
    data["form"] = form
    if form_params is not None:
        data["form_parameters"] = form_params
    if concept_range is not None:
        data["range"] = concept_range

    if USE_RUAMEL:
        yaml.dump(data, filepath)
    else:
        with open(filepath, "w") as f:
            pyyaml.dump(data, f, default_flow_style=False, sort_keys=False,
                        allow_unicode=True)

    return form


def main():
    if not CONCEPTS_DIR.exists():
        print(f"ERROR: {CONCEPTS_DIR} does not exist")
        sys.exit(1)

    results = {}
    for filepath in sorted(CONCEPTS_DIR.glob("*.yaml")):
        if filepath.name.startswith("."):
            continue
        print(f"Processing {filepath.name}...")
        form = migrate_file(filepath)
        if form is not None:
            results[filepath.stem] = form

    print(f"\nMigrated {len(results)} concepts:")
    for name, form in sorted(results.items()):
        print(f"  {name} -> {form}")


if __name__ == "__main__":
    main()
