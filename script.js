// Global Variables
let selectedDay;
let secretaryName;
let selectedPrayer = "";
let selectedSecondPrayer = "";

// Schedule Data
const schedule = {
  "Sunday": { secretary: "Sophie P", host: "Sophie P", cohost: "Eliseo" },
  "Monday": { secretary: "M", host: "M", cohost: "Francine" },
  "Tuesday": { secretary: "Vanessa aka Skittles", host: "Vanessa aka Skittles", cohost: "Alice" },
  "Wednesday": { secretary: "Carlton", host: "Carlton", cohost: "Eliseo" }, // Updated from Anthony to Carlton
  "Thursday": { secretary: "Stacie Donahue", host: "Stacie Donahue", cohost: "Stephen" },
  "Friday": { secretary: "Dayna D & Chris Junghans", host: "Dayna D & Chris Junghans", cohost: "Alice" },
  "Saturday": { secretary: "Stephen Jones", host: "Stephen Jones", cohost: "Alice or Francine (rotating)" }
};

// Function to Display Assignments
function displayAssignments(day) {
  const assignments = schedule[day];
  if (assignments) {
    const displayDiv = document.getElementById('assignments-display');
    displayDiv.textContent = `The assigned Secretary, Host & CoHost for the evening based upon day selected: Secretary: ${assignments.secretary}, Host: ${assignments.host}, CoHost: ${assignments.cohost}`;
    displayDiv.style.display = 'block';
  }
}

// Helper Functions
function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}

function copyToClipboardWithLimit(elementId) {
  const text = document.getElementById(elementId).textContent;
  if (text.length <= 999) {
    navigator.clipboard.writeText(text)
      .then(() => alert("Copied as text!"))
      .catch(err => alert("Error copying text: " + err));
  } else {
    copyTextInSegments(elementId);
  }
}

function segmentText(text, maxSegmentLength) {
  let segments = [];
  let start = 0;
  while (start < text.length) {
    let end = start + maxSegmentLength;
    if (end >= text.length) {
      segments.push(text.substring(start));
      break;
    } else {
      let segment = text.substring(start, end);
      const punctuationMarks = [".", "!", "?"];
      let lastPuncIndex = -1;
      punctuationMarks.forEach(p => {
        let idx = segment.lastIndexOf(p);
        if (idx > lastPuncIndex) lastPuncIndex = idx;
      });
      if (lastPuncIndex !== -1) end = start + lastPuncIndex + 1;
      segments.push(text.substring(start, end));
      start = end;
    }
  }
  return segments;
}

async function copyTextInSegments(elementId) {
  const fullText = document.getElementById(elementId).textContent;
  const maxSegmentLength = 999;
  const segments = segmentText(fullText, maxSegmentLength);
  const totalSegments = segments.length;
  const totalChars = fullText.length;
  let copiedChars = 0;
  for (let i = 0; i < segments.length; i++) {
    let segment = segments[i];
    try {
      await navigator.clipboard.writeText(segment);
      copiedChars += segment.length;
      await showProgressModal(i + 1, totalSegments, copiedChars, totalChars);
    } catch (err) {
      alert("Error copying segment: " + err);
      return;
    }
  }
  let modal = document.getElementById('progress-modal');
  if (modal) modal.parentNode.removeChild(modal);
  alert("The entire reading has been copied as text!");
}

function showProgressModal(currentSegment, totalSegments, copiedChars, totalChars) {
  return new Promise(resolve => {
    let modal = document.getElementById('progress-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'progress-modal';
      modal.className = "modal-overlay";
      modal.innerHTML = `<div class="modal-content">
                           <p id="progress-message"></p>
                           <div id="progress-bar-container">
                             <div id="progress-bar"></div>
                           </div>
                           <button id="continue-button">Continue</button>
                         </div>`;
      document.body.appendChild(modal);
    }
    const progressMessage = document.getElementById('progress-message');
    progressMessage.textContent = `Segment ${currentSegment} of ${totalSegments} copied. ${copiedChars} of ${totalChars} characters copied.`;
    const progressBar = document.getElementById('progress-bar');
    const percent = (copiedChars / totalChars) * 100;
    progressBar.style.width = percent + "%";
    const continueButton = document.getElementById('continue-button');
    continueButton.onclick = () => resolve();
  });
}

async function copySectionAsImage(elementId) {
  try {
    const element = document.getElementById(elementId);
    if (!element) throw new Error("Element not found.");
    const canvas = await html2canvas(element, { backgroundColor: null });
    const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/png"));
    const clipboardItem = new ClipboardItem({ "image/png": blob });
    await navigator.clipboard.write([clipboardItem]);
    alert("Copied as image!");
  } catch (error) {
    alert("Error copying section as image: " + error);
  }
}

async function copyImageToClipboard(imageId) {
  if (isIOS()) {
    alert("Copying images is not supported on iOS. Please download the image instead.");
    return;
  }
  const img = document.getElementById(imageId);
  if (!img || !img.complete) {
    alert("Safety Card image not loaded yet.");
    return;
  }
  try {
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);
    const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/png"));
    const clipboardItem = new ClipboardItem({ "image/png": blob });
    await navigator.clipboard.write([clipboardItem]);
    alert("Safety Card image copied as image!");
  } catch (err) {
    alert("Error copying image: " + err);
  }
}

function getMeetingPostingsHTML() {
  const attendanceText = document.getElementById('attendance-verification-text').textContent;
  const howItWorksText = document.getElementById('how-it-works-text').textContent;
  const firstReadingText = document.getElementById('first-reading-text').textContent;
  const traditionText = document.getElementById('tradition-text').textContent;
  const secondReadingText = document.getElementById('second-reading-text').textContent;
  return `
<div style="padding:20px; font-family: Menlo, Monaco, Consolas, 'Courier New', monospace; background: #f5f5f7; color: #1d1d1f;">
  <div style="margin-bottom:20px;"><p>${attendanceText}</p></div>
  <div style="margin-bottom:20px;"><p>${howItWorksText}</p></div>
  <div style="margin-bottom:20px;"><p>${firstReadingText}</p></div>
  <div style="margin-bottom:20px;"><p>${traditionText}</p></div>
  <div><p>${secondReadingText}</p></div>
</div>`;
}

async function copyMeetingPostingsImageToClipboard() {
  try {
    const htmlContent = getMeetingPostingsHTML();
    const tempDiv = document.createElement("div");
    tempDiv.style.position = "fixed";
    tempDiv.style.top = "-9999px";
    tempDiv.innerHTML = htmlContent;
    document.body.appendChild(tempDiv);
    const canvas = await html2canvas(tempDiv, { backgroundColor: null });
    document.body.removeChild(tempDiv);
    const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/png"));
    const clipboardItem = new ClipboardItem({ "image/png": blob });
    await navigator.clipboard.write([clipboardItem]);
    alert("Meeting postings copied as image!");
  } catch (error) {
    alert("Error copying meeting postings image: " + error);
  }
}

async function copyAllMeetingPostings() {
  try {
    const img = document.getElementById('safety-card-img');
    if (!img || !img.complete) throw new Error("Safety Card image not loaded yet.");
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);
    const dataURL = canvas.toDataURL("image/png");
    const attendanceText = document.getElementById('attendance-verification-text').textContent;
    const howItWorksText = document.getElementById('how-it-works-text').textContent;
    const firstReadingText = document.getElementById('first-reading-text').textContent;
    const traditionText = document.getElementById('tradition-text').textContent;
    const secondReadingText = document.getElementById('second-reading-text').textContent;
    const htmlContent = `
<div>
  <div><img src="${dataURL}" style="max-width:100%; height:auto; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.1);" /></div>
  <div><p>${attendanceText}</p></div>
  <div><p>${howItWorksText}</p></div>
  <div><p>${firstReadingText}</p></div>
  <div><p>${traditionText}</p></div>
  <div><p>${secondReadingText}</p></div>
</div>`;
    const blob = new Blob([htmlContent], { type: "text/html" });
    const clipboardItem = new ClipboardItem({ "text/html": blob });
    await navigator.clipboard.write([clipboardItem]);
    alert("All meeting postings copied as text!");
  } catch (error) {
    alert("Error copying all meeting postings: " + error);
  }
}

// User Interaction Functions
function selectDay(day) {
  selectedDay = day;
  document.getElementById('day-selection').style.display = 'none';
  document.getElementById('next-step').style.display = 'block';
  setTimeout(() => {
    const nameInput = document.getElementById('secretary-name');
    if (nameInput) nameInput.focus();
  }, 300);
}

function submitName() {
  secretaryName = document.getElementById('secretary-name').value.trim();
  if (secretaryName) {
    document.getElementById('next-step').style.display = 'none';
    document.getElementById('prayer-selection').style.display = 'block';
  } else {
    alert("Please enter your name.");
  }
}

function selectPrayer(prayer) {
  selectedPrayer = prayer;
  document.getElementById('prayer-selection').style.display = 'none';
  document.getElementById('second-prayer-selection').style.display = 'block';
}

function selectSecondPrayer(prayer) {
  selectedSecondPrayer = prayer;
  document.getElementById('second-prayer-selection').style.display = 'none';
  generateScript();
}

function generateScript() {
  const howItWorksText = getHowItWorksText();
  const firstPrayerText = getFirstPrayerText(selectedPrayer);
  const secondPrayerText = getSecondPrayerText(selectedSecondPrayer);
  const firstReadingLabel = "(Friend reads " + selectedPrayer + "):";
  const secondReadingLabel = "(Friend reads " + selectedSecondPrayer + "):";

  let script = `
Rogue Format FOLLOW THE FORMAT

Welcome to the ${selectedDay} Just Some F*cking Online Rogue AA Meeting.
My name is ${secretaryName}, and I am your alcoholic secretary.
So that we may have an uninterrupted meeting, please remain muted if you are not sharing.

I’d like to start the meeting with a moment of silence followed by the serenity prayer.

(Read Prayer):

God grant me the serenity to accept the things I cannot change, the courage to change the things I can, and the wisdom to know the difference.

PREAMBLE:  
Alcoholics Anonymous is a fellowship of men and women who share their experience, strength, and hope with each other  
that they may solve their common problem and help others to recover from alcoholism.
The only requirement for membership is a desire to stop drinking.
There are no dues or fees for AA membership; we are self-supporting through our own contributions.
AA is not allied with any sect, denomination, politics, organization, or institution;
does not engage in any controversy, neither endorses nor opposes any causes.
Our primary purpose is to stay sober and help other alcoholics to achieve sobriety.

(Ask the CoHost to post the Safety Card)  
We try our absolute best here to provide a safe, welcoming atmosphere of recovery.
Please let’s be mindful and respectful of the room.
We ask that you remain muted, unless called on.
If you are moving around, please keep cameras off as not to distract others.
We implement a timer here, so please wrap your share up when you hear the beep.
(Ask the CoHost to take care of the timer)

(Ask the CoHost to post the Attendance Verification)  
Attendance Verification:
Here’s how the new attendance system works!
At each meeting, you’ll click on a link that will take you to a form,
fill out the form with your first name, last name, the date you attended, and your email.
Once you submit it, the system will send you an email confirming your attendance.

https://sjoneshome.github.io/Rogue-AA/

I’ve asked a friend to read How it Works from the Big Book of Alcoholics Anonymous.
(Friend reads How It Works):

${howItWorksText}

I’ve asked a friend to read ${selectedPrayer}  
${firstReadingLabel}

${firstPrayerText}

Not to embarrass anyone but to get to know you better after the meeting.
Is there anyone with less than 30 days continuous sobriety?
Please introduce yourself by your first name.
(Take notes of newcomers, out-of-towners, and first timers)

Anyone here for the 1st time or anyone from outside the San Diego area that has not been here before?
Welcome everyone!

We celebrate earned lengths of sobriety:
30, 60, 90 days; 6 months, 9 months, 1 year, and each year thereafter.
Anyone celebrating any of these lengths of time? (Ask them how they did it!)
Congratulations to everyone on another 24 hours.
(Take note of any celebrations)
(Please have celebrants message the host or co-host their info and milestone length so we can send them a chip.)

If you are willing to sponsor, please put your info in the chat;
those with questions, please stay for the meeting after the meeting.

(Ask the CoHost to post the 7th Tradition)  
7th Tradition states we are fully self supporting through our own contributions, please give what you can.
In order to pay for our yearly Zoom subscription and for email verification service we need to collect $20 per month.
Thank you in advance for your contribution here.
7th Tradition: Venmo: Silvia-castillo-40718

(Select a reading from AA Approved Literature and read to the group.
Announce the topic and share for 3-5 minutes. Open up for discussion.)

For the 1st half of the meeting we will call on people to share;
the second half we will open it up to those that have not yet had the opportunity to share.
At this meeting we do not cross talk, or provide other members advice or specific feedback,
in order for members to feel they can share freely and openly.
(This includes the host and secretary of the meeting.)
If you have had a drink or drug in the last 24 hours, we ask that you just listen.
We want to hear from you, not the intoxicant.

(Discussion Period)

Closing (11:15 p.m.)
That’s all the time we have for sharing today.
Welcome again to newcomers, first timers, out-of-towners, and celebrants.
(Announce the names of newcomers, out-of-towners, and first timers.)
If you wanted to share during the meeting and did not get a chance to,
please reach out in the chat or stay for the meeting after the meeting.

As a reminder to all:
“What you see here, what you hear here, when you leave here, let it stay here.”

Are there any AA announcements?
Any non-AA announcements?

If you are willing to be a sponsor for someone, at least on a temporary basis, please raise your hand.

I’ve asked a friend to read ${selectedSecondPrayer}  
${secondReadingLabel}

${secondPrayerText}

I’ve asked a friend to lead us out with the serenity prayer of their choice.
(Friend reads serenity prayer of their choice): “God”`;

  const scriptContainer = document.getElementById('generated-script');
  scriptContainer.textContent = script;
  scriptContainer.style.maxHeight = 'none';
  setTimeout(displayScriptAsImage, 100);

  document.getElementById('how-it-works-text').textContent = howItWorksText;
  document.getElementById('first-reading-text').textContent = firstPrayerText;
  document.getElementById('second-reading-text').textContent = secondPrayerText;

  document.getElementById('copy-script-button').style.display = 'block';
  document.getElementById('view-cohost-button').style.display = 'block';

  document.getElementById('copy-first-reading-button').textContent = "Copy " + selectedPrayer + " as Text";
  document.getElementById('copy-second-reading-button').textContent = "Copy " + selectedSecondPrayer + " as Text";

  // Display the assignments for the selected day
  displayAssignments(selectedDay);
}

function displayScriptAsImage() {
  const container = document.getElementById('generated-script');
  html2canvas(container, { backgroundColor: null }).then(canvas => {
    const dataURL = canvas.toDataURL("image/jpeg");
    container.innerHTML = `<img src="${dataURL}" style="max-width:100%; display: block; margin: 0 auto;" alt="Meeting Script Image"/>`;
    container.style.height = "auto";
  });
}

// Global Functions for Inline Event Handlers
function handleKey(event) {
  if (event.key === "Enter") submitName();
}

function showCohostInstructions() {
  document.getElementById('secretary-page').style.display = 'none';
  document.getElementById('cohost-instructions').style.display = 'block';
}

function goBackToSecretaryPage() {
  document.getElementById('cohost-instructions').style.display = 'none';
  document.getElementById('secretary-page').style.display = 'block';
}
