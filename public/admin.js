/**
 * MySpeech Admin Dashboard - JavaScript
 * Voice management, filtering, pagination, and CRUD operations
 */

// ===== State =====
let allVoices = [];
let filteredVoices = [];
let voicesData = null;
let currentPage = 1;
const itemsPerPage = 25;
let deleteVoiceId = null;
let currentlyPlayingVoiceId = null;
let previewAudioElements = new Map(); // Store audio elements for each voice

// ===== DOM Elements =====
const searchInput = document.getElementById('searchInput');
const languageFilter = document.getElementById('languageFilter');
const engineFilter = document.getElementById('engineFilter');
const statusFilter = document.getElementById('statusFilter');
const voiceTableBody = document.getElementById('voiceTableBody');
const voiceStats = document.getElementById('voiceStats');
const enabledCount = document.getElementById('enabledCount');
const disabledCount = document.getElementById('disabledCount');
const totalCount = document.getElementById('totalCount');
const paginationInfo = document.getElementById('paginationInfo');
const pageNumbers = document.getElementById('pageNumbers');
const prevPageBtn = document.getElementById('prevPageBtn');
const nextPageBtn = document.getElementById('nextPageBtn');
const addVoiceBtn = document.getElementById('addVoiceBtn');
const bulkEnableBtn = document.getElementById('bulkEnableBtn');
const bulkDisableBtn = document.getElementById('bulkDisableBtn');
const voiceModal = document.getElementById('voiceModal');
const deleteModal = document.getElementById('deleteModal');
const voiceForm = document.getElementById('voiceForm');
const modalTitle = document.getElementById('modalTitle');
const submitBtnText = document.getElementById('submitBtnText');

// ===== Engine Colors =====
const engineColors = {
    coqui: 'bg-purple-500',
    piper: 'bg-green-500',
    vits: 'bg-blue-500',
    glowtts: 'bg-orange-500',
    tacotron2: 'bg-pink-500',
    mimic3: 'bg-yellow-500',
    espeak: 'bg-gray-500',
    mozilla: 'bg-red-500',
    fastpitch: 'bg-emerald-500',
    opentts: 'bg-violet-500'
};

// ===== Gender Icons =====
const genderIcons = {
    female: '♀️',
    male: '♂️',
    neutral: '⚪'
};

// ===== Initialize =====
document.addEventListener('DOMContentLoaded', () => {
    loadVoices();
    setupEventListeners();
});

/**
 * Load voices from API
 */
async function loadVoices() {
    try {
        const response = await fetch('/api/admin/voices');
        if (response.ok) {
            const data = await response.json();
            voicesData = data;
            allVoices = data.voices.map(v => ({
                ...v,
                enabled: v.enabled !== false // Default to enabled if not specified
            }));
        } else {
            // Fallback to regular voices endpoint
            const fallbackResponse = await fetch('/api/voices');
            const data = await fallbackResponse.json();
            voicesData = data;
            allVoices = data.voices.map(v => ({
                ...v,
                enabled: v.enabled !== false
            }));
        }
    } catch (error) {
        console.error('[Admin] Failed to load voices:', error);
        // Try loading from voices.json directly
        try {
            const response = await fetch('/voices.json');
            const data = await response.json();
            voicesData = {
                voices: data.voices,
                languages: data.languages,
                engines: data.engines
            };
            allVoices = data.voices.map(v => ({
                ...v,
                enabled: v.enabled !== false
            }));
        } catch (e) {
            voiceTableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="px-6 py-12 text-center text-red-500">
                        Failed to load voices. Please refresh the page.
                    </td>
                </tr>
            `;
            return;
        }
    }
    
    populateFilters();
    applyFilters();
    updateStats();
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
            const langInfo = voicesData.languages?.[langCode] || 
                           voicesData.languages?.[langCode.split('-')[0]] ||
                           { name: langCode, flag: '🌐' };
            languages.set(langCode, langInfo);
        }
    });
    
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
    const engines = new Set(allVoices.map(v => v.engine));
    engines.forEach(engine => {
        const option = document.createElement('option');
        option.value = engine;
        option.textContent = engine.charAt(0).toUpperCase() + engine.slice(1);
        engineFilter.appendChild(option);
    });
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Filters
    searchInput.addEventListener('input', debounce(applyFilters, 200));
    languageFilter.addEventListener('change', applyFilters);
    engineFilter.addEventListener('change', applyFilters);
    statusFilter.addEventListener('change', applyFilters);
    
    // Pagination
    prevPageBtn.addEventListener('click', () => goToPage(currentPage - 1));
    nextPageBtn.addEventListener('click', () => goToPage(currentPage + 1));
    
    // Add voice
    addVoiceBtn.addEventListener('click', openAddModal);
    
    // Bulk actions
    bulkEnableBtn.addEventListener('click', () => bulkToggle(true));
    bulkDisableBtn.addEventListener('click', () => bulkToggle(false));
    
    // Form submission
    voiceForm.addEventListener('submit', handleFormSubmit);
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
 * Apply filters and search
 */
function applyFilters() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    const langValue = languageFilter.value;
    const engineValue = engineFilter.value;
    const statusValue = statusFilter.value;
    
    filteredVoices = allVoices.filter(voice => {
        // Search filter
        if (searchTerm) {
            const searchString = `${voice.id} ${voice.name} ${voice.language} ${voice.engine}`.toLowerCase();
            if (!searchString.includes(searchTerm)) return false;
        }
        
        // Language filter
        if (langValue && voice.language !== langValue && !voice.language.startsWith(langValue + '-')) {
            return false;
        }
        
        // Engine filter
        if (engineValue && voice.engine !== engineValue) {
            return false;
        }
        
        // Status filter
        if (statusValue === 'enabled' && !voice.enabled) return false;
        if (statusValue === 'disabled' && voice.enabled) return false;
        
        return true;
    });
    
    currentPage = 1;
    renderTable();
    updateStats();
}

/**
 * Update statistics
 */
function updateStats() {
    const enabled = allVoices.filter(v => v.enabled).length;
    const disabled = allVoices.filter(v => !v.enabled).length;
    const total = allVoices.length;
    
    voiceStats.textContent = `${enabled}/${total} Active`;
    enabledCount.textContent = `${enabled} Enabled`;
    disabledCount.textContent = `${disabled} Disabled`;
    totalCount.textContent = `${total} Total`;
}

/**
 * Render voice table
 */
function renderTable() {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageVoices = filteredVoices.slice(start, end);
    
    if (pageVoices.length === 0) {
        voiceTableBody.innerHTML = `
            <tr>
                <td colspan="7" class="px-6 py-12 text-center text-gray-400">
                    <svg class="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <p>No voices match your filters</p>
                </td>
            </tr>
        `;
        updatePagination();
        return;
    }
    
    voiceTableBody.innerHTML = pageVoices.map(voice => {
        const langInfo = voicesData.languages?.[voice.language] || 
                        voicesData.languages?.[voice.language.split('-')[0]] ||
                        { name: voice.language, flag: '🌐' };
        
        const engineColor = engineColors[voice.engine] || 'bg-gray-500';
        const genderIcon = genderIcons[voice.gender] || '⚪';
        const qualityBadge = getQualityBadge(voice.quality);
        
        return `
            <tr class="hover:bg-[#034694]/5 transition-colors">
                <td data-label="Voice" class="px-6 py-4">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 ${engineColor} rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0">
                            ${voice.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <p class="font-medium text-gray-800">${voice.name}</p>
                            <p class="text-xs text-gray-500 font-mono">${voice.id}</p>
                        </div>
                    </div>
                </td>
                <td data-label="Language" class="px-6 py-4">
                    <span class="text-sm">${langInfo.flag} ${langInfo.name}</span>
                </td>
                <td data-label="Engine" class="px-6 py-4">
                    <span class="text-xs px-2 py-1 ${engineColor} text-white rounded-full capitalize">${voice.engine}</span>
                </td>
                <td data-label="Gender" class="px-6 py-4">
                    <span class="text-sm">${genderIcon} ${voice.gender}</span>
                </td>
                <td data-label="Quality" class="px-6 py-4">
                    ${qualityBadge}
                </td>
                <td data-label="Preview" class="px-6 py-4 text-center">
                    <div class="flex flex-col items-center gap-2" id="preview-container-${voice.id}">
                        <button 
                            id="play-btn-${voice.id}"
                            onclick="playVoicePreview('${voice.id}')"
                            class="p-2 bg-[#034694] hover:bg-[#001489] text-white rounded-full transition-all hover:scale-110 shadow-md"
                            title="Preview Voice"
                        >
                            <svg id="play-icon-${voice.id}" class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z"/>
                            </svg>
                            <svg id="pause-icon-${voice.id}" class="w-5 h-5 hidden" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                            </svg>
                            <svg id="loading-icon-${voice.id}" class="w-5 h-5 hidden animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        </button>
                        <audio id="audio-${voice.id}" class="hidden"></audio>
                    </div>
                </td>
                <td data-label="Status" class="px-6 py-4 text-center">
                    <button 
                        onclick="toggleVoice('${voice.id}')"
                        class="relative inline-block w-12 h-6 rounded-full transition-colors ${voice.enabled ? 'bg-[#DBA111]' : 'bg-gray-300'}"
                    >
                        <span class="absolute top-0.5 ${voice.enabled ? 'right-0.5' : 'left-0.5'} w-5 h-5 bg-white rounded-full shadow transition-all"></span>
                    </button>
                </td>
                <td data-label="Actions" class="px-6 py-4 text-center">
                    <div class="flex items-center justify-center gap-2">
                        <button 
                            onclick="editVoice('${voice.id}')"
                            class="p-2 text-[#034694] hover:bg-[#034694]/10 rounded-lg transition-colors"
                            title="Edit"
                        >
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                            </svg>
                        </button>
                        <button 
                            onclick="confirmDelete('${voice.id}', '${voice.name}')"
                            class="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                        >
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                            </svg>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
    
    updatePagination();
}

/**
 * Get quality badge HTML
 */
function getQualityBadge(quality) {
    const badges = {
        low: '<span class="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">Low</span>',
        medium: '<span class="text-xs px-2 py-1 bg-blue-100 text-blue-600 rounded-full">Medium</span>',
        high: '<span class="text-xs px-2 py-1 bg-green-100 text-green-600 rounded-full">High</span>',
        premium: '<span class="text-xs px-2 py-1 bg-[#DBA111]/20 text-[#034694] rounded-full">Premium</span>'
    };
    return badges[quality] || badges.medium;
}

/**
 * Update pagination
 */
function updatePagination() {
    const totalPages = Math.ceil(filteredVoices.length / itemsPerPage);
    const start = (currentPage - 1) * itemsPerPage + 1;
    const end = Math.min(currentPage * itemsPerPage, filteredVoices.length);
    
    paginationInfo.textContent = filteredVoices.length > 0 
        ? `Showing ${start}-${end} of ${filteredVoices.length} voices`
        : 'No voices found';
    
    prevPageBtn.disabled = currentPage <= 1;
    nextPageBtn.disabled = currentPage >= totalPages;
    
    // Generate page numbers
    let pageNumbersHTML = '';
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage < maxVisiblePages - 1) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
        pageNumbersHTML += `
            <button 
                onclick="goToPage(${i})"
                class="w-10 h-10 rounded-lg ${i === currentPage ? 'bg-[#034694] text-white' : 'hover:bg-[#034694]/10 text-[#034694]'} font-medium transition-colors"
            >
                ${i}
            </button>
        `;
    }
    
    pageNumbers.innerHTML = pageNumbersHTML;
}

/**
 * Go to specific page
 */
window.goToPage = function(page) {
    const totalPages = Math.ceil(filteredVoices.length / itemsPerPage);
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    renderTable();
    document.querySelector('.voice-table-container').scrollTop = 0;
};

/**
 * Toggle voice enabled/disabled
 */
window.toggleVoice = async function(voiceId) {
    const voice = allVoices.find(v => v.id === voiceId);
    if (!voice) return;
    
    const newStatus = !voice.enabled;
    
    try {
        const response = await fetch(`/api/admin/voices/${voiceId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ enabled: newStatus })
        });
        
        if (!response.ok) throw new Error('Failed to update');
    } catch (error) {
        console.log('[Admin] API not available, updating locally');
    }
    
    // Update local state
    voice.enabled = newStatus;
    renderTable();
    updateStats();
    showToast(newStatus ? 'Voice enabled' : 'Voice disabled');
};

/**
 * Bulk toggle voices
 */
async function bulkToggle(enabled) {
    const voicesToUpdate = filteredVoices;
    
    try {
        await fetch('/api/admin/voices/bulk', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                voiceIds: voicesToUpdate.map(v => v.id),
                enabled 
            })
        });
    } catch (error) {
        console.log('[Admin] Bulk update locally');
    }
    
    // Update local state
    voicesToUpdate.forEach(voice => {
        const v = allVoices.find(av => av.id === voice.id);
        if (v) v.enabled = enabled;
    });
    
    renderTable();
    updateStats();
    showToast(enabled ? `${voicesToUpdate.length} voices enabled` : `${voicesToUpdate.length} voices disabled`);
}

/**
 * Open add voice modal
 */
function openAddModal() {
    modalTitle.textContent = 'Add New Voice';
    submitBtnText.textContent = 'Add Voice';
    voiceForm.reset();
    document.getElementById('voiceEditId').value = '';
    document.getElementById('voiceEnabled').checked = true;
    voiceModal.classList.remove('hidden');
}

/**
 * Edit voice
 */
window.editVoice = function(voiceId) {
    const voice = allVoices.find(v => v.id === voiceId);
    if (!voice) return;
    
    modalTitle.textContent = 'Edit Voice';
    submitBtnText.textContent = 'Save Changes';
    
    document.getElementById('voiceEditId').value = voice.id;
    document.getElementById('voiceId').value = voice.id;
    document.getElementById('voiceName').value = voice.name;
    document.getElementById('voiceEngine').value = voice.engine;
    document.getElementById('voiceLanguage').value = voice.language;
    document.getElementById('voiceModel').value = voice.model || '';
    document.getElementById('voiceQuality').value = voice.quality || 'medium';
    document.getElementById('voiceSampleRate').value = voice.sampleRate || 22050;
    document.getElementById('voiceEnabled').checked = voice.enabled;
    
    // Set gender radio
    const genderRadio = document.querySelector(`input[name="voiceGender"][value="${voice.gender}"]`);
    if (genderRadio) genderRadio.checked = true;
    
    voiceModal.classList.remove('hidden');
};

/**
 * Close modal
 */
window.closeModal = function() {
    voiceModal.classList.add('hidden');
};

/**
 * Handle form submit
 */
async function handleFormSubmit(e) {
    e.preventDefault();
    
    const editId = document.getElementById('voiceEditId').value;
    const genderRadio = document.querySelector('input[name="voiceGender"]:checked');
    
    const voiceData = {
        id: document.getElementById('voiceId').value.trim(),
        name: document.getElementById('voiceName').value.trim(),
        engine: document.getElementById('voiceEngine').value,
        language: document.getElementById('voiceLanguage').value,
        gender: genderRadio ? genderRadio.value : 'neutral',
        model: document.getElementById('voiceModel').value.trim(),
        quality: document.getElementById('voiceQuality').value,
        sampleRate: parseInt(document.getElementById('voiceSampleRate').value) || 22050,
        enabled: document.getElementById('voiceEnabled').checked
    };
    
    try {
        if (editId) {
            // Update existing voice
            await fetch(`/api/admin/voices/${editId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(voiceData)
            });
            
            // Update local state
            const index = allVoices.findIndex(v => v.id === editId);
            if (index !== -1) {
                allVoices[index] = voiceData;
            }
            showToast('Voice updated successfully');
        } else {
            // Add new voice
            await fetch('/api/admin/voices', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(voiceData)
            });
            
            // Add to local state
            allVoices.push(voiceData);
            showToast('Voice added successfully');
        }
    } catch (error) {
        console.log('[Admin] API not available, updating locally');
        if (editId) {
            const index = allVoices.findIndex(v => v.id === editId);
            if (index !== -1) allVoices[index] = voiceData;
        } else {
            allVoices.push(voiceData);
        }
        showToast(editId ? 'Voice updated locally' : 'Voice added locally');
    }
    
    closeModal();
    applyFilters();
    updateStats();
}

/**
 * Confirm delete
 */
window.confirmDelete = function(voiceId, voiceName) {
    deleteVoiceId = voiceId;
    document.getElementById('deleteVoiceName').textContent = `Are you sure you want to delete "${voiceName}"?`;
    deleteModal.classList.remove('hidden');
    
    document.getElementById('confirmDeleteBtn').onclick = async () => {
        await deleteVoice(voiceId);
        closeDeleteModal();
    };
};

/**
 * Close delete modal
 */
window.closeDeleteModal = function() {
    deleteModal.classList.add('hidden');
    deleteVoiceId = null;
};

/**
 * Delete voice
 */
async function deleteVoice(voiceId) {
    try {
        await fetch(`/api/admin/voices/${voiceId}`, {
            method: 'DELETE'
        });
    } catch (error) {
        console.log('[Admin] Delete locally');
    }
    
    // Remove from local state
    allVoices = allVoices.filter(v => v.id !== voiceId);
    applyFilters();
    updateStats();
    showToast('Voice deleted');
}

/**
 * Show toast notification
 */
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    const toastIcon = document.getElementById('toastIcon');
    
    toastMessage.textContent = message;
    
    if (type === 'error') {
        toast.querySelector('div').className = 'bg-red-500 text-white px-6 py-4 rounded-xl shadow-lg flex items-center gap-3';
        toastIcon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>';
    } else {
        toast.querySelector('div').className = 'bg-[#034694] text-white px-6 py-4 rounded-xl shadow-lg flex items-center gap-3';
        toastIcon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>';
    }
    
    toast.classList.remove('hidden');
    toast.classList.add('fade-in');
    
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}

// ===== Voice Preview Functions =====

/**
 * Demo text samples for different languages
 */
const demoTexts = {
    'en': 'Hello, this is a sample voice preview. Welcome to MySpeech.',
    'en-US': 'Hello, this is a sample voice preview. Welcome to MySpeech.',
    'en-GB': 'Hello, this is a sample voice preview. Welcome to MySpeech.',
    'en-AU': 'Hello, this is a sample voice preview. Welcome to MySpeech.',
    'ar': 'مرحبا، هذا عرض صوتي تجريبي. أهلا بكم في تطبيقنا.',
    'ar-EG': 'مرحبا، ده عرض صوتي تجريبي. أهلا بيكم.',
    'ar-SA': 'مرحبا، هذا عرض صوتي تجريبي. أهلا وسهلا.',
    'ar-LB': 'مرحبا، هيدا عرض صوتي تجريبي. أهلا فيكم.',
    'fr': 'Bonjour, ceci est un aperçu vocal. Bienvenue sur MySpeech.',
    'fr-CA': 'Bonjour, ceci est un aperçu vocal. Bienvenue sur MySpeech.',
    'es': 'Hola, esta es una muestra de voz. Bienvenido a MySpeech.',
    'es-MX': 'Hola, esta es una muestra de voz. Bienvenido a MySpeech.',
    'es-AR': 'Hola, esta es una muestra de voz. Bienvenido a MySpeech.',
    'de': 'Hallo, dies ist eine Sprachvorschau. Willkommen bei MySpeech.',
    'it': 'Ciao, questa è un\'anteprima vocale. Benvenuto su MySpeech.',
    'pt': 'Olá, esta é uma prévia de voz. Bem-vindo ao MySpeech.',
    'pt-BR': 'Olá, esta é uma prévia de voz. Bem-vindo ao MySpeech.',
    'ru': 'Привет, это образец голоса. Добро пожаловать в MySpeech.',
    'zh': '你好，这是语音预览。欢迎使用MySpeech。',
    'zh-TW': '你好，這是語音預覽。歡迎使用MySpeech。',
    'ja': 'こんにちは、これは音声プレビューです。MySpeechへようこそ。',
    'ko': '안녕하세요, 음성 미리보기입니다. MySpeech에 오신 것을 환영합니다.',
    'tr': 'Merhaba, bu bir ses önizlemesidir. MySpeech\'e hoş geldiniz.',
    'hi': 'नमस्ते, यह एक आवाज का पूर्वावलोकन है। MySpeech में आपका स्वागत है।',
    'id': 'Halo, ini adalah pratinjau suara. Selamat datang di MySpeech.',
    'vi': 'Xin chào, đây là bản xem trước giọng nói. Chào mừng đến với MySpeech.',
    'nl': 'Hallo, dit is een stemvoorbeeld. Welkom bij MySpeech.',
    'pl': 'Cześć, to jest podgląd głosu. Witamy w MySpeech.',
    'sv': 'Hej, det här är en röstförhandsvisning. Välkommen till MySpeech.',
    'da': 'Hej, dette er en stemmeeksempel. Velkommen til MySpeech.',
    'no': 'Hei, dette er en stemmeprøve. Velkommen til MySpeech.',
    'fi': 'Hei, tämä on ääninäyte. Tervetuloa MySpeechiin.',
    'el': 'Γεια σας, αυτή είναι μια προεπισκόπηση φωνής. Καλώς ήρθατε.',
    'he': 'שלום, זו תצוגה מקדימה של קול. ברוכים הבאים.',
    'th': 'สวัสดี นี่คือตัวอย่างเสียง ยินดีต้อนรับสู่ MySpeech',
    'default': 'Hello, this is a sample voice preview. Welcome to MySpeech.'
};

/**
 * Language to Speech Synthesis language code mapping
 */
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

// Store synthesis utterances to control them
let currentUtterance = null;
let isSpeaking = false;

/**
 * Get demo text for a language
 */
function getDemoText(language) {
    return demoTexts[language] || demoTexts[language.split('-')[0]] || demoTexts['default'];
}

/**
 * Play voice preview using Web Speech API (browser's built-in TTS)
 */
window.playVoicePreview = async function(voiceId) {
    const voice = allVoices.find(v => v.id === voiceId);
    if (!voice) return;
    
    const playBtn = document.getElementById(`play-btn-${voiceId}`);
    
    if (!playBtn) return;
    
    // If currently speaking this voice, stop it
    if (currentlyPlayingVoiceId === voiceId && isSpeaking) {
        window.speechSynthesis.cancel();
        isSpeaking = false;
        showPlayIcon(voiceId);
        currentlyPlayingVoiceId = null;
        return;
    }
    
    // Stop any currently playing speech
    if (currentlyPlayingVoiceId && currentlyPlayingVoiceId !== voiceId) {
        window.speechSynthesis.cancel();
        showPlayIcon(currentlyPlayingVoiceId);
    }
    
    // Show loading state briefly
    showLoadingIcon(voiceId);
    playBtn.disabled = true;
    
    // Get demo text for the voice's language
    const demoText = getDemoText(voice.language);
    
    // Wait for voices to load (needed for some browsers)
    await loadVoicesAsync();
    
    // Create utterance
    const utterance = new SpeechSynthesisUtterance(demoText);
    
    // Get the language code for this voice
    const langCode = langCodeMap[voice.language] || langCodeMap[voice.language.split('-')[0]] || 'en-US';
    utterance.lang = langCode;
    
    // Set voice parameters based on gender
    if (voice.gender === 'female') {
        utterance.pitch = 1.2;
        utterance.rate = 1.0;
    } else if (voice.gender === 'male') {
        utterance.pitch = 0.8;
        utterance.rate = 0.95;
    } else {
        utterance.pitch = 1.0;
        utterance.rate = 1.0;
    }
    
    // Try to find a matching system voice
    const voices = window.speechSynthesis.getVoices();
    let selectedVoice = null;
    
    // First, try to find a voice matching the exact language code
    selectedVoice = voices.find(v => v.lang === langCode);
    
    // If not found, try to find by language prefix
    if (!selectedVoice) {
        const langPrefix = langCode.split('-')[0];
        selectedVoice = voices.find(v => v.lang.startsWith(langPrefix));
    }
    
    // If still not found, try to match gender preference
    if (!selectedVoice && voices.length > 0) {
        if (voice.gender === 'female') {
            selectedVoice = voices.find(v => 
                v.name.toLowerCase().includes('female') || 
                v.name.toLowerCase().includes('woman') ||
                v.name.toLowerCase().includes('samantha') ||
                v.name.toLowerCase().includes('victoria') ||
                v.name.toLowerCase().includes('karen') ||
                v.name.toLowerCase().includes('zira') ||
                v.name.toLowerCase().includes('hazel')
            );
        } else if (voice.gender === 'male') {
            selectedVoice = voices.find(v => 
                v.name.toLowerCase().includes('male') || 
                v.name.toLowerCase().includes('man') ||
                v.name.toLowerCase().includes('daniel') ||
                v.name.toLowerCase().includes('david') ||
                v.name.toLowerCase().includes('alex') ||
                v.name.toLowerCase().includes('mark') ||
                v.name.toLowerCase().includes('james')
            );
        }
    }
    
    // Use the first available voice if none matched
    if (!selectedVoice && voices.length > 0) {
        selectedVoice = voices[0];
    }
    
    // Use the selected voice
    if (selectedVoice) {
        utterance.voice = selectedVoice;
        console.log(`[Preview] Using voice: ${selectedVoice.name} (${selectedVoice.lang})`);
    }
    
    // Handle speech start
    utterance.onstart = () => {
        isSpeaking = true;
        currentlyPlayingVoiceId = voiceId;
        showPauseIcon(voiceId);
        playBtn.disabled = false;
    };
    
    // Handle speech end
    utterance.onend = () => {
        isSpeaking = false;
        currentlyPlayingVoiceId = null;
        showPlayIcon(voiceId);
    };
    
    // Handle speech error
    utterance.onerror = (event) => {
        console.error('[Preview] Speech error:', event.error);
        isSpeaking = false;
        currentlyPlayingVoiceId = null;
        showPlayIcon(voiceId);
        playBtn.disabled = false;
        
        if (event.error !== 'canceled') {
            showToast('Speech synthesis failed. Try another voice.', 'error');
        }
    };
    
    // Start speaking
    try {
        window.speechSynthesis.speak(utterance);
        // Small delay to show loading state
        setTimeout(() => {
            if (!isSpeaking) {
                showPauseIcon(voiceId);
                currentlyPlayingVoiceId = voiceId;
                isSpeaking = true;
            }
            playBtn.disabled = false;
        }, 100);
    } catch (error) {
        console.error('[Preview] Error starting speech:', error);
        showPlayIcon(voiceId);
        playBtn.disabled = false;
        showToast('Failed to start preview', 'error');
    }
};

/**
 * Load voices asynchronously (needed for Chrome)
 */
function loadVoicesAsync() {
    return new Promise((resolve) => {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
            resolve(voices);
            return;
        }
        
        // Wait for voices to load
        window.speechSynthesis.onvoiceschanged = () => {
            resolve(window.speechSynthesis.getVoices());
        };
        
        // Timeout after 1 second
        setTimeout(() => {
            resolve(window.speechSynthesis.getVoices());
        }, 1000);
    });
}

/**
 * Generate client-side demo using Web Speech API (SpeechSynthesis)
 * This produces real, natural-sounding speech using the browser's built-in TTS
 */
async function generateClientSideDemo(voice, text) {
    return new Promise((resolve, reject) => {
        // Check if Web Speech API is available
        if (!('speechSynthesis' in window)) {
            console.error('[Preview] Web Speech API not supported');
            reject(new Error('Speech synthesis not supported'));
            return;
        }
        
        // Cancel any ongoing speech
        window.speechSynthesis.cancel();
        
        // Create utterance
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Get the language code for this voice
        const langCode = langCodeMap[voice.language] || langCodeMap[voice.language.split('-')[0]] || 'en-US';
        utterance.lang = langCode;
        
        // Set voice parameters based on gender
        if (voice.gender === 'female') {
            utterance.pitch = 1.1;
            utterance.rate = 1.0;
        } else if (voice.gender === 'male') {
            utterance.pitch = 0.9;
            utterance.rate = 0.95;
        } else {
            utterance.pitch = 1.0;
            utterance.rate = 1.0;
        }
        
        // Try to find a matching system voice
        const voices = window.speechSynthesis.getVoices();
        let selectedVoice = null;
        
        // First, try to find a voice matching the exact language code
        selectedVoice = voices.find(v => v.lang === langCode);
        
        // If not found, try to find by language prefix
        if (!selectedVoice) {
            const langPrefix = langCode.split('-')[0];
            selectedVoice = voices.find(v => v.lang.startsWith(langPrefix));
        }
        
        // If still not found, try to match gender preference
        if (!selectedVoice && voices.length > 0) {
            if (voice.gender === 'female') {
                selectedVoice = voices.find(v => 
                    v.name.toLowerCase().includes('female') || 
                    v.name.toLowerCase().includes('woman') ||
                    v.name.toLowerCase().includes('samantha') ||
                    v.name.toLowerCase().includes('victoria') ||
                    v.name.toLowerCase().includes('karen')
                );
            } else if (voice.gender === 'male') {
                selectedVoice = voices.find(v => 
                    v.name.toLowerCase().includes('male') || 
                    v.name.toLowerCase().includes('man') ||
                    v.name.toLowerCase().includes('daniel') ||
                    v.name.toLowerCase().includes('david') ||
                    v.name.toLowerCase().includes('alex')
                );
            }
        }
        
        // Use the selected voice or default
        if (selectedVoice) {
            utterance.voice = selectedVoice;
            console.log(`[Preview] Using system voice: ${selectedVoice.name} (${selectedVoice.lang})`);
        }
        
        // Store reference for control
        currentUtterance = utterance;
        
        // Handle speech end - we'll use a visual indicator instead of audio file
        utterance.onend = () => {
            isSpeaking = false;
            currentUtterance = null;
            // Resolve with a special marker indicating speech synthesis was used
            resolve('speech-synthesis');
        };
        
        utterance.onerror = (event) => {
            isSpeaking = false;
            currentUtterance = null;
            console.error('[Preview] Speech synthesis error:', event.error);
            reject(new Error(event.error));
        };
        
        // Start speaking
        isSpeaking = true;
        window.speechSynthesis.speak(utterance);
        
        // Resolve immediately with special marker
        resolve('speech-synthesis');
    });
}

/**
 * Convert AudioBuffer to WAV Blob
 */
function bufferToWave(abuffer, len) {
    const numOfChan = abuffer.numberOfChannels;
    const length = len * numOfChan * 2 + 44;
    const buffer = new ArrayBuffer(length);
    const view = new DataView(buffer);
    const channels = [];
    let offset = 0;
    let pos = 0;

    setUint32(0x46464952);
    setUint32(length - 8);
    setUint32(0x45564157);
    setUint32(0x20746d66);
    setUint32(16);
    setUint16(1);
    setUint16(numOfChan);
    setUint32(abuffer.sampleRate);
    setUint32(abuffer.sampleRate * 2 * numOfChan);
    setUint16(numOfChan * 2);
    setUint16(16);
    setUint32(0x61746164);
    setUint32(length - pos - 4);

    for (let i = 0; i < abuffer.numberOfChannels; i++) {
        channels.push(abuffer.getChannelData(i));
    }

    while (pos < length) {
        for (let i = 0; i < numOfChan; i++) {
            let sample = Math.max(-1, Math.min(1, channels[i][offset]));
            sample = (sample < 0 ? sample * 0x8000 : sample * 0x7FFF) | 0;
            view.setInt16(pos, sample, true);
            pos += 2;
        }
        offset++;
    }

    return new Blob([buffer], { type: 'audio/wav' });

    function setUint16(data) {
        view.setUint16(pos, data, true);
        pos += 2;
    }

    function setUint32(data) {
        view.setUint32(pos, data, true);
        pos += 4;
    }
}

/**
 * Show play icon for a voice
 */
function showPlayIcon(voiceId) {
    const playIcon = document.getElementById(`play-icon-${voiceId}`);
    const pauseIcon = document.getElementById(`pause-icon-${voiceId}`);
    const loadingIcon = document.getElementById(`loading-icon-${voiceId}`);
    
    if (playIcon) playIcon.classList.remove('hidden');
    if (pauseIcon) pauseIcon.classList.add('hidden');
    if (loadingIcon) loadingIcon.classList.add('hidden');
}

/**
 * Show pause icon for a voice
 */
function showPauseIcon(voiceId) {
    const playIcon = document.getElementById(`play-icon-${voiceId}`);
    const pauseIcon = document.getElementById(`pause-icon-${voiceId}`);
    const loadingIcon = document.getElementById(`loading-icon-${voiceId}`);
    
    if (playIcon) playIcon.classList.add('hidden');
    if (pauseIcon) pauseIcon.classList.remove('hidden');
    if (loadingIcon) loadingIcon.classList.add('hidden');
}

/**
 * Show loading icon for a voice
 */
function showLoadingIcon(voiceId) {
    const playIcon = document.getElementById(`play-icon-${voiceId}`);
    const pauseIcon = document.getElementById(`pause-icon-${voiceId}`);
    const loadingIcon = document.getElementById(`loading-icon-${voiceId}`);
    
    if (playIcon) playIcon.classList.add('hidden');
    if (pauseIcon) pauseIcon.classList.add('hidden');
    if (loadingIcon) loadingIcon.classList.remove('hidden');
}

/**
 * Stop all playing previews
 */
window.stopAllPreviews = function() {
    if (currentlyPlayingVoiceId) {
        const audioElement = document.getElementById(`audio-${currentlyPlayingVoiceId}`);
        if (audioElement) {
            audioElement.pause();
            audioElement.currentTime = 0;
        }
        showPlayIcon(currentlyPlayingVoiceId);
        currentlyPlayingVoiceId = null;
    }
};
