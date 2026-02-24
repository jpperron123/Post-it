/* ===== SwiftNotes — Main App ===== */
/* Entry point: initialization, global event listeners, keyboard shortcuts */

import { loadData, getNotes } from './storage.js';
import { renderAllNotes, renderSidebar, createNote, deleteNote, duplicateNote, selectNote, deselectAll, getSelectedNoteId, onNoteSelectionChange, updateNote } from './notes.js';
import { initDrag } from './drag.js';
import { initTheme, applyTheme } from './themes.js';
import { initToolbar, updateToolbarState } from './toolbar.js';

/**
 * Initialize the app
 */
function init() {
    // Load saved data
    loadData();

    // Initialize theme
    initTheme();

    // Generate starfield
    generateStarfield();

    // Initialize drag & drop
    initDrag(
        // On drag end: save position
        (noteId, x, y) => {
            updateNote(noteId, { position: { x, y } });
        },
        // On click (not drag): select note
        (noteId, noteEl) => {
            selectNote(noteId);
        }
    );

    // Initialize toolbar
    initToolbar();

    // Selection change → update toolbar
    onNoteSelectionChange((noteId) => {
        updateToolbarState();
    });

    // Render notes
    renderAllNotes();
    renderSidebar();

    // Event listeners
    setupEventListeners();
}

/**
 * Generate starfield background
 */
function generateStarfield() {
    const starfield = document.getElementById('starfield');
    for (let i = 0; i < 100; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.style.left = Math.random() * 100 + '%';
        star.style.top = Math.random() * 100 + '%';
        star.style.setProperty('--dur', (2 + Math.random() * 4) + 's');
        star.style.animationDelay = -Math.random() * 5 + 's';
        const size = 1 + Math.random() * 2;
        star.style.width = size + 'px';
        star.style.height = size + 'px';
        starfield.appendChild(star);
    }
}

/**
 * Set up global event listeners
 */
function setupEventListeners() {
    // New Note button
    document.getElementById('btn-new-note').addEventListener('click', () => {
        createNote();
    });

    // Theme selector
    document.querySelectorAll('.theme-dot').forEach(dot => {
        dot.addEventListener('click', () => {
            applyTheme(dot.dataset.theme);
            // Re-render notes to apply new theme colors
            renderAllNotes();
            renderSidebar();
        });
    });

    // Deselect on board click (not on a note)
    document.getElementById('board').addEventListener('mousedown', (e) => {
        if (e.target.id === 'board') {
            deselectAll();
        }
    });

    // Context menu actions
    document.getElementById('context-menu').addEventListener('click', (e) => {
        const action = e.target.closest('.context-item')?.dataset.action;
        const noteId = document.getElementById('context-menu').dataset.noteId;
        if (!action || !noteId) return;

        document.getElementById('context-menu').classList.remove('visible');

        switch (action) {
            case 'edit': {
                selectNote(noteId);
                const textEl = document.querySelector(`.postit[data-id="${noteId}"] .postit-text`);
                if (textEl) textEl.focus();
                break;
            }
            case 'duplicate':
                duplicateNote(noteId);
                break;
            case 'pin': {
                const notes = getNotes();
                const note = notes.find(n => n.id === noteId);
                if (note) {
                    updateNote(noteId, { pinned: !note.pinned, alwaysOnTop: !note.alwaysOnTop });
                }
                break;
            }
            case 'delete':
                if (confirm('Delete this note?')) {
                    deleteNote(noteId);
                }
                break;
        }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Don't trigger shortcuts when editing text
        const isEditing = document.activeElement?.contentEditable === 'true';

        // Ctrl+N → New note
        if (e.ctrlKey && e.key === 'n') {
            e.preventDefault();
            createNote();
            return;
        }

        // Ctrl+D → Duplicate selected note
        if (e.ctrlKey && e.key === 'd') {
            e.preventDefault();
            const noteId = getSelectedNoteId();
            if (noteId) duplicateNote(noteId);
            return;
        }

        // Escape → Deselect / close popups
        if (e.key === 'Escape') {
            document.getElementById('font-popup').classList.remove('visible');
            document.getElementById('context-menu').classList.remove('visible');
            deselectAll();
            // Blur active element
            if (document.activeElement) document.activeElement.blur();
            return;
        }

        // Delete / Backspace → Delete selected note (only when not editing)
        if ((e.key === 'Delete' || e.key === 'Backspace') && !isEditing) {
            const noteId = getSelectedNoteId();
            if (noteId) {
                e.preventDefault();
                if (confirm('Delete this note?')) {
                    deleteNote(noteId);
                }
            }
        }
    });

    // Close context menu on scroll
    document.addEventListener('scroll', () => {
        document.getElementById('context-menu').classList.remove('visible');
    }, true);
}

// Boot!
document.addEventListener('DOMContentLoaded', init);
