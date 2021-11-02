from django.urls import path
from . import views

urlpatterns = [
	path('', views.index, name='index'),						# normal path
	path('guest-path', views.guest_path, name='guest-path'),		# guest path
	path('guest-view', views.guest_view, name='guest-view'),

	path('login', views.login_view, name='login'),
	path('logout', views.logout_view, name='logout'),
	path('register', views.register_view, name='register'),

	# Index page paths
	path('create-board', views.create_board, name="create-board"),
	path('board-page/<int:board_id>', views.board_page, name="board-page"),

	# Board page paths
	path('columns/<int:board_id>', views.columns, name="columns"),
	path('col-options/<int:col_id>', views.col_options, name="col_options"),
	path('cards/<int:col_id>', views.cards, name="cards"),
	path('drag_and_drop', views.drag_and_drop, name="drag_and_drop")
]

app_name = 'workboard' # add this when using namespace in landing_page/urls.py