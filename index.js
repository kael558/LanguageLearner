require('dotenv').config();
const { Configuration, OpenAIApi } = require("openai");
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);


// Tab Switching
const tabs = document.querySelectorAll('.tab');
const tabContents = document.querySelectorAll('#content-tab1, #content-tab2');

tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        // Hide all tabs
        tabContents.forEach(content => {
            content.style.display = 'none';
        });
        console.log("tab.id: " + tab.id);

        // Display the clicked tab
        document.querySelector(`#content-${tab.id}`).style.display = 'block';
    });
});

// Handle audio recording
let mediaRecorder;
let recordedBlobs;

const recordButton = document.getElementById('recordButtonConversation');

navigator.mediaDevices.getUserMedia({ audio: true, video: false })
.then(stream => {
    mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.onstop = (event) => {
    let blob = new Blob(recordedBlobs, { 'type' : 'audio/webm' });
    sendDataToServer(blob);
    };

    mediaRecorder.ondataavailable = (event) => {
    if (event.data && event.data.size > 0) {
        recordedBlobs.push(event.data);
    }
    };

    recordButton.addEventListener('mousedown', (event) => {
    recordedBlobs = [];
    mediaRecorder.start();
    });

    recordButton.addEventListener('mouseup', (event) => {
    mediaRecorder.stop();
    });
})
.catch(error => console.error('getUserMedia() error:', error));


// Handle text message submission
document.querySelector('#submit-button').addEventListener('click', () => {
    let chatInputField = document.querySelector('#chat-input-field');
    let chatMessages = document.querySelector('.chat-messages');

    // Add the message to the chat
    if (chatInputField.value.trim() !== '') {
        chatMessages.innerHTML += `<p>${chatInputField.value}</p>`;
        chatInputField.value = '';
    }
});


async function transcribe(blob){
    const formData = new FormData();
    formData.append('audioFile', blob);

    let resp = "Failed to transcribe.";
    try {
        resp = await openai.createTranscription(
            fs.createReadStream(formData),
            "whisper-1"
          );
    } catch (e){
        console.log("Error", e);
    }

    return resp;
}