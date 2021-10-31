# Step 3. Create the urls.py module and all the paths for the application

from django.urls import include, path
from . import views

urlpatterns = [
	path('', views.index, name='index'),
	path('workboard/', include('workboard.urls', namespace='workboard'), name='workboard'),	# link to the workboard app
	#path('social/', include('social.urls', namespace='social'), name='social'),
	#path('mail-client/', include('mail_client.urls', namespace='mail_client'), name='mail_client'),
	#path('commerce/', include('commerce.urls', namespace='commerce'), name='commerce')
]
