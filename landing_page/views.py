from django.contrib.auth import authenticate, login, logout
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect
from django.urls import reverse
from django.shortcuts import render

from .models import User

# Create your views here.
def index(request):
	return render(request, 'landing_page/index.html')


def home_redirect(request):
	return HttpResponseRedirect(reverse('index'))


def login_view(request):
	return render(request, 'landing_page/login.html')


def register(request):
	if request.method == 'POST':
		username = request.POST['username']
		email = request.POST['email']

		# Ensure password matches confirmation
		password = request.POST['password']
		confirmation = request.POST['confirmation']
		if password != confirmation:
			return render(request, 'landing_page/register.html', {
				'message': "Passwords must match."
			})

		# Attempt to create new user
		try:
			user = User.objects.create_user(username, email, password)
			user.save()
		except IntegrityError:
			return render(request, 'landing_page/register.html', {
				'message': "username already taken."
			})
		login(request, user)
		return HttpResponseRedirect(reverse('index'))
	
	else:
		return render(request, 'landing_page/register.html')
