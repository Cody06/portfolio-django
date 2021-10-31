document.addEventListener('DOMContentLoaded', function() {
	document.querySelector('#create-board-form-btn').addEventListener('click', showForm)
	document.querySelector('#close-form-btn').addEventListener('click', closeForm)
})

function showForm() {
	document.querySelector('#create-board-form').style.display = 'block';
	document.querySelector('#create-board-form-btn').style.display = 'none';
}

function closeForm() {
	document.querySelector('#create-board-form').style.display = 'none';
	document.querySelector('#create-board-form-btn').style.display = 'block'
}