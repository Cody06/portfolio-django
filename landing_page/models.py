from django.db import models

# Import the following:
from django.contrib.auth.models import AbstractUser

# Create your models here.
class User(AbstractUser):
	def __str__(self):
		return f"User: {self.id}, {self.username}"