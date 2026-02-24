# 🌙 SwiftNotes — Specs, Architecture & Antigravity Prompts

## Project Overview

**Nom :** SwiftNotes  
**Tagline :** "Magical sticky notes for your desktop"  
**Créateur :** Jean-Philippe Perron  
**Format :** App desktop cross-platform (Windows + Mac)  
**Framework :** Tauri (Rust backend + Web frontend)  
**Thème initial :** Midnights (🌙 bleu nuit, étoiles, glitter)  
**Stockage :** Local (fichier JSON, pas de backend/cloud)  
**Cible :** Cadeau pour ta sœur + projet portfolio

---

## Concept

SwiftNotes est une app de sticky notes pour le bureau, inspirée par les eras de Taylor Swift. Chaque note peut avoir une forme custom (carré, cœur, étoile, cercle, nuage), une couleur personnalisable, des effets glitter/sparkle, et une police d'écriture fun. Les notes peuvent être épinglées "always on top" sur le bureau, comme le Sticky Notes de Windows mais en 100x plus beau.

---

## Thèmes Taylor Swift (Eras)

### 🌙 Midnights (thème par défaut)
| Élément | Valeur |
|---------|--------|
| Background | `#0f1729` (bleu nuit profond) |
| Surface | `#1a2540` |
| Borders | `#2a3a5c` |
| Text | `#e8ecf4` (moonlight) |
| Accent | `#7c9cdb` (bleu clair) |
| Gold | `#f0c75e` (étoiles) |
| Note colors | Deep blue, Purple, Dark teal, Midnight black, Gold |
| Effets | Étoiles scintillantes en background, glitter doré/bleu/violet |
| Ambiance | Mystérieux, nocturne, élégant |

### 💖 Lover (futur)
- Pastels : rose, lavande, bleu ciel, pêche
- Effet : cœurs flottants, sparkles roses
- Ambiance : Romantique, doux, rêveur

### 🌿 Folklore (futur)
- Tons : beige, vert forêt, brun, crème
- Effet : feuilles qui tombent, texture papier
- Ambiance : Cottagecore, naturel, apaisant

### 🐍 Reputation (futur)
- Tons : noir, vert néon, gris foncé
- Effet : glitch, néon glow
- Ambiance : Edgy, sombre, puissant

### 🔶 1989 (futur)
- Tons : bleu ciel, sépia, orange sunset
- Effet : grain polaroid, sunshine
- Ambiance : Nostalgique, estival, libre

---

## Formes de Post-its

| Forme | CSS Approach | Notes |
|-------|-------------|-------|
| **Carré** | `border-radius: 4px` | Classic sticky note |
| **Arrondi** | `border-radius: 20px` | Softer look |
| **Cœur** | `clip-path: path(...)` | SVG path heart shape |
| **Étoile** | `clip-path: polygon(...)` | 5-point star |
| **Cercle** | `clip-path: circle(50%)` | Round note |
| **Nuage** | `border-radius: 100px` + tweaks | Bubbly cloud shape |

Chaque forme a une zone de texte adaptée (padding ajusté pour que le texte reste lisible dans la forme).

---

## Features Détaillées

### Core Features

#### 1. Créer / Éditer des notes
- Clic sur "New Note" → crée une note avec les paramètres sélectionnés
- Contenu éditable directement dans la note (contenteditable)
- Auto-save à chaque modification (debounce 500ms)
- Titre optionnel

#### 2. Formes personnalisables
- 6 formes : carré, arrondi, cœur, étoile, cercle, nuage
- Sélection via la toolbar en bas
- Changeable après création

#### 3. Couleurs personnalisables
- 5 couleurs par thème (adaptées à l'era)
- Chaque couleur est un gradient subtil
- Sélection via la toolbar

#### 4. Effet Glitter / Sparkle
- Toggle on/off par note
- Particules animées (CSS) superposées sur la note
- Couleurs des particules : mix de blanc, doré, et couleurs du thème
- Animation : apparition/disparition random, scale pulse
- Pas trop chargé — subtil et élégant

#### 5. Polices d'écriture
- 3-4 options :
  - **Caveat** (handwritten, par défaut)
  - **Quicksand** (rounded, clean)
  - **Patrick Hand** (casual handwriting)
  - **Satisfy** (cursive élégante)
- Sélection via bouton "Aa" dans la toolbar

#### 6. Drag & Drop
- Les notes sont draggables sur le board
- Position sauvegardée localement
- Z-index : la note cliquée passe devant

#### 7. Always on Top (Pin to Desktop)
- Toggle par note : "Pin to desktop"
- La note reste visible par-dessus toutes les fenêtres
- Tauri API : `window.setAlwaysOnTop(true)`
- Indicateur visuel (badge 📌) quand activé

#### 8. Thème Eras
- Sélecteur dans la sidebar (dots de couleur)
- Change : background, couleurs des notes, effets d'ambiance, couleurs glitter
- Commence avec Midnights, les autres eras sont ajoutés progressivement

### Features Sidebar
- Liste de toutes les notes (preview : titre + premier texte)
- Clic sur une note → la met en focus sur le board
- Bouton "New Note"
- Sélecteur de thème en bas

### Stockage Local
- Toutes les données sauvegardées dans un fichier JSON local
- Tauri API : `fs.writeTextFile` / `fs.readTextFile`
- Path : dossier app data (`appDataDir`)
- Structure :

```json
{
  "settings": {
    "theme": "midnights",
    "defaultFont": "Caveat"
  },
  "notes": [
    {
      "id": "uuid",
      "title": "Grocery List",
      "content": "Milk, eggs, bread...",
      "shape": "square",
      "color": "deep-blue",
      "font": "Caveat",
      "glitter": true,
      "pinned": false,
      "alwaysOnTop": false,
      "position": { "x": 80, "y": 60 },
      "size": { "width": 220, "height": 220 },
      "rotation": -2,
      "createdAt": "2026-02-23T...",
      "updatedAt": "2026-02-23T..."
    }
  ]
}
```

---

## Architecture Tauri

### Structure du projet
```
swiftnotes/
├── src-tauri/           ← Backend Rust (Tauri)
│   ├── src/
│   │   └── main.rs      ← Point d'entrée Tauri
│   ├── tauri.conf.json   ← Config Tauri
│   └── Cargo.toml
├── src/                  ← Frontend Web
│   ├── index.html
│   ├── styles/
│   │   ├── main.css
│   │   ├── themes/
│   │   │   ├── midnights.css
│   │   │   ├── lover.css      (futur)
│   │   │   └── ...
│   │   ├── shapes.css
│   │   └── glitter.css
│   ├── scripts/
│   │   ├── app.js          ← Logique principale
│   │   ├── notes.js        ← CRUD notes
│   │   ├── storage.js      ← Lecture/écriture JSON
│   │   ├── drag.js         ← Drag & drop
│   │   ├── themes.js       ← Gestion des thèmes
│   │   ├── glitter.js      ← Génération particules
│   │   └── toolbar.js      ← Contrôles toolbar
│   └── fonts/
│       ├── Caveat.woff2
│       ├── Quicksand.woff2
│       └── ...
├── package.json
└── README.md
```

### Config Tauri (tauri.conf.json) — points clés
```json
{
  "tauri": {
    "windows": [
      {
        "title": "SwiftNotes",
        "width": 1100,
        "height": 700,
        "minWidth": 800,
        "minHeight": 500,
        "decorations": true,
        "transparent": false,
        "resizable": true
      }
    ],
    "allowlist": {
      "fs": {
        "scope": ["$APPDATA/*"],
        "readFile": true,
        "writeFile": true,
        "exists": true
      },
      "window": {
        "setAlwaysOnTop": true,
        "create": true,
        "close": true
      }
    }
  }
}
```

### API Tauri utilisées
| API | Usage |
|-----|-------|
| `fs.readTextFile` | Lire le fichier de données JSON |
| `fs.writeTextFile` | Sauvegarder les notes |
| `path.appDataDir` | Obtenir le chemin du dossier app data |
| `window.setAlwaysOnTop` | Épingler une note par-dessus les fenêtres |
| `window.WebviewWindow` | Créer une fenêtre détachée pour une note (bonus) |

---

## Design Direction

### Layout principal
```
┌──────────────────────────────────────────┐
│  SIDEBAR (280px)  │     BOARD            │
│                   │                      │
│  🌙 SwiftNotes   │   [Post-it] [Post-it]│
│  [+ New Note]     │                      │
│                   │      [Post-it]       │
│  📝 Grocery List  │                      │
│  ⭐ Song Ideas    │         [Post-it]    │
│  💜 Monday Tasks  │                      │
│  🤍 Wishlist      │   [Post-it]          │
│  💛 Quotes        │                      │
│                   │                      │
│  ───────────────  │                      │
│  Era: 🌙 💖 🌿 🐍 │                      │
└──────────────────────────────────────────┘
         ┌──────────────────────┐
         │  TOOLBAR (floating)  │
         │  Shapes│Colors│✨│📌  │
         └──────────────────────┘
```

### Toolbar flottante (bas de l'écran)
- Section 1 : Formes (6 boutons icônes)
- Section 2 : Couleurs (5 dots)
- Section 3 : Toggle Glitter
- Section 4 : Pin to desktop, Always on top, Font

### Ambiance Midnights
- Background : ciel étoilé (particules blanches scintillantes)
- Lune en haut à droite (cercle avec glow subtil)
- Notes avec drop shadow profonde
- Glitter : particules dorées, bleues, violettes

---

## Antigravity Prompts

### Prompt 1 — Setup Tauri + Structure
```
Crée une application desktop avec Tauri v2 appelée "SwiftNotes" — une app de sticky notes personnalisables.

Setup :
1. Initialise un projet Tauri v2 avec un frontend vanilla (HTML/CSS/JS, pas de framework)
2. Configure tauri.conf.json :
   - Fenêtre principale : 1100x700, min 800x500, resizable, avec décorations
   - Permissions : filesystem (read/write dans $APPDATA), window (setAlwaysOnTop, create)
3. Crée la structure de base :
   - src/index.html (page principale)
   - src/styles/main.css
   - src/scripts/app.js
4. Le storage est un fichier JSON local dans le dossier AppData de l'app

Pas de backend, pas de cloud. Tout est local.
```

### Prompt 2 — Thème Midnights + Layout
```
Implémente le layout et le thème Midnights pour SwiftNotes :

Layout :
- Sidebar fixe à gauche (280px) : logo "🌙 SwiftNotes", bouton "+ New Note", liste des notes, sélecteur de thème en bas
- Board principal : zone libre où les post-its sont positionnés en absolu
- Toolbar flottante en bas au centre

Thème Midnights :
- Background : #0f1729 avec un effet de ciel étoilé (100 petits points blancs qui scintillent avec des animations CSS d'opacité variable, durées random entre 2-6s)
- Lune décorative en haut à droite (cercle gradient avec box-shadow glow)
- Surface : #1a2540, borders : #2a3a5c
- Texte : #e8ecf4 (moonlight)
- Accent : #f0c75e (star gold)
- Font : Quicksand pour l'UI, Caveat pour le contenu des notes

Importe les fonts Quicksand et Caveat (soit Google Fonts, soit embarquées en woff2).
```

### Prompt 3 — Système de Notes (CRUD + Storage)
```
Implémente le système de notes pour SwiftNotes :

Modèle de données (JSON local) :
{
  "settings": { "theme": "midnights", "defaultFont": "Caveat" },
  "notes": [{
    "id": "uuid",
    "title": "",
    "content": "",
    "shape": "square",       // square, rounded, heart, star, circle, cloud
    "color": "deep-blue",    // deep-blue, purple, dark-teal, midnight, gold
    "font": "Caveat",
    "glitter": true,
    "pinned": false,
    "alwaysOnTop": false,
    "position": { "x": 100, "y": 100 },
    "size": { "width": 220, "height": 220 },
    "rotation": 0,
    "createdAt": "ISO",
    "updatedAt": "ISO"
  }]
}

Fonctions :
1. loadNotes() — lit le fichier JSON via Tauri fs API, crée le fichier avec des données par défaut s'il n'existe pas
2. saveNotes() — écrit le fichier JSON (debounce 500ms pour éviter les écritures trop fréquentes)
3. createNote(options) — ajoute une note avec les paramètres sélectionnés dans la toolbar, position initiale random dans la zone visible
4. updateNote(id, changes) — met à jour une note et sauvegarde
5. deleteNote(id) — supprime une note (avec confirmation)
6. renderNotes() — affiche toutes les notes sur le board

Sidebar :
- Liste les notes avec icône de forme + titre + preview du contenu
- Clic sur une note = la met en focus (z-index max, scroll si nécessaire)
```

### Prompt 4 — Formes CSS
```
Implémente les 6 formes de post-its pour SwiftNotes :

Chaque note est un div positionné en absolu sur le board. La forme est appliquée via CSS (clip-path ou border-radius) sur un inner div.

Formes :
1. Carré (square) : border-radius 4px, 220x220px
2. Arrondi (rounded) : border-radius 20px, 220x200px
3. Cœur (heart) : clip-path SVG path, 220x200px. Le texte doit être centré avec du padding adapté
4. Étoile (star) : clip-path polygon 5 branches, 240x230px. Texte centré avec padding
5. Cercle (circle) : clip-path circle(50%), 200x200px. Texte centré
6. Nuage (cloud) : border-radius 100px, 260x180px. Texte centré

Couleurs Midnights (gradients subtils) :
- deep-blue : linear-gradient(135deg, #1a3260, #1e3a6e), texte #c4d4f0
- purple : linear-gradient(135deg, #2d2660, #3d2b7b), texte #d4c4f0
- dark-teal : linear-gradient(135deg, #1a4040, #1a5050), texte #b0e0e0
- midnight : linear-gradient(135deg, #141830, #1a2040), texte #a0b0d0
- gold : linear-gradient(135deg, #4a3a1a, #5a4a2a), texte #f0d89e

Chaque note a un drop-shadow et un léger effet de lift au hover.
Un "pin" décoratif (petit cercle doré) en haut au centre de certaines notes.
```

### Prompt 5 — Drag & Drop
```
Implémente le drag & drop des post-its sur le board :

1. Chaque note est draggable (mousedown → mousemove → mouseup)
2. Pendant le drag : cursor: grabbing, légère élévation (shadow plus forte), z-index au max
3. À la fin du drag : sauvegarder la nouvelle position dans le JSON
4. Contrainte : la note ne peut pas sortir du board (clamp x/y)
5. Au clic sur une note (sans drag) : la note passe en mode édition (contenteditable focus)
6. Différencier clic (< 5px mouvement) et drag (>= 5px)

Bonus : légère rotation random (-3 à +3 degrés) assignée à chaque note pour un look naturel.
```

### Prompt 6 — Effet Glitter / Sparkle
```
Implémente l'effet glitter pour les notes dans SwiftNotes :

1. Chaque note avec glitter=true a une couche overlay de particules
2. Générer 20-30 particules par note, positionnées en random
3. Chaque particule :
   - Petit cercle (1.5-3px)
   - Couleur random parmi : #a8c0f0 (bleu), #d4a8f0 (violet), #f0d4a8 (pêche), #f0c75e (or), #ffffff (blanc)
   - Animation CSS : apparition/disparition en boucle (opacity 0 → 0.9 → 0) avec scale
   - Durée random : 1-3s
   - Delay random : 0-3s
4. L'overlay a pointer-events: none pour ne pas bloquer l'édition
5. Toggle via la toolbar : bouton "✨ Glitter" on/off
6. Le toggle affecte la note actuellement sélectionnée

Performance : utiliser CSS animations uniquement (pas de JS animation frame). Limiter à 30 particules par note pour rester smooth.
```

### Prompt 7 — Toolbar + Polices
```
Implémente la toolbar flottante et le sélecteur de polices :

Toolbar (position: fixed, bottom: 24px, centered) :
- Section Formes : 6 boutons pour les formes (carré, arrondi, cœur, étoile, cercle, nuage). Le bouton actif correspond à la forme de la note sélectionnée. Cliquer change la forme de la note sélectionnée.
- Séparateur vertical
- Section Couleurs : 5 dots de couleur. Le dot actif = couleur de la note sélectionnée. Cliquer change la couleur.
- Séparateur
- Bouton Glitter toggle (✨)
- Séparateur
- Bouton Pin (📌) : toggle always-on-top pour la note sélectionnée
- Bouton Font (Aa) : ouvre un petit popup avec les 4 options de police

Polices disponibles :
1. Caveat (handwritten, défaut)
2. Quicksand (rounded, clean)
3. Patrick Hand (casual)
4. Satisfy (cursive)

Toutes les polices doivent être embarquées dans l'app (pas de dépendance à Google Fonts en runtime).

La toolbar n'apparaît / s'active que quand une note est sélectionnée.
```

### Prompt 8 — Always on Top (Tauri Window API)
```
Implémente la fonctionnalité "Always on Top" / "Pin to Desktop" :

Quand l'utilisateur clique le bouton Pin (📌) dans la toolbar :
1. La note sélectionnée est marquée pinned=true et alwaysOnTop=true
2. Utilise l'API Tauri window pour que la fenêtre principale reste au-dessus :
   - import { appWindow } from '@tauri-apps/api/window';
   - await appWindow.setAlwaysOnTop(true);
3. Un badge "📌 on top" apparaît sur la note

Note : dans Tauri, le "always on top" s'applique à la fenêtre entière, pas à une note individuelle. Pour un vrai comportement par-note, il faudrait créer une fenêtre Tauri séparée pour chaque note pinnée — c'est un bonus avancé.

Approche simple (MVP) : un toggle global "always on top" pour toute l'app.
Approche avancée (bonus) : créer une nouvelle WebviewWindow Tauri pour chaque note détachée.
```

### Prompt 9 — Thème Lover (bonus)
```
Ajoute le thème "Lover" à SwiftNotes :

Palette :
- Background : #fdf2f8 (rose très pâle)
- Surface : #ffffff
- Borders : #f9a8d4
- Text : #831843
- Accent : #ec4899 (pink)

Couleurs des notes :
- Rose pastel : linear-gradient(135deg, #fce7f3, #fbcfe8)
- Lavande : linear-gradient(135deg, #ede9fe, #ddd6fe)
- Bleu ciel : linear-gradient(135deg, #e0f2fe, #bae6fd)
- Pêche : linear-gradient(135deg, #fff7ed, #fed7aa)
- Mint : linear-gradient(135deg, #ecfdf5, #a7f3d0)

Effets :
- Background : pas d'étoiles, mais des petits cœurs qui flottent lentement (CSS animation)
- Glitter : particules roses, dorées, blanches
- Ambiance lumineuse et douce (pas de dark mode dans ce thème)

Le changement de thème doit switcher toutes les variables CSS et les couleurs des notes existantes s'adaptent au nouveau thème.
```

### Prompt 10 — Polish + Build
```
Polish final de SwiftNotes :

1. Animations :
   - Les notes apparaissent avec une animation (scale 0 → 1 + fade in)
   - Suppression : animation scale 1 → 0 + fade out avant de supprimer
   - Changement de forme : transition smooth

2. Raccourcis clavier :
   - Ctrl+N : nouvelle note
   - Delete/Backspace (sans focus texte) : supprimer la note sélectionnée
   - Ctrl+D : dupliquer la note
   - Escape : désélectionner

3. Context menu (clic droit sur une note) :
   - Edit, Duplicate, Pin to top, Delete
   - Sous-menu Shape, Color

4. Icône d'app : lune dorée 🌙 sur fond bleu nuit

5. System tray (bonus) : minimiser dans le tray, accès rapide pour créer une note

6. Build :
   - `npm run tauri build` pour créer l'installeur Windows (.msi) et Mac (.dmg)
   - Tester sur les deux OS
   - L'app pèse ~5-10MB

7. README avec screenshots pour le portfolio
```

---

## Plan de Dev (ordre des prompts)

```
Prompt 1  → Setup Tauri + Structure
Prompt 2  → Thème Midnights + Layout
Prompt 3  → Système de Notes (CRUD + Storage)
Prompt 4  → Formes CSS
Prompt 5  → Drag & Drop
Prompt 6  → Effet Glitter
Prompt 7  → Toolbar + Polices
Prompt 8  → Always on Top
Prompt 9  → Thème Lover (bonus)
Prompt 10 → Polish + Build
```

---

## Notes Importantes

### Tauri v2
- Tauri v2 utilise un système de permissions (capabilities) au lieu de l'allowlist v1
- Les imports sont depuis `@tauri-apps/api` (v2)
- La doc officielle : https://tauri.app/
- Prerequis : Rust installé + Node.js

### Performance
- CSS animations seulement pour le glitter (pas de requestAnimationFrame)
- Limiter les particules de glitter à ~30 par note
- Le fichier JSON local est léger, pas de problème de performance
- Les étoiles du background : 100 particules max

### Portfolio
- Ce projet montre : desktop app development, CSS avancé, animations, Tauri/Rust, attention au design
- C'est unique — personne a un "Taylor Swift sticky notes app" dans son portfolio
- Screenshots recommandés : thème Midnights avec les différentes formes + glitter
