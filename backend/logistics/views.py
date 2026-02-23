from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter
from django.db import models
from django.contrib.auth.models import User
from .models import GoodsCategory, Customer, Staff, Shipment, Receipt, ReceiptItem
from .serializers import (GoodsCategorySerializer, CustomerSerializer, 
                         StaffSerializer, ShipmentSerializer, ReceiptSerializer, ReceiptItemSerializer)


class GoodsCategoryViewSet(viewsets.ModelViewSet):
    queryset = GoodsCategory.objects.filter(is_active=True)
    serializer_class = GoodsCategorySerializer
    pagination_class = None  # Disable pagination for all category endpoints
    filter_backends = [DjangoFilterBackend, SearchFilter]
    search_fields = ['name', 'description']
    filterset_fields = ['is_active']
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        """Get only active categories"""
        self.pagination_class = None
        categories = self.queryset
        serializer = self.get_serializer(categories, many=True)
        return Response(serializer.data)


class StaffViewSet(viewsets.ModelViewSet):
    queryset = Staff.objects.filter(is_active_staff=True)
    serializer_class = StaffSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter]
    search_fields = ['user__username', 'user__email', 'user__first_name', 'user__last_name', 'employee_id', 'department']
    filterset_fields = ['role', 'is_active_staff']
    
    @action(detail=False, methods=['post'], permission_classes=[permissions.AllowAny])
    def create_staff(self, request):
        """Create new staff user"""
        import json
        
        # Handle different request data formats
        if isinstance(request.data, str):
            try:
                data = json.loads(request.data)
            except json.JSONDecodeError:
                return Response(
                    {'error': 'Invalid JSON format'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            data = request.data
            
        user_data = data.get('user', {})
        staff_data = data.get('staff', {})
        
        # Validate required fields
        if not user_data.get('username'):
            return Response(
                {'error': 'Username is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not staff_data.get('role'):
            return Response(
                {'error': 'Role is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create user
        user = User.objects.create_user(
            username=user_data.get('username'),
            email=user_data.get('email', ''),
            first_name=user_data.get('first_name', ''),
            last_name=user_data.get('last_name', ''),
            password=user_data.get('password', 'password123')
        )
        
        # Create staff profile
        staff = Staff.objects.create(
            user=user,
            role=staff_data.get('role', 'operator'),
            department=staff_data.get('department', ''),
            phone=staff_data.get('phone', ''),
            employee_id=staff_data.get('employee_id', ''),
            is_active_staff=True
        )
        
        serializer = self.get_serializer(staff)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def dashboard_stats(self, request):
        """Get dashboard statistics"""
        from django.db.models import Count, Q
        
        # Get counts
        total_staff = Staff.objects.filter(is_active_staff=True).count()
        total_customers = Customer.objects.filter(is_active=True).count()
        total_shipments = Shipment.objects.count()
        total_receipts = Receipt.objects.count()
        
        return Response({
            'total_staff': total_staff,
            'total_customers': total_customers,
            'total_shipments': total_shipments,
            'total_receipts': total_receipts
        })


class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.filter(is_active=True)
    serializer_class = CustomerSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    search_fields = ['company_name', 'contact_person', 'email', 'company_registration']
    filterset_fields = ['is_active']
    
    def get_queryset(self):
        queryset = super().get_queryset()
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(company_name__icontains=search)
        return queryset
    
    @action(detail=False, methods=['post'])
    def create_or_get(self, request):
        """Create customer if not exists, otherwise get existing"""
        company_name = request.data.get('company_name', '').strip()
        if not company_name:
            return Response({'error': 'Customer company name is required'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        customer, created = Customer.objects.get_or_create(
            company_name=company_name,
            defaults={
                'contact_person': request.data.get('contact_person', ''),
                'phone': request.data.get('phone', ''),
                'email': request.data.get('email', ''),
                'address': request.data.get('address', ''),
                'company_registration': request.data.get('company_registration', ''),
            }
        )
        
        serializer = self.get_serializer(customer)
        return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


class ShipmentViewSet(viewsets.ModelViewSet):
    queryset = Shipment.objects.all()
    serializer_class = ShipmentSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter]
    search_fields = ['tracking_number', 'origin', 'destination', 'description']
    filterset_fields = ['customer', 'status']


class ReceiptViewSet(viewsets.ModelViewSet):
    queryset = Receipt.objects.all()
    serializer_class = ReceiptSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter]
    search_fields = ['receipt_number', 'customer__name', 'notes']
    filterset_fields = ['customer', 'payment_status']
    
    @action(detail=True, methods=['post'])
    def add_item(self, request, pk=None):
        """Add item to receipt"""
        receipt = self.get_object()
        serializer = ReceiptItemSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(receipt=receipt)
            # Update receipt total
            receipt.total_amount = receipt.items.aggregate(
                total=models.Sum('total_price')
            )['total'] or 0
            receipt.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ReceiptItemViewSet(viewsets.ModelViewSet):
    queryset = ReceiptItem.objects.all()
    serializer_class = ReceiptItemSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['receipt', 'category', 'shipment']
