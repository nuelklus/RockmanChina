from django.contrib import admin
from .models import Staff, Customer, GoodsCategory, Shipment, Receipt, ReceiptItem


@admin.register(Staff)
class StaffAdmin(admin.ModelAdmin):
    list_display = ('user', 'employee_id', 'role', 'department', 'phone', 'is_active_staff', 'created_at')
    list_filter = ('role', 'is_active_staff', 'department')
    search_fields = ('user__username', 'user__email', 'employee_id', 'phone')
    readonly_fields = ('employee_id',)
    ordering = ('-created_at',)
    
    def get_readonly_fields(self, request, obj=None):
        readonly = list(self.readonly_fields)
        if obj:  # Editing existing object
            readonly.append('employee_id')  # Always read-only for existing objects
        return readonly


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ('company_name', 'contact_person', 'phone', 'email', 'is_active', 'created_at')
    list_filter = ('is_active',)
    search_fields = ('company_name', 'contact_person', 'email')


@admin.register(GoodsCategory)
class GoodsCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'unit_price')
    search_fields = ('name',)


@admin.register(Shipment)
class ShipmentAdmin(admin.ModelAdmin):
    list_display = ('tracking_number', 'customer', 'origin', 'destination', 'status', 'estimated_delivery')
    list_filter = ('status',)
    search_fields = ('tracking_number', 'customer__company_name')


@admin.register(Receipt)
class ReceiptAdmin(admin.ModelAdmin):
    list_display = ('receipt_number', 'customer', 'created_by', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('receipt_number', 'customer__company_name')


@admin.register(ReceiptItem)
class ReceiptItemAdmin(admin.ModelAdmin):
    list_display = ('description', 'receipt', 'category', 'cbm', 'unit_price', 'total_price')
    list_filter = ('category',)
    search_fields = ('description', 'receipt__receipt_number')
