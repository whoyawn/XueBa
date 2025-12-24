import type { Chengyu, DictionaryMaps, StrictnessLevel } from './types';

let dictionary: DictionaryMaps | null = null;

/**
 * Load dictionary from JSON file
 */
export async function loadDictionary(): Promise<DictionaryMaps> {
  if (dictionary) {
    return dictionary;
  }

  const response = await fetch('/dictionary.json');
  if (!response.ok) {
    throw new Error(`Failed to load dictionary: ${response.statusText}`);
  }

  const data = (await response.json()) as DictionaryMaps;
  dictionary = data;
  return data;
}

/**
 * Find a Chengyu by text
 */
export function findChengyu(
  maps: DictionaryMaps,
  text: string
): Chengyu | null {
  return maps.chengyuList.find((c) => c.text === text) || null;
}

/**
 * Get next valid Chengyu based on strictness level
 */
export function getNextChengyus(
  maps: DictionaryMaps,
  current: Chengyu,
  strictness: StrictnessLevel
): Chengyu[] {
  const lastIndex = 3; // Last character index

  switch (strictness) {
    case 1: {
      // Toneless pinyin match
      const lastToneless = current.pinyinNoTone[lastIndex];
      return maps.tonelessMap[lastToneless] || [];
    }
    case 2: {
      // Pinyin with tone match
      const lastPinyin = current.pinyin[lastIndex];
      return maps.pinyinMap[lastPinyin] || [];
    }
    case 3: {
      // Same character match
      const lastChar = current.chars[lastIndex];
      return maps.charMap[lastChar] || [];
    }
    default:
      return [];
  }
}

