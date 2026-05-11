import os
import sys
import django
import pandas as pd
from datetime import datetime
from django.utils import timezone
from django.db import transaction
from django.core.exceptions import ValidationError

# Add the project root directory to the Python path
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(project_root)

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth.models import User
from apps.web.models import Incidents, Casualities, Regions

def parse_timestamp(timestamp_str):
    try:
        if pd.isna(timestamp_str):
            return timezone.now()
        # Already a pandas timestamp
        if isinstance(timestamp_str, pd.Timestamp):
            return timestamp_str.to_pydatetime()
        # Parse the custom format DD/MM/YYYY HH.MM.SS
        return datetime.strptime(str(timestamp_str), '%d/%m/%Y %H.%M.%S')
    except Exception as e:
        print(f"Error parsing timestamp {timestamp_str}: {str(e)}")
        return timezone.now()

def is_valid_row(row):
    """Check if row has all required fields and is not empty"""
    if pd.isna(row.get('incident_id')) or str(row.get('incident_id')).strip() == '':
        return False
    if pd.isna(row.get('date')):
        return False
    return True

def validate_row(row, i):
    errors = []
    
    # Skip validation for empty rows
    if not is_valid_row(row):
        return []
    
    try:
        if not pd.isna(row.get('province_id')):
            province_id = int(row['province_id'])
            if not Regions.objects.filter(area_code=province_id).exists():
                errors.append(f"Province ID {province_id} does not exist in database")
    except (ValueError, TypeError):
        errors.append(f"Invalid province_id format: {row.get('province_id')}")
    
    return errors

def clean_numeric(value, default=0):
    """Clean numeric values, replacing negative values with default"""
    if pd.isna(value):
        return default
    try:
        val = int(value)
        return val if val >= 0 else default
    except (ValueError, TypeError):
        return default

def verify_import(incident_id):
    try:
        incident = Incidents.objects.get(incident_id=incident_id)
        casualties = Casualities.objects.get(incident=incident)
        return True
    except (Incidents.DoesNotExist, Casualities.DoesNotExist):
        return False

def get_region(area_code):
    """Get the first region matching the area code"""
    try:
        return Regions.objects.filter(area_code=area_code).first()
    except (ValueError, TypeError):
        return None

@transaction.atomic
def import_incidents_data(excel_path, dry_run=False):
    # Read Excel file
    df = pd.read_excel(excel_path)
    
    # Get or create admin user
    admin_user, _ = User.objects.get_or_create(
        username='admin.csis',
        defaults={
            'is_staff': True,
            'is_superuser': True,
            'email': 'admin@csis.org'
        }
    )

    stats = {
        'total': len(df),
        'valid_rows': 0,
        'created': 0,
        'updated': 0,
        'errors': 0,
        'error_rows': [],
        'validation_errors': [],
        'skipped_rows': 0
    }

    # First pass: count valid rows
    valid_rows = 0
    for i, row in df.iterrows():
        if is_valid_row(row):
            valid_rows += 1
    stats['valid_rows'] = valid_rows

    # Validate all rows first
    if dry_run:
        for i, row in df.iterrows():
            if not is_valid_row(row):
                stats['skipped_rows'] += 1
                continue
                
            errors = validate_row(row, i)
            if errors:
                stats['validation_errors'].append({
                    'row': i+2,
                    'error': '; '.join(errors)
                })
        return stats

    # Process each row within transaction
    for i, row in df.iterrows():
        try:
            # Skip empty or invalid rows
            if not is_valid_row(row):
                stats['skipped_rows'] += 1
                continue

            # Validate row
            errors = validate_row(row, i)
            if errors:
                raise ValidationError('; '.join(errors))

            # Convert timestamp using custom parser
            timestamp = parse_timestamp(row.get('Timestamp'))
            if timezone.is_naive(timestamp):
                timestamp = timezone.make_aware(timestamp)

            # Get location if province_id exists
            location = None
            if not pd.isna(row.get('province_id')):
                location = get_region(int(row['province_id']))

            # Clean and calculate totals
            female_death = clean_numeric(row.get('fem_death'))
            female_injured = clean_numeric(row.get('fem_injured'))
            female_total = female_death + female_injured
            
            child_death = clean_numeric(row.get('child_death'))
            child_injured = clean_numeric(row.get('child_injured'))
            child_total = child_death + child_injured

            # Create or update Incident
            incident, created = Incidents.objects.update_or_create(
                incident_id=str(row['incident_id']).strip(),
                defaults={
                    'incident_date': pd.to_datetime(row['date']).date(),
                    'location': location,
                    'coder': admin_user,
                    'verificator': admin_user,
                    'created_at': timestamp,
                    'updated_at': timestamp,
                    'publish': True,
                    'description': '',  # Empty as no description in Excel
                    'notes': str(row.get('pol_rel', '')).strip()  # Using pol_rel as notes
                }
            )

            # Create or update Casualties
            casualties, _ = Casualities.objects.update_or_create(
                incident=incident,
                defaults={
                    'num_death': clean_numeric(row.get('num_death')),
                    'num_injured': clean_numeric(row.get('num_injured')),
                    'death_injured': clean_numeric(row.get('death_injured')),
                    'female_death': female_death,
                    'female_injured': female_injured,
                    'female_total': female_total,
                    'child_death': child_death,
                    'child_injured': child_injured,
                    'child_total': child_total,
                    'infra_damage': clean_numeric(row.get('infra_damage')),
                    'infra_destroyed': clean_numeric(row.get('infra_destroyed')),
                    'created_at': timestamp,
                    'updated_at': timestamp
                }
            )

            # Verify the import
            if not verify_import(row['incident_id']):
                raise Exception(f"Failed to verify import for incident {row['incident_id']}")

            if created:
                stats['created'] += 1
            else:
                stats['updated'] += 1

            print(f"Processed incident {row['incident_id']}: {'Created' if created else 'Updated'}")

        except Exception as e:
            stats['errors'] += 1
            stats['error_rows'].append({'row': i+2, 'error': str(e)})
            print(f"Error processing row with incident_id {row.get('incident_id', 'unknown')}: {str(e)}")
            print("Row data:", row.to_dict())
            raise  # Re-raise to trigger transaction rollback

    return stats

if __name__ == "__main__":
    # Check command line arguments
    import argparse
    parser = argparse.ArgumentParser(description='Import incidents data from Excel file')
    parser.add_argument('--dry-run', action='store_true', help='Validate data without importing')
    parser.add_argument('--file', type=str, help='Path to Excel file', default='data/data cvew 2024.xlsx')
    args = parser.parse_args()
    
    # File path
    file_path = args.file if args.file else os.path.join('data', 'data cvew 2024.xlsx')
    
    if not os.path.exists(file_path):
        print(f"\nError: File not found: {file_path}")
        sys.exit(1)
        
    try:
        stats = import_incidents_data(file_path, dry_run=args.dry_run)
        
        print("\nProcess Summary:")
        print(f"Total rows: {stats['total']}")
        print(f"Valid rows: {stats['valid_rows']}")
        print(f"Skipped rows: {stats['skipped_rows']}")
        
        if args.dry_run:
            if stats['validation_errors']:
                print("\nValidation Errors:")
                for error in stats['validation_errors']:
                    print(f"Row {error['row']}: {error['error']}")
                print(f"\nTotal validation errors: {len(stats['validation_errors'])}")
                sys.exit(1)
            else:
                print("\nAll data is valid! You can now run the import without --dry-run")
        else:
            print(f"Created: {stats['created']}")
            print(f"Updated: {stats['updated']}")
            if stats['errors'] > 0:
                print(f"\nErrors encountered: {stats['errors']}")
                print("\nError details:")
                for error in stats['error_rows']:
                    print(f"Row {error['row']}: {error['error']}")
                sys.exit(1)
            else:
                print("\nImport completed successfully with no errors!")
                
    except Exception as e:
        print(f"\nFatal error occurred: {str(e)}")
        sys.exit(1)