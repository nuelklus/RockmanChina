from rest_framework import serializers
from django.contrib.auth.models import User
from .models import GoodsCategory, Customer, Staff, Shipment, Receipt, ReceiptItem
from django.db import models, transaction


class StaffSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)
    
    class Meta:
        model = Staff
        fields = ['id', 'user', 'username', 'email', 'first_name', 'last_name', 'role', 'department', 
                  'phone', 'employee_id', 'is_active_staff', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class CustomerSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    
    class Meta:
        model = Customer
        fields = ['id', 'user', 'user_name', 'user_email', 'company_name', 'customer_code',
                  'contact_person', 'phone', 'address', 'company_registration', 'is_active', 
                  'created_at', 'updated_at']
        read_only_fields = ['id', 'customer_code', 'created_at', 'updated_at']


class GoodsCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = GoodsCategory
        fields = ['id', 'name', 'unit_price', 'description', 'is_active']
        read_only_fields = ['id']


class ShipmentSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.company_name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)
    
    class Meta:
        model = Shipment
        fields = ['id', 'tracking_number', 'customer', 'customer_name', 'origin', 'destination',
                  'description', 'weight', 'dimensions', 'status', 'shipped_date', 
                  'estimated_delivery', 'actual_delivery', 'created_at', 'updated_at', 'created_by', 'created_by_name']
        read_only_fields = ['id', 'created_at', 'updated_at', 'created_by', 'created_by_name']


class ReceiptItemSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_unit_price = serializers.DecimalField(source='category.unit_price', read_only=True, max_digits=10, decimal_places=2)
    
    class Meta:
        model = ReceiptItem
        fields = ['id', 'receipt', 'category', 'category_name', 'category_unit_price', 'description', 
                  'cbm', 'unit_price', 'total_price', 'shipment']
        read_only_fields = ['id', 'total_price', 'receipt']
    
    def validate(self, data):
        """Validate that unit_price is provided if no category is selected"""
        if not data.get('category') and not data.get('unit_price'):
            raise serializers.ValidationError(
                "Either a category must be selected or a unit_price must be provided."
            )
        return data


class ReceiptSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.company_name', read_only=True)
    customer_code = serializers.CharField(source='customer.customer_code', read_only=True)
    customer_contact_person = serializers.CharField(source='customer.contact_person', read_only=True)
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)
    items = ReceiptItemSerializer(many=True, required=False)
    
    class Meta:
        model = Receipt
        fields = ['id', 'receipt_number', 'customer', 'customer_name', 'customer_code', 'customer_contact_person',
                  'created_by', 'created_by_name', 'total_amount', 'payment_status', 
                  'loading_date', 'eta', 'container_number', 'created_at', 'updated_at', 'items']
        read_only_fields = ['id', 'created_at', 'updated_at', 'receipt_number']
    
    @transaction.atomic
    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        # Add created_by from request user
        validated_data['created_by'] = self.context['request'].user
        
        print(f"DEBUG: Creating receipt with data: {validated_data}")
        print(f"DEBUG: Items data: {items_data}")
        
        receipt = Receipt.objects.create(**validated_data)
        
        # Create items
        for item_data in items_data:
            print(f"DEBUG: Creating item with data: {item_data}")
            ReceiptItem.objects.create(receipt=receipt, **item_data)
        
        # Update total
        total_amount = receipt.items.aggregate(
            total=models.Sum('total_price')
        )['total'] or 0
        receipt.total_amount = total_amount
        receipt.save()
        
        return receipt
