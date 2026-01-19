"""
Notification service for sending SMS and Email notifications
"""
from django.core.mail import send_mail
from django.conf import settings
from decouple import config
import logging

logger = logging.getLogger(__name__)


class NotificationService:
    """Service for sending notifications to tenants"""

    @staticmethod
    def send_sms(phone_number, message):
        """
        Send SMS using Twilio
        """
        try:
            # Only send if Twilio is configured
            account_sid = config('TWILIO_ACCOUNT_SID', default=None)
            auth_token = config('TWILIO_AUTH_TOKEN', default=None)
            from_phone = config('TWILIO_PHONE_NUMBER', default=None)

            if not all([account_sid, auth_token, from_phone]):
                logger.warning("Twilio not configured. SMS not sent.")
                return False

            from twilio.rest import Client
            client = Client(account_sid, auth_token)

            message = client.messages.create(
                body=message,
                from_=from_phone,
                to=phone_number
            )

            logger.info(
                f"SMS sent successfully to {phone_number}. SID: {message.sid}")
            return True

        except Exception as e:
            logger.error(f"Failed to send SMS to {phone_number}: {str(e)}")
            return False

    @staticmethod
    def send_email(recipient_email, subject, message, html_message=None):
        """
        Send email using Django's email backend
        """
        try:
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[recipient_email],
                html_message=html_message,
                fail_silently=False,
            )
            logger.info(f"Email sent successfully to {recipient_email}")
            return True

        except Exception as e:
            logger.error(
                f"Failed to send email to {recipient_email}: {str(e)}")
            return False

    @classmethod
    def notify_rent_charged(cls, tenant, amount, month):
        """
        Notify tenant when rent is charged
        """
        # SMS Notification
        sms_message = f"Dear {tenant.first_name}, your rent of KES {amount:,.2f} for {month} has been charged. Balance: KES {tenant.total_balance:,.2f}. Thank you!"

        if tenant.phone_number:
            cls.send_sms(tenant.phone_number, sms_message)

        # Email Notification
        if tenant.email:
            subject = f"Rent Charged for {month}"
            email_message = f"""
Dear {tenant.full_name},

This is to notify you that your rent has been charged:

Amount: KES {amount:,.2f}
Month: {month}
Unit: {tenant.unit.unit_number}
Building: {tenant.unit.building.name}

Current Balance: KES {tenant.total_balance:,.2f}

Please make payment at your earliest convenience.

Thank you for your cooperation.

Best regards,
Property Management Team
            """

            html_message = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: #2196F3; color: white; padding: 20px; text-align: center; }}
        .content {{ padding: 20px; background: #f9f9f9; }}
        .detail {{ background: white; padding: 15px; margin: 10px 0; border-left: 4px solid #2196F3; }}
        .footer {{ text-align: center; padding: 20px; color: #666; font-size: 12px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>Rent Charged Notice</h2>
        </div>
        <div class="content">
            <p>Dear <strong>{tenant.full_name}</strong>,</p>
            <p>This is to notify you that your rent has been charged:</p>
            <div class="detail">
                <p><strong>Amount:</strong> KES {amount:,.2f}</p>
                <p><strong>Month:</strong> {month}</p>
                <p><strong>Unit:</strong> {tenant.unit.unit_number}</p>
                <p><strong>Building:</strong> {tenant.unit.building.name}</p>
            </div>
            <div class="detail">
                <p><strong>Current Balance:</strong> KES {tenant.total_balance:,.2f}</p>
            </div>
            <p>Please make payment at your earliest convenience.</p>
            <p>Thank you for your cooperation.</p>
        </div>
        <div class="footer">
            <p>Property Management System</p>
        </div>
    </div>
</body>
</html>
            """

            cls.send_email(tenant.email, subject, email_message, html_message)

    @classmethod
    def notify_payment_received(cls, tenant, amount, payment_date):
        """
        Notify tenant when payment is received
        """
        # SMS Notification
        sms_message = f"Dear {tenant.first_name}, we have received your payment of KES {amount:,.2f}. New balance: KES {tenant.total_balance:,.2f}. Thank you!"

        if tenant.phone_number:
            cls.send_sms(tenant.phone_number, sms_message)

        # Email Notification
        if tenant.email:
            subject = "Payment Received - Thank You!"
            email_message = f"""
Dear {tenant.full_name},

We have successfully received your payment:

Amount: KES {amount:,.2f}
Date: {payment_date}
New Balance: KES {tenant.total_balance:,.2f}

Thank you for your prompt payment!

Best regards,
Property Management Team
            """

            html_message = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: #4CAF50; color: white; padding: 20px; text-align: center; }}
        .content {{ padding: 20px; background: #f9f9f9; }}
        .detail {{ background: white; padding: 15px; margin: 10px 0; border-left: 4px solid #4CAF50; }}
        .footer {{ text-align: center; padding: 20px; color: #666; font-size: 12px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>✓ Payment Received</h2>
        </div>
        <div class="content">
            <p>Dear <strong>{tenant.full_name}</strong>,</p>
            <p>We have successfully received your payment:</p>
            <div class="detail">
                <p><strong>Amount:</strong> KES {amount:,.2f}</p>
                <p><strong>Date:</strong> {payment_date}</p>
                <p><strong>New Balance:</strong> KES {tenant.total_balance:,.2f}</p>
            </div>
            <p>Thank you for your prompt payment!</p>
        </div>
        <div class="footer">
            <p>Property Management System</p>
        </div>
    </div>
</body>
</html>
            """

            cls.send_email(tenant.email, subject, email_message, html_message)

    @classmethod
    def notify_late_payment(cls, tenant, days_late, amount_due):
        """
        Send late payment reminder to tenant
        """
        # SMS Notification
        sms_message = f"REMINDER: Dear {tenant.first_name}, your rent is {days_late} days overdue. Amount due: KES {amount_due:,.2f}. Please pay ASAP to avoid penalties."

        if tenant.phone_number:
            cls.send_sms(tenant.phone_number, sms_message)

        # Email Notification
        if tenant.email:
            subject = f"URGENT: Rent Payment {days_late} Days Overdue"
            email_message = f"""
Dear {tenant.full_name},

This is a friendly reminder that your rent payment is overdue.

Days Overdue: {days_late}
Amount Due: KES {amount_due:,.2f}
Total Balance: KES {tenant.total_balance:,.2f}

Please make payment as soon as possible to avoid late fees and other penalties.

If you have already made payment, please disregard this notice.

For any questions or payment arrangements, please contact us.

Best regards,
Property Management Team
            """

            html_message = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: #f44336; color: white; padding: 20px; text-align: center; }}
        .content {{ padding: 20px; background: #f9f9f9; }}
        .detail {{ background: white; padding: 15px; margin: 10px 0; border-left: 4px solid #f44336; }}
        .warning {{ background: #fff3cd; padding: 15px; margin: 10px 0; border-left: 4px solid #ffc107; }}
        .footer {{ text-align: center; padding: 20px; color: #666; font-size: 12px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>⚠ Late Payment Reminder</h2>
        </div>
        <div class="content">
            <p>Dear <strong>{tenant.full_name}</strong>,</p>
            <p>This is a friendly reminder that your rent payment is overdue.</p>
            <div class="detail">
                <p><strong>Days Overdue:</strong> {days_late}</p>
                <p><strong>Amount Due:</strong> KES {amount_due:,.2f}</p>
                <p><strong>Total Balance:</strong> KES {tenant.total_balance:,.2f}</p>
            </div>
            <div class="warning">
                <p>⚠ Please make payment as soon as possible to avoid late fees and other penalties.</p>
            </div>
            <p>If you have already made payment, please disregard this notice.</p>
            <p>For any questions or payment arrangements, please contact us.</p>
        </div>
        <div class="footer">
            <p>Property Management System</p>
        </div>
    </div>
</body>
</html>
            """

            cls.send_email(tenant.email, subject, email_message, html_message)
