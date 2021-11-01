from django.contrib import admin

from .models import Post, Like, Follower

class PostAdmin(admin.ModelAdmin):
	list_display = ("id", "creator", "post", "timestamp", "likes")

class LikeAdmin(admin.ModelAdmin):
	list_display = ("id", "user", "post")

# Register your models here.
admin.site.register(Post, PostAdmin)
admin.site.register(Like, LikeAdmin)
admin.site.register(Follower)
