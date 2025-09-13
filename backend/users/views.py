from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from .serializers import UserRegistrationSerializer
from .models import User
from rest_framework_simplejwt.tokens import RefreshToken

class UserRegistrationView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"message": "User registered successfully"}, status=201)

class UserLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')

        user = User.objects.filter(email=email).first()

        if user is None or not user.check_password(password):
            return Response({'error': 'Invalid credentials'}, status=401)

        refresh = RefreshToken.for_user(user)
        return Response({
            'token': str(refresh.access_token),
        })