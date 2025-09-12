from rest_framework import serializers
from .models import User

class UserRegistrationSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('name', 'email', 'password', 'role', 'village_id')
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        # Hash the password before saving
        user = User.objects.create_user(**validated_data)
        return user

class UserProfileSerializer(serializers.ModelSerializer):
    # To show village name instead of just the ID
    village_name = serializers.CharField(source='village.village_name', read_only=True)
    class Meta:
        model = User
        fields = ('user_id', 'name', 'email', 'role', 'village_id', 'village_name')
