"""
Simple test for document processing API endpoint
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.parsers import MultiPartParser, FormParser

class DocumentProcessingTestAPIView(APIView):
    """Simple test endpoint for document processing"""
    permission_classes = [AllowAny]
    parser_classes = [MultiPartParser, FormParser]
    
    def post(self, request):
        # Get documents from request
        documents = request.FILES.getlist('documents')
        if not documents:
            return Response({
                'success': False,
                'message': 'No documents provided'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Get student context from request
        student_context = {
            'applicant_name': request.data.get('applicant_name', ''),
            'email': request.data.get('email', ''),
            'phone_number': request.data.get('phone_number', ''),
            'date_of_birth': request.data.get('date_of_birth', ''),
            'course_applied': request.data.get('course_applied', ''),
        }
        
        try:
            # Mock response for testing
            mock_autofill_data = {
                'previous_school': 'Test High School',
                'last_percentage': '85',
                'father_name': 'Test Father',
                'father_phone': '+91-9876543210',
                'father_occupation': 'Engineer',
                'mother_name': 'Test Mother',
                'mother_phone': '+91-9876543211',
                'mother_occupation': 'Teacher',
                'address': '123 Test Street, Test City'
            }
            
            return Response({
                'success': True,
                'message': 'Documents processed successfully (test mode)',
                'extracted_text': f'Test extracted text from {len(documents)} documents for {student_context["applicant_name"]}',
                'autofill_data': mock_autofill_data
            })
            
        except Exception as e:
            return Response({
                'success': False,
                'message': f'Document processing failed: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)