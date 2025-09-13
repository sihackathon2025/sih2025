from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .serializers import UserSerializer

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # custom claims
        token['role'] = user.role
        token['email'] = user.email
        token['name'] = user.name
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data['user'] = UserSerializer(self.user).data
        return data
