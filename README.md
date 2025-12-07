# 🎙️ MySpeech - AI Text-to-Speech with 127+ Open Source Voices

A modern, professional web application for converting text to natural-sounding speech using 100% open-source TTS engines. Featuring **127 voices** across **40+ languages** from leading open-source projects.

![MySpeech Preview](https://via.placeholder.com/800x400?text=MySpeech+127%2B+Voices)

## ✨ Features

- **🗣️ 127+ Open Source Voices** - Diverse voices from 10 TTS engines
- **🌍 40+ Languages** - Global coverage including RTL languages
- **🔍 Smart Search & Filters** - Find voices by language, engine, or gender
- **🎵 Built-in Audio Player** - Custom waveform visualization
- **📥 Download Support** - Download generated audio in WAV format
- **📱 Fully Responsive** - Mobile-first design
- **⚡ Real-time Progress** - Loading states and progress indicators
- **🛡️ 100% Open Source** - No proprietary APIs required

## 🔊 Supported TTS Engines

| Engine | License | Voices | Description |
|--------|---------|--------|-------------|
| **Coqui TTS** | MPL-2.0 | 28 | State-of-the-art neural TTS |
| **Piper** | MIT | 58 | Fast, lightweight ONNX models |
| **VITS** | MIT | 2 | End-to-end neural TTS |
| **Mimic 3** | AGPL-3.0 | 15 | Mycroft's neural TTS |
| **Glow-TTS** | MIT | - | Flow-based neural TTS |
| **Tacotron2** | BSD-3 | - | Sequence-to-sequence TTS |
| **FastPitch** | Apache-2.0 | - | Parallel text-to-speech |
| **Mozilla TTS** | MPL-2.0 | - | Mozilla's TTS research |
| **eSpeak NG** | GPL-3.0 | 1 | Compact formant synthesizer |
| **OpenTTS** | MIT | - | Multi-engine TTS server |

## 🌐 Supported Languages

| Language | Voices | | Language | Voices |
|----------|--------|--|----------|--------|
| 🇺🇸 English (US) | 18 | | 🇬🇧 English (UK) | 12 |
| 🇸🇦 Arabic | 10 | | 🇫🇷 French | 8 |
| 🇪🇸 Spanish | 10 | | 🇩🇪 German | 6 |
| 🇮🇹 Italian | 5 | | 🇧🇷 Portuguese | 8 |
| 🇷🇺 Russian | 6 | | 🇨🇳 Chinese | 5 |
| 🇯🇵 Japanese | 5 | | 🇰🇷 Korean | 4 |
| 🇹🇷 Turkish | 4 | | 🇮🇳 Hindi | 6 |
| 🇮🇩 Indonesian | 4 | | 🇻🇳 Vietnamese | 4 |
| 🇳🇱 Dutch | 3 | | 🇵🇱 Polish | 3 |
| + 20 more languages... | | | | |

## 🚀 Quick Start

### Prerequisites

- Node.js 16.0 or higher
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/myspeech.git
cd myspeech

# Install dependencies
npm install

# Start the server
npm start

# Open in browser
open http://localhost:3000
```

### Development Mode

```bash
npm run dev
```

## 📁 Project Structure

```
MySpeech/
├── index.html           # Main HTML with Tailwind CSS
├── server.js            # Express.js server
├── package.json         # Node.js dependencies
├── voices.json          # 127 voice definitions
├── README.md            # Documentation
├── api/
│   └── tts.js           # TTS API with multi-engine support
└── public/
    ├── style.css        # Chelsea FC themed styles
    ├── script.js        # Frontend JavaScript
    └── audio/           # Generated audio files
```

## 🔌 API Reference

### POST /api/tts

Generate speech from text.

**Request:**
```json
{
  "text": "Hello, this is a test.",
  "voice": "coqui_en_vits_ljspeech"
}
```

**Response:**
```json
{
  "success": true,
  "audioUrl": "/audio/speech_abc123.wav",
  "duration": 2.4,
  "voice": {
    "id": "coqui_en_vits_ljspeech",
    "name": "LJSpeech VITS",
    "engine": "coqui",
    "language": "en-US",
    "gender": "female",
    "quality": "high"
  }
}
```

### GET /api/voices

Get all available voices with optional filters.

**Query Parameters:**
- `language` - Filter by language code (e.g., `en`, `en-US`, `ar`)
- `engine` - Filter by engine (e.g., `coqui`, `piper`)
- `gender` - Filter by gender (`male`, `female`, `neutral`)

**Response:**
```json
{
  "success": true,
  "total": 127,
  "voices": [...],
  "languages": {...},
  "engines": {...}
}
```

### GET /api/languages

Get all supported languages with voice counts.

### GET /api/engines

Get all TTS engines with statistics.

## 🎨 Voice Configuration

Each voice in `voices.json` includes:

```json
{
  "id": "coqui_en_vits_ljspeech",
  "name": "LJSpeech VITS",
  "engine": "coqui",
  "language": "en-US",
  "gender": "female",
  "model": "tts_models/en/ljspeech/vits",
  "quality": "high",
  "sampleRate": 22050
}
```

## 🔧 Installing TTS Engines

### Coqui TTS

```bash
pip install TTS
tts --list_models
```

### Piper

```bash
# Download models from https://github.com/rhasspy/piper/releases
pip install piper-tts
```

### Mimic 3

```bash
pip install mycroft-mimic3-tts
```

### eSpeak NG

```bash
# Ubuntu/Debian
sudo apt install espeak-ng

# macOS
brew install espeak-ng
```

## 🚀 Deployment

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

```bash
docker build -t myspeech .
docker run -p 3000:3000 myspeech
```

### Deploy to Render

1. Create a new Web Service on [Render](https://render.com)
2. Connect your GitHub repository
3. Configure:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
4. Deploy!

### Deploy with Docker Compose

```yaml
version: '3.8'
services:
  myspeech:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - ./public/audio:/app/public/audio
    environment:
      - NODE_ENV=production
```

## 📊 Voice Statistics

| Category | Count |
|----------|-------|
| **Total Voices** | 127 |
| **Languages** | 40+ |
| **TTS Engines** | 10 |
| **Female Voices** | 58 |
| **Male Voices** | 52 |
| **Neutral Voices** | 17 |

## 🤝 Contributing

Contributions are welcome! To add new voices:

1. Fork the repository
2. Add voice entry to `voices.json`
3. Ensure the voice uses an open-source license
4. Submit a Pull Request

### Adding a New Voice

```json
{
  "id": "engine_lang_name",
  "name": "Display Name",
  "engine": "coqui|piper|vits|...",
  "language": "en-US",
  "gender": "male|female|neutral",
  "model": "path/to/model",
  "quality": "low|medium|high|premium",
  "sampleRate": 22050
}
```

## 📄 License

This project is licensed under the MIT License.

### Voice Licenses

All voices included comply with open-source licenses:
- **MIT** - Piper, VITS, Glow-TTS, OpenTTS
- **MPL-2.0** - Coqui TTS, Mozilla TTS
- **Apache-2.0** - FastPitch
- **BSD-3-Clause** - Tacotron2
- **GPL-3.0** - eSpeak NG
- **AGPL-3.0** - Mimic 3

## 🙏 Acknowledgments

- [Coqui TTS](https://github.com/coqui-ai/TTS) - Neural TTS toolkit
- [Piper](https://github.com/rhasspy/piper) - Fast local neural TTS
- [VITS](https://github.com/jaywalnut310/vits) - End-to-end TTS
- [Mimic 3](https://github.com/MycroftAI/mimic3) - Mycroft's TTS
- [eSpeak NG](https://github.com/espeak-ng/espeak-ng) - Formant synthesizer
- [TailwindCSS](https://tailwindcss.com) - Styling framework

## 📞 Support

- Create an [issue](https://github.com/yourusername/myspeech/issues) for bugs
- Star ⭐ the repository if you find it helpful!

---

Made with 💙 using 100% Open Source TTS Engines

**Keep The Blue Flag Flying High!** 🔵⚽
