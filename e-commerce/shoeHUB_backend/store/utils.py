from django.core.mail import send_mail
from django.conf import settings

def send_welcome_email(user_email, username):
    subject = 'Welcome to ShoeHUB!'
    message = f'''
    Dear {username},

    Thank you for registering with ShoeHUB! Your account has been successfully created.

    Best regards,
    The ShoeHUB Team
    '''
    
    send_mail(
        subject=subject,
        message=message,
        from_email=settings.EMAIL_HOST_USER,
        recipient_list=[user_email],
        fail_silently=False,
    )