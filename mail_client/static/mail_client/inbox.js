document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);
  // Send email through POST when submit button on the form is pressed
  document.querySelector('#compose-form').addEventListener('submit', send_email);
  
  // By default, load the inbox
  load_mailbox('inbox');
});


function compose_email() {
  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';    
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#email-view').style.display = 'none';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

//________________________________________________________ Send email
function send_email(event) {
  // Get the form input
  const form_recipients = document.querySelector('#compose-recipients').value;
  const form_subject = document.querySelector('#compose-subject').value;
  let form_body = document.querySelector('#compose-body').value;
  let delimiter = "____________________________";
  
  // Check if we are sending to an existing reply chain
  if (form_body.includes(delimiter)) {
    let bodyArray = form_body.split(delimiter); // Split the email chain with the delimiter
    let newMessage = bodyArray.at(-1);          // Get the last element of the array (new message)
    
    let timestamp = `On ${getFormattedDate()}, ${document.querySelector("#sender").value} wrote:`
    let newReply = `${timestamp} ${newMessage}\n${delimiter}`;

    // Add the delimiter back to each reply
    let new_form_body = "";
    for (let i = 0; i < bodyArray.length - 1; i++) {
      new_form_body = new_form_body.concat(bodyArray[i], `${delimiter}\n`);  
    }

    // Add the new formatted message to the original chain
    form_body = new_form_body.concat(newReply);
  }

  // Send email through a POST request to the /emails route
  fetch('/mail-client/emails', {
    method: 'POST',
    body: JSON.stringify({
        recipients: form_recipients,
        subject: form_subject,
        body: form_body
    })
  })
  .then(response => response.json())
  .then(result => {
    if (result.hasOwnProperty('error')) {
      alert(result['error']);
    }
    else {
      load_mailbox('sent');
    }  
  });
}

//________________________________________________________ Display mailbox
function load_mailbox(mailbox) {
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
  
  fetch(`/mail-client/emails/${mailbox}`)  // no semi-colon
  .then(response => response.json())
  .then(emails => {

    // Create a table where each row will represent an email
    const table = document.createElement('table');                // Create the main table structure
    table.id = 'emails-table';                                    // Give it an id to query it later
    document.querySelector("#emails-view").appendChild(table);    // Append the table to the emails-view div in the DOM
    
    emails.forEach(email => {
      const tr = document.createElement('tr');

      // Check if email is read, add class name to row as "email-tr-read" else add ... unread
      tr.className = email.read ? "email-tr-read" : "email-tr-unread";

      // Check if we're in the sent or any other mailbox to display the sender or recipient
      senderORrecipient = (mailbox === "sent") ? `<td class="row-sender">${email.recipients}</td>` 
                                               : `<td class="row-sender">${email.sender}</td>`;
      tr.innerHTML = `
          ${senderORrecipient}
          <td class="row-subject">${email.subject}</td>
          <td class="row-timestamp">${email.timestamp}</td>
        `;
      // Add a listener when user clicks on an email's row
      tr.addEventListener('click', () => view_email(email.id, mailbox));
      document.querySelector('#emails-table').appendChild(tr);
    })
  });
  remove_email_from_view();   // Remove email from email-view div when going back to any mailbox
}

//________________________________________________________ Display email
function view_email(id, mailbox) {
  // Display the email in the email-view
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'block';

  // Get a JSON representation of an email with the given id
  fetch(`/mail-client/emails/${id}`)
  .then(response => response.json())
  .then(email => {

    // Create the div that displays the email
    const email_div = document.createElement('div');
    email_div.id = "email-div";

    // Check if we should display the archive, unarchaive or no button
    un_archive_btn = ""

    if (mailbox === "inbox") {
      un_archive_btn = `<button class="btn btn-sm btn-outline-secondary" onclick="archive_email(${id}, true)">Archive</button>`
    }
    else if (mailbox === "archive") {
      un_archive_btn = `<button class="btn btn-sm btn-outline-secondary" onclick="archive_email(${id}, false)">Unarchive</button>`
    }
    else {
      un_archive_btn = ""
    }

    // Using replace to format the body of the email
    email_div.innerHTML = `
      <ul id="email-meta">
        <li><b>From:</b> ${email.sender}</li>
        <li><b>To:</b> ${email.recipients}</li>
        <li><b>Subject:</b> ${email.subject}</li>
        <li><b>Timestamp:</b> ${email.timestamp}</li>
      </ul>
      <span id="reply-btn"></span>
      ${un_archive_btn}
      <span id="unread-btn"></span> 
      <hr>      
      <p>${email.body.replace(/\n/g, "<br />")}</p>
    `; 

    document.querySelector('#email-view').appendChild(email_div);

    const reply_btn = document.createElement('button');
    reply_btn.className = "btn btn-sm btn-outline-primary";
    reply_btn.innerHTML = "Reply";
    reply_btn.addEventListener('click', () => reply_email(email));

    const unread_btn = document.createElement('button');
    unread_btn.className = "btn btn-sm btn-outline-secondary";
    unread_btn.innerHTML = "Unread";
    unread_btn.addEventListener('click', () => unread_email(email));

    document.querySelector('#reply-btn').appendChild(reply_btn);
    document.querySelector('#unread-btn').appendChild(unread_btn);

    // Mark email as read after being displayed
    if (!email.read) {
      fetch(`/mail-client/emails/${id}`, {
          method: 'PUT',            
          body: JSON.stringify({
            read: true
          })
        })
    }
  });
}

//________________________________________________________ Reply to email
function reply_email(email) {
  compose_email();

  // Pre-fill inputs with original email's information
  document.querySelector('#compose-recipients').value = email.sender;

  // Format the replied subject line
  let subject = email.subject;

  let oldBody = email.body;  
  let newBody = oldBody;
  let delimiter = "____________________________";

  // Check if we are creating a new reply chain
  if (subject.split(" ", 1) != "Re:") {   // split(separator, limit)
     // If the subject line does not contain 'Re:' at the beginning (before the 1st empty space)
    subject = `Re: ${email.subject}`;     // Add 'Re:' at the beginning of the subject
    newBody = `On ${email.timestamp}, ${email.sender} wrote:\n ${oldBody}\n${delimiter}`;
  }

  document.querySelector('#compose-subject').value = subject; 
  document.querySelector('#compose-body').value = newBody;
}

//________________________________________________________ Archive email
function archive_email(id, btn) {
  fetch(`/mail-client/emails/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      archived: btn     // btn holds either true or false
    })
  })
  .then(response => load_mailbox('inbox'));  // Load the user's inbox
}

//________________________________________________________ Make email unread
function unread_email(email) {
  fetch(`/mail-client/emails/${email.id}`, {
    method: 'PUT',
    body: JSON.stringify({
      read: false
    })
  })
  .then(response => load_mailbox('inbox'));
}

function remove_email_from_view() {
  var email_div = document.querySelector('#email-div');

  if (email_div) {
    document.querySelector('#email-view').removeChild(email_div);
  }
}

function getFormattedDate() {  
  let now = new Date();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  let month = months[now.getMonth()];
  let currDay = now.getDate();
  let day = (currDay < 10 ? `0${currDay}` : currDay); // Add a leading 0 to day if it's less than 10

  let year = now.getFullYear();
  let hour = now.getHours();

  let currMinute = now.getMinutes();
  let minute = (currMinute < 10 ?  `0${currMinute}` : currMinute);  // Add a leading 0 to minute if it's less than 10
  let time = "";

  if (hour > 0 && hour < 12) {
    time = (hour < 10 ? `0${hour}:${minute} AM` : `${hour}:${minute} AM`);
  }
  else if (hour === 0 || hour === 24) {
    time = `12:${minute} AM`
  }
  else if (hour === 12) {
    time = `12:${minute} PM`;
  }
  else {
    hour12 = hour - 12;
    time = (hour12 < 10 ? `0${hour12}:${minute} PM` : `${hour12}:${minute} PM`);
  }

  return `${month} ${day} ${year}, ${time}`;  // e.g. Sep 04 2021, 4:50 PM
}
