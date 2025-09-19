#!/usr/bin/env python3
"""
Test the document processing with real AI
"""
import os
import sys
import django
from django.core.files.uploadedfile import SimpleUploadedFile
from io import BytesIO

# Setup Django
sys.path.append('.')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

def test_document_processing_simple():
    """Test document processing with sample text"""
    print("🔧 Testing Real Document Processing...")
    
    from admissions.document_processor import document_processor
    
    # Create sample text that mimics extracted document content
    sample_text = """
    BIRTH CERTIFICATE
    Name: Rahul Kumar Sharma
    Date of Birth: 15-06-2005
    Father's Name: Suresh Kumar Sharma
    Father's Occupation: Software Engineer
    Mother's Name: Priya Sharma
    Mother's Occupation: Teacher
    Address: 123 MG Road, Delhi 110001
    
    SCHOOL TRANSFER CERTIFICATE
    Previous School: Delhi Public School
    Last Class: 10th Grade
    Percentage: 87%
    Phone: +91-9876543210
    """
    
    # Test student context
    student_context = {
        'applicant_name': 'Rahul Kumar Sharma',
        'email': 'rahul@example.com',
        'phone_number': '+91-9876543210',
        'date_of_birth': '2005-06-15',
        'course_applied': 'Class 11 Science'
    }
    
    print("📄 Testing AI extraction...")
    try:
        autofill_data = document_processor.generate_autofill_data(sample_text, student_context)
        print(f"✅ AI extraction successful!")
        print("📋 Extracted data:")
        for key, value in autofill_data.items():
            if value:
                print(f"  - {key}: {value}")
        
        if not autofill_data:
            print("⚠️  No data extracted - check API key and connectivity")
            
    except Exception as e:
        print(f"❌ AI extraction failed: {e}")
    
    print("✅ Test completed!")

if __name__ == "__main__":
    test_document_processing_simple()