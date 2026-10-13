from django.shortcuts import render
from django.views.generic import TemplateView
from rest_framework.generics import ListAPIView
from .models import Service
from .serializers import ServiceSerializer


# Views
class HomeView(TemplateView):
    template_name = "reservation_app\index.html"



# APIS
class ServiceListView(ListAPIView):
    queryset = Service.objects.all()
    serializer_class = ServiceSerializer