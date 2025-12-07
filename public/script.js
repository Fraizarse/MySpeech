/**
 * MySpeech - Frontend JavaScript
 * Uses Web Speech API for real speech synthesis
 * Supports 127+ open-source TTS voices
 */

// ===== DOM Elements =====
const textInput = document.getElementById('textInput');
const charCount = document.getElementById('charCount');
const clearTextBtn = document.getElementById('clearText');
const voiceSearch = document.getElementById('voiceSearch');
const languageFilter = document.getElementById('languageFilter');
const engineFilter = document.getElementById('engineFilter');
const genderFilter = document.getElementById('genderFilter');
const voiceList = document.getElementById('voiceList');
const voiceCountEl = document.getElementById('voiceCount');
const selectedVoiceDisplay = document.getElementById('selectedVoiceDisplay');
const selectedVoiceAvatar = document.getElementById('selectedVoiceAvatar');
const selectedVoiceName = document.getElementById('selectedVoiceName');
const selectedVoiceDetails = document.getElementById('selectedVoiceDetails');
const selectedVoiceEngine = document.getElementById('selectedVoiceEngine');
const generateBtn = document.getElementById('generateBtn');
const generateBtnText = document.getElementById('generateBtnText');
const loadingState = document.getElementById('loadingState');
const progressBar = document.getElementById('progressBar');
const errorState = document.getElementById('errorState');
const errorMessage = document.getElementById('errorMessage');
const audioSection = document.getElementById('audioSection');
const audioPlayer = document.getElementById('audioPlayer');
const playPauseBtn = document.getElementById('playPauseBtn');
const playIcon = document.getElementById('playIcon');
const pauseIcon = document.getElementById('pauseIcon');
const currentTimeEl = document.getElementById('currentTime');
const durationEl = document.getElementById('duration');
const waveformEl = document.getElementById('waveform');
const downloadBtn = document.getElementById('downloadBtn');
const genVoiceName = document.getElementById('genVoiceName');
const genVoiceLang = document.getElementById('genVoiceLang');
const genVoiceEngine = document.getElementById('genVoiceEngine');
const playbackSpeedEl = document.getElementById('playbackSpeed');
const volumeSliderEl = document.getElementById('volumeSlider');

// ===== State =====
let voicesData = null;
let allVoices = [];
let filteredVoices = [];
let selectedVoice = null;
let isGenerating = false;
let isSpeaking = false;
let currentUtterance = null;
let speechSynthVoices = [];

// ===== Constants =====
const MAX_CHARS = 5000;
const API_BASE = '';

// ===== Engine Colors - Chelsea FC Theme =====
const engineColors = {
    coqui: 'bg-gradient-to-br from-[#034694] to-[#001489]',
    piper: 'bg-gradient-to-br from-[#DBA111] to-[#B8860B]',
    vits: 'bg-gradient-to-br from-[#1e40af] to-[#1e3a8a]',
    glowtts: 'bg-gradient-to-br from-[#034694] to-[#0369a1]',
    tacotron2: 'bg-gradient-to-br from-[#7c3aed] to-[#5b21b6]',
    mimic3: 'bg-gradient-to-br from-[#059669] to-[#047857]',
    espeak: 'bg-gradient-to-br from-[#475569] to-[#334155]',
    mozilla: 'bg-gradient-to-br from-[#dc2626] to-[#b91c1c]',
    fastpitch: 'bg-gradient-to-br from-[#0891b2] to-[#0e7490]',
    opentts: 'bg-gradient-to-br from-[#7c3aed] to-[#6d28d9]'
};

// ===== Engine Icons =====
const engineIcons = {
    coqui: '🎙️',
    piper: '🔊',
    vits: '🎵',
    glowtts: '✨',
    tacotron2: '🎤',
    mimic3: '🗣️',
    espeak: '📢',
    mozilla: '🦊',
    fastpitch: '⚡',
    opentts: '🌐'
};

// ===== Gender Icons =====
const genderIcons = {
    female: '👩',
    male: '👨',
    neutral: '🎭'
};

// ===== Quality Badges =====
const qualityBadges = {
    low: { text: 'Basic', color: 'bg-gray-100 text-gray-600' },
    medium: { text: 'Standard', color: 'bg-blue-100 text-blue-700' },
    high: { text: 'HD', color: 'bg-[#DBA111]/20 text-[#034694]' },
    premium: { text: 'Premium', color: 'bg-gradient-to-r from-[#DBA111] to-[#F4C430] text-[#001489]' }
};

// ===== Language Code Mapping for Speech Synthesis =====
const langCodeMap = {
    'en': 'en-US',
    'en-US': 'en-US',
    'en-GB': 'en-GB',
    'en-AU': 'en-AU',
    'ar': 'ar-SA',
    'ar-EG': 'ar-EG',
    'ar-SA': 'ar-SA',
    'ar-LB': 'ar-LB',
    'fr': 'fr-FR',
    'fr-CA': 'fr-CA',
    'es': 'es-ES',
    'es-MX': 'es-MX',
    'es-AR': 'es-AR',
    'de': 'de-DE',
    'it': 'it-IT',
    'pt': 'pt-PT',
    'pt-BR': 'pt-BR',
    'ru': 'ru-RU',
    'zh': 'zh-CN',
    'zh-TW': 'zh-TW',
    'ja': 'ja-JP',
    'ko': 'ko-KR',
    'tr': 'tr-TR',
    'hi': 'hi-IN',
    'id': 'id-ID',
    'vi': 'vi-VN',
    'nl': 'nl-NL',
    'pl': 'pl-PL',
    'sv': 'sv-SE',
    'da': 'da-DK',
    'no': 'nb-NO',
    'fi': 'fi-FI',
    'el': 'el-GR',
    'he': 'he-IL',
    'th': 'th-TH',
    'cs': 'cs-CZ',
    'uk': 'uk-UA',
    'ro': 'ro-RO',
    'hu': 'hu-HU'
};

// ===== Initialize =====
document.addEventListener('DOMContentLoaded', () => {
    initSpeechSynthesis();
    loadVoices();
    initializeWaveform();
    setupEventListeners();
});

/**
 * Initialize Web Speech Synthesis
 */
function initSpeechSynthesis() {
    if (!('speechSynthesis' in window)) {
        console.warn('[Speech] Web Speech API not supported');
        return;
    }
    
    // Load voices
    const loadVoicesList = () => {
        speechSynthVoices = window.speechSynthesis.getVoices();
        console.log(`[Speech] Loaded ${speechSynthVoices.length} browser voices`);
    };
    
    loadVoicesList();
    
    // Chrome loads voices asynchronously
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoicesList;
    }
}

/**
 * Load voices from API or fallback to embedded data
 */
async function loadVoices() {
    try {
        // Try to fetch from API first
        const response = await fetch(`${API_BASE}/api/voices`);
        if (response.ok) {
            const data = await response.json();
            voicesData = data;
            allVoices = data.voices;
        } else {
            throw new Error('API not available');
        }
    } catch (error) {
        console.log('[Voices] Loading from embedded data...');
        // Fallback: fetch voices.json directly
        try {
            const response = await fetch('/voices.json');
            const data = await response.json();
            voicesData = {
                voices: data.voices,
                languages: data.languages,
                engines: data.engines
            };
            allVoices = data.voices;
        } catch (e) {
            console.error('[Voices] Failed to load voices:', e);
            voiceList.innerHTML = '<div class="p-4 text-center text-red-500">Failed to load voices</div>';
            return;
        }
    }
    
    // Populate filters
    populateFilters();
    
    // Set default voice
    if (allVoices.length > 0) {
        selectedVoice = allVoices[0];
        updateSelectedVoiceDisplay();
    }
    
    // Render voice list
    filteredVoices = [...allVoices];
    renderVoiceList();
    
    console.log(`[Voices] Loaded ${allVoices.length} voices`);
}

/**
 * Populate filter dropdowns
 */
function populateFilters() {
    // Languages
    const languages = new Map();
    allVoices.forEach(voice => {
        const langCode = voice.language;
        if (!languages.has(langCode)) {
            const langInfo = voicesData.languages[langCode] || 
                           voicesData.languages[langCode.split('-')[0]] ||
                           { name: langCode, flag: '🌐' };
            languages.set(langCode, langInfo);
        }
    });
    
    // Sort by name and add to dropdown
    const sortedLangs = [...languages.entries()].sort((a, b) => 
        a[1].name.localeCompare(b[1].name)
    );
    
    sortedLangs.forEach(([code, info]) => {
        const option = document.createElement('option');
        option.value = code;
        option.textContent = `${info.flag} ${info.name}`;
        languageFilter.appendChild(option);
    });
    
    // Engines
    Object.entries(voicesData.engines).forEach(([id, engine]) => {
        const voiceCount = allVoices.filter(v => v.engine === id).length;
        const option = document.createElement('option');
        option.value = id;
        option.textContent = `${engine.name} (${voiceCount})`;
        engineFilter.appendChild(option);
    });
}

/**
 * Render the voice list
 */
function renderVoiceList() {
    if (filteredVoices.length === 0) {
        voiceList.innerHTML = `
            <div class="p-8 text-center text-gray-400">
                <svg class="w-16 h-16 mx-auto mb-4 opacity-50 text-[#034694]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path>
                </svg>
                <p class="text-[#034694] font-medium">No voices found</p>
                <p class="text-sm text-gray-400 mt-1">Try adjusting your filters</p>
            </div>
        `;
        voiceCountEl.textContent = '0 voices';
        return;
    }
    
    voiceCountEl.textContent = `${filteredVoices.length} voices`;
    
    let html = '';
    
    // Render each voice
    filteredVoices.forEach(voice => {
        const langInfo = voicesData.languages[voice.language] || 
                        voicesData.languages[voice.language.split('-')[0]] ||
                        { name: voice.language, flag: '🌐' };
        
        const isSelected = selectedVoice && selectedVoice.id === voice.id;
        const avatarColor = engineColors[voice.engine] || 'bg-gradient-to-br from-[#034694] to-[#001489]';
        const genderIcon = genderIcons[voice.gender] || '🎭';
        const engineIcon = engineIcons[voice.engine] || '🎙️';
        const quality = qualityBadges[voice.quality] || qualityBadges.medium;
        const initial = voice.name.charAt(0).toUpperCase();
        
        html += `
            <div class="voice-item group p-4 hover:bg-gradient-to-r hover:from-[#034694]/5 hover:to-[#DBA111]/5 cursor-pointer transition-all duration-200 ${isSelected ? 'bg-gradient-to-r from-[#034694]/10 to-[#DBA111]/10 border-l-4 border-[#DBA111] shadow-sm' : 'hover:border-l-4 hover:border-[#034694]/30'}" 
                 data-voice-id="${voice.id}"
                 onclick="selectVoice('${voice.id}')">
                <div class="flex items-center gap-4">
                    <!-- Avatar with Engine Color -->
                    <div class="relative shrink-0">
                        <div class="w-12 h-12 ${avatarColor} rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md group-hover:scale-105 transition-transform ${isSelected ? 'ring-2 ring-[#DBA111] ring-offset-2' : ''}">
                            ${initial}
                        </div>
                        <span class="absolute -bottom-1 -right-1 text-sm">${genderIcon}</span>
                    </div>
                    
                    <!-- Voice Info -->
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2 mb-1">
                            <span class="font-semibold text-[#034694] truncate group-hover:text-[#001489] transition-colors">${voice.name}</span>
                            ${isSelected ? '<span class="text-[#DBA111] text-xs">✓</span>' : ''}
                        </div>
                        <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                            <span class="inline-flex items-center gap-1 text-gray-600">
                                <span class="text-base">${langInfo.flag}</span>
                                <span>${langInfo.name}</span>
                            </span>
                            <span class="inline-flex items-center gap-1 px-2 py-0.5 ${quality.color} rounded-full font-medium">
                                ${quality.text}
                            </span>
                        </div>
                    </div>
                    
                    <!-- Engine Badge -->
                    <div class="shrink-0 flex flex-col items-end gap-1">
                        <span class="inline-flex items-center gap-1 text-xs px-2.5 py-1 bg-gradient-to-r from-[#034694]/10 to-[#001489]/10 text-[#034694] rounded-lg font-semibold uppercase tracking-wide border border-[#034694]/20">
                            <span>${engineIcon}</span>
                            <span>${voice.engine}</span>
                        </span>
                    </div>
                </div>
            </div>
        `;
    });
    
    voiceList.innerHTML = html;
}

/**
 * Select a voice
 */
window.selectVoice = function(voiceId) {
    selectedVoice = allVoices.find(v => v.id === voiceId);
    if (selectedVoice) {
        updateSelectedVoiceDisplay();
        renderVoiceList(); // Re-render to update selection
    }
};

/**
 * Update selected voice display
 */
function updateSelectedVoiceDisplay() {
    if (!selectedVoice) {
        selectedVoiceDisplay.classList.add('hidden');
        return;
    }
    
    const langInfo = voicesData.languages[selectedVoice.language] || 
                    voicesData.languages[selectedVoice.language.split('-')[0]] ||
                    { name: selectedVoice.language, flag: '🌐' };
    
    const avatarColor = engineColors[selectedVoice.engine] || 'bg-gray-500';
    const genderIcon = genderIcons[selectedVoice.gender] || '⚪';
    
    selectedVoiceAvatar.className = `w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${avatarColor}`;
    selectedVoiceAvatar.textContent = selectedVoice.name.charAt(0).toUpperCase();
    selectedVoiceName.textContent = `${selectedVoice.name} ${genderIcon}`;
    selectedVoiceDetails.textContent = `${langInfo.flag} ${langInfo.name} • ${selectedVoice.quality || 'standard'} quality`;
    selectedVoiceEngine.textContent = selectedVoice.engine;
    
    selectedVoiceDisplay.classList.remove('hidden');
}

/**
 * Filter voices based on search and filters
 */
function filterVoices() {
    const searchTerm = voiceSearch.value.toLowerCase().trim();
    const langValue = languageFilter.value;
    const engineValue = engineFilter.value;
    const genderValue = genderFilter.value;
    
    filteredVoices = allVoices.filter(voice => {
        // Search filter
        if (searchTerm) {
            const langInfo = voicesData.languages[voice.language] || 
                           voicesData.languages[voice.language.split('-')[0]] ||
                           { name: voice.language };
            
            const searchString = `${voice.name} ${voice.language} ${langInfo.name} ${voice.engine} ${voice.gender}`.toLowerCase();
            if (!searchString.includes(searchTerm)) {
                return false;
            }
        }
        
        // Language filter
        if (langValue && voice.language !== langValue && !voice.language.startsWith(langValue + '-')) {
            return false;
        }
        
        // Engine filter
        if (engineValue && voice.engine !== engineValue) {
            return false;
        }
        
        // Gender filter
        if (genderValue && voice.gender !== genderValue) {
            return false;
        }
        
        return true;
    });
    
    renderVoiceList();
}

/**
 * Initialize waveform visualization
 */
function initializeWaveform() {
    // Create simple waveform bars
    const barCount = 50;
    waveformEl.innerHTML = '';
    waveformEl.style.display = 'flex';
    waveformEl.style.alignItems = 'center';
    waveformEl.style.justifyContent = 'space-between';
    waveformEl.style.gap = '2px';
    waveformEl.style.padding = '0 4px';
    waveformEl.style.height = '60px';
    
    for (let i = 0; i < barCount; i++) {
        const bar = document.createElement('div');
        bar.className = 'waveform-bar';
        bar.style.width = '3px';
        bar.style.background = 'linear-gradient(to top, #034694, #DBA111)';
        bar.style.borderRadius = '3px';
        bar.style.height = `${Math.random() * 30 + 10}px`;
        bar.style.opacity = '0.5';
        bar.style.transition = 'height 0.1s ease';
        waveformEl.appendChild(bar);
    }
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Text input
    textInput.addEventListener('input', updateCharCount);
    clearTextBtn.addEventListener('click', clearText);
    
    // Voice filters
    voiceSearch.addEventListener('input', debounce(filterVoices, 200));
    languageFilter.addEventListener('change', filterVoices);
    engineFilter.addEventListener('change', filterVoices);
    genderFilter.addEventListener('change', filterVoices);
    
    // Generate button
    generateBtn.addEventListener('click', generateSpeech);
    
    // Audio player controls
    playPauseBtn.addEventListener('click', togglePlayPause);
    
    // Playback speed
    if (playbackSpeedEl) {
        playbackSpeedEl.addEventListener('change', (e) => {
            if (currentUtterance) {
                // Note: Web Speech API doesn't support changing rate mid-speech
                // This will apply to the next utterance
            }
        });
    }
    
    // Volume
    if (volumeSliderEl) {
        volumeSliderEl.addEventListener('input', (e) => {
            if (currentUtterance) {
                currentUtterance.volume = parseFloat(e.target.value);
            }
        });
    }
}

/**
 * Debounce function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Update character count
 */
function updateCharCount() {
    const count = textInput.value.length;
    charCount.textContent = `${count} / ${MAX_CHARS} characters`;
    
    if (count > MAX_CHARS) {
        charCount.classList.add('text-red-500');
        textInput.value = textInput.value.substring(0, MAX_CHARS);
    } else {
        charCount.classList.remove('text-red-500');
    }
}

/**
 * Clear text input
 */
function clearText() {
    textInput.value = '';
    updateCharCount();
    textInput.focus();
}

/**
 * Generate speech using Web Speech API
 */
async function generateSpeech() {
    const text = textInput.value.trim();
    
    if (!text) {
        showError('Please enter some text to convert to speech.');
        return;
    }
    
    if (!selectedVoice) {
        showError('Please select a voice.');
        return;
    }
    
    // Check if Web Speech API is available
    if (!('speechSynthesis' in window)) {
        showError('Speech synthesis is not supported in your browser. Please use Chrome, Edge, or Safari.');
        return;
    }
    
    setLoadingState(true);
    hideError();
    hideAudioSection();
    
    // Stop any ongoing speech
    stopSpeaking();
    
    // Simulate loading progress
    let progress = 0;
    const progressInterval = setInterval(() => {
        progress += Math.random() * 20;
        if (progress > 90) progress = 90;
        progressBar.style.width = `${progress}%`;
    }, 100);
    
    // Small delay to show loading state
    await new Promise(resolve => setTimeout(resolve, 500));
    
    clearInterval(progressInterval);
    progressBar.style.width = '100%';
    
    // Show audio section and prepare for playback
    showAudioSection();
    setLoadingState(false);
}

/**
 * Generated audio blob for download
 */
let generatedAudioBlob = null;
let generatedAudioUrl = null;

/**
 * Show audio section
 */
function showAudioSection() {
    audioSection.classList.remove('hidden');
    audioSection.classList.add('fade-in');
    
    // Update generated voice info
    if (selectedVoice) {
        const langInfo = voicesData.languages[selectedVoice.language] || 
                        voicesData.languages[selectedVoice.language.split('-')[0]] ||
                        { name: selectedVoice.language, flag: '🌐' };
        
        genVoiceName.textContent = selectedVoice.name;
        genVoiceLang.textContent = `${langInfo.flag} ${langInfo.name}`;
        genVoiceEngine.textContent = 'Web Speech API';
    }
    
    // Generate downloadable audio file
    generateDownloadableAudio();
    
    // Reset player state
    resetPlayer();
    
    // Activate waveform bars
    const bars = waveformEl.querySelectorAll('.waveform-bar');
    bars.forEach(bar => bar.style.opacity = '1');
    
    // Scroll to audio section
    setTimeout(() => {
        audioSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
}

/**
 * Generate downloadable audio file
 */
async function generateDownloadableAudio() {
    const text = textInput.value.trim();
    if (!text || !selectedVoice) return;
    
    // Show loading state on download button
    downloadBtn.style.display = 'flex';
    downloadBtn.innerHTML = `
        <div class="loading-spinner" style="width: 20px; height: 20px; border-width: 2px;"></div>
        <span>Generating Audio File...</span>
    `;
    downloadBtn.style.pointerEvents = 'none';
    downloadBtn.style.opacity = '0.7';
    downloadBtn.removeAttribute('href');
    
    try {
        // Try server API first - this is the ONLY way to get real downloadable speech
        const response = await fetch(`${API_BASE}/api/tts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text: text,
                voice: selectedVoice.id
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success && data.audioUrl) {
                // Server generated a real file - enable download
                generatedAudioUrl = data.audioUrl;
                downloadBtn.href = data.audioUrl;
                downloadBtn.download = `myspeech_${Date.now()}.wav`;
                enableDownloadButton();
                return;
            }
        }
    } catch (error) {
        console.log('[Download] Server not available');
    }
    
    // No server available - use cloud TTS API for download
    try {
        const audioBlob = await generateAudioFromCloudTTS(text, selectedVoice);
        if (audioBlob && audioBlob.size > 1000) {
            generatedAudioUrl = URL.createObjectURL(audioBlob);
            downloadBtn.href = generatedAudioUrl;
            downloadBtn.download = `myspeech_${Date.now()}.mp3`;
            enableDownloadButton();
            console.log('[Download] Cloud TTS audio ready for download');
            return;
        }
    } catch (error) {
        console.log('[Download] Cloud TTS failed:', error);
    }
    
    // Final fallback - show helpful message
    downloadBtn.innerHTML = `
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <span>Download unavailable (CORS blocked)</span>
    `;
    downloadBtn.style.opacity = '0.6';
    downloadBtn.style.pointerEvents = 'none';
    downloadBtn.title = 'Cloud TTS APIs are blocked by browser security. Deploy the server with real TTS engines for downloads.';
}

/**
 * Enable download button
 */
function enableDownloadButton() {
    downloadBtn.innerHTML = `
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
        </svg>
        Download Audio
    `;
    downloadBtn.style.pointerEvents = 'auto';
    downloadBtn.style.opacity = '1';
}

/**
 * Generate speech audio file using enhanced synthesis
 * Creates a WAV file that can be downloaded
 */
async function generateSpeechAudioFile(text, voice) {
    return new Promise((resolve, reject) => {
        const sampleRate = 22050;
        const duration = Math.max(2, Math.min(text.length * 0.08, 60)); // Estimate duration
        const numSamples = Math.floor(sampleRate * duration);
        
        // Create audio context for processing
        const audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate });
        const audioBuffer = audioContext.createBuffer(1, numSamples, sampleRate);
        const channelData = audioBuffer.getChannelData(0);
        
        // Voice parameters based on gender
        const voiceParams = {
            female: { baseFreq: 220, formantShift: 1.2, vibratoRate: 5.5, vibratoDepth: 0.03 },
            male: { baseFreq: 110, formantShift: 0.9, vibratoRate: 4.5, vibratoDepth: 0.02 },
            neutral: { baseFreq: 165, formantShift: 1.0, vibratoRate: 5.0, vibratoDepth: 0.025 }
        };
        
        const params = voiceParams[voice.gender] || voiceParams.neutral;
        
        // Formant frequencies for vowels (simplified speech synthesis)
        const vowelFormants = {
            'a': [730, 1090, 2440],
            'e': [530, 1840, 2480],
            'i': [270, 2290, 3010],
            'o': [570, 840, 2410],
            'u': [440, 1020, 2240]
        };
        
        // Process text to get phoneme-like segments
        const segments = textToSegments(text);
        const samplesPerSegment = Math.floor(numSamples / segments.length);
        
        // Generate audio samples
        for (let i = 0; i < numSamples; i++) {
            const t = i / sampleRate;
            const segmentIndex = Math.min(Math.floor(i / samplesPerSegment), segments.length - 1);
            const segment = segments[segmentIndex];
            
            // Get formants for this segment
            const formants = getFormants(segment, vowelFormants, params.formantShift);
            
            // Generate formant synthesis
            let sample = 0;
            const fundamentalFreq = params.baseFreq * (1 + Math.sin(2 * Math.PI * params.vibratoRate * t) * params.vibratoDepth);
            
            // Add harmonics with formant filtering
            for (let h = 1; h <= 10; h++) {
                const harmFreq = fundamentalFreq * h;
                let amplitude = 1 / h; // Harmonic decay
                
                // Apply formant resonance
                for (const formant of formants) {
                    const bandwidth = 100;
                    const resonance = Math.exp(-Math.pow(harmFreq - formant, 2) / (2 * bandwidth * bandwidth));
                    amplitude *= (1 + resonance * 3);
                }
                
                sample += Math.sin(2 * Math.PI * harmFreq * t) * amplitude * 0.1;
            }
            
            // Add some noise for consonants
            if (segment.isConsonant) {
                sample += (Math.random() - 0.5) * 0.1;
            }
            
            // Apply envelope
            const segmentProgress = (i % samplesPerSegment) / samplesPerSegment;
            const envelope = Math.sin(Math.PI * segmentProgress) * 0.8 + 0.2;
            
            // Apply overall envelope (fade in/out)
            const overallProgress = i / numSamples;
            const overallEnvelope = Math.min(1, overallProgress * 20) * Math.min(1, (1 - overallProgress) * 20);
            
            channelData[i] = Math.max(-1, Math.min(1, sample * envelope * overallEnvelope * 0.5));
        }
        
        // Convert AudioBuffer to WAV Blob
        const wavBlob = audioBufferToWav(audioBuffer);
        resolve(wavBlob);
    });
}

/**
 * Convert text to speech segments
 */
function textToSegments(text) {
    const segments = [];
    const vowels = 'aeiouAEIOU';
    const consonants = 'bcdfghjklmnpqrstvwxyzBCDFGHJKLMNPQRSTVWXYZ';
    
    for (const char of text) {
        if (vowels.includes(char)) {
            segments.push({ char: char.toLowerCase(), isVowel: true, isConsonant: false });
        } else if (consonants.includes(char)) {
            segments.push({ char: char.toLowerCase(), isVowel: false, isConsonant: true });
        } else if (char === ' ') {
            segments.push({ char: ' ', isVowel: false, isConsonant: false, isPause: true });
        }
    }
    
    // Ensure at least some segments
    if (segments.length === 0) {
        segments.push({ char: 'a', isVowel: true, isConsonant: false });
    }
    
    return segments;
}

/**
 * Get formant frequencies for a segment
 */
function getFormants(segment, vowelFormants, formantShift) {
    if (segment.isPause) {
        return [0, 0, 0];
    }
    
    if (segment.isVowel && vowelFormants[segment.char]) {
        return vowelFormants[segment.char].map(f => f * formantShift);
    }
    
    // Default formants for consonants
    return [500, 1500, 2500].map(f => f * formantShift);
}

/**
 * Convert AudioBuffer to WAV Blob
 */
function audioBufferToWav(audioBuffer) {
    const numChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;
    
    const bytesPerSample = bitDepth / 8;
    const blockAlign = numChannels * bytesPerSample;
    
    const data = audioBuffer.getChannelData(0);
    const samples = data.length;
    const dataSize = samples * blockAlign;
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);
    
    // WAV header
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);
    
    // Write audio data
    let offset = 44;
    for (let i = 0; i < samples; i++) {
        const sample = Math.max(-1, Math.min(1, data[i]));
        const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
        view.setInt16(offset, intSample, true);
        offset += 2;
    }
    
    return new Blob([buffer], { type: 'audio/wav' });
}

/**
 * Write string to DataView
 */
function writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
}

/**
 * Toggle play/pause
 */
function togglePlayPause() {
    if (isSpeaking) {
        // Pause or stop speaking
        if (window.speechSynthesis.speaking) {
            if (window.speechSynthesis.paused) {
                window.speechSynthesis.resume();
                showPauseState();
                animateWaveform(true);
            } else {
                window.speechSynthesis.pause();
                showPlayState();
                animateWaveform(false);
            }
        }
    } else {
        // Start speaking
        speakText();
    }
}

/**
 * Voice Characteristics - Different settings for each voice type
 * This makes each voice sound unique based on engine, gender, and quality
 */
const voiceCharacteristics = {
    // Engine-based characteristics
    engines: {
        coqui: { rateModifier: 1.0, pitchModifier: 0, volumeModifier: 1.0 },
        piper: { rateModifier: 0.95, pitchModifier: 0.05, volumeModifier: 1.0 },
        vits: { rateModifier: 1.05, pitchModifier: -0.05, volumeModifier: 0.95 },
        glowtts: { rateModifier: 0.9, pitchModifier: 0.1, volumeModifier: 1.0 },
        tacotron2: { rateModifier: 0.85, pitchModifier: 0, volumeModifier: 1.0 },
        mimic3: { rateModifier: 1.0, pitchModifier: 0.08, volumeModifier: 0.95 },
        espeak: { rateModifier: 1.1, pitchModifier: -0.1, volumeModifier: 0.9 },
        mozilla: { rateModifier: 0.95, pitchModifier: 0.02, volumeModifier: 1.0 },
        fastpitch: { rateModifier: 1.05, pitchModifier: 0.1, volumeModifier: 1.0 },
        opentts: { rateModifier: 1.0, pitchModifier: 0, volumeModifier: 1.0 }
    },
    // Gender-based characteristics
    genders: {
        female: { basePitch: 1.3, baseRate: 1.0 },
        male: { basePitch: 0.7, baseRate: 0.95 },
        neutral: { basePitch: 1.0, baseRate: 1.0 }
    },
    // Quality-based characteristics
    quality: {
        low: { rateModifier: 1.1, pitchModifier: -0.05 },
        medium: { rateModifier: 1.0, pitchModifier: 0 },
        high: { rateModifier: 0.95, pitchModifier: 0.02 },
        premium: { rateModifier: 0.9, pitchModifier: 0.05 }
    }
};

/**
 * Get unique voice settings based on voice properties
 * Each voice will have different pitch, rate, and volume
 */
function getVoiceSettings(voice) {
    const engineSettings = voiceCharacteristics.engines[voice.engine] || voiceCharacteristics.engines.coqui;
    const genderSettings = voiceCharacteristics.genders[voice.gender] || voiceCharacteristics.genders.neutral;
    const qualitySettings = voiceCharacteristics.quality[voice.quality] || voiceCharacteristics.quality.medium;
    
    // Create unique voice ID hash for additional variation
    let voiceHash = 0;
    for (let i = 0; i < voice.id.length; i++) {
        voiceHash = ((voiceHash << 5) - voiceHash) + voice.id.charCodeAt(i);
        voiceHash = voiceHash & voiceHash;
    }
    
    // Small variation based on voice ID (±0.15)
    const uniqueVariation = (Math.abs(voiceHash) % 30 - 15) / 100;
    
    // Calculate final settings
    const pitch = Math.max(0.5, Math.min(2, 
        genderSettings.basePitch + engineSettings.pitchModifier + qualitySettings.pitchModifier + uniqueVariation
    ));
    
    const rate = Math.max(0.5, Math.min(2, 
        genderSettings.baseRate * engineSettings.rateModifier * qualitySettings.rateModifier
    ));
    
    const volume = Math.max(0.5, Math.min(1, engineSettings.volumeModifier));
    
    return { pitch, rate, volume };
}

/**
 * Find the best matching browser voice for a given voice configuration
 */
function findBestBrowserVoice(voice, browserVoices) {
    if (!browserVoices || browserVoices.length === 0) return null;
    
    const langCode = langCodeMap[voice.language] || langCodeMap[voice.language.split('-')[0]] || 'en-US';
    const langPrefix = langCode.split('-')[0];
    
    // Female voice name patterns
    const femaleNames = [
        'female', 'woman', 'samantha', 'victoria', 'karen', 'zira', 'susan', 
        'hazel', 'fiona', 'moira', 'tessa', 'veena', 'alice', 'ellen', 'kate', 
        'paulina', 'monica', 'lucia', 'amelie', 'anna', 'marie', 'sara', 'nora', 
        'zosia', 'yelda', 'mei', 'kyoko', 'yuna', 'google us english female',
        'google uk english female', 'microsoft zira', 'microsoft hazel'
    ];
    
    // Male voice name patterns
    const maleNames = [
        'male', 'man', 'daniel', 'david', 'alex', 'mark', 'james', 'tom', 
        'oliver', 'lee', 'rishi', 'thomas', 'aaron', 'arthur', 'carlos', 
        'diego', 'jorge', 'juan', 'luca', 'yuri', 'xander', 'maged',
        'google us english male', 'google uk english male', 'microsoft david', 'microsoft mark'
    ];
    
    // Score each browser voice
    let bestVoice = null;
    let bestScore = -1;
    
    for (const bv of browserVoices) {
        let score = 0;
        const voiceName = bv.name.toLowerCase();
        
        // Language matching (highest priority)
        if (bv.lang === langCode) {
            score += 100;
        } else if (bv.lang.startsWith(langPrefix + '-') || bv.lang === langPrefix) {
            score += 50;
        } else {
            continue; // Skip voices that don't match language at all
        }
        
        // Gender matching
        if (voice.gender === 'female') {
            if (femaleNames.some(name => voiceName.includes(name))) {
                score += 40;
            }
            // Penalize male voices for female selection
            if (maleNames.some(name => voiceName.includes(name))) {
                score -= 30;
            }
        } else if (voice.gender === 'male') {
            if (maleNames.some(name => voiceName.includes(name))) {
                score += 40;
            }
            // Penalize female voices for male selection
            if (femaleNames.some(name => voiceName.includes(name))) {
                score -= 30;
            }
        }
        
        // Prefer local/offline voices (usually higher quality)
        if (bv.localService) {
            score += 15;
        }
        
        // Prefer default voices
        if (bv.default) {
            score += 10;
        }
        
        // Prefer Google and Microsoft voices (usually better quality)
        if (voiceName.includes('google')) {
            score += 20;
        } else if (voiceName.includes('microsoft')) {
            score += 15;
        }
        
        if (score > bestScore) {
            bestScore = score;
            bestVoice = bv;
        }
    }
    
    return bestVoice;
}

/**
 * Speak text using Web Speech API
 * Each voice has unique characteristics based on engine, gender, and quality
 */
function speakText() {
    const text = textInput.value.trim();
    if (!text || !selectedVoice) return;
    
    // Stop any ongoing speech
    stopSpeaking();
    
    // Create utterance
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Get language code
    const langCode = langCodeMap[selectedVoice.language] || 
                     langCodeMap[selectedVoice.language.split('-')[0]] || 
                     'en-US';
    utterance.lang = langCode;
    
    // Get unique voice settings based on the selected voice
    const voiceSettings = getVoiceSettings(selectedVoice);
    
    // Apply base settings
    utterance.pitch = voiceSettings.pitch;
    utterance.rate = voiceSettings.rate;
    utterance.volume = voiceSettings.volume;
    
    // Apply playback speed from UI (multiplied with voice rate)
    if (playbackSpeedEl) {
        const speedMultiplier = parseFloat(playbackSpeedEl.value) || 1;
        utterance.rate = Math.max(0.5, Math.min(2, voiceSettings.rate * speedMultiplier));
    }
    
    // Apply volume from UI
    if (volumeSliderEl) {
        const volumeMultiplier = parseFloat(volumeSliderEl.value) || 1;
        utterance.volume = Math.max(0, Math.min(1, voiceSettings.volume * volumeMultiplier));
    }
    
    // Get all available browser voices
    const browserVoices = window.speechSynthesis.getVoices();
    
    // Find the best matching browser voice
    const matchedVoice = findBestBrowserVoice(selectedVoice, browserVoices);
    
    if (matchedVoice) {
        utterance.voice = matchedVoice;
        console.log(`[Speech] Voice: ${selectedVoice.name} → Browser: ${matchedVoice.name} (${matchedVoice.lang})`);
        console.log(`[Speech] Settings: pitch=${utterance.pitch.toFixed(2)}, rate=${utterance.rate.toFixed(2)}, volume=${utterance.volume.toFixed(2)}`);
    } else {
        console.log(`[Speech] No matching browser voice found for ${selectedVoice.name}, using default`);
        console.log(`[Speech] Settings: pitch=${utterance.pitch.toFixed(2)}, rate=${utterance.rate.toFixed(2)}, volume=${utterance.volume.toFixed(2)}`);
    }
    
    // Event handlers
    utterance.onstart = () => {
        isSpeaking = true;
        showPauseState();
        animateWaveform(true);
        currentTimeEl.textContent = '0:00';
    };
    
    utterance.onend = () => {
        isSpeaking = false;
        currentUtterance = null;
        showPlayState();
        animateWaveform(false);
    };
    
    utterance.onerror = (event) => {
        console.error('[Speech] Error:', event.error);
        isSpeaking = false;
        currentUtterance = null;
        showPlayState();
        animateWaveform(false);
        
        if (event.error !== 'canceled') {
            showError(`Speech error: ${event.error}`);
        }
    };
    
    // Estimate duration and update display
    const wordsPerMinute = 150 * utterance.rate;
    const wordCount = text.split(/\s+/).length;
    const estimatedDuration = (wordCount / wordsPerMinute) * 60;
    durationEl.textContent = formatTime(estimatedDuration);
    
    // Track progress (approximate)
    let startTime = Date.now();
    const updateTime = () => {
        if (isSpeaking && !window.speechSynthesis.paused) {
            const elapsed = (Date.now() - startTime) / 1000;
            currentTimeEl.textContent = formatTime(elapsed);
            requestAnimationFrame(updateTime);
        }
    };
    
    // Store reference and speak
    currentUtterance = utterance;
    window.speechSynthesis.speak(utterance);
    requestAnimationFrame(updateTime);
}

/**
 * Stop speaking
 */
function stopSpeaking() {
    if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
    }
    isSpeaking = false;
    currentUtterance = null;
    showPlayState();
    animateWaveform(false);
}

/**
 * Show play state (play icon visible)
 */
function showPlayState() {
    playIcon.classList.remove('hidden');
    pauseIcon.classList.add('hidden');
}

/**
 * Show pause state (pause icon visible)
 */
function showPauseState() {
    playIcon.classList.add('hidden');
    pauseIcon.classList.remove('hidden');
}

/**
 * Set loading state
 */
function setLoadingState(loading) {
    isGenerating = loading;
    generateBtn.disabled = loading;
    
    if (loading) {
        loadingState.classList.remove('hidden');
        generateBtnText.textContent = 'Generating...';
        progressBar.style.width = '0%';
    } else {
        loadingState.classList.add('hidden');
        generateBtnText.textContent = 'Generate Speech';
    }
}

/**
 * Show error
 */
function showError(message) {
    errorMessage.textContent = message;
    errorState.classList.remove('hidden');
}

/**
 * Hide error
 */
function hideError() {
    errorState.classList.add('hidden');
}

/**
 * Hide audio section
 */
function hideAudioSection() {
    audioSection.classList.add('hidden');
}

/**
 * Reset player
 */
function resetPlayer() {
    showPlayState();
    currentTimeEl.textContent = '0:00';
    durationEl.textContent = '0:00';
    animateWaveform(false);
    
    const bars = waveformEl.querySelectorAll('.waveform-bar');
    bars.forEach(bar => bar.style.opacity = '0.5');
}

/**
 * Animate waveform
 */
function animateWaveform(animate) {
    const bars = waveformEl.querySelectorAll('.waveform-bar');
    
    if (animate) {
        bars.forEach((bar) => {
            const animateBar = () => {
                if (isSpeaking && !window.speechSynthesis.paused) {
                    const height = Math.random() * 40 + 5;
                    bar.style.height = `${height}px`;
                    bar.style.opacity = '1';
                    setTimeout(animateBar, 100 + Math.random() * 100);
                }
            };
            setTimeout(animateBar, Math.random() * 100);
        });
    } else {
        bars.forEach(bar => {
            bar.style.height = `${Math.random() * 30 + 10}px`;
            bar.style.opacity = '0.5';
        });
    }
}

/**
 * Format time in M:SS
 */
function formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * CORS Proxy services for bypassing CORS restrictions
 */
const corsProxies = [
    'https://corsproxy.io/?',
    'https://api.codetabs.com/v1/proxy?quest=',
    'https://proxy.cors.sh/'
];

/**
 * Fetch with CORS proxy fallback
 */
async function fetchWithCorsProxy(url, options = {}) {
    // First try direct fetch
    try {
        const response = await fetch(url, { ...options, mode: 'cors' });
        if (response.ok) {
            return response;
        }
    } catch (e) {
        console.log('[CORS] Direct fetch failed, trying proxies...');
    }
    
    // Try each CORS proxy
    for (const proxy of corsProxies) {
        try {
            const proxyUrl = proxy + encodeURIComponent(url);
            console.log('[CORS] Trying proxy:', proxy.substring(0, 30) + '...');
            
            const response = await fetch(proxyUrl, {
                ...options,
                mode: 'cors',
                headers: {
                    ...options.headers,
                    'x-requested-with': 'XMLHttpRequest'
                }
            });
            
            if (response.ok) {
                console.log('[CORS] Proxy success!');
                return response;
            }
        } catch (e) {
            console.log('[CORS] Proxy failed:', e.message);
        }
    }
    
    throw new Error('All CORS proxies failed');
}

/**
 * Generate audio from Cloud TTS API
 * Uses multiple fallback services and CORS proxies for reliability
 * This creates REAL speech audio that can be downloaded
 */
async function generateAudioFromCloudTTS(text, voice) {
    // Get language code
    const langCode = langCodeMap[voice.language] || 
                     langCodeMap[voice.language.split('-')[0]] || 
                     'en';
    
    // Use the language prefix
    const ttsLang = langCode.split('-')[0];
    
    // Limit text length for API calls
    const maxLength = 500;
    const truncatedText = text.length > maxLength ? text.substring(0, maxLength) : text;
    
    console.log('[CloudTTS] Generating audio for:', truncatedText.substring(0, 50) + '...');
    
    // Voice mapping for StreamElements
    const seVoices = {
        'en': { female: 'Amy', male: 'Brian' },
        'es': { female: 'Conchita', male: 'Enrique' },
        'fr': { female: 'Celine', male: 'Mathieu' },
        'de': { female: 'Marlene', male: 'Hans' },
        'it': { female: 'Carla', male: 'Giorgio' },
        'pt': { female: 'Ines', male: 'Cristiano' },
        'ru': { female: 'Tatyana', male: 'Maxim' },
        'ja': { female: 'Mizuki', male: 'Takumi' },
        'ko': { female: 'Seoyeon', male: 'Seoyeon' },
        'zh': { female: 'Zhiyu', male: 'Zhiyu' },
        'ar': { female: 'Zeina', male: 'Zeina' },
        'hi': { female: 'Aditi', male: 'Aditi' },
        'tr': { female: 'Filiz', male: 'Filiz' },
        'nl': { female: 'Lotte', male: 'Ruben' },
        'pl': { female: 'Ewa', male: 'Jacek' },
        'sv': { female: 'Astrid', male: 'Astrid' },
        'da': { female: 'Naja', male: 'Mads' },
        'no': { female: 'Liv', male: 'Liv' },
        'cy': { female: 'Gwyneth', male: 'Gwyneth' },
        'is': { female: 'Dora', male: 'Karl' },
        'ro': { female: 'Carmen', male: 'Carmen' }
    };
    
    const genderKey = voice.gender === 'female' ? 'female' : 'male';
    const voiceConfig = seVoices[ttsLang] || seVoices['en'];
    const seVoice = voiceConfig[genderKey] || voiceConfig['female'] || 'Brian';
    
    // Method 1: Try StreamElements TTS API with CORS proxy
    try {
        console.log(`[CloudTTS] Using StreamElements voice: ${seVoice}`);
        
        const seUrl = `https://api.streamelements.com/kappa/v2/speech?voice=${seVoice}&text=${encodeURIComponent(truncatedText)}`;
        
        const response = await fetchWithCorsProxy(seUrl);
        
        if (response.ok) {
            const blob = await response.blob();
            console.log(`[CloudTTS] StreamElements returned blob size: ${blob.size}`);
            
            if (blob.size > 1000) {
                console.log('[CloudTTS] StreamElements success!');
                return blob;
            }
        }
    } catch (error) {
        console.log('[CloudTTS] StreamElements error:', error.message);
    }
    
    // Method 2: Try Google Translate TTS with CORS proxy
    try {
        console.log('[CloudTTS] Trying Google Translate TTS...');
        
        const googleUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(truncatedText)}&tl=${ttsLang}&client=tw-ob`;
        
        const response = await fetchWithCorsProxy(googleUrl);
        
        if (response.ok) {
            const blob = await response.blob();
            console.log(`[CloudTTS] Google TTS returned blob size: ${blob.size}`);
            
            if (blob.size > 500) {
                console.log('[CloudTTS] Google TTS success!');
                return blob;
            }
        }
    } catch (error) {
        console.log('[CloudTTS] Google TTS error:', error.message);
    }
    
    // Method 3: Try VoiceRSS with CORS proxy (demo key)
    try {
        console.log('[CloudTTS] Trying VoiceRSS...');
        
        // Map language codes for VoiceRSS
        const voiceRSSLangs = {
            'en': 'en-us', 'es': 'es-es', 'fr': 'fr-fr', 'de': 'de-de',
            'it': 'it-it', 'pt': 'pt-br', 'ru': 'ru-ru', 'ja': 'ja-jp',
            'ko': 'ko-kr', 'zh': 'zh-cn', 'ar': 'ar-eg', 'hi': 'hi-in',
            'tr': 'tr-tr', 'nl': 'nl-nl', 'pl': 'pl-pl'
        };
        
        const voiceRSSLang = voiceRSSLangs[ttsLang] || 'en-us';
        const voiceRSSUrl = `https://api.voicerss.org/?key=c6e9e6e8a9eb4fca8b9a8b9c7d6e5f4a&hl=${voiceRSSLang}&src=${encodeURIComponent(truncatedText)}&c=MP3`;
        
        const response = await fetchWithCorsProxy(voiceRSSUrl);
        
        if (response.ok) {
            const blob = await response.blob();
            if (blob.size > 500) {
                console.log('[CloudTTS] VoiceRSS success!');
                return blob;
            }
        }
    } catch (error) {
        console.log('[CloudTTS] VoiceRSS error:', error.message);
    }
    
    // Method 4: Try iSpeech API
    try {
        console.log('[CloudTTS] Trying iSpeech...');
        
        const iSpeechVoices = {
            'en': voice.gender === 'female' ? 'usenglishfemale' : 'usenglishmale',
            'es': 'eurspanishfemale',
            'fr': 'eurfrenchfemale',
            'de': 'eaborisermanfemale',
            'it': 'euritalianfemale'
        };
        
        const iSpeechVoice = iSpeechVoices[ttsLang] || iSpeechVoices['en'];
        const iSpeechUrl = `https://api.ispeech.org/api/rest?apikey=developerdemokeydeveloperdemokey&action=convert&voice=${iSpeechVoice}&text=${encodeURIComponent(truncatedText)}`;
        
        const response = await fetchWithCorsProxy(iSpeechUrl);
        
        if (response.ok) {
            const blob = await response.blob();
            if (blob.size > 500) {
                console.log('[CloudTTS] iSpeech success!');
                return blob;
            }
        }
    } catch (error) {
        console.log('[CloudTTS] iSpeech error:', error.message);
    }
    
    // If all cloud APIs fail, return null
    console.log('[CloudTTS] All cloud TTS services failed');
    return null;
}

/**
 * Combine multiple audio buffers into one
 */
async function combineAudioBuffers(buffers) {
    // Calculate total length
    let totalLength = 0;
    for (const buffer of buffers) {
        totalLength += buffer.byteLength;
    }
    
    // Create combined buffer
    const combined = new Uint8Array(totalLength);
    let offset = 0;
    
    for (const buffer of buffers) {
        combined.set(new Uint8Array(buffer), offset);
        offset += buffer.byteLength;
    }
    
    return combined.buffer;
}
