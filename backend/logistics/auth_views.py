from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.contrib.auth import authenticate
from rest_framework.authtoken.models import Token
from logistics.models import Staff


@api_view(['POST'])
@permission_classes([AllowAny])
def staff_login(request):
    """Staff login endpoint"""
    username = request.data.get('username')
    password = request.data.get('password')
    
    if not username or not password:
        return Response(
            {'error': 'Username and password are required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    user = authenticate(username=username, password=password)
    
    if not user:
        return Response(
            {'error': 'Invalid credentials'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    # Check if user has staff profile
    try:
        staff = user.staff_profile
        if not staff.is_active_staff:
            return Response(
                {'error': 'Staff account is not active'},
                status=status.HTTP_403_FORBIDDEN
            )
    except Staff.DoesNotExist:
        return Response(
            {'error': 'User does not have staff privileges'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Get or create token
    token, created = Token.objects.get_or_create(user=user)
    
    return Response({
        'token': token.key,
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'is_staff': user.is_staff,
            'is_superuser': user.is_superuser,
        },
        'staff': {
            'id': staff.id,
            'role': staff.role,
            'department': staff.department,
            'phone': staff.phone,
            'employee_id': staff.employee_id,
            'is_active_staff': staff.is_active_staff,
        }
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def staff_logout(request):
    """Staff logout endpoint"""
    try:
        # Delete the token to logout
        token = Token.objects.get(user=request.user)
        token.delete()
        return Response({'message': 'Logged out successfully'})
    except Token.DoesNotExist:
        return Response({'message': 'Already logged out'})


@api_view(['GET'])
def staff_profile(request):
    """Get current staff profile"""
    try:
        staff = request.user.staff_profile
        return Response({
            'user': {
                'id': request.user.id,
                'username': request.user.username,
                'email': request.user.email,
                'first_name': request.user.first_name,
                'last_name': request.user.last_name,
                'is_staff': request.user.is_staff,
                'is_superuser': request.user.is_superuser,
            },
            'staff': {
                'id': staff.id,
                'role': staff.role,
                'department': staff.department,
                'phone': staff.phone,
                'employee_id': staff.employee_id,
                'is_active_staff': staff.is_active_staff,
            }
        })
    except Staff.DoesNotExist:
        return Response(
            {'error': 'Staff profile not found'},
            status=status.HTTP_404_NOT_FOUND
        )
