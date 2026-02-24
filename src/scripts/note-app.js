/* ===== SwiftNotes — Note Window App ===== */
/* Transparent window with shape, drag anywhere, pin toggle, auto-resize */

import { loadData, getNotes, saveData, getData } from './storage.js';

const FONT_MAP = {
    'Caveat': "'Caveat', cursive",
    'Quicksand': "'Quicksand', sans-serif",
    'Patrick Hand': "'Patrick Hand', cursive",
    'Satisfy': "'Satisfy', cursive",
};

const MAX_CHARS = 1000;

/** Base sizes per shape (also used as minimum) */
const BASE_SIZES = {
    square: { w: 260, h: 260 },
    rounded: { w: 260, h: 240 },
    heart: { w: 280, h: 260 },
    star: { w: 300, h: 290 },
    circle: { w: 250, h: 250 },
    cloud: { w: 290, h: 210 },
};

/** Max window size per shape */
const MAX_SIZES = {
    square: { w: 400, h: 500 },
    rounded: { w: 400, h: 500 },
    heart: { w: 450, h: 420 },
    star: { w: 480, h: 460 },
    circle: { w: 400, h: 400 },
    cloud: { w: 420, h: 350 },
};

let noteId = null;
let noteData = null;
let saveTimeout = null;
let firstRender = true;
let tauriWin = null;

/**
 * Initialize
 */
async function init() {
    const params = new URLSearchParams(window.location.search);
    noteId = params.get('id');
    if (!noteId) return;

    // Retry loading (file might not be flushed yet)
    let attempts = 0;
    while (attempts < 5) {
        await loadData();
        noteData = getNotes().find(n => n.id === noteId);
        if (noteData) break;
        attempts++;
        await new Promise(r => setTimeout(r, 500));
    }

    if (!noteData) {
        console.error('[Note] Not found:', noteId);
        return;
    }

    // Cache Tauri window
    try {
        const mod = await import('@tauri-apps/api/window');
        tauriWin = mod.getCurrentWindow();
    } catch (e) { /* browser */ }

    applyTheme();
    renderNote();
    setupEditing();
    setupDrag();
    setupPin();
    trackWindowGeometry();

    setInterval(checkForUpdates, 1500);
}

/**
 * Apply theme
 */
function applyTheme() {
    document.documentElement.setAttribute('data-theme', getData().settings.theme || 'midnights');
}

let cache = {};

/**
 * Check for manager updates
 */
async function checkForUpdates() {
    await loadData();
    const freshNote = getNotes().find(n => n.id === noteId);

    if (!freshNote) {
        if (tauriWin) {
            try { await tauriWin.destroy(); } catch (e) { window.close(); }
        } else { window.close(); }
        return;
    }

    const theme = getData().settings.theme || 'midnights';

    if (freshNote.shape !== cache.shape ||
        freshNote.colorIndex !== cache.colorIndex ||
        freshNote.font !== cache.font ||
        freshNote.glitter !== cache.glitter ||
        freshNote.pinned !== cache.pinned ||
        theme !== cache.theme) {

        const localTitle = noteData.title;
        const localText = noteData.text;
        noteData = freshNote;
        if (localTitle) noteData.title = localTitle;
        if (localText) noteData.text = localText;

        applyTheme();
        renderNote();
    }
}

/**
 * Render note
 */
function renderNote() {
    const win = document.getElementById('note-window');
    const titleEl = win.querySelector('.note-title');
    const textEl = win.querySelector('.note-text');
    const pinEl = document.getElementById('note-pin');

    const shape = noteData.shape || 'square';
    const colorIdx = noteData.colorIndex ?? 0;

    // Set classes
    win.className = 'note-window';
    win.classList.add(`shape-${shape}`);
    win.classList.add(`note-color-${colorIdx}`);

    // Pin state
    pinEl.classList.toggle('pinned', !!noteData.pinned);

    // Cache
    cache = {
        shape: noteData.shape,
        colorIndex: noteData.colorIndex,
        font: noteData.font,
        glitter: noteData.glitter,
        pinned: noteData.pinned,
        theme: getData().settings.theme || 'midnights',
    };

    // First render: set text
    if (firstRender) {
        if (noteData.title) titleEl.textContent = noteData.title;
        if (noteData.text) textEl.textContent = noteData.text;
        firstRender = false;
    }

    // Font
    if (noteData.font && FONT_MAP[noteData.font]) {
        textEl.style.fontFamily = FONT_MAP[noteData.font];
    }

    // Content area for clip-path shapes
    const noteBody = document.getElementById('note-body');
    if (['heart', 'star', 'circle', 'cloud'].includes(shape)) {
        let contentArea = noteBody.querySelector('.note-content-area');
        if (!contentArea) {
            contentArea = document.createElement('div');
            contentArea.className = 'note-content-area';
            contentArea.appendChild(titleEl);
            contentArea.appendChild(textEl);
            noteBody.appendChild(contentArea);
        }
    } else {
        const contentArea = noteBody.querySelector('.note-content-area');
        if (contentArea) {
            noteBody.insertBefore(titleEl, contentArea);
            noteBody.insertBefore(textEl, contentArea);
            contentArea.remove();
        }
    }

    // Glitter
    const gc = document.getElementById('glitter-container');
    if (noteData.glitter) {
        if (gc.children.length === 0) addGlitter(gc);
    } else {
        gc.innerHTML = '';
    }

    // Set initial size on first render, then auto-resize based on content
    autoResize();
}

/**
 * Auto-resize: grow window proportionally when text overflows
 */
async function autoResize() {
    if (!tauriWin) return;

    const shape = noteData.shape || 'square';
    const base = BASE_SIZES[shape] || BASE_SIZES.square;
    const max = MAX_SIZES[shape] || MAX_SIZES.square;

    try {
        const { LogicalSize } = await import('@tauri-apps/api/dpi');

        // Check for overflow
        const contentArea = document.querySelector('.note-content-area');
        const noteBody = document.getElementById('note-body');
        let overflowRatio = 1;

        if (contentArea && contentArea.scrollHeight > contentArea.clientHeight + 4) {
            overflowRatio = contentArea.scrollHeight / contentArea.clientHeight;
        } else if (!contentArea && noteBody && noteBody.scrollHeight > noteBody.clientHeight + 4) {
            overflowRatio = noteBody.scrollHeight / noteBody.clientHeight;
        }

        if (overflowRatio > 1) {
            // Grow proportionally, clamped to max
            const scaleW = Math.min(overflowRatio, max.w / base.w);
            const scaleH = Math.min(overflowRatio, max.h / base.h);
            const newW = Math.round(base.w * scaleW);
            const newH = Math.round(base.h * scaleH);
            await tauriWin.setSize(new LogicalSize(
                Math.min(newW, max.w),
                Math.min(newH, max.h)
            ));
        } else {
            await tauriWin.setSize(new LogicalSize(base.w, base.h));
        }
    } catch (e) { /* browser */ }
}

/**
 * Setup drag: click-hold anywhere except text areas
 */
function setupDrag() {
    const noteBody = document.getElementById('note-body');

    noteBody.addEventListener('mousedown', async (e) => {
        if (e.target.closest('.note-title, .note-text')) return;
        if (tauriWin) {
            try { await tauriWin.startDragging(); } catch (err) { }
        }
    });
}

/**
 * Setup the gold pin as a toggle for always-on-top
 */
function setupPin() {
    const pinEl = document.getElementById('note-pin');

    pinEl.addEventListener('click', async () => {
        noteData.pinned = !noteData.pinned;

        // Visual update
        pinEl.classList.toggle('pinned', noteData.pinned);

        // Pulse animation
        pinEl.classList.remove('animate');
        void pinEl.offsetWidth; // Force reflow
        pinEl.classList.add('animate');

        // Set always-on-top
        if (tauriWin) {
            try {
                await tauriWin.setAlwaysOnTop(noteData.pinned);
            } catch (e) { }
        }

        // Save
        await loadData();
        const freshNote = getNotes().find(n => n.id === noteId);
        if (freshNote) {
            freshNote.pinned = noteData.pinned;
        }
        saveData();
    });
}

/**
 * Setup text editing with char limit
 */
function setupEditing() {
    const titleEl = document.querySelector('.note-title');
    const textEl = document.querySelector('.note-text');

    const save = () => {
        noteData.title = titleEl.textContent.trim();
        noteData.text = textEl.textContent.trim();
        debouncedSave();
        setTimeout(autoResize, 100);
    };

    titleEl.addEventListener('input', save);
    textEl.addEventListener('input', (e) => {
        const text = textEl.textContent;
        if (text.length > MAX_CHARS) {
            textEl.textContent = text.substring(0, MAX_CHARS);
            const range = document.createRange();
            const sel = window.getSelection();
            range.selectNodeContents(textEl);
            range.collapse(false);
            sel.removeAllRanges();
            sel.addRange(range);
        }
        save();
    });

    titleEl.style.userSelect = 'text';
    textEl.style.userSelect = 'text';

    titleEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); textEl.focus(); }
    });
}

/**
 * Track window position
 */
async function trackWindowGeometry() {
    if (!tauriWin) return;
    try {
        tauriWin.onMoved(({ payload }) => {
            noteData.position = { x: payload.x, y: payload.y };
            debouncedSave();
        });
    } catch (e) { }
}

/**
 * Glitter
 */
function addGlitter(container) {
    container.innerHTML = '';
    const colors = ['#a8c0f0', '#d4a8f0', '#f0d4a8', '#f0c75e', '#ffffff'];
    for (let i = 0; i < 25; i++) {
        const p = document.createElement('div');
        p.className = 'glitter-particle';
        const size = 2 + Math.random() * 3;
        p.style.width = size + 'px';
        p.style.height = size + 'px';
        p.style.left = Math.random() * 100 + '%';
        p.style.top = Math.random() * 100 + '%';
        p.style.background = colors[Math.floor(Math.random() * colors.length)];
        p.style.setProperty('--dur', (1.5 + Math.random() * 2.5) + 's');
        p.style.animationDelay = -Math.random() * 3 + 's';
        container.appendChild(p);
    }
}

/**
 * Debounced save — reloads from disk first
 */
function debouncedSave() {
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(async () => {
        await loadData();
        const freshNote = getNotes().find(n => n.id === noteId);
        if (freshNote) {
            freshNote.title = noteData.title;
            freshNote.text = noteData.text;
            if (noteData.position) freshNote.position = noteData.position;
            freshNote.pinned = noteData.pinned;
        }
        saveData();
    }, 500);
}

init().catch(e => console.error('[Note] Init failed:', e));
