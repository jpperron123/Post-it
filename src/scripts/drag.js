/* ===== SwiftNotes — Drag & Drop Module ===== */

let isDragging = false;
let dragTarget = null;
let dragStartX = 0;
let dragStartY = 0;
let noteStartX = 0;
let noteStartY = 0;
let wasDragged = false;
let highestZ = 10;

let onDragEnd = null;
let onClick = null;

/**
 * Initialize drag & drop system
 * @param {Function} dragEndCallback - Called with (noteId, x, y) after drag
 * @param {Function} clickCallback - Called with (noteId, noteEl) when clicked (not dragged)
 */
export function initDrag(dragEndCallback, clickCallback) {
    onDragEnd = dragEndCallback;
    onClick = clickCallback;

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
}

/**
 * Register a note element for dragging
 */
export function makeDraggable(noteEl) {
    noteEl.addEventListener('mousedown', handleMouseDown);
}

function handleMouseDown(e) {
    // Don't drag if editing text
    if (e.target.closest('[contenteditable="true"]') && document.activeElement === e.target) {
        return;
    }
    // Don't drag on right-click
    if (e.button !== 0) return;

    const noteEl = e.target.closest('.postit');
    if (!noteEl) return;

    isDragging = true;
    wasDragged = false;
    dragTarget = noteEl;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    noteStartX = parseInt(noteEl.style.left) || 0;
    noteStartY = parseInt(noteEl.style.top) || 0;

    // Bring to front
    highestZ++;
    noteEl.style.zIndex = highestZ;

    e.preventDefault();
}

function handleMouseMove(e) {
    if (!isDragging || !dragTarget) return;

    const dx = e.clientX - dragStartX;
    const dy = e.clientY - dragStartY;

    // Only start visual drag after 5px threshold
    if (Math.abs(dx) < 5 && Math.abs(dy) < 5) return;

    wasDragged = true;
    dragTarget.classList.add('dragging');

    // Get board bounds
    const board = document.getElementById('board');
    const boardRect = board.getBoundingClientRect();
    const noteWidth = dragTarget.offsetWidth;
    const noteHeight = dragTarget.offsetHeight;

    // Calculate new position, clamped to board
    let newX = noteStartX + dx;
    let newY = noteStartY + dy;
    newX = Math.max(0, Math.min(newX, boardRect.width - noteWidth));
    newY = Math.max(0, Math.min(newY, boardRect.height - noteHeight));

    dragTarget.style.left = newX + 'px';
    dragTarget.style.top = newY + 'px';
}

function handleMouseUp(e) {
    if (!isDragging || !dragTarget) return;

    dragTarget.classList.remove('dragging');
    const noteId = dragTarget.dataset.id;

    if (wasDragged) {
        // Save new position
        const x = parseInt(dragTarget.style.left) || 0;
        const y = parseInt(dragTarget.style.top) || 0;
        if (onDragEnd) onDragEnd(noteId, x, y);
    } else {
        // It was a click, not a drag
        if (onClick) onClick(noteId, dragTarget);
    }

    isDragging = false;
    dragTarget = null;
    wasDragged = false;
}

/**
 * Set the highest z-index (used when loading notes)
 */
export function setHighestZ(z) {
    highestZ = Math.max(highestZ, z);
}
