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
            'deep-blue': { gradient: 'linear-gradient(135deg, #1a3260, #1e3a6e)', text: '#e0ecff' },
            'purple': { gradient: 'linear-gradient(135deg, #2d2660, #3d2b7b)', text: '#e8deff' },
            'dark-teal': { gradient: 'linear-gradient(135deg, #1a4040, #1a5050)', text: '#d0ffff' },
            'midnight': { gradient: 'linear-gradient(135deg, #141830, #1a2040)', text: '#c8d8f8' },
            'gold': { gradient: 'linear-gradient(135deg, #4a3a1a, #5a4a2a)', text: '#ffe8a8' },
        },
        glitterColors: ['#a8c0f0', '#d4a8f0', '#f0d4a8', '#f0c75e', '#ffffff'],
    },
    lover: {
        name: 'Lover',
        icon: '💖',
        bg: '#fff5f9',
        bgDeeper: '#fff0f5',
        surface: '#ffffff',
        surfaceHover: '#fff0f5',
        border: '#f5c0d8',
        text: '#4a1030',
        textMuted: '#b06080',
        accent: '#e060a0',
        starGold: '#f59e0b',
        starGlow: 'rgba(245, 158, 11, 0.3)',
        moonlight: '#ec4899',
        showMoon: false,
        showStars: false,
        colors: {
            'deep-blue': { gradient: 'linear-gradient(135deg, #e080a8, #e060a0)', text: '#ffffff' },
            'purple': { gradient: 'linear-gradient(135deg, #c090e0, #b070d0)', text: '#ffffff' },
            'dark-teal': { gradient: 'linear-gradient(135deg, #80c0c0, #60b0b0)', text: '#ffffff' },
            'midnight': { gradient: 'linear-gradient(135deg, #f0b0c0, #e898b0)', text: '#4a0020' },
            'gold': { gradient: 'linear-gradient(135deg, #e0c070, #d0a858)', text: '#3a2800' },
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
