from django.contrib import admin
from .models import Listing, Bid, Comment, Watchlist, Category

# Customize the Django admin app
class ListingAdmin(admin.ModelAdmin):
	list_display = ("id", "title", "starting_bid", "seller", "category", "description", "active", "image_URL")

class CategoryAdmin(admin.ModelAdmin):
	list_display = ("id", "name")

class BidAdmin(admin.ModelAdmin):
	list_display = ("id", "user", "listing", "bid_amount")

# Register your models here.
admin.site.register(Listing, ListingAdmin)
admin.site.register(Bid, BidAdmin)
admin.site.register(Comment)
admin.site.register(Watchlist)
admin.site.register(Category, CategoryAdmin)

"""
To create an admin account:
$ python3 manage.py createsuperuser

Then add "/admin" to the url to visit the admin page
"""