"""
Import 2025 VEWS Yearly Dataset into the CVEW database.

Imports: Incidents + Casualities + Actor + Violence + Intervene.
Auto-creates missing Regions and Options (with category mapping).
Suffixes duplicate incident_ids to preserve all rows.
Cleans -99 sentinels via clean_numeric.

Usage:
    python scripts/import_2025.py --dry-run
    python scripts/import_2025.py
"""

import os
import sys
import argparse
import django
import pandas as pd
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")
django.setup()

from django.contrib.auth.models import User  # noqa: E402
from django.utils import timezone  # noqa: E402
from django.db import transaction  # noqa: E402
from django.utils.text import slugify  # noqa: E402

from apps.web.models import (  # noqa: E402
    Incidents, Casualities, Actor, Violence, Intervene,
    Regions, Options, Category,
)

EXCEL = "/Users/pro/Dev/cvews/Yearly Dataset 2025 - VEWS Dataset (v.1.0).xlsx"
SHEET = "(Authentic) VEWS Yearly Dataset"

# Category ID mapping
CAT_REGIONS = 1
CAT_VIOLENCE = 2  # also issue type
CAT_ACTOR = 3
CAT_ACTOR_TYPE = 4
CAT_VIOLENCE_FORM = 5
CAT_WEAPON_TYPE = 6
CAT_INTERVENE_ACTOR = 7


# — Helpers —
def norm(v):
    if pd.isna(v):
        return None
    s = str(v).strip()
    if not s or s == "-":
        return None
    return s


def clean_numeric(value, default=0):
    if pd.isna(value):
        return default
    try:
        v = int(value)
        return v if v >= 0 else default
    except (ValueError, TypeError):
        return default


def parse_timestamp(ts):
    if pd.isna(ts):
        return timezone.now()
    if isinstance(ts, pd.Timestamp):
        dt = ts.to_pydatetime()
    elif isinstance(ts, datetime):
        dt = ts
    else:
        try:
            dt = datetime.strptime(str(ts), "%d/%m/%Y %H.%M.%S")
        except Exception:
            return timezone.now()
    if timezone.is_naive(dt):
        dt = timezone.make_aware(dt)
    return dt


# — Auto-create / lookup —
_options_cache: dict = {}


def get_or_create_option(title: str, category_id: int):
    if not title:
        return None
    key = (title.upper(), category_id)
    if key in _options_cache:
        return _options_cache[key]
    cat = Category.objects.get(pk=category_id)
    obj = Options.objects.filter(title__iexact=title, category=cat).first()
    if not obj:
        obj = Options.objects.create(title=title.strip(), category=cat, slug=slugify(title))
    _options_cache[key] = obj
    return obj


def get_or_create_region(province_id, province_name):
    if pd.isna(province_id):
        return None
    try:
        code = int(province_id)
    except (ValueError, TypeError):
        return None
    r = Regions.objects.filter(area_code=code, parents__isnull=True).first()
    if r:
        return r
    if not province_name:
        return None
    prov_cat = get_or_create_option("Provinsi", CAT_REGIONS)
    return Regions.objects.create(
        name=str(province_name).strip().upper(),
        area_code=code,
        category=prov_cat,
        slug=slugify(province_name),
    )


# — Build dedup map for duplicate incident_ids —
def build_id_map(df):
    """Suffix duplicate incident_ids: same id → first keeps, others get -2, -3."""
    counts: dict = {}
    final_ids = []
    for raw in df["incident_id"].astype(str).str.strip():
        n = counts.get(raw, 0) + 1
        counts[raw] = n
        final_ids.append(raw if n == 1 else f"{raw}-{n}")
    df["__final_id"] = final_ids
    return df


# — Main import —
def import_data(dry_run=False):
    print(f"Loading {EXCEL} ...")
    df = pd.read_excel(EXCEL, sheet_name=SHEET)
    df = df[df["incident_id"].notna() & (df["incident_id"].astype(str).str.strip() != "")]
    df = build_id_map(df.reset_index(drop=True))
    print(f"Rows to process: {len(df)}")

    # Coder/verificator user
    admin_user, _ = User.objects.get_or_create(
        username="admin.csis",
        defaults={"is_staff": True, "is_superuser": True, "email": "admin@csis.org"},
    )

    stats = {
        "total": len(df),
        "created_incidents": 0,
        "updated_incidents": 0,
        "actors": 0,
        "violences": 0,
        "intervenes": 0,
        "errors": 0,
        "error_rows": [],
        "regions_created": 0,
        "options_created": 0,
    }

    # Track new objects (so we can roll back on dry-run)
    pre_regions = Regions.objects.count()
    pre_options = Options.objects.count()

    @transaction.atomic
    def _run():
        sid = transaction.savepoint()
        for idx, row in df.iterrows():
            try:
                final_id = row["__final_id"]
                ts = parse_timestamp(row.get("Timestamp"))

                location = get_or_create_region(row.get("province_id"), row.get("province"))

                fem_d = clean_numeric(row.get("fem_death"))
                fem_i = clean_numeric(row.get("fem_injured"))
                ch_d = clean_numeric(row.get("child_death"))
                ch_i = clean_numeric(row.get("child_injured"))

                desc = norm(row.get("inc_desc")) or ""
                source_url = norm(row.get("source")) or ""

                inc, created = Incidents.objects.update_or_create(
                    incident_id=final_id,
                    defaults={
                        "incident_date": pd.to_datetime(row["date"]).date(),
                        "location": location,
                        "coder": admin_user,
                        "verificator": admin_user,
                        "description": desc,
                        "link": source_url[:200] if source_url else None,
                        "notes": norm(row.get("notes")) or "",
                        "publish": True,
                        "created_at": ts,
                        "updated_at": ts,
                    },
                )
                if created:
                    stats["created_incidents"] += 1
                else:
                    stats["updated_incidents"] += 1

                # Casualities
                Casualities.objects.update_or_create(
                    incident=inc,
                    defaults={
                        "num_death": clean_numeric(row.get("num_death")),
                        "num_injured": clean_numeric(row.get("num_injured")),
                        "death_injured": clean_numeric(row.get("death_injured")),
                        "female_death": fem_d,
                        "female_injured": fem_i,
                        "female_total": fem_d + fem_i,
                        "child_death": ch_d,
                        "child_injured": ch_i,
                        "child_total": ch_d + ch_i,
                        "infra_damage": clean_numeric(row.get("infra_damage")),
                        "infra_destroyed": clean_numeric(row.get("infra_destroyed")),
                        "created_at": ts,
                        "updated_at": ts,
                    },
                )

                # Wipe old Actor/Violence/Intervene rows for this incident, then re-create
                Actor.objects.filter(incident=inc).delete()
                Violence.objects.filter(incident=inc).delete()
                Intervene.objects.filter(incident=inc).delete()

                # Actors — actor1a/b + actor2a/b each pair (actor, type)
                actor_pairs = [
                    ("actor1a", "actor1a_t", "actor1a_vm", "actor1_tot"),
                    ("actor1b", "actor1b_t", "actor1b_vm", "actor1_tot"),
                    ("actor2a", "actor2a_t", "actor2a_vm", "actor2_tot"),
                    ("actor2b", "actor2b_t", "actor2b_vm", "actor2_tot"),
                ]
                for a_col, t_col, vm_col, tot_col in actor_pairs:
                    a_name = norm(row.get(a_col))
                    t_name = norm(row.get(t_col))
                    if not a_name or not t_name:
                        continue
                    actor_opt = get_or_create_option(a_name, CAT_ACTOR)
                    type_opt = get_or_create_option(t_name, CAT_ACTOR_TYPE)
                    Actor.objects.create(
                        incident=inc,
                        actor=actor_opt,
                        actor_atribute=type_opt,
                        minorities=norm(row.get(vm_col)) == "IYA" if row.get(vm_col) is not None else False,
                        total_actor=clean_numeric(row.get(tot_col), default=-99),
                    )
                    stats["actors"] += 1

                # Violence — pair violence_form + weapon_type + issue_type by sequence
                vf_pairs = [
                    ("violence_form1", "weapon_type1", "issue_type1", 1),
                    ("violence_form2", "weapon_type2", "issue_type2", 2),
                ]
                for vf_col, wt_col, it_col, seq in vf_pairs:
                    vf = norm(row.get(vf_col))
                    if not vf:
                        continue
                    wt = norm(row.get(wt_col)) or "TIDAK ADA"
                    it = norm(row.get(it_col)) or "TIDAK JELAS"
                    vf_opt = get_or_create_option(vf, CAT_VIOLENCE_FORM)
                    wt_opt = get_or_create_option(wt, CAT_WEAPON_TYPE)
                    it_opt = get_or_create_option(it, CAT_VIOLENCE)
                    Violence.objects.create(
                        incident=inc,
                        violence_form=vf_opt,
                        weapon_type=wt_opt,
                        issue_type=it_opt,
                        sequence=seq,
                    )
                    stats["violences"] += 1

                # Intervene
                if norm(row.get("intervene")) == "IYA":
                    intervene_pairs = [
                        ("intervene_actor1", "intervene_actor_type1"),
                        ("intervene_actor2", "intervene_actor_type2"),
                    ]
                    for ia_col, iat_col in intervene_pairs:
                        ia = norm(row.get(ia_col))
                        iat = norm(row.get(iat_col))
                        if not ia or not iat:
                            continue
                        ia_opt = get_or_create_option(ia, CAT_INTERVENE_ACTOR)
                        iat_opt = get_or_create_option(iat, CAT_ACTOR_TYPE)
                        Intervene.objects.create(
                            incident=inc,
                            intervene_actor=ia_opt,
                            intervene_actor_type=iat_opt,
                            result=norm(row.get("intervene_result")) == "BERHASIL",
                        )
                        stats["intervenes"] += 1

            except Exception as e:
                stats["errors"] += 1
                stats["error_rows"].append({"row": idx + 2, "id": row.get("__final_id"), "error": str(e)})
                print(f"  ERR row {idx + 2} ({row.get('__final_id')}): {e}")

        if dry_run:
            print("\n[DRY RUN] Rolling back transaction.")
            transaction.savepoint_rollback(sid)
            raise transaction.TransactionManagementError("dry-run rollback (intentional)")

    try:
        _run()
    except transaction.TransactionManagementError:
        if not dry_run:
            raise

    stats["regions_created"] = Regions.objects.count() - pre_regions
    stats["options_created"] = Options.objects.count() - pre_options

    return stats


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--dry-run", action="store_true")
    args = p.parse_args()

    s = import_data(dry_run=args.dry_run)
    print("\n" + "=" * 50)
    print(f"{'DRY RUN' if args.dry_run else 'IMPORT'} SUMMARY")
    print("=" * 50)
    for k, v in s.items():
        if k == "error_rows":
            continue
        print(f"  {k}: {v}")
    if s["error_rows"]:
        print(f"\n  First 5 errors:")
        for e in s["error_rows"][:5]:
            print(f"    row {e['row']} ({e['id']}): {e['error']}")
