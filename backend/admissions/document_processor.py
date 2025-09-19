"""
Document text extraction and AI auto-fill service for admission forms
"""
import os
import io
from typing import Dict, List, Any, Optional
from PIL import Image
import pytesseract
import PyPDF2
from docx import Document
import google.generativeai as genai
from django.conf import settings
from django.core.files.uploadedfile import UploadedFile
import logging

logger = logging.getLogger(__name__)

class DocumentProcessor:
    """Service to extract text from documents and auto-fill forms using AI"""
    
    def __init__(self):
        # Configure Gemini API
        api_key = getattr(settings, 'GEMINI_API_KEY', None)
        if api_key:
            genai.configure(api_key=api_key)
            self.model = genai.GenerativeModel('gemini-2.0-flash-exp')  # Updated to use the correct model
        else:
            logger.warning("GEMINI_API_KEY not found in settings")
            self.model = None
    
    def extract_text_from_file(self, file: UploadedFile) -> str:
        """Extract text from uploaded file based on file type"""
        file_extension = os.path.splitext(file.name)[1].lower()
        
        try:
            if file_extension in ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff']:
                return self._extract_from_image(file)
            elif file_extension == '.pdf':
                return self._extract_from_pdf(file)
            elif file_extension in ['.doc', '.docx']:
                return self._extract_from_docx(file)
            elif file_extension == '.txt':
                return self._extract_from_text(file)
            else:
                logger.warning(f"Unsupported file type: {file_extension}")
                return ""
        except Exception as e:
            logger.error(f"Error extracting text from {file.name}: {str(e)}")
            return ""
    
    def _extract_from_image(self, file: UploadedFile) -> str:
        """Extract text from image using OCR"""
        try:
            image = Image.open(file)
            text = pytesseract.image_to_string(image)
            return text.strip()
        except Exception as e:
            logger.error(f"OCR extraction failed: {str(e)}")
            return ""
    
    def _extract_from_pdf(self, file: UploadedFile) -> str:
        """Extract text from PDF file"""
        try:
            text = ""
            pdf_reader = PyPDF2.PdfReader(file)
            for page in pdf_reader.pages:
                text += page.extract_text() + "\n"
            return text.strip()
        except Exception as e:
            logger.error(f"PDF extraction failed: {str(e)}")
            return ""
    
    def _extract_from_docx(self, file: UploadedFile) -> str:
        """Extract text from DOCX file"""
        try:
            doc = Document(file)
            text = ""
            for paragraph in doc.paragraphs:
                text += paragraph.text + "\n"
            return text.strip()
        except Exception as e:
            logger.error(f"DOCX extraction failed: {str(e)}")
            return ""
    
    def _extract_from_text(self, file: UploadedFile) -> str:
        """Extract text from plain text file"""
        try:
            return file.read().decode('utf-8').strip()
        except Exception as e:
            logger.error(f"Text extraction failed: {str(e)}")
            return ""
    
    def extract_from_documents(self, documents: List[UploadedFile]) -> str:
        """Extract text from multiple documents and combine"""
        all_text = []
        
        for doc in documents:
            text = self.extract_text_from_file(doc)
            if text:
                all_text.append(f"=== Document: {doc.name} ===\n{text}\n")
        
        return "\n".join(all_text)
    
    def generate_autofill_data(self, extracted_text: str, student_context: Dict[str, Any]) -> Dict[str, Any]:
        """Use AI to generate auto-fill data from extracted text and student context"""
        if not self.model:
            logger.error("Gemini model not configured")
            return {}
        
        try:
            # Create prompt for AI
            prompt = self._create_autofill_prompt(extracted_text, student_context)
            
            # Generate response
            response = self.model.generate_content(prompt)
            
            # Parse response
            return self._parse_ai_response(response.text)
        
        except Exception as e:
            logger.error(f"AI auto-fill generation failed: {str(e)}")
            return {}
    
    def _create_autofill_prompt(self, extracted_text: str, student_context: Dict[str, Any]) -> str:
        """Create prompt for AI to extract relevant information"""
        
        prompt = f"""You are an intelligent document information extractor.

You receive scanned or PDF documents such as birth certificates, school transfer certificates, Aadhaar-like address proofs, report cards, photographs, and caste certificates. 
Your task is to accurately extract structured information even if the documents contain:
- colored banners or logos
- QR codes or stamps/seals
- watermarks, official seals, or background graphics
- layout variations in fonts, tables, or text alignment
- noisy OCR text or extra decorative text

Student Context (already known):
- Name: {student_context.get('applicant_name', 'Unknown')}
- Email: {student_context.get('email', 'Unknown')}
- Phone: {student_context.get('phone_number', 'Unknown')}
- Date of Birth: {student_context.get('date_of_birth', 'Unknown')}
- Course Applied: {student_context.get('course_applied', 'Unknown')}

Document Text to Extract From:
{extracted_text}

Extract information and map it to this admission form JSON structure:

{{
  "previous_school": "",
  "last_percentage": "",
  "father_name": "",
  "father_phone": "",
  "father_email": "",
  "father_occupation": "",
  "father_address": "",
  "father_aadhar": "",
  "father_qualification": "",
  "father_company": "",
  "father_annual_income": "",
  "mother_name": "",
  "mother_phone": "",
  "mother_email": "",
  "mother_occupation": "",
  "mother_address": "",
  "mother_aadhar": "",
  "mother_qualification": "",
  "mother_company": "",
  "mother_annual_income": "",
  "guardian_name": "",
  "guardian_phone": "",
  "guardian_email": "",
  "guardian_relationship": "",
  "guardian_address": "",
  "guardian_occupation": "",
  "address": "",
  "emergency_contact_name": "",
  "emergency_contact_phone": "",
  "emergency_contact_relationship": ""
}}

### Rules:
1. If a field is missing, leave it as an empty string "".
2. Extract names exactly as written, without abbreviating.
3. Extract Aadhaar numbers, phone numbers, and emails as plain text (no formatting).
4. For income, use numbers only (no currency symbols).
5. For percentage, use numbers only (no % symbol).
6. Ignore decorative or irrelevant text.
7. Map document information to the closest matching form field.

Your output must ONLY be the structured JSON, nothing else."""
        
        return prompt
    
    def _parse_ai_response(self, response_text: str) -> Dict[str, Any]:
        """Parse AI response and return structured data"""
        try:
            import json
            # Clean the response text
            cleaned_text = response_text.strip()
            
            # Try to find JSON in the response
            start_idx = cleaned_text.find('{')
            end_idx = cleaned_text.rfind('}') + 1
            
            if start_idx >= 0 and end_idx > start_idx:
                json_text = cleaned_text[start_idx:end_idx]
                return json.loads(json_text)
            
            logger.error("No valid JSON found in AI response")
            return {}
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse AI response as JSON: {str(e)}")
            logger.error(f"Response text: {response_text}")
            return {}
        except Exception as e:
            logger.error(f"Unexpected error parsing AI response: {str(e)}")
            return {}

# Global instance
document_processor = DocumentProcessor()