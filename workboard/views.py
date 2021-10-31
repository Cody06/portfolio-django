from django.shortcuts import render

# Import the following:
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.urls import reverse
from django.views.decorators.csrf import csrf_exempt

import json

from landing_page.models import User
from .models import Board, Column, Card


# Create your views here.
def index(request):
	# This is the main page as per the project
	print("- workboard index()")
	print(request.user)
	# Get all personal boards if user is logged in
	return HttpResponse("- workboard home Original")

#________________________________________________________GUEST
def guest_path(request):
	print("- workboard guest_view()")
	# Check if guest account already exists
	try:
		guest = User.objects.get(username='guest')
		print(" - Guest account exists")
	except User.DoesNotExist:
		print(" - Guest account does NOT exist")
		return HttpResponse("Guest account does not exist")
	login(request, guest)
	return HttpResponseRedirect(reverse('workboard:guest-view'))	# ensure we redirect to the index of workboard

def guest_view(request):
	if request.user.is_authenticated:
		logged_user = User.objects.get(pk=request.user.id)
		personal_boards = Board.objects.filter(creator=logged_user, archived=False)
		archived_boards = Board.objects.filter(creator=logged_user, archived=True)
		return render(request, 'workboard/index.html', {
			'personal_boards': personal_boards,
			'archived_boards': archived_boards
		})
	else:
		return HttpResponse("Could not show guest view")
#________________________________________________________BOARD
@login_required
def create_board(request):
	# Get the user Board inputs
	board_title = request.POST['board_title']
	board_description = request.POST['board_description']
	# public_visibility = request.POST.get("visibility") # true means public visibility (using - or _ returns None)

	# Store them in the database
	new_board = Board()
	new_board.creator = User.objects.get(pk=request.user.id)
	new_board.title = board_title
	new_board.description = board_description
	#new_board.public_visibility = public_visibility
	new_board.save()
	
	# Get the new board's id
	board_id = new_board.id

	# Redirect to the new board (passing board_id argument to reverse)
	return HttpResponseRedirect(reverse('workboard:board-page', kwargs={'board_id':board_id}))


@csrf_exempt
@login_required
def board_page(request, board_id):
	if request.method == "GET":
		return render(request, 'workboard/board-page.html', {
			'board_obj': Board.objects.get(pk=board_id)
		})
	elif request.method == 'POST':
		data = json.loads(request.body)
		new_title = data['new_title']

		board = Board.objects.get(pk=board_id)
		board.title = new_title
		board.save()

		return JsonResponse({'message': f"Board title updated: {new_title}"}, status=201)
	elif request.method == "PUT":
		data = json.loads(request.body)

		board = Board.objects.get(pk=board_id)
		board.archived = data['archive_board']	# will pass either True or False to archive
		board.save()
		return JsonResponse({'message': f"Board archived: {data['archive_board']}"}, status=201)
	else:
		return JsonResponse({'error': "GET OR PUT request required"}, status=400)

#________________________________________________________COLUMNS
@csrf_exempt
@login_required
def columns(request, board_id):
	if request.method == 'GET':
		columns = Column.objects.filter(board=Board.objects.get(pk=board_id))
		return JsonResponse([column.serialize() for column in columns], safe=False)

	elif request.method == 'POST':
		data = json.loads(request.body)
		new_column_name = data['column_name']
		column = Column()
		column.board = Board.objects.get(pk=board_id)
		column.name = new_column_name
		column.save()
		return JsonResponse(column.serialize(), safe=False)		# return the column that was saved

	else:
		return JsonResponse({'message': 'Arrived via PUT'}, status=201)

@csrf_exempt
@login_required
def col_options(request, col_id):
	if request.method == 'PUT':
		# Check if we edit or delete the column
		data = json.loads(request.body)
		action = data['action']
		column = Column.objects.get(pk=col_id)
		
		if (action == 'edit'):
			column.name = data['new_col_name']
			column.save()
			print(f"New column name : {data['new_col_name']}")
			return JsonResponse({'message': 'Column was edited successfully'}, status=201)
		elif (action == 'delete'):
			column.delete()
			return JsonResponse({'message': 'Column was deleted successfully.'}, status=201)
		else:
			return JsonResponse({'error': 'Cannot edit or delete column.'}, status=400)
	else:
		return JsonResponse({'error': 'GET or PUT request required.'}, status=400)

#________________________________________________________CARDS
@csrf_exempt
@login_required
def cards(request, col_id):
	if request.method == 'GET':		# get the cards from the database
		# Get the <QuerySet [<Card object>, <Card object>] in ascending order, ("-position") would be for descending
		cards_for_column = Card.objects.filter(column=Column.objects.get(pk=col_id)).order_by("position")
		return JsonResponse([card.serialize() for card in cards_for_column], safe=False) # Return an array of JASON data

	elif request.method == 'POST': 		# save the card in the database
		new_card_text = json.loads(request.body)['new_card_text']

		# get the number of cards in that column to know the positioning of the card
		column_parent = Column.objects.get(pk=col_id)
		cards_counter = Card.objects.filter(column=column_parent).count()
		
		new_card = Card()
		new_card.column = column_parent
		new_card.creator = User.objects.get(pk=request.user.id)
		new_card.text = new_card_text
		new_card.position = cards_counter	# position is the index of the card in the column (0 cards = position 0)
		new_card.save()
		return JsonResponse(new_card.serialize(), safe=False)

	elif request.method == 'PUT':		# edit or delete card (we are passing the card_id)
		data = json.loads(request.body)
		action = data['action']
		card = Card.objects.get(pk=col_id)	# we are actually passing the card_id
		
		if (action == 'edit'):
			card.text = data['new_card_note']
			card.save()
			return JsonResponse({'message': 'Card edited successfully.'}, status=201)
		
		elif (action == 'delete'):	# Check the position of the card we are deleting
			column_parent = card.column
			cards_counter = Card.objects.filter(column=column_parent).count()

			if (card.position < cards_counter - 1):	 # e.g. col has 3 cards, last card's position is 2 (starts from 0)
				print(f" -- we are deleting NOT the last card")
				following_cards = Card.objects.filter(column=column_parent,position__gt=card.position)	# greater than
				for next_card in following_cards:	# change position of all following cards by - 1
					next_card.position -= 1
					next_card.save()
			else:
				print(" -- we are deleting the last card") # no change in cards position

			card.delete() # delete card in any case	
			return JsonResponse({'message': 'Card deleted successfully.'}, status=201)
		else:
			return JsonResponse({'error': 'Cannot edit or delete card'}, status=400)
	else:
		return JsonResponse({'error': "Cannot access cards"})

@csrf_exempt
def drag_and_drop(request):
	if request.method == 'PUT':
		print("User dropped a new card")
		data = json.loads(request.body)
		print(data)

		moved_card = Card.objects.get(pk=data['drag_card_id'])	# get the card we moved
		old_column = moved_card.column   						# get it's original column
		new_column = Column.objects.get(pk=data['new_col_id'])	# get the new column
		next_card = data['next_card_id']						# get the following card's id (-1 if no following card)

		old_position = moved_card.position
		last_pos_old_column = Card.objects.filter(column=old_column).count() - 1  # e.g. [a, b, (c)] - count=3 position=2 
		new_position = None

		if (next_card != -1):								# if there is a following card (NOT -1)
			next_card = Card.objects.get(pk=next_card)		# get that card
			new_position = next_card.position 				# get its position that will be later taken by the moved card

		print(f"moved card: {moved_card}")
		print(f"old column: {old_column}")
		print(f"new column: {new_column}")
		print(f"next card: {next_card}")


		# 1. Keeping card in the SAME column
		if (new_column == old_column):
			print("- SAME col")
			# 1.a. Card dropped in the SAME spot
			# 1.a.i. Card kept at the END of the list (also applies to list with one element)
			if (next_card == -1 and old_position == last_pos_old_column):
				print("-- SAME col STAYED END list") 
				return JsonResponse({'move': 
					f"SAME col STAYED END list -> {moved_card} | new col:{new_column}, new pos:{moved_card.position}"}, 
					status=201)
			
			# 1.a.ii. Card kept SAME SPOT (beginning or middle of the list with other cards)
			elif (next_card != -1 and old_position == new_position - 1):
				print("-- SAME col SAME spot")
				return JsonResponse({'move': 
					f"SAME col SAME spot -> {moved_card} | new col:{new_column}, new pos:{moved_card.position}"}, 
					status=201)
			
			# 1.b. Card dropped in DIFFERENT spot (still same column)
			# 1.b.i. Card dropped at the END of the list
			elif (next_card == -1):
				print("-- SAME col MOVED END list")
				following_cards = Card.objects.filter(column=old_column, position__gt=old_position)
				for card in following_cards:	# get all the following cards after the old position -> ]old_pos, ...]
					card.position -= 1 			# move their position up the list
					card.save()
				moved_card.position = last_pos_old_column # get the last position in the list
				moved_card.save()
				return JsonResponse({'move': 
					f"""SAME col MOVED END list -> {moved_card} | new col:{new_column}, new pos:{
				    Card.objects.get(pk=moved_card.id).position}"""}, status=201)
			
			# 1.b.ii. Card dropped BEFORE another card (beginning or middle of the list with other cards)
			else:	# next_card != -1
				
				# 1.b.ii.j Card moved UP the list
				if (new_position < old_position): # moved card had a lower position number
					print("-- SAME col UP the list")
					# Get all the cards between the new position and old position -> [new_pos, old_pos[
					following_cards = Card.objects.filter(column=old_column, 
														  position__gte=new_position, position__lt=old_position, )
					for card in following_cards:
						card.position += 1 		# move their position down the list
						card.save()
					moved_card.position = new_position
					moved_card.save()
					return JsonResponse({'move': 
						f"""SAME col UP the list -> {moved_card} | new col:{new_column}, new pos:{
						Card.objects.get(pk=moved_card.id).position}"""}, status=201)
				
				# 1.b.ii.jj. Card moved DOWN the list
				else:
					print("-- SAME col DOWN the list")
					# Get all the cards between the old position and the new position -> ]old_pos, new_nos[
					following_cards = Card.objects.filter(column=old_column, 
						                                  position__gt=old_position, position__lt=new_position)
					for card in following_cards:
						card.position -= 1  	# move their position up the list
						card.save()
					moved_card.position = new_position - 1 	# new_position is the position of the next card
					moved_card.save()
					return JsonResponse({'move': 
						f"""SAME col DOWN the list -> {moved_card} | new col:{new_column}, new pos:{
						Card.objects.get(pk=moved_card.id).position}"""}, status=201)

		# 2. Moving card in DIFFERENT column
		else:
			print("- DIFFERENT col")
			new_column_length = Card.objects.filter(column=new_column).count() # prior to dropping the card
			print(f"New column has {new_column_length} cards")

			# 2.a. Card dropped at the end of the list (different column)
			if (next_card == -1):
				moved_card.column = new_column
				moved_card_old_position = moved_card.position 	# need this to get all the following cards from old col
				# the length prior to the drop is the index of the moved card
				moved_card.position = new_column_length # e.g. [a, b, c, (d)] - new_col_length=3, index_of_d=3
				moved_card.save()
				old_col_cards = Card.objects.filter(column=old_column, position__gt=moved_card_old_position)
				for card in old_col_cards:
					card.position -= 1  # move the following cards from the old column up the list
					card.save()
				return JsonResponse({'move': 
					f"""DIFFERENT col EMPTY list -> {moved_card} | new col:{new_column}, new pos:{
					Card.objects.get(pk=moved_card.id).position}"""}, status=201)

			# 2.b. Card dropped before another card (different column)
			else:
				moved_card.column = new_column
				moved_card.position = new_position
				# Get all the cards after and including the new_position -> [new_pos, ...]
				following_cards = Card.objects.filter(column=new_column, position__gte=new_position)
				for card in following_cards:
					card.position += 1 	# move the cards down the list
					card.save()
				moved_card.save() 	# save the moved card here to not be included in the following cards
				return JsonResponse({'move': 
					f"""DIFFERENT col BEFORE another card -> {moved_card} | new col:{new_column}, new pos:{
					Card.objects.get(pk=moved_card.id).position}"""}, status=201)
	else:
		return JsonResponse({'error': "Could not update the card's position"}, status=400)

def logout_view(request):
	logout(request)
	return HttpResponseRedirect(reverse('index'))	# Redirect to landing page