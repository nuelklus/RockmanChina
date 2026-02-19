from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from django.db.models import Max





class Staff(models.Model):
    ROLE_CHOICES = [
        ('admin', 'Administrator'),
        ('manager', 'Manager'),
        ('operator', 'Operator'),
        ('clerk', 'Clerk'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='staff_profile')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='operator')
    department = models.CharField(max_length=100, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    employee_id = models.CharField(max_length=50, unique=True, blank=True)
    is_active_staff = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} - {self.get_role_display()}"

    def save(self, *args, **kwargs):
        # Generate employee_id if not provided
        if not self.employee_id:
            # Get all existing employee IDs that match the EMP format
            existing_ids = Staff.objects.filter(
                employee_id__regex=r'^EMP\d+$'
            ).values_list('employee_id', flat=True)
            
            max_num = 0
            for emp_id in existing_ids:
                # Extract numeric part and convert to int
                num_part = emp_id[3:]  # Remove 'EMP' prefix
                if num_part.isdigit():
                    max_num = max(max_num, int(num_part))
            
            next_num = max_num + 1
            self.employee_id = f'EMP{next_num:03d}'
        
        super().save(*args, **kwargs)

    class Meta:
        ordering = ['user__username']
        verbose_name = 'Staff'
        verbose_name_plural = 'Staff'


class Customer(models.Model):
    user = models.OneToOneField(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='customer_profile')
    company_name = models.CharField(max_length=200)
    customer_code = models.CharField(max_length=50, unique=True, blank=True, null=True)
    contact_person = models.CharField(max_length=100, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    address = models.TextField(blank=True)
    company_registration = models.CharField(max_length=50, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)

    def save(self, *args, **kwargs):
        # Only generate customer_code if it's not set and we have a company_name
        if not self.customer_code and self.company_name:
            # Generate customer code like CUST001, CUST002, etc.
            existing_codes = Customer.objects.filter(
                customer_code__regex=r'^CUST\d+$'
            ).exclude(pk=self.pk).values_list('customer_code', flat=True)
            
            max_num = 0
            for code in existing_codes:
                num_part = code[4:]  # Remove 'CUST' prefix
                if num_part.isdigit():
                    max_num = max(max_num, int(num_part))
            
            next_num = max_num + 1
            self.customer_code = f'CUST{next_num:03d}'
        elif not self.customer_code and not self.company_name:
            # Set a temporary code if no company_name to avoid unique constraint
            self.customer_code = f'TEMP{self.pk or 0}'
        
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.company_name} ({self.customer_code})"

    class Meta:
        ordering = ['company_name']


class GoodsCategory(models.Model):
    name = models.CharField(max_length=200, unique=True)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name

    class Meta:
        ordering = ['name']


class Shipment(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('in_transit', 'In Transit'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
    ]
    
    tracking_number = models.CharField(max_length=50, unique=True)
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='shipments')
    origin = models.CharField(max_length=200)
    destination = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    weight = models.DecimalField(max_digits=10, decimal_places=2, help_text="Weight in kg")
    dimensions = models.CharField(max_length=100, blank=True, help_text="Length x Width x Height")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    shipped_date = models.DateTimeField(null=True, blank=True)
    estimated_delivery = models.DateTimeField(null=True, blank=True)
    actual_delivery = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='created_shipments')

    def __str__(self):
        return f"{self.tracking_number} - {self.customer.company_name}"

    class Meta:
        ordering = ['-created_at']


class Receipt(models.Model):
    receipt_number = models.CharField(max_length=50, unique=True)
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='receipts')
    issue_date = models.DateTimeField(default=timezone.now)
    total_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    payment_status = models.CharField(max_length=20, default='pending')
    payment_method = models.CharField(max_length=50, blank=True)
    notes = models.TextField(blank=True)
    
    # Professional Logistics Metadata
    loading_date = models.DateField(null=True, blank=True, help_text="Loading date for shipment")
    eta = models.DateField(null=True, blank=True, help_text="Estimated Time of Arrival")
    container_number = models.CharField(max_length=50, blank=True, help_text="Container number")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='created_receipts')

    def __str__(self):
        return f"Receipt {self.receipt_number} - {self.customer.company_name}"

    def save(self, *args, **kwargs):
        # Generate receipt number if not set
        if not self.receipt_number:
            today = timezone.now().strftime('%Y%m%d')
            # Get today's count
            today_count = Receipt.objects.filter(
                receipt_number__startswith=f'RCP-{today}'
            ).count()
            # Generate new receipt number
            self.receipt_number = f'RCP-{today}-{today_count + 1:03d}'
        super().save(*args, **kwargs)

    class Meta:
        ordering = ['-issue_date']


class ReceiptItem(models.Model):
    receipt = models.ForeignKey(Receipt, on_delete=models.CASCADE, related_name='items')
    category = models.ForeignKey(GoodsCategory, on_delete=models.SET_NULL, null=True, blank=True, related_name='receipt_items')
    description = models.CharField(max_length=200)
    cbm = models.DecimalField(max_digits=10, decimal_places=3, default=0, help_text="Cubic meters")
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    shipment = models.ForeignKey(Shipment, on_delete=models.SET_NULL, null=True, blank=True, related_name='receipt_items')

    def __str__(self):
        return f"{self.description} - {self.receipt.receipt_number}"

    def save(self, *args, **kwargs):
        # Auto-populate unit_price from category if not provided
        if self.category and not self.unit_price:
            self.unit_price = self.category.unit_price
        
        # Calculate total price
        self.total_price = self.cbm * (self.unit_price or 0)
        super().save(*args, **kwargs)

    class Meta:
        ordering = ['receipt', 'id']
