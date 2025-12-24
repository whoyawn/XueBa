#!/usr/bin/env ts-node

/**
 * Parser for CC-CEDICT dictionary format
 * Extracts 4-character 成语 and builds lookup maps
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface Chengyu {
  text: string;
  chars: string[];
  pinyin: string[];
  pinyinNoTone: string[];
}

interface DictionaryMaps {
  chengyuList: Chengyu[];
  tonelessMap: Record<string, Chengyu[]>;
  pinyinMap: Record<string, Chengyu[]>;
  charMap: Record<string, Chengyu[]>;
}

/**
 * Remove tone marks from pinyin
 * Converts: yi1 → yi, dà → da, zhǎn → zhan, etc.
 */
function removeTone(pinyin: string): string {
  // Remove tone numbers (1-5) - CC-CEDICT uses numbers for tones
  return pinyin.replace(/[1-5]/g, '').toLowerCase();
}

/**
 * Parse a single dictionary line
 * Format: Traditional Simplified [pinyin] /definition/
 */
function parseLine(line: string): Chengyu | null {
  // Skip comments and empty lines
  if (line.startsWith('#') || line.startsWith('%') || !line.trim()) {
    return null;
  }

  // Match: Traditional Simplified [pinyin] /definition/
  const match = line.match(/^(.+?)\s+(.+?)\s+\[(.+?)\]\s+\//);
  if (!match) {
    return null;
  }

  const [, traditional, simplified, pinyinStr] = match;

  // Only process 4-character entries
  if (traditional.length !== 4 || simplified.length !== 4) {
    return null;
  }

  // Parse pinyin (space-separated syllables)
  const pinyin = pinyinStr.split(/\s+/).filter(p => p.length > 0);
  
  // Must have exactly 4 pinyin syllables
  if (pinyin.length !== 4) {
    return null;
  }

  // Convert to toneless pinyin
  const pinyinNoTone = pinyin.map(removeTone);

  // Split simplified into characters
  const chars = simplified.split('');

  return {
    text: simplified,
    chars,
    pinyin,
    pinyinNoTone,
  };
}

/**
 * Build lookup maps from Chengyu list
 */
function buildMaps(chengyuList: Chengyu[]): DictionaryMaps {
  const tonelessMap: Record<string, Chengyu[]> = {};
  const pinyinMap: Record<string, Chengyu[]> = {};
  const charMap: Record<string, Chengyu[]> = {};

  for (const chengyu of chengyuList) {
    // Map by first character's toneless pinyin (for level 1)
    const firstToneless = chengyu.pinyinNoTone[0];
    if (!tonelessMap[firstToneless]) {
      tonelessMap[firstToneless] = [];
    }
    tonelessMap[firstToneless].push(chengyu);

    // Map by first character's pinyin with tone (for level 2)
    const firstPinyin = chengyu.pinyin[0];
    if (!pinyinMap[firstPinyin]) {
      pinyinMap[firstPinyin] = [];
    }
    pinyinMap[firstPinyin].push(chengyu);

    // Map by first character (for level 3)
    const firstChar = chengyu.chars[0];
    if (!charMap[firstChar]) {
      charMap[firstChar] = [];
    }
    charMap[firstChar].push(chengyu);
  }

  return {
    chengyuList,
    tonelessMap,
    pinyinMap,
    charMap,
  };
}

/**
 * Main parsing function
 */
function parseDictionary(inputPath: string, outputPath: string): void {
  console.log(`📖 Reading dictionary from: ${inputPath}`);
  const content = fs.readFileSync(inputPath, 'utf-8');
  const lines = content.split('\n');

  console.log(`📝 Processing ${lines.length} lines...`);
  
  const chengyuList: Chengyu[] = [];
  let processed = 0;
  let skipped = 0;

  for (const line of lines) {
    const chengyu = parseLine(line);
    if (chengyu) {
      chengyuList.push(chengyu);
      processed++;
    } else {
      skipped++;
    }
  }

  console.log(`✅ Found ${processed} 4-character 成语`);
  console.log(`⏭️  Skipped ${skipped} entries`);

  console.log(`🔨 Building lookup maps...`);
  const maps = buildMaps(chengyuList);

  console.log(`💾 Writing to: ${outputPath}`);
  fs.writeFileSync(outputPath, JSON.stringify(maps, null, 2), 'utf-8');

  console.log(`\n📊 Summary:`);
  console.log(`   Total 成语: ${maps.chengyuList.length}`);
  console.log(`   Toneless pinyin keys: ${Object.keys(maps.tonelessMap).length}`);
  console.log(`   Pinyin keys: ${Object.keys(maps.pinyinMap).length}`);
  console.log(`   Character keys: ${Object.keys(maps.charMap).length}`);
  console.log(`\n✨ Done!`);
}

// Run the parser (this file is meant to be executed directly)
// When compiled, __dirname points to dist/, so we need to go up one level to the project root
const projectRoot = __dirname.endsWith('/dist') ? path.dirname(__dirname) : __dirname;
const inputPath = path.join(projectRoot, 'dictionary_data', 'cedict_1_0_ts_utf-8_mdbg.txt');
const outputPath = path.join(projectRoot, 'public', 'dictionary.json');

// Ensure output directory exists
const outputDir = path.dirname(outputPath);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

parseDictionary(inputPath, outputPath);

export { parseDictionary, parseLine, removeTone, buildMaps };
export type { Chengyu, DictionaryMaps };

