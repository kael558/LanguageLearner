/*** KEYS ****/
const OPENAI_API_KEY = "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"


/**** PROMPTS ****/





/****  API HANDLING ****/
// TODO handle streaming response
async function textToSpeech(text, voice_id='21m00Tcm4TlvDq8ikWAM'){
    try {
        const res = await fetch('http://localhost:5000/tts', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              text, voice_id
            })
          })
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob);
        const audio = new Audio(url);
        audio.play();
    } catch (err){
        console.log(err);
    }
    return true;
}

async function response(messages){
    try {
        const res = await fetch(`http://localhost:5000/completions`, {
            method: 'POST',
            headers: {  
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "messages": messages,
            })
        });

        if (!res.ok) {
            console.log(JSON.stringify(res));
            throw new Error('bad status code: ' + res.status);
        }

        const json = await res.json();
        return json.choices[0].message.content;
    } catch (err){
        console.warn(err);
    }
    return ""

}


async function transcribe(audioData, prompt = '', language = 'en') {
    var reader = new FileReader();
    reader.readAsDataURL(audioData)
    return new Promise((resolve, reject) => {
        reader.onloadend = async function() {
            // Send base64 string data backend service
            const res = await fetch('http://localhost:5000/whisper', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({audio: reader.result})
            })

            if (!res.ok) {
                console.log(res);
                throw new Error('bad status code: ' + res.status);
            }

            const json = await res.json();
            resolve(json.text);
        }
      }) 
}

async function sentence_api(audioData, sentence_id, sentence, voice_id='21m00Tcm4TlvDq8ikWAM') {
    var reader = new FileReader();
    reader.readAsDataURL(audioData)
    return new Promise((resolve, reject) => {
        reader.onloadend = async function() {
            // Send base64 string data backend service
            const res = await fetch('http://localhost:5000/sentence', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({audio: reader.result, sentence_id, sentence, voice_id})
            })

            if (!res.ok) {
                console.log(res);
                throw new Error('bad status code: ' + res.status);
            }

            const json = await res.json();
            resolve(json.text);
        }
    }) 
}

async function finish(sentence_ids) {

    try {
        const res = await fetch(`http://localhost:5000/finish`, {
            method: 'POST',
            headers: {  
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({sentence_ids})
        });

        if (!res.ok) {
            console.log(JSON.stringify(res));
            throw new Error('bad status code: ' + res.status);
        }

        const json = await res.json();
        return json;
    } catch (err){
        console.warn(err);
    }
    return {}
}


/****  Scenarios ****/
const scenarios = [
    {
        "id": 0,
        "title": "Order a baguette from a bakery",
        "description": "You are at a bakery and want to order a baguette.",
        "image": "bakery.png",
        "first_message": "Hello, how can I help you?",
        "agent_personality": "You are a friendly bakery employee at a local bakery. You are very helpful and want to make sure the customer is satisfied.",
        "voice_id": "21m00Tcm4TlvDq8ikWAM"
    },
    {
        "id": 1,
        "title": "Cancel your phone plan",
        "description": "You want to cancel your phone plan. The customer service is very unhelpful",
        "image": "phone.png",
        "first_message": "Welcome to our customer service. How can I help you?",
        "agent_personality": "You are a customer service agent for a phone provider service. You are very unhelpful and want to make sure the customer is not satisfied. You keep trying to sell them more products instead of cancelling their service like they want.",
        "voice_id": "2EiwWnXFnvU5JabPnv8n"

    },
    {
        "id": 2,
        "title": "Order a pizza",
        "description": "You want to order a pizza. The pizza place is very busy and the employee is very stressed.",
        "image": "pizza.png",
        "first_message": "Hello this is Bob's pizza.",
        "agent_personality": "You are a pizza place employee. You are very stressed and busy. You want to make sure the customer is satisfied but you are very busy and stressed.",
        "voice_id": "pMsXgVXv3BLzUgSXRplE"
    },
    {
        "id": 3,
        "title": "Take a job interview",
        "description": "You are interviewing for the position of {job_title}. The interviewer is very nice. ",
        "image": "job_interview.png",
        "first_message": "Hi, welcome to the interview. Tell me about yourself.",
        "agent_personality": "You are a job interviewer. You are very nice and want to make sure the interviewee is comfortable. You want to make sure the interviewee is satisfied and wants to work for your company.",
        "voice_id": "pNInz6obpgDQGcFmaJgB"
    }
]

/****  Chat Logs ****/
class ChatLogs {
    constructor() {
        this.loading_assistant_msg = false;
        this.loading_user_msg = false;

        this.messages = {};
        for (const scenario of scenarios) {
            this.messages[scenario.id] = [
            {
                sender: 'system',
                content: scenario.agent_personality,
            }, 
            {
                sender: 'from-bot',
                content: scenario.first_message,
            }];
        }
    }

    clearChatLog(scenario_id) {
        this.messages[scenario_id] = [];
    }

    sendMessage(scenario_id, message){
        // append the message to the chat
        this.messages[scenario_id].push(message);

        if (message.sender == "from-me"){
            this.evaluate(scenario_id, message)
        }
    }

    getChatLog(scenario_id) {
        return this.messages[scenario_id];
    }

    // Gets message from bot
    async getResponse(scenario_id) {
        console.log('Getting response from bot');
        this.loading_assistant_msg = true;

        let messages = this.messages[scenario_id].map((message) => { 
            if (message.sender == "from-user"){
                return {"role": "user", "content": message.content}
            } else if (message.sender == "from-bot"){
                return {"role": "assistant", "content": message.content}
            } 
            return {"role": "system", "content": message.content}
        });

        const res = await response(messages);
        await textToSpeech(res, scenarios[scenario_id].voice_id); // wait for tts to start

        this.loading_assistant_msg = false;
        this.handleMessage(scenario_id, 'from-bot', res,  false);
    }

    // Handles message from user
    handleMessage(scenario_id, sender, content, get_response=true){
        chat_logs.loading_user_msg = false;
        let message = {
            sender, content,
            timestamp: new Date(),
        };

        this.sendMessage(scenario_id, message);
    
        // starts an asynchronous process to get the response
        if (get_response) this.getResponse(scenario_id);
        this.render(scenario_id);
    } 

    async evaluate(scenario_id, message){
        let conversation = this.messages[scenario_id].map((message) => {
            if (message.sender == "from-user"){
                return "user:" + message.content + " ";
            } else if (message.sender == "from-bot"){
                return "assistant:" + message.content + " ";
            } 
            return null;
        });

        conversation = conversation.filter((message) => message != null);

        const messages = [
            {
                "role": "system",
                "content": "Correct any mistakes in the user's LAST response. Look for spelling, grammar, and punctuation errors. Then output the correct sentence. If there are no mistakes, output 'No mistakes.'"
            },
            {
                "role": "assistant",
                "content": `The user is trying to ${scenarios[scenario_id].title}. Here is the conversation so far:\n` + conversation.slice(0, -1).join("\n")
            },
            {
                "role": "user",
                "content": conversation.pop()
            }
        ]

        message.evaluation = await response(messages);
    }


    render(scenario_id) {
        document.querySelector('#chat-messages').innerHTML = '';
        for (const message of this.messages[scenario_id]) {
            if (message.sender == 'system') continue;

            let messageEl = document.createElement('div');
            messageEl.classList.add(message.sender);
            messageEl.innerHTML = message.content;
            document.querySelector('#chat-messages').appendChild(messageEl);
        }

        if (this.loading_assistant_msg || this.loading_user_msg) {
            let loadingEl = document.createElement('div');
            loadingEl.classList.add(this.loading_assistant_msg ? 'from-bot' : 'from-me');
            loadingEl.classList.add('loading');
            loadingEl.innerHTML = '.';
            document.querySelector('#chat-messages').appendChild(loadingEl);
        }
    }
}


/****  Handling HTML *****/
const chat_logs = new ChatLogs();

// Selectors
const conversationTab = document.querySelector('#conversation-tab');
const practiceTab = document.querySelector('#practice-tab');

const conversationTabContent = document.querySelector('#conversation-tab-content');
const practiceTabContent = document.querySelector('#practice-tab-content');

const scenariosContainer = document.querySelector('#scenarios-container');
const chatContainer = document.querySelector('#chat-container');

const backToScenariosButton = document.querySelector('#back-to-scenarios-button');
const resetScenarioButton = document.querySelector('#reset-scenario-button');
const finishScenarioButton = document.querySelector('#finish-scenario-button');

// Render variables
let tab = 'conversation'; // conversation or practice
let scenario_id = null; 


// Initial render
const scenariosElement = document.querySelector('#scenarios');
scenarios.forEach(scenario => {
    let scenarioElement = document.createElement('div');
    scenarioElement.innerHTML = `
        <div class="scenario" onclick="chooseScenario(${scenario.id})">
        <img src="./public/images/${scenario.image}" alt="${scenario.title}" class="scenario-img" >
        <div class="scenario-info">
        <h3>${scenario.title}</h3>
        <p>${scenario.description}</p>
        </div>
    `
    scenariosElement.appendChild(scenarioElement);
});

// Re-Render function
function render(){
    if (tab === 'conversation'){
        practiceTabContent.style.display = 'none';
        conversationTabContent.style.display = 'block';
        conversationTab.classList.add('active');
        practiceTab.classList.remove('active');
    } else if (tab === 'practice'){
        practiceTabContent.style.display = 'block';
        conversationTabContent.style.display = 'none';
        practiceTab.classList.add('active');
        conversationTab.classList.remove('active');
    }


    if (scenario_id == null){
        scenariosContainer.style.display = 'block';
        chatContainer.style.display = 'none';
    } else {
        scenariosContainer.style.display = 'none';
        chatContainer.style.display = 'block';
        chat_logs.render(scenario_id);
    }
}


// Tab Switching
conversationTab.addEventListener('click', () => {
    tab = 'conversation';
    render();
});

practiceTab.addEventListener('click', () => {
    tab = 'practice';
    render();
});


function chooseScenario(id){
    console.log('Choosing scenario', id);
    scenario_id = id;
    document.querySelector('#scenario-title').innerHTML = scenarios[id].title;
    document.querySelector('#scenario-description').innerHTML = scenarios[id].description;
    render();
}


backToScenariosButton.addEventListener('click', () => {
    scenario_id = null;
    render();
});

resetScenarioButton.addEventListener('click', () => {
    chat_logs.clearChatLog(scenario_id);
    document.getElementById("notes").innerHTML = "";
    render();
});

finishScenarioButton.addEventListener('click', () => {
    const notesElem = document.getElementById("notes");
    let h4 = document.createElement("h4");
    h4.textContent = "NOTES:\n";
    notesElem.appendChild(h4);

    chat_logs.getChatLog(scenario_id).forEach(async (message) => {
        console.log(message);
        if (message.sender == "from-me"){
            const eval = await message.evaluation;
            let p = document.createElement("p");
            p.textContent = "\"" + message.content + "\" -> " + eval + "\n";
            notesElem.appendChild(p);
        }
    });
});



render();

/* Chat Log re-rendering */
// Handle audio recording
let mediaRecorder;

const recordButton = document.getElementById('recordButtonConversation');

let gotPermissions = false;
let chunks = [];

function recordButtonClicked(button, cb, chat_mode = false) {
    if (mediaRecorder && mediaRecorder.state === 'recording' && !button.classList.contains('recording')) { // they clicking another record button
        alert('Already recording!');
        return;
    }

    if (!gotPermissions) {
        navigator.mediaDevices.getUserMedia({ audio: true, video: false })
            .then(stream => {
                mediaRecorder = new MediaRecorder(stream, {mimeType: 'audio/webm'});
            
                mediaRecorder.ondataavailable = (event) => {
                    if (event.data && event.data.size > 0) {
                        chunks.push(event.data);
                    }
                };

                mediaRecorder.onstop = (event) => {
                    const blob = new Blob(chunks, {type: 'audio/webm'});
                    cb(blob);
   

                    chunks = [];
                };

                
                gotPermissions = true;
                if (chat_mode){
                    chat_logs.loading_user_msg = true;
                    render();
                }

                mediaRecorder.start();
                button.classList.add('recording');
            })
            .catch(error => console.error('getUserMedia() error:', error));
    } else if (button.classList.contains('recording')) { //is recording
        mediaRecorder.stop();
        button.classList.remove('recording');
    } else if (gotPermissions) { //is not recording and have permissons
        mediaRecorder.start();
        button.classList.add('recording');
        if (chat_mode) chat_logs.loading_user_msg = true;
    }
}

recordButton.onclick = () => recordButtonClicked(recordButton, 
    (blob) => { transcribe(blob).then((text) => {chat_logs.handleMessage(scenario_id, 'from-me', text, false) }) },
    true
);


// Handle text message submission
document.querySelector('#submit-button').addEventListener('click', () => {
    let chatInputField = document.querySelector('#chat-input-field');

    // Add the message to the chat
    if (chatInputField.value.trim() !== '') {
        chat_logs.handleMessage(scenario_id, 'from-me', chatInputField.value.trim(), true);
    }
    chatInputField.value = '';
});

document.querySelector('#chat-input-field').addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        document.querySelector('#submit-button').click();
    }
});

/* Sentence HTML stuff */
let sentences = [
    {
        "name": "Hamlet's soliloquy",
        "sentences":  [
            "To be, or not to be, that is the question:",
            "Whether 'tis nobler in the mind to suffer",
            "The slings and arrows of outrageous fortune,",
            "Or to take arms against a sea of troubles",
            "And by opposing end them. To die—to sleep,",
            "No more; and by a sleep to say we end",
            "The heart-ache and the thousand natural shocks",
            "That flesh is heir to: 'tis a consummation",
            "Devoutly to be wish'd. To die, to sleep;"
        ]
    }
]


const sentenceTable = document.querySelector('#sentences');
const finishPracticeButton = document.querySelector('#finish-practice-button');
let recordedSentences = [];

sentences[0].sentences.forEach((sentence, index) => {
    addTableRow(sentence, index);
});

function addTableRow(sentence, sentence_id) {
    var newRow = sentenceTable.insertRow();

    var sentenceCell = newRow.insertCell(0);
    sentenceCell.innerHTML = sentence;

    var micCell = newRow.insertCell(1);


    var micIcon = document.createElement("i");
    micIcon.className = "fa-solid fa-microphone"; // Assuming you have Font Awesome or a similar library for icons
    micIcon.style.cursor = "pointer";
    micIcon.classList.add('mic-icon');
    micIcon.onclick = () => recordButtonClicked(micIcon, 
        (blob) => { sentence_api(blob, sentence_id, sentence); recordedSentences.push(sentence_id); }, // sends to the backend on finish
        false
    );

    micCell.appendChild(micIcon);
  }

  finishPracticeButton.addEventListener('click', () => {
    const json = finish(recordedSentences);
    console.log(json);
    alert("Practice finished! Please wait for the results.");
  });