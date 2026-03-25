/* ===== SwiftNotes — Manager App ===== */
/* Dashboard with starfield, creation toolbar, notes list */

import { loadData, getNotes, saveData, saveDataNow, generateId, getSettings, updateSettings } from './storage.js';
import { openNoteWindow, closeNoteWindow, isTauri } from './windows.js';

const SHAPE_ICONS = { square: '📝', rounded: '📒', heart: '💜', star: '⭐', circle: '🔵', cloud: '☁️' };

const COLOR_GRADIENTS = {
    midnights: [
        ['#1a3260', '#1e3a6e'],
        ['#2d2660', '#3d2b7b'],
        ['#1a4040', '#1a5050'],
        ['#141830', '#1a2040'],
        ['#4a3a1a', '#5a4a2a'],
    ],
    lover: [
        ['#e080a8', '#e060a0'],
        ['#c090e0', '#b070d0'],
        ['#80c0c0', '#60b0b0'],
        ['#f0b0c0', '#e898b0'],
        ['#e0c070', '#d0a858'],
    ],
};

const TEXT_COLORS = {
    midnights: ['#e0ecff', '#e8deff', '#d0ffff', '#c8d8f8', '#ffe8a8'],
    lover: ['#ffffff', '#ffffff', '#ffffff', '#4a0020', '#3a2800'],
};

/**
 * Get the text color for the current theme and color index
 */
function getTextColorForIndex(index) {
    const theme = getTheme();
    const colors = TEXT_COLORS[theme] || TEXT_COLORS.midnights;
    return colors[index] || '#ffffff';
}

/** Creation toolbar state */
let selectedShape = 'square';
let selectedColor = 0;
let selectedGlitter = false;

/**
 * Initialize the manager
 */
async function init() {
    await loadData();
    applyTheme();
    generateStarfield();
    renderColorButtons();
    renderNotesList();
    setupToolbar();
    setupButtons();

    // Open all existing note windows on startup
    if (isTauri()) {
        const notes = getNotes();
        for (const note of notes) {
            await openNoteWindow(note.id);
        }
    }
}

/**
 * Generate starfield background
 */
function generateStarfield() {
    const container = document.getElementById('starfield');
    container.innerHTML = '';
    for (let i = 0; i < 80; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.style.left = Math.random() * 100 + '%';
        star.style.top = Math.random() * 100 + '%';
        star.style.setProperty('--dur', (2 + Math.random() * 4) + 's');
        star.style.animationDelay = -Math.random() * 5 + 's';
        const size = (1 + Math.random() * 2) + 'px';
        star.style.width = size;
        star.style.height = size;
        container.appendChild(star);
    }
}

/**
 * Apply current theme
 */
function applyTheme() {
    const theme = getSettings().theme || 'midnights';
    document.documentElement.setAttribute('data-theme', theme);
    document.querySelectorAll('.theme-dot').forEach(dot => {
        dot.classList.toggle('active', dot.dataset.theme === theme);
    });
}

/**
 * Get current theme name
 */
function getTheme() {
    return getSettings().theme || 'midnights';
}

/**
 * Render the color buttons in the creation toolbar
 */
function renderColorButtons() {
    const container = document.getElementById('tb-colors');
    container.innerHTML = '';
    const colors = COLOR_GRADIENTS[getTheme()] || COLOR_GRADIENTS.midnights;
    for (let i = 0; i < 5; i++) {
        const btn = document.createElement('button');
        btn.className = 'tb-color';
        if (i === selectedColor) btn.classList.add('active');
        btn.style.background = `linear-gradient(135deg, ${colors[i][0]}, ${colors[i][1]})`;
        btn.dataset.color = i;
        btn.addEventListener('click', () => {
            selectedColor = i;
            container.querySelectorAll('.tb-color').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
        container.appendChild(btn);
    }
}

/**
 * Setup creation toolbar interactions
 */
function setupToolbar() {
    // Shape buttons
    document.querySelectorAll('.tb-shape').forEach(btn => {
        btn.addEventListener('click', () => {
            selectedShape = btn.dataset.shape;
            document.querySelectorAll('.tb-shape').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

    // Glitter toggle
    const glitterBtn = document.getElementById('tb-glitter');
    glitterBtn.addEventListener('click', () => {
        selectedGlitter = !selectedGlitter;
        glitterBtn.classList.toggle('active', selectedGlitter);
    });
}

/**
 * Render the notes list in the manager
 */
function renderNotesList() {
    const list = document.getElementById('notes-list');
    const empty = document.getElementById('empty-state');
    const notes = getNotes();

    // Clear list (keep empty state)
    list.querySelectorAll('.note-item').forEach(el => el.remove());

    if (notes.length === 0) {
        empty.style.display = '';
        return;
    }
    empty.style.display = 'none';

    const defaultColors = COLOR_GRADIENTS[getTheme()] || COLOR_GRADIENTS.midnights;

    for (const note of notes) {
        const item = document.createElement('div');
        item.className = 'note-item';
        item.dataset.id = note.id;

        // Color swatch — use saved gradient if available, otherwise fall back to theme
        const colorDiv = document.createElement('div');
        colorDiv.className = 'note-item-color';
        const ci = note.colorIndex ?? 0;
        if (note.colorGradient) {
            colorDiv.style.background = note.colorGradient;
        } else {
            colorDiv.style.background = `linear-gradient(135deg, ${defaultColors[ci][0]}, ${defaultColors[ci][1]})`;
        }
        colorDiv.textContent = SHAPE_ICONS[note.shape || 'square'] || '📝';

        // Info
        const info = document.createElement('div');
        info.className = 'note-item-info';
        const title = document.createElement('div');
        title.className = 'note-item-title';
        title.textContent = note.title || 'Sans titre';
        const preview = document.createElement('div');
        preview.className = 'note-item-preview';
        preview.textContent = note.text || 'Vide...';
        info.appendChild(title);
        info.appendChild(preview);

        // Actions
        const actions = document.createElement('div');
        actions.className = 'note-item-actions';

        // Show/focus button
        const showBtn = document.createElement('button');
        showBtn.className = 'note-item-btn';
        showBtn.textContent = '👁️';
        showBtn.title = 'Afficher';
        showBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (isTauri()) openNoteWindow(note.id);
        });

        // Delete button
        const delBtn = document.createElement('button');
        delBtn.className = 'note-item-btn delete';
        delBtn.textContent = '🗑️';
        delBtn.title = 'Supprimer';
        delBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            // Close the note window first
            if (isTauri()) await closeNoteWindow(note.id);
            // Remove from data
            const idx = getNotes().findIndex(n => n.id === note.id);
            if (idx !== -1) getNotes().splice(idx, 1);
            await saveDataNow(); // Immediate save!
            renderNotesList();
        });

        actions.appendChild(showBtn);
        actions.appendChild(delBtn);

        item.appendChild(colorDiv);
        item.appendChild(info);
        item.appendChild(actions);

        // Click item → open/focus window
        item.addEventListener('click', () => {
            if (isTauri()) openNoteWindow(note.id);
        });

        list.appendChild(item);
    }
}

/**
 * Setup interactive buttons
 */
function setupButtons() {
    // New Note — uses selected shape/color/glitter from toolbar
    document.getElementById('btn-new-note').addEventListener('click', async () => {
        const notes = getNotes();
        // Save the actual color values so they persist across theme changes
        const colors = COLOR_GRADIENTS[getTheme()] || COLOR_GRADIENTS.midnights;
        const colorPair = colors[selectedColor];
        const newNote = {
            id: generateId(),
            title: '',
            text: '',
            shape: selectedShape,
            colorIndex: selectedColor,
            // Store actual colors so they don't change with theme
            colorGradient: `linear-gradient(135deg, ${colorPair[0]}, ${colorPair[1]})`,
            colorText: getTextColorForIndex(selectedColor),
            font: 'Caveat',
            glitter: selectedGlitter,
            pinned: false,
            position: {
                x: 100 + Math.random() * 300,
                y: 100 + Math.random() * 200,
            },
            size: null,
            createdAt: Date.now(),
        };
        notes.push(newNote);
        console.log('[Manager] Creating note:', newNote.id, 'shape:', newNote.shape, 'color:', newNote.colorIndex);
        await saveDataNow(); // Immediate save — must complete before opening window
        console.log('[Manager] Data saved, notes count:', getNotes().length);
        renderNotesList();

        if (isTauri()) {
            // Small delay to ensure the file is flushed to disk
            await new Promise(r => setTimeout(r, 300));
            await openNoteWindow(newNote.id);
        }
    });

    // Theme selector
    document.querySelectorAll('.theme-dot').forEach(dot => {
        dot.addEventListener('click', async () => {
            const theme = dot.dataset.theme;
            updateSettings({ theme });
            applyTheme();
            renderColorButtons(); // Update color previews for new theme
            renderNotesList();
            await saveDataNow();
        });
    });
}

// Start
init();

// Refresh list periodically (notes might change text from note windows)
setInterval(async () => {
    await loadData();
    renderNotesList();
}, 3000);
