from django.urls import path
from . import views


app_name = "reservation_app"


urlpatterns = [
    path("services", views.ServiceListView.as_view(), name="service_list_api"),
    path("days", views.DayListView.as_view(), name="day_list_api"),
    path("slots", views.SlotListView.as_view(), name="slot_list_api"),
    path("reservation/create", views.ReservationCreateView.as_view(), name="reservation_create_api"),
]