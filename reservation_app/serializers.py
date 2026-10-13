from rest_framework import serializers
from reservation_app import models



class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Service
        fields = "__all__"


class ReservationDaySerializer(serializers.ModelSerializer):
    class Meta:
        model = models.ReservationDay
        fields = "__all__"


class SlotSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Slot
        fields = "__all__"


class ReservationSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Reservation
        fields = "__all__"

    def validate(self, data):
        if len(data["full_name"]) < 3:
            raise serializers.ValidationError("نام و نام خانوادگی را کامل وارد کن")
        elif data["phone"][:2] != "09" or len(data["phone"]) < 9 or not data["phone"].isdigit():
            raise serializers.ValidationError("شماره موبایل باید با ۰۹ شروع شود و ۱۱ رقم باشد")
        elif len(data["national_code"]) < 10 or not data["national_code"].isdigit():
            raise serializers.ValidationError("کد ملی باید دقیقاً ۱۰ رقم باشد و فقط عدد وارد کن")

        return data