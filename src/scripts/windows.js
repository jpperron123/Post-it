/* ===== SwiftNotes — Window Management ===== */
/* Creates and manages individual note windows via Tauri WebviewWindow API */
/* All Tauri imports are dynamic to avoid crashes */

import { getNotes, saveData } from './storage.js';

/** Map of open note windows by note ID */
const openWindows = new Map();

/** Shape → default window dimensions */
const SHAPE_SIZES = {
    square: { w: 260, h: 260 },
    rounded: { w: 260, h: 240 },
    heart: { w: 280, h: 260 },
    star: { w: 300, h: 290 },
    circle: { w: 250, h: 250 },
    cloud: { w: 290, h: 210 },
};

/**
 * Open a note in its own floating window
 */
export async function openNoteWindow(noteId) {
    // Already open? Focus it
    if (openWindows.has(noteId)) {
        try {
            const existing = openWindows.get(noteId);
            await existing.setFocus();
            return;
        } catch (e) {
            // Window was closed externally
            openWindows.delete(noteId);
        }
    }

    const notes = getNotes();
    const note = notes.find(n => n.id === noteId);
    if (!note) return;

    const shape = note.shape || 'square';
    const defaults = SHAPE_SIZES[shape] || SHAPE_SIZES.square;
    const w = note.size?.width || defaults.w;
    const h = note.size?.height || defaults.h;
    const x = note.position?.x;
    const y = note.position?.y;

    // Create window label (alphanumeric only — Tauri requirement)
    const label = 'note_' + noteId.replace(/[^a-zA-Z0-9]/g, '');

    const windowOptions = {
        url: `/note.html?id=${noteId}`,
        title: 'SwiftNotes',
        width: w,
        height: h,
        transparent: true,
        decorations: false,
        shadow: false,
        resizable: false,
        alwaysOnTop: note.pinned || false,
        skipTaskbar: false,
        center: (x === undefined),
    };

    // Only set position if we have saved coords
    if (x !== undefined && y !== undefined) {
        windowOptions.x = Math.max(0, x);
        windowOptions.y = Math.max(0, y);
    }

    try {
        // Dynamic import to avoid top-level crashes
        const { WebviewWindow } = await import('@tauri-apps/api/webviewWindow');
        const noteWindow = new WebviewWindow(label, windowOptions);

        noteWindow.once('tauri://created', () => {
            console.log(`Note window created: ${noteId}`);
            openWindows.set(noteId, noteWindow);
        });

        noteWindow.once('tauri://error', (e) => {
            console.error(`Error creating note window: ${e}`);
        });

        noteWindow.once('tauri://close-requested', async () => {
            openWindows.delete(noteId);
        });

        openWindows.set(noteId, noteWindow);
    } catch (e) {
        console.error('Failed to create note window:', e);
    }
}

/**
 * Close a note window
 */
export async function closeNoteWindow(noteId) {
    if (openWindows.has(noteId)) {
        try {
            const win = openWindows.get(noteId);
            await win.destroy();
        } catch (e) {
            // Window may already be closed
        }
        openWindows.delete(noteId);
    }
}

/**
 * Close all open note windows
 */
export async function closeAllNoteWindows() {
    for (const [id, win] of openWindows) {
        try {
            await win.destroy();
        } catch (e) { /* ignore */ }
    }
    openWindows.clear();
}

/**
 * Open all notes that were previously open
 */
export async function restoreNoteWindows() {
    const notes = getNotes();
    for (const note of notes) {
        await openNoteWindow(note.id);
    }
}

/**
 * Check if running in Tauri
 */
export function isTauri() {
    return !!(window.__TAURI_INTERNALS__);
}
