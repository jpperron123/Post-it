/* ===== SwiftNotes — Themes Module ===== */

import { updateSettings, getSettings } from './storage.js';

const THEMES = {
    midnights: {
        name: 'Midnights',
        icon: '🌙',
        bg: '#0f1729',
        bgDeeper: '#0a101f',
        surface: '#1a2540',
        surfaceHover: '#213058',
        border: '#2a3a5c',
        text: '#e8ecf4',
        textMuted: '#7b8ab0',
        accent: '#7c9cdb',
        starGold: '#f0c75e',
        starGlow: 'rgba(240, 199, 94, 0.3)',
        moonlight: '#c4d4f0',
        showMoon: true,
        showStars: true,
        colors: {
            'deep-blue': { gradient: 'linear-gradient(135deg, #1a3260, #1e3a6e)', text: '#c4d4f0' },
            'purple': { gradient: 'linear-gradient(135deg, #2d2660, #3d2b7b)', text: '#d4c4f0' },
            'dark-teal': { gradient: 'linear-gradient(135deg, #1a4040, #1a5050)', text: '#b0e0e0' },
            'midnight': { gradient: 'linear-gradient(135deg, #141830, #1a2040)', text: '#a0b0d0' },
            'gold': { gradient: 'linear-gradient(135deg, #4a3a1a, #5a4a2a)', text: '#f0d89e' },
        },
        glitterColors: ['#a8c0f0', '#d4a8f0', '#f0d4a8', '#f0c75e', '#ffffff'],
    },
    lover: {
        name: 'Lover',
        icon: '💖',
        bg: '#fdf2f8',
        bgDeeper: '#fce7f3',
        surface: '#ffffff',
        surfaceHover: '#fdf2f8',
        border: '#f9a8d4',
        text: '#831843',
        textMuted: '#be185d',
        accent: '#ec4899',
        starGold: '#f59e0b',
        starGlow: 'rgba(245, 158, 11, 0.3)',
        moonlight: '#ec4899',
        showMoon: false,
        showStars: false,
        colors: {
            'deep-blue': { gradient: 'linear-gradient(135deg, #fce7f3, #fbcfe8)', text: '#831843' },
            'purple': { gradient: 'linear-gradient(135deg, #ede9fe, #ddd6fe)', text: '#5b21b6' },
            'dark-teal': { gradient: 'linear-gradient(135deg, #e0f2fe, #bae6fd)', text: '#0c4a6e' },
            'midnight': { gradient: 'linear-gradient(135deg, #fff7ed, #fed7aa)', text: '#9a3412' },
            'gold': { gradient: 'linear-gradient(135deg, #ecfdf5, #a7f3d0)', text: '#065f46' },
        },
        glitterColors: ['#f9a8d4', '#fbbf24', '#ffffff', '#c084fc', '#fb7185'],
    },
};

let currentTheme = 'midnights';

/**
 * Get available theme IDs
 */
export function getThemeIds() {
    return Object.keys(THEMES);
}

/**
 * Get the current theme ID
 */
export function getCurrentTheme() {
    return currentTheme;
}

/**
 * Get theme config by ID
 */
export function getTheme(themeId) {
    return THEMES[themeId] || THEMES.midnights;
}

/**
 * Apply a theme
 */
export function applyTheme(themeId) {
    const theme = THEMES[themeId];
    if (!theme) return;

    currentTheme = themeId;
    const root = document.documentElement;

    root.style.setProperty('--bg', theme.bg);
    root.style.setProperty('--bg-deeper', theme.bgDeeper);
    root.style.setProperty('--surface', theme.surface);
    root.style.setProperty('--surface-hover', theme.surfaceHover);
    root.style.setProperty('--border', theme.border);
    root.style.setProperty('--text', theme.text);
    root.style.setProperty('--text-muted', theme.textMuted);
    root.style.setProperty('--accent', theme.accent);
    root.style.setProperty('--star-gold', theme.starGold);
    root.style.setProperty('--star-glow', theme.starGlow);
    root.style.setProperty('--moonlight', theme.moonlight);

    // Update moon visibility
    const moon = document.querySelector('.moon');
    if (moon) moon.style.opacity = theme.showMoon ? '0.6' : '0';

    // Update starfield visibility
    const starfield = document.getElementById('starfield');
    if (starfield) starfield.style.opacity = theme.showStars ? '1' : '0';

    // Update note colors
    const colorKeys = Object.keys(theme.colors);
    colorKeys.forEach(colorId => {
        const colorConfig = theme.colors[colorId];
        // Update toolbar color buttons
        const btn = document.querySelector(`.color-btn[data-color="${colorId}"]`);
        if (btn) btn.style.background = colorConfig.gradient;

        // Update note elements
        document.querySelectorAll(`.color-${colorId} .postit-inner`).forEach(inner => {
            inner.style.background = colorConfig.gradient;
            inner.style.color = colorConfig.text;
        });
    });

    // Update theme selector active state
    document.querySelectorAll('.theme-dot').forEach(dot => {
        dot.classList.toggle('active', dot.dataset.theme === themeId);
    });

    // Save
    updateSettings({ theme: themeId });
}

/**
 * Initialize theme from settings
 */
export function initTheme() {
    const settings = getSettings();
    currentTheme = settings.theme || 'midnights';
    applyTheme(currentTheme);
}
