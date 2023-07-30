Conversation mode:
1. Give basic roleplay scenario's
2. Evaluate conversation
3. Proper grammar/word usage

Practice mode:
1. Given a sentence
2. Click the record button
3. openai transcription
4. mfa forced alignment on elevenlabs voice and 
5. 

AWS SERVER
console: https://console.serverless.com/symbolic-expressions/metrics/awsLambda?globalEnvironments=dev&globalNamespace=proxy&globalRegions=us-east-1&globalScope=awsLambda&globalTimeFrame=15m
endpoints:
  POST - https://c0djsh12rf.execute-api.us-east-1.amazonaws.com/api/ai/{proxy+}
  POST - https://c0djsh12rf.execute-api.us-east-1.amazonaws.com/api/tts/{voiceId}/stream
  POST - https://c0djsh12rf.execute-api.us-east-1.amazonaws.com/api/generation/{method}/stream
  tts: https://jgb2gyzrc4lavk6os4u5rcqlpa0emcok.lambda-url.us-east-1.on.aws/
  generation: https://3bripijg6lai4iugk72r6o4dq40gmocg.lambda-url.us-east-1.on.aws/
functions:
  ai: proxy-dev-ai (20 MB)
  tts: proxy-dev-tts (20 MB)
  generation: proxy-dev-generation (20 MB)



EXPECTED OBJECT:
USER
([{'phone_ops': [('replace', 1, 1)],
   'phones': [{'phone': 'T', 'xmax': 0.75, 'xmin': 0.68},
              {'phone': 'AH0', 'xmax': 0.8, 'xmin': 0.75}],
   'word': 'to',
   'xmax': 0.8,
   'xmin': 0.68},
  {'phone_ops': [],
   'phones': [{'phone': 'B', 'xmax': 0.89, 'xmin': 0.8},
              {'phone': 'IY0', 'xmax': 0.92, 'xmin': 0.89}],
   'word': 'be',
   'xmax': 0.92,
   'xmin': 0.8},
  {'phone_ops': [('delete', 0, 0), ('replace', 1, 0)],
   'phones': [{'phone': 'AO1', 'xmax': 1.24, 'xmin': 1.21},
              {'phone': 'R', 'xmax': 1.31, 'xmin': 1.24}],
   'word': 'or',
   'xmax': 1.31,
   'xmin': 1.21},
  {'phone_ops': [],
   'phones': [{'phone': 'N', 'xmax': 1.39, 'xmin': 1.31},
              {'phone': 'AA1', 'xmax': 1.49, 'xmin': 1.39},
              {'phone': 'T', 'xmax': 1.56, 'xmin': 1.49}],
   'word': 'not',
   'xmax': 1.56,
   'xmin': 1.31},
  {'phones': [{'phone': 'T', 'xmax': 1.63, 'xmin': 1.56},
              {'phone': 'AH0', 'xmax': 1.68, 'xmin': 1.63}],
   'word': 'to',
   'xmax': 1.68,
   'xmin': 1.56},
  {'phones': [{'phone': 'B', 'xmax': 1.76, 'xmin': 1.68},
              {'phone': 'IY0', 'xmax': 1.98, 'xmin': 1.76}],
   'word': 'be',
   'xmax': 1.98,
   'xmin': 1.68},
  {'phone_ops': [('replace', 1, 1)],
   'phones': [{'phone': 'DH', 'xmax': 2.01, 'xmin': 1.98},
              {'phone': 'AH0', 'xmax': 2.04, 'xmin': 2.01},
              {'phone': 'T', 'xmax': 2.07, 'xmin': 2.04}],
   'word': 'that',
   'xmax': 2.07,
   'xmin': 1.98},
  {'phone_ops': [('replace', 0, 0)],
   'phones': [{'phone': 'IH1', 'xmax': 2.37, 'xmin': 2.36},
              {'phone': 'Z', 'xmax': 2.4, 'xmin': 2.37}],
   'word': 'is',
   'xmax': 2.4,
   'xmin': 2.36},
  {'phone_ops': [],
   'phones': [{'phone': 'DH', 'xmax': 2.94, 'xmin': 2.92},
              {'phone': 'AH0', 'xmax': 2.97, 'xmin': 2.94}],
   'word': 'the',
   'xmax': 2.97,
   'xmin': 2.92},
  {'phone_ops': [('insert', 2, 3), ('replace', 3, 4)],
   'phones': [{'phone': 'K', 'xmax': 3.12, 'xmin': 3.09},
              {'phone': 'W', 'xmax': 3.13, 'xmin': 3.12},
              {'phone': 'EH1', 'xmax': 3.14, 'xmin': 3.13},
              {'phone': 'SH', 'xmax': 3.17, 'xmin': 3.14},
              {'phone': 'AH0', 'xmax': 3.2, 'xmin': 3.17},
              {'phone': 'N', 'xmax': 3.23, 'xmin': 3.2}],
   'word': 'question',
   'xmax': 3.23,
   'xmin': 3.09}],

BOT
 [{'phones': [{'phone': 'T', 'xmax': 0.24, 'xmin': 0.16},
              {'phone': 'UW1', 'xmax': 0.33, 'xmin': 0.24}],
   'word': 'to',
   'xmax': 0.33,
   'xmin': 0.16},
  {'phones': [{'phone': 'B', 'xmax': 0.42, 'xmin': 0.33},
              {'phone': 'IY0', 'xmax': 0.63, 'xmin': 0.42}],
   'word': 'be',
   'xmax': 0.63,
   'xmin': 0.33},
  {'phones': [{'phone': 'ER0', 'xmax': 0.69, 'xmin': 0.63}],
   'word': 'or',
   'xmax': 0.69,
   'xmin': 0.63},
  {'phones': [{'phone': 'N', 'xmax': 0.76, 'xmin': 0.69},
              {'phone': 'AA1', 'xmax': 0.88, 'xmin': 0.76},
              {'phone': 'T', 'xmax': 0.94, 'xmin': 0.88}],
   'word': 'not',
   'xmax': 0.94,
   'xmin': 0.69},
  {'phones': [{'phone': 'T', 'xmax': 0.99, 'xmin': 0.94},
              {'phone': 'AH0', 'xmax': 1.03, 'xmin': 0.99}],
   'word': 'to',
   'xmax': 1.03,
   'xmin': 0.94},
  {'phones': [{'phone': 'B', 'xmax': 1.09, 'xmin': 1.03},
              {'phone': 'IY0', 'xmax': 1.18, 'xmin': 1.09}],
   'word': 'be',
   'xmax': 1.18,
   'xmin': 1.03},
  {'phones': [{'phone': 'DH', 'xmax': 1.23, 'xmin': 1.18},
              {'phone': 'AE1', 'xmax': 1.32, 'xmin': 1.23},
              {'phone': 'T', 'xmax': 1.35, 'xmin': 1.32}],
   'word': 'that',
   'xmax': 1.35,
   'xmin': 1.18},
  {'phones': [{'phone': 'IH0', 'xmax': 1.41, 'xmin': 1.35},
              {'phone': 'Z', 'xmax': 1.51, 'xmin': 1.41}],
   'word': 'is',
   'xmax': 1.51,
   'xmin': 1.35},
  {'phones': [{'phone': 'DH', 'xmax': 1.53, 'xmin': 1.51},
              {'phone': 'AH0', 'xmax': 1.57, 'xmin': 1.53}],
   'word': 'the',
   'xmax': 1.57,
   'xmin': 1.51},
  {'phones': [{'phone': 'K', 'xmax': 1.64, 'xmin': 1.57},
              {'phone': 'W', 'xmax': 1.68, 'xmin': 1.64},
              {'phone': 'EH1', 'xmax': 1.74, 'xmin': 1.68},
              {'phone': 'S', 'xmax': 1.83, 'xmin': 1.74},
              {'phone': 'CH', 'xmax': 1.9, 'xmin': 1.83},
              {'phone': 'AH0', 'xmax': 1.96, 'xmin': 1.9},
              {'phone': 'N', 'xmax': 2.11, 'xmin': 1.96}],
   'word': 'question',
   'xmax': 2.11,
   'xmin': 1.57}])






TODO:
 - make ui for sentences (5 sentences)
    - record audio and next button
 - on sentences finish
    - run mfa
    - display list on side to navigate
    - damerau-levenshtein on each word
    - damerau-levenshtein on each matching word's phonemes
    - words with lower score are brighter red vs green 
- Extra features
    - highlight section of sentence 
    - crops audio for both human and elevenlabs and puts it side-by-side
    - phoneme mismatch or stress mismatch
    - clicking on word shows definition

ffmpeg -i .\test.webm -c:a pcm_f32le .\out.wav