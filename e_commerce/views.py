from django.contrib.auth import authenticate, login, logout, decorators
from django.contrib.auth.decorators import login_required
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect
from django.shortcuts import render
from django.urls import reverse

from landing_page.models import User
from .models import Listing, Bid, Comment, Watchlist, Category
from datetime import datetime   # Used to get current time
from pytz import timezone       # Used to transform timezones
from django import forms        # Used to create Django forms

#_____________________________________Home Page_____________________________________
def index(request):
    """
    This is the active listing page.
    """
    listings = Listing.objects.order_by('-creation_date').all()
    try:    # Run this if we have an userId (created after user logged in)
        print(f"Index userID: {request.session['userID']}")
        return render(request, "commerce/index.html", {
            "listings": listings,
            "currentUserWins": getUserListingWins(request)
        })
    except KeyError:        # Show this if we got to the page without a user id
        return render(request, "commerce/index.html", {
            "listings": listings
        })

def guest_path(request):
    # Check if guest account already exists
    try:
        guest = User.objects.get(username='guest')
    except User.DoesNotExist:
        return HttpResponse("Guest account does not exist")
    login(request, guest)
    request.session["userID"] = guest.id              # Save the user's id in the session
    return HttpResponseRedirect(reverse('commerce:index'))    # ensure we redirect to the index of workboard

def getUserListingWins(request):
    """
    Get all the listing the current user won.
    """
    currentUser = request.session['userID']
    listings = Listing.objects.all()
    closedListings = Listing.objects.filter(active=False) # Get all the closed listings
    currentUserWins = []    # Store all the closed listings where the current user is the winner

    for listing in closedListings:                   # Parse thorough all the closed listings   
        if getHighestBid(listing):                   # Some listings might be closed with no bids (Returns None)
            highestBidder = getHighestBid(listing).user.id  # Get the user id of the highest bidder)
            if currentUser == highestBidder:             # Check if the current user is the highest bidder   
                currentUserWins.append(listing)          # Add the winning listing to the list

    return currentUserWins


class ListingForm(forms.Form):
    title = forms.CharField(
                    label="",   # Need empty label even when using placeholder
                    widget=forms.TextInput(attrs={'placeholder': 'Title'}),
                    max_length=30)
    description = forms.CharField(
                    label="",
                    widget=forms.Textarea(attrs={'placeholder': 'Description (Optional)'}), 
                    max_length=280, 
                    required=False)
    starting_bid = forms.DecimalField(
                    label="",
                    widget=forms.NumberInput(attrs={'placeholder': 'Starting Bid'}), 
                    min_value=0, 
                    max_digits=9,
                    max_value=9999999, 
                    decimal_places=2)
    image_URL = forms.CharField(    # Same as in the model
                    label="", 
                    max_length=6000,
                    widget=forms.TextInput(attrs={'placeholder': 'Image URL (Optional)'}), 
                    required=False)   
    category = forms.ModelChoiceField(
                    label='Category (Optional)',
                    queryset=Category.objects.order_by('name').all(),
                    required=False)


#_____________________________________Create Listing_____________________________________
def create_listing(request):
    """
    This lets the user create a new listing by getting the input from the form, Django does 
    the error checking and then store it in the database.
    """
    categories = Category.objects.order_by('name').all() 

    if request.method == "POST":
        # Take the user's data submitted and save it as a form
        form = ListingForm(request.POST)   # request.POST contains the data the user submitted into the form 

        if form.is_valid():
            # Get the inputs from the form field
            title = form.cleaned_data["title"]
            description = form.cleaned_data["description"]
            starting_bid = form.cleaned_data["starting_bid"]
            image_URL = form.cleaned_data["image_URL"]
            category = form.cleaned_data["category"]

            # Store them in the database
            listing = Listing()
            listing.title = title
            listing.description = description
            listing.starting_bid = starting_bid
            listing.image_URL = image_URL
            
            if category:    # Check if user provided a category before accessing the Category model
                listing.category = Category.objects.get(name=category)
            
            listing.seller = User.objects.get(pk=request.session["userID"])
            listing.creation_date = currentTime()
            listing.save()

        else: # Render the page back with the user's form if form is not valid
            return render(request, "commerce/create-listing.html", {
                "categories": categories,
                "create_listing_form": form,     # Send the form back to the user to see their inputs
                "create_listing_form": ListingForm()
            })

        # Redirect to the created listing by passing the argument list's id as a tuple
        return HttpResponseRedirect(reverse("commerce:listing", args=(listing.id,)))

    # Method was GET
    else:
        return render(request, "commerce/create-listing.html", {
            "categories": categories,
            "create_listing_form": ListingForm()
        })       
    

#_____________________________________Listing Page_____________________________________
@login_required(login_url='listing-normal')    # redirect when user is not logged in (check settings)
def listing_page(request, listing_id): 
    """
    This displays the listing's page the user clicked on or was redirected to.
    """
  
    # Check if the user already has the item saved in the watchlist
    currentUser = User.objects.get(pk=request.session["userID"]) # Get the current user object
    userWatchlist = currentUser.user_watchlist.all()  # Get all current user's items using related name 

    watchlist_btn = "add_watchlist"
    inWatchlist = False
    error = ""
    success = ""

    # Get the current listing object befor the post method is requested
    currentListing = Listing.objects.get(pk=listing_id)
    highestBid = getHighestBid(currentListing)  # Get the highest bid for the current listing

    comments = currentListing.listing_comments.all()

    for item in userWatchlist:
        if item.listing.id == listing_id:
            inWatchlist = True
            watchlist_btn = "remove_watchlist"
            instance = Watchlist.objects.filter(    # Create an instance if user wants to remove the item later
                            user=currentUser
                        ).filter(
                            listing=currentListing  
                        )
        
    # Let user add the item to their "Watchlist", if already added, the user should be able to remove it
    
    if request.method == "POST":

        # Add or remove item from watchlist (based on button name)
        if request.POST.get("add_watchlist"):               # Check if "add_watchlist" button was pressed
            addToWatchlist(currentUser, currentListing)     # Add current listing to watchlist
            return HttpResponseRedirect(reverse("commerce:listing", args=(listing_id,)))
        
        elif request.POST.get("remove_watchlist"):          # Watchlist btn is set to remove
            instance.delete()                               # Delete the item from the watchlist model.
            return HttpResponseRedirect(reverse("commerce:listing", args=(listing_id,)))

        # User wants to bid 
        elif request.POST.get("place_bid_btn"):                  # Check if place bid button was pressed
            if not request.POST["bid_amount"]:                   # Check if bid value is empty
                error = "No bid was entered"
            else:
                new_bid = float(request.POST["bid_amount"])      # Cast string input to a float

                # Bid must be as large as the starting bid or greater than any other bids
                if currentListing.current_bid == 0 and new_bid < currentListing.starting_bid: # Check for first bid
                    error = f"Bid of ${new_bid} is lower than the starting bid"
                elif new_bid <= currentListing.current_bid:
                    error = f"Bid of ${new_bid} is not higher than the current bid"
                else:                                  # Add the new bid and return the highest bid before rendering   
                    highestBid = addNewBid(new_bid, currentListing, currentUser)
                    success = "You are the highest bidder" 
                    
            return render(request, "commerce/listing.html", {
                "currentUser": currentUser,
                "listing": currentListing,
                "inWatchlist": inWatchlist,
                "watchlist_btn": watchlist_btn,
                "highestBid": highestBid,
                "comments": comments,
                "error": error,
                "success": success,
            })
        
        # Closing the listing (and make the highest bidder the winner)
        elif request.POST.get("close_listing_btn"):                 # Check if close listing button was pressed
            currentListing.active = False
            currentListing.save()
            allWatchlists = currentListing.listing_watchlist.all()  # Delete the listing from all watchlists
            allWatchlists.delete()
            return HttpResponseRedirect(reverse("commerce:listing", args=(listing_id,)))

        # Add comments to the listing
        elif request.POST.get("comment_btn"):                   # Check if comment button was pressed
            newComment = request.POST.get("comment")            # Get the comment when "Post Comment" was pressed
            addComment(currentUser, currentListing, newComment) # Save the comment in the database
            return render(request, "commerce/listing.html", {   # Render the page with the new comment
                "currentUser": currentUser,
                "listing": currentListing,
                "inWatchlist": inWatchlist,
                "watchlist_btn": watchlist_btn,
                "highestBid": highestBid,
                "comments": comments,
            })

    # Method was GET
    else:
        return render(request, "commerce/listing.html", {
            "currentUser": currentUser,
            "listing": currentListing,
            "inWatchlist": inWatchlist,
            "watchlist_btn": watchlist_btn,
            "highestBid": highestBid,
            "comments": comments,
        })


def listing_normal(request):
    """
    Render this version of the listing page if user is not Logged in.
    """
    listing_id = getListingIdFromURL(request)
    listing = Listing.objects.get(pk=listing_id)
    highestBid = getHighestBid(listing)
    comments = listing.listing_comments.all()
    return render(request, "commerce/listing-normal.html", {
        "listing": listing,
        "highestBid": highestBid,
        "comments": comments,
    })


def getListingIdFromURL(request):
    request = str(request)                  # returns (type string): <WSGIRequest: GET '/normal-listing?next=/listing/13'>
    request = request.replace("'>", '')     # Remove '> from the string (chars after listing's id)
    request = request.split('/')            # Create a list with items separated by /
    return int(request[-1])                 # Return the last item in the list (listing's id) and convert it to an integer


#_____________________________________Categories_____________________________________
def categories(request):
    """
    Renders the categories page.
    """
    categories = Category.objects.order_by('name').all()
    return render(request, "commerce/categories-list.html", {
        "categories": categories # Pass the Category QuerySet
    })

    
def category(request, name):
    """
    Render a page similar to index that contains all the listing belonging to a similar category.
    """
    category = Category.objects.get(name=name)  # Get the Category QuerySet with the specific category name

    # Get all the listings that relate to the current category via the foreign key related name "list_category"
    listings = category.list_category.all()

    # Show the index page with only the active listings for the selected category
    return render(request, "commerce/index.html", {
        "page": "category",
        "category": name,
        "listings": listings
    })


#_____________________________________Watchlist_____________________________________
@login_required(login_url='login')  # Redirect users to login if not logged in
def watchlist(request):
    """
    Renders the watchlist page with each user's saved listing.
    """
    currentUser = User.objects.get(pk=request.session["userID"])   # Get the user object
    watchlist = currentUser.user_watchlist.all()   # Get all the user's watchlist items                
    return render(request, "commerce/watchlist.html", {
        "watchlist": watchlist
    })


def login_view(request):
    if request.method == "POST":

        # Attempt to sign user in
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)

        # Check if authentication successful
        if user is not None:
            login(request, user)
            
            request.session["userID"] = user.id              # Save the user's id in the session
            return HttpResponseRedirect(reverse("commerce:index"))
        else:
            return render(request, "commerce/login.html", {
                "message": "Invalid username and/or password."
            })
    else:
        return render(request, "commerce/login.html")


def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("commerce:index"))


def register(request):
    if request.method == "POST":
        username = request.POST["username"]
        email = request.POST["email"]

        # Ensure password matches confirmation
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        if password != confirmation:
            return render(request, "commerce/register.html", {
                "message": "Passwords must match."
            })

        # Attempt to create new user
        try:
            user = User.objects.create_user(username, email, password)
            user.save()
        except IntegrityError:
            return render(request, "commerce/register.html", {
                "message": "Username already taken."
            })
        login(request, user)
        request.session["userID"] = user.id              # Save the user's id in the session
        return HttpResponseRedirect(reverse("commerce:index"))
    else:
        return render(request, "commerce/register.html")


#_______________________________________________________________Helper functions
def addComment(user, listing, newComment):
    """
    Add a new comment to the current listing.
    """
    comment = Comment()
    comment.user = user
    comment.listing = listing
    comment.comment = newComment
    comment.date = currentTime()
    comment.save()
    return


def currentTime():
    """
    Get the current time and format it to EST as Jan 01, 2021, 24:00.
    """
    now = datetime.now(timezone("US/Eastern"))
    return now.strftime("%B %d, %Y, %H:%M")


def getHighestBid(listing):
    """
    Return the listing with the highest bid amount.
    """
    currentBids = listing.listing_bid.all() # Get all the bids of a current listing
    return currentBids.order_by('-bid_amount').first()  # Get the first bid when ordering in decreasing (-) order


def addToWatchlist(user, listing):
    """
    Add a row with an user and a listing id to the watchlist table.
    """
    watchlist = Watchlist()         # Create a watchlist object
    watchlist.user = user           # Add the user to the watchlist
    watchlist.listing = listing     # Add the listing to the watchlist
    watchlist.save()
    return


def addNewBid(new_bid, currentListing, currentUser):
    """
    Add the new bid to the Bid table.
    """
    currentListing.current_bid = new_bid                # Add the new bid as the current bid
    number_of_bids = currentListing.number_of_bids      # Get the total number of bids for the listing (default 0)
    number_of_bids += 1                                 # Increment number of bids
    currentListing.number_of_bids = number_of_bids
    currentListing.save()                               

    bid = Bid()                     # Create the bid object
    bid.user = currentUser          # Add the current user to the Bid table
    bid.listing = currentListing    # Add the current listing on the same row
    bid.bid_amount = new_bid        # Add the new bid amount
    bid.save()
    return getHighestBid(currentListing)

