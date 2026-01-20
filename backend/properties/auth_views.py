"""
Authentication views for login, logout, and user management
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.views.decorators.csrf import ensure_csrf_cookie, csrf_exempt
from django.utils.decorators import method_decorator
from .models import UserProfile, Tenant
from .serializers import UserSerializer


@api_view(['GET'])
@permission_classes([AllowAny])
@ensure_csrf_cookie
def csrf_token_view(request):
    """
    Get CSRF token
    """
    return Response({'detail': 'CSRF cookie set'})


@api_view(['POST'])
@permission_classes([AllowAny])
@csrf_exempt
def login_view(request):
    """
    Login endpoint - returns user info and role
    """
    print("Login attempt received")
    print(f"Request data: {request.data}")

    username = request.data.get('username')
    password = request.data.get('password')

    print(
        f"Username: {username}, Password: {'*' * len(password) if password else 'None'}")

    if not username or not password:
        print("Missing username or password")
        return Response(
            {'error': 'Username and password required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    user = authenticate(request, username=username, password=password)
    print(f"Authentication result: {user}")

    if user is None:
        print("Authentication failed")
        return Response(
            {'error': 'Invalid credentials'},
            status=status.HTTP_401_UNAUTHORIZED
        )

    login(request, user)
    print(f"User logged in: {user.username}")

    # Get user profile and role
    try:
        profile = user.profile
        role = profile.role
        print(f"User role: {role}")
    except UserProfile.DoesNotExist:
        # Create profile if doesn't exist
        profile = UserProfile.objects.create(user=user, role='TENANT')
        role = 'TENANT'
        print("Created new profile with TENANT role")

    # If tenant, get tenant info
    tenant_info = None
    if role == 'TENANT':
        try:
            tenant = Tenant.objects.filter(email=user.email).first()
            if tenant:
                tenant_info = {
                    'id': tenant.id,
                    'full_name': tenant.full_name,
                    'unit': tenant.unit.unit_number,
                    'building': tenant.unit.building.name,
                    'balance': float(tenant.total_balance)
                }
        except Exception as e:
            print(f"Error getting tenant info: {e}")

    response_data = {
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'role': role,
            'role_display': profile.get_role_display()
        },
        'tenant_info': tenant_info
    }

    print(f"Sending response: {response_data}")
    return Response(response_data)


@api_view(['POST'])
@permission_classes([AllowAny])
@csrf_exempt
def signup_view(request):
    """
    Signup endpoint - create new user account
    """
    username = request.data.get('username')
    password = request.data.get('password')
    email = request.data.get('email')
    first_name = request.data.get('first_name', '')
    last_name = request.data.get('last_name', '')

    if not username or not password or not email:
        return Response(
            {'error': 'Username, email, and password required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Check if user exists
    if User.objects.filter(username=username).exists():
        return Response(
            {'error': 'Username already exists'},
            status=status.HTTP_400_BAD_REQUEST
        )

    if User.objects.filter(email=email).exists():
        return Response(
            {'error': 'Email already exists'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Create user
    user = User.objects.create_user(
        username=username,
        email=email,
        password=password,
        first_name=first_name,
        last_name=last_name
    )

    # Create profile
    UserProfile.objects.create(user=user, role='TENANT')

    # Log the user in
    login(request, user)

    return Response({
        'message': 'Account created successfully',
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'role': 'TENANT',
            'role_display': 'Tenant'
        }
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """
    Logout endpoint
    """
    logout(request)
    return Response({'message': 'Logged out successfully'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_user(request):
    """
    Get current logged in user info
    """
    user = request.user

    try:
        profile = user.profile
        role = profile.role
    except UserProfile.DoesNotExist:
        profile = UserProfile.objects.create(user=user, role='TENANT')
        role = 'TENANT'

    # If tenant, get tenant info
    tenant_info = None
    if role == 'TENANT':
        try:
            tenant = Tenant.objects.filter(email=user.email).first()
            if tenant:
                tenant_info = {
                    'id': tenant.id,
                    'full_name': tenant.full_name,
                    'unit': tenant.unit.unit_number,
                    'building': tenant.unit.building.name,
                    'balance': float(tenant.total_balance)
                }
        except Exception:
            pass

    return Response({
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'role': role,
            'role_display': profile.get_role_display()
        },
        'tenant_info': tenant_info
    })
