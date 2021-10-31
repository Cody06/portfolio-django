from django.db import models

# Import the following:
from landing_page.models import User

# Create your models here.

# Add a class for each board
class Board(models.Model):
	creator = models.ForeignKey(User, on_delete=models.CASCADE, related_name='boards')	# related name: User.maps
	title = models.CharField(max_length=50)
	description = models.TextField(blank=True)
	public_visibility = models.BooleanField(default=False)
	archived = models.BooleanField(default=False)
	timestamp = models.DateTimeField(auto_now_add=True)

	def serialize(self):	# This function converts the response to JSON
		return {
			'id': self.id,
			'creator': self.creator,
			'title': self.title,
			'description': self.description,
			'public_visibility': self.public_visibility,
			'archived': self.archived,
			'timestamp': self.timestamp
		}


# Add a class for each column
class Column(models.Model):
	board = models.ForeignKey('Board', on_delete=models.CASCADE, related_name='columns')	# link each column to a board
	name = models.CharField(max_length=30)

	def serialize(self):
		return {
			'id': self.id,
			'board_title': self.board.title,
			'name': self.name,
			'board_archived': self.board.archived
		}


# Add a class for each card
class Card(models.Model):
	column = models.ForeignKey('Column', on_delete=models.CASCADE, related_name='cards')
	creator = models.ForeignKey(User, on_delete=models.CASCADE, related_name='cards')
	text = models.TextField(blank=True, max_length=300)
	position = models.IntegerField(default=0)	# position in the column (used for delete and drag && drop)

	def serialize(self):
		return {
			'id': self.id,
			'column_id': self.column.id,
			'creator_username': self.creator.username,
			'text': self.text,
			'position': self.position
		}