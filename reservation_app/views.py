from django.shortcuts import render
from django.views.generic import TemplateView
from rest_framework.generics import ListAPIView
from rest_framework.request import Request
from .models import Service, ReservationDay, Slot
from .serializers import ServiceSerializer, ReservationDaySerializer, SlotSerializer
import jdatetime


# Views
class HomeView(TemplateView):
    template_name = "reservation_app\index.html"



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