/* ===== SwiftNotes — Notes Module ===== */

import { getNotes, saveData, generateId, getData } from './storage.js';
import { addGlitter, removeGlitter } from './glitter.js';
import { makeDraggable } from './drag.js';
import { getTheme, getCurrentTheme } from './themes.js';

const SHAPE_ICONS = {
    square: '📝',
    rounded: '📒',
    heart: '💜',
    star: '⭐',
    circle: '🔵',
    cloud: '☁️',
};

// Base dimensions for each shape
const BASE_SIZES = {
    square: { w: 220, h: 220, proportional: false },
    rounded: { w: 220, h: 200, proportional: false },
    heart: { w: 260, h: 240, proportional: true },
    star: { w: 280, h: 270, proportional: true },
    circle: { w: 220, h: 220, proportional: true },
    cloud: { w: 270, h: 190, proportional: false },
};

let selectedNoteId = null;
let onSelectionChange = null;

/**
 * Auto-resize a note's shape based on its content.
 * Uses scrollHeight vs clientHeight (works with overflow: hidden).
 * For proportional shapes (heart, star, circle), grows both dimensions.
 * For rectangular shapes (square, rounded, cloud), grows height only.
 */
function autoResizeNote(noteEl) {
    const content = noteEl.querySelector('.postit-content');
    if (!content) return;

    const shape = noteEl.className.match(/shape-(\w+)/)?.[1] || 'square';
    const base = BASE_SIZES[shape] || BASE_SIZES.square;

    // Square/rounded grow naturally via CSS, no JS needed
    if (shape === 'square' || shape === 'rounded') return;

    const scrollH = content.scrollHeight;
    const clientH = content.clientHeight;

    if (clientH <= 0) return; // not rendered yet

    const currentW = noteEl.offsetWidth;
    const currentH = noteEl.offsetHeight;

    if (scrollH > clientH + 2) {
        // Content overflows → grow the shape
        // Grow factor with 20% buffer to avoid needing multiple resizes
        const growFactor = (scrollH / clientH) * 1.2;

        if (base.proportional) {
            const ratio = base.w / base.h;
            const newH = Math.round(currentH * growFactor);
            const newW = Math.round(newH * ratio);
            noteEl.style.width = newW + 'px';
            noteEl.style.height = newH + 'px';
        } else {
            noteEl.style.height = Math.round(currentH * growFactor) + 'px';
        }

        // Save to data model
        saveNoteSize(noteEl);
    } else if (scrollH < clientH * 0.5 && currentH > base.h * 1.15) {
        // Content is much smaller than available → shrink back
        const shrinkFactor = Math.max(scrollH / clientH * 1.3, base.h / currentH);

        if (base.proportional) {
            const ratio = base.w / base.h;
            const newH = Math.max(base.h, Math.round(currentH * shrinkFactor));
            const newW = Math.max(base.w, Math.round(newH * ratio));
            noteEl.style.width = newW + 'px';
            noteEl.style.height = newH + 'px';
        } else {
            noteEl.style.height = Math.max(base.h, Math.round(currentH * shrinkFactor)) + 'px';
        }

        saveNoteSize(noteEl);
    }
}

/**
 * Save the current note element size to the data model
 */
function saveNoteSize(noteEl) {
    const noteId = noteEl.dataset.id;
    const notes = getNotes();
    const note = notes.find(n => n.id === noteId);
    if (note) {
        note.size = {
            width: noteEl.offsetWidth,
            height: noteEl.offsetHeight,
        };
    }
}

/**
 * Set selection change callback
 */
export function onNoteSelectionChange(callback) {
    onSelectionChange = callback;
}

/**
 * Get the currently selected note ID
 */
export function getSelectedNoteId() {
    return selectedNoteId;
}

/**
 * Get the currently selected note data
 */
export function getSelectedNote() {
    if (!selectedNoteId) return null;
    return getNotes().find(n => n.id === selectedNoteId) || null;
}

/**
 * Select a note by ID
 */
export function selectNote(noteId) {
    // Deselect previous
    document.querySelectorAll('.postit.selected').forEach(el => el.classList.remove('selected'));
    document.querySelectorAll('.note-list-item.active').forEach(el => el.classList.remove('active'));

    selectedNoteId = noteId;

    if (noteId) {
        // Highlight on board
        const noteEl = document.querySelector(`.postit[data-id="${noteId}"]`);
        if (noteEl) noteEl.classList.add('selected');

        // Highlight in sidebar
        const listItem = document.querySelector(`.note-list-item[data-id="${noteId}"]`);
        if (listItem) listItem.classList.add('active');
    }

    if (onSelectionChange) onSelectionChange(noteId);
}

/**
 * Deselect all notes
 */
export function deselectAll() {
    selectNote(null);
}

/**
 * Create a new note
 */
export function createNote(options = {}) {
    const board = document.getElementById('board');
    const boardRect = board.getBoundingClientRect();

    const note = {
        id: generateId(),
        title: '',
        content: '',
        shape: options.shape || 'square',
        color: options.color || 'deep-blue',
        font: options.font || getData().settings.defaultFont || 'Caveat',
        glitter: options.glitter !== undefined ? options.glitter : true,
        pinned: false,
        alwaysOnTop: false,
        position: {
            x: 40 + Math.random() * Math.max(100, boardRect.width - 300),
            y: 40 + Math.random() * Math.max(100, boardRect.height - 300),
        },
        size: { width: 220, height: 220 },
        rotation: Math.round((Math.random() * 6 - 3) * 10) / 10,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    getNotes().push(note);
    saveData();

    const noteEl = renderNote(note);
    selectNote(note.id);
    renderSidebar();

    // Focus the text area for immediate editing
    setTimeout(() => {
        const textEl = noteEl.querySelector('.postit-text');
        if (textEl) textEl.focus();
    }, 400);

    return note;
}

/**
 * Update a note
 */
export function updateNote(noteId, changes) {
    const notes = getNotes();
    const idx = notes.findIndex(n => n.id === noteId);
    if (idx === -1) return;

    Object.assign(notes[idx], changes, { updatedAt: new Date().toISOString() });
    saveData();

    // If visual properties changed, re-render the note
    if ('shape' in changes || 'color' in changes || 'font' in changes || 'glitter' in changes || 'pinned' in changes || 'alwaysOnTop' in changes) {
        const noteEl = document.querySelector(`.postit[data-id="${noteId}"]`);
        if (noteEl) {
            noteEl.remove();
            renderNote(notes[idx]);
            selectNote(noteId);
        }
    }

    // Update sidebar
    if ('title' in changes || 'content' in changes) {
        renderSidebar();
    }
}

/**
 * Delete a note
 */
export function deleteNote(noteId) {
    const notes = getNotes();
    const idx = notes.findIndex(n => n.id === noteId);
    if (idx === -1) return;

    const noteEl = document.querySelector(`.postit[data-id="${noteId}"]`);
    if (noteEl) {
        noteEl.classList.add('note-exit');
        setTimeout(() => noteEl.remove(), 250);
    }

    if (selectedNoteId === noteId) {
        deselectAll();
    }

    notes.splice(idx, 1);
    saveData();

    setTimeout(() => renderSidebar(), 260);
}

/**
 * Duplicate a note
 */
export function duplicateNote(noteId) {
    const notes = getNotes();
    const source = notes.find(n => n.id === noteId);
    if (!source) return;

    const clone = {
        ...JSON.parse(JSON.stringify(source)),
        id: generateId(),
        position: {
            x: source.position.x + 30,
            y: source.position.y + 30,
        },
        rotation: Math.round((Math.random() * 6 - 3) * 10) / 10,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    notes.push(clone);
    saveData();
    renderNote(clone);
    selectNote(clone.id);
    renderSidebar();
}

/**
 * Render a single note on the board
 */
export function renderNote(note) {
    const board = document.getElementById('board');

    const noteEl = document.createElement('div');
    noteEl.className = `postit shape-${note.shape} color-${note.color} note-enter`;
    noteEl.dataset.id = note.id;
    noteEl.style.left = note.position.x + 'px';
    noteEl.style.top = note.position.y + 'px';
    noteEl.style.transform = `rotate(${note.rotation}deg)`;

    // Apply saved size if the note was resized
    const base = BASE_SIZES[note.shape] || BASE_SIZES.square;
    if (note.size && (note.size.width > base.w || note.size.height > base.h)) {
        noteEl.style.width = note.size.width + 'px';
        noteEl.style.height = note.size.height + 'px';
    }

    // Pin decoration
    const pin = document.createElement('div');
    pin.className = 'pin';
    noteEl.appendChild(pin);

    // Always on top badge
    if (note.alwaysOnTop) {
        const badge = document.createElement('div');
        badge.className = 'pin-badge';
        badge.textContent = '📌 on top';
        noteEl.appendChild(badge);
    }

    // Inner
    const inner = document.createElement('div');
    inner.className = 'postit-inner';

    // Title
    const title = document.createElement('div');
    title.className = 'postit-title';
    title.contentEditable = 'true';
    title.textContent = note.title;
    title.addEventListener('input', () => {
        const notes = getNotes();
        const n = notes.find(n => n.id === note.id);
        if (n) {
            n.title = title.textContent;
            n.updatedAt = new Date().toISOString();
            saveData();
            renderSidebar();
        }
        autoResizeNote(noteEl);
    });
    title.addEventListener('mousedown', e => e.stopPropagation());

    // Text
    const text = document.createElement('div');
    text.className = 'postit-text';
    text.contentEditable = 'true';
    text.style.fontFamily = `'${note.font}', cursive`;
    text.innerHTML = note.content;
    text.addEventListener('input', () => {
        const notes = getNotes();
        const n = notes.find(n => n.id === note.id);
        if (n) {
            n.content = text.innerHTML;
            n.updatedAt = new Date().toISOString();
            saveData();
            renderSidebar();
        }
        autoResizeNote(noteEl);
    });
    text.addEventListener('mousedown', e => e.stopPropagation());

    // Footer
    const footer = document.createElement('div');
    footer.className = 'postit-footer';
    const timeSpan = document.createElement('span');
    timeSpan.textContent = formatTime(note.updatedAt);
    footer.appendChild(timeSpan);
    if (note.pinned) {
        const pinSpan = document.createElement('span');
        pinSpan.textContent = '📌';
        footer.appendChild(pinSpan);
    }

    // Content wrapper — constrains text area for clip-path shapes
    const content = document.createElement('div');
    content.className = 'postit-content';
    content.appendChild(title);
    content.appendChild(text);
    content.appendChild(footer);
    inner.appendChild(content);
    noteEl.appendChild(inner);

    // Glitter
    if (note.glitter) {
        addGlitter(noteEl);
    }

    // Context menu
    noteEl.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        selectNote(note.id);
        showContextMenu(e.clientX, e.clientY, note.id);
    });

    board.appendChild(noteEl);
    makeDraggable(noteEl);

    // Remove enter animation class after it completes
    setTimeout(() => noteEl.classList.remove('note-enter'), 400);

    return noteEl;
}

/**
 * Render all notes on the board
 */
export function renderAllNotes() {
    const board = document.getElementById('board');
    // Clear existing notes
    board.querySelectorAll('.postit').forEach(el => el.remove());

    const notes = getNotes();
    notes.forEach(note => {
        renderNote(note);
    });
}

/**
 * Render the sidebar notes list
 */
export function renderSidebar() {
    const list = document.getElementById('notes-list');
    const notes = getNotes();

    if (notes.length === 0) {
        list.innerHTML = `
      <div class="notes-list-empty">
        <span class="empty-icon">✨</span>
        Click "New Note" to create your first magical sticky note!
      </div>
    `;
        return;
    }

    // Sort by updatedAt (most recent first)
    const sorted = [...notes].sort((a, b) =>
        new Date(b.updatedAt) - new Date(a.updatedAt)
    );

    list.innerHTML = sorted.map(note => {
        const icon = SHAPE_ICONS[note.shape] || '📝';
        const titleText = note.title || 'Untitled';
        const previewText = stripHtml(note.content) || 'Empty note...';
        const isActive = note.id === selectedNoteId;

        return `
      <div class="note-list-item ${isActive ? 'active' : ''}" data-id="${note.id}">
        <div class="note-preview-title">
          <span class="note-shape-icon">${icon}</span>
          ${escapeHtml(titleText)}
        </div>
        <div class="note-preview-text">${escapeHtml(previewText)}</div>
      </div>
    `;
    }).join('');

    // Click handlers
    list.querySelectorAll('.note-list-item').forEach(item => {
        item.addEventListener('click', () => {
            selectNote(item.dataset.id);
        });
    });
}

/**
 * Show context menu
 */
function showContextMenu(x, y, noteId) {
    const menu = document.getElementById('context-menu');
    menu.style.left = x + 'px';
    menu.style.top = y + 'px';
    menu.classList.add('visible');
    menu.dataset.noteId = noteId;

    // Close on click outside
    const close = (e) => {
        if (!menu.contains(e.target)) {
            menu.classList.remove('visible');
            document.removeEventListener('click', close);
        }
    };
    setTimeout(() => document.addEventListener('click', close), 10);
}

/**
 * Format relative time
 */
function formatTime(isoString) {
    const diff = Date.now() - new Date(isoString).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins} min ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

/**
 * Strip HTML tags
 */
function stripHtml(html) {
    if (!html) return '';
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
}

/**
 * Escape HTML for safe insertion
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
