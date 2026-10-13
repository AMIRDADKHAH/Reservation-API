from django.db import models
from django.core.validators import MinValueValidator
from django.utils import timezone
from django_jalali.db.models import jDateField, jdatetime


class Service(models.Model):
    title = models.CharField(max_length=100, verbose_name="عنوان")
    visit_time = models.TimeField(verbose_name="مدت زمان ویزیت")
    price = models.PositiveBigIntegerField(verbose_name="هزینه ویزیت")

    class Meta:
        verbose_name = "خدمت"
        verbose_name_plural = "خدمات"

    def __str__(self):
        return f"{self.title}"



class ReservationDay(models.Model):
    date = jDateField(verbose_name="تاریخ", validators=[
        MinValueValidator(jdatetime.datetime.now, "تاریخ های گذشته را نمی توان وارد کرد")
    ])

    class Meta:
        verbose_name = "روز رزرو"
        verbose_name_plural = "روز های رزرو"
        ordering = ("date",)

    def __str__(self):
        return f"{self.date}"


class Slot(models.Model):
    day = models.ForeignKey(ReservationDay, on_delete=models.CASCADE, verbose_name="روز", related_name="slots")
    service = models.ForeignKey(Service, on_delete=models.CASCADE, verbose_name="نوع خدمت", related_name="slots")
    time = models.TimeField(verbose_name="زمان")
    free = models.BooleanField(default=True)

    class Meta:
            verbose_name = "رزرو"
            verbose_name_plural = "رزرو ها"

    def __str__(self):
        return f"{self.service} -- {self.day} -- {self.time}"



class Reservation(models.Model):
    class Status(models.TextChoices):
        BOOKED = "booked", "ثبت‌شده"
        CANCELLED = "cancelled", "لغو‌شده"
        DONE = "done", "انجام‌شده"
    
    slot = models.OneToOneField(Slot, on_delete=models.CASCADE, verbose_name="نوبت")
    full_name = models.CharField(max_length=150, verbose_name="نام و نام خانوادگی")
    phone = models.CharField(max_length=11, verbose_name="شماره تلفن")
    national_code = models.CharField(max_length=25, verbose_name="کد ملی")
    status = models.CharField(max_length=15, choices=Status.choices, default=Status.BOOKED, verbose_name="وضعیت")
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = "نوبت"
        verbose_name_plural = "نوبت ها"
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.full_name} -- {self.status}"