from rest_framework import serializers
from .models import User
from rest_framework_simplejwt.tokens import RefreshToken


class UserRegisterSerializer(serializers.ModelSerializer):
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = [
            'user_id', 'name', 'role', 'district', 'state',
            'email', 'password', 'password2'
        ]
        extra_kwargs = {
            'password': {'write_only': True, 'min_length': 5},
        }

    def validate(self, attrs):
        if attrs.get('password') != attrs.pop('password2'):
            raise serializers.ValidationError({"password": "Password fields didn't match."})

        if len(attrs.get("password")) < 5:
            raise serializers.ValidationError({"password": "Password must be at least 5 characters long."})

        return attrs

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()

        refresh = RefreshToken.for_user(user)

        return {
            "user": UserSerializer(user).data,
            "refresh": str(refresh),
            "access": str(refresh.access_token),
        }


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['user_id', 'email', 'name', 'role', 'district', 'state']
