#!/usr/bin/env python3
"""
Test script for document processing functionality
"""
import os
import sys
import django
from django.core.files.uploadedfile import SimpleUploadedFile
from io import BytesIO
from PIL import Image, ImageDraw, ImageFont

# Setup Django
sys.path.append('.')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from admissions.document_processor import document_processor

def create_test_image_with_text():
    """Create a test image with sample text for OCR"""
    img = Image.new('RGB', (800, 600), color='white')
    draw = ImageDraw.Draw(img)
    
    # Try to use a font, fallback to default if not available
    try:
        font = ImageFont.truetype("arial.ttf", 24)
    except:
        font = ImageFont.load_default()
    
    text_lines = [
        "STUDENT INFORMATION",
        "Previous School: ABC High School",
        "Last Percentage: 85%",
        "Father's Name: John Doe",
        "Father's Phone: +91-9876543210",
        "Father's Occupation: Engineer",
        "Mother's Name: Jane Doe", 
        "Mother's Phone: +91-9876543211",
        "Mother's Occupation: Teacher",
        "Address: 123 Main Street, Delhi 110001"
    ]
    
    y_position = 50
    for line in text_lines:
        draw.text((50, y_position), line, fill='black', font=font)
        y_position += 40
    
    # Convert to bytes
    img_bytes = BytesIO()
    img.save(img_bytes, format='PNG')
    img_bytes.seek(0)
    
    return img_bytes.getvalue()

def test_document_processing():
    """Test the document processing pipeline"""
    print("🔧 Testing Document Processing...")
    
    # Create test image
    image_data = create_test_image_with_text()
    
    # Create mock uploaded file
    test_file = SimpleUploadedFile(
        "test_document.png",
        image_data,
        content_type="image/png"
    )
    
    # Test text extraction
    print("📄 Testing text extraction...")
    extracted_text = document_processor.extract_text_from_file(test_file)
    print(f"✅ Extracted text preview: {extracted_text[:200]}...")
    
    # Test student context
    student_context = {
        'applicant_name': 'Test Student',
        'email': 'test@example.com',
        'phone_number': '+91-1234567890',
        'date_of_birth': '2005-06-15',
        'course_applied': 'Class 11 Science'
    }
    
    # Test AI auto-fill (will only work with valid API key)
    print("🤖 Testing AI auto-fill...")
    try:
        autofill_data = document_processor.generate_autofill_data(extracted_text, student_context)
        print(f"✅ Auto-fill successful: {len(autofill_data)} fields extracted")
        for key, value in autofill_data.items():
            if value:
                print(f"  - {key}: {value}")
    except Exception as e:
        print(f"⚠️  AI auto-fill failed (expected without API key): {e}")
    
    print("✅ Document processing test completed!")

if __name__ == "__main__":
    test_document_processing()