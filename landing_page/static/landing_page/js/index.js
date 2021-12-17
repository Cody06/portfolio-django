document.addEventListener('DOMContentLoaded', function() {
	document.querySelector('#resume-btn').addEventListener('click', show_resume);

	const DROPDOWN_BTN = document.querySelector('#dropdown-btn');
	if (DROPDOWN_BTN !== null) { DROPDOWN_BTN.addEventListener('click', show_dropdown); }
	close_resume();

	const PROJECTS_BTN = document.querySelector('#projects-btn');
	if (PROJECTS_BTN !== null) { PROJECTS_BTN.addEventListener('click', scroll_to_projects); }

	const MOBILE_RESUME_BTN = document.querySelector('#mobile-resume-btn');
	if (MOBILE_RESUME_BTN !== null) { MOBILE_RESUME_BTN.addEventListener('click', show_resume); }

	const CONTACT_BTN = document.querySelector('#contact-btn');
	if (CONTACT_BTN !== null) { CONTACT_BTN.addEventListener('click', scroll_to_contact); }
});

function show_dropdown() {

	const DROPDOWN_CONTENT = document.querySelector('#dropdown-content');

	if (DROPDOWN_CONTENT.style.display == 'none' || DROPDOWN_CONTENT.style.display == "") {
		DROPDOWN_CONTENT.style.display = 'block';
	}
	else {
		DROPDOWN_CONTENT.style.display = 'none';
	}
}

function scroll_to_projects() {
	document.querySelector('#dropdown-content').style.display = 'none'; /* hide dropdown content after clicking button */
	document.getElementById("projects").scrollIntoView();
}

function scroll_to_contact() {
	document.querySelector('#dropdown-content').style.display = 'none';
	document.getElementById("contact-info").scrollIntoView();
}

function show_resume() {
	document.querySelector('#dropdown-content').style.display = 'none';
	console.log("Show resume");
	/* Show resume and blur background */
	const pdf_modal = document.querySelector('#pdf-modal');
	const main_container = document.querySelector('#main-container');
	if (pdf_modal.style.display === 'none') {
		pdf_modal.style.display = 'block';
		main_container.style.filter = 'blur(8px)';
		console.log('show PDF')
	}
	else if (pdf_modal.style.display === "") {	// Initially the style of the PDF container is an empty string
		pdf_modal.style.display = 'block'
		main_container.style.filter = 'blur(8px)';
		console.log('empty string style - show PDF')
	}
	else {
		pdf_modal.style.display = 'none';
		main_container.style.filter = 'blur(0px)';
		console.log('hide PDF')
	}
}

// Close resume display if we clicked outside its container
function close_resume() {
	window.onclick = function(event) {
		console.log(event.target)
		const pdf_modal = document.querySelector('#pdf-modal');
		// clicking on the pdf-modal doesn't return anything (if true, we clicked outside)
		// clicking on any of the matches is not considered clicking outside the pdf container
		if ( event.target && !event.target.matches('#resume-btn') && !event.target.matches('#projects-btn') 
			&& !event.target.matches('#mobile-resume-btn') && !event.target.matches('#contact-btn') ) {	
			console.log('Clicked outside pdf-modal');
			document.querySelector('#pdf-modal').style.display = 'none';
			document.querySelector('#main-container').style.filter = 'blur(0px)';
		}
	}
}


