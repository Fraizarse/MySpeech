/**
 * MySpeech - Admin API Router
 * Handles voice management: CRUD operations, enable/disable, bulk updates
 */

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// ===== Voices File Path =====
const voicesPath = path.join(__dirname, '..', 'voices.json');

/**
 * Load voices data from JSON file
 */
function loadVoicesData() {
    try {
        const data = fs.readFileSync(voicesPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('[Admin] Failed to load voices.json:', error.message);
        return { voices: [], engines: {}, languages: {} };
    }
}

/**
 * Save voices data to JSON file
 */
function saveVoicesData(data) {
    try {
        fs.writeFileSync(voicesPath, JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error('[Admin] Failed to save voices.json:', error.message);
        return false;
    }
}

/**
 * GET /api/admin/voices
 * Get all voices (including disabled ones) for admin
 */
router.get('/voices', (req, res) => {
    const voicesData = loadVoicesData();
    
    res.json({
        success: true,
        total: voicesData.voices.length,
        voices: voicesData.voices,
        languages: voicesData.languages,
        engines: voicesData.engines
    });
});

/**
 * GET /api/admin/voices/:id
 * Get a specific voice by ID
 */
router.get('/voices/:id', (req, res) => {
    const voicesData = loadVoicesData();
    const voice = voicesData.voices.find(v => v.id === req.params.id);
    
    if (!voice) {
        return res.status(404).json({
            success: false,
            message: 'Voice not found'
        });
    }
    
    res.json({
        success: true,
        voice
    });
});

/**
 * POST /api/admin/voices
 * Add a new voice
 */
router.post('/voices', (req, res) => {
    const voicesData = loadVoicesData();
    const { id, name, engine, language, gender, model, quality, sampleRate, enabled } = req.body;
    
    // Validation
    if (!id || !name || !engine || !language) {
        return res.status(400).json({
            success: false,
            message: 'Missing required fields: id, name, engine, language'
        });
    }
    
    // Check for duplicate ID
    if (voicesData.voices.some(v => v.id === id)) {
        return res.status(400).json({
            success: false,
            message: 'Voice ID already exists'
        });
    }
    
    // Create new voice object
    const newVoice = {
        id: id.toLowerCase().replace(/\s+/g, '_'),
        name,
        engine,
        language,
        gender: gender || 'neutral',
        model: model || '',
        quality: quality || 'medium',
        sampleRate: sampleRate || 22050,
        enabled: enabled !== false
    };
    
    // Add to voices array
    voicesData.voices.push(newVoice);
    voicesData.totalVoices = voicesData.voices.length;
    voicesData.lastUpdated = new Date().toISOString().split('T')[0];
    
    // Save
    if (saveVoicesData(voicesData)) {
        res.status(201).json({
            success: true,
            message: 'Voice added successfully',
            voice: newVoice
        });
    } else {
        res.status(500).json({
            success: false,
            message: 'Failed to save voice'
        });
    }
});

/**
 * PUT /api/admin/voices/:id
 * Update an existing voice
 */
router.put('/voices/:id', (req, res) => {
    const voicesData = loadVoicesData();
    const voiceIndex = voicesData.voices.findIndex(v => v.id === req.params.id);
    
    if (voiceIndex === -1) {
        return res.status(404).json({
            success: false,
            message: 'Voice not found'
        });
    }
    
    const { id, name, engine, language, gender, model, quality, sampleRate, enabled } = req.body;
    
    // Update voice
    voicesData.voices[voiceIndex] = {
        ...voicesData.voices[voiceIndex],
        id: id || voicesData.voices[voiceIndex].id,
        name: name || voicesData.voices[voiceIndex].name,
        engine: engine || voicesData.voices[voiceIndex].engine,
        language: language || voicesData.voices[voiceIndex].language,
        gender: gender || voicesData.voices[voiceIndex].gender,
        model: model !== undefined ? model : voicesData.voices[voiceIndex].model,
        quality: quality || voicesData.voices[voiceIndex].quality,
        sampleRate: sampleRate || voicesData.voices[voiceIndex].sampleRate,
        enabled: enabled !== undefined ? enabled : voicesData.voices[voiceIndex].enabled
    };
    
    voicesData.lastUpdated = new Date().toISOString().split('T')[0];
    
    if (saveVoicesData(voicesData)) {
        res.json({
            success: true,
            message: 'Voice updated successfully',
            voice: voicesData.voices[voiceIndex]
        });
    } else {
        res.status(500).json({
            success: false,
            message: 'Failed to update voice'
        });
    }
});

/**
 * PATCH /api/admin/voices/:id
 * Partially update a voice (e.g., enable/disable)
 */
router.patch('/voices/:id', (req, res) => {
    const voicesData = loadVoicesData();
    const voiceIndex = voicesData.voices.findIndex(v => v.id === req.params.id);
    
    if (voiceIndex === -1) {
        return res.status(404).json({
            success: false,
            message: 'Voice not found'
        });
    }
    
    // Update only provided fields
    Object.keys(req.body).forEach(key => {
        if (req.body[key] !== undefined) {
            voicesData.voices[voiceIndex][key] = req.body[key];
        }
    });
    
    voicesData.lastUpdated = new Date().toISOString().split('T')[0];
    
    if (saveVoicesData(voicesData)) {
        res.json({
            success: true,
            message: 'Voice updated successfully',
            voice: voicesData.voices[voiceIndex]
        });
    } else {
        res.status(500).json({
            success: false,
            message: 'Failed to update voice'
        });
    }
});

/**
 * PATCH /api/admin/voices/bulk
 * Bulk update voices (enable/disable multiple)
 */
router.patch('/voices/bulk', (req, res) => {
    const voicesData = loadVoicesData();
    const { voiceIds, enabled } = req.body;
    
    if (!Array.isArray(voiceIds)) {
        return res.status(400).json({
            success: false,
            message: 'voiceIds must be an array'
        });
    }
    
    let updatedCount = 0;
    
    voiceIds.forEach(id => {
        const voiceIndex = voicesData.voices.findIndex(v => v.id === id);
        if (voiceIndex !== -1) {
            voicesData.voices[voiceIndex].enabled = enabled;
            updatedCount++;
        }
    });
    
    voicesData.lastUpdated = new Date().toISOString().split('T')[0];
    
    if (saveVoicesData(voicesData)) {
        res.json({
            success: true,
            message: `${updatedCount} voices updated`,
            updatedCount
        });
    } else {
        res.status(500).json({
            success: false,
            message: 'Failed to update voices'
        });
    }
});

/**
 * DELETE /api/admin/voices/:id
 * Delete a voice
 */
router.delete('/voices/:id', (req, res) => {
    const voicesData = loadVoicesData();
    const voiceIndex = voicesData.voices.findIndex(v => v.id === req.params.id);
    
    if (voiceIndex === -1) {
        return res.status(404).json({
            success: false,
            message: 'Voice not found'
        });
    }
    
    const deletedVoice = voicesData.voices.splice(voiceIndex, 1)[0];
    voicesData.totalVoices = voicesData.voices.length;
    voicesData.lastUpdated = new Date().toISOString().split('T')[0];
    
    if (saveVoicesData(voicesData)) {
        res.json({
            success: true,
            message: 'Voice deleted successfully',
            voice: deletedVoice
        });
    } else {
        res.status(500).json({
            success: false,
            message: 'Failed to delete voice'
        });
    }
});

/**
 * GET /api/admin/stats
 * Get voice statistics
 */
router.get('/stats', (req, res) => {
    const voicesData = loadVoicesData();
    
    const stats = {
        total: voicesData.voices.length,
        enabled: voicesData.voices.filter(v => v.enabled !== false).length,
        disabled: voicesData.voices.filter(v => v.enabled === false).length,
        byEngine: {},
        byLanguage: {},
        byGender: {}
    };
    
    voicesData.voices.forEach(voice => {
        // By engine
        stats.byEngine[voice.engine] = (stats.byEngine[voice.engine] || 0) + 1;
        
        // By language
        const lang = voice.language.split('-')[0];
        stats.byLanguage[lang] = (stats.byLanguage[lang] || 0) + 1;
        
        // By gender
        stats.byGender[voice.gender] = (stats.byGender[voice.gender] || 0) + 1;
    });
    
    res.json({
        success: true,
        stats
    });
});

/**
 * POST /api/admin/export
 * Export voices data
 */
router.post('/export', (req, res) => {
    const voicesData = loadVoicesData();
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=voices_export.json');
    res.json(voicesData);
});

/**
 * POST /api/admin/import
 * Import voices data
 */
router.post('/import', (req, res) => {
    const { voices, merge } = req.body;
    
    if (!Array.isArray(voices)) {
        return res.status(400).json({
            success: false,
            message: 'voices must be an array'
        });
    }
    
    const voicesData = loadVoicesData();
    let importedCount = 0;
    let skippedCount = 0;
    
    voices.forEach(voice => {
        const exists = voicesData.voices.some(v => v.id === voice.id);
        
        if (exists && !merge) {
            skippedCount++;
        } else if (exists && merge) {
            const index = voicesData.voices.findIndex(v => v.id === voice.id);
            voicesData.voices[index] = { ...voicesData.voices[index], ...voice };
            importedCount++;
        } else {
            voicesData.voices.push(voice);
            importedCount++;
        }
    });
    
    voicesData.totalVoices = voicesData.voices.length;
    voicesData.lastUpdated = new Date().toISOString().split('T')[0];
    
    if (saveVoicesData(voicesData)) {
        res.json({
            success: true,
            message: `Imported ${importedCount} voices, skipped ${skippedCount}`,
            importedCount,
            skippedCount,
            total: voicesData.voices.length
        });
    } else {
        res.status(500).json({
            success: false,
            message: 'Failed to import voices'
        });
    }
});

module.exports = router;
