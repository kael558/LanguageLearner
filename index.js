
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

// Switching between scenarios and conversation
const scenarioContainer = document.querySelector('#scenario-container');
const chatContainer = document.querySelector('#chat-container');

const scenarios = [
    {
        "id": 0,
        "title": "Order a baguette from a bakery",
        "description": "You are at a bakery and want to order a baguette.",
        "image": "/images/bakery.png",
        "first_message": "Hello, how can I help you?"
    },
    {
        "id": 1,
        "title": "Cancel your phone plan",
        "description": "You want to cancel your phone plan. The customer service is very unhelpful",
        "image": "/images/phone.png",
        "first_message": "Welcome to our customer service. How can I help you?"
    }
]

// Append scenarios to the scenario container
scenarioContainer.innerHTML = scenarios.map(scenario => {
    return `
        <div class="scenario">
            <img src="${scenario.image}" alt="${scenario.title}">
            <div class="scenario-info">

                <h3>${scenario.title}</h3>
                <p>${scenario.description}</p>
                `
}).join('');







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





/* API HANDLING */
const voices = [
    {
        "name": "lilo",
        "voiceId": "XLvJY0dlqRhbdmq8Z5JR"
    },
    {
        "name": "Vince",
        "voiceId": "kyQrbOCDiYKVwfhYDB1P"
    },
    {
        "name": "Myriam",
        "voiceId": "TTrDn9Ir1t2U368R8E3l"
    },
    {
        "name": "Tally",
        "voiceId": "2J9CAhZvhE0fg9uemD9I"
    },
    {
        "name": "Maya",
        "voiceId": "EGMUWEy9FmLXIvebojtl"
    },
    {
        "name": "scillia",
        "voiceId": "VLO0gQRdDb0xkZGBqYu9"
    },
    {
        "name": "mommy",
        "voiceId": "HuIhiJyeIzGdXp1HGSWY"
    },
    {
        "name": "guilty",
        "voiceId": "Rrm9EhD3fZjj20P5izEu"
    }
]


async function tts(voiceId, text){

    "text": "{{{tts.text}}}",
        "voice_settings": {
          "stability": 0.15,
          "similarity_boost": 1
        },
        "optimize_streaming_latency": 4


    ///api/tts/{voiceId}/stream
    try {
        const res = await fetch(`https://c0djsh12rf.execute-api.us-east-1.amazonaws.com/api/tts/${voiceId}/stream`, {
            method: 'POST',
            headers: {  
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                "text": text,
                "voice_settings": {
                    "stability": 0.15,
                    "similarity_boost": 1
                },
                "optimize_streaming_latency": 4
            })
        });

        if (!res.ok) {
            throw new Error('bad status code: ' + res.status);
        }

        const json = await res.json();
        console.log(json);
        return json.choices[0].text;
    } catch (err){
        console.warn(err);
    }

}


async function response(messages){
    try {
        const res = await fetch(`https://c0djsh12rf.execute-api.us-east-1.amazonaws.com/api/ai/chat/completions`, {
            method: 'POST',
            headers: {  
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                "model": "gpt-3.5-turbo",
                "messages": messages,
            })
        });

        if (!res.ok) {
            throw new Error('bad status code: ' + res.status);
        }

        const json = await res.json();
        console.log(json);
        return json.choices[0].text;
    } catch (err){
        console.warn(err);
    }
}


async function transcribe(blob, prompt, language = 'en') {
    const fd = new FormData();
    fd.append('file', blob, 'speech.webm');
    fd.append('model', 'whisper-1');
    fd.append('prompt', prompt);
    fd.append('response_format', 'verbose_json');
    fd.append('temperature', 0);
    fd.append('language', language);

    try {
    const res = await fetch(`https://c0djsh12rf.execute-api.us-east-1.amazonaws.com/api/ai/audio/transcriptions`, {
        method: 'POST',  
        body: fd,
    });

    if (!res.ok) {
        throw new Error('bad status code: ' + res.status);
    }

    const json = await res.json();
    console.log(json);

    let fullText = json.segments.map(segment => segment.text).join(' ');
    return fullText.trim();
    } catch(err) {
    console.warn(err);
    }
}