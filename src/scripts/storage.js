/* ===== SwiftNotes — Storage Module ===== */
/* Uses localStorage for web, can be swapped for Tauri fs API later */

const STORAGE_KEY = 'swiftnotes_data';

const DEFAULT_DATA = {
    settings: {
        theme: 'midnights',
        defaultFont: 'Caveat',
    },
    notes: [],
};

let data = null;
let saveTimeout = null;

/**
 * Load data from localStorage
 */
export function loadData() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            data = JSON.parse(raw);
            // Ensure structure integrity
            if (!data.settings) data.settings = { ...DEFAULT_DATA.settings };
            if (!data.notes) data.notes = [];
        } else {
            data = JSON.parse(JSON.stringify(DEFAULT_DATA));
            saveImmediate();
        }
    } catch (e) {
        console.error('Failed to load data:', e);
        data = JSON.parse(JSON.stringify(DEFAULT_DATA));
    }
    return data;
}

/**
 * Save data immediately
 */
function saveImmediate() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
        console.error('Failed to save data:', e);
    }
}

/**
 * Save data with debounce (500ms)
 */
export function saveData() {
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
        saveImmediate();
    }, 500);
}

/**
 * Get current data reference
 */
export function getData() {
    if (!data) loadData();
    return data;
}

/**
 * Get settings
 */
export function getSettings() {
    return getData().settings;
}

/**
 * Update settings
 */
export function updateSettings(changes) {
    Object.assign(getData().settings, changes);
    saveData();
}

/**
 * Get all notes
 */
export function getNotes() {
    return getData().notes;
}

/**
 * Generate UUID
 */
export function generateId() {
    return crypto.randomUUID ? crypto.randomUUID() :
        'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
            const r = Math.random() * 16 | 0;
            return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
}
