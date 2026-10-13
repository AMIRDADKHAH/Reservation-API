from rest_framework import serializers
from reservation_app import models



class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Service
        fields = "__all__"