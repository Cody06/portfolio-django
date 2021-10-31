from django.contrib import admin

from .models import Board, Column, Card

class BoardAdmin(admin.ModelAdmin):
	list_display = ('id', 'creator', 'title', 'timestamp', 'public_visibility', 'archived')

class ColumnAdmin(admin.ModelAdmin):
	list_display = ('id', 'board', 'name')

class CardAdmin(admin.ModelAdmin):
	list_display =('id', 'column', 'position', 'text', 'creator')

# Register your models here.
admin.site.register(Board, BoardAdmin)
admin.site.register(Column, ColumnAdmin)
admin.site.register(Card, CardAdmin)