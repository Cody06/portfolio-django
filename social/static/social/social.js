// Write the new post (display on profile page and all posts)

document.addEventListener('DOMContentLoaded', () => {
	const newPostForm = document.querySelector('#new-post-form');
	if (newPostForm !== null) { newPostForm.addEventListener('submit', send_post); }
	
	const follow_btn = document.querySelector('#follow-btn');
	if (follow_btn !== null) { follow_btn.addEventListener('click', follow_user); }

	const unfollow_btn = document.querySelector('#unfollow-btn');
	if (unfollow_btn !== null) { unfollow_btn.addEventListener('click', unfollow_user); }

	const more_btn = document.querySelector('#dropdown-btn');
	if (more_btn !== null) { more_btn.addEventListener('click', show_dropdown); }

	clicked_outside_dropdow();

	// Check if we are on a page with an edit button
	if (document.querySelector('.edit-btn') !== null) { edit_post() }

	if (document.querySelector('.like-btn') !== null) { like_post() }
});


function edit_post() {
	// Add the possibility to edit the post for each button
	document.querySelectorAll('.edit-btn').forEach(button =>
		button.onclick = function() {
			// Each edit button's id (this.dataset.postid) will be the same as the post's div id
			const POST_ID = this.dataset.postid;
			const POST_DIV = document.querySelector(`#postID-${POST_ID}`)	// Get the div with the post
			const CURRENT_POST = POST_DIV.innerHTML;						// Get the current post
			button.style.display = "none"				// Remove the edit button

			POST_DIV.innerHTML = `
				<form onsubmit="save_edited_post(${POST_ID});">
					<input type="submit" class="edit-btn" value="Save"><br>
					<textarea id="edited-post-${POST_ID}" class="form-control" maxlength="280">${CURRENT_POST}</textarea>
				</form>`
		})
}


function save_edited_post(postID) {
	fetch(`/social/save-edited-post/${postID}`, {
		method: 'POST',
		body: JSON.stringify({
			editedPost: document.querySelector(`#edited-post-${postID}`).value
		})
	})
}


function like_post() {
	// Like a post through PUT to not reload the entire page
	document.querySelectorAll('.like-btn').forEach(button =>
		button.onclick = function() {
			const postID = this.dataset.postid;
			fetch(`/social/like-post/${postID}`, {
				method: 'PUT',
			})
			.then(response => response.json())	// Use this to format the response
			.then(likes => {
				document.querySelector(`#likesID-${postID}`).innerHTML = likes;
			})
		})
}	


function send_post(event) {
	const newPost = document.querySelector('#new-post').value;

	if (newPost === "") {
		alert("Cannot create an empty post.");
	}
	else {
		// Send new post through a POST request to the /posts route
		fetch('/social/save-new-post', {
			method: 'POST',
			body: JSON.stringify({
				newPost: newPost
			})
		})
		.then(response => {
			location.reload();
		})
	}
}


function follow_user(event) {
	// event.target.value returns the value of the event that triggered this function
	fetch('/social/follow', {
		method: 'POST',
		body: JSON.stringify({
			newFollowing: event.target.value
		})
	})
	.then(response => {
		location.reload();	// Simply reload the current page
	})
}


function unfollow_user(event) {
	fetch('/social/unfollow', {
		method: 'POST',
		body: JSON.stringify({
			removeFollowing: event.target.value
		})
	})
	.then(response => {
		location.reload();	// Simply reload the current page
	})
}

function show_dropdown(event) {
	console.log("Dropdown pressed")
	document.querySelector('#dropdown-content').style.display = 'block';
}

function clicked_outside_dropdow() {
	// Close resume display if we clicked outside its container
	window.onclick = function(event) {
		if ( event.target && !event.target.matches('#dropdown-btn') ) {	
			console.log('Clicked outside pdf-modal');
			document.querySelector('#dropdown-content').style.display = 'none';
		}
	}
}
