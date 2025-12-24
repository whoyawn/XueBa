# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**成语接龙 Explorer** is a web-based Chinese learning prototype that allows users to explore 成语 (chengyu, Chinese four-character idioms) through an interactive tree interface. The app helps learners understand 成语接龙 (idiom chain game) patterns using different strictness levels for matching.

## Development Commands

### Setup
```bash
npm install              # Install dependencies
npm run parse           # Parse CC-CEDICT dictionary → public/dictionary.json
```

### Development
```bash
npm run dev             # Start dev server at http://localhost:3000
npm run build           # Build for production (TypeScript compile + Vite build)
npm run preview         # Preview production build
```

### Dictionary Parsing
The dictionary parser must be run before first use:
- Reads from: `dictionary_data/cedict_1_0_ts_utf-8_mdbg.txt`
- Outputs to: `public/dictionary.json`
- Extracts only 4-character 成语 from CC-CEDICT format
- Pre-computes lookup maps for all three strictness levels

## Core Architecture

### Data Flow

1. **Dictionary Loading** (`src/dictionary.ts`)
   - Fetches precomputed `public/dictionary.json` on app startup
   - JSON contains chengyuList + three lookup maps (toneless, pinyin, character)
   - Singleton pattern: loads once and caches

2. **State Management** (`src/App.tsx`)
   - Single-level history: `currentChengyu` + `previousChengyu`
   - Back button only goes one step back (no full navigation stack)
   - Strictness level (1-3) triggers recomputation of next valid 成语

3. **Tree Generation**
   - Next valid 成语 computed by matching **last character** of current to **first character** of candidates
   - Lookup maps enable O(1) retrieval per strictness level
   - Graph rendered using ReactFlow library

### Strictness Levels

| Level | Match Type       | Example                          |
|-------|------------------|----------------------------------|
| 1     | Toneless pinyin  | `tu` matches `tu`               |
| 2     | Pinyin with tone | `tu2` matches `tu2`             |
| 3     | Same character   | `图` matches `图`                |

### Key Data Structures

```typescript
interface Chengyu {
  text: string;              // "大展宏图"
  chars: string[];           // ["大", "展", "宏", "图"]
  pinyin: string[];          // ["da4", "zhan3", "hong2", "tu2"]
  pinyinNoTone: string[];    // ["da", "zhan", "hong", "tu"]
}

interface DictionaryMaps {
  chengyuList: Chengyu[];
  tonelessMap: Record<string, Chengyu[]>;  // Maps first toneless pinyin → 成语 list
  pinyinMap: Record<string, Chengyu[]>;    // Maps first pinyin → 成语 list
  charMap: Record<string, Chengyu[]>;      // Maps first character → 成语 list
}
```

### File Structure

- `parse-dictionary.ts` — Standalone script that parses CC-CEDICT and builds lookup maps
- `src/types.ts` — TypeScript interfaces shared across components
- `src/dictionary.ts` — Dictionary loading and lookup logic (getNextChengyus)
- `src/App.tsx` — Main React component with ReactFlow visualization
- `src/main.tsx` — React entry point
- `tailwind.config.js` — Custom colors: primary (#667eea), secondary (#764ba2)

## Important Implementation Details

### Dictionary Parser Logic
- Maps are built by **first character** of each 成语 (not last)
- When computing next 成语, we lookup using **last character** of current 成语
- This allows efficient retrieval: get last char → lookup in map → return candidates

### Force Graph Visualization
- Uses React Force Graph 2D for physics-based animated layout
- Nodes float and settle organically with D3 force simulation
- Center node (current chengyu) is larger and styled differently
- Child nodes arranged around center with force-directed physics
- Custom canvas rendering for rounded card-style nodes with shadows
- Animated connecting lines with directional particles showing flow

### Graph Data Structure
```typescript
interface GraphNode {
  id: string;
  chengyu: Chengyu;
  isCenter?: boolean;
}

interface GraphLink {
  source: string;
  target: string;
}
```

### State Updates
- Changing strictness immediately recomputes graph (via useEffect)
- Navigation preserves single-step history (current becomes previous)
- Graph regenerates when current chengyu changes
- Input validation: checks if entered text exists in dictionary

### Custom Canvas Rendering
- Center node: 48px bold text, purple border, larger card
- Child nodes: 24px text, gray border, smaller cards
- Rounded corners with shadow effects using Canvas API
- Pinyin displayed below chengyu characters
- Hover tooltips show full chengyu + pinyin

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build**: Vite 4
- **Styling**: Tailwind CSS 3
- **Visualization**: React Force Graph 2D (physics-based force-directed graph)
- **Physics Engine**: D3-force (included with react-force-graph-2d)
- **Dictionary**: CC-CEDICT (Chinese-English dictionary, MDBG format)

## Path Aliases

`@/` → `./src/` (configured in vite.config.ts)
