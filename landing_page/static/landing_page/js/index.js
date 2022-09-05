document.addEventListener('DOMContentLoaded', function() {
	document.querySelector('#resume-btn').addEventListener('click', show_resume);

	const dropdownButton = document.querySelector('#dropdown-btn');
	if (dropdownButton !== null) { dropdownButton.addEventListener('click', show_dropdown); }
	close_resume();

	const projectButton = document.querySelector('#projects-btn');
	if (projectButton !== null) { projectButton.addEventListener('click', scroll_to_projects); }

	const mobileProjectButton = document.querySelector('#mobile-projects-btn');
	if (mobileProjectButton !== null) { mobileProjectButton.addEventListener('click', scroll_to_projects); }

	const mobileResumeButton = document.querySelector('#mobile-resume-btn');
	if (mobileResumeButton !== null) { mobileResumeButton.addEventListener('click', show_resume); }

	const contactButton = document.querySelector('#contact-btn');
	if (contactButton !== null) { contactButton.addEventListener('click', scroll_to_contact); }

	const mobileContactButton = document.querySelector('#mobile-contact-btn');
	if (mobileContactButton !== null) { mobileContactButton.addEventListener('click', scroll_to_contact); }
});

function show_dropdown() {
	const dropdownContent = document.querySelector('#dropdown-content');

	if (dropdownContent.style.display == 'none' || dropdownContent.style.display == "") {
		dropdownContent.style.display = 'block';
	}
	else {
		dropdownContent.style.display = 'none';
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

	/* Show resume and blur background */
	const pdfModal = document.querySelector('#pdf-modal');
	const main_container = document.querySelector('#main-container');
	if (pdfModal.style.display === 'none') {
		pdfModal.style.display = 'block';
		document.querySelector('#darken-overlay').style.display = 'block';
		main_container.style.filter = 'blur(8px)';

		prevent_scroll();
	}
	else if (pdfModal.style.display === "") {	// Initially the style of the PDF container is an empty string
		pdfModal.style.display = 'block'
		document.querySelector('#darken-overlay').style.display = 'block';
		main_container.style.filter = 'blur(8px)';
		
		prevent_scroll();
	}
	else {
		pdfModal.style.display = 'none';
		document.querySelector('#darken-overlay').style.display = 'none';
		main_container.style.filter = 'blur(0px)';

		resume_scroll();
	}
}


function close_resume() {
	// Close resume display if we clicked outside its container
	window.onclick = function(event) {
		const pdfModal = document.querySelector('#pdf-modal');
		// clicking on the pdf-modal doesn't return anything (if true, we clicked outside)
		// clicking on any of the matches is not considered clicking outside the pdf container
		if ( event.target && !event.target.matches('#resume-btn') && !event.target.matches('#projects-btn') 
			&& !event.target.matches('#mobile-resume-btn') && !event.target.matches('#contact-btn') ) {	
			document.querySelector('#pdf-modal').style.display = 'none';
			document.querySelector('#darken-overlay').style.display = 'none';
			document.querySelector('#main-container').style.filter = 'blur(0px)';

			resume_scroll();
		}
	}
}


function prevent_scroll() {
	document.body.style.overflow = 'hidden';
	document.querySelector('#pdf-modal').style.top = `${window.scrollY + 70}px`
}

function resume_scroll() {
	document.body.style.overflow = 'visible';
}
