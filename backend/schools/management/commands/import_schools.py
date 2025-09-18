import csv
import os
from django.core.management.base import BaseCommand, CommandError
from schools.models import School


class Command(BaseCommand):
    help = 'Import schools from CSV file'

    def add_arguments(self, parser):
        parser.add_argument(
            'csv_file',
            type=str,
            help='Path to CSV file containing school data'
        )
        parser.add_argument(
            '--activate',
            action='store_true',
            help='Activate schools after import (creates admin accounts)'
        )
        parser.add_argument(
            '--update',
            action='store_true',
            help='Update existing schools if they already exist'
        )

    def handle(self, *args, **options):
        csv_file = options['csv_file']
        
        if not os.path.exists(csv_file):
            raise CommandError(f'CSV file "{csv_file}" does not exist.')
        
        created_count = 0
        updated_count = 0
        error_count = 0
        
        try:
            with open(csv_file, 'r', encoding='utf-8') as file:
                # Detect if file has headers
                sample = file.read(1024)
                file.seek(0)
                has_header = csv.Sniffer().has_header(sample)
                
                reader = csv.reader(file)
                
                # Skip header if present
                if has_header:
                    next(reader)
                
                for row_num, row in enumerate(reader, start=1):
                    try:
                        # Expected format: District, Block, Village, School_Name, School_Code
                        if len(row) < 5:
                            self.stdout.write(
                                self.style.WARNING(
                                    f'Row {row_num}: Insufficient columns. Expected 5, got {len(row)}'
                                )
                            )
                            error_count += 1
                            continue
                        
                        district = row[0].strip()
                        block = row[1].strip()
                        village = row[2].strip()
                        school_name = row[3].strip()
                        school_code = row[4].strip()
                        
                        # Validate required fields
                        if not all([district, block, village, school_name, school_code]):
                            self.stdout.write(
                                self.style.WARNING(
                                    f'Row {row_num}: Missing required fields'
                                )
                            )
                            error_count += 1
                            continue
                        
                        # Check if school already exists
                        school, created = School.objects.get_or_create(
                            school_code=school_code,
                            defaults={
                                'district': district,
                                'block': block,
                                'village': village,
                                'school_name': school_name,
                                'is_active': options['activate']
                            }
                        )
                        
                        if created:
                            created_count += 1
                            self.stdout.write(
                                self.style.SUCCESS(
                                    f'Created school: {school_name} ({school_code})'
                                )
                            )
                        elif options['update']:
                            # Update existing school
                            school.district = district
                            school.block = block
                            school.village = village
                            school.school_name = school_name
                            if options['activate']:
                                school.is_active = True
                            school.save()
                            updated_count += 1
                            self.stdout.write(
                                self.style.SUCCESS(
                                    f'Updated school: {school_name} ({school_code})'
                                )
                            )
                        else:
                            self.stdout.write(
                                self.style.WARNING(
                                    f'School already exists: {school_name} ({school_code}). Use --update to modify.'
                                )
                            )
                    
                    except Exception as e:
                        error_count += 1
                        self.stdout.write(
                            self.style.ERROR(
                                f'Row {row_num}: Error processing - {str(e)}'
                            )
                        )
                        continue
        
        except Exception as e:
            raise CommandError(f'Error reading CSV file: {str(e)}')
        
        # Summary
        self.stdout.write(
            self.style.SUCCESS(
                f'\nImport completed:'
                f'\n- Created: {created_count} schools'
                f'\n- Updated: {updated_count} schools'
                f'\n- Errors: {error_count} rows'
            )
        )
        
        if options['activate'] and created_count > 0:
            self.stdout.write(
                self.style.SUCCESS(
                    f'\nAdmin accounts created for {created_count} new schools.'
                    f'\nCheck the admin panel for login credentials.'
                )
            )