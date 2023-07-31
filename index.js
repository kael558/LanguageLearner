/*** KEYS ****/
const OPENAI_API_KEY = "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"


/**** PROMPTS ****/





/****  API HANDLING ****/
// TODO handle streaming response
let audio;
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
        audio = new Audio(url);
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
        if (audio && get_response) audio.pause();
        console.log('Handling message from user', sender, content, get_response);
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
    if (audio) audio.pause();

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



let callback = null;
function makeCallback(blob){ //yep we're doing this
    callback(blob);
}


function recordButtonClicked(button, cb, chat_mode = false) {
    if (mediaRecorder && mediaRecorder.state === 'recording' && !button.classList.contains('recording')) { // they clicking another record button
        alert('Already recording!');
        return;
    }

    callback = cb;

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
                    makeCallback(blob);
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
    (blob) => { transcribe(blob).then((text) => {chat_logs.handleMessage(scenario_id, 'from-me', text, true) }) },
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
        "name": "JFK's inaugural address",
        "sentences":  [
            "The world is very different now",
            "For man holds in his mortal hands the power to abolish all forms of human poverty and all forms of human life",
            "And yet the same revolutionary beliefs for which our forebears fought are still at issue around the globe",
            "the belief that the rights of man come not from the generosity of the state but from the hand of God",
            "We dare not forget today that we are the heirs of that first revolution",
            "Let the word go forth from this time and place, to friend and foe alike, that the torch has been passed to a new generation of Americans",
            "born in this century, tempered by war, disciplined by a hard and bitter peace, proud of our ancient heritage",
            "and unwilling to witness or permit the slow undoing of those human rights to which this nation has always been committed",
            "and to which we are committed today at home and around the world"
        ]
    }
]



const sentenceTable = document.querySelector('#sentences');
const finishPracticeButton = document.querySelector('#finish-practice-button');
let recordedSentences = [];

sentences[0].sentences.forEach((sentence, index) => {
    addTableRow(sentence, index);
});

let json_response;

function addTableRow(_sentence, _sentence_id) {
    //const sentence_obj = { sentence_id, sentence };

    const newRow = sentenceTable.insertRow();

    const sentenceCell = newRow.insertCell(0);
    sentenceCell.innerHTML = _sentence;

    sentenceCell.onclick = function() {
        display(_sentence_id);
    };

    const micCell = newRow.insertCell(1);

    const micIcon = document.createElement("i");
    micIcon.className = "fa-solid fa-microphone"; 
    micIcon.style.cursor = "pointer";
    micIcon.classList.add('mic-icon');
    micIcon.id = "mic-icon-" + _sentence_id;

    micIcon.onclick = function() {
        recordButtonClicked(
            micIcon, 
            function(blob) { 

                sentence_api(blob, _sentence_id, _sentence); 
                recordedSentences.push(_sentence_id);  
                sentenceCell.style.backgroundColor = "#7fc45c";
            }, // sends to the backend on finish
            false
        );
    }

    micCell.appendChild(micIcon);
  }


function display(id){
    if (json_response === undefined || !(id in json_response)) return;

    const sentenceData = json_response[id];

    const sentenceUser = sentenceData[0];
    const sentenceBot = sentenceData[1];
    const word_ops = sentenceData[2];
    colorizeForPronounciation(sentenceUser, sentenceBot, word_ops);
}




finishPracticeButton.addEventListener('click', async () => {
    console.log(recordedSentences);
    const promise = finish(recordedSentences);
    alert("Practice finished! Please wait for the results.");
    json_response = await promise;
    console.log(json_response);
    display(0)
});






/* Displaying words */


/*
//K W EH1 SH   AH0 N - user
//K W EH1 S CH AH0 N - bot
//('insert', 2, 3), ('replace', 3, 4)

    shift = 0
    for op in ops:
        i, j = op[1], op[2]
        if op[0] == 'delete':
            del string[i + shift]
            shift -= 1
        elif op[0] == 'insert':
            string.insert(i + shift + 1, string2[j])
            shift += 1
        elif op[0] == 'replace':
            string[i + shift] = string2[j]
        elif op[0] == 'transpose':
            string[i + shift], string[j + shift] = string[j + shift], string[
                i + shift]
*/

function createSpan(color, value){
    let span = document.createElement('span');
    span.style.color = color;
    span.innerHTML = value + " "
    return span;
}

const sentenceElem = document.getElementById('sentence');
const phonesElem = document.getElementById('phones');

function colorizeForPronounciation(lst1, lst2, ops){
    //console.log(lst1, lst2, ops);
    let words = lst2.map((obj) => createSpan('green', obj['word']));// get bot words
    
    let shift = 0;
    for (const op of ops){
        const type = op[0];
        const i = op[1];
        const j = op[2];
        if (type == 'delete'){ // user must have added a part
            shift -= 1;
        } else if (type == 'insert') { // user must have deleted a part
            words[j] = createSpan('red', words[j].innerHTML);
            shift += 1;
        } else if (type == 'replace') { // user must have replaced a part
            words[j] = createSpan('red', words[j].innerHTML);
        } else if (type == 'transpose') { // user must have transposed a part
            words[j+shift] = createSpan('red', words[j+shift].innerHTML);

        }
    }

    let index = 0;
    for (const obj2_index in lst2){ // iterate through bot responses
        let matched_word = false;
        for (const obj1_index in lst1){
            if (index >= obj1_index) continue

            if (lst1[obj1_index]["word"] == lst2[obj2_index]["word"]){ // found matching word
                index = obj1_index;
                matched_word = true;
                break;
            }
        }
        if (!matched_word){ // did not find a matching word
            continue
        }

        if (lst1[index]["phone_ops"] && lst1[index]["phone_ops"].length > 0){ // if the word has phone_ops
            words[obj2_index] = createSpan('orange', words[obj2_index].innerHTML);
        }

        let phones = lst2[obj2_index]['phones'].map((obj) => createSpan('green', obj['phone'])); // getbot phones

        shift = 0;
        //console.log(index, lst1[index], lst1[index]['phone_ops'])
        for (const op of lst1[index]['phone_ops']){
            const type = op[0];
            const i = op[1];
            const j = op[2];
            if (type == 'delete'){ // user must have added a part
                shift -= 1;
            } else if (type == 'insert') { // user must have deleted a part
                phones[j] = createSpan('red', phones[j].innerHTML); 
                shift += 1;
            } else if (type == 'replace') { // user must have replaced a part
                phones[j] = createSpan('red', phones[j].innerHTML); 
            } else if (type == 'transpose') { // user must have transposed a part
                phones[j + shift] = createSpan('red', phones[j+shift].innerHTML); 
            }
        }

        words[obj2_index].onclick = () => { 
            phonesElem.innerHTML = '';
            phones.forEach((p) => {
                phonesElem.appendChild(p);
            })
        };
    }

    sentenceElem.innerHTML = '';
    words.forEach((w) => {
        sentenceElem.appendChild(w);
    })
}

/*json_response = {
	"0": [
		[
			{
                "phone_ops": [],
				"phones": [
					{
						"phone": "DH",
						"xmax": 0.86,
						"xmin": 0.84
					},
					{
						"phone": "AH0",
						"xmax": 0.93,
						"xmin": 0.86
					}
				],
				"word": "the",
				"xmax": 0.93,
				"xmin": 0.84
			},
			{
				"phone_ops": [],
				"phones": [
					{
						"phone": "W",
						"xmax": 1.09,
						"xmin": 0.93
					},
					{
						"phone": "ER1",
						"xmax": 1.12,
						"xmin": 1.09
					},
					{
						"phone": "L",
						"xmax": 1.34,
						"xmin": 1.12
					},
					{
						"phone": "D",
						"xmax": 1.4,
						"xmin": 1.34
					}
				],
				"word": "world",
				"xmax": 1.4,
				"xmin": 0.93
			},
			{
				"phone_ops": [],
				"phones": [
					{
						"phone": "IH0",
						"xmax": 1.48,
						"xmin": 1.4
					},
					{
						"phone": "Z",
						"xmax": 1.56,
						"xmin": 1.48
					}
				],
				"word": "is",
				"xmax": 1.56,
				"xmin": 1.4
			},
			{
				"phone_ops": [],
				"phones": [
					{
						"phone": "V",
						"xmax": 1.67,
						"xmin": 1.56
					},
					{
						"phone": "EH1",
						"xmax": 1.73,
						"xmin": 1.67
					},
					{
						"phone": "R",
						"xmax": 1.83,
						"xmin": 1.73
					},
					{
						"phone": "IY0",
						"xmax": 1.94,
						"xmin": 1.83
					}
				],
				"word": "very",
				"xmax": 1.94,
				"xmin": 1.56
			},
			{
				"phone_ops": [],
				"phones": [
					{
						"phone": "D",
						"xmax": 2.04,
						"xmin": 1.94
					},
					{
						"phone": "IH1",
						"xmax": 2.12,
						"xmin": 2.04
					},
					{
						"phone": "F",
						"xmax": 2.23,
						"xmin": 2.12
					},
					{
						"phone": "R",
						"xmax": 2.26,
						"xmin": 2.23
					},
					{
						"phone": "AH0",
						"xmax": 2.29,
						"xmin": 2.26
					},
					{
						"phone": "N",
						"xmax": 2.32,
						"xmin": 2.29
					},
					{
						"phone": "T",
						"xmax": 2.35,
						"xmin": 2.32
					}
				],
				"word": "different",
				"xmax": 2.35,
				"xmin": 1.94
			},
			{
				"phone_ops": [],
				"phones": [
					{
						"phone": "N",
						"xmax": 2.45,
						"xmin": 2.35
					},
					{
						"phone": "AW1",
						"xmax": 2.81,
						"xmin": 2.45
					}
				],
				"word": "now",
				"xmax": 2.81,
				"xmin": 2.35
			}
		],
		[
			{
				"phones": [
					{
						"phone": "DH",
						"xmax": 0.23,
						"xmin": 0.21
					},
					{
						"phone": "AH0",
						"xmax": 0.28,
						"xmin": 0.23
					}
				],
				"word": "the",
				"xmax": 0.28,
				"xmin": 0.21
			},
			{
				"phones": [
					{
						"phone": "W",
						"xmax": 0.34,
						"xmin": 0.28
					},
					{
						"phone": "ER1",
						"xmax": 0.41,
						"xmin": 0.34
					},
					{
						"phone": "L",
						"xmax": 0.45,
						"xmin": 0.41
					},
					{
						"phone": "D",
						"xmax": 0.49,
						"xmin": 0.45
					}
				],
				"word": "world",
				"xmax": 0.49,
				"xmin": 0.28
			},
			{
				"phones": [
					{
						"phone": "IH0",
						"xmax": 0.53,
						"xmin": 0.49
					},
					{
						"phone": "Z",
						"xmax": 0.61,
						"xmin": 0.53
					}
				],
				"word": "is",
				"xmax": 0.61,
				"xmin": 0.49
			},
			{
				"phones": [
					{
						"phone": "V",
						"xmax": 0.67,
						"xmin": 0.61
					},
					{
						"phone": "EH1",
						"xmax": 0.78,
						"xmin": 0.67
					},
					{
						"phone": "R",
						"xmax": 0.82,
						"xmin": 0.78
					},
					{
						"phone": "IY0",
						"xmax": 0.91,
						"xmin": 0.82
					}
				],
				"word": "very",
				"xmax": 0.91,
				"xmin": 0.61
			},
			{
				"phones": [
					{
						"phone": "D",
						"xmax": 0.98,
						"xmin": 0.91
					},
					{
						"phone": "IH1",
						"xmax": 1.03,
						"xmin": 0.98
					},
					{
						"phone": "F",
						"xmax": 1.1,
						"xmin": 1.03
					},
					{
						"phone": "R",
						"xmax": 1.13,
						"xmin": 1.1
					},
					{
						"phone": "AH0",
						"xmax": 1.18,
						"xmin": 1.13
					},
					{
						"phone": "N",
						"xmax": 1.21,
						"xmin": 1.18
					},
					{
						"phone": "T",
						"xmax": 1.24,
						"xmin": 1.21
					}
				],
				"word": "different",
				"xmax": 1.24,
				"xmin": 0.91
			},
			{
				"phones": [
					{
						"phone": "N",
						"xmax": 1.28,
						"xmin": 1.24
					},
					{
						"phone": "AW1",
						"xmax": 1.57,
						"xmin": 1.28
					}
				],
				"word": "now",
				"xmax": 1.57,
				"xmin": 1.24
			}
		],
		[]
	],
	"1": [
		[
			{
				"phones": [
					{
						"phone": "F",
						"xmax": 0.58,
						"xmin": 0.48
					},
					{
						"phone": "ER0",
						"xmax": 0.62,
						"xmin": 0.58
					}
				],
				"word": "for",
				"xmax": 0.62,
				"xmin": 0.48
			},
			{
				"phone_ops": [],
				"phones": [
					{
						"phone": "M",
						"xmax": 0.71,
						"xmin": 0.62
					},
					{
						"phone": "AE1",
						"xmax": 0.93,
						"xmin": 0.71
					},
					{
						"phone": "N",
						"xmax": 1,
						"xmin": 0.93
					}
				],
				"word": "man",
				"xmax": 1,
				"xmin": 0.62
			},
			{
				"phone_ops": [],
				"phones": [
					{
						"phone": "HH",
						"xmax": 1.04,
						"xmin": 1
					},
					{
						"phone": "OW1",
						"xmax": 1.1,
						"xmin": 1.04
					},
					{
						"phone": "L",
						"xmax": 1.26,
						"xmin": 1.1
					},
					{
						"phone": "D",
						"xmax": 1.3,
						"xmin": 1.26
					},
					{
						"phone": "Z",
						"xmax": 1.35,
						"xmin": 1.3
					}
				],
				"word": "holds",
				"xmax": 1.35,
				"xmin": 1
			},
			{
				"phone_ops": [],
				"phones": [
					{
						"phone": "IH0",
						"xmax": 1.4,
						"xmin": 1.35
					},
					{
						"phone": "N",
						"xmax": 1.44,
						"xmin": 1.4
					}
				],
				"word": "in",
				"xmax": 1.44,
				"xmin": 1.35
			},
			{
				"phone_ops": [],
				"phones": [
					{
						"phone": "HH",
						"xmax": 1.45,
						"xmin": 1.44
					},
					{
						"phone": "IH0",
						"xmax": 1.51,
						"xmin": 1.45
					},
					{
						"phone": "Z",
						"xmax": 1.61,
						"xmin": 1.51
					}
				],
				"word": "his",
				"xmax": 1.61,
				"xmin": 1.44
			},
			{
				"phone_ops": [],
				"phones": [
					{
						"phone": "M",
						"xmax": 1.66,
						"xmin": 1.61
					},
					{
						"phone": "AO1",
						"xmax": 1.72,
						"xmin": 1.66
					},
					{
						"phone": "R",
						"xmax": 1.78,
						"xmin": 1.72
					},
					{
						"phone": "T",
						"xmax": 1.84,
						"xmin": 1.78
					},
					{
						"phone": "AH0",
						"xmax": 1.9,
						"xmin": 1.84
					},
					{
						"phone": "L",
						"xmax": 2.01,
						"xmin": 1.9
					}
				],
				"word": "mortal",
				"xmax": 2.01,
				"xmin": 1.61
			},
			{
				"phone_ops": [],
				"phones": [
					{
						"phone": "HH",
						"xmax": 2.02,
						"xmin": 2.01
					},
					{
						"phone": "AE1",
						"xmax": 2.16,
						"xmin": 2.02
					},
					{
						"phone": "N",
						"xmax": 2.24,
						"xmin": 2.16
					},
					{
						"phone": "D",
						"xmax": 2.3,
						"xmin": 2.24
					},
					{
						"phone": "Z",
						"xmax": 2.39,
						"xmin": 2.3
					}
				],
				"word": "hands",
				"xmax": 2.39,
				"xmin": 2.01
			},
			{
				"phone_ops": [],
				"phones": [
					{
						"phone": "DH",
						"xmax": 2.41,
						"xmin": 2.39
					},
					{
						"phone": "AH0",
						"xmax": 2.45,
						"xmin": 2.41
					}
				],
				"word": "the",
				"xmax": 2.45,
				"xmin": 2.39
			},
			{
				"phone_ops": [],
				"phones": [
					{
						"phone": "P",
						"xmax": 2.55,
						"xmin": 2.45
					},
					{
						"phone": "AW1",
						"xmax": 2.67,
						"xmin": 2.55
					},
					{
						"phone": "ER0",
						"xmax": 2.83,
						"xmin": 2.67
					}
				],
				"word": "power",
				"xmax": 2.83,
				"xmin": 2.45
			},
			{
				"phone_ops": [
					[
						"replace",
						1,
						1
					]
				],
				"phones": [
					{
						"phone": "T",
						"xmax": 2.94,
						"xmin": 2.83
					},
					{
						"phone": "AH0",
						"xmax": 3.03,
						"xmin": 2.94
					}
				],
				"word": "to",
				"xmax": 3.03,
				"xmin": 2.83
			},
			{
				"phone_ops": [],
				"phones": [
					{
						"phone": "AH0",
						"xmax": 3.07,
						"xmin": 3.03
					},
					{
						"phone": "B",
						"xmax": 3.15,
						"xmin": 3.07
					},
					{
						"phone": "AA1",
						"xmax": 3.18,
						"xmin": 3.15
					},
					{
						"phone": "L",
						"xmax": 3.36,
						"xmin": 3.18
					},
					{
						"phone": "IH0",
						"xmax": 3.41,
						"xmin": 3.36
					},
					{
						"phone": "SH",
						"xmax": 3.52,
						"xmin": 3.41
					}
				],
				"word": "abolish",
				"xmax": 3.52,
				"xmin": 3.03
			},
			{
				"phone_ops": [],
				"phones": [
					{
						"phone": "AO1",
						"xmax": 3.63,
						"xmin": 3.52
					},
					{
						"phone": "L",
						"xmax": 3.8,
						"xmin": 3.63
					}
				],
				"word": "all",
				"xmax": 3.8,
				"xmin": 3.52
			},
			{
				"phone_ops": [],
				"phones": [
					{
						"phone": "F",
						"xmax": 3.93,
						"xmin": 3.8
					},
					{
						"phone": "AO1",
						"xmax": 4.01,
						"xmin": 3.93
					},
					{
						"phone": "R",
						"xmax": 4.09,
						"xmin": 4.01
					},
					{
						"phone": "M",
						"xmax": 4.16,
						"xmin": 4.09
					},
					{
						"phone": "Z",
						"xmax": 4.21,
						"xmin": 4.16
					}
				],
				"word": "forms",
				"xmax": 4.21,
				"xmin": 3.8
			},
			{
				"phone_ops": [],
				"phones": [
					{
						"phone": "AH0",
						"xmax": 4.27,
						"xmin": 4.21
					},
					{
						"phone": "V",
						"xmax": 4.39,
						"xmin": 4.27
					}
				],
				"word": "of",
				"xmax": 4.39,
				"xmin": 4.21
			},
			{
				"phone_ops": [],
				"phones": [
					{
						"phone": "HH",
						"xmax": 4.4,
						"xmin": 4.39
					},
					{
						"phone": "Y",
						"xmax": 4.43,
						"xmin": 4.4
					},
					{
						"phone": "UW1",
						"xmax": 4.48,
						"xmin": 4.43
					},
					{
						"phone": "M",
						"xmax": 4.54,
						"xmin": 4.48
					},
					{
						"phone": "AH0",
						"xmax": 4.57,
						"xmin": 4.54
					},
					{
						"phone": "N",
						"xmax": 4.64,
						"xmin": 4.57
					}
				],
				"word": "human",
				"xmax": 4.64,
				"xmin": 4.39
			},
			{
				"phone_ops": [],
				"phones": [
					{
						"phone": "P",
						"xmax": 4.75,
						"xmin": 4.64
					},
					{
						"phone": "AA1",
						"xmax": 4.84,
						"xmin": 4.75
					},
					{
						"phone": "V",
						"xmax": 4.87,
						"xmin": 4.84
					},
					{
						"phone": "ER0",
						"xmax": 5,
						"xmin": 4.87
					},
					{
						"phone": "T",
						"xmax": 5.09,
						"xmin": 5
					},
					{
						"phone": "IY0",
						"xmax": 5.34,
						"xmin": 5.09
					}
				],
				"word": "poverty",
				"xmax": 5.34,
				"xmin": 4.64
			},
			{
				"phone_ops": [],
				"phones": [
					{
						"phone": "AE1",
						"xmax": 5.48,
						"xmin": 5.45
					},
					{
						"phone": "N",
						"xmax": 5.51,
						"xmin": 5.48
					},
					{
						"phone": "D",
						"xmax": 5.55,
						"xmin": 5.51
					}
				],
				"word": "and",
				"xmax": 5.55,
				"xmin": 5.45
			},
			{
				"phone_ops": [],
				"phones": [
					{
						"phone": "AO1",
						"xmax": 5.69,
						"xmin": 5.55
					},
					{
						"phone": "L",
						"xmax": 5.73,
						"xmin": 5.69
					}
				],
				"word": "all",
				"xmax": 5.73,
				"xmin": 5.55
			},
			{
				"phone_ops": [],
				"phones": [
					{
						"phone": "F",
						"xmax": 5.89,
						"xmin": 5.73
					},
					{
						"phone": "AO1",
						"xmax": 5.96,
						"xmin": 5.89
					},
					{
						"phone": "R",
						"xmax": 6.02,
						"xmin": 5.96
					},
					{
						"phone": "M",
						"xmax": 6.11,
						"xmin": 6.02
					},
					{
						"phone": "Z",
						"xmax": 6.19,
						"xmin": 6.11
					}
				],
				"word": "forms",
				"xmax": 6.19,
				"xmin": 5.73
			},
			{
				"phone_ops": [],
				"phones": [
					{
						"phone": "AH0",
						"xmax": 6.24,
						"xmin": 6.19
					},
					{
						"phone": "V",
						"xmax": 6.35,
						"xmin": 6.24
					}
				],
				"word": "of",
				"xmax": 6.35,
				"xmin": 6.19
			},
			{
				"phone_ops": [],
				"phones": [
					{
						"phone": "HH",
						"xmax": 6.36,
						"xmin": 6.35
					},
					{
						"phone": "Y",
						"xmax": 6.4,
						"xmin": 6.36
					},
					{
						"phone": "UW1",
						"xmax": 6.46,
						"xmin": 6.4
					},
					{
						"phone": "M",
						"xmax": 6.53,
						"xmin": 6.46
					},
					{
						"phone": "AH0",
						"xmax": 6.56,
						"xmin": 6.53
					},
					{
						"phone": "N",
						"xmax": 6.62,
						"xmin": 6.56
					}
				],
				"word": "human",
				"xmax": 6.62,
				"xmin": 6.35
			},
			{
				"phone_ops": [],
				"phones": [
					{
						"phone": "L",
						"xmax": 6.69,
						"xmin": 6.62
					},
					{
						"phone": "AY1",
						"xmax": 6.73,
						"xmin": 6.69
					},
					{
						"phone": "F",
						"xmax": 7.06,
						"xmin": 6.73
					}
				],
				"word": "life",
				"xmax": 7.06,
				"xmin": 6.62
			}
		],
		[
			{
				"phones": [
					{
						"phone": "F",
						"xmax": 0.22,
						"xmin": 0.15
					},
					{
						"phone": "ER0",
						"xmax": 0.3,
						"xmin": 0.22
					}
				],
				"word": "for",
				"xmax": 0.3,
				"xmin": 0.15
			},
			{
				"phones": [
					{
						"phone": "M",
						"xmax": 0.39,
						"xmin": 0.3
					},
					{
						"phone": "AE1",
						"xmax": 0.57,
						"xmin": 0.39
					},
					{
						"phone": "N",
						"xmax": 0.63,
						"xmin": 0.57
					}
				],
				"word": "man",
				"xmax": 0.63,
				"xmin": 0.3
			},
			{
				"phones": [
					{
						"phone": "HH",
						"xmax": 0.69,
						"xmin": 0.63
					},
					{
						"phone": "OW1",
						"xmax": 0.74,
						"xmin": 0.69
					},
					{
						"phone": "L",
						"xmax": 0.87,
						"xmin": 0.74
					},
					{
						"phone": "D",
						"xmax": 0.93,
						"xmin": 0.87
					},
					{
						"phone": "Z",
						"xmax": 0.96,
						"xmin": 0.93
					}
				],
				"word": "holds",
				"xmax": 0.96,
				"xmin": 0.63
			},
			{
				"phones": [
					{
						"phone": "IH0",
						"xmax": 1,
						"xmin": 0.96
					},
					{
						"phone": "N",
						"xmax": 1.05,
						"xmin": 1
					}
				],
				"word": "in",
				"xmax": 1.05,
				"xmin": 0.96
			},
			{
				"phones": [
					{
						"phone": "HH",
						"xmax": 1.06,
						"xmin": 1.05
					},
					{
						"phone": "IH0",
						"xmax": 1.13,
						"xmin": 1.06
					},
					{
						"phone": "Z",
						"xmax": 1.23,
						"xmin": 1.13
					}
				],
				"word": "his",
				"xmax": 1.23,
				"xmin": 1.05
			},
			{
				"phones": [
					{
						"phone": "M",
						"xmax": 1.35,
						"xmin": 1.23
					},
					{
						"phone": "AO1",
						"xmax": 1.42,
						"xmin": 1.35
					},
					{
						"phone": "R",
						"xmax": 1.47,
						"xmin": 1.42
					},
					{
						"phone": "T",
						"xmax": 1.5,
						"xmin": 1.47
					},
					{
						"phone": "AH0",
						"xmax": 1.55,
						"xmin": 1.5
					},
					{
						"phone": "L",
						"xmax": 1.62,
						"xmin": 1.55
					}
				],
				"word": "mortal",
				"xmax": 1.62,
				"xmin": 1.23
			},
			{
				"phones": [
					{
						"phone": "HH",
						"xmax": 1.63,
						"xmin": 1.62
					},
					{
						"phone": "AE1",
						"xmax": 1.79,
						"xmin": 1.63
					},
					{
						"phone": "N",
						"xmax": 1.83,
						"xmin": 1.79
					},
					{
						"phone": "D",
						"xmax": 1.88,
						"xmin": 1.83
					},
					{
						"phone": "Z",
						"xmax": 1.91,
						"xmin": 1.88
					}
				],
				"word": "hands",
				"xmax": 1.91,
				"xmin": 1.62
			},
			{
				"phones": [
					{
						"phone": "DH",
						"xmax": 1.93,
						"xmin": 1.91
					},
					{
						"phone": "AH0",
						"xmax": 1.99,
						"xmin": 1.93
					}
				],
				"word": "the",
				"xmax": 1.99,
				"xmin": 1.91
			},
			{
				"phones": [
					{
						"phone": "P",
						"xmax": 2.13,
						"xmin": 1.99
					},
					{
						"phone": "AW1",
						"xmax": 2.24,
						"xmin": 2.13
					},
					{
						"phone": "ER0",
						"xmax": 2.35,
						"xmin": 2.24
					}
				],
				"word": "power",
				"xmax": 2.35,
				"xmin": 1.99
			},
			{
				"phones": [
					{
						"phone": "T",
						"xmax": 2.46,
						"xmin": 2.35
					},
					{
						"phone": "UW1",
						"xmax": 2.51,
						"xmin": 2.46
					}
				],
				"word": "to",
				"xmax": 2.51,
				"xmin": 2.35
			},
			{
				"phones": [
					{
						"phone": "AH0",
						"xmax": 2.58,
						"xmin": 2.51
					},
					{
						"phone": "B",
						"xmax": 2.67,
						"xmin": 2.58
					},
					{
						"phone": "AA1",
						"xmax": 2.79,
						"xmin": 2.67
					},
					{
						"phone": "L",
						"xmax": 2.84,
						"xmin": 2.79
					},
					{
						"phone": "IH0",
						"xmax": 2.9,
						"xmin": 2.84
					},
					{
						"phone": "SH",
						"xmax": 2.99,
						"xmin": 2.9
					}
				],
				"word": "abolish",
				"xmax": 2.99,
				"xmin": 2.51
			},
			{
				"phones": [
					{
						"phone": "AO1",
						"xmax": 3.18,
						"xmin": 2.99
					},
					{
						"phone": "L",
						"xmax": 3.22,
						"xmin": 3.18
					}
				],
				"word": "all",
				"xmax": 3.22,
				"xmin": 2.99
			},
			{
				"phones": [
					{
						"phone": "F",
						"xmax": 3.31,
						"xmin": 3.22
					},
					{
						"phone": "AO1",
						"xmax": 3.35,
						"xmin": 3.31
					},
					{
						"phone": "R",
						"xmax": 3.44,
						"xmin": 3.35
					},
					{
						"phone": "M",
						"xmax": 3.5,
						"xmin": 3.44
					},
					{
						"phone": "Z",
						"xmax": 3.56,
						"xmin": 3.5
					}
				],
				"word": "forms",
				"xmax": 3.56,
				"xmin": 3.22
			},
			{
				"phones": [
					{
						"phone": "AH0",
						"xmax": 3.6,
						"xmin": 3.56
					},
					{
						"phone": "V",
						"xmax": 3.7,
						"xmin": 3.6
					}
				],
				"word": "of",
				"xmax": 3.7,
				"xmin": 3.56
			},
			{
				"phones": [
					{
						"phone": "HH",
						"xmax": 3.71,
						"xmin": 3.7
					},
					{
						"phone": "Y",
						"xmax": 3.75,
						"xmin": 3.71
					},
					{
						"phone": "UW1",
						"xmax": 3.79,
						"xmin": 3.75
					},
					{
						"phone": "M",
						"xmax": 3.83,
						"xmin": 3.79
					},
					{
						"phone": "AH0",
						"xmax": 3.86,
						"xmin": 3.83
					},
					{
						"phone": "N",
						"xmax": 3.93,
						"xmin": 3.86
					}
				],
				"word": "human",
				"xmax": 3.93,
				"xmin": 3.7
			},
			{
				"phones": [
					{
						"phone": "P",
						"xmax": 4,
						"xmin": 3.93
					},
					{
						"phone": "AA1",
						"xmax": 4.12,
						"xmin": 4
					},
					{
						"phone": "V",
						"xmax": 4.16,
						"xmin": 4.12
					},
					{
						"phone": "ER0",
						"xmax": 4.25,
						"xmin": 4.16
					},
					{
						"phone": "T",
						"xmax": 4.31,
						"xmin": 4.25
					},
					{
						"phone": "IY0",
						"xmax": 4.53,
						"xmin": 4.31
					}
				],
				"word": "poverty",
				"xmax": 4.53,
				"xmin": 3.93
			},
			{
				"phones": [
					{
						"phone": "AE1",
						"xmax": 4.91,
						"xmin": 4.83
					},
					{
						"phone": "N",
						"xmax": 4.94,
						"xmin": 4.91
					},
					{
						"phone": "D",
						"xmax": 4.98,
						"xmin": 4.94
					}
				],
				"word": "and",
				"xmax": 4.98,
				"xmin": 4.83
			},
			{
				"phones": [
					{
						"phone": "AO1",
						"xmax": 5.15,
						"xmin": 4.98
					},
					{
						"phone": "L",
						"xmax": 5.2,
						"xmin": 5.15
					}
				],
				"word": "all",
				"xmax": 5.2,
				"xmin": 4.98
			},
			{
				"phones": [
					{
						"phone": "F",
						"xmax": 5.27,
						"xmin": 5.2
					},
					{
						"phone": "AO1",
						"xmax": 5.3,
						"xmin": 5.27
					},
					{
						"phone": "R",
						"xmax": 5.37,
						"xmin": 5.3
					},
					{
						"phone": "M",
						"xmax": 5.43,
						"xmin": 5.37
					},
					{
						"phone": "Z",
						"xmax": 5.48,
						"xmin": 5.43
					}
				],
				"word": "forms",
				"xmax": 5.48,
				"xmin": 5.2
			},
			{
				"phones": [
					{
						"phone": "AH0",
						"xmax": 5.52,
						"xmin": 5.48
					},
					{
						"phone": "V",
						"xmax": 5.62,
						"xmin": 5.52
					}
				],
				"word": "of",
				"xmax": 5.62,
				"xmin": 5.48
			},
			{
				"phones": [
					{
						"phone": "HH",
						"xmax": 5.63,
						"xmin": 5.62
					},
					{
						"phone": "Y",
						"xmax": 5.67,
						"xmin": 5.63
					},
					{
						"phone": "UW1",
						"xmax": 5.71,
						"xmin": 5.67
					},
					{
						"phone": "M",
						"xmax": 5.74,
						"xmin": 5.71
					},
					{
						"phone": "AH0",
						"xmax": 5.78,
						"xmin": 5.74
					},
					{
						"phone": "N",
						"xmax": 5.86,
						"xmin": 5.78
					}
				],
				"word": "human",
				"xmax": 5.86,
				"xmin": 5.62
			},
			{
				"phones": [
					{
						"phone": "L",
						"xmax": 5.91,
						"xmin": 5.86
					},
					{
						"phone": "AY1",
						"xmax": 6.09,
						"xmin": 5.91
					},
					{
						"phone": "F",
						"xmax": 6.32,
						"xmin": 6.09
					}
				],
				"word": "life",
				"xmax": 6.32,
				"xmin": 5.86
			}
		],
		[]
	]
}
recordedSentences = [0, 1]
display(0)*/
