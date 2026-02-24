/* ===== SwiftNotes — Storage Module ===== */
/* Dual mode: Tauri fs API (desktop) or localStorage (web) */

const STORAGE_KEY = 'swiftnotes_data';
const FILE_NAME = 'swiftnotes.json';

const DEFAULT_DATA = {
    settings: {
        theme: 'midnights',
        defaultFont: 'Caveat',
    },
    notes: [],
};

let data = null;
let saveTimeout = null;
let isTauri = false;

// Tauri modules (loaded dynamically)
let tauriFs = null;
let tauriPath = null;

/**
 * Check if running inside Tauri
 */
function detectTauri() {
    isTauri = !!(window.__TAURI_INTERNALS__);
    return isTauri;
}

/**
 * Get the path to the data file in Tauri's app data dir
 */
async function getDataFilePath() {
    if (!tauriPath) {
        tauriPath = await import('@tauri-apps/api/path');
    }
    const appDataDir = await tauriPath.appDataDir();
    return appDataDir + FILE_NAME;
}

/**
 * Ensure the app data directory exists
 */
async function ensureAppDataDir() {
    if (!tauriFs) {
        tauriFs = await import('@tauri-apps/plugin-fs');
    }
    if (!tauriPath) {
        tauriPath = await import('@tauri-apps/api/path');
    }
    const dir = await tauriPath.appDataDir();
    try {
        await tauriFs.mkdir(dir, { recursive: true });
    } catch (e) {
        // Directory might already exist — that's fine
    }
}

/**
 * Load data — works in both Tauri and web mode
 */
export async function loadData() {
    detectTauri();

    if (isTauri) {
        try {
            if (!tauriFs) {
                tauriFs = await import('@tauri-apps/plugin-fs');
            }
            await ensureAppDataDir();
            const filePath = await getDataFilePath();

            // Check if file exists
            const exists = await tauriFs.exists(filePath);
            if (exists) {
                const raw = await tauriFs.readTextFile(filePath);
                data = JSON.parse(raw);
                if (!data.settings) data.settings = { ...DEFAULT_DATA.settings };
                if (!data.notes) data.notes = [];
            } else {
                data = JSON.parse(JSON.stringify(DEFAULT_DATA));
                await saveImmediate();
            }
        } catch (e) {
            console.error('Tauri: Failed to load data:', e);
            data = JSON.parse(JSON.stringify(DEFAULT_DATA));
        }
    } else {
        // Web fallback: localStorage
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                data = JSON.parse(raw);
                if (!data.settings) data.settings = { ...DEFAULT_DATA.settings };
                if (!data.notes) data.notes = [];
            } else {
                data = JSON.parse(JSON.stringify(DEFAULT_DATA));
                saveImmediate();
            }
        } catch (e) {
            console.error('Web: Failed to load data:', e);
            data = JSON.parse(JSON.stringify(DEFAULT_DATA));
        }
    }

    return data;
}

/**
 * Save data immediately
 */
async function saveImmediate() {
    if (!data) return;

    if (isTauri) {
        try {
            if (!tauriFs) {
                tauriFs = await import('@tauri-apps/plugin-fs');
            }
            const filePath = await getDataFilePath();
            await tauriFs.writeTextFile(filePath, JSON.stringify(data, null, 2));
        } catch (e) {
            console.error('Tauri: Failed to save data:', e);
        }
    } else {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (e) {
            console.error('Web: Failed to save data:', e);
        }
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
    if (!data) {
        // Synchronous fallback — data should already be loaded via init
        data = JSON.parse(JSON.stringify(DEFAULT_DATA));
    }
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
