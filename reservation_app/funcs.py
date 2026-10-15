from . import models
import jdatetime


def del_reservationday():
    queryset = models.ReservationDay.objects.all()
    for obj in queryset:
        date = obj.date
        obj_id = obj.id
        now = jdatetime.datetime.today().date()
        if now > date:
            obj.delete()
            print(f"{obj_id}-{date} deleted.")


def set_status_reservation():
    queryset = models.Reservation.objects.filter(status="booked")
    for obj in queryset:
        obj_date = obj.slot.day.date
        now = jdatetime.datetime.today().date()
        if now > obj_date:
            obj.status = "no_show"
            obj.save()