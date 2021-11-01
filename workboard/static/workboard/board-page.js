document.addEventListener('DOMContentLoaded', function() {
	load_board();
	document.querySelectorAll('.add-col-form-btn').forEach(button => {
		button.onclick = add_col_form
	});

	const EDIT_BOARD_BTN = document.querySelector('.edit-board-btn');
	if ( EDIT_BOARD_BTN !== null) { EDIT_BOARD_BTN.addEventListener('click', show_edit_title) }

	const CANCEL_TITLE_EDIT = document.querySelector('#cancel-title-edit');
	if (CANCEL_TITLE_EDIT !== null) {
		CANCEL_TITLE_EDIT.addEventListener('click', () => {
			console.log("CANCEL TITLE EDIT CLICKED")
			document.querySelector('#editing-title').style.display = "none";
			document.querySelector('#default-board-header').style.display = "block";
		});
	}

	document.querySelectorAll('.archive-btns').forEach(function(button) { // archive/unarchive board
		button.onclick = function() {
			const PATH = window.location.pathname;						// get the board's id from the URL path
			const BOARD_ID = PATH.substring(PATH.lastIndexOf('/') + 1);

			const archive_board = button.dataset.archived
			fetch(`/workboard/board-page/${BOARD_ID}`, {
				method: 'PUT',
				body: JSON.stringify({
					archive_board: archive_board
				})
			})
			.then(response => response.json())
			.then(result => {
				location.reload();	// reload the page
			});
		}
	});
//	close_dropdown();
});

function show_edit_title() {
	document.querySelector('#editing-title').style.display = "block";
	document.querySelector('#default-board-header').style.display = "none";
}

function save_edited_title(board_id) {
	const UPDATED_TITLE = document.querySelector('#updated-title').value;
	fetch(`/workboard/board-page/${board_id}`, {
		method: 'POST',
		body: JSON.stringify({
			new_title: UPDATED_TITLE
		})
	})
	.then(response => response.json())
	.then(message => {
		console.log(message);
	});
	document.querySelector('#board-title').innerHTML = UPDATED_TITLE;
	document.querySelector('#updated-title').value = '';			// clear user input after saving
	document.querySelector('#editing-title').style.display = "none";
	document.querySelector('#default-board-header').style.display = "block";
}

function set_drag_and_drop(start) {
	setTimeout(drag_and_drop, 500);	// This should run 0.5 seconds after fetch is done	
}

function drag_and_drop() { 
	/* Drag and drop cards anywhere on the board ( inspiration: https://www.youtube.com/watch?v=jfYWwQrtzzY ) */
	console.log("-------- drag_and_drop() {");
	// 1. Get all the elements we can drag by their class draggable (getElementByClassName() gets updated dynamically)
	let draggables = document.getElementsByClassName('draggable');	// returns a live HTML collection of elements
	// 2. Get all the columns where we can drop the cards
	let containers = document.getElementsByClassName('col-div');

	// 3. Add an event listener to each card for when we drag (pick it up)
	Array.prototype.forEach.call(draggables, (draggable) => {
		draggable.addEventListener('dragstart', () => {		// start dragging the card
			draggable.classList.add('dragging');			// give it the class 'dragging' to select it later
		});
		// Add an event listener when we drop the gard
		draggable.addEventListener('dragend', () => {		// stopped dragging the card
			console.log(`	-X END - ${draggable.id}`);
			draggable.classList.remove('dragging');			// remove the class 'dragging'
		
			// get the dragged card's id and format it
			drag_card_id = parseInt(draggable.id.slice(8)); // e.g. card-id-01 (return 01 since start from index 8)

			// get the new column's id
			new_col_id = parseInt(draggable.parentNode.id.slice(7))	// e.g. col-id-01

			// get the following card's id where we dropped the dragged card
			next_card_id = -1		// assume no following cards -1 (dropped card ended at the end of the list)
			if (draggable.nextSibling != null) {							// if there is a following card
				next_card_id = parseInt(draggable.nextSibling.id.slice(8));	// get the its id
			}
			// send to API to save the positions in the databse
			fetch('/workboard/drag_and_drop', {
				method: 'PUT',
				body: JSON.stringify({
					drag_card_id: drag_card_id,
					new_col_id: new_col_id,
					next_card_id: next_card_id
				})
			})
			.then(response => response.json())
			.then(result => {
				console.log(result);	// show the result of the movement
			});
		});
	});

	// 4. Add an event listener to each column for when we hover the mouse over
	Array.prototype.forEach.call(containers, (container) => {
		container.addEventListener('dragover', event => {
			console.log(`	..dragOver - ${container.id}`);
			// event.preventDefault()	// no need to use it (usually not able to drop in another html element)
			
			const draggable = document.querySelector('.dragging'); // get the card we are dragging (only one has this class)

			// get the card below the mouse's Y position
			const afterElement = getDragAfterElement(container, event.clientY);  

			if (afterElement == null) {				// no following-card, drop it at the end of the column
				container.appendChild(draggable);
			} else {								// drop the card before the next card (or between two cards)
				container.insertBefore(draggable, afterElement);
			}
		})
	});
}

function getDragAfterElement(container, mouse_pos_y) {
	/* This function retrieves the card below our mouse position, if there is any */
	// get all the cards, except the one we are dragging (:not(.dragging)) 
	// convert all the elements into an array using the spread operator
	const draggableElements = [...container.querySelectorAll('.draggable:not(.dragging)')] // spread operator
	
	/* This will determine which element is exactly below our mouse cursor
	*  reduce(closest, child):
	*		closest = value we are reducing down to (element we are closest to below mouse cursor)
	*		child = each child of the container we are inside
	*/
	return draggableElements.reduce((closest, child) => {
		// console.log(`			reduce()`);
		const box = child.getBoundingClientRect();
		// offset is the distance between the center of our box (box.height/2) and the mouse cursor
		const offset = mouse_pos_y - box.top - box.height/2; 
		// console.log(offset);	// negative number when above an element, positive when below

		if (offset < 0 && offset > closest.offset) {
			return { offset: offset, element: child };
		} else {	
			return closest;
		}
	}, { offset: Number.NEGATIVE_INFINITY }).element; // .element to reduce only the element and not also the offset
}

//function close_dropdown() {
	/* Close dropdown menu when if user clicks outside of it */
//	window.onclick = function(event) {
//		if (!event.target.matches('.dropbtn')) {	// if user clicks outside the dropdown
//			let dropdowns = document.getElementsByClassName("dropdown-content");
//			for (let i = 0; i < dropdowns.length; i++) {
//	  			let openDropdown = dropdowns[i];
// #### CORRECT THIS ####################################################################
//	  			if (openDropdown.classList.contains('show')) { // #### REWRITE THIS
//	    			openDropdown.classList.remove('show');
//	  			}
//			}
//		}
//	}
//}

function load_board() {
	/* Create the board's columns and cards */
	const PATH = window.location.pathname;						// get the board's id from the URL path
	const BOARD_ID = PATH.substring(PATH.lastIndexOf('/') + 1); // go 1 index after the last '/' in the URL

	// Get all the columns from the server
	fetch(`/workboard/columns/${BOARD_ID}`)		// get all the columns of the board via GET
	.then(response => response.json())			// convert response into JSON
	.then(columns => {							// provide the array of columns inside the variable columns

		if (columns.length == 0) {		// check if it's an empty board
			// Get the archive's button dataset: Unarchvied = False (button holds what the board should be after press)
			let archived_btn = document.querySelector('.archive-btns').dataset.archived
			let archived = (archived_btn === 'False')	// switch false to true and vice-versa
			is_board_archived(archived);
			show_empty_board_msg();
		}
		else {							// board already contains columns
			const COLS_DIV = document.querySelector('#cols-div');

			for (let i = 0; i < columns.length; i++) {				// add all the existing columns
				const COL_DIV = create_col_HTML(columns[i]['id'], columns[i]['name']);
				COLS_DIV.appendChild(COL_DIV);

				fetch(`/workboard/cards/${columns[i]['id']}`)	// add all the existing cards
				.then(response => response.json())
				.then(cards => {	// cards holds an array of JSON data
			
					for (let j = 0; j < cards.length; j++) {

						// Cards are only being created if they already exists (we do not create empty divs)
						let card_div = create_card_HTML(cards, j);
						COL_DIV.appendChild(card_div);
					}		
					is_card_archived(columns[0]['board_archived']);
				});
			}
			show_add_col_btn_lg();	// allow the possibility to add columns
			is_board_archived(columns[0]['board_archived']); // first column contains a boolean value
			
		}
		return 0;
	});
	// Lines here will run before the fetch returns a response
}

function is_card_archived(bool) {
	if (bool) {
		document.querySelectorAll('.dropbtn').forEach(function(button) {
			button.disabled = true;
		})
	}
}
function is_board_archived(bool) {
	/* Check if we display an archived or unarchived board */
	if (bool) {	// board is archived
		console.log("board is archived");
		// disable all buttons except the archive btns
		document.querySelectorAll('button:not(.archive-btns)').forEach(function(button) {
			button.disabled = true;
			button.style.backgroundColor = "light";
		});

		document.querySelectorAll('.draggable').forEach(function(draggable) {
			draggable.setAttribute('draggable', false);	// prevent drag and drop
			draggable.classList.remove('draggable');	// prevent cursor to change when hovering over
		})
		document.querySelector('body').style.color = "grey";

		document.querySelector('.archive-btns').style.display = 'block';
		
		const TITLE = document.querySelector('#board-title').innerHTML;
		let prefix = "(Archived) ";
		document.querySelector('#board-title').innerHTML = prefix.concat(TITLE);
	
	
	} else {	// board is unarchived
		console.log("board is unarchived");
		set_drag_and_drop();	// allow drag and drop

		const BOARD_HEADER = document.querySelector('#board-header');
		BOARD_HEADER.addEventListener('mouseover', show_buttons);
		BOARD_HEADER.addEventListener('mouseout', hide_buttons);		
	}
}

function show_buttons() {
	document.querySelector('.archive-btns').style.display = 'block';
	document.querySelector('.edit-board-btn').style.display = 'block';
}

function hide_buttons() {
	document.querySelector('.archive-btns').style.display = 'none';
	document.querySelector('.edit-board-btn').style.display = 'none';
}
//______________________________________________COLUMNS
function add_col_form() {
 	/* Show the add column form */
	hide_empty_board_msg();
	show_add_column_form();
	blur_background();	

	// Create the column and save it in the database
	document.querySelector('#create-col-form').addEventListener('submit', save_col);	
}

function save_col(event){
	/* This is where we create the column and save it in the database */
	event.preventDefault();										// prevent form from submitting
	const PATH = window.location.pathname;	
	const BOARD_ID = PATH.substring(PATH.lastIndexOf('/') + 1); // go 1 index after the last '/' in the URL
	const COLUMN_NAME = document.querySelector('#col-name-input').value;
	
	fetch(`/workboard/columns/${BOARD_ID}`, {		// send the column name to the server
		method: 'POST',
		body: JSON.stringify({
			column_name: COLUMN_NAME
		})
	})
	.then(response => response.json())
	.then(column => {	// Return the added column so we can have the 'id'
		
		const COLS_DIV = document.querySelector('#cols-div');	// display the new column
		const NEW_COL_DIV = create_col_HTML(column['id'], COLUMN_NAME);
		COLS_DIV.appendChild(NEW_COL_DIV);

		close_form();											// close the form
		document.querySelector('#col-name-input').value = '';	// clear the user text
		show_add_col_btn_lg();									// show the large "+ Add column" button
		set_drag_and_drop();	// Add the possibility to drag to the new card
		return 0;
	});	
}

function create_col_HTML(col_id, col_name) {
	/* Dynamically creates the column's HTML after user submits the column creation form */
	const COL_DIV = document.createElement('div');
	COL_DIV.id = `col-id-${col_id}`;
	COL_DIV.className = 'col-div';
	COL_DIV.innerHTML = `
		<h5 id="col-header-${col_id}">${col_name}</h5>
		
		<div class="col-buttons">
			<button onclick="add_card(${col_id})" title="Add a card to this column">+</button>
		
			<div class="dropdown">
			 	<button onclick="show_dropdown_col(${col_id})" class="dropbtn">&#183;&#183;&#183;</button>
			 	
			 	<div id="dropdown-col-${col_id}" class="dropdown-content">
			 		<button onclick="col_options(${col_id}, 'edit')">Edit column</button><br>
					<button onclick="col_options(${col_id}, 'delete')">Delete column</button>
				</div>
			</div>
		</div>
		
		<div class="cards-div"></div>
	`;
	return COL_DIV;
}
// ###### THIS MIGHT BE THE PROBLEM WITH THE DROPDOWN MENU (check landing_page/index.js)
function show_dropdown_col(col_id) {
	console.log("#### SHOW DROP DOWN COL - START");
	let dropdown = document.querySelector(`#dropdown-col-${col_id}`);
	console.log(dropdown);
	console.log(`display: ${dropdown.style.display}`);

	if (dropdown.style.display === 'none') {
		console.log('no display')
		dropdown.style.display = 'block'
	}
	else if (dropdown.style.display === "") {
		console.log('empty-string;');
		dropdown.style.display = 'block';
	}
	else {
		console.log('block display');
		dropdown.style.display = 'none';
	}
	console.log(dropdown);
	console.log("#### SHOW DROP DOWN COL - END");
	//document.querySelector(`#dropdown-col-${col_id}`).classList.toggle('show');
}

function col_options(col_id, action) {
	/* Either edit or delete the column */
	const COL_NAME = document.querySelector(`#col-header-${col_id}`).innerHTML; // get the existing column's name
	if (action == 'edit') {
		document.querySelector('#edit-col-popup').style.display = 'block';			// show edit popup
		blur_background();
		document.querySelector('#edit-col-header').innerHTML = `Edit: ${COL_NAME}`;	// add some text to the popup	
		document.querySelector('#edit-col-name-input').placeholder = COL_NAME;		// add existing column name

		document.querySelector('#edit-col-form').addEventListener('submit', function() {
			event.preventDefault();													// prevent page refresh
			const EDITED_COL_NAME = document.querySelector('#edit-col-name-input').value
			fetch(`/workboard/col-options/${col_id}`, {										// save the edited column name
				method: 'PUT',
				body: JSON.stringify({
					action: 'edit',
					new_col_name: EDITED_COL_NAME
				})
			})
			.then(response => response.json())
			.then(column => { 														// update the html column
				document.querySelector(`#col-header-${col_id}`).innerHTML = EDITED_COL_NAME; // update the col header
				close_form();														// close the form
				// Remove the event listener from the form to clear the inputs (and not have duplicates)
				document.querySelector('#edit-col-form').removeEventListener('submit', arguments.callee);
				// Remove dropdown if user saved the column
				const DROPDOWN = document.querySelector('.dropdown-content');
				if (DROPDOWN != null) {
					document.querySelector('.dropdown-content').remove();	
				}
				return 0;
			});
		});
	}		
	if (action == 'delete') {
		// Show alert before deleting the column
		if (confirm(`This will delete the column: ${COL_NAME}`)) {
			fetch(`/workboard/col-options/${col_id}`, {	// delete the column from the server
				method: 'PUT',
				body: JSON.stringify({
					action: 'delete'
				})
			})
			document.querySelector(`#col-id-${col_id}`).remove();	// delete the column from the DOM		
			empty_board_or_not_btn();								// check if we show empty board msg or not
			console.log('Column was deleted');
		} else {
			console.log('Column NOT deleted');
		}
	}
	document.querySelector(`#dropdown-col-${col_id}`).style.display = 'none';
}

//______________________________________________CARDS
function add_card(col_id) {
	/* Display the add card textarea with buttons */
	if (document.querySelector('#add-card-div') == null) { // if add-card-input is not shown, show it
		const COL_DIV = document.querySelector(`#col-id-${col_id}`);
		
		const NEW_CARD_DIV = document.createElement('div');
		NEW_CARD_DIV.id = 'add-card-div';
		// Get a card idea 
		NEW_CARD_DIV.innerHTML = `
			<form onsubmit="save_card(${col_id}); return false">
				<textarea id="card-data-textarea" class="form-control" maxlength="300"
					placeholder="Enter a note" required></textarea>
				<input type="submit" class="btn btn-success btn-sm" value="Add">
				<button class="btn btn-secondary btn-sm" onclick="close_add_card_input()">Cancel</button>
			</form>
			
		`;
		COL_DIV.appendChild(NEW_CARD_DIV);
	}
	else {	// add-card-input exists, hide it (user pressed 2nd time on '+' button)
		close_add_card_input();
	}
}

function save_card(col_id) {
	// This is where we create the card and save it in the database
	const NEW_CARD_TEXT = document.querySelector('#card-data-textarea').value;
	fetch(`/workboard/cards/${col_id}`, {
		method: 'POST',
		body: JSON.stringify({
			new_card_text: NEW_CARD_TEXT
		})
	})
	.then(response => response.json())
	.then(card => {

		close_add_card_input();		// Close the add card input
		const COL_DIV = document.querySelector(`#col-id-${col_id}`);
		const NEW_CARD_DIV = create_card_HTML(card, -1);
		COL_DIV.appendChild(NEW_CARD_DIV);
		console.log("Card was created");
		set_drag_and_drop();	// Add the possibility to drag to the new card
		return 0;
	});
}

function create_card_HTML(cards, index) {
	let card_id, card_text, card_column_id, card_creator;	// declare the empty variables

	if (index == -1) { 					// card's variables are from user's input (received index -1)
		card_id = cards['id'];
		card_text = cards['text'];
		card_column_id = cards['column_id'];
		card_creator = cards['creator_username'];
		card_position = cards['position'];
	} else {							// card's variables are from JSON array received from database
		card_id = cards[index]['id'];
		card_text = cards[index]['text'];
		card_column_id = cards[index]['column_id'];
		card_creator = cards[index]['creator_username'];
		card_position = cards[index]['position'];
	}

	const CARD_DIV = document.createElement('div');
	CARD_DIV.id = `card-id-${card_id}`;
	CARD_DIV.className = 'card-div draggable';	// the card will be a draggable element
	CARD_DIV.setAttribute('draggable', true);	// make the card draggable
	CARD_DIV.innerHTML = `

		<div class="card-buttons">
			<div class="dropdown">		
				<button onclick="show_dropdown_card(${card_id})" class="dropbtn">&#183;&#183;&#183;</button>
				
				<div id="dropdown-card-${card_id}" class="dropdown-content">
					<button onclick="card_options(${card_id}, 'edit')">Edit card</button><br>
					<button onclick="card_options(${card_id}, 'delete')">Delete card</button>
				</div>
			
			</div>
		</div>

		<p id="card-text-${card_id}">${card_text}</p>
		<p class="card-creator">creator: <strong>${card_creator}</strong></p>
	`;
	/* TESTING PURPOSES
		CARD_DIV.innerHTML = `
		<div class="dropdown">
			<button onclick="show_drop_down_card(${card_id})" class="dropbtn">&#183;&#183;&#183;</button>
			<div id="dropdown-card-${card_id}" class="dropdown-content">
				<button onclick="card_options(${card_id}, 'edit')">Edit card</button><br>
				<button onclick="card_options(${card_id}, 'delete')">Delete card</button>
			</div>
		</div>

		<p id="card-text-${card_id}">${card_position} - ${card_text}</p>
		<p>card id: ${card_id}</p>
		<p id="initial-col-${card_column_id}">initial col: ${card_column_id}</p>
		<p>creator: <strong>${card_creator}</strong></p>
	`;*/
	return CARD_DIV;
}

function show_dropdown_card(card_id) {
	console.log("#### SHOW DROP DOWN CARD - START");
	let dropdown = document.querySelector(`#dropdown-card-${card_id}`);
	console.log(dropdown);
	console.log(`display: ${dropdown.style.display}`);

	if (dropdown.style.display === 'none') {
		console.log('no display')
		dropdown.style.display = 'block'
	}
	else if (dropdown.style.display === "") {
		console.log('empty-string;');
		dropdown.style.display = 'block';
	}
	else {
		console.log('block display');
		dropdown.style.display = 'none';
	}
	console.log(dropdown);
	console.log("#### SHOW DROP DOWN CARD - END");
	//document.querySelector(`#dropdown-col-${col_id}`).classList.toggle('show');
}

function card_options(card_id, action) {
	// Prefill the text box
	let existing_note = document.querySelector(`#card-text-${card_id}`).innerHTML;
	if (action == 'edit') {
		document.querySelector('#edit-card-popup').style.display = 'block';
		document.querySelector('#edit-card-text-input').value = existing_note;

		document.querySelector('#edit-card-form').addEventListener('submit', function() {
			event.preventDefault();
			const NEW_NOTE = document.querySelector('#edit-card-text-input').value;
			fetch(`/workboard/cards/${card_id}`, {
				method: 'PUT',
				body: JSON.stringify({
					action: 'edit',
					new_card_note: NEW_NOTE
				})
			})
			.then(response => response.json())
			.then(card => {
				document.querySelector(`#card-text-${card_id}`).innerHTML = NEW_NOTE;
				close_form();
				document.querySelector('#edit-card-form').removeEventListener('submit', arguments.callee);

				// Remove dropdown if user saved the column
				const DROPDOWN = document.querySelector('.dropdown-content');
				if (DROPDOWN != null) {
					document.querySelector('.dropdown-content').remove();	
				}
				return 0;
			});
		});
	}
	if (action == 'delete') {
				// Show alert before deleting the column
		if (confirm(`This will delete the card: ${existing_note}`)) {
			fetch(`/workboard/cards/${card_id}`, {
				method: 'PUT',
				body: JSON.stringify({
					action: 'delete'
				})
			})
			document.querySelector(`#card-id-${card_id}`).remove();
			console.log('Card was deleted');
		} else {
			console.log('Card NOT deleted');
		}
	}
}

//____________________________________ HELPER functions ____________________________________
function close_form() {
	document.querySelector('#add-col-popup').style.display = 'none';
	document.querySelector('#edit-col-popup').style.display = 'none';
	document.querySelector('#edit-card-popup').style.display = 'none';
	unblur_background();
	empty_board_or_not_btn();	// display the correct button
}

function close_add_card_input() {
	document.querySelector('#add-card-div').remove();
}

function empty_board_or_not_btn() {
	if (document.querySelector('.col-div') == null) {	// if we don't have columns on the page
		show_empty_board_msg();							// show empty board msg
		hide_add_col_btn_lg();							// hide the large "+ Add column" button
	}
	else {												// we have columns
		show_add_col_btn_lg();							// show the large "+ Add column" button
	}
}

function show_empty_board_msg() {
	document.querySelector('#empty-board-msg').style.display = 'block';
}

function hide_empty_board_msg() {
	document.querySelector('#empty-board-msg').style.display = 'none';
}

function show_add_col_btn_lg() {
	document.querySelector('#add-col-btn-lg').style.display = 'inline-block'; // show "+ Add column" button
}

function hide_add_col_btn_lg() {
	document.querySelector('#add-col-btn-lg').style.display = 'none'; 		  // hide "+ Add column" button
}

function show_add_column_form() {
	document.querySelector('#add-col-popup').style.display = 'block';
}

function blur_background() {
	document.querySelector('#board-header').style.filter = 'blur(8px)';
	document.querySelector('#board-div').style.filter = 'blur(8px)';
}
function unblur_background() {
	document.querySelector('#board-header').style.filter = 'blur(0px)';
	document.querySelector('#board-div').style.filter = 'blur(0px)';
}
// Practice code
	// This has a lot of errors for the drag and drop function (className doesn't get updated after dragend)
	/*for (let i = 0, num_cards = draggables.length; i < num_cards; i++) {
		draggables[i].addEventListener('dragstart', () => {
			console.log(`	-> START - ${draggables[i].id}`);
			draggables[i].classList.add('dragging');				// add opacity
			console.log(`		className = ${draggables[i].className}`);
		});
		draggables[i].addEventListener('dragend', () => {
			console.log(`	-X END - ${draggables[i].id}`);
			draggables[i].classList.remove('dragging');				// remove opacity
			console.log(`		className = ${draggables[i].className}`);
		})
	}

	for (let [j, num_cols] = [0, containers.length]; j < num_cols; j++) {
		containers[j].addEventListener('dragover', ev => {
			console.log(`	..dragOver - ${containers[j].id}`);
			const draggable = document.querySelector('.dragging');
			console.log(draggable);
			containers[j].appendChild(draggable);
			console.log(`	..dragOver finished`);
		})
	}*/
