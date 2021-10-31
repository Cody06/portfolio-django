from django.shortcuts import render

# Import the following:
from django.http import HttpResponse

# Create your views here.
def index(request):
	print("- landing_pate index()")
	return render(request, 'landing_page/index.html')