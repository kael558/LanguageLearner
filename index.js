/*** KEYS ****/


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
		return await res.blob()


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


async function transcribe(audioData, sentence_id=false, prompt = '', language = 'en') {

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

let audioFiles = {};

async function sentence_api(audioData, sentence_id, sentence, voice_id='21m00Tcm4TlvDq8ikWAM') { 
	if (!audioFiles[sentence_id]) audioFiles[sentence_id] = {};
	audioFiles[sentence_id]['user'] = new Audio(window.URL.createObjectURL(audioData));

	var reader = new FileReader();
    reader.readAsDataURL(audioData);
    
    return new Promise((resolve, reject) => {
        reader.onloadend = async function() {
            const botAudioBlob = await textToSpeech(sentence, voice_id);
            let botAudioReader = new FileReader();
            botAudioReader.readAsDataURL(botAudioBlob);

            botAudioReader.onloadend = async function() {
                // Send base64 string data backend service
                const res = await fetch('http://localhost:5000/sentence', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({audio: reader.result, 
                                          botAudio: botAudioReader.result,
                                          sentence_id, 
                                          sentence, 
                                          voice_id})
                });

                if (!res.ok) {
                    console.log(res);
                    reject('bad status code: ' + res.status);
                }

				//put audio into audioFiles
				const botUrl = window.URL.createObjectURL(botAudioBlob);
				audioFiles[sentence_id]['bot'] = new Audio(botUrl);
				
                const json = await res.json();
                resolve(json.text);
            }

            botAudioReader.onerror = (error) => {
                reject(error);
            };
        }

        reader.onerror = (error) => {
            reject(error);
        };
    }); 
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
let roleplay_audio = null;
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
        const audioBlob = await textToSpeech(res, scenarios[scenario_id].voice_id); // wait for tts to start
        const url = window.URL.createObjectURL(audioBlob);
        roleplay_audio = new Audio(url);
		roleplay_audio.play();
		roleplay_audio.onended = () => {
			roleplay_audio = null;
		};

        this.loading_assistant_msg = false;
        this.handleMessage(scenario_id, 'from-bot', res,  false);
    }

    // Handles message from user
    handleMessage(scenario_id, sender, content, get_response=true){
        if (roleplay_audio && get_response) roleplay_audio.pause();
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
                "content": "Correct any mistakes in the user's LAST response. Look for spelling, grammar, and punctuation errors. Be very nitpicky and then write the corrected version of the sentence. If there are no mistakes, output 'No mistakes. Well done.'"
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
    if (roleplay_audio) roleplay_audio.pause();

    chat_logs.getChatLog(scenario_id).forEach(async (message) => {
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


let chosen_sentence_id = 0;
function display(id){
    if (json_response === undefined || !(id in json_response)) return;
	chosen_sentence_id = id;
    const json = json_response[id];

    colorizeForPronounciation(json);
}

let valid;
finishPracticeButton.addEventListener('click', async () => {
	if (recordedSentences.length == 0) {
		alert("You haven't recorded any sentences!");
		return;
	}
    const promise = finish(recordedSentences);
    alert("Practice finished! Please wait for the results...");
    json_response = await promise;
    //json_response = valid;
	alert("Results are ready! Please click on the sentences to see the results.")
    console.log(json_response);
    display(recordedSentences[0])
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

function colorizeForPronounciation(words){
	sentenceElem.innerHTML = "";
	for (const word_obj of words){
		let span;
		if ('ops' in word_obj){ // word had problem with position
			span = createSpan('red', word_obj['word']);
			span.addEventListener('mouseover', function(e) {
				const tooltip = document.createElement('div');
				tooltip.style.top = e.pageY + 'px';
				tooltip.style.left = e.pageX + 'px';
				tooltip.style.display = 'block';
				tooltip.id = 'tooltip';
				
				tooltip.innerHTML = word_obj['ops'].join('<br>');
				document.body.appendChild(tooltip);
			});
			
			span.addEventListener('mouseout', function() {
				const tooltip = document.getElementById('tooltip');
				if (tooltip) {
					tooltip.parentNode.removeChild(tooltip);
				}
			});
		} else { // no problem with word position
			span = createSpan('green', word_obj['word']);
		}

		let phoneSpans =[]
		for (const phone_obj of word_obj['phones']){
			let phoneSpan;
			if ('ops' in phone_obj){ // phone had problem
				phoneSpan = createSpan('red', phone_obj['phone']);
				phoneSpan.addEventListener('mouseover', function(e) {
					const tooltip = document.createElement('div');
					tooltip.style.top = e.pageY + 'px';
					tooltip.style.left = e.pageX + 'px';
					tooltip.style.display = 'block';
					tooltip.id = 'tooltip';
					tooltip.innerHTML = phone_obj['ops'].join('<br>');
					document.body.appendChild(tooltip);
				});
				
				phoneSpan.addEventListener('mouseout', function() {
					const tooltip = document.getElementById('tooltip');
					if (tooltip) {
						tooltip.parentNode.removeChild(tooltip);
					}
				});

				span.style.color = 'orange';
			} else {
				phoneSpan = createSpan('green', phone_obj['phone']);
			}
			phoneSpan.style.padding = '6px';
			phoneSpans.push(phoneSpan);
		}

		span.onclick = function() {
			phonesElem.innerHTML = '';
			phoneSpans.forEach(phoneSpan => phonesElem.appendChild(phoneSpan));
		}

		sentenceElem.appendChild(span);
	}
}

/* AUDIO CONTROL */
const playElevenLabsButton = document.getElementById('play-elevenlabs-audio');
const playYourAudioButton = document.getElementById('play-your-audio');
const stopAudio = document.getElementById('stop-audio');

playElevenLabsButton.onclick = () => playAudio(chosen_sentence_id, 'bot');
playYourAudioButton.onclick = () => playAudio(chosen_sentence_id, 'user');
stopAudio.onclick = () => stopAudioFn();

let highlightedText = "";

function getHighlightedWords() {
	if (window.getSelection) {
		highlightedText = window.getSelection().toString().trim();
	}
	const words = highlightedText.split(/\s+/);
	return words;

}

function playAudio(sentence_id, type){
	stopAudio.disabled = false;
	const words = getHighlightedWords();
	if (words.length === 0){
		alert("Please highlight the words you want to hear!");
		return;
	}

	const keyMin = (type === 'bot') ? 'matched_xmin' : 'xmin';
	const keyMax = (type === 'bot') ? 'matched_xmax' : 'xmax';
 
	let startTime;

	let json_index = 0;
	let word_index = 0;
	while (word_index < words.length){
		if (json_response[sentence_id][json_index]['word'] !== words[word_index]){
			startTime = undefined;
		} else { // if match
			if (startTime === undefined) startTime = json_response[sentence_id][json_index][keyMin];
			word_index++;
		}
		json_index++;
	}
	let endTime = json_response[sentence_id][json_index - 1][keyMax];

	audio = audioFiles[sentence_id][type];
	audio.currentTime = startTime;
	audio.play();


	audio.addEventListener('timeupdate', function() {
		console.log(audio.currentTime, endTime);
		if (audio.currentTime >= endTime) {
			console.log("stopping!");
			stopAudioFn();
			audio.removeEventListener('timeupdate', arguments.callee);
		}
	});

	audio.addEventListener('ended', () => {
		// The audio has finished playing, you can perform actions here.
		stopAudio.disabled = true;
		audio.removeEventListener('ended', arguments.callee);
	});
}

function stopAudioFn(){
	if (audio && !audio.paused) audio.pause();
	stopAudio.disabled = true;
}


/*
valid = 
{
	1: [{'matched_xmax': 0.33,
	'matched_xmin': 0.15,
	'phones': [{'phone': 'F', 'xmax': 1.13, 'xmin': 1.02},
			   {'phone': 'ER0', 'xmax': 1.19, 'xmin': 1.13}],
	'word': 'for',
	'xmax': 1.19,
	'xmin': 1.02},
   {'matched_xmax': 0.6,
	'matched_xmin': 0.33,
	'phones': [{'phone': 'M', 'xmax': 1.3, 'xmin': 1.19},
			   {'phone': 'AE1', 'xmax': 1.46, 'xmin': 1.3},
			   {'phone': 'N', 'xmax': 1.52, 'xmin': 1.46}],
	'word': 'man',
	'xmax': 1.52,
	'xmin': 1.19},
   {'matched_xmax': 0.93,
	'matched_xmin': 0.6,
	'phones': [{'phone': 'HH', 'xmax': 1.62, 'xmin': 1.52},
			   {'phone': 'OW1', 'xmax': 1.65, 'xmin': 1.62},
			   {'phone': 'L', 'xmax': 1.85, 'xmin': 1.65},
			   {'phone': 'D', 'xmax': 1.9, 'xmin': 1.85},
			   {'phone': 'Z', 'xmax': 1.94, 'xmin': 1.9}],
	'word': 'holds',
	'xmax': 1.94,
	'xmin': 1.52},
   {'matched_xmax': 1.01,
	'matched_xmin': 0.93,
	'phones': [{'phone': 'IH0', 'xmax': 2.0, 'xmin': 1.94},
			   {'phone': 'N', 'xmax': 2.05, 'xmin': 2.0}],
	'word': 'in',
	'xmax': 2.05,
	'xmin': 1.94},
   {'matched_xmax': 1.16,
	'matched_xmin': 1.01,
	'phones': [{'phone': 'HH', 'xmax': 2.06, 'xmin': 2.05},
			   {'ops': ['replace with "IH1"'],
				'phone': 'IH0',
				'xmax': 2.1,
				'xmin': 2.06},
			   {'phone': 'Z', 'xmax': 2.23, 'xmin': 2.1}],
	'word': 'his',
	'xmax': 2.23,
	'xmin': 2.05},
   {'matched_phones': [{'phone': 'M', 'xmax': 1.23, 'xmin': 1.16},
					   {'phone': 'AO1', 'xmax': 1.27, 'xmin': 1.23},
					   {'phone': 'R', 'xmax': 1.33, 'xmin': 1.27},
					   {'phone': 'T', 'xmax': 1.36, 'xmin': 1.33},
					   {'phone': 'AH0', 'xmax': 1.42, 'xmin': 1.36},
					   {'phone': 'L', 'xmax': 1.48, 'xmin': 1.42}],
	'matched_xmax': 1.48,
	'matched_xmin': 1.16,
	'ops': ['replace with "mortal"'],
	'phones': [{'ops': ['insert a "M"', 'replace with "AO1"'],
				'phone': 'HH',
				'xmax': 2.29,
				'xmin': 2.23},
			   {'ops': ['replace with "R"'],
				'phone': 'OW0',
				'xmax': 2.37,
				'xmin': 2.29},
			   {'phone': 'T', 'xmax': 2.49, 'xmin': 2.37},
			   {'ops': ['replace with "AH0"'],
				'phone': 'EH1',
				'xmax': 2.56,
				'xmin': 2.49},
			   {'phone': 'L', 'xmax': 2.73, 'xmin': 2.56}],
	'word': 'hotel',
	'xmax': 2.73,
	'xmin': 2.23},
   {'matched_xmax': 1.95,
	'matched_xmin': 1.48,
	'phones': [{'phone': 'HH', 'xmax': 2.74, 'xmin': 2.73},
			   {'phone': 'AE1', 'xmax': 2.95, 'xmin': 2.74},
			   {'phone': 'N', 'xmax': 3.05, 'xmin': 2.95},
			   {'ops': ['insert a "D"'],
				'phone': 'Z',
				'xmax': 3.27,
				'xmin': 3.05}],
	'word': 'hands',
	'xmax': 3.27,
	'xmin': 2.73},
   {'matched_xmax': 2.02,
	'matched_xmin': 1.95,
	'phones': [{'phone': 'DH', 'xmax': 3.34, 'xmin': 3.32},
			   {'phone': 'AH0', 'xmax': 3.38, 'xmin': 3.34}],
	'word': 'the',
	'xmax': 3.38,
	'xmin': 3.32},
   {'matched_xmax': 2.39,
	'matched_xmin': 2.02,
	'phones': [{'phone': 'P', 'xmax': 3.52, 'xmin': 3.38},
			   {'phone': 'AW1', 'xmax': 3.67, 'xmin': 3.52},
			   {'phone': 'ER0', 'xmax': 3.74, 'xmin': 3.67}],
	'word': 'power',
	'xmax': 3.74,
	'xmin': 3.38},
   {'matched_xmax': 2.54,
	'matched_xmin': 2.39,
	'phones': [{'phone': 'T', 'xmax': 3.83, 'xmin': 3.74},
			   {'ops': ['replace with "UW1"'],
				'phone': 'AH0',
				'xmax': 3.9,
				'xmin': 3.83}],
	'word': 'to',
	'xmax': 3.9,
	'xmin': 3.74},
   {'matched_xmax': 2.95,
	'matched_xmin': 2.54,
	'phones': [{'phone': 'AH0', 'xmax': 3.96, 'xmin': 3.9},
			   {'phone': 'B', 'xmax': 4.07, 'xmin': 3.96},
			   {'phone': 'AA1', 'xmax': 4.18, 'xmin': 4.07},
			   {'phone': 'L', 'xmax': 4.27, 'xmin': 4.18},
			   {'phone': 'IH0', 'xmax': 4.32, 'xmin': 4.27},
			   {'phone': 'SH', 'xmax': 4.42, 'xmin': 4.32}],
	'word': 'abolish',
	'xmax': 4.42,
	'xmin': 3.9},
   {'matched_xmax': 3.15,
	'matched_xmin': 2.95,
	'phones': [{'phone': 'AO1', 'xmax': 4.52, 'xmin': 4.42},
			   {'phone': 'L', 'xmax': 4.66, 'xmin': 4.52}],
	'word': 'all',
	'xmax': 4.66,
	'xmin': 4.42},
   {'matched_xmax': 3.45,
	'matched_xmin': 3.15,
	'phones': [{'phone': 'F', 'xmax': 4.79, 'xmin': 4.66},
			   {'phone': 'AO1', 'xmax': 4.88, 'xmin': 4.79},
			   {'phone': 'R', 'xmax': 4.97, 'xmin': 4.88},
			   {'phone': 'M', 'xmax': 5.06, 'xmin': 4.97},
			   {'phone': 'Z', 'xmax': 5.16, 'xmin': 5.06}],
	'word': 'forms',
	'xmax': 5.16,
	'xmin': 4.66},
   {'matched_xmax': 3.6,
	'matched_xmin': 3.45,
	'phones': [{'phone': 'AH0', 'xmax': 5.26, 'xmin': 5.16},
			   {'phone': 'V', 'xmax': 5.4, 'xmin': 5.26}],
	'word': 'of',
	'xmax': 5.4,
	'xmin': 5.16},
   {'matched_phones': [{'phone': 'P', 'xmax': 3.87, 'xmin': 3.79},
					   {'phone': 'AA1', 'xmax': 3.99, 'xmin': 3.87},
					   {'phone': 'V', 'xmax': 4.03, 'xmin': 3.99},
					   {'phone': 'ER0', 'xmax': 4.1, 'xmin': 4.03},
					   {'phone': 'T', 'xmax': 4.13, 'xmin': 4.1},
					   {'phone': 'IY0', 'xmax': 4.27, 'xmin': 4.13}],
	'matched_xmax': 4.27,
	'matched_xmin': 3.79,
	'ops': ['swap with "human"'],
	'phones': [{'phone': 'P', 'xmax': 5.53, 'xmin': 5.4},
			   {'phone': 'AA1', 'xmax': 5.63, 'xmin': 5.53},
			   {'phone': 'V', 'xmax': 5.66, 'xmin': 5.63},
			   {'phone': 'ER0', 'xmax': 5.77, 'xmin': 5.66},
			   {'phone': 'T', 'xmax': 5.86, 'xmin': 5.77},
			   {'phone': 'IY0', 'xmax': 5.96, 'xmin': 5.86}],
	'word': 'poverty',
	'xmax': 5.96,
	'xmin': 5.4},
   {'matched_phones': [{'phone': 'HH', 'xmax': 3.61, 'xmin': 3.6},
					   {'phone': 'Y', 'xmax': 3.64, 'xmin': 3.61},
					   {'phone': 'UW1', 'xmax': 3.67, 'xmin': 3.64},
					   {'phone': 'M', 'xmax': 3.7, 'xmin': 3.67},
					   {'phone': 'AH0', 'xmax': 3.75, 'xmin': 3.7},
					   {'phone': 'N', 'xmax': 3.79, 'xmin': 3.75}],
	'matched_xmax': 3.79,
	'matched_xmin': 3.6,
	'ops': ['swap with "poverty"'],
	'phones': [{'phone': 'HH', 'xmax': 6.06, 'xmin': 5.96},
			   {'phone': 'Y', 'xmax': 6.11, 'xmin': 6.06},
			   {'phone': 'UW1', 'xmax': 6.21, 'xmin': 6.11},
			   {'phone': 'M', 'xmax': 6.28, 'xmin': 6.21},
			   {'phone': 'AH0', 'xmax': 6.31, 'xmin': 6.28},
			   {'phone': 'N', 'xmax': 6.5, 'xmin': 6.31},
			   {'ops': ['delete "Z"'], 'phone': 'Z', 'xmax': 6.65, 'xmin': 6.5}],
	'word': 'human',
	'xmax': 6.65,
	'xmin': 5.96},
   {'matched_xmax': 4.42,
	'matched_xmin': 4.27,
	'phones': [{'phone': 'AE1', 'xmax': 7.14, 'xmin': 7.06},
			   {'phone': 'N', 'xmax': 7.18, 'xmin': 7.14},
			   {'phone': 'D', 'xmax': 7.21, 'xmin': 7.18}],
	'word': 'and',
	'xmax': 7.21,
	'xmin': 7.06},
   {'matched_xmax': 4.62,
	'matched_xmin': 4.42,
	'phones': [{'phone': 'AO1', 'xmax': 7.29, 'xmin': 7.21},
			   {'phone': 'L', 'xmax': 7.43, 'xmin': 7.29}],
	'word': 'all',
	'xmax': 7.43,
	'xmin': 7.21},
   {'matched_xmax': 4.97,
	'matched_xmin': 4.62,
	'phones': [{'phone': 'F', 'xmax': 7.55, 'xmin': 7.43},
			   {'phone': 'AO1', 'xmax': 7.62, 'xmin': 7.55},
			   {'phone': 'R', 'xmax': 7.69, 'xmin': 7.62},
			   {'phone': 'M', 'xmax': 7.76, 'xmin': 7.69},
			   {'phone': 'Z', 'xmax': 7.83, 'xmin': 7.76}],
	'word': 'forms',
	'xmax': 7.83,
	'xmin': 7.43},
   {'matched_xmax': 5.13,
	'matched_xmin': 4.97,
	'phones': [{'phone': 'AH0', 'xmax': 7.89, 'xmin': 7.83},
			   {'phone': 'V', 'xmax': 8.0, 'xmin': 7.89}],
	'word': 'of',
	'xmax': 8.0,
	'xmin': 7.83},
   {'matched_xmax': 5.36,
	'matched_xmin': 5.13,
	'phones': [{'phone': 'HH', 'xmax': 8.01, 'xmin': 8.0},
			   {'phone': 'Y', 'xmax': 8.05, 'xmin': 8.01},
			   {'phone': 'UW1', 'xmax': 8.1, 'xmin': 8.05},
			   {'phone': 'M', 'xmax': 8.16, 'xmin': 8.1},
			   {'phone': 'AH0', 'xmax': 8.21, 'xmin': 8.16},
			   {'phone': 'N', 'xmax': 8.28, 'xmin': 8.21}],
	'word': 'human',
	'xmax': 8.28,
	'xmin': 8.0},
   {'matched_xmax': 5.86,
	'matched_xmin': 5.36,
	'phones': [{'phone': 'L', 'xmax': 8.35, 'xmin': 8.28},
			   {'phone': 'AY1', 'xmax': 8.47, 'xmin': 8.35},
			   {'phone': 'F', 'xmax': 8.61, 'xmin': 8.47}],
	'word': 'life',
	'xmax': 8.61,
	'xmin': 8.28}]

}



recordedSentences = [1]
display(1) */
