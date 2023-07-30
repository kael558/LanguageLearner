
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
    }

]

// TODO handle streaming response
async function tts(voiceId, text){
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

/*
// Create an audio element.
const audio = document.createElement('audio');

// Create a MediaSource object.
const mediaSource = new MediaSource();

// When the MediaSource is opened, add a SourceBuffer for our audio data.
mediaSource.addEventListener('sourceopen', () => {
  const sourceBuffer = mediaSource.addSourceBuffer('audio/mpeg'); // 'audio/mpeg' is an example, change this to your audio's mime type.

  // Fetch some audio data (as a simplified example, we're not handling potential errors here).
  fetch('http://example.com/path/to/stream.mp3')
    .then(response => response.arrayBuffer())
    .then(data => {
      // Add the fetched audio data to the SourceBuffer.
      sourceBuffer.appendBuffer(data);
    });
});

// Set the MediaSource object as the source of the audio element.
audio.src = URL.createObjectURL(mediaSource);

// Start playing the audio.
audio.play();
*/



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


async function transcribe(blob, prompt = '', language = 'en') {
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