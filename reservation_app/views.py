from django.shortcuts import render
from django.views.generic import TemplateView
from rest_framework.generics import ListAPIView
from .models import Service, ReservationDay
from .serializers import ServiceSerializer, ReservationDaySerializer
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