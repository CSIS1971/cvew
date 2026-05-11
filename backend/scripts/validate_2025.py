"""
Validate 2025 VEWS Yearly Dataset Excel file against existing DB.
Reports: row counts, duplicate incident IDs, missing region matches,
unmatched Options (violence form, weapon type, issue type, actor types,
intervene actors), and casualty integrity.
"""

import os
import sys
import django
import pandas as pd

# Bootstrap Django
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")
django.setup()

from apps.web.models import Incidents, Regions, Options  # noqa: E402

EXCEL = "/Users/pro/Dev/cvews/Yearly Dataset 2025 - VEWS Dataset (v.1.0).xlsx"
SHEET = "(Authentic) VEWS Yearly Dataset"

# Options Category mapping (per existing DB)
CAT_VIOLENCE_FORM = 5
CAT_WEAPON_TYPE = 6
CAT_ISSUE_TYPE = 2
CAT_ACTOR = 3
CAT_ACTOR_TYPE = 4
CAT_INTERVENE_ACTOR = 7


def norm(v):
    if pd.isna(v):
        return None
    s = str(v).strip()
    return s if s and s != "-" else None


def report():
    df = pd.read_excel(EXCEL, sheet_name=SHEET)
    print(f"=== File: {EXCEL.split('/')[-1]} (sheet: {SHEET}) ===")
    print(f"Total rows: {len(df)}")
    print(f"Year breakdown: {df['year'].value_counts().sort_index().to_dict()}")

    # Filter rows with valid incident_id
    df = df[df["incident_id"].notna() & (df["incident_id"].astype(str).str.strip() != "")]
    print(f"Rows with incident_id: {len(df)}")

    # 1. Duplicate incident_id within file
    dup_in_file = df[df.duplicated("incident_id", keep=False)]["incident_id"].unique()
    print(f"\n[1] Duplicates within file: {len(dup_in_file)}")
    if len(dup_in_file):
        print("  examples:", list(dup_in_file)[:5])

    # 2. Existing in DB
    incoming_ids = set(df["incident_id"].astype(str).str.strip())
    existing_ids = set(
        Incidents.objects.filter(incident_id__in=list(incoming_ids))
        .values_list("incident_id", flat=True)
    )
    print(f"\n[2] Already in DB (will update): {len(existing_ids)}")
    print(f"    New (will insert): {len(incoming_ids) - len(existing_ids)}")

    # 3. Province match (via area_code)
    province_codes = set()
    for v in df["province_id"].dropna():
        try:
            province_codes.add(int(v))
        except (ValueError, TypeError):
            pass
    db_codes = set(
        Regions.objects.filter(area_code__in=province_codes)
        .values_list("area_code", flat=True)
    )
    missing_codes = province_codes - db_codes
    print(f"\n[3] Province codes in file: {len(province_codes)}")
    print(f"    Matched in DB: {len(db_codes)}")
    print(f"    Missing province codes: {sorted(missing_codes)[:10] if missing_codes else 'none'}")

    # 4. Options validation per category
    def check_options(label, columns, category):
        values = set()
        for col in columns:
            for v in df[col].dropna():
                n = norm(v)
                if n:
                    values.add(n.upper())
        db_titles = set(
            Options.objects.filter(category_id=category)
            .values_list("title", flat=True)
        )
        db_titles_upper = {t.upper() for t in db_titles}
        missing = values - db_titles_upper
        print(f"\n[{label}] distinct values in file: {len(values)}, missing in DB: {len(missing)}")
        if missing:
            for m in sorted(missing)[:10]:
                print(f"    - {m}")

    check_options("Violence Forms", ["violence_form1", "violence_form2"], CAT_VIOLENCE_FORM)
    check_options("Weapon Types", ["weapon_type1", "weapon_type2"], CAT_WEAPON_TYPE)
    check_options("Issue Types", ["issue_type1", "issue_type2"], CAT_ISSUE_TYPE)
    check_options(
        "Actor Types",
        ["actor1a_t", "actor1b_t", "actor2a_t", "actor2b_t", "intervene_actor_type1", "intervene_actor_type2"],
        CAT_ACTOR_TYPE,
    )

    # 5. Casualty integrity
    cas_cols = ["num_death", "num_injured", "death_injured", "fem_death", "fem_injured", "child_death", "child_injured", "infra_damage", "infra_destroyed"]
    print("\n[5] Casualty totals:")
    for c in cas_cols:
        col = pd.to_numeric(df[c], errors="coerce")
        print(f"    {c}: sum={col.sum():.0f}, na={col.isna().sum()}, negatives={(col < 0).sum()}")

    # 6. Required field check
    print("\n[6] Required field nulls:")
    print(f"    date: {df['date'].isna().sum()}")
    print(f"    province: {df['province'].isna().sum()}")
    print(f"    incident_id: {df['incident_id'].isna().sum()}")
    print(f"    description (inc_desc): {df['inc_desc'].isna().sum()}")


if __name__ == "__main__":
    report()
