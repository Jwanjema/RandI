"""
PDF generation service for statements and invoices
"""
from io import BytesIO
from django.http import HttpResponse
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT
from datetime import datetime


class PDFGenerator:
    """Generate PDF documents for statements and invoices"""

    @staticmethod
    def generate_tenant_statement(tenant, transactions):
        """
        Generate a PDF statement for a tenant
        """
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter,
                                rightMargin=72, leftMargin=72,
                                topMargin=72, bottomMargin=18)

        # Container for the 'Flowable' objects
        elements = []
        styles = getSampleStyleSheet()

        # Custom styles
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#2196F3'),
            spaceAfter=30,
            alignment=TA_CENTER,
        )

        heading_style = ParagraphStyle(
            'CustomHeading',
            parent=styles['Heading2'],
            fontSize=14,
            textColor=colors.HexColor('#333333'),
            spaceAfter=12,
        )

        # Title
        title = Paragraph("TENANT STATEMENT", title_style)
        elements.append(title)
        elements.append(Spacer(1, 12))

        # Property Information
        property_info = [
            ['Building:', tenant.unit.building.name],
            ['Unit Number:', tenant.unit.unit_number],
            ['Monthly Rent:', f'KES {tenant.unit.monthly_rent:,.2f}'],
        ]

        property_table = Table(property_info, colWidths=[2*inch, 4*inch])
        property_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ]))

        # Tenant Information
        tenant_info = [
            ['Tenant Name:', tenant.full_name],
            ['Phone:', tenant.phone or 'N/A'],
            ['Email:', tenant.email or 'N/A'],
            ['Move-in Date:', tenant.move_in_date.strftime('%Y-%m-%d')],
            ['Status:', 'Active' if not tenant.move_out_date else 'Moved Out'],
        ]

        tenant_table = Table(tenant_info, colWidths=[2*inch, 4*inch])
        tenant_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ]))

        elements.append(Paragraph("Property Details", heading_style))
        elements.append(property_table)
        elements.append(Spacer(1, 20))

        elements.append(Paragraph("Tenant Information", heading_style))
        elements.append(tenant_table)
        elements.append(Spacer(1, 20))

        # Transactions Table
        elements.append(Paragraph("Transaction History", heading_style))

        # Header
        transaction_data = [
            ['Date', 'Type', 'Description', 'Amount', 'Balance']]

        running_balance = 0
        for transaction in transactions:
            amount = float(transaction.amount)
            if transaction.payment_type == 'CHARGE':
                running_balance += amount
                amount_str = f'-KES {amount:,.2f}'
            else:  # PAYMENT
                running_balance -= amount
                amount_str = f'+KES {amount:,.2f}'

            transaction_data.append([
                transaction.transaction_date.strftime('%Y-%m-%d'),
                transaction.payment_type,
                transaction.description[:40] + '...' if len(
                    transaction.description) > 40 else transaction.description,
                amount_str,
                f'KES {running_balance:,.2f}'
            ])

        transaction_table = Table(transaction_data, colWidths=[
                                  1.2*inch, 1*inch, 2.5*inch, 1.3*inch, 1*inch])
        transaction_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2196F3')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('ALIGN', (3, 0), (4, -1), 'RIGHT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('TOPPADDING', (0, 0), (-1, 0), 12),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1),
             [colors.white, colors.lightgrey]),
        ]))

        elements.append(transaction_table)
        elements.append(Spacer(1, 20))

        # Summary
        total_charges = sum(float(t.amount)
                            for t in transactions if t.payment_type == 'CHARGE')
        total_payments = sum(float(t.amount)
                             for t in transactions if t.payment_type == 'PAYMENT')
        current_balance = total_charges - total_payments

        summary_data = [
            ['Total Charges:', f'KES {total_charges:,.2f}'],
            ['Total Payments:', f'KES {total_payments:,.2f}'],
            ['Current Balance:', f'KES {current_balance:,.2f}'],
        ]

        summary_table = Table(summary_data, colWidths=[3*inch, 2*inch])
        summary_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'RIGHT'),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 12),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
            ('TOPPADDING', (0, 0), (-1, -1), 10),
            ('LINEABOVE', (0, -1), (-1, -1), 2, colors.HexColor('#2196F3')),
            ('BACKGROUND', (0, -1), (-1, -1), colors.lightgrey),
        ]))

        elements.append(summary_table)
        elements.append(Spacer(1, 30))

        # Footer
        footer_style = ParagraphStyle(
            'Footer',
            parent=styles['Normal'],
            fontSize=8,
            textColor=colors.grey,
            alignment=TA_CENTER,
        )

        footer_text = f"Generated on {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}<br/>Property Management System"
        footer = Paragraph(footer_text, footer_style)
        elements.append(footer)

        # Build PDF
        doc.build(elements)

        # Get the value of the BytesIO buffer and return it
        pdf = buffer.getvalue()
        buffer.close()
        return pdf

    @staticmethod
    def generate_rent_invoice(tenant, payment, month):
        """
        Generate a PDF invoice for rent payment
        """
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter,
                                rightMargin=72, leftMargin=72,
                                topMargin=72, bottomMargin=18)

        elements = []
        styles = getSampleStyleSheet()

        # Custom styles
        title_style = ParagraphStyle(
            'InvoiceTitle',
            parent=styles['Heading1'],
            fontSize=28,
            textColor=colors.HexColor('#2196F3'),
            spaceAfter=20,
            alignment=TA_CENTER,
        )

        # Title
        title = Paragraph("RENT INVOICE", title_style)
        elements.append(title)
        elements.append(Spacer(1, 20))

        # Invoice details
        invoice_data = [
            ['Invoice Date:', datetime.now().strftime('%Y-%m-%d')],
            ['Invoice #:', f'INV-{payment.id:06d}'],
            ['Period:', month],
        ]

        invoice_table = Table(invoice_data, colWidths=[2*inch, 3*inch])
        invoice_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 11),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ]))

        elements.append(invoice_table)
        elements.append(Spacer(1, 30))

        # Bill To
        bill_to_style = ParagraphStyle(
            'BillTo',
            parent=styles['Heading2'],
            fontSize=14,
            spaceAfter=10,
        )

        elements.append(Paragraph("BILL TO:", bill_to_style))

        bill_to_data = [
            [tenant.full_name],
            [tenant.unit.building.name],
            [f'Unit: {tenant.unit.unit_number}'],
            [tenant.phone_number or ''],
        ]

        for row in bill_to_data:
            elements.append(Paragraph(row[0], styles['Normal']))

        elements.append(Spacer(1, 30))

        # Items
        items_data = [
            ['Description', 'Amount'],
            [f'Rent for {month}', f'KES {payment.amount:,.2f}'],
        ]

        items_table = Table(items_data, colWidths=[4*inch, 2*inch])
        items_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2196F3')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 12),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
            ('TOPPADDING', (0, 0), (-1, -1), 12),
            ('GRID', (0, 0), (-1, -1), 1, colors.grey),
        ]))

        elements.append(items_table)
        elements.append(Spacer(1, 20))

        # Total
        total_data = [
            ['Total Due:', f'KES {payment.amount:,.2f}'],
        ]

        total_table = Table(total_data, colWidths=[4*inch, 2*inch])
        total_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'RIGHT'),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 14),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
            ('TOPPADDING', (0, 0), (-1, -1), 12),
            ('LINEABOVE', (0, 0), (-1, 0), 2, colors.black),
            ('BACKGROUND', (0, 0), (-1, -1), colors.lightgrey),
        ]))

        elements.append(total_table)
        elements.append(Spacer(1, 40))

        # Payment Instructions
        instructions_style = ParagraphStyle(
            'Instructions',
            parent=styles['Normal'],
            fontSize=10,
            spaceAfter=8,
        )

        elements.append(
            Paragraph("<b>Payment Instructions:</b>", instructions_style))
        elements.append(Paragraph(
            "Please make payment within 5 days of the due date.", instructions_style))
        elements.append(
            Paragraph("Late payments may incur additional fees.", instructions_style))

        elements.append(Spacer(1, 30))

        # Footer
        footer_style = ParagraphStyle(
            'Footer',
            parent=styles['Normal'],
            fontSize=8,
            textColor=colors.grey,
            alignment=TA_CENTER,
        )

        footer_text = "Thank you for your business!<br/>Property Management System"
        footer = Paragraph(footer_text, footer_style)
        elements.append(footer)

        # Build PDF
        doc.build(elements)

        pdf = buffer.getvalue()
        buffer.close()
        return pdf
