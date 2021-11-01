from django.db import models

from landing_page.models import User

# Create your models here.
class Post(models.Model):
    creator = models.ForeignKey(User, on_delete=models.CASCADE, related_name='posts')
    post = models.CharField(max_length=280)
    timestamp = models.DateTimeField(auto_now_add=True)
    likes = models.IntegerField(default=0)

    def serialize(self):
        return {
            'id': self.id,
            'creator': self.creator.username,
            'post': self.post,
            'timestamp': self.timestamp.strftime("%b %d %Y, %I:%M %p"),
            'likes': self.likes
        }


class Like(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='user_likes')
    post = models.ForeignKey('Post', on_delete=models.CASCADE, related_name='post_likes')


class Follower(models.Model):
    # the logged user
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='follower')     
    # the other user
    following = models.ForeignKey(User, on_delete=models.CASCADE, related_name='following')