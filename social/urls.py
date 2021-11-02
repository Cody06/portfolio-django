from django.urls import path
from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path('guest-path', views.guest_path, name='guest-path'),

    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register"),
    
    path("profile-page/<str:username>", views.profile_page, name="profile-page"),
    path("following/<str:username>", views.following_page, name="following"),

    # API Routes
    path("save-new-post", views.save_new_post, name="save-new-post"),
    path("save-edited-post/<int:postID>", views.save_edited_post, name="save-edited-post"),
    path("follow", views.follow, name="follow"),
    path("unfollow", views.unfollow, name="unfollow"),
    path("like-post/<int:postID>", views.like_post, name="like-post")
]

app_name = 'social'
