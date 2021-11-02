from django.db import models

# Import the following:
from django.contrib.auth.models import AbstractUser

# Create your models here.
class User(AbstractUser):
    number_of_followers = models.IntegerField(default=0)
    number_of_followings = models.IntegerField(default=0)

    def __str__(self):
        return f"User: {self.id}, {self.username}, followers: {self.number_of_followers}, following: {self.number_of_followings}"