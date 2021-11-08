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
	//typewriter();
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
	document.getElementById("footer").scrollIntoView();
}

function show_resume() {
	document.querySelector('#dropdown-content').style.display = 'none';
	console.log("Show resume");
	/* Show resume and blur background */
	const pdf_container = document.querySelector('#pdf-container');
	const main_container = document.querySelector('#main-container');
	if (pdf_container.style.display === 'none') {
		pdf_container.style.display = 'block';
		main_container.style.filter = 'blur(8px)';
		console.log('show PDF')
	}
	else if (pdf_container.style.display === "") {	// Initially the style of the PDF container is an empty string
		pdf_container.style.display = 'block'
		main_container.style.filter = 'blur(8px)';
		console.log('empty string style - show PDF')
	}
	else {
		pdf_container.style.display = 'none';
		main_container.style.filter = 'blur(0px)';
		console.log('hide PDF')
	}
}

// Close resume display if we clicked outside its container
function close_resume() {
	window.onclick = function(event) {
		console.log(event.target)
		const pdf_container = document.querySelector('#pdf-container');
		// clicking on the pdf-container doesn't return anything (if true, we clicked outside)
		// clicking on any of the matches is not considered clicking outside the pdf container
		if ( event.target && !event.target.matches('#resume-btn') && !event.target.matches('#projects-btn') 
			&& !event.target.matches('#mobile-resume-btn') && !event.target.matches('#contact-btn') ) {	
			console.log('Clicked outside pdf-container');
			document.querySelector('#pdf-container').style.display = 'none';
			document.querySelector('#main-container').style.filter = 'blur(0px)';
		}
	}
}

/* Typewriter animation with line break */
// set up text to print, each item in array is new line
let aText = new Array("Full Stack Developer");
let iSpeed = 100; // time delay of print out
let iIndex = 0; // start printing array at this position
let iArrLength = aText[0].length; // the length of the text array
let iScrollAt = 20; // start scrolling up at this many lines
 
let iTextPos = 0; // initialize text position
let sContents = ''; // initialize contents variable
let iRow; // initialize current row
 
function typewriter() {
	sContents =  ' ';
 	iRow = Math.max(0, iIndex-iScrollAt);
 	let destination = document.querySelector('#title');
 
	while (iRow < iIndex) {
  		sContents += aText[iRow++] + '<br />';
 	}
 
 	destination.innerHTML = sContents + aText[iIndex].substring(0, iTextPos) + "|";
 
 	if (iTextPos++ == iArrLength) {
  		iTextPos = 0;
  		iIndex++;

  		if (iIndex != aText.length) {
  			iArrLength = aText[iIndex].length;
   			setTimeout("typewriter()", 500);
  		}
 	} else {
  		setTimeout("typewriter()", iSpeed);
 	}
}


