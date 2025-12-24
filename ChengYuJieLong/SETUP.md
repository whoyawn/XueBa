# Setup Instructions

## Prerequisites

- Node.js 18+ and npm
- TypeScript

## Installation

1. Install dependencies:
```bash
npm install
```

2. Download the CC-CEDICT dictionary:
```bash
# Download from MDBG
curl -o dictionary_data/cedict_1_0_ts_utf-8_mdbg.txt https://www.mdbg.net/chinese/export/cedict/cedict_1_0_ts_utf-8_mdbg.txt.gz
gunzip dictionary_data/cedict_1_0_ts_utf-8_mdbg.txt.gz
```

Or download manually from https://www.mdbg.net/chinese/dictionary/cedict/ and place it in `dictionary_data/cedict_1_0_ts_utf-8_mdbg.txt`

3. Parse the dictionary:
```bash
npm run parse
```

This will create `public/dictionary.json` from the CC-CEDICT dictionary file.

## Development

Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## Build

Build for production:
```bash
npm run build
```

Preview the production build:
```bash
npm run preview
```

## Usage

1. Enter a 4-character 成语 in the input field
2. Click "Go" or press Enter
3. Explore valid next 成语 by clicking on them
4. Use the strictness toggle to change matching rules:
   - **Level 1**: Toneless pinyin match (e.g., `da` matches `da`)
   - **Level 2**: Pinyin with tone match (e.g., `da4` matches `da4`)
   - **Level 3**: Same character match (e.g., `图` matches `图`)
5. Use the "Back" button to return to the previous 成语

