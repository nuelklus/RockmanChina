from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (GoodsCategoryViewSet, CustomerViewSet, StaffViewSet,
                   ShipmentViewSet, ReceiptViewSet, ReceiptItemViewSet)
from . import auth_views

router = DefaultRouter()
router.register(r'categories', GoodsCategoryViewSet)
router.register(r'customers', CustomerViewSet)
router.register(r'staff', StaffViewSet)
router.register(r'shipments', ShipmentViewSet)
router.register(r'receipts', ReceiptViewSet)
router.register(r'receipt-items', ReceiptItemViewSet)

urlpatterns = [
    path('auth/login/', auth_views.staff_login, name='staff_login'),
    path('auth/logout/', auth_views.staff_logout, name='staff_logout'),
    path('auth/profile/', auth_views.staff_profile, name='staff_profile'),
    path('', include(router.urls)),
]
