from django.contrib import admin
from . import models



class SlotInline(admin.StackedInline):
    model = models.Slot


@admin.register(models.ReservationDay)
class ReservationDayAdmin(admin.ModelAdmin):
    list_display = ("date",)
    search_fields = ("date",)
    inlines = (SlotInline,)


@admin.register(models.Reservation)
class ReservationDayAdmin(admin.ModelAdmin):
    list_display = ("get_datetime", "full_name", "national_code", "status")
    list_filter = ("status", "slot__day__date")
    search_fields = ("national_code", "full_name")

    @admin.display(description="تاریخ و زمان نوبت")
    def get_datetime(self, obj:models.Reservation):
        return f"{obj.slot.day.date} {obj.slot.time}"


admin.site.register(models.Service)