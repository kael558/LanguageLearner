# Language Learner
# 🚨 Requires running the local server at [MFA Proxy Github](https://github.com/kael558/MFAProxy)🚨

<a name="readme-top"></a>

[![MIT License][license-shield]][license-url]

## 🤔 What is this?
A tool for language learning. 

It is a static webpage with two main modes:

Conversation mode:
1. Give basic roleplay scenario's
2. Evaluate conversation
3. Proper grammar/word usage

Practice mode:
1. Read sentences
2. See your pronunciation mistakes

## 🔧 How it works
It uses a proxy api with:
 - ElevenLabs for realistic tts
 - OpenAI for llm completions and transcriptions

For the pronunciation, I used [Montreal forced alignment](https://montreal-forced-aligner.readthedocs.io/en/latest/index.html) to get transcription intervals. It generates aligned phones with the transcription.

Phones are generated for both the user recorded message and the ElevenLabs tts.

Damerau-levenshtein distance can be computed between the words and the phones of each word to get a pronunciation difference. 

It will tell you if you need to replace, insert, delete or transpose a word/phone. 

## 📅 Roadmap
[ ] highlight section of sentence -> crops audio for both human and elevenlabs and puts it side-by-side
[ ] better phone error messages
[ ] add more languages

## ⚖️ License
Distributed under the MIT License. See `LICENSE.txt` for more information.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

[license-shield]: https://img.shields.io/github/license/kael558/LanguageLearner.svg?style=for-the-badge
[license-url]: https://github.com/kael558/LanguageLearner/blob/main/LICENSE