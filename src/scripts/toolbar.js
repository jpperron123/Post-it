/* ===== SwiftNotes — Toolbar Module ===== */

import { getSelectedNote, updateNote, getSelectedNoteId } from './notes.js';

/**
 * Initialize toolbar interactions
 */
export function initToolbar() {
    // Shape buttons
    document.querySelectorAll('#toolbar-shapes .toolbar-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const noteId = getSelectedNoteId();
            if (!noteId) return;
            const shape = btn.dataset.shape;
            updateNote(noteId, { shape });
            updateToolbarState();
        });
    });

    // Color buttons
    document.querySelectorAll('#toolbar-colors .color-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const noteId = getSelectedNoteId();
            if (!noteId) return;
            const color = btn.dataset.color;
            updateNote(noteId, { color });
            updateToolbarState();
        });
    });

    // Glitter toggle
    document.getElementById('btn-glitter').addEventListener('click', () => {
        const note = getSelectedNote();
        if (!note) return;
        updateNote(note.id, { glitter: !note.glitter });
        updateToolbarState();
    });

    // Pin toggle
    document.getElementById('btn-pin').addEventListener('click', () => {
        const note = getSelectedNote();
        if (!note) return;
        updateNote(note.id, {
            pinned: !note.pinned,
            alwaysOnTop: !note.alwaysOnTop,
        });
        updateToolbarState();
    });

    // Font button
    const fontBtn = document.getElementById('btn-font');
    const fontPopup = document.getElementById('font-popup');

    fontBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        fontPopup.classList.toggle('visible');
    });

    // Font options
    fontPopup.querySelectorAll('.font-option').forEach(opt => {
        opt.addEventListener('click', () => {
            const noteId = getSelectedNoteId();
            if (!noteId) return;
            const font = opt.dataset.font;
            updateNote(noteId, { font });
            fontPopup.classList.remove('visible');
            updateToolbarState();
        });
    });

    // Close font popup when clicking outside
    document.addEventListener('click', (e) => {
        if (!fontPopup.contains(e.target) && e.target !== fontBtn) {
            fontPopup.classList.remove('visible');
        }
    });

    // Delete button
    document.getElementById('btn-delete').addEventListener('click', () => {
        const noteId = getSelectedNoteId();
        if (!noteId) return;
        // Import dynamically to avoid circular dependency
        import('./notes.js').then(({ deleteNote }) => {
            if (confirm('Delete this note?')) {
                deleteNote(noteId);
            }
        });
    });
}

/**
 * Update toolbar state to reflect selected note
 */
export function updateToolbarState() {
    const toolbar = document.getElementById('toolbar');
    const note = getSelectedNote();

    if (!note) {
        toolbar.classList.remove('active');
        return;
    }

    toolbar.classList.add('active');

    // Shapes
    document.querySelectorAll('#toolbar-shapes .toolbar-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.shape === note.shape);
    });

    // Colors
    document.querySelectorAll('#toolbar-colors .color-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.color === note.color);
    });

    // Glitter
    document.getElementById('btn-glitter').classList.toggle('active', note.glitter);

    // Pin
    document.getElementById('btn-pin').classList.toggle('active', note.alwaysOnTop);

    // Font
    document.querySelectorAll('.font-option').forEach(opt => {
        opt.classList.toggle('active', opt.dataset.font === note.font);
    });
}
