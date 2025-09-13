from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from .models import User
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework import generics, permissions, response, status
from .serializers import UserRegisterSerializer, UserSerializer
from .token_serializers import MyTokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView

# # class UserRegistrationView(APIView):
#     permission_classes = [AllowAny]

#     def post(self, request):
#         serializer = UserRegistrationSerializer(data=request.data)
#         serializer.is_valid(raise_exception=True)
#         serializer.save()
#         return Response({"message": "User registered successfully"}, status=201)

# class UserLoginView(APIView):
#     permission_classes = [AllowAny]

#     def post(self, request):
#         email = request.data.get('email')
#         password = request.data.get('password')

#         user = User.objects.filter(email=email).first()

#         if user is None or not user.check_password(password):
#             return Response({'error': 'Invalid credentials'}, status=401)

#         refresh = RefreshToken.for_user(user)
#         return Response({
#             'token': str(refresh.access_token),
#         })



class RegisterView(generics.CreateAPIView):
    serializer_class = UserRegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.save()   # ✅ this will already return {user, refresh, access}
        return response.Response(data, status=status.HTTP_201_CREATED)


class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer
