import json

from django.core.paginator import Paginator     # Used to show 10 posts per page
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required   # Used for #login_required
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse # Used JR for returning error/success
from django.shortcuts import render
from django.urls import reverse

from landing_page.models import User
from .models import Post, Like, Follower

from django.views.decorators.csrf import csrf_exempt   # Will try to implement csrf later

from datetime import datetime


def index(request):
    """ This renders the All Posts page """
    allPosts = Post.objects.order_by('-timestamp').all()

    # Adding the paginator - source: https://docs.djangoproject.com/en/3.0/topics/pagination/
    paginator = Paginator(allPosts, 10) # Show 10 posts per page

    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    return render(request, "social/index.html", {
        # Return posts in reverse chronological order
        "allPosts": page_obj,
        "displayPagination": areMoreThanTenItems(allPosts)
    })

#________________________________________________________GUEST
def guest_path(request):
    # Check if guest account already exists
    try:
        guest = User.objects.get(username='guest')
    except User.DoesNotExist:
        return HttpResponse("Guest account does not exist")
    login(request, guest)
    return HttpResponseRedirect(reverse('social:index'))    # ensure we redirect to the index of workboard


def profile_page(request, username):
    """ This renders the user's profile page """
    userObject = User.objects.get(username=username)    # This is the user from where the page was linked

    userPosts = Post.objects.filter(creator=userObject).order_by('-timestamp')
    paginator = Paginator(userPosts, 10)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)

    # Check if viewing a profile page not from a logged user
    if not request.user.id:     # request.user.id would return None if no user is logged in
        return render(request, "social/default-profile.html", {
            "userProfileObject": userObject,
            "userPosts": page_obj,
            "displayPagination": areMoreThanTenItems(userPosts)
        })    
    else:
        return render(request, "social/profile.html", {
            "loggedUser": request.user,
            "userProfileObject": userObject,
            "isFollowing": isFollowing(request.user.id, userObject.id),
            "userPosts": page_obj,
            "displayPagination": areMoreThanTenItems(userPosts)
        })

def isFollowing(loggedUserID, otherUserID):
    """ Check if the logged user is following the other user """
    loggedUser = User.objects.get(pk=loggedUserID)
    otherUser = User.objects.get(pk=otherUserID)
    # Return True if there is one object where the logged user is following the other user
    return Follower.objects.filter(user=loggedUser, following=otherUser).exists()

#________________________________________________________ Follow
@csrf_exempt
@login_required
def follow(request):
    return_error_if_method_not_POST(request)

    data = json.loads(request.body)
    newFollowing = data.get("newFollowing", "")

    loggedUserObject = User.objects.get(pk=request.user.id)
    otherUserObject = User.objects.get(username=newFollowing)
    # Add the new profile to the following list of the logged user
    followerModel = Follower()
    followerModel.user = loggedUserObject
    followerModel.following = otherUserObject
    followerModel.save()

    # Increment the number of followings for the logged user and the other user
    loggedUserObject.number_of_followings += 1
    loggedUserObject.save()
    otherUserObject.number_of_followers += 1
    otherUserObject.save()
    return JsonResponse({"message": "New user is followed"}, status=201)

#________________________________________________________ Unfollow
@csrf_exempt
@login_required
def unfollow(request):
    return_error_if_method_not_POST(request)

    removeFollowing = json.loads(request.body).get("removeFollowing", "")
    loggedUserObject = User.objects.get(pk=request.user.id)
    otherUserObject = User.objects.get(username=removeFollowing)

    # Delete the following link from the models
    Follower.objects.get(user=loggedUserObject, following=otherUserObject).delete()
    # Decrement the number of followers for the logged and other user
    loggedUserObject.number_of_followings -= 1
    loggedUserObject.save()
    otherUserObject.number_of_followers -= 1
    otherUserObject.save()

    return JsonResponse({"message": "User is unfollowed"}, status=201)
   

#________________________________________________________ Following page
@login_required
def following_page(request, username):
    """ This renders the page with all posts made by users that the current user follows """
    return_error_if_method_not_POST(request)

    # Get all the objects from the Follower model
    followerObjects = Follower.objects.filter(user=User.objects.get(username=username))

    # Get all the users we are following in a list
    users_we_follow = []
    for user in followerObjects:
        users_we_follow.append(user.following)

    # Get all the posts of the users we are following (many-to-many) in reverse chronological order
    users_we_follow_posts = Post.objects.filter(creator__in=users_we_follow).order_by('-timestamp')
    
    # Adding the paginator
    paginator = Paginator(users_we_follow_posts, 10)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    return render(request, "social/following.html", {
        "users_we_follow_posts": page_obj,
        "displayPagination": areMoreThanTenItems(users_we_follow_posts)
    })


#________________________________________________________ Create new post
@csrf_exempt
@login_required
def save_new_post(request):

    # Creating a new post must be via POST
    return_error_if_method_not_POST(request)

    # Get post data
    data = json.loads(request.body)
    newPost = data.get("newPost", "")  # check if this is empty

    if not newPost:
        return JsonResponse({"error": "Cannot create an empty post"}, status=400)

    # Store the post in the database
    postModel = Post()
    postModel.creator = User.objects.get(pk=request.user.id)
    postModel.post = newPost
    postModel.save()

    return JsonResponse({"message": "Post created successfully."}, status=201)

#________________________________________________________ Edit post
@csrf_exempt
@login_required
def save_edited_post(request, postID):
    return_error_if_method_not_POST(request)

    editedPost = json.loads(request.body).get("editedPost", "")

    existingPost = Post.objects.get(pk=postID)      # Update the existing post
    existingPost.post = editedPost
    existingPost.timestamp = datetime.now()         # Update the timestamp
    existingPost.save()

    return JsonResponse({"message": "Post edited successfully."}, status=201)


#________________________________________________________ Like/Unlike post
@csrf_exempt
@login_required
def like_post(request, postID):

    loggedUser = User.objects.get(pk=request.user.id)
    postObject = Post.objects.get(pk=postID)

    # Check if post is already liked by the logged user
    likedPost = Like.objects.filter(user=loggedUser, post=postObject)
    if (likedPost.exists()):
        # Remove the like
        likedPost.delete()      # Remove the like (row for user and post)
        postObject.likes -= 1   # Decrement the number of likes
        postObject.save()
    else:
        newLike = Like()
        newLike.user = loggedUser
        newLike.post = postObject
        newLike.save()
        postObject.likes += 1
        postObject.save()
    
    likes = Post.objects.get(pk=postID).likes
    # Return the number of likes
    return JsonResponse(likes, safe=False)


#________________________________________________________ Login
def login_view(request):
    if request.method == "POST":

        # Attempt to sign user in
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)

        # Check if authentication successful
        if user is not None:
            login(request, user)
            
            return HttpResponseRedirect(reverse("social:index"))
        else:
            return render(request, "social/login.html", {
                "message": "Invalid username and/or password."
            })
    else:
        return render(request, "social/login.html")

#________________________________________________________ Logout
def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("social:index"))

#________________________________________________________ Register
def register(request):
    if request.method == "POST":
        username = request.POST["username"]
        email = request.POST["email"]

        # Ensure password matches confirmation
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        if password != confirmation:
            return render(request, "social/register.html", {
                "message": "Passwords must match."
            })

        # Attempt to create new user
        try:
            user = User.objects.create_user(username, email, password)
            user.save()
        except IntegrityError:
            return render(request, "social/register.html", {
                "message": "Username already taken."
            })
        login(request, user)
        return HttpResponseRedirect(reverse("social:index"))
    else:
        return render(request, "social/register.html")

#________________________________________________________ Helper functions
def return_error_if_method_not_POST(request):
    if request.method != 'POST':
        return JsonResponse({"error": "POST request required."}, status=400)


def areMoreThanTenItems(given_list):
    """ Return a boolean value if a given list has more than 10 items (used for pagination)""" 
    return len(given_list) > 10