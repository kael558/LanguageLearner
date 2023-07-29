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