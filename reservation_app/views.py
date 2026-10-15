from django.shortcuts import render
from django.views.generic import TemplateView
from rest_framework.generics import ListAPIView
from rest_framework.views import APIView
from rest_framework.request import Request
from rest_framework.response import Response
from .models import Service, ReservationDay, Slot
from .serializers import ServiceSerializer, ReservationDaySerializer, SlotSerializer, ReservationSerializer
import jdatetime
from rest_framework import status
from .funcs import del_reservationday, set_status_reservation

# Views
class HomeView(TemplateView):
    def get(self, request):
        del_reservationday()
        set_status_reservation()
        return render(request, "reservation_app\index.html")


# APIS
class ServiceListView(ListAPIView):
    queryset = Service.objects.all()
    serializer_class = ServiceSerializer


class DayListView(ListAPIView):
    serializer_class = ReservationDaySerializer

    def get_queryset(self):
        today = jdatetime.date.today()
        return ReservationDay.objects.filter(date__gte=today)


class SlotListView(ListAPIView):
    serializer_class = SlotSerializer

    def get_queryset(self):
        request:Request = self.request
        day_id = request.query_params.get("day")
        service_id = request.query_params.get("service")
        if not day_id or not service_id:
            return Slot.objects.none()

        return Slot.objects.filter(day=day_id, service_id=service_id)


class ReservationCreateView(APIView):
    def post(self, request:Request):
        data = request.data
        ser = ReservationSerializer(data=data)
        if ser.is_valid():
            slot_id = ser.validated_data["slot"]
            slot_id.free = False
            slot_id.save()
            ser.save()
            return Response("Reservation Created", status=status.HTTP_201_CREATED)

        return Response(ser.errors, status=status.HTTP_400_BAD_REQUEST)