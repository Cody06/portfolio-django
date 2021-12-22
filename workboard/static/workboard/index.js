document.addEventListener('DOMContentLoaded', function() {
	document.querySelector('#create-board-form-btn').addEventListener('click', show_form)
	const CLOSE_FORM_BTN = document.querySelector('.close-form-btn').addEventListener('click', close_form)
});

function show_form() {
	document.querySelector('#create-board-modal').style.display = 'block';
	document.querySelector('#create-board-form-btn').style.display = 'none';
	document.querySelector('#darken-overlay').style.display = 'block';
	document.querySelector('.flex-container').style.filter = 'blur(8px)';
}

function close_form() {
	document.querySelector('#create-board-modal').style.display = 'none';
	document.querySelector('#create-board-form-btn').style.display = 'block'
	document.querySelector('#darken-overlay').style.display = 'none';
	document.querySelector('.flex-container').style.filter = 'blur(0px)';
}