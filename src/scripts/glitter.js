/* ===== SwiftNotes — Glitter Module ===== */

const GLITTER_COLORS = ['#a8c0f0', '#d4a8f0', '#f0d4a8', '#f0c75e', '#ffffff'];
const PARTICLES_COUNT = 25;

/**
 * Add glitter particles to a note element
 */
export function addGlitter(noteEl) {
    removeGlitter(noteEl);

    const overlay = document.createElement('div');
    overlay.className = 'glitter-overlay';

    for (let i = 0; i < PARTICLES_COUNT; i++) {
        const particle = document.createElement('div');
        particle.className = 'glitter-particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        particle.style.background = GLITTER_COLORS[Math.floor(Math.random() * GLITTER_COLORS.length)];
        particle.style.setProperty('--dur', (1 + Math.random() * 2) + 's');
        particle.style.setProperty('--delay', (-Math.random() * 3) + 's');
        const size = 1.5 + Math.random() * 2;
        particle.style.width = size + 'px';
        particle.style.height = size + 'px';
        overlay.appendChild(particle);
    }

    const inner = noteEl.querySelector('.postit-inner');
    if (inner) {
        inner.appendChild(overlay);
    }
}

/**
 * Remove glitter from a note element
 */
export function removeGlitter(noteEl) {
    const existing = noteEl.querySelector('.glitter-overlay');
    if (existing) existing.remove();
}

/**
 * Toggle glitter on a note element
 */
export function toggleGlitter(noteEl, enabled) {
    if (enabled) {
        addGlitter(noteEl);
    } else {
        removeGlitter(noteEl);
    }
}
