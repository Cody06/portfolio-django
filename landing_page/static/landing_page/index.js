document.addEventListener('DOMContentLoaded', function() {
	document.querySelector('#resume-btn').addEventListener('click', show_resume);

	close_resume();
});

function show_resume() {
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
		if (event.target && !event.target.matches('#resume-btn')) {	
			console.log('Clicked outside pdf-container');
			document.querySelector('#pdf-container').style.display = 'none';
			document.querySelector('#main-container').style.filter = 'blur(0px)';
		}
	}
}
