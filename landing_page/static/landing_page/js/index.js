document.addEventListener('DOMContentLoaded', function() {
	document.querySelector('#resume-btn').addEventListener('click', show_resume);

	close_resume();

	//typewriter();
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


