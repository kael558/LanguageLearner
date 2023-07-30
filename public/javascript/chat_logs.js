// Handle scenario selection
/*
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
*/



import scenarios from '../data/scenarios.mjs';

console.log(scenarios);

class ChatLogs {
    constructor() {
        for (const scenario of scenarios) {
            this[scenario.id] = [{
                sender: 'bot',
                content: scenario.first_message,
            }];
        }
    }

    clearChatLog(scenario_id) {
        this[scenario_id] = [];
    }

    sendMessage(scenario_id, message){
        // append the message to the chat
        this[scenario_id].push(message);
    }

    getChatLog(scenario_id) {
        return this[scenario_id];
    }

    // Gets message from bot
    async getResponse(scenario_id, res) {
        console.log('Getting response from bot');
        let sleep = (ms) => {
            return new Promise(resolve => setTimeout(resolve, ms));
        }
        await sleep(5000);
        this.handleMessage(scenario_id, 'bot', 'This is a response from the bot', res, false);
    }

    // Handles message from user
    handleMessage(scenario_id, sender, content, res, get_response=true){
        //  validation to check that scenario is an integer
        if (!Number.isInteger(parseInt(scenario_id))) {
          res.status(400).send('scenario_id must be an integer.');
          return;
        }
    
        let message = {
            sender, content,
            timestamp: new Date(),
        };


        this.sendMessage(scenario_id, message);
    
        // starts an asynchronous process to get the response
        if (get_response)
            this.getResponse(scenario_id, res);
        res.redirect('/conversation/' + scenario_id + '?typing=' + get_response);
    } 
}

export default new ChatLogs();