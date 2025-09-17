"""
Email service for admission-related communications
"""
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings
from django.utils.html import strip_tags
import logging

logger = logging.getLogger(__name__)

def send_otp_email(email, otp, applicant_name=None):
    """
    Send OTP verification email to the applicant
    """
    try:
        subject = "Verify Your Email - Acharya School Admission"
        
        # HTML email content
        html_message = f"""
        <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center;">
                <h2 style="color: #2563eb; margin-bottom: 20px;">Email Verification Required</h2>
                <p style="color: #374151; font-size: 16px; margin-bottom: 20px;">
                    {'Hello ' + applicant_name + ',' if applicant_name else 'Hello,'}
                </p>
                <p style="color: #374151; font-size: 16px; margin-bottom: 20px;">
                    Thank you for starting your admission application with Acharya Schools. 
                    To continue, please verify your email address using the OTP below:
                </p>
                <div style="background-color: #white; padding: 20px; border: 2px solid #2563eb; border-radius: 8px; margin: 20px 0;">
                    <h3 style="color: #2563eb; font-size: 32px; letter-spacing: 4px; margin: 0;">
                        {otp}
                    </h3>
                </div>
                <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
                    This OTP will expire in 10 minutes. If you didn't request this verification, 
                    please ignore this email.
                </p>
                <p style="color: #6b7280; font-size: 14px; margin-top: 10px;">
                    <strong>Note:</strong> Do not share this OTP with anyone.
                </p>
            </div>
        </body>
        </html>
        """
        
        # Plain text version
        plain_message = f"""
        Email Verification Required
        
        {'Hello ' + applicant_name + ',' if applicant_name else 'Hello,'}
        
        Thank you for starting your admission application with Acharya Schools. 
        To continue, please verify your email address using the OTP below:
        
        Your OTP: {otp}
        
        This OTP will expire in 10 minutes. If you didn't request this verification, 
        please ignore this email.
        
        Note: Do not share this OTP with anyone.
        """
        
        send_mail(
            subject=subject,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            html_message=html_message,
            fail_silently=False,
        )
        
        logger.info(f"OTP email sent successfully to {email}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send OTP email to {email}: {str(e)}")
        return False

def send_admission_confirmation_email(application):
    """
    Send confirmation email with reference ID and tracking link after successful submission
    """
    try:
        subject = f"Application Submitted Successfully - Reference #{application.reference_id}"
        
        # Get school preferences as a formatted string
        preferences = application.get_school_preferences()
        school_list = "<br>".join([f"{order} Choice: {school.school_name}" for order, school in preferences])
        
        # HTML email content
        html_message = f"""
        <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; border-left: 4px solid #2563eb;">
                <h2 style="color: #1e40af; margin-bottom: 20px;">Application Submitted Successfully! ✅</h2>
                
                <p style="color: #374151; font-size: 16px; margin-bottom: 15px;">
                    Dear {application.applicant_name},
                </p>
                
                <p style="color: #374151; font-size: 16px; margin-bottom: 20px;">
                    Thank you for submitting your admission application. Your application has been received and is under review.
                </p>
                
                <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e5e7eb;">
                    <h3 style="color: #2563eb; margin-bottom: 15px;">Application Details:</h3>
                    <p><strong>Reference ID:</strong> <span style="color: #2563eb; font-family: monospace; font-size: 18px;">{application.reference_id}</span></p>
                    <p><strong>Course Applied:</strong> {application.course_applied}</p>
                    <p><strong>School Preferences:</strong><br>{school_list}</p>
                    <p><strong>Application Date:</strong> {application.application_date.strftime('%B %d, %Y at %I:%M %p')}</p>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{settings.FRONTEND_URL}/track?ref={application.reference_id}" 
                       style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                        Track Your Application
                    </a>
                </div>
                
                <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
                    <strong>Important:</strong> Please save this reference ID for future tracking. 
                    You can check your application status anytime using the tracking link above.
                </p>
                
                <p style="color: #6b7280; font-size: 14px;">
                    We will notify you via email once your application is reviewed. 
                    If you have any questions, please contact our admissions office.
                </p>
            </div>
        </body>
        </html>
        """
        
        # Plain text version
        plain_message = f"""
        Application Submitted Successfully!
        
        Dear {application.applicant_name},
        
        Thank you for submitting your admission application. Your application has been received and is under review.
        
        Application Details:
        - Reference ID: {application.reference_id}
        - Course Applied: {application.course_applied}
        - Application Date: {application.application_date.strftime('%B %d, %Y at %I:%M %p')}
        
        School Preferences:
        {chr(10).join([f"{order} Choice: {school.school_name}" for order, school in preferences])}
        
        Track your application at: {settings.FRONTEND_URL}/track?ref={application.reference_id}
        
        Important: Please save this reference ID for future tracking. 
        You can check your application status anytime using the tracking link.
        
        We will notify you via email once your application is reviewed. 
        If you have any questions, please contact our admissions office.
        """
        
        send_mail(
            subject=subject,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[application.email],
            html_message=html_message,
            fail_silently=False,
        )
        
        logger.info(f"Confirmation email sent successfully to {application.email} for application {application.reference_id}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send confirmation email to {application.email}: {str(e)}")
        return False


def send_payment_receipt_email(decision):
    """
    Send payment receipt email when enrollment is finalized with payment
    """
    try:
        application = decision.application
        school = decision.school
        
        subject = f"Payment Receipt - Enrollment Confirmed at {school.school_name}"
        
        # Calculate fee details (you might need to adjust this based on your fee structure)
        from .models import AdmissionFeeStructure
        try:
            fee_structure = AdmissionFeeStructure.get_fee_for_student(
                application.course_applied, 
                application.category
            )
            total_amount = fee_structure.total_fee if fee_structure else 'N/A'
        except:
            total_amount = 'N/A'
        
        # HTML email content
        html_message = f"""
        <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; border-left: 4px solid #10b981;">
                <h2 style="color: #059669; margin-bottom: 20px;">Payment Received - Enrollment Confirmed!</h2>
                
                <p style="color: #374151; font-size: 16px; margin-bottom: 15px;">
                    Dear {application.applicant_name},
                </p>
                
                <p style="color: #374151; font-size: 16px; margin-bottom: 20px;">
                    Congratulations! Your admission payment has been successfully processed and your enrollment at 
                    <strong>{school.school_name}</strong> is now confirmed.
                </p>
                
                <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e5e7eb;">
                    <h3 style="color: #059669; margin-bottom: 15px;">Payment Receipt</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Reference ID:</strong></td>
                            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-family: monospace;">{application.reference_id}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Student Name:</strong></td>
                            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">{application.applicant_name}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>School:</strong></td>
                            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">{school.school_name}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Course:</strong></td>
                            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">{application.course_applied}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Category:</strong></td>
                            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">{application.category}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Payment Status:</strong></td>
                            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><span style="color: #059669; font-weight: bold;">PAID</span></td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Payment Date:</strong></td>
                            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">{decision.enrollment_date.strftime('%B %d, %Y at %I:%M %p') if decision.enrollment_date else 'N/A'}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px;"><strong>Amount Paid:</strong></td>
                            <td style="padding: 8px; color: #059669; font-weight: bold; font-size: 18px;">Rs. {total_amount}</td>
                        </tr>
                    </table>
                </div>
                
                <div style="background-color: #fef3c7; padding: 15px; border-radius: 6px; border-left: 4px solid #f59e0b; margin: 20px 0;">
                    <h4 style="color: #d97706; margin: 0 0 10px 0;">Next Steps:</h4>
                    <ul style="color: #92400e; margin: 0; padding-left: 20px;">
                        <li>Your student user account will be created within 24 hours</li>
                        <li>You will receive login credentials via email</li>
                        <li>Report to the school on the orientation date</li>
                        <li>Keep this receipt for your records</li>
                    </ul>
                </div>
                
                <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
                    <strong>Important:</strong> This email serves as your official payment receipt. 
                    Please save it for your records and present it during school orientation.
                </p>
                
                <p style="color: #6b7280; font-size: 14px;">
                    Welcome to {school.school_name}! We look forward to having you as part of our academic community.
                </p>
                
                <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                    <p style="color: #6b7280; font-size: 12px;">
                        This is an automated email from Acharya School Management System<br>
                        For any queries, please contact the school administration
                    </p>
                </div>
            </div>
        </body>
        </html>
        """
        
        # Plain text version
        plain_message = f"""
        Payment Received - Enrollment Confirmed!
        
        Dear {application.applicant_name},
        
        Congratulations! Your admission payment has been successfully processed and your enrollment at {school.school_name} is now confirmed.
        
        PAYMENT RECEIPT
        ===============
        Reference ID: {application.reference_id}
        Student Name: {application.applicant_name}
        School: {school.school_name}
        Course: {application.course_applied}
        Category: {application.category}
        Payment Status: PAID
        Payment Date: {decision.enrollment_date.strftime('%B %d, %Y at %I:%M %p') if decision.enrollment_date else 'N/A'}
        Amount Paid: Rs. {total_amount}
        
        NEXT STEPS:
        - Your student user account will be created within 24 hours
        - You will receive login credentials via email
        - Report to the school on the orientation date
        - Keep this receipt for your records
        
        Important: This email serves as your official payment receipt. 
        Please save it for your records and present it during school orientation.
        
        Welcome to {school.school_name}! We look forward to having you as part of our academic community.
        
        ---
        This is an automated email from Acharya School Management System
        For any queries, please contact the school administration
        """
        
        send_mail(
            subject=subject,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[application.email],
            html_message=html_message,
            fail_silently=False,
        )
        
        logger.info(f"Payment receipt email sent successfully to {application.email} for decision {decision.id}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send payment receipt email to {decision.application.email}: {str(e)}")
        return False


def send_student_credentials_email(decision, credentials):
    """
    Send student login credentials email when user ID is allocated
    """
    try:
        application = decision.application
        school = decision.school
        
        subject = f"Student Portal Access - Login Credentials for {school.school_name}"
        
        # HTML email content
        html_message = f"""
        <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; border-left: 4px solid #2563eb;">
                <h2 style="color: #1e40af; margin-bottom: 20px;">Student Portal Access Created!</h2>
                
                <p style="color: #374151; font-size: 16px; margin-bottom: 15px;">
                    Dear {application.applicant_name},
                </p>
                
                <p style="color: #374151; font-size: 16px; margin-bottom: 20px;">
                    Great news! Your student portal account has been created successfully. 
                    You can now access the <strong>{school.school_name}</strong> student portal using the credentials below.
                </p>
                
                <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #2563eb;">
                    <h3 style="color: #2563eb; margin-bottom: 15px; text-align: center;">Your Login Credentials</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; background-color: #f8fafc;"><strong>Admission Number:</strong></td>
                            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-family: monospace; font-size: 16px; color: #2563eb; font-weight: bold;">{credentials['admission_number']}</td>
                        </tr>
                        <tr>
                            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; background-color: #f8fafc;"><strong>Username:</strong></td>
                            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-family: monospace; font-size: 14px; color: #2563eb; font-weight: bold; word-break: break-all;">{credentials['username']}</td>
                        </tr>
                        <tr>
                            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; background-color: #f8fafc;"><strong>Email:</strong></td>
                            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-family: monospace; font-size: 14px; color: #2563eb; font-weight: bold; word-break: break-all;">{credentials['email']}</td>
                        </tr>
                        <tr>
                            <td style="padding: 12px; background-color: #f8fafc;"><strong>Password:</strong></td>
                            <td style="padding: 12px; font-family: monospace; font-size: 16px; color: #dc2626; font-weight: bold; background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 4px;">{credentials['password']}</td>
                        </tr>
                    </table>
                </div>
                
                <div style="background-color: #fef2f2; padding: 15px; border-radius: 6px; border-left: 4px solid #dc2626; margin: 20px 0;">
                    <h4 style="color: #dc2626; margin: 0 0 10px 0;">Important Security Notice:</h4>
                    <ul style="color: #991b1b; margin: 0; padding-left: 20px;">
                        <li><strong>Change your password immediately</strong> after your first login</li>
                        <li>Do not share your credentials with anyone</li>
                        <li>Use a strong, unique password for security</li>
                        <li>Contact the school if you forget your new password</li>
                    </ul>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{settings.FRONTEND_URL}/student-login" 
                       style="background-color: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 16px;">
                        Access Student Portal
                    </a>
                </div>
                
                <div style="background-color: #ecfdf5; padding: 15px; border-radius: 6px; border-left: 4px solid #10b981; margin: 20px 0;">
                    <h4 style="color: #047857; margin: 0 0 10px 0;">What you can do in the Student Portal:</h4>
                    <ul style="color: #065f46; margin: 0; padding-left: 20px;">
                        <li>View your academic records and grades</li>
                        <li>Check class schedules and timetables</li>
                        <li>Access study materials and assignments</li>
                        <li>Track attendance and fees</li>
                        <li>Communicate with teachers and staff</li>
                        <li>Update your profile information</li>
                    </ul>
                </div>
                
                <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
                    <strong>Need Help?</strong> If you have any trouble logging in or using the portal, 
                    please contact the school's IT support or administration office.
                </p>
                
                <p style="color: #6b7280; font-size: 14px;">
                    Welcome to the digital learning experience at {school.school_name}!
                </p>
                
                <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                    <p style="color: #6b7280; font-size: 12px;">
                        This is an automated email from Acharya School Management System<br>
                        Please do not reply to this email. For support, contact your school directly.
                    </p>
                </div>
            </div>
        </body>
        </html>
        """
        
        # Plain text version
        plain_message = f"""
        Student Portal Access Created!
        
        Dear {application.applicant_name},
        
        Great news! Your student portal account has been created successfully. 
        You can now access the {school.school_name} student portal using the credentials below.
        
        YOUR LOGIN CREDENTIALS
        =====================
        Admission Number: {credentials['admission_number']}
        Username: {credentials['username']}
        Email: {credentials['email']}
        Password: {credentials['password']}
        
        IMPORTANT SECURITY NOTICE:
        - Change your password immediately after your first login
        - Do not share your credentials with anyone
        - Use a strong, unique password for security
        - Contact the school if you forget your new password
        
        Access Student Portal: {settings.FRONTEND_URL}/student-login
        
        WHAT YOU CAN DO IN THE STUDENT PORTAL:
        - View your academic records and grades
        - Check class schedules and timetables
        - Access study materials and assignments
        - Track attendance and fees
        - Communicate with teachers and staff
        - Update your profile information
        
        Need Help? If you have any trouble logging in or using the portal, 
        please contact the school's IT support or administration office.
        
        Welcome to the digital learning experience at {school.school_name}!
        
        ---
        This is an automated email from Acharya School Management System
        Please do not reply to this email. For support, contact your school directly.
        """
        
        send_mail(
            subject=subject,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[application.email],
            html_message=html_message,
            fail_silently=False,
        )
        
        logger.info(f"Student credentials email sent successfully to {application.email} for decision {decision.id}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send student credentials email to {decision.application.email}: {str(e)}")
        return False


def send_parent_otp_email(parent_email, otp, parent_name, student_name):
    """
    Send OTP email to parent for authentication
    """
    try:
        subject = f"Login OTP for {student_name} - Acharya Portal Access"
        
        # HTML email content
        html_message = f"""
        <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6;">
                <h2 style="color: #1d4ed8; margin-bottom: 20px;">Parent Portal Access - Login OTP</h2>
                
                <p style="color: #374151; font-size: 16px; margin-bottom: 15px;">
                    Dear {parent_name},
                </p>
                
                <p style="color: #374151; font-size: 16px; margin-bottom: 20px;">
                    You have requested access to view {student_name}'s information on the Acharya School Portal.
                    Please use the following One-Time Password (OTP) to complete your login.
                </p>
                
                <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #3b82f6; text-align: center;">
                    <h3 style="color: #3b82f6; margin-bottom: 15px;">Your Login OTP</h3>
                    <div style="font-size: 32px; font-weight: bold; color: #1d4ed8; letter-spacing: 4px; padding: 15px; background-color: #eff6ff; border-radius: 8px; font-family: monospace;">
                        {otp}
                    </div>
                    <p style="color: #6b7280; font-size: 14px; margin-top: 15px;">
                        This OTP is valid for 10 minutes only
                    </p>
                </div>
                
                <div style="background-color: #fef3c7; padding: 15px; border-radius: 6px; border-left: 4px solid #f59e0b; margin: 20px 0;">
                    <h4 style="color: #d97706; margin: 0 0 10px 0;">Important Security Information:</h4>
                    <ul style="color: #92400e; margin: 0; padding-left: 20px;">
                        <li>This OTP is valid for <strong>10 minutes only</strong></li>
                        <li>Do not share this OTP with anyone</li>
                        <li>If you did not request this OTP, please ignore this email</li>
                        <li>For security, we will never ask for your OTP via phone or SMS</li>
                    </ul>
                </div>
                
                <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
                    Once you log in, you will be able to view your child's academic progress, attendance, 
                    assignments, and communicate with teachers.
                </p>
                
                <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                    <p style="color: #6b7280; font-size: 12px;">
                        This is an automated email from Acharya School Management System<br>
                        If you have any questions, please contact your school administration
                    </p>
                </div>
            </div>
        </body>
        </html>
        """
        
        # Plain text version
        plain_message = f"""
        Parent Portal Access - Login OTP
        
        Dear {parent_name},
        
        You have requested access to view {student_name}'s information on the Acharya School Portal.
        Please use the following One-Time Password (OTP) to complete your login.
        
        YOUR LOGIN OTP: {otp}
        
        IMPORTANT SECURITY INFORMATION:
        - This OTP is valid for 10 minutes only
        - Do not share this OTP with anyone
        - If you did not request this OTP, please ignore this email
        - For security, we will never ask for your OTP via phone or SMS
        
        Once you log in, you will be able to view your child's academic progress, attendance, 
        assignments, and communicate with teachers.
        
        ---
        This is an automated email from Acharya School Management System
        If you have any questions, please contact your school administration
        """
        
        send_mail(
            subject=subject,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[parent_email],
            html_message=html_message,
            fail_silently=False,
        )
        
        logger.info(f"Parent OTP email sent successfully to {parent_email}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send parent OTP email to {parent_email}: {str(e)}")
        return False