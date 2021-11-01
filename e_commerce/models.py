from django.db import models

from landing_page.models import User

# Create your models here.
class Category(models.Model):
    name = models.CharField(max_length=64)

    def __str__(self):
        return f"{self.name}"


class Listing(models.Model):
    title = models.CharField(max_length=30)
    starting_bid = models.DecimalField(max_digits=9, decimal_places=2) # Max number: 9,999,999.99
    current_bid = models.DecimalField(max_digits=9, decimal_places=2, default=0)
    number_of_bids = models.IntegerField(default=0)

    description = models.CharField(max_length=280, blank=True)
    image_URL = models.CharField(max_length=6000, blank=True) # Will get an URL for the image (optionally)
    category = models.ForeignKey(Category, on_delete=models.CASCADE, null=True, related_name="list_category")

    seller = models.ForeignKey(User, on_delete=models.CASCADE, related_name="list_seller")
    creation_date = models.CharField(max_length=40)
    
    active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.title} ${self.starting_bid} ${self.current_bid} '{self.description}' {self.seller}"


class Bid(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="user_bid")
    listing = models.ForeignKey(Listing, on_delete=models.CASCADE, related_name="listing_bid")
    bid_amount = models.DecimalField(max_digits=9, decimal_places=2)        # The largest number will tell us the highest bidder

    def __str__(self):
        return f"{self.user.username} - {self.listing.title} - ${self.bid_amount}"


class Comment(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="user_comments")
    listing = models.ForeignKey(Listing, on_delete=models.CASCADE, related_name="listing_comments")
    comment = models.CharField(max_length=280, blank=True)
    date = models.CharField(max_length=40)
    
    def __str__(self):
        return f"User: {self.user.username} - Listing: {self.listing.title} - Comment: {self.comment}"


class Watchlist(models.Model):
    user = models.ForeignKey(User,on_delete=models.CASCADE, related_name="user_watchlist")  
    listing = models.ForeignKey(Listing, on_delete=models.CASCADE, related_name="listing_watchlist")                      
    
    def __str__(self):
        return f"UserID: {self.user}, ListingID: {self.listing.title}"


"""
Order the classed based on how they reference the foreign key.
Every time we change something in models.py we need to:
$ python3 manage.py makemigrations auctions
$ python3 manage.py migrate
"""