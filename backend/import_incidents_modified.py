import os
import sys
import django
import pandas as pd
from datetime import datetime
from django.utils import timezone
from django.core.exceptions import MultipleObjectsReturned

# Add the project root directory to the Python path
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(project_root)

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth.models import User
from apps.web.models import Incidents, Casualities, Regions, Options

def parse_timestamp(timestamp_str):
    """
    Parse timestamp string in either 'YYYY-MM-DD HH:MM:SS[.NNNNNN]' or 'DD/MM/YYYY HH.MM.SS' format
    Returns a datetime object or None if parsing fails
    """
    if not timestamp_str or pd.isna(timestamp_str):
        return None
    
    timestamp_str = str(timestamp_str).strip()
    print(f"Attempting to parse timestamp: {timestamp_str}")
    
    # Try YYYY-MM-DD HH:MM:SS[.NNNNNN] format first
    try:
        return pd.to_datetime(timestamp_str)
    except (ValueError, TypeError) as e:
        print(f"Failed pandas to_datetime: {e}")
        pass
    
    # Try DD/MM/YYYY HH.MM.SS format
    try:
        return datetime.strptime(timestamp_str, '%d/%m/%Y %H.%M.%S')
    except (ValueError, TypeError) as e:
        print(f"Failed DD/MM/YYYY HH.MM.SS format: {e}")
        pass
    
    # Try DD/MM/YYYY HH:MM:SS format
    try:
        return datetime.strptime(timestamp_str, '%d/%m/%Y %H:%M:%S')
    except (ValueError, TypeError) as e:
        print(f"Failed DD/MM/YYYY HH:MM:SS format: {e}")
        pass
    
    print(f"Warning: Could not parse timestamp: {timestamp_str}")
    return None

def create_date_from_components(date_str):
    try:
        if pd.isna(date_str):
            return timezone.now().date()
        # Convert date string to datetime object
        return pd.to_datetime(date_str).date()
    except Exception as e:
        print(f"Error creating date from {date_str}: {str(e)}")
        return timezone.now().date()

def get_region(province_id):
    try:
        if pd.isna(province_id):
            return None
        return Regions.objects.filter(area_code=int(province_id)).first()
    except MultipleObjectsReturned:
        print(f"Warning: Multiple regions found for province_id {province_id}. Using the first one.")
        return Regions.objects.filter(area_code=int(province_id)).first()
    except Exception as e:
        print(f"Error getting region for province_id {province_id}: {str(e)}")
        return None

def clean_numeric_field(value):
    """Clean numeric fields by converting -99 to 0 and handling invalid values."""
    if pd.isna(value) or value == -99 or value == -99.0:
        return 0
    try:
        float_value = float(value)
        return int(float_value) if float_value >= 0 else 0
    except (ValueError, TypeError):
        return 0

def import_incidents_data():
    """Import incidents data from Excel file."""
    print("Starting import process...")
    
    try:
        # Read the Excel file
        print("Reading Excel file...")
        df = pd.read_excel('data/2023.xlsx')
        
        # Print information about the dataframe
        print("\nDataframe Info:")
        print(df.info())
        
        print("\nFirst 5 rows of data:")
        pd.set_option('display.max_columns', None)  # Show all columns
        pd.set_option('display.width', None)  # Don't wrap
        print(df.head())
        
        print("\nColumns in the dataframe:")
        print(df.columns.tolist())
        
        total_rows = len(df)
        created_count = 0
        updated_count = 0
        error_count = 0
        
        # Get or create default user for assignment
        default_user = User.objects.first()
        if not default_user:
            default_user = User.objects.create_user(username='default_user', 
                                                  email='default@example.com',
                                                  password='defaultpassword')
        
        for index, row in df.iterrows():
            try:
                # Create date from day, month, year columns
                incident_date = pd.Timestamp(year=int(row['year']), 
                                          month=int(row['month']), 
                                          day=int(row['day'])).date()
                
                # Clean numeric fields
                num_killed = clean_numeric_field(row.get('num_death'))
                num_injured = clean_numeric_field(row.get('num_injured'))
                infra_damage = clean_numeric_field(row.get('infra_damage'))
                infra_destroyed = clean_numeric_field(row.get('infra_destroyed'))
                
                # Get the region based on province_id
                region = get_region(row.get('province_id'))
                if not region:
                    print(f"Warning: Invalid province_id in row {index + 2}")
                    continue
                
                # Get or create the incident
                incident, created = Incidents.objects.update_or_create(
                    incident_id=row.get('incident_id'),
                    defaults={
                        'incident_date': incident_date,
                        'location': region,
                        'coder': default_user,
                        'verificator': default_user,
                        'publish': incident_date.year == 2023  # Set publish=True for 2023 incidents
                    }
                )
                
                # Create or update associated casualties
                if num_killed is not None or num_injured is not None:
                    # Calculate totals from individual fields
                    female_death = clean_numeric_field(row.get('fem_death'))
                    female_injured = clean_numeric_field(row.get('fem_injured'))
                    child_death = clean_numeric_field(row.get('child_death'))
                    child_injured = clean_numeric_field(row.get('child_injured'))
                    
                    Casualities.objects.update_or_create(
                        incident=incident,
                        defaults={
                            'num_death': num_killed if num_killed is not None else 0,
                            'num_injured': num_injured if num_injured is not None else 0,
                            'death_injured': clean_numeric_field(row.get('death_injured')),
                            'female_death': female_death,
                            'female_injured': female_injured,
                            'female_total': female_death + female_injured,  # Calculate total from individual fields
                            'child_death': child_death,
                            'child_injured': child_injured,
                            'child_total': child_death + child_injured,  # Calculate total from individual fields
                            'infra_damage': clean_numeric_field(row.get('infra_damage')),
                            'infra_destroyed': clean_numeric_field(row.get('infra_destroyed'))
                        }
                    )
                
                if created:
                    created_count += 1
                else:
                    updated_count += 1
                    
            except Exception as e:
                print(f"Error processing row {index + 2}: {str(e)}")
                error_count += 1
                continue
        
        print(f"\nImport completed:")
        print(f"Total rows processed: {total_rows}")
        print(f"Incidents created: {created_count}")
        print(f"Incidents updated: {updated_count}")
        print(f"Errors encountered: {error_count}")
        
    except Exception as e:
        print(f"Error reading Excel file: {str(e)}")

if __name__ == '__main__':
    import_incidents_data()